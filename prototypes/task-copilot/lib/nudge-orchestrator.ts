/**
 * Nudge Orchestrator
 *
 * Implements the B+C hybrid approach:
 * - Deduplication: Prevents rapid-fire nudges for the same task (cooldown period)
 * - Priority Queue: Fires highest priority nudges first
 * - Quiet Hours: Downgrades push to badge during quiet hours (except critical)
 *
 * This layer sits between notification scheduling and firing,
 * determining WHICH notifications actually get shown to the user.
 */

import { Notification, NotificationType } from './notification-types';
import { UserSettings, Task, PriorityTier } from './types';
import { getTaskPriorityInfo } from './priority';

// ============================================
// Types
// ============================================

/**
 * Tracks when nudges were last fired per task
 * Used for deduplication/cooldown enforcement
 */
export interface NudgeTracker {
  // Map of taskId -> timestamp of last fired nudge
  lastNudgeByTask: Record<string, number>;
  // Map of notificationType -> timestamp of last fired nudge of this type (global)
  lastNudgeByType: Record<NotificationType, number>;
}

/**
 * Delivery method for a nudge
 * - 'push': Full notification (sound, banner, etc.)
 * - 'badge': Silent badge update only
 * - 'suppressed': Don't show at all (cooldown)
 */
export type NudgeDeliveryMethod = 'push' | 'badge' | 'suppressed';

/**
 * Result of orchestration for a single notification
 */
export interface OrchestratedNudge {
  notification: Notification;
  deliveryMethod: NudgeDeliveryMethod;
  suppressionReason: string | null;
  priorityScore: number;  // Higher = more important, fire first
}

/**
 * Priority levels for nudge types (higher = more urgent)
 */
const NUDGE_TYPE_PRIORITY: Record<NotificationType, number> = {
  'start_poke': 100,    // Execution nudge - time sensitive
  'runway_nudge': 80,   // Planning reminder - important but not immediate
  'streak': 60,         // Streak maintenance
  'reminder': 50,       // User-set reminder
  'system': 10,         // System notifications
};

// ============================================
// Deduplication Layer
// ============================================

/**
 * Create an empty NudgeTracker
 */
export function createNudgeTracker(): NudgeTracker {
  return {
    lastNudgeByTask: {},
    lastNudgeByType: {} as Record<NotificationType, number>,
  };
}

/**
 * Check if a nudge is within cooldown period for its task
 */
export function isInCooldown(
  notification: Notification,
  tracker: NudgeTracker,
  cooldownMinutes: number
): boolean {
  if (!notification.taskId) return false;

  const lastNudge = tracker.lastNudgeByTask[notification.taskId];
  if (!lastNudge) return false;

  const cooldownMs = cooldownMinutes * 60 * 1000;
  const now = Date.now();

  return (now - lastNudge) < cooldownMs;
}

/**
 * Record that a nudge was fired for a task
 */
export function recordNudgeFired(
  notification: Notification,
  tracker: NudgeTracker
): NudgeTracker {
  const now = Date.now();

  return {
    lastNudgeByTask: notification.taskId
      ? { ...tracker.lastNudgeByTask, [notification.taskId]: now }
      : tracker.lastNudgeByTask,
    lastNudgeByType: {
      ...tracker.lastNudgeByType,
      [notification.type]: now,
    },
  };
}

/**
 * Clean up old entries from tracker (older than 24 hours)
 */
export function cleanupNudgeTracker(tracker: NudgeTracker): NudgeTracker {
  const cutoff = Date.now() - (24 * 60 * 60 * 1000);

  const cleanedByTask: Record<string, number> = {};
  for (const [taskId, timestamp] of Object.entries(tracker.lastNudgeByTask)) {
    if (timestamp > cutoff) {
      cleanedByTask[taskId] = timestamp;
    }
  }

  const cleanedByType: Record<NotificationType, number> = {} as Record<NotificationType, number>;
  for (const [type, timestamp] of Object.entries(tracker.lastNudgeByType)) {
    if (timestamp > cutoff) {
      cleanedByType[type as NotificationType] = timestamp;
    }
  }

  return {
    lastNudgeByTask: cleanedByTask,
    lastNudgeByType: cleanedByType,
  };
}

// ============================================
// Quiet Hours
// ============================================

/**
 * Parse a time string (HH:mm) into hours and minutes
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Get current time as minutes since midnight
 */
function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Convert HH:mm time string to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTimeString(timeStr);
  return hours * 60 + minutes;
}

/**
 * Check if current time is within quiet hours
 *
 * Handles overnight ranges (e.g., 22:00 - 07:00)
 */
export function isInQuietHours(settings: UserSettings): boolean {
  if (!settings.quietHoursEnabled) return false;
  if (!settings.quietHoursStart || !settings.quietHoursEnd) return false;

  const now = getCurrentTimeMinutes();
  const start = timeToMinutes(settings.quietHoursStart);
  const end = timeToMinutes(settings.quietHoursEnd);

  if (start <= end) {
    // Same-day range (e.g., 09:00 - 17:00)
    return now >= start && now < end;
  } else {
    // Overnight range (e.g., 22:00 - 07:00)
    return now >= start || now < end;
  }
}

/**
 * Check if a notification should bypass quiet hours
 * Critical priority tasks always bypass quiet hours
 */
export function shouldBypassQuietHours(
  notification: Notification,
  tasks: Task[],
  userEnergy: 'high' | 'medium' | 'low' | null
): boolean {
  if (!notification.taskId) return false;

  const task = tasks.find(t => t.id === notification.taskId);
  if (!task) return false;

  // Check if task is critical priority
  const priorityInfo = getTaskPriorityInfo(task, userEnergy);
  return priorityInfo.tier === 'critical';
}

// ============================================
// Priority Ordering
// ============================================

/**
 * Calculate priority score for a notification
 * Higher score = should fire first
 */
export function calculateNudgePriority(
  notification: Notification,
  tasks: Task[],
  userEnergy: 'high' | 'medium' | 'low' | null
): number {
  // Base priority from notification type
  let score = NUDGE_TYPE_PRIORITY[notification.type] || 0;

  // Add task's priority score if available
  if (notification.taskId) {
    const task = tasks.find(t => t.id === notification.taskId);
    if (task) {
      const priorityInfo = getTaskPriorityInfo(task, userEnergy);
      // Task priority score is 0-100, add it to the type score
      score += priorityInfo.score;

      // Bonus for critical tier
      if (priorityInfo.tier === 'critical') {
        score += 50;
      }
    }
  }

  // Older scheduled time = higher priority (been waiting longer)
  const ageBonus = Math.min(10, (Date.now() - notification.scheduledAt) / (60 * 1000));
  score += ageBonus;

  return score;
}

/**
 * Sort notifications by priority (highest first)
 */
export function sortByPriority(
  notifications: Notification[],
  tasks: Task[],
  userEnergy: 'high' | 'medium' | 'low' | null
): Notification[] {
  return [...notifications].sort((a, b) => {
    const priorityA = calculateNudgePriority(a, tasks, userEnergy);
    const priorityB = calculateNudgePriority(b, tasks, userEnergy);
    return priorityB - priorityA;  // Higher priority first
  });
}

// ============================================
// Main Orchestration
// ============================================

/**
 * Orchestrate which notifications should fire and how
 *
 * Takes a list of ready-to-fire notifications and returns:
 * - Which should fire as push notifications
 * - Which should be badge-only (quiet hours)
 * - Which should be suppressed (cooldown)
 *
 * Notifications are sorted by priority so most important fires first.
 */
export function orchestrateNudges(
  readyNotifications: Notification[],
  tracker: NudgeTracker,
  settings: UserSettings,
  tasks: Task[],
  userEnergy: 'high' | 'medium' | 'low' | null
): OrchestratedNudge[] {
  const inQuietHours = isInQuietHours(settings);
  const cooldownMinutes = settings.nudgeCooldownMinutes;

  // Sort by priority first
  const sorted = sortByPriority(readyNotifications, tasks, userEnergy);

  // Process each notification
  return sorted.map(notification => {
    const priorityScore = calculateNudgePriority(notification, tasks, userEnergy);

    // Check cooldown
    if (isInCooldown(notification, tracker, cooldownMinutes)) {
      return {
        notification,
        deliveryMethod: 'suppressed' as NudgeDeliveryMethod,
        suppressionReason: `Cooldown active (${cooldownMinutes} min between nudges)`,
        priorityScore,
      };
    }

    // Check quiet hours
    if (inQuietHours) {
      const bypass = shouldBypassQuietHours(notification, tasks, userEnergy);
      if (!bypass) {
        return {
          notification,
          deliveryMethod: 'badge' as NudgeDeliveryMethod,
          suppressionReason: 'Quiet hours (badge only)',
          priorityScore,
        };
      }
      // Critical tasks bypass quiet hours
    }

    // Fire as full push notification
    return {
      notification,
      deliveryMethod: 'push' as NudgeDeliveryMethod,
      suppressionReason: null,
      priorityScore,
    };
  });
}

/**
 * Get only the notifications that should actually fire as push
 * Convenience function for common use case
 */
export function getNotificationsToFire(
  readyNotifications: Notification[],
  tracker: NudgeTracker,
  settings: UserSettings,
  tasks: Task[],
  userEnergy: 'high' | 'medium' | 'low' | null
): { toPush: Notification[]; toBadge: Notification[]; suppressed: Notification[] } {
  const orchestrated = orchestrateNudges(
    readyNotifications,
    tracker,
    settings,
    tasks,
    userEnergy
  );

  return {
    toPush: orchestrated
      .filter(o => o.deliveryMethod === 'push')
      .map(o => o.notification),
    toBadge: orchestrated
      .filter(o => o.deliveryMethod === 'badge')
      .map(o => o.notification),
    suppressed: orchestrated
      .filter(o => o.deliveryMethod === 'suppressed')
      .map(o => o.notification),
  };
}

/**
 * Fire the highest priority nudge only
 * Returns the notification that should fire, or null if none
 */
export function getNextNudgeToFire(
  readyNotifications: Notification[],
  tracker: NudgeTracker,
  settings: UserSettings,
  tasks: Task[],
  userEnergy: 'high' | 'medium' | 'low' | null
): OrchestratedNudge | null {
  const orchestrated = orchestrateNudges(
    readyNotifications,
    tracker,
    settings,
    tasks,
    userEnergy
  );

  // Find first that should actually fire (push or badge)
  const toFire = orchestrated.find(o => o.deliveryMethod !== 'suppressed');
  return toFire || null;
}

// ============================================
// Display Helpers
// ============================================

/**
 * Get human-readable label for delivery method
 */
export function getDeliveryMethodLabel(method: NudgeDeliveryMethod): string {
  switch (method) {
    case 'push':
      return 'Push notification';
    case 'badge':
      return 'Badge only';
    case 'suppressed':
      return 'Suppressed';
  }
}

/**
 * Get time until quiet hours end (for UI display)
 */
export function getTimeUntilQuietHoursEnd(settings: UserSettings): number | null {
  if (!isInQuietHours(settings)) return null;
  if (!settings.quietHoursEnd) return null;

  const now = getCurrentTimeMinutes();
  const end = timeToMinutes(settings.quietHoursEnd);

  if (now < end) {
    return end - now;  // Minutes until end (same day)
  } else {
    // Overnight: minutes until midnight + minutes from midnight to end
    return (24 * 60 - now) + end;
  }
}

/**
 * Format quiet hours for display
 */
export function formatQuietHours(settings: UserSettings): string {
  if (!settings.quietHoursEnabled) return 'Off';
  if (!settings.quietHoursStart || !settings.quietHoursEnd) return 'Not configured';

  // Format as 12-hour time
  const formatTime = (timeStr: string): string => {
    const { hours, minutes } = parseTimeString(timeStr);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return minutes === 0
      ? `${displayHour} ${period}`
      : `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return `${formatTime(settings.quietHoursStart)} - ${formatTime(settings.quietHoursEnd)}`;
}
