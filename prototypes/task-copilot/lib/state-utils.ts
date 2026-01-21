/**
 * state-utils.ts
 *
 * Helper functions for updating application state immutably.
 * These functions handle the common patterns of updating tasks
 * within the AppState structure.
 *
 * Used by hooks to simplify state updates.
 */

import { Task, Step } from './types';

// ============================================
// Types
// ============================================

export interface AppState {
  tasks: Task[];
  // ... other state properties (not typed here to avoid circular deps)
  [key: string]: unknown;
}

// ============================================
// Task Update Helpers
// ============================================

/**
 * Update a single task in the tasks array.
 * Returns a new state with the updated task.
 */
export function updateTaskInState<S extends { tasks: Task[] }>(
  state: S,
  taskId: string,
  updateFn: (task: Task) => Task
): S {
  return {
    ...state,
    tasks: state.tasks.map(t =>
      t.id === taskId ? updateFn(t) : t
    ),
  };
}

/**
 * Update a task by replacing it entirely.
 */
export function replaceTaskInState<S extends { tasks: Task[] }>(
  state: S,
  taskId: string,
  updatedTask: Task
): S {
  return {
    ...state,
    tasks: state.tasks.map(t =>
      t.id === taskId ? updatedTask : t
    ),
  };
}

/**
 * Find a task by ID.
 */
export function findTaskById<S extends { tasks: Task[] }>(
  state: S,
  taskId: string
): Task | undefined {
  return state.tasks.find(t => t.id === taskId);
}

/**
 * Update multiple tasks at once.
 */
export function updateTasksInState<S extends { tasks: Task[] }>(
  state: S,
  updates: Map<string, (task: Task) => Task>
): S {
  return {
    ...state,
    tasks: state.tasks.map(t => {
      const updateFn = updates.get(t.id);
      return updateFn ? updateFn(t) : t;
    }),
  };
}

// ============================================
// Step Update Helpers (within task)
// ============================================

/**
 * Update a step within a task's steps array.
 */
export function updateStepInTask(
  task: Task,
  stepId: string,
  updateFn: (step: Step) => Step
): Task {
  return {
    ...task,
    steps: task.steps.map(s =>
      s.id === stepId ? updateFn(s) : s
    ),
    updatedAt: Date.now(),
  };
}

/**
 * Update a step by index.
 */
export function updateStepByIndex(
  task: Task,
  index: number,
  updateFn: (step: Step) => Step
): Task {
  if (index < 0 || index >= task.steps.length) {
    return task;
  }

  return {
    ...task,
    steps: task.steps.map((s, i) =>
      i === index ? updateFn(s) : s
    ),
    updatedAt: Date.now(),
  };
}

/**
 * Add a step to a task.
 */
export function addStepToTask(
  task: Task,
  step: Step,
  afterIndex?: number
): Task {
  const newSteps = [...task.steps];

  if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < newSteps.length) {
    newSteps.splice(afterIndex + 1, 0, step);
  } else {
    newSteps.push(step);
  }

  return {
    ...task,
    steps: newSteps,
    updatedAt: Date.now(),
  };
}

/**
 * Remove a step from a task.
 */
export function removeStepFromTask(
  task: Task,
  stepId: string
): Task {
  return {
    ...task,
    steps: task.steps.filter(s => s.id !== stepId),
    updatedAt: Date.now(),
  };
}

// ============================================
// Batch Update Helpers
// ============================================

/**
 * Create a batch update function that collects multiple updates
 * and applies them in a single state change.
 */
export function createBatchUpdater<S extends { tasks: Task[] }>() {
  const updates: Array<{ taskId: string; updateFn: (task: Task) => Task }> = [];

  return {
    add: (taskId: string, updateFn: (task: Task) => Task) => {
      updates.push({ taskId, updateFn });
    },
    apply: (state: S): S => {
      if (updates.length === 0) return state;

      const updateMap = new Map<string, (task: Task) => Task>();
      for (const { taskId, updateFn } of updates) {
        const existing = updateMap.get(taskId);
        if (existing) {
          // Chain updates for same task
          updateMap.set(taskId, (t) => updateFn(existing(t)));
        } else {
          updateMap.set(taskId, updateFn);
        }
      }

      return updateTasksInState(state, updateMap);
    },
  };
}

// ============================================
// Timestamp Helpers
// ============================================

/**
 * Add updatedAt timestamp to a task.
 */
export function touchTask(task: Task): Task {
  return {
    ...task,
    updatedAt: Date.now(),
  };
}

/**
 * Add updatedAt timestamp to multiple tasks.
 */
export function touchTasks(tasks: Task[], taskIds: string[]): Task[] {
  const now = Date.now();
  const idSet = new Set(taskIds);

  return tasks.map(t =>
    idSet.has(t.id) ? { ...t, updatedAt: now } : t
  );
}
