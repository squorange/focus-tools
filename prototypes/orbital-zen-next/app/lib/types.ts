// Task types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 'work' | 'personal' | 'home' | 'maintenance' | 'other';

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
  orbitDistance?: number; // Distance from center (1-5, 1 = closest/most urgent)
  subtasks?: Subtask[];
  completed?: boolean;
  totalFocusTime?: number; // Total seconds spent in focus
  focusSessionCount?: number; // Number of focus sessions
  addedBy?: string; // 'user' | 'partner' | 'ai'
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
