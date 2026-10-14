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
    const existing = await prisma.subject.findUnique({
      where: { id },
      include: { exam: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) {
      const cleanName = String(body.name).trim();
      if (cleanName.length < 2) {
        return NextResponse.json(
          { error: 'Subject name must be at least 2 characters long.' },
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

    const updated = await prisma.subject.update({
      where: { id },
      data: updateData,
      include: { topics: true },
    });

    await recordAuditLog(
      'SUBJECT_UPDATE',
      `Updated subject "${updated.name}" in exam "${existing.exam.name}"`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({ success: true, subject: updated });
  } catch (err: any) {
    console.error('Error updating subject:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update subject.' },
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
    const existing = await prisma.subject.findUnique({
      where: { id },
      include: {
        exam: true,
        _count: { select: { questions: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
    }

    const questionCount = existing._count.questions;
    if (questionCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete subject "${existing.name}". There are ${questionCount} question(s) currently linked to this subject.`,
        },
        { status: 400 }
      );
    }

    // Delete topics linked to this subject first, then delete subject
    await prisma.$transaction([
      prisma.topic.deleteMany({ where: { subjectId: id } }),
      prisma.subject.delete({ where: { id } }),
    ]);

    await recordAuditLog(
      'SUBJECT_DELETE',
      `Deleted subject "${existing.name}" from exam "${existing.exam.name}"`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({
      success: true,
      message: `Subject "${existing.name}" deleted successfully.`,
    });
  } catch (err: any) {
    console.error('Error deleting subject:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete subject.' },
      { status: 500 }
    );
  }
}
