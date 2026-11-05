'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  MountainLogo,
  ChevronDown,
  MenuIcon,
  UserIcon,
  BookOpenIcon,
  BookmarkIcon,
  CreditCardIcon,
  LogOutIcon,
  HomeIcon,
  GridIcon,
  WhatsAppIcon,
  InstagramIcon,
} from './Icons';
import AuthModal, { AuthModalTab } from '@/components/ui/AuthModal';
import { NotificationBell, NotificationDrawer } from '@/components/common/NotificationCenter';
import styles from './Navbar.module.css';
import { WHATSAPP_CHANNEL_URL, INSTAGRAM_URL, INSTAGRAM_HANDLE } from '@/config/social';

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
  const { data: session } = useSession();

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

  // Dropdown (desktop) & bottom sheet (mobile) states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const [unreadMistakes, setUnreadMistakes] = useState<number>(0);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('login');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // URL query hooks for automated preview screenshots & close menus on route change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      const isPreview = search.includes('previewUser=true');
      const shouldOpenDropdown = search.includes('dropdown=open');
      const shouldOpenMenu =
        search.includes('drawer=open') ||
        search.includes('menu=open') ||
        search.includes('sheet=open');

      if (isPreview) {
        setIsPreviewUser(true);
      }
      setDropdownOpen(shouldOpenDropdown);
      setMenuSheetOpen(shouldOpenMenu);
    }
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

  // Close dropdown or sheet on outside click or Esc
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setMenuSheetOpen(false);
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
    setMenuSheetOpen(false);
  };

  const openSignup = () => {
    setAuthModalTab('signup');
    setAuthModalOpen(true);
    setMenuSheetOpen(false);
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'M';
  };

  const isHome = pathname === '/';
  const isExams = pathname?.startsWith('/exams');
  const isDashboard =
    pathname === '/dashboard' ||
    (pathname?.startsWith('/dashboard') && !pathname?.startsWith('/dashboard/'));

  // Hide bottom bar on /test/* and /admin/* routes
  const hideBottomBar = pathname?.startsWith('/test/') || pathname?.startsWith('/admin');

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
            <Link
              href="/"
              className={`${styles.navLink} ${isHome ? styles.active : ''}`}
              aria-current={isHome ? 'page' : undefined}
            >
              Home
            </Link>
            <Link
              href="/exams"
              className={`${styles.navLink} ${isExams ? styles.active : ''}`}
              aria-current={isExams ? 'page' : undefined}
            >
              Exams
            </Link>
            <Link
              href="/dashboard"
              className={`${styles.navLink} ${isDashboard ? styles.active : ''}`}
              aria-current={isDashboard ? 'page' : undefined}
            >
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

                {/* Profile Account Menu (Desktop) */}
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

            {/* Mobile Top Header Controls (No hamburger!) */}
            <div className={styles.mobileControls}>
              {!isLoggedIn ? (
                <button
                  type="button"
                  onClick={openSignup}
                  className={styles.mobileSignupBtn}
                >
                  Sign up free
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMenuSheetOpen(true)}
                  className={styles.mobileAvatarBtn}
                  aria-label="Open profile menu"
                >
                  <span className={styles.avatarCircle}>{getInitial(user.name)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (≤ 720px only, hidden on /test/* and /admin/*) */}
      {!hideBottomBar && (
        <nav className={styles.bottomNav} aria-label="Mobile Bottom Navigation">
          <Link
            href="/"
            className={`${styles.bottomNavItem} ${isHome ? styles.bottomNavItemActive : ''}`}
            aria-current={isHome ? 'page' : undefined}
          >
            {isHome && <span className={styles.bottomNavIndicator} />}
            <HomeIcon size={21} />
            <span>Home</span>
          </Link>

          <Link
            href="/exams"
            className={`${styles.bottomNavItem} ${isExams ? styles.bottomNavItemActive : ''}`}
            aria-current={isExams ? 'page' : undefined}
          >
            {isExams && <span className={styles.bottomNavIndicator} />}
            <BookOpenIcon size={21} />
            <span>Exams</span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuSheetOpen(true)}
            className={`${styles.bottomNavItem} ${menuSheetOpen ? styles.bottomNavItemActive : ''}`}
            aria-expanded={menuSheetOpen}
            aria-label="Open Menu"
          >
            {menuSheetOpen && <span className={styles.bottomNavIndicator} />}
            <MenuIcon size={21} />
            <span>Menu</span>
          </button>
        </nav>
      )}

      {/* Mobile Bottom Sheet Menu (opened by Menu tab or mobile avatar) */}
      {!hideBottomBar && menuSheetOpen && (
        <>
          <div
            className={styles.bottomSheetScrim}
            onClick={() => setMenuSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            className={styles.bottomSheet}
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigation"
          >
            <div className={styles.sheetHandle} />

            {isLoggedIn ? (
              <>
                <div className={styles.sheetUserCard}>
                  <span className={styles.avatarCircle} style={{ width: 42, height: 42, fontSize: 16 }}>
                    {getInitial(user.name)}
                  </span>
                  <div className={styles.sheetUserInfo}>
                    <div className={styles.sheetUserName}>{user.name}</div>
                    <div className={styles.sheetUserEmail}>{user.email}</div>
                  </div>
                </div>

                <div className={styles.sheetDivider} />

                <Link
                  href="/dashboard"
                  onClick={() => setMenuSheetOpen(false)}
                  className={styles.sheetLink}
                >
                  <span className={styles.sheetLinkInner}>
                    <GridIcon size={18} />
                    <span>Dashboard</span>
                  </span>
                </Link>

                <Link
                  href="/dashboard/mistakes"
                  onClick={() => setMenuSheetOpen(false)}
                  className={styles.sheetLink}
                >
                  <span className={styles.sheetLinkInner}>
                    <BookOpenIcon size={18} />
                    <span>Mistake Book</span>
                  </span>
                  {unreadMistakes > 0 && (
                    <span className={styles.badgeAmber}>{unreadMistakes}</span>
                  )}
                </Link>

                <Link
                  href="/dashboard/bookmarks"
                  onClick={() => setMenuSheetOpen(false)}
                  className={styles.sheetLink}
                >
                  <span className={styles.sheetLinkInner}>
                    <BookmarkIcon size={18} />
                    <span>Bookmarks</span>
                  </span>
                </Link>

                <Link
                  href="/dashboard/payments"
                  onClick={() => setMenuSheetOpen(false)}
                  className={styles.sheetLink}
                >
                  <span className={styles.sheetLinkInner}>
                    <CreditCardIcon size={18} />
                    <span>Payment history</span>
                  </span>
                </Link>

                <Link
                  href="/dashboard/profile"
                  onClick={() => setMenuSheetOpen(false)}
                  className={styles.sheetLink}
                >
                  <span className={styles.sheetLinkInner}>
                    <UserIcon size={18} />
                    <span>Profile</span>
                  </span>
                </Link>

                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuSheetOpen(false)}
                    className={styles.sheetLink}
                  >
                    <span className={styles.sheetLinkInner}>
                      <UserIcon size={18} />
                      <span>Admin Panel</span>
                    </span>
                  </Link>
                )}

                <div className={styles.sheetDivider} />

                <button
                  type="button"
                  onClick={() => {
                    setMenuSheetOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className={`${styles.sheetLink} ${styles.sheetLogout}`}
                >
                  <span className={styles.sheetLinkInner}>
                    <LogOutIcon size={18} />
                    <span>Log out</span>
                  </span>
                </button>

                <div className={styles.sheetDivider} />

                <div className={styles.sheetSocialRow}>
                  <a
                    href={WHATSAPP_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sheetSocialBtn}
                    aria-label="Join MockShikhar on WhatsApp Channel"
                  >
                    <WhatsAppIcon size={16} />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sheetSocialBtn}
                    aria-label="Follow MockShikhar on Instagram"
                  >
                    <InstagramIcon size={16} />
                    <span>Instagram</span>
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className={styles.sheetAuthButtons}>
                  <button
                    type="button"
                    onClick={openLogin}
                    className={styles.sheetLoginBtn}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={openSignup}
                    className={styles.sheetSignupBtn}
                  >
                    Sign up free
                  </button>
                </div>

                <div className={styles.sheetDivider} />

                <div className={styles.sheetSocialRow}>
                  <a
                    href={WHATSAPP_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sheetSocialBtn}
                    aria-label="Join MockShikhar on WhatsApp Channel"
                  >
                    <WhatsAppIcon size={16} />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sheetSocialBtn}
                    aria-label="Follow MockShikhar on Instagram"
                  >
                    <InstagramIcon size={16} />
                    <span>Instagram</span>
                  </a>
                </div>

                <div className={styles.sheetDivider} />

                <div className={styles.sheetLegalLinks}>
                  <Link
                    href="/privacy"
                    onClick={() => setMenuSheetOpen(false)}
                    className={styles.sheetLegalLink}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    onClick={() => setMenuSheetOpen(false)}
                    className={styles.sheetLegalLink}
                  >
                    Terms of Service
                  </Link>
                  <Link
                    href="/refund-policy"
                    onClick={() => setMenuSheetOpen(false)}
                    className={styles.sheetLegalLink}
                  >
                    Refund Policy
                  </Link>
                </div>
              </>
            )}
          </div>
        </>
      )}

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
