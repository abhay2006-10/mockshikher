'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Phone, AlertCircle, ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import VerifyCodeForm from '@/components/auth/VerifyCodeForm';
import styles from '../auth.module.css';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showGoogle, setShowGoogle] = useState(false);

  useEffect(() => {
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then((providers) => {
        if (providers?.google) setShowGoogle(true);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (phone && phone.trim()) {
      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (!/^(?:\+?91|0)?[6-9]\d{9}$/.test(cleanedPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number (e.g. 9816012345)');
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, whatsappConsent, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsVerifying(true);
    } catch {
      setError('An error occurred during sign up. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerifiedSuccess = async () => {
    // Auto sign-in with verified credentials
    const signInRes = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (signInRes?.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      router.push('/auth/login?verified=true');
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.authCard}>
        <div className={styles.cardHeader}>
          <Link href="/" className={styles.brandLogo}>
            <div className={styles.logoIcon}>M</div>
            <span>Mockshikhar</span>
          </Link>
          <h1 className={styles.cardTitle}>
            {isVerifying ? 'Activate Account' : 'Create Your Account'}
          </h1>
          <p className={styles.cardSubtitle}>
            {isVerifying
              ? 'Complete email verification to begin your test practice.'
              : 'Join candidates preparing for government exams with realistic mocks.'}
          </p>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {isVerifying ? (
          <VerifyCodeForm
            email={email}
            onSuccess={handleVerifiedSuccess}
            onChangeEmail={() => setIsVerifying(false)}
          />
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Rohan Sharma"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              leftIcon={<User size={16} />}
              required
            />

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

            <Input
              label="Mobile Number (for WhatsApp updates)"
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError(null);
              }}
              leftIcon={<Phone size={16} />}
              helperText="10-digit Indian mobile number (e.g. 9816012345)"
            />

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                userSelect: 'none',
                marginTop: '-0.25rem',
                lineHeight: 1.4,
              }}
            >
              <input
                type="checkbox"
                checked={whatsappConsent}
                onChange={(e) => setWhatsappConsent(e.target.checked)}
                style={{
                  marginTop: '0.2rem',
                  accentColor: 'var(--color-primary-600, #4f46e5)',
                  cursor: 'pointer',
                }}
              />
              <span>
                Receive exam alerts, mock test results & course updates on WhatsApp. (You can opt out anytime from your profile).
              </span>
            </label>

            <Input
              label="Password (min 8 characters)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              leftIcon={<Lock size={16} />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
              leftIcon={<Lock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight size={18} />}
            >
              Sign Up Free
            </Button>

            {showGoogle && (
              <>
                <div className={styles.divider}>
                  <span>or continue with</span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className={styles.googleBtn}
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
              </>
            )}
          </form>
        )}

        <div className={styles.cardFooter}>
          <span>Already have an account?</span>
          <Link href="/auth/login" className={styles.footerLink}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
