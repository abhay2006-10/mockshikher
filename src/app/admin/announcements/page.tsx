'use client';

import React from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Info,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BookOpen,
  Tag,
  X,
  Save,
  Loader2,
  CalendarClock,
} from 'lucide-react';
import styles from '../admin.module.css';

type AnnouncementType = 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'NEW_TEST' | 'OFFER';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  isPinned: boolean;
  isActive: boolean;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const TYPE_OPTIONS: { value: AnnouncementType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'INFO', label: 'Info', icon: <Info size={14} />, color: '#60a5fa' },
  { value: 'SUCCESS', label: 'Update', icon: <CheckCircle2 size={14} />, color: '#34d399' },
  { value: 'WARNING', label: 'Notice', icon: <AlertTriangle size={14} />, color: '#fbbf24' },
  { value: 'URGENT', label: 'Urgent', icon: <Zap size={14} />, color: '#f87171' },
  { value: 'NEW_TEST', label: 'New Test', icon: <BookOpen size={14} />, color: '#a78bfa' },
  { value: 'OFFER', label: 'Offer', icon: <Tag size={14} />, color: '#fb923c' },
];

const TYPE_COLORS: Record<AnnouncementType, string> = {
  INFO: '#60a5fa',
  SUCCESS: '#34d399',
  WARNING: '#fbbf24',
  URGENT: '#f87171',
  NEW_TEST: '#a78bfa',
  OFFER: '#fb923c',
};

const emptyForm = {
  title: '',
  body: '',
  type: 'INFO' as AnnouncementType,
  isPinned: false,
  isActive: true,
  ctaLabel: '',
  ctaUrl: '',
  expiresAt: '',
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = React.useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ ...emptyForm });
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  async function loadItems() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setItems(data.announcements || []);
      }
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    loadItems();
  }, []);

  function resetForm() {
    setForm({ ...emptyForm });
    setError('');
    setShowForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and body are required.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          expiresAt: form.expiresAt || null,
          ctaLabel: form.ctaLabel || null,
          ctaUrl: form.ctaUrl || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to create announcement.');
        return;
      }
      setSuccessMsg('Announcement published successfully!');
      setTimeout(() => setSuccessMsg(''), 3500);
      resetForm();
      await loadItems();
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleField(id: string, field: 'isActive' | 'isPinned', current: boolean) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    });
    await loadItems();
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    setSuccessMsg('Announcement deleted.');
    setTimeout(() => setSuccessMsg(''), 3000);
    await loadItems();
  }

  const activeCount = items.filter((i) => i.isActive).length;
  const pinnedCount = items.filter((i) => i.isPinned).length;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <Megaphone size={22} color="#60a5fa" />
            <h1 className={styles.pageTitle}>Notice Board Manager</h1>
          </div>
          <p className={styles.pageSubtitle}>
            Publish updates, alerts, and announcements directly to the student dashboard notice board.
          </p>
        </div>
        <button
          className={styles.primaryBtn}
          onClick={() => { setShowForm(true); setError(''); }}
          id="new-announcement-btn"
          disabled={showForm}
        >
          <Plus size={17} />
          New Announcement
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: items.length, color: '#94a3b8' },
          { label: 'Active', value: activeCount, color: '#34d399' },
          { label: 'Pinned', value: pinnedCount, color: '#fbbf24' },
          { label: 'Inactive', value: items.length - activeCount, color: '#f87171' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.1rem',
              minWidth: '90px',
            }}
          >
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>
              {s.value}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Success Message */}
      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            color: '#34d399',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(20, 28, 46, 0.95) 0%, rgba(12, 17, 28, 0.98) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.1), 0 12px 36px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
            <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.05rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
              ✦ New Announcement
            </h2>
            <button
              onClick={resetForm}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: '4px' }}
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Type Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Type
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    id={`type-btn-${t.value.toLowerCase()}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.875rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      color: form.type === t.value ? t.color : 'var(--color-text-tertiary)',
                      background: form.type === t.value ? `${t.color}18` : 'rgba(255,255,255,0.04)',
                      border: form.type === t.value ? `1px solid ${t.color}40` : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="ann-title" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Title *
              </label>
              <input
                id="ann-title"
                type="text"
                placeholder="e.g. HP Patwari Mock Test 4 is Now Live!"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={120}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  background: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>

            {/* Body */}
            <div>
              <label htmlFor="ann-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Message Body *
              </label>
              <textarea
                id="ann-body"
                placeholder="Full update details for students..."
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={3}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  background: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: '1.6',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>

            {/* CTA Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="ann-cta-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CTA Button Label
                </label>
                <input
                  id="ann-cta-label"
                  type="text"
                  placeholder="e.g. Attempt Now"
                  value={form.ctaLabel}
                  onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>
              <div>
                <label htmlFor="ann-cta-url" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CTA URL
                </label>
                <input
                  id="ann-cta-url"
                  type="text"
                  placeholder="/exams/hp-patwari"
                  value={form.ctaUrl}
                  onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>
            </div>

            {/* Expires + Toggles */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label htmlFor="ann-expires" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <CalendarClock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Auto-expire Date (optional)
                </label>
                <input
                  id="ann-expires"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isPinned: !f.isPinned }))}
                  id="toggle-pinned-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: form.isPinned ? '#fbbf24' : 'var(--color-text-tertiary)',
                    background: form.isPinned ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                    border: form.isPinned ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    transition: 'all 0.15s',
                  }}
                >
                  {form.isPinned ? <Pin size={14} /> : <PinOff size={14} />}
                  {form.isPinned ? 'Pinned' : 'Pin'}
                </button>

                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  id="toggle-active-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: form.isActive ? '#34d399' : 'var(--color-text-tertiary)',
                    background: form.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                    border: form.isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    transition: 'all 0.15s',
                  }}
                >
                  {form.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  {form.isActive ? 'Active' : 'Draft'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p style={{ color: '#f87171', fontSize: '0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.6rem 1rem' }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                id="submit-announcement-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 1.4rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  color: '#fff',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-700) 100%)',
                  border: 'none',
                  opacity: isSaving ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {isSaving ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      {isLoading ? (
        <div style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '3rem', fontSize: '0.9rem' }}>
          Loading announcements...
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '1px dashed var(--color-border)',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <Megaphone size={36} color="var(--color-text-tertiary)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
            No announcements yet
          </p>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Click &ldquo;New Announcement&rdquo; to publish your first update to the student dashboard.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                background: item.isActive
                  ? 'linear-gradient(145deg, rgba(20, 28, 46, 0.9) 0%, rgba(12, 17, 28, 0.95) 100%)'
                  : 'rgba(12,17,28,0.6)',
                border: item.isPinned
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                opacity: item.isActive ? 1 : 0.6,
                transition: 'opacity 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  {/* Badges row */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem', alignItems: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: TYPE_COLORS[item.type],
                        background: `${TYPE_COLORS[item.type]}18`,
                        border: `1px solid ${TYPE_COLORS[item.type]}35`,
                      }}
                    >
                      {item.type}
                    </span>
                    {item.isPinned && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#fbbf24', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontWeight: 600 }}>
                        <Pin size={11} /> Pinned
                      </span>
                    )}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: item.isActive ? '#34d399' : '#94a3b8',
                        background: item.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                        border: `1px solid ${item.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(148,163,184,0.15)'}`,
                        borderRadius: '9999px',
                        padding: '0.2rem 0.6rem',
                      }}
                    >
                      {item.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                      {item.isActive ? 'Active' : 'Draft'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Title */}
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>
                    {item.title}
                  </p>

                  {/* Body */}
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.body}
                  </p>

                  {/* CTA info */}
                  {item.ctaLabel && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                      CTA: <strong style={{ color: '#60a5fa' }}>{item.ctaLabel}</strong> → {item.ctaUrl}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => toggleField(item.id, 'isPinned', item.isPinned)}
                    title={item.isPinned ? 'Unpin' : 'Pin to top'}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: item.isPinned ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                      color: item.isPinned ? '#fbbf24' : 'var(--color-text-tertiary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {item.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                  </button>

                  <button
                    onClick={() => toggleField(item.id, 'isActive', item.isActive)}
                    title={item.isActive ? 'Deactivate' : 'Activate'}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: item.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                      color: item.isActive ? '#34d399' : 'var(--color-text-tertiary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {item.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>

                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    title="Delete permanently"
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239,68,68,0.2)',
                      background: 'rgba(239,68,68,0.08)',
                      color: '#f87171',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
