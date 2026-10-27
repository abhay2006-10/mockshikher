export interface MockOption {
  id: string;
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  textHi: string;
}

export interface MockQuestion {
  id: string;
  mockTestId: string;
  subjectId: string;
  subjectName: string;
  subjectNameHi: string;
  topicId: string;
  topicName: string;
  questionNumber: number;
  questionText: string;
  questionTextHi: string;
  questionImage?: string | null;
  options: MockOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  marks: number;
  negativeMarks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  explanation: string;
  explanationHi: string;
  solutionImage?: string | null;
}

export interface MockTest {
  id: string;
  examId: string;
  name: string;
  testNumber: number;
  isFree: boolean;
  isPublished: boolean;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  negativeMarksPerQuestion: number;
  marksPerQuestion: number;
}

export interface MockExam {
  id: string;
  name: string;
  slug: string;
  description: string;
  totalQuestions: number;
  durationMinutes: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  price: number;
  originalPrice: number;
  isPopular: boolean;
  category: string;
  totalMocks: number;
  freeMocks: number;
  subjects: {
    id: string;
    name: string;
    nameHi: string;
    questionCount: number;
  }[];
}

export const POPULAR_EXAMS: MockExam[] = [
  {
    id: 'exam-hp-patwari',
    name: 'HP Patwari Examination',
    slug: 'hp-patwari',
    description:
      'Targeted test series for HP Revenue Department Patwari recruitment with arithmetic, general knowledge, and language sections.',
    totalQuestions: 100,
    durationMinutes: 90,
    difficulty: 'MEDIUM',
    price: 1,
    originalPrice: 149,
    isPopular: true,
    category: 'State Revenue',
    totalMocks: 10,
    freeMocks: 1,
    subjects: [
      { id: 'sub-pt-hi', name: 'General Hindi', nameHi: 'सामान्य हिन्दी', questionCount: 25 },
      { id: 'sub-pt-en', name: 'General English', nameHi: 'सामान्य अंग्रेजी', questionCount: 25 },
      { id: 'sub-pt-ma', name: 'Mathematics', nameHi: 'गणित', questionCount: 25 },
      { id: 'sub-pt-gk', name: 'General Knowledge', nameHi: 'सामान्य ज्ञान', questionCount: 25 },
    ],
  },
  {
    id: 'exam-hp-police',
    name: 'HP Police Constable 2026',
    slug: 'hp-police-constable',
    description:
      'Complete mock test series designed strictly per the latest HP Police Constable recruitment pattern. Includes 10 full-length tests with bilingual questions.',
    totalQuestions: 90,
    durationMinutes: 60,
    difficulty: 'MEDIUM',
    price: 1,
    originalPrice: 149,
    isPopular: true,
    category: 'Police Exams',
    totalMocks: 10,
    freeMocks: 1,
    subjects: [
      { id: 'sub-en', name: 'English Language', nameHi: 'अंग्रेजी भाषा', questionCount: 16 },
      { id: 'sub-hi', name: 'Hindi Language', nameHi: 'हिन्दी भाषा', questionCount: 16 },
      { id: 'sub-ma', name: 'Mathematics', nameHi: 'गणित', questionCount: 16 },
      { id: 'sub-gk', name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान', questionCount: 24 },
      { id: 'sub-re', name: 'Reasoning Ability', nameHi: 'तर्कशक्ति क्षमता', questionCount: 18 },
    ],
  },
  {
    id: 'exam-hp-tet-tgt-medical',
    name: 'HP TET TGT Medical 2026',
    slug: 'hp-tet-tgt-medical',
    description:
      'Official HP TET pattern for Trained Graduate Teacher (Medical). 150 bilingual MCQs covering Child Pedagogy, HP & National General Awareness, Botany, Zoology, and Chemistry.',
    totalQuestions: 150,
    durationMinutes: 150,
    difficulty: 'MEDIUM',
    price: 1,
    originalPrice: 149,
    isPopular: true,
    category: 'HP TET Exams',
    totalMocks: 10,
    freeMocks: 1,
    subjects: [
      { id: 'sub-cdp', name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', questionCount: 30 },
      { id: 'sub-ga', name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान', questionCount: 30 },
      { id: 'sub-bio', name: 'Botany & Zoology (Biology)', nameHi: 'वनस्पति व प्राणी विज्ञान', questionCount: 60 },
      { id: 'sub-chem', name: 'Chemistry', nameHi: 'रसायन विज्ञान', questionCount: 30 },
    ],
  },
  {
    id: 'exam-hp-tet-tgt-non-medical',
    name: 'HP TET TGT Non-Medical 2026',
    slug: 'hp-tet-tgt-non-medical',
    description:
      'Official HP TET pattern for Trained Graduate Teacher (Non-Medical). 150 bilingual MCQs covering Child Pedagogy, HP & National General Awareness, Mathematics, and Physics & Chemistry.',
    totalQuestions: 150,
    durationMinutes: 150,
    difficulty: 'MEDIUM',
    price: 1,
    originalPrice: 149,
    isPopular: true,
    category: 'HP TET Exams',
    totalMocks: 10,
    freeMocks: 1,
    subjects: [
      { id: 'sub-cdp', name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', questionCount: 30 },
      { id: 'sub-ga', name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान', questionCount: 30 },
      { id: 'sub-math', name: 'Mathematics', nameHi: 'गणित', questionCount: 30 },
      { id: 'sub-phy-chem', name: 'Physics & Chemistry', nameHi: 'भौतिकी एवं रसायन विज्ञान', questionCount: 60 },
    ],
  },
  {
    id: 'exam-hp-tet-tgt-arts',
    name: 'HP TET TGT Arts 2026',
    slug: 'hp-tet-tgt-arts',
    description:
      'Official HP TET pattern for Trained Graduate Teacher (Arts). 150 bilingual MCQs covering Child Pedagogy, HP & National General Awareness, English Literature, and Social Studies.',
    totalQuestions: 150,
    durationMinutes: 150,
    difficulty: 'MEDIUM',
    price: 1,
    originalPrice: 149,
    isPopular: true,
    category: 'HP TET Exams',
    totalMocks: 10,
    freeMocks: 1,
    subjects: [
      { id: 'sub-cdp', name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', questionCount: 30 },
      { id: 'sub-ga', name: 'General Awareness & HP GK', nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान', questionCount: 30 },
      { id: 'sub-eng', name: 'English Literature & Grammar', nameHi: 'अंग्रेजी भाषा एवं साहित्य', questionCount: 30 },
      { id: 'sub-ss', name: 'Social Studies / Social Science', nameHi: 'सामाजिक अध्ययन', questionCount: 60 },
    ],
  },
  {
    id: 'exam-hp-tet-jbt',
    name: 'HP TET JBT / D.El.Ed 2026',
    slug: 'hp-tet-jbt',
    description:
      'Official HP TET pattern for Junior Basic Training (JBT / D.El.Ed). 150 bilingual MCQs covering Child Pedagogy, Hindi, English, Mathematics, and Environmental Studies & HP GK.',
    totalQuestions: 150,
    durationMinutes: 150,
    difficulty: 'MEDIUM',
    price: 1,
    originalPrice: 149,
    isPopular: false,
    category: 'HP TET Exams',
    totalMocks: 10,
    freeMocks: 1,
    subjects: [
      { id: 'sub-cdp', name: 'Child Development & Pedagogy', nameHi: 'बाल विकास एवं शिक्षण शास्त्र', questionCount: 30 },
      { id: 'sub-hi', name: 'Hindi Language', nameHi: 'हिन्दी भाषा', questionCount: 30 },
      { id: 'sub-en', name: 'English Language', nameHi: 'अंग्रेजी भाषा', questionCount: 30 },
      { id: 'sub-ma', name: 'Mathematics', nameHi: 'गणित', questionCount: 30 },
      { id: 'sub-evs', name: 'Environmental Studies & HP GK', nameHi: 'पर्यावरण अध्ययन व हिमाचल ज्ञान', questionCount: 30 },
    ],
  },
  {
    id: 'exam-hp-judiciary-clerk',
    name: 'HP Judiciary Clerk',
    slug: 'hp-judiciary-clerk',
    description:
      'Comprehensive test series for HP High Court & District Judiciary Clerk / Proof Reader recruitment examination.',
    totalQuestions: 100,
    durationMinutes: 120,
    difficulty: 'MEDIUM',
    price: 1,
    originalPrice: 149,
    isPopular: true,
    category: 'Court Exams',
    totalMocks: 5,
    freeMocks: 1,
    subjects: [
      { id: 'sub-jc-gk', name: 'General Knowledge & HP GK', nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान', questionCount: 60 },
      { id: 'sub-jc-it', name: 'Computers & IT', nameHi: 'कंप्यूटर एवं सूचना प्रौद्योगिकी', questionCount: 20 },
      { id: 'sub-jc-re', name: 'Reasoning Ability', nameHi: 'तर्कशक्ति (रीजनिंग)', questionCount: 20 },
    ],
  },
  {
    id: 'exam-hp-judiciary-process-server',
    name: 'HP Judiciary Process Server',
    slug: 'hp-judiciary-process-server',
    description:
      'Targeted test series for HP High Court & Subordinate Courts Process Server / Bailiff recruitment examination.',
    totalQuestions: 50,
    durationMinutes: 60,
    difficulty: 'MEDIUM',
    price: 1,
    originalPrice: 149,
    isPopular: true,
    category: 'Court Exams',
    totalMocks: 5,
    freeMocks: 1,
    subjects: [
      { id: 'sub-ps-gk', name: 'General Knowledge & HP GK', nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान', questionCount: 15 },
      { id: 'sub-ps-ma', name: 'Elementary Mathematics', nameHi: 'प्रारंभिक गणित', questionCount: 10 },
      { id: 'sub-ps-sc', name: 'General Science', nameHi: 'सामान्य विज्ञान', questionCount: 10 },
      { id: 'sub-ps-eh', name: 'General English & Hindi', nameHi: 'अंग्रेजी व हिंदी भाषा', questionCount: 10 },
      { id: 'sub-ps-re', name: 'Reasoning Ability', nameHi: 'तर्कशक्ति (रीजनिंग)', questionCount: 5 },
    ],
  },
  {
    id: 'exam-hp-forest',
    name: 'HP Forest Guard',
    slug: 'hp-forest-guard',
    description:
      'Practice series with focus on Environment, HP Geography, Forest laws, General Science and Elementary Mathematics.',
    totalQuestions: 85,
    durationMinutes: 75,
    difficulty: 'EASY',
    price: 1,
    originalPrice: 149,
    isPopular: false,
    category: 'Forestry',
    totalMocks: 8,
    freeMocks: 1,
    subjects: [
      { id: 'sub-fg-gk', name: 'General Knowledge & Environment', nameHi: 'सामान्य ज्ञान एवं पर्यावरण', questionCount: 30 },
      { id: 'sub-fg-sc', name: 'General Science', nameHi: 'सामान्य विज्ञान', questionCount: 25 },
      { id: 'sub-fg-ma', name: 'Mathematics & Reasoning', nameHi: 'गणित एवं रीजनिंग', questionCount: 30 },
    ],
  },
  {
    id: 'exam-hp-panchayat-secretary',
    name: 'HP Panchayat Secretary',
    slug: 'hp-panchayat-secretary',
    description:
      'Mock series for HP Panchayati Raj department recruitment covering GK, Hindi, English, and Mathematics.',
    totalQuestions: 85,
    durationMinutes: 90,
    difficulty: 'MEDIUM',
    price: 1,
    originalPrice: 149,
    isPopular: false,
    category: 'Panchayat',
    totalMocks: 8,
    freeMocks: 1,
    subjects: [
      { id: 'sub-ps-gk', name: 'General Knowledge & HP GK', nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान', questionCount: 25 },
      { id: 'sub-ps-hi', name: 'General Hindi', nameHi: 'सामान्य हिन्दी', questionCount: 20 },
      { id: 'sub-ps-en', name: 'General English', nameHi: 'सामान्य अंग्रेजी', questionCount: 20 },
      { id: 'sub-ps-ma', name: 'Mathematics', nameHi: 'गणित', questionCount: 20 },
    ],
  },
  {
    id: 'exam-hp-allied',
    name: 'HP Allied Services Examination',
    slug: 'hp-allied-services',
    description:
      'HPPSC Subordinate Allied Services Prelims test series with in-depth Himachal GK, Current Affairs, and Indian GS.',
    totalQuestions: 200,
    durationMinutes: 180,
    difficulty: 'HARD',
    price: 1,
    originalPrice: 149,
    isPopular: true,
    category: 'Administrative',
    totalMocks: 6,
    freeMocks: 1,
    subjects: [
      { id: 'sub-al-hpgk', name: 'HP GK & Culture', nameHi: 'हिमाचल सामान्य ज्ञान एवं संस्कृति', questionCount: 60 },
      { id: 'sub-al-ca', name: 'Current Events', nameHi: 'राष्ट्रीय व अंतरराष्ट्रीय समसामयिकी', questionCount: 60 },
      { id: 'sub-al-gs', name: 'Indian History, Polity & Economy', nameHi: 'भारतीय इतिहास, राजव्यवस्था व भूगोल', questionCount: 80 },
    ],
  },
  {
    id: 'exam-ssc-gd',
    name: 'SSC GD Constable',
    slug: 'ssc-gd-constable',
    description:
      'National level Central Armed Police Forces (CAPFs), SSF, Rifleman examination mock papers strictly following SSC pattern.',
    totalQuestions: 80,
    durationMinutes: 60,
    difficulty: 'HARD',
    price: 1,
    originalPrice: 149,
    isPopular: true,
    category: 'Central Defense',
    totalMocks: 15,
    freeMocks: 1,
    subjects: [
      { id: 'sub-gd-re', name: 'General Intelligence & Reasoning', nameHi: 'तर्कशक्ति', questionCount: 20 },
      { id: 'sub-gd-gk', name: 'General Knowledge & GA', nameHi: 'सामान्य ज्ञान', questionCount: 20 },
      { id: 'sub-gd-ma', name: 'Elementary Mathematics', nameHi: 'प्रारंभिक गणित', questionCount: 20 },
      { id: 'sub-gd-en', name: 'English / Hindi', nameHi: 'अंग्रेजी / हिन्दी', questionCount: 20 },
    ],
  },
];

export const HP_POLICE_MOCKS: MockTest[] = [
  {
    id: 'hp-police-mock-1',
    examId: 'exam-hp-police',
    name: 'HP Police Constable Full Mock 1 (All HP Open)',
    testNumber: 1,
    isFree: true,
    isPublished: true,
    totalQuestions: 90,
    durationMinutes: 60,
    totalMarks: 90,
    negativeMarksPerQuestion: 0.25,
    marksPerQuestion: 1.0,
  },
  {
    id: 'hp-police-mock-2',
    examId: 'exam-hp-police',
    name: 'HP Police Constable Full Mock 2 (High-Yield GS Special)',
    testNumber: 2,
    isFree: false,
    isPublished: true,
    totalQuestions: 90,
    durationMinutes: 60,
    totalMarks: 90,
    negativeMarksPerQuestion: 0.25,
    marksPerQuestion: 1.0,
  },
  {
    id: 'hp-police-mock-3',
    examId: 'exam-hp-police',
    name: 'HP Police Constable Full Mock 3 (Maths & Reasoning Focus)',
    testNumber: 3,
    isFree: false,
    isPublished: true,
    totalQuestions: 90,
    durationMinutes: 60,
    totalMarks: 90,
    negativeMarksPerQuestion: 0.25,
    marksPerQuestion: 1.0,
  },
  {
    id: 'hp-police-mock-4',
    examId: 'exam-hp-police',
    name: 'HP Police Constable Full Mock 4 (Simulation Standard)',
    testNumber: 4,
    isFree: false,
    isPublished: true,
    totalQuestions: 90,
    durationMinutes: 60,
    totalMarks: 90,
    negativeMarksPerQuestion: 0.25,
    marksPerQuestion: 1.0,
  },
  {
    id: 'hp-police-mock-5',
    examId: 'exam-hp-police',
    name: 'HP Police Constable Full Mock 5 (Exam Level)',
    testNumber: 5,
    isFree: false,
    isPublished: true,
    totalQuestions: 90,
    durationMinutes: 60,
    totalMarks: 90,
    negativeMarksPerQuestion: 0.25,
    marksPerQuestion: 1.0,
  },
];

// Subjects and Topics reference for HP Police Constable (used by admin APIs)
export const HP_POLICE_SUBJECTS = [
  {
    id: 'sub-en',
    name: 'English Language',
    nameHi: 'अंग्रेजी भाषा',
    questionCount: 16,
    topics: [
      { id: 'top-en-vocab', name: 'Vocabulary & Antonyms', nameHi: 'शब्द भंडार और विलोम' },
      { id: 'top-en-grammar', name: 'Grammar & Usage', nameHi: 'व्याकरण एवं प्रयोग' },
      { id: 'top-en-comp', name: 'Reading Comprehension', nameHi: 'पठन बोध' },
      { id: 'top-en-fill', name: 'Fill in the Blanks', nameHi: 'रिक्त स्थान भरें' },
    ],
  },
  {
    id: 'sub-hi',
    name: 'Hindi Language',
    nameHi: 'हिन्दी भाषा',
    questionCount: 16,
    topics: [
      { id: 'top-hi-pary', name: 'पर्यायवाची शब्द', nameHi: 'पर्यायवाची शब्द' },
      { id: 'top-hi-vilo', name: 'विलोम शब्द', nameHi: 'विलोम शब्द' },
      { id: 'top-hi-grm', name: 'व्याकरण', nameHi: 'व्याकरण' },
      { id: 'top-hi-muh', name: 'मुहावरे एवं लोकोक्तियाँ', nameHi: 'मुहावरे एवं लोकोक्तियाँ' },
    ],
  },
  {
    id: 'sub-gk',
    name: 'General Awareness & HP GK',
    nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    questionCount: 16,
    topics: [
      { id: 'top-gk-hpgeo', name: 'Geography of HP', nameHi: 'हिमाचल का भूगोल' },
      { id: 'top-gk-hphi', name: 'History of HP', nameHi: 'हिमाचल का इतिहास' },
      { id: 'top-gk-curr', name: 'Current Affairs', nameHi: 'समसामयिक घटनाएं' },
      { id: 'top-gk-indn', name: 'Indian Polity & Constitution', nameHi: 'भारतीय संविधान' },
    ],
  },
  {
    id: 'sub-ms',
    name: 'Maths & Science',
    nameHi: 'गणित एवं विज्ञान',
    questionCount: 20,
    topics: [
      { id: 'top-ms-arith', name: 'Arithmetic', nameHi: 'अंकगणित' },
      { id: 'top-ms-geo', name: 'Geometry', nameHi: 'ज्यामिति' },
      { id: 'top-ms-phy', name: 'Physics Basics', nameHi: 'भौतिकी की मूल बातें' },
      { id: 'top-ms-chem', name: 'Chemistry', nameHi: 'रसायन विज्ञान' },
    ],
  },
  {
    id: 'sub-re',
    name: 'Reasoning Aptitude',
    nameHi: 'तर्कशक्ति क्षमता',
    questionCount: 22,
    topics: [
      { id: 'top-re-series', name: 'Number Series', nameHi: 'संख्या श्रृंखला' },
      { id: 'top-re-analogy', name: 'Analogies', nameHi: 'सादृश्यता' },
      { id: 'top-re-coding', name: 'Coding-Decoding', nameHi: 'कोडिंग-डिकोडिंग' },
      { id: 'top-re-syllog', name: 'Syllogisms', nameHi: 'न्यायवाक्य' },
    ],
  },
];

// 25 High-Quality Bilingual Sample Questions for HP Police Constable Mock 1 (Full 90 structure demonstrated)
export const SAMPLE_QUESTIONS_MOCK_1: MockQuestion[] = [
  // --- Section 1: English Language ---
  {
    id: 'q-1',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-en',
    subjectName: 'English Language',
    subjectNameHi: 'अंग्रेजी भाषा',
    topicId: 'top-vocab',
    topicName: 'Synonyms & Antonyms',
    questionNumber: 1,
    questionText: 'Choose the most appropriate synonym for the word: "ADVERSITY"',
    questionTextHi: 'दिए गए शब्द का सही पर्यायवाची (Synonym) चुनें: "ADVERSITY"',
    options: [
      { id: 'q1-a', label: 'A', text: 'Prosperity', textHi: 'Prosperity (समृद्धि)' },
      { id: 'q1-b', label: 'B', text: 'Misfortune', textHi: 'Misfortune (दुर्भाग्य/विपत्ति)' },
      { id: 'q1-c', label: 'C', text: 'Opportunity', textHi: 'Opportunity (अवसर)' },
      { id: 'q1-d', label: 'D', text: 'Happiness', textHi: 'Happiness (प्रसन्नता)' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      '"Adversity" means a difficult or unpleasant situation, hardship, or misfortune. "Prosperity" is its antonym.',
    explanationHi:
      '"Adversity" का अर्थ कठिन समय या विपत्ति/दुर्भाग्य होता है। इसका सही पर्यायवाची "Misfortune" है।',
  },
  {
    id: 'q-2',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-en',
    subjectName: 'English Language',
    subjectNameHi: 'अंग्रेजी भाषा',
    topicId: 'top-grammar',
    topicName: 'Prepositions',
    questionNumber: 2,
    questionText: 'Fill in the blank with the correct preposition: "The candidate was disqualified ______ being underage."',
    questionTextHi: 'उचित Preposition से रिक्त स्थान भरें: "The candidate was disqualified ______ being underage."',
    options: [
      { id: 'q2-a', label: 'A', text: 'for', textHi: 'for' },
      { id: 'q2-b', label: 'B', text: 'from', textHi: 'from' },
      { id: 'q2-c', label: 'C', text: 'to', textHi: 'to' },
      { id: 'q2-d', label: 'D', text: 'by', textHi: 'by' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation:
      'We use "disqualified for" followed by a reason/gerund (for being underage) or "disqualified from" a competition/event.',
    explanationHi:
      'कारण दर्शाने के लिए "disqualified for" का प्रयोग किया जाता है।',
  },
  {
    id: 'q-3',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-en',
    subjectName: 'English Language',
    subjectNameHi: 'अंग्रेजी भाषा',
    topicId: 'top-idioms',
    topicName: 'Idioms & Phrases',
    questionNumber: 3,
    questionText: 'What is the meaning of the idiom: "To spill the beans"?',
    questionTextHi: 'मुहावरे का सही अर्थ बताएं: "To spill the beans"',
    options: [
      { id: 'q3-a', label: 'A', text: 'To drop vegetables', textHi: 'सब्जियां गिराना' },
      { id: 'q3-b', label: 'B', text: 'To reveal a secret unintentionally or prematurely', textHi: 'भेद या रहस्य प्रकट कर देना' },
      { id: 'q3-c', label: 'C', text: 'To ruin a cooking recipe', textHi: 'भोजन खराब करना' },
      { id: 'q3-d', label: 'D', text: 'To perform hard labor', textHi: 'कठिन परिश्रम करना' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      '"To spill the beans" means to divulge confidential information or secrets beforehand.',
    explanationHi:
      '"To spill the beans" का अर्थ गुप्त रहस्य उजागर कर देना होता है।',
  },
  {
    id: 'q-4',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-en',
    subjectName: 'English Language',
    subjectNameHi: 'अंग्रेजी भाषा',
    topicId: 'top-voice',
    topicName: 'Active and Passive Voice',
    questionNumber: 4,
    questionText: 'Change into passive voice: "The police caught the thief."',
    questionTextHi: 'वाच्य परिवर्तन (Passive Voice) करें: "The police caught the thief."',
    options: [
      { id: 'q4-a', label: 'A', text: 'The thief has been caught by the police.', textHi: 'The thief has been caught by the police.' },
      { id: 'q4-b', label: 'B', text: 'The thief was caught by the police.', textHi: 'The thief was caught by the police.' },
      { id: 'q4-c', label: 'C', text: 'The thief is caught by the police.', textHi: 'The thief is caught by the police.' },
      { id: 'q4-d', label: 'D', text: 'The thief had caught by the police.', textHi: 'The thief had caught by the police.' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation:
      'Simple Past tense (caught) changes to "was/were + V3" in passive voice. Hence, "was caught".',
    explanationHi:
      'साधारण भूतकाल (Simple Past) को Passive में बदलने पर "was/were + Verb 3rd form" का प्रयोग होता है।',
  },
  {
    id: 'q-5',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-en',
    subjectName: 'English Language',
    subjectNameHi: 'अंग्रेजी भाषा',
    topicId: 'top-spelling',
    topicName: 'Correct Spelling',
    questionNumber: 5,
    questionText: 'Identify the correctly spelled word:',
    questionTextHi: 'सही वर्तनी वाले शब्द की पहचान करें:',
    options: [
      { id: 'q5-a', label: 'A', text: 'Accomodation', textHi: 'Accomodation' },
      { id: 'q5-b', label: 'B', text: 'Accommodation', textHi: 'Accommodation' },
      { id: 'q5-c', label: 'C', text: 'Acommodation', textHi: 'Acommodation' },
      { id: 'q5-d', label: 'D', text: 'Acomodation', textHi: 'Acomodation' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation: 'The correct spelling is "Accommodation" with double "c" and double "m".',
    explanationHi: '"Accommodation" में दो ‘c’ और दो ‘m’ होते हैं।',
  },

  // --- Section 2: Hindi Language ---
  {
    id: 'q-6',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-hi',
    subjectName: 'Hindi Language',
    subjectNameHi: 'हिन्दी भाषा',
    topicId: 'top-sandhi',
    topicName: 'संधि एवं संधि विच्छेद',
    questionNumber: 6,
    questionText: '‘पवन’ शब्द का सही संधि-विच्छेद क्या होगा?',
    questionTextHi: '‘पवन’ शब्द का सही संधि-विच्छेद क्या होगा?',
    options: [
      { id: 'q6-a', label: 'A', text: 'पौ + अन', textHi: 'पौ + अन' },
      { id: 'q6-b', label: 'B', text: 'पो + अन', textHi: 'पो + अन' },
      { id: 'q6-c', label: 'C', text: 'पव + न', textHi: 'पव + न' },
      { id: 'q6-d', label: 'D', text: 'पा + वन', textHi: 'पा + वन' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'अयादि संधि के नियमानुसार ओ + अ = अव् + अ होता है, इसलिए पो + अन = पवन। जबकि पौ + अन = पावन होता है।',
    explanationHi: 'अयादि संधि के नियमानुसार ओ + अ = अव् + अ होता है, इसलिए पो + अन = पवन। जबकि पौ + अन = पावन होता है।',
  },
  {
    id: 'q-7',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-hi',
    subjectName: 'Hindi Language',
    subjectNameHi: 'हिन्दी भाषा',
    topicId: 'top-samas',
    topicName: 'समास',
    questionNumber: 7,
    questionText: '‘यथाशक्ति’ में कौन सा समास है?',
    questionTextHi: '‘यथाशक्ति’ में कौन सा समास है?',
    options: [
      { id: 'q7-a', label: 'A', text: 'तत्पुरुष समास', textHi: 'तत्पुरुष समास' },
      { id: 'q7-b', label: 'B', text: 'कर्मधारय समास', textHi: 'कर्मधारय समास' },
      { id: 'q7-c', label: 'C', text: 'अव्ययीभाव समास', textHi: 'अव्ययीभाव समास' },
      { id: 'q7-d', label: 'D', text: 'द्विगु समास', textHi: 'द्विगु समास' },
    ],
    correctOption: 'C',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'यथाशक्ति (शक्ति के अनुसार) में पूर्व पद ‘यथा’ अव्यय है, अतः यह अव्ययीभाव समास है।',
    explanationHi: 'यथाशक्ति (शक्ति के अनुसार) में पूर्व पद ‘यथा’ अव्यय है, अतः यह अव्ययीभाव समास है।',
  },
  {
    id: 'q-8',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-hi',
    subjectName: 'Hindi Language',
    subjectNameHi: 'हिन्दी भाषा',
    topicId: 'top-muhavare',
    topicName: 'मुहावरे एवं लोकोक्तियां',
    questionNumber: 8,
    questionText: '‘आंखों का तारा होना’ मुहावरे का सही अर्थ क्या है?',
    questionTextHi: '‘आंखों का तारा होना’ मुहावरे का सही अर्थ क्या है?',
    options: [
      { id: 'q8-a', label: 'A', text: 'अत्यधिक प्रिय होना', textHi: 'अत्यधिक प्रिय होना' },
      { id: 'q8-b', label: 'B', text: 'बहुत सुंदर होना', textHi: 'बहुत सुंदर होना' },
      { id: 'q8-c', label: 'C', text: 'आंख की रोशनी बढ़ना', textHi: 'आंख की रोशनी बढ़ना' },
      { id: 'q8-d', label: 'D', text: 'धोखा देना', textHi: 'धोखा देना' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: '‘आंखों का तारा’ का प्रचलित अर्थ बहुत प्रिय या दुलारा होना होता है।',
    explanationHi: '‘आंखों का तारा’ का प्रचलित अर्थ बहुत प्रिय या दुलारा होना होता है।',
  },
  {
    id: 'q-9',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-hi',
    subjectName: 'Hindi Language',
    subjectNameHi: 'हिन्दी भाषा',
    topicId: 'top-shuddh',
    topicName: 'वर्तनी शुद्धि',
    questionNumber: 9,
    questionText: 'निम्नलिखित में से शुद्ध वर्तनी वाला शब्द कौन सा है?',
    questionTextHi: 'निम्नलिखित में से शुद्ध वर्तनी वाला शब्द कौन सा है?',
    options: [
      { id: 'q9-a', label: 'A', text: 'कवयित्री', textHi: 'कवयित्री' },
      { id: 'q9-b', label: 'B', text: 'कविइत्री', textHi: 'कविइत्री' },
      { id: 'q9-c', label: 'C', text: 'कविईत्री', textHi: 'कविईत्री' },
      { id: 'q9-d', label: 'D', text: 'कवयत्री', textHi: 'कवयत्री' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation: 'कवि का स्त्रीलिंग रूप ‘कवयित्री’ शुद्ध वर्तनी है।',
    explanationHi: 'कवि का स्त्रीलिंग रूप ‘कवयित्री’ शुद्ध वर्तनी है।',
  },
  {
    id: 'q-10',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-hi',
    subjectName: 'Hindi Language',
    subjectNameHi: 'हिन्दी भाषा',
    topicId: 'top-vilom',
    topicName: 'विलोम शब्द',
    questionNumber: 10,
    questionText: '‘अनुराग’ का विलोम शब्द क्या है?',
    questionTextHi: '‘अनुराग’ का विलोम शब्द क्या है?',
    options: [
      { id: 'q10-a', label: 'A', text: 'विराग', textHi: 'विराग' },
      { id: 'q10-b', label: 'B', text: 'प्रेम', textHi: 'प्रेम' },
      { id: 'q10-c', label: 'C', text: 'द्वेष', textHi: 'द्वेष' },
      { id: 'q10-d', label: 'D', text: 'नफरत', textHi: 'नफरत' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'अनुराग का सटीक विलोम शब्द ‘विराग’ होता है।',
    explanationHi: 'अनुराग का सटीक विलोम शब्द ‘विराग’ होता है।',
  },

  // --- Section 3: General Awareness & Himachal GK ---
  {
    id: 'q-11',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-gk',
    subjectName: 'General Awareness & HP GK',
    subjectNameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    topicId: 'top-hpgk',
    topicName: 'Himachal Geography',
    questionNumber: 11,
    questionText: 'Which is the largest natural lake in Himachal Pradesh?',
    questionTextHi: 'हिमाचल प्रदेश की सबसे बड़ी प्राकृतिक झील कौन सी है?',
    options: [
      { id: 'q11-a', label: 'A', text: 'Gobind Sagar Lake', textHi: 'गोबिंद सागर झील' },
      { id: 'q11-b', label: 'B', text: 'Renuka Lake', textHi: 'रेणुका झील' },
      { id: 'q11-c', label: 'C', text: 'Rewalsar Lake', textHi: 'रिवालसर झील' },
      { id: 'q11-d', label: 'D', text: 'Khajjiar Lake', textHi: 'खज्जियार झील' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      'Renuka Lake in Sirmaur district is the largest natural lake of HP (approx 2.5 km circumference). Gobind Sagar is the largest man-made (artificial) lake.',
    explanationHi:
      'सिरमौर जिले में स्थित रेणुका झील हिमाचल प्रदेश की सबसे बड़ी प्राकृतिक झील है। गोबिंद सागर सबसे बड़ी कृत्रिम झील है।',
  },
  {
    id: 'q-12',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-gk',
    subjectName: 'General Awareness & HP GK',
    subjectNameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    topicId: 'top-hpgk',
    topicName: 'Himachal History',
    questionNumber: 12,
    questionText: 'Who was the first Chief Minister of Himachal Pradesh?',
    questionTextHi: 'हिमाचल प्रदेश के प्रथम मुख्यमंत्री कौन थे?',
    options: [
      { id: 'q12-a', label: 'A', text: 'Dr. Yashwant Singh Parmar', textHi: 'डॉ. यशवंत सिंह परमार' },
      { id: 'q12-b', label: 'B', text: 'Shanta Kumar', textHi: 'शांता कुमार' },
      { id: 'q12-c', label: 'C', text: 'Virbhadra Singh', textHi: 'वीरभद्र सिंह' },
      { id: 'q12-d', label: 'D', text: 'Thakur Ram Lal', textHi: 'ठाकुर राम लाल' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      'Dr. Y.S. Parmar took oath as the first Chief Minister of Himachal Pradesh on 24 March 1952. He is also known as the architect of Himachal Pradesh.',
    explanationHi:
      'डॉ. यशवंत सिंह परमार 24 मार्च 1952 को हिमाचल प्रदेश के पहले मुख्यमंत्री बने थे। उन्हें ‘हिमाचल निर्माता’ भी कहा जाता है।',
  },
  {
    id: 'q-13',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-gk',
    subjectName: 'General Awareness & HP GK',
    subjectNameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    topicId: 'top-polity',
    topicName: 'Indian Constitution',
    questionNumber: 13,
    questionText: 'Under which Article of the Indian Constitution is the Right to Equality guaranteed?',
    questionTextHi: 'भारतीय संविधान के किस अनुच्छेद के तहत समानता का अधिकार (Right to Equality) प्रदत्त है?',
    options: [
      { id: 'q13-a', label: 'A', text: 'Articles 14 to 18', textHi: 'अनुच्छेद 14 से 18' },
      { id: 'q13-b', label: 'B', text: 'Articles 19 to 22', textHi: 'अनुच्छेद 19 से 22' },
      { id: 'q13-c', label: 'C', text: 'Articles 23 to 24', textHi: 'अनुच्छेद 23 से 24' },
      { id: 'q13-d', label: 'D', text: 'Articles 25 to 28', textHi: 'अनुच्छेद 25 से 28' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation:
      'Articles 14-18 provide the Right to Equality. Articles 19-22 guarantee the Right to Freedom.',
    explanationHi:
      'अनुच्छेद 14 से 18 तक समानता का अधिकार दिया गया है। अनुच्छेद 19 से 22 स्वतंत्रता का अधिकार प्रदान करते हैं।',
  },
  {
    id: 'q-14',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-gk',
    subjectName: 'General Awareness & HP GK',
    subjectNameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    topicId: 'top-hpgk',
    topicName: 'Himachal Geography',
    questionNumber: 14,
    questionText: 'Rohtang Pass connects Kullu Valley with which valley?',
    questionTextHi: 'रोहतांग दर्रा कुल्लू घाटी को किस घाटी से जोड़ता है?',
    options: [
      { id: 'q14-a', label: 'A', text: 'Kangra Valley', textHi: 'कांगड़ा घाटी' },
      { id: 'q14-b', label: 'B', text: 'Lahaul and Spiti Valley', textHi: 'लाहौल एवं स्पीति घाटी' },
      { id: 'q14-c', label: 'C', text: 'Chamba Valley', textHi: 'चंबा घाटी' },
      { id: 'q14-d', label: 'D', text: 'Kinnaur Valley', textHi: 'किन्नौर घाटी' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      'Rohtang Pass (elevation 3,978 m) links Kullu Valley with Lahaul and Spiti Valleys in Himachal Pradesh.',
    explanationHi:
      'रोहतांग दर्रा (ऊंचाई 3,978 मीटर) कुल्लू घाटी को लाहौल एवं स्पीति घाटी से जोड़ता है।',
  },
  {
    id: 'q-15',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-gk',
    subjectName: 'General Awareness & HP GK',
    subjectNameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान',
    topicId: 'top-current',
    topicName: 'Current Affairs',
    questionNumber: 15,
    questionText: 'Who is the Commander-in-Chief of the Indian Armed Forces?',
    questionTextHi: 'भारतीय सशस्त्र सेनाओं का सर्वोच्च सेनापति (Commander-in-Chief) कौन होता है?',
    options: [
      { id: 'q15-a', label: 'A', text: 'The Prime Minister', textHi: 'प्रधानमंत्री' },
      { id: 'q15-b', label: 'B', text: 'The Chief of Defence Staff (CDS)', textHi: 'चीफ ऑफ डिफेंस स्टाफ (CDS)' },
      { id: 'q15-c', label: 'C', text: 'The President of India', textHi: 'भारत का राष्ट्रपति' },
      { id: 'q15-d', label: 'D', text: 'The Defence Minister', textHi: 'रक्षामंत्री' },
    ],
    correctOption: 'C',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      'According to Article 53(2) of the Constitution of India, the Supreme Command of the Defence Forces is vested in the President.',
    explanationHi:
      'भारतीय संविधान के अनुच्छेद 53(2) के अनुसार, तीनों सेनाओं का सर्वोच्च कमांडर भारत का राष्ट्रपति होता है।',
  },

  // --- Section 4: Mathematics & Science ---
  {
    id: 'q-16',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-ms',
    subjectName: 'Maths & Science',
    subjectNameHi: 'गणित एवं विज्ञान',
    topicId: 'top-math-arithmetic',
    topicName: 'Percentages & Profit',
    questionNumber: 16,
    questionText: 'A shopkeeper buys an article for ₹500 and sells it for ₹625. What is his percentage profit?',
    questionTextHi: 'एक दुकानदार किसी वस्तु को ₹500 में खरीदता है और ₹625 में बेचता है। उसका लाभ प्रतिशत क्या है?',
    options: [
      { id: 'q16-a', label: 'A', text: '20%', textHi: '20%' },
      { id: 'q16-b', label: 'B', text: '25%', textHi: '25%' },
      { id: 'q16-c', label: 'C', text: '30%', textHi: '30%' },
      { id: 'q16-d', label: 'D', text: '15%', textHi: '15%' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      'Profit = ₹625 - ₹500 = ₹125. Profit % = (125 / 500) × 100 = 25%.',
    explanationHi:
      'लाभ = 625 - 500 = ₹125. लाभ प्रतिशत = (125 / 500) × 100 = 25%।',
  },
  {
    id: 'q-17',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-ms',
    subjectName: 'Maths & Science',
    subjectNameHi: 'गणित एवं विज्ञान',
    topicId: 'top-math-time',
    topicName: 'Speed, Time and Distance',
    questionNumber: 17,
    questionText: 'A train 150 meters long is running at 54 km/h. How many seconds will it take to pass an electric pole?',
    questionTextHi: '150 मीटर लंबी एक रेलगाड़ी 54 किमी/घंटा की गति से चल रही है। वह एक बिजली के खंभे को पार करने में कितने सेकंड लेगी?',
    options: [
      { id: 'q17-a', label: 'A', text: '8 seconds', textHi: '8 सेकंड' },
      { id: 'q17-b', label: 'B', text: '10 seconds', textHi: '10 सेकंड' },
      { id: 'q17-c', label: 'C', text: '12 seconds', textHi: '12 सेकंड' },
      { id: 'q17-d', label: 'D', text: '15 seconds', textHi: '15 सेकंड' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation:
      'Speed in m/s = 54 × (5/18) = 15 m/s. Time to cross pole = Distance / Speed = 150 / 15 = 10 seconds.',
    explanationHi:
      'चाल (मीटर/सेकंड) = 54 × (5/18) = 15 मी/सेकंड। खंभे को पार करने में लगा समय = 150 / 15 = 10 सेकंड।',
  },
  {
    id: 'q-18',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-ms',
    subjectName: 'Maths & Science',
    subjectNameHi: 'गणित एवं विज्ञान',
    topicId: 'top-science-bio',
    topicName: 'Human Physiology',
    questionNumber: 18,
    questionText: 'Which component of human blood is responsible for carrying oxygen to cells?',
    questionTextHi: 'मानव रक्त का कौन सा घटक कोशिकाओं तक ऑक्सीजन पहुंचाने के लिए जिम्मेदार है?',
    options: [
      { id: 'q18-a', label: 'A', text: 'White Blood Cells (WBC)', textHi: 'श्वेत रक्त कणिकाएं (WBC)' },
      { id: 'q18-b', label: 'B', text: 'Hemoglobin in Red Blood Cells (RBC)', textHi: 'लाल रक्त कणिकाओं (RBC) में हीमोग्लोबिन' },
      { id: 'q18-c', label: 'C', text: 'Platelets', textHi: 'प्लेटलेट्स' },
      { id: 'q18-d', label: 'D', text: 'Blood Plasma', textHi: 'रक्त प्लाज्मा' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      'Hemoglobin, an iron-containing protein present in RBCs, binds with oxygen and transports it throughout the body.',
    explanationHi:
      'आरबीसी में मौजूद हीमोग्लोबिन ऑक्सीजन के साथ मिलकर ऑक्सीहीमोग्लोबिन बनाता है और शरीर में ऑक्सीजन का परिवहन करता है।',
  },
  {
    id: 'q-19',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-ms',
    subjectName: 'Maths & Science',
    subjectNameHi: 'गणित एवं विज्ञान',
    topicId: 'top-science-phy',
    topicName: 'Physics Units',
    questionNumber: 19,
    questionText: 'What is the SI unit of Electric Current?',
    questionTextHi: 'विद्युत धारा (Electric Current) का SI मात्रक क्या है?',
    options: [
      { id: 'q19-a', label: 'A', text: 'Volt', textHi: 'वोल्ट' },
      { id: 'q19-b', label: 'B', text: 'Watt', textHi: 'वाट' },
      { id: 'q19-c', label: 'C', text: 'Ampere', textHi: 'एम्पीयर' },
      { id: 'q19-d', label: 'D', text: 'Ohm', textHi: 'ओम' },
    ],
    correctOption: 'C',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation: 'The SI unit of electric current is Ampere (A). Volt is for potential difference, Ohm is for resistance.',
    explanationHi: 'विद्युत धारा का SI मात्रक एम्पीयर (Ampere) है। वोल्ट विभवांतर का तथा ओम प्रतिरोध का मात्रक है।',
  },
  {
    id: 'q-20',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-ms',
    subjectName: 'Maths & Science',
    subjectNameHi: 'गणित एवं विज्ञान',
    topicId: 'top-math-si',
    topicName: 'Simple Interest',
    questionNumber: 20,
    questionText: 'What will be the simple interest on a principal of ₹4,000 at 5% per annum for 3 years?',
    questionTextHi: '₹4,000 के मूलधन पर 5% वार्षिक दर से 3 वर्ष का साधारण ब्याज कितना होगा?',
    options: [
      { id: 'q20-a', label: 'A', text: '₹500', textHi: '₹500' },
      { id: 'q20-b', label: 'B', text: '₹600', textHi: '₹600' },
      { id: 'q20-c', label: 'C', text: '₹750', textHi: '₹750' },
      { id: 'q20-d', label: 'D', text: '₹800', textHi: '₹800' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      'SI = (P × R × T) / 100 = (4000 × 5 × 3) / 100 = 60,000 / 100 = ₹600.',
    explanationHi:
      'साधारण ब्याज = (मूलधन × दर × समय) / 100 = (4000 × 5 × 3) / 100 = ₹600।',
  },

  // --- Section 5: Reasoning Aptitude ---
  {
    id: 'q-21',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-re',
    subjectName: 'Reasoning Aptitude',
    subjectNameHi: 'तर्कशक्ति क्षमता',
    topicId: 'top-re-series',
    topicName: 'Number Series',
    questionNumber: 21,
    questionText: 'Find the missing number in the series: 3, 7, 15, 31, 63, ?',
    questionTextHi: 'श्रेणी में लुप्त संख्या ज्ञात कीजिए: 3, 7, 15, 31, 63, ?',
    options: [
      { id: 'q21-a', label: 'A', text: '127', textHi: '127' },
      { id: 'q21-b', label: 'B', text: '126', textHi: '126' },
      { id: 'q21-c', label: 'C', text: '128', textHi: '128' },
      { id: 'q21-d', label: 'D', text: '135', textHi: '135' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      'Pattern is (n × 2) + 1: 3×2+1=7; 7×2+1=15; 15×2+1=31; 31×2+1=63; 63×2+1 = 127.',
    explanationHi:
      'पैटर्न: (पिछली संख्या × 2) + 1. अतः 63 × 2 + 1 = 127.',
  },
  {
    id: 'q-22',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-re',
    subjectName: 'Reasoning Aptitude',
    subjectNameHi: 'तर्कशक्ति क्षमता',
    topicId: 'top-re-coding',
    topicName: 'Coding-Decoding',
    questionNumber: 22,
    questionText: 'If in a certain code, "POLICE" is written as "QPMJDF", how will "ARREST" be written in that code?',
    questionTextHi: 'यदि किसी सांकेतिक भाषा में "POLICE" को "QPMJDF" लिखा जाता है, तो "ARREST" को क्या लिखा जाएगा?',
    options: [
      { id: 'q22-a', label: 'A', text: 'BSSFTU', textHi: 'BSSFTU' },
      { id: 'q22-b', label: 'B', text: 'BRSDTU', textHi: 'BRSDTU' },
      { id: 'q22-c', label: 'C', text: 'BSSETU', textHi: 'BSSETU' },
      { id: 'q22-d', label: 'D', text: 'CSSTVU', textHi: 'CSSTVU' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation:
      'Each letter is shifted by +1: P+1=Q, O+1=P, L+1=M, I+1=J, C+1=D, E+1=F. For ARREST: A+1=B, R+1=S, R+1=S, E+1=F, S+1=T, T+1=U -> BSSFTU.',
    explanationHi:
      'प्रत्येक अक्षर में +1 जोड़ा गया है: A->B, R->S, R->S, E->F, S->T, T->U अर्थात् BSSFTU।',
  },
  {
    id: 'q-23',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-re',
    subjectName: 'Reasoning Aptitude',
    subjectNameHi: 'तर्कशक्ति क्षमता',
    topicId: 'top-re-blood',
    topicName: 'Blood Relations',
    questionNumber: 23,
    questionText: 'Pointing to a photograph, Rohit said, "She is the daughter of my grandfather\'s only son." How is Rohit related to the girl?',
    questionTextHi: 'एक तस्वीर की ओर इशारा करते हुए रोहित ने कहा, "वह मेरे दादाजी के इकलौते पुत्र की पुत्री है।" रोहित का उस लड़की से क्या संबंध है?',
    options: [
      { id: 'q23-a', label: 'A', text: 'Brother', textHi: 'भाई' },
      { id: 'q23-b', label: 'B', text: 'Cousin', textHi: 'चचेरा भाई' },
      { id: 'q23-c', label: 'C', text: 'Uncle', textHi: 'चाचा' },
      { id: 'q23-d', label: 'D', text: 'Father', textHi: 'पिता' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'MEDIUM',
    explanation:
      'Grandfather\'s only son = Rohit\'s father. Daughter of Rohit\'s father = Rohit\'s sister. Therefore, Rohit is her brother.',
    explanationHi:
      'दादाजी का इकलौता पुत्र = रोहित के पिता। रोहित के पिता की पुत्री = रोहित की बहन। अतः रोहित उसका भाई है।',
  },
  {
    id: 'q-24',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-re',
    subjectName: 'Reasoning Aptitude',
    subjectNameHi: 'तर्कशक्ति क्षमता',
    topicId: 'top-re-direction',
    topicName: 'Direction Sense',
    questionNumber: 24,
    questionText: 'A person walks 4 km towards North, then turns right and walks 3 km. How far is he from his starting point?',
    questionTextHi: 'एक व्यक्ति उत्तर दिशा में 4 किमी चलता है, फिर दाएं मुड़कर 3 किमी चलता है। वह अपने प्रारंभिक बिंदु से कितनी दूरी पर है?',
    options: [
      { id: 'q24-a', label: 'A', text: '7 km', textHi: '7 किमी' },
      { id: 'q24-b', label: 'B', text: '5 km', textHi: '5 किमी' },
      { id: 'q24-c', label: 'C', text: '6 km', textHi: '6 किमी' },
      { id: 'q24-d', label: 'D', text: '4 km', textHi: '4 किमी' },
    ],
    correctOption: 'B',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      'By Pythagoras Theorem: Distance = √(4² + 3²) = √(16 + 9) = √25 = 5 km.',
    explanationHi:
      'पाइथागोरस प्रमेय द्वारा: दूरी = √(4² + 3²) = √(16 + 9) = √25 = 5 किमी।',
  },
  {
    id: 'q-25',
    mockTestId: 'hp-police-mock-1',
    subjectId: 'sub-re',
    subjectName: 'Reasoning Aptitude',
    subjectNameHi: 'तर्कशक्ति क्षमता',
    topicId: 'top-re-odd',
    topicName: 'Odd One Out',
    questionNumber: 25,
    questionText: 'Select the odd word out of the following options:',
    questionTextHi: 'निम्नलिखित में से विषम (Odd) शब्द का चयन कीजिए:',
    options: [
      { id: 'q25-a', label: 'A', text: 'Shimla', textHi: 'शिमला' },
      { id: 'q25-b', label: 'B', text: 'Dharamshala', textHi: 'धर्मशाला' },
      { id: 'q25-c', label: 'C', text: 'Manali', textHi: 'मनाली' },
      { id: 'q25-d', label: 'D', text: 'Dehradun', textHi: 'देहरादून' },
    ],
    correctOption: 'D',
    marks: 1.0,
    negativeMarks: 0.25,
    difficulty: 'EASY',
    explanation:
      'Shimla, Dharamshala, and Manali are famous places in Himachal Pradesh. Dehradun is the capital of Uttarakhand.',
    explanationHi:
      'शिमला, धर्मशाला और मनाली हिमाचल प्रदेश के शहर हैं, जबकि देहरादून उत्तराखंड राज्य में स्थित है।',
  },
];
