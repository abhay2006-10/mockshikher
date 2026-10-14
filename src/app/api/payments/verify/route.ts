import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { POPULAR_EXAMS } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, examId, isMock, amount } = body;

    // Resolve exam from database or fallback to static
    let dbExam = null;
    if (examId) {
      dbExam = await prisma.exam.findFirst({
        where: {
          OR: [{ id: examId }, { slug: examId }],
        },
      });
    }

    const fallbackExam = POPULAR_EXAMS.find((e) => e.id === examId || e.slug === examId) || POPULAR_EXAMS[0];
    const targetExamId = dbExam?.id || fallbackExam.id;
    const targetExamName = dbExam?.name || fallbackExam.name;
    const paidAmount = Number(amount) || dbExam?.price || fallbackExam.price || 149;
    const paymentId = razorpay_payment_id || `mock_pay_${Date.now()}`;
    const orderId = razorpay_order_id || `order_mock_${Date.now()}`;

    // Verify signature if not in mock demo mode
    if (!isMock && process.env.RAZORPAY_KEY_SECRET) {
      const isValid = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature: razorpay_signature,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: 'Payment signature verification failed' },
          { status: 400 }
        );
      }
    }

    // If student is authenticated, securely store Payment and Purchase records in DB
    let recordedPaymentId = paymentId;
    if (session?.user) {
      let userId = session.user.id;
      if (!userId && session.user.email) {
        const u = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        if (u) userId = u.id;
      }

      if (userId && dbExam) {
        // Record verified Payment
        const paymentRecord = await prisma.payment.upsert({
          where: { gatewayOrderId: orderId },
          create: {
            userId,
            amount: paidAmount,
            currency: 'INR',
            gatewayOrderId: orderId,
            gatewayPaymentId: paymentId,
            gatewaySignature: razorpay_signature || null,
            status: 'PAID',
            isTestMode: !!isMock,
          },
          update: {
            status: 'PAID',
            gatewayPaymentId: paymentId,
            gatewaySignature: razorpay_signature || null,
          },
        });

        // Record Purchase unlocking the full test series
        await prisma.purchase.upsert({
          where: {
            userId_examId: {
              userId,
              examId: dbExam.id,
            },
          },
          create: {
            userId,
            examId: dbExam.id,
            paymentId: paymentRecord.id,
            isTestMode: !!isMock,
          },
          update: {
            paymentId: paymentRecord.id,
          },
        });

        recordedPaymentId = paymentRecord.gatewayPaymentId || paymentRecord.id;

        // If promo code was applied, increment its usage counter
        if (body.promoCode) {
          await prisma.promoCode.update({
            where: { code: String(body.promoCode).trim().toUpperCase() },
            data: { usedCount: { increment: 1 } },
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment verified successfully. Full test series for ${targetExamName} is now unlocked!`,
      examId: targetExamId,
      paymentId: recordedPaymentId,
    });
  } catch (error: unknown) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
