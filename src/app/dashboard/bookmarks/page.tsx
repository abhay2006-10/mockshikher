'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckIcon, XIcon } from '@/components/v2/Icons';
import { Chip, UnderlineTabs } from '@/components/v2';
import styles from './bookmarks.module.css';

interface QuestionOption {
  id: string;
  label: string;
  text: string;
  textHi: string;
}

interface BookmarkedQuestion {
  id: string;
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionTextHi: string;
  subjectName: string;
  topicName: string;
  options: QuestionOption[];
  correctOption: string;
  marks: number;
  negativeMarks: number;
  explanation: string;
  explanationHi: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    fetch('/api/user/bookmarks')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        setBookmarks(data.bookmarks || []);
      })
      .catch((err) => console.error('Failed to load bookmarks:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemoveBookmark = async (qId: string) => {
    setRemovedIds((prev) => new Set([...prev, qId]));
    try {
      await fetch(`/api/user/bookmarks/${encodeURIComponent(qId)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to delete bookmark:', e);
    }
  };

  const visibleBookmarks = useMemo(() => {
    return bookmarks.filter((q) => !removedIds.has(q.questionId));
  }, [bookmarks, removedIds]);

  const tabs = useMemo(() => {
    const subjects = Array.from(new Set(visibleBookmarks.map((q) => q.subjectName)));
    return [
      { id: 'all', label: 'All' },
      ...subjects.map((s) => ({ id: s, label: s })),
    ];
  }, [visibleBookmarks]);

  const filteredBookmarks = useMemo(() => {
    return visibleBookmarks.filter((q) => {
      if (selectedSubject === 'all') return true;
      return q.subjectName === selectedSubject;
    });
  }, [visibleBookmarks, selectedSubject]);

  const toggleExplanation = (id: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <main className={styles.container}>
      {/* 1. Header & Language Toggle */}
      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Saved Bookmarks</h1>
          <p className={styles.subtitle}>
            Questions you bookmarked during mock test attempts for revision.
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

      {/* 2. Summary Banner */}
      <section className={styles.banner} aria-label="Bookmarks Summary">
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

        <div className={styles.bannerLeft}>
          <span className={styles.bannerCount}>{visibleBookmarks.length}</span>
          <span className={styles.bannerLabel}>
            bookmarked question{visibleBookmarks.length !== 1 ? 's' : ''} saved
          </span>
        </div>

        <Link href="/exams" className={styles.browseLink}>
          <span>Practice more mocks</span>
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* 3. Subject UnderlineTabs */}
      {visibleBookmarks.length > 0 && (
        <UnderlineTabs
          tabs={tabs}
          activeTab={selectedSubject}
          onChange={(tabId) => setSelectedSubject(tabId)}
          ariaLabel="Bookmark subject filters"
        />
      )}

      {/* 4. Bookmarks List */}
      <div className={styles.cardsList}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <span>Loading your saved bookmarks...</span>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>No Bookmarks Saved Yet</h2>
            <p className={styles.emptyDesc}>
              During any mock test attempt, click the Bookmark button to save challenging questions here for quick revision before your exam.
            </p>
            <Link href="/exams" className={styles.browseLink}>
              <span>Explore Test Series</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          filteredBookmarks.map((q, idx) => {
            const isExpanded = !!expandedExplanations[q.questionId];
            const qText = lang === 'hi' && q.questionTextHi ? q.questionTextHi : q.questionText;
            const expText = lang === 'hi' && q.explanationHi ? q.explanationHi : q.explanation;

            return (
              <article
                key={q.questionId}
                className={styles.card}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <span className={styles.qNumber}>Q{q.questionNumber}</span>
                    <Chip category={q.subjectName} />
                    {q.topicName && <Chip category={q.topicName} />}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBookmark(q.questionId)}
                    className={styles.removeBtn}
                    aria-label={`Remove bookmark for question ${q.questionNumber}`}
                  >
                    <XIcon size={14} />
                    <span>Remove</span>
                  </button>
                </div>

                <h2 className={styles.questionText}>{qText}</h2>

                {/* Options List with Correct Answer Highlighted */}
                <div className={styles.optionsStack}>
                  {q.options.map((opt) => {
                    const isCorrect = opt.label === q.correctOption;
                    return (
                      <div
                        key={opt.id}
                        className={`${styles.optionRow} ${isCorrect ? styles.optionRowCorrect : ''}`}
                      >
                        <span
                          className={`${styles.optionBadge} ${isCorrect ? styles.optionBadgeCorrect : ''}`}
                        >
                          {opt.label}
                        </span>
                        <span style={{ flex: 1 }}>
                          {lang === 'hi' && opt.textHi ? opt.textHi : opt.text}
                        </span>
                        {isCorrect && (
                          <span className={styles.correctTag}>✓ Correct answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {isExpanded && expText && (
                  <div className={styles.explanationBox}>
                    <span className={styles.explanationStrong}>Explanation: </span>
                    {expText}
                  </div>
                )}

                {expText && (
                  <button
                    type="button"
                    onClick={() => toggleExplanation(q.questionId)}
                    className={styles.toggleExpBtn}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? 'Hide explanation' : 'Show explanation'}
                  </button>
                )}
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
