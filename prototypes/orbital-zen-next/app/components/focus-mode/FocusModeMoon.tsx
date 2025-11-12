'use client';

import React from 'react';
import { Subtask, FocusSession } from '@/app/lib/types';
import TimerBadge from '../TimerBadge';

interface FocusModeMoonProps {
  subtask: Subtask;
  taskColor: string;
  focusSession?: FocusSession;
  showTimer: boolean;
}

/**
 * Focus Mode Moon Component
 *
 * Renders a large, detailed moon for the current subtask in focus mode.
 * Much simpler than orbital SubtaskMoons - no complex animations,
 * just a beautiful static (or gently floating) moon display.
 *
 * TODO: Future enhancements
 * - Gentle floating animation
 * - Moon phase visualization based on completion percentage
 * - Surface details at this larger scale
 */
export default function FocusModeMoon({
  subtask,
  taskColor,
  focusSession,
  showTimer,
}: FocusModeMoonProps) {
  // Moon size - much larger than orbital view (about 80-100px diameter)
  const moonSize = 96;

  return (
    <div className="relative">
      {/* The Moon */}
      <div
        className="rounded-full relative"
        style={{
          width: `${moonSize}px`,
          height: `${moonSize}px`,
          background: `radial-gradient(circle at 30% 30%,
            rgba(200, 200, 220, 0.9) 0%,
            rgba(150, 150, 180, 0.7) 40%,
            rgba(100, 100, 140, 0.5) 100%)`,
          boxShadow: `
            0 0 40px ${taskColor}40,
            inset -10px -10px 40px rgba(0, 0, 0, 0.3),
            inset 10px 10px 40px rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Subtle surface texture */}
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background: `
              radial-gradient(circle at 40% 60%, transparent 10px, rgba(0,0,0,0.1) 11px, transparent 12px),
              radial-gradient(circle at 60% 30%, transparent 8px, rgba(0,0,0,0.15) 9px, transparent 10px),
              radial-gradient(circle at 25% 75%, transparent 6px, rgba(0,0,0,0.1) 7px, transparent 8px)
            `,
          }}
        />

        {/* Timer Badge (if showing) */}
        {showTimer && focusSession && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <TimerBadge session={focusSession} size="medium" />
          </div>
        )}
      </div>

      {/* Subtask Name (below moon) */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <p className="text-white/80 text-sm font-medium text-center">{subtask.name}</p>
      </div>
    </div>
  );
}
