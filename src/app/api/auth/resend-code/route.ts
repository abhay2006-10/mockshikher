import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmailVerificationCode } from '@/lib/verification-service';

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown_ip';
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'This account is already verified. You can log in directly with your password.' },
        { status: 400 }
      );
    }

    const result = await sendEmailVerificationCode(normalizedEmail, clientIp);

    if (!result.success) {
      const status = result.cooldownRemaining ? 429 : 400;
      return NextResponse.json(
        {
          error: result.error || 'Failed to resend verification code.',
          cooldownRemaining: result.cooldownRemaining,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'A new 6-digit verification code has been dispatched to your email.',
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('Resend code error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while resending the code.' },
      { status: 500 }
    );
  }
}
