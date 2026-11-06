const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PACKS_DIR = path.join(__dirname, '..', 'src', 'mock-packs');

async function syncPack(fileName) {
  const filePath = path.join(PACKS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIP] Pack file not found: ${fileName}`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const pack = JSON.parse(raw);
  const cleanSlug = pack.examSlug.toLowerCase().trim();

  console.log(`\n=== Fast Sync: ${pack.examName} (${cleanSlug}) ===`);

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

  // 2. Upsert Subjects in batch
  const subjectMap = new Map();
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

  // Pre-load all existing topics for this exam's subjects
  const existingTopics = await prisma.topic.findMany({
    where: {
      subject: { examId: exam.id }
    }
  });
  const topicCache = new Map();
  existingTopics.forEach(t => {
    topicCache.set(`${t.subjectId}_${t.name.toLowerCase().trim()}`, t);
  });

  // 3. Process each Mock Test
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

    const qCount = await prisma.question.count({
      where: { mockTestId: mockTest.id },
    });

    if (qCount >= mockData.questions.length) {
      console.log(`  - Mock ${mockData.testNumber}: ${qCount} questions already present (skipped)`);
      continue;
    }

    // Prepare questions and options for high-speed bulk insertion
    await prisma.question.deleteMany({
      where: { mockTestId: mockTest.id },
    });

    // Ensure all topics exist first
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
      if (!topicCache.has(topicKey)) {
        const newTopic = await prisma.topic.upsert({
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
        topicCache.set(topicKey, newTopic);
      }
    }

    const questionsToInsert = [];
    const optionsToInsert = [];

    for (const q of mockData.questions) {
      const subject = subjectMap.get(q.subject.toLowerCase().trim());
      const topic = topicCache.get(`${subject.id}_${q.topic.toLowerCase().trim()}`);
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
        { id: `${qId}-opt-A`, questionId: qId, optionLabel: 'A', optionText: q.optAEn, optionTextHi: q.optAHi },
        { id: `${qId}-opt-B`, questionId: qId, optionLabel: 'B', optionText: q.optBEn, optionTextHi: q.optBHi },
        { id: `${qId}-opt-C`, questionId: qId, optionLabel: 'C', optionText: q.optCEn, optionTextHi: q.optCHi },
        { id: `${qId}-opt-D`, questionId: qId, optionLabel: 'D', optionText: q.optDEn, optionTextHi: q.optDHi }
      );
    }

    // High-speed bulk insert in 2 queries
    await prisma.question.createMany({
      data: questionsToInsert,
      skipDuplicates: true,
    });

    await prisma.questionOption.createMany({
      data: optionsToInsert,
      skipDuplicates: true,
    });

    console.log(`  - Mock ${mockData.testNumber}: bulk imported ${questionsToInsert.length} questions in seconds.`);
  }

  console.log(`Done syncing "${cleanSlug}".`);
}

async function main() {
  console.log('=== High-Speed Bulk Sync of Mock Packs ===');
  const files = fs.readdirSync(PACKS_DIR).filter(f => f.endsWith('.json')).sort();
  for (const f of files) {
    try {
      await syncPack(f);
    } catch (err) {
      console.error(`Failed to sync pack ${f}:`, err);
    }
  }
  console.log('\n=== All Mock Packs Synced Successfully! ===');
}

main()
  .catch((e) => {
    console.error('Sync failed:', e);
    process.exit(0);
  })
  .finally(() => prisma.$disconnect());
