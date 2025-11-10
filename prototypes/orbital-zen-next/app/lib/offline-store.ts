import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Task, ChatMessage, FocusSession, TimeEntry, ActivityLog } from './types';

interface OrbitalZenDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-priority': TaskPriority; 'by-category': string };
  };
  messages: {
    key: string;
    value: ChatMessage;
    indexes: { 'by-taskId': string };
  };
  focusSessions: {
    key: string;
    value: FocusSession;
    indexes: {
      'by-task': string;
      'by-active': number;
      'by-lastActivity': Date;
    };
  };
  timeEntries: {
    key: string;
    value: TimeEntry;
    indexes: {
      'by-task': string;
      'by-subtask': [string, string];  // [taskId, subtaskId]
      'by-date': Date;
      'by-session': string;
    };
  };
  activityLogs: {
    key: string;
    value: ActivityLog;
    indexes: {
      'by-task': string;
      'by-subtask': [string, string];  // [taskId, subtaskId]
      'by-timestamp': Date;
      'by-type': string;
    };
  };
}

const DB_NAME = 'orbital-zen-db';
const DB_VERSION = 5; // Incremented for ActivityLog

let dbInstance: IDBPDatabase<OrbitalZenDB> | null = null;

async function getDB(): Promise<IDBPDatabase<OrbitalZenDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OrbitalZenDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-priority', 'priority');
        taskStore.createIndex('by-category', 'category');
      }

      // Messages store
      if (!db.objectStoreNames.contains('messages')) {
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
        messageStore.createIndex('by-taskId', 'taskId');
      }

      // Remove old focusSession store if it exists (migrating to new structure)
      if (oldVersion < 4 && db.objectStoreNames.contains('focusSession')) {
        db.deleteObjectStore('focusSession');
      }

      // Focus sessions store (v4: new enhanced structure)
      if (!db.objectStoreNames.contains('focusSessions')) {
        const sessionStore = db.createObjectStore('focusSessions', { keyPath: 'id' });
        sessionStore.createIndex('by-task', 'taskId');
        sessionStore.createIndex('by-active', 'isActive');
        sessionStore.createIndex('by-lastActivity', 'lastActivityTime');
      }

      // Time entries store (v4: new historical tracking)
      if (!db.objectStoreNames.contains('timeEntries')) {
        const entryStore = db.createObjectStore('timeEntries', { keyPath: 'id' });
        entryStore.createIndex('by-task', 'taskId');
        entryStore.createIndex('by-subtask', ['taskId', 'subtaskId']);
        entryStore.createIndex('by-date', 'endTime');
        entryStore.createIndex('by-session', 'sessionId');
      }

      // Activity logs store (v5: activity timeline and comments)
      if (!db.objectStoreNames.contains('activityLogs')) {
        const logStore = db.createObjectStore('activityLogs', { keyPath: 'id' });
        logStore.createIndex('by-task', 'taskId');
        logStore.createIndex('by-subtask', ['taskId', 'subtaskId']);
        logStore.createIndex('by-timestamp', 'timestamp');
        logStore.createIndex('by-type', 'type');
      }

      // Clear existing data on upgrade to version 2 to get subtasks
      if (oldVersion < 2) {
        transaction.objectStore('tasks').clear();
      }
    },
  });

  return dbInstance;
}

// Task operations
export async function getTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDB();
  return db.get('tasks', id);
}

export async function saveTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put('tasks', task);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tasks', id);
}

// Message operations
export async function getMessages(taskId?: string): Promise<ChatMessage[]> {
  const db = await getDB();
  if (taskId) {
    return db.getAllFromIndex('messages', 'by-taskId', taskId);
  }
  return db.getAll('messages');
}

export async function saveMessage(message: ChatMessage): Promise<void> {
  const db = await getDB();
  await db.put('messages', message);
}

// Focus session operations
export async function getActiveFocusSession(): Promise<FocusSession | undefined> {
  const db = await getDB();
  const allSessions = await db.getAll('focusSession');
  return allSessions.find(session => session.isActive);
}

export async function saveFocusSession(session: FocusSession): Promise<void> {
  const db = await getDB();
  await db.put('focusSession', session);
}

export async function clearFocusSession(taskId: string): Promise<void> {
  const db = await getDB();
  await db.delete('focusSession', taskId);
}

export async function pauseActiveFocusSession(): Promise<void> {
  const activeSession = await getActiveFocusSession();
  if (activeSession && activeSession.isActive) {
    activeSession.pausedAt = new Date();
    activeSession.isActive = false;
    await saveFocusSession(activeSession);
  }
}

// Initialize with sample data
export async function initializeSampleData(): Promise<void> {
  const existingTasks = await getTasks();
  if (existingTasks.length > 0) return; // Already initialized

  // NOTE: Array order determines orbital position (index 0 = closest to center)
  const sampleTasks: Task[] = [
    {
      id: '1',
      title: 'Call dentist',
      description: 'Schedule 6-month checkup',
      priority: 'urgent',
      category: 'personal',
      createdAt: new Date(),
      updatedAt: new Date(),
      completed: false,
      subtasks: [
        { id: '1-1', title: 'Find dentist number', completed: false, parentTaskId: '1' },
        { id: '1-2', title: 'Check insurance', completed: false, parentTaskId: '1' },
        { id: '1-3', title: 'Schedule time off', completed: false, parentTaskId: '1' },
        { id: '1-4', title: 'Prepare questions', completed: false, parentTaskId: '1' },
      ],
    },
    {
      id: '2',
      title: 'Review Q3 budget',
      description: 'Analyze spending and prepare report',
      priority: 'high',
      category: 'work',
      createdAt: new Date(),
      updatedAt: new Date(),
      completed: false,
      subtasks: [
        { id: '2-1', title: 'Download reports', completed: false, parentTaskId: '2' },
        { id: '2-2', title: 'Analyze variances', completed: false, parentTaskId: '2' },
        { id: '2-3', title: 'Draft summary', completed: false, parentTaskId: '2' },
        { id: '2-4', title: 'Schedule review meeting', completed: false, parentTaskId: '2' },
      ],
    },
    {
      id: '3',
      title: 'Buy birthday gift',
      description: "Mom's birthday next week",
      priority: 'medium',
      category: 'personal',
      createdAt: new Date(),
      updatedAt: new Date(),
      completed: false,
      subtasks: [
        { id: '3-1', title: 'Brainstorm gift ideas', completed: false, parentTaskId: '3' },
        { id: '3-2', title: 'Check budget', completed: false, parentTaskId: '3' },
        { id: '3-3', title: 'Order or purchase', completed: false, parentTaskId: '3' },
      ],
    },
    {
      id: '4',
      title: 'Fix leaky faucet',
      description: 'Kitchen sink dripping',
      priority: 'medium',
      category: 'home',
      createdAt: new Date(),
      updatedAt: new Date(),
      completed: false,
      subtasks: [
        { id: '4-1', title: 'Buy replacement parts', completed: false, parentTaskId: '4' },
        { id: '4-2', title: 'Watch repair tutorial', completed: false, parentTaskId: '4' },
        { id: '4-3', title: 'Fix the faucet', completed: false, parentTaskId: '4' },
      ],
    },
    {
      id: '5',
      title: 'Schedule car service',
      description: 'Oil change and tire rotation',
      priority: 'low',
      category: 'maintenance',
      createdAt: new Date(),
      updatedAt: new Date(),
      completed: false,
      subtasks: [
        { id: '5-1', title: 'Find service center', completed: false, parentTaskId: '5' },
        { id: '5-2', title: 'Book appointment', completed: false, parentTaskId: '5' },
      ],
    },
  ];

  for (const task of sampleTasks) {
    await saveTask(task);
  }
}

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Activity log operations
export async function createActivityLog(log: ActivityLog): Promise<void> {
  const db = await getDB();
  await db.put('activityLogs', log);
}

export async function getActivityLogs(taskId: string, subtaskId?: string): Promise<ActivityLog[]> {
  const db = await getDB();

  if (subtaskId) {
    // Get logs for specific subtask
    const logs = await db.getAllFromIndex('activityLogs', 'by-subtask', [taskId, subtaskId]);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } else {
    // Get all logs for task (including subtasks)
    const logs = await db.getAllFromIndex('activityLogs', 'by-task', taskId);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export async function updateActivityLog(log: ActivityLog): Promise<void> {
  const db = await getDB();
  await db.put('activityLogs', log);
}

export async function deleteActivityLog(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('activityLogs', id);
}
