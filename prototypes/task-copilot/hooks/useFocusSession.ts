/**
 * useFocusSession.ts
 *
 * Hook for focus mode lifecycle: start, pause, resume, exit, stuck.
 *
 * Usage:
 * const session = useFocusSession(state, setState, { aiAssistant, previousView, setPreviousView, setActiveDrawer });
 */

import { useCallback, Dispatch, SetStateAction } from 'react';
import { AppState, ViewType, DrawerType } from '@/lib/types';
import {
  getActiveOccurrenceDate,
  ensureInstance,
} from '@/lib/recurring-utils';
import { getTodayISO } from '@/lib/utils';

export interface UseFocusSessionOptions {
  aiAssistant: {
    state: { mode: string };
    closeDrawer: () => void;
    expand: () => void;
  };
  previousView: ViewType;
  setPreviousView: (view: ViewType) => void;
  setActiveDrawer: (drawer: DrawerType) => void;
}

export function useFocusSession(
  state: AppState,
  setState: Dispatch<SetStateAction<AppState>>,
  options: UseFocusSessionOptions
) {
  const { aiAssistant, previousView, setPreviousView, setActiveDrawer } = options;

  // Start focus session from queue item
  const startFocus = useCallback((queueItemId: string) => {
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    setState((prev) => {
      const queueItem = prev.focusQueue.items.find((i) => i.id === queueItemId);
      if (!queueItem) return prev;

      const task = prev.tasks.find((t) => t.id === queueItem.taskId);
      if (!task) return prev;

      const stepsInScope =
        queueItem.selectionType === 'all_today' || queueItem.selectionType === 'all_upcoming'
          ? task.steps
          : task.steps.filter((s) => queueItem.selectedStepIds.includes(s.id));
      const firstIncomplete = stepsInScope.find((s) => !s.completed);

      setPreviousView(prev.currentView);

      return {
        ...prev,
        currentView: 'focusMode' as const,
        activeTaskId: task.id,
        focusQueue: {
          ...prev.focusQueue,
          items: prev.focusQueue.items.map((i) =>
            i.id === queueItemId ? { ...i, lastInteractedAt: Date.now() } : i
          ),
        },
        focusMode: {
          ...prev.focusMode,
          active: true,
          queueItemId,
          taskId: task.id,
          currentStepId: firstIncomplete?.id || null,
          startTime: Date.now(),
          paused: false,
          pausedTime: 0,
          pauseStartTime: null,
        },
      };
    });
  }, [aiAssistant]);

  // Start focus session for recurring task (no queue item needed)
  const startRecurringFocus = useCallback((taskId: string) => {
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || !task.isRecurring) return prev;

      const activeDate = getActiveOccurrenceDate(task) || getTodayISO();
      const instance = ensureInstance(task, activeDate);

      const firstIncomplete = instance.steps.find((s) => !s.completed);

      setPreviousView(prev.currentView);

      return {
        ...prev,
        currentView: 'focusMode' as const,
        activeTaskId: task.id,
        focusMode: {
          ...prev.focusMode,
          active: true,
          queueItemId: null,
          taskId: task.id,
          currentStepId: firstIncomplete?.id || null,
          startTime: Date.now(),
          paused: false,
          pausedTime: 0,
          pauseStartTime: null,
        },
      };
    });
  }, [aiAssistant]);

  // Pause focus timer
  const pauseFocus = useCallback(() => {
    setState((prev) => ({
      ...prev,
      focusMode: {
        ...prev.focusMode,
        paused: true,
        pauseStartTime: Date.now(),
      },
    }));
  }, []);

  // Resume focus timer
  const resumeFocus = useCallback(() => {
    setState((prev) => {
      const pauseDuration = prev.focusMode.pauseStartTime
        ? Date.now() - prev.focusMode.pauseStartTime
        : 0;
      return {
        ...prev,
        focusMode: {
          ...prev.focusMode,
          paused: false,
          pausedTime: prev.focusMode.pausedTime + pauseDuration,
          pauseStartTime: null,
        },
      };
    });
  }, []);

  // Open AI palette for help when stuck
  const stuck = useCallback(() => {
    aiAssistant.expand();
  }, [aiAssistant]);

  // Exit focus mode with view routing
  const exitFocus = useCallback(() => {
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    let shouldSetPreviousViewToFocus = false;

    setState((prev) => {
      const focusedTask = prev.tasks.find((t) => t.id === prev.focusMode.taskId);
      const wasJustCompleted = focusedTask?.status === 'complete';

      const nextView = wasJustCompleted ? 'taskDetail' as ViewType : previousView;
      const nextActiveTaskId = wasJustCompleted ? focusedTask.id : prev.activeTaskId;

      if (nextView === 'taskDetail') {
        shouldSetPreviousViewToFocus = true;
      }

      return {
        ...prev,
        currentView: nextView,
        activeTaskId: nextActiveTaskId,
        focusMode: {
          active: false,
          queueItemId: null,
          taskId: null,
          currentStepId: null,
          paused: false,
          startTime: null,
          pausedTime: 0,
          pauseStartTime: null,
        },
      };
    });

    if (shouldSetPreviousViewToFocus) {
      setPreviousView('focus');
    }
  }, [previousView, aiAssistant]);

  return {
    startFocus,
    startRecurringFocus,
    pauseFocus,
    resumeFocus,
    stuck,
    exitFocus,
  };
}

export default useFocusSession;
