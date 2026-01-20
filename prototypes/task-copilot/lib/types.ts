// ============================================
// Schema Version
// ============================================

export const SCHEMA_VERSION = 9;

// ============================================
// Task Structure Types
// ============================================

export interface Substep {
  id: string;
  text: string;
  shortLabel: string | null;        // ~12 chars max
  completed: boolean;
  completedAt: number | null;
  skipped: boolean;
  source: 'manual' | 'ai_generated' | 'ai_suggested';
}

export interface Step {
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

  // Intelligence
  timesStuck: number;
  skipped: boolean;
  source: 'manual' | 'ai_generated' | 'ai_suggested';
  wasEdited: boolean;
}

// Model E: Task status - Pool instead of Active
export type TaskStatus = 'inbox' | 'pool' | 'complete' | 'archived';
export type Priority = 'high' | 'medium' | 'low';
export type Effort = 'quick' | 'medium' | 'deep';
export type HealthStatus = 'healthy' | 'at_risk' | 'critical';
export type CompletionType = 'step_based' | 'manual';
export type ArchivedReason = 'completed_naturally' | 'abandoned' | 'parked' | 'duplicate';

export type TaskSource =
  | 'manual'
  | 'ai_breakdown'
  | 'ai_suggestion'
  | 'shared'
  | 'email'
  | 'calendar'
  | 'voice';

// Model E: Waiting On is a non-blocking flag
export interface WaitingOn {
  who: string;
  since: number;
  followUpDate: string | null;      // ISO date for follow-up reminder
  notes: string | null;
}

// Reminder for notifications
export interface Reminder {
  type: 'relative' | 'absolute';
  relativeMinutes?: number;         // Minutes before target/deadline
  relativeTo?: 'target' | 'deadline';
  absoluteTime?: number;            // Unix timestamp for absolute reminders
}

export interface Task {
  id: string;
  title: string;
  shortLabel: string | null;
  description: string | null;
  notes: string | null;  // Task-level notes
  steps: Step[];

  // Status & Lifecycle (Model E)
  status: TaskStatus;
  completionType: CompletionType;
  completedAt: number | null;
  archivedAt: number | null;
  archivedReason: ArchivedReason | null;
  deletedAt: number | null;

  // Waiting On (Model E: non-blocking flag)
  waitingOn: WaitingOn | null;

  // Deferral (Model E: property, not status)
  deferredUntil: string | null;     // ISO date to resurface
  deferredAt: number | null;        // When it was deferred
  deferredCount: number;            // Times deferred (for pattern detection)

  // Organization
  priority: Priority | null;
  tags: string[];
  projectId: string | null;
  context: string | null;

  // Dates
  targetDate: string | null;        // ISO date (YYYY-MM-DD)
  deadlineDate: string | null;      // ISO date (YYYY-MM-DD)

  // Reminder (for PWA notifications)
  reminder: Reminder | null;

  // Effort & Time
  effort: Effort | null;
  estimatedMinutes: number | null;
  totalTimeSpent: number;
  focusSessionCount: number;

  // Ownership (for future collaboration)
  createdBy: string | null;
  assignedTo: string | null;
  sharedWith: string[];
  source: TaskSource;

  // Attachments (future)
  attachments: Attachment[];

  // External Integrations (future)
  externalLinks: ExternalLink[];

  // Recurrence
  isRecurring: boolean;
  recurrence: RecurrenceRule | null;
  recurringStreak: number;
  recurringBestStreak: number;
  recurringInstances: RecurringInstance[];
  recurringTotalCompletions: number;
  recurringLastCompleted: string | null;   // ISO date
  recurringNextDue: string | null;         // ISO date

  // Intelligence Fields
  estimationAccuracy: number | null;
  firstFocusedAt: number | null;
  timesStuck: number;
  stuckResolutions: StuckResolution[];
  aiAssisted: boolean;
  aiSuggestionsAccepted: number;
  aiSuggestionsRejected: number;

  // Computed (by analysis, future)
  predictedDuration: number | null;
  completionProbability: number | null;
  similarTaskIds: string[];

  // Completion metrics (set when completed)
  daysFromTarget: number | null;
  daysFromDeadline: number | null;

  // Computed visualization hints
  focusScore: number | null;
  complexity: 'simple' | 'moderate' | 'complex' | null;
  healthStatus: HealthStatus | null;

  // Metadata
  createdAt: number;
  updatedAt: number;
  version: number;

  // Per-task AI conversations (from POC)
  messages: Message[];              // Task detail AI chat history
  focusModeMessages: Message[];     // Focus mode AI chat history

  // Per-task staging for AI suggestions
  staging: StagingState | null;
}

export interface Attachment {
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

export interface ExternalLink {
  system: 'calendar' | 'email' | 'github' | 'jira' | 'notion' | 'other';
  externalId: string;
  url: string | null;
  syncedAt: number | null;
}

export interface RecurrenceRule {
  // Pattern Configuration
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;                    // Every N (1=every, 2=every other, etc.)

  // Frequency-Specific Fields
  daysOfWeek: number[] | null;         // [0-6] where 0=Sun, 6=Sat
  weekOfMonth: number | null;          // 1-5 for "first Mon", "third Thu"
  dayOfMonth: number | null;           // 1-31 for monthly on specific date

  // Scheduling
  time: string | null;                 // "08:00" in 24-hour format

  // End Conditions
  endDate: string | null;              // ISO date, routine stops after
  endAfter: number | null;             // Stop after N occurrences

  // Behavior
  rolloverIfMissed: boolean;           // Keep visible vs auto-skip

  // State
  pausedAt: number | null;             // Unix timestamp when paused
  pausedUntil: string | null;          // ISO date to auto-resume
}

export interface RecurringInstance {
  date: string;                        // "2025-01-17" ISO format
  routineSteps: Step[];                // Snapshot of template steps
  additionalSteps: Step[];             // Instance-specific additions
  completed: boolean;                  // Overall completion
  completedAt: number | null;          // Unix timestamp
  skipped: boolean;                    // Explicitly skipped
  skippedAt: number | null;            // Unix timestamp
  notes: string | null;                // Per-instance notes
  overdueDays: number | null;          // If rollover enabled
}

export interface StuckResolution {
  timestamp: number;
  stuckOnStepId: string;
  resolution: 'broke_down' | 'skipped' | 'talked_through' | 'took_break' | 'other';
  resultedInCompletion: boolean;
  timeToResolve: number;
}

// ============================================
// Project Model
// ============================================

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}

// ============================================
// User Model
// ============================================

export interface User {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

// ============================================
// Focus Queue Model (Model E: replaces DailyPlan)
// ============================================

export type FocusReason =
  | 'deadline_today'
  | 'deadline_approaching'
  | 'user_selected'
  | 'ai_suggested'
  | 'quick_win'
  | 'blocking_others'
  | 'build_momentum'
  | 'energy_match';

export type Horizon = 'today' | 'this_week' | 'upcoming';
export type SelectionType = 'all_today' | 'all_upcoming' | 'specific_steps';

export interface FocusQueueItem {
  id: string;
  taskId: string;

  // Step selection
  selectionType: SelectionType;
  selectedStepIds: string[];        // Empty if all_today or all_upcoming

  // Time commitment
  horizon: Horizon;
  scheduledDate: string | null;     // Specific date within week
  order: number;                    // Position in queue

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
  rolloverCount: number;            // Times rolled over in this_week
}

export interface FocusQueue {
  items: FocusQueueItem[];
  todayLineIndex: number;          // Items 0..todayLineIndex-1 are "for today"
  lastReviewedAt: number;
}

// ============================================
// Nudge Model (Model E: new)
// ============================================

export type NudgeType =
  | 'inbox_full'
  | 'today_untouched'
  | 'queue_item_stale'
  | 'deadline_approaching'
  | 'pool_item_stale'
  | 'waiting_followup_due'
  | 'deferred_resurfaced';

export type NudgeStatus = 'pending' | 'dismissed' | 'snoozed' | 'actioned';
export type NudgeUrgency = 'low' | 'medium' | 'high';

export interface Nudge {
  id: string;
  type: NudgeType;
  targetId: string;                 // Task ID this nudge is about
  message: string;
  urgency: NudgeUrgency;
  createdAt: number;
  expiresAt: number | null;

  // User response
  status: NudgeStatus;
  respondedAt: number | null;
}

export interface SnoozedNudge {
  id: string;
  nudgeType: NudgeType;
  targetId: string;
  snoozedAt: number;
  snoozeUntil: number;
  snoozeCount: number;              // For AI learning
}

// ============================================
// Event Log Model (Model E: updated)
// ============================================

export type EventType =
  // Task lifecycle
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_reopened'
  | 'task_archived'
  | 'task_restored'
  | 'task_deleted'

  // Step lifecycle
  | 'step_created'
  | 'step_completed'
  | 'step_uncompleted'
  | 'substep_completed'

  // Focus queue (Model E: new)
  | 'queue_item_added'
  | 'queue_item_removed'
  | 'queue_item_completed'
  | 'queue_horizon_changed'
  | 'queue_selection_changed'
  | 'queue_item_rolled_over'

  // Focus sessions
  | 'focus_started'
  | 'focus_paused'
  | 'focus_resumed'
  | 'focus_ended'

  // Stuck & unblocking
  | 'stuck_reported'
  | 'stuck_resolved'
  | 'stuck_skipped'

  // AI interactions
  | 'ai_breakdown_requested'
  | 'ai_breakdown_accepted'
  | 'ai_breakdown_rejected'
  | 'ai_suggestion_shown'
  | 'ai_suggestion_accepted'
  | 'ai_suggestion_dismissed'
  | 'ai_help_requested'

  // Deferral & waiting (Model E: new)
  | 'task_deferred'
  | 'task_resurfaced'
  | 'waiting_on_set'
  | 'waiting_on_cleared'

  // Nudges (Model E: new)
  | 'nudge_shown'
  | 'nudge_dismissed'
  | 'nudge_snoozed'
  | 'nudge_actioned'

  // Estimation
  | 'estimate_set'
  | 'estimate_updated'

  // Other
  | 'priority_changed'
  | 'date_changed';

export interface EventContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  energyLevel: 'low' | 'medium' | 'high' | null;
  sessionDuration: number | null;
  tasksCompletedToday: number;
  focusSessionsToday: number;
  device: 'desktop' | 'mobile' | null;
}

export interface Event {
  id: string;
  timestamp: number;
  type: EventType;
  taskId: string | null;
  stepId: string | null;
  queueItemId: string | null;       // Model E: for Focus Queue events
  data: Record<string, unknown>;
  context: EventContext;
}

// ============================================
// Focus Session Model (Model E: updated)
// ============================================

export interface StuckEvent {
  stepId: string;
  timestamp: number;
  resolution: 'broke_down' | 'skipped' | 'talked_through' | 'took_break' | 'other';
  timeToResolve: number;
  resultedInCompletion: boolean;
}

export type SessionOutcome = 'completed_task' | 'completed_goal' | 'made_progress' | 'no_progress' | 'abandoned';

export interface FocusSession {
  id: string;

  // What was focused (Model E: links to queue item)
  queueItemId: string | null;
  taskId: string;
  selectionType: SelectionType;
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
  outcome: SessionOutcome | null;
  userRating: number | null;
}

// ============================================
// Analytics Model
// ============================================

export interface TrendPoint {
  date: string;
  value: number;
}

export interface UserAnalytics {
  // Estimation
  overallEstimationAccuracy: number;
  estimationAccuracyByTag: Record<string, number>;
  estimationAccuracyByEffort: Record<string, number>;
  estimationAccuracyTrend: TrendPoint[];

  // Productivity
  completionRateByHour: Record<number, number>;
  completionRateByDay: Record<number, number>;
  avgTasksCompletedPerDay: number;
  avgFocusMinutesPerDay: number;

  // Task patterns
  avgTimeToStart: number;
  avgTimeToComplete: number;
  abandonmentRate: number;
  completionRateByTag: Record<string, number>;

  // Stuck patterns
  stuckFrequency: number;
  mostEffectiveUnblockStrategy: string;

  // AI effectiveness
  aiSuggestionAcceptanceRate: number;
  aiAssistedCompletionRate: number;

  lastUpdated: number;
}

// ============================================
// Conversation Types
// ============================================

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  stepId?: string;  // For focus mode: which step this message belongs to
}

// Queue-specific message (for 48h retention)
export interface QueueMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ============================================
// API Types
// ============================================

export type AIAction = "replace" | "suggest" | "edit" | "delete" | "recommend" | "none";

// AI Target Context - tracks which object is targeted by inline AI actions
export type AITargetType = 'step' | 'substep' | 'task';

export interface AITargetContext {
  type: AITargetType;
  taskId: string;
  stepId?: string;          // For step or substep targets
  substepId?: string;       // For substep targets
  label: string;            // Display label, e.g., "Make coffee"
}

export interface StructureRequest {
  userMessage: string;
  currentList: Step[] | null;
  taskTitle: string | null;
  conversationHistory: Message[];
  targetedStepId?: string | null;  // When user targets a specific step via sparkle button
}

export interface SuggestedStep {
  id: string;
  text: string;
  substeps: { id: string; text: string }[];
  parentStepId?: string;  // If set, add as substep to this step instead of as new step
  insertAfterStepId?: string;  // Insert after this step ID; '0' for beginning; omit to append
  estimatedMinutes?: number;  // AI-suggested time estimate
}

export interface DeletionSuggestion {
  targetId: string;           // Display ID like "1", "2", "1a", "1b"
  targetType: 'step' | 'substep';
  parentId?: string;          // For substeps, the parent step display ID (e.g., "1")
  originalText: string;       // The text of what's being deleted (for display)
  reason: string;
}

export interface EditSuggestion {
  targetId: string;           // "2" or "2a" (step or substep)
  targetType: "step" | "substep";
  parentId?: string;          // For substeps, the parent step ID
  originalText: string;       // Current text (for display)
  newText: string;            // Proposed change
}

// Per-task or global staging state for AI suggestions
export interface StagingState {
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  deletions: DeletionSuggestion[];
  suggestedTitle: string | null;
  pendingAction: 'replace' | 'suggest' | 'edit' | 'delete' | null;
}

export interface StructureResponse {
  action: AIAction;
  taskTitle: string | null;
  suggestedTitle?: string;        // Optional improved title suggestion (shown in staging)
  steps: Step[] | null;           // For "replace" action
  suggestions: SuggestedStep[] | null;  // For "suggest" action
  edits: EditSuggestion[] | null;       // For "edit" action
  deletions: DeletionSuggestion[] | null;  // For "delete" action
  message: string;
}

// ============================================
// Focus Mode Types (Model E: updated)
// ============================================

export interface FocusModeState {
  active: boolean;
  queueItemId: string | null;       // Model E: links to queue item
  taskId: string | null;
  currentStepId: string | null;
  paused: boolean;
  startTime: number | null;
  pausedTime: number;
  pauseStartTime: number | null;
}

// ============================================
// Filter & Sort Types (Model E: updated)
// ============================================

export interface FilterState {
  status: TaskStatus[];
  priority: (Priority | null)[];
  tags: string[];
  projectId: string | null;
  context: string | null;
  search: string;
  showWaitingOn: boolean;           // Model E: filter for waiting on
  showDeferred: boolean;            // Model E: filter for deferred
}

export type SortOption =
  | 'focusScore'                    // Model E: default for pool
  | 'priority'
  | 'targetDate'
  | 'deadlineDate'
  | 'createdAt'
  | 'updatedAt';

// ============================================
// App State Types (Model E: updated)
// ============================================

// Navigation: 2-tab + Search model
// Focus (home) | Tasks (combined Inbox + Pool) | Search | TaskDetail | Inbox (drill-in) | FocusMode | Projects
export type ViewType =
  | 'focus'      // Default home - Focus Queue with horizons
  | 'tasks'      // Combined Inbox + Pool view
  | 'inbox'      // Drill-in from Tasks "View all" inbox items
  | 'search'     // Search + Quick Access view
  | 'projects'   // Projects management view
  | 'taskDetail'
  | 'focusMode';

export interface AppState {
  schemaVersion: number;
  currentUser: User | null;

  // Data
  tasks: Task[];
  projects: Project[];

  // Focus Queue (Model E: replaces DailyPlan)
  focusQueue: FocusQueue;

  // Intelligence data
  events: Event[];
  focusSessions: FocusSession[];
  nudges: Nudge[];
  snoozedNudges: SnoozedNudge[];
  analytics: UserAnalytics | null;

  // Navigation (Model E: updated view types)
  currentView: ViewType;
  activeTaskId: string | null;

  // Focus mode
  focusMode: FocusModeState;
  currentSessionId: string | null;

  // AI staging (for top-level screens: Queue, Tasks, Inbox)
  globalStaging: StagingState | null;

  // Queue AI messages (48h retention, 60m display window)
  queueMessages: QueueMessage[];
  queueLastInteractionAt: number | null;

  // Tasks view AI messages (same 60m display window as queue)
  tasksMessages: QueueMessage[];
  tasksLastInteractionAt: number | null;

  // Filters & sort
  filters: FilterState;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';

  // UI state
  completedTodayExpanded: boolean;
  error: string | null;
}

// ============================================
// Utility Functions
// ============================================

// For generating unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create a new empty step
export function createStep(text: string = '', options?: Partial<Step>): Step {
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
    skipped: false,
    source: 'manual',
    wasEdited: false,
    ...options,
  };
}

// Create a new substep
export function createSubstep(parentId: string, index: number, text: string = ''): Substep {
  return {
    id: `${parentId}${String.fromCharCode(97 + index)}`, // e.g., "1a", "1b"
    text,
    shortLabel: null,
    completed: false,
    completedAt: null,
    skipped: false,
    source: 'manual',
  };
}

// Create a new project
export function createProject(name: string, color?: string): Project {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    description: null,
    color: color ?? null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

// Create a new task with all required fields (Model E)
export function createTask(title: string, options?: Partial<Task>): Task {
  const now = Date.now();
  return {
    id: generateId(),
    title,
    shortLabel: null,
    description: null,
    notes: null,
    steps: [],

    // Model E: status defaults to inbox
    status: 'inbox',
    completionType: 'step_based',
    completedAt: null,
    archivedAt: null,
    archivedReason: null,
    deletedAt: null,

    // Model E: waiting on and deferral
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
    reminder: null,

    effort: null,
    estimatedMinutes: null,
    totalTimeSpent: 0,
    focusSessionCount: 0,

    createdBy: null,
    assignedTo: null,
    sharedWith: [],
    source: 'manual',

    attachments: [],
    externalLinks: [],

    // Recurring fields
    isRecurring: false,
    recurrence: null,
    recurringStreak: 0,
    recurringBestStreak: 0,
    recurringInstances: [],
    recurringTotalCompletions: 0,
    recurringLastCompleted: null,
    recurringNextDue: null,

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

    messages: [],
    focusModeMessages: [],
    staging: null,

    ...options,
  };
}

// Create a new focus queue item (Model E)
export function createFocusQueueItem(
  taskId: string,
  horizon: Horizon = 'today',
  options?: Partial<FocusQueueItem>
): FocusQueueItem {
  const now = Date.now();
  return {
    id: generateId(),
    taskId,
    selectionType: 'all_today',
    selectedStepIds: [],
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
    ...options,
  };
}

// Create default initial app state (Model E)
export function createInitialAppState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    currentUser: null,

    tasks: [],
    projects: [],

    // Model E: Focus Queue instead of DailyPlan
    focusQueue: {
      items: [],
      todayLineIndex: 0,            // Initially all items would be "for today"
      lastReviewedAt: Date.now(),
    },

    events: [],
    focusSessions: [],
    nudges: [],
    snoozedNudges: [],
    analytics: null,

    // Model E: default view is focus (home)
    currentView: 'focus',
    activeTaskId: null,

    focusMode: {
      active: false,
      queueItemId: null,
      taskId: null,
      currentStepId: null,
      paused: false,
      startTime: null,
      pausedTime: 0,
      pauseStartTime: null,
    },
    currentSessionId: null,

    globalStaging: null,

    // Queue AI messages (48h retention, 60m display window)
    queueMessages: [],
    queueLastInteractionAt: null,

    // Tasks view AI messages (same 60m display window as queue)
    tasksMessages: [],
    tasksLastInteractionAt: null,

    filters: {
      status: ['inbox', 'pool'],
      priority: [],
      tags: [],
      projectId: null,
      context: null,
      search: '',
      showWaitingOn: true,
      showDeferred: false,
    },
    sortBy: 'focusScore',
    sortOrder: 'desc',

    completedTodayExpanded: true,
    error: null,
  };
}

// ============================================
// Legacy Compatibility (for migration)
// ============================================

// Old step creation (alias for compatibility)
export const createEmptyStep = (id?: string) => createStep('', id ? { id } : undefined);

// Old substep creation (alias for compatibility)
export const createEmptySubstep = createSubstep;

export interface TaskBreakdown {
  taskTitle: string;
  steps: Step[];
}

export type EditSource = "user" | "ai";
