'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import styles from './HeroParallaxScene.module.css';

// Coordinates for deodar trees from reference renderVals()
const TREE_COORDS = [
  [40, 46], [72, 34], [100, 58], [134, 40], [168, 52], [205, 30],
  [240, 44], [285, 36], [330, 26], [1110, 30], [1150, 44], [1185, 36],
  [1225, 56], [1262, 40], [1300, 62], [1340, 42], [1378, 54], [1412, 36]
];

export function HeroParallaxScene() {
  const [offsets, setOffsets] = useState({
    sun: 0,
    far: 0,
    mid: 0,
    near: 0,
  });

  const rafRef = useRef<number | null>(null);

  // Generate tree paths once
  const treePath = useMemo(() => {
    return TREE_COORDS.map(([x, h]) => {
      const w = Math.round(h * 0.38);
      const yBase = 404;
      return `M${x} ${yBase - h} L${x + w} ${yBase} L${x - w} ${yBase} Z`;
    }).join(' ');
  }, []);

  useEffect(() => {
    // Disable parallax on touch devices or reduced motion
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    function handleMouseMove(e: MouseEvent) {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        const normX = (e.clientX / window.innerWidth) * 2 - 1; // -1 to 1

        setOffsets({
          sun: normX * 8,
          far: normX * 16,
          mid: normX * 30,
          near: normX * 48,
        });

        rafRef.current = null;
      });
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={styles.heroSceneWrapper} aria-hidden="true">
      {/* Floating Clouds Layer */}
      <div className={styles.cloudLayer}>
        <svg className={styles.cloud1} viewBox="0 0 160 60" fill="rgba(255, 255, 255, 0.7)">
          <path d="M30 50 Q10 50 14 36 Q16 22 34 26 Q40 8 62 14 Q80 0 98 16 Q122 10 126 30 Q146 30 142 46 Q140 52 128 50 Z" />
        </svg>
        <svg className={styles.cloud2} viewBox="0 0 160 60" fill="rgba(255, 255, 255, 0.5)">
          <path d="M30 50 Q10 50 14 36 Q16 22 34 26 Q40 8 62 14 Q80 0 98 16 Q122 10 126 30 Q146 30 142 46 Q140 52 128 50 Z" />
        </svg>
      </div>

      {/* Crossing Birds Layer */}
      <div className={styles.birdsLayer}>
        <svg className={styles.birds} viewBox="0 0 60 24" fill="none" stroke="#4338CA" strokeWidth="2" strokeLinecap="round">
          <path d="M2 12 Q8 6 14 12 Q20 6 26 12 M38 20 Q43 15 48 20 Q53 15 58 20 M28 4 Q32 0 36 4 Q40 0 44 4" />
        </svg>
      </div>

      {/* Sun Layer */}
      <div
        className={styles.layer}
        style={{ transform: `translateX(${offsets.sun}px)` }}
      >
        <svg viewBox="0 0 1440 440" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
          <circle cx="1010" cy="150" r="150" fill="#FFF6E2" />
          <circle cx="1010" cy="150" r="104" fill="#FFE9B8" />
          <circle cx="1010" cy="150" r="70" fill="#FFD98A" />
        </svg>
      </div>

      {/* Far Mountains Layer (with Snow Caps and Shadows) */}
      <div
        className={`${styles.layer} ${styles.farDrift}`}
        style={{ transform: `translateX(${offsets.far}px)` }}
      >
        <svg viewBox="0 0 1440 440" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
          {/* Main Ridge */}
          <path
            d="M0 340 L90 290 L160 310 L260 210 L330 255 L420 190 L520 280 L610 240 L700 160 L790 250 L880 215 L980 130 L1080 240 L1170 200 L1260 260 L1350 210 L1440 250 L1440 440 L0 440 Z"
            fill="#DDE3FF"
          />
          {/* Shaded Mountain Faces */}
          <path
            d="M980 130 L1080 240 L1040 300 L995 300 Z M700 160 L790 250 L760 300 L712 300 Z M420 190 L520 280 L490 320 L430 320 Z M260 210 L330 255 L300 300 L268 300 Z M1350 210 L1440 250 L1440 300 L1360 300 Z"
            fill="#CDD5FB"
          />
          {/* White Snow Caps */}
          <path
            d="M980 130 L945 160 L958 156 L968 166 L980 157 L992 167 L1007 160 Z M700 160 L671 186 L683 181 L692 190 L702 182 L713 191 L726 186 Z M420 190 L390 212 L401 208 L410 216 L420 209 L431 217 L444 212 Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {/* Mid Mountains Layer */}
      <div
        className={`${styles.layer} ${styles.midDrift}`}
        style={{ transform: `translateX(${offsets.mid}px)` }}
      >
        <svg viewBox="0 0 1440 440" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
          <path
            d="M0 360 Q120 290 220 320 T430 285 Q520 265 600 312 T800 292 Q900 252 1000 302 T1220 282 Q1330 272 1440 312 L1440 440 L0 440 Z"
            fill="#BCC5F7"
          />
        </svg>
      </div>

      {/* Near Ridge Layer with Pine / Deodar Trees */}
      <div
        className={styles.layer}
        style={{ transform: `translateX(${offsets.near}px)` }}
      >
        <svg viewBox="0 0 1440 440" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
          <path
            d="M0 395 Q160 345 300 372 T600 360 Q760 330 900 368 T1200 350 Q1330 345 1440 368 L1440 440 L0 440 Z"
            fill="#98A4EF"
          />
          {/* Deodar trees on slopes */}
          <path d={treePath} fill="#6D79D8" />
        </svg>
      </div>

      {/* Ground Wash Curve */}
      <div className={styles.layer}>
        <svg viewBox="0 0 1440 440" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
          <path
            d="M0 420 Q360 392 720 410 T1440 402 L1440 440 L0 440 Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    </div>
  );
}

