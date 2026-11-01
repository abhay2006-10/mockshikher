'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MegaphoneIcon, ArrowRight, XIcon } from './Icons';
import styles from './NoticeBoard.module.css';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
  isPinned: boolean;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  createdAt: string;
}

export function NoticeBoard() {
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/announcements')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const list: Announcement[] = data.announcements || [];
        setNotices(list);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const isRecent = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    } catch {
      return false;
    }
  };

  const displayedNotices = showAll ? notices : notices.slice(0, 3);

  return (
    <>
      <section className={styles.section} aria-label="Notice Board">
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <span className={styles.iconBox} aria-hidden="true">
                <MegaphoneIcon size={20} />
              </span>
              <h2 className={styles.heading}>Notice Board</h2>
              <span className={styles.liveBadge}>
                <span className={styles.liveDot} aria-hidden="true" />
                Live
              </span>
            </div>
            {notices.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className={styles.viewAllBtn}
              >
                {showAll ? 'Show less' : 'View all'}
              </button>
            )}
          </div>

          {/* Notice List */}
          <div className={styles.list}>
            {loading ? (
              <div className={styles.skeletonList}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeletonRow}>
                    <span className={styles.skeletonDate} />
                    <span className={styles.skeletonTitle} />
                  </div>
                ))}
              </div>
            ) : notices.length === 0 ? (
              <div className={styles.empty}>
                <span>No new announcements at this moment.</span>
              </div>
            ) : (
              displayedNotices.map((n, i) => {
                const isNew = isRecent(n.createdAt);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSelectedNotice(n)}
                    className={styles.row}
                    style={{ animationDelay: `${0.2 + i * 0.08}s` }}
                  >
                    <span className={styles.date}>{formatDate(n.createdAt)}</span>
                    <span className={styles.noticeTitle}>{n.title}</span>
                    {isNew && <span className={styles.newBadge}>New</span>}
                    <span className={styles.arrow} aria-hidden="true">
                      <ArrowRight size={16} />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className={styles.modalOverlay} onClick={() => setSelectedNotice(null)}>
          <div
            className={styles.modalBox}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={styles.date}>{formatDate(selectedNotice.createdAt)}</span>
                {isRecent(selectedNotice.createdAt) && (
                  <span className={styles.newBadge}>New</span>
                )}
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedNotice(null)}
                aria-label="Close announcement"
              >
                <XIcon size={20} />
              </button>
            </div>
            <h3 id="modal-title" className={styles.modalTitle}>
              {selectedNotice.title}
            </h3>
            {selectedNotice.body && (
              <div className={styles.modalBody}>{selectedNotice.body}</div>
            )}
            {selectedNotice.ctaUrl && selectedNotice.ctaLabel && (
              <div className={styles.modalFooter}>
                <Link
                  href={selectedNotice.ctaUrl}
                  className={styles.ctaLink}
                  onClick={() => setSelectedNotice(null)}
                >
                  {selectedNotice.ctaLabel}
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

