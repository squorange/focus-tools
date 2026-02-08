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

  // Priority colors using semantic tokens
  const priorityColors = {
    high: "bg-bg-alert-high",
    medium: "bg-bg-attention-high",
    low: "bg-bg-accent-high",
  };

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
        ${isCompleted
          ? "bg-bg-neutral-subtle"
          : "bg-bg-neutral-subtle hover:border-border-color-neutral-hover"
        }
        border border-border-color-neutral
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
                ? "text-fg-neutral-secondary line-through"
                : "text-fg-neutral-primary"
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
                  className="text-xs px-1.5 py-0.5 bg-bg-neutral-subtle text-fg-neutral-secondary rounded"
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
              <div className="w-16 h-1 bg-bg-neutral-low rounded-full overflow-hidden">
                <div
                  className="h-full bg-bg-positive-high rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-fg-neutral-soft">
                {completedSteps}/{task.steps.length}
              </span>
            </div>
          )}

          {/* Deadline */}
          {task.deadlineDate && !isCompleted && (
            <span
              className={`text-xs ${
                isTaskOverdue
                  ? "text-fg-alert"
                  : isTaskDueSoon
                  ? "text-fg-attention"
                  : "text-fg-neutral-soft"
              }`}
            >
              {isTaskOverdue ? "Overdue" : formatDate(task.deadlineDate)}
            </span>
          )}

          {/* Effort indicator */}
          {task.effort && !isCompleted && (
            <span className="text-xs text-fg-neutral-soft">
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
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 text-fg-neutral-soft hover:text-fg-accent-primary hover:bg-bg-accent-subtle rounded-lg transition-all"
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
        <div className="flex-shrink-0 text-fg-positive">
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
