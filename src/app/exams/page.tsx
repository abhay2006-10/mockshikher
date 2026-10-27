import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { LANDING_EXAMS } from '@/lib/landing-exams';
import { POPULAR_EXAMS, type MockExam } from '@/lib/mock-data';
import { getCustomExamOrder, sortExamsByCustomOrder } from '@/lib/exam-order';
import ExamsPageClient, { type ExamItem } from './ExamsPageClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'All HP Government Exam Mock Tests — Mockshikhar',
  description:
    'Browse full-length bilingual mock tests for Himachal Pradesh government exams. Every exam includes 1 free sample mock.',
};

async function getExamsPageData() {
  try {
    // Migrate any legacy price rows in PostgreSQL to 1
    await prisma.exam.updateMany({
      where: { price: { in: [149, 199] } },
      data: { price: 1 },
    }).catch(() => {});

    const [dbExams, archivedExams] = await Promise.all([
      prisma.exam.findMany({
        where: { isArchived: false },
        select: {
          id: true,
          name: true,
          slug: true,
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
            select: {
              id: true,
              isFree: true,
              testNumber: true,
              totalQuestions: true,
              durationMinutes: true,
            },
            orderBy: { testNumber: 'asc' },
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

    // All distinct categories from DB exams and standard config
    const categoriesSet = new Set<string>();
    LANDING_EXAMS.forEach((c) => {
      if (!archivedSlugs.has(c.slug)) categoriesSet.add(c.category);
    });
    dbExams.forEach((e) => {
      if (e.category) categoriesSet.add(e.category);
    });

    // 1. Process defined exams in strict order, excluding any that are archived in DB
    const examsList: ExamItem[] = LANDING_EXAMS.filter((c) => !archivedSlugs.has(c.slug)).map((config) => {
      const db = dbMap.get(config.slug);
      const publishedTests = db?.mockTests || [];
      const hasPublishedTests = publishedTests.length > 0;

      // If exam is not in DB or has no published tests -> Coming Soon card
      if (!db || !hasPublishedTests) {
        return {
          isComingSoon: true,
          slug: config.slug,
          name: config.name,
          description: config.description,
          category: config.category,
        };
      }

      const freeTest = publishedTests.find((t) => t.isFree) || publishedTests[0];
      const staticExam = POPULAR_EXAMS.find((e) => e.slug === config.slug);

      const subjects =
        db.subjects.length > 0
          ? db.subjects.map((s) => ({
              id: s.id,
              name: s.name,
              nameHi: s.nameHi || s.name,
              questionCount: 0,
            }))
          : staticExam?.subjects || [];

      const mockExam: MockExam = {
        id: db.id,
        name: db.name,
        slug: db.slug,
        description: db.description,
        totalQuestions: db.totalQuestions,
        durationMinutes: db.durationMinutes,
        difficulty: (db.difficulty as 'EASY' | 'MEDIUM' | 'HARD') || 'MEDIUM',
        price: (db.price === 199 || db.price === 149 || !db.price) ? 1 : db.price,
        originalPrice: 149,
        isPopular: db.isPopular,
        category: db.category || config.category,
        totalMocks: publishedTests.length,
        freeMocks: publishedTests.filter((t) => t.isFree).length,
        subjects,
      };

      return {
        isComingSoon: false,
        exam: mockExam,
        freeMockId: freeTest?.id || `${db.slug}-mock-1`,
      };
    });

    // 2. Add any other non-archived exams from database that aren't in LANDING_EXAMS
    dbExams.forEach((db) => {
      if (!LANDING_EXAMS.some((c) => c.slug === db.slug)) {
        const publishedTests = db.mockTests || [];
        if (publishedTests.length === 0) {
          examsList.push({
            isComingSoon: true,
            slug: db.slug,
            name: db.name,
            description: db.description,
            category: db.category || 'General',
          });
        } else {
          const freeTest = publishedTests.find((t) => t.isFree) || publishedTests[0];
          const staticExam = POPULAR_EXAMS.find((e) => e.slug === db.slug);
          examsList.push({
            isComingSoon: false,
            exam: {
              id: db.id,
              name: db.name,
              slug: db.slug,
              description: db.description,
              totalQuestions: db.totalQuestions || staticExam?.totalQuestions || 100,
              durationMinutes: db.durationMinutes || staticExam?.durationMinutes || 90,
              difficulty: (db.difficulty as 'EASY' | 'MEDIUM' | 'HARD') || 'MEDIUM',
              price: (db.price === 199 || db.price === 149 || !db.price) ? 1 : db.price,
              originalPrice: 149,
              isPopular: db.isPopular,
              category: db.category || 'General',
              totalMocks: publishedTests.length,
              freeMocks: publishedTests.filter((t) => t.isFree).length,
              subjects:
                db.subjects.length > 0
                  ? db.subjects.map((s) => ({
                      id: s.id,
                      name: s.name,
                      nameHi: s.nameHi || s.name,
                      questionCount: 0,
                    }))
                  : staticExam?.subjects || [],
            },
            freeMockId: freeTest?.id || `${db.slug}-mock-1`,
          });
        }
      }
    });

    const orderedSlugs = await getCustomExamOrder();
    const sortedExams = sortExamsByCustomOrder(examsList, orderedSlugs);

    return {
      exams: sortedExams,
      categories: ['All', ...Array.from(categoriesSet)],
    };
  } catch {
    // Graceful fallback
    const orderedSlugs = await getCustomExamOrder().catch(() => []);
    const fallbackList: ExamItem[] = LANDING_EXAMS.map((c) => {
      if (c.slug === 'hp-police-constable') {
        const staticExam = POPULAR_EXAMS.find((e) => e.slug === c.slug) || POPULAR_EXAMS[0];
        return {
          isComingSoon: false as const,
          exam: staticExam,
          freeMockId: 'hp-police-mock-1',
        };
      }
      return {
        isComingSoon: true as const,
        slug: c.slug,
        name: c.name,
        description: c.description,
        category: c.category,
      };
    });

    return {
      exams: sortExamsByCustomOrder(fallbackList, orderedSlugs),
      categories: ['All', 'Police Exams', 'State Revenue', 'Forestry', 'Panchayat', 'Secretariat', 'Court Exams'],
    };
  }
}

export default async function ExamsPage() {
  const { exams, categories } = await getExamsPageData();
  return <ExamsPageClient initialExams={exams} categories={categories} />;
}
