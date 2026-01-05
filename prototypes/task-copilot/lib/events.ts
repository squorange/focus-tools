import {
  Event,
  EventType,
  EventContext,
  generateId,
  Task,
  FocusQueueItem,
  SessionOutcome,
} from './types';
import { getTimeOfDay, isMobileDevice, getTodayISO } from './utils';
import { saveEvents, loadEvents } from './storage';

// ============================================
// Event Logging
// ============================================

// In-memory event cache for the current session
let eventsCache: Event[] | null = null;

/**
 * Get all events (loads from storage if needed)
 */
export function getEvents(): Event[] {
  if (eventsCache === null) {
    eventsCache = loadEvents();
  }
  return eventsCache;
}

/**
 * Log an event (Model E: includes queueItemId)
 */
export function logEvent(
  type: EventType,
  options: {
    taskId?: string | null;
    stepId?: string | null;
    queueItemId?: string | null;
    data?: Record<string, unknown>;
    tasks?: Task[];
    focusSessionsToday?: number;
  } = {}
): Event {
  const events = getEvents();

  const event: Event = {
    id: generateId(),
    timestamp: Date.now(),
    type,
    taskId: options.taskId ?? null,
    stepId: options.stepId ?? null,
    queueItemId: options.queueItemId ?? null,
    data: options.data ?? {},
    context: getCurrentContext(options.tasks, options.focusSessionsToday),
  };

  events.push(event);
  eventsCache = events;
  saveEvents(events);

  return event;
}

/**
 * Get current context for event
 */
export function getCurrentContext(
  tasks?: Task[],
  focusSessionsToday?: number
): EventContext {
  const today = getTodayISO();
  const tasksCompletedToday = tasks
    ? tasks.filter(
        (t) =>
          t.status === 'complete' &&
          t.completedAt &&
          new Date(t.completedAt).toISOString().split('T')[0] === today
      ).length
    : 0;

  return {
    timeOfDay: getTimeOfDay(),
    dayOfWeek: new Date().getDay(),
    energyLevel: null, // User-reported, not implemented yet
    sessionDuration: null, // Updated during focus session
    tasksCompletedToday,
    focusSessionsToday: focusSessionsToday ?? 0,
    device: isMobileDevice() ? 'mobile' : 'desktop',
  };
}

// ============================================
// Task Lifecycle Events
// ============================================

export function logTaskCreated(task: Task, tasks: Task[]): Event {
  return logEvent('task_created', {
    taskId: task.id,
    data: {
      title: task.title,
      source: task.source,
    },
    tasks,
  });
}

export function logTaskUpdated(
  taskId: string,
  changes: Record<string, unknown>,
  tasks: Task[]
): Event {
  return logEvent('task_updated', {
    taskId,
    data: { changes },
    tasks,
  });
}

export function logTaskCompleted(task: Task, tasks: Task[]): Event {
  return logEvent('task_completed', {
    taskId: task.id,
    data: {
      title: task.title,
      stepsCompleted: task.steps.filter((s) => s.completed).length,
      totalSteps: task.steps.length,
      totalTimeSpent: task.totalTimeSpent,
      daysFromTarget: task.daysFromTarget,
      daysFromDeadline: task.daysFromDeadline,
      completionType: task.completionType,
    },
    tasks,
  });
}

export function logTaskReopened(taskId: string, tasks: Task[]): Event {
  return logEvent('task_reopened', {
    taskId,
    tasks,
  });
}

export function logTaskArchived(
  taskId: string,
  reason: Task['archivedReason'],
  tasks: Task[]
): Event {
  return logEvent('task_archived', {
    taskId,
    data: { reason },
    tasks,
  });
}

export function logTaskRestored(taskId: string, tasks: Task[]): Event {
  return logEvent('task_restored', {
    taskId,
    tasks,
  });
}

export function logTaskDeleted(taskId: string, tasks: Task[]): Event {
  return logEvent('task_deleted', {
    taskId,
    tasks,
  });
}

// ============================================
// Step Events
// ============================================

export function logStepCreated(
  taskId: string,
  stepId: string,
  stepText: string,
  source: 'manual' | 'ai_generated' | 'ai_suggested',
  tasks: Task[]
): Event {
  return logEvent('step_created', {
    taskId,
    stepId,
    data: {
      text: stepText,
      source,
    },
    tasks,
  });
}

export function logStepCompleted(
  taskId: string,
  stepId: string,
  tasks: Task[],
  queueItemId?: string | null
): Event {
  return logEvent('step_completed', {
    taskId,
    stepId,
    queueItemId,
    tasks,
  });
}

export function logStepUncompleted(
  taskId: string,
  stepId: string,
  tasks: Task[]
): Event {
  return logEvent('step_uncompleted', {
    taskId,
    stepId,
    tasks,
  });
}

export function logSubstepCompleted(
  taskId: string,
  stepId: string,
  substepId: string,
  tasks: Task[]
): Event {
  return logEvent('substep_completed', {
    taskId,
    stepId,
    data: { substepId },
    tasks,
  });
}

// ============================================
// Focus Queue Events (Model E: new)
// ============================================

export function logQueueItemAdded(
  item: FocusQueueItem,
  task: Task,
  tasks: Task[]
): Event {
  return logEvent('queue_item_added', {
    taskId: item.taskId,
    queueItemId: item.id,
    data: {
      taskTitle: task.title,
      horizon: item.horizon,
      selectionType: item.selectionType,
      selectedStepIds: item.selectedStepIds,
      reason: item.reason,
    },
    tasks,
  });
}

export function logQueueItemRemoved(
  item: FocusQueueItem,
  tasks: Task[]
): Event {
  return logEvent('queue_item_removed', {
    taskId: item.taskId,
    queueItemId: item.id,
    data: {
      horizon: item.horizon,
    },
    tasks,
  });
}

export function logQueueItemCompleted(
  item: FocusQueueItem,
  tasks: Task[]
): Event {
  return logEvent('queue_item_completed', {
    taskId: item.taskId,
    queueItemId: item.id,
    data: {
      horizon: item.horizon,
      selectionType: item.selectionType,
    },
    tasks,
  });
}

export function logQueueHorizonChanged(
  item: FocusQueueItem,
  oldHorizon: FocusQueueItem['horizon'],
  newHorizon: FocusQueueItem['horizon'],
  tasks: Task[]
): Event {
  return logEvent('queue_horizon_changed', {
    taskId: item.taskId,
    queueItemId: item.id,
    data: {
      oldHorizon,
      newHorizon,
    },
    tasks,
  });
}

export function logQueueSelectionChanged(
  item: FocusQueueItem,
  oldSelection: { type: string; stepIds: string[] },
  newSelection: { type: string; stepIds: string[] },
  tasks: Task[]
): Event {
  return logEvent('queue_selection_changed', {
    taskId: item.taskId,
    queueItemId: item.id,
    data: {
      oldSelection,
      newSelection,
    },
    tasks,
  });
}

export function logQueueItemRolledOver(
  item: FocusQueueItem,
  tasks: Task[]
): Event {
  return logEvent('queue_item_rolled_over', {
    taskId: item.taskId,
    queueItemId: item.id,
    data: {
      rolloverCount: item.rolloverCount,
    },
    tasks,
  });
}

// ============================================
// Focus Session Events
// ============================================

export function logFocusStarted(
  taskId: string,
  stepId: string | null,
  sessionId: string,
  tasks: Task[],
  focusSessionsToday: number,
  queueItemId?: string | null
): Event {
  return logEvent('focus_started', {
    taskId,
    stepId,
    queueItemId,
    data: { sessionId },
    tasks,
    focusSessionsToday,
  });
}

export function logFocusPaused(
  taskId: string,
  sessionId: string,
  elapsedMinutes: number,
  tasks: Task[],
  queueItemId?: string | null
): Event {
  return logEvent('focus_paused', {
    taskId,
    queueItemId,
    data: { sessionId, elapsedMinutes },
    tasks,
  });
}

export function logFocusResumed(
  taskId: string,
  sessionId: string,
  tasks: Task[],
  queueItemId?: string | null
): Event {
  return logEvent('focus_resumed', {
    taskId,
    queueItemId,
    data: { sessionId },
    tasks,
  });
}

export function logFocusEnded(
  taskId: string,
  sessionId: string,
  totalMinutes: number,
  stepsCompleted: number,
  outcome: SessionOutcome,
  tasks: Task[],
  queueItemId?: string | null
): Event {
  return logEvent('focus_ended', {
    taskId,
    queueItemId,
    data: {
      sessionId,
      totalMinutes,
      stepsCompleted,
      outcome,
    },
    tasks,
  });
}

// ============================================
// Stuck Events
// ============================================

export function logStuckReported(
  taskId: string,
  stepId: string,
  tasks: Task[]
): Event {
  return logEvent('stuck_reported', {
    taskId,
    stepId,
    tasks,
  });
}

export function logStuckResolved(
  taskId: string,
  stepId: string,
  resolution: 'broke_down' | 'skipped' | 'talked_through' | 'took_break' | 'other',
  timeToResolveMinutes: number,
  resultedInCompletion: boolean,
  tasks: Task[]
): Event {
  return logEvent('stuck_resolved', {
    taskId,
    stepId,
    data: {
      resolution,
      timeToResolveMinutes,
      resultedInCompletion,
    },
    tasks,
  });
}

// ============================================
// AI Events
// ============================================

export function logAIBreakdownRequested(taskId: string, tasks: Task[]): Event {
  return logEvent('ai_breakdown_requested', {
    taskId,
    tasks,
  });
}

export function logAIBreakdownAccepted(
  taskId: string,
  stepsGenerated: number,
  tasks: Task[]
): Event {
  return logEvent('ai_breakdown_accepted', {
    taskId,
    data: { stepsGenerated },
    tasks,
  });
}

export function logAIBreakdownRejected(taskId: string, tasks: Task[]): Event {
  return logEvent('ai_breakdown_rejected', {
    taskId,
    tasks,
  });
}

export function logAIHelpRequested(
  taskId: string | null,
  stepId: string | null,
  message: string,
  tasks: Task[]
): Event {
  return logEvent('ai_help_requested', {
    taskId,
    stepId,
    data: { messagePreview: message.substring(0, 100) },
    tasks,
  });
}

// ============================================
// Deferral & Waiting Events (Model E: new)
// ============================================

export function logTaskDeferred(
  taskId: string,
  deferredUntil: string | null,
  deferredCount: number,
  tasks: Task[]
): Event {
  return logEvent('task_deferred', {
    taskId,
    data: { deferredUntil, deferredCount },
    tasks,
  });
}

export function logTaskResurfaced(taskId: string, tasks: Task[]): Event {
  return logEvent('task_resurfaced', {
    taskId,
    tasks,
  });
}

export function logWaitingOnSet(
  taskId: string,
  who: string,
  followUpDate: string | null,
  tasks: Task[]
): Event {
  return logEvent('waiting_on_set', {
    taskId,
    data: { who, followUpDate },
    tasks,
  });
}

export function logWaitingOnCleared(taskId: string, tasks: Task[]): Event {
  return logEvent('waiting_on_cleared', {
    taskId,
    tasks,
  });
}

// ============================================
// Nudge Events (Model E: new)
// ============================================

export function logNudgeShown(
  nudgeId: string,
  nudgeType: string,
  targetId: string,
  tasks: Task[]
): Event {
  return logEvent('nudge_shown', {
    taskId: targetId,
    data: { nudgeId, nudgeType },
    tasks,
  });
}

export function logNudgeDismissed(
  nudgeId: string,
  nudgeType: string,
  targetId: string,
  tasks: Task[]
): Event {
  return logEvent('nudge_dismissed', {
    taskId: targetId,
    data: { nudgeId, nudgeType },
    tasks,
  });
}

export function logNudgeSnoozed(
  nudgeId: string,
  nudgeType: string,
  targetId: string,
  snoozeUntil: number,
  tasks: Task[]
): Event {
  return logEvent('nudge_snoozed', {
    taskId: targetId,
    data: { nudgeId, nudgeType, snoozeUntil },
    tasks,
  });
}

export function logNudgeActioned(
  nudgeId: string,
  nudgeType: string,
  targetId: string,
  action: string,
  tasks: Task[]
): Event {
  return logEvent('nudge_actioned', {
    taskId: targetId,
    data: { nudgeId, nudgeType, action },
    tasks,
  });
}

// ============================================
// Other Events
// ============================================

export function logPriorityChanged(
  taskId: string,
  oldPriority: string | null,
  newPriority: string | null,
  tasks: Task[]
): Event {
  return logEvent('priority_changed', {
    taskId,
    data: { oldPriority, newPriority },
    tasks,
  });
}

export function logDateChanged(
  taskId: string,
  dateType: 'targetDate' | 'deadlineDate',
  oldDate: string | null,
  newDate: string | null,
  tasks: Task[]
): Event {
  return logEvent('date_changed', {
    taskId,
    data: { dateType, oldDate, newDate },
    tasks,
  });
}

export function logEstimateSet(
  taskId: string,
  stepId: string | null,
  minutes: number,
  source: 'user' | 'ai',
  tasks: Task[]
): Event {
  return logEvent('estimate_set', {
    taskId,
    stepId,
    data: { minutes, source },
    tasks,
  });
}

export function logEstimateUpdated(
  taskId: string,
  stepId: string | null,
  oldMinutes: number | null,
  newMinutes: number,
  tasks: Task[]
): Event {
  return logEvent('estimate_updated', {
    taskId,
    stepId,
    data: { oldMinutes, newMinutes },
    tasks,
  });
}

// ============================================
// Query Events
// ============================================

export function getEventsForTask(taskId: string): Event[] {
  return getEvents().filter((e) => e.taskId === taskId);
}

export function getEventsForQueueItem(queueItemId: string): Event[] {
  return getEvents().filter((e) => e.queueItemId === queueItemId);
}

export function getEventsByType(type: EventType): Event[] {
  return getEvents().filter((e) => e.type === type);
}

export function getEventsToday(): Event[] {
  const today = getTodayISO();
  return getEvents().filter((e) => {
    const eventDate = new Date(e.timestamp).toISOString().split('T')[0];
    return eventDate === today;
  });
}

export function countFocusSessionsToday(): number {
  return getEventsToday().filter((e) => e.type === 'focus_started').length;
}

// ============================================
// Clear Events
// ============================================

export function clearEvents(): void {
  eventsCache = [];
  saveEvents([]);
}
