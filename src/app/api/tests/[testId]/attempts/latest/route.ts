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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId } = await context.params;
    const mockTest = await resolveOrCreateMockTest({ mockTestId: testId });
    if (!mockTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const latestAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId: session.user.id,
        mockTestId: mockTest.id,
        status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
      },
      orderBy: { submittedAt: 'desc' },
      select: { id: true },
    });

    if (!latestAttempt) {
      return NextResponse.json({ error: 'No completed attempts found for this test.' }, { status: 404 });
    }

    return NextResponse.json({ attemptId: latestAttempt.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to lookup latest attempt' }, { status: 500 });
  }
}
