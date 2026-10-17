'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  BarChart3,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Zap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import styles from './page.module.css';

interface TestSubmissionData {
  attemptId: string;
  testId: string;
  testName: string;
  examId?: string;
  examName?: string;
  examSlug?: string;
  examPrice?: number;
  examTotalMocks?: number;
  submittedAt: string;
  isAutoSubmit: boolean;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  score: number;
  totalPossibleMarks: number;
  percentage: number;
  accuracy: number;
  timeTaken: number;
}

function TestResultContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params?.testId as string;
  const paramAttemptId = searchParams.get('attemptId');

  const [result, setResult] = useState<TestSubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadResultFromDb() {
      setIsLoading(true);
      setError(null);

      try {
        let effectiveAttemptId = paramAttemptId;

        // If no attemptId in URL, fetch latest submitted attempt for this user from DB
        if (!effectiveAttemptId) {
          const latestRes = await fetch(`/api/tests/${encodeURIComponent(testId)}/attempts/latest`, {
            cache: 'no-store',
          });
          if (latestRes.ok) {
            const latestData = await latestRes.json();
            effectiveAttemptId = latestData.attemptId;
          } else {
            const errData = await latestRes.json().catch(() => ({}));
            throw new Error(errData.error || 'No submitted attempts found for your account.');
          }
        }

        if (!effectiveAttemptId) {
          throw new Error('No test result found. Please complete a test attempt first.');
        }

        // Fetch attempt from database by user & attemptId
        const res = await fetch(`/api/attempts/${encodeURIComponent(effectiveAttemptId)}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load scorecard (HTTP ${res.status})`);
        }

        const data = await res.json();
        if (isMounted) {
          setResult(data.result);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load scorecard from database.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (testId) {
      loadResultFromDb();
    }

    return () => {
      isMounted = false;
    };
  }, [testId, paramAttemptId]);

  if (isLoading) {
    return (
      <div style={{ padding: '5rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Loading scorecard from database...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{ maxWidth: '560px', margin: '4rem auto', padding: '2rem', textAlign: 'center', background: 'var(--color-bg-card, #1e293b)', borderRadius: '12px', border: '1px solid var(--color-border, #334155)' }}>
        <AlertCircle size={44} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>No Result Available</h2>
        <p style={{ color: 'var(--color-text-secondary, #94a3b8)', marginBottom: '1.5rem' }}>
          {error || 'No test result found for your account. Please complete a test attempt first.'}
        </p>
        <Link href={`/test/${encodeURIComponent(testId)}/instructions`}>
          <Button variant="primary" size="md">
            Start Test Attempt
          </Button>
        </Link>
      </div>
    );
  }

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Badge variant="success" size="md">
          {result.isAutoSubmit ? 'Test Auto-Submitted on Time Limit' : 'Test Completed Successfully'}
        </Badge>
        <h1 className={styles.title}>{result.testName} Scorecard</h1>
        <p className={styles.subtitle}>
          Submitted on{' '}
          {new Date(result.submittedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </header>

      {/* Main Score Banner */}
      <div className={styles.scoreHero}>
        <div className={styles.scoreLeft}>
          <div className={styles.trophyIconWrap}>
            <Trophy size={42} className={styles.trophyIcon} />
          </div>
          <div className={styles.scoreNumbers}>
            <span className={styles.scoreLabel}>Final Normalized Score</span>
            <div className={styles.scoreValueRow}>
              <span className={styles.bigScore}>{result.score}</span>
              <span className={styles.totalScore}>/ {result.totalPossibleMarks} Marks</span>
            </div>
            <div className={styles.scorePercentages}>
              <span>Percentage: {result.percentage}%</span>
              <span>•</span>
              <span>Accuracy: {result.accuracy}%</span>
            </div>
          </div>
        </div>

        <div className={styles.scoreRight}>
          <div className={styles.gradeBadge}>
            <span className={styles.gradeLabel}>Result Status</span>
            <span className={styles.gradeVal}>
              {result.percentage >= 60 ? 'Exam Ready' : result.percentage >= 40 ? 'Moderate' : 'Needs Practice'}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Metrics Grid */}
      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricNum}>{result.correctCount}</span>
            <span className={styles.metricLabel}>Correct Questions</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <XCircle size={24} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricNum}>{result.wrongCount}</span>
            <span className={styles.metricLabel}>Wrong (Mistake Book)</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }}>
            <HelpCircle size={24} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricNum}>{result.unansweredCount}</span>
            <span className={styles.metricLabel}>Unattempted</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Clock size={24} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricNum}>{formatSeconds(result.timeTaken)}</span>
            <span className={styles.metricLabel}>Time Spent</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Target size={24} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricNum}>{result.accuracy}%</span>
            <span className={styles.metricLabel}>Attempt Accuracy</span>
          </div>
        </div>
      </section>

      {/* Action Buttons Row */}
      <div className={styles.actionRow}>
        <Link href={`/test/${encodeURIComponent(result.testId)}/analysis?attemptId=${encodeURIComponent(result.attemptId)}`}>
          <Button
            variant="accent"
            size="lg"
            leftIcon={<BarChart3 size={18} />}
            rightIcon={<ArrowRight size={18} />}
          >
            View Deep Subject Analysis & Solutions
          </Button>
        </Link>

        <Link href={`/test/${encodeURIComponent(result.testId)}/instructions`}>
          <Button variant="secondary" size="lg" leftIcon={<RotateCcw size={18} />}>
            Reattempt Mock Test
          </Button>
        </Link>
      </div>

      {/* Premium Upgrade Promotion */}
      <section className={styles.upgradeBox}>
        <div className={styles.upgradeContent}>
          <div className={styles.upgradeBadge}>
            <Sparkles size={14} />
            <span>Targeting Selection?</span>
          </div>
          <h3 className={styles.upgradeTitle}>
            Unlock {result.examTotalMocks ? `All ${result.examTotalMocks}` : 'All'} Full-Length {result.examName || 'Mock'} Tests for Just ₹{result.examPrice || 200}
          </h3>
          <p className={styles.upgradeDesc}>
            Don&apos;t stop with 1 test. Practice the remaining simulation mocks, access your
            personal Mistake Book, and track your rank against real competitors.
          </p>
        </div>

        <Link href={result.examSlug ? `/exams/${result.examSlug}` : '/exams'} className={styles.upgradeLink}>
          <Button variant="accent" size="lg" leftIcon={<Zap size={18} />}>
            Unlock Full Series • ₹{result.examPrice || 200}
          </Button>
        </Link>
      </section>
    </div>
  );
}

export default function TestResultPage() {
  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>Loading scorecard...</div>}>
      <TestResultContent />
    </Suspense>
  );
}
