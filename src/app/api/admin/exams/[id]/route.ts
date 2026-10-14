import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { id } = await context.params;

  try {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        mockTests: {
          orderBy: { testNumber: 'asc' },
          include: {
            _count: { select: { questions: true } },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found.' }, { status: 404 });
    }

    return NextResponse.json({ exam });
  } catch (error: any) {
    console.error('Error fetching admin exam:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exam.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { id } = await context.params;

  try {
    const existing = await prisma.exam.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Exam not found.' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length < 3) {
        return NextResponse.json(
          { error: 'Name must be at least 3 characters long.' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.category !== undefined) {
      updateData.category = String(body.category).trim();
    }

    if (body.description !== undefined) {
      updateData.description = String(body.description).trim();
    }

    if (body.totalQuestions !== undefined) {
      const tq = Number(body.totalQuestions);
      if (isNaN(tq) || tq < 1) {
        return NextResponse.json(
          { error: 'Total questions must be greater than 0.' },
          { status: 400 }
        );
      }
      updateData.totalQuestions = tq;
    }

    if (body.durationMinutes !== undefined) {
      const dur = Number(body.durationMinutes);
      if (isNaN(dur) || dur < 1 || dur > 300) {
        return NextResponse.json(
          { error: 'Duration must be between 1 and 300 minutes.' },
          { status: 400 }
        );
      }
      updateData.durationMinutes = dur;
    }

    if (body.price !== undefined) {
      const p = Number(body.price);
      if (isNaN(p) || p < 0) {
        return NextResponse.json(
          { error: 'Price must be 0 or greater.' },
          { status: 400 }
        );
      }
      updateData.price = p;
    }

    if (body.negativeMarking !== undefined) {
      const nm = Number(body.negativeMarking);
      if (isNaN(nm) || nm < 0 || nm > 5) {
        return NextResponse.json(
          { error: 'Negative marking must be between 0 and 5.' },
          { status: 400 }
        );
      }
      updateData.negativeMarking = nm;
    }

    if (body.marksPerQuestion !== undefined) {
      const mpq = Number(body.marksPerQuestion);
      if (isNaN(mpq) || mpq <= 0) {
        return NextResponse.json(
          { error: 'Marks per question must be greater than 0.' },
          { status: 400 }
        );
      }
      updateData.marksPerQuestion = mpq;
    }

    if (body.slug !== undefined) {
      const cleanSlug = String(body.slug).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
      if (cleanSlug.length < 2) {
        return NextResponse.json(
          { error: 'Slug must be at least 2 characters long (letters, numbers, hyphens).' },
          { status: 400 }
        );
      }
      if (cleanSlug !== existing.slug) {
        const slugExists = await prisma.exam.findUnique({
          where: { slug: cleanSlug },
        });
        if (slugExists && slugExists.id !== id) {
          return NextResponse.json(
            { error: `Slug "${cleanSlug}" is already in use by another exam.` },
            { status: 400 }
          );
        }
        updateData.slug = cleanSlug;
      }
    }

    if (body.isArchived !== undefined) {
      updateData.isArchived = Boolean(body.isArchived);
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: updateData,
    });

    const changeSummary = Object.keys(updateData)
      .map((k) => `${k}: ${updateData[k]}`)
      .join(', ');

    await recordAuditLog(
      'EXAM_UPDATE',
      `Updated exam "${updatedExam.name}" (${updatedExam.slug}) [${changeSummary}]`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({ exam: updatedExam });
  } catch (error: any) {
    console.error('Error updating admin exam:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update exam.' },
      { status: 500 }
    );
  }
}
