const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Ensure database connection string is loaded
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
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
}

loadEnv();

const prisma = new PrismaClient();

/**
 * Cleanly deletes an exam if it already exists, cascading all related dependencies:
 * Attempts, QuestionOptions, Questions, MockTests, Topics, Subjects, Purchases, Exam.
 */
async function cleanDeleteExam(slug) {
  const existing = await prisma.exam.findUnique({
    where: { slug },
    include: {
      mockTests: { select: { id: true } },
      subjects: { select: { id: true } },
    },
  });

  if (!existing) {
    console.log(`ℹ Exam '${slug}' does not exist in DB — proceeding to create.`);
    return;
  }

  console.log(`⚠ Found existing exam '${slug}' (ID: ${existing.id}). Deleting cleanly...`);

  const mockTestIds = existing.mockTests.map((m) => m.id);
  const subjectIds = existing.subjects.map((s) => s.id);

  if (mockTestIds.length > 0) {
    // Delete attempt answers
    await prisma.testAttemptAnswer.deleteMany({
      where: { attempt: { mockTestId: { in: mockTestIds } } },
    });
    // Delete attempts
    await prisma.testAttempt.deleteMany({
      where: { mockTestId: { in: mockTestIds } },
    });
    // Delete question options
    await prisma.questionOption.deleteMany({
      where: { question: { mockTestId: { in: mockTestIds } } },
    });
    // Delete questions
    await prisma.question.deleteMany({
      where: { mockTestId: { in: mockTestIds } },
    });
    // Delete mock tests
    await prisma.mockTest.deleteMany({
      where: { id: { in: mockTestIds } },
    });
  }

  if (subjectIds.length > 0) {
    // Delete topics
    await prisma.topic.deleteMany({
      where: { subjectId: { in: subjectIds } },
    });
    // Delete subjects
    await prisma.subject.deleteMany({
      where: { id: { in: subjectIds } },
    });
  }

  // Delete purchases
  await prisma.purchase.deleteMany({
    where: { examId: existing.id },
  });

  // Delete exam
  await prisma.exam.delete({
    where: { id: existing.id },
  });

  console.log(`✓ Cleanly deleted existing exam '${slug}' and all associated entities.`);
}

/**
 * Creates 10 standard full-length mock tests for an exam.
 */
async function createMockTestsForExam(examId, examPrefix, examName, isNonMed) {
  const mockNames = [
    `${examName} Full Mock 1 (Free Diagnostic)`,
    `${examName} Full Mock 2 (${isNonMed ? 'Maths & Physical Sciences Special' : 'Social Studies Special'})`,
    `${examName} Full Mock 3 (${isNonMed ? 'Physics & Chemistry In-Depth' : 'History & Polity Focus'})`,
    `${examName} Full Mock 4 (Child Pedagogy & HP GK Focus)`,
    `${examName} Full Mock 5 (Exam Level Simulation Standard)`,
    `${examName} Full Mock 6 (${isNonMed ? 'Pure Mathematics Speed Drill' : 'Geography & Economics Special'})`,
    `${examName} Full Mock 7 (${isNonMed ? 'Physical Chemistry & Mechanics Focus' : 'English & Social Sciences Focus'})`,
    `${examName} Full Mock 8 (Comprehensive Full Revision)`,
    `${examName} Full Mock 9 (High Difficulty Challenge)`,
    `${examName} Full Mock 10 (Final All-HP Mock Drill)`,
  ];

  const createdMocks = [];
  for (let i = 1; i <= 10; i++) {
    const mock = await prisma.mockTest.create({
      data: {
        id: `${examPrefix}-mock-${i}`,
        examId,
        testNumber: i,
        name: mockNames[i - 1],
        isFree: i === 1,
        isPublished: true,
        durationMinutes: 150,
        totalQuestions: 150,
        totalMarks: 150,
        marksPerQuestion: 1.0,
        negativeMarksPerQuestion: 0.0,
      },
    });
    createdMocks.push(mock);
  }
  return createdMocks;
}

// ==========================================
// HP TET TGT NON-MEDICAL QUESTIONS (MOCK 1)
// ==========================================
const TGT_NON_MED_QUESTIONS = [
  // --- Section 1: Child Development & Pedagogy (30 Questions) ---
  {
    subjectName: 'Child Development & Pedagogy',
    topicName: 'Cognitive Development & Learning Theories',
    topicNameHi: 'संज्ञानात्मक विकास एवं अधिगम सिद्धांत',
    questionText: 'According to Jean Piaget, the stage where a child begins to think logically about concrete events is known as:',
    questionTextHi: 'जीन पियाजे के अनुसार, वह अवस्था जिसमें बच्चा मूर्त घटनाओं के बारे में तार्किक रूप से सोचना शुरू करता है, कहलाती है:',
    options: [
      { label: 'A', text: 'Sensori-motor Stage', textHi: 'संवेदी-गामक अवस्था' },
      { label: 'B', text: 'Pre-operational Stage', textHi: 'पूर्व-संक्रियात्मक अवस्था' },
      { label: 'C', text: 'Concrete Operational Stage (7–11 years)', textHi: 'मूर्त संक्रियात्मक अवस्था (7–11 वर्ष)' },
      { label: 'D', text: 'Formal Operational Stage', textHi: 'औपचारिक संक्रियात्मक अवस्था' },
    ],
    correctOption: 'C',
    explanation: 'Concrete operational stage (ages 7 to 11) is characterized by logical thought regarding concrete events, conservation, reversibility, and classification.',
    explanationHi: 'मूर्त संक्रियात्मक अवस्था (7-11 वर्ष) में बच्चे मूर्त वस्तुओं के संबंध में तार्किक चिंतन, संरक्षण (conservation) और प्रतिवर्ती सोच करने में सक्षम हो जाते हैं।'
  },
  {
    subjectName: 'Child Development & Pedagogy',
    topicName: 'Vygotsky Socio-Cultural Theory',
    topicNameHi: 'वाइगोत्स्की का सामाजिक-सांस्कृतिक सिद्धांत',
    questionText: "In Lev Vygotsky's theory, the temporary assistance given by a more knowledgeable other (MKO) to help a learner master a task is called:",
    questionTextHi: 'लेव वाइगोत्स्की के सिद्धांत में, किसी कार्य में दक्षता हासिल कराने के लिए अधिक ज्ञानी व्यक्ति द्वारा दी जाने वाली अस्थायी सहायता क्या कहलाती है?',
    options: [
      { label: 'A', text: 'Equilibration', textHi: 'संतुलनीकरण' },
      { label: 'B', text: 'Scaffolding', textHi: 'मचान / पाड़ (Scaffolding)' },
      { label: 'C', text: 'Conditioning', textHi: 'अनुबंधन' },
      { label: 'D', text: 'Assimilation', textHi: 'आत्मसातीकरण' },
    ],
    correctOption: 'B',
    explanation: 'Scaffolding refers to tailored support given by a teacher or peer to help the learner navigate the Zone of Proximal Development (ZPD).',
    explanationHi: 'मचान (Scaffolding) वाइगोत्स्की के निकटस्थ विकास क्षेत्र (ZPD) में सीखने के लिए दी जाने वाली आवश्यक मार्गदर्शन और सहायता है।'
  },
  {
    subjectName: 'Child Development & Pedagogy',
    topicName: 'Moral Development',
    topicNameHi: 'नैतिक विकास',
    questionText: "According to Lawrence Kohlberg, an individual who evaluates moral decisions based on universal human rights and social justice is at:",
    questionTextHi: 'लॉरेंस कोहलबर्ग के अनुसार, जो व्यक्ति सार्वभौमिक मानवाधिकारों एवं सामाजिक न्याय के आधार पर नैतिक निर्णय लेता है, वह किस स्तर पर है?',
    options: [
      { label: 'A', text: 'Pre-conventional Level', textHi: 'पूर्व-परंपरागत स्तर' },
      { label: 'B', text: 'Conventional Level', textHi: 'परंपरागत स्तर' },
      { label: 'C', text: 'Post-conventional Level (Stage 6)', textHi: 'उत्तर-परंपरागत स्तर (चरण 6 - सार्वभौमिक नैतिक सिद्धांत)' },
      { label: 'D', text: 'Instrumental Relativist Level', textHi: 'साधनात्मक सापेक्षतावादी स्तर' },
    ],
    correctOption: 'C',
    explanation: 'Stage 6 of Kohlberg\'s theory represents universal ethical principles orientation, part of the post-conventional level.',
    explanationHi: 'कोहलबर्ग के उत्तर-परंपरागत स्तर का चरण 6 सार्वभौमिक नैतिक सिद्धांतों पर आधारित न्याय और मानवीय गरिमा को सर्वोच्च मानता है।'
  },
  {
    subjectName: 'Child Development & Pedagogy',
    topicName: 'Inclusive Education',
    topicNameHi: 'समावेशी शिक्षा',
    questionText: 'Under the Rights of Persons with Disabilities (RPwD) Act 2016, how many categories of disabilities are recognized?',
    questionTextHi: 'दिव्यांगजन अधिकार अधिनियम (RPwD Act) 2016 के तहत कितनी प्रकार की दिव्यांगताओं को मान्यता दी गई है?',
    options: [
      { label: 'A', text: '7 types', textHi: '7 प्रकार' },
      { label: 'B', text: '14 types', textHi: '14 प्रकार' },
      { label: 'C', text: '21 types', textHi: '21 प्रकार' },
      { label: 'D', text: '28 types', textHi: '28 प्रकार' },
    ],
    correctOption: 'C',
    explanation: 'The RPwD Act 2016 expanded the recognized disabilities from 7 (under 1995 Act) to 21 categories.',
    explanationHi: 'RPwD अधिनियम 2016 के अंतर्गत मान्यता प्राप्त दिव्यांगताओं की संख्या 7 से बढ़ाकर 21 कर दी गई है।'
  },
  {
    subjectName: 'Child Development & Pedagogy',
    topicName: 'Evaluation & CCE',
    topicNameHi: 'मूल्यांकन एवं सतत समग्र आकलन',
    questionText: 'Which assessment approach provides immediate diagnostic feedback to improve learning during the instructional process?',
    questionTextHi: 'शिक्षण प्रक्रिया के दौरान अधिगम में सुधार के लिए तत्काल उपचारात्मक प्रतिपुष्टि प्रदान करने वाला आकलन कौन सा है?',
    options: [
      { label: 'A', text: 'Summative Assessment', textHi: 'योगात्मक आकलन' },
      { label: 'B', text: 'Formative Assessment (Assessment for Learning)', textHi: 'रचनात्मक आकलन (सीखने के लिए आकलन)' },
      { label: 'C', text: 'Standardized Placement Test', textHi: 'मानकीकृत स्थानन परीक्षण' },
      { label: 'D', text: 'Annual Terminal Exam', textHi: 'वार्षिक सत्रांत परीक्षा' },
    ],
    correctOption: 'B',
    explanation: 'Formative assessment is continuous and diagnostic, aimed at enhancing student understanding during learning.',
    explanationHi: 'रचनात्मक आकलन (Formative Assessment) शिक्षण-अधिगम प्रक्रिया के साथ-साथ चलता है और कमजोरियों को दूर करने में सहायता करता है।'
  },
  // --- Section 2: General Awareness, Environment & HP GK (30 Questions) ---
  {
    subjectName: 'General Awareness & HP GK',
    topicName: 'Himachal Pradesh History & Geography',
    topicNameHi: 'हिमाचल प्रदेश का इतिहास एवं भूगोल',
    questionText: 'Which river flows through the highest number of districts in Himachal Pradesh?',
    questionTextHi: 'हिमाचल प्रदेश के सर्वाधिक जिलों से होकर बहने वाली नदी कौन सी है?',
    options: [
      { label: 'A', text: 'Ravi', textHi: 'रावी' },
      { label: 'B', text: 'Beas', textHi: 'ब्यास' },
      { label: 'C', text: 'Satluj', textHi: 'सतलुज' },
      { label: 'D', text: 'Yamuna', textHi: 'यमुना' },
    ],
    correctOption: 'C',
    explanation: 'Satluj enters HP at Shipki La (Kinnaur) and flows through Kinnaur, Shimla, Kullu, Mandi, Solan, and Bilaspur (6 districts).',
    explanationHi: 'सतलुज नदी हिमाचल प्रदेश के 6 जिलों (किन्नौर, शिमला, कुल्लू, मंडी, सोलन, बिलासपुर) से होकर बहती है।'
  },
  {
    subjectName: 'General Awareness & HP GK',
    topicName: 'HP Demography & Heritage',
    topicNameHi: 'हिमाचल की जनसांख्यिकी एवं धरोहर',
    questionText: 'The famous Tabo Monastery, often called the "Ajanta of the Himalayas", is situated in which district of Himachal Pradesh?',
    questionTextHi: 'हिमालय का अजंता कहे जाने वाला प्रसिद्ध ताबो मठ हिमाचल प्रदेश के किस जिले में स्थित है?',
    options: [
      { label: 'A', text: 'Kinnaur', textHi: 'किन्नौर' },
      { label: 'B', text: 'Lahaul & Spiti', textHi: 'लाहौल एवं स्पीति' },
      { label: 'C', text: 'Kullu', textHi: 'कुल्लू' },
      { label: 'D', text: 'Chamba', textHi: 'चंबा' },
    ],
    correctOption: 'B',
    explanation: 'Tabo Monastery founded in 996 AD by Ringchen Zangpo is in the Spiti Valley, Lahaul & Spiti district.',
    explanationHi: 'ताबो मठ लाहौल एवं स्पीति जिले की स्पीति घाटी में स्थित है। इसकी स्थापना 996 ई. में हुई थी।'
  },
  {
    subjectName: 'General Awareness & HP GK',
    topicName: 'Indian Polity & Constitution',
    topicNameHi: 'भारतीय राजव्यवस्था एवं संविधान',
    questionText: 'Under Article 324 of the Indian Constitution, the superintendence, direction, and control of elections is vested in the:',
    questionTextHi: 'भारतीय संविधान के अनुच्छेद 324 के तहत चुनावों का अधीक्षण, निर्देशन और नियंत्रण किसमें निहित है?',
    options: [
      { label: 'A', text: 'Supreme Court of India', textHi: 'भारत का सर्वोच्च न्यायालय' },
      { label: 'B', text: 'Election Commission of India', textHi: 'भारत का निर्वाचन आयोग' },
      { label: 'C', text: 'Union Ministry of Law and Justice', textHi: 'केंद्रीय विधि एवं न्याय मंत्रालय' },
      { label: 'D', text: 'Parliament of India', textHi: 'भारतीय संसद' },
    ],
    correctOption: 'B',
    explanation: 'Article 324 vests the superintendence, direction, and control of elections to Parliament, State Legislatures, and the offices of President and Vice-President in the Election Commission.',
    explanationHi: 'अनुच्छेद 324 निर्वाचन आयोग को स्वतंत्र एवं निष्पक्ष चुनाव संपन्न कराने का संवैधानिक अधिकार देता है।'
  },
  {
    subjectName: 'General Awareness & HP GK',
    topicName: 'Environmental Science & Ecology',
    topicNameHi: 'पर्यावरण विज्ञान एवं पारिस्थितिकी',
    questionText: 'Which international protocol adopted in 1987 aims to protect the stratospheric ozone layer by phasing out ODS?',
    questionTextHi: '1987 में अपनाया गया कौन सा अंतरराष्ट्रीय प्रोटोकॉल ओजोन क्षयकारी पदार्थों (ODS) को चरणबद्ध रूप से समाप्त करने से संबंधित है?',
    options: [
      { label: 'A', text: 'Kyoto Protocol', textHi: 'क्योटो प्रोटोकॉल' },
      { label: 'B', text: 'Montreal Protocol', textHi: 'मॉन्ट्रियल प्रोटोकॉल' },
      { label: 'C', text: 'Paris Agreement', textHi: 'पेरिस समझौता' },
      { label: 'D', text: 'Ramsar Convention', textHi: 'रामसर अभिसमय' },
    ],
    correctOption: 'B',
    explanation: 'The Montreal Protocol on Substances that Deplete the Ozone Layer was signed on 16 September 1987.',
    explanationHi: 'मॉन्ट्रियल प्रोटोकॉल (1987) ओजोन परत को नुकसान पहुंचाने वाले पदार्थों जैसे सीएफसी (CFC) के उत्पादन को रोकने हेतु बनाया गया था।'
  },
  // --- Section 3: Mathematics (30 Questions) ---
  {
    subjectName: 'Mathematics',
    topicName: 'Quadratic Equations & Algebra',
    topicNameHi: 'द्विघात समीकरण एवं बीजगणित',
    questionText: 'If the roots of the quadratic equation 2x² - kx + 8 = 0 are real and equal, then the value of k is:',
    questionTextHi: 'यदि द्विघात समीकरण 2x² - kx + 8 = 0 के मूल वास्तविक और समान हों, तो k का मान क्या होगा?',
    options: [
      { label: 'A', text: '±4', textHi: '±4' },
      { label: 'B', text: '±8', textHi: '±8' },
      { label: 'C', text: '±16', textHi: '±16' },
      { label: 'D', text: '±2', textHi: '±2' },
    ],
    correctOption: 'B',
    explanation: 'For real and equal roots, discriminant D = b² - 4ac = 0. Here (-k)² - 4(2)(8) = 0 => k² - 64 = 0 => k = ±8.',
    explanationHi: 'समान मूलों के लिए विविक्तकर (Discriminant) D = b² - 4ac = 0 होता है। (-k)² - 4(2)(8) = 0 => k² = 64 => k = ±8।'
  },
  {
    subjectName: 'Mathematics',
    topicName: 'Trigonometry & Identities',
    topicNameHi: 'त्रिकोणमिति एवं सर्वसमिकाएं',
    questionText: 'What is the value of (sin² 30° + cos² 30°) + (sec² 45° - tan² 45°)?',
    questionTextHi: '(sin² 30° + cos² 30°) + (sec² 45° - tan² 45°) का मान क्या है?',
    options: [
      { label: 'A', text: '0', textHi: '0' },
      { label: 'B', text: '1', textHi: '1' },
      { label: 'C', text: '2', textHi: '2' },
      { label: 'D', text: '√3', textHi: '√3' },
    ],
    correctOption: 'C',
    explanation: 'From fundamental identities: sin²θ + cos²θ = 1 and sec²θ - tan²θ = 1. Therefore, 1 + 1 = 2.',
    explanationHi: 'मूल त्रिकोणमितीय सर्वसमिका से: sin²θ + cos²θ = 1 और sec²θ - tan²θ = 1। अतः 1 + 1 = 2।'
  },
  {
    subjectName: 'Mathematics',
    topicName: 'Calculus & Limits',
    topicNameHi: 'कलन एवं सीमाएं (Calculus)',
    questionText: 'Evaluate the limit: lim (x -> 0) [sin(5x) / x]:',
    questionTextHi: 'सीमा का मान ज्ञात कीजिए: lim (x -> 0) [sin(5x) / x]:',
    options: [
      { label: 'A', text: '0', textHi: '0' },
      { label: 'B', text: '1', textHi: '1' },
      { label: 'C', text: '5', textHi: '5' },
      { label: 'D', text: '1/5', textHi: '1/5' },
    ],
    correctOption: 'C',
    explanation: 'lim (x -> 0) [sin(kx) / x] = k. Here k = 5, so the limit is 5.',
    explanationHi: 'मानक सूत्र lim (x -> 0) [sin(ax)/x] = a होता है। यहाँ a = 5 है, इसलिए मान 5 होगा।'
  },
  {
    subjectName: 'Mathematics',
    topicName: 'Coordinate Geometry',
    topicNameHi: 'निर्देशांक ज्यामिति',
    questionText: 'The distance between the points P(2, -3) and Q(10, y) is 10 units. The possible values of y are:',
    questionTextHi: 'बिंदुओं P(2, -3) और Q(10, y) के बीच की दूरी 10 मात्रक है। y के संभावित मान क्या होंगे?',
    options: [
      { label: 'A', text: '3, -9', textHi: '3, -9' },
      { label: 'B', text: '-3, 9', textHi: '-3, 9' },
      { label: 'C', text: '6, -6', textHi: '6, -6' },
      { label: 'D', text: '9, -9', textHi: '9, -9' },
    ],
    correctOption: 'A',
    explanation: 'Distance formula: (10 - 2)² + (y - (-3))² = 10² => 64 + (y + 3)² = 100 => (y + 3)² = 36 => y + 3 = ±6 => y = 3 or y = -9.',
    explanationHi: 'दूरी सूत्र से: (10 - 2)² + (y + 3)² = 10² => 64 + (y + 3)² = 100 => (y + 3)² = 36 => y + 3 = ±6 => y = 3 या -9।'
  },
  // --- Section 4: Physics & Chemistry (60 Questions) ---
  {
    subjectName: 'Physics & Chemistry',
    topicName: 'Physics: Laws of Motion & Work Power Energy',
    topicNameHi: 'भौतिकी: गति के नियम एवं कार्य ऊर्जा',
    questionText: 'A body of mass 5 kg falls freely from a height of 20 m. Its kinetic energy just before hitting the ground is: (take g = 10 m/s²)',
    questionTextHi: '5 kg द्रव्यमान का एक पिंड 20 m की ऊंचाई से स्वतंत्रतापूर्वक गिरता है। जमीन से टकराने से ठीक पहले इसकी गतिज ऊर्जा क्या होगी? (g = 10 m/s² लें)',
    options: [
      { label: 'A', text: '500 J', textHi: '500 J' },
      { label: 'B', text: '1000 J', textHi: '1000 J' },
      { label: 'C', text: '2000 J', textHi: '2000 J' },
      { label: 'D', text: '100 J', textHi: '100 J' },
    ],
    correctOption: 'B',
    explanation: 'By conservation of mechanical energy: Final KE = Initial PE = mgh = 5 * 10 * 20 = 1000 J.',
    explanationHi: 'ऊर्जा संरक्षण नियम से: अंतिम गतिज ऊर्जा = प्रारंभिक स्थितिज ऊर्जा = mgh = 5 * 10 * 20 = 1000 जूल।'
  },
  {
    subjectName: 'Physics & Chemistry',
    topicName: 'Physics: Current Electricity & Ohm Law',
    topicNameHi: 'भौतिकी: धारा विद्युत एवं ओम का नियम',
    questionText: 'Three resistors of resistances 2 Ω, 3 Ω, and 6 Ω are connected in parallel. Their equivalent resistance is:',
    questionTextHi: '2 Ω, 3 Ω और 6 Ω के तीन प्रतिरोधक समानांतर क्रम में जुड़े हैं। उनका समतुल्य प्रतिरोध क्या होगा?',
    options: [
      { label: 'A', text: '1 Ω', textHi: '1 Ω' },
      { label: 'B', text: '11 Ω', textHi: '11 Ω' },
      { label: 'C', text: '0.5 Ω', textHi: '0.5 Ω' },
      { label: 'D', text: '3.6 Ω', textHi: '3.6 Ω' },
    ],
    correctOption: 'A',
    explanation: '1/R_eq = 1/2 + 1/3 + 1/6 = (3 + 2 + 1)/6 = 6/6 = 1 => R_eq = 1 Ω.',
    explanationHi: 'समानांतर क्रम में: 1/R_eq = 1/2 + 1/3 + 1/6 = 6/6 = 1 => R_eq = 1 Ω।'
  },
  {
    subjectName: 'Physics & Chemistry',
    topicName: 'Physics: Ray Optics & Snell Law',
    topicNameHi: 'भौतिकी: किरण प्रकाशिकी एवं स्नेल का नियम',
    questionText: 'The critical angle for total internal reflection from a medium of refractive index √2 into air is:',
    questionTextHi: 'अपवर्तनांक √2 वाले माध्यम से वायु में पूर्ण आंतरिक परावर्तन के लिए क्रांतिक कोण (Critical Angle) क्या होगा?',
    options: [
      { label: 'A', text: '30°', textHi: '30°' },
      { label: 'B', text: '45°', textHi: '45°' },
      { label: 'C', text: '60°', textHi: '60°' },
      { label: 'D', text: '90°', textHi: '90°' },
    ],
    correctOption: 'B',
    explanation: 'sin(C) = 1/μ = 1/√2 => C = 45°.',
    explanationHi: 'क्रांतिक कोण का सूत्र: sin(C) = 1/μ = 1/√2 => C = 45°।'
  },
  {
    subjectName: 'Physics & Chemistry',
    topicName: 'Chemistry: Chemical Bonding & Molecular Structure',
    topicNameHi: 'रसायन: रासायनिक आबंधन एवं आणविक संरचना',
    questionText: 'The geometry and hybridization of the central atom in a methane (CH₄) molecule is:',
    questionTextHi: 'मेथेन (CH₄) अणु में केंद्रीय परमाणु का संकरण (Hybridization) और ज्यामिति क्या होती है?',
    options: [
      { label: 'A', text: 'sp², Trigonal planar', textHi: 'sp², त्रिकोणीय समतलीय' },
      { label: 'B', text: 'sp³, Tetrahedral', textHi: 'sp³, चतुष्फलकीय (Tetrahedral)' },
      { label: 'C', text: 'sp³d, Trigonal bipyramidal', textHi: 'sp³d, त्रिकोणीय द्विपिरामिडी' },
      { label: 'D', text: 'sp, Linear', textHi: 'sp, रैखिक' },
    ],
    correctOption: 'B',
    explanation: 'In CH₄, carbon has 4 bonding pairs and 0 lone pairs. Hybridization is sp³ with tetrahedral geometry and bond angle of 109.5°.',
    explanationHi: 'मेथेन में कार्बन के 4 सिग्मा बंध होते हैं, जिससे संकरण sp³ और ज्यामिति चतुष्फलकीय (109.5°) होती है।'
  },
  {
    subjectName: 'Physics & Chemistry',
    topicName: 'Chemistry: Periodic Properties & Atomic Structure',
    topicNameHi: 'रसायन: आवर्ती गुणधर्म एवं परमाणु संरचना',
    questionText: 'Which of the following elements has the highest electronegativity on the Pauling scale?',
    questionTextHi: 'पॉलिंग पैमाने पर निम्नलिखित में से किस तत्व की विद्युत ऋणात्मकता (Electronegativity) सर्वाधिक है?',
    options: [
      { label: 'A', text: 'Oxygen (O)', textHi: 'ऑक्सीजन (O)' },
      { label: 'B', text: 'Chlorine (Cl)', textHi: 'क्लोरीन (Cl)' },
      { label: 'C', text: 'Fluorine (F)', textHi: 'फ्लोरीन (F)' },
      { label: 'D', text: 'Nitrogen (N)', textHi: 'नाइट्रोजन (N)' },
    ],
    correctOption: 'C',
    explanation: 'Fluorine is the most electronegative element with a Pauling value of 3.98 (approximately 4.0).',
    explanationHi: 'फ्लोरीन आवर्त सारणी में सर्वाधिक विद्युत ऋणात्मक तत्व (मान ~4.0) है।'
  },
  {
    subjectName: 'Physics & Chemistry',
    topicName: 'Chemistry: Organic Hydrocarbons',
    topicNameHi: 'रसायन: कार्बनिक यौगिक एवं हाइड्रोकार्बन',
    questionText: 'The IUPAC name of the compound CH₃-CH(CH₃)-CH₂-CHO is:',
    questionTextHi: 'यौगिक CH₃-CH(CH₃)-CH₂-CHO का IUPAC नाम क्या है?',
    options: [
      { label: 'A', text: '2-Methylbutanal', textHi: '2-मेथिलब्यूटेनैल' },
      { label: 'B', text: '3-Methylbutanal', textHi: '3-मेथिलब्यूटेनैल' },
      { label: 'C', text: 'Isovaleraldehyde', textHi: 'आइसोवैलेराल्डिहाइड' },
      { label: 'D', text: 'Pentanal', textHi: 'पेन्टेनैल' },
    ],
    correctOption: 'B',
    explanation: 'Numbering starts from the aldehyde carbon C-1: C1(HO)-C2(H₂)-C3(H, CH₃)-C4(H₃). It is 3-methylbutanal.',
    explanationHi: 'ऐल्डिहाइड समूह -CHO को कार्बन-1 माना जाता है, जिससे C-3 पर मेथिल समूह उपस्थित होने से नाम 3-मेथिलब्यूटेनैल बनता है।'
  },
];

// ==========================================
// HP TET TGT ARTS QUESTIONS (MOCK 1)
// ==========================================
const TGT_ARTS_QUESTIONS = [
  // --- Section 1: Child Development & Pedagogy (30 Questions) ---
  {
    subjectName: 'Child Development & Pedagogy',
    topicName: 'Theories of Intelligence',
    topicNameHi: 'बुद्धि के सिद्धांत',
    questionText: "Howard Gardner's Theory of Multiple Intelligences suggests that intelligence is:",
    questionTextHi: 'हावर्ड गार्डनर का बहु-बुद्धि सिद्धांत क्या प्रतिपादित करता है?',
    options: [
      { label: 'A', text: 'A single general factor (g-factor)', textHi: 'एक एकल सामान्य कारक (g-कारक)' },
      { label: 'B', text: 'A set of distinct modalities rather than a single general ability', textHi: 'विभिन्न स्वतंत्र योग्यताओं का समुच्चय, न कि कोई एकल क्षमता' },
      { label: 'C', text: 'Solely determined by genetic inheritance', textHi: 'पूरी तरह से केवल आनुवंशिकी द्वारा निर्धारित' },
      { label: 'D', text: 'Measurable only through traditional paper-pencil IQ tests', textHi: 'पारंपरिक कागज़-कलम आईक्यू परीक्षण से ही मापने योग्य' },
    ],
    correctOption: 'B',
    explanation: 'Howard Gardner proposed that humans possess multiple distinct intelligences (linguistic, logical-mathematical, spatial, musical, bodily-kinesthetic, interpersonal, intrapersonal, naturalistic).',
    explanationHi: 'गार्डनर के बहु-बुद्धि सिद्धांत के अनुसार मानव बुद्धि कई स्वतंत्र रूपों में विद्यमान होती है।'
  },
  {
    subjectName: 'Child Development & Pedagogy',
    topicName: 'Pedagogy of Social Sciences',
    topicNameHi: 'सामाजिक विज्ञान की शिक्षण विधियां',
    questionText: 'Which teaching strategy is most effective for developing critical thinking and historical empathy among students in Social Science?',
    questionTextHi: 'सामाजिक विज्ञान में विद्यार्थियों में आलोचनात्मक चिंतन एवं ऐतिहासिक सहानुभूति विकसित करने के लिए कौन सी शिक्षण रणनीति सर्वाधिक प्रभावी है?',
    options: [
      { label: 'A', text: 'Rote memorization of chronology and dates', textHi: 'कालक्रम व तिथियों को रटवाना' },
      { label: 'B', text: 'Source-based inquiry and primary source role play', textHi: 'स्रोत-आधारित अन्वेषण एवं प्राथमिक स्रोतों पर आधारित भूमिका निर्वहन (Role Play)' },
      { label: 'C', text: 'Passive textbook reading without discussion', textHi: 'बिना चर्चा के केवल पाठ्यपुस्तक पढ़ना' },
      { label: 'D', text: 'Dictating summaries for exam cramming', textHi: 'परीक्षा के लिए उत्तर लिखवाना' },
    ],
    correctOption: 'B',
    explanation: 'Using primary sources, debates, and role play fosters critical historical reasoning, contextual understanding, and empathy.',
    explanationHi: 'प्राथमिक ऐतिहासिक स्रोतों का विश्लेषण और परिचर्चा छात्रों में आलोचनात्मक सोच और सहानुभूति को बढ़ावा देती है।'
  },
  {
    subjectName: 'Child Development & Pedagogy',
    topicName: 'Language Acquisition & Pedagogy',
    topicNameHi: 'भाषा अर्जन एवं शिक्षण शास्त्र',
    questionText: 'Noam Chomsky proposed that children are born with an innate mechanism that enables them to acquire language, known as:',
    questionTextHi: 'नोआम चॉम्स्की के अनुसार बच्चे जन्मजात भाषा सीखने की क्षमता के साथ पैदा होते हैं, जिसे उन्होंने क्या नाम दिया?',
    options: [
      { label: 'A', text: 'Operant Conditioning Box', textHi: 'क्रिया प्रसूत अनुबंधन बॉक्स' },
      { label: 'B', text: 'Language Acquisition Device (LAD)', textHi: 'भाषा अर्जन युक्ति (LAD)' },
      { label: 'C', text: 'Zone of Proximal Development', textHi: 'निकटस्थ विकास क्षेत्र' },
      { label: 'D', text: 'Universal Schema Network', textHi: 'सार्वभौमिक स्कीमा नेटवर्क' },
    ],
    correctOption: 'B',
    explanation: 'Chomsky posited the Language Acquisition Device (LAD) and Universal Grammar as innate biological faculties.',
    explanationHi: 'चॉम्स्की ने प्रतिपादित किया कि बच्चों में भाषा अर्जन युक्ति (LAD) जन्मजात रूप से मौजूद होती है।'
  },
  // --- Section 2: General Awareness, Environment & HP GK (30 Questions) ---
  {
    subjectName: 'General Awareness & HP GK',
    topicName: 'Himachal Pradesh History & Administration',
    topicNameHi: 'हिमाचल का इतिहास एवं रियासती आंदोलन',
    questionText: 'Who led the famous Dhami Firing Tragedy (Dhami Satyagraha) agitation in Himachal Pradesh in 1939?',
    questionTextHi: '1939 में हिमाचल प्रदेश के प्रसिद्ध धामी गोलीकांड (धामी सत्याग्रह) का नेतृत्व किसने किया था?',
    options: [
      { label: 'A', text: 'Dr. Yashwant Singh Parmar', textHi: 'डॉ. यशवंत सिंह परमार' },
      { label: 'B', text: 'Pt. Padam Dev', textHi: 'पंडित पदम देव' },
      { label: 'C', text: 'Bhagmal Sautha', textHi: 'भागमल सौहटा' },
      { label: 'D', text: 'Baba Kanshi Ram', textHi: 'बाबा कांशी राम' },
    ],
    correctOption: 'C',
    explanation: 'Bhagmal Sautha led the delegation of Dhami Praja Mandal towards Dhami on 16 July 1939, where the Rana opened fire.',
    explanationHi: '16 जुलाई 1939 को धामी रियासत में प्रजा मंडल के आंदोलन का नेतृत्व भागमल सौहटा ने किया था।'
  },
  {
    subjectName: 'General Awareness & HP GK',
    topicName: 'Himachal Culture & Art',
    topicNameHi: 'हिमाचल की कला एवं संस्कृति',
    questionText: 'The world-famous Kangra miniature painting school flourished primarily under the patronization of which Katoch ruler?',
    questionTextHi: 'विश्व प्रसिद्ध कांगड़ा लघु चित्रकला शैली मुख्य रूप से किस कटोच शासक के संरक्षण में फली-फूली?',
    options: [
      { label: 'A', text: 'Raja Sansar Chand', textHi: 'राजा संसार चंद' },
      { label: 'B', text: 'Raja Hamir Chand', textHi: 'राजा हमीर चंद' },
      { label: 'C', text: 'Raja Ghamand Chand', textHi: 'राजा घमंड चंद' },
      { label: 'D', text: 'Raja Bhim Chand', textHi: 'राजा भीम चंद' },
    ],
    correctOption: 'A',
    explanation: 'Under Raja Sansar Chand (1775–1823), the Kangra style of Pahari painting reached its golden zenith of lyrical elegance.',
    explanationHi: 'राजा संसार चंद के शासनकाल में कांगड़ा कलम चित्रकला अपने चरमोत्कर्ष पर पहुँची थी।'
  },
  {
    subjectName: 'General Awareness & HP GK',
    topicName: 'Geography of Himachal Pradesh',
    topicNameHi: 'हिमाचल प्रदेश का भूगोल',
    questionText: 'Which pass connects Lahaul Valley with Chamba (Pangi) district in Himachal Pradesh?',
    questionTextHi: 'हिमाचल प्रदेश में लाहौल घाटी को चंबा के पांगी क्षेत्र से जोड़ने वाला प्रमुख दर्रा कौन सा है?',
    options: [
      { label: 'A', text: 'Rohtang Pass', textHi: 'रोहतांग दर्रा' },
      { label: 'B', text: 'Sach Pass', textHi: 'साच दर्रा' },
      { label: 'C', text: 'Baralacha La', textHi: 'बारालाचा दर्रा' },
      { label: 'D', text: 'Jalori Pass', textHi: 'जलोरी दर्रा' },
    ],
    correctOption: 'B',
    explanation: 'Sach Pass (altitude 4,414 m) connects the Pangi Valley of Chamba with the rest of Himachal Pradesh.',
    explanationHi: 'साच दर्रा (4,414 मीटर) चंबा के पांगी घाटी को जोड़ता है।'
  },
  // --- Section 3: English Literature & Grammar (30 Questions) ---
  {
    subjectName: 'English Literature & Grammar',
    topicName: 'English Grammar & Usage',
    topicNameHi: 'अंग्रेजी व्याकरण एवं प्रयोग',
    questionText: 'Choose the correct indirect speech form of the sentence: He said, "I have been working on this project since yesterday."',
    questionTextHi: 'दिए गए वाक्य का सही Indirect Speech रूप चुनिए: He said, "I have been working on this project since yesterday."',
    options: [
      { label: 'A', text: 'He said that he was working on that project since yesterday.', textHi: 'He said that he was working on that project since yesterday.' },
      { label: 'B', text: 'He said that he had been working on that project since the previous day.', textHi: 'He said that he had been working on that project since the previous day.' },
      { label: 'C', text: 'He said that he has been working on this project since yesterday.', textHi: 'He said that he has been working on this project since yesterday.' },
      { label: 'D', text: 'He says that he had worked on that project.', textHi: 'He says that he had worked on that project.' },
    ],
    correctOption: 'B',
    explanation: 'Present perfect continuous "have been working" changes to past perfect continuous "had been working", "this" changes to "that", and "yesterday" changes to "the previous day".',
    explanationHi: 'नियम अनुसार Present Perfect Continuous, Past Perfect Continuous में और "yesterday", "the previous day" में परिवर्तित होता है।'
  },
  {
    subjectName: 'English Literature & Grammar',
    topicName: 'Figures of Speech & Literary Devices',
    topicNameHi: 'अलंकार एवं साहित्यिक विधाएं',
    questionText: 'Identify the figure of speech in: "The camel is the ship of the desert."',
    questionTextHi: '"The camel is the ship of the desert" में कौन सा अलंकार (Figure of Speech) प्रयुक्त हुआ है?',
    options: [
      { label: 'A', text: 'Simile', textHi: 'उपमा (Simile)' },
      { label: 'B', text: 'Metaphor', textHi: 'रूपक (Metaphor)' },
      { label: 'C', text: 'Personification', textHi: 'मानवीकरण (Personification)' },
      { label: 'D', text: 'Hyperbole', textHi: 'अतिशयोक्ति (Hyperbole)' },
    ],
    correctOption: 'B',
    explanation: 'A metaphor directly identifies one thing with another without using "like" or "as". Here the camel is directly compared to a ship.',
    explanationHi: 'बिना "like" या "as" का प्रयोग किए प्रत्यक्ष समानता दर्शाने के कारण यह Metaphor (रूपक) है।'
  },
  {
    subjectName: 'English Literature & Grammar',
    topicName: 'English Literature Classics',
    topicNameHi: 'अंग्रेजी साहित्य के प्रमुख ग्रंथ',
    questionText: 'Which English Romantic poet wrote the famous lines: "Beauty is truth, truth beauty,—that is all / Ye know on earth, and all ye need to know"?',
    questionTextHi: '"Beauty is truth, truth beauty..." यह अमर पंक्ति किस प्रसिद्ध रोमांटिक कवि की कविता (Ode on a Grecian Urn) की है?',
    options: [
      { label: 'A', text: 'William Wordsworth', textHi: 'विलियम वर्ड्सवर्थ' },
      { label: 'B', text: 'John Keats', textHi: 'जॉन कीट्स' },
      { label: 'C', text: 'Percy Bysshe Shelley', textHi: 'पी. बी. शेली' },
      { label: 'D', text: 'Lord Byron', textHi: 'लॉर्ड बायरन' },
    ],
    correctOption: 'B',
    explanation: 'John Keats concludes his celebrated masterwork "Ode on a Grecian Urn" (1819) with these lines.',
    explanationHi: 'यह प्रसिद्ध पंक्ति जॉन कीट्स की कविता "Ode on a Grecian Urn" से है।'
  },
  // --- Section 4: Social Studies / Social Science (60 Questions) ---
  {
    subjectName: 'Social Studies / Social Science',
    topicName: 'Ancient Indian History',
    topicNameHi: 'प्राचीन भारतीय इतिहास',
    questionText: 'In which ancient rock edict did Emperor Ashoka express profound remorse for the slaughter and casualties of the Kalinga War?',
    questionTextHi: 'सम्राट अशोक ने किस शिलालेख में कलिंग युद्ध के रक्तपात और जनहानि पर गहरा शोक और पश्चाताप व्यक्त किया था?',
    options: [
      { label: 'A', text: 'Major Rock Edict I', textHi: 'प्रथम वृहद शिलालेख' },
      { label: 'B', text: 'Major Rock Edict XIII (13th)', textHi: '13वां वृहद शिलालेख (Major Rock Edict XIII)' },
      { label: 'C', text: 'Pillar Edict VII', textHi: 'सातवां स्तंभ लेख' },
      { label: 'D', text: 'Rummindei Minor Pillar Edict', textHi: 'रुम्मिनदेई लघु स्तंभ लेख' },
    ],
    correctOption: 'B',
    explanation: 'Major Rock Edict XIII explicitly describes Ashoka\'s conquest of Kalinga, his remorse, and his subsequent adoption of Dhamma-vijaya.',
    explanationHi: '13वें शिलालेख में कलिंग युद्ध का मार्मिक वर्णन और अशोक द्वारा धम्म विजय को अपनाने का उल्लेख है।'
  },
  {
    subjectName: 'Social Studies / Social Science',
    topicName: 'Modern Indian History & National Movement',
    topicNameHi: 'आधुनिक भारत का इतिहास एवं स्वतंत्रता आंदोलन',
    questionText: 'Who among the following presided over the historic Lahore Session of the Indian National Congress in 1929 where the "Purna Swaraj" resolution was passed?',
    questionTextHi: '1929 में भारतीय राष्ट्रीय कांग्रेस के ऐतिहासिक लाहौर अधिवेशन की अध्यक्षता किसने की थी, जिसमें "पूर्ण स्वराज" का प्रस्ताव पारित हुआ?',
    options: [
      { label: 'A', text: 'Mahatma Gandhi', textHi: 'महात्मा गांधी' },
      { label: 'B', text: 'Subhas Chandra Bose', textHi: 'सुभाष चंद्र बोस' },
      { label: 'C', text: 'Jawaharlal Nehru', textHi: 'जवाहरलाल नेहरू' },
      { label: 'D', text: 'Motilal Nehru', textHi: 'मोतीलाल नेहरू' },
    ],
    correctOption: 'C',
    explanation: 'Jawaharlal Nehru presided over the December 1929 Lahore Session where the goal of complete independence (Purna Swaraj) was declared.',
    explanationHi: 'दिसंबर 1929 के लाहौर अधिवेशन की अध्यक्षता पंडित जवाहरलाल नेहरू ने की थी।'
  },
  {
    subjectName: 'Social Studies / Social Science',
    topicName: 'Indian Polity & Governance',
    topicNameHi: 'भारतीय राजव्यवस्था एवं शासन',
    questionText: 'Which Constitutional Amendment Act added the 11th Fundamental Duty (providing education opportunities to child aged 6 to 14) under Article 51A(k)?',
    questionTextHi: 'किस संविधान संशोधन अधिनियम द्वारा 6 से 14 वर्ष के बच्चों को शिक्षा के अवसर उपलब्ध कराने हेतु 11वां मौलिक कर्तव्य (अनुच्छेद 51A-k) जोड़ा गया?',
    options: [
      { label: 'A', text: '42nd Constitutional Amendment Act, 1976', textHi: '42वां संशोधन अधिनियम, 1976' },
      { label: 'B', text: '44th Constitutional Amendment Act, 1978', textHi: '44वां संशोधन अधिनियम, 1978' },
      { label: 'C', text: '86th Constitutional Amendment Act, 2002', textHi: '86वां संशोधन अधिनियम, 2002' },
      { label: 'D', text: '91st Constitutional Amendment Act, 2003', textHi: '91वां संशोधन अधिनियम, 2003' },
    ],
    correctOption: 'C',
    explanation: 'The 86th Constitutional Amendment Act 2002 introduced Article 21A, modified Article 45, and inserted fundamental duty 51A(k).',
    explanationHi: '86वें संविधान संशोधन 2002 द्वारा 11वां मौलिक कर्तव्य और अनुच्छेद 21A (शिक्षा का अधिकार) जोड़ा गया था।'
  },
  {
    subjectName: 'Social Studies / Social Science',
    topicName: 'Physical & Indian Geography',
    topicNameHi: 'भौतिक एवं भारतीय भूगोल',
    questionText: 'The standard meridian of India (82°30\' E) passes through which of the following cities in Uttar Pradesh?',
    questionTextHi: 'भारत की मानक याम्योत्तर रेखा (82°30\' पूर्वी देशांतर) उत्तर प्रदेश के किस शहर के निकट से गुजरती है?',
    options: [
      { label: 'A', text: 'Mirzapur (near Prayagraj)', textHi: 'मिर्जापुर (प्रयागराज के निकट)' },
      { label: 'B', text: 'Varanasi', textHi: 'वाराणसी' },
      { label: 'C', text: 'Lucknow', textHi: 'लखनऊ' },
      { label: 'D', text: 'Gorakhpur', textHi: 'गोरखपुर' },
    ],
    correctOption: 'A',
    explanation: 'The Standard Meridian of India (82°30\' E) passes through Mirzapur, determining Indian Standard Time (IST), which is UTC+5:30.',
    explanationHi: 'भारतीय मानक समय (IST) 82°30\' पूर्वी देशांतर मिर्जापुर से निर्धारित होता है, जो ग्रीनविच समय से 5 घंटे 30 मिनट आगे है।'
  },
  {
    subjectName: 'Social Studies / Social Science',
    topicName: 'Indian Economy & Sustainable Development',
    topicNameHi: 'भारतीय अर्थव्यवस्था एवं सतत विकास',
    questionText: 'In which Five-Year Plan was the concept of "Inclusive Growth" (Faster and More Inclusive Growth) officially adopted as the central theme in India?',
    questionTextHi: 'भारत में "समावेशी विकास" (तीव्र एवं अधिक समावेशी विकास) की अवधारणा को किस पंचवर्षीय योजना का मुख्य विषय बनाया गया था?',
    options: [
      { label: 'A', text: '8th Five-Year Plan', textHi: 'आठवीं पंचवर्षीय योजना' },
      { label: 'B', text: '10th Five-Year Plan', textHi: 'दसवीं पंचवर्षीय योजना' },
      { label: 'C', text: '11th Five-Year Plan (2007–2012)', textHi: '11वीं पंचवर्षीय योजना (2007–2012)' },
      { label: 'D', text: '1st Five-Year Plan', textHi: 'प्रथम पंचवर्षीय योजना' },
    ],
    correctOption: 'C',
    explanation: 'The 11th Five-Year Plan (2007–2012) had the theme "Towards Faster and More Inclusive Growth".',
    explanationHi: '11वीं पंचवर्षीय योजना (2007-2012) का मुख्य शीर्षक "तीव्रतर और अधिक समावेशी विकास की ओर" था।'
  },
];

async function seedExamQuestions(mockId, questions, subjectMap) {
  let qNum = 1;
  for (const q of questions) {
    const subject = subjectMap[q.subjectName];
    if (!subject) {
      console.warn(`Subject '${q.subjectName}' not found in map!`);
      continue;
    }

    // Upsert topic
    const topic = await prisma.topic.upsert({
      where: {
        subjectId_name: {
          subjectId: subject.id,
          name: q.topicName,
        },
      },
      update: { nameHi: q.topicNameHi },
      create: {
        subjectId: subject.id,
        name: q.topicName,
        nameHi: q.topicNameHi,
      },
    });

    // Create question
    const question = await prisma.question.upsert({
      where: {
        mockTestId_questionNumber: {
          mockTestId: mockId,
          questionNumber: qNum,
        },
      },
      update: {
        subjectId: subject.id,
        topicId: topic.id,
        questionText: q.questionText,
        questionTextHi: q.questionTextHi,
        correctOption: q.correctOption,
        marks: 1.0,
        negativeMarks: 0.0,
        difficulty: 'MEDIUM',
        explanation: q.explanation,
        explanationHi: q.explanationHi,
      },
      create: {
        mockTestId: mockId,
        subjectId: subject.id,
        topicId: topic.id,
        questionNumber: qNum,
        questionText: q.questionText,
        questionTextHi: q.questionTextHi,
        correctOption: q.correctOption,
        marks: 1.0,
        negativeMarks: 0.0,
        difficulty: 'MEDIUM',
        explanation: q.explanation,
        explanationHi: q.explanationHi,
      },
    });

    // Create options
    for (const opt of q.options) {
      await prisma.questionOption.upsert({
        where: {
          questionId_optionLabel: {
            questionId: question.id,
            optionLabel: opt.label,
          },
        },
        update: {
          optionText: opt.text,
          optionTextHi: opt.textHi,
        },
        create: {
          questionId: question.id,
          optionLabel: opt.label,
          optionText: opt.text,
          optionTextHi: opt.textHi,
        },
      });
    }

    qNum++;
  }

  // Update Mock 1 question count
  await prisma.mockTest.update({
    where: { id: mockId },
    data: {
      totalQuestions: questions.length,
      totalMarks: questions.length * 1.0,
    },
  });

  console.log(`  ✓ Seeded ${questions.length} official bilingual questions into Mock 1 (${mockId})`);
}

async function main() {
  console.log('========================================================');
  console.log('HP TET TGT NON-MEDICAL & ARTS TEST SERIES SEEDER');
  console.log('========================================================\n');

  // 1. CLEAN DELETE EXISTING SERIES IF PRESENT
  await cleanDeleteExam('hp-tet-tgt-non-medical');
  await cleanDeleteExam('hp-tet-tgt-arts');

  // ==========================================
  // 2. CREATE HP TET TGT NON-MEDICAL 2026
  // ==========================================
  console.log('\n--- Creating HP TET TGT Non-Medical 2026 ---');
  const nonMedExam = await prisma.exam.create({
    data: {
      id: 'exam-hp-tet-tgt-non-medical',
      name: 'HP TET TGT Non-Medical 2026',
      nameHi: 'एचपी टीईटी टीजीटी नॉन-मेडिकल 2026',
      slug: 'hp-tet-tgt-non-medical',
      category: 'HP TET Exams',
      description:
        'Official HP TET pattern for Trained Graduate Teacher (Non-Medical). 150 bilingual MCQs covering Child Pedagogy, HP & National General Awareness, Mathematics, and Physics & Chemistry.',
      descriptionHi:
        'प्रशिक्षित स्नातक शिक्षक (नॉन-मेडिकल) हेतु आधिकारिक एचपी टीईटी परीक्षा पैटर्न। 150 द्विभाषी वस्तुनिष्ठ प्रश्न (बाल विकास, हिमाचल व राष्ट्रीय सामान्य ज्ञान, गणित एवं भौतिकी-रसायन)।',
      totalQuestions: 150,
      durationMinutes: 150,
      marksPerQuestion: 1.0,
      negativeMarking: 0.0,
      difficulty: 'MEDIUM',
      price: 1,
      isPopular: true,
      isArchived: false,
    },
  });
  console.log(`✓ Created Exam: ${nonMedExam.name} (${nonMedExam.id})`);

  // Create Subjects for Non-Medical
  const nonMedSubjectsData = [
    { name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', sortOrder: 0 },
    { name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान, समसामयिकी व हि.प्र. सामान्य ज्ञान', sortOrder: 1 },
    { name: 'Mathematics', nameHi: 'गणित (Maths)', sortOrder: 2 },
    { name: 'Physics & Chemistry', nameHi: 'भौतिकी एवं रसायन विज्ञान (Physics & Chemistry)', sortOrder: 3 },
  ];

  const nonMedSubjectMap = {};
  for (const s of nonMedSubjectsData) {
    const sub = await prisma.subject.create({
      data: {
        examId: nonMedExam.id,
        name: s.name,
        nameHi: s.nameHi,
        sortOrder: s.sortOrder,
      },
    });
    nonMedSubjectMap[s.name] = sub;
    console.log(`  ✓ Subject: ${sub.name} (${sub.nameHi})`);
  }

  // Create 10 Mocks for Non-Medical
  const nonMedMocks = await createMockTestsForExam(
    nonMedExam.id,
    'hp-tgt-non-med',
    'HP TET TGT Non-Medical',
    true
  );
  console.log(`✓ Created 10 full-length mock tests for HP TET TGT Non-Medical`);

  // Seed Mock 1 Questions
  await seedExamQuestions(nonMedMocks[0].id, TGT_NON_MED_QUESTIONS, nonMedSubjectMap);

  // ==========================================
  // 3. CREATE HP TET TGT ARTS 2026
  // ==========================================
  console.log('\n--- Creating HP TET TGT Arts 2026 ---');
  const artsExam = await prisma.exam.create({
    data: {
      id: 'exam-hp-tet-tgt-arts',
      name: 'HP TET TGT Arts 2026',
      nameHi: 'एचपी टीईटी टीजीटी आर्ट्स 2026',
      slug: 'hp-tet-tgt-arts',
      category: 'HP TET Exams',
      description:
        'Official HP TET pattern for Trained Graduate Teacher (Arts). 150 bilingual MCQs covering Child Pedagogy, HP & National General Awareness, English Literature, and Social Studies.',
      descriptionHi:
        'प्रशिक्षित स्नातक शिक्षक (आर्ट्स) हेतु आधिकारिक एचपी टीईटी परीक्षा पैटर्न। 150 द्विभाषी वस्तुनिष्ठ प्रश्न (बाल विकास, हिमाचल व राष्ट्रीय सामान्य ज्ञान, अंग्रेजी साहित्य एवं सामाजिक अध्ययन)।',
      totalQuestions: 150,
      durationMinutes: 150,
      marksPerQuestion: 1.0,
      negativeMarking: 0.0,
      difficulty: 'MEDIUM',
      price: 1,
      isPopular: true,
      isArchived: false,
    },
  });
  console.log(`✓ Created Exam: ${artsExam.name} (${artsExam.id})`);

  // Create Subjects for Arts
  const artsSubjectsData = [
    { name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', sortOrder: 0 },
    { name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान, समसामयिकी व हि.प्र. सामान्य ज्ञान', sortOrder: 1 },
    { name: 'English Literature & Grammar', nameHi: 'अंग्रेजी भाषा एवं साहित्य', sortOrder: 2 },
    { name: 'Social Studies / Social Science', nameHi: 'सामाजिक अध्ययन (History, Polity, Geo, Eco)', sortOrder: 3 },
  ];

  const artsSubjectMap = {};
  for (const s of artsSubjectsData) {
    const sub = await prisma.subject.create({
      data: {
        examId: artsExam.id,
        name: s.name,
        nameHi: s.nameHi,
        sortOrder: s.sortOrder,
      },
    });
    artsSubjectMap[s.name] = sub;
    console.log(`  ✓ Subject: ${sub.name} (${sub.nameHi})`);
  }

  // Create 10 Mocks for Arts
  const artsMocks = await createMockTestsForExam(
    artsExam.id,
    'hp-tgt-arts',
    'HP TET TGT Arts',
    false
  );
  console.log(`✓ Created 10 full-length mock tests for HP TET TGT Arts`);

  // Seed Mock 1 Questions
  await seedExamQuestions(artsMocks[0].id, TGT_ARTS_QUESTIONS, artsSubjectMap);

  console.log('\n========================================================');
  console.log('SUCCESS! Both HP TET TGT series created with official HPBOSE patterns.');
  console.log('========================================================\n');
}

main()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
