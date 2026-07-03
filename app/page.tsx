'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllSections } from '@/lib/db';
import type { Section } from '@/lib/db';

const PATTERNS = [
  'bg-[url(data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect fill="%23f5f5f5" width="20" height="20"/><path stroke="%23d0d0d0" d="M0 0h20v20" stroke-width="0.5" fill="none"/><circle cx="10" cy="10" r="1" fill="%23d0d0d0"/></svg>)]',
  'bg-[url(data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><defs><pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="%23d0d0d0"/></pattern></defs><rect width="20" height="20" fill="%23f5f5f5"/><rect width="20" height="20" fill="url(%23dots)"/></svg>)]',
  'bg-[url(data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23f5f5f5" width="40" height="40"/><path stroke="%23d0d0d0" d="M0 0v40M40 0v40" stroke-width="0.5"/><path stroke="%23d0d0d0" d="M0 0h40M0 40h40" stroke-width="0.5"/></svg>)]',
  'bg-[url(data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><defs><pattern id="cross" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse"><path stroke="%23d0d0d0" d="M15 0v30M0 15h30" stroke-width="0.5"/></pattern></defs><rect width="30" height="30" fill="%23f5f5f5"/><rect width="30" height="30" fill="url(%23cross)"/></svg>)]',
];

export default function Home() {
  const [sections, setSections] = useState<Section[]>([]);
  const [patternIndex, setPatternIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch sections
    getAllSections().then(setSections);

    // Cycle background patterns every 4.5 seconds
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setPatternIndex((prev) => (prev + 1) % PATTERNS.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-ink-navy text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-space-grotesk font-bold">
            Seat of Wisdom
          </h1>
          <nav className="flex gap-4 text-sm sm:text-base">
            <Link href="/join" className="hover:text-marigold transition">
              Join Room
            </Link>
            <Link href="/admin" className="hover:text-marigold transition">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section with Cycling Background */}
      <section
        className={`relative min-h-[500px] sm:min-h-[600px] flex items-center justify-center transition-all duration-1000 ${PATTERNS[patternIndex]}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none" />
        
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-space-grotesk font-bold text-ink-navy mb-4">
            Master Mathematics
          </h2>
          <p className="text-lg sm:text-xl text-ink-slate mb-8 font-inter">
            Challenge yourself across 6 levels of mathematical excellence. Practice solo or compete live.
          </p>

          {/* Level-Up Path */}
          <div className="mb-12 flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto pb-4">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-space-grotesk font-bold text-white transition-transform hover:scale-110"
                  style={{ backgroundColor: section.tier_color }}
                  title={section.name}
                >
                  {idx + 1}
                </div>
                {idx < sections.length - 1 && (
                  <div className="hidden sm:block absolute w-8 h-0.5 bg-gray-300 ml-1 mt-[-24px]" />
                )}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/practice"
              className="px-6 sm:px-8 py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              Practice Now
            </Link>
            <Link
              href="/join"
              className="px-6 sm:px-8 py-3 border-2 border-ink-navy text-ink-navy font-space-grotesk font-bold rounded-lg hover:bg-ink-navy hover:text-white transition transform hover:scale-105"
            >
              Join Live Room
            </Link>
          </div>
        </div>
      </section>

      {/* Section Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h3 className="text-3xl sm:text-4xl font-space-grotesk font-bold text-ink-navy mb-12 text-center">
          6 Levels of Challenge
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/practice?section=${section.id}`}
              className="group cursor-pointer"
            >
              <div
                className="h-40 sm:h-48 rounded-xl p-6 sm:p-8 flex flex-col justify-between text-white shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: section.tier_color }}
              >
                <div>
                  <h4 className="text-xl sm:text-2xl font-space-grotesk font-bold mb-2">
                    {section.name}
                  </h4>
                  <p className="text-sm sm:text-base opacity-90">
                    {section.grade_range}
                  </p>
                </div>
                <div className="text-3xl sm:text-4xl font-space-grotesk group-hover:scale-125 transition-transform">
                  {section.icon_name ? (
                    <span>{section.icon_name}</span>
                  ) : (
                    '→'
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-navy text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm opacity-75">
          <p>© 2026 Seat of Wisdom Math Olympiad. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
