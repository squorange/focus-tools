"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { Task } from "@/lib/types";
import { getCompletions, formatMinutes, TaskCompletion } from "@/lib/completions";
import { BottomSheet } from "@design-system/components";
import { useDeviceType } from "@/hooks/useMediaQuery";

interface CompletedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onNavigateToTask: (taskId: string) => void;
  dayStartHour?: number; // Hour when the day starts (0-12). Default 0 (midnight).
}

export default function CompletedDrawer({
  isOpen,
  onClose,
  tasks,
  onNavigateToTask,
  dayStartHour = 0,
}: CompletedDrawerProps) {
  const [daysToShow, setDaysToShow] = useState(7);
  const deviceType = useDeviceType();
  const isDesktop = deviceType === 'desktop';

  const { groups: completionGroups, hasMore } = useMemo(
    () => getCompletions(tasks, daysToShow, dayStartHour),
    [tasks, daysToShow, dayStartHour]
  );

  const totalTasks = completionGroups.reduce((sum, g) => sum + g.taskCompletions.length, 0);

  const handleTaskClick = (taskId: string) => {
    onNavigateToTask(taskId);
    // Keep drawer open on desktop for reference, close on mobile
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleShowMore = () => {
    setDaysToShow((prev) => prev + 7);
  };

  // Shared content renderer for both desktop and mobile
  const renderContent = () => (
    <>
      {totalTasks === 0 ? (
        <div className="py-12 text-center px-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-bg-neutral-subtle flex items-center justify-center">
            <svg
              className="w-6 h-6 text-fg-neutral-soft"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-fg-neutral-secondary">
            No completions yet
          </p>
          <p className="text-sm text-fg-neutral-soft mt-1">
            Completed tasks and steps will appear here
          </p>
        </div>
      ) : (
        <div className="py-2">
          {completionGroups.map((group) => (
            <div key={group.dateKey}>
              {/* Date header */}
              <div className="px-4 py-2 text-xs font-medium text-fg-neutral-secondary sticky top-0">
                {group.displayDate}
              </div>

              {/* Task entries */}
              <div>
                {group.taskCompletions.map((task) => (
                  <TaskCompletionItem
                    key={task.taskId}
                    task={task}
                    onClick={() => handleTaskClick(task.taskId)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Show more button - only if hasMore */}
          {hasMore && (
            <div className="px-4 py-3">
              <button
                onClick={handleShowMore}
                className="w-full py-2 text-sm text-fg-neutral-secondary hover:text-fg-neutral-secondary hover:bg-bg-neutral-subtle rounded-lg transition-colors"
              >
                Show more
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop: Side drawer from right - JS conditional to prevent portal leaking */}
      {isDesktop && (
        <div
          className={`
            flex flex-col flex-shrink-0 border-l border-border-color-neutral
            transition-all duration-300 ease-in-out overflow-hidden fixed right-0 top-0 bottom-0 z-40
            ${isOpen ? "w-[400px]" : "w-0 border-l-0"}
          `}
        >
          <div
            className={`w-[400px] flex flex-col h-full transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Header - matches main navbar (no bottom border) */}
            <div className="h-14 flex items-center justify-between px-2 flex-shrink-0">
              <div className="px-2">
                <h2 className="text-base font-medium text-fg-neutral-primary">
                  Completed
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-fg-neutral-secondary" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {renderContent()}
            </div>
          </div>
        </div>
      )}

      {/* Desktop backdrop (subtle) - JS conditional */}
      {isDesktop && (
        <div
          className={`fixed inset-0 z-30 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />
      )}

      {/* Mobile/Tablet: Bottom sheet - JS conditional to prevent dual rendering */}
      {!isDesktop && (
        <BottomSheet isOpen={isOpen} onClose={onClose} height="50vh">
          {/* Mobile header row - matches main navbar (no bottom border) */}
          <div className="h-14 flex items-center justify-between px-2 flex-shrink-0">
            <div className="px-2">
              <h2 className="text-base font-medium text-fg-neutral-primary">
                Completed
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-fg-neutral-secondary" />
            </button>
          </div>

          {/* Mobile content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {renderContent()}
            {/* Safe area spacer - uses CSS var from BottomSheet (0 when keyboard open) */}
            <div style={{ height: 'var(--safe-area-bottom, env(safe-area-inset-bottom))' }} />
          </div>
        </BottomSheet>
      )}
    </>
  );
}

// Task-centric completion item (task as anchor, steps as children)
function TaskCompletionItem({
  task,
  onClick,
}: {
  task: TaskCompletion;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 hover:bg-bg-neutral-subtle transition-colors text-left"
    >
      {/* Task header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Checkmark icon */}
          <svg
            className="w-4 h-4 text-fg-positive flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium text-fg-neutral-primary truncate">
            {task.taskTitle}
          </span>
          {/* Routine indicator */}
          {task.isRoutine && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-bg-accent-subtle text-fg-accent-primary">
              Routine
            </span>
          )}
        </div>
        {/* Focus time on right */}
        {task.focusTimeMinutes > 0 && (
          <span className="text-xs text-fg-neutral-soft flex-shrink-0">
            {formatMinutes(task.focusTimeMinutes)}
          </span>
        )}
      </div>

      {/* Completed steps as children (only if task not fully completed) */}
      {task.completedSteps.length > 0 && (
        <div className="mt-1.5 ml-6 pl-3 border-l-2 border-border-color-neutral space-y-1.5">
          {task.completedSteps.map((step) => (
            <div
              key={step.stepId}
              className="text-sm text-fg-neutral-secondary truncate"
            >
              {step.stepText}
            </div>
          ))}
        </div>
      )}

      {/* Show completion type label */}
      {task.isTaskCompleted && task.completedSteps.length === 0 && !task.isRoutine && (
        <div className="mt-0.5 ml-6 text-xs text-fg-neutral-soft">
          Task completed
        </div>
      )}
    </button>
  );
}
