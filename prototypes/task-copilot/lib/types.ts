// ============================================
// Schema Version
// ============================================

export const SCHEMA_VERSION = 1;

// ============================================
// Task Structure Types
// ============================================

export interface Substep {
  id: string;
  text: string;
  shortLabel: string | null;
  completed: boolean;
  completedAt: number | null;
  skipped?: boolean;
  source: 'manual' | 'ai_generated' | 'ai_suggested';
}

export interface Step {
  id: string;
  text: string;
  shortLabel: string | null;
  substeps: Substep[];
  completed: boolean;
  completedAt: number | null;
  skipped?: boolean;

  // Time tracking
  estimatedMinutes: number | null;
  timeSpent: number;

  // Intelligence
  timesStuck: number;
  source: 'manual' | 'ai_generated' | 'ai_suggested';
  wasEdited: boolean;

  // Computed visualization (for Orbital UI)
  complexity: 'simple' | 'moderate' | 'complex' | null;
}

export type TaskStatus = 'inbox' | 'active' | 'complete' | 'archived';
export type Priority = 'high' | 'medium' | 'low';
export type Effort = 'quick' | 'medium' | 'deep';
export type HealthStatus = 'healthy' | 'at_risk' | 'critical';
export type TaskSource =
  | 'manual'
  | 'ai_breakdown'
  | 'ai_suggestion'
  | 'shared'
  | 'email'
  | 'calendar'
  | 'voice';

export interface Task {
  id: string;
  title: string;
  shortLabel: string | null;
  description: string | null;
  steps: Step[];

  // Status & Lifecycle
  status: TaskStatus;
  completedAt: number | null;
  archivedAt: number | null;
  deletedAt: number | null;

  // Organization
  priority: Priority | null;
  tags: string[];
  projectId: string | null;
  context: string | null;

  // Dates
  targetDate: string | null;      // ISO date (YYYY-MM-DD)
  deadlineDate: string | null;    // ISO date (YYYY-MM-DD)

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

  // Recurrence (future)
  recurrence: RecurrenceRule | null;

  // Intelligence Fields
  estimationAccuracy: number | null;
  firstFocusedAt: number | null;
  timesDeferred: number;
  lastDeferredAt: number | null;
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

  // Per-task AI conversations
  messages: Message[];           // Task detail AI chat history
  focusModeMessages: Message[];  // Focus mode AI chat history
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
  system: 'calendar' | 'email' | 'github' | 'notion' | 'other';
  externalId: string;
  url: string | null;
  syncedAt: number | null;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  endDate: string | null;
  endAfter: number | null;
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
// Daily Planning Model (Asteroid Belt)
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

export interface FocusItem {
  id: string;
  type: 'task' | 'step';
  taskId: string;
  stepId: string | null;
  order: number;

  // Planning metadata
  estimatedMinutes: number | null;
  reason: FocusReason | null;
  addedBy: 'user' | 'ai_suggested';

  // Outcome tracking
  completed: boolean;
  completedAt: number | null;
  actualMinutes: number | null;
}

export interface DailyPlan {
  id: string;
  date: string;                       // ISO date (YYYY-MM-DD)
  focusItems: FocusItem[];
  totalEstimatedMinutes: number;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// Event Log Model
// ============================================

export type EventType =
  // Task lifecycle
  | 'task_created'
  | 'task_updated'
  | 'task_started'
  | 'task_completed'
  | 'task_archived'
  | 'task_restored'
  | 'task_deleted'

  // Step lifecycle
  | 'step_created'
  | 'step_completed'
  | 'step_uncompleted'
  | 'substep_completed'

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

  // Estimation
  | 'estimate_set'
  | 'estimate_updated'

  // Planning
  | 'priority_changed'
  | 'date_changed'
  | 'task_deferred';

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
  data: Record<string, unknown>;
  context: EventContext;
}

// ============================================
// Focus Session Model
// ============================================

export interface StuckEvent {
  stepId: string;
  timestamp: number;
  resolution: 'broke_down' | 'skipped' | 'talked_through' | 'took_break' | 'other';
  timeToResolve: number;
  resultedInCompletion: boolean;
}

export interface FocusSession {
  id: string;
  taskId: string;
  startTime: number;
  endTime: number | null;
  totalDuration: number;
  pauseDuration: number;
  stepsAtStart: number;
  stepsCompleted: string[];
  substepsCompleted: string[];
  stuckEvents: StuckEvent[];
  context: EventContext;
  outcome: 'completed_task' | 'made_progress' | 'no_progress' | 'abandoned' | null;
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

// ============================================
// API Types
// ============================================

export type AIAction = "replace" | "suggest" | "edit" | "none";

export interface StructureRequest {
  userMessage: string;
  currentList: Step[] | null;
  taskTitle: string | null;
  conversationHistory: Message[];
}

export interface SuggestedStep {
  id: string;
  text: string;
  substeps: { id: string; text: string }[];
  parentStepId?: string;  // If set, add as substep to this step instead of as new step
}

export interface EditSuggestion {
  targetId: string;           // "2" or "2a" (step or substep)
  targetType: "step" | "substep";
  parentId?: string;          // For substeps, the parent step ID
  originalText: string;       // Current text (for display)
  newText: string;            // Proposed change
}

export interface StructureResponse {
  action: AIAction;
  taskTitle: string | null;
  suggestedTitle?: string;        // Optional improved title suggestion (shown in staging)
  steps: Step[] | null;           // For "replace" action
  suggestions: SuggestedStep[] | null;  // For "suggest" action
  edits: EditSuggestion[] | null;       // For "edit" action
  message: string;
}

// ============================================
// Focus Mode Types
// ============================================

export interface FocusModeState {
  active: boolean;
  taskId: string | null;
  stepId: string | null;
  paused: boolean;
  startTime: number | null;
  pausedTime: number;
  pauseStartTime: number | null;
}

// ============================================
// Filter & Sort Types
// ============================================

export interface FilterState {
  status: TaskStatus[];
  priority: (Priority | null)[];
  tags: string[];
  projectId: string | null;
  context: string | null;
  hasDueDate: boolean | null;
  isOverdue: boolean | null;
  search: string;
}

export type SortOption =
  | 'priority'
  | 'targetDate'
  | 'deadlineDate'
  | 'createdAt'
  | 'updatedAt'
  | 'manual';

// ============================================
// AI Drawer Types
// ============================================

export interface AIDrawerState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  context: 'general' | 'task' | 'focus';
}

// ============================================
// App State Types
// ============================================

export type ViewType = 'dashboard' | 'taskDetail' | 'focusMode';

export interface AppState {
  schemaVersion: number;
  currentUser: User | null;

  // Data
  tasks: Task[];
  projects: Project[];

  // Daily planning
  dailyPlans: DailyPlan[];
  todayPlanId: string | null;

  // Intelligence data
  events: Event[];
  focusSessions: FocusSession[];
  analytics: UserAnalytics | null;

  // Navigation
  currentView: ViewType;
  activeTaskId: string | null;

  // Focus mode
  focusMode: FocusModeState;
  currentSessionId: string | null;

  // AI
  aiDrawer: AIDrawerState;
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  suggestedTitle: string | null;

  // Filters & sort
  filters: FilterState;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';

  // UI state
  completedTodayExpanded: boolean;
  error: string | null;
}

// ============================================
// Legacy TaskBreakdown (for migration)
// ============================================

export interface TaskBreakdown {
  taskTitle: string;
  steps: Step[];
}

// ============================================
// Utility Types
// ============================================

export type EditSource = "user" | "ai";

// For generating unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create a new empty step
export function createEmptyStep(id?: string): Step {
  return {
    id: id || generateId(),
    text: "",
    shortLabel: null,
    substeps: [],
    completed: false,
    completedAt: null,
    estimatedMinutes: null,
    timeSpent: 0,
    timesStuck: 0,
    source: 'manual',
    wasEdited: false,
    complexity: null,
  };
}

// Create a new substep
export function createEmptySubstep(parentId: string, index: number): Substep {
  return {
    id: `${parentId}${String.fromCharCode(97 + index)}`, // e.g., "1a", "1b"
    text: "",
    shortLabel: null,
    completed: false,
    completedAt: null,
    source: 'manual',
  };
}

// Create a new task with all required fields
export function createTask(title: string, options?: Partial<Task>): Task {
  const now = Date.now();
  return {
    id: generateId(),
    title,
    shortLabel: null,
    description: null,
    steps: [],

    status: 'inbox',
    completedAt: null,
    archivedAt: null,
    deletedAt: null,

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
    source: 'manual',

    attachments: [],
    externalLinks: [],
    recurrence: null,

    estimationAccuracy: null,
    firstFocusedAt: null,
    timesDeferred: 0,
    lastDeferredAt: null,
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

    ...options,
  };
}

// Create default initial app state
export function createInitialAppState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    currentUser: null,

    tasks: [],
    projects: [],

    dailyPlans: [],
    todayPlanId: null,

    events: [],
    focusSessions: [],
    analytics: null,

    currentView: 'dashboard',
    activeTaskId: null,

    focusMode: {
      active: false,
      taskId: null,
      stepId: null,
      paused: false,
      startTime: null,
      pausedTime: 0,
      pauseStartTime: null,
    },
    currentSessionId: null,

    aiDrawer: {
      isOpen: false,
      messages: [],
      isLoading: false,
      context: 'general',
    },
    suggestions: [],
    edits: [],
    suggestedTitle: null,

    filters: {
      status: ['inbox', 'active'],
      priority: [],
      tags: [],
      projectId: null,
      context: null,
      hasDueDate: null,
      isOverdue: null,
      search: '',
    },
    sortBy: 'createdAt',
    sortOrder: 'desc',

    completedTodayExpanded: true,
    error: null,
  };
}
