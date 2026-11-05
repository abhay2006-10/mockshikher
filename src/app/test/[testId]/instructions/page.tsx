'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Play, AlertCircle } from '@/components/v2/Icons';
import { Chip } from '@/components/v2/Chip';
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
  examSlug?: string;
  examName?: string;
  category?: string;
}

export default function TestInstructionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = params?.testId as string;
  const isPreview = searchParams?.get('preview') === 'true';

  const [test, setTest] = useState<TestInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasAgreed, setHasAgreed] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');

  const [requiresPurchase, setRequiresPurchase] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!testId) return;

    if (isPreview) {
      setTest({
        id: testId,
        name: 'HP Patwari 2026 · Full Simulation Mock 1',
        testNumber: 1,
        totalQuestions: 100,
        durationMinutes: 90,
        totalMarks: 100,
        negativeMarksPerQuestion: 0.25,
        marksPerQuestion: 1,
        isFree: true,
        examName: 'HP Patwari Exam',
        examSlug: 'hp-patwari',
        category: 'Revenue Department',
      });
      setIsLoading(false);
      return;
    }

    const loadMeta = async () => {
      try {
        const res = await fetch(`/api/tests/${encodeURIComponent(testId)}/meta`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (!isMounted) return;
        if (!res.ok) {
          throw new Error(data.error || `Failed to load test (${res.status})`);
        }
        if (data.requiresPurchase) {
          setRequiresPurchase(true);
          setError('This mock test is part of the full series. Unlock the series to attempt.');
          return;
        }
        if (data.requiresAuth) {
          setRequiresAuth(true);
          setError('Please sign in to access this mock test.');
          return;
        }
        setTest(data.test);

        // Pre-fetch questions into sessionStorage while student reads instructions
        fetch(`/api/tests/${encodeURIComponent(testId)}/questions`)
          .then((r) => (r.ok ? r.json() : null))
          .then((qData) => {
            if (qData?.questions?.length && isMounted) {
              try {
                const str = JSON.stringify(qData);
                sessionStorage.setItem(`mockshikhar_questions_${testId}`, str);
                if (qData.test?.id && qData.test.id !== testId) {
                  sessionStorage.setItem(`mockshikhar_questions_${qData.test.id}`, str);
                }
              } catch {
                // Ignore quota
              }
            }
          })
          .catch(() => {});
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Unable to connect to the server.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMeta();

    return () => {
      isMounted = false;
    };
  }, [testId]);

  const handleStartTest = () => {
    if (!hasAgreed || !test || test.totalQuestions === 0) return;
    router.push(`/test/${encodeURIComponent(testId)}/attempt?lang=${selectedLanguage}`);
  };

  if (isLoading) {
    return (
      <main className={styles.container}>
        <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--slate)' }}>
          <p>Loading test configuration...</p>
        </div>
      </main>
    );
  }

  if (requiresPurchase) {
    return (
      <main className={styles.container}>
        <div className={styles.headerCard} style={{ textAlign: 'center', alignItems: 'center' }}>
          <AlertCircle size={40} color="#F59E0B" />
          <h1 className={styles.title}>Premium Test Series Required</h1>
          <p className={styles.specSub}>
            This mock test is locked. All mock tests in this series are 100% free for all students.
          </p>
          <Link href="/exams" className={styles.startTestBtn} style={{ textDecoration: 'none' }}>
            <span>Explore Free Tests</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  if (requiresAuth) {
    return (
      <main className={styles.container}>
        <div className={styles.headerCard} style={{ textAlign: 'center', alignItems: 'center' }}>
          <AlertCircle size={40} color="#4338CA" />
          <h1 className={styles.title}>Login Required</h1>
          <p className={styles.specSub}>
            Please sign in to attempt this mock test and save your progress.
          </p>
          <Link href="/auth/login" className={styles.startTestBtn} style={{ textDecoration: 'none' }}>
            <span>Sign In to Continue</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  if (error || !test) {
    return (
      <main className={styles.container}>
        <div className={styles.headerCard} style={{ textAlign: 'center', alignItems: 'center' }}>
          <AlertCircle size={40} color="#DC2626" />
          <h1 className={styles.title}>Unable to Load Mock Test</h1>
          <p className={styles.specSub}>{error || 'Test not found'}</p>
          <Link href="/exams" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Return to All Exams</span>
          </Link>
        </div>
      </main>
    );
  }

  const isEmpty = test.totalQuestions === 0;

  return (
    <main className={styles.container}>
      {/* Back Link */}
      <div>
        <Link
          href={test.examSlug ? `/exams/${test.examSlug}` : '/exams'}
          className={styles.backLink}
        >
          <ArrowLeft size={16} />
          <span>Back to Exam Series</span>
        </Link>
      </div>

      {/* 1. Test Summary Header Card */}
      <section className={styles.headerCard} aria-label="Test Details">
        <div className={styles.badgeRow}>
          <Chip category={test.category || test.examName || 'HP Exams'} />
          {test.isFree ? (
            <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 9px', borderRadius: 999, background: '#DCFCE7', color: '#166534' }}>
              Free Sample Mock
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 9px', borderRadius: 999, background: '#EEF1FF', color: '#4338CA' }}>
              Full Mock Series
            </span>
          )}
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)' }}>
            Mock #{test.testNumber}
          </span>
        </div>

        <h1 className={styles.title}>{test.name}</h1>

        {/* 4-Spec Tiles */}
        <div className={styles.specGrid}>
          <div className={styles.specTile}>
            <span className={styles.specVal}>{test.totalQuestions} Questions</span>
            <span className={styles.specSub}>Bilingual (EN / HI)</span>
          </div>

          <div className={styles.specTile}>
            <span className={styles.specVal}>{test.durationMinutes} Minutes</span>
            <span className={styles.specSub}>Countdown timer</span>
          </div>

          <div className={styles.specTile}>
            <span className={styles.specVal}>{test.totalMarks} Total Marks</span>
            <span className={styles.specSub}>+{test.marksPerQuestion} mark each</span>
          </div>

          <div className={styles.specTile}>
            <span className={styles.specVal}>
              {Number(test.negativeMarksPerQuestion) > 0
                ? `-${test.negativeMarksPerQuestion} Penalty`
                : 'No Penalty'}
            </span>
            <span className={styles.specSub}>Per incorrect response</span>
          </div>
        </div>
      </section>

      {/* 2. Instructions & Rules Card */}
      <section className={styles.instructionsCard} aria-label="Important Instructions">
        <h2 className={styles.sectionHeading}>Important Test Instructions</h2>

        <div className={styles.rulesList}>
          <div className={styles.ruleItem}>
            <span className={styles.ruleNum}>1</span>
            <div>
              <strong>Server-Synched Timer:</strong> The countdown clock runs continuously. If time runs out, your test will <strong>automatically submit</strong> and your score will be computed instantly.
            </div>
          </div>

          <div className={styles.ruleItem}>
            <span className={styles.ruleNum}>2</span>
            <div>
              <strong>Marking &amp; Scoring:</strong> Each correct response awards <strong>+{test.marksPerQuestion} mark</strong>.{' '}
              {Number(test.negativeMarksPerQuestion) > 0 ? (
                <span>Each incorrect response deducts <strong>-{test.negativeMarksPerQuestion} mark</strong>. </span>
              ) : (
                <span>There is <strong>no negative marking</strong> for incorrect responses. </span>
              )}
              Unanswered questions carry zero penalty.
            </div>
          </div>

          <div className={styles.ruleItem}>
            <span className={styles.ruleNum}>3</span>
            <div>
              <strong>Auto-Save &amp; Question Palette:</strong> Your responses are automatically saved in real time. You can navigate between questions, change your answers, or mark questions for review before submitting.
              <div className={styles.legendGrid}>
                <div className={styles.legendItem}>
                  <span className={styles.dotGray} aria-hidden="true" />
                  <span>Not Visited</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.dotRed} aria-hidden="true" />
                  <span>Not Answered</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.dotGreen} aria-hidden="true" />
                  <span>Answered</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.dotPurple} aria-hidden="true" />
                  <span>Marked for Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className={styles.langRow}>
          <span className={styles.langLabel}>Default Question Language:</span>
          <div className={styles.langPillGroup} role="radiogroup" aria-label="Default Question Language">
            <button
              type="button"
              role="radio"
              aria-checked={selectedLanguage === 'en'}
              onClick={() => setSelectedLanguage('en')}
              className={`${styles.langPill} ${selectedLanguage === 'en' ? styles.langPillActive : ''}`}
            >
              English
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={selectedLanguage === 'hi'}
              onClick={() => setSelectedLanguage('hi')}
              className={`${styles.langPill} ${selectedLanguage === 'hi' ? styles.langPillActive : ''}`}
            >
              <span className={styles.hindiLabel}>हिन्दी</span> (Hindi)
            </button>
          </div>
        </div>

        {/* Declaration Checkbox */}
        {!isEmpty && (
          <label className={styles.declarationRow}>
            <span className={styles.customCheckbox}>
              <input
                type="checkbox"
                className={styles.hiddenCheckbox}
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
              />
              <span className={`${styles.checkboxBox} ${hasAgreed ? styles.checkboxChecked : ''}`}>
                {hasAgreed && (
                  <svg viewBox="0 0 16 16" fill="none" className={styles.checkIcon}>
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </span>
            <span className={styles.declarationText}>
              I have read and understood all the exam instructions and rules outlined above. I am ready to begin the test.
            </span>
          </label>
        )}

        {/* ONE CLEAR START TEST BUTTON */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.startTestBtn}
            disabled={!hasAgreed || isEmpty}
            onClick={handleStartTest}
          >
            <span>Start Test Now</span>
            <ArrowRight size={18} />
          </button>
          {!hasAgreed && !isEmpty && (
            <p className={styles.startHelperLine}>Tick the box above to start</p>
          )}
        </div>
      </section>
    </main>
  );
}
