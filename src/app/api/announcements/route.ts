import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureAnnouncementsTable } from '@/lib/announcement-db';

// Public endpoint — no auth needed (announcements are public info)
export async function GET() {
  try {
    await ensureAnnouncementsTable();

    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 10, // Never more than 10 at a time
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        isPinned: true,
        ctaLabel: true,
        ctaUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ announcements }, { status: 200 });
  } catch (error) {
    console.error('[announcements/GET]', error);
    return NextResponse.json({ announcements: [] }, { status: 200 }); // Graceful fallback
  }
}
