"use client";

import { useState, useEffect } from "react";
import { Task, SelectionType } from "@/lib/types";

interface FocusSelectionModalProps {
  isOpen: boolean;
  task: Task;
  initialSelectionType: SelectionType; // 'all_today' | 'all_upcoming' | 'specific_steps'
  initialSelectedStepIds: string[]; // Step IDs selected for Today (only used if specific_steps)
  onClose: () => void;
  onConfirm: (selectionType: SelectionType, selectedStepIds: string[]) => void;
  mode: "add" | "edit"; // Affects button labels
}

export default function FocusSelectionModal({
  isOpen,
  task,
  initialSelectionType,
  initialSelectedStepIds,
  onClose,
  onConfirm,
  mode,
}: FocusSelectionModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get incomplete steps
  const incompleteSteps = task.steps.filter((s) => !s.completed);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSelectionType === 'all_upcoming') {
        // No steps selected for Today
        setSelectedIds(new Set());
      } else if (initialSelectionType === 'specific_steps') {
        // Use provided step IDs
        setSelectedIds(new Set(initialSelectedStepIds));
      } else {
        // all_today - select all incomplete steps
        setSelectedIds(new Set(incompleteSteps.map((s) => s.id)));
      }
    }
  }, [isOpen, initialSelectionType, initialSelectedStepIds, incompleteSteps.length]);

  // Counts
  const todayCount = selectedIds.size;
  const upcomingCount = incompleteSteps.filter((s) => !selectedIds.has(s.id)).length;

  const handleToggle = (stepId: string) => {
    const step = task.steps.find((s) => s.id === stepId);
    if (step?.completed) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(incompleteSteps.map((s) => s.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = () => {
    const allSelected = incompleteSteps.every((s) => selectedIds.has(s.id));
    const noneSelected = selectedIds.size === 0;

    if (noneSelected) {
      // No steps checked → all upcoming
      onConfirm('all_upcoming', []);
    } else if (allSelected) {
      // All incomplete steps selected → all_today
      onConfirm('all_today', []);
    } else {
      // Partial selection → specific_steps
      onConfirm('specific_steps', Array.from(selectedIds));
    }
  };

  if (!isOpen) return null;

  // If task has no steps, auto-confirm with all_today (no modal needed)
  if (task.steps.length === 0) {
    onConfirm('all_today', []);
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Edit Focus
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-100 dark:border-zinc-700/50 shrink-0">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400
                         bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30
                         rounded-lg transition-colors"
            >
              Select all
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400
                         bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600
                         rounded-lg transition-colors"
            >
              Clear all
            </button>
            <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
              Checked = Today
            </span>
          </div>

          {/* Step list */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {task.steps.map((step, index) => {
              const isSelected = selectedIds.has(step.id);
              const isCompleted = step.completed;

              return (
                <button
                  key={step.id}
                  onClick={() => handleToggle(step.id)}
                  disabled={isCompleted}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-left transition-colors
                    ${
                      isCompleted
                        ? "opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                        : "bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                      ${
                        isCompleted
                          ? "bg-zinc-200 dark:bg-zinc-600 border-zinc-300 dark:border-zinc-500"
                          : isSelected
                          ? "bg-violet-500 border-violet-500"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}
                  >
                    {(isSelected || isCompleted) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Step text */}
                  <span
                    className={`flex-1 text-sm ${
                      isCompleted
                        ? "text-zinc-400 dark:text-zinc-500 line-through"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {index + 1}. {step.text}
                  </span>

                  {/* Today/Upcoming indicator */}
                  {!isCompleted && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected
                          ? "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40"
                          : "text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    >
                      {isSelected ? "Today" : "Upcoming"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 shrink-0">
            {/* Summary */}
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
              {todayCount} step{todayCount !== 1 ? "s" : ""} for Today
              {upcomingCount > 0 && (
                <> · {upcomingCount} for Upcoming</>
              )}
            </p>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400
                           hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600
                           hover:bg-violet-700 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
