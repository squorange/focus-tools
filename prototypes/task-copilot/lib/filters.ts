/**
 * Task filtering logic for Priority view
 */

import { Task, TaskFilters } from './types';
import { PriorityQueueTask } from './priority';

/**
 * Apply filters to a list of priority-ranked tasks
 */
export function applyTaskFilters(
  tasks: PriorityQueueTask[],
  filters: TaskFilters
): PriorityQueueTask[] {
  // If no filters, return all tasks
  if (!filters || Object.keys(filters).length === 0) {
    return tasks;
  }

  return tasks.filter(({ task }) => {
    // Due date filter (multi-select with OR logic)
    if (filters.dueDateRange && filters.dueDateRange.length > 0) {
      if (!matchesDueDateRange(task, filters.dueDateRange)) {
        return false;
      }
    }

    // Target date filter (multi-select with OR logic)
    if (filters.targetDateRange && filters.targetDateRange.length > 0) {
      if (!matchesTargetDateRange(task, filters.targetDateRange)) {
        return false;
      }
    }

    // Duration filter (multi-select with OR logic)
    if (filters.durationRange && filters.durationRange.length > 0) {
      if (!matchesDurationRange(task, filters.durationRange)) {
        return false;
      }
    }

    // Project filter (multi-select with OR logic)
    if (filters.projectId && filters.projectId.length > 0) {
      if (!matchesProjectFilter(task, filters.projectId)) {
        return false;
      }
    }

    // Priority filter (multi-select with OR logic)
    if (filters.priority && filters.priority.length > 0) {
      const taskPriority = task.priority || 'none';
      if (!filters.priority.includes(taskPriority as 'high' | 'medium' | 'low' | 'none')) {
        return false;
      }
    }

    // Health status filter (multi-select with OR logic)
    if (filters.healthStatus && filters.healthStatus.length > 0) {
      const taskHealth = task.healthStatus || 'healthy';
      if (taskHealth === 'healthy' || !filters.healthStatus.includes(taskHealth as 'at_risk' | 'critical')) {
        return false;
      }
    }

    // Created date filter (multi-select with OR logic)
    if (filters.createdRange && filters.createdRange.length > 0) {
      if (!matchesCreatedRange(task, filters.createdRange)) {
        return false;
      }
    }

    // Staleness filter (multi-select with OR logic)
    if (filters.stalenessRange && filters.stalenessRange.length > 0) {
      if (!matchesStalenessRange(task, filters.stalenessRange)) {
        return false;
      }
    }

    // Defer count filter (multi-select with OR logic)
    if (filters.deferCount && filters.deferCount.length > 0) {
      if (!matchesDeferCount(task, filters.deferCount)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if task matches any of the due date range filters (OR logic)
 */
function matchesDueDateRange(
  task: Task,
  ranges: NonNullable<TaskFilters['dueDateRange']>
): boolean {
  const deadline = task.deadlineDate;
  const today = getTodayISO();

  // OR logic: task matches if it matches ANY of the selected ranges
  return ranges.some(range => {
    switch (range) {
      case 'overdue':
        return !!deadline && deadline < today;
      case 'today':
        return deadline === today;
      case 'this_week':
        return !!deadline && isWithinDays(deadline, today, 7) && deadline >= today;
      case 'next_week':
        return !!deadline && isWithinDays(deadline, today, 14) && !isWithinDays(deadline, today, 7);
      case 'later':
        return !!deadline && !isWithinDays(deadline, today, 14);
      case 'none':
        return !deadline;
      default:
        return true;
    }
  });
}

/**
 * Check if task matches any of the target date range filters (OR logic)
 */
function matchesTargetDateRange(
  task: Task,
  ranges: NonNullable<TaskFilters['targetDateRange']>
): boolean {
  const target = task.targetDate;
  const today = getTodayISO();

  // OR logic: task matches if it matches ANY of the selected ranges
  return ranges.some(range => {
    switch (range) {
      case 'today':
        return target === today;
      case 'this_week':
        return !!target && isWithinDays(target, today, 7) && target >= today;
      case 'next_week':
        return !!target && isWithinDays(target, today, 14) && !isWithinDays(target, today, 7);
      case 'later':
        return !!target && !isWithinDays(target, today, 14);
      case 'none':
        return !target;
      default:
        return true;
    }
  });
}

/**
 * Check if task matches any of the duration range filters (OR logic)
 */
function matchesDurationRange(
  task: Task,
  ranges: NonNullable<TaskFilters['durationRange']>
): boolean {
  const duration = task.estimatedMinutes;

  // OR logic: task matches if it matches ANY of the selected ranges
  return ranges.some(range => {
    switch (range) {
      case 'quick':
        return duration !== null && duration < 15;
      case 'short':
        return duration !== null && duration >= 15 && duration < 30;
      case 'medium':
        return duration !== null && duration >= 30 && duration < 60;
      case 'long':
        return duration !== null && duration >= 60 && duration < 120;
      case 'deep':
        return duration !== null && duration >= 120;
      case 'none':
        return duration === null;
      default:
        return true;
    }
  });
}

/**
 * Check if task matches any of the project filters (OR logic)
 */
function matchesProjectFilter(
  task: Task,
  projectIds: NonNullable<TaskFilters['projectId']>
): boolean {
  // OR logic: task matches if it matches ANY of the selected projects
  return projectIds.some(projectId => {
    if (projectId === 'none') {
      return task.projectId === null;
    }
    return task.projectId === projectId;
  });
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if date is within N days of reference date
 */
function isWithinDays(dateStr: string, referenceStr: string, days: number): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const reference = new Date(referenceStr + 'T00:00:00');
  const diffMs = date.getTime() - reference.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < days;
}

/**
 * Check if task matches any of the created date range filters (OR logic)
 */
function matchesCreatedRange(
  task: Task,
  ranges: NonNullable<TaskFilters['createdRange']>
): boolean {
  const createdAt = task.createdAt;
  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const daysSinceCreated = (now - createdAt) / dayMs;

  // OR logic: task matches if it matches ANY of the selected ranges
  return ranges.some(range => {
    switch (range) {
      case 'today':
        return daysSinceCreated < 1;
      case 'this_week':
        return daysSinceCreated < 7;
      case 'this_month':
        return daysSinceCreated < 30;
      case 'older':
        return daysSinceCreated >= 30;
      default:
        return true;
    }
  });
}

/**
 * Check if task matches any of the staleness range filters (OR logic)
 * Staleness is based on days since last update (updatedAt)
 */
function matchesStalenessRange(
  task: Task,
  ranges: NonNullable<TaskFilters['stalenessRange']>
): boolean {
  const updatedAt = task.updatedAt;
  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const daysSinceUpdate = (now - updatedAt) / dayMs;

  // OR logic: task matches if it matches ANY of the selected ranges
  return ranges.some(range => {
    switch (range) {
      case '7_days':
        return daysSinceUpdate >= 7;
      case '14_days':
        return daysSinceUpdate >= 14;
      case '30_days':
        return daysSinceUpdate >= 30;
      default:
        return true;
    }
  });
}

/**
 * Check if task matches any of the defer count filters (OR logic)
 */
function matchesDeferCount(
  task: Task,
  ranges: NonNullable<TaskFilters['deferCount']>
): boolean {
  const count = task.deferredCount || 0;

  // OR logic: task matches if it matches ANY of the selected ranges
  return ranges.some(range => {
    switch (range) {
      case 'never':
        return count === 0;
      case '1x':
        return count === 1;
      case '2_3x':
        return count >= 2 && count <= 3;
      case '4_plus':
        return count >= 4;
      default:
        return true;
    }
  });
}
