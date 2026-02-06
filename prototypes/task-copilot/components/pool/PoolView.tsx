"use client";

import { useState, useMemo } from "react";
import { Task, FocusQueue, FocusQueueItem } from "@/lib/types";
import { computeFocusScore } from "@/lib/utils";
import TaskRow from "./TaskRow";

interface PoolViewProps {
  tasks: Task[];
  queue: FocusQueue;
  onOpenTask: (id: string) => void;
  onAddToQueue: (id: string, forToday?: boolean) => void;
}

type SortOption = "focusScore" | "priority" | "targetDate" | "createdAt";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "focusScore", label: "Focus Score" },
  { value: "priority", label: "Priority" },
  { value: "targetDate", label: "Due Date" },
  { value: "createdAt", label: "Created" },
];

// Sort tasks by option
function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "focusScore":
        return (computeFocusScore(b) || 0) - (computeFocusScore(a) || 0);
      case "priority": {
        const priorityOrder = { high: 0, medium: 1, low: 2, null: 3 };
        return (
          (priorityOrder[a.priority || "null"] || 3) -
          (priorityOrder[b.priority || "null"] || 3)
        );
      }
      case "targetDate": {
        const aDate = a.deadlineDate || a.targetDate;
        const bDate = b.deadlineDate || b.targetDate;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return aDate.localeCompare(bDate);
      }
      case "createdAt":
        return b.createdAt - a.createdAt;
      default:
        return 0;
    }
  });
}

// Filter tasks by search term
function filterBySearch(tasks: Task[], search: string): Task[] {
  if (!search.trim()) return tasks;
  const term = search.toLowerCase();
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term) ||
      task.steps.some((s) => s.text.toLowerCase().includes(term))
  );
}

// Get resurfaced tasks (deferred until today or earlier)
function getResurfacedTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split("T")[0];
  return tasks.filter(
    (t) =>
      t.deferredUntil &&
      t.deferredUntil <= today &&
      !t.deletedAt &&
      t.status !== 'archived'
  );
}

// Get regular pool tasks (not deferred)
function getRegularPoolTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split("T")[0];
  return tasks.filter(
    (t) =>
      (!t.deferredUntil || t.deferredUntil > today) &&
      !t.deletedAt &&
      t.status !== 'archived'
  );
}

export default function PoolView({
  tasks,
  queue,
  onOpenTask,
  onAddToQueue,
}: PoolViewProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("focusScore");

  // Get queue item for a task
  const getQueueItem = (taskId: string): FocusQueueItem | undefined => {
    return queue.items.find((item) => item.taskId === taskId && !item.completed);
  };

  // Process tasks
  const resurfacedTasks = useMemo(() => getResurfacedTasks(tasks), [tasks]);
  const regularTasks = useMemo(() => {
    const regular = getRegularPoolTasks(tasks);
    const filtered = filterBySearch(regular, search);
    return sortTasks(filtered, sortBy);
  }, [tasks, search, sortBy]);

  // Waiting on count
  const waitingCount = tasks.filter((t) => t.waitingOn).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-fg-neutral-primary">
            Pool
          </h1>
          <p className="text-sm text-fg-neutral-secondary">
            {tasks.length} tasks available
            {waitingCount > 0 && (
              <span className="ml-2 text-amber-500">
                ({waitingCount} waiting)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-bg-neutral-min border border-border-color-neutral rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 text-sm bg-bg-neutral-min border border-border-color-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Task Lists */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Resurfaced Section */}
        {resurfacedTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Resurfaced
              </h3>
              <span className="text-xs text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                {resurfacedTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {resurfacedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  queueItem={getQueueItem(task.id)}
                  onOpenTask={onOpenTask}
                  onAddToQueue={onAddToQueue}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Pool Tasks */}
        <div>
          {resurfacedTasks.length > 0 && regularTasks.length > 0 && (
            <h3 className="text-sm font-medium text-fg-neutral-secondary mb-3">
              Ready Tasks
            </h3>
          )}

          {regularTasks.length === 0 && resurfacedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 mb-4 rounded-full bg-bg-neutral-subtle flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-fg-neutral-primary mb-1">
                No tasks in pool
              </h3>
              <p className="text-sm text-fg-neutral-secondary max-w-xs">
                {search
                  ? "No tasks match your search"
                  : "Triage inbox items to add tasks here"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {regularTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  queueItem={getQueueItem(task.id)}
                  onOpenTask={onOpenTask}
                  onAddToQueue={onAddToQueue}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
