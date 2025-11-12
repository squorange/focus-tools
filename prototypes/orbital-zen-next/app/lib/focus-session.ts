/**
 * Focus Session & Time Entry Management
 *
 * Handles the complete lifecycle of focus sessions and time tracking.
 */

import { FocusSession, TimeEntry, Task, Subtask, TaskTimeStats, ActivityLog } from './types';
import { openDB } from 'idb';
import { createActivityLog } from './offline-store';

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
  return openDB('orbital-zen-db', 5); // Match version with offline-store.ts
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
 * Get any existing focus session (active or paused)
 * Used for persistence on app mount - returns the most recent session
 */
export async function getAnyFocusSession(): Promise<FocusSession | undefined> {
  const db = await getDB();
  const allSessions = await db.getAllFromIndex('focusSessions', 'by-lastActivity');
  // Return most recent session (sorted by lastActivityTime descending)
  return allSessions.length > 0 ? allSessions[allSessions.length - 1] : undefined;
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
export async function startFocusSession(taskId: string, subtaskId?: string): Promise<FocusSession> {
  // 1. Check for existing active session and pause it
  const existing = await getActiveFocusSession();
  if (existing) {
    await pauseSession(existing.id);
  }

  // 2. Create new session
  const now = new Date();
  const session: FocusSession = {
    id: generateUUID(),
    taskId,
    subtaskId,
    startTime: now,
    isActive: true,
    lastResumedAt: now, // Initialize to start time
    totalTime: 0,
    totalBreakTime: 0,
    breaksTaken: 0,
    pauseCount: 0,
    totalPauseTime: 0,
    pauseHistory: [],
    breakReminderSnoozeCount: 0,
    flowModeEnabled: false,
    lastActivityTime: now,
    device: detectDevice(),
  };

  const db = await getDB();
  await db.put('focusSessions', session);

  // 3. Create activity log for session start
  const activityLog: ActivityLog = {
    id: generateUUID(),
    taskId,
    subtaskId,
    type: 'session_start',
    timestamp: now,
    sessionId: session.id,
    isManualComment: false,
    createdAt: now,
  };
  await createActivityLog(activityLog);

  return session;
}

/**
 * Pause an active session
 */
export async function pauseSession(sessionId: string): Promise<void> {
  const session = await getFocusSession(sessionId);
  if (!session || !session.isActive) return;

  const now = new Date();
  const pausedAt = now;

  // Calculate elapsed time since last resume and add to totalTime
  if (session.lastResumedAt) {
    const elapsedSinceResume = Math.floor(
      (now.getTime() - new Date(session.lastResumedAt).getTime()) / 1000
    );
    session.totalTime += elapsedSinceResume;
  }

  session.isActive = false;
  session.pauseCount++;
  session.pauseHistory.push({
    pausedAt,
  });

  const db = await getDB();
  await db.put('focusSessions', session);
}

/**
 * Update an existing focus session in the database
 */
export async function updateFocusSession(session: FocusSession): Promise<void> {
  const db = await getDB();
  await db.put('focusSessions', session);
}

/**
 * Resume a paused session
 */
export async function resumeSession(sessionId: string): Promise<void> {
  const session = await getFocusSession(sessionId);
  if (!session || session.isActive) return;

  const now = new Date();

  // Calculate pause duration from last pause
  const lastPause = session.pauseHistory[session.pauseHistory.length - 1];
  if (lastPause && !lastPause.resumedAt) {
    const pauseDuration = Math.floor(
      (now.getTime() - new Date(lastPause.pausedAt).getTime()) / 1000
    );
    session.totalPauseTime += pauseDuration;
    lastPause.resumedAt = now;
  }

  session.isActive = true;
  session.lastResumedAt = now; // Set resume timestamp
  session.lastActivityTime = now;

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

  const now = new Date();

  // ==================================================================================
  // CRITICAL: Time Calculation - Calculate from First Principles
  // ==================================================================================
  // IMPORTANT: This calculation MUST use first principles to avoid double-counting.
  //
  // BUG HISTORY: Previously calculated as: session.totalTime + elapsedSinceResume
  // This caused DOUBLE-COUNTING when page reloads occurred during active sessions,
  // because reload logic incorrectly added elapsed time to totalTime, then endSession
  // added it again. Result: 60s sessions showing as 120s/2min.
  //
  // CORRECT APPROACH: Calculate from start time, subtract all pauses
  // - totalElapsed = (endTime - startTime)
  // - finalTotalTime = totalElapsed - totalPauseTime
  //
  // This approach is immune to corruption from reloads or state inconsistencies.
  //
  // DO NOT change this to use session.totalTime + elapsedSinceResume!
  // See: docs/TEST_EXECUTION.md - Test 4.1 for full bug details
  // ==================================================================================

  let finalTotalTime = session.totalTime;
  if (session.isActive) {
    // Active session: calculate total elapsed time from session start
    const totalElapsed = Math.floor((now.getTime() - new Date(session.startTime).getTime()) / 1000);
    // Subtract accumulated pause time to get active time only
    finalTotalTime = totalElapsed - session.totalPauseTime;
  }
  // Paused sessions: totalTime already contains correct active time

  // 1. Create TimeEntry from session
  const entry: TimeEntry = {
    id: generateUUID(),
    sessionId: session.id,
    taskId: session.taskId,
    subtaskId: session.subtaskId,
    startTime: session.startTime,
    endTime: now,
    duration: finalTotalTime,
    pauseCount: session.pauseCount,
    totalPauseTime: session.totalPauseTime,
    breaksTaken: session.breaksTaken,
    totalBreakTime: session.totalBreakTime,
    wasCompleted,
    endReason: reason,
    isManualEntry: false,
    sessionNotes,
    device: session.device,
    pauseTimestamps: session.pauseHistory.filter((p) => p.resumedAt) as Array<{
      pausedAt: Date;
      resumedAt: Date;
    }>,
    createdAt: new Date(),
  };

  // 2. Save to history
  const db = await getDB();
  await db.add('timeEntries', entry);

  // 3. Create activity log for session end
  const activityLog: ActivityLog = {
    id: generateUUID(),
    taskId: session.taskId,
    subtaskId: session.subtaskId,
    type: 'session_end',
    timestamp: now,
    sessionId: entry.id,
    duration: finalTotalTime,
    comment: sessionNotes,
    isManualComment: false,
    createdAt: now,
  };
  await createActivityLog(activityLog);

  // 4. Delete active session
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

  const breakDuration = Math.floor((Date.now() - session.currentBreakStartTime.getTime()) / 1000);

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

  return allEntries.filter((entry) => {
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

  await Promise.all(entries.map((entry) => db.delete('timeEntries', entry.id)));
}

// ============================================================================
// TIME AGGREGATION
// ============================================================================

/**
 * Calculate time stats for a task or subtask
 * @param taskId - The task ID
 * @param subtaskId - Optional subtask ID to get stats for specific subtask
 * @param includeSubtaskBreakdown - If true and subtaskId is not provided, includes per-subtask breakdown
 */
export async function getTaskTimeStats(
  taskId: string,
  subtaskId?: string,
  includeSubtaskBreakdown: boolean = false
): Promise<TaskTimeStats> {
  let entries = await getTaskTimeEntries(taskId);

  // Filter to specific subtask if requested
  if (subtaskId) {
    entries = entries.filter((e) => e.subtaskId === subtaskId);
  }

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
  const completedCount = entries.filter((e) => e.wasCompleted).length;

  // Sort by end time to get most recent
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
  );

  const stats: TaskTimeStats = {
    totalActiveTime,
    totalBreakTime,
    totalPauseTime,
    sessionCount: entries.length,
    averageSessionLength: totalActiveTime / entries.length,
    completionRate: completedCount / entries.length,
    lastWorkedOn: sortedEntries[0]?.endTime,
    lastSessionNotes: sortedEntries[0]?.sessionNotes,
  };

  // Add subtask breakdown if requested (for parent task view)
  if (includeSubtaskBreakdown && !subtaskId) {
    const allEntries = await getTaskTimeEntries(taskId);
    const subtaskMap = new Map<
      string,
      { totalTime: number; sessionCount: number; title: string }
    >();

    // Group by subtask
    for (const entry of allEntries) {
      if (entry.subtaskId) {
        const existing = subtaskMap.get(entry.subtaskId);
        if (existing) {
          existing.totalTime += entry.duration;
          existing.sessionCount += 1;
        } else {
          subtaskMap.set(entry.subtaskId, {
            totalTime: entry.duration,
            sessionCount: 1,
            title: '', // Will be filled in by caller with task data
          });
        }
      }
    }

    stats.subtaskBreakdown = Array.from(subtaskMap.entries()).map(([id, data]) => ({
      subtaskId: id,
      subtaskTitle: data.title,
      totalTime: data.totalTime,
      sessionCount: data.sessionCount,
    }));
  }

  return stats;
}

/**
 * Calculate time stats for direct parent work only (excluding subtasks)
 */
export async function getDirectParentTimeStats(taskId: string): Promise<TaskTimeStats> {
  const entries = await getTaskTimeEntries(taskId);
  const parentEntries = entries.filter((e) => !e.subtaskId);

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
  const completedCount = parentEntries.filter((e) => e.wasCompleted).length;

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
