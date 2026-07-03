'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getRoomByCode, getRoomLeaderboard, getRoomParticipants } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { Room, RoomParticipant } from '@/lib/db';

export default function LiveLeaderboard() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [leaderboard, setLeaderboard] = useState<RoomParticipant[]>([]);
  const [certificateIds, setCertificateIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roundEnded, setRoundEnded] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const roomData = await getRoomByCode(code);
      if (!roomData) {
        setError('Room not found');
        setLoading(false);
        return;
      }
      setRoom(roomData);
      setRoundEnded(roomData.status === 'completed');

      // Load leaderboard
      const leaderboardData = await getRoomLeaderboard(roomData.id);
      setLeaderboard(leaderboardData);

      // Fetch certificate IDs for each participant
      const { data: certificates } = await supabase
        .from('certificates')
        .select('id, room_participant_id')
        .eq('room_id', roomData.id);

      if (certificates) {
        const certMap: Record<string, string> = {};
        certificates.forEach((cert: any) => {
          if (cert.room_participant_id) {
            certMap[cert.room_participant_id] = cert.id;
          }
        });
        setCertificateIds(certMap);
      }

      // If round is not completed, try to end it and create certificates
      if (roomData.status === 'active') {
        try {
          const res = await fetch(`/api/rooms/${code}/end-round`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });

          if (res.ok) {
            const data = await res.json();
            const newCertMap = { ...certMap };
            data.certificate_ids?.forEach((certId: string) => {
              // Map certificate ID to participant ID (we'll need to refetch to get exact mapping)
            });
            setCertificateIds(newCertMap);
            setRoundEnded(true);
          }
        } catch (err) {
          console.error('Failed to end round:', err);
        }
      }

      // Subscribe to real-time updates
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
            getRoomLeaderboard(roomData.id).then(setLeaderboard);
          }
        )
        .subscribe();

      setLoading(false);

      return () => {
        subscription.unsubscribe();
      };
    };

    loadLeaderboard();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-ink-slate">Loading leaderboard...</p>
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

  if (!room) return null;

  const topThree = leaderboard.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-white hover:opacity-80 transition">
            ← Back Home
          </Link>
          <h1 className="text-2xl font-space-grotesk font-bold">Final Results</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {topThree.map((participant, idx) => (
                <div
                  key={participant.id}
                  className={`relative ${idx === 0 ? 'md:col-start-2 md:col-end-3 md:mb-12' : ''}`}
                >
                  <div
                    className={`rounded-lg p-8 text-white text-center ${
                      idx === 0
                        ? 'bg-marigold shadow-2xl transform scale-105'
                        : idx === 1
                          ? 'bg-gray-300'
                          : 'bg-orange-400'
                    }`}
                  >
                    <div className="text-6xl mb-4">{medals[idx]}</div>
                    <h3 className="text-2xl font-space-grotesk font-bold mb-2">
                      #{idx + 1}
                    </h3>
                    <p className="font-inter text-lg font-bold">{participant.student_name}</p>
                    <p className="text-5xl font-space-grotesk font-bold mt-4">
                      {participant.live_score}
                    </p>
                    <p className="text-sm opacity-75 mt-2">points</p>
                    {certificateIds[participant.id] && (
                      <Link
                        href={`/certificate/${certificateIds[participant.id]}`}
                        className="inline-block mt-4 px-4 py-2 bg-white text-ink-navy font-space-grotesk font-bold text-sm rounded hover:opacity-90 transition"
                      >
                        📜 Download Certificate
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="p-6 bg-ink-navy text-white">
            <h2 className="text-2xl font-space-grotesk font-bold">Complete Rankings</h2>
          </div>

          <div className="divide-y">
            {leaderboard.map((participant, idx) => (
              <div
                key={participant.id}
                className="p-6 hover:bg-gray-100 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="font-space-grotesk font-bold text-2xl text-ink-slate w-12">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-space-grotesk font-bold text-ink-navy">
                      {participant.student_name}
                    </p>
                    <p className="text-sm text-ink-slate">
                      {participant.correct_answers} correct • {participant.answers_submitted} attempted
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-3xl font-space-grotesk font-bold text-sage">
                      {participant.live_score}
                    </p>
                    <p className="text-sm text-ink-slate">points</p>
                  </div>
                  {certificateIds[participant.id] && (
                    <Link
                      href={`/certificate/${certificateIds[participant.id]}`}
                      className="px-3 py-2 bg-marigold text-white text-sm font-space-grotesk font-bold rounded hover:opacity-90 transition whitespace-nowrap"
                    >
                      📜
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 transition"
          >
            Back Home
          </Link>
        </div>
      </main>
    </div>
  );
}
