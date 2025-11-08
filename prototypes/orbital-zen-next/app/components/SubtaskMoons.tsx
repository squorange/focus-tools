'use client';

import { Task } from '../lib/types';

interface SubtaskMoonsProps {
  task: Task;
  orbitRadius: number;
  startingAngle: number;
  index: number;
  isZooming?: boolean;
  showCenterCircle?: boolean;
}

const MOON_ORBIT_RADIUS = 70; // px from parent task center (task radius is 56px, so this orbits ~14px outside)
const MAX_MOONS_TO_SHOW = 5;

// Moon size options (px diameter)
const MOON_SIZES = [4, 6, 8];

// Moon speed durations (seconds)
const MOON_SPEEDS = [40, 50, 70]; // fast, normal, slow

// Simple seeded random for consistent randomness per task
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Get moon starting angle with slight randomness
function getMoonAngle(moonIndex: number, totalMoons: number, taskId: string): number {
  const baseAngle = (360 / totalMoons) * moonIndex;
  // Add random jitter of ±20 degrees for organic placement
  const seed = taskId.charCodeAt(0) * 1000 + moonIndex;
  const jitter = (seededRandom(seed) * 40) - 20; // -20 to +20 degrees
  return baseAngle + jitter;
}

// Get random moon size based on index
function getMoonSize(moonIndex: number, taskId: string): number {
  const seed = taskId.charCodeAt(0) * 100 + moonIndex;
  const index = Math.floor(seededRandom(seed) * MOON_SIZES.length);
  return MOON_SIZES[index];
}

// Get random moon speed duration based on index
function getMoonSpeed(moonIndex: number, taskId: string): number {
  const seed = taskId.charCodeAt(0) * 500 + moonIndex;
  const index = Math.floor(seededRandom(seed) * MOON_SPEEDS.length);
  return MOON_SPEEDS[index];
}

// Get moon orbit class based on speed
function getMoonOrbitClass(speed: number): string {
  if (speed === 40) return 'moon-orbit-fast';
  if (speed === 70) return 'moon-orbit-slow';
  return 'moon-orbit-normal';
}

// Get parent orbit animation class based on parent task orbit radius
function getParentOrbitClass(parentRadius: number): string {
  if (parentRadius <= 120) return 'orbit-fast';
  if (parentRadius >= 200) return 'orbit-slow';
  return 'orbit-medium';
}

function getParentCounterOrbitClass(parentRadius: number): string {
  if (parentRadius <= 120) return 'counter-orbit-fast';
  if (parentRadius >= 200) return 'counter-orbit-slow';
  return 'counter-orbit-medium';
}

export default function SubtaskMoons({ task, orbitRadius, startingAngle, index, isZooming = false, showCenterCircle = true }: SubtaskMoonsProps) {
  const subtasks = task.subtasks || [];
  const moonsToShow = Math.min(subtasks.length, MAX_MOONS_TO_SHOW);

  if (moonsToShow === 0) return null;

  const parentOrbitClass = getParentOrbitClass(orbitRadius);
  const parentCounterOrbitClass = getParentCounterOrbitClass(orbitRadius);

  return (
    <>
      {Array.from({ length: moonsToShow }).map((_, moonIndex) => {
        const moonAngle = getMoonAngle(moonIndex, moonsToShow, task.id);
        const moonSize = getMoonSize(moonIndex, task.id);
        const moonSpeed = getMoonSpeed(moonIndex, task.id);
        const moonOrbitClass = getMoonOrbitClass(moonSpeed);
        const halfSize = moonSize / 2;

        return (
          <div
            key={`moon-${task.id}-${moonIndex}`}
            className="absolute left-0 top-0 pointer-events-none"
            style={{
              transformStyle: 'preserve-3d',
              opacity: showCenterCircle && !isZooming ? 1 : 0,
              transition: 'opacity 0.8s ease',
            }}
          >
            {/* Layer 1: Parent orbit rotation (follows parent task around center) */}
            <div
              className={`${parentOrbitClass} absolute left-0 top-0 ${isZooming ? 'zooming' : ''}`}
              style={{
                animationDelay: `${index * -8}s`,
                transformStyle: 'preserve-3d',
                ['--starting-angle' as string]: `${startingAngle}deg`,
              }}
            >
              {/* Layer 2: Parent radius positioning (places moon at task location) */}
              <div
                className="absolute"
                style={{
                  transform: `translateX(${orbitRadius}px)`,
                  transformStyle: 'preserve-3d',
                  left: '-3.5rem',
                  top: '-3.5rem',
                }}
              >
                {/* Layer 3: Counter-rotation to keep moon oriented */}
                <div
                  className={`${parentCounterOrbitClass} absolute left-0 top-0 ${isZooming ? 'zooming' : ''}`}
                  style={{
                    animationDelay: `${index * -8}s`,
                    transformStyle: 'preserve-3d',
                    ['--starting-angle' as string]: `${startingAngle}deg`,
                    left: '3.5rem',
                    top: '3.5rem',
                  }}
                >
                  {/* Layer 4: Moon orbit around task */}
                  <div
                    className={`${moonOrbitClass} absolute ${isZooming ? 'zooming' : ''}`}
                    style={{
                      transformStyle: 'preserve-3d',
                      ['--moon-starting-angle' as string]: `${moonAngle}deg`,
                    }}
                  >
                    {/* Layer 5: Moon radius positioning */}
                    <div
                      className="absolute"
                      style={{
                        transform: `translateX(${MOON_ORBIT_RADIUS}px)`,
                        left: `-${halfSize}px`,
                        top: `-${halfSize}px`,
                      }}
                    >
                      {/* The moon itself */}
                      <div
                        className="rounded-full"
                        style={{
                          width: `${moonSize}px`,
                          height: `${moonSize}px`,
                          background: 'radial-gradient(circle, rgba(140, 110, 180, 0.25), rgba(100, 130, 180, 0.2))',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
