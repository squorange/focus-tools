# Task Co-Pilot: Claude Code Context

## Project Overview

Task Co-Pilot is a POC/prototype for an AI-powered task breakdown assistant, part of the larger "Focus Tools" project—an ADHD-friendly task management tool.

**Location:** `~/Projects/focus-tools/prototypes/task-copilot`
**Stack:** Next.js 14, React 18, Tailwind CSS, Anthropic Claude API
**Status:** Implementing Model E (Pool + Focus Queue workflow)

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
  currentView: 'inbox' | 'pool' | 'queue' | 'taskDetail' | 'focusMode';
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

## File Structure

```
task-copilot/
├── app/
│   ├── page.tsx              # Main app, state management, routing
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind imports
│   └── api/
│       └── structure/
│           └── route.ts      # Claude API endpoint
├── components/
│   ├── inbox/
│   │   ├── InboxView.tsx     # Inbox list view
│   │   ├── InboxItem.tsx     # Single inbox item (collapsed/expanded)
│   │   └── TriagePanel.tsx   # Expanded triage inline panel
│   ├── pool/
│   │   ├── PoolView.tsx      # Pool list view
│   │   ├── ResurfacedSection.tsx
│   │   └── TaskRow.tsx       # Task row in pool
│   ├── queue/
│   │   ├── QueueView.tsx     # Focus Queue (home)
│   │   ├── HorizonSection.tsx # Today/This Week/Upcoming sections
│   │   └── QueueItem.tsx     # Item in queue
│   ├── task-detail/
│   │   ├── TaskDetail.tsx    # Full task view
│   │   ├── StepList.tsx      # Steps with substeps
│   │   └── TaskMetadata.tsx  # Priority, dates, etc.
│   ├── focus-mode/
│   │   ├── FocusMode.tsx     # Focus mode view
│   │   ├── FocusHeader.tsx   # Exit, timer, pause
│   │   ├── FocusStep.tsx     # Current step display
│   │   └── FocusActions.tsx  # Done, I'm Stuck buttons
│   ├── shared/
│   │   ├── QuickCapture.tsx  # Text input for capture
│   │   ├── AIDrawer.tsx      # Collapsible AI chat
│   │   ├── Toast.tsx         # Notifications, undo
│   │   ├── NudgeBadge.tsx    # Notification badge
│   │   └── EmptyState.tsx    # Empty state with actions
│   └── navigation/
│       └── NavTabs.tsx       # Inbox | Pool | Queue tabs
├── lib/
│   ├── types.ts              # All TypeScript interfaces
│   ├── storage.ts            # localStorage helpers
│   ├── events.ts             # Event logging
│   └── utils.ts              # Helpers (generateId, dates, etc.)
├── public/
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service worker
└── CLAUDE.md                 # This file (rename from CLAUDE_CODE_CONTEXT_v2.md)
```

---

## Navigation Flow

```
┌────────────────────────────────────────────────────────────────┐
│                         NAV TABS                                │
│   [Inbox (3)]     [Pool (12)]     [Queue (5)]                  │
└────────────────────────────────────────────────────────────────┘
         │               │                │
         ▼               ▼                ▼
    InboxView        PoolView        QueueView (Home)
         │               │                │
         │               │                │
         └───────────────┼────────────────┘
                         │
                         ▼
                   TaskDetail
                         │
                         ▼
                    FocusMode
```

**State-based routing in page.tsx:**
```typescript
{currentView === 'inbox' && <InboxView ... />}
{currentView === 'pool' && <PoolView ... />}
{currentView === 'queue' && <QueueView ... />}
{currentView === 'taskDetail' && <TaskDetail ... />}
{currentView === 'focusMode' && <FocusMode ... />}
```

---

## AI Integration Points

| Context | AI Drawer Behavior |
|---------|-------------------|
| **Inbox** | Help clarify, suggest breakdown, detect duplicates |
| **Pool** | Answer questions, suggest what to work on |
| **Queue** | Suggest additions, help prioritize |
| **Task Detail** | Break down, add steps, explain |
| **Focus Mode** | Body double, help if stuck, encourage |

---

## Empty States

| View | Condition | Message | Actions |
|------|-----------|---------|---------|
| Queue (Today) | No today items | "No items for today." | [Add from Pool (N ready)] |
| Queue (All) | Queue empty, pool has items | "No items queued." | [Add from Pool (N ready)] |
| Queue (All) | Queue empty, pool empty, inbox has items | "No items queued." | [Go to Inbox (N items)] |
| Queue (All) | Everything empty | "No items queued yet." | [Capture your first task] |
| Pool | Pool empty | "No tasks in pool." | [Go to Inbox] [Capture] |
| Inbox | Inbox empty | "Inbox empty." | [Capture something] |

---

## Key Implementation Notes

1. **Focus Queue is home** — app opens to Queue view
2. **One queue entry per task** — no duplicates
3. **Step selection** — entire task OR specific steps (multi-select)
4. **Waiting On is non-blocking** — can still focus on other steps
5. **Deferral hides from Pool** — resurfaces on date
6. **AI Drawer available everywhere** — context-aware
7. **List-based UI for MVP** — Orbital Zen deferred

---

## Revision History

| Date | Changes |
|------|---------|
| 2025-01 | **v2:** Model E — Pool + Focus Queue; updated all types |
| 2024-12 | v1: Initial context with DailyPlan model |
