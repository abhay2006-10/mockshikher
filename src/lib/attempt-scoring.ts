import { AnswerStatus, CorrectOption } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * Shared, authoritative scoring for test attempts. Used by the submit route
 * and by the start route when it finalises attempts whose deadline passed
 * while the student was away (so they get a real score, not a blank row).
 */

export function parseCorrectOption(val: unknown): CorrectOption | null {
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

export interface ScoringQuestion {
  id: string;
  questionText: string;
  correctOption: CorrectOption;
  marks: number | null;
  negativeMarks: number | null;
}

export interface ScoringMockTest {
  marksPerQuestion?: number | null;
  negativeMarksPerQuestion?: number | null;
  exam?: {
    marksPerQuestion?: number | null;
    negativeMarking?: number | null;
  } | null;
}

export interface SubmittedAnswer {
  selectedOption?: unknown;
  status?: string | null;
  timeSpent?: number | null;
}

export const SCORING_QUESTION_SELECT = {
  id: true,
  questionNumber: true,
  questionText: true,
  correctOption: true,
  marks: true,
  negativeMarks: true,
  subjectId: true,
} as const;

export function evaluateAnswers(
  dbQuestions: ScoringQuestion[],
  answers: Record<string, SubmittedAnswer | undefined>,
  mockTest: ScoringMockTest
) {
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let rawScore = 0;
  let totalPossibleMarks = 0;

  const defaultMarks = mockTest.marksPerQuestion ?? mockTest.exam?.marksPerQuestion ?? 1;
  const defaultNegMarks = mockTest.negativeMarksPerQuestion ?? mockTest.exam?.negativeMarking ?? 0.25;

  const evaluatedAnswers = dbQuestions.map((q) => {
    const userAnsObj = answers[q.id];
    const selectedOption = parseCorrectOption(userAnsObj?.selectedOption);
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
      status: (userAnsObj?.status || (isAnswered ? 'ANSWERED' : 'NOT_ANSWERED')) as AnswerStatus,
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

  return {
    correctCount,
    wrongCount,
    unansweredCount,
    finalScore,
    totalPossibleMarks,
    percentage,
    accuracy,
    evaluatedAnswers,
  };
}

/**
 * Score and close every IN_PROGRESS attempt of this user on this mock whose
 * deadline has passed, using the draft answers saved during the attempt.
 * Each attempt is guarded by `status: 'IN_PROGRESS'`, so a concurrent submit
 * that wins the race is never overwritten.
 */
export async function finalizeExpiredAttempts(
  userId: string,
  mockTest: ScoringMockTest & { id: string },
  now: Date
): Promise<number> {
  const expired = await prisma.testAttempt.findMany({
    where: {
      userId,
      mockTestId: mockTest.id,
      status: 'IN_PROGRESS',
      deadline: { lte: now },
    },
    select: {
      id: true,
      startedAt: true,
      deadline: true,
      answers: {
        select: { questionId: true, selectedOption: true, status: true, timeSpentSeconds: true },
      },
    },
  });
  if (expired.length === 0) return 0;

  const dbQuestions = await prisma.question.findMany({
    where: { mockTestId: mockTest.id },
    select: SCORING_QUESTION_SELECT,
    orderBy: { questionNumber: 'asc' },
  });

  let finalized = 0;
  for (const attempt of expired) {
    const answersMap: Record<string, SubmittedAnswer> = {};
    for (const a of attempt.answers) {
      answersMap[a.questionId] = {
        selectedOption: a.selectedOption,
        status: a.status,
        timeSpent: a.timeSpentSeconds,
      };
    }

    const result = evaluateAnswers(dbQuestions, answersMap, mockTest);
    const timeTakenSeconds = Math.max(
      0,
      Math.round((attempt.deadline.getTime() - attempt.startedAt.getTime()) / 1000)
    );

    await prisma.$transaction(async (tx) => {
      const updated = await tx.testAttempt.updateMany({
        where: { id: attempt.id, status: 'IN_PROGRESS' },
        data: {
          status: 'AUTO_SUBMITTED',
          submittedAt: now,
          score: result.finalScore,
          totalMarks: result.totalPossibleMarks,
          correctCount: result.correctCount,
          wrongCount: result.wrongCount,
          unansweredCount: result.unansweredCount,
          accuracy: result.accuracy,
          percentage: result.percentage,
          timeTakenSeconds,
        },
      });
      if (updated.count === 0) return; // already submitted by a concurrent request

      await tx.userAnswer.deleteMany({ where: { attemptId: attempt.id } });
      await tx.userAnswer.createMany({
        data: result.evaluatedAnswers.map(({ isAnswered: _isAnswered, ...ans }) => ({
          ...ans,
          attemptId: attempt.id,
        })),
      });

      const mistakes = result.evaluatedAnswers
        .filter((ans) => ans.isAnswered && !ans.isCorrect)
        .map((ans) => ({ userId, questionId: ans.questionId, attemptId: attempt.id, isMastered: false }));
      if (mistakes.length > 0) {
        await tx.mistakeBook.createMany({ data: mistakes, skipDuplicates: true });
      }
      finalized++;
    });
  }
  return finalized;
}
