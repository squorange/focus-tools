import { Task, Step } from './types';

// ============================================
// Date Utilities
// ============================================

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format a date for display
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, tomorrow)) return 'Tomorrow';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  // Within this week, show day name
  const daysUntil = daysBetween(getTodayISO(), isoDate);
  if (daysUntil > 0 && daysUntil <= 6) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Show date with month
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a timestamp for display (time only)
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Convert total minutes to hours and minutes
 */
export function minutesToHoursAndMinutes(totalMinutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

/**
 * Convert hours and minutes to total minutes
 */
export function hoursAndMinutesToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

/**
 * Rounded increments for duration dropdowns
 */
export const MINUTE_INCREMENTS = [0, 1, 2, 5, 10, 15, 20, 30, 45];
export const HOUR_INCREMENTS = [0, 1, 2, 3, 4];

/**
 * Round minutes to nearest increment
 */
export function roundToNearestIncrement(minutes: number): number {
  const increments = [1, 2, 5, 10, 15, 20, 30, 45, 60, 75, 90, 120, 150, 180, 240];
  for (const inc of increments) {
    if (minutes <= inc) return inc;
  }
  return Math.ceil(minutes / 30) * 30; // Round to nearest 30 min for larger values
}

/**
 * Check if two dates are the same day
 */
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Calculate days between two ISO dates
 * Returns positive if target is after reference, negative if before
 */
export function daysBetween(referenceDate: string, targetDate: string): number {
  const ref = new Date(referenceDate + 'T23:59:59');
  const target = new Date(targetDate + 'T23:59:59');
  return Math.floor((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get time of day category
 */
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// ============================================
// Task Utilities
// ============================================

/**
 * Check if a task is overdue
 */
export function isOverdue(task: Task): boolean {
  if (!task.deadlineDate) return false;
  if (task.status === 'complete' || task.status === 'archived') return false;
  return daysBetween(task.deadlineDate, getTodayISO()) > 0;
}

/**
 * Check if a task is due today
 */
export function isDueToday(task: Task): boolean {
  if (!task.deadlineDate) return false;
  return task.deadlineDate === getTodayISO();
}

/**
 * Check if a task is due soon (within 3 days)
 */
export function isDueSoon(task: Task): boolean {
  if (!task.deadlineDate) return false;
  const daysUntil = daysBetween(getTodayISO(), task.deadlineDate);
  return daysUntil >= 0 && daysUntil <= 3;
}

/**
 * Get task progress as percentage (0-100)
 */
export function getTaskProgress(task: Task): number {
  if (task.steps.length === 0) return 0;
  const completed = task.steps.filter((s) => s.completed).length;
  return Math.round((completed / task.steps.length) * 100);
}

/**
 * Get the number of completed steps
 */
export function getCompletedStepCount(task: Task): number {
  return task.steps.filter((s) => s.completed).length;
}

/**
 * Check if task was completed today
 */
export function wasCompletedToday(task: Task): boolean {
  if (!task.completedAt) return false;
  const completedDate = new Date(task.completedAt);
  return isSameDay(completedDate, new Date());
}

/**
 * Check if a task is deferred and should be hidden (Model E)
 */
export function isDeferred(task: Task): boolean {
  if (!task.deferredUntil) return false;
  const today = getTodayISO();
  return task.deferredUntil > today;
}

/**
 * Check if a deferred task has resurfaced (Model E)
 */
export function hasResurfaced(task: Task): boolean {
  if (!task.deferredUntil) return false;
  const today = getTodayISO();
  return task.deferredUntil <= today;
}

/**
 * Check if a task has a waiting on flag (Model E)
 */
export function isWaitingOn(task: Task): boolean {
  return task.waitingOn !== null;
}

// ============================================
// Step Utilities
// ============================================

/**
 * Get next incomplete step
 */
export function getNextIncompleteStep(steps: Step[]): Step | undefined {
  return steps.find((s) => !s.completed);
}

/**
 * Get step progress (including substeps)
 */
export function getStepProgress(step: Step): number {
  if (step.substeps.length === 0) {
    return step.completed ? 100 : 0;
  }
  const completed = step.substeps.filter((s) => s.completed).length;
  return Math.round((completed / step.substeps.length) * 100);
}

/**
 * Get total estimated minutes for steps
 */
export function getTotalEstimatedMinutes(steps: Step[]): number {
  return steps.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0);
}

/**
 * Get remaining estimated minutes for incomplete steps
 */
export function getRemainingEstimatedMinutes(steps: Step[]): number {
  return steps
    .filter((s) => !s.completed)
    .reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0);
}

// ============================================
// Computation Utilities (Model E)
// ============================================

/**
 * Compute task complexity based on steps and effort
 */
export function computeComplexity(task: Task): 'simple' | 'moderate' | 'complex' {
  const stepCount = task.steps.length;
  const substepCount = task.steps.reduce((sum, s) => sum + s.substeps.length, 0);

  if (task.effort === 'deep' || stepCount > 5 || substepCount > 10) return 'complex';
  if (task.effort === 'medium' || stepCount > 2 || substepCount > 3) return 'moderate';
  return 'simple';
}

/**
 * Compute step complexity based on substeps
 */
export function computeStepComplexity(step: Step): 'simple' | 'moderate' | 'complex' {
  const substepCount = step.substeps.length;
  if (substepCount > 5) return 'complex';
  if (substepCount >= 2) return 'moderate';
  return 'simple';
}

/**
 * Compute focus score for task (0-100, higher = more urgent)
 * Used for default sorting in Pool view
 */
export function computeFocusScore(task: Task): number {
  let score = 0;
  const today = getTodayISO();

  // Deadline urgency (0-40 points)
  if (task.deadlineDate) {
    const daysUntil = daysBetween(today, task.deadlineDate);
    if (daysUntil <= 0) score += 40; // Overdue
    else if (daysUntil <= 1) score += 35; // Due today/tomorrow
    else if (daysUntil <= 3) score += 25; // Due this week
    else if (daysUntil <= 7) score += 15;
    else if (daysUntil <= 14) score += 5;
  }

  // Priority (0-25 points)
  if (task.priority === 'high') score += 25;
  else if (task.priority === 'medium') score += 15;
  else if (task.priority === 'low') score += 5;

  // Quick win bonus (0-10 points)
  if (task.effort === 'quick' || (task.estimatedMinutes && task.estimatedMinutes <= 15)) {
    score += 10;
  }

  // Staleness (0-15 points)
  const daysSinceUpdate = Math.floor(
    (Date.now() - task.updatedAt) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceUpdate > 14) score += 15;
  else if (daysSinceUpdate > 7) score += 10;
  else if (daysSinceUpdate > 3) score += 5;

  // Waiting on penalty (reduce urgency)
  if (task.waitingOn) {
    score = Math.max(0, score - 10);
  }

  return Math.min(100, score);
}

/**
 * Compute health status for task (Model E: uses deferredCount)
 */
export function computeHealthStatus(task: Task): 'healthy' | 'at_risk' | 'critical' {
  const today = getTodayISO();

  // Critical: Overdue or deadline today
  if (task.deadlineDate) {
    const daysUntil = daysBetween(today, task.deadlineDate);
    if (daysUntil < 0) return 'critical'; // Overdue
    if (daysUntil === 0) return 'critical'; // Due today
    if (daysUntil <= 2) return 'at_risk'; // Due soon
  }

  // At risk: Deferred multiple times (Model E: uses deferredCount)
  if (task.deferredCount >= 3) return 'at_risk';

  // At risk: Stale (not touched in 2+ weeks)
  const daysSinceUpdate = Math.floor(
    (Date.now() - task.updatedAt) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceUpdate > 14) return 'at_risk';

  return 'healthy';
}

// ============================================
// Sorting Utilities
// ============================================

/**
 * Sort tasks by priority
 */
export function sortByPriority(tasks: Task[]): Task[] {
  const priorityOrder = { high: 0, medium: 1, low: 2, null: 3 };
  return [...tasks].sort((a, b) => {
    const aOrder = priorityOrder[a.priority ?? 'null'];
    const bOrder = priorityOrder[b.priority ?? 'null'];
    return aOrder - bOrder;
  });
}

/**
 * Sort tasks by deadline
 */
export function sortByDeadline(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.deadlineDate && !b.deadlineDate) return 0;
    if (!a.deadlineDate) return 1;
    if (!b.deadlineDate) return -1;
    return a.deadlineDate.localeCompare(b.deadlineDate);
  });
}

/**
 * Sort tasks by focus score (higher first)
 */
export function sortByFocusScore(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const scoreA = a.focusScore ?? computeFocusScore(a);
    const scoreB = b.focusScore ?? computeFocusScore(b);
    return scoreB - scoreA;
  });
}

/**
 * Sort tasks by created date (newest first)
 */
export function sortByCreatedAt(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Sort tasks by updated date (most recent first)
 */
export function sortByUpdatedAt(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => b.updatedAt - a.updatedAt);
}

// ============================================
// Filter Utilities (Model E)
// ============================================

/**
 * Filter tasks by status
 */
export function filterByStatus(tasks: Task[], statuses: Task['status'][]): Task[] {
  return tasks.filter((t) => statuses.includes(t.status) && !t.deletedAt);
}

/**
 * Filter tasks completed today
 */
export function filterCompletedToday(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'complete' && wasCompletedToday(t));
}

/**
 * Filter inbox tasks
 */
export function filterInbox(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'inbox' && !t.deletedAt);
}

/**
 * Filter pool tasks (Model E: replaces filterActive)
 */
export function filterPool(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'pool' && !t.deletedAt);
}

/**
 * Filter pool tasks excluding deferred (Model E)
 */
export function filterPoolExcludingDeferred(tasks: Task[]): Task[] {
  return filterPool(tasks).filter((t) => !isDeferred(t));
}

/**
 * Filter pool tasks with waiting on (Model E)
 */
export function filterWaitingOn(tasks: Task[]): Task[] {
  return filterPool(tasks).filter((t) => isWaitingOn(t));
}

/**
 * Filter resurfaced tasks (Model E)
 */
export function filterResurfaced(tasks: Task[]): Task[] {
  return filterPool(tasks).filter((t) => hasResurfaced(t));
}

// Legacy alias
export function filterActive(tasks: Task[]): Task[] {
  return filterPool(tasks);
}

// ============================================
// Misc Utilities
// ============================================

/**
 * Detect if running on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
