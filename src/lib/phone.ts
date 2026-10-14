/**
 * Indian Mobile Number Validator and Normalizer.
 * Standardizes to +91XXXXXXXXXX or extracts the 10-digit number.
 */
export function normalizeIndianPhone(input?: string | null): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/[\s\-\(\)]/g, '');
  if (!cleaned) return null;

  const match = cleaned.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  if (match) {
    return `+91${match[1]}`;
  }
  return null;
}

export function isValidIndianPhone(input?: string | null): boolean {
  if (!input) return false;
  return normalizeIndianPhone(input) !== null;
}
