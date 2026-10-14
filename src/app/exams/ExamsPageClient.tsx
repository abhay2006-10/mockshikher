'use client';

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Filter, BookOpen } from 'lucide-react';
import ExamCard from '@/components/exam/ExamCard';
import ComingSoonExamCard from '@/components/exam/ComingSoonExamCard';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import AuthModal from '@/components/ui/AuthModal';
import type { MockExam } from '@/lib/mock-data';
import styles from './page.module.css';

export type ExamItem =
  | {
      isComingSoon: true;
      slug: string;
      name: string;
      description: string;
      category: string;
    }
  | {
      isComingSoon: false;
      exam: MockExam;
      freeMockId: string;
    };

interface ExamsPageClientProps {
  initialExams: ExamItem[];
  categories: string[];
}

export default function ExamsPageClient({ initialExams, categories }: ExamsPageClientProps) {
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authCallbackUrl, setAuthCallbackUrl] = useState('/exams');

  const filteredExams = useMemo(() => {
    return initialExams.filter((item) => {
      const name = item.isComingSoon ? item.name : item.exam.name;
      const description = item.isComingSoon ? item.description : item.exam.description;
      const category = item.isComingSoon ? item.category : item.exam.category;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        name.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'All' || category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [initialExams, searchQuery, selectedCategory]);

  const handleGuestFreeMock = (testUrl: string) => {
    setAuthCallbackUrl(testUrl);
    setAuthModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>All HP Government Exam Mock Tests</h1>
        <p className={styles.subtitle}>
          Every exam includes 1 free sample mock
        </p>

        {/* Search & Category Filter */}
        <div className={styles.filterControls}>
          <div className={styles.searchBox}>
            <Input
              type="text"
              placeholder="Search by exam name (e.g. HP Police, Patwari)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>

          <div className={styles.categoryPillsRow}>
            <div className={styles.filterLabel}>
              <Filter size={13} />
              <span>Category:</span>
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.catButton} ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? styles.catButtonActive
                    : ''
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Exam Cards Grid */}
      {filteredExams.length > 0 ? (
        <div className={styles.examGrid}>
          {filteredExams.map((item) => {
            if (item.isComingSoon) {
              return (
                <ComingSoonExamCard
                  key={item.slug}
                  name={item.name}
                  description={item.description}
                  category={item.category}
                />
              );
            }

            return (
              <ExamCard
                key={item.exam.id || item.exam.slug}
                exam={item.exam}
                freeMockId={item.freeMockId}
                isLoggedIn={isLoggedIn}
                onTryFreeMock={handleGuestFreeMock}
              />
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <BookOpen size={36} />
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

      {/* Auth Modal for Guests */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="login"
        callbackUrl={authCallbackUrl}
      />
    </div>
  );
}
