'use client';

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { BookOpenIcon } from '@/components/v2/Icons';
import { ExamSeriesCard, UnderlineTabs, SearchInput } from '@/components/v2';
import AuthModal, { AuthModalTab } from '@/components/ui/AuthModal';
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
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('signup');
  const [authCallbackUrl, setAuthCallbackUrl] = useState('/exams');

  // Format categories as UnderlineTabs
  const tabs = useMemo(() => {
    return categories.map((cat) => ({
      id: cat,
      label: cat,
    }));
  }, [categories]);

  // Filter exams by tab and search
  const filteredExams = useMemo(() => {
    return initialExams.filter((item) => {
      const name = item.isComingSoon ? item.name : item.exam.name;
      const description = item.isComingSoon ? item.description : item.exam.description;
      const category = item.isComingSoon ? item.category : item.exam.category;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'All' ||
        category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [initialExams, searchQuery, selectedCategory]);

  const handleGuestFreeMock = (testUrl: string) => {
    setAuthCallbackUrl(testUrl);
    setAuthModalTab('signup');
    setAuthModalOpen(true);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>All HP Government Exam Mock Tests</h1>
        <p className={styles.subtitle}>Every exam includes 1 free sample mock</p>
      </header>

      {/* Search & Category Filter Controls */}
      <div className={styles.controlsWrap}>
        <div className={styles.searchCenter}>
          <SearchInput
            placeholder="Search by exam name (e.g. HP Police, Patwari)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search all exams"
          />
        </div>

        <UnderlineTabs
          tabs={tabs}
          activeTab={selectedCategory}
          onChange={(tabId) => setSelectedCategory(tabId)}
          ariaLabel="Exam categories"
        />
      </div>

      {/* Exam Cards Grid */}
      {filteredExams.length > 0 ? (
        <div className={styles.examGrid}>
          {filteredExams.map((item, index) => {
            if (item.isComingSoon) {
              return (
                <ExamSeriesCard
                  key={item.slug}
                  isComingSoon={true}
                  name={item.name}
                  category={item.category}
                  slug={item.slug}
                  index={index}
                />
              );
            }

            return (
              <ExamSeriesCard
                key={item.exam.id || item.exam.slug}
                isComingSoon={false}
                name={item.exam.name}
                category={item.exam.category}
                slug={item.exam.slug}
                totalQuestions={item.exam.totalQuestions}
                durationMinutes={item.exam.durationMinutes}
                price={item.exam.price}
                originalPrice={item.exam.originalPrice || 149}
                freeMockId={item.freeMockId}
                isLoggedIn={isLoggedIn}
                onTryFreeMock={handleGuestFreeMock}
                index={index}
              />
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <BookOpenIcon size={28} />
          </span>
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
        initialTab={authModalTab}
        callbackUrl={authCallbackUrl}
      />
    </div>
  );
}
