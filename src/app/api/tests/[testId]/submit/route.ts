import { NextRequest, NextResponse } from 'next/server';
import { CorrectOption } from '@prisma/client';
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

interface InFlightSubmissionResult {
  status: number;
  body: Record<string, unknown>;
}

// In-flight mutex Map to serialize/join duplicate concurrent requests for the same attempt in this Node process
const globalForSubmissions = globalThis as unknown as {
  _inFlightSubmissions?: Map<string, Promise<InFlightSubmissionResult>>;
};
if (!globalForSubmissions._inFlightSubmissions) {
  globalForSubmissions._inFlightSubmissions = new Map();
}
const inFlightSubmissions = globalForSubmissions._inFlightSubmissions;

const attemptSelectFields = {
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
  _count: {
    select: {
      answers: true,
    },
  },
} as const;

interface AttemptRecord {
  id: string;
  userId: string;
  mockTestId: string;
  status: string;
  deadline: Date;
  score: number | null;
  totalMarks: number | null;
  correctCount: number | null;
  wrongCount: number | null;
  unansweredCount: number | null;
  accuracy: number | null;
  percentage: number | null;
  timeTakenSeconds: number | null;
  submittedAt: Date | null;
  _count?: {
    answers: number;
  };
}

interface MockTestRecord {
  id: string;
  name: string;
  totalMarks?: number | null;
  marksPerQuestion?: number | null;
  negativeMarksPerQuestion?: number | null;
  exam?: {
    marksPerQuestion?: number | null;
    negativeMarking?: number | null;
  } | null;
}

function buildScorecardResult(
  attempt: AttemptRecord,
  mockTest: MockTestRecord,
  totalQuestions: number,
  fallbackTimeTaken: number
) {
  return {
    attemptId: attempt.id,
    testId: mockTest.id,
    testName: mockTest.name,
    submittedAt: attempt.submittedAt?.toISOString() || new Date().toISOString(),
    status: attempt.status,
    isAutoSubmit: attempt.status === 'AUTO_SUBMITTED',
    totalQuestions,
    correctCount: attempt.correctCount ?? 0,
    wrongCount: attempt.wrongCount ?? 0,
    unansweredCount: attempt.unansweredCount ?? 0,
    score: attempt.score ?? 0,
    totalPossibleMarks: attempt.totalMarks ?? mockTest.totalMarks ?? 0,
    percentage: attempt.percentage ?? 0,
    accuracy: attempt.accuracy ?? 0,
    timeTaken: attempt.timeTakenSeconds ?? fallbackTimeTaken,
  };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ testId: string }> }
) {
  const reqStart = performance.now();
  const correlationId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  let flightRegisteredKey: string | null = null;
  let resolveFlight: ((val: InFlightSubmissionResult) => void) | undefined;
  let rejectFlight: ((err: unknown) => void) | undefined;

  let routeTestId = '';
  let inputAttemptId = '';
  let targetAttemptId = '';
  let currentTxStep = 'pre_transaction';
  let tTxStart = 0;
  let stepStartMs = reqStart;
  let tUpdateMs = 0;
  let tDeleteAnswersMs = 0;
  let deletedAnswersCount = 0;
  let tCreateAnswersMs = 0;
  let createdAnswersCount = 0;
  let tMistakesMs = 0;
  let mistakesInsertedCount = 0;
  let tBookmarksMs = 0;
  let bookmarksInsertedCount = 0;

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
    routeTestId = testId;
    const body = await req.json();
    const {
      attemptId: reqAttemptId,
      answers = {},
      timeTaken = 0,
      isAutoSubmit = false,
      bookmarkedIds = [],
    } = body;
    inputAttemptId = typeof reqAttemptId === 'string' ? reqAttemptId : '';

    // Diagnostic start log (Zero PII or tokens)
    console.log(
      JSON.stringify({
        level: 'info',
        type: 'SUBMISSION_START',
        correlationId,
        testId,
        attemptId: reqAttemptId || 'unspecified',
        isAutoSubmit,
      })
    );

    // Fast-path In-Flight Mutex: Deduplicate immediately at entry if attemptId is present
    if (reqAttemptId && typeof reqAttemptId === 'string') {
      const earlyFlight = inFlightSubmissions.get(reqAttemptId);
      if (earlyFlight) {
        console.log(
          JSON.stringify({
            level: 'info',
            type: 'SUBMISSION_DUPLICATE_IN_FLIGHT_JOIN',
            correlationId,
            testId,
            attemptId: reqAttemptId,
            isDuplicate: true,
            stage: 'early_entry',
            message: 'Concurrent submission joined active in-flight execution at entry',
          })
        );
        const flightResult = await earlyFlight;
        const res = NextResponse.json(flightResult.body, { status: flightResult.status });
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return res;
      }
    }

    // 2. Parallel Pre-flight Lookups: Fetch User, MockTest, Attempt, and Questions concurrently
    const tLookupStart = performance.now();
    const [userRecord, resolvedMockTest, existingAttempt] = await Promise.all([
      prisma.user.findFirst({
        where: {
          OR: [
            ...(session.user.id ? [{ id: session.user.id }] : []),
            ...(session.user.email ? [{ email: session.user.email }] : []),
          ],
        },
        select: { id: true, email: true },
      }),
      resolveOrCreateMockTest({ mockTestId: testId }),
      reqAttemptId && typeof reqAttemptId === 'string'
        ? prisma.testAttempt.findUnique({
            where: { id: reqAttemptId },
            select: attemptSelectFields,
          })
        : null,
    ]);

    if (!userRecord) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }
    if (!resolvedMockTest) {
      return NextResponse.json({ error: 'Test not found.' }, { status: 404 });
    }

    const mockTest = resolvedMockTest as MockTestRecord;
    let attempt = existingAttempt as AttemptRecord | null;

    // Fetch questions belonging to this resolved mock test ID
    const dbQuestions = await prisma.question.findMany({
      where: { mockTestId: mockTest.id },
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
    });
    const tLookupMs = parseFloat((performance.now() - tLookupStart).toFixed(2));

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
          testId: mockTest.id,
          attemptId: attempt.id,
          status: attempt.status,
          isDuplicate: true,
          totalElapsedMs,
        })
      );

      const cachedResult = buildScorecardResult(attempt, mockTest, dbQuestions.length, timeTaken);
      const cachedResponse = NextResponse.json({
        success: true,
        attemptId: attempt.id,
        alreadySubmitted: true,
        result: cachedResult,
      });
      cachedResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return cachedResponse;
    }

    // 4. Fallback attempt resolution if not found by reqAttemptId
    if (!attempt) {
      attempt = (await prisma.testAttempt.findFirst({
        where: {
          userId: userRecord.id,
          mockTestId: mockTest.id,
        },
        orderBy: { startedAt: 'desc' },
        select: attemptSelectFields,
      })) as AttemptRecord | null;

      // If the latest attempt is already submitted, return it through the idempotency guard
      if (attempt && (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED')) {
        const totalElapsedMs = parseFloat((performance.now() - reqStart).toFixed(2));
        console.log(
          JSON.stringify({
            level: 'info',
            type: 'SUBMISSION_IDEMPOTENT_HIT',
            correlationId,
            testId: mockTest.id,
            attemptId: attempt.id,
            status: attempt.status,
            isDuplicate: true,
            totalElapsedMs,
          })
        );
        const cachedResult = buildScorecardResult(attempt, mockTest, dbQuestions.length, timeTaken);
        const cachedResponse = NextResponse.json({
          success: true,
          attemptId: attempt.id,
          alreadySubmitted: true,
          result: cachedResult,
        });
        cachedResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        return cachedResponse;
      }
    }

    const now = new Date();

    if (!attempt) {
      // If none existed, create a new attempt record
      attempt = (await prisma.testAttempt.create({
        data: {
          userId: userRecord.id,
          mockTestId: mockTest.id,
          startedAt: new Date(now.getTime() - (timeTaken || 1) * 1000),
          deadline: now,
          status: 'IN_PROGRESS',
        },
        select: attemptSelectFields,
      })) as AttemptRecord;
    }

    targetAttemptId = attempt.id;

    // 5. IN-FLIGHT MUTEX GUARD: Deduplicate concurrent requests for the exact same attempt in this Node process
    const existingFlight = inFlightSubmissions.get(targetAttemptId);
    if (existingFlight) {
      console.log(
        JSON.stringify({
          level: 'info',
          type: 'SUBMISSION_DUPLICATE_IN_FLIGHT_JOIN',
          correlationId,
          testId: mockTest.id,
          attemptId: targetAttemptId,
          isDuplicate: true,
          stage: 'resolved_attempt',
          message: 'Concurrent submission detected; joined active in-flight execution',
        })
      );
      const flightResult = await existingFlight;
      const res = NextResponse.json(flightResult.body, { status: flightResult.status });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res;
    }

    // Register active in-flight submission promise
    const flightPromise = new Promise<InFlightSubmissionResult>((resolve, reject) => {
      resolveFlight = resolve;
      rejectFlight = reject;
    });
    // Prevent unhandled rejection warning if no concurrent request joins before failure
    flightPromise.catch(() => {});
    flightRegisteredKey = targetAttemptId;
    inFlightSubmissions.set(targetAttemptId, flightPromise);
    if (reqAttemptId && reqAttemptId !== targetAttemptId) {
      inFlightSubmissions.set(reqAttemptId, flightPromise);
    }

    // Check if there are existing answers to delete (avoids unnecessary round trip if empty)
    const hasExistingAnswers = (attempt._count?.answers ?? 0) > 0;

    // 6. Authoritative Evaluation & Scoring (Performed outside DB transaction to avoid connection holding)
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

    // 7. Atomic Batched Database Transaction
    const userAnswersData = evaluatedAnswers.map((ans) => ({
      attemptId: targetAttemptId,
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
      attemptId: targetAttemptId,
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

    tTxStart = performance.now();
    currentTxStep = 'tx_acquisition';
    stepStartMs = tTxStart;
    console.log(
      JSON.stringify({
        level: 'info',
        type: 'SUBMISSION_TX_START',
        correlationId,
        attemptId: targetAttemptId,
        counts: {
          questions: userAnswersData.length,
          mistakes: mistakesData.length,
          bookmarks: validBookmarks.length,
          hasExistingAnswers,
        },
      })
    );

    const txResult = await prisma.$transaction(
      async (tx) => {
        currentTxStep = 'tx_entered';
        stepStartMs = performance.now();

        // Transaction-local PostgreSQL diagnostic limits:
        // lock_timeout (5s): fails fast with 55P03 if waiting for a table/row lock
        // statement_timeout (15s): fails fast with 57014 if individual statement execution stalls
        // Parameter settings automatically revert on COMMIT or ROLLBACK in PostgreSQL
        await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '5s';`);
        await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '15s';`);

        // 1. Atomic state transition: Only update if status is still IN_PROGRESS
        currentTxStep = 'update_attempt_status';
        stepStartMs = performance.now();
        const updateResult = await tx.testAttempt.updateMany({
          where: {
            id: targetAttemptId,
            status: 'IN_PROGRESS',
          },
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
        });
        tUpdateMs = parseFloat((performance.now() - stepStartMs).toFixed(2));

        // 2. Concurrency collision check: If another transaction already committed this attempt
        if (updateResult.count === 0) {
          currentTxStep = 'find_committed_attempt';
          stepStartMs = performance.now();
          const committedAttempt = (await tx.testAttempt.findUnique({
            where: { id: targetAttemptId },
            select: attemptSelectFields,
          })) as AttemptRecord | null;
          currentTxStep = 'tx_committing';
          stepStartMs = performance.now();
          return { isDuplicate: true, committedAttempt };
        }

        // 3. Atomically persist answers: Delete only if draft answers previously existed
        if (hasExistingAnswers) {
          currentTxStep = 'delete_existing_answers';
          stepStartMs = performance.now();
          const delRes = await tx.userAnswer.deleteMany({
            where: { attemptId: targetAttemptId },
          });
          tDeleteAnswersMs = parseFloat((performance.now() - stepStartMs).toFixed(2));
          deletedAnswersCount = delRes.count;
        }

        currentTxStep = 'create_user_answers';
        stepStartMs = performance.now();
        const createRes = await tx.userAnswer.createMany({
          data: userAnswersData,
        });
        tCreateAnswersMs = parseFloat((performance.now() - stepStartMs).toFixed(2));
        createdAnswersCount = createRes.count;

        if (mistakesData.length > 0) {
          currentTxStep = 'insert_mistakes';
          stepStartMs = performance.now();
          const mRes = await tx.mistakeBook.createMany({
            data: mistakesData,
            skipDuplicates: true,
          });
          tMistakesMs = parseFloat((performance.now() - stepStartMs).toFixed(2));
          mistakesInsertedCount = mRes.count;
        }

        if (validBookmarks.length > 0) {
          currentTxStep = 'insert_bookmarks';
          stepStartMs = performance.now();
          const bRes = await tx.bookmark.createMany({
            data: validBookmarks,
            skipDuplicates: true,
          });
          tBookmarksMs = parseFloat((performance.now() - stepStartMs).toFixed(2));
          bookmarksInsertedCount = bRes.count;
        }

        currentTxStep = 'tx_committing';
        stepStartMs = performance.now();
        return { isDuplicate: false, committedAttempt: null };
      },
      {
        // 30s bounded timeout: provides safe headroom for cross-continental round trips to Neon in Ohio
        // while strictly preventing indefinite query hangs or lock deadlocks
        timeout: 30000,
        maxWait: 10000, // 10 seconds max wait to acquire a connection from the pool
      }
    );

    const tTxMs = parseFloat((performance.now() - tTxStart).toFixed(2));
    currentTxStep = 'tx_committed';
    console.log(
      JSON.stringify({
        level: 'info',
        type: 'SUBMISSION_TX_END',
        correlationId,
        attemptId: targetAttemptId,
        transactionMs: tTxMs,
        isDuplicate: txResult.isDuplicate,
        operationTimings: {
          tUpdateMs,
          tDeleteAnswersMs,
          tCreateAnswersMs,
          tMistakesMs,
          tBookmarksMs,
        },
        operationCounts: {
          deletedAnswersCount,
          createdAnswersCount,
          mistakesInsertedCount,
          bookmarksInsertedCount,
        },
      })
    );

    let responsePayload: Record<string, unknown>;

    if (txResult.isDuplicate && txResult.committedAttempt) {
      const ca = txResult.committedAttempt;
      const totalElapsedMs = parseFloat((performance.now() - reqStart).toFixed(2));
      console.log(
        JSON.stringify({
          level: 'info',
          type: 'SUBMISSION_IDEMPOTENT_COMMITTED_HIT',
          correlationId,
          testId: mockTest.id,
          attemptId: targetAttemptId,
          isDuplicate: true,
          totalElapsedMs,
        })
      );

      responsePayload = {
        success: true,
        attemptId: ca.id,
        alreadySubmitted: true,
        result: buildScorecardResult(ca, mockTest, dbQuestions.length, timeTaken),
      };
    } else {
      const totalElapsedMs = parseFloat((performance.now() - reqStart).toFixed(2));
      console.log(
        JSON.stringify({
          level: 'info',
          type: 'SUBMISSION_SUCCESS',
          correlationId,
          testId: mockTest.id,
          attemptId: targetAttemptId,
          isDuplicate: false,
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
            mistakesRecorded: mistakesInsertedCount,
            bookmarksRecorded: bookmarksInsertedCount,
          },
        })
      );

      const submissionData = {
        attemptId: targetAttemptId,
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

      responsePayload = {
        success: true,
        attemptId: targetAttemptId,
        result: submissionData,
      };
    }

    if (resolveFlight) {
      resolveFlight({ status: 200, body: responsePayload });
    }
    const response = NextResponse.json(responsePayload);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: unknown) {
    if (rejectFlight) {
      rejectFlight(err);
    }
    const totalElapsedMs = parseFloat((performance.now() - reqStart).toFixed(2));
    const txElapsedMs = tTxStart > 0 ? parseFloat((performance.now() - tTxStart).toFixed(2)) : 0;
    const activeStepElapsedMs = stepStartMs > 0 ? parseFloat((performance.now() - stepStartMs).toFixed(2)) : 0;
    const errorMessage = err instanceof Error ? err.message : 'Unknown submission error';

    let dbErrorCode: string | undefined;
    let prismaErrorCode: string | undefined;
    if (typeof err === 'object' && err !== null) {
      const errObj = err as Record<string, unknown>;
      if (typeof errObj.code === 'string') {
        prismaErrorCode = errObj.code;
      }
      if (typeof errObj.meta === 'object' && errObj.meta !== null) {
        const meta = errObj.meta as Record<string, unknown>;
        if (typeof meta.code === 'string') {
          dbErrorCode = meta.code;
        } else if (typeof meta.db_error_code === 'string') {
          dbErrorCode = meta.db_error_code;
        }
      }
    }
    const isLockTimeout = errorMessage.includes('55P03') || errorMessage.toLowerCase().includes('lock timeout');
    const isStatementTimeout = errorMessage.includes('57014') || errorMessage.toLowerCase().includes('statement timeout');
    if (!dbErrorCode) {
      if (isLockTimeout) dbErrorCode = '55P03';
      else if (isStatementTimeout) dbErrorCode = '57014';
    }

    console.error(
      JSON.stringify({
        level: 'error',
        type: 'SUBMISSION_ERROR',
        correlationId,
        testId: routeTestId || 'unknown',
        attemptId: targetAttemptId || inputAttemptId || 'unspecified',
        error: errorMessage,
        elapsedMs: totalElapsedMs,
        diagnostic: {
          lastActiveStep: currentTxStep,
          activeStepElapsedMs,
          txElapsedMs,
          prismaErrorCode,
          dbErrorCode,
          isLockTimeout,
          isStatementTimeout,
          operationTimings: {
            tUpdateMs,
            tDeleteAnswersMs,
            tCreateAnswersMs,
            tMistakesMs,
            tBookmarksMs,
          },
          operationCounts: {
            deletedAnswersCount,
            createdAnswersCount,
            mistakesInsertedCount,
            bookmarksInsertedCount,
          },
        },
      })
    );
    return NextResponse.json(
      { error: errorMessage || 'Submission evaluation failed.' },
      { status: 500 }
    );
  } finally {
    if (flightRegisteredKey) {
      inFlightSubmissions.delete(flightRegisteredKey);
    }
  }
}
