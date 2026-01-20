# Recurring Tasks - Testing Strategy

## Overview

Comprehensive testing strategy for recurring tasks including unit tests, integration tests, and manual test checklists.

---

## Unit Tests

### Pattern Matching Tests

Located in: `lib/__tests__/recurring-utils.test.ts`

```typescript
describe('dateMatchesPattern', () => {
  const startDate = new Date('2025-01-01');
  
  describe('daily patterns', () => {
    test('every day (interval 1)', () => {
      const pattern = {
        frequency: 'daily' as const,
        interval: 1,
        /* ... other required fields ... */
      };
      
      expect(dateMatchesPattern(new Date('2025-01-01'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-01-02'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-01-15'), pattern, startDate)).toBe(true);
    });
    
    test('every other day (interval 2)', () => {
      const pattern = {
        frequency: 'daily' as const,
        interval: 2,
      };
      
      expect(dateMatchesPattern(new Date('2025-01-01'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-01-02'), pattern, startDate)).toBe(false);
      expect(dateMatchesPattern(new Date('2025-01-03'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-01-04'), pattern, startDate)).toBe(false);
    });
    
    test('every 3 days', () => {
      const pattern = { frequency: 'daily' as const, interval: 3 };
      
      expect(dateMatchesPattern(new Date('2025-01-01'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-01-02'), pattern, startDate)).toBe(false);
      expect(dateMatchesPattern(new Date('2025-01-03'), pattern, startDate)).toBe(false);
      expect(dateMatchesPattern(new Date('2025-01-04'), pattern, startDate)).toBe(true);
    });
  });
  
  describe('weekly patterns', () => {
    test('every Monday', () => {
      const pattern = {
        frequency: 'weekly' as const,
        interval: 1,
        daysOfWeek: [1], // Monday
      };
      
      expect(dateMatchesPattern(new Date('2025-01-06'), pattern, startDate)).toBe(true);  // Mon
      expect(dateMatchesPattern(new Date('2025-01-07'), pattern, startDate)).toBe(false); // Tue
      expect(dateMatchesPattern(new Date('2025-01-13'), pattern, startDate)).toBe(true);  // Mon
    });
    
    test('weekdays only (Mon-Fri)', () => {
      const pattern = {
        frequency: 'weekly' as const,
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5],
      };
      
      expect(dateMatchesPattern(new Date('2025-01-06'), pattern, startDate)).toBe(true);  // Mon
      expect(dateMatchesPattern(new Date('2025-01-07'), pattern, startDate)).toBe(true);  // Tue
      expect(dateMatchesPattern(new Date('2025-01-10'), pattern, startDate)).toBe(true);  // Fri
      expect(dateMatchesPattern(new Date('2025-01-11'), pattern, startDate)).toBe(false); // Sat
      expect(dateMatchesPattern(new Date('2025-01-12'), pattern, startDate)).toBe(false); // Sun
    });
    
    test('Mon, Wed, Fri', () => {
      const pattern = {
        frequency: 'weekly' as const,
        interval: 1,
        daysOfWeek: [1, 3, 5],
      };
      
      expect(dateMatchesPattern(new Date('2025-01-06'), pattern, startDate)).toBe(true);  // Mon
      expect(dateMatchesPattern(new Date('2025-01-07'), pattern, startDate)).toBe(false); // Tue
      expect(dateMatchesPattern(new Date('2025-01-08'), pattern, startDate)).toBe(true);  // Wed
      expect(dateMatchesPattern(new Date('2025-01-09'), pattern, startDate)).toBe(false); // Thu
      expect(dateMatchesPattern(new Date('2025-01-10'), pattern, startDate)).toBe(true);  // Fri
    });
    
    test('every other Thursday', () => {
      const pattern = {
        frequency: 'weekly' as const,
        interval: 2,
        daysOfWeek: [4],
      };
      
      expect(dateMatchesPattern(new Date('2025-01-02'), pattern, startDate)).toBe(true);  // Thu (week 1)
      expect(dateMatchesPattern(new Date('2025-01-09'), pattern, startDate)).toBe(false); // Thu (week 2)
      expect(dateMatchesPattern(new Date('2025-01-16'), pattern, startDate)).toBe(true);  // Thu (week 3)
    });
    
    test('first Monday of month', () => {
      const pattern = {
        frequency: 'weekly' as const,
        interval: 1,
        daysOfWeek: [1],
        weekOfMonth: 1,
      };
      
      expect(dateMatchesPattern(new Date('2025-01-06'), pattern, startDate)).toBe(true);  // First Mon
      expect(dateMatchesPattern(new Date('2025-01-13'), pattern, startDate)).toBe(false); // Second Mon
      expect(dateMatchesPattern(new Date('2025-02-03'), pattern, startDate)).toBe(true);  // First Mon Feb
    });
  });
  
  describe('monthly patterns', () => {
    test('15th of each month', () => {
      const pattern = {
        frequency: 'monthly' as const,
        interval: 1,
        dayOfMonth: 15,
      };
      
      expect(dateMatchesPattern(new Date('2025-01-15'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-01-14'), pattern, startDate)).toBe(false);
      expect(dateMatchesPattern(new Date('2025-02-15'), pattern, startDate)).toBe(true);
    });
    
    test('first Monday of month', () => {
      const pattern = {
        frequency: 'monthly' as const,
        interval: 1,
        daysOfWeek: [1],
        weekOfMonth: 1,
      };
      
      expect(dateMatchesPattern(new Date('2025-01-06'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-02-03'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-03-03'), pattern, startDate)).toBe(true);
    });
    
    test('every 3 months (quarterly)', () => {
      const pattern = {
        frequency: 'monthly' as const,
        interval: 3,
        dayOfMonth: 1,
      };
      
      expect(dateMatchesPattern(new Date('2025-01-01'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-02-01'), pattern, startDate)).toBe(false);
      expect(dateMatchesPattern(new Date('2025-03-01'), pattern, startDate)).toBe(false);
      expect(dateMatchesPattern(new Date('2025-04-01'), pattern, startDate)).toBe(true);
    });
  });
  
  describe('end conditions', () => {
    test('respects endDate', () => {
      const pattern = {
        frequency: 'daily' as const,
        interval: 1,
        endDate: '2025-01-10',
      };
      
      expect(dateMatchesPattern(new Date('2025-01-09'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-01-10'), pattern, startDate)).toBe(true);
      expect(dateMatchesPattern(new Date('2025-01-11'), pattern, startDate)).toBe(false);
    });
  });
});
```

### Streak Calculation Tests

```typescript
describe('calculateStreak', () => {
  const dayStartHour = 5;
  
  test('perfect daily streak', () => {
    const task = createMockTask({
      recurrence: { frequency: 'daily', interval: 1 },
      recurringInstances: [
        { date: '2025-01-17', completed: true, routineSteps: [], additionalSteps: [] },
        { date: '2025-01-16', completed: true, routineSteps: [], additionalSteps: [] },
        { date: '2025-01-15', completed: true, routineSteps: [], additionalSteps: [] },
      ],
      createdAt: '2025-01-15T00:00:00Z',
    });
    
    expect(calculateStreak(task, dayStartHour)).toBe(3);
  });
  
  test('broken streak resets', () => {
    const task = createMockTask({
      recurrence: { frequency: 'daily', interval: 1 },
      recurringInstances: [
        { date: '2025-01-17', completed: true, routineSteps: [], additionalSteps: [] },
        { date: '2025-01-16', completed: true, routineSteps: [], additionalSteps: [] },
        { date: '2025-01-15', completed: false, routineSteps: [], additionalSteps: [] }, // Missed
        { date: '2025-01-14', completed: true, routineSteps: [], additionalSteps: [] },
      ],
      createdAt: '2025-01-14T00:00:00Z',
    });
    
    expect(calculateStreak(task, dayStartHour)).toBe(2);
  });
  
  test('skipped does not break streak', () => {
    const task = createMockTask({
      recurrence: { frequency: 'daily', interval: 1 },
      recurringInstances: [
        { date: '2025-01-17', completed: true, skipped: false, routineSteps: [], additionalSteps: [] },
        { date: '2025-01-16', completed: false, skipped: true, routineSteps: [], additionalSteps: [] }, // Skipped
        { date: '2025-01-15', completed: true, skipped: false, routineSteps: [], additionalSteps: [] },
      ],
      createdAt: '2025-01-15T00:00:00Z',
    });
    
    expect(calculateStreak(task, dayStartHour)).toBe(3); // Skip doesn't break
  });
  
  test('weekly pattern streak', () => {
    const task = createMockTask({
      recurrence: { frequency: 'weekly', interval: 1, daysOfWeek: [4] },
      recurringInstances: [
        { date: '2025-01-16', completed: true, routineSteps: [], additionalSteps: [] }, // Thu
        { date: '2025-01-09', completed: true, routineSteps: [], additionalSteps: [] }, // Thu
        { date: '2025-01-02', completed: true, routineSteps: [], additionalSteps: [] }, // Thu
      ],
      createdAt: '2025-01-02T00:00:00Z',
    });
    
    expect(calculateStreak(task, dayStartHour)).toBe(3);
  });
  
  test('day-start time affects streak', () => {
    // Complete at 12:15 AM (after midnight, before 5am)
    // Should count for previous day
    const task = createMockTask({
      recurrence: { frequency: 'daily', interval: 1 },
      recurringInstances: [
        { date: '2025-01-17', completed: true, completedAt: new Date('2025-01-18T00:15:00Z').getTime(), routineSteps: [], additionalSteps: [] },
        { date: '2025-01-16', completed: true, routineSteps: [], additionalSteps: [] },
      ],
      createdAt: '2025-01-16T00:00:00Z',
    });
    
    // getTodayISO with dayStartHour=5 at 12:15am returns previous day
    expect(calculateStreak(task, 5)).toBe(2);
  });
});
```

### Instance Management Tests

```typescript
describe('instance management', () => {
  test('ensureInstance creates new instance with snapshot', () => {
    const task = createMockTask({
      steps: [
        { id: 'step-1', text: 'Original', completed: false },
      ],
      recurringInstances: [],
    });
    
    const instance = ensureInstance(task, '2025-01-17');
    
    expect(instance.date).toBe('2025-01-17');
    expect(instance.routineSteps.length).toBe(1);
    expect(instance.routineSteps[0].text).toBe('Original');
    expect(instance.routineSteps[0].id).not.toBe('step-1'); // New ID
  });
  
  test('template changes do not affect past instances', () => {
    const task = createMockTask({
      steps: [
        { id: 'step-1', text: 'Step 1', completed: false },
        { id: 'step-2', text: 'Step 2', completed: false },
        { id: 'step-3', text: 'Step 3', completed: false },
      ],
      recurringInstances: [],
    });
    
    // Create instance for Jan 15
    const jan15 = ensureInstance(task, '2025-01-15');
    expect(jan15.routineSteps.length).toBe(3);
    
    // Add step to template
    task.steps.push({ id: 'step-4', text: 'Step 4', completed: false });
    
    // Jan 15 instance unchanged
    expect(jan15.routineSteps.length).toBe(3);
    
    // New instance has 4 steps
    const jan18 = ensureInstance(task, '2025-01-18');
    expect(jan18.routineSteps.length).toBe(4);
  });
});
```

---

## Integration Tests

### Completion Flow Test

```typescript
describe('routine completion flow', () => {
  test('completing routine updates all metadata', () => {
    const task = createRecurringTask({
      recurrence: { frequency: 'daily', interval: 1 },
    });
    
    const today = getTodayISO(5);
    
    // Complete routine
    markInstanceComplete(task, today, 5);
    
    // Verify metadata
    expect(task.recurringLastCompleted).toBe(today);
    expect(task.recurringStreak).toBe(1);
    expect(task.recurringTotalCompletions).toBe(1);
    expect(task.recurringNextDue).toBe('2025-01-18');
    
    // Verify instance
    const instance = task.recurringInstances.find(i => i.date === today);
    expect(instance?.completed).toBe(true);
    expect(instance?.routineSteps.every(s => s.completed)).toBe(true);
  });
});
```

---

## Manual Testing Checklist

### Gallery Display
- [ ] Routines appear when due today
- [ ] Cards show correct title, time, streak
- [ ] Horizontal scroll works smoothly (2 cards mobile, 3-4 tablet)
- [ ] Peek affordance visible on right edge
- [ ] Overdue routines show ⚠️ icon and "Due X days ago"
- [ ] Completed routines animate out and disappear
- [ ] Empty state: section doesn't render if no routines

### Completion Flow
- [ ] Tap checkbox → popover appears with Complete/Skip
- [ ] Tap Complete → streak updates, card disappears, toast shows
- [ ] Tap Skip → skipped instance created, streak resets
- [ ] Undo toast appears after completion
- [ ] Undo restores card and previous streak
- [ ] Completing with steps: all steps marked complete
- [ ] Completing overdue: resets streak to 1

### Routines Management (Tasks View Tab)
- [ ] "Routines" tab appears after Staging
- [ ] All recurring tasks listed
- [ ] Grouped correctly (Daily/Weekly/Monthly)
- [ ] Section headers collapsible
- [ ] Pills show: streak, last completed, next due
- [ ] Color coding: green (today), amber (3-7 days), red (8+ days)
- [ ] Paused routines show [Paused] badge
- [ ] Tap row opens task detail
- [ ] Empty state shows guidance text

### Task Detail - Recurring Mode
- [ ] Toggle "Recurring" ON → recurrence fields appear
- [ ] Configure daily pattern → works correctly
- [ ] Configure weekly (specific days) → works
- [ ] Configure monthly (day of month) → works
- [ ] Configure monthly (first Monday) → works
- [ ] Pattern description updates: "Daily at 8:00 AM"
- [ ] Routine Steps section displays
- [ ] Additional Steps section displays with date
- [ ] Add step → goes to Additional by default
- [ ] Check routine step → instance.routineSteps[i].completed = true
- [ ] Check additional step → instance.additionalSteps[i].completed = true
- [ ] All steps complete → instance marked complete, metadata updates
- [ ] Edit Template button opens modal
- [ ] Top buttons show: Complete, Skip (in kebab), History
- [ ] Bottom buttons: Pause (not Defer)
- [ ] Hidden fields: Priority, Target, Deadline

### Edit Template Modal
- [ ] Opens when Edit Template clicked
- [ ] Shows all steps (routine + additional)
- [ ] Routine steps: checkbox checked, labeled "Template"
- [ ] Additional steps: checkbox unchecked, labeled "Additional"
- [ ] Check additional step → promotes to template
- [ ] Uncheck routine step → demotes to additional
- [ ] Summary shows count: "3 steps in template · 1 additional"
- [ ] Save updates task.steps and instance.additionalSteps
- [ ] Cancel discards changes

### History Modal
- [ ] History button opens modal
- [ ] Responsive: drawer (mobile), modal (desktop)
- [ ] Stats row shows: current streak, best, total
- [ ] Month calendar displays correctly
- [ ] Icons show proper status: ✅ ❌ ⏭️ ⭕ ⏸️
- [ ] Navigate between months with arrows
- [ ] Tap week row → zooms into week view
- [ ] Week view shows 7 days enlarged
- [ ] Tap date in week → details appear below
- [ ] Details show: status text, notes (if any)
- [ ] Past date: can mark complete/skipped
- [ ] Mark complete → creates/updates instance, recalculates streak
- [ ] Mark skipped → creates skipped instance
- [ ] Future dates: not interactable
- [ ] Back button returns to month view

### Pattern Matching Edge Cases
- [ ] Every day: matches all dates
- [ ] Every other day: alternates correctly
- [ ] Every 3 days: correct spacing
- [ ] Weekdays only (Mon-Fri): skips weekends
- [ ] Mon, Wed, Fri: only those days
- [ ] Every Thursday: only Thursdays
- [ ] Every other Thursday: correct weeks
- [ ] First Monday of month: correct week
- [ ] 15th of month: correct day
- [ ] Quarterly (every 3 months): correct months

### Streak Calculation
- [ ] Perfect daily streak: counts correctly
- [ ] Broken by missed day: resets
- [ ] Skipped day: doesn't break streak
- [ ] Weekly pattern: counts weeks not days
- [ ] Monthly pattern: counts months
- [ ] Day-start time: completion at 12:15 AM counts for previous day
- [ ] Best streak tracked separately
- [ ] Total completions increments

### Pause/Resume
- [ ] Pause button in bottom row
- [ ] Click pause → modal opens
- [ ] Option: Resume manually
- [ ] Option: Resume on [date]
- [ ] Paused routine disappears from gallery
- [ ] Paused routine shows in Routines tab with badge
- [ ] Task detail shows pause banner with date
- [ ] Resume clears pause, routine reappears
- [ ] Pause doesn't break streak

### Day-Start Time
- [ ] Default: 5am
- [ ] Completion at 12:15 AM (before 5am): counts for previous day
- [ ] Completion at 5:01 AM: counts for current day
- [ ] getTodayISO respects setting throughout app
- [ ] Streak calculation uses day-start time

### Storage & Performance
- [ ] Storage size acceptable (<2MB for heavy use)
- [ ] Pruning runs after completion
- [ ] Old instances (>90 days) pruned to just id + completion
- [ ] Recent instances (≤90 days) retain full data
- [ ] Performance acceptable with 50+ routines
- [ ] No lag in UI with 100+ instances
- [ ] Page load fast with recurring data

### Error Handling
- [ ] Invalid pattern: validation prevents save
- [ ] Save button disabled if validation fails
- [ ] Try/catch around all operations
- [ ] Toast on errors
- [ ] Console errors helpful for debugging
- [ ] App doesn't crash on bad data

---

## Regression Testing

After implementing recurring tasks, verify existing functionality still works:

### One-Off Tasks
- [ ] Can create one-off task
- [ ] Steps work normally
- [ ] Focus mode works
- [ ] Target/Deadline dates work
- [ ] Priority works
- [ ] Move to Ready works
- [ ] Add to Queue works
- [ ] Defer works

### Focus Queue
- [ ] TODAY section displays
- [ ] THIS WEEK section displays
- [ ] UPCOMING section displays
- [ ] Dragging tasks works
- [ ] Focus mode launches

### Tasks View
- [ ] All tabs work (Focus, Staging, Inbox, Pool, etc.)
- [ ] Filtering works
- [ ] Search works
- [ ] Task rows render correctly

### Task Detail
- [ ] Non-recurring tasks show normal fields
- [ ] Steps editable
- [ ] Edit Focus modal works
- [ ] AI breakdown works
- [ ] Notes section works

---

## Performance Benchmarks

### Target Metrics
- Page load: <1s with 100 tasks (10 recurring)
- Routine completion: <200ms
- History modal open: <500ms
- Calendar generation: <100ms for 30 days

### Load Testing
Test with:
- 10 daily routines × 365 days = 3650 instances
- 5 weekly routines × 52 weeks = 260 instances
- 3 monthly routines × 12 months = 36 instances

Total: ~4000 instances

Expected:
- Storage: ~1.5MB
- Load time: <2s
- No UI lag

---

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announces routine completions
- [ ] Color not sole indicator (icons + text)
- [ ] Focus indicators visible
- [ ] Touch targets ≥44px
- [ ] Text readable at 200% zoom

---

## Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Related Documentation

- `RECURRING_TASKS_IMPLEMENTATION_PLAN.md` - Implementation phases
- `RECURRING_TASKS_CLAUDE_CODE_PROMPTS.md` - Implementation prompts
- `RECURRING_TASKS_DATA_MODEL.md` - Data structures
