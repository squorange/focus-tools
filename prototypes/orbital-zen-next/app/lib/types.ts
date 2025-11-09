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

// Focus session types
export interface FocusSession {
  taskId: string;
  subtaskId?: string;
  startTime: Date;
  pausedAt?: Date;
  isActive: boolean;
  totalTime: number; // seconds accumulated
}

// App state
export interface AppState {
  tasks: Task[];
  selectedTaskId?: string;
  isOnline: boolean;
  isSyncing: boolean;
  activeFocusSession?: FocusSession;
}
