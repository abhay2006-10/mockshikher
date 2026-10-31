import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'darkIndigo';
  interactive?: boolean;
  withMountainRidge?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Card({
  variant = 'surface',
  interactive = false,
  withMountainRidge = false,
  children,
  className = '',
  ...props
}: CardProps) {
  const isDark = variant === 'darkIndigo';

  return (
    <div
      className={`${styles.card} ${isDark ? styles.darkIndigo : ''} ${interactive ? styles.interactive : ''} ${className}`}
      {...props}
    >
      {isDark && withMountainRidge && (
        <svg
          className={styles.ridgeBackground}
          viewBox="0 0 600 160"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 160 L80 90 L150 120 L240 50 L330 115 L420 70 L510 120 L600 80 L600 160 Z"
            fill="var(--primary-panel-ridge)"
          />
        </svg>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
