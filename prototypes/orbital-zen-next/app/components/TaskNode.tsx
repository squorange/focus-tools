'use client';

import { Task, FocusSession } from '../lib/types';
import { useState, useRef, useEffect } from 'react';
import TimerBadge from './TimerBadge';

type ViewLevel = 'galaxy' | 'solar';

interface TaskNodeProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  index: number;
  orbitRadius: number;
  startingAngle: number;
  onHoverChange: (taskId: string | null, position?: { x: number; y: number } | null) => void;
  isClone?: boolean;
  isHoveredElsewhere?: boolean;
  isZooming?: boolean;
  shouldFadeOut?: boolean;
  isTransitioning?: boolean;
  forceHovered?: boolean;
  viewLevel?: ViewLevel;
  focusSession?: FocusSession;
}

const priorityConfig = {
  urgent: {
    bg: 'bg-slate-900/20',
    bgHover: 'hover:bg-red-900/30',
    bgSelected: 'bg-red-900/30',
    border: 'border-red-500/15',
    borderHover: 'hover:border-red-400/40',
    borderSelected: 'border-red-400/40',
    glow: 'shadow-slate-950/20',
    glowHover: 'hover:shadow-red-600/40',
    text: 'text-gray-300/85',
    textHover: 'hover:text-red-200',
    textSelected: 'text-red-200',
    zIndex: 40,
  },
  high: {
    bg: 'bg-slate-900/20',
    bgHover: 'hover:bg-orange-900/30',
    bgSelected: 'bg-orange-900/30',
    border: 'border-orange-500/15',
    borderHover: 'hover:border-orange-400/40',
    borderSelected: 'border-orange-400/40',
    glow: 'shadow-slate-950/20',
    glowHover: 'hover:shadow-orange-600/40',
    text: 'text-gray-300/85',
    textHover: 'hover:text-orange-200',
    textSelected: 'text-orange-200',
    zIndex: 30,
  },
  medium: {
    bg: 'bg-slate-900/20',
    bgHover: 'hover:bg-yellow-900/30',
    bgSelected: 'bg-yellow-900/30',
    border: 'border-yellow-500/15',
    borderHover: 'hover:border-yellow-400/40',
    borderSelected: 'border-yellow-400/40',
    glow: 'shadow-slate-950/20',
    glowHover: 'hover:shadow-yellow-600/40',
    text: 'text-gray-300/85',
    textHover: 'hover:text-yellow-200',
    textSelected: 'text-yellow-200',
    zIndex: 20,
  },
  low: {
    bg: 'bg-slate-900/20',
    bgHover: 'hover:bg-blue-900/30',
    bgSelected: 'bg-blue-900/30',
    border: 'border-blue-500/15',
    borderHover: 'hover:border-blue-400/40',
    borderSelected: 'border-blue-400/40',
    glow: 'shadow-slate-950/20',
    glowHover: 'hover:shadow-blue-600/40',
    text: 'text-gray-300/85',
    textHover: 'hover:text-blue-200',
    textSelected: 'text-blue-200',
    zIndex: 10,
  },
};

// Map orbit distance to animation class
const getOrbitClass = (radius: number) => {
  if (radius <= 120) return 'orbit-fast';
  if (radius >= 200) return 'orbit-slow';
  return 'orbit-medium';
};

const getCounterOrbitClass = (radius: number) => {
  if (radius <= 120) return 'counter-orbit-fast';
  if (radius >= 200) return 'counter-orbit-slow';
  return 'counter-orbit-medium';
};

export default function TaskNode({
  task,
  isSelected,
  onClick,
  index,
  orbitRadius,
  startingAngle,
  onHoverChange,
  isClone = false,
  isHoveredElsewhere = false,
  isZooming = false,
  shouldFadeOut = false,
  isTransitioning = false,
  forceHovered = false,
  viewLevel = 'galaxy',
  focusSession,
}: TaskNodeProps) {
  const priority = priorityConfig[task.priority];
  const orbitClass = getOrbitClass(orbitRadius);
  const counterOrbitClass = getCounterOrbitClass(orbitRadius);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Use forceHovered for clone, or local hover state for original
  const effectiveHovered = forceHovered || isHovered;

  // Compute directly from props - NO STATE LAG
  const showAsSelected = isSelected && (viewLevel === 'solar' || isTransitioning);

  // Check if this task or any of its subtasks is in focus (show glow/timer even when paused)
  const isInFocus = focusSession?.taskId === task.id;

  // Clear hover state when transition completes to force re-evaluation
  useEffect(() => {
    if (!isClone && !isTransitioning && isHovered) {
      // Transition just completed, clear hover state to force mouse position check
      setIsHovered(false);
    }
  }, [isTransitioning, isClone, isHovered]);

  // Computed style values - priority-specific colors for matching fill appearance
  const computedBgColor =
    showAsSelected || effectiveHovered
      ? task.priority === 'urgent'
        ? 'rgba(127, 29, 29, 0.3)' // red-900
        : task.priority === 'high'
          ? 'rgba(124, 45, 18, 0.3)' // orange-900
          : task.priority === 'medium'
            ? 'rgba(113, 63, 18, 0.3)' // yellow-900
            : 'rgba(30, 58, 138, 0.3)' // blue-900
      : 'rgba(15, 23, 42, 0.2)'; // slate-900 default

  const computedBorderColor =
    showAsSelected || effectiveHovered
      ? task.priority === 'urgent'
        ? 'rgba(248, 113, 113, 0.4)'
        : task.priority === 'high'
          ? 'rgba(251, 146, 60, 0.4)'
          : task.priority === 'medium'
            ? 'rgba(250, 204, 21, 0.4)'
            : 'rgba(96, 165, 250, 0.4)'
      : task.priority === 'urgent'
        ? 'rgba(239, 68, 68, 0.15)'
        : task.priority === 'high'
          ? 'rgba(249, 115, 22, 0.15)'
          : task.priority === 'medium'
            ? 'rgba(234, 179, 8, 0.15)'
            : 'rgba(59, 130, 246, 0.15)';

  const computedTextColor =
    showAsSelected || effectiveHovered
      ? task.priority === 'urgent'
        ? '#fecaca'
        : task.priority === 'high'
          ? '#fed7aa'
          : task.priority === 'medium'
            ? '#fef08a'
            : '#bfdbfe'
      : 'rgba(209, 213, 219, 0.85)';

  const computedGradient =
    showAsSelected || effectiveHovered
      ? 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))'
      : 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.08))';

  // Apply styles directly to DOM with !important to override Tailwind
  useEffect(() => {
    if (!isClone && buttonRef.current) {
      buttonRef.current.style.setProperty('background-color', computedBgColor, 'important');
      buttonRef.current.style.setProperty('border-color', computedBorderColor, 'important');
      buttonRef.current.style.setProperty(
        'transition',
        'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      );
    }

    if (!isClone && gradientRef.current) {
      gradientRef.current.style.setProperty('background', computedGradient, 'important');
      gradientRef.current.style.setProperty(
        'transition',
        'background 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      );
    }

    if (!isClone && textRef.current) {
      textRef.current.style.setProperty('color', computedTextColor, 'important');
      textRef.current.style.setProperty('transition', 'color 300ms cubic-bezier(0.4, 0, 0.2, 1)');
    }
  }, [computedBgColor, computedBorderColor, computedGradient, computedTextColor, isClone, task.id]);

  const handleMouseEnter = () => {
    if (isClone) return; // Clone doesn't respond to hover
    if (isTransitioning) return; // Don't respond to hover during any transition

    // Calculate button's position relative to viewport for overlay clone
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      onHoverChange(task.id, { x: centerX, y: centerY });
    } else {
      onHoverChange(task.id);
    }

    // Delay setting hover to allow clone to appear first
    requestAnimationFrame(() => {
      setIsHovered(true);
    });
  };

  const handleMouseLeave = () => {
    if (isClone) return; // Clone doesn't respond to hover
    if (isTransitioning) return; // Don't respond to hover during any transition

    setIsHovered(false);
    onHoverChange(null, null);
  };

  // Determine if we should show hover effects
  const showHoverEffects = isClone || isHovered;
  const showDimmed = isHoveredElsewhere && !isClone;

  // Clone animates scale from 1 to 1.05 to match original
  if (isClone) {
    return (
      <div
        className="absolute transition-transform duration-300"
        style={{
          transform: effectiveHovered
            ? 'translate(-50%, -50%) scale(1.05)'
            : 'translate(-50%, -50%) scale(1)',
          filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))',
        }}
      >
        <button
          className={`
            task-node
            ${effectiveHovered ? priority.bgSelected : priority.bg}
            ${effectiveHovered ? priority.borderSelected : priority.border}
            ${priority.glow}
            border
            rounded-full
            shadow-2xl
            flex items-center justify-center
            pointer-events-none
            relative
            transition-all duration-300
            ${isInFocus ? 'animate-glow-focus' : ''}
          `}
          style={{
            width: '7rem',
            height: '7rem',
          }}
        >
          {/* Gradient overlay matching hovered state */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
            style={{
              background: effectiveHovered
                ? 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))'
                : 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.08))',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`${effectiveHovered ? priority.textSelected : priority.text} text-xs md:text-sm font-medium text-center px-3 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-colors duration-300`}
            >
              {task.title}
            </div>
          </div>
        </button>
      </div>
    );
  }

  // Original task with animations
  return (
    // Layer 1: Elevation - DOM order handles stacking, this just adds visual depth
    <div
      className="absolute left-0 top-0"
      style={{
        transformStyle: 'preserve-3d',
        transition: 'opacity 0.8s ease',
        opacity: shouldFadeOut ? 0 : showDimmed ? 0.3 : 1,
      }}
    >
      {/* Layer 2: Orbit rotation (0 to 360deg) + starting angle offset */}
      <div
        className={`${orbitClass} absolute left-0 top-0 ${isZooming ? 'zooming' : ''}`}
        style={{
          animationDelay: `${index * -8}s`,
          transformStyle: 'preserve-3d',
          // Pass starting angle as CSS variable for animation
          ['--starting-angle' as string]: `${startingAngle}deg`,
        }}
      >
        {/* Layer 3: Radius positioning */}
        <div
          className="absolute"
          style={{
            transform: `translateX(${isZooming ? 0 : orbitRadius}px)`,
            transformStyle: 'preserve-3d',
            left: '-3.5rem',
            top: '-3.5rem',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Layer 4: The visible button (scales on hover) */}
          <button
            ref={buttonRef}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`task-node rounded-full cursor-pointer shadow-2xl flex items-center justify-center relative overflow-hidden ${isInFocus ? 'animate-glow-focus' : ''}`}
            style={{
              width: '7rem',
              height: '7rem',
              pointerEvents: isTransitioning ? 'none' : 'auto',
              transform: effectiveHovered && !isZooming ? 'scale(1.05)' : 'scale(1)',
              borderWidth: '1px',
              borderStyle: 'solid',
              // Transitions are applied via useEffect + setProperty()
            }}
          >
            {/* Subtle gradient overlay matching center point */}
            <div ref={gradientRef} className="absolute inset-0 rounded-full pointer-events-none" />
            {/* Layer 5: Counter-orbit animation (cancels orbit rotation to keep text horizontal) */}
            <div
              className={`${counterOrbitClass} absolute inset-0 flex items-center justify-center ${isZooming ? 'zooming' : ''}`}
              style={{
                animationDelay: `${index * -8}s`,
                // Pass same starting angle for counter-rotation
                ['--starting-angle' as string]: `${startingAngle}deg`,
              }}
            >
              {/* Layer 6: Content */}
              <div
                ref={textRef}
                className="text-xs md:text-sm font-medium text-center px-3 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              >
                {task.title}
              </div>
            </div>
          </button>

          {/* Timer badge wrapper with counter-rotation - always rendered to stay in sync */}
          <div
            className={`${counterOrbitClass} absolute inset-0 pointer-events-none ${isZooming ? 'zooming' : ''}`}
            style={{
              animationDelay: `${index * -8}s`,
              ['--starting-angle' as string]: `${startingAngle}deg`,
              zIndex: 1002, // Always above the clone overlay
            }}
          >
            {/* Only show timer badge when task is in focus */}
            {isInFocus && focusSession && (
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
}
