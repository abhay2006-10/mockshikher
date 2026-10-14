import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import prisma from '@/lib/prisma';
import { POPULAR_EXAMS } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const { examId, promoCode } = await req.json();

    // Standard baseline price for all eligible exam test series is ₹200
    let basePrice = 200;
    let appliedDiscount = 0;
    let validPromoCode: string | null = null;

    // Resolve exam from database or fallback to mock-data
    let examName = 'HP Patwari Examination';
    if (examId) {
      const dbExam = await prisma.exam.findFirst({
        where: {
          OR: [{ id: examId }, { slug: examId }],
        },
      });
      if (dbExam) {
        examName = dbExam.name;
      } else {
        const fallbackExam = POPULAR_EXAMS.find((e) => e.id === examId || e.slug === examId);
        if (fallbackExam) examName = fallbackExam.name;
      }
    }

    // Validate promo code strictly server-side
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

    const finalAmount = Math.max(1, basePrice - appliedDiscount);
    const amountInPaise = Math.round(finalAmount * 100);

    // If Razorpay live/test credentials are configured, create real order
    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${examId || 'series'}_${Date.now()}`,
        notes: {
          examId: examId || 'exam-hp-patwari',
          examName,
          basePrice: String(basePrice),
          appliedDiscount: String(appliedDiscount),
          promoCode: validPromoCode || 'NONE',
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        finalPrice: finalAmount,
        discount: appliedDiscount,
        promoCode: validPromoCode,
        currency: order.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      });
    }

    // In local development / mock demo mode without active credentials:
    return NextResponse.json({
      orderId: `order_mock_${Date.now()}`,
      amount: amountInPaise,
      finalPrice: finalAmount,
      discount: appliedDiscount,
      promoCode: validPromoCode,
      currency: 'INR',
      key: 'rzp_test_mock_mode',
      isMock: true,
      message: 'Running in simulated payment test mode',
    });
  } catch (error: unknown) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
