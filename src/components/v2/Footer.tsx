import React from 'react';
import Link from 'next/link';
import { MountainLogo } from './Icons';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.topGrid}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <div className={styles.brandTitle}>
              <MountainLogo size={30} />
              <span>MockShikhar</span>
            </div>
            <p className={styles.brandDesc}>
              Himachal Pradesh State Examination Preparation. Ad-free, HP-focused mock tests with performance analysis.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <div className={styles.colTitle}>Platform</div>
            <div className={styles.linkList}>
              <Link href="/exams" className={styles.linkItem}>
                All Test Series
              </Link>
              <Link href="/exams/hp-patwari" className={styles.linkItem}>
                HP Patwari 2026
              </Link>
              <Link href="/exams/hp-police-constable" className={styles.linkItem}>
                HP Police Constable
              </Link>
              <Link href="/exams/hp-high-court" className={styles.linkItem}>
                HP High Court / Judiciary
              </Link>
              <Link href="/exams/hp-tet" className={styles.linkItem}>
                HP TET Series
              </Link>
              <Link href="/dashboard" className={styles.linkItem}>
                Student Dashboard
              </Link>
            </div>
          </div>

          {/* Legal & Support Links */}
          <div>
            <div className={styles.colTitle}>Legal & Support</div>
            <div className={styles.linkList}>
              <Link href="/privacy" className={styles.linkItem}>
                Privacy Policy
              </Link>
              <Link href="/terms" className={styles.linkItem}>
                Terms of Service
              </Link>
              <Link href="/refund-policy" className={styles.linkItem}>
                Refund Policy
              </Link>
              <a href="mailto:support@mockshikhar.com" className={styles.linkItem}>
                support@mockshikhar.com
              </a>
              <a href="https://whatsapp.com/channel/0029Va5I0zx0VycNW93eqO2P" target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                WhatsApp Channel
              </a>
              <a href="https://www.instagram.com/mockshikhar" target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                Instagram (@mockshikhar)
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className={styles.bottomBar}>
          <div>
            &copy; {currentYear} MockShikhar. All rights reserved. Made for Himachal Pradesh aspirants.
          </div>
          <div>Bilingual &bull; Instant Analysis &bull; Real Exam Pattern</div>
        </div>
      </div>
    </footer>
  );
}
