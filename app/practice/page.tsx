'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSection } from '@/lib/db';
import type { Section } from '@/lib/db';

const ROUND_TYPES = [
  {
    id: 'grid',
    name: 'Grid Round',
    description: '5×5 grid of clickable cells. Pick your strategy.',
    emoji: '🔲',
    color: 'bg-sky',
  },
  {
    id: 'tiered',
    name: 'Tiered Round',
    description: 'Easy → Medium → Hard. Progress through difficulty levels.',
    emoji: '📈',
    color: 'bg-sage',
  },
  {
    id: 'sprint',
    name: 'Speed Sprint',
    description: 'Rapid-fire questions against the clock. Fast and furious.',
    emoji: '⚡',
    color: 'bg-coral',
  },
];

function PracticeSelectorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('section');

  const [section, setSection] = useState<Section | null>(null);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);

  useEffect(() => {
    if (sectionId) {
      getSection(sectionId).then((s) => {
        if (s) setSection(s);
      });
    }
  }, [sectionId]);

  const handleRoundSelect = (roundType: string) => {
    if (section) {
      router.push(`/practice/${section.id}/${roundType}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition">
            <h1 className="text-xl sm:text-2xl font-space-grotesk font-bold">
              Seat of Wisdom
            </h1>
          </Link>
          <Link href="/" className="text-marigold hover:opacity-80 transition">
            Back Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!sectionId ? (
          <div className="text-center py-12">
            <h2 className="text-4xl font-space-grotesk font-bold text-ink-navy mb-4">
              Select a Section
            </h2>
            <p className="text-lg text-ink-slate mb-8">
              Choose which math level you want to practice.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 transition"
            >
              Back to Sections
            </Link>
          </div>
        ) : section ? (
          <div>
            <div className="mb-12">
              <div
                className="h-32 rounded-lg p-8 text-white flex flex-col justify-between"
                style={{ backgroundColor: section.tier_color }}
              >
                <div>
                  <h2 className="text-3xl sm:text-4xl font-space-grotesk font-bold mb-2">
                    {section.name}
                  </h2>
                  <p className="text-lg opacity-90">{section.grade_range}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-space-grotesk font-bold text-ink-navy mb-6">
                Choose a Round Type
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ROUND_TYPES.map((roundType) => (
                  <button
                    key={roundType.id}
                    onClick={() => handleRoundSelect(roundType.id)}
                    onMouseEnter={() => setSelectedRound(roundType.id)}
                    onMouseLeave={() => setSelectedRound(null)}
                    className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 text-left ${
                      selectedRound === roundType.id
                        ? `border-${roundType.color.split('-')[1]} bg-opacity-10`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-5xl mb-4">{roundType.emoji}</div>
                    <h4 className="text-xl font-space-grotesk font-bold text-ink-navy mb-2">
                      {roundType.name}
                    </h4>
                    <p className="text-sm text-ink-slate">{roundType.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center pt-8">
              <Link
                href="/"
                className="text-ink-slate hover:text-ink-navy transition"
              >
                ← Change section
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-ink-slate">Loading section...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PracticeSelector() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <PracticeSelectorContent />
    </Suspense>
  );
}
