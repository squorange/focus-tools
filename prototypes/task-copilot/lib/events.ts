import {
  Event,
  EventType,
  EventContext,
  generateId,
  Task,
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
 * Log an event
 */
export function logEvent(
  type: EventType,
  options: {
    taskId?: string | null;
    stepId?: string | null;
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
// Convenience Event Loggers
// ============================================

/**
 * Log task created event
 */
export function logTaskCreated(
  task: Task,
  tasks: Task[]
): Event {
  return logEvent('task_created', {
    taskId: task.id,
    data: {
      title: task.title,
      source: task.source,
    },
    tasks,
  });
}

/**
 * Log task updated event
 */
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

/**
 * Log task completed event
 */
export function logTaskCompleted(
  task: Task,
  tasks: Task[]
): Event {
  return logEvent('task_completed', {
    taskId: task.id,
    data: {
      title: task.title,
      stepsCompleted: task.steps.filter((s) => s.completed).length,
      totalSteps: task.steps.length,
      totalTimeSpent: task.totalTimeSpent,
      daysFromTarget: task.daysFromTarget,
      daysFromDeadline: task.daysFromDeadline,
    },
    tasks,
  });
}

/**
 * Log task archived event
 */
export function logTaskArchived(taskId: string, tasks: Task[]): Event {
  return logEvent('task_archived', {
    taskId,
    tasks,
  });
}

/**
 * Log task deleted event
 */
export function logTaskDeleted(taskId: string, tasks: Task[]): Event {
  return logEvent('task_deleted', {
    taskId,
    tasks,
  });
}

/**
 * Log task restored event
 */
export function logTaskRestored(taskId: string, tasks: Task[]): Event {
  return logEvent('task_restored', {
    taskId,
    tasks,
  });
}

/**
 * Log step created event
 */
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

/**
 * Log step completed event
 */
export function logStepCompleted(
  taskId: string,
  stepId: string,
  tasks: Task[]
): Event {
  return logEvent('step_completed', {
    taskId,
    stepId,
    tasks,
  });
}

/**
 * Log step uncompleted event
 */
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

/**
 * Log substep completed event
 */
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

/**
 * Log focus started event
 */
export function logFocusStarted(
  taskId: string,
  stepId: string | null,
  sessionId: string,
  tasks: Task[],
  focusSessionsToday: number
): Event {
  return logEvent('focus_started', {
    taskId,
    stepId,
    data: { sessionId },
    tasks,
    focusSessionsToday,
  });
}

/**
 * Log focus paused event
 */
export function logFocusPaused(
  taskId: string,
  sessionId: string,
  elapsedMinutes: number,
  tasks: Task[]
): Event {
  return logEvent('focus_paused', {
    taskId,
    data: { sessionId, elapsedMinutes },
    tasks,
  });
}

/**
 * Log focus resumed event
 */
export function logFocusResumed(
  taskId: string,
  sessionId: string,
  tasks: Task[]
): Event {
  return logEvent('focus_resumed', {
    taskId,
    data: { sessionId },
    tasks,
  });
}

/**
 * Log focus ended event
 */
export function logFocusEnded(
  taskId: string,
  sessionId: string,
  totalMinutes: number,
  stepsCompleted: number,
  outcome: 'completed_task' | 'made_progress' | 'no_progress' | 'abandoned',
  tasks: Task[]
): Event {
  return logEvent('focus_ended', {
    taskId,
    data: {
      sessionId,
      totalMinutes,
      stepsCompleted,
      outcome,
    },
    tasks,
  });
}

/**
 * Log stuck reported event
 */
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

/**
 * Log stuck resolved event
 */
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

/**
 * Log AI breakdown requested event
 */
export function logAIBreakdownRequested(taskId: string, tasks: Task[]): Event {
  return logEvent('ai_breakdown_requested', {
    taskId,
    tasks,
  });
}

/**
 * Log AI breakdown accepted event
 */
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

/**
 * Log AI breakdown rejected event
 */
export function logAIBreakdownRejected(taskId: string, tasks: Task[]): Event {
  return logEvent('ai_breakdown_rejected', {
    taskId,
    tasks,
  });
}

/**
 * Log AI help requested event
 */
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

/**
 * Log priority changed event
 */
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

/**
 * Log date changed event
 */
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

/**
 * Log task deferred event
 */
export function logTaskDeferred(
  taskId: string,
  deferredTo: string | null,
  tasks: Task[]
): Event {
  return logEvent('task_deferred', {
    taskId,
    data: { deferredTo },
    tasks,
  });
}

// ============================================
// Query Events
// ============================================

/**
 * Get events for a specific task
 */
export function getEventsForTask(taskId: string): Event[] {
  return getEvents().filter((e) => e.taskId === taskId);
}

/**
 * Get events of a specific type
 */
export function getEventsByType(type: EventType): Event[] {
  return getEvents().filter((e) => e.type === type);
}

/**
 * Get events from today
 */
export function getEventsToday(): Event[] {
  const today = getTodayISO();
  return getEvents().filter((e) => {
    const eventDate = new Date(e.timestamp).toISOString().split('T')[0];
    return eventDate === today;
  });
}

/**
 * Count focus sessions today
 */
export function countFocusSessionsToday(): number {
  return getEventsToday().filter((e) => e.type === 'focus_started').length;
}

// ============================================
// Clear Events
// ============================================

/**
 * Clear all events (for testing)
 */
export function clearEvents(): void {
  eventsCache = [];
  saveEvents([]);
}
