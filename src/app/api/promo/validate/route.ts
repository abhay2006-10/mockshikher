import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = body.code ? String(body.code).trim().toUpperCase() : '';
    const basePrice = Number(body.basePrice) || 199;

    if (!rawCode) {
      return NextResponse.json(
        { valid: false, error: 'Please enter a promo code.' },
        { status: 400 }
      );
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: rawCode },
    });

    if (!promo) {
      return NextResponse.json(
        { valid: false, error: 'Invalid promo code. Please check and try again.' },
        { status: 404 }
      );
    }

    if (!promo.isActive) {
      return NextResponse.json(
        { valid: false, error: 'This promo code is currently disabled.' },
        { status: 400 }
      );
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'This promo code has expired.' },
        { status: 400 }
      );
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return NextResponse.json(
        { valid: false, error: 'This promo code usage limit has been reached.' },
        { status: 400 }
      );
    }

    const discount = Math.min(basePrice, promo.discount);
    const finalPrice = Math.max(0, basePrice - discount);

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discount,
      originalPrice: basePrice,
      finalPrice,
      message: `Promo code applied successfully! You saved ₹${discount}.`,
    });
  } catch (error: any) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate promo code. Please try again.' },
      { status: 500 }
    );
  }
}
