import React from 'react';
import { getCategoryChipColor } from './tokens';
import styles from './Chip.module.css';

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  category?: string;
  variant?: 'category' | 'live' | 'new' | 'custom';
  customBg?: string;
  customColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Chip({
  category,
  variant = 'category',
  customBg,
  customColor,
  children,
  className = '',
  style = {},
  ...props
}: ChipProps) {
  let bg = customBg;
  let color = customColor;

  if (variant === 'category' && category) {
    const colors = getCategoryChipColor(category);
    bg = colors.bg;
    color = colors.text;
  } else if (variant === 'live') {
    bg = 'var(--success-tint)';
    color = 'var(--success-text)';
  } else if (variant === 'new') {
    bg = 'var(--amber-tint)';
    color = 'var(--amber-text)';
  }

  return (
    <span
      className={`${styles.chip} ${className}`}
      style={{
        backgroundColor: bg,
        color: color,
        ...style,
      }}
      {...props}
    >
      {variant === 'live' && <span className={styles.liveDot} aria-hidden="true" />}
      {children || (category ? category.toUpperCase() : null)}
    </span>
  );
}

