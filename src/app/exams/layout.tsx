import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Government & Police Exam Mock Tests — Browse Exams',
  description:
    'Browse all available mock test series on Mockshikhar — HP Police Constable 2026, HP Patwari, SSC and more. Each exam includes free Mock 1 with bilingual questions, real exam pattern, and step-by-step solutions.',
  openGraph: {
    title: 'Browse All Exam Mock Tests — Mockshikhar',
    description:
      'Find your target government exam and start with a free bilingual mock test. HP Police Constable, HP Patwari and more.',
  },
};

export default function ExamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
