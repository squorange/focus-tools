/**
 * useTaskCrud.ts
 *
 * Hook for task create/update/delete and workflow operations
 * (defer, park, unarchive, send to pool, quick capture).
 *
 * Usage:
 * const crud = useTaskCrud(state, setState, { showToast, ... });
 */

import { useCallback, useRef, Dispatch, SetStateAction } from 'react';
import {
  AppState,
  Task,
  FocusQueueItem,
  ViewType,
  createTask,
  createFocusQueueItem,
} from '@/lib/types';
import { logTaskCreated } from '@/lib/events';
import { ToastData } from '@design-system/components';

export interface UseTaskCrudOptions {
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  cancelNotificationForTask: (taskId: string) => void;
  scheduleNotificationForTask: (task: Task) => void;
  setPreviousView: (view: ViewType) => void;
  setTaskCreationOpen: (open: boolean) => void;
  handleJumpToFilter: (filter: string) => void;
}

export function useTaskCrud(
  state: AppState,
  setState: Dispatch<SetStateAction<AppState>>,
  options: UseTaskCrudOptions
) {
  const {
    showToast,
    cancelNotificationForTask,
    scheduleNotificationForTask,
    setPreviousView,
    setTaskCreationOpen,
    handleJumpToFilter,
  } = options;

  const stateRef = useRef(state);
  stateRef.current = state;

  const handleCreateTask = useCallback((title: string) => {
    setPreviousView(state.currentView);
    const newTask = createTask(title);
    setState((prev) => {
      const newTasks = [...prev.tasks, newTask];
      logTaskCreated(newTask, newTasks);
      return {
        ...prev,
        tasks: newTasks,
        activeTaskId: newTask.id,
        currentView: 'taskDetail',
      };
    });
  }, [state.currentView]);

  // Create task, add to focus queue, and open TaskDetail
  const handleCreateTaskForFocus = useCallback((title: string) => {
    setPreviousView('focus');

    const newTask = createTask(title);
    newTask.status = 'pool';

    setState((prev) => {
      const newTasks = [...prev.tasks, newTask];
      logTaskCreated(newTask, newTasks);

      const newItem = createFocusQueueItem(newTask.id, 'today');
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const completedItems = prev.focusQueue.items.filter((i) => i.completed);

      const todaySection = activeItems.slice(0, prev.focusQueue.todayLineIndex);
      const laterSection = activeItems.slice(prev.focusQueue.todayLineIndex);
      const newItems = [...todaySection, { ...newItem, order: todaySection.length }, ...laterSection, ...completedItems];
      const newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;

      const reorderedItems = newItems.map((item, idx) => ({
        ...item,
        order: idx,
      }));

      return {
        ...prev,
        tasks: newTasks,
        focusQueue: {
          ...prev.focusQueue,
          items: reorderedItems,
          todayLineIndex: newTodayLineIndex,
        },
        activeTaskId: newTask.id,
        currentView: 'taskDetail',
      };
    });
  }, []);

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    let completedTask: Task | undefined;
    let showCompletionToast: boolean = false;
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      const isBeingCompleted = updates.status === 'complete' && task?.status !== 'complete';
      const now = Date.now();

      if (isBeingCompleted && task && prev.currentView === 'taskDetail') {
        completedTask = task;
        showCompletionToast = true;
      }

      if (isBeingCompleted && task) {
        const activeItems = prev.focusQueue.items
          .filter((i) => !i.completed)
          .sort((a, b) => a.order - b.order);
        const itemIndex = activeItems.findIndex((i) => i.taskId === taskId);

        const newTodayLineIndex = itemIndex !== -1 && itemIndex < prev.focusQueue.todayLineIndex
          ? Math.max(0, prev.focusQueue.todayLineIndex - 1)
          : prev.focusQueue.todayLineIndex;

        const newItems = prev.focusQueue.items
          .filter((i) => i.taskId !== taskId)
          .map((item, idx) => ({ ...item, order: idx }));

        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? { ...t, ...updates, updatedAt: now }
              : t
          ),
          focusQueue: {
            ...prev.focusQueue,
            items: newItems,
            todayLineIndex: newTodayLineIndex,
          },
          focusMode: prev.currentView === 'focusMode'
            ? { ...prev.focusMode, active: false, currentStepId: null }
            : prev.focusMode,
        };
      }

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, ...updates, updatedAt: now }
            : t
        ),
      };
    });

    if (showCompletionToast && completedTask) {
      setPreviousView('focus');

      const taskTitle = completedTask.title || 'Task';
      showToast({
        message: `"${taskTitle.slice(0, 25)}${taskTitle.length > 25 ? '...' : ''}" completed!`,
        type: 'success',
      });
    }

    const notificationFields = [
      'estimatedDurationMinutes', 'estimatedMinutes',
      'deadlineDate', 'deadlineTime',
      'targetDate', 'targetTime',
      'startPokeOverride',
      'recurrence',
    ];

    if (updates.status === 'complete') {
      cancelNotificationForTask(taskId);
    } else if (Object.keys(updates).some(key => notificationFields.includes(key))) {
      setState((prev) => {
        const updatedTask = prev.tasks.find(t => t.id === taskId);
        if (updatedTask && updatedTask.status !== 'complete') {
          setTimeout(() => scheduleNotificationForTask(updatedTask), 0);
        }
        return prev;
      });
    }
  }, [cancelNotificationForTask, scheduleNotificationForTask]);

  const handleDeleteTask = useCallback((taskId: string) => {
    // Read task info before any state mutations (avoids React batching issue
    // where cancelNotificationForTask's setNotifications causes setState's
    // functional updater to be deferred, leaving captured variables undefined)
    const task = stateRef.current.tasks.find((t) => t.id === taskId);
    const taskTitle = task?.title || 'Task';

    cancelNotificationForTask(taskId);

    setState((prev) => {
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const queueItem = activeItems.find((i) => i.taskId === taskId);
      const queueItemIndex = queueItem ? activeItems.indexOf(queueItem) : -1;

      const newTodayLineIndex = queueItemIndex !== -1 && queueItemIndex < prev.focusQueue.todayLineIndex
        ? prev.focusQueue.todayLineIndex - 1
        : prev.focusQueue.todayLineIndex;

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, deletedAt: Date.now() }
            : t
        ),
        focusQueue: {
          ...prev.focusQueue,
          items: prev.focusQueue.items.filter((i) => i.taskId !== taskId).map((item, idx) => ({ ...item, order: idx })),
          todayLineIndex: Math.max(0, newTodayLineIndex),
        },
        activeTaskId: prev.activeTaskId === taskId ? null : prev.activeTaskId,
        currentView: prev.activeTaskId === taskId ? 'focus' : prev.currentView,
      };
    });

    const displayTitle = taskTitle.slice(0, 30) + (taskTitle.length > 30 ? '...' : '');
    showToast({
      message: `"${displayTitle}" deleted`,
      type: 'info',
      action: {
        label: 'Undo',
        onClick: () => {
          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === taskId
                ? { ...t, deletedAt: null }
                : t
            ),
          }));
        },
      },
    });
  }, [cancelNotificationForTask]);

  // Send task to pool (triage complete)
  const handleSendToPool = useCallback((taskId: string) => {
    let sentTask: Task | undefined;
    setState((prev) => {
      sentTask = prev.tasks.find((t) => t.id === taskId);
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: 'pool' as const, updatedAt: Date.now() }
            : t
        ),
      };
    });

    if (sentTask) {
      const taskTitle = sentTask.title || 'Task';
      showToast({
        message: `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" moved to Ready`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            setState((prev) => ({
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, status: 'inbox' as const, updatedAt: Date.now() }
                  : t
              ),
            }));
          },
        },
      });
    }
  }, []);

  // Defer task until a future date
  const handleDefer = useCallback((taskId: string, until: string) => {
    let deferredTask: Task | undefined;
    let previousDeferredUntil: string | null = null;
    let previousDeferredAt: number | null = null;
    let previousDeferredCount: number = 0;
    let previousDeferredFrom: 'focus' | 'ready' | null = null;
    let removedQueueItem: FocusQueueItem | undefined;

    setState((prev) => {
      deferredTask = prev.tasks.find((t) => t.id === taskId);
      if (deferredTask) {
        previousDeferredUntil = deferredTask.deferredUntil;
        previousDeferredAt = deferredTask.deferredAt;
        previousDeferredCount = deferredTask.deferredCount;
        previousDeferredFrom = deferredTask.deferredFrom;
      }

      removedQueueItem = prev.focusQueue.items.find(item => item.taskId === taskId);
      const isInFocusQueue = !!removedQueueItem;

      const deferredFrom: 'focus' | 'ready' | null = isInFocusQueue ? 'focus' : 'ready';

      // Adjust todayLineIndex if removing item above the line
      const activeItems = prev.focusQueue.items.filter(item => !item.completed);
      const queueItemIndex = removedQueueItem ? activeItems.indexOf(removedQueueItem) : -1;
      const newTodayLineIndex = queueItemIndex !== -1 && queueItemIndex < prev.focusQueue.todayLineIndex
        ? prev.focusQueue.todayLineIndex - 1
        : prev.focusQueue.todayLineIndex;

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'pool' as const,
                deferredUntil: until,
                deferredAt: Date.now(),
                deferredCount: t.deferredCount + 1,
                deferredFrom,
                updatedAt: Date.now(),
              }
            : t
        ),
        focusQueue: {
          ...prev.focusQueue,
          items: prev.focusQueue.items.filter(item => item.taskId !== taskId),
          todayLineIndex: Math.max(0, newTodayLineIndex),
        },
      };
    });

    if (deferredTask) {
      const taskTitle = deferredTask.title || 'Task';
      showToast({
        message: `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" deferred until ${until}`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            setState((prev) => ({
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      deferredUntil: previousDeferredUntil,
                      deferredAt: previousDeferredAt,
                      deferredCount: previousDeferredCount,
                      deferredFrom: previousDeferredFrom,
                      updatedAt: Date.now(),
                    }
                  : t
              ),
              focusQueue: removedQueueItem
                ? {
                    ...prev.focusQueue,
                    items: [...prev.focusQueue.items, removedQueueItem],
                  }
                : prev.focusQueue,
            }));
          },
        },
      });
    }
  }, []);

  // Clear defer and optionally restore to focus queue
  const handleClearDefer = useCallback((taskId: string) => {
    let clearedTask: Task | undefined;
    let restoredToFocus = false;

    setState((prev) => {
      clearedTask = prev.tasks.find((t) => t.id === taskId);
      if (!clearedTask) return prev;

      const wasFromFocus = clearedTask.deferredFrom === 'focus';
      restoredToFocus = wasFromFocus;

      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              deferredUntil: null,
              deferredAt: null,
              deferredFrom: null,
              updatedAt: Date.now(),
            }
          : t
      );

      if (wasFromFocus) {
        const task = updatedTasks.find((t) => t.id === taskId)!;
        const newItem = createFocusQueueItem(taskId, 'today', {
          selectionType: 'all_upcoming',
          selectedStepIds: []
        });

        const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
        const completedItems = prev.focusQueue.items.filter((i) => i.completed);
        const todaySection = activeItems.slice(0, prev.focusQueue.todayLineIndex);
        const laterSection = activeItems.slice(prev.focusQueue.todayLineIndex);

        const newItems = [...todaySection, { ...newItem, order: todaySection.length }, ...laterSection, ...completedItems]
          .map((item, idx) => ({ ...item, order: idx }));

        return {
          ...prev,
          tasks: updatedTasks,
          focusQueue: {
            ...prev.focusQueue,
            items: newItems,
          },
        };
      }

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

    if (clearedTask) {
      const taskTitle = clearedTask.title || 'Task';
      showToast({
        message: restoredToFocus
          ? `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" restored to Focus`
          : `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" moved to Ready`,
        type: 'success',
      });
    }
  }, []);

  // Clear waiting on status
  const handleClearWaitingOn = useCallback((taskId: string) => {
    let clearedTask: Task | undefined;

    setState((prev) => {
      clearedTask = prev.tasks.find((t) => t.id === taskId);
      if (!clearedTask) return prev;

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                waitingOn: null,
                updatedAt: Date.now(),
              }
            : t
        ),
      };
    });

    if (clearedTask) {
      const taskTitle = clearedTask.title || 'Task';
      showToast({
        message: `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" no longer waiting`,
        type: 'success',
      });
    }
  }, []);

  // Park task (archive for later)
  const handlePark = useCallback((taskId: string) => {
    let parkedTask: Task | undefined;
    let previousStatus: Task['status'] | undefined;
    setState((prev) => {
      parkedTask = prev.tasks.find((t) => t.id === taskId);
      previousStatus = parkedTask?.status;

      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const queueItem = activeItems.find((i) => i.taskId === taskId);
      const queueItemIndex = queueItem ? activeItems.indexOf(queueItem) : -1;

      const newTodayLineIndex = queueItemIndex !== -1 && queueItemIndex < prev.focusQueue.todayLineIndex
        ? prev.focusQueue.todayLineIndex - 1
        : prev.focusQueue.todayLineIndex;

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'archived' as const,
                archivedAt: Date.now(),
                archivedReason: 'parked' as const,
                updatedAt: Date.now(),
              }
            : t
        ),
        focusQueue: {
          ...prev.focusQueue,
          items: prev.focusQueue.items.filter((i) => i.taskId !== taskId).map((item, idx) => ({ ...item, order: idx })),
          todayLineIndex: Math.max(0, newTodayLineIndex),
        },
        activeTaskId: prev.activeTaskId === taskId ? null : prev.activeTaskId,
        currentView: prev.activeTaskId === taskId ? 'focus' : prev.currentView,
      };
    });

    if (parkedTask) {
      const taskTitle = parkedTask.title || 'Task';
      showToast({
        message: `"${taskTitle.slice(0, 30)}${taskTitle.length > 30 ? '...' : ''}" archived`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            setState((prev) => ({
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: previousStatus || 'pool',
                      archivedAt: null,
                      archivedReason: null,
                      updatedAt: Date.now(),
                    }
                  : t
              ),
            }));
          },
        },
      });
    }
  }, []);

  // Unarchive task (restore from archived)
  const handleUnarchive = useCallback((taskId: string) => {
    let unarchivedTask: Task | undefined;
    setState((prev) => {
      unarchivedTask = prev.tasks.find((t) => t.id === taskId);
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'pool' as const,
                archivedAt: null,
                archivedReason: null,
                updatedAt: Date.now(),
              }
            : t
        ),
      };
    });

    if (unarchivedTask) {
      const taskTitle = unarchivedTask.title || 'Task';
      showToast({
        message: `"${taskTitle.slice(0, 30)}${taskTitle.length > 30 ? '...' : ''}" restored to Ready`,
        type: 'success',
      });
    }
  }, []);

  // Quick dump task to inbox (no navigation)
  const handleCreateTaskQuick = useCallback((title: string) => {
    const newTask = createTask(title);
    setState((prev) => {
      const newTasks = [...prev.tasks, newTask];
      logTaskCreated(newTask, newTasks);
      return {
        ...prev,
        tasks: newTasks,
      };
    });
    showToast({ message: 'Task added to Inbox', type: 'info' });
  }, [showToast]);

  // Quick add task from popover (with optional project) - stays in view
  const handleQuickAddTask = useCallback((title: string, projectId: string | null) => {
    const newTask = createTask(title);
    if (projectId) {
      newTask.projectId = projectId;
    }
    setState((prev) => {
      const newTasks = [...prev.tasks, newTask];
      logTaskCreated(newTask, newTasks);
      return {
        ...prev,
        tasks: newTasks,
      };
    });
    showToast({
      message: 'Added to Inbox',
      type: 'success',
      action: {
        label: 'Show',
        onClick: () => {
          handleJumpToFilter('staging');
        },
      },
    });
  }, [showToast, handleJumpToFilter]);

  // Add task from popover and navigate to TaskDetail
  const handleAddAndOpenTask = useCallback((title: string, projectId: string | null) => {
    const newTask = createTask(title);
    if (projectId) {
      newTask.projectId = projectId;
    }
    setPreviousView(state.currentView);
    setState((prev) => {
      const newTasks = [...prev.tasks, newTask];
      logTaskCreated(newTask, newTasks);
      return {
        ...prev,
        tasks: newTasks,
        activeTaskId: newTask.id,
        currentView: 'taskDetail',
      };
    });
    setTaskCreationOpen(false);
  }, [state.currentView]);

  return {
    createTask: handleCreateTask,
    createTaskForFocus: handleCreateTaskForFocus,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    sendToPool: handleSendToPool,
    defer: handleDefer,
    clearDefer: handleClearDefer,
    clearWaitingOn: handleClearWaitingOn,
    park: handlePark,
    unarchive: handleUnarchive,
    quickCapture: handleCreateTaskQuick,
    quickAddTask: handleQuickAddTask,
    addAndOpenTask: handleAddAndOpenTask,
  };
}

export default useTaskCrud;
