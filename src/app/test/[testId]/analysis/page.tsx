'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckIcon,
  XIcon,
  Bookmark,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
} from '@/components/v2/Icons';
import { UnderlineTabs } from '@/components/v2';
import styles from './page.module.css';

interface OptionItem {
  id: string;
  label: number;
  text: string;
  textHi: string | null;
}

interface QuestionResultItem {
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionTextHi: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  options: OptionItem[];
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

interface TestResult {
  attemptId: string;
  testId: string;
  testName: string;
  examName?: string;
  submittedAt: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  score: number;
  totalPossibleMarks: number;
  percentage: number;
  accuracy: number;
  timeTaken: number;
  bookmarkedIds: string[];
  questionResults: QuestionResultItem[];
}

function TestAnalysisInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params?.testId as string;
  const paramAttemptId = searchParams.get('attemptId');

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'review' | 'diagnostics'>('review');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped' | 'bookmarked'>('all');
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  // Bookmarks state
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set());
  // Expanded options state: Set of questionIds that have options expanded
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());

  const questions: QuestionResultItem[] = testResult?.questionResults || [];

  useEffect(() => {
    let isMounted = true;

    if (searchParams?.get('preview') === 'true') {
      setTestResult({
        attemptId: 'preview-attempt-1',
        testId: testId || 'mock-1',
        testName: 'HP Patwari · Full Mock 1',
        examName: 'HP Patwari Exam',
        submittedAt: new Date().toISOString(),
        totalQuestions: 100,
        correctCount: 78,
        wrongCount: 16,
        unansweredCount: 6,
        score: 74,
        totalPossibleMarks: 100,
        percentage: 74,
        accuracy: 83,
        timeTaken: 4320,
        bookmarkedIds: ['q-1'],
        questionResults: [
          {
            questionId: 'q-1',
            questionNumber: 1,
            questionText: "Which present-day river was known as 'Vipasha' in the Vedic period?",
            questionTextHi: "वैदिक काल में किस वर्तमान नदी को 'विपाशा' के नाम से जाना जाता था?",
            subjectId: 'sub-1',
            subjectName: 'HP GK',
            topicName: 'Rivers & Geography',
            options: [
              { id: 'opt-1', label: 1, text: 'Beas', textHi: 'ब्यास' },
              { id: 'opt-2', label: 2, text: 'Ravi', textHi: 'रावी' },
              { id: 'opt-3', label: 3, text: 'Chenab', textHi: 'चेनाब' },
              { id: 'opt-4', label: 4, text: 'Satluj', textHi: 'सतलुज' },
            ],
            userAnswer: 1,
            correctOption: 1,
            isCorrect: true,
            isAnswered: true,
            marks: 1,
            negativeMarks: 0.25,
            explanation: 'Beas was known as Arjikiya in the Rigveda and Vipasha in later Sanskrit literature.',
            explanationHi: 'ब्यास को ऋग्वेद में अर्जिकिया और बाद के संस्कृत साहित्य में विपाशा के नाम से जाना जाता था।',
            timeSpent: 45,
          },
          {
            questionId: 'q-2',
            questionNumber: 2,
            questionText: 'Which district of Himachal Pradesh is the largest by geographic area?',
            questionTextHi: 'भौगोलिक क्षेत्रफल की दृष्टि से हिमाचल प्रदेश का सबसे बड़ा जिला कौन सा है?',
            subjectId: 'sub-1',
            subjectName: 'HP GK',
            topicName: 'District Geography',
            options: [
              { id: 'opt-21', label: 1, text: 'Kinnaur', textHi: 'किन्नौर' },
              { id: 'opt-22', label: 2, text: 'Lahaul and Spiti', textHi: 'लाहौल और स्पीति' },
              { id: 'opt-23', label: 3, text: 'Chamba', textHi: 'चंबा' },
              { id: 'opt-24', label: 4, text: 'Kangra', textHi: 'कांगड़ा' },
            ],
            userAnswer: 1,
            correctOption: 2,
            isCorrect: false,
            isAnswered: true,
            marks: 1,
            negativeMarks: 0.25,
            explanation: 'Lahaul and Spiti is the largest district covering 13,835 sq km (24.85% of total area).',
            explanationHi: 'लाहौल और स्पीति 13,835 वर्ग किमी क्षेत्रफल के साथ सबसे बड़ा जिला है।',
            timeSpent: 30,
          },
          {
            questionId: 'q-3',
            questionNumber: 3,
            questionText: 'In which year did Himachal Pradesh achieve full statehood?',
            questionTextHi: 'हिमाचल प्रदेश को पूर्ण राज्य का दर्जा किस वर्ष प्राप्त हुआ था?',
            subjectId: 'sub-2',
            subjectName: 'General Knowledge',
            topicName: 'Modern History',
            options: [
              { id: 'opt-31', label: 1, text: '1948', textHi: '1948' },
              { id: 'opt-32', label: 2, text: '1956', textHi: '1956' },
              { id: 'opt-33', label: 3, text: '1971', textHi: '1971' },
              { id: 'opt-34', label: 4, text: '1966', textHi: '1966' },
            ],
            userAnswer: null,
            correctOption: 3,
            isCorrect: false,
            isAnswered: false,
            marks: 1,
            negativeMarks: 0.25,
            explanation: 'Himachal Pradesh became the 18th state of India on 25 January 1971.',
            explanationHi: '25 जनवरी 1971 को हिमाचल प्रदेश भारत का 18वां राज्य बना।',
            timeSpent: 15,
          },
        ],
      });
      setBookmarkedSet(new Set(['q-1']));
      setIsLoading(false);
      return;
    }

    async function loadAnalysisFromDb() {
      setIsLoading(true);
      setError(null);

      try {
        let effectiveAttemptId = paramAttemptId;

        // If no attemptId in URL, query latest attempt from DB
        if (!effectiveAttemptId) {
          const latestRes = await fetch(`/api/tests/${encodeURIComponent(testId)}/attempts/latest`, {
            cache: 'no-store',
          });
          if (latestRes.ok) {
            const latestData = await latestRes.json();
            effectiveAttemptId = latestData.attemptId;
          } else {
            const errData = await latestRes.json().catch(() => ({}));
            throw new Error(errData.error || 'No submitted attempts found for this test.');
          }
        }

        if (!effectiveAttemptId) {
          throw new Error('No test result found. Please complete a test attempt first.');
        }

        // Fetch attempt from database
        const res = await fetch(`/api/attempts/${encodeURIComponent(effectiveAttemptId)}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load analysis (HTTP ${res.status})`);
        }

        const data = await res.json();
        if (isMounted) {
          setTestResult(data.result);
          if (data.result.bookmarkedIds) {
            setBookmarkedSet(new Set(data.result.bookmarkedIds));
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to load test analysis from database.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (testId) {
      loadAnalysisFromDb();
    }

    return () => {
      isMounted = false;
    };
  }, [testId, paramAttemptId]);

  // Subject diagnostics calculation
  const subjectBreakdown = useMemo(() => {
    const subjectsMap: Record<
      string,
      {
        id: string;
        name: string;
        totalQuestions: number;
        correct: number;
        wrong: number;
        unattempted: number;
        score: number;
        timeSpent: number;
      }
    > = {};

    questions.forEach((q) => {
      const subKey = q.subjectName || 'General';
      if (!subjectsMap[subKey]) {
        subjectsMap[subKey] = {
          id: subKey,
          name: q.subjectName || 'General',
          totalQuestions: 0,
          correct: 0,
          wrong: 0,
          unattempted: 0,
          score: 0,
          timeSpent: 0,
        };
      }

      const sub = subjectsMap[subKey];
      sub.totalQuestions++;

      if (q.isCorrect) {
        sub.correct++;
        sub.score += q.marks;
      } else if (q.isAnswered) {
        sub.wrong++;
        sub.score -= q.negativeMarks;
      } else {
        sub.unattempted++;
      }

      sub.timeSpent += q.timeSpent || 0;
    });

    return Object.values(subjectsMap);
  }, [questions]);

  // Top strengths and weaknesses
  const { strengths, weaknesses } = useMemo(() => {
    const eligibleStrengths = subjectBreakdown
      .filter((sub) => {
        const attempted = sub.correct + sub.wrong;
        if (attempted === 0) return false;
        const acc = (sub.correct / attempted) * 100;
        return acc >= 60;
      })
      .sort((a, b) => {
        const accA = a.correct / (a.correct + a.wrong);
        const accB = b.correct / (b.correct + b.wrong);
        return accB - accA;
      });

    const eligibleWeaknesses = subjectBreakdown
      .filter((sub) => {
        const attempted = sub.correct + sub.wrong;
        if (attempted > 0 && sub.wrong === 0 && sub.unattempted === 0) return false;
        return true;
      })
      .sort((a, b) => {
        if (b.wrong !== a.wrong) return b.wrong - a.wrong;
        const accA = a.correct + a.wrong > 0 ? a.correct / (a.correct + a.wrong) : 0;
        const accB = b.correct + b.wrong > 0 ? b.correct / (b.correct + b.wrong) : 0;
        return accA - accB;
      });

    return {
      strengths: eligibleStrengths.slice(0, 3),
      weaknesses: eligibleWeaknesses.slice(0, 3),
    };
  }, [subjectBreakdown]);

  // Filtered review questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (reviewFilter === 'correct') return q.isCorrect;
      if (reviewFilter === 'wrong') return q.isAnswered && !q.isCorrect;
      if (reviewFilter === 'skipped') return !q.isAnswered;
      if (reviewFilter === 'bookmarked') return bookmarkedSet.has(q.questionId);
      return true;
    });
  }, [questions, reviewFilter, bookmarkedSet]);

  const toggleBookmark = async (qId: string) => {
    const isCurrently = bookmarkedSet.has(qId);
    setBookmarkedSet((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });

    try {
      if (isCurrently) {
        await fetch(`/api/user/bookmarks/${encodeURIComponent(qId)}`, { method: 'DELETE' });
      } else {
        await fetch('/api/user/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: qId }),
        });
      }
    } catch (e) {
      console.warn('Failed to sync bookmark to server:', e);
    }
  };

  const toggleOptionsExpand = (qId: string) => {
    setExpandedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--v2-text-muted, #4B5168)' }}>
        <div style={{ width: 40, height: 40, border: '3.5px solid #E0E7FF', borderTopColor: '#4338CA', borderRadius: '50%', animation: 'v2-spin 0.8s linear infinite', margin: '0 auto 1.5rem' }} />
        <p style={{ fontWeight: 600 }}>Loading detailed analysis and solutions...</p>
      </div>
    );
  }

  if (error || !testResult) {
    return (
      <div style={{ maxWidth: '560px', margin: '5rem auto', padding: '2.5rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E3E6F5' }}>
        <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0B1026' }}>Analysis Unavailable</h2>
        <p style={{ color: '#4B5168', marginBottom: '1.5rem', fontSize: '14.5px' }}>{error || 'No test result found. Please complete a test attempt first.'}</p>
        <Link href={`/test/${encodeURIComponent(testId)}/result`} style={{ color: '#4338CA', fontWeight: 700, textDecoration: 'none' }}>
          ← Back to Scorecard
        </Link>
      </div>
    );
  }

  const filterTabs = [
    { id: 'all', label: `All (${questions.length})` },
    { id: 'correct', label: `Correct (${testResult.correctCount})` },
    { id: 'wrong', label: `Wrong (${testResult.wrongCount})` },
    { id: 'skipped', label: `Skipped (${testResult.unansweredCount})` },
    { id: 'bookmarked', label: `Bookmarked (${bookmarkedSet.size})` },
  ];

  return (
    <div className={styles.container}>
      {/* Back Link */}
      <Link href={`/test/${encodeURIComponent(testId)}/result?attemptId=${encodeURIComponent(testResult.attemptId)}`} className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Scorecard
      </Link>

      {/* Header Bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Detailed Analysis & Question Solutions</h1>
          <p className={styles.subtitle}>{testResult.testName} · Score: {testResult.score}/{testResult.totalPossibleMarks}</p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.langToggleBtn}
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          >
            <span>{lang === 'en' ? 'हिन्दी में देखें' : 'View in English'}</span>
          </button>
        </div>
      </header>

      {/* View Switcher Tabs */}
      <div className={styles.viewTabs}>
        <button
          type="button"
          className={`${styles.viewTabBtn} ${activeView === 'review' ? styles.viewTabBtnActive : ''}`}
          onClick={() => setActiveView('review')}
        >
          Question-by-Question Solutions ({questions.length})
        </button>
        <button
          type="button"
          className={`${styles.viewTabBtn} ${activeView === 'diagnostics' ? styles.viewTabBtnActive : ''}`}
          onClick={() => setActiveView('diagnostics')}
        >
          Subject Diagnostics & Strengths
        </button>
      </div>

      {/* VIEW 1: Question-by-Question Review */}
      {activeView === 'review' && (
        <div>
          {/* Underline Tabs */}
          <div className={styles.filterBar}>
            <UnderlineTabs
              tabs={filterTabs}
              activeTab={reviewFilter}
              onChange={(id) => setReviewFilter(id as typeof reviewFilter)}
            />
          </div>

          {/* Questions List */}
          <div className={styles.questionsList}>
            {filteredQuestions.map((q) => {
              const isCorrect = q.isCorrect;
              const isAnswered = q.isAnswered;
              const isBookmarked = bookmarkedSet.has(q.questionId);
              const isOptionsExpanded = expandedOptions.has(q.questionId);

              const badgeClass = isCorrect
                ? styles.qBadgeCorrect
                : isAnswered
                ? styles.qBadgeWrong
                : styles.qBadgeSkipped;

              const statusBadgeStyle = isCorrect
                ? { background: '#DCFCE7', color: '#166534' }
                : isAnswered
                ? { background: '#FEE2E2', color: '#991B1B' }
                : { background: '#EEF0F8', color: '#3F4460' };

              const statusText = isCorrect
                ? `Correct (+${q.marks})`
                : isAnswered
                ? `Wrong (-${q.negativeMarks})`
                : 'Skipped (0)';

              const userOpt = q.options?.find((o) => o.label === q.userAnswer);
              const corrOpt = q.options?.find((o) => o.label === q.correctOption);

              return (
                <div key={q.questionId} id={`q-${q.questionId}`} className={styles.questionCard}>
                  {/* Top Bar */}
                  <div className={styles.qHeader}>
                    <div className={styles.qHeaderLeft}>
                      <span className={`${styles.qBadge} ${badgeClass}`}>
                        {q.questionNumber}
                      </span>
                      <span className={styles.qSubject}>{q.subjectName}</span>
                      {q.topicName && <span className={styles.qTopic}>· {q.topicName}</span>}
                    </div>

                    <div className={styles.qHeaderRight}>
                      <span className={styles.qStatusPill} style={statusBadgeStyle}>
                        {statusText}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(q.questionId)}
                        className={`${styles.qActionIconBtn} ${isBookmarked ? styles.qActionBookmarked : ''}`}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                      >
                        <Bookmark size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className={styles.qText}>
                    {lang === 'hi' && q.questionTextHi ? q.questionTextHi : q.questionText}
                  </p>

                  {/* Comparison Answer Boxes (Red ✗ / Green ✓ Mistake Book System) */}
                  <div className={styles.answersGrid}>
                    {isAnswered && !isCorrect && (
                      <div className={styles.ansBoxWrong}>
                        <span className={styles.ansBoxLabel} style={{ color: '#991B1B' }}>
                          <XIcon size={14} />
                          Your answer
                        </span>
                        <span className={styles.ansBoxText} style={{ color: '#7F1D1D' }}>
                          Option {q.userAnswer}: {lang === 'hi' && userOpt?.textHi ? userOpt.textHi : userOpt?.text || `Option ${q.userAnswer}`}
                        </span>
                      </div>
                    )}

                    {!isAnswered && (
                      <div className={styles.ansBoxSkipped}>
                        <span className={styles.ansBoxLabel} style={{ color: '#4B5168' }}>
                          Skipped
                        </span>
                        <span className={styles.ansBoxText} style={{ color: '#3B4160' }}>
                          Not answered
                        </span>
                      </div>
                    )}

                    <div className={styles.ansBoxCorrect}>
                      <span className={styles.ansBoxLabel} style={{ color: '#166534' }}>
                        <CheckIcon size={14} />
                        {isCorrect ? 'Your answer (Correct)' : 'Correct answer'}
                      </span>
                      <span className={styles.ansBoxText} style={{ color: '#14532D' }}>
                        Option {q.correctOption}: {lang === 'hi' && corrOpt?.textHi ? corrOpt.textHi : corrOpt?.text || `Option ${q.correctOption}`}
                      </span>
                    </div>
                  </div>

                  {/* Toggle all options */}
                  {q.options && q.options.length > 0 && (
                    <button
                      type="button"
                      className={styles.optionsToggle}
                      onClick={() => toggleOptionsExpand(q.questionId)}
                    >
                      {isOptionsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span>{isOptionsExpanded ? 'Hide all 4 options' : 'View all 4 options'}</span>
                    </button>
                  )}

                  {isOptionsExpanded && q.options && (
                    <div className={styles.optionsList}>
                      {q.options.map((opt) => {
                        const isThisCorrect = opt.label === q.correctOption;
                        const isThisUser = opt.label === q.userAnswer;

                        let borderStyle = '1px solid #E2E8F0';
                        let bgStyle = '#FFFFFF';
                        if (isThisCorrect) {
                          borderStyle = '1.5px solid #86EFAC';
                          bgStyle = '#DCFCE7';
                        } else if (isThisUser) {
                          borderStyle = '1.5px solid #FCA5A5';
                          bgStyle = '#FEE2E2';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={styles.optionRow}
                            style={{ border: borderStyle, background: bgStyle }}
                          >
                            <span className={styles.optionLabel}>{opt.label}</span>
                            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>
                              {lang === 'hi' && opt.textHi ? opt.textHi : opt.text}
                            </span>
                            {isThisCorrect && (
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                                ✓ Correct
                              </span>
                            )}
                            {isThisUser && !isThisCorrect && (
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#991B1B' }}>
                                ✗ Your answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Step-by-Step Explanation */}
                  {(q.explanation || q.explanationHi) && (
                    <div className={styles.explanationBox}>
                      <div className={styles.explanationHeader}>
                        <BookOpen size={16} />
                        <span>Step-by-Step Solution & Notes</span>
                      </div>
                      <p className={styles.explanationText}>
                        {lang === 'hi' && q.explanationHi ? q.explanationHi : q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Subject Diagnostics */}
      {activeView === 'diagnostics' && (
        <div>
          <div className={styles.diagnosticsGrid}>
            {/* Strengths */}
            <div className={styles.diagCard}>
              <div className={styles.strengthHeader}>
                <CheckIcon size={20} />
                <span>Key Strengths</span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5168' }}>
                Sections where you showed highest accuracy:
              </p>
              <div className={styles.diagList}>
                {strengths.length > 0 ? (
                  strengths.map((s) => {
                    const attempted = s.correct + s.wrong;
                    const acc = attempted > 0 ? Math.round((s.correct / attempted) * 100) : 0;
                    return (
                      <div key={s.id} className={styles.diagItem}>
                        <span>{s.name}</span>
                        <span className={styles.accPillGreen}>{acc}% Accuracy</span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '13.5px', color: '#4B5168' }}>Practice more to establish strengths.</p>
                )}
              </div>
            </div>

            {/* Improvement areas */}
            <div className={styles.diagCard}>
              <div className={styles.weaknessHeader}>
                <AlertCircle size={20} />
                <span>Priority Improvement Areas</span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5168' }}>
                Revise these subjects in your Mistake Book to stop losing marks:
              </p>
              <div className={styles.diagList}>
                {weaknesses.length > 0 ? (
                  weaknesses.map((w) => {
                    const attempted = w.correct + w.wrong;
                    const acc = attempted > 0 ? Math.round((w.correct / attempted) * 100) : 0;
                    return (
                      <div key={w.id} className={styles.diagItem}>
                        <span>{w.name}</span>
                        <span className={styles.accPillRed}>
                          {w.wrong > 0 ? `${w.wrong} Mistakes` : `${acc}% Accuracy`}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '13.5px', color: '#4B5168' }}>All sections performing solidly.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sectional cards */}
          <div className={styles.panel}>
            <h2 style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: 800 }}>
              Sectional Score Breakdown
            </h2>
            <div className={styles.subjectCardsGrid}>
              {subjectBreakdown.map((sub) => {
                const attempted = sub.correct + sub.wrong;
                const acc = attempted > 0 ? Math.round((sub.correct / attempted) * 100) : 0;
                return (
                  <div key={sub.id} className={styles.subjectCard}>
                    <div className={styles.subCardTop}>
                      <span className={styles.subName}>{sub.name}</span>
                      <span className={styles.subScore}>
                        {sub.score.toFixed(1)} / {sub.totalQuestions} Marks
                      </span>
                    </div>
                    <div className={styles.subStatsRow}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Acc</span>
                        <span className={styles.statVal}>{acc}%</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Right</span>
                        <span className={styles.statVal} style={{ color: '#16A34A' }}>
                          {sub.correct}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Wrong</span>
                        <span className={styles.statVal} style={{ color: '#DC2626' }}>
                          {sub.wrong}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Skip</span>
                        <span className={styles.statVal} style={{ color: '#4B5168' }}>
                          {sub.unattempted}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestAnalysisPage() {
  return (
    <Suspense fallback={<div style={{ padding: '6rem', textAlign: 'center', color: '#4B5168' }}>Loading analysis...</div>}>
      <TestAnalysisInner />
    </Suspense>
  );
}
