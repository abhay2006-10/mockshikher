import { NextRequest, NextResponse } from 'next/server';
import { razorpay, isRazorpayTestMode } from '@/lib/razorpay';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Require student authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to unlock mock test series.' },
        { status: 401 }
      );
    }

    const sessionUserId = session.user.id;
    const sessionEmail = session.user.email ? session.user.email.toLowerCase().trim() : null;
    const sessionRole = (session.user as any)?.role;

    // Verify user exists in database (handle ID, email, or role resolution)
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(sessionUserId ? [{ id: sessionUserId }] : []),
          ...(sessionEmail ? [{ email: sessionEmail }] : []),
        ],
      },
    });

    // Resilient fallback for admin accounts whose JWT was issued under previous seed
    if (!dbUser && sessionRole === 'ADMIN') {
      dbUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User account not found. Please sign in again.' },
        { status: 401 }
      );
    }

    const userId = dbUser.id;

    // 2. Parse request payload
    const body = await req.json().catch(() => ({}));
    const { examId, promoCode } = body;

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID or slug is required' },
        { status: 400 }
      );
    }

    // 3. Resolve exam from trusted database pricing (NEVER trust client-supplied amount or price)
    const dbExam = await prisma.exam.findFirst({
      where: {
        OR: [{ id: examId }, { slug: examId }],
        isArchived: false,
      },
    });

    if (!dbExam) {
      return NextResponse.json(
        { error: 'Requested exam not found or unavailable' },
        { status: 404 }
      );
    }

    const basePrice = Math.max(1, Number(dbExam.price) || 199);

    // 4. Duplicate protection: Prevent re-purchasing an already unlocked exam
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_examId: {
          userId,
          examId: dbExam.id,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        {
          error: 'You already own this test series. All mock tests are unlocked for your account.',
          alreadyPurchased: true,
        },
        { status: 400 }
      );
    }

    // 5. Server-side promo code validation & discount calculation
    let appliedDiscount = 0;
    let validPromoCode: string | null = null;

    if (promoCode) {
      const cleanCode = String(promoCode).trim().toUpperCase();
      const promo = await prisma.promoCode.findUnique({
        where: { code: cleanCode },
      });

      if (
        promo &&
        promo.isActive &&
        (!promo.expiresAt || new Date(promo.expiresAt) > new Date()) &&
        (promo.maxUses === null || promo.usedCount < promo.maxUses)
      ) {
        appliedDiscount = Math.min(basePrice, promo.discount);
        validPromoCode = promo.code;
      }
    }

    // 6. Currency and paise calculations (1 INR = 100 paise; reject amounts < 100 paise)
    const finalAmount = Math.max(1, basePrice - appliedDiscount);
    const amountInPaise = Math.round(finalAmount * 100);

    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: 'Payable amount must be at least ₹1 (100 paise)' },
        { status: 400 }
      );
    }

    const isTest = isRazorpayTestMode();

    // 7. If Razorpay live/test credentials are configured, create order on Razorpay
    if (razorpay) {
      const sanitizedReceipt = `rcpt_${dbExam.slug.slice(0, 10)}_${Date.now()}`.slice(0, 40);
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: sanitizedReceipt,
        notes: {
          userId,
          examId: dbExam.id,
          examSlug: dbExam.slug,
          examName: dbExam.name,
          basePrice: String(basePrice),
          appliedDiscount: String(appliedDiscount),
          promoCode: validPromoCode || 'NONE',
        },
      });

      // Persist initial Payment record in CREATED state associated with userId and dbExam
      await prisma.payment.upsert({
        where: { gatewayOrderId: order.id },
        create: {
          userId,
          amount: finalAmount,
          currency: 'INR',
          gatewayOrderId: order.id,
          status: 'CREATED',
          isTestMode: isTest,
        },
        update: {
          amount: finalAmount,
          status: 'CREATED',
          isTestMode: isTest,
        },
      });

      // Return only the public Key ID to the browser (never the Secret)
      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        finalPrice: finalAmount,
        discount: appliedDiscount,
        promoCode: validPromoCode,
        currency: order.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
        isTestMode: isTest,
      });
    }

    // 8. In local development / mock demo mode when gateway keys are not yet configured
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Payment gateway configuration missing in production environment' },
        { status: 500 }
      );
    }

    const mockOrderId = `order_mock_${Date.now()}`;
    await prisma.payment.upsert({
      where: { gatewayOrderId: mockOrderId },
      create: {
        userId,
        amount: finalAmount,
        currency: 'INR',
        gatewayOrderId: mockOrderId,
        status: 'CREATED',
        isTestMode: true,
      },
      update: {
        amount: finalAmount,
        status: 'CREATED',
        isTestMode: true,
      },
    });

    return NextResponse.json({
      orderId: mockOrderId,
      amount: amountInPaise,
      finalPrice: finalAmount,
      discount: appliedDiscount,
      promoCode: validPromoCode,
      currency: 'INR',
      key: 'rzp_test_mock_mode',
      isMock: true,
      isTestMode: true,
      message: 'Running in simulated payment test mode',
    });
  } catch (error: unknown) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order safely' },
      { status: 500 }
    );
  }
}
