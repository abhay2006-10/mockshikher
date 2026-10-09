const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SAMPLE_QUESTIONS_MOCK_1 = [
  {
    subjectId: 'sub-gk',
    subjectName: 'General Awareness & HP GK',
    subjectNameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    topicId: 'top-hpgk',
    topicName: 'Geography of Himachal Pradesh',
    topicNameHi: 'हिमाचल प्रदेश का भूगोल',
    questionNumber: 1,
    questionText: 'Which is the largest natural lake in Himachal Pradesh?',
    questionTextHi: 'हिमाचल प्रदेश की सबसे बड़ी प्राकृतिक झील कौन सी है?',
    options: [
      { label: 'A', text: 'Renuka Lake', textHi: 'रेणुका झील' },
      { label: 'B', text: 'Rewalsar Lake', textHi: 'रिवालसर झील' },
      { label: 'C', text: 'Khajjiar Lake', textHi: 'खज्जियार झील' },
      { label: 'D', text: 'Chamera Lake', textHi: 'चमेरा झील' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'Renuka Lake situated in Sirmaur district is the largest natural lake in Himachal Pradesh with a circumference of about 3214 m.',
    explanationHi: 'सिरमौर जिले में स्थित रेणुका झील हिमाचल प्रदेश की सबसे बड़ी प्राकृतिक झील है, जिसकी परिधि लगभग 3214 मीटर है।'
  },
  {
    subjectId: 'sub-gk',
    subjectName: 'General Awareness & HP GK',
    subjectNameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    topicId: 'top-hp-hist',
    topicName: 'History of HP',
    topicNameHi: 'हिमाचल का इतिहास',
    questionNumber: 2,
    questionText: 'Who was the first Chief Minister of Himachal Pradesh?',
    questionTextHi: 'हिमाचल प्रदेश के प्रथम मुख्यमंत्री कौन थे?',
    options: [
      { label: 'A', text: 'Shanta Kumar', textHi: 'शांता कुमार' },
      { label: 'B', text: 'Dr. Yashwant Singh Parmar', textHi: 'डॉ. यशवंत सिंह परमार' },
      { label: 'C', text: 'Virbhadra Singh', textHi: 'वीरभद्र सिंह' },
      { label: 'D', text: 'Thakur Ram Lal', textHi: 'ठाकुर राम लाल' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'Dr. Yashwant Singh Parmar served as the first Chief Minister of Himachal Pradesh from 1952 to 1956 and later from 1963 to 1977.',
    explanationHi: 'डॉ. यशवंत सिंह परमार ने 1952 से 1956 तक और बाद में 1963 से 1977 तक हिमाचल प्रदेश के पहले मुख्यमंत्री के रूप में कार्य किया।'
  },
  {
    subjectId: 'sub-gk',
    subjectName: 'General Awareness & HP GK',
    subjectNameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    topicId: 'top-hp-geog',
    topicName: 'Rivers of HP',
    topicNameHi: 'हिमाचल की नदियां',
    questionNumber: 3,
    questionText: 'The Vedic name of river Ravi is:',
    questionTextHi: 'रावी नदी का वैदिक नाम क्या है?',
    options: [
      { label: 'A', text: 'Purushni', textHi: 'पुरुषणी' },
      { label: 'B', text: 'Askini', textHi: 'अस्किनी' },
      { label: 'C', text: 'Arjikiya', textHi: 'अर्जिकिया' },
      { label: 'D', text: 'Shatadru', textHi: 'शतद्रु' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation: 'The Vedic name of Ravi is Purushni or Iravati. Askini is Chenab, Arjikiya is Beas, and Shatadru is Satluj.',
    explanationHi: 'रावी का वैदिक नाम पुरुषणी या इरावती है। अस्किनी चिनाब का, अर्जिकिया ब्यास का तथा शतद्रु सतलुज का वैदिक नाम है।'
  },
  {
    subjectId: 'sub-gk',
    subjectName: 'General Awareness & HP GK',
    subjectNameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    topicId: 'top-polity',
    topicName: 'Indian Constitution',
    topicNameHi: 'भारतीय संविधान',
    questionNumber: 4,
    questionText: 'Which article of the Indian Constitution guarantees the Right to Equality?',
    questionTextHi: 'भारतीय संविधान का कौन सा अनुच्छेद समानता के अधिकार की गारंटी देता है?',
    options: [
      { label: 'A', text: 'Article 14-18', textHi: 'अनुच्छेद 14-18' },
      { label: 'B', text: 'Article 19-22', textHi: 'अनुच्छेद 19-22' },
      { label: 'C', text: 'Article 23-24', textHi: 'अनुच्छेद 23-24' },
      { label: 'D', text: 'Article 25-28', textHi: 'अनुच्छेद 25-28' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'Articles 14 to 18 of the Indian Constitution deal with the Right to Equality.',
    explanationHi: 'भारतीय संविधान के अनुच्छेद 14 से 18 समानता के अधिकार से संबंधित हैं।'
  },
  {
    subjectId: 'sub-gk',
    subjectName: 'General Awareness & HP GK',
    subjectNameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    topicId: 'top-hp-culture',
    topicName: 'Fairs & Festivals',
    topicNameHi: 'मेले एवं त्योहार',
    questionNumber: 5,
    questionText: 'In which district of Himachal Pradesh is the historic Minjar Fair celebrated?',
    questionTextHi: 'हिमाचल प्रदेश के किस जिले में ऐतिहासिक मिंजर मेला मनाया जाता है?',
    options: [
      { label: 'A', text: 'Kullu', textHi: 'कुल्लू' },
      { label: 'B', text: 'Mandi', textHi: 'मंडी' },
      { label: 'C', text: 'Chamba', textHi: 'चंबा' },
      { label: 'D', text: 'Kangra', textHi: 'कांगड़ा' },
    ],
    correctOption: 'C',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'Minjar Fair is an international level fair celebrated in the historical town of Chamba at the Chaugan.',
    explanationHi: 'मिंजर मेला चंबा के ऐतिहासिक चौगान में मनाया जाने वाला एक अंतरराष्ट्रीय स्तर का मेला है।'
  },
  {
    subjectId: 'sub-hi',
    subjectName: 'Hindi Language',
    subjectNameHi: 'हिन्दी भाषा',
    topicId: 'top-hi-grammar',
    topicName: 'Sandhi',
    topicNameHi: 'संधि विच्छेद',
    questionNumber: 6,
    questionText: 'What is the correct Sandhi Viched of "हिमालय" (Himalaya)?',
    questionTextHi: '\'हिमालय\' शब्द का सही संधि-विच्छेद क्या होगा?',
    options: [
      { label: 'A', text: 'हिम + आलय', textHi: 'हिम + आलय' },
      { label: 'B', text: 'हिमा + लय', textHi: 'हिमा + लय' },
      { label: 'C', text: 'हिम् + आलय', textHi: 'हिम् + आलय' },
      { label: 'D', text: 'हिम + लय', textHi: 'हिम + लय' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'Himalaya is an example of Dirgha Swara Sandhi: Him (हिम) + Aalaya (आलय) = Himalaya.',
    explanationHi: '\'हिम + आलय = हिमालय\' यह दीर्घ स्वर संधि का उपयुक्त उदाहरण है (अ + आ = आ)।'
  },
  {
    subjectId: 'sub-hi',
    subjectName: 'Hindi Language',
    subjectNameHi: 'हिन्दी भाषा',
    topicId: 'top-hi-vocab',
    topicName: 'Synonyms (Paryayvachi)',
    topicNameHi: 'पर्यायवाची शब्द',
    questionNumber: 7,
    questionText: 'Which of the following is NOT a synonym of "अग्नि" (Fire)?',
    questionTextHi: 'निम्नलिखित में से कौन सा शब्द \'अग्नि\' का पर्यायवाची नहीं है?',
    options: [
      { label: 'A', text: 'पावक (Pavak)', textHi: 'पावक' },
      { label: 'B', text: 'अनल (Anal)', textHi: 'अनल' },
      { label: 'C', text: 'अनिल (Anil)', textHi: 'अनिल' },
      { label: 'D', text: 'हुताशन (Hutashan)', textHi: 'हुताशन' },
    ],
    correctOption: 'C',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation: '\'अनिल\' means Wind (वायु/हवा), whereas Pavak, Anal, and Hutashan are synonyms of Fire (अग्नि).',
    explanationHi: '\'अनिल\' वायु (हवा) का पर्यायवाची है, जबकि पावक, अनल और हुताशन अग्नि के पर्यायवाची हैं।'
  },
  {
    subjectId: 'sub-en',
    subjectName: 'English Language',
    subjectNameHi: 'अंग्रेजी भाषा',
    topicId: 'top-en-vocab',
    topicName: 'Antonyms',
    topicNameHi: 'विलोम शब्द',
    questionNumber: 8,
    questionText: 'Select the antonym of the word: DILIGENT',
    questionTextHi: '\'DILIGENT\' शब्द का सही विलोम शब्द चुनें:',
    options: [
      { label: 'A', text: 'Hardworking', textHi: 'Hardworking' },
      { label: 'B', text: 'Lazy', textHi: 'Lazy' },
      { label: 'C', text: 'Intelligent', textHi: 'Intelligent' },
      { label: 'D', text: 'Cautious', textHi: 'Cautious' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'Diligent means showing care and conscientiousness in work (industrious). Its antonym is lazy or indolent.',
    explanationHi: 'Diligent का अर्थ परिश्रमी/मेहनती होता है। इसका सही विलोम \'Lazy\' (आलसी) है।'
  },
  {
    subjectId: 'sub-mr',
    subjectName: 'Mathematics & Reasoning',
    subjectNameHi: 'गणित एवं तर्कशक्ति',
    topicId: 'top-math-arith',
    topicName: 'Percentage',
    topicNameHi: 'प्रतिशत',
    questionNumber: 9,
    questionText: 'If 20% of a number is 80, then what is 120% of that number?',
    questionTextHi: 'यदि किसी संख्या का 20% 80 है, तो उस संख्या का 120% क्या होगा?',
    options: [
      { label: 'A', text: '400', textHi: '400' },
      { label: 'B', text: '480', textHi: '480' },
      { label: 'C', text: '520', textHi: '520' },
      { label: 'D', text: '360', textHi: '360' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'Let number be x. 0.20x = 80 => x = 400. 120% of 400 = 1.20 * 400 = 480.',
    explanationHi: 'माना संख्या x है। 20% = 80 => x = 80 * 5 = 400। अब 400 का 120% = (120/100) * 400 = 480।'
  },
  {
    subjectId: 'sub-mr',
    subjectName: 'Mathematics & Reasoning',
    subjectNameHi: 'गणित एवं तर्कशक्ति',
    topicId: 'top-reasoning-series',
    topicName: 'Number Series',
    topicNameHi: 'संख्या श्रृंखला',
    questionNumber: 10,
    questionText: 'Find the missing number in the series: 3, 7, 15, 31, 63, ?',
    questionTextHi: 'दी गई श्रृंखला में लुप्त संख्या ज्ञात कीजिए: 3, 7, 15, 31, 63, ?',
    options: [
      { label: 'A', text: '125', textHi: '125' },
      { label: 'B', text: '127', textHi: '127' },
      { label: 'C', text: '128', textHi: '128' },
      { label: 'D', text: '131', textHi: '131' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation: 'Pattern: (x * 2) + 1. 3*2+1=7; 7*2+1=15; 15*2+1=31; 31*2+1=63; 63*2+1=127.',
    explanationHi: 'पैटर्न: (संख्या * 2) + 1। 63 * 2 + 1 = 126 + 1 = 127।'
  },
];

async function seed() {
  console.log('--- SEEDING DATABASE ---');

  // 1. Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@mockprep.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@mockprep.com',
      name: 'Super Admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✓ Admin user verified (admin@mockprep.com / admin123)');

  // 2. Create Exams
  const hpPolice = await prisma.exam.upsert({
    where: { slug: 'hp-police-constable' },
    update: { name: 'HP Police Constable 2026', totalQuestions: 90, durationMinutes: 60 },
    create: {
      id: 'exam-hp-police',
      name: 'HP Police Constable 2026',
      nameHi: 'एचपी पुलिस कांस्टेबल 2026',
      slug: 'hp-police-constable',
      description: 'Complete mock test series designed strictly per the latest HP Police pattern.',
      totalQuestions: 90,
      durationMinutes: 60,
      difficulty: 'MEDIUM',
      price: 149,
      isPopular: true,
      category: 'Police Exams',
    },
  });

  await prisma.exam.upsert({
    where: { slug: 'hp-patwari' },
    update: {},
    create: {
      id: 'exam-hp-patwari',
      name: 'HP Patwari Examination',
      slug: 'hp-patwari',
      description: 'Targeted test series for HP Revenue Department Patwari recruitment.',
      totalQuestions: 100,
      durationMinutes: 90,
      difficulty: 'MEDIUM',
      price: 149,
      category: 'Revenue',
    },
  });
  console.log('✓ Exams created');

  // 3. Create Subjects & Topics for HP Police
  const subjectsData = [
    { id: 'sub-gk', name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान' },
    { id: 'sub-hi', name: 'Hindi Language', nameHi: 'हिन्दी भाषा' },
    { id: 'sub-en', name: 'English Language', nameHi: 'अंग्रेजी भाषा' },
    { id: 'sub-mr', name: 'Mathematics & Reasoning', nameHi: 'गणित एवं तर्कशक्ति' },
    { id: 'sub-st', name: 'Science & Technology', nameHi: 'विज्ञान एवं प्रौद्योगिकी' },
  ];

  for (const s of subjectsData) {
    await prisma.subject.upsert({
      where: { examId_name: { examId: hpPolice.id, name: s.name } },
      update: { nameHi: s.nameHi },
      create: {
        id: s.id,
        examId: hpPolice.id,
        name: s.name,
        nameHi: s.nameHi,
      },
    });
  }
  console.log('✓ Subjects created');

  // 4. Create Mock Tests 1 through 10 for HP Police (configured for 10 mocks)
  const mocks = [
    { id: 'hp-police-mock-1', testNumber: 1, name: 'HP Police Constable Full Mock 1 (Free Diagnostic)', isFree: true, isPublished: true },
    { id: 'hp-police-mock-2', testNumber: 2, name: 'HP Police Constable Full Mock 2 (High-Yield GS Special)', isFree: false, isPublished: true },
    { id: 'hp-police-mock-3', testNumber: 3, name: 'HP Police Constable Full Mock 3 (Maths & Reasoning Focus)', isFree: false, isPublished: true },
    { id: 'hp-police-mock-4', testNumber: 4, name: 'HP Police Constable Full Mock 4 (Simulation Standard)', isFree: false, isPublished: true },
    { id: 'hp-police-mock-5', testNumber: 5, name: 'HP Police Constable Full Mock 5 (Exam Level)', isFree: false, isPublished: true },
    { id: 'hp-police-mock-6', testNumber: 6, name: 'HP Police Constable Full Mock 6 (Subject Speed Drill)', isFree: false, isPublished: true },
    { id: 'hp-police-mock-7', testNumber: 7, name: 'HP Police Constable Full Mock 7 (Advanced Practice)', isFree: false, isPublished: true },
    { id: 'hp-police-mock-8', testNumber: 8, name: 'HP Police Constable Full Mock 8 (Revision Test)', isFree: false, isPublished: true },
    { id: 'hp-police-mock-9', testNumber: 9, name: 'HP Police Constable Full Mock 9 (High Difficulty Challenge)', isFree: false, isPublished: true },
    { id: 'hp-police-mock-10', testNumber: 10, name: 'HP Police Constable Full Mock 10 (Final Mock Drill)', isFree: false, isPublished: true },
  ];

  for (const m of mocks) {
    await prisma.mockTest.upsert({
      where: { examId_testNumber: { examId: hpPolice.id, testNumber: m.testNumber } },
      update: {
        name: m.name,
        isFree: m.isFree,
        isPublished: m.isPublished,
      },
      create: {
        id: m.id,
        examId: hpPolice.id,
        testNumber: m.testNumber,
        name: m.name,
        isFree: m.isFree,
        isPublished: m.isPublished,
        totalQuestions: 0,
        durationMinutes: 60,
        totalMarks: 0,
      },
    });
  }
  console.log('✓ Mock Tests 1-10 created');

  // 5. Seed questions ONLY into Mock 1
  const mock1 = await prisma.mockTest.findUnique({
    where: { examId_testNumber: { examId: hpPolice.id, testNumber: 1 } },
  });

  // Clear existing questions in mock 1 to ensure clean seed
  await prisma.question.deleteMany({ where: { mockTestId: mock1.id } });

  for (const q of SAMPLE_QUESTIONS_MOCK_1) {
    const subject = await prisma.subject.findFirst({
      where: { examId: hpPolice.id, name: q.subjectName },
    });

    let topic = await prisma.topic.findFirst({
      where: { subjectId: subject.id, name: q.topicName },
    });

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          id: q.topicId,
          subjectId: subject.id,
          name: q.topicName,
          nameHi: q.topicNameHi,
        },
      });
    }

    await prisma.question.create({
      data: {
        mockTestId: mock1.id,
        subjectId: subject.id,
        topicId: topic.id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        questionTextHi: q.questionTextHi,
        correctOption: q.correctOption,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        difficulty: q.difficulty,
        explanation: q.explanation,
        explanationHi: q.explanationHi,
        options: {
          create: q.options.map((opt) => ({
            optionLabel: opt.label,
            optionText: opt.text,
            optionTextHi: opt.textHi,
          })),
        },
      },
    });
  }

  // Update Mock 1 question count and marks
  await prisma.mockTest.update({
    where: { id: mock1.id },
    data: {
      totalQuestions: SAMPLE_QUESTIONS_MOCK_1.length,
      totalMarks: SAMPLE_QUESTIONS_MOCK_1.reduce((sum, q) => sum + q.marks, 0),
    },
  });

  console.log(`✓ Seeded ${SAMPLE_QUESTIONS_MOCK_1.length} questions into Mock 1 ONLY`);
  console.log('✓ Mock 2, 3, 4, 5 currently have 0 questions');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
