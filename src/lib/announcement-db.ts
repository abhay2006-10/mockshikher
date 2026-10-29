import prisma from '@/lib/prisma';

let isTableInitialized = false;

/**
 * Ensures the announcements table and AnnouncementType enum exist in PostgreSQL.
 * Safely handles missing migrations on production databases without failing requests.
 */
export async function ensureAnnouncementsTable(): Promise<void> {
  if (isTableInitialized) return;

  try {
    // 1. Create enum type safely if it doesn't already exist
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "AnnouncementType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'URGENT', 'NEW_TEST', 'OFFER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create announcements table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "announcements" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "type" "AnnouncementType" NOT NULL DEFAULT 'INFO'::"AnnouncementType",
        "isPinned" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "ctaLabel" TEXT,
        "ctaUrl" TEXT,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
      );
    `);

    // 3. Create indexes safely
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "announcements_isActive_idx" ON "announcements"("isActive");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "announcements_isPinned_idx" ON "announcements"("isPinned");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "announcements_createdAt_idx" ON "announcements"("createdAt");`);

    isTableInitialized = true;
  } catch (err: any) {
    console.warn('ensureAnnouncementsTable auto-migration notice:', err?.message);
  }
}

