# ADR-001: Use IndexedDB for Local Storage

## Status

Accepted

## Context

The Orbital Zen application requires client-side data persistence for:

- Task and subtask data
- Focus session state
- Historical time entries
- Activity logs
- User preferences

We needed a storage solution that:

- Works offline
- Supports complex data structures
- Can handle large amounts of historical data
- Allows structured queries
- Provides good performance

Options considered:

1. **LocalStorage** - Simple key-value storage
2. **IndexedDB** - Browser database with indexing
3. **Supabase** (Cloud database) - Backend-as-a-service

## Decision

Use IndexedDB for Phase 1 local storage.

## Consequences

### Positive

- **Large storage capacity**: No 5MB limit like LocalStorage
- **Structured queries**: Can query by date, task, completion status
- **Async API**: Non-blocking operations won't freeze UI
- **Indexes**: Fast lookups for time entries by date range
- **Complex data**: Supports nested objects (tasks with subtasks)
- **Easy migration path**: Can migrate to Supabase later without major refactoring

### Negative

- **More complex API**: Requires wrapper functions for common operations
- **No built-in sync**: Cannot sync across devices without additional work
- **Browser-specific**: Data stays on one device
- **Requires migration script**: Moving to Supabase will need data export/import

## Alternatives Considered

### LocalStorage

**Pros:**

- Simple API
- Synchronous (easier to code)
- Wide browser support

**Cons:**

- 5MB limit (too small for time tracking history)
- No structured queries
- Synchronous (can block UI)
- Only stores strings (requires JSON serialization)

**Decision:** Rejected - storage limit is a dealbreaker for time tracking app

### Supabase (Now)

**Pros:**

- Cross-device sync
- PostgreSQL power
- Real-time updates
- Built-in auth

**Cons:**

- Requires backend setup
- Network dependency
- Overkill for MVP
- Adds complexity before validating product-market fit

**Decision:** Deferred to Phase 4 - will migrate after MVP validation

## Implementation Notes

Created `app/lib/offline-store.ts` with wrapper functions:

- `getDB()` - Initializes database with proper schema
- `saveTask()`, `getTask()`, `getAllTasks()` - Task operations
- `createActivityLog()`, `getActivityLogs()` - Activity tracking
- Indexes on: `taskId`, `date`, `subtaskId`

Database schema defined in `app/lib/types.ts` with TypeScript interfaces.

## Future Migration

When migrating to Supabase (Phase 4):

1. Create matching PostgreSQL schema
2. Export IndexedDB data
3. Import to Supabase
4. Replace `offline-store.ts` functions with Supabase client calls
5. Add RLS policies for security
6. Implement real-time sync

Migration should be transparent to components using the storage functions.

## Related

- Phase 4 TODO: Supabase migration
- `docs/TODO.md` - Multi-device sync requirements

## Date

2025-11-10

## Contributors

- William Tang (architect)
- Claude Code (implementation)
