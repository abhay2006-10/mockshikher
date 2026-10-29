'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Target,
  Clock,
  BookOpen,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Zap,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  CreditCard,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import WhatsAppUpdatesSection from '@/components/common/WhatsAppUpdatesSection';
import NoticeBoard from '@/components/common/NoticeBoard';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [stats, setStats] = React.useState<any>(null);
  const [recentAttempts, setRecentAttempts] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [analysis, setAnalysis] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadAllData() {
      try {
        const [statsRes, paymentsRes, analysisRes] = await Promise.all([
          fetch('/api/user/dashboard-stats', { cache: 'no-store' }),
          fetch('/api/user/payments', { cache: 'no-store' }),
          fetch('/api/user/performance-analysis', { cache: 'no-store' }),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
          setRecentAttempts(data.recentAttempts || []);
        }

        if (paymentsRes.ok) {
          const payData = await paymentsRes.json();
          setPayments(payData.payments || []);
        }

        if (analysisRes.ok) {
          const analysisData = await analysisRes.json();
          setAnalysis(analysisData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllData();
  }, []);

  const hasTestHistory = analysis?.hasData && analysis?.totalAttempts > 0;
  const isBaselineOnly = analysis?.totalAttempts === 1;

  return (
    <div className={styles.container}>
      {/* Welcome Banner */}
      <header className={styles.welcomeBanner}>
        <div className={styles.welcomeLeft}>
          <div className={styles.badgeRow}>
            <Badge variant="accent" size="sm">
              <Sparkles size={12} />
              <span>Aspirant Portal</span>
            </Badge>
          </div>
          <h1 className={styles.welcomeTitle}>Welcome Back, Aspirant!</h1>
          <p className={styles.welcomeSubtitle}>
            Track your performance, practice your mistakes, and get exam-ready.
          </p>
        </div>

        <div className={styles.welcomeAction}>
          <Link href="/test/hp-patwari-mock-1/instructions">
            <Button variant="accent" size="lg" leftIcon={<Play size={18} />}>
              Resume Mock Preparation
            </Button>
          </Link>
        </div>
      </header>

      {/* Key Stats Metrics Grid */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Tests Attempted</span>
            <div className={styles.statIconBox}>
              <Trophy size={18} />
            </div>
          </div>
          <div className={styles.statNumber}>{stats?.totalAttempts ?? 0}</div>
          <span className={styles.statMeta}>{stats?.latestTestName || 'No tests taken yet'}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Latest Score</span>
            <div className={styles.statIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className={styles.statNumber}>{stats?.latestPercentage ?? 0}%</div>
          <span className={styles.statMeta}>{stats ? `${stats.latestScore} / ${stats.latestTotalMarks} Marks` : '—'}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Overall Accuracy</span>
            <div className={styles.statIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Target size={18} />
            </div>
          </div>
          <div className={styles.statNumber}>{stats?.overallAccuracy ?? 0}%</div>
          <span className={styles.statMeta}>{stats ? `${stats.totalCorrect} Correct / ${stats.totalAnswered} Attempted` : '—'}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Mistakes to Review</span>
            <div className={styles.statIconBox} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div className={styles.statNumber}>{stats?.mistakesCount ?? 0}</div>
          <span className={styles.statMeta}>
            <Link href="/dashboard/mistakes" className={styles.inlineLink}>
              Practice in Mistake Book →
            </Link>
          </span>
        </div>
      </section>

      {/* Mockshikhar In-App Notice Board — Prominently placed for high student visibility */}
      <NoticeBoard />

      {/* ========================================================
          1. TIPS TO IMPROVE PROGRESS (DEDICATED SECTION)
         ======================================================== */}
      {hasTestHistory && analysis?.tips?.length > 0 && (
        <section className={styles.historySection}>
          <div className={styles.performanceHeader}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lightbulb size={20} style={{ color: '#fbbf24' }} />
                <h2 className={styles.sectionTitle} style={{ fontSize: '1.25rem', margin: 0 }}>
                  Tips to Improve Progress
                </h2>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.35rem 0 0' }}>
                Personalized recommendations generated from your actual mock test results, accuracy, and solving pace.
              </p>
            </div>

            {analysis?.overallTrend && (
              <div
                className={`${styles.trendBadge} ${
                  analysis.overallTrend === 'IMPROVING'
                    ? styles.trendImproving
                    : analysis.overallTrend === 'NEEDS_FOCUS'
                    ? styles.trendNeedsFocus
                    : styles.trendConsistent
                }`}
              >
                {analysis.overallTrend === 'IMPROVING' && <TrendingUp size={14} />}
                {analysis.overallTrend === 'NEEDS_FOCUS' && <TrendingDown size={14} />}
                {analysis.overallTrend === 'CONSISTENT' && <Zap size={14} />}
                <span>
                  Trajectory:{' '}
                  {analysis.overallTrend === 'IMPROVING'
                    ? 'Upward (+Score)'
                    : analysis.overallTrend === 'NEEDS_FOCUS'
                    ? 'Needs Revision'
                    : 'Steady Performance'}
                </span>
              </div>
            )}
          </div>

          {isBaselineOnly && (
            <div className={styles.calibrationBanner}>
              <HelpCircle size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
              <div>
                <strong>Initial Baseline Active:</strong> You have completed 1 mock test. Recommendations will automatically calibrate and become more precise as you complete additional mocks.
              </div>
            </div>
          )}

          <div className={styles.tipsGrid}>
            {analysis.tips.map((tip: any) => {
              let catClass = styles.tipCategoryStrategy;
              if (tip.category === 'SUBJECT') catClass = styles.tipCategorySubject;
              if (tip.category === 'SPEED') catClass = styles.tipCategorySpeed;
              if (tip.category === 'ACCURACY') catClass = styles.tipCategoryAccuracy;

              return (
                <div key={tip.id} className={styles.tipCard}>
                  <div>
                    <div className={styles.tipCardHeader}>
                      <span className={`${styles.tipCategory} ${catClass}`}>
                        {tip.category}
                      </span>
                    </div>
                    <h3 className={styles.tipTitle} style={{ marginTop: '0.6rem' }}>
                      {tip.title}
                    </h3>
                    <p className={styles.tipDescription} style={{ marginTop: '0.4rem' }}>
                      {tip.description}
                    </p>
                  </div>

                  {tip.actionLabel && tip.actionUrl && (
                    <div className={styles.tipAction}>
                      <Link href={tip.actionUrl}>
                        <Button variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>
                          {tip.actionLabel}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          2. SECTION-WISE ANALYSIS ACROSS ALL MOCKS
         ======================================================== */}
      {hasTestHistory && analysis?.sectionAnalysis?.length > 0 && (
        <section className={styles.historySection}>
          <div className={styles.sectionHeader}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={20} style={{ color: '#60a5fa' }} />
                <h2 className={styles.sectionTitle} style={{ fontSize: '1.25rem', margin: 0 }}>
                  Section-wise Performance Breakdown
                </h2>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.35rem 0 0' }}>
                Your cumulative accuracy, marks earned, and speed across each examination subject.
              </p>
            </div>
          </div>

          <div className={styles.sectionsGrid}>
            {analysis.sectionAnalysis.map((sec: any) => {
              const isHigh = sec.accuracy >= 70;
              const isLow = sec.accuracy < 50;
              const barColor = isHigh ? '#10b981' : isLow ? '#ef4444' : '#3b82f6';

              return (
                <div key={sec.subjectId} className={styles.sectionCard}>
                  <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionTitle}>{sec.subjectName}</span>
                    <Badge
                      variant={sec.status === 'STRONG' ? 'success' : sec.status === 'WEAK' ? 'error' : 'info'}
                      size="sm"
                    >
                      {sec.status}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span className={styles.accuracyNumber} style={{ color: barColor }}>
                      {sec.accuracy}%
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                      Accuracy ({sec.correctCount} / {sec.attemptedCount} attempted)
                    </span>
                  </div>

                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${Math.min(sec.accuracy, 100)}%`, backgroundColor: barColor }}
                    />
                  </div>

                  <div className={styles.sectionStatsRow}>
                    <span>Score: {sec.scoreEarned} / {sec.maxMarksPossible} M</span>
                    <span>Avg Pace: {sec.avgTimePerQSeconds}s/Q</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          3. WEAK TOPIC DETECTION & TARGETED PRACTICE
         ======================================================== */}
      {hasTestHistory && analysis?.weakTopics?.length > 0 && (
        <section className={styles.historySection}>
          <div className={styles.sectionHeader}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} style={{ color: '#f87171' }} />
                <h2 className={styles.sectionTitle} style={{ fontSize: '1.25rem', margin: 0 }}>
                  Weak Topic Detection
                </h2>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.35rem 0 0' }}>
                Topics where incorrect answers repeatedly occurred. Target these for maximum score gains.
              </p>
            </div>
            <Link href="/dashboard/mistakes" className={styles.viewMoreLink}>
              Review in Mistake Book →
            </Link>
          </div>

          <div className={styles.weakTopicsGrid}>
            {analysis.weakTopics.map((top: any) => (
              <div key={top.topicId} className={styles.weakTopicCard}>
                <div className={styles.weakTopicLeft}>
                  <span className={styles.weakTopicSubject}>{top.subjectName}</span>
                  <span className={styles.weakTopicName}>{top.topicName}</span>
                  <span className={styles.weakTopicMeta}>
                    {top.wrongCount} incorrect • {top.accuracy}% accuracy
                  </span>
                </div>
                <Link href={top.practiceUrl}>
                  <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={13} />}>
                    Practice
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          4. TIME MANAGEMENT & PACING ANALYSIS
         ======================================================== */}
      {hasTestHistory && analysis?.timeAnalysis && (
        <section className={styles.historySection}>
          <div className={styles.sectionHeader}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: '#38bdf8' }} />
                <h2 className={styles.sectionTitle} style={{ fontSize: '1.25rem', margin: 0 }}>
                  Time Management Analysis
                </h2>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.35rem 0 0' }}>
                Comparing time spent versus total test duration and identifying potential time-sink traps.
              </p>
            </div>
          </div>

          <div className={styles.timeAnalysisCard}>
            <div className={styles.timePacingGrid}>
              <div className={styles.timePacingBox}>
                <span className={styles.timePacingLabel}>Avg Time per Question</span>
                <span className={styles.timePacingValue}>
                  {analysis.timeAnalysis.avgTimePerQuestionSec}s
                </span>
              </div>
              <div className={styles.timePacingBox}>
                <span className={styles.timePacingLabel}>Time on Correct Questions</span>
                <span className={styles.timePacingValue} style={{ color: '#10b981' }}>
                  {analysis.timeAnalysis.avgTimePerCorrectSec}s
                </span>
              </div>
              <div className={styles.timePacingBox}>
                <span className={styles.timePacingLabel}>Time on Wrong Questions</span>
                <span className={styles.timePacingValue} style={{ color: '#f87171' }}>
                  {analysis.timeAnalysis.avgTimePerWrongSec}s
                </span>
              </div>
              <div className={styles.timePacingBox}>
                <span className={styles.timePacingLabel}>Exam Time Utilization</span>
                <span className={styles.timePacingValue}>
                  {analysis.timeAnalysis.timeUtilizationPercent}%
                </span>
              </div>
            </div>

            <div className={styles.timeAdviceBox}>
              <Sparkles size={22} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  Pacing Diagnostic: {analysis.timeAnalysis.verdict}
                </strong>
                <p className={styles.timeAdviceText}>{analysis.timeAnalysis.advice}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Practice Tools Navigation Cards */}
      <section className={styles.toolsSection}>
        <div className={styles.toolCard}>
          <div className={styles.toolHeader}>
            <div className={styles.toolIconWrap} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className={styles.toolTitle}>Personal Mistake Book</h3>
              <p className={styles.toolDesc}>
                {stats?.mistakesCount ?? 0} question(s) automatically catalogued from your incorrect mock answers.
              </p>
            </div>
          </div>
          <Link href="/dashboard/mistakes">
            <Button variant="outline" size="md" rightIcon={<ArrowRight size={16} />}>
              Open Mistake Book
            </Button>
          </Link>
        </div>

        <div className={styles.toolCard}>
          <div className={styles.toolHeader}>
            <div className={styles.toolIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Bookmark size={24} />
            </div>
            <div>
              <h3 className={styles.toolTitle}>Saved Bookmarks</h3>
              <p className={styles.toolDesc}>
                {stats?.bookmarksCount ?? 0} question(s) marked for revision.
              </p>
            </div>
          </div>
          <Link href="/dashboard/bookmarks">
            <Button variant="outline" size="md" rightIcon={<ArrowRight size={16} />}>
              View Bookmarks
            </Button>
          </Link>
        </div>

        <div className={styles.toolCard}>
          <div className={styles.toolHeader}>
            <div className={styles.toolIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className={styles.toolTitle}>Payment History & Purchases</h3>
              <p className={styles.toolDesc}>
                {payments.length} verified order(s). View receipts and unlocked test bundles.
              </p>
            </div>
          </div>
          <Link href="/dashboard/payments">
            <Button variant="outline" size="md" rightIcon={<ArrowRight size={16} />}>
              View Payment History
            </Button>
          </Link>
        </div>
      </section>

      {/* Mockshikhar Updates — Official WhatsApp Channel */}
      <WhatsAppUpdatesSection sourceContext="dashboard" />

      {/* Recent Test Attempts History */}
      <section className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Test Attempts & Progress</h2>
          <Link href="/exams/hp-patwari" className={styles.viewMoreLink}>
            Browse More Mocks →
          </Link>
        </div>

        <div className={styles.historyTableWrapper}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Attempt Date</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Time Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentAttempts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-secondary)' }}>
                    No test attempts recorded yet. Take your first mock to see your performance history and tips here!
                  </td>
                </tr>
              ) : (
                recentAttempts.map((att) => (
                  <tr key={att.id}>
                    <td>
                      <strong>{att.testName}</strong>
                    </td>
                    <td>{att.date}</td>
                    <td>
                      <span className={styles.scoreHighlight}>
                        {att.score} / {att.totalMarks} ({att.percentage}%)
                      </span>
                    </td>
                    <td>{att.accuracy}%</td>
                    <td>{att.timeTaken}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link href={`/test/${att.testId}/result?attemptId=${att.id}`}>
                          <Button variant="secondary" size="sm">
                            Scorecard
                          </Button>
                        </Link>
                        <Link href={`/test/${att.testId}/analysis?attemptId=${att.id}`}>
                          <Button variant="outline" size="sm">
                            Analysis
                          </Button>
                        </Link>
                        <Link href={`/test/${att.testId}/instructions`}>
                          <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={13} />}>
                            Reattempt
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Student Payment History */}
      <section className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Payment & Subscription History</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Verified purchases and unlocked mock test bundles for your account.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="/dashboard/payments" className={styles.viewMoreLink}>
              Full Receipts & Invoices →
            </Link>
            <Link href="/exams" className={styles.viewMoreLink}>
              Explore Test Series →
            </Link>
          </div>
        </div>

        <div className={styles.historyTableWrapper}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Purchased Series</th>
                <th>Payment Date</th>
                <th>Amount Paid</th>
                <th>Mocks Included</th>
                <th>Status</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-secondary)' }}>
                    No payment records found. All free mock tests can be accessed without payment.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{p.examName}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Full Exam Bundle</span>
                      </div>
                    </td>
                    <td>{p.date}</td>
                    <td>
                      <span className={styles.scoreHighlight} style={{ fontSize: '1rem' }}>
                        ₹{p.amount}
                      </span>
                    </td>
                    <td>
                      <Badge variant="accent" size="sm">
                        {p.mockCount} Mock Tests
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="success" size="sm">
                        Verified
                      </Badge>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: 'var(--color-bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        {p.transactionId}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
