'use client';

import React from 'react';
import { FocusSession } from '@/app/lib/types';
import TimerBadge from '../TimerBadge';

interface FocusModeTopNavProps {
  taskName: string;
  subtaskName?: string;
  focusSession: FocusSession;
  showTimer: boolean;
  onBack: () => void;
  onPause: () => void;
  onStop: () => void;
  onComplete: () => void;
}

/**
 * Focus Mode Top Navigation Bar
 *
 * Semi-transparent bar with task context and session controls.
 * Timer appears here when AI drawer is fully expanded.
 */
export default function FocusModeTopNav({
  taskName,
  subtaskName,
  focusSession,
  showTimer,
  onBack,
  onPause,
  onStop,
  onComplete,
}: FocusModeTopNavProps) {
  return (
    <>
      {/* Left: Back button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-gray-600/40 rounded-full text-gray-300 hover:text-white hover:border-gray-500 transition-all duration-200 flex items-center gap-2 shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">Solar</span>
        </button>
      </div>

      {/* Center: Task/Subtask hierarchy with responsive scaling */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 max-w-md flex items-center">
        <div className="text-center px-4">
          {subtaskName ? (
            <>
              {/* Subtask focus mode: subtask prominent, task as subtext */}
              <h1 className="text-sm sm:text-base md:text-lg font-medium text-white/70 truncate leading-tight mb-0.5">
                {subtaskName}
              </h1>
              <p className="text-xs text-white/40 truncate leading-tight">
                {taskName}
              </p>
            </>
          ) : (
            <>
              {/* Parent task focus mode: task prominent */}
              <h1 className="text-base sm:text-lg md:text-xl font-medium text-white/70 truncate">
                {taskName}
              </h1>
            </>
          )}
        </div>
      </div>

      {/* Right: Timer (conditional) + Controls */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        {showTimer && (
          <div className="hidden sm:block">
            <TimerBadge
              startTime={focusSession.startTime}
              isActive={focusSession.isActive}
              lastResumedAt={focusSession.lastResumedAt}
              totalTime={focusSession.totalTime}
              size="large"
            />
          </div>
        )}

        {/* Pause/Resume button */}
        <button
          onClick={onPause}
          className="px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-gray-600/40 rounded-full text-gray-300 hover:text-white hover:border-gray-500 transition-all duration-200 flex items-center gap-2 shadow-lg"
          title={focusSession.isActive ? 'Pause' : 'Resume'}
        >
          {focusSession.isActive ? '⏸' : '▶'}
        </button>

        {/* Stop button */}
        <button
          onClick={onStop}
          className="px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-gray-600/40 rounded-full text-gray-300 hover:text-white hover:border-gray-500 transition-all duration-200 flex items-center gap-2 shadow-lg"
          title="Stop"
        >
          ⏹
        </button>

        {/* Complete button */}
        <button
          onClick={onComplete}
          className="px-4 py-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-400/30 rounded-full text-purple-200 hover:text-purple-100 hover:border-purple-300 transition-all duration-200 flex items-center gap-2 shadow-lg"
          title="Complete task"
        >
          ✓ Complete
        </button>
      </div>
    </>
  );
}
