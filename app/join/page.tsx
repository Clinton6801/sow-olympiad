'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoomByCode, addRoomParticipant } from '@/lib/db';

export default function JoinRoom() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate room exists and is waiting
      const room = await getRoomByCode(roomCode.toUpperCase());
      if (!room) {
        setError('Room code not found');
        setLoading(false);
        return;
      }

      if (room.status !== 'waiting') {
        setError('This room is not accepting new participants');
        setLoading(false);
        return;
      }

      if (!name.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }

      // Add participant
      const participant = await addRoomParticipant(room.id, name);
      if (!participant) {
        setError('Failed to join room');
        setLoading(false);
        return;
      }

      // Redirect to room lobby
      router.push(`/room/${roomCode.toUpperCase()}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-white hover:opacity-80 transition">
            ← Back Home
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-space-grotesk font-bold text-ink-navy mb-4">
            Join a Room
          </h1>
          <p className="text-ink-slate">
            Enter the room code from your instructor or friend
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-space-grotesk font-bold text-ink-navy mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC123"
              maxLength={6}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-sage focus:outline-none font-mono text-lg tracking-widest text-center"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-space-grotesk font-bold text-ink-navy mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-sage focus:outline-none font-inter"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-coral rounded">
              <p className="text-coral font-inter text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !roomCode || !name}
            className="w-full py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </main>
    </div>
  );
}
