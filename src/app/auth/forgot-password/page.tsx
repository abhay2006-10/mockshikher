'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate password reset email send
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.authCard}>
        <div className={styles.cardHeader}>
          <Link href="/" className={styles.brandLogo}>
            <div className={styles.logoIcon}>M</div>
            <span>Mockshikhar</span>
          </Link>
          <h1 className={styles.cardTitle}>Reset Your Password</h1>
          <p className={styles.cardSubtitle}>
            Enter the email associated with your account and we&apos;ll send you a password reset link.
          </p>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {isSubmitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <div className={styles.successBanner}>
              <CheckCircle2 size={18} />
              <span>
                If an account exists for <strong>{email}</strong>, a password reset link has been dispatched.
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Please check your inbox (and spam folder). The link will expire in 60 minutes.
            </p>
            <Link href="/auth/login" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
              <Button variant="outline" size="md" fullWidth>
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
              Send Reset Link
            </Button>
          </form>
        )}

        <div className={styles.cardFooter}>
          <Link href="/auth/login" className={styles.footerLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
