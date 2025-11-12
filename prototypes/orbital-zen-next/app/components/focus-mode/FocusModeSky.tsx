'use client';

import React, { useMemo } from 'react';
import { Task, Subtask, FocusSession } from '@/app/lib/types';
import FocusModeMoon from './FocusModeMoon';

interface FocusModeSkyProps {
  task: Task;
  subtask?: Subtask;
  focusSession: FocusSession;
  drawerState: 'minimal' | 'intermediate' | 'full';
  showTimerOnMoon: boolean;
  taskColor: string;
  onUpdateNotes: (notes: string) => void;
  onCompleteTask: () => void;
}

/**
 * Focus Mode Sky Area
 *
 * Renders the night sky with:
 * - Gradient background (twilight atmosphere)
 * - Star field
 * - Current subtask as moon (or empty sky for parent task)
 * - Task notes field
 * - Complete task button
 *
 * TODO: Future enhancements
 * - Parent task: render all subtasks as constellation of moons
 * - Break mode: sky brightens to dawn, sun traverses during break
 */
export default function FocusModeSky({
  task,
  subtask,
  focusSession,
  drawerState,
  showTimerOnMoon,
  taskColor,
  onUpdateNotes,
  onCompleteTask,
}: FocusModeSkyProps) {
  // Generate random star positions (memoized for consistency)
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 60, // Only in upper 60% of sky
        size: Math.random() > 0.7 ? 2 : 1, // Some larger stars
        opacity: 0.3 + Math.random() * 0.4,
      })),
    []
  );

  // Sky height adjusts based on drawer state
  const skyHeightClass = {
    minimal: 'h-[85vh]',
    intermediate: 'h-[70vh]',
    full: 'h-[35vh]',
  }[drawerState];

  return (
    <div
      className={`relative ${skyHeightClass} transition-all duration-500 ease-out overflow-hidden`}
      style={{
        background: `linear-gradient(to bottom, #1a1a3c 0%, #32285a 50%, #463264 100%)`,
      }}
    >
      {/* Star Field */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Atmospheric Glow near bottom (derived from task color) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center bottom, ${taskColor}20 0%, transparent 70%)`,
        }}
      />

      {/* Main Content Container */}
      <div className="relative h-full flex flex-col items-center justify-between py-8 px-4">
        {/* Moon Area (current subtask or empty for parent task) */}
        <div className="flex-1 flex items-center justify-center">
          {subtask ? (
            <div className="relative">
              {/* Render single moon for current subtask */}
              <FocusModeMoon
                subtask={subtask}
                taskColor={taskColor}
                focusSession={focusSession}
                showTimer={showTimerOnMoon}
              />

              {/* Atmospheric glow around moon */}
              <div
                className="absolute inset-0 -z-10 blur-3xl opacity-30 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${taskColor} 0%, transparent 70%)`,
                  transform: 'scale(2)',
                }}
              />

              {/* Complete Subtask button (appears on hover) */}
              <button
                onClick={onCompleteTask}
                className="absolute -bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all opacity-0 hover:opacity-100"
              >
                Complete Subtask
              </button>
            </div>
          ) : (
            // Parent task focus mode: empty sky with just stars
            // TODO: Future - render all subtasks as constellation
            <div className="text-center">
              <div className="text-white/60 text-lg mb-2">Focusing on:</div>
              <div className="text-white/90 text-xl font-medium">{task.name}</div>
              {showTimerOnMoon && focusSession && (
                <div className="mt-4">
                  <div className="inline-block px-4 py-2 bg-white/10 rounded-lg">
                    <div className="text-white/80 text-sm">
                      {Math.floor(focusSession.totalTime / 60)}m {focusSession.totalTime % 60}s
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Task Notes Field */}
        <div className="w-full max-w-2xl">
          <textarea
            className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:bg-white/10 focus:border-white/20 focus:outline-none resize-none transition-all"
            placeholder="Task notes..."
            value={task.notes || ''}
            onChange={(e) => onUpdateNotes(e.target.value)}
            rows={drawerState === 'full' ? 2 : 3}
          />
        </div>
      </div>
    </div>
  );
}
