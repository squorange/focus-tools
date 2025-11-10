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
  orbitDistance?: number; // Distance from center (1-5, 1 = closest/most urgent)
  subtasks?: Subtask[];
  completed?: boolean;
  totalFocusTime?: number; // Total seconds spent in focus
  focusSessionCount?: number; // Number of focus sessions
  addedBy?: string; // 'user' | 'partner' | 'ai'

  // Organization fields
  energy?: EnergyLevel; // Energy level required
  tags?: string[]; // Context tags
  estimatedTime?: EstimatedTime; // Estimated time to complete

  // Priority marker fields
  priorityMarkerEnabled?: boolean; // Whether priority marker is shown
  priorityMarkerRing?: number; // Ring position where belt is placed (1-based, e.g., 3 = belt at ring 3)
  priorityMarkerOriginalIds?: string[]; // IDs of subtasks originally inside belt
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  parentTaskId: string;
  notes?: string;  // Subtask-specific scratchpad
  dueDate?: Date;
  totalFocusTime?: number; // Total seconds spent in focus
  focusSessionCount?: number; // Number of focus sessions
  assignedStartingAngle?: number; // Permanent starting angle for orbital animation (degrees)
  assignedOrbitRadius?: number; // Assigned orbital radius (pixels)
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
  id: string;  // UUID for this session
  taskId: string;
  subtaskId?: string;
  startTime: Date;
  isActive: boolean;  // true = running, false = paused
  lastResumedAt?: Date;  // When most recently resumed (or startTime if never paused)
  totalTime: number;  // Accumulated active seconds when paused

  // Break tracking
  currentBreakStartTime?: Date;  // Set when break starts
  totalBreakTime: number;  // Accumulated break seconds
  breaksTaken: number;

  // Pause tracking
  pauseCount: number;
  totalPauseTime: number;  // Accumulated pause seconds
  pauseHistory: Array<{
    pausedAt: Date;
    resumedAt?: Date;  // undefined = currently paused
  }>;

  // Break reminder state
  lastBreakReminderAt?: Date;
  breakReminderSnoozeCount: number;
  flowModeEnabled: boolean;  // User dismissed reminders

  // Stale detection
  lastActivityTime: Date;  // Updated on any user interaction

  device: 'desktop' | 'mobile' | 'unknown';
}

// Time entry types (historical record)
export interface TimeEntry {
  id: string;  // UUID for this entry
  sessionId: string;  // Links to original FocusSession.id
  taskId: string;
  subtaskId?: string;

  // Time data
  startTime: Date;
  endTime: Date;
  duration: number;  // Active work seconds (excludes pauses & breaks)

  // Session metadata
  pauseCount: number;
  totalPauseTime: number;  // Seconds
  breaksTaken: number;
  totalBreakTime: number;  // Seconds

  // Completion info
  wasCompleted: boolean;  // true if ended with "Complete" button
  endReason: 'completed' | 'stopped' | 'stale' | 'manual';

  // Manual entry
  isManualEntry: boolean;
  sessionNotes?: string;  // Optional notes for this session

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
  totalActiveTime: number;  // Sum of all TimeEntry.duration
  totalBreakTime: number;   // Sum of all TimeEntry.totalBreakTime
  totalPauseTime: number;   // Sum of all TimeEntry.totalPauseTime
  sessionCount: number;     // Count of TimeEntries
  averageSessionLength: number;  // Mean duration
  completionRate: number;   // % of sessions that ended with "completed"
  lastWorkedOn?: Date;      // Most recent TimeEntry.endTime
  lastSessionNotes?: string; // Most recent session notes
  subtaskBreakdown?: Array<{  // Per-subtask time breakdown (for parent tasks)
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
