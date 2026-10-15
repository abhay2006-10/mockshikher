import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature, isRazorpayTestMode } from '@/lib/razorpay';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Require student authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to verify your payment.' },
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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      examId,
      isMock,
      status: reportedStatus,
      failureReason,
    } = body;

    // 3. Handle explicit failure reporting from checkout modal dismissal or decline
    if (reportedStatus === 'FAILED') {
      if (razorpay_order_id) {
        await prisma.payment.updateMany({
          where: { gatewayOrderId: razorpay_order_id, userId },
          data: {
            status: 'FAILED',
            gatewayPaymentId: razorpay_payment_id || null,
            gatewayResponse: { failureReason: failureReason || 'Transaction cancelled or failed at checkout' },
          },
        }).catch(() => {});
      }
      return NextResponse.json({
        success: false,
        error: failureReason || 'Payment failed',
        status: 'FAILED',
      });
    }

    // 4. Validate order ID presence
    if (!razorpay_order_id) {
      return NextResponse.json(
        { error: 'Razorpay order ID is required for verification.' },
        { status: 400 }
      );
    }

    // 5. Look up the server-initialized Payment record
    const existingPayment = await prisma.payment.findUnique({
      where: { gatewayOrderId: razorpay_order_id },
      include: { purchase: true },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Order not found. Orders must be created on the server before verification.' },
        { status: 404 }
      );
    }

    // 6. Security Check: Confirm the order strictly belongs to the authenticated user (prevent order/user mismatch)
    if (existingPayment.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Order does not belong to the authenticated account.' },
        { status: 403 }
      );
    }

    // 7. Resolve and validate the target Exam
    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID or slug is required for access verification.' },
        { status: 400 }
      );
    }

    const dbExam = await prisma.exam.findFirst({
      where: {
        OR: [{ id: examId }, { slug: examId }],
        isArchived: false,
      },
    });

    if (!dbExam) {
      return NextResponse.json(
        { error: 'Associated exam not found in database.' },
        { status: 404 }
      );
    }

    // 8. Idempotency Check: If order is already PAID and unlocked, return idempotent success
    if (existingPayment.status === 'PAID' && existingPayment.purchase) {
      return NextResponse.json({
        success: true,
        isUnlocked: true,
        alreadyProcessed: true,
        message: `Payment already verified. Test series for ${dbExam.name} is unlocked.`,
        examId: dbExam.id,
        examSlug: dbExam.slug,
        paymentId: existingPayment.gatewayPaymentId || existingPayment.id,
      });
    }

    const hasRazorpaySecret = !!process.env.RAZORPAY_KEY_SECRET;
    const isTestMode = isRazorpayTestMode() || existingPayment.isTestMode;

    // 9. Strict Cryptographic Signature Verification
    if (hasRazorpaySecret) {
      // In any mode with Razorpay credentials, signature and payment ID are strictly required
      if (!razorpay_signature || !razorpay_payment_id) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'FAILED',
            gatewayResponse: { reason: 'Missing signature or payment ID parameters' },
          },
        }).catch(() => {});

        return NextResponse.json(
          { error: 'Payment signature and payment ID are strictly required for verification.' },
          { status: 400 }
        );
      }

      const isValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!isValid) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'FAILED',
            gatewayPaymentId: razorpay_payment_id,
            gatewayResponse: { reason: 'Cryptographic HMAC signature mismatch' },
          },
        }).catch(() => {});

        return NextResponse.json(
          { error: 'Payment signature verification failed. Untrusted payment details.' },
          { status: 400 }
        );
      }
    } else {
      // In production, missing credentials is an error
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Payment gateway configuration missing in production environment' },
          { status: 500 }
        );
      }
      // In local dev without credentials, strictly require explicit isMock flag and payment ID
      if (!isMock || !razorpay_payment_id) {
        return NextResponse.json(
          { error: 'Payment signature and verification parameters are required.' },
          { status: 400 }
        );
      }
    }

    // 10. Atomic Database Transaction: Update Payment to PAID and grant Purchase access
    const verifiedPaymentId = razorpay_payment_id || `pay_mock_${Date.now()}`;
    const { paymentRecord, isNewPurchase } = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: 'PAID',
          gatewayPaymentId: verifiedPaymentId,
          gatewaySignature: razorpay_signature || null,
          isTestMode,
        },
      });

      const existingPurchase = await tx.purchase.findUnique({
        where: {
          userId_examId: {
            userId,
            examId: dbExam.id,
          },
        },
      });

      await tx.purchase.upsert({
        where: {
          userId_examId: {
            userId,
            examId: dbExam.id,
          },
        },
        create: {
          userId,
          examId: dbExam.id,
          paymentId: payment.id,
          isTestMode,
        },
        update: {
          paymentId: payment.id,
          isTestMode,
        },
      });

      return { paymentRecord: payment, isNewPurchase: !existingPurchase };
    });

    // 11. If promo code was applied on a new purchase, increment its usage count
    if (body.promoCode && isNewPurchase) {
      await prisma.promoCode.update({
        where: { code: String(body.promoCode).trim().toUpperCase() },
        data: { usedCount: { increment: 1 } },
      }).catch(() => {});
    }

    // 12. Return verified access confirmation
    return NextResponse.json({
      success: true,
      isUnlocked: true,
      message: `Payment verified successfully. Full test series for ${dbExam.name} is unlocked!`,
      examId: dbExam.id,
      examSlug: dbExam.slug,
      paymentId: paymentRecord.gatewayPaymentId || paymentRecord.id,
      isTestMode,
    });
  } catch (error: unknown) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Payment verification failed safely' },
      { status: 500 }
    );
  }
}
