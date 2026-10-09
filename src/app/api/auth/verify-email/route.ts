import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=missing_verification_token', req.url));
  }

  try {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid_or_expired_token', req.url));
    }

    if (new Date() > record.expires) {
      // Token expired, cleanup
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.redirect(new URL('/auth/login?error=token_expired', req.url));
    }

    // Mark email as verified in User model
    await prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    });

    // Cleanup used token
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

    return NextResponse.redirect(new URL('/auth/login?verified=true', req.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=verification_failed', req.url));
  }
}
