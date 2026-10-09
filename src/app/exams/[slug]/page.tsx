'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
  Zap,
} from 'lucide-react';
import TestCard from '@/components/exam/TestCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { POPULAR_EXAMS, HP_POLICE_MOCKS } from '@/lib/mock-data';
import styles from './page.module.css';

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [unlockedExam, setUnlockedExam] = useState(false);

  const baseExam = POPULAR_EXAMS.find((e) => e.slug === slug) || POPULAR_EXAMS[0];
  const [examData, setExamData] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);

  React.useEffect(() => {
    async function loadTestsFromDb() {
      try {
        const res = await fetch(`/api/exams/${encodeURIComponent(slug)}/tests`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setExamData(data.exam);
          setTests(data.tests);
        }
      } catch (err) {
        console.error('Failed to load tests from database:', err);
      } finally {
        setIsLoadingTests(false);
      }
    }
    if (slug) {
      loadTestsFromDb();
    }
  }, [slug]);

  const exam = examData || baseExam;

  const handleSimulatePurchase = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setUnlockedExam(true);
      setIsPurchaseModalOpen(false);
    }, 1200);
  };

  return (
    <div className={styles.container}>
      {/* Back button */}
      <Link href="/exams" className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Back to All Exams</span>
      </Link>

      {/* Exam Hero Banner */}
      <header className={styles.examBanner}>
        <div className={styles.bannerInfo}>
          <div className={styles.badgeGroup}>
            <Badge variant="neutral" size="sm">
              {exam.category}
            </Badge>
            <Badge variant="accent" size="sm">
              <Sparkles size={12} />
              <span>Full Test Series</span>
            </Badge>
          </div>

          <h1 className={styles.examTitle}>{exam.name}</h1>
          <p className={styles.examDescription}>{exam.description}</p>

          <div className={styles.examStats}>
            <div className={styles.statBox}>
              <HelpCircle size={18} className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>{exam.totalQuestions} Questions</span>
                <span className={styles.statSub}>per full mock</span>
              </div>
            </div>

            <div className={styles.statBox}>
              <Clock size={18} className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>{exam.durationMinutes} Minutes</span>
                <span className={styles.statSub}>exam duration</span>
              </div>
            </div>

            <div className={styles.statBox}>
              <AlertCircle size={18} className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>-0.25 Marks</span>
                <span className={styles.statSub}>negative marking</span>
              </div>
            </div>

            <div className={styles.statBox}>
              <ShieldCheck size={18} className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>{exam.totalMocks} Total Mocks</span>
                <span className={styles.statSub}>Mock 1 is Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className={styles.pricingCard}>
          <div className={styles.pricingBadge}>Special Launch Price</div>
          <div className={styles.priceRow}>
            <span className={styles.price}>₹{exam.price}</span>
            <span className={styles.origPrice}>₹{exam.originalPrice}</span>
            <span className={styles.discount}>
              {Math.round(((exam.originalPrice - exam.price) / exam.originalPrice) * 100)}% OFF
            </span>
          </div>
          <p className={styles.pricingGuarantee}>One-time payment • Valid for 1 full year</p>

          <div className={styles.includedList}>
            <div className={styles.includedItem}>
              <CheckCircle2 size={16} className={styles.checkIcon} />
              <span>All {exam.totalMocks} Full-Length Bilingual Tests</span>
            </div>
            <div className={styles.includedItem}>
              <CheckCircle2 size={16} className={styles.checkIcon} />
              <span>Detailed Step-by-Step Solutions</span>
            </div>
            <div className={styles.includedItem}>
              <CheckCircle2 size={16} className={styles.checkIcon} />
              <span>Automatic Mistake Book & Practice</span>
            </div>
            <div className={styles.includedItem}>
              <CheckCircle2 size={16} className={styles.checkIcon} />
              <span>Subject & Topic-wise Analysis</span>
            </div>
          </div>

          {unlockedExam ? (
            <div className={styles.unlockedBadgeBox}>
              <CheckCircle2 size={18} />
              <span>You own this full test series!</span>
            </div>
          ) : (
            <Button
              variant="accent"
              size="lg"
              fullWidth
              leftIcon={<Zap size={18} />}
              onClick={() => setIsPurchaseModalOpen(true)}
            >
              Unlock All Mocks for ₹{exam.price}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Layout */}
      <div className={styles.contentLayout}>
        {/* Left Side: Mock Tests List */}
        <section className={styles.testsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Available Full-Length Mock Tests</h2>
            <p className={styles.sectionSubtitle}>
              Start with Mock 1 for free. Unlock the entire series to access all remaining tests.
            </p>
          </div>

          <div className={styles.testsGrid}>
            {tests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                isUnlocked={unlockedExam}
                onUnlockClick={() => setIsPurchaseModalOpen(true)}
              />
            ))}
          </div>
        </section>

        {/* Right Side: Syllabus & Exam Pattern Breakdown */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>Official Exam Pattern</h3>
            <p className={styles.sidebarDesc}>
              Strictly aligned with HP Police Constable latest notification structure.
            </p>

            <div className={styles.patternTable}>
              <div className={styles.patternHeader}>
                <span>Subject / Section</span>
                <span>Questions</span>
              </div>
              {exam.subjects.map((sub: any) => (
                <div key={sub.id} className={styles.patternRow}>
                  <div>
                    <span className={styles.subjectNameEn}>{sub.name}</span>
                    <span className={styles.subjectNameHi}>{sub.nameHi}</span>
                  </div>
                  <span className={styles.questionWeight}>{sub.questionCount} Q</span>
                </div>
              ))}
              <div className={styles.patternTotalRow}>
                <span>Total Questions</span>
                <span>{exam.totalQuestions} Marks (60 Mins)</span>
              </div>
            </div>

            <div className={styles.markingNotes}>
              <div className={styles.markingNote}>
                <strong>+1.0 Mark</strong> for every correct answer
              </div>
              <div className={styles.markingNote}>
                <strong>-0.25 Mark</strong> deducted for incorrect attempts
              </div>
              <div className={styles.markingNote}>
                <strong>0 Marks</strong> for unattempted questions
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Unlock Complete Test Series"
      >
        <div className={styles.modalBody}>
          <div className={styles.modalExamHeader}>
            <h3 className={styles.modalExamTitle}>{exam.name}</h3>
            <div className={styles.modalPricePill}>₹{exam.price}</div>
          </div>
          <p className={styles.modalSubtext}>
            Get immediate access to all {exam.totalMocks} full-length tests, detailed solutions,
            and personal Mistake Book.
          </p>

          <div className={styles.checkoutFeatures}>
            <div className={styles.checkoutItem}>
              <CheckCircle2 size={16} className={styles.checkIcon} />
              <span>Instant unlocking across all your devices</span>
            </div>
            <div className={styles.checkoutItem}>
              <CheckCircle2 size={16} className={styles.checkIcon} />
              <span>100% Secure Checkout via UPI, Debit Card, NetBanking</span>
            </div>
            <div className={styles.checkoutItem}>
              <CheckCircle2 size={16} className={styles.checkIcon} />
              <span>1 Year unrestricted validity</span>
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button
              variant="accent"
              size="lg"
              fullWidth
              isLoading={isProcessingPayment}
              onClick={handleSimulatePurchase}
            >
              Pay ₹{exam.price} & Unlock All Mocks
            </Button>
            <p className={styles.modalSecurityNote}>
              🔒 Razorpay 256-Bit SSL Secured Payment
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
