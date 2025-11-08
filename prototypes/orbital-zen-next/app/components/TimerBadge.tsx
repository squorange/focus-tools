'use client';

import { useEffect, useState } from 'react';

interface TimerBadgeProps {
  startTime: Date;
  isActive: boolean;
  pausedAt?: Date;
  totalTime: number; // seconds accumulated before this session
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function TimerBadge({ startTime, isActive, pausedAt, totalTime }: TimerBadgeProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) {
      // If paused, calculate time up to pause point
      if (pausedAt) {
        const elapsed = Math.floor((pausedAt.getTime() - startTime.getTime()) / 1000);
        setElapsedSeconds(totalTime + elapsed);
      } else {
        setElapsedSeconds(totalTime);
      }
      return;
    }

    // Active: update every second
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedSeconds(totalTime + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive, pausedAt, totalTime]);

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
