'use client';

import React from 'react';
import { FocusSession } from '@/app/lib/types';
import TimerBadge from '../TimerBadge';

interface FocusModeTopNavProps {
  taskName: string;
  focusSession: FocusSession;
  showTimer: boolean;
  onBack: () => void;
  onPause: () => void;
  onStop: () => void;
}

/**
 * Focus Mode Top Navigation Bar
 *
 * Semi-transparent bar with task context and session controls.
 * Timer appears here when AI drawer is fully expanded.
 */
export default function FocusModeTopNav({
  taskName,
  focusSession,
  showTimer,
  onBack,
  onPause,
  onStop,
}: FocusModeTopNavProps) {
  return (
    <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-sm">
      {/* Left: Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
      >
        <span>←</span>
        <span className="hidden sm:inline">Galaxy</span>
      </button>

      {/* Center: Task name */}
      <div className="flex-1 text-center">
        <h1 className="text-lg font-medium text-white/90 truncate px-4">{taskName}</h1>
      </div>

      {/* Right: Timer (conditional) + Controls */}
      <div className="flex items-center gap-3">
        {showTimer && (
          <div className="hidden sm:block">
            <TimerBadge session={focusSession} size="compact" />
          </div>
        )}

        {/* Pause/Resume button */}
        <button
          onClick={onPause}
          className="px-3 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          title={focusSession.isActive ? 'Pause' : 'Resume'}
        >
          {focusSession.isActive ? '⏸' : '▶'}
        </button>

        {/* Stop button */}
        <button
          onClick={onStop}
          className="px-3 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          title="Stop"
        >
          ⏹
        </button>
      </div>
    </div>
  );
}
