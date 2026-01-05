import {
  FocusQueue,
  FocusQueueItem,
  Task,
  Horizon,
  createFocusQueueItem,
} from './types';
import { getTotalEstimatedMinutes, getRemainingEstimatedMinutes } from './utils';

// ============================================
// Queue Item Creation
// ============================================

/**
 * Add a task to the queue with entire task selection
 */
export function addTaskToQueue(
  queue: FocusQueue,
  task: Task,
  horizon: Horizon = 'today'
): FocusQueue {
  // Check if task already in queue
  if (queue.items.some((item) => item.taskId === task.id)) {
    return queue;
  }

  const newItem = createFocusQueueItem(task.id, horizon, {
    order: queue.items.filter((i) => i.horizon === horizon).length,
  });

  return {
    ...queue,
    items: [...queue.items, newItem],
  };
}

/**
 * Add a task with specific steps to the queue
 */
export function addStepsToQueue(
  queue: FocusQueue,
  task: Task,
  stepIds: string[],
  horizon: Horizon = 'today'
): FocusQueue {
  // Check if task already in queue
  if (queue.items.some((item) => item.taskId === task.id)) {
    return queue;
  }

  const newItem = createFocusQueueItem(task.id, horizon, {
    selectionType: 'specific_steps',
    selectedStepIds: stepIds,
    order: queue.items.filter((i) => i.horizon === horizon).length,
  });

  return {
    ...queue,
    items: [...queue.items, newItem],
  };
}

// ============================================
// Queue Item Removal
// ============================================

/**
 * Remove a queue item by ID
 */
export function removeFromQueue(queue: FocusQueue, itemId: string): FocusQueue {
  return {
    ...queue,
    items: queue.items.filter((item) => item.id !== itemId),
  };
}

/**
 * Remove all items for a specific task
 */
export function removeTaskFromQueue(queue: FocusQueue, taskId: string): FocusQueue {
  return {
    ...queue,
    items: queue.items.filter((item) => item.taskId !== taskId),
  };
}

// ============================================
// Queue Item Updates
// ============================================

/**
 * Update a queue item
 */
export function updateQueueItem(
  queue: FocusQueue,
  itemId: string,
  updates: Partial<FocusQueueItem>
): FocusQueue {
  return {
    ...queue,
    items: queue.items.map((item) =>
      item.id === itemId
        ? { ...item, ...updates, lastInteractedAt: Date.now() }
        : item
    ),
  };
}

/**
 * Change the horizon of a queue item
 */
export function changeHorizon(
  queue: FocusQueue,
  itemId: string,
  newHorizon: Horizon
): FocusQueue {
  return updateQueueItem(queue, itemId, {
    horizon: newHorizon,
    horizonEnteredAt: Date.now(),
    // Reset rollover count when moving to a new horizon
    rolloverCount: 0,
  });
}

/**
 * Update the step selection for a queue item
 */
export function updateStepSelection(
  queue: FocusQueue,
  itemId: string,
  stepIds: string[]
): FocusQueue {
  return updateQueueItem(queue, itemId, {
    selectionType: stepIds.length === 0 ? 'entire_task' : 'specific_steps',
    selectedStepIds: stepIds,
  });
}

/**
 * Mark a queue item as completed
 */
export function completeQueueItem(queue: FocusQueue, itemId: string): FocusQueue {
  return updateQueueItem(queue, itemId, {
    completed: true,
    completedAt: Date.now(),
  });
}

/**
 * Reorder queue items within a horizon
 */
export function reorderQueueItems(
  queue: FocusQueue,
  horizon: Horizon,
  orderedIds: string[]
): FocusQueue {
  const itemsInHorizon = queue.items.filter((i) => i.horizon === horizon);
  const itemsNotInHorizon = queue.items.filter((i) => i.horizon !== horizon);

  const reorderedItems = orderedIds.map((id, index) => {
    const item = itemsInHorizon.find((i) => i.id === id);
    return item ? { ...item, order: index } : null;
  }).filter((i): i is FocusQueueItem => i !== null);

  return {
    ...queue,
    items: [...reorderedItems, ...itemsNotInHorizon],
  };
}

// ============================================
// Queue Queries
// ============================================

/**
 * Get queue items by horizon
 */
export function getItemsByHorizon(queue: FocusQueue, horizon: Horizon): FocusQueueItem[] {
  return queue.items
    .filter((item) => item.horizon === horizon && !item.completed)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get all "today" items
 */
export function getTodayItems(queue: FocusQueue): FocusQueueItem[] {
  return getItemsByHorizon(queue, 'today');
}

/**
 * Get all "this week" items
 */
export function getThisWeekItems(queue: FocusQueue): FocusQueueItem[] {
  return getItemsByHorizon(queue, 'this_week');
}

/**
 * Get all "upcoming" items
 */
export function getUpcomingItems(queue: FocusQueue): FocusQueueItem[] {
  return getItemsByHorizon(queue, 'upcoming');
}

/**
 * Get completed items
 */
export function getCompletedItems(queue: FocusQueue): FocusQueueItem[] {
  return queue.items.filter((item) => item.completed);
}

/**
 * Find queue item for a task
 */
export function findQueueItemForTask(
  queue: FocusQueue,
  taskId: string
): FocusQueueItem | undefined {
  return queue.items.find((item) => item.taskId === taskId);
}

/**
 * Check if a task is in the queue
 */
export function isTaskInQueue(queue: FocusQueue, taskId: string): boolean {
  return queue.items.some((item) => item.taskId === taskId);
}

// ============================================
// Queue Item Completion Logic
// ============================================

/**
 * Check if a queue item's goal is complete
 * For entire_task: all steps complete
 * For specific_steps: selected steps complete
 */
export function isQueueItemComplete(item: FocusQueueItem, task: Task): boolean {
  if (item.selectionType === 'entire_task') {
    return task.steps.length > 0 && task.steps.every((s) => s.completed);
  } else {
    return item.selectedStepIds.every((stepId) => {
      const step = task.steps.find((s) => s.id === stepId);
      return step?.completed === true;
    });
  }
}

/**
 * Get the steps in scope for a queue item
 */
export function getStepsInScope(item: FocusQueueItem, task: Task): typeof task.steps {
  if (item.selectionType === 'entire_task') {
    return task.steps;
  } else {
    return task.steps.filter((s) => item.selectedStepIds.includes(s.id));
  }
}

/**
 * Get progress for a queue item (0-100)
 */
export function getQueueItemProgress(item: FocusQueueItem, task: Task): number {
  const stepsInScope = getStepsInScope(item, task);
  if (stepsInScope.length === 0) return 0;
  const completed = stepsInScope.filter((s) => s.completed).length;
  return Math.round((completed / stepsInScope.length) * 100);
}

/**
 * Get display string for step selection
 * e.g., "Steps 2-4 of 7" or "All steps"
 */
export function getSelectionDisplay(item: FocusQueueItem, task: Task): string {
  if (item.selectionType === 'entire_task') {
    return task.steps.length === 0 ? 'No steps' : `All ${task.steps.length} steps`;
  }

  const selectedCount = item.selectedStepIds.length;
  const totalCount = task.steps.length;

  // Find step indices
  const indices = item.selectedStepIds
    .map((id) => task.steps.findIndex((s) => s.id === id) + 1)
    .filter((i) => i > 0)
    .sort((a, b) => a - b);

  if (indices.length === 0) return 'No steps selected';

  // Check if consecutive
  const isConsecutive = indices.every(
    (val, idx) => idx === 0 || val === indices[idx - 1] + 1
  );

  if (isConsecutive && indices.length > 1) {
    return `Steps ${indices[0]}-${indices[indices.length - 1]} of ${totalCount}`;
  } else if (indices.length === 1) {
    return `Step ${indices[0]} of ${totalCount}`;
  } else {
    return `${selectedCount} steps of ${totalCount}`;
  }
}

// ============================================
// Queue Estimates
// ============================================

/**
 * Get estimated minutes for a queue item
 */
export function getQueueItemEstimate(item: FocusQueueItem, task: Task): number {
  const stepsInScope = getStepsInScope(item, task);
  return getRemainingEstimatedMinutes(stepsInScope);
}

/**
 * Get total estimated minutes for a horizon
 */
export function getHorizonEstimate(
  queue: FocusQueue,
  tasks: Task[],
  horizon: Horizon
): number {
  const items = getItemsByHorizon(queue, horizon);
  return items.reduce((sum, item) => {
    const task = tasks.find((t) => t.id === item.taskId);
    if (!task) return sum;
    return sum + getQueueItemEstimate(item, task);
  }, 0);
}

/**
 * Get total estimated minutes for today
 */
export function getTodayEstimate(queue: FocusQueue, tasks: Task[]): number {
  return getHorizonEstimate(queue, tasks, 'today');
}

// ============================================
// Queue Staleness & Rollover
// ============================================

/**
 * Check if a queue item is stale (untouched for too long)
 */
export function isQueueItemStale(item: FocusQueueItem, daysThreshold: number = 3): boolean {
  const daysSinceInteraction = Math.floor(
    (Date.now() - item.lastInteractedAt) / (1000 * 60 * 60 * 24)
  );
  return daysSinceInteraction >= daysThreshold;
}

/**
 * Process daily rollover for queue items
 * Items in "today" that weren't completed should be prompted for review
 */
export function processRollover(queue: FocusQueue): {
  queue: FocusQueue;
  itemsToReview: FocusQueueItem[];
} {
  const itemsToReview: FocusQueueItem[] = [];
  const updatedItems = queue.items.map((item) => {
    // Only process incomplete "today" items that are stale
    if (item.horizon === 'today' && !item.completed && isQueueItemStale(item, 1)) {
      itemsToReview.push(item);
      return {
        ...item,
        rolloverCount: item.rolloverCount + 1,
      };
    }
    return item;
  });

  return {
    queue: { ...queue, items: updatedItems },
    itemsToReview,
  };
}

// ============================================
// Queue Size Limits
// ============================================

const QUEUE_LIMITS = {
  today: 15,
  total: 30,
} as const;

/**
 * Check if today is at capacity
 */
export function isTodayAtCapacity(queue: FocusQueue): boolean {
  return getTodayItems(queue).length >= QUEUE_LIMITS.today;
}

/**
 * Check if queue is at total capacity
 */
export function isQueueAtCapacity(queue: FocusQueue): boolean {
  return queue.items.filter((i) => !i.completed).length >= QUEUE_LIMITS.total;
}

/**
 * Get warning message for queue limits
 */
export function getQueueLimitWarning(queue: FocusQueue): string | null {
  const todayCount = getTodayItems(queue).length;
  const totalCount = queue.items.filter((i) => !i.completed).length;

  if (todayCount >= QUEUE_LIMITS.today) {
    return `That's a full day (${todayCount} items). Consider moving some to This Week.`;
  }

  if (totalCount >= QUEUE_LIMITS.total) {
    return `Queue is getting large (${totalCount} items). Review and prune?`;
  }

  return null;
}
