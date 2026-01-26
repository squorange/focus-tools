import { Task } from './types';
import { RecurringInstance } from './recurring-types';
import { getTodayISO } from './utils';

// Helper to convert timestamp to local date string (YYYY-MM-DD)
function timestampToLocalDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Step completion within a task
export interface StepCompletion {
  stepId: string;
  stepText: string;
  completedAt: number;
}

// Task-centric completion entry (task as anchor, steps as children)
export interface TaskCompletion {
  taskId: string;
  taskTitle: string;
  isTaskCompleted: boolean;      // Task itself marked complete
  completedAt: number;           // Task completion time OR latest step completion
  focusTimeMinutes: number;      // task.totalTimeSpent
  completedSteps: StepCompletion[];
  isRoutine?: boolean;           // Is this a routine completion
}

// Date-grouped completions
export interface CompletionGroup {
  dateKey: string;
  displayDate: string;
  taskCompletions: TaskCompletion[];
}

// Result with hasMore flag for pagination
export interface CompletionsResult {
  groups: CompletionGroup[];
  hasMore: boolean;
}

/**
 * Get all completions from tasks, grouped by task then by date.
 * Tasks are anchors with their completed steps as children.
 * Also includes completed routine instances.
 */
export function getCompletions(tasks: Task[], daysToShow = 7): CompletionsResult {
  const cutoff = Date.now() - (daysToShow * 24 * 60 * 60 * 1000);
  const taskCompletions: TaskCompletion[] = [];
  let hasMore = false;

  for (const task of tasks) {
    if (task.deletedAt) continue;

    // Handle recurring tasks - check instance completions
    if (task.isRecurring && task.recurringInstances) {
      for (const instance of task.recurringInstances) {
        if (instance.completed && instance.completedAt) {
          if (instance.completedAt >= cutoff) {
            taskCompletions.push({
              taskId: task.id,
              taskTitle: task.title,
              isTaskCompleted: true,
              completedAt: instance.completedAt,
              focusTimeMinutes: 0, // Routines don't track focus time per instance
              completedSteps: [],
              isRoutine: true,
            });
          } else {
            hasMore = true;
          }
        }
      }
      continue; // Skip regular completion handling for recurring tasks
    }

    // Regular (non-recurring) tasks
    const isTaskCompleted = task.completedAt !== null;
    const taskCompletedInWindow = task.completedAt && task.completedAt >= cutoff;

    // Collect steps completed within the time window
    const completedSteps: StepCompletion[] = [];
    let hasStepsBeforeCutoff = false;

    for (const step of task.steps) {
      if (step.completedAt) {
        if (step.completedAt >= cutoff) {
          // Don't include individual steps if task itself is completed
          // (task completion implies all steps done)
          if (!isTaskCompleted) {
            completedSteps.push({
              stepId: step.id,
              stepText: step.text,
              completedAt: step.completedAt,
            });
          }
        } else {
          hasStepsBeforeCutoff = true;
        }
      }
    }

    // Check if task has completions before cutoff (for hasMore)
    if (task.completedAt && task.completedAt < cutoff) {
      hasMore = true;
    }
    if (hasStepsBeforeCutoff) {
      hasMore = true;
    }

    // Sort steps by completion time (most recent first)
    completedSteps.sort((a, b) => b.completedAt - a.completedAt);

    // Include this task if it has completions in the window
    if (taskCompletedInWindow || completedSteps.length > 0) {
      // Determine the "completedAt" for grouping:
      // - If task is completed, use task completion time
      // - Otherwise use the latest step completion time
      const completedAt = isTaskCompleted && task.completedAt
        ? task.completedAt
        : completedSteps.length > 0
          ? completedSteps[0].completedAt
          : Date.now();

      taskCompletions.push({
        taskId: task.id,
        taskTitle: task.title,
        isTaskCompleted,
        completedAt,
        focusTimeMinutes: task.totalTimeSpent || 0,
        completedSteps: isTaskCompleted ? [] : completedSteps, // Don't show steps if task is completed
      });
    }
  }

  // Sort by completedAt descending
  taskCompletions.sort((a, b) => b.completedAt - a.completedAt);

  // Group by date (using local timezone)
  const grouped = new Map<string, TaskCompletion[]>();
  for (const tc of taskCompletions) {
    const dateKey = timestampToLocalDate(tc.completedAt);
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(tc);
  }

  // Format display dates (using local timezone)
  const today = getTodayISO();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  const groups = Array.from(grouped.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, taskCompletions]) => ({
      dateKey,
      displayDate: dateKey === today ? 'Today'
        : dateKey === yesterday ? 'Yesterday'
        : new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          }),
      taskCompletions,
    }));

  return { groups, hasMore };
}

/**
 * Count completions for today (unique tasks with any completion activity).
 * For recurring tasks, counts each completed instance for today.
 */
export function countCompletionsToday(tasks: Task[]): number {
  const today = getTodayISO();
  let count = 0;

  for (const task of tasks) {
    if (task.deletedAt) continue;

    // Handle recurring tasks - count completed instances for today
    if (task.isRecurring && task.recurringInstances) {
      for (const instance of task.recurringInstances) {
        if (instance.completed && instance.completedAt) {
          const completedDate = timestampToLocalDate(instance.completedAt);
          if (completedDate === today) {
            count++;
          }
        }
      }
      continue; // Skip regular task handling for recurring tasks
    }

    // Regular tasks
    let hasCompletionToday = false;

    // Check task completion (using local timezone)
    if (task.completedAt) {
      const completedDate = timestampToLocalDate(task.completedAt);
      if (completedDate === today) {
        hasCompletionToday = true;
      }
    }

    // Check step completions (only if task not completed today - avoid double counting)
    if (!hasCompletionToday) {
      for (const step of task.steps) {
        if (step.completedAt) {
          const completedDate = timestampToLocalDate(step.completedAt);
          if (completedDate === today) {
            hasCompletionToday = true;
            break;
          }
        }
      }
    }

    if (hasCompletionToday) count++;
  }

  return count;
}

/**
 * Format minutes to a readable string (e.g., "45m" or "1h 15m")
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format a timestamp to a 12-hour time string (e.g., "2:34 PM")
 */
export function formatCompletionTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
