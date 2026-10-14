'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import VerifyCodeForm from '@/components/auth/VerifyCodeForm';
import styles from './AuthModal.module.css';

export type AuthModalTab = 'login' | 'signup' | 'verify';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AuthModalTab;
  /** After login, redirect here. Defaults to /dashboard */
  callbackUrl?: string;
  /** Whether to show Google OAuth button (set by server based on GOOGLE_CLIENT_ID) */
  showGoogle?: boolean;
}

// ─── Google SVG ────────────────────────────────────────────────────────────
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

// ─── Login Tab ──────────────────────────────────────────────────────────────
interface LoginFormProps {
  onClose: () => void;
  callbackUrl: string;
  onSwitchToSignup: () => void;
  onSwitchToVerify: (email: string) => void;
  showGoogle: boolean;
  prefillEmail?: string;
}

function LoginForm({
  onClose,
  callbackUrl,
  onSwitchToSignup,
  onSwitchToVerify,
  showGoogle,
  prefillEmail = '',
}: LoginFormProps) {
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    setIsUnverified(false);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        // Check if user is unverified
        const checkRes = await fetch('/api/auth/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).catch(() => null);
        const statusData = await checkRes?.json().catch(() => null);

        if (statusData?.exists && !statusData.isVerified) {
          setError('Your email is not verified yet. Please enter the verification code to activate your account.');
          setIsUnverified(true);
        } else {
          setError('Invalid email or password. Please try again.');
        }
        setIsLoading(false);
      } else {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json().catch(() => null);
        const role = sessionData?.user?.role;

        onClose();
        if (role === 'ADMIN') {
          window.location.href = '/admin';
        } else {
          window.location.href = callbackUrl;
        }
      }
    } catch {
      setError('An error occurred during sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {error && (
        <div className={styles.errorBanner} role="alert" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
          {isUnverified && (
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={() => onSwitchToVerify(email)}
            >
              Verify / Resend Code
            </Button>
          )}
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(null);
          setIsUnverified(false);
        }}
        leftIcon={<Mail size={16} />}
        autoComplete="email"
        required
      />

      <Input
        label="Password"
        type={showPw ? 'text' : 'password'}
        placeholder="••••••••"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (error) setError(null);
        }}
        leftIcon={<Lock size={16} />}
        rightIcon={
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        autoComplete="current-password"
        required
      />

      <div className={styles.rowBetween}>
        <span />
        <a href="/auth/forgot-password" onClick={onClose} className={styles.forgotLink}>
          Forgot password?
        </a>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        rightIcon={<ArrowRight size={18} />}
      >
        Log In
      </Button>

      {showGoogle && (
        <>
          <div className={styles.divider}>or continue with</div>
          <button type="button" className={styles.googleBtn} onClick={handleGoogle}>
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
        </>
      )}

      <p className={styles.switchText}>
        Don&apos;t have an account?{' '}
        <button type="button" className={styles.switchLink} onClick={onSwitchToSignup}>
          Sign Up Free
        </button>
      </p>
    </form>
  );
}

// ─── Signup Tab ─────────────────────────────────────────────────────────────
interface SignupFormProps {
  onClose: () => void;
  callbackUrl: string;
  onSwitchToLogin: () => void;
  onSwitchToVerify: (email: string, password?: string) => void;
  showGoogle: boolean;
  initialEmail?: string;
}

function SignupForm({
  onSwitchToLogin,
  onSwitchToVerify,
  showGoogle,
  initialEmail = '',
}: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
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
      const cleaned = phone.replace(/[\s\-\(\)]/g, '');
      if (!/^(?:\+?91|0)?[6-9]\d{9}$/.test(cleaned)) {
        setError('Please enter a valid 10-digit Indian mobile number');
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

      // Registration successful! Switch directly to the 6-digit verification code screen
      setIsLoading(false);
      onSwitchToVerify(email, password);
    } catch {
      setError('An error occurred during sign up. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

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
        autoComplete="name"
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
        autoComplete="email"
        required
      />

      <Input
        label="Mobile Number (WhatsApp updates)"
        type="tel"
        placeholder="98765 43210"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          if (error) setError(null);
        }}
        leftIcon={<Phone size={16} />}
        autoComplete="tel"
      />

      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          userSelect: 'none',
          marginTop: '-0.25rem',
          lineHeight: 1.35,
        }}
      >
        <input
          type="checkbox"
          checked={whatsappConsent}
          onChange={(e) => setWhatsappConsent(e.target.checked)}
          style={{
            marginTop: '0.15rem',
            accentColor: 'var(--color-primary-600, #4f46e5)',
            cursor: 'pointer',
          }}
        />
        <span>Receive course notifications & test alerts on WhatsApp.</span>
      </label>

      <Input
        label="Password (min 8 characters)"
        type={showPw ? 'text' : 'password'}
        placeholder="••••••••"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (error) setError(null);
        }}
        leftIcon={<Lock size={16} />}
        rightIcon={
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        autoComplete="new-password"
        required
      />

      <Input
        label="Confirm Password"
        type={showPw ? 'text' : 'password'}
        placeholder="••••••••"
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
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        autoComplete="new-password"
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
          <div className={styles.divider}>or continue with</div>
          <button type="button" className={styles.googleBtn} onClick={handleGoogle}>
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
        </>
      )}

      <p className={styles.switchText}>
        Already have an account?{' '}
        <button type="button" className={styles.switchLink} onClick={onSwitchToLogin}>
          Log In
        </button>
      </p>
    </form>
  );
}

// ─── Main Modal Component ───────────────────────────────────────────────────
export default function AuthModal({
  isOpen,
  onClose,
  initialTab = 'login',
  callbackUrl = '/dashboard',
  showGoogle: explicitShowGoogle,
}: AuthModalProps) {
  const [tab, setTab] = useState<AuthModalTab>(initialTab);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [hasGoogle, setHasGoogle] = useState(explicitShowGoogle ?? false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync tab when initialTab changes
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Check providers if explicitShowGoogle is not specified
  useEffect(() => {
    if (explicitShowGoogle !== undefined) {
      setHasGoogle(explicitShowGoogle);
      return;
    }
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then((providers) => {
        if (providers?.google) setHasGoogle(true);
      })
      .catch(() => {});
  }, [explicitShowGoogle]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSwitchToVerify = (email: string, password?: string) => {
    setVerifyEmail(email);
    if (password) setVerifyPassword(password);
    setTab('verify');
  };

  const handleVerifiedSuccess = async () => {
    // If password was saved from signup flow, auto sign-in immediately
    if (verifyEmail && verifyPassword) {
      const signInRes = await signIn('credentials', {
        redirect: false,
        email: verifyEmail,
        password: verifyPassword,
      });
      if (signInRes?.ok) {
        onClose();
        window.location.href = callbackUrl;
        return;
      }
    }
    // Otherwise return to login
    setTab('login');
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={tab === 'login' ? 'Log in' : tab === 'signup' ? 'Sign up' : 'Verify email'}
    >
      <div className={styles.panel} ref={panelRef}>
        <div className={styles.dragHandle} aria-hidden="true" />

        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close authentication modal"
          type="button"
        >
          <X size={18} />
        </button>

        {tab !== 'verify' && (
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'login'}
              className={`${styles.tabBtn} ${tab === 'login' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('login')}
            >
              Log In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              className={`${styles.tabBtn} ${tab === 'signup' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('signup')}
            >
              Sign Up Free
            </button>
          </div>
        )}

        {tab === 'login' && (
          <LoginForm
            onClose={onClose}
            callbackUrl={callbackUrl}
            onSwitchToSignup={() => setTab('signup')}
            onSwitchToVerify={(em) => handleSwitchToVerify(em)}
            showGoogle={hasGoogle}
            prefillEmail={verifyEmail}
          />
        )}

        {tab === 'signup' && (
          <SignupForm
            onClose={onClose}
            callbackUrl={callbackUrl}
            onSwitchToLogin={() => setTab('login')}
            onSwitchToVerify={handleSwitchToVerify}
            showGoogle={hasGoogle}
            initialEmail={verifyEmail}
          />
        )}

        {tab === 'verify' && (
          <div style={{ paddingTop: '8px' }}>
            <VerifyCodeForm
              email={verifyEmail}
              onSuccess={handleVerifiedSuccess}
              onChangeEmail={() => setTab('signup')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
