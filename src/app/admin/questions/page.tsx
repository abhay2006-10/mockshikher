'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Languages,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Trash2,
  Edit,
  ArrowRightLeft,
  Eye,
  Sparkles,
  Layers,
  History,
  ShieldCheck,
  Image as ImageIcon,
  Check,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { MockQuestion } from '@/lib/mock-data';
import styles from '../admin.module.css';

export default function AdminQuestionsPage() {
  const [activeTab, setActiveTab] = useState<'bank' | 'author' | 'bulk' | 'readiness' | 'subjects' | 'audit'>('bank');
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedMockTest, setSelectedMockTest] = useState('hp-police-mock-1');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [langView, setLangView] = useState<'en' | 'hi'>('en');

  // Single Question Form State
  const [qExam, setQExam] = useState('hp-police-constable');
  const [qMockTest, setQMockTest] = useState('hp-police-mock-1');
  const [qTextEn, setQTextEn] = useState('');
  const [qTextHi, setQTextHi] = useState('');
  const [optAEn, setOptAEn] = useState('');
  const [optAHi, setOptAHi] = useState('');
  const [optBEn, setOptBEn] = useState('');
  const [optBHi, setOptBHi] = useState('');
  const [optCEn, setOptCEn] = useState('');
  const [optCHi, setOptCHi] = useState('');
  const [optDEn, setOptDEn] = useState('');
  const [optDHi, setOptDHi] = useState('');
  const [correctOpt, setCorrectOpt] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qSubject, setQSubject] = useState('General Awareness');
  const [qTopic, setQTopic] = useState('Geography of HP');
  const [qDifficulty, setQDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [qMarks, setQMarks] = useState('1.0');
  const [qNegativeMarks, setQNegativeMarks] = useState('0.25');
  const [qExplEn, setQExplEn] = useState('');
  const [qExplHi, setQExplHi] = useState('');
  const [qImage, setQImage] = useState<string | null>(null);
  const [qSolImage, setQSolImage] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState('');

  // Bulk Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [validationPreview, setValidationPreview] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [errorReportCsv, setErrorReportCsv] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Move Modal State
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [questionToMove, setQuestionToMove] = useState<MockQuestion | null>(null);
  const [targetMock, setTargetMock] = useState('hp-police-mock-2');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MockQuestion | null>(null);

  // Mock Tests Readiness
  const [mockTests, setMockTests] = useState([
    { id: 'hp-police-mock-1', name: 'HP Police Mock 1 (Free)', total: 90, current: 90, isPublished: true, isFree: true },
    { id: 'hp-police-mock-2', name: 'HP Police Mock 2', total: 90, current: 45, isPublished: false, isFree: false },
    { id: 'hp-police-mock-3', name: 'HP Police Mock 3', total: 90, current: 20, isPublished: false, isFree: false },
    { id: 'hp-police-mock-4', name: 'HP Police Mock 4', total: 90, current: 0, isPublished: false, isFree: false },
    { id: 'hp-police-mock-5', name: 'HP Police Mock 5', total: 90, current: 0, isPublished: false, isFree: false },
  ]);

  // Load questions on mount
  useEffect(() => {
    fetchQuestions();
  }, [selectedMockTest, selectedSubject, selectedDifficulty, searchQuery]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/questions?mockTestId=${selectedMockTest}&search=${searchQuery}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to load questions from database');
        setQuestions([]);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to connect to database');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle single question creation
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTextEn && !qTextHi) return;

    const payload = {
      mockTestId: qMockTest,
      questionText: qTextEn || qTextHi,
      questionTextHi: qTextHi || qTextEn,
      options: [
        { label: 'A', text: optAEn, textHi: optAHi || optAEn },
        { label: 'B', text: optBEn, textHi: optBHi || optBEn },
        { label: 'C', text: optCEn, textHi: optCHi || optCEn },
        { label: 'D', text: optDEn, textHi: optDHi || optDEn },
      ],
      correctOption: correctOpt,
      subjectName: qSubject,
      topicName: qTopic,
      difficulty: qDifficulty,
      marks: parseFloat(qMarks),
      negativeMarks: parseFloat(qNegativeMarks),
      explanation: qExplEn,
      explanationHi: qExplHi || qExplEn,
      questionImage: qImage,
      solutionImage: qSolImage,
    };

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setQuestions([result.question || payload as any, ...questions]);
        setFormSuccess('Question created and added to bank successfully!');
        // Reset inputs
        setQTextEn('');
        setQTextHi('');
        setOptAEn('');
        setOptAHi('');
        setOptBEn('');
        setOptBHi('');
        setOptCEn('');
        setOptCHi('');
        setOptDEn('');
        setOptDHi('');
        setQExplEn('');
        setQExplHi('');
        setTimeout(() => setFormSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Bulk File Upload & Validation Preview
  const handleFileSelect = async (file: File) => {
    setImportFile(file);
    setIsValidating(true);
    setValidationPreview([]);
    setImportSummary(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', 'preview');

    try {
      const res = await fetch('/api/admin/questions/import', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setValidationPreview(data.preview || []);
        setImportSummary(data.summary);
        setErrorReportCsv(data.errorReportCsv);
      }
    } catch (e) {
      console.error('Validation error:', e);
    } finally {
      setIsValidating(false);
    }
  };

  // Execute Bulk Import
  const handleExecuteImport = async () => {
    if (!importFile) return;
    setIsImporting(true);

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('mode', 'execute');

    try {
      const res = await fetch('/api/admin/questions/import', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Import completed!');
        setImportFile(null);
        setValidationPreview([]);
        setImportSummary(null);
        fetchQuestions();
        setActiveTab('bank');
      }
    } catch (e) {
      console.error('Import execution error:', e);
    } finally {
      setIsImporting(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    setQuestions(questions.filter((q) => q.id !== id));
    try {
      await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }
  };

  // Move Question
  const handleMoveQuestion = async () => {
    if (!questionToMove) return;
    try {
      await fetch(`/api/admin/questions/${questionToMove.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMockTestId: targetMock }),
      });
      alert(`Question moved to ${targetMock}!`);
      setMoveModalOpen(false);
      fetchQuestions();
    } catch (e) {
      console.warn(e);
    }
  };

  // Toggle Test Publishing
  const handleTogglePublish = async (mockTestId: string, currentStatus: boolean, count: number, total: number) => {
    if (!currentStatus && count < total) {
      alert(`Cannot publish mock test: it only has ${count}/${total} questions. You need ${total - count} more questions before publishing.`);
      return;
    }

    try {
      const res = await fetch('/api/admin/mock-tests/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockTestId, publish: !currentStatus }),
      });

      if (res.ok) {
        setMockTests(
          mockTests.map((m) =>
            m.id === mockTestId ? { ...m, isPublished: !currentStatus } : m
          )
        );
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Filter questions for display
  const filteredQuestions = questions.filter((q) => {
    if (selectedSubject !== 'ALL' && !q.subjectName.toLowerCase().includes(selectedSubject.toLowerCase())) {
      return false;
    }
    if (selectedDifficulty !== 'ALL' && q.difficulty !== selectedDifficulty) {
      return false;
    }
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      return (
        q.questionText.toLowerCase().includes(s) ||
        (q.questionTextHi && q.questionTextHi.toLowerCase().includes(s)) ||
        q.topicName.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Question Bank & Publishing Control</h1>
          <p className={styles.pageSubtitle}>
            Author, bulk import (CSV/Excel), validate, and publish bilingual mock tests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <a href="/api/admin/questions/template" download="mockshikhar_template.csv">
            <Button variant="outline" size="md" leftIcon={<Download size={16} />}>
              Download CSV Template
            </Button>
          </a>
          <Button
            variant="accent"
            size="md"
            leftIcon={<Upload size={16} />}
            onClick={() => setActiveTab('bulk')}
          >
            Bulk Import CSV/Excel
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'bank' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          <Layers size={16} />
          <span>Question Bank ({questions.length})</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'author' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('author')}
        >
          <Plus size={16} />
          <span>Add Single Question</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'bulk' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          <FileSpreadsheet size={16} />
          <span>Bulk CSV / Excel Import</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'readiness' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('readiness')}
        >
          <ShieldCheck size={16} />
          <span>Publishing & Readiness</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'audit' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <History size={16} />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* ==================== TAB 1: QUESTION BANK ==================== */}
      {activeTab === 'bank' && (
        <div>
          {/* Filters Bar */}
          <div className={styles.filterBar}>
            <input
              type="text"
              placeholder="Search questions by keyword or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />

            <select
              className={styles.filterSelect}
              value={selectedMockTest}
              onChange={(e) => setSelectedMockTest(e.target.value)}
            >
              <option value="hp-police-mock-1">HP Police Mock 1</option>
              <option value="hp-police-mock-2">HP Police Mock 2</option>
              <option value="hp-police-mock-3">HP Police Mock 3</option>
            </select>

            <select
              className={styles.filterSelect}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="ALL">All Subjects</option>
              <option value="General Awareness">General Awareness</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Reasoning">Reasoning</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi Language</option>
            </select>

            <select
              className={styles.filterSelect}
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Languages size={14} />}
              onClick={() => setLangView(langView === 'en' ? 'hi' : 'en')}
            >
              {langView === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}
            </Button>
          </div>

          {/* Questions Table */}
          <div className={styles.adminTableWrapper}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question & Topic</th>
                  <th>Subject</th>
                  <th>Correct Answer</th>
                  <th>Difficulty</th>
                  <th>Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                      No questions found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredQuestions.map((q, idx) => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        Q{q.questionNumber || idx + 1}
                      </td>
                      <td style={{ maxWidth: '420px' }}>
                        <div style={{ fontWeight: 600, color: '#FFFFFF', marginBottom: '0.25rem' }}>
                          {langView === 'hi' ? q.questionTextHi || q.questionText : q.questionText}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                          Topic: {q.topicName}
                        </div>
                      </td>
                      <td>
                        <Badge variant="neutral" size="sm">
                          {langView === 'hi' ? q.subjectNameHi || q.subjectName : q.subjectName}
                        </Badge>
                      </td>
                      <td>
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34D399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                          }}
                        >
                          Option {q.correctOption}
                        </span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            q.difficulty === 'EASY'
                              ? 'success'
                              : q.difficulty === 'MEDIUM'
                              ? 'warning'
                              : 'error'
                          }
                          size="sm"
                        >
                          {q.difficulty}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        +{q.marks} / -{q.negativeMarks}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            title="Move Question"
                            style={{
                              background: 'rgba(245, 179, 1, 0.1)',
                              border: '1px solid rgba(245, 179, 1, 0.3)',
                              color: '#F5B301',
                              padding: '0.35rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setQuestionToMove(q);
                              setMoveModalOpen(true);
                            }}
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                          <button
                            title="Delete Question"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#F87171',
                              padding: '0.35rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleDeleteQuestion(q.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: SINGLE QUESTION FORM ==================== */}
      {activeTab === 'author' && (
        <div style={{ maxWidth: '900px', background: 'var(--color-bg-primary)', padding: 'var(--space-8)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1.5rem' }}>
            Author New Bilingual Question
          </h2>

          {formSuccess && (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', color: '#34D399', marginBottom: '1.5rem', fontWeight: 600 }}>
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreateQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0' }}>Target Exam</label>
                <select className={styles.filterSelect} value={qExam} onChange={(e) => setQExam(e.target.value)}>
                  <option value="hp-police-constable">HP Police Constable 2026</option>
                  <option value="hp-patwari">HP Patwari Exam</option>
                  <option value="hp-forest-guard">HP Forest Guard</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0' }}>Target Mock Test</label>
                <select className={styles.filterSelect} value={qMockTest} onChange={(e) => setQMockTest(e.target.value)}>
                  <option value="hp-police-mock-1">Mock 1 (Free Starter)</option>
                  <option value="hp-police-mock-2">Mock 2</option>
                  <option value="hp-police-mock-3">Mock 3</option>
                  <option value="hp-police-mock-4">Mock 4</option>
                </select>
              </div>
            </div>

            {/* Question Texts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Question Text (English)"
                placeholder="e.g. Which river is known as the 'Vipasha' in ancient texts?"
                value={qTextEn}
                onChange={(e) => setQTextEn(e.target.value)}
                required
              />
              <Input
                label="Question Text (हिन्दी / Devanagari)"
                placeholder="e.g. प्राचीन ग्रंथों में किस नदी को 'विपाशा' के नाम से जाना जाता है?"
                value={qTextHi}
                onChange={(e) => setQTextHi(e.target.value)}
                required
              />
            </div>

            {/* Options A - D */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input label="Option A (English)" value={optAEn} onChange={(e) => setOptAEn(e.target.value)} required />
              <Input label="Option A (हिन्दी)" value={optAHi} onChange={(e) => setOptAHi(e.target.value)} />

              <Input label="Option B (English)" value={optBEn} onChange={(e) => setOptBEn(e.target.value)} required />
              <Input label="Option B (हिन्दी)" value={optBHi} onChange={(e) => setOptBHi(e.target.value)} />

              <Input label="Option C (English)" value={optCEn} onChange={(e) => setOptCEn(e.target.value)} required />
              <Input label="Option C (हिन्दी)" value={optCHi} onChange={(e) => setOptCHi(e.target.value)} />

              <Input label="Option D (English)" value={optDEn} onChange={(e) => setOptDEn(e.target.value)} required />
              <Input label="Option D (हिन्दी)" value={optDHi} onChange={(e) => setOptDHi(e.target.value)} />
            </div>

            {/* Correct Option Selector */}
            <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F5B301', display: 'block', marginBottom: '0.5rem' }}>
                Select Correct Answer Option:
              </label>
              <div style={{ display: 'flex', gap: '2rem' }}>
                {(['A', 'B', 'C', 'D'] as const).map((label) => (
                  <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, color: correctOpt === label ? '#34D399' : '#E2E8F0' }}>
                    <input
                      type="radio"
                      name="correct-opt-author"
                      checked={correctOpt === label}
                      onChange={() => setCorrectOpt(label)}
                      style={{ accentColor: '#10B981', width: '18px', height: '18px' }}
                    />
                    <span>Option {label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subject, Topic, Difficulty & Marks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0' }}>Subject</label>
                <select className={styles.filterSelect} value={qSubject} onChange={(e) => setQSubject(e.target.value)}>
                  <option value="General Awareness">General Awareness</option>
                  <option value="Mathematics & Reasoning">Mathematics & Reasoning</option>
                  <option value="English Language">English Language</option>
                  <option value="Hindi Language">Hindi Language</option>
                  <option value="General Science">General Science</option>
                </select>
              </div>

              <Input label="Topic" value={qTopic} onChange={(e) => setQTopic(e.target.value)} required />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0' }}>Difficulty</label>
                <select className={styles.filterSelect} value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value as any)}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <Input label="Marks (+ / -)" value={qMarks} onChange={(e) => setQMarks(e.target.value)} required />
            </div>

            {/* Explanations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Step-by-Step Solution (English)"
                placeholder="Detailed conceptual solution..."
                value={qExplEn}
                onChange={(e) => setQExplEn(e.target.value)}
              />
              <Input
                label="Solution Explanation (हिन्दी)"
                placeholder="विस्तृत व्याख्या..."
                value={qExplHi}
                onChange={(e) => setQExplHi(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button variant="secondary" size="lg" type="button" onClick={() => setActiveTab('bank')}>
                Cancel
              </Button>
              <Button variant="accent" size="lg" type="submit" leftIcon={<Plus size={18} />}>
                Save Question to Database Bank
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== TAB 3: BULK IMPORT ==================== */}
      {activeTab === 'bulk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Instructions Box */}
          <div style={{ background: 'var(--color-bg-primary)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Bulk Question Import Engine (CSV & Excel .xlsx)
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              Upload hundreds of bilingual questions at once. The engine validates every single row, checks for missing options, verifies valid A/B/C/D correct answers, detects duplicate questions, and gives you a pre-validation preview before anything touches the database.
            </p>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <a href="/api/admin/questions/template" download="mockshikhar_template.csv">
                <Button variant="accent" size="md" leftIcon={<Download size={16} />}>
                  Download 20-Column CSV Template (With 5 Sample Rows)
                </Button>
              </a>
            </div>
          </div>

          {/* Dropzone */}
          <div
            className={styles.importDropzone}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv, .xlsx, .xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            <FileSpreadsheet className={styles.dropzoneIcon} />
            <h4 className={styles.dropzoneTitle}>
              {importFile ? importFile.name : 'Click to Select or Drag & Drop CSV / Excel file here'}
            </h4>
            <p className={styles.dropzoneSubtitle}>
              Supports UTF-8 Devanagari Hindi, 500+ rows batching, and automated duplicate filtering.
            </p>
          </div>

          {/* Validation Status & Summary */}
          {isValidating && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#F5B301', fontWeight: 700 }}>
              Parsing and validating questions with rule engine...
            </div>
          )}

          {importSummary && (
            <div style={{ background: 'var(--color-bg-primary)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
              <div className={styles.validationHeader}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Pre-Import Validation Summary
                  </h4>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <span className={styles.badgeSuccess}>
                      ✓ {importSummary.validRows} Valid Rows Ready
                    </span>
                    {importSummary.invalidRows > 0 && (
                      <span className={styles.badgeError}>
                        ⚠ {importSummary.invalidRows} Rows with Errors
                      </span>
                    )}
                    {importSummary.duplicateRows > 0 && (
                      <span className={styles.badgeError}>
                        Duplicates Detected: {importSummary.duplicateRows}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {errorReportCsv && (
                    <button
                      onClick={() => {
                        const blob = new Blob([errorReportCsv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'import_error_report.csv';
                        a.click();
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#F87171',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      Download Error Report CSV
                    </button>
                  )}

                  <Button
                    variant="accent"
                    size="md"
                    leftIcon={<CheckCircle2 size={16} />}
                    onClick={handleExecuteImport}
                    disabled={isImporting || importSummary.validRows === 0}
                  >
                    {isImporting ? 'Importing...' : `Import ${importSummary.validRows} Valid Questions Now`}
                  </Button>
                </div>
              </div>

              {/* Validation Preview Table */}
              <div className={styles.adminTableWrapper} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Row #</th>
                      <th>Status</th>
                      <th>Question Text</th>
                      <th>Subject / Topic</th>
                      <th>Correct</th>
                      <th>Validation Errors / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationPreview.map((item, idx) => (
                      <tr key={idx} style={{ background: !item.isValid ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                        <td style={{ fontWeight: 700 }}>{item.rowNumber}</td>
                        <td>
                          {item.isValid ? (
                            <span className={styles.badgeSuccess}>VALID</span>
                          ) : (
                            <span className={styles.badgeError}>ERROR</span>
                          )}
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{item.data.question || item.data.hindi_question}</div>
                        </td>
                        <td>{item.data.subject} / {item.data.topic}</td>
                        <td style={{ fontWeight: 800 }}>Option {item.data.correct_answer}</td>
                        <td>
                          {item.errors.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '1rem', color: '#F87171', fontSize: '0.8rem' }}>
                              {item.errors.map((err: string, i: number) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ color: '#34D399', fontSize: '0.8rem' }}>Ready for database</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 4: READINESS & PUBLISHING ==================== */}
      {activeTab === 'readiness' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Mock Test Readiness & Publishing Safety Tracker
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Safety Rule: Mock tests can ONLY be published when they contain 100% of the required questions (e.g. 90/90). Unpublished tests remain completely hidden from students.
            </p>
          </div>

          <div className={styles.readinessGrid}>
            {mockTests.map((test) => {
              const percent = Math.min(100, Math.round((test.current / test.total) * 100));
              const isReady = test.current >= test.total;
              const missing = Math.max(0, test.total - test.current);

              return (
                <div key={test.id} className={styles.readinessCard}>
                  <div className={styles.readinessHeader}>
                    <div>
                      <h4 className={styles.readinessTitle}>{test.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        HP Police Constable 2026
                      </span>
                    </div>
                    <Badge variant={test.isPublished ? 'success' : 'neutral'} size="sm">
                      {test.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </Badge>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Question Capacity</span>
                      <span style={{ color: isReady ? '#34D399' : '#F5B301', fontWeight: 800 }}>
                        {test.current} / {test.total} ({percent}%)
                      </span>
                    </div>
                    <div className={styles.progressBarContainer}>
                      <div className={styles.progressBarFill} style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  {!isReady && (
                    <div style={{ fontSize: '0.75rem', color: '#F87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                      ⚠ Missing {missing} questions before test can be published.
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <Button
                      variant={test.isPublished ? 'secondary' : 'accent'}
                      size="md"
                      fullWidth
                      onClick={() => handleTogglePublish(test.id, test.isPublished, test.current, test.total)}
                    >
                      {test.isPublished ? 'Unpublish Test' : isReady ? 'Publish Test to Students' : `Needs ${missing} More Questions`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 5: AUDIT TRAIL ==================== */}
      {activeTab === 'audit' && (
        <div className={styles.adminTableWrapper}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Details</th>
                <th>Author</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Just Now</td>
                <td><Badge variant="accent" size="sm">QUESTION_IMPORT</Badge></td>
                <td style={{ fontWeight: 600 }}>Bulk imported 25 questions into HP Police Mock 1</td>
                <td>Admin (admin@mockshikhar.com)</td>
                <td><span className={styles.badgeSuccess}>SUCCESS</span></td>
              </tr>
              <tr>
                <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>2 Hours Ago</td>
                <td><Badge variant="success" size="sm">MOCK_PUBLISH</Badge></td>
                <td style={{ fontWeight: 600 }}>Published HP Police Mock 1 (90/90 Questions verified)</td>
                <td>Admin (admin@mockshikhar.com)</td>
                <td><span className={styles.badgeSuccess}>SUCCESS</span></td>
              </tr>
              <tr>
                <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Yesterday</td>
                <td><Badge variant="neutral" size="sm">QUESTION_CREATE</Badge></td>
                <td style={{ fontWeight: 600 }}>Created bilingual question for General Awareness</td>
                <td>Admin (admin@mockshikhar.com)</td>
                <td><span className={styles.badgeSuccess}>SUCCESS</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Move Question Modal */}
      <Modal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        title="Move Question to Another Mock Test"
        maxWidth="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Select the destination mock test for question <strong>Q{questionToMove?.questionNumber}</strong>.
          </p>
          <select
            className={styles.filterSelect}
            value={targetMock}
            onChange={(e) => setTargetMock(e.target.value)}
          >
            <option value="hp-police-mock-1">HP Police Mock 1</option>
            <option value="hp-police-mock-2">HP Police Mock 2</option>
            <option value="hp-police-mock-3">HP Police Mock 3</option>
            <option value="hp-police-mock-4">HP Police Mock 4</option>
          </select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button variant="secondary" size="md" onClick={() => setMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="md" onClick={handleMoveQuestion}>
              Confirm Move
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
