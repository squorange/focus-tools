'use client';

/**
 * TaskDetailContext.tsx
 *
 * Provides task detail state and actions to all children.
 * Eliminates prop drilling for mode, task, and step actions.
 *
 * Usage:
 * <TaskDetailProvider task={task} mode="executing" state={state} setState={setState}>
 *   <TaskDetail />
 * </TaskDetailProvider>
 *
 * In child components:
 * const { mode, task, stepActions } = useTaskDetailContext();
 */

import React, { createContext, useContext, useMemo } from 'react';
import { Task, Step, AppState } from '@/lib/types';
import { Mode } from '@/lib/step-utils';
import { useStepActions, StepActions } from '@/hooks/useStepActions';

// ============================================
// Types
// ============================================

export interface TaskDetailContextValue {
  // Core state
  task: Task;
  mode: Mode;

  // Display helpers
  displaySteps: Step[];
  activeDate: string;

  // Step actions
  stepActions: StepActions;

  // Convenience: is this a recurring task?
  isRecurring: boolean;
}

// ============================================
// Context
// ============================================

const TaskDetailContext = createContext<TaskDetailContextValue | null>(null);

// ============================================
// Provider
// ============================================

export interface TaskDetailProviderProps {
  task: Task;
  mode: Mode;
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  children: React.ReactNode;
}

export function TaskDetailProvider({
  task,
  mode,
  state,
  setState,
  children,
}: TaskDetailProviderProps) {
  // Get step actions hook
  const stepActions = useStepActions(state, setState, mode);

  // Compute display steps
  const displaySteps = useMemo(() => {
    return stepActions.getDisplaySteps(task);
  }, [stepActions, task]);

  // Get active date
  const activeDate = useMemo(() => {
    return stepActions.getActiveDate(task);
  }, [stepActions, task]);

  // Build context value
  const value = useMemo<TaskDetailContextValue>(() => ({
    task,
    mode,
    displaySteps,
    activeDate,
    stepActions,
    isRecurring: Boolean(task.isRecurring && task.recurrence),
  }), [task, mode, displaySteps, activeDate, stepActions]);

  return (
    <TaskDetailContext.Provider value={value}>
      {children}
    </TaskDetailContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useTaskDetailContext(): TaskDetailContextValue {
  const context = useContext(TaskDetailContext);

  if (!context) {
    throw new Error(
      'useTaskDetailContext must be used within a TaskDetailProvider'
    );
  }

  return context;
}

// ============================================
// Optional Hook (returns null if not in provider)
// ============================================

export function useTaskDetailContextOptional(): TaskDetailContextValue | null {
  return useContext(TaskDetailContext);
}

export default TaskDetailContext;
