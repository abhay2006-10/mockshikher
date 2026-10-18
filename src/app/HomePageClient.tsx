'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  Check,
  X,
  CheckCircle2,
  Clock,
  BookOpen,
  Zap,
  Mail,
  Phone,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Languages,
  Award,
  Layers,
  GraduationCap,
} from 'lucide-react';
import ExamCard from '@/components/exam/ExamCard';
import ComingSoonExamCard from '@/components/exam/ComingSoonExamCard';
import Button from '@/components/ui/Button';
import AuthModal, { AuthModalTab } from '@/components/ui/AuthModal';
import WhatsAppUpdatesSection, { InstagramIcon } from '@/components/common/WhatsAppUpdatesSection';
import type { MockExam } from '@/lib/mock-data';
import styles from './page.module.css';

const FREE_MOCK_URL = '/test/hp-patwari-mock-1/instructions';

type LandingExamItem =
  | { isComingSoon: true; slug: string; name: string; description: string; category: string }
  | { isComingSoon: false; exam: MockExam };

interface HomePageClientProps {
  landingExams: LandingExamItem[];
  publishedExamCount: number;
  showGoogle?: boolean;
}

interface MiniMockQuestion {
  id: number;
  section: string;
  marksText: string;
  questionHi: string;
  questionEn: string;
  options: { key: string; textHi: string; textEn: string }[];
  correctIndex: number;
  explanationHi: string;
  explanationEn: string;
}

const CONSOLE_QUESTIONS: MiniMockQuestion[] = [
  {
    id: 1,
    section: 'हिमाचल प्रदेश GK',
    marksText: '+1.00 / -0.25 Mark',
    questionHi: 'वैदिक काल में हिमाचल की "विपाशा" नदी को वर्तमान में किस नाम से जाना जाता है?',
    questionEn: 'By what name is Himachal Pradesh\'s "Vipasha" river known in present times from the Vedic period?',
    options: [
      { key: 'A', textHi: 'रावी नदी (Ravi)', textEn: 'Ravi River' },
      { key: 'B', textHi: 'ब्यास नदी (Beas)', textEn: 'Beas River' },
      { key: 'C', textHi: 'चिनाब नदी (Chenab)', textEn: 'Chenab River' },
      { key: 'D', textHi: 'सतलुज नदी (Satluj)', textEn: 'Satluj River' },
    ],
    correctIndex: 1,
    explanationHi: 'ब्यास नदी का वैदिक नाम "विपाशा" तथा संस्कृत नाम "अर्जीकिया" था। यह रोहतांग दर्रे के समीप ब्यास कुंड से निकलती है और मंडी, कांगड़ा होते हुए पंजाब में प्रवेश करती है।',
    explanationEn: 'The Vedic name of river Beas was "Vipasha" and Sanskrit name was "Arjikiya". It originates near Rohtang Pass at Beas Kund and flows through Mandi and Kangra.',
  },
  {
    id: 2,
    section: 'गणित (Quantitative Aptitude)',
    marksText: '+1.00 / -0.25 Mark',
    questionHi: 'यदि किसी वस्तु का विक्रय मूल्य ₹480 है और विक्रेता को 20% की हानि होती है, तो वस्तु का क्रय मूल्य (Cost Price) क्या होगा?',
    questionEn: 'If the selling price of an article is ₹480 and the seller incurs a 20% loss, find the cost price (CP):',
    options: [
      { key: 'A', textHi: '₹550', textEn: '₹550' },
      { key: 'B', textHi: '₹600', textEn: '₹600' },
      { key: 'C', textHi: '₹620', textEn: '₹620' },
      { key: 'D', textHi: '₹580', textEn: '₹580' },
    ],
    correctIndex: 1,
    explanationHi: 'क्रय मूल्य (CP) = [विक्रय मूल्य × 100] / (100 - हानि%) = [480 × 100] / 80 = 6 × 100 = ₹600।',
    explanationEn: 'Cost Price (CP) = [SP × 100] / (100 - Loss%) = [480 × 100] / 80 = ₹600.',
  },
  {
    id: 3,
    section: 'हिंदी व्याकरण',
    marksText: '+1.00 / -0.25 Mark',
    questionHi: 'निम्नलिखित में से कौन-सा शब्द "पर्वत" का सही पर्यायवाची शब्द नहीं है?',
    questionEn: 'Which of the following words is NOT a correct synonym for "Mountain" (पर्वत)?',
    options: [
      { key: 'A', textHi: 'अचल', textEn: 'Achal' },
      { key: 'B', textHi: 'नग', textEn: 'Nag' },
      { key: 'C', textHi: 'वारिधि', textEn: 'Varidhi' },
      { key: 'D', textHi: 'शैल', textEn: 'Shail' },
    ],
    correctIndex: 2,
    explanationHi: '"वारिधि" समुद्र (Ocean) का पर्यायवाची शब्द है (वारि + धि = जल धारण करने वाला)। अचल, नग, शैल, गिरि और भूधर पर्वत के पर्यायवाची हैं।',
    explanationEn: '"Varidhi" is a synonym for the ocean (one who holds water). Achal, Nag, and Shail are correct synonyms for mountain.',
  },
];

interface FaqItem {
  qHi: string;
  qEn: string;
  aHi: string;
  aEn: string;
}

const FAQS: FaqItem[] = [
  {
    qHi: 'क्या मॉक टेस्ट में नेगेटिव मार्किंग आधिकारिक नियमों के अनुसार है?',
    qEn: 'Is negative marking calculated as per official notification rules?',
    aHi: 'हाँ, बिल्कुल। HP Patwari, Police Constable और High Court Clerk में आधिकारिक अधिसूचना के अनुसार प्रत्येक गलत उत्तर पर -0.25 मार्क्स काटे जाते हैं और सबमिट करते ही आपकी शुद्ध (Net) अंक तालिका सामने आती है।',
    aEn: 'Yes, exactly. Every test strictly enforces official examination deduction rules (-0.25 per incorrect answer) with real-time net score and accuracy calculation.',
  },
  {
    qHi: 'क्या हिमाचल सामान्य ज्ञान (HP GK) के प्रश्न 2026 के नवीनतम पाठ्यक्रम पर आधारित हैं?',
    qEn: 'Are Himachal GK questions updated for the latest 2026 syllabus?',
    aHi: 'हाँ। हिमाचल प्रदेश की नदियों, इतिहास, कला-संस्कृति, प्रमुख दर्रों, बजट और ताजा सरकारी योजनाओं पर विशेष ध्यान देकर प्रश्न तैयार किए गए हैं ताकि परीक्षा में अधिकतम स्कोर हो सके।',
    aEn: 'Yes. Dedicated focus is given to HP rivers, districts, history, culture, geographic passes, state budget, and current government schemes matching previous year paper trends.',
  },
  {
    qHi: 'स्मार्ट गलती सुधार कॉपी (Mistake Book) कैसे काम करती है?',
    qEn: 'How does the automated Mistake Book (गलती कॉपी) feature work?',
    aHi: 'जब भी आप कोई प्रश्न गलत करते हैं या छोड़ते हैं, वह अपने-आप आपकी व्यक्तिगत गलती कॉपी में सुरक्षित हो जाता है। परीक्षा से पहले आप केवल अपनी गलतियों को री-अटेम्प्ट करके कमजोरियों को दूर कर सकते हैं।',
    aEn: 'Whenever you answer incorrectly, the question is automatically archived into your personal Mistake Book with detailed solutions so you can re-attempt and eliminate errors before the actual exam.',
  },
  {
    qHi: 'क्या एक बार टेस्ट सीरीज लेने पर 1 साल तक अनलिमिटेड री-अटेम्प्ट की सुविधा है?',
    qEn: 'Do test series include 1-year unlimited re-attempts?',
    aHi: 'हाँ, पूरे 1 वर्ष (365 दिन) तक आप जितने चाहें उतने री-अटेम्प्ट दे सकते हैं। कोई छिपे हुए शुल्क या मासिक रिन्यूअल नहीं हैं।',
    aEn: 'Yes, every enrolled test series provides 1 full year of validity with unlimited re-attempts and complete solutions without hidden fees.',
  },
];

export default function HomePageClient({ landingExams, publishedExamCount, showGoogle = false }: HomePageClientProps) {
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<AuthModalTab>('signup');
  const [modalCallback, setModalCallback] = useState('/dashboard');

  // Interactive CBT Exam Console
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [timerSeconds, setTimerSeconds] = useState(115);
  const [activeBubble, setActiveBubble] = useState(1);
  const [examCategoryFilter, setExamCategoryFilter] = useState<'all' | 'patwari' | 'police' | 'court' | 'coming-soon'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Mistake Book Interactive Demo
  const [reAttemptState, setReAttemptState] = useState<'initial' | 'solved'>('initial');

  // Cutoff Radar Slider
  const [sliderMarks, setSliderMarks] = useState(78);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const openAuthForTest = (testUrl: string) => {
    setModalCallback(testUrl);
    setModalTab('signup');
    setModalOpen(true);
  };

  const currentQ = CONSOLE_QUESTIONS[currentQIndex];

  const handleOptionSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
  };

  const handleNextQ = () => {
    setSelectedOpt(null);
    const nextIdx = (currentQIndex + 1) % CONSOLE_QUESTIONS.length;
    setCurrentQIndex(nextIdx);
    setActiveBubble(nextIdx + 1);
  };

  const handleBubbleClick = (qNum: number) => {
    if (qNum <= CONSOLE_QUESTIONS.length) {
      setSelectedOpt(null);
      setCurrentQIndex(qNum - 1);
      setActiveBubble(qNum);
    }
  };

  // Dynamic Cutoff Metrics calculation
  const getCutoffMetrics = (marks: number) => {
    let projectedRank = Math.round(2840 * Math.pow((100 - marks) / 100, 2.6)) + 1;
    if (projectedRank < 1) projectedRank = 1;
    const percentile = Math.min(99.9, Math.max(12.0, 100 - (projectedRank / 2840) * 100)).toFixed(1);

    if (marks >= 80) {
      return {
        rank: `#${projectedRank}`,
        percentile: `${percentile}%`,
        status: 'SAFE SELECTION ZONE 🏆',
        statusColor: '#10b981',
        advice: 'शानदार स्कोर! आप राज्य मेरिट लिस्ट में शीर्ष पर हैं। निरंतर अभ्यास जारी रखें।',
      };
    }
    if (marks >= 73) {
      return {
        rank: `#${projectedRank}`,
        percentile: `${percentile}%`,
        status: 'CUTOFF CLEARED (~73.5) ✓',
        statusColor: '#F59E0B',
        advice: 'कटऑफ क्लियर! सामान्य वर्ग के अनुमानित कटऑफ से आगे हैं। रिवीजन बनाए रखें।',
      };
    }
    return {
      rank: `#${projectedRank}`,
      percentile: `${percentile}%`,
      status: 'BORDERLINE / RISK ZONE ⚠️',
      statusColor: '#F43F5E',
      advice: 'सतर्क रहें: कटऑफ पार करने के लिए कम से कम 74+ का लक्ष्य रखें। गलती सुधार कॉपी दोहराएं।',
    };
  };

  const filteredLandingExams = landingExams.filter((item) => {
    if (examCategoryFilter === 'all') return true;
    const slug = (item.isComingSoon ? item.slug : item.exam.slug).toLowerCase();
    const category = (item.isComingSoon ? item.category : item.exam.category).toLowerCase();
    const name = (item.isComingSoon ? item.name : item.exam.name).toLowerCase();

    if (examCategoryFilter === 'patwari') {
      return slug.includes('patwari') || name.includes('patwari');
    }
    if (examCategoryFilter === 'police') {
      return slug.includes('police') || name.includes('police');
    }
    if (examCategoryFilter === 'court') {
      return (
        slug.includes('clerk') ||
        slug.includes('process-server') ||
        slug.includes('judiciary') ||
        name.includes('clerk') ||
        category.includes('court')
      );
    }
    if (examCategoryFilter === 'coming-soon') {
      return item.isComingSoon;
    }
    return true;
  });

  const cutoff = getCutoffMetrics(sliderMarks);

  return (
    <div className={styles.container}>
      {/* 1. TOP OFFICIAL RECRUITMENT TICKER */}
      <div className={styles.topTickerBar}>
        <div className={styles.tickerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span className={styles.tickerBadge}>📢 Official Notice</span>
            <span className={styles.tickerText}>
              HP Patwari 2026 &amp; HP Police Constable 2026 Full Test Series Live
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#94A3B8' }}>1st Full Mock is 100% Free:</span>
            <button
              type="button"
              className={styles.tickerLink}
              onClick={() => openAuthForTest(FREE_MOCK_URL)}
            >
              Start Free Mock Now →
            </button>
          </div>
        </div>
      </div>

      {/* 2. DUAL-SPLIT MASTERPIECE HERO */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          {/* Left Column: Direct Value Proposition */}
          <div className={styles.heroLeft}>
            <div className={styles.officialNoticeChip}>
              <span>🏔️</span>
              <span>HPPSC &amp; HPRCA Recruitment Standards</span>
            </div>

            <h1 className={styles.heroHeading}>
              Crack Himachal Govt Exams{' '}
              <span className={styles.heroHeadingHighlight}>With Real CBT Precision.</span>
            </h1>

            <div className={styles.heroHindiSubline}>
              असली परीक्षा जैसा टाइमर, -0.25 नेगेटिव मार्किंग और ऑटोमैटिक गलती सुधार कॉपी
            </div>

            <p className={styles.heroParagraph}>
              Strictly crafted for HP Patwari, HP Police Constable, and High Court Clerk with 100% verified HP GK syllabus, authentic bilingual questions, and instant scorecards.
            </p>

            {/* Direct Value Strip */}
            <div className={styles.valueStrip}>
              <div className={styles.valueItem}>
                <CheckCircle2 size={16} className={styles.valueIconCheck} />
                <span>10 Full-Length Mocks / Series</span>
              </div>
              <div className={styles.valueItem}>
                <CheckCircle2 size={16} className={styles.valueIconCheck} />
                <span>Official -0.25 Negative Marking</span>
              </div>
              <div className={styles.valueItem}>
                <CheckCircle2 size={16} className={styles.valueIconCheck} />
                <span>Smart Mistake Book (गलती कॉपी)</span>
              </div>
              <div className={styles.valueItem}>
                <CheckCircle2 size={16} className={styles.valueIconCheck} />
                <span>1 Full Year Access (365 Days)</span>
              </div>
            </div>

            {/* CTAs with Honest Pricing */}
            <div className={styles.heroCtas}>
              <Button
                variant="accent"
                size="lg"
                leftIcon={<Zap size={18} />}
                rightIcon={<ArrowRight size={18} />}
                onClick={() => openAuthForTest(FREE_MOCK_URL)}
              >
                Attempt Free HP Patwari Mock 1
              </Button>

              <Link href="/exams">
                <Button variant="outline" size="lg">
                  View All Test Series ({publishedExamCount})
                </Button>
              </Link>
            </div>

            <div className={styles.heroPricingBadge}>
              <span>Complete 1-Year Single Series Pass at just</span>
              <span className={styles.heroPriceAmount}>₹199</span>
              <span>• No recurring fees</span>
            </div>
          </div>

          {/* Right Column: Live Interactive CBT Console Simulator */}
          <div className={styles.testConsoleWrapper}>
            <div className={styles.consoleCandidateBanner}>
              <span>Aspirant: Live Simulation</span>
              <span>Center: Virtual CBT Lab 01</span>
              <span>Roll: HP-2026-0842</span>
            </div>

            <div className={styles.consoleTitleBar}>
              <div className={styles.consoleExamName}>
                <span className={styles.consoleLivePulse} />
                <span>HP PATWARI 2026 • 100 Q • 100 MARKS</span>
              </div>
              <div className={styles.consoleControlsRow}>
                <div className={styles.consoleTimer} title="Countdown Timer">
                  ⏱️ {formatTimer(timerSeconds)}
                </div>
                <button
                  type="button"
                  className={styles.langSwitchBtn}
                  onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
                >
                  {lang === 'hi' ? 'EN' : 'हिन्दी'}
                </button>
              </div>
            </div>

            {/* Section Navigation Tabs */}
            <div className={styles.consoleSectionNav}>
              <button
                type="button"
                className={`${styles.sectionTab} ${currentQIndex === 0 ? styles.sectionTabActive : ''}`}
                onClick={() => { setSelectedOpt(null); setCurrentQIndex(0); setActiveBubble(1); }}
              >
                1. हिमाचल GK (25 Q)
              </button>
              <button
                type="button"
                className={`${styles.sectionTab} ${currentQIndex === 1 ? styles.sectionTabActive : ''}`}
                onClick={() => { setSelectedOpt(null); setCurrentQIndex(1); setActiveBubble(2); }}
              >
                2. गणित (25 Q)
              </button>
              <button
                type="button"
                className={`${styles.sectionTab} ${currentQIndex === 2 ? styles.sectionTabActive : ''}`}
                onClick={() => { setSelectedOpt(null); setCurrentQIndex(2); setActiveBubble(3); }}
              >
                3. हिन्दी व्याकरण (25 Q)
              </button>
            </div>

            {/* Question Body */}
            <div className={styles.consoleQuestionBody}>
              <div className={styles.qMetaLine}>
                <span className={styles.qNumber}>Question {currentQIndex + 1} of 100</span>
                <span className={styles.qMarksTag}>{currentQ.marksText}</span>
              </div>

              <div className={styles.qText}>
                {lang === 'hi' ? currentQ.questionHi : currentQ.questionEn}
              </div>

              <div className={styles.optionsStack}>
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOpt === idx;
                  const isCorrect = idx === currentQ.correctIndex;
                  const showResult = selectedOpt !== null;

                  let optClassName = styles.optionItem;
                  if (showResult) {
                    if (isCorrect) optClassName += ` ${styles.optionCorrect}`;
                    else if (isSelected) optClassName += ` ${styles.optionWrong}`;
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={optClassName}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={selectedOpt !== null}
                    >
                      <span className={styles.optKeyBox}>{opt.key}</span>
                      <span style={{ flex: 1 }}>{lang === 'hi' ? opt.textHi : opt.textEn}</span>
                      {showResult && isCorrect && <Check size={16} color="#10B981" />}
                      {showResult && isSelected && !isCorrect && <X size={16} color="#F43F5E" />}
                    </button>
                  );
                })}
              </div>

              {/* Instant Solution Drawer */}
              {selectedOpt !== null && (
                <div className={styles.solutionDrawer}>
                  <div className={styles.solutionTitle}>
                    {selectedOpt === currentQ.correctIndex ? '✓ सही उत्तर (+1.00 अंक)' : '❌ गलत उत्तर (-0.25 नेगेटिव मार्किंग)'}
                  </div>
                  <div>
                    {lang === 'hi' ? currentQ.explanationHi : currentQ.explanationEn}
                  </div>
                </div>
              )}

              {/* Interactive Bubble Palette */}
              <div className={styles.paletteRow}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginRight: '0.25rem' }}>Palette:</span>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                  const isActive = activeBubble === num;
                  const isAnswered = num <= 3 && selectedOpt !== null && activeBubble === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      className={`${styles.paletteBubble} ${isActive ? styles.paletteBubbleActive : ''} ${isAnswered ? styles.paletteBubbleGreen : ''}`}
                      onClick={() => handleBubbleClick(num)}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Console Footer */}
            <div className={styles.consoleFooterBar}>
              {selectedOpt !== null ? (
                <button type="button" className={styles.consoleNextBtn} onClick={handleNextQ}>
                  Next Question →
                </button>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Click an option to test your preparation
                </span>
              )}

              <button
                type="button"
                className={styles.consoleFullMockBtn}
                onClick={() => openAuthForTest(FREE_MOCK_URL)}
              >
                <Sparkles size={14} /> Start Full 100-Q Mock
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE BENTO GRID: CORE INNOVATIONS */}
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeaderCol}>
            <div className={styles.sectionPreTitle}>Targeted Technology</div>
            <h2 className={styles.sectionMainHeading}>Engineered For State Selection</h2>
            <p className={styles.sectionDescription}>
              Experience the tools designed to eliminate careless mistakes and push your score into the top state ranks.
            </p>
          </div>
        </div>

        <div className={styles.bentoGrid}>
          {/* Bento 1: Automated Mistake Book */}
          <div className={`${styles.bentoCard} ${styles.bentoCol8}`}>
            <div className={styles.bentoHeader}>
              <span className={styles.bentoTag}>
                <BookOpen size={14} />
                Automated Mistake Book (गलती कॉपी)
              </span>
              <button
                type="button"
                className={`${styles.reAttemptTriggerBtn} ${reAttemptState === 'solved' ? styles.reAttemptTriggerBtnSolved : ''}`}
                onClick={() => setReAttemptState(reAttemptState === 'initial' ? 'solved' : 'initial')}
              >
                <RotateCcw size={12} />
                {reAttemptState === 'solved' ? '✓ Mastered! +1.25 Score Swing' : 'Click to Fix Error'}
              </button>
            </div>

            <h3 className={styles.bentoTitle}>
              Turn Negative Marks Into Verified Selection Scores
            </h3>
            <p className={styles.bentoDesc}>
              Every mistake is automatically cataloged with verified solutions for quick re-attempts before the actual exam.
            </p>

            <div className={styles.mistakeReattemptBox}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F8FAFC' }}>
                Q. गिरी नदी (Giri River) हिमाचल प्रदेश के किस जिले को सिस-गिरी और ट्रांस-गिरी में बांटती है?
              </div>

              <div className={styles.mistakeCompareRow}>
                <div className={styles.wrongBadge}>
                  <strong>❌ Past Mistake:</strong>
                  <div>शिमला जिला (Shimla) • -0.25 Mark</div>
                </div>
                <div className={styles.correctBadge}>
                  <strong>✓ Official Answer:</strong>
                  <div>सिरमौर जिला (Sirmaur) • +1.00 Mark</div>
                </div>
              </div>

              <div style={{ fontSize: '0.785rem', color: '#94A3B8', lineHeight: 1.5 }}>
                <strong style={{ color: '#FBBF24' }}>समाधान:</strong> गिरी नदी कुपड़ चोटी (जुब्बल) से निकलकर सिरमौर के मध्य से बहती है।
              </div>
            </div>
          </div>

          {/* Bento 2: State Cutoff & Selection Zone Radar */}
          <div className={`${styles.bentoCard} ${styles.bentoCol4}`}>
            <div className={styles.bentoHeader}>
              <span className={styles.bentoTag}>
                <Sliders size={14} />
                Cutoff &amp; Rank Radar
              </span>
              <span className={styles.cutoffMarksBadge}>
                {sliderMarks} / 100
              </span>
            </div>

            <h3 className={styles.bentoTitle}>
              Projected Selection Zone
            </h3>
            <p className={styles.bentoDesc}>
              Slide your score to inspect projected state rank and selection safety:
            </p>

            <div className={styles.cutoffBox}>
              <input
                type="range"
                min="55"
                max="95"
                step="1"
                value={sliderMarks}
                onChange={(e) => setSliderMarks(Number(e.target.value))}
                className={styles.cutoffSlider}
              />

              <div className={styles.cutoffResultsGrid}>
                <div className={styles.cutoffStatMini}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>State Rank</div>
                  <div className={styles.cutoffStatNum} style={{ color: '#10B981' }}>{cutoff.rank}</div>
                </div>
                <div className={styles.cutoffStatMini}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>Percentile</div>
                  <div className={styles.cutoffStatNum} style={{ color: '#93C5FD' }}>{cutoff.percentile}</div>
                </div>
              </div>

              <div style={{ background: 'rgba(10, 14, 24, 0.8)', padding: '0.65rem 0.85rem', borderRadius: 8, fontSize: '0.785rem', color: cutoff.statusColor, fontWeight: 700, textAlign: 'center' }}>
                {cutoff.status}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TARGET TEST SERIES SECTION */}
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeaderCol}>
            <div className={styles.sectionPreTitle}>Targeted HP Examinations</div>
            <h2 className={styles.sectionMainHeading}>Select Your Test Series</h2>
            <p className={styles.sectionDescription}>
              Includes 1 Free Full Mock, official syllabus weightage, and detailed solutions.
            </p>
          </div>
          <Link href="/exams">
            <Button variant="ghost" size="md" rightIcon={<ArrowRight size={16} />}>
              All Series ({publishedExamCount})
            </Button>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className={styles.filterPillsRow}>
          <button
            type="button"
            className={`${styles.filterPill} ${examCategoryFilter === 'all' ? styles.filterPillActive : ''}`}
            onClick={() => setExamCategoryFilter('all')}
          >
            🔥 All Series ({landingExams.length})
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${examCategoryFilter === 'patwari' ? styles.filterPillActive : ''}`}
            onClick={() => setExamCategoryFilter('patwari')}
          >
            🌾 HP Patwari 2026
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${examCategoryFilter === 'police' ? styles.filterPillActive : ''}`}
            onClick={() => setExamCategoryFilter('police')}
          >
            👮 HP Police Constable
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${examCategoryFilter === 'court' ? styles.filterPillActive : ''}`}
            onClick={() => setExamCategoryFilter('court')}
          >
            ⚖️ High Court &amp; Subordinate Courts
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${examCategoryFilter === 'coming-soon' ? styles.filterPillActive : ''}`}
            onClick={() => setExamCategoryFilter('coming-soon')}
          >
            ⏳ Upcoming Series
          </button>
        </div>

        {/* Exam Cards Grid */}
        <div className={styles.examsGrid}>
          {filteredLandingExams.map((item) => {
            if (item.isComingSoon) {
              return (
                <ComingSoonExamCard
                  key={item.slug}
                  name={item.name}
                  description={item.description}
                  category={item.category}
                />
              );
            }
            return (
              <ExamCard
                key={item.exam.id}
                exam={item.exam}
                isLoggedIn={isLoggedIn}
                onTryFreeMock={openAuthForTest}
              />
            );
          })}
        </div>
      </section>

      {/* 5. TRANSPARENT COMPARISON & FAIR PRICING STRIP */}
      <section className={styles.sectionBlock}>
        <div className={styles.pricingStripCard}>
          <div className={styles.pricingDetails}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className={styles.pricingTag}>Transparent Student Pricing</span>
              <span style={{ fontSize: '0.785rem', color: '#94A3B8' }}>365 Days Full Validity</span>
            </div>
            <div className={styles.pricingPriceRow}>
              <span className={styles.pricingBig}>₹199</span>
              <span className={styles.pricingOriginal}>₹599</span>
              <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>/ Full Series Pass</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: 0 }}>
              Includes 10 Full-Length Mocks, 1,000 Questions, Detailed Explanations &amp; Automated Mistake Book. No hidden monthly renewals.
            </p>
          </div>

          <Button
            variant="accent"
            size="lg"
            rightIcon={<ArrowRight size={18} />}
            onClick={() => openAuthForTest(FREE_MOCK_URL)}
          >
            Start With Free Mock 1
          </Button>
        </div>

        {/* Comparison Table */}
        <div className={styles.comparisonTableCard}>
          <table className={styles.compTable}>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Feature / Standard</th>
                <th style={{ width: '35%' }} className={styles.compColMock}>MockShikhar CBT Platform</th>
                <th style={{ width: '25%' }}>Generic National Apps / PDFs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Himachal Pradesh GK Syllabus</strong></td>
                <td className={styles.compColMock}>✓ 100% Focused on HP Rivers, History, Passes &amp; Districts</td>
                <td>❌ All-India GK with zero state depth</td>
              </tr>
              <tr>
                <td><strong>Examination Engine</strong></td>
                <td className={styles.compColMock}>✓ TCS iON CBT Console with Official -0.25 Negative Marking</td>
                <td>❌ Static PDFs or Google forms</td>
              </tr>
              <tr>
                <td><strong>Smart Mistake Book (गलती कॉपी)</strong></td>
                <td className={styles.compColMock}>✓ Auto catalogs wrong answers for targeted re-attempts</td>
                <td>❌ No mistake tracking</td>
              </tr>
              <tr>
                <td><strong>Language Flexibility</strong></td>
                <td className={styles.compColMock}>✓ Instant 1-Click Bilingual Switch (हिन्दी ⇄ English)</td>
                <td>❌ English-only or poor auto-translations</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. VERIFIED ASPIRANT FEEDBACK & COMMUNITY SUPPORT */}
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeaderCol}>
            <div className={styles.sectionPreTitle}>Verified Aspirant Feedback</div>
            <h2 className={styles.sectionMainHeading}>Feedback From Test Takers</h2>
          </div>
        </div>

        <div className={styles.reviewsRow}>
          <div className={styles.candidateCard}>
            <div className={styles.candidateHeader}>
              <span className={styles.attemptChip}>Verified Mock 1 Attempt</span>
              <span className={styles.scoreTag}>Score: 78.50 / 100</span>
            </div>
            <p className={styles.candidateQuote}>
              &ldquo;Patwari mock test mein Maths aur HP GK ka level bilkul recent paper pattern ke hisaab se hai. Solutions bilingual hain.&rdquo;
            </p>
            <div className={styles.candidateBio}>
              <span className={styles.candidateName}>Aman Dhiman</span>
              <span className={styles.districtBadge}>Kangra, HP</span>
            </div>
          </div>

          <div className={styles.candidateCard}>
            <div className={styles.candidateHeader}>
              <span className={styles.attemptChip}>Verified Mock 1 Attempt</span>
              <span className={styles.scoreTag}>Score: 82.00 / 100</span>
            </div>
            <p className={styles.candidateQuote}>
              &ldquo;Exam hall jaisa continuous timer aur question palette hone se speed aur accuracy bohot improve hui.&rdquo;
            </p>
            <div className={styles.candidateBio}>
              <span className={styles.candidateName}>Neha Thakur</span>
              <span className={styles.districtBadge}>Mandi, HP</span>
            </div>
          </div>

          <div className={styles.candidateCard}>
            <div className={styles.candidateHeader}>
              <span className={styles.attemptChip}>Verified Mock 1 Attempt</span>
              <span className={styles.scoreTag}>Score: 75.25 / 100</span>
            </div>
            <p className={styles.candidateQuote}>
              &ldquo;Sabse best feature Mistake Book hai — jo question galat hue wo ek jagah save ho jaate hain revision ke liye.&rdquo;
            </p>
            <div className={styles.candidateBio}>
              <span className={styles.candidateName}>Rakesh Sharma</span>
              <span className={styles.districtBadge}>Shimla, HP</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CONCISE FAQ ACCORDION */}
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeaderCol}>
            <div className={styles.sectionPreTitle}>Clear Answers</div>
            <h2 className={styles.sectionMainHeading}>Frequently Asked Questions</h2>
          </div>
        </div>

        <div className={styles.faqStack}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={styles.faqRow}>
                <button
                  type="button"
                  className={styles.faqToggleBtn}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                >
                  <span>{faq.qHi}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>
                {isOpen && (
                  <div className={styles.faqContent}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#F1F5F9' }}>{faq.aHi}</p>
                    <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.8rem' }}>{faq.aEn}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. COMMUNITY & DIRECT SUPPORT */}
      <section className={styles.sectionBlock}>
        <WhatsAppUpdatesSection sourceContext="homepage" />

        <div className={styles.supportBox} style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className={styles.sectionPreTitle}>Direct Assistance</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Need Help With Any Test or Question?
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
              Our Himachal support desk is available to assist you with mock enrollment, answer explanations, or test access.
            </p>
          </div>

          <div className={styles.supportGrid}>
            <a href="mailto:mockshikhar@gmail.com" className={styles.supportItem}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', flexShrink: 0 }}>
                <Mail size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Official Email</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', overflowWrap: 'anywhere' }}>
                  mockshikhar@gmail.com
                </div>
              </div>
            </a>

            <a href="tel:+917876725758" className={styles.supportItem}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                <Phone size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Phone / WhatsApp</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                  +91 78767 25758
                </div>
              </div>
            </a>

            <a
              href="https://www.instagram.com/himshikhar8262?rpxt=enVjNzB0dmtqMjk%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.supportItem}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(225, 48, 108, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E1306C', flexShrink: 0 }}>
                <InstagramIcon size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Instagram Updates</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                  @himshikhar8262
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
        callbackUrl={modalCallback}
        showGoogle={showGoogle}
      />
    </div>
  );
}
