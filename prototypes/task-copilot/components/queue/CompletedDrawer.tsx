"use client";

import { useState, useMemo } from "react";
import { Task } from "@/lib/types";
import { getCompletions, formatMinutes, TaskCompletion } from "@/lib/completions";

interface CompletedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onNavigateToTask: (taskId: string) => void;
}

export default function CompletedDrawer({
  isOpen,
  onClose,
  tasks,
  onNavigateToTask,
}: CompletedDrawerProps) {
  const [daysToShow, setDaysToShow] = useState(7);

  const { groups: completionGroups, hasMore } = useMemo(
    () => getCompletions(tasks, daysToShow),
    [tasks, daysToShow]
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
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-zinc-400"
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
          <p className="text-zinc-500 dark:text-zinc-400">
            No completions yet
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
            Completed tasks and steps will appear here
          </p>
        </div>
      ) : (
        <div className="py-2 pb-8">
          {completionGroups.map((group) => (
            <div key={group.dateKey}>
              {/* Date header */}
              <div className="px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 sticky top-0">
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
                className="w-full py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
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
      {/* Desktop: Side drawer from right */}
      <div
        className={`
          hidden lg:flex lg:flex-col lg:flex-shrink-0 lg:border-l lg:border-zinc-200 lg:dark:border-zinc-800 lg:bg-white lg:dark:bg-[#0c0c0c]
          transition-all duration-300 ease-in-out overflow-hidden fixed right-0 top-0 bottom-0 z-40
          ${isOpen ? "lg:w-[400px]" : "lg:w-0 lg:border-l-0"}
        `}
      >
        <div
          className={`w-[400px] flex flex-col h-full transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-transparent flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
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
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Completed
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Desktop backdrop (subtle) */}
      {isOpen && (
        <div
          className="hidden lg:block fixed inset-0 z-30"
          onClick={onClose}
        />
      )}

      {/* Mobile: Bottom sheet - z-50 to be above AI floating bar */}
      <div
        className={`
          lg:hidden fixed inset-x-0 bottom-0 z-50 h-[50vh] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-300/50 dark:border-zinc-700/50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-y-0" : "translate-y-full"}
        `}
      >
        {/* Mobile header - clickable button like AIDrawer */}
        <button
          onClick={onClose}
          className="w-full h-12 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-transparent flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
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
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Completed
            </span>
          </div>
          {/* Chevron down icon like AIDrawer */}
          <svg
            className="w-5 h-5 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Mobile content - with min-h-0 for proper scroll */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {renderContent()}
        </div>
      </div>

      {/* Mobile backdrop - z-40 to cover AI floating bar */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
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
      className="w-full px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-left"
    >
      {/* Task header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Checkmark icon */}
          <svg
            className="w-4 h-4 text-green-500 flex-shrink-0"
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
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {task.taskTitle}
          </span>
        </div>
        {/* Focus time on right */}
        {task.focusTimeMinutes > 0 && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
            {formatMinutes(task.focusTimeMinutes)}
          </span>
        )}
      </div>

      {/* Completed steps as children (only if task not fully completed) */}
      {task.completedSteps.length > 0 && (
        <div className="mt-1.5 ml-6 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-0.5">
          {task.completedSteps.map((step) => (
            <div
              key={step.stepId}
              className="text-sm text-zinc-500 dark:text-zinc-400 truncate"
            >
              {step.stepText}
            </div>
          ))}
        </div>
      )}

      {/* Show "Task completed" label if task is fully done with no visible steps */}
      {task.isTaskCompleted && task.completedSteps.length === 0 && (
        <div className="mt-0.5 ml-6 text-xs text-zinc-400 dark:text-zinc-500">
          Task completed
        </div>
      )}
    </button>
  );
}
