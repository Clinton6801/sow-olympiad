import { useEffect, useState } from 'react';

interface UseCountdownTimerProps {
  startAt?: string | null; // ISO timestamp when timer started
  duration: number; // duration in seconds
  onComplete?: () => void;
}

export function useCountdownTimer({
  startAt,
  duration,
  onComplete,
}: UseCountdownTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(duration);

  useEffect(() => {
    if (!startAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const startTime = new Date(startAt).getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);

      setSecondsRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [startAt, duration, onComplete]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const percentage = (secondsRemaining / duration) * 100;

  return {
    secondsRemaining,
    display: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    percentage,
    isComplete: secondsRemaining === 0,
  };
}
