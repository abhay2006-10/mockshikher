import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number; // percentage 0 - 100
  height?: number;
  trackColor?: string;
  fillColor?: string;
  className?: string;
  animate?: boolean;
}

export function ProgressBar({
  value,
  height = 8,
  trackColor,
  fillColor,
  className = '',
  animate = true,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`${styles.track} ${className}`}
      style={{
        height,
        backgroundColor: trackColor,
      }}
    >
      <div
        className={animate ? styles.fill : ''}
        style={{
          width: `${clampedValue}%`,
          backgroundColor: fillColor || 'var(--primary)',
          height: '100%',
          borderRadius: 999,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}
