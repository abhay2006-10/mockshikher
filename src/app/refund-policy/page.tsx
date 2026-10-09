import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description: 'Cancellation and refund policies for Mockshikhar mock test series.',
};

export default function RefundPolicyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1rem 5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
        Cancellation & Refund Policy
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Last Updated: October 5, 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            1. Try Before You Buy (Free Mock)
          </h2>
          <p>
            To ensure complete satisfaction and transparency, Mockshikhar provides full-length Mock 1 completely free of charge
            for every test series. Aspirants are strongly encouraged to attempt the free mock test to evaluate our question quality,
            bilingual accuracy, and test platform before purchasing the paid bundle.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            2. Digital Product Policy
          </h2>
          <p>
            Because our mock test series provides instantaneous, un-revocable digital access upon successful payment, purchases
            are generally non-refundable once unlocked.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            3. Exceptions & Payment Failure Resolution
          </h2>
          <p>
            Refunds will be processed in full under the following specific circumstances:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Duplicate Charges:</strong> If you are charged multiple times for the same test series due to a network glitch.</li>
            <li><strong>Technical Access Failure:</strong> If the platform fails to unlock your test series after payment confirmation and our technical team cannot resolve the access within 24 hours.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            4. Support Contact
          </h2>
          <p>
            For billing disputes or duplicate payment inquiries, please email support@mockshikhar.com with your payment ID and registered email. Approved refunds will be credited back to the original payment source within 5-7 working days.
          </p>
        </section>
      </div>
    </div>
  );
}
