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
| **1** | Setup + Parallel Writes | None | ⬜ Not Started |
| **2** | Read Migration + Switch | Phase 1 | ⬜ Not Started |
| **3** | Optimization + Indexes | Phase 2 | ⬜ Not Started |
| **4** | Testing + Cleanup | Phase 3 | ⬜ Not Started |

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

- [ ] **2.1** Implement migration function
  - `migrateFromLocalStorage()` — one-time data transfer
  - Transfer: state, events, sessions, nudges, notifications
  - Preserve app schema version for future migrations
  - Handle partial migration (resume if interrupted)

- [ ] **2.2** Implement read functions
  - `loadStateFromIDB()` — async state loading
  - `loadTasksFromIDB()` — load all tasks
  - `loadEventsFromIDB(limit)` — paginated event loading

- [ ] **2.3** Add migration detection
  - Check for `idb-migrated` flag in IndexedDB
  - If not present, run migration
  - Set flag after successful migration

- [ ] **2.4** Switch primary storage
  - Modify `loadState()` to use IndexedDB
  - Fall back to localStorage if IndexedDB empty/failed
  - Remove parallel writes (IndexedDB only)

- [ ] **2.5** Handle async loading in `app/page.tsx`
  - Add loading state during initial load
  - Convert `useState(loadState())` to `useEffect` pattern
  - Ensure UI doesn't flash empty state

- [ ] **2.6** Migrate notification timers
  - Move `task-copilot-scheduled-reminders` to IndexedDB
  - Move `task-copilot-scheduled-start-pokes` to IndexedDB
  - Update `lib/notifications.ts` to use IndexedDB

### Validation Checklist

- [ ] Fresh install works (no localStorage)
- [ ] Existing user data migrates correctly
- [ ] All tasks, events, sessions present after migration
- [ ] Notification timers continue working
- [ ] App loads without visible delay
- [ ] Console shows "Migration complete" message
- [ ] localStorage no longer updated after migration

### Deliverables

- Migration function in `lib/storage-idb.ts`
- Updated `loadState()` and related functions
- Modified `app/page.tsx` for async loading
- Updated `lib/notifications.ts`

---

## Phase 3: Optimization + Indexes

**Goal:** Leverage IndexedDB features for performance and prepare for future features.

**Risk Level:** Low — optimization, not behavior change

### Tasks

- [ ] **3.1** Implement efficient queries
  - `loadTasksByStatus(status)` — use status index
  - `loadTasksByProject(projectId)` — use projectId index
  - `loadRecentEvents(limit)` — use timestamp index with cursor

- [ ] **3.2** Add write batching
  - `saveTasksBatch(tasks)` — single transaction for multiple tasks
  - Debounce state saves (100ms)
  - Use `requestIdleCallback` for non-critical writes

- [ ] **3.3** Implement memory caching
  - LRU cache for frequently accessed tasks
  - Cache invalidation on writes
  - Configurable cache size

- [ ] **3.4** Add data pruning
  - Auto-prune events older than 90 days
  - Auto-prune completed task details older than 30 days
  - Configurable retention in settings

- [ ] **3.5** Implement export/import for IndexedDB
  - Update `exportData()` to read from IndexedDB
  - Update `importData()` to write to IndexedDB
  - Maintain backwards compatibility with localStorage exports

### Validation Checklist

- [ ] Query performance improved (measure with DevTools)
- [ ] Batch writes reduce transaction count
- [ ] Cache hit rate > 80% for task reads
- [ ] Pruning removes expected records
- [ ] Export/import works with IndexedDB data
- [ ] Import of old localStorage exports still works

### Deliverables

- Optimized query functions
- Caching layer
- Pruning utilities
- Updated export/import

---

## Phase 4: Testing + Cleanup

**Goal:** Comprehensive testing, remove legacy code, document for maintainers.

**Risk Level:** Low — cleanup and documentation

### Tasks

- [ ] **4.1** Add unit tests
  - Test all CRUD operations
  - Test migration scenarios
  - Test concurrent access
  - Test quota exceeded handling

- [ ] **4.2** Add integration tests
  - Full app state save/load cycle
  - Migration from populated localStorage
  - Multi-tab scenarios

- [ ] **4.3** Manual testing checklist
  - Fresh install on Chrome, Safari, Firefox
  - Migration from populated localStorage
  - Offline usage after migration
  - Data export/import cycle

- [ ] **4.4** Remove legacy localStorage code
  - Remove parallel write logic
  - Remove localStorage fallback (keep for 1 release cycle)
  - Clean up unused functions

- [ ] **4.5** Update documentation
  - Update CLAUDE.md with new storage architecture
  - Update DATA_MODEL.md if schema changed
  - Add troubleshooting guide for IndexedDB issues

### Validation Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual test checklist complete
- [ ] No localStorage references in active code paths
- [ ] Documentation updated

### Deliverables

- Test suite
- Updated documentation
- Clean codebase without legacy storage code

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
| 1.1 Install idb | ⬜ | | |
| 1.2 Define schema | ⬜ | | |
| 1.3 Create wrapper | ⬜ | | |
| 1.4 Parallel writes | ⬜ | | |
| 1.5 Init in page.tsx | ⬜ | | |

### Phase 2 Progress

| Task | Status | Date | Notes |
|------|--------|------|-------|
| 2.1 Migration function | ⬜ | | |
| 2.2 Read functions | ⬜ | | |
| 2.3 Migration detection | ⬜ | | |
| 2.4 Switch primary | ⬜ | | |
| 2.5 Async loading | ⬜ | | |
| 2.6 Notification timers | ⬜ | | |

### Phase 3 Progress

| Task | Status | Date | Notes |
|------|--------|------|-------|
| 3.1 Efficient queries | ⬜ | | |
| 3.2 Write batching | ⬜ | | |
| 3.3 Memory caching | ⬜ | | |
| 3.4 Data pruning | ⬜ | | |
| 3.5 Export/import | ⬜ | | |

### Phase 4 Progress

| Task | Status | Date | Notes |
|------|--------|------|-------|
| 4.1 Unit tests | ⬜ | | |
| 4.2 Integration tests | ⬜ | | |
| 4.3 Manual testing | ⬜ | | |
| 4.4 Remove legacy | ⬜ | | |
| 4.5 Update docs | ⬜ | | |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Requirements and edge cases |
| [DATA_MODEL.md](./DATA_MODEL.md) | Schema definitions |
| [../../ROADMAP.md](../../ROADMAP.md) | Project timeline |
| [../../ARCHITECTURE_EVOLUTION_GUIDE.md](../../ARCHITECTURE_EVOLUTION_GUIDE.md) | Infrastructure phasing |
