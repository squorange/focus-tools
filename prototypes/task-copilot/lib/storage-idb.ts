/**
 * IndexedDB Storage Operations
 *
 * This module provides high-level storage operations using IndexedDB.
 * It mirrors the localStorage API from storage.ts but with async operations.
 *
 * Phase 1: Write operations only (for parallel writes)
 * Phase 2: Read operations + migration logic
 *
 * @see docs/features/indexeddb-migration/SPEC.md for API design
 */

import {
  openDatabase,
  AppStateRecord,
  ScheduledTimerRecord,
  isIndexedDBSupported,
} from './indexeddb';
import {
  AppState,
  Task,
  Event,
  FocusSession,
  Nudge,
  SnoozedNudge,
  SCHEMA_VERSION,
  createInitialAppState,
} from './types';
import { Notification } from './notification-types';

// Import migration function from storage.ts (for app-level schema migrations)
// We use dynamic import to avoid circular dependency
let migrateStateFn: ((stored: Record<string, unknown>) => AppState) | null = null;

// ============================================
// Initialization
// ============================================

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize IndexedDB storage
 * Call this once on app startup before any storage operations
 */
export async function initializeIDB(): Promise<void> {
  if (isInitialized) return;

  // Prevent duplicate initialization
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!isIndexedDBSupported()) {
      console.warn('[IDB] IndexedDB not supported, skipping initialization');
      return;
    }

    try {
      await openDatabase();
      isInitialized = true;
      console.log('[IDB] IndexedDB initialized successfully');
    } catch (error) {
      console.error('[IDB] Failed to initialize IndexedDB:', error);
      // Don't throw - allow app to continue with localStorage only
    }
  })();

  return initPromise;
}

/**
 * Check if IndexedDB is ready for operations
 */
export function isIDBReady(): boolean {
  return isInitialized && isIndexedDBSupported();
}

// ============================================
// State Operations (Write)
// ============================================

/**
 * Save app state to IndexedDB
 * This is called in parallel with localStorage saves during Phase 1
 */
export async function saveStateToIDB(state: AppState): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();

    // Get existing appState BEFORE starting transaction to preserve migration flags
    const existingAppState = await db.get('appState', 'singleton');

    // Extract tasks for individual storage
    const { tasks, events: _events, focusSessions: _sessions, ...appStateRest } = state;

    // Build the appState record (without tasks)
    // Preserve migration flags from existing record (don't reset on every save)
    const appStateRecord: AppStateRecord = {
      key: 'singleton',
      schemaVersion: state.schemaVersion,
      currentUser: state.currentUser,
      projects: state.projects,
      focusQueue: state.focusQueue,
      userSettings: state.userSettings,
      currentEnergy: state.currentEnergy,
      currentEnergySetAt: state.currentEnergySetAt,
      nudgeTracker: state.nudgeTracker,
      currentView: state.currentView,
      activeTaskId: state.activeTaskId,
      taskDetailMode: state.taskDetailMode,
      focusMode: state.focusMode,
      currentSessionId: state.currentSessionId,
      globalStaging: state.globalStaging,
      queueMessages: state.queueMessages,
      queueLastInteractionAt: state.queueLastInteractionAt,
      tasksMessages: state.tasksMessages,
      tasksLastInteractionAt: state.tasksLastInteractionAt,
      filters: state.filters,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      completedTodayExpanded: state.completedTodayExpanded,
      error: state.error,
      migratedFromLocalStorage: existingAppState?.migratedFromLocalStorage ?? true,
      migratedAt: existingAppState?.migratedAt ?? Date.now(),
    };

    // Start a transaction for both appState and tasks
    const tx = db.transaction(['appState', 'tasks'], 'readwrite');

    // Save appState
    await tx.objectStore('appState').put(appStateRecord, 'singleton');

    // Save each task individually
    const taskStore = tx.objectStore('tasks');
    for (const task of tasks) {
      await taskStore.put(task);
    }

    await tx.done;
  } catch (error) {
    // Log but don't throw - localStorage is still the source of truth in Phase 1
    console.error('[IDB] Failed to save state:', error);
  }
}

/**
 * Save a single task to IndexedDB
 * More efficient than saving all tasks when only one changed
 */
export async function saveTaskToIDB(task: Task): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    await db.put('tasks', task);
  } catch (error) {
    console.error('[IDB] Failed to save task:', error);
  }
}

/**
 * Save multiple tasks in a single transaction
 * More efficient than individual saves
 */
export async function saveTasksBatchToIDB(tasks: Task[]): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    const tx = db.transaction('tasks', 'readwrite');

    for (const task of tasks) {
      await tx.store.put(task);
    }

    await tx.done;
  } catch (error) {
    console.error('[IDB] Failed to save tasks batch:', error);
  }
}

/**
 * Delete a task from IndexedDB
 */
export async function deleteTaskFromIDB(taskId: string): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    await db.delete('tasks', taskId);
  } catch (error) {
    console.error('[IDB] Failed to delete task:', error);
  }
}

// ============================================
// Events Operations (Write)
// ============================================

/**
 * Save events to IndexedDB
 */
export async function saveEventsToIDB(events: Event[]): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    const tx = db.transaction('events', 'readwrite');

    // Clear existing events and write new ones
    // This matches localStorage behavior (full replacement)
    await tx.store.clear();

    for (const event of events) {
      await tx.store.put(event);
    }

    await tx.done;
  } catch (error) {
    console.error('[IDB] Failed to save events:', error);
  }
}

/**
 * Save a single event (append)
 */
export async function saveEventToIDB(event: Event): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    await db.put('events', event);
  } catch (error) {
    console.error('[IDB] Failed to save event:', error);
  }
}

// ============================================
// Sessions Operations (Write)
// ============================================

/**
 * Save focus sessions to IndexedDB
 */
export async function saveSessionsToIDB(sessions: FocusSession[]): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    const tx = db.transaction('sessions', 'readwrite');

    // Clear existing sessions and write new ones
    await tx.store.clear();

    for (const session of sessions) {
      await tx.store.put(session);
    }

    await tx.done;
  } catch (error) {
    console.error('[IDB] Failed to save sessions:', error);
  }
}

/**
 * Save a single session
 */
export async function saveSessionToIDB(session: FocusSession): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    await db.put('sessions', session);
  } catch (error) {
    console.error('[IDB] Failed to save session:', error);
  }
}

// ============================================
// Nudges Operations (Write)
// ============================================

/**
 * Save nudges and snoozed nudges to IndexedDB
 */
export async function saveNudgesToIDB(nudges: Nudge[], snoozedNudges: SnoozedNudge[]): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    const tx = db.transaction(['nudges', 'snoozedNudges'], 'readwrite');

    // Clear and replace nudges
    const nudgeStore = tx.objectStore('nudges');
    await nudgeStore.clear();
    for (const nudge of nudges) {
      await nudgeStore.put(nudge);
    }

    // Clear and replace snoozed nudges
    const snoozedStore = tx.objectStore('snoozedNudges');
    await snoozedStore.clear();
    for (const snoozed of snoozedNudges) {
      await snoozedStore.put(snoozed);
    }

    await tx.done;
  } catch (error) {
    console.error('[IDB] Failed to save nudges:', error);
  }
}

// ============================================
// Notifications Operations (Write)
// ============================================

/**
 * Save notifications to IndexedDB
 */
export async function saveNotificationsToIDB(notifications: Notification[]): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    const tx = db.transaction('notifications', 'readwrite');

    // Clear and replace
    await tx.store.clear();
    for (const notification of notifications) {
      await tx.store.put(notification);
    }

    await tx.done;
  } catch (error) {
    console.error('[IDB] Failed to save notifications:', error);
  }
}

/**
 * Save a single notification
 */
export async function saveNotificationToIDB(notification: Notification): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    await db.put('notifications', notification);
  } catch (error) {
    console.error('[IDB] Failed to save notification:', error);
  }
}

/**
 * Delete notifications for a specific task
 */
export async function deleteNotificationsForTaskIDB(taskId: string): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    const tx = db.transaction('notifications', 'readwrite');
    const index = tx.store.index('by-task');

    let cursor = await index.openCursor(taskId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    await tx.done;
  } catch (error) {
    console.error('[IDB] Failed to delete notifications for task:', error);
  }
}

// ============================================
// Scheduled Timers Operations (Write)
// ============================================

/**
 * Save scheduled timer for a task
 */
export async function saveScheduledTimerToIDB(
  taskId: string,
  reminderTime: number | null,
  startPokeTime: number | null
): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    const record: ScheduledTimerRecord = {
      taskId,
      reminderTime,
      startPokeTime,
    };
    await db.put('scheduledTimers', record);
  } catch (error) {
    console.error('[IDB] Failed to save scheduled timer:', error);
  }
}

/**
 * Delete scheduled timer for a task
 */
export async function deleteScheduledTimerFromIDB(taskId: string): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    await db.delete('scheduledTimers', taskId);
  } catch (error) {
    console.error('[IDB] Failed to delete scheduled timer:', error);
  }
}

// ============================================
// Read Operations (Phase 2)
// ============================================

/**
 * Check if IndexedDB has been migrated from localStorage
 */
export async function isMigrated(): Promise<boolean> {
  if (!isIDBReady()) return false;

  try {
    const db = await openDatabase();
    const appState = await db.get('appState', 'singleton');
    return appState?.migratedFromLocalStorage === true;
  } catch (error) {
    console.error('[IDB] Failed to check migration status:', error);
    return false;
  }
}

/**
 * Load app state from IndexedDB
 * Returns null if not migrated or on error
 */
export async function loadStateFromIDB(): Promise<AppState | null> {
  if (!isIDBReady()) return null;

  try {
    const db = await openDatabase();

    // Load appState record
    const appStateRecord = await db.get('appState', 'singleton');
    if (!appStateRecord) {
      return null;
    }

    // Load all tasks
    const tasks = await db.getAll('tasks');

    // Load events
    const events = await db.getAll('events');

    // Load sessions
    const sessions = await db.getAll('sessions');

    // Load nudges
    const nudges = await db.getAll('nudges');
    const snoozedNudges = await db.getAll('snoozedNudges');

    // Reconstruct full AppState
    const state: AppState = {
      schemaVersion: appStateRecord.schemaVersion,
      currentUser: appStateRecord.currentUser,
      tasks,
      projects: appStateRecord.projects,
      focusQueue: appStateRecord.focusQueue,
      events,
      focusSessions: sessions,
      nudges,
      snoozedNudges,
      analytics: null, // Analytics computed on demand
      userSettings: appStateRecord.userSettings,
      currentEnergy: appStateRecord.currentEnergy,
      currentEnergySetAt: appStateRecord.currentEnergySetAt,
      nudgeTracker: appStateRecord.nudgeTracker,
      currentView: appStateRecord.currentView,
      activeTaskId: appStateRecord.activeTaskId,
      taskDetailMode: appStateRecord.taskDetailMode,
      focusMode: appStateRecord.focusMode,
      currentSessionId: appStateRecord.currentSessionId,
      globalStaging: appStateRecord.globalStaging,
      queueMessages: appStateRecord.queueMessages,
      queueLastInteractionAt: appStateRecord.queueLastInteractionAt,
      tasksMessages: appStateRecord.tasksMessages,
      tasksLastInteractionAt: appStateRecord.tasksLastInteractionAt,
      filters: appStateRecord.filters,
      sortBy: appStateRecord.sortBy,
      sortOrder: appStateRecord.sortOrder,
      completedTodayExpanded: appStateRecord.completedTodayExpanded,
      error: appStateRecord.error,
    };

    return state;
  } catch (error) {
    console.error('[IDB] Failed to load state:', error);
    return null;
  }
}

/**
 * Load all tasks from IndexedDB
 */
export async function loadTasksFromIDB(): Promise<Task[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    return await db.getAll('tasks');
  } catch (error) {
    console.error('[IDB] Failed to load tasks:', error);
    return [];
  }
}

/**
 * Load a single task from IndexedDB
 */
export async function loadTaskFromIDB(taskId: string): Promise<Task | null> {
  if (!isIDBReady()) return null;

  try {
    const db = await openDatabase();
    const task = await db.get('tasks', taskId);
    return task ?? null;
  } catch (error) {
    console.error('[IDB] Failed to load task:', error);
    return null;
  }
}

/**
 * Load events from IndexedDB
 */
export async function loadEventsFromIDB(): Promise<Event[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    return await db.getAll('events');
  } catch (error) {
    console.error('[IDB] Failed to load events:', error);
    return [];
  }
}

/**
 * Load sessions from IndexedDB
 */
export async function loadSessionsFromIDB(): Promise<FocusSession[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    return await db.getAll('sessions');
  } catch (error) {
    console.error('[IDB] Failed to load sessions:', error);
    return [];
  }
}

/**
 * Load nudges from IndexedDB
 */
export async function loadNudgesFromIDB(): Promise<{ nudges: Nudge[]; snoozedNudges: SnoozedNudge[] }> {
  if (!isIDBReady()) return { nudges: [], snoozedNudges: [] };

  try {
    const db = await openDatabase();
    const nudges = await db.getAll('nudges');
    const snoozedNudges = await db.getAll('snoozedNudges');
    return { nudges, snoozedNudges };
  } catch (error) {
    console.error('[IDB] Failed to load nudges:', error);
    return { nudges: [], snoozedNudges: [] };
  }
}

/**
 * Load notifications from IndexedDB
 */
export async function loadNotificationsFromIDB(): Promise<Notification[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    return await db.getAll('notifications');
  } catch (error) {
    console.error('[IDB] Failed to load notifications:', error);
    return [];
  }
}

/**
 * Load scheduled timers from IndexedDB
 */
export async function loadScheduledTimersFromIDB(): Promise<ScheduledTimerRecord[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    return await db.getAll('scheduledTimers');
  } catch (error) {
    console.error('[IDB] Failed to load scheduled timers:', error);
    return [];
  }
}

// ============================================
// Memory Caching (Phase 3)
// ============================================

/**
 * Simple LRU cache for tasks
 * Reduces IndexedDB reads for frequently accessed tasks
 */
class TaskCache {
  private cache: Map<string, Task> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  get(taskId: string): Task | undefined {
    const task = this.cache.get(taskId);
    if (task) {
      // Move to end (most recently used)
      this.cache.delete(taskId);
      this.cache.set(taskId, task);
    }
    return task;
  }

  set(task: Task): void {
    // Remove if exists (to update position)
    this.cache.delete(task.id);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(task.id, task);
  }

  delete(taskId: string): void {
    this.cache.delete(taskId);
  }

  clear(): void {
    this.cache.clear();
  }

  has(taskId: string): boolean {
    return this.cache.has(taskId);
  }

  size(): number {
    return this.cache.size;
  }

  // Bulk load tasks into cache
  loadMany(tasks: Task[]): void {
    for (const task of tasks) {
      this.set(task);
    }
  }
}

// Global task cache instance
const taskCache = new TaskCache(50);

/**
 * Get a task from cache or IndexedDB
 * Uses cache-aside pattern: check cache first, then load from DB
 */
export async function getTaskCached(taskId: string): Promise<Task | null> {
  // Check cache first
  const cached = taskCache.get(taskId);
  if (cached) {
    return cached;
  }

  // Load from IndexedDB
  const task = await loadTaskFromIDB(taskId);
  if (task) {
    taskCache.set(task);
  }

  return task;
}

/**
 * Save a task and update cache
 */
export async function saveTaskCached(task: Task): Promise<void> {
  await saveTaskToIDB(task);
  taskCache.set(task);
}

/**
 * Delete a task and remove from cache
 */
export async function deleteTaskCached(taskId: string): Promise<void> {
  await deleteTaskFromIDB(taskId);
  taskCache.delete(taskId);
}

/**
 * Clear the task cache
 * Call when doing bulk operations or on data import
 */
export function clearTaskCache(): void {
  taskCache.clear();
}

/**
 * Preload tasks into cache (e.g., on app start)
 */
export async function preloadTaskCache(): Promise<void> {
  if (!isIDBReady()) return;

  try {
    // Load most recently updated tasks into cache
    const db = await openDatabase();
    const tx = db.transaction('tasks', 'readonly');
    const index = tx.store.index('by-updated');

    const tasks: Task[] = [];
    let cursor = await index.openCursor(null, 'prev');

    while (cursor && tasks.length < 50) {
      tasks.push(cursor.value);
      cursor = await cursor.continue();
    }

    taskCache.loadMany(tasks);
    console.log(`[IDB] Preloaded ${tasks.length} tasks into cache`);
  } catch (error) {
    console.error('[IDB] Failed to preload task cache:', error);
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getTaskCacheStats(): { size: number; maxSize: number } {
  return {
    size: taskCache.size(),
    maxSize: 50,
  };
}

// ============================================
// Write Batching & Debouncing (Phase 3)
// ============================================

// Pending state for debounced saves
let pendingStateSave: AppState | null = null;
let stateSaveTimeoutId: ReturnType<typeof setTimeout> | null = null;
const STATE_SAVE_DEBOUNCE_MS = 100;

/**
 * Debounced state save - batches rapid state changes
 * Reduces IndexedDB write frequency for better performance
 */
export function saveStateDebouncedToIDB(state: AppState): void {
  if (!isIDBReady()) return;

  pendingStateSave = state;

  // Clear existing timeout
  if (stateSaveTimeoutId) {
    clearTimeout(stateSaveTimeoutId);
  }

  // Schedule save after debounce period
  stateSaveTimeoutId = setTimeout(() => {
    if (pendingStateSave) {
      saveStateToIDB(pendingStateSave).catch(err => {
        console.warn('[IDB] Debounced save failed:', err);
      });
      pendingStateSave = null;
    }
    stateSaveTimeoutId = null;
  }, STATE_SAVE_DEBOUNCE_MS);
}

/**
 * Flush any pending debounced saves immediately
 * Call this before app unload or critical operations
 */
export async function flushPendingSaves(): Promise<void> {
  if (stateSaveTimeoutId) {
    clearTimeout(stateSaveTimeoutId);
    stateSaveTimeoutId = null;
  }

  if (pendingStateSave) {
    await saveStateToIDB(pendingStateSave);
    pendingStateSave = null;
  }
}

/**
 * Save using requestIdleCallback for non-critical writes
 * Falls back to setTimeout if requestIdleCallback not available
 */
export function saveStateIdleToIDB(state: AppState): void {
  if (!isIDBReady()) return;

  const doSave = () => {
    saveStateToIDB(state).catch(err => {
      console.warn('[IDB] Idle save failed:', err);
    });
  };

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(doSave, { timeout: 1000 });
  } else {
    setTimeout(doSave, 50);
  }
}

// ============================================
// Indexed Queries (Phase 3)
// ============================================

/**
 * Load tasks by status using the status index
 * More efficient than loading all tasks and filtering
 */
export async function loadTasksByStatusFromIDB(status: string): Promise<Task[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    const tx = db.transaction('tasks', 'readonly');
    const index = tx.store.index('by-status');
    return await index.getAll(status);
  } catch (error) {
    console.error('[IDB] Failed to load tasks by status:', error);
    return [];
  }
}

/**
 * Load tasks by project using the project index
 */
export async function loadTasksByProjectFromIDB(projectId: string | null): Promise<Task[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    const tx = db.transaction('tasks', 'readonly');
    const index = tx.store.index('by-project');
    // IndexedDB treats null as a valid key
    return await index.getAll(projectId as string);
  } catch (error) {
    console.error('[IDB] Failed to load tasks by project:', error);
    return [];
  }
}

/**
 * Load recurring tasks only using the recurring index
 */
export async function loadRecurringTasksFromIDB(): Promise<Task[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    const tx = db.transaction('tasks', 'readonly');
    const index = tx.store.index('by-recurring');
    // Boolean stored as-is in IndexedDB
    return await index.getAll(IDBKeyRange.only(true));
  } catch (error) {
    console.error('[IDB] Failed to load recurring tasks:', error);
    return [];
  }
}

/**
 * Load recent events using timestamp index with limit
 */
export async function loadRecentEventsFromIDB(limit: number = 100): Promise<Event[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    const tx = db.transaction('events', 'readonly');
    const index = tx.store.index('by-timestamp');

    // Use cursor to get most recent events (descending order)
    const events: Event[] = [];
    let cursor = await index.openCursor(null, 'prev'); // 'prev' for descending

    while (cursor && events.length < limit) {
      events.push(cursor.value);
      cursor = await cursor.continue();
    }

    return events;
  } catch (error) {
    console.error('[IDB] Failed to load recent events:', error);
    return [];
  }
}

/**
 * Load events for a specific task
 */
export async function loadEventsForTaskFromIDB(taskId: string): Promise<Event[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    const tx = db.transaction('events', 'readonly');
    const index = tx.store.index('by-task');
    return await index.getAll(taskId);
  } catch (error) {
    console.error('[IDB] Failed to load events for task:', error);
    return [];
  }
}

/**
 * Load sessions for a specific task
 */
export async function loadSessionsForTaskFromIDB(taskId: string): Promise<FocusSession[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    const tx = db.transaction('sessions', 'readonly');
    const index = tx.store.index('by-task');
    return await index.getAll(taskId);
  } catch (error) {
    console.error('[IDB] Failed to load sessions for task:', error);
    return [];
  }
}

/**
 * Load tasks with deadline in a date range
 */
export async function loadTasksByDeadlineRangeFromIDB(
  startDate: string,
  endDate: string
): Promise<Task[]> {
  if (!isIDBReady()) return [];

  try {
    const db = await openDatabase();
    const tx = db.transaction('tasks', 'readonly');
    const index = tx.store.index('by-deadline');
    const range = IDBKeyRange.bound(startDate, endDate);
    return await index.getAll(range);
  } catch (error) {
    console.error('[IDB] Failed to load tasks by deadline range:', error);
    return [];
  }
}

// ============================================
// Migration (Phase 2)
// ============================================

/**
 * Migration result type
 */
export interface MigrationResult {
  success: boolean;
  tasksCount: number;
  eventsCount: number;
  sessionsCount: number;
  notificationsCount: number;
  errors: string[];
}

/**
 * Migrate data from localStorage to IndexedDB
 * This is a one-time operation that runs on first load after Phase 2 deployment
 */
export async function migrateFromLocalStorage(
  migrateState: (stored: Record<string, unknown>) => AppState
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    tasksCount: 0,
    eventsCount: 0,
    sessionsCount: 0,
    notificationsCount: 0,
    errors: [],
  };

  if (!isIDBReady()) {
    result.errors.push('IndexedDB not ready');
    return result;
  }

  try {
    const db = await openDatabase();

    // Check if already migrated
    const existingAppState = await db.get('appState', 'singleton');
    if (existingAppState?.migratedFromLocalStorage) {
      console.log('[IDB] Already migrated from localStorage');
      result.success = true;
      return result;
    }

    // Check if localStorage has data
    const stateJson = localStorage.getItem('focus-tools-state');
    if (!stateJson) {
      // Fresh install - mark as migrated (nothing to migrate)
      const initialState = createInitialAppState();
      const appStateRecord: AppStateRecord = {
        key: 'singleton',
        schemaVersion: initialState.schemaVersion,
        currentUser: initialState.currentUser,
        projects: initialState.projects,
        focusQueue: initialState.focusQueue,
        userSettings: initialState.userSettings,
        currentEnergy: initialState.currentEnergy,
        currentEnergySetAt: initialState.currentEnergySetAt,
        nudgeTracker: initialState.nudgeTracker,
        currentView: initialState.currentView,
        activeTaskId: initialState.activeTaskId,
        taskDetailMode: initialState.taskDetailMode,
        focusMode: initialState.focusMode,
        currentSessionId: initialState.currentSessionId,
        globalStaging: initialState.globalStaging,
        queueMessages: initialState.queueMessages,
        queueLastInteractionAt: initialState.queueLastInteractionAt,
        tasksMessages: initialState.tasksMessages,
        tasksLastInteractionAt: initialState.tasksLastInteractionAt,
        filters: initialState.filters,
        sortBy: initialState.sortBy,
        sortOrder: initialState.sortOrder,
        completedTodayExpanded: initialState.completedTodayExpanded,
        error: initialState.error,
        migratedFromLocalStorage: true,
        migratedAt: Date.now(),
      };
      await db.put('appState', appStateRecord, 'singleton');
      console.log('[IDB] Fresh install - initialized IndexedDB');
      result.success = true;
      return result;
    }

    // Parse and migrate state
    const parsedState = JSON.parse(stateJson);
    const migratedState = migrateState(parsedState);

    // Start migration transaction
    const tx = db.transaction(
      ['appState', 'tasks', 'events', 'sessions', 'nudges', 'snoozedNudges', 'notifications', 'scheduledTimers'],
      'readwrite'
    );

    // Store tasks individually
    const taskStore = tx.objectStore('tasks');
    for (const task of migratedState.tasks) {
      await taskStore.put(task);
      result.tasksCount++;
    }

    // Store appState (without tasks)
    const appStateRecord: AppStateRecord = {
      key: 'singleton',
      schemaVersion: migratedState.schemaVersion,
      currentUser: migratedState.currentUser,
      projects: migratedState.projects,
      focusQueue: migratedState.focusQueue,
      userSettings: migratedState.userSettings,
      currentEnergy: migratedState.currentEnergy,
      currentEnergySetAt: migratedState.currentEnergySetAt,
      nudgeTracker: migratedState.nudgeTracker,
      currentView: migratedState.currentView,
      activeTaskId: migratedState.activeTaskId,
      taskDetailMode: migratedState.taskDetailMode,
      focusMode: migratedState.focusMode,
      currentSessionId: migratedState.currentSessionId,
      globalStaging: migratedState.globalStaging,
      queueMessages: migratedState.queueMessages,
      queueLastInteractionAt: migratedState.queueLastInteractionAt,
      tasksMessages: migratedState.tasksMessages,
      tasksLastInteractionAt: migratedState.tasksLastInteractionAt,
      filters: migratedState.filters,
      sortBy: migratedState.sortBy,
      sortOrder: migratedState.sortOrder,
      completedTodayExpanded: migratedState.completedTodayExpanded,
      error: migratedState.error,
      migratedFromLocalStorage: true,
      migratedAt: Date.now(),
    };
    await tx.objectStore('appState').put(appStateRecord, 'singleton');

    // Migrate events
    const eventsJson = localStorage.getItem('focus-tools-events');
    if (eventsJson) {
      const events = JSON.parse(eventsJson) as Event[];
      const eventStore = tx.objectStore('events');
      for (const event of events) {
        await eventStore.put(event);
        result.eventsCount++;
      }
    }

    // Migrate sessions
    const sessionsJson = localStorage.getItem('focus-tools-sessions');
    if (sessionsJson) {
      const sessions = JSON.parse(sessionsJson) as FocusSession[];
      const sessionStore = tx.objectStore('sessions');
      for (const session of sessions) {
        await sessionStore.put(session);
        result.sessionsCount++;
      }
    }

    // Migrate nudges
    const nudgesJson = localStorage.getItem('focus-tools-nudges');
    if (nudgesJson) {
      const { nudges, snoozedNudges } = JSON.parse(nudgesJson) as {
        nudges: Nudge[];
        snoozedNudges: SnoozedNudge[];
      };
      const nudgeStore = tx.objectStore('nudges');
      const snoozedStore = tx.objectStore('snoozedNudges');
      for (const nudge of nudges || []) {
        await nudgeStore.put(nudge);
      }
      for (const snoozed of snoozedNudges || []) {
        await snoozedStore.put(snoozed);
      }
    }

    // Migrate notifications
    const notificationsJson = localStorage.getItem('focus-tools-notifications');
    if (notificationsJson) {
      const notifications = JSON.parse(notificationsJson) as Notification[];
      const notifStore = tx.objectStore('notifications');
      for (const notif of notifications) {
        await notifStore.put(notif);
        result.notificationsCount++;
      }
    }

    // Migrate scheduled timers (reminders and start pokes)
    const timerStore = tx.objectStore('scheduledTimers');
    const remindersJson = localStorage.getItem('task-copilot-scheduled-reminders');
    const pokesJson = localStorage.getItem('task-copilot-scheduled-start-pokes');

    const reminders: Record<string, { taskId: string; scheduledTime: number }> = remindersJson
      ? JSON.parse(remindersJson)
      : {};
    const pokes: Record<string, { taskId: string; scheduledTime: number }> = pokesJson
      ? JSON.parse(pokesJson)
      : {};

    // Combine into scheduledTimers records
    const allTaskIds = Array.from(new Set([...Object.keys(reminders), ...Object.keys(pokes)]));
    for (const taskId of allTaskIds) {
      const record: ScheduledTimerRecord = {
        taskId,
        reminderTime: reminders[taskId]?.scheduledTime ?? null,
        startPokeTime: pokes[taskId]?.scheduledTime ?? null,
      };
      await timerStore.put(record);
    }

    await tx.done;

    console.log('[IDB] Migration complete:', result);
    result.success = true;

  } catch (error) {
    console.error('[IDB] Migration failed:', error);
    result.errors.push((error as Error).message);
  }

  return result;
}

// ============================================
// Data Pruning (Phase 3)
// ============================================

/**
 * Prune events older than the specified number of days
 * Returns the number of events deleted
 */
export async function pruneOldEventsFromIDB(daysToKeep: number = 90): Promise<number> {
  if (!isIDBReady()) return 0;

  try {
    const db = await openDatabase();
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    const tx = db.transaction('events', 'readwrite');
    const index = tx.store.index('by-timestamp');

    let deletedCount = 0;
    let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffTime));

    while (cursor) {
      await cursor.delete();
      deletedCount++;
      cursor = await cursor.continue();
    }

    await tx.done;

    if (deletedCount > 0) {
      console.log(`[IDB] Pruned ${deletedCount} events older than ${daysToKeep} days`);
    }

    return deletedCount;
  } catch (error) {
    console.error('[IDB] Failed to prune old events:', error);
    return 0;
  }
}

/**
 * Prune old focus sessions
 * Returns the number of sessions deleted
 */
export async function pruneOldSessionsFromIDB(daysToKeep: number = 90): Promise<number> {
  if (!isIDBReady()) return 0;

  try {
    const db = await openDatabase();
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    const tx = db.transaction('sessions', 'readwrite');
    const index = tx.store.index('by-start');

    let deletedCount = 0;
    let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffTime));

    while (cursor) {
      await cursor.delete();
      deletedCount++;
      cursor = await cursor.continue();
    }

    await tx.done;

    if (deletedCount > 0) {
      console.log(`[IDB] Pruned ${deletedCount} sessions older than ${daysToKeep} days`);
    }

    return deletedCount;
  } catch (error) {
    console.error('[IDB] Failed to prune old sessions:', error);
    return 0;
  }
}

/**
 * Prune acknowledged notifications older than specified days
 */
export async function pruneOldNotificationsFromIDB(daysToKeep: number = 30): Promise<number> {
  if (!isIDBReady()) return 0;

  try {
    const db = await openDatabase();
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    const tx = db.transaction('notifications', 'readwrite');

    let deletedCount = 0;
    let cursor = await tx.store.openCursor();

    while (cursor) {
      const notification = cursor.value as Notification;
      // Only delete if acknowledged and old
      if (notification.acknowledgedAt && notification.acknowledgedAt < cutoffTime) {
        await cursor.delete();
        deletedCount++;
      }
      cursor = await cursor.continue();
    }

    await tx.done;

    if (deletedCount > 0) {
      console.log(`[IDB] Pruned ${deletedCount} old notifications`);
    }

    return deletedCount;
  } catch (error) {
    console.error('[IDB] Failed to prune old notifications:', error);
    return 0;
  }
}

/**
 * Run all pruning operations
 * Call this periodically (e.g., on app start, once per day)
 */
export async function pruneAllOldDataFromIDB(options?: {
  eventDays?: number;
  sessionDays?: number;
  notificationDays?: number;
}): Promise<{ events: number; sessions: number; notifications: number }> {
  const eventDays = options?.eventDays ?? 90;
  const sessionDays = options?.sessionDays ?? 90;
  const notificationDays = options?.notificationDays ?? 30;

  const [events, sessions, notifications] = await Promise.all([
    pruneOldEventsFromIDB(eventDays),
    pruneOldSessionsFromIDB(sessionDays),
    pruneOldNotificationsFromIDB(notificationDays),
  ]);

  return { events, sessions, notifications };
}

// ============================================
// Debug/Info Operations
// ============================================

/**
 * Get counts of records in each store (for debugging)
 */
export async function getStoreCounts(): Promise<Record<string, number>> {
  if (!isIDBReady()) return {};

  try {
    const db = await openDatabase();
    const counts: Record<string, number> = {};

    // Use explicit store names instead of keyof to avoid type issues
    const storeNames = [
      'appState',
      'tasks',
      'events',
      'sessions',
      'nudges',
      'snoozedNudges',
      'notifications',
      'scheduledTimers',
    ] as const;

    for (const name of storeNames) {
      const tx = db.transaction(name, 'readonly');
      counts[name] = await tx.store.count();
      await tx.done;
    }

    return counts;
  } catch (error) {
    console.error('[IDB] Failed to get store counts:', error);
    return {};
  }
}

/**
 * Clear all IndexedDB data (for testing/reset)
 */
export async function clearAllIDBData(): Promise<void> {
  if (!isIDBReady()) return;

  try {
    const db = await openDatabase();
    const storeNames = [
      'appState',
      'tasks',
      'events',
      'sessions',
      'nudges',
      'snoozedNudges',
      'notifications',
      'scheduledTimers',
    ] as const;

    for (const name of storeNames) {
      const tx = db.transaction(name, 'readwrite');
      await tx.store.clear();
      await tx.done;
    }

    console.log('[IDB] All IndexedDB data cleared');
  } catch (error) {
    console.error('[IDB] Failed to clear data:', error);
  }
}
