import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from 'next/font/google';
import AppShell from '@/components/layout/AppShell';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: '--font-noto-sans-devanagari',
  subsets: ['devanagari', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#4338CA',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mockshikhar.com'),
  title: {
    default: 'Mockshikhar — Government Exam Mock Test Series | Affordable Online Practice',
    template: '%s | Mockshikhar',
  },
  description:
    'Practice realistic full-length bilingual mock tests for Himachal Pradesh government exams (HP Patwari, HP Police, HP Judiciary Clerk & Process Server). Instant scorecard, deep performance analysis, auto mistake book. Free mock test available.',
  keywords: [
    'Mockshikhar',
    'HP Government exam mock test',
    'HP Patwari mock test',
    'HP Police Constable 2026',
    'HP Judiciary Clerk mock test',
    'HP Judiciary Process Server mock test',
    'Himachal Pradesh competitive exams',
    'HP GK questions',
    'bilingual mock test series',
    'online mock test Hindi English',
  ],
  authors: [{ name: 'Mockshikhar' }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://mockshikhar.com',
    siteName: 'Mockshikhar',
    title: 'Mockshikhar — Government Exam Mock Test Series',
    description:
      'Prepare smarter for HP government exams with realistic bilingual mock tests, instant rank analysis, and step-by-step solutions.',
    images: [
      {
        url: 'https://mockshikhar.com/logo-square.png',
        width: 512,
        height: 512,
        alt: 'MockShikhar Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mockshikhar — Government Exam Mock Test Series',
    description:
      'Affordable bilingual mock test series for Himachal Pradesh competitive exams. Free sample mocks available.',
    images: ['https://mockshikhar.com/logo-square.png'],
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
    <html lang="en" className={`${plusJakartaSans.variable} ${notoSansDevanagari.variable}`}>
      <body>
        <AuthProvider session={session}>
          <AppShell initialUser={initialUser}>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
