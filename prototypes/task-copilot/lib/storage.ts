import {
  AppState,
  SCHEMA_VERSION,
  createInitialAppState,
  Task,
  Step,
  Substep,
  Message,
} from './types';

// ============================================
// Storage Keys
// ============================================

const STORAGE_KEYS = {
  state: 'focus-tools-state',
  events: 'focus-tools-events',
  sessions: 'focus-tools-sessions',
} as const;

// ============================================
// Load State
// ============================================

/**
 * Load app state from localStorage
 */
export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return createInitialAppState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.state);
    if (!stored) {
      return createInitialAppState();
    }

    const parsed = JSON.parse(stored);
    return migrateState(parsed);
  } catch (error) {
    console.error('Failed to load state:', error);
    return createInitialAppState();
  }
}

/**
 * Load events separately (they can grow large)
 */
export function loadEvents(): AppState['events'] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.events);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load events:', error);
    return [];
  }
}

/**
 * Load focus sessions separately
 */
export function loadSessions(): AppState['focusSessions'] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.sessions);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }
}

// ============================================
// Save State
// ============================================

/**
 * Save app state to localStorage
 */
export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;

  try {
    // Save main state (without events and sessions to prevent size issues)
    const stateToSave = {
      ...state,
      events: [], // Events stored separately
      focusSessions: [], // Sessions stored separately
    };
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * Save events separately
 */
export function saveEvents(events: AppState['events']): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save events:', error);
    // If events are too large, truncate to most recent
    try {
      const truncated = events.slice(-1000);
      localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(truncated));
      console.warn('Events truncated to prevent storage overflow');
    } catch {
      console.error('Failed to save truncated events');
    }
  }
}

/**
 * Save sessions separately
 */
export function saveSessions(sessions: AppState['focusSessions']): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions:', error);
  }
}

// ============================================
// Migration
// ============================================

/**
 * Migrate state from older schema versions
 */
export function migrateState(stored: Record<string, unknown>): AppState {
  let state = stored as Partial<AppState>;
  const version = (state.schemaVersion as number) || 0;

  // Version 0 → 1: Legacy single-task format to multi-task
  if (version < 1) {
    state = migrateLegacyState(stored);
  }

  // Future migrations here:
  // if (version < 2) { state = migrateToV2(state); }

  // Ensure all required fields exist
  return ensureCompleteState(state);
}

/**
 * Migrate from legacy single-task format
 */
function migrateLegacyState(stored: Record<string, unknown>): Partial<AppState> {
  const initial = createInitialAppState();

  // Check if this is the old format (has taskTitle, steps at root level)
  if ('taskTitle' in stored && 'steps' in stored) {
    const legacyTitle = stored.taskTitle as string;
    const legacySteps = stored.steps as unknown[];
    const legacyNotes = stored.taskNotes as string | undefined;

    // Only create a task if there was actual content
    if (legacyTitle || (legacySteps && legacySteps.length > 0)) {
      const now = Date.now();
      const migratedTask: Task = {
        id: 'migrated-' + now,
        title: legacyTitle || 'Untitled Task',
        shortLabel: null,
        description: legacyNotes || null,
        steps: migrateSteps(legacySteps || []),
        status: 'active',
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
        aiAssisted: legacySteps && legacySteps.length > 0,
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
        // Migrate old messages to task-level storage
        messages: (stored.messages as Message[]) || [],
        focusModeMessages: [],
      };

      return {
        ...initial,
        tasks: [migratedTask],
        activeTaskId: migratedTask.id,
      };
    }
  }

  return initial;
}

/**
 * Migrate legacy step format to new format
 */
function migrateSteps(legacySteps: unknown[]): Step[] {
  return legacySteps.map((s: unknown) => {
    const step = s as Record<string, unknown>;
    return {
      id: step.id as string,
      text: step.text as string,
      shortLabel: null,
      substeps: migrateSubsteps((step.substeps as unknown[]) || []),
      completed: (step.completed as boolean) || false,
      completedAt: null,
      skipped: step.skipped as boolean | undefined,
      estimatedMinutes: null,
      timeSpent: 0,
      timesStuck: 0,
      source: 'ai_generated' as const,
      wasEdited: false,
      complexity: null,
    };
  });
}

/**
 * Migrate legacy substep format
 */
function migrateSubsteps(legacySubsteps: unknown[]): Substep[] {
  return legacySubsteps.map((s: unknown) => {
    const substep = s as Record<string, unknown>;
    return {
      id: substep.id as string,
      text: substep.text as string,
      shortLabel: null,
      completed: (substep.completed as boolean) || false,
      completedAt: null,
      skipped: substep.skipped as boolean | undefined,
      source: 'ai_generated' as const,
    };
  });
}

/**
 * Ensure state has all required fields
 */
function ensureCompleteState(partial: Partial<AppState>): AppState {
  const initial = createInitialAppState();

  // Ensure each task has the new message fields (migration for existing tasks)
  const migratedTasks = (partial.tasks ?? initial.tasks).map((task) => ({
    ...task,
    messages: task.messages ?? [],
    focusModeMessages: task.focusModeMessages ?? [],
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    currentUser: partial.currentUser ?? initial.currentUser,
    tasks: migratedTasks,
    projects: partial.projects ?? initial.projects,
    dailyPlans: partial.dailyPlans ?? initial.dailyPlans,
    todayPlanId: partial.todayPlanId ?? initial.todayPlanId,
    events: partial.events ?? initial.events,
    focusSessions: partial.focusSessions ?? initial.focusSessions,
    analytics: partial.analytics ?? initial.analytics,
    currentView: partial.currentView ?? initial.currentView,
    activeTaskId: partial.activeTaskId ?? initial.activeTaskId,
    focusMode: partial.focusMode ?? initial.focusMode,
    currentSessionId: partial.currentSessionId ?? initial.currentSessionId,
    aiDrawer: partial.aiDrawer ?? initial.aiDrawer,
    suggestions: partial.suggestions ?? initial.suggestions,
    edits: partial.edits ?? initial.edits,
    suggestedTitle: partial.suggestedTitle ?? initial.suggestedTitle,
    filters: partial.filters ?? initial.filters,
    sortBy: partial.sortBy ?? initial.sortBy,
    sortOrder: partial.sortOrder ?? initial.sortOrder,
    completedTodayExpanded: partial.completedTodayExpanded ?? initial.completedTodayExpanded,
    error: partial.error ?? initial.error,
  };
}

// ============================================
// Clear Storage
// ============================================

/**
 * Clear all stored data (for testing/reset)
 */
export function clearStorage(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.state);
  localStorage.removeItem(STORAGE_KEYS.events);
  localStorage.removeItem(STORAGE_KEYS.sessions);
}

// ============================================
// Export/Import
// ============================================

/**
 * Export all data as JSON string
 */
export function exportData(): string {
  const state = loadState();
  const events = loadEvents();
  const sessions = loadSessions();

  return JSON.stringify(
    {
      exportedAt: Date.now(),
      schemaVersion: SCHEMA_VERSION,
      state,
      events,
      sessions,
    },
    null,
    2
  );
}

/**
 * Import data from JSON string
 */
export function importData(jsonString: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonString);

    if (!data.state || !data.schemaVersion) {
      return { success: false, error: 'Invalid export format' };
    }

    const migratedState = migrateState(data.state);
    saveState(migratedState);

    if (data.events) {
      saveEvents(data.events);
    }

    if (data.sessions) {
      saveSessions(data.sessions);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
