'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  ShieldCheck,
  Upload,
  CheckSquare,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/admin', icon: <LayoutDashboard size={18} />, exact: true },
    { label: 'Exams & Tests', href: '/admin/exams', icon: <BookOpen size={18} />, exact: false },
    { label: 'Question Bank', href: '/admin/questions', icon: <Layers size={18} />, exact: false },
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={20} color="#F5B301" />
            <h2 className={styles.sidebarTitle}>Mockshikhar Admin</h2>
          </div>
          <span className={styles.sidebarSub}>Control Center</span>
        </div>

        <nav className={styles.navMenu}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href, item.exact) ? styles.navItemActive : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <Link href="/" className={styles.navItem} style={{ fontSize: '0.8rem' }}>
            <ArrowLeft size={16} />
            <span>Back to Student Site</span>
          </Link>
        </div>
      </aside>

      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
