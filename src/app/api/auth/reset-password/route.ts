import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const PEPPER = process.env.AUTH_SECRET || 'mockshikhar_verification_salt_2026';
const MAX_WRONG_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown_ip';
    const body = await req.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, verification code, and new password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const cleanCode = String(code).trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: 'Verification code must be a 6-digit number.' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Rate limit check on verification attempts
    const ipCheck = rateLimit(`reset_attempt:${clientIp}`, 15, 15 * 60 * 1000);
    if (!ipCheck.success) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please wait a few minutes.' },
        { status: 429 }
      );
    }

    const record = await prisma.verificationToken.findFirst({
      where: { identifier: `reset:${normalizedEmail}` },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'No active password reset request found for this email. Please request a new code.' },
        { status: 404 }
      );
    }

    const now = Date.now();
    if (now > record.expires.getTime()) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: `reset:${normalizedEmail}` },
      }).catch(() => {});
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    const [storedHash, attemptsStr, lastSentStr] = record.token.split(':');
    const attempts = Number(attemptsStr) || 0;
    const lastSent = Number(lastSentStr) || now;

    const candidateHash = crypto
      .createHash('sha256')
      .update(`${normalizedEmail}:${cleanCode}:${PEPPER}`)
      .digest('hex');

    if (candidateHash !== storedHash) {
      const nextAttempts = attempts + 1;
      if (nextAttempts >= MAX_WRONG_ATTEMPTS) {
        await prisma.verificationToken.deleteMany({
          where: { identifier: `reset:${normalizedEmail}` },
        }).catch(() => {});
        return NextResponse.json(
          { error: 'Maximum incorrect attempts exceeded. This code is invalidated. Please request a new code.' },
          { status: 400 }
        );
      }

      await prisma.verificationToken.update({
        where: { token: record.token },
        data: {
          token: `${storedHash}:${nextAttempts}:${lastSent}`,
        },
      }).catch(() => {});

      const attemptsRemaining = MAX_WRONG_ATTEMPTS - nextAttempts;
      return NextResponse.json(
        { error: `Incorrect verification code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.` },
        { status: 400 }
      );
    }

    // Code is valid! Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password and ensure verified
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        passwordHash,
        emailVerified: new Date(),
      },
    });

    // Delete used reset token
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${normalizedEmail}` },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (err: unknown) {
    console.error('Password reset error:', err);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
