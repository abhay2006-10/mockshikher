import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body.order_id || body.razorpay_order_id;
    const paymentId = body.payment_id || body.razorpay_payment_id;
    const signature = body.signature || body.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, payment_id, and signature are required' },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment signature verified successfully',
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (error: any) {
    console.error('Error verifying standard payment signature:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to verify payment signature' },
      { status: 500 }
    );
  }
}
