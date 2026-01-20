// ============================================
// Recurring Tasks Types
// ============================================

// Re-export RecurringInstance and RecurrenceRule from types.ts
// They are the canonical definitions
export type { RecurringInstance, RecurrenceRule } from './types';
import type { RecurringInstance, RecurrenceRule } from './types';

/**
 * Instance status for calendar display
 */
export type InstanceStatus =
  | 'completed'   // User completed this occurrence
  | 'skipped'     // User explicitly skipped
  | 'missed'      // Date passed without completion
  | 'overdue'     // Rollover enabled, not yet completed
  | 'paused'      // Routine was paused on this date
  | 'pending'     // Future occurrence
  | 'today'       // Due today, not yet completed
  | 'no_occurrence'; // Doesn't fall on this date per pattern

/**
 * Instance data for calendar/history views
 */
export interface TaskInstance {
  date: string;                    // ISO date
  status: InstanceStatus;
  instance: RecurringInstance | null;  // Full instance if exists
  isToday: boolean;
}

/**
 * Extended RecurrenceRule with start date for interval calculations
 * RecurrenceRule is now the base type with all fields (v9 schema)
 */
export interface RecurrenceRuleExtended extends RecurrenceRule {
  // Start date for interval calculations (typically task.createdAt as ISO date)
  startDate: string;
}

/**
 * Routine metadata pill for UI display
 */
export interface RoutinePill {
  label: string;
  icon?: string;
  color: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'violet';
}

/**
 * Filter options for routines
 */
export type RoutineFilter =
  | 'all'
  | 'due_today'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'paused'
  | 'active';

/**
 * Sort options for routines
 */
export type RoutineSort =
  | 'next_due'
  | 'streak'
  | 'last_completed'
  | 'time'
  | 'title';
