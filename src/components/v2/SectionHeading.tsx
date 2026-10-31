import React from 'react';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  action,
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`${styles.headingWrapper} ${className}`}>
      <div className={styles.textContent}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

