import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { resolveOrCreateMockTest, recalculateMockStats } from '@/lib/mock-resolver';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { id } = await params;

  try {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        options: { orderBy: { optionLabel: 'asc' } },
        subject: true,
        topic: true,
        mockTest: true,
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({
      question: {
        id: question.id,
        mockTestId: question.mockTestId,
        subjectId: question.subjectId,
        subjectName: question.subject?.name,
        subjectNameHi: question.subject?.nameHi,
        topicId: question.topicId,
        topicName: question.topic?.name,
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        questionTextHi: question.questionTextHi,
        questionImage: question.questionImage,
        options: question.options.map((opt) => ({
          id: opt.id,
          label: opt.optionLabel,
          text: opt.optionText,
          textHi: opt.optionTextHi,
        })),
        correctOption: question.correctOption,
        marks: question.marks,
        negativeMarks: question.negativeMarks,
        difficulty: question.difficulty,
        explanation: question.explanation,
        explanationHi: question.explanationHi,
        solutionImage: question.solutionImage,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { id } = await params;
  const body = await req.json();

  try {
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        questionText: body.questionText,
        questionTextHi: body.questionTextHi,
        correctOption: body.correctOption ? (body.correctOption.toUpperCase() as any) : undefined,
        marks: body.marks !== undefined ? Number(body.marks) : undefined,
        negativeMarks: body.negativeMarks !== undefined ? Number(body.negativeMarks) : undefined,
        difficulty: body.difficulty ? (body.difficulty.toUpperCase() as any) : undefined,
        explanation: body.explanation,
        explanationHi: body.explanationHi,
        questionImage: body.questionImage,
        solutionImage: body.solutionImage,
      },
    });

    if (body.options && Array.isArray(body.options)) {
      for (const opt of body.options) {
        if (opt.label) {
          const label = opt.label.toUpperCase();
          await prisma.questionOption.upsert({
            where: {
              questionId_optionLabel: {
                questionId: id,
                optionLabel: label as any,
              },
            },
            update: {
              optionText: opt.text || '',
              optionTextHi: opt.textHi || opt.text || '',
            },
            create: {
              questionId: id,
              optionLabel: label as any,
              optionText: opt.text || '',
              optionTextHi: opt.textHi || opt.text || '',
            },
          });
        }
      }
    }

    await recalculateMockStats(existing.mockTestId);

    return NextResponse.json({ success: true, question: updated });
  } catch (err: any) {
    console.error('Failed to update question:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { id } = await params;

  try {
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    await prisma.question.delete({ where: { id } });
    await recalculateMockStats(existing.mockTestId);

    return NextResponse.json({ success: true, message: 'Question deleted successfully.' });
  } catch (err: any) {
    console.error('Failed to delete question:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete question' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { id } = await params;
  const { targetMockTestId } = await req.json();

  if (!targetMockTestId) {
    return NextResponse.json(
      { error: 'Target mock test ID is required to move question.' },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const targetMock = await resolveOrCreateMockTest({ mockTestId: targetMockTestId });

    const newQCount = await prisma.question.count({ where: { mockTestId: targetMock.id } });

    const updated = await prisma.question.update({
      where: { id },
      data: {
        mockTestId: targetMock.id,
        questionNumber: newQCount + 1,
      },
    });

    await recalculateMockStats(existing.mockTestId);
    await recalculateMockStats(targetMock.id);

    return NextResponse.json({
      success: true,
      message: `Question moved to mock test ${targetMock.name || targetMock.id}.`,
      question: updated,
    });
  } catch (err: any) {
    console.error('Failed to move question:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to move question.' },
      { status: 500 }
    );
  }
}
