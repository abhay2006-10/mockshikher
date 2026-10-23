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
  exam: {
    id: string;
    name: string;
    slug: string;
    price: number;
  };
  payment: {
    id: string;
    amount: number;
    status: string;
    gatewayOrderId: string;
    gatewayPaymentId: string | null;
  };
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  _count: {
    attempts: number;
    purchases: number;
  };
  purchases: PurchaseItem[];
  attempts: MockAttempt[];
}

interface StatsData {
  totalStudents: number;
  activeStudents: number;
  paidStudents: number;
  totalAttempts: number;
}

export default function AdminStudentActivityPage() {
  const [users, setUsers] = useState<StudentUser[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'attempted' | 'purchased'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<StudentUser | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'tests' | 'purchases'>('tests');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: search.trim(),
        filter,
        page: String(page),
        limit: '25',
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(data.stats || null);
        setTotalPages(data.pagination?.totalPages || 1);
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
  }, [search, filter, page]);

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

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <Link href="/admin" style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={18} />
            </Link>
            <h1 className={styles.pageTitle}>Student Activity &amp; Records</h1>
          </div>
          <p className={styles.pageSubtitle}>
            Monitor student engagement, track completed mock tests with scores, and view purchased exam packs in real time.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
          onClick={fetchUsers}
        >
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsOverview}>
        <div className={styles.adminStatCard}>
          <div className={styles.adminStatHeader}>
            <span>Total Registered Students</span>
            <span style={{ color: '#F5B301' }}><Users size={20} /></span>
          </div>
          <div className={styles.adminStatVal} style={{ color: '#F5B301' }}>
            {stats?.totalStudents?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Student accounts in database
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
            Students with at least 1 attempt
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
            Students who unlocked series
          </div>
        </div>

        <div className={styles.adminStatCard}>
          <div className={styles.adminStatHeader}>
            <span>Total Mock Tests Submitted</span>
            <span style={{ color: '#38BDF8' }}><Award size={20} /></span>
          </div>
          <div className={styles.adminStatVal} style={{ color: '#38BDF8' }}>
            {stats?.totalAttempts?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Authoritative submissions scored
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1rem',
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
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
            placeholder="Search student by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem 0.6rem 2.4rem',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setFilter('all'); setPage(1); }}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              background: filter === 'all' ? 'var(--color-primary-600)' : 'var(--color-bg-secondary)',
              borderColor: filter === 'all' ? 'var(--color-primary-600)' : 'var(--color-border)',
              color: filter === 'all' ? '#FFFFFF' : 'var(--color-text-secondary)',
            }}
          >
            All Students
          </button>
          <button
            onClick={() => { setFilter('attempted'); setPage(1); }}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              background: filter === 'attempted' ? '#10B981' : 'var(--color-bg-secondary)',
              borderColor: filter === 'attempted' ? '#10B981' : 'var(--color-border)',
              color: filter === 'attempted' ? '#FFFFFF' : 'var(--color-text-secondary)',
            }}
          >
            Has Attempted Tests
          </button>
          <button
            onClick={() => { setFilter('purchased'); setPage(1); }}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              background: filter === 'purchased' ? '#8B5CF6' : 'var(--color-bg-secondary)',
              borderColor: filter === 'purchased' ? '#8B5CF6' : 'var(--color-border)',
              color: filter === 'purchased' ? '#FFFFFF' : 'var(--color-text-secondary)',
            }}
          >
            Has Purchased Packs
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>Student</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>Registered</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>Mocks Given</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>Packs Purchased</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>Latest Activity</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-tertiary)', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                    Loading student activity...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No students match your search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const latestAttempt = u.attempts?.[0];
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
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{u.name || 'Unnamed Student'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                        {formatDate(u.createdAt)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.6rem',
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
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: u._count.purchases > 0 ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: u._count.purchases > 0 ? '#C4B5FD' : 'var(--color-text-tertiary)',
                          }}
                        >
                          <CreditCard size={12} />
                          {u._count.purchases} {u._count.purchases === 1 ? 'pack' : 'packs'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem' }}>
                        {latestAttempt ? (
                          <div>
                            <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                              {latestAttempt.mockTest.name}
                            </div>
                            <div style={{ color: '#F5B301', fontSize: '0.75rem' }}>
                              Score: {latestAttempt.score ?? 0} / {latestAttempt.totalMarks ?? 100} ({latestAttempt.accuracy ?? 0}% acc)
                            </div>
                          </div>
                        ) : u.purchases?.[0] ? (
                          <div style={{ color: '#A78BFA', fontWeight: 600 }}>
                            Purchased {u.purchases[0].exam.name}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)' }}>No activity yet</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => {
                            setSelectedUser(u);
                            setActiveModalTab('tests');
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
              Page {page} of {totalPages}
            </span>
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

      {/* Detailed Student Activity Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Student Profile: ${selectedUser.name || 'Student'}`}
          maxWidth="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* User Meta Card */}
            <div
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Email</span>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedUser.email}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Joined Date</span>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatDate(selectedUser.createdAt)}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Total Attempts</span>
                <p style={{ margin: 0, fontWeight: 700, color: '#34D399' }}>{selectedUser._count.attempts} Completed</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Unlocked Packs</span>
                <p style={{ margin: 0, fontWeight: 700, color: '#A78BFA' }}>{selectedUser._count.purchases} Series</p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveModalTab('tests')}
                style={{
                  padding: '0.5rem 1rem',
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
                Mock Test Attempts ({selectedUser.attempts?.length || 0})
              </button>
              <button
                onClick={() => setActiveModalTab('purchases')}
                style={{
                  padding: '0.5rem 1rem',
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
                Purchased Series ({selectedUser.purchases?.length || 0})
              </button>
            </div>

            {/* Tab 1: Mock Tests History */}
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
                            {att.mockTest.exam?.name || 'Exam'} • Submitted on {formatDate(att.submittedAt || att.startedAt)} • Time: {formatSeconds(att.timeTakenSeconds)}
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

            {/* Tab 2: Purchases History */}
            {activeModalTab === 'purchases' && (
              <div>
                {selectedUser.purchases.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    <CreditCard size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>This student has not purchased any test series yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
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
                              {pur.exam.name}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.2rem' }}>
                            Purchased on {formatDate(pur.purchasedAt)}
                            {pur.payment?.gatewayPaymentId && ` • Payment ID: ${pur.payment.gatewayPaymentId}`}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
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
                            ₹{pur.payment?.amount || ((pur.exam?.price === 199 || !pur.exam?.price) ? 149 : pur.exam?.price)} PAID
                          </span>
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
