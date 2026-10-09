import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import prisma from '@/lib/prisma';
import { POPULAR_EXAMS } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, examId, isMock } =
      await req.json();

    const exam = POPULAR_EXAMS.find((e) => e.id === examId) || POPULAR_EXAMS[0];

    // Verify signature if not in mock demo mode
    if (!isMock && process.env.RAZORPAY_KEY_SECRET) {
      const isValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: 'Payment signature verification failed' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully. Full test series is now unlocked!',
      examId: exam.id,
      paymentId: razorpay_payment_id || `mock_pay_${Date.now()}`,
    });
  } catch (error: unknown) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
