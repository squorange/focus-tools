// ============================================
// Notification System Types
// ============================================
// Separate from Nudge system:
// - Nudges = contextual awareness prompts (task health, inbox status)
// - Notifications = time-scheduled alerts (start nudge, reminders, streaks)

export interface Notification {
  id: string;
  type: NotificationType;
  taskId: string | null;
  instanceId: string | null;  // For recurring task instances (date string like "2026-01-25")
  title: string;
  body: string;
  icon: NotificationIcon;
  scheduledAt: number;        // Unix timestamp (ms) when notification should fire
  firedAt: number | null;     // Unix timestamp (ms) when notification actually fired
  acknowledgedAt: number | null;  // Unix timestamp (ms) when user dismissed/actioned
  deepLink: string;           // URL or route to navigate to on click
}

export type NotificationType = 'start_poke' | 'runway_nudge' | 'reminder' | 'streak' | 'system';

export type NotificationIcon = 'bell-ring' | 'clock' | 'flame' | 'info';

// User preference for which tasks get Start Time Poke by default
export type StartPokeDefault = 'all' | 'routines_only' | 'tasks_only' | 'none';

// Per-task override for Start Time Poke (null = use default)
export type StartPokeOverride = 'on' | 'off' | null;

// Source of the duration estimate
export type DurationSource = 'manual' | 'ai' | 'steps' | null;

// Status object returned by getStartPokeStatus()
export interface StartPokeStatus {
  // Whether start poke is effectively enabled (considering default + override)
  enabled: boolean;
  // The resolved override value ('on', 'off', or null for default)
  override: StartPokeOverride;
  // Whether the task has an anchor time (target/deadline/recurrence)
  hasAnchor: boolean;
  // Whether the task has a duration estimate
  hasDuration: boolean;
  // The calculated start poke time (null if missing anchor or duration)
  nudgeTime: number | null;
  // The anchor time being used
  anchorTime: number | null;
  // The duration in minutes
  durationMinutes: number | null;
  // The buffer in minutes
  bufferMinutes: number | null;
  // Why start poke can't be calculated (if applicable)
  missingReason: 'no_anchor' | 'no_duration' | 'calculating' | null;
}

// Settings related to Start Time Poke
export interface StartPokeSettings {
  startPokeEnabled: boolean;               // Top-level toggle to enable/disable globally
  startPokeDefault: StartPokeDefault;
  startPokeBufferMinutes: number;          // Fixed buffer in minutes
  startPokeBufferPercentage: boolean;      // If true, use 15% instead of fixed buffer
}

// Notification for display in hub, grouped by date
export interface NotificationGroup {
  label: string;           // "Today", "Yesterday", "January 24", etc.
  date: string;            // ISO date string for sorting
  notifications: Notification[];
}

// ============================================
// Alert Types (for MiniBar/Palette display)
// ============================================

// Start Poke alert data for UI display
export interface StartPokeAlert {
  taskId: string;
  taskTitle: string;
  notificationId: string;
  anchorTime: number;        // Unix timestamp of when task is due
  durationMinutes: number;
  bufferMinutes: number;
  usePercentageBuffer: boolean;  // Whether 15% buffer mode was used
  onStart: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

// Reminder alert data for UI display
export interface ReminderAlert {
  taskId: string;
  taskTitle: string;
  notificationId: string;
  reminderTime: number;      // When reminder was set to fire
  onView: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

// Runway nudge alert data for UI display
// Fires 1 day before effective deadline (deadline - leadTimeDays)
// Different from start_poke which fires right before task needs to start
export interface RunwayNudgeAlert {
  taskId: string;
  taskTitle: string;
  notificationId: string;
  effectiveDeadline: number;   // Unix timestamp of effective deadline (deadline - leadTimeDays)
  actualDeadline: number;      // Unix timestamp of actual deadline
  leadTimeDays: number;        // The lead time that was configured
  onStart: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

// Unified alert type for cycling through multiple alerts
export type ActiveAlert =
  | { type: 'poke'; data: StartPokeAlert }
  | { type: 'runway'; data: RunwayNudgeAlert }
  | { type: 'reminder'; data: ReminderAlert };
