const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Load environment variables from .env
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

// Prefer DIRECT_URL or DATABASE_URL cleaned of channel_binding if problematic
let connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (connStr) {
  connStr = connStr.replace('&channel_binding=require', '').replace('channel_binding=require&', '');
}

const prisma = new PrismaClient({
  datasources: connStr ? { db: { url: connStr } } : undefined,
});

const OFFICIAL_SYLLABUS = [
  {
    slug: 'hp-tet-tgt-medical',
    name: 'HP TET TGT Medical 2026',
    nameHi: 'एचपी टीईटी टीजीटी मेडिकल 2026',
    category: 'HP TET Exams',
    totalQuestions: 150,
    durationMinutes: 150,
    negativeMarking: 0,
    marksPerQuestion: 1,
    description: 'Comprehensive test series for HP TET TGT Medical examination as per official HPBOSE syllabus.',
    subjects: [
      { name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', sortOrder: 0 },
      { name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान', sortOrder: 1 },
      { name: 'Botany & Zoology (Biology)', nameHi: 'वनस्पति व प्राणी विज्ञान', sortOrder: 2 },
      { name: 'Chemistry', nameHi: 'रसायन विज्ञान', sortOrder: 3 },
    ],
  },
  {
    slug: 'hp-tet-tgt-non-medical',
    name: 'HP TET TGT Non-Medical 2026',
    nameHi: 'एचपी टीईटी टीजीटी नॉन-मेडिकल 2026',
    category: 'HP TET Exams',
    totalQuestions: 150,
    durationMinutes: 150,
    negativeMarking: 0,
    marksPerQuestion: 1,
    description: 'Targeted test series for HP TET TGT Non-Medical examination as per official HPBOSE syllabus.',
    subjects: [
      { name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', sortOrder: 0 },
      { name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान', sortOrder: 1 },
      { name: 'Mathematics', nameHi: 'गणित', sortOrder: 2 },
      { name: 'Physics & Chemistry', nameHi: 'भौतिकी एवं रसायन विज्ञान', sortOrder: 3 },
    ],
  },
  {
    slug: 'hp-tet-tgt-arts',
    name: 'HP TET TGT Arts 2026',
    nameHi: 'एचपी टीईटी टीजीटी आर्ट्स 2026',
    category: 'HP TET Exams',
    totalQuestions: 150,
    durationMinutes: 150,
    negativeMarking: 0,
    marksPerQuestion: 1,
    description: 'Official test series for HP TET TGT Arts examination as per official HPBOSE syllabus.',
    subjects: [
      { name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', sortOrder: 0 },
      { name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान', sortOrder: 1 },
      { name: 'English Literature & Grammar', nameHi: 'अंग्रेजी भाषा एवं साहित्य', sortOrder: 2 },
      { name: 'Social Studies / Social Science', nameHi: 'सामाजिक अध्ययन', sortOrder: 3 },
    ],
  },
  {
    slug: 'hp-tet-jbt',
    name: 'HP TET JBT / D.El.Ed 2026',
    nameHi: 'एचपी टीईटी जेबीटी / डी.एल.एड 2026',
    category: 'HP TET Exams',
    totalQuestions: 150,
    durationMinutes: 150,
    negativeMarking: 0,
    marksPerQuestion: 1,
    description: 'Full-length practice mocks for HP TET JBT / D.El.Ed examination as per official syllabus.',
    subjects: [
      { name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', sortOrder: 0 },
      { name: 'Hindi Language', nameHi: 'हिन्दी भाषा', sortOrder: 1 },
      { name: 'English Language', nameHi: 'अंग्रेजी भाषा', sortOrder: 2 },
      { name: 'Mathematics', nameHi: 'गणित', sortOrder: 3 },
      { name: 'Environmental Studies & HP GK', nameHi: 'पर्यावरण अध्ययन व हिमाचल ज्ञान', sortOrder: 4 },
    ],
  },
  {
    slug: 'hp-patwari',
    name: 'HP Patwari Examination',
    nameHi: 'एचपी पटवारी परीक्षा',
    category: 'State Revenue',
    totalQuestions: 100,
    durationMinutes: 90,
    negativeMarking: 0,
    marksPerQuestion: 1,
    description: 'Targeted test series for HP Revenue Department Patwari recruitment examination.',
    subjects: [
      { name: 'General Hindi', nameHi: 'सामान्य हिन्दी', sortOrder: 0 },
      { name: 'General English', nameHi: 'सामान्य अंग्रेजी', sortOrder: 1 },
      { name: 'Mathematics', nameHi: 'गणित', sortOrder: 2 },
      { name: 'General Knowledge & HP GK', nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान', sortOrder: 3 },
    ],
  },
  {
    slug: 'hp-police-constable',
    name: 'HP Police Constable 2026',
    nameHi: 'एचपी पुलिस कांस्टेबल 2026',
    category: 'Police Exams',
    totalQuestions: 90,
    durationMinutes: 60,
    negativeMarking: 0.25,
    marksPerQuestion: 1,
    description: 'Complete mock test series designed strictly per the latest HP Police Constable recruitment pattern.',
    subjects: [
      { name: 'English Language', nameHi: 'अंग्रेजी भाषा', sortOrder: 0 },
      { name: 'Hindi Language', nameHi: 'हिन्दी भाषा', sortOrder: 1 },
      { name: 'Mathematics', nameHi: 'गणित', sortOrder: 2 },
      { name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान', sortOrder: 3 },
      { name: 'Reasoning Ability', nameHi: 'तर्कशक्ति क्षमता', sortOrder: 4 },
    ],
  },
  {
    slug: 'hp-judiciary-clerk',
    name: 'HP Judiciary Clerk',
    nameHi: 'एचपी उच्च न्यायालय एवं जिला न्यायालय लिपिक',
    category: 'Court Exams',
    totalQuestions: 100,
    durationMinutes: 120,
    negativeMarking: 0.33,
    marksPerQuestion: 1,
    description: 'Comprehensive test series for HP High Court & District Judiciary Clerk / Proof Reader recruitment.',
    subjects: [
      { name: 'General Knowledge & HP GK', nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान', sortOrder: 0 },
      { name: 'Basic Computers & IT', nameHi: 'कंप्यूटर एवं सूचना प्रौद्योगिकी', sortOrder: 1 },
      { name: 'Reasoning Ability', nameHi: 'तर्कशक्ति (रीजनिंग)', sortOrder: 2 },
    ],
  },
  {
    slug: 'hp-judiciary-process-server',
    name: 'HP Judiciary Process Server',
    nameHi: 'एचपी उच्च न्यायालय एवं अधीनस्थ न्यायालय प्रोसेस सर्वर',
    category: 'Court Exams',
    totalQuestions: 50,
    durationMinutes: 60,
    negativeMarking: 0,
    marksPerQuestion: 1,
    description: 'Targeted test series for HP High Court & Subordinate Courts Process Server / Bailiff recruitment.',
    subjects: [
      { name: 'General Knowledge & HP GK', nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान', sortOrder: 0 },
      { name: 'Elementary Mathematics', nameHi: 'प्रारंभिक गणित', sortOrder: 1 },
      { name: 'General Science', nameHi: 'सामान्य विज्ञान', sortOrder: 2 },
      { name: 'General English & Hindi', nameHi: 'अंग्रेजी व हिंदी भाषा', sortOrder: 3 },
      { name: 'Reasoning Ability', nameHi: 'तर्कशक्ति (रीजनिंग)', sortOrder: 4 },
    ],
  },
];

async function syncSyllabus() {
  console.log('Connecting to database...');
  for (const item of OFFICIAL_SYLLABUS) {
    console.log(`\nSyncing official syllabus for ${item.name} (${item.slug})...`);
    const exam = await prisma.exam.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        nameHi: item.nameHi,
        category: item.category,
        totalQuestions: item.totalQuestions,
        durationMinutes: item.durationMinutes,
        negativeMarking: item.negativeMarking,
        marksPerQuestion: item.marksPerQuestion,
        description: item.description,
        price: 1,
      },
      create: {
        id: `exam-${item.slug}`,
        name: item.name,
        nameHi: item.nameHi,
        slug: item.slug,
        category: item.category,
        totalQuestions: item.totalQuestions,
        durationMinutes: item.durationMinutes,
        difficulty: 'MEDIUM',
        negativeMarking: item.negativeMarking,
        marksPerQuestion: item.marksPerQuestion,
        description: item.description,
        price: 1,
      },
    });

    for (const sub of item.subjects) {
      await prisma.subject.upsert({
        where: { examId_name: { examId: exam.id, name: sub.name } },
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
      console.log(`  ✓ Subject: ${sub.name} (${sub.nameHi})`);
    }
  }

  console.log('\nAll official exam syllabi synced successfully!');
}

syncSyllabus()
  .catch((err) => {
    console.error('Sync failed:', err.message);
  })
  .finally(() => prisma.$disconnect());
