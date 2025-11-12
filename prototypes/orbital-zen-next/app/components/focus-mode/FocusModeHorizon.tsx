'use client';

import React from 'react';

interface FocusModeHorizonProps {
  taskColor: string;
  drawerState: 'minimal' | 'intermediate' | 'full';
}

/**
 * Focus Mode Horizon Line
 *
 * Decorative curved line separating sky from AI drawer (planet surface).
 * Uses task color for theming and subtle glow effect.
 */
export default function FocusModeHorizon({ taskColor, drawerState }: FocusModeHorizonProps) {
  // Horizon is less prominent when drawer is full (to reduce visual noise)
  const opacity = drawerState === 'full' ? 0.3 : 0.5;

  return (
    <div className="relative -mt-px z-10">
      {/* SVG Horizon Line */}
      <svg
        className="w-full h-8"
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        style={{ opacity }}
      >
        {/* Gentle arc curve */}
        <path
          d="M 0,7 Q 25,3 50,2 T 100,7 L 100,10 L 0,10 Z"
          fill={taskColor}
          fillOpacity="0.1"
          stroke={taskColor}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Subtle glow effect below horizon */}
      <div
        className="absolute inset-x-0 -top-4 h-8 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center top, ${taskColor}15 0%, transparent 100%)`,
        }}
      />
    </div>
  );
}
