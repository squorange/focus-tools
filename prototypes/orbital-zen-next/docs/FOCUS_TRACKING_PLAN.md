# Focus & Time Tracking System - Implementation Plan

**Status**: Planning Complete, Ready for Implementation
**Last Updated**: 2025-11-09
**Target**: Phase 1 (MVP) → Phase 2 (Smart Features) → Phase 3+ (Analytics & Multi-device)

---

## Overview

Comprehensive focus and time tracking system with session management, break reminders, intelligent time display, and historical tracking.

**Core Principle**: Make focus sessions feel natural and non-intrusive while capturing accurate time data.

---

## Architecture

### Dual Model System

**1. FocusSession (Active State)**
- Represents current/active focus session
- Single instance in memory + IndexedDB
- Lives in React state at app level
- Gets converted to TimeEntry when session ends

**2. TimeEntry (Historical Record)**
- Persistent log of all completed sessions
- Stored as collection in IndexedDB
- Created when FocusSession ends (Stop/Complete/Stale)
- Used for time aggregation and analytics

**Relationship Flow**:
```
User clicks "Start Focus"
  → Create/Update FocusSession (active)
  → User pauses/resumes/stops
  → FocusSession → TimeEntry (on end)
  → Archive to history
```

---

## Data Models

### FocusSession (Current State)

```typescript
interface FocusSession {
  id: string;  // UUID for this session
  taskId: string;
  subtaskId?: string;
  startTime: Date;
  isActive: boolean;  // true = running, false = paused
  pausedAt?: Date;  // When currently paused (if isActive = false)
  totalTime: number;  // Accumulated active seconds

  // Break tracking
  currentBreakStartTime?: Date;  // Set when break starts
  totalBreakTime: number;  // Accumulated break seconds
  breaksTaken: number;

  // Pause tracking
  pauseCount: number;
  totalPauseTime: number;  // Accumulated pause seconds
  pauseHistory: Array<{
    pausedAt: Date;
    resumedAt?: Date;  // undefined = currently paused
  }>;

  // Break reminder state
  lastBreakReminderAt?: Date;
  breakReminderSnoozeCount: number;
  flowModeEnabled: boolean;  // User dismissed reminders

  // Stale detection
  lastActivityTime: Date;  // Updated on any user interaction

  device: 'desktop' | 'mobile' | 'unknown';
}
```

### TimeEntry (Historical Record)

```typescript
interface TimeEntry {
  id: string;  // UUID for this entry
  sessionId: string;  // Links to original FocusSession.id
  taskId: string;
  subtaskId?: string;

  // Time data
  startTime: Date;
  endTime: Date;
  duration: number;  // Active work seconds (excludes pauses & breaks)

  // Session metadata
  pauseCount: number;
  totalPauseTime: number;  // Seconds
  breaksTaken: number;
  totalBreakTime: number;  // Seconds

  // Completion info
  wasCompleted: boolean;  // true if ended with "Complete" button
  endReason: 'completed' | 'stopped' | 'stale' | 'manual';

  // Manual entry
  isManualEntry: boolean;
  sessionNotes?: string;

  // Device tracking
  device: 'desktop' | 'mobile' | 'unknown';

  // Detailed history (optional, for deep analysis)
  pauseTimestamps?: Array<{ pausedAt: Date; resumedAt: Date }>;
  breakTimestamps?: Array<{ startedAt: Date; endedAt: Date }>;

  // Metadata
  createdAt: Date;
}
```

### Task Time Aggregation

Tasks get computed fields (not stored, calculated on-demand):

```typescript
interface TaskTimeStats {
  totalActiveTime: number;  // Sum of all TimeEntry.duration
  totalBreakTime: number;   // Sum of all TimeEntry.totalBreakTime
  totalPauseTime: number;   // Sum of all TimeEntry.totalPauseTime
  sessionCount: number;     // Count of TimeEntries
  averageSessionLength: number;  // Mean duration
  completionRate: number;   // % of sessions that ended with "completed"
  lastWorkedOn?: Date;      // Most recent TimeEntry.endTime
}
```

**Parent-Subtask Relationship**:
```typescript
function getTotalTaskTime(taskId: string): number {
  // Automatically includes subtask time since all entries have taskId
  const entries = await db.timeEntries
    .where('taskId').equals(taskId)
    .toArray();

  return entries.reduce((sum, e) => sum + e.duration, 0);
}

function getDirectParentTime(taskId: string): number {
  // Time spent on parent without subtask focus
  const entries = await db.timeEntries
    .where('taskId').equals(taskId)
    .filter(e => !e.subtaskId)
    .toArray();

  return entries.reduce((sum, e) => sum + e.duration, 0);
}
```

---

## Session States & Transitions

```
┌─────────────────────────────────────────────────────────┐
│                     SESSION STATES                       │
└─────────────────────────────────────────────────────────┘

IDLE
  └─ No active session
  └─ UI: [Start Focus] button

     ↓ (Click "Start Focus")

ACTIVE
  └─ Timer running, accumulating time
  └─ UI: [⏸ Pause] [✓ Complete]
  └─ Updates every second
  └─ Break reminders fire at 25min intervals

     ↓ (Click "Pause")              ↓ (Click "Complete")

PAUSED                              COMPLETED
  └─ Timer stopped                    └─ Task marked done
  └─ Can resume multiple times        └─ Session → TimeEntry
  └─ UI: [▶ Resume] [■ Stop]         └─ Return to IDLE
  └─ No break reminders               └─ If subtask: show prompt

     ↓ (Click "Stop")

ENDED
  └─ Session → TimeEntry
  └─ Return to IDLE
```

### Break Flow

```
ACTIVE (25+ min elapsed)
  └─ Show break reminder (non-blocking alert)
  └─ Options: [Take 5 min break] [Snooze 10 min] [I'm in flow]

     ↓ (Take break)

ON_BREAK
  └─ Main timer PAUSED
  └─ Break timer running (5 min countdown)
  └─ UI: Shows "Break: 4:32 remaining"
  └─ Can end break early: [End Break]

     ↓ (Break ends or user ends early)

ACTIVE (resumed)
  └─ Main timer resumes
  └─ Break time saved to totalBreakTime
```

---

## UI Components & Behavior

### 1. Focus Button States

**Idle State** (no active session):
```
┌──────────────────┐
│   Start Focus    │  ← Primary button (bg-gray-900)
└──────────────────┘
```

**Active State** (timer running):
```
┌──────────────┐  ┌──────────────┐
│  ⏸ Pause    │  │  ✓ Complete  │
└──────────────┘  └──────────────┘
 ← Primary          ← Secondary (text-gray-600)
```

**Paused State** (timer paused):
```
┌──────────────┐  ┌──────────────┐
│  ▶ Resume   │  │  ■ Stop      │
└──────────────┘  └──────────────┘
 ← Primary          ← Secondary (text-gray-600)
```

**On Break**:
```
Break: 3:42 remaining

┌──────────────────┐
│   End Break      │
└──────────────────┘
```

### 2. Timer Display

**Location**: AIPanel header, below title

**Active/Paused**:
```
┌─────────────────────────────────┐
│  Task Title                   × │
│  ⏱ 23:47 · Focus Session       │  ← Exact time
└─────────────────────────────────┘
```

**On Break**:
```
┌─────────────────────────────────┐
│  Task Title                   × │
│  ☕ Break: 2:15 remaining       │
└─────────────────────────────────┘
```

**In Details View** (collapsed, showing total time):
```
Organization
  Energy: [High] [Med] [Low] [Rest]
  Total Focus: 3h 45m  ← Rounded display
```

### 3. Subtask Completion Prompt

When completing a subtask with "Complete" button:

```javascript
// Simple window.confirm for v1
const nextAction = window.confirm(
  "Subtask completed!\n\n" +
  "Continue to next subtask?\n" +
  "OK = Continue | Cancel = End Session"
);

if (nextAction) {
  // Auto-start focus on next incomplete subtask
  const nextSubtask = findNextIncompleteSubtask();
  if (nextSubtask) {
    startFocusSession(task.id, nextSubtask.id);
  } else {
    // All subtasks done
    endSession('completed');
  }
} else {
  endSession('completed');
}
```

**Future Enhancement**: Replace with modal showing:
```
✓ Subtask completed!

[ Continue to next subtask ]  ← Auto-starts focus
[   Take 5 min break      ]  ← Starts break timer
[     End Session         ]  ← Stops completely
```

---

## Timer Display Logic

### Format Rules

Based on duration, format time appropriately:

```typescript
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Active session (exact time)
  if (isActiveSession) {
    if (hours > 0) return `${hours}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
    return `${minutes}:${pad(seconds % 60)}`;
  }

  // Historical time (rounded)
  if (seconds < 300) {  // < 5 min
    return `${minutes}m ${seconds % 60}s`;
  }
  if (seconds < 1800) {  // 5-30 min
    return `${minutes}m`;
  }
  if (seconds < 7200) {  // 30min - 2hr
    const roundedMin = Math.round(minutes / 5) * 5;
    const h = Math.floor(roundedMin / 60);
    const m = roundedMin % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  if (seconds < 28800) {  // 2hr - 8hr
    const roundedMin = Math.round(minutes / 15) * 15;
    const h = Math.floor(roundedMin / 60);
    const m = roundedMin % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  // > 8hr
  const roundedHours = Math.round(hours);
  if (roundedHours >= 24) {
    const d = Math.floor(roundedHours / 24);
    const h = roundedHours % 24;
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  }
  return `${roundedHours}h`;
}
```

### Update Frequency

```typescript
// In active session: update every second
useEffect(() => {
  if (!focusSession?.isActive) return;

  const interval = setInterval(() => {
    updateTimer();
  }, 1000);

  return () => clearInterval(interval);
}, [focusSession]);

// Future optimization: use requestAnimationFrame + Page Visibility API
```

---

## Break Reminder System

### Configuration

```typescript
const BREAK_CONFIG = {
  intervalMinutes: 25,  // Remind after this many minutes
  breakDurationMinutes: 5,
  maxSnoozes: 2,
  snoozeDurationMinutes: 10,
};
```

### Reminder Logic

```typescript
function checkBreakReminder(session: FocusSession): void {
  // Don't remind if:
  if (
    !session.isActive ||  // Session paused
    session.flowModeEnabled ||  // User enabled flow mode
    session.currentBreakStartTime  // Already on break
  ) return;

  const minutesSinceStart = (Date.now() - session.lastBreakReminderAt.getTime()) / 60000;

  if (minutesSinceStart >= BREAK_CONFIG.intervalMinutes) {
    showBreakReminder(session);
  }
}

function showBreakReminder(session: FocusSession): void {
  // V1: Simple confirm
  const action = window.confirm(
    `You've been focusing for ${BREAK_CONFIG.intervalMinutes} minutes.\n\n` +
    `Take a ${BREAK_CONFIG.breakDurationMinutes} minute break?\n\n` +
    `OK = Take Break | Cancel = Snooze`
  );

  if (action) {
    startBreak(session);
  } else {
    snoozeBreakReminder(session);
  }
}

function snoozeBreakReminder(session: FocusSession): void {
  session.breakReminderSnoozeCount++;
  session.lastBreakReminderAt = new Date();

  if (session.breakReminderSnoozeCount >= BREAK_CONFIG.maxSnoozes) {
    // Third snooze = ask about flow mode
    const enableFlow = window.confirm(
      "You've snoozed twice. Are you in flow state?\n\n" +
      "OK = Yes, stop reminding me | Cancel = Keep reminding"
    );

    if (enableFlow) {
      session.flowModeEnabled = true;
    }
  }

  saveFocusSession(session);
}
```

### Break Timer

```typescript
function startBreak(session: FocusSession): void {
  // Pause main timer
  pauseSession(session);

  // Start break timer
  session.currentBreakStartTime = new Date();
  session.breaksTaken++;
  saveFocusSession(session);

  // Set timeout to auto-end break
  setTimeout(() => {
    if (session.currentBreakStartTime) {
      endBreak(session);
    }
  }, BREAK_CONFIG.breakDurationMinutes * 60 * 1000);
}

function endBreak(session: FocusSession): void {
  if (!session.currentBreakStartTime) return;

  const breakDuration = Math.floor(
    (Date.now() - session.currentBreakStartTime.getTime()) / 1000
  );

  session.totalBreakTime += breakDuration;
  session.currentBreakStartTime = undefined;
  session.lastBreakReminderAt = new Date();  // Reset reminder
  session.breakReminderSnoozeCount = 0;

  // Resume main timer
  resumeSession(session);
}
```

---

## Stale Session Detection

### Detection Strategy

**Simple approach**: Detect excessively long focus times (> 2 hours active)

```typescript
function checkStaleSession(session: FocusSession): boolean {
  if (!session.isActive) return false;

  const activeMinutes = session.totalTime / 60;
  return activeMinutes > 120;  // 2 hours
}

// On app mount/focus
async function detectStaleSessions(): Promise<void> {
  const session = await getActiveFocusSession();
  if (!session) return;

  if (checkStaleSession(session)) {
    handleStaleSession(session);
  }
}

function handleStaleSession(session: FocusSession): void {
  const action = window.confirm(
    `You have a focus session running for ${formatDuration(session.totalTime)}.\n\n` +
    `Is this still accurate?\n\n` +
    `OK = Keep as-is | Cancel = I forgot to stop`
  );

  if (!action) {
    // User forgot to stop - end session as "stale"
    endSession(session, 'stale');
  }
  // else: keep running
}
```

**Future enhancement**: Track `lastActivityTime` and detect actual inactivity.

---

## IndexedDB Schema

```typescript
// Schema version 2 (upgrade from existing)
const db = new Dexie('OrbitalZenDB');

db.version(2).stores({
  tasks: 'id, priority, category, createdAt, updatedAt, dueDate, targetDate',

  // New tables
  focusSessions: 'id, taskId, subtaskId, isActive, startTime, lastActivityTime',
  timeEntries: 'id, sessionId, taskId, subtaskId, startTime, endTime, wasCompleted, endReason, isManualEntry',
});

// Indexes for fast queries
db.timeEntries.createIndex('byTask', 'taskId');
db.timeEntries.createIndex('bySubtask', '[taskId+subtaskId]');
db.timeEntries.createIndex('byDate', 'endTime');
```

### Migration from v1

```typescript
// Existing tasks have totalFocusTime and focusSessionCount
// We don't need to migrate since this is a clean slate
// But if we did:

db.version(2).upgrade(tx => {
  // Option 1: Keep old fields for reference, populate new system from scratch
  // Option 2: Create synthetic TimeEntries from aggregated data (not recommended)
  // Option 3: Reset all time data (cleanest)

  // We chose clean slate, so no migration needed
});
```

---

## Core Functions

### Session Management

```typescript
async function startFocusSession(
  taskId: string,
  subtaskId?: string
): Promise<FocusSession> {
  // 1. Check for existing active session
  const existing = await getActiveFocusSession();
  if (existing) {
    // Auto-pause existing session
    await pauseSession(existing);
  }

  // 2. Create new session
  const session: FocusSession = {
    id: generateUUID(),
    taskId,
    subtaskId,
    startTime: new Date(),
    isActive: true,
    totalTime: 0,
    totalBreakTime: 0,
    breaksTaken: 0,
    pauseCount: 0,
    totalPauseTime: 0,
    pauseHistory: [],
    lastBreakReminderAt: new Date(),
    breakReminderSnoozeCount: 0,
    flowModeEnabled: false,
    lastActivityTime: new Date(),
    device: detectDevice(),
  };

  await db.focusSessions.put(session);
  return session;
}

async function pauseSession(session: FocusSession): Promise<void> {
  if (!session.isActive) return;

  session.isActive = false;
  session.pausedAt = new Date();
  session.pauseCount++;
  session.pauseHistory.push({
    pausedAt: session.pausedAt,
  });

  await db.focusSessions.put(session);
}

async function resumeSession(session: FocusSession): Promise<void> {
  if (session.isActive) return;

  // Calculate pause duration
  if (session.pausedAt) {
    const pauseDuration = Math.floor(
      (Date.now() - session.pausedAt.getTime()) / 1000
    );
    session.totalPauseTime += pauseDuration;

    // Update pause history
    const lastPause = session.pauseHistory[session.pauseHistory.length - 1];
    if (lastPause && !lastPause.resumedAt) {
      lastPause.resumedAt = new Date();
    }
  }

  session.isActive = true;
  session.pausedAt = undefined;
  session.lastActivityTime = new Date();

  await db.focusSessions.put(session);
}

async function endSession(
  session: FocusSession,
  reason: TimeEntry['endReason'] = 'stopped',
  wasCompleted: boolean = false
): Promise<TimeEntry> {
  // 1. Create TimeEntry from session
  const entry: TimeEntry = {
    id: generateUUID(),
    sessionId: session.id,
    taskId: session.taskId,
    subtaskId: session.subtaskId,
    startTime: session.startTime,
    endTime: new Date(),
    duration: session.totalTime,
    pauseCount: session.pauseCount,
    totalPauseTime: session.totalPauseTime,
    breaksTaken: session.breaksTaken,
    totalBreakTime: session.totalBreakTime,
    wasCompleted,
    endReason: reason,
    isManualEntry: false,
    device: session.device,
    pauseTimestamps: session.pauseHistory,
    createdAt: new Date(),
  };

  // 2. Save to history
  await db.timeEntries.add(entry);

  // 3. Delete active session
  await db.focusSessions.delete(session.id);

  return entry;
}

async function completeTaskFromSession(
  session: FocusSession,
  task: Task
): Promise<void> {
  // 1. End session
  await endSession(session, 'completed', true);

  // 2. Mark task/subtask as complete
  if (session.subtaskId) {
    await markSubtaskComplete(task, session.subtaskId);
  } else {
    await markTaskComplete(task);
  }
}
```

### Time Aggregation

```typescript
async function getTaskTimeStats(taskId: string): Promise<TaskTimeStats> {
  const entries = await db.timeEntries
    .where('taskId')
    .equals(taskId)
    .toArray();

  if (entries.length === 0) {
    return {
      totalActiveTime: 0,
      totalBreakTime: 0,
      totalPauseTime: 0,
      sessionCount: 0,
      averageSessionLength: 0,
      completionRate: 0,
    };
  }

  const totalActiveTime = entries.reduce((sum, e) => sum + e.duration, 0);
  const totalBreakTime = entries.reduce((sum, e) => sum + e.totalBreakTime, 0);
  const totalPauseTime = entries.reduce((sum, e) => sum + e.totalPauseTime, 0);
  const completedCount = entries.filter(e => e.wasCompleted).length;

  return {
    totalActiveTime,
    totalBreakTime,
    totalPauseTime,
    sessionCount: entries.length,
    averageSessionLength: totalActiveTime / entries.length,
    completionRate: completedCount / entries.length,
    lastWorkedOn: entries[entries.length - 1]?.endTime,
  };
}
```

---

## Implementation Phases

### Phase 1: Core Session Management (MVP)

**Goal**: Basic focus/pause/stop/complete with time tracking

**Tasks**:
- [ ] Create TimeEntry and FocusSession data models
- [ ] Set up IndexedDB tables (version 2 upgrade)
- [ ] Implement session lifecycle functions (start/pause/resume/end)
- [ ] Update AIPanel with session state buttons
- [ ] Add timer display to panel header
- [ ] Create timer update hook (updates every second)
- [ ] Implement "Complete" flow for tasks
- [ ] Implement subtask completion with simple prompt
- [ ] Test session state transitions
- [ ] Test time aggregation calculations

**Deliverable**: Can start focus, pause, resume, stop, complete. Time is tracked accurately.

### Phase 2: Smart Features

**Goal**: Break reminders, stale detection, manual entries

**Tasks**:
- [ ] Implement break reminder system
- [ ] Add break timer with pause/resume logic
- [ ] Implement stale session detection on app mount
- [ ] Add manual time entry UI in AIPanel
- [ ] Validate manual entries against overlaps
- [ ] Add session notes field (optional)
- [ ] Test break flow end-to-end
- [ ] Test stale detection scenarios

**Deliverable**: System actively helps user maintain healthy focus patterns.

### Phase 3: History & Analytics

**Goal**: View past sessions, see insights

**Tasks**:
- [ ] Create TimeHistory component (modal or panel section)
- [ ] Display list of TimeEntries for a task
- [ ] Show aggregated stats in task details
- [ ] Add basic charts (optional)
- [ ] Implement time range filtering (today, week, month, all)
- [ ] Export time entries as CSV
- [ ] Calculate and display productivity metrics

**Deliverable**: Users can review their focus history and patterns.

### Phase 4: Multi-Device Sync (Future)

**Goal**: Sync sessions across devices

**Prerequisites**:
- Backend API (Supabase, Firebase, or custom)
- Authentication system
- WebSocket or polling for real-time updates

**Tasks**:
- [ ] Design sync protocol
- [ ] Handle conflict resolution
- [ ] Implement optimistic updates
- [ ] Add "syncing" UI indicators
- [ ] Test multi-device scenarios
- [ ] Handle offline mode gracefully

**Deliverable**: Can start focus on phone, continue on desktop.

---

## Technical Decisions Made

| Decision | Rationale |
|----------|-----------|
| **Dual model (FocusSession + TimeEntry)** | Separates active state from history, cleaner queries |
| **Break timer pauses main timer** | Clearer separation of work vs. break time |
| **Stale = excessive duration, not activity tracking** | Simpler to implement, still catches most issues |
| **Local-only for Phase 1** | Faster development, add sync later when backend ready |
| **2 button states (Active/Paused)** | Cleaner UI, less cognitive load |
| **Auto-start next subtask on "Continue"** | Maintains focus momentum |
| **Simple alerts for v1** | Ship faster, upgrade to modal later |
| **Round time display in details view** | Reduces noise, shows approximate effort |
| **Exact time in active session** | User wants precision when actively working |
| **IndexedDB for all storage** | Consistent with existing system, offline-first |
| **No migration from old time fields** | Clean slate, better data quality going forward |

---

## Outstanding Deliberations

### 1. Session Notes Priority

**Question**: Are session notes critical for primary UI, or hide in "More"?

**Current Thinking**:
- For some tasks, taking notes during focus is essential (coding, research, writing)
- But for many tasks, notes are optional
- **Proposal**: Add "Add session note" link in "More" section, not primary UI

**Decision Needed**: Confirm this approach or elevate to primary UI

---

### 2. Break Timer UI Location

**Question**: Where should break timer display during break?

**Options**:
- A) Replace focus timer in header (current plan)
- B) Show both timers (main paused, break counting down)
- C) Full-screen break overlay with timer

**Current Thinking**: Option A (simple replacement)

**Decision Needed**: User preference?

---

### 3. Notification Strategy for React Native

**Question**: How to handle break reminders and stale session prompts when app is backgrounded?

**Considerations**:
- `window.confirm()` won't work in background
- Need push notifications for cross-device and background scenarios
- Notification permissions required

**Proposal**:
- Phase 1 (web): Use alerts/confirms
- Phase 2 (React Native): Implement local notifications
- Phase 3 (Multi-device): Remote push notifications via backend

**Decision Needed**: Timeline for React Native migration?

---

### 4. Time Entry Retention Policy

**Question**: Should we auto-delete old TimeEntries, or keep forever?

**Considerations**:
- Storage: 1 entry/day * 365 days = 365 entries/year (tiny in IndexedDB)
- Privacy: Some users may want to clear history
- Analytics: More data = better insights

**Proposal**:
- Keep all entries by default
- Add "Clear time history" option in settings
- Implement soft-delete (archived flag) instead of hard delete

**Decision Needed**: Confirm approach

---

### 5. Parent Time Display with Subtasks

**Question**: When viewing parent task with subtasks, which time to show?

**Options**:
- A) Total time (parent + all subtasks combined)
- B) Direct parent time only (excluding subtasks)
- C) Both, separated

**Current Thinking**: Show total time primarily, with breakdown on hover/click

```
Total Focus: 5h 20m
  ↳ Parent: 1h 15m
  ↳ Subtasks: 4h 5m
```

**Decision Needed**: User preference?

---

## Future Considerations

### Features to Add Later

1. **Pomodoro Mode**
   - Pre-configured 25/5 work/break cycles
   - Auto-start next work session after break
   - Track streaks

2. **Focus Goals**
   - Set daily/weekly focus time targets
   - Progress bars and notifications
   - Gamification elements

3. **Task Time Estimates**
   - Compare estimated vs. actual time
   - Learn from past sessions to improve estimates
   - Warn if task is taking much longer than expected

4. **Productivity Insights**
   - Best time of day for focus
   - Average task completion time by category
   - Distraction patterns (frequent pauses)
   - Weekly/monthly reports

5. **Collaboration Features**
   - Share focus sessions with team
   - Co-working timers
   - Accountability partners

6. **Advanced Break System**
   - Different break lengths (5m, 10m, 15m)
   - Break type selection (walk, stretch, coffee, etc.)
   - Break history and patterns

7. **Integrations**
   - Calendar sync (block time for focus)
   - Export to time tracking tools (Toggl, Harvest)
   - Import from other systems

### Technical Improvements

1. **Performance Optimizations**
   - Cache aggregated time stats
   - Lazy load time entries (pagination)
   - Use Web Workers for heavy calculations
   - Implement virtual scrolling for long history lists

2. **Better Timer Implementation**
   - Use `requestAnimationFrame` for smoother updates
   - Page Visibility API to pause updates when hidden
   - Worker-based timer for background accuracy
   - Reduce re-renders with memoization

3. **Offline-First Enhancements**
   - Queue failed sync attempts
   - Optimistic updates with rollback
   - Conflict resolution UI
   - Sync status indicators

4. **Testing Infrastructure**
   - Mock timer utilities for deterministic tests
   - Session state machine tests
   - Time calculation accuracy tests
   - Edge case scenarios (timezone changes, DST, etc.)

---

## Success Metrics

How we'll know the system is working well:

1. **Accuracy**: Time entries match actual work done (user validation)
2. **Adoption**: % of tasks that have at least one focus session
3. **Retention**: Users continue using focus mode week-over-week
4. **Completion**: % increase in task completion rate
5. **Health**: Break compliance rate (are users taking breaks?)
6. **Trust**: Low rate of manual time corrections/deletions

---

## Next Steps

1. **Review & Approve** this plan
2. **Clarify outstanding deliberations** (above section)
3. **Begin Phase 1 implementation**:
   - Start with data models
   - Set up IndexedDB schema
   - Implement core session functions
   - Update UI components
4. **Iterate based on testing and feedback**

---

## References

- Original requirements document
- Existing TimerBadge component (app/components/TimerBadge.tsx)
- Current AIPanel implementation
- IndexedDB documentation: https://dexie.org/

---

**End of Planning Document**
