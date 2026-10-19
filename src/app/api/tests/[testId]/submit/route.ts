import { NextRequest, NextResponse } from 'next/server';
import { Prisma, CorrectOption } from '@prisma/client';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { resolveOrCreateMockTest } from '@/lib/mock-resolver';

export const dynamic = 'force-dynamic';

function parseCorrectOption(val: unknown): CorrectOption | null {
  if (val === 'A' || val === 'B' || val === 'C' || val === 'D') return val as CorrectOption;
  if (val === 0) return 'A' as CorrectOption;
  if (val === 1) return 'B' as CorrectOption;
  if (val === 2) return 'C' as CorrectOption;
  if (val === 3) return 'D' as CorrectOption;
  if (typeof val === 'string') {
    const upper = val.toUpperCase().trim();
    if (upper === 'A' || upper === 'B' || upper === 'C' || upper === 'D') return upper as CorrectOption;
  }
  return null;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ testId: string }> }
) {
  const reqStart = performance.now();
  const correlationId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    // 1. Authenticate student
    const tAuthStart = performance.now();
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to submit your test.' },
        { status: 401 }
      );
    }
    const tAuthMs = parseFloat((performance.now() - tAuthStart).toFixed(2));

    const { testId } = await context.params;
    const body = await req.json();
    const {
      attemptId: reqAttemptId,
      answers = {},
      timeTaken = 0,
      isAutoSubmit = false,
      bookmarkedIds = [],
    } = body;

    // 2. Parallel Pre-flight Lookups: Fetch User, MockTest, Attempt, and Questions concurrently
    const tLookupStart = performance.now();
    const [userRecord, resolvedMockTest, existingAttempt, dbQuestions] = await Promise.all([
      // Lookup user
      prisma.user.findFirst({
        where: {
          OR: [
            ...(session.user.id ? [{ id: session.user.id }] : []),
            ...(session.user.email ? [{ email: session.user.email }] : []),
          ],
        },
        select: { id: true, email: true },
      }),
      // Resolve mock test
      resolveOrCreateMockTest({ mockTestId: testId }),
      // Check attempt if reqAttemptId provided
      reqAttemptId
        ? prisma.testAttempt.findUnique({
            where: { id: reqAttemptId },
            select: {
              id: true,
              userId: true,
              mockTestId: true,
              status: true,
              deadline: true,
              score: true,
              totalMarks: true,
              correctCount: true,
              wrongCount: true,
              unansweredCount: true,
              accuracy: true,
              percentage: true,
              timeTakenSeconds: true,
              submittedAt: true,
            },
          })
        : null,
      // Fetch questions required for scoring with lean select (avoids heavy 400-option & taxonomy joins)
      prisma.question.findMany({
        where: { mockTestId: testId },
        select: {
          id: true,
          questionNumber: true,
          questionText: true,
          correctOption: true,
          marks: true,
          negativeMarks: true,
          subjectId: true,
        },
        orderBy: { questionNumber: 'asc' },
      }),
    ]);
    const tLookupMs = parseFloat((performance.now() - tLookupStart).toFixed(2));

    if (!userRecord) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }
    if (!resolvedMockTest) {
      return NextResponse.json({ error: 'Test not found.' }, { status: 404 });
    }

    const mockTest = resolvedMockTest;
    let attempt = existingAttempt;

    // Security: Validate ownership and mockTest association before any idempotency or write execution
    if (attempt) {
      if (attempt.userId !== userRecord.id) {
        return NextResponse.json(
          { error: 'Forbidden. This attempt does not belong to your account.' },
          { status: 403 }
        );
      }
      if (attempt.mockTestId && attempt.mockTestId !== mockTest.id) {
        return NextResponse.json(
          { error: 'Invalid attempt. This attempt does not belong to the specified test.' },
          { status: 400 }
        );
      }
    }

    // 3. IDEMPOTENCY GUARD: If already submitted, return cached results immediately (0ms write time)
    if (attempt && (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED')) {
      const totalElapsedMs = parseFloat((performance.now() - reqStart).toFixed(2));
      console.log(
        JSON.stringify({
          level: 'info',
          type: 'SUBMISSION_IDEMPOTENT_HIT',
          correlationId,
          testId,
          attemptId: attempt.id,
          status: attempt.status,
          totalElapsedMs,
        })
      );

      const cachedResponse = NextResponse.json({
        success: true,
        attemptId: attempt.id,
        alreadySubmitted: true,
        result: {
          attemptId: attempt.id,
          testId: mockTest.id,
          testName: mockTest.name,
          submittedAt: attempt.submittedAt?.toISOString(),
          status: attempt.status,
          isAutoSubmit: attempt.status === 'AUTO_SUBMITTED',
          totalQuestions: dbQuestions.length,
          correctCount: attempt.correctCount ?? 0,
          wrongCount: attempt.wrongCount ?? 0,
          unansweredCount: attempt.unansweredCount ?? 0,
          score: attempt.score ?? 0,
          totalPossibleMarks: attempt.totalMarks ?? mockTest.totalMarks,
          percentage: attempt.percentage ?? 0,
          accuracy: attempt.accuracy ?? 0,
          timeTaken: attempt.timeTakenSeconds ?? timeTaken,
        },
      });
      cachedResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return cachedResponse;
    }

    // 4. Fallback attempt resolution if not found by reqAttemptId
    if (!attempt) {
      attempt = await prisma.testAttempt.findFirst({
        where: {
          userId: userRecord.id,
          mockTestId: mockTest.id,
          status: 'IN_PROGRESS',
        },
        orderBy: { startedAt: 'desc' },
      });
    }

    const now = new Date();

    if (!attempt) {
      // If none existed, create a new attempt record
      attempt = await prisma.testAttempt.create({
        data: {
          userId: userRecord.id,
          mockTestId: mockTest.id,
          startedAt: new Date(now.getTime() - (timeTaken || 1) * 1000),
          deadline: now,
          status: 'IN_PROGRESS',
        },
      });
    }

    // 5. Authoritative Evaluation & Deadline Check
    const tEvalStart = performance.now();
    const deadline = new Date(attempt.deadline);
    const isPastDeadline = now.getTime() > deadline.getTime() + 15000; // 15 sec buffer for network
    const finalStatus = isAutoSubmit || isPastDeadline ? 'AUTO_SUBMITTED' : 'SUBMITTED';

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let rawScore = 0;
    let totalPossibleMarks = 0;

    const defaultMarks = mockTest.marksPerQuestion ?? mockTest.exam?.marksPerQuestion ?? 1;
    const defaultNegMarks = mockTest.negativeMarksPerQuestion ?? mockTest.exam?.negativeMarking ?? 0.25;

    const evaluatedAnswers = dbQuestions.map((q) => {
      const userAnsObj = answers[q.id];
      const rawSelected = userAnsObj?.selectedOption;
      const selectedOption = parseCorrectOption(rawSelected);
      const isAnswered = selectedOption !== null;
      const isCorrect = isAnswered && selectedOption === q.correctOption;

      const effMarks =
        q.marks !== undefined && q.marks !== null && !isNaN(q.marks) && q.marks > 0
          ? q.marks
          : defaultMarks;

      const effNegMarks =
        q.negativeMarks !== undefined && q.negativeMarks !== null && !isNaN(q.negativeMarks) && q.negativeMarks >= 0
          ? q.negativeMarks
          : defaultNegMarks;

      totalPossibleMarks += effMarks;

      if (!isAnswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
        rawScore += effMarks;
      } else {
        wrongCount++;
        rawScore -= effNegMarks;
      }

      return {
        questionId: q.id,
        selectedOption,
        isMarkedForReview:
          userAnsObj?.status === 'MARKED_FOR_REVIEW' ||
          userAnsObj?.status === 'ANSWERED_AND_MARKED',
        status: userAnsObj?.status || (isAnswered ? 'ANSWERED' : 'NOT_ANSWERED'),
        timeSpentSeconds: userAnsObj?.timeSpent || 0,
        questionTextSnapshot: q.questionText,
        correctOptionSnapshot: q.correctOption,
        marksSnapshot: effMarks,
        negativeMarksSnapshot: effNegMarks,
        isCorrect,
        isAnswered,
      };
    });

    const finalScore = Math.max(0, parseFloat(rawScore.toFixed(2)));
    const percentage =
      totalPossibleMarks > 0
        ? parseFloat(((finalScore / totalPossibleMarks) * 100).toFixed(1))
        : 0;
    const accuracy =
      correctCount + wrongCount > 0
        ? parseFloat(((correctCount / (correctCount + wrongCount)) * 100).toFixed(1))
        : 0;

    const tEvalMs = parseFloat((performance.now() - tEvalStart).toFixed(2));

    // 6. Atomic Batched Transaction (Single round-trip pipeline via prisma.$transaction([ ... ]))
    const tTxStart = performance.now();
    const userAnswersData = evaluatedAnswers.map((ans) => ({
      attemptId: attempt.id,
      questionId: ans.questionId,
      selectedOption: ans.selectedOption,
      isMarkedForReview: ans.isMarkedForReview,
      status: ans.status,
      timeSpentSeconds: ans.timeSpentSeconds,
      questionTextSnapshot: ans.questionTextSnapshot,
      correctOptionSnapshot: ans.correctOptionSnapshot,
      marksSnapshot: ans.marksSnapshot,
      negativeMarksSnapshot: ans.negativeMarksSnapshot,
      isCorrect: ans.isCorrect,
    }));

    const wrongResults = evaluatedAnswers.filter((ans) => ans.isAnswered && !ans.isCorrect);
    const mistakesData = wrongResults.map((res) => ({
      userId: userRecord.id,
      questionId: res.questionId,
      attemptId: attempt.id,
      isMastered: false,
    }));

    const validBookmarks = Array.isArray(bookmarkedIds)
      ? bookmarkedIds
          .filter((qId): qId is string => typeof qId === 'string' && qId.length > 0)
          .map((qId) => ({
            userId: userRecord.id,
            questionId: qId,
          }))
      : [];

    // Bundle all operations in one non-interactive array transaction to avoid PgBouncer connection holding
    const txOperations: Prisma.PrismaPromise<unknown>[] = [
      prisma.testAttempt.update({
        where: { id: attempt.id },
        data: {
          status: finalStatus,
          submittedAt: now,
          score: finalScore,
          totalMarks: totalPossibleMarks,
          correctCount,
          wrongCount,
          unansweredCount,
          accuracy,
          percentage,
          timeTakenSeconds: timeTaken,
        },
      }),
      prisma.userAnswer.deleteMany({
        where: { attemptId: attempt.id },
      }),
      prisma.userAnswer.createMany({
        data: userAnswersData,
      }),
    ];

    if (mistakesData.length > 0) {
      txOperations.push(
        prisma.mistakeBook.createMany({
          data: mistakesData,
          skipDuplicates: true,
        })
      );
    }

    if (validBookmarks.length > 0) {
      txOperations.push(
        prisma.bookmark.createMany({
          data: validBookmarks,
          skipDuplicates: true,
        })
      );
    }

    await prisma.$transaction(txOperations);
    const tTxMs = parseFloat((performance.now() - tTxStart).toFixed(2));

    const totalElapsedMs = parseFloat((performance.now() - reqStart).toFixed(2));

    // Structured performance log for production observability (Zero PII or tokens logged)
    console.log(
      JSON.stringify({
        level: 'info',
        type: 'SUBMISSION_PERF',
        correlationId,
        testId: mockTest.id,
        attemptId: attempt.id,
        timings: {
          authMs: tAuthMs,
          lookupMs: tLookupMs,
          evalMs: tEvalMs,
          transactionMs: tTxMs,
          totalMs: totalElapsedMs,
        },
        counts: {
          totalQuestions: dbQuestions.length,
          correctCount,
          wrongCount,
          unansweredCount,
          mistakesRecorded: mistakesData.length,
          bookmarksRecorded: validBookmarks.length,
        },
      })
    );

    const submissionData = {
      attemptId: attempt.id,
      testId: mockTest.id,
      testName: mockTest.name,
      submittedAt: now.toISOString(),
      status: finalStatus,
      isAutoSubmit: finalStatus === 'AUTO_SUBMITTED',
      totalQuestions: dbQuestions.length,
      correctCount,
      wrongCount,
      unansweredCount,
      score: finalScore,
      totalPossibleMarks,
      percentage,
      accuracy,
      timeTaken,
    };

    const response = NextResponse.json({
      success: true,
      attemptId: attempt.id,
      result: submissionData,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: unknown) {
    const totalElapsedMs = parseFloat((performance.now() - reqStart).toFixed(2));
    const errorMessage = err instanceof Error ? err.message : 'Unknown submission error';
    console.error(
      JSON.stringify({
        level: 'error',
        type: 'SUBMISSION_ERROR',
        correlationId,
        error: errorMessage,
        elapsedMs: totalElapsedMs,
      })
    );
    return NextResponse.json(
      { error: errorMessage || 'Submission evaluation failed.' },
      { status: 500 }
    );
  }
}
