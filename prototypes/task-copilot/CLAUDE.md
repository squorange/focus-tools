# Task Co-Pilot: Claude Code Context

## Project Overview

Task Co-Pilot is a working prototype for an AI-powered task breakdown assistant, part of the larger "Focus Tools" project—an ADHD-friendly task management tool.

**Location:** `~/Projects/focus-tools/prototypes/task-copilot`
**Stack:** Next.js 14, React 18, Tailwind CSS, Anthropic Claude API
**Status:** Model E Complete — Multi-task workflow fully functional

**Last Updated:** January 2026

---

## Workflow Model Overview

```
INBOX → POOL → FOCUS QUEUE → COMPLETED
                    ↓
              PARKING LOT
```

| View | Purpose | Task Status |
|------|---------|-------------|
| **Inbox** | Quick capture, triage | `inbox` |
| **Pool** | Browse available tasks | `pool` |
| **Focus Queue** | Today/week commitments | `pool` (in queue) |
| **Completed** | Finished tasks | `complete` |
| **Parking Lot** | Archived tasks | `archived` |

---

## Architecture Overview

### View Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  INBOX VIEW                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ + Quick Capture: "Add a task..."                            ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ "Deal with car stuff"                              2 days ago││
│  │ [Quick → Pool]  [Triage ▾]  [Defer ▾]  [Delete]             ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ▼ "Research vacation" (expanded for triage)                 ││
│  │   Title: [___________]  Steps: [+ Add] [✨ AI Suggest]      ││
│  │   [Send to Pool]  [Add to Queue ▾]  [Defer ▾]  [Park]       ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  💬 AI Drawer (collapsible)                              [Open] │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  POOL VIEW                                                       │
│  [Search...] [Sort: Focus Score ▾]          🔔 3 need attention │
├─────────────────────────────────────────────────────────────────┤
│  ┌─ RESURFACED (2) ────────────────────────────────────────────┐│
│  │ "Research vacation"              Deferred 3 weeks ago       ││
│  │ [Add to Queue ▾]  [Keep in Pool]  [Park again]              ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─ READY TASKS ───────────────────────────────────────────────┐│
│  │ 🔴 File Taxes (3/5 steps)  Due Apr 15        [→] [Add ▾]    ││
│  │ 🟡 Prep presentation (0/4)  Target Fri       [→] [Add ▾]    ││
│  │ ⏸ Get feedback  Waiting on: Sarah           [→] [Add ▾]    ││
│  │ ○ Buy groceries                              [→] [Add ▾]    ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  💬 AI Drawer                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FOCUS QUEUE VIEW (Home)                                         │
├─────────────────────────────────────────────────────────────────┤
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║  TODAY                                                     ║  │
│  ║  ○ File Taxes                                    [→ Focus] ║  │
│  ║    All steps (2 of 5 done)                                 ║  │
│  ║  ○ Prep Presentation                             [→ Focus] ║  │
│  ║    Steps 1-3 of 7 (0 of 3 done)                            ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│  ┌─ THIS WEEK ─────────────────────────────────────────────────┐│
│  │ ○ Call dentist                                   [→ Focus]  ││
│  │ ○ Review budget                                  [→ Focus]  ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─ UPCOMING ──────────────────────────────────────────────────┐│
│  │ ○ Plan vacation                                  [→ Focus]  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Queue empty? [Add from Pool (12 ready)]  [Capture a new task]  │
├─────────────────────────────────────────────────────────────────┤
│  💬 AI Drawer                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TASK DETAIL VIEW                                                │
│  ← Back                                              File Taxes  │
├─────────────────────────────────────────────────────────────────┤
│  [Edit Title]                                [✓ Mark Complete]  │
│                                                                  │
│  Steps:                                                          │
│  ☑ 1. Gather W-2s                                               │
│  ☑ 2. Download 1099s                                            │
│  ☐ 3. Collect receipts                                [→ Focus] │
│      ☐ Medical expenses                                         │
│      ☐ Charitable donations                                     │
│  ☐ 4. Choose filing method                            [→ Focus] │
│  ☐ 5. Submit return                                   [→ Focus] │
│                                                                  │
│  [+ Add Step]         [✨ Break Down with AI]                   │
│                                                                  │
│  Priority: [🔴 High ▾]     Due: [Apr 15] ⚠️ Deadline            │
│  Project: [Personal ▾]      Effort: [Deep ▾]                    │
│  ⏸ Waiting on: [____________]                                   │
│                                                                  │
│  [Add to Queue ▾]  [Archive]  [Delete]                          │
├─────────────────────────────────────────────────────────────────┤
│  💬 AI Drawer                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FOCUS MODE VIEW                                                 │
│  ← Exit                                           12:34 [⏸]     │
├─────────────────────────────────────────────────────────────────┤
│                        File Taxes                                │
│                                                                  │
│                     Step 3 of 5                                  │
│            ████████████░░░░░░░░░░░░░░░░  (2 done)               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │         Collect receipts for deductions                     ││
│  │         ☐ Medical expenses                                  ││
│  │         ☐ Charitable donations                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│        [ ✓ Done ]           [ I'm Stuck ]                       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  💬 Working on Step 3. Here if you need me.                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Complete Type Definitions

```typescript
// ============ Schema Version ============
const SCHEMA_VERSION = 2;

// ============ Task ============

interface Task {
  id: string;
  title: string;
  shortLabel: string | null;        // ~20 chars for compact UI
  description: string | null;
  steps: Step[];
  
  // Status & lifecycle
  status: 'inbox' | 'pool' | 'complete' | 'archived';
  completionType: 'step_based' | 'manual';
  completedAt: number | null;
  archivedAt: number | null;
  archivedReason: 'completed_naturally' | 'abandoned' | 'parked' | 'duplicate' | null;
  deletedAt: number | null;
  
  // Waiting On (non-blocking flag)
  waitingOn: {
    who: string;
    since: number;
    followUpDate: string | null;
    notes: string | null;
  } | null;
  
  // Deferral
  deferredUntil: string | null;     // ISO date to resurface
  deferredAt: number | null;
  deferredCount: number;
  
  // Organization
  priority: 'high' | 'medium' | 'low' | null;
  tags: string[];
  projectId: string | null;
  context: string | null;
  
  // Dates
  targetDate: string | null;        // ISO date (YYYY-MM-DD)
  deadlineDate: string | null;      // ISO date (YYYY-MM-DD)
  
  // Effort & time
  effort: 'quick' | 'medium' | 'deep' | null;
  estimatedMinutes: number | null;
  totalTimeSpent: number;
  focusSessionCount: number;
  
  // Ownership (for future collaboration)
  createdBy: string | null;
  assignedTo: string | null;
  sharedWith: string[];
  source: TaskSource;
  
  // Attachments & links
  attachments: Attachment[];
  externalLinks: ExternalLink[];
  recurrence: RecurrenceRule | null;
  
  // Intelligence fields
  estimationAccuracy: number | null;
  firstFocusedAt: number | null;
  timesStuck: number;
  stuckResolutions: StuckResolution[];
  aiAssisted: boolean;
  aiSuggestionsAccepted: number;
  aiSuggestionsRejected: number;
  predictedDuration: number | null;
  completionProbability: number | null;
  similarTaskIds: string[];
  daysFromTarget: number | null;
  daysFromDeadline: number | null;
  
  // Computed visualization (updated by system)
  focusScore: number | null;        // 0-100
  complexity: 'simple' | 'moderate' | 'complex' | null;
  healthStatus: 'healthy' | 'at_risk' | 'critical' | null;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  version: number;
}

type TaskSource = 
  | 'manual'
  | 'ai_breakdown'
  | 'ai_suggestion'
  | 'shared'
  | 'email'
  | 'calendar'
  | 'voice';

// ============ Step & Substep ============

interface Step {
  id: string;
  text: string;
  shortLabel: string | null;        // ~15 chars
  substeps: Substep[];
  
  // Completion
  completed: boolean;
  completedAt: number | null;
  
  // Effort & estimation
  effort: 'quick' | 'medium' | 'deep' | null;
  estimatedMinutes: number | null;
  estimateSource: 'user' | 'ai' | null;
  
  // Time tracking
  timeSpent: number;                // Actual minutes from sessions
  firstFocusedAt: number | null;    // When first worked on
  
  // Computed analytics
  estimationAccuracy: number | null; // estimate / actual
  complexity: 'simple' | 'moderate' | 'complex' | null;
  
  // Context (optional override from task)
  context: string | null;
  
  // Metadata
  timesStuck: number;
  source: 'manual' | 'ai_generated' | 'ai_suggested';
  wasEdited: boolean;
}

interface Substep {
  id: string;
  text: string;
  shortLabel: string | null;        // ~12 chars
  completed: boolean;
  completedAt: number | null;
  source: 'manual' | 'ai_generated' | 'ai_suggested';
}

// ============ Focus Queue ============

interface FocusQueue {
  items: FocusQueueItem[];
  lastReviewedAt: number;
}

interface FocusQueueItem {
  id: string;
  taskId: string;
  
  // Step selection
  selectionType: 'entire_task' | 'specific_steps';
  selectedStepIds: string[];        // Empty if entire_task
  
  // Time commitment
  horizon: 'today' | 'this_week' | 'upcoming';
  scheduledDate: string | null;     // Specific date within week
  order: number;
  
  // Source
  addedBy: 'user' | 'ai_suggested';
  addedAt: number;
  reason: FocusReason | null;
  
  // Completion
  completed: boolean;
  completedAt: number | null;
  
  // Staleness tracking
  lastInteractedAt: number;
  horizonEnteredAt: number;
  rolloverCount: number;
}

type FocusReason = 
  | 'deadline_today'
  | 'deadline_approaching'
  | 'user_selected'
  | 'ai_suggested'
  | 'quick_win'
  | 'blocking_others'
  | 'build_momentum'
  | 'energy_match';

// ============ Projects & Users ============

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}

interface User {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

// ============ Event Log ============

interface Event {
  id: string;
  timestamp: number;
  type: EventType;
  taskId: string | null;
  stepId: string | null;
  queueItemId: string | null;
  data: Record<string, any>;
  context: EventContext;
}

type EventType =
  // Task lifecycle
  | 'task_created' | 'task_updated' | 'task_completed' | 'task_reopened'
  | 'task_archived' | 'task_restored' | 'task_deleted'
  // Step lifecycle
  | 'step_created' | 'step_completed' | 'step_uncompleted' | 'substep_completed'
  // Focus queue
  | 'queue_item_added' | 'queue_item_removed' | 'queue_item_completed'
  | 'queue_horizon_changed' | 'queue_selection_changed' | 'queue_item_rolled_over'
  // Focus sessions
  | 'focus_started' | 'focus_paused' | 'focus_resumed' | 'focus_ended'
  // Stuck & unblocking
  | 'stuck_reported' | 'stuck_resolved' | 'stuck_skipped'
  // AI interactions
  | 'ai_breakdown_requested' | 'ai_breakdown_accepted' | 'ai_breakdown_rejected'
  | 'ai_suggestion_shown' | 'ai_suggestion_accepted' | 'ai_suggestion_dismissed'
  | 'ai_help_requested'
  // Deferral & waiting
  | 'task_deferred' | 'task_resurfaced' | 'waiting_on_set' | 'waiting_on_cleared'
  // Nudges
  | 'nudge_shown' | 'nudge_dismissed' | 'nudge_snoozed' | 'nudge_actioned'
  // Other
  | 'estimate_set' | 'estimate_updated' | 'priority_changed' | 'date_changed';

interface EventContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  energyLevel: 'low' | 'medium' | 'high' | null;
  sessionDuration: number | null;
  tasksCompletedToday: number;
  focusSessionsToday: number;
  device: 'desktop' | 'mobile' | null;
}

// ============ Focus Session ============

interface FocusSession {
  id: string;
  queueItemId: string;
  taskId: string;
  selectionType: 'entire_task' | 'specific_steps';
  targetedStepIds: string[];
  
  startTime: number;
  endTime: number | null;
  totalDuration: number;
  pauseDuration: number;
  adjustedDuration: number | null;
  adjustmentReason: string | null;
  
  stepsCompleted: string[];
  substepsCompleted: string[];
  stuckEvents: StuckEvent[];
  
  context: EventContext;
  outcome: 'completed_task' | 'completed_goal' | 'made_progress' | 'no_progress' | 'abandoned' | null;
  userRating: number | null;
}

interface StuckEvent {
  stepId: string;
  timestamp: number;
  resolution: 'broke_down' | 'skipped' | 'talked_through' | 'took_break' | 'other';
  timeToResolve: number;
  resultedInCompletion: boolean;
}

// ============ Nudges ============

interface Nudge {
  id: string;
  type: NudgeType;
  targetId: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  createdAt: number;
  expiresAt: number | null;
  status: 'pending' | 'dismissed' | 'snoozed' | 'actioned';
  respondedAt: number | null;
}

type NudgeType =
  | 'inbox_full'
  | 'today_untouched'
  | 'queue_item_stale'
  | 'deadline_approaching'
  | 'pool_item_stale'
  | 'waiting_followup_due'
  | 'deferred_resurfaced';

interface SnoozedNudge {
  id: string;
  nudgeType: NudgeType;
  targetId: string;
  snoozedAt: number;
  snoozeUntil: number;
  snoozeCount: number;
}

// ============ Supporting Types ============

interface Attachment {
  id: string;
  type: 'image' | 'document' | 'link' | 'note';
  name: string;
  url: string | null;
  localUri: string | null;
  mimeType: string | null;
  size: number | null;
  thumbnailUrl: string | null;
  stepId: string | null;
  caption: string | null;
  createdAt: number;
}

interface ExternalLink {
  system: 'calendar' | 'email' | 'github' | 'jira' | 'notion' | 'other';
  externalId: string;
  url: string | null;
  syncedAt: number | null;
}

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  endDate: string | null;
  endAfter: number | null;
}

interface StuckResolution {
  timestamp: number;
  stuckOnStepId: string;
  resolution: 'broke_down' | 'skipped' | 'talked_through' | 'took_break' | 'other';
  resultedInCompletion: boolean;
  timeToResolve: number;
}

// ============ App State ============

interface AppState {
  schemaVersion: number;
  currentUser: User | null;
  
  // Data
  tasks: Task[];
  projects: Project[];
  
  // Focus Queue
  focusQueue: FocusQueue;
  
  // Intelligence data
  events: Event[];
  focusSessions: FocusSession[];
  nudges: Nudge[];
  snoozedNudges: SnoozedNudge[];
  
  // Navigation
  currentView: 'focus' | 'tasks' | 'inbox' | 'projects' | 'search' | 'taskDetail' | 'focusMode';
  activeTaskId: string | null;
  
  // Focus mode
  focusMode: FocusModeState;
  currentSessionId: string | null;
  
  // AI
  aiDrawer: AIDrawerState;
  
  // Filters & sort
  filters: FilterState;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  
  // UI state
  completedTodayExpanded: boolean;
  error: string | null;
}

interface FocusModeState {
  active: boolean;
  queueItemId: string | null;
  taskId: string | null;
  currentStepId: string | null;
  paused: boolean;
  startTime: number | null;
  pausedTime: number;
}

interface AIDrawerState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  context: 'inbox' | 'pool' | 'queue' | 'task' | 'focus';
}

interface FilterState {
  status: ('inbox' | 'pool' | 'complete' | 'archived')[];
  priority: ('high' | 'medium' | 'low' | null)[];
  tags: string[];
  projectId: string | null;
  context: string | null;
  search: string;
  showWaitingOn: boolean;
  showDeferred: boolean;
}

type SortOption = 
  | 'focusScore'
  | 'priority' 
  | 'targetDate' 
  | 'deadlineDate' 
  | 'createdAt' 
  | 'updatedAt';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface SuggestedStep {
  text: string;
  shortLabel: string | null;
  substeps: string[];
  estimatedMinutes: number | null;
}
```

---

## Helper Functions

```typescript
// ============ Task Helpers ============

function createTask(title: string, source: TaskSource = 'manual'): Task {
  const now = Date.now();
  return {
    id: generateId(),
    title,
    shortLabel: null,
    description: null,
    steps: [],
    status: 'inbox',
    completionType: 'manual',
    completedAt: null,
    archivedAt: null,
    archivedReason: null,
    deletedAt: null,
    waitingOn: null,
    deferredUntil: null,
    deferredAt: null,
    deferredCount: 0,
    priority: null,
    tags: [],
    projectId: null,
    context: null,
    targetDate: null,
    deadlineDate: null,
    effort: null,
    estimatedMinutes: null,
    totalTimeSpent: 0,
    focusSessionCount: 0,
    createdBy: null,
    assignedTo: null,
    sharedWith: [],
    source,
    attachments: [],
    externalLinks: [],
    recurrence: null,
    estimationAccuracy: null,
    firstFocusedAt: null,
    timesStuck: 0,
    stuckResolutions: [],
    aiAssisted: false,
    aiSuggestionsAccepted: 0,
    aiSuggestionsRejected: 0,
    predictedDuration: null,
    completionProbability: null,
    similarTaskIds: [],
    daysFromTarget: null,
    daysFromDeadline: null,
    focusScore: null,
    complexity: null,
    healthStatus: null,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

function createStep(text: string, source: Step['source'] = 'manual'): Step {
  return {
    id: generateId(),
    text,
    shortLabel: null,
    substeps: [],
    completed: false,
    completedAt: null,
    effort: null,
    estimatedMinutes: null,
    estimateSource: null,
    timeSpent: 0,
    firstFocusedAt: null,
    estimationAccuracy: null,
    complexity: null,
    context: null,
    timesStuck: 0,
    source,
    wasEdited: false,
  };
}

function createFocusQueueItem(
  taskId: string,
  horizon: FocusQueueItem['horizon'] = 'today',
  selectionType: FocusQueueItem['selectionType'] = 'entire_task',
  selectedStepIds: string[] = []
): FocusQueueItem {
  const now = Date.now();
  return {
    id: generateId(),
    taskId,
    selectionType,
    selectedStepIds,
    horizon,
    scheduledDate: null,
    order: 0,
    addedBy: 'user',
    addedAt: now,
    reason: 'user_selected',
    completed: false,
    completedAt: null,
    lastInteractedAt: now,
    horizonEnteredAt: now,
    rolloverCount: 0,
  };
}

// ============ Queue Completion Logic ============

function isQueueItemComplete(item: FocusQueueItem, task: Task): boolean {
  if (item.selectionType === 'entire_task') {
    return task.steps.length === 0 
      ? false  // Manual completion required
      : task.steps.every(s => s.completedAt !== null);
  } else {
    return item.selectedStepIds.every(stepId => {
      const step = task.steps.find(s => s.id === stepId);
      return step?.completedAt !== null;
    });
  }
}

function isTaskComplete(task: Task): boolean {
  if (task.completionType === 'manual') {
    return task.completedAt !== null;
  }
  return task.steps.length > 0 && task.steps.every(s => s.completedAt !== null);
}

// ============ Pool Filtering ============

function getPoolTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => 
    t.status === 'pool' && 
    !t.deletedAt &&
    (!t.deferredUntil || t.deferredUntil <= getTodayISO())
  );
}

function getResurfacedTasks(tasks: Task[]): Task[] {
  const today = getTodayISO();
  return tasks.filter(t => 
    t.status === 'pool' && 
    !t.deletedAt &&
    t.deferredUntil && 
    t.deferredUntil <= today
  );
}

function getWaitingOnTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => 
    t.status === 'pool' && 
    !t.deletedAt &&
    t.waitingOn !== null
  );
}

// ============ Utilities ============

function generateId(): string {
  return crypto.randomUUID();
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}
```

---

## File Structure (Actual)

```
task-copilot/
├── app/
│   ├── page.tsx              # Main app, state, routing, all handlers
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind imports
│   └── api/structure/route.ts # Claude API endpoint
├── components/
│   ├── layout/
│   │   ├── Header.tsx        # Top bar with tabs, search, AI toggle
│   │   ├── TabCluster.tsx    # [Focus | Tasks] buttons
│   │   └── SearchBar.tsx     # Desktop search input
│   ├── inbox/
│   │   ├── InboxView.tsx     # Full inbox list (drill-in)
│   │   ├── InboxItem.tsx     # Single inbox item
│   │   └── QuickCapture.tsx  # Task capture input
│   ├── queue/
│   │   ├── QueueView.tsx     # Focus Queue home with horizons
│   │   └── QueueItem.tsx     # Queue item row
│   ├── tasks/
│   │   └── TasksView.tsx     # Combined inbox + pool view
│   ├── search/
│   │   └── SearchView.tsx    # Search + results
│   ├── task-detail/
│   │   └── TaskDetail.tsx    # Full task view with steps
│   ├── focus-mode/
│   │   └── FocusModeView.tsx # Focus mode UI
│   ├── pool/
│   │   ├── PoolView.tsx      # Pool list view
│   │   └── TaskRow.tsx       # Task row component
│   ├── projects/
│   │   └── ProjectsView.tsx  # Projects management view
│   ├── shared/
│   │   ├── DurationInput.tsx # Hours/minutes duration selector
│   │   ├── FocusSelectionModal.tsx # Step selection for Today/Upcoming
│   │   ├── HealthPill.tsx    # Health status pill with tooltip
│   │   ├── MetadataPill.tsx  # Compact metadata badge
│   │   ├── ProjectModal.tsx  # Create/edit project modal
│   │   ├── ReminderPicker.tsx # Reminder selection dropdown
│   │   ├── Toast.tsx         # Toast notifications with undo
│   │   └── TriageRow.tsx     # Triage actions for inbox items
│   ├── AIDrawer.tsx          # Side panel AI chat
│   ├── NotesModule.tsx       # Collapsible notes section
│   ├── StagingArea.tsx       # AI suggestions panel
│   ├── StagingReviewModal.tsx # Bulk suggestion review
│   ├── StagingToast.tsx      # Staging notification
│   └── StuckMenu.tsx         # I'm Stuck options menu
├── lib/
│   ├── types.ts              # All TypeScript interfaces
│   ├── storage.ts            # localStorage helpers with migration
│   ├── events.ts             # Event logging
│   ├── utils.ts              # Utility functions
│   ├── queue.ts              # Queue helpers
│   ├── queue-reorder.ts      # Visual-first drag/drop reorder functions
│   ├── queue-reorder.test.ts # Tests for queue-reorder (npx tsx lib/queue-reorder.test.ts)
│   ├── pool.ts               # Pool filters
│   ├── notifications.ts      # PWA notification helpers for reminders
│   ├── prompts.ts            # AI system prompts (simplified)
│   ├── ai-tools.ts           # AI tool definitions for function calling
│   ├── ai-actions.ts         # Central registry for AI action labels/icons/queries
│   ├── ai-constants.ts       # Animation, layout, quick actions config
│   └── usePWA.ts             # PWA service worker registration hook
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # App icons (SVG)
└── CLAUDE.md                 # This file
```

---

## Navigation Flow (2-Tab Model)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Focus │ Tasks]        🔍 Search...                      [💬]  │
├─────────────────────────────────────────────────────────────────┤
│                     Main Content                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Tab | View | Purpose |
|-----|------|---------|
| **Focus** | QueueView | Home - Today/Week/Upcoming queue |
| **Tasks** | TasksView | Combined Inbox (Triage) + Pool (Ready) |
| 🔍 | SearchView | Search across all tasks |
| 📁 | ProjectsView | Project management (drill-in from Tasks) |

```
Focus Tab ──► QueueView ──► TaskDetail ──► FocusMode
                  │              │
Tasks Tab ──► TasksView ─┘       │
                  │              │
         InboxView (drill-in) ───┘
                  │
         ProjectsView (drill-in)
```

**State-based routing in page.tsx:**
```typescript
{currentView === 'focus' && <QueueView ... />}
{currentView === 'tasks' && <TasksView ... />}
{currentView === 'inbox' && <InboxView ... />}
{currentView === 'projects' && <ProjectsView ... />}
{currentView === 'search' && <SearchView ... />}
{currentView === 'taskDetail' && <TaskDetail ... />}
{currentView === 'focusMode' && <FocusModeView ... />}
```

---

## AI Integration (Four-Surface Model)

The AI assistant uses a four-surface interaction model:

| Surface | Role | Persistence | Content Type |
|---------|------|-------------|--------------|
| **MiniBar** | Status bar + notification | Always visible | One-line status, icons |
| **Palette** | Conversational layer | Ephemeral (auto-minimize) | Text responses, input |
| **Drawer** | Extended chat | Session (until closed) | Full history, multi-turn |
| **StagingArea** | Decision workspace | Until resolved | Steps, edits, suggestions |

### Context-Aware Behavior

| Context | Quick Actions | Contextual Prompts | MiniBar Idle Status |
|---------|---------------|-------------------|-------------------|
| **Queue** | 🎯 What next?, Plan my day | "Need help?" + [What next?] | "N tasks for today" |
| **Task Detail** | 📋 Break down, ⏱ Estimate | "Need help?" + [Break down] | "N/M steps • ~X min" |
| **Focus Mode** | 📋 Break down, 👉 Help me start | "Need help?" + [Help me start] | "Step N of M" |
| **Inbox** | 📥 Help triage, ⚡ Priority? | — | "N items to triage" |

### MiniBar States

| State | Content | Tap Action |
|-------|---------|------------|
| Idle | "Ask AI..." | Expand Palette |
| Contextual status | "3 tasks for today" | Expand Palette |
| Contextual prompt | "Need help?" + [🎯 What next?] | Pill triggers action |
| Loading | "Thinking..." (shimmer) | None |
| Response ready | "Response ready" | Expand Palette |
| Suggestions ready | "5 suggestions ready" | Scroll to StagingArea |
| Confirmation | "✓ Added 5 steps" | Fades to idle |

### Drawer Access

- **Location:** `↗️` icon inside Palette input field (bottom-left)
- **Auto-suggest:** After 3+ exchanges, shows "Continue in expanded view →"
- **History:** Full conversation history preserved

---

## Empty States

| View | Condition | Message | Actions |
|------|-----------|---------|---------|
| Queue (Today) | No today items | "No items for today." | [Add from Pool (N ready)] |
| Queue (All) | Queue empty, pool has items | "No items queued." | [Add from Pool (N ready)] [Show completed] |
| Queue (All) | Queue empty, pool empty, inbox has items | "No items queued." | [Go to Inbox (N items)] [Show completed] |
| Queue (All) | Everything empty | "No items queued yet." | [Capture your first task] [Show completed] |
| Pool | Pool empty | "No tasks in pool." | [Go to Inbox] [Capture] |
| Inbox | Inbox empty | "Inbox empty." | [Capture something] |

**Queue "Completed" Button Visibility:**
- When queue has items: "Completed" button shows in header (with count badge if > 0)
- When queue is empty: "Completed" button hidden from header, "Show completed" button appears in empty state

---

## Key Implementation Notes

1. **Focus Queue is home** — app opens to Queue view
2. **One queue entry per task** — no duplicates
3. **Step selection** — entire task OR specific steps (multi-select)
4. **Waiting On is non-blocking** — can still focus on other steps
5. **Deferral hides from Pool** — resurfaces on date
6. **AI MiniBar always visible** — context-aware status and prompts
7. **List-based UI for MVP** — Orbital Zen deferred

---

## AI Function Calling Architecture

The AI uses Claude's function calling (tool_use) for guaranteed structured output. This replaced JSON-in-text parsing for reliability.

### Why Function Calling?

| Aspect | Previous (JSON in text) | Current (Function Calling) |
|--------|------------------------|---------------------------|
| Reliability | ~85% (prompt-dependent) | ~99%+ (native) |
| Validation | Manual JSON parsing | SDK handles it |
| Error handling | Parse failures | Clean tool results |

### Planning Mode Tools (Task Structuring)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `replace_task_steps` | Initial breakdown or complete rewrite | Empty list OR user says "start over" |
| `suggest_additions` | Add steps to existing list | **DEFAULT** - any "break down", "add steps", "help me" |
| `edit_steps` | Modify specific step text | User wants to reword/simplify |
| `edit_title` | Change the task title | User says "rename", "change title" |
| `conversational_response` | Pure questions only | **NEVER** for breakdown requests |

### Focus Mode Tools (Body Double)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `break_down_step` | Break current step into substeps | **DEFAULT** - any "break down", "stuck", "help" |
| `suggest_first_action` | Tiny action to overcome inertia | User asks "where do I start?" |
| `explain_step` | Clarify what the step means | User asks "what does this mean?" |
| `encourage` | Pure encouragement | **NEVER** for breakdown requests |

### API Route Pattern

```typescript
// app/api/structure/route.ts
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: systemPrompt,
  messages: messages,
  tools: isFocusMode ? focusModeTools : structuringTools,
  tool_choice: { type: "any" },  // Must call a tool
});

const toolUse = response.content.find(b => b.type === "tool_use");
const result = processToolResult(toolUse.name, toolUse.input);
```

### Client-Side State

```typescript
// AppState includes:
pendingAction: 'replace' | 'suggest' | null;  // Track action type for staging
```

- `'replace'` - "Accept All" replaces all steps (from `replace_task_steps`)
- `'suggest'` - "Accept All" adds to existing (from `suggest_additions`, `break_down_step`)
- `null` - No pending changes

### Files

| File | Purpose |
|------|---------|
| `lib/ai-tools.ts` | Tool definitions + TypeScript types |
| `lib/prompts.ts` | System prompts with tool guidance |
| `app/api/structure/route.ts` | API endpoint, tool processing |

### AI Actions Registry

All AI action definitions (labels, icons, queries) are centralized in `lib/ai-actions.ts`. This prevents terminology drift across different UI surfaces.

**Consumers:**
- `lib/ai-constants.ts` - Quick action buttons in Palette
- `hooks/useContextualPrompts.ts` - Auto-prompts in MiniBar
- `components/StuckMenu.tsx` - Stuck resolution options

**Current Actions:**

| Context | Action ID | Label | Icon | Query |
|---------|-----------|-------|------|-------|
| focusMode | `breakdown` | Break down | 📋 | Break this into smaller steps |
| focusMode | `helpMeStart` | Help me start | 👉 | What's my first tiny action? |
| focusMode | `clarify` | What does this mean? | ❓ | Can you explain what this step means? |
| taskDetail | `breakdown` | Break down | 📋 | Break this task into steps |
| taskDetail | `estimate` | Estimate | ⏱ | How long will this take? |
| queue | `whatNext` | What next? | 🎯 | What should I work on next? |
| queue | `reorder` | Reorder | ↕️ | Help me prioritize my queue |
| inbox | `triage` | Help triage | 📥 | Help me triage these items |
| inbox | `priority` | Priority? | ⚡ | What priority should this be? |

**Adding new actions:**
1. Add to `AI_ACTIONS` in `lib/ai-actions.ts`
2. Reference via `AI_ACTIONS.context.actionId` in consuming code

---

## POC Enhancements (Beyond Original Spec)

### AI Staging Workflow
The AI returns structured output that appears in a staging module for user acceptance:

```typescript
interface StructureResponse {
  action: 'replace' | 'suggest' | 'edit' | 'none';
  suggestions: SuggestedStep[] | null;  // New steps/substeps
  edits: EditSuggestion[] | null;       // Changes to existing
  suggestedTitle: string | null;        // Title improvement
  message: string;                      // Conversational response
}
```

**Components:**
- `StagingArea.tsx` - Collapsible panel showing pending changes
- `StagingReviewModal.tsx` - Modal for bulk accept/reject
- `StagingToast.tsx` - Bottom notification for staging

### Separate Focus Mode AI
Focus mode uses a different system prompt (`FOCUS_MODE_PROMPT`) optimized for body double support:
- Step-aware context (current step, substeps, progress)
- Separate message history (`task.focusModeMessages`)
- Four stuck resolution paths
- Encouragement-focused responses

### Stuck Menu (4 Options)
1. **"Break down this step"** - AI generates substeps for current step
2. **"What's my first tiny action?"** - AI suggests starting point
3. **"Explain this step"** - AI clarifies meaning
4. **"Talk it through with AI"** - Opens general conversation

### Notes Module
- `NotesModule.tsx` - Collapsible notes section
- Auto-expanding textarea
- Single-line preview when collapsed
- Used in TaskDetail and FocusModeView

### Step/Substep Management
Full CRUD operations with reordering:
- `handleMoveStepUp/Down` - Reorder steps
- `handleMoveSubstepUp/Down` - Reorder substeps
- `handleAddSubstep` - Add nested items
- `handleDeleteStep/Substep` - Remove items
- `handleUpdateStep/Substep` - Edit text

### Navigation State Management
- `previousView` - Tracks where user came from for back navigation
- View migration - Old names (queue, pool) auto-convert to new (focus, tasks)
- Focus mode restoration - Paused sessions restore on reload
- **Completion navigation override:** When a task is completed (from focus mode or task detail), `previousView` is set to `'focus'` so back always returns to Focus Queue

### Queue Item Step Selection
- **Entire Task** - All steps in scope when added to queue
- **Specific Steps** - Multi-select subset of steps
- Focus mode respects selection (only shows selected steps)
- Progress tracked per selection

### Add to Focus Pattern (January 2026)
Simplified one-click pattern with dropdown for options:

**"Add to Focus" Button (Split Button):**
- **Main click:** Add to Upcoming (first position below Today line)
- **Dropdown arrow:** Shows "Add to Today" option
- Available in: TaskDetail, TaskRow (Pool)

**"Edit Focus" Button:**
- Only shows when task is already in Focus Queue
- Located in Steps header (conditional swap with "AI Breakdown")
- Opens FocusSelectionModal for adjusting Today/Upcoming selection

### Focus Selection Modal (Simplified)
Modal for editing which steps are Today vs Upcoming (only for tasks already in queue):

**Entry Points:**
| Entry Point | Button Label |
|-------------|--------------|
| Focus Queue → TaskDetail Steps header | "Edit Focus" |
| Focus Queue → QueueItem kebab menu | "Edit Focus" |

**Modal Features (Simplified):**
- Just checkbox list (no segmented control)
- Checked = Today (violet highlight)
- Unchecked = Upcoming (neutral)
- Completed steps = strikethrough + disabled
- "Select all" / "Clear all" bulk buttons
- Footer summary: "N steps for Today · M for Upcoming"
- "Save" button confirms

**TaskDetail Today/Upcoming Sections:**
When viewing a queued task, steps are grouped with section headers:
- **TODAY** section: Violet tint (`bg-violet-50 dark:bg-violet-900/20`), violet left border
- **UPCOMING** section: Normal styling, zinc left border
- Section headers only show when task is in Focus Queue

**Mental Model:**
```
Checked steps → TODAY section (violet tint)
Unchecked steps → UPCOMING section (normal)
```

**Files:**
- `components/shared/FocusSelectionModal.tsx` - Modal component (simplified)
- `components/task-detail/TaskDetail.tsx` - Add to Focus dropdown, Edit Focus in Steps header
- `components/pool/TaskRow.tsx` - Add to Focus dropdown
- `components/queue/QueueItem.tsx` - "Edit Focus" in kebab menu

### Visual-First Drag/Drop (Queue Reorder)
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

**How it works:**
1. Build unified visual array from items + line position
2. Drag/drop operates on this flat array (simple splice operations)
3. Derive new state (items order + todayLineIndex) from visual result

**Benefits:**
- Treats visual layout as source of truth
- No special-case logic for line vs item moves
- Easy to reason about edge cases
- Comprehensive test coverage (`npx tsx lib/queue-reorder.test.ts`)

### Toast System with Undo
- `Toast.tsx` - Notification component with action support
- Auto-dismiss after 5 seconds (configurable)
- Types: info, success, warning, error
- Undo actions for destructive operations:
  - Delete task → Undo restores task
  - Archive/Park task → Undo restores previous status
  - Delete project → Undo restores project and re-assigns tasks
- Queue/workflow action toasts (all with undo):
  - Add to Focus Queue → "Added to Focus"
  - Remove from Queue → "Removed from Focus"
  - Send to Pool → "Moved to Ready"
  - Defer task → "Deferred until {date}"
- Task completion success toast (no undo)
- `showToast()` and `dismissToast()` handlers in page.tsx

### Projects Management
- `ProjectsView.tsx` - Dedicated view for managing projects
- `ProjectModal.tsx` - Create/edit project modal with color picker
- Project filter chips in TasksView (tap to filter by project)
- Tasks grouped by project with expandable sections
- Project colors displayed as dots throughout UI
- CRUD operations: create, update, delete (with undo)

### PWA Support
- `manifest.json` - App metadata, theme colors, icons
- `sw.js` - Service worker for offline caching (network-first strategy)
- `usePWA.ts` - Hook for service worker registration
- App installable on mobile and desktop
- Offline fallback to cached content
- iOS and Android home screen support

### Dark Mode Support
- Full dark mode throughout all components
- Tailwind `dark:` prefix on all colors
- Consistent styling in both light and dark themes

### iOS PWA Dark Mode Theming (January 2025)
Unified dark header/status bar for seamless iOS PWA appearance:

**Color System (Dark Mode):**
| Element | Color | Hex |
|---------|-------|-----|
| Body/Status bar background | Near-black | `#0c0c0c` |
| Header | Near-black | `#0c0c0c` |
| TabCluster container | Dark gray | `zinc-800` (#27272a) |
| TabCluster active button | Medium gray | `zinc-700` (#3f3f46) |
| SearchBar | Dark gray | `zinc-800` (#27272a) |
| Header border | Transparent | - |

**iOS Safe Area Handling:**
- Header uses `pt-[env(safe-area-inset-top)]` to extend behind status bar
- `viewportFit: "cover"` in viewport config enables safe area insets
- `apple-mobile-web-app-status-bar-style: "black-translucent"` makes status bar transparent
- Body background matches header so transparent status bar appears seamless

**Completed Task Row Styling:**
- Gray monochrome: `border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50`
- 60% opacity to fade into background
- Green checkmark circle retained as completion indicator

**Today vs Upcoming Visual Distinction:**
- Today items: Violet tint `bg-violet-50 dark:bg-violet-900/20`
- Today separator line: Violet themed
- Upcoming items: Darker background `bg-zinc-50 dark:bg-zinc-800/80`

**Consistent Task Row Styling (All Views):**
All task rows across the app use unified styling:
- Background: `bg-zinc-50 dark:bg-zinc-800/80`
- Border: `border-zinc-200 dark:border-zinc-700`
- Hover: `hover:border-zinc-300 dark:hover:border-zinc-600`
- Title text: `text-zinc-900 dark:text-zinc-100` (no font-medium for consistency)
- Applied to: Pool TaskRow, InboxItem, SearchView results, ProjectsView tasks, Dashboard TaskRow

**Queue Item Progress Indicator:**
- Dynamic ring chart shows step completion progress
- Replaces static circle indicator
- Completed: Solid green circle with checkmark
- Desktop: Ring swaps for drag handle on hover

### Responsive AI Drawer
- **Desktop:** Side-by-side panel (w-80) with smooth toggle animation
- **Mobile:** Bottom sheet (50vh) with slide-up animation
- Both implementations fully functional with same features
- Detected via viewport/user-agent

### Mobile AI Floating Bar
Apple Music-style floating bar pattern (in AIDrawer.tsx):
- **Collapsed:** Fixed bar at bottom with "Ask AI for help..." prompt
- **Expanded:** Slides up to 50vh bottom sheet with full chat
- Smooth transitions, backdrop blur, shadow styling
- Same message history and input as desktop

### Keyboard Shortcuts
Global shortcuts in page.tsx:

| Key | Action |
|-----|--------|
| `n` | Focus quick capture input |
| `f` | Go to Focus tab |
| `t` | Go to Tasks tab |
| `/` | Open search, focus input |
| `Escape` | Close AI drawer / go back / close modals |
| `a` | Toggle AI drawer |

- Disabled when typing in inputs (except Escape)
- Respects metaKey/ctrlKey for `f` and `t`

### QuickAccess Cards (Search View)
6 filter cards shown when search is empty:
- **High Priority** (red) - `priority === 'high'`
- **Waiting** (yellow) - `waitingOn !== null`
- **Deferred** (blue) - `deferredUntil !== null`
- **Completed** (green) - `status === 'complete'`
- **Archived** (zinc) - `status === 'archived'`
- **Projects** (purple) - navigates to ProjectsView

Each shows count badge; tap to filter, tap again to clear.

### Focus Mode Timer
- Running timer with MM:SS display
- Pause/resume controls
- **Timer restoration** - Survives page refresh via localStorage
- Tracks `startTime` and `pausedTime` for accurate duration

### Focus Mode Message Grouping
- Messages grouped by `stepId` in focus mode
- Collapsible headers for previous steps (shows message count)
- Current step messages always expanded
- Auto-collapse when moving to next step

### Task Completion Flow
Focus mode completion triggers automatic navigation:
1. All steps complete → Task auto-marked complete
2. Success celebration screen displays (2 seconds)
3. Auto-navigates to Task Detail view
4. Success toast shows: `"{task title}" completed!`
5. Back button returns to Focus Queue

**Navigation guarantee:** Pressing "back" after completing a task always returns to Focus Queue, regardless of where the user originally came from. This provides consistent access to the "Completed" drawer.

### Health Status & Focus Score
- **focusScore** (0-100) - Computed urgency considering deadline, priority, staleness, waiting
- **complexity** (simple | moderate | complex) - Based on step/substep count
- **healthStatus** (healthy | at_risk | critical) - Based on deadlines and staleness
- Used for smart sorting in pool view

**Health Status Visualization (January 2026):**
`computeHealthStatus()` returns both status and reasons:
```typescript
interface HealthResult {
  status: 'healthy' | 'at_risk' | 'critical';
  reasons: string[];  // e.g., "Past deadline", "No activity in 7+ days"
}
```

**HealthPill Component** (`components/shared/HealthPill.tsx`):
| Status | Label | Colors |
|--------|-------|--------|
| `healthy` | "On track" | Green bg, green text |
| `at_risk` | "Check in" | Amber bg, amber text |
| `critical` | "Needs attention" | Red bg, red text |

- Uses `rounded-full` to match MetadataPill styling
- Info icon (ⓘ) shows reasons tooltip on tap
- Size variants: `sm` (list rows), `md` (TaskDetail)
- Shown in: TaskDetail (expanded + collapsed), QueueItem, TaskRow
- In collapsed details: Uses HealthPill component directly (with info icon)

**Bell Indicator (Reminders):**
- Shown on QueueItem and TaskRow when `task.reminder` is set
- Violet color (`text-violet-500`) for consistency
- In collapsed details: Bell icon via MetadataPill `icon` prop

**QuickAccess "Needs Attention" Card:**
- Red-themed card in SearchView
- Filters tasks with `at_risk` or `critical` health status
- Shows count badge

### Task Reminders (PWA Notifications)
Manual reminder system using browser Notification API.

**Data Model:**
```typescript
interface Reminder {
  type: 'relative' | 'absolute';
  relativeMinutes?: number;      // Minutes before target/deadline
  relativeTo?: 'target' | 'deadline';
  absoluteTime?: number;         // Unix timestamp
}
```

**ReminderPicker Component** (`components/shared/ReminderPicker.tsx`):
- Located in TaskDetail Details section (under dates)
- Two modes:
  - **Relative:** "1 hour before deadline", "1 day before target", etc.
  - **Absolute:** Date/time picker with presets ("Tomorrow 9am", "Next Monday 9am")
- Handles notification permission request
- Shows current reminder with remove option

**Notification Flow:**
1. User sets reminder in TaskDetail → `scheduleReminder()` called
2. Reminder stored in localStorage + in-memory timer
3. When due: `showNotification()` fires browser notification
4. Click notification → Deep links to task via `?task={taskId}` URL param
5. Service worker handles click when app is closed

**Files:**
- `lib/notifications.ts` - Permission, scheduling, display helpers
- `lib/types.ts` - `Reminder` interface, `Task.reminder` field
- `public/sw.js` - Notification click handler for deep linking

### Utility Library (lib/utils.ts)
Comprehensive utility functions:
- **Date:** `getTodayISO`, `formatDate`, `formatDuration`, `daysBetween`, `getTimeOfDay`
- **Task:** `isOverdue`, `isDueToday`, `isDueSoon`, `getTaskProgress`, `wasCompletedToday`
- **Step:** `getNextIncompleteStep`, `getStepProgress`, `getTotalEstimatedMinutes`
- **Computation:** `computeComplexity`, `computeFocusScore`, `computeHealthStatus`
- **Sorting:** `sortByPriority`, `sortByDeadline`, `sortByFocusScore`, `sortByCreatedAt`
- **Filtering:** `filterByStatus`, `filterInbox`, `filterPool`, `filterWaitingOn`, `filterResurfaced`

---

## Handler Reference (page.tsx)

### Navigation
- `handleViewChange(view)` - Switch between views
- `handleOpenTask(taskId)` - Open task detail
- `handleBackToList()` - Return to previous view

### Task Lifecycle
- `handleCreateTask(title)` - Create task, navigate to TaskDetail (used by InboxView)
- `handleCreateTaskQuick(title)` - Create task in inbox, stay in view, show toast (used by TasksView)
- `handleCreateTaskForFocus(title)` - Create task, add to Today queue, navigate to TaskDetail (used by QueueView)
- `handleUpdateTask(taskId, updates)` - Update task properties
- `handleDeleteTask(taskId)` - Delete task
- `handleSendToPool(taskId)` - Move inbox → pool
- `handleDefer(taskId, until)` - Defer until date
- `handlePark(taskId)` - Archive as parked

**Task Creation Behavior (January 2026):**
| View | Handler | Behavior |
|------|---------|----------|
| **Tasks view** | `handleCreateTaskQuick` | Quick dump to Inbox, stay in view, toast confirmation |
| **Focus Queue** | `handleCreateTaskForFocus` | Intentional capture, add to Today, open TaskDetail for enrichment |
| **Inbox view** | `handleCreateTask` | Create and open TaskDetail |

### Queue Management
- `handleAddToQueue(taskId, forToday?, selectedStepIds?)` - Add to focus queue with optional step selection
- `handleRemoveFromQueue(queueItemId)` - Remove from queue
- `handleUpdateStepSelection(queueItemId, selectedStepIds)` - Update Today/Upcoming step selection
- `handleStartFocus(queueItemId)` - Enter focus mode

### Step Management
- `handleStepComplete(taskId, stepId)` - Toggle step completion
- `handleSubstepComplete(taskId, stepId, substepId)` - Toggle substep
- `handleUpdateStep(taskId, stepId, text)` - Edit step text
- `handleUpdateSubstep(...)` - Edit substep text
- `handleAddStep(taskId)` - Add new step
- `handleDeleteStep(taskId, stepId)` - Remove step
- `handleMoveStepUp/Down(...)` - Reorder steps
- `handleAddSubstep(taskId, stepId)` - Add substep
- `handleDeleteSubstep(...)` - Remove substep
- `handleMoveSubstepUp/Down(...)` - Reorder substeps

### Focus Mode
- `handleStartFocus(queueItemId)` - Start focus session
- `handlePauseFocus()` - Pause timer
- `handleResumeFocus()` - Resume timer
- `handleExitFocus()` - End session, return to queue

### AI Integration
- `handleSendMessage(message)` - Send to AI
- `handleAutoBreakdown()` - Auto-request AI breakdown
- `handleStuckBreakdown/FirstStep/Explain()` - Stuck helpers
- `handleAcceptSuggestion(suggestion)` - Accept AI suggestion
- `handleRejectSuggestion(id)` - Reject suggestion
- `handleAcceptEdit/RejectEdit(edit)` - Handle edits
- `handleAcceptTitle/RejectTitle()` - Handle title suggestions

### Project Management
- `handleCreateProject(name, color)` - Create new project
- `handleUpdateProject(projectId, name, color)` - Update project
- `handleDeleteProject(projectId)` - Delete project (with undo toast)
- `handleOpenProjectModal(project?)` - Open create/edit modal

### Toast Management
- `showToast(toast)` - Display a toast notification
- `dismissToast(id)` - Dismiss a specific toast

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01-13 | **v18:** UI polish: HealthPill `rounded-full` to match MetadataPill, health pill in collapsed details with info icon, bell indicator on QueueItem/TaskRow, TaskDetail 50/50 layout (Status+Health \| Priority), priority toggle (tap to deselect), Reminder+WaitingOn share row on desktop, MetadataPill `icon` prop + `healthy` variant |
| 2026-01-13 | **v17:** Health status visualization (HealthPill with reasons tooltip, "Needs Attention" QuickAccess card), PWA task reminders (ReminderPicker in TaskDetail, relative/absolute times, notification deep linking via `?task=` param, service worker click handler), schema v8 migration for `reminder` field |
| 2026-01-12 | **v16:** AI polish: auto-collapse delay 7s (was 300ms, uses `ANIMATIONS.autoCollapseDelay`), StagingArea violet theme (matches Today steps), mobile TaskDetail kebab menu for overflow actions, dead code cleanup (`acceptSuggestions` timer removed), MiniBar tap fix (always expands palette, was only scrolling for `suggestionsReady` state) |
| 2026-01-11 | **v15:** Phase 1 AI response display fix (protected types guards prevent useEffect race conditions), documented Phase 2 state machine simplification and Phase 3 future AI architecture in product doc (Section 8.2). See `resources/focus-tools-product-doc.md` for proactive AI, AI actions with confirmation, voice/multimodal input requirements. |
| 2026-01-11 | **v14:** AI MiniBar integration complete: Four-surface model (MiniBar/Palette/Drawer/StagingArea), contextual idle status ("3 tasks for today"), contextual prompts with action pills, "What next?" AI recommendations, Drawer icon in input field, "Continue in expanded view" after 3+ exchanges, AI_ACTIONS central registry |
| 2026-01-11 | **v13:** UX refinements: Add to Focus dropdown pattern (one-click to Upcoming, dropdown for Today), Edit Focus relocated to Steps header (conditional swap with AI Breakdown), simplified FocusSelectionModal (removed segmented control), task creation behavior swap (TasksView→quick dump, QueueView→intentional), Toast positioning above minibar, queue positioning fix (new items as first Upcoming) |
| 2026-01-10 | **v12:** Focus Selection Modal (step selection for Today/Upcoming), TaskDetail Today/Upcoming section headers, Edit Focus in QueueItem kebab menu, handleUpdateStepSelection handler |
| 2026-01-06 | **v11:** Task completion flow refinements (auto-return to Focus Queue), expanded toast notifications (queue/pool actions with undo), consistent task row styling across all views, QueueView empty state "Show completed" button |
| 2025-01-06 | **v10:** Documented keyboard shortcuts, mobile AI floating bar, QuickAccess cards |
| 2025-01-06 | **v9:** Added visual-first drag/drop documentation (queue-reorder.ts), file structure updates |
| 2025-01-06 | **v8:** iOS PWA dark mode theming (seamless header/status bar), Today/Upcoming visual distinction, progress ring indicator, completed task muted styling |
| 2025-01-04 | **v7:** PWA support (manifest, service worker, offline caching, installable) |
| 2025-01-04 | **v6:** Projects view, Toast with undo, MetadataPill component, UI refinements (always-visible kebabs, title alignment) |
| 2025-01-03 | **v5:** Added missing POC features: dark mode, responsive drawer, timer restoration, message grouping, celebration, health/score, utilities |
| 2025-01-03 | **v4:** AI function calling architecture; edit_title tool; pendingAction state; time estimate preservation |
| 2025-01-02 | **v3:** Documentation updated with POC enhancements, actual file structure |
| 2025-01 | **v2:** Model E — Pool + Focus Queue; updated all types |
| 2024-12 | v1: Initial context with DailyPlan model |
