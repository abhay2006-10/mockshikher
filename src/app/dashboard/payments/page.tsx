'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Receipt,
  Layers,
  RefreshCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import styles from '../dashboard.module.css';

interface PaymentRecord {
  id: string;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  rawDate: string;
  examName: string;
  examSlug: string;
  mockCount: number;
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/payments', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load payment history.');
      }
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load payment history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalMocks = payments.reduce((sum, p) => sum + p.mockCount, 0);

  return (
    <div className={styles.container}>
      {/* Top Navigation */}
      <div>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-primary-600, #38bdf8)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header Banner */}
      <header className={styles.welcomeBanner}>
        <div className={styles.welcomeLeft}>
          <div className={styles.badgeRow}>
            <Badge variant="accent" size="sm">
              <Receipt size={12} />
              <span>Billing & Subscriptions</span>
            </Badge>
          </div>
          <h1 className={styles.welcomeTitle}>Payment & Subscription History</h1>
          <p className={styles.welcomeSubtitle}>
            Review your verified transactions, payment receipts, and permanently unlocked mock test bundles.
          </p>
        </div>

        <div className={styles.welcomeAction}>
          <Link href="/exams">
            <Button variant="accent" size="md" rightIcon={<ArrowRight size={16} />}>
              Explore Test Series
            </Button>
          </Link>
        </div>
      </header>

      {/* Summary Metrics Grid */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Purchased Series</span>
            <div className={styles.statIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className={styles.statNumber}>{payments.length}</div>
          <span className={styles.statMeta}>Lifetime Unlocked Exams</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Full Mocks Unlocked</span>
            <div className={styles.statIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className={styles.statNumber}>{totalMocks}</div>
          <span className={styles.statMeta}>Available to Attempt Anytime</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total Invested</span>
            <div className={styles.statIconBox} style={{ background: 'rgba(245, 179, 1, 0.15)', color: '#fbbf24' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className={styles.statNumber}>₹{totalSpent}</div>
          <span className={styles.statMeta}>Verified Razorpay Transactions</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Access Validity</span>
            <div className={styles.statIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className={styles.statNumber} style={{ fontSize: '1.25rem', paddingTop: '0.4rem' }}>
            Unlimited
          </div>
          <span className={styles.statMeta}>Permanent Student Access</span>
        </div>
      </section>

      {/* Payment Records Table Section */}
      <section className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Transaction Receipts</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Verified order records synced directly with the payment gateway.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchPayments}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary-600, #38bdf8)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        <div className={styles.historyTableWrapper}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Purchased Test Series</th>
                <th>Payment Date</th>
                <th>Amount Paid</th>
                <th>Mocks Included</th>
                <th>Status</th>
                <th>Transaction / Order ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                    <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
                    <p>Loading your verified transactions...</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                    <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                      No payment records found on your account.
                    </p>
                    <Link href="/exams">
                      <Button variant="accent" size="sm">
                        Browse Test Series
                      </Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{p.examName}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                          Full Exam Test Series
                        </span>
                      </div>
                    </td>
                    <td>{p.date}</td>
                    <td>
                      <span className={styles.scoreHighlight} style={{ fontSize: '1.05rem' }}>
                        ₹{p.amount}
                      </span>
                    </td>
                    <td>
                      <Badge variant="accent" size="sm">
                        {p.mockCount} Mock Tests
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="success" size="sm">
                        Verified PAID
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <code
                          style={{
                            fontSize: '0.8rem',
                            background: 'var(--color-bg-secondary)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {p.transactionId}
                        </code>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                          Order: {p.orderId}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Link href={`/exams/${p.examSlug}`}>
                        <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={13} />}>
                          Attempt Mocks
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
