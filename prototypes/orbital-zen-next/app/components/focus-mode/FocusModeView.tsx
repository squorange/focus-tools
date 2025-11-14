'use client';

import React, { useState } from 'react';
import { Task, Subtask, FocusSession } from '@/app/lib/types';
import FocusModeTopNav from './FocusModeTopNav';
import FocusModeSky from './FocusModeSky';
import AIDrawer from './AIDrawer';

interface FocusModeViewProps {
  task: Task;
  subtask?: Subtask;
  focusSession: FocusSession;
  onExitFocusMode: () => void;
  onPauseSession: () => void;
  onStopSession: () => void;
  onCompleteTask: () => void;
  onUpdateTask: (updates: Partial<Task>) => void;
}

/**
 * Focus Mode View - Planet Surface Experience
 *
 * Renders the immersive focus mode where user "lands" on the task planet.
 * Three-state layout with sky (moon + notes), horizon, and AI drawer.
 *
 * TODO: Future enhancements
 * - Break reminder system (sky brightens to dawn, sun traverses during break)
 * - Multiple moons for parent task focus mode (all subtasks as constellation)
 * - Entry/exit zoom animations from orbital view
 */
export default function FocusModeView({
  task,
  subtask,
  focusSession,
  onExitFocusMode,
  onPauseSession,
  onStopSession,
  onCompleteTask,
  onUpdateTask,
}: FocusModeViewProps) {
  const [drawerState, setDrawerState] = useState<'minimal' | 'intermediate' | 'full'>('minimal');

  // Determine task color for theming
  const taskColor = task.color || '#8b5cf6'; // Default purple

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-visible">
      {/* Top Navigation Bar */}
      <FocusModeTopNav
        taskName={task.title}
        subtaskName={subtask?.title}
        focusSession={focusSession}
        showTimer={false}
        onBack={onExitFocusMode}
        onPause={onPauseSession}
        onStop={onStopSession}
        onComplete={onCompleteTask}
      />

      {/* Main Content Area - Sky + Drawer */}
      <div className="relative flex-1 flex flex-col">
        {/* Sky Area - full height background layer */}
        <FocusModeSky
          task={task}
          subtask={subtask}
          focusSession={focusSession}
          drawerState={drawerState}
          showTimerOnMoon={true}
          showNotesField={drawerState !== 'full'}
          taskColor={taskColor}
          onUpdateNotes={(notes) => onUpdateTask({ notes })}
          onCompleteTask={onCompleteTask}
        />

        {/* AI Drawer - foreground layer with planet surface */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <AIDrawer
            drawerState={drawerState}
            task={task}
            taskColor={taskColor}
            taskNotes={task.notes || ''}
            onChangeDrawerState={setDrawerState}
            onUpdateNotes={(notes) => onUpdateTask({ notes })}
          />
        </div>
      </div>
    </div>
  );
}
