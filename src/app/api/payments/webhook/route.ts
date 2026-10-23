import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // 1. In production, webhook secret is required
    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      console.error('Razorpay webhook secret not configured in production environment.');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // 2. Validate HMAC signature against exact raw request body
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 400 });
      }
      const isValid = verifyRazorpayWebhookSignature({ rawBody, signature });
      if (!isValid) {
        console.error('Razorpay webhook signature verification failed.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    // 3. Parse JSON event payload
    const eventData = JSON.parse(rawBody || '{}');
    const event = eventData.event;

    // 4. Handle payment.failed event safely and idempotently
    if (event === 'payment.failed') {
      const paymentEntity = eventData.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        // Do not overwrite an already PAID payment record
        await prisma.payment.updateMany({
          where: {
            gatewayOrderId: orderId,
            status: { not: 'PAID' },
          },
          data: {
            status: 'FAILED',
            gatewayPaymentId: paymentId,
            gatewayResponse: eventData,
          },
        }).catch(() => {});
        console.log(`Updated payment status to FAILED for order ${orderId}`);
      }
      return NextResponse.json({ status: 'ok', event: 'payment.failed recorded' });
    }

    // 5. Process payment.captured or order.paid events
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = eventData.payload?.payment?.entity;
      const orderEntity = eventData.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;
      const currency = paymentEntity?.currency || orderEntity?.currency || 'INR';
      const status = paymentEntity?.status;

      // Currency validation: Must be INR
      if (currency !== 'INR') {
        console.error(`Rejected webhook with unsupported currency: ${currency}`);
        return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
      }

      // Final status validation for payment.captured: status must be captured
      if (event === 'payment.captured' && status && status !== 'captured') {
        console.error(`Payment not in captured state: ${status}`);
        return NextResponse.json({ error: 'Payment not captured' }, { status: 400 });
      }

      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId in payload' }, { status: 400 });
      }

      const notes = orderEntity?.notes || paymentEntity?.notes || {};
      const examId = notes.examId || notes.examSlug;
      const noteUserId = notes.userId;

      // Check existing payment record
      const existingPayment = await prisma.payment.findUnique({
        where: { gatewayOrderId: orderId },
        include: { purchase: true },
      });

      // Idempotency: If payment is already marked PAID and purchase exists, do not duplicate
      if (existingPayment?.status === 'PAID' && existingPayment.purchase) {
        return NextResponse.json({ status: 'ok', message: 'Order already reconciled and unlocked' });
      }

      const targetUserId = existingPayment?.userId || noteUserId;

      if (targetUserId && examId) {
        const dbExam = await prisma.exam.findFirst({
          where: {
            OR: [{ id: examId }, { slug: examId }],
          },
        });

        if (dbExam) {
          const amountInRupees = paymentEntity?.amount
            ? paymentEntity.amount / 100
            : existingPayment?.amount || ((dbExam.price === 199 || !dbExam.price) ? 149 : dbExam.price);

          await prisma.$transaction(async (tx) => {
            const updatedPayment = await tx.payment.upsert({
              where: { gatewayOrderId: orderId },
              create: {
                userId: targetUserId,
                amount: amountInRupees,
                currency: 'INR',
                gatewayOrderId: orderId,
                gatewayPaymentId: paymentId,
                status: 'PAID',
                gatewayResponse: eventData,
              },
              update: {
                status: 'PAID',
                gatewayPaymentId: paymentId || existingPayment?.gatewayPaymentId,
                gatewayResponse: eventData,
              },
            });

            await tx.purchase.upsert({
              where: {
                userId_examId: {
                  userId: targetUserId,
                  examId: dbExam.id,
                },
              },
              create: {
                userId: targetUserId,
                examId: dbExam.id,
                paymentId: updatedPayment.id,
              },
              update: {
                paymentId: updatedPayment.id,
              },
            });
          });

          console.log(`Reconciled payment ${orderId} via webhook for user ${targetUserId}`);
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('Error handling Razorpay webhook safely:', err);
    return NextResponse.json({ error: 'Webhook processing failed safely' }, { status: 500 });
  }
}
