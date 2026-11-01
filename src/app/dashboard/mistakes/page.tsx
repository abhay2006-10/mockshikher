'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckIcon,
  XIcon,
} from '@/components/v2/Icons';
import { Chip, UnderlineTabs } from '@/components/v2';
import styles from './mistakes.module.css';

interface QuestionOption {
  id: string;
  optionLabel: string;
  optionText: string;
  optionTextHi?: string | null;
}

interface MistakeItem {
  id: string;
  questionId: string;
  questionText: string;
  questionTextHi?: string | null;
  subjectName: string;
  topicName?: string | null;
  sourceText: string;
  userAnswer: string | null;
  correctOption: string;
  explanation?: string | null;
  explanationHi?: string | null;
  isMastered: boolean;
  options: QuestionOption[];
}

export default function MistakeBookPage() {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [reattemptingId, setReattemptingId] = useState<string | null>(null);
  const [selectedReattemptOption, setSelectedReattemptOption] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/user/mistakes')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const rawList = data.mistakes || [];
        const formatted: MistakeItem[] = rawList.map((m: any) => {
          const q = m.question || {};
          const attemptName = m.attempt?.mockTest?.name || 'Mock Test';
          return {
            id: m.id,
            questionId: q.id,
            questionText: q.text || q.questionText || '',
            questionTextHi: q.textHi || q.questionTextHi || null,
            subjectName: q.subject?.name || 'General',
            topicName: q.topic?.name || null,
            sourceText: attemptName,
            userAnswer: m.userAnswer || m.selectedOption || null,
            correctOption: q.correctOption || '',
            explanation: q.explanation || null,
            explanationHi: q.explanationHi || null,
            isMastered: !!m.isMastered,
            options: (q.options || []).map((opt: any) => ({
              id: opt.id,
              optionLabel: opt.optionLabel || opt.label || '',
              optionText: opt.optionText || opt.text || '',
              optionTextHi: opt.optionTextHi || opt.textHi || null,
            })),
          };
        });
        setMistakes(formatted);
      })
      .catch((err) => console.error('Failed to load mistakes:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute stats
  const toReviseCount = useMemo(
    () => mistakes.filter((m) => !m.isMastered).length,
    [mistakes]
  );
  const masteredCount = useMemo(
    () => mistakes.filter((m) => m.isMastered).length,
    [mistakes]
  );

  // Compute tabs
  const tabs = useMemo(() => {
    const subjects = Array.from(new Set(mistakes.map((m) => m.subjectName)));
    const tabList = [
      { id: 'all', label: 'All' },
      ...subjects.map((s) => ({ id: s, label: s })),
      { id: 'mastered', label: 'Mastered' },
    ];
    return tabList;
  }, [mistakes]);

  // Filter items
  const filteredMistakes = useMemo(() => {
    return mistakes.filter((m) => {
      if (selectedTab === 'all') return !m.isMastered;
      if (selectedTab === 'mastered') return m.isMastered;
      return m.subjectName === selectedTab && !m.isMastered;
    });
  }, [mistakes, selectedTab]);

  const toggleExplanation = (id: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleMastered = async (item: MistakeItem) => {
    const nextState = !item.isMastered;
    // Optimistic UI update
    setMistakes((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, isMastered: nextState } : m))
    );

    try {
      await fetch(`/api/user/mistakes/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMastered: nextState }),
      });
    } catch (err) {
      console.error('Failed to update mastered state:', err);
    }
  };

  const handleReattemptClick = (id: string) => {
    if (reattemptingId === id) {
      setReattemptingId(null);
      setSelectedReattemptOption(null);
    } else {
      setReattemptingId(id);
      setSelectedReattemptOption(null);
    }
  };

  return (
    <main className={styles.container}>
      {/* 1. TITLE & BILINGUAL TOGGLE */}
      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Mistake Book</h1>
          <p className={styles.subtitle}>
            Every question you got wrong, saved with the correct answer and explanation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className={styles.langToggleBtn}
          aria-label="Toggle language between English and Hindi"
        >
          <span>Mode: {lang === 'en' ? 'English' : 'हिन्दी'}</span>
        </button>
      </div>

      {/* 2. PRACTICE BANNER */}
      <section className={styles.practiceBanner} aria-label="Mistake Practice Summary">
        {/* Mountain Silhouette SVG */}
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
        </svg>

        <div className={styles.bannerStats}>
          <div className={styles.bannerStatItem}>
            <span className={styles.statValWhite}>{toReviseCount}</span>
            <span className={styles.statLabel}>to revise</span>
          </div>
          <div className={styles.bannerStatItem}>
            <span className={styles.statValGreen}>{masteredCount}</span>
            <span className={styles.statLabel}>mastered</span>
          </div>
        </div>

        {toReviseCount > 0 && (
          <button
            type="button"
            onClick={() => {
              const firstUnmastered = mistakes.find((m) => !m.isMastered);
              if (firstUnmastered) handleReattemptClick(firstUnmastered.id);
            }}
            className={styles.practiceBtn}
          >
            <span>Practise {Math.min(10, toReviseCount)} mistakes</span>
            <ArrowRight size={16} />
          </button>
        )}
      </section>

      {/* 3. UNDERLINE TABS (SUBJECTS / MASTERED) */}
      <UnderlineTabs
        tabs={tabs}
        activeTab={selectedTab}
        onChange={(tabId) => setSelectedTab(tabId)}
        ariaLabel="Mistake Book filters"
      />

      {/* 4. MISTAKE CARDS */}
      <div className={styles.mistakesList}>
        {loading ? (
          <div className={styles.emptyState}>
            <span>Loading your mistakes...</span>
          </div>
        ) : filteredMistakes.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>
              {selectedTab === 'mastered' ? 'No mastered questions yet' : 'Zero mistakes recorded!'}
            </h2>
            <p className={styles.emptyDesc}>
              {selectedTab === 'mastered'
                ? 'Questions you mark as mastered will appear here for reference.'
                : 'When you answer questions incorrectly in your mock tests, they will automatically be catalogued here for targeted revision.'}
            </p>
            <Link href="/exams" className={styles.practiceBtn}>
              <span>Explore Test Series</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          filteredMistakes.map((item, idx) => {
            const isExpanded = !!expandedExplanations[item.id];
            const isReattempting = reattemptingId === item.id;
            const qText =
              lang === 'hi' && item.questionTextHi ? item.questionTextHi : item.questionText;
            const expText =
              lang === 'hi' && item.explanationHi ? item.explanationHi : item.explanation;

            // Find label / text of student's wrong answer and correct answer
            const wrongOpt = item.options.find(
              (o) => o.optionLabel === item.userAnswer || o.id === item.userAnswer
            );
            const correctOpt = item.options.find(
              (o) => o.optionLabel === item.correctOption || o.id === item.correctOption
            );

            const wrongText = wrongOpt
              ? `${wrongOpt.optionLabel}. ${lang === 'hi' && wrongOpt.optionTextHi ? wrongOpt.optionTextHi : wrongOpt.optionText}`
              : item.userAnswer
              ? `Option ${item.userAnswer}`
              : 'Not answered';

            const correctText = correctOpt
              ? `${correctOpt.optionLabel}. ${lang === 'hi' && correctOpt.optionTextHi ? correctOpt.optionTextHi : correctOpt.optionText}`
              : `Option ${item.correctOption}`;

            return (
              <article
                key={item.id}
                className={`${styles.card} ${item.isMastered ? styles.cardMastered : ''}`}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                {/* Card Top */}
                <div className={styles.cardTop}>
                  <div className={styles.metaGroup}>
                    <Chip category={item.subjectName} />
                    <span className={styles.sourceLabel}>{item.sourceText}</span>
                  </div>
                  {item.isMastered && (
                    <span className={styles.masteredBadge}>Mastered ✓</span>
                  )}
                </div>

                {/* Question Text */}
                <h2 className={styles.questionText}>{qText}</h2>

                {/* Red / Green Comparison Boxes */}
                <div className={styles.answersGrid}>
                  {/* Your Answer (Red) */}
                  <div className={styles.answerBoxWrong}>
                    <span className={styles.answerIconWrong} aria-hidden="true">
                      <XIcon size={18} />
                    </span>
                    <div className={styles.answerTextGroup}>
                      <span className={styles.answerLabelWrong}>Your answer</span>
                      <span className={styles.answerVal}>{wrongText}</span>
                    </div>
                  </div>

                  {/* Correct Answer (Green) */}
                  <div className={styles.answerBoxCorrect}>
                    <span className={styles.answerIconCorrect} aria-hidden="true">
                      <CheckIcon size={18} />
                    </span>
                    <div className={styles.answerTextGroup}>
                      <span className={styles.answerLabelCorrect}>Correct answer</span>
                      <span className={styles.answerVal}>{correctText}</span>
                    </div>
                  </div>
                </div>

                {/* Expandable Explanation */}
                {isExpanded && expText && (
                  <div className={styles.explanationBox}>
                    <span className={styles.explanationStrong}>Explanation: </span>
                    {expText}
                  </div>
                )}

                {/* Interactive In-Card Re-attempting Tray */}
                {isReattempting && item.options.length > 0 && (
                  <div className={styles.reattemptTray}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate)' }}>
                      Select the correct option to re-attempt:
                    </span>
                    {item.options.map((opt) => {
                      const isChosen = selectedReattemptOption === opt.optionLabel;
                      const isCorrect = opt.optionLabel === item.correctOption;
                      let btnCls = styles.reattemptOptionBtn;
                      if (selectedReattemptOption) {
                        if (isCorrect) btnCls = `${styles.reattemptOptionBtn} ${styles.reattemptCorrect}`;
                        else if (isChosen) btnCls = `${styles.reattemptOptionBtn} ${styles.reattemptWrong}`;
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={btnCls}
                          onClick={() => setSelectedReattemptOption(opt.optionLabel)}
                        >
                          <strong>{opt.optionLabel}.</strong>
                          <span>
                            {lang === 'hi' && opt.optionTextHi ? opt.optionTextHi : opt.optionText}
                          </span>
                          {selectedReattemptOption && isCorrect && (
                            <span style={{ marginLeft: 'auto', fontWeight: 800 }}>✓ Correct</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className={styles.cardActions}>
                  {expText && (
                    <button
                      type="button"
                      onClick={() => toggleExplanation(item.id)}
                      className={styles.toggleExpBtn}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? 'Hide explanation' : 'Show explanation'}
                    </button>
                  )}

                  <div className={styles.actionRightButtons}>
                    {item.options.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleReattemptClick(item.id)}
                        className={styles.reattemptBtn}
                      >
                        {isReattempting ? 'Close practice' : 'Re-attempt'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleMastered(item)}
                      className={item.isMastered ? styles.masterBtnDone : styles.masterBtnPending}
                    >
                      {item.isMastered ? 'Mastered ✓' : 'Mark as mastered'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
