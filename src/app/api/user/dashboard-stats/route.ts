import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all submitted attempts for this user
    const attempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
      },
      include: {
        mockTest: {
          select: { id: true, name: true, testNumber: true, totalMarks: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const mistakesCount = await prisma.mistakeBook.count({
      where: { userId, isMastered: false },
    });

    const bookmarksCount = await prisma.bookmark.count({
      where: { userId },
    });

    // Compute aggregate metrics
    const totalAttempts = attempts.length;
    const latestAttempt = attempts[0] || null;

    let totalCorrect = 0;
    let totalAnswered = 0;
    attempts.forEach((att) => {
      totalCorrect += att.correctCount || 0;
      totalAnswered += (att.correctCount || 0) + (att.wrongCount || 0);
    });

    const overallAccuracy = totalAnswered > 0
      ? parseFloat(((totalCorrect / totalAnswered) * 100).toFixed(1))
      : 0;

    const recentAttempts = attempts.map((att) => {
      const mins = Math.floor((att.timeTakenSeconds || 0) / 60);
      const secs = (att.timeTakenSeconds || 0) % 60;

      return {
        id: att.id,
        testId: att.mockTestId,
        testName: att.mockTest.name,
        date: att.submittedAt
          ? new Date(att.submittedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Recent',
        score: att.score ?? 0,
        totalMarks: att.totalMarks ?? att.mockTest.totalMarks,
        percentage: att.percentage ?? 0,
        accuracy: att.accuracy ?? 0,
        timeTaken: `${mins}m ${secs}s`,
      };
    });

    return NextResponse.json({
      stats: {
        totalAttempts,
        latestScore: latestAttempt?.score ?? 0,
        latestTotalMarks: latestAttempt?.totalMarks ?? 25,
        latestPercentage: latestAttempt?.percentage ?? 0,
        latestTestName: latestAttempt?.mockTest?.name || 'No tests taken yet',
        overallAccuracy,
        totalCorrect,
        totalAnswered,
        mistakesCount,
        bookmarksCount,
      },
      recentAttempts,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
