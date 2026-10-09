import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ testId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { attemptId, answers } = body;

    if (!attemptId || !answers) {
      return NextResponse.json({ error: 'Missing attemptId or answers' }, { status: 400 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Attempt not found or access denied' }, { status: 403 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Attempt is already finished' }, { status: 400 });
    }

    // Save/update user answers in DB
    const entries = Object.entries(answers);
    for (const [qId, ans] of entries as [string, any][]) {
      if (!qId) continue;
      await prisma.userAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: qId,
          },
        },
        create: {
          attemptId,
          questionId: qId,
          selectedOption: ans.selectedOption || null,
          status: ans.status || (ans.selectedOption ? 'ANSWERED' : 'NOT_ANSWERED'),
          timeSpentSeconds: ans.timeSpent || 0,
        },
        update: {
          selectedOption: ans.selectedOption || null,
          status: ans.status || (ans.selectedOption ? 'ANSWERED' : 'NOT_ANSWERED'),
          timeSpentSeconds: ans.timeSpent || 0,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save draft' }, { status: 500 });
  }
}
