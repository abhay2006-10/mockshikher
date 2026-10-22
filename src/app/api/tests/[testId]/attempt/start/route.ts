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
        { error: 'Unauthorized. Please log in to start or resume a test.' },
        { status: 401 }
      );
    }

    const { testId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const forceNew = body.forceNew === true;

    // 1. Parallel Pre-flight Lookups: Resolve User and MockTest concurrently
    const [user, mockTest] = await Promise.all([
      prisma.user.findFirst({
        where: {
          OR: [
            ...(session.user.id ? [{ id: session.user.id }] : []),
            ...(session.user.email ? [{ email: session.user.email }] : []),
          ],
        },
        select: { id: true, role: true },
      }),
      resolveOrCreateMockTest({ mockTestId: testId }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }
    if (!mockTest) {
      return NextResponse.json({ error: 'Test not found.' }, { status: 404 });
    }

    // Security check: Unpublished tests are hidden from students
    // @ts-expect-error role on user
    const userRole = session.user.role || user.role;
    if (!mockTest.isPublished && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'This test is currently unpublished and unavailable.' },
        { status: 403 }
      );
    }

    // Access control: Ensure user has a verified purchase for non-free tests
    if (!mockTest.isFree && userRole !== 'ADMIN') {
      const purchase = await prisma.purchase.findUnique({
        where: {
          userId_examId: {
            userId: user.id,
            examId: mockTest.examId,
          },
        },
        select: { id: true },
      });

      if (!purchase) {
        return NextResponse.json(
          {
            error: 'This mock test is locked. Please purchase the test series to unlock access.',
            requiresPurchase: true,
            examId: mockTest.examId,
          },
          { status: 403 }
        );
      }
    }

    // Check question count: fast path uses mockTest.totalQuestions if present
    const questionCount =
      mockTest.totalQuestions && mockTest.totalQuestions > 0
        ? mockTest.totalQuestions
        : await prisma.question.count({
            where: { mockTestId: mockTest.id },
          });

    if (questionCount === 0) {
      return NextResponse.json(
        { error: 'No questions have been added to this test yet. Cannot start.' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Check for an active IN_PROGRESS attempt unless forceNew is requested
    if (!forceNew) {
      const activeAttempt = await prisma.testAttempt.findFirst({
        where: {
          userId: user.id,
          mockTestId: mockTest.id,
          status: 'IN_PROGRESS',
        },
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          deadline: true,
          startedAt: true,
          answers: {
            select: {
              questionId: true,
              selectedOption: true,
              status: true,
              timeSpentSeconds: true,
            },
          },
        },
      });

      if (activeAttempt) {
        const deadline = new Date(activeAttempt.deadline);
        const diffMs = deadline.getTime() - now.getTime();

        if (diffMs <= 0) {
          // Deadline expired while away - auto-submit any expired in-progress attempts for this user and test
          await prisma.testAttempt.updateMany({
            where: {
              userId: user.id,
              mockTestId: mockTest.id,
              status: 'IN_PROGRESS',
              deadline: { lte: now },
            },
            data: {
              status: 'AUTO_SUBMITTED',
              submittedAt: now,
            },
          });
          // Do not return expired early; fall through to create a fresh attempt with full timer below!
        } else {
          // Active within deadline! Return remaining server time
          const timeLeftSeconds = Math.max(0, Math.floor(diffMs / 1000));
          const savedAnswers: Record<string, any> = {};
          activeAttempt.answers.forEach((ans) => {
            savedAnswers[ans.questionId] = {
              selectedOption: ans.selectedOption,
              status: ans.status,
              timeSpent: ans.timeSpentSeconds,
            };
          });

          return NextResponse.json({
            attemptId: activeAttempt.id,
            startedAt: activeAttempt.startedAt.toISOString(),
            deadline: activeAttempt.deadline.toISOString(),
            timeLeftSeconds,
            isResume: true,
            savedAnswers,
          });
        }
      }
    }

    // Create a new server-owned test attempt
    const effectiveDurationMinutes =
      mockTest.durationMinutes || mockTest.exam?.durationMinutes || 60;
    const deadline = new Date(now.getTime() + effectiveDurationMinutes * 60 * 1000);

    const newAttempt = await prisma.testAttempt.create({
      data: {
        userId: user.id,
        mockTestId: mockTest.id,
        startedAt: now,
        deadline,
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json({
      attemptId: newAttempt.id,
      startedAt: newAttempt.startedAt.toISOString(),
      deadline: newAttempt.deadline.toISOString(),
      timeLeftSeconds: effectiveDurationMinutes * 60,
      isResume: false,
      savedAnswers: {},
    });
  } catch (err: any) {
    console.error('Error in attempt start endpoint:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize test attempt.' },
      { status: 500 }
    );
  }
}
