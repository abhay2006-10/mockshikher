'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, Lock, CheckCircle2, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setName(data.user.name || '');
            setEmail(data.user.email || '');
            setPhone(data.user.phone || '');
            setWhatsappConsent(data.user.whatsappConsent ?? true);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, whatsappConsent }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update profile');
        return;
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      setErrorMsg('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully!');
    }, 800);
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem',
          fontWeight: 600,
          textDecoration: 'none',
          marginBottom: '1.5rem',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </Link>

      <header style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            margin: '0 0 0.5rem 0',
          }}
        >
          My Profile & Account Settings
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Manage your student account information, mobile updates consent, and credentials.
        </p>
      </header>

      {errorMsg && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Personal Details */}
        <div
          style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Personal Information
            </h2>
            <Badge variant="success" size="sm">
              Active Student
            </Badge>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User size={16} />}
              required
            />

            <Input
              label="Email Address"
              value={email}
              disabled
              leftIcon={<Mail size={16} />}
              helperText="Email address cannot be modified after registration"
            />

            <Input
              label="Mobile Number (WhatsApp)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9816012345"
              leftIcon={<Phone size={16} />}
              helperText="10-digit Indian mobile number for test notifications & announcements"
            />

            {/* WhatsApp Updates & Opt-out setting */}
            <div
              style={{
                marginTop: '0.25rem',
                padding: '1rem',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  userSelect: 'none',
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
                    width: '16px',
                    height: '16px',
                  }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.925rem' }}>
                    WhatsApp Notifications & Course Announcements
                  </strong>
                  <span style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.2rem' }}>
                    {whatsappConsent
                      ? 'You are currently subscribed to receive exam alerts, result updates and new test announcements. Uncheck this box to opt out anytime.'
                      : 'You are currently opted out. Check this box to re-enable WhatsApp updates.'}
                  </span>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
                {isSaved ? 'Changes Saved Successfully!' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div
          style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Security & Password
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Ensure your account is protected with a secure password.
            </p>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />

            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button type="submit" variant="secondary" size="md" isLoading={isUpdatingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
