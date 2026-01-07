# Focus Tools Implementation Checklist (Model E)

Quick reference for Claude Code sessions. Full prompts in `MULTI_TASK_PROMPTS.md`.

**Last Updated:** January 2026

---

## Current Status: Multi-Task Flow Complete

The task-copilot prototype now implements the **full Model E workflow**. All core views are wired up and functional.

### Implementation Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | ✅ Complete | Types, storage, utils, navigation |
| Phase 2: Core Views | ✅ Complete | Focus, Tasks, Inbox, Search, Projects views |
| Phase 3: Task Detail & Focus Mode | ✅ Complete | Full functionality |
| Phase 4: Features & Polish | ✅ Mostly Complete | Toast with undo, Projects management done; Nudges deferred |

---

## Navigation Model (2-Tab)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Focus │ Tasks]        🔍 Search...                      [💬]  │
├─────────────────────────────────────────────────────────────────┤
│                     Main Content                                 │
└─────────────────────────────────────────────────────────────────┘

Desktop: Search bar in header, AI as side panel
Mobile: Search icon, AI drawer slides in
```

| Tab | View | Contains |
|-----|------|----------|
| **Focus** | QueueView (home) | Today/Week/Upcoming queue |
| **Tasks** | TasksView | Inbox section + Pool section + Project filter |
| 🔍 | SearchView | Quick access + cross-status search |
| 📁 | ProjectsView (drill-in) | Project management with grouped tasks |

---

## Phase 1: Foundation ✅ COMPLETE

### Prompt 1: Data Model
- [x] Task status: 'inbox' | 'pool' | 'complete' | 'archived'
- [x] Task.completionType, archivedReason
- [x] Task.waitingOn object (non-blocking flag)
- [x] Task.deferredUntil, deferredAt, deferredCount
- [x] Step: effort, estimateSource, firstFocusedAt, estimationAccuracy, context
- [x] FocusQueue + FocusQueueItem (replaces DailyPlan)
- [x] Nudge + SnoozedNudge types
- [x] Updated EventType with queue/defer/nudge events
- [x] FocusSession: queueItemId, selectionType, targetedStepIds
- [x] AppState: currentView includes 'focus' | 'tasks' | 'inbox' | 'search' | 'projects'
- [x] Helper functions: createTask, createStep, createFocusQueueItem
- [x] SCHEMA_VERSION = 2

### Prompt 2: Storage & Utils
- [x] lib/storage.ts with v1→v2 migration
- [x] lib/events.ts with queueItemId support
- [x] lib/utils.ts with focusScore, complexity, healthStatus
- [x] lib/queue.ts with queue helpers
- [x] lib/pool.ts with pool filters
- [x] lib/prompts.ts with SYSTEM_PROMPT and FOCUS_MODE_PROMPT
- [x] page.tsx uses new storage

### Prompt 3: Navigation Shell
- [x] Header.tsx with tab cluster, search, AI toggle
- [x] TabCluster.tsx: [Focus │ Tasks] buttons
- [x] SearchBar.tsx (desktop expanded)
- [x] AIDrawer.tsx (desktop side panel + mobile bottom sheet)
- [x] currentView routing fully wired
- [x] Default view is 'focus'
- [x] Mobile AI floating bar + 50vh bottom sheet (in AIDrawer.tsx)

---

## Phase 2: Core Views ✅ COMPLETE

### Prompt 4: Focus View (QueueView)
- [x] QueueView.tsx with horizons
- [x] QueueItem.tsx with task info
- [x] HorizonSection (inline in QueueView)
- [x] Time estimates per horizon
- [x] Empty state with smart actions
- [x] Focus button enters focus mode from queue
- [x] Completed today count display

### Prompt 5: Tasks View
- [x] TasksView.tsx with all sections
- [x] QuickCapture at top
- [x] Project filter chips (tap to filter by project)
- [x] TriageSection: top 5 inbox + "View all"
- [x] ReadySection: pool tasks with priority
- [x] WaitingSection (if any)
- [x] ResurfacedSection (if any)
- [x] TaskRow with progress, deadline, badges
- [x] Projects link → ProjectsView drill-in

### Prompt 6: Inbox View (Drill-in)
- [x] InboxView.tsx with back button
- [x] InboxItem.tsx collapsed/expanded states
- [x] Quick send to pool
- [x] Add to queue with horizon selection
- [x] Defer and delete actions
- [ ] Bulk actions dropdown — not implemented
- [ ] [AI: Help me triage] button — not implemented

### Prompt 7: Search View
- [x] SearchView.tsx with search input
- [x] Results list with status badges
- [x] Navigation to task detail
- [x] QuickAccess cards — 6 cards: High Priority, Waiting, Deferred, Completed, Archived, Projects
- [ ] Recent searches — not implemented

---

## Phase 3: Detail & Selection ✅ COMPLETE

### Prompt 8: Task Detail
- [x] TaskDetail.tsx with back navigation
- [x] Title editable (tap-to-edit)
- [x] Steps display with checkboxes
- [x] Substeps display with checkboxes
- [x] Step completion works
- [x] Priority picker (High/Medium/Low)
- [x] Target date picker
- [x] Deadline date picker
- [x] Waiting On field
- [x] Notes module (collapsible)
- [x] Add to Focus with horizon dropdown
- [x] Focus button to enter focus mode
- [x] AI Breakdown button

### Prompt 9: Step Selection
- [ ] "Select specific steps..." option — not implemented
- [ ] StepSelector component — not implemented
- [x] QueueItem shows step selection info
- [x] Completion logic respects selectionType

### Prompt 10: Focus Mode Integration ✅ COMPLETE
- [x] FocusModeView.tsx with full functionality
- [x] Shows current step prominently
- [x] Progress bar with step count
- [x] Step completion with celebration
- [x] Timer with pause/resume
- [x] AI body double integration
- [x] "I'm Stuck" menu with 4 options
- [x] Tap-to-edit for step text and title
- [x] Substep checkboxes
- [x] Session tracking
- [x] Exit returns to Focus view

---

## Phase 4: Features & Polish ⏳ PARTIAL

### Prompt 11: Waiting On & Deferral
- [x] Waiting On field in TaskDetail
- [x] Tasks view shows waiting section
- [x] Deferral handlers implemented
- [x] Resurfaced section shows deferred tasks
- [ ] Full deferral UI (date picker modal) — minimal

### Prompt 12: Nudges
- [x] Nudge types defined in types.ts
- [ ] Nudge generation logic (lib/nudges.ts) — not implemented
- [ ] Nudge badge in header — not implemented
- [ ] Nudge list/drawer — not implemented

### Prompt 13: Polish + PWA
- [x] StagingToast for AI suggestions
- [x] StagingArea collapsible panel
- [x] StagingReviewModal for bulk review
- [x] Toast with undo — implemented for delete, archive, project delete
- [x] manifest.json — app metadata, icons, theme colors
- [x] Service worker (sw.js) — network-first caching, offline fallback
- [x] usePWA hook — service worker registration
- [x] Keyboard shortcuts — `n`, `f`, `t`, `/`, `Escape`, `a`
- [ ] Mobile touch targets — needs verification

---

## POC Enhancements (Beyond Original Plan)

These features were added during POC development and are fully functional:

### AI Function Calling Architecture ✅ NEW
Migrated from JSON-in-text parsing to Claude's native function calling (tool_use):

| Aspect | Benefit |
|--------|---------|
| Reliability | ~99%+ vs ~85% with prompt-based JSON |
| Validation | SDK handles parsing |
| Extensibility | Add tools without editing prompts |

**Planning Mode Tools:**
- `replace_task_steps` - Initial breakdown or complete rewrite
- `suggest_additions` - Add steps to existing list (default)
- `edit_steps` - Modify specific step text
- `edit_title` - Change task title only
- `conversational_response` - Pure questions (no changes)

**Focus Mode Tools:**
- `break_down_step` - Generate substeps for current step
- `suggest_first_action` - Tiny action to overcome inertia
- `explain_step` - Clarify meaning
- `encourage` - Pure encouragement

**State Management:**
- `pendingAction` in AppState tracks 'replace' | 'suggest' | null
- Enables correct "Accept All" behavior (replace vs append)
- Time estimates preserved through acceptance flow

**Files:**
- `lib/ai-tools.ts` - Tool definitions + TypeScript types
- `lib/prompts.ts` - Simplified prompts with tool guidance
- `app/api/structure/route.ts` - Tool processing

### AI Staging Workflow
- **StagingArea.tsx** - Collapsible panel showing suggested changes
- **StagingReviewModal.tsx** - Modal for reviewing all suggestions
- **StagingToast.tsx** - Bottom toast for quick staging access
- Accept/reject individual suggestions, edits, or title changes
- Structured AI output via function calling: replace, suggest, edit actions

### Notes Module
- **NotesModule.tsx** - Collapsible notes section
- Auto-expanding textarea
- Single-line preview when collapsed
- Used in TaskDetail and FocusModeView

### Stuck Menu (4 Resolution Paths)
1. "Break down this step" - AI generates substeps
2. "What's my first tiny action?" - AI suggests starting point
3. "Explain this step" - AI clarifies meaning
4. "Talk it through with AI" - Opens general conversation

### Step/Substep Management
- **Move up/down** - Reorder steps and substeps
- **Delete** - Remove steps or substeps
- **Add substep** - Create nested items
- **Tap-to-edit** - Inline editing in all contexts

### Focus Mode AI Integration
- **Separate message histories** - focusModeMessages vs messages
- **Step-aware context** - AI knows current step, substeps, progress
- **Auto-collapse** - Previous step conversations collapse
- **FOCUS_MODE_PROMPT** - Specialized prompt for body double mode

### Navigation State Management
- **previousView tracking** - Back button returns to correct view
- **View migration** - Old names (queue, pool) auto-convert
- **Focus mode restoration** - Restored on page reload
- **Completion navigation override** - When task is completed, `previousView` set to `'focus'` so back always returns to Focus Queue

### Priority & Date Fields
- **Priority picker** - High (red) / Medium (amber) / Low (blue)
- **Target date** - Expected completion
- **Deadline date** - Hard deadline
- Visual indicators in task rows

### Queue Horizon Selection
- **Today** - Immediate focus
- **This Week** - Short-term commitment
- **Upcoming** - Future planning
- Dropdown on "Add to Focus" buttons

### Queue Item Step Selection
- **Entire Task** - All steps in scope
- **Specific Steps** - Multi-select subset of steps
- Focus mode respects selection (only shows selected steps)
- Progress tracked per selection

### Dark Mode Support
- Full dark mode throughout all components
- Tailwind dark: prefix on all colors
- Consistent styling in both light and dark

### Responsive AI Drawer
- **Desktop:** Side-by-side panel (w-80) with smooth toggle
- **Mobile:** Bottom sheet (50vh) with slide-up animation
- Both fully functional with same features

### Focus Mode Timer
- Running timer with MM:SS display
- Pause/resume controls
- **Timer restoration** - Survives page refresh via localStorage
- Tracks startTime and pausedTime

### Focus Mode Message Grouping
- Messages grouped by `stepId` in focus mode
- Collapsible headers for previous steps
- Current step always expanded
- Auto-collapse when moving to next step
- Shows message count per step

### Task Completion Flow
Focus mode completion triggers automatic navigation:
1. All steps complete → Task auto-marked complete
2. Success celebration screen displays (2 seconds)
3. Auto-navigates to Task Detail view
4. Success toast shows: `"{task title}" completed!`
5. Back button returns to Focus Queue

**Navigation guarantee:** Pressing "back" after completing a task always returns to Focus Queue, regardless of origin view. This provides consistent access to the "Completed" drawer.

### Health Status & Focus Score
- **focusScore** (0-100) - Computed urgency considering deadline, priority, staleness, waiting
- **complexity** (simple | moderate | complex) - Based on step/substep count
- **healthStatus** (healthy | at_risk | critical) - Based on deadlines and staleness
- Used for smart sorting in pool view

### Utility Library (lib/utils.ts)
- **Date utilities:** getTodayISO, formatDate, formatDuration, daysBetween, getTimeOfDay
- **Task utilities:** isOverdue, isDueToday, isDueSoon, getTaskProgress, wasCompletedToday
- **Step utilities:** getNextIncompleteStep, getStepProgress, getTotalEstimatedMinutes
- **Computation:** computeComplexity, computeFocusScore, computeHealthStatus
- **Sorting:** sortByPriority, sortByDeadline, sortByFocusScore, sortByCreatedAt
- **Filtering:** filterByStatus, filterInbox, filterPool, filterWaitingOn, filterResurfaced

### View State Management
- **previousView tracking** - Back button returns to correct view
- **View migration** - Old names (queue, pool) auto-convert to new (focus, tasks)
- **Focus mode restoration** - Paused sessions restore on page reload

### Toast System with Undo
- **Toast.tsx** - Notification component with action support
- Auto-dismiss after 5 seconds (configurable duration)
- Types: info, success, warning, error (color-coded)
- Undo actions for destructive operations:
  - Delete task → Undo restores task
  - Archive/Park → Undo restores previous status
  - Delete project → Undo restores project and re-assigns tasks
- Queue/workflow action toasts (all with undo):
  - Add to Focus Queue → "Added to Focus"
  - Remove from Queue → "Removed from Focus"
  - Send to Pool → "Moved to Ready"
  - Defer task → "Deferred until {date}"
- Task completion success toast (no undo)
- `showToast()` and `dismissToast()` handlers

### Projects Management
- **ProjectsView.tsx** - Dedicated view for project management
- **ProjectModal.tsx** - Create/edit modal with color picker
- Project filter chips in TasksView (tap to filter)
- Tasks grouped by project with collapsible sections
- Project colors as dots throughout UI
- Full CRUD with undo support on delete

### PWA Support
- **manifest.json** - App name, icons, theme colors, display mode
- **sw.js** - Service worker with network-first caching strategy
- **usePWA.ts** - Hook for service worker registration
- Installable on mobile (iOS/Android) and desktop
- Offline fallback to cached content
- SVG icons for crisp display at any size

### iOS PWA Dark Mode Theming ✅ NEW
Unified dark header/status bar for seamless iOS PWA appearance:

**Color System (Dark Mode):**
| Element | Color | Hex |
|---------|-------|-----|
| Body/Status bar background | Near-black | `#0c0c0c` |
| Header | Near-black | `#0c0c0c` |
| TabCluster container | Dark gray | `zinc-800` |
| TabCluster active button | Medium gray | `zinc-700` |
| SearchBar | Dark gray | `zinc-800` |
| Header border | Transparent | - |

**iOS Safe Area Handling:**
- Header uses `pt-[env(safe-area-inset-top)]` to extend behind status bar
- `viewportFit: "cover"` enables safe area insets
- Body background matches header for seamless appearance

### Visual-First Drag/Drop (Queue Reorder) ✅ NEW
Focus Queue uses a visual-first approach for drag/drop reordering:

```typescript
// lib/queue-reorder.ts
type VisualElement =
  | { kind: "item"; item: FocusQueueItem; originalIndex: number }
  | { kind: "line" };  // Today/Later separator

// Core functions:
buildVisualElements(items, todayLineIndex) → VisualElement[]
reorderVisualElements(elements, fromIndex, toIndex) → VisualElement[]
deriveStateFromVisual(elements) → { items, todayLineIndex }
```

**Benefits:**
- Treats visual layout as source of truth
- No special-case logic for line vs item moves
- Comprehensive test coverage (`npx tsx lib/queue-reorder.test.ts`)

### Today/Upcoming Visual Distinction ✅ NEW
- **Today items:** Violet tint `bg-violet-50 dark:bg-violet-900/20`
- **Today separator line:** Violet themed
- **Upcoming items:** Darker background `bg-zinc-50 dark:bg-zinc-800/80`

### Queue Item Progress Indicator ✅ NEW
- Dynamic ring chart shows step completion progress
- Replaces static circle indicator
- Completed: Solid green circle with checkmark
- Desktop: Ring swaps for drag handle on hover

### Completed Task Styling ✅ NEW
- Gray monochrome: `border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50`
- 60% opacity to fade into background
- Green checkmark circle retained as completion indicator

### Consistent Task Row Styling ✅ NEW
All task rows across the app use unified styling:
- Background: `bg-zinc-50 dark:bg-zinc-800/80`
- Border: `border-zinc-200 dark:border-zinc-700`
- Hover: `hover:border-zinc-300 dark:hover:border-zinc-600`
- Title text: `text-zinc-900 dark:text-zinc-100` (no font-medium for consistency)
- Applied to: Pool TaskRow, InboxItem, SearchView results, ProjectsView tasks, Dashboard TaskRow

### QueueView Empty State ✅ NEW
- "Completed" button hidden from header when queue is empty
- "Show completed" button appears in empty state actions
- Provides access to Completed drawer even with empty queue

### Keyboard Shortcuts ✅
Global shortcuts implemented in page.tsx:

| Key | Action |
|-----|--------|
| `n` | Focus quick capture input |
| `f` | Go to Focus tab |
| `t` | Go to Tasks tab |
| `/` | Open search, focus input |
| `Escape` | Close AI drawer / go back / close modals |
| `a` | Toggle AI drawer |

- Shortcuts disabled when typing in inputs (except Escape)
- Respects `metaKey`/`ctrlKey` for `f` and `t` to avoid browser conflicts

### Mobile AI Floating Bar ✅
Apple Music-style floating bar pattern (AIDrawer.tsx):

- **Collapsed state:** Fixed floating bar at bottom with "Ask AI for help..." prompt
- **Expanded state:** 50vh bottom sheet with full chat interface
- Smooth slide-up/down transitions
- Same functionality as desktop (messages, input, loading states)

### QuickAccess Cards (Search View) ✅
6 filter cards in SearchView.tsx when no search query:

| Card | Filter | Color |
|------|--------|-------|
| High Priority | `priority === 'high'` | Red |
| Waiting | `waitingOn !== null` | Yellow |
| Deferred | `deferredUntil !== null` | Blue |
| Completed | `status === 'complete'` | Green |
| Archived | `status === 'archived'` | Zinc |
| Projects | Navigate to ProjectsView | Purple |

- Each shows count badge
- Tap to filter, tap again to clear
- Projects card navigates to dedicated view

---

## File Structure (Actual)

```
task-copilot/
├── app/
│   ├── page.tsx              # Main app, state, routing, handlers
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind imports
│   └── api/structure/route.ts # Claude API endpoint
├── components/
│   ├── layout/
│   │   ├── Header.tsx        # Top bar with tabs
│   │   ├── TabCluster.tsx    # [Focus | Tasks] buttons
│   │   └── SearchBar.tsx     # Desktop search input
│   ├── inbox/
│   │   ├── InboxView.tsx     # Full inbox list
│   │   ├── InboxItem.tsx     # Single inbox item
│   │   └── QuickCapture.tsx  # Task capture input
│   ├── pool/
│   │   ├── PoolView.tsx      # Pool list view
│   │   └── TaskRow.tsx       # Task row component
│   ├── projects/
│   │   └── ProjectsView.tsx  # Projects management view
│   ├── queue/
│   │   ├── QueueView.tsx     # Focus Queue (home)
│   │   └── QueueItem.tsx     # Queue item row
│   ├── tasks/
│   │   └── TasksView.tsx     # Combined inbox + pool
│   ├── search/
│   │   └── SearchView.tsx    # Search + results
│   ├── task-detail/
│   │   └── TaskDetail.tsx    # Full task view with steps
│   ├── focus-mode/
│   │   └── FocusModeView.tsx # Focus mode UI
│   ├── shared/
│   │   ├── DurationInput.tsx # Hours/minutes duration selector
│   │   ├── MetadataPill.tsx  # Compact metadata badge
│   │   ├── ProjectModal.tsx  # Create/edit project modal
│   │   ├── Toast.tsx         # Toast notifications with undo
│   │   └── TriageRow.tsx     # Triage actions for inbox items
│   ├── dashboard/            # (Legacy, may be unused)
│   │   ├── Dashboard.tsx
│   │   ├── QuickCapture.tsx
│   │   ├── TaskSection.tsx
│   │   └── TaskRow.tsx
│   ├── AIDrawer.tsx          # Side panel AI chat
│   ├── NotesModule.tsx       # Collapsible notes
│   ├── StagingArea.tsx       # AI suggestions panel
│   ├── StagingReviewModal.tsx
│   ├── StagingToast.tsx
│   ├── StuckMenu.tsx         # I'm Stuck options
│   ├── TaskItem.tsx          # (May be legacy)
│   ├── TaskList.tsx          # (May be legacy)
│   └── FocusMode.tsx         # (May be legacy)
├── lib/
│   ├── types.ts              # All TypeScript interfaces
│   ├── storage.ts            # localStorage helpers
│   ├── events.ts             # Event logging
│   ├── utils.ts              # Utility functions
│   ├── queue.ts              # Queue helpers
│   ├── queue-reorder.ts      # Visual-first drag/drop reorder functions
│   ├── queue-reorder.test.ts # Tests for queue-reorder
│   ├── pool.ts               # Pool filters
│   ├── prompts.ts            # AI system prompts (simplified)
│   ├── ai-tools.ts           # AI tool definitions for function calling
│   └── usePWA.ts             # PWA service worker registration
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # App icons (SVG)
└── CLAUDE.md                 # Project context
```

---

## Verification Commands

```bash
# Run dev server
npm run dev

# Check TypeScript
npx tsc --noEmit

# Check localStorage (browser console)
JSON.parse(localStorage.getItem('focus-tools-state'))

# Build for production
npm run build
```

---

## Testing Flows

### Flow 1: Capture to Complete
1. Tasks tab → Quick capture → appears in Triage section
2. Click task → TaskDetail opens
3. Use AI Breakdown → suggestions in staging
4. Accept suggestions → steps populate
5. "Add to Today" → appears in Focus Queue
6. Focus → Focus Mode opens
7. Complete steps → exit → task complete

### Flow 2: Current POC Flow
1. Open app (Focus Queue view)
2. Click "Add from Tasks" if queue empty
3. Select task from Tasks view
4. Add to queue → Start Focus
5. Work through steps with AI support
6. Complete and exit

---

## Not Implemented (Future)

| Feature | Status | Priority |
|---------|--------|----------|
| StepSelector (partial focus) | Not started | Low |
| Nudges system | Types only | Low |
| Bulk inbox actions | Not started | Low |
| Recent searches | Not started | Low |
| Full deferral UI (date picker modal) | Minimal | Low |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01-06 | Task completion flow refinements (auto-return to Focus Queue), expanded toast notifications (queue/pool actions with undo), consistent task row styling, QueueView empty state enhancements, navigation state management updates |
| 2025-01-06 | Documented keyboard shortcuts, mobile AI floating bar, QuickAccess cards as implemented; added iOS PWA dark mode theming, visual-first drag/drop, Today/Upcoming distinction, progress ring, completed task styling; updated file structure |
| 2025-01-04 | Added PWA support (manifest.json, service worker, usePWA hook, SVG icons) |
| 2025-01-04 | Added Projects view, Toast with undo, MetadataPill; updated file structure; UI refinements (always-visible kebabs, title alignment) |
| 2025-01-03 | Added POC features: dark mode, responsive drawer, timer restoration, message grouping, celebration, health/score, step selection, utilities; AI function calling architecture; updated file structure |
| 2025-01-02 | Complete rewrite with actual implementation status |
| 2025-01 | Initial checklist for Model E |
