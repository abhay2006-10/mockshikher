'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  BellRing,
  Info,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BookOpen,
  Tag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Megaphone,
  Pin,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import styles from './NoticeBoard.module.css';

export type AnnouncementType = 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'NEW_TEST' | 'OFFER';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  isPinned: boolean;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<
  AnnouncementType,
  {
    icon: React.ReactNode;
    label: string;
    colorClass: string;
    borderGlow: string;
  }
> = {
  INFO: {
    icon: <Info size={14} />,
    label: 'Platform Notice',
    colorClass: styles.typeInfo,
    borderGlow: 'rgba(59, 130, 246, 0.3)',
  },
  SUCCESS: {
    icon: <CheckCircle2 size={14} />,
    label: 'Update',
    colorClass: styles.typeSuccess,
    borderGlow: 'rgba(16, 185, 129, 0.3)',
  },
  WARNING: {
    icon: <AlertTriangle size={14} />,
    label: 'Important Notice',
    colorClass: styles.typeWarning,
    borderGlow: 'rgba(245, 158, 11, 0.3)',
  },
  URGENT: {
    icon: <Zap size={14} />,
    label: 'Urgent Alert',
    colorClass: styles.typeUrgent,
    borderGlow: 'rgba(239, 68, 68, 0.4)',
  },
  NEW_TEST: {
    icon: <BookOpen size={14} />,
    label: 'New Test Series',
    colorClass: styles.typeNewTest,
    borderGlow: 'rgba(168, 85, 247, 0.35)',
  },
  OFFER: {
    icon: <Tag size={14} />,
    label: 'Special Offer',
    colorClass: styles.typeOffer,
    borderGlow: 'rgba(249, 115, 22, 0.35)',
  },
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

interface NoticeBoardProps {
  compact?: boolean;
}

export default function NoticeBoard({ compact = false }: NoticeBoardProps) {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/announcements', { next: { revalidate: 60 } } as RequestInit);
        if (res.ok) {
          const data = await res.json();
          const items: Announcement[] = data.announcements || [];
          setAnnouncements(items);

          // Track unread using localStorage
          const seenKey = 'ms_seen_announcements';
          let seen: string[] = [];
          try {
            seen = JSON.parse(localStorage.getItem(seenKey) || '[]');
          } catch {
            seen = [];
          }
          const unseen = items.filter((a) => !seen.includes(a.id));
          setUnreadCount(unseen.length);

          // Auto-expand the pinned or first announcement by default so students don't miss it
          if (items.length > 0) {
            const pinned = items.find((i) => i.isPinned);
            setExpanded(pinned ? pinned.id : items[0].id);
          }
        }
      } catch {
        // Silent fail — notice board is non-critical
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  function markAllSeen() {
    const seenKey = 'ms_seen_announcements';
    const ids = announcements.map((a) => a.id);
    localStorage.setItem(seenKey, JSON.stringify(ids));
    setUnreadCount(0);
  }

  function handleToggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
    // Mark as seen when expanded
    const seenKey = 'ms_seen_announcements';
    try {
      const seen: string[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
      if (!seen.includes(id)) {
        localStorage.setItem(seenKey, JSON.stringify([...seen, id]));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  const visibleItems = showAll ? announcements : announcements.slice(0, 4);

  if (isLoading) {
    return (
      <section className={styles.wrapper} aria-label="Official Notice Board">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.bellIconBox}>
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Official Notice Board</h2>
              <p className={styles.subtitle}>Checking platform announcements...</p>
            </div>
          </div>
        </div>
        <div className={styles.skeletonList}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonBadge} />
              <div className={styles.skeletonText} />
              <div className={styles.skeletonTextShort} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (announcements.length === 0) {
    return null; // Clean UX: don't render empty container when no active announcements
  }

  return (
    <section className={`${styles.wrapper} ${compact ? styles.wrapperCompact : ''}`} aria-label="Official Notice Board" id="notice-board">
      {/* Ambient background glow */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.bellIconBox}>
            {unreadCount > 0 ? (
              <BellRing size={20} className={styles.bellRinging} />
            ) : (
              <Megaphone size={20} />
            )}
            {unreadCount > 0 && (
              <span className={styles.unreadBadge} aria-label={`${unreadCount} unread notices`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 className={styles.title}>
                Notice Board
              </h2>
              <span className={styles.liveChip}>
                <span className={styles.liveDot} aria-hidden="true" />
                Live Updates
              </span>
            </div>
            <p className={styles.subtitle}>
              Official exam notices, syllabus updates, and new mock releases from Mockshikhar
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button className={styles.markReadBtn} onClick={markAllSeen} aria-label="Mark all notices as read">
            <CheckCircle2 size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Announcement Cards List */}
      <div className={styles.list}>
        {visibleItems.map((item, index) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.INFO;
          const isOpen = expanded === item.id;
          const isUnread = (() => {
            try {
              const seen: string[] = JSON.parse(localStorage.getItem('ms_seen_announcements') || '[]');
              return !seen.includes(item.id);
            } catch {
              return false;
            }
          })();

          return (
            <article
              key={item.id}
              className={`${styles.itemCard} ${item.isPinned ? styles.itemPinned : ''} ${isUnread ? styles.itemUnread : ''} ${isOpen ? styles.itemCardOpen : ''}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Entire header + title is clickable */}
              <button
                type="button"
                className={styles.itemHeaderBtn}
                onClick={() => handleToggle(item.id)}
                aria-expanded={isOpen}
                aria-controls={`notice-body-${item.id}`}
                id={`notice-trigger-${item.id}`}
              >
                <div className={styles.itemHeaderTop}>
                  <div className={styles.itemBadges}>
                    {/* Type Badge */}
                    <span className={`${styles.typeBadge} ${config.colorClass}`}>
                      {config.icon}
                      <span>{config.label}</span>
                    </span>

                    {/* Pin badge */}
                    {item.isPinned && (
                      <span className={styles.pinBadge} title="Pinned announcement">
                        <Pin size={11} />
                        <span>Pinned</span>
                      </span>
                    )}

                    {/* Unread indicator */}
                    {isUnread && (
                      <span className={styles.unreadChip}>
                        <span className={styles.unreadDot} />
                        New
                      </span>
                    )}
                  </div>

                  <div className={styles.itemMeta}>
                    <time className={styles.timeAgo} dateTime={item.createdAt}>
                      {formatRelativeTime(item.createdAt)}
                    </time>
                    <span className={`${styles.expandIcon} ${isOpen ? styles.expandIconRotated : ''}`} aria-hidden="true">
                      <ChevronDown size={17} />
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className={styles.itemTitle}>{item.title}</h3>
              </button>

              {/* Expandable Body */}
              <div
                className={`${styles.itemBody} ${isOpen ? styles.itemBodyOpen : ''}`}
                id={`notice-body-${item.id}`}
                role="region"
                aria-labelledby={`notice-trigger-${item.id}`}
              >
                <div className={styles.bodyContent}>
                  <p className={styles.bodyText}>{item.body}</p>

                  {item.ctaLabel && item.ctaUrl && (() => {
                    const isWa = item.ctaUrl.includes('whatsapp.com') || item.ctaUrl.includes('wa.me');
                    const isIg = item.ctaUrl.includes('instagram.com');
                    const isExternal = item.ctaUrl.startsWith('http');

                    const btnClass = `${styles.ctaButton} ${
                      isWa ? styles.ctaWhatsApp : isIg ? styles.ctaInstagram : ''
                    }`;

                    return (
                      <div className={styles.ctaRow}>
                        {isExternal ? (
                          <a
                            href={item.ctaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={btnClass}
                            id={`notice-cta-${item.id}`}
                          >
                            {isWa ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.284l-.548 2.003 2.062-.54c.974.57 1.954.896 3.228.897 3.18 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.644-5.767-5.644zm0 10.372c-1.12 0-2.002-.321-2.85-.826l-.204-.121-1.341.351.358-1.308-.133-.211c-.555-.884-.848-1.748-.847-2.844.001-2.54 2.072-4.611 4.614-4.611 2.546 0 4.617 2.071 4.617 4.614 0 2.543-2.071 4.956-6.047 4.956z"/>
                              </svg>
                            ) : isIg ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                              </svg>
                            ) : (
                              <Sparkles size={14} />
                            )}
                            <span>{item.ctaLabel}</span>
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <Link href={item.ctaUrl} className={btnClass} id={`notice-cta-${item.id}`}>
                            <Sparkles size={14} />
                            <span>{item.ctaLabel}</span>
                            <ArrowRight size={14} className={styles.ctaArrow} />
                          </Link>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Show more / less button if > 4 items */}
      {announcements.length > 4 && (
        <button
          className={styles.showMoreBtn}
          onClick={() => setShowAll((p) => !p)}
          aria-expanded={showAll}
        >
          {showAll ? (
            <>
              <ChevronUp size={15} />
              <span>Show Fewer Announcements</span>
            </>
          ) : (
            <>
              <ChevronDown size={15} />
              <span>View All {announcements.length} Announcements</span>
            </>
          )}
        </button>
      )}
    </section>
  );
}
