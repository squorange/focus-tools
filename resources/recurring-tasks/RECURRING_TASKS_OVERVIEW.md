# Recurring Tasks - Overview & Product Specification

## Executive Summary

Recurring tasks (called "Routines" in UI) enable users to create tasks that repeat on a schedule. This feature is essential for ADHD users who need support with daily habits, weekly check-ins, and monthly maintenance tasks.

**Key Design Principles:**
- **Spatial consistency**: Routines appear in dedicated gallery space
- **Memory queue**: Visual reminder system for familiar tasks
- **Minimal cognitive load**: Quick completion without excessive context
- **Historical accuracy**: Past completions tracked precisely
- **Flexible scheduling**: Daily, weekly, monthly patterns with variations

---

## User-Facing Features

### 1. Routines Gallery (Focus Queue)
**Location:** Top of Focus Queue view, above TODAY section

**Purpose:** Quick access to today's due routines

**Features:**
- Horizontal scrollable cards (2 visible on mobile, 3-4 on tablet/desktop)
- Shows: Title, time, streak badge
- Quick actions: Complete or Skip via popover
- Visual differentiation from one-off tasks (taller cards, recurrence icon)
- Disappears after completion (reappears tomorrow)
- Overdue indicator for missed routines with rollover enabled

**Empty State:** Section doesn't render if no routines due today

---

### 2. Routines Management Tab
**Location:** Tasks Overview, tab after "Staging"

**Purpose:** View and configure all routines

**Features:**
- Grouped by frequency (Daily/Weekly/Monthly sections)
- Metadata pills: Current streak, last completed, next due
- Pause/resume functionality
- Navigate to detail for configuration
- Uses same TaskRow component as other views

**Empty State:** "No routines yet" with guidance on creating first routine

---

### 3. Task Detail - Recurring Mode
**Structure:**

```
Top Actions: [Complete] [Skip] [History] [...]
Steps:
  - Routine Steps (template)
  - Additional Steps (date) (instance-specific)
  - Add a step... (defaults to Additional)
  - [Edit Template] button
Details:
  - Recurring toggle
  - Pattern configuration (frequency, time, etc.)
  - Rollover setting
  - Streak display
  - Pause/Resume
```

**Key Behaviors:**
- Routine Steps = template (applies to all future occurrences)
- Additional Steps = this occurrence only (resets each time)
- Edit Template modal allows promoting Additional → Routine
- Step completion tracked per-instance (not on template)
- Template changes don't affect past instances (snapshot approach)

---

### 4. History Modal
**Purpose:** View completion history with calendar visualization

**Features:**
- Month view: Full calendar grid with icons (✅ ❌ ⏭️ ⭕)
- Week view: Zoom into specific week with details panel
- Stats summary: Current streak, best streak, total completions
- Retroactive actions: Mark past dates as complete/skipped
- Date details: Completion time, notes, status

**Responsive:**
- Mobile: Bottom drawer
- Desktop: Centered modal

---

## Terminology & Language

### User-Facing Terms
| Concept | Term in UI | Context |
|---------|-----------|---------|
| Recurring task | "Routine" | Throughout app |
| Template steps | "Routine Steps" | Task detail |
| Instance-specific steps | "Additional Steps (date)" | Task detail |
| Overall routine state | "Active" / "Paused" / "Archived" | Task detail |
| Instance state | "Completed" / "Missed" / "Skipped" | History |
| Pattern config | "Repeats daily at 8:00 AM" | Display text |
| Rollover setting | "Keep visible until completed" | Settings |

### Code Terms
| Concept | Term in Code |
|---------|-------------|
| Recurring task | `isRecurring: boolean` |
| Pattern | `RecurrenceRule` |
| Occurrence on specific date | `RecurringInstance` |
| Template steps | `task.steps` |
| Instance steps | `instance.routineSteps` + `instance.additionalSteps` |

---

## Core User Flows

### Creating a Routine

**Flow 1: Convert Existing Task**
1. User opens task detail
2. Toggles "Recurring" ON
3. Configures pattern (daily/weekly/monthly)
4. Sets time
5. Optionally adjusts rollover setting
6. Saves

**Flow 2: From Scratch** *(future enhancement)*
1. User taps "+ New Routine" in Routines tab
2. Enters title
3. Configures pattern and time
4. Creates

---

### Completing a Routine

**From Gallery:**
1. User taps checkbox on routine card
2. Popover appears: [Complete] [Skip]
3. User taps "Complete"
4. Instance marked complete, streak updates
5. Card animates out
6. Toast shows "Completed! 13d streak" with undo

**From Task Detail:**
1. User opens routine detail
2. Checks off steps (routine + additional)
3. When all complete, instance auto-completes
4. Or taps [Complete] button to complete all at once

---

### Managing Template vs. Additional Steps

**Adding Additional Step:**
1. User opens routine detail (for today or future occurrence)
2. Types in "Add a step..." input at bottom
3. Step appears in "Additional Steps (date)" section
4. Step only exists for this occurrence

**Promoting to Template:**
1. User taps [Edit Template] button
2. Modal opens showing all steps
3. Steps in "Routine Steps" are checked
4. Steps in "Additional Steps" are unchecked
5. User checks additional step to promote
6. Saves
7. Step moves to Routine Steps section
8. Future occurrences will include this step

---

### Viewing History

1. User taps [History] button in task detail
2. History modal opens showing current month
3. User sees calendar grid with completion icons
4. User taps week row
5. Zooms into week view with details panel
6. User taps specific date
7. Details show: status, time, notes
8. User can retroactively mark complete/skipped

---

## Key Behaviors

### Instance Lifecycle

**Creation:**
- Instance created on-demand when user interacts with occurrence
- Template steps cloned with new IDs (snapshot)
- Additional steps start empty

**Active Occurrence:**
- "Active" = today if due, or next due date if future
- Additional steps can be added to active occurrence only
- Can complete steps ahead of time for future occurrence

**After Period Ends:**
- Instance locks into history
- Next occurrence becomes active with fresh instance
- Previous additional steps no longer visible/editable

---

### Template Snapshot Approach

**Why Snapshot?**
- Historical accuracy: Past shows exactly what existed at the time
- Clean UX: No confusing completion counts
- Handles deletions: Deleted steps don't break past instances
- Handles edits: Past text stays accurate

**How It Works:**
1. When instance created: Clone `task.steps` → `instance.routineSteps`
2. Each step gets new ID (not shared with template)
3. Step completion tracked in instance
4. Template changes don't affect existing instances
5. Future instances use updated template

**Example:**
```
Jan 15: Instance has 3 steps [A, B, C] - Complete
Jan 16: Instance has 3 steps [A, B, C] - Complete
Jan 17: User adds step D to template
Jan 18: Instance has 4 steps [A, B, C, D] - Fresh instance
```

Past instances still show 3 steps (accurate), new instances have 4.

---

### Streak Calculation

**Rules:**
- Counts consecutive completions from today backward
- Breaks on missed occurrence (unless skipped)
- Respects pattern (only counts days that should have occurrence)
- Day-start time aware (5am default)

**Examples:**

**Daily routine:**
```
Jan 17: ✅ Complete
Jan 16: ✅ Complete  
Jan 15: ✅ Complete
Streak: 3 days
```

**Weekly routine (Thursdays):**
```
Jan 16: ✅ Complete (Thu)
Jan 09: ✅ Complete (Thu)
Jan 02: ✅ Complete (Thu)
Streak: 3 weeks
```

**Broken streak:**
```
Jan 17: ✅ Complete
Jan 16: ✅ Complete
Jan 15: ❌ Missed
Jan 14: ✅ Complete
Streak: 2 days (resets at Jan 15)
```

---

### Skip vs. Missed

**Skip (explicit):**
- User taps "Skip" in popover
- Creates instance with `skipped: true`
- Does NOT break streak
- Shows ⏭️ in history

**Missed (implicit):**
- Day passes without completion
- No instance created (or `completed: false`)
- DOES break streak
- Shows ❌ in history

**Use Cases:**
- Skip: "Feeling sick, skip workout today"
- Missed: Forgot to do it, genuine miss

---

### Rollover Behavior

**Rollover Enabled:**
- Missed occurrence stays visible in gallery
- Shows as overdue: "⚠️ Due 2 days ago"
- Remains visible until completed or skipped
- Only one instance visible (oldest incomplete)

**Rollover Disabled:**
- Missed occurrence auto-marks as missed
- Does not appear in gallery
- Breaks streak
- User can mark complete retroactively in history

**Recommendation:** Enable for must-do tasks (medication), disable for nice-to-have (journaling)

---

### Pause Functionality

**Pausing:**
1. User taps [Pause] in task detail
2. Modal appears: "Resume manually" or "Resume on [date]"
3. Sets `pausedAt` and optionally `pausedUntil`
4. Routine disappears from gallery
5. Shows in Routines tab with [Paused] badge
6. Banner in detail: "⏸️ Paused until..." with [Resume] button

**Resuming:**
1. User taps [Resume]
2. Clears `pausedAt` and `pausedUntil`
3. Routine reappears in gallery if due
4. Streak preserved (pause doesn't break streak)

---

## Visual Design

### Routine Card (Gallery)
```
┌─────────────────────────────────┐
│ ☐  Take morning meds         → │  80-90px height
│    🔁 Daily · 8:00 AM           │  Recurrence icon
│    12d streak                   │  Streak badge
└─────────────────────────────────┘
```

**Differentiation from One-Off Tasks:**
- Taller (one-off: ~60-70px, routine: ~80-90px)
- Recurrence icon 🔁
- Checkbox (routine) vs. circle (one-off)
- Subtle background tint or border accent

---

### History Icons

| Icon | Meaning | Description |
|------|---------|-------------|
| ✅ | Completed | User completed this occurrence |
| ❌ | Missed | Date passed, not completed, not skipped |
| ⏭️ | Skipped | User explicitly skipped |
| ⭕ | No Occurrence | Doesn't fall on this date per pattern |
| ⏸️ | Paused | Routine was paused this day |
| 🔵 | Today | Current date indicator |
| ⚠️ | Overdue | Not done, rollover enabled |

---

## Advanced Pattern Examples

### Daily Patterns
```typescript
// Every day
{ frequency: 'daily', interval: 1 }

// Every other day
{ frequency: 'daily', interval: 2 }

// Every 3 days
{ frequency: 'daily', interval: 3 }
```

### Weekly Patterns
```typescript
// Every Monday
{ frequency: 'weekly', interval: 1, daysOfWeek: [1] }

// Weekdays only
{ frequency: 'weekly', interval: 1, daysOfWeek: [1,2,3,4,5] }

// Mon, Wed, Fri
{ frequency: 'weekly', interval: 1, daysOfWeek: [1,3,5] }

// Every other Thursday
{ frequency: 'weekly', interval: 2, daysOfWeek: [4] }

// First Monday of month
{ frequency: 'weekly', interval: 1, daysOfWeek: [1], weekOfMonth: 1 }
```

### Monthly Patterns
```typescript
// 15th of each month
{ frequency: 'monthly', interval: 1, dayOfMonth: 15 }

// First Monday
{ frequency: 'monthly', interval: 1, daysOfWeek: [1], weekOfMonth: 1 }

// Every 3 months (quarterly)
{ frequency: 'monthly', interval: 3, dayOfMonth: 1 }
```

---

## ADHD-Specific Design Considerations

### Why These Choices Matter

**Spatial Organization:**
- Dedicated gallery space = consistent location (spatial memory)
- Separate from one-off tasks = clear mental model

**Visual Memory:**
- Title-only cards = rely on visual recognition, not reading
- Height differentiation = subconscious categorization
- Icon + color = multiple visual anchors

**Reduced Cognitive Load:**
- No decision fatigue: Just checkbox or skip
- Minimal text: Time and streak only
- Progressive disclosure: Details on demand

**Accountability Without Shame:**
- Streak visible but not punitive
- Skip option prevents guilt spirals
- History shows patterns without judgment

**Flexibility:**
- Additional steps = adapt to today's needs
- Early completion = work with energy spikes
- Pause = accommodate life changes

---

## Success Metrics

### User Engagement
- % of users who create at least one routine
- Average number of routines per user
- Daily active routines completed

### Habit Formation
- Average streak length
- Completion rate (completed / due)
- Retention: Still using after 30/60/90 days

### Feature Adoption
- % using additional steps
- % using history modal
- % using pause functionality

### Quality of Life
- User-reported improvement in habit adherence
- Reduction in missed medications/appointments
- Self-reported stress reduction

---

## Related Documentation

- `RECURRING_TASKS_DATA_MODEL.md` - Complete data structures
- `RECURRING_TASKS_IMPLEMENTATION_PLAN.md` - Development roadmap
- `RECURRING_TASKS_UI_SPECIFICATION.md` - Detailed UI specs
- `RECURRING_TASKS_UTILITIES.md` - Algorithms and functions
- `RECURRING_TASKS_CLAUDE_CODE_PROMPTS.md` - Implementation prompts
- `RECURRING_TASKS_TESTING.md` - Testing strategy
- `RECURRING_TASKS_FUTURE_ENHANCEMENTS.md` - Planned improvements
