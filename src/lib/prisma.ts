import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string | undefined {
  if (typeof process === 'undefined' || !process.env?.DATABASE_URL) return undefined;
  const dbUrl = process.env.DATABASE_URL;
  const isTransactionPooler =
    dbUrl.includes('-pooler') ||
    (dbUrl.includes('.pooler.supabase.com') && dbUrl.includes(':6543'));

  if (isTransactionPooler && !dbUrl.includes('pgbouncer=true')) {
    return dbUrl.includes('?') ? `${dbUrl}&pgbouncer=true` : `${dbUrl}?pgbouncer=true`;
  }
  return dbUrl;
}

const dbUrl = getDatabaseUrl();
if (dbUrl && typeof process !== 'undefined' && process.env) {
  process.env.DATABASE_URL = dbUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Always preserve singleton on globalThis to prevent connection pool exhaustion across route bundles
globalForPrisma.prisma = prisma;

export default prisma;

