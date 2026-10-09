'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import ExamCard from '@/components/exam/ExamCard';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { POPULAR_EXAMS } from '@/lib/mock-data';
import styles from './page.module.css';

export default function ExamsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(POPULAR_EXAMS.map((e) => e.category))];
    return cats;
  }, []);

  const filteredExams = useMemo(() => {
    return POPULAR_EXAMS.filter((exam) => {
      const matchesSearch =
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'All' || exam.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.headerBadge}>
          <Badge variant="primary" size="md">
            Exam Directory
          </Badge>
        </div>
        <h1 className={styles.title}>All Government & Police Mock Tests</h1>
        <p className={styles.subtitle}>
          Practice with realistic full-length test series. Every exam includes at least 1 free
          mock test with bilingual questions and full step-by-step explanations.
        </p>

        {/* Search & Filters */}
        <div className={styles.filterControls}>
          <div className={styles.searchBox}>
            <Input
              type="text"
              placeholder="Search by exam name (e.g. HP Police, Patwari, SSC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>

          <div className={styles.categoryPills}>
            <div className={styles.filterLabel}>
              <Filter size={14} />
              <span>Category:</span>
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.catButton} ${
                  selectedCategory === cat ? styles.catButtonActive : ''
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Exam Grid */}
      {filteredExams.length > 0 ? (
        <div className={styles.examGrid}>
          {filteredExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <BookOpen size={40} />
          </div>
          <h3 className={styles.emptyTitle}>No matching exams found</h3>
          <p className={styles.emptyDesc}>
            We couldn&apos;t find any exams matching &quot;{searchQuery}&quot;. Try adjusting your
            search keyword or category filter.
          </p>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
