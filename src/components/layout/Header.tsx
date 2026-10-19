'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  User,
  LogOut,
  ChevronDown,
  BookOpen,
  BarChart3,
  Bookmark,
  History,
  TrendingUp,
  ShieldCheck,
  Home,
  Flame,
  MoreHorizontal,
  CreditCard,
  X,
} from 'lucide-react';
import AuthModal, { AuthModalTab } from '@/components/ui/AuthModal';
import styles from './Header.module.css';

interface HeaderUser {
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

interface HeaderProps {
  initialUser?: HeaderUser | null;
  user?: HeaderUser | null;
}

// User menu items for desktop dropdown
const desktopMenuItems = [
  { href: '/dashboard', label: 'My Performance', icon: TrendingUp },
  { href: '/dashboard/mistakes', label: 'My Mistakes', icon: Flame },
  { href: '/dashboard/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/dashboard/payments', label: 'Payment History', icon: CreditCard },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const emptySubscribe = () => () => {};

export default function Header({ initialUser, user: legacyUser }: HeaderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // Auth modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<AuthModalTab>('login');

  // Lock body scroll and listen for Escape when bottom sheet is open
  useEffect(() => {
    if (!moreSheetOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreSheetOpen(false);
    };
    document.addEventListener('keydown', handleEsc);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [moreSheetOpen]);

  const user: HeaderUser | null =
    status === 'authenticated' && session?.user
      ? {
          name: session.user.name || 'User',
          email: session.user.email || '',
          role: (session.user as { role?: string })?.role || 'USER',
          image: session.user.image,
        }
      : status === 'unauthenticated'
      ? null
      : initialUser || legacyUser || null;

  // Pages where top header is completely hidden (e.g. test attempt)
  const isAttemptPage = pathname?.includes('/test/') && pathname?.includes('/attempt');
  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname?.startsWith('/auth');

  // Bottom bar should not show on test attempt, admin, or auth pages
  const hideBottomBar = isAttemptPage || isAdminPage || isAuthPage;

  if (isAttemptPage) {
    return null;
  }

  // Desktop navigation links
  const desktopNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/exams', label: 'Exams' },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMoreSheetOpen(false);
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error('SignOut error:', e);
    }
    window.location.href = '/';
  };

  const openLogin = () => {
    setModalTab('login');
    setModalOpen(true);
  };

  const openSignup = () => {
    setModalTab('signup');
    setModalOpen(true);
  };



  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="MockShikhar Home">
            <Image
              src="/logo.png"
              alt="MockShikhar - Practice • Analyze • Improve • Succeed"
              width={184}
              height={38}
              priority
              className={styles.logoImage}
            />
          </Link>

          {/* Desktop Navigation (md+) */}
          <nav className={styles.desktopNav}>
            {desktopNavLinks.map((link) => (
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

          {/* Desktop Auth / User Menu */}
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
                      {desktopMenuItems.map((item) => (
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

                      {/* Admin Link only visible to ADMIN role */}
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
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={openLogin}
                  type="button"
                >
                  Log In
                </button>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={openSignup}
                  type="button"
                >
                  Sign Up Free
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right: Guest shows Log In button; Logged in shows Avatar to open sheet */}
          <div className={styles.mobileRight}>
            {!user ? (
              <button
                className={styles.mobileLoginBtn}
                onClick={openLogin}
                type="button"
              >
                Log In
              </button>
            ) : (
              <button
                className={styles.mobileAvatarBtn}
                onClick={() => setMoreSheetOpen(true)}
                aria-label="User navigation menu"
                type="button"
              >
                <div className={styles.avatar}>
                  {user.image ? (
                    <img src={user.image} alt={user.name} />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Spacer so page content is not hidden behind the fixed bottom bar */}
      {!hideBottomBar && (
        <div className={styles.bottomBarSpacer} aria-hidden="true" />
      )}

      {/* React Portal to document.body for bottom bar and bottom sheet */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <>
          {/* Phone Fixed Bottom Tab Bar */}
          {!hideBottomBar && (
            <nav className={styles.bottomTabBar} aria-label="Mobile Navigation">
              {user ? (
                <>
                  {/* 1. Home */}
                  <Link
                    href="/"
                    className={`${styles.bottomTabItem} ${
                      pathname === '/' ? styles.bottomTabItemActive : ''
                    }`}
                  >
                    <Home className={styles.bottomTabIcon} />
                    <span>Home</span>
                  </Link>

                  {/* 2. Exams */}
                  <Link
                    href="/exams"
                    className={`${styles.bottomTabItem} ${
                      pathname?.startsWith('/exams') ? styles.bottomTabItemActive : ''
                    }`}
                  >
                    <BookOpen className={styles.bottomTabIcon} />
                    <span>Exams</span>
                  </Link>

                  {/* 3. Dashboard */}
                  <Link
                    href="/dashboard"
                    className={`${styles.bottomTabItem} ${
                      pathname === '/dashboard' ? styles.bottomTabItemActive : ''
                    }`}
                  >
                    <BarChart3 className={styles.bottomTabIcon} />
                    <span>Dashboard</span>
                  </Link>

                  {/* 4. Mistakes */}
                  <Link
                    href="/dashboard/mistakes"
                    className={`${styles.bottomTabItem} ${
                      pathname?.startsWith('/dashboard/mistakes')
                        ? styles.bottomTabItemActive
                        : ''
                    }`}
                  >
                    <Flame className={styles.bottomTabIcon} />
                    <span>Mistakes</span>
                  </Link>

                  {/* 5. More */}
                  <button
                    type="button"
                    className={`${styles.bottomTabItem} ${
                      moreSheetOpen ||
                      pathname?.startsWith('/dashboard/bookmarks') ||
                      pathname?.startsWith('/dashboard/profile')
                        ? styles.bottomTabItemActive
                        : ''
                    }`}
                    onClick={() => setMoreSheetOpen(true)}
                    aria-label="More navigation options"
                  >
                    <MoreHorizontal className={styles.bottomTabIcon} />
                    <span>More</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Guests: Home and Exams */}
                  <Link
                    href="/"
                    className={`${styles.bottomTabItem} ${
                      pathname === '/' ? styles.bottomTabItemActive : ''
                    }`}
                  >
                    <Home className={styles.bottomTabIcon} />
                    <span>Home</span>
                  </Link>

                  <Link
                    href="/exams"
                    className={`${styles.bottomTabItem} ${
                      pathname?.startsWith('/exams') ? styles.bottomTabItemActive : ''
                    }`}
                  >
                    <BookOpen className={styles.bottomTabIcon} />
                    <span>Exams</span>
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Unified Bottom Sheet Modal for Mobile (opened from "More" tab or top Avatar) */}
          {moreSheetOpen && user && (
            <>
              <div
                className={styles.moreBackdrop}
                onClick={() => setMoreSheetOpen(false)}
                aria-hidden="true"
              />
              <div
                className={styles.moreSheet}
                role="dialog"
                aria-modal="true"
                aria-label="User navigation menu"
              >
                <div className={styles.sheetHandle} />

                {/* Fixed Header */}
                <div className={styles.sheetHeader}>
                  <div className={styles.sheetUserInfo}>
                    <span className={styles.sheetUserName}>{user.name}</span>
                    <span className={styles.sheetUserEmail}>{user.email}</span>
                  </div>
                  <button
                    className={styles.sheetCloseBtn}
                    onClick={() => setMoreSheetOpen(false)}
                    aria-label="Close"
                    type="button"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Scrollable list below header with 52px rows */}
                <div className={styles.sheetItems}>
                  {/* 1. My Performance */}
                  <Link
                    href="/dashboard"
                    className={styles.sheetItem}
                    onClick={() => setMoreSheetOpen(false)}
                  >
                    <TrendingUp size={20} />
                    <span>My Performance</span>
                  </Link>

                  {/* 2. My Mistakes */}
                  <Link
                    href="/dashboard/mistakes"
                    className={styles.sheetItem}
                    onClick={() => setMoreSheetOpen(false)}
                  >
                    <Flame size={20} />
                    <span>My Mistakes</span>
                  </Link>

                  {/* 3. Bookmarks */}
                  <Link
                    href="/dashboard/bookmarks"
                    className={styles.sheetItem}
                    onClick={() => setMoreSheetOpen(false)}
                  >
                    <Bookmark size={20} />
                    <span>Bookmarks</span>
                  </Link>

                  {/* 4. Test History */}
                  <Link
                    href="/dashboard#history"
                    className={styles.sheetItem}
                    onClick={() => setMoreSheetOpen(false)}
                  >
                    <History size={20} />
                    <span>Test History</span>
                  </Link>

                  {/* 5. Payment History */}
                  <Link
                    href="/dashboard/payments"
                    className={styles.sheetItem}
                    onClick={() => setMoreSheetOpen(false)}
                  >
                    <CreditCard size={20} />
                    <span>Payment History</span>
                  </Link>

                  {/* 6. Profile */}
                  <Link
                    href="/dashboard/profile"
                    className={styles.sheetItem}
                    onClick={() => setMoreSheetOpen(false)}
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>

                  {/* 6. Admin Control Centre (ADMIN only) */}
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className={styles.sheetItem}
                      onClick={() => setMoreSheetOpen(false)}
                    >
                      <ShieldCheck size={20} color="#fbbf24" />
                      <span>Admin Control Centre</span>
                    </Link>
                  )}

                  {/* 7. Sign Out */}
                  <button
                    type="button"
                    className={`${styles.sheetItem} ${styles.sheetItemDanger}`}
                    onClick={handleSignOut}
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </>,
        document.body
      )}

      {/* Auth Modal for Login/Signup */}
      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
        callbackUrl="/dashboard"
      />
    </>
  );
}
