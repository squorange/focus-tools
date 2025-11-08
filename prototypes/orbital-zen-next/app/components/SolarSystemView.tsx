'use client';

import { Task, Subtask, TaskPriority, FocusSession } from '../lib/types';
import { useState, useEffect } from 'react';
import TimerBadge from './TimerBadge';

interface SolarSystemViewProps {
  parentTask: Task;
  onSubtaskClick: (subtask: Subtask) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onParentClick?: () => void;
  focusSession?: FocusSession;
}

// Priority-based styling (matching TaskNode in galaxy view)
const priorityConfig = {
  urgent: {
    bg: 'bg-slate-900/20',
    bgHover: 'bg-red-900/30',
    border: 'border-red-500/15',
    borderHover: 'border-red-400/40',
    text: 'text-gray-300/85',
    textHover: 'text-red-200',
  },
  high: {
    bg: 'bg-slate-900/20',
    bgHover: 'bg-orange-900/30',
    border: 'border-orange-500/15',
    borderHover: 'border-orange-400/40',
    text: 'text-gray-300/85',
    textHover: 'text-orange-200',
  },
  medium: {
    bg: 'bg-slate-900/20',
    bgHover: 'bg-yellow-900/30',
    border: 'border-yellow-500/15',
    borderHover: 'border-yellow-400/40',
    text: 'text-gray-300/85',
    textHover: 'text-yellow-200',
  },
  low: {
    bg: 'bg-slate-900/20',
    bgHover: 'bg-blue-900/30',
    border: 'border-blue-500/15',
    borderHover: 'border-blue-400/40',
    text: 'text-gray-300/85',
    textHover: 'text-blue-200',
  },
};

// Multiple orbit radii for subtasks (like priority levels in galaxy view)
// Expanded to support more subtasks without overlap
const SUBTASK_ORBIT_RADII = [115, 155, 195, 235, 275];

// Evenly distribute subtasks around the circle
function getSubtaskAngle(index: number, total: number): number {
  return (360 / total) * index - 90; // Start at top
}

// Assign orbit radius based on index
function getSubtaskOrbitRadius(index: number): number {
  return SUBTASK_ORBIT_RADII[index % SUBTASK_ORBIT_RADII.length];
}

// Map orbit radius to animation class (closer = faster, farther = slower)
function getSubtaskOrbitClass(radius: number): string {
  if (radius <= 130) return 'orbit-subtask-fast';
  if (radius >= 220) return 'orbit-subtask-slow';
  return 'orbit-subtask-medium';
}

function getSubtaskCounterOrbitClass(radius: number): string {
  if (radius <= 130) return 'counter-orbit-subtask-fast';
  if (radius >= 220) return 'counter-orbit-subtask-slow';
  return 'counter-orbit-subtask-medium';
}

export default function SolarSystemView({ parentTask, onSubtaskClick, onToggleSubtask, onParentClick, focusSession }: SolarSystemViewProps) {
  const [hoveredSubtaskId, setHoveredSubtaskId] = useState<string | null>(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const subtasks = parentTask.subtasks || [];
  const priority = priorityConfig[parentTask.priority];

  // Check if parent task is in focus (show even when paused)
  const isParentInFocus = focusSession?.taskId === parentTask.id && !focusSession?.subtaskId;

  // Fade in subtasks after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSubtasks(true);
    }, 600); // Start fading in after parent transition

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Orbit rings for subtasks */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 ease-in-out"
        style={{
          opacity: showSubtasks ? 1 : 0,
        }}
      >
        {SUBTASK_ORBIT_RADII.map((radius) => (
          <div
            key={radius}
            className="absolute border border-gray-700/20 rounded-full"
            style={{
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
            }}
          />
        ))}
      </div>

      {/* Parent task in center (acts as sun) - matches galaxy view styling */}
      <div className="absolute z-20 relative">
        <button
          onClick={onParentClick}
          className={`
            w-28 h-28 rounded-full
            ${priority.bgHover}
            ${priority.borderHover}
            backdrop-blur-xl border-2
            flex items-center justify-center
            shadow-2xl
            relative overflow-hidden
            cursor-pointer
            transition-all duration-300
            hover:scale-105
            ${isParentInFocus ? 'animate-glow-focus' : ''}
          `}
        >
          {/* Gradient overlay matching galaxy view */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))',
            }}
          />
          <div className={`${priority.textHover} text-xs md:text-sm font-medium text-center px-3 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
            {parentTask.title}
          </div>
        </button>

        {/* Timer badge for focus on parent (no rotation needed - already static) */}
        {isParentInFocus && focusSession && (
          <TimerBadge
            startTime={focusSession.startTime}
            isActive={focusSession.isActive}
            pausedAt={focusSession.pausedAt}
            totalTime={focusSession.totalTime}
          />
        )}
      </div>

      {/* Subtasks orbiting the parent */}
      {subtasks.map((subtask, index) => {
        const startingAngle = getSubtaskAngle(index, subtasks.length);
        const orbitRadius = getSubtaskOrbitRadius(index);
        const orbitClass = getSubtaskOrbitClass(orbitRadius);
        const counterOrbitClass = getSubtaskCounterOrbitClass(orbitRadius);
        const isHovered = hoveredSubtaskId === subtask.id;
        const isSelected = selectedSubtaskId === subtask.id;
        const isDimmed = (hoveredSubtaskId !== null && !isHovered) || (selectedSubtaskId !== null && !isSelected);

        // Check if this subtask is in focus (show even when paused)
        const isSubtaskInFocus = focusSession?.taskId === parentTask.id && focusSession?.subtaskId === subtask.id;

        return (
          <div
            key={subtask.id}
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 ease-in-out"
            style={{
              zIndex: 10,
              opacity: showSubtasks ? (isDimmed ? 0.3 : 1) : 0,
            }}
          >
            {/* Orbit rotation */}
            <div
              className={`${orbitClass} absolute left-1/2 top-1/2 pointer-events-none`}
              style={{
                animationDelay: `${index * -3}s`,
                transformStyle: 'preserve-3d',
                ['--starting-angle' as string]: `${startingAngle}deg`,
              }}
            >
              {/* Radius positioning */}
              <div
                className="absolute"
                style={{
                  transform: `translateX(${orbitRadius}px)`,
                  transformStyle: 'preserve-3d',
                  left: '-2.5rem',
                  top: '-2.5rem',
                }}
              >
                {/* Subtask button */}
                <button
                  onClick={() => {
                    // Toggle selection: deselect if already selected
                    if (selectedSubtaskId === subtask.id) {
                      setSelectedSubtaskId(null);
                    } else {
                      setSelectedSubtaskId(subtask.id);
                      onSubtaskClick(subtask);
                    }
                  }}
                  onMouseEnter={() => setHoveredSubtaskId(subtask.id)}
                  onMouseLeave={() => setHoveredSubtaskId(null)}
                  className={`
                    subtask-node
                    w-20 h-20 rounded-full
                    ${isSelected
                      ? 'bg-slate-800/40 border-gray-400/40'
                      : isHovered
                      ? 'bg-slate-800/40 border-gray-400/40'
                      : 'bg-slate-900/20 border-gray-500/15'
                    }
                    backdrop-blur-xl border-2
                    flex flex-col items-center justify-center
                    cursor-pointer
                    transition-all duration-300
                    shadow-2xl
                    pointer-events-auto
                    relative overflow-hidden
                    ${isSubtaskInFocus ? 'animate-glow-focus' : ''}
                  `}
                >
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
                    style={{
                      background: (isSelected || isHovered)
                        ? 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))'
                        : 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.08))',
                    }}
                  />

                  {/* Counter-rotation for content */}
                  <div
                    className={`${counterOrbitClass} absolute inset-0 flex flex-col items-center justify-center`}
                    style={{
                      animationDelay: `${index * -3}s`,
                      ['--starting-angle' as string]: `${startingAngle}deg`,
                    }}
                  >
                    {/* Title */}
                    <div className={`text-xs text-center px-2 leading-tight transition-colors duration-300 ${(isSelected || isHovered) ? 'text-gray-100' : 'text-gray-300/85'}`}>
                      {subtask.title}
                    </div>
                  </div>
                </button>

                {/* Timer badge wrapper with counter-rotation - always rendered to stay in sync */}
                <div
                  className={`${counterOrbitClass} absolute inset-0 pointer-events-none`}
                  style={{
                    animationDelay: `${index * -3}s`,
                    ['--starting-angle' as string]: `${startingAngle}deg`,
                  }}
                >
                  {/* Only show timer badge when subtask is in focus */}
                  {isSubtaskInFocus && focusSession && (
                    <TimerBadge
                      startTime={focusSession.startTime}
                      isActive={focusSession.isActive}
                      pausedAt={focusSession.pausedAt}
                      totalTime={focusSession.totalTime}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
