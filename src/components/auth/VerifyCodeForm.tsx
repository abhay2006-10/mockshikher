'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, RotateCw } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface VerifyCodeFormProps {
  email: string;
  onSuccess: () => void;
  onChangeEmail?: () => void;
  initialCooldown?: number;
}

export default function VerifyCodeForm({
  email,
  onSuccess,
  onChangeEmail,
  initialCooldown = 60,
}: VerifyCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numbers and max 6 chars
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (error) setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed. Please try again.');
        setIsLoading(false);
        return;
      }

      setInfo('Email verified successfully!');
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to resend code.');
        if (data.cooldownRemaining) {
          setCooldown(data.cooldownRemaining);
        }
      } else {
        setInfo('A new 6-digit code has been dispatched to your email.');
        setCooldown(60);
      }
    } catch {
      setError('Network error while resending code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary, #F5F5F5)', margin: '0 0 0.5rem 0' }}>
          Verify Your Email
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #94A3B8)', margin: 0, lineHeight: 1.5 }}>
          We sent a 6-digit verification code to <strong style={{ color: '#F1F5F9' }}>{email}</strong>.
          Enter it below to activate your account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#f87171',
            fontSize: '0.8rem',
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {info && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#4ade80',
            fontSize: '0.8rem',
            lineHeight: 1.4,
          }}
        >
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{info}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="verify-code-input"
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary, #94A3B8)',
            marginBottom: '6px',
          }}
        >
          Enter 6-Digit Code
        </label>
        <input
          id="verify-code-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus
          placeholder="••••••"
          value={code}
          onChange={handleCodeChange}
          style={{
            width: '100%',
            height: '52px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            color: '#F5B301',
            fontSize: '1.75rem',
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: '10px',
            outline: 'none',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '6px', textAlign: 'center' }}>
          Code expires in 10 minutes (max 5 attempts)
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        rightIcon={<ArrowRight size={18} />}
        disabled={code.length !== 6 || isLoading}
      >
        Verify &amp; Continue
      </Button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '4px',
          fontSize: '0.8rem',
        }}
      >
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          style={{
            background: 'none',
            border: 'none',
            color: cooldown > 0 ? '#64748B' : 'var(--color-accent, #F5B301)',
            cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
            padding: 0,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <RotateCw size={13} className={isResending ? 'spin' : ''} />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>

        {onChangeEmail && (
          <button
            type="button"
            onClick={onChangeEmail}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary, #94A3B8)',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            Change email
          </button>
        )}
      </div>
    </form>
  );
}
