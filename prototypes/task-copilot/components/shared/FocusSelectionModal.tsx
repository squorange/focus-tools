"use client";

import { useState, useEffect } from "react";
import { Task, SelectionType } from "@/lib/types";
import BottomSheet from "@/components/shared/BottomSheet";

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
  const [isMobileView, setIsMobileView] = useState(false);

  // Get incomplete steps
  const incompleteSteps = task.steps.filter((s) => !s.completed);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(typeof window !== "undefined" && window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const handleSetToday = (stepId: string) => {
    const step = task.steps.find((s) => s.id === stepId);
    if (step?.completed) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
  };

  const handleSetUpcoming = (stepId: string) => {
    const step = task.steps.find((s) => s.id === stepId);
    if (step?.completed) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(stepId);
      return next;
    });
  };

  const handleAllToday = () => {
    setSelectedIds(new Set(incompleteSteps.map((s) => s.id)));
  };

  const handleAllUpcoming = () => {
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

  // Toggle handler for segmented control
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

  // Shared content components
  const Header = ({ showCloseButton = true }: { showCloseButton?: boolean }) => (
    <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Edit Focus
      </h2>
      {showCloseButton && (
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
      )}
    </div>
  );

  const BulkActions = () => (
    <div className="flex gap-2 px-4 pt-2 pb-3 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
      <button
        onClick={handleAllToday}
        className="flex-1 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300
                   bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600
                   rounded-lg transition-colors"
      >
        All for Today
      </button>
      <button
        onClick={handleAllUpcoming}
        className="flex-1 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300
                   bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600
                   rounded-lg transition-colors"
      >
        All for Upcoming
      </button>
    </div>
  );

  const StepList = () => (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {task.steps.map((step, index) => {
        const isSelected = selectedIds.has(step.id);
        const isCompleted = step.completed;

        return (
          <div
            key={step.id}
            className={`flex items-center gap-3 py-3 ${
              index < task.steps.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-700/50' : ''
            } ${isCompleted ? 'opacity-50' : ''}`}
          >
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

            {/* Segmented Controller - entire control is tappable to toggle */}
            {!isCompleted && (
              <div
                onClick={() => handleToggle(step.id)}
                className="flex shrink-0 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-0.5 cursor-pointer"
              >
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    isSelected
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  Today
                </span>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    !isSelected
                      ? "bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  Upcoming
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const Footer = () => (
    <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 shrink-0">
      {/* Single row: Summary left, buttons right */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {todayCount} today · {upcomingCount} upcoming
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400
                       hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 text-sm font-medium text-white bg-violet-600
                       hover:bg-violet-700 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile: Use BottomSheet
  if (isMobileView) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} height="85vh">
        <div className="flex flex-col h-full">
          <Header showCloseButton={false} />
          <BulkActions />
          <StepList />
          <Footer />
        </div>
      </BottomSheet>
    );
  }

  // Desktop: Centered modal
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
          <Header />
          <BulkActions />
          <StepList />
          <Footer />
        </div>
      </div>
    </>
  );
}
