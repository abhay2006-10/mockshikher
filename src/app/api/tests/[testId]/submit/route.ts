import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { resolveOrCreateMockTest } from '@/lib/mock-resolver';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ testId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to submit your test.' },
        { status: 401 }
      );
    }

    // Resolve user from DB
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
    }
    if (!user) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    const { testId } = await context.params;
    const body = await req.json();
    const {
      attemptId: reqAttemptId,
      answers = {},
      timeTaken = 0,
      isAutoSubmit = false,
      bookmarkedIds = [],
    } = body;

    const mockTest = await resolveOrCreateMockTest({ mockTestId: testId });
    if (!mockTest) {
      return NextResponse.json({ error: 'Test not found.' }, { status: 404 });
    }

    // Locate the TestAttempt record in PostgreSQL
    let attempt = null;
    if (reqAttemptId) {
      attempt = await prisma.testAttempt.findUnique({
        where: { id: reqAttemptId },
      });
    }

    if (!attempt) {
      // Find latest IN_PROGRESS attempt
      attempt = await prisma.testAttempt.findFirst({
        where: {
          userId: user.id,
          mockTestId: mockTest.id,
          status: 'IN_PROGRESS',
        },
        orderBy: { startedAt: 'desc' },
      });
    }

    const now = new Date();

    if (!attempt) {
      // If none existed, create a new completed attempt
      attempt = await prisma.testAttempt.create({
        data: {
          userId: user.id,
          mockTestId: mockTest.id,
          startedAt: new Date(now.getTime() - (timeTaken || 1) * 1000),
          deadline: now,
          status: 'IN_PROGRESS',
        },
      });
    } else {
      // Validate ownership
      if (attempt.userId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden. This attempt does not belong to your account.' },
          { status: 403 }
        );
      }
    }

    // Deadline check (Requirement 2)
    const deadline = new Date(attempt.deadline);
    const isPastDeadline = now.getTime() > deadline.getTime() + 15000; // 15 sec buffer for network
    const finalStatus = isAutoSubmit || isPastDeadline ? 'AUTO_SUBMITTED' : 'SUBMITTED';

    // Fetch questions from DB
    const dbQuestions = await prisma.question.findMany({
      where: { mockTestId: mockTest.id },
      include: {
        options: {
          orderBy: { optionLabel: 'asc' },
        },
        subject: true,
        topic: true,
      },
      orderBy: { questionNumber: 'asc' },
    });

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let rawScore = 0;

    let totalPossibleMarks = 0;

    const questionResults = dbQuestions.map((q) => {
      const userAnsObj = answers[q.id];
      const selectedOption = userAnsObj?.selectedOption || null;
      const isAnswered = selectedOption !== null && selectedOption !== undefined;
      const isCorrect = isAnswered && selectedOption === q.correctOption;

      // Effective value rule: question > mock test override > exam default
      const effMarks =
        q.marks !== undefined && q.marks !== null && !isNaN(q.marks) && q.marks > 0
          ? q.marks
          : (mockTest.marksPerQuestion ?? mockTest.exam?.marksPerQuestion ?? 1);

      const effNegMarks =
        q.negativeMarks !== undefined && q.negativeMarks !== null && !isNaN(q.negativeMarks) && q.negativeMarks >= 0
          ? q.negativeMarks
          : (mockTest.negativeMarksPerQuestion ?? mockTest.exam?.negativeMarking ?? 0.25);

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
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        questionTextHi: q.questionTextHi,
        subjectId: q.subjectId,
        subjectName: q.subject?.name || 'General Awareness',
        topicName: q.topic?.name || 'General',
        options: q.options.map((opt) => ({
          id: opt.id,
          label: opt.optionLabel,
          text: opt.optionText,
          textHi: opt.optionTextHi,
        })),
        userAnswer: selectedOption,
        correctOption: q.correctOption,
        isCorrect,
        isAnswered,
        marks: effMarks,
        negativeMarks: effNegMarks,
        explanation: q.explanation || '',
        explanationHi: q.explanationHi || '',
        timeSpent: userAnsObj?.timeSpent || 0,
      };
    });

    const finalScore = Math.max(0, parseFloat(rawScore.toFixed(2)));
    const percentage = totalPossibleMarks > 0
      ? parseFloat(((finalScore / totalPossibleMarks) * 100).toFixed(1))
      : 0;
    const accuracy =
      correctCount + wrongCount > 0
        ? parseFloat(((correctCount / (correctCount + wrongCount)) * 100).toFixed(1))
        : 0;

    // Save attempt, per-question answers, mistake book, bookmarks in a fast batched PostgreSQL transaction
    await prisma.$transaction(
      async (tx) => {
        // 1. Update TestAttempt
        await tx.testAttempt.update({
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
        });

        // 2. Clear previous draft answers for this attempt and batch insert final answers
        await tx.userAnswer.deleteMany({
          where: { attemptId: attempt.id },
        });

        const userAnswersData = questionResults.map((res) => {
          const userAnsObj = answers[res.questionId];
          return {
            attemptId: attempt.id,
            questionId: res.questionId,
            selectedOption: (res.userAnswer as any) || null,
            isMarkedForReview: userAnsObj?.status === 'MARKED_FOR_REVIEW' || userAnsObj?.status === 'ANSWERED_AND_MARKED',
            status: userAnsObj?.status || (res.isAnswered ? 'ANSWERED' : 'NOT_ANSWERED'),
            timeSpentSeconds: res.timeSpent || 0,
            questionTextSnapshot: res.questionText,
            correctOptionSnapshot: res.correctOption as any,
            marksSnapshot: res.marks,
            negativeMarksSnapshot: res.negativeMarks,
            isCorrect: res.isCorrect,
          };
        });

        if (userAnswersData.length > 0) {
          await tx.userAnswer.createMany({
            data: userAnswersData,
          });
        }

        // 3. Automatically add wrong answers to Mistake Book
        const wrongResults = questionResults.filter((res) => res.isAnswered && !res.isCorrect);
        if (wrongResults.length > 0) {
          const mistakesData = wrongResults.map((res) => ({
            userId: user.id,
            questionId: res.questionId,
            attemptId: attempt.id,
            isMastered: false,
          }));
          await tx.mistakeBook.createMany({
            data: mistakesData,
            skipDuplicates: true,
          });
        }

        // 4. Save bookmarks per user in database
        if (Array.isArray(bookmarkedIds) && bookmarkedIds.length > 0) {
          const validBookmarks = bookmarkedIds
            .filter((qId): qId is string => typeof qId === 'string' && qId.length > 0)
            .map((qId) => ({
              userId: user.id,
              questionId: qId,
            }));
          if (validBookmarks.length > 0) {
            await tx.bookmark.createMany({
              data: validBookmarks,
              skipDuplicates: true,
            });
          }
        }
      },
      {
        maxWait: 15000, // 15 seconds max wait to acquire connection
        timeout: 30000, // 30 seconds execution timeout
      }
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
      bookmarkedIds,
      questionResults,
    };

    const response = NextResponse.json({
      success: true,
      attemptId: attempt.id,
      result: submissionData,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: any) {
    console.error('Submission failed:', err);
    return NextResponse.json(
      { error: err.message || 'Submission evaluation failed.' },
      { status: 500 }
    );
  }
}
