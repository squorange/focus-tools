# ADR-002: Calculate Session Time from First Principles

## Status

Accepted

## Context

Focus sessions need accurate time tracking that:

- Excludes pause time
- Survives page reloads
- Handles browser tab switching
- Works correctly during development (HMR)
- Cannot be corrupted by state inconsistencies

Initial implementation used accumulated time:

```typescript
// BUGGY:
session.totalTime += elapsedSinceResume;
```

This caused **critical bug during testing**:

- 60-second sessions showed as 120 seconds
- Page reload added time twice (reload logic + endSession)
- HMR during development corrupted state

## Decision

Calculate session duration from first principles at the point of ending:

```typescript
// CORRECT:
const totalElapsed = endTime - startTime;
const activeTime = totalElapsed - totalPauseTime;
```

Store only:

- `startTime` (when session began)
- `totalPauseTime` (accumulated pause duration)
- `isActive` (current state)

Do NOT store accumulated active time during session.

## Consequences

### Positive

- **Immune to corruption**: Calculation always correct regardless of state
- **HMR-safe**: Page reloads don't affect accuracy
- **Simple state**: Fewer fields to keep in sync
- **Easier to reason about**: Single source of truth
- **Debuggable**: Can recalculate at any time for verification

### Negative

- **Slightly more computation**: Calculate on every timer tick (negligible)
- **Different mental model**: Not tracking running total

## Alternatives Considered

### Accumulated Time Approach

```typescript
// Track totalTime as session runs:
session.totalTime += elapsed;
// On end: use totalTime directly
```

**Pros:**

- Matches physical stopwatch behavior
- Less calculation at session end

**Cons:**

- Vulnerable to corruption
- Must carefully manage state updates
- Page reload requires complex reconciliation
- HMR can cause double-counting

**Decision:** Rejected - testing revealed critical bugs

### Hybrid Approach

Store both `totalTime` and timestamps, use timestamps as verification.

**Pros:**

- Redundancy for verification
- Can detect corruption

**Cons:**

- More complex state
- Which value is source of truth?
- Doesn't prevent corruption

**Decision:** Rejected - unnecessary complexity

## Implementation

**Location**: `app/lib/focus-session.ts:211-240`

**Key functions**:

- `endSession()` - Calculates final time from start + pauses
- `pauseSession()` - Records pause timestamp
- `resumeSession()` - Calculates and adds pause duration to total
- Timer component - Displays calculated time, but doesn't store it

**Documentation**:

- Inline comments: `focus-session.ts:211-229` (19-line warning block)
- Test documentation: `docs/TEST_EXECUTION.md` - Test 4.1
- Bug reference: `docs/TESTING_FIXES.md` - Critical Bug #1

## Testing

**Test 4.1**: 60-second session

- Before fix: Showed as 2 minutes (120s)
- After fix: Correct 1 minute (60s)

**Test 4.4**: Pause time exclusion

- 30s active + 10s pause + 20s active = 50s final time
- Confirmed pause time properly excluded

## Related

- Critical Bug #1: Double Time Counting (`docs/TESTING_FIXES.md`)
- Test 4.1: Single Session Stats (`docs/TEST_EXECUTION.md`)
- Phase 1 Feature: Timer persistence across reloads

## Date

2025-11-11 (discovered during testing)

## Contributors

- William Tang (testing, bug discovery)
- Claude Code (root cause analysis, fix implementation)
