import React from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  Activity,
  ShieldCheck,
  History,
  Clock,
  Sparkles,
  Phone,
  Tag,
} from 'lucide-react';
import styles from './admin.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth();

  // Server-side admin verification strictly from database role
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  let dbUser = null;
  if (userId) {
    dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });
  } else if (userEmail) {
    dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, role: true },
    });
  }

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/');
  }

  // Live PostgreSQL database stats
  const [
    totalQuestionsCount,
    totalMocksCount,
    publishedMocksCount,
    totalAttemptsCount,
    activeExamsCount,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.question.count(),
    prisma.mockTest.count(),
    prisma.mockTest.count({ where: { isPublished: true } }),
    prisma.testAttempt.count(),
    prisma.exam.count({ where: { isArchived: false } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  const draftMocksCount = totalMocksCount - publishedMocksCount;

  const stats = [
    {
      label: 'Total Questions',
      value: totalQuestionsCount.toLocaleString(),
      sub: 'Across all mock tests in database',
      icon: <Layers size={20} />,
      color: '#F5B301',
    },
    {
      label: 'Mock Tests',
      value: totalMocksCount.toLocaleString(),
      sub: `${publishedMocksCount} Published, ${draftMocksCount} Drafts`,
      icon: <BookOpen size={20} />,
      color: '#38BDF8',
    },
    {
      label: 'Student Attempts',
      value: totalAttemptsCount.toLocaleString(),
      sub: 'Recorded in PostgreSQL',
      icon: <Activity size={20} />,
      color: '#10B981',
    },
    {
      label: 'Active Exam Series',
      value: activeExamsCount.toLocaleString(),
      sub: 'Live on student site',
      icon: <ShieldCheck size={20} />,
      color: '#A78BFA',
    },
  ];

  const actions = [
    {
      title: 'Student Activity & Records',
      description: 'Track which mock tests students attempted, view real scores, accuracy percentages, and inspect purchased exam packs.',
      href: '/admin/users',
      label: 'View Student Activity →',
      icon: <Users size={26} />,
      color: '#38BDF8',
    },
    {
      title: 'Exams & Mock Tests',
      description: 'Manage exam series, test scoring, duration overrides, add tests 1-10, and configure subjects/topics per exam.',
      href: '/admin/exams',
      label: 'Manage Exams & Mocks →',
      icon: <BookOpen size={26} />,
      color: '#A78BFA',
    },
    {
      title: 'Question Bank & Authoring',
      description: 'Filter questions by exam/mock/subject/difficulty. Author bilingual questions with 4 options and images.',
      href: '/admin/questions',
      label: 'Open Question Bank →',
      icon: <Layers size={26} />,
      color: '#F5B301',
    },
    {
      title: 'Bulk CSV / Excel Import',
      description: 'Drag & drop import with row-level validation, preview table, update-by-number, and student attempt protection.',
      href: '/admin/questions',
      label: 'Open Importer →',
      icon: <FileSpreadsheet size={26} />,
      color: '#10B981',
    },
    {
      title: 'WhatsApp Marketing & Contacts',
      description: 'Review student Indian mobile numbers, manage WhatsApp consent, and export broadcast-ready lists with opt-out compliance.',
      href: '/admin/marketing',
      label: 'Open WhatsApp Contacts →',
      icon: <Phone size={26} />,
      color: '#34D399',
    },
    {
      title: 'Promo Codes & Discounts',
      description: 'Generate, edit, enable/disable promo codes and configure discount amounts across all exams (e.g. ₹51 off for ₹149 price).',
      href: '/admin/promo-codes',
      label: 'Manage Promo Codes →',
      icon: <Tag size={26} />,
      color: '#818CF8',
    },
  ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Control Centre</h1>
          <p className={styles.pageSubtitle}>
            Welcome back, <strong>{dbUser.name || 'Admin'}</strong>. All metrics reflect live local PostgreSQL database values.
          </p>
        </div>
      </div>

      {/* Live Database Stats Row */}
      <div className={styles.statsOverview}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.adminStatCard}>
            <div className={styles.adminStatHeader}>
              <span>{stat.label}</span>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <div className={styles.adminStatVal} style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Cards */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem' }}>
        Admin Management Hub
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }} className="formGrid">
        {actions.map((action) => (
          <div
            key={action.title}
            style={{
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ color: action.color }}>{action.icon}</div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              {action.title}
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {action.description}
            </p>
            <Link
              href={action.href}
              style={{
                marginTop: 'auto',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: action.color,
                textDecoration: 'none',
              }}
            >
              {action.label}
            </Link>
          </div>
        ))}
      </div>

      {/* Recent Database Audit Logs Feed */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="#F5B301" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Recent Audit Log Entries (Database)
            </h3>
          </div>
          <Link
            href="/admin/questions"
            style={{ fontSize: '0.8rem', color: '#F5B301', textDecoration: 'none', fontWeight: 600 }}
          >
            View Full Audit Trail &rarr;
          </Link>
        </div>

        {recentAuditLogs.length === 0 ? (
          <div
            style={{
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '1.5rem',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}
          >
            No audit logs recorded yet in database.
          </div>
        ) : (
          <div
            style={{
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Author</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAuditLogs.map((log) => (
                  <tr key={log.id}>
                    <td data-label="Action">
                      <span
                        style={{
                          background: 'rgba(245, 179, 1, 0.1)',
                          border: '1px solid rgba(245, 179, 1, 0.3)',
                          color: '#F5B301',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td data-label="Details" style={{ color: '#E2E8F0', fontSize: '0.85rem' }}>
                      {log.details}
                    </td>
                    <td data-label="Author" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                      {log.author}
                    </td>
                    <td data-label="Timestamp" style={{ color: '#94A3B8', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td data-label="Status">
                      <span
                        style={{
                          color: log.status === 'SUCCESS' ? '#34D399' : '#F87171',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
