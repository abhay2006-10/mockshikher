'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckIcon } from '@/components/v2/Icons';
import styles from './payments.module.css';

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
    <main className={styles.container}>
      {/* Back to Dashboard */}
      <div>
        <Link href="/dashboard" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Payment History</h1>
          <p className={styles.subtitle}>
            Review your verified transactions, unlocked test series, and receipts.
          </p>
        </div>
        <Link href="/exams" className={styles.exploreBtn}>
          <span>Explore Test Series</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Metrics Grid */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Purchased Series</span>
          <span className={styles.statVal}>{payments.length}</span>
          <span className={styles.statMeta}>Unlocked Examination Series</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Full Mocks Unlocked</span>
          <span className={styles.statVal}>{totalMocks}</span>
          <span className={styles.statMeta}>Available to Attempt Anytime</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Invested</span>
          <span className={styles.statVal}>₹{totalSpent}</span>
          <span className={styles.statMeta}>Verified Razorpay Transactions</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Access Validity</span>
          <span className={styles.statVal}>1 Year</span>
          <span className={styles.statMeta}>Unlimited Re-attempts</span>
        </div>
      </section>

      {/* Transactions Table Panel */}
      <section className={styles.panel} aria-label="Transaction Receipts">
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Transaction Receipts</h2>
          <button
            type="button"
            onClick={fetchPayments}
            className={styles.refreshBtn}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {error && (
          <div style={{ color: '#DC2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        <div className={styles.tableWrapper}>
          {isLoading ? (
            <div className={styles.emptyState}>
              <span>Loading your payment records...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className={styles.emptyState}>
              <span>No payment records found. All free sample mocks can be accessed without payment.</span>
              <Link href="/exams" className={styles.exploreBtn} style={{ marginTop: 8 }}>
                <span>Browse All Exams</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Purchased Series</th>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Mocks</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className={styles.examName}>{p.examName}</span>
                        <span className={styles.examSub}>Full Exam Package</span>
                      </div>
                    </td>
                    <td>{p.date}</td>
                    <td>
                      <span className={styles.priceTag}>₹{p.amount}</span>
                    </td>
                    <td>
                      <span>{p.mockCount} tests</span>
                    </td>
                    <td>
                      <span className={styles.badgeVerified}>
                        <CheckIcon size={12} />
                        Verified
                      </span>
                    </td>
                    <td>
                      <code className={styles.txCode}>{p.transactionId}</code>
                    </td>
                    <td>
                      <Link href={`/exams/${p.examSlug}`} className={styles.openExamBtn}>
                        Open Series →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
