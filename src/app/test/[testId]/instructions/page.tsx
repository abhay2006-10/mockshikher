'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  AlertCircle,
  ShieldAlert,
  Languages,
  CheckCircle,
  Play,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import styles from './page.module.css';

interface TestInfo {
  id: string;
  name: string;
  testNumber: number;
  isFree: boolean;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  negativeMarksPerQuestion: number;
  marksPerQuestion: number;
}

export default function TestInstructionsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;

  const [test, setTest] = useState<TestInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasAgreed, setHasAgreed] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');

  const [requiresPurchase, setRequiresPurchase] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);

  const fetchTestDetails = async () => {
    setIsLoading(true);
    setError(null);
    setRequiresPurchase(false);
    setRequiresAuth(false);
    try {
      const res = await fetch(`/api/tests/${encodeURIComponent(testId)}/questions`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.requiresPurchase) {
          setRequiresPurchase(true);
          setError(data.error || 'This premium mock test is locked.');
          return;
        }
        if (data.requiresAuth) {
          setRequiresAuth(true);
          setError(data.error || 'Please log in to access this mock test.');
          return;
        }
        throw new Error(data.error || `Failed to load test (${res.status})`);
      }
      setTest(data.test);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (testId) {
      fetchTestDetails();
    }
  }, [testId]);

  const handleStartTest = () => {
    if (!hasAgreed || !test || test.totalQuestions === 0) return;
    router.push(`/test/${encodeURIComponent(test.id)}/attempt?lang=${selectedLanguage}`);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
          <p>Loading test configuration...</p>
        </div>
      </div>
    );
  }

  if (requiresPurchase) {
    return (
      <div className={styles.container}>
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2.5rem', textAlign: 'center', background: 'var(--color-bg-primary, #1e293b)', borderRadius: '16px', border: '1px solid var(--color-border, #334155)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>Premium Mock Test Locked</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            This mock test is part of the full test series. Purchase the bundle to unlock all 10 full-length mock tests permanently.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="outline" size="md" onClick={() => router.back()}>
              Go Back
            </Button>
            <Link href="/exams">
              <Button variant="accent" size="md">
                Unlock Test Series
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (requiresAuth) {
    return (
      <div className={styles.container}>
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2.5rem', textAlign: 'center', background: 'var(--color-bg-primary, #1e293b)', borderRadius: '16px', border: '1px solid var(--color-border, #334155)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle size={48} color="#60a5fa" style={{ margin: '0 auto' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>Login Required</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Please sign in to verify your test series purchase and attempt this mock test.
          </p>
          <Link href="/auth/login">
            <Button variant="primary" size="md">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className={styles.container}>
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center', background: 'var(--color-bg-card, #1e293b)', borderRadius: '12px', border: '1px solid var(--color-border, #334155)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>Failed to Load Mock Test</h2>
          <p style={{ color: 'var(--color-text-secondary, #94a3b8)', marginBottom: '1.5rem' }}>{error || 'Test not found'}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button variant="outline" size="md" onClick={() => router.back()}>
              Go Back
            </Button>
            <Button variant="primary" size="md" onClick={fetchTestDetails}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = test.totalQuestions === 0;

  return (
    <div className={styles.container}>
      <Link href="/exams/hp-police-constable" className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Back to Exam Details</span>
      </Link>

      <div className={styles.wrapper}>
        {/* Test Summary Card */}
        <header className={styles.headerCard}>
          <div className={styles.headerBadgeRow}>
            {test.isFree ? (
              <Badge variant="success" size="sm">
                FREE FULL-LENGTH MOCK
              </Badge>
            ) : (
              <Badge variant="primary" size="sm">
                PREMIUM MOCK TEST
              </Badge>
            )}
            <Badge variant="neutral" size="sm">
              Mock #{test.testNumber}
            </Badge>
          </div>

          <h1 className={styles.testTitle}>{test.name}</h1>

          {isEmpty ? (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <AlertTriangle size={32} color="#f87171" />
              <div>
                <h3 style={{ margin: 0, color: '#f87171', fontSize: '1.1rem', fontWeight: 700 }}>
                  No questions have been added to this test yet
                </h3>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary, #94a3b8)', fontSize: '0.9rem' }}>
                  This test is currently being authored by the editorial team. Please select another mock test or check back soon.
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.specGrid}>
              <div className={styles.specBox}>
                <HelpCircle size={18} className={styles.specIcon} />
                <div>
                  <span className={styles.specVal}>{test.totalQuestions} Questions</span>
                  <span className={styles.specSub}>Bilingual (EN / HI)</span>
                </div>
              </div>

              <div className={styles.specBox}>
                <Clock size={18} className={styles.specIcon} />
                <div>
                  <span className={styles.specVal}>{test.durationMinutes} Minutes</span>
                  <span className={styles.specSub}>Continuous countdown</span>
                </div>
              </div>

              <div className={styles.specBox}>
                <CheckCircle size={18} className={styles.specIcon} />
                <div>
                  <span className={styles.specVal}>{test.totalMarks} Maximum Marks</span>
                  <span className={styles.specSub}>+{test.marksPerQuestion} per question</span>
                </div>
              </div>

              <div className={styles.specBox}>
                {Number(test.negativeMarksPerQuestion) > 0 ? (
                  <>
                    <AlertCircle size={18} className={styles.negSpecIcon} />
                    <div>
                      <span className={styles.specVal}>-{test.negativeMarksPerQuestion} Negative Marking</span>
                      <span className={styles.specSub}>For incorrect answers</span>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className={styles.specIcon} style={{ color: '#10B981' }} />
                    <div>
                      <span className={styles.specVal}>No Negative Marking</span>
                      <span className={styles.specSub}>0 penalty for wrong answers</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Instructions Body */}
        <div className={styles.instructionsCard}>
          <h2 className={styles.sectionHeading}>Important Test Instructions</h2>

          <div className={styles.rulesList}>
            <div className={styles.ruleItem}>
              <span className={styles.ruleNum}>1</span>
              <div>
                <strong>Server-Synched Timer:</strong> The clock is continuously counted down. When the timer hits 00:00:00, your test will be <strong>automatically submitted</strong> and your score calculated.
              </div>
            </div>

            <div className={styles.ruleItem}>
              <span className={styles.ruleNum}>2</span>
              <div>
                <strong>Marking Scheme:</strong> Each correct answer awards <strong>+{test.marksPerQuestion} mark</strong>.{' '}
                {Number(test.negativeMarksPerQuestion) > 0 ? (
                  <span>Each wrong answer deducts <strong>-{test.negativeMarksPerQuestion} mark</strong>. </span>
                ) : (
                  <span>There is <strong>no penalty (0 marks deducted)</strong> for wrong answers. </span>
                )}
                Unattempted questions carry zero penalty.
              </div>
            </div>

            <div className={styles.ruleItem}>
              <span className={styles.ruleNum}>3</span>
              <div>
                <strong>Question Palette Legend:</strong>
                <div className={styles.legendGrid}>
                  <div className={styles.legendItem}>
                    <span className={`${styles.paletteDot} ${styles.dotNotVisited}`} />
                    <span>Not Visited</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.paletteDot} ${styles.dotNotAnswered}`} />
                    <span>Not Answered</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.paletteDot} ${styles.dotAnswered}`} />
                    <span>Answered</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.paletteDot} ${styles.dotMarked}`} />
                    <span>Marked for Review</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.paletteDot} ${styles.dotAnsweredMarked}`} />
                    <span>Answered & Marked (Evaluated)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.ruleItem}>
              <span className={styles.ruleNum}>4</span>
              <div>
                <strong>Anti-Cheating Policy:</strong> Navigating away from this tab, opening developer consoles, or refreshing may trigger an automatic test submission.
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.declarationSection}>
            <div className={styles.languageSelectRow}>
              <div className={styles.langLabel}>
                <Languages size={18} />
                <span>Default Question Language:</span>
              </div>
              <div className={styles.langToggleGroup}>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('en')}
                  className={`${styles.langBtn} ${
                    selectedLanguage === 'en' ? styles.langBtnActive : ''
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('hi')}
                  className={`${styles.langBtn} ${
                    selectedLanguage === 'hi' ? styles.langBtnActive : ''
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>
            </div>

            {!isEmpty && (
              <div className={styles.declarationBox}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    id="agree-checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.declarationText}>
                    I have read and understood all the test instructions and exam rules outlined above. I agree not to use unauthorized study materials during this attempt.
                  </span>
                </label>
              </div>
            )}

            <div className={styles.startActionRow}>
              {isEmpty ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Button
                    variant="outline"
                    size="lg"
                    disabled
                  >
                    No Questions Added (Cannot Start)
                  </Button>
                  <Link href="/exams/hp-police-constable">
                    <Button variant="primary" size="lg">
                      Choose Another Mock Test
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  variant="accent"
                  size="lg"
                  leftIcon={<Play size={18} />}
                  disabled={!hasAgreed}
                  onClick={handleStartTest}
                >
                  I Am Ready — Start Test
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
