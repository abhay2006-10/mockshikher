import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET() {
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = promoCodes.length;
    const activeCount = promoCodes.filter((p) => p.isActive).length;
    const totalUses = promoCodes.reduce((sum, p) => sum + p.usedCount, 0);

    return NextResponse.json({
      promoCodes,
      stats: {
        totalCount,
        activeCount,
        totalUses,
      },
    });
  } catch (error: any) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const body = await req.json();
    const rawCode = body.code ? String(body.code).trim().toUpperCase() : '';
    const discount = parseInt(body.discount, 10);
    const isActive = body.isActive !== false;
    const maxUses = body.maxUses ? parseInt(body.maxUses, 10) : null;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    if (!rawCode || rawCode.length < 3) {
      return NextResponse.json(
        { error: 'Promo code must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    if (isNaN(discount) || discount <= 0) {
      return NextResponse.json(
        { error: 'Discount must be a positive number in ₹.' },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = await prisma.promoCode.findUnique({
      where: { code: rawCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Promo code "${rawCode}" already exists.` },
        { status: 409 }
      );
    }

    const created = await prisma.promoCode.create({
      data: {
        code: rawCode,
        discount,
        isActive,
        maxUses,
        expiresAt,
      },
    });

    await recordAuditLog(
      'PROMO_CODE_CREATED',
      `Created promo code "${created.code}" with ₹${created.discount} discount (Active: ${created.isActive})`,
      authCheck.user.email || 'admin',
      'SUCCESS'
    );

    return NextResponse.json(
      { message: 'Promo code created successfully', promoCode: created },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating promo code:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create promo code' },
      { status: 500 }
    );
  }
}
