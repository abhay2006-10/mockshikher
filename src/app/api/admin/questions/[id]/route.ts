import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { resolveOrCreateMockTest, recalculateMockStats } from '@/lib/mock-resolver';
import { recordAuditLog } from '@/lib/audit';

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
    const existing = await prisma.question.findUnique({
      where: { id },
      include: { mockTest: { include: { exam: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    if (body.marks !== undefined) {
      const m = Number(body.marks);
      if (isNaN(m) || m <= 0) {
        return NextResponse.json({ error: 'Marks must be greater than 0.' }, { status: 400 });
      }
    }

    if (body.negativeMarks !== undefined) {
      const nm = Number(body.negativeMarks);
      if (isNaN(nm) || nm < 0 || nm > 5) {
        return NextResponse.json({ error: 'Negative marking must be between 0 and 5.' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (body.questionText !== undefined) updateData.questionText = body.questionText;
    if (body.questionTextHi !== undefined) updateData.questionTextHi = body.questionTextHi;
    if (body.correctOption !== undefined) updateData.correctOption = body.correctOption.toUpperCase();
    if (body.marks !== undefined) updateData.marks = Number(body.marks);
    if (body.negativeMarks !== undefined) updateData.negativeMarks = Number(body.negativeMarks);
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty.toUpperCase();
    if (body.explanation !== undefined) updateData.explanation = body.explanation;
    if (body.explanationHi !== undefined) updateData.explanationHi = body.explanationHi;
    if (body.questionImage !== undefined) updateData.questionImage = body.questionImage;
    if (body.solutionImage !== undefined) updateData.solutionImage = body.solutionImage;

    // Handle subject & topic update
    if (body.subjectId) {
      updateData.subjectId = body.subjectId;
    } else if (body.subjectName) {
      const cleanSubj = body.subjectName.trim();
      let subj = await prisma.subject.findFirst({
        where: { examId: existing.mockTest.examId, name: { equals: cleanSubj, mode: 'insensitive' } },
      });
      if (!subj) {
        subj = await prisma.subject.create({
          data: { examId: existing.mockTest.examId, name: cleanSubj, nameHi: cleanSubj },
        });
      }
      updateData.subjectId = subj.id;
    }

    if (body.topicId) {
      updateData.topicId = body.topicId;
    } else if (body.topicName && updateData.subjectId) {
      const cleanTopic = body.topicName.trim();
      let topic = await prisma.topic.findFirst({
        where: { subjectId: updateData.subjectId, name: { equals: cleanTopic, mode: 'insensitive' } },
      });
      if (!topic) {
        topic = await prisma.topic.create({
          data: { subjectId: updateData.subjectId, name: cleanTopic, nameHi: cleanTopic },
        });
      }
      updateData.topicId = topic.id;
    }

    const updated = await prisma.question.update({
      where: { id },
      data: updateData,
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

    await recordAuditLog(
      'QUESTION_UPDATE',
      `Updated question #${existing.questionNumber} (${updated.questionText.substring(0, 35)}...)`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

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
    const existing = await prisma.question.findUnique({
      where: { id },
      include: {
        mockTest: true,
        _count: { select: { userAnswers: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Refuse to delete if student answers already exist
    const answersCount = existing._count.userAnswers;
    if (answersCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete Question #${existing.questionNumber}: students have already attempted and answered this question in ${answersCount} test attempt(s).`,
        },
        { status: 400 }
      );
    }

    const mockTestId = existing.mockTestId;

    // Delete the question and its options
    await prisma.question.delete({ where: { id } });

    // Renumber remaining questions in this mock test so numbering stays consistent (1, 2, 3...)
    const remainingQuestions = await prisma.question.findMany({
      where: { mockTestId },
      orderBy: { questionNumber: 'asc' },
      select: { id: true, questionNumber: true },
    });

    for (let i = 0; i < remainingQuestions.length; i++) {
      const targetNumber = i + 1;
      if (remainingQuestions[i].questionNumber !== targetNumber) {
        await prisma.question.update({
          where: { id: remainingQuestions[i].id },
          data: { questionNumber: targetNumber },
        });
      }
    }

    await recalculateMockStats(mockTestId);

    await recordAuditLog(
      'QUESTION_DELETE',
      `Deleted question #${existing.questionNumber} from mock test "${existing.mockTest.name}". Renumbered remaining ${remainingQuestions.length} questions.`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({
      success: true,
      message: `Question #${existing.questionNumber} deleted successfully. Numbering updated.`,
    });
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

    await recordAuditLog(
      'QUESTION_MOVE',
      `Moved question from mock test "${existing.mockTestId}" to "${targetMock.name}"`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

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
