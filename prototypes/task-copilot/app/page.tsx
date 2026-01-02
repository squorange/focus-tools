"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Step,
  SuggestedStep,
  EditSuggestion,
  Message,
  AppState,
  StructureResponse,
  FocusModeState,
  Task,
  createTask,
  createInitialAppState,
  generateId,
} from "@/lib/types";
import { loadState, saveState, loadEvents, saveEvents } from "@/lib/storage";
import {
  logTaskCreated,
  logTaskCompleted,
  logStepCompleted,
  logFocusStarted,
  logFocusEnded,
  countFocusSessionsToday,
} from "@/lib/events";
import {
  computeComplexity,
  computeFocusScore,
  computeHealthStatus,
  daysBetween,
  getTodayISO,
} from "@/lib/utils";
import TaskList from "@/components/TaskList";
import StagingArea from "@/components/StagingArea";
import NotesModule from "@/components/NotesModule";
import AIDrawer from "@/components/AIDrawer";
import FocusMode from "@/components/FocusMode";
import Dashboard from "@/components/dashboard/Dashboard";

// Initial focus mode state
const initialFocusModeState: FocusModeState = {
  active: false,
  taskId: null,
  stepId: null,
  paused: false,
  startTime: null,
  pausedTime: 0,
  pauseStartTime: null,
};

export default function Home() {
  const [state, setState] = useState<AppState>(createInitialAppState);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Get active task for current operations
  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId);
  const activeSteps = activeTask?.steps || [];

  // Load state from localStorage after hydration (client-only)
  useEffect(() => {
    try {
      const loaded = loadState();
      const events = loadEvents();

      // Handle focus mode restoration:
      // - If was paused → restore full state (timer preserved)
      // - If was active but not paused → reset to inactive (timer lost)
      let focusMode = initialFocusModeState;
      if (loaded.focusMode?.active && loaded.focusMode?.paused) {
        focusMode = {
          active: true,
          taskId: loaded.focusMode.taskId,
          stepId: loaded.focusMode.stepId,
          paused: true,
          startTime: loaded.focusMode.startTime,
          pausedTime: loaded.focusMode.pausedTime || 0,
          pauseStartTime: loaded.focusMode.pauseStartTime,
        };
      }

      // Determine default view
      let currentView = loaded.currentView || 'dashboard';
      if (focusMode.active) {
        currentView = 'focusMode';
      }

      setState({
        ...loaded,
        events,
        focusMode,
        currentView,
        aiDrawer: {
          ...loaded.aiDrawer,
          // Keep drawer open if no tasks and not in focus mode
          isOpen: loaded.tasks.length === 0 && !focusMode.active,
        },
      });
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }
    setHasHydrated(true);
  }, []);

  // Save state to localStorage when it changes (only after hydration)
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      // Save main state (storage separates events)
      const toSave = {
        ...state,
        // Only save focus mode if paused (to preserve timer on refresh)
        focusMode: state.focusMode.paused ? state.focusMode : initialFocusModeState,
      };
      saveState(toSave);
      saveEvents(state.events);
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }, [hasHydrated, state]);

  // ============================================
  // Task CRUD Operations
  // ============================================

  // Create a new task
  const handleCreateTask = useCallback((title: string) => {
    const now = Date.now();
    const newTask = createTask(title, {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    });

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

    return newTask;
  }, []);

  // Update a task
  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
              updatedAt: Date.now(),
              version: task.version + 1,
            }
          : task
      ),
    }));
  }, []);

  // Complete a task
  const handleCompleteTask = useCallback((taskId: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const today = getTodayISO();
      const completedTask: Task = {
        ...task,
        status: 'complete',
        completedAt: Date.now(),
        updatedAt: Date.now(),
        version: task.version + 1,
        daysFromTarget: task.targetDate
          ? daysBetween(task.targetDate, today)
          : null,
        daysFromDeadline: task.deadlineDate
          ? daysBetween(task.deadlineDate, today)
          : null,
      };

      const newTasks = prev.tasks.map((t) =>
        t.id === taskId ? completedTask : t
      );

      logTaskCompleted(completedTask, newTasks);

      return {
        ...prev,
        tasks: newTasks,
      };
    });
  }, []);

  // Delete a task (soft delete)
  const handleDeleteTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              deletedAt: Date.now(),
              updatedAt: Date.now(),
            }
          : task
      ),
      activeTaskId: prev.activeTaskId === taskId ? null : prev.activeTaskId,
      currentView: prev.activeTaskId === taskId ? 'dashboard' : prev.currentView,
    }));
  }, []);

  // ============================================
  // Navigation
  // ============================================

  const navigateToDashboard = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentView: 'dashboard',
      activeTaskId: null,
    }));
  }, []);

  const navigateToTaskDetail = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      currentView: 'taskDetail',
      activeTaskId: taskId,
    }));
  }, []);

  // ============================================
  // Legacy Handlers (for existing components)
  // ============================================

  // Handle title change (update active task)
  const handleTitleChange = useCallback((title: string) => {
    if (!state.activeTaskId) return;
    handleUpdateTask(state.activeTaskId, { title });
  }, [state.activeTaskId, handleUpdateTask]);

  // Handle task notes change
  const handleTaskNotesChange = useCallback((notes: string) => {
    if (!state.activeTaskId) return;
    handleUpdateTask(state.activeTaskId, { description: notes });
  }, [state.activeTaskId, handleUpdateTask]);

  // Handle steps change
  const handleStepsChange = useCallback((steps: Step[]) => {
    if (!state.activeTaskId) return;
    handleUpdateTask(state.activeTaskId, { steps });
  }, [state.activeTaskId, handleUpdateTask]);

  // Handle step text update (for focus mode editing)
  const handleStepTextUpdate = useCallback((stepId: string, newText: string) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    const newSteps = task.steps.map((step) =>
      step.id === stepId ? { ...step, text: newText, wasEdited: true } : step
    );
    handleUpdateTask(state.activeTaskId, { steps: newSteps });
  }, [state.activeTaskId, state.tasks, handleUpdateTask]);

  // Handle substep text update (for focus mode editing)
  const handleSubstepTextUpdate = useCallback((stepId: string, substepId: string, newText: string) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    const newSteps = task.steps.map((step) =>
      step.id === stepId
        ? {
            ...step,
            substeps: step.substeps.map((sub) =>
              sub.id === substepId ? { ...sub, text: newText } : sub
            ),
          }
        : step
    );
    handleUpdateTask(state.activeTaskId, { steps: newSteps });
  }, [state.activeTaskId, state.tasks, handleUpdateTask]);

  // Skip step from task list (mark as not needed)
  const handleSkipStep = useCallback((stepId: string) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    const newSteps = task.steps.map((step) =>
      step.id === stepId ? { ...step, skipped: true } : step
    );
    handleUpdateTask(state.activeTaskId, { steps: newSteps });
  }, [state.activeTaskId, state.tasks, handleUpdateTask]);

  // Unskip step (reactivate)
  const handleUnskipStep = useCallback((stepId: string) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    const newSteps = task.steps.map((step) =>
      step.id === stepId ? { ...step, skipped: false } : step
    );
    handleUpdateTask(state.activeTaskId, { steps: newSteps });
  }, [state.activeTaskId, state.tasks, handleUpdateTask]);

  // Skip substep from task list (mark as not needed)
  const handleSkipSubstep = useCallback((stepId: string, substepId: string) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    const newSteps = task.steps.map((step) =>
      step.id === stepId
        ? {
            ...step,
            substeps: step.substeps.map((sub) =>
              sub.id === substepId ? { ...sub, skipped: true } : sub
            ),
          }
        : step
    );
    handleUpdateTask(state.activeTaskId, { steps: newSteps });
  }, [state.activeTaskId, state.tasks, handleUpdateTask]);

  // Unskip substep (reactivate)
  const handleUnskipSubstep = useCallback((stepId: string, substepId: string) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    const newSteps = task.steps.map((step) =>
      step.id === stepId
        ? {
            ...step,
            substeps: step.substeps.map((sub) =>
              sub.id === substepId ? { ...sub, skipped: false } : sub
            ),
          }
        : step
    );
    handleUpdateTask(state.activeTaskId, { steps: newSteps });
  }, [state.activeTaskId, state.tasks, handleUpdateTask]);

  // Move substep up
  const handleSubstepMoveUp = useCallback((stepId: string, substepId: string) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    const newSteps = task.steps.map((step) => {
      if (step.id !== stepId) return step;
      const index = step.substeps.findIndex((sub) => sub.id === substepId);
      if (index <= 0) return step;
      const newSubsteps = [...step.substeps];
      [newSubsteps[index - 1], newSubsteps[index]] = [newSubsteps[index], newSubsteps[index - 1]];
      // Renumber substeps
      const renumbered = newSubsteps.map((sub, i) => ({
        ...sub,
        id: `${step.id}${String.fromCharCode(97 + i)}`,
      }));
      return { ...step, substeps: renumbered };
    });
    handleUpdateTask(state.activeTaskId, { steps: newSteps });
  }, [state.activeTaskId, state.tasks, handleUpdateTask]);

  // Move substep down
  const handleSubstepMoveDown = useCallback((stepId: string, substepId: string) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    const newSteps = task.steps.map((step) => {
      if (step.id !== stepId) return step;
      const index = step.substeps.findIndex((sub) => sub.id === substepId);
      if (index < 0 || index >= step.substeps.length - 1) return step;
      const newSubsteps = [...step.substeps];
      [newSubsteps[index], newSubsteps[index + 1]] = [newSubsteps[index + 1], newSubsteps[index]];
      // Renumber substeps
      const renumbered = newSubsteps.map((sub, i) => ({
        ...sub,
        id: `${step.id}${String.fromCharCode(97 + i)}`,
      }));
      return { ...step, substeps: renumbered };
    });
    handleUpdateTask(state.activeTaskId, { steps: newSteps });
  }, [state.activeTaskId, state.tasks, handleUpdateTask]);

  // Delete substep
  const handleSubstepDelete = useCallback((stepId: string, substepId: string) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    const newSteps = task.steps.map((step) => {
      if (step.id !== stepId) return step;
      const newSubsteps = step.substeps.filter((sub) => sub.id !== substepId);
      // Renumber remaining substeps
      const renumbered = newSubsteps.map((sub, i) => ({
        ...sub,
        id: `${step.id}${String.fromCharCode(97 + i)}`,
      }));
      return { ...step, substeps: renumbered };
    });
    handleUpdateTask(state.activeTaskId, { steps: newSteps });
  }, [state.activeTaskId, state.tasks, handleUpdateTask]);

  // Handle drawer toggle
  const handleDrawerToggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      aiDrawer: { ...prev.aiDrawer, isOpen: !prev.aiDrawer.isOpen },
    }));
  }, []);

  // Enter focus mode on a specific step
  const enterFocusMode = useCallback((stepId: string) => {
    const taskId = state.activeTaskId;
    if (!taskId) return;

    const sessionId = generateId();
    const focusSessionsToday = countFocusSessionsToday();

    logFocusStarted(taskId, stepId, sessionId, state.tasks, focusSessionsToday);

    setState((prev) => ({
      ...prev,
      currentView: 'focusMode',
      currentSessionId: sessionId,
      focusMode: {
        active: true,
        taskId,
        stepId,
        paused: false,
        startTime: Date.now(),
        pausedTime: 0,
        pauseStartTime: null,
      },
      // Update task: transition inbox → active, set first focus time
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === 'inbox' ? 'active' : t.status,
              firstFocusedAt: t.firstFocusedAt || Date.now(),
            }
          : t
      ),
    }));
  }, [state.activeTaskId, state.tasks]);

  // Exit focus mode
  const exitFocusMode = useCallback(() => {
    const { focusMode, currentSessionId, tasks } = state;
    if (focusMode.taskId && currentSessionId && focusMode.startTime) {
      const totalMinutes = Math.floor(
        (Date.now() - focusMode.startTime - focusMode.pausedTime) / 60000
      );
      const task = tasks.find((t) => t.id === focusMode.taskId);
      const stepsCompleted = task?.steps.filter((s) => s.completed).length || 0;

      logFocusEnded(
        focusMode.taskId,
        currentSessionId,
        totalMinutes,
        stepsCompleted,
        task?.status === 'complete' ? 'completed_task' : 'made_progress',
        tasks
      );
    }

    setState((prev) => ({
      ...prev,
      currentView: prev.activeTaskId ? 'taskDetail' : 'dashboard',
      currentSessionId: null,
      focusMode: initialFocusModeState,
    }));
  }, [state.focusMode, state.currentSessionId, state.tasks]);

  // Toggle pause/continue in focus mode
  const togglePause = useCallback(() => {
    setState((prev) => {
      if (!prev.focusMode.active) return prev;

      if (prev.focusMode.paused) {
        // Continuing: add paused duration to pausedTime
        const pausedDuration = prev.focusMode.pauseStartTime
          ? Date.now() - prev.focusMode.pauseStartTime
          : 0;
        return {
          ...prev,
          focusMode: {
            ...prev.focusMode,
            paused: false,
            pausedTime: prev.focusMode.pausedTime + pausedDuration,
            pauseStartTime: null,
          },
        };
      } else {
        // Pausing: record when pause started
        return {
          ...prev,
          focusMode: {
            ...prev.focusMode,
            paused: true,
            pauseStartTime: Date.now(),
          },
        };
      }
    });
  }, []);

  // Toggle substep completion in focus mode
  const handleFocusModeSubstepToggle = useCallback((substepId: string) => {
    const taskId = state.focusMode.taskId;
    const stepId = state.focusMode.stepId;
    if (!taskId || !stepId) return;

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              steps: task.steps.map((step) =>
                step.id === stepId
                  ? {
                      ...step,
                      substeps: step.substeps.map((sub) =>
                        sub.id === substepId
                          ? { ...sub, completed: !sub.completed, completedAt: !sub.completed ? Date.now() : null }
                          : sub
                      ),
                    }
                  : step
              ),
              updatedAt: Date.now(),
            }
          : task
      ),
    }));
  }, [state.focusMode.taskId, state.focusMode.stepId]);

  // Mark current step as done and advance to next incomplete step
  const handleStepDone = useCallback(() => {
    const taskId = state.focusMode.taskId;
    const currentStepId = state.focusMode.stepId;
    if (!taskId || !currentStepId) return;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      // Mark current step as completed
      const newSteps = task.steps.map((step) =>
        step.id === currentStepId
          ? { ...step, completed: true, completedAt: Date.now() }
          : step
      );

      // Log step completed
      logStepCompleted(taskId, currentStepId, prev.tasks);

      // Find next incomplete step (after current)
      const currentIndex = newSteps.findIndex((s) => s.id === currentStepId);
      const nextIncompleteStep = newSteps.find(
        (step, index) => index > currentIndex && !step.completed && !step.skipped
      );

      // If no next step after current, check for any remaining incomplete step
      const anyIncompleteStep = nextIncompleteStep || newSteps.find((step) => !step.completed && !step.skipped);

      // Update task
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              steps: newSteps,
              updatedAt: Date.now(),
            }
          : t
      );

      // If all steps complete, mark task complete and exit focus mode
      if (!anyIncompleteStep) {
        const completedTask = {
          ...task,
          steps: newSteps,
          status: 'complete' as const,
          completedAt: Date.now(),
          updatedAt: Date.now(),
        };

        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? completedTask : t)),
          currentView: prev.activeTaskId ? 'taskDetail' : 'dashboard',
          focusMode: initialFocusModeState,
        };
      }

      // Advance to next incomplete step
      return {
        ...prev,
        tasks: updatedTasks,
        focusMode: {
          ...prev.focusMode,
          stepId: anyIncompleteStep.id,
        },
      };
    });
  }, [state.focusMode.taskId, state.focusMode.stepId]);

  // Skip current step (mark as not needed) and advance
  const handleStepSkip = useCallback(() => {
    const taskId = state.focusMode.taskId;
    const currentStepId = state.focusMode.stepId;
    if (!taskId || !currentStepId) return;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      // Mark current step as skipped
      const newSteps = task.steps.map((step) =>
        step.id === currentStepId ? { ...step, skipped: true } : step
      );

      // Find next non-completed, non-skipped step
      const currentIndex = newSteps.findIndex((s) => s.id === currentStepId);
      const nextActiveStep = newSteps.find(
        (step, index) => index > currentIndex && !step.completed && !step.skipped
      ) || newSteps.find((step) => !step.completed && !step.skipped);

      // Update task
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId
          ? { ...t, steps: newSteps, updatedAt: Date.now() }
          : t
      );

      // If all steps done/skipped, exit focus mode
      if (!nextActiveStep) {
        return {
          ...prev,
          tasks: updatedTasks,
          currentView: prev.activeTaskId ? 'taskDetail' : 'dashboard',
          focusMode: initialFocusModeState,
        };
      }

      // Advance to next active step
      return {
        ...prev,
        tasks: updatedTasks,
        focusMode: {
          ...prev.focusMode,
          stepId: nextActiveStep.id,
        },
      };
    });
  }, [state.focusMode.taskId, state.focusMode.stepId]);

  // Calculate elapsed time in seconds
  const calculateElapsedTime = useCallback((): number => {
    const { focusMode } = state;
    if (!focusMode.active || !focusMode.startTime) return 0;

    const now = Date.now();
    let elapsed = now - focusMode.startTime - focusMode.pausedTime;

    // If currently paused, don't count time since pause started
    if (focusMode.paused && focusMode.pauseStartTime) {
      elapsed -= (now - focusMode.pauseStartTime);
    }

    return Math.floor(elapsed / 1000);
  }, [state.focusMode]);

  // Timer state for display (updates every second)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer interval effect
  useEffect(() => {
    if (!state.focusMode.active) {
      setElapsedSeconds(0);
      return;
    }

    // Update immediately
    setElapsedSeconds(calculateElapsedTime());

    // Only run interval if not paused
    if (state.focusMode.paused) return;

    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [state.focusMode.active, state.focusMode.paused, state.focusMode.startTime, calculateElapsedTime]);

  // ============================================
  // AI & Staging Area Handlers
  // ============================================

  // Accept one suggestion
  const handleAcceptOne = useCallback((suggestion: SuggestedStep) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    let newSteps = [...task.steps];
    let newSuggestions = state.suggestions.filter((s) => s.id !== suggestion.id);

    // If suggestion has parentStepId, add as substep to that step
    if (suggestion.parentStepId) {
      newSteps = newSteps.map((step) => {
        if (step.id === suggestion.parentStepId) {
          const newSubstepId = `${step.id}${String.fromCharCode(97 + step.substeps.length)}`;
          return {
            ...step,
            substeps: [
              ...step.substeps,
              {
                id: newSubstepId,
                text: suggestion.text,
                shortLabel: null,
                completed: false,
                completedAt: null,
                source: 'ai_suggested' as const,
              },
            ],
          };
        }
        return step;
      });
    } else {
      // Otherwise, add as new top-level step
      const newStep: Step = {
        id: String(task.steps.length + 1),
        text: suggestion.text,
        shortLabel: null,
        substeps: suggestion.substeps.map((sub, i) => ({
          id: `${task.steps.length + 1}${String.fromCharCode(97 + i)}`,
          text: sub.text,
          shortLabel: null,
          completed: false,
          completedAt: null,
          source: 'ai_suggested' as const,
        })),
        completed: false,
        completedAt: null,
        estimatedMinutes: null,
        timeSpent: 0,
        timesStuck: 0,
        source: 'ai_suggested',
        wasEdited: false,
        complexity: null,
      };
      newSteps = [...newSteps, newStep];
    }

    handleUpdateTask(state.activeTaskId, { steps: newSteps, aiSuggestionsAccepted: task.aiSuggestionsAccepted + 1 });
    setState((prev) => ({ ...prev, suggestions: newSuggestions }));
  }, [state.activeTaskId, state.tasks, state.suggestions, handleUpdateTask]);

  // Accept all suggestions and edits
  const handleAcceptAll = useCallback(() => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    // First, apply all edits in-place
    let updatedSteps = task.steps.map((step) => {
      // Check if this step has an edit
      const stepEdit = state.edits.find(
        (e) => e.targetType === "step" && e.targetId === step.id
      );
      let newStep = stepEdit ? { ...step, text: stepEdit.newText, wasEdited: true } : step;

      // Check if any substeps have edits
      const substepEdits = state.edits.filter(
        (e) => e.targetType === "substep" && e.parentId === step.id
      );
      if (substepEdits.length > 0) {
        newStep = {
          ...newStep,
          substeps: newStep.substeps.map((sub) => {
            const subEdit = substepEdits.find((e) => e.targetId === sub.id);
            return subEdit ? { ...sub, text: subEdit.newText } : sub;
          }),
        };
      }

      // Check for substep suggestions for this step
      const substepSuggestions = state.suggestions.filter(
        (s) => s.parentStepId === step.id
      );
      if (substepSuggestions.length > 0) {
        newStep = {
          ...newStep,
          substeps: [
            ...newStep.substeps,
            ...substepSuggestions.map((s, i) => ({
              id: `${step.id}${String.fromCharCode(97 + newStep.substeps.length + i)}`,
              text: s.text,
              shortLabel: null,
              completed: false,
              completedAt: null,
              source: 'ai_suggested' as const,
            })),
          ],
        };
      }

      return newStep;
    });

    // Then, append all new top-level suggestions (those without parentStepId)
    const topLevelSuggestions = state.suggestions.filter((s) => !s.parentStepId);
    const newSteps: Step[] = topLevelSuggestions.map((suggestion, i) => ({
      id: String(updatedSteps.length + 1 + i),
      text: suggestion.text,
      shortLabel: null,
      substeps: suggestion.substeps.map((sub, j) => ({
        id: `${updatedSteps.length + 1 + i}${String.fromCharCode(97 + j)}`,
        text: sub.text,
        shortLabel: null,
        completed: false,
        completedAt: null,
        source: 'ai_suggested' as const,
      })),
      completed: false,
      completedAt: null,
      estimatedMinutes: null,
      timeSpent: 0,
      timesStuck: 0,
      source: 'ai_suggested',
      wasEdited: false,
      complexity: null,
    }));

    handleUpdateTask(state.activeTaskId, {
      steps: [...updatedSteps, ...newSteps],
      aiSuggestionsAccepted: task.aiSuggestionsAccepted + state.suggestions.length,
    });
    setState((prev) => ({ ...prev, suggestions: [], edits: [] }));
  }, [state.activeTaskId, state.tasks, state.suggestions, state.edits, handleUpdateTask]);

  // Dismiss all suggestions and edits
  const handleDismiss = useCallback(() => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (task) {
      handleUpdateTask(state.activeTaskId, {
        aiSuggestionsRejected: task.aiSuggestionsRejected + state.suggestions.length,
      });
    }
    setState((prev) => ({ ...prev, suggestions: [], edits: [], suggestedTitle: null }));
  }, [state.activeTaskId, state.tasks, state.suggestions, handleUpdateTask]);

  // Accept suggested title
  const handleAcceptTitle = useCallback(() => {
    if (!state.activeTaskId || !state.suggestedTitle) return;
    handleUpdateTask(state.activeTaskId, { title: state.suggestedTitle });
    setState((prev) => ({ ...prev, suggestedTitle: null }));
  }, [state.activeTaskId, state.suggestedTitle, handleUpdateTask]);

  // Reject suggested title
  const handleRejectTitle = useCallback(() => {
    setState((prev) => ({ ...prev, suggestedTitle: null }));
  }, []);

  // Accept an edit - update the target step/substep, preserve completion status
  const handleAcceptEdit = useCallback((edit: EditSuggestion) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    const newSteps = task.steps.map((step) => {
      if (edit.targetType === "step" && step.id === edit.targetId) {
        return { ...step, text: edit.newText, wasEdited: true };
      }
      if (edit.targetType === "substep" && step.id === edit.parentId) {
        return {
          ...step,
          substeps: step.substeps.map((sub) =>
            sub.id === edit.targetId ? { ...sub, text: edit.newText } : sub
          ),
        };
      }
      return step;
    });

    handleUpdateTask(state.activeTaskId, { steps: newSteps });
    setState((prev) => ({
      ...prev,
      edits: prev.edits.filter((e) => e.targetId !== edit.targetId),
    }));
  }, [state.activeTaskId, state.tasks, handleUpdateTask]);

  // Reject an edit - just remove from edits array
  const handleRejectEdit = useCallback((edit: EditSuggestion) => {
    setState((prev) => ({
      ...prev,
      edits: prev.edits.filter((e) => e.targetId !== edit.targetId),
    }));
  }, []);

  // Send message to AI (planning mode)
  const handleSendMessage = useCallback(async (userMessage: string) => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find((t) => t.id === state.activeTaskId);
    if (!task) return;

    setState((prev) => ({
      ...prev,
      aiDrawer: { ...prev.aiDrawer, isLoading: true },
      error: null,
    }));

    // Add user message
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };

    // Add user message to task's messages (not global)
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === state.activeTaskId
          ? { ...t, messages: [...t.messages, newUserMessage], updatedAt: Date.now() }
          : t
      ),
    }));

    try {
      const response = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          currentList: task.steps.length > 0 ? task.steps : null,
          taskTitle: task.title,  // Always include task title for context
          conversationHistory: task.messages,  // Use task's messages
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data: StructureResponse = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: JSON.stringify(data),
        timestamp: Date.now(),
      };

      setState((prev) => {
        const currentTask = prev.tasks.find((t) => t.id === state.activeTaskId);
        if (!currentTask) return prev;

        let newState = {
          ...prev,
          aiDrawer: {
            ...prev.aiDrawer,
            isLoading: false,
          },
        };

        // Handle different actions
        if (data.action === "replace" && data.steps) {
          // Replace entire list (auto-populate) + transition to active
          const updatedTask = {
            ...currentTask,
            steps: data.steps,
            title: data.taskTitle || currentTask.title,
            status: currentTask.status === 'inbox' ? 'active' : currentTask.status,
            aiAssisted: true,
            messages: [...currentTask.messages, assistantMessage],
            updatedAt: Date.now(),
          };
          newState.tasks = prev.tasks.map((t) =>
            t.id === state.activeTaskId ? updatedTask : t
          );
          newState.suggestions = [];
          newState.edits = [];
        } else if (data.action === "suggest" && data.suggestions) {
          // Add suggestions to staging area
          newState.tasks = prev.tasks.map((t) =>
            t.id === state.activeTaskId
              ? { ...t, messages: [...t.messages, assistantMessage], updatedAt: Date.now() }
              : t
          );
          newState.suggestions = data.suggestions;
        } else if (data.action === "edit") {
          // Add edits to staging area (can also include suggestions)
          newState.tasks = prev.tasks.map((t) =>
            t.id === state.activeTaskId
              ? { ...t, messages: [...t.messages, assistantMessage], updatedAt: Date.now() }
              : t
          );
          if (data.edits) {
            newState.edits = data.edits;
          }
          if (data.suggestions) {
            newState.suggestions = data.suggestions;
          }
        } else {
          // action === "none" - just add the message, no list changes
          newState.tasks = prev.tasks.map((t) =>
            t.id === state.activeTaskId
              ? { ...t, messages: [...t.messages, assistantMessage], updatedAt: Date.now() }
              : t
          );
        }

        // Store suggested title if provided
        if (data.suggestedTitle) {
          newState.suggestedTitle = data.suggestedTitle;
        }

        return newState;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setState((prev) => ({
        ...prev,
        aiDrawer: { ...prev.aiDrawer, isLoading: false },
        error: error instanceof Error ? error.message : "Something went wrong",
      }));
    }
  }, [state.activeTaskId, state.tasks]);

  // Send message to AI in focus mode (with step context)
  const handleFocusModeSendMessage = useCallback(async (userMessage: string) => {
    const taskId = state.focusMode.taskId;
    if (!taskId) return;

    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentStep = task.steps.find((s) => s.id === state.focusMode.stepId) || task.steps[0];
    const stepIndex = task.steps.findIndex((s) => s.id === state.focusMode.stepId);

    setState((prev) => ({
      ...prev,
      aiDrawer: { ...prev.aiDrawer, isLoading: true },
      error: null,
    }));

    // Add user message to focus mode messages
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
      stepId: state.focusMode.stepId || undefined,
    };

    // Add user message to task's focusModeMessages (not global)
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? { ...t, focusModeMessages: [...t.focusModeMessages, newUserMessage], updatedAt: Date.now() }
          : t
      ),
    }));

    try {
      const response = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          currentList: task.steps,
          taskTitle: task.title,
          taskNotes: task.description,
          conversationHistory: task.focusModeMessages,  // Use task's focus mode messages
          // Focus mode context
          focusMode: {
            currentStepId: currentStep?.id,
            currentStepText: currentStep?.text,
            currentSubsteps: currentStep?.substeps || [],
            stepIndex,
            totalSteps: task.steps.length,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data: StructureResponse = await response.json();

      // Add assistant message to focus mode messages
      const assistantMessage: Message = {
        role: "assistant",
        content: JSON.stringify(data),
        timestamp: Date.now(),
        stepId: state.focusMode.stepId || undefined,
      };

      setState((prev) => {
        const currentTask = prev.tasks.find((t) => t.id === taskId);
        if (!currentTask) return prev;

        let newState = {
          ...prev,
          aiDrawer: {
            ...prev.aiDrawer,
            isLoading: false,
          },
        };

        // Handle different actions (same as task list view)
        if (data.action === "replace" && data.steps) {
          const updatedTask = {
            ...currentTask,
            steps: data.steps,
            title: data.taskTitle || currentTask.title,
            focusModeMessages: [...currentTask.focusModeMessages, assistantMessage],
            updatedAt: Date.now(),
          };
          newState.tasks = prev.tasks.map((t) =>
            t.id === taskId ? updatedTask : t
          );
          newState.suggestions = [];
          newState.edits = [];
        } else if (data.action === "suggest" && data.suggestions) {
          newState.tasks = prev.tasks.map((t) =>
            t.id === taskId
              ? { ...t, focusModeMessages: [...t.focusModeMessages, assistantMessage], updatedAt: Date.now() }
              : t
          );
          newState.suggestions = data.suggestions;
        } else if (data.action === "edit") {
          newState.tasks = prev.tasks.map((t) =>
            t.id === taskId
              ? { ...t, focusModeMessages: [...t.focusModeMessages, assistantMessage], updatedAt: Date.now() }
              : t
          );
          if (data.edits) {
            newState.edits = data.edits;
          }
          if (data.suggestions) {
            newState.suggestions = data.suggestions;
          }
        } else {
          // action === "none" - just add the message
          newState.tasks = prev.tasks.map((t) =>
            t.id === taskId
              ? { ...t, focusModeMessages: [...t.focusModeMessages, assistantMessage], updatedAt: Date.now() }
              : t
          );
        }

        return newState;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setState((prev) => ({
        ...prev,
        aiDrawer: { ...prev.aiDrawer, isLoading: false },
        error: error instanceof Error ? error.message : "Something went wrong",
      }));
    }
  }, [state.focusMode.taskId, state.focusMode.stepId, state.tasks]);

  // Clear all data
  const handleClearAll = useCallback(() => {
    if (confirm("Clear all tasks and start fresh?")) {
      localStorage.clear();
      setState(createInitialAppState());
    }
  }, []);

  // ============================================
  // Render
  // ============================================

  // Focus mode view
  if (state.currentView === 'focusMode' && state.focusMode.active) {
    const focusTask = state.tasks.find((t) => t.id === state.focusMode.taskId);
    if (!focusTask) {
      // Task not found, exit focus mode
      exitFocusMode();
      return null;
    }

    const currentStep = focusTask.steps.find((s) => s.id === state.focusMode.stepId) || focusTask.steps[0];
    const stepIndex = focusTask.steps.findIndex((s) => s.id === state.focusMode.stepId);

    return (
      <FocusMode
        taskTitle={focusTask.title}
        steps={focusTask.steps}
        currentStep={currentStep}
        stepIndex={stepIndex}
        totalSteps={focusTask.steps.length}
        completedCount={focusTask.steps.filter((s) => s.completed || s.skipped).length}
        elapsedTime={elapsedSeconds}
        isPaused={state.focusMode.paused}
        taskNotes={focusTask.description || ""}
        onTaskNotesChange={handleTaskNotesChange}
        onDone={handleStepDone}
        onSkip={handleStepSkip}
        onStuck={() => {}}
        onExit={exitFocusMode}
        onPauseToggle={togglePause}
        onSubstepToggle={handleFocusModeSubstepToggle}
        // AI Drawer props
        messages={focusTask.focusModeMessages}
        isLoading={state.aiDrawer.isLoading}
        onSendMessage={handleFocusModeSendMessage}
        // Staging Area props
        suggestions={state.suggestions}
        edits={state.edits}
        onAcceptOne={handleAcceptOne}
        onAcceptEdit={handleAcceptEdit}
        onRejectEdit={handleRejectEdit}
        onAcceptAll={handleAcceptAll}
        onDismissSuggestions={handleDismiss}
        // Editing props
        onStepUpdate={handleStepTextUpdate}
        onSubstepUpdate={handleSubstepTextUpdate}
        // Substep menu props
        onSubstepSkip={handleSkipSubstep}
        onSubstepUnskip={handleUnskipSubstep}
        onSubstepMoveUp={handleSubstepMoveUp}
        onSubstepMoveDown={handleSubstepMoveDown}
        onSubstepDelete={handleSubstepDelete}
      />
    );
  }

  // Dashboard view
  if (state.currentView === 'dashboard') {
    return (
      <Dashboard
        tasks={state.tasks.filter((t) => !t.deletedAt)}
        onCreateTask={handleCreateTask}
        onSelectTask={navigateToTaskDetail}
        onEnterFocus={(taskId, stepId) => {
          navigateToTaskDetail(taskId);
          // Slight delay to ensure activeTaskId is set
          setTimeout(() => enterFocusMode(stepId), 0);
        }}
      />
    );
  }

  // Task Detail view (legacy task list view)
  return (
    <div className="h-screen flex flex-col lg:flex-row lg:overflow-hidden">
      {/* Left side: header + content (full height on desktop) */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="h-14 px-6 flex items-center border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={navigateToDashboard}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                Task Details
              </h1>
            </div>
            <button
              onClick={handleClearAll}
              className="text-sm text-neutral-400 hover:text-neutral-600
                         dark:hover:text-neutral-300 transition-colors"
            >
              Clear all
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden lg:overflow-visible">
          {/* Task List View - content centers in available space */}
          <div className={`
            flex-1 overflow-y-auto px-6 pt-6 pb-6
            ${state.aiDrawer.isOpen ? "mb-[50vh]" : ""}
            lg:mb-0
          `}>
            <div className="w-full max-w-3xl mx-auto">
              <TaskList
                title={activeTask?.title || ""}
                steps={activeSteps}
                onTitleChange={handleTitleChange}
                onStepsChange={handleStepsChange}
                onEnterFocus={enterFocusMode}
                onSkipStep={handleSkipStep}
                onUnskipStep={handleUnskipStep}
                onSkipSubstep={handleSkipSubstep}
                onUnskipSubstep={handleUnskipSubstep}
              />

              {/* Staging Area - inline under steps (if visible) */}
              <div className="mt-4">
                <StagingArea
                  suggestions={state.suggestions}
                  edits={state.edits}
                  suggestedTitle={state.suggestedTitle}
                  currentTitle={activeTask?.title}
                  onAcceptOne={handleAcceptOne}
                  onAcceptEdit={handleAcceptEdit}
                  onRejectEdit={handleRejectEdit}
                  onAcceptTitle={handleAcceptTitle}
                  onRejectTitle={handleRejectTitle}
                  onAcceptAll={handleAcceptAll}
                  onDismiss={handleDismiss}
                />
              </div>

              {/* Notes Module - inline under staging/steps */}
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <NotesModule
                  notes={activeTask?.description || ""}
                  onChange={handleTaskNotesChange}
                  collapsible={false}
                />
              </div>

              {/* Spacer when drawer is open on mobile */}
              {state.aiDrawer.isOpen && (
                <div className="h-16 lg:hidden" />
              )}
            </div>
          </div>

          {/* Error display */}
          {state.error && (
            <div className="fixed bottom-16 left-0 right-0 mx-auto max-w-3xl px-6 z-30">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{state.error}</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Right side: AI Drawer - full height on desktop, fixed bottom on mobile */}
      <AIDrawer
        messages={activeTask?.messages || []}
        isOpen={state.aiDrawer.isOpen}
        isLoading={state.aiDrawer.isLoading}
        onToggle={handleDrawerToggle}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
