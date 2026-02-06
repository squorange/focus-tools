"use client";

import { useState } from "react";
import { Task, FocusQueueItem } from "@/lib/types";
import { formatDate, computeHealthStatus } from "@/lib/utils";
import HealthPill from "@/components/shared/HealthPill";
import MetadataPill from "@/components/shared/MetadataPill";
import { ProgressRing } from "@design-system/components";

interface TaskRowProps {
  task: Task;
  queueItem?: FocusQueueItem;
  onOpenTask: (id: string) => void;
  onAddToQueue: (id: string, forToday?: boolean) => void;
  onDelete?: (id: string) => void;
  onDefer?: (id: string, until: string) => void;
  onPark?: (id: string) => void;
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
  const [showFocusDropdown, setShowFocusDropdown] = useState(false);

  const priority = getPriorityIndicator(task.priority);
  const progress = getProgress(task);
  const isInQueue = !!queueItem;
  const isWaiting = !!task.waitingOn;
  const isDeadlineOverdue = task.deadlineDate && task.deadlineDate < new Date().toISOString().split('T')[0];
  const isComplete = task.status === 'complete' ||
    (progress.total > 0 && progress.completed === progress.total);

  // Health status - only show for pool tasks that need attention
  const health = task.status === 'pool' ? computeHealthStatus(task) : null;
  const showHealthPill = health && health.status !== 'healthy';
  const hasReminder = !!task.reminder;

  // Calculate defer dates
  const getDeferDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // Shared menu dropdown
  const MenuDropdown = () => (
    <div
      className="absolute right-0 bottom-full mb-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[140px]"
      onClick={(e) => e.stopPropagation()}
    >
      {onDefer && (
        <>
          <div className="px-3 py-1 text-xs font-medium text-zinc-400 uppercase">Defer</div>
          <button
            onClick={() => { onDefer(task.id, getDeferDate(1)); setShowMenu(false); }}
            className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Tomorrow
          </button>
          <button
            onClick={() => { onDefer(task.id, getDeferDate(7)); setShowMenu(false); }}
            className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Next week
          </button>
          <button
            onClick={() => { onDefer(task.id, getDeferDate(30)); setShowMenu(false); }}
            className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Next month
          </button>
          <div className="border-t border-border-color-neutral my-1" />
        </>
      )}
      {onPark && (
        <button
          onClick={() => { onPark(task.id); setShowMenu(false); }}
          className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          Archive
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => { onDelete(task.id); setShowMenu(false); }}
          className="w-full px-3 py-1.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          Delete
        </button>
      )}
    </div>
  );

  return (
    <div
      className={`
        group px-3 sm:px-4 py-3
        border rounded-lg
        hover:border-zinc-300 dark:hover:border-zinc-700
        transition-colors cursor-pointer
        ${
          isComplete
            ? "border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 opacity-60"
            : "border-zinc-200 dark:border-zinc-800 bg-bg-neutral-min"
        }
      `}
      onClick={() => onOpenTask(task.id)}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-center sm:gap-2">
        {/* Progress ring - dashed for inbox, solid for pool */}
        <ProgressRing
          completed={progress.completed}
          total={progress.total}
          isComplete={isComplete}
          variant={task.status === 'inbox' ? 'dashed' : 'solid'}
        />

        {/* Priority indicator */}
        {priority && (
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.bg}`} title={priority.label} />
        )}

        {/* Waiting indicator */}
        {isWaiting && (
          <MetadataPill variant="waiting">
            Waiting: {task.waitingOn?.who}
          </MetadataPill>
        )}

        {/* Title */}
        <span className={`flex-1 truncate ${
          isComplete
            ? "text-fg-neutral-secondary line-through"
            : "text-fg-neutral-primary"
        }`}>
          {task.title || "Untitled"}
        </span>

        {/* Health status pill (non-healthy only) */}
        {showHealthPill && health && (
          <HealthPill health={health} size="sm" />
        )}

        {/* Reminder indicator */}
        {hasReminder && (
          <span className="flex-shrink-0 text-violet-500" title="Reminder set">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </span>
        )}

        {/* Target Date */}
        {task.targetDate && (
          <span className="flex-shrink-0 text-xs text-fg-neutral-secondary">
            Target {formatDate(task.targetDate)}
          </span>
        )}

        {/* Deadline Date */}
        {task.deadlineDate && (
          <span className={`flex-shrink-0 text-xs font-medium ${isDeadlineOverdue ? "text-red-600 dark:text-red-400" : "text-red-500"}`}>
            Due {formatDate(task.deadlineDate)}
          </span>
        )}

        {/* Queue status or Add button */}
        {isInQueue ? (
          <span className="flex-shrink-0 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
            In Focus
          </span>
        ) : isComplete ? (
          <span className="flex-shrink-0 text-xs text-green-600 dark:text-green-400">
            Done
          </span>
        ) : (
          <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <div className="flex">
              <button
                onClick={() => onAddToQueue(task.id, false)}
                className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-l px-2 py-1 hover:bg-violet-200 dark:hover:bg-violet-900/50"
              >
                → Focus
              </button>
              <button
                onClick={() => setShowFocusDropdown(!showFocusDropdown)}
                className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-r border-l border-violet-200 dark:border-violet-700 px-1 py-1 hover:bg-violet-200 dark:hover:bg-violet-900/50"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {showFocusDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFocusDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[140px]">
                  <button
                    onClick={() => { onAddToQueue(task.id, true); setShowFocusDropdown(false); }}
                    className="w-full px-3 py-2 text-sm text-left text-fg-neutral-primary hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    Add to Today
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions menu */}
        {(onDelete || onDefer || onPark) && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              title="More actions"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenu && <MenuDropdown />}
          </div>
        )}
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden">
        {/* Row 1: Ring + Title + Actions */}
        <div className="flex items-start gap-2">
          {/* Progress ring */}
          <div className="flex-shrink-0 mt-0.5">
            <ProgressRing
              completed={progress.completed}
              total={progress.total}
              isComplete={isComplete}
              variant={task.status === 'inbox' ? 'dashed' : 'solid'}
            />
          </div>
          <span className={`flex-1 min-w-0 ${
            isComplete
              ? "text-fg-neutral-secondary line-through"
              : "text-fg-neutral-primary"
          }`}>
            {task.title || "Untitled"}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isInQueue ? (
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                In Focus
              </span>
            ) : isComplete ? (
              <span className="text-xs text-green-600 dark:text-green-400">
                Done
              </span>
            ) : (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex">
                  <button
                    onClick={() => onAddToQueue(task.id, false)}
                    className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-l px-2 py-1"
                  >
                    → Focus
                  </button>
                  <button
                    onClick={() => setShowFocusDropdown(!showFocusDropdown)}
                    className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-r border-l border-violet-200 dark:border-violet-700 px-1 py-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {showFocusDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFocusDropdown(false)} />
                    <div className="absolute right-0 top-full mt-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[140px]">
                      <button
                        onClick={() => { onAddToQueue(task.id, true); setShowFocusDropdown(false); }}
                        className="w-full px-3 py-2 text-sm text-left text-fg-neutral-primary hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        Add to Today
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {(onDelete || onDefer || onPark) && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showMenu && <MenuDropdown />}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Metadata */}
        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-fg-neutral-secondary">
          {/* Health pill (leading position for non-healthy) */}
          {showHealthPill && health && (
            <HealthPill health={health} size="sm" />
          )}
          {/* Reminder indicator */}
          {hasReminder && (
            <span className="text-violet-500 flex items-center" title="Reminder set">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </span>
          )}
          {priority && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${priority.bg}`} />
              <span>{priority.label}</span>
            </div>
          )}
          {isWaiting && (
            <MetadataPill variant="waiting">
              Waiting: {task.waitingOn?.who}
            </MetadataPill>
          )}
          {progress.total > 0 && (
            <span>{progress.completed}/{progress.total} steps</span>
          )}
          {task.targetDate && (
            <span>Target {formatDate(task.targetDate)}</span>
          )}
          {task.deadlineDate && (
            <span className={`font-medium ${isDeadlineOverdue ? "text-red-600 dark:text-red-400" : "text-red-500"}`}>
              Due {formatDate(task.deadlineDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
