import crypto from 'crypto';
import prisma from '@/lib/prisma';

export interface EmailVerificationResult {
  token: string;
  verifyUrl: string;
  sent: boolean;
  message?: string;
}

/**
 * Creates an email verification token and attempts to send the verification link.
 * If no email provider API key is set in environment variables, it logs the configuration
 * requirement and provides the verification link for local development.
 */
export async function sendVerificationEmail(email: string, baseUrl: string): Promise<EmailVerificationResult> {
  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Save to verification_tokens table in database
  await prisma.verificationToken.upsert({
    where: {
      identifier_token: {
        identifier: email,
        token: token,
      },
    },
    update: {
      token,
      expires,
    },
    create: {
      identifier: email,
      token,
      expires,
    },
  });

  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  // Check for email provider configuration (Resend or Brevo)
  const resendApiKey = process.env.RESEND_API_KEY;
  const brevoApiKey = process.env.BREVO_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'Mockshikhar <onboarding@mockshikhar.com>';

  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: emailFrom,
          to: email,
          subject: 'Verify your Mockshikhar Account',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Welcome to Mockshikhar!</h2>
              <p>Please click the button below to verify your email address:</p>
              <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
                Verify Email Address
              </a>
              <p style="color: #666; font-size: 14px;">If you did not create an account, you can safely ignore this email.</p>
              <p style="color: #999; font-size: 12px;">Link expires in 24 hours.</p>
            </div>
          `,
        }),
      });

      if (res.ok) {
        return { token, verifyUrl, sent: true };
      }
      console.warn('Resend API returned non-OK status:', await res.text());
    } catch (err) {
      console.error('Failed to send verification email via Resend:', err);
    }
  } else if (brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: 'Mockshikhar', email: process.env.BREVO_SENDER_EMAIL || 'support@mockshikhar.com' },
          to: [{ email }],
          subject: 'Verify your Mockshikhar Account',
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Welcome to Mockshikhar!</h2>
              <p>Please click the button below to verify your email address:</p>
              <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
                Verify Email Address
              </a>
              <p style="color: #666; font-size: 14px;">If you did not create an account, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });

      if (res.ok) {
        return { token, verifyUrl, sent: true };
      }
    } catch (err) {
      console.error('Failed to send verification email via Brevo:', err);
    }
  }

  // If no email service is configured, log verification details for configuration
  console.log(`[Email Service Not Configured] Verification token generated for ${email}. Link: ${verifyUrl}`);
  return {
    token,
    verifyUrl,
    sent: false,
    message: 'Email provider not configured in environment variables. Configure RESEND_API_KEY to send automated emails.',
  };
}
