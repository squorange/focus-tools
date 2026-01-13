"use client";

import { useState, useEffect } from "react";
import { Task, Step, FocusQueueItem, FocusModeState, SuggestedStep, EditSuggestion, DeletionSuggestion } from "@/lib/types";
import NotesModule from "@/components/NotesModule";
import StagingArea from "@/components/StagingArea";

interface FocusModeViewProps {
  task: Task;
  queueItem: FocusQueueItem | null;
  focusState: FocusModeState;
  onStepComplete: (taskId: string, stepId: string, completed: boolean) => void;
  onSubstepComplete: (taskId: string, stepId: string, substepId: string, completed: boolean) => void;
  onUpdateStep: (taskId: string, stepId: string, text: string) => void;
  onUpdateSubstep: (taskId: string, stepId: string, substepId: string, text: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  // Substep management
  onDeleteSubstep: (taskId: string, stepId: string, substepId: string) => void;
  onMoveSubstepUp: (taskId: string, stepId: string, substepId: string) => void;
  onMoveSubstepDown: (taskId: string, stepId: string, substepId: string) => void;
  onStuck: () => void;
  onStuckBreakdown: () => void;
  onStuckFirstStep: () => void;
  onStuckExplain: () => void;
  onPause: () => void;
  onResume: () => void;
  onExit: () => void;
  onOpenAIDrawer: () => void;
  // Staging props
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  deletions: DeletionSuggestion[];
  suggestedTitle: string | null;
  onAcceptOne: (suggestion: SuggestedStep) => void;
  onAcceptAll: () => void;
  onDismiss: () => void;
  onAcceptEdit: (edit: EditSuggestion) => void;
  onRejectEdit: (edit: EditSuggestion) => void;
  onAcceptDeletion: (deletion: DeletionSuggestion) => void;
  onRejectDeletion: (deletion: DeletionSuggestion) => void;
  onAcceptTitle: () => void;
  onRejectTitle: () => void;
}

// Format time as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Get steps in scope for this queue item
function getStepsInScope(task: Task, queueItem: FocusQueueItem | null): Step[] {
  if (!queueItem) return task.steps;
  if (queueItem.selectionType === "all_today" || queueItem.selectionType === "all_upcoming") return task.steps;
  return task.steps.filter((s) => queueItem.selectedStepIds.includes(s.id));
}

// Get progress
function getProgress(steps: Step[]): { completed: number; total: number } {
  const completed = steps.filter((s) => s.completed).length;
  return { completed, total: steps.length };
}

// Find current step (first incomplete in scope)
function getCurrentStep(steps: Step[], currentStepId: string | null): Step | null {
  if (currentStepId) {
    const step = steps.find((s) => s.id === currentStepId);
    if (step && !step.completed) return step;
  }
  return steps.find((s) => !s.completed) || null;
}

export default function FocusModeView({
  task,
  queueItem,
  focusState,
  onStepComplete,
  onSubstepComplete,
  onUpdateStep,
  onUpdateSubstep,
  onUpdateTask,
  onDeleteSubstep,
  onMoveSubstepUp,
  onMoveSubstepDown,
  onStuck,
  onStuckBreakdown,
  onStuckFirstStep,
  onStuckExplain,
  onPause,
  onResume,
  onExit,
  onOpenAIDrawer,
  suggestions,
  edits,
  deletions,
  suggestedTitle,
  onAcceptOne,
  onAcceptAll,
  onDismiss,
  onAcceptEdit,
  onRejectEdit,
  onAcceptDeletion,
  onRejectDeletion,
  onAcceptTitle,
  onRejectTitle,
}: FocusModeViewProps) {
  // Initialize timer from persisted state to survive refresh
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (focusState.startTime) {
      const now = Date.now();
      const elapsed = Math.floor((now - focusState.startTime - focusState.pausedTime) / 1000);
      return Math.max(0, elapsed);
    }
    return 0;
  });
  const [editingSubstepId, setEditingSubstepId] = useState<string | null>(null);
  const [substepText, setSubstepText] = useState("");

  // Step editing state
  const [editingStep, setEditingStep] = useState(false);
  const [stepText, setStepText] = useState("");

  // Title editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState("");

  // Stuck menu state
  const [showStuckMenu, setShowStuckMenu] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!focusState.active || focusState.paused) return;

    const interval = setInterval(() => {
      if (focusState.startTime) {
        const elapsed = Math.floor((Date.now() - focusState.startTime - focusState.pausedTime) / 1000);
        setElapsedSeconds(Math.max(0, elapsed));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [focusState.active, focusState.paused, focusState.startTime, focusState.pausedTime]);

  const stepsInScope = getStepsInScope(task, queueItem);
  const progress = getProgress(stepsInScope);
  const currentStep = getCurrentStep(stepsInScope, focusState.currentStepId);
  const currentStepIndex = currentStep ? stepsInScope.findIndex((s) => s.id === currentStep.id) : -1;
  const isComplete = progress.completed === progress.total && progress.total > 0;
  const hasNoSteps = stepsInScope.length === 0;
  const isTaskComplete = task.status === 'complete';

  // Auto-dismiss celebration after 2 seconds
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        onExit();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onExit]);

  const handleMarkDone = () => {
    if (currentStep) {
      onStepComplete(task.id, currentStep.id, true);
    }
  };

  const handleMarkTaskComplete = () => {
    onUpdateTask(task.id, {
      status: 'complete',
      completedAt: Date.now(),
      completionType: 'manual'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-8">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit
        </button>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2 text-lg font-mono text-zinc-700 dark:text-zinc-300">
            {formatTime(elapsedSeconds)}
          </div>

          {/* Pause/Resume */}
          <button
            onClick={focusState.paused ? onResume : onPause}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {focusState.paused ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main Content - pb-28 clears AI minibar, pb-[52vh] would clear expanded palette */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full px-4 pb-28">
        {/* Task Title - tap to edit, multi-line support */}
        {editingTitle ? (
          <textarea
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            onBlur={() => {
              if (titleText.trim() && titleText !== task.title) {
                onUpdateTask(task.id, { title: titleText.trim() });
              }
              setEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (titleText.trim() && titleText !== task.title) {
                  onUpdateTask(task.id, { title: titleText.trim() });
                }
                setEditingTitle(false);
              }
              if (e.key === "Escape") {
                setTitleText(task.title);
                setEditingTitle(false);
              }
            }}
            className="w-full text-xl font-medium text-center bg-transparent border-b-2 border-violet-500 focus:outline-none resize-none text-zinc-600 dark:text-zinc-400 mb-4"
            rows={2}
            autoFocus
          />
        ) : (
          <h1
            onClick={() => {
              setEditingTitle(true);
              setTitleText(task.title);
            }}
            className="text-xl font-medium text-zinc-600 dark:text-zinc-400 mb-4 text-center break-words cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-700 px-2 -mx-2 py-1 rounded transition-colors"
          >
            {task.title}
          </h1>
        )}

        {/* Step indicator - only show if there are steps */}
        {!hasNoSteps && (
          <>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
              Step {currentStepIndex + 1} of {stepsInScope.length}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${(progress.completed / Math.max(progress.total, 1)) * 100}%` }}
              />
            </div>
          </>
        )}

        {/* Current Step Card */}
        {isComplete ? (
          <div className="w-full p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-700 dark:text-green-300 mb-2">
              Focus Goal Complete!
            </h2>
            <p className="text-green-600 dark:text-green-400 mb-6">
              Great work! You completed all {progress.total} steps.
            </p>
            <button
              onClick={onExit}
              className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        ) : currentStep ? (
          <div className="w-full p-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm">
            {/* Step text - tap to edit */}
            {editingStep ? (
              <textarea
                value={stepText}
                onChange={(e) => setStepText(e.target.value)}
                onBlur={() => {
                  if (stepText.trim() && stepText !== currentStep.text) {
                    onUpdateStep(task.id, currentStep.id, stepText.trim());
                  }
                  setEditingStep(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (stepText.trim() && stepText !== currentStep.text) {
                      onUpdateStep(task.id, currentStep.id, stepText.trim());
                    }
                    setEditingStep(false);
                  }
                  if (e.key === "Escape") {
                    setStepText(currentStep.text);
                    setEditingStep(false);
                  }
                }}
                className="w-full text-lg text-center bg-transparent border-b-2 border-violet-500 focus:outline-none resize-none text-zinc-900 dark:text-zinc-100 mb-6"
                rows={2}
                autoFocus
              />
            ) : (
              <p
                onClick={() => {
                  setEditingStep(true);
                  setStepText(currentStep.text);
                }}
                className="text-lg text-zinc-900 dark:text-zinc-100 text-center mb-6 cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-700 px-2 -mx-2 py-1 rounded transition-colors"
              >
                {currentStep.text}
              </p>
            )}

            {/* Substeps */}
            {currentStep.substeps.length > 0 && (
              <div className="mb-6 space-y-2 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                {currentStep.substeps.map((substep, idx) => (
                  <div key={substep.id} className="group flex items-center gap-2">
                    <button
                      onClick={() => onSubstepComplete(task.id, currentStep.id, substep.id, !substep.completed)}
                      className={`
                        flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors
                        ${
                          substep.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-zinc-300 dark:border-zinc-600 hover:border-violet-400"
                        }
                      `}
                    >
                      {substep.completed && (
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    {editingSubstepId === substep.id ? (
                      <input
                        type="text"
                        value={substepText}
                        onChange={(e) => setSubstepText(e.target.value)}
                        onBlur={() => {
                          if (substepText.trim()) {
                            onUpdateSubstep(task.id, currentStep.id, substep.id, substepText.trim());
                          }
                          setEditingSubstepId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (substepText.trim()) {
                              onUpdateSubstep(task.id, currentStep.id, substep.id, substepText.trim());
                            }
                            setEditingSubstepId(null);
                          }
                          if (e.key === "Escape") setEditingSubstepId(null);
                        }}
                        className="flex-1 text-sm bg-transparent border-b border-violet-500 focus:outline-none text-zinc-600 dark:text-zinc-400"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingSubstepId(substep.id);
                          setSubstepText(substep.text);
                        }}
                        className={`flex-1 text-sm cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-700 px-1 -mx-1 rounded transition-colors ${
                          substep.completed
                            ? "text-zinc-400 line-through"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {substep.text}
                      </span>
                    )}
                    {/* Substep action buttons - visible on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                        <button
                          onClick={() => onMoveSubstepUp(task.id, currentStep.id, substep.id)}
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                          title="Move up"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}
                      {idx < currentStep.substeps.length - 1 && (
                        <button
                          onClick={() => onMoveSubstepDown(task.id, currentStep.id, substep.id)}
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                          title="Move down"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteSubstep(task.id, currentStep.id, substep.id)}
                        className="p-1 text-zinc-400 hover:text-red-500"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Estimate */}
            {currentStep.estimatedMinutes && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center mb-6">
                Estimated: ~{currentStep.estimatedMinutes} min
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleMarkDone}
                className="px-8 py-3 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
              >
                Done
              </button>
              {/* I'm Stuck with popover menu */}
              <div className="relative">
                <button
                  onClick={() => setShowStuckMenu(!showStuckMenu)}
                  className="px-6 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                >
                  I&apos;m Stuck
                </button>
                {showStuckMenu && (
                  <>
                    {/* Backdrop to dismiss menu */}
                    <div className="fixed inset-0 z-10" onClick={() => setShowStuckMenu(false)} />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[220px]">
                      <button
                      onClick={() => {
                        setShowStuckMenu(false);
                        onStuckBreakdown();
                      }}
                      className="w-full px-4 py-2.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Break down this step
                    </button>
                    <button
                      onClick={() => {
                        setShowStuckMenu(false);
                        onStuckFirstStep();
                      }}
                      className="w-full px-4 py-2.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      What&apos;s my first tiny action?
                    </button>
                    <button
                      onClick={() => {
                        setShowStuckMenu(false);
                        onStuckExplain();
                      }}
                      className="w-full px-4 py-2.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Explain this step
                    </button>
                    <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
                    <button
                      onClick={() => {
                        setShowStuckMenu(false);
                        onStuck();
                      }}
                      className="w-full px-4 py-2.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Talk it through with AI
                    </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : hasNoSteps ? (
          /* Task with no steps - show mark complete option */
          isTaskComplete ? (
            <div className="w-full p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-700 dark:text-green-300 mb-2">
                Task Complete!
              </h2>
              <p className="text-green-600 dark:text-green-400 mb-6">
                Great work!
              </p>
              <button
                onClick={onExit}
                className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="w-full p-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-center">
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Ready to complete this task?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleMarkTaskComplete}
                  className="px-8 py-3 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                >
                  Mark Complete
                </button>
                <button
                  onClick={onOpenAIDrawer}
                  className="px-6 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Talk to AI
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="w-full p-6 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              No more steps to complete
            </p>
          </div>
        )}

        {/* Notes - collapsible */}
        <div className="w-full mt-6">
          <NotesModule
            notes={task.notes || ""}
            onChange={(notes) => onUpdateTask(task.id, { notes: notes || null })}
            collapsible={true}
            placeholder="Add notes..."
          />
        </div>

        {/* Staging Area for AI suggestions */}
        {(suggestions.length > 0 || edits.length > 0 || deletions.length > 0 || suggestedTitle) && (
          <div className="w-full mt-4">
            <StagingArea
              suggestions={suggestions}
              edits={edits}
              deletions={deletions}
              suggestedTitle={suggestedTitle}
              currentTitle={task.title}
              onAcceptOne={onAcceptOne}
              onAcceptAll={onAcceptAll}
              onDismiss={onDismiss}
              onAcceptEdit={onAcceptEdit}
              onRejectEdit={onRejectEdit}
              onAcceptDeletion={onAcceptDeletion}
              onRejectDeletion={onRejectDeletion}
              onAcceptTitle={onAcceptTitle}
              onRejectTitle={onRejectTitle}
            />
          </div>
        )}
      </div>

    </div>
  );
}
