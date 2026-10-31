'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Chip,
  UnderlineTabs,
  ProgressBar,
  SearchInput,
  SectionHeading,
  HeroParallaxScene,
  getAccuracyColor,
} from '@/components/v2';
import { ArrowRight, SparkleIcon, BellIcon, BookOpenIcon, Check, XIcon } from '@/components/v2/Icons';

export default function DesignPreviewClient() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchVal, setSearchVal] = useState('');

  const tabs = [
    { id: 'all', label: 'All Exams' },
    { id: 'patwari', label: 'HP Patwari' },
    { id: 'police', label: 'HP Police' },
    { id: 'court', label: 'HP High Court' },
    { id: 'tet', label: 'HP TET' },
    { id: 'upcoming', label: 'Upcoming' },
  ];

  return (
    <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Page Header */}
      <div>
        <Chip variant="live">LIVE PREVIEW</Chip>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: 8, color: 'var(--ink)' }}>
          MockShikhar Design System V2 Tokens
        </h1>
        <p style={{ color: 'var(--muted-2)', fontSize: '1.1rem' }}>
          Approved UI Components, Typography, Colors, Radii & Animations
        </p>
      </div>

      {/* Hero Parallax Scene Preview */}
      <section style={{ position: 'relative', height: 360, background: 'var(--sky)', borderRadius: 24, overflow: 'hidden', padding: 32 }}>
        <HeroParallaxScene />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 540 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.15 }}>
            Crack Himachal Govt Exams.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--muted-2)', marginTop: 8 }}>
            Real exam-pattern mock tests with interactive Himalayan parallax scene.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Button variant="primary" shine withArrow>
              Attempt Free Mock
            </Button>
            <Button variant="secondaryOutline">Explore Test Series</Button>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section>
        <SectionHeading title="Buttons & Actions" subtitle="Standard interactive buttons across all pages" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <Button variant="primary" withArrow>
            Primary with Arrow
          </Button>
          <Button variant="primary" shine>
            Primary with Shine
          </Button>
          <Button variant="secondaryOutline">Secondary Outline</Button>
          <Button variant="dark">Dark Button</Button>
          <Button variant="amber">Amber Highlight</Button>
          <Button variant="ghostLink">Ghost Link &rarr;</Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="lg">
            Large Button
          </Button>
        </div>
      </section>

      {/* Chips Section */}
      <section>
        <SectionHeading title="Category & Status Chips" subtitle="Color mapped tokens by exam category" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Chip category="patwari">HP Patwari</Chip>
          <Chip category="police">HP Police</Chip>
          <Chip category="court">High Court</Chip>
          <Chip category="tet">HP TET</Chip>
          <Chip category="upcoming">Upcoming</Chip>
          <Chip variant="live">Live Announcement</Chip>
          <Chip variant="new">New Test</Chip>
        </div>
      </section>

      {/* Underline Tabs */}
      <section>
        <SectionHeading title="Underline Tabs" subtitle="Plain text with 3px primary underline on active tab" />
        <UnderlineTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </section>

      {/* Search Input */}
      <section>
        <SectionHeading title="Search Input" subtitle="Focused search bar with soft glow" />
        <div style={{ maxWidth: 440 }}>
          <SearchInput
            placeholder="Search exam: Patwari, Police, TET..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </div>
      </section>

      {/* Progress Bars & Accuracy */}
      <section>
        <SectionHeading title="Progress Bars & Accuracy Rules" subtitle="≥75% success, 60–74% amber, <60% danger" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[85, 68, 48].map((score) => {
            const acc = getAccuracyColor(score);
            return (
              <Card key={score} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Score: {score}%</span>
                  <span style={{ background: acc.bg, color: acc.text, padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                    {acc.label}
                  </span>
                </div>
                <ProgressBar value={score} fillColor={acc.color} height={8} />
              </Card>
            );
          })}
        </div>
      </section>

      {/* Cards: Surface vs Dark Indigo Panel */}
      <section>
        <SectionHeading title="Card Surfaces" subtitle="White surface card vs Dark indigo mountain panel" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Surface Card */}
          <Card interactive>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip category="patwari">HP PATWARI</Chip>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>100 Q &bull; 120 min</span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 14, color: 'var(--ink)' }}>
              HP Patwari 2026 Test Series
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '14px 0 20px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>₹1</span>
              <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: 14 }}>₹149</span>
              <span style={{ background: 'var(--amber-tint)', color: 'var(--amber-text)', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>
                99% OFF
              </span>
            </div>
            <Button variant="primary" fullWidth>
              Try Free Mock
            </Button>
          </Card>

          {/* Dark Indigo Panel with Mountain Ridge */}
          <Card variant="darkIndigo" withMountainRidge>
            <div style={{ display: 'inline-block', background: 'rgba(252, 211, 77, 0.2)', color: 'var(--amber)', fontSize: 11.5, fontWeight: 800, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              CONTINUE YOUR MOCK
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '12px 0 6px', color: '#FFFFFF' }}>
              HP Patwari &bull; Mock 3
            </h3>
            <p style={{ color: 'var(--on-dark-muted)', fontSize: 14, margin: '0 0 16px' }}>
              42 of 120 answered &bull; 51 min left
            </p>
            <ProgressBar value={35} fillColor="var(--amber)" trackColor="#4B48A8" height={8} />
            <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
              <Button variant="amber">Resume Mock</Button>
              <Button variant="secondaryOutline" style={{ background: 'transparent', color: '#FFFFFF', borderColor: '#7C79D6' }}>
                New Mock
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
