"use client";

import { Task } from "@/lib/types";
import { getTaskProgress, formatDate, isOverdue, isDueSoon } from "@/lib/utils";

interface TaskRowProps {
  task: Task;
  onClick: () => void;
  onFocusClick: () => void;
  variant?: "default" | "completed";
}

export default function TaskRow({
  task,
  onClick,
  onFocusClick,
  variant = "default",
}: TaskRowProps) {
  const progress = getTaskProgress(task);
  const hasSteps = task.steps.length > 0;
  const completedSteps = task.steps.filter((s) => s.completed).length;
  const isTaskOverdue = isOverdue(task);
  const isTaskDueSoon = isDueSoon(task);
  const isCompleted = variant === "completed";

  // Priority colors
  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-blue-500",
  };

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
        ${isCompleted
          ? "bg-zinc-100/50 dark:bg-zinc-900/50"
          : "bg-zinc-50 dark:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-600"
        }
        border border-zinc-200 dark:border-zinc-700
      `}
      onClick={onClick}
    >
      {/* Priority indicator */}
      {task.priority && (
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`}
        />
      )}

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Title */}
          <span
            className={`text-sm truncate ${
              isCompleted
                ? "text-zinc-500 dark:text-zinc-400 line-through"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {task.title}
          </span>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex gap-1 flex-shrink-0">
              {task.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Meta row: progress + deadline */}
        <div className="flex items-center gap-3 mt-1">
          {/* Progress */}
          {hasSteps && !isCompleted && (
            <div className="flex items-center gap-1.5">
              {/* Progress bar */}
              <div className="w-16 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                {completedSteps}/{task.steps.length}
              </span>
            </div>
          )}

          {/* Deadline */}
          {task.deadlineDate && !isCompleted && (
            <span
              className={`text-xs ${
                isTaskOverdue
                  ? "text-red-500"
                  : isTaskDueSoon
                  ? "text-amber-500"
                  : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              {isTaskOverdue ? "Overdue" : formatDate(task.deadlineDate)}
            </span>
          )}

          {/* Effort indicator */}
          {task.effort && !isCompleted && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {task.effort === "quick" && "⚡"}
              {task.effort === "medium" && "📋"}
              {task.effort === "deep" && "🎯"}
            </span>
          )}
        </div>
      </div>

      {/* Focus button */}
      {!isCompleted && hasSteps && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFocusClick();
          }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
          title="Enter focus mode"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      )}

      {/* Completed checkmark */}
      {isCompleted && (
        <div className="flex-shrink-0 text-green-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
