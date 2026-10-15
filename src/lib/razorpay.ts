import crypto from 'crypto';
import Razorpay from 'razorpay';

export const isRazorpayTestMode = (): boolean => {
  const key = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  return key.startsWith('rzp_test_');
};

export const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

/**
 * Verify Razorpay payment signature with timing-safe comparison
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
  secretOverride,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  secretOverride?: string;
}): boolean {
  const secret = secretOverride || process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !signature || !orderId || !paymentId) {
    return false;
  }
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const signatureBuf = Buffer.from(signature, 'utf8');

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * Helper to compute valid test signature for automated verification without exposing secret
 */
export function computeRazorpaySignature({
  orderId,
  paymentId,
  secret,
}: {
  orderId: string;
  paymentId: string;
  secret: string;
}): string {
  const body = `${orderId}|${paymentId}`;
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Verify Razorpay webhook signature with timing-safe comparison
 */
export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
  secretOverride,
}: {
  rawBody: string;
  signature: string;
  secretOverride?: string;
}): boolean {
  const secret = secretOverride || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !signature || !rawBody) {
    return false;
  }
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const signatureBuf = Buffer.from(signature, 'utf8');

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
