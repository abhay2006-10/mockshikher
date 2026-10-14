import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { sendVerificationCodeEmail } from '@/lib/email';

const PEPPER = process.env.AUTH_SECRET || 'mockshikhar_verification_salt_2026';
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_WRONG_ATTEMPTS = 5;

function hashCode(email: string, code: string): string {
  return crypto
    .createHash('sha256')
    .update(`${email}:${code.trim()}:${PEPPER}`)
    .digest('hex');
}

export interface VerificationSendResult {
  success: boolean;
  error?: string;
  cooldownRemaining?: number;
}

export interface VerificationVerifyResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}

/**
 * Creates and sends a 6-digit email verification code.
 * Enforces:
 * - Rate limit per IP (max 10 in 15 min)
 * - Rate limit per Email (max 5 in 15 min)
 * - 60s cooldown between resends
 * - 10-minute expiry
 * - Stores only hashed code
 */
export async function sendEmailVerificationCode(
  email: string,
  clientIp: string = 'unknown_ip'
): Promise<VerificationSendResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit: max 10 requests per 15 min per IP
  const ipLimit = rateLimit(`verify_ip:${clientIp}`, 10, 15 * 60 * 1000);
  if (!ipLimit.success) {
    return {
      success: false,
      error: 'Too many verification attempts from this IP. Please try again later.',
    };
  }

  // Rate limit: max 5 requests per 15 min per Email
  const emailLimit = rateLimit(`verify_email:${normalizedEmail}`, 5, 15 * 60 * 1000);
  if (!emailLimit.success) {
    return {
      success: false,
      error: 'Too many verification requests for this email. Please try again in 15 minutes.',
    };
  }

  // Check for existing token to enforce 60s resend cooldown
  const existing = await prisma.verificationToken.findFirst({
    where: { identifier: normalizedEmail },
  });

  const now = Date.now();
  if (existing) {
    const parts = existing.token.split(':');
    const lastSentAt = Number(parts[2]) || 0;
    const elapsed = now - lastSentAt;
    if (elapsed < RESEND_COOLDOWN_MS) {
      const cooldownRemaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        success: false,
        error: `Please wait ${cooldownRemaining} seconds before requesting a new code.`,
        cooldownRemaining,
      };
    }
  }

  // Generate 6-digit numerical code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = hashCode(normalizedEmail, code);
  const tokenPayload = `${hashed}:0:${now}`;
  const expires = new Date(now + CODE_EXPIRY_MS);

  // Clean up old tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  }).catch(() => {});

  // Save hashed token
  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token: tokenPayload,
      expires,
    },
  });

  // Send email via Brevo or log to console in dev
  try {
    await sendVerificationCodeEmail(normalizedEmail, code);
    return { success: true };
  } catch (err: unknown) {
    console.error('Failed to send verification email:', err);
    return {
      success: false,
      error: (err as Error)?.message || 'Failed to dispatch verification email.',
    };
  }
}

/**
 * Validates a 6-digit email verification code.
 * Enforces:
 * - 10-minute expiry
 * - Max 5 wrong attempts (deletes token upon exceeding)
 * - Sets user.emailVerified = new Date() on success
 */
export async function verifyEmailCode(
  email: string,
  code: string,
  clientIp: string = 'unknown_ip'
): Promise<VerificationVerifyResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'Please enter a valid 6-digit verification code.' };
  }

  // Rate limit check on verification attempts
  const ipCheck = rateLimit(`verify_attempt:${clientIp}`, 20, 15 * 60 * 1000);
  if (!ipCheck.success) {
    return { success: false, error: 'Too many verification attempts. Please wait a few minutes.' };
  }

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: normalizedEmail },
  });

  if (!record) {
    return {
      success: false,
      error: 'No active verification code found. Please request a new code.',
    };
  }

  const now = Date.now();
  if (now > record.expires.getTime()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    }).catch(() => {});
    return {
      success: false,
      error: 'This verification code has expired. Please request a new one.',
    };
  }

  const [storedHash, attemptsStr, lastSentStr] = record.token.split(':');
  const attempts = Number(attemptsStr) || 0;
  const lastSent = Number(lastSentStr) || now;

  const candidateHash = hashCode(normalizedEmail, cleanCode);

  if (candidateHash !== storedHash) {
    const nextAttempts = attempts + 1;
    if (nextAttempts >= MAX_WRONG_ATTEMPTS) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      }).catch(() => {});
      return {
        success: false,
        error: 'Maximum incorrect attempts exceeded. This code is invalidated. Please request a new code.',
        attemptsRemaining: 0,
      };
    }

    // Update wrong attempts count
    await prisma.verificationToken.update({
      where: { token: record.token },
      data: {
        token: `${storedHash}:${nextAttempts}:${lastSent}`,
      },
    }).catch(() => {});

    const attemptsRemaining = MAX_WRONG_ATTEMPTS - nextAttempts;
    return {
      success: false,
      error: `Incorrect code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
      attemptsRemaining,
    };
  }

  // Verification SUCCESS!
  // Mark user as verified
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { emailVerified: new Date() },
  });

  // Clean up token
  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  }).catch(() => {});

  return { success: true };
}
