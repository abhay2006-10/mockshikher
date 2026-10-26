import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authRes = await requireAdmin();
    if (authRes instanceof NextResponse) return authRes;

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'attempted' | 'purchased' | 'inactive'
    const sortBy = searchParams.get('sortBy') || 'newest'; // 'newest' | 'oldest' | 'most_purchases' | 'most_attempts'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    // Filter students: exclude ADMIN accounts
    const whereClause: Record<string, unknown> = {
      role: { not: 'ADMIN' },
    };

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { purchases: { some: { exam: { name: { contains: q, mode: 'insensitive' } } } } },
        { payments: { some: { gatewayPaymentId: { contains: q, mode: 'insensitive' } } } },
        { payments: { some: { gatewayOrderId: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    if (filter === 'attempted') {
      whereClause.attempts = { some: {} };
    } else if (filter === 'purchased') {
      whereClause.purchases = { some: {} };
    } else if (filter === 'inactive') {
      whereClause.attempts = { none: {} };
      whereClause.purchases = { none: {} };
    }

    // Determine Prisma orderBy
    let orderByClause: Record<string, unknown> = { createdAt: 'desc' };
    if (sortBy === 'oldest') {
      orderByClause = { createdAt: 'asc' };
    } else if (sortBy === 'most_purchases') {
      orderByClause = { purchases: { _count: 'desc' } };
    } else if (sortBy === 'most_attempts') {
      orderByClause = { attempts: { _count: 'desc' } };
    } else {
      orderByClause = { createdAt: 'desc' };
    }

    // Parallel queries for comprehensive stats & paginated users
    const [
      totalUsersCount,
      activeTestTakersCount,
      paidStudentsCount,
      totalAttemptsSubmitted,
      totalRevenueResult,
      filteredUsersCount,
      users,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.user.count({ where: { role: { not: 'ADMIN' }, attempts: { some: {} } } }),
      prisma.user.count({ where: { role: { not: 'ADMIN' }, purchases: { some: {} } } }),
      prisma.testAttempt.count({ where: { status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] } } }),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              attempts: true,
              purchases: true,
              payments: true,
            },
          },
          purchases: {
            select: {
              id: true,
              purchasedAt: true,
              isTestMode: true,
              exam: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  category: true,
                },
              },
              payment: {
                select: {
                  id: true,
                  amount: true,
                  status: true,
                  gatewayOrderId: true,
                  gatewayPaymentId: true,
                },
              },
            },
            orderBy: { purchasedAt: 'desc' },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              gatewayOrderId: true,
              gatewayPaymentId: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          attempts: {
            select: {
              id: true,
              status: true,
              score: true,
              totalMarks: true,
              accuracy: true,
              percentage: true,
              correctCount: true,
              wrongCount: true,
              unansweredCount: true,
              timeTakenSeconds: true,
              startedAt: true,
              submittedAt: true,
              mockTest: {
                select: {
                  id: true,
                  name: true,
                  testNumber: true,
                  totalQuestions: true,
                  exam: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
            orderBy: { startedAt: 'desc' },
            take: 25,
          },
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents: totalUsersCount,
        activeStudents: activeTestTakersCount,
        paidStudents: paidStudentsCount,
        totalAttempts: totalAttemptsSubmitted,
        totalRevenue: totalRevenueResult._sum?.amount || 0,
      },
      pagination: {
        total: filteredUsersCount,
        page,
        limit,
        totalPages: Math.ceil(filteredUsersCount / limit) || 1,
      },
      users,
    });
  } catch (error: unknown) {
    console.error('Error fetching admin student activity:', error);
    return NextResponse.json(
      { error: 'Failed to load student activity records' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authRes = await requireAdmin();
    if (authRes instanceof NextResponse) return authRes;
    const adminEmail = authRes.user.email || 'Admin';

    const body = await req.json().catch(() => ({}));
    const { action, userId, examId, reason } = body;

    if (!action || !userId || !examId) {
      return NextResponse.json(
        { error: 'Missing required parameters: action, userId, examId' },
        { status: 400 }
      );
    }

    const [targetUser, targetExam] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.exam.findFirst({
        where: {
          OR: [{ id: examId }, { slug: examId }],
        },
        select: { id: true, name: true, slug: true, price: true },
      }),
    ]);

    if (!targetUser) {
      return NextResponse.json({ error: 'Student user not found' }, { status: 404 });
    }

    if (!targetExam) {
      return NextResponse.json({ error: 'Exam series not found' }, { status: 404 });
    }

    if (action === 'grant_access') {
      // Create admin payment and upsert purchase in transaction
      const purchase = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            userId: targetUser.id,
            amount: body.amount !== undefined ? Number(body.amount) : (targetExam.price || 1),
            currency: 'INR',
            status: 'PAID',
            source: 'CHECKOUT',
            gatewayOrderId: body.orderId || `admin_manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            gatewayPaymentId: (body.paymentId || '').trim() || `pay_manual_${Date.now()}`,
            gatewayResponse: {
              grantedBy: adminEmail,
              reason: reason || 'Manual grant from Admin Student Activity',
              razorpayPaymentId: (body.paymentId || '').trim() || null,
            },
          },
        });

        return tx.purchase.upsert({
          where: {
            userId_examId: {
              userId: targetUser.id,
              examId: targetExam.id,
            },
          },
          create: {
            userId: targetUser.id,
            examId: targetExam.id,
            paymentId: payment.id,
            isTestMode: false,
          },
          update: {
            paymentId: payment.id,
            isTestMode: false,
          },
          include: {
            exam: { select: { id: true, name: true, slug: true } },
            payment: true,
          },
        });
      });

      await recordAuditLog(
        'MANUAL_EXAM_ACCESS_GRANTED',
        `Granted access to ${targetExam.name} for student ${targetUser.name || targetUser.email} (${targetUser.email}). Reason: ${reason || 'Admin direct unlock'}`,
        adminEmail,
        'SUCCESS'
      );

      return NextResponse.json({
        success: true,
        message: `Successfully unlocked ${targetExam.name} for ${targetUser.name || targetUser.email}`,
        purchase,
      });
    }

    if (action === 'revoke_access') {
      await prisma.purchase.deleteMany({
        where: {
          userId: targetUser.id,
          examId: targetExam.id,
        },
      });

      await recordAuditLog(
        'MANUAL_EXAM_ACCESS_REVOKED',
        `Revoked access to ${targetExam.name} for student ${targetUser.name || targetUser.email} (${targetUser.email})`,
        adminEmail,
        'SUCCESS'
      );

      return NextResponse.json({
        success: true,
        message: `Successfully revoked access to ${targetExam.name} for ${targetUser.name || targetUser.email}`,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Error modifying student exam access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update student access' },
      { status: 500 }
    );
  }
}
