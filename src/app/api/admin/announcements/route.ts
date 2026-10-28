import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { recordAuditLog } from '@/lib/audit';

// GET — All announcements (admin view, including inactive)
export async function GET() {
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('[admin/announcements/GET]', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// POST — Create a new announcement
export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const body = await req.json();
    const { title, body: msgBody, type, isPinned, isActive, ctaLabel, ctaUrl, expiresAt } = body;

    if (!title?.trim() || !msgBody?.trim()) {
      return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 });
    }

    const validTypes = ['INFO', 'SUCCESS', 'WARNING', 'URGENT', 'NEW_TEST', 'OFFER'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid announcement type.' }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        body: msgBody.trim(),
        type: type || 'INFO',
        isPinned: isPinned === true,
        isActive: isActive !== false,
        ctaLabel: ctaLabel?.trim() || null,
        ctaUrl: ctaUrl?.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await recordAuditLog(
      'ANNOUNCEMENT_CREATE',
      `Created announcement: "${announcement.title}" (type: ${announcement.type})`,
      'Admin',
      'SUCCESS'
    );

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('[admin/announcements/POST]', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
