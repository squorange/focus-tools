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
  showNotesField: boolean;
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
  showNotesField,
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

  return (
    <div
      className="absolute inset-0 overflow-visible"
      style={{
        background: `
          radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.04), transparent 60%),
          radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.03), transparent 50%),
          linear-gradient(to bottom, #11112a 0%, #1c1c38 50%, #20234a 100%)
        `,
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
      <div className="relative h-full flex flex-col items-center py-8 px-4">
        {/* Moon Area (current subtask or empty for parent task) */}
        <div
          className={`flex items-center justify-center transition-all duration-500 ${
            drawerState === 'minimal' ? 'mt-[12vh]' :
            drawerState === 'intermediate' ? 'mt-[8vh]' :
            'mt-[calc(4vh+18px)]'
          }`}
        >
          {subtask ? (
            <div className="relative" style={{ background: 'transparent', border: 'none' }}>
              {/* Render single moon for current subtask */}
              <FocusModeMoon
                subtask={subtask}
                taskColor={taskColor}
                focusSession={focusSession}
                showTimer={showTimerOnMoon}
                drawerState={drawerState}
              />
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

        {/* Task Notes Field (hidden when drawer is full - notes move to drawer) */}
        {showNotesField && (
          <div className={`w-full max-w-2xl transition-all duration-500 ${
            drawerState === 'minimal' ? 'mt-[calc(21vh-30px)]' :
            drawerState === 'intermediate' ? 'mt-[11vh]' :
            'mt-[4vh]'
          }`}>
            <textarea
              className="w-full px-4 py-3 bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:bg-black/40 focus:border-white/30 focus:outline-none resize-none transition-all duration-200 shadow-lg"
              placeholder="Task notes..."
              value={task.notes || ''}
              onChange={(e) => onUpdateNotes(e.target.value)}
              rows={4}
            />
          </div>
        )}
      </div>
    </div>
  );
}
