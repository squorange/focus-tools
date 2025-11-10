'use client';

import { Task, Subtask, TaskPriority, FocusSession } from '../lib/types';
import { useState, useEffect } from 'react';
import TimerBadge from './TimerBadge';
import PriorityMarker from './PriorityMarker';
import { saveTask } from '../lib/offline-store';
import {
  getSubtaskAngle,
  getSubtaskOrbitRadius,
  getSubtaskRadiusWithBelt,
  SUBTASK_ORBIT_RADII,
  getStableAnimationDelay,
  getMarkerRadius,
  radiusToRing,
  getCurrentMarkerRing,
  recalculateRadii,
} from '../lib/orbit-utils';

interface SolarSystemViewProps {
  parentTask: Task;
  selectedSubtaskId?: string;
  onSubtaskClick: (subtask: Subtask | null) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onParentClick?: () => void;
  onTaskUpdate?: (task: Task) => void;
  focusSession?: FocusSession;
  completingSubtaskIds: Set<string>;
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

// Get stable animation class based on subtask ID (not radius)
// This prevents animation restarts when radius changes
function getSubtaskOrbitClass(subtaskId: string): string {
  // Use ID hash to pick a speed variant for visual variety
  const hash = subtaskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variant = hash % 3;
  if (variant === 0) return 'orbit-subtask-fast';
  if (variant === 1) return 'orbit-subtask-medium';
  return 'orbit-subtask-slow';
}

function getSubtaskCounterOrbitClass(subtaskId: string): string {
  // Match the orbit class variant
  const hash = subtaskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variant = hash % 3;
  if (variant === 0) return 'counter-orbit-subtask-fast';
  if (variant === 1) return 'counter-orbit-subtask-medium';
  return 'counter-orbit-subtask-slow';
}

export default function SolarSystemView({ parentTask, selectedSubtaskId, onSubtaskClick, onToggleSubtask, onParentClick, onTaskUpdate, focusSession, completingSubtaskIds }: SolarSystemViewProps) {
  const [hoveredSubtaskId, setHoveredSubtaskId] = useState<string | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(false);

  // Show all subtasks (completed ones will be styled differently)
  const subtasks = parentTask.subtasks || [];
  const priority = priorityConfig[parentTask.priority];

  // Check if parent task is in focus (show even when paused)
  const isParentInFocus = focusSession?.taskId === parentTask.id && !focusSession?.subtaskId;

  // Use priorityMarkerRing directly for visual position (source of truth)
  // Only calculate automatic position during subtask completion (in AIPanel)
  const currentMarkerRing = parentTask.priorityMarkerRing || 0;

  // Celebration only happens when all original targets are complete
  // Check that we have targets AND they're all complete
  const allTargetsComplete = parentTask.priorityMarkerOriginalIds &&
    parentTask.priorityMarkerOriginalIds.length > 0 &&
    parentTask.priorityMarkerOriginalIds.every(id => {
      const subtask = parentTask.subtasks?.find(st => st.id === id);
      return subtask?.completed === true;
    });
  const isCelebrating = allTargetsComplete && parentTask.priorityMarkerEnabled;

  // Fade in subtasks after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSubtasks(true);
    }, 600); // Start fading in after parent transition

    return () => clearTimeout(timer);
  }, []);

  // Marker tap handlers
  const handleMoveInward = async () => {
    if (!onTaskUpdate) return;

    // Minimum ring is 2 (encircling the innermost subtask at ring 1)
    const newRing = Math.max(2, currentMarkerRing - 1);

    // Get subtask IDs that are inside the belt (before the belt ring)
    const subtasksInsideBelt = subtasks.slice(0, newRing - 1).map(st => st.id);

    // Recalculate subtask radii with new belt position
    const updatedSubtasks = recalculateRadii(parentTask.subtasks || [], newRing);

    const updatedTask: Task = {
      ...parentTask,
      subtasks: updatedSubtasks,
      priorityMarkerRing: newRing,
      priorityMarkerOriginalIds: subtasksInsideBelt,
      updatedAt: new Date(),
    };

    await saveTask(updatedTask);
    onTaskUpdate(updatedTask);
  };

  const handleMoveOutward = async () => {
    if (!onTaskUpdate) return;

    const newRing = Math.min(subtasks.length + 1, currentMarkerRing + 1);

    // Get subtask IDs that are inside the belt (before the belt ring)
    const subtasksInsideBelt = subtasks.slice(0, newRing - 1).map(st => st.id);

    // Recalculate subtask radii with new belt position
    const updatedSubtasks = recalculateRadii(parentTask.subtasks || [], newRing);

    const updatedTask: Task = {
      ...parentTask,
      subtasks: updatedSubtasks,
      priorityMarkerRing: newRing,
      priorityMarkerOriginalIds: subtasksInsideBelt,
      updatedAt: new Date(),
    };

    await saveTask(updatedTask);
    onTaskUpdate(updatedTask);
  };

  // Calculate orbital ring radii accounting for belt position
  const getOrbitalRingRadii = (): number[] => {
    if (subtasks.length === 0) return [];

    const radii: number[] = [];

    // Add a ring for each subtask position
    for (let i = 0; i < subtasks.length; i++) {
      const radius = subtasks[i].assignedOrbitRadius !== undefined
        ? subtasks[i].assignedOrbitRadius!
        : getSubtaskRadiusWithBelt(i, parentTask.priorityMarkerRing);

      if (!radii.includes(radius)) {
        radii.push(radius);
      }
    }

    // Add belt ring if marker is enabled and visible (not in celebration mode)
    if (parentTask.priorityMarkerEnabled && currentMarkerRing > 0) {
      const beltRadius = getMarkerRadius(currentMarkerRing);
      if (!radii.includes(beltRadius)) {
        radii.push(beltRadius);
      }
    }

    return radii.sort((a, b) => a - b);
  };

  const orbitalRingRadii = getOrbitalRingRadii();

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Orbit rings for subtasks */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 ease-in-out"
        style={{
          opacity: showSubtasks ? 1 : 0,
        }}
      >
        {orbitalRingRadii.map((radius) => (
          <div
            key={radius}
            className="absolute border border-gray-700/20 rounded-full transition-all duration-500 ease-in-out"
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
          onClick={() => {
            if (selectedSubtaskId) {
              // Subtask is selected → deselect it to show parent details
              onSubtaskClick(null);
            } else {
              // Parent already selected → zoom out to galaxy view
              onParentClick?.();
            }
          }}
          className={`
            w-28 h-28 rounded-full
            ${priority.bgHover}
            ${priority.borderHover}
            backdrop-blur-xl border
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
            lastResumedAt={focusSession.lastResumedAt}
            totalTime={focusSession.totalTime}
          />
        )}
      </div>

      {/* Subtasks orbiting the parent */}
      {subtasks.map((subtask, index) => {
        // Use assigned angle if available, otherwise fallback to calculated
        const startingAngle = subtask.assignedStartingAngle !== undefined
          ? subtask.assignedStartingAngle
          : getSubtaskAngle(index, subtasks.length);

        // Use assigned radius if available, otherwise fallback to calculated
        const orbitRadius = subtask.assignedOrbitRadius !== undefined
          ? subtask.assignedOrbitRadius
          : getSubtaskOrbitRadius(index);

        // Use stable classes based on ID, not radius
        const orbitClass = getSubtaskOrbitClass(subtask.id);
        const counterOrbitClass = getSubtaskCounterOrbitClass(subtask.id);
        const isHovered = hoveredSubtaskId === subtask.id;
        const isSelected = selectedSubtaskId === subtask.id;
        const isDimmed = (hoveredSubtaskId != null && !isHovered) || (selectedSubtaskId != null && !isSelected);
        const isCompleting = completingSubtaskIds.has(subtask.id);
        const isCompleted = subtask.completed;

        // Check if this subtask is in focus (show even when paused)
        const isSubtaskInFocus = focusSession?.taskId === parentTask.id && focusSession?.subtaskId === subtask.id;

        return (
          <div
            key={subtask.id}
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 ease-in-out"
            style={{
              zIndex: 10,
              opacity: showSubtasks ? (isCompleting ? 0 : isCompleted ? 0.4 : isDimmed ? 0.3 : 1) : 0,
              transform: isCompleting ? 'scale(0.5)' : 'scale(1)',
            }}
          >
              {/* Orbit rotation */}
              <div
                className={`${orbitClass} absolute left-1/2 top-1/2 pointer-events-none`}
                style={{
                  animationDelay: `${getStableAnimationDelay(subtask.id)}s`,
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                  ['--starting-angle' as string]: `${startingAngle}deg`,
                }}
              >
                {/* Radius positioning - smooth transition when radius changes */}
                <div
                  className="absolute transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(${orbitRadius}px) translateZ(0)`,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                    left: '-2.5rem',
                    top: '-2.5rem',
                  }}
                >
                  {/* Subtask button */}
                  <button
                  onClick={() => {
                    // Toggle selection: deselect if already selected
                    if (selectedSubtaskId === subtask.id) {
                      onSubtaskClick(null);
                    } else {
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
                    backdrop-blur-xl border
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
                      animationDelay: `${getStableAnimationDelay(subtask.id)}s`,
                      ['--starting-angle' as string]: `${startingAngle}deg`,
                    }}
                  >
                    {/* Title */}
                    <div className={`text-xs text-center px-2 leading-tight transition-colors duration-300 ${(isSelected || isHovered) ? 'text-gray-100' : 'text-gray-300/85'} ${isCompleted ? 'line-through opacity-60' : ''}`}>
                      {subtask.title}
                    </div>
                  </div>
                </button>

                {/* Timer badge wrapper with counter-rotation - always rendered to stay in sync */}
                <div
                  className={`${counterOrbitClass} absolute inset-0 pointer-events-none`}
                  style={{
                    animationDelay: `${getStableAnimationDelay(subtask.id)}s`,
                    ['--starting-angle' as string]: `${startingAngle}deg`,
                  }}
                >
                  {/* Only show timer badge when subtask is in focus */}
                  {isSubtaskInFocus && focusSession && (
                    <TimerBadge
                      startTime={focusSession.startTime}
                      isActive={focusSession.isActive}
                      lastResumedAt={focusSession.lastResumedAt}
                      totalTime={focusSession.totalTime}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Priority Marker */}
      {parentTask.priorityMarkerEnabled && (
        <PriorityMarker
          radius={getMarkerRadius(currentMarkerRing)}
          style="foggyRing"
          onMoveInward={handleMoveInward}
          onMoveOutward={handleMoveOutward}
          canMoveInward={currentMarkerRing > 2}
          canMoveOutward={currentMarkerRing < subtasks.length + 1}
          isCelebrating={isCelebrating}
        />
      )}
    </div>
  );
}
