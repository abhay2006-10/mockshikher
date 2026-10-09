import React from 'react';
import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '65vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1rem',
      }}
    >
      <div
        style={{
          fontSize: '6rem',
          fontFamily: 'var(--font-heading)',
          fontWeight: 900,
          color: 'var(--color-primary-600)',
          lineHeight: 1,
          marginBottom: '1rem',
        }}
      >
        404
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.75rem',
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          marginBottom: '0.75rem',
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          color: 'var(--color-text-secondary)',
          maxWidth: '480px',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}
      >
        The page or exam test you are looking for might have been moved, renamed, or is temporarily unavailable.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="lg" leftIcon={<Home size={18} />}>
            Back to Home
          </Button>
        </Link>
        <Link href="/exams" style={{ textDecoration: 'none' }}>
          <Button variant="outline" size="lg" leftIcon={<Search size={18} />}>
            Browse Mock Tests
          </Button>
        </Link>
      </div>
    </div>
  );
}
