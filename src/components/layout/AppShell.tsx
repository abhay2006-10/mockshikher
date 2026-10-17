'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

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
  // Check if current page is an active exam attempt session
  const isExamAttempt = pathname?.includes('/attempt');

  if (isExamAttempt) {
    return (
      <main id="exam-attempt-root" style={{ height: '100dvh', minHeight: '100dvh', overflow: 'hidden' }}>
        {children}
      </main>
    );
  }

  return (
    <div id="app-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Header initialUser={initialUser} />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
