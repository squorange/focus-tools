# Recurring Tasks - Implementation Plan

## Overview

This document outlines the complete implementation roadmap for recurring tasks functionality, including file structure, development phases, migration strategy, and validation criteria.

**Estimated Timeline:** 5-6 days of focused development  
**Approach:** Incremental phases with validation after each  
**Dependencies:** Existing task management system (v8 schema)

---

## File Structure

### New Files to Create

```
prototypes/task-copilot/
├─ lib/
│  ├─ recurring-types.ts          [NEW] Type definitions
│  ├─ recurring-utils.ts          [NEW] Core algorithms
│  └─ types.ts                    [UPDATE] Add recurring fields to Task
│
├─ components/
│  ├─ routines/                   [NEW] Routine-specific components
│  │  ├─ RoutinesGallery.tsx      Horizontal scroll gallery
│  │  ├─ RoutineCard.tsx          Individual routine card
│  │  ├─ RoutinesList.tsx         Management view (grouped)
│  │  └─ HistoryModal.tsx         Calendar history view
│  │
│  ├─ task-detail/
│  │  ├─ TaskDetail.tsx           [UPDATE] Add recurring sections
│  │  ├─ RecurrenceFields.tsx     [NEW] Pattern configuration
│  │  └─ EditTemplateModal.tsx    [NEW] Template step editor
│  │
│  └─ focus-queue/
│     └─ FocusQueue.tsx           [UPDATE] Include RoutinesGallery
│
└─ docs/
   ├─ RECURRING_TASKS_OVERVIEW.md
   ├─ RECURRING_TASKS_DATA_MODEL.md
   ├─ RECURRING_TASKS_IMPLEMENTATION_PLAN.md
   ├─ RECURRING_TASKS_UI_SPECIFICATION.md
   ├─ RECURRING_TASKS_UTILITIES.md
   ├─ RECURRING_TASKS_CLAUDE_CODE_PROMPTS.md
   ├─ RECURRING_TASKS_TESTING.md
   └─ RECURRING_TASKS_FUTURE_ENHANCEMENTS.md
```

### Files to Update

```
lib/types.ts                      Add recurring fields to Task interface
lib/storage.ts                    Schema v9 migration, persist recurring data
lib/utils.ts                      Minor helper additions if needed
app/page.tsx                      Add recurring handlers
components/focus-queue/FocusQueue.tsx   Integrate RoutinesGallery
components/task-detail/TaskDetail.tsx   Recurring UI sections
components/tasks-view/TasksView.tsx     Add Routines tab
```

---

## Implementation Phases

### Phase 1: Data Model & Core Utilities
**Duration:** Day 1 (3-4 hours)  
**Goal:** Establish data structures and core logic without UI

#### Tasks
1. Create `lib/recurring-types.ts`
   - RecurrenceRule interface
   - RecurringInstance interface
   - Supporting types (TaskInstance, InstanceStatus, etc.)

2. Create `lib/recurring-utils.ts`
   - Pattern matching: `dateMatchesPattern()` and helpers
   - Instance generation: `generateInstancesForRange()`
   - Streak calculation: `calculateStreak()`, `getPreviousOccurrence()`
   - Next occurrence: `getNextOccurrence()`
   - Instance management: `ensureInstance()`, `createInstance()`, `cloneSteps()`
   - Completion logic: `isInstanceComplete()`, `markInstanceComplete()`
   - Filtering: `filterRecurringTasks()`, `filterDueToday()`, etc.
   - Sorting: `sortByNextDue()`, `sortByStreak()`, etc.
   - Helpers: `getTodayISO()`, `describePattern()`, `validatePattern()`

3. Update `lib/types.ts`
   - Add recurring fields to Task interface:
     ```typescript
     isRecurring: boolean;
     recurrence: RecurrenceRule | null;
     recurringStreak: number;
     recurringBestStreak: number;
     recurringInstances: RecurringInstance[];
     recurringTotalCompletions: number;
     recurringLastCompleted: string | null;
     recurringNextDue: string | null;
     ```

4. Update `lib/storage.ts`
   - Bump SCHEMA_VERSION to 9
   - Add migration function (v8 → v9)
   - Ensure recurring data persists correctly

#### Validation
- [ ] TypeScript compiles without errors
- [ ] Can create recurring task programmatically
- [ ] Pattern matching works for various patterns (test in console)
- [ ] Streak calculation produces correct results
- [ ] Storage persists and loads recurring tasks

---

### Phase 2: Routines Gallery & Focus Queue
**Duration:** Day 2 (3-4 hours)  
**Goal:** Get routines visible and completable in Focus Queue

#### Tasks
1. Create `components/routines/RoutineCard.tsx`
   - Props: task, onComplete, onSkip, onOpenDetail
   - Display: checkbox, title, time, streak, detail arrow
   - Tap checkbox → show popover [Complete] [Skip]
   - Tap card body → call onOpenDetail
   - Handle overdue state (warning icon, "Due X days ago")
   - Fixed height (~90px), support title wrapping (max 2 lines)

2. Create `components/routines/RoutinesGallery.tsx`
   - Props: tasks (due today), handlers
   - Horizontal scroll container with snap behavior
   - Layout: 2 cards on mobile, 3-4 on tablet/desktop
   - Section header: "Today's Routines"
   - Don't render if empty

3. Update `components/focus-queue/FocusQueue.tsx`
   - Import RoutinesGallery
   - Filter tasks: `isRecurring && due today && not paused`
   - Render gallery above TODAY section
   - Pass handlers

4. Update `app/page.tsx`
   - Add `handleCompleteRoutine(taskId, date)`
     - Calls `markInstanceComplete()`
     - Updates state
     - Shows undo toast
   - Add `handleSkipRoutine(taskId, date)`
     - Creates skipped instance
     - Updates state
     - Shows toast

#### Validation
- [ ] Routines appear in gallery when due today
- [ ] Cards display correctly (title, time, streak)
- [ ] Horizontal scroll works smoothly
- [ ] Tap checkbox → popover appears
- [ ] Complete → streak updates, card disappears
- [ ] Skip → creates skipped instance
- [ ] Undo toast works
- [ ] Empty state handled (no render)

---

### Phase 3: Routines Management Tab
**Duration:** Day 2-3 (2-3 hours)  
**Goal:** View and manage all routines

#### Tasks
1. Create `components/routines/RoutinesList.tsx`
   - Props: tasks (all recurring)
   - Group by frequency (Daily/Weekly/Monthly sections)
   - Each section: collapsible header with count
   - Use existing TaskRow component
   - Show metadata pills:
     - Streak: "12d streak 🔥"
     - Last completed: "Last: Today" / "Last: Jan 15"
     - Next due (non-daily): "Next: Jan 20"
   - Tap row → navigate to detail
   - Sort within group: active first (by time), then paused

2. Update `components/tasks-view/TasksView.tsx`
   - Add "Routines" tab after "Staging"
   - When active:
     - Filter tasks: `isRecurring = true`
     - Render RoutinesList component
   - Empty state: "No routines yet" with guidance

3. Add helper to `lib/recurring-utils.ts`
   - `getRoutineMetadataPills(task): Pill[]`
   - Format streak, last completed, next due

#### Validation
- [ ] Routines tab appears after Staging
- [ ] All routines listed and grouped correctly
- [ ] Metadata pills show correct data
- [ ] Sections collapsible
- [ ] Tap row → opens task detail
- [ ] Empty state shows guidance
- [ ] Active routines before paused

---

### Phase 4a: Task Detail - Recurring Structure
**Duration:** Day 3 (2-3 hours)  
**Goal:** Display recurring task with proper sections

#### Tasks
1. Update `components/task-detail/TaskDetail.tsx`
   - Detect `task.isRecurring`
   - If recurring, modify UI:
     - Top buttons: [Complete] [Skip] [History] [...]
     - Remove [Move to Ready] [Add to Queue]
     - History button opens HistoryModal (stub for now)
   
2. Add steps sections for recurring:
   - Get active occurrence date: `getActiveOccurrenceDate(task)`
   - Get or create instance: `ensureInstance(task, date)`
   - Render two sections:
     ```
     Routine Steps             [Edit Template]
     ☐ Step 1
     ☐ Step 2
     
     Additional Steps (1/17)   [+]
     ☐ Step X
     
     Add a step...
     ```
   - Routine Steps: display `instance.routineSteps`
   - Additional Steps: display `instance.additionalSteps`
   - Add step input → creates additional step by default

3. Handle step completion:
   - Check routine step → update `instance.routineSteps[i].completed`
   - Check additional step → update `instance.additionalSteps[i].completed`
   - After each change, check `isInstanceComplete(instance)`
   - If complete → update streak, next due, etc.

4. Details section modifications:
   - Toggle "Recurring" on/off
   - If recurring: show RecurrenceFields (stub for now)
   - Hide Priority, Target, Deadline if recurring
   - Bottom row: Replace "Defer" with "Pause" toggle

#### Validation
- [ ] Recurring task shows two step sections
- [ ] Routine steps displayed correctly
- [ ] Additional steps displayed correctly
- [ ] Can check off steps
- [ ] Instance completion triggers metadata update
- [ ] Add step goes to Additional section
- [ ] Edit Template button present (stub OK)

---

### Phase 4b: Task Detail - Pattern Configuration
**Duration:** Day 3-4 (2-3 hours)  
**Goal:** Configure recurrence patterns and edit template

#### Tasks
1. Create `components/task-detail/RecurrenceFields.tsx`
   - Props: task, onUpdate
   - Fields:
     - Frequency dropdown: Daily/Weekly/Monthly/Yearly
     - Interval: "Every [N] [days/weeks/months]"
     - Time picker: HH:MM (24-hour)
     - Conditional fields:
       - Weekly: Day checkboxes (S M T W T F S)
       - Monthly: Day picker OR week+day picker
     - Advanced options (expandable):
       - End date / End after N occurrences
     - Rollover toggle: "Keep visible until completed"
   - Show pattern description: "Daily at 8:00 AM"
   - Validate pattern on change

2. Create `components/task-detail/EditTemplateModal.tsx`
   - Similar to existing Edit Focus modal
   - Shows all steps (routine + additional)
   - Checkboxes: checked = Template, unchecked = Additional
   - [Select all] [Clear all] buttons
   - Summary: "X steps in template · Y additional"
   - Save applies changes:
     - Checked steps → `task.steps` (template)
     - Unchecked steps → `instance.additionalSteps`

3. Wire up in TaskDetail:
   - Render RecurrenceFields when recurring toggle ON
   - Edit Template button opens modal
   - Save updates both template and instance

#### Validation
- [ ] Toggle recurring ON → fields appear
- [ ] Can configure daily pattern
- [ ] Can configure weekly pattern (specific days)
- [ ] Can configure monthly pattern (day of month)
- [ ] Pattern description updates correctly
- [ ] Edit Template modal opens
- [ ] Can promote additional steps to template
- [ ] Can demote template steps to additional
- [ ] Save updates correctly

---

### Phase 5: History Modal
**Duration:** Day 4 (3-4 hours)  
**Goal:** View completion history with calendar

#### Tasks
1. Create `components/routines/HistoryModal.tsx`
   - Props: task, onClose
   - Responsive: Bottom drawer (mobile), Modal (desktop)
   
2. Month View (initial):
   - Header: Month/year, navigation arrows
   - Stats row: Current streak, Best streak, Total
   - Calendar grid:
     - 7 columns (Mon-Sun)
     - 4-5 rows (weeks)
     - Each date cell shows icon: ✅ ❌ ⏭️ ⭕
     - Full week row is tappable
   
3. Week View (after tapping week):
   - Header: "Week of Jan 15-21" with back button
   - Calendar grid: Just that week
   - Details panel below (initially empty)
   - Tap date → show details:
     - Status text: "Completed at 8:15 AM" / "Missed"
     - Notes if any
     - Actions: [Mark Complete] [Mark Skipped] (if past)
   
4. Data handling:
   - Use `generateInstancesForRange()` for month
   - Map to TaskInstance with status
   - Handle retroactive completion:
     - Update/create instance
     - Recalculate streak
     - Update task metadata

#### Validation
- [ ] History button opens modal
- [ ] Month calendar displays correctly
- [ ] Icons show proper status
- [ ] Navigate between months
- [ ] Tap week row → zooms to week
- [ ] Week view displays correctly
- [ ] Tap date → details appear
- [ ] Can mark past date complete
- [ ] Streak recalculates correctly
- [ ] Responsive (drawer on mobile, modal on desktop)

---

### Phase 6: Polish & Edge Cases
**Duration:** Day 5 (2-3 hours)  
**Goal:** Handle edge cases and polish UX

#### Tasks
1. Pause/Resume functionality:
   - Add pause button to bottom row
   - Tap → open modal:
     - "Resume manually" option
     - "Resume on [date]" option
   - Set `pausedAt`, optionally `pausedUntil`
   - Paused tasks:
     - Don't appear in gallery
     - Show in Routines tab with [Paused] badge
     - Banner in detail: "⏸️ Paused until..." with [Resume]
   - Resume clears pause fields

2. Overdue handling:
   - Calculate `overdueDays` if rollover enabled
   - Gallery card: "⚠️ Due 2 days ago" (hide streak)
   - Completing overdue resets streak

3. Day-start time:
   - Add to AppState.settings: `dayStartHour: number` (default 5)
   - Use in all `getTodayISO()` calls
   - Future: Add UI in settings

4. Validation:
   - Call `validatePattern()` before saving
   - Show error if invalid
   - Disable save button if errors

5. Performance:
   - Prune instances >90 days old
   - Run after completion
   - Test with >100 instances

6. Error handling:
   - Try/catch around all operations
   - Toast on errors
   - Log to console for debugging

#### Validation
- [ ] Can pause routine
- [ ] Paused routine disappears from gallery
- [ ] Paused badge shows in Routines tab
- [ ] Resume works correctly
- [ ] Overdue displays properly
- [ ] Day-start time works (test at midnight)
- [ ] Pattern validation prevents bad configs
- [ ] Pruning keeps storage reasonable
- [ ] Errors handled gracefully

---

## Schema Migration

### Current State (v8)
```typescript
const SCHEMA_VERSION = 8;

interface Task {
  id: string;
  title: string;
  steps: Step[];
  status: TaskStatus;
  priority: Priority | null;
  // ... other fields
}
```

### New State (v9)
```typescript
const SCHEMA_VERSION = 9;

interface Task {
  // ... all existing fields ...
  
  // NEW: Recurring fields
  isRecurring: boolean;
  recurrence: RecurrenceRule | null;
  recurringStreak: number;
  recurringBestStreak: number;
  recurringInstances: RecurringInstance[];
  recurringTotalCompletions: number;
  recurringLastCompleted: string | null;
  recurringNextDue: string | null;
}

interface AppState {
  // ... existing fields ...
  
  // NEW: Settings
  settings: {
    dayStartHour: number;
  };
}
```

### Migration Function
```typescript
function migrateState(stored: any): AppState {
  let state = stored;
  
  // ... existing migrations 1-8 ...
  
  // Version 8 → 9: Recurring tasks
  if (state.schemaVersion < 9) {
    state.tasks = state.tasks.map((task: any) => ({
      ...task,
      isRecurring: false,
      recurrence: null,
      recurringStreak: 0,
      recurringBestStreak: 0,
      recurringInstances: [],
      recurringTotalCompletions: 0,
      recurringLastCompleted: null,
      recurringNextDue: null,
    }));
    
    if (!state.settings) {
      state.settings = { dayStartHour: 5 };
    } else if (state.settings.dayStartHour === undefined) {
      state.settings.dayStartHour = 5;
    }
    
    state.schemaVersion = 9;
  }
  
  return state;
}
```

### Testing Migration
```typescript
// Test data (v8)
const v8Data = {
  schemaVersion: 8,
  tasks: [
    { id: '1', title: 'Test task', status: 'pool', /* ... */ }
  ]
};

// Migrate
const migrated = migrateState(v8Data);

// Verify
assert(migrated.schemaVersion === 9);
assert(migrated.tasks[0].isRecurring === false);
assert(migrated.tasks[0].recurringInstances.length === 0);
assert(migrated.settings.dayStartHour === 5);
```

---

## Post-Implementation Checklist

### Data & Storage
- [ ] Schema version is 9
- [ ] Migration tested with v8 data
- [ ] Recurring fields persist on refresh
- [ ] No TypeScript errors
- [ ] Storage size acceptable

### Routines Gallery (Focus Queue)
- [ ] Appears when routines due today
- [ ] Cards display correctly
- [ ] Horizontal scroll smooth
- [ ] Popover works (complete/skip)
- [ ] Streak updates
- [ ] Undo toast works
- [ ] Empty state handled

### Routines Tab (Tasks View)
- [ ] Shows all routines
- [ ] Grouped by frequency
- [ ] Metadata pills correct
- [ ] Navigation works
- [ ] Empty state guidance
- [ ] Pause badge shows

### Task Detail - Recurring
- [ ] Recurring toggle works
- [ ] Pattern configuration works
- [ ] Routine/Additional sections display
- [ ] Edit Template modal works
- [ ] Steps complete per-instance
- [ ] History button works
- [ ] Pause/Resume works

### History Modal
- [ ] Month calendar displays
- [ ] Week zoom works
- [ ] Date details show
- [ ] Retroactive completion works
- [ ] Responsive (mobile/desktop)

### Pattern Matching
- [ ] Daily patterns work
- [ ] Weekly patterns work
- [ ] Monthly patterns work
- [ ] Every other day works
- [ ] Weekdays only works
- [ ] First Monday works
- [ ] Edge cases handled

### Streak Calculation
- [ ] Perfect streak correct
- [ ] Broken streak resets
- [ ] Weekly/monthly streaks work
- [ ] Day-start time respected
- [ ] Skip doesn't break streak

### Edge Cases
- [ ] Template changes don't affect past
- [ ] Deleted steps preserved in history
- [ ] Pausing works
- [ ] Overdue displays correctly
- [ ] Validation prevents bad patterns
- [ ] Performance acceptable (>100 instances)
- [ ] Midnight completion works (day-start)

---

## Risk Mitigation

### Potential Issues

**1. Storage Overflow**
- **Risk:** Many routines × many instances = large storage
- **Mitigation:** Pruning after 90 days (tested, acceptable)
- **Monitoring:** Log storage size in dev tools

**2. Pattern Matching Bugs**
- **Risk:** Complex patterns might not match correctly
- **Mitigation:** Comprehensive unit tests for all patterns
- **Fallback:** Validate pattern before saving

**3. UI Performance**
- **Risk:** Large lists of routines might lag
- **Mitigation:** Virtual scrolling if needed
- **Threshold:** Test with 50+ routines

**4. Migration Failures**
- **Risk:** v8 → v9 migration might fail for some users
- **Mitigation:** Try/catch in migration, fallback to empty
- **Recovery:** Schema mismatch detection, prompt user

**5. Streak Calculation Errors**
- **Risk:** Day-start time or pattern bugs cause wrong streaks
- **Mitigation:** Extensive testing around midnight
- **Validation:** Show calculation in dev tools

---

## Rollout Strategy

### Alpha (Internal Testing)
- Implement all 6 phases
- Test with real data
- Fix critical bugs
- Document issues

### Beta (Limited Users)
- Release to 10-20 power users
- Collect feedback
- Monitor for errors
- Iterate quickly

### Production
- Full release
- Monitor storage usage
- Track adoption metrics
- Prepare support docs

---

## Success Criteria

### Technical
- [ ] All phases completed
- [ ] Zero TypeScript errors
- [ ] Migration works flawlessly
- [ ] Performance acceptable
- [ ] Storage manageable

### User Experience
- [ ] Routines easy to create
- [ ] Completion is quick (2 taps max)
- [ ] History is clear and useful
- [ ] Patterns work intuitively
- [ ] No confusion about template vs. instance

### Adoption
- [ ] 50%+ of active users create routine
- [ ] 70%+ completion rate for routines
- [ ] 30-day retention high
- [ ] Positive user feedback

---

## Next Steps After Implementation

1. **Documentation Update**
   - Update main PRD with recurring tasks
   - Create user guide
   - Record demo video

2. **Monitoring**
   - Track usage metrics
   - Monitor errors
   - Collect user feedback

3. **Iteration**
   - Address bugs quickly
   - Consider quick wins from feedback
   - Plan v2 features

4. **Communication**
   - Announce feature
   - Share best practices
   - Highlight power user tips

---

## Related Documentation

- `RECURRING_TASKS_OVERVIEW.md` - Product specification
- `RECURRING_TASKS_DATA_MODEL.md` - Data structures
- `RECURRING_TASKS_CLAUDE_CODE_PROMPTS.md` - Implementation prompts
- `RECURRING_TASKS_TESTING.md` - Testing strategy
- `RECURRING_TASKS_FUTURE_ENHANCEMENTS.md` - Future features
