'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from './Icons';
import { Chip } from './Chip';
import styles from './ExamSeriesCard.module.css';

export interface ExamSeriesCardProps {
  isComingSoon?: boolean;
  name: string;
  category: string;
  slug: string;
  totalQuestions?: number;
  durationMinutes?: number;
  price?: number;
  originalPrice?: number;
  freeMockId?: string;
  isLoggedIn?: boolean;
  onTryFreeMock?: (url: string) => void;
  index?: number;
  className?: string;
}

export function ExamSeriesCard({
  isComingSoon = false,
  name,
  category,
  slug,
  totalQuestions = 100,
  durationMinutes = 90,
  price = 1,
  originalPrice = 149,
  freeMockId,
  isLoggedIn = false,
  onTryFreeMock,
  index = 0,
  className = '',
}: ExamSeriesCardProps) {
  const freeMockUrl = freeMockId
    ? `/test/${freeMockId}/instructions`
    : `/test/${slug}-mock-1/instructions`;
  const examUrl = `/exams/${slug}`;

  const handleFreeMockClick = (e: React.MouseEvent) => {
    if (!isLoggedIn && onTryFreeMock) {
      e.preventDefault();
      onTryFreeMock(freeMockUrl);
    }
  };

  return (
    <article
      className={`${styles.card} ${className}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className={styles.header}>
        <Chip category={category} />
        {isComingSoon && <span className={styles.comingSoonBadge}>Coming soon</span>}
      </div>

      <h3 className={styles.title}>{name}</h3>

      {!isComingSoon ? (
        <div className={styles.body}>
          <div className={styles.metaRow}>
            <span>{totalQuestions} Questions</span>
            <span aria-hidden="true">·</span>
            <span>{durationMinutes} min</span>
          </div>

          <div className={styles.priceRow}>
            <span className={styles.currentPrice}>₹{price}</span>
            {originalPrice > price && (
              <>
                <span className={styles.originalPrice}>₹{originalPrice}</span>
                <span className={styles.discountBadge}>99% off</span>
              </>
            )}
            <span className={styles.validity}>1 year access</span>
          </div>

          <div className={styles.actions}>
            <Link
              href={freeMockUrl}
              onClick={handleFreeMockClick}
              className={styles.tryBtn}
            >
              <span>Try free mock</span>
              <span className={styles.arrow} aria-hidden="true">
                <ArrowRight size={15} />
              </span>
            </Link>
            <Link href={examUrl} className={styles.viewAllLink}>
              View all tests
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.comingSoonBody}>
          <p className={styles.comingSoonText}>
            Mocks are being prepared. Join our WhatsApp channel to get notified at launch.
          </p>
          <a
            href="https://whatsapp.com/channel/0029Vb4w23c6xCSHhW2ePq1f"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.notifyLink}
          >
            <span>Notify on WhatsApp</span>
            <ArrowRight size={14} />
          </a>
        </div>
      )}
    </article>
  );
}

