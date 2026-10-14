import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve user ID
    let userId = session.user.id;
    if (!userId && session.user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch verified payments belonging to this student
    const payments = await prisma.payment.findMany({
      where: {
        userId,
        status: 'PAID',
      },
      include: {
        purchase: {
          include: {
            exam: {
              include: {
                _count: {
                  select: { mockTests: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const paymentHistory = payments.map((p) => {
      const exam = p.purchase?.exam;
      const mockCount = exam?._count?.mockTests || 10;

      return {
        id: p.id,
        transactionId: p.gatewayPaymentId || p.id,
        orderId: p.gatewayOrderId,
        amount: p.amount,
        currency: p.currency || 'INR',
        status: p.status, // 'PAID'
        date: p.createdAt.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        rawDate: p.createdAt.toISOString(),
        examName: exam?.name || 'Full Test Series',
        examSlug: exam?.slug || 'hp-patwari',
        mockCount,
      };
    });

    return NextResponse.json({ payments: paymentHistory });
  } catch (err: any) {
    console.error('Error fetching student payment history:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
