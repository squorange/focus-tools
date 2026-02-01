# IndexedDB Migration — Specification

> **Status:** 📋 Planned
> **Last Updated:** January 2026

---

## Problem Statement

### Current Pain Points

1. **Storage Limits**
   - localStorage: 5-10MB (browser-dependent)
   - Task history grows unbounded
   - Events and sessions already require pruning
   - No room for future features (attachments, voice memos)

2. **Performance**
   - localStorage is synchronous — blocks main thread
   - JSON.stringify/parse on every operation
   - Noticeable lag during frequent saves (focus mode timers, notification scheduling)

3. **PWA Limitations**
   - Service workers have limited localStorage access
   - Can't reliably schedule background sync
   - Offline-first patterns harder to implement

4. **Data Integrity**
   - No transaction support
   - Race conditions possible with concurrent tabs
   - No rollback on partial failures

### Success Criteria

- [ ] All data migrated without loss
- [ ] App loads faster (async, non-blocking)
- [ ] Service worker can access all stored data
- [ ] Storage capacity effectively unlimited
- [ ] Existing migration system preserved

---

## Feature Overview

### Mental Model

IndexedDB acts as a local database within the browser:

```
┌─────────────────────────────────────────────────┐
│                  IndexedDB                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  tasks   │ │  events  │ │  notifications   │ │
│  │  (store) │ │  (store) │ │     (store)      │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ sessions │ │  nudges  │ │   appState       │ │
│  │  (store) │ │  (store) │ │    (store)       │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

Each "object store" is like a table. We can add indexes for efficient lookups.

### API Design Principle

**Keep the same interface.** Existing code calls:
```typescript
saveState(state)
loadState()
```

After migration, same calls, but async:
```typescript
await saveState(state)
await loadState()
```

The migration is primarily an implementation change, not an API change.

---

## Current Storage Architecture

### localStorage Keys

| Key | Contents | Size Estimate |
|-----|----------|---------------|
| `focus-tools-state` | AppState (tasks, projects, settings, focusQueue) | 50KB - 500KB |
| `focus-tools-events` | Event log (step completions, focus sessions) | 10KB - 200KB |
| `focus-tools-sessions` | Focus session history | 5KB - 50KB |
| `focus-tools-nudges` | Active + snoozed nudges | 1KB - 10KB |
| `focus-tools-notifications` | Scheduled notifications | 1KB - 10KB |

**Additional localStorage keys (notifications.ts):**
| Key | Contents |
|-----|----------|
| `task-copilot-scheduled-reminders` | User-set reminder timers |
| `task-copilot-scheduled-start-pokes` | Start poke timers |

### Schema Migrations

Current system uses `schemaVersion` field (currently v15) with sequential migrations:
- `migrateToV2()`, `migrateToV3()`, ..., `migrateToV15()`
- Each migration transforms data structure
- `ensureCompleteState()` fills missing fields

**This system must be preserved** — IndexedDB has its own versioning, but we keep app-level migrations too.

---

## IndexedDB Schema Design

### Database

```typescript
const DB_NAME = 'focus-tools';
const DB_VERSION = 1;  // IndexedDB schema version (separate from app schema)
```

### Object Stores

| Store | Key | Contents | Indexes |
|-------|-----|----------|---------|
| `appState` | `'singleton'` | AppState minus tasks/events/sessions | — |
| `tasks` | `task.id` | Individual Task objects | `status`, `projectId`, `isRecurring`, `updatedAt` |
| `events` | `event.id` | Event log entries | `timestamp`, `taskId` |
| `sessions` | `session.id` | Focus session records | `taskId`, `startTime` |
| `nudges` | `nudge.id` | Active nudges | `taskId`, `type` |
| `snoozedNudges` | `nudge.id` | Snoozed nudges | `snoozeUntil` |
| `notifications` | `notification.id` | Scheduled notifications | `taskId`, `scheduledTime` |
| `scheduledTimers` | `taskId` | Reminder/poke timers | — |

### Why Separate Stores?

1. **Tasks as individual records** — Can update one task without rewriting all
2. **Events with timestamp index** — Efficient pruning of old events
3. **Notifications queryable** — Find by taskId for cancellation

---

## Migration Strategy

### Phase 1: Parallel Write

```
┌─────────────┐     ┌─────────────┐
│ localStorage│     │  IndexedDB  │
└──────┬──────┘     └──────┬──────┘
       │                   │
   saveState() ────────────┼───────> writes to BOTH
       │                   │
   loadState() <───────────┘         reads from localStorage (primary)
```

- All writes go to both localStorage AND IndexedDB
- Reads still from localStorage
- Builds up IndexedDB data in background
- Safe rollback: just stop writing to IndexedDB

### Phase 2: Read Migration

```
┌─────────────┐     ┌─────────────┐
│ localStorage│     │  IndexedDB  │
└──────┬──────┘     └──────┬──────┘
       │                   │
   saveState() ────────────┼───────> writes to IndexedDB only
       │                   │
   loadState() <───────────┘         reads from IndexedDB (primary)
       │
   (migration)              one-time transfer if needed
```

- On first load, check if IndexedDB has data
- If not, migrate from localStorage
- Switch reads to IndexedDB
- Stop writing to localStorage

### Phase 3: Cleanup

- Remove localStorage data after successful IndexedDB verification
- Remove dual-write code
- Optimize queries with indexes

---

## API Reference

### New Storage API

```typescript
// lib/storage-idb.ts

// Initialize database (call once on app start)
export async function initializeStorage(): Promise<void>

// State operations
export async function loadState(): Promise<AppState>
export async function saveState(state: AppState): Promise<void>

// Task operations (granular for performance)
export async function saveTask(task: Task): Promise<void>
export async function loadTask(taskId: string): Promise<Task | null>
export async function loadTasksByStatus(status: TaskStatus): Promise<Task[]>
export async function deleteTask(taskId: string): Promise<void>

// Event operations
export async function saveEvent(event: Event): Promise<void>
export async function loadRecentEvents(limit: number): Promise<Event[]>
export async function pruneOldEvents(beforeTimestamp: number): Promise<number>

// Notification operations
export async function saveNotification(notification: Notification): Promise<void>
export async function loadNotificationsForTask(taskId: string): Promise<Notification[]>
export async function deleteNotificationsForTask(taskId: string): Promise<void>

// Migration
export async function migrateFromLocalStorage(): Promise<MigrationResult>
export async function verifyMigration(): Promise<boolean>
```

### Migration Result

```typescript
interface MigrationResult {
  success: boolean;
  tasksCount: number;
  eventsCount: number;
  sessionsCount: number;
  errors: string[];
}
```

---

## Edge Cases

### Concurrent Tabs

| Scenario | Handling |
|----------|----------|
| Two tabs open during migration | Lock migration with `navigator.locks` API |
| Tab A writes, Tab B reads | IndexedDB transactions ensure consistency |
| User closes tab during write | Transaction rolled back automatically |

### Quota Exceeded

| Scenario | Handling |
|----------|----------|
| IndexedDB quota exceeded | Prune old events/sessions first, then warn user |
| Migration fails mid-way | Keep localStorage, retry on next load |
| Browser clears storage | Standard PWA limitation; document in settings |

### Browser Support

| Browser | IndexedDB Support |
|---------|-------------------|
| Chrome | ✅ Full |
| Safari | ✅ Full (iOS 10+) |
| Firefox | ✅ Full |
| Edge | ✅ Full |

Note: Private/incognito mode may have storage limits.

---

## Performance Considerations

### Batching Writes

```typescript
// BAD: Individual writes in loop
for (const task of tasks) {
  await saveTask(task);
}

// GOOD: Single transaction
await saveTasksBatch(tasks);
```

### Debouncing State Saves

Current code calls `saveState()` frequently. With IndexedDB:
- Debounce to max 1 write per 100ms
- Use `requestIdleCallback` for non-critical saves
- Immediate save for user-initiated changes

### Read-Through Caching

```typescript
// Memory cache for hot data
const taskCache = new Map<string, Task>();

async function loadTask(id: string): Promise<Task | null> {
  if (taskCache.has(id)) return taskCache.get(id)!;
  const task = await db.get('tasks', id);
  if (task) taskCache.set(id, task);
  return task;
}
```

---

## Testing Strategy

### Unit Tests
- [ ] Object store CRUD operations
- [ ] Index queries return correct results
- [ ] Schema migration preserves data
- [ ] Transaction rollback on error

### Integration Tests
- [ ] Full app state save/load cycle
- [ ] Migration from populated localStorage
- [ ] Concurrent tab operations
- [ ] Quota exceeded handling

### Manual Tests
- [ ] Fresh install (no localStorage)
- [ ] Existing user migration
- [ ] App works offline after migration
- [ ] Service worker can access data

---

## Rollback Plan

If issues discovered after deployment:

1. **Phase 1 (parallel write):** Stop IndexedDB writes, no user impact
2. **Phase 2 (switched reads):** Revert to localStorage reads, data preserved
3. **Phase 3 (cleanup done):** Restore from IndexedDB to localStorage

Keep localStorage code available (behind flag) for 2 release cycles.

---

## Future Enhancements

After migration complete:

1. **Service Worker Sync** — Background sync when offline
2. **Supabase Integration** — IndexedDB as local cache, Supabase as cloud sync
3. **Attachments** — Store blobs (images, voice memos) directly in IndexedDB
4. **Advanced Queries** — Task search, filtering by multiple criteria

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Phased execution plan |
| [DATA_MODEL.md](./DATA_MODEL.md) | Schema definitions |
| [../../ROADMAP.md](../../ROADMAP.md) | Project timeline |
