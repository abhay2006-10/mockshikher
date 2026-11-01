import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const limit = typeof body.limit === 'number' && body.limit > 0 ? Math.min(body.limit, 20) : 10;
    const subjectId = body.subjectId && typeof body.subjectId === 'string' ? body.subjectId : undefined;

    // Fetch unmastered mistakes for practice session
    const mistakes = await prisma.mistakeBook.findMany({
      where: {
        userId,
        isMastered: false,
        ...(subjectId ? { question: { subjectId } } : {}),
      },
      include: {
        question: {
          include: {
            options: {
              orderBy: { optionLabel: 'asc' },
            },
            subject: { select: { id: true, name: true } },
            topic: { select: { id: true, name: true } },
          },
        },
        attempt: {
          select: {
            mockTest: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (mistakes.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        questions: [],
        message: 'No unrevised mistakes found to practice.',
      });
    }

    // Map to practice question items
    const questions = mistakes.map((m, index) => {
      const q = m.question;
      return {
        id: q.id,
        mistakeId: m.id,
        questionNumber: index + 1,
        originalQuestionNumber: q.questionNumber,
        originalTestName: m.attempt?.mockTest?.name || 'Mock Test',
        questionText: q.questionText,
        questionTextHi: q.questionTextHi || q.questionText,
        subjectId: q.subjectId,
        subjectName: q.subject?.name || 'General Awareness',
        topicName: q.topic?.name || 'General',
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        options: q.options.map((opt) => ({
          id: opt.id,
          label: opt.optionLabel,
          text: opt.optionText,
          textHi: opt.optionTextHi || opt.optionText,
        })),
        correctOption: q.correctOption,
        explanation: q.explanation || '',
        explanationHi: q.explanationHi || '',
      };
    });

    return NextResponse.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create practice session';
    console.error('Error generating practice mistakes session:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

