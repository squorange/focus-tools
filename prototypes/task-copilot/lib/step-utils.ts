/**
 * step-utils.ts
 *
 * Pure functions for step operations. These functions:
 * - Take immutable inputs
 * - Return new objects (never mutate)
 * - Have no side effects
 * - Are testable in isolation
 *
 * For stateful operations, use hooks/useStepActions.ts
 *
 * Key concept: Mode determines data target
 * - 'executing': Working on today's instance (or task.steps for one-off)
 * - 'managing': Editing the template (recurring tasks only)
 *
 * @example
 * const steps = getDisplaySteps(task, 'executing', activeDate);
 * const updatedTask = completeStep(task, stepId, true, 'executing', activeDate);
 */

import { Task, Step, Substep, RecurringInstance } from './types';
import { getTodayISO, ensureInstance, createInstance, getActiveOccurrenceDate } from './recurring-utils';

// ============================================
// Types
// ============================================

export type Mode = 'executing' | 'managing';

export interface StepLocation {
  found: boolean;
  isInstance: boolean;  // true = instance.steps, false = task.steps
  index: number;
  step: Step | null;
}

export interface SubstepLocation extends StepLocation {
  substepIndex: number;
  substep: Substep | null;
}

// ============================================
// Step Retrieval
// ============================================

/**
 * Get the steps to display based on mode and task type.
 *
 * - One-off tasks: always return task.steps
 * - Recurring + executing: return instance.steps
 * - Recurring + managing: return task.steps (template)
 */
export function getDisplaySteps(
  task: Task,
  mode: Mode,
  activeDate?: string
): Step[] {
  // One-off tasks: always use task.steps
  if (!task.isRecurring || !task.recurrence) {
    return task.steps;
  }

  // Recurring in managing mode: use template
  if (mode === 'managing') {
    return task.steps;
  }

  // Recurring in executing mode: use instance steps
  const date = activeDate || getActiveOccurrenceDate(task) || getTodayISO();
  const instance = task.recurringInstances?.find(i => i.date === date);

  if (instance) {
    return instance.steps;
  }

  // No instance yet, fall back to template
  return task.steps;
}

/**
 * Find a step by its display ID (1-based index like "1", "2", "3")
 */
export function findStepByDisplayId(
  task: Task,
  displayId: string,
  mode: Mode,
  activeDate?: string
): StepLocation {
  const index = parseInt(displayId, 10) - 1;

  if (isNaN(index) || index < 0) {
    return { found: false, isInstance: false, index: -1, step: null };
  }

  // One-off tasks or managing mode: use task.steps
  if (!task.isRecurring || !task.recurrence || mode === 'managing') {
    if (index < task.steps.length) {
      return { found: true, isInstance: false, index, step: task.steps[index] };
    }
    return { found: false, isInstance: false, index: -1, step: null };
  }

  // Recurring in executing mode: use instance.steps
  const date = activeDate || getActiveOccurrenceDate(task) || getTodayISO();
  const instance = task.recurringInstances?.find(i => i.date === date);

  if (!instance) {
    return { found: false, isInstance: true, index: -1, step: null };
  }

  if (index < instance.steps.length) {
    return { found: true, isInstance: true, index, step: instance.steps[index] };
  }

  return { found: false, isInstance: true, index: -1, step: null };
}

/**
 * Find a step by its UUID (internal ID)
 */
export function findStepByUUID(
  task: Task,
  stepId: string,
  mode: Mode,
  activeDate?: string
): StepLocation {
  // One-off tasks or managing mode: use task.steps
  if (!task.isRecurring || !task.recurrence || mode === 'managing') {
    const index = task.steps.findIndex(s => s.id === stepId);
    if (index !== -1) {
      return { found: true, isInstance: false, index, step: task.steps[index] };
    }
    return { found: false, isInstance: false, index: -1, step: null };
  }

  // Recurring in executing mode: use instance.steps
  const date = activeDate || getActiveOccurrenceDate(task) || getTodayISO();
  const instance = task.recurringInstances?.find(i => i.date === date);

  if (!instance) {
    return { found: false, isInstance: true, index: -1, step: null };
  }

  const index = instance.steps.findIndex(s => s.id === stepId);
  if (index !== -1) {
    return { found: true, isInstance: true, index, step: instance.steps[index] };
  }

  return { found: false, isInstance: true, index: -1, step: null };
}

// ============================================
// Step Operations (Pure Functions)
// ============================================

/**
 * Complete or uncomplete a step.
 * Returns a new task with the step completion state updated.
 */
export function completeStep(
  task: Task,
  stepId: string,
  completed: boolean,
  mode: Mode,
  activeDate?: string
): Task {
  const now = Date.now();
  const location = findStepByUUID(task, stepId, mode, activeDate);

  if (!location.found) {
    return task; // Step not found, return unchanged
  }

  const updateStep = (step: Step): Step => ({
    ...step,
    completed,
    completedAt: completed ? now : null,
  });

  return updateStepAtLocation(task, location, updateStep, mode, activeDate);
}

/**
 * Update step text.
 * In executing mode for recurring tasks, also clears origin to indicate user modification.
 */
export function updateStepText(
  task: Task,
  stepId: string,
  text: string,
  mode: Mode,
  activeDate?: string
): Task {
  const location = findStepByUUID(task, stepId, mode, activeDate);

  if (!location.found) {
    return task;
  }

  const isRecurringExecuting = task.isRecurring && task.recurrence && mode === 'executing';
  const updateStep = (step: Step): Step => ({
    ...step,
    text: text.trim(),
    wasEdited: true,
    ...(isRecurringExecuting ? { origin: null } : {}),
  });

  return updateStepAtLocation(task, location, updateStep, mode, activeDate);
}

/**
 * Update step estimate.
 */
export function updateStepEstimate(
  task: Task,
  stepId: string,
  estimatedMinutes: number | null,
  estimateSource: 'user' | 'ai' | null,
  mode: Mode,
  activeDate?: string
): Task {
  const location = findStepByUUID(task, stepId, mode, activeDate);

  if (!location.found) {
    return task;
  }

  const updateStep = (step: Step): Step => ({
    ...step,
    estimatedMinutes,
    estimateSource,
  });

  return updateStepAtLocation(task, location, updateStep, mode, activeDate);
}

/**
 * Delete a step.
 */
export function deleteStep(
  task: Task,
  stepId: string,
  mode: Mode,
  activeDate?: string
): Task {
  const location = findStepByUUID(task, stepId, mode, activeDate);

  if (!location.found) {
    return task;
  }

  return deleteStepAtLocation(task, location, mode, activeDate);
}

/**
 * Add a new step.
 */
export function addStep(
  task: Task,
  newStep: Step,
  mode: Mode,
  afterIndex?: number,
  activeDate?: string
): Task {
  // One-off tasks or managing mode: add to task.steps
  if (!task.isRecurring || !task.recurrence || mode === 'managing') {
    const newSteps = [...task.steps];
    if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < newSteps.length) {
      newSteps.splice(afterIndex + 1, 0, newStep);
    } else {
      newSteps.push(newStep);
    }
    return { ...task, steps: newSteps, updatedAt: Date.now() };
  }

  // Recurring in executing mode: add to instance.steps
  const date = activeDate || getActiveOccurrenceDate(task) || getTodayISO();
  let instance = task.recurringInstances?.find(i => i.date === date);

  if (!instance) {
    instance = createInstance(task, date);
  }

  // Add step with origin marker
  const stepWithOrigin = { ...newStep, origin: newStep.origin || ('manual' as const) };
  const updatedSteps = [...instance.steps, stepWithOrigin];

  const updatedInstance: RecurringInstance = {
    ...instance,
    steps: updatedSteps,
  };

  const updatedInstances = (task.recurringInstances || [])
    .filter(i => i.date !== date)
    .concat(updatedInstance);

  return {
    ...task,
    recurringInstances: updatedInstances,
    updatedAt: Date.now(),
  };
}

/**
 * Move a step up or down.
 */
export function moveStep(
  task: Task,
  stepId: string,
  direction: 'up' | 'down',
  mode: Mode,
  activeDate?: string
): Task {
  const location = findStepByUUID(task, stepId, mode, activeDate);

  if (!location.found) {
    return task;
  }

  return moveStepAtLocation(task, location, direction, mode, activeDate);
}

// ============================================
// Substep Operations
// ============================================

/**
 * Complete or uncomplete a substep.
 */
export function completeSubstep(
  task: Task,
  stepId: string,
  substepId: string,
  completed: boolean,
  mode: Mode,
  activeDate?: string
): Task {
  const now = Date.now();
  const location = findStepByUUID(task, stepId, mode, activeDate);

  if (!location.found || !location.step) {
    return task;
  }

  const updateStep = (step: Step): Step => ({
    ...step,
    substeps: step.substeps.map(sub =>
      sub.id === substepId
        ? { ...sub, completed, completedAt: completed ? now : null }
        : sub
    ),
  });

  return updateStepAtLocation(task, location, updateStep, mode, activeDate);
}

/**
 * Update substep text.
 */
export function updateSubstepText(
  task: Task,
  stepId: string,
  substepId: string,
  text: string,
  mode: Mode,
  activeDate?: string
): Task {
  const location = findStepByUUID(task, stepId, mode, activeDate);

  if (!location.found || !location.step) {
    return task;
  }

  const updateStep = (step: Step): Step => ({
    ...step,
    substeps: step.substeps.map(sub =>
      sub.id === substepId
        ? { ...sub, text: text.trim() }
        : sub
    ),
  });

  return updateStepAtLocation(task, location, updateStep, mode, activeDate);
}

/**
 * Add a substep to a step.
 */
export function addSubstep(
  task: Task,
  stepId: string,
  newSubstep: Substep,
  mode: Mode,
  activeDate?: string
): Task {
  const location = findStepByUUID(task, stepId, mode, activeDate);

  if (!location.found || !location.step) {
    return task;
  }

  const updateStep = (step: Step): Step => ({
    ...step,
    substeps: [...step.substeps, newSubstep],
  });

  return updateStepAtLocation(task, location, updateStep, mode, activeDate);
}

/**
 * Delete a substep.
 */
export function deleteSubstep(
  task: Task,
  stepId: string,
  substepId: string,
  mode: Mode,
  activeDate?: string
): Task {
  const location = findStepByUUID(task, stepId, mode, activeDate);

  if (!location.found || !location.step) {
    return task;
  }

  const updateStep = (step: Step): Step => ({
    ...step,
    substeps: step.substeps.filter(sub => sub.id !== substepId),
  });

  return updateStepAtLocation(task, location, updateStep, mode, activeDate);
}

/**
 * Move a substep up or down.
 */
export function moveSubstep(
  task: Task,
  stepId: string,
  substepId: string,
  direction: 'up' | 'down',
  mode: Mode,
  activeDate?: string
): Task {
  const location = findStepByUUID(task, stepId, mode, activeDate);

  if (!location.found || !location.step) {
    return task;
  }

  const updateStep = (step: Step): Step => {
    const substeps = [...step.substeps];
    const currentIndex = substeps.findIndex(sub => sub.id === substepId);

    if (currentIndex === -1) return step;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= substeps.length) return step;

    // Swap
    [substeps[currentIndex], substeps[newIndex]] = [substeps[newIndex], substeps[currentIndex]];

    return { ...step, substeps };
  };

  return updateStepAtLocation(task, location, updateStep, mode, activeDate);
}

// ============================================
// Internal Helpers
// ============================================

/**
 * Update a step at a given location.
 * Routes to task.steps or instance.steps based on location.isInstance.
 */
function updateStepAtLocation(
  task: Task,
  location: StepLocation,
  updateFn: (step: Step) => Step,
  mode: Mode,
  activeDate?: string
): Task {
  const now = Date.now();

  // task.steps (one-off, or managing mode)
  if (!location.isInstance) {
    return {
      ...task,
      steps: task.steps.map((s, idx) =>
        idx === location.index ? updateFn(s) : s
      ),
      updatedAt: now,
    };
  }

  // instance.steps (recurring in executing mode)
  const date = activeDate || getActiveOccurrenceDate(task) || getTodayISO();
  const instance = task.recurringInstances?.find(i => i.date === date);

  if (!instance) {
    return task;
  }

  const updatedInstance: RecurringInstance = {
    ...instance,
    steps: instance.steps.map((s, idx) =>
      idx === location.index ? updateFn(s) : s
    ),
  };

  const updatedInstances = (task.recurringInstances || [])
    .filter(i => i.date !== date)
    .concat(updatedInstance);

  return {
    ...task,
    recurringInstances: updatedInstances,
    updatedAt: now,
  };
}

/**
 * Delete a step at a given location.
 */
function deleteStepAtLocation(
  task: Task,
  location: StepLocation,
  mode: Mode,
  activeDate?: string
): Task {
  const now = Date.now();

  // task.steps
  if (!location.isInstance) {
    return {
      ...task,
      steps: task.steps.filter((_, idx) => idx !== location.index),
      updatedAt: now,
    };
  }

  // instance.steps
  const date = activeDate || getActiveOccurrenceDate(task) || getTodayISO();
  const instance = task.recurringInstances?.find(i => i.date === date);

  if (!instance) {
    return task;
  }

  const updatedInstance: RecurringInstance = {
    ...instance,
    steps: instance.steps.filter((_, idx) => idx !== location.index),
  };

  const updatedInstances = (task.recurringInstances || [])
    .filter(i => i.date !== date)
    .concat(updatedInstance);

  return {
    ...task,
    recurringInstances: updatedInstances,
    updatedAt: now,
  };
}

/**
 * Move a step at a given location.
 */
function moveStepAtLocation(
  task: Task,
  location: StepLocation,
  direction: 'up' | 'down',
  mode: Mode,
  activeDate?: string
): Task {
  const now = Date.now();

  // Helper to move within an array
  const moveInArray = (arr: Step[], index: number): Step[] => {
    const newArr = [...arr];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newArr.length) return arr;

    [newArr[index], newArr[newIndex]] = [newArr[newIndex], newArr[index]];
    return newArr;
  };

  // task.steps
  if (!location.isInstance) {
    return {
      ...task,
      steps: moveInArray(task.steps, location.index),
      updatedAt: now,
    };
  }

  // instance.steps
  const date = activeDate || getActiveOccurrenceDate(task) || getTodayISO();
  const instance = task.recurringInstances?.find(i => i.date === date);

  if (!instance) {
    return task;
  }

  const updatedInstance: RecurringInstance = {
    ...instance,
    steps: moveInArray(instance.steps, location.index),
  };

  const updatedInstances = (task.recurringInstances || [])
    .filter(i => i.date !== date)
    .concat(updatedInstance);

  return {
    ...task,
    recurringInstances: updatedInstances,
    updatedAt: now,
  };
}
