import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { attemptId } = await context.params;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockTest: {
          include: { exam: true },
        },
        answers: {
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
          },
          orderBy: { question: { questionNumber: 'asc' } },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Test attempt not found.' }, { status: 404 });
    }

    // Security: Only the user who took this attempt can view it (Requirement 1)
    if (attempt.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to view this test attempt.' },
        { status: 403 }
      );
    }

    // Security: Only submitted attempts can be reviewed with answers (Requirement 5)
    if (attempt.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'This test attempt is still in progress and cannot be reviewed yet.' },
        { status: 400 }
      );
    }

    // Fetch user's bookmarks for these questions
    const userBookmarks = await prisma.bookmark.findMany({
      where: {
        userId: session.user.id,
        questionId: {
          in: attempt.answers.map((a) => a.questionId),
        },
      },
      select: { questionId: true },
    });
    const bookmarkedIds = userBookmarks.map((b) => b.questionId);

    const questionResults = attempt.answers.map((ans) => {
      const q = ans.question;
      const isAnswered = ans.selectedOption !== null && ans.selectedOption !== undefined;
      const correctOpt = ans.correctOptionSnapshot || q.correctOption;

      return {
        questionId: q.id,
        questionNumber: q.questionNumber,
        questionText: ans.questionTextSnapshot || q.questionText,
        questionTextHi: q.questionTextHi || q.questionText,
        subjectId: q.subjectId,
        subjectName: q.subject?.name || 'General Awareness',
        topicName: q.topic?.name || 'General',
        options: q.options.map((opt) => ({
          id: opt.id,
          label: opt.optionLabel,
          text: opt.optionText,
          textHi: opt.optionTextHi,
        })),
        userAnswer: ans.selectedOption,
        correctOption: correctOpt,
        isCorrect: ans.isCorrect ?? (isAnswered && ans.selectedOption === correctOpt),
        isAnswered,
        marks: ans.marksSnapshot ?? q.marks,
        negativeMarks: ans.negativeMarksSnapshot ?? q.negativeMarks,
        explanation: q.explanation || '',
        explanationHi: q.explanationHi || '',
        timeSpent: ans.timeSpentSeconds,
      };
    });

    const result = {
      attemptId: attempt.id,
      testId: attempt.mockTestId,
      testName: attempt.mockTest.name,
      examId: attempt.mockTest.examId,
      examName: attempt.mockTest.exam?.name || 'HP Competitive Exam',
      examSlug: attempt.mockTest.exam?.slug || 'hp-patwari',
      examPrice: attempt.mockTest.exam?.price || 200,
      examTotalMocks: (attempt.mockTest.exam as any)?.totalMocks || 10,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() || attempt.startedAt.toISOString(),
      status: attempt.status,
      isAutoSubmit: attempt.status === 'AUTO_SUBMITTED',
      totalQuestions: questionResults.length,
      correctCount: attempt.correctCount ?? 0,
      wrongCount: attempt.wrongCount ?? 0,
      unansweredCount: attempt.unansweredCount ?? 0,
      score: attempt.score ?? 0,
      totalPossibleMarks: attempt.totalMarks ?? attempt.mockTest.totalMarks,
      percentage: attempt.percentage ?? 0,
      accuracy: attempt.accuracy ?? 0,
      timeTaken: attempt.timeTakenSeconds ?? 0,
      bookmarkedIds,
      questionResults,
    };

    const response = NextResponse.json({ success: true, result });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: any) {
    console.error('Error fetching attempt:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch test attempt.' },
      { status: 500 }
    );
  }
}
