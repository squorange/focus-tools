/**
 * Test Fixtures
 *
 * Factory functions for creating test data.
 * Use these to create consistent, isolated test data.
 */

import {
  Task,
  Step,
  Substep,
  FocusQueueItem,
  AppState,
  Project,
  createTask,
  createStep,
  createProject,
  createInitialAppState,
  createFocusQueueItem,
  generateId,
} from '@/lib/types';

// ============================================
// Task Fixtures
// ============================================

/**
 * Create a minimal task for testing
 */
export function createTestTask(overrides: Partial<Task> = {}): Task {
  return createTask('Test Task', overrides);
}

/**
 * Create a task with steps
 */
export function createTaskWithSteps(
  title: string,
  stepTexts: string[],
  overrides: Partial<Task> = {}
): Task {
  const steps = stepTexts.map((text, i) =>
    createStep(text, { completed: false })
  );
  return createTask(title, { ...overrides, steps });
}

/**
 * Create a completed task
 */
export function createCompletedTask(overrides: Partial<Task> = {}): Task {
  return createTask('Completed Task', {
    status: 'complete',
    completedAt: Date.now(),
    ...overrides,
  });
}

/**
 * Create a recurring task
 */
export function createRecurringTask(overrides: Partial<Task> = {}): Task {
  return createTask('Recurring Task', {
    isRecurring: true,
    recurrence: {
      frequency: 'daily',
      interval: 1,
      daysOfWeek: null,
      dayOfMonth: null,
      weekOfMonth: null,
      time: null,
      endDate: null,
      endAfter: null,
      rolloverIfMissed: true,
      maxOverdueDays: null,
      pausedAt: null,
      pausedUntil: null,
    },
    ...overrides,
  });
}

// ============================================
// Step Fixtures
// ============================================

/**
 * Create a test step
 */
export function createTestStep(overrides: Partial<Step> = {}): Step {
  return createStep('Test Step', overrides);
}

/**
 * Create a completed step
 */
export function createCompletedStep(overrides: Partial<Step> = {}): Step {
  return createStep('Completed Step', {
    completed: true,
    completedAt: Date.now(),
    ...overrides,
  });
}

// ============================================
// Queue Fixtures
// ============================================

/**
 * Create a focus queue item
 */
export function createTestQueueItem(
  taskId: string,
  overrides: Partial<FocusQueueItem> = {}
): FocusQueueItem {
  return createFocusQueueItem(taskId, 'today', overrides);
}

// ============================================
// App State Fixtures
// ============================================

/**
 * Create an initial app state with optional tasks
 */
export function createTestAppState(options: {
  tasks?: Task[];
  queueItems?: FocusQueueItem[];
  todayLineIndex?: number;
} = {}): AppState {
  const initial = createInitialAppState();

  return {
    ...initial,
    tasks: options.tasks ?? [],
    focusQueue: {
      ...initial.focusQueue,
      items: options.queueItems ?? [],
      todayLineIndex: options.todayLineIndex ?? 0,
    },
  };
}

/**
 * Create an app state with a task in the focus queue
 */
export function createAppStateWithQueuedTask(
  taskOverrides: Partial<Task> = {},
  queueItemOverrides: Partial<FocusQueueItem> = {}
): AppState {
  const task = createTestTask({ status: 'pool', ...taskOverrides });
  const queueItem = createTestQueueItem(task.id, queueItemOverrides);

  return createTestAppState({
    tasks: [task],
    queueItems: [queueItem],
    todayLineIndex: 1, // Task is in "Today" section
  });
}

// ============================================
// Date Helpers
// ============================================

/**
 * Get a date string N days from today
 */
export function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Get a timestamp N days ago
 */
export function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/**
 * Get a timestamp N hours ago
 */
export function hoursAgo(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000;
}

// ============================================
// Project Fixtures
// ============================================

/**
 * Create a test project
 */
export function createTestProject(overrides: Partial<Project> = {}): Project {
  const base = createProject('Test Project');
  return { ...base, ...overrides };
}
