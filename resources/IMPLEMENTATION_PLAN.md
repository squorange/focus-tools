# Implementation Plan: Bug Fixes, Enhancements, & Design System

**Generated:** January 20, 2026
**Total Estimated Phases:** 7 (~30-60 min each)

---

## Analysis & Feedback

### Bug Fixes Assessment

| Bug | Severity | Complexity | Notes |
|-----|----------|------------|-------|
| Time estimates showing random chars | High | Medium | Likely API response parsing issue - `estimatedMinutes` may be receiving malformed data. Need to trace from `route.ts` → `StagingArea.tsx`. Could be a type mismatch or serialization issue. |
| Staging → recurring task steps not updating | High | Low | `handleAcceptWithScope` looks correct at first glance (lines 3735-3800 in page.tsx). Issue is likely that `getActiveStaging()` returns wrong task's staging, or instance isn't being created properly. |
| Mobile toasts missing padding | Low | Trivial | `ToastContainer` (line 101 in Toast.tsx) just uses `flex flex-col gap-2` with no horizontal padding. Add `px-4` to container. |
| Recurring step reordering broken | Medium | Medium | `handleMoveStepUp/Down` only operates on `task.steps`. For recurring tasks, we need to also handle `instance.routineSteps` and `instance.additionalSteps`. |
| Edit template modal too tall | Low | Low | Current: `max-h-[80vh]`. FocusSelectionModal uses same pattern and looks fine. Issue may be content structure, not height. Suggest deferring until edit focus modal is redesigned. |
| Today → Upcoming on step completion | Medium | Medium | Need to add detection logic: if all "today" selectedStepIds are complete but task has more incomplete steps, move queue item horizon or update selection. |

### Enhancements Assessment

| Enhancement | Effort | Value | Recommendation |
|-------------|--------|-------|----------------|
| Refactor task details layout | High | High | **Phase separately** - This is a substantial UX change. Suggest prototyping first before full implementation. Could take 2+ phases. |
| Routine cards streak display | Low | Medium | Good refinement. Pattern already exists in RoutineCard (`⚡#`). Need to add kebab menu (currently chevron or none). |
| Tasks tab quick-switch to staging | Low | Medium | Simple state check in `handleViewChange` or tab click handler. |
| Edit focus modal simplification | High | High | **Substantial change** - Current modal works but is complex. Inline Today/Upcoming toggles would be cleaner. Suggest prototyping approach first. Bottom drawer for mobile is good idea. |

### Design System Assessment

| Item | Effort | Value | Recommendation |
|------|--------|-------|----------------|
| Storybook setup | Medium | High | Good investment for long-term maintenance. Next.js + Tailwind + Storybook is well-documented. |
| Unify task row styling | Medium | High | Currently have: `TaskRow.tsx`, `QueueItem.tsx`, `InboxItem.tsx`, `TriageRow.tsx`. Should extract shared `BaseTaskRow` component. |
| Align recurring card styling | Low | Medium | `RoutineCard.tsx` vs `TaskRow.tsx` - harmonize border/bg/hover states. |

---

## Phased Implementation

### Phase 1: Critical Bug Fixes (30 min)
**Deliverable:** Core bugs resolved, staging works for recurring tasks

| Task | Files | Notes |
|------|-------|-------|
| Fix toast mobile padding | `components/shared/Toast.tsx` | Add `px-4` to `ToastContainer` wrapper |
| Debug time estimate display | `app/api/structure/route.ts`, `StagingArea.tsx` | Add console.log to trace `estimatedMinutes` value through pipeline |
| Fix recurring staging acceptance | `app/page.tsx` | Debug `handleAcceptWithScope` - verify `getActiveStaging()` returns correct data |

**Approach for time estimates bug:**
1. Add logging in `route.ts` around line 414 where `estimatedMinutes` is set
2. Check if AI returns string like `"~30 min"` instead of `30`
3. Check `cleanStepText()` function at line 211 - may be corrupting the field
4. Add type guard in StagingArea before calling `formatDuration()`

---

### Phase 2: Recurring Task Step Handling (45 min)
**Deliverable:** Step reordering works for routines, proper step scope handling

| Task | Files | Notes |
|------|-------|-------|
| Add recurring step reorder handlers | `app/page.tsx` | Create `handleMoveRoutineStepUp/Down` that updates `instance.routineSteps` or `instance.additionalSteps` |
| Update TaskDetail to use correct handlers | `TaskDetail.tsx` | Conditionally call routine handlers when `isRecurring` |
| Test instance step isolation | Manual testing | Verify reordering one instance doesn't affect template |

**Approach:**
```typescript
// New handler needed in page.tsx
const handleMoveRoutineStepUp = useCallback((taskId: string, stepId: string, source: 'routine' | 'additional') => {
  // Find active date, get instance, reorder within correct array
});
```

---

### Phase 3: Queue Intelligence (45 min)
**Deliverable:** Partial completions handled correctly in Today/Upcoming

| Task | Files | Notes |
|------|-------|-------|
| Add step completion detection | `app/page.tsx` | In `handleStepComplete`, check if all "today" steps are done |
| Implement horizon adjustment | `app/page.tsx` | Move remaining incomplete steps to Upcoming when Today portion done |
| Add visual indicator | `QueueItem.tsx` | Show "Partially complete" or adjust progress display |

**Approach:**
```typescript
// After step completion, check:
const queueItem = queue.items.find(i => i.taskId === taskId);
if (queueItem && queueItem.selectionType === 'specific_steps') {
  const todayStepIds = queueItem.selectedStepIds;
  const allTodayComplete = todayStepIds.every(id =>
    task.steps.find(s => s.id === id)?.completed
  );
  if (allTodayComplete && task.steps.some(s => !s.completed)) {
    // Option A: Clear selectedStepIds (moves to Upcoming)
    // Option B: Auto-select next incomplete steps for Tomorrow
    // Option C: Show toast asking user what to do
  }
}
```

**Concern:** Need to define exact UX - should we auto-move, ask user, or just update visual state?

---

### Phase 4: UI Quick Wins (30 min)
**Deliverable:** Polish items that improve daily use

| Task | Files | Notes |
|------|-------|-------|
| Tasks tab quick-switch to staging | `app/page.tsx` or `Header.tsx` | When on tasks view + not on staging tab, tap tasks → staging |
| Routine cards add kebab menu | `RoutineCard.tsx` | Replace chevron with kebab, match TaskRow pattern |
| Verify streak display | `RoutineCard.tsx` | Already uses `⚡#` pattern - verify consistency |

**Implementation for quick-switch:**
```typescript
// In tab click handler:
if (view === 'tasks' && currentView === 'tasks' && activeTasksTab !== 'staging') {
  setActiveTasksTab('staging');
  return; // Don't navigate, just switch tab
}
```

---

### Phase 5: Design System Foundation (60 min)
**Deliverable:** Storybook running with first components

| Task | Files | Notes |
|------|-------|-------|
| Install Storybook | `package.json`, config files | `npx storybook@latest init` |
| Configure for Next.js + Tailwind | `.storybook/` | Add Tailwind CSS support |
| Add first stories | `*.stories.tsx` | Start with simple: Button variants, MetadataPill, HealthPill |
| Document color tokens | Story or doc | Capture violet/zinc/green/amber palette |

**Storybook benefits:**
- Visual regression testing
- Component documentation
- Design review workflow
- Isolated development

---

### Phase 6: Task Row Unification (45 min)
**Deliverable:** Shared component for all task rows

| Task | Files | Notes |
|------|-------|-------|
| Analyze current row variants | `TaskRow`, `QueueItem`, `InboxItem`, `TriageRow` | Document shared vs unique props |
| Create BaseTaskRow component | `components/shared/BaseTaskRow.tsx` | Extract common: title, progress, metadata, actions |
| Define structured prop types | `lib/types.ts` | `TaskRowVariant = 'queue' | 'pool' | 'inbox' | 'search'` |
| Migrate one component | `TaskRow.tsx` | Use BaseTaskRow, verify no regressions |

**Shared patterns to extract:**
- Title with line-clamp
- Progress indicator (ring or text)
- Metadata pills (health, dates, waiting)
- Kebab menu positioning
- Hover states

---

### Phase 7: Modal Refinement (45-60 min)
**Deliverable:** Improved Edit Focus modal, aligned Edit Template

| Task | Files | Notes |
|------|-------|-------|
| Redesign Edit Focus modal | `FocusSelectionModal.tsx` | Inline Today/Upcoming toggles per step instead of checkboxes |
| Add mobile bottom drawer | `FocusSelectionModal.tsx` | Detect mobile, use bottom sheet pattern |
| Align Edit Template to match | `EditTemplateModal.tsx` | Use same visual language as Edit Focus |
| Test both modals | Manual testing | Verify UX improvements |

**Proposed Edit Focus UX:**
```
┌────────────────────────────────────────────┐
│ Edit Focus                             Done│
├────────────────────────────────────────────┤
│ ○ Step 1 text                   [Today ▾] │
│ ○ Step 2 text                [Upcoming ▾] │
│ ✓ Step 3 text (completed)                 │
│ ○ Step 4 text                   [Today ▾] │
└────────────────────────────────────────────┘
```

**Labels for Edit Template (routine scope):**
- "Template" = applies to all future occurrences
- "Just today" or "This time" = instance-only

---

## Deferred Items

### Task Details Layout Refactor
**Recommendation:** Separate dedicated session(s)

This is a significant UX change that needs:
1. Design exploration / wireframing
2. User testing considerations
3. Multiple component changes

Current layout:
```
[Back] [Title] [Actions]
[StatusModule]
[Steps Section]
[Notes]
[Details (expandable)]
```

Proposed exploration:
```
[Back] [Title] [Actions]
[Unified Status+Details Bar] ← collapse into single smart section
[Steps Section]
[Notes]
```

**Questions to resolve:**
- What info is "always visible" vs "expand to see"?
- How to handle tasks with no steps (just notes)?
- Mobile vs desktop layouts?

---

## Dependencies

```
Phase 1 ──► Phase 2 ──► Phase 3
              ↓
Phase 4 (independent)
              ↓
Phase 5 ──► Phase 6
              ↓
Phase 7 (can start after Phase 4)
```

**Parallel opportunities:**
- Phase 4 + Phase 5 can run in parallel
- Phase 6 depends on Phase 5 (Storybook for testing)
- Phase 7 can start anytime after Phase 4

---

## Testing Checklist

### Phase 1
- [ ] Toasts have proper side padding on mobile
- [ ] Time estimates display correctly (e.g., "~30m", "1h 15m")
- [ ] Accept suggestion in recurring task → steps appear in instance

### Phase 2
- [ ] Reorder routine steps up/down works
- [ ] Reorder additional steps up/down works
- [ ] Reordering one instance doesn't affect template
- [ ] Reordering one instance doesn't affect other instances

### Phase 3
- [ ] Complete all Today steps → task moves to Upcoming (or UX defined)
- [ ] Partial completion shows correct progress
- [ ] Queue view reflects current state accurately

### Phase 4
- [ ] Double-tap Tasks when on Tasks view → switches to Staging tab
- [ ] Routine cards have kebab menu
- [ ] Streak displays as `⚡N` consistently

### Phase 5
- [ ] Storybook runs at `npm run storybook`
- [ ] Tailwind styles work in stories
- [ ] Dark mode toggle works in Storybook

### Phase 6
- [ ] TaskRow uses BaseTaskRow
- [ ] No visual regressions in Pool view
- [ ] Props are typed correctly

### Phase 7
- [ ] Edit Focus has inline toggles
- [ ] Mobile shows bottom drawer
- [ ] Edit Template matches Edit Focus style
- [ ] Saving preserves correct scope (template vs instance)

---

## Open Questions

1. **Phase 3 UX:** When Today steps are complete but Upcoming remain, should we:
   - Auto-move queue item to Upcoming?
   - Show a prompt asking what to do?
   - Keep as-is but change visual state?

2. **Phase 7 Labels:** For Edit Template modal scopes:
   - "Template" vs "Routine" for permanent changes?
   - "Just today" vs "This time" vs "Instance" for one-off?

3. **Task Details Refactor:** Worth prototyping first or dive straight in?
