import {
  AppState,
  SCHEMA_VERSION,
  createInitialAppState,
  Task,
  Step,
  Substep,
  Message,
  FocusQueue,
  FocusQueueItem,
  Nudge,
  SnoozedNudge,
  StagingState,
} from './types';

// ============================================
// Storage Keys
// ============================================

const STORAGE_KEYS = {
  state: 'focus-tools-state',
  events: 'focus-tools-events',
  sessions: 'focus-tools-sessions',
  nudges: 'focus-tools-nudges',
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

/**
 * Load nudges separately
 */
export function loadNudges(): { nudges: Nudge[]; snoozedNudges: SnoozedNudge[] } {
  if (typeof window === 'undefined') return { nudges: [], snoozedNudges: [] };

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.nudges);
    if (!stored) return { nudges: [], snoozedNudges: [] };
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load nudges:', error);
    return { nudges: [], snoozedNudges: [] };
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
      nudges: [], // Nudges stored separately
      snoozedNudges: [], // Snoozed nudges stored separately
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

/**
 * Save nudges separately
 */
export function saveNudges(nudges: Nudge[], snoozedNudges: SnoozedNudge[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.nudges, JSON.stringify({ nudges, snoozedNudges }));
  } catch (error) {
    console.error('Failed to save nudges:', error);
  }
}

// ============================================
// Migration
// ============================================

/**
 * Migrate state from older schema versions
 */
export function migrateState(stored: Record<string, unknown>): AppState {
  let state = stored as Partial<AppState> & Record<string, unknown>;
  const version = (state.schemaVersion as number) || 0;

  // Version 0 → 1: Legacy single-task format to multi-task
  if (version < 1) {
    state = migrateLegacyState(stored);
  }

  // Version 1 → 2: Model E migration (active→pool, DailyPlan→FocusQueue)
  if (version < 2) {
    state = migrateToV2(state);
  }

  // Version 2 → 3: Focus Queue redesign (horizon → todayLineIndex)
  if (version < 3) {
    state = migrateToV3(state);
  }

  // Version 3 → 4: Per-task staging (staging on Task, globalStaging on AppState)
  if (version < 4) {
    state = migrateToV4(state);
  }

  // Version 4 → 5: selectionType: 'entire_task' → 'all_today'
  if (version < 5) {
    state = migrateToV5(state);
  }

  // Version 5 → 6: Fix Upcoming items to have selectionType: 'all_upcoming'
  if (version < 6) {
    state = migrateToV6(state);
  }

  // Version 6 → 7: Add queue messages with 48h retention
  if (version < 7) {
    state = migrateToV7(state);
  }

  // Version 7 → 8: Add reminder field to tasks
  if (version < 8) {
    state = migrateToV8(state);
  }

  // Ensure all required fields exist
  return ensureCompleteState(state);
}

/**
 * Migrate from legacy single-task format (v0 → v1)
 */
function migrateLegacyState(stored: Record<string, unknown>): Partial<AppState> & Record<string, unknown> {
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
        notes: null,
        steps: migrateSteps(legacySteps || []),
        status: 'pool', // Model E: use pool instead of active
        completionType: 'step_based',
        completedAt: null,
        archivedAt: null,
        archivedReason: null,
        deletedAt: null,
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
        recurrence: null,
        estimationAccuracy: null,
        firstFocusedAt: null,
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
        messages: (stored.messages as Message[]) || [],
        focusModeMessages: [],
        staging: null,
      };

      return {
        ...initial,
        tasks: [migratedTask],
        activeTaskId: migratedTask.id,
        schemaVersion: 1,
      } as Partial<AppState> & Record<string, unknown>;
    }
  }

  return { ...initial, schemaVersion: 1 } as Partial<AppState> & Record<string, unknown>;
}

/**
 * Migrate from v1 to v2 (Model E: active→pool, DailyPlan→FocusQueue)
 */
function migrateToV2(state: Partial<AppState> & Record<string, unknown>): Partial<AppState> & Record<string, unknown> {
  // Migrate tasks: active → pool, add new fields
  const tasks = ((state.tasks as Task[]) || []).map((task) => {
    const migratedTask: Task = {
      ...task,
      // Model E: active → pool
      status: task.status === ('active' as Task['status']) ? 'pool' : task.status,
      // Add new fields with defaults
      completionType: task.completionType ?? (task.steps.length > 0 ? 'step_based' : 'manual'),
      archivedReason: task.archivedReason ?? null,
      waitingOn: task.waitingOn ?? null,
      deferredUntil: task.deferredUntil ?? null,
      deferredAt: task.deferredAt ?? null,
      deferredCount: task.deferredCount ?? ((task as unknown as { timesDeferred?: number }).timesDeferred ?? 0),
      messages: task.messages ?? [],
      focusModeMessages: task.focusModeMessages ?? [],
    };
    return migratedTask;
  });

  // Migrate steps to add new fields
  const migratedTasks = tasks.map((task) => ({
    ...task,
    steps: task.steps.map((step) => ({
      ...step,
      effort: step.effort ?? null,
      estimateSource: step.estimateSource ?? null,
      firstFocusedAt: step.firstFocusedAt ?? null,
      estimationAccuracy: step.estimationAccuracy ?? null,
      context: step.context ?? null,
    })),
  }));

  // Convert DailyPlan to FocusQueue
  let focusQueue: FocusQueue = {
    items: [],
    todayLineIndex: 0,
    lastReviewedAt: Date.now(),
  };

  // Try to migrate from old dailyPlans format
  const dailyPlans = state.dailyPlans as Array<{
    id: string;
    date: string;
    focusItems: Array<{
      id: string;
      type: 'task' | 'step';
      taskId: string;
      stepId: string | null;
      order: number;
      reason: string | null;
      addedBy: 'user' | 'ai_suggested';
      completed: boolean;
      completedAt: number | null;
    }>;
  }> | undefined;

  const todayPlanId = state.todayPlanId as string | undefined;

  if (dailyPlans && todayPlanId) {
    const todayPlan = dailyPlans.find((p) => p.id === todayPlanId);
    if (todayPlan) {
      focusQueue.items = todayPlan.focusItems.map((item, index): FocusQueueItem => ({
        id: item.id,
        taskId: item.taskId,
        selectionType: item.type === 'task' ? 'all_today' : 'specific_steps',
        selectedStepIds: item.stepId ? [item.stepId] : [],
        horizon: 'today',
        scheduledDate: null,
        order: item.order ?? index,
        addedBy: item.addedBy,
        addedAt: Date.now(),
        reason: item.reason as FocusQueueItem['reason'],
        completed: item.completed,
        completedAt: item.completedAt,
        lastInteractedAt: Date.now(),
        horizonEnteredAt: Date.now(),
        rolloverCount: 0,
      }));
    }
  }

  // Update currentView: dashboard → queue
  let currentView = state.currentView as string;
  if (currentView === 'dashboard') {
    currentView = 'queue';
  }

  // Update focusMode: stepId → currentStepId
  const oldFocusMode = state.focusMode as unknown as Record<string, unknown> | undefined;
  const focusMode = oldFocusMode ? {
    active: (oldFocusMode.active as boolean) ?? false,
    queueItemId: null as string | null,
    taskId: (oldFocusMode.taskId as string | null) ?? null,
    currentStepId: (oldFocusMode.stepId as string | null) ?? (oldFocusMode.currentStepId as string | null) ?? null,
    paused: (oldFocusMode.paused as boolean) ?? false,
    startTime: (oldFocusMode.startTime as number | null) ?? null,
    pausedTime: (oldFocusMode.pausedTime as number) ?? 0,
    pauseStartTime: (oldFocusMode.pauseStartTime as number | null) ?? null,
  } : undefined;

  return {
    ...state,
    schemaVersion: 2,
    tasks: migratedTasks,
    focusQueue,
    currentView: currentView as AppState['currentView'],
    focusMode,
    nudges: [],
    snoozedNudges: [],
    // Remove old fields
    dailyPlans: undefined,
    todayPlanId: undefined,
  };
}

/**
 * Migrate from v2 to v3 (Focus Queue redesign: horizon → todayLineIndex)
 */
function migrateToV3(state: Partial<AppState> & Record<string, unknown>): Partial<AppState> & Record<string, unknown> {
  const focusQueue = state.focusQueue as FocusQueue | undefined;

  if (!focusQueue || !focusQueue.items) {
    return {
      ...state,
      schemaVersion: 3,
      focusQueue: {
        items: [],
        todayLineIndex: 0,
        lastReviewedAt: Date.now(),
      },
    };
  }

  // Separate items by horizon
  const todayItems = focusQueue.items.filter((i) => (i as FocusQueueItem).horizon === 'today' && !i.completed);
  const weekItems = focusQueue.items.filter((i) => (i as FocusQueueItem).horizon === 'this_week' && !i.completed);
  const upcomingItems = focusQueue.items.filter((i) => (i as FocusQueueItem).horizon === 'upcoming' && !i.completed);
  const completedItems = focusQueue.items.filter((i) => i.completed);

  // Combine: today first, then week, then upcoming, then completed at the end
  const reorderedItems = [...todayItems, ...weekItems, ...upcomingItems, ...completedItems]
    .map((item, index) => ({
      ...item,
      order: index,
    }));

  return {
    ...state,
    schemaVersion: 3,
    focusQueue: {
      items: reorderedItems,
      todayLineIndex: todayItems.length, // Items 0..(todayLineIndex-1) are "for today"
      lastReviewedAt: focusQueue.lastReviewedAt || Date.now(),
    },
  };
}

/**
 * Migrate from v3 to v4 (Per-task staging: move staging to Task, add globalStaging)
 */
function migrateToV4(state: Partial<AppState> & Record<string, unknown>): Partial<AppState> & Record<string, unknown> {
  // Add staging: null to all tasks
  const tasks = ((state.tasks as Task[]) || []).map((task) => ({
    ...task,
    staging: task.staging ?? null,
  }));

  return {
    ...state,
    schemaVersion: 4,
    tasks,
    // Replace old staging fields with globalStaging: null
    globalStaging: null,
    // Remove old fields (they'll be undefined/ignored)
    suggestions: undefined,
    edits: undefined,
    deletions: undefined,
    suggestedTitle: undefined,
    pendingAction: undefined,
  };
}

/**
 * Migrate from v4 to v5 (selectionType: 'entire_task' → 'all_today')
 */
function migrateToV5(state: Partial<AppState> & Record<string, unknown>): Partial<AppState> & Record<string, unknown> {
  const focusQueue = state.focusQueue as FocusQueue | undefined;

  if (!focusQueue || !focusQueue.items) {
    return {
      ...state,
      schemaVersion: 5,
    };
  }

  // Convert 'entire_task' to 'all_today' for existing items
  // Cast to string for comparison since 'entire_task' may exist in old data but not in new type
  const migratedItems = focusQueue.items.map((item) => ({
    ...item,
    selectionType: (item.selectionType as string) === 'entire_task' ? 'all_today' : item.selectionType,
  }));

  return {
    ...state,
    schemaVersion: 5,
    focusQueue: {
      ...focusQueue,
      items: migratedItems,
    },
  };
}

/**
 * Migrate from v5 to v6 (Fix Upcoming items to have selectionType: 'all_upcoming')
 * Items positioned after todayLineIndex should have 'all_upcoming', not 'all_today'
 */
function migrateToV6(state: Partial<AppState> & Record<string, unknown>): Partial<AppState> & Record<string, unknown> {
  const focusQueue = state.focusQueue as FocusQueue | undefined;

  if (!focusQueue || !focusQueue.items) {
    return {
      ...state,
      schemaVersion: 6,
    };
  }

  const todayLineIndex = focusQueue.todayLineIndex ?? 0;

  // Fix items in Upcoming position (index >= todayLineIndex) that have 'all_today'
  // Active items only (not completed)
  const activeItems = focusQueue.items.filter((i) => !i.completed);
  const completedItems = focusQueue.items.filter((i) => i.completed);

  const migratedActiveItems = activeItems.map((item, index) => {
    // Items at or after todayLineIndex should be 'all_upcoming' if they were 'all_today'
    if (index >= todayLineIndex && item.selectionType === 'all_today') {
      return {
        ...item,
        selectionType: 'all_upcoming' as const,
      };
    }
    return item;
  });

  return {
    ...state,
    schemaVersion: 6,
    focusQueue: {
      ...focusQueue,
      items: [...migratedActiveItems, ...completedItems],
    },
  };
}

/**
 * Migrate from v6 to v7 (Add queue messages with 48h retention)
 */
function migrateToV7(state: Partial<AppState> & Record<string, unknown>): Partial<AppState> & Record<string, unknown> {
  return {
    ...state,
    schemaVersion: 7,
    queueMessages: [],
    queueLastInteractionAt: null,
  };
}

/**
 * Migrate from v7 to v8 (Add reminder field to tasks)
 */
function migrateToV8(state: Partial<AppState> & Record<string, unknown>): Partial<AppState> & Record<string, unknown> {
  const tasks = ((state.tasks as Task[]) || []).map((task) => ({
    ...task,
    reminder: task.reminder ?? null,
  }));

  return {
    ...state,
    schemaVersion: 8,
    tasks,
  };
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
      source: 'ai_generated' as const,
      wasEdited: false,
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
      skipped: false,
      source: 'ai_generated' as const,
    };
  });
}

/**
 * Ensure state has all required fields (Model E)
 */
function ensureCompleteState(partial: Partial<AppState> & Record<string, unknown>): AppState {
  const initial = createInitialAppState();

  // Ensure each task has all required fields
  const migratedTasks = (partial.tasks ?? initial.tasks).map((task) => ({
    ...task,
    // Notes field
    notes: task.notes ?? null,
    // Model E fields
    completionType: task.completionType ?? 'step_based',
    archivedReason: task.archivedReason ?? null,
    waitingOn: task.waitingOn ?? null,
    deferredUntil: task.deferredUntil ?? null,
    deferredAt: task.deferredAt ?? null,
    deferredCount: task.deferredCount ?? 0,
    // Per-task messages
    messages: task.messages ?? [],
    focusModeMessages: task.focusModeMessages ?? [],
    // Per-task staging
    staging: task.staging ?? null,
    // Reminder (v8)
    reminder: task.reminder ?? null,
    // Ensure steps have Model E fields
    steps: task.steps.map((step) => ({
      ...step,
      effort: step.effort ?? null,
      estimateSource: step.estimateSource ?? null,
      firstFocusedAt: step.firstFocusedAt ?? null,
      estimationAccuracy: step.estimationAccuracy ?? null,
      context: step.context ?? null,
    })),
  }));

  // Ensure focusQueue exists with todayLineIndex
  const partialQueue = partial.focusQueue ?? initial.focusQueue;
  const focusQueue: FocusQueue = {
    items: partialQueue.items ?? [],
    todayLineIndex: partialQueue.todayLineIndex ?? 0,
    lastReviewedAt: partialQueue.lastReviewedAt ?? Date.now(),
  };

  // Ensure focusMode has queueItemId and currentStepId
  const focusMode = partial.focusMode ?? initial.focusMode;

  // Ensure filters have Model E fields
  const filters = {
    ...initial.filters,
    ...partial.filters,
    showWaitingOn: partial.filters?.showWaitingOn ?? true,
    showDeferred: partial.filters?.showDeferred ?? false,
  };

  // Queue messages: apply 48h retention cleanup on load
  const QUEUE_MESSAGE_RETENTION_MS = 48 * 60 * 60 * 1000; // 48 hours
  const queueMessageCutoff = Date.now() - QUEUE_MESSAGE_RETENTION_MS;
  const rawQueueMessages = (partial.queueMessages as AppState['queueMessages']) ?? [];
  const queueMessages = rawQueueMessages.filter(m => m.timestamp > queueMessageCutoff);

  return {
    schemaVersion: SCHEMA_VERSION,
    currentUser: partial.currentUser ?? initial.currentUser,
    tasks: migratedTasks,
    projects: partial.projects ?? initial.projects,
    focusQueue,
    events: partial.events ?? initial.events,
    focusSessions: partial.focusSessions ?? initial.focusSessions,
    nudges: partial.nudges ?? initial.nudges,
    snoozedNudges: partial.snoozedNudges ?? initial.snoozedNudges,
    analytics: partial.analytics ?? initial.analytics,
    currentView: (partial.currentView as AppState['currentView']) ?? initial.currentView,
    activeTaskId: partial.activeTaskId ?? initial.activeTaskId,
    focusMode: {
      active: focusMode.active ?? false,
      queueItemId: focusMode.queueItemId ?? null,
      taskId: focusMode.taskId ?? null,
      currentStepId: focusMode.currentStepId ?? null,
      paused: focusMode.paused ?? false,
      startTime: focusMode.startTime ?? null,
      pausedTime: focusMode.pausedTime ?? 0,
      pauseStartTime: focusMode.pauseStartTime ?? null,
    },
    currentSessionId: partial.currentSessionId ?? initial.currentSessionId,
    globalStaging: partial.globalStaging ?? initial.globalStaging,
    queueMessages,
    queueLastInteractionAt: (partial.queueLastInteractionAt as number | null) ?? null,
    tasksMessages: (partial.tasksMessages as typeof initial.tasksMessages) ?? [],
    tasksLastInteractionAt: (partial.tasksLastInteractionAt as number | null) ?? null,
    filters,
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
  localStorage.removeItem(STORAGE_KEYS.nudges);
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
  const { nudges, snoozedNudges } = loadNudges();

  return JSON.stringify(
    {
      exportedAt: Date.now(),
      schemaVersion: SCHEMA_VERSION,
      state,
      events,
      sessions,
      nudges,
      snoozedNudges,
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

    if (data.nudges || data.snoozedNudges) {
      saveNudges(data.nudges || [], data.snoozedNudges || []);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
