import prisma from '@/lib/prisma';

interface ResolveMockOptions {
  mockTestId?: string;
  examSlug?: string;
  testNumber?: number;
  testName?: string;
}

/**
 * Normalizes exam slug variations.
 * e.g. "hp-police", "hp-police-constable", "hp police" -> "hp-police-constable"
 */
export function normalizeExamSlug(rawSlug?: string): string {
  if (!rawSlug) return 'hp-police-constable';
  const clean = rawSlug.toLowerCase().trim().replace(/\s+/g, '-');
  if (clean.includes('patwari')) return 'hp-patwari';
  if (clean.includes('allied')) return 'hp-allied-services';
  if (clean.includes('process-server')) return 'hp-judiciary-process-server';
  if (clean.includes('clerk') || clean.includes('high-court')) return 'hp-judiciary-clerk';
  return 'hp-police-constable';
}

/**
 * Resolves or creates a MockTest in the database.
 * Supports finding by ID (e.g. "hp-police-mock-2") or exam slug + test number.
 * Automatically creates the Exam and/or MockTest row if missing.
 */
export async function resolveOrCreateMockTest(options: ResolveMockOptions) {
  const { mockTestId, testName } = options;
  let examSlug = normalizeExamSlug(options.examSlug);
  let testNumber = options.testNumber;

  // 1. Direct lookup by ID if provided
  if (mockTestId) {
    const existing = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: { exam: true },
    });
    if (existing) return existing;

    // Parse ID like "hp-police-mock-3" or "hp-patwari-mock-1"
    const match = mockTestId.match(/^([a-z-]+)-mock-(\d+)$/i);
    if (match) {
      examSlug = normalizeExamSlug(match[1]);
      if (!testNumber) testNumber = parseInt(match[2], 10);
    }
  }

  // Fallback defaults
  if (!testNumber || isNaN(testNumber)) testNumber = 1;

  // 2. Ensure Exam exists
  let exam = await prisma.exam.findUnique({
    where: { slug: examSlug },
  });

  if (!exam) {
    // Default exam details
    const examNames: Record<string, string> = {
      'hp-police-constable': 'HP Police Constable 2026',
      'hp-patwari': 'HP Patwari Examination',
      'hp-allied-services': 'HP Allied Services Examination',
      'hp-judiciary-clerk': 'HP Judiciary Clerk',
      'hp-judiciary-process-server': 'HP Judiciary Process Server',
      'hp-high-court-clerk': 'HP Judiciary Clerk',
    };

    exam = await prisma.exam.create({
      data: {
        id: `exam-${examSlug}`,
        name: examNames[examSlug] || 'HP Competitive Examination',
        slug: examSlug,
        description: 'Comprehensive test series per the latest official syllabus.',
        totalQuestions: 90,
        durationMinutes: 60,
        difficulty: 'MEDIUM',
        price: 199,
        category: 'HP Exams',
      },
    });
  }

  // 3. Lookup or create MockTest by examId + testNumber
  let mockTest = await prisma.mockTest.findUnique({
    where: {
      examId_testNumber: {
        examId: exam.id,
        testNumber,
      },
    },
    include: { exam: true },
  });

  if (!mockTest) {
    const idToUse = mockTestId || `${exam.slug}-mock-${testNumber}`;
    // Check if ID is already taken
    const existingById = await prisma.mockTest.findUnique({
      where: { id: idToUse },
      include: { exam: true },
    });
    if (existingById) {
      mockTest = existingById;
    } else {
      mockTest = await prisma.mockTest.create({
        data: {
          id: idToUse,
          examId: exam.id,
          testNumber,
          name: testName || `${exam.name} Full Mock ${testNumber}`,
          isFree: testNumber === 1,
          isPublished: true,
          totalQuestions: 0,
          durationMinutes: exam.durationMinutes || 60,
          marksPerQuestion: exam.marksPerQuestion || 1.0,
          negativeMarksPerQuestion: exam.negativeMarking ?? 0.25,
          totalMarks: 0,
        },
        include: { exam: true },
      });
    }
  }

  return mockTest;
}

/**
 * Recalculates totalQuestions and totalMarks for a MockTest based on database questions.
 */
export async function recalculateMockStats(mockTestId: string) {
  try {
    const [count, aggregate] = await Promise.all([
      prisma.question.count({ where: { mockTestId } }),
      prisma.question.aggregate({
        where: { mockTestId },
        _sum: { marks: true },
      }),
    ]);

    await prisma.mockTest.update({
      where: { id: mockTestId },
      data: {
        totalQuestions: count,
        totalMarks: aggregate._sum.marks || 0,
      },
    });
  } catch (err) {
    console.error(`Failed to recalculate stats for mock test ${mockTestId}:`, err);
  }
}
