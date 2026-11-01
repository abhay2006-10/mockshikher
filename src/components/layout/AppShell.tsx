'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/v2/Navbar';
import { Footer } from '@/components/v2/Footer';

interface AppShellProps {
  children: React.ReactNode;
  initialUser: {
    name: string;
    email: string;
    role: string;
    image?: string | null;
  } | null;
}

export default function AppShell({ children, initialUser }: AppShellProps) {
  const pathname = usePathname();

  // 1. Full-screen active exam attempt session (zero chrome)
  const isExamAttempt = pathname?.includes('/attempt');
  if (isExamAttempt) {
    return (
      <main id="exam-attempt-root" style={{ height: '100dvh', minHeight: '100dvh', overflow: 'hidden' }}>
        {children}
      </main>
    );
  }

  // 2. Dedicated Admin panel layout (AdminLayout provides its own sidebar & control center)
  const isAdmin = pathname?.startsWith('/admin');
  if (isAdmin) {
    return (
      <div id="admin-shell-root" style={{ minHeight: '100dvh', backgroundColor: 'var(--page, #F6F7FC)' }}>
        {children}
      </div>
    );
  }

  // 3. Test experience routes (/test/*) do not display the global footer
  const isTestRoute = pathname?.startsWith('/test/');

  return (
    <div id="app-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: 'var(--surface)' }}>
      <Navbar initialUser={initialUser} />
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      {!isTestRoute && <Footer />}
    </div>
  );
}
