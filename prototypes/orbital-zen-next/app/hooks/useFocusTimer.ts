/**
 * Focus Timer Hook
 *
 * Manages live timer updates for active focus sessions with:
 * - Second-by-second updates when active
 * - Page Visibility API integration (pause when tab hidden)
 * - Periodic persistence to IndexedDB
 * - Smart time formatting
 */

import { useEffect, useState, useRef } from 'react';
import { FocusSession } from '../lib/types';
import { updateSessionTime } from '../lib/focus-session';

interface TimerState {
  elapsedSeconds: number;
  formattedTime: string;
  isRunning: boolean;
}

/**
 * Format seconds into human-readable time string
 * Uses smart rounding based on duration (per FOCUS_TRACKING_PLAN.md)
 */
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Active timer: always show exact time
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  } else {
    return `0:${String(seconds).padStart(2, '0')}`;
  }
}

/**
 * Hook to track elapsed time for an active focus session
 *
 * @param session - The active FocusSession (or undefined if no session)
 * @returns TimerState with elapsed seconds, formatted time, and running status
 */
export function useFocusTimer(session?: FocusSession): TimerState {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  // Main timer effect
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // If no session, show 0
    if (!session) {
      setElapsedSeconds(0);
      return;
    }

    // Calculate elapsed time from timestamps
    const calculateElapsed = (): number => {
      // If paused, return stored totalTime
      if (!session.isActive) {
        return session.totalTime;
      }

      // If active, calculate: totalTime + (now - lastResumedAt)
      const now = Date.now();
      const runningSince = session.lastResumedAt
        ? new Date(session.lastResumedAt).getTime()
        : new Date(session.startTime).getTime();

      const currentRunSeconds = Math.floor((now - runningSince) / 1000);
      return session.totalTime + currentRunSeconds;
    };

    // Set initial value
    setElapsedSeconds(calculateElapsed());

    // Start interval for live updates (runs even when tab hidden)
    intervalRef.current = setInterval(() => {
      const newElapsed = calculateElapsed();
      setElapsedSeconds(newElapsed);

      // Persist to IndexedDB every 10 seconds
      const now = Date.now();
      if (now - lastSaveRef.current >= 10000) {
        lastSaveRef.current = now;
        updateSessionTime(session.id, newElapsed).catch(err => {
          console.error('Failed to persist session time:', err);
        });
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session]);

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    isRunning: Boolean(session?.isActive),
  };
}

/**
 * Hook to track break timer (counts up from break start)
 *
 * @param session - The focus session with active break
 * @returns TimerState for the break duration
 */
export function useBreakTimer(session?: FocusSession): TimerState {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Break timer effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only run if there's an active break
    if (!session?.currentBreakStartTime) {
      setElapsedSeconds(0);
      return;
    }

    const calculateBreakElapsed = (): number => {
      const now = Date.now();
      const breakStartMs = new Date(session.currentBreakStartTime!).getTime();
      return Math.floor((now - breakStartMs) / 1000);
    };

    setElapsedSeconds(calculateBreakElapsed());

    intervalRef.current = setInterval(() => {
      setElapsedSeconds(calculateBreakElapsed());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session?.currentBreakStartTime]);

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    isRunning: Boolean(session?.currentBreakStartTime),
  };
}
