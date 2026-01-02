# Focus Tools Implementation Checklist (Model E)

Quick reference for Claude Code sessions. Full prompts in `MULTI_TASK_PROMPTS.md`.

---

## Current Phase: Model E — Pool + Focus Queue

### Pre-Flight Check
- [ ] Focus Mode working? (Complete FOCUS_MODE_PROMPTS.md first if not)
- [ ] `CLAUDE.md` in project root? (rename from CLAUDE_CODE_CONTEXT_v2.md)
- [ ] Project runs with `npm run dev`?

---

## Workflow Model

```
INBOX → POOL → FOCUS QUEUE → COMPLETED
                    ↓
              PARKING LOT
```

| View | Purpose | Status Filter |
|------|---------|---------------|
| Inbox | Quick capture, triage | `inbox` |
| Pool | Browse available tasks | `pool` (not deferred) |
| Queue | Today/week commitments | `pool` + in queue |
| Completed | Finished tasks | `complete` |

---

## Implementation Order

### Day 1: Foundation (3-4 hrs)

**Prompt 1: Data Model** (~1.5 hr)
```
Update lib/types.ts with Model E data model...
```
- [ ] Task status: 'inbox' | 'pool' | 'complete' | 'archived'
- [ ] Task.completionType, archivedReason
- [ ] Task.waitingOn object (non-blocking flag)
- [ ] Task.deferredUntil, deferredAt, deferredCount
- [ ] Step: effort, estimateSource, firstFocusedAt, estimationAccuracy, context
- [ ] FocusQueue + FocusQueueItem (replaces DailyPlan)
- [ ] Nudge + SnoozedNudge types
- [ ] Updated EventType with queue/defer/nudge events
- [ ] FocusSession: queueItemId, selectionType, targetedStepIds
- [ ] AppState: currentView includes 'inbox' | 'pool' | 'queue'
- [ ] createTask, createStep, createFocusQueueItem helpers
- [ ] SCHEMA_VERSION = 2
- [ ] Compiles without errors

**Prompt 2: Storage & Utils** (~1 hr)
```
Create utility files for storage and event logging...
```
- [ ] lib/storage.ts with v1→v2 migration
- [ ] lib/events.ts with queueItemId support
- [ ] lib/utils.ts with focusScore, complexity, healthStatus
- [ ] lib/queue.ts with queue helpers
- [ ] lib/pool.ts with pool filters
- [ ] page.tsx uses new storage

**Prompt 3: Navigation Shell** (~0.5 hr)
```
Create navigation structure with view tabs...
```
- [ ] NavTabs component (Inbox | Pool | Queue)
- [ ] Tab badges show counts
- [ ] currentView routing works
- [ ] Default view is 'queue'

---

### Day 2: Core Views (5-6 hrs)

**Prompt 4: Inbox View** (~2 hr)
```
Create the Inbox view for quick capture and triage...
```
- [ ] QuickCapture creates inbox tasks
- [ ] InboxItem collapsed/expanded states
- [ ] Quick → Pool works
- [ ] Defer dropdown works
- [ ] Delete with undo toast
- [ ] Triage inline panel

**Prompt 5: Pool View** (~2 hr)
```
Create the Pool view for browsing tasks...
```
- [ ] Search bar filters tasks
- [ ] Sort by focusScore default
- [ ] Resurfaced section shows deferred items
- [ ] TaskRow with priority, progress, date
- [ ] Waiting On badge displays
- [ ] Add to Queue dropdown
- [ ] Click → TaskDetail

**Prompt 6: Queue View** (~2 hr)
```
Create the Focus Queue view (home)...
```
- [ ] Today section (prominent)
- [ ] This Week section
- [ ] Upcoming section
- [ ] QueueItem shows selection type + progress
- [ ] Time estimates per horizon
- [ ] Empty state with smart actions
- [ ] Focus button works

---

### Day 3: Detail & Selection (4-5 hrs)

**Prompt 7: Task Detail** (~2 hr)
```
Create the Task Detail view...
```
- [ ] Back button works
- [ ] Title editable
- [ ] Steps with estimates displayed
- [ ] Step completion works
- [ ] Metadata section (priority, dates)
- [ ] Add to Queue dropdown
- [ ] Focus button per step

**Prompt 8: Step Selection** (~1.5 hr)
```
Add step selection for Focus Queue...
```
- [ ] "Select steps..." option in dropdown
- [ ] StepSelector modal
- [ ] QueueItem shows "Steps 1-3 of 7"
- [ ] Edit selection works
- [ ] Completion logic respects selection

**Prompt 9: Focus Mode Integration** (~1.5 hr)
```
Connect Focus Mode to queue items...
```
- [ ] Enter from queue item
- [ ] Shows only in-scope steps
- [ ] Progress bar reflects selection
- [ ] "Focus goal complete" on selected done
- [ ] Session logs queueItemId
- [ ] Returns to queue on exit

---

### Day 4: Features & Polish (4-5 hrs)

**Prompt 10: Waiting On & Deferral** (~1.5 hr)
```
Implement Waiting On and Deferral...
```
- [ ] Waiting On field in TaskDetail
- [ ] Pool shows waiting badge
- [ ] Deferral hides from Pool
- [ ] Resurface on date

**Prompt 11: Nudges** (~2 hr)
```
Implement the ambient nudge system...
```
- [ ] Nudge generation logic
- [ ] NudgeBadge shows count
- [ ] NudgeDrawer lists pending
- [ ] Dismiss/snooze/action work

**Prompt 12: Polish + PWA** (~2 hr)
```
Add polish and PWA support...
```
- [ ] Toast system
- [ ] Keyboard shortcuts
- [ ] Calm empty states
- [ ] manifest.json
- [ ] Service worker
- [ ] Mobile touch targets

---

## Verification Commands

```bash
# Run dev server
npm run dev

# Check TypeScript
npx tsc --noEmit

# Check localStorage (browser console)
JSON.parse(localStorage.getItem('focus-tools-state'))
JSON.parse(localStorage.getItem('focus-tools-events'))

# Build for PWA testing
npm run build && npx serve out

# Lighthouse audit
# Chrome DevTools → Lighthouse → PWA
```

---

## Key Files Reference

| File | Should Contain |
|------|----------------|
| `lib/types.ts` | Task, Step, FocusQueue, FocusQueueItem, Nudge, AppState |
| `lib/storage.ts` | saveState, loadState, migrateState (v1→v2) |
| `lib/queue.ts` | isQueueItemComplete, getQueueItemEstimate |
| `lib/pool.ts` | getPoolTasks, getResurfacedTasks |
| `app/page.tsx` | Main state, CRUD handlers, view routing |
| `components/navigation/NavTabs.tsx` | Tab navigation |
| `components/inbox/InboxView.tsx` | Capture + triage |
| `components/pool/PoolView.tsx` | Browse + search |
| `components/queue/QueueView.tsx` | Home view |
| `components/task-detail/TaskDetail.tsx` | Task editing |
| `components/shared/StepSelector.tsx` | Step multi-select |

---

## Quick Wins If Stuck

- **Types not working?** Run `npx tsc --noEmit`
- **State not persisting?** Check migration logic in storage.ts
- **Queue not showing tasks?** Verify FocusQueueItem.taskId matches
- **Step selection broken?** Check selectionType and selectedStepIds
- **Focus mode wrong steps?** Verify targetedStepIds in session

---

## Testing Flows

### Flow 1: Capture to Complete
1. Create task via QuickCapture → appears in Inbox
2. Triage: add title, description, steps
3. Send to Pool → appears in Pool
4. Add to Queue (Today) → appears in Queue
5. Focus → complete steps → exit
6. All done → task complete

### Flow 2: Step Selection
1. Create task with 5 steps
2. Add to Queue → select steps 2, 3, 4 only
3. Queue shows "Steps 2-4 of 5"
4. Focus → only those 3 steps visible
5. Complete them → queue item done
6. Task detail shows steps 1, 5 still incomplete

### Flow 3: Defer and Resurface
1. Task in Pool
2. Defer 1 week
3. Task disappears from Pool
4. (Simulate date) → appears in Resurfaced
5. Add to Queue → normal flow

### Flow 4: Waiting On
1. Task in Pool
2. Set "Waiting on: Sarah"
3. Badge shows in Pool
4. Add to Queue anyway
5. Focus → info banner but can proceed
6. Mark received → clears waiting

---

## Model E Key Concepts

| Concept | Implementation |
|---------|----------------|
| Pool vs Active | `status: 'pool'` instead of `'active'` |
| Focus Queue | Single `FocusQueue` with horizons, not daily plans |
| Step Selection | `selectionType` + `selectedStepIds` on queue item |
| Waiting On | `waitingOn` object (non-blocking) |
| Deferral | `deferredUntil` field, hidden from Pool |
| Completion | `completionType: 'step_based' \| 'manual'` |
| Time Estimates | Step.estimatedMinutes + Step.estimateSource |

---

## After Completion

Full integration test:
1. Inbox capture → triage → Pool ✓
2. Pool search/sort/filter ✓
3. Add to Queue (entire task) ✓
4. Add to Queue (specific steps) ✓
5. Focus from Queue → complete → exit ✓
6. Waiting On flow ✓
7. Defer → resurface flow ✓
8. Nudges appear ✓
9. PWA installs on phone ✓
10. Data persists on refresh ✓

**Then:** Test on actual iPhone for 2+ weeks before backend.
