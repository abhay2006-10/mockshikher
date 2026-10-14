import React from 'react';
import Badge from '@/components/ui/Badge';
import styles from './ExamCard.module.css';

interface ComingSoonExamCardProps {
  name: string;
  description: string;
  category: string;
}

export function ComingSoonExamCard({ name, description, category }: ComingSoonExamCardProps) {
  return (
    <div className={`${styles.card} ${styles.comingSoonCard}`}>
      <div className={styles.header}>
        <div className={styles.categoryBadge}>
          <Badge variant="neutral" size="sm">
            {category}
          </Badge>
          <Badge variant="warning" size="sm">
            Coming Soon
          </Badge>
        </div>
        <h3 className={styles.title}>{name}</h3>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.metaLine}>
        Syllabus & Tests Launching Soon
      </div>

      <div className={styles.footer}>
        <div className={styles.priceLine}>
          Launching Soon
        </div>
      </div>
    </div>
  );
}

export default ComingSoonExamCard;
