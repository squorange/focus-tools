# IndexedDB Migration — Implementation Plan

> **Status:** 📋 Planned
> **Last Updated:** February 2026
> **Purpose:** Phased execution plan with progress tracking

---

## Overview

This document provides the detailed implementation plan for migrating Task Co-Pilot from localStorage to IndexedDB. Each phase is independently deployable and includes validation criteria.

**Estimated Scope:** 4 phases

---

## Prerequisites

Before starting:
- [ ] Read [SPEC.md](./SPEC.md) for requirements and edge cases
- [ ] Read [DATA_MODEL.md](./DATA_MODEL.md) for schema design
- [ ] Install `idb` package: `npm install idb`

---

## Phase Summary

| Phase | Focus | Dependencies | Status |
|-------|-------|--------------|--------|
| **1** | Setup + Parallel Writes | None | ✅ Complete |
| **2** | Read Migration + Switch | Phase 1 | ✅ Complete |
| **3** | Optimization + Indexes | Phase 2 | ✅ Complete |
| **4** | Testing + Cleanup | Phase 3 | ✅ Complete |

---

## Phase 1: Setup + Parallel Writes

**Goal:** Establish IndexedDB infrastructure and begin populating data without affecting reads.

**Risk Level:** Low — localStorage continues as source of truth

### Tasks

- [ ] **1.1** Install and configure `idb` library
  - Add to package.json
  - Create `lib/indexeddb.ts` with database initialization

- [ ] **1.2** Define IndexedDB schema
  - Create object stores: `appState`, `tasks`, `events`, `sessions`, `nudges`, `notifications`
  - Define indexes per [DATA_MODEL.md](./DATA_MODEL.md)
  - Implement `openDatabase()` with version handling

- [ ] **1.3** Create storage wrapper (`lib/storage-idb.ts`)
  - `saveStateToIDB()` — mirrors current `saveState()` logic
  - `saveTaskToIDB()` — granular task writes
  - `saveEventsToIDB()` — batch event writes

- [ ] **1.4** Implement parallel writes in `lib/storage.ts`
  - Modify `saveState()` to write to both localStorage AND IndexedDB
  - Modify `saveEvents()`, `saveSessions()`, `saveNudges()`, `saveNotifications()` similarly
  - Add error handling — IndexedDB failures should not block localStorage writes

- [ ] **1.5** Add initialization in `app/page.tsx`
  - Call `initializeIDB()` on app mount
  - Ensure database ready before first write

### Validation Checklist

- [ ] IndexedDB `focus-tools` database appears in DevTools > Application > IndexedDB
- [ ] All object stores created with correct structure
- [ ] Data populates in IndexedDB on state changes
- [ ] localStorage continues to work normally
- [ ] No console errors during normal usage
- [ ] App performance not degraded

### Deliverables

- `lib/indexeddb.ts` — Database setup and schema
- `lib/storage-idb.ts` — IndexedDB storage operations
- Modified `lib/storage.ts` — Parallel write logic

---

## Phase 2: Read Migration + Switch

**Goal:** Switch reads from localStorage to IndexedDB, with automatic migration for existing users.

**Risk Level:** Medium — changing source of truth

### Tasks

- [x] **2.1** Implement migration function
  - `migrateFromLocalStorage()` — one-time data transfer
  - Transfer: state, events, sessions, nudges, notifications
  - Preserve app schema version for future migrations
  - Handle partial migration (resume if interrupted)

- [x] **2.2** Implement read functions
  - `loadStateFromIDB()` — async state loading
  - `loadTasksFromIDB()` — load all tasks
  - `loadEventsFromIDB()` — load events

- [x] **2.3** Add migration detection
  - Check for `migratedFromLocalStorage` flag in appState record
  - If not present, run migration
  - Set flag after successful migration

- [x] **2.4** Switch primary storage
  - Added `loadStateAsync()` to use IndexedDB
  - Fall back to localStorage if IndexedDB empty/failed
  - IndexedDB is primary, localStorage is backup

- [x] **2.5** Handle async loading in `app/page.tsx`
  - Converted to async/await pattern in useEffect
  - Initial state from `createInitialAppState()` prevents flash
  - State updates after async load completes

- [x] **2.6** Migrate notification timers (data only)
  - Migration copies reminders/pokes to `scheduledTimers` store
  - `lib/notifications.ts` still uses localStorage for PWA/service worker compat
  - Full notification system migration deferred to Phase 4

### Validation Checklist

- [x] Fresh install works (no localStorage)
- [x] Existing user data migrates correctly
- [x] All tasks, events, sessions present after migration
- [x] Notification timers continue working (localStorage fallback)
- [x] App loads without visible delay
- [x] Console shows "Migration complete" message
- [ ] localStorage can be removed (deferred to Phase 4)

### Deliverables

- Migration function in `lib/storage-idb.ts`
- `loadStateAsync()` and async variants in `lib/storage.ts`
- Modified `app/page.tsx` for async loading

---

## Phase 3: Optimization + Indexes

**Goal:** Leverage IndexedDB features for performance and prepare for future features.

**Risk Level:** Low — optimization, not behavior change

### Tasks

- [x] **3.1** Implement efficient queries
  - `loadTasksByStatusFromIDB(status)` — use status index
  - `loadTasksByProjectFromIDB(projectId)` — use projectId index
  - `loadRecentEventsFromIDB(limit)` — use timestamp index with cursor
  - `loadRecurringTasksFromIDB()` — use recurring index
  - `loadTasksByDeadlineRangeFromIDB()` — use deadline index

- [x] **3.2** Add write batching
  - `saveTasksBatchToIDB(tasks)` — single transaction (from Phase 1)
  - `saveStateDebouncedToIDB()` — 100ms debounce
  - `saveStateIdleToIDB()` — uses `requestIdleCallback`
  - `flushPendingSaves()` — force flush before unload

- [x] **3.3** Implement memory caching
  - `TaskCache` class with LRU eviction (50 tasks max)
  - `getTaskCached()` — cache-aside read
  - `saveTaskCached()` — write-through cache
  - `preloadTaskCache()` — warm cache on startup
  - `clearTaskCache()` — invalidation for bulk ops

- [x] **3.4** Add data pruning
  - `pruneOldEventsFromIDB(days)` — default 90 days
  - `pruneOldSessionsFromIDB(days)` — default 90 days
  - `pruneOldNotificationsFromIDB(days)` — default 30 days
  - `pruneAllOldDataFromIDB()` — runs all pruning

- [x] **3.5** Implement export/import for IndexedDB
  - `exportDataAsync()` — reads from IndexedDB
  - `importDataAsync()` — writes to both storages
  - Original sync functions still work (backwards compatible)

### Validation Checklist

- [x] Query functions use indexes
- [x] Debounce reduces write frequency
- [x] LRU cache with configurable size
- [x] Pruning functions available
- [x] Async export/import functions added
- [x] Original import still works (uses sync save which writes to IDB)

### Deliverables

- Indexed query functions in `lib/storage-idb.ts`
- Caching layer (`TaskCache` class)
- Pruning utilities
- `exportDataAsync()` and `importDataAsync()` in `lib/storage.ts`

---

## Phase 4: Testing + Cleanup

**Goal:** Comprehensive testing, remove legacy code, document for maintainers.

**Risk Level:** Low — cleanup and documentation

### Tasks

- [ ] **4.1** Add unit tests (Deferred)
  - Requires Test Harnesses (Infra Phase 2)
  - Will test CRUD, migration, concurrent access

- [ ] **4.2** Add integration tests (Deferred)
  - Requires Test Harnesses (Infra Phase 2)
  - Will test full save/load cycle, migration

- [x] **4.3** Manual testing checklist
  - Created [TESTING.md](./TESTING.md) with scenarios
  - Covers fresh install, migration, offline, export/import
  - Cross-browser testing table

- [x] **4.4** Remove legacy localStorage code
  - Removed parallel writes to localStorage
  - localStorage only used as fallback for unsupported browsers
  - IndexedDB is now sole storage for supported browsers

- [x] **4.5** Update documentation
  - Updated CLAUDE.md with storage architecture section
  - Added TESTING.md with troubleshooting guide
  - Updated README.md document guide

### Validation Checklist

- [ ] Unit tests pass (deferred to Test Harnesses phase)
- [ ] Integration tests pass (deferred to Test Harnesses phase)
- [x] Manual test checklist created
- [x] localStorage writes removed (fallback only)
- [x] Documentation updated

### Deliverables

- [TESTING.md](./TESTING.md) — Manual test checklist + troubleshooting
- Updated CLAUDE.md with storage architecture
- IndexedDB-only save functions

---

## Dependencies Graph

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Phase 1: Setup              Phase 2: Migration     │
│  ┌─────────────┐            ┌─────────────┐        │
│  │ indexeddb.ts│ ────────── │ Read Switch │        │
│  │ storage-idb │            │ Migration   │        │
│  │ Parallel    │            │ Async Load  │        │
│  └─────────────┘            └──────┬──────┘        │
│                                    │               │
│                                    ▼               │
│                             Phase 3: Optimize      │
│                             ┌─────────────┐        │
│                             │ Indexes     │        │
│                             │ Caching     │        │
│                             │ Batching    │        │
│                             └──────┬──────┘        │
│                                    │               │
│                                    ▼               │
│                             Phase 4: Cleanup       │
│                             ┌─────────────┐        │
│                             │ Tests       │        │
│                             │ Docs        │        │
│                             │ Remove old  │        │
│                             └─────────────┘        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Parallel writes in Phase 1; localStorage preserved until Phase 4 |
| Performance regression | Benchmark before/after each phase |
| Browser compatibility | Test on Chrome, Safari, Firefox before each merge |
| User interrupts migration | Resume logic; migration is idempotent |
| Quota exceeded | Graceful degradation; pruning; user warning |

---

## Progress Log

Use this section to track progress across sessions.

### Phase 1 Progress

| Task | Status | Date | Notes |
|------|--------|------|-------|
| 1.1 Install idb | ✅ | 2026-02-01 | Added to package.json |
| 1.2 Define schema | ✅ | 2026-02-01 | lib/indexeddb.ts with typed schema |
| 1.3 Create wrapper | ✅ | 2026-02-01 | lib/storage-idb.ts write operations |
| 1.4 Parallel writes | ✅ | 2026-02-01 | storage.ts calls IDB on all saves |
| 1.5 Init in page.tsx | ✅ | 2026-02-01 | Dynamic import on hydration |

### Phase 2 Progress

| Task | Status | Date | Notes |
|------|--------|------|-------|
| 2.1 Migration function | ✅ | 2026-02-01 | migrateFromLocalStorage() in storage-idb.ts |
| 2.2 Read functions | ✅ | 2026-02-01 | loadStateFromIDB, loadTasksFromIDB, etc. |
| 2.3 Migration detection | ✅ | 2026-02-01 | migratedFromLocalStorage flag in appState |
| 2.4 Switch primary | ✅ | 2026-02-01 | loadStateAsync() uses IDB first |
| 2.5 Async loading | ✅ | 2026-02-01 | page.tsx uses async/await pattern |
| 2.6 Notification timers | ✅ | 2026-02-01 | Data migrated, localStorage fallback for PWA |

### Phase 3 Progress

| Task | Status | Date | Notes |
|------|--------|------|-------|
| 3.1 Efficient queries | ✅ | 2026-02-01 | 7 indexed query functions |
| 3.2 Write batching | ✅ | 2026-02-01 | Debounce + requestIdleCallback |
| 3.3 Memory caching | ✅ | 2026-02-01 | LRU TaskCache (50 tasks) |
| 3.4 Data pruning | ✅ | 2026-02-01 | Events/sessions/notifications |
| 3.5 Export/import | ✅ | 2026-02-01 | Async versions added |

### Phase 4 Progress

| Task | Status | Date | Notes |
|------|--------|------|-------|
| 4.1 Unit tests | ⏸️ | — | Deferred to Test Harnesses phase |
| 4.2 Integration tests | ⏸️ | — | Deferred to Test Harnesses phase |
| 4.3 Manual testing | ✅ | 2026-02-01 | TESTING.md created |
| 4.4 Remove legacy | ✅ | 2026-02-01 | localStorage fallback only |
| 4.5 Update docs | ✅ | 2026-02-01 | CLAUDE.md + TESTING.md |

### Bug Fixes

| Date | Issue | Fix |
|------|-------|-----|
| 2026-02-01 | Focus queue cleared on refresh | `saveStateToIDB()` was resetting `migratedFromLocalStorage` to `false` on every save, causing migration to re-run from stale localStorage data. Fixed by preserving existing migration flags. |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Requirements and edge cases |
| [DATA_MODEL.md](./DATA_MODEL.md) | Schema definitions |
| [../../ROADMAP.md](../../ROADMAP.md) | Project timeline |
| [../../ARCHITECTURE_EVOLUTION_GUIDE.md](../../ARCHITECTURE_EVOLUTION_GUIDE.md) | Infrastructure phasing |
