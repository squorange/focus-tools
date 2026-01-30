/**
 * Notification Management Utilities
 *
 * Handles creating, scheduling, updating, and querying notifications.
 * Works with the Notification[] array stored separately from main state.
 */

import { Task, generateId } from './types';
import {
  Notification,
  NotificationType,
  NotificationIcon,
  NotificationGroup,
  StartPokeSettings,
  StartPokeAlert,
  ReminderAlert,
  RunwayNudgeAlert,
  ActiveAlert,
} from './notification-types';
import {
  calculateStartPokeTime,
  isStartPokeEnabled,
  getAnchorTime,
  getDuration,
  calculateBuffer,
  calculateRunwayNudgeTime,
  isRunwayNudgeApplicable,
  getRunwayNudgeStatus,
} from './start-poke-utils';

// ============================================
// Factory Functions
// ============================================

/**
 * Create a new notification object
 */
export function createNotification(
  type: NotificationType,
  task: Task | null,
  scheduledAt: number,
  options: {
    title: string;
    body: string;
    instanceId?: string | null;
  }
): Notification {
  return {
    id: generateId(),
    type,
    taskId: task?.id ?? null,
    instanceId: options.instanceId ?? null,
    title: options.title,
    body: options.body,
    icon: getIconForType(type),
    scheduledAt,
    firedAt: null,
    acknowledgedAt: null,
    deepLink: task ? `/task/${task.id}` : '/',
  };
}

/**
 * Get the icon for a notification type
 */
function getIconForType(type: NotificationType): NotificationIcon {
  switch (type) {
    case 'start_poke':
      return 'bell-ring';
    case 'runway_nudge':
      return 'clock';  // Different icon to distinguish from start_poke
    case 'reminder':
      return 'clock';
    case 'streak':
      return 'flame';
    case 'system':
    default:
      return 'info';
  }
}

// ============================================
// Start Poke Scheduling
// ============================================

/**
 * Schedule a Start Time Poke for a task
 * Returns updated notifications array and the created notification (if any)
 */
export function scheduleStartPoke(
  task: Task,
  settings: StartPokeSettings,
  notifications: Notification[],
  instanceId?: string | null
): { notifications: Notification[]; created: Notification | null } {
  // First, cancel any existing start poke for this task
  let updated = cancelStartPoke(task.id, notifications, instanceId);

  // Check if start poke is enabled for this task
  if (!isStartPokeEnabled(task, settings)) {
    return { notifications: updated, created: null };
  }

  // Calculate the poke time
  const { time: pokeTime, durationMinutes } = calculateStartPokeTime(task, settings);

  if (pokeTime === null || durationMinutes === null) {
    return { notifications: updated, created: null };
  }

  // Don't schedule if the time has already passed
  const now = Date.now();
  if (pokeTime < now) {
    // If it's only slightly past, we could fire immediately
    // But for now, skip scheduling past notifications
    return { notifications: updated, created: null };
  }

  // Create the notification with poke emoji format
  const notification = createNotification('start_poke', task, pokeTime, {
    title: '👉🏽 Time to start',
    body: task.title,
    instanceId,
  });

  updated = [...updated, notification];

  return { notifications: updated, created: notification };
}

/**
 * Cancel Start Poke notification(s) for a task
 */
export function cancelStartPoke(
  taskId: string,
  notifications: Notification[],
  instanceId?: string | null
): Notification[] {
  return notifications.filter((n) => {
    if (n.type !== 'start_poke') return true;
    if (n.taskId !== taskId) return true;
    // If instanceId provided, only cancel matching instance
    if (instanceId !== undefined && n.instanceId !== instanceId) return true;
    // Cancel if not yet fired
    return n.firedAt !== null;
  });
}

/**
 * Update Start Poke when task changes
 * Call this when task's anchor time, duration, or poke settings change
 */
export function updateStartPoke(
  task: Task,
  settings: StartPokeSettings,
  notifications: Notification[],
  instanceId?: string | null
): { notifications: Notification[]; created: Notification | null } {
  // Re-schedule (which cancels existing first)
  return scheduleStartPoke(task, settings, notifications, instanceId);
}

// ============================================
// Runway Nudge Scheduling
// ============================================
// Runway nudges fire 1 day before the EFFECTIVE deadline
// (effective deadline = actual deadline - lead time days)
// This is separate from start_poke which fires based on duration+buffer

/**
 * Schedule a Runway Nudge for a task
 * Only applicable for tasks with leadTimeDays > 0
 * Returns updated notifications array and the created notification (if any)
 */
export function scheduleRunwayNudge(
  task: Task,
  notifications: Notification[]
): { notifications: Notification[]; created: Notification | null } {
  // First, cancel any existing runway nudge for this task
  let updated = cancelRunwayNudge(task.id, notifications);

  // Check if runway nudge is applicable
  if (!isRunwayNudgeApplicable(task)) {
    return { notifications: updated, created: null };
  }

  // Calculate the runway nudge time
  const { time: nudgeTime, effectiveDeadline, leadTimeDays } = calculateRunwayNudgeTime(task);

  if (nudgeTime === null || effectiveDeadline === null) {
    return { notifications: updated, created: null };
  }

  // Don't schedule if the time has already passed
  const now = Date.now();
  if (nudgeTime < now) {
    return { notifications: updated, created: null };
  }

  // Format the effective deadline for the message
  const effectiveDate = new Date(effectiveDeadline);
  const dateStr = effectiveDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Create the notification
  const notification = createNotification('runway_nudge', task, nudgeTime, {
    title: '🏃 Time to get started',
    body: `${task.title} — Start by ${dateStr} to finish on time`,
  });

  updated = [...updated, notification];

  return { notifications: updated, created: notification };
}

/**
 * Cancel Runway Nudge notification(s) for a task
 */
export function cancelRunwayNudge(
  taskId: string,
  notifications: Notification[]
): Notification[] {
  return notifications.filter((n) => {
    if (n.type !== 'runway_nudge') return true;
    if (n.taskId !== taskId) return true;
    // Cancel if not yet fired
    return n.firedAt !== null;
  });
}

/**
 * Update Runway Nudge when task changes
 * Call this when task's deadline or lead time changes
 */
export function updateRunwayNudge(
  task: Task,
  notifications: Notification[]
): { notifications: Notification[]; created: Notification | null } {
  // Re-schedule (which cancels existing first)
  return scheduleRunwayNudge(task, notifications);
}

/**
 * Schedule both Start Poke and Runway Nudge for a task
 * Convenience function for when task is created/updated
 */
export function scheduleAllNudges(
  task: Task,
  settings: StartPokeSettings,
  notifications: Notification[]
): { notifications: Notification[]; createdPoke: Notification | null; createdRunway: Notification | null } {
  // Schedule start poke
  const pokeResult = scheduleStartPoke(task, settings, notifications);

  // Schedule runway nudge
  const runwayResult = scheduleRunwayNudge(task, pokeResult.notifications);

  return {
    notifications: runwayResult.notifications,
    createdPoke: pokeResult.created,
    createdRunway: runwayResult.created,
  };
}

// ============================================
// Notification Lifecycle
// ============================================

/**
 * Mark a notification as fired
 */
export function markNotificationFired(
  notificationId: string,
  notifications: Notification[]
): Notification[] {
  return notifications.map((n) => {
    if (n.id === notificationId) {
      return { ...n, firedAt: Date.now() };
    }
    return n;
  });
}

/**
 * Mark a notification as acknowledged (user dismissed or actioned it)
 */
export function markNotificationAcknowledged(
  notificationId: string,
  notifications: Notification[]
): Notification[] {
  return notifications.map((n) => {
    if (n.id === notificationId) {
      return { ...n, acknowledgedAt: Date.now() };
    }
    return n;
  });
}

/**
 * Snooze a notification by rescheduling it
 */
export function snoozeNotification(
  notificationId: string,
  notifications: Notification[],
  snoozeMinutes: number
): Notification[] {
  const now = Date.now();
  const snoozeUntil = now + (snoozeMinutes * 60 * 1000);

  return notifications.map((n) => {
    if (n.id === notificationId) {
      return {
        ...n,
        scheduledAt: snoozeUntil,
        firedAt: null,
        acknowledgedAt: null,
      };
    }
    return n;
  });
}

// ============================================
// Querying
// ============================================

/**
 * Get notifications that should fire now (scheduled time passed but not fired)
 * Filters out notifications for completed tasks
 */
export function getReadyToFire(
  notifications: Notification[],
  tasks?: Task[]
): Notification[] {
  const now = Date.now();
  return notifications.filter((n) => {
    // Basic check: not fired yet and scheduled time passed
    if (n.firedAt !== null || n.scheduledAt > now) return false;

    // If tasks array provided, filter out completed tasks
    if (tasks && n.taskId) {
      const task = tasks.find(t => t.id === n.taskId);
      // Skip if task is completed or doesn't exist
      if (!task || task.status === 'complete' || task.completedAt !== null) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Cancel all pending notifications for a completed task
 * Call this when a task is marked complete
 */
export function cancelNotificationsForCompletedTask(
  taskId: string,
  notifications: Notification[]
): Notification[] {
  return notifications.filter((n) => {
    // Keep notifications for other tasks
    if (n.taskId !== taskId) return true;
    // Keep already-fired notifications (for history)
    if (n.firedAt !== null) return true;
    // Remove pending notifications for this task
    return false;
  });
}

/**
 * Get unacknowledged notifications (fired but not dismissed)
 */
export function getUnacknowledged(notifications: Notification[]): Notification[] {
  return notifications.filter((n) => {
    return n.firedAt !== null && n.acknowledgedAt === null;
  });
}

/**
 * Get count of unacknowledged notifications (for badge)
 */
export function getUnacknowledgedCount(notifications: Notification[]): number {
  return getUnacknowledged(notifications).length;
}

/**
 * Get upcoming notifications (scheduled but not fired)
 */
export function getUpcoming(notifications: Notification[]): Notification[] {
  const now = Date.now();
  return notifications
    .filter((n) => n.firedAt === null && n.scheduledAt > now)
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
}

/**
 * Get the most recent active Start Poke for a task (fired but not acknowledged)
 */
export function getActiveStartPoke(
  taskId: string,
  notifications: Notification[]
): Notification | null {
  return notifications.find((n) => {
    return (
      n.type === 'start_poke' &&
      n.taskId === taskId &&
      n.firedAt !== null &&
      n.acknowledgedAt === null
    );
  }) ?? null;
}

/**
 * Get any active Start Poke (fired but not acknowledged) - returns most recent
 */
export function getAnyActiveStartPoke(
  notifications: Notification[]
): Notification | null {
  const active = notifications.filter((n) => {
    return (
      n.type === 'start_poke' &&
      n.firedAt !== null &&
      n.acknowledgedAt === null
    );
  });

  if (active.length === 0) return null;

  // Return the most recently fired one
  return active.reduce((latest, n) => {
    return (n.firedAt ?? 0) > (latest.firedAt ?? 0) ? n : latest;
  });
}

/**
 * Get all notifications for a specific task
 */
export function getNotificationsForTask(
  taskId: string,
  notifications: Notification[]
): Notification[] {
  return notifications.filter((n) => n.taskId === taskId);
}

// ============================================
// Grouping for Display
// ============================================

/**
 * Group notifications by date for hub display
 */
export function groupNotificationsByDate(
  notifications: Notification[]
): NotificationGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Sort by scheduled time (most recent first for past, soonest first for upcoming)
  const sorted = [...notifications].sort((a, b) => {
    // Future notifications: ascending by scheduled time
    // Past notifications: descending by fired/scheduled time
    const aIsFuture = a.scheduledAt > now.getTime();
    const bIsFuture = b.scheduledAt > now.getTime();

    if (aIsFuture && bIsFuture) {
      return a.scheduledAt - b.scheduledAt;
    }
    if (!aIsFuture && !bIsFuture) {
      return (b.firedAt || b.scheduledAt) - (a.firedAt || a.scheduledAt);
    }
    // Future before past
    return aIsFuture ? -1 : 1;
  });

  const groups: Map<string, Notification[]> = new Map();

  for (const notification of sorted) {
    const notifDate = new Date(notification.scheduledAt);
    const dateKey = notifDate.toISOString().split('T')[0];

    // Determine label
    let label: string;
    const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

    if (notifDay.getTime() > today.getTime()) {
      // Future
      const diff = Math.ceil((notifDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        label = 'Tomorrow';
      } else if (diff <= 7) {
        label = notifDate.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        label = notifDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      }
    } else if (notifDay.getTime() === today.getTime()) {
      label = 'Today';
    } else if (notifDay.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = notifDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }

    const key = `${dateKey}|${label}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(notification);
  }

  // Convert to array
  const result: NotificationGroup[] = [];
  Array.from(groups.entries()).forEach(([key, notifs]) => {
    const [date, label] = key.split('|');
    result.push({
      label,
      date,
      notifications: notifs,
    });
  });

  // Sort groups: upcoming first (sorted by date asc), then past (sorted by date desc)
  result.sort((a, b) => {
    const aDate = new Date(a.date).getTime();
    const bDate = new Date(b.date).getTime();
    const todayTime = today.getTime();

    const aIsFuture = aDate >= todayTime;
    const bIsFuture = bDate >= todayTime;

    if (aIsFuture && bIsFuture) {
      return aDate - bDate;
    }
    if (!aIsFuture && !bIsFuture) {
      return bDate - aDate;
    }
    return aIsFuture ? -1 : 1;
  });

  return result;
}

// ============================================
// Active Alerts (for MiniBar/Palette display)
// ============================================

/**
 * Get all active Start Pokes as alert objects for UI display
 * Returns array sorted by fired time (most recent first)
 */
export function getActiveStartPokes(
  notifications: Notification[],
  tasks: Task[],
  settings: StartPokeSettings,
  handlers: {
    onStart: (taskId: string, notificationId: string) => void;
    onSnooze: (notificationId: string, minutes: number) => void;
    onDismiss: (notificationId: string) => void;
  }
): StartPokeAlert[] {
  const active = notifications.filter((n) => {
    return (
      n.type === 'start_poke' &&
      n.firedAt !== null &&
      n.acknowledgedAt === null
    );
  });

  return active
    .map((n): StartPokeAlert | null => {
      const task = tasks.find(t => t.id === n.taskId);
      if (!task) return null;

      // Get anchor time and duration for display
      const anchorTime = getAnchorTime(task);
      const { minutes: durationMinutes } = getDuration(task);
      const bufferMinutes = durationMinutes
        ? calculateBuffer(durationMinutes, settings)
        : 0;

      return {
        taskId: task.id,
        taskTitle: task.title,
        notificationId: n.id,
        anchorTime: anchorTime ?? Date.now() + 60 * 60 * 1000, // Fallback to 1hr from now
        durationMinutes: durationMinutes ?? 30, // Fallback
        bufferMinutes,
        usePercentageBuffer: settings.startPokeBufferPercentage,
        onStart: () => handlers.onStart(task.id, n.id),
        onSnooze: (minutes: number) => handlers.onSnooze(n.id, minutes),
        onDismiss: () => handlers.onDismiss(n.id),
      };
    })
    .filter((alert): alert is StartPokeAlert => alert !== null)
    .sort((a, b) => b.anchorTime - a.anchorTime); // Most urgent first
}

/**
 * Get all active Reminders as alert objects for UI display
 * Returns array sorted by reminder time (most recent first)
 */
export function getActiveReminders(
  notifications: Notification[],
  tasks: Task[],
  handlers: {
    onView: (taskId: string, notificationId: string) => void;
    onSnooze: (notificationId: string, minutes: number) => void;
    onDismiss: (notificationId: string) => void;
  }
): ReminderAlert[] {
  const active = notifications.filter((n) => {
    return (
      n.type === 'reminder' &&
      n.firedAt !== null &&
      n.acknowledgedAt === null
    );
  });

  return active
    .map((n): ReminderAlert | null => {
      const task = tasks.find(t => t.id === n.taskId);
      if (!task) return null;

      return {
        taskId: task.id,
        taskTitle: task.title,
        notificationId: n.id,
        reminderTime: n.scheduledAt,
        onView: () => handlers.onView(task.id, n.id),
        onSnooze: (minutes: number) => handlers.onSnooze(n.id, minutes),
        onDismiss: () => handlers.onDismiss(n.id),
      };
    })
    .filter((alert): alert is ReminderAlert => alert !== null)
    .sort((a, b) => b.reminderTime - a.reminderTime); // Most recent first
}

/**
 * Get all active alerts (pokes + reminders) as unified array
 * Optionally filter by task ID for focus mode
 */
export function getAllActiveAlerts(
  notifications: Notification[],
  tasks: Task[],
  settings: StartPokeSettings,
  handlers: {
    onStartPoke: (taskId: string, notificationId: string) => void;
    onViewReminder: (taskId: string, notificationId: string) => void;
    onSnooze: (notificationId: string, minutes: number) => void;
    onDismiss: (notificationId: string) => void;
  },
  filterTaskId?: string | null
): ActiveAlert[] {
  const alerts: ActiveAlert[] = [];

  // Get active pokes
  const pokes = getActiveStartPokes(notifications, tasks, settings, {
    onStart: handlers.onStartPoke,
    onSnooze: handlers.onSnooze,
    onDismiss: handlers.onDismiss,
  });

  for (const poke of pokes) {
    // Filter by task ID if in focus mode
    if (filterTaskId && poke.taskId !== filterTaskId) continue;
    alerts.push({ type: 'poke', data: poke });
  }

  // Get active reminders
  const reminders = getActiveReminders(notifications, tasks, {
    onView: handlers.onViewReminder,
    onSnooze: handlers.onSnooze,
    onDismiss: handlers.onDismiss,
  });

  for (const reminder of reminders) {
    // Filter by task ID if in focus mode
    if (filterTaskId && reminder.taskId !== filterTaskId) continue;
    alerts.push({ type: 'reminder', data: reminder });
  }

  return alerts;
}

// ============================================
// Cleanup
// ============================================

/**
 * Remove old acknowledged notifications (older than 7 days)
 */
export function cleanupOldNotifications(notifications: Notification[]): Notification[] {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

  return notifications.filter((n) => {
    // Keep if not acknowledged
    if (n.acknowledgedAt === null) return true;
    // Keep if acknowledged recently
    return n.acknowledgedAt > cutoff;
  });
}

/**
 * Remove notifications for deleted tasks
 */
export function removeNotificationsForTask(
  taskId: string,
  notifications: Notification[]
): Notification[] {
  return notifications.filter((n) => n.taskId !== taskId);
}
