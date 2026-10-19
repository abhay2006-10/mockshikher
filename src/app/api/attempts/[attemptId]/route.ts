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

    const isSummaryOnly = req.nextUrl.searchParams.get('summary') === 'true';

    let attempt;
    if (isSummaryOnly) {
      attempt = await prisma.testAttempt.findUnique({
        where: { id: attemptId },
        include: {
          mockTest: {
            include: { exam: true },
          },
        },
      });
    } else {
      attempt = await prisma.testAttempt.findUnique({
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
    }

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

interface OptionItem {
  id: string;
  optionLabel: number;
  optionText: string;
  optionTextHi: string | null;
}

interface AttemptAnswerItem {
  questionId: string;
  selectedOption: number | null;
  correctOptionSnapshot: number | null;
  questionTextSnapshot: string | null;
  marksSnapshot: number | null;
  negativeMarksSnapshot: number | null;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
  question: {
    id: string;
    questionNumber: number;
    questionText: string;
    questionTextHi: string | null;
    correctOption: number;
    subjectId: string;
    marks: number;
    negativeMarks: number;
    explanation: string | null;
    explanationHi: string | null;
    subject: { name: string } | null;
    topic: { name: string } | null;
    options: OptionItem[];
  };
}

interface QuestionResultItem {
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionTextHi: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  options: {
    id: string;
    label: number;
    text: string;
    textHi: string | null;
  }[];
  userAnswer: number | null;
  correctOption: number;
  isCorrect: boolean;
  isAnswered: boolean;
  marks: number;
  negativeMarks: number;
  explanation: string;
  explanationHi: string;
  timeSpent: number;
}

    let bookmarkedIds: string[] = [];
    let questionResults: QuestionResultItem[] = [];

    const attemptWithAnswers = attempt as typeof attempt & { answers?: AttemptAnswerItem[] };

    if (!isSummaryOnly && Array.isArray(attemptWithAnswers.answers)) {
      const answersList = attemptWithAnswers.answers;
      // Fetch user's bookmarks for these questions
      const userBookmarks = await prisma.bookmark.findMany({
        where: {
          userId: session.user.id,
          questionId: {
            in: answersList.map((a) => a.questionId),
          },
        },
        select: { questionId: true },
      });
      bookmarkedIds = userBookmarks.map((b) => b.questionId);

      questionResults = answersList.map((ans) => {
        const q = ans.question;
        const isAnswered = ans.selectedOption !== null && ans.selectedOption !== undefined;
        const correctOpt = ans.correctOptionSnapshot ?? q.correctOption;

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
    }

    const examData = attempt.mockTest.exam as { name?: string; slug?: string; price?: number; totalMocks?: number } | null;

    const result = {
      attemptId: attempt.id,
      testId: attempt.mockTestId,
      testName: attempt.mockTest.name,
      examId: attempt.mockTest.examId,
      examName: examData?.name || 'HP Competitive Exam',
      examSlug: examData?.slug || 'hp-patwari',
      examPrice: examData?.price || 199,
      examTotalMocks: examData?.totalMocks || 10,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() || attempt.startedAt.toISOString(),
      status: attempt.status,
      isAutoSubmit: attempt.status === 'AUTO_SUBMITTED',
      totalQuestions: isSummaryOnly ? attempt.mockTest.totalQuestions : questionResults.length,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch test attempt.';
    console.error('Error fetching attempt:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
