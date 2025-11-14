'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Subtask, FocusSession } from '@/app/lib/types';
import TimerBadge from '../TimerBadge';

interface FocusModeMoonProps {
  subtask: Subtask;
  taskColor: string;
  focusSession?: FocusSession;
  showTimer: boolean;
  drawerState: 'minimal' | 'intermediate' | 'full';
}

/**
 * Focus Mode Moon Component
 *
 * Renders a large, flat-styled moon for the current subtask.
 * Moon phases cycle based on session duration (30s for testing, 25min production).
 *
 * Phase System:
 * - Waxes and wanes: full → new → full
 * - Visual feedback for focus time
 * - Matches solar system subtask node styling
 *
 * Scaling:
 * - Scales down when drawer is full to save space
 */
export default function FocusModeMoon({
  subtask,
  taskColor,
  focusSession,
  showTimer,
  drawerState,
}: FocusModeMoonProps) {
  // Moon size - larger for focus mode prominence
  const moonSize = drawerState === 'full' ? 120 : 160;

  // Glow scales with moon size and is much more subtle when drawer is full
  const glowScale = moonSize / 160; // Normalized to base size
  const glowIntensity = drawerState === 'full' ? 0.3 : 1; // Reduce to 30% when drawer full
  const purpleGlow = `0 0 ${15 * glowScale * glowIntensity}px ${2 * glowScale * glowIntensity}px rgba(168, 85, 247, ${0.08 * glowIntensity})`;
  const whiteGlow = `0 0 ${20 * glowScale * glowIntensity}px ${4 * glowScale * glowIntensity}px rgba(255, 255, 255, ${0.10 * glowIntensity})`;

  // Live elapsed time (updates every second for smooth animation)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!focusSession) {
      setElapsedSeconds(0);
      return;
    }

    // Calculate elapsed time
    const calculateElapsed = (): number => {
      // If paused, return stored totalTime
      if (!focusSession.isActive) {
        return focusSession.totalTime;
      }

      // If active, calculate: totalTime + (now - lastResumedAt)
      const now = Date.now();
      const runningSince = focusSession.lastResumedAt
        ? new Date(focusSession.lastResumedAt).getTime()
        : new Date(focusSession.startTime).getTime();

      const currentRunSeconds = Math.floor((now - runningSince) / 1000);
      return focusSession.totalTime + currentRunSeconds;
    };

    // Set initial value immediately
    setElapsedSeconds(calculateElapsed());

    // Update every 100ms for smoother animation (10fps)
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, 100);

    return () => clearInterval(interval);
  }, [focusSession]);

  // Calculate moon phase (30s cycle for testing)
  // Waxes and wanes: full → new → full
  const phasePercentage = useMemo(() => {
    if (!focusSession) return 100; // Full moon

    const cycleSeconds = 30; // 30 seconds (testing - was 25 * 60 for production)
    const progress = (elapsedSeconds % cycleSeconds) / cycleSeconds;

    // Cosine wave: full (100%) → new (0%) → full (100%)
    const phaseValue = ((Math.cos(progress * Math.PI * 2) + 1) / 2) * 100;
    return phaseValue; // Keep as decimal for smooth SVG transitions
  }, [elapsedSeconds, focusSession]);

  // Generate SVG path for moon phase (realistic terminator curve)
  const generateMoonPath = (phase: number): string => {
    const cx = 50; // Center X
    const cy = 50; // Center Y
    const r = 49.5; // Radius (nearly fills SVG canvas)

    // Normalize phase: 0 = new moon, 100 = full moon
    const normalized = phase / 100;

    // Calculate terminator position (-1 to 1, where 0 is center)
    // Waxing: terminator moves left to right
    // Waning: terminator moves right to left
    const terminatorX = (normalized - 0.5) * 2; // -1 to 1

    // Ellipse width factor (creates curved terminator)
    // At quarter moons (25%, 75%), terminator is straight (width = 0)
    // Between quarters, terminator curves (ellipse)
    const curveWidth = Math.abs(Math.sin(normalized * Math.PI * 2)) * r;

    // Calculate the lit portion using SVG path
    if (normalized >= 0.5) {
      // Waning: more than half moon visible (right side lit)
      const offset = (normalized - 0.5) * 2 * r; // 0 to r
      return `
        M ${cx} ${cy - r}
        A ${r} ${r} 0 0 1 ${cx} ${cy + r}
        A ${curveWidth} ${r} 0 0 ${normalized > 0.75 ? 1 : 0} ${cx} ${cy - r}
      `;
    } else {
      // Waxing: less than half moon visible (left side lit)
      const offset = (0.5 - normalized) * 2 * r; // r to 0
      return `
        M ${cx} ${cy - r}
        A ${r} ${r} 0 0 0 ${cx} ${cy + r}
        A ${curveWidth} ${r} 0 0 ${normalized < 0.25 ? 0 : 1} ${cx} ${cy - r}
      `;
    }
  };

  return (
    <div className="relative" style={{ background: 'transparent', overflow: 'visible' }}>
      {/* Shadow wrapper - diffuse glow that scales with moon size */}
      <div
        className="rounded-full"
        style={{
          width: `${moonSize}px`,
          height: `${moonSize}px`,
          boxShadow: `${purpleGlow}, ${whiteGlow}`,
        }}
      >
        {/* The Moon - SVG with realistic phases */}
        <svg
          width={moonSize}
          height={moonSize}
          viewBox="0 0 100 100"
          className="transition-all duration-500 ease-out block"
          style={{
            background: 'transparent',
            display: 'block',
          }}
        >
          {/* Gradients matching solar system style */}
          <defs>
            <radialGradient id="moonBase" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(140, 110, 180, 0.08)" />
              <stop offset="100%" stopColor="rgba(100, 130, 180, 0.06)" />
            </radialGradient>
            <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(168, 85, 247, 0.10)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.10)" />
            </linearGradient>
          </defs>

          {/* Base gradient layer */}
          <circle cx="50" cy="50" r="49.5" fill="url(#moonBase)" opacity="0.95" />

          {/* Illuminated portion (phase path) */}
          <path
            d={generateMoonPath(phasePercentage)}
            fill="url(#moonGradient)"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Timer Badge (if showing) - gap adjusts based on drawer state */}
      {showTimer && focusSession && (
        <div style={{ marginTop: drawerState === 'full' ? '0px' : '24px', position: 'relative', height: '28px' }}>
          <TimerBadge
            startTime={focusSession.startTime}
            isActive={focusSession.isActive}
            lastResumedAt={focusSession.lastResumedAt}
            totalTime={focusSession.totalTime}
            size={drawerState === 'full' ? 'default' : 'large'}
          />
        </div>
      )}
    </div>
  );
}
