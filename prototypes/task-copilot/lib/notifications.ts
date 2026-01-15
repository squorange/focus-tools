/**
 * PWA Notification helpers for task reminders
 */

import { Reminder } from './types';

// Key for storing scheduled reminders in localStorage
const SCHEDULED_REMINDERS_KEY = 'task-copilot-scheduled-reminders';

interface ScheduledReminder {
  taskId: string;
  taskTitle: string;
  scheduledTime: number; // Unix timestamp in ms
  timerId?: ReturnType<typeof setTimeout>;
}

// In-memory map of active timers (for session-based reminders)
const activeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

/**
 * Check if browser supports notifications
 */
export function supportsNotifications(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!supportsNotifications()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!supportsNotifications()) return false;

  // Already granted
  if (Notification.permission === 'granted') return true;

  // Already denied - can't re-request
  if (Notification.permission === 'denied') return false;

  // Request permission
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Show a notification immediately
 */
export function showNotification(
  title: string,
  body: string,
  taskId?: string
): Notification | null {
  if (!supportsNotifications() || Notification.permission !== 'granted') {
    return null;
  }

  const notification = new Notification(title, {
    body,
    tag: taskId, // Prevents duplicate notifications for same task
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
  });

  // Handle notification click - open app with task param
  notification.onclick = () => {
    window.focus();
    if (taskId) {
      // Update URL to include task param for deep linking
      const url = new URL(window.location.href);
      url.searchParams.set('task', taskId);
      window.history.replaceState({}, '', url.toString());
      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('task-reminder-click', { detail: { taskId } }));
    }
    notification.close();
  };

  return notification;
}

/**
 * Calculate the actual reminder time based on reminder settings
 */
export function calculateReminderTime(
  reminder: Reminder,
  targetDate: string | null,
  deadlineDate: string | null
): number | null {
  if (reminder.type === 'absolute' && reminder.absoluteTime) {
    return reminder.absoluteTime;
  }

  if (reminder.type === 'relative' && reminder.relativeMinutes !== undefined) {
    const referenceDate = reminder.relativeTo === 'deadline' ? deadlineDate : targetDate;
    if (!referenceDate) return null;

    // Parse date and assume start of day (9 AM by default for relative reminders)
    const date = new Date(referenceDate);
    date.setHours(9, 0, 0, 0);

    // Subtract the relative minutes
    return date.getTime() - (reminder.relativeMinutes * 60 * 1000);
  }

  return null;
}

/**
 * Get stored scheduled reminders from localStorage
 */
function getStoredReminders(): ScheduledReminder[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(SCHEDULED_REMINDERS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save scheduled reminders to localStorage
 */
function saveStoredReminders(reminders: ScheduledReminder[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCHEDULED_REMINDERS_KEY, JSON.stringify(
    reminders.map(({ taskId, taskTitle, scheduledTime }) => ({
      taskId,
      taskTitle,
      scheduledTime,
    }))
  ));
}

/**
 * Schedule a reminder notification for a task
 */
export function scheduleReminder(
  taskId: string,
  taskTitle: string,
  reminder: Reminder,
  targetDate: string | null,
  deadlineDate: string | null
): boolean {
  const reminderTime = calculateReminderTime(reminder, targetDate, deadlineDate);
  if (!reminderTime) return false;

  const now = Date.now();
  const delay = reminderTime - now;

  // If reminder time is in the past, don't schedule
  if (delay <= 0) return false;

  // Cancel any existing reminder for this task
  cancelReminder(taskId);

  // Store the reminder
  const reminders = getStoredReminders();
  reminders.push({
    taskId,
    taskTitle,
    scheduledTime: reminderTime,
  });
  saveStoredReminders(reminders);

  // Set up the timer for in-session reminders
  // (Service worker will handle reminders if app is closed)
  const timerId = setTimeout(() => {
    showNotification(
      'Task Reminder',
      taskTitle,
      taskId
    );
    // Clean up stored reminder
    removeStoredReminder(taskId);
  }, delay);

  activeTimers.set(taskId, timerId);

  return true;
}

/**
 * Cancel a scheduled reminder for a task
 */
export function cancelReminder(taskId: string): void {
  // Clear in-memory timer
  const timerId = activeTimers.get(taskId);
  if (timerId) {
    clearTimeout(timerId);
    activeTimers.delete(taskId);
  }

  // Remove from storage
  removeStoredReminder(taskId);
}

/**
 * Remove a reminder from localStorage
 */
function removeStoredReminder(taskId: string): void {
  const reminders = getStoredReminders();
  const filtered = reminders.filter(r => r.taskId !== taskId);
  saveStoredReminders(filtered);
}

/**
 * Initialize reminders from storage on app load
 * Call this on app startup to restore any pending reminders
 */
export function initializeReminders(): void {
  const reminders = getStoredReminders();
  const now = Date.now();

  reminders.forEach(reminder => {
    const delay = reminder.scheduledTime - now;

    if (delay <= 0) {
      // Reminder was due while app was closed - show it now
      showNotification(
        'Task Reminder',
        reminder.taskTitle,
        reminder.taskId
      );
      removeStoredReminder(reminder.taskId);
    } else {
      // Schedule for future
      const timerId = setTimeout(() => {
        showNotification(
          'Task Reminder',
          reminder.taskTitle,
          reminder.taskId
        );
        removeStoredReminder(reminder.taskId);
      }, delay);
      activeTimers.set(reminder.taskId, timerId);
    }
  });
}

/**
 * Format a reminder for display
 */
export function formatReminder(
  reminder: Reminder,
  targetDate: string | null,
  deadlineDate: string | null
): string {
  if (reminder.type === 'absolute' && reminder.absoluteTime) {
    const date = new Date(reminder.absoluteTime);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (reminder.type === 'relative' && reminder.relativeMinutes !== undefined) {
    const minutes = reminder.relativeMinutes;
    const relativeTo = reminder.relativeTo === 'deadline' ? 'deadline' : 'target';

    if (minutes < 60) {
      return `${minutes} min before ${relativeTo}`;
    } else if (minutes < 1440) {
      const hours = Math.round(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} before ${relativeTo}`;
    } else if (minutes < 10080) {
      const days = Math.round(minutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} before ${relativeTo}`;
    } else {
      const weeks = Math.round(minutes / 10080);
      return `${weeks} week${weeks > 1 ? 's' : ''} before ${relativeTo}`;
    }
  }

  return 'Unknown reminder';
}

/**
 * Get relative reminder options based on available dates
 */
export function getRelativeReminderOptions(
  hasTargetDate: boolean,
  hasDeadlineDate: boolean
): Array<{
  label: string;
  value: { type: 'relative'; relativeMinutes: number; relativeTo: 'target' | 'deadline' };
}> {
  const options: Array<{
    label: string;
    value: { type: 'relative'; relativeMinutes: number; relativeTo: 'target' | 'deadline' };
  }> = [];

  const timeOptions = [
    { minutes: 60, label: '1 hour before' },
    { minutes: 1440, label: '1 day before' },
    { minutes: 2880, label: '2 days before' },
    { minutes: 10080, label: '1 week before' },
  ];

  if (hasDeadlineDate) {
    timeOptions.forEach(opt => {
      options.push({
        label: `${opt.label} deadline`,
        value: {
          type: 'relative',
          relativeMinutes: opt.minutes,
          relativeTo: 'deadline',
        },
      });
    });
  }

  if (hasTargetDate) {
    timeOptions.forEach(opt => {
      options.push({
        label: `${opt.label} target`,
        value: {
          type: 'relative',
          relativeMinutes: opt.minutes,
          relativeTo: 'target',
        },
      });
    });
  }

  return options;
}
