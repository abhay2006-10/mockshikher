import prisma from '@/lib/prisma';
import { getOfficialExamConfig } from '@/lib/exam-syllabus';

interface ResolveMockOptions {
  mockTestId?: string;
  examSlug?: string;
  testNumber?: number;
  testName?: string;
}

/**
 * Explicit documented canonical mapping of exam identifiers and aliases.
 */
export const EXAM_SLUG_ALIASES: Record<string, string> = {
  // HP TET TGT Medical
  'hp-tgt-medical-hptet': 'hp-tet-tgt-medical',
  'hp-tgt-medical': 'hp-tet-tgt-medical',
  'hptet-tgt-medical': 'hp-tet-tgt-medical',
  'hp-tet-medical': 'hp-tet-tgt-medical',
  'tgt-medical': 'hp-tet-tgt-medical',
  'hp-tet-tgt-med': 'hp-tet-tgt-medical',
  'hp-tet-tgt-medical': 'hp-tet-tgt-medical',

  // HP TET TGT Non-Medical
  'hp-tgt-non-medical-hptet': 'hp-tet-tgt-non-medical',
  'hp-tgt-non-medical': 'hp-tet-tgt-non-medical',
  'hptet-tgt-non-medical': 'hp-tet-tgt-non-medical',
  'hp-tet-non-medical': 'hp-tet-tgt-non-medical',
  'tgt-non-medical': 'hp-tet-tgt-non-medical',
  'hp-tet-tgt-non-medical': 'hp-tet-tgt-non-medical',

  // HP TET TGT Arts
  'hp-tgt-arts-hptet': 'hp-tet-tgt-arts',
  'hp-tgt-arts': 'hp-tet-tgt-arts',
  'hptet-tgt-arts': 'hp-tet-tgt-arts',
  'hp-tet-arts': 'hp-tet-tgt-arts',
  'tgt-arts': 'hp-tet-tgt-arts',
  'hp-tet-tgt-arts': 'hp-tet-tgt-arts',

  // HP TET JBT / Shastri
  'hp-jbt-hptet': 'hp-tet-jbt',
  'hp-jbt-tet': 'hp-tet-jbt',
  'hptet-jbt': 'hp-tet-jbt',
  'hp-tet-jbt': 'hp-tet-jbt',
  'jbt-tet': 'hp-tet-jbt',

  // HP Police Constable
  'hp-police': 'hp-police-constable',
  'hp-police-constable': 'hp-police-constable',
  'police-constable': 'hp-police-constable',
  'hp-constable': 'hp-police-constable',

  // HP Patwari
  'hp-patwari': 'hp-patwari',
  'patwari': 'hp-patwari',
  'hp-revenue-patwari': 'hp-patwari',

  // HP Allied Services
  'hp-allied': 'hp-allied-services',
  'hp-allied-services': 'hp-allied-services',
  'allied-services': 'hp-allied-services',

  // HP Judiciary Clerk & High Court
  'hp-clerk': 'hp-judiciary-clerk',
  'hp-judiciary-clerk': 'hp-judiciary-clerk',
  'high-court-clerk': 'hp-judiciary-clerk',
  'hp-high-court-clerk': 'hp-judiciary-clerk',

  // HP Judiciary Process Server
  'hp-process-server': 'hp-judiciary-process-server',
  'hp-judiciary-process-server': 'hp-judiciary-process-server',
  'process-server': 'hp-judiciary-process-server',

  // HP Forest Guard
  'hp-forest': 'hp-forest-guard',
  'hp-forest-guard': 'hp-forest-guard',
  'forest-guard': 'hp-forest-guard',

  // SSC GD Constable
  'ssc-gd': 'ssc-gd-constable',
  'ssc-gd-constable': 'ssc-gd-constable',
};

/**
 * Normalizes exam slug variations using explicit canonical alias mapping.
 * Never silently defaults unknown exams to Police Constable.
 *
 * @param rawSlug - The slug from CSV or query parameter
 * @param targetExamSlug - The authoritative target exam selected in the UI (if any)
 */
export function normalizeExamSlug(rawSlug?: string, targetExamSlug?: string): string {
  if (!rawSlug || !rawSlug.trim()) {
    return targetExamSlug ? targetExamSlug.toLowerCase().trim() : '';
  }

  const clean = rawSlug.toLowerCase().trim().replace(/[\s_]+/g, '-');

  // If already matches targetExamSlug directly
  if (targetExamSlug && clean === targetExamSlug.toLowerCase().trim()) {
    return targetExamSlug.toLowerCase().trim();
  }

  // Lookup in documented explicit dictionary
  if (EXAM_SLUG_ALIASES[clean]) {
    return EXAM_SLUG_ALIASES[clean];
  }

  // Match targetExamSlug if clean is contained or contains target
  if (targetExamSlug) {
    const cleanTarget = targetExamSlug.toLowerCase().trim();
    if (clean === cleanTarget) return cleanTarget;
  }

  // Specific domain pattern fallbacks
  if (clean.includes('patwari')) return 'hp-patwari';
  if (clean.includes('allied')) return 'hp-allied-services';
  if (clean.includes('process-server')) return 'hp-judiciary-process-server';
  if (clean.includes('clerk') || clean.includes('high-court')) return 'hp-judiciary-clerk';
  if (clean.includes('police')) return 'hp-police-constable';
  if (clean.includes('forest')) return 'hp-forest-guard';
  if (clean.includes('medical') && clean.includes('tet')) return 'hp-tet-tgt-medical';
  if (clean.includes('non-medical') && clean.includes('tet')) return 'hp-tet-tgt-non-medical';
  if (clean.includes('arts') && clean.includes('tet')) return 'hp-tet-tgt-arts';
  if (clean.includes('jbt')) return 'hp-tet-jbt';
  if (clean.includes('ssc') && clean.includes('gd')) return 'ssc-gd-constable';

  // Return the cleaned slug as-is; NEVER default to hp-police-constable
  return clean;
}

interface CachedMockTest {
  data: any;
  cachedAt: number;
}

const globalForMockResolver = globalThis as unknown as {
  _mockResolverCache?: Map<string, CachedMockTest>;
};
if (!globalForMockResolver._mockResolverCache) {
  globalForMockResolver._mockResolverCache = new Map();
}
const mockCache = globalForMockResolver._mockResolverCache;
const MOCK_CACHE_TTL = 10 * 60 * 1000; // 10 minutes RAM cache

/**
 * Resolves or creates a MockTest in the database.
 * Supports finding by ID (e.g. "hp-police-mock-2") or exam slug + test number.
 * Automatically creates the Exam and/or MockTest row if missing.
 */
export async function resolveOrCreateMockTest(options: ResolveMockOptions) {
  const { mockTestId, testName } = options;
  let examSlug = normalizeExamSlug(options.examSlug);
  let testNumber = options.testNumber;

  const cacheKey = mockTestId || `${examSlug}:${testNumber || 1}`;
  const cached = mockCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < MOCK_CACHE_TTL && cached.data) {
    return cached.data;
  }

  // 1. Direct lookup by ID if provided
  if (mockTestId) {
    const existing = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: { exam: true },
    });
    if (existing) {
      const entry = { data: existing, cachedAt: Date.now() };
      mockCache.set(cacheKey, entry);
      mockCache.set(existing.id, entry);
      return existing;
    }

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
      'hp-tet-tgt-medical': 'HP TET TGT Medical',
      'hp-tet-tgt-non-medical': 'HP TET TGT Non-Medical',
      'hp-tet-tgt-arts': 'HP TET TGT Arts',
      'hp-tet-jbt': 'HP TET JBT / D.El.Ed',
      'hp-police-constable': 'HP Police Constable 2026',
      'hp-patwari': 'HP Patwari Examination',
      'hp-allied-services': 'HP Allied Services Examination',
      'hp-judiciary-clerk': 'HP Judiciary Clerk',
      'hp-judiciary-process-server': 'HP Judiciary Process Server',
      'hp-high-court-clerk': 'HP Judiciary Clerk',
      'hp-forest-guard': 'HP Forest Guard',
      'ssc-gd-constable': 'SSC GD Constable',
    };

    const formattedName =
      examNames[examSlug] ||
      examSlug
        .split('-')
        .map((w) =>
          ['hp', 'tet', 'tgt', 'jbt', 'ssc', 'gd'].includes(w.toLowerCase())
            ? w.toUpperCase()
            : w.charAt(0).toUpperCase() + w.slice(1)
        )
        .join(' ');

    const officialConfig = getOfficialExamConfig(examSlug);
    exam = await prisma.exam.create({
      data: {
        id: `exam-${examSlug}`,
        name: officialConfig.name || formattedName,
        nameHi: officialConfig.nameHi,
        slug: examSlug,
        description: officialConfig.description,
        totalQuestions: officialConfig.totalQuestions,
        durationMinutes: officialConfig.durationMinutes,
        difficulty: 'MEDIUM',
        price: 1,
        category: officialConfig.category,
        negativeMarking: officialConfig.negativeMarking,
        marksPerQuestion: officialConfig.marksPerQuestion,
      },
    });

    // Create official subjects for this exam
    for (let sIdx = 0; sIdx < officialConfig.sections.length; sIdx++) {
      const sec = officialConfig.sections[sIdx];
      await prisma.subject.upsert({
        where: { examId_name: { examId: exam.id, name: sec.name } },
        update: { nameHi: sec.nameHi, sortOrder: sIdx },
        create: {
          examId: exam.id,
          name: sec.name,
          nameHi: sec.nameHi,
          sortOrder: sIdx,
        },
      }).catch(() => {});
    }
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

  if (mockTest) {
    const entry = { data: mockTest, cachedAt: Date.now() };
    mockCache.set(cacheKey, entry);
    if (mockTest.id) mockCache.set(mockTest.id, entry);
    if (mockTest.exam?.slug) {
      mockCache.set(`${mockTest.exam.slug}:${mockTest.testNumber}`, entry);
      mockCache.set(`${mockTest.exam.slug}-mock-${mockTest.testNumber}`, entry);
    }
  }

  return mockTest;
}

/**
 * Recalculates totalQuestions and totalMarks for a MockTest based on database questions.
 */
export async function recalculateMockStats(mockTestId: string) {
  try {
    mockCache.delete(mockTestId);
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
