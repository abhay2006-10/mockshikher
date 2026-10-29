/**
 * Official Exam Syllabus & Pattern Registry
 * Authoritative source of syllabus, subject sections, and marking criteria
 * for all Himachal Pradesh and allied competitive examinations.
 */

export interface ExamSectionPattern {
  id: string;
  name: string;
  nameHi: string;
  questionCount: number;
  marks: number;
  topics: {
    name: string;
    nameHi?: string;
    description?: string;
  }[];
}

export interface OfficialExamConfig {
  slug: string;
  name: string;
  nameHi?: string;
  category: string;
  conductingBody: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking: number;
  tags: string[]; // 4-5 short badges for exam cards
  description: string;
  sections: ExamSectionPattern[];
}

export const OFFICIAL_EXAMS_SYLLABUS: Record<string, OfficialExamConfig> = {
  // ==========================================
  // HP TET TGT MEDICAL
  // ==========================================
  'hp-tet-tgt-medical': {
    slug: 'hp-tet-tgt-medical',
    name: 'HP TET TGT Medical 2026',
    nameHi: 'एचपी टीईटी टीजीटी मेडिकल 2026',
    category: 'HP TET Exams',
    conductingBody: 'HPBOSE (HP Board of School Education, Dharamshala)',
    totalQuestions: 150,
    durationMinutes: 150,
    totalMarks: 150,
    marksPerQuestion: 1.0,
    negativeMarking: 0,
    tags: ['Child Pedagogy', 'General Awareness & HP GK', 'Biology (Botany & Zoology)', 'Chemistry'],
    description:
      'Official HP TET pattern for Trained Graduate Teacher (Medical). 150 bilingual MCQs covering Child Pedagogy, HP & National General Awareness, Botany, Zoology, and Chemistry.',
    sections: [
      {
        id: 'sec-cdp',
        name: 'Child Development & Pedagogy, Learning & Teaching',
        nameHi: 'बाल विकास एवं शिक्षण शास्त्र (अधिगम एवं शिक्षण प्रक्रियाएं)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Concept & Principles of Child Development', nameHi: 'बाल विकास की अवधारणा एवं सिद्धांत' },
          { name: 'Theories of Piaget, Kohlberg, Vygotsky & Erikson', nameHi: 'पियाजे, कोहलबर्ग, वाइगोत्स्की व एरिक्सन के सिद्धांत' },
          { name: 'Inclusive Education & Children with Special Needs (CWSN)', nameHi: 'समावेशी शिक्षा एवं विशेष आवश्यकता वाले बच्चे' },
          { name: 'Learning Theories, Motivation & Memory', nameHi: 'अधिगम सिद्धांत, अभिप्रेरणा एवं स्मृति' },
          { name: 'Assessment, Evaluation & CCE Techniques', nameHi: 'आकलन, मूल्यांकन एवं सतत समग्र मूल्यांकन (CCE)' },
        ],
      },
      {
        id: 'sec-ga-hpgk',
        name: 'General Awareness & Current Affairs (including HP GK & Environment)',
        nameHi: 'सामान्य ज्ञान, समसामयिकी (हि.प्र. सामान्य ज्ञान व पर्यावरण अध्ययन सहित)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Himachal Pradesh History, Culture, Fairs & Festivals', nameHi: 'हिमाचल का इतिहास, संस्कृति, मेले व त्यौहार' },
          { name: 'HP Geography, Rivers, Passes, Lakes & Glaciers', nameHi: 'हिमाचल का भूगोल, नदियाँ, दर्रे, झीलें व हिमनद' },
          { name: 'Indian Constitution, Polity & Governance', nameHi: 'भारतीय संविधान, राजव्यवस्था एवं शासन' },
          { name: 'Environmental Studies & Ecology', nameHi: 'पर्यावरण अध्ययन एवं पारिस्थितिकी' },
          { name: 'National & International Current Affairs', nameHi: 'राष्ट्रीय एवं अंतरराष्ट्रीय समसामयिक घटनाएं' },
        ],
      },
      {
        id: 'sec-bio',
        name: 'Botany & Zoology (Biology)',
        nameHi: 'वनस्पति विज्ञान एवं प्राणी विज्ञान (जीव विज्ञान)',
        questionCount: 60,
        marks: 60,
        topics: [
          { name: 'Cell Biology, Cell Cycle & Biomolecules', nameHi: 'कोशिका जैविकी, कोशिका चक्र एवं जैव अणु' },
          { name: 'Plant Physiology (Photosynthesis, Respiration, Plant Hormones)', nameHi: 'पादप कार्यिकी (प्रकाश संश्लेषण, श्वसन, पादप हार्मोन)' },
          { name: 'Animal Physiology (Circulation, Respiration, Excretion, Nervous System)', nameHi: 'मानव एवं प्राणी कार्यिकी (परिसंचरण, श्वसन, उत्सर्जन, तंत्रिका तंत्र)' },
          { name: 'Genetics, Molecular Basis of Inheritance & Evolution', nameHi: 'आनुवंशिकी, वंशागति का आणविक आधार एवं जैव विकास' },
          { name: 'Diversity in Living World & Taxonomy', nameHi: 'सजीव जगत में विविधता एवं वर्गिकी' },
          { name: 'Ecology, Ecosystems, Biodiversity & Conservation', nameHi: 'पारिस्थितिकी, पारितंत्र, जैव विविधता व संरक्षण' },
          { name: 'Biotechnology & Human Health and Diseases', nameHi: 'जैव प्रौद्योगिकी, मानव स्वास्थ्य एवं सामान्य रोग' },
        ],
      },
      {
        id: 'sec-chem',
        name: 'Chemistry',
        nameHi: 'रसायन विज्ञान (अकार्बनिक, कार्बनिक व भौतिक रसायन)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Atomic Structure & Periodic Classification', nameHi: 'परमाणु संरचना एवं तत्वों का आवर्ती वर्गीकरण' },
          { name: 'Chemical Bonding & Molecular Structure', nameHi: 'रासायनिक आबंधन एवं आणविक संरचना' },
          { name: 'States of Matter, Solutions & Colloids', nameHi: 'पदार्थ की अवस्थाएं, विलयन एवं कोलाइड' },
          { name: 'Thermodynamics, Chemical Kinetics & Equilibrium', nameHi: 'ऊष्मागतिकी, रासायनिक बलगतिकी एवं साम्यावस्था' },
          { name: 'Acids, Bases, Salts, pH & Redox Reactions', nameHi: 'अम्ल, क्षार, लवण, pH मान एवं रेडॉक्स अभिक्रियाएं' },
          { name: 'Basic Organic Chemistry & Hydrocarbons', nameHi: 'मूल कार्बनिक रसायन एवं हाइड्रोकार्बन' },
          { name: 'Coordination Compounds, Metals, Non-Metals & Everyday Chemistry', nameHi: 'उपसहसंयोजन यौगिक, धातु-अधातु व दैनिक जीवन में रसायन' },
        ],
      },
    ],
  },

  // ==========================================
  // HP TET TGT NON-MEDICAL
  // ==========================================
  'hp-tet-tgt-non-medical': {
    slug: 'hp-tet-tgt-non-medical',
    name: 'HP TET TGT Non-Medical 2026',
    nameHi: 'एचपी टीईटी टीजीटी नॉन-मेडिकल 2026',
    category: 'HP TET Exams',
    conductingBody: 'HPBOSE (HP Board of School Education, Dharamshala)',
    totalQuestions: 150,
    durationMinutes: 150,
    totalMarks: 150,
    marksPerQuestion: 1.0,
    negativeMarking: 0,
    tags: ['Child Pedagogy', 'General Awareness & HP GK', 'Mathematics', 'Physics & Chemistry'],
    description:
      'Official HP TET pattern for Trained Graduate Teacher (Non-Medical). 150 bilingual MCQs covering Child Pedagogy, HP & National General Awareness, Mathematics, and Physics & Chemistry.',
    sections: [
      {
        id: 'sec-cdp',
        name: 'Child Development & Pedagogy, Learning & Teaching',
        nameHi: 'बाल विकास एवं शिक्षण शास्त्र (अधिगम एवं शिक्षण प्रक्रियाएं)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Child Growth & Cognitive Development', nameHi: 'बाल विकास एवं संज्ञानात्मक विकास' },
          { name: 'Pedagogy of Mathematics & Physical Sciences', nameHi: 'गणित एवं भौतिक विज्ञान की शिक्षण विधियां' },
          { name: 'Inclusive Education & CWSN Accommodation', nameHi: 'समावेशी शिक्षा एवं विशेष आवश्यकताएं' },
          { name: 'Motivation, Learning Styles & Problem Solving', nameHi: 'अभिप्रेरणा, अधिगम शैलियां व समस्या समाधान' },
          { name: 'Formative & Summative Evaluation Techniques', nameHi: 'रचनात्मक एवं योगात्मक मूल्यांकन प्रणालियां' },
        ],
      },
      {
        id: 'sec-ga-hpgk',
        name: 'General Awareness & Current Affairs (including HP GK & Environment)',
        nameHi: 'सामान्य ज्ञान, समसामयिकी (हि.प्र. सामान्य ज्ञान व पर्यावरण अध्ययन सहित)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Himachal Pradesh History, Culture, Geography & Economy', nameHi: 'हिमाचल का इतिहास, संस्कृति, भूगोल व अर्थव्यवस्था' },
          { name: 'HP Government Schemes & Current Initiatives', nameHi: 'हिमाचल सरकार की प्रमुख योजनाएं एवं पहल' },
          { name: 'Indian Constitution, Democratic Polity & Geography', nameHi: 'भारतीय संविधान, लोकतांत्रिक राजव्यवस्था व भूगोल' },
          { name: 'Environmental Science & Ecological Issues', nameHi: 'पर्यावरण विज्ञान एवं पारिस्थितिक मुद्दे' },
          { name: 'National & Global Current Affairs', nameHi: 'राष्ट्रीय एवं वैश्विक समसामयिकी' },
        ],
      },
      {
        id: 'sec-math',
        name: 'Mathematics',
        nameHi: 'गणित (अंकगणित, बीजगणित, त्रिकोणमिति, ज्यामिति व कैलकुलस)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Number Systems, Real Numbers & Polynomials', nameHi: 'संख्या पद्धति, वास्तविक संख्याएं व बहुपद' },
          { name: 'Algebra, Quadratic Equations, Progressions (AP/GP)', nameHi: 'बीजगणित, द्विघात समीकरण, अंकगणितीय व गुणोत्तर श्रेढ़ी' },
          { name: 'Trigonometry, Identities & Heights & Distances', nameHi: 'त्रिकोणमिति, सर्वसमिकाएं, ऊंचाई एवं दूरी' },
          { name: 'Coordinate Geometry, Straight Lines & Conic Sections', nameHi: 'निर्देशांक ज्यामिति, सरल रेखाएं व शंकु परिच्छेद' },
          { name: 'Geometry, Circles, Triangles & Mensuration (2D/3D)', nameHi: 'ज्यामिति, वृत्त, त्रिभुज एवं क्षेत्रमिति (2D व 3D)' },
          { name: 'Statistics, Probability & Elementary Calculus', nameHi: 'सांख्यिकी, प्रायिकता एवं प्रारंभिक कैलकुलस' },
        ],
      },
      {
        id: 'sec-phy-chem',
        name: 'Physics & Chemistry',
        nameHi: 'भौतिक विज्ञान एवं रसायन विज्ञान (30 Q भौतिकी + 30 Q रसायन)',
        questionCount: 60,
        marks: 60,
        topics: [
          { name: 'Physics: Kinematics, Laws of Motion & Work-Energy', nameHi: 'भौतिकी: गतिकी, गति के नियम, कार्य एवं ऊर्जा' },
          { name: 'Physics: Gravitation, Fluid Mechanics & Thermodynamics', nameHi: 'भौतिकी: गुरुत्वाकर्षण, तरल यांत्रिकी व ऊष्मागतिकी' },
          { name: 'Physics: Electrostatics, Current Electricity & Magnetism', nameHi: 'भौतिकी: स्थिरवैद्युतिकी, धारा विद्युत व चुंबकत्व' },
          { name: 'Physics: Ray & Wave Optics, Modern Physics', nameHi: 'भौतिकी: किरण एवं तरंग प्रकाशिकी, आधुनिक भौतिकी' },
          { name: 'Chemistry: Atomic Structure, Bonding & Periodic Table', nameHi: 'रसायन: परमाणु संरचना, रासायनिक आबंधन व आवर्त सारणी' },
          { name: 'Chemistry: Thermodynamics, Chemical Equilibrium & Kinetics', nameHi: 'रसायन: ऊष्मागतिकी, रासायनिक साम्य व बलगतिकी' },
          { name: 'Chemistry: Acids, Bases, Salts, pH & Electrochemistry', nameHi: 'रसायन: अम्ल-क्षार-लवण, pH व विद्युत रसायन' },
          { name: 'Chemistry: Hydrocarbons, Functional Groups & Organic Compounds', nameHi: 'रसायन: हाइड्रोकार्बन, क्रियात्मक समूह व कार्बनिक यौगिक' },
        ],
      },
    ],
  },

  // ==========================================
  // HP TET TGT ARTS
  // ==========================================
  'hp-tet-tgt-arts': {
    slug: 'hp-tet-tgt-arts',
    name: 'HP TET TGT Arts 2026',
    nameHi: 'एचपी टीईटी टीजीटी आर्ट्स 2026',
    category: 'HP TET Exams',
    conductingBody: 'HPBOSE (HP Board of School Education, Dharamshala)',
    totalQuestions: 150,
    durationMinutes: 150,
    totalMarks: 150,
    marksPerQuestion: 1.0,
    negativeMarking: 0,
    tags: ['Child Pedagogy', 'General Awareness & HP GK', 'English Literature', 'Social Studies'],
    description:
      'Official HP TET pattern for Trained Graduate Teacher (Arts). 150 bilingual MCQs covering Child Pedagogy, HP & National General Awareness, English Literature & Grammar, and Social Studies.',
    sections: [
      {
        id: 'sec-cdp',
        name: 'Child Development & Pedagogy, Learning & Teaching',
        nameHi: 'बाल विकास एवं शिक्षण शास्त्र (अधिगम एवं शिक्षण प्रक्रियाएं)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Principles & Theories of Child Development', nameHi: 'बाल विकास के मूल सिद्धांत एवं दृष्टिकोण' },
          { name: 'Social Studies & Language Teaching Pedagogy', nameHi: 'सामाजिक अध्ययन एवं भाषा शिक्षण विधियां' },
          { name: 'Inclusive Education & Children with Diverse Needs', nameHi: 'समावेशी शिक्षा एवं विशिष्ट आवश्यकता वाले छात्र' },
          { name: 'Cognition, Emotion, Motivation & Creative Learning', nameHi: 'संज्ञान, संवेग, अभिप्रेरणा एवं सृजनात्मक अधिगम' },
          { name: 'Continuous and Comprehensive Evaluation (CCE)', nameHi: 'सतत एवं समग्र मूल्यांकन प्रणाली' },
        ],
      },
      {
        id: 'sec-ga-hpgk',
        name: 'General Awareness & Current Affairs (including HP GK & Environment)',
        nameHi: 'सामान्य ज्ञान, समसामयिकी (हि.प्र. सामान्य ज्ञान व पर्यावरण अध्ययन सहित)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Himachal Pradesh History, Princely States & Integration', nameHi: 'हिमाचल का इतिहास, रियासतें एवं राज्य गठन' },
          { name: 'HP Geography, Districts, Flora, Fauna & Demography', nameHi: 'हिमाचल का भूगोल, जिले, वनस्पति, जीव व जनसांख्यिकी' },
          { name: 'Himachali Art, Architecture, Temples & Cultural Heritage', nameHi: 'हिमाचली कला, स्थापत्य, प्रमुख मंदिर व सांस्कृतिक धरोहर' },
          { name: 'Indian Constitution, Governance & Fundamental Rights', nameHi: 'भारतीय संविधान, शासन व्यवस्था व मौलिक अधिकार' },
          { name: 'Current National & Global Affairs', nameHi: 'राष्ट्रीय एवं अंतरराष्ट्रीय समसामयिक घटनाक्रम' },
        ],
      },
      {
        id: 'sec-eng-lit',
        name: 'English Literature & Grammar',
        nameHi: 'अंग्रेजी भाषा एवं साहित्य (Grammar, Vocabulary & Literature)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'English Grammar (Tenses, Voice, Narration, Articles, Modals)', nameHi: 'अंग्रेजी व्याकरण (Tenses, Voice, Narration, Modals)' },
          { name: 'Parts of Speech, Prepositions & Conjunctions', nameHi: 'शब्द भेद, पूर्वसर्ग एवं संयोजक' },
          { name: 'Vocabulary, Synonyms, Antonyms, Idioms & Phrases', nameHi: 'शब्दावली, समानार्थी, विलोम, मुहावरे व लोकोक्तियाँ' },
          { name: 'Unseen Reading Comprehension Passages', nameHi: 'अपठित गद्यांश एवं पठन बोध' },
          { name: 'Literary Forms, Figures of Speech & British/Indian English Literature', nameHi: 'साहित्यिक विधाएं, अलंकार एवं प्रमुख साहित्यकार' },
        ],
      },
      {
        id: 'sec-social-studies',
        name: 'Social Studies / Social Science',
        nameHi: 'सामाजिक अध्ययन (इतिहास, भूगोल, नागरिक शास्त्र/राजनीति व अर्थशास्त्र)',
        questionCount: 60,
        marks: 60,
        topics: [
          { name: 'Ancient & Medieval Indian History (Indus, Vedic, Mauryan, Mughal)', nameHi: 'प्राचीन एवं मध्यकालीन भारतीय इतिहास' },
          { name: 'Modern Indian History & Freedom Struggle (1857–1947)', nameHi: 'आधुनिक भारतीय इतिहास एवं स्वतंत्रता आंदोलन (1857-1947)' },
          { name: 'World History (Renaissance, Revolutions, World Wars)', nameHi: 'विश्व इतिहास (पुनर्जागरण, प्रमुख क्रांतियां, विश्व युद्ध)' },
          { name: 'Physical, Indian & World Geography (Climate, Resources, Agriculture)', nameHi: 'भौतिक, भारतीय व विश्व भूगोल (जलवायु, संसाधन, कृषि)' },
          { name: 'Indian Polity, Parliament, Executive, Judiciary & Local Self-Govt', nameHi: 'भारतीय राजव्यवस्था, संसद, कार्यपालिका, न्यायपालिका व पंचायती राज' },
          { name: 'Indian Economy, Banking, Poverty, Employment & Sustainable Development', nameHi: 'भारतीय अर्थव्यवस्था, बैंकिंग, गरीबी, रोजगार व सतत विकास' },
        ],
      },
    ],
  },

  // ==========================================
  // HP TET JBT / D.EL.ED
  // ==========================================
  'hp-tet-jbt': {
    slug: 'hp-tet-jbt',
    name: 'HP TET JBT / D.El.Ed 2026',
    nameHi: 'एचपी टीईटी जेबीटी / डी.एल.एड 2026',
    category: 'HP TET Exams',
    conductingBody: 'HPBOSE (HP Board of School Education, Dharamshala)',
    totalQuestions: 150,
    durationMinutes: 150,
    totalMarks: 150,
    marksPerQuestion: 1.0,
    negativeMarking: 0,
    tags: ['Child Pedagogy', 'Hindi', 'English', 'Mathematics', 'EVS & HP GK'],
    description:
      'Official HP TET pattern for Junior Basic Training (JBT / D.El.Ed). 150 bilingual MCQs covering Child Pedagogy, Hindi, English, Mathematics, and Environmental Studies & HP GK.',
    sections: [
      {
        id: 'sec-cdp',
        name: 'Child Development & Learning',
        nameHi: 'बाल विकास एवं शिक्षण शास्त्र',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Primary Stage Child Development Principles', nameHi: 'प्राथमिक स्तर के बाल विकास के सिद्धांत' },
          { name: 'Inclusive Classroom & Addressing Diverse Learners', nameHi: 'समावेशी कक्षा एवं विविध अधिगमकर्ता' },
          { name: 'Theories of Learning, Motivation & Child Centered Pedagogy', nameHi: 'अधिगम सिद्धांत, अभिप्रेरणा एवं बाल-केंद्रित शिक्षा' },
        ],
      },
      {
        id: 'sec-hindi',
        name: 'Hindi Language',
        nameHi: 'हिन्दी भाषा (व्याकरण, बोध एवं शब्द सामर्थ्य)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'वर्ण विचार, शब्द विचार, संज्ञा, सर्वनाम, विशेषण, क्रिया', nameHi: 'हिन्दी व्याकरण मूल तत्व' },
          { name: 'संधि, समास, उपसर्ग, प्रत्यय, काल, कारक', nameHi: 'संधि, समास एवं कारक' },
          { name: 'विलोम, पर्यायवाची, अनेकार्थी, मुहावरे एवं लोकोक्तियाँ', nameHi: 'शब्दावली एवं लोकोक्तियाँ' },
          { name: 'अपठित गद्यांश एवं पद्यांश', nameHi: 'अपठित बोध' },
        ],
      },
      {
        id: 'sec-eng',
        name: 'English Language',
        nameHi: 'अंग्रेजी भाषा (Grammar & Comprehension)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Parts of Speech, Articles, Tenses, Modals', nameHi: 'Parts of Speech, Tenses & Articles' },
          { name: 'Vocabulary, Antonyms, Synonyms, Spelling Correction', nameHi: 'Vocabulary & Spelling' },
          { name: 'Sentence Structure, Error Detection, Prepositions', nameHi: 'Grammar Usage & Errors' },
          { name: 'Reading Comprehension Passages', nameHi: 'Comprehension' },
        ],
      },
      {
        id: 'sec-math',
        name: 'Mathematics',
        nameHi: 'गणित (प्राथमिक अंकगणित एवं ज्यामिति)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Number System, Fractions, Decimals, Factors & Multiples (HCF/LCM)', nameHi: 'संख्या पद्धति, भिन्न, दशमलव, ल.स. व म.स.' },
          { name: 'Percentage, Profit & Loss, Simple Interest, Ratio & Proportion', nameHi: 'प्रतिशतता, लाभ-हानि, साधारण ब्याज, अनुपात' },
          { name: 'Unitary Method, Time, Distance & Speed', nameHi: 'ऐकिक नियम, समय एवं दूरी' },
          { name: 'Basic Shapes, Geometry, Perimeter, Area & Volume', nameHi: 'ज्यामितीय आकृतियाँ, परिमाप, क्षेत्रफल व आयतन' },
        ],
      },
      {
        id: 'sec-evs-hpgk',
        name: 'Environmental Studies & HP GK',
        nameHi: 'पर्यावरण अध्ययन एवं हि.प्र. सामान्य ज्ञान',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Family, Society, Food, Shelter, Water, Plants & Animals', nameHi: 'परिवार, समाज, भोजन, आवास, जल, पौधे व जीव-जंतु' },
          { name: 'Environmental Pollution, Conservation, Ecosystems & Waste Management', nameHi: 'पर्यावरण प्रदूषण, संरक्षण, पारितंत्र व अपशिष्ट प्रबंधन' },
          { name: 'Himachal Pradesh Geography, Rivers, Culture, Fairs & Local Traditions', nameHi: 'हिमाचल का भूगोल, नदियाँ, संस्कृति, मेले व परंपराएं' },
          { name: 'Basic Indian General Knowledge & Current Events', nameHi: 'भारतीय सामान्य ज्ञान व समसामयिक घटनाएं' },
        ],
      },
    ],
  },

  // ==========================================
  // HP PATWARI EXAMINATION
  // ==========================================
  'hp-patwari': {
    slug: 'hp-patwari',
    name: 'HP Patwari Examination',
    nameHi: 'एचपी पटवारी परीक्षा',
    category: 'State Revenue',
    conductingBody: 'HP Revenue Department / HPPSC',
    totalQuestions: 100,
    durationMinutes: 90,
    totalMarks: 100,
    marksPerQuestion: 1.0,
    negativeMarking: 0,
    tags: ['General Hindi', 'General English', 'Mathematics', 'General Knowledge'],
    description:
      'Official syllabus for Himachal Pradesh Revenue Department Patwari recruitment. 100 questions of 10th standard standard covering Hindi (25), English (25), Arithmetic (25), and General Knowledge (25).',
    sections: [
      {
        id: 'sec-hindi',
        name: 'General Hindi',
        nameHi: 'सामान्य हिन्दी (10वीं कक्षा स्तर)',
        questionCount: 25,
        marks: 25,
        topics: [
          { name: 'वर्ण विचार, वर्तनी, शब्द रचना, संधि एवं समास', nameHi: 'संधि, समास एवं शब्द रचना' },
          { name: 'संज्ञा, सर्वनाम, विशेषण, क्रिया, काल, वाच्य, कारक', nameHi: 'व्याकरण के अंग' },
          { name: 'पर्यायवाची, विलोम, अनेकार्थी, वाक्यांश के लिए एक शब्द', nameHi: 'शब्दावली' },
          { name: 'मुहावरे, लोकोक्तियाँ एवं वाक्य शुद्धि', nameHi: 'मुहावरे व अशुद्धि शोधन' },
        ],
      },
      {
        id: 'sec-eng',
        name: 'General English',
        nameHi: 'सामान्य अंग्रेजी (10th Standard Grammar)',
        questionCount: 25,
        marks: 25,
        topics: [
          { name: 'English Grammar (Articles, Tenses, Prepositions, Conjunctions)', nameHi: 'Basic Grammar & Usage' },
          { name: 'Active and Passive Voice, Direct and Indirect Speech', nameHi: 'Voice & Narration' },
          { name: 'Vocabulary: Synonyms, Antonyms, Idioms & Phrases', nameHi: 'Vocabulary & Idioms' },
          { name: 'Error Spotting, Fill in the Blanks & Sentence Correction', nameHi: 'Sentence Correction' },
        ],
      },
      {
        id: 'sec-math',
        name: 'Mathematics (Arithmetic)',
        nameHi: 'प्रारंभिक गणित (अंकगणित - 10वीं स्तर)',
        questionCount: 25,
        marks: 25,
        topics: [
          { name: 'Number System, Simplification, Square Roots, HCF & LCM', nameHi: 'संख्या पद्धति, सरलीकरण व ल.स./म.स.' },
          { name: 'Percentage, Profit & Loss, Discount, Simple & Compound Interest', nameHi: 'प्रतिशत, लाभ-हानि, साधारण व चक्रवृद्धि ब्याज' },
          { name: 'Ratio & Proportion, Partnership, Averages & Mixtures', nameHi: 'अनुपात-समानुपात, साझेदारी व औसत' },
          { name: 'Time & Work, Pipes & Cisterns, Time, Speed & Distance', nameHi: 'समय और कार्य, नल-टंकी, समय और दूरी' },
          { name: 'Mensuration: Perimeter, Area, Volume & Surface Area (2D/3D)', nameHi: 'क्षेत्रमिति: परिमाप, क्षेत्रफल एवं आयतन' },
        ],
      },
      {
        id: 'sec-gk',
        name: 'General Knowledge & HP GK',
        nameHi: 'सामान्य ज्ञान एवं हिमाचल प्रदेश सामान्य ज्ञान',
        questionCount: 25,
        marks: 25,
        topics: [
          { name: 'Himachal Pradesh History, Geography, Culture, Rivers & Districts', nameHi: 'हिमाचल का इतिहास, भूगोल, नदियाँ, संस्कृति व जिले' },
          { name: 'Himachal Administrative Structure, Demography & Schemes', nameHi: 'हिमाचल प्रशासनिक ढांचा व जनसांख्यिकी' },
          { name: 'Indian History, Constitution, Polity & Geography', nameHi: 'भारतीय इतिहास, संविधान व भूगोल' },
          { name: 'General Science, Everyday Discoveries & National/State Current Affairs', nameHi: 'सामान्य विज्ञान एवं समसामयिक घटनाएं' },
        ],
      },
    ],
  },

  // ==========================================
  // HP POLICE CONSTABLE 2026
  // ==========================================
  'hp-police-constable': {
    slug: 'hp-police-constable',
    name: 'HP Police Constable 2026',
    nameHi: 'एचपी पुलिस कांस्टेबल 2026',
    category: 'Police Exams',
    conductingBody: 'HPPSC (Himachal Pradesh Public Service Commission)',
    totalQuestions: 90,
    durationMinutes: 60,
    totalMarks: 90,
    marksPerQuestion: 1.0,
    negativeMarking: 0.25,
    tags: ['English', 'Hindi', 'Mathematics', 'GK & HP GK', 'Reasoning'],
    description:
      'Strictly aligned with latest HPPSC HP Police Constable recruitment pattern. 90 bilingual questions in 60 minutes with 0.25 negative marking.',
    sections: [
      {
        id: 'sec-eng',
        name: 'English Language',
        nameHi: 'अंग्रेजी भाषा (English Language)',
        questionCount: 16,
        marks: 16,
        topics: [
          { name: 'Vocabulary, Antonyms, Synonyms, Spelling Errors', nameHi: 'Vocabulary & Antonyms' },
          { name: 'Grammar, Tenses, Prepositions, Voice, Modals', nameHi: 'Grammar & Usage' },
          { name: 'Fill in the blanks, Sentence Improvement, Idioms', nameHi: 'Idioms & Fillers' },
          { name: 'Reading Comprehension & Passage Questions', nameHi: 'Comprehension' },
        ],
      },
      {
        id: 'sec-hindi',
        name: 'Hindi Language',
        nameHi: 'हिन्दी भाषा (Hindi Language)',
        questionCount: 16,
        marks: 16,
        topics: [
          { name: 'पर्यायवाची शब्द, विलोम शब्द, अनेकार्थी शब्द', nameHi: 'पर्यायवाची एवं विलोम' },
          { name: 'संधि, समास, उपसर्ग, प्रत्यय, कारक, काल', nameHi: 'संधि, समास एवं व्याकरण' },
          { name: 'मुहावरे, लोकोक्तियाँ, शुद्ध-अशुद्ध वर्तनी', nameHi: 'मुहावरे एवं लोकोक्तियाँ' },
          { name: 'अपठित गद्यांश एवं वाक्य विन्यास', nameHi: 'गद्यांश एवं वाक्य शुद्धि' },
        ],
      },
      {
        id: 'sec-math',
        name: 'Mathematics',
        nameHi: 'गणित (Mathematics & Arithmetic)',
        questionCount: 16,
        marks: 16,
        topics: [
          { name: 'Number System, Simplification, HCF & LCM', nameHi: 'संख्या पद्धति एवं ल.स./म.स.' },
          { name: 'Percentage, Profit & Loss, Simple & Compound Interest', nameHi: 'प्रतिशत, लाभ-हानि व ब्याज' },
          { name: 'Ratio, Proportion, Average, Time & Work', nameHi: 'अनुपात, औसत, समय और कार्य' },
          { name: 'Time, Speed & Distance, Elementary Mensuration', nameHi: 'समय-दूरी व क्षेत्रमिति' },
        ],
      },
      {
        id: 'sec-gk',
        name: 'General Awareness & HP GK',
        nameHi: 'सामान्य ज्ञान व हिमाचल ज्ञान (General Awareness & HP GK)',
        questionCount: 24,
        marks: 24,
        topics: [
          { name: 'Himachal Pradesh History, Geography, Rivers, Culture & Personalities', nameHi: 'हिमाचल का इतिहास, भूगोल व संस्कृति' },
          { name: 'Indian Constitution, Polity, History & Geography', nameHi: 'भारतीय संविधान, इतिहास व भूगोल' },
          { name: 'General Science, Physics, Chemistry, Biology in Daily Life', nameHi: 'दैनिक जीवन में सामान्य विज्ञान' },
          { name: 'National, International & Himachal Current Affairs', nameHi: 'समसामयिक घटनाएं' },
        ],
      },
      {
        id: 'sec-reason',
        name: 'Reasoning Ability & Aptitude',
        nameHi: 'तर्कशक्ति क्षमता (Reasoning Ability)',
        questionCount: 18,
        marks: 18,
        topics: [
          { name: 'Analogy, Classification, Series (Number & Alphabet)', nameHi: 'सादृश्यता, वर्गीकरण व शृंखला' },
          { name: 'Coding-Decoding, Blood Relations, Direction Sense', nameHi: 'कोडिंग-डिकोडिंग, रक्त संबंध, दिशा ज्ञान' },
          { name: 'Ranking, Order, Syllogisms & Venn Diagrams', nameHi: 'क्रम परीक्षण, न्याय निगमन व वेन आरेख' },
          { name: 'Non-Verbal Reasoning, Pattern Completion, Dice & Clocks', nameHi: 'अभाषिक तर्कशक्ति एवं पैटर्न' },
        ],
      },
    ],
  },

  // ==========================================
  // HP JUDICIARY CLERK
  // ==========================================
  'hp-judiciary-clerk': {
    slug: 'hp-judiciary-clerk',
    name: 'HP Judiciary Clerk',
    nameHi: 'एचपी उच्च न्यायालय एवं जिला न्यायालय लिपिक',
    category: 'Court Exams',
    conductingBody: 'High Court of Himachal Pradesh, Shimla',
    totalQuestions: 100,
    durationMinutes: 120,
    totalMarks: 100,
    marksPerQuestion: 1.0,
    negativeMarking: 0.33,
    tags: ['HP & National GK (60 Q)', 'Computers & IT (20 Q)', 'Reasoning (20 Q)'],
    description:
      'Official syllabus for HP High Court & District Judiciary Clerk / Proof Reader. 100 questions in 120 minutes: 60 GK (30 HP GK + 30 National/International), 20 Computers & IT, and 20 Reasoning.',
    sections: [
      {
        id: 'sec-gk',
        name: 'General Knowledge & HP GK (30 HP GK + 30 National/International)',
        nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान (30 HP GK + 30 National GK)',
        questionCount: 60,
        marks: 60,
        topics: [
          { name: 'Himachal Pradesh History, Geography, Culture, Judiciary & Administrative Setup', nameHi: 'हिमाचल प्रदेश का इतिहास, भूगोल, संस्कृति व न्यायिक ढांचा' },
          { name: 'Indian Constitution, Legal System, Supreme Court & High Court Basics', nameHi: 'भारतीय संविधान, न्यायपालिका व कानूनी व्यवस्था' },
          { name: 'Indian History, National Freedom Struggle, Indian Economy & Geography', nameHi: 'भारतीय इतिहास, राष्ट्रीय आंदोलन, भूगोल व अर्थव्यवस्था' },
          { name: 'National & International Current Affairs, Awards & Legal Events', nameHi: 'समसामयिक घटनाक्रम एवं राष्ट्रीय महत्व के मुद्दे' },
        ],
      },
      {
        id: 'sec-comp',
        name: 'Basic Computers & IT',
        nameHi: 'कंप्यूटर एवं सूचना प्रौद्योगिकी (Computers & IT)',
        questionCount: 20,
        marks: 20,
        topics: [
          { name: 'Computer Fundamentals, Hardware, Memory & Operating Systems', nameHi: 'कंप्यूटर मूल बातें, हार्डवेयर, मेमोरी व ऑपरेटिंग सिस्टम' },
          { name: 'Microsoft Office (Word, Excel, PowerPoint) Shortcuts & Functions', nameHi: 'एमएस ऑफिस, शॉर्टकट कुंजियां एवं कार्यप्रणाली' },
          { name: 'Internet, E-mail, Networking Protocols, Web Browsers & Cyber Security', nameHi: 'इंटरनेट, नेटवर्किंग, ई-मेल व साइबर सुरक्षा' },
          { name: 'File Systems, Storage Devices & Input/Output Peripherals', nameHi: 'फाइल सिस्टम एवं इनपुट/आउटपुट युक्तियाँ' },
        ],
      },
      {
        id: 'sec-reason',
        name: 'Reasoning Ability',
        nameHi: 'तर्कशक्ति क्षमता (Reasoning Ability)',
        questionCount: 20,
        marks: 20,
        topics: [
          { name: 'Logical Reasoning, Verbal & Non-Verbal Deductions', nameHi: 'तार्किक क्षमता एवं युक्ति-युक्त निष्कर्ष' },
          { name: 'Analogy, Classification, Series Completion & Coding-Decoding', nameHi: 'सादृश्यता, शृंखला व कोडिंग-डिकोडिंग' },
          { name: 'Blood Relations, Direction Sense & Order/Ranking', nameHi: 'रक्त संबंध, दिशा ज्ञान व क्रम व्यवस्था' },
          { name: 'Seating Arrangements, Syllogisms & Venn Diagrams', nameHi: 'बैठक व्यवस्था, न्याय निगमन व वेन आरेख' },
        ],
      },
    ],
  },

  // ==========================================
  // HP JUDICIARY PROCESS SERVER
  // ==========================================
  'hp-judiciary-process-server': {
    slug: 'hp-judiciary-process-server',
    name: 'HP Judiciary Process Server',
    nameHi: 'एचपी उच्च न्यायालय एवं अधीनस्थ न्यायालय प्रोसेस सर्वर',
    category: 'Court Exams',
    conductingBody: 'High Court of Himachal Pradesh, Shimla',
    totalQuestions: 50,
    durationMinutes: 60,
    totalMarks: 50,
    marksPerQuestion: 1.0,
    negativeMarking: 0,
    tags: ['HP & National GK', 'Elementary Math', 'General Science', 'English & Hindi', 'Reasoning'],
    description:
      'Official examination pattern for HP High Court & Subordinate Courts Process Server / Bailiff recruitment. 50 bilingual questions in 60 minutes.',
    sections: [
      {
        id: 'sec-gk',
        name: 'General Knowledge & HP GK',
        nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान',
        questionCount: 15,
        marks: 15,
        topics: [
          { name: 'Himachal Pradesh History, Geography, Districts & Culture', nameHi: 'हिमाचल का इतिहास, भूगोल व संस्कृति' },
          { name: 'Basic Indian History, Constitution & Current Events', nameHi: 'भारतीय इतिहास, संविधान व समसामयिक घटनाएं' },
        ],
      },
      {
        id: 'sec-math',
        name: 'Elementary Mathematics',
        nameHi: 'प्रारंभिक गणित (Elementary Mathematics)',
        questionCount: 10,
        marks: 10,
        topics: [
          { name: 'Simple Arithmetic, Addition, Subtraction, Fractions, Percentages & Averages', nameHi: 'अंकगणित, भिन्न, प्रतिशत व औसत' },
        ],
      },
      {
        id: 'sec-sci',
        name: 'General Science',
        nameHi: 'सामान्य विज्ञान (Everyday Science)',
        questionCount: 10,
        marks: 10,
        topics: [
          { name: 'Everyday Science, Human Body, Health, Nutrition & Environmental Basics', nameHi: 'दैनिक विज्ञान, मानव शरीर, स्वास्थ्य व पर्यावरण' },
        ],
      },
      {
        id: 'sec-lang',
        name: 'General English & Hindi',
        nameHi: 'अंग्रेजी व हिंदी भाषा (Language Skills)',
        questionCount: 10,
        marks: 10,
        topics: [
          { name: 'Basic English Grammar, Vocabulary, Correct Spelling & Simple Translations', nameHi: 'अंग्रेजी व्याकरण एवं शब्दावली' },
          { name: 'सामान्य हिन्दी व्याकरण, पर्यायवाची, विलोम शब्द, मुहावरे व शुद्ध वर्तनी', nameHi: 'हिन्दी व्याकरण एवं मुहावरे' },
        ],
      },
      {
        id: 'sec-reason',
        name: 'Reasoning Ability',
        nameHi: 'तर्कशक्ति क्षमता (Reasoning Ability)',
        questionCount: 5,
        marks: 5,
        topics: [
          { name: 'Basic Analogies, Series, Direction Sense & Odd One Out', nameHi: 'सामान्य तर्कशक्ति एवं शृंखला परीक्षण' },
        ],
      },
    ],
  },

  // ==========================================
  // HP FOREST GUARD
  // ==========================================
  'hp-forest-guard': {
    slug: 'hp-forest-guard',
    name: 'HP Forest Guard',
    nameHi: 'एचपी वन रक्षक परीक्षा',
    category: 'Forestry',
    conductingBody: 'HP Forest Department',
    totalQuestions: 85,
    durationMinutes: 75,
    totalMarks: 85,
    marksPerQuestion: 1.0,
    negativeMarking: 0,
    tags: ['General Knowledge & Environment', 'General Science', 'Mathematics & Reasoning'],
    description:
      'Official syllabus for Himachal Pradesh Forest Guard recruitment. 85 questions in 75 minutes covering GK & Environment (30), Science (25), and Mathematics & Reasoning (30).',
    sections: [
      {
        id: 'sec-gk-env',
        name: 'General Knowledge & Environment',
        nameHi: 'सामान्य ज्ञान एवं पर्यावरण अध्ययन (Environment & HP Forests)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Himachal Pradesh Geography, National Parks, Wildlife Sanctuaries & Forests', nameHi: 'हिमाचल का भूगोल, राष्ट्रीय उद्यान, वन्यजीव अभयारण्य व वन' },
          { name: 'Forest Laws, Wildlife Protection Act, Biodiversity & Eco-tourism', nameHi: 'वन कानून, वन्यजीव संरक्षण अधिनियम व जैव विविधता' },
          { name: 'Indian Geography, Environmental Pollution, Climate Change & Afforestation', nameHi: 'पर्यावरण प्रदूषण, जलवायु परिवर्तन व वनीकरण' },
          { name: 'National & HP Current Affairs', nameHi: 'राष्ट्रीय एवं हिमाचल समसामयिकी' },
        ],
      },
      {
        id: 'sec-sci',
        name: 'General Science',
        nameHi: 'सामान्य विज्ञान (General Science)',
        questionCount: 25,
        marks: 25,
        topics: [
          { name: 'Physics: Motion, Light, Sound, Energy & Electricity', nameHi: 'भौतिकी: गति, प्रकाश, ध्वनि, ऊर्जा व विद्युत' },
          { name: 'Chemistry: Matter, Elements, Compounds, Metals, Non-Metals & Water', nameHi: 'रसायन: पदार्थ, धातु, अधातु व जल' },
          { name: 'Biology: Plants, Trees, Animals, Human Biology, Diseases & Ecology', nameHi: 'जीव विज्ञान: पादप, वृक्ष, जंतु, पारिस्थितिकी व रोग' },
        ],
      },
      {
        id: 'sec-math-reason',
        name: 'Mathematics & Reasoning Ability',
        nameHi: 'गणित एवं तर्कशक्ति (Mathematics & Reasoning)',
        questionCount: 30,
        marks: 30,
        topics: [
          { name: 'Arithmetic: Number System, Percentage, Profit & Loss, Ratio, Time & Distance', nameHi: 'अंकगणित: संख्या पद्धति, प्रतिशत, लाभ-हानि, समय-दूरी' },
          { name: 'Mensuration: Areas, Perimeters & Volumes', nameHi: 'क्षेत्रमिति: क्षेत्रफल व आयतन' },
          { name: 'Reasoning: Series, Coding-Decoding, Analogies, Blood Relations & Directions', nameHi: 'तर्कशक्ति: शृंखला, कोडिंग-डिकोडिंग, रक्त संबंध व दिशाएं' },
        ],
      },
    ],
  },

  // ==========================================
  // HP PANCHAYAT SECRETARY
  // ==========================================
  'hp-panchayat-secretary': {
    slug: 'hp-panchayat-secretary',
    name: 'HP Panchayat Secretary',
    nameHi: 'एचपी पंचायत सचिव परीक्षा',
    category: 'Panchayat',
    conductingBody: 'HP Panchayati Raj Department / HPU',
    totalQuestions: 85,
    durationMinutes: 90,
    totalMarks: 85,
    marksPerQuestion: 1.0,
    negativeMarking: 0,
    tags: ['GK & HP GK', 'General Hindi', 'General English', 'Mathematics'],
    description:
      'Official syllabus for Himachal Pradesh Panchayati Raj Department Panchayat Secretary recruitment covering GK, Hindi, English, and Mathematics.',
    sections: [
      {
        id: 'sec-gk',
        name: 'General Knowledge & HP GK',
        nameHi: 'सामान्य ज्ञान व हिमाचल सामान्य ज्ञान (Panchayati Raj Setup)',
        questionCount: 25,
        marks: 25,
        topics: [
          { name: 'Panchayati Raj 73rd Constitutional Amendment & HP Panchayati Raj Act 1994', nameHi: 'पंचायती राज 73वां संविधान संशोधन व हि.प्र. पंचायती राज अधिनियम' },
          { name: 'Himachal Pradesh History, Culture, Geography, Rivers & Administration', nameHi: 'हिमाचल का इतिहास, संस्कृति, भूगोल व प्रशासन' },
          { name: 'Indian Constitution, Rural Development Schemes & Current Events', nameHi: 'भारतीय संविधान, ग्रामीण विकास योजनाएं व समसामयिकी' },
        ],
      },
      {
        id: 'sec-hindi',
        name: 'General Hindi',
        nameHi: 'सामान्य हिन्दी (General Hindi)',
        questionCount: 20,
        marks: 20,
        topics: [
          { name: 'हिन्दी व्याकरण, संधि, समास, उपसर्ग, प्रत्यय, पर्यायवाची, विलोम, मुहावरे', nameHi: 'व्याकरण, पर्यायवाची, विलोम व मुहावरे' },
        ],
      },
      {
        id: 'sec-eng',
        name: 'General English',
        nameHi: 'सामान्य अंग्रेजी (General English)',
        questionCount: 20,
        marks: 20,
        topics: [
          { name: 'Grammar, Tenses, Prepositions, Voice, Vocabulary & Sentence Improvement', nameHi: 'Grammar, Vocabulary & Sentences' },
        ],
      },
      {
        id: 'sec-math',
        name: 'Mathematics',
        nameHi: 'गणित (Arithmetic & Reasoning)',
        questionCount: 20,
        marks: 20,
        topics: [
          { name: 'Basic Arithmetic, Percentages, Profit & Loss, Ratio, Average, Simple Reasoning', nameHi: 'अंकगणित, प्रतिशत, लाभ-हानि व अनुपात' },
        ],
      },
    ],
  },

  // ==========================================
  // HP ALLIED SERVICES
  // ==========================================
  'hp-allied-services': {
    slug: 'hp-allied-services',
    name: 'HP Allied Services Examination',
    nameHi: 'एचपी अधीनस्थ संयुक्त (अलाइड) सेवा परीक्षा',
    category: 'Administrative',
    conductingBody: 'HPPSC (Himachal Pradesh Public Service Commission)',
    totalQuestions: 200,
    durationMinutes: 180,
    totalMarks: 200,
    marksPerQuestion: 1.0,
    negativeMarking: 0.25,
    tags: ['HP GK & Culture (60 Q)', 'Current Events (60 Q)', 'Indian History & Polity (80 Q)'],
    description:
      'Official preliminary pattern for HPPSC Subordinate Allied Services. 200 MCQs in 180 minutes with 0.25 negative marking.',
    sections: [
      {
        id: 'sec-hpgk',
        name: 'History, Geography & Socio-Economic Development of HP',
        nameHi: 'हिमाचल प्रदेश का इतिहास, भूगोल एवं सामाजिक-आर्थिक विकास (60 Q)',
        questionCount: 60,
        marks: 60,
        topics: [
          { name: 'History of Himachal Princely States, Praja Mandal & Integration', nameHi: 'हिमाचल रियासतों का इतिहास, प्रजामंडल व राज्य पुनर्गठन' },
          { name: 'Geography, Physical Features, Climate, Rivers, Glaciers & Forests of HP', nameHi: 'हिमाचल का भौतिक भूगोल, नदियाँ, हिमनद व वन संपदा' },
          { name: 'Social, Cultural, Religious Heritage, Fairs, Folk Art & Architecture', nameHi: 'सामाजिक-सांस्कृतिक विरासत, मेले, लोक कला व स्थापत्य' },
          { name: 'Economic Survey of HP, Agriculture, Horticulture, Hydro-power & Tourism', nameHi: 'हिमाचल आर्थिक सर्वेक्षण, कृषि, बागवानी व जल विद्युत' },
        ],
      },
      {
        id: 'sec-ca',
        name: 'Current Events of National & International Importance',
        nameHi: 'राष्ट्रीय एवं अंतरराष्ट्रीय महत्व की समसामयिक घटनाएं (60 Q)',
        questionCount: 60,
        marks: 60,
        topics: [
          { name: 'National & Global Current Affairs, Summits, Agreements & Treaties', nameHi: 'राष्ट्रीय व वैश्विक घटनाक्रम, शिखर सम्मेलन व समझौते' },
          { name: 'Science, Technology, Space Missions, Defence Developments & Awards', nameHi: 'विज्ञान-प्रौद्योगिकी, अंतरिक्ष मिशन, रक्षा व प्रमुख पुरस्कार' },
          { name: 'Environmental Conventions, Climate Agreements, Sports & Personalities', nameHi: 'पर्यावरण सम्मेलन, खेलकूद व चर्चित व्यक्तित्व' },
        ],
      },
      {
        id: 'sec-gs',
        name: 'Modern Indian History, Culture, Polity, Economy & Geography',
        nameHi: 'आधुनिक भारतीय इतिहास, संस्कृति, राजव्यवस्था, अर्थव्यवस्था व भूगोल (80 Q)',
        questionCount: 80,
        marks: 80,
        topics: [
          { name: 'Modern Indian History (from 1857 onwards), Freedom Struggle & Gandhian Thought', nameHi: 'आधुनिक भारत का इतिहास (1857 से), स्वाधीनता संग्राम व गांधी दर्शन' },
          { name: 'Indian Constitution, Political System, Panchayati Raj & Public Policy', nameHi: 'भारतीय संविधान, राजनीतिक व्यवस्था, पंचायती राज व लोक नीति' },
          { name: 'Physical, Social & Economic Geography of India', nameHi: 'भारत का भौतिक, सामाजिक एवं आर्थिक भूगोल' },
          { name: 'Indian Economy, Demography, Poverty, Sustainable Development & Planning', nameHi: 'भारतीय अर्थव्यवस्था, सतत विकास, गरीबी व योजनाएं' },
          { name: 'General Science, Disaster Management & Environmental Ecology', nameHi: 'सामान्य विज्ञान, आपदा प्रबंधन व पारिस्थितिकी' },
        ],
      },
    ],
  },

  // ==========================================
  // SSC GD CONSTABLE
  // ==========================================
  'ssc-gd-constable': {
    slug: 'ssc-gd-constable',
    name: 'SSC GD Constable',
    nameHi: 'एसएससी जीडी कांस्टेबल परीक्षा',
    category: 'Central Defense',
    conductingBody: 'Staff Selection Commission (SSC)',
    totalQuestions: 80,
    durationMinutes: 60,
    totalMarks: 160,
    marksPerQuestion: 2.0,
    negativeMarking: 0.5,
    tags: ['Reasoning (20 Q)', 'GK & GA (20 Q)', 'Mathematics (20 Q)', 'English / Hindi (20 Q)'],
    description:
      'Official SSC GD Constable computer-based test pattern. 80 questions (160 marks) in 60 minutes with 0.50 negative marking.',
    sections: [
      {
        id: 'sec-reason',
        name: 'General Intelligence & Reasoning',
        nameHi: 'सामान्य बुद्धिमत्ता एवं तर्कशक्ति (Reasoning)',
        questionCount: 20,
        marks: 40,
        topics: [
          { name: 'Analogies, Similarities, Differences, Spatial Visualization & Orientation', nameHi: 'सादृश्यता, समानताएं व स्थानिक दृश्यांकन' },
          { name: 'Visual Memory, Discrimination, Observation, Relationship Concepts', nameHi: 'दृश्य स्मृति, विभेदन व संबंध अवधारणाएं' },
          { name: 'Arithmetical Reasoning, Figural Classification & Arithmetic Number Series', nameHi: 'अंकगणितीय तर्कशक्ति व संख्या शृंखला' },
          { name: 'Non-Verbal Series, Coding and Decoding', nameHi: 'अभाषिक शृंखला व कोडिंग-डिकोडिंग' },
        ],
      },
      {
        id: 'sec-gk',
        name: 'General Knowledge & General Awareness',
        nameHi: 'सामान्य ज्ञान एवं सामान्य जागरूकता (GK & GA)',
        questionCount: 20,
        marks: 40,
        topics: [
          { name: 'India and its Neighboring Countries, History, Culture, Geography', nameHi: 'भारत व पड़ोसी देश, इतिहास, संस्कृति व भूगोल' },
          { name: 'Economic Scene, General Polity, Indian Constitution & Scientific Research', nameHi: 'आर्थिक परिदृश्य, सामान्य राजव्यवस्था व संविधान' },
          { name: 'Current Affairs, Sports, Awards & Important Days', nameHi: 'समसामयिक घटनाएं, खेल व पुरस्कार' },
        ],
      },
      {
        id: 'sec-math',
        name: 'Elementary Mathematics',
        nameHi: 'प्रारंभिक गणित (Elementary Mathematics)',
        questionCount: 20,
        marks: 40,
        topics: [
          { name: 'Number Systems, Computation of Whole Numbers, Decimals & Fractions', nameHi: 'संख्या पद्धति, दशमलव व भिन्न' },
          { name: 'Fundamental Arithmetical Operations, Percentages, Ratio and Proportion', nameHi: 'प्रतिशत, अनुपात एवं समानुपात' },
          { name: 'Averages, Interest (Simple/Compound), Profit and Loss, Discount', nameHi: 'औसत, ब्याज, लाभ-हानि व छूट' },
          { name: 'Mensuration, Time and Distance, Ratio and Time, Time and Work', nameHi: 'क्षेत्रमिति, समय और दूरी, समय और कार्य' },
        ],
      },
      {
        id: 'sec-lang',
        name: 'English / Hindi Language',
        nameHi: 'अंग्रेजी / हिन्दी भाषा (Language Comprehension)',
        questionCount: 20,
        marks: 40,
        topics: [
          { name: 'Basic comprehension, grammar, vocabulary, sentence correction in chosen language', nameHi: 'भाषा बोध, व्याकरण, शब्दावली व वाक्य शुद्धि' },
        ],
      },
    ],
  },
};

/**
 * Normalizes any slug alias to its canonical configuration.
 */
export function getOfficialExamConfig(rawSlug?: string): OfficialExamConfig {
  if (!rawSlug) return OFFICIAL_EXAMS_SYLLABUS['hp-patwari'];

  const clean = rawSlug.toLowerCase().trim().replace(/[\s_]+/g, '-');

  // Exact match
  if (OFFICIAL_EXAMS_SYLLABUS[clean]) {
    return OFFICIAL_EXAMS_SYLLABUS[clean];
  }

  // TGT Non-Medical (MUST be checked before Medical because "non-medical" contains "medical")
  if (clean.includes('non-med') || (clean.includes('non') && clean.includes('medical'))) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-tet-tgt-non-medical'];
  }
  // TGT Medical
  if (clean.includes('medical') && !clean.includes('non')) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-tet-tgt-medical'];
  }
  // TGT Arts
  if (clean.includes('arts') || clean.includes('tgt-art')) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-tet-tgt-arts'];
  }
  // JBT
  if (clean.includes('jbt')) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-tet-jbt'];
  }
  // Patwari
  if (clean.includes('patwari')) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-patwari'];
  }
  // Police
  if (clean.includes('police')) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-police-constable'];
  }
  // Judiciary Clerk
  if (clean.includes('clerk') || clean.includes('high-court')) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-judiciary-clerk'];
  }
  // Process Server
  if (clean.includes('process-server')) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-judiciary-process-server'];
  }
  // Forest Guard
  if (clean.includes('forest')) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-forest-guard'];
  }
  // Panchayat Secretary
  if (clean.includes('panchayat')) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-panchayat-secretary'];
  }
  // Allied Services
  if (clean.includes('allied')) {
    return OFFICIAL_EXAMS_SYLLABUS['hp-allied-services'];
  }
  // SSC GD
  if (clean.includes('ssc') && clean.includes('gd')) {
    return OFFICIAL_EXAMS_SYLLABUS['ssc-gd-constable'];
  }

  // Fallback to HP Patwari if unrecognized
  return OFFICIAL_EXAMS_SYLLABUS['hp-patwari'];
}

/**
 * Returns canonical short badges for an exam card.
 */
export function getExamCanonicalBadges(slug?: string, dbSubjects?: { name: string }[]): string[] {
  const config = getOfficialExamConfig(slug);
  if (config && config.tags && config.tags.length > 0) {
    return config.tags;
  }
  if (dbSubjects && dbSubjects.length > 0) {
    return Array.from(new Set(dbSubjects.map((s) => s.name))).slice(0, 5);
  }
  return ['General Knowledge', 'Subject Specialization'];
}
