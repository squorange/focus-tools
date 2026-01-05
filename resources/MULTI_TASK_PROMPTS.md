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
Create the 2-tab navigation structure with search.

1. Create components/layout/Header.tsx:
   - Container for top bar
   - Left: TabCluster (Focus | Tasks)
   - Center: SearchBar (desktop) or empty (mobile)
   - Right: Search icon (mobile) + AI toggle icon
   - Props: currentView, onNavigate, inboxCount, onSearchOpen, onAIToggle

2. Create components/layout/TabCluster.tsx:
   - Button group: [Focus] [Tasks [N]]
   - Props: activeTab, onTabChange, inboxCount
   - Badge on Tasks shows inbox count when > 0
   - Styled as connected button cluster

3. Create components/layout/SearchBar.tsx:
   - Expanded search input (desktop only)
   - Placeholder: "Search tasks..."
   - On focus/click: navigate to Search view
   - Hidden on mobile (use icon instead)

4. Create components/ai/AIDrawer.tsx:
   - Side panel for desktop (right side, resizable)
   - Props: isOpen, onClose, context, messages
   - Persists across view changes

5. Create components/ai/AIFloatingBar.tsx:
   - Mobile: floating bar above content
   - Collapsed: shows "💬 AI Assistant [▲]"
   - Expanded: slides up to show chat
   - Like Apple Music mini player pattern

6. Update app/page.tsx:
   - Add currentView state: 'focus' | 'tasks' | 'inbox' | 'search' | 'taskDetail' | 'focusMode'
   - Render Header (hide in focusMode)
   - Route to correct view based on currentView
   - Calculate inbox count for badge
   - Manage AI drawer state

7. Set default view to 'focus' (Focus is home)
```

---

## Prompt 4: Create Focus View (Home)

```
Create the Focus view - the app's home screen.

1. Create components/focus/FocusView.tsx:
   - Header: "Focus" title, item count, total time estimate
   - Today section (prominent)
   - This Week section
   - Upcoming section
   - Empty state with smart actions

2. Create components/focus/HorizonSection.tsx:
   Props: horizon, items, tasks, onFocus, onRemove, onMove
   
   Display:
   - Header: "TODAY" / "THIS WEEK" / "UPCOMING"
   - Time estimate badge: "~95 min"
   - List of QueueItems
   - Today is emphasized (box/highlight)
   - Others collapsible

3. Create components/focus/QueueItem.tsx:
   Props: item, task, onFocus, onRemove, onNavigate
   
   Display:
   - Task title
   - Selection info: "All steps" or "Steps 1-3 of 7"
   - Progress: "(2 of 5 done)" 
   - Time estimate: "~45 min"
   - Waiting On badge if applicable
   - [Focus] button
   
   Behavior:
   - Click row → navigate to TaskDetail
   - [Focus] → enter focus mode

4. Create components/focus/FocusEmptyState.tsx:
   - Smart contextual actions:
     - Tasks available: [Add from Tasks (N ready)]
     - No tasks: [Capture your first task]

5. Wire up:
   - getTodayItems(), getThisWeekItems(), getUpcomingItems()
   - Calculate total estimates per horizon
   - Focus mode entry
   - Navigation to TaskDetail
```

---

## Prompt 5: Create Tasks View (Combined Inbox + Pool)

```
Create the Tasks view combining Inbox and Pool.

1. Create components/tasks/TasksView.tsx:
   - Header: "Tasks" title, counts ("1 to triage · 12 ready")
   - QuickCapture at top (always visible)
   - Sort dropdown for Ready section
   - Sections: Needs Triage, Ready, Waiting (if any), Resurfaced (if any)

2. Create components/tasks/TriageSection.tsx:
   Props: tasks, onQuickSend, onTriage, onViewAll
   
   Display:
   - Header: "NEEDS TRIAGE (N)"
   - Top 5 inbox items
   - [View all N items →] link if more than 5
   - Each item shows: title, age, [→ Pool] [Triage] buttons
   
   Behavior:
   - [→ Pool] quick sends to pool
   - [Triage] expands inline or navigates to detail
   - [View all] navigates to full Inbox view

3. Create components/tasks/ReadySection.tsx:
   Props: tasks, sortBy, onSortChange, onNavigate, onAddToFocus
   
   Display:
   - Header: "READY (N)"
   - Sorted task list
   - Each row: priority dot, title, progress, In Focus badge, [+ Add] or [→]

4. Create components/tasks/WaitingSection.tsx:
   - Only shows if tasks with waitingOn exist
   - Header: "WAITING (N)"
   - Shows waiting badge per task

5. Create components/tasks/ResurfacedSection.tsx:
   - Only shows if deferred tasks have resurfaced
   - Header: "RESURFACED (N)"
   - Shows: title, "Deferred X ago", [+ Add] [Keep] [Park again]

6. Create components/shared/QuickCapture.tsx:
   - Input: "+ What's on your mind?"
   - On Enter: create task with status='inbox'
   - Clears after submission

7. Wire up:
   - getPoolTasks(), getResurfacedTasks(), getWaitingOnTasks()
   - Sort by focusScore by default
   - Navigation to TaskDetail
   - Add to Focus dropdown
```

---

## Prompt 6: Create Inbox View (Drill-in)

```
Create the full Inbox view (drill-in from Tasks).

1. Create components/inbox/InboxView.tsx:
   - Header: "← Tasks" back button, "Inbox" title
   - Item count: "8 items to triage"
   - QuickCapture at top
   - Full list of all inbox items
   - Bulk actions dropdown
   - [✨ AI: Help me triage] button at bottom

2. Create components/tasks/InboxItem.tsx:
   Props: task, onQuickSend, onTriage, onDefer, onDelete
   
   Collapsed state:
   - ▶ chevron, title, age ("10m ago")
   - [→ Pool] [Triage] [×] buttons
   
   Expanded state (inline triage):
   - Editable title
   - Description/notes field
   - Steps section with [+ Add] and [✨ AI Suggest]
   - Priority, effort dropdowns
   - [Send to Pool] [Add to Focus ▾] [Defer ▾] [Park]
   
   Behavior:
   - Click chevron or row to expand/collapse
   - [→ Pool] quick sends without expanding
   - [Triage] expands for detailed triage

3. Create components/tasks/DeferDropdown.tsx:
   - Options: 1 week, 1 month, 3 months, Pick date
   - Sets deferredUntil and moves to pool (hidden)

4. Create components/tasks/BulkActions.tsx:
   - Dropdown: [Select all] [Send all to Pool] [Delete old]
   - For power users with large inbox

5. Wire up handlers:
   - quickSendToPool(taskId)
   - deferTask(taskId, untilDate)
   - deleteTask(taskId)
   - Back navigation to Tasks view
```

---

## Prompt 7: Create Search View

```
Create the full Search view.

1. Create components/search/SearchView.tsx:
   - Header: "← Back" button, "Search" title
   - Search input with clear button
   - Before search: Quick Access cards + Recent Searches
   - With search: Results list
   - Works alongside AI pane

2. Create components/search/QuickAccess.tsx:
   - Grid of shortcut cards:
     - ⭐ High Priority (count)
     - 📁 Projects (count)
     - ✓ Completed (count)
     - 📦 Archived (count)
     - ⏸ Waiting (count)
     - 🕐 Deferred (count)
   - Click card → filter results in place

3. Create components/search/SearchResults.tsx:
   Props: query, results
   
   Display:
   - "N results" header
   - Each result shows:
     - Task title
     - Status badge (Inbox, Pool, Completed, Archived)
     - Progress if applicable
     - "In Focus" badge if in queue
     - [→] navigate button

4. Create lib/search.ts:
   - searchTasks(tasks, query): Task[]
   - Searches: title, description, step text, tags
   - Returns sorted by relevance

5. Wire up:
   - Search input with debounce
   - Quick Access filtering
   - Recent searches (localStorage)
   - Navigation to TaskDetail from results
   - AI can help interpret vague queries
```

---

## Prompt 8: Create Task Detail View

```
Create the Task Detail view for viewing/editing a single task.

1. Create components/task-detail/TaskDetail.tsx:
   Props: taskId, onBack, onFocus
   
   Layout:
   - Header: "← Back" button, title on right
   - Task title (editable, large)
   - [✓ Mark Complete] button
   - Steps section with time estimates
   - Metadata section
   - Actions section

2. Create components/task-detail/StepList.tsx:
   - List of steps with checkboxes
   - Each step shows:
     - Checkbox
     - Step text (editable on click)
     - Time estimate: "~15 min"
     - Substeps (if any)
     - [Focus] button on hover/tap
   - Total time: "~45 min total" / "~40 min left"
   - [+ Add Step] button
   - [✨ Break Down with AI] button

3. Create components/task-detail/StepItem.tsx:
   Props: step, taskId, onComplete, onEdit, onFocus, onDelete
   
   Display:
   - Checkbox (completed state)
   - Text (click to edit)
   - Estimate badge: "~15 min" (click to edit)
   - Substeps list (indented)
   - [Focus] button
   
   Behavior:
   - Check → completeStep(taskId, stepId)
   - Click text → inline edit mode
   - Click estimate → edit estimate

4. Create components/task-detail/TaskMetadata.tsx:
   - Priority dropdown (High/Medium/Low/None)
   - Target date picker
   - Deadline date picker  
   - Effort dropdown (Quick/Medium/Deep)
   - Project dropdown (optional)
   - Waiting On: "⏸ Waiting on: [___]"

5. Create components/task-detail/TaskActions.tsx:
   - [Add to Focus ▾] with horizon dropdown
   - [Archive]
   - [Delete]

6. Wire up all handlers and navigation
```

---

## Prompt 9: Implement Step Selection for Focus

```
Add the ability to add specific steps to Focus.

1. Update AddToFocusDropdown (in TaskDetail and TaskRow):
   - Options: Today, This Week, Upcoming
   - Sub-option: "Select specific steps..."
   - Opens StepSelector when choosing specific steps

2. Create components/shared/StepSelector.tsx:
   Props: task, selectedStepIds, onConfirm, onCancel
   
   Display:
   - Task title at top
   - List of all steps with checkboxes
   - Each: checkbox, step text, estimate
   - "N steps selected · ~X min"
   - [Cancel] [Add to Focus ▾]
   
   Behavior:
   - Toggle individual steps
   - "Select all" / "Clear all" links
   - Confirm creates queue item with specific_steps

3. Update QueueItem display:
   - Show: "All steps" vs "Steps 1, 3, 5"
   - Progress based on selected steps only
   - [Edit selection] option

4. Update completion logic:
   - isQueueItemComplete checks only selected steps
   - When selected done → queue item complete
   - Task may remain incomplete

5. Wire up:
   - addToFocus(taskId, horizon, selectionType, selectedStepIds)
   - updateQueueItemSelection(itemId, selectedStepIds)
```

---

## Prompt 10: Connect Focus Mode to Queue

```
Update Focus Mode to work with Focus queue items.

1. Update enterFocusMode:
   - Accept queueItemId parameter
   - Find queue item and task
   - Determine in-scope steps (entire or selected)
   - Find first incomplete in-scope step
   - Create FocusSession with queueItemId, selectionType, targetedStepIds

2. Update FocusMode component:
   - Get queue item from focusQueue.items
   - Get task from tasks array
   - Filter to show only in-scope steps
   - Progress bar reflects in-scope only
   - Show step estimate: "~15 min"

3. Update step completion:
   - Complete step as before
   - Check if all in-scope steps done
   - If yes: "Focus goal complete!" celebration
   - Offer: [Continue with more steps] [Back to Focus]

4. Update FocusSession tracking:
   - Link to queueItemId
   - Track targetedStepIds
   - Add adjustedDuration for manual time correction
   - Outcome: 'completed_goal' when selected steps done

5. Update exit behavior:
   - Log session with full details
   - Mark queue item complete if goal met
   - Return to Focus view

6. Time tracking adjustment:
   - Allow editing tracked time after session
   - Save adjustmentReason for learning
```

---

## Prompt 11: Add Waiting On and Deferral

```
Implement Waiting On and Deferral mechanics.

1. Waiting On in TaskDetail:
   - Field: "⏸ Waiting on: [input]"
   - When set: shows badge, records waitingOn object
   - Optional follow-up date picker
   - [Mark received] clears waitingOn

2. Waiting On in Tasks view:
   - Waiting section shows if any tasks waiting
   - TaskRow shows "⏸ Waiting on: Sarah" badge
   - Can filter to waiting tasks

3. Waiting On in Focus Mode:
   - Info banner: "This task is waiting on Sarah"
   - Can still proceed with steps
   - Non-blocking

4. Deferral from Tasks:
   - DeferDropdown on InboxItem and TaskRow
   - Options: 1 week, 1 month, 3 months, Pick date
   - Task hidden from Ready section until date
   - Increment deferredCount

5. Resurfacing:
   - getResurfacedTasks checks deferredUntil <= today
   - Shows in "RESURFACED" section
   - Actions: [+ Add to Focus] [Keep in Pool] [Defer again]
   - Log 'task_resurfaced' event

6. Wire up handlers:
   - setWaitingOn(taskId, who, followUpDate)
   - clearWaitingOn(taskId)
   - deferTask(taskId, untilDate)
```

---

## Prompt 12: Add Nudges System

```
Implement the ambient nudge system.

1. Create lib/nudges.ts:
   - generateNudges(state: AppState): Nudge[]
   - Checks for:
     - Inbox 10+ items → 'inbox_full'
     - Today item untouched 3 days → 'today_untouched'  
     - Queue item 2+ weeks → 'queue_item_stale'
     - Deadline in 3 days → 'deadline_approaching'
     - Pool item 3+ weeks → 'pool_item_stale'
     - Waiting On follow-up due → 'waiting_followup_due'
   - Returns array of new nudges

2. Create nudge UI components:
   - Badge in header showing nudge count
   - Nudge list/drawer when clicked
   - Each nudge: message, task title, actions

3. Nudge actions:
   - Dismiss (hide this nudge)
   - Snooze (1 day, 3 days, 1 week)
   - Action (navigate to relevant view/task)

4. Wire up:
   - Generate nudges on app load
   - dismissNudge, snoozeNudge, actionNudge handlers
   - Log nudge events for learning
```

---

## Prompt 13: Polish and PWA

```
Add polish and PWA support.

1. Toast system:
   - components/shared/Toast.tsx
   - Show on: delete (with undo), archive, add to focus
   - Auto-dismiss after 5 seconds
   - Action button for undo

2. Keyboard shortcuts:
   - 'n' → focus QuickCapture (in Tasks view)
   - Escape → back/exit
   - '/' → focus search

3. Empty states:
   - Calm, helpful messaging
   - Contextual actions (not generic)

4. Loading states:
   - AI loading indicator
   - Skeleton loaders for views

5. PWA manifest (public/manifest.json):
   {
     "name": "Focus Tools",
     "short_name": "Focus",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#..."
   }

6. Service worker:
   - Cache app shell
   - Offline fallback

7. Mobile optimizations:
   - Touch targets 44px+
   - Safe areas (notch, home indicator)
   - Floating AI bar positioning
```

---

## Verification Prompts

```
Test navigation: Focus tab shows queue. Tasks tab shows combined inbox + pool. Search icon opens search view. AI toggle opens drawer/floating bar.
```

```
Test tasks view: Quick capture adds to inbox. Triage section shows top 5. "View all" opens full inbox. Ready section sorted by focus score.
```

```
Test focus view: Today/Week/Upcoming sections. Time estimates correct. Focus button enters focus mode. Empty state shows smart actions.
```

```
Test search: Quick access cards filter correctly. Search finds across all statuses. Results show status badges. Can navigate to any result.
```

```
Test step selection: Add task with 5 steps. Add to Focus with only steps 2-4. Focus mode shows only those. Complete them → queue item done.
```

---

## Implementation Order Summary

| Order | Prompt | Est. Hours | Focus |
|-------|--------|------------|-------|
| 1 | Data Model | 1-2 | Types foundation |
| 2 | Storage & Utils | 1-2 | Persistence, helpers |
| 3 | Navigation Shell | 1-2 | Header, tabs, AI drawer |
| 4 | Focus View | 2-3 | Home screen |
| 5 | Tasks View | 2-3 | Combined inbox + pool |
| 6 | Inbox View | 1-2 | Drill-in for full list |
| 7 | Search View | 1-2 | Quick access + search |
| 8 | Task Detail | 2-3 | View/edit task |
| 9 | Step Selection | 1-2 | Partial task focus |
| 10 | Focus Mode | 2-3 | Queue integration |
| 11 | Waiting/Defer | 1-2 | Blocking states |
| 12 | Nudges | 1-2 | Ambient prompts |
| 13 | Polish + PWA | 2-3 | Ship-ready |

**Total: ~18-30 hours**

---

## Notes

- Prompts 1-10 are core functionality
- Prompts 11-13 are enhancement and polish
- Can combine prompts if going faster
- Each prompt should result in testable code
- Commit after each successful prompt
- Test on actual phone before shipping
