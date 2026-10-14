// Server component — fetches real exam data from DB
// No 'use client' here

import { prisma } from '@/lib/prisma';
import { LANDING_EXAMS } from '@/lib/landing-exams';
import { POPULAR_EXAMS, type MockExam } from '@/lib/mock-data';
import HomePageClient from './HomePageClient';

/**
 * Fetch real exam data from DB for the 6 landing exams config.
 * Returns the count of published exams (isArchived=false) and per-slug data.
 */
async function getLandingPageData() {
  try {
    // Count all real published (non-archived) exams
    const publishedExamCount = await prisma.exam.count({
      where: { isArchived: false },
    });

    // Fetch all exams that match our landing config slugs
    const dbExams = await prisma.exam.findMany({
      where: {
        slug: { in: LANDING_EXAMS.map((e) => e.slug) },
        isArchived: false,
      },
      include: {
        subjects: {
          select: { id: true, name: true, nameHi: true },
          orderBy: { sortOrder: 'asc' },
        },
        mockTests: {
          where: { isPublished: true },
          select: { id: true, isFree: true, totalQuestions: true, durationMinutes: true },
        },
      },
    });

    const archivedExams = await prisma.exam.findMany({
      where: { isArchived: true },
      select: { slug: true },
    });
    const archivedSlugs = new Set(archivedExams.map((e) => e.slug));

    // Build a lookup map slug → db exam
    const dbMap = new Map(dbExams.map((e) => [e.slug, e]));

    return { publishedExamCount, dbMap, archivedSlugs };
  } catch {
    // If DB is unreachable, fall back to static mock data gracefully
    const dbMap = new Map<string, any>();
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
    const freeMocks = db.mockTests.filter((t: any) => t.isFree).length;
    const totalMocks = db.mockTests.length;

    // Fallback: if no subjects in DB, use mock-data subjects
    const staticExam = POPULAR_EXAMS.find((e) => e.slug === config.slug);
    const subjects =
      db.subjects.length > 0
        ? db.subjects.map((s: any) => ({
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

  return (
    <HomePageClient
      landingExams={landingExams}
      publishedExamCount={publishedExamCount}
      showGoogle={!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
    />
  );
}
