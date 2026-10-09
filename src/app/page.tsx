import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  BookmarkCheck,
  ChevronRight,
  Flame,
} from 'lucide-react';
import ExamCard from '@/components/exam/ExamCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { POPULAR_EXAMS } from '@/lib/mock-data';
import styles from './page.module.css';

export default function HomePage() {
  const hpPoliceExam = POPULAR_EXAMS.find((e) => e.slug === 'hp-police-constable') || POPULAR_EXAMS[0];

  return (
    <div className={styles.container}>
      {/* ================= HERO SECTION ================= */}
      <section className={styles.heroSection}>
        <div className={styles.heroGlow1} />
        <div className={styles.heroGlow2} />
        <div className={styles.heroContent}>
          <div className={styles.announcementPill}>
            <span className={styles.pillBadge}>
              <Flame size={12} /> New Launch
            </span>
            <span className={styles.pillText}>
              HP Police Constable 2026 Test Series is Now Live!
            </span>
            <ChevronRight size={14} className={styles.pillArrow} />
          </div>

          <h1 className={styles.heroTitle}>
            Crack Government Exams With{' '}
            <span className={styles.gradientText}>Realistic Mock Tests</span> &
            Honest Performance Analysis
          </h1>

          <p className={styles.heroSubtitle}>
            Engineered strictly on official exam patterns. Take full-length bilingual mocks,
            diagnose your exact weak areas, practice mistakes, and boost your score — starting at just ₹149.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/test/hp-police-mock-1/instructions">
              <Button
                variant="accent"
                size="lg"
                leftIcon={<Zap size={20} />}
                rightIcon={<ArrowRight size={20} />}
              >
                Attempt HP Police Mock 1 Free
              </Button>
            </Link>
            <Link href="/exams">
              <Button variant="outline" size="lg">
                Explore All Exams ({POPULAR_EXAMS.length})
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
              <span>Full Bilingual (English & Hindi)</span>
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

      {/* ================= FLAGSHIP SPOTLIGHT BANNER ================= */}
      <section className={styles.flagshipSection}>
        <div className={styles.flagshipCard}>
          <div className={styles.flagshipBadge}>
            <Sparkles size={14} />
            <span>Featured State Exam Series</span>
          </div>

          <div className={styles.flagshipBody}>
            <div className={styles.flagshipInfo}>
              <h2 className={styles.flagshipTitle}>
                {hpPoliceExam.name} Complete Test Series
              </h2>
              <p className={styles.flagshipDesc}>
                10 Full-Length Mocks designed strictly according to the latest notification
                pattern (90 Questions, 60 Minutes, 90 Marks). Includes English, Hindi,
                HP GK, Maths, Science & Reasoning.
              </p>

              <div className={styles.flagshipHighlights}>
                <div className={styles.flagshipStat}>
                  <span className={styles.statNumber}>10</span>
                  <span className={styles.statLabel}>Full-Length Mocks</span>
                </div>
                <div className={styles.flagshipStat}>
                  <span className={styles.statNumber}>900</span>
                  <span className={styles.statLabel}>Bilingual Questions</span>
                </div>
                <div className={styles.flagshipStat}>
                  <span className={styles.statNumber}>Mock 1</span>
                  <span className={styles.statLabel}>Completely Free</span>
                </div>
                <div className={styles.flagshipStat}>
                  <span className={styles.statNumber}>₹149</span>
                  <span className={styles.statLabel}>Full Series (Save 70%)</span>
                </div>
              </div>
            </div>

            <div className={styles.flagshipActions}>
              <div className={styles.offerTag}>
                <span className={styles.offerTagMain}>Introductory Offer</span>
                <span className={styles.offerPrice}>₹149 <small>₹499</small></span>
              </div>
              <Link href={`/exams/${hpPoliceExam.slug}`} className={styles.fullWidthLink}>
                <Button variant="accent" size="lg" fullWidth rightIcon={<ArrowRight size={18} />}>
                  Start Mock 1 Free Now
                </Button>
              </Link>
              <Link href={`/exams/${hpPoliceExam.slug}`} className={styles.fullWidthLink}>
                <Button variant="secondary" size="md" fullWidth>
                  View All 10 Tests & Syllabus
                </Button>
              </Link>
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
            <h2 className={styles.sectionTitle}>Popular Government & Police Exams</h2>
            <p className={styles.sectionSubtitle}>
              Select your goal and begin with a free full-length mock test today.
            </p>
          </div>
          <Link href="/exams">
            <Button variant="ghost" size="md" rightIcon={<ArrowRight size={16} />}>
              View All Exams
            </Button>
          </Link>
        </div>

        <div className={styles.examGrid}>
          {POPULAR_EXAMS.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
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

        <div className={styles.loopGrid}>
          <div className={styles.loopStep}>
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

          <div className={styles.loopStep}>
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

          <div className={styles.loopStep}>
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

          <div className={styles.loopStep}>
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

          <div className={styles.loopStep}>
            <div className={styles.stepNum}>5</div>
            <div className={styles.stepIconWrap}>
              <TrendingUp size={24} className={styles.stepIcon} />
            </div>
            <h3 className={styles.stepTitle}>Retest & Improve</h3>
            <p className={styles.stepDesc}>
              Practice targeted mistake sessions, mark questions mastered, and watch your accuracy
              rise test after test.
            </p>
          </div>
        </div>
      </section>

      {/* ================= TRUST & VALUE PROPOSITIONS ================= */}
      <section className={styles.featuresSection}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <ShieldCheck size={28} />
            </div>
            <h3 className={styles.featureTitle}>Strict Exam Accuracy</h3>
            <p className={styles.featureDesc}>
              Questions are created by experienced educators strictly according to past trends
              and official syllabus notifications. No irrelevant fluff.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Zap size={28} />
            </div>
            <h3 className={styles.featureTitle}>Unmatched Pricing (₹149)</h3>
            <p className={styles.featureDesc}>
              Big coaching institutes charge ₹1,500 to ₹3,000 for basic tests. We believe quality
              preparation should be accessible to every student at just ₹149.
            </p>
          </div>

          <div className={styles.featureCard}>
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

        <div className={styles.reviewsGrid}>
          <div className={styles.reviewCard}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.reviewText}>
              “The HP Police Constable mock test pattern is identical to the actual exam. The HP GK
              questions and reasoning level matched exactly what was asked in the previous recruitment.”
            </p>
            <div className={styles.reviewer}>
              <div className={styles.avatar}>VK</div>
              <div>
                <div className={styles.reviewerName}>Vikas Kumar</div>
                <div className={styles.reviewerRole}>HP Police Aspirant, Kangra</div>
              </div>
            </div>
          </div>

          <div className={styles.reviewCard}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.reviewText}>
              “The Mistake Book feature is brilliant. Earlier I used to write down errors in a register
              which took hours. Here it automatically saves my wrong answers for quick revision.”
            </p>
            <div className={styles.reviewer}>
              <div className={styles.avatar}>AS</div>
              <div>
                <div className={styles.reviewerName}>Anjali Sharma</div>
                <div className={styles.reviewerRole}>State Exam Candidate, Mandi</div>
              </div>
            </div>
          </div>

          <div className={styles.reviewCard}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.reviewText}>
              “At ₹149 for 10 full length tests with bilingual explanations, this is 10x better value
              than coaching center test series. The timer and palette feel just like a real computer exam.”
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
      </section>

      {/* ================= FINAL CTA BANNER ================= */}
      <section className={styles.bottomCtaSection}>
        <div className={styles.bottomCtaBox}>
          <h2 className={styles.bottomCtaTitle}>
            Start Your Exam Preparation With Mock 1 — Completely Free
          </h2>
          <p className={styles.bottomCtaSubtitle}>
            No credit card or upfront payment needed. Experience the test engine, review your score,
            and inspect detailed solutions right now.
          </p>
          <div className={styles.bottomCtaButtons}>
            <Link href="/test/hp-police-mock-1/instructions">
              <Button
                variant="accent"
                size="lg"
                leftIcon={<Zap size={20} />}
                rightIcon={<ArrowRight size={20} />}
              >
                Start Free HP Police Mock Test
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
                View All Pricing & Bundles
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
