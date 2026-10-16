import React from 'react';
import Link from 'next/link';
import { Clock, HelpCircle, AlertCircle, Lock, Play, RotateCcw, CheckCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { MockTest } from '@/lib/mock-data';
import styles from './TestCard.module.css';

interface TestCardProps {
  test: MockTest;
  isUnlocked?: boolean;
  hasAttempted?: boolean;
  score?: number;
  percentage?: number;
  onUnlockClick?: () => void;
}

export function TestCard({
  test,
  isUnlocked = false,
  hasAttempted = false,
  score,
  percentage,
  onUnlockClick,
}: TestCardProps) {
  const isAccessible = test.isFree || isUnlocked;

  return (
    <div className={`${styles.card} ${!isAccessible ? styles.lockedCard : ''}`}>
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          {test.isFree ? (
            <Badge variant="success" size="sm">
              FREE
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm" icon={<Lock size={12} />}>
              {isUnlocked ? 'Unlocked' : 'Premium Mock'}
            </Badge>
          )}

          {hasAttempted && (
            <Badge variant="info" size="sm" icon={<CheckCircle size={12} />}>
              Attempted ({percentage?.toFixed(0)}%)
            </Badge>
          )}
        </div>

        <h4 className={styles.title}>{test.name}</h4>
      </div>

      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <HelpCircle size={15} />
          <span>{test.totalQuestions} Questions</span>
        </div>
        <div className={styles.metaItem}>
          <Clock size={15} />
          <span>{test.durationMinutes} Minutes</span>
        </div>
        <div className={styles.metaItem}>
          <span>{test.totalMarks} Marks</span>
        </div>
        <div className={styles.metaItem}>
          {Number(test.negativeMarksPerQuestion) > 0 &&
          !test.name?.toLowerCase().includes('patwari') &&
          !test.name?.toLowerCase().includes('clerk') &&
          !test.name?.toLowerCase().includes('process-server') ? (
            <>
              <AlertCircle size={14} className={styles.negMarkIcon} />
              <span>-{test.negativeMarksPerQuestion} Neg.</span>
            </>
          ) : (
            <>
              <CheckCircle size={14} style={{ color: 'var(--color-success, #10b981)' }} />
              <span>No Negative Marking</span>
            </>
          )}
        </div>
      </div>

      {hasAttempted && score !== undefined && (
        <div className={styles.previousResult}>
          <span className={styles.prevResultLabel}>Last Score:</span>
          <span className={styles.prevScoreVal}>
            {score.toFixed(1)} / {test.totalMarks}
          </span>
          <Link href={`/test/${test.id}/result`} className={styles.viewResultLink}>
            View Analysis →
          </Link>
        </div>
      )}

      <div className={styles.footer}>
        {isAccessible ? (
          <div className={styles.btnGroup}>
            {test.totalQuestions === 0 ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 500 }}>
                  No questions have been added to this test yet
                </span>
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  fullWidth
                >
                  Start Test Now
                </Button>
              </div>
            ) : (
              <Link href={`/test/${test.id}/instructions`} className={styles.startLink}>
                <Button
                  variant={test.isFree ? 'accent' : 'primary'}
                  size="md"
                  leftIcon={hasAttempted ? <RotateCcw size={16} /> : <Play size={16} />}
                  fullWidth
                >
                  {hasAttempted ? 'Reattempt Mock' : 'Start Test Now'}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="md"
            leftIcon={<Lock size={16} />}
            fullWidth
            onClick={onUnlockClick}
          >
            Unlock All 10 Mocks for ₹149
          </Button>
        )}
      </div>
    </div>
  );
}

export default TestCard;
