import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { recordAuditLog } from '@/lib/audit';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.code !== undefined) {
      const newCode = String(body.code).trim().toUpperCase();
      if (!newCode || newCode.length < 3) {
        return NextResponse.json(
          { error: 'Promo code must be at least 3 characters long.' },
          { status: 400 }
        );
      }
      // Check collision
      if (newCode !== existing.code) {
        const collision = await prisma.promoCode.findUnique({
          where: { code: newCode },
        });
        if (collision) {
          return NextResponse.json(
            { error: `Promo code "${newCode}" already exists.` },
            { status: 409 }
          );
        }
      }
      updateData.code = newCode;
    }

    if (body.discount !== undefined) {
      const discount = parseInt(body.discount, 10);
      if (isNaN(discount) || discount <= 0) {
        return NextResponse.json(
          { error: 'Discount must be a positive number in ₹.' },
          { status: 400 }
        );
      }
      updateData.discount = discount;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.maxUses !== undefined) {
      updateData.maxUses = body.maxUses ? parseInt(body.maxUses, 10) : null;
    }

    if (body.expiresAt !== undefined) {
      updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog(
      'PROMO_CODE_UPDATED',
      `Updated promo code "${updated.code}" (Discount: ₹${updated.discount}, Active: ${updated.isActive})`,
      authCheck.user.email || 'admin',
      'SUCCESS'
    );

    return NextResponse.json({
      message: 'Promo code updated successfully',
      promoCode: updated,
    });
  } catch (error: any) {
    console.error('Error updating promo code:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update promo code' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const { id } = await params;
    const existing = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      );
    }

    await prisma.promoCode.delete({
      where: { id },
    });

    await recordAuditLog(
      'PROMO_CODE_DELETED',
      `Deleted promo code "${existing.code}" (Discount: ₹${existing.discount})`,
      authCheck.user.email || 'admin',
      'SUCCESS'
    );

    return NextResponse.json({
      message: `Promo code "${existing.code}" deleted successfully`,
    });
  } catch (error: any) {
    console.error('Error deleting promo code:', error);
    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 }
    );
  }
}
