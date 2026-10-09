'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from '../auth.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/exams';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError('Invalid email or password. Please try again.');
        setIsLoading(false);
      } else {
        // Fetch session to determine role-based redirect
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json().catch(() => null);
        const role = sessionData?.user?.role;

        if (role === 'ADMIN') {
          router.push('/admin');
        } else if (callbackUrl && callbackUrl !== '/exams' && callbackUrl !== '/auth/login') {
          router.push(callbackUrl);
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch {
      setError('An error occurred during sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.cardHeader}>
        <Link href="/" className={styles.brandLogo}>
          <div className={styles.logoIcon}>M</div>
          <span>Mockshikhar</span>
        </Link>
        <h1 className={styles.cardTitle}>Welcome Back</h1>
        <p className={styles.cardSubtitle}>
          Log in to continue your mock test sessions and review analysis.
        </p>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

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

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={16} />}
          required
        />

        <div className={styles.rowBetween}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>Remember me</span>
          </label>
          <Link href="/auth/forgot-password" className={styles.forgotLink}>
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          rightIcon={<ArrowRight size={18} />}
        >
          Sign In
        </Button>
      </form>

      <div className={styles.divider}>or continue with</div>

      <button type="button" className={styles.googleBtn} onClick={handleGoogleSignIn}>
        <svg width="18" height="18" viewBox="0 0 24 24">
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
        <span>Continue with Google</span>
      </button>

      <div className={styles.cardFooter}>
        Don&apos;t have an account?
        <Link href="/auth/signup" className={styles.footerLink}>
          Create an Account Free
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className={styles.pageWrapper}>
      <Suspense fallback={<div className={styles.authCard}>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
