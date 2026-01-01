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
} from "@/lib/types";
import { STORAGE_KEY } from "@/lib/prompts";
import TaskList from "@/components/TaskList";
import StagingArea from "@/components/StagingArea";
import NotesModule from "@/components/NotesModule";
import AIDrawer from "@/components/AIDrawer";
import FocusMode from "@/components/FocusMode";

// Initial focus mode state
const initialFocusModeState: FocusModeState = {
  active: false,
  stepId: null,
  paused: false,
  startTime: null,
  pausedTime: 0,
  pauseStartTime: null,
};

// Initial state
const initialState: AppState = {
  taskTitle: "My Tasks",
  taskNotes: "",  // Single notes module for entire task
  steps: [],
  suggestions: [],
  edits: [],
  messages: [],
  focusModeMessages: [],  // Separate thread for focus mode AI chat
  isDrawerOpen: true, // Open by default when list is empty
  isLoading: false,
  error: null,
  focusMode: initialFocusModeState,
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Load state from localStorage after hydration (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Handle focus mode restoration:
        // - If was paused → restore full state (timer preserved)
        // - If was active but not paused → reset to inactive (timer lost)
        let focusMode = initialFocusModeState;
        if (parsed.focusMode?.active && parsed.focusMode?.paused) {
          focusMode = {
            active: true,
            stepId: parsed.focusMode.stepId,
            paused: true,
            startTime: parsed.focusMode.startTime,
            pausedTime: parsed.focusMode.pausedTime || 0,
            pauseStartTime: parsed.focusMode.pauseStartTime,
          };
        }

        setState({
          ...initialState,
          taskTitle: parsed.taskTitle || initialState.taskTitle,
          taskNotes: parsed.taskNotes || "",
          steps: parsed.steps || [],
          suggestions: parsed.suggestions || [],
          edits: parsed.edits || [],
          messages: parsed.messages || [],
          focusModeMessages: parsed.focusModeMessages || [],
          focusMode,
          // Keep drawer open if list is empty and not in focus mode
          isDrawerOpen: (parsed.steps?.length || 0) === 0 && !focusMode.active,
        });
      }
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }
    setHasHydrated(true);
  }, []);

  // Save state to localStorage when it changes (only after hydration)
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      const toSave = {
        taskTitle: state.taskTitle,
        taskNotes: state.taskNotes,
        steps: state.steps,
        messages: state.messages,
        focusModeMessages: state.focusModeMessages,  // Persist focus mode chat
        // Only save focus mode if paused (to preserve timer on refresh)
        focusMode: state.focusMode.paused ? state.focusMode : null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }, [state.taskTitle, state.taskNotes, state.steps, state.messages, state.focusModeMessages, state.focusMode]);

  // Handle title change
  const handleTitleChange = useCallback((title: string) => {
    setState((prev) => ({ ...prev, taskTitle: title }));
  }, []);

  // Handle task notes change
  const handleTaskNotesChange = useCallback((notes: string) => {
    setState((prev) => ({ ...prev, taskNotes: notes }));
  }, []);

  // Handle steps change
  const handleStepsChange = useCallback((steps: Step[]) => {
    setState((prev) => ({ ...prev, steps }));
  }, []);

  // Handle step text update (for focus mode editing)
  const handleStepTextUpdate = useCallback((stepId: string, newText: string) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, text: newText } : step
      ),
    }));
  }, []);

  // Handle substep text update (for focus mode editing)
  const handleSubstepTextUpdate = useCallback((stepId: string, substepId: string, newText: string) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              substeps: step.substeps.map((sub) =>
                sub.id === substepId ? { ...sub, text: newText } : sub
              ),
            }
          : step
      ),
    }));
  }, []);

  // Skip step from task list (mark as not needed)
  const handleSkipStep = useCallback((stepId: string) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, skipped: true } : step
      ),
    }));
  }, []);

  // Unskip step (reactivate)
  const handleUnskipStep = useCallback((stepId: string) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, skipped: false } : step
      ),
    }));
  }, []);

  // Skip substep from task list (mark as not needed)
  const handleSkipSubstep = useCallback((stepId: string, substepId: string) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              substeps: step.substeps.map((sub) =>
                sub.id === substepId ? { ...sub, skipped: true } : sub
              ),
            }
          : step
      ),
    }));
  }, []);

  // Unskip substep (reactivate)
  const handleUnskipSubstep = useCallback((stepId: string, substepId: string) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              substeps: step.substeps.map((sub) =>
                sub.id === substepId ? { ...sub, skipped: false } : sub
              ),
            }
          : step
      ),
    }));
  }, []);

  // Move substep up
  const handleSubstepMoveUp = useCallback((stepId: string, substepId: string) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
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
      }),
    }));
  }, []);

  // Move substep down
  const handleSubstepMoveDown = useCallback((stepId: string, substepId: string) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
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
      }),
    }));
  }, []);

  // Delete substep
  const handleSubstepDelete = useCallback((stepId: string, substepId: string) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
        if (step.id !== stepId) return step;
        const newSubsteps = step.substeps.filter((sub) => sub.id !== substepId);
        // Renumber remaining substeps
        const renumbered = newSubsteps.map((sub, i) => ({
          ...sub,
          id: `${step.id}${String.fromCharCode(97 + i)}`,
        }));
        return { ...step, substeps: renumbered };
      }),
    }));
  }, []);

  // Handle drawer toggle
  const handleDrawerToggle = useCallback(() => {
    setState((prev) => ({ ...prev, isDrawerOpen: !prev.isDrawerOpen }));
  }, []);

  // Enter focus mode on a specific step
  const enterFocusMode = useCallback((stepId: string) => {
    setState((prev) => ({
      ...prev,
      focusMode: {
        active: true,
        stepId,
        paused: false,
        startTime: Date.now(),
        pausedTime: 0,
        pauseStartTime: null,
      },
    }));
  }, []);

  // Exit focus mode
  const exitFocusMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      focusMode: initialFocusModeState,
    }));
  }, []);

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
    setState((prev) => {
      const currentStepId = prev.focusMode.stepId;
      if (!currentStepId) return prev;

      return {
        ...prev,
        steps: prev.steps.map((step) =>
          step.id === currentStepId
            ? {
                ...step,
                substeps: step.substeps.map((sub) =>
                  sub.id === substepId ? { ...sub, completed: !sub.completed } : sub
                ),
              }
            : step
        ),
      };
    });
  }, []);

  // Mark current step as done and advance to next incomplete step
  const handleStepDone = useCallback(() => {
    setState((prev) => {
      const currentStepId = prev.focusMode.stepId;
      if (!currentStepId) return prev;

      // Mark current step as completed
      const newSteps = prev.steps.map((step) =>
        step.id === currentStepId ? { ...step, completed: true } : step
      );

      // Find next incomplete step (after current)
      const currentIndex = newSteps.findIndex((s) => s.id === currentStepId);
      const nextIncompleteStep = newSteps.find(
        (step, index) => index > currentIndex && !step.completed
      );

      // If no next step after current, check for any remaining incomplete step
      const anyIncompleteStep = nextIncompleteStep || newSteps.find((step) => !step.completed);

      // If all steps complete, exit focus mode
      if (!anyIncompleteStep) {
        return {
          ...prev,
          steps: newSteps,
          focusMode: initialFocusModeState,
        };
      }

      // Advance to next incomplete step
      return {
        ...prev,
        steps: newSteps,
        focusMode: {
          ...prev.focusMode,
          stepId: anyIncompleteStep.id,
        },
      };
    });
  }, []);

  // Skip current step (mark as not needed) and advance
  const handleStepSkip = useCallback(() => {
    setState((prev) => {
      const currentStepId = prev.focusMode.stepId;
      if (!currentStepId) return prev;

      // Mark current step as skipped
      const newSteps = prev.steps.map((step) =>
        step.id === currentStepId ? { ...step, skipped: true } : step
      );

      // Find next non-completed, non-skipped step
      const currentIndex = newSteps.findIndex((s) => s.id === currentStepId);
      const nextActiveStep = newSteps.find(
        (step, index) => index > currentIndex && !step.completed && !step.skipped
      ) || newSteps.find((step) => !step.completed && !step.skipped);

      // If all steps done/skipped, exit focus mode
      if (!nextActiveStep) {
        return {
          ...prev,
          steps: newSteps,
          focusMode: initialFocusModeState,
        };
      }

      // Advance to next active step
      return {
        ...prev,
        steps: newSteps,
        focusMode: {
          ...prev.focusMode,
          stepId: nextActiveStep.id,
        },
      };
    });
  }, []);

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

  // Accept one suggestion
  const handleAcceptOne = useCallback((suggestion: SuggestedStep) => {
    setState((prev) => {
      // If suggestion has parentStepId, add as substep to that step
      if (suggestion.parentStepId) {
        const newSteps = prev.steps.map((step) => {
          if (step.id === suggestion.parentStepId) {
            // Generate substep ID based on existing substeps
            const newSubstepId = `${step.id}${String.fromCharCode(97 + step.substeps.length)}`;
            return {
              ...step,
              substeps: [
                ...step.substeps,
                {
                  id: newSubstepId,
                  text: suggestion.text,
                  completed: false,
                },
              ],
            };
          }
          return step;
        });

        return {
          ...prev,
          steps: newSteps,
          suggestions: prev.suggestions.filter((s) => s.id !== suggestion.id),
        };
      }

      // Otherwise, add as new top-level step
      const newStep: Step = {
        id: String(prev.steps.length + 1),
        text: suggestion.text,
        substeps: suggestion.substeps.map((sub, i) => ({
          id: `${prev.steps.length + 1}${String.fromCharCode(97 + i)}`,
          text: sub.text,
          completed: false,
        })),
        completed: false,
      };

      // Remove from suggestions
      const newSuggestions = prev.suggestions.filter(
        (s) => s.id !== suggestion.id
      );

      // Renumber remaining suggestions (only for non-substep suggestions)
      const renumberedSuggestions = newSuggestions
        .filter((s) => !s.parentStepId)
        .map((s, i) => ({
          ...s,
          id: String(prev.steps.length + 2 + i),
        }));

      // Keep substep suggestions as-is
      const substepSuggestions = newSuggestions.filter((s) => s.parentStepId);

      return {
        ...prev,
        steps: [...prev.steps, newStep],
        suggestions: [...renumberedSuggestions, ...substepSuggestions],
      };
    });
  }, []);

  // Accept all suggestions and edits
  const handleAcceptAll = useCallback(() => {
    setState((prev) => {
      // First, apply all edits in-place
      let updatedSteps = prev.steps.map((step) => {
        // Check if this step has an edit
        const stepEdit = prev.edits.find(
          (e) => e.targetType === "step" && e.targetId === step.id
        );
        if (stepEdit) {
          step = { ...step, text: stepEdit.newText };
        }

        // Check if any substeps have edits
        const substepEdits = prev.edits.filter(
          (e) => e.targetType === "substep" && e.parentId === step.id
        );
        if (substepEdits.length > 0) {
          step = {
            ...step,
            substeps: step.substeps.map((sub) => {
              const subEdit = substepEdits.find((e) => e.targetId === sub.id);
              return subEdit ? { ...sub, text: subEdit.newText } : sub;
            }),
          };
        }

        // Check for substep suggestions for this step
        const substepSuggestions = prev.suggestions.filter(
          (s) => s.parentStepId === step.id
        );
        if (substepSuggestions.length > 0) {
          step = {
            ...step,
            substeps: [
              ...step.substeps,
              ...substepSuggestions.map((s, i) => ({
                id: `${step.id}${String.fromCharCode(97 + step.substeps.length + i)}`,
                text: s.text,
                completed: false,
              })),
            ],
          };
        }

        return step;
      });

      // Then, append all new top-level suggestions (those without parentStepId)
      const topLevelSuggestions = prev.suggestions.filter((s) => !s.parentStepId);
      const newSteps: Step[] = topLevelSuggestions.map((suggestion, i) => ({
        id: String(updatedSteps.length + 1 + i),
        text: suggestion.text,
        substeps: suggestion.substeps.map((sub, j) => ({
          id: `${updatedSteps.length + 1 + i}${String.fromCharCode(97 + j)}`,
          text: sub.text,
          completed: false,
        })),
        completed: false,
      }));

      return {
        ...prev,
        steps: [...updatedSteps, ...newSteps],
        suggestions: [],
        edits: [],
      };
    });
  }, []);

  // Dismiss all suggestions and edits
  const handleDismiss = useCallback(() => {
    setState((prev) => ({ ...prev, suggestions: [], edits: [] }));
  }, []);

  // Accept an edit - update the target step/substep, preserve completion status
  const handleAcceptEdit = useCallback((edit: EditSuggestion) => {
    setState((prev) => {
      const newSteps = prev.steps.map((step) => {
        if (edit.targetType === "step" && step.id === edit.targetId) {
          return { ...step, text: edit.newText }; // Preserve completed
        }
        if (edit.targetType === "substep" && step.id === edit.parentId) {
          return {
            ...step,
            substeps: step.substeps.map((sub) =>
              sub.id === edit.targetId
                ? { ...sub, text: edit.newText } // Preserve completed
                : sub
            ),
          };
        }
        return step;
      });

      return {
        ...prev,
        steps: newSteps,
        edits: prev.edits.filter((e) => e.targetId !== edit.targetId),
      };
    });
  }, []);

  // Reject an edit - just remove from edits array
  const handleRejectEdit = useCallback((edit: EditSuggestion) => {
    setState((prev) => ({
      ...prev,
      edits: prev.edits.filter((e) => e.targetId !== edit.targetId),
    }));
  }, []);

  // Send message to AI
  const handleSendMessage = useCallback(async (userMessage: string) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    // Add user message
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, newUserMessage],
    }));

    try {
      const response = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          currentList: state.steps.length > 0 ? state.steps : null,
          taskTitle: state.steps.length > 0 ? state.taskTitle : null,
          conversationHistory: state.messages,
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
        let newState = {
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
        };

        // Handle different actions
        if (data.action === "replace" && data.steps) {
          // Replace entire list (auto-populate)
          newState.steps = data.steps;
          newState.suggestions = [];
          newState.edits = [];
          if (data.taskTitle) {
            newState.taskTitle = data.taskTitle;
          }
        } else if (data.action === "suggest" && data.suggestions) {
          // Add suggestions to staging area
          newState.suggestions = data.suggestions;
          if (data.taskTitle) {
            newState.taskTitle = data.taskTitle;
          }
        } else if (data.action === "edit") {
          // Add edits to staging area (can also include suggestions)
          if (data.edits) {
            newState.edits = data.edits;
          }
          if (data.suggestions) {
            newState.suggestions = data.suggestions;
          }
          if (data.taskTitle) {
            newState.taskTitle = data.taskTitle;
          }
        }
        // action === "none" - just add the message, no list changes

        return newState;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      }));
    }
  }, [state.steps, state.taskTitle, state.messages]);

  // Send message to AI in focus mode (with step context)
  const handleFocusModeSendMessage = useCallback(async (userMessage: string) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    // Add user message to focus mode messages
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
      stepId: state.focusMode.stepId || undefined,
    };

    setState((prev) => ({
      ...prev,
      focusModeMessages: [...prev.focusModeMessages, newUserMessage],
    }));

    // Get current step info
    const currentStep = state.steps.find((s) => s.id === state.focusMode.stepId) || state.steps[0];
    const stepIndex = state.steps.findIndex((s) => s.id === state.focusMode.stepId);

    try {
      const response = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          currentList: state.steps,
          taskTitle: state.taskTitle,
          taskNotes: state.taskNotes,
          conversationHistory: state.focusModeMessages,
          // Focus mode context
          focusMode: {
            currentStepId: currentStep?.id,
            currentStepText: currentStep?.text,
            currentSubsteps: currentStep?.substeps || [],
            stepIndex,
            totalSteps: state.steps.length,
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
        let newState = {
          ...prev,
          focusModeMessages: [...prev.focusModeMessages, assistantMessage],
          isLoading: false,
        };

        // Handle different actions (same as task list view)
        if (data.action === "replace" && data.steps) {
          newState.steps = data.steps;
          newState.suggestions = [];
          newState.edits = [];
          if (data.taskTitle) {
            newState.taskTitle = data.taskTitle;
          }
        } else if (data.action === "suggest" && data.suggestions) {
          newState.suggestions = data.suggestions;
          if (data.taskTitle) {
            newState.taskTitle = data.taskTitle;
          }
        } else if (data.action === "edit") {
          if (data.edits) {
            newState.edits = data.edits;
          }
          if (data.suggestions) {
            newState.suggestions = data.suggestions;
          }
          if (data.taskTitle) {
            newState.taskTitle = data.taskTitle;
          }
        }

        return newState;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      }));
    }
  }, [state.steps, state.taskTitle, state.taskNotes, state.focusMode.stepId, state.focusModeMessages]);

  // Clear all data
  const handleClearAll = useCallback(() => {
    if (confirm("Clear all tasks and start fresh?")) {
      localStorage.removeItem(STORAGE_KEY);
      setState(initialState);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col lg:flex-row lg:overflow-hidden">
      {/* Left side: header + content (full height on desktop) */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header - hidden in focus mode (FocusMode has its own controls) */}
        {!state.focusMode.active && (
          <header className="h-14 px-6 flex items-center border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                Task Co-Pilot
              </h1>
              <button
                onClick={handleClearAll}
                className="text-sm text-neutral-400 hover:text-neutral-600
                           dark:hover:text-neutral-300 transition-colors"
              >
                Clear all
              </button>
            </div>
          </header>
        )}

        {/* Main content area */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden lg:overflow-visible">
          {state.focusMode.active ? (
            // Focus Mode View
            <FocusMode
              taskTitle={state.taskTitle}
              steps={state.steps}
              currentStep={state.steps.find((s) => s.id === state.focusMode.stepId) || state.steps[0]}
              stepIndex={state.steps.findIndex((s) => s.id === state.focusMode.stepId)}
              totalSteps={state.steps.length}
              completedCount={state.steps.filter((s) => s.completed || s.skipped).length}
              elapsedTime={elapsedSeconds}
              isPaused={state.focusMode.paused}
              taskNotes={state.taskNotes}
              onTaskNotesChange={handleTaskNotesChange}
              onDone={handleStepDone}
              onSkip={handleStepSkip}
              onStuck={() => {}} // Opens stuck menu (handled in FocusMode)
              onExit={exitFocusMode}
              onPauseToggle={togglePause}
              onSubstepToggle={handleFocusModeSubstepToggle}
              // AI Drawer props
              messages={state.focusModeMessages}
              isLoading={state.isLoading}
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
          ) : (
            // Task List View - content centers in available space
            <div className={`
              flex-1 overflow-y-auto px-6 pt-6 pb-6
              ${state.isDrawerOpen ? "mb-[50vh]" : ""}
              lg:mb-0
            `}>
              <div className="w-full max-w-3xl mx-auto">
                <TaskList
                  title={state.taskTitle}
                  steps={state.steps}
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
                    onAcceptOne={handleAcceptOne}
                    onAcceptEdit={handleAcceptEdit}
                    onRejectEdit={handleRejectEdit}
                    onAcceptAll={handleAcceptAll}
                    onDismiss={handleDismiss}
                  />
                </div>

                {/* Notes Module - inline under staging/steps */}
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <NotesModule
                    notes={state.taskNotes}
                    onChange={handleTaskNotesChange}
                    collapsible={false}
                  />
                </div>

                {/* Spacer when drawer is open on mobile */}
                {state.isDrawerOpen && (
                  <div className="h-16 lg:hidden" />
                )}
              </div>
            </div>
          )}

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
      {!state.focusMode.active && (
        <AIDrawer
          messages={state.messages}
          isOpen={state.isDrawerOpen}
          isLoading={state.isLoading}
          onToggle={handleDrawerToggle}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}
