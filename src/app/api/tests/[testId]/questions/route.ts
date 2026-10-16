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
    const { testId } = await context.params;

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
    }

    // Resolve or find the MockTest using shared resolver
    const mockTest = await resolveOrCreateMockTest({ mockTestId: testId });

    if (!mockTest) {
      return NextResponse.json({ error: 'Test not found.' }, { status: 404 });
    }

    // Access Control: Enforce verified purchase for non-free mock tests
    const session = await auth();
    // @ts-expect-error user role in token
    let isAdmin = session?.user?.role === 'ADMIN';

    if (!isAdmin && session?.user) {
      const email = session.user.email?.toLowerCase().trim();
      const id = session.user.id;
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(id ? [{ id }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
        select: { role: true },
      });
      if (dbUser?.role === 'ADMIN') {
        isAdmin = true;
      }
    }

    let isPurchased = false;

    if (session?.user?.id) {
      const purchase = await prisma.purchase.findUnique({
        where: {
          userId_examId: {
            userId: session.user.id,
            examId: mockTest.examId,
          },
        },
      });
      isPurchased = !!purchase;
    }

    if (isAdmin) {
      isPurchased = true;
    }

    if (!mockTest.isFree && !isPurchased) {
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            error: 'Please log in to access this premium mock test.',
            requiresAuth: true,
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: 'This mock test is locked. Please purchase the test series to unlock access.',
          requiresPurchase: true,
          examId: mockTest.examId,
        },
        { status: 403 }
      );
    }

    // Fetch questions strictly belonging to this mock test ID from PostgreSQL
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
        subject: {
          select: { id: true, name: true, nameHi: true },
        },
        topic: {
          select: { id: true, name: true, nameHi: true },
        },
      },
      orderBy: { questionNumber: 'asc' },
    });

    // Format safe student questions: STRICTLY EXCLUDE correctOption, explanation, solutionImage
    const studentQuestions = dbQuestions.map((q) => ({
      id: q.id,
      mockTestId: q.mockTestId,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionTextHi: q.questionTextHi || q.questionText,
      questionImage: q.questionImage || null,
      marks: q.marks,
      negativeMarks: Number(mockTest.negativeMarksPerQuestion) === 0 ? 0 : q.negativeMarks,
      difficulty: q.difficulty,
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
    }));

    const response = NextResponse.json({
      test: {
        id: mockTest.id,
        name: mockTest.name,
        testNumber: mockTest.testNumber,
        isFree: mockTest.isFree,
        totalQuestions: studentQuestions.length,
        durationMinutes: mockTest.durationMinutes || 60,
        totalMarks: mockTest.totalMarks || studentQuestions.reduce((sum, q) => sum + q.marks, 0),
        negativeMarksPerQuestion:
          mockTest.name?.toLowerCase().includes('patwari') ||
          mockTest.exam?.slug?.includes('patwari') ||
          mockTest.negativeMarksPerQuestion === 0 ||
          mockTest.exam?.negativeMarking === 0
            ? 0
            : (mockTest.negativeMarksPerQuestion ?? mockTest.exam?.negativeMarking ?? 0.25),
        marksPerQuestion: mockTest.marksPerQuestion || 1.0,
      },
      questions: studentQuestions,
      count: studentQuestions.length,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: any) {
    console.error('Error in student questions endpoint:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch test questions from database.' },
      { status: 500 }
    );
  }
}
