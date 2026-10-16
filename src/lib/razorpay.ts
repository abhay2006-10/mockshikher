import crypto from 'crypto';
import Razorpay from 'razorpay';

export const isRazorpayTestMode = (): boolean => {
  const key = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  return key.startsWith('rzp_test_');
};

const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;

export const razorpay =
  rzpKeyId && rzpKeySecret
    ? new Razorpay({
        key_id: rzpKeyId,
        key_secret: rzpKeySecret,
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
