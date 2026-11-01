'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  MountainLogo,
  ChevronDown,
  MenuIcon,
  XIcon,
  UserIcon,
  BookOpenIcon,
  BookmarkIcon,
  CreditCardIcon,
  LogOutIcon,
} from './Icons';
import AuthModal, { AuthModalTab } from '@/components/ui/AuthModal';
import { NotificationBell, NotificationDrawer } from '@/components/common/NotificationCenter';
import styles from './Navbar.module.css';

interface NavbarUser {
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

interface NavbarProps {
  initialUser?: NavbarUser | null;
}

export function Navbar({ initialUser }: NavbarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Active user: prioritize client session, fall back to server initialUser
  const [isPreviewUser, setIsPreviewUser] = useState(false);
  const user = session?.user
    ? {
        name: session.user.name || 'Student',
        email: session.user.email || '',
        role: (session.user as any).role || 'USER',
        image: session.user.image,
      }
    : isPreviewUser
    ? { name: 'Abhay Verma', email: 'abhayverm24@gmail.com', role: 'STUDENT' }
    : initialUser;

  const isLoggedIn = !!user;

  // Dropdown & mobile drawer states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [unreadMistakes, setUnreadMistakes] = useState<number>(0);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('login');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // URL query hooks for automated preview screenshots
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('previewUser=true')) {
        setIsPreviewUser(true);
      }
      if (search.includes('dropdown=open')) {
        setIsPreviewUser(true);
        setDropdownOpen(true);
      }
      if (search.includes('drawer=open')) {
        setMobileMenuOpen(true);
      }
    }
  }, [pathname]);

  // Close menus on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Fetch unread mistakes count when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    let isMounted = true;
    fetch('/api/user/dashboard-stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const count = data.unrevisedMistakes ?? data.mistakesCount ?? 0;
        setUnreadMistakes(count);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, pathname]);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const openLogin = () => {
    setAuthModalTab('login');
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const openSignup = () => {
    setAuthModalTab('signup');
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'M';
  };

  const isHome = pathname === '/';
  const isExams = pathname?.startsWith('/exams');
  const isDashboard = pathname === '/dashboard' || (pathname?.startsWith('/dashboard') && !pathname?.startsWith('/dashboard/'));

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.inner}>
          {/* Brand */}
          <Link href="/" className={styles.brand} aria-label="MockShikhar Home">
            <MountainLogo size={34} />
            <span>MockShikhar</span>
          </Link>

          {/* Desktop Navlinks */}
          <nav className={styles.navLinks} aria-label="Main Navigation">
            <Link href="/" className={`${styles.navLink} ${isHome ? styles.active : ''}`}>
              Home
            </Link>
            <Link href="/exams" className={`${styles.navLink} ${isExams ? styles.active : ''}`}>
              Exams
            </Link>
            <Link href="/dashboard" className={`${styles.navLink} ${isDashboard ? styles.active : ''}`}>
              Dashboard
            </Link>
          </nav>

          {/* Right Actions */}
          <div className={styles.actionsRight}>
            {!isLoggedIn ? (
              <>
                <div className={styles.divider} aria-hidden="true" />
                <button
                  type="button"
                  onClick={openLogin}
                  className={styles.loginTextBtn}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={openSignup}
                  className={styles.signupBtn}
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                {/* Bell icon for notifications */}
                <NotificationBell />

                {/* Profile Account Menu */}
                <div className={styles.profileWrap} ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={styles.accountPill}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-label="User Account Menu"
                  >
                    <span className={styles.avatarCircle}>{getInitial(user.name)}</span>
                    <span className={styles.userName}>{user.name}</span>
                    <ChevronDown size={16} />
                  </button>

                  {dropdownOpen && (
                    <div className={styles.dropdown} role="menu">
                      <div className={styles.userCard}>
                        <span className={styles.avatarCircle}>{getInitial(user.name)}</span>
                        <div className={styles.userCardInfo}>
                          <div className={styles.userCardName}>{user.name}</div>
                          <div className={styles.userCardEmail}>{user.email}</div>
                        </div>
                      </div>

                      <div className={styles.dropdownDivider} />

                      <Link href="/dashboard/profile" className={styles.dropdownItem} role="menuitem">
                        <span className={styles.dropdownItemLeft}>
                          <UserIcon size={17} />
                          <span>Profile</span>
                        </span>
                      </Link>

                      <Link href="/dashboard/mistakes" className={styles.dropdownItem} role="menuitem">
                        <span className={styles.dropdownItemLeft}>
                          <BookOpenIcon size={17} />
                          <span>Mistake Book</span>
                        </span>
                        {unreadMistakes > 0 && (
                          <span className={styles.badgeAmber}>{unreadMistakes}</span>
                        )}
                      </Link>

                      <Link href="/dashboard/bookmarks" className={styles.dropdownItem} role="menuitem">
                        <span className={styles.dropdownItemLeft}>
                          <BookmarkIcon size={17} />
                          <span>Bookmarks</span>
                        </span>
                      </Link>

                      <Link href="/dashboard/payments" className={styles.dropdownItem} role="menuitem">
                        <span className={styles.dropdownItemLeft}>
                          <CreditCardIcon size={17} />
                          <span>Payment history</span>
                        </span>
                      </Link>

                      {user.role === 'ADMIN' && (
                        <Link href="/admin" className={styles.dropdownItem} role="menuitem">
                          <span className={styles.dropdownItemLeft}>
                            <UserIcon size={17} />
                            <span>Admin Panel</span>
                          </span>
                        </Link>
                      )}

                      <div className={styles.dropdownDivider} />

                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className={`${styles.dropdownItem} ${styles.logoutItem}`}
                        role="menuitem"
                      >
                        <span className={styles.dropdownItemLeft}>
                          <LogOutIcon size={17} />
                          <span>Log out</span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mobile Controls */}
            <div className={styles.mobileControls}>
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={openSignup}
                  className={styles.signupBtn}
                  style={{ padding: '9px 13px', fontSize: 14 }}
                >
                  Sign up
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={styles.hamburgerBtn}
                aria-label="Toggle navigation drawer"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className={styles.mobileDrawer} role="dialog" aria-modal="true">
            {isLoggedIn && (
              <div className={styles.userCard} style={{ padding: '4px 0 12px', borderBottom: '1px solid var(--border)' }}>
                <span className={styles.avatarCircle}>{getInitial(user.name)}</span>
                <div className={styles.userCardInfo}>
                  <div className={styles.userCardName}>{user.name}</div>
                  <div className={styles.userCardEmail}>{user.email}</div>
                </div>
              </div>
            )}

            <Link href="/" className={`${styles.mobileLink} ${isHome ? styles.active : ''}`}>
              <span>Home</span>
            </Link>
            <Link href="/exams" className={`${styles.mobileLink} ${isExams ? styles.active : ''}`}>
              <span>Exams</span>
            </Link>
            <Link href="/dashboard" className={`${styles.mobileLink} ${isDashboard ? styles.active : ''}`}>
              <span>Dashboard</span>
            </Link>

            {isLoggedIn && (
              <>
                <div className={styles.sectionLabel}>Account</div>
                <Link href="/dashboard/profile" className={styles.mobileLink}>
                  <span>Profile</span>
                </Link>
                <Link href="/dashboard/mistakes" className={styles.mobileLink}>
                  <span>Mistake Book</span>
                  {unreadMistakes > 0 && <span className={styles.badgeAmber}>{unreadMistakes}</span>}
                </Link>
                <Link href="/dashboard/bookmarks" className={styles.mobileLink}>
                  <span>Bookmarks</span>
                </Link>
                <Link href="/dashboard/payments" className={styles.mobileLink}>
                  <span>Payment history</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className={styles.mobileLink}>
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className={`${styles.mobileLink} ${styles.logoutItem}`}
                  style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span>Log out</span>
                </button>
              </>
            )}

            {!isLoggedIn && (
              <div className={styles.mobileAuthButtons}>
                <button
                  type="button"
                  onClick={openLogin}
                  className={styles.loginTextBtn}
                  style={{
                    border: '1.5px solid var(--border)',
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: 12,
                  }}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={openSignup}
                  className={styles.signupBtn}
                  style={{ width: '100%', padding: '13px', borderRadius: 12 }}
                >
                  Sign up free
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Notification Drawer (Logged-in only) */}
      {isLoggedIn && <NotificationDrawer />}
    </>
  );
}
