// Task types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 'work' | 'personal' | 'home' | 'maintenance' | 'other';
export type EnergyLevel = 'high' | 'medium' | 'low' | 'rest';
export type EstimatedTime = '5min' | '15min' | '30min' | '1hr' | '2hr' | '4hr' | '1day' | '1week';

export interface Task {
  id: string;
  title: string;
  description?: string;
  notes?: string; // Freeform notes/scratchpad
  priority: TaskPriority;
  category: TaskCategory;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  targetDate?: Date; // Target completion date (softer than due date)
  orbitDistance?: number; // DEPRECATED: Position is now determined by array index (0 = closest to center)
  subtasks?: Subtask[];
  completed?: boolean;
  totalFocusTime?: number; // Total seconds spent in focus
  focusSessionCount?: number; // Number of focus sessions
  addedBy?: string; // 'user' | 'partner' | 'ai'

  // Organization fields
  energy?: EnergyLevel; // Energy level required
  tags?: string[]; // Context tags
  estimatedTime?: EstimatedTime; // Estimated time to complete

  /**
   * Priority marker (belt) fields
   * The belt visually groups high-priority subtasks in the orbital view
   */

  /** Whether the priority marker belt is currently enabled and visible */
  priorityMarkerEnabled?: boolean;

  /**
   * Ring position where the belt is placed (1-based indexing).
   *
   * DYNAMIC BEHAVIOR:
   * - Maintains position in STACKING ORDER (relative to priority items)
   * - Shifts inward RADIALLY as priority items complete
   * - Returns to ring 0 (celebration mode) when all priority items complete
   *
   * The belt appears AFTER the last priority item in the list, accounting
   * for completed items that have disappeared from view.
   *
   * Calculated by: `getCurrentMarkerRing(subtasks, beltRing, originalTargetIds)`
   *
   * @see orbit-utils.ts INVARIANT #4 for belt tracking logic
   *
   * @example
   * // 3 priority items at positions 0, 1, 2 → belt at ring 4
   * // Complete item 0 → 2 active priority items → belt at ring 3
   * // Complete all → belt at ring 0 (celebration)
   */
  priorityMarkerRing?: number;

  /**
   * Original IDs of subtasks that were marked as priority when belt was created.
   *
   * IMMUTABLE TRACKING:
   * - Stays fixed even as priority items complete/uncomplete
   * - Used to determine belt position and celebration trigger
   * - Cleared when belt is removed or all priority items complete
   *
   * This allows the belt to track completion of the ORIGINAL priority set,
   * not the current filtered/active items.
   *
   * @see orbit-utils.ts getCurrentMarkerRing for how this is used
   *
   * @example
   * // Created belt with items A, B, C
   * priorityMarkerOriginalIds: ['A', 'B', 'C']
   * // After completing A and B:
   * // - Still tracks all 3 original IDs
   * // - Belt position based on C's position
   * // - Completing C triggers celebration
   */
  priorityMarkerOriginalIds?: string[];
}

/**
 * Subtask represents a work item within a parent task.
 * Rendered as orbiting nodes in the orbital visualization.
 */
export interface Subtask {
  /** Unique identifier for this subtask */
  id: string;

  /** Display title of the subtask */
  title: string;

  /** Whether this subtask has been completed */
  completed: boolean;

  /** ID of the parent task this subtask belongs to */
  parentTaskId: string;

  /** Optional notes/scratchpad for this specific subtask */
  notes?: string;

  /** Optional due date for this subtask */
  dueDate?: Date;

  /** Total seconds spent in focus sessions on this subtask */
  totalFocusTime?: number;

  /** Number of focus sessions completed for this subtask */
  focusSessionCount?: number;

  /**
   * Permanent angular position in degrees (-180 to 180) for orbital rendering.
   *
   * CRITICAL REQUIREMENTS:
   * - MUST be calculated from ORIGINAL array index, not filtered/active index
   * - MUST be persisted to database immediately after initialization
   * - MUST NOT change when other subtasks are completed/uncompleted
   *
   * This ensures subtasks maintain their angular positions as items complete,
   * preventing jarring "jumps" during animations.
   *
   * Calculated by: `getSubtaskAngle(originalArrayIndex, totalSubtasks)`
   * Persisted by: `initializeSubtaskOrbits()` followed by `saveTask()`
   *
   * @see orbit-utils.ts INVARIANT #1 for details
   * @see orbit-utils.ts INVARIANT #3 for persistence requirements
   * @see docs/KNOWN_ISSUES.md section 1 for regression history
   *
   * @example
   * // 4 subtasks evenly distributed:
   * assignedStartingAngle: -90  // top (12 o'clock)
   * assignedStartingAngle: 0    // right (3 o'clock)
   * assignedStartingAngle: 90   // bottom (6 o'clock)
   * assignedStartingAngle: 180  // left (9 o'clock)
   */
  assignedStartingAngle?: number;

  /**
   * Orbital ring radius in pixels for rendering.
   *
   * DYNAMIC BEHAVIOR:
   * - Calculated from ACTIVE position (non-completed items only)
   * - Shifts inward as items complete (creates collapsing effect)
   * - Recalculated via `recalculateRadii()` on completion/uncompletion
   *
   * Unlike assignedStartingAngle (which stays fixed), this value updates
   * to reflect the current orbital ring position as items complete.
   *
   * Standard radii: 115px (ring 1), 155px (ring 2), 195px (ring 3), etc.
   * Spacing: 40px between rings, +20px buffer on each side of priority belt
   *
   * @see orbit-utils.ts INVARIANT #2 for radial dynamics
   * @see orbit-utils.ts getSubtaskRadiusWithBelt for calculation logic
   *
   * @example
   * // Active subtasks shift inward:
   * [A, B, C] → Complete B → [A, C] with C moving to ring 2 (was ring 3)
   */
  assignedOrbitRadius?: number;
}

// AI types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  taskId?: string;
}

export interface AIContext {
  task?: Task;
  recentMessages: ChatMessage[];
}

// Focus session types (active state)
export interface FocusSession {
  id: string; // UUID for this session
  taskId: string;
  subtaskId?: string;
  startTime: Date;
  isActive: boolean; // true = running, false = paused
  lastResumedAt?: Date; // When most recently resumed (or startTime if never paused)
  totalTime: number; // Accumulated active seconds when paused

  // Break tracking
  currentBreakStartTime?: Date; // Set when break starts
  totalBreakTime: number; // Accumulated break seconds
  breaksTaken: number;

  // Pause tracking
  pauseCount: number;
  totalPauseTime: number; // Accumulated pause seconds
  pauseHistory: Array<{
    pausedAt: Date;
    resumedAt?: Date; // undefined = currently paused
  }>;

  // Break reminder state
  lastBreakReminderAt?: Date;
  breakReminderSnoozeCount: number;
  flowModeEnabled: boolean; // User dismissed reminders

  // Stale detection
  lastActivityTime: Date; // Updated on any user interaction

  device: 'desktop' | 'mobile' | 'unknown';
}

// Time entry types (historical record)
export interface TimeEntry {
  id: string; // UUID for this entry
  sessionId: string; // Links to original FocusSession.id
  taskId: string;
  subtaskId?: string;

  // Time data
  startTime: Date;
  endTime: Date;
  duration: number; // Active work seconds (excludes pauses & breaks)

  // Session metadata
  pauseCount: number;
  totalPauseTime: number; // Seconds
  breaksTaken: number;
  totalBreakTime: number; // Seconds

  // Completion info
  wasCompleted: boolean; // true if ended with "Complete" button
  endReason: 'completed' | 'stopped' | 'stale' | 'manual';

  // Manual entry
  isManualEntry: boolean;
  sessionNotes?: string; // Optional notes for this session

  // Device tracking
  device: 'desktop' | 'mobile' | 'unknown';

  // Detailed history (optional, for deep analysis)
  pauseTimestamps?: Array<{ pausedAt: Date; resumedAt: Date }>;
  breakTimestamps?: Array<{ startedAt: Date; endedAt: Date }>;

  // Metadata
  createdAt: Date;
}

// Task time aggregation (computed, not stored)
export interface TaskTimeStats {
  totalActiveTime: number; // Sum of all TimeEntry.duration
  totalBreakTime: number; // Sum of all TimeEntry.totalBreakTime
  totalPauseTime: number; // Sum of all TimeEntry.totalPauseTime
  sessionCount: number; // Count of TimeEntries
  averageSessionLength: number; // Mean duration
  completionRate: number; // % of sessions that ended with "completed"
  lastWorkedOn?: Date; // Most recent TimeEntry.endTime
  lastSessionNotes?: string; // Most recent session notes
  subtaskBreakdown?: Array<{
    // Per-subtask time breakdown (for parent tasks)
    subtaskId: string;
    subtaskTitle: string;
    totalTime: number;
    sessionCount: number;
  }>;
}

// Activity log types
export type ActivityLogType =
  | 'session_start'
  | 'session_end'
  | 'session_pause'
  | 'session_resume'
  | 'task_created'
  | 'task_completed'
  | 'task_uncompleted'
  | 'task_cancelled'
  | 'subtask_created'
  | 'subtask_completed'
  | 'subtask_uncompleted'
  | 'subtask_cancelled'
  | 'comment'; // Manual user comment

export interface ActivityLog {
  id: string; // UUID for this log entry
  taskId: string;
  subtaskId?: string;
  type: ActivityLogType;
  timestamp: Date;

  // Factual data (always present for relevant types)
  sessionId?: string; // Links to TimeEntry.sessionId
  duration?: number; // For session_end (active work seconds)

  // Optional rich context (user-added or auto-generated)
  comment?: string; // User comment or auto-generated description

  // Edit tracking for manual comments
  isManualComment: boolean; // true for type='comment', false for auto-logs
  editedAt?: Date;
  editHistory?: Array<{
    editedAt: Date;
    previousComment: string;
  }>;

  // Metadata
  createdAt: Date;
}

// App state
export interface AppState {
  tasks: Task[];
  selectedTaskId?: string;
  isOnline: boolean;
  isSyncing: boolean;
  activeFocusSession?: FocusSession;
}
