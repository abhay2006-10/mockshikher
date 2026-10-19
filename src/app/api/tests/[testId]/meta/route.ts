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
    const mockTest = await resolveOrCreateMockTest({ mockTestId: testId });

    if (!mockTest) {
      return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
    }

    // Access Control verification
    const session = await auth();
    // @ts-expect-error user role in token
    let isAdmin = session?.user?.role === 'ADMIN';
    let isPurchased = mockTest.isFree || isAdmin;

    if (session?.user?.id && !isPurchased) {
      const [dbUser, purchase] = await Promise.all([
        !isAdmin
          ? prisma.user.findFirst({
              where: {
                OR: [
                  ...(session.user.id ? [{ id: session.user.id }] : []),
                  ...(session.user.email ? [{ email: session.user.email.toLowerCase().trim() }] : []),
                ],
              },
              select: { role: true },
            })
          : null,
        prisma.purchase.findUnique({
          where: {
            userId_examId: {
              userId: session.user.id,
              examId: mockTest.examId,
            },
          },
          select: { id: true },
        }),
      ]);

      if (dbUser?.role === 'ADMIN') isAdmin = true;
      if (purchase || isAdmin) isPurchased = true;
    }

    if (isAdmin) isPurchased = true;

    if (!mockTest.isPublished && !isAdmin) {
      return NextResponse.json({ error: 'This mock test is not published yet.' }, { status: 403 });
    }

    const isLocked = !mockTest.isFree && !isPurchased;
    const requiresAuth = isLocked && !session?.user?.id;
    const requiresPurchase = isLocked && !!session?.user?.id;

    // Use stored totalQuestions from mockTest, only count if missing
    const totalQuestions =
      mockTest.totalQuestions && mockTest.totalQuestions > 0
        ? mockTest.totalQuestions
        : await prisma.question.count({ where: { mockTestId: mockTest.id } });

    const response = NextResponse.json({
      test: {
        id: mockTest.id,
        name: mockTest.name,
        testNumber: mockTest.testNumber,
        isFree: mockTest.isFree,
        totalQuestions,
        durationMinutes: mockTest.durationMinutes || 60,
        totalMarks: mockTest.totalMarks || totalQuestions,
        negativeMarksPerQuestion:
          mockTest.name?.toLowerCase().includes('patwari') ||
          mockTest.name?.toLowerCase().includes('clerk') ||
          mockTest.name?.toLowerCase().includes('process-server') ||
          mockTest.exam?.slug?.includes('patwari') ||
          mockTest.exam?.slug?.includes('clerk') ||
          mockTest.exam?.slug?.includes('process-server') ||
          mockTest.negativeMarksPerQuestion === 0 ||
          mockTest.exam?.negativeMarking === 0
            ? 0
            : (mockTest.negativeMarksPerQuestion ?? mockTest.exam?.negativeMarking ?? 0.25),
        marksPerQuestion: mockTest.marksPerQuestion || 1.0,
        isPublished: mockTest.isPublished,
      },
      requiresAuth,
      requiresPurchase,
      isPurchased,
      examId: mockTest.examId,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch test metadata.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
