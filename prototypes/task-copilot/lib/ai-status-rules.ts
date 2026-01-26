/**
 * AI Status Rules Registry
 *
 * Provides adaptive, insight-based status for the MiniBar.
 * Rules are evaluated in priority order (highest first).
 *
 * Debug: In development, logs which rule matched to console.
 */

import { Task, AppState, FocusQueueItem } from './types';
import { CollapsedContent, AIAssistantContext } from './ai-types';
import { RecurrenceRuleExtended } from './recurring-types';
import {
  getTodayISO,
  daysBetween,
  isOverdue as isTaskOverdue,
  isDueToday as isTaskDueToday,
  hasResurfaced,
} from './utils';
import {
  filterDueToday as filterRoutinesDueToday,
  getActiveOccurrenceDate,
  describePattern,
  filterRecurringTasks,
} from './recurring-utils';

// ============================================
// Types
// ============================================

export interface StatusRule {
  id: string;
  priority: number;  // Higher = checked first
  condition: (ctx: StatusContext) => boolean;
  getText: (ctx: StatusContext) => string;
}

export interface StatusContext {
  // Queue metrics
  todayCount: number;
  upcomingCount: number;
  completedTodayCount: number;
  todayEstimateMinutes: number;
  deadlineTodayCount: number;
  deadlineTomorrowCount: number;
  overdueCount: number;
  quickWinCount: number;
  waitingCount: number;

  // Task metrics (for taskDetail context)
  task: Task | null;
  stepCount: number;
  completedStepCount: number;
  remainingMinutes: number;

  // Focus Mode metrics
  currentStepIndex: number;
  totalSteps: number;
  currentStepMinutes: number;
  substepsDone: number;
  substepsTotal: number;

  // Inbox metrics
  inboxCount: number;
  oldestInboxDays: number;
  oldestInboxTitle: string;

  // Pool metrics
  poolCount: number;
  resurfacedCount: number;

  // Routine metrics (for recurring tasks)
  routineDueTodayCount: number;
  overdueRoutineCount: number;
  oldestOverdueRoutine: {
    taskId: string;
    title: string;
    overdueDays: number;
  } | null;
  streakMilestoneRoutine: {
    taskId: string;
    title: string;
    currentStreak: number;
    bestStreak: number;
    nearBest: boolean;  // streak === bestStreak - 1
  } | null;
  upcomingRoutine: {
    taskId: string;
    title: string;
    scheduledTime: string;
    minutesUntil: number;
  } | null;
  currentRoutine: {
    streak: number;
    bestStreak: number;
    isOverdue: boolean;
    overdueDays: number | null;
    scheduledTime: string | null;
    patternDescription: string;
    nearBest: boolean;
  } | null;
}

// ============================================
// Helper Functions
// ============================================

function getDaysOverdue(task: Task | null): number {
  if (!task?.deadlineDate) return 0;
  const days = daysBetween(task.deadlineDate, getTodayISO());
  return Math.max(0, days);
}

function getDaysUntilDue(task: Task | null): number {
  if (!task?.deadlineDate) return 999;
  const days = daysBetween(getTodayISO(), task.deadlineDate);
  return Math.max(0, days);
}

function isDueSoon(task: Task | null, withinDays: number): boolean {
  if (!task?.deadlineDate) return false;
  const days = getDaysUntilDue(task);
  return days > 0 && days <= withinDays;
}

function formatCompletedDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================
// Rules by Context
// ============================================

const QUEUE_RULES: StatusRule[] = [
  {
    id: 'overdue',
    priority: 100,
    condition: ctx => ctx.overdueCount > 0,
    getText: ctx => `${ctx.overdueCount} overdue`
  },
  {
    id: 'deadline-today',
    priority: 95,
    condition: ctx => ctx.deadlineTodayCount > 0,
    getText: ctx => `${ctx.deadlineTodayCount} deadline${ctx.deadlineTodayCount > 1 ? 's' : ''} today`
  },
  {
    id: 'deadline-tomorrow',
    priority: 90,
    condition: ctx => ctx.deadlineTomorrowCount > 0,
    getText: ctx => `${ctx.deadlineTomorrowCount} due tomorrow`
  },
  {
    id: 'all-done-today',
    priority: 70,
    condition: ctx => ctx.todayCount === 0 && ctx.completedTodayCount > 0,
    getText: () => 'Today complete'
  },
  {
    id: 'time-estimate',
    priority: 60,
    condition: ctx => ctx.todayEstimateMinutes > 0 && ctx.todayCount > 0,
    getText: ctx => `~${ctx.todayEstimateMinutes} min for today`
  },
  {
    id: 'quick-wins',
    priority: 50,
    condition: ctx => ctx.quickWinCount >= 2,
    getText: ctx => `${ctx.quickWinCount} quick wins`
  },
  {
    id: 'waiting-count',
    priority: 40,
    condition: ctx => ctx.waitingCount > 0,
    getText: ctx => `${ctx.waitingCount} waiting`
  },
  {
    id: 'today-count',
    priority: 20,
    condition: ctx => ctx.todayCount > 0,
    getText: ctx => `${ctx.todayCount} for today`
  },
  {
    id: 'upcoming-only',
    priority: 15,
    condition: ctx => ctx.upcomingCount > 0,
    getText: ctx => `${ctx.upcomingCount} upcoming`
  },
  {
    id: 'empty',
    priority: 0,
    condition: () => true,
    getText: () => 'Queue empty'
  },
];

const TASK_DETAIL_RULES: StatusRule[] = [
  {
    id: 'completed',
    priority: 100,
    condition: ctx => ctx.task?.completedAt != null,
    getText: ctx => `Completed ${formatCompletedDate(ctx.task!.completedAt!)}`
  },
  {
    id: 'overdue',
    priority: 95,
    condition: ctx => ctx.task != null && isTaskOverdue(ctx.task),
    getText: ctx => {
      const days = getDaysOverdue(ctx.task);
      return days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`;
    }
  },
  {
    id: 'due-today',
    priority: 90,
    condition: ctx => ctx.task != null && isTaskDueToday(ctx.task),
    getText: () => 'Due today'
  },
  {
    id: 'due-soon',
    priority: 85,
    condition: ctx => isDueSoon(ctx.task, 3),
    getText: ctx => {
      const days = getDaysUntilDue(ctx.task);
      return days === 1 ? 'Due tomorrow' : `Due in ${days} days`;
    }
  },
  {
    id: 'waiting-on',
    priority: 70,
    condition: ctx => ctx.task?.waitingOn != null,
    getText: ctx => `Waiting on ${ctx.task!.waitingOn!.who}`
  },
  {
    id: 'time-remaining',
    priority: 60,
    condition: ctx => ctx.remainingMinutes > 0,
    getText: ctx => `~${ctx.remainingMinutes} min left`
  },
  {
    id: 'nearly-done',
    priority: 50,
    condition: ctx => ctx.stepCount > 0 && ctx.completedStepCount / ctx.stepCount >= 0.8,
    getText: ctx => `Almost done (${ctx.completedStepCount}/${ctx.stepCount})`
  },
  {
    id: 'has-progress',
    priority: 30,
    condition: ctx => ctx.completedStepCount > 0,
    getText: ctx => `${ctx.completedStepCount}/${ctx.stepCount} steps`
  },
  {
    id: 'no-steps',
    priority: 20,
    condition: ctx => ctx.stepCount === 0,
    getText: () => 'No steps yet'
  },
  {
    id: 'has-steps',
    priority: 10,
    condition: ctx => ctx.stepCount > 0,
    getText: ctx => `0/${ctx.stepCount} steps`
  },
];

const FOCUS_MODE_RULES: StatusRule[] = [
  {
    id: 'last-step',
    priority: 100,
    condition: ctx => ctx.totalSteps > 0 && ctx.currentStepIndex === ctx.totalSteps - 1,
    getText: () => 'Final step!'
  },
  {
    id: 'almost-done',
    priority: 90,
    condition: ctx => ctx.totalSteps > 1 && (ctx.currentStepIndex + 1) / ctx.totalSteps >= 0.8,
    getText: () => 'Almost there!'
  },
  {
    id: 'long-on-step',
    priority: 80,
    condition: ctx => ctx.currentStepMinutes >= 5,
    getText: ctx => `${ctx.currentStepMinutes} min on this step`
  },
  {
    id: 'substep-progress',
    priority: 70,
    condition: ctx => ctx.substepsTotal > 0,
    getText: ctx => `${ctx.substepsDone}/${ctx.substepsTotal} substeps`
  },
  {
    id: 'step-progress',
    priority: 30,
    condition: ctx => ctx.totalSteps > 0,
    getText: ctx => `Step ${ctx.currentStepIndex + 1} of ${ctx.totalSteps}`
  },
  {
    id: 'fallback',
    priority: 0,
    condition: () => true,
    getText: () => 'Focus mode'
  },
];

const INBOX_RULES: StatusRule[] = [
  {
    id: 'piling-up',
    priority: 90,
    condition: ctx => ctx.inboxCount >= 7,
    getText: ctx => `${ctx.inboxCount} items piling up`
  },
  {
    id: 'old-items',
    priority: 80,
    condition: ctx => ctx.oldestInboxDays >= 5,
    getText: ctx => {
      const title = ctx.oldestInboxTitle.length > 18
        ? ctx.oldestInboxTitle.slice(0, 18) + '…'
        : ctx.oldestInboxTitle;
      return `"${title}" — ${ctx.oldestInboxDays}d in inbox`;
    }
  },
  {
    id: 'has-items',
    priority: 40,
    condition: ctx => ctx.inboxCount > 0,
    getText: ctx => `${ctx.inboxCount} to triage`
  },
  {
    id: 'empty',
    priority: 0,
    condition: () => true,
    getText: () => 'Inbox clear'
  },
];

const POOL_RULES: StatusRule[] = [
  {
    id: 'resurfaced',
    priority: 80,
    condition: ctx => ctx.resurfacedCount > 0,
    getText: ctx => `${ctx.resurfacedCount} resurfaced`
  },
  {
    id: 'has-tasks',
    priority: 50,
    condition: ctx => ctx.poolCount > 0,
    getText: ctx => `${ctx.poolCount} tasks ready`
  },
  {
    id: 'empty',
    priority: 0,
    condition: () => true,
    getText: () => 'Pool empty'
  },
];

// ============================================
// Routine-Specific Rules
// ============================================

const ROUTINE_QUEUE_RULES: StatusRule[] = [
  {
    id: 'routine-overdue-critical',
    priority: 110,
    condition: ctx => ctx.oldestOverdueRoutine !== null && ctx.oldestOverdueRoutine.overdueDays >= 3,
    getText: ctx => `${ctx.oldestOverdueRoutine!.title} is ${ctx.oldestOverdueRoutine!.overdueDays}d overdue`
  },
  {
    id: 'routine-streak-milestone',
    priority: 105,
    condition: ctx => ctx.streakMilestoneRoutine !== null,
    getText: ctx => `${ctx.streakMilestoneRoutine!.title}: 1 from best!`
  },
  {
    id: 'routine-time-window',
    priority: 85,
    condition: ctx => ctx.upcomingRoutine !== null && ctx.upcomingRoutine.minutesUntil <= 30,
    getText: ctx => `${ctx.upcomingRoutine!.title} in ${ctx.upcomingRoutine!.minutesUntil} min`
  },
  {
    id: 'routine-overdue',
    priority: 80,
    condition: ctx => ctx.overdueRoutineCount > 0,
    getText: ctx => ctx.overdueRoutineCount === 1
      ? `${ctx.oldestOverdueRoutine?.title || 'Routine'} overdue`
      : `${ctx.overdueRoutineCount} routines overdue`
  },
  {
    id: 'routine-due-today',
    priority: 65,
    condition: ctx => ctx.routineDueTodayCount > 0,
    getText: ctx => `${ctx.routineDueTodayCount} routine${ctx.routineDueTodayCount > 1 ? 's' : ''} due`
  },
];

const ROUTINE_TASK_DETAIL_RULES: StatusRule[] = [
  {
    id: 'routine-streak-achieved',
    priority: 105,
    condition: ctx => ctx.currentRoutine !== null && ctx.currentRoutine.streak === ctx.currentRoutine.bestStreak && ctx.currentRoutine.streak > 1,
    getText: ctx => `New best: ${ctx.currentRoutine!.streak} streak!`
  },
  {
    id: 'routine-overdue',
    priority: 100,
    condition: ctx => ctx.currentRoutine?.isOverdue === true,
    getText: ctx => {
      const days = ctx.currentRoutine!.overdueDays || 1;
      return days === 1 ? 'Routine overdue 1 day' : `Routine overdue ${days} days`;
    }
  },
  {
    id: 'routine-streak-near-best',
    priority: 75,
    condition: ctx => ctx.currentRoutine?.nearBest === true,
    getText: ctx => `${ctx.currentRoutine!.streak} streak (1 from best!)`
  },
  {
    id: 'routine-streak',
    priority: 55,
    condition: ctx => (ctx.currentRoutine?.streak ?? 0) > 0,
    getText: ctx => `${ctx.currentRoutine!.streak} streak`
  },
  {
    id: 'routine-start-streak',
    priority: 45,
    condition: ctx => ctx.currentRoutine !== null && (ctx.currentRoutine.streak ?? 0) === 0,
    getText: () => 'Start your streak today'
  },
];

const ROUTINE_FOCUS_MODE_RULES: StatusRule[] = [
  {
    id: 'routine-streak-motivation',
    priority: 85,
    condition: ctx => ctx.currentRoutine?.nearBest === true,
    getText: () => 'Complete for your best streak!'
  },
  {
    id: 'routine-streak-progress',
    priority: 65,
    condition: ctx => (ctx.currentRoutine?.streak ?? 0) >= 3,
    getText: ctx => `${ctx.currentRoutine!.streak} streak going strong`
  },
];

// Map context to rules
const STATUS_RULES: Record<string, StatusRule[]> = {
  queue: QUEUE_RULES,
  taskDetail: TASK_DETAIL_RULES,
  focusMode: FOCUS_MODE_RULES,
  inbox: INBOX_RULES,
  pool: POOL_RULES,
  // global context falls back to idle
};

// ============================================
// Resolver
// ============================================

export function resolveStatus(context: AIAssistantContext, ctx: StatusContext): CollapsedContent {
  let rules = STATUS_RULES[context];

  if (!rules) {
    return { type: 'idle', text: 'Ask AI...' };
  }

  // Prepend routine rules when applicable
  // These have higher priorities so they naturally win when conditions match
  if (context === 'queue') {
    rules = [...ROUTINE_QUEUE_RULES, ...rules];
  } else if (context === 'taskDetail' && ctx.currentRoutine) {
    rules = [...ROUTINE_TASK_DETAIL_RULES, ...rules];
  } else if (context === 'focusMode' && ctx.currentRoutine) {
    rules = [...ROUTINE_FOCUS_MODE_RULES, ...rules];
  }

  // Evaluate rules - higher priority rules come first
  for (const rule of rules) {
    if (rule.condition(ctx)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[Status] ${context} → ${rule.id}`);
      }
      return { type: 'status', text: rule.getText(ctx) };
    }
  }

  return { type: 'idle', text: 'Ask AI...' };
}

// ============================================
// Context Builder
// ============================================

export function buildStatusContext(
  state: AppState,
  activeTask: Task | null,
  focusStartTime?: number | null
): StatusContext {
  const today = getTodayISO();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split('T')[0];

  // Queue metrics
  const todayLineIndex = state.focusQueue.todayLineIndex;
  const queueItems = state.focusQueue.items.filter(i => !i.completed);
  const todayItems = queueItems.filter((_, idx) => idx < todayLineIndex);
  const upcomingItems = queueItems.filter((_, idx) => idx >= todayLineIndex);

  // Get tasks for queue items
  const getTaskForItem = (item: FocusQueueItem) => state.tasks.find(t => t.id === item.taskId);

  // Deadline counts (from tasks in queue)
  const todayTasks = todayItems.map(getTaskForItem).filter((t): t is Task => t != null);
  const allQueueTasks = queueItems.map(getTaskForItem).filter((t): t is Task => t != null);

  const deadlineTodayCount = allQueueTasks.filter(t => t.deadlineDate === today).length;
  const deadlineTomorrowCount = allQueueTasks.filter(t => t.deadlineDate === tomorrowISO).length;
  const overdueCount = allQueueTasks.filter(t => isTaskOverdue(t)).length;

  // Time estimate for today
  const todayEstimateMinutes = todayTasks.reduce((sum, task) => {
    const taskEstimate = task.steps
      .filter(s => !s.completed)
      .reduce((stepSum, step) => stepSum + (step.estimatedMinutes || 0), 0);
    return sum + (taskEstimate || task.estimatedMinutes || 0);
  }, 0);

  // Quick wins (tasks with effort === 'quick')
  const quickWinCount = todayTasks.filter(t => t.effort === 'quick').length;

  // Waiting count
  const waitingCount = todayTasks.filter(t => t.waitingOn != null).length;

  // Completed today count
  const completedTodayCount = state.focusQueue.items.filter(item => {
    if (!item.completed || !item.completedAt) return false;
    const completedDate = new Date(item.completedAt).toISOString().split('T')[0];
    return completedDate === today;
  }).length;

  // Task metrics
  const stepCount = activeTask?.steps.length ?? 0;
  const completedStepCount = activeTask?.steps.filter(s => s.completed).length ?? 0;
  const remainingMinutes = activeTask?.steps
    .filter(s => !s.completed)
    .reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0) ?? 0;

  // Focus mode metrics
  const currentStepId = state.focusMode.currentStepId;
  const currentStepIndex = activeTask?.steps.findIndex(s => s.id === currentStepId) ?? -1;
  const totalSteps = activeTask?.steps.length ?? 0;
  const currentStep = activeTask?.steps.find(s => s.id === currentStepId);
  const substepsDone = currentStep?.substeps.filter(sub => sub.completed).length ?? 0;
  const substepsTotal = currentStep?.substeps.length ?? 0;

  // Time on current step (minutes)
  let currentStepMinutes = 0;
  if (focusStartTime && state.focusMode.active && !state.focusMode.paused) {
    const elapsed = Date.now() - focusStartTime - (state.focusMode.pausedTime || 0);
    currentStepMinutes = Math.floor(elapsed / 60000);
  }

  // Inbox metrics
  const inboxTasks = state.tasks.filter(t => t.status === 'inbox' && !t.deletedAt);
  const inboxCount = inboxTasks.length;
  const oldestInboxTask = inboxTasks.length > 0
    ? inboxTasks.reduce((oldest, t) => {
        const days = daysBetween(new Date(t.createdAt).toISOString().split('T')[0], today);
        const oldestDays = daysBetween(new Date(oldest.createdAt).toISOString().split('T')[0], today);
        return days > oldestDays ? t : oldest;
      })
    : null;
  const oldestInboxDays = oldestInboxTask
    ? daysBetween(new Date(oldestInboxTask.createdAt).toISOString().split('T')[0], today)
    : 0;
  const oldestInboxTitle = oldestInboxTask?.title ?? '';

  // Pool metrics
  const poolTasks = state.tasks.filter(t =>
    t.status === 'pool' &&
    !t.deletedAt &&
    (!t.deferredUntil || t.deferredUntil <= today)
  );
  const poolCount = poolTasks.length;
  const resurfacedCount = state.tasks.filter(t =>
    t.status === 'pool' &&
    !t.deletedAt &&
    hasResurfaced(t)
  ).length;

  // Routine metrics
  const routinesDueToday = filterRoutinesDueToday(state.tasks);
  const routineDueTodayCount = routinesDueToday.length;

  // Find overdue routines (rollover enabled, not completed/skipped)
  const allRoutines = filterRecurringTasks(state.tasks);
  const overdueRoutines = allRoutines.filter(t => {
    if (!t.recurrence) return false;
    const pattern = t.recurrence as RecurrenceRuleExtended;
    if (!pattern.rolloverIfMissed) return false;
    const activeDate = getActiveOccurrenceDate(t);
    if (!activeDate) return false;
    const instance = t.recurringInstances?.find(i => i.date === activeDate);
    return instance?.overdueDays && instance.overdueDays > 0 && !instance.completed && !instance.skipped;
  });
  const overdueRoutineCount = overdueRoutines.length;

  // Find oldest overdue routine
  const oldestOverdueRoutine = overdueRoutines.length > 0
    ? overdueRoutines.reduce((oldest, t) => {
        const activeDate = getActiveOccurrenceDate(t);
        const instance = activeDate ? t.recurringInstances?.find(i => i.date === activeDate) : null;
        const days = instance?.overdueDays ?? 0;
        if (!oldest || days > oldest.overdueDays) {
          return { taskId: t.id, title: t.title, overdueDays: days };
        }
        return oldest;
      }, null as { taskId: string; title: string; overdueDays: number } | null)
    : null;

  // Find streak milestone routine (1 away from best)
  const streakMilestoneRoutine = allRoutines.reduce((found, t) => {
    if (found) return found;
    const streak = t.recurringStreak || 0;
    const best = t.recurringBestStreak || 0;
    if (streak > 0 && streak === best - 1) {
      return {
        taskId: t.id,
        title: t.title,
        currentStreak: streak,
        bestStreak: best,
        nearBest: true,
      };
    }
    return null;
  }, null as StatusContext['streakMilestoneRoutine']);

  // Find upcoming routine (within 60 min of scheduled time)
  const now = new Date();
  const upcomingRoutine = routinesDueToday.reduce((found, t) => {
    if (found) return found;
    const pattern = t.recurrence as RecurrenceRuleExtended;
    if (!pattern?.time) return null;
    const [h, m] = pattern.time.split(':').map(Number);
    const scheduled = new Date();
    scheduled.setHours(h, m, 0, 0);
    const diff = (scheduled.getTime() - now.getTime()) / 60000; // minutes
    if (diff > 0 && diff <= 60) {
      return {
        taskId: t.id,
        title: t.title,
        scheduledTime: pattern.time,
        minutesUntil: Math.round(diff),
      };
    }
    return null;
  }, null as StatusContext['upcomingRoutine']);

  // Current routine context (when viewing a routine in TaskDetail/FocusMode)
  let currentRoutine: StatusContext['currentRoutine'] = null;
  if (activeTask?.isRecurring && activeTask.recurrence) {
    const pattern = activeTask.recurrence as RecurrenceRuleExtended;
    const activeDate = getActiveOccurrenceDate(activeTask);
    const instance = activeDate ? activeTask.recurringInstances?.find(i => i.date === activeDate) : null;
    const streak = activeTask.recurringStreak || 0;
    const best = activeTask.recurringBestStreak || 0;

    currentRoutine = {
      streak,
      bestStreak: best,
      isOverdue: (instance?.overdueDays ?? 0) > 0,
      overdueDays: instance?.overdueDays ?? null,
      scheduledTime: pattern.time || null,
      patternDescription: describePattern(pattern),
      nearBest: streak > 0 && streak === best - 1,
    };
  }

  return {
    todayCount: todayItems.length,
    upcomingCount: upcomingItems.length,
    completedTodayCount,
    todayEstimateMinutes,
    deadlineTodayCount,
    deadlineTomorrowCount,
    overdueCount,
    quickWinCount,
    waitingCount,
    task: activeTask,
    stepCount,
    completedStepCount,
    remainingMinutes,
    currentStepIndex,
    totalSteps,
    currentStepMinutes,
    substepsDone,
    substepsTotal,
    inboxCount,
    oldestInboxDays,
    oldestInboxTitle,
    poolCount,
    resurfacedCount,
    // Routine metrics
    routineDueTodayCount,
    overdueRoutineCount,
    oldestOverdueRoutine,
    streakMilestoneRoutine,
    upcomingRoutine,
    currentRoutine,
  };
}
