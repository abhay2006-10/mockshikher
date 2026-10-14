import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailCode } from '@/lib/verification-service';

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown_ip';
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const result = await verifyEmailCode(email, code, clientIp);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Verification failed.',
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully! You can now log in.',
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('Verify code error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during verification.' },
      { status: 500 }
    );
  }
}
