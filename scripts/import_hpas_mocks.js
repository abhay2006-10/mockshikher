const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const HPAS_EXAM_SLUG = 'hpas';

const HPAS_SUBJECTS = [
  { name: 'HP GK', nameHi: 'हिमाचल प्रदेश सामान्य ज्ञान एवं कला-संस्कृति', sortOrder: 0 },
  { name: 'HP Economic Survey 2025-26', nameHi: 'हि.प्र. आर्थिक सर्वेक्षण 2025-26', sortOrder: 1 },
  { name: 'HP Budget 2026-27', nameHi: 'हि.प्र. बजट 2026-27', sortOrder: 2 },
  { name: 'Union Budget 2026-27', nameHi: 'केंद्रीय बजट व आर्थिक समीक्षा 2026-27', sortOrder: 3 },
  { name: 'Polity', nameHi: 'भारतीय संविधान एवं राजव्यवस्था', sortOrder: 4 },
  { name: 'History', nameHi: 'भारतीय इतिहास एवं राष्ट्रीय आंदोलन', sortOrder: 5 },
  { name: 'Geography', nameHi: 'भारत एवं विश्व का भूगोल', sortOrder: 6 },
  { name: 'Economy', nameHi: 'भारतीय अर्थव्यवस्था एवं विकास', sortOrder: 7 },
  { name: 'Environment', nameHi: 'पर्यावरण, पारिस्थितिकी एवं जैव विविधता', sortOrder: 8 },
  { name: 'Science', nameHi: 'सामान्य विज्ञान एवं प्रौद्योगिकी', sortOrder: 9 },
  { name: 'Current Affairs 2026', nameHi: 'राष्ट्रीय एवं अंतर्राष्ट्रीय समसामयिकी 2026', sortOrder: 10 },
];

const MOCK_FILES = [
  { num: 1, file: 'HPAS_2026_Mock_Test_01.csv', title: 'HPAS 2026 Prelims Full Mock 1 (Official Pattern)' },
  { num: 2, file: 'HPAS_2026_Mock_Test_02.csv', title: 'HPAS 2026 Prelims Full Mock 2 (Official Pattern)' },
  { num: 3, file: 'HPAS_2026_Mock_Test_03.csv', title: 'HPAS 2026 Prelims Full Mock 3 (Official Pattern)' },
  { num: 4, file: 'HPAS_2026_Mock_Test_04.csv', title: 'HPAS 2026 Prelims Full Mock 4 (Official Pattern)' },
  { num: 5, file: 'HPAS_2026_Mock_Test_05.csv', title: 'HPAS 2026 Prelims Full Mock 5 (Official Pattern)' },
  { num: 6, file: 'HPAS_2026_Mock_Test_06_Hard.csv', title: 'HPAS 2026 Prelims Full Mock 6 (Advanced / UPSC Pattern)' },
  { num: 7, file: 'HPAS_2026_Mock_Test_07_Hard.csv', title: 'HPAS 2026 Prelims Full Mock 7 (Advanced / UPSC Pattern)' },
  { num: 8, file: 'HPAS_2026_Mock_Test_08_Hard.csv', title: 'HPAS 2026 Prelims Full Mock 8 (Advanced / UPSC Pattern)' },
  { num: 9, file: 'HPAS_2026_Mock_Test_09_Hard.csv', title: 'HPAS 2026 Prelims Full Mock 9 (Advanced / UPSC Pattern)' },
  { num: 10, file: 'HPAS_2026_Mock_Test_10_Hard.csv', title: 'HPAS 2026 Prelims Full Mock 10 (Advanced / UPSC Pattern)' },
];

async function main() {
  console.log('=== Starting HPAS 2026 Prelims 10 Mocks Import ===\n');

  // 1. Upsert HPAS Exam
  const exam = await prisma.exam.upsert({
    where: { slug: HPAS_EXAM_SLUG },
    update: {
      name: 'HPAS / HPPSC Combined Competitive Exam 2026',
      nameHi: 'हिमाचल प्रदेश प्रशासनिक सेवा (HPAS / HPPSC Prelims 2026)',
      description:
        'Official HPPSC HPAS (Himachal Pradesh Administrative Services) Preliminary Examination test series. 10 full-length tests of 100 questions (200 marks) in 120 minutes with official 1/3rd (0.67) negative marking covering HP GK, HP Economic Survey 2025-26, HP Budget 2026-27, Indian Polity, History, Geography, Economy, Environment, and Current Affairs.',
      descriptionHi:
        'हिमाचल प्रदेश प्रशासनिक सेवा (HPAS) प्रारंभिक परीक्षा हेतु आधिकारिक 10 पूर्ण मॉक टेस्ट सीरीज़। 100 द्विभाषी प्रश्न, 200 अंक, 120 मिनट और 1/3 (0.67) ऋणात्मक अंकन।',
      totalQuestions: 100,
      durationMinutes: 120, // 2 hours official duration
      difficulty: 'HARD',
      price: 0, // 100% Free
      isPopular: true,
      category: 'Administrative Services',
      negativeMarking: 0.67, // Official: 1/3rd of 2 marks = 0.67
      marksPerQuestion: 2.0, // Official: 2 marks per question (total 200 marks)
      isArchived: false,
    },
    create: {
      id: 'exam-hpas',
      name: 'HPAS / HPPSC Combined Competitive Exam 2026',
      nameHi: 'हिमाचल प्रदेश प्रशासनिक सेवा (HPAS / HPPSC Prelims 2026)',
      slug: HPAS_EXAM_SLUG,
      description:
        'Official HPPSC HPAS (Himachal Pradesh Administrative Services) Preliminary Examination test series. 10 full-length tests of 100 questions (200 marks) in 120 minutes with official 1/3rd (0.67) negative marking covering HP GK, HP Economic Survey 2025-26, HP Budget 2026-27, Indian Polity, History, Geography, Economy, Environment, and Current Affairs.',
      descriptionHi:
        'हिमाचल प्रदेश प्रशासनिक सेवा (HPAS) प्रारंभिक परीक्षा हेतु आधिकारिक 10 पूर्ण मॉक टेस्ट सीरीज़। 100 द्विभाषी प्रश्न, 200 अंक, 120 मिनट और 1/3 (0.67) ऋणात्मक अंकन।',
      totalQuestions: 100,
      durationMinutes: 120,
      difficulty: 'HARD',
      price: 0,
      isPopular: true,
      category: 'Administrative Services',
      negativeMarking: 0.67,
      marksPerQuestion: 2.0,
      isArchived: false,
    },
  });

  console.log(`[Exam Ready]: ${exam.name} (${exam.slug}) - ID: ${exam.id}`);

  // 2. Upsert Subjects
  const subjectMap = new Map();
  for (const subDef of HPAS_SUBJECTS) {
    const sub = await prisma.subject.upsert({
      where: {
        examId_name: {
          examId: exam.id,
          name: subDef.name,
        },
      },
      update: {
        nameHi: subDef.nameHi,
        sortOrder: subDef.sortOrder,
      },
      create: {
        examId: exam.id,
        name: subDef.name,
        nameHi: subDef.nameHi,
        sortOrder: subDef.sortOrder,
      },
    });
    subjectMap.set(subDef.name.toLowerCase().trim(), sub);
    console.log(`  - Subject: "${sub.name}" (ID: ${sub.id})`);
  }

  const csvDir = path.join(__dirname, '..', 'scratch', 'hpas_extracted');
  const topicCache = new Map();

  // 3. Process Mocks 1 through 10
  for (const item of MOCK_FILES) {
    const csvPath = path.join(csvDir, item.file);

    if (!fs.existsSync(csvPath)) {
      console.warn(`[WARN] File not found: ${item.file}`);
      continue;
    }

    const buf = fs.readFileSync(csvPath);
    const wb = XLSX.read(buf, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    console.log(`\nImporting Mock ${item.num}: "${item.title}" (${rows.length} questions)...`);

    const mockTestId = `hpas-mock-${item.num}`;

    const mockTest = await prisma.mockTest.upsert({
      where: {
        examId_testNumber: {
          examId: exam.id,
          testNumber: item.num,
        },
      },
      update: {
        name: item.title,
        isFree: true, // 100% Free
        isPublished: true, // Published
        durationMinutes: 120, // 2 hours
        totalQuestions: rows.length,
        totalMarks: rows.length * 2.0, // 200 marks
        marksPerQuestion: 2.0,
        negativeMarksPerQuestion: 0.67, // 1/3rd penalty
      },
      create: {
        id: mockTestId,
        examId: exam.id,
        testNumber: item.num,
        name: item.title,
        isFree: true,
        isPublished: true,
        durationMinutes: 120,
        totalQuestions: rows.length,
        totalMarks: rows.length * 2.0,
        marksPerQuestion: 2.0,
        negativeMarksPerQuestion: 0.67,
      },
    });

    // Clean existing questions for this mock to ensure fresh import
    await prisma.question.deleteMany({
      where: { mockTestId: mockTest.id },
    });

    // Insert questions
    let qNum = 1;
    for (const row of rows) {
      const rawSub = String(row.subject || 'HP GK').trim();
      let subject = subjectMap.get(rawSub.toLowerCase());
      if (!subject) {
        // Create subject if new
        subject = await prisma.subject.create({
          data: {
            examId: exam.id,
            name: rawSub,
            nameHi: rawSub,
            sortOrder: HPAS_SUBJECTS.length + 1,
          },
        });
        subjectMap.set(rawSub.toLowerCase(), subject);
      }

      const rawTopic = String(row.topic || 'General Practice').trim();
      const topicKey = `${subject.id}_${rawTopic.toLowerCase()}`;
      let topic = topicCache.get(topicKey);

      if (!topic) {
        topic = await prisma.topic.upsert({
          where: {
            subjectId_name: {
              subjectId: subject.id,
              name: rawTopic,
            },
          },
          update: {},
          create: {
            subjectId: subject.id,
            name: rawTopic,
            nameHi: rawTopic,
          },
        });
        topicCache.set(topicKey, topic);
      }

      const correctOpt = (String(row.correct_option || 'A').toUpperCase().trim().slice(0, 1)) || 'A';
      const validCorrect = ['A', 'B', 'C', 'D'].includes(correctOpt) ? correctOpt : 'A';

      await prisma.question.create({
        data: {
          mockTestId: mockTest.id,
          subjectId: subject.id,
          topicId: topic.id,
          questionNumber: qNum++,
          questionText: String(row.question_en || '').trim(),
          questionTextHi: row.question_hi ? String(row.question_hi).trim() : null,
          correctOption: validCorrect,
          marks: 2.0,
          negativeMarks: 0.67,
          difficulty: item.num >= 6 ? 'HARD' : 'MEDIUM',
          explanation: row.explanation_en ? String(row.explanation_en).trim() : null,
          explanationHi: row.explanation_hi ? String(row.explanation_hi).trim() : null,
          options: {
            create: [
              {
                optionLabel: 'A',
                optionText: String(row.option_a_en || '').trim(),
                optionTextHi: row.option_a_hi ? String(row.option_a_hi).trim() : null,
              },
              {
                optionLabel: 'B',
                optionText: String(row.option_b_en || '').trim(),
                optionTextHi: row.option_b_hi ? String(row.option_b_hi).trim() : null,
              },
              {
                optionLabel: 'C',
                optionText: String(row.option_c_en || '').trim(),
                optionTextHi: row.option_c_hi ? String(row.option_c_hi).trim() : null,
              },
              {
                optionLabel: 'D',
                optionText: String(row.option_d_en || '').trim(),
                optionTextHi: row.option_d_hi ? String(row.option_d_hi).trim() : null,
              },
            ],
          },
        },
      });
    }

    console.log(`  -> Successfully imported ${rows.length} questions into "${mockTest.name}"`);
  }

  console.log('\n=== All 10 HPAS Mocks (1,000 Questions) Successfully Uploaded! ===');
}

main()
  .catch((e) => {
    console.error('Import Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
