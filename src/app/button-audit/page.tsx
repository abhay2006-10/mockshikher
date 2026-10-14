'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  Play,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ButtonAuditPage() {
  const [interactiveCount, setInteractiveCount] = useState(0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '2.25rem',
            fontWeight: 800,
            color: 'var(--color-text-primary, #0F172A)',
            marginBottom: '0.5rem',
          }}
        >
          🔍 Button Contrast & Variant Quality Audit
        </h1>
        <p style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '1rem', margin: 0 }}>
          Visual test suite verifying WCAG AA/AAA (4.5:1+ minimum) contrast ratio across all variants, sizes, and states.
        </p>
      </header>

      {/* Primary CTA (Amber/Gold) Audit */}
      <section
        style={{
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #334155',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <span
            style={{
              background: '#F5B301',
              color: '#111827',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.75rem',
              display: 'inline-block',
              marginBottom: '0.5rem',
            }}
          >
            CRITICAL TEST: Amber/Gold Brand CTA on Dark Background
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
            Primary / Accent CTA Buttons (WCAG AAA Contrast Ratio ~9.8:1)
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: 0 }}>
            Background: solid #F5B301 fallback + gradient. Text: #111827 near-black. Icons: currentColor.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Affected Button 1: Signup */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>1. Signup Page CTA:</span>
            <Button
              variant="accent"
              size="lg"
              rightIcon={<ArrowRight size={18} />}
              onClick={() => setInteractiveCount(c => c + 1)}
            >
              Create Free Account
            </Button>
          </div>

          {/* Affected Button 2: Instructions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>2. Instructions Page CTA:</span>
            <Button
              variant="accent"
              size="lg"
              leftIcon={<Play size={18} />}
            >
              I Am Ready — Start Test
            </Button>
          </div>

          {/* Affected Button 3: Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>3. Home/Exam Banner CTA:</span>
            <Button
              variant="accent"
              size="lg"
              leftIcon={<Zap size={20} />}
              rightIcon={<ArrowRight size={20} />}
            >
              Start Free HP Police Mock Test
            </Button>
          </div>

          {/* Affected Button 4: Featured Card */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>4. Featured Card CTA:</span>
            <Button
              variant="accent"
              size="lg"
              rightIcon={<ArrowRight size={18} />}
            >
              Start Mock 1 Free Now
            </Button>
          </div>

          {/* States: Loading & Disabled */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>5. Loading State:</span>
            <Button variant="accent" size="lg" isLoading>
              Saving Progress...
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>6. Disabled State (Accessible Grey #374151 & #9CA3AF):</span>
            <Button variant="accent" size="lg" disabled leftIcon={<Play size={18} />}>
              I Am Ready — Start Test (Disabled)
            </Button>
          </div>
        </div>
      </section>

      {/* All Other Variants Audit */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0F172A' }}>
          All Button Variants & Sizes Matrix
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Sizes */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '0.75rem' }}>Sizes:</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary" size="sm" leftIcon={<Sparkles size={14} />}>Small (32px)</Button>
              <Button variant="primary" size="md" leftIcon={<Sparkles size={16} />}>Medium (42px)</Button>
              <Button variant="primary" size="lg" leftIcon={<Sparkles size={18} />}>Large (50px)</Button>
            </div>
          </div>

          {/* Variants */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '0.75rem' }}>Variants:</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary">Primary (Amber)</Button>
              <Button variant="secondary">Secondary (Dark Slate)</Button>
              <Button variant="outline">Outline (Amber Border)</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger (Red)</Button>
            </div>
          </div>

          {/* Global .btn classes */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '0.75rem' }}>Global HTML Class (.btn, .btn--primary):</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/signup" className="btn btn--primary btn--md">
                HTML Link .btn--primary
              </Link>
              <Link href="/exams" className="btn btn--secondary btn--md">
                HTML Link .btn--secondary
              </Link>
              <Link href="/exams" className="btn btn--outline btn--md">
                HTML Link .btn--outline
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link href="/" style={{ color: 'var(--color-primary-600, #2563EB)', fontWeight: 600 }}>
          ← Back to Mockshikhar Home
        </Link>
      </div>
    </div>
  );
}
