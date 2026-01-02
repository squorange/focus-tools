# Multi-Task Implementation Prompts for Claude Code (Model E)

Use these prompts in sequence to build the Pool + Focus Queue workflow. Each prompt builds on the previous work.

**Prerequisites:** Focus Mode should be working before starting this phase.

**Workflow Overview:**
```
INBOX → POOL → FOCUS QUEUE → COMPLETED
                    ↓
              PARKING LOT
```

---

## Prompt 1: Update Data Model & Types

```
Read CLAUDE.md for project context, specifically the "Data Model" section.

Update lib/types.ts with the Model E data model:

1. Update Task interface:
   - Change status type to: 'inbox' | 'pool' | 'complete' | 'archived'
   - Add completionType: 'step_based' | 'manual'
   - Add archivedReason: 'completed_naturally' | 'abandoned' | 'parked' | 'duplicate' | null
   - Add waitingOn object: { who: string, since: number, followUpDate: string | null, notes: string | null } | null
   - Add deferral fields: deferredUntil (string | null), deferredAt (number | null), deferredCount (number)
   - Keep all existing fields (priority, tags, dates, effort, intelligence fields, etc.)

2. Update Step interface:
   - Add effort: 'quick' | 'medium' | 'deep' | null
   - Add estimateSource: 'user' | 'ai' | null
   - Add firstFocusedAt: number | null
   - Add estimationAccuracy: number | null
   - Add context: string | null
   - Keep existing: id, text, shortLabel, substeps, completed, completedAt, estimatedMinutes, timeSpent, timesStuck, source, wasEdited, complexity

3. Replace DailyPlan with FocusQueue:
   - FocusQueue interface: items: FocusQueueItem[], lastReviewedAt: number
   - FocusQueueItem interface:
     - id, taskId
     - selectionType: 'entire_task' | 'specific_steps'
     - selectedStepIds: string[]
     - horizon: 'today' | 'this_week' | 'upcoming'
     - scheduledDate: string | null
     - order: number
     - addedBy: 'user' | 'ai_suggested'
     - addedAt: number
     - reason: FocusReason | null
     - completed: boolean, completedAt: number | null
     - lastInteractedAt: number, horizonEnteredAt: number, rolloverCount: number

4. Add Nudge types:
   - Nudge interface: id, type, targetId, message, urgency, createdAt, expiresAt, status, respondedAt
   - NudgeType: 'inbox_full' | 'today_untouched' | 'queue_item_stale' | 'deadline_approaching' | 'pool_item_stale' | 'waiting_followup_due' | 'deferred_resurfaced'
   - SnoozedNudge interface

5. Update EventType union:
   - Add queue events: 'queue_item_added' | 'queue_item_removed' | 'queue_item_completed' | 'queue_horizon_changed' | 'queue_selection_changed' | 'queue_item_rolled_over'
   - Add deferral events: 'task_deferred' | 'task_resurfaced' | 'waiting_on_set' | 'waiting_on_cleared'
   - Add nudge events: 'nudge_shown' | 'nudge_dismissed' | 'nudge_snoozed' | 'nudge_actioned'
   - Add 'task_reopened'

6. Update FocusSession:
   - Add queueItemId: string
   - Add selectionType: 'entire_task' | 'specific_steps'
   - Add targetedStepIds: string[]
   - Add adjustedDuration: number | null
   - Add adjustmentReason: string | null
   - Update outcome to include 'completed_goal'

7. Update AppState:
   - Change currentView to: 'inbox' | 'pool' | 'queue' | 'taskDetail' | 'focusMode'
   - Replace dailyPlans/todayPlanId with focusQueue: FocusQueue
   - Add nudges: Nudge[], snoozedNudges: SnoozedNudge[]
   - Update FocusModeState to include queueItemId

8. Update helper functions:
   - createTask: include new fields (waitingOn: null, deferredUntil: null, etc.)
   - createStep: include new fields (effort: null, estimateSource: null, etc.)
   - Add createFocusQueueItem helper

9. Set SCHEMA_VERSION = 2
```

---

## Prompt 2: Create Storage & Event Utilities

```
Create utility files for storage and event logging.

1. Create lib/storage.ts:
   - STORAGE_KEYS constant: { state, events, sessions, nudges }
   - saveState(state: AppState) - saves to separate localStorage keys
   - loadState(): AppState - loads and merges from all keys
   - migrateState(stored: any): AppState - handles v1 → v2 migration:
     - Rename status 'active' to 'pool'
     - Convert DailyPlan to FocusQueue if exists
     - Add new fields with defaults
   - clearAllData() - for testing/reset

2. Create lib/events.ts:
   - logEvent(type, taskId, stepId, queueItemId, data) function
   - getCurrentContext(): EventContext
   - countCompletedToday(tasks)
   - countFocusSessionsToday(sessions)

3. Create lib/utils.ts:
   - generateId()
   - formatDate(date: string) - "Apr 15", "Tomorrow", "Today"
   - isOverdue(deadlineDate: string)
   - getTodayISO(): string
   - getTimeOfDay(hour: number)
   - computeFocusScore(task: Task): number
   - computeComplexity(task: Task)
   - computeHealthStatus(task: Task)

4. Create lib/queue.ts:
   - isQueueItemComplete(item: FocusQueueItem, task: Task): boolean
   - getQueueItemEstimate(item: FocusQueueItem, task: Task): number
   - getTodayItems(queue: FocusQueue): FocusQueueItem[]
   - getThisWeekItems(queue: FocusQueue): FocusQueueItem[]
   - getUpcomingItems(queue: FocusQueue): FocusQueueItem[]

5. Create lib/pool.ts:
   - getPoolTasks(tasks: Task[]): Task[] - status='pool', not deferred
   - getResurfacedTasks(tasks: Task[]): Task[] - deferred until today or earlier
   - getWaitingOnTasks(tasks: Task[]): Task[] - has waitingOn set
   - isTaskInQueue(taskId: string, queue: FocusQueue): boolean

6. Update app/page.tsx:
   - Import new utilities
   - Replace localStorage logic with storage.ts
   - Initialize with loadState(), save on changes
```

---

## Prompt 3: Create Navigation Shell

```
Create the navigation structure with view tabs.

1. Create components/navigation/NavTabs.tsx:
   - Three tabs: Inbox, Pool, Queue
   - Props: currentView, onNavigate, inboxCount, poolCount, queueCount
   - Badge shows count on each tab
   - Highlight active tab
   - Fixed at top or bottom (mobile-friendly)

2. Create components/shared/ViewContainer.tsx:
   - Wrapper for view content
   - Consistent padding/margins
   - Scroll container

3. Update app/page.tsx:
   - Add currentView state: 'inbox' | 'pool' | 'queue' | 'taskDetail' | 'focusMode'
   - Render NavTabs (hide in taskDetail and focusMode)
   - Route to correct view component based on currentView
   - Calculate counts for each tab

4. Create placeholder view components:
   - components/inbox/InboxView.tsx
   - components/pool/PoolView.tsx
   - components/queue/QueueView.tsx
   - Each just renders title for now

5. Set default view to 'queue' (Focus Queue is home)
```

---

## Prompt 4: Create Inbox View

```
Create the Inbox view for quick capture and triage.

1. Create components/inbox/InboxView.tsx:
   - QuickCapture at top
   - List of inbox items
   - Empty state if no items

2. Create components/shared/QuickCapture.tsx:
   - Single line input: "Add a task..."
   - On Enter: create task with status='inbox'
   - Clears after submission
   - Autofocus on mount

3. Create components/inbox/InboxItem.tsx:
   Props: task, onQuickSend, onTriage, onDefer, onDelete
   
   Collapsed state:
   - Task title
   - Age indicator: "2 days ago"
   - Action buttons: [Quick → Pool] [Triage ▾] [Defer ▾] [Delete]
   
   Expanded state (triage mode):
   - Editable title
   - "What does done look like?" text area
   - Steps section with [+ Add] and [✨ AI Suggest]
   - Action buttons: [Send to Pool] [Add to Queue ▾] [Defer ▾] [Park]
   
   Behavior:
   - Click row to expand/collapse
   - Quick → Pool: move to pool immediately
   - Triage: expand inline
   - Defer: dropdown with options (1 week, 1 month, 3 months, pick date)
   - Delete: soft delete with undo toast

4. Create components/inbox/DeferDropdown.tsx:
   - Options: 1 week, 1 month, 3 months, Pick date, Indefinitely
   - Sets deferredUntil and deferredAt on task
   - Moves task to 'pool' status (hidden until date)

5. Wire up handlers in page.tsx:
   - quickSendToPool(taskId): set status='pool'
   - deferTask(taskId, untilDate)
   - deleteTask(taskId): soft delete
   - Add inbox tasks to display
```

---

## Prompt 5: Create Pool View

```
Create the Pool view for browsing available tasks.

1. Create components/pool/PoolView.tsx:
   - Search bar at top
   - Sort dropdown (Focus Score, Created, Deadline, Alphabetical)
   - Resurfaced section (if any)
   - Ready tasks section
   - Waiting On badge in header if any

2. Create components/pool/PoolSearch.tsx:
   - Search input with icon
   - Filters task list by title, description, step text
   - Debounced input

3. Create components/pool/ResurfacedSection.tsx:
   - Collapsible section header: "Resurfaced (N)"
   - Shows tasks where deferredUntil <= today
   - Each item shows: title, "Deferred X ago"
   - Actions: [Add to Queue ▾] [Keep in Pool] [Park again]

4. Create components/pool/TaskRow.tsx:
   Props: task, onSelect, onAddToQueue
   
   Display:
   - Priority indicator (colored dot)
   - Title
   - Progress: "3/5 steps" or "~45 min"
   - Due date with warning if approaching
   - Waiting On badge if set: "⏸ Waiting on: Sarah"
   - [→] navigate button
   - [Add ▾] add to queue dropdown
   
   Behavior:
   - Click row → navigate to TaskDetail
   - [Add ▾] → dropdown with horizon options

5. Create components/pool/AddToQueueDropdown.tsx:
   - Options: Today, This Week, Upcoming
   - Creates FocusQueueItem with entire_task selection
   - Shows toast confirmation

6. Wire up:
   - getPoolTasks() to filter tasks
   - Sort by focusScore by default
   - Search filtering
   - Navigation to TaskDetail
```

---

## Prompt 6: Create Focus Queue View (Home)

```
Create the Focus Queue view - this is the app's home screen.

1. Create components/queue/QueueView.tsx:
   - Today section (prominent, "asteroid belt")
   - This Week section
   - Upcoming section
   - Total time estimate in header
   - Empty state with smart actions

2. Create components/queue/HorizonSection.tsx:
   Props: horizon, items, tasks, onFocus, onRemove, onMove
   
   Display:
   - Header: "TODAY" / "THIS WEEK" / "UPCOMING"
   - Time estimate: "~95 min"
   - List of QueueItems
   - Collapsible for non-today sections

3. Create components/queue/QueueItem.tsx:
   Props: item, task, onFocus, onRemove, onMove
   
   Display:
   - Task title
   - Selection info: "All steps" or "Steps 1-3 of 7"
   - Progress: "(2 of 5 done)" 
   - Time estimate: "~45 min"
   - Waiting On badge if applicable
   - [→ Focus] button
   
   Behavior:
   - Click row → navigate to TaskDetail
   - [→ Focus] → enter focus mode
   - Drag to reorder (optional for MVP)
   - Swipe to remove (optional)

4. Create components/queue/QueueEmptyState.tsx:
   - Smart contextual actions based on state:
     - Pool has items: [Add from Pool (N ready)]
     - Pool empty, Inbox has items: [Go to Inbox (N items)]
     - Everything empty: [Capture your first task]

5. Wire up:
   - getTodayItems(), getThisWeekItems(), getUpcomingItems()
   - Calculate total estimates per horizon
   - Focus mode entry
   - Remove from queue handler
   - Move between horizons handler
```

---

## Prompt 7: Create Task Detail View

```
Create the Task Detail view for viewing/editing a single task.

1. Create components/task-detail/TaskDetail.tsx:
   Props: taskId, onBack, onFocus
   
   Layout:
   - Header: back button, task title (editable), [✓ Mark Complete] button
   - Steps section
   - Metadata section
   - Actions section
   - AI drawer at bottom

2. Create components/task-detail/StepList.tsx:
   - List of steps with checkboxes
   - Each step shows:
     - Checkbox
     - Step text (editable on click)
     - Time estimate: "~15 min"
     - Substeps (if any)
     - [→ Focus] button on hover/tap
   - [+ Add Step] button at bottom
   - [✨ Break Down with AI] button

3. Create components/task-detail/StepItem.tsx:
   Props: step, taskId, onComplete, onEdit, onFocus, onDelete
   
   Display:
   - Checkbox (completed state)
   - Text (click to edit)
   - Estimate badge: "~15 min" (click to edit)
   - Substeps list
   - [→ Focus] button
   
   Behavior:
   - Check → completeStep(taskId, stepId)
   - Click text → inline edit mode
   - Click estimate → edit estimate modal/inline

4. Create components/task-detail/TaskMetadata.tsx:
   - Priority dropdown
   - Target date picker
   - Deadline date picker
   - Effort dropdown
   - Project dropdown (optional for MVP)
   - Waiting On input: "Waiting on: [____]"

5. Create components/task-detail/TaskActions.tsx:
   - [Add to Queue ▾] with horizon dropdown
   - [Archive] / [Restore if archived]
   - [Delete]

6. Wire up:
   - updateTask for all field changes
   - completeStep, uncompleteStep
   - addStep, updateStep, deleteStep
   - Navigation back to previous view
   - Focus mode entry (entire task or specific step)
```

---

## Prompt 8: Implement Step Selection for Queue

```
Add the ability to add specific steps (not just entire tasks) to the Focus Queue.

1. Update AddToQueueDropdown.tsx:
   - Add "Select steps..." option
   - Opens step selection modal/panel

2. Create components/shared/StepSelector.tsx:
   Props: task, selectedStepIds, onConfirm, onCancel
   
   Display:
   - Task title at top
   - List of all steps with checkboxes
   - Each shows: checkbox, step text, estimate
   - "N steps selected" summary
   - Time estimate for selected steps
   - [Cancel] [Add to Queue ▾]
   
   Behavior:
   - Toggle individual steps
   - "Select all" / "Clear all"
   - Confirm adds with selectionType='specific_steps'

3. Update QueueItem.tsx:
   - Show selection type: "All steps" vs "Steps 1, 3, 5"
   - Progress based on selected steps only
   - [Edit selection] button to modify

4. Create components/queue/EditSelectionModal.tsx:
   - Reuses StepSelector
   - Updates existing queue item's selectedStepIds

5. Update queue completion logic:
   - isQueueItemComplete checks only selected steps
   - When selected steps done, mark queue item complete
   - Task may remain incomplete if not all steps selected

6. Wire up:
   - addToQueue(taskId, horizon, selectionType, selectedStepIds)
   - updateQueueItemSelection(itemId, selectedStepIds)
```

---

## Prompt 9: Connect Focus Mode to Queue

```
Update Focus Mode to work with Focus Queue items.

1. Update enterFocusMode:
   - Accept queueItemId parameter (or create temporary item)
   - Find queue item and associated task
   - Determine which steps are in scope (entire or selected)
   - Find first incomplete in-scope step
   - Create FocusSession with queueItemId, selectionType, targetedStepIds

2. Update FocusMode component:
   - Get queue item from focusQueue.items
   - Get task from tasks array
   - Filter steps to show only in-scope steps
   - Progress bar reflects in-scope steps only

3. Update step completion in focus mode:
   - Complete step as before
   - Check if all in-scope steps are done
   - If yes: show "Focus goal complete!" celebration
   - Offer: [Continue with more steps] [Exit to Queue]

4. Update FocusSession tracking:
   - Link to queueItemId
   - Track which steps were targeted
   - Add adjustedDuration and adjustmentReason fields
   - New outcome: 'completed_goal' (selected steps done, task may have more)

5. Update exit behavior:
   - Log session with full details
   - Mark queue item complete if goal met
   - Return to queue view (not task detail)

6. Add time tracking adjustment:
   - In session history, allow editing tracked time
   - "Adjust time" button → modal with recorded vs actual
   - Save adjustmentReason for learning
```

---

## Prompt 10: Add Waiting On and Deferral

```
Implement Waiting On (non-blocking) and Deferral mechanics.

1. Waiting On UI in TaskDetail:
   - Field: "Waiting on: [input]"
   - When set: shows badge, sets waitingOn object
   - Optional follow-up date picker
   - [Mark received] clears waitingOn

2. Waiting On in Pool:
   - Badge in header: "3 items waiting"
   - Click badge → filter to waiting items
   - TaskRow shows "⏸ Waiting on: Sarah"

3. Waiting On in Focus Mode:
   - If task has waitingOn, show info banner
   - "This task is waiting on Sarah"
   - Can still proceed with steps
   - AI drawer can note: "Some steps may depend on this"

4. Deferral from Pool:
   - [Defer ▾] dropdown on TaskRow
   - Options: 1 week, 1 month, 3 months, Pick date
   - Task hidden from Pool until date
   - Increment deferredCount

5. Resurfacing:
   - getResurfacedTasks checks deferredUntil <= today
   - Shows in Pool's "Resurfaced" section
   - Actions: Add to Queue, Keep in Pool, Park again
   - Log 'task_resurfaced' event

6. Wire up handlers:
   - setWaitingOn(taskId, who, followUpDate)
   - clearWaitingOn(taskId)
   - deferTask(taskId, untilDate)
   - On resurface, clear deferredUntil after user action
```

---

## Prompt 11: Add Nudges System

```
Implement the ambient nudge system.

1. Create lib/nudges.ts:
   - generateNudges(state: AppState): Nudge[]
   - Checks for:
     - Inbox 10+ items → 'inbox_full'
     - Today item untouched 3 days → 'today_untouched'
     - Queue item 2+ weeks → 'queue_item_stale'
     - Deadline in 3 days → 'deadline_approaching'
     - Pool item 3+ weeks no activity → 'pool_item_stale'
     - Waiting On follow-up due → 'waiting_followup_due'
   - Returns array of new nudges

2. Create components/shared/NudgeBadge.tsx:
   - Shows count of pending nudges
   - Click opens nudge drawer/list
   - Position: header or floating

3. Create components/shared/NudgeDrawer.tsx:
   - Lists pending nudges (max 3 shown)
   - Each nudge shows:
     - Message
     - Related task title
     - Actions: dismiss, snooze, action
   - Snooze options: 1 day, 3 days, 1 week

4. Create components/shared/NudgeInline.tsx:
   - For showing nudges inline in relevant views
   - E.g., stale item nudge in Pool view
   - Subtle, dismissible

5. Wire up:
   - Generate nudges on app load and state changes
   - dismissNudge(nudgeId)
   - snoozeNudge(nudgeId, untilDate)
   - actionNudge(nudgeId) → navigate to relevant view/task
   - Log nudge events
```

---

## Prompt 12: Polish and PWA

```
Add polish and PWA support.

1. Toast system:
   - Create components/shared/Toast.tsx
   - Show on delete (with undo), archive, queue add
   - Auto-dismiss after 5 seconds

2. Keyboard shortcuts:
   - 'n' → focus QuickCapture
   - Escape → back/exit
   - '1/2/3' → switch views (optional)

3. Empty states:
   - Calm, helpful messaging (not peppy)
   - Contextual actions

4. Loading and error states:
   - AI loading indicator
   - Error toasts
   - Graceful degradation

5. PWA manifest (public/manifest.json):
   - name, short_name, icons, theme_color
   - display: standalone

6. Service worker (public/sw.js):
   - Cache app shell
   - Network-first for API
   - Offline fallback

7. Update layout.tsx:
   - Manifest link
   - Theme-color meta
   - Register service worker

8. Mobile optimizations:
   - Touch targets 44px+
   - Safe areas (notch, home indicator)
   - No horizontal scroll
   - Drawer works on mobile
```

---

## Verification Prompts

After each major section, verify:

```
Test inbox flow: Create task via QuickCapture → appears in Inbox. Quick send to Pool → appears in Pool. Triage with steps → can add to queue.
```

```
Test pool: Tasks sorted by focus score. Search filters correctly. Waiting On badge shows. Deferred tasks hidden until date.
```

```
Test queue: Today/This Week/Upcoming sections show correctly. Time estimates sum. Focus button enters focus mode. Can remove/move items.
```

```
Test step selection: Add task with 5 steps. Add to queue with only steps 2-4 selected. Focus mode shows only those 3 steps. Complete them → queue item done, task still has incomplete steps.
```

```
Test focus mode: Enter from queue item. Complete steps → celebration. Exit → returns to queue. Session logged with queueItemId.
```

---

## Implementation Order Summary

| Order | Prompt | Est. Hours | Focus |
|-------|--------|------------|-------|
| 1 | Data Model | 1-2 | Types foundation |
| 2 | Storage & Utils | 1-2 | Persistence, helpers |
| 3 | Navigation Shell | 1 | View routing |
| 4 | Inbox View | 2-3 | Capture, triage |
| 5 | Pool View | 2-3 | Browse, search, sort |
| 6 | Queue View | 2-3 | Home, horizons |
| 7 | Task Detail | 2-3 | View/edit task |
| 8 | Step Selection | 1-2 | Partial task focus |
| 9 | Focus Mode | 2-3 | Queue integration |
| 10 | Waiting/Defer | 1-2 | Blocking states |
| 11 | Nudges | 2-3 | Ambient prompts |
| 12 | Polish + PWA | 2-3 | Ship-ready |

**Total: ~18-28 hours**

---

## Notes

- Prompts 1-9 are core Model E functionality
- Prompts 10-12 are enhancement and polish
- Can combine prompts if going faster
- Each prompt should result in testable, working code
- Commit after each successful prompt
- Test on actual phone before shipping
