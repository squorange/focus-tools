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
import {
  getTodayISO,
  daysBetween,
  isOverdue as isTaskOverdue,
  isDueToday as isTaskDueToday,
  hasResurfaced,
} from './utils';

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

  // Pool metrics
  poolCount: number;
  resurfacedCount: number;
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
    getText: ctx => `Oldest: ${ctx.oldestInboxDays} days ago`
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
  const rules = STATUS_RULES[context];

  if (!rules) {
    return { type: 'idle', text: 'Ask AI...' };
  }

  // Rules are already in priority order in the arrays
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
  const oldestInboxDays = inboxTasks.length > 0
    ? Math.max(...inboxTasks.map(t => daysBetween(
        new Date(t.createdAt).toISOString().split('T')[0],
        today
      )))
    : 0;

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
    poolCount,
    resurfacedCount,
  };
}
