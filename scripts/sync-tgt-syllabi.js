const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TGT_SYNC = [
  {
    slug: 'hp-tet-tgt-non-medical',
    name: 'HP TET TGT Non-Medical 2026',
    nameHi: 'एचपी टीईटी टीजीटी नॉन-मेडिकल 2026',
    category: 'HP TET Exams',
    totalQuestions: 150,
    durationMinutes: 150,
    negativeMarking: 0,
    marksPerQuestion: 1,
    description: 'Targeted test series for HP TET TGT Non-Medical examination covering Child Pedagogy (30 Q), General Awareness & HP GK (30 Q), Mathematics (30 Q), and Physics & Chemistry (60 Q).',
    subjects: [
      {
        name: 'Child Development & Pedagogy',
        nameHi: 'बाल विकास एवं शिक्षण शास्त्र',
        sortOrder: 0,
        topics: [
          { name: 'Concept & Principles of Child Development', nameHi: 'बाल विकास की अवधारणा एवं सिद्धांत' },
          { name: 'Pedagogy of Mathematics & Physical Sciences', nameHi: 'गणित एवं भौतिक विज्ञान की शिक्षण विधियां' },
          { name: 'Theories of Piaget, Kohlberg, Vygotsky', nameHi: 'पियाजे, कोहलबर्ग, वाइगोत्स्की के सिद्धांत' },
          { name: 'Inclusive Education & CWSN Accommodation', nameHi: 'समावेशी शिक्षा एवं विशेष आवश्यकताएं' },
          { name: 'Formative & Summative Evaluation (CCE)', nameHi: 'रचनात्मक एवं योगात्मक मूल्यांकन प्रणालियां' },
        ],
      },
      {
        name: 'General Awareness & HP GK',
        nameHi: 'सामान्य ज्ञान, समसामयिकी व हि.प्र. सामान्य ज्ञान',
        sortOrder: 1,
        topics: [
          { name: 'Himachal Pradesh History, Culture, Geography & Economy', nameHi: 'हिमाचल का इतिहास, संस्कृति, भूगोल व अर्थव्यवस्था' },
          { name: 'HP Government Schemes & Current Initiatives', nameHi: 'हिमाचल सरकार की प्रमुख योजनाएं एवं पहल' },
          { name: 'Indian Constitution, Democratic Polity & Geography', nameHi: 'भारतीय संविधान, लोकतांत्रिक राजव्यवस्था व भूगोल' },
          { name: 'Environmental Science & Ecological Issues', nameHi: 'पर्यावरण विज्ञान एवं पारिस्थितिक मुद्दे' },
          { name: 'National & Global Current Affairs', nameHi: 'राष्ट्रीय एवं वैश्विक समसामयिकी' },
        ],
      },
      {
        name: 'Mathematics',
        nameHi: 'गणित (अंकगणित, बीजगणित, त्रिकोणमिति, ज्यामिति)',
        sortOrder: 2,
        topics: [
          { name: 'Number Systems, Real Numbers & Polynomials', nameHi: 'संख्या पद्धति, वास्तविक संख्याएं व बहुपद' },
          { name: 'Algebra, Quadratic Equations, Progressions (AP/GP)', nameHi: 'बीजगणित, द्विघात समीकरण, अंकगणितीय व गुणोत्तर श्रेढ़ी' },
          { name: 'Trigonometry, Identities & Heights & Distances', nameHi: 'त्रिकोणमिति, सर्वसमिकाएं, ऊंचाई एवं दूरी' },
          { name: 'Coordinate Geometry & Straight Lines', nameHi: 'निर्देशांक ज्यामिति व सरल रेखाएं' },
          { name: 'Geometry, Circles, Triangles & Mensuration (2D/3D)', nameHi: 'ज्यामिति, वृत्त, त्रिभुज एवं क्षेत्रमिति' },
          { name: 'Statistics & Probability', nameHi: 'सांख्यिकी एवं प्रायिकता' },
        ],
      },
      {
        name: 'Physics & Chemistry',
        nameHi: 'भौतिक विज्ञान एवं रसायन विज्ञान (30 Q भौतिकी + 30 Q रसायन)',
        sortOrder: 3,
        topics: [
          { name: 'Physics: Kinematics, Laws of Motion & Work-Energy', nameHi: 'भौतिकी: गतिकी, गति के नियम, कार्य एवं ऊर्जा' },
          { name: 'Physics: Gravitation, Fluid Mechanics & Thermodynamics', nameHi: 'भौतिकी: गुरुत्वाकर्षण, तरल यांत्रिकी व ऊष्मागतिकी' },
          { name: 'Physics: Current Electricity, Magnetism & Optics', nameHi: 'भौतिकी: धारा विद्युत, चुंबकत्व एवं प्रकाशिकी' },
          { name: 'Chemistry: Atomic Structure, Bonding & Periodic Table', nameHi: 'रसायन: परमाणु संरचना, रासायनिक आबंधन व आवर्त सारणी' },
          { name: 'Chemistry: Thermodynamics & Chemical Equilibrium', nameHi: 'रसायन: ऊष्मागतिकी व रासायनिक साम्य' },
          { name: 'Chemistry: Acids, Bases, Salts, pH & Hydrocarbons', nameHi: 'रसायन: अम्ल-क्षार-लवण, pH व हाइड्रोकार्बन' },
        ],
      },
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
    description: 'Official test series for HP TET TGT Arts examination covering Child Pedagogy (30 Q), General Awareness & HP GK (30 Q), English Literature & Grammar (30 Q), and Social Studies (60 Q).',
    subjects: [
      {
        name: 'Child Development & Pedagogy',
        nameHi: 'बाल विकास एवं शिक्षण शास्त्र',
        sortOrder: 0,
        topics: [
          { name: 'Principles & Theories of Child Development', nameHi: 'बाल विकास के मूल सिद्धांत एवं दृष्टिकोण' },
          { name: 'Social Studies & Language Teaching Pedagogy', nameHi: 'सामाजिक अध्ययन एवं भाषा शिक्षण विधियां' },
          { name: 'Inclusive Education & Special Educational Needs', nameHi: 'समावेशी शिक्षा एवं विशिष्ट आवश्यकताएं' },
          { name: 'Theories of Learning, Motivation & Emotion', nameHi: 'अधिगम सिद्धांत, अभिप्रेरणा एवं संवेग' },
          { name: 'Continuous and Comprehensive Evaluation (CCE)', nameHi: 'सतत एवं समग्र मूल्यांकन प्रणाली' },
        ],
      },
      {
        name: 'General Awareness & HP GK',
        nameHi: 'सामान्य ज्ञान, समसामयिकी व हि.प्र. सामान्य ज्ञान',
        sortOrder: 1,
        topics: [
          { name: 'Himachal Pradesh History, Princely States & Integration', nameHi: 'हिमाचल का इतिहास, रियासतें एवं राज्य गठन' },
          { name: 'HP Geography, Districts, Flora, Fauna & Demography', nameHi: 'हिमाचल का भूगोल, जिले, वनस्पति, जीव व जनसांख्यिकी' },
          { name: 'Himachali Art, Architecture, Temples & Cultural Heritage', nameHi: 'हिमाचली कला, स्थापत्य, प्रमुख मंदिर व सांस्कृतिक धरोहर' },
          { name: 'Indian Constitution, Governance & Fundamental Rights', nameHi: 'भारतीय संविधान, शासन व्यवस्था व मौलिक अधिकार' },
          { name: 'Current National & Global Affairs & EVS', nameHi: 'राष्ट्रीय एवं अंतरराष्ट्रीय समसामयिक घटनाक्रम' },
        ],
      },
      {
        name: 'English Literature & Grammar',
        nameHi: 'अंग्रेजी भाषा एवं साहित्य (Grammar, Vocabulary & Literature)',
        sortOrder: 2,
        topics: [
          { name: 'English Grammar (Tenses, Voice, Narration, Modals)', nameHi: 'अंग्रेजी व्याकरण (Tenses, Voice, Narration, Modals)' },
          { name: 'Parts of Speech, Prepositions & Conjunctions', nameHi: 'शब्द भेद, पूर्वसर्ग एवं संयोजक' },
          { name: 'Vocabulary, Synonyms, Antonyms, Idioms & Phrases', nameHi: 'शब्दावली, समानार्थी, विलोम, मुहावरे व लोकोक्तियाँ' },
          { name: 'Unseen Reading Comprehension Passages', nameHi: 'अपठित गद्यांश एवं पठन बोध' },
          { name: 'Literary Forms, Figures of Speech & Literature Classics', nameHi: 'साहित्यिक विधाएं, अलंकार एवं प्रमुख साहित्यकार' },
        ],
      },
      {
        name: 'Social Studies / Social Science',
        nameHi: 'सामाजिक अध्ययन (इतिहास, भूगोल, नागरिक शास्त्र व अर्थशास्त्र)',
        sortOrder: 3,
        topics: [
          { name: 'Ancient & Medieval Indian History (Indus, Vedic, Maurya, Mughal)', nameHi: 'प्राचीन एवं मध्यकालीन भारतीय इतिहास' },
          { name: 'Modern Indian History & Freedom Struggle (1857–1947)', nameHi: 'आधुनिक भारतीय इतिहास एवं स्वतंत्रता आंदोलन (1857-1947)' },
          { name: 'Physical, Indian & World Geography', nameHi: 'भौतिक, भारतीय व विश्व भूगोल' },
          { name: 'Indian Polity, Parliament, Executive, Judiciary & Panchayati Raj', nameHi: 'भारतीय राजव्यवस्था, संसद, कार्यपालिका व पंचायती राज' },
          { name: 'Indian Economy, Banking, Poverty, Employment & Development', nameHi: 'भारतीय अर्थव्यवस्था, बैंकिंग, गरीबी व विकास' },
        ],
      },
    ],
  },
  {
    slug: 'hp-tet-tgt-medical',
    name: 'HP TET TGT Medical 2026',
    nameHi: 'एचपी टीईटी टीजीटी मेडिकल 2026',
    category: 'HP TET Exams',
    totalQuestions: 150,
    durationMinutes: 150,
    negativeMarking: 0,
    marksPerQuestion: 1,
    description: 'Comprehensive test series for HP TET TGT Medical examination covering Child Pedagogy (30 Q), General Awareness & HP GK (30 Q), Botany & Zoology (Biology) (60 Q), and Chemistry (30 Q).',
    subjects: [
      {
        name: 'Child Development & Pedagogy',
        nameHi: 'बाल विकास एवं शिक्षण शास्त्र',
        sortOrder: 0,
        topics: [
          { name: 'Concept & Principles of Child Development', nameHi: 'बाल विकास की अवधारणा एवं सिद्धांत' },
          { name: 'Theories of Piaget, Kohlberg, Vygotsky & Erikson', nameHi: 'पियाजे, कोहलबर्ग, वाइगोत्स्की व एरिक्सन के सिद्धांत' },
          { name: 'Inclusive Education & Children with Special Needs (CWSN)', nameHi: 'समावेशी शिक्षा एवं विशेष आवश्यकता वाले बच्चे' },
          { name: 'Learning Theories, Motivation & Memory', nameHi: 'अधिगम सिद्धांत, अभिप्रेरणा एवं स्मृति' },
          { name: 'Assessment, Evaluation & CCE Techniques', nameHi: 'आकलन, मूल्यांकन एवं सतत समग्र मूल्यांकन (CCE)' },
        ],
      },
      {
        name: 'General Awareness & HP GK',
        nameHi: 'सामान्य ज्ञान, समसामयिकी (हि.प्र. सामान्य ज्ञान व पर्यावरण अध्ययन सहित)',
        sortOrder: 1,
        topics: [
          { name: 'Himachal Pradesh History, Culture, Fairs & Festivals', nameHi: 'हिमाचल का इतिहास, संस्कृति, मेले व त्यौहार' },
          { name: 'HP Geography, Rivers, Passes, Lakes & Glaciers', nameHi: 'हिमाचल का भूगोल, नदियाँ, दर्रे, झीलें व हिमनद' },
          { name: 'Indian Constitution, Polity & Governance', nameHi: 'भारतीय संविधान, राजव्यवस्था एवं शासन' },
          { name: 'Environmental Studies & Ecology', nameHi: 'पर्यावरण अध्ययन एवं पारिस्थितिकी' },
          { name: 'National & International Current Affairs', nameHi: 'राष्ट्रीय एवं अंतरराष्ट्रीय समसामयिक घटनाएं' },
        ],
      },
      {
        name: 'Botany & Zoology (Biology)',
        nameHi: 'वनस्पति विज्ञान एवं प्राणी विज्ञान (जीव विज्ञान)',
        sortOrder: 2,
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
        name: 'Chemistry',
        nameHi: 'रसायन विज्ञान (अकार्बनिक, कार्बनिक व भौतिक रसायन)',
        sortOrder: 3,
        topics: [
          { name: 'Atomic Structure & Periodic Classification', nameHi: 'परमाणु संरचना एवं तत्वों का आवर्ती वर्गीकरण' },
          { name: 'Chemical Bonding & Molecular Structure', nameHi: 'रासायनिक आबंधन एवं आणविक संरचना' },
          { name: 'States of Matter, Solutions & Colloids', nameHi: 'पदार्थ की अवस्थाएं, विलयन एवं कोलाइड' },
          { name: 'Thermodynamics, Chemical Kinetics & Equilibrium', nameHi: 'ऊष्मागतिकी, रासायनिक बलगतिकी एवं साम्यावस्था' },
          { name: 'Acids, Bases, Salts, pH & Redox Reactions', nameHi: 'अम्ल, क्षार, लवण, pH मान एवं रेडॉक्स अभिक्रियाएं' },
          { name: 'Basic Organic Chemistry & Hydrocarbons', nameHi: 'मूल कार्बनिक रसायन एवं हाइड्रोकार्बन' },
        ],
      },
    ],
  },
];

async function syncAllTgtSyllabi() {
  console.log('Syncing all 3 TGT series official syllabi into PostgreSQL...');

  for (const item of TGT_SYNC) {
    console.log(`\nProcessing: ${item.name} (${item.slug})...`);

    // Ensure exam exists with correct parameters
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
      const subject = await prisma.subject.upsert({
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

      console.log(`  ✓ Subject [${sub.name}] (${sub.nameHi})`);

      for (const top of sub.topics) {
        await prisma.topic.upsert({
          where: { subjectId_name: { subjectId: subject.id, name: top.name } },
          update: {
            nameHi: top.nameHi,
          },
          create: {
            subjectId: subject.id,
            name: top.name,
            nameHi: top.nameHi,
            sortOrder: 0,
          },
        });
      }
    }
  }

  console.log('\nAll 3 TGT series syllabi successfully synced in database!');
}

syncAllTgtSyllabi().finally(() => prisma.$disconnect());

