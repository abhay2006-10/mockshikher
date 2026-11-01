'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight } from '@/components/v2/Icons';
import { Chip, getAccuracyColor } from '@/components/v2';
import styles from './dashboard.module.css';

interface DashboardStats {
  totalAttempts: number;
  latestScore: number;
  latestTotalMarks: number;
  latestPercentage: number;
  latestTestName: string;
  overallAccuracy: number;
  totalCorrect: number;
  totalAnswered: number;
  mistakesCount: number;
  bookmarksCount: number;
  unrevisedMistakes: number;
  bestScore: number;
  avgPercentage: number;
}

interface RecentAttempt {
  id: string;
  testId: string;
  testName: string;
  date: string;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  timeTaken: string;
}

interface ActiveAttempt {
  id: string;
  testId: string;
  name: string;
  answered: number;
  total: number;
  leftText: string;
  progressPercent: number;
}

interface EnrolledProgress {
  examId: string;
  slug: string;
  name: string;
  category: string;
  done: number;
  total: number;
  nextTestNumber: number;
  nextTestId: string;
}

interface WeakTopic {
  name: string;
  mistakesCount: number;
  accuracy: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Aspirant';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<ActiveAttempt | null>(null);
  const [enrolledProgress, setEnrolledProgress] = useState<EnrolledProgress[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/user/dashboard-stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        setStats(data.stats || null);
        setRecentAttempts(data.recentAttempts || []);
        setActiveAttempt(data.activeAttempt || null);
        setEnrolledProgress(data.enrolledProgress || []);
        setWeakTopics(data.weakTopics || []);
      })
      .catch((err) => console.error('Dashboard data load error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className={styles.main}>
      {/* 1. TOP GREETING */}
      <div className={styles.greetingBar}>
        <div className={styles.greetingText}>
          <h1 className={styles.hello}>Welcome back, {userName}</h1>
          <p className={styles.subHello}>One mock a day keeps the exam fear away.</p>
        </div>
        <Link href="/exams" className={styles.browseExamsBtn}>
          <span>Browse exams</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* 2. MAIN 2-COLUMN DASHBOARD GRID */}
      <div className={styles.dashboardGrid}>
        {/* LEFT COLUMN (2fr) */}
        <div className={styles.leftCol}>
          {/* A. Resume Mock Panel */}
          <section className={styles.resumePanel} aria-label="Current Mock Status">
            {/* Mountain Ridge SVG */}
            <svg
              aria-hidden="true"
              viewBox="0 0 600 160"
              preserveAspectRatio="none"
              className={styles.mountainRidgeSvg}
            >
              <path
                d="M0 160 L80 90 L150 120 L240 50 L330 115 L420 70 L510 120 L600 80 L600 160 Z"
                fill="#3A378F"
              />
              <path
                d="M240 50 L222 66 L234 62 L242 70 L252 62 L258 64 Z"
                fill="#5B57B8"
              />
            </svg>

            <div className={styles.resumeContent}>
              {activeAttempt ? (
                <>
                  <span className={styles.resumePill}>Continue your mock</span>
                  <h2 className={styles.resumeTitle}>{activeAttempt.name}</h2>
                  <div className={styles.resumeMeta}>
                    <span>
                      {activeAttempt.answered} of {activeAttempt.total} answered
                    </span>
                    <span>{activeAttempt.leftText}</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressBarYellow}
                      style={{ width: `${Math.max(4, activeAttempt.progressPercent)}%` }}
                    />
                  </div>
                  <div className={styles.resumeActions}>
                    <Link
                      href={`/test/${activeAttempt.testId}/attempt`}
                      className={styles.resumeBtn}
                    >
                      <span>Resume mock</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link href="/exams" className={styles.newMockOutlineBtn}>
                      Start a new mock
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <span className={styles.resumePill}>Ready to practice</span>
                  <h2 className={styles.resumeTitle}>Take your next mock test</h2>
                  <p className={styles.resumeMeta}>
                    Regular timed practice builds exam pacing and eliminates negative marking.
                  </p>
                  <div className={styles.resumeActions}>
                    <Link href="/exams" className={styles.resumeBtn}>
                      <span>Explore Test Series</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* B. My Test Series Panel */}
          <section className={styles.panel} aria-label="Enrolled Test Series">
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>My test series</h2>
              <Link href="/exams" className={styles.panelActionLink}>
                View all
              </Link>
            </div>

            {enrolledProgress.length > 0 ? (
              <div className={styles.seriesList}>
                {enrolledProgress.map((item) => {
                  const pct =
                    item.total > 0 ? Math.round((item.done / item.total) * 100) : 0;
                  return (
                    <div key={item.examId} className={styles.seriesRow}>
                      <div className={styles.seriesRowLeft}>
                        <div className={styles.seriesNameRow}>
                          <Chip category={item.category} />
                          <span className={styles.seriesName}>{item.name}</span>
                        </div>
                        <div className={styles.seriesProgressWrap}>
                          <div className={styles.seriesTrack}>
                            <div
                              className={styles.seriesBarPrimary}
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                          <span className={styles.seriesProgressMeta}>
                            {item.done} of {item.total} mocks
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/test/${item.nextTestId}/instructions`}
                        className={styles.startMockBtn}
                      >
                        Start Mock {item.nextTestNumber}
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyStateBox}>
                <span>
                  You haven&apos;t enrolled in any full test series yet. Take a free mock test to get started!
                </span>
                <Link href="/exams" className={styles.emptyStateLink}>
                  Browse HP Exam Series →
                </Link>
              </div>
            )}
          </section>

          {/* C. Recent Results Panel */}
          <section className={styles.panel} aria-label="Recent Test Results">
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Recent results</h2>
              {recentAttempts.length > 0 && (
                <span className={styles.panelActionLink}>
                  {recentAttempts.length} attempt{recentAttempts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {recentAttempts.length > 0 ? (
              <>
                <div className={styles.resultsHeader}>
                  <span>Mock</span>
                  <span>Score</span>
                  <span>Accuracy</span>
                  <span />
                </div>
                <div className={styles.seriesList}>
                  {recentAttempts.slice(0, 5).map((att) => {
                    const accColor = getAccuracyColor(att.accuracy);
                    return (
                      <Link
                        key={att.id}
                        href={`/test/${att.testId}/result?attemptId=${att.id}`}
                        className={styles.resultRow}
                      >
                        <div className={styles.resultNameCol}>
                          <span className={styles.resultName}>{att.testName}</span>
                          <span className={styles.resultDate}>{att.date}</span>
                        </div>
                        <span className={styles.resultScore}>
                          {att.score} / {att.totalMarks}
                        </span>
                        <div className={styles.resultAccuracy}>
                          <span
                            className={styles.accPill}
                            style={{
                              backgroundColor: accColor.bg,
                              color: accColor.text,
                            }}
                          >
                            {att.accuracy}%
                          </span>
                        </div>
                        <span className={styles.reviewLink}>Review</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className={styles.emptyStateBox}>
                <span>
                  No completed mock tests yet. Take your first mock to see your score, accuracy, and detailed question review here.
                </span>
                <Link href="/exams" className={styles.emptyStateLink}>
                  Attempt a Free Mock →
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN (1fr) */}
        <div className={styles.rightCol}>
          {/* A. Your Progress (Stats Tiles 2x2) */}
          <section className={styles.panel} aria-label="Progress Statistics">
            <h2 className={styles.panelTitle}>Your progress</h2>
            <div className={styles.statsTilesGrid}>
              {/* Mocks Taken */}
              <div className={styles.statTile} style={{ background: '#EEF1FF' }}>
                <span className={styles.statTileLabel}>Mocks taken</span>
                <span className={styles.statTileValue}>
                  {stats?.totalAttempts ?? 0}
                </span>
              </div>

              {/* Avg Score */}
              <div className={styles.statTile} style={{ background: '#FEF3C7' }}>
                <span className={styles.statTileLabel}>Avg score</span>
                <span className={styles.statTileValue}>
                  {stats?.avgPercentage ?? 0}%
                </span>
              </div>

              {/* Accuracy */}
              <div className={styles.statTile} style={{ background: '#DCFCE7' }}>
                <span className={styles.statTileLabel}>Accuracy</span>
                <span className={styles.statTileValue}>
                  {stats?.overallAccuracy ?? 0}%
                </span>
              </div>

              {/* Best Score */}
              <div className={styles.statTile} style={{ background: '#FCE7F3' }}>
                <span className={styles.statTileLabel}>Best score</span>
                <span className={styles.statTileValue}>
                  {stats?.bestScore ?? 0}
                </span>
              </div>
            </div>
          </section>

          {/* B. Topics to Improve */}
          <section className={styles.panel} aria-label="Topics to Improve">
            <div className={styles.weakHeader}>
              <h2 className={styles.panelTitle}>Topics to improve</h2>
              <span className={styles.weakSub}>Based on your recorded mistakes</span>
            </div>

            {weakTopics.length > 0 ? (
              <div className={styles.weakList}>
                {weakTopics.map((topic) => (
                  <div key={topic.name} className={styles.weakItem}>
                    <div className={styles.weakItemTop}>
                      <span>{topic.name}</span>
                      <span className={styles.weakItemPct}>{topic.accuracy}%</span>
                    </div>
                    <div className={styles.weakTrack}>
                      <div
                        className={styles.weakBar}
                        style={{ width: `${Math.min(100, topic.accuracy)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyStateBox}>
                <span>
                  No weak topics identified yet. As you solve questions, topics where incorrect answers occur will appear here for focused revision.
                </span>
              </div>
            )}

            <Link href="/dashboard/mistakes" className={styles.mistakeBookBtn}>
              <span>Practise in Mistake Book</span>
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
