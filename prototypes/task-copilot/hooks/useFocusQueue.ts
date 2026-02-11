/**
 * useFocusQueue.ts
 *
 * Hook for focus queue operations: add/remove/reorder items,
 * step selection, routine handlers (complete/skip/incomplete/reset).
 *
 * Usage:
 * const queue = useFocusQueue(state, setState, { showToast, scheduleNotificationForTask, cancelNotificationForTask });
 */

import { useCallback, Dispatch, SetStateAction } from 'react';
import {
  AppState,
  Task,
  FocusQueueItem,
  createFocusQueueItem,
} from '@/lib/types';
import { logQueueItemAdded } from '@/lib/events';
import { ToastData } from '@design-system/components';
import {
  getActiveOccurrenceDate,
  getTodayISO as getRecurringTodayISO,
  markInstanceComplete,
  skipInstance,
  markInstanceIncomplete,
  cloneSteps,
} from '@/lib/recurring-utils';

export interface UseFocusQueueOptions {
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  scheduleNotificationForTask: (task: Task) => void;
  cancelNotificationForTask: (taskId: string) => void;
}

export function useFocusQueue(
  state: AppState,
  setState: Dispatch<SetStateAction<AppState>>,
  options: UseFocusQueueOptions
) {
  const { showToast, scheduleNotificationForTask, cancelNotificationForTask } = options;

  // Add task to queue (position-based, not horizon-based)
  // If forToday=true, insert at position todayLineIndex (moves line down)
  // If forToday=false, insert just after the line
  const addToQueue = useCallback((
    taskId: string,
    forToday: boolean = false,
    selectionType?: 'all_today' | 'all_upcoming' | 'specific_steps',
    selectedStepIds: string[] = []
  ) => {
    const effectiveSelectionType = selectionType ?? (forToday ? 'all_today' : 'all_upcoming');

    let addedTask: Task | undefined;
    let addedItemId: string | undefined;
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;
      addedTask = task;

      // Check if already in queue
      if (prev.focusQueue.items.some((i) => i.taskId === taskId && !i.completed)) {
        return prev;
      }

      // Ensure task is in pool
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId && t.status === 'inbox'
          ? { ...t, status: 'pool' as const, updatedAt: Date.now() }
          : t
      );

      const newItem = createFocusQueueItem(taskId, 'today', { selectionType: effectiveSelectionType, selectedStepIds });
      addedItemId = newItem.id;

      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const completedItems = prev.focusQueue.items.filter((i) => i.completed);

      let newItems: typeof prev.focusQueue.items;
      let newTodayLineIndex: number;

      if (forToday) {
        const todaySection = activeItems.slice(0, prev.focusQueue.todayLineIndex);
        const laterSection = activeItems.slice(prev.focusQueue.todayLineIndex);
        newItems = [...todaySection, { ...newItem, order: todaySection.length }, ...laterSection, ...completedItems];
        newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;
      } else {
        const todaySection = activeItems.slice(0, prev.focusQueue.todayLineIndex);
        const laterSection = activeItems.slice(prev.focusQueue.todayLineIndex);
        newItems = [...todaySection, { ...newItem, order: todaySection.length }, ...laterSection, ...completedItems];
        newTodayLineIndex = prev.focusQueue.todayLineIndex;
      }

      newItems = newItems.map((item, idx) => ({ ...item, order: idx }));

      const updatedQueue = {
        ...prev.focusQueue,
        items: newItems,
        todayLineIndex: newTodayLineIndex,
      };

      logQueueItemAdded(newItem, task, updatedTasks);

      return {
        ...prev,
        tasks: updatedTasks,
        focusQueue: updatedQueue,
      };
    });

    // Show toast with undo action
    if (addedTask && addedItemId) {
      const taskTitle = addedTask.title || 'Task';
      const itemId = addedItemId;
      showToast({
        message: `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" added to Focus`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            setState((prev) => {
              const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
              const itemIndex = activeItems.findIndex((i) => i.id === itemId);
              const newTodayLineIndex = itemIndex !== -1 && itemIndex < prev.focusQueue.todayLineIndex
                ? prev.focusQueue.todayLineIndex - 1
                : prev.focusQueue.todayLineIndex;
              return {
                ...prev,
                focusQueue: {
                  ...prev.focusQueue,
                  items: prev.focusQueue.items.filter((i) => i.id !== itemId).map((item, idx) => ({ ...item, order: idx })),
                  todayLineIndex: Math.max(0, newTodayLineIndex),
                },
              };
            });
          },
        },
      });
    }

    // Schedule start poke notification for the added task
    if (addedTask) {
      scheduleNotificationForTask(addedTask);
    }
  }, [scheduleNotificationForTask]);

  // Update step selection for an existing queue item
  // Also moves task between Today/Upcoming based on selection
  const updateStepSelection = useCallback((
    queueItemId: string,
    selectionType: 'all_today' | 'all_upcoming' | 'specific_steps',
    selectedStepIds: string[]
  ) => {
    setState((prev) => {
      const sortedItems = [...prev.focusQueue.items]
        .filter(i => !i.completed)
        .sort((a, b) => a.order - b.order);

      const sortedIndex = sortedItems.findIndex(i => i.id === queueItemId);
      if (sortedIndex === -1) return prev;

      const updatedItem: FocusQueueItem = {
        ...sortedItems[sortedIndex],
        selectionType,
        selectedStepIds: selectionType === 'all_upcoming' ? [] : selectedStepIds,
        lastInteractedAt: Date.now(),
      };

      const hasAnyTodaySteps = selectionType !== 'all_upcoming';
      const currentlyInToday = sortedIndex < prev.focusQueue.todayLineIndex;

      if (hasAnyTodaySteps === currentlyInToday) {
        const newItems = prev.focusQueue.items.map(item =>
          item.id === queueItemId ? updatedItem : item
        );
        return { ...prev, focusQueue: { ...prev.focusQueue, items: newItems } };
      }

      sortedItems.splice(sortedIndex, 1);

      let newTodayLineIndex = prev.focusQueue.todayLineIndex;

      if (hasAnyTodaySteps && !currentlyInToday) {
        sortedItems.splice(newTodayLineIndex, 0, updatedItem);
        newTodayLineIndex += 1;
      } else if (!hasAnyTodaySteps && currentlyInToday) {
        newTodayLineIndex -= 1;
        sortedItems.splice(newTodayLineIndex, 0, updatedItem);
      }

      const reorderedItems = sortedItems.map((item, idx) => ({
        ...item,
        order: idx,
      }));

      const completedItems = prev.focusQueue.items.filter(i => i.completed);

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...reorderedItems, ...completedItems],
          todayLineIndex: newTodayLineIndex,
        },
      };
    });
  }, []);

  // Remove item from queue (adjusts todayLineIndex if item was above line)
  const removeFromQueue = useCallback((queueItemId: string) => {
    let removedItem: FocusQueueItem | undefined;
    let removedTask: Task | undefined;
    let wasAboveLine: boolean = false;
    setState((prev) => {
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const itemIndex = activeItems.findIndex((i) => i.id === queueItemId);
      removedItem = activeItems.find((i) => i.id === queueItemId);
      if (removedItem) {
        removedTask = prev.tasks.find((t) => t.id === removedItem!.taskId);
      }
      wasAboveLine = itemIndex !== -1 && itemIndex < prev.focusQueue.todayLineIndex;

      const newTodayLineIndex = wasAboveLine
        ? prev.focusQueue.todayLineIndex - 1
        : prev.focusQueue.todayLineIndex;

      const newItems = prev.focusQueue.items
        .filter((i) => i.id !== queueItemId)
        .map((item, idx) => ({ ...item, order: idx }));

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: newItems,
          todayLineIndex: Math.max(0, newTodayLineIndex),
        },
      };
    });

    if (removedItem && removedTask) {
      const taskTitle = removedTask.title || 'Task';
      const item = { ...removedItem };
      const addedAboveLine = wasAboveLine;
      showToast({
        message: `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" moved to Tasks`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            setState((prev) => {
              const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
              const completedItems = prev.focusQueue.items.filter((i) => i.completed);
              let newItems = [...activeItems, item, ...completedItems];
              let newTodayLineIndex = prev.focusQueue.todayLineIndex;
              if (addedAboveLine) {
                newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;
              }
              newItems = newItems.map((i, idx) => ({ ...i, order: idx }));
              return {
                ...prev,
                focusQueue: {
                  ...prev.focusQueue,
                  items: newItems,
                  todayLineIndex: newTodayLineIndex,
                },
              };
            });
          },
        },
      });
    }
  }, []);

  // Complete a routine (uses active occurrence date for overdue support)
  const completeRoutine = useCallback((taskId: string) => {
    let taskTitle = '';
    let newStreak = 0;
    let previousTask: Task | undefined;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || !task.isRecurring) return prev;

      const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
      taskTitle = task.title;
      previousTask = { ...task, recurringInstances: [...task.recurringInstances] };
      const updatedTask = markInstanceComplete(task, activeDate);
      newStreak = updatedTask.recurringStreak;

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      };
    });

    cancelNotificationForTask(taskId);

    showToast({
      message: `Completed! ${newStreak > 1 ? `${newStreak}d streak` : 'Streak started'}`,
      type: 'success',
      action: previousTask ? {
        label: 'Undo',
        onClick: () => {
          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === taskId ? previousTask! : t)),
          }));
        },
      } : undefined,
    });
  }, []);

  // Skip a routine (uses active occurrence date for overdue support)
  const skipRoutine = useCallback((taskId: string) => {
    let taskTitle = '';
    let previousTask: Task | undefined;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || !task.isRecurring) return prev;

      const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
      taskTitle = task.title;
      previousTask = { ...task, recurringInstances: [...task.recurringInstances] };
      const updatedTask = skipInstance(task, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      };
    });

    showToast({
      message: `Skipped "${(taskTitle || 'Routine').slice(0, 20)}${(taskTitle || 'Routine').length > 20 ? '...' : ''}"`,
      type: 'info',
      action: previousTask ? {
        label: 'Undo',
        onClick: () => {
          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === taskId ? previousTask! : t)),
          }));
        },
      } : undefined,
    });
  }, []);

  // Mark routine incomplete (uses active occurrence date for overdue support)
  const markRoutineIncomplete = useCallback((taskId: string) => {
    let taskTitle = '';
    let previousTask: Task | undefined;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || !task.isRecurring) return prev;

      const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
      taskTitle = task.title;
      previousTask = { ...task, recurringInstances: [...task.recurringInstances] };
      const updatedTask = markInstanceIncomplete(task, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      };
    });

    showToast({
      message: `Marked incomplete`,
      type: 'info',
      action: previousTask ? {
        label: 'Undo',
        onClick: () => {
          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === taskId ? previousTask! : t)),
          }));
        },
      } : undefined,
    });
  }, []);

  // Reset current routine instance from template (re-clone steps)
  const resetFromTemplate = useCallback((taskId: string) => {
    let previousInstanceData: { steps: any[]; completed: boolean; completedAt: number | null } | null = null;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || !task.isRecurring || !task.recurrence) return prev;

      const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
      const instance = task.recurringInstances?.find((i) => i.date === activeDate);
      if (!instance) return prev;

      previousInstanceData = {
        steps: [...instance.steps],
        completed: instance.completed,
        completedAt: instance.completedAt,
      };

      const freshSteps = cloneSteps(task.steps);

      const updatedInstance = {
        ...instance,
        steps: freshSteps,
        completed: false,
        completedAt: null,
      };

      const updatedInstances = task.recurringInstances
        .filter((i) => i.date !== activeDate)
        .concat(updatedInstance);

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, recurringInstances: updatedInstances, updatedAt: Date.now() }
            : t
        ),
      };
    });

    showToast({
      message: 'Steps reset from template',
      type: 'success',
      action: previousInstanceData ? {
        label: 'Undo',
        onClick: () => {
          setState((prev) => {
            const task = prev.tasks.find((t) => t.id === taskId);
            if (!task) return prev;
            const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
            const instance = task.recurringInstances?.find((i) => i.date === activeDate);
            if (!instance) return prev;

            const restoredInstance = {
              ...instance,
              ...previousInstanceData!,
            };

            const updatedInstances = task.recurringInstances
              .filter((i) => i.date !== activeDate)
              .concat(restoredInstance);

            return {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, recurringInstances: updatedInstances, updatedAt: Date.now() }
                  : t
              ),
            };
          });
        },
      } : undefined,
    });
  }, []);

  // Move queue item to a new position
  const moveQueueItem = useCallback((queueItemId: string, newIndex: number) => {
    setState((prev) => {
      const activeItems = prev.focusQueue.items
        .filter((i) => !i.completed)
        .sort((a, b) => a.order - b.order);
      const completedItems = prev.focusQueue.items.filter((i) => i.completed);

      const currentIndex = activeItems.findIndex((i) => i.id === queueItemId);
      if (currentIndex === -1 || currentIndex === newIndex) return prev;

      const item = activeItems[currentIndex];
      const withoutItem = activeItems.filter((i) => i.id !== queueItemId);

      const reordered = [
        ...withoutItem.slice(0, newIndex),
        item,
        ...withoutItem.slice(newIndex),
      ].map((i, idx) => ({ ...i, order: idx }));

      const newTodayLineIndex = prev.focusQueue.todayLineIndex;

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...reordered, ...completedItems],
          todayLineIndex: Math.min(newTodayLineIndex, reordered.length),
        },
      };
    });
  }, []);

  // Move queue item up (decrease index by 1)
  const moveQueueItemUp = useCallback((queueItemId: string) => {
    setState((prev) => {
      const activeItems = prev.focusQueue.items
        .filter((i) => !i.completed)
        .sort((a, b) => a.order - b.order);
      const completedItems = prev.focusQueue.items.filter((i) => i.completed);
      const currentIndex = activeItems.findIndex((i) => i.id === queueItemId);
      if (currentIndex <= 0) return prev;

      const newIndex = currentIndex - 1;
      const item = activeItems[currentIndex];
      const withoutItem = activeItems.filter((i) => i.id !== queueItemId);
      const reordered = [
        ...withoutItem.slice(0, newIndex),
        item,
        ...withoutItem.slice(newIndex),
      ].map((i, idx) => ({ ...i, order: idx }));

      let newTodayLineIndex = prev.focusQueue.todayLineIndex;
      const wasAboveLine = currentIndex < prev.focusQueue.todayLineIndex;
      const nowAboveLine = newIndex < prev.focusQueue.todayLineIndex;
      if (wasAboveLine && !nowAboveLine) {
        newTodayLineIndex = Math.max(0, prev.focusQueue.todayLineIndex - 1);
      } else if (!wasAboveLine && nowAboveLine) {
        newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;
      }

      const syncedReordered = reordered.map(i => {
        if (i.id !== queueItemId) return i;
        if (!wasAboveLine && nowAboveLine && i.selectionType !== 'all_today') {
          return { ...i, selectionType: 'all_today' as const, selectedStepIds: [] };
        }
        if (wasAboveLine && !nowAboveLine && i.selectionType !== 'all_upcoming') {
          return { ...i, selectionType: 'all_upcoming' as const, selectedStepIds: [] };
        }
        return i;
      });

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...syncedReordered, ...completedItems],
          todayLineIndex: Math.min(newTodayLineIndex, syncedReordered.length),
        },
      };
    });
  }, []);

  // Move queue item down (increase index by 1)
  const moveQueueItemDown = useCallback((queueItemId: string) => {
    setState((prev) => {
      const activeItems = prev.focusQueue.items
        .filter((i) => !i.completed)
        .sort((a, b) => a.order - b.order);
      const completedItems = prev.focusQueue.items.filter((i) => i.completed);
      const currentIndex = activeItems.findIndex((i) => i.id === queueItemId);
      if (currentIndex === -1 || currentIndex >= activeItems.length - 1) return prev;

      const newIndex = currentIndex + 1;
      const item = activeItems[currentIndex];
      const withoutItem = activeItems.filter((i) => i.id !== queueItemId);
      const reordered = [
        ...withoutItem.slice(0, newIndex),
        item,
        ...withoutItem.slice(newIndex),
      ].map((i, idx) => ({ ...i, order: idx }));

      let newTodayLineIndex = prev.focusQueue.todayLineIndex;
      const wasAboveLine = currentIndex < prev.focusQueue.todayLineIndex;
      const nowAboveLine = newIndex < prev.focusQueue.todayLineIndex;
      if (wasAboveLine && !nowAboveLine) {
        newTodayLineIndex = Math.max(0, prev.focusQueue.todayLineIndex - 1);
      } else if (!wasAboveLine && nowAboveLine) {
        newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;
      }

      const syncedReordered = reordered.map(i => {
        if (i.id !== queueItemId) return i;
        if (!wasAboveLine && nowAboveLine && i.selectionType !== 'all_today') {
          return { ...i, selectionType: 'all_today' as const, selectedStepIds: [] };
        }
        if (wasAboveLine && !nowAboveLine && i.selectionType !== 'all_upcoming') {
          return { ...i, selectionType: 'all_upcoming' as const, selectedStepIds: [] };
        }
        return i;
      });

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...syncedReordered, ...completedItems],
          todayLineIndex: Math.min(newTodayLineIndex, syncedReordered.length),
        },
      };
    });
  }, []);

  // Move the today line to a new position
  const moveTodayLine = useCallback((newIndex: number) => {
    setState((prev) => {
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const maxIndex = activeItems.length;
      const clampedIndex = Math.max(0, Math.min(newIndex, maxIndex));

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          todayLineIndex: clampedIndex,
        },
      };
    });
  }, []);

  // Unified reorder handler for visual-first drag/drop
  const reorderQueue = useCallback((
    newItems: FocusQueueItem[],
    newTodayLineIndex: number
  ) => {
    setState((prev) => {
      const completedItems = prev.focusQueue.items.filter(i => i.completed);

      const reorderedActive = newItems.map((item, idx) => {
        const isInTodaySection = idx < newTodayLineIndex;

        if (isInTodaySection && (item.selectionType === 'all_upcoming' || item.selectionType === 'specific_steps')) {
          return {
            ...item,
            order: idx,
            selectionType: 'all_today' as const,
            selectedStepIds: [],
          };
        }

        if (!isInTodaySection && item.selectionType !== 'all_upcoming') {
          return {
            ...item,
            order: idx,
            selectionType: 'all_upcoming' as const,
            selectedStepIds: [],
          };
        }

        return { ...item, order: idx };
      });

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...reorderedActive, ...completedItems],
          todayLineIndex: newTodayLineIndex,
        },
      };
    });
  }, []);

  return {
    addToQueue,
    updateStepSelection,
    removeFromQueue,
    completeRoutine,
    skipRoutine,
    markRoutineIncomplete,
    resetFromTemplate,
    moveQueueItem,
    moveQueueItemUp,
    moveQueueItemDown,
    moveTodayLine,
    reorderQueue,
  };
}

export default useFocusQueue;
