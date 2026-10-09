import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { POPULAR_EXAMS } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const { examId } = await req.json();

    const exam = POPULAR_EXAMS.find((e) => e.id === examId) || POPULAR_EXAMS[0];
    const amountInPaise = Math.round(exam.price * 100);

    // If Razorpay live/test credentials are configured, create real order
    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${exam.id}_${Date.now()}`,
        notes: {
          examId: exam.id,
          examName: exam.name,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      });
    }

    // In local development / mock demo mode without active credentials:
    return NextResponse.json({
      orderId: `order_mock_${Date.now()}`,
      amount: amountInPaise,
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
