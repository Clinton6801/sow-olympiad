'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoomByCode, getRoomParticipants } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { Room, RoomParticipant } from '@/lib/db';

export default function RoomLobby() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadRoom = async () => {
      const roomData = await getRoomByCode(code);
      if (!roomData) {
        setError('Room not found');
        setLoading(false);
        return;
      }
      setRoom(roomData);

      // Load participants
      const participantsData = await getRoomParticipants(roomData.id);
      setParticipants(participantsData);

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
            // Reload participants on any change
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

  const handleStart = async () => {
    if (!room) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', room.id);

      if (error) throw error;

      // Redirect to play page
      router.push(`/room/${code}/play`);
    } catch (err) {
      setError('Failed to start room');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-ink-slate">Loading room...</p>
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

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-white hover:opacity-80 transition">
            ← Back Home
          </Link>
          <div className="text-right">
            <p className="text-2xl font-space-grotesk font-bold font-mono tracking-widest">
              {code}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Room Info */}
        <div className="mb-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-3xl font-space-grotesk font-bold text-ink-navy mb-4">
              {room.section_id}
            </h2>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-ink-slate font-inter">Round Type</p>
                <p className="text-lg font-space-grotesk font-bold text-ink-navy capitalize">
                  {room.round_type}
                </p>
              </div>
              <div>
                <p className="text-ink-slate font-inter">Status</p>
                <p className="text-lg font-space-grotesk font-bold text-ink-navy capitalize">
                  {room.status === 'waiting' ? '⏳ Waiting' : '▶ Active'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-12">
          <h3 className="text-2xl font-space-grotesk font-bold text-ink-navy mb-6">
            Participants ({participants.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {participants.map((participant, idx) => (
              <div 
                key={participant.id} 
                className="bg-gray-50 rounded-lg p-6 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <p className="font-space-grotesk font-bold text-ink-navy">
                  {participant.student_name}
                </p>
                <p className="text-sm text-ink-slate mt-2">
                  Score: {participant.live_score}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Controls */}
        {room.status === 'waiting' && (
          <div className="bg-sage bg-opacity-10 border-2 border-sage rounded-lg p-8 text-center">
            <p className="text-ink-slate mb-6 font-inter">
              Admin: Ready to start the round?
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 transition"
            >
              Start Round
            </button>
          </div>
        )}

        {/* Waiting Message for Students */}
        {room.status === 'waiting' && participants.length > 0 && (
          <div className="bg-blue-50 border-2 border-sky rounded-lg p-8 text-center">
            <p className="text-ink-slate font-inter">
              ⏳ Waiting for the instructor to start the round...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
