'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Activity,
  CreditCard,
  ArrowLeft,
  RefreshCw,
  Eye,
  Award,
  BookOpen,
  Zap,
  Phone,
  MessageSquare,
  Plus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import styles from '../admin.module.css';

interface MockAttempt {
  id: string;
  status: string;
  score: number | null;
  totalMarks: number | null;
  accuracy: number | null;
  percentage: number | null;
  correctCount: number | null;
  wrongCount: number | null;
  unansweredCount: number | null;
  timeTakenSeconds: number | null;
  startedAt: string;
  submittedAt: string | null;
  mockTest: {
    id: string;
    name: string;
    testNumber: number;
    totalQuestions: number;
    exam: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

interface PurchaseItem {
  id: string;
  purchasedAt: string;
  isTestMode?: boolean;
  exam: {
    id: string;
    name: string;
    slug: string;
    price: number;
    category?: string;
  };
  payment: {
    id: string;
    amount: number;
    status: string;
    gatewayOrderId: string;
    gatewayPaymentId: string | null;
  } | null;
}

interface PaymentItem {
  id: string;
  amount: number;
  status: string;
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  createdAt: string;
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    attempts: number;
    purchases: number;
    payments?: number;
  };
  purchases: PurchaseItem[];
  payments?: PaymentItem[];
  attempts: MockAttempt[];
}

interface StatsData {
  totalStudents: number;
  activeStudents: number;
  paidStudents: number;
  totalAttempts: number;
  totalRevenue?: number;
}

interface AvailableExam {
  id: string;
  name: string;
  slug: string;
  price: number;
  category?: string;
}

export default function AdminStudentActivityPage() {
  const [users, setUsers] = useState<StudentUser[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'attempted' | 'purchased' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_purchases' | 'most_attempts'>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<StudentUser | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'purchases' | 'tests' | 'payments'>('purchases');

  // Manual Access Grant State
  const [availableExams, setAvailableExams] = useState<AvailableExam[]>([]);
  const [selectedExamToGrant, setSelectedExamToGrant] = useState<string>('');
  const [grantReason, setGrantReason] = useState<string>('');
  const [isGranting, setIsGranting] = useState<boolean>(false);
  const [grantSuccessMsg, setGrantSuccessMsg] = useState<string | null>(null);
  const [grantErrorMsg, setGrantErrorMsg] = useState<string | null>(null);

  // Load available exams for the grant access dropdown
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch('/api/admin/exams');
        if (res.ok) {
          const data = await res.json();
          setAvailableExams(data.exams || []);
        }
      } catch (e) {
        console.error('Failed to load exams for admin:', e);
      }
    }
    loadExams();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: search.trim(),
        filter,
        sortBy,
        page: String(page),
        limit: '25',
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(data.stats || null);
        setTotalPages(data.pagination?.totalPages || 1);

        // If a user modal is currently open, refresh their data too
        if (selectedUser) {
          const updated = (data.users || []).find((u: StudentUser) => u.id === selectedUser.id);
          if (updated) setSelectedUser(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load student activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, filter, sortBy, page]);

  const handleGrantAccess = async () => {
    if (!selectedUser || !selectedExamToGrant) return;
    setIsGranting(true);
    setGrantSuccessMsg(null);
    setGrantErrorMsg(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant_access',
          userId: selectedUser.id,
          examId: selectedExamToGrant,
          reason: grantReason.trim() || 'Admin manual access grant',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGrantSuccessMsg(data.message || 'Access successfully granted!');
        setSelectedExamToGrant('');
        setGrantReason('');
        await fetchUsers();
      } else {
        setGrantErrorMsg(data.error || 'Failed to grant access');
      }
    } catch (err: any) {
      setGrantErrorMsg(err.message || 'Network error while granting access');
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevokeAccess = async (examId: string, examName: string) => {
    if (!selectedUser) return;
    if (!confirm(`Are you sure you want to revoke access to "${examName}" for this student?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_access',
          userId: selectedUser.id,
          examId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Access revoked successfully');
        await fetchUsers();
      } else {
        alert(data.error || 'Failed to revoke access');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to revoke access');
    }
  };

  const formatSeconds = (sec: number | null) => {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Helper to determine the latest activity between test attempts and purchases
  const getLatestActivity = (u: StudentUser) => {
    const latestAttempt = u.attempts?.[0];
    const latestPurchase = u.purchases?.[0];

    const attemptTime = latestAttempt
      ? new Date(latestAttempt.submittedAt || latestAttempt.startedAt).getTime()
      : 0;
    const purchaseTime = latestPurchase
      ? new Date(latestPurchase.purchasedAt).getTime()
      : 0;

    if (purchaseTime > 0 && purchaseTime >= attemptTime) {
      return {
        type: 'PURCHASE' as const,
        text: `Unlocked ${latestPurchase.exam?.name || 'Mock Series'}`,
        subText: `₹${latestPurchase.payment?.amount ?? latestPurchase.exam?.price ?? 1} • ${formatDate(latestPurchase.purchasedAt)}`,
        date: latestPurchase.purchasedAt,
      };
    }

    if (attemptTime > 0 && latestAttempt) {
      return {
        type: 'ATTEMPT' as const,
        text: latestAttempt.mockTest?.name || 'Mock Test',
        subText: `Score: ${latestAttempt.score ?? 0}/${latestAttempt.totalMarks ?? 100} (${latestAttempt.accuracy ?? 0}% acc) • ${formatDate(latestAttempt.submittedAt || latestAttempt.startedAt)}`,
        date: latestAttempt.submittedAt || latestAttempt.startedAt,
      };
    }

    return null;
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <Link href="/admin" style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={18} />
            </Link>
            <h1 className={styles.pageTitle} style={{ fontSize: '1.75rem', fontWeight: 800 }}>Student Activity &amp; Records</h1>
          </div>
          <p className={styles.pageSubtitle}>
            Real-time monitor of student signups, bundle purchases, payment transactions, and test submissions.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
          onClick={fetchUsers}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsOverview} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className={styles.adminStatCard}>
          <div className={styles.adminStatHeader}>
            <span>Total Students</span>
            <span style={{ color: '#F5B301' }}><Users size={20} /></span>
          </div>
          <div className={styles.adminStatVal} style={{ color: '#F5B301' }}>
            {stats?.totalStudents?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Registered aspirant accounts
          </div>
        </div>

        <div className={styles.adminStatCard}>
          <div className={styles.adminStatHeader}>
            <span>Enrolled Paid Students</span>
            <span style={{ color: '#A78BFA' }}><CreditCard size={20} /></span>
          </div>
          <div className={styles.adminStatVal} style={{ color: '#A78BFA' }}>
            {stats?.paidStudents?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Students with unlocked mock packs
          </div>
        </div>

        <div className={styles.adminStatCard}>
          <div className={styles.adminStatHeader}>
            <span>Active Test Takers</span>
            <span style={{ color: '#10B981' }}><Activity size={20} /></span>
          </div>
          <div className={styles.adminStatVal} style={{ color: '#10B981' }}>
            {stats?.activeStudents?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Attempted at least 1 mock
          </div>
        </div>

        <div className={styles.adminStatCard}>
          <div className={styles.adminStatHeader}>
            <span>Platform Revenue</span>
            <span style={{ color: '#38BDF8' }}><TrendingUp size={20} /></span>
          </div>
          <div className={styles.adminStatVal} style={{ color: '#38BDF8' }}>
            ₹{stats?.totalRevenue ? Number(stats.totalRevenue).toLocaleString('en-IN') : 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Total verified paid orders
          </div>
        </div>

        <div className={styles.adminStatCard}>
          <div className={styles.adminStatHeader}>
            <span>Mocks Submitted</span>
            <span style={{ color: '#F43F5E' }}><Award size={20} /></span>
          </div>
          <div className={styles.adminStatVal} style={{ color: '#F43F5E' }}>
            {stats?.totalAttempts?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Completed &amp; scored test attempts
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem',
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '480px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
            }}
          />
          <input
            type="text"
            placeholder="Search by student name, email, phone, or exam..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.65rem 2.2rem 0.65rem 2.4rem',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--color-bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: filter === 'all' ? 'var(--color-primary-600)' : 'transparent',
                color: filter === 'all' ? '#FFFFFF' : 'var(--color-text-secondary)',
              }}
            >
              All Students
            </button>
            <button
              onClick={() => { setFilter('purchased'); setPage(1); }}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: filter === 'purchased' ? '#8B5CF6' : 'transparent',
                color: filter === 'purchased' ? '#FFFFFF' : 'var(--color-text-secondary)',
              }}
            >
              Paid Packs {stats?.paidStudents ? `(${stats.paidStudents})` : ''}
            </button>
            <button
              onClick={() => { setFilter('attempted'); setPage(1); }}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: filter === 'attempted' ? '#10B981' : 'transparent',
                color: filter === 'attempted' ? '#FFFFFF' : 'var(--color-text-secondary)',
              }}
            >
              Has Attempts
            </button>
            <button
              onClick={() => { setFilter('inactive'); setPage(1); }}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: filter === 'inactive' ? '#6B7280' : 'transparent',
                color: filter === 'inactive' ? '#FFFFFF' : 'var(--color-text-secondary)',
              }}
            >
              Inactive
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            style={{
              padding: '0.55rem 0.85rem',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="newest">Sort: Newest Signups</option>
            <option value="most_purchases">Sort: Most Packs Owned</option>
            <option value="most_attempts">Sort: Most Tests Taken</option>
            <option value="oldest">Sort: Oldest Signups</option>
          </select>
        </div>
      </div>

      {/* Students Master Table */}
      <div
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>Student Profile</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>Registered</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>Mocks Given</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>Purchased Bundles</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>Latest Activity</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                    Loading student activity records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    <Users size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No students match your filter or search query.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const activity = getLatestActivity(u);
                  const totalSpent = u.purchases?.reduce((acc, p) => acc + (p.payment?.amount || p.exam?.price || 1), 0) || 0;

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Student Profile Info */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                            {u.name || 'Unnamed Student'}
                          </span>
                          {u.purchases && u.purchases.length > 0 && (
                            <span
                              title="Paid Subscriber"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                background: 'rgba(167, 139, 250, 0.2)',
                                color: '#C4B5FD',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                              }}
                            >
                              PAID
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: '0.15rem' }}>
                          {u.email}
                        </div>
                        {u.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            <Phone size={11} color="#10B981" />
                            <span>{u.phone}</span>
                            <a
                              href={`https://wa.me/91${u.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat on WhatsApp"
                              style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', marginLeft: '0.2rem' }}
                            >
                              <MessageSquare size={12} />
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatShortDate(u.createdAt)}
                      </td>

                      {/* Mocks Attempted */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: u._count.attempts > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: u._count.attempts > 0 ? '#34D399' : 'var(--color-text-tertiary)',
                          }}
                        >
                          <Activity size={12} />
                          {u._count.attempts} {u._count.attempts === 1 ? 'mock' : 'mocks'}
                        </span>
                      </td>

                      {/* Purchased Exam Bundles & Total Spent */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {u.purchases && u.purchases.length > 0 ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: 'rgba(167, 139, 250, 0.18)',
                                  color: '#C4B5FD',
                                }}
                              >
                                <CreditCard size={12} />
                                {u.purchases.length} {u.purchases.length === 1 ? 'pack' : 'packs'}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>
                                (₹{totalSpent})
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {u.purchases.map((p) => (
                                <span
                                  key={p.id}
                                  title={`Purchased on ${formatDate(p.purchasedAt)}`}
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    color: 'var(--color-text-primary)',
                                    border: '1px solid var(--color-border)',
                                    maxWidth: '220px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {p.exam?.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'rgba(255, 255, 255, 0.04)',
                              color: 'var(--color-text-tertiary)',
                            }}
                          >
                            0 packs
                          </span>
                        )}
                      </td>

                      {/* Latest Activity (Intelligent Purchase/Attempt resolution) */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', minWidth: '220px' }}>
                        {activity ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: activity.type === 'PURCHASE' ? '#C4B5FD' : 'var(--color-text-primary)' }}>
                              {activity.type === 'PURCHASE' ? (
                                <Zap size={13} color="#F5B301" />
                              ) : (
                                <BookOpen size={13} color="#34D399" />
                              )}
                              <span>{activity.text}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.15rem' }}>
                              {activity.subText}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>No activity recorded</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => {
                            setSelectedUser(u);
                            setActiveModalTab('purchases');
                            setGrantSuccessMsg(null);
                            setGrantErrorMsg(null);
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div>
              Page <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{page}</span> of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Student Detail & Access Management Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setGrantSuccessMsg(null);
            setGrantErrorMsg(null);
          }}
          title={`Student Profile: ${selectedUser.name || 'Unnamed Student'}`}
          maxWidth="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* User Meta Banner */}
            <div
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Email Address</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{selectedUser.email}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Mobile Number</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedUser.phone ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {selectedUser.phone}
                      <a
                        href={`https://wa.me/91${selectedUser.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center' }}
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare size={14} />
                      </a>
                    </span>
                  ) : (
                    'Not provided'
                  )}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Joined Platform</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatDate(selectedUser.createdAt)}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Unlocked Exam Bundles</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 700, color: '#A78BFA' }}>
                  {selectedUser._count.purchases} {selectedUser._count.purchases === 1 ? 'Series' : 'Series'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Mock Tests Given</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 700, color: '#34D399' }}>
                  {selectedUser._count.attempts} Completed
                </p>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveModalTab('purchases')}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeModalTab === 'purchases' ? 'var(--color-primary-600)' : 'transparent',
                  color: activeModalTab === 'purchases' ? '#FFFFFF' : 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <CreditCard size={16} />
                Purchased Series &amp; Access ({selectedUser.purchases?.length || 0})
              </button>
              <button
                onClick={() => setActiveModalTab('tests')}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeModalTab === 'tests' ? 'var(--color-primary-600)' : 'transparent',
                  color: activeModalTab === 'tests' ? '#FFFFFF' : 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Activity size={16} />
                Mock Test History ({selectedUser.attempts?.length || 0})
              </button>
              <button
                onClick={() => setActiveModalTab('payments')}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeModalTab === 'payments' ? 'var(--color-primary-600)' : 'transparent',
                  color: activeModalTab === 'payments' ? '#FFFFFF' : 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Clock size={16} />
                Transactions ({selectedUser.payments?.length || 0})
              </button>
            </div>

            {/* Tab 1: Purchased Exam Bundles & Direct Access Management */}
            {activeModalTab === 'purchases' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Unlocked Series List */}
                <div>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} color="#10B981" />
                    Currently Unlocked Mock Test Series
                  </h4>

                  {selectedUser.purchases.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-tertiary)' }}>
                      <CreditCard size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>This student has not purchased any mock series yet.</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>You can manually grant access below if they paid offline or via UPI.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto' }}>
                      {selectedUser.purchases.map((pur) => (
                        <div
                          key={pur.id}
                          style={{
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Zap size={16} color="#F5B301" />
                              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                                {pur.exam?.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: '#34D399',
                                  fontWeight: 800,
                                }}
                              >
                                ACTIVE ACCESS
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.2rem' }}>
                              Purchased on {formatDate(pur.purchasedAt)}
                              {pur.payment?.gatewayPaymentId && ` • Ref: ${pur.payment.gatewayPaymentId}`}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#34D399',
                              }}
                            >
                              ₹{pur.payment?.amount || pur.exam?.price || 1} PAID
                            </span>
                            <button
                              onClick={() => handleRevokeAccess(pur.exam.id, pur.exam.name)}
                              style={{
                                background: 'none',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#F87171',
                                padding: '0.25rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manual Access Grant Box */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <Plus size={16} color="var(--color-primary-400)" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Manually Grant Exam Access
                    </h4>
                  </div>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                    Instantly unlock any mock test bundle for this student (useful for manual UPI, direct payment, or support).
                  </p>

                  {grantSuccessMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: 'var(--radius-md)', color: '#34D399', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                      <CheckCircle2 size={16} />
                      <span>{grantSuccessMsg}</span>
                    </div>
                  )}

                  {grantErrorMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: 'var(--radius-md)', color: '#F87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                      <AlertCircle size={16} />
                      <span>{grantErrorMsg}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                      value={selectedExamToGrant}
                      onChange={(e) => setSelectedExamToGrant(e.target.value)}
                      style={{
                        padding: '0.6rem 0.85rem',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    >
                      <option value="">-- Choose Exam Bundle to Unlock --</option>
                      {availableExams.map((ex) => {
                        const isAlreadyOwned = selectedUser.purchases.some((p) => p.exam.id === ex.id || p.exam.slug === ex.slug);
                        return (
                          <option key={ex.id} value={ex.id} disabled={isAlreadyOwned}>
                            {ex.name} (₹{ex.price}) {isAlreadyOwned ? '— [ALREADY UNLOCKED]' : ''}
                          </option>
                        );
                      })}
                    </select>

                    <input
                      type="text"
                      placeholder="Optional reason (e.g. Paid via GPay)"
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      style={{
                        padding: '0.6rem 0.85rem',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!selectedExamToGrant || isGranting}
                      onClick={handleGrantAccess}
                    >
                      {isGranting ? 'Unlocking...' : 'Unlock Bundle'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Mock Tests History */}
            {activeModalTab === 'tests' && (
              <div>
                {selectedUser.attempts.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    <BookOpen size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>This student has not attempted any mock tests yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
                    {selectedUser.attempts.map((att) => (
                      <div
                        key={att.id}
                        style={{
                          background: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                              {att.mockTest.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                background: att.status === 'SUBMITTED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 179, 1, 0.2)',
                                color: att.status === 'SUBMITTED' ? '#34D399' : '#F5B301',
                                fontWeight: 700,
                              }}
                            >
                              {att.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.2rem' }}>
                            {att.mockTest.exam?.name || 'Exam'} • Submitted on {formatDate(att.submittedAt || att.startedAt)} • Duration: {formatSeconds(att.timeTakenSeconds)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Score</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F5B301' }}>
                              {att.score ?? 0} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>/ {att.totalMarks ?? 100}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Accuracy</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8' }}>
                              {att.accuracy ?? 0}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Transactions & Payment Attempts */}
            {activeModalTab === 'payments' && (
              <div>
                {!selectedUser.payments || selectedUser.payments.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    <Clock size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No transaction logs recorded for this account.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
                    {selectedUser.payments.map((pmt) => (
                      <div
                        key={pmt.id}
                        style={{
                          background: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                background: pmt.status === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : pmt.status === 'FAILED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 179, 1, 0.2)',
                                color: pmt.status === 'PAID' ? '#34D399' : pmt.status === 'FAILED' ? '#F87171' : '#F5B301',
                                fontWeight: 800,
                              }}
                            >
                              {pmt.status}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              ₹{pmt.amount}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.2rem' }}>
                            Date: {formatDate(pmt.createdAt)} • Order: {pmt.gatewayOrderId}
                            {pmt.gatewayPaymentId && ` • Payment ID: ${pmt.gatewayPaymentId}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
