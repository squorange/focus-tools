/**
 * Focus Session & Time Entry Management
 *
 * Handles the complete lifecycle of focus sessions and time tracking.
 */

import { FocusSession, TimeEntry, Task, Subtask, TaskTimeStats } from './types';
import { openDB } from 'idb';

// Helper to generate UUIDs
function generateUUID(): string {
  return crypto.randomUUID();
}

// Helper to detect device type
function detectDevice(): 'desktop' | 'mobile' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = window.navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

// Get database instance
async function getDB() {
  return openDB('orbital-zen-db', 4);
}

// ============================================================================
// FOCUS SESSION OPERATIONS
// ============================================================================

/**
 * Get the currently active focus session (if any)
 */
export async function getActiveFocusSession(): Promise<FocusSession | undefined> {
  const db = await getDB();
  const allSessions = await db.getAllFromIndex('focusSessions', 'by-active', 1);
  return allSessions[0]; // Should only ever be one active session
}

/**
 * Get a specific focus session by ID
 */
export async function getFocusSession(sessionId: string): Promise<FocusSession | undefined> {
  const db = await getDB();
  return db.get('focusSessions', sessionId);
}

/**
 * Start a new focus session
 * Automatically pauses any existing active session
 */
export async function startFocusSession(
  taskId: string,
  subtaskId?: string
): Promise<FocusSession> {
  // 1. Check for existing active session and pause it
  const existing = await getActiveFocusSession();
  if (existing) {
    await pauseSession(existing.id);
  }

  // 2. Create new session
  const session: FocusSession = {
    id: generateUUID(),
    taskId,
    subtaskId,
    startTime: new Date(),
    isActive: true,
    totalTime: 0,
    totalBreakTime: 0,
    breaksTaken: 0,
    pauseCount: 0,
    totalPauseTime: 0,
    pauseHistory: [],
    breakReminderSnoozeCount: 0,
    flowModeEnabled: false,
    lastActivityTime: new Date(),
    device: detectDevice(),
  };

  const db = await getDB();
  await db.put('focusSessions', session);
  return session;
}

/**
 * Pause an active session
 */
export async function pauseSession(sessionId: string): Promise<void> {
  const session = await getFocusSession(sessionId);
  if (!session || !session.isActive) return;

  session.isActive = false;
  session.pausedAt = new Date();
  session.pauseCount++;
  session.pauseHistory.push({
    pausedAt: session.pausedAt,
  });

  const db = await getDB();
  await db.put('focusSessions', session);
}

/**
 * Resume a paused session
 */
export async function resumeSession(sessionId: string): Promise<void> {
  const session = await getFocusSession(sessionId);
  if (!session || session.isActive) return;

  // Calculate pause duration
  if (session.pausedAt) {
    const pauseDuration = Math.floor(
      (Date.now() - session.pausedAt.getTime()) / 1000
    );
    session.totalPauseTime += pauseDuration;

    // Update pause history
    const lastPause = session.pauseHistory[session.pauseHistory.length - 1];
    if (lastPause && !lastPause.resumedAt) {
      lastPause.resumedAt = new Date();
    }
  }

  session.isActive = true;
  session.pausedAt = undefined;
  session.lastActivityTime = new Date();

  const db = await getDB();
  await db.put('focusSessions', session);
}

/**
 * Update session's total time (called by timer)
 */
export async function updateSessionTime(sessionId: string, totalSeconds: number): Promise<void> {
  const session = await getFocusSession(sessionId);
  if (!session) return;

  session.totalTime = totalSeconds;
  session.lastActivityTime = new Date();

  const db = await getDB();
  await db.put('focusSessions', session);
}

/**
 * End a session and convert to TimeEntry
 */
export async function endSession(
  sessionId: string,
  reason: TimeEntry['endReason'] = 'stopped',
  wasCompleted: boolean = false,
  sessionNotes?: string
): Promise<TimeEntry> {
  const session = await getFocusSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // 1. Create TimeEntry from session
  const entry: TimeEntry = {
    id: generateUUID(),
    sessionId: session.id,
    taskId: session.taskId,
    subtaskId: session.subtaskId,
    startTime: session.startTime,
    endTime: new Date(),
    duration: session.totalTime,
    pauseCount: session.pauseCount,
    totalPauseTime: session.totalPauseTime,
    breaksTaken: session.breaksTaken,
    totalBreakTime: session.totalBreakTime,
    wasCompleted,
    endReason: reason,
    isManualEntry: false,
    sessionNotes,
    device: session.device,
    pauseTimestamps: session.pauseHistory.filter(p => p.resumedAt) as Array<{
      pausedAt: Date;
      resumedAt: Date;
    }>,
    createdAt: new Date(),
  };

  // 2. Save to history
  const db = await getDB();
  await db.add('timeEntries', entry);

  // 3. Delete active session
  await db.delete('focusSessions', session.id);

  return entry;
}

/**
 * Delete a focus session without creating a time entry
 * (Used when discarding a session)
 */
export async function deleteFocusSession(sessionId: string): Promise<void> {
  const db = await getDB();
  await db.delete('focusSessions', sessionId);
}

// ============================================================================
// BREAK MANAGEMENT
// ============================================================================

/**
 * Start a break (pauses main timer, starts break timer)
 */
export async function startBreak(sessionId: string): Promise<void> {
  const session = await getFocusSession(sessionId);
  if (!session) return;

  // Pause main timer if active
  if (session.isActive) {
    await pauseSession(sessionId);
  }

  // Start break timer
  session.currentBreakStartTime = new Date();
  session.breaksTaken++;
  session.lastBreakReminderAt = new Date(); // Reset reminder

  const db = await getDB();
  await db.put('focusSessions', session);
}

/**
 * End a break (resumes main timer)
 */
export async function endBreak(sessionId: string): Promise<void> {
  const session = await getFocusSession(sessionId);
  if (!session || !session.currentBreakStartTime) return;

  const breakDuration = Math.floor(
    (Date.now() - session.currentBreakStartTime.getTime()) / 1000
  );

  session.totalBreakTime += breakDuration;
  session.currentBreakStartTime = undefined;
  session.breakReminderSnoozeCount = 0; // Reset snooze count

  const db = await getDB();
  await db.put('focusSessions', session);

  // Resume main timer
  await resumeSession(sessionId);
}

/**
 * Snooze break reminder
 */
export async function snoozeBreakReminder(sessionId: string): Promise<void> {
  const session = await getFocusSession(sessionId);
  if (!session) return;

  session.breakReminderSnoozeCount++;
  session.lastBreakReminderAt = new Date();

  const db = await getDB();
  await db.put('focusSessions', session);
}

/**
 * Enable flow mode (disable break reminders for this session)
 */
export async function enableFlowMode(sessionId: string): Promise<void> {
  const session = await getFocusSession(sessionId);
  if (!session) return;

  session.flowModeEnabled = true;

  const db = await getDB();
  await db.put('focusSessions', session);
}

// ============================================================================
// TIME ENTRY OPERATIONS
// ============================================================================

/**
 * Get all time entries for a task
 */
export async function getTaskTimeEntries(taskId: string): Promise<TimeEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('timeEntries', 'by-task', taskId);
}

/**
 * Get all time entries for a subtask
 */
export async function getSubtaskTimeEntries(
  taskId: string,
  subtaskId: string
): Promise<TimeEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('timeEntries', 'by-subtask', [taskId, subtaskId]);
}

/**
 * Get time entries within a date range
 */
export async function getTimeEntriesByDateRange(
  startDate: Date,
  endDate: Date
): Promise<TimeEntry[]> {
  const db = await getDB();
  const allEntries = await db.getAllFromIndex('timeEntries', 'by-date');

  return allEntries.filter(entry => {
    const entryTime = new Date(entry.endTime).getTime();
    return entryTime >= startDate.getTime() && entryTime <= endDate.getTime();
  });
}

/**
 * Create a manual time entry
 */
export async function createManualTimeEntry(
  taskId: string,
  subtaskId: string | undefined,
  startTime: Date,
  duration: number, // seconds
  sessionNotes?: string
): Promise<TimeEntry> {
  const entry: TimeEntry = {
    id: generateUUID(),
    sessionId: generateUUID(), // Synthetic session ID for manual entries
    taskId,
    subtaskId,
    startTime,
    endTime: new Date(startTime.getTime() + duration * 1000),
    duration,
    pauseCount: 0,
    totalPauseTime: 0,
    breaksTaken: 0,
    totalBreakTime: 0,
    wasCompleted: false,
    endReason: 'manual',
    isManualEntry: true,
    sessionNotes,
    device: 'unknown',
    createdAt: new Date(),
  };

  const db = await getDB();
  await db.add('timeEntries', entry);
  return entry;
}

/**
 * Delete a time entry
 */
export async function deleteTimeEntry(entryId: string): Promise<void> {
  const db = await getDB();
  await db.delete('timeEntries', entryId);
}

/**
 * Clear all time entries for a task
 */
export async function clearTaskTimeHistory(taskId: string): Promise<void> {
  const entries = await getTaskTimeEntries(taskId);
  const db = await getDB();

  await Promise.all(
    entries.map(entry => db.delete('timeEntries', entry.id))
  );
}

// ============================================================================
// TIME AGGREGATION
// ============================================================================

/**
 * Calculate time stats for a task (including all subtasks)
 */
export async function getTaskTimeStats(taskId: string): Promise<TaskTimeStats> {
  const entries = await getTaskTimeEntries(taskId);

  if (entries.length === 0) {
    return {
      totalActiveTime: 0,
      totalBreakTime: 0,
      totalPauseTime: 0,
      sessionCount: 0,
      averageSessionLength: 0,
      completionRate: 0,
    };
  }

  const totalActiveTime = entries.reduce((sum, e) => sum + e.duration, 0);
  const totalBreakTime = entries.reduce((sum, e) => sum + e.totalBreakTime, 0);
  const totalPauseTime = entries.reduce((sum, e) => sum + e.totalPauseTime, 0);
  const completedCount = entries.filter(e => e.wasCompleted).length;

  // Sort by end time to get most recent
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
  );

  return {
    totalActiveTime,
    totalBreakTime,
    totalPauseTime,
    sessionCount: entries.length,
    averageSessionLength: totalActiveTime / entries.length,
    completionRate: completedCount / entries.length,
    lastWorkedOn: sortedEntries[0]?.endTime,
  };
}

/**
 * Calculate time stats for direct parent work only (excluding subtasks)
 */
export async function getDirectParentTimeStats(taskId: string): Promise<TaskTimeStats> {
  const entries = await getTaskTimeEntries(taskId);
  const parentEntries = entries.filter(e => !e.subtaskId);

  if (parentEntries.length === 0) {
    return {
      totalActiveTime: 0,
      totalBreakTime: 0,
      totalPauseTime: 0,
      sessionCount: 0,
      averageSessionLength: 0,
      completionRate: 0,
    };
  }

  const totalActiveTime = parentEntries.reduce((sum, e) => sum + e.duration, 0);
  const totalBreakTime = parentEntries.reduce((sum, e) => sum + e.totalBreakTime, 0);
  const totalPauseTime = parentEntries.reduce((sum, e) => sum + e.totalPauseTime, 0);
  const completedCount = parentEntries.filter(e => e.wasCompleted).length;

  const sortedEntries = [...parentEntries].sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
  );

  return {
    totalActiveTime,
    totalBreakTime,
    totalPauseTime,
    sessionCount: parentEntries.length,
    averageSessionLength: totalActiveTime / parentEntries.length,
    completionRate: completedCount / parentEntries.length,
    lastWorkedOn: sortedEntries[0]?.endTime,
  };
}

// ============================================================================
// STALE SESSION DETECTION
// ============================================================================

/**
 * Check if a session is stale (excessive duration > 2 hours)
 */
export function isSessionStale(session: FocusSession): boolean {
  if (!session.isActive) return false;

  const activeMinutes = session.totalTime / 60;
  return activeMinutes > 120; // 2 hours
}

/**
 * Check for stale sessions on app mount
 */
export async function detectStaleSessions(): Promise<FocusSession | undefined> {
  const session = await getActiveFocusSession();
  if (!session) return undefined;

  if (isSessionStale(session)) {
    return session;
  }

  return undefined;
}
