import Link from 'next/link';
import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';
import styles from './Footer.module.css';

const footerLinks = {
  platform: [
    { href: '/exams', label: 'Browse Exams' },
    { href: '/auth/signup', label: 'Sign Up Free' },
  ],
  support: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/refund-policy', label: 'Refund Policy' },
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
              <a href="mailto:mockshikhar@gmail.com" className={styles.contactItem} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Mail size={14} />
                <span>mockshikhar@gmail.com</span>
              </a>
              <a href="tel:+917876725758" className={styles.contactItem} style={{ textDecoration: 'none', color: 'inherit', marginTop: '0.35rem' }}>
                <Phone size={14} />
                <span>+91 78767 25758</span>
              </a>
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

          {/* Legal & Support */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Legal &amp; Support</h4>
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
