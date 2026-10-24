'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  BookOpen,
  Mail,
  Phone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Languages,
  BarChart2,
  TrendingUp,
  Target,
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

interface ScoreTip {
  id: string;
  badge: string;
  title: string;
  desc: string;
  focusArea: string;
  accentColor: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  actionLabel: string;
  actionHref: string;
}

const SCORE_TIPS: ScoreTip[] = [
  {
    id: 'tip-accuracy',
    badge: 'Core Accuracy',
    title: 'Improve Accuracy Before Speed',
    desc: 'Practise questions carefully and understand why an answer is correct or incorrect. Build accuracy first, then work on answering faster.',
    focusArea: 'Accuracy Focus',
    accentColor: '#F59E0B',
    icon: Target,
    actionLabel: 'Explore Test Series',
    actionHref: '#series-catalog',
  },
  {
    id: 'tip-mistakes',
    badge: 'Smart Revision',
    title: 'Turn Mistakes into Learning',
    desc: 'Revisit questions you answered incorrectly. Understand the correct answer, revise the underlying concept, and practise similar questions again.',
    focusArea: 'Error Revision',
    accentColor: '#3B82F6',
    icon: RotateCcw,
    actionLabel: 'Open Mistake Book',
    actionHref: '#mistake-book',
  },
  {
    id: 'tip-timer',
    badge: 'Exam Pacing',
    title: 'Practise with a Timer',
    desc: 'Attempt timed mock tests to develop a steady pace. Learn when to move on from a difficult question and return to it if time permits.',
    focusArea: 'Time Management',
    accentColor: '#38BDF8',
    icon: Clock,
    actionLabel: 'Try Timed Mock',
    actionHref: FREE_MOCK_URL,
  },
  {
    id: 'tip-progress',
    badge: 'Targeted Review',
    title: 'Track Progress, Target Weak Areas',
    desc: 'Review your available test results to identify subjects that need more practice. Use those insights to plan your next revision session.',
    focusArea: 'Performance',
    accentColor: '#10B981',
    icon: TrendingUp,
    actionLabel: 'View Dashboard',
    actionHref: '/dashboard',
  },
];

interface ProductFeature {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const PRODUCT_VALUE_FEATURES: ProductFeature[] = [
  {
    id: 'feat-mock-practice',
    title: 'Realistic Mock Practice',
    desc: 'Attempt available exam-specific practice tests in a timed format.',
    icon: Clock,
  },
  {
    id: 'feat-score-review',
    title: 'Score & Performance Review',
    desc: 'Review your result and the performance information available after submitting a test.',
    icon: BarChart2,
  },
  {
    id: 'feat-mistake-book',
    title: 'Mistake Book',
    desc: 'Revisit incorrect answers from supported attempts for focused revision.',
    icon: RotateCcw,
  },
  {
    id: 'feat-progress-improvement',
    title: 'Progress & Improvement',
    desc: 'Use available performance history and topic-level insights to guide your next study session.',
    icon: TrendingUp,
  },
];

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Is negative marking calculated as per official exam rules?',
    answer: 'Yes, exactly. For HP Patwari, HP Police Constable, and HP High Court Clerk examinations, negative marking (such as -0.25 marks per incorrect response) is calculated strictly as per the official notification rules. Your net score, penalty deductions, and accuracy are shown immediately upon test submission. Unattempted questions carry zero penalty.',
  },
  {
    question: 'Are Himachal Pradesh General Knowledge (HP GK) questions updated for current exams?',
    answer: 'Yes. Dedicated focus is given to Himachal Pradesh geography, rivers, lakes, district history, state budget, administrative structure, and current government schemes reflecting official previous-year patterns.',
  },
  {
    question: 'How does the Mistake Book feature work?',
    answer: 'Whenever you mark an incorrect answer in any supported mock test, it is automatically recorded in your personal Mistake Book ledger. You can review the correct answer, study the explanation, and re-attempt questions to eliminate recurring errors before the actual exam.',
  },
  {
    question: 'Do enrolled test series include 1 full year of access with unlimited re-attempts?',
    answer: 'Yes. Every enrolled test series provides 1 full year (365 days) of validity with unlimited re-attempt sessions, detailed bilingual solutions, and performance analytics with no hidden fees or monthly renewal charges.',
  },
  {
    question: 'Can I practice mock tests on both mobile phones and desktop computers?',
    answer: 'Yes. MockShikhar is fully responsive and optimized for mobile browsers, tablets, and desktop computers. You can practice timed mock tests anytime on whichever device you prefer.',
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


  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carousel Refs & Scroll Handlers
  const examCarouselRef = useRef<HTMLDivElement>(null);
  const tipsCarouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, offset: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (cat: 'all' | 'patwari' | 'police' | 'court' | 'coming-soon') => {
    setExamCategoryFilter(cat);
    if (examCarouselRef.current) {
      examCarouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

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

  return (
    <div className={styles.container}>
      {/* 1. DUAL-SPLIT MASTERPIECE HERO (Blue/Navy + Gold Identity) */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          {/* Left Column: Direct Value Proposition */}
          <div className={styles.heroLeft}>
            <div className={styles.officialNoticeChip}>
              <span>🏔️</span>
              <span>Himachal Pradesh State Examination Preparation</span>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(16, 185, 129, 0.18) 100%)', border: '1px solid rgba(245, 158, 11, 0.5)', color: '#FCD34D', fontSize: '0.78rem', fontWeight: 800, padding: '0.28rem 0.75rem', borderRadius: '999px', width: 'fit-content', letterSpacing: '0.03em' }}>
              <span>⚡ LIMITED TIME LAUNCH OFFER: Full Series Just ₹1 (was ₹149)</span>
            </div>

            <h1 className={styles.heroHeading}>
              Crack Himachal Pradesh Government Exams{' '}
              <span className={styles.heroHeadingHighlight}>Practice Smarter with Realistic Mock Tests.</span>
            </h1>

            <p className={styles.heroParagraph}>
              Prepare for HP Patwari, HP Police Constable, and relevant Himachal Pradesh court recruitment exams with timed practice tests, HP-focused questions, performance analysis, and structured mistake revision.
            </p>

            {/* Feature Highlights */}
            <div className={styles.valueStrip}>
              <div className={styles.valueItem}>
                <CheckCircle2 size={16} className={styles.valueIconCheck} />
                <span>Full-length mock tests for available exam series</span>
              </div>
              <div className={styles.valueItem}>
                <CheckCircle2 size={16} className={styles.valueIconCheck} />
                <span>Timed test interface and score calculation</span>
              </div>
              <div className={styles.valueItem}>
                <CheckCircle2 size={16} className={styles.valueIconCheckAmber} />
                <span>Mistake Book for reviewing incorrect answers</span>
              </div>
              <div className={styles.valueItem}>
                <CheckCircle2 size={16} className={styles.valueIconCheck} />
                <span>Performance tracking and improvement guidance</span>
              </div>
            </div>

            {/* CTAs with Mobile-Friendly Stacking */}
            <div className={styles.heroCtas}>
              <Button
                variant="accent"
                size="lg"
                className={styles.primaryHeroCta}
                rightIcon={<ArrowRight size={18} />}
                onClick={() => openAuthForTest(FREE_MOCK_URL)}
              >
                Attempt Free Mock
              </Button>

              <a href="#series-catalog" className={styles.secondaryHeroLink}>
                <Button variant="secondary" size="lg" className={styles.secondaryHeroCta}>
                  Explore Test Series
                </Button>
              </a>
            </div>

            {/* Trust Badges */}
            <div className={styles.trustBadgesRow}>
              <span className={styles.trustBadgeItem}>
                <ShieldCheck size={16} className={styles.trustIconBlue} /> HP-Focused Practice
              </span>
              <span className={styles.trustBadgeItem}>
                <BarChart2 size={16} className={styles.trustIconGold} /> Performance Analysis
              </span>
              <span className={styles.trustBadgeItem}>
                <Check size={16} className={styles.trustIconGreen} /> Ad-Free Environment
              </span>
            </div>
          </div>

          {/* Right Column: Live Interactive CBT Mock Exam Console */}
          <div className={styles.consoleCard} id="cbt-console">
            {/* Console Header Bar */}
            <div className={styles.consoleHeaderBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className={styles.consoleTimer}>
                  <Clock size={13} style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                  {formatTimer(timerSeconds)}
                </span>
                <span className={styles.consoleSubjectTag}>
                  {currentQ.section}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={styles.consoleMarksScheme}>
                  +1.00 / <span style={{ color: '#F43F5E' }}>-0.25</span>
                </span>
                <button
                  type="button"
                  className={styles.consoleLangSwitch}
                  onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
                >
                  <Languages size={12} />
                  {lang === 'hi' ? 'English Mode' : 'हिन्दी मोड'}
                </button>
              </div>
            </div>

            {/* Console Question Body */}
            <div className={styles.consoleBody}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span className={styles.consoleQPill}>
                  Q.{currentQ.id}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.consoleQText}>
                    {lang === 'hi' ? currentQ.questionHi : currentQ.questionEn}
                  </div>
                  <div className={styles.consoleQSubText}>
                    ({lang === 'hi' ? currentQ.questionEn : currentQ.questionHi})
                  </div>
                </div>
              </div>

              {/* Interactive Options */}
              <div className={styles.optionsStack}>
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOpt === idx;
                  const isCorrect = idx === currentQ.correctIndex;
                  const showFeedback = selectedOpt !== null;

                  let optionClass = styles.optionItem;
                  if (showFeedback) {
                    if (isCorrect) optionClass = `${styles.optionItem} ${styles.optionItemCorrect}`;
                    else if (isSelected) optionClass = `${styles.optionItem} ${styles.optionItemWrong}`;
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={optionClass}
                      onClick={() => handleOptionSelect(idx)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={styles.optionKeyBadge}>{opt.key}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#F1F5F9' }}>
                          {lang === 'hi' ? opt.textHi : opt.textEn}
                        </span>
                      </div>
                      {showFeedback && isCorrect && (
                        <span className={styles.optionBadgeCorrect}>✓ Correct (+1.00)</span>
                      )}
                      {showFeedback && isSelected && !isCorrect && (
                        <span className={styles.optionBadgeWrong}>✗ Incorrect (-0.25)</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Solution Drawer */}
              {selectedOpt !== null && (
                <div className={styles.solutionDrawer}>
                  <div className={styles.solutionTitle}>
                    {selectedOpt === currentQ.correctIndex ? '✓ Official Key Rationale (+1.00 Mark)' : '❌ Incorrect (-0.25 Negative Marking)'}
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


      {/* 3. SECTION: SMART MISTAKE BOOK */}
      <section className={styles.sectionBlock} id="mistake-book">
        <div className={styles.mistakeSplitGrid}>
          {/* Left Side: Value Pillars */}
          <div className={styles.mistakeLeftCol}>
            <span className={styles.bentoTag}>
              <BookOpen size={13} />
              LEARN FROM EVERY ATTEMPT
            </span>
            <h2 className={styles.mistakeHeading}>
              Turn Wrong Answers into <span className={styles.goldText}>Better Preparation</span>
            </h2>
            <p className={styles.mistakeLead}>
              Review questions you answered incorrectly, understand the correct answer, and revisit your mistakes to strengthen weak areas before your next mock test.
            </p>

            <div className={styles.mistakePillarsStack}>
              <div className={styles.mistakePillarItem}>
                <div className={styles.pillarIconBoxBlue}>
                  <RotateCcw size={16} />
                </div>
                <div>
                  <h4 className={styles.pillarTitle}>1. Review Incorrect Answers</h4>
                  <p className={styles.pillarDesc}>
                    Find questions you answered incorrectly in supported mock attempts and revisit them for focused revision.
                  </p>
                </div>
              </div>

              <div className={styles.mistakePillarItem}>
                <div className={styles.pillarIconBoxGold}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className={styles.pillarTitle}>2. Understand the Correct Answer</h4>
                  <p className={styles.pillarDesc}>
                    Review the correct answer and any explanation available for the question.
                  </p>
                </div>
              </div>

              <div className={styles.mistakePillarItem}>
                <div className={styles.pillarIconBoxGreen}>
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h4 className={styles.pillarTitle}>3. Practise Weak Topics Again</h4>
                  <p className={styles.pillarDesc}>
                    Use your recorded mistakes to focus revision on the subjects and topics where you need more practice.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Mistake Book Example Card */}
          <div className={styles.mistakeRightCol}>
            <div className={styles.mistakeInteractiveCard}>
              <div className={styles.mistakeCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={styles.exampleBadge}>Example Question</span>
                </div>
                <span className={styles.mistakePenaltyBadge}>
                  Penalty: -0.25 Mark
                </span>
              </div>

              <div className={styles.mistakeCardBody}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FBBF24' }}>
                  Subject: Himachal Pradesh General Knowledge
                </span>
                <p className={styles.mistakeCardQ}>
                  Which river is known as the &ldquo;Chandrabhaga&rdquo; in the upper Himalayan region?
                </p>

                {/* Question Options */}
                <div className={styles.exampleOptionList}>
                  <div className={styles.exampleOptionItem}>
                    <span>A. Beas River</span>
                  </div>
                  <div className={`${styles.exampleOptionItem} ${styles.exampleOptionCorrect}`}>
                    <span>B. Chenab River</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>✓ Correct Answer</span>
                  </div>
                  <div className={`${styles.exampleOptionItem} ${styles.exampleOptionIncorrect}`}>
                    <span>C. Ravi River</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>✗ Your Previous Response</span>
                  </div>
                  <div className={styles.exampleOptionItem}>
                    <span>D. Sutlej River</span>
                  </div>
                </div>

                <div className={styles.mistakePreviousAnswerBox}>
                  <span>Your Previous Response: <strong>C. Ravi River</strong></span>
                  <span style={{ fontWeight: 800 }}>✗ Incorrect (-0.25)</span>
                </div>

                {/* Solution & Explanation Card */}
                <div className={styles.mistakeSolutionActionCard}>
                  <p className={styles.mistakeSolutionText}>
                    <strong style={{ color: '#10B981' }}>Correct answer:</strong> B. Chenab River<br />
                    <strong style={{ color: '#CBD5E1' }}>Explanation:</strong> The Chenab River is formed by the confluence of the Chandra and Bhaga rivers near Tandi in Himachal Pradesh.
                  </p>

                  {reAttemptState === 'initial' ? (
                    <button
                      type="button"
                      className={styles.mistakeReattemptBtn}
                      onClick={() => setReAttemptState('solved')}
                    >
                      <RotateCcw size={14} /> Re-attempt Question (Demo)
                    </button>
                  ) : (
                    <div className={styles.mistakeSuccessBanner}>
                      ✓ Re-attempted Correctly: B. Chenab River (+1.00 Mark)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: SCORE OPTIMIZATION (TIPS TO IMPROVE) */}
      <section className={styles.sectionBlock} id="tips-to-improve">
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeaderCol}>
            <div className={styles.sectionPreTitle}>Preparation Strategy</div>
            <h2 className={styles.sectionMainHeading}>
              Score Optimization: <span className={styles.goldText}>Tips to Improve</span>
            </h2>
            <p className={styles.sectionDescription}>
              Practical, aspirant-focused guidance to build accuracy, master pacing, and prepare effectively for Himachal Pradesh examinations.
            </p>
          </div>
          <div className={`${styles.carouselNavButtons} ${styles.tipsNavControls}`}>
            <button
              type="button"
              className={styles.carouselArrowBtn}
              onClick={() => scrollCarousel(tipsCarouselRef, -300)}
              aria-label="Previous tips"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.carouselArrowBtn}
              onClick={() => scrollCarousel(tipsCarouselRef, 300)}
              aria-label="Next tips"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className={styles.tipsContainer}>
          <div
            ref={tipsCarouselRef}
            className={styles.tipsTrack}
            tabIndex={0}
            role="region"
            aria-label="Tips to improve carousel"
          >
            {SCORE_TIPS.map((tip) => {
              const Icon = tip.icon;
              return (
                <div key={tip.id} className={styles.tipCardItem}>
                  <div className={styles.tipCard}>
                    <div>
                      <div className={styles.tipCardTop}>
                        <div
                          className={styles.tipIconBox}
                          style={{
                            color: tip.accentColor,
                            borderColor: `${tip.accentColor}45`,
                            background: `${tip.accentColor}18`,
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <span
                          className={styles.tipBadge}
                          style={{
                            borderColor: `${tip.accentColor}55`,
                            color: tip.accentColor,
                            background: `${tip.accentColor}14`,
                          }}
                        >
                          {tip.badge}
                        </span>
                      </div>

                      <div className={styles.tipTitleBox}>
                        <h3 className={styles.tipTitle}>{tip.title}</h3>
                      </div>

                      <p className={styles.tipDesc}>{tip.desc}</p>
                    </div>

                    <div className={styles.tipFooter}>
                      <Link href={tip.actionHref} className={styles.tipActionLink}>
                        <span>{tip.actionLabel}</span>
                        <ArrowRight size={14} className={styles.tipActionArrow} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. TARGET TEST SERIES SECTION (REAL DATA CAROUSEL) */}
      <section className={styles.sectionBlock} id="series-catalog">
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeaderCol}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.15) 100%)', border: '1px solid rgba(245, 158, 11, 0.45)', color: '#FCD34D', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '999px', width: 'fit-content', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>
              <span>⚡ LIMITED TIME LAUNCH OFFER — ₹1 ONLY (WAS ₹149)</span>
            </div>
            <div className={styles.sectionPreTitle}>Targeted HP Examinations</div>
            <h2 className={styles.sectionMainHeading}>Select Your Test Series</h2>
            <p className={styles.sectionDescription}>
              Includes 1 Free Full Mock, syllabus-aligned questions, and complete test series unlock for just ₹1 for a limited time.
            </p>
          </div>
          <div className={styles.sectionActionsRow}>
            <Link href="/exams">
              <Button variant="ghost" size="md" rightIcon={<ArrowRight size={16} />}>
                All Series ({publishedExamCount})
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar: Category Tabs on Left + Carousel Arrows on Right */}
        <div className={styles.catalogControlsBar}>
          <div className={styles.filterPillsRow}>
            <button
              type="button"
              className={`${styles.filterPill} ${examCategoryFilter === 'all' ? styles.filterPillActive : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All Series ({landingExams.length})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${examCategoryFilter === 'patwari' ? styles.filterPillActive : ''}`}
              onClick={() => handleFilterChange('patwari')}
            >
              🌾 HP Patwari
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${examCategoryFilter === 'police' ? styles.filterPillActive : ''}`}
              onClick={() => handleFilterChange('police')}
            >
              👮 HP Police
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${examCategoryFilter === 'court' ? styles.filterPillActive : ''}`}
              onClick={() => handleFilterChange('court')}
            >
              ⚖️ HP High Court
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${examCategoryFilter === 'coming-soon' ? styles.filterPillActive : ''}`}
              onClick={() => handleFilterChange('coming-soon')}
            >
              ⏳ Upcoming
            </button>
          </div>

          <div className={styles.carouselNavButtons}>
            <button
              type="button"
              className={styles.carouselArrowBtn}
              onClick={() => scrollCarousel(examCarouselRef, -360)}
              aria-label="Previous exam cards"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.carouselArrowBtn}
              onClick={() => scrollCarousel(examCarouselRef, 360)}
              aria-label="Next exam cards"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Exam Cards Carousel */}
        <div className={styles.carouselWrapper}>
          <div
            ref={examCarouselRef}
            className={styles.carouselTrack}
            tabIndex={0}
            role="region"
            aria-label="Exam series catalog carousel"
          >
            {filteredLandingExams.map((item) => {
              if (item.isComingSoon) {
                return (
                  <div key={item.slug} className={styles.carouselExamCardItem}>
                    <ComingSoonExamCard
                      name={item.name}
                      description={item.description}
                      category={item.category}
                    />
                  </div>
                );
              }
              return (
                <div key={item.exam.id} className={styles.carouselExamCardItem}>
                  <ExamCard
                    exam={item.exam}
                    isLoggedIn={isLoggedIn}
                    onTryFreeMock={openAuthForTest}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. EVERYTHING YOU NEED TO PRACTICE SMARTER (GENUINE PRODUCT VALUE) */}
      <section className={styles.sectionBlock}>
        <div className={styles.productValueHeader}>
          <div className={styles.sectionPreTitle}>Platform Overview</div>
          <h2 className={styles.sectionMainHeading}>Everything You Need to Practise Better</h2>
          <p className={styles.sectionDescription}>
            Prepare for Himachal Pradesh competitive exams with focused practice, review your mistakes, and track your performance.
          </p>
        </div>

        <div className={styles.productValueGrid}>
          {PRODUCT_VALUE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.id} className={styles.productValueCard}>
                <div className={styles.productValueIconBox}>
                  <Icon size={20} />
                </div>
                <h3 className={styles.productValueTitle}>{feat.title}</h3>
                <p className={styles.productValueDesc}>{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. CONCISE FAQ ACCORDION (PROPERLY CENTERED) */}
      <section className={styles.faqSection} id="faq">
        <div className={styles.faqHeader}>
          <div className={styles.sectionPreTitle}>Clear Answers</div>
          <h2 className={styles.sectionMainHeading}>Frequently Asked Questions</h2>
          <p className={styles.sectionDescription}>
            Everything you need to know about our test engine and content authenticity.
          </p>
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
                  aria-expanded={isOpen}
                >
                  <span className={styles.faqQuestionText}>{faq.question}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                      color: isOpen ? '#F59E0B' : '#94A3B8',
                    }}
                  />
                </button>
                {isOpen && (
                  <div className={styles.faqContent}>
                    <p style={{ margin: 0, color: '#CBD5E1', fontSize: '0.875rem', lineHeight: 1.6 }}>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. COMMUNITY & DIRECT SUPPORT */}
      <section className={styles.sectionBlock} id="community-hub">
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

            <a href="tel:+918262910464" className={styles.supportItem}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                <Phone size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Support Helpline</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                  +91 82629 10464
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
