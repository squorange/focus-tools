/**
 * Start Time Poke Calculation Utilities
 *
 * Formula: Start Poke Time = Anchor Time - Duration - Buffer
 *
 * Anchor Time: When the task should be finished
 * - Deadline date + optional deadlineTime
 * - Target date + optional targetTime
 * - Recurring task's scheduled time
 *
 * Duration: How long the task takes
 * - Task's estimatedDurationMinutes (manual or AI)
 * - Sum of step estimates
 * - null if no estimate available
 *
 * Buffer: Extra time before starting
 * - Fixed minutes from settings
 * - Or 15% of duration (if setting enabled)
 */

import { Task, Step } from './types';
import {
  StartPokeStatus,
  StartPokeSettings,
  DurationSource,
} from './notification-types';
import { getNextOccurrenceFromToday, getTodayISO, timestampToLocalDate } from './recurring-utils';
import { RecurrenceRuleExtended } from './recurring-types';

// Default times for dates without specific times
const DEFAULT_TARGET_HOUR = 9;    // 9 AM for target dates
const DEFAULT_DEADLINE_HOUR = 17; // 5 PM for deadlines

/**
 * Get the anchor time for a task - when it should be completed
 * Returns Unix timestamp in ms, or null if no anchor
 */
export function getAnchorTime(task: Task): number | null {
  // Priority: deadline > target > recurrence time

  // Try deadline first
  if (task.deadlineDate) {
    return dateToTimestamp(
      task.deadlineDate,
      task.deadlineTime || null,
      DEFAULT_DEADLINE_HOUR
    );
  }

  // Try target date
  if (task.targetDate) {
    return dateToTimestamp(
      task.targetDate,
      task.targetTime || null,
      DEFAULT_TARGET_HOUR
    );
  }

  // For recurring tasks, calculate actual next occurrence
  if (task.isRecurring && task.recurrence?.time) {
    // Get actual next occurrence based on pattern (not just stored recurringNextDue)
    const today = getTodayISO();
    const pattern = task.recurrence as RecurrenceRuleExtended;
    const startDate = pattern.startDate
      || (task.createdAt ? timestampToLocalDate(task.createdAt) : today);
    let anchorDate = task.recurringNextDue;

    // If recurringNextDue is missing, past, or doesn't match pattern, recalculate
    if (!anchorDate || anchorDate < today) {
      // Find next valid occurrence from today (inclusive)
      anchorDate = getNextOccurrenceFromToday(pattern, startDate, today) || today;
    }

    return dateToTimestamp(anchorDate, pattern.time!, DEFAULT_TARGET_HOUR);
  }

  return null;
}

/**
 * Convert date string + optional time to Unix timestamp
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @param time - Optional time in HH:mm format
 * @param defaultHour - Default hour to use if no time specified
 */
function dateToTimestamp(dateStr: string, time: string | null, defaultHour: number): number {
  const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues

  if (time) {
    // Parse HH:mm format
    const [hours, minutes] = time.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  } else {
    // Use the provided default hour
    date.setHours(defaultHour, 0, 0, 0);
  }

  return date.getTime();
}

/**
 * Get the duration of a task in minutes
 * Priority: task.estimatedDurationMinutes > sum of step estimates > null
 */
export function getDuration(task: Task): { minutes: number | null; source: DurationSource } {
  // Task-level duration estimate takes priority
  if (task.estimatedDurationMinutes != null && task.estimatedDurationMinutes > 0) {
    return { minutes: task.estimatedDurationMinutes, source: task.estimatedDurationSource || 'manual' };
  }

  // Fall back to legacy estimatedMinutes
  if (task.estimatedMinutes != null && task.estimatedMinutes > 0) {
    return { minutes: task.estimatedMinutes, source: 'manual' };
  }

  // Sum step estimates
  const stepSum = getStepDurationSum(task.steps);
  if (stepSum > 0) {
    return { minutes: stepSum, source: 'steps' };
  }

  return { minutes: null, source: null };
}

/**
 * Sum the estimated minutes from steps
 */
export function getStepDurationSum(steps: Step[]): number {
  return steps.reduce((sum, step) => {
    return sum + (step.estimatedMinutes || 0);
  }, 0);
}

/**
 * Calculate buffer time in minutes
 * Either fixed minutes or 15% of duration
 */
export function calculateBuffer(
  durationMinutes: number,
  settings: StartPokeSettings
): number {
  if (settings.startPokeBufferPercentage) {
    // 15% of duration, rounded to nearest 5 minutes, minimum 5 minutes
    const rawBuffer = durationMinutes * 0.15;
    const roundedToFive = Math.round(rawBuffer / 5) * 5;
    return Math.max(5, roundedToFive);
  }

  return settings.startPokeBufferMinutes;
}

/**
 * Calculate when the Start Time Poke should fire
 * Returns Unix timestamp in ms, or null if can't be calculated
 */
export function calculateStartPokeTime(
  task: Task,
  settings: StartPokeSettings
): { time: number | null; anchorTime: number | null; durationMinutes: number | null; bufferMinutes: number | null } {
  const anchorTime = getAnchorTime(task);
  if (anchorTime === null) {
    return { time: null, anchorTime: null, durationMinutes: null, bufferMinutes: null };
  }

  const { minutes: durationMinutes } = getDuration(task);
  if (durationMinutes === null) {
    return { time: null, anchorTime, durationMinutes: null, bufferMinutes: null };
  }

  const bufferMinutes = calculateBuffer(durationMinutes, settings);
  const totalMinutes = durationMinutes + bufferMinutes;

  // Start Poke Time = Anchor Time - (Duration + Buffer)
  const pokeTime = anchorTime - (totalMinutes * 60 * 1000);

  return { time: pokeTime, anchorTime, durationMinutes, bufferMinutes };
}

/**
 * Check if Start Time Poke is enabled for a task
 * Considers per-task override first, then global toggle and scope setting
 */
export function isStartPokeEnabled(
  task: Task,
  settings: StartPokeSettings
): boolean {
  const override = task.startPokeOverride ?? null;

  // Explicit task-level overrides take precedence over global settings
  if (override === 'on') return true;
  if (override === 'off') return false;

  // Use global settings for default behavior
  if (!settings.startPokeEnabled) {
    return false;
  }

  // Apply default setting based on scope
  switch (settings.startPokeDefault) {
    case 'all':
      return true;
    case 'routines_only':
      return task.isRecurring;
    case 'tasks_only':
      return !task.isRecurring;
    case 'none':
      return false;
    default:
      return false;
  }
}

/**
 * Get full Start Time Poke status for a task
 * Used by UI to show appropriate state
 */
export function getStartPokeStatus(
  task: Task,
  settings: StartPokeSettings
): StartPokeStatus {
  const enabled = isStartPokeEnabled(task, settings);
  const override = task.startPokeOverride ?? null;

  const anchorTime = getAnchorTime(task);
  const hasAnchor = anchorTime !== null;

  const { minutes: durationMinutes } = getDuration(task);
  const hasDuration = durationMinutes !== null && durationMinutes > 0;

  // Determine missing reason
  let missingReason: StartPokeStatus['missingReason'] = null;
  if (!hasAnchor) {
    missingReason = 'no_anchor';
  } else if (!hasDuration) {
    missingReason = 'no_duration';
  }

  // Calculate poke time if we have all inputs
  let nudgeTime: number | null = null;
  let bufferMinutes: number | null = null;

  if (hasAnchor && hasDuration && durationMinutes) {
    bufferMinutes = calculateBuffer(durationMinutes, settings);
    const totalMinutes = durationMinutes + bufferMinutes;
    nudgeTime = anchorTime - (totalMinutes * 60 * 1000);
  }

  return {
    enabled,
    override,
    hasAnchor,
    hasDuration,
    nudgeTime,
    anchorTime,
    durationMinutes,
    bufferMinutes,
    missingReason: enabled ? missingReason : null,
  };
}

/**
 * Format a time for display (e.g., "7:08 AM")
 */
export function formatPokeTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format an anchor time for display (e.g., "8:00 AM" or "due 8:00 AM")
 */
export function formatAnchorTime(timestamp: number, includePrefix: boolean = false): string {
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return includePrefix ? `due ${timeStr}` : timeStr;
}

/**
 * Format duration for display (e.g., "45 min" or "1h 15m")
 */
export function formatDurationForPoke(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Get the effective default value text for UI
 */
export function getDefaultText(settings: StartPokeSettings): string {
  if (!settings.startPokeEnabled) {
    return 'Off';
  }

  switch (settings.startPokeDefault) {
    case 'all':
      return 'On';
    case 'routines_only':
      return 'On (routines only)';
    case 'tasks_only':
      return 'On (tasks only)';
    case 'none':
      return 'Off';
    default:
      return 'Off';
  }
}

/**
 * Check if the override differs from what the default would produce
 */
export function overrideDiffersFromDefault(
  task: Task,
  settings: StartPokeSettings
): boolean {
  const override = task.startPokeOverride;
  if (override === null) return false;

  // Calculate what the default would be for this task
  const defaultEnabled = (() => {
    if (!settings.startPokeEnabled) return false;

    switch (settings.startPokeDefault) {
      case 'all':
        return true;
      case 'routines_only':
        return task.isRecurring;
      case 'tasks_only':
        return !task.isRecurring;
      case 'none':
        return false;
      default:
        return false;
    }
  })();

  const overrideEnabled = override === 'on';
  return overrideEnabled !== defaultEnabled;
}
