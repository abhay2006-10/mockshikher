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
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AdminImportModal from '@/components/admin/AdminImportModal';
import styles from '../admin.module.css';

interface QuestionOptionItem {
  id?: string;
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  textHi?: string;
}

interface QuestionItem {
  id: string;
  mockTestId: string;
  subjectId: string;
  subjectName?: string;
  subjectNameHi?: string;
  topicId: string;
  topicName?: string;
  questionNumber: number;
  questionText: string;
  questionTextHi?: string;
  questionImage?: string | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  marks: number;
  negativeMarks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  explanation?: string;
  explanationHi?: string;
  solutionImage?: string | null;
  options: QuestionOptionItem[];
}

interface ExamOption {
  id: string;
  slug: string;
  name: string;
  mockTests?: { id: string; name: string; testNumber: number; isPublished: boolean }[];
}

interface SubjectOption {
  id: string;
  name: string;
  topics?: { id: string; name: string }[];
}

interface ReadinessTestItem {
  id: string;
  name: string;
  testNumber: number;
  examName: string;
  examSlug?: string;
  currentQuestionsCount: number;
  invalidQuestionsCount: number;
  isPublished: boolean;
  isFree: boolean;
  attemptsCount: number;
  isReady: boolean;
}

interface AuditLogItem {
  id: string;
  action: string;
  details: string;
  author: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR';
}

export default function AdminQuestionsPage() {
  const [activeTab, setActiveTab] = useState<'bank' | 'author' | 'readiness' | 'audit'>('bank');

  // Dynamic Exam, Mock, and Subject options from database
  const [examsList, setExamsList] = useState<ExamOption[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectOption[]>([]);

  // Filtering states
  const [selectedExamSlug, setSelectedExamSlug] = useState<string>('ALL');
  const [selectedMockTestId, setSelectedMockTestId] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [langView, setLangView] = useState<'en' | 'hi'>('en');

  // Question list state
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Authoring Single Question state
  const [authorExamSlug, setAuthorExamSlug] = useState('');
  const [authorMockTestId, setAuthorMockTestId] = useState('');
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
  const [qSubjectName, setQSubjectName] = useState('General Awareness');
  const [qTopicName, setQTopicName] = useState('General');
  const [qDifficulty, setQDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [qMarks, setQMarks] = useState('1.0');
  const [qNegativeMarks, setQNegativeMarks] = useState('0.25');
  const [qExplEn, setQExplEn] = useState('');
  const [qExplHi, setQExplHi] = useState('');
  const [qImage, setQImage] = useState<string | null>(null);
  const [qSolImage, setQSolImage] = useState<string | null>(null);
  const [isAuthoringSubmitting, setIsAuthoringSubmitting] = useState(false);
  const [authorError, setAuthorError] = useState('');

  // Edit Question Modal state
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editQTextEn, setEditQTextEn] = useState('');
  const [editQTextHi, setEditQTextHi] = useState('');
  const [editOptAEn, setEditOptAEn] = useState('');
  const [editOptAHi, setEditOptAHi] = useState('');
  const [editOptBEn, setEditOptBEn] = useState('');
  const [editOptBHi, setEditOptBHi] = useState('');
  const [editOptCEn, setEditOptCEn] = useState('');
  const [editOptCHi, setEditOptCHi] = useState('');
  const [editOptDEn, setEditOptDEn] = useState('');
  const [editOptDHi, setEditOptDHi] = useState('');
  const [editCorrectOpt, setEditCorrectOpt] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editTopicName, setEditTopicName] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [editMarks, setEditMarks] = useState('1.0');
  const [editNegativeMarks, setEditNegativeMarks] = useState('0.25');
  const [editExplEn, setEditExplEn] = useState('');
  const [editExplHi, setEditExplHi] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editSolImage, setEditSolImage] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Publishing & Readiness state
  const [readinessTests, setReadinessTests] = useState<ReadinessTestItem[]>([]);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Bulk Import Modal state
  const [importModalOpen, setImportModalOpen] = useState(false);

  // File upload input refs for image attachments
  const qImageInputRef = useRef<HTMLInputElement>(null);
  const qSolImageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const editSolImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Initial load
  useEffect(() => {
    fetchExamsAndSetup();
  }, []);

  // Fetch questions whenever filters change
  useEffect(() => {
    if (activeTab === 'bank') {
      fetchQuestions();
    } else if (activeTab === 'readiness') {
      fetchReadiness();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, selectedExamSlug, selectedMockTestId, selectedSubjectId, selectedDifficulty, searchQuery]);

  const fetchExamsAndSetup = async () => {
    try {
      const res = await fetch('/api/admin/exams');
      if (res.ok) {
        const data = await res.json();
        const exams: ExamOption[] = data.exams || [];
        setExamsList(exams);
        if (exams.length > 0 && !authorExamSlug) {
          setAuthorExamSlug(exams[0].slug);
          if (exams[0].mockTests && exams[0].mockTests.length > 0) {
            setAuthorMockTestId(exams[0].mockTests[0].id);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch exams list:', e);
    }
  };

  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    setQuestionError('');

    const params = new URLSearchParams();
    if (selectedExamSlug !== 'ALL') params.set('exam', selectedExamSlug);
    if (selectedMockTestId !== 'ALL') params.set('mockTestId', selectedMockTestId);
    if (selectedSubjectId !== 'ALL') params.set('subject', selectedSubjectId);
    if (selectedDifficulty !== 'ALL') params.set('difficulty', selectedDifficulty);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    params.set('limit', '100');

    try {
      const res = await fetch(`/api/admin/questions?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setQuestionError(data.error || 'Failed to fetch questions.');
        setQuestions([]);
        setTotalQuestions(0);
      } else {
        setQuestions(data.questions || []);
        setTotalQuestions(data.total || 0);
      }
    } catch (err: any) {
      setQuestionError(err.message || 'Error fetching questions.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const fetchReadiness = async () => {
    setIsLoadingReadiness(true);
    try {
      const res = await fetch('/api/admin/mock-tests/publish', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setReadinessTests(data.mockTests || []);
      }
    } catch (err) {
      console.warn('Failed to load readiness tests:', err);
    } finally {
      setIsLoadingReadiness(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch('/api/admin/audit-logs', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Image Upload helper
  const handleUploadImageFile = async (
    file: File,
    type: 'question' | 'solution',
    target: 'author' | 'edit'
  ) => {
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      if (target === 'author') {
        if (type === 'question') setQImage(data.url);
        else setQSolImage(data.url);
      } else {
        if (type === 'question') setEditImage(data.url);
        else setEditSolImage(data.url);
      }
      showToast(`Image uploaded successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload image.', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Add Single Question submit
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTextEn && !qTextHi) {
      setAuthorError('Question text in English or Hindi is required.');
      return;
    }

    const marksNum = parseFloat(qMarks);
    if (isNaN(marksNum) || marksNum <= 0) {
      setAuthorError('Marks must be greater than 0.');
      return;
    }

    const negNum = parseFloat(qNegativeMarks);
    if (isNaN(negNum) || negNum < 0 || negNum > 5) {
      setAuthorError('Negative marking must be between 0 and 5.');
      return;
    }

    setIsAuthoringSubmitting(true);
    setAuthorError('');

    const payload = {
      examSlug: authorExamSlug,
      mockTestId: authorMockTestId,
      questionText: qTextEn || qTextHi,
      questionTextHi: qTextHi || qTextEn,
      options: [
        { label: 'A', text: optAEn, textHi: optAHi || optAEn },
        { label: 'B', text: optBEn, textHi: optBHi || optBEn },
        { label: 'C', text: optCEn, textHi: optCHi || optCEn },
        { label: 'D', text: optDEn, textHi: optDHi || optDEn },
      ],
      correctOption: correctOpt,
      subjectName: qSubjectName,
      topicName: qTopicName,
      difficulty: qDifficulty,
      marks: marksNum,
      negativeMarks: negNum,
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create question.');
      }

      showToast(`Question created successfully in database!`);
      // Reset form fields
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
      setQImage(null);
      setQSolImage(null);
      fetchQuestions();
      setActiveTab('bank');
    } catch (err: any) {
      setAuthorError(err.message || 'Error creating question.');
    } finally {
      setIsAuthoringSubmitting(false);
    }
  };

  // Open Edit Question Modal
  const openEditModal = (q: QuestionItem) => {
    setEditingQuestion(q);
    setEditQTextEn(q.questionText || '');
    setEditQTextHi(q.questionTextHi || '');
    const findOpt = (lbl: string) => q.options.find((o) => o.label === lbl);
    setEditOptAEn(findOpt('A')?.text || '');
    setEditOptAHi(findOpt('A')?.textHi || '');
    setEditOptBEn(findOpt('B')?.text || '');
    setEditOptBHi(findOpt('B')?.textHi || '');
    setEditOptCEn(findOpt('C')?.text || '');
    setEditOptCHi(findOpt('C')?.textHi || '');
    setEditOptDEn(findOpt('D')?.text || '');
    setEditOptDHi(findOpt('D')?.textHi || '');
    setEditCorrectOpt(q.correctOption || 'A');
    setEditSubjectName(q.subjectName || '');
    setEditTopicName(q.topicName || '');
    setEditDifficulty(q.difficulty || 'MEDIUM');
    setEditMarks(String(q.marks || 1));
    setEditNegativeMarks(String(q.negativeMarks !== undefined ? q.negativeMarks : 0.25));
    setEditExplEn(q.explanation || '');
    setEditExplHi(q.explanationHi || '');
    setEditImage(q.questionImage || null);
    setEditSolImage(q.solutionImage || null);
    setEditError('');
  };

  // Submit Edit Question
  const handleSaveEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setIsEditSubmitting(true);
    setEditError('');

    try {
      const res = await fetch(`/api/admin/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: editQTextEn,
          questionTextHi: editQTextHi,
          options: [
            { label: 'A', text: editOptAEn, textHi: editOptAHi || editOptAEn },
            { label: 'B', text: editOptBEn, textHi: editOptBHi || editOptBEn },
            { label: 'C', text: editOptCEn, textHi: editOptCHi || editOptCEn },
            { label: 'D', text: editOptDEn, textHi: editOptDHi || editOptDEn },
          ],
          correctOption: editCorrectOpt,
          subjectName: editSubjectName,
          topicName: editTopicName,
          difficulty: editDifficulty,
          marks: Number(editMarks),
          negativeMarks: Number(editNegativeMarks),
          explanation: editExplEn,
          explanationHi: editExplHi,
          questionImage: editImage,
          solutionImage: editSolImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update question.');

      showToast(`Question updated successfully!`);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (err: any) {
      setEditError(err.message || 'Error updating question.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Delete Single Question
  const handleDeleteQuestion = async (q: QuestionItem) => {
    if (!confirm(`Delete Question #${q.questionNumber}? Remaining questions will be renumbered automatically.`)) return;

    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete question.');

      showToast(data.message || 'Question deleted and renumbered successfully!');
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete question.', 'error');
    }
  };

  // Bulk Delete All Questions in Selected Mock Test
  const handleBulkDeleteMockQuestions = async () => {
    if (selectedMockTestId === 'ALL') {
      alert('Please select a specific Mock Test from the filter dropdown above to bulk delete its questions.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ALL questions in this mock test? This action will be blocked if students have already attempted it.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/questions?mockTestId=${encodeURIComponent(selectedMockTestId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk deletion failed.');

      showToast(data.message || 'Questions deleted successfully!');
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || 'Cannot bulk delete questions.', 'error');
    }
  };

  // Toggle Publish / Unpublish Mock Test
  const handleTogglePublish = async (testId: string, currentPublished: boolean) => {
    const targetAction = !currentPublished;
    try {
      const res = await fetch('/api/admin/mock-tests/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockTestId: testId, publish: targetAction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish toggle failed.');

      showToast(data.message || 'Status updated successfully!');
      fetchReadiness();
    } catch (err: any) {
      showToast(err.message || 'Cannot update publish status.', 'error');
    }
  };

  // Derive mocks for current authoring exam
  const authorExamObj = examsList.find((e) => e.slug === authorExamSlug);
  const authorMocks = authorExamObj?.mockTests || [];

  // Derive mocks for filter dropdown
  const filterExamObj = examsList.find((e) => e.slug === selectedExamSlug);
  const filterMocks = filterExamObj?.mockTests || [];

  return (
    <div>
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            background: toast.type === 'success' ? '#065F46' : '#991B1B',
            color: '#FFFFFF',
            border: `1px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`,
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Question Bank & Importer</h1>
          <p className={styles.pageSubtitle}>
            Author bilingual questions, import via CSV/Excel, manage publishing readiness, and audit actions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <a href="/api/admin/questions/template" download="mockshikhar_questions_template.csv">
            <Button variant="outline" size="md" leftIcon={<Download size={16} />}>
              Download CSV Template
            </Button>
          </a>
          <Button
            variant="accent"
            size="md"
            leftIcon={<Upload size={16} />}
            onClick={() => setImportModalOpen(true)}
          >
            Import Questions (CSV/Excel)
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
          <span>Question Bank ({totalQuestions})</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'author' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('author')}
        >
          <Plus size={16} />
          <span>Add Single Question</span>
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

      {/* ============================================================ */}
      {/* TAB 1: QUESTION BANK                                         */}
      {/* ============================================================ */}
      {activeTab === 'bank' && (
        <div>
          {/* Filters Bar */}
          <div className={styles.filterBar} style={{ flexWrap: 'wrap', gap: '0.65rem' }}>
            <input
              type="text"
              placeholder="Search questions by keyword or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              style={{ minWidth: '220px' }}
            />

            {/* Dynamic Exam Selector */}
            <select
              className={styles.filterSelect}
              value={selectedExamSlug}
              onChange={(e) => {
                setSelectedExamSlug(e.target.value);
                setSelectedMockTestId('ALL');
              }}
            >
              <option value="ALL">All Exam Series</option>
              {examsList.map((exam) => (
                <option key={exam.id} value={exam.slug}>
                  {exam.name}
                </option>
              ))}
            </select>

            {/* Dynamic Mock Test Selector */}
            <select
              className={styles.filterSelect}
              value={selectedMockTestId}
              onChange={(e) => setSelectedMockTestId(e.target.value)}
            >
              <option value="ALL">All Mock Tests</option>
              {filterMocks.map((m) => (
                <option key={m.id} value={m.id}>
                  Mock #{m.testNumber} - {m.name}
                </option>
              ))}
            </select>

            {/* Difficulty Selector */}
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

            {/* Bilingual Display Toggle */}
            <button
              type="button"
              className={styles.filterSelect}
              onClick={() => setLangView(langView === 'en' ? 'hi' : 'en')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
            >
              <Languages size={14} color="#F5B301" />
              <span>View: {langView === 'en' ? 'English' : 'हिंदी (Hindi)'}</span>
            </button>

            {/* Bulk Delete Button if Mock is Selected */}
            {selectedMockTestId !== 'ALL' && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Trash2 size={13} color="#EF4444" />}
                onClick={handleBulkDeleteMockQuestions}
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#F87171' }}
              >
                Bulk Delete Mock Questions
              </Button>
            )}
          </div>

          {questionError && (
            <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#F87171', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {questionError}
            </div>
          )}

          {isLoadingQuestions ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              Loading questions from PostgreSQL database...
            </div>
          ) : questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-bg-primary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <Layers size={36} color="#F5B301" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>No Questions Found</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {selectedExamSlug !== 'ALL'
                  ? `No questions in this series yet. Add questions or import via CSV/Excel.`
                  : `Try adjusting your search filters or authoring a new question.`}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <Button variant="primary" size="md" onClick={() => setActiveTab('author')}>
                  Add Single Question
                </Button>
                <Button variant="accent" size="md" onClick={() => setImportModalOpen(true)}>
                  Bulk Import Questions
                </Button>
              </div>
            </div>
          ) : (
            <div className={styles.adminTableWrapper}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Question Text</th>
                    <th>Options</th>
                    <th>Correct</th>
                    <th>Subject / Topic</th>
                    <th>Marks</th>
                    <th>Diff</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => {
                    const text = langView === 'hi' && q.questionTextHi ? q.questionTextHi : q.questionText;

                    return (
                      <tr key={q.id}>
                        <td data-label="#">
                          <strong style={{ color: '#F5B301' }}>Q{q.questionNumber}</strong>
                        </td>
                        <td data-label="Question Text" style={{ maxWidth: '340px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ color: '#fff', fontSize: '0.875rem', lineHeight: 1.4 }}>
                              {text}
                            </span>
                            {q.questionImage && (
                              <span style={{ fontSize: '0.7rem', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <ImageIcon size={11} /> Image attached
                              </span>
                            )}
                          </div>
                        </td>
                        <td data-label="Options">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                            {q.options.map((opt) => (
                              <span key={opt.label}>
                                <strong style={{ color: opt.label === q.correctOption ? '#10B981' : '#fff' }}>
                                  {opt.label}:
                                </strong>{' '}
                                {langView === 'hi' && opt.textHi ? opt.textHi : opt.text}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td data-label="Correct">
                          <Badge variant="accent" size="sm">
                            {q.correctOption}
                          </Badge>
                        </td>
                        <td data-label="Subject / Topic">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 600 }}>
                              {q.subjectName || 'General Awareness'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                              {q.topicName || 'General'}
                            </span>
                          </div>
                        </td>
                        <td data-label="Marks">
                          <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>
                            +{q.marks} / -{q.negativeMarks}
                          </span>
                        </td>
                        <td data-label="Diff">
                          <Badge
                            variant={q.difficulty === 'EASY' ? 'success' : q.difficulty === 'HARD' ? 'error' : 'neutral'}
                            size="sm"
                          >
                            {q.difficulty}
                          </Badge>
                        </td>
                        <td data-label="Actions">
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Edit size={13} />}
                              onClick={() => openEditModal(q)}
                            >
                              Edit
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#F87171',
                                padding: '0.3rem 0.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                              title="Delete Question (Renumber remaining)"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ADD SINGLE QUESTION                                   */}
      {/* ============================================================ */}
      {activeTab === 'author' && (
        <div style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', maxWidth: '850px' }}>
          <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 1rem 0', fontWeight: 800 }}>
            Author Bilingual Question
          </h3>

          {authorError && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', color: '#F87171', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {authorError}
            </div>
          )}

          <form onSubmit={handleCreateQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Exam and Mock Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="formGrid">
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Target Exam Series
                </label>
                <select
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={authorExamSlug}
                  onChange={(e) => {
                    setAuthorExamSlug(e.target.value);
                    const ex = examsList.find((x) => x.slug === e.target.value);
                    if (ex?.mockTests && ex.mockTests.length > 0) {
                      setAuthorMockTestId(ex.mockTests[0].id);
                    } else {
                      setAuthorMockTestId('');
                    }
                  }}
                  required
                >
                  {examsList.map((ex) => (
                    <option key={ex.id} value={ex.slug}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Target Mock Test
                </label>
                <select
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={authorMockTestId}
                  onChange={(e) => setAuthorMockTestId(e.target.value)}
                  required
                >
                  {authorMocks.length === 0 ? (
                    <option value="">No mock tests in this exam (create one first)</option>
                  ) : (
                    authorMocks.map((m) => (
                      <option key={m.id} value={m.id}>
                        Mock #{m.testNumber} - {m.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Question Text in English & Hindi */}
            <Input
              label="Question Text (English)"
              placeholder="e.g. Which is the highest mountain peak in Himachal Pradesh?"
              value={qTextEn}
              onChange={(e) => setQTextEn(e.target.value)}
              required={!qTextHi}
            />

            <Input
              label="Question Text (Hindi - हिंदी)"
              placeholder="e.g. हिमाचल प्रदेश की सबसे ऊंची पर्वत चोटी कौन सी है?"
              value={qTextHi}
              onChange={(e) => setQTextHi(e.target.value)}
              required={!qTextEn}
            />

            {/* Question Image Attachment */}
            <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ImageIcon size={14} color="#F5B301" /> Question Diagram / Image (Optional)
                </span>
                <input
                  ref={qImageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadImageFile(e.target.files[0], 'question', 'author');
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => qImageInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  {qImage ? 'Replace Image' : 'Upload Image'}
                </Button>
              </div>
              {qImage && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={qImage} alt="Preview" style={{ height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{qImage}</span>
                  <button type="button" onClick={() => setQImage(null)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* 4 Options in English & Hindi */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="formGrid">
              <Input label="Option A (English)" value={optAEn} onChange={(e) => setOptAEn(e.target.value)} required />
              <Input label="Option A (Hindi)" value={optAHi} onChange={(e) => setOptAHi(e.target.value)} />

              <Input label="Option B (English)" value={optBEn} onChange={(e) => setOptBEn(e.target.value)} required />
              <Input label="Option B (Hindi)" value={optBHi} onChange={(e) => setOptBHi(e.target.value)} />

              <Input label="Option C (English)" value={optCEn} onChange={(e) => setOptCEn(e.target.value)} required />
              <Input label="Option C (Hindi)" value={optCHi} onChange={(e) => setOptCHi(e.target.value)} />

              <Input label="Option D (English)" value={optDEn} onChange={(e) => setOptDEn(e.target.value)} required />
              <Input label="Option D (Hindi)" value={optDHi} onChange={(e) => setOptDHi(e.target.value)} />
            </div>

            {/* Correct Answer & Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }} className="formGrid">
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Correct Option
                </label>
                <select
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={correctOpt}
                  onChange={(e) => setCorrectOpt(e.target.value as any)}
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Difficulty
                </label>
                <select
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={qDifficulty}
                  onChange={(e) => setQDifficulty(e.target.value as any)}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <Input
                label="Marks (+)"
                type="number"
                step="0.25"
                value={qMarks}
                onChange={(e) => setQMarks(e.target.value)}
                required
              />

              <Input
                label="Negative Marks (-)"
                type="number"
                step="0.05"
                value={qNegativeMarks}
                onChange={(e) => setQNegativeMarks(e.target.value)}
                required
              />
            </div>

            {/* Subject and Topic */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="formGrid">
              <Input
                label="Subject Name"
                placeholder="e.g. General Awareness, Mathematics"
                value={qSubjectName}
                onChange={(e) => setQSubjectName(e.target.value)}
                required
              />
              <Input
                label="Topic Name"
                placeholder="e.g. Geography of HP, Geometry"
                value={qTopicName}
                onChange={(e) => setQTopicName(e.target.value)}
                required
              />
            </div>

            {/* Explanations */}
            <Input
              label="Explanation (English, Optional)"
              placeholder="Detailed step-by-step solution..."
              value={qExplEn}
              onChange={(e) => setQExplEn(e.target.value)}
            />

            <Input
              label="Explanation (Hindi, Optional)"
              placeholder="विस्तृत व्याख्या..."
              value={qExplHi}
              onChange={(e) => setQExplHi(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="accent" size="md" type="submit" disabled={isAuthoringSubmitting}>
                {isAuthoringSubmitting ? 'Saving to Database...' : 'Add Question to Mock Test'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: PUBLISHING & READINESS                                */}
      {/* ============================================================ */}
      {activeTab === 'readiness' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: 800 }}>
              Mock Test Readiness & Publishing Control
            </h3>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw size={13} />} onClick={fetchReadiness}>
              Refresh Readiness
            </Button>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Publishing is strictly blocked if a test has 0 questions or any question lacks a valid correct answer (A-D).
          </p>

          {isLoadingReadiness ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
              Checking database readiness status...
            </div>
          ) : (
            <div className={styles.adminTableWrapper}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Mock Test</th>
                    <th>Exam Series</th>
                    <th>Questions Count</th>
                    <th>Attempts</th>
                    <th>Readiness Status</th>
                    <th>Publish State</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {readinessTests.map((t) => (
                    <tr key={t.id}>
                      <td data-label="Mock Test">
                        <strong style={{ color: '#fff' }}>{t.name}</strong>
                      </td>
                      <td data-label="Exam Series" style={{ color: '#94A3B8' }}>
                        {t.examName}
                      </td>
                      <td data-label="Questions Count">
                        <span style={{ fontWeight: 700, color: t.currentQuestionsCount > 0 ? '#10B981' : '#EF4444' }}>
                          {t.currentQuestionsCount} Questions
                        </span>
                      </td>
                      <td data-label="Attempts" style={{ color: '#38BDF8' }}>
                        {t.attemptsCount} Attempts
                      </td>
                      <td data-label="Readiness Status">
                        {t.isReady ? (
                          <Badge variant="success" size="sm">
                            Ready to Publish
                          </Badge>
                        ) : (
                          <Badge variant="error" size="sm">
                            Blocked (0 Q or Invalid)
                          </Badge>
                        )}
                      </td>
                      <td data-label="Publish State">
                        {t.isPublished ? (
                          <span style={{ color: '#34D399', fontWeight: 700, fontSize: '0.85rem' }}>Published</span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.85rem' }}>Draft</span>
                        )}
                      </td>
                      <td data-label="Action">
                        <Button
                          variant={t.isPublished ? 'secondary' : 'accent'}
                          size="sm"
                          onClick={() => handleTogglePublish(t.id, t.isPublished)}
                        >
                          {t.isPublished ? 'Unpublish' : 'Publish to Students'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: AUDIT TRAIL                                           */}
      {/* ============================================================ */}
      {activeTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: 800 }}>
              System Audit Trail (PostgreSQL audit_logs)
            </h3>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw size={13} />} onClick={fetchAuditLogs}>
              Refresh Logs
            </Button>
          </div>

          {isLoadingAudit ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
              Fetching audit logs from PostgreSQL...
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--color-bg-primary)', borderRadius: '8px' }}>
              No audit logs recorded yet.
            </div>
          ) : (
            <div className={styles.adminTableWrapper}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Author</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td data-label="Action">
                        <span
                          style={{
                            background: 'rgba(245, 179, 1, 0.1)',
                            border: '1px solid rgba(245, 179, 1, 0.3)',
                            color: '#F5B301',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td data-label="Details" style={{ color: '#E2E8F0', fontSize: '0.85rem' }}>
                        {log.details}
                      </td>
                      <td data-label="Author" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                        {log.author}
                      </td>
                      <td data-label="Timestamp" style={{ color: '#94A3B8', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td data-label="Status">
                        <span style={{ color: log.status === 'SUCCESS' ? '#34D399' : '#F87171', fontWeight: 700, fontSize: '0.8rem' }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* EDIT QUESTION MODAL                                          */}
      {/* ============================================================ */}
      {editingQuestion && (
        <div className={styles.drawerOverlay} onClick={() => setEditingQuestion(null)} style={{ zIndex: 10000 }}>
          <div className={styles.drawerModal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', width: '95%' }}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>
                Edit Question #{editingQuestion.questionNumber}
              </h3>
              <button type="button" className={styles.mobileMenuBtn} onClick={() => setEditingQuestion(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditQuestion} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className={styles.drawerBody} style={{ gap: '0.85rem' }}>
                {editError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', color: '#F87171', fontSize: '0.85rem' }}>
                    {editError}
                  </div>
                )}

                <Input
                  label="Question Text (English)"
                  value={editQTextEn}
                  onChange={(e) => setEditQTextEn(e.target.value)}
                  required={!editQTextHi}
                />

                <Input
                  label="Question Text (Hindi)"
                  value={editQTextHi}
                  onChange={(e) => setEditQTextHi(e.target.value)}
                  required={!editQTextEn}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }} className="formGrid">
                  <Input label="Option A (English)" value={editOptAEn} onChange={(e) => setEditOptAEn(e.target.value)} required />
                  <Input label="Option A (Hindi)" value={editOptAHi} onChange={(e) => setEditOptAHi(e.target.value)} />

                  <Input label="Option B (English)" value={editOptBEn} onChange={(e) => setEditOptBEn(e.target.value)} required />
                  <Input label="Option B (Hindi)" value={editOptBHi} onChange={(e) => setEditOptBHi(e.target.value)} />

                  <Input label="Option C (English)" value={editOptCEn} onChange={(e) => setEditOptCEn(e.target.value)} required />
                  <Input label="Option C (Hindi)" value={editOptCHi} onChange={(e) => setEditOptCHi(e.target.value)} />

                  <Input label="Option D (English)" value={editOptDEn} onChange={(e) => setEditOptDEn(e.target.value)} required />
                  <Input label="Option D (Hindi)" value={editOptDHi} onChange={(e) => setEditOptDHi(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }} className="formGrid">
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Correct Option
                    </label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={editCorrectOpt}
                      onChange={(e) => setEditCorrectOpt(e.target.value as any)}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Difficulty
                    </label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(e.target.value as any)}
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  <Input
                    label="Marks"
                    type="number"
                    step="0.25"
                    value={editMarks}
                    onChange={(e) => setEditMarks(e.target.value)}
                    required
                  />

                  <Input
                    label="Negative Marks"
                    type="number"
                    step="0.05"
                    value={editNegativeMarks}
                    onChange={(e) => setEditNegativeMarks(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }} className="formGrid">
                  <Input
                    label="Subject"
                    value={editSubjectName}
                    onChange={(e) => setEditSubjectName(e.target.value)}
                  />
                  <Input
                    label="Topic"
                    value={editTopicName}
                    onChange={(e) => setEditTopicName(e.target.value)}
                  />
                </div>

                <Input
                  label="Explanation (English)"
                  value={editExplEn}
                  onChange={(e) => setEditExplEn(e.target.value)}
                />

                <Input
                  label="Explanation (Hindi)"
                  value={editExplHi}
                  onChange={(e) => setEditExplHi(e.target.value)}
                />
              </div>

              <div className={styles.drawerFooter}>
                <Button variant="secondary" size="md" type="button" onClick={() => setEditingQuestion(null)}>
                  Cancel
                </Button>
                <Button variant="accent" size="md" type="submit" disabled={isEditSubmitting}>
                  {isEditSubmitting ? 'Saving...' : 'Save Question Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* REUSABLE BULK CSV / EXCEL IMPORT MODAL                       */}
      {/* ============================================================ */}
      <AdminImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        defaultExamSlug={selectedExamSlug !== 'ALL' ? selectedExamSlug : undefined}
        defaultMockNumber={
          selectedMockTestId !== 'ALL'
            ? filterMocks.find((m) => m.id === selectedMockTestId)?.testNumber
            : undefined
        }
        onSuccess={() => {
          fetchQuestions();
          fetchExamsAndSetup();
          showToast('Import completed successfully!');
        }}
      />
    </div>
  );
}
