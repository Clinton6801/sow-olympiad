import { useEffect, useState, useCallback } from 'react';

interface UseTimerProps {
  startTime?: string; // ISO string when timer started
  durationSeconds: number;
  onTimeUp?: () => void;
}

export function useTimer({ startTime, durationSeconds, onTimeUp }: UseTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(!!startTime);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = startTime ? new Date(startTime).getTime() : now;
      const end = start + durationSeconds * 1000;
      const remaining = Math.max(0, (end - now) / 1000);

      setRemainingSeconds(Math.ceil(remaining));

      if (remaining <= 0) {
        setIsRunning(false);
        onTimeUp?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, startTime, durationSeconds, onTimeUp]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setRemainingSeconds(durationSeconds);
    setIsRunning(false);
  }, [durationSeconds]);

  return {
    remainingSeconds,
    isRunning,
    start,
    stop,
    reset,
    percentage: (remainingSeconds / durationSeconds) * 100,
  };
}
