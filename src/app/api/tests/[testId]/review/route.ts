import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { resolveOrCreateMockTest } from '@/lib/mock-resolver';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ testId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view solutions and question review.' },
        { status: 401 }
      );
    }

    const { testId } = await context.params;

    const mockTest = await resolveOrCreateMockTest({ mockTestId: testId });
    if (!mockTest) {
      return NextResponse.json({ error: 'Test not found.' }, { status: 404 });
    }

    // Security check (Requirement 5):
    // Solutions/review data is returned ONLY to a user who has already submitted that attempt.
    const submittedAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId: session.user.id,
        mockTestId: mockTest.id,
        status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
      },
      orderBy: { submittedAt: 'desc' },
      include: {
        answers: true,
      },
    });

    if (!submittedAttempt) {
      return NextResponse.json(
        { error: 'Forbidden. Solutions and explanations are only accessible after submitting this test.' },
        { status: 403 }
      );
    }

    const answerMap = new Map(submittedAttempt.answers.map((a) => [a.questionId, a]));

    const dbQuestions = await prisma.question.findMany({
      where: { mockTestId: mockTest.id },
      include: {
        options: {
          orderBy: { optionLabel: 'asc' },
          select: {
            id: true,
            optionLabel: true,
            optionText: true,
            optionTextHi: true,
          },
        },
        subject: true,
        topic: true,
      },
      orderBy: { questionNumber: 'asc' },
    });

    const formatted = dbQuestions.map((q) => {
      const userAns = answerMap.get(q.id);
      const effectiveMarks =
        userAns?.marksSnapshot ??
        q.marks ??
        mockTest.marksPerQuestion ??
        mockTest.exam?.marksPerQuestion ??
        1;
      const effectiveNegMarks =
        userAns?.negativeMarksSnapshot ??
        q.negativeMarks ??
        mockTest.negativeMarksPerQuestion ??
        mockTest.exam?.negativeMarking ??
        0.25;

      return {
        id: q.id,
        mockTestId: q.mockTestId,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        questionTextHi: q.questionTextHi || q.questionText,
        questionImage: q.questionImage || null,
        correctOption: q.correctOption,
        marks: effectiveMarks,
        negativeMarks: effectiveNegMarks,
        difficulty: q.difficulty,
        explanation: q.explanation || '',
        explanationHi: q.explanationHi || '',
        solutionImage: q.solutionImage || null,
        subjectId: q.subjectId,
        subjectName: q.subject?.name || 'General Awareness',
        subjectNameHi: q.subject?.nameHi || q.subject?.name || 'सामान्य ज्ञान',
        topicId: q.topicId,
        topicName: q.topic?.name || 'General',
        topicNameHi: q.topic?.nameHi || q.topic?.name || 'सामान्य',
        options: q.options.map((opt) => ({
          id: opt.id,
          label: opt.optionLabel,
          text: opt.optionText,
          textHi: opt.optionTextHi || opt.optionText,
        })),
      };
    });

    const response = NextResponse.json({
      test: {
        id: mockTest.id,
        name: mockTest.name,
        testNumber: mockTest.testNumber,
        isFree: mockTest.isFree,
        totalQuestions: formatted.length,
        durationMinutes: mockTest.durationMinutes || 60,
        totalMarks: mockTest.totalMarks || formatted.reduce((sum, q) => sum + q.marks, 0),
      },
      questions: formatted,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: any) {
    console.error('Error fetching review questions:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch review questions.' },
      { status: 500 }
    );
  }
}
