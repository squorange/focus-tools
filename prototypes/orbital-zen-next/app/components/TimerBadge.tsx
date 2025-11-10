'use client';

import { useEffect, useState } from 'react';

interface TimerBadgeProps {
  startTime: Date;
  isActive: boolean;
  lastResumedAt?: Date;  // When session was last resumed
  totalTime: number; // seconds accumulated when paused
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function TimerBadge({ startTime, isActive, lastResumedAt, totalTime }: TimerBadgeProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) {
      // Paused - show accumulated time only
      setElapsedSeconds(totalTime);
      return;
    }

    // Active - calculate from lastResumedAt or startTime
    const calculateElapsed = () => {
      const now = new Date();
      const runningSince = lastResumedAt || startTime;
      const currentRunSeconds = Math.floor((now.getTime() - new Date(runningSince).getTime()) / 1000);
      return totalTime + currentRunSeconds;
    };

    // Set initial value
    setElapsedSeconds(calculateElapsed());

    // Update every second
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive, lastResumedAt, totalTime]);

  return (
    <div
      className={`
        absolute -bottom-2 left-1/2 transform -translate-x-1/2
        px-2 py-0.5
        backdrop-blur-sm
        border
        rounded-full
        text-xs font-mono font-semibold
        shadow-lg
        ${isActive ? 'animate-pulse-gentle' : ''}
      `}
      style={{
        zIndex: 10000,
        background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.7), rgba(59, 130, 246, 0.7))',
        borderColor: 'rgba(168, 85, 247, 0.4)',
        color: '#e0d7f5',
        boxShadow: '0 4px 6px rgba(168, 85, 247, 0.2), 0 2px 4px rgba(59, 130, 246, 0.15)',
      }}
    >
      {formatTime(elapsedSeconds)}
    </div>
  );
}
