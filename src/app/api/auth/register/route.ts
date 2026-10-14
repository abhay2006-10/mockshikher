import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signupSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { isDisposableEmail } from '@/lib/disposable-domains';
import { sendEmailVerificationCode } from '@/lib/verification-service';
import { normalizeIndianPhone } from '@/lib/phone';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 5 signup attempts per 15 minutes per IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown_ip';
    const { success } = rateLimit(`register:${clientIp}`, 5, 15 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, email, password, phone, whatsappConsent } = result.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone ? normalizeIndianPhone(phone) : null;

    // Check and block disposable email domains
    if (isDisposableEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Temporary or disposable email addresses are not permitted. Please use a valid email address.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // If user exists but is not verified, allow them to re-verify rather than complete dead end
      if (!existingUser.emailVerified) {
        await sendEmailVerificationCode(normalizedEmail, clientIp);
        return NextResponse.json(
          {
            message: 'An account with this email exists but is not verified. A verification code has been sent.',
            email: normalizedEmail,
            requireVerification: true,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with emailVerified = null, storing phone and whatsapp consent
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        whatsappConsent: whatsappConsent !== false,
        emailVerified: null,
        passwordHash,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappConsent: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Send 6-digit verification code
    const sendResult = await sendEmailVerificationCode(normalizedEmail, clientIp);
    if (!sendResult.success) {
      console.warn('Initial code send failed:', sendResult.error);
    }

    return NextResponse.json(
      {
        message: 'Account created. Please verify your email with the 6-digit code.',
        user: newUser,
        email: normalizedEmail,
        requireVerification: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error in database:', error?.message || error);
    const userMessage = error?.message && !error.message.includes('Prisma')
      ? error.message
      : 'An unexpected database error occurred while creating your account. Please check your details and try again.';
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}
