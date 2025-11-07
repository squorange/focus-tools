import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Task, ChatMessage } from './types';

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
}

const DB_NAME = 'orbital-zen-db';
const DB_VERSION = 2; // Incremented to refresh with subtasks data

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

// Initialize with sample data
export async function initializeSampleData(): Promise<void> {
  const existingTasks = await getTasks();
  if (existingTasks.length > 0) return; // Already initialized

  const sampleTasks: Task[] = [
    {
      id: '1',
      title: 'Call dentist',
      description: 'Schedule 6-month checkup',
      priority: 'urgent',
      category: 'personal',
      createdAt: new Date(),
      updatedAt: new Date(),
      orbitDistance: 1,
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
      orbitDistance: 2,
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
      orbitDistance: 3,
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
      orbitDistance: 3,
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
      orbitDistance: 4,
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
