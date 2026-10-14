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
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { POPULAR_EXAMS, HP_POLICE_MOCKS } from '@/lib/mock-data';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [stats, setStats] = React.useState<any>(null);
  const [recentAttempts, setRecentAttempts] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      try {
        const [statsRes, paymentsRes] = await Promise.all([
          fetch('/api/user/dashboard-stats', { cache: 'no-store' }),
          fetch('/api/user/payments', { cache: 'no-store' }),
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
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

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
          <Link href="/test/hp-police-mock-1/instructions">
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
      </section>

      {/* Recent Test Attempts History */}
      <section className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Test Attempts</h2>
          <Link href="/exams/hp-police-constable" className={styles.viewMoreLink}>
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
                    No test attempts recorded yet. Take your first mock to see your performance history here!
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
          <Link href="/exams" className={styles.viewMoreLink}>
            Explore Test Series →
          </Link>
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
