import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signupSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';

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

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (min 8 chars enforced by signupSchema)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in PostgreSQL database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate verification link and send email if provider configured
    const origin = req.nextUrl.origin || 'http://localhost:3000';
    const emailResult = await sendVerificationEmail(newUser.email, origin).catch((e) => {
      console.warn('Verification email handling failed:', e);
      return null;
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: newUser,
        emailVerification: {
          sent: emailResult?.sent ?? false,
          providerConfigured: emailResult?.sent ?? false,
          instructions: emailResult?.message,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Registration error in database:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while creating your account' },
      { status: 500 }
    );
  }
}
