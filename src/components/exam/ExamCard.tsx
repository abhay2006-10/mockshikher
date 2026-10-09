import React from 'react';
import Link from 'next/link';
import { Clock, HelpCircle, Award, ArrowRight, Sparkles } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { MockExam } from '@/lib/mock-data';
import styles from './ExamCard.module.css';

interface ExamCardProps {
  exam: MockExam;
}

export function ExamCard({ exam }: ExamCardProps) {
  return (
    <div className={styles.card}>
      {exam.isPopular && (
        <div className={styles.popularRibbon}>
          <Sparkles size={13} />
          <span>Most Popular</span>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.categoryBadge}>
          <Badge variant="neutral" size="sm">
            {exam.category}
          </Badge>
          <Badge variant="success" size="sm">
            {exam.freeMocks} Free Mock Available
          </Badge>
        </div>
        <h3 className={styles.title}>{exam.name}</h3>
        <p className={styles.description}>{exam.description}</p>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <HelpCircle size={16} className={styles.metaIcon} />
          <div>
            <div className={styles.metaVal}>{exam.totalQuestions} Questions</div>
            <div className={styles.metaLabel}>per test</div>
          </div>
        </div>

        <div className={styles.metaItem}>
          <Clock size={16} className={styles.metaIcon} />
          <div>
            <div className={styles.metaVal}>{exam.durationMinutes} Mins</div>
            <div className={styles.metaLabel}>duration</div>
          </div>
        </div>

        <div className={styles.metaItem}>
          <Award size={16} className={styles.metaIcon} />
          <div>
            <div className={styles.metaVal}>{exam.totalMocks} Total Mocks</div>
            <div className={styles.metaLabel}>Full Length</div>
          </div>
        </div>
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
        <div className={styles.priceContainer}>
          <div className={styles.priceRow}>
            <span className={styles.currentPrice}>₹{exam.price}</span>
            <span className={styles.originalPrice}>₹{exam.originalPrice}</span>
            <span className={styles.discountBadge}>
              {Math.round(((exam.originalPrice - exam.price) / exam.originalPrice) * 100)}% OFF
            </span>
          </div>
          <span className={styles.priceSubtext}>Complete Test Series • 1 Year Validity</span>
        </div>

        <Link href={`/exams/${exam.slug}`} className={styles.actionBtn}>
          <span>View Tests</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default ExamCard;
