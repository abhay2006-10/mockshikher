'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Phone,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import styles from '../admin.module.css';

interface StudentContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasPhone: boolean;
  whatsappConsent: boolean;
  registeredAt: string;
  purchasesCount: number;
  attemptsCount: number;
}

interface Stats {
  totalStudents: number;
  withPhoneCount: number;
  optedInCount: number;
  optedOutCount: number;
}

export default function AdminMarketingPage() {
  const [students, setStudents] = useState<StudentContact[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [consentFilter, setConsentFilter] = useState<'all' | 'opted_in' | 'opted_out'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (consentFilter !== 'all') params.set('consent', consentFilter);

      const res = await fetch(`/api/admin/marketing/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to fetch marketing students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [consentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts();
  };

  const handleCopyPhone = (id: string, phone: string) => {
    if (!phone || phone === '—') return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleConsent = async (student: StudentContact) => {
    const newConsent = !student.whatsappConsent;
    setUpdatingId(student.id);

    try {
      const res = await fetch(`/api/admin/marketing/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappConsent: newConsent }),
      });

      if (res.ok) {
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, whatsappConsent: newConsent } : s))
        );
        if (stats) {
          setStats({
            ...stats,
            optedInCount: newConsent ? stats.optedInCount + 1 : stats.optedInCount - 1,
            optedOutCount: newConsent ? stats.optedOutCount - 1 : stats.optedOutCount + 1,
          });
        }
      }
    } catch (err) {
      console.error('Failed to update consent:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className={styles.pageHeader}>
        <div>
          <Link
            href="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: '0.75rem',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Admin Hub</span>
          </Link>
          <h1 className={styles.pageTitle}>WhatsApp Marketing & Student Contacts</h1>
          <p className={styles.pageSubtitle}>
            Manage student mobile numbers and export opted-in lists for course announcements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href="/api/admin/marketing/export?filter=opted_in" download>
            <Button variant="accent" size="md" leftIcon={<Download size={16} />}>
              Export Opted-In Numbers (.csv)
            </Button>
          </a>
          <a href="/api/admin/marketing/export?filter=all" download>
            <Button variant="outline" size="md" leftIcon={<Download size={16} />}>
              Export All Numbers (.csv)
            </Button>
          </a>
        </div>
      </div>

      {/* Compliance / Policy Callout */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-xl)',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <ShieldAlert size={28} color="#60a5fa" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: '#fff', display: 'block', marginBottom: '0.2rem' }}>
            Privacy & Anti-Spam Policy
          </strong>
          No automated messages are sent by this system. Only export and contact students who have given explicit consent for WhatsApp course announcements. Students can update their opt-out status anytime in their profile.
        </div>
      </div>

      {/* Metric Cards Row */}
      {stats && (
        <div className={styles.statsOverview} style={{ marginBottom: '2rem' }}>
          <div className={styles.adminStatCard}>
            <div className={styles.adminStatHeader}>
              <span>Total Students</span>
              <Users size={18} color="#94A3B8" />
            </div>
            <div className={styles.adminStatVal} style={{ color: '#FFFFFF' }}>
              {stats.totalStudents}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              Registered student accounts
            </div>
          </div>

          <div className={styles.adminStatCard}>
            <div className={styles.adminStatHeader}>
              <span>Mobile Numbers</span>
              <Phone size={18} color="#38BDF8" />
            </div>
            <div className={styles.adminStatVal} style={{ color: '#38BDF8' }}>
              {stats.withPhoneCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              Verified Indian mobile numbers
            </div>
          </div>

          <div className={styles.adminStatCard}>
            <div className={styles.adminStatHeader}>
              <span>WhatsApp Consented</span>
              <CheckCircle2 size={18} color="#34D399" />
            </div>
            <div className={styles.adminStatVal} style={{ color: '#34D399' }}>
              {stats.optedInCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              Opted in for course updates
            </div>
          </div>

          <div className={styles.adminStatCard}>
            <div className={styles.adminStatHeader}>
              <span>Opted Out</span>
              <XCircle size={18} color="#F87171" />
            </div>
            <div className={styles.adminStatVal} style={{ color: '#F87171' }}>
              {stats.optedOutCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              Do not message on WhatsApp
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px', maxWidth: '450px' }}
        >
          <Input
            placeholder="Search by student name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Consent Filter:
          </span>
          <Button
            variant={consentFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setConsentFilter('all')}
          >
            All Students
          </Button>
          <Button
            variant={consentFilter === 'opted_in' ? 'accent' : 'outline'}
            size="sm"
            onClick={() => setConsentFilter('opted_in')}
          >
            Consented Only
          </Button>
          <Button
            variant={consentFilter === 'opted_out' ? 'danger' : 'outline'}
            size="sm"
            onClick={() => setConsentFilter('opted_out')}
          >
            Opted Out
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchContacts} title="Refresh list">
            <RefreshCw size={15} />
          </Button>
        </div>
      </div>

      {/* Students Contact Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Mobile Number</th>
              <th>Email</th>
              <th>WhatsApp Consent</th>
              <th>Registered At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
                  Loading student marketing contacts...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                  No student contacts found matching current filters.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td data-label="Student Name">
                    <strong style={{ color: '#fff' }}>{s.name}</strong>
                  </td>
                  <td data-label="Mobile Number">
                    {s.hasPhone ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code
                          style={{
                            fontSize: '0.85rem',
                            color: '#38BDF8',
                            background: 'rgba(56, 189, 248, 0.1)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {s.phone}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(s.id, s.phone)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.2rem',
                          }}
                          title="Copy phone number"
                        >
                          {copiedId === s.id ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
                        Not provided
                      </span>
                    )}
                  </td>
                  <td data-label="Email">
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                      {s.email}
                    </span>
                  </td>
                  <td data-label="WhatsApp Consent">
                    {s.whatsappConsent ? (
                      <Badge variant="success" size="sm">
                        Opted In
                      </Badge>
                    ) : (
                      <Badge variant="error" size="sm">
                        Opted Out
                      </Badge>
                    )}
                  </td>
                  <td data-label="Registered At">
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                      {s.registeredAt}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleConsent(s)}
                      isLoading={updatingId === s.id}
                      title={s.whatsappConsent ? 'Switch to Opted Out' : 'Switch to Opted In'}
                    >
                      {s.whatsappConsent ? 'Mark Opt-Out' : 'Mark Opt-In'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
