import React from 'react';
import Link from 'next/link';
import { MountainLogo, WhatsAppIcon, InstagramIcon } from './Icons';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Row 1: Brand (Left) · Legal & Contact Links (Center) · Social Icon Buttons (Right) */}
        <div className={styles.mainRow}>
          <Link href="/" className={styles.brand} aria-label="MockShikhar Home">
            <MountainLogo size={24} />
            <span className={styles.brandName}>MockShikhar</span>
          </Link>

          <nav className={styles.navLinks} aria-label="Footer Navigation">
            <Link href="/privacy" className={styles.navLink}>
              Privacy Policy
            </Link>
            <span className={styles.linkDot} aria-hidden="true">&bull;</span>
            <Link href="/terms" className={styles.navLink}>
              Terms
            </Link>
            <span className={styles.linkDot} aria-hidden="true">&bull;</span>
            <Link href="/refund-policy" className={styles.navLink}>
              Refund Policy
            </Link>
            <span className={styles.linkDot} aria-hidden="true">&bull;</span>
            <a href="mailto:mockshikhar@gmail.com" className={styles.navLink}>
              Contact
            </a>
          </nav>

          <div className={styles.socialIcons}>
            <a
              href="https://whatsapp.com/channel/0029Va5I0zx0VycNW93eqO2P"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="Join MockShikhar WhatsApp Channel"
              title="Join WhatsApp Channel"
            >
              <WhatsAppIcon size={18} />
            </a>
            <a
              href="https://www.instagram.com/mockshikhar"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="Follow MockShikhar on Instagram"
              title="Follow on Instagram"
            >
              <InstagramIcon size={18} />
            </a>
          </div>
        </div>

        {/* Row 2: Compact Centered Muted Copyright */}
        <div className={styles.bottomRow}>
          <p className={styles.copyright}>
            &copy; {currentYear} MockShikhar. Made for Himachal Pradesh aspirants.
          </p>
        </div>
      </div>
    </footer>
  );
}
