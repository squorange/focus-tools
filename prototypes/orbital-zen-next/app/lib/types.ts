// Task types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 'work' | 'personal' | 'home' | 'maintenance' | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  category: TaskCategory;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  orbitDistance?: number; // Distance from center (1-5, 1 = closest/most urgent)
  subtasks?: Subtask[];
  completed?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  parentTaskId: string;
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

// App state
export interface AppState {
  tasks: Task[];
  selectedTaskId?: string;
  isOnline: boolean;
  isSyncing: boolean;
}
