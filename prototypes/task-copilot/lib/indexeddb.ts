/**
 * IndexedDB Database Setup and Schema
 *
 * This module provides the low-level IndexedDB wrapper using the `idb` library.
 * It defines the database schema, object stores, and indexes for Focus Tools.
 *
 * Phase 1: Setup + Parallel Writes
 * - Establishes database structure
 * - Provides typed access to object stores
 *
 * @see docs/features/indexeddb-migration/DATA_MODEL.md for schema design
 */

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import {
  Task,
  Event,
  FocusSession,
  Nudge,
  SnoozedNudge,
  Project,
  FocusQueue,
  UserSettings,
  User,
  NudgeTracker,
  EnergyLevel,
  ViewType,
  FocusModeState,
  StagingState,
  FilterState,
  SortOption,
  QueueMessage,
} from './types';
import { Notification } from './notification-types';

// ============================================
// Database Configuration
// ============================================

export const DB_NAME = 'focus-tools';
export const DB_VERSION = 1; // IndexedDB schema version (separate from app schema)

// ============================================
// Record Types (stored in object stores)
// ============================================

/**
 * AppState record stored in IndexedDB
 * Contains everything except tasks (which are stored individually)
 */
export interface AppStateRecord {
  // Singleton key
  key: 'singleton';

  // Schema version for app-level migrations
  schemaVersion: number;

  // User
  currentUser: User | null;

  // Organization
  projects: Project[];

  // Focus Queue (stored inline since it's small)
  focusQueue: FocusQueue;

  // Settings
  userSettings: UserSettings;

  // Energy state
  currentEnergy: EnergyLevel | null;
  currentEnergySetAt: number | null;

  // Nudge orchestrator state
  nudgeTracker: NudgeTracker;

  // Navigation
  currentView: ViewType;
  activeTaskId: string | null;
  taskDetailMode: 'executing' | 'managing';

  // Focus mode
  focusMode: FocusModeState;
  currentSessionId: string | null;

  // AI staging
  globalStaging: StagingState | null;

  // Queue AI messages
  queueMessages: QueueMessage[];
  queueLastInteractionAt: number | null;

  // Tasks view AI messages
  tasksMessages: QueueMessage[];
  tasksLastInteractionAt: number | null;

  // Filters & sort
  filters: FilterState;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';

  // UI state
  completedTodayExpanded: boolean;
  error: string | null;

  // Migration flag
  migratedFromLocalStorage: boolean;
  migratedAt: number | null;
}

/**
 * Scheduled timer record for reminders and start pokes
 */
export interface ScheduledTimerRecord {
  taskId: string;
  reminderTime: number | null;
  startPokeTime: number | null;
}

// ============================================
// Database Schema Definition
// ============================================

/**
 * TypeScript interface for the IndexedDB schema
 * This provides type safety for all database operations
 *
 * Note: Index types must be IDBValidKey compatible (no null values in type)
 * The actual values can contain null, but the type definition needs string for compatibility
 */
export interface FocusToolsDB extends DBSchema {
  // Singleton app state (everything except tasks/events/sessions)
  appState: {
    key: 'singleton';
    value: AppStateRecord;
  };

  // Individual task records with indexes
  tasks: {
    key: string; // task.id
    value: Task;
    indexes: {
      'by-status': string;
      'by-project': string;
      'by-recurring': number; // boolean stored as 0/1 for indexing
      'by-updated': number;
      'by-created': number;
      'by-deadline': string;
    };
  };

  // Event log entries
  events: {
    key: string; // event.id
    value: Event;
    indexes: {
      'by-timestamp': number;
      'by-task': string;
      'by-type': string;
    };
  };

  // Focus session records
  sessions: {
    key: string; // session.id
    value: FocusSession;
    indexes: {
      'by-task': string;
      'by-start': number;
    };
  };

  // Active nudge records
  nudges: {
    key: string; // nudge.id
    value: Nudge;
    indexes: {
      'by-task': string;
      'by-type': string;
      'by-priority': string;
    };
  };

  // Snoozed nudge records
  snoozedNudges: {
    key: string; // nudge.id
    value: SnoozedNudge;
    indexes: {
      'by-snooze': number;
    };
  };

  // Scheduled notification records
  notifications: {
    key: string; // notification.id
    value: Notification;
    indexes: {
      'by-task': string;
      'by-scheduled': number;
      'by-type': string;
    };
  };

  // Timer records for reminders/start pokes
  scheduledTimers: {
    key: string; // taskId
    value: ScheduledTimerRecord;
  };
}

// ============================================
// Database Instance
// ============================================

let dbInstance: IDBPDatabase<FocusToolsDB> | null = null;

/**
 * Open or get the existing database connection
 * Creates object stores and indexes on first open or version upgrade
 */
export async function openDatabase(): Promise<IDBPDatabase<FocusToolsDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<FocusToolsDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, _transaction) {
      // Version 1: Initial schema
      if (oldVersion < 1) {
        // appState store (singleton)
        db.createObjectStore('appState');

        // tasks store with indexes
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-status', 'status');
        taskStore.createIndex('by-project', 'projectId');
        taskStore.createIndex('by-recurring', 'isRecurring');
        taskStore.createIndex('by-updated', 'updatedAt');
        taskStore.createIndex('by-created', 'createdAt');
        taskStore.createIndex('by-deadline', 'deadlineDate');

        // events store with indexes
        const eventStore = db.createObjectStore('events', { keyPath: 'id' });
        eventStore.createIndex('by-timestamp', 'timestamp');
        eventStore.createIndex('by-task', 'taskId');
        eventStore.createIndex('by-type', 'type');

        // sessions store with indexes
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-task', 'taskId');
        sessionStore.createIndex('by-start', 'startTime');

        // nudges store with indexes
        const nudgeStore = db.createObjectStore('nudges', { keyPath: 'id' });
        nudgeStore.createIndex('by-task', 'targetId');
        nudgeStore.createIndex('by-type', 'type');
        nudgeStore.createIndex('by-priority', 'urgency');

        // snoozedNudges store with indexes
        const snoozedStore = db.createObjectStore('snoozedNudges', { keyPath: 'id' });
        snoozedStore.createIndex('by-snooze', 'snoozeUntil');

        // notifications store with indexes
        const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
        notifStore.createIndex('by-task', 'taskId');
        notifStore.createIndex('by-scheduled', 'scheduledAt');
        notifStore.createIndex('by-type', 'type');

        // scheduledTimers store
        db.createObjectStore('scheduledTimers', { keyPath: 'taskId' });
      }

      // Future IndexedDB schema migrations go here
      // if (oldVersion < 2) { ... }
    },

    blocked() {
      console.warn('[IndexedDB] Database upgrade blocked - close other tabs');
    },

    blocking() {
      // Close connection to allow upgrade in other tab
      dbInstance?.close();
      dbInstance = null;
    },

    terminated() {
      console.warn('[IndexedDB] Database connection terminated unexpectedly');
      dbInstance = null;
    },
  });

  return dbInstance;
}

/**
 * Close the database connection
 * Useful for testing and cleanup
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Delete the entire database
 * Use with caution - only for testing or complete reset
 */
export async function deleteDatabase(): Promise<void> {
  await closeDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn('[IndexedDB] Delete blocked - close other tabs');
    };
  });
}

/**
 * Check if IndexedDB is supported and available
 */
export function isIndexedDBSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('indexedDB' in window)) return false;

  // Check for private browsing restrictions
  try {
    const test = indexedDB.open('__test__');
    test.onerror = () => {};
    return true;
  } catch {
    return false;
  }
}

/**
 * Get database info for debugging
 */
export async function getDatabaseInfo(): Promise<{
  name: string;
  version: number;
  objectStores: string[];
}> {
  const db = await openDatabase();
  return {
    name: db.name,
    version: db.version,
    objectStores: Array.from(db.objectStoreNames),
  };
}
