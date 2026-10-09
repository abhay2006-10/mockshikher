import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const session = await auth();
    // @ts-expect-error user role in token
    const isAdmin = session?.user?.role === 'ADMIN';

    const exam = await prisma.exam.findUnique({
      where: { slug },
      include: {
        subjects: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            nameHi: true,
            _count: { select: { questions: true } },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Query tests for this exam from PostgreSQL
    // Unpublished tests are hidden from students (Requirement 3)
    const mockTests = await prisma.mockTest.findMany({
      where: {
        examId: exam.id,
        ...(isAdmin ? {} : { isPublished: true }),
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { testNumber: 'asc' },
    });

    // Check user's previous attempts if logged in
    const userAttemptsMap = new Map<string, any>();
    if (session?.user?.id) {
      const attempts = await prisma.testAttempt.findMany({
        where: {
          userId: session.user.id,
          mockTestId: { in: mockTests.map((t) => t.id) },
          status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
        },
        orderBy: { submittedAt: 'desc' },
      });
      attempts.forEach((att) => {
        if (!userAttemptsMap.has(att.mockTestId)) {
          userAttemptsMap.set(att.mockTestId, att);
        }
      });
    }

    const formattedTests = mockTests.map((test) => {
      const qCount = test._count.questions;
      const lastAttempt = userAttemptsMap.get(test.id);

      return {
        id: test.id,
        examId: test.examId,
        name: test.name,
        testNumber: test.testNumber,
        isFree: test.isFree,
        isPublished: test.isPublished,
        totalQuestions: qCount, // Real question count from database
        durationMinutes: test.durationMinutes || exam.durationMinutes || 60,
        totalMarks: test.totalMarks || (qCount > 0 ? qCount * test.marksPerQuestion : exam.totalQuestions),
        marksPerQuestion: test.marksPerQuestion || 1.0,
        negativeMarksPerQuestion: test.negativeMarksPerQuestion || 0.25,
        hasAttempted: !!lastAttempt,
        lastScore: lastAttempt?.score,
        lastPercentage: lastAttempt?.percentage,
        lastAttemptId: lastAttempt?.id,
      };
    });

    const response = NextResponse.json({
      exam: {
        id: exam.id,
        name: exam.name,
        slug: exam.slug,
        description: exam.description,
        category: exam.category,
        price: exam.price,
        durationMinutes: exam.durationMinutes,
        totalQuestions: exam.totalQuestions,
        negativeMarking: exam.negativeMarking,
        totalMocks: mockTests.length,
        subjects: exam.subjects.map((s) => ({
          id: s.id,
          name: s.name,
          nameHi: s.nameHi,
          questionCount: s._count.questions,
        })),
      },
      tests: formattedTests,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: any) {
    console.error('Error fetching exam tests:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch exam tests' },
      { status: 500 }
    );
  }
}
