# ADR-003: Separate Active Sessions from Historical Records

## Status

Accepted

## Context

Time tracking requires managing two distinct concepts:

1. **Active Focus Session** - Currently running timer (one at a time)
2. **Historical Time Entries** - Completed session records (many)

We needed to decide:

- Should they use the same database table/structure?
- How to handle the transition from active → historical?
- How to query efficiently for different use cases?

## Decision

Use two separate database stores with different data models:

**FocusSession** (`focusSessions` store):

- Exactly 0 or 1 active at any time
- Mutable state (pause/resume updates)
- Includes UI state (isActive, lastResumedAt)
- Deleted when session ends

**TimeEntry** (`timeEntries` store):

- Immutable historical records
- Created when session ends
- Optimized for querying/aggregation
- Includes completion metadata

## Consequences

### Positive

- **Clear separation of concerns**: Active vs historical data
- **Optimized queries**: Different indexes for different use cases
- **Type safety**: Separate TypeScript interfaces prevent misuse
- **Performance**: Don't query history when checking for active session
- **Simpler logic**: No need to filter "ended" sessions
- **Clean transitions**: `endSession()` creates TimeEntry, deletes FocusSession

### Negative

- **Data duplication**: Some fields appear in both types
- **Migration cost**: Must create TimeEntry from FocusSession
- **Two sources of truth**: Must keep in sync during transition

## Data Models

### FocusSession (Active)

```typescript
interface FocusSession {
  id: string;
  taskId: string;
  subtaskId?: string;
  startTime: Date;
  isActive: boolean; // For pause/resume
  lastResumedAt?: Date;
  totalPauseTime: number;
  pauseHistory: Array<{ pausedAt: Date; resumedAt?: Date }>;
  // ... UI state fields
}
```

**Key characteristics**:

- Mutable
- UI-focused
- One at a time
- Short-lived

### TimeEntry (Historical)

```typescript
interface TimeEntry {
  id: string;
  sessionId: string; // Links back to FocusSession.id
  taskId: string;
  subtaskId?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // Calculated active time
  wasCompleted: boolean;
  endReason: 'stopped' | 'completed' | 'interrupted';
  sessionNotes?: string;
  // ... metadata fields
}
```

**Key characteristics**:

- Immutable
- Analytics-focused
- Many records
- Permanent

## Workflow

### Starting a Session

```typescript
1. Check for existing FocusSession
2. If exists: pause or prompt to end
3. Create new FocusSession
4. Save to `focusSessions` store
```

### Ending a Session

```typescript
1. Load FocusSession by ID
2. Calculate final duration
3. Create TimeEntry with results
4. Save to `timeEntries` store
5. Delete from `focusSessions` store
6. Create activity log entry
```

### Querying

```typescript
// Check if user is currently focusing:
const active = await getActiveFocusSession(); // Fast: 0-1 records

// Get time stats:
const entries = await getTaskTimeEntries(taskId); // Filtered by index
const total = entries.reduce((sum, e) => sum + e.duration, 0);
```

## Alternatives Considered

### Single Table with Status Field

Store both active and completed sessions in same table with `status` field.

**Pros:**

- Single data model
- No migration between states
- Simpler schema

**Cons:**

- Must filter every query (`WHERE status = 'active'`)
- Mixes mutable and immutable data
- Unclear which fields apply to which status
- Index bloat (need indexes for both use cases)

**Decision:** Rejected - mixing concerns hurts performance and clarity

### Keep FocusSession After Ending

Don't delete FocusSession, just mark as ended.

**Pros:**

- Can reference original session object
- No data loss during transition

**Cons:**

- Multiple "ended" sessions accumulate
- Must clean up eventually
- `getActiveFocusSession()` becomes complex
- Unclear when to delete

**Decision:** Rejected - causes state pollution

## Implementation

**Files**:

- `app/lib/types.ts` - Type definitions
- `app/lib/focus-session.ts` - Session management
- `app/lib/offline-store.ts` - Database operations

**Database stores**:

- `focusSessions` - Active session (single record)
- `timeEntries` - Historical records (indexed by taskId, date)

**Key functions**:

- `startFocusSession()` - Creates FocusSession
- `endSession()` - Creates TimeEntry, deletes FocusSession
- `getActiveFocusSession()` - Returns current session (if any)
- `getTaskTimeEntries()` - Returns historical records

## Related

- ADR-002: Time calculation approach
- `docs/TESTING_FIXES.md` - Bug #4 (double-end prevention)
- Phase 1 Feature: Focus session management

## Date

2025-11-10

## Contributors

- William Tang (requirements, testing)
- Claude Code (architecture, implementation)
