import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Mockshikhar — Affordable Mock Tests for Government Exams',
    template: '%s | Mockshikhar',
  },
  description:
    'Practice with realistic full-length mock tests for HP Police and other government exams. Get detailed performance analysis, track your progress, and improve your score. Starting at just ₹149.',
  keywords: [
    'Mockshikhar',
    'mock test',
    'government exam',
    'HP Police',
    'online test',
    'exam preparation',
    'practice test',
    'competitive exam',
  ],
  authors: [{ name: 'Mockshikhar' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Mockshikhar',
    title: 'Mockshikhar — Affordable Mock Tests for Government Exams',
    description:
      'Practice with realistic full-length mock tests. Get detailed analysis and improve your score.',
  },
};

import { auth } from '@/lib/auth';
import AuthProvider from '@/components/providers/AuthProvider';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const initialUser = session?.user
    ? {
        name: session.user.name || 'User',
        email: session.user.email || '',
        role: (session.user as any).role || 'USER',
        image: session.user.image,
      }
    : null;

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <AuthProvider>
          <div id="app-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header initialUser={initialUser} />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
