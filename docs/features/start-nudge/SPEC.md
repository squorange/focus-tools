# Start Nudge - Feature Specification

> **Version:** 1.0  
> **Last Updated:** January 2026  
> **Schema Version:** 10 (from v9)  
> **Dependencies:** Recurring Tasks feature (Schema v9)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Feature Overview](#feature-overview)
4. [User Settings](#user-settings)
5. [Start Nudge Calculation](#start-nudge-calculation)
6. [Notifications Hub](#notifications-hub)
7. [UI Specifications](#ui-specifications)
8. [Data Model](#data-model)
9. [Edge Cases](#edge-cases)
10. [Success Metrics](#success-metrics)

---

## Executive Summary

**Start Nudge** is an executive functioning aid that helps users with time blindness by calculating when to begin tasks to finish on time. It addresses three core ADHD challenges:

| Challenge | How Start Nudge Helps |
|-----------|----------------------|
| **Time blindness** | Externalizes time awareness via proactive alerts |
| **Optimism bias** | Builds in buffer time automatically |
| **Transition friction** | Prompts action at calculated start time |

**Mental model:** Like a maps app "leave by" time—you set when you need to be done, the system tells you when to start.

---

## Problem Statement

ADHD users frequently experience:

1. **"I have plenty of time"** → Suddenly late because time passed unnoticed
2. **"It'll only take 20 minutes"** → Actually takes 45 minutes, every time
3. **"I'll start in a minute"** → Never transitions to the task

Current reminders say "do this at 2pm" but don't account for how long things take. Users need **duration-aware prompting**.

---

## Feature Overview

### Core Concept

```
Start Nudge Time = Anchor Time - Duration - Buffer

Where:
- Anchor Time = target, deadline, or recurrence time
- Duration = estimated time to complete (from steps or AI)
- Buffer = padding for optimism bias (default: 15% or 5 min minimum)
```

### Example

```
Task: "Prep Kai for school"
Anchor: 8:00 AM (recurring daily)
Duration: 45 minutes (sum of step estimates)
Buffer: 7 minutes (15% of 45 min)

Start Nudge fires at: 7:08 AM
Notification: "Time to start: Prep Kai for school"
             "Due 8:00 AM · ~45 min"
```

---

## User Settings

### Global Default Control

Users can set their default Start Nudge behavior:

| Setting | Description |
|---------|-------------|
| **All tasks** | Start Nudge enabled for all tasks by default |
| **Routines only** | Only recurring tasks get Start Nudges |
| **One-off tasks only** | Only non-recurring tasks get Start Nudges |
| **None** | Start Nudges disabled; opt-in per task |

### Per-Task Override

Individual tasks can override the global setting:

| Override Value | Behavior |
|----------------|----------|
| **On** | Always enabled for this task |
| **Off** | Always disabled for this task |
| **Use default** | Follows global setting (shows current state) |

### Settings Location

```
Settings → Notifications → Start Nudges
├── Enable by default          [Routines only ▼]
│                               ├── All tasks
│                               ├── Routines only
│                               ├── One-off tasks only
│                               └── None (opt-in per task)
│   
└── Default buffer             [5 min ▼]
                                ├── 5 min
                                ├── 10 min
                                ├── 15 min
                                └── 15% of duration
```

---

## Start Nudge Calculation

### Anchor Time Resolution

```typescript
function getAnchorTime(task: Task): Date | null {
  if (task.isRecurring && task.recurrence?.time) {
    // Recurring: use recurrence target time
    return getNextOccurrenceWithTime(task.recurrence);
  }
  
  // Non-recurring: prefer target over deadline
  if (task.targetDate) {
    return parseDate(task.targetDate);
  }
  
  if (task.deadlineDate) {
    return parseDate(task.deadlineDate);
  }
  
  return null; // No anchor available
}
```

### Duration Resolution

```typescript
function getDuration(task: Task): number {
  // Priority 1: Task-level override
  if (task.estimatedDurationMinutes !== null) {
    return task.estimatedDurationMinutes;
  }
  
  // Priority 2: Sum of step estimates
  const stepDuration = sumStepDurations(task.steps);
  if (stepDuration > 0) {
    return stepDuration;
  }
  
  // Priority 3: AI estimate (auto-generated when Start Nudge enabled)
  return generateAIEstimate(task);
}

function sumStepDurations(steps: Step[]): number {
  return steps.reduce((sum, step) => {
    const stepTime = step.estimatedMinutes ?? 0;
    const substepTime = step.substeps?.reduce(
      (s, sub) => s + (sub.estimatedMinutes ?? 0), 0
    ) ?? 0;
    return sum + stepTime + substepTime;
  }, 0);
}
```

### Buffer Calculation

```typescript
function calculateBuffer(
  durationMinutes: number,
  userBuffer: number | 'percentage'
): number {
  if (typeof userBuffer === 'number') {
    return userBuffer;
  }
  
  // Percentage mode: 15% with 5 min minimum
  return Math.max(5, Math.round(durationMinutes * 0.15));
}
```

### Complete Calculation

```typescript
function calculateStartNudgeTime(
  task: Task,
  settings: UserSettings
): Date | null {
  const anchor = getAnchorTime(task);
  if (!anchor) return null;
  
  const duration = getDuration(task);
  if (!duration) return null;
  
  const buffer = calculateBuffer(duration, settings.startNudgeDefaultBuffer);
  
  const startTime = new Date(anchor);
  startTime.setMinutes(startTime.getMinutes() - duration - buffer);
  
  return startTime;
}
```

---

## Notifications Hub

### Purpose

Central location for viewing all notifications:
- Start Nudges (system-calculated)
- Reminders (user-set)
- Streak milestones
- System messages

### Menu Placement

```
Focus
Tasks          (1)
Projects
─────────────────
Notifications  (3)  ← NEW (badge = unacknowledged count)
─────────────────
Export
Import
```

### Badge Count Logic

```typescript
function getNotificationBadgeCount(notifications: Notification[]): number {
  return notifications.filter(n => 
    n.firedAt !== null &&           // Has fired
    n.acknowledgedAt === null       // Not yet seen
  ).length;
}
```

**Rationale:** Badge answers "what did I miss?" not "what's coming?" Upcoming notifications are visible in the hub but don't contribute to badge count.

### Hub Layout

```
┌─────────────────────────────────────┐
│ Notifications                    ⚙️ │  ← settings gear
├─────────────────────────────────────┤
│ Upcoming                            │
│ ┌─────────────────────────────────┐ │
│ │ [bell-ring] Prep Kai            │ │
│ │    Tomorrow 7:08 AM             │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Today                               │
│ ┌─────────────────────────────────┐ │
│ │ [bell-ring] Time to start:      │ │  ← unread indicator •
│ │    Prep Kai for school          │ │
│ │    Due 8:00 AM · ~45 min        │ │
│ │    7:08 AM                   •  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [clock] Reminder: Call dentist  │ │
│ │    2:00 PM                      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Earlier                             │
│ ┌─────────────────────────────────┐ │
│ │ [flame] Streak: 7 days!         │ │
│ │    Wash dishes routine          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Notification Types

| Type | Icon (Lucide) | Color | Description |
|------|---------------|-------|-------------|
| Start Nudge | `bell-ring` | Violet (brand) | System-calculated time-to-start |
| Reminder | `clock` | Neutral | User-set time-based |
| Streak | `flame` | Orange/gold | Gamification milestone |
| System | `info` | Gray | App updates, tips |
| Partner | `user` | Blue | Future: partner-originated |

### Tap Action

Tapping a notification navigates to the relevant task:

```typescript
function handleNotificationTap(notification: Notification) {
  // Mark as acknowledged
  markAcknowledged(notification.id);
  
  // Navigate to task
  if (notification.taskId) {
    if (notification.instanceId) {
      // Recurring: go to executing instance
      navigate(`/tasks/${notification.taskId}/instances/${notification.instanceId}`);
    } else {
      navigate(`/tasks/${notification.taskId}`);
    }
  }
}
```

---

## UI Specifications

### Task Detail: Start Nudge Toggle

Location: Below existing Reminder field

**States:**

1. **Toggle OFF**
```
Start Nudge                          [Off ▼]
```

2. **Toggle ON, calculated successfully**
```
Start Nudge                          [On ▼]
└── "Fires at 7:08 AM"
    "Est. 45 min + 7 min buffer before 8:00 AM"
    [Adjust estimate]
```

3. **Toggle ON, missing anchor (no target/deadline/recurrence)**
```
Start Nudge                          [On ▼]
└── [alert-triangle] "Add a target time, deadline, or 
    recurrence pattern to enable Start Nudge"
```

4. **Toggle ON, generating estimate**
```
Start Nudge                          [On ▼]
└── "Calculating estimate..."
```

5. **Override indicator (when different from global)**
```
Start Nudge                          [Off ▼]
└── "Overriding default (On)"
```

### Dropdown Options

```
[On ▼]
├── On
├── Off
└── Use default (currently: Routines only)
```

### Duration Display

When duration is AI-generated, indicate source:

```
Duration                        ~45 min (AI)
└── [Edit]
```

User edits remove the "(AI)" tag.

### Notification Content

**Start Nudge (normal)**
| Field | Content |
|-------|---------|
| Title | "Time to start: [Task name]" |
| Body | "Due [anchor time] · ~[duration] min" |

**Start Nudge (running late)**
| Field | Content |
|-------|---------|
| Title | "Running behind: [Task name]" |
| Body | "Due [anchor time] · Started [X] min late" |

---

## Data Model

### Schema Version 10

```typescript
// User Settings Extension
interface UserSettings {
  // ... existing settings ...
  
  // Start Nudge settings
  startNudgeDefault: 'all' | 'routines_only' | 'tasks_only' | 'none';
  startNudgeDefaultBufferMinutes: number;  // default: 5
}

// Task Extension
interface Task {
  // ... existing fields ...
  
  // Start Nudge
  startNudgeOverride: 'on' | 'off' | null;  // null = use global default
  estimatedDurationMinutes: number | null;   // task-level override
  estimatedDurationSource: 'manual' | 'ai' | 'steps' | null;
}

// New: Notification
interface Notification {
  id: string;
  type: 'start_nudge' | 'reminder' | 'streak' | 'system' | 'partner';
  
  // Associations
  taskId: string | null;
  instanceId: string | null;  // for recurring task instances
  
  // Content
  title: string;
  body: string;
  icon: 'bell-ring' | 'clock' | 'flame' | 'info' | 'user';
  
  // Lifecycle
  scheduledAt: number;       // Unix timestamp
  firedAt: number | null;    // When notification was delivered
  acknowledgedAt: number | null;  // When user saw/tapped it
  
  // Navigation
  deepLink: string;
}

// AppState Extension
interface AppState {
  // ... existing fields ...
  
  notifications: Notification[];
  settings: UserSettings;
}
```

### Migration v9 → v10

```typescript
function migrateV9ToV10(state: AppState): AppState {
  if (state.schemaVersion < 10) {
    // Add Start Nudge fields to tasks
    state.tasks = state.tasks.map(task => ({
      ...task,
      startNudgeOverride: null,
      estimatedDurationMinutes: null,
      estimatedDurationSource: null,
    }));
    
    // Initialize settings
    state.settings = {
      ...state.settings,
      startNudgeDefault: 'routines_only',
      startNudgeDefaultBufferMinutes: 5,
    };
    
    // Initialize notifications array
    state.notifications = state.notifications ?? [];
    
    state.schemaVersion = 10;
  }
  
  return state;
}
```

---

## Edge Cases

### No Anchor Time

**Scenario:** User enables Start Nudge but task has no target, deadline, or recurrence pattern.

**Behavior:** 
- Toggle stays ON (preserves user intent)
- Show inline warning with guidance
- No notification scheduled until anchor added

```
Start Nudge                          [On ▼]
└── [alert-triangle] "Add a target time, deadline, or 
    recurrence pattern to enable Start Nudge"
```

### Start Time in the Past

**Scenario:** Calculated start time is before current time.

**Behavior:**
- Fire notification immediately
- Use "running late" framing

```typescript
if (startNudgeTime < now) {
  fireImmediately({
    title: "Running behind: " + task.title,
    body: `Due ${formatTime(anchor)} · Started ${minutesLate} min late`
  });
}
```

### Duration Unavailable

**Scenario:** No step estimates, no task-level duration, user enables Start Nudge.

**Behavior:**
- Auto-generate AI estimate
- Show loading state briefly
- Display "(AI)" indicator on duration

### Conflicting Reminder and Start Nudge

**Scenario:** User sets manual reminder at 7:00 AM, Start Nudge calculates 7:15 AM.

**Behavior:**
- Both fire (they serve different purposes)
- Reminder: user's personal nudge
- Start Nudge: calculated time-to-begin

### Recurring Tasks

**Scenario:** Daily routine at 8:00 PM.

**Behavior:**
- Anchor = recurrence time (8:00 PM)
- New Start Nudge scheduled for each occurrence
- Instance completion clears that day's notification

### Template vs Instance Duration

**Scenario:** Recurring task with step estimates on template.

**Behavior:**
- Use template step durations for calculation
- Instance-specific additional steps not included (they're added after start)

---

## Success Metrics

### Quantitative

| Metric | Target | Measurement |
|--------|--------|-------------|
| Start Nudge adoption | >50% of tasks with anchors | Tasks with Start Nudge enabled / Tasks with target/deadline/recurrence |
| On-time starts | >70% | Tasks started within 5 min of nudge |
| Duration accuracy | <20% variance | Actual duration vs estimated |
| Feature retention | >80% after 2 weeks | Users who keep Start Nudge enabled |

### Qualitative

- User feedback on whether nudges feel helpful vs. nagging
- Perceived accuracy of time estimates
- Impact on morning/evening routine stress

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial specification |
