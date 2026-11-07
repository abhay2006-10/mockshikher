const fs = require('fs');
const path = require('path');

function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const rows = [];
  let currentRow = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    const next = clean[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        currentRow.push(cur.trim());
        cur = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && next === '\n') i++;
        currentRow.push(cur.trim());
        if (currentRow.some((f) => f.length > 0)) rows.push(currentRow);
        currentRow = [];
        cur = '';
      } else {
        cur += c;
      }
    }
  }
  if (cur.length > 0 || currentRow.length > 0) {
    currentRow.push(cur.trim());
    if (currentRow.some((f) => f.length > 0)) rows.push(currentRow);
  }
  return rows;
}

const csvDir = path.join(__dirname, '..', 'scratch', 'forest_guard_zip');
const files = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv')).sort();

const subjectsDef = [
  { name: 'General Knowledge & Current Affairs', nameHi: 'सामान्य ज्ञान एवं समसामयिकी', sortOrder: 0 },
  { name: 'Himachal Pradesh GK', nameHi: 'हिमाचल प्रदेश सामान्य ज्ञान', sortOrder: 1 },
  { name: 'Forestry, Environment & Wildlife', nameHi: 'वानिकी, पर्यावरण एवं वन्यजीव', sortOrder: 2 },
  { name: 'Hindi', nameHi: 'हिन्दी भाषा', sortOrder: 3 },
  { name: 'English', nameHi: 'अंग्रेजी भाषा', sortOrder: 4 },
  { name: 'Maths & Reasoning', nameHi: 'गणित एवं तर्कशक्ति', sortOrder: 5 },
];

const mocks = [];

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const testNumber = i + 1;
  const filePath = path.join(csvDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  const header = rows[0].map(h => h.trim());
  const qRows = rows.slice(1);

  const questions = qRows.map((r, qIdx) => {
    const obj = {};
    header.forEach((h, hIdx) => {
      obj[h] = r[hIdx] !== undefined ? r[hIdx].trim() : '';
    });

    const diff = (obj.difficulty || 'MEDIUM').toUpperCase();
    const cleanDiff = ['EASY', 'MEDIUM', 'HARD'].includes(diff) ? diff : 'MEDIUM';
    const correct = (obj.correct_answer || 'A').toUpperCase();
    const cleanCorrect = ['A', 'B', 'C', 'D'].includes(correct) ? correct : 'A';

    return {
      qNum: qIdx + 1,
      subject: obj.subject || 'General Knowledge & Current Affairs',
      topic: obj.topic || obj.subject || 'General',
      textEn: obj.question,
      textHi: obj.hindi_question || null,
      optAEn: obj.option_a,
      optAHi: obj.hindi_option_a || null,
      optBEn: obj.option_b,
      optBHi: obj.hindi_option_b || null,
      optCEn: obj.option_c,
      optCHi: obj.hindi_option_c || null,
      optDEn: obj.option_d,
      optDHi: obj.hindi_option_d || null,
      correct: cleanCorrect,
      expEn: obj.explanation || null,
      expHi: obj.hindi_explanation || null,
      difficulty: cleanDiff,
    };
  });

  mocks.push({
    testNumber,
    name: `HP Forest Guard Full Mock ${testNumber} (Official Pattern)`,
    durationMinutes: 90,
    totalQuestions: questions.length,
    totalMarks: questions.length,
    marksPerQuestion: 1.0,
    negativeMarksPerQuestion: 0,
    questions,
  });
}

const pack = {
  examSlug: 'hp-forest-guard',
  examName: 'HP Forest Guard / Assistant Forest Guard 2026',
  examNameHi: 'हिमाचल प्रदेश वन रक्षक / सहायक वन रक्षक परीक्षा 2026',
  description: 'Official pattern Himachal Pradesh Forest Guard & Assistant Forest Guard test series. 10 full-length bilingual mocks (100 questions, 100 marks, 90 minutes, no negative marking) covering HP GK, Forestry, Environment & Wildlife, General Science, Hindi, English, and Maths & Reasoning.',
  descriptionHi: 'हिमाचल प्रदेश वन रक्षक भर्ती परीक्षा की आधिकारिक पैटर्न टेस्ट सीरीज़। 10 फुल-लेंथ द्विभाषी मॉक टेस्ट (100 प्रश्न, 100 अंक, 90 मिनट, कोई नकारात्मक अंकन नहीं)।',
  category: 'Forestry',
  difficulty: 'MEDIUM',
  totalQuestions: 100,
  durationMinutes: 90,
  totalMarks: 100,
  marksPerQuestion: 1.0,
  negativeMarking: 0,
  subjects: subjectsDef,
  mocks,
};

const outPath = path.join(__dirname, '..', 'src', 'mock-packs', 'hp-forest-guard.json');
fs.writeFileSync(outPath, JSON.stringify(pack, null, 2), 'utf8');

console.log(`Generated mock pack at: ${outPath}`);
console.log(`Mocks: ${mocks.length}, Total questions: ${mocks.reduce((acc, m) => acc + m.questions.length, 0)}`);
