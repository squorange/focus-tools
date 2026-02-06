import { Task, Step, FocusQueueItem, Project } from './types';

// ============================================
// Date Utilities
// ============================================

/**
 * Get today's date as ISO string (YYYY-MM-DD) using local timezone.
 *
 * @param dayStartHour - Hour when the day starts (0-12). Default 0 (midnight).
 *   If current time is before dayStartHour, returns yesterday's date.
 *   This allows a "day" to span e.g. 5 AM to 5 AM instead of midnight to midnight.
 */
export function getTodayISO(dayStartHour: number = 0): string {
  const now = new Date();

  // If dayStartHour is set and current hour is before it, treat as "yesterday"
  if (dayStartHour > 0 && now.getHours() < dayStartHour) {
    now.setDate(now.getDate() - 1);
  }

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
 * Check if a date string (ISO format) is in the past
 */
export function isDateOverdue(dateStr: string): boolean {
  return daysBetween(dateStr, getTodayISO()) > 0;
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
 * Health status result with reasons
 */
export interface HealthResult {
  status: 'healthy' | 'at_risk' | 'critical';
  reasons: string[];
}

/**
 * Health status display info
 */
export interface HealthStatusInfo {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
}

/**
 * Get display info for health status
 */
export function getHealthStatusInfo(status: HealthResult['status']): HealthStatusInfo {
  const statusMap: Record<HealthResult['status'], HealthStatusInfo> = {
    healthy: {
      label: '', // Not displayed - healthy tasks show no health pill
      color: '#16a34a', // green-600
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-700 dark:text-green-300',
    },
    at_risk: {
      label: 'Watch',
      color: '#f59e0b', // amber-500
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      textClass: 'text-amber-700 dark:text-amber-300',
    },
    critical: {
      label: 'Alert',
      color: '#ef4444', // red-500
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      textClass: 'text-red-700 dark:text-red-300',
    },
  };
  return statusMap[status];
}

/**
 * Compute health status for task with reasons (Model E)
 */
export function computeHealthStatus(task: Task): HealthResult {
  const today = getTodayISO();
  const reasons: string[] = [];

  // Check deadline-related issues
  if (task.deadlineDate) {
    const daysUntil = daysBetween(today, task.deadlineDate);
    if (daysUntil < 0) {
      reasons.push('Past deadline');
    } else if (daysUntil === 0) {
      reasons.push('Due today');
    } else if (daysUntil <= 2) {
      reasons.push(`Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`);
    }
  }

  // Check staleness
  const daysSinceUpdate = Math.floor(
    (Date.now() - task.updatedAt) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceUpdate > 14) {
    reasons.push('No activity in 2+ weeks');
  } else if (daysSinceUpdate > 7) {
    reasons.push('No activity in 1+ week');
  }

  // Check deferral count
  if (task.deferredCount >= 3) {
    reasons.push(`Deferred ${task.deferredCount} times`);
  }

  // Determine status based on reasons
  let status: HealthResult['status'] = 'healthy';

  // Critical conditions
  const hasCritical = reasons.some(r =>
    r === 'Past deadline' || r === 'Due today'
  );
  if (hasCritical) {
    status = 'critical';
  } else if (reasons.length > 0) {
    status = 'at_risk';
  }

  // Add positive reason for healthy tasks
  if (status === 'healthy') {
    reasons.push('No issues detected');
  }

  return { status, reasons };
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

// ============================================
// Status Label Utilities
// ============================================

export type DisplayStatus =
  | 'completed'
  | 'archived'
  | 'today'
  | 'focus'
  | 'waiting'
  | 'deferred'
  | 'ready'
  | 'inbox';

export interface DisplayStatusInfo {
  label: string;
  color: string; // hex color for the pill
  bgClass: string; // tailwind bg class
  textClass: string; // tailwind text class
}

/**
 * Get display status for a task
 * Priority order (highest to lowest):
 * 1. Completed - task is done
 * 2. Archived - task is parked/abandoned
 * 3. Today - in focus queue, above the line
 * 4. Focus - in focus queue, below the line
 * 5. Waiting - has waitingOn set
 * 6. Deferred - has deferredUntil in future
 * 7. Ready - in pool, available
 * 8. Inbox - needs triage
 */
export function getDisplayStatus(
  task: Task,
  queueItem?: FocusQueueItem,
  todayLineIndex?: number
): DisplayStatus {
  // 1. Completed
  if (task.status === 'complete') return 'completed';

  // 2. Archived
  if (task.status === 'archived') return 'archived';

  // 3 & 4. Queue status (Today / Focus)
  if (queueItem && todayLineIndex !== undefined) {
    const isAboveLine = queueItem.order < todayLineIndex;
    return isAboveLine ? 'today' : 'focus';
  }

  // 5. Waiting
  if (task.waitingOn) return 'waiting';

  // 6. Deferred
  if (task.deferredUntil) {
    const today = getTodayISO();
    if (task.deferredUntil > today) return 'deferred';
  }

  // 7. Ready (pool)
  if (task.status === 'pool') return 'ready';

  // 8. Inbox (default)
  return 'inbox';
}

/**
 * Get display info (label, colors) for a status
 */
export function getStatusInfo(status: DisplayStatus): DisplayStatusInfo {
  const statusMap: Record<DisplayStatus, DisplayStatusInfo> = {
    completed: {
      label: 'Completed',
      color: '#16a34a', // green-600
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-700 dark:text-green-300',
    },
    archived: {
      label: 'Archived',
      color: '#71717a', // zinc-500
      bgClass: 'bg-bg-neutral-subtle',
      textClass: 'text-fg-neutral-secondary',
    },
    today: {
      label: 'Today',
      color: '#8b5cf6', // violet-500
      bgClass: 'bg-violet-100 dark:bg-violet-900/30',
      textClass: 'text-violet-700 dark:text-violet-300',
    },
    focus: {
      label: 'Focus',
      color: '#6d28d9', // violet-700
      bgClass: 'bg-violet-50 dark:bg-violet-950/30',
      textClass: 'text-violet-600 dark:text-violet-400',
    },
    waiting: {
      label: 'Waiting',
      color: '#f97316', // orange-500
      bgClass: 'bg-orange-100 dark:bg-orange-900/30',
      textClass: 'text-orange-700 dark:text-orange-300',
    },
    deferred: {
      label: 'Deferred',
      color: '#6366f1', // indigo-500
      bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
      textClass: 'text-indigo-700 dark:text-indigo-300',
    },
    ready: {
      label: 'Ready',
      color: '#2563eb', // blue-600
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      textClass: 'text-blue-700 dark:text-blue-300',
    },
    inbox: {
      label: 'Inbox',
      color: '#d97706', // amber-600
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      textClass: 'text-amber-700 dark:text-amber-300',
    },
  };

  return statusMap[status];
}

// ============ Search Utilities ============

/**
 * Match location for search results (used for ranking)
 */
export type MatchLocation =
  | 'title'
  | 'description'
  | 'step'
  | 'substep'
  | 'tag'
  | 'project'
  | 'waitingOn'
  | 'context';

/**
 * Search result with ranking metadata
 */
export interface SearchResult {
  task: Task;
  matchLocations: MatchLocation[];
  matchedText: string; // The actual text that matched
  rank: number; // Lower = better (title=1, step=2, etc.)
}

/**
 * Map of project IDs to project names for search
 */
export type ProjectMap = Map<string, string>;

/**
 * Build a project lookup map for efficient search
 */
export function buildProjectMap(projects: Project[]): ProjectMap {
  return new Map(projects.map(p => [p.id, p.name]));
}

/**
 * Rank values for match locations (lower = better)
 */
const MATCH_RANK: Record<MatchLocation, number> = {
  title: 1,
  step: 2,
  substep: 3,
  description: 4,
  tag: 5,
  project: 6,
  waitingOn: 7,
  context: 8,
};

/**
 * Search tasks across all fields with ranking
 * Returns results sorted by best match location
 */
export function searchTasks(
  tasks: Task[],
  query: string,
  projectMap: ProjectMap
): SearchResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const task of tasks) {
    const matchLocations: MatchLocation[] = [];
    let matchedText = '';

    // Title
    if (task.title.toLowerCase().includes(lowerQuery)) {
      matchLocations.push('title');
      if (!matchedText) matchedText = task.title;
    }

    // Description
    if (task.description?.toLowerCase().includes(lowerQuery)) {
      matchLocations.push('description');
      if (!matchedText) matchedText = task.description;
    }

    // Steps
    for (const step of task.steps) {
      if (step.text.toLowerCase().includes(lowerQuery)) {
        if (!matchLocations.includes('step')) {
          matchLocations.push('step');
        }
        if (!matchedText) matchedText = step.text;
      }

      // Substeps
      for (const substep of step.substeps) {
        if (substep.text.toLowerCase().includes(lowerQuery)) {
          if (!matchLocations.includes('substep')) {
            matchLocations.push('substep');
          }
          if (!matchedText) matchedText = substep.text;
        }
      }
    }

    // Tags
    for (const tag of task.tags) {
      if (tag.toLowerCase().includes(lowerQuery)) {
        if (!matchLocations.includes('tag')) {
          matchLocations.push('tag');
        }
        if (!matchedText) matchedText = tag;
      }
    }

    // Project name
    if (task.projectId) {
      const projectName = projectMap.get(task.projectId);
      if (projectName?.toLowerCase().includes(lowerQuery)) {
        matchLocations.push('project');
        if (!matchedText) matchedText = projectName;
      }
    }

    // Waiting on
    if (task.waitingOn?.who.toLowerCase().includes(lowerQuery)) {
      matchLocations.push('waitingOn');
      if (!matchedText) matchedText = task.waitingOn.who;
    }

    // Context
    if (task.context?.toLowerCase().includes(lowerQuery)) {
      matchLocations.push('context');
      if (!matchedText) matchedText = task.context;
    }

    if (matchLocations.length > 0) {
      // Rank by best match location
      const rank = Math.min(...matchLocations.map(loc => MATCH_RANK[loc]));
      results.push({
        task,
        matchLocations,
        matchedText,
        rank,
      });
    }
  }

  // Sort by rank (best matches first)
  return results.sort((a, b) => a.rank - b.rank);
}

/**
 * Extract a snippet around the search term
 */
export function extractSnippet(
  text: string,
  searchTerm: string,
  maxLength: number = 60
): string {
  const lowerText = text.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);

  if (index === -1) return truncate(text, maxLength);

  // Calculate window around match
  const halfWindow = Math.floor((maxLength - searchTerm.length) / 2);
  let start = Math.max(0, index - halfWindow);
  let end = Math.min(text.length, index + searchTerm.length + halfWindow);

  // Adjust to not cut words
  if (start > 0) {
    const spaceIndex = text.indexOf(' ', start);
    if (spaceIndex !== -1 && spaceIndex < index) {
      start = spaceIndex + 1;
    }
  }
  if (end < text.length) {
    const spaceIndex = text.lastIndexOf(' ', end);
    if (spaceIndex !== -1 && spaceIndex > index + searchTerm.length) {
      end = spaceIndex;
    }
  }

  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Search preview types
 */
export type SearchPreviewType = 'step' | 'snippet' | 'description';

export interface SearchPreview {
  text: string;
  type: SearchPreviewType;
}

/**
 * Get the preview text for a search result
 * - If title match → show next incomplete step (actionable)
 * - If other match → show snippet with search term (contextual)
 * - Fallback to description
 */
export function getSearchPreview(
  result: SearchResult,
  query: string
): SearchPreview {
  const { task, matchLocations, matchedText } = result;

  // Title match → show next incomplete step
  if (matchLocations.includes('title')) {
    const nextStep = getNextIncompleteStep(task.steps);
    if (nextStep) {
      return { text: nextStep.text, type: 'step' };
    }
  }

  // Non-title match → show snippet from matched text
  if (!matchLocations.includes('title') && matchedText) {
    const snippet = extractSnippet(matchedText, query);
    return { text: snippet, type: 'snippet' };
  }

  // Fallback to description
  if (task.description) {
    return { text: truncate(task.description, 60), type: 'description' };
  }

  // No preview available
  return { text: '', type: 'description' };
}

/**
 * Get human-readable label for match location
 */
export function getMatchLocationLabel(location: MatchLocation): string {
  const labels: Record<MatchLocation, string> = {
    title: 'Title',
    description: 'Description',
    step: 'Step',
    substep: 'Substep',
    tag: 'Tag',
    project: 'Project',
    waitingOn: 'Waiting on',
    context: 'Context',
  };
  return labels[location];
}

// ============================================
// Step ID Resolution
// ============================================

/**
 * Resolves a display ID (like "1", "2", "3") to the actual step UUID.
 * Display IDs are 1-based indices shown to users and AI.
 * Returns null if the display ID cannot be resolved.
 */
export function resolveDisplayIdToUUID(displayId: string, steps: Step[]): string | null {
  // Handle sentinel for "insert at beginning"
  if (displayId === '0') return '0';

  // Try to parse as a 1-based index
  const index = parseInt(displayId, 10) - 1;
  if (isNaN(index) || index < 0 || index >= steps.length) {
    return null;
  }
  return steps[index].id;
}
