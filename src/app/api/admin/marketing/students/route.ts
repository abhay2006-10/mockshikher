import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const consentFilter = searchParams.get('consent'); // 'opted_in', 'opted_out', or null

    const whereClause: any = {
      role: 'USER',
    };

    if (consentFilter === 'opted_in') {
      whereClause.whatsappConsent = true;
    } else if (consentFilter === 'opted_out') {
      whereClause.whatsappConsent = false;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, totalStudents, withPhoneCount, optedInCount, optedOutCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsappConsent: true,
          createdAt: true,
          _count: {
            select: {
              purchases: true,
              attempts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', phone: { not: null } } }),
      prisma.user.count({ where: { role: 'USER', whatsappConsent: true } }),
      prisma.user.count({ where: { role: 'USER', whatsappConsent: false } }),
    ]);

    const formatted = students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone || '—',
      hasPhone: !!s.phone,
      whatsappConsent: s.whatsappConsent,
      registeredAt: s.createdAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      purchasesCount: s._count.purchases,
      attemptsCount: s._count.attempts,
    }));

    return NextResponse.json({
      students: formatted,
      stats: {
        totalStudents,
        withPhoneCount,
        optedInCount,
        optedOutCount,
      },
    });
  } catch (err: any) {
    console.error('Error fetching students for marketing:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch student marketing contacts' },
      { status: 500 }
    );
  }
}
