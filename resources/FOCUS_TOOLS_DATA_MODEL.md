# Focus Tools — Data Model Reference

> **Status:** Living document  
> **Last Updated:** January 2025  
> **Purpose:** Document data model decisions, rationale, and future-proofing considerations

---

## Design Philosophy

### Core Principles

1. **Model now, UI later** — Adding fields costs nothing; migrating data is painful
2. **Log everything** — Events enable intelligence; can't analyze what you don't capture
3. **Explicit over implicit** — Track source, timestamps, and context for every change
4. **Future-proof for collaboration** — Single-user now, but model supports multi-user
5. **Intelligence-ready** — Structure data to enable pattern detection and AI learning

### Schema Versioning

```typescript
const SCHEMA_VERSION = 2;  // Updated for Model E

interface StoredState {
  schemaVersion: number;
  // ... rest of state
}
```

**Rationale:** Enables detection and migration of old data formats when schema evolves.

---

## Workflow Model Overview

The data model supports a Pool + Focus Queue workflow:

```
INBOX → POOL → FOCUS QUEUE → COMPLETED
                    ↓
              PARKING LOT
```

| Status | Description |
|--------|-------------|
| `inbox` | Captured but not triaged |
| `pool` | Defined, actionable, available |
| `complete` | Finished |
| `archived` | Parked / abandoned |

**Key Change from v1:** Replaced `active` status with `pool`. Removed `deferred` as separate status (now a field). Focus Queue is a separate structure, not a status.

---

## Task Model

### Core Fields

```typescript
interface Task {
  id: string;
  title: string;
  shortLabel: string | null;
  description: string | null;
  steps: Step[];
}
```

| Field | Type | Rationale |
|-------|------|-----------|
| `id` | string | UUID for unique identification |
| `title` | string | Primary display, required |
| `shortLabel` | string \| null | Compact label for Orbital UI (~20 chars); AI-generated or user-set |
| `description` | string \| null | Optional context/notes beyond title |
| `steps` | Step[] | Breakdown into actionable items |

### Status & Lifecycle

```typescript
interface Task {
  // ...
  status: 'inbox' | 'pool' | 'complete' | 'archived';
  
  // Completion
  completionType: 'step_based' | 'manual';
  completedAt: number | null;
  
  // Archive
  archivedAt: number | null;
  archivedReason: 'completed_naturally' | 'abandoned' | 'parked' | 'duplicate' | null;
  
  // Soft delete
  deletedAt: number | null;
}
```

| Field | Type | Rationale |
|-------|------|-----------|
| `status` | enum | Explicit state machine for task lifecycle |
| `completionType` | enum | Whether completion is step-based or manual override |
| `completedAt` | timestamp \| null | When task was completed |
| `archivedAt` | timestamp \| null | When archived |
| `archivedReason` | enum \| null | Why it was archived (for analytics, resurfacing) |
| `deletedAt` | timestamp \| null | Soft delete enables undo and recovery |

**Status Flow:**
```
inbox → pool → complete
          ↓
       archived ← (from any state)
```

**Decision:** `completionType` allows tasks without steps to be marked complete manually, and tasks with steps to be overridden if user completes outside the system.

### Waiting On (Non-Blocking Flag)

```typescript
interface Task {
  // ...
  waitingOn: {
    who: string;
    since: number;
    followUpDate: string | null;
    notes: string | null;
  } | null;
}
```

| Field | Type | Rationale |
|-------|------|-----------|
| `waitingOn.who` | string | Person or entity being waited on |
| `waitingOn.since` | number | Timestamp when waiting started |
| `waitingOn.followUpDate` | string \| null | ISO date for follow-up reminder |
| `waitingOn.notes` | string \| null | Context for the follow-up |

**Decision:** `waitingOn` is a non-blocking flag — user can still focus on other steps. It's informational, surfaced via badge and nudges.

### Deferral

```typescript
interface Task {
  // ...
  deferredUntil: string | null;    // ISO date to resurface
  deferredAt: number | null;       // When it was deferred
  deferredCount: number;           // Times deferred (for pattern detection)
}
```

**Decision:** Deferral is a property, not a status. Deferred tasks remain in Pool but are hidden until `deferredUntil` date. This enables resurfacing without state transitions.

### Organization

```typescript
interface Task {
  // ...
  priority: 'high' | 'medium' | 'low' | null;
  tags: string[];
  projectId: string | null;
  context: string | null;
}
```

| Field | Type | Rationale |
|-------|------|-----------|
| `priority` | enum \| null | Simple 3-level priority; null = not yet prioritized |
| `tags` | string[] | Flexible categorization |
| `projectId` | string \| null | Optional grouping under projects |
| `context` | string \| null | GTD-style context (e.g., "office", "home", "phone") |

### Dates

```typescript
interface Task {
  // ...
  targetDate: string | null;      // ISO date (YYYY-MM-DD)
  deadlineDate: string | null;    // ISO date (YYYY-MM-DD)
}
```

| Field | Type | Rationale |
|-------|------|-----------|
| `targetDate` | ISO date \| null | When you'd *like* to finish (soft target) |
| `deadlineDate` | ISO date \| null | When it *must* be done (hard deadline) |

### Effort & Time

```typescript
interface Task {
  // ...
  effort: 'quick' | 'medium' | 'deep' | null;
  estimatedMinutes: number | null;
  totalTimeSpent: number;
  focusSessionCount: number;
}
```

### Ownership & Collaboration

```typescript
interface Task {
  // ...
  createdBy: string | null;
  assignedTo: string | null;
  sharedWith: string[];
  source: TaskSource;
}

type TaskSource = 
  | 'manual'
  | 'ai_breakdown'
  | 'ai_suggestion'
  | 'shared'
  | 'email'
  | 'calendar'
  | 'voice';
```

### Attachments & External Links

```typescript
interface Task {
  // ...
  attachments: Attachment[];
  externalLinks: ExternalLink[];
  recurrence: RecurrenceRule | null;
}
```

*(See Supporting Types section for Attachment, ExternalLink, RecurrenceRule)*

### Intelligence Fields

```typescript
interface Task {
  // ...
  
  // Estimation accuracy
  estimationAccuracy: number | null;
  
  // Engagement tracking
  firstFocusedAt: number | null;
  timesStuck: number;
  stuckResolutions: StuckResolution[];
  
  // AI interaction
  aiAssisted: boolean;
  aiSuggestionsAccepted: number;
  aiSuggestionsRejected: number;
  
  // Predictions (AI-computed)
  predictedDuration: number | null;
  completionProbability: number | null;
  similarTaskIds: string[];
  
  // Completion metrics
  daysFromTarget: number | null;
  daysFromDeadline: number | null;
  
  // Visualization hints (computed)
  focusScore: number | null;        // 0-100, urgency/relevance
  complexity: 'simple' | 'moderate' | 'complex' | null;
  healthStatus: 'healthy' | 'at_risk' | 'critical' | null;
  
  // Notes
  notes: string | null;                   // Task-level notes

  // AI Message History (per task)
  messages: Message[];                    // Planning mode conversation
  focusModeMessages: Message[];           // Focus mode conversation (separate context)

  // Metadata
  createdAt: number;
  updatedAt: number;
  version: number;
}
```

### Focus Score Computation

```typescript
function computeFocusScore(task: Task): number {
  let score = 0;
  
  // Deadline urgency (0-40 points)
  if (task.deadlineDate) {
    const daysUntil = daysBetween(today, task.deadlineDate);
    if (daysUntil <= 0) score += 40;      // Overdue
    else if (daysUntil <= 1) score += 35; // Due today/tomorrow
    else if (daysUntil <= 3) score += 25;
    else if (daysUntil <= 7) score += 15;
    else if (daysUntil <= 14) score += 5;
  }
  
  // Priority (0-25 points)
  if (task.priority === 'high') score += 25;
  else if (task.priority === 'medium') score += 15;
  else if (task.priority === 'low') score += 5;
  
  // Quick win bonus (0-10 points)
  if (task.effort === 'quick' || task.estimatedMinutes && task.estimatedMinutes <= 15) {
    score += 10;
  }
  
  // Staleness (0-15 points)
  const daysSinceUpdate = daysBetween(task.updatedAt, now);
  if (daysSinceUpdate > 14) score += 15;
  else if (daysSinceUpdate > 7) score += 10;
  else if (daysSinceUpdate > 3) score += 5;
  
  return Math.min(100, score);
}
```

### Complexity Computation

```typescript
function computeComplexity(task: Task): 'simple' | 'moderate' | 'complex' {
  const stepCount = task.steps.length;
  const substepCount = task.steps.reduce((sum, s) => sum + s.substeps.length, 0);
  const effortScore = task.effort === 'deep' ? 2 : task.effort === 'medium' ? 1 : 0;
  
  const complexityScore = stepCount + (substepCount * 0.5) + (effortScore * 2);
  
  if (complexityScore <= 3) return 'simple';
  if (complexityScore <= 7) return 'moderate';
  return 'complex';
}
```

### Health Status Computation

```typescript
function computeHealthStatus(task: Task): 'healthy' | 'at_risk' | 'critical' {
  // Critical: Overdue or deadline today
  if (task.deadlineDate) {
    const daysUntil = daysBetween(today, task.deadlineDate);
    if (daysUntil <= 0) return 'critical';
    if (daysUntil <= 2) return 'at_risk';
  }
  
  // At risk: Deferred multiple times
  if (task.deferredCount >= 3) return 'at_risk';
  
  // At risk: Stale (not touched in 2+ weeks)
  const daysSinceUpdate = daysBetween(task.updatedAt, now);
  if (daysSinceUpdate > 14) return 'at_risk';
  
  return 'healthy';
}
```

---

## Step Model

```typescript
interface Step {
  id: string;
  text: string;
  shortLabel: string | null;        // ~15 chars max
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
  estimationAccuracy: number | null; // estimate / actual (set on completion)
  complexity: 'simple' | 'moderate' | 'complex' | null;
  
  // Context (optional override from task)
  context: string | null;           // GTD context: "phone", "computer", etc.
  
  // Metadata
  timesStuck: number;
  source: 'manual' | 'ai_generated' | 'ai_suggested';
  wasEdited: boolean;
}

interface Substep {
  id: string;
  text: string;
  shortLabel: string | null;        // ~12 chars max
  completed: boolean;
  completedAt: number | null;
  source: 'manual' | 'ai_generated' | 'ai_suggested';
}
```

| Field | Type | Rationale |
|-------|------|-----------|
| `effort` | enum \| null | Energy level for step; enables "show quick steps" |
| `estimatedMinutes` | number \| null | Time estimate for planning |
| `estimateSource` | enum \| null | Track who estimated (user vs AI) for accuracy analysis |
| `firstFocusedAt` | number \| null | Enables time-to-start analytics |
| `estimationAccuracy` | number \| null | Computed on completion: estimate / actual |
| `context` | string \| null | Override task context for step-specific requirements |

**Display behavior:**
- Show `~N min` next to steps in Task Detail and Focus Mode
- Sum estimates for queue items: "~45 min remaining"
- After completion, can show accuracy: "took 12 min, estimated 15"

---

## Focus Queue Model

The Focus Queue replaces the DailyPlan model from v1. It's a single evolving queue with time horizons.

```typescript
interface FocusQueue {
  items: FocusQueueItem[];
  lastReviewedAt: number;
}

interface FocusQueueItem {
  id: string;
  taskId: string;
  
  // Step selection
  selectionType: 'entire_task' | 'specific_steps';
  selectedStepIds: string[];    // Empty if entire_task
  
  // Time commitment
  horizon: 'today' | 'this_week' | 'upcoming';
  scheduledDate: string | null;   // Specific date within week
  order: number;                  // Position in queue
  
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
  rolloverCount: number;          // Times rolled over in this_week
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
```

### Key Design Decisions

**Decision:** Single queue with horizons instead of daily plans.
- **Rationale:** Reduces planning friction; items naturally roll over
- **Benefit:** No daily "build the plan" ceremony required

**Decision:** Support task-level OR step-level selection.
- **Rationale:** Sometimes you want to focus on "File Taxes" (whole task), sometimes just "Gather W-2s" (specific steps)
- **Implementation:** `selectionType` + `selectedStepIds`

**Decision:** One queue entry per task (no duplicates).
- **Rationale:** Prevents "File Taxes" appearing 3 times in Today
- **Workaround:** User can edit selection or horizon after adding

**Decision:** Track `rolloverCount` for "this_week" items.
- **Rationale:** Enables intelligence — "You've rolled this over 3 weeks"

### Completion Logic

```typescript
function isQueueItemComplete(item: FocusQueueItem, task: Task): boolean {
  if (item.selectionType === 'entire_task') {
    return task.steps.every(s => s.completedAt !== null);
  } else {
    return item.selectedStepIds.every(stepId => {
      const step = task.steps.find(s => s.id === stepId);
      return step?.completedAt !== null;
    });
  }
}
```

### Queue Size Recommendations

| Horizon | Soft Limit | Warning Message |
|---------|------------|-----------------|
| Today | 15 items | "That's a full day. Consider moving some to This Week." |
| Total queue | 30 items | "Queue is getting large. Review and prune?" |

### Visual-First Queue Reordering

Queue drag/drop uses a visual-first approach implemented in `lib/queue-reorder.ts`:

```typescript
// Runtime type for visual transformations (not stored)
type VisualElement =
  | { kind: "item"; item: FocusQueueItem; originalIndex: number }
  | { kind: "line" };  // Today/Later separator

// Core operations:
buildVisualElements(items, todayLineIndex) → VisualElement[]
reorderVisualElements(elements, fromIndex, toIndex) → VisualElement[]
deriveStateFromVisual(elements) → { items, todayLineIndex }
```

**Approach:** Build flat visual array → reorder as simple splice → derive new state. This treats visual layout as source of truth, eliminating special-case logic for line vs item moves.

---

## Project Model

```typescript
interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}
```

**Decision:** Projects are a filter/tag layer, not a hierarchy.
- **Rationale:** Keep it simple; no project-specific queues or inboxes
- **Implementation:** Filter Pool by `projectId`

---

## User Model

```typescript
interface User {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}
```

---

## Event Log Model

```typescript
interface Event {
  id: string;
  timestamp: number;
  type: EventType;
  taskId: string | null;
  stepId: string | null;
  queueItemId: string | null;     // New for Focus Queue events
  data: Record<string, any>;
  context: EventContext;
}

type EventType =
  // Task lifecycle
  | 'task_created' | 'task_updated' | 'task_completed' | 'task_reopened'
  | 'task_archived' | 'task_restored' | 'task_deleted'
  
  // Step lifecycle
  | 'step_created' | 'step_completed' | 'step_uncompleted' | 'substep_completed'
  
  // Focus queue (new)
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
  
  // Estimation
  | 'estimate_set' | 'estimate_updated'
  
  // Other
  | 'priority_changed' | 'date_changed';

interface EventContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  energyLevel: 'low' | 'medium' | 'high' | null;
  sessionDuration: number | null;
  tasksCompletedToday: number;
  focusSessionsToday: number;
  device: 'desktop' | 'mobile' | null;
}
```

---

## Focus Session Model

```typescript
interface FocusSession {
  id: string;
  
  // What was focused
  queueItemId: string;              // Links to FocusQueueItem
  taskId: string;
  selectionType: 'entire_task' | 'specific_steps';
  targetedStepIds: string[];        // What was in scope
  
  // Timing
  startTime: number;
  endTime: number | null;
  totalDuration: number;
  pauseDuration: number;
  adjustedDuration: number | null;  // User override if corrected
  adjustmentReason: string | null;  // Why adjusted
  
  // Outcomes
  stepsCompleted: string[];
  substepsCompleted: string[];
  stuckEvents: StuckEvent[];
  
  // Context & rating
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
```

**New in v2:**
- `queueItemId` links session to Focus Queue item
- `selectionType` + `targetedStepIds` capture what was in focus scope
- `adjustedDuration` allows manual time correction
- `outcome` distinguishes "completed task" from "completed focus goal" (selected steps done)

---

## Nudge Model

```typescript
interface Nudge {
  id: string;
  type: NudgeType;
  targetId: string;               // Task ID this nudge is about
  message: string;
  urgency: 'low' | 'medium' | 'high';
  createdAt: number;
  expiresAt: number | null;
  
  // User response
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
  snoozeCount: number;            // For AI learning
}
```

---

## App State Model

```typescript
interface AppState {
  schemaVersion: number;
  currentUser: User | null;
  
  // Data
  tasks: Task[];
  projects: Project[];
  
  // Focus Queue (replaces DailyPlan)
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

// AI Staging State (for function calling responses)
interface AIStagingState {
  suggestions: SuggestedStep[];           // New steps/substeps to add
  edits: EditSuggestion[];                // Changes to existing steps
  suggestedTitle: string | null;          // Title improvement
  pendingAction: 'replace' | 'suggest' | null;  // Tracks AI action type
}

interface SuggestedStep {
  id: string;
  text: string;
  substeps: { id: string; text: string }[];
  estimatedMinutes?: number;
}

interface EditSuggestion {
  targetId: string;
  targetType: 'step' | 'substep';
  parentId?: string;                      // For substeps
  originalText: string;
  newText: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  stepId?: string;                        // For focus mode message grouping
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
```

---

## Supporting Types

```typescript
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
```

---

## AI Function Calling Architecture

The AI integration uses Claude's native function calling (tool_use) for reliable structured output.

### Why Function Calling?

| Aspect | JSON in Text | Function Calling |
|--------|--------------|------------------|
| Reliability | ~85% (prompt-dependent) | ~99%+ (native) |
| Validation | Manual parsing, error-prone | SDK handles it |
| Extensibility | Edit prompts | Add tool definitions |

### Tool Definitions

**Planning Mode (Task Structuring):**

| Tool | Purpose | Returns |
|------|---------|---------|
| `replace_task_steps` | Complete rewrite | `steps[]`, `taskTitle?`, `message` |
| `suggest_additions` | Add to existing | `suggestions[]`, `suggestedTitle?`, `message` |
| `edit_steps` | Modify specific | `edits[]`, `message` |
| `edit_title` | Rename task | `newTitle`, `message` |
| `conversational_response` | Pure chat | `message` |

**Focus Mode (Body Double):**

| Tool | Purpose | Returns |
|------|---------|---------|
| `break_down_step` | Generate substeps | `substeps[]`, `parentStepId`, `message` |
| `suggest_first_action` | Tiny first action | `firstAction`, `message` |
| `explain_step` | Clarify meaning | `explanation`, `tips[]?`, `message` |
| `encourage` | Encouragement | `message` |

### Response Processing

```typescript
interface StructureResponse {
  action: 'replace' | 'suggest' | 'edit' | 'none';
  taskTitle?: string;           // From replace_task_steps
  suggestedTitle?: string;      // From suggest_additions, edit_title
  steps?: Step[];               // From replace_task_steps
  suggestions?: SuggestedStep[];// From suggest_additions
  edits?: EditSuggestion[];     // From edit_steps
  message: string;              // Always present
}
```

### State Flow

1. AI returns tool call → API route processes → returns `StructureResponse`
2. Client receives response → populates staging state (`suggestions`, `edits`, `suggestedTitle`)
3. `pendingAction` set to `'replace'` or `'suggest'` based on action type
4. User accepts/rejects in staging UI
5. On accept: apply changes, clear staging state

**Key Insight:** `pendingAction` determines "Accept All" behavior:
- `'replace'` → Replace all steps with suggestions
- `'suggest'` → Append suggestions to existing steps

---

## Storage Strategy

### localStorage (MVP)

```typescript
const STORAGE_KEYS = {
  state: 'focus-tools-state',
  events: 'focus-tools-events',
  sessions: 'focus-tools-sessions',
  nudges: 'focus-tools-nudges',
};
```

### Future: Supabase

| Table | Contents |
|-------|----------|
| `users` | User accounts |
| `tasks` | Task records |
| `steps` | Step records |
| `projects` | Project records |
| `focus_queue_items` | Queue items |
| `events` | Event log |
| `focus_sessions` | Session records |
| `nudges` | Nudge state |

---

## Migration Strategy

```typescript
function migrateState(stored: any): AppState {
  let state = stored;
  
  // Version 1 → 2: Model E migration
  if (state.schemaVersion < 2) {
    // Rename status: 'active' → 'pool'
    state.tasks = state.tasks.map(task => ({
      ...task,
      status: task.status === 'active' ? 'pool' : task.status,
      completionType: task.steps.length > 0 ? 'step_based' : 'manual',
      waitingOn: null,
      deferredUntil: null,
      deferredAt: null,
      deferredCount: 0,
    }));
    
    // Convert DailyPlan to FocusQueue
    state.focusQueue = {
      items: [],
      lastReviewedAt: Date.now(),
    };
    
    // Migrate today's focus items if they exist
    if (state.dailyPlans && state.todayPlanId) {
      const todayPlan = state.dailyPlans.find(p => p.id === state.todayPlanId);
      if (todayPlan) {
        state.focusQueue.items = todayPlan.focusItems.map(item => ({
          ...item,
          selectionType: item.type === 'task' ? 'entire_task' : 'specific_steps',
          selectedStepIds: item.stepId ? [item.stepId] : [],
          horizon: 'today',
          scheduledDate: null,
          lastInteractedAt: Date.now(),
          horizonEnteredAt: Date.now(),
          rolloverCount: 0,
        }));
      }
    }
    
    delete state.dailyPlans;
    delete state.todayPlanId;
    
    state.schemaVersion = 2;
  }
  
  return state;
}
```

---

## Revision History

| Date | Changes |
|------|---------|
| 2025-01-06 | Added visual-first queue reordering section (lib/queue-reorder.ts) |
| 2025-01-03 | Added AI function calling architecture section; AI staging state types; Task.notes and message history fields; Message.stepId for grouping |
| 2025-01 | **v2:** Model E — Pool replaces Active; Focus Queue replaces DailyPlan; added waitingOn, deferral, nudges |
| 2024-12 | v1: Initial data model with DailyPlan, intelligence fields |
