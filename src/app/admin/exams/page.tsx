'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Archive,
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  X,
  Lock,
  Layers,
  AlertCircle,
  Check,
  Trash2,
  Upload,
  BookOpen,
  FolderPlus,
  FileSpreadsheet,
  Folder,
  ArrowUp,
  ArrowDown,
  Pin,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import AdminImportModal from '@/components/admin/AdminImportModal';
import styles from '../admin.module.css';

interface TopicItem {
  id: string;
  subjectId: string;
  name: string;
  nameHi?: string | null;
  sortOrder: number;
  _count?: { questions: number };
}

interface SubjectItem {
  id: string;
  examId: string;
  name: string;
  nameHi?: string | null;
  sortOrder: number;
  topics?: TopicItem[];
  _count?: { questions: number };
}

interface MockTestItem {
  id: string;
  examId: string;
  name: string;
  testNumber: number;
  isFree: boolean;
  isPublished: boolean;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  durationOverride?: number | null;
  marksOverride?: number | null;
  negativeMarksOverride?: number | null;
  _count?: {
    questions: number;
    attempts?: number;
  };
}

interface ExamItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  totalQuestions: number;
  durationMinutes: number;
  price: number;
  negativeMarking: number;
  marksPerQuestion: number;
  isArchived: boolean;
  isPopular: boolean;
  _count?: {
    mockTests: number;
  };
  mockTests?: MockTestItem[];
  subjects?: SubjectItem[];
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Expanded exam ID for viewing mock tests & subjects
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [examActiveTab, setExamActiveTab] = useState<Record<string, 'mocks' | 'subjects'>>({});

  // Subjects per exam data cache
  const [examSubjects, setExamSubjects] = useState<Record<string, SubjectItem[]>>({});
  const [loadingSubjects, setLoadingSubjects] = useState<Record<string, boolean>>({});

  // ==========================================
  // MODAL STATES
  // ==========================================

  // 1. Add Exam Modal
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newCategory, setNewCategory] = useState('HP Exams');
  const [newDesc, setNewDesc] = useState('');
  const [newQuestions, setNewQuestions] = useState('90');
  const [newDuration, setNewDuration] = useState('60');
  const [newPrice, setNewPrice] = useState('1');
  const [newNegMark, setNewNegMark] = useState('0.25');
  const [newMarksPerQ, setNewMarksPerQ] = useState('1.0');
  const [isSubmittingAddExam, setIsSubmittingAddExam] = useState(false);
  const [addExamError, setAddExamError] = useState('');

  // 2. Edit Exam Drawer
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editQuestions, setEditQuestions] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editNegMark, setEditNegMark] = useState('');
  const [editMarksPerQ, setEditMarksPerQ] = useState('');
  const [editArchived, setEditArchived] = useState(false);
  const [isSubmittingEditExam, setIsSubmittingEditExam] = useState(false);
  const [editExamError, setEditExamError] = useState('');

  // 3. Add Mock Test Modal
  const [addMockExam, setAddMockExam] = useState<ExamItem | null>(null);
  const [addMockNumber, setAddMockNumber] = useState('');
  const [addMockTitle, setAddMockTitle] = useState('');
  const [addMockFree, setAddMockFree] = useState(false);
  const [addMockPublished, setAddMockPublished] = useState(false);
  const [addMockDuration, setAddMockDuration] = useState('');
  const [addMockNegMark, setAddMockNegMark] = useState('');
  const [addMockMarksPerQ, setAddMockMarksPerQ] = useState('');
  const [isSubmittingAddMock, setIsSubmittingAddMock] = useState(false);
  const [addMockError, setAddMockError] = useState('');

  // 4. Edit Mock Test Modal
  const [editingTest, setEditingTest] = useState<{ test: MockTestItem; exam: ExamItem } | null>(null);
  const [editTestName, setEditTestName] = useState('');
  const [editTestFree, setEditTestFree] = useState(false);
  const [editTestPublished, setEditTestPublished] = useState(false);
  const [editTestDuration, setEditTestDuration] = useState('');
  const [editTestNegMark, setEditTestNegMark] = useState('');
  const [editTestMarksPerQ, setEditTestMarksPerQ] = useState('');
  const [isSubmittingEditMock, setIsSubmittingEditMock] = useState(false);
  const [editMockError, setEditMockError] = useState('');

  // 5. Add / Edit Subject Modal
  const [subjectModalExam, setSubjectModalExam] = useState<ExamItem | null>(null);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [subjName, setSubjName] = useState('');
  const [subjNameHi, setSubjNameHi] = useState('');
  const [subjInitialTopics, setSubjInitialTopics] = useState('');
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState('');

  // 6. Add / Edit Topic Modal
  const [topicModalSubject, setTopicModalSubject] = useState<SubjectItem | null>(null);
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [topicName, setTopicName] = useState('');
  const [topicNameHi, setTopicNameHi] = useState('');
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
  const [topicError, setTopicError] = useState('');

  // 7. Bulk Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTargetExam, setImportTargetExam] = useState<string | undefined>(undefined);
  const [importTargetMock, setImportTargetMock] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchExams();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchExams = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/exams');
      if (!res.ok) {
        throw new Error('Failed to fetch exams.');
      }
      const data = await res.json();
      setExams(data.exams || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading exams.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveNewOrder = async (orderedSlugs: string[], successMsg: string) => {
    setIsSavingOrder(true);
    try {
      const res = await fetch('/api/admin/exams/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedSlugs }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order');
      }
      showToast(successMsg, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error updating order', 'error');
      fetchExams();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleReorderExam = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === exams.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newExams = [...exams];
    const [moved] = newExams.splice(index, 1);
    newExams.splice(targetIndex, 0, moved);

    setExams(newExams);
    await saveNewOrder(
      newExams.map((e) => e.slug),
      `Moved "${moved.name}" ${direction === 'up' ? 'higher' : 'lower'} to position #${targetIndex + 1}`
    );
  };

  const handlePinExamToTop = async (index: number) => {
    if (index === 0) return;
    const newExams = [...exams];
    const [moved] = newExams.splice(index, 1);
    newExams.unshift(moved);

    setExams(newExams);
    await saveNewOrder(
      newExams.map((e) => e.slug),
      `Pinned "${moved.name}" to Top (#1 display position)`
    );
  };

  const fetchSubjectsForExam = async (examId: string) => {
    setLoadingSubjects((prev) => ({ ...prev, [examId]: true }));
    try {
      const res = await fetch(`/api/admin/subjects?examId=${encodeURIComponent(examId)}`);
      if (res.ok) {
        const data = await res.json();
        setExamSubjects((prev) => ({ ...prev, [examId]: data.subjects || [] }));
      }
    } catch (err) {
      console.warn('Failed to fetch subjects for exam:', err);
    } finally {
      setLoadingSubjects((prev) => ({ ...prev, [examId]: false }));
    }
  };

  const toggleExpandExam = (exam: ExamItem) => {
    const isExpanding = expandedExamId !== exam.id;
    setExpandedExamId(isExpanding ? exam.id : null);
    if (isExpanding) {
      if (!examActiveTab[exam.id]) {
        setExamActiveTab((prev) => ({ ...prev, [exam.id]: 'mocks' }));
      }
      fetchSubjectsForExam(exam.id);
    }
  };

  // ==========================================
  // EXAM HANDLERS
  // ==========================================

  const openAddExam = () => {
    setNewName('');
    setNewSlug('');
    setNewCategory('HP Exams');
    setNewDesc('');
    setNewQuestions('90');
    setNewDuration('60');
    setNewPrice('1');
    setNewNegMark('0.25');
    setNewMarksPerQ('1.0');
    setAddExamError('');
    setIsAddExamOpen(true);
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const dur = Number(newDuration);
    if (isNaN(dur) || dur < 1 || dur > 300) {
      setAddExamError('Duration must be between 1 and 300 minutes.');
      return;
    }
    const nm = Number(newNegMark);
    if (isNaN(nm) || nm < 0 || nm > 5) {
      setAddExamError('Negative marking must be between 0 and 5.');
      return;
    }
    const mpq = Number(newMarksPerQ);
    if (isNaN(mpq) || mpq <= 0) {
      setAddExamError('Marks per question must be greater than 0.');
      return;
    }

    setIsSubmittingAddExam(true);
    setAddExamError('');

    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          slug: newSlug.trim() || undefined,
          category: newCategory,
          description: newDesc,
          totalQuestions: Number(newQuestions),
          durationMinutes: dur,
          price: Number(newPrice),
          negativeMarking: nm,
          marksPerQuestion: mpq,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create exam.');
      }

      setExams((prev) => [data.exam, ...prev]);
      showToast(`Exam "${data.exam.name}" created successfully!`);
      setIsAddExamOpen(false);
    } catch (err: any) {
      setAddExamError(err.message || 'Error creating exam.');
    } finally {
      setIsSubmittingAddExam(false);
    }
  };

  const openEditExam = (exam: ExamItem) => {
    setEditingExam(exam);
    setEditName(exam.name);
    setEditSlug(exam.slug);
    setEditCategory(exam.category);
    setEditDesc(exam.description || '');
    setEditQuestions(String(exam.totalQuestions));
    setEditDuration(String(exam.durationMinutes));
    setEditPrice(String(exam.price === 199 || exam.price === 149 ? 1 : exam.price));
    setEditNegMark(String(exam.negativeMarking));
    setEditMarksPerQ(String(exam.marksPerQuestion));
    setEditArchived(exam.isArchived);
    setEditExamError('');
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;

    const dur = Number(editDuration);
    if (isNaN(dur) || dur < 1 || dur > 300) {
      setEditExamError('Duration must be between 1 and 300 minutes.');
      return;
    }
    const nm = Number(editNegMark);
    if (isNaN(nm) || nm < 0 || nm > 5) {
      setEditExamError('Negative marking must be between 0 and 5.');
      return;
    }
    const mpq = Number(editMarksPerQ);
    if (isNaN(mpq) || mpq <= 0) {
      setEditExamError('Marks per question must be greater than 0.');
      return;
    }

    setIsSubmittingEditExam(true);
    setEditExamError('');

    try {
      const res = await fetch(`/api/admin/exams/${editingExam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
          category: editCategory,
          description: editDesc,
          totalQuestions: Number(editQuestions),
          durationMinutes: dur,
          price: Number(editPrice),
          negativeMarking: nm,
          marksPerQuestion: mpq,
          isArchived: editArchived,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update exam.');
      }

      setExams((prev) =>
        prev.map((ex) => (ex.id === editingExam.id ? { ...ex, ...data.exam } : ex))
      );

      showToast(`Exam "${data.exam.name}" updated successfully!`);
      setEditingExam(null);
    } catch (err: any) {
      setEditExamError(err.message || 'Error updating exam.');
    } finally {
      setIsSubmittingEditExam(false);
    }
  };

  // ==========================================
  // MOCK TEST HANDLERS
  // ==========================================

  const openAddMock = (exam: ExamItem) => {
    setAddMockExam(exam);
    const existingCount = exam.mockTests?.length || 0;
    setAddMockNumber(String(existingCount + 1));
    setAddMockTitle(`${exam.name} Mock ${existingCount + 1}`);
    setAddMockFree(existingCount === 0);
    setAddMockPublished(false);
    setAddMockDuration('');
    setAddMockNegMark('');
    setAddMockMarksPerQ('');
    setAddMockError('');
  };

  const handleCreateMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMockExam) return;

    setIsSubmittingAddMock(true);
    setAddMockError('');

    try {
      const res = await fetch('/api/admin/mock-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: addMockExam.id,
          testNumber: Number(addMockNumber),
          name: addMockTitle,
          isFree: addMockFree,
          isPublished: addMockPublished,
          durationOverride: addMockDuration.trim() ? Number(addMockDuration) : null,
          negativeMarksOverride: addMockNegMark.trim() ? Number(addMockNegMark) : null,
          marksOverride: addMockMarksPerQ.trim() ? Number(addMockMarksPerQ) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create mock test.');
      }

      await fetchExams();
      showToast(`Mock test "${data.mockTest.name}" created successfully!`);
      setAddMockExam(null);
    } catch (err: any) {
      setAddMockError(err.message || 'Error creating mock test.');
    } finally {
      setIsSubmittingAddMock(false);
    }
  };

  const handleCreateMocksShortcut = async (exam: ExamItem) => {
    if (!confirm(`Generate missing mock tests 1 through 10 for "${exam.name}"?`)) return;

    try {
      const res = await fetch('/api/admin/mock-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-1-to-10',
          examId: exam.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create mock tests.');
      }

      await fetchExams();
      showToast(data.message || 'Mocks 1-10 created successfully!');
    } catch (err: any) {
      showToast(err.message || 'Error creating mock tests.', 'error');
    }
  };

  const openEditTest = (test: MockTestItem, exam: ExamItem) => {
    setEditingTest({ test, exam });
    setEditTestName(test.name);
    setEditTestFree(test.isFree);
    setEditTestPublished(test.isPublished);
    setEditTestDuration(test.durationOverride !== null && test.durationOverride !== undefined ? String(test.durationOverride) : '');
    setEditTestNegMark(test.negativeMarksOverride !== null && test.negativeMarksOverride !== undefined ? String(test.negativeMarksOverride) : '');
    setEditTestMarksPerQ(test.marksOverride !== null && test.marksOverride !== undefined ? String(test.marksOverride) : '');
    setEditMockError('');
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;

    setIsSubmittingEditMock(true);
    setEditMockError('');

    try {
      const res = await fetch(`/api/admin/mock-tests/${editingTest.test.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTestName,
          isFree: editTestFree,
          isPublished: editTestPublished,
          durationOverride: editTestDuration.trim() ? Number(editTestDuration) : null,
          negativeMarksOverride: editTestNegMark.trim() ? Number(editTestNegMark) : null,
          marksOverride: editTestMarksPerQ.trim() ? Number(editTestMarksPerQ) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update mock test.');
      }

      await fetchExams();
      showToast(`Mock test "${data.mockTest.name}" updated successfully!`);
      setEditingTest(null);
    } catch (err: any) {
      setEditMockError(err.message || 'Error updating mock test.');
    } finally {
      setIsSubmittingEditMock(false);
    }
  };

  const handleDeleteTest = async (test: MockTestItem, exam: ExamItem) => {
    if (!confirm(`Delete "${test.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/mock-tests/${test.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete mock test.');
      }

      await fetchExams();
      showToast(data.message || 'Mock test deleted successfully!');
    } catch (err: any) {
      showToast(err.message || 'Cannot delete mock test.', 'error');
    }
  };

  // ==========================================
  // SUBJECTS & TOPICS HANDLERS
  // ==========================================

  const openAddSubject = (exam: ExamItem) => {
    setSubjectModalExam(exam);
    setEditingSubject(null);
    setSubjName('');
    setSubjNameHi('');
    setSubjInitialTopics('');
    setSubjectError('');
  };

  const openEditSubject = (subject: SubjectItem, exam: ExamItem) => {
    setSubjectModalExam(exam);
    setEditingSubject(subject);
    setSubjName(subject.name);
    setSubjNameHi(subject.nameHi || '');
    setSubjInitialTopics('');
    setSubjectError('');
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectModalExam) return;

    setIsSubmittingSubject(true);
    setSubjectError('');

    try {
      if (editingSubject) {
        // Edit Subject
        const res = await fetch(`/api/admin/subjects/${editingSubject.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subjName,
            nameHi: subjNameHi.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update subject.');
        showToast(`Subject "${subjName}" updated!`);
      } else {
        // Add Subject
        const topicsList = subjInitialTopics
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);

        const res = await fetch('/api/admin/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId: subjectModalExam.id,
            name: subjName,
            nameHi: subjNameHi.trim() || null,
            topicNames: topicsList,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create subject.');
        showToast(`Subject "${subjName}" created!`);
      }

      await fetchSubjectsForExam(subjectModalExam.id);
      setSubjectModalExam(null);
      setEditingSubject(null);
    } catch (err: any) {
      setSubjectError(err.message || 'Error saving subject.');
    } finally {
      setIsSubmittingSubject(false);
    }
  };

  const handleDeleteSubject = async (subject: SubjectItem, exam: ExamItem) => {
    if (!confirm(`Delete subject "${subject.name}"? It will be blocked if questions are linked.`)) return;

    try {
      const res = await fetch(`/api/admin/subjects/${subject.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete subject.');

      await fetchSubjectsForExam(exam.id);
      showToast(data.message || 'Subject deleted!');
    } catch (err: any) {
      showToast(err.message || 'Cannot delete subject.', 'error');
    }
  };

  const openAddTopic = (subject: SubjectItem) => {
    setTopicModalSubject(subject);
    setEditingTopic(null);
    setTopicName('');
    setTopicNameHi('');
    setTopicError('');
  };

  const openEditTopic = (topic: TopicItem, subject: SubjectItem) => {
    setTopicModalSubject(subject);
    setEditingTopic(topic);
    setTopicName(topic.name);
    setTopicNameHi(topic.nameHi || '');
    setTopicError('');
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicModalSubject) return;

    setIsSubmittingTopic(true);
    setTopicError('');

    try {
      if (editingTopic) {
        // Edit Topic
        const res = await fetch(`/api/admin/topics/${editingTopic.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: topicName,
            nameHi: topicNameHi.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update topic.');
        showToast(`Topic "${topicName}" updated!`);
      } else {
        // Add Topic
        const res = await fetch('/api/admin/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add-topic',
            subjectId: topicModalSubject.id,
            name: topicName,
            nameHi: topicNameHi.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create topic.');
        showToast(`Topic "${topicName}" created!`);
      }

      await fetchSubjectsForExam(topicModalSubject.examId);
      setTopicModalSubject(null);
      setEditingTopic(null);
    } catch (err: any) {
      setTopicError(err.message || 'Error saving topic.');
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  const handleDeleteTopic = async (topic: TopicItem, subject: SubjectItem) => {
    if (!confirm(`Delete topic "${topic.name}"? It will be blocked if questions are linked.`)) return;

    try {
      const res = await fetch(`/api/admin/topics/${topic.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete topic.');

      await fetchSubjectsForExam(subject.examId);
      showToast(data.message || 'Topic deleted!');
    } catch (err: any) {
      showToast(err.message || 'Cannot delete topic.', 'error');
    }
  };

  return (
    <div>
      {/* Toast Notification */}
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

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Exams & Mock Tests Management</h1>
          <p className={styles.pageSubtitle}>
            Configure exams, mock series, subjects & scoring rules. Changes reflect in real-time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <Button
            variant="outline"
            size="md"
            leftIcon={<Upload size={16} />}
            onClick={() => {
              setImportTargetExam(undefined);
              setImportTargetMock(undefined);
              setImportModalOpen(true);
            }}
          >
            Import Questions
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={openAddExam}
          >
            Add New Exam Series
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#F87171',
            marginBottom: '1.5rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Loading exams from PostgreSQL database...
        </div>
      ) : exams.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--color-bg-primary)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          <Layers size={40} color="#F5B301" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Exam Series Found</h3>
          <Button variant="primary" size="md" onClick={openAddExam}>
            Add New Exam Series
          </Button>
        </div>
      ) : (
        <div className={styles.adminTableWrapper}>
          <div
            style={{
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '0.85rem 1.25rem',
              background: 'rgba(245, 179, 1, 0.08)',
              border: '1px solid rgba(245, 179, 1, 0.25)',
              borderRadius: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pin size={18} color="#F5B301" />
              <span style={{ fontSize: '0.85rem', color: '#FCD34D' }}>
                <strong>Display Priority:</strong> The order below directly controls how mock test bundles appear on the <strong>Homepage</strong> and <strong>/exams</strong>. Pin upcoming exams (HP Police Constable, Patwari) to #1 so students see them first.
              </span>
            </div>
            {isSavingOrder && (
              <span style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 600 }}>
                Saving new order...
              </span>
            )}
          </div>

          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th style={{ width: '120px', textAlign: 'center' }}>Display Order</th>
                <th>Exam Series</th>
                <th>Category</th>
                <th>Questions</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Default Marks</th>
                <th>Status</th>
                <th>Manage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, index) => {
                const isExpanded = expandedExamId === exam.id;
                const testCount = exam.mockTests?.length ?? exam._count?.mockTests ?? 0;
                const currentTab = examActiveTab[exam.id] || 'mocks';
                const subjectsList = examSubjects[exam.id] || [];

                return (
                  <React.Fragment key={exam.id}>
                    <tr>
                      <td data-label="Display Order" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              background: index === 0 ? '#F5B301' : 'rgba(255, 255, 255, 0.08)',
                              color: index === 0 ? '#0F172A' : '#94A3B8',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {index === 0 ? '★ #1 TOP' : `#${index + 1}`}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <button
                              type="button"
                              title="Move exam higher"
                              disabled={index === 0 || isSavingOrder}
                              onClick={() => handleReorderExam(index, 'up')}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--color-border)',
                                color: index === 0 ? '#475569' : '#F5B301',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                padding: '0.2rem 0.35rem',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <ArrowUp size={13} />
                            </button>

                            <button
                              type="button"
                              title="Move exam lower"
                              disabled={index === exams.length - 1 || isSavingOrder}
                              onClick={() => handleReorderExam(index, 'down')}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--color-border)',
                                color: index === exams.length - 1 ? '#475569' : '#94A3B8',
                                cursor: index === exams.length - 1 ? 'not-allowed' : 'pointer',
                                padding: '0.2rem 0.35rem',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <ArrowDown size={13} />
                            </button>

                            {index > 0 && (
                              <button
                                type="button"
                                title="Pin to top (#1)"
                                disabled={isSavingOrder}
                                onClick={() => handlePinExamToTop(index)}
                                style={{
                                  background: 'rgba(245, 179, 1, 0.12)',
                                  border: '1px solid rgba(245, 179, 1, 0.4)',
                                  color: '#F5B301',
                                  cursor: 'pointer',
                                  padding: '0.2rem 0.4rem',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  gap: '2px',
                                }}
                              >
                                <Pin size={10} /> Top
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="Exam Series">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{exam.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            /{exam.slug}
                          </span>
                        </div>
                      </td>
                      <td data-label="Category">
                        <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{exam.category}</span>
                      </td>
                      <td data-label="Questions">
                        <span>{exam.totalQuestions} Q</span>
                      </td>
                      <td data-label="Duration">
                        <span>{exam.durationMinutes} mins</span>
                      </td>
                      <td data-label="Price">
                        <strong style={{ color: '#10B981' }}>₹{(exam.price === 199 || exam.price === 149 || !exam.price) ? 1 : exam.price}</strong>
                      </td>
                      <td data-label="Default Marks">
                        <span style={{ fontSize: '0.8rem', color: '#38BDF8' }}>
                          +{exam.marksPerQuestion} / -{exam.negativeMarking}
                        </span>
                      </td>
                      <td data-label="Status">
                        {exam.isArchived ? (
                          <Badge variant="warning" size="sm">
                            Archived (Hidden)
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Active (Public)
                          </Badge>
                        )}
                      </td>
                      <td data-label="Manage">
                        <button
                          type="button"
                          onClick={() => toggleExpandExam(exam)}
                          style={{
                            background: isExpanded ? 'rgba(245, 179, 1, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${isExpanded ? '#F5B301' : 'var(--color-border)'}`,
                            color: '#F5B301',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          <span>{testCount} Tests &bull; Subjects</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Edit3 size={13} />}
                            onClick={() => openEditExam(exam)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Upload size={13} />}
                            onClick={() => {
                              setImportTargetExam(exam.slug);
                              setImportTargetMock(undefined);
                              setImportModalOpen(true);
                            }}
                          >
                            Import
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Mock Tests & Subjects Sub-panel */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} style={{ padding: '0', background: 'rgba(15, 23, 42, 0.45)' }}>
                          <div style={{ padding: '1.25rem', borderLeft: '3px solid #F5B301' }}>
                            {/* Inner Sub-navigation Tabs */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => setExamActiveTab((prev) => ({ ...prev, [exam.id]: 'mocks' }))}
                                  style={{
                                    background: currentTab === 'mocks' ? 'rgba(245, 179, 1, 0.15)' : 'transparent',
                                    border: `1px solid ${currentTab === 'mocks' ? '#F5B301' : 'var(--color-border)'}`,
                                    color: currentTab === 'mocks' ? '#F5B301' : '#94A3B8',
                                    padding: '0.35rem 0.85rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.825rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  Mock Tests ({testCount})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExamActiveTab((prev) => ({ ...prev, [exam.id]: 'subjects' }))}
                                  style={{
                                    background: currentTab === 'subjects' ? 'rgba(245, 179, 1, 0.15)' : 'transparent',
                                    border: `1px solid ${currentTab === 'subjects' ? '#F5B301' : 'var(--color-border)'}`,
                                    color: currentTab === 'subjects' ? '#F5B301' : '#94A3B8',
                                    padding: '0.35rem 0.85rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.825rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  Subjects & Topics ({subjectsList.length})
                                </button>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {currentTab === 'mocks' ? (
                                  <>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleCreateMocksShortcut(exam)}
                                    >
                                      Create Mocks 1–10
                                    </Button>
                                    <Button
                                      variant="accent"
                                      size="sm"
                                      leftIcon={<Plus size={14} />}
                                      onClick={() => openAddMock(exam)}
                                    >
                                      Add Mock Test
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="accent"
                                    size="sm"
                                    leftIcon={<Plus size={14} />}
                                    onClick={() => openAddSubject(exam)}
                                  >
                                    Add Subject
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* SUB-TAB 1: MOCK TESTS */}
                            {currentTab === 'mocks' && (
                              <div>
                                {!exam.mockTests || exam.mockTests.length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--color-bg-primary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>
                                      No mock tests configured yet for {exam.name}.
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                      <Button variant="secondary" size="sm" onClick={() => handleCreateMocksShortcut(exam)}>
                                        Create Mocks 1–10 Shortcut
                                      </Button>
                                      <Button variant="primary" size="sm" onClick={() => openAddMock(exam)}>
                                        Add Mock Test 1
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {exam.mockTests.map((test) => (
                                      <div
                                        key={test.id}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          background: 'var(--color-bg-primary)',
                                          padding: '0.75rem 1rem',
                                          borderRadius: '8px',
                                          border: '1px solid var(--color-border)',
                                          flexWrap: 'wrap',
                                          gap: '0.5rem',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                                            #{test.testNumber} &bull; {test.name}
                                          </span>
                                          {test.isFree ? (
                                            <Badge variant="accent" size="sm">
                                              Free Starter
                                            </Badge>
                                          ) : (
                                            <Badge variant="neutral" size="sm">
                                              Paid
                                            </Badge>
                                          )}
                                          {test.isPublished ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#34D399', fontSize: '0.75rem', fontWeight: 600 }}>
                                              <Eye size={12} /> Published
                                            </span>
                                          ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>
                                              <EyeOff size={12} /> Draft
                                            </span>
                                          )}
                                          <span style={{ fontSize: '0.75rem', color: '#F5B301', fontWeight: 700 }}>
                                            {test._count?.questions ?? 0} Questions
                                          </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            <span>
                                              Dur:{' '}
                                              <strong style={{ color: '#fff' }}>
                                                {test.durationOverride ? `${test.durationOverride}m (ovr)` : `${exam.durationMinutes}m`}
                                              </strong>
                                            </span>
                                            <span style={{ margin: '0 0.35rem' }}>|</span>
                                            <span>
                                              Marks:{' '}
                                              <strong style={{ color: '#fff' }}>
                                                {test.marksOverride ? `+${test.marksOverride} (ovr)` : `+${exam.marksPerQuestion}`}
                                              </strong>
                                            </span>
                                            <span style={{ margin: '0 0.35rem' }}>|</span>
                                            <span>
                                              Neg:{' '}
                                              <strong style={{ color: '#fff' }}>
                                                {test.negativeMarksOverride ? `-${test.negativeMarksOverride} (ovr)` : `-${exam.negativeMarking}`}
                                              </strong>
                                            </span>
                                          </div>

                                          <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={<Upload size={12} />}
                                            onClick={() => {
                                              setImportTargetExam(exam.slug);
                                              setImportTargetMock(test.testNumber);
                                              setImportModalOpen(true);
                                            }}
                                          >
                                            Import
                                          </Button>

                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            leftIcon={<Edit3 size={12} />}
                                            onClick={() => openEditTest(test, exam)}
                                          >
                                            Edit
                                          </Button>

                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTest(test, exam)}
                                            style={{
                                              background: 'rgba(239, 68, 68, 0.1)',
                                              border: '1px solid rgba(239, 68, 68, 0.3)',
                                              color: '#F87171',
                                              padding: '0.35rem 0.5rem',
                                              borderRadius: '6px',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                            }}
                                            title="Delete Mock Test"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* SUB-TAB 2: SUBJECTS & TOPICS */}
                            {currentTab === 'subjects' && (
                              <div>
                                {loadingSubjects[exam.id] ? (
                                  <div style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8' }}>
                                    Loading subjects from database...
                                  </div>
                                ) : subjectsList.length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--color-bg-primary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>
                                      No subjects created yet for {exam.name}.
                                    </p>
                                    <Button variant="primary" size="sm" onClick={() => openAddSubject(exam)}>
                                      Add First Subject
                                    </Button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {subjectsList.map((subject) => (
                                      <div
                                        key={subject.id}
                                        style={{
                                          background: 'var(--color-bg-primary)',
                                          border: '1px solid var(--color-border)',
                                          borderRadius: '8px',
                                          padding: '0.85rem 1rem',
                                        }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                          <div>
                                            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
                                              {subject.name}
                                            </strong>
                                            {subject.nameHi && (
                                              <span style={{ fontSize: '0.8rem', color: '#94A3B8', marginLeft: '0.5rem' }}>
                                                ({subject.nameHi})
                                              </span>
                                            )}
                                            <span style={{ fontSize: '0.75rem', color: '#38BDF8', marginLeft: '0.5rem' }}>
                                              &bull; {subject._count?.questions ?? 0} Questions
                                            </span>
                                          </div>
                                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              leftIcon={<Plus size={12} />}
                                              onClick={() => openAddTopic(subject)}
                                            >
                                              Add Topic
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              leftIcon={<Edit3 size={12} />}
                                              onClick={() => openEditSubject(subject, exam)}
                                            >
                                              Edit
                                            </Button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteSubject(subject, exam)}
                                              style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#F87171',
                                                cursor: 'pointer',
                                                padding: '0.25rem',
                                              }}
                                              title="Delete Subject"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Topics List under this subject */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingLeft: '0.5rem' }}>
                                          {(!subject.topics || subject.topics.length === 0) ? (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                              No topics yet. Click &quot;Add Topic&quot;.
                                            </span>
                                          ) : (
                                            subject.topics.map((t) => (
                                              <span
                                                key={t.id}
                                                style={{
                                                  background: 'var(--color-bg-secondary)',
                                                  border: '1px solid var(--color-border)',
                                                  padding: '0.2rem 0.5rem',
                                                  borderRadius: '4px',
                                                  fontSize: '0.75rem',
                                                  color: '#E2E8F0',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '0.3rem',
                                                }}
                                              >
                                                <span>{t.name}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => openEditTopic(t, subject)}
                                                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                                                  title="Edit Topic"
                                                >
                                                  <Edit3 size={10} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteTopic(t, subject)}
                                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                                                  title="Delete Topic"
                                                >
                                                  <X size={10} />
                                                </button>
                                              </span>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. ADD EXAM MODAL                                            */}
      {/* ============================================================ */}
      {isAddExamOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsAddExamOpen(false)}>
          <div className={styles.drawerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Create New Exam Series</h3>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setIsAddExamOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExam} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className={styles.drawerBody}>
                {addExamError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', color: '#F87171', fontSize: '0.85rem' }}>
                    {addExamError}
                  </div>
                )}

                <Input
                  label="Exam Title"
                  placeholder="e.g. HP Patwari Examination 2026"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                    }
                  }}
                  required
                />

                <Input
                  label="URL Slug (Optional, auto-generated)"
                  placeholder="e.g. hp-patwari"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                />

                <Input
                  label="Category"
                  placeholder="e.g. State Revenue, Police Exams, Judicial"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                />

                <Input
                  label="Short Description"
                  placeholder="Comprehensive test series for HP aspirants..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="formGrid">
                  <Input
                    label="Questions Count"
                    type="number"
                    value={newQuestions}
                    onChange={(e) => setNewQuestions(e.target.value)}
                    required
                  />

                  <Input
                    label="Duration (Minutes: 1 - 300)"
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="formGrid">
                  <Input
                    label="Launch Price (₹)"
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                  />

                  <Input
                    label="Marks Per Question (> 0)"
                    type="number"
                    step="0.25"
                    value={newMarksPerQ}
                    onChange={(e) => setNewMarksPerQ(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Default Negative Marking (0 to 5)"
                  type="number"
                  step="0.05"
                  value={newNegMark}
                  onChange={(e) => setNewNegMark(e.target.value)}
                  required
                />
              </div>

              <div className={styles.drawerFooter}>
                <Button variant="secondary" size="md" type="button" onClick={() => setIsAddExamOpen(false)}>
                  Cancel
                </Button>
                <Button variant="accent" size="md" type="submit" disabled={isSubmittingAddExam}>
                  {isSubmittingAddExam ? 'Creating...' : 'Create Exam Series'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. EDIT EXAM DRAWER                                          */}
      {/* ============================================================ */}
      {editingExam && (
        <div className={styles.drawerOverlay} onClick={() => setEditingExam(null)}>
          <div className={styles.drawerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3 className={styles.drawerTitle}>Edit Exam Series</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  ID: {editingExam.id}
                </span>
              </div>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setEditingExam(null)}
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExam} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className={styles.drawerBody}>
                {editExamError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', color: '#F87171', fontSize: '0.85rem' }}>
                    {editExamError}
                  </div>
                )}

                <Input
                  label="Exam Name"
                  placeholder="e.g. HP Patwari Examination 2026"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />

                <Input
                  label="Slug (URL identifier)"
                  placeholder="e.g. hp-patwari"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  required
                />

                <Input
                  label="Category"
                  placeholder="e.g. Police Exams, State Revenue"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  required
                />

                <Input
                  label="Description"
                  placeholder="Description for students..."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="formGrid">
                  <Input
                    label="Total Questions"
                    type="number"
                    value={editQuestions}
                    onChange={(e) => setEditQuestions(e.target.value)}
                    required
                  />

                  <Input
                    label="Duration (Minutes: 1 - 300)"
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="formGrid">
                  <Input
                    label="Price (₹)"
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                  />

                  <Input
                    label="Default Marks Per Question (> 0)"
                    type="number"
                    step="0.25"
                    value={editMarksPerQ}
                    onChange={(e) => setEditMarksPerQ(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Default Negative Marking (0 to 5)"
                  type="number"
                  step="0.05"
                  value={editNegMark}
                  onChange={(e) => setEditNegMark(e.target.value)}
                  required
                />

                {/* Status Toggle (Active vs Archived) */}
                <div style={{ background: 'var(--color-bg-secondary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                    Exam Status
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', color: editArchived ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={editArchived}
                      onChange={(e) => setEditArchived(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#F59E0B' }}
                    />
                    <span>{editArchived ? 'Archived (Hidden from public site, data preserved)' : 'Active (Visible on public exam pages)'}</span>
                  </label>
                </div>
              </div>

              <div className={styles.drawerFooter}>
                <Button variant="secondary" size="md" type="button" onClick={() => setEditingExam(null)}>
                  Cancel
                </Button>
                <Button variant="accent" size="md" type="submit" disabled={isSubmittingEditExam}>
                  {isSubmittingEditExam ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. ADD MOCK TEST MODAL                                       */}
      {/* ============================================================ */}
      {addMockExam && (
        <div className={styles.drawerOverlay} onClick={() => setAddMockExam(null)}>
          <div className={styles.drawerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Add Mock Test to {addMockExam.name}</h3>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setAddMockExam(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMock} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className={styles.drawerBody}>
                {addMockError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', color: '#F87171', fontSize: '0.85rem' }}>
                    {addMockError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }} className="formGrid">
                  <Input
                    label="Test Number"
                    type="number"
                    value={addMockNumber}
                    onChange={(e) => {
                      setAddMockNumber(e.target.value);
                      setAddMockTitle(`${addMockExam.name} Mock ${e.target.value}`);
                    }}
                    required
                  />

                  <Input
                    label="Test Title"
                    value={addMockTitle}
                    onChange={(e) => setAddMockTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="formGrid">
                  <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.35rem' }}>
                      Pricing
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={addMockFree}
                        onChange={(e) => setAddMockFree(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                      />
                      <span style={{ color: addMockFree ? '#34D399' : '#94A3B8', fontWeight: 600 }}>
                        {addMockFree ? 'Free Starter Test' : 'Paid Test (Bundle)'}
                      </span>
                    </label>
                  </div>

                  <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.35rem' }}>
                      Publishing State
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={addMockPublished}
                        onChange={(e) => setAddMockPublished(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                      />
                      <span style={{ color: addMockPublished ? '#34D399' : '#94A3B8', fontWeight: 600 }}>
                        {addMockPublished ? 'Published' : 'Draft (Unpublished)'}
                      </span>
                    </label>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#F5B301', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
                    Optional Overrides (Leave blank to inherit exam default):
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <Input
                      label={`Duration Override (Exam default: ${addMockExam.durationMinutes}m)`}
                      placeholder="Leave blank to inherit default"
                      type="number"
                      value={addMockDuration}
                      onChange={(e) => setAddMockDuration(e.target.value)}
                    />

                    <Input
                      label={`Negative Marking Override (Exam default: ${addMockExam.negativeMarking})`}
                      placeholder="Leave blank to inherit default"
                      type="number"
                      step="0.05"
                      value={addMockNegMark}
                      onChange={(e) => setAddMockNegMark(e.target.value)}
                    />

                    <Input
                      label={`Marks Per Question Override (Exam default: ${addMockExam.marksPerQuestion})`}
                      placeholder="Leave blank to inherit default"
                      type="number"
                      step="0.25"
                      value={addMockMarksPerQ}
                      onChange={(e) => setAddMockMarksPerQ(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.drawerFooter}>
                <Button variant="secondary" size="md" type="button" onClick={() => setAddMockExam(null)}>
                  Cancel
                </Button>
                <Button variant="accent" size="md" type="submit" disabled={isSubmittingAddMock}>
                  {isSubmittingAddMock ? 'Creating...' : 'Create Mock Test'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. EDIT MOCK TEST DRAWER / MODAL                             */}
      {/* ============================================================ */}
      {editingTest && (
        <div className={styles.drawerOverlay} onClick={() => setEditingTest(null)}>
          <div className={styles.drawerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3 className={styles.drawerTitle}>Configure Mock Test #{editingTest.test.testNumber}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  {editingTest.exam.name}
                </span>
              </div>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setEditingTest(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTest} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className={styles.drawerBody}>
                {editMockError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', color: '#F87171', fontSize: '0.85rem' }}>
                    {editMockError}
                  </div>
                )}

                <Input
                  label="Test Title"
                  value={editTestName}
                  onChange={(e) => setEditTestName(e.target.value)}
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="formGrid">
                  <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.35rem' }}>
                      Pricing
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={editTestFree}
                        onChange={(e) => setEditTestFree(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                      />
                      <span style={{ color: editTestFree ? '#34D399' : '#94A3B8', fontWeight: 600 }}>
                        {editTestFree ? 'Free Starter Test' : 'Paid Test (Bundle)'}
                      </span>
                    </label>
                  </div>

                  <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.35rem' }}>
                      Publishing State
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={editTestPublished}
                        onChange={(e) => setEditTestPublished(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                      />
                      <span style={{ color: editTestPublished ? '#34D399' : '#94A3B8', fontWeight: 600 }}>
                        {editTestPublished ? 'Published to Students' : 'Draft (Unpublished)'}
                      </span>
                    </label>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#F5B301', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
                    Optional Overrides (Leave blank to inherit exam defaults):
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <Input
                      label={`Duration Override (Default: ${editingTest.exam.durationMinutes}m)`}
                      placeholder={`Leave blank to inherit ${editingTest.exam.durationMinutes} mins`}
                      type="number"
                      value={editTestDuration}
                      onChange={(e) => setEditTestDuration(e.target.value)}
                    />

                    <Input
                      label={`Negative Marking Override (Default: ${editingTest.exam.negativeMarking})`}
                      placeholder={`Leave blank to inherit ${editingTest.exam.negativeMarking}`}
                      type="number"
                      step="0.05"
                      value={editTestNegMark}
                      onChange={(e) => setEditTestNegMark(e.target.value)}
                    />

                    <Input
                      label={`Marks Per Question Override (Default: ${editingTest.exam.marksPerQuestion})`}
                      placeholder={`Leave blank to inherit ${editingTest.exam.marksPerQuestion}`}
                      type="number"
                      step="0.25"
                      value={editTestMarksPerQ}
                      onChange={(e) => setEditTestMarksPerQ(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.drawerFooter}>
                <Button variant="secondary" size="md" type="button" onClick={() => setEditingTest(null)}>
                  Cancel
                </Button>
                <Button variant="accent" size="md" type="submit" disabled={isSubmittingEditMock}>
                  {isSubmittingEditMock ? 'Saving...' : 'Save Test Settings'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. ADD / EDIT SUBJECT MODAL                                  */}
      {/* ============================================================ */}
      {subjectModalExam && (
        <div className={styles.drawerOverlay} onClick={() => setSubjectModalExam(null)}>
          <div className={styles.drawerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>
                {editingSubject ? `Edit Subject: ${editingSubject.name}` : `Add Subject to ${subjectModalExam.name}`}
              </h3>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setSubjectModalExam(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className={styles.drawerBody}>
                {subjectError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', color: '#F87171', fontSize: '0.85rem' }}>
                    {subjectError}
                  </div>
                )}

                <Input
                  label="Subject Name (English)"
                  placeholder="e.g. General Awareness, Hindi Language"
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                  required
                />

                <Input
                  label="Subject Name (Hindi, Optional)"
                  placeholder="e.g. सामान्य ज्ञान, हिन्दी भाषा"
                  value={subjNameHi}
                  onChange={(e) => setSubjNameHi(e.target.value)}
                />

                {!editingSubject && (
                  <Input
                    label="Initial Topics (Comma-separated, Optional)"
                    placeholder="e.g. Geography of HP, Rivers & Lakes, History"
                    value={subjInitialTopics}
                    onChange={(e) => setSubjInitialTopics(e.target.value)}
                  />
                )}
              </div>

              <div className={styles.drawerFooter}>
                <Button variant="secondary" size="md" type="button" onClick={() => setSubjectModalExam(null)}>
                  Cancel
                </Button>
                <Button variant="accent" size="md" type="submit" disabled={isSubmittingSubject}>
                  {isSubmittingSubject ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. ADD / EDIT TOPIC MODAL                                    */}
      {/* ============================================================ */}
      {topicModalSubject && (
        <div className={styles.drawerOverlay} onClick={() => setTopicModalSubject(null)}>
          <div className={styles.drawerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>
                {editingTopic ? `Edit Topic: ${editingTopic.name}` : `Add Topic to "${topicModalSubject.name}"`}
              </h3>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setTopicModalSubject(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className={styles.drawerBody}>
                {topicError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', color: '#F87171', fontSize: '0.85rem' }}>
                    {topicError}
                  </div>
                )}

                <Input
                  label="Topic Name (English)"
                  placeholder="e.g. Geography of HP"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  required
                />

                <Input
                  label="Topic Name (Hindi, Optional)"
                  placeholder="e.g. हिमाचल का भूगोल"
                  value={topicNameHi}
                  onChange={(e) => setTopicNameHi(e.target.value)}
                />
              </div>

              <div className={styles.drawerFooter}>
                <Button variant="secondary" size="md" type="button" onClick={() => setTopicModalSubject(null)}>
                  Cancel
                </Button>
                <Button variant="accent" size="md" type="submit" disabled={isSubmittingTopic}>
                  {isSubmittingTopic ? 'Saving...' : editingTopic ? 'Update Topic' : 'Add Topic'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. REUSABLE CSV / EXCEL BULK IMPORTER MODAL                  */}
      {/* ============================================================ */}
      <AdminImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        defaultExamSlug={importTargetExam}
        defaultMockNumber={importTargetMock}
        onSuccess={() => {
          fetchExams();
          showToast('Import completed successfully!');
        }}
      />
    </div>
  );
}
