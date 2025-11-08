'use client';

import { Task } from '../lib/types';

interface SubtaskMoonsProps {
  task: Task;
  orbitRadius: number;
  startingAngle: number;
  index: number;
}

const MOON_ORBIT_RADIUS = 30; // px from parent task center
const MAX_MOONS_TO_SHOW = 5;

// Distribute moons evenly around the parent task
function getMoonAngle(moonIndex: number, totalMoons: number, parentStartAngle: number): number {
  const baseAngle = (360 / totalMoons) * moonIndex;
  return baseAngle + parentStartAngle;
}

// Get orbit animation class based on parent orbit radius
function getMoonOrbitClass(parentRadius: number): string {
  if (parentRadius <= 120) return 'orbit-fast';
  if (parentRadius >= 200) return 'orbit-slow';
  return 'orbit-medium';
}

function getMoonCounterOrbitClass(parentRadius: number): string {
  if (parentRadius <= 120) return 'counter-orbit-fast';
  if (parentRadius >= 200) return 'counter-orbit-slow';
  return 'counter-orbit-medium';
}

export default function SubtaskMoons({ task, orbitRadius, startingAngle, index }: SubtaskMoonsProps) {
  const subtasks = task.subtasks || [];
  const moonsToShow = Math.min(subtasks.length, MAX_MOONS_TO_SHOW);

  if (moonsToShow === 0) return null;

  const orbitClass = getMoonOrbitClass(orbitRadius);
  const counterOrbitClass = getMoonCounterOrbitClass(orbitRadius);

  return (
    <>
      {Array.from({ length: moonsToShow }).map((_, moonIndex) => {
        const moonAngle = getMoonAngle(moonIndex, moonsToShow, 0);

        return (
          <div
            key={`moon-${task.id}-${moonIndex}`}
            className="absolute left-0 top-0 pointer-events-none"
            style={{
              transformStyle: 'preserve-3d',
              opacity: 0.6,
            }}
          >
            {/* Layer 1: Parent orbit rotation (same as parent task) */}
            <div
              className={`${orbitClass} absolute left-0 top-0`}
              style={{
                animationDelay: `${index * -8}s`,
                transformStyle: 'preserve-3d',
                ['--starting-angle' as string]: `${startingAngle}deg`,
              }}
            >
              {/* Layer 2: Parent radius positioning (same as parent task) */}
              <div
                className="absolute"
                style={{
                  transform: `translateX(${orbitRadius}px)`,
                  transformStyle: 'preserve-3d',
                  left: '-3.5rem',
                  top: '-3.5rem',
                }}
              >
                {/* Layer 3: Counter-rotation to stay oriented */}
                <div
                  className={`${counterOrbitClass} absolute left-0 top-0`}
                  style={{
                    animationDelay: `${index * -8}s`,
                    transformStyle: 'preserve-3d',
                    ['--starting-angle' as string]: `${startingAngle}deg`,
                    left: '3.5rem',
                    top: '3.5rem',
                  }}
                >
                  {/* Layer 4: Moon orbit around parent task */}
                  <div
                    className="absolute"
                    style={{
                      transform: `rotate(${moonAngle}deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Layer 5: Moon radius positioning */}
                    <div
                      className="absolute"
                      style={{
                        transform: `translateX(${MOON_ORBIT_RADIUS}px)`,
                        left: '-2px',
                        top: '-2px',
                      }}
                    >
                      {/* The moon dot itself */}
                      <div
                        className="w-1 h-1 rounded-full bg-gray-400/40 shadow-sm"
                        style={{
                          boxShadow: '0 0 2px rgba(156, 163, 175, 0.3)',
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
