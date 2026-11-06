/**
 * Server-only secret used to pepper verification / reset-code hashes.
 *
 * In production it MUST come from AUTH_SECRET (or NEXTAUTH_SECRET). A
 * hardcoded fallback would let anyone who reads the source forge or
 * brute-force codes, so we fail loudly instead. Read lazily so `next build`
 * does not need the env var at import time.
 */
const DEV_ONLY_PEPPER = 'dev-only-insecure-pepper';

export function getAuthPepper(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is not configured. Refusing to hash verification codes.');
  }
  return DEV_ONLY_PEPPER;
}
