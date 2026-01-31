# Nudge System — MVP Specification

> **Status:** Draft  
> **Created:** January 2026  
> **Purpose:** Define MVP scope, behavior, and rules for intelligent nudge system

---

## Overview

The nudge system helps users know what to work on and when to start. It combines:

1. **User-set importance** — Stakes/consequences ("this matters")
2. **System-calculated priority** — What to work on now
3. **Time-aware nudges** — When to start (runway + execution)
4. **Energy-aware filtering** — Match tasks to current state

### Core Principle

> **Importance is the user's judgment. Priority is the system's recommendation.**

---

## MVP Scope

### In Scope

- [ ] Importance field (user-set, optional)
- [ ] Energy type field (user-set, optional)
- [ ] Lead time field (user-set, optional, default 0)
- [ ] Priority score calculation
- [ ] Priority tier assignment (critical/high/medium/low)
- [ ] Priority Queue view in Notifications Hub
- [ ] Score breakdown visibility (on user request)
- [ ] Runway nudge for tasks with lead time
- [ ] Execution nudge for tasks with deadlines
- [ ] B+C hybrid orchestrator (dedup + priority queue)
- [ ] Quiet hours setting
- [ ] Nudge cooldown (per task)
- [ ] Energy input mechanism (user sets current energy)
- [ ] Energy-aware task filtering

### Out of Scope (Future)

- AI inference of importance/energy type
- Partner importance setting
- Coalescing orchestrator
- AI-powered orchestrator
- Pattern learning
- Ultradian rhythm integration

---

## 1. Importance (User-Set)

### Definition

User's assessment of stakes/consequences if task is not completed.

### Levels

| Level | Code | Meaning |
|-------|------|---------|
| Must Do | `must_do` | Real consequences if not done |
| Should Do | `should_do` | Meaningful progress toward goals |
| Could Do | `could_do` | Valuable but deferrable |
| Would Like To | `would_like_to` | Aspirational, no pressure |
| Not Set | `null` | System assumes moderate |

### Behavior

- Optional field, defaults to `null`
- User can set/change at any time
- Contributes to priority score calculation
- Displayed in task detail and priority queue

---

## 2. Energy Type (User-Set)

### Definition

User's assessment of how a task feels emotionally / motivationally.

### Types

| Type | Code | Meaning |
|------|------|---------|
| Energizing | `energizing` | Look forward to it, builds momentum |
| Neutral | `neutral` | Neither here nor there |
| Draining | `draining` | Takes effort to start, depletes energy |
| Not Set | `null` | No energy filtering applied |

### Behavior

- Optional field, defaults to `null`
- Used for energy-aware filtering when user sets current energy
- Does not directly affect priority score (affects filtering instead)

---

## 3. Lead Time (User-Set)

### Definition

Calendar runway needed to complete a task, beyond active work time.

### Examples

| Task | Duration | Lead Time | Why |
|------|----------|-----------|-----|
| File taxes | 3 hours | 14 days | Gather docs, wait for forms |
| Call insurance | 10 min | 0 days | Immediate |
| Plan birthday party | 2 hours | 21 days | Coordinate guests, book venue |

### Behavior

- Optional field, defaults to `null` (treated as 0)
- Used to calculate effective deadline: `deadline - leadTimeDays`
- Priority calculation uses effective deadline, not raw deadline
- Routines always have lead time of 0

### Effective Deadline

```
effectiveDeadline = deadlineDate - leadTimeDays

Example:
  Deadline: April 15
  Lead time: 14 days
  Effective deadline: April 1
```

---

## 4. Priority Score Calculation

### Formula

Priority score is sum of component scores:

```
priorityScore = 
  importanceScore +
  timePressureScore +
  sourceScore +
  stalenessScore +
  streakRiskScore +
  deferScore +
  energyMatchScore
```

### Component Scores

#### Importance Score

| Condition | Points |
|-----------|--------|
| `importance === 'must_do'` | +25 |
| `importance === 'should_do'` | +15 |
| `importance === 'could_do'` | +5 |
| `importance === 'would_like_to'` | +0 |
| `importance === null` | +10 |

#### Time Pressure Score (Uses Effective Deadline)

| Condition | Points |
|-----------|--------|
| Effective deadline has passed | +40 |
| Effective deadline is today or tomorrow | +35 |
| Effective deadline is within 7 days | +15 |
| Effective deadline is within 30 days | +5 |
| No deadline or >30 days | +0 |

#### Source Score

| Condition | Points |
|-----------|--------|
| `source === 'partner'` or partner-flagged | +20 |
| `source === 'work'` or `source === 'external'` | +15 |
| `source === 'self'` or other | +0 |

#### Staleness Score

| Condition | Points |
|-----------|--------|
| `daysSinceUpdate > 14` | +15 |
| `daysSinceUpdate > 7` | +8 |
| `daysSinceUpdate <= 7` | +0 |

#### Streak Risk Score (Routines Only)

| Condition | Points |
|-----------|--------|
| `isRecurring && streakCount > 7` | +12 |
| `isRecurring && streakCount >= 3` | +6 |
| Not recurring or streak < 3 | +0 |

#### Defer Score

| Condition | Points |
|-----------|--------|
| `deferredCount >= 3` | +10 |
| `deferredCount >= 1` | +5 |
| `deferredCount === 0` | +0 |

#### Energy Match Score (Contextual)

Only applies when user has set `currentEnergy`:

| Condition | Points |
|-----------|--------|
| Task energy matches user energy optimally | +8 |
| Neutral match | +0 |
| Task energy mismatches user energy | -5 |

**Energy Matching Logic:**

| User Energy | Optimal Task Energy | Reasoning |
|-------------|---------------------|-----------|
| High | Draining, Deep | Best use of peak state |
| Medium | Any | Flexible |
| Low | Energizing, Quick | Build momentum, avoid depletion |

---

## 5. Priority Tiers

### Thresholds

| Score | Tier | Meaning |
|-------|------|---------|
| 60+ | Critical | Act now |
| 40-59 | High | Act soon |
| 20-39 | Medium | On radar |
| 0-19 | Low | When you get to it |

### Display

- Tier shown by default (Critical/High/Medium/Low)
- Score breakdown available on user request (tap info icon)
- Breakdown shows each component's contribution

---

## 6. Priority Queue

### Definition

A view showing tasks ranked by system-calculated priority, grouped by tier.

### Structure

```
Priority Queue
├── Critical (tasks with score 60+)
├── High (tasks with score 40-59)
├── Medium (tasks with score 20-39)
└── Low (tasks with score 0-19)
```

### Behavior

- Located in Notifications Hub
- Shows all active tasks (not completed, not archived)
- Sorted by priority score within each tier
- Expandable/collapsible tiers
- Tap task to view detail, including score breakdown

### Score Breakdown

Available on user request (tap info icon):

- Shows each scoring component
- Shows point contribution
- Shows total and resulting tier
- Shows when priority will change (e.g., "will become Critical in 3 days")

---

## 7. Start Nudges

### Two Types

For tasks with deadlines, two types of start nudges may apply:

#### Runway Nudge

- **Purpose:** Alert user to begin the "runway" for long tasks
- **Fires when:** 1 day before effective deadline
- **Applies to:** Tasks with `leadTimeDays > 0`
- **Message framing:** "Time to start working on [task]—you'll need about [N] days/weeks"

#### Execution Nudge

- **Purpose:** Alert user to begin final active work
- **Fires when:** `deadline - duration - buffer`
- **Applies to:** All tasks with deadlines
- **Message framing:** "Start now to finish [task] by [time]"

### Calculation

```
Runway Nudge:
  nudgeTime = effectiveDeadline - 1 day
  
Execution Nudge:
  buffer = max(5 min, duration * 0.15)
  nudgeTime = deadline - duration - buffer
```

### Example

```
Task: File taxes
Deadline: April 15, 5:00 PM
Lead time: 14 days
Duration: 3 hours

Runway Nudge:
  Effective deadline: April 1
  Fires: March 31
  Message: "Time to start: File taxes. You'll need about 2 weeks."

Execution Nudge:
  Buffer: 27 min (15% of 180 min)
  Fires: April 15, 1:33 PM
  Message: "Start now: File taxes. 3 hours needed before 5:00 PM."
```

---

## 8. Orchestrator (B+C Hybrid)

### Architecture

```
┌─────────────────────────────────────────┐
│         DEDUPLICATION LAYER             │
│  Cooldown: 15 min per task              │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         PRIORITY QUEUE                  │
│  Fire highest priority nudge            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         QUIET HOURS CHECK               │
│  Downgrade push → badge if quiet        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         CHANNEL ROUTER                  │
│  Push / MiniBar / Badge                 │
└─────────────────────────────────────────┘
```

### Deduplication Rules

```typescript
const COOLDOWN_MINUTES = 15;

function shouldFireNudge(taskId: string, nudgeType: string): boolean {
  const lastNudge = getLastNudgeForTask(taskId);
  if (!lastNudge) return true;
  
  const minutesSince = (now - lastNudge.firedAt) / 60000;
  return minutesSince > COOLDOWN_MINUTES;
}
```

### Priority Ordering

When multiple nudges are pending, fire highest priority first:

```typescript
const NUDGE_TYPE_PRIORITY = {
  'deadline_critical': 100,    // Overdue or due today
  'deadline_approaching': 80,  // Due soon
  'runway_nudge': 75,
  'execution_nudge': 70,
  'manual_reminder': 60,
  'routine_streak': 40,
  'stale_task': 30,
};
```

### Quiet Hours

- User configures start/end times in settings
- During quiet hours, push notifications downgraded to badges
- Critical priority (60+) still fires as push

---

## 9. Energy Input

### User Sets Current Energy

Two mechanisms (implementation to examine current UI for integration approach):

#### Mechanism 1: Quick Toggle

- Always accessible location (e.g., navbar, settings)
- Quick selection: High / Medium / Low
- Shows when last set (for staleness awareness)

#### Mechanism 2: AI Palette Action

- "I'm feeling..." quick action in existing palette
- Opens prompt to set energy level
- AI responds with appropriate task suggestions

### Energy-Aware Filtering

When user has set `currentEnergy`, task recommendations consider energy match:

| User Energy | Prioritize | De-prioritize |
|-------------|------------|---------------|
| High | Deep, draining tasks | — |
| Medium | Balanced | — |
| Low | Quick, energizing tasks | Deep, draining tasks |

**Critical override:** Tasks with priority tier = Critical always shown regardless of energy match.

---

## 10. Settings

### New Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `quietHoursEnabled` | boolean | false | Enable quiet hours |
| `quietHoursStart` | string | "22:00" | Quiet hours start time |
| `quietHoursEnd` | string | "07:00" | Quiet hours end time |
| `nudgeCooldownMinutes` | number | 15 | Min time between nudges for same task |

---

## 11. Validation Criteria

### Priority Calculation

- [ ] Score correctly computed from all components
- [ ] Tier correctly derived from score
- [ ] Effective deadline correctly calculated with lead time
- [ ] Energy match score only applied when user energy is set

### Priority Queue

- [ ] Tasks grouped by tier correctly
- [ ] Tasks sorted by score within tier
- [ ] Score breakdown accessible on request
- [ ] Completed/archived tasks excluded

### Start Nudges

- [ ] Runway nudge fires for tasks with lead time > 0
- [ ] Execution nudge fires for all tasks with deadlines
- [ ] Both nudges fire at correct times
- [ ] Message framing appropriate for nudge type

### Orchestrator

- [ ] Deduplication prevents spam (15 min cooldown)
- [ ] Higher priority nudges fire first
- [ ] Quiet hours downgrades push to badge
- [ ] Critical nudges still push during quiet hours

### Energy

- [ ] User can set current energy
- [ ] Energy-aware filtering works correctly
- [ ] Critical tasks shown regardless of energy

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `NUDGE_SYSTEM_DATA_MODEL.md` | Data structures |
| `NUDGE_ORCHESTRATOR_APPROACHES.md` | Architectural options |
| `NUDGE_SYSTEM_IMPLEMENTATION_PLAN.md` | Phased implementation |
| `NUDGE_SYSTEM_CLAUDE_CODE_PROMPTS.md` | Implementation prompts |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial MVP specification |
