'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  MailIcon,
  PhoneIcon,
  InstagramIcon,
  WhatsAppIcon,
} from '@/components/v2/Icons';
import {
  HeroParallaxScene,
  NoticeBoard,
  ExamSeriesCard,
  UnderlineTabs,
  SearchInput,
} from '@/components/v2';
import AuthModal, { AuthModalTab } from '@/components/ui/AuthModal';
import type { MockExam } from '@/lib/mock-data';
import styles from './page.module.css';

const FREE_MOCK_FALLBACK = '/test/hp-patwari-mock-1/instructions';
const HOMEPAGE_CARD_LIMIT = 4;

type LandingExamItem =
  | { isComingSoon: true; slug: string; name: string; description: string; category: string }
  | { isComingSoon: false; exam: MockExam };

interface HomePageClientProps {
  landingExams: LandingExamItem[];
  publishedExamCount: number;
  showGoogle?: boolean;
}

export default function HomePageClient({
  landingExams,
  publishedExamCount,
}: HomePageClientProps) {
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('signup');
  const [authCallbackUrl, setAuthCallbackUrl] = useState(FREE_MOCK_FALLBACK);

  // Build category tabs
  const tabs = useMemo(() => {
    return [
      { id: 'all', label: 'All' },
      { id: 'patwari', label: 'HP Patwari' },
      { id: 'police', label: 'HP Police' },
      { id: 'court', label: 'HP High Court' },
      { id: 'tet', label: 'HP TET' },
      { id: 'upcoming', label: 'Upcoming' },
    ];
  }, []);

  // Filter exams by tab and search
  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filter = selectedCategory;

    return landingExams.filter((item) => {
      const name = item.isComingSoon ? item.name : item.exam.name;
      const category = item.isComingSoon ? item.category : item.exam.category;
      const slug = item.isComingSoon ? item.slug : item.exam.slug;
      const text = `${name} ${category} ${slug}`.toLowerCase();

      // Search match
      if (q && !text.includes(q)) return false;

      // Tab category filter
      if (filter === 'all') return true;
      if (filter === 'patwari') return text.includes('patwari');
      if (filter === 'police') return text.includes('police');
      if (filter === 'court') {
        return (
          text.includes('court') ||
          text.includes('clerk') ||
          text.includes('judiciary') ||
          text.includes('process-server')
        );
      }
      if (filter === 'tet') return text.includes('tet');
      if (filter === 'upcoming') return item.isComingSoon;

      return true;
    });
  }, [landingExams, searchQuery, selectedCategory]);

  const displayedCards = filteredExams.slice(0, HOMEPAGE_CARD_LIMIT);
  const hasMore = filteredExams.length > HOMEPAGE_CARD_LIMIT;

  const handleGuestFreeMock = (url: string) => {
    setAuthCallbackUrl(url);
    setAuthModalTab('signup');
    setAuthModalOpen(true);
  };

  return (
    <div className={styles.container}>
      {/* 1. HERO SECTION WITH ANIMATED MOUNTAIN SCENE */}
      <section className={styles.heroWrapper} aria-label="Hero Section">
        <HeroParallaxScene />

        <div className={styles.heroPad}>
          <h1 className={styles.heroHeading}>
            Crack Himachal Govt Exams.
            <br />
            <span className={styles.highlight}>
              Practice today, succeed tomorrow.
              <svg
                aria-hidden="true"
                className={styles.underlineSvg}
                viewBox="0 0 600 24"
                preserveAspectRatio="none"
              >
                <path
                  d="M4 16 Q150 2 300 12 T596 8"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className={styles.heroSubtitle}>
            Real exam-pattern mock tests for HP Patwari, Police, High Court and TET, in Hindi and
            English. Timed like the actual paper, with instant scores and answer explanations.
          </p>

          <div className={styles.ctaRow}>
            {isLoggedIn ? (
              <Link href={FREE_MOCK_FALLBACK} className={styles.ctaPrimary}>
                <span>Attempt Free Mock</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => handleGuestFreeMock(FREE_MOCK_FALLBACK)}
                className={styles.ctaPrimary}
              >
                <span>Attempt Free Mock</span>
                <ArrowRight size={18} />
              </button>
            )}

            <a href="#series" className={styles.ctaSecondary}>
              Explore Test Series
            </a>
          </div>
        </div>
      </section>

      {/* 2. OFFICIAL NOTICE BOARD */}
      <NoticeBoard />

      {/* 3. TEST SERIES SECTION */}
      <section id="series" className={styles.seriesSection} aria-label="Test Series Selection">
        <div className={styles.seriesHeader}>
          <div className={styles.seriesTitleGroup}>
            <h2 className={styles.seriesTitle}>Choose your test series</h2>
            <p className={styles.seriesSubtitle}>Pick your exam and start practising.</p>
          </div>
          <Link href="/exams" className={styles.seeAllExamsBtn}>
            <span>See all exams</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Search Input */}
        <div className={styles.searchWrap}>
          <SearchInput
            placeholder="Search exam: Patwari, Police, TET"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search exam series"
          />
        </div>

        {/* Underline Tabs */}
        <UnderlineTabs
          tabs={tabs}
          activeTab={selectedCategory}
          onChange={(tabId) => setSelectedCategory(tabId)}
          ariaLabel="Exam category filter tabs"
        />

        {/* Exam Cards Grid / Mobile Carousel */}
        {displayedCards.length > 0 ? (
          <div className={styles.seriesGrid}>
            {displayedCards.map((item, index) => {
              if (item.isComingSoon) {
                return (
                  <ExamSeriesCard
                    key={item.slug}
                    isComingSoon={true}
                    name={item.name}
                    category={item.category}
                    slug={item.slug}
                    index={index}
                  />
                );
              }

              return (
                <ExamSeriesCard
                  key={item.exam.id || item.exam.slug}
                  isComingSoon={false}
                  name={item.exam.name}
                  category={item.exam.category}
                  slug={item.exam.slug}
                  totalQuestions={item.exam.totalQuestions}
                  durationMinutes={item.exam.durationMinutes}
                  price={item.exam.price}
                  originalPrice={item.exam.originalPrice || 149}
                  freeMockId={`${item.exam.slug}-mock-1`}
                  isLoggedIn={isLoggedIn}
                  onTryFreeMock={handleGuestFreeMock}
                  index={index}
                />
              );
            })}
          </div>
        ) : (
          <p className={styles.noResults}>
            No exam found. Try &quot;Patwari&quot; or &quot;TET&quot;, or{' '}
            <button
              type="button"
              className={styles.noResultsLink}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              see all exams
            </button>
            .
          </p>
        )}

        {/* View All Test Series Button if has more */}
        {hasMore && (
          <div className={styles.moreWrap}>
            <Link href="/exams" className={styles.viewAllMoreBtn}>
              <span>View all {filteredExams.length} test series</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* 4. COMMUNITY BAND */}
      <section className={styles.communitySection} aria-label="Community Channels">
        <div className={styles.communityCard}>
          {/* Background Mountain Ridge */}
          <svg
            aria-hidden="true"
            viewBox="0 0 600 160"
            preserveAspectRatio="none"
            className={styles.mountainRidgeSvg}
          >
            <path
              d="M0 160 L80 90 L150 120 L240 50 L330 115 L420 70 L510 120 L600 80 L600 160 Z"
              fill="#3A378F"
            />
          </svg>

          {/* Left Text */}
          <div className={styles.communityLeft}>
            <h2 className={styles.communityHeading}>
              Notes, updates &amp; syllabus, right on your phone.
            </h2>
            <p className={styles.communitySub}>
              Follow MockShikhar and never miss an HP exam update.
            </p>
          </div>

          {/* Right Action Cards */}
          <div className={styles.communityRight}>
            {/* WhatsApp */}
            <a
              href="https://whatsapp.com/channel/0029Vb4w23c6xCSHhW2ePq1f"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.channelCard}
            >
              <span className={styles.iconBoxWa} aria-hidden="true">
                <WhatsAppIcon size={26} />
              </span>
              <div className={styles.channelTextGroup}>
                <span className={styles.channelTitle}>WhatsApp Channel</span>
                <span className={styles.channelDesc}>
                  Exam alerts, syllabus updates and a daily quiz.
                </span>
                <div className={styles.pillGroup}>
                  <span className={styles.pillWa}>Exam alerts</span>
                  <span className={styles.pillWa}>Syllabus</span>
                  <span className={styles.pillWa}>Daily quiz</span>
                </div>
              </div>
              <span className={`${styles.channelArrow} ${styles.channelArrowWa}`} aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/mockshikhar?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className={styles.channelCard}
            >
              <span className={styles.iconBoxIg} aria-hidden="true">
                <InstagramIcon size={26} />
              </span>
              <div className={styles.channelTextGroup}>
                <span className={styles.channelTitle}>Instagram</span>
                <span className={styles.channelDesc}>
                  HP GK notes, current affairs and exam tips.
                </span>
                <div className={styles.pillGroup}>
                  <span className={styles.pillIg}>Study notes</span>
                  <span className={styles.pillIg}>Current affairs</span>
                  <span className={styles.pillIg}>Exam tips</span>
                </div>
              </div>
              <span className={`${styles.channelArrow} ${styles.channelArrowIg}`} aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* 5. NEED HELP SECTION */}
      <section className={styles.helpSection} aria-label="Customer Support">
        <div className={styles.helpTitleGroup}>
          <h2 className={styles.helpHeading}>Need help?</h2>
          <p className={styles.helpSub}>Payment, login or test issue? Reach us directly.</p>
        </div>

        <div className={styles.helpGrid}>
          {/* Email */}
          <a href="mailto:mockshikhar@gmail.com" className={styles.helpCard}>
            <span className={`${styles.helpIconBox} ${styles.helpIconEmail}`} aria-hidden="true">
              <MailIcon size={20} />
            </span>
            <div className={styles.helpInfo}>
              <span className={styles.helpLabel}>Email</span>
              <span className={styles.helpValue}>mockshikhar@gmail.com</span>
            </div>
          </a>

          {/* Call / WA 1 */}
          <a href="https://wa.me/917876725758" target="_blank" rel="noopener noreferrer" className={styles.helpCard}>
            <span className={`${styles.helpIconBox} ${styles.helpIconPhone}`} aria-hidden="true">
              <PhoneIcon size={20} />
            </span>
            <div className={styles.helpInfo}>
              <span className={styles.helpLabel}>Call / WhatsApp</span>
              <span className={styles.helpValue}>+91 78767 25758</span>
            </div>
          </a>

          {/* Call / WA 2 */}
          <a href="https://wa.me/918262910464" target="_blank" rel="noopener noreferrer" className={styles.helpCard}>
            <span className={`${styles.helpIconBox} ${styles.helpIconPhone}`} aria-hidden="true">
              <PhoneIcon size={20} />
            </span>
            <div className={styles.helpInfo}>
              <span className={styles.helpLabel}>Call / WhatsApp</span>
              <span className={styles.helpValue}>+91 82629 10464</span>
            </div>
          </a>

          {/* Instagram DM */}
          <a
            href="https://www.instagram.com/mockshikhar?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            className={styles.helpCard}
          >
            <span className={`${styles.helpIconBox} ${styles.helpIconIg}`} aria-hidden="true">
              <InstagramIcon size={20} />
            </span>
            <div className={styles.helpInfo}>
              <span className={styles.helpLabel}>Instagram</span>
              <span className={styles.helpValue}>Message us</span>
            </div>
          </a>
        </div>
      </section>

      {/* Auth Modal for Guests */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        callbackUrl={authCallbackUrl}
      />
    </div>
  );
}
