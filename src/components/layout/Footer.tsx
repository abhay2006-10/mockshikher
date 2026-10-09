import Link from 'next/link';
import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';
import styles from './Footer.module.css';

const footerLinks = {
  platform: [
    { href: '/exams', label: 'Browse Exams' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/auth/signup', label: 'Sign Up Free' },
  ],
  support: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/refund-policy', label: 'Refund Policy' },
  ],
  exams: [
    { href: '/exams/hp-police', label: 'HP Police' },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logo}>
              <div className={styles.logoIcon}>
                <GraduationCap size={20} />
              </div>
              <span className={styles.logoText}>Mockshikhar</span>
            </Link>
            <p className={styles.brandDesc}>
              India&apos;s affordable mock test platform for competitive exam aspirants.
              Practice with realistic full-length mocks, get detailed analysis, and
              improve your score.
            </p>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <Mail size={14} />
                <span>support@mockshikhar.com</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Platform</h4>
            <ul className={styles.linkList}>
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Exams */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Popular Exams</h4>
            <ul className={styles.linkList}>
              {footerLinks.exams.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Legal</h4>
            <ul className={styles.linkList}>
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {currentYear} Mockshikhar. All rights reserved.
          </p>
          <p className={styles.madeWith}>
            Made with ❤️ for exam aspirants
          </p>
        </div>
      </div>
    </footer>
  );
}
