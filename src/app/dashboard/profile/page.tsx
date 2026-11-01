'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckIcon, AlertCircle } from '@/components/v2/Icons';
import styles from './profile.module.css';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaved, setIsSaved] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    setErrorMsg(null);
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update password');
        return;
      }

      setPasswordMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    } catch {
      setErrorMsg('Failed to update password. Please try again.');
    }
  };

  return (
    <main className={styles.container}>
      {/* Back to Dashboard */}
      <div>
        <Link href="/dashboard" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>My Profile &amp; Settings</h1>
        <p className={styles.subtitle}>
          Manage your student account information, mobile updates consent, and credentials.
        </p>
      </header>

      {errorMsg && (
        <div className={styles.errorMsg}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {isSaved && (
        <div className={styles.successMsg}>
          <CheckIcon size={16} />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Card 1: Personal Details */}
      <section className={styles.card} aria-label="Personal Details">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Personal Information</h2>
          <span className={styles.activeBadge}>Active Student</span>
        </div>

        <form onSubmit={handleUpdateProfile} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="profile-name">
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="profile-email">
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              className={styles.input}
              value={email}
              disabled
            />
            <span className={styles.helperText}>
              Email address cannot be modified after registration.
            </span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="profile-phone">
              Mobile Number (WhatsApp)
            </label>
            <input
              id="profile-phone"
              type="tel"
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 7876725758"
            />
            <span className={styles.helperText}>
              10-digit Indian mobile number for test notifications &amp; exam alerts.
            </span>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
            />
            <div className={styles.checkboxText}>
              <strong>WhatsApp Exam Alerts &amp; Test Updates</strong>
              <span className={styles.helperText}>
                Receive notification when new mock tests and official HP exam dates are released.
              </span>
            </div>
          </label>

          <button type="submit" className={styles.submitBtn} disabled={isSaving}>
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </form>
      </section>

      {/* Card 2: Security & Password */}
      <section className={styles.card} aria-label="Security Settings">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Change Password</h2>
        </div>

        {passwordMsg && (
          <div className={styles.successMsg}>
            <CheckIcon size={16} />
            <span>{passwordMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="current-pw">
              Current Password
            </label>
            <input
              id="current-pw"
              type="password"
              className={styles.input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="new-pw">
              New Password
            </label>
            <input
              id="new-pw"
              type="password"
              className={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="confirm-pw">
              Confirm New Password
            </label>
            <input
              id="confirm-pw"
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            <span>Update Password</span>
          </button>
        </form>
      </section>
    </main>
  );
}
