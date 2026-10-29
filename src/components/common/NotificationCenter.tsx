'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Bell,
  BellRing,
  X,
  ExternalLink,
  Pin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Megaphone,
  BookOpen,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';
import styles from './NotificationCenter.module.css';

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  type: 'NEW_TEST' | 'EXAM_UPDATE' | 'IMPORTANT' | 'ALERT' | 'INFO';
  isPinned: boolean;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  createdAt: string;
}

const TYPE_CONFIG = {
  NEW_TEST: { label: 'New Mock Series', icon: <Sparkles size={11} />, class: styles.badgeNewTest },
  EXAM_UPDATE: { label: 'Exam Notice', icon: <Calendar size={11} />, class: styles.badgeExamUpdate },
  IMPORTANT: { label: 'Important', icon: <Pin size={11} />, class: styles.badgeImportant },
  ALERT: { label: 'Urgent Alert', icon: <AlertTriangle size={11} />, class: styles.badgeAlert },
  INFO: { label: 'Notice', icon: <Info size={11} />, class: styles.badgeInfo },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Global dispatcher to open notification center from anywhere
export function openNotificationCenter() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ms:open-notifications'));
  }
}

const emptySubscribe = () => () => {};

/**
 * Shared Hook for announcement data and unread tracking
 */
export function useAnnouncements() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchList = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        const list: AnnouncementItem[] = data.announcements || [];
        setItems(list);

        const seenKey = 'ms_seen_announcements';
        let seen: string[] = [];
        try {
          seen = JSON.parse(localStorage.getItem(seenKey) || '[]');
        } catch {
          seen = [];
        }
        const unseen = list.filter((a) => !seen.includes(a.id));
        setUnreadCount(unseen.length);
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchList();

    const handleSeenUpdate = () => {
      try {
        const seen: string[] = JSON.parse(localStorage.getItem('ms_seen_announcements') || '[]');
        setUnreadCount((prev) => {
          const count = items.filter((a) => !seen.includes(a.id)).length;
          return count;
        });
      } catch {
        // Ignore
      }
    };

    window.addEventListener('ms:notifications-seen', handleSeenUpdate);
    return () => window.removeEventListener('ms:notifications-seen', handleSeenUpdate);
  }, [items.length]);

  return { items, unreadCount, isLoading, refresh: fetchList };
}

/**
 * 1. Bell Icon Button — Placed in Header & Navigation
 */
export function NotificationBell({ className = '' }: { className?: string }) {
  const { unreadCount } = useAnnouncements();

  return (
    <button
      type="button"
      className={`${styles.bellBtn} ${unreadCount > 0 ? styles.bellBtnHasUnread : ''} ${className}`}
      onClick={openNotificationCenter}
      aria-label={`Official Notifications (${unreadCount} new)`}
      title="Official Exam Announcements & Alerts"
    >
      {unreadCount > 0 ? (
        <>
          <BellRing size={19} className={styles.ringingIcon} />
          <span className={styles.unreadBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          <span className={styles.pulseBeacon} aria-hidden="true" />
        </>
      ) : (
        <Bell size={19} />
      )}
    </button>
  );
}

/**
 * 2. Hero Live Announcement Pill — Super attractive banner on the Homepage
 */
export function HeroAnnouncementPill() {
  const { items, unreadCount } = useAnnouncements();
  if (items.length === 0) return null;

  const latest = items[0];

  return (
    <button
      type="button"
      className={styles.heroAnnouncementPill}
      onClick={openNotificationCenter}
      aria-label="Click to view official announcement"
    >
      <span className={styles.heroPillShimmer} aria-hidden="true" />
      <div className={styles.heroPillIconBox}>
        <BellRing size={14} className={styles.ringingIcon} />
      </div>
      <span className={styles.heroPillBadge}>
        {latest.type === 'NEW_TEST' ? 'New Mock Series' : 'Official Notice'}
      </span>
      <span className={styles.heroPillTitle} title={latest.title}>
        {latest.title}
      </span>
      <span className={styles.heroPillCta}>
        Read Notice <ArrowRight size={13} />
      </span>
    </button>
  );
}

/**
 * 3. Floating Bottom-Right Bell on Homepage
 */
export function FloatingNotificationBell() {
  const { items, unreadCount } = useAnnouncements();
  if (items.length === 0) return null;

  return (
    <button
      type="button"
      className={styles.floatingBell}
      onClick={openNotificationCenter}
      aria-label="Open Official Notifications"
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <BellRing size={18} className={unreadCount > 0 ? styles.ringingIcon : ''} />
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </div>
      <span className={styles.floatingBellText}>
        <span>Exam Updates</span>
        {unreadCount > 0 && (
          <span style={{ color: '#fbbf24', fontSize: '0.72rem' }}>• {unreadCount} New</span>
        )}
      </span>
    </button>
  );
}

/**
 * 4. Notification Drawer / Slide-Over Modal
 */
export function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, unreadCount, isLoading, refresh } = useAnnouncements();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      refresh();
    };

    window.addEventListener('ms:open-notifications', handleOpen);
    return () => window.removeEventListener('ms:open-notifications', handleOpen);
  }, []);

  // Lock body scroll and Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const markAllSeen = () => {
    const ids = items.map((a) => a.id);
    localStorage.setItem('ms_seen_announcements', JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('ms:notifications-seen'));
  };

  const markSingleSeen = (id: string) => {
    try {
      const seen: string[] = JSON.parse(localStorage.getItem('ms_seen_announcements') || '[]');
      if (!seen.includes(id)) {
        localStorage.setItem('ms_seen_announcements', JSON.stringify([...seen, id]));
        window.dispatchEvent(new CustomEvent('ms:notifications-seen'));
      }
    } catch {
      // Ignore
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={styles.modalBackdrop}
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Official Notifications Center"
    >
      <div className={styles.modalDrawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerAmbientGlow} aria-hidden="true" />

        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitleBox}>
            <div className={styles.drawerIconBox}>
              <BellRing size={20} className={styles.ringingIcon} />
            </div>
            <div>
              <h2 className={styles.drawerTitle}>
                Official Notices
                <span className={styles.drawerLiveBadge}>
                  <span className={styles.drawerLiveDot} />
                  Live
                </span>
              </h2>
              <p className={styles.drawerSubtitle}>
                Himachal Pradesh exam notifications, syllabus changes & new mocks
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.drawerCloseBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Close notifications"
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions sub-bar */}
        <div className={styles.drawerActionsBar}>
          <span>
            {items.length} {items.length === 1 ? 'Notice' : 'Notices'}{' '}
            {unreadCount > 0 ? `(${unreadCount} unread)` : ''}
          </span>
          {unreadCount > 0 && (
            <button type="button" className={styles.markAllBtn} onClick={markAllSeen}>
              <CheckCircle2 size={13} /> Mark all read
            </button>
          )}
        </div>

        {/* List of Announcements */}
        <div className={styles.drawerList}>
          {isLoading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconBox}>
                <Megaphone size={24} />
              </div>
              <p className={styles.emptyTitle}>Checking notices...</p>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconBox}>
                <Megaphone size={26} />
              </div>
              <p className={styles.emptyTitle}>No notices right now</p>
              <p className={styles.emptySubtitle}>
                All official exam updates, mock test releases, and important alerts will appear here.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.INFO;
              const isUnread = (() => {
                try {
                  const seen: string[] = JSON.parse(localStorage.getItem('ms_seen_announcements') || '[]');
                  return !seen.includes(item.id);
                } catch {
                  return false;
                }
              })();

              const isWa = item.ctaUrl?.includes('whatsapp.com') || item.ctaUrl?.includes('wa.me');
              const isIg = item.ctaUrl?.includes('instagram.com');

              return (
                <article
                  key={item.id}
                  className={`${styles.noticeCard} ${item.isPinned ? styles.noticeCardPinned : ''} ${
                    isUnread ? styles.noticeCardUnread : ''
                  }`}
                  onClick={() => markSingleSeen(item.id)}
                >
                  <div className={styles.noticeCardTop}>
                    <div className={styles.noticeBadges}>
                      <span className={`${styles.badgeTag} ${cfg.class}`}>
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </span>

                      {item.isPinned && (
                        <span className={styles.badgePinned} title="Pinned Announcement">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                    </div>
                    <time className={styles.noticeTime} dateTime={item.createdAt}>
                      {formatRelativeTime(item.createdAt)}
                    </time>
                  </div>

                  <h3 className={styles.noticeTitle}>{item.title}</h3>
                  <p className={styles.noticeBody}>{item.body}</p>

                  {item.ctaLabel && item.ctaUrl && (
                    <div className={styles.ctaRow}>
                      {item.ctaUrl.startsWith('http') ? (
                        <a
                          href={item.ctaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.ctaBtn} ${
                            isWa ? styles.ctaWhatsApp : isIg ? styles.ctaInstagram : styles.ctaDefault
                          }`}
                        >
                          {isWa ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.284l-.548 2.003 2.062-.54c.974.57 1.954.896 3.228.897 3.18 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.644-5.767-5.644zm0 10.372c-1.12 0-2.002-.321-2.85-.826l-.204-.121-1.341.351.358-1.308-.133-.211c-.555-.884-.848-1.748-.847-2.844.001-2.54 2.072-4.611 4.614-4.611 2.546 0 4.617 2.071 4.617 4.614 0 2.543-2.071 4.956-6.047 4.956z"/>
                            </svg>
                          ) : isIg ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                          ) : (
                            <Sparkles size={13} />
                          )}
                          <span>{item.ctaLabel}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <Link
                          href={item.ctaUrl}
                          className={`${styles.ctaBtn} ${styles.ctaDefault}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Sparkles size={13} />
                          <span>{item.ctaLabel}</span>
                          <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Drawer Footer with Official Channels */}
        <div className={styles.drawerFooter}>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Stay connected:</span>
          <div className={styles.footerSocialLinks}>
            <a
              href="https://whatsapp.com/channel/0029Va5I0zx0VycNW93eqO2P"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerSocialBtn}
              style={{ color: '#25D366' }}
            >
              💬 WhatsApp
            </a>
            <a
              href="https://www.instagram.com/mockshikhar"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerSocialBtn}
              style={{ color: '#E1306C' }}
            >
              📸 Instagram
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

