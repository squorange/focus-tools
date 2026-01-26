// ============================================
// Recurring Tasks Utilities
// ============================================

import { Task, Step, RecurrenceRule, generateId } from './types';
import {
  RecurringInstance,
  TaskInstance,
  InstanceStatus,
  RecurrenceRuleExtended,
  RoutinePill,
} from './recurring-types';

// ============================================
// Date Helpers
// ============================================

/**
 * Get today's date as ISO string, respecting day-start hour
 * E.g., at 2am with dayStartHour=5, returns yesterday's date
 * Uses local timezone to avoid UTC offset issues
 */
export function getTodayISO(dayStartHour: number = 5): string {
  const now = new Date();
  // If before day-start hour, treat as previous day
  if (now.getHours() < dayStartHour) {
    now.setDate(now.getDate() - 1);
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse ISO date string to Date object (at midnight UTC)
 */
export function parseISO(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/**
 * Format date for display
 */
export function formatDateShort(dateStr: string): string {
  const date = parseISO(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get day of week (0=Sunday, 6=Saturday)
 */
function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Get which week of the month a date falls in (1-5)
 */
export function getWeekOfMonth(date: Date): number {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstOfMonth.getDay();
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
}

/**
 * Get days between two ISO dates
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = parseISO(date1);
  const d2 = parseISO(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 */
function addDays(dateStr: string, days: number): string {
  const date = parseISO(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ============================================
// Pattern Matching
// ============================================

/**
 * Check if a date matches a recurrence pattern
 */
export function dateMatchesPattern(
  date: string,
  pattern: RecurrenceRule | RecurrenceRuleExtended,
  startDate: string
): boolean {
  // Check if before start date
  if (date < startDate) return false;

  // Check end date
  if (pattern.endDate && date > pattern.endDate) return false;

  const targetDate = parseISO(date);

  switch (pattern.frequency) {
    case 'daily':
      return matchesDailyPattern(date, pattern.interval, startDate);
    case 'weekly':
      return matchesWeeklyPattern(
        targetDate,
        pattern.interval,
        pattern.daysOfWeek,
        (pattern as RecurrenceRuleExtended).weekOfMonth ?? null,
        startDate
      );
    case 'monthly':
      return matchesMonthlyPattern(
        targetDate,
        pattern.interval,
        pattern.dayOfMonth,
        pattern.daysOfWeek,
        (pattern as RecurrenceRuleExtended).weekOfMonth ?? null,
        startDate
      );
    case 'yearly':
      return matchesYearlyPattern(targetDate, pattern.interval, startDate);
    default:
      return false;
  }
}

/**
 * Daily pattern: every N days from start
 */
function matchesDailyPattern(
  date: string,
  interval: number,
  startDate: string
): boolean {
  const days = daysBetween(startDate, date);
  return days % interval === 0;
}

/**
 * Weekly pattern: specific days of week, optionally specific week of month
 */
function matchesWeeklyPattern(
  date: Date,
  interval: number,
  daysOfWeek: number[] | null,
  weekOfMonth: number | null,
  startDate: string
): boolean {
  // Check day of week
  const dayOfWeek = getDayOfWeek(date);
  if (daysOfWeek && daysOfWeek.length > 0 && !daysOfWeek.includes(dayOfWeek)) {
    return false;
  }

  // Check week of month (e.g., "first Monday")
  if (weekOfMonth !== null) {
    if (getWeekOfMonth(date) !== weekOfMonth) {
      return false;
    }
  }

  // Check interval (every N weeks)
  if (interval > 1) {
    const start = parseISO(startDate);
    const weeksDiff = Math.floor(
      (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );
    if (weeksDiff % interval !== 0) {
      return false;
    }
  }

  return true;
}

/**
 * Monthly pattern: specific day of month OR specific weekday of month
 */
function matchesMonthlyPattern(
  date: Date,
  interval: number,
  dayOfMonth: number | null,
  daysOfWeek: number[] | null,
  weekOfMonth: number | null,
  startDate: string
): boolean {
  const start = parseISO(startDate);

  // Check interval (every N months)
  const monthsDiff =
    (date.getFullYear() - start.getFullYear()) * 12 +
    (date.getMonth() - start.getMonth());
  if (monthsDiff % interval !== 0) {
    return false;
  }

  // Option 1: Specific day of month (e.g., "15th of each month")
  if (dayOfMonth !== null) {
    return date.getDate() === dayOfMonth;
  }

  // Option 2: Specific weekday of month (e.g., "first Monday")
  if (daysOfWeek && daysOfWeek.length > 0 && weekOfMonth !== null) {
    const dayOfWeek = getDayOfWeek(date);
    if (!daysOfWeek.includes(dayOfWeek)) return false;
    if (getWeekOfMonth(date) !== weekOfMonth) return false;
    return true;
  }

  // Default: matches start date's day of month
  return date.getDate() === start.getDate();
}

/**
 * Yearly pattern: same day each year
 */
function matchesYearlyPattern(
  date: Date,
  interval: number,
  startDate: string
): boolean {
  const start = parseISO(startDate);

  // Check same month and day
  if (
    date.getMonth() !== start.getMonth() ||
    date.getDate() !== start.getDate()
  ) {
    return false;
  }

  // Check interval
  const yearsDiff = date.getFullYear() - start.getFullYear();
  return yearsDiff % interval === 0;
}

// ============================================
// Next/Previous Occurrence
// ============================================

/**
 * Get the next occurrence date from a given date
 */
export function getNextOccurrence(
  pattern: RecurrenceRule | RecurrenceRuleExtended,
  fromDate: string,
  startDate: string
): string | null {
  // Check end date
  if (pattern.endDate && fromDate >= pattern.endDate) {
    return null;
  }

  // Start checking from the day after fromDate
  let checkDate = addDays(fromDate, 1);
  const maxIterations = 400; // ~1 year safety

  for (let i = 0; i < maxIterations; i++) {
    if (dateMatchesPattern(checkDate, pattern, startDate)) {
      return checkDate;
    }
    checkDate = addDays(checkDate, 1);
  }

  return null;
}

/**
 * Get the previous occurrence date from a given date
 */
export function getPreviousOccurrence(
  date: string,
  pattern: RecurrenceRule | RecurrenceRuleExtended,
  startDate: string
): string | null {
  // Start checking from the day before date
  let checkDate = addDays(date, -1);
  const maxIterations = 400;

  for (let i = 0; i < maxIterations; i++) {
    if (checkDate < startDate) {
      return null;
    }
    if (dateMatchesPattern(checkDate, pattern, startDate)) {
      return checkDate;
    }
    checkDate = addDays(checkDate, -1);
  }

  return null;
}

/**
 * Convert a timestamp to local date string (YYYY-MM-DD)
 * Uses local timezone instead of UTC to avoid date mismatches
 */
export function timestampToLocalDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the effective start date for pattern matching, with fallback chain:
 * pattern.startDate → task.createdAt → today
 */
function getEffectiveStartDate(task: Task, pattern: RecurrenceRuleExtended, dayStartHour: number = 5): string {
  return pattern.startDate ||
    (task.createdAt ? timestampToLocalDate(task.createdAt) : getTodayISO(dayStartHour));
}

/**
 * Get the active occurrence date for a task
 * Returns today if due today, or next due date if not
 */
export function getActiveOccurrenceDate(
  task: Task,
  dayStartHour: number = 5
): string | null {
  if (!task.isRecurring || !task.recurrence) return null;

  const today = getTodayISO(dayStartHour);
  const pattern = task.recurrence as RecurrenceRuleExtended;
  const startDate = getEffectiveStartDate(task, pattern, dayStartHour);

  // Check if paused
  if (pattern.pausedAt) {
    if (!pattern.pausedUntil || pattern.pausedUntil > today) {
      return null;
    }
  }

  // Check if due today
  if (dateMatchesPattern(today, pattern, startDate)) {
    return today;
  }

  // Check for overdue with rollover
  if (pattern.rolloverIfMissed) {
    const prev = getPreviousOccurrence(today, pattern, startDate);
    if (prev) {
      const instance = task.recurringInstances?.find((i) => i.date === prev);
      if (!instance || (!instance.completed && !instance.skipped)) {
        return prev; // Return overdue date
      }
    }
  }

  // Return next occurrence
  return getNextOccurrence(pattern, today, startDate);
}

// ============================================
// Instance Management
// ============================================

/**
 * Clone steps with new IDs (template snapshot)
 */
export function cloneSteps(steps: Step[]): Step[] {
  return steps.map((step) => ({
    ...step,
    id: generateId(),
    completed: false,
    completedAt: null,
    origin: 'template' as const, // Mark as originating from template
    substeps: step.substeps.map((sub) => ({
      ...sub,
      id: generateId(),
      completed: false,
      completedAt: null,
    })),
  }));
}

/**
 * Create a new instance for a date with template snapshot
 */
export function createInstance(task: Task, date: string): RecurringInstance {
  return {
    date,
    steps: cloneSteps(task.steps),
    completed: false,
    completedAt: null,
    skipped: false,
    skippedAt: null,
    notes: null,
    overdueDays: calculateOverdueDays(date, task.recurrence),
  };
}

/**
 * Get or create instance for a date (MUTATING - legacy, use ensureInstancePure instead)
 * Also handles stale instances: if instance has no steps but template has steps,
 * re-initialize steps (happens when instance was created before steps were added)
 */
export function ensureInstance(task: Task, date: string): RecurringInstance {
  if (!task.recurringInstances) {
    task.recurringInstances = [];
  }

  let instance = task.recurringInstances.find((i) => i.date === date);
  if (!instance) {
    instance = createInstance(task, date);
    task.recurringInstances.push(instance);
  } else {
    // Check for stale instance: no steps but template has steps
    // Only refresh if instance is not completed/skipped (user hasn't interacted with it)
    if (instance.steps.length === 0 && task.steps.length > 0 && !instance.completed && !instance.skipped) {
      instance.steps = cloneSteps(task.steps);
    }
  }

  return instance;
}

/**
 * Get or create instance for a date (PURE - returns new task, never mutates)
 */
export function ensureInstancePure(task: Task, date: string): { task: Task; instance: RecurringInstance } {
  const instances = [...(task.recurringInstances || [])];
  let instance = instances.find(i => i.date === date);

  if (!instance) {
    instance = createInstance(task, date);
    return {
      task: { ...task, recurringInstances: [...instances, instance] },
      instance,
    };
  }

  // Check for stale instance: no steps but template has steps
  if (instance.steps.length === 0 && task.steps.length > 0 && !instance.completed && !instance.skipped) {
    instance = { ...instance, steps: cloneSteps(task.steps) };
    const updatedInstances = instances.map(i => i.date === date ? instance! : i);
    return {
      task: { ...task, recurringInstances: updatedInstances },
      instance,
    };
  }

  return { task, instance };
}

/**
 * Calculate overdue days for an instance
 */
export function calculateOverdueDays(
  date: string,
  recurrence: RecurrenceRule | RecurrenceRuleExtended | null,
  today?: string
): number | null {
  if (!recurrence) return null;

  const extended = recurrence as RecurrenceRuleExtended;
  if (!extended.rolloverIfMissed) return null;

  const todayDate = today || getTodayISO();
  if (date >= todayDate) return null;

  return daysBetween(date, todayDate);
}

// ============================================
// Completion Logic
// ============================================

/**
 * Check if an instance is complete (all steps done)
 */
export function isInstanceComplete(instance: RecurringInstance): boolean {
  return instance.steps.length === 0 || instance.steps.every((s) => s.completed);
}

/**
 * Mark an instance as complete and update task metadata
 * Returns a new Task object (immutable update for React state)
 */
export function markInstanceComplete(
  task: Task,
  date: string,
  dayStartHour: number = 5
): Task {
  // Deep clone the task
  const newTask: Task = {
    ...task,
    recurringInstances: task.recurringInstances.map(i => ({
      ...i,
      steps: i.steps.map(s => ({ ...s })),
    })),
  };

  const instance = ensureInstance(newTask, date);

  // Mark all steps complete
  instance.steps.forEach((s) => {
    s.completed = true;
    s.completedAt = s.completedAt || Date.now();
  });

  instance.completed = true;
  instance.completedAt = Date.now();
  instance.overdueDays = null;

  // Update task metadata
  updateTaskMetadataAfterCompletion(newTask, date, dayStartHour);

  return newTask;
}

/**
 * Skip an instance for a specific date
 * Returns a new Task object (immutable update for React state)
 */
export function skipInstance(
  task: Task,
  date: string,
  dayStartHour: number = 5
): Task {
  // Deep clone the task
  const newTask: Task = {
    ...task,
    recurringInstances: task.recurringInstances.map(i => ({
      ...i,
      steps: i.steps.map(s => ({ ...s })),
    })),
  };

  const instance = ensureInstance(newTask, date);

  instance.skipped = true;
  instance.skippedAt = Date.now();
  instance.completed = false;
  instance.overdueDays = null;

  // Update next due (skip doesn't break streak)
  if (newTask.recurrence) {
    const pattern = newTask.recurrence as RecurrenceRuleExtended;
    const startDate = pattern.startDate ||
      (newTask.createdAt ? timestampToLocalDate(newTask.createdAt) : getTodayISO(dayStartHour));
    newTask.recurringNextDue = getNextOccurrence(pattern, date, startDate);
  }

  newTask.updatedAt = Date.now();

  return newTask;
}

/**
 * Mark an instance as incomplete (undo completion)
 * Returns a new Task object (immutable update for React state)
 */
export function markInstanceIncomplete(
  task: Task,
  date: string,
  dayStartHour: number = 5
): Task {
  // Deep clone the task
  const newTask: Task = {
    ...task,
    recurringInstances: task.recurringInstances.map(i => ({
      ...i,
      steps: i.steps.map(s => ({ ...s })),
    })),
  };

  const instance = newTask.recurringInstances.find(i => i.date === date);
  if (!instance) {
    return newTask; // No instance to mark incomplete
  }

  // Reset completion status
  instance.steps.forEach((s) => {
    s.completed = false;
    s.completedAt = null;
  });

  instance.completed = false;
  instance.completedAt = null;
  instance.skipped = false;
  instance.skippedAt = null;

  // Decrement total completions (min 0)
  newTask.recurringTotalCompletions = Math.max(0, (newTask.recurringTotalCompletions || 0) - 1);

  // Recalculate streak (it may have broken)
  newTask.recurringStreak = calculateStreak(newTask, dayStartHour);

  // Update lastCompleted - find most recent completed instance
  const completedInstances = newTask.recurringInstances
    .filter(i => i.completed)
    .sort((a, b) => b.date.localeCompare(a.date));
  newTask.recurringLastCompleted = completedInstances[0]?.date || null;

  // Update next due - the current date is now due again
  newTask.recurringNextDue = date;

  newTask.updatedAt = Date.now();

  return newTask;
}

/**
 * Update task-level recurring metadata after completion
 */
export function updateTaskMetadataAfterCompletion(
  task: Task,
  date: string,
  dayStartHour: number = 5
): void {
  task.recurringTotalCompletions = (task.recurringTotalCompletions || 0) + 1;
  task.recurringLastCompleted = date;

  // Recalculate streak
  task.recurringStreak = calculateStreak(task, dayStartHour);
  if (task.recurringStreak > (task.recurringBestStreak || 0)) {
    task.recurringBestStreak = task.recurringStreak;
  }

  // Update next due
  if (task.recurrence) {
    const pattern = task.recurrence as RecurrenceRuleExtended;
    const startDate = pattern.startDate ||
      (task.createdAt ? timestampToLocalDate(task.createdAt) : getTodayISO(dayStartHour));
    task.recurringNextDue = getNextOccurrence(pattern, date, startDate);
  }

  task.updatedAt = Date.now();
}

/**
 * Pure function: After a step is completed/uncompleted in a recurring instance,
 * check if the instance completion state changed and update task metadata accordingly.
 * Returns a new task object (never mutates).
 */
export function updateRecurringInstanceMeta(task: Task, activeDate: string): Task {
  const instance = task.recurringInstances?.find(i => i.date === activeDate);
  if (!instance) return task;

  const allComplete = instance.steps.length > 0 && instance.steps.every(s => s.completed);
  const wasComplete = instance.completed;

  // No state change needed
  if (allComplete === wasComplete) return task;

  const now = Date.now();
  const updatedInstance: RecurringInstance = {
    ...instance,
    completed: allComplete,
    completedAt: allComplete ? now : null,
  };

  const updatedInstances = (task.recurringInstances || [])
    .filter(i => i.date !== activeDate)
    .concat(updatedInstance);

  let updatedTask: Task = { ...task, recurringInstances: updatedInstances, updatedAt: now };

  if (allComplete && !wasComplete) {
    // Just became complete
    const streak = calculateStreak(updatedTask);
    updatedTask = {
      ...updatedTask,
      recurringTotalCompletions: (task.recurringTotalCompletions || 0) + 1,
      recurringLastCompleted: activeDate,
      recurringStreak: streak,
      recurringBestStreak: Math.max(streak, task.recurringBestStreak || 0),
    };
  } else if (!allComplete && wasComplete) {
    // Just became incomplete
    const streak = calculateStreak(updatedTask);
    const completedInstances = updatedInstances
      .filter(i => i.completed)
      .sort((a, b) => b.date.localeCompare(a.date));
    updatedTask = {
      ...updatedTask,
      recurringTotalCompletions: Math.max(0, (task.recurringTotalCompletions || 0) - 1),
      recurringStreak: streak,
      recurringLastCompleted: completedInstances[0]?.date || null,
    };
  }

  return updatedTask;
}

// ============================================
// Streak Calculation
// ============================================

/**
 * Calculate current streak (consecutive completions from today backward)
 */
export function calculateStreak(task: Task, dayStartHour: number = 5): number {
  if (!task.isRecurring || !task.recurrence || !task.recurringInstances) {
    return 0;
  }

  const pattern = task.recurrence as RecurrenceRuleExtended;
  // Use pattern.startDate, or task.createdAt, or today as fallback
  const startDate = pattern.startDate ||
    (task.createdAt ? timestampToLocalDate(task.createdAt) : getTodayISO(dayStartHour));
  const today = getTodayISO(dayStartHour);

  let streak = 0;
  let checkDate: string | null = today;

  // If today matches pattern, check if completed
  if (dateMatchesPattern(today, pattern, startDate)) {
    const todayInstance = task.recurringInstances.find((i) => i.date === today);
    if (todayInstance?.completed) {
      streak = 1;
      checkDate = getPreviousOccurrence(today, pattern, startDate);
    } else if (todayInstance?.skipped) {
      // Skipped doesn't break streak, move to previous
      checkDate = getPreviousOccurrence(today, pattern, startDate);
    } else {
      // Today not done, start checking from previous occurrence
      checkDate = getPreviousOccurrence(today, pattern, startDate);
    }
  } else {
    // Today not an occurrence day, start from most recent
    checkDate = getPreviousOccurrence(today, pattern, startDate);
  }

  // Count consecutive completions backward
  const maxIterations = 1000;
  for (let i = 0; i < maxIterations && checkDate !== null && checkDate >= startDate; i++) {
    const inst = task.recurringInstances.find((instance) => instance.date === checkDate);

    if (inst?.completed) {
      streak++;
      checkDate = getPreviousOccurrence(checkDate, pattern, startDate);
    } else if (inst?.skipped) {
      // Skipped doesn't break streak
      checkDate = getPreviousOccurrence(checkDate, pattern, startDate);
    } else {
      // Missed - streak broken
      break;
    }
  }

  return streak;
}

// ============================================
// Instance Generation for Calendar
// ============================================

/**
 * Generate TaskInstance objects for a date range (for calendar display)
 */
export function generateInstancesForRange(
  task: Task,
  startDate: string,
  endDate: string,
  dayStartHour: number = 5
): TaskInstance[] {
  if (!task.isRecurring || !task.recurrence) return [];

  const pattern = task.recurrence as RecurrenceRuleExtended;
  // Fix: use task.createdAt as fallback for startDate so past dates can match pattern
  // Previously defaulted to today, which caused history calendar to miss past completions
  const patternStart = pattern.startDate
    || (task.createdAt ? timestampToLocalDate(task.createdAt) : null)
    || startDate; // Fallback to range start if no creation date
  const today = getTodayISO(dayStartHour);
  const instances: TaskInstance[] = [];

  let checkDate = startDate;
  const maxIterations = 400;

  for (let i = 0; i < maxIterations && checkDate <= endDate; i++) {
    if (dateMatchesPattern(checkDate, pattern, patternStart)) {
      const existingInstance = task.recurringInstances?.find(
        (inst) => inst.date === checkDate
      );
      const status = getInstanceStatus(
        existingInstance || null,
        checkDate,
        pattern,
        today,
        dayStartHour
      );

      instances.push({
        date: checkDate,
        status,
        instance: existingInstance || null,
        isToday: checkDate === today,
      });
    }

    checkDate = addDays(checkDate, 1);
  }

  return instances;
}

/**
 * Determine the status of an instance for display
 */
function getInstanceStatus(
  instance: RecurringInstance | null,
  date: string,
  pattern: RecurrenceRuleExtended,
  today: string,
  dayStartHour: number
): InstanceStatus {
  // Paused check
  if (pattern.pausedAt) {
    const pausedDate = new Date(pattern.pausedAt).toISOString().split('T')[0];
    if (date >= pausedDate) {
      if (!pattern.pausedUntil || date < pattern.pausedUntil) {
        return 'paused';
      }
    }
  }

  // Future
  if (date > today) {
    return 'pending';
  }

  // Today
  if (date === today) {
    if (instance?.completed) return 'completed';
    if (instance?.skipped) return 'skipped';
    return 'today';
  }

  // Past
  if (instance?.completed) return 'completed';
  if (instance?.skipped) return 'skipped';

  // Missed in the past
  if (pattern.rolloverIfMissed && !instance) {
    return 'overdue';
  }

  return 'missed';
}

// ============================================
// Filtering
// ============================================

/**
 * Filter to only recurring tasks
 */
export function filterRecurringTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.isRecurring && !t.deletedAt);
}

/**
 * Filter recurring tasks due today
 */
export function filterDueToday(tasks: Task[], dayStartHour: number = 5): Task[] {
  const today = getTodayISO(dayStartHour);

  return filterRecurringTasks(tasks).filter((task) => {
    if (!task.recurrence) return false;

    const pattern = task.recurrence as RecurrenceRuleExtended;

    // Skip paused
    if (pattern.pausedAt) {
      if (!pattern.pausedUntil || pattern.pausedUntil > today) {
        return false;
      }
    }

    const startDate = getEffectiveStartDate(task, pattern, dayStartHour);

    // Check if due today
    if (dateMatchesPattern(today, pattern, startDate)) {
      const instance = task.recurringInstances?.find((i) => i.date === today);
      // Show if not completed or skipped
      return !instance?.completed && !instance?.skipped;
    }

    // Check for overdue with rollover
    if (pattern.rolloverIfMissed) {
      const prev = getPreviousOccurrence(today, pattern, startDate);
      if (prev) {
        const instance = task.recurringInstances?.find((i) => i.date === prev);
        if (!instance || (!instance.completed && !instance.skipped)) {
          return true;
        }
      }
    }

    return false;
  });
}

/**
 * Filter all routines applicable for today (includes completed/skipped)
 * Used for accurate daily progress counting in DailySummaryBanner
 * Unlike filterDueToday which excludes completed/skipped routines
 */
export function filterRoutinesForToday(tasks: Task[], dayStartHour: number = 5): Task[] {
  const today = getTodayISO(dayStartHour);

  return filterRecurringTasks(tasks).filter((task) => {
    if (!task.recurrence) return false;

    const pattern = task.recurrence as RecurrenceRuleExtended;

    // Skip paused (unless pause ended)
    if (pattern.pausedAt) {
      if (!pattern.pausedUntil || pattern.pausedUntil > today) {
        return false;
      }
    }

    const startDate = getEffectiveStartDate(task, pattern, dayStartHour);

    // Check if due today (include completed/skipped)
    if (dateMatchesPattern(today, pattern, startDate)) {
      return true; // Don't exclude completed/skipped
    }

    // Check for overdue with rollover
    if (pattern.rolloverIfMissed) {
      const prev = getPreviousOccurrence(today, pattern, startDate);
      if (prev) {
        const instance = task.recurringInstances?.find((i) => i.date === prev);
        // Include if not completed or skipped (overdue)
        if (!instance || (!instance.completed && !instance.skipped)) {
          return true;
        }
      }
    }

    return false;
  });
}

/**
 * Filter by frequency
 */
export function filterByFrequency(
  tasks: Task[],
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Task[] {
  return filterRecurringTasks(tasks).filter(
    (t) => t.recurrence?.frequency === frequency
  );
}

/**
 * Filter active (not paused) routines
 */
export function filterActive(tasks: Task[]): Task[] {
  return filterRecurringTasks(tasks).filter((t) => {
    const pattern = t.recurrence as RecurrenceRuleExtended;
    return !pattern?.pausedAt;
  });
}

/**
 * Filter paused routines
 */
export function filterPaused(tasks: Task[]): Task[] {
  return filterRecurringTasks(tasks).filter((t) => {
    const pattern = t.recurrence as RecurrenceRuleExtended;
    return !!pattern?.pausedAt;
  });
}

// ============================================
// Sorting
// ============================================

/**
 * Sort by next due date (soonest first)
 */
export function sortByNextDue(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aNext = a.recurringNextDue || '9999-12-31';
    const bNext = b.recurringNextDue || '9999-12-31';
    return aNext.localeCompare(bNext);
  });
}

/**
 * Sort by streak (highest first)
 */
export function sortByStreak(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => (b.recurringStreak || 0) - (a.recurringStreak || 0)
  );
}

/**
 * Sort by last completed (most recent first)
 */
export function sortByLastCompleted(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aLast = a.recurringLastCompleted || '0000-01-01';
    const bLast = b.recurringLastCompleted || '0000-01-01';
    return bLast.localeCompare(aLast);
  });
}

/**
 * Sort by scheduled time
 */
export function sortByTime(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aTime = (a.recurrence as RecurrenceRuleExtended)?.time || '23:59';
    const bTime = (b.recurrence as RecurrenceRuleExtended)?.time || '23:59';
    return aTime.localeCompare(bTime);
  });
}

// ============================================
// Validation & Description
// ============================================

/**
 * Validate a recurrence pattern, returns error message or null if valid
 */
export function validatePattern(
  pattern: RecurrenceRule | RecurrenceRuleExtended
): string | null {
  if (!pattern.frequency) {
    return 'Frequency is required';
  }

  if (!pattern.interval || pattern.interval < 1) {
    return 'Interval must be at least 1';
  }

  if (pattern.frequency === 'weekly') {
    if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
      return 'At least one day of week must be selected';
    }
  }

  if (pattern.frequency === 'monthly') {
    const extended = pattern as RecurrenceRuleExtended;
    if (!pattern.dayOfMonth && !extended.weekOfMonth) {
      return 'Day of month or week/day selection required';
    }
  }

  if (pattern.endDate && pattern.endAfter) {
    return 'Cannot have both end date and end after count';
  }

  return null;
}

/**
 * Generate human-readable description of pattern
 */
export function describePattern(
  pattern: RecurrenceRule | RecurrenceRuleExtended
): string {
  const extended = pattern as RecurrenceRuleExtended;
  // Use 12-hour format for time display (e.g., "8:45p" instead of "20:45")
  const time = extended.time ? ` at ${formatTimeCompact(extended.time)}` : '';

  switch (pattern.frequency) {
    case 'daily':
      if (pattern.interval === 1) return `Daily${time}`;
      return `Every ${pattern.interval} days${time}`;

    case 'weekly':
      const days = pattern.daysOfWeek?.map((d) => dayNames[d]).join(', ') || '';
      if (pattern.interval === 1) {
        if (pattern.daysOfWeek?.length === 7) return `Daily${time}`;
        if (pattern.daysOfWeek?.length === 5 &&
            pattern.daysOfWeek.every((d) => d >= 1 && d <= 5)) {
          return `Weekdays${time}`;
        }
        return `Weekly on ${days}${time}`;
      }
      return `Every ${pattern.interval} weeks on ${days}${time}`;

    case 'monthly':
      if (pattern.dayOfMonth) {
        const suffix = getOrdinalSuffix(pattern.dayOfMonth);
        if (pattern.interval === 1) return `Monthly on the ${pattern.dayOfMonth}${suffix}${time}`;
        return `Every ${pattern.interval} months on the ${pattern.dayOfMonth}${suffix}${time}`;
      }
      if (extended.weekOfMonth && pattern.daysOfWeek?.[0] !== undefined) {
        const weekName = weekNames[extended.weekOfMonth - 1];
        const dayName = dayNames[pattern.daysOfWeek[0]];
        if (pattern.interval === 1) return `${weekName} ${dayName} of each month${time}`;
        return `${weekName} ${dayName} every ${pattern.interval} months${time}`;
      }
      return `Monthly${time}`;

    case 'yearly':
      if (pattern.interval === 1) return `Yearly${time}`;
      return `Every ${pattern.interval} years${time}`;

    default:
      return 'Custom pattern';
  }
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekNames = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

/**
 * Format time as compact 12-hour format (e.g., "11:00a", "3:30p")
 */
function formatTimeCompact(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'p' : 'a';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${m.toString().padStart(2, '0')}${suffix}`;
}

/**
 * Describe the frequency portion in compact format
 */
function describeFrequencyCompact(pattern: RecurrenceRule | RecurrenceRuleExtended): string {
  const extended = pattern as RecurrenceRuleExtended;

  switch (pattern.frequency) {
    case 'daily':
      if (pattern.interval === 1) return 'Daily';
      return `Every ${pattern.interval}d`;

    case 'weekly':
      const days = pattern.daysOfWeek?.map((d) => dayNames[d]).join(', ') || '';
      if (pattern.interval === 1) {
        if (pattern.daysOfWeek?.length === 7) return 'Daily';
        if (pattern.daysOfWeek?.length === 5 &&
            pattern.daysOfWeek.every((d) => d >= 1 && d <= 5)) {
          return 'Weekdays';
        }
        return `Weekly on ${days}`;
      }
      return `Every ${pattern.interval}w on ${days}`;

    case 'monthly':
      if (pattern.dayOfMonth) {
        const suffix = getOrdinalSuffix(pattern.dayOfMonth);
        if (pattern.interval === 1) return `Monthly on ${pattern.dayOfMonth}${suffix}`;
        return `Every ${pattern.interval}mo on ${pattern.dayOfMonth}${suffix}`;
      }
      if (extended.weekOfMonth && pattern.daysOfWeek?.[0] !== undefined) {
        const weekName = weekNames[extended.weekOfMonth - 1];
        const dayName = dayNames[pattern.daysOfWeek[0]];
        if (pattern.interval === 1) return `${weekName} ${dayName}`;
        return `${weekName} ${dayName} every ${pattern.interval}mo`;
      }
      return 'Monthly';

    case 'yearly':
      if (pattern.interval === 1) return 'Yearly';
      return `Every ${pattern.interval}y`;

    default:
      return 'Custom';
  }
}

/**
 * Compact pattern description with time first (e.g., "11:00a Daily", "9:00a Weekly on Sun, Mon")
 * Used in RoutineCard where space is limited
 */
export function describePatternCompact(
  pattern: RecurrenceRule | RecurrenceRuleExtended
): string {
  const extended = pattern as RecurrenceRuleExtended;
  const time = formatTimeCompact(extended.time ?? undefined);
  const freq = describeFrequencyCompact(pattern);

  return time ? `${time} ${freq}` : freq;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ============================================
// Instance Pruning (Storage Management)
// ============================================

/**
 * Prune old instances, keeping only recent and summary data
 */
export function pruneOldInstances(
  instances: RecurringInstance[],
  keepDays: number = 90
): RecurringInstance[] {
  const cutoffDate = addDays(getTodayISO(), -keepDays);

  return instances.filter((inst) => {
    // Keep recent instances
    if (inst.date >= cutoffDate) return true;

    // Keep completed/skipped (but could be pruned to minimal data later)
    // For now, just remove very old instances
    return false;
  });
}

// ============================================
// Metadata Pills for UI
// ============================================

/**
 * Generate metadata pills for routine display
 */
export function getRoutineMetadataPills(
  task: Task,
  dayStartHour: number = 5
): RoutinePill[] {
  const pills: RoutinePill[] = [];
  const today = getTodayISO(dayStartHour);

  // Last completed pill
  if (task.recurringLastCompleted) {
    const lastDate = task.recurringLastCompleted;
    const daysAgo = daysBetween(lastDate, today);

    let label: string;
    let color: RoutinePill['color'] = 'gray';

    if (daysAgo === 0) {
      label = 'Last: Today';
      color = 'green';
    } else if (daysAgo === 1) {
      label = 'Last: Yesterday';
    } else if (daysAgo < 7) {
      label = `Last: ${formatDateShort(lastDate)}`;
    } else if (daysAgo < 30) {
      label = `Last: ${formatDateShort(lastDate)}`;
      color = 'amber';
    } else {
      label = `Last: ${formatDateShort(lastDate)}`;
      color = 'red';
    }

    pills.push({ label, color });
  } else {
    pills.push({ label: 'Not started', color: 'gray' });
  }

  // Next due pill (for non-daily)
  if (
    task.recurrence?.frequency !== 'daily' &&
    task.recurringNextDue &&
    task.recurringNextDue > today
  ) {
    pills.push({
      label: `Next: ${formatDateShort(task.recurringNextDue)}`,
      color: 'blue',
    });
  }

  // Paused pill
  const pattern = task.recurrence as RecurrenceRuleExtended;
  if (pattern?.pausedAt) {
    pills.push({ label: 'Paused', color: 'amber' });
  }

  return pills;
}
