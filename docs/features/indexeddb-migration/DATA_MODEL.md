# IndexedDB Migration — Data Model

> **Status:** 📋 Planned
> **Last Updated:** February 2026
> **Purpose:** Define IndexedDB schema, object stores, and indexes

---

## Overview

This document defines the IndexedDB schema for Task Co-Pilot. The design prioritizes:
1. **Granular updates** — Update one task without rewriting all tasks
2. **Efficient queries** — Indexes for common access patterns
3. **Migration path** — Clean transition from localStorage

---

## Database Configuration

```typescript
const DB_NAME = 'focus-tools';
const DB_VERSION = 1;  // IndexedDB schema version (separate from app schema)
```

**Note:** IndexedDB version is independent of app schema version (currently v15). App-level migrations continue to work within IndexedDB.

---

## Object Stores

### 1. `appState`

Stores singleton application state (everything except tasks/events/sessions).

| Property | Type | Description |
|----------|------|-------------|
| **Key** | `'singleton'` | Single record |
| schemaVersion | `number` | App schema version (for migrations) |
| currentUser | `string \| null` | User identifier |
| projects | `Project[]` | All projects |
| focusQueue | `FocusQueue` | Queue state |
| userSettings | `UserSettings` | User preferences |
| currentEnergy | `EnergyLevel \| null` | Current energy state |
| currentEnergySetAt | `number \| null` | When energy was set |
| nudgeTracker | `NudgeTracker` | Orchestrator state |
| currentView | `ViewType` | Active view |
| activeTaskId | `string \| null` | Selected task |
| focusMode | `FocusModeState` | Focus mode state |
| globalStaging | `StagingState \| null` | Global AI staging |
| filters | `TaskFilters` | Filter state |
| ... | ... | Other UI state |

**Indexes:** None (single record, accessed by key)

---

### 2. `tasks`

Stores individual Task objects for granular access.

| Property | Type | Description |
|----------|------|-------------|
| **Key** | `task.id` | Task ID (primary key) |
| ... | `Task` | Full Task object |

**Indexes:**

| Index Name | Key Path | Unique | Purpose |
|------------|----------|--------|---------|
| `by-status` | `status` | No | Filter by inbox/pool/complete/archived |
| `by-project` | `projectId` | No | Filter by project |
| `by-recurring` | `isRecurring` | No | Filter routines |
| `by-updated` | `updatedAt` | No | Sort by recent activity |
| `by-created` | `createdAt` | No | Sort by creation date |
| `by-deadline` | `deadlineDate` | No | Find upcoming deadlines |

**Schema:**

```typescript
interface TaskStore {
  keyPath: 'id';
  indexes: {
    'by-status': { keyPath: 'status' };
    'by-project': { keyPath: 'projectId' };
    'by-recurring': { keyPath: 'isRecurring' };
    'by-updated': { keyPath: 'updatedAt' };
    'by-created': { keyPath: 'createdAt' };
    'by-deadline': { keyPath: 'deadlineDate' };
  };
}
```

---

### 3. `events`

Stores event log entries (step completions, focus sessions, etc.).

| Property | Type | Description |
|----------|------|-------------|
| **Key** | `event.id` | Event ID (primary key) |
| id | `string` | Unique identifier |
| type | `string` | Event type |
| taskId | `string \| null` | Related task |
| timestamp | `number` | When event occurred |
| data | `object` | Event-specific data |

**Indexes:**

| Index Name | Key Path | Unique | Purpose |
|------------|----------|--------|---------|
| `by-timestamp` | `timestamp` | No | Chronological queries, pruning |
| `by-task` | `taskId` | No | Events for specific task |
| `by-type` | `type` | No | Filter by event type |

---

### 4. `sessions`

Stores focus session records.

| Property | Type | Description |
|----------|------|-------------|
| **Key** | `session.id` | Session ID (primary key) |
| id | `string` | Unique identifier |
| taskId | `string` | Task focused on |
| startTime | `number` | Session start |
| endTime | `number \| null` | Session end |
| duration | `number` | Total duration (ms) |
| pausedTime | `number` | Time spent paused |

**Indexes:**

| Index Name | Key Path | Unique | Purpose |
|------------|----------|--------|---------|
| `by-task` | `taskId` | No | Sessions for specific task |
| `by-start` | `startTime` | No | Chronological, pruning |

---

### 5. `nudges`

Stores active nudge records.

| Property | Type | Description |
|----------|------|-------------|
| **Key** | `nudge.id` | Nudge ID (primary key) |
| id | `string` | Unique identifier |
| taskId | `string` | Related task |
| type | `string` | Nudge type |
| priority | `number` | Priority score |
| createdAt | `number` | When created |

**Indexes:**

| Index Name | Key Path | Unique | Purpose |
|------------|----------|--------|---------|
| `by-task` | `taskId` | No | Nudges for specific task |
| `by-type` | `type` | No | Filter by nudge type |
| `by-priority` | `priority` | No | Sort by priority |

---

### 6. `snoozedNudges`

Stores snoozed nudge records.

| Property | Type | Description |
|----------|------|-------------|
| **Key** | `nudge.id` | Nudge ID (primary key) |
| id | `string` | Unique identifier |
| taskId | `string` | Related task |
| snoozeUntil | `number` | When to resurface |

**Indexes:**

| Index Name | Key Path | Unique | Purpose |
|------------|----------|--------|---------|
| `by-snooze` | `snoozeUntil` | No | Find expired snoozes |

---

### 7. `notifications`

Stores scheduled notification records.

| Property | Type | Description |
|----------|------|-------------|
| **Key** | `notification.id` | Notification ID (primary key) |
| id | `string` | Unique identifier |
| taskId | `string` | Related task |
| type | `string` | Notification type |
| scheduledTime | `number` | When to fire |
| fired | `boolean` | Whether already fired |
| acknowledged | `boolean` | Whether user saw it |

**Indexes:**

| Index Name | Key Path | Unique | Purpose |
|------------|----------|--------|---------|
| `by-task` | `taskId` | No | Notifications for task (cancellation) |
| `by-scheduled` | `scheduledTime` | No | Find due notifications |
| `by-fired` | `fired` | No | Filter unfired |

---

### 8. `scheduledTimers`

Stores reminder and start poke timer data (currently in separate localStorage keys).

| Property | Type | Description |
|----------|------|-------------|
| **Key** | `taskId` | Task ID (primary key) |
| taskId | `string` | Task identifier |
| reminderTime | `number \| null` | Scheduled reminder |
| startPokeTime | `number \| null` | Scheduled start poke |
| timerId | `number \| null` | setTimeout ID (runtime only) |

**Indexes:** None (accessed by taskId key)

---

## Database Initialization

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FocusToolsDB extends DBSchema {
  appState: {
    key: 'singleton';
    value: AppStateRecord;
  };
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by-status': string;
      'by-project': string | null;
      'by-recurring': boolean;
      'by-updated': number;
      'by-created': number;
      'by-deadline': string | null;
    };
  };
  events: {
    key: string;
    value: EventRecord;
    indexes: {
      'by-timestamp': number;
      'by-task': string | null;
      'by-type': string;
    };
  };
  sessions: {
    key: string;
    value: SessionRecord;
    indexes: {
      'by-task': string;
      'by-start': number;
    };
  };
  nudges: {
    key: string;
    value: Nudge;
    indexes: {
      'by-task': string;
      'by-type': string;
      'by-priority': number;
    };
  };
  snoozedNudges: {
    key: string;
    value: SnoozedNudge;
    indexes: {
      'by-snooze': number;
    };
  };
  notifications: {
    key: string;
    value: Notification;
    indexes: {
      'by-task': string;
      'by-scheduled': number;
      'by-fired': boolean;
    };
  };
  scheduledTimers: {
    key: string;
    value: ScheduledTimer;
  };
}

export async function openDatabase(): Promise<IDBPDatabase<FocusToolsDB>> {
  return openDB<FocusToolsDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create stores on first open
      if (oldVersion < 1) {
        // appState store
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
        nudgeStore.createIndex('by-task', 'taskId');
        nudgeStore.createIndex('by-type', 'type');
        nudgeStore.createIndex('by-priority', 'priority');

        // snoozedNudges store with indexes
        const snoozedStore = db.createObjectStore('snoozedNudges', { keyPath: 'id' });
        snoozedStore.createIndex('by-snooze', 'snoozeUntil');

        // notifications store with indexes
        const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
        notifStore.createIndex('by-task', 'taskId');
        notifStore.createIndex('by-scheduled', 'scheduledTime');
        notifStore.createIndex('by-fired', 'fired');

        // scheduledTimers store
        db.createObjectStore('scheduledTimers', { keyPath: 'taskId' });
      }

      // Future IndexedDB schema migrations go here
      // if (oldVersion < 2) { ... }
    },
  });
}
```

---

## Migration from localStorage

### Data Mapping

| localStorage Key | IndexedDB Store | Notes |
|------------------|-----------------|-------|
| `focus-tools-state` | `appState` + `tasks` | Split: tasks to separate store |
| `focus-tools-events` | `events` | Direct mapping |
| `focus-tools-sessions` | `sessions` | Direct mapping |
| `focus-tools-nudges` | `nudges` + `snoozedNudges` | Split by type |
| `focus-tools-notifications` | `notifications` | Direct mapping |
| `task-copilot-scheduled-reminders` | `scheduledTimers` | Merge into single store |
| `task-copilot-scheduled-start-pokes` | `scheduledTimers` | Merge into single store |

### Migration Function

```typescript
export async function migrateFromLocalStorage(): Promise<MigrationResult> {
  const db = await openDatabase();
  const result: MigrationResult = {
    success: false,
    tasksCount: 0,
    eventsCount: 0,
    sessionsCount: 0,
    errors: [],
  };

  try {
    // Check if already migrated
    const existing = await db.get('appState', 'singleton');
    if (existing?.migrated) {
      result.success = true;
      return result;
    }

    // Load from localStorage
    const stateJson = localStorage.getItem('focus-tools-state');
    if (!stateJson) {
      // Fresh install, no migration needed
      result.success = true;
      return result;
    }

    const state = JSON.parse(stateJson);
    const migratedState = migrateState(state); // Existing schema migration

    // Write to IndexedDB in transaction
    const tx = db.transaction(
      ['appState', 'tasks', 'events', 'sessions', 'nudges', 'snoozedNudges', 'notifications'],
      'readwrite'
    );

    // Store tasks individually
    for (const task of migratedState.tasks) {
      await tx.objectStore('tasks').put(task);
      result.tasksCount++;
    }

    // Store appState (without tasks)
    const { tasks, ...appStateWithoutTasks } = migratedState;
    await tx.objectStore('appState').put(
      { ...appStateWithoutTasks, migrated: true },
      'singleton'
    );

    // Migrate events
    const eventsJson = localStorage.getItem('focus-tools-events');
    if (eventsJson) {
      const events = JSON.parse(eventsJson);
      for (const event of events) {
        await tx.objectStore('events').put(event);
        result.eventsCount++;
      }
    }

    // Migrate sessions
    const sessionsJson = localStorage.getItem('focus-tools-sessions');
    if (sessionsJson) {
      const sessions = JSON.parse(sessionsJson);
      for (const session of sessions) {
        await tx.objectStore('sessions').put(session);
        result.sessionsCount++;
      }
    }

    // Migrate nudges
    const nudgesJson = localStorage.getItem('focus-tools-nudges');
    if (nudgesJson) {
      const { nudges, snoozedNudges } = JSON.parse(nudgesJson);
      for (const nudge of nudges || []) {
        await tx.objectStore('nudges').put(nudge);
      }
      for (const snoozed of snoozedNudges || []) {
        await tx.objectStore('snoozedNudges').put(snoozed);
      }
    }

    // Migrate notifications
    const notifsJson = localStorage.getItem('focus-tools-notifications');
    if (notifsJson) {
      const notifications = JSON.parse(notifsJson);
      for (const notif of notifications) {
        await tx.objectStore('notifications').put(notif);
      }
    }

    await tx.done;
    result.success = true;

  } catch (error) {
    result.errors.push((error as Error).message);
  }

  return result;
}
```

---

## Common Query Patterns

### Load all tasks by status

```typescript
async function loadTasksByStatus(status: TaskStatus): Promise<Task[]> {
  const db = await openDatabase();
  return db.getAllFromIndex('tasks', 'by-status', status);
}
```

### Load tasks for a project

```typescript
async function loadTasksByProject(projectId: string): Promise<Task[]> {
  const db = await openDatabase();
  return db.getAllFromIndex('tasks', 'by-project', projectId);
}
```

### Load recent events

```typescript
async function loadRecentEvents(limit: number): Promise<EventRecord[]> {
  const db = await openDatabase();
  const tx = db.transaction('events', 'readonly');
  const index = tx.store.index('by-timestamp');

  const events: EventRecord[] = [];
  let cursor = await index.openCursor(null, 'prev'); // Descending

  while (cursor && events.length < limit) {
    events.push(cursor.value);
    cursor = await cursor.continue();
  }

  return events;
}
```

### Cancel notifications for task

```typescript
async function cancelNotificationsForTask(taskId: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('notifications', 'readwrite');
  const index = tx.store.index('by-task');

  let cursor = await index.openCursor(taskId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}
```

---

## Storage Estimates

| Store | Records (typical) | Size Estimate |
|-------|-------------------|---------------|
| appState | 1 | 10-50 KB |
| tasks | 50-500 | 100-500 KB |
| events | 1,000-10,000 | 100 KB - 1 MB |
| sessions | 100-1,000 | 20-100 KB |
| nudges | 0-50 | 1-10 KB |
| notifications | 0-20 | 1-5 KB |
| **Total** | — | **~500 KB - 2 MB** |

IndexedDB quota is typically 50%+ of available disk space, so this is well within limits.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Requirements and edge cases |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Phased execution plan |
| [../../DATA_MODEL.md](../../DATA_MODEL.md) | App-level type definitions |
