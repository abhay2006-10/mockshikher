import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Safe 2-wave batching: maximum concurrency = 3 (strictly <= connection_limit 5)
    // Wave 1: Core aggregate data (3 queries concurrent)
    const [attempts, bookmarksCount, recentMistakes] = await Promise.all([
      // 1. Submitted attempts
      prisma.testAttempt.findMany({
        where: {
          userId,
          status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
        },
        include: {
          mockTest: {
            select: { id: true, name: true, testNumber: true, totalMarks: true, totalQuestions: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),

      // 2. Bookmarks count
      prisma.bookmark.count({
        where: { userId },
      }),

      // 3. Unmastered mistakes (provides both count and topic breakdown in 1 query)
      prisma.mistakeBook.findMany({
        where: { userId, isMastered: false },
        select: {
          id: true,
          question: {
            select: {
              subject: { select: { name: true } },
              topic: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const mistakesCount = recentMistakes.length;

    // Wave 2: Auxiliary progress data (2 queries concurrent)
    const [activeAttemptRecord, purchases] = await Promise.all([
      // 4. In-progress active attempt (if any)
      prisma.testAttempt.findFirst({
        where: { userId, status: 'IN_PROGRESS' },
        orderBy: { startedAt: 'desc' },
        include: {
          mockTest: {
            select: { id: true, name: true, testNumber: true, totalQuestions: true, durationMinutes: true },
          },
          answers: {
            where: { status: 'ANSWERED' },
            select: { id: true },
          },
        },
      }),

      // 5. Purchases for enrolled series progress
      prisma.purchase.findMany({
        where: { userId },
        include: {
          exam: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              mockTests: {
                where: { isPublished: true },
                select: { id: true, testNumber: true, name: true },
                orderBy: { testNumber: 'asc' },
              },
            },
          },
        },
      }),
    ]);

    // Aggregate metrics
    const totalAttempts = attempts.length;
    const latestAttempt = attempts[0] || null;

    let totalCorrect = 0;
    let totalAnswered = 0;
    let totalScoreSum = 0;
    let bestScore = 0;

    attempts.forEach((att: any) => {
      const c = att.correctCount || 0;
      const w = att.wrongCount || 0;
      const s = att.score ?? 0;
      totalCorrect += c;
      totalAnswered += c + w;
      totalScoreSum += att.percentage ?? 0;
      if (s > bestScore) bestScore = s;
    });

    const overallAccuracy =
      totalAnswered > 0
        ? parseFloat(((totalCorrect / totalAnswered) * 100).toFixed(1))
        : 0;

    const avgPercentage =
      totalAttempts > 0
        ? parseFloat((totalScoreSum / totalAttempts).toFixed(1))
        : 0;

    const recentAttempts = attempts.map((att: any) => {
      const mins = Math.floor((att.timeTakenSeconds || 0) / 60);
      const secs = (att.timeTakenSeconds || 0) % 60;

      return {
        id: att.id,
        testId: att.mockTestId,
        testName: att.mockTest?.name || 'Mock Test',
        date: att.submittedAt
          ? new Date(att.submittedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Recent',
        score: att.score ?? 0,
        totalMarks: att.totalMarks ?? att.mockTest?.totalMarks ?? 25,
        percentage: att.percentage ?? 0,
        accuracy: att.accuracy ?? 0,
        timeTaken: `${mins}m ${secs}s`,
      };
    });

    // Compute active attempt summary
    let activeAttempt = null;
    if (activeAttemptRecord) {
      const answered = activeAttemptRecord.answers.length;
      const total = activeAttemptRecord.mockTest?.totalQuestions ?? 100;
      const msLeft = new Date(activeAttemptRecord.deadline).getTime() - Date.now();
      const minsLeft = Math.max(0, Math.floor(msLeft / 60000));
      const progressPercent = total > 0 ? Math.round((answered / total) * 100) : 0;

      activeAttempt = {
        id: activeAttemptRecord.id,
        testId: activeAttemptRecord.mockTestId,
        name: activeAttemptRecord.mockTest?.name || 'Mock Test',
        answered,
        total,
        leftText: `${minsLeft} min left`,
        progressPercent,
      };
    }

    // Compute enrolled series progress
    const completedMockIds = new Set(attempts.map((a: any) => a.mockTestId));
    const enrolledProgress = purchases.map((p: any) => {
      const allMocks = p.exam?.mockTests || [];
      const doneCount = allMocks.filter((m: any) => completedMockIds.has(m.id)).length;
      const nextMock = allMocks.find((m: any) => !completedMockIds.has(m.id)) || allMocks[0];

      return {
        examId: p.exam?.id,
        slug: p.exam?.slug,
        name: p.exam?.name,
        category: p.exam?.category || 'HP Exams',
        done: doneCount,
        total: allMocks.length,
        nextTestNumber: nextMock?.testNumber ?? 1,
        nextTestId: nextMock?.id || `${p.exam?.slug}-mock-1`,
      };
    });

    // Compute weak topics from unmastered mistakes
    const topicMistakeCounts: Record<string, number> = {};
    recentMistakes.forEach((m: any) => {
      const name = m.question?.topic?.name || m.question?.subject?.name || 'General';
      topicMistakeCounts[name] = (topicMistakeCounts[name] || 0) + 1;
    });

    const weakTopics = Object.entries(topicMistakeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => {
        const accuracy = Math.max(30, Math.round(100 - count * 12));
        return {
          name,
          mistakesCount: count,
          accuracy,
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
        // Additive fields
        unrevisedMistakes: mistakesCount,
        bestScore,
        avgPercentage,
      },
      recentAttempts,
      activeAttempt,
      enrolledProgress,
      weakTopics,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
