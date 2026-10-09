'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Archive, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { POPULAR_EXAMS, MockExam } from '@/lib/mock-data';
import styles from '../admin.module.css';

export default function AdminExamsPage() {
  const [exams, setExams] = useState<MockExam[]>(POPULAR_EXAMS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('149');

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName) return;

    const newExam: MockExam = {
      id: `exam-${Date.now()}`,
      name: newExamName,
      slug: newExamName.toLowerCase().replace(/\s+/g, '-'),
      description: `Newly published mock series for ${newExamName}.`,
      totalQuestions: 90,
      durationMinutes: 60,
      difficulty: 'MEDIUM',
      price: parseFloat(newPrice) || 149,
      originalPrice: 499,
      isPopular: false,
      category: newCategory || 'Police Exams',
      totalMocks: 10,
      freeMocks: 1,
      subjects: [
        { id: 'sub-1', name: 'General Knowledge', nameHi: 'सामान्य ज्ञान', questionCount: 25 },
        { id: 'sub-2', name: 'Language', nameHi: 'भाषा', questionCount: 25 },
      ],
    };

    setExams([newExam, ...exams]);
    setIsModalOpen(false);
    setNewExamName('');
    setNewCategory('');
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Exams Management</h1>
          <p className={styles.pageSubtitle}>
            Create, edit, price, and archive government exam test series.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsModalOpen(true)}
        >
          Add New Exam Series
        </Button>
      </div>

      <div className={styles.adminTableWrapper}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Category</th>
              <th>Questions</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td>
                  <strong>{exam.name}</strong>
                </td>
                <td>{exam.category}</td>
                <td>{exam.totalQuestions} Q</td>
                <td>{exam.durationMinutes} mins</td>
                <td>₹{exam.price}</td>
                <td>
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Exam Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Exam Series"
      >
        <form onSubmit={handleAddExam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Exam Title"
            placeholder="e.g. HP Police Sub-Inspector 2026"
            value={newExamName}
            onChange={(e) => setNewExamName(e.target.value)}
            required
          />

          <Input
            label="Category"
            placeholder="e.g. Police Exams, State Revenue"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            required
          />

          <Input
            label="Launch Price (₹)"
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="md" type="submit">
              Publish Exam
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
