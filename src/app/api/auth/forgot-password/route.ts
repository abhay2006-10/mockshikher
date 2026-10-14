import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { sendPasswordResetOtpEmail } from '@/lib/email';

const PEPPER = process.env.AUTH_SECRET || 'mockshikhar_verification_salt_2026';
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

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
    const ipLimit = rateLimit(`forgot_ip:${clientIp}`, 8, 15 * 60 * 1000);
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: 'Too many password reset requests from this device. Please try again later.' },
        { status: 429 }
      );
    }

    const emailLimit = rateLimit(`forgot_email:${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!emailLimit.success) {
      return NextResponse.json(
        { error: 'Too many password reset requests for this email. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    // Check for existing token to enforce 60s resend cooldown
    const existing = await prisma.verificationToken.findFirst({
      where: { identifier: `reset:${normalizedEmail}` },
    });

    const now = Date.now();
    if (existing) {
      const parts = existing.token.split(':');
      const lastSentAt = Number(parts[2]) || 0;
      const elapsed = now - lastSentAt;
      if (elapsed < RESEND_COOLDOWN_MS) {
        const cooldownRemaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${cooldownRemaining}s before requesting a new code.`,
            cooldownRemaining,
          },
          { status: 429 }
        );
      }
    }

    // Generate 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = crypto
      .createHash('sha256')
      .update(`${normalizedEmail}:${code}:${PEPPER}`)
      .digest('hex');

    const tokenPayload = `${hashed}:0:${now}`;
    const expires = new Date(now + CODE_EXPIRY_MS);

    // Clean up existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${normalizedEmail}` },
    }).catch(() => {});

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${normalizedEmail}`,
        token: tokenPayload,
        expires,
      },
    });

    await sendPasswordResetOtpEmail(normalizedEmail, code).catch((err) => {
      console.error('Password reset code email dispatch failed:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email.',
    });
  } catch (err: unknown) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Server error processing request.' }, { status: 500 });
  }
}
