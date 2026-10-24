import React from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import type { MockExam } from '@/lib/mock-data';
import styles from './ExamCard.module.css';

interface ExamCardProps {
  exam: MockExam;
  freeMockId?: string;
  isLoggedIn?: boolean;
  onTryFreeMock?: (testUrl: string) => void;
}

export function ExamCard({
  exam,
  freeMockId,
  isLoggedIn = false,
  onTryFreeMock,
}: ExamCardProps) {
  const freeMockUrl = `/test/${freeMockId || `${exam.slug}-mock-1`}/instructions`;

  const canonicalSubjects = React.useMemo(() => {
    if (exam.slug?.includes('patwari')) {
      return ['Hindi', 'English', 'Mathematics', 'General Knowledge', 'Reasoning'];
    }
    if (exam.slug?.includes('police')) {
      return ['English', 'Hindi', 'Mathematics', 'GK & HP GK', 'Reasoning'];
    }
    if (exam.slug?.includes('process-server')) {
      return ['HP & National GK', 'Mathematics', 'General Science', 'English & Hindi', 'Reasoning'];
    }
    if (exam.slug?.includes('clerk')) {
      return ['HP & National GK', 'Computers & IT', 'Reasoning Ability'];
    }
    if (exam.subjects && exam.subjects.length > 0) {
      const unique = Array.from(new Set(exam.subjects.map((s) => s.name)));
      return unique.slice(0, 5);
    }
    return ['English', 'Mathematics', 'Hindi', 'General Knowledge', 'Reasoning'];
  }, [exam.slug, exam.subjects]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.categoryBadge}>
          <Badge variant="neutral" size="sm">
            {exam.category}
          </Badge>
        </div>
        <h3 className={styles.title}>{exam.name}</h3>
        <p className={styles.description}>{exam.description}</p>
      </div>

      <div className={styles.metaLine}>
        {exam.totalQuestions || 90} Q • {exam.durationMinutes || 60} Min • {exam.totalMocks || 10} Mocks
      </div>

      <div className={styles.subjectTags}>
        {canonicalSubjects.map((subName) => (
          <span key={subName} className={styles.subjectTag}>
            {subName}
          </span>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.offerBadge}>
          <span className={styles.fireIcon}>⚡</span>
          <span>Limited Time Launch Offer</span>
        </div>

        <div className={styles.priceLine}>
          <div className={styles.priceWrap}>
            <span className={styles.currentPrice}>₹{(exam.price === 199 || exam.price === 149 || !exam.price) ? 1 : exam.price}</span>
            <span className={styles.originalPrice}>₹{exam.originalPrice || 149}</span>
            <span className={styles.discountBadge}>99% OFF</span>
          </div>
          <span className={styles.validityText}>1 Year Validity</span>
        </div>

        <div className={styles.buttonRow}>
          {isLoggedIn ? (
            <Link href={freeMockUrl} className={styles.primaryBtn}>
              Try Free Mock
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onTryFreeMock ? onTryFreeMock(freeMockUrl) : undefined}
              className={styles.primaryBtn}
            >
              Try Free Mock
            </button>
          )}

          <Link href={`/exams/${exam.slug}`} className={styles.secondaryBtn}>
            View Tests
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ExamCard;
