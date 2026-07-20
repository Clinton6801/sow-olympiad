'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getSection, getQuestionsBySection } from '@/lib/db';
import { useCountdownTimer } from '@/lib/hooks/useCountdownTimer';
import type { Section, Question } from '@/lib/db';

export default function PracticePlayer() {
  const params = useParams();

  const sectionId = params.section as string;
  const roundType = params.roundType as string;

  const [section, setSection] = useState<Section | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]); // For Sprint reshuffle
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [sprintDuration, setSprintDuration] = useState(300); // 5 minutes default
  const [sprintTimeStarted, setSprintTimeStarted] = useState<string | null>(null);

  // Per-question timer for Grid and Tiered rounds (20 seconds each)
  const [questionTimerStart, setQuestionTimerStart] = useState<string | null>(null);
  const questionTimer = useCountdownTimer({
    startAt: questionTimerStart,
    duration: 20,
    onComplete: () => {
      // Auto-advance if no answer submitted
      handleAutoAdvance();
    },
  });

  // Sprint timer for Sprint rounds (full round duration)
  const sprintTimer = useCountdownTimer({
    startAt: sprintTimeStarted,
    duration: sprintDuration,
    onComplete: () => {
      completeRound();
    },
  });

  useEffect(() => {
    const loadData = async () => {
      const sectionData = await getSection(sectionId);
      setSection(sectionData);

      const questionsData = await getQuestionsBySection(sectionId, roundType as any);
      
      // Grid/Tiered: limit to 20 questions
      // Sprint: keep full pool available for reshuffling
      if (roundType === 'sprint') {
        setAllQuestions(questionsData);
        setQuestions(questionsData);
      } else {
        // Grid and Tiered: always 20 questions per session
        setQuestions(questionsData.slice(0, 20));
      }
      
      setLoading(false);
    };

    loadData();
  }, [sectionId, roundType]);

  // Start per-question timer when question changes (for Grid/Tiered)
  useEffect(() => {
    if (nameSubmitted && !completed && questions.length > 0 && roundType !== 'sprint') {
      const now = new Date().toISOString();
      setQuestionTimerStart(now);
    }
  }, [currentIndex, nameSubmitted, completed, roundType, questions.length]);

  // Start sprint timer when round begins
  useEffect(() => {
    if (nameSubmitted && !completed && questions.length > 0 && roundType === 'sprint') {
      const now = new Date().toISOString();
      setSprintTimeStarted(now);
    }
  }, [nameSubmitted, completed, roundType, questions.length]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    setResponses({
      ...responses,
      [currentIndex]: answer,
    });
  };

  const handleAutoAdvance = () => {
    if (!currentQuestion) return;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Question pool exhausted
      if (roundType === 'sprint' && allQuestions.length > 0) {
        // Reshuffle Sprint questions and continue
        const reshuffled = [...allQuestions];
        for (let i = reshuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
        }
        setQuestions(reshuffled);
        setCurrentIndex(0);
        // Reset responses to avoid conflicts with new pool
        setResponses({});
      } else {
        // Grid/Tiered: complete round when 20 questions done
        completeRound();
      }
    }
  };

  const handleSubmit = () => {
    if (!currentQuestion) return;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Question pool exhausted
      if (roundType === 'sprint' && allQuestions.length > 0) {
        // Reshuffle Sprint questions and continue
        const reshuffled = [...allQuestions];
        for (let i = reshuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
        }
        setQuestions(reshuffled);
        setCurrentIndex(0);
        // Reset responses to avoid conflicts with new pool
        setResponses({});
      } else {
        // Grid/Tiered: complete round when 20 questions done
        completeRound();
      }
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
      <div className="min-h-screen bg-graph-paper">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-white hover:opacity-80 transition focus-ring rounded px-2 py-1 text-sm font-body">
              ← Back
            </Link>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-ink-navy mb-4 sm:mb-6">
            Welcome!
          </h1>

          <p className="text-sm sm:text-base text-ink-navy font-body mb-6 sm:mb-8 opacity-75">
            Enter your name to begin the practice round.
          </p>

          <div className="bg-white rounded-lg p-6 sm:p-8 mb-6 sm:mb-8 shadow-md">
            <input
              type="text"
              placeholder="Your name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none text-base sm:text-lg font-body mb-4 transition-colors"
              autoFocus
            />

            {roundType === 'sprint' && (
              <div className="mb-4">
                <label className="block text-left text-sm font-body text-ink-navy mb-3 font-semibold">
                  Sprint Duration
                </label>
                <div className="space-y-2">
                  {[
                    { label: '3 minutes', value: 180 },
                    { label: '5 minutes', value: 300 },
                    { label: '10 minutes', value: 600 },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSprintDuration(option.value)}
                      className={`w-full py-2 px-3 border-2 rounded-lg transition-all text-sm font-body ${
                        sprintDuration === option.value
                          ? 'border-leaf-green bg-leaf-green text-white'
                          : 'border-gray-300 text-ink-navy hover:border-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (studentName.trim()) {
                  setNameSubmitted(true);
                }
              }}
              disabled={!studentName.trim()}
              className="w-full py-3 bg-leaf-green text-white font-display font-bold rounded-lg hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all focus-ring min-h-[44px] text-sm sm:text-base"
            >
              Start Round
            </button>
          </div>

          {section && (
            <div
              className="rounded-lg p-6 text-white shadow-md"
              style={{ backgroundColor: section.tier_color }}
            >
              <p className="font-display font-bold text-base sm:text-lg mb-1">
                {section.name}
              </p>
              <p className="font-body text-xs sm:text-sm opacity-90">
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
      <div className="min-h-screen bg-graph-paper flex items-center justify-center">
        <p className="text-ink-navy font-body">Loading practice round...</p>
      </div>
    );
  }

  if (!section || questions.length === 0) {
    return (
      <div className="min-h-screen bg-graph-paper">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-white hover:opacity-80 transition focus-ring rounded px-2 py-1 text-sm font-body">
              ← Back
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <p className="text-ink-navy font-body mb-6 sm:mb-8 text-sm sm:text-base">
            No questions available for this section and round type.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-leaf-green text-white font-display font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all focus-ring"
          >
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-graph-paper">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-white hover:opacity-80 transition focus-ring rounded px-2 py-1 text-sm font-body">
              ← Back
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <p className="text-coral-flare font-body mb-6 sm:mb-8 text-sm sm:text-base">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-leaf-green text-white font-display font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all focus-ring"
          >
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-graph-paper">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-white hover:opacity-80 transition focus-ring rounded px-2 py-1 text-sm font-body">
              ← Back Home
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-ink-navy mb-3 sm:mb-4">
            🎉 Round Complete!
          </h2>

          <div
            className="mt-8 sm:mt-12 p-6 sm:p-8 rounded-lg text-white mb-6 sm:mb-8 shadow-lg"
            style={{ backgroundColor: section.tier_color }}
          >
            <p className="text-sm sm:text-base font-body mb-2 opacity-90">Your Score</p>
            <p className="text-5xl sm:text-6xl font-display font-bold">{score}</p>
            <p className="text-sm sm:text-base font-body mt-2 opacity-90">points</p>
          </div>

          <div className="bg-white rounded-lg p-6 sm:p-8 mb-6 sm:mb-8 shadow-md">
            <p className="text-ink-navy font-body mb-4 text-sm sm:text-base opacity-75">Your certificate has been generated!</p>
            {certificateId && (
              <Link
                href={`/certificate/${certificateId}`}
                className="inline-block px-6 sm:px-8 py-3 bg-marigold text-white font-display font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all focus-ring text-sm sm:text-base"
              >
                View & Download Certificate
              </Link>
            )}
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-3 border-2 border-ink-navy text-ink-navy font-display font-bold rounded-lg hover:bg-ink-navy hover:text-white active:scale-95 transition-all focus-ring text-sm sm:text-base"
          >
            Try Another Round
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graph-paper">
      <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-white hover:opacity-80 transition focus-ring rounded px-2 py-1 text-sm font-body">
              ← Home
            </Link>
          </div>
          <div className="text-center">
            <p className="text-xs opacity-75 font-body">Welcome, {studentName}</p>
          </div>
          <div className="text-right whitespace-nowrap">
            {roundType === 'sprint' ? (
              <div>
                <p className="text-xs opacity-75 font-body">Time Remaining</p>
                <p
                  className={`text-lg sm:text-2xl font-mono font-bold transition-colors ${
                    sprintTimer.secondsRemaining <= 5 ? 'text-coral-flare' : 'text-white'
                  }`}
                >
                  {sprintTimer.display}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs opacity-75 font-body">Question</p>
                <p className="text-lg sm:text-2xl font-display font-bold">
                  {currentIndex + 1} / {questions.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Progress bar */}
        {roundType !== 'sprint' && (
          <div className="mb-6 sm:mb-8">
            <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
              <div
                className="bg-leaf-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Per-question timer for Grid/Tiered */}
        {roundType !== 'sprint' && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between">
              <p className="text-sm font-body text-ink-navy opacity-75">Question Timer</p>
              <div
                className={`text-2xl sm:text-3xl font-mono font-bold transition-colors ${
                  questionTimer.secondsRemaining <= 5 ? 'text-coral-flare' : 'text-ink-navy'
                }`}
              >
                {questionTimer.display}
              </div>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-1 overflow-hidden mt-2">
              <div
                className={`h-1 rounded-full transition-all duration-100 ${
                  questionTimer.secondsRemaining <= 5 ? 'bg-coral-flare' : 'bg-leaf-green'
                }`}
                style={{ width: `${questionTimer.percentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-ink-navy mb-6 leading-tight">
            {currentQuestion.content}
          </h2>

          {currentQuestion.answer_type === 'mcq' ? (
            // MCQ Options
            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              {['option_a', 'option_b', 'option_c', 'option_d'].map((opt) => {
                const value = currentQuestion[opt as keyof Question] as string;
                if (!value) return null;

                const isSelected = responses[currentIndex] === value;

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(value)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all active:scale-95 min-h-[44px] focus-ring ${
                      isSelected
                        ? 'border-leaf-green bg-leaf-green bg-opacity-10 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="font-body text-sm sm:text-base">{value}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            // Numeric Input
            <div className="mb-6 sm:mb-8">
              <input
                type="number"
                placeholder="Enter your answer"
                value={responses[currentIndex] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-leaf-green focus:outline-none text-base sm:text-lg font-mono transition-colors"
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!responses[currentIndex]}
            className="w-full py-3 bg-leaf-green text-white font-display font-bold rounded-lg hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all focus-ring min-h-[44px] text-sm sm:text-base"
          >
            {currentIndex === questions.length - 1 ? 'Complete Round' : 'Next Question'}
          </button>
        </div>
      </main>
    </div>
  );
}
