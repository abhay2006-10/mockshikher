import React from 'react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of service and usage conditions for Mockshikhar — our mock test platform for HP Police Constable and government exam preparation.',
  openGraph: {
    title: 'Terms of Service — Mockshikhar',
    description: 'Read the terms governing usage of Mockshikhar mock test series and exam preparation platform.',
  },
};

export default function TermsOfServicePage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1rem 5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
        Terms of Service
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Last Updated: October 5, 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Mockshikhar (&quot;Platform&quot;), you agree to comply with and be bound by these Terms of Service.
            If you do not agree, you must not access or use the Platform.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            2. Intellectual Property & Content Usage
          </h2>
          <p>
            All test questions, explanations, graphics, mock tests, and analytical algorithms provided on Mockshikhar
            are protected by copyright. Test materials are licensed strictly for personal, non-commercial use by the
            registered user. Reproduction, scraping, sharing login credentials, or commercial redistribution is strictly prohibited.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            3. Disclaimer
          </h2>
          <p>
            Mockshikhar is an independent educational preparatory platform. We are not affiliated with, authorized, endorsed
            by, or in any way officially connected with the Himachal Pradesh Police Department, HPPSC, SSC, or any government body.
          </p>
        </section>
      </div>
    </div>
  );
}
