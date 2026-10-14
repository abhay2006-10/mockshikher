// Transactional email client using Brevo API (https://api.brevo.com/v3/smtp/email)

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface ParsedSender {
  name: string;
  email: string;
}

/**
 * Parses EMAIL_FROM environment variable.
 * Supports formats: "Mockshikhar <support@mockshikhar.com>" or "support@mockshikhar.com"
 */
function parseSender(fromStr?: string): ParsedSender {
  const fallback = { name: 'Mockshikhar', email: 'support@mockshikhar.com' };
  if (!fromStr) return fallback;

  const match = fromStr.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1]?.trim() || fallback.name,
      email: match[2]?.trim() || fallback.email,
    };
  }
  return {
    name: fallback.name,
    email: fromStr.trim(),
  };
}

/**
 * Sends a transactional email using the Brevo API.
 * In development without an API key, logs the email/code to the console.
 * In production with missing keys, fails loudly.
 */
export async function sendTransactionalEmail({
  to,
  subject,
  htmlContent,
  textContent,
}: SendEmailOptions): Promise<{ success: boolean; messageId?: string; devMode?: boolean }> {
  const apiKey = process.env.BREVO_API_KEY;
  const rawSender = process.env.EMAIL_FROM;
  const isProd = process.env.NODE_ENV === 'production';

  if (!apiKey) {
    if (isProd) {
      throw new Error(
        'BREVO_API_KEY is not configured in production environment. Transactional email failed.'
      );
    }

    // In development only: print the message and code to the server console
    console.log(
      `\n============================================================\n` +
      `[DEV EMAIL SENDER] To: ${to}\n` +
      `Subject: ${subject}\n` +
      `Content:\n${textContent || htmlContent.replace(/<[^>]*>?/gm, '')}\n` +
      `============================================================\n`
    );
    return { success: true, devMode: true };
  }

  const sender = parseSender(rawSender);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent: textContent || htmlContent.replace(/<[^>]*>?/gm, ''),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Brevo email API failed with HTTP ${response.status}:`, errorText);
    throw new Error(`Failed to send email via Brevo: ${response.status} ${errorText}`);
  }

  const data = await response.json().catch(() => ({}));
  return { success: true, messageId: data?.messageId };
}

/**
 * Sends a 6-digit email verification code.
 */
export async function sendVerificationCodeEmail(email: string, code: string) {
  const subject = `${code} is your Mockshikhar verification code`;
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0F0F1A; color: #F1F5F9; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="margin-bottom: 24px; text-align: center;">
        <h1 style="color: #F5B301; font-size: 24px; margin: 0 0 8px 0; font-weight: 800;">Mockshikhar</h1>
        <p style="color: #94A3B8; font-size: 14px; margin: 0;">Online Mock Test Platform</p>
      </div>
      <div style="background: #16213E; padding: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); text-align: center;">
        <p style="color: #CBD5E1; font-size: 15px; margin: 0 0 16px 0;">Your email verification code is:</p>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #F5B301; padding: 12px 24px; background: rgba(245, 179, 1, 0.1); border-radius: 8px; display: inline-block; font-family: monospace;">
          ${code}
        </div>
        <p style="color: #94A3B8; font-size: 13px; margin: 20px 0 0 0;">
          This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
      </div>
      <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
        If you did not request this verification, you can safely ignore this email.
      </p>
    </div>
  `;
  const textContent = `Your Mockshikhar verification code is: ${code}. This code is valid for 10 minutes.`;

  return sendTransactionalEmail({
    to: email,
    subject,
    htmlContent,
    textContent,
  });
}

/**
 * Sends a password reset email using the same Brevo sender.
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const subject = `Reset your Mockshikhar password`;
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0F0F1A; color: #F1F5F9; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="margin-bottom: 24px; text-align: center;">
        <h1 style="color: #F5B301; font-size: 24px; margin: 0 0 8px 0; font-weight: 800;">Mockshikhar</h1>
        <p style="color: #94A3B8; font-size: 14px; margin: 0;">Password Reset Request</p>
      </div>
      <div style="background: #16213E; padding: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); text-align: center;">
        <p style="color: #CBD5E1; font-size: 15px; margin: 0 0 20px 0;">Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563EB; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 15px;">
          Reset Password
        </a>
        <p style="color: #94A3B8; font-size: 13px; margin: 20px 0 0 0;">
          This link expires in 60 minutes.
        </p>
      </div>
      <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;
  const textContent = `Reset your Mockshikhar password by visiting: ${resetUrl}. This link expires in 60 minutes.`;

  return sendTransactionalEmail({
    to: email,
    subject,
    htmlContent,
    textContent,
  });
}
