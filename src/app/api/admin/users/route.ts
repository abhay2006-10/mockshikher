import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Strict Admin Authorization Check
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
        role: 'ADMIN',
      },
      select: { id: true, role: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'attempted' | 'purchased'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    // Build Prisma where filter
    const whereClause: Record<string, unknown> = {
      role: 'USER', // Only students, admin accounts excluded from student activity view
    };

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filter === 'attempted') {
      whereClause.attempts = { some: {} };
    } else if (filter === 'purchased') {
      whereClause.purchases = { some: {} };
    }

    // Parallel query for summary counts & paginated users
    const [
      totalUsersCount,
      activeTestTakersCount,
      paidStudentsCount,
      totalAttemptsSubmitted,
      filteredUsersCount,
      users,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', attempts: { some: {} } } }),
      prisma.user.count({ where: { role: 'USER', purchases: { some: {} } } }),
      prisma.testAttempt.count({ where: { status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] } } }),
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: {
            select: {
              attempts: true,
              purchases: true,
            },
          },
          purchases: {
            select: {
              id: true,
              purchasedAt: true,
              exam: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
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
            take: 20, // Return recent 20 attempts for instant preview
          },
        },
        orderBy: { createdAt: 'desc' },
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
      },
      pagination: {
        total: filteredUsersCount,
        page,
        limit,
        totalPages: Math.ceil(filteredUsersCount / limit),
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
