// Disposable email domain blocklist
// Extensible list of temporary and disposable email providers

export const DISPOSABLE_EMAIL_DOMAINS: Set<string> = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'sharklasers.com',
  'getairmail.com',
  'dispostable.com',
  'throwawaymail.com',
  'fakemailgenerator.com',
  'maildrop.cc',
  'inboxkitten.com',
  'mohmal.com',
  'crazymailing.com',
  'burnermail.io',
  'generator.email',
  'mytemp.email',
  'fakeinbox.com',
  'nada.ltd',
  'getnada.com',
  'emailondeck.com',
  'tempinbox.com',
  'internxt.com',
  'tempail.com',
]);

/**
 * Checks whether an email address belongs to a disposable/temporary email domain.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return false;
  }
  const parts = email.split('@');
  const domain = parts[parts.length - 1]?.toLowerCase().trim();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}
