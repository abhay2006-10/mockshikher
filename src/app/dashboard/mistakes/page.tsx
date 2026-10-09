'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Filter,
  Play,
  Languages,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface QuestionOption {
  id: string;
  label: string;
  text: string;
  textHi: string;
}

interface MistakeQuestion {
  id: string;
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionTextHi: string;
  subjectName: string;
  topicName: string;
  options: QuestionOption[];
  correctOption: string;
  userAnswer: string | null;
  marks: number;
  negativeMarks: number;
  explanation: string;
  explanationHi: string;
}

export default function MistakeBookPage() {
  const [mistakeQuestions, setMistakeQuestions] = useState<MistakeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});

  useEffect(() => {
    async function loadMistakesFromDb() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/user/mistakes', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setMistakeQuestions(data.mistakes || []);
          const initialMastered = new Set<string>();
          data.mistakes?.forEach((m: any) => {
            if (m.isMastered) initialMastered.add(m.questionId);
          });
          setMasteredIds(initialMastered);
        }
      } catch (err) {
        console.error('Failed to load mistakes from database:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadMistakesFromDb();
  }, []);

  const subjects = ['All', ...Array.from(new Set(mistakeQuestions.map((q) => q.subjectName)))];

  const filteredQuestions = mistakeQuestions.filter((q) => {
    if (masteredIds.has(q.questionId)) return false;
    return selectedSubject === 'All' || q.subjectName === selectedSubject;
  });

  const toggleMastered = async (qId: string) => {
    const isNowMastered = !masteredIds.has(qId);
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });

    const m = mistakeQuestions.find((item) => item.questionId === qId);
    if (m?.id) {
      try {
        await fetch(`/api/user/mistakes/${encodeURIComponent(m.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isMastered: isNowMastered }),
        });
      } catch (e) {
        console.warn('Failed to sync mastered state with DB', e);
      }
    }
  };

  const handlePracticeOption = (qId: string, opt: 'A' | 'B' | 'C' | 'D') => {
    setPracticeAnswers((prev) => ({
      ...prev,
      [qId]: opt,
    }));
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading mistake book...</p>
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
              background: 'linear-gradient(135deg, #f43f5e, #f97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Mistake Book
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Questions you answered incorrectly — sourced from your actual test results.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Languages size={15} />}
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          >
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </Button>
          <Button
            variant={practiceMode ? 'accent' : 'primary'}
            size="sm"
            leftIcon={practiceMode ? <RotateCcw size={15} /> : <Play size={15} />}
            onClick={() => setPracticeMode(!practiceMode)}
          >
            {practiceMode ? 'Exit Practice' : 'Practice Mode'}
          </Button>
        </div>
      </header>

      {mistakeQuestions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--color-bg-card, #1e293b)',
            borderRadius: '12px',
            border: '1px solid var(--color-border, #334155)',
          }}
        >
          <Sparkles size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-text-secondary)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Mistakes Found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Complete a mock test first, and any questions you get wrong will appear here automatically.
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
            Showing {filteredQuestions.length} of {mistakeQuestions.length} mistake(s)
            {masteredIds.size > 0 && ` (${masteredIds.size} mastered, hidden)`}
          </p>

          {filteredQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              <p>All questions in this subject have been mastered!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredQuestions.map((q, idx) => {
                const practiceAns = practiceAnswers[q.questionId];
                const isPracticeAnswered = practiceMode && !!practiceAns;
                const isPracticeCorrect = isPracticeAnswered && practiceAns === q.correctOption;

                return (
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
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--color-border, #334155)',
                        background: 'rgba(239,68,68,0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Q{q.questionNumber}</span>
                        <Badge variant="neutral" size="sm">{q.subjectName}</Badge>
                        <Badge variant="neutral" size="sm">{q.topicName}</Badge>
                        <Badge variant="error" size="sm">Your answer: {q.userAnswer || '—'}</Badge>
                      </div>
                      <button
                        onClick={() => toggleMastered(q.questionId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.3rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          background: 'transparent',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Mark Mastered
                      </button>
                    </div>

                    <div style={{ padding: '1rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '1rem', lineHeight: 1.6 }}>
                        {lang === 'hi' ? q.questionTextHi : q.questionText}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map((opt) => {
                          const isCorrect = opt.label === q.correctOption;
                          const isYourWrong = opt.label === q.userAnswer && !isCorrect;
                          const isPracticeChoice = practiceMode && practiceAns === opt.label;
                          const isPracticeCorrectChoice = isPracticeAnswered && isCorrect;
                          const isPracticeWrongChoice = isPracticeAnswered && isPracticeChoice && !isCorrect;

                          const showCorrect = !practiceMode ? isCorrect : isPracticeAnswered && isPracticeCorrectChoice;
                          const showWrong = !practiceMode ? isYourWrong : isPracticeWrongChoice;

                          return (
                            <div
                              key={opt.id}
                              onClick={() => practiceMode && !isPracticeAnswered ? handlePracticeOption(q.questionId, opt.label as 'A' | 'B' | 'C' | 'D') : undefined}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.6rem 0.875rem',
                                borderRadius: '8px',
                                border: `1px solid ${showCorrect ? '#22c55e' : showWrong ? '#ef4444' : 'var(--color-border, #334155)'}`,
                                background: showCorrect ? 'rgba(34,197,94,0.08)' : showWrong ? 'rgba(239,68,68,0.08)' : 'transparent',
                                cursor: practiceMode && !isPracticeAnswered ? 'pointer' : 'default',
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
                                  background: showCorrect ? '#22c55e' : showWrong ? '#ef4444' : 'var(--color-bg-subtle, #334155)',
                                  color: showCorrect || showWrong ? '#fff' : 'var(--color-text-secondary)',
                                }}
                              >
                                {opt.label}
                              </span>
                              <span style={{ flex: 1 }}>{lang === 'hi' ? opt.textHi : opt.text}</span>
                              {showCorrect && <Check size={16} style={{ color: '#22c55e', flexShrink: 0 }} />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation — always shown in review, shown after practice answer */}
                      {(!practiceMode || isPracticeAnswered) && q.explanation && (
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
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
