import React from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
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
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import styles from './admin.module.css';

export default async function AdminPage() {
  const session = await auth();

  // Server-side admin check strictly from database role
  const role = (session?.user as any)?.role;
  const isAdmin = role === 'ADMIN';

  if (!isAdmin) {
    redirect('/');
  }

  // Stats snapshot (would come from DB in production)
  const stats = [
    {
      label: 'Total Questions',
      value: '90',
      sub: 'In Mock Test 1',
      icon: <Layers size={20} />,
      color: '#F5B301',
    },
    {
      label: 'Mock Tests',
      value: '10',
      sub: '1 Published, 9 Drafts',
      icon: <BookOpen size={20} />,
      color: '#38BDF8',
    },
    {
      label: 'Total Attempts',
      value: '1,420',
      sub: 'Across all tests',
      icon: <Activity size={20} />,
      color: '#10B981',
    },
    {
      label: 'Exams Configured',
      value: '4',
      sub: 'HP Police, Patwari, Forest, SSC GD',
      icon: <ShieldCheck size={20} />,
      color: '#A78BFA',
    },
  ];

  const actions = [
    {
      title: 'Add a Single Question',
      description: 'Author a bilingual question with English and Hindi text, 4 options, correct answer, explanation and difficulty.',
      href: '/admin/questions',
      label: 'Open Question Authoring →',
      icon: <Layers size={28} />,
      color: '#F5B301',
    },
    {
      title: 'Bulk Import (CSV / Excel)',
      description: 'Upload up to 500+ questions at once. Preview validation results before committing. Download the template first.',
      href: '/admin/questions',
      label: 'Open Bulk Importer →',
      icon: <FileSpreadsheet size={28} />,
      color: '#10B981',
    },
    {
      title: 'Publishing & Readiness',
      description: 'Check which mock tests are ready to publish (all required questions present). Publish or unpublish with one click.',
      href: '/admin/questions',
      label: 'Open Publishing Control →',
      icon: <CheckCircle2 size={28} />,
      color: '#38BDF8',
    },
  ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Control Centre</h1>
          <p className={styles.pageSubtitle}>
            Welcome back, <strong>{session?.user?.name || 'Admin'}</strong>. Manage questions, tests, and publishing from here.
          </p>
        </div>
      </div>

      {/* Stats Row */}
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
        Quick Actions
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
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

      {/* Status Warning */}
      <div style={{
        background: 'rgba(245, 179, 1, 0.08)',
        border: '1px solid rgba(245, 179, 1, 0.25)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-5)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start',
      }}>
        <AlertTriangle size={20} color="#F5B301" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.3rem 0' }}>
            Mock Tests 2–10 Need Questions Before Publishing
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Only Mock Test 1 is fully published (90/90 questions). Mocks 2–10 are in draft and hidden from students.
            Use the <strong style={{ color: '#F5B301' }}>Bulk Import</strong> tab to add questions efficiently.
            Then use <strong style={{ color: '#F5B301' }}>Publishing Control</strong> to verify readiness and publish.
          </p>
        </div>
      </div>
    </div>
  );
}
