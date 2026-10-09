'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  Sparkles,
  BookOpen,
  Bookmark,
  TrendingDown,
  TrendingUp,
  Languages,
  Check,
  Filter,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
// No hardcoded question imports — questions come from server result data
import styles from './page.module.css';

interface QuestionResultItem {
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionTextHi: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  options: { id: string; label: string; text: string; textHi: string }[];
  userAnswer: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  isAnswered: boolean;
  marks: number;
  negativeMarks: number;
  explanation: string;
  explanationHi: string;
  timeSpent: number;
}

interface TestResult {
  testId: string;
  testName: string;
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

  const [testResult, setTestResult] = React.useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const questions: QuestionResultItem[] = testResult?.questionResults || [];

  const [activeTab, setActiveTab] = useState<'subject' | 'review'>('subject');
  const [reviewFilter, setReviewFilter] = useState<
    'all' | 'correct' | 'wrong' | 'unattempted' | 'bookmarked'
  >('all');
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  // Bookmarks & Mistake Book state
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set());
  const [mistakeBookSet, setMistakeBookSet] = useState<Set<string>>(new Set());

  // Results map: questionId -> result (includes correctOption and explanation from server)
  const questionResults = useMemo<Record<string, QuestionResultItem>>(() => {
    const map: Record<string, QuestionResultItem> = {};
    if (testResult?.questionResults) {
      testResult.questionResults.forEach((r) => { map[r.questionId] = r; });
    }
    return map;
  }, [testResult]);

  useEffect(() => {
    let isMounted = true;

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

        // Fetch attempt from database by user & attemptId
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
          const autoMistakes = new Set<string>();
          data.result.questionResults?.forEach((r: any) => {
            if (r.isAnswered && !r.isCorrect) autoMistakes.add(r.questionId);
          });
          setMistakeBookSet(autoMistakes);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load test analysis from database.');
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

  // Subject diagnostics calculation — derived entirely from server result data
  const subjectBreakdown = useMemo(() => {
    const subjectsMap: Record<
      string,
      {
        id: string;
        name: string;
        nameHi: string;
        totalQuestions: number;
        correct: number;
        wrong: number;
        unattempted: number;
        score: number;
        timeSpent: number;
      }
    > = {};

    questions.forEach((q) => {
      const subKey = q.subjectId || q.subjectName || 'general';
      if (!subjectsMap[subKey]) {
        subjectsMap[subKey] = {
          id: subKey,
          name: q.subjectName,
          nameHi: q.subjectName,
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

  // Format marks without misleading rounding (e.g. -0.25 / 5 instead of -0.3 / 5)
  const formatMarks = (val: number) => {
    const rounded = Math.round(val * 100) / 100;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
  };

  // Derive top strengths and weak areas
  const { strengths, weaknesses } = useMemo(() => {
    // Strengths: only subjects with accuracy >= 60% AND at least 1 attempted question
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
        if (accB !== accA) return accB - accA;
        return b.correct - a.correct;
      });

    // Priority areas for improvement: lowest accuracy or most wrong/skipped questions
    const eligibleWeaknesses = subjectBreakdown
      .filter((sub) => {
        // Exclude perfect subjects (all correct and none unattempted/wrong)
        const attempted = sub.correct + sub.wrong;
        if (attempted > 0 && sub.wrong === 0 && sub.unattempted === 0) return false;
        return true;
      })
      .sort((a, b) => {
        // First prioritize by highest wrong answers
        if (b.wrong !== a.wrong) return b.wrong - a.wrong;
        // Then by lowest accuracy for attempted questions
        const accA = (a.correct + a.wrong) > 0 ? a.correct / (a.correct + a.wrong) : 0;
        const accB = (b.correct + b.wrong) > 0 ? b.correct / (b.correct + b.wrong) : 0;
        if (accA !== accB) return accA - accB;
        // Then by highest unattempted
        return b.unattempted - a.unattempted;
      });

    return {
      strengths: eligibleStrengths.slice(0, 2),
      weaknesses: eligibleWeaknesses.slice(0, 2),
    };
  }, [subjectBreakdown]);

  // Filtered review questions — results come from server evaluation
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (reviewFilter === 'correct') return q.isCorrect;
      if (reviewFilter === 'wrong') return q.isAnswered && !q.isCorrect;
      if (reviewFilter === 'unattempted') return !q.isAnswered;
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

  const toggleMistakeBook = (qId: string) => {
    setMistakeBookSet((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: '5rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p>Loading deep subject diagnostics and solutions from database...</p>
      </div>
    );
  }

  if (error || !testResult) {
    return (
      <div style={{ maxWidth: '560px', margin: '4rem auto', padding: '2rem', textAlign: 'center', background: 'var(--color-bg-card, #1e293b)', borderRadius: '12px', border: '1px solid var(--color-border, #334155)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>Analysis Unavailable</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{error || 'No test result found. Please complete a test attempt first.'}</p>
        <Link href="/exams/hp-police-constable" style={{ color: 'var(--color-accent, #818cf8)', display: 'inline-block' }}>← Go to Exams</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={`/test/${testId}/result`} className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Back to Scorecard</span>
      </Link>

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Performance Analysis & Question Review</h1>
          <p className={styles.subtitle}>{testResult.testName}</p>
        </div>

        {/* Tab Controls */}
        <div className={styles.tabPills}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'subject' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('subject')}
          >
            Subject Diagnostics
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'review' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Question-by-Question Review ({questions.length})
          </button>
        </div>
      </header>

      {/* ================= TAB 1: SUBJECT & TOPIC DIAGNOSTICS ================= */}
      {activeTab === 'subject' && (
        <div className={styles.subjectTabContent}>
          {/* Strengths & Weaknesses Cards */}
          <div className={styles.insightsGrid}>
            <div className={`${styles.insightCard} ${styles.strengthCard}`}>
              <div className={styles.insightHeader}>
                <TrendingUp size={20} className={styles.strengthIcon} />
                <h3 className={styles.insightTitle}>Key Strengths</h3>
              </div>
              <p className={styles.insightDesc}>
                Sections where you demonstrated highest accuracy and consistency:
              </p>
              <div className={styles.insightList}>
                {strengths.length > 0 ? (
                  strengths.map((sub) => {
                    const totalAtt = sub.correct + sub.wrong;
                    const acc = totalAtt > 0 ? Math.round((sub.correct / totalAtt) * 100) : 0;
                    return (
                      <div key={sub.id} className={styles.insightItem}>
                        <span className={styles.insightSubjectName}>{sub.name}</span>
                        <span className={styles.strengthAcc}>{acc}% Accuracy</span>
                      </div>
                    );
                  })
                ) : (
                  <p className={styles.noInsightText}>No strong subjects yet</p>
                )}
              </div>
            </div>

            <div className={`${styles.insightCard} ${styles.weaknessCard}`}>
              <div className={styles.insightHeader}>
                <TrendingDown size={20} className={styles.weaknessIcon} />
                <h3 className={styles.insightTitle}>Priority Areas For Improvement</h3>
              </div>
              <p className={styles.insightDesc}>
                Focus revision here to minimize negative marking and boost your overall rank:
              </p>
              <div className={styles.insightList}>
                {weaknesses.length > 0 ? (
                  weaknesses.map((sub) => {
                    const totalAtt = sub.correct + sub.wrong;
                    const acc = totalAtt > 0 ? Math.round((sub.correct / totalAtt) * 100) : 0;
                    return (
                      <div key={sub.id} className={styles.insightItem}>
                        <span className={styles.insightSubjectName}>{sub.name}</span>
                        <span className={styles.weaknessStat}>
                          {sub.wrong > 0
                            ? `${sub.wrong} Wrong (-${formatMarks(sub.wrong * 0.25)})`
                            : totalAtt === 0
                            ? `${sub.unattempted} Skipped (0% Attempted)`
                            : `${acc}% Accuracy (${sub.unattempted} Skipped)`}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className={styles.noInsightText}>All subjects performing well</p>
                )}
              </div>
            </div>
          </div>

          {/* Subject-Wise Performance Breakdown Cards */}
          <div className={styles.subjectBreakdownSection}>
            <h2 className={styles.sectionTitle}>Sectional Score Breakdown</h2>
            <div className={styles.subjectCardsGrid}>
              {subjectBreakdown.map((sub) => {
                const totalAtt = sub.correct + sub.wrong;
                const accuracy =
                  totalAtt > 0 ? Math.round((sub.correct / totalAtt) * 100) : 0;

                return (
                  <div key={sub.id} className={styles.subjectCard}>
                    <div className={styles.subjectCardHeader}>
                      <div>
                        <h4 className={styles.subCardTitle}>{sub.name}</h4>
                        <span className={styles.subCardHi}>{sub.nameHi}</span>
                      </div>
                      <span className={styles.subScorePill}>
                        {formatMarks(sub.score)} / {sub.totalQuestions} Marks
                      </span>
                    </div>

                    <div className={styles.subStatsRow}>
                      <div className={styles.subStat}>
                        <span className={styles.subStatLabel}>Accuracy</span>
                        <span className={styles.subStatVal}>{accuracy}%</span>
                      </div>
                      <div className={styles.subStat}>
                        <span className={styles.subStatLabel}>Correct</span>
                        <span className={styles.subStatGreen}>{sub.correct}</span>
                      </div>
                      <div className={styles.subStat}>
                        <span className={styles.subStatLabel}>Wrong</span>
                        <span className={styles.subStatRed}>{sub.wrong}</span>
                      </div>
                      <div className={styles.subStat}>
                        <span className={styles.subStatLabel}>Skipped</span>
                        <span className={styles.subStatGray}>{sub.unattempted}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendation Banner */}
          <div className={styles.recommendationBox}>
            <Sparkles size={24} className={styles.recIcon} />
            <div>
              <h4 className={styles.recTitle}>AI Recommendation for HP Police Constable</h4>
              <p className={styles.recText}>
                Your English and Reasoning scores are on track for selection! To gain an extra{' '}
                <strong>+6 to +8 marks</strong>, practice the mistakes made in Hindi Grammar (Sandhi & Samas)
                and revise HP Geography using the Mistake Book.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: QUESTION-BY-QUESTION REVIEW ================= */}
      {activeTab === 'review' && (
        <div className={styles.reviewTabContent}>
          {/* Review Filter Bar */}
          <div className={styles.reviewControls}>
            <div className={styles.filterGroup}>
              <Filter size={15} className={styles.filterIcon} />
              <button
                type="button"
                className={`${styles.filterBtn} ${
                  reviewFilter === 'all' ? styles.filterBtnActive : ''
                }`}
                onClick={() => setReviewFilter('all')}
              >
                All ({questions.length})
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${
                  reviewFilter === 'correct' ? styles.filterBtnActive : ''
                }`}
                onClick={() => setReviewFilter('correct')}
              >
                Correct
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${
                  reviewFilter === 'wrong' ? styles.filterBtnActive : ''
                }`}
                onClick={() => setReviewFilter('wrong')}
              >
                Incorrect
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${
                  reviewFilter === 'unattempted' ? styles.filterBtnActive : ''
                }`}
                onClick={() => setReviewFilter('unattempted')}
              >
                Unattempted
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${
                  reviewFilter === 'bookmarked' ? styles.filterBtnActive : ''
                }`}
                onClick={() => setReviewFilter('bookmarked')}
              >
                Bookmarked ({bookmarkedSet.size})
              </button>
            </div>

            <button
              type="button"
              className={styles.langToggleBtn}
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            >
              <Languages size={15} />
              <span>{lang === 'en' ? 'हिन्दी में देखें' : 'View in English'}</span>
            </button>
          </div>

          {/* Question Review Cards */}
          <div className={styles.questionsList}>
            {filteredQuestions.map((q, idx) => {
              const isCorrect = q.isCorrect;
              const isAnswered = q.isAnswered;
              const isBookmarked = bookmarkedSet.has(q.questionId);
              const isInMistakes = mistakeBookSet.has(q.questionId);

              return (
                <div
                  key={q.questionId}
                  className={`${styles.reviewCard} ${
                    !isAnswered
                      ? styles.reviewCardUnattempted
                      : isCorrect
                      ? styles.reviewCardCorrect
                      : styles.reviewCardWrong
                  }`}
                >
                  <div className={styles.reviewCardHeader}>
                    <div className={styles.reviewCardMeta}>
                      <span className={styles.reviewQNum}>Question {q.questionNumber}</span>
                      <Badge variant="neutral" size="sm">
                        {q.subjectName}
                      </Badge>
                      <span className={styles.reviewTopic}>{q.topicName}</span>
                    </div>

                    <div className={styles.reviewCardActions}>
                      {isCorrect && (
                        <Badge variant="success" size="sm" icon={<CheckCircle2 size={13} />}>
                          Correct (+{q.marks})
                        </Badge>
                      )}
                      {isAnswered && !isCorrect && (
                        <Badge variant="error" size="sm" icon={<XCircle size={13} />}>
                          Wrong (-{q.negativeMarks})
                        </Badge>
                      )}
                      {!isAnswered && (
                        <Badge variant="neutral" size="sm">
                          Unattempted
                        </Badge>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleBookmark(q.questionId)}
                        className={`${styles.reviewActionBtn} ${
                          isBookmarked ? styles.activeBookmarkBtn : ''
                        }`}
                        title="Bookmark question"
                      >
                        <Bookmark size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleMistakeBook(q.questionId)}
                        className={`${styles.reviewActionBtn} ${
                          isInMistakes ? styles.activeMistakeBtn : ''
                        }`}
                        title="Add to Mistake Book"
                      >
                        <BookOpen size={15} />
                        <span>{isInMistakes ? 'In Mistake Book' : 'Add to Mistakes'}</span>
                      </button>
                    </div>
                  </div>

                  <p className={styles.reviewQuestionText}>
                    {lang === 'hi' ? q.questionTextHi : q.questionText}
                  </p>

                  {/* Options */}
                  <div className={styles.reviewOptionsList}>
                    {q.options.map((opt) => {
                      const isUserChoice = q.userAnswer === opt.label;
                      const isCorrectChoice = q.correctOption === opt.label;

                      let optClass = styles.reviewOption;
                      if (isCorrectChoice) optClass += ` ${styles.optionRight}`;
                      if (isUserChoice && !isCorrectChoice)
                        optClass += ` ${styles.optionWrongChoice}`;

                      return (
                        <div key={opt.id} className={optClass}>
                          <span className={styles.optionMarkerLabel}>{opt.label}</span>
                          <span className={styles.optionContentText}>
                            {lang === 'hi' ? opt.textHi : opt.text}
                          </span>
                          {isCorrectChoice && (
                            <span className={styles.correctBadgeTag}>
                              <Check size={13} /> Correct Answer
                            </span>
                          )}
                          {isUserChoice && !isCorrectChoice && (
                            <span className={styles.wrongBadgeTag}>Your Selection</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Step-by-Step Solution */}
                  <div className={styles.explanationBox}>
                    <div className={styles.explanationHeader}>
                      <BookOpen size={16} />
                      <span>Detailed Step-by-Step Solution</span>
                    </div>
                    <p className={styles.explanationText}>
                      {lang === 'hi' ? q.explanationHi : q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestAnalysisPage() {
  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>Loading analysis...</div>}>
      <TestAnalysisInner />
    </Suspense>
  );
}
