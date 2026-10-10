import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Check,
  X,
  Zap,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Pricing — HP Police Constable Mock Test Series at ₹149',
  description:
    'Get 10 full-length HP Police Constable 2026 bilingual mock tests at just ₹149. Free Mock 1 included. Detailed solutions, mistake book, subject-wise analysis — one-time payment, 1 year access.',
  openGraph: {
    title: 'Mockshikhar Pricing — Complete HP Police Mock Tests at ₹149',
    description:
      'Affordable mock test series for HP Police Constable 2026. 10 full-length tests, bilingual questions, step-by-step solutions. Try Mock 1 free.',
  },
};

export default function PricingPage() {
  const faqs = [
    {
      q: 'Why are your mock tests priced at only ₹149?',
      a: 'We believe that quality exam preparation should be affordable for every aspirant, regardless of their financial background. Unlike traditional coaching institutes with massive physical overheads, our platform is built lean and passed directly to students at a fair price.',
    },
    {
      q: 'How long will I have access to the mock test series?',
      a: 'Your purchase includes 1 full year (365 days) of unrestricted access to all 10 full-length tests, re-attempts, solutions, and your personal Mistake Book.',
    },
    {
      q: 'Can I re-attempt a mock test after submitting?',
      a: 'Yes! You can re-attempt any test multiple times. Your previous scores and historical analysis will remain safely saved in your dashboard.',
    },
    {
      q: 'Are the questions available in Hindi?',
      a: 'Absolutely! Every single question, option, and step-by-step solution is 100% bilingual. You can toggle between English and Hindi at any time during the test without losing your answers.',
    },
    {
      q: 'What if I face an issue during payment?',
      a: 'All transactions are secured by Razorpay with 256-bit encryption. If money is deducted without immediate unlocking, our automated webhook reconciles it, or you can contact support for immediate manual activation within 2 hours.',
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.badgeWrapper}>
          <Badge variant="accent" size="md">
            Simple, Transparent Pricing
          </Badge>
        </div>
        <h1 className={styles.title}>
          Honest Mock Tests at a <span className={styles.highlight}>Student-First Price</span>
        </h1>
        <p className={styles.subtitle}>
          No recurring subscriptions. No hidden fees. Just complete, high-yield full length mocks
          engineered strictly on the latest exam patterns.
        </p>
      </header>

      {/* Pricing Cards Comparison */}
      <div className={styles.pricingGrid}>
        {/* Free Tier */}
        <div className={styles.pricingCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.tierName}>Free Starter</h3>
            <p className={styles.tierDesc}>Ideal to evaluate question quality and test engine</p>
            <div className={styles.priceRow}>
              <span className={styles.freePrice}>₹0</span>
              <span className={styles.freePeriod}>Forever Free</span>
            </div>
          </div>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Full-Length Mock 1 (90 Questions)</span>
            </div>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Full Bilingual (English & Hindi)</span>
            </div>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Realistic Timer & Palette Engine</span>
            </div>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Basic Score & Accuracy Overview</span>
            </div>
            <div className={`${styles.featureItem} ${styles.featureDisabled}`}>
              <X size={16} className={styles.crossIcon} />
              <span>Remaining 9 Full-Length Tests</span>
            </div>
            <div className={`${styles.featureItem} ${styles.featureDisabled}`}>
              <X size={16} className={styles.crossIcon} />
              <span>Detailed Step-by-Step Explanations</span>
            </div>
            <div className={`${styles.featureItem} ${styles.featureDisabled}`}>
              <X size={16} className={styles.crossIcon} />
              <span>Personal Auto Mistake Book</span>
            </div>
          </div>

          <div className={styles.cardFooter}>
            <Link href="/test/hp-police-mock-1/instructions" className={styles.fullWidthLink}>
              <Button variant="secondary" size="lg" fullWidth>
                Start Mock 1 Free
              </Button>
            </Link>
          </div>
        </div>

        {/* Premium Bundle Tier */}
        <div className={`${styles.pricingCard} ${styles.featuredCard}`}>
          <div className={styles.popularBadge}>
            <Sparkles size={13} />
            <span>Most Recommended</span>
          </div>

          <div className={styles.cardHeader}>
            <h3 className={styles.tierName}>Complete Test Series Bundle</h3>
            <p className={styles.tierDesc}>Everything you need to secure your selection</p>
            <div className={styles.priceRow}>
              <span className={styles.currPrice}>₹149</span>
              <span className={styles.oldPrice}>₹499</span>
              <span className={styles.discountPill}>Save 70%</span>
            </div>
            <span className={styles.validityLabel}>One-time payment • 1 Year Unlimited Access</span>
          </div>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>All 10 Full-Length Mocks (900 Questions)</span>
            </div>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Complete Step-by-Step Bilingual Solutions</span>
            </div>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Deep Subject & Topic Diagnostic Analysis</span>
            </div>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Automatic Mistake Book & Re-practice</span>
            </div>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Personal Bookmark Manager</span>
            </div>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>State Rank & Percentile Prediction</span>
            </div>
            <div className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Unlimited Test Re-attempts</span>
            </div>
          </div>

          <div className={styles.cardFooter}>
            <Link href="/exams/hp-police-constable" className={styles.fullWidthLink}>
              <Button
                variant="accent"
                size="lg"
                fullWidth
                leftIcon={<Zap size={18} />}
                rightIcon={<ArrowRight size={18} />}
              >
                Get Full Series for ₹149
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Guarantee Box */}
      <section className={styles.guaranteeBox}>
        <ShieldCheck size={36} className={styles.guaranteeIcon} />
        <div>
          <h3 className={styles.guaranteeTitle}>100% Risk-Free Guarantee</h3>
          <p className={styles.guaranteeDesc}>
            Take Mock 1 completely free before spending a single rupee. Only upgrade if you love
            the realistic question standard and test experience.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.faqHeader}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
          <p className={styles.faqSubtitle}>
            Got queries? We have answers. If you have more questions, our support team is here to help.
          </p>
        </div>

        <div className={styles.faqGrid}>
          {faqs.map((faq, idx) => (
            <div key={idx} className={styles.faqCard}>
              <h4 className={styles.faqQuestion}>
                <HelpCircle size={18} className={styles.faqQIcon} />
                <span>{faq.q}</span>
              </h4>
              <p className={styles.faqAnswer}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
