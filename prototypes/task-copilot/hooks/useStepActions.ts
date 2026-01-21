/**
 * useStepActions.ts
 *
 * Hook for step operations. Wraps pure functions from step-utils.ts
 * and handles state updates.
 *
 * Usage:
 * const { completeStep, updateStepText, ... } = useStepActions(state, setState, mode);
 *
 * The mode parameter determines whether we're editing:
 * - 'executing': Today's instance (or task.steps for one-off tasks)
 * - 'managing': Template (recurring tasks only)
 */

import { useCallback } from 'react';
import { AppState, Task, Step, Substep } from '@/lib/types';
import { Mode } from '@/lib/step-utils';
import * as stepUtils from '@/lib/step-utils';
import { generateId, createStep as createNewStep } from '@/lib/types';
import { getActiveOccurrenceDate, getTodayISO } from '@/lib/recurring-utils';

// ============================================
// Types
// ============================================

export interface UseStepActionsOptions {
  onStepComplete?: (taskId: string, stepId: string, completed: boolean) => void;
  onError?: (error: Error) => void;
}

export interface StepActions {
  // Step operations
  completeStep: (taskId: string, stepId: string, completed: boolean) => void;
  updateStepText: (taskId: string, stepId: string, text: string) => void;
  updateStepEstimate: (taskId: string, stepId: string, minutes: number | null, source: 'user' | 'ai' | null) => void;
  deleteStep: (taskId: string, stepId: string) => void;
  addStep: (taskId: string, text?: string, afterIndex?: number) => void;
  moveStep: (taskId: string, stepId: string, direction: 'up' | 'down') => void;

  // Substep operations
  completeSubstep: (taskId: string, stepId: string, substepId: string, completed: boolean) => void;
  updateSubstepText: (taskId: string, stepId: string, substepId: string, text: string) => void;
  deleteSubstep: (taskId: string, stepId: string, substepId: string) => void;
  addSubstep: (taskId: string, stepId: string, text?: string) => void;
  moveSubstep: (taskId: string, stepId: string, substepId: string, direction: 'up' | 'down') => void;

  // Utilities
  getDisplaySteps: (task: Task) => Step[];
  getActiveDate: (task: Task) => string;
}

// ============================================
// Hook
// ============================================

export function useStepActions(
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  mode: Mode,
  options: UseStepActionsOptions = {}
): StepActions {
  const { onStepComplete, onError } = options;

  // Helper to get active date for a task
  const getActiveDate = useCallback((task: Task): string => {
    if (!task.isRecurring || !task.recurrence) {
      return getTodayISO(); // Not used for one-off, but return something valid
    }
    return getActiveOccurrenceDate(task) || getTodayISO();
  }, []);

  // Helper to update a task in state
  const updateTask = useCallback((taskId: string, updateFn: (task: Task) => Task) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? updateFn(t) : t),
    }));
  }, [setState]);

  // ============================================
  // Step Operations
  // ============================================

  const completeStep = useCallback((taskId: string, stepId: string, completed: boolean) => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.completeStep(task, stepId, completed, mode, activeDate);

        // Check if task should be marked complete (all steps done)
        let finalTask = updatedTask;
        const displaySteps = stepUtils.getDisplaySteps(updatedTask, mode, activeDate);
        const allComplete = displaySteps.length > 0 && displaySteps.every(s => s.completed);

        if (allComplete && updatedTask.completionType === 'step_based' && !updatedTask.isRecurring) {
          finalTask = {
            ...updatedTask,
            status: 'complete',
            completedAt: Date.now(),
          };
        }

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? finalTask : t),
        };
      });

      onStepComplete?.(taskId, stepId, completed);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onStepComplete, onError]);

  const updateStepText = useCallback((taskId: string, stepId: string, text: string) => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.updateStepText(task, stepId, text, mode, activeDate);

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t),
        };
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onError]);

  const updateStepEstimate = useCallback((
    taskId: string,
    stepId: string,
    minutes: number | null,
    source: 'user' | 'ai' | null
  ) => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.updateStepEstimate(task, stepId, minutes, source, mode, activeDate);

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t),
        };
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onError]);

  const deleteStep = useCallback((taskId: string, stepId: string) => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.deleteStep(task, stepId, mode, activeDate);

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t),
        };
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onError]);

  const addStep = useCallback((taskId: string, text: string = '', afterIndex?: number) => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const newStep = createNewStep(text, { source: 'manual' });
        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.addStep(task, newStep, mode, afterIndex, activeDate);

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t),
        };
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onError]);

  const moveStep = useCallback((taskId: string, stepId: string, direction: 'up' | 'down') => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.moveStep(task, stepId, direction, mode, activeDate);

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t),
        };
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onError]);

  // ============================================
  // Substep Operations
  // ============================================

  const completeSubstep = useCallback((
    taskId: string,
    stepId: string,
    substepId: string,
    completed: boolean
  ) => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.completeSubstep(task, stepId, substepId, completed, mode, activeDate);

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t),
        };
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onError]);

  const updateSubstepText = useCallback((
    taskId: string,
    stepId: string,
    substepId: string,
    text: string
  ) => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.updateSubstepText(task, stepId, substepId, text, mode, activeDate);

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t),
        };
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onError]);

  const deleteSubstep = useCallback((taskId: string, stepId: string, substepId: string) => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.deleteSubstep(task, stepId, substepId, mode, activeDate);

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t),
        };
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onError]);

  const addSubstep = useCallback((taskId: string, stepId: string, text: string = '') => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const newSubstep: Substep = {
          id: generateId(),
          text,
          shortLabel: null,
          completed: false,
          completedAt: null,
          skipped: false,
          source: 'manual',
        };

        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.addSubstep(task, stepId, newSubstep, mode, activeDate);

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t),
        };
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onError]);

  const moveSubstep = useCallback((
    taskId: string,
    stepId: string,
    substepId: string,
    direction: 'up' | 'down'
  ) => {
    try {
      setState(prev => {
        const task = prev.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        const activeDate = getActiveDate(task);
        const updatedTask = stepUtils.moveSubstep(task, stepId, substepId, direction, mode, activeDate);

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t),
        };
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [setState, mode, getActiveDate, onError]);

  // ============================================
  // Utilities
  // ============================================

  const getDisplaySteps = useCallback((task: Task): Step[] => {
    const activeDate = getActiveDate(task);
    return stepUtils.getDisplaySteps(task, mode, activeDate);
  }, [mode, getActiveDate]);

  return {
    // Step operations
    completeStep,
    updateStepText,
    updateStepEstimate,
    deleteStep,
    addStep,
    moveStep,

    // Substep operations
    completeSubstep,
    updateSubstepText,
    deleteSubstep,
    addSubstep,
    moveSubstep,

    // Utilities
    getDisplaySteps,
    getActiveDate,
  };
}

export default useStepActions;
