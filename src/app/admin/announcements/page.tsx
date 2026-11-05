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
import { WHATSAPP_CHANNEL_URL, INSTAGRAM_URL } from '@/config/social';

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

const TYPE_CONFIG: Record<AnnouncementType, { label: string; icon: React.ReactNode; bg: string; color: string; border: string }> = {
  INFO: { label: 'Info', icon: <Info size={13} />, bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  SUCCESS: { label: 'Update', icon: <CheckCircle2 size={13} />, bg: '#DCFCE7', color: '#166534', border: '#BBF7D0' },
  WARNING: { label: 'Notice', icon: <AlertTriangle size={13} />, bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  URGENT: { label: 'Urgent', icon: <Zap size={13} />, bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
  NEW_TEST: { label: 'New Test', icon: <BookOpen size={13} />, bg: '#EEF1FF', color: '#4338CA', border: '#C7D2FE' },
  OFFER: { label: 'Offer', icon: <Tag size={13} />, bg: '#FFEDD5', color: '#9A3412', border: '#FED7AA' },
};

const TYPE_OPTIONS: { value: AnnouncementType; label: string; icon: React.ReactNode; bg: string; color: string; border: string }[] = [
  { value: 'INFO', ...TYPE_CONFIG.INFO },
  { value: 'SUCCESS', ...TYPE_CONFIG.SUCCESS },
  { value: 'WARNING', ...TYPE_CONFIG.WARNING },
  { value: 'URGENT', ...TYPE_CONFIG.URGENT },
  { value: 'NEW_TEST', ...TYPE_CONFIG.NEW_TEST },
  { value: 'OFFER', ...TYPE_CONFIG.OFFER },
];

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
        const d = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setError('Session expired or not logged in. Please log in as admin.');
        } else if (res.status === 403) {
          setError('Admin access required. Your account lacks admin privileges.');
        } else {
          setError(d.error || `Failed to create announcement (HTTP ${res.status})`);
        }
        return;
      }
      setSuccessMsg('Announcement published successfully!');
      setTimeout(() => setSuccessMsg(''), 3500);
      resetForm();
      await loadItems();
    } catch (err: any) {
      setError(err?.message || 'Network error while publishing announcement.');
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
          { label: 'Total', value: items.length, color: '#0B1026' },
          { label: 'Active', value: activeCount, color: '#166534' },
          { label: 'Pinned', value: pinnedCount, color: '#92400E' },
          { label: 'Inactive', value: items.length - activeCount, color: '#991B1B' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E3E6F5',
              borderRadius: '14px',
              padding: '0.85rem 1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem',
              minWidth: '100px',
              boxShadow: '0 1px 3px rgba(11, 16, 38, 0.04)',
            }}
          >
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-heading)' }}>
              {s.value}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#4B5168', fontWeight: 600 }}>
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
            background: '#FFFFFF',
            border: '1px solid #E3E6F5',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(11, 16, 38, 0.06)',
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
                  background: '#FFFFFF', border: '1.5px solid #D5D9EC', borderRadius: '12px', color: '#0B1026', minHeight: '44px',
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
                  background: '#FFFFFF', border: '1.5px solid #D5D9EC', borderRadius: '12px', color: '#0B1026', minHeight: '44px',
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

            {/* Quick Destination Presets */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Destination Presets (Click to Auto-fill)
              </label>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ctaLabel: 'Join WhatsApp Channel', ctaUrl: WHATSAPP_CHANNEL_URL }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#25D366',
                    background: 'rgba(37, 211, 102, 0.12)',
                    border: '1px solid rgba(37, 211, 102, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  💬 Official WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ctaLabel: 'Follow on Instagram', ctaUrl: INSTAGRAM_URL }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#E1306C',
                    background: 'rgba(225, 48, 108, 0.12)',
                    border: '1px solid rgba(225, 48, 108, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  📸 Official Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ctaLabel: 'Explore Test Series', ctaUrl: '/exams' }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#60a5fa',
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  📚 All Exams Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ctaLabel: 'Attempt Free Mock', ctaUrl: '/exams/hp-tet-tgt-non-medical' }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#c084fc',
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  🎯 HP TET Non-Med
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ctaLabel: 'Attempt Free Mock', ctaUrl: '/exams/hp-tet-tgt-arts' }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  🎨 HP TET Arts
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ctaLabel: 'Attempt Free Mock', ctaUrl: '/exams/hp-patwari' }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#fbbf24',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  📖 HP Patwari
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ctaLabel: 'Attempt Free Mock', ctaUrl: '/exams/hp-police-constable' }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#f87171',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  👮 HP Police
                </button>
              </div>
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
                    background: '#FFFFFF', border: '1.5px solid #D5D9EC', borderRadius: '12px', color: '#0B1026', minHeight: '44px',
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
                    background: '#FFFFFF', border: '1.5px solid #D5D9EC', borderRadius: '12px', color: '#0B1026', minHeight: '44px',
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
                  color: 'var(--ink, #0B1026)',
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
        <div style={{ color: '#3B4160', textAlign: 'center', padding: '3rem', fontSize: '0.9rem' }}>
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
          {items.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.INFO;
            return (
              <div
                key={item.id}
                style={{
                  background: '#FFFFFF',
                  border: item.isPinned ? '1.5px solid #FCD34D' : '1px solid #E3E6F5',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  opacity: 1,
                  boxShadow: item.isPinned ? '0 4px 16px rgba(245, 158, 11, 0.08)' : '0 1px 3px rgba(11, 16, 38, 0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    {/* Badges row */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.65rem', alignItems: 'center' }}>
                      {/* Type Badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: config.color,
                          background: config.bg,
                          border: `1px solid ${config.border}`,
                        }}
                      >
                        {config.icon}
                        {config.label}
                      </span>

                      {/* Pinned Pill */}
                      {item.isPinned && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            color: '#92400E',
                            background: '#FEF3C7',
                            border: '1px solid #FDE68A',
                            borderRadius: '9999px',
                            padding: '0.25rem 0.65rem',
                            fontWeight: 700,
                          }}
                        >
                          <Pin size={12} /> Pinned
                        </span>
                      )}

                      {/* Active / Draft Pill */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: item.isActive ? '#166534' : '#475569',
                          background: item.isActive ? '#DCFCE7' : '#F1F5F9',
                          border: `1px solid ${item.isActive ? '#BBF7D0' : '#E2E8F0'}`,
                          borderRadius: '9999px',
                          padding: '0.25rem 0.65rem',
                        }}
                      >
                        {item.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                        {item.isActive ? 'Active' : 'Draft'}
                      </span>

                      {/* Created date */}
                      <span style={{ fontSize: '0.78rem', color: '#6E7591', marginLeft: 'auto' }}>
                        {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Title: #0B1026, 600-700 weight */}
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0B1026', marginBottom: '0.45rem', margin: '0 0 0.45rem 0', lineHeight: 1.4 }}>
                      {item.title}
                    </h3>

                    {/* Description: #4B5168 */}
                    <p style={{ fontSize: '0.9rem', color: '#4B5168', lineHeight: '1.6', margin: 0 }}>
                      {item.body}
                    </p>

                    {/* CTA link: #4338CA */}
                    {item.ctaLabel && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                        <span style={{ color: '#6E7591', marginRight: '6px' }}>Action:</span>
                        <a
                          href={item.ctaUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#4338CA',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{item.ctaLabel}</span>
                          <span aria-hidden="true">&rarr;</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 40px Icon Buttons with aria-labels */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => toggleField(item.id, 'isPinned', item.isPinned)}
                      aria-label={item.isPinned ? 'Unpin announcement' : 'Pin announcement to top'}
                      title={item.isPinned ? 'Unpin' : 'Pin to top'}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: '1.5px solid #D5D9EC',
                        background: item.isPinned ? '#FEF3C7' : '#FFFFFF',
                        color: item.isPinned ? '#92400E' : '#4B5168',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      {item.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleField(item.id, 'isActive', item.isActive)}
                      aria-label={item.isActive ? 'Hide announcement' : 'Make announcement active'}
                      title={item.isActive ? 'Hide' : 'Make active'}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: '1.5px solid #D5D9EC',
                        background: item.isActive ? '#EEF1FF' : '#FFFFFF',
                        color: item.isActive ? '#4338CA' : '#4B5168',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      aria-label="Delete announcement"
                      title="Delete announcement"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: '1.5px solid #FECACA',
                        background: '#FFFFFF',
                        color: '#991B1B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
