'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllSections } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { SectionGrid } from '@/components/SectionGrid';
import type { Section } from '@/lib/db';

// Feature flag: temporarily disable room/competition features
const IS_ROOM_FEATURE_ENABLED = false;

// Background patterns - 5 math-themed patterns per design.md
const PATTERN_DATA = [
  // 1. Graph Paper - fine grid lines
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect fill="%23F5F7FB" width="20" height="20"/><path stroke="%23D4D8E0" d="M0 0h20v20" stroke-width="0.5" fill="none"/><path stroke="%23D4D8E0" d="M0 0v20h20v20" stroke-width="0.5" fill="none"/></svg>',
  // 2. Dot Grid - evenly spaced dots
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="2" cy="2" r="1.5" fill="%23D4D8E0"/></svg>',
  // 3. Coordinate Plane - axes with grid
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23F5F7FB" width="40" height="40"/><path stroke="%23D4D8E0" d="M20 0v40M0 20h40" stroke-width="1"/><circle cx="20" cy="20" r="2" fill="%23D4D8E0"/></svg>',
  // 4. Number Line - horizontal with marks
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23F5F7FB" width="40" height="40"/><path stroke="%23D4D8E0" d="M0 20h40" stroke-width="1"/><line x1="0" y1="16" x2="0" y2="24" stroke="%23D4D8E0" stroke-width="1"/><line x1="20" y1="16" x2="20" y2="24" stroke="%23D4D8E0" stroke-width="1"/><line x1="40" y1="16" x2="40" y2="24" stroke="%23D4D8E0" stroke-width="1"/></svg>',
  // 5. Geometric Shapes - circles and triangles
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect fill="%23F5F7FB" width="50" height="50"/><circle cx="10" cy="10" r="3" fill="none" stroke="%23D4D8E0" stroke-width="1"/><circle cx="40" cy="40" r="4" fill="none" stroke="%23D4D8E0" stroke-width="1"/><polygon points="25,5 30,20 20,20" fill="none" stroke="%23D4D8E0" stroke-width="1"/></svg>',
];

const HERO_HEADLINE = 'From your first sprout to a legend of numbers.';
const HERO_SUBHEADING = 'Choose your challenge level and master mathematics at your own pace.';

export default function Home() {
  const [sections, setSections] = useState<Section[]>([]);
  const [patternIndex, setPatternIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ totalCertificates: 0, activeRooms: 0, weeklyPractice: 0 });

  useEffect(() => {
    setMounted(true);
    getAllSections().then(setSections);

    // Cycle background patterns every 4.5 seconds, respecting prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      const interval = setInterval(() => {
        setPatternIndex((prev) => {
          const next = (prev + 1) % PATTERN_DATA.length;
          return next;
        });
      }, 4500);

      return () => clearInterval(interval);
    }
  }, []);

  // Load live stats from Supabase
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Total certificates
        const { count: certCount } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true });

        // Active rooms
        const { count: activeCount } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Weekly practice sessions
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: weeklyCount } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('mode', 'practice')
          .gte('date_issued', weekAgo);

        setStats({
          totalCertificates: certCount || 0,
          activeRooms: activeCount || 0,
          weeklyPractice: weeklyCount || 0,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };

    loadStats();

    // Subscribe to real-time updates for active rooms
    const subscription = supabase
      .channel('rooms_active')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: 'status=eq.active',
        },
        () => loadStats()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);



  if (!mounted) return null;

  const currentPatternUrl = `url('${PATTERN_DATA[patternIndex]}')`;

  return (
    <div className="min-h-screen bg-white">
      {/* Shared Header */}
      <Header />

      {/* Hero Section with Dynamic Background Pattern */}
      <section 
        className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center transition-all duration-1000"
        style={{
          backgroundImage: currentPatternUrl,
          backgroundRepeat: 'repeat',
        }}
      >
        {/* Background gradient overlay - positioned behind text */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none z-0" />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto">
          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-ink-navy mb-3 sm:mb-4 animate-fade-in leading-tight">
            {HERO_HEADLINE}
          </h1>

          {/* Hero Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-ink-navy font-body mb-8 sm:mb-12 opacity-80 animate-fade-in" style={{ animationDelay: '100ms' }}>
            {HERO_SUBHEADING}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Link
              href="/practice"
              className="px-6 sm:px-8 py-3 bg-leaf-green text-white font-display font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all duration-200 focus-ring text-sm sm:text-base"
            >
              Start practicing
            </Link>
            {IS_ROOM_FEATURE_ENABLED ? (
              <Link
                href="/join"
                className="px-6 sm:px-8 py-3 border-2 border-ink-navy text-ink-navy font-display font-bold rounded-lg hover:bg-ink-navy hover:text-white active:scale-95 transition-all duration-200 focus-ring text-sm sm:text-base"
              >
                Enter competition room
              </Link>
            ) : (
              <div
                className="relative group px-6 sm:px-8 py-3 border-2 border-ink-navy text-ink-navy font-display font-bold rounded-lg text-sm sm:text-base cursor-not-allowed"
                style={{ opacity: 0.45, filter: 'grayscale(60%)', pointerEvents: 'none' }}
                tabIndex={-1}
                role="status"
                aria-label="Enter competition room - coming soon"
              >
                Enter competition room
                {/* Tooltip on hover */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-ink-navy text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  Coming soon
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live Stats Strip */}
      <section className="bg-graph-paper border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex justify-center gap-8 sm:gap-16 md:gap-24">
            {/* Total Certificates */}
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-mono font-bold text-ink-navy mb-1">
                {stats.totalCertificates.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm font-body text-ink-navy opacity-70">
                Certificates issued
              </p>
            </div>

            {/* Weekly Practice */}
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-mono font-bold text-ink-navy mb-1">
                {stats.weeklyPractice.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm font-body text-ink-navy opacity-70">
                Practice sessions this week
              </p>
            </div>

            {/* Active Rooms */}
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-mono font-bold text-ink-navy mb-1">
                {stats.activeRooms.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm font-body text-ink-navy opacity-70">
                Rooms currently active
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Grid with Scroll-Reveal */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 bg-white">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-ink-navy mb-2 sm:mb-4 text-center">
          14 levels of challenge
        </h2>
        <p className="text-center text-sm sm:text-base text-ink-navy font-body mb-8 sm:mb-12 opacity-80">
          Find your starting point across 14 classes and climb to mastery
        </p>

        <SectionGrid sections={sections} linkPrefix="/practice" />
      </section>

      {/* Footer */}
      <footer className="bg-ink-navy text-white py-6 sm:py-8 text-center text-xs sm:text-sm font-body opacity-75">
        <p>© 2026 Seat of Wisdom Math Olympiad. All rights reserved.</p>
      </footer>
    </div>
  );
}
