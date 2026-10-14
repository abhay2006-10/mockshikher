import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown_ip';
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Rate limit per IP and email
    const ipLimit = rateLimit(`forgot_ip:${clientIp}`, 5, 15 * 60 * 1000);
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always respond with success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Clean up existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${normalizedEmail}` },
    }).catch(() => {});

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${normalizedEmail}`,
        token: rawToken,
        expires,
      },
    });

    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${origin}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendPasswordResetEmail(normalizedEmail, resetUrl).catch((err) => {
      console.error('Password reset email dispatch failed:', err);
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
