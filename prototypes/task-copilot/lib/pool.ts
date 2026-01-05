import { Task, FocusQueue, SortOption, FilterState } from './types';
import {
  filterPool,
  filterInbox,
  isDeferred,
  hasResurfaced,
  isWaitingOn,
  computeFocusScore,
  sortByFocusScore,
  sortByPriority,
  sortByDeadline,
  sortByCreatedAt,
  sortByUpdatedAt,
  getTodayISO,
} from './utils';
import { isTaskInQueue } from './queue';

// ============================================
// Pool Filters (Model E)
// ============================================

/**
 * Get all pool tasks (not deferred unless specified)
 */
export function getPoolTasks(
  tasks: Task[],
  options: {
    includeDeferred?: boolean;
    includeWaitingOn?: boolean;
    excludeInQueue?: boolean;
    queue?: FocusQueue;
  } = {}
): Task[] {
  let poolTasks = filterPool(tasks);

  // Exclude deferred by default
  if (!options.includeDeferred) {
    poolTasks = poolTasks.filter((t) => !isDeferred(t));
  }

  // Waiting on is included by default (it's just a flag)
  // But we can filter to only waiting on if needed
  if (options.includeWaitingOn === false) {
    poolTasks = poolTasks.filter((t) => !isWaitingOn(t));
  }

  // Exclude tasks already in queue
  if (options.excludeInQueue && options.queue) {
    poolTasks = poolTasks.filter((t) => !isTaskInQueue(options.queue!, t.id));
  }

  return poolTasks;
}

/**
 * Get resurfaced tasks (deferred tasks whose date has passed)
 */
export function getResurfacedTasks(tasks: Task[]): Task[] {
  return filterPool(tasks).filter((t) => hasResurfaced(t));
}

/**
 * Get tasks with waiting on flag
 */
export function getWaitingOnTasks(tasks: Task[]): Task[] {
  return filterPool(tasks).filter((t) => isWaitingOn(t));
}

/**
 * Get deferred tasks (still hidden)
 */
export function getDeferredTasks(tasks: Task[]): Task[] {
  return filterPool(tasks).filter((t) => isDeferred(t));
}

/**
 * Get inbox tasks
 */
export function getInboxTasks(tasks: Task[]): Task[] {
  return filterInbox(tasks);
}

// ============================================
// Pool Search & Filter
// ============================================

/**
 * Search tasks by text (title, description, step text)
 */
export function searchTasks(tasks: Task[], query: string): Task[] {
  if (!query.trim()) return tasks;

  const lowerQuery = query.toLowerCase().trim();

  return tasks.filter((task) => {
    // Search title
    if (task.title.toLowerCase().includes(lowerQuery)) return true;

    // Search description
    if (task.description?.toLowerCase().includes(lowerQuery)) return true;

    // Search step text
    for (const step of task.steps) {
      if (step.text.toLowerCase().includes(lowerQuery)) return true;
      for (const substep of step.substeps) {
        if (substep.text.toLowerCase().includes(lowerQuery)) return true;
      }
    }

    // Search tags
    if (task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) return true;

    return false;
  });
}

/**
 * Apply filter state to tasks
 */
export function applyFilters(tasks: Task[], filters: FilterState): Task[] {
  let result = tasks;

  // Status filter
  if (filters.status.length > 0) {
    result = result.filter((t) => filters.status.includes(t.status));
  }

  // Priority filter
  if (filters.priority.length > 0) {
    result = result.filter((t) => filters.priority.includes(t.priority));
  }

  // Tags filter
  if (filters.tags.length > 0) {
    result = result.filter((t) =>
      filters.tags.some((tag) => t.tags.includes(tag))
    );
  }

  // Project filter
  if (filters.projectId) {
    result = result.filter((t) => t.projectId === filters.projectId);
  }

  // Context filter
  if (filters.context) {
    result = result.filter((t) => t.context === filters.context);
  }

  // Search filter
  if (filters.search) {
    result = searchTasks(result, filters.search);
  }

  // Waiting on filter
  if (!filters.showWaitingOn) {
    result = result.filter((t) => !isWaitingOn(t));
  }

  // Deferred filter
  if (!filters.showDeferred) {
    result = result.filter((t) => !isDeferred(t));
  }

  // Exclude deleted
  result = result.filter((t) => !t.deletedAt);

  return result;
}

// ============================================
// Pool Sorting
// ============================================

/**
 * Sort tasks by the specified option
 */
export function sortTasks(
  tasks: Task[],
  sortBy: SortOption,
  sortOrder: 'asc' | 'desc' = 'desc'
): Task[] {
  let sorted: Task[];

  switch (sortBy) {
    case 'focusScore':
      sorted = sortByFocusScore(tasks);
      break;
    case 'priority':
      sorted = sortByPriority(tasks);
      break;
    case 'targetDate':
      sorted = [...tasks].sort((a, b) => {
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return a.targetDate.localeCompare(b.targetDate);
      });
      break;
    case 'deadlineDate':
      sorted = sortByDeadline(tasks);
      break;
    case 'createdAt':
      sorted = sortByCreatedAt(tasks);
      break;
    case 'updatedAt':
      sorted = sortByUpdatedAt(tasks);
      break;
    default:
      sorted = tasks;
  }

  // focusScore and date sorts are already in the right order
  // but priority should be high-first regardless of sortOrder
  if (sortOrder === 'asc' && sortBy !== 'priority') {
    sorted = sorted.reverse();
  }

  return sorted;
}

/**
 * Get pool tasks with search, filter, and sort applied
 */
export function getFilteredPoolTasks(
  tasks: Task[],
  filters: FilterState,
  sortBy: SortOption,
  sortOrder: 'asc' | 'desc' = 'desc'
): Task[] {
  // Start with pool tasks
  let result = getPoolTasks(tasks, {
    includeDeferred: filters.showDeferred,
    includeWaitingOn: filters.showWaitingOn,
  });

  // Apply filters (excluding status since we already filtered for pool)
  result = applyFilters(result, { ...filters, status: [] });

  // Sort
  result = sortTasks(result, sortBy, sortOrder);

  return result;
}

// ============================================
// Pool Statistics
// ============================================

/**
 * Get pool task counts by category
 */
export function getPoolCounts(tasks: Task[]): {
  total: number;
  inbox: number;
  pool: number;
  resurfaced: number;
  waitingOn: number;
  deferred: number;
  highPriority: number;
  dueThisWeek: number;
} {
  const poolTasks = filterPool(tasks);
  const inboxTasks = filterInbox(tasks);
  const today = getTodayISO();

  // Calculate "this week" (next 7 days)
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekFromNowISO = weekFromNow.toISOString().split('T')[0];

  return {
    total: poolTasks.length + inboxTasks.length,
    inbox: inboxTasks.length,
    pool: poolTasks.filter((t) => !isDeferred(t)).length,
    resurfaced: poolTasks.filter((t) => hasResurfaced(t)).length,
    waitingOn: poolTasks.filter((t) => isWaitingOn(t)).length,
    deferred: poolTasks.filter((t) => isDeferred(t)).length,
    highPriority: poolTasks.filter((t) => t.priority === 'high').length,
    dueThisWeek: poolTasks.filter(
      (t) => t.deadlineDate && t.deadlineDate >= today && t.deadlineDate <= weekFromNowISO
    ).length,
  };
}

/**
 * Get all unique tags from tasks
 */
export function getAllTags(tasks: Task[]): string[] {
  const tagSet = new Set<string>();
  tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

/**
 * Get all unique contexts from tasks
 */
export function getAllContexts(tasks: Task[]): string[] {
  const contextSet = new Set<string>();
  tasks.forEach((t) => {
    if (t.context) contextSet.add(t.context);
    t.steps.forEach((s) => {
      if (s.context) contextSet.add(s.context);
    });
  });
  return Array.from(contextSet).sort();
}

// ============================================
// Pool Task Suggestions
// ============================================

/**
 * Get suggested quick wins (quick tasks with high focus score)
 */
export function getQuickWins(tasks: Task[], limit: number = 3): Task[] {
  return getPoolTasks(tasks)
    .filter((t) => t.effort === 'quick' || (t.estimatedMinutes && t.estimatedMinutes <= 15))
    .sort((a, b) => (computeFocusScore(b)) - (computeFocusScore(a)))
    .slice(0, limit);
}

/**
 * Get high priority tasks not in queue
 */
export function getHighPriorityNotInQueue(
  tasks: Task[],
  queue: FocusQueue,
  limit: number = 3
): Task[] {
  return getPoolTasks(tasks, { excludeInQueue: true, queue })
    .filter((t) => t.priority === 'high')
    .sort((a, b) => (computeFocusScore(b)) - (computeFocusScore(a)))
    .slice(0, limit);
}

/**
 * Get tasks with approaching deadlines not in queue
 */
export function getDeadlineApproaching(
  tasks: Task[],
  queue: FocusQueue,
  daysAhead: number = 3,
  limit: number = 3
): Task[] {
  const today = getTodayISO();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + daysAhead);
  const deadlineISO = deadline.toISOString().split('T')[0];

  return getPoolTasks(tasks, { excludeInQueue: true, queue })
    .filter(
      (t) => t.deadlineDate && t.deadlineDate >= today && t.deadlineDate <= deadlineISO
    )
    .sort((a, b) => (a.deadlineDate ?? '').localeCompare(b.deadlineDate ?? ''))
    .slice(0, limit);
}
