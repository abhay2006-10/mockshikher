// Server component — fetches real exam data from DB
// No 'use client' here

import { prisma } from '@/lib/prisma';
import { LANDING_EXAMS } from '@/lib/landing-exams';
import { POPULAR_EXAMS, type MockExam } from '@/lib/mock-data';
import HomePageClient from './HomePageClient';

export const revalidate = 60;

/**
 * Fetch real exam data from DB for the 6 landing exams config.
 * Returns the count of published exams (isArchived=false) and per-slug data.
 */
async function getLandingPageData() {
  try {
    const [publishedExamCount, dbExams, archivedExams] = await Promise.all([
      prisma.exam.count({
        where: { isArchived: false },
      }),
      prisma.exam.findMany({
        where: {
          slug: { in: LANDING_EXAMS.map((e) => e.slug) },
          isArchived: false,
        },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          category: true,
          price: true,
          totalQuestions: true,
          durationMinutes: true,
          difficulty: true,
          isPopular: true,
          subjects: {
            select: { id: true, name: true, nameHi: true },
            orderBy: { sortOrder: 'asc' },
          },
          mockTests: {
            where: { isPublished: true },
            select: { id: true, isFree: true, totalQuestions: true, durationMinutes: true },
          },
        },
      }),
      prisma.exam.findMany({
        where: { isArchived: true },
        select: { slug: true },
      }),
    ]);

    const archivedSlugs = new Set(archivedExams.map((e) => e.slug));
    const dbMap = new Map(dbExams.map((e) => [e.slug, e]));

    return { publishedExamCount, dbMap, archivedSlugs };
  } catch {
    // If DB is unreachable, fall back to static mock data gracefully
    const dbMap = new Map<string, (typeof POPULAR_EXAMS)[0]>();
    return { publishedExamCount: POPULAR_EXAMS.length, dbMap, archivedSlugs: new Set<string>() };
  }
}

export default async function HomePage() {
  const { publishedExamCount, dbMap, archivedSlugs } = await getLandingPageData();

  // Build the exam list for the landing page in config order
  const landingExams = LANDING_EXAMS.filter((c) => !archivedSlugs.has(c.slug)).map((config) => {
    const db = dbMap.get(config.slug);

    if (config.isComingSoon || !db) {
      return {
        isComingSoon: true as const,
        slug: config.slug,
        name: config.name,
        description: config.description,
        category: config.category,
      };
    }

    // Build a MockExam-like object from DB data
    const mockTests = 'mockTests' in db && Array.isArray(db.mockTests) ? db.mockTests : [];
    const freeMocks = mockTests.filter((t: { isFree: boolean }) => t.isFree).length;
    const totalMocks = mockTests.length;

    // Fallback: if no subjects in DB, use mock-data subjects
    const staticExam = POPULAR_EXAMS.find((e) => e.slug === config.slug);
    const dbSubjects = 'subjects' in db && Array.isArray(db.subjects) ? db.subjects : [];
    const subjects =
      dbSubjects.length > 0
        ? dbSubjects.map((s: { id: string; name: string; nameHi?: string | null }) => ({
            id: s.id,
            name: s.name,
            nameHi: s.nameHi || s.name,
            questionCount: 0, // not needed for card display
          }))
        : staticExam?.subjects || [];

    const mockExam: MockExam = {
      id: db.id,
      name: db.name,
      slug: db.slug,
      description: db.description,
      totalQuestions: db.totalQuestions,
      durationMinutes: db.durationMinutes,
      difficulty: db.difficulty as MockExam['difficulty'],
      price: db.price,
      originalPrice: staticExam?.originalPrice ?? db.price * 3,
      isPopular: db.isPopular,
      category: config.category, // use config category label
      totalMocks: totalMocks > 0 ? totalMocks : staticExam?.totalMocks ?? 10,
      freeMocks: freeMocks > 0 ? freeMocks : staticExam?.freeMocks ?? 1,
      subjects,
    };

    return { isComingSoon: false as const, exam: mockExam };
  });

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MockShikhar',
    url: 'https://mockshikhar.com',
    logo: 'https://mockshikhar.com/logo-square.png',
    image: 'https://mockshikhar.com/logo.svg',
    description:
      'Premier mock test series for Himachal Pradesh government exams (HP Patwari, HP Police, HP Judiciary Clerk & Process Server).',
    sameAs: ['https://www.instagram.com/himshikhar8262'],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-7876725758, +91-8262910464',
      contactType: 'customer support',
      email: 'mockshikhar@gmail.com',
      availableLanguage: ['English', 'Hindi'],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomePageClient
        landingExams={landingExams}
        publishedExamCount={publishedExamCount}
        showGoogle={!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
      />
    </>
  );
}
