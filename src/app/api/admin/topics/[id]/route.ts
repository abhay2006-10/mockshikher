import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { id } = await context.params;

  try {
    const existing = await prisma.topic.findUnique({
      where: { id },
      include: { subject: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) {
      const cleanName = String(body.name).trim();
      if (cleanName.length < 2) {
        return NextResponse.json(
          { error: 'Topic name must be at least 2 characters long.' },
          { status: 400 }
        );
      }
      updateData.name = cleanName;
    }

    if (body.nameHi !== undefined) {
      updateData.nameHi = body.nameHi ? String(body.nameHi).trim() : null;
    }

    if (body.sortOrder !== undefined) {
      updateData.sortOrder = Number(body.sortOrder) || 0;
    }

    const updated = await prisma.topic.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog(
      'TOPIC_UPDATE',
      `Updated topic "${updated.name}" under subject "${existing.subject.name}"`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({ success: true, topic: updated });
  } catch (err: any) {
    console.error('Error updating topic:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update topic.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { id } = await context.params;

  try {
    const existing = await prisma.topic.findUnique({
      where: { id },
      include: {
        subject: true,
        _count: { select: { questions: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
    }

    const questionCount = existing._count.questions;
    if (questionCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete topic "${existing.name}". There are ${questionCount} question(s) currently linked to this topic.`,
        },
        { status: 400 }
      );
    }

    await prisma.topic.delete({ where: { id } });

    await recordAuditLog(
      'TOPIC_DELETE',
      `Deleted topic "${existing.name}" from subject "${existing.subject.name}"`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({
      success: true,
      message: `Topic "${existing.name}" deleted successfully.`,
    });
  } catch (err: any) {
    console.error('Error deleting topic:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete topic.' },
      { status: 500 }
    );
  }
}
