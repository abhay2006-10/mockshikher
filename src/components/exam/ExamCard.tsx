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
        {exam.subjects.slice(0, 3).map((sub) => (
          <span key={sub.id} className={styles.subjectTag}>
            {sub.name}
          </span>
        ))}
        {exam.subjects.length > 3 && (
          <span className={styles.subjectMore}>+{exam.subjects.length - 3} more</span>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.priceLine}>
          ₹{exam.price || 149} • 1 Year Validity
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
