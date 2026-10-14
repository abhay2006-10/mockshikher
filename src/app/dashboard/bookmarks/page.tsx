'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Trash2,
  Languages,
  Check,
  Filter,
  Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<BookmarkedQuestion[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookmarksFromDb() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/user/bookmarks', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setBookmarkedQuestions(data.bookmarks || []);
        }
      } catch (err) {
        console.error('Failed to load bookmarks from database:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBookmarksFromDb();
  }, []);

  const removeBookmark = async (id: string) => {
    setRemovedIds((prev) => new Set([...prev, id]));
    try {
      await fetch(`/api/user/bookmarks/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to delete bookmark from DB:', e);
    }
  };

  const visibleQuestions = bookmarkedQuestions.filter((q) => !removedIds.has(q.questionId));

  const subjects = ['All', ...Array.from(new Set(visibleQuestions.map((q) => q.subjectName)))];

  const filteredQuestions = visibleQuestions.filter((q) => {
    return selectedSubject === 'All' || q.subjectName === selectedSubject;
  });

  if (isLoading) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading bookmarks...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem',
          fontWeight: 600,
          textDecoration: 'none',
          marginBottom: '1.5rem',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </Link>

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Saved Bookmarks
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Questions you bookmarked during your test attempts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Languages size={15} />}
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
        >
          {lang === 'en' ? 'हिन्दी' : 'English'}
        </Button>
      </header>

      {visibleQuestions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--color-bg-card, #1e293b)',
            borderRadius: '12px',
            border: '1px solid var(--color-border, #334155)',
          }}
        >
          <Bookmark size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-text-secondary)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Bookmarks Yet</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Bookmark questions during a test attempt by clicking the Bookmark button. They will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Subject Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <Filter size={16} style={{ color: 'var(--color-text-secondary)', alignSelf: 'center' }} />
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                style={{
                  padding: '0.3rem 0.9rem',
                  borderRadius: '999px',
                  border: `1px solid ${selectedSubject === s ? 'var(--color-accent, #818cf8)' : 'var(--color-border, #334155)'}`,
                  background: selectedSubject === s ? 'rgba(129,140,248,0.15)' : 'transparent',
                  color: selectedSubject === s ? 'var(--color-accent, #818cf8)' : 'var(--color-text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {filteredQuestions.length} bookmark{filteredQuestions.length !== 1 ? 's' : ''}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredQuestions.map((q) => (
              <div
                key={q.questionId}
                style={{
                  background: 'var(--color-bg-card, #1e293b)',
                  border: '1px solid var(--color-border, #334155)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--color-border, #334155)',
                    background: 'rgba(129,140,248,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <Bookmark size={15} style={{ color: 'var(--color-accent, #818cf8)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Q{q.questionNumber}</span>
                    <Badge variant="neutral" size="sm">{q.subjectName}</Badge>
                    <Badge variant="neutral" size="sm">{q.topicName}</Badge>
                  </div>
                  <button
                    onClick={() => removeBookmark(q.questionId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.4rem 0.75rem',
                      minHeight: '36px',
                      borderRadius: '6px',
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'transparent',
                      color: '#f87171',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>

                <div style={{ padding: '1rem' }}>
                  <p style={{ fontWeight: 600, marginBottom: '1rem', lineHeight: 1.6 }}>
                    {lang === 'hi' ? q.questionTextHi : q.questionText}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options.map((opt) => {
                      const isCorrect = opt.label === q.correctOption;
                      return (
                        <div
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.65rem 0.875rem',
                            minHeight: '44px',
                            borderRadius: '8px',
                            border: `1px solid ${isCorrect ? '#22c55e' : 'var(--color-border, #334155)'}`,
                            background: isCorrect ? 'rgba(34,197,94,0.08)' : 'transparent',
                          }}
                        >
                          <span
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              flexShrink: 0,
                              background: isCorrect ? '#22c55e' : 'var(--color-bg-subtle, #334155)',
                              color: isCorrect ? '#fff' : 'var(--color-text-secondary)',
                            }}
                          >
                            {opt.label}
                          </span>
                          <span style={{ flex: 1 }}>{lang === 'hi' ? opt.textHi : opt.text}</span>
                          {isCorrect && <Check size={16} style={{ color: '#22c55e', flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '0.875rem',
                        background: 'rgba(99,102,241,0.07)',
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--color-accent, #818cf8)',
                      }}
                    >
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--color-accent, #818cf8)' }}>
                        Explanation
                      </p>
                      <p style={{ fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                        {lang === 'hi' ? (q.explanationHi || q.explanation) : q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
