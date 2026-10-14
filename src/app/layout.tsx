import type { Metadata, Viewport } from 'next';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F0F1A',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mockshikhar.com'),
  title: {
    default: 'Mockshikhar — HP Police Constable Mock Test Series 2026 | Affordable Online Practice',
    template: '%s | Mockshikhar',
  },
  description:
    'Practice HP Police Constable 2026 mock tests online at ₹149. Bilingual (Hindi & English) full-length tests with real exam pattern, negative marking, instant scorecard, mistake book & detailed solutions. Free Mock 1 available.',
  keywords: [
    'Mockshikhar',
    'HP Police mock test',
    'HP Police Constable 2026',
    'HP Police Constable mock test series',
    'HP Police online test',
    'Himachal Pradesh Police exam preparation',
    'HP Police practice test',
    'HP Police Constable syllabus 2026',
    'HP GK questions',
    'HP Police bilingual mock test',
    'government exam mock test',
    'HP Patwari mock test',
    'HP Police Constable free mock test',
    'competitive exam preparation India',
    'online mock test Hindi English',
  ],
  authors: [{ name: 'Mockshikhar' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://mockshikhar.com',
    siteName: 'Mockshikhar',
    title: 'Mockshikhar — HP Police Constable Mock Test Series 2026',
    description:
      'Practice with realistic full-length bilingual mock tests for HP Police Constable 2026. Instant scorecard, deep analysis, auto mistake book — starting at just ₹149.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mockshikhar — HP Police Constable Mock Tests 2026',
    description:
      'Affordable bilingual mock test series for HP Police Constable exam. Free Mock 1 available. Start practicing now!',
  },
  robots: {
    index: true,
    follow: true,
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
          <div id="app-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
            <Header initialUser={initialUser} />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
