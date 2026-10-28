import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { recordAuditLog } from '@/lib/audit';

// PATCH — Toggle active/pinned or update fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) return authCheck;

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, body: msgBody, type, isPinned, isActive, ctaLabel, ctaUrl, expiresAt } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (msgBody !== undefined) data.body = msgBody.trim();
    if (type !== undefined) data.type = type;
    if (isPinned !== undefined) data.isPinned = isPinned;
    if (isActive !== undefined) data.isActive = isActive;
    if (ctaLabel !== undefined) data.ctaLabel = ctaLabel?.trim() || null;
    if (ctaUrl !== undefined) data.ctaUrl = ctaUrl?.trim() || null;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const updated = await prisma.announcement.update({
      where: { id },
      data,
    });

    await recordAuditLog(
      'ANNOUNCEMENT_UPDATE',
      `Updated announcement: "${updated.title}" (id: ${id})`,
      'Admin',
      'SUCCESS'
    );

    return NextResponse.json({ announcement: updated });
  } catch (error) {
    console.error('[admin/announcements/PATCH]', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

// DELETE — Permanently remove announcement
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) return authCheck;

  const { id } = await params;

  try {
    const deleted = await prisma.announcement.delete({ where: { id } });

    await recordAuditLog(
      'ANNOUNCEMENT_DELETE',
      `Deleted announcement: "${deleted.title}" (id: ${id})`,
      'Admin',
      'SUCCESS'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/announcements/DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
