'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getAllSections } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { getIconComponent } from '@/lib/iconMap';
import type { Section } from '@/lib/db';

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
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState({ totalCertificates: 0, activeRooms: 0, weeklyPractice: 0 });
  const headerRef = useRef<HTMLHeadingElement>(null);

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

  // Scroll handler for sticky header with frosted effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  const currentPatternUrl = `url('${PATTERN_DATA[patternIndex]}')`;

  // Generate wavy bezier path for level-up journey
  const pathData = (() => {
    if (sections.length === 0) return '';
    const containerWidth = 1000; // SVG viewBox width
    const containerHeight = 120;
    const padding = 60;
    const usableWidth = containerWidth - padding * 2;
    const stepWidth = usableWidth / (sections.length - 1);
    
    let path = `M ${padding} ${containerHeight / 2}`;
    
    sections.forEach((_, i) => {
      const x = padding + i * stepWidth;
      // Alternate up and down
      const baseY = containerHeight / 2;
      const yOffset = i % 2 === 0 ? -20 : 20;
      const y = baseY + yOffset;
      
      if (i === 0) {
        path += ` L ${x} ${y}`;
      } else {
        // Bezier curve to smooth the wave
        const prevX = padding + (i - 1) * stepWidth;
        const prevYOffset = (i - 1) % 2 === 0 ? -20 : 20;
        const prevY = baseY + prevYOffset;
        const cp1X = prevX + stepWidth / 3;
        const cp2X = x - stepWidth / 3;
        path += ` C ${cp1X} ${prevY}, ${cp2X} ${y}, ${x} ${y}`;
      }
    });
    
    return path;
  })();

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Sticky with frosted glass effect on scroll */}
      <header 
        ref={headerRef}
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled 
            ? 'bg-white/85 backdrop-blur-lg border-b border-gray-200' 
            : 'bg-white border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <Logo />
          <nav className="flex gap-2 sm:gap-4 items-center">
            <Link 
              href="/join" 
              className="text-xs sm:text-sm text-ink-navy font-body hover:text-marigold transition focus-ring rounded px-2 sm:px-3 py-2"
            >
              Join room
            </Link>
            <Link 
              href="/admin" 
              className="text-xs sm:text-sm text-ink-navy font-body hover:text-marigold transition focus-ring rounded px-2 sm:px-3 py-2"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

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

          {/* Level-up Path - Winding SVG Bezier Curve (lg+ only) */}
          <div className="hidden lg:flex mb-8 sm:mb-12 items-center justify-center overflow-x-auto pb-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="w-full max-w-4xl flex justify-between items-center px-2 sm:px-4">
              {/* SVG Curved Path */}
              <svg 
                viewBox="0 0 1000 120" 
                className="absolute left-0 right-0 w-full h-24 pointer-events-none"
                style={{ maxWidth: '100%', height: 'auto' }}
              >
                <defs>
                  <style>{`
                    @media (prefers-reduced-motion: no-preference) {
                      .level-path {
                        stroke-dasharray: 1000;
                        stroke-dashoffset: 1000;
                        animation: drawPath 2s ease-out forwards;
                      }
                      @keyframes drawPath {
                        to { stroke-dashoffset: 0; }
                      }
                    }
                    @media (prefers-reduced-motion: reduce) {
                      .level-path {
                        stroke-dashoffset: 0;
                      }
                    }
                  `}</style>
                </defs>
                <path
                  d={pathData}
                  stroke="#D4D8E0"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  className="level-path"
                />
              </svg>

              {/* Nodes - Single Row (lg+) */}
              <div className="relative z-10 w-full flex justify-between gap-1 sm:gap-2">
                {sections.map((section, idx) => {
                  const IconComponent = getIconComponent(section.icon_name);
                  const color = section.tier_color || '#14213D';
                  
                  return (
                    <Link
                      key={section.id} 
                      href={`/practice?section=${section.id}`}
                      className="flex flex-col items-center group flex-1"
                      style={{
                        animation: `fadeInScale 0.6s ease-out forwards`,
                        animationDelay: `${300 + idx * 50}ms`,
                      } as React.CSSProperties}
                    >
                      {/* Node circle with icon */}
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-14 lg:h-14 rounded-full flex items-center justify-center mb-1 sm:mb-2 transition-all hover:shadow-lg hover:scale-110 active:scale-95 cursor-pointer shadow-md focus-ring bg-white"
                        style={{ 
                          backgroundColor: color,
                          opacity: 0.95,
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <IconComponent size={20} className="sm:hidden" stroke={2} color="white" />
                        <IconComponent size={24} className="hidden sm:block md:hidden" stroke={2} color="white" />
                        <IconComponent size={28} className="hidden md:block lg:block" stroke={2} color="white" />
                      </div>
                      
                      {/* Label - full section name */}
                      <p className="text-xs sm:text-xs md:text-sm lg:text-sm font-display font-semibold text-ink-navy text-center whitespace-normal max-w-[70px] sm:max-w-[80px] lg:max-w-[90px] leading-tight">
                        {section.name}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Level-up Path - Wrapped Grid (below lg) */}
          <div className="lg:hidden mb-8 sm:mb-12 flex items-center justify-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="w-full max-w-2xl px-2 sm:px-4">
              {/* Grid: 3 columns, 2 rows - no SVG path */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                {sections.map((section, idx) => {
                  const IconComponent = getIconComponent(section.icon_name);
                  const color = section.tier_color || '#14213D';
                  
                  return (
                    <Link
                      key={section.id} 
                      href={`/practice?section=${section.id}`}
                      className="flex flex-col items-center group"
                      style={{
                        animation: `fadeInScale 0.6s ease-out forwards`,
                        animationDelay: `${300 + idx * 50}ms`,
                      } as React.CSSProperties}
                    >
                      {/* Node circle with icon */}
                      <div 
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-all hover:shadow-lg hover:scale-110 active:scale-95 cursor-pointer shadow-md focus-ring bg-white"
                        style={{ 
                          backgroundColor: color,
                          opacity: 0.95,
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <IconComponent size={24} className="sm:hidden" stroke={2} color="white" />
                        <IconComponent size={28} className="hidden sm:block" stroke={2} color="white" />
                      </div>
                      
                      {/* Label - stacked below icon */}
                      <p className="text-xs sm:text-sm font-display font-semibold text-ink-navy text-center leading-tight">
                        {section.name}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Link
              href="/practice"
              className="px-6 sm:px-8 py-3 bg-leaf-green text-white font-display font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all duration-200 focus-ring text-sm sm:text-base"
            >
              Start practicing
            </Link>
            <Link
              href="/join"
              className="px-6 sm:px-8 py-3 border-2 border-ink-navy text-ink-navy font-display font-bold rounded-lg hover:bg-ink-navy hover:text-white active:scale-95 transition-all duration-200 focus-ring text-sm sm:text-base"
            >
              Enter competition room
            </Link>
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
          6 levels of challenge
        </h2>
        <p className="text-center text-sm sm:text-base text-ink-navy font-body mb-8 sm:mb-12 opacity-80">
          Find your starting point and climb to mastery
        </p>

        {/* Grid: 2 cols on mobile, 3 cols on tablet, 6 cols on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
          {sections.map((section, idx) => {
            const IconComponent = getIconComponent(section.icon_name);
            const isGrandMaster = section.id === sections[sections.length - 1]?.id;
            
            return (
              <ScrollRevealCard key={section.id} index={idx}>
                <Link
                  href={`/practice?section=${section.id}`}
                  className={`group cursor-pointer focus-ring rounded-lg transition-all duration-200 block h-full ${
                    isGrandMaster ? 'md:col-span-1 lg:col-span-1' : ''
                  }`}
                >
                  <div className={`bg-white border-l-4 rounded-lg overflow-hidden h-full flex flex-col transition-all duration-150 hover:shadow-xl active:scale-95 ${
                    isGrandMaster 
                      ? 'scale-105 md:scale-110 lg:scale-110 shadow-lg hover:shadow-2xl' 
                      : 'shadow-md hover:shadow-lg'
                  }`}
                  style={{
                    borderLeftColor: section.tier_color,
                    boxShadow: isGrandMaster ? `0 0 24px ${section.tier_color}40` : undefined,
                  }}
                  >
                    {/* Top accent bar */}
                    <div 
                      className="h-1" 
                      style={{ backgroundColor: section.tier_color }}
                    />

                    {/* Content */}
                    <div className="flex-1 p-3 sm:p-4 md:p-6 flex flex-col items-center text-center">
                      {/* Icon badge - render icon component inline */}
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-2 sm:mb-3 text-white transition-transform group-hover:scale-110 shadow-md"
                        style={{ backgroundColor: section.tier_color }}
                      >
                        <IconComponent size={20} className="sm:hidden" stroke={1.5} color="white" />
                        <IconComponent size={24} className="hidden sm:block md:hidden" stroke={1.5} color="white" />
                        <IconComponent size={28} className="hidden md:block" stroke={1.5} color="white" />
                      </div>

                      {/* Section name */}
                      <h3 className="text-xs sm:text-sm md:text-base font-display font-semibold text-ink-navy mb-1">
                        {section.name}
                      </h3>

                      {/* Grade range */}
                      <p className="text-xs md:text-sm font-body text-gray-500">
                        {section.grade_range}
                      </p>
                    </div>
                  </div>
                </Link>
              </ScrollRevealCard>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-navy text-white py-6 sm:py-8 text-center text-xs sm:text-sm font-body opacity-75">
        <p>© 2026 Seat of Wisdom Math Olympiad. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Scroll-Reveal Card Component
function ScrollRevealCard({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Show immediately without animation
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        animationName: isVisible ? 'slideUpFade' : 'none',
        animationDuration: '0.6s',
        animationTimingFunction: 'ease-out',
        animationFillMode: 'forwards',
        animationDelay: `${index * 60}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
