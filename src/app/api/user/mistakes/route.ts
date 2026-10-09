import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mistakes = await prisma.mistakeBook.findMany({
      where: { userId: session.user.id },
      include: {
        question: {
          include: {
            options: {
              orderBy: { optionLabel: 'asc' },
            },
            subject: true,
            topic: true,
          },
        },
        attempt: {
          select: {
            id: true,
            mockTestId: true,
            startedAt: true,
            submittedAt: true,
            mockTest: { select: { name: true, testNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also fetch the specific userAnswer for these mistakes to get the student's selected wrong option
    const userAnswers = await prisma.userAnswer.findMany({
      where: {
        attemptId: { in: mistakes.map((m) => m.attemptId) },
        questionId: { in: mistakes.map((m) => m.questionId) },
      },
      select: {
        attemptId: true,
        questionId: true,
        selectedOption: true,
      },
    });

    const userAnsMap = new Map<string, string | null>();
    userAnswers.forEach((ans) => {
      userAnsMap.set(`${ans.attemptId}_${ans.questionId}`, ans.selectedOption);
    });

    const formatted = mistakes.map((m) => {
      const q = m.question;
      const selectedOption = userAnsMap.get(`${m.attemptId}_${m.questionId}`) || null;

      return {
        id: m.id,
        questionId: q.id,
        attemptId: m.attemptId,
        testName: m.attempt?.mockTest?.name || 'Full Mock Test',
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        questionTextHi: q.questionTextHi || q.questionText,
        subjectName: q.subject?.name || 'General Awareness',
        topicName: q.topic?.name || 'General',
        options: q.options.map((opt) => ({
          id: opt.id,
          label: opt.optionLabel,
          text: opt.optionText,
          textHi: opt.optionTextHi || opt.optionText,
        })),
        correctOption: q.correctOption,
        userAnswer: selectedOption,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        explanation: q.explanation || '',
        explanationHi: q.explanationHi || '',
        isMastered: m.isMastered,
        createdAt: m.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ mistakes: formatted });
  } catch (err: any) {
    console.error('Error fetching mistakes:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch mistakes from database' },
      { status: 500 }
    );
  }
}
