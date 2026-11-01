'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, RotateCcw, AlertCircle, BookOpen } from '@/components/v2/Icons';
import { UnderlineTabs } from '@/components/v2';
import styles from './page.module.css';

interface QuestionResultItem {
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionTextHi: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  options: {
    id: string;
    label: number;
    text: string;
    textHi: string | null;
  }[];
  userAnswer: number | null;
  correctOption: number;
  isCorrect: boolean;
  isAnswered: boolean;
  marks: number;
  negativeMarks: number;
  explanation: string;
  explanationHi: string;
  timeSpent: number;
}

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
  questionResults?: QuestionResultItem[];
}

function TestResultContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params?.testId as string;
  const paramAttemptId = searchParams.get('attemptId');

  const [result, setResult] = useState<TestSubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'correct' | 'wrong' | 'skipped'>('all');

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

        // Fetch full attempt from database (includes questionResults with subjects & options)
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
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to load scorecard from database.';
          setError(message);
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

  // Compute subject-wise breakdown from real questionResults
  const subjectStats = useMemo(() => {
    if (!result?.questionResults || result.questionResults.length === 0) return [];

    const map = new Map<string, { name: string; total: number; correct: number; wrong: number; score: number }>();

    for (const q of result.questionResults) {
      const subjectName = q.subjectName || 'General';
      const existing = map.get(subjectName) || { name: subjectName, total: 0, correct: 0, wrong: 0, score: 0 };
      existing.total += 1;
      if (q.isCorrect) {
        existing.correct += 1;
        existing.score += q.marks;
      } else if (q.isAnswered && !q.isCorrect) {
        existing.wrong += 1;
        existing.score -= q.negativeMarks;
      }
      map.set(subjectName, existing);
    }

    return Array.from(map.values()).map((sub) => {
      const attempted = sub.correct + sub.wrong;
      const acc = attempted > 0 ? Math.round((sub.correct / attempted) * 100) : 0;
      const pct = sub.total > 0 ? Math.round((Math.max(0, sub.score) / sub.total) * 100) : 0;
      return {
        ...sub,
        acc,
        pct,
      };
    });
  }, [result]);

  // Compute weak focus topics
  const focusTopics = useMemo(() => {
    if (subjectStats.length === 0) return [];
    return subjectStats
      .filter((s) => s.acc < 65 || s.wrong > 0)
      .sort((a, b) => a.acc - b.acc)
      .slice(0, 4)
      .map((s) => s.name);
  }, [subjectStats]);

  // Filtered questions for preview
  const filteredQuestions = useMemo(() => {
    if (!result?.questionResults) return [];
    if (activeTab === 'all') return result.questionResults;
    if (activeTab === 'correct') return result.questionResults.filter((q) => q.isCorrect);
    if (activeTab === 'wrong') return result.questionResults.filter((q) => q.isAnswered && !q.isCorrect);
    if (activeTab === 'skipped') return result.questionResults.filter((q) => !q.isAnswered);
    return result.questionResults;
  }, [result, activeTab]);

  if (isLoading) {
    return (
      <div style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--v2-text-muted, #4B5168)' }}>
        <div style={{ width: 40, height: 40, border: '3.5px solid #E0E7FF', borderTopColor: '#4338CA', borderRadius: '50%', animation: 'v2-spin 0.8s linear infinite', margin: '0 auto 1.5rem' }} />
        <p style={{ fontWeight: 600 }}>Loading scorecard from database...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{ maxWidth: '560px', margin: '5rem auto', padding: '2.5rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E3E6F5', boxShadow: '0 8px 30px -12px rgba(11, 16, 38, 0.08)' }}>
        <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0B1026' }}>No Result Available</h2>
        <p style={{ color: '#4B5168', marginBottom: '1.5rem', fontSize: '14.5px', lineHeight: 1.5 }}>
          {error || 'No test result found for your account. Please complete a test attempt first.'}
        </p>
        <Link href={`/test/${encodeURIComponent(testId)}/instructions`} style={{ display: 'inline-flex', padding: '12px 24px', background: '#4338CA', color: '#fff', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>
          Start Test Attempt
        </Link>
      </div>
    );
  }

  // Format time taken
  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    }
    return `${mins}m ${s}s`;
  };

  const totalPossible = result.totalPossibleMarks || 100;
  const scorePct = Math.max(0, result.score) / totalPossible;
  const ringOffset = (440 * (1 - Math.min(1, Math.max(0, scorePct)))).toFixed(1);
  const verdict = result.percentage >= 60 ? 'Great attempt' : result.percentage >= 40 ? 'Moderate effort' : 'Keep practising';

  // Marks earned vs lost
  const marksEarned = (result.correctCount * (result.questionResults?.[0]?.marks || 1)).toFixed(1);
  const marksLost = (result.wrongCount * (result.questionResults?.[0]?.negativeMarks || 0.25)).toFixed(2);

  const filterTabs = [
    { id: 'all', label: `All (${result.totalQuestions})` },
    { id: 'correct', label: `Correct (${result.correctCount})` },
    { id: 'wrong', label: `Wrong (${result.wrongCount})` },
    { id: 'skipped', label: `Skipped (${result.unansweredCount})` },
  ];

  const analysisUrl = `/test/${encodeURIComponent(result.testId)}/analysis?attemptId=${encodeURIComponent(result.attemptId)}`;
  const reattemptUrl = `/test/${encodeURIComponent(result.testId)}/instructions`;

  return (
    <div className={styles.container}>
      {/* Back Link */}
      <Link href="/dashboard" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      {/* Result Hero (Scorecard.reference.html) */}
      <section className={`${styles.heroCard} ${styles.panel} ${styles.d1}`}>
        {/* Far mountain silhouette */}
        <svg aria-hidden="true" viewBox="0 0 600 160" preserveAspectRatio="none" className={styles.farMountains}>
          <path d="M0 160 L80 90 L150 120 L240 50 L330 115 L420 70 L510 120 L600 80 L600 160 Z" fill="#3A378F" />
        </svg>

        {/* Golden sparkle stars */}
        <svg className={styles.spark} aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" style={{ top: 26, right: '12%', animationDelay: '0s' }}>
          <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="#FCD34D" />
        </svg>
        <svg className={styles.spark} aria-hidden="true" width="12" height="12" viewBox="0 0 20 20" style={{ top: 70, right: '26%', animationDelay: '0.8s' }}>
          <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="#FCD34D" />
        </svg>
        <svg className={styles.spark} aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" style={{ bottom: 40, right: '8%', animationDelay: '1.4s' }}>
          <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="#FCD34D" />
        </svg>
        <svg className={styles.spark} aria-hidden="true" width="10" height="10" viewBox="0 0 20 20" style={{ top: 40, left: '46%', animationDelay: '0.4s' }}>
          <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="#FCD34D" />
        </svg>

        <div className={styles.heroContent}>
          {/* Animated Circular Score Ring */}
          <div className={styles.ringWrap}>
            <svg className={styles.scoreSvg} viewBox="0 0 170 170" role="img" aria-label={`Score ${result.score} out of ${result.totalPossibleMarks}`}>
              <circle cx="85" cy="85" r="70" className={styles.ringBg} />
              <circle
                cx="85"
                cy="85"
                r="70"
                className={styles.ringProg}
                style={{ strokeDashoffset: ringOffset }}
              />
            </svg>
            <div className={styles.ringTextWrap}>
              <span className={styles.scoreBig}>{result.score}</span>
              <span className={styles.scoreSub}>out of {result.totalPossibleMarks}</span>
            </div>
          </div>

          <div className={styles.heroDetails}>
            <span className={styles.verdictBadge}>{verdict}</span>
            <h1 className={styles.heroTitle}>Mock complete! {result.testName}</h1>
            <p className={styles.heroMeta}>
              Submitted{' '}
              {new Date(result.submittedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · Time taken {formatSeconds(result.timeTaken)}
            </p>
            <div className={styles.heroActions}>
              <Link href={analysisUrl} className={styles.btnReview}>
                Review answers
                <ArrowRight size={16} />
              </Link>
              <Link href={reattemptUrl} className={styles.btnReattempt}>
                <RotateCcw size={16} />
                Re-attempt
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats 4-Grid */}
      <section className={`${styles.statsGrid} ${styles.panel} ${styles.d2}`} style={{ background: 'transparent', padding: 0, border: 'none', boxShadow: 'none' }}>
        <div className={styles.statTile}>
          <span className={styles.statLabel}>
            <span className={styles.statDot} style={{ background: '#16A34A' }} />
            Correct
          </span>
          <span className={styles.statVal}>{result.correctCount}</span>
          <span className={styles.statSub}>+{marksEarned} marks</span>
        </div>

        <div className={styles.statTile}>
          <span className={styles.statLabel}>
            <span className={styles.statDot} style={{ background: '#DC2626' }} />
            Wrong
          </span>
          <span className={styles.statVal}>{result.wrongCount}</span>
          <span className={styles.statSub}>−{marksLost} marks</span>
        </div>

        <div className={styles.statTile}>
          <span className={styles.statLabel}>
            <span className={styles.statDot} style={{ background: '#9AA0BC' }} />
            Skipped
          </span>
          <span className={styles.statVal}>{result.unansweredCount}</span>
          <span className={styles.statSub}>0 marks</span>
        </div>

        <div className={styles.statTile}>
          <span className={styles.statLabel}>
            <span className={styles.statDot} style={{ background: '#4338CA' }} />
            Accuracy
          </span>
          <span className={styles.statVal}>{result.accuracy}%</span>
          <span className={styles.statSub}>of attempted</span>
        </div>
      </section>

      {/* 2-Column Section Grid (Subject-wise & Next Steps) */}
      <div className={styles.sgrid}>
        {/* Left: Subject-wise Performance */}
        <section className={`${styles.sectionCard} ${styles.panel} ${styles.d3}`}>
          <h2 className={styles.sectionTitle}>Subject-wise performance</h2>
          {subjectStats.length > 0 ? (
            subjectStats.map((sub) => {
              const accClass = sub.acc >= 75 ? styles.accHigh : sub.acc >= 60 ? styles.accMid : styles.accLow;
              const barBg = sub.acc >= 75 ? '#16A34A' : sub.acc >= 60 ? '#F59E0B' : '#DC2626';

              return (
                <div key={sub.name} className={styles.subjectRow}>
                  <div className={styles.subjectTop}>
                    <span>{sub.name}</span>
                    <span className={styles.subjectScore}>
                      {sub.correct} / {sub.total}
                      <span className={`${styles.accBadge} ${accClass}`}>{sub.acc}%</span>
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${sub.pct}%`, background: barBg }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: 'var(--v2-text-muted, #4B5168)', fontSize: '14px', margin: 0 }}>
              Full subject-wise breakdown is available in Deep Analysis.
            </p>
          )}
        </section>

        {/* Right: Next steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* Mistake Book Promo Card */}
          <section className={`${styles.mistakePromoCard} ${styles.panel} ${styles.d3}`}>
            <div className={styles.mistakePromoHeader}>
              <span className={styles.mistakeIconWrap}>
                <BookOpen size={22} />
              </span>
              <div>
                <div className={styles.mistakePromoTitle}>{result.wrongCount} mistakes saved</div>
                <div className={styles.mistakePromoSub}>Added to your Mistake Book</div>
              </div>
            </div>
            <p className={styles.mistakePromoText}>
              Revise them now while they are fresh. Every wrong answer comes with the correct answer and step-by-step explanation.
            </p>
            <Link href="/dashboard/mistakes" className={styles.btnMistake}>
              Open Mistake Book
              <ArrowRight size={16} />
            </Link>
          </section>

          {/* Focus next */}
          {focusTopics.length > 0 && (
            <section className={`${styles.focusCard} ${styles.panel} ${styles.d4}`}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Focus next</h2>
              <div className={styles.focusTags}>
                {focusTopics.map((topic) => (
                  <span key={topic} className={styles.focusTag}>
                    {topic}
                  </span>
                ))}
              </div>
              <Link href={result.examSlug ? `/exams/${result.examSlug}` : '/exams'} className={styles.focusNextLink}>
                Practice more mocks in series →
              </Link>
            </section>
          )}
        </div>
      </div>

      {/* Answer review preview */}
      <section className={`${styles.reviewSection} ${styles.panel} ${styles.d4}`}>
        <div className={styles.reviewHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Question review</h2>
          <Link href={analysisUrl} className={styles.seeAllLink}>
            See all {result.totalQuestions}
          </Link>
        </div>

        <UnderlineTabs
          tabs={filterTabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredQuestions.slice(0, 5).map((q) => {
            const isCorrect = q.isCorrect;
            const isSkipped = !q.isAnswered;
            const isWrong = q.isAnswered && !q.isCorrect;

            const badgeClass = isCorrect
              ? styles.qbadgeCorrect
              : isWrong
              ? styles.qbadgeWrong
              : styles.qbadgeSkipped;

            const tagClass = isCorrect
              ? styles.qtagCorrect
              : isWrong
              ? styles.qtagWrong
              : styles.qtagSkipped;

            const statusText = isCorrect ? 'Correct' : isWrong ? 'Wrong' : 'Skipped';

            const userOpt = q.options?.find((o) => o.label === q.userAnswer);
            const corrOpt = q.options?.find((o) => o.label === q.correctOption);

            let metaText = q.subjectName;
            if (isSkipped) {
              metaText += ' · Not answered';
            } else if (isCorrect) {
              metaText += ` · Your answer: ${userOpt?.text || `Option ${q.userAnswer}`}`;
            } else {
              metaText += ` · Your answer: ${userOpt?.text || `Option ${q.userAnswer}`} · Correct: ${corrOpt?.text || `Option ${q.correctOption}`}`;
            }

            return (
              <Link
                key={q.questionId}
                href={`${analysisUrl}#q-${q.questionId}`}
                className={styles.qrow}
              >
                <span className={`${styles.qbadge} ${badgeClass}`}>{q.questionNumber}</span>
                <span className={styles.qtextWrap}>
                  <span className={styles.qt}>{q.questionText}</span>
                  <span className={styles.qmeta}>{metaText}</span>
                </span>
                <span className={`${styles.qtag} ${tagClass}`}>{statusText}</span>
              </Link>
            );
          })}
        </div>

        <Link href={analysisUrl} className={styles.btnAllQuestions}>
          Review all {result.totalQuestions} questions
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}

export default function TestResultPage() {
  return (
    <Suspense fallback={<div style={{ padding: '6rem', textAlign: 'center', color: '#4B5168' }}>Loading scorecard...</div>}>
      <TestResultContent />
    </Suspense>
  );
}
