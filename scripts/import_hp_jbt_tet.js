const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const JBT_EXAM_SLUG = 'hp-tet-jbt';

const OFFICIAL_SECTIONS = [
  { name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', sortOrder: 0 },
  { name: 'English', nameHi: 'अंग्रेजी भाषा (English Language)', sortOrder: 1 },
  { name: 'Hindi', nameHi: 'हिन्दी भाषा (Hindi Language)', sortOrder: 2 },
  { name: 'Mathematics', nameHi: 'गणित (Mathematics)', sortOrder: 3 },
  { name: 'EVS, Social Studies & General Awareness', nameHi: 'पर्यावरण अध्ययन व सामान्य ज्ञान (EVS & HP GK)', sortOrder: 4 },
];

async function main() {
  console.log('=== Starting HP TET JBT 10 Mocks Import ===\n');

  // 1. Upsert Exam
  const exam = await prisma.exam.upsert({
    where: { slug: JBT_EXAM_SLUG },
    update: {
      name: 'HP TET JBT / D.El.Ed 2026',
      nameHi: 'एचपी टीईटी जेबीटी / डी.एल.एड 2026',
      description: 'Official HP TET pattern for Junior Basic Training (JBT / D.El.Ed). 150 bilingual MCQs covering Child Pedagogy, Hindi, English, Mathematics, and Environmental Studies & HP GK.',
      descriptionHi: 'जूनियर बेसिक ट्रेनिंग (JBT/D.El.Ed) हेतु आधिकारिक 150 द्विभाषी प्रश्नों की टेस्ट सीरीज़।',
      totalQuestions: 150,
      durationMinutes: 150, // 2.5 hours official timer
      difficulty: 'MEDIUM',
      price: 0, // 100% Free
      isPopular: true,
      category: 'HP TET Exams',
      negativeMarking: 0.0, // Official: NO NEGATIVE MARKING
      marksPerQuestion: 1.0,
      isArchived: false,
    },
    create: {
      id: 'exam-hp-tet-jbt',
      name: 'HP TET JBT / D.El.Ed 2026',
      nameHi: 'एचपी टीईटी जेबीटी / डी.एल.एड 2026',
      slug: JBT_EXAM_SLUG,
      description: 'Official HP TET pattern for Junior Basic Training (JBT / D.El.Ed). 150 bilingual MCQs covering Child Pedagogy, Hindi, English, Mathematics, and Environmental Studies & HP GK.',
      descriptionHi: 'जूनियर बेसिक ट्रेनिंग (JBT/D.El.Ed) हेतु आधिकारिक 150 द्विभाषी प्रश्नों की टेस्ट सीरीज़।',
      totalQuestions: 150,
      durationMinutes: 150,
      difficulty: 'MEDIUM',
      price: 0,
      isPopular: true,
      category: 'HP TET Exams',
      negativeMarking: 0.0,
      marksPerQuestion: 1.0,
      isArchived: false,
    },
  });

  console.log(`[Exam Ready]: ${exam.name} (${exam.slug}) - ID: ${exam.id}`);

  // 2. Upsert Subjects
  const subjectMap = new Map();
  for (const sec of OFFICIAL_SECTIONS) {
    const sub = await prisma.subject.upsert({
      where: {
        examId_name: {
          examId: exam.id,
          name: sec.name,
        },
      },
      update: {
        nameHi: sec.nameHi,
        sortOrder: sec.sortOrder,
      },
      create: {
        examId: exam.id,
        name: sec.name,
        nameHi: sec.nameHi,
        sortOrder: sec.sortOrder,
      },
    });
    subjectMap.set(sec.name.toLowerCase().trim(), sub);
    console.log(`  - Subject: "${sub.name}" (ID: ${sub.id})`);
  }

  // Also map alternate subject names from CSV
  const subAliases = {
    'child development & pedagogy': 'child development & pedagogy',
    'child development, learning & inclusive education': 'child development & pedagogy',
    'english': 'english',
    'english literature & grammar': 'english',
    'hindi': 'hindi',
    'hindi literature & grammar': 'hindi',
    'mathematics': 'mathematics',
    'evs, social studies & general awareness': 'evs, social studies & general awareness',
    'environmental studies & hp gk': 'evs, social studies & general awareness',
    'general awareness & evs': 'evs, social studies & general awareness',
  };

  const csvDir = path.join(__dirname, '..', 'scratch', 'jbt_tet_mocks');
  const topicCache = new Map(); // key: subjectId_topicName -> topic

  // 3. Process Mocks 1 through 10
  for (let mockNum = 1; mockNum <= 10; mockNum++) {
    const csvFileName = `MockShikhar_HP_JBT_TET_Mock_${mockNum}.csv`;
    const csvPath = path.join(csvDir, csvFileName);

    if (!fs.existsSync(csvPath)) {
      console.warn(`[WARN] File not found: ${csvFileName}`);
      continue;
    }

    const buf = fs.readFileSync(csvPath);
    const wb = XLSX.read(buf, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    console.log(`\nImporting Mock ${mockNum} (${rows.length} questions)...`);

    const mockTestId = `hp-tet-jbt-mock-${mockNum}`;
    const mockTestName = `HP TET JBT Full Mock ${mockNum} (Official Pattern)`;

    const mockTest = await prisma.mockTest.upsert({
      where: {
        examId_testNumber: {
          examId: exam.id,
          testNumber: mockNum,
        },
      },
      update: {
        name: mockTestName,
        isFree: true, // 100% Free
        isPublished: true, // Published
        durationMinutes: 150, // 2.5 hours
        totalQuestions: rows.length,
        totalMarks: rows.length,
        marksPerQuestion: 1.0,
        negativeMarksPerQuestion: 0.0, // NO NEGATIVE MARKING
      },
      create: {
        id: mockTestId,
        examId: exam.id,
        testNumber: mockNum,
        name: mockTestName,
        isFree: true,
        isPublished: true,
        durationMinutes: 150,
        totalQuestions: rows.length,
        totalMarks: rows.length,
        marksPerQuestion: 1.0,
        negativeMarksPerQuestion: 0.0,
      },
    });

    // Clean existing questions for this mock to ensure fresh import
    await prisma.question.deleteMany({
      where: { mockTestId: mockTest.id },
    });

    // Insert questions in batches
    let qNum = 1;
    for (const row of rows) {
      const rawSub = (row.subject || 'Child Development & Pedagogy').trim();
      const mappedSubName = subAliases[rawSub.toLowerCase()] || rawSub.toLowerCase();
      let subject = subjectMap.get(mappedSubName);
      if (!subject) {
        // default fallback to first subject
        subject = subjectMap.get('child development & pedagogy');
      }

      const rawTopic = (row.topic || 'General Practice').trim();
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

      const correctOpt = (String(row.correct_answer || 'A').toUpperCase().trim().slice(0, 1)) || 'A';
      const validCorrect = ['A', 'B', 'C', 'D'].includes(correctOpt) ? correctOpt : 'A';

      const q = await prisma.question.create({
        data: {
          mockTestId: mockTest.id,
          subjectId: subject.id,
          topicId: topic.id,
          questionNumber: qNum++,
          questionText: String(row.question || '').trim(),
          questionTextHi: row.hindi_question ? String(row.hindi_question).trim() : null,
          correctOption: validCorrect,
          marks: 1.0,
          negativeMarks: 0.0,
          difficulty: (['EASY', 'MEDIUM', 'HARD'].includes(row.difficulty) ? row.difficulty : 'MEDIUM'),
          explanation: row.explanation ? String(row.explanation).trim() : null,
          explanationHi: row.hindi_explanation ? String(row.hindi_explanation).trim() : null,
          options: {
            create: [
              {
                optionLabel: 'A',
                optionText: String(row.option_a || '').trim(),
                optionTextHi: row.hindi_option_a ? String(row.hindi_option_a).trim() : null,
              },
              {
                optionLabel: 'B',
                optionText: String(row.option_b || '').trim(),
                optionTextHi: row.hindi_option_b ? String(row.hindi_option_b).trim() : null,
              },
              {
                optionLabel: 'C',
                optionText: String(row.option_c || '').trim(),
                optionTextHi: row.hindi_option_c ? String(row.hindi_option_c).trim() : null,
              },
              {
                optionLabel: 'D',
                optionText: String(row.option_d || '').trim(),
                optionTextHi: row.hindi_option_d ? String(row.hindi_option_d).trim() : null,
              },
            ],
          },
        },
      });
    }

    console.log(`  -> Successfully imported ${rows.length} questions into "${mockTest.name}"`);
  }

  console.log('\n=== All 10 Mocks Successfully Uploaded! ===');
}

main()
  .catch((e) => {
    console.error('Import Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
