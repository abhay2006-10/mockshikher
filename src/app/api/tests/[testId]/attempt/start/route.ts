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

    // Find the user in DB
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
    }
    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    // Resolve Mock Test
    const mockTest = await resolveOrCreateMockTest({ mockTestId: testId });
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

    // Check real question count in database
    const questionCount = await prisma.question.count({
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
        include: {
          answers: true,
        },
      });

      if (activeAttempt) {
        const deadline = new Date(activeAttempt.deadline);
        const diffMs = deadline.getTime() - now.getTime();

        if (diffMs <= 0) {
          // Deadline expired while away - auto-submit this attempt
          await prisma.testAttempt.update({
            where: { id: activeAttempt.id },
            data: {
              status: 'AUTO_SUBMITTED',
              submittedAt: deadline,
            },
          });
          return NextResponse.json({
            expired: true,
            attemptId: activeAttempt.id,
            message: 'Your previous attempt time expired and has been auto-submitted.',
          });
        }

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

    // Create a new server-owned test attempt
    const durationMinutes = mockTest.durationMinutes || 60;
    const deadline = new Date(now.getTime() + durationMinutes * 60 * 1000);

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
      timeLeftSeconds: durationMinutes * 60,
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
