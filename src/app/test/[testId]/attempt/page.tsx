'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  Bookmark,
  Languages,
  AlertTriangle,
  Menu,
  X,
  Send,
  Flag,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import styles from './attempt.module.css';

type QuestionStatus =
  | 'NOT_VISITED'
  | 'NOT_ANSWERED'
  | 'ANSWERED'
  | 'MARKED'
  | 'ANSWERED_MARKED';

interface UserAnswerState {
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  status: QuestionStatus;
  timeSpent: number;
}

interface StudentQuestion {
  id: string;
  mockTestId: string;
  questionNumber: number;
  questionText: string;
  questionTextHi: string;
  questionImage?: string | null;
  marks: number;
  negativeMarks: number;
  difficulty: string;
  subjectId: string;
  subjectName: string;
  subjectNameHi: string;
  topicId: string;
  topicName: string;
  topicNameHi: string;
  options: { id: string; label: string; text: string; textHi: string }[];
}

interface TestMeta {
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

function TestAttemptInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const testId = params?.testId as string;
  const initialLang = (searchParams.get('lang') as 'en' | 'hi') || 'en';

  // API-loaded state
  const [test, setTest] = useState<TestMeta | null>(null);
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // UI state
  const [lang, setLang] = useState<'en' | 'hi'>(initialLang);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, UserAnswerState>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Accidental back/refresh prevention warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have a test attempt in progress. Leaving will submit or pause your timer. Are you sure?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Fetch questions and start/resume server-owned attempt
  useEffect(() => {
    const loadQuestionsAndAttempt = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        // 1. Fetch questions (never exposes correctOption or explanation)
        const res = await fetch(`/api/tests/${encodeURIComponent(testId)}/questions`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load test (HTTP ${res.status})`);
        }
        const data = await res.json();

        if (!data.questions || data.questions.length === 0) {
          setLoadError('This test has no questions yet. Please contact the admin.');
          setIsLoading(false);
          return;
        }

        setTest(data.test);
        setQuestions(data.questions);

        // 2. Start or resume server-owned attempt
        const startRes = await fetch(`/api/tests/${encodeURIComponent(testId)}/attempt/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (startRes.status === 401) {
          router.push(`/auth/login?callbackUrl=/test/${encodeURIComponent(testId)}/attempt`);
          return;
        }

        if (!startRes.ok) {
          const startErr = await startRes.json().catch(() => ({}));
          throw new Error(startErr.error || 'Failed to start test session on server.');
        }

        const startData = await startRes.json();
        const activeAttId = startData.attemptId;
        setAttemptId(activeAttId);

        // Server-owned timer
        setTimeLeft(startData.timeLeftSeconds);

        // Check local draft keyed by attemptId (temporary in-progress draft only)
        let localDraft: Record<string, UserAnswerState> = {};
        try {
          const draftStr = localStorage.getItem(`mockshikhar_draft_${activeAttId}`) || localStorage.getItem(`mockprep_draft_${activeAttId}`);
          if (draftStr) {
            localDraft = JSON.parse(draftStr);
          }
        } catch {
          // Ignore draft parse error
        }

        // Initialize answers from draft or server saved answers or defaults
        const initial: Record<string, UserAnswerState> = {};
        data.questions.forEach((q: StudentQuestion, idx: number) => {
          if (localDraft[q.id]) {
            initial[q.id] = localDraft[q.id];
          } else if (startData.savedAnswers && startData.savedAnswers[q.id]) {
            const saved = startData.savedAnswers[q.id];
            initial[q.id] = {
              selectedOption: saved.selectedOption || null,
              status: saved.status || (saved.selectedOption ? 'ANSWERED' : 'NOT_ANSWERED'),
              timeSpent: saved.timeSpent || 0,
            };
          } else {
            initial[q.id] = {
              selectedOption: null,
              status: idx === 0 ? 'NOT_ANSWERED' : 'NOT_VISITED',
              timeSpent: 0,
            };
          }
        });
        setAnswers(initial);
      } catch (err: any) {
        setLoadError(err.message || 'Failed to load test session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (testId) {
      loadQuestionsAndAttempt();
    }
  }, [testId, router]);

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? (answers[currentQ.id] || {
    selectedOption: null,
    status: 'NOT_VISITED' as QuestionStatus,
    timeSpent: 0,
  }) : null;

  // Timer countdown — only runs after questions are loaded
  useEffect(() => {
    if (!test || questions.length === 0 || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });

      if (currentQ) {
        setAnswers((prev) => {
          const curr = prev[currentQ.id];
          if (!curr) return prev;
          return {
            ...prev,
            [currentQ.id]: {
              ...curr,
              timeSpent: (curr.timeSpent || 0) + 1,
            },
          };
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, currentQ?.id, test, questions.length]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (timeLeft === 0 && test && questions.length > 0) {
      handleFinalSubmit(true);
    }
  }, [timeLeft]);

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const paletteCounts = useMemo(() => {
    let answered = 0, notAnswered = 0, marked = 0, answeredMarked = 0, notVisited = 0;
    Object.values(answers).forEach((ans) => {
      if (ans.status === 'ANSWERED') answered++;
      else if (ans.status === 'NOT_ANSWERED') notAnswered++;
      else if (ans.status === 'MARKED') marked++;
      else if (ans.status === 'ANSWERED_MARKED') answeredMarked++;
      else notVisited++;
    });
    return { answered, notAnswered, marked, answeredMarked, notVisited };
  }, [answers]);

  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev[currentQ.id];
      const isCurrentlyMarked =
        existing.status === 'MARKED' || existing.status === 'ANSWERED_MARKED';
      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          selectedOption: option,
          status: isCurrentlyMarked ? 'ANSWERED_MARKED' : 'ANSWERED',
        },
      };
    });
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        selectedOption: null,
        status: 'NOT_ANSWERED',
      },
    }));
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev[currentQ.id];
      const hasAnswer = existing.selectedOption !== null;
      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          status: hasAnswer ? 'ANSWERED_MARKED' : 'MARKED',
        },
      };
    });
    handleNext();
  };

  const handleSaveAndNext = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev[currentQ.id];
      if (existing.selectedOption !== null && existing.status !== 'ANSWERED_MARKED') {
        return { ...prev, [currentQ.id]: { ...existing, status: 'ANSWERED' } };
      } else if (existing.selectedOption === null && existing.status !== 'MARKED') {
        return { ...prev, [currentQ.id]: { ...existing, status: 'NOT_ANSWERED' } };
      }
      return prev;
    });
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      navigateToQuestion(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      navigateToQuestion(currentIndex - 1);
    }
  };

  const navigateToQuestion = (targetIdx: number) => {
    setCurrentIndex(targetIdx);
    const targetQ = questions[targetIdx];
    if (!targetQ) return;
    setAnswers((prev) => {
      const existing = prev[targetQ.id];
      if (existing?.status === 'NOT_VISITED') {
        return { ...prev, [targetQ.id]: { ...existing, status: 'NOT_ANSWERED' } };
      }
      return prev;
    });
    setIsMobilePaletteOpen(false);
  };

  const toggleBookmark = (qId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Auto-save in-progress draft keyed by attemptId (temporary draft only)
  useEffect(() => {
    if (!attemptId || Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(`mockshikhar_draft_${attemptId}`, JSON.stringify(answers));
    } catch {
      // ignore quota errors
    }
  }, [answers, attemptId]);

  // Submit: POST to server-side evaluation API
  const handleFinalSubmit = useCallback(async (isAutoSubmit = false) => {
    if (!test) return;
    setIsSubmitting(true);

    const timeTaken = test.durationMinutes * 60 - timeLeft;

    try {
      const res = await fetch(`/api/tests/${encodeURIComponent(test.id)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answers,
          timeTaken,
          isAutoSubmit,
          bookmarkedIds: Array.from(bookmarkedIds),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Submission failed');
      }

      const data = await res.json();

      // Clean up temporary draft — NO mockshikhar_result_* saved to localStorage!
      if (attemptId) {
        try {
          localStorage.removeItem(`mockshikhar_draft_${attemptId}`);
          localStorage.removeItem(`mockprep_draft_${attemptId}`);
        } catch {
          // ignore
        }
      }

      setTimeout(() => {
        const submittedAttId = data.attemptId || attemptId;
        router.push(`/test/${encodeURIComponent(test.id)}/result?attemptId=${encodeURIComponent(submittedAttId)}`);
      }, 400);
    } catch (err: any) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
      alert(`Submission failed: ${err.message}. Please try again.`);
    }
  }, [answers, attemptId, bookmarkedIds, test, timeLeft, router]);

  const isLowTime = timeLeft < 300;

  // Loading state
  if (isLoading) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <RefreshCw size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
        <p>Loading test questions from database...</p>
      </div>
    );
  }

  // Error state
  if (loadError || !test || questions.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center', background: 'var(--color-bg-card, #1e293b)', borderRadius: '12px', border: '1px solid var(--color-border, #334155)' }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem', display: 'block' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
          {loadError ? 'Failed to Load Questions' : 'No Questions Available'}
        </h2>
        <p style={{ color: 'var(--color-text-secondary, #94a3b8)', marginBottom: '1.5rem' }}>
          {loadError || 'No questions have been added to this test yet. Please contact your administrator.'}
        </p>
        <Button variant="primary" size="md" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!currentQ || !currentAnswer) return null;

  return (
    <div className={styles.container}>
      {/* ================= TEST TOP BAR ================= */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.testInfo}>
            <h2 className={styles.testHeading}>{test.name}</h2>
            <div className={styles.subjectChip}>
              {lang === 'hi' ? currentQ.subjectNameHi : currentQ.subjectName}
            </div>
          </div>
        </div>

        <div className={styles.topBarRight}>
          <span className={styles.mobileQBadge}>
            Q {currentIndex + 1}/{questions.length}
          </span>

          <button
            type="button"
            className={styles.langToggle}
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            title="Toggle Question Language (English / हिन्दी)"
          >
            <Languages size={15} />
            <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          <div className={`${styles.timerBox} ${isLowTime ? styles.timerLowTime : ''}`}>
            <Clock size={16} className={styles.timerIcon} />
            <span className={styles.timeVal}>{formatTime(timeLeft)}</span>
            {isLowTime && <span className={styles.timeWarning}>!</span>}
          </div>

          <button
            type="button"
            className={styles.mobilePaletteBtn}
            onClick={() => setIsMobilePaletteOpen(true)}
            aria-label="Open Question Palette"
          >
            <Menu size={16} />
            <span>Palette</span>
          </button>

          <Button
            variant="danger"
            size="md"
            className={styles.desktopSubmitBtn}
            leftIcon={<Send size={15} />}
            onClick={() => setIsSubmitModalOpen(true)}
          >
            Submit Test
          </Button>
        </div>
      </header>

      {/* ================= MAIN ENGINE WORKSPACE ================= */}
      <div className={styles.workspace}>
        {/* Left / Center: Question Panel */}
        <main className={styles.questionPanel}>
          <div className={styles.questionHeader}>
            <div className={styles.questionMetaLeft}>
              <span className={styles.qNumberBadge}>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className={styles.topicName}>{currentQ.topicName}</span>
            </div>

            <div className={styles.questionMetaRight}>
              <span className={styles.marksBadge}>+{currentQ.marks} Marks</span>
              <span className={styles.negMarksBadge}>-{currentQ.negativeMarks} Neg.</span>

              <button
                type="button"
                className={`${styles.bookmarkBtn} ${
                  bookmarkedIds.has(currentQ.id) ? styles.bookmarkActive : ''
                }`}
                onClick={() => toggleBookmark(currentQ.id)}
                title="Bookmark this question for revision"
              >
                <Bookmark size={16} />
                <span>{bookmarkedIds.has(currentQ.id) ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
            </div>
          </div>

          {/* Question Text */}
          <div className={styles.questionContent}>
            <p className={styles.questionText}>
              {lang === 'hi' ? currentQ.questionTextHi : currentQ.questionText}
            </p>

            {currentQ.questionImage && (
              <img
                src={currentQ.questionImage}
                alt="Question image"
                style={{ maxWidth: '100%', borderRadius: '8px', margin: '1rem 0' }}
              />
            )}

            {/* Options List */}
            <div className={styles.optionsList} role="radiogroup">
              {currentQ.options.map((opt) => {
                const isSelected = currentAnswer.selectedOption === opt.label;
                return (
                  <label
                    key={opt.id}
                    className={`${styles.optionCard} ${
                      isSelected ? styles.optionSelected : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ.id}`}
                      value={opt.label}
                      checked={isSelected}
                      onChange={() => handleSelectOption(opt.label as 'A' | 'B' | 'C' | 'D')}
                      className={styles.radioInput}
                    />
                    <div className={styles.optionMarker}>{opt.label}</div>
                    <div className={styles.optionText}>
                      {lang === 'hi' ? opt.textHi : opt.text}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bottom Navigation Toolbar (Sticky bar with Previous, Mark for Review, Save & Next, Submit) */}
          <footer className={styles.navToolbar}>
            <div className={styles.navLeft}>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<ChevronLeft size={16} />}
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="md"
                leftIcon={<RotateCcw size={16} />}
                onClick={handleClearResponse}
                disabled={currentAnswer.selectedOption === null}
                className={styles.clearBtn}
              >
                Clear
              </Button>
            </div>

            <div className={styles.navRight}>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Flag size={16} />}
                onClick={handleMarkForReviewAndNext}
              >
                Mark for Review
              </Button>

              <Button
                variant="primary"
                size="md"
                rightIcon={<ChevronRight size={16} />}
                onClick={handleSaveAndNext}
              >
                Save & Next
              </Button>

              <Button
                variant="danger"
                size="md"
                leftIcon={<Send size={15} />}
                onClick={() => setIsSubmitModalOpen(true)}
                className={styles.mobileToolbarSubmitBtn}
              >
                Submit
              </Button>
            </div>
          </footer>
        </main>

        {/* Backdrop for Mobile Bottom Sheet Palette */}
        {isMobilePaletteOpen && (
          <div
            className={styles.paletteBackdrop}
            onClick={() => setIsMobilePaletteOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Right / Bottom Sheet: Question Palette */}
        <aside
          className={`${styles.paletteSidebar} ${
            isMobilePaletteOpen ? styles.mobilePaletteVisible : ''
          }`}
        >
          <div className={styles.bottomSheetHandle} />
          <div className={styles.paletteHeader}>
            <h3 className={styles.paletteTitle}>Question Palette</h3>
            {isMobilePaletteOpen && (
              <button
                type="button"
                className={styles.closeDrawerBtn}
                onClick={() => setIsMobilePaletteOpen(false)}
                aria-label="Close Question Palette"
              >
                <X size={20} />
              </button>
            )}
          </div>


          {/* Real-time Status Counters */}
          <div className={styles.statusLegendGrid}>
            <div className={styles.legendPill}>
              <span className={`${styles.statusDot} ${styles.dotAnswered}`} />
              <span className={styles.legendText}>
                <strong>{paletteCounts.answered}</strong> Answered
              </span>
            </div>

            <div className={styles.legendPill}>
              <span className={`${styles.statusDot} ${styles.dotNotAnswered}`} />
              <span className={styles.legendText}>
                <strong>{paletteCounts.notAnswered}</strong> Not Answered
              </span>
            </div>

            <div className={styles.legendPill}>
              <span className={`${styles.statusDot} ${styles.dotMarked}`} />
              <span className={styles.legendText}>
                <strong>{paletteCounts.marked}</strong> Marked
              </span>
            </div>

            <div className={styles.legendPill}>
              <span className={`${styles.statusDot} ${styles.dotAnsweredMarked}`} />
              <span className={styles.legendText}>
                <strong>{paletteCounts.answeredMarked}</strong> Ans & Marked
              </span>
            </div>

            <div className={styles.legendPill}>
              <span className={`${styles.statusDot} ${styles.dotNotVisited}`} />
              <span className={styles.legendText}>
                <strong>{paletteCounts.notVisited}</strong> Not Visited
              </span>
            </div>
          </div>

          {/* Palette Questions Grid */}
          <div className={styles.paletteGrid}>
            {questions.map((q, idx) => {
              const status = answers[q.id]?.status || 'NOT_VISITED';
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => navigateToQuestion(idx)}
                  className={`${styles.paletteButton} ${styles[`status_${status}`]} ${
                    isCurrent ? styles.paletteCurrent : ''
                  }`}
                  title={`Question ${idx + 1} (${status.replace('_', ' ')})`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className={styles.paletteFooter}>
            <Button
              variant="danger"
              size="md"
              fullWidth
              leftIcon={<Send size={16} />}
              onClick={() => setIsSubmitModalOpen(true)}
            >
              Submit Entire Test
            </Button>
          </div>
        </aside>
      </div>

      {/* ================= SUBMIT CONFIRMATION MODAL ================= */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Test Confirmation"
      >
        <div className={styles.modalContent}>
          <div className={styles.modalWarningBox}>
            <AlertTriangle size={24} className={styles.modalWarnIcon} />
            <p className={styles.modalWarnText}>
              Are you sure you want to end and submit your test? You will not be able to change any
              responses after submission.
            </p>
          </div>

          <div className={styles.submitSummaryTable}>
            <div className={styles.summaryRow}>
              <span>Total Questions:</span>
              <strong>{questions.length}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Answered Questions:</span>
              <strong style={{ color: '#15803d' }}>
                {paletteCounts.answered + paletteCounts.answeredMarked}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Unanswered Questions:</span>
              <strong style={{ color: '#b91c1c' }}>
                {paletteCounts.notAnswered + paletteCounts.notVisited}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Marked for Review:</span>
              <strong style={{ color: '#7c3aed' }}>
                {paletteCounts.marked + paletteCounts.answeredMarked}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Time Remaining:</span>
              <strong>{formatTime(timeLeft)}</strong>
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={isSubmitting}
            >
              Back to Test
            </Button>
            <Button
              variant="accent"
              size="lg"
              isLoading={isSubmitting}
              onClick={() => handleFinalSubmit(false)}
            >
              Yes, Submit & View Score
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function TestAttemptPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}>Loading mock test...</div>}>
      <TestAttemptInner />
    </Suspense>
  );
}
