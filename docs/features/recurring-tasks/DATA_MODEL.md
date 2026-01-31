# Recurring Tasks - Data Model

> **Schema Version:** 9  
> **Last Updated:** January 18, 2026

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Type Definitions](#type-definitions)
3. [Field Specifications](#field-specifications)
4. [Instance Snapshot Approach](#instance-snapshot-approach)
5. [Storage Considerations](#storage-considerations)
6. [Migration from v8 to v9](#migration-from-v8-to-v9)

---

## Schema Overview

### Core Principle: Instance Snapshots

Each recurring task instance stores a **snapshot** of the template at the time of creation. This ensures:
- Historical accuracy when template changes
- No orphaned references when steps deleted
- Clean separation between template and history

### Data Flow

```
Template (task.steps)
    ↓ (when instance created)
Instance (routineSteps) ← Deep clone with new IDs
    ↓ (when user completes)
Completion tracking (step.completed = true)
    ↓ (when all done)
Instance metadata (completed, completedAt, streak update)
```

---

## Type Definitions

### RecurrenceRule

```typescript
interface RecurrenceRule {
  // Pattern Configuration
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;                    // Every N (1=every, 2=every other, etc.)
  
  // Frequency-Specific Fields
  daysOfWeek: number[] | null;         // [0-6] where 0=Sun, 6=Sat
  weekOfMonth: number | null;          // 1-5 for "first Mon", "third Thu"
  dayOfMonth: number | null;           // 1-31 for monthly on specific date
  
  // Scheduling
  time: string | null;                 // "08:00" in 24-hour format
  
  // End Conditions
  endDate: string | null;              // ISO date, routine stops after
  endAfter: number | null;             // Stop after N occurrences
  
  // Behavior
  rolloverIfMissed: boolean;           // Keep visible vs auto-skip
  
  // State
  pausedAt: number | null;             // Unix timestamp when paused
  pausedUntil: string | null;          // ISO date to auto-resume
}
```

### RecurringInstance

```typescript
interface RecurringInstance {
  date: string;                        // "2025-01-17" ISO format
  routineSteps: Step[];                // Snapshot of template
  additionalSteps: Step[];             // Instance-specific additions
  completed: boolean;                  // Overall completion
  completedAt: number | null;          // Unix timestamp
  skipped: boolean;                    // Explicitly skipped
  skippedAt: number | null;            // Unix timestamp
  notes: string | null;                // Per-instance notes
  overdueDays: number | null;          // If rollover enabled
}
```

### Task Interface Updates

```typescript
interface Task {
  // ... existing fields ...
  
  isRecurring: boolean;
  recurrence: RecurrenceRule | null;
  recurringStreak: number;
  recurringBestStreak: number;
  recurringInstances: RecurringInstance[];
  recurringTotalCompletions: number;
  recurringLastCompleted: string | null;
  recurringNextDue: string | null;
}
```

See full specifications in document sections below.

---

## Complete Type Reference

Full type definitions with all fields, validation rules, and examples included in original document above.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01-18 | Initial data model documentation |
