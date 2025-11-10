'use client';

import { useState, useRef, useEffect } from 'react';
import { Task, TaskPriority, Subtask, FocusSession } from '../lib/types';
import TaskNode from './TaskNode';
import AIPanel from './AIPanel';
import SolarSystemView from './SolarSystemView';
import SubtaskMoons from './SubtaskMoons';
import TimerBadge from './TimerBadge';
import { saveTask, getTask } from '../lib/offline-store';
import {
  getActiveFocusSession,
  getAnyFocusSession,
  getFocusSession,
  startFocusSession,
  pauseSession,
  resumeSession,
  endSession,
} from '../lib/focus-session';

interface OrbitalViewProps {
  tasks: Task[];
}

// Starting positions for tasks (clock positions)
// 12, 2, 5, 7, 9 o'clock
const STARTING_ANGLES = [
  -90,   // 12 o'clock (top)
  -30,   // 2 o'clock (top-right)
  60,    // 5 o'clock (bottom-right)
  150,   // 7 o'clock (bottom-left)
  180,   // 9 o'clock (left)
];

// Priority-based orbit radii (higher priority = closer to center)
const PRIORITY_RADII = {
  urgent: { desktop: 100, mobile: 70 },
  high: { desktop: 150, mobile: 105 },
  medium: { desktop: 200, mobile: 140 },
  low: { desktop: 250, mobile: 175 },
};

// Additional orbit radii for tasks beyond the 4 priority levels
// Useful if we want to show more than 5 tasks
const EXTRA_ORBIT_RADII = {
  desktop: [300, 350, 400],
  mobile: [210, 245, 280],
};

// Priority-based z-index (higher priority = higher elevation)
const PRIORITY_Z_INDEX = {
  urgent: 40,
  high: 30,
  medium: 20,
  low: 10,
};

function getOrbitRadius(priority: TaskPriority, isMobile: boolean): number {
  const radii = PRIORITY_RADII[priority];
  return isMobile ? radii.mobile : radii.desktop;
}

function getPriorityZIndex(priority: TaskPriority): number {
  return PRIORITY_Z_INDEX[priority];
}

type ViewLevel = 'galaxy' | 'solar';

export default function OrbitalView({ tasks }: OrbitalViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredTaskPosition, setHoveredTaskPosition] = useState<{ x: number; y: number } | null>(null);
  const [cloneAnimated, setCloneAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>('galaxy');
  const [zoomedTask, setZoomedTask] = useState<Task | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCenterCircle, setShowCenterCircle] = useState(true);

  // Focus session state
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);

  // Completing subtasks state (for smooth completion animation)
  const [completingSubtaskIds, setCompletingSubtaskIds] = useState<Set<string>>(new Set());

  // Find the hovered task data
  const hoveredTask = tasks.find(t => t.id === hoveredTaskId);
  const hoveredTaskIndex = tasks.findIndex(t => t.id === hoveredTaskId);

  // Handle task click for zoom navigation
  const handleTaskClick = (task: Task) => {
    if (viewLevel === 'galaxy') {
      // Clear hover state and overlay immediately
      setHoveredTaskId(null);
      setHoveredTaskPosition(null);

      // Hide center circle immediately
      setShowCenterCircle(false);

      // Start transition
      setIsTransitioning(true);
      setIsZooming(true);

      // Load latest task from IndexedDB to ensure we have current belt position
      getTask(task.id).then((latestTask) => {
        if (latestTask) {
          setZoomedTask(latestTask);
          setSelectedTask(latestTask); // Set as selected to preserve hover appearance

          // Check if there's an active focus session on a subtask for this task
          if (focusSession && focusSession.taskId === task.id && focusSession.subtaskId) {
            const activeSubtask = latestTask.subtasks?.find(st => st.id === focusSession.subtaskId);
            if (activeSubtask) {
              setSelectedSubtask(activeSubtask);
            }
          }
        } else {
          // Fallback to the task from props if not found
          setZoomedTask(task);
          setSelectedTask(task);

          // Check for active focus session on subtask
          if (focusSession && focusSession.taskId === task.id && focusSession.subtaskId) {
            const activeSubtask = task.subtasks?.find(st => st.id === focusSession.subtaskId);
            if (activeSubtask) {
              setSelectedSubtask(activeSubtask);
            }
          }
        }
      });

      // Switch to solar view after animation completes
      setTimeout(() => {
        setViewLevel('solar');
        setIsTransitioning(false);
        // Keep isZooming true so task stays centered for reverse transition
      }, 800);
    } else {
      // In solar view, clicking subtasks just shows details (for now)
      setSelectedTask(task);
    }
  };

  // Handle zoom back to galaxy view
  const handleZoomOut = () => {
    // Start transition - keep hover disabled
    setIsTransitioning(true);

    // Switch back to galaxy view first (task is still centered from solar view)
    setViewLevel('galaxy');

    // Small delay to ensure view switch, then animate back to orbit
    setTimeout(() => {
      setIsZooming(false); // This will animate task from center to orbit

      // Clear remaining states after animation completes
      setTimeout(() => {
        setZoomedTask(null);
        setIsTransitioning(false); // Re-enable hover after full animation

        // Clear selection after transition completes
        setTimeout(() => {
          setSelectedTask(null);
        }, 150);
      }, 800);

      // Fade center circle back in as task returns to orbit
      setTimeout(() => {
        setShowCenterCircle(true);
      }, 500);
    }, 50);
  };

  // Handle ESC key to zoom out
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewLevel === 'solar') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [viewLevel]);

  // Animate clone on next frame after it appears
  useEffect(() => {
    if (hoveredTaskId) {
      setCloneAnimated(false);
      requestAnimationFrame(() => {
        setCloneAnimated(true);
      });
    } else {
      setCloneAnimated(false);
    }
  }, [hoveredTaskId]);

  // Auto-clear selection when back in galaxy view and not transitioning
  useEffect(() => {
    if (viewLevel === 'galaxy' && !isTransitioning && !isZooming && selectedTask) {
      setSelectedTask(null);
    }
  }, [viewLevel, isTransitioning, isZooming, selectedTask]);

  // Load any existing focus session on mount (active or paused)
  useEffect(() => {
    const loadFocusSession = async () => {
      try {
        const session = await getAnyFocusSession();
        if (session) {
          setFocusSession(session);
        }
      } catch (error) {
        console.error('Failed to load focus session:', error);
      }
    };
    loadFocusSession();
  }, []);

  // Handle subtask click (both selection and deselection from circles)
  const handleSubtaskClick = (subtask: Subtask | null) => {
    setSelectedSubtask(subtask);
  };

  // Handle subtask change (selection from panel)
  const handleSubtaskChange = (subtask: Subtask | null) => {
    setSelectedSubtask(subtask);
  };

  // Handle subtask toggle
  const handleToggleSubtask = async (subtaskId: string) => {
    if (!zoomedTask) return;

    // Find and toggle the subtask
    const updatedSubtasks = zoomedTask.subtasks?.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const updatedTask: Task = {
      ...zoomedTask,
      subtasks: updatedSubtasks,
      updatedAt: new Date(),
    };

    // Optimistic UI update
    setZoomedTask(updatedTask);

    // Save to database
    try {
      await saveTask(updatedTask);
    } catch (error) {
      console.error('Failed to save subtask completion:', error);
      // Revert on error
      setZoomedTask(zoomedTask);
    }
  };

  // Focus session handlers
  const handleStartFocus = async () => {
    if (!zoomedTask) return;

    try {
      // startFocusSession automatically pauses any existing active session
      const newSession = await startFocusSession(
        zoomedTask.id,
        selectedSubtask?.id
      );
      setFocusSession(newSession);
    } catch (error) {
      console.error('Failed to start focus session:', error);
    }
  };

  const handlePauseFocus = async () => {
    if (!focusSession) return;

    try {
      await pauseSession(focusSession.id);
      // Reload session by ID to get updated state (including isActive: false)
      const updatedSession = await getFocusSession(focusSession.id);
      setFocusSession(updatedSession || null);
    } catch (error) {
      console.error('Failed to pause focus session:', error);
    }
  };

  const handleResumeFocus = async () => {
    if (!focusSession) return;

    try {
      await resumeSession(focusSession.id);
      // Reload session by ID to get updated state (including isActive: true)
      const updatedSession = await getFocusSession(focusSession.id);
      setFocusSession(updatedSession || null);
    } catch (error) {
      console.error('Failed to resume focus session:', error);
    }
  };

  const handleStopFocus = async () => {
    if (!focusSession) return;

    try {
      // End session (creates TimeEntry in database)
      await endSession(focusSession.id, 'stopped', false);
      setFocusSession(null);
    } catch (error) {
      console.error('Failed to stop focus session:', error);
    }
  };

  return (
    <div
      ref={containerRef}
      className="orbital-system relative w-full h-full flex items-center justify-center overflow-hidden"
      onClick={(e) => {
        // Click background to zoom out
        if (viewLevel === 'solar' && e.target === e.currentTarget) {
          handleZoomOut();
        }
      }}
    >
      {/* Back button / Breadcrumb */}
      {viewLevel === 'solar' && (
        <button
          onClick={handleZoomOut}
          className="absolute top-6 left-6 z-50 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-gray-600/40 rounded-full text-gray-300 hover:text-white hover:border-gray-500 transition-all duration-200 flex items-center gap-2 shadow-lg pointer-events-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Galaxy
        </button>
      )}

      {/* Galaxy View */}
      <div
        className="absolute inset-0 transition-opacity duration-800"
        style={{
          opacity: viewLevel === 'galaxy' ? 1 : 0,
          pointerEvents: viewLevel === 'galaxy' ? 'auto' : 'none',
        }}
      >
        {/* Orbit rings for visual reference */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Desktop rings */}
        {[100, 150, 200, 250].map((radius) => (
          <div
            key={radius}
            className="absolute border border-gray-700/20 rounded-full hidden md:block"
            style={{
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
            }}
          />
        ))}
        {/* Mobile rings */}
        {[70, 105, 140, 175].map((radius) => (
          <div
            key={`mobile-${radius}`}
            className="absolute border border-gray-700/20 rounded-full md:hidden"
            style={{
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
            }}
          />
        ))}
      </div>

      {/* Central focus area - subtle indicator */}
      <div
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: showCenterCircle ? 1 : 0,
        }}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-400/30 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400/40 to-blue-400/40 animate-pulse" />
        </div>
      </div>

      {/* Orbital task containers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {tasks.slice(0, 5).map((task, index) => {
          const desktopRadius = getOrbitRadius(task.priority, false);
          const mobileRadius = getOrbitRadius(task.priority, true);
          const startingAngle = STARTING_ANGLES[index] || 0;
          const isHovered = hoveredTaskId === task.id;
          const baseZIndex = getPriorityZIndex(task.priority);

          return (
            <div
              key={task.id}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                zIndex: baseZIndex,
              }}
            >
              {/* Desktop version */}
              <div className="hidden md:block absolute left-1/2 top-1/2 pointer-events-none">
                <TaskNode
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onClick={() => handleTaskClick(task)}
                  index={index}
                  orbitRadius={desktopRadius}
                  startingAngle={startingAngle}
                  viewLevel={viewLevel}
                  onHoverChange={(id, position) => {
                    // Clear selection when hovering in galaxy view (after transition completes)
                    if (id && viewLevel === 'galaxy' && !isTransitioning && selectedTask) {
                      setSelectedTask(null);
                    }
                    setHoveredTaskId(id);
                    if (position) {
                      setHoveredTaskPosition(position);
                    } else {
                      setHoveredTaskPosition(null);
                    }
                  }}
                  isHoveredElsewhere={hoveredTaskId !== null && hoveredTaskId !== task.id}
                  isZooming={isZooming && zoomedTask?.id === task.id}
                  shouldFadeOut={isZooming && zoomedTask?.id !== task.id}
                  isTransitioning={isTransitioning}
                  focusSession={focusSession || undefined}
                />
                {/* Subtask moon indicators */}
                <SubtaskMoons
                  task={task}
                  orbitRadius={desktopRadius}
                  startingAngle={startingAngle}
                  index={index}
                  isZooming={isZooming && zoomedTask?.id === task.id}
                  showCenterCircle={showCenterCircle}
                  completingSubtaskIds={completingSubtaskIds}
                />
              </div>
              {/* Mobile version */}
              <div className="md:hidden absolute left-1/2 top-1/2 pointer-events-none">
                <TaskNode
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onClick={() => handleTaskClick(task)}
                  index={index}
                  orbitRadius={mobileRadius}
                  startingAngle={startingAngle}
                  viewLevel={viewLevel}
                  onHoverChange={(id, position) => {
                    // Clear selection when hovering in galaxy view (after transition completes)
                    if (id && viewLevel === 'galaxy' && !isTransitioning && selectedTask) {
                      setSelectedTask(null);
                    }
                    setHoveredTaskId(id);
                    if (position) {
                      setHoveredTaskPosition(position);
                    } else {
                      setHoveredTaskPosition(null);
                    }
                  }}
                  isHoveredElsewhere={hoveredTaskId !== null && hoveredTaskId !== task.id}
                  isZooming={isZooming && zoomedTask?.id === task.id}
                  shouldFadeOut={isZooming && zoomedTask?.id !== task.id}
                  isTransitioning={isTransitioning}
                  focusSession={focusSession || undefined}
                />
                {/* Subtask moon indicators */}
                <SubtaskMoons
                  task={task}
                  orbitRadius={mobileRadius}
                  startingAngle={startingAngle}
                  index={index}
                  isZooming={isZooming && zoomedTask?.id === task.id}
                  showCenterCircle={showCenterCircle}
                  completingSubtaskIds={completingSubtaskIds}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlay clone for hovered task - renders on top with matching style */}
      {hoveredTask && hoveredTaskPosition && hoveredTaskIndex !== -1 && (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              left: hoveredTaskPosition.x,
              top: hoveredTaskPosition.y,
              zIndex: 9999,
            }}
          >
            <TaskNode
              task={hoveredTask}
              isSelected={false}
              onClick={() => {}}
              index={hoveredTaskIndex}
              orbitRadius={getOrbitRadius(hoveredTask.priority, false)}
              startingAngle={STARTING_ANGLES[hoveredTaskIndex] || 0}
              onHoverChange={() => {}}
              isClone={true}
              isHoveredElsewhere={false}
              forceHovered={cloneAnimated}
            />
          </div>

          {/* Timer badge for clone - rendered outside to avoid filter stacking context */}
          {focusSession?.taskId === hoveredTask.id && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: hoveredTaskPosition.x,
                top: hoveredTaskPosition.y,
                zIndex: 10000,
              }}
            >
              <div className="absolute inset-0" style={{ width: '7rem', height: '7rem', transform: 'translate(-50%, -50%)' }}>
                <TimerBadge
                  startTime={focusSession.startTime}
                  isActive={focusSession.isActive}
                  lastResumedAt={focusSession.lastResumedAt}
                  totalTime={focusSession.totalTime}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Instructions */}
      {!selectedTask && viewLevel === 'galaxy' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-gray-400 text-sm z-10 pointer-events-none">
          <p className="bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-full">
            Click a task to zoom in and see subtasks
          </p>
        </div>
      )}
      </div>

      {/* Solar System View */}
      <div
        className="absolute inset-0 transition-opacity duration-800"
        style={{
          opacity: viewLevel === 'solar' ? 1 : 0,
          pointerEvents: viewLevel === 'solar' ? 'auto' : 'none',
        }}
      >
        {zoomedTask && (
          <>
            <SolarSystemView
              parentTask={zoomedTask}
              selectedSubtaskId={selectedSubtask?.id}
              onSubtaskClick={handleSubtaskClick}
              onToggleSubtask={handleToggleSubtask}
              onParentClick={handleZoomOut}
              onTaskUpdate={(updatedTask) => setZoomedTask(updatedTask)}
              focusSession={focusSession || undefined}
              completingSubtaskIds={completingSubtaskIds}
            />
            {/* AI Panel - only in solar system view */}
            <AIPanel
              task={zoomedTask}
              subtask={selectedSubtask || undefined}
              focusSession={focusSession || undefined}
              onClose={handleZoomOut}
              onStartFocus={handleStartFocus}
              onPauseFocus={handlePauseFocus}
              onResumeFocus={handleResumeFocus}
              onStopFocus={handleStopFocus}
              onTaskUpdate={(updatedTask) => setZoomedTask(updatedTask)}
              onSubtaskChange={handleSubtaskChange}
              completingSubtaskIds={completingSubtaskIds}
              setCompletingSubtaskIds={setCompletingSubtaskIds}
            />
          </>
        )}
      </div>
    </div>
  );
}
