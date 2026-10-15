'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Clock,
  BookOpen,
  Award,
  Zap,
  BarChart3,
  BookmarkCheck,
  Mail,
  Phone,
} from 'lucide-react';
import ExamCard from '@/components/exam/ExamCard';
import ComingSoonExamCard from '@/components/exam/ComingSoonExamCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AuthModal, { AuthModalTab } from '@/components/ui/AuthModal';
import WhatsAppUpdatesSection from '@/components/common/WhatsAppUpdatesSection';
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

/** Activates swipe dot indicators for a given container id */
function useSwipeDots(containerId: string) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Dots are the next sibling's children
    const dotsWrapper = container.nextElementSibling;
    if (!dotsWrapper) return;
    const dots = dotsWrapper.querySelectorAll<HTMLSpanElement>(`.${styles.swipeDot}`);
    if (!dots.length) return;

    const items = container.querySelectorAll<HTMLElement>(`.${styles.swipeItem}`);
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(items).indexOf(entry.target as HTMLElement);
            dots.forEach((d, i) => d.classList.toggle(styles.active, i === idx));
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    items.forEach((item) => observer.observe(item));
    if (dots[0]) dots[0].classList.add(styles.active);

    return () => observer.disconnect();
  }, [containerId]);
}

export default function HomePageClient({ landingExams, publishedExamCount, showGoogle = false }: HomePageClientProps) {
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<AuthModalTab>('signup');
  const [modalCallback, setModalCallback] = useState('/dashboard');

  useSwipeDots('exam-swipe');
  useSwipeDots('steps-swipe');
  useSwipeDots('features-swipe');
  useSwipeDots('reviews-swipe');

  const openAuthForTest = (testUrl: string) => {
    setModalCallback(testUrl);
    setModalTab('signup');
    setModalOpen(true);
  };

  const FreeMockButton = ({ label, leftIcon }: { label: string; leftIcon?: React.ReactNode }) => {
    if (isLoggedIn) {
      return (
        <Link href={FREE_MOCK_URL}>
          <Button
            variant="accent"
            size="lg"
            leftIcon={leftIcon || <Zap size={20} />}
            rightIcon={<ArrowRight size={20} />}
          >
            {label}
          </Button>
        </Link>
      );
    }
    return (
      <Button
        variant="accent"
        size="lg"
        leftIcon={leftIcon || <Zap size={20} />}
        rightIcon={<ArrowRight size={20} />}
        onClick={() => openAuthForTest(FREE_MOCK_URL)}
      >
        {label}
      </Button>
    );
  };

  return (
    <div className={styles.container}>
      {/* ================= HERO SECTION ================= */}
      <section className={styles.heroSection}>
        <div className={styles.heroGlow1} />
        <div className={styles.heroGlow2} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Crack Government Exams With{' '}
            <span className={styles.gradientText}>Realistic Mock Tests</span> &amp;
            Honest Performance Analysis
          </h1>

          <p className={styles.heroSubtitle}>
            Engineered strictly on official exam patterns. Take full-length bilingual mocks,
            diagnose your exact weak areas, practice mistakes, and boost your score — starting at just ₹149.
          </p>

          <div className={styles.heroCtas}>
            <FreeMockButton label="Attempt HP Patwari Mock 1 Free" />
            <Link href="/exams">
              <Button variant="outline" size="lg">
                Explore All Exams ({publishedExamCount})
              </Button>
            </Link>
          </div>

          <div className={styles.heroTrustGrid}>
            <div className={styles.trustItem}>
              <CheckCircle2 size={18} className={styles.trustIcon} />
              <span>100% Free First Mock Test</span>
            </div>
            <div className={styles.trustItem}>
              <CheckCircle2 size={18} className={styles.trustIcon} />
              <span>Full Bilingual (English &amp; Hindi)</span>
            </div>
            <div className={styles.trustItem}>
              <CheckCircle2 size={18} className={styles.trustIcon} />
              <span>Official Negative Marking (-0.25)</span>
            </div>
            <div className={styles.trustItem}>
              <CheckCircle2 size={18} className={styles.trustIcon} />
              <span>Detailed Step-by-Step Solutions</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= POPULAR EXAMS ================= */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <Badge variant="primary" size="md">
              Targeted Test Series
            </Badge>
            <h2 className={styles.sectionTitle}>Popular Government &amp; Police Exams</h2>
            <p className={styles.sectionSubtitle}>
              Select your goal and begin with a free full-length mock test today.
            </p>
          </div>
          <Link href="/exams">
            <Button variant="ghost" size="md" rightIcon={<ArrowRight size={16} />}>
              Explore All Exams ({publishedExamCount})
            </Button>
          </Link>
        </div>

        {/* Mobile: horizontal swipe row; desktop: grid */}
        <div className={styles.swipeContainer} id="exam-swipe">
          {landingExams.map((item) => {
            if (item.isComingSoon) {
              return (
                <div key={item.slug} className={styles.swipeItem}>
                  <ComingSoonExamCard
                    name={item.name}
                    description={item.description}
                    category={item.category}
                  />
                </div>
              );
            }
            return (
              <div key={item.exam.id} className={styles.swipeItem}>
                <ExamCard
                  exam={item.exam}
                  isLoggedIn={isLoggedIn}
                  onTryFreeMock={openAuthForTest}
                />
              </div>
            );
          })}
        </div>
        <div className={styles.swipeDots} aria-hidden="true">
          {landingExams.map((_, i) => (
            <span key={i} className={styles.swipeDot} />
          ))}
        </div>
      </section>

      {/* ================= THE CORE 5-STEP LOOP ================= */}
      <section className={styles.loopSection}>
        <div className={styles.sectionHeaderCentered}>
          <Badge variant="accent" size="md">
            The Proven System
          </Badge>
          <h2 className={styles.sectionTitle}>
            How To Turn Weak Areas Into High Exam Scores
          </h2>
          <p className={styles.sectionSubtitle}>
            Most aspirants fail because they take tests without fixing their errors. Our platform
            closes that gap with an automated 5-step mastery cycle.
          </p>
        </div>

        <div className={styles.swipeContainer} id="steps-swipe">
          <div className={`${styles.swipeItem} ${styles.loopStep}`}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepIconWrap}>
              <Clock size={24} className={styles.stepIcon} />
            </div>
            <h3 className={styles.stepTitle}>Simulated Mock Test</h3>
            <p className={styles.stepDesc}>
              Experience real exam pressure with a strict countdown timer, bilingual toggle,
              palette navigation, and negative marking.
            </p>
          </div>

          <div className={`${styles.swipeItem} ${styles.loopStep}`}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepIconWrap}>
              <Award size={24} className={styles.stepIcon} />
            </div>
            <h3 className={styles.stepTitle}>Instant Scorecard</h3>
            <p className={styles.stepDesc}>
              Instant score calculation with breakdown of correct, wrong, skipped questions,
              accuracy percentage, and time taken.
            </p>
          </div>

          <div className={`${styles.swipeItem} ${styles.loopStep}`}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepIconWrap}>
              <BarChart3 size={24} className={styles.stepIcon} />
            </div>
            <h3 className={styles.stepTitle}>Deep Analysis</h3>
            <p className={styles.stepDesc}>
              Subject and topic-wise diagnostics clearly pinpoint your strong and weak areas,
              so you stop guessing where you lost marks.
            </p>
          </div>

          <div className={`${styles.swipeItem} ${styles.loopStep}`}>
            <div className={styles.stepNum}>4</div>
            <div className={styles.stepIconWrap}>
              <BookOpen size={24} className={styles.stepIcon} />
            </div>
            <h3 className={styles.stepTitle}>Auto Mistake Book</h3>
            <p className={styles.stepDesc}>
              Every wrong answer is automatically catalogued into your personal Mistake Book with
              detailed step-by-step solutions.
            </p>
          </div>

          <div className={`${styles.swipeItem} ${styles.loopStep}`}>
            <div className={styles.stepNum}>5</div>
            <div className={styles.stepIconWrap}>
              <TrendingUp size={24} className={styles.stepIcon} />
            </div>
            <h3 className={styles.stepTitle}>Retest &amp; Improve</h3>
            <p className={styles.stepDesc}>
              Practice targeted mistake sessions, mark questions mastered, and watch your accuracy
              rise test after test.
            </p>
          </div>
        </div>
        <div className={styles.swipeDots} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={styles.swipeDot} />
          ))}
        </div>
      </section>

      {/* ================= TRUST & VALUE PROPOSITIONS ================= */}
      <section className={styles.featuresSection}>
        <div className={styles.swipeContainer} id="features-swipe">
          <div className={`${styles.swipeItem} ${styles.featureCard}`}>
            <div className={styles.featureIcon}>
              <ShieldCheck size={28} />
            </div>
            <h3 className={styles.featureTitle}>Strict Exam Accuracy</h3>
            <p className={styles.featureDesc}>
              Questions are created by experienced educators strictly according to past trends
              and official syllabus notifications. No irrelevant fluff.
            </p>
          </div>

          <div className={`${styles.swipeItem} ${styles.featureCard}`}>
            <div className={styles.featureIcon}>
              <Zap size={28} />
            </div>
            <h3 className={styles.featureTitle}>Unmatched Pricing (₹149)</h3>
            <p className={styles.featureDesc}>
              Big coaching institutes charge ₹1,500 to ₹3,000 for basic tests. We believe quality
              preparation should be accessible to every student at just ₹149.
            </p>
          </div>

          <div className={`${styles.swipeItem} ${styles.featureCard}`}>
            <div className={styles.featureIcon}>
              <BookmarkCheck size={28} />
            </div>
            <h3 className={styles.featureTitle}>Smart Revision Tools</h3>
            <p className={styles.featureDesc}>
              Bookmark tricky questions with one click. Build customized practice sessions from
              your bookmarks or previous mistakes anytime.
            </p>
          </div>
        </div>
        <div className={styles.swipeDots} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={styles.swipeDot} />
          ))}
        </div>
      </section>

      {/* ================= SOCIAL PROOF / REVIEWS ================= */}
      <section className={styles.reviewsSection}>
        <div className={styles.sectionHeaderCentered}>
          <Badge variant="success" size="md">
            Aspirant Feedback
          </Badge>
          <h2 className={styles.sectionTitle}>Built for Serious Aspirants</h2>
          <p className={styles.sectionSubtitle}>
            See what candidates preparing for Himachal and police exams say about our tests.
          </p>
        </div>

        <div className={styles.swipeContainer} id="reviews-swipe">
          <div className={`${styles.swipeItem} ${styles.reviewCard}`}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.reviewText}>
              &ldquo;The HP Police Constable mock test pattern is identical to the actual exam. The HP GK
              questions and reasoning level matched exactly what was asked in the previous recruitment.&rdquo;
            </p>
            <div className={styles.reviewer}>
              <div className={styles.avatar}>VK</div>
              <div>
                <div className={styles.reviewerName}>Vikas Kumar</div>
                <div className={styles.reviewerRole}>HP Police Aspirant, Kangra</div>
              </div>
            </div>
          </div>

          <div className={`${styles.swipeItem} ${styles.reviewCard}`}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.reviewText}>
              &ldquo;The Mistake Book feature is brilliant. Earlier I used to write down errors in a register
              which took hours. Here it automatically saves my wrong answers for quick revision.&rdquo;
            </p>
            <div className={styles.reviewer}>
              <div className={styles.avatar}>AS</div>
              <div>
                <div className={styles.reviewerName}>Anjali Sharma</div>
                <div className={styles.reviewerRole}>State Exam Candidate, Mandi</div>
              </div>
            </div>
          </div>

          <div className={`${styles.swipeItem} ${styles.reviewCard}`}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.reviewText}>
              &ldquo;At ₹149 for 10 full length tests with bilingual explanations, this is 10x better value
              than coaching center test series. The timer and palette feel just like a real computer exam.&rdquo;
            </p>
            <div className={styles.reviewer}>
              <div className={styles.avatar}>RS</div>
              <div>
                <div className={styles.reviewerName}>Rohit Singh</div>
                <div className={styles.reviewerRole}>Aspirant, Shimla</div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.swipeDots} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={styles.swipeDot} />
          ))}
        </div>
      </section>

      {/* ================= MOCKSHIKHAR UPDATES (WHATSAPP CHANNEL) ================= */}
      <section className={styles.section} style={{ marginTop: '2.5rem', marginBottom: '1rem', maxWidth: '1000px', margin: '2.5rem auto 1rem' }}>
        <WhatsAppUpdatesSection sourceContext="homepage" />
      </section>

      {/* ================= CONTACT US SECTION ================= */}
      <section className={styles.section} style={{ marginTop: '2.5rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(245, 179, 1, 0.05) 100%)',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Badge variant="primary" size="md">
              Need Help?
            </Badge>
            <h2 className={styles.sectionTitle} style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
              Contact Mockshikhar Support
            </h2>
            <p className={styles.sectionSubtitle}>
              Have questions regarding our mock test series, questions, or syllabus? Reach out to our team directly.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {/* Email Contact Card */}
            <a
              href="mailto:mockshikhar@gmail.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1.5rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary-400)',
                  flexShrink: 0,
                }}
              >
                <Mail size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Official Email
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  mockshikhar@gmail.com
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                  ● Click to send email
                </div>
              </div>
            </a>

            {/* Phone & WhatsApp Contact Card */}
            <a
              href="tel:+917876725758"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1.5rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  flexShrink: 0,
                }}
              >
                <Phone size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Phone &amp; WhatsApp Support
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  +91 78767 25758
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Click to call or message
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
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
