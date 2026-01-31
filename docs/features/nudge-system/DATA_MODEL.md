# Nudge System — Data Model

> **Status:** Draft  
> **Created:** January 2026  
> **Purpose:** Define data structures for importance, energy, lead time, and priority calculation

---

## Overview

This document defines the data model extensions required for the intelligent nudge system. The core principle:

> **Importance is the user's judgment. Priority is the system's recommendation.**

- **Importance:** User-set (or partner-set), represents stakes/consequences
- **Priority:** System-calculated, represents what to work on *now*

---

## 1. Task Model Extensions

### New Fields

```typescript
interface Task {
  // === EXISTING FIELDS (for context) ===
  id: string;
  title: string;
  deadlineDate: string | null;        // ISO date (YYYY-MM-DD)
  targetDate: string | null;          // Soft target
  estimatedMinutes: number | null;    // Active work time
  effort: 'quick' | 'medium' | 'deep' | null;
  deferredCount: number;
  updatedAt: number;
  source: TaskSource;
  isRecurring: boolean;
  
  // === NEW: IMPORTANCE (user-set) ===
  importance: ImportanceLevel | null;
  importanceSource: 'self' | 'partner' | null;
  importanceNote: string | null;
  
  // === NEW: ENERGY TYPE (user-set) ===
  energyType: EnergyType | null;
  
  // === NEW: LEAD TIME (user-set) ===
  leadTimeDays: number | null;
  leadTimeSource: 'manual' | 'ai' | null;
}

type ImportanceLevel = 'must_do' | 'should_do' | 'could_do' | 'would_like_to';

type EnergyType = 'energizing' | 'neutral' | 'draining';
```

### Field Definitions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `importance` | enum \| null | `null` | User's assessment of stakes/consequences |
| `importanceSource` | enum \| null | `null` | Who set the importance (self or partner) |
| `importanceNote` | string \| null | `null` | Optional context (e.g., "Sarah specifically asked") |
| `energyType` | enum \| null | `null` | How the task feels emotionally |
| `leadTimeDays` | number \| null | `null` (treated as 0) | Calendar runway needed beyond active work time |
| `leadTimeSource` | enum \| null | `null` | Who set the lead time |

### Importance Levels

| Level | Meaning | Example |
|-------|---------|---------|
| `must_do` | Real consequences if not done | File taxes, critical work deadline |
| `should_do` | Meaningful progress toward goals | Project milestone, routine maintenance |
| `could_do` | Valuable but deferrable | Nice-to-have improvements |
| `would_like_to` | Aspirational, no pressure | Someday/maybe items |

### Energy Types

| Type | Meaning | Example |
|------|---------|---------|
| `energizing` | Look forward to it, builds momentum | Creative work, enjoyable tasks |
| `neutral` | Neither here nor there | Routine tasks |
| `draining` | Takes effort to start, depletes energy | Admin work, difficult conversations |

---

## 2. User State Model

### New Fields

```typescript
interface UserState {
  // === NEW: CURRENT ENERGY ===
  currentEnergy: EnergyLevel | null;
  currentEnergySetAt: number | null;
}

type EnergyLevel = 'high' | 'medium' | 'low';
```

### Field Definitions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `currentEnergy` | enum \| null | `null` | User's self-reported energy level |
| `currentEnergySetAt` | timestamp \| null | `null` | When energy was last set (for staleness) |

### Energy Level Definitions

| Level | Meaning | Task Matching |
|-------|---------|---------------|
| `high` | Feeling sharp, focused | Prioritize deep/draining tasks (best use of peak state) |
| `medium` | Normal, functional | Balanced task selection |
| `low` | Tired, depleted | Prioritize quick/energizing tasks |

---

## 3. Computed Fields (Not Stored)

These are calculated at runtime, not persisted:

```typescript
interface ComputedTaskFields {
  // Effective deadline accounting for lead time
  effectiveDeadline: Date | null;
  // effectiveDeadline = deadlineDate - leadTimeDays
  
  // Priority score (0-100+)
  priorityScore: number;
  
  // Priority tier derived from score
  priorityTier: PriorityTier;
}

type PriorityTier = 'critical' | 'high' | 'medium' | 'low';
```

### Effective Deadline Calculation

```typescript
function getEffectiveDeadline(task: Task): Date | null {
  if (!task.deadlineDate) return null;
  
  const deadline = parseDate(task.deadlineDate);
  const leadTime = task.leadTimeDays ?? 0;
  
  return subtractDays(deadline, leadTime);
}
```

### Priority Tier Thresholds

| Score Range | Tier | Meaning |
|-------------|------|---------|
| 60+ | `critical` | Act now |
| 40-59 | `high` | Act soon |
| 20-39 | `medium` | On radar |
| 0-19 | `low` | When you get to it |

---

## 4. Priority Score Calculation

Priority score is computed from multiple factors:

### Score Components

| Factor | Condition | Points |
|--------|-----------|--------|
| **User-Set Importance** | | |
| | `must_do` | +25 |
| | `should_do` | +15 |
| | `could_do` | +5 |
| | `would_like_to` | +0 |
| | `null` (not set) | +10 |
| **Time Pressure** (uses effective deadline) | | |
| | Effective deadline passed (should have started) | +40 |
| | Effective deadline today/tomorrow | +35 |
| | Effective deadline this week | +15 |
| | Effective deadline this month | +5 |
| | No deadline or >1 month | +0 |
| **Source/Stakeholder** | | |
| | Partner-created or partner-flagged | +20 |
| | Work/external source | +15 |
| | Self-created | +0 |
| **Staleness** | | |
| | >14 days since last update | +15 |
| | 7-14 days since last update | +8 |
| | <7 days | +0 |
| **Streak Risk** (routines only) | | |
| | Active streak >7 days | +12 |
| | Active streak 3-7 days | +6 |
| | No streak or <3 days | +0 |
| **Defer Count** | | |
| | Deferred 3+ times | +10 |
| | Deferred 1-2 times | +5 |
| | Never deferred | +0 |
| **Energy Match** (contextual, when user energy is set) | | |
| | Task energy matches user energy | +8 |
| | Neutral match | +0 |
| | Task energy mismatches user energy | -5 |

### Calculation Function

```typescript
function calculatePriorityScore(
  task: Task, 
  userState: UserState
): number {
  let score = 0;
  
  // Importance
  score += getImportanceScore(task.importance);
  
  // Time pressure (uses effective deadline)
  score += getTimePressureScore(task);
  
  // Source
  score += getSourceScore(task);
  
  // Staleness
  score += getStalenessScore(task.updatedAt);
  
  // Streak risk (routines only)
  if (task.isRecurring) {
    score += getStreakRiskScore(task);
  }
  
  // Defer count
  score += getDeferScore(task.deferredCount);
  
  // Energy match (only if user has set energy)
  if (userState.currentEnergy) {
    score += getEnergyMatchScore(task.energyType, userState.currentEnergy);
  }
  
  return score;
}

function getPriorityTier(score: number): PriorityTier {
  if (score >= 60) return 'critical';
  if (score >= 40) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}
```

### Example Calculations

**Task: "File taxes"**
```
Importance: must_do (+25)
Deadline: April 15, Lead time: 14 days
Effective deadline: April 1 (6 days away = this week)
Time pressure: +15
Source: self (+0)
Staleness: recent (+0)
Defer count: 0 (+0)
─────────────────────────
Total: 40 → High priority
```

**Task: "Call insurance" (partner-created, stale)**
```
Importance: null (+10, assume moderate)
Deadline: none (+0)
Source: partner (+20)
Staleness: 5 days (+0... wait, <7 days)
Actually: Let's say 10 days → (+8)
Defer count: 2 (+5)
─────────────────────────
Total: 43 → High priority
```

**Task: "Research vacation spots"**
```
Importance: would_like_to (+0)
Deadline: none (+0)
Source: self (+0)
Staleness: 3 days (+0)
─────────────────────────
Total: 0 → Low priority
```

---

## 5. Notification Model Extensions

### Notification Types

```typescript
type NotificationType = 
  | 'start_nudge'      // Existing: calculated time-to-start
  | 'runway_nudge'     // NEW: time to begin runway for long tasks
  | 'reminder'         // Existing: user-set time-based
  | 'streak'           // Existing: gamification milestone
  | 'system'           // Existing: app updates, tips
  | 'partner';         // Future: partner-originated
```

### Runway Nudge vs Execution Nudge

For tasks with deadlines, two types of start nudges may apply:

| Nudge Type | Fires When | Applies To | Purpose |
|------------|------------|------------|---------|
| **Runway Nudge** | 1 day before effective deadline | Tasks with `leadTimeDays > 0` | "Time to start the process" |
| **Execution Nudge** | `deadline - duration - buffer` | All tasks with deadlines | "Time to do the final work" |

```typescript
interface StartNudgeConfig {
  // For runway nudge
  useEffectiveDeadline: boolean;  // true for tasks with lead time
  
  // For execution nudge
  useRawDeadline: boolean;        // true for all deadline tasks
}
```

---

## 6. Settings Model Extensions

### New Settings

```typescript
interface UserSettings {
  // === EXISTING ===
  startNudgeDefault: 'all' | 'routines_only' | 'tasks_only' | 'none';
  startNudgeDefaultBufferMinutes: number;
  
  // === NEW ===
  // Quiet hours (suppress push notifications)
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;  // "22:00"
  quietHoursEnd: string | null;    // "07:00"
  
  // Nudge cooldown (prevent spam for same task)
  nudgeCooldownMinutes: number;    // Default: 15
}
```

---

## 7. Lead Time Defaults

| Task Type | Default Lead Time | Rationale |
|-----------|-------------------|-----------|
| Regular tasks | 0 days | Assume can complete immediately unless specified |
| Recurring tasks (routines) | 0 days | Have fixed target times; use steps for complexity |
| Tasks with steps | 0 days | Steps handle breakdown; lead time is for external dependencies |

### When to Use Lead Time

Lead time is for tasks where calendar time exceeds active work time due to:
- External dependencies (waiting for others)
- Multi-session work (can't do all at once)
- Scheduling constraints (need to book time)
- Sequential steps with gaps (e.g., paint → dry → second coat)

---

## 8. Migration Notes

### Schema Version Bump

This adds fields to Task and UserState. Migration should:

1. Add new fields with null defaults
2. Existing tasks get `importance: null`, `energyType: null`, `leadTimeDays: null`
3. UserState gets `currentEnergy: null`, `currentEnergySetAt: null`
4. No data transformation needed (all new fields are optional)

### Backward Compatibility

- All new fields are nullable
- Priority calculation handles nulls gracefully
- Existing functionality unchanged until user sets new fields

---

## 9. Related Documents

| Document | Purpose |
|----------|---------|
| `NUDGE_ORCHESTRATOR_APPROACHES.md` | Architectural options for nudge coordination |
| `NUDGE_SYSTEM_MVP_SPEC.md` | MVP scope and behavior specification |
| `NUDGE_SYSTEM_IMPLEMENTATION_PLAN.md` | Phased implementation approach |
| `NUDGE_SYSTEM_CLAUDE_CODE_PROMPTS.md` | Implementation prompts |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial draft |
