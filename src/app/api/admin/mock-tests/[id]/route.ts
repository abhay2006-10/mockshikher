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
    const mockTest = await prisma.mockTest.findUnique({
      where: { id },
      include: {
        exam: true,
        _count: { select: { questions: true, attempts: true } },
      },
    });

    if (!mockTest) {
      return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
    }

    return NextResponse.json({ mockTest });
  } catch (error: any) {
    console.error('Error fetching mock test:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mock test.' },
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
    const existing = await prisma.mockTest.findUnique({
      where: { id },
      include: { exam: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Test title must be at least 2 characters long.' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.isFree !== undefined) {
      updateData.isFree = Boolean(body.isFree);
    }

    if (body.isPublished !== undefined) {
      updateData.isPublished = Boolean(body.isPublished);
    }

    // Optional duration override (1 to 300 or null to inherit from exam)
    if (body.durationOverride !== undefined || body.durationMinutes !== undefined) {
      const val = body.durationOverride !== undefined ? body.durationOverride : body.durationMinutes;
      if (val === null || val === '' || val === undefined) {
        updateData.durationOverride = null;
        updateData.durationMinutes = existing.exam.durationMinutes;
      } else {
        const dur = Number(val);
        if (isNaN(dur) || dur < 1 || dur > 300) {
          return NextResponse.json(
            { error: 'Duration override must be between 1 and 300 minutes.' },
            { status: 400 }
          );
        }
        updateData.durationOverride = dur;
        updateData.durationMinutes = dur;
      }
    }

    // Optional negative marks override (0 to 5 or null to inherit from exam)
    if (body.negativeMarksOverride !== undefined || body.negativeMarksPerQuestion !== undefined) {
      const val = body.negativeMarksOverride !== undefined ? body.negativeMarksOverride : body.negativeMarksPerQuestion;
      if (val === null || val === '' || val === undefined) {
        updateData.negativeMarksOverride = null;
        updateData.negativeMarksPerQuestion = existing.exam.negativeMarking;
      } else {
        const nm = Number(val);
        if (isNaN(nm) || nm < 0 || nm > 5) {
          return NextResponse.json(
            { error: 'Negative marking override must be between 0 and 5.' },
            { status: 400 }
          );
        }
        updateData.negativeMarksOverride = nm;
        updateData.negativeMarksPerQuestion = nm;
      }
    }

    // Optional marks per question override (> 0 or null to inherit from exam)
    if (body.marksOverride !== undefined || body.marksPerQuestion !== undefined) {
      const val = body.marksOverride !== undefined ? body.marksOverride : body.marksPerQuestion;
      if (val === null || val === '' || val === undefined) {
        updateData.marksOverride = null;
        updateData.marksPerQuestion = existing.exam.marksPerQuestion;
      } else {
        const mpq = Number(val);
        if (isNaN(mpq) || mpq <= 0) {
          return NextResponse.json(
            { error: 'Marks per question override must be greater than 0.' },
            { status: 400 }
          );
        }
        updateData.marksOverride = mpq;
        updateData.marksPerQuestion = mpq;
      }
    }

    const updatedTest = await prisma.mockTest.update({
      where: { id },
      data: updateData,
      include: { exam: true },
    });

    const changeSummary = Object.keys(updateData)
      .map((k) => `${k}: ${updateData[k]}`)
      .join(', ');

    await recordAuditLog(
      'MOCK_TEST_UPDATE',
      `Updated mock test "${updatedTest.name}" in exam "${existing.exam.name}" [${changeSummary}]`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({ mockTest: updatedTest });
  } catch (error: any) {
    console.error('Error updating mock test:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update mock test.' },
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
    const existing = await prisma.mockTest.findUnique({
      where: { id },
      include: {
        exam: true,
        _count: { select: { attempts: true, questions: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
    }

    // Block deletion if students already attempted it
    const attemptsCount = existing._count.attempts;
    if (attemptsCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete mock test "${existing.name}". Students have already submitted ${attemptsCount} attempt(s) for this test.`,
        },
        { status: 400 }
      );
    }

    await prisma.mockTest.delete({
      where: { id },
    });

    await recordAuditLog(
      'MOCK_TEST_DELETE',
      `Deleted mock test "${existing.name}" (Test #${existing.testNumber}) from exam "${existing.exam.name}"`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({
      success: true,
      message: `Mock test "${existing.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting mock test:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete mock test.' },
      { status: 500 }
    );
  }
}
