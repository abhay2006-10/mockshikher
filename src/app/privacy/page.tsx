import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy and data protection terms for Mockshikhar.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1rem 5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
        Privacy Policy
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Last Updated: October 5, 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            1. Information We Collect
          </h2>
          <p>
            When you register on Mockshikhar, we collect your name, email address, and authentication credentials.
            When you attempt mock tests, we record your response selections, time spent per question, test scores,
            mistake logs, and bookmarks to provide you with personalized performance analytics.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            2. How We Use Your Information
          </h2>
          <p>
            We use your data solely to deliver, enhance, and personalize your exam preparation experience:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Generate real-time test scores, accuracy percentages, and subject diagnostics</li>
            <li>Maintain your personal Mistake Book and Bookmark repository</li>
            <li>Process payments securely via Razorpay payment gateway</li>
            <li>Send critical account security notices and exam updates</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            3. Payment Security
          </h2>
          <p>
            Mockshikhar does not store your debit card, credit card, net banking, or UPI PIN credentials. All payment
            transactions are processed by RBI-licensed payment aggregator Razorpay via 256-bit encrypted channels.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            4. Contact Us
          </h2>
          <p>
            For privacy inquiries or account data deletion requests, email us at: support@mockshikhar.com.
          </p>
        </section>
      </div>
    </div>
  );
}
