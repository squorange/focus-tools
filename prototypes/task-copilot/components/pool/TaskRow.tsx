"use client";

import { useState } from "react";
import { Task, FocusQueueItem } from "@/lib/types";

interface TaskRowProps {
  task: Task;
  queueItem?: FocusQueueItem;
  onOpenTask: (id: string) => void;
  onAddToQueue: (id: string, forToday?: boolean) => void;
  onDelete?: (id: string) => void;
  onDefer?: (id: string, until: string) => void;
  onPark?: (id: string) => void;
}

// Format date for display
function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === today.toISOString().split("T")[0]) return "Today";
  if (dateStr === tomorrow.toISOString().split("T")[0]) return "Tomorrow";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Get priority indicator
function getPriorityIndicator(priority: Task["priority"]) {
  switch (priority) {
    case "high":
      return { color: "text-red-500", bg: "bg-red-500", label: "High" };
    case "medium":
      return { color: "text-amber-500", bg: "bg-amber-500", label: "Med" };
    case "low":
      return { color: "text-blue-500", bg: "bg-blue-500", label: "Low" };
    default:
      return null;
  }
}

// Calculate progress
function getProgress(task: Task): { completed: number; total: number } {
  if (task.steps.length === 0) return { completed: 0, total: 0 };
  const completed = task.steps.filter((s) => s.completed).length;
  return { completed, total: task.steps.length };
}

export default function TaskRow({
  task,
  queueItem,
  onOpenTask,
  onAddToQueue,
  onDelete,
  onDefer,
  onPark,
}: TaskRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const priority = getPriorityIndicator(task.priority);
  const progress = getProgress(task);
  const isInQueue = !!queueItem;
  const isWaiting = !!task.waitingOn;
  const targetDate = task.targetDate || task.deadlineDate;
  const isDeadline = !!task.deadlineDate;

  // Calculate defer dates
  const getDeferDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return (
    <div
      className={`
        group flex items-center gap-3 px-4 py-3
        bg-white dark:bg-zinc-800
        border rounded-lg
        hover:border-violet-300 dark:hover:border-violet-700
        transition-colors cursor-pointer
        ${
          isInQueue
            ? "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10"
            : "border-zinc-200 dark:border-zinc-700"
        }
      `}
      onClick={() => onOpenTask(task.id)}
    >
      {/* Priority indicator */}
      {priority && (
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.bg}`}
          title={priority.label}
        />
      )}

      {/* Waiting indicator */}
      {isWaiting && (
        <span
          className="flex-shrink-0 text-amber-500"
          title={`Waiting on: ${task.waitingOn?.who}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}

      {/* Title */}
      <span className="flex-1 text-zinc-900 dark:text-zinc-100 truncate">
        {task.title || "Untitled"}
      </span>

      {/* Progress */}
      {progress.total > 0 && (
        <span className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
          {progress.completed}/{progress.total}
        </span>
      )}

      {/* Date */}
      {targetDate && (
        <span
          className={`flex-shrink-0 text-xs ${
            isDeadline
              ? "text-red-500 font-medium"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {isDeadline && "⚠️ "}
          {formatDate(targetDate)}
        </span>
      )}

      {/* Queue status or Add button */}
      {isInQueue ? (
        <span className="flex-shrink-0 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
          In Focus
        </span>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToQueue(task.id);
          }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-none rounded px-2 py-1 hover:bg-violet-200 dark:hover:bg-violet-900/50"
        >
          Add to Focus
        </button>
      )}

      {/* Actions menu */}
      {(onDelete || onDefer || onPark) && (
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            title="More actions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[140px]"
              onClick={(e) => e.stopPropagation()}
            >
              {onDefer && (
                <>
                  <div className="px-3 py-1 text-xs font-medium text-zinc-400 uppercase">Defer</div>
                  <button
                    onClick={() => {
                      onDefer(task.id, getDeferDate(1));
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => {
                      onDefer(task.id, getDeferDate(7));
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    Next week
                  </button>
                  <button
                    onClick={() => {
                      onDefer(task.id, getDeferDate(30));
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    Next month
                  </button>
                  <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
                </>
              )}
              {onPark && (
                <button
                  onClick={() => {
                    onPark(task.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  Archive
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(task.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chevron */}
      <svg
        className="w-4 h-4 text-zinc-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  );
}
