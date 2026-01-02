"use client";

import { useState, useRef, useEffect } from "react";
import { Step, Message, SuggestedStep, EditSuggestion } from "@/lib/types";
import NotesModule from "./NotesModule";
import AIDrawer from "./AIDrawer";
import StuckMenu, { StuckOption } from "./StuckMenu";
import StagingArea from "./StagingArea";

interface FocusModeProps {
  taskTitle: string;
  steps: Step[];
  currentStep: Step;
  stepIndex: number;
  totalSteps: number;
  completedCount: number;
  elapsedTime: number; // seconds
  isPaused: boolean;
  taskNotes: string;
  onTaskNotesChange: (notes: string) => void;
  onDone: () => void;
  onSkip: () => void;
  onStuck: () => void;
  onExit: () => void;
  onPauseToggle: () => void;
  onSubstepToggle: (substepId: string) => void;
  // AI Drawer props
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  // Staging Area props
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  onAcceptOne: (suggestion: SuggestedStep) => void;
  onAcceptEdit: (edit: EditSuggestion) => void;
  onRejectEdit: (edit: EditSuggestion) => void;
  onAcceptAll: () => void;
  onDismissSuggestions: () => void;
  // Editing props
  onStepUpdate: (stepId: string, newText: string) => void;
  onSubstepUpdate: (stepId: string, substepId: string, newText: string) => void;
  // Substep menu props
  onSubstepSkip: (stepId: string, substepId: string) => void;
  onSubstepUnskip: (stepId: string, substepId: string) => void;
  onSubstepMoveUp: (stepId: string, substepId: string) => void;
  onSubstepMoveDown: (stepId: string, substepId: string) => void;
  onSubstepDelete: (stepId: string, substepId: string) => void;
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function FocusMode({
  taskTitle,
  steps,
  currentStep,
  stepIndex,
  totalSteps,
  completedCount,
  elapsedTime,
  isPaused,
  taskNotes,
  onTaskNotesChange,
  onDone,
  onSkip,
  onStuck,
  onExit,
  onPauseToggle,
  onSubstepToggle,
  messages,
  isLoading,
  onSendMessage,
  suggestions,
  edits,
  onAcceptOne,
  onAcceptEdit,
  onRejectEdit,
  onAcceptAll,
  onDismissSuggestions,
  onStepUpdate,
  onSubstepUpdate,
  onSubstepSkip,
  onSubstepUnskip,
  onSubstepMoveUp,
  onSubstepMoveDown,
  onSubstepDelete,
}: FocusModeProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isStuckMenuOpen, setIsStuckMenuOpen] = useState(false);
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  // Step editing state
  const [isEditingStep, setIsEditingStep] = useState(false);
  const [stepEditText, setStepEditText] = useState("");
  const stepInputRef = useRef<HTMLTextAreaElement>(null);

  // Substep editing state
  const [editingSubstepId, setEditingSubstepId] = useState<string | null>(null);
  const [substepEditText, setSubstepEditText] = useState("");
  const substepInputRef = useRef<HTMLTextAreaElement>(null);

  // Substep menu state
  const [openSubstepMenuId, setOpenSubstepMenuId] = useState<string | null>(null);
  const substepMenuRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingStep && stepInputRef.current) {
      stepInputRef.current.focus();
      stepInputRef.current.select();
      // Auto-resize textarea to fit content
      stepInputRef.current.style.height = 'auto';
      stepInputRef.current.style.height = stepInputRef.current.scrollHeight + 'px';
    }
  }, [isEditingStep]);

  useEffect(() => {
    if (editingSubstepId && substepInputRef.current) {
      substepInputRef.current.focus();
      substepInputRef.current.select();
      // Auto-resize textarea to fit content
      substepInputRef.current.style.height = 'auto';
      substepInputRef.current.style.height = substepInputRef.current.scrollHeight + 'px';
    }
  }, [editingSubstepId]);

  // Close substep menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (substepMenuRef.current && !substepMenuRef.current.contains(event.target as Node)) {
        setOpenSubstepMenuId(null);
      }
    }
    if (openSubstepMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openSubstepMenuId]);

  // Step editing handlers
  const handleStepEditStart = () => {
    setStepEditText(currentStep?.text || "");
    setIsEditingStep(true);
  };

  const handleStepSave = () => {
    if (stepEditText.trim() && currentStep) {
      onStepUpdate(currentStep.id, stepEditText.trim());
    }
    setIsEditingStep(false);
  };

  const handleStepKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleStepSave();
    } else if (e.key === "Escape") {
      setIsEditingStep(false);
    }
  };

  // Substep editing handlers
  const handleSubstepEditStart = (substepId: string, text: string) => {
    setSubstepEditText(text);
    setEditingSubstepId(substepId);
  };

  const handleSubstepSave = () => {
    if (substepEditText.trim() && editingSubstepId && currentStep) {
      onSubstepUpdate(currentStep.id, editingSubstepId, substepEditText.trim());
    }
    setEditingSubstepId(null);
  };

  const handleSubstepKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubstepSave();
    } else if (e.key === "Escape") {
      setEditingSubstepId(null);
    }
  };

  // Handle stuck menu option selection
  const handleStuckOption = (option: StuckOption) => {
    setIsStuckMenuOpen(false);

    // Open drawer and send appropriate prompt
    setIsDrawerOpen(true);
    const prompts: Record<StuckOption, string> = {
      breakdown: "Help me break down this step into smaller substeps",
      start: "What's the first small action I should take for this step?",
      clarify: "Can you clarify what this step is asking me to do?",
    };
    onSendMessage(prompts[option]);
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row lg:overflow-hidden">
      {/* Left side: header + content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header - h-14 to match task list header */}
        <div className="h-14 px-6 flex items-center border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
        <div className="flex-1 flex items-center justify-between">
          {/* Exit button */}
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-700
                       dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Exit</span>
          </button>

          {/* Timer and Pause */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isPaused && (
                <span className="text-xs font-medium text-amber-500 uppercase tracking-wide">
                  Paused
                </span>
              )}
              <span className={`font-mono text-lg ${isPaused ? "text-amber-500" : "text-neutral-700 dark:text-neutral-200"}`}>
                {formatTime(elapsedTime)}
              </span>
            </div>
            <button
              onClick={onPauseToggle}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5
                ${isPaused
                  ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
            >
              {isPaused ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Continue
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  Pause
                </>
              )}
            </button>
          </div>
        </div>
      </div>

        {/* Content pane - centers content within available space */}
        <div className={`
          flex-1 flex flex-col items-center p-6 overflow-y-auto
          ${isDrawerOpen ? "mb-[50vh]" : ""}
          lg:mb-0
        `}>
        {/* Task title */}
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-2">
          {taskTitle}
        </p>

        {/* Step indicator */}
        <p className="text-neutral-600 dark:text-neutral-300 mb-4">
          Step {stepIndex + 1} of {totalSteps}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-md mb-8">
          <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mt-2">
            {completedCount} of {totalSteps} done
          </p>
        </div>

        {/* Current step card */}
        <div className="w-full max-w-lg p-6 bg-white dark:bg-neutral-800 rounded-xl
                        border border-neutral-200 dark:border-neutral-700 shadow-sm">
          {/* Step text - left-aligned, click-to-edit */}
          {isEditingStep ? (
            <textarea
              ref={stepInputRef}
              value={stepEditText}
              onChange={(e) => setStepEditText(e.target.value)}
              onBlur={handleStepSave}
              onKeyDown={handleStepKeyDown}
              rows={1}
              className="w-full text-xl px-2 py-1 -mx-2 -my-0.5 bg-white dark:bg-neutral-700
                         border border-blue-500 rounded outline-none resize-none leading-[1.45]
                         text-neutral-800 dark:text-neutral-100 font-medium"
              onInput={(e) => {
                const target = e.currentTarget;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          ) : (
            <p
              onClick={handleStepEditStart}
              className="text-xl text-left text-neutral-800 dark:text-neutral-100 font-medium
                         cursor-text hover:bg-neutral-100 dark:hover:bg-neutral-700
                         rounded px-2 py-1 -mx-2 transition-colors"
            >
              {currentStep?.text || "No step selected"}
            </p>
          )}

          {/* Substeps */}
          {currentStep?.substeps && currentStep.substeps.length > 0 && (
            <ul className="mt-6 space-y-2">
              {currentStep.substeps.map((substep, index) => (
                <li key={substep.id} className="group/sub flex items-start gap-2">
                  {/* Square checkbox (matching TaskItem) */}
                  <button
                    onClick={() => onSubstepToggle(substep.id)}
                    className={`mt-1 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                      ${substep.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : substep.skipped
                        ? "bg-neutral-300 border-neutral-300 dark:bg-neutral-600 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400"
                        : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400"
                      }`}
                  >
                    {substep.completed && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {substep.skipped && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    )}
                  </button>

                  {/* Substep ID */}
                  <span className="mt-0.5 text-sm font-medium text-neutral-400 dark:text-neutral-500 w-6 flex-shrink-0">
                    {substep.id}.
                  </span>

                  {/* Substep text - click-to-edit */}
                  {editingSubstepId === substep.id ? (
                    <textarea
                      ref={substepInputRef}
                      value={substepEditText}
                      onChange={(e) => setSubstepEditText(e.target.value)}
                      onBlur={handleSubstepSave}
                      onKeyDown={handleSubstepKeyDown}
                      rows={1}
                      className="flex-1 min-w-0 px-1.5 py-0.5 text-sm bg-white dark:bg-neutral-700
                                 border border-blue-500 rounded outline-none resize-none
                                 text-neutral-600 dark:text-neutral-300"
                      onInput={(e) => {
                        const target = e.currentTarget;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => handleSubstepEditStart(substep.id, substep.text)}
                      className="flex-1 min-w-0 flex items-baseline gap-2 cursor-text hover:bg-neutral-100 dark:hover:bg-neutral-700
                                  rounded px-1.5 py-0.5 transition-colors"
                    >
                      <span
                        className={`text-sm break-words
                          ${substep.completed || substep.skipped
                            ? "line-through text-neutral-400 dark:text-neutral-500"
                            : "text-neutral-600 dark:text-neutral-300"
                          }
                          ${substep.skipped ? "italic" : ""}`}
                      >
                        {substep.text}
                      </span>
                      {substep.skipped && (
                        <span className="flex-shrink-0 text-xs font-normal bg-neutral-200 dark:bg-neutral-700
                                         text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded">
                          Skipped
                        </span>
                      )}
                    </span>
                  )}

                  {/* Kebab menu */}
                  <div className="relative flex-shrink-0" ref={openSubstepMenuId === substep.id ? substepMenuRef : undefined}>
                    <button
                      onClick={() => setOpenSubstepMenuId(openSubstepMenuId === substep.id ? null : substep.id)}
                      className="p-1 opacity-0 group-hover/sub:opacity-100 focus:opacity-100 transition-opacity
                                 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {openSubstepMenuId === substep.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-800 rounded-lg shadow-lg
                                      border border-neutral-200 dark:border-neutral-700 py-1 z-10">
                        <button
                          onClick={() => { onSubstepMoveUp(currentStep.id, substep.id); setOpenSubstepMenuId(null); }}
                          disabled={index === 0}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700
                                     text-neutral-700 dark:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Move up
                        </button>
                        <button
                          onClick={() => { onSubstepMoveDown(currentStep.id, substep.id); setOpenSubstepMenuId(null); }}
                          disabled={index === currentStep.substeps.length - 1}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700
                                     text-neutral-700 dark:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Move down
                        </button>
                        {/* Skip/Unskip - only show for non-completed substeps */}
                        {!substep.completed && (
                          substep.skipped ? (
                            <button
                              onClick={() => { onSubstepUnskip(currentStep.id, substep.id); setOpenSubstepMenuId(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700
                                         text-neutral-700 dark:text-neutral-200"
                            >
                              Unskip
                            </button>
                          ) : (
                            <button
                              onClick={() => { onSubstepSkip(currentStep.id, substep.id); setOpenSubstepMenuId(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700
                                         text-neutral-700 dark:text-neutral-200"
                            >
                              Skip
                            </button>
                          )
                        )}
                        <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                        <button
                          onClick={() => { onSubstepDelete(currentStep.id, substep.id); setOpenSubstepMenuId(null); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20
                                     text-red-600 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Staging Area - inline under step card */}
        <div className="w-full max-w-lg mt-3">
          <StagingArea
            suggestions={suggestions}
            edits={edits}
            onAcceptOne={onAcceptOne}
            onAcceptEdit={onAcceptEdit}
            onRejectEdit={onRejectEdit}
            onAcceptAll={onAcceptAll}
            onDismiss={onDismissSuggestions}
          />
        </div>

        {/* Notes section (collapsible) */}
        <div className="w-full max-w-lg mt-3">
          <NotesModule
            notes={taskNotes}
            onChange={onTaskNotesChange}
            collapsible
            defaultExpanded={false}
          />
        </div>

        {/* Action buttons */}
        {!isPaused && (
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={onDone}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium
                         rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Done
            </button>
            <button
              onClick={onSkip}
              className="px-5 py-3 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600
                         text-neutral-600 dark:text-neutral-300 font-medium rounded-xl transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => setIsStuckMenuOpen(true)}
              className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700
                         text-neutral-700 dark:text-neutral-200 font-medium rounded-xl transition-colors"
            >
              I'm Stuck
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Right side: AI Drawer - full height on desktop */}
      <AIDrawer
        variant="focus"
        messages={messages}
        isOpen={isDrawerOpen}
        isLoading={isLoading}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
        onSendMessage={onSendMessage}
        currentStepId={currentStep?.id}
        steps={steps}
      />

      {/* Stuck Menu */}
      <StuckMenu
        isOpen={isStuckMenuOpen}
        onClose={() => setIsStuckMenuOpen(false)}
        onSelectOption={handleStuckOption}
      />
    </div>
  );
}
