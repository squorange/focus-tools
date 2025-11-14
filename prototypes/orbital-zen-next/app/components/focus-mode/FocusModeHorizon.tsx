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
  return (
    <div className="relative z-10 overflow-visible" style={{ height: '0px' }}>
      {/* SVG Horizon Line - decorative edge at drawer top */}
      <svg
        className="w-full h-6 absolute top-0 z-10"
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
      >
        {/* Gentle arc curve */}
        <path
          d="M 0,4 Q 25,1 50,0.5 T 100,4"
          fill="none"
          stroke={taskColor}
          strokeWidth="1"
          strokeOpacity="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
