# Nudge Orchestrator Approaches

> **Status:** Reference Document  
> **Created:** January 2026  
> **Purpose:** Catalog architectural approaches for nudge coordination; inform implementation decisions

---

## Overview

This document catalogs different architectural approaches to coordinating nudges/notifications in Focus Tools. The core challenge:

> Multiple nudge sources (reminders, start nudges, health alerts, energy suggestions) can fire independently, potentially overwhelming the user or creating redundant notifications.

An orchestrator coordinates these sources to deliver the right nudge, at the right time, through the right channel.

---

## Approach A: No Orchestrator (Independent Systems)

### Description

Each nudge system operates independently. No coordination layer.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Reminders   │  │ Start Nudge │  │ Health Pills│
│ (user-set)  │  │ (calculated)│  │ (visual)    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ▼                ▼                ▼
    [Push]          [Push]           [Badge]
```

### Behavior

- Each system fires when its conditions are met
- No awareness of other systems
- User receives all notifications independently

### Pros

- Simplest to implement
- Each system independently testable
- No coordination bugs
- Easy to reason about individual systems

### Cons

- Notification fatigue risk
- User may get multiple nudges for same task
- No intelligence about what matters most
- Poor user experience at scale

### When to Use

- Very early prototyping
- Single nudge source only
- Testing individual nudge mechanisms

---

## Approach B: Deduplication Only

### Description

Thin coordination layer that prevents duplicate nudges for the same task within a time window.

```
┌─────────────────────────────────────────┐
│           DEDUPLICATION LAYER           │
│  "Don't fire if same task nudged        │
│   within last N minutes"                │
└─────────────────────────────────────────┘
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ Reminders │ │ Start     │ │ Stale     │
│           │ │ Nudge     │ │ Alert     │
└───────────┘ └───────────┘ └───────────┘
```

### Behavior

```typescript
const COOLDOWN_MINUTES = 15;

function shouldFireNudge(taskId: string): boolean {
  const lastNudge = getLastNudgeForTask(taskId);
  if (!lastNudge) return true;
  
  const minutesSince = (now - lastNudge.firedAt) / 60000;
  return minutesSince > COOLDOWN_MINUTES;
}
```

### Pros

- Simple to implement
- Prevents worst-case notification spam
- Each system still independently testable
- Low coordination overhead

### Cons

- Doesn't prioritize (all nudges treated equally)
- No energy/context awareness
- Arbitrary cooldown may suppress important nudges
- First-to-fire wins, regardless of importance

### When to Use

- MVP implementation
- When notification sources are few
- As foundation for more sophisticated approaches

---

## Approach C: Priority Queue

### Description

All nudges go into a priority queue. System fires highest-priority item, suppresses or defers others.

```
                    ┌─────────────────────┐
                    │   PRIORITY QUEUE    │
                    │                     │
                    │ 1. Deadline today   │
                    │ 2. Start nudge      │
                    │ 3. Stale task       │
                    │ 4. Routine window   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   FIRE TOP ITEM     │
                    │   (suppress rest)   │
                    └─────────────────────┘
```

### Behavior

```typescript
const NUDGE_PRIORITY = {
  'deadline_critical': 100,
  'deadline_approaching': 80,
  'runway_nudge': 75,
  'execution_nudge': 70,
  'manual_reminder': 60,
  'partner_flagged': 50,
  'routine_streak': 40,
  'stale_task': 30,
  'energy_suggestion': 20,
};

function processNudgeQueue(nudges: Nudge[]): Nudge | null {
  const sorted = nudges.sort((a, b) => 
    NUDGE_PRIORITY[b.type] - NUDGE_PRIORITY[a.type]
  );
  return sorted[0] ?? null;
}
```

### Pros

- Ensures most important thing surfaces
- Reduces notification noise significantly
- Clear mental model for developers
- Predictable behavior

### Cons

- Low-priority nudges may never fire
- Doesn't batch or group related items
- Still no energy/context awareness
- May feel arbitrary to users ("why didn't I get reminded?")

### When to Use

- When multiple nudge sources compete
- When reducing notification count is priority
- As step up from deduplication

---

## Approach D: Contextual Filtering

### Description

Filter and adjust nudges based on user's current context (energy, time, focus mode, quiet hours).

```
┌─────────────────────────────────────────┐
│           CONTEXT COLLECTOR             │
│  • Current energy level                 │
│  • Time available                       │
│  • In focus mode?                       │
│  • Quiet hours?                         │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           CONTEXTUAL FILTER             │
│  "Given context, which nudges make      │
│   sense right now?"                     │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           CHANNEL ROUTER                │
│  "How should this surface?"             │
│  Push vs. MiniBar vs. Badge             │
└─────────────────────────────────────────┘
```

### Behavior

```typescript
function filterNudges(
  nudges: Nudge[], 
  context: UserContext
): Nudge[] {
  let filtered = nudges;
  
  // Suppress all but critical during focus mode
  if (context.inFocusMode) {
    filtered = filtered.filter(n => n.priority >= 60);
  }
  
  // Downgrade push to badge during quiet hours
  if (context.inQuietHours) {
    filtered = filtered.map(n => ({
      ...n,
      channel: n.channel === 'push' ? 'badge' : n.channel
    }));
  }
  
  // Boost energy-matching tasks
  if (context.currentEnergy) {
    filtered = filtered.map(n => ({
      ...n,
      priority: adjustForEnergyMatch(n, context.currentEnergy)
    }));
  }
  
  return filtered;
}
```

### Pros

- Energy-aware recommendations
- Respects focus mode and quiet hours
- Flexible and extensible
- Better user experience

### Cons

- More complex state management
- Requires energy input from user
- Filter logic can get complicated
- Harder to debug/predict

### When to Use

- When energy matching is important
- When user has multiple work modes
- When quiet hours are needed

---

## Approach E: Coalescing Orchestrator

### Description

Group related nudges and present as unified messages, reducing notification count while preserving information.

```
Raw nudges:
• Reminder for "Morning routine" at 7:00
• Start nudge for "Morning routine" at 7:08
• Routine highlight for "Morning routine"
• Stale alert for "Call insurance"

                    │
                    ▼
┌─────────────────────────────────────────┐
│           COALESCING ENGINE             │
│  Group by task, merge messages          │
└─────────────────────────────────────────┘
                    │
                    ▼
Coalesced output:
• "Morning routine - time to start (reminder + routine window)"
• "Call insurance - needs attention (stale 5 days)"
```

### Behavior

```typescript
function coalesceNudges(nudges: Nudge[]): CoalescedNudge[] {
  const byTask = groupBy(nudges, 'taskId');
  
  return Object.entries(byTask).map(([taskId, taskNudges]) => {
    const sorted = sortBy(taskNudges, n => -n.priority);
    const primary = sorted[0];
    const secondary = sorted.slice(1).map(n => n.type);
    
    return {
      taskId,
      primaryType: primary.type,
      secondaryTypes: secondary,
      message: buildCoalescedMessage(primary, secondary),
      channel: primary.channel,
    };
  });
}

function buildCoalescedMessage(
  primary: Nudge, 
  secondary: string[]
): string {
  let msg = `${primary.task.title} - ${primary.message}`;
  if (secondary.length > 0) {
    msg += ` (also: ${secondary.join(', ')})`;
  }
  return msg;
}
```

### Pros

- Significantly reduces notification count
- User sees unified view per task
- Preserves context about why task is surfacing
- Cleaner user experience

### Cons

- Message construction is tricky
- May hide important secondary signals
- More complex to debug
- Requires careful UX design

### When to Use

- When notification count is a major concern
- When multiple signals often fire together
- When unified task view is preferred

---

## Approach F: AI-Powered Orchestrator

### Description

Use AI to decide what to surface based on holistic understanding of user, tasks, and context.

```
┌─────────────────────────────────────────┐
│           ALL SIGNALS                   │
│  • Deadlines, reminders, staleness      │
│  • Energy state, time available         │
│  • Importance, partner flags            │
│  • Historical patterns                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           AI REASONING                  │
│  "Given everything, what should user    │
│   focus on right now?"                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           SINGLE RECOMMENDATION         │
│  "The insurance call is 5 days old and  │
│   from Sarah. 10-min task. Do it now?"  │
└─────────────────────────────────────────┘
```

### Behavior

- All signals fed to AI model
- AI weighs factors dynamically
- Can explain reasoning if asked
- Learns from user behavior over time

### Pros

- Most intelligent approach
- Can handle complex tradeoffs
- Explains reasoning
- Adapts to user patterns

### Cons

- Requires AI call for every nudge decision (latency, cost)
- Hard to debug and predict
- May feel opaque to user
- Overkill for simple cases
- Dependent on AI availability

### When to Use

- Future enhancement
- When pattern learning is valuable
- When explanation of reasoning is important
- When simpler approaches prove insufficient

---

## Comparison Matrix

| Approach | Complexity | Intelligence | Notification Fatigue | Debuggability | MVP Fit |
|----------|------------|--------------|---------------------|---------------|---------|
| **A: None** | ⭐ | ⭐ | ❌ High risk | ⭐⭐⭐⭐⭐ | ⚠️ |
| **B: Dedup Only** | ⭐⭐ | ⭐⭐ | ✅ Reduced | ⭐⭐⭐⭐ | ✅ Good |
| **C: Priority Queue** | ⭐⭐ | ⭐⭐⭐ | ✅ Controlled | ⭐⭐⭐⭐ | ✅ Good |
| **D: Contextual Filter** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Smart | ⭐⭐⭐ | ⚠️ Target |
| **E: Coalescing** | ⭐⭐⭐ | ⭐⭐⭐ | ✅✅ Minimal | ⭐⭐⭐ | ✅ Nice-to-have |
| **F: AI-Powered** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅✅ Optimal | ⭐⭐ | ❌ Future |

---

## Recommended Implementation Path

### MVP: B + C Hybrid

Combine deduplication with priority queue for a simple but effective first version.

```
┌─────────────────────────────────────────┐
│         DEDUPLICATION LAYER             │
│  (15-min cooldown per task)             │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         PRIORITY QUEUE                  │
│  (Fire highest priority only)           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         QUIET HOURS CHECK               │
│  (Downgrade push → badge if quiet)      │
└─────────────────────────────────────────┘
```

### Phase 2: Add D (Contextual Filtering)

- Add energy state input
- Filter recommendations by energy match
- Suppress non-critical during focus mode

### Phase 3: Add E (Coalescing)

- Group nudges by task
- Build unified messages
- Reduce notification count further

### Future: Consider F (AI-Powered)

- Pattern learning from user behavior
- Explainable recommendations
- Dynamic weight adjustment

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01 | MVP = B+C Hybrid | Balance of simplicity and effectiveness |
| 2026-01 | Defer AI-powered (F) | Too complex for MVP; validate simpler approaches first |
| 2026-01 | Include quiet hours in MVP | Low implementation cost, high user value |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `NUDGE_SYSTEM_DATA_MODEL.md` | Data structures for nudge system |
| `NUDGE_SYSTEM_MVP_SPEC.md` | MVP scope and behavior |
| `NUDGE_SYSTEM_IMPLEMENTATION_PLAN.md` | Phased implementation |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial catalog |
