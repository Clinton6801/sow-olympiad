'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoomByCode, getRoomParticipants, getQuestionsBySection } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { Room, RoomParticipant, Question } from '@/lib/db';

export default function LiveRoundPlayer() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const loadRoom = async () => {
      const roomData = await getRoomByCode(code);
      if (!roomData || roomData.status !== 'active') {
        setError('Room is not active');
        setLoading(false);
        return;
      }
      setRoom(roomData);

      // Load questions for this round
      const questionsData = await getQuestionsBySection(
        roomData.section_id,
        roomData.round_type as any
      );
      setQuestions(questionsData.slice(0, roomData.round_type === 'grid' ? 25 : 20));

      // Load participants
      const participantsData = await getRoomParticipants(roomData.id);
      setParticipants(participantsData);

      // Get current participant (assume first one for now)
      if (participantsData.length > 0) {
        setCurrentParticipantId(participantsData[0].id);
      }

      // Subscribe to participant updates
      const subscription = supabase
        .channel(`room:${roomData.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'room_participants',
            filter: `room_id=eq.${roomData.id}`,
          },
          (payload) => {
            getRoomParticipants(roomData.id).then(setParticipants);
          }
        )
        .subscribe();

      setLoading(false);

      return () => {
        subscription.unsubscribe();
      };
    };

    loadRoom();
  }, [code]);

  const handleAnswer = (answer: string) => {
    setResponses({
      ...responses,
      [currentIndex]: answer,
    });
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !currentParticipantId || !room) return;

    try {
      // Submit answer via API route
      const res = await fetch(`/api/rooms/${code}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: currentParticipantId,
          question_id: currentQuestion.id,
          response: responses[currentIndex],
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError('Failed to submit answer');
        return;
      }

      // Move to next question or end round
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        router.push(`/room/${code}/leaderboard`);
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-ink-slate">Loading round...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-white hover:opacity-80 transition">
              ← Back Home
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-coral mb-8">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 transition"
          >
            Back Home
          </Link>
        </main>
      </div>
    );
  }

  if (!room || questions.length === 0 || !currentQuestion) return null;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-75">Room {code}</p>
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
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-sage h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
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

        {/* Live Leaderboard */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-space-grotesk font-bold text-ink-navy mb-4">
            Live Scores
          </h3>
          <div className="space-y-2">
            {participants
              .sort((a, b) => b.live_score - a.live_score)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-white rounded transition-all duration-300 animate-score-update"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-space-grotesk font-bold text-ink-slate w-6">
                      #{idx + 1}
                    </span>
                    <span className="font-inter">{p.student_name}</span>
                  </div>
                  <span className="font-space-grotesk font-bold text-ink-navy text-lg animate-scale-up">
                    {p.live_score}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
