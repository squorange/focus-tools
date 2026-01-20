"use client";

import React, { useState, useEffect } from "react";
import { Task, Step } from "@/lib/types";
import { RecurringInstance } from "@/lib/recurring-types";
import { X, Check, ArrowUp, ArrowDown } from "lucide-react";

interface EditTemplateModalProps {
  task: Task;
  currentInstance: RecurringInstance | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTemplateSteps: Step[], promotedStepIds: string[], demotedStepIds: string[]) => void;
}

interface StepState {
  step: Step;
  isTemplate: boolean; // true = template (task.steps), false = additional (instance-only)
  originalIsTemplate: boolean;
}

export default function EditTemplateModal({
  task,
  currentInstance,
  isOpen,
  onClose,
  onSave,
}: EditTemplateModalProps) {
  const [stepStates, setStepStates] = useState<StepState[]>([]);

  // Initialize step states when modal opens
  // Use instance steps (routineSteps + additionalSteps) to maintain correct IDs
  useEffect(() => {
    if (isOpen) {
      const states: StepState[] = [];

      // Use instance's routineSteps (have instance-specific IDs that match what we'll look up later)
      if (currentInstance) {
        currentInstance.routineSteps.forEach((step) => {
          states.push({
            step,
            isTemplate: true,
            originalIsTemplate: true,
          });
        });

        // Add additional steps from current instance
        currentInstance.additionalSteps.forEach((step) => {
          states.push({
            step,
            isTemplate: false,
            originalIsTemplate: false,
          });
        });
      } else {
        // Fallback: no instance yet, use task.steps directly
        task.steps.forEach((step) => {
          states.push({
            step,
            isTemplate: true,
            originalIsTemplate: true,
          });
        });
      }

      setStepStates(states);
    }
  }, [isOpen, task.steps, currentInstance]);

  if (!isOpen) return null;

  // Toggle a step between template and additional
  const toggleStep = (stepId: string) => {
    setStepStates((prev) =>
      prev.map((s) =>
        s.step.id === stepId ? { ...s, isTemplate: !s.isTemplate } : s
      )
    );
  };

  // Count changes
  const templateSteps = stepStates.filter((s) => s.isTemplate);
  const additionalSteps = stepStates.filter((s) => !s.isTemplate);
  const promoted = stepStates.filter((s) => s.isTemplate && !s.originalIsTemplate);
  const demoted = stepStates.filter((s) => !s.isTemplate && s.originalIsTemplate);
  const hasChanges = promoted.length > 0 || demoted.length > 0;

  // Handle save
  const handleSave = () => {
    const promotedIds = promoted.map((s) => s.step.id);
    const demotedIds = demoted.map((s) => s.step.id);

    // Build new template steps list
    const newTemplateSteps = stepStates
      .filter((s) => s.isTemplate)
      .map((s) => s.step);

    onSave(newTemplateSteps, promotedIds, demotedIds);
    onClose();
  };

  return (
    <>
      {/* Backdrop - z-[60] to overlay sidebar (z-50) */}
      <div
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={onClose}
      />

      {/* Modal - z-[70] above backdrop */}
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl z-[70] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Edit Template
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Checked steps apply to all future occurrences
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {stepStates.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <p>No steps to manage.</p>
              <p className="text-sm mt-1">Add steps to your routine first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stepStates.map((state) => (
                <div
                  key={state.step.id}
                  onClick={() => toggleStep(state.step.id)}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${state.isTemplate
                      ? "bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"
                      : "bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                    }
                    hover:border-violet-300 dark:hover:border-violet-600
                  `}
                >
                  {/* Checkbox */}
                  <div
                    className={`
                      flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                      ${state.isTemplate
                        ? "bg-violet-600 border-violet-600"
                        : "border-zinc-300 dark:border-zinc-600"
                      }
                    `}
                  >
                    {state.isTemplate && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>

                  {/* Step text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${
                      state.step.completed
                        ? "text-zinc-400 dark:text-zinc-500 line-through"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}>
                      {state.step.text}
                    </p>
                    {/* Change indicator */}
                    {state.isTemplate !== state.originalIsTemplate && (
                      <p className="text-xs mt-1 flex items-center gap-1">
                        {state.isTemplate ? (
                          <>
                            <ArrowUp className="w-3 h-3 text-green-600" />
                            <span className="text-green-600 dark:text-green-400">
                              Will be added to template
                            </span>
                          </>
                        ) : (
                          <>
                            <ArrowDown className="w-3 h-3 text-amber-600" />
                            <span className="text-amber-600 dark:text-amber-400">
                              Will become instance-only
                            </span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
          {/* Summary */}
          <div className="flex items-center justify-between mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              {templateSteps.length} template · {additionalSteps.length} instance-only
            </span>
            {hasChanges && (
              <span className="text-violet-600 dark:text-violet-400 font-medium">
                {promoted.length > 0 && `+${promoted.length} promoted`}
                {promoted.length > 0 && demoted.length > 0 && ", "}
                {demoted.length > 0 && `${demoted.length} demoted`}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`
                flex-1 py-2 text-sm font-medium rounded-lg transition-colors
                ${hasChanges
                  ? "text-white bg-violet-600 hover:bg-violet-700"
                  : "text-zinc-400 bg-zinc-200 dark:bg-zinc-700 cursor-not-allowed"
                }
              `}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
