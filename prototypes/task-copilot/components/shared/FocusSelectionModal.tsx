"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Task, SelectionType } from "@/lib/types";
import { BottomSheet, RightDrawer } from "@design-system/components";

interface FocusSelectionModalProps {
  isOpen: boolean;
  task: Task;
  initialSelectionType: SelectionType;
  initialSelectedStepIds: string[];
  onClose: () => void;
  /** Called immediately on each change (direct edit, no save button) */
  onUpdateSelection: (selectionType: SelectionType, selectedStepIds: string[]) => void;
}

export default function FocusSelectionModal({
  isOpen,
  task,
  initialSelectionType,
  initialSelectedStepIds,
  onClose,
  onUpdateSelection,
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
        setSelectedIds(new Set());
      } else if (initialSelectionType === 'specific_steps') {
        setSelectedIds(new Set(initialSelectedStepIds));
      } else {
        setSelectedIds(new Set(incompleteSteps.map((s) => s.id)));
      }
    }
  }, [isOpen, initialSelectionType, initialSelectedStepIds, incompleteSteps.length]);

  // Counts
  const todayCount = selectedIds.size;
  const upcomingCount = incompleteSteps.filter((s) => !selectedIds.has(s.id)).length;

  // Compute selection type from current state
  const computeSelectionType = (ids: Set<string>): { type: SelectionType; stepIds: string[] } => {
    const allSelected = incompleteSteps.every((s) => ids.has(s.id));
    const noneSelected = ids.size === 0;

    if (noneSelected) {
      return { type: 'all_upcoming', stepIds: [] };
    } else if (allSelected) {
      return { type: 'all_today', stepIds: [] };
    } else {
      return { type: 'specific_steps', stepIds: Array.from(ids) };
    }
  };

  // Toggle a step and immediately save
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
      // Immediately update
      const { type, stepIds } = computeSelectionType(next);
      onUpdateSelection(type, stepIds);
      return next;
    });
  };

  // Bulk actions - also immediately save
  const handleAllToday = () => {
    const newIds = new Set(incompleteSteps.map((s) => s.id));
    setSelectedIds(newIds);
    onUpdateSelection('all_today', []);
  };

  const handleAllUpcoming = () => {
    setSelectedIds(new Set());
    onUpdateSelection('all_upcoming', []);
  };

  if (!isOpen) return null;

  // If task has no steps, auto-update and close
  if (task.steps.length === 0) {
    onUpdateSelection('all_today', []);
    onClose();
    return null;
  }

  // Header with X close button (matches main navbar - no bottom border)
  const Header = () => (
    <div className="h-14 flex items-center justify-between px-2 shrink-0">
      <div className="px-2">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
          Edit Focus
        </h2>
      </div>
      <button
        onClick={onClose}
        className="p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Close"
      >
        <X size={20} className="text-zinc-600 dark:text-zinc-400" />
      </button>
    </div>
  );

  const BulkActions = () => (
    <div className="flex gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
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
    <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
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

            {/* Segmented Controller */}
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

  // Footer - just summary, no buttons (changes save immediately)
  const Footer = () => (
    <div
      className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        {todayCount} for today · {upcomingCount} for upcoming
      </span>
    </div>
  );

  // Mobile: Use BottomSheet
  if (isMobileView) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} height="85vh">
        <div className="flex flex-col h-full">
          <Header />
          <BulkActions />
          <StepList />
          <Footer />
        </div>
      </BottomSheet>
    );
  }

  // Desktop: Right drawer
  return (
    <RightDrawer isOpen={isOpen} onClose={onClose} width="400px" zIndex={50}>
      <div className="flex flex-col h-full">
        <Header />
        <BulkActions />
        <StepList />
        <Footer />
      </div>
    </RightDrawer>
  );
}
