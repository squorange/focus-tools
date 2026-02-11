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

  // Try deadline first (only if specific time is set — date-only isn't enough info)
  if (task.deadlineDate && task.deadlineTime) {
    return dateToTimestamp(
      task.deadlineDate,
      task.deadlineTime,
      DEFAULT_DEADLINE_HOUR
    );
  }

  // Try target date (only if specific time is set)
  if (task.targetDate && task.targetTime) {
    return dateToTimestamp(
      task.targetDate,
      task.targetTime,
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
    // 15% of duration, minimum 5 minutes
    // Note: rounding is applied to the final start time instead of the buffer
    const rawBuffer = durationMinutes * 0.15;
    return Math.max(5, rawBuffer);
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

  // Start Poke Time = Anchor Time - (Duration + Buffer), rounded to nearest 5 minutes
  const rawPokeTime = anchorTime - (totalMinutes * 60 * 1000);
  const pokeTime = Math.round(rawPokeTime / 300000) * 300000; // 300000ms = 5 minutes

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
    // Round to nearest 5 minutes for cleaner start times
    const rawNudgeTime = anchorTime - (totalMinutes * 60 * 1000);
    nudgeTime = Math.round(rawNudgeTime / 300000) * 300000; // 300000ms = 5 minutes
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

// ============================================
// Runway Nudge Calculation
// ============================================
// Runway nudge fires 1 day before the EFFECTIVE deadline
// (effective deadline = deadline - leadTimeDays)
// This gives users a heads-up that they need to START the task soon,
// separate from the execution nudge (start_poke) which fires when
// they need to be actively working.

/**
 * Calculate the effective deadline for a task
 * Effective deadline = actual deadline - lead time days
 * This is when the user should ideally START working on the task
 */
export function getEffectiveDeadlineTimestamp(task: Task): {
  effectiveDeadline: number | null;
  actualDeadline: number | null;
  leadTimeDays: number;
} {
  // Must have a deadline date
  if (!task.deadlineDate) {
    return { effectiveDeadline: null, actualDeadline: null, leadTimeDays: 0 };
  }

  // Get actual deadline timestamp
  const actualDeadline = dateToTimestampForRunway(
    task.deadlineDate,
    task.deadlineTime || null,
    DEFAULT_DEADLINE_HOUR
  );

  const leadTimeDays = task.leadTimeDays || 0;

  if (leadTimeDays <= 0) {
    // No lead time configured - effective deadline equals actual deadline
    return { effectiveDeadline: actualDeadline, actualDeadline, leadTimeDays: 0 };
  }

  // Effective deadline = actual deadline - lead time days
  const effectiveDeadline = actualDeadline - (leadTimeDays * 24 * 60 * 60 * 1000);

  return { effectiveDeadline, actualDeadline, leadTimeDays };
}

/**
 * Convert date string + optional time to Unix timestamp (for runway calculation)
 */
function dateToTimestampForRunway(dateStr: string, time: string | null, defaultHour: number): number {
  const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues

  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  } else {
    date.setHours(defaultHour, 0, 0, 0);
  }

  return date.getTime();
}

/**
 * Calculate when the Runway Nudge should fire
 * Fires 1 day before the effective deadline
 * Returns null if task doesn't have lead time configured
 */
export function calculateRunwayNudgeTime(task: Task): {
  time: number | null;
  effectiveDeadline: number | null;
  actualDeadline: number | null;
  leadTimeDays: number;
} {
  const { effectiveDeadline, actualDeadline, leadTimeDays } = getEffectiveDeadlineTimestamp(task);

  // Only applicable if task has lead time configured
  if (!effectiveDeadline || leadTimeDays <= 0) {
    return { time: null, effectiveDeadline: null, actualDeadline: null, leadTimeDays: 0 };
  }

  // Runway nudge fires 1 day before effective deadline, at 9 AM
  const oneDayBefore = effectiveDeadline - (24 * 60 * 60 * 1000);

  // Set to 9 AM on that day for a reasonable reminder time
  const nudgeDate = new Date(oneDayBefore);
  nudgeDate.setHours(9, 0, 0, 0);
  const nudgeTime = nudgeDate.getTime();

  return { time: nudgeTime, effectiveDeadline, actualDeadline, leadTimeDays };
}

/**
 * Check if Runway Nudge is applicable for a task
 * Only tasks with leadTimeDays > 0 and a deadline get runway nudges
 */
export function isRunwayNudgeApplicable(task: Task): boolean {
  return (
    task.deadlineDate !== null &&
    task.leadTimeDays !== null &&
    task.leadTimeDays > 0 &&
    task.status !== 'complete' &&
    task.status !== 'archived'
  );
}

/**
 * Get the runway nudge status for a task
 * Used by UI and scheduling logic
 */
export interface RunwayNudgeStatus {
  applicable: boolean;           // Whether runway nudge applies to this task
  nudgeTime: number | null;      // When the nudge should fire
  effectiveDeadline: number | null;
  actualDeadline: number | null;
  leadTimeDays: number;
  daysUntilEffective: number | null;  // Days from now until effective deadline
}

export function getRunwayNudgeStatus(task: Task): RunwayNudgeStatus {
  if (!isRunwayNudgeApplicable(task)) {
    return {
      applicable: false,
      nudgeTime: null,
      effectiveDeadline: null,
      actualDeadline: null,
      leadTimeDays: 0,
      daysUntilEffective: null,
    };
  }

  const { time, effectiveDeadline, actualDeadline, leadTimeDays } = calculateRunwayNudgeTime(task);

  // Calculate days until effective deadline
  let daysUntilEffective: number | null = null;
  if (effectiveDeadline) {
    const now = Date.now();
    daysUntilEffective = Math.ceil((effectiveDeadline - now) / (24 * 60 * 60 * 1000));
  }

  return {
    applicable: true,
    nudgeTime: time,
    effectiveDeadline,
    actualDeadline,
    leadTimeDays,
    daysUntilEffective,
  };
}

/**
 * Format the runway nudge message for display
 */
export function formatRunwayNudgeMessage(task: Task): string {
  const status = getRunwayNudgeStatus(task);
  if (!status.applicable || !status.effectiveDeadline) {
    return '';
  }

  const effectiveDate = new Date(status.effectiveDeadline);
  const dateStr = effectiveDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return `Start by ${dateStr} to finish on time (${status.leadTimeDays}d lead time)`;
}
