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
} from 'lucide-react';
import styles from './NoticeBoard.module.css';

type AnnouncementType = 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'NEW_TEST' | 'OFFER';

interface Announcement {
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
  }
> = {
  INFO: {
    icon: <Info size={15} />,
    label: 'Info',
    colorClass: styles.typeInfo,
  },
  SUCCESS: {
    icon: <CheckCircle2 size={15} />,
    label: 'Update',
    colorClass: styles.typeSuccess,
  },
  WARNING: {
    icon: <AlertTriangle size={15} />,
    label: 'Notice',
    colorClass: styles.typeWarning,
  },
  URGENT: {
    icon: <Zap size={15} />,
    label: 'Urgent',
    colorClass: styles.typeUrgent,
  },
  NEW_TEST: {
    icon: <BookOpen size={15} />,
    label: 'New Test',
    colorClass: styles.typeNewTest,
  },
  OFFER: {
    icon: <Tag size={15} />,
    label: 'Offer',
    colorClass: styles.typeOffer,
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

export default function NoticeBoard() {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/announcements', { next: { revalidate: 300 } } as RequestInit);
        if (res.ok) {
          const data = await res.json();
          const items: Announcement[] = data.announcements || [];
          setAnnouncements(items);

          // Track unread using localStorage
          const seenKey = 'ms_seen_announcements';
          const seen: string[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
          const unseen = items.filter((a) => !seen.includes(a.id));
          setUnreadCount(unseen.length);
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

  function handleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
    // Mark as seen when expanded
    const seenKey = 'ms_seen_announcements';
    const seen: string[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
    if (!seen.includes(id)) {
      localStorage.setItem(seenKey, JSON.stringify([...seen, id]));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }

  const visibleItems = showAll ? announcements : announcements.slice(0, 4);

  if (isLoading) {
    return (
      <section className={styles.wrapper} aria-label="Notice Board">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.bellIconBox}>
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Notice Board</h2>
              <p className={styles.subtitle}>Platform updates & announcements</p>
            </div>
          </div>
        </div>
        <div className={styles.skeletonList}>
          {[1, 2, 3].map((i) => (
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
    return null; // Don't render if no announcements — clean UX
  }

  return (
    <section className={styles.wrapper} aria-label="Notice Board" id="notice-board">
      {/* Ambient background glow */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.bellIconBox}>
            {unreadCount > 0 ? <BellRing size={20} className={styles.bellRinging} /> : <Megaphone size={20} />}
            {unreadCount > 0 && (
              <span className={styles.unreadBadge} aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className={styles.title}>
              Notice Board
              <span className={styles.liveChip}>
                <span className={styles.liveDot} aria-hidden="true" />
                Live
              </span>
            </h2>
            <p className={styles.subtitle}>
              {announcements.length} update{announcements.length !== 1 ? 's' : ''} from Mockshikhar
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button className={styles.markReadBtn} onClick={markAllSeen} aria-label="Mark all as read">
            <Bell size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Announcement Items */}
      <ul className={styles.list} role="list">
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
            <li
              key={item.id}
              className={`${styles.item} ${item.isPinned ? styles.itemPinned : ''} ${isUnread ? styles.itemUnread : ''}`}
              style={{ animationDelay: `${index * 60}ms` }}
              role="listitem"
            >
              {/* Item Header Row */}
              <button
                className={styles.itemHeader}
                onClick={() => handleExpand(item.id)}
                aria-expanded={isOpen}
                aria-controls={`notice-body-${item.id}`}
                id={`notice-trigger-${item.id}`}
              >
                <div className={styles.itemLeft}>
                  {/* Type Badge */}
                  <span className={`${styles.typeBadge} ${config.colorClass}`}>
                    {config.icon}
                    <span>{config.label}</span>
                  </span>

                  {/* Pin indicator */}
                  {item.isPinned && (
                    <span className={styles.pinBadge} aria-label="Pinned announcement">
                      <Pin size={11} />
                    </span>
                  )}

                  {/* Unread dot */}
                  {isUnread && <span className={styles.unreadDot} aria-label="Unread" />}
                </div>

                <div className={styles.itemMeta}>
                  <time className={styles.timeAgo} dateTime={item.createdAt}>
                    {formatRelativeTime(item.createdAt)}
                  </time>
                  <span className={styles.expandIcon} aria-hidden="true">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </button>

              {/* Title */}
              <div className={styles.itemTitle}>{item.title}</div>

              {/* Expandable Body */}
              <div
                className={`${styles.itemBody} ${isOpen ? styles.itemBodyOpen : ''}`}
                id={`notice-body-${item.id}`}
                role="region"
                aria-labelledby={`notice-trigger-${item.id}`}
              >
                <p className={styles.bodyText}>{item.body}</p>

                {item.ctaLabel && item.ctaUrl && (
                  <div className={styles.ctaRow}>
                    {item.ctaUrl.startsWith('http') ? (
                      <a
                        href={item.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.ctaButton}
                        id={`notice-cta-${item.id}`}
                      >
                        <span>{item.ctaLabel}</span>
                        <ArrowRight size={14} />
                      </a>
                    ) : (
                      <Link href={item.ctaUrl} className={styles.ctaButton} id={`notice-cta-${item.id}`}>
                        <span>{item.ctaLabel}</span>
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Show more / less */}
      {announcements.length > 4 && (
        <button
          className={styles.showMoreBtn}
          onClick={() => setShowAll((p) => !p)}
          aria-expanded={showAll}
        >
          {showAll ? (
            <>
              <ChevronUp size={15} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={15} />
              Show {announcements.length - 4} More
            </>
          )}
        </button>
      )}
    </section>
  );
}
