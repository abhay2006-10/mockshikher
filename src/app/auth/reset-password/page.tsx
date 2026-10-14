'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Lock, Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from '../auth.module.css';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [step, setStep] = useState<'email' | 'verify' | 'success'>(initialEmail ? 'verify' : 'email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
      setStep('verify');
    }
  }, [initialEmail, email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.cooldownRemaining) {
          setCooldown(data.cooldownRemaining);
        }
        setError(data.error || 'Failed to send verification code.');
        setIsLoading(false);
        return;
      }

      setStep('verify');
      setCooldown(60);
      setIsLoading(false);
    } catch {
      setError('A network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: cleanCode,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Failed to reset password. Please check your verification code.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setStep('success');
    } catch {
      setError('A network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.cardHeader}>
        <Link href="/" className={styles.brandLogo}>
          <div className={styles.logoIcon}>M</div>
          <span>Mockshikhar</span>
        </Link>
        <h1 className={styles.cardTitle}>
          {step === 'success' ? 'Password Reset!' : 'Reset Your Password'}
        </h1>
        <p className={styles.cardSubtitle}>
          {step === 'email' && 'Enter your registered email and we will send you a 6-digit verification code.'}
          {step === 'verify' && 'Enter the verification code sent to your email and set your new password.'}
          {step === 'success' && 'Your password has been changed successfully. You can now log in.'}
        </p>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleSendCode} className={styles.form}>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            leftIcon={<Mail size={16} />}
            required
          />

          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
            Send Verification Code
          </Button>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={handleResetPassword} className={styles.form}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.6rem 0.8rem',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Code sent to: </span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary-500, #38bdf8)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '2px 6px',
              }}
            >
              Change
            </button>
          </div>

          <Input
            label="6-Digit Verification Code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setCode(val);
              if (error) setError(null);
            }}
            leftIcon={<KeyRound size={16} />}
            helperText="Check your email inbox or spam folder for the 6-digit code."
            required
          />

          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 6 characters"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (error) setError(null);
            }}
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
          />

          <Input
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError(null);
            }}
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
          />

          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
            Reset Password
          </Button>

          <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
            {cooldown > 0 ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>
                Resend code in {cooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendCode()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary-500, #38bdf8)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RefreshCw size={14} />
                <span>Resend Verification Code</span>
              </button>
            )}
          </div>
        </form>
      )}

      {step === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
          <div className={styles.successBanner}>
            <CheckCircle2 size={20} />
            <span>
              Your password has been successfully reset! You can now sign in with your new password.
            </span>
          </div>
          <Link href="/auth/login" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg" fullWidth>
              Back to Sign In
            </Button>
          </Link>
        </div>
      )}

      <div className={styles.cardFooter}>
        <Link
          href="/auth/login"
          className={styles.footerLink}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Login</span>
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.pageWrapper}>
      <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
