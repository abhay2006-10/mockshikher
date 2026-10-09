'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu,
  X,
  GraduationCap,
  User,
  LogOut,
  ChevronDown,
  BookOpen,
  BarChart3,
  Bookmark,
  History,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import styles from './Header.module.css';

interface HeaderUser {
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

interface HeaderProps {
  initialUser?: HeaderUser | null;
  user?: HeaderUser | null; // Backwards-compatible prop
}

const userMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/dashboard', label: 'My Performance', icon: TrendingUp },
  { href: '/dashboard/mistakes', label: 'My Mistakes', icon: BookOpen },
  { href: '/dashboard/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/dashboard', label: 'Test History', icon: History },
  { href: '/dashboard', label: 'Profile', icon: User },
];

export default function Header({ initialUser, user: legacyUser }: HeaderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Synchronize user from real server session or client-side NextAuth state
  const user: HeaderUser | null =
    status === 'authenticated' && session?.user
      ? {
          name: session.user.name || 'User',
          email: session.user.email || '',
          role: (session.user as any).role || 'USER',
          image: session.user.image,
        }
      : status === 'unauthenticated'
      ? null
      : initialUser || legacyUser || null;

  // Don't show header on test attempt pages
  if (pathname?.includes('/test/') && pathname?.includes('/attempt')) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/exams', label: 'Exams' },
    { href: '/pricing', label: 'Pricing' },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <GraduationCap size={24} />
          </div>
          <span className={styles.logoText}>Mockshikhar</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${
                pathname === link.href ? styles.navLinkActive : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth / User */}
        <div className={styles.desktopActions}>
          {user ? (
            <div className={styles.userMenu}>
              <button
                className={styles.userMenuTrigger}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-label="User menu"
              >
                <div className={styles.avatar}>
                  {user.image ? (
                    <img src={user.image} alt={user.name} />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <span className={styles.userName}>{user.name}</span>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${
                    userMenuOpen ? styles.chevronOpen : ''
                  }`}
                />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className={styles.menuBackdrop}
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <p className={styles.dropdownName}>{user.name}</p>
                      <p className={styles.dropdownEmail}>{user.email}</p>
                    </div>
                    <div className={styles.dropdownDivider} />
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        className={styles.dropdownItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </Link>
                    ))}
                    {user.role === 'ADMIN' && (
                      <>
                        <div className={styles.dropdownDivider} />
                        <Link
                          href="/admin"
                          className={styles.dropdownItem}
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ShieldCheck size={16} color="#fbbf24" />
                          <span>Admin Control Centre</span>
                        </Link>
                      </>
                    )}
                    <div className={styles.dropdownDivider} />
                    <button
                      className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                      onClick={handleSignOut}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/auth/login" className="btn btn--ghost btn--sm">
                Log In
              </Link>
              <Link href="/auth/signup" className="btn btn--primary btn--sm">
                Sign Up Free
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileNavLink} ${
                  pathname === link.href ? styles.mobileNavLinkActive : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {user ? (
            <div className={styles.mobileUserSection}>
              <div className={styles.mobileUserInfo}>
                <div className={styles.avatar}>
                  {user.image ? (
                    <img src={user.image} alt={user.name} />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <div>
                  <p className={styles.mobileUserName}>{user.name}</p>
                  <p className={styles.mobileUserEmail}>{user.email}</p>
                </div>
              </div>
              <div className={styles.mobileUserLinks}>
                {userMenuItems.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={styles.mobileNavLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className={styles.mobileNavLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShieldCheck size={18} color="#fbbf24" />
                    Admin Control Centre
                  </Link>
                )}
                <button
                  className={`${styles.mobileNavLink} ${styles.dropdownItemDanger}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#ef4444',
                  }}
                  onClick={handleSignOut}
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.mobileAuthButtons}>
              <Link
                href="/auth/login"
                className="btn btn--secondary btn--full"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="btn btn--primary btn--full"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
