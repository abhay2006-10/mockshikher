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
  Tag,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import TestCard from '@/components/exam/TestCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AuthModal from '@/components/ui/AuthModal';
import { POPULAR_EXAMS, HP_POLICE_MOCKS } from '@/lib/mock-data';
import styles from './page.module.css';

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  // @ts-expect-error role in session
  const isAdmin = session?.user?.role === 'ADMIN';

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [unlockedExam, setUnlockedExam] = useState(false);

  React.useEffect(() => {
    if (isAdmin) {
      setUnlockedExam(true);
    }
  }, [isAdmin]);

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
    finalPrice: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);

  // Baseline price is ₹1 for all eligible exams (Limited Time Launch Offer)
  const basePrice = 1;
  const payablePrice = appliedPromo ? Math.max(1, appliedPromo.finalPrice) : basePrice;

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
          if (data.isPurchased || isAdmin) {
            setUnlockedExam(true);
          }
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

  const rawExam = examData || baseExam;
  const exam = {
    ...rawExam,
    price: (rawExam.price === 199 || rawExam.price === 149 || !rawExam.price) ? 1 : rawExam.price,
    originalPrice: 149,
  };

  // Free mock is always placed first with prominent FREE tag
  const sortedTests = React.useMemo(() => {
    return [...tests].sort((a, b) => {
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return (a.testNumber || 0) - (b.testNumber || 0);
    });
  }, [tests]);

  const handleBuyClick = () => {
    if (unlockedExam) {
      alert('You have already purchased this test series. All mock tests are unlocked and ready to attempt!');
      return;
    }
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }
    setIsPurchaseModalOpen(true);
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsCheckingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoInput.trim().toUpperCase(),
          basePrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid promo code');
      }
      setAppliedPromo({
        code: data.code,
        discount: data.discount,
        finalPrice: data.finalPrice,
      });
    } catch (err: any) {
      setPromoError(err.message || 'Invalid promo code');
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleExecutePurchase = async () => {
    if (!isLoggedIn) {
      setIsPurchaseModalOpen(false);
      setAuthModalOpen(true);
      return;
    }
    setIsProcessingPayment(true);
    try {
      // 1. Create payment order with optional promo code
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          promoCode: appliedPromo?.code || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setIsPurchaseModalOpen(false);
          setAuthModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Failed to create payment order');
      }

      // 2. If real Razorpay key and not mock mode: Open Razorpay Checkout modal
      if (!data.isMock && data.key && data.orderId) {
        const loadRzp = (): Promise<boolean> =>
          new Promise((resolve) => {
            if (typeof window === 'undefined') return resolve(false);
            if ((window as any).Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });

        const loaded = await loadRzp();
        if (!loaded) {
          throw new Error('Could not load payment checkout. Please check your internet connection.');
        }

        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'Mockshikhar',
          description: `Full Test Series: ${exam.name}`,
          order_id: data.orderId,
          handler: async function (response: any) {
            try {
              setIsProcessingPayment(true);
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  examId: exam.id,
                  amount: data.finalPrice || payablePrice,
                  promoCode: appliedPromo?.code || undefined,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (verifyRes.ok) {
                setUnlockedExam(true);
                setIsPurchaseModalOpen(false);
                const freshRes = await fetch(`/api/exams/${encodeURIComponent(slug)}/tests`, { cache: 'no-store' });
                if (freshRes.ok) {
                  const freshData = await freshRes.json();
                  setExamData(freshData.exam);
                  setTests(freshData.tests);
                }
              } else {
                const verifyData = await verifyRes.json();
                alert(verifyData.error || 'Payment verification failed');
              }
            } catch (err: any) {
              alert(err.message || 'Error verifying payment');
            } finally {
              setIsProcessingPayment(false);
            }
          },
          prefill: {
            name: session?.user?.name || '',
            email: session?.user?.email || '',
          },
          theme: {
            color: '#4f46e5',
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setIsProcessingPayment(false);
          fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: data.orderId,
              razorpay_payment_id: resp.error?.metadata?.payment_id,
              status: 'FAILED',
              failureReason: resp.error?.description || 'Payment failed',
            }),
          }).catch(() => {});
          alert(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
        });
        rzp.open();
        return;
      }

      // 3. Fallback simulated test mode (in local dev without active credentials)
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          isMock: true,
          amount: data.finalPrice || payablePrice,
          promoCode: appliedPromo?.code || undefined,
          razorpay_order_id: data.orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
        }),
      });

      if (verifyRes.ok) {
        setUnlockedExam(true);
        setIsPurchaseModalOpen(false);
        const freshRes = await fetch(`/api/exams/${encodeURIComponent(slug)}/tests`, { cache: 'no-store' });
        if (freshRes.ok) {
          const freshData = await freshRes.json();
          setExamData(freshData.exam);
          setTests(freshData.tests);
        }
      } else {
        const verifyData = await verifyRes.json();
        throw new Error(verifyData.error || 'Payment verification failed');
      }
    } catch (err: any) {
      alert(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Back button */}
      <Link href="/exams" className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Back to All Exams</span>
      </Link>

      {/* Launch Offer Alert Bar */}
      <div className={styles.launchAlertBar}>
        <div className={styles.launchAlertContent}>
          <span className={styles.launchFireTag}>🔥 LIMITED TIME LAUNCH OFFER</span>
          <span className={styles.launchAlertText}>
            Special Launch Price: Get all mock tests in this series for just <strong>₹1</strong> <span className={styles.launchOldPriceInline}>(Regular ₹149)</span>! Offer valid for a limited time.
          </span>
        </div>
        <span className={styles.launchOfferPill}>99% OFF • ₹1 ONLY</span>
      </div>

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
                <span className={styles.statValue}>
                  {exam.negativeMarking && Number(exam.negativeMarking) > 0
                    ? `-${exam.negativeMarking} Marks`
                    : '0 Marks'}
                </span>
                <span className={styles.statSub}>negative marking</span>
              </div>
            </div>

            <div className={styles.statBox}>
              <ShieldCheck size={18} className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>{exam.totalMocks || sortedTests.length || 10} Total Mocks</span>
                <span className={styles.statSub}>Mock 1 is Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className={styles.pricingCard}>
          <div className={styles.pricingBadge}>🔥 Limited Time Launch Offer</div>
          <div className={styles.priceRow}>
            <span className={styles.price}>₹{exam.price || 1}</span>
            <span className={styles.origPrice}>₹{exam.originalPrice || 149}</span>
            <span className={styles.discount}>
              99% OFF
            </span>
          </div>
          <p className={styles.pricingGuarantee}>Special Launch Offer • Valid for 1 full year</p>
          <p style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 600, margin: '0.35rem 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>⚡</span> Limited time launch offer for all students
          </p>

          <div className={styles.includedList}>
            <div className={styles.includedItem}>
              <CheckCircle2 size={16} className={styles.checkIcon} />
              <span>All {exam.totalMocks || sortedTests.length || 10} Full-Length Bilingual Tests</span>
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

          {unlockedExam || isAdmin ? (
            <div className={styles.unlockedBadgeBox}>
              <CheckCircle2 size={18} />
              <span>{isAdmin ? 'Admin Full Access Unlocked' : 'You own this full test series!'}</span>
            </div>
          ) : (
            <Button
              variant="accent"
              size="lg"
              fullWidth
              leftIcon={<Zap size={18} />}
              onClick={handleBuyClick}
            >
              Buy Test Series • ₹{exam.price || 1} (Launch Offer)
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
            {sortedTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                isUnlocked={unlockedExam || isAdmin}
                onUnlockClick={handleBuyClick}
                examPrice={exam.price}
                totalMocks={exam.totalMocks || sortedTests.length}
              />
            ))}
          </div>
        </section>

        {/* Right Side: Syllabus & Exam Pattern Breakdown */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>Official Exam Pattern</h3>
            <p className={styles.sidebarDesc}>
              Strictly aligned with {exam.name} latest notification structure.
            </p>

            <div className={styles.patternTable}>
              <div className={styles.patternHeader}>
                <span>Subject / Section</span>
                <span>Questions</span>
              </div>
              {(() => {
                if (slug?.includes('clerk')) {
                  return [
                    { id: 'sec-gk', name: 'General Knowledge & HP GK', nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान (HP, National & International)', questionCount: 60 },
                    { id: 'sec-comp', name: 'Basic Computers & IT', nameHi: 'कंप्यूटर एवं सूचना प्रौद्योगिकी', questionCount: 20 },
                    { id: 'sec-reason', name: 'Reasoning Ability', nameHi: 'तर्कशक्ति (रीजनिंग)', questionCount: 20 },
                  ];
                }
                if (slug?.includes('process-server')) {
                  return [
                    { id: 'sec-gk', name: 'General Knowledge & HP GK', nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान', questionCount: 15 },
                    { id: 'sec-math', name: 'Elementary Mathematics', nameHi: 'प्रारंभिक गणित', questionCount: 10 },
                    { id: 'sec-sci', name: 'General Science', nameHi: 'सामान्य विज्ञान', questionCount: 10 },
                    { id: 'sec-lang', name: 'General English & Hindi', nameHi: 'अंग्रेजी व हिंदी भाषा', questionCount: 10 },
                    { id: 'sec-reason', name: 'Reasoning Ability', nameHi: 'तर्कशक्ति (रीजनिंग)', questionCount: 5 },
                  ];
                }
                if (slug?.includes('police')) {
                  return [
                    { id: 'sec-eng', name: 'English Language', nameHi: 'अंग्रेजी भाषा', questionCount: 16 },
                    { id: 'sec-hindi', name: 'Hindi Language', nameHi: 'हिंदी भाषा', questionCount: 16 },
                    { id: 'sec-math', name: 'Mathematics', nameHi: 'गणित', questionCount: 16 },
                    { id: 'sec-gk', name: 'General Knowledge & HP GK', nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान', questionCount: 24 },
                    { id: 'sec-reason', name: 'Reasoning Ability', nameHi: 'तर्कशक्ति (रीजनिंग)', questionCount: 18 },
                  ];
                }
                return [
                  { id: 'sec-eng', name: 'English Language', nameHi: 'अंग्रेजी भाषा', questionCount: 20 },
                  { id: 'sec-math', name: 'Mathematics', nameHi: 'गणित', questionCount: 20 },
                  { id: 'sec-hindi', name: 'Hindi Language', nameHi: 'हिंदी भाषा', questionCount: 20 },
                  { id: 'sec-gk', name: 'General Knowledge & HP GK', nameHi: 'सामान्य ज्ञान व हि.प्र. सामान्य ज्ञान', questionCount: 20 },
                  { id: 'sec-reason', name: 'Reasoning Ability', nameHi: 'तर्कशक्ति (रीजनिंग)', questionCount: 20 },
                ];
              })().map((sub: any) => (
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
                <span>{exam.totalQuestions} Questions ({exam.durationMinutes || 90} Mins)</span>
              </div>
            </div>

            <div className={styles.markingNotes}>
              <div className={styles.markingNote}>
                <strong>+{exam.marksPerQuestion || 1.0} Mark</strong> for every correct answer
              </div>
              <div className={styles.markingNote}>
                <strong>
                  {exam.negativeMarking && Number(exam.negativeMarking) > 0
                    ? `-${exam.negativeMarking} Mark deducted for incorrect attempts`
                    : '0 Marks deducted (No negative marking)'}
                </strong>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                ₹{exam.originalPrice || 149}
              </span>
              <div className={styles.modalPricePill}>₹{payablePrice}</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#FCD34D', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '6px', marginBottom: '0.65rem' }}>
            <span>⚡ Limited Time Launch Offer (₹1 Only)</span>
          </div>
          <p className={styles.modalSubtext}>
            Get immediate access to all 10 full-length tests, detailed solutions, and personal Mistake Book for 1 full year.
          </p>

          {/* Promo Code Box */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Tag size={15} color="#818CF8" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Have a Promo Code?</span>
            </div>

            {appliedPromo ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#10B981' }}>
                    {appliedPromo.code}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#10B981' }}>
                    (₹{appliedPromo.discount} Discount Applied)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedPromo(null);
                    setPromoInput('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Remove promo code"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. PATWARI51"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoError(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplyPromo}
                    isLoading={isCheckingPromo}
                  >
                    Apply
                  </Button>
                </div>
                {promoError && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.35rem', display: 'block' }}>
                    {promoError}
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Tip: Use promo code <strong>PATWARI51</strong> or <strong>MOCK149</strong> for ₹51 discount!
                </span>
              </div>
            )}
          </div>

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
              <span>Includes 10 Full-Length Mock Tests + Mistake Book</span>
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button
              variant="accent"
              size="lg"
              fullWidth
              isLoading={isProcessingPayment}
              onClick={handleExecutePurchase}
            >
              Pay ₹{payablePrice} &amp; Unlock Full Test Series (Launch Offer)
            </Button>
            <p className={styles.modalSecurityNote}>
              🔒 Razorpay 256-Bit SSL Secured Payment
            </p>
          </div>
        </div>
      </Modal>

      {/* Guest Login/Signup Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="login"
        callbackUrl={`/exams/${slug}`}
      />
    </div>
  );
}
