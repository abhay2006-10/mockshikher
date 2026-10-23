'use client';

import React, { useState } from 'react';
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
  Phone,
  Tag,
  Users,
  Menu,
  X,
} from 'lucide-react';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Overview', href: '/admin', icon: <LayoutDashboard size={18} />, exact: true },
    { label: 'Student Activity', href: '/admin/users', icon: <Users size={18} />, exact: false },
    { label: 'Exams & Tests', href: '/admin/exams', icon: <BookOpen size={18} />, exact: false },
    { label: 'Question Bank', href: '/admin/questions', icon: <Layers size={18} />, exact: false },
    { label: 'Promo Codes', href: '/admin/promo-codes', icon: <Tag size={18} />, exact: false },
    { label: 'WhatsApp Marketing', href: '/admin/marketing', icon: <Phone size={18} />, exact: false },
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div>
      {/* Mobile Topbar */}
      <div className={styles.mobileAdminBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="#F5B301" />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>Mockshikhar Admin</span>
        </div>
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle admin navigation"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={styles.adminContainer}>
        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            className={styles.sidebarBackdrop}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
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
                onClick={() => setSidebarOpen(false)}
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
    </div>
  );
}

