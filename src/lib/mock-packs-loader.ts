import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

export interface MockQuestionData {
  qNum: number;
  subject: string;
  topic: string;
  textEn: string;
  textHi: string | null;
  optAEn: string;
  optAHi: string | null;
  optBEn: string;
  optBHi: string | null;
  optCEn: string;
  optCHi: string | null;
  optDEn: string;
  optDHi: string | null;
  correct: 'A' | 'B' | 'C' | 'D';
  expEn: string | null;
  expHi: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface MockTestData {
  testNumber: number;
  name: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  questions: MockQuestionData[];
}

export interface MockPackData {
  examSlug: string;
  examName: string;
  examNameHi: string;
  description: string;
  descriptionHi: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking: number;
  subjects: Array<{ name: string; nameHi: string; sortOrder: number }>;
  mocks: MockTestData[];
}

const PACKS_CACHE = new Map<string, MockPackData>();

export function getBundledMockPack(slug: string): MockPackData | null {
  const cleanSlug = slug.toLowerCase().trim();
  if (PACKS_CACHE.has(cleanSlug)) {
    return PACKS_CACHE.get(cleanSlug)!;
  }

  const possibleFiles = [
    path.join(process.cwd(), 'src', 'mock-packs', `${cleanSlug}.json`),
    path.join(__dirname, '..', 'mock-packs', `${cleanSlug}.json`),
  ];

  for (const filePath of possibleFiles) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const pack: MockPackData = JSON.parse(raw);
        PACKS_CACHE.set(cleanSlug, pack);
        return pack;
      } catch (err) {
        console.error(`Error loading mock pack ${cleanSlug}:`, err);
      }
    }
  }

  return null;
}

export const KNOWN_PACK_SLUGS = ['hp-tet-jbt', 'hpas', 'army-agniveer-gd', 'hp-forest-guard'];

/**
 * Ensures that the mock tests and questions for the given exam slug are present in PostgreSQL.
 * If not yet seeded, seeds them automatically.
 */
export async function ensureMockPackSeeded(slug: string): Promise<boolean> {
  const cleanSlug = slug.toLowerCase().trim();
  if (!KNOWN_PACK_SLUGS.includes(cleanSlug)) {
    return false;
  }

  try {
    const pack = getBundledMockPack(cleanSlug);
    if (!pack) return false;

    // Check if exam exists and already has published mock tests
    const existingExam = await prisma.exam.findUnique({
      where: { slug: cleanSlug },
      include: {
        _count: {
          select: { mockTests: true },
        },
      },
    });

    // If already fully populated with 10 mocks, no need to re-seed
    if (existingExam && existingExam._count.mockTests >= pack.mocks.length) {
      return true;
    }

    console.log(`[Auto-Seed] Seeding pack for "${cleanSlug}" into database...`);

    // 1. Upsert Exam
    const exam = await prisma.exam.upsert({
      where: { slug: cleanSlug },
      update: {
        name: pack.examName,
        nameHi: pack.examNameHi,
        description: pack.description,
        descriptionHi: pack.descriptionHi,
        totalQuestions: pack.totalQuestions,
        durationMinutes: pack.durationMinutes,
        difficulty: pack.difficulty,
        price: 0,
        isPopular: true,
        category: pack.category,
        negativeMarking: pack.negativeMarking,
        marksPerQuestion: pack.marksPerQuestion,
        isArchived: false,
      },
      create: {
        id: `exam-${cleanSlug}`,
        name: pack.examName,
        nameHi: pack.examNameHi,
        slug: cleanSlug,
        description: pack.description,
        descriptionHi: pack.descriptionHi,
        totalQuestions: pack.totalQuestions,
        durationMinutes: pack.durationMinutes,
        difficulty: pack.difficulty,
        price: 0,
        isPopular: true,
        category: pack.category,
        negativeMarking: pack.negativeMarking,
        marksPerQuestion: pack.marksPerQuestion,
        isArchived: false,
      },
    });

    // 2. Upsert Subjects
    const subjectMap = new Map<string, { id: string }>();
    for (const sub of pack.subjects) {
      const dbSub = await prisma.subject.upsert({
        where: {
          examId_name: {
            examId: exam.id,
            name: sub.name,
          },
        },
        update: {
          nameHi: sub.nameHi,
          sortOrder: sub.sortOrder,
        },
        create: {
          examId: exam.id,
          name: sub.name,
          nameHi: sub.nameHi,
          sortOrder: sub.sortOrder,
        },
      });
      subjectMap.set(sub.name.toLowerCase().trim(), dbSub);
    }

    const topicCache = new Map<string, { id: string }>();

    // 3. Process each mock test
    for (const mockData of pack.mocks) {
      const mockTestId = `${cleanSlug}-mock-${mockData.testNumber}`;
      const mockTest = await prisma.mockTest.upsert({
        where: {
          examId_testNumber: {
            examId: exam.id,
            testNumber: mockData.testNumber,
          },
        },
        update: {
          name: mockData.name,
          isFree: true,
          isPublished: true,
          durationMinutes: mockData.durationMinutes,
          totalQuestions: mockData.totalQuestions,
          totalMarks: mockData.totalMarks,
          marksPerQuestion: mockData.marksPerQuestion,
          negativeMarksPerQuestion: mockData.negativeMarksPerQuestion,
        },
        create: {
          id: mockTestId,
          examId: exam.id,
          testNumber: mockData.testNumber,
          name: mockData.name,
          isFree: true,
          isPublished: true,
          durationMinutes: mockData.durationMinutes,
          totalQuestions: mockData.totalQuestions,
          totalMarks: mockData.totalMarks,
          marksPerQuestion: mockData.marksPerQuestion,
          negativeMarksPerQuestion: mockData.negativeMarksPerQuestion,
        },
      });

      // Check if questions are already present
      const qCount = await prisma.question.count({
        where: { mockTestId: mockTest.id },
      });

      if (qCount >= mockData.questions.length) {
        continue;
      }

      await prisma.question.deleteMany({
        where: { mockTestId: mockTest.id },
      });

      const questionsToInsert = [];
      const optionsToInsert = [];

      for (const q of mockData.questions) {
        let subject = subjectMap.get(q.subject.toLowerCase().trim());
        if (!subject) {
          subject = await prisma.subject.create({
            data: {
              examId: exam.id,
              name: q.subject,
              nameHi: q.subject,
              sortOrder: 99,
            },
          });
          subjectMap.set(q.subject.toLowerCase().trim(), subject);
        }

        const topicKey = `${subject.id}_${q.topic.toLowerCase().trim()}`;
        let topic = topicCache.get(topicKey);
        if (!topic) {
          topic = await prisma.topic.upsert({
            where: {
              subjectId_name: {
                subjectId: subject.id,
                name: q.topic,
              },
            },
            update: {},
            create: {
              subjectId: subject.id,
              name: q.topic,
              nameHi: q.topic,
            },
          });
          topicCache.set(topicKey, topic);
        }

        const qId = `${mockTest.id}-q-${q.qNum}`;
        questionsToInsert.push({
          id: qId,
          mockTestId: mockTest.id,
          subjectId: subject.id,
          topicId: topic.id,
          questionNumber: q.qNum,
          questionText: q.textEn,
          questionTextHi: q.textHi,
          correctOption: q.correct,
          marks: mockData.marksPerQuestion,
          negativeMarks: mockData.negativeMarksPerQuestion,
          difficulty: q.difficulty,
          explanation: q.expEn,
          explanationHi: q.expHi,
        });

        optionsToInsert.push(
          { id: `${qId}-opt-A`, questionId: qId, optionLabel: 'A' as const, optionText: q.optAEn, optionTextHi: q.optAHi },
          { id: `${qId}-opt-B`, questionId: qId, optionLabel: 'B' as const, optionText: q.optBEn, optionTextHi: q.optBHi },
          { id: `${qId}-opt-C`, questionId: qId, optionLabel: 'C' as const, optionText: q.optCEn, optionTextHi: q.optCHi },
          { id: `${qId}-opt-D`, questionId: qId, optionLabel: 'D' as const, optionText: q.optDEn, optionTextHi: q.optDHi }
        );
      }

      await prisma.question.createMany({
        data: questionsToInsert,
        skipDuplicates: true,
      });

      await prisma.questionOption.createMany({
        data: optionsToInsert,
        skipDuplicates: true,
      });
    }

    console.log(`[Auto-Seed] Successfully seeded "${cleanSlug}" with ${pack.mocks.length} mocks.`);
    return true;
  } catch (err) {
    console.error(`[Auto-Seed ERROR] Failed to seed "${slug}":`, err);
    return false;
  }
}

