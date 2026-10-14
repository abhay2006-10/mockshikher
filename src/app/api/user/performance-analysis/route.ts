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

    // Fetch all submitted attempts belonging to this student in chronological order
    const attempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
      },
      include: {
        mockTest: {
          include: {
            exam: {
              select: {
                id: true,
                name: true,
                slug: true,
                negativeMarking: true,
                marksPerQuestion: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                subject: {
                  select: { id: true, name: true, nameHi: true },
                },
                topic: {
                  select: { id: true, name: true, nameHi: true },
                },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    const totalAttempts = attempts.length;

    // If new student with no attempts
    if (totalAttempts === 0) {
      return NextResponse.json({
        hasData: false,
        totalAttempts: 0,
        message: 'No test attempts found. Complete at least one mock test to generate performance insights.',
      });
    }

    // ==========================================
    // 1. SECTION-WISE ANALYSIS ACROSS ALL TESTS
    // ==========================================
    const sectionMap: Record<
      string,
      {
        subjectId: string;
        subjectName: string;
        totalQuestions: number;
        attemptedCount: number;
        correctCount: number;
        wrongCount: number;
        unattemptedCount: number;
        totalTimeSeconds: number;
        scoreEarned: number;
        maxMarksPossible: number;
      }
    > = {};

    // ==========================================
    // 2. TOPIC-WISE ANALYSIS ACROSS ALL TESTS
    // ==========================================
    const topicMap: Record<
      string,
      {
        topicId: string;
        topicName: string;
        subjectName: string;
        examSlug?: string;
        totalQuestions: number;
        attemptedCount: number;
        correctCount: number;
        wrongCount: number;
        unattemptedCount: number;
        totalTimeSeconds: number;
      }
    > = {};

    // Total time and question metrics for pacing
    let grandTotalTimeSpentSeconds = 0;
    let grandTotalAvailableDurationSeconds = 0;
    let grandTotalQuestions = 0;
    let grandTotalCorrect = 0;
    let grandTotalWrong = 0;
    let grandTotalUnattempted = 0;
    let timeSpentOnCorrectSeconds = 0;
    let timeSpentOnWrongSeconds = 0;
    let timeSpentOnUnansweredSeconds = 0;

    // Process attempts
    attempts.forEach((att) => {
      const examDurationSec = (att.mockTest.durationMinutes || 60) * 60;
      grandTotalAvailableDurationSeconds += examDurationSec;
      grandTotalTimeSpentSeconds += att.timeTakenSeconds || 0;

      att.answers.forEach((ans) => {
        grandTotalQuestions++;
        const q = ans.question;
        const isAnswered = ans.selectedOption !== null && ans.selectedOption !== undefined;
        const isCorrect = ans.isCorrect ?? false;
        const timeSpent = ans.timeSpentSeconds || 0;

        // Resolve exact marking scheme for question
        const effMarks =
          ans.marksSnapshot ??
          q.marks ??
          att.mockTest.marksPerQuestion ??
          att.mockTest.exam?.marksPerQuestion ??
          1;

        const effNegMarks =
          ans.negativeMarksSnapshot ??
          q.negativeMarks ??
          att.mockTest.negativeMarksPerQuestion ??
          att.mockTest.exam?.negativeMarking ??
          0;

        if (isCorrect) {
          grandTotalCorrect++;
          timeSpentOnCorrectSeconds += timeSpent;
        } else if (isAnswered) {
          grandTotalWrong++;
          timeSpentOnWrongSeconds += timeSpent;
        } else {
          grandTotalUnattempted++;
          timeSpentOnUnansweredSeconds += timeSpent;
        }

        // Section aggregation
        const subjectKey = q.subject?.name || 'General Studies';
        const subjectId = q.subjectId || 'general';
        if (!sectionMap[subjectKey]) {
          sectionMap[subjectKey] = {
            subjectId,
            subjectName: subjectKey,
            totalQuestions: 0,
            attemptedCount: 0,
            correctCount: 0,
            wrongCount: 0,
            unattemptedCount: 0,
            totalTimeSeconds: 0,
            scoreEarned: 0,
            maxMarksPossible: 0,
          };
        }

        const sec = sectionMap[subjectKey];
        sec.totalQuestions++;
        sec.totalTimeSeconds += timeSpent;
        sec.maxMarksPossible += effMarks;

        if (isAnswered) {
          sec.attemptedCount++;
          if (isCorrect) {
            sec.correctCount++;
            sec.scoreEarned += effMarks;
          } else {
            sec.wrongCount++;
            sec.scoreEarned -= effNegMarks;
          }
        } else {
          sec.unattemptedCount++;
        }

        // Topic aggregation
        const topicKey = q.topic?.name || 'General';
        const topicId = q.topicId || 'general_topic';
        if (!topicMap[topicKey]) {
          topicMap[topicKey] = {
            topicId,
            topicName: topicKey,
            subjectName: subjectKey,
            examSlug: att.mockTest.exam?.slug,
            totalQuestions: 0,
            attemptedCount: 0,
            correctCount: 0,
            wrongCount: 0,
            unattemptedCount: 0,
            totalTimeSeconds: 0,
          };
        }

        const top = topicMap[topicKey];
        top.totalQuestions++;
        top.totalTimeSeconds += timeSpent;
        if (isAnswered) {
          top.attemptedCount++;
          if (isCorrect) top.correctCount++;
          else top.wrongCount++;
        } else {
          top.unattemptedCount++;
        }
      });
    });

    // Format section breakdown
    const sectionAnalysis = Object.values(sectionMap)
      .map((sec) => {
        const accuracy = sec.attemptedCount > 0
          ? Math.round((sec.correctCount / sec.attemptedCount) * 100)
          : 0;
        const avgTimePerQ = sec.totalQuestions > 0
          ? Math.round(sec.totalTimeSeconds / sec.totalQuestions)
          : 0;
        const scoreFormatted = Math.round(sec.scoreEarned * 100) / 100;

        let status: 'STRONG' | 'MODERATE' | 'WEAK' = 'MODERATE';
        if (accuracy >= 70 && sec.attemptedCount >= 3) status = 'STRONG';
        else if (accuracy < 50 || sec.wrongCount > sec.correctCount) status = 'WEAK';

        return {
          subjectId: sec.subjectId,
          subjectName: sec.subjectName,
          totalQuestions: sec.totalQuestions,
          attemptedCount: sec.attemptedCount,
          correctCount: sec.correctCount,
          wrongCount: sec.wrongCount,
          unattemptedCount: sec.unattemptedCount,
          accuracy,
          scoreEarned: scoreFormatted,
          maxMarksPossible: sec.maxMarksPossible,
          totalTimeMinutes: Math.round(sec.totalTimeSeconds / 60),
          avgTimePerQSeconds: avgTimePerQ,
          status,
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy); // Weakest sections first

    // Format weak topic detection
    const weakTopics = Object.values(topicMap)
      .filter((top) => {
        // A topic is considered weak if accuracy < 55% or wrongCount >= 2 or unattempted is high
        const acc = top.attemptedCount > 0 ? (top.correctCount / top.attemptedCount) * 100 : 0;
        return (top.attemptedCount >= 2 && acc < 60) || top.wrongCount >= 2;
      })
      .map((top) => {
        const accuracy = top.attemptedCount > 0
          ? Math.round((top.correctCount / top.attemptedCount) * 100)
          : 0;
        return {
          topicId: top.topicId,
          topicName: top.topicName,
          subjectName: top.subjectName,
          totalQuestions: top.totalQuestions,
          wrongCount: top.wrongCount,
          accuracy,
          unattemptedCount: top.unattemptedCount,
          practiceUrl: top.examSlug ? `/exams/${top.examSlug}` : '/exams',
        };
      })
      .sort((a, b) => {
        if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount;
        return a.accuracy - b.accuracy;
      })
      .slice(0, 6); // Top 6 weak areas

    // ==========================================
    // 3. TIME MANAGEMENT ANALYSIS
    // ==========================================
    const totalAttempted = grandTotalCorrect + grandTotalWrong;
    const avgTimePerQuestionSec = grandTotalQuestions > 0
      ? Math.round(grandTotalTimeSpentSeconds / grandTotalQuestions)
      : 0;
    const avgTimePerCorrectSec = grandTotalCorrect > 0
      ? Math.round(timeSpentOnCorrectSeconds / grandTotalCorrect)
      : 0;
    const avgTimePerWrongSec = grandTotalWrong > 0
      ? Math.round(timeSpentOnWrongSeconds / grandTotalWrong)
      : 0;

    const timeUtilizationPercent = grandTotalAvailableDurationSeconds > 0
      ? Math.round((grandTotalTimeSpentSeconds / grandTotalAvailableDurationSeconds) * 100)
      : 0;

    let timeManagementVerdict = 'Balanced Pace';
    let timeManagementAdvice = 'Your overall pace is well aligned with the exam duration.';

    if (timeUtilizationPercent > 95 && grandTotalUnattempted > 5) {
      timeManagementVerdict = 'Running Out of Time';
      timeManagementAdvice =
        'You are spending too much time per question early on, leaving questions unattempted at the end. Practice skipping tough questions faster.';
    } else if (avgTimePerWrongSec > avgTimePerCorrectSec * 1.5 && avgTimePerWrongSec > 60) {
      timeManagementVerdict = 'Time Sink on Difficult Questions';
      timeManagementAdvice = `You spend an average of ${avgTimePerWrongSec}s on questions you ultimately get wrong versus ${avgTimePerCorrectSec}s on correct ones. Don't get stuck on single questions.`;
    } else if (timeUtilizationPercent < 50 && totalAttempts > 0) {
      timeManagementVerdict = 'Rushing Through Questions';
      timeManagementAdvice =
        'You are submitting very quickly without utilizing available time. Double-check your calculations and read question options more carefully.';
    }

    const timeAnalysis = {
      totalTimeSpentMinutes: Math.round(grandTotalTimeSpentSeconds / 60),
      availableTimeMinutes: Math.round(grandTotalAvailableDurationSeconds / 60),
      timeUtilizationPercent,
      avgTimePerQuestionSec,
      avgTimePerCorrectSec,
      avgTimePerWrongSec,
      verdict: timeManagementVerdict,
      advice: timeManagementAdvice,
    };

    // ==========================================
    // 4. PROGRESS TRACKING OVER TIME (TRAJECTORY)
    // ==========================================
    const progressTimeline = attempts.map((att, idx) => {
      const mins = Math.floor((att.timeTakenSeconds || 0) / 60);
      const secs = (att.timeTakenSeconds || 0) % 60;
      return {
        attemptNumber: idx + 1,
        testId: att.mockTestId,
        testName: att.mockTest.name,
        examName: att.mockTest.exam?.name || 'Mock Exam',
        date: att.submittedAt
          ? new Date(att.submittedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })
          : `Mock ${idx + 1}`,
        score: att.score ?? 0,
        totalMarks: att.totalMarks ?? att.mockTest.totalMarks,
        percentage: att.percentage ?? 0,
        accuracy: att.accuracy ?? 0,
        timeTakenMinutes: Math.round((att.timeTakenSeconds || 0) / 60),
        timeTakenFormatted: `${mins}m ${secs}s`,
      };
    });

    // Score & Accuracy delta between first attempt and latest attempt
    const firstAttempt = progressTimeline[0];
    const latestAttempt = progressTimeline[progressTimeline.length - 1];

    const scoreDelta = totalAttempts >= 2
      ? Math.round((latestAttempt.percentage - firstAttempt.percentage) * 10) / 10
      : 0;
    const accuracyDelta = totalAttempts >= 2
      ? Math.round((latestAttempt.accuracy - firstAttempt.accuracy) * 10) / 10
      : 0;

    let overallTrend: 'IMPROVING' | 'CONSISTENT' | 'NEEDS_FOCUS' = 'CONSISTENT';
    if (scoreDelta > 3 || accuracyDelta > 4) overallTrend = 'IMPROVING';
    else if (scoreDelta < -5 || accuracyDelta < -5) overallTrend = 'NEEDS_FOCUS';

    // ==========================================
    // 5. PERSONALIZED "TIPS TO IMPROVE PROGRESS"
    // ==========================================
    const tips: {
      id: string;
      title: string;
      description: string;
      category: 'ACCURACY' | 'SPEED' | 'SUBJECT' | 'STRATEGY';
      actionLabel?: string;
      actionUrl?: string;
    }[] = [];

    // Negative marking tip
    const overallAccuracyPercent = totalAttempted > 0
      ? Math.round((grandTotalCorrect / totalAttempted) * 100)
      : 0;

    if (grandTotalWrong > grandTotalCorrect * 0.4) {
      tips.push({
        id: 'negative_marking_alert',
        title: 'Control Negative Marking',
        description: `You have accumulated ${grandTotalWrong} incorrect answers. In exams like HP Patwari and HP Police, negative marking severely reduces your final score. Avoid guessing unless you can eliminate 2 options.`,
        category: 'STRATEGY',
        actionLabel: 'Review Mistakes in Mistake Book',
        actionUrl: '/dashboard/mistakes',
      });
    }

    // Weak Subject Tip
    const weakestSubject = sectionAnalysis.find((s) => s.status === 'WEAK') || sectionAnalysis[0];
    if (weakestSubject && weakestSubject.accuracy < 60) {
      tips.push({
        id: 'weak_subject_focus',
        title: `Strengthen ${weakestSubject.subjectName}`,
        description: `Your accuracy in ${weakestSubject.subjectName} is currently ${weakestSubject.accuracy}%. Dedicate 30–45 minutes daily to revision in this section to raise your overall percentile.`,
        category: 'SUBJECT',
        actionLabel: 'Practice Test Series',
        actionUrl: '/exams',
      });
    }

    // Weak Topic Tip
    if (weakTopics.length > 0) {
      const topWeak = weakTopics[0];
      tips.push({
        id: 'weak_topic_target',
        title: `Priority Topic: ${topWeak.topicName}`,
        description: `You've missed ${topWeak.wrongCount} question(s) in "${topWeak.topicName}" (${topWeak.subjectName}). Reviewing core formulas and concepts for this topic will yield quick score improvements.`,
        category: 'SUBJECT',
        actionLabel: 'Practice Mocks',
        actionUrl: topWeak.practiceUrl,
      });
    }

    // Time Management Tip
    if (timeAnalysis.verdict !== 'Balanced Pace') {
      tips.push({
        id: 'pacing_optimization',
        title: timeAnalysis.verdict,
        description: timeAnalysis.advice,
        category: 'SPEED',
      });
    }

    // Accuracy Milestone Tip
    if (overallAccuracyPercent >= 80) {
      tips.push({
        id: 'high_accuracy_maintain',
        title: 'Outstanding Accuracy (>80%)',
        description:
          'Your precision is strong. Now focus on increasing your solving speed to attempt more questions and maximize your total score.',
        category: 'ACCURACY',
      });
    } else if (totalAttempts === 1) {
      tips.push({
        id: 'calibrate_baseline',
        title: 'Baseline Test Established',
        description:
          'Great job completing your first test! Your personalized recommendations will become significantly sharper and more accurate as you attempt 2–3 more mock tests.',
        category: 'STRATEGY',
        actionLabel: 'Attempt Next Mock Test',
        actionUrl: '/exams/hp-patwari',
      });
    }

    return NextResponse.json({
      success: true,
      hasData: true,
      totalAttempts,
      overallAccuracy: overallAccuracyPercent,
      overallTrend,
      scoreDelta,
      accuracyDelta,
      sectionAnalysis,
      weakTopics,
      timeAnalysis,
      progressTimeline,
      tips,
    });
  } catch (err: any) {
    console.error('Error generating student performance analysis:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate performance analysis.' },
      { status: 500 }
    );
  }
}
