'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSection, getQuestionsBySection } from '@/lib/db';
import type { Section, Question } from '@/lib/db';

export default function PracticePlayer() {
  const params = useParams();
  const router = useRouter();

  const sectionId = params.section as string;
  const roundType = params.roundType as string;

  const [section, setSection] = useState<Section | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const sectionData = await getSection(sectionId);
      setSection(sectionData);

      const questionsData = await getQuestionsBySection(sectionId, roundType as any);
      setQuestions(questionsData.slice(0, 20));
      setLoading(false);
    };

    loadData();
  }, [sectionId, roundType]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    setResponses({
      ...responses,
      [currentIndex]: answer,
    });
  };

  const handleSubmit = () => {
    if (!currentQuestion) return;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeRound();
    }
  };

  const completeRound = async () => {
    if (!section || !studentName) return;

    try {
      // Send all responses to server for grading
      const res = await fetch('/api/practice/submit-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          section_id: sectionId,
          round_type: roundType,
          question_ids: questions.map((q) => q.id),
          responses: responses,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to submit round');
        return;
      }

      setScore(data.final_score);
      setCertificateId(data.certificate_id);
      setCompleted(true);
    } catch (err) {
      setError('An error occurred while submitting the round');
      console.error(err);
    }
  };

  // Name entry form
  if (!nameSubmitted) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-white hover:opacity-80 transition">
              ← Back
            </Link>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-space-grotesk font-bold text-ink-navy mb-6">
            Welcome!
          </h1>

          <p className="text-ink-slate mb-8 font-inter">
            Enter your name to begin the practice round.
          </p>

          <div className="bg-gray-50 rounded-lg p-8 mb-8">
            <input
              type="text"
              placeholder="Your name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-sage focus:outline-none text-lg font-inter mb-4"
              autoFocus
            />

            <button
              onClick={() => {
                if (studentName.trim()) {
                  setNameSubmitted(true);
                }
              }}
              disabled={!studentName.trim()}
              className="w-full py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              Start Round
            </button>
          </div>

          {section && (
            <div
              className="rounded-lg p-6 text-white"
              style={{ backgroundColor: section.tier_color }}
            >
              <p className="font-space-grotesk font-bold text-lg mb-2">
                {section.name}
              </p>
              <p className="font-inter text-sm opacity-90">
                {roundType.charAt(0).toUpperCase() + roundType.slice(1)} Round
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-ink-slate">Loading practice round...</p>
      </div>
    );
  }

  if (!section || questions.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-white hover:opacity-80 transition">
              ← Back
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-ink-slate mb-8">
            No questions available for this section and round type.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 transition"
          >
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-white hover:opacity-80 transition">
              ← Back
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-coral mb-8">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 transition"
          >
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-white hover:opacity-80 transition">
              ← Back Home
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-space-grotesk font-bold text-ink-navy mb-4">
            🎉 Round Complete!
          </h2>

          <div
            className="mt-12 p-8 rounded-lg text-white mb-8"
            style={{ backgroundColor: section.tier_color }}
          >
            <p className="text-lg mb-2">Your Score</p>
            <p className="text-6xl font-space-grotesk font-bold">{score}</p>
            <p className="text-lg mt-2">points</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-8 mb-8">
            <p className="text-ink-slate mb-4">Your certificate has been generated!</p>
            {certificateId && (
              <Link
                href={`/certificate/${certificateId}`}
                className="inline-block px-8 py-3 bg-marigold text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 transition"
              >
                View & Download Certificate
              </Link>
            )}
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-3 border-2 border-ink-navy text-ink-navy font-space-grotesk font-bold rounded-lg hover:bg-ink-navy hover:text-white transition"
          >
            Try Another Round
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-white hover:opacity-80 transition">
              ← Home
            </Link>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-75">Welcome, {studentName}!</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Question</p>
            <p className="text-2xl font-space-grotesk font-bold">
              {currentIndex + 1} / {questions.length}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-sage h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl sm:text-3xl font-space-grotesk font-bold text-ink-navy mb-6">
            {currentQuestion.content}
          </h2>

          {currentQuestion.answer_type === 'mcq' ? (
            // MCQ Options
            <div className="space-y-3 mb-8">
              {['option_a', 'option_b', 'option_c', 'option_d'].map((opt) => {
                const value = currentQuestion[opt as keyof Question] as string;
                if (!value) return null;

                const isSelected = responses[currentIndex] === value;

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(value)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-sage bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="font-space-grotesk font-bold">{value}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            // Numeric Input
            <div className="mb-8">
              <input
                type="number"
                placeholder="Enter your answer"
                value={responses[currentIndex] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-sage focus:outline-none text-lg font-inter"
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!responses[currentIndex]}
            className="w-full py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {currentIndex === questions.length - 1 ? 'Complete Round' : 'Next Question'}
          </button>
        </div>
      </main>
    </div>
  );
}
