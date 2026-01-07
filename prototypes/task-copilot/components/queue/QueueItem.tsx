"use client";

import { useState } from "react";
import { Task, FocusQueueItem, Project } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import MetadataPill from "@/components/shared/MetadataPill";

// Progress ring showing step completion as a circular indicator
function ProgressRing({
  completed,
  total,
  isComplete,
}: {
  completed: number;
  total: number;
  isComplete: boolean;
}) {
  const size = 20;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference - progress * circumference;

  if (isComplete) {
    return (
      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-zinc-200 dark:text-zinc-700"
      />
      {/* Progress arc */}
      {progress > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-violet-500"
        />
      )}
    </svg>
  );
}

interface QueueItemProps {
  item: FocusQueueItem;
  task: Task;
  projects: Project[];
  isFirst?: boolean;
  isLast?: boolean;
  isToday?: boolean;
  onOpenTask: (id: string) => void;
  onStartFocus: (queueItemId: string) => void;
  onRemoveFromQueue: (queueItemId: string) => void;
  onMoveUp?: (queueItemId: string) => void;
  onMoveDown?: (queueItemId: string) => void;
}

// Calculate progress
function getProgress(
  task: Task,
  item: FocusQueueItem
): { completed: number; total: number; label: string } {
  if (item.selectionType === "entire_task") {
    if (task.steps.length === 0) {
      return { completed: 0, total: 0, label: "No steps" };
    }
    const completed = task.steps.filter((s) => s.completed).length;
    return {
      completed,
      total: task.steps.length,
      label: `${completed}/${task.steps.length} steps`,
    };
  } else {
    const selectedSteps = task.steps.filter((s) =>
      item.selectedStepIds.includes(s.id)
    );
    const completed = selectedSteps.filter((s) => s.completed).length;
    const stepNumbers = item.selectedStepIds.map((id) => {
      const idx = task.steps.findIndex((s) => s.id === id);
      return idx + 1;
    });
    const rangeLabel =
      stepNumbers.length === 1
        ? `Step ${stepNumbers[0]}`
        : `Steps ${Math.min(...stepNumbers)}-${Math.max(...stepNumbers)}`;

    return {
      completed,
      total: selectedSteps.length,
      label: `${rangeLabel} (${completed}/${selectedSteps.length})`,
    };
  }
}

// Get time estimate for queue item
function getEstimate(task: Task, item: FocusQueueItem): string | null {
  const steps =
    item.selectionType === "entire_task"
      ? task.steps
      : task.steps.filter((s) => item.selectedStepIds.includes(s.id));

  const incompleteSteps = steps.filter((s) => !s.completed);
  const totalMinutes = incompleteSteps.reduce(
    (sum, s) => sum + (s.estimatedMinutes || 0),
    0
  );

  if (totalMinutes === 0) return null;
  if (totalMinutes < 60) return `~${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
}

// Check if date is overdue
function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
}

export default function QueueItem({
  item,
  task,
  projects,
  isFirst = false,
  isLast = false,
  isToday = true,
  onOpenTask,
  onStartFocus,
  onRemoveFromQueue,
  onMoveUp,
  onMoveDown,
}: QueueItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const progress = getProgress(task, item);
  const estimate = getEstimate(task, item);
  // Complete if: task is done, queue item is done, OR all steps are complete
  const isComplete = task.status === 'complete' || item.completed ||
    (progress.total > 0 && progress.completed === progress.total);
  const hasWaiting = !!task.waitingOn;
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;

  // Check if we have any metadata to display
  const hasMetadata = progress.total > 0 || estimate || task.targetDate ||
    task.deadlineDate || task.priority === "high" || task.priority === "medium" || project;

  return (
    <div
      className={`
        group relative px-2 sm:px-3 py-3
        border rounded-lg
        transition-all duration-300 select-none
        ${
          isComplete
            ? "border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 opacity-60"
            : isToday
              ? "border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-600"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-600"
        }
      `}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-center sm:gap-2">
        {/* Status indicator OR drag handle on hover */}
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {/* Ring shown by default, hidden on group-hover */}
          <button
            onClick={() => onOpenTask(task.id)}
            className="group-hover:hidden"
          >
            <ProgressRing
              completed={progress.completed}
              total={progress.total}
              isComplete={isComplete}
            />
          </button>
          {/* Drag handle shown on hover only */}
          <div className="hidden group-hover:block text-zinc-400 cursor-grab active:cursor-grabbing">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="7" r="1.5" />
              <circle cx="15" cy="7" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="17" r="1.5" />
              <circle cx="15" cy="17" r="1.5" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <button
          onClick={() => onOpenTask(task.id)}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-zinc-900 dark:text-zinc-100 truncate ${
                isComplete ? "line-through opacity-60" : ""
              }`}
            >
              {task.title || "Untitled"}
            </span>
            {hasWaiting && (
              <span
                className="flex-shrink-0 text-amber-500"
                title={`Waiting on: ${task.waitingOn?.who}`}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </div>
          {hasMetadata && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {progress.total > 0 && <MetadataPill>{progress.label}</MetadataPill>}
              {estimate && <MetadataPill>{estimate}</MetadataPill>}
              {task.targetDate && (
                <MetadataPill>Target {formatDate(task.targetDate)}</MetadataPill>
              )}
              {task.deadlineDate && (
                <MetadataPill variant={isOverdue(task.deadlineDate) ? "overdue" : "due"}>
                  Due {formatDate(task.deadlineDate)}
                </MetadataPill>
              )}
              {task.priority === "high" && <MetadataPill variant="priority-high">High</MetadataPill>}
              {task.priority === "medium" && <MetadataPill variant="priority-medium">Medium</MetadataPill>}
              {project && (
                <MetadataPill variant="project" color={project.color || "#9ca3af"}>
                  {project.name}
                </MetadataPill>
              )}
            </div>
          )}
        </button>

        {/* Menu button - Desktop */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex-shrink-0 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            title="More actions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className={`absolute right-0 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-30 min-w-[140px] ${
                isFirst ? "top-full mt-1" : "bottom-full mb-1"
              }`}>
                {!isComplete && (
                  <button
                    onClick={() => { onStartFocus(item.id); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-sm text-left text-violet-600 dark:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Focus
                  </button>
                )}
                {!isComplete && (onMoveUp || onMoveDown) && <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />}
                {onMoveUp && (
                  <button
                    onClick={() => { onMoveUp(item.id); setShowMenu(false); }}
                    disabled={isFirst}
                    className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Move Up
                  </button>
                )}
                {onMoveDown && (
                  <button
                    onClick={() => { onMoveDown(item.id); setShowMenu(false); }}
                    disabled={isLast}
                    className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Move Down
                  </button>
                )}
                {(onMoveUp || onMoveDown) && <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />}
                <button
                  onClick={() => { onRemoveFromQueue(item.id); setShowMenu(false); }}
                  className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Tasks
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden">
        {/* Row 1: Progress ring + Title + Actions */}
        <div className="flex items-start gap-2">
          <button
            onClick={() => onOpenTask(task.id)}
            className="flex-shrink-0 w-5 h-5 mt-0.5"
          >
            <ProgressRing
              completed={progress.completed}
              total={progress.total}
              isComplete={isComplete}
            />
          </button>

          <button
            onClick={() => onOpenTask(task.id)}
            className="flex-1 min-w-0 text-left"
          >
            <span
              className={`text-zinc-900 dark:text-zinc-100 ${
                isComplete ? "line-through opacity-60" : ""
              }`}
            >
              {task.title || "Untitled"}
            </span>
          </button>

          <div className="flex items-center gap-1 flex-shrink-0">
            {hasWaiting && (
              <span className="text-amber-500" title={`Waiting on: ${task.waitingOn?.who}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
            {/* Menu button - Mobile */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                  <div className={`absolute right-0 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-30 min-w-[140px] ${
                    isFirst ? "top-full mt-1" : "bottom-full mb-1"
                  }`}>
                    {!isComplete && (
                      <button
                        onClick={() => { onStartFocus(item.id); setShowMenu(false); }}
                        className="w-full px-3 py-1.5 text-sm text-left text-violet-600 dark:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Start Focus
                      </button>
                    )}
                    {!isComplete && (onMoveUp || onMoveDown) && <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />}
                    {onMoveUp && (
                      <button
                        onClick={() => { onMoveUp(item.id); setShowMenu(false); }}
                        disabled={isFirst}
                        className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Move Up
                      </button>
                    )}
                    {onMoveDown && (
                      <button
                        onClick={() => { onMoveDown(item.id); setShowMenu(false); }}
                        disabled={isLast}
                        className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Move Down
                      </button>
                    )}
                    {(onMoveUp || onMoveDown) && <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />}
                    <button
                      onClick={() => { onRemoveFromQueue(item.id); setShowMenu(false); }}
                      className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      Tasks
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Metadata pills (only if content exists) */}
        {hasMetadata && (
          <div className="flex items-center gap-2 mt-2 ml-6">
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {progress.total > 0 && <MetadataPill>{progress.label}</MetadataPill>}
              {estimate && <MetadataPill>{estimate}</MetadataPill>}
              {task.targetDate && (
                <MetadataPill>{formatDate(task.targetDate)}</MetadataPill>
              )}
              {task.deadlineDate && (
                <MetadataPill variant={isOverdue(task.deadlineDate) ? "overdue" : "due"}>
                  {formatDate(task.deadlineDate)}
                </MetadataPill>
              )}
              {task.priority === "high" && <MetadataPill variant="priority-high">High</MetadataPill>}
              {task.priority === "medium" && <MetadataPill variant="priority-medium">Medium</MetadataPill>}
              {project && (
                <MetadataPill variant="project" color={project.color || "#9ca3af"}>
                  {project.name}
                </MetadataPill>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
