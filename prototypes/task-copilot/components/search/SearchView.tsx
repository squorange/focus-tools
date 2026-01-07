"use client";

import { useState, useMemo } from "react";
import { Task } from "@/lib/types";

type FilterType = "high_priority" | "waiting" | "deferred" | "completed" | "archived" | null;

interface SearchViewProps {
  query: string;
  onQueryChange: (query: string) => void;
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onNavigateToProjects: () => void;
}

export default function SearchView({
  query,
  onQueryChange,
  tasks,
  onOpenTask,
  onNavigateToProjects,
}: SearchViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  // Search results - filter tasks by query
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return tasks.filter(
      (t) =>
        !t.deletedAt &&
        (t.title.toLowerCase().includes(lowerQuery) ||
          t.description?.toLowerCase().includes(lowerQuery) ||
          t.steps.some((s) => s.text.toLowerCase().includes(lowerQuery)))
    );
  }, [query, tasks]);

  // Filter results for quick access buttons
  const filterResults = useMemo(() => {
    if (!activeFilter) return [];
    switch (activeFilter) {
      case "high_priority":
        return tasks.filter((t) => !t.deletedAt && t.status !== "archived" && t.priority === "high");
      case "waiting":
        return tasks.filter((t) => !t.deletedAt && t.status !== "archived" && t.waitingOn !== null);
      case "deferred":
        return tasks.filter((t) => !t.deletedAt && t.status !== "archived" && t.deferredUntil !== null);
      case "completed":
        return tasks.filter((t) => !t.deletedAt && t.status === "complete");
      case "archived":
        return tasks.filter((t) => !t.deletedAt && t.status === "archived");
      default:
        return [];
    }
  }, [activeFilter, tasks]);

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(activeFilter === filter ? null : filter);
    onQueryChange(""); // Clear search when using filter
  };

  // Quick Access counts
  const counts = useMemo(() => {
    const activeTasks = tasks.filter((t) => !t.deletedAt && t.status !== "archived");
    return {
      highPriority: activeTasks.filter((t) => t.priority === "high").length,
      projects: new Set(activeTasks.map((t) => t.projectId).filter(Boolean)).size,
      completed: tasks.filter((t) => t.status === "complete" && !t.deletedAt).length,
      archived: tasks.filter((t) => t.status === "archived" && !t.deletedAt).length,
      waiting: activeTasks.filter((t) => t.waitingOn !== null).length,
      deferred: activeTasks.filter((t) => t.deferredUntil !== null).length,
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Search input (mobile focused) */}
      <div className="sm:hidden relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search tasks..."
          autoFocus
          data-search-input
          className="w-full pl-10 pr-4 py-3 text-base rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Quick Access - show when no query and no filter */}
      {!query.trim() && !activeFilter && (
        <section>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Quick Access
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <QuickAccessCard
              label="High Priority"
              count={counts.highPriority}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              color="red"
              onClick={() => handleFilterClick("high_priority")}
            />
            <QuickAccessCard
              label="Waiting"
              count={counts.waiting}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="yellow"
              onClick={() => handleFilterClick("waiting")}
            />
            <QuickAccessCard
              label="Deferred"
              count={counts.deferred}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              color="blue"
              onClick={() => handleFilterClick("deferred")}
            />
            <QuickAccessCard
              label="Completed"
              count={counts.completed}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
              color="green"
              onClick={() => handleFilterClick("completed")}
            />
            <QuickAccessCard
              label="Archived"
              count={counts.archived}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              }
              color="zinc"
              onClick={() => handleFilterClick("archived")}
            />
            <QuickAccessCard
              label="Projects"
              count={counts.projects}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              }
              color="purple"
              onClick={onNavigateToProjects}
            />
          </div>
        </section>
      )}

      {/* Filter Results */}
      {!query.trim() && activeFilter && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {activeFilter === "high_priority" && "High Priority"}
              {activeFilter === "waiting" && "Waiting On"}
              {activeFilter === "deferred" && "Deferred"}
              {activeFilter === "completed" && "Completed"}
              {activeFilter === "archived" && "Archived"}
              {" "}({filterResults.length})
            </h2>
            <button
              onClick={() => setActiveFilter(null)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filter
            </button>
          </div>
          {filterResults.length > 0 ? (
            <div className="space-y-2">
              {filterResults.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onOpenTask(task.id)}
                  className="w-full text-left bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} />
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {task.title}
                    </span>
                  </div>
                  {task.waitingOn && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      Waiting on: {task.waitingOn.who}
                    </p>
                  )}
                  {task.deferredUntil && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Deferred until: {task.deferredUntil}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              No tasks found
            </div>
          )}
        </section>
      )}

      {/* Search Results */}
      {query.trim() && (
        <section>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Results ({searchResults.length})
          </h2>
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onOpenTask(task.id)}
                  className="w-full text-left bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} />
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              No tasks found matching "{query}"
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// Quick Access Card Component
interface QuickAccessCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: "red" | "yellow" | "blue" | "green" | "zinc" | "purple";
  onClick: () => void;
}

function QuickAccessCard({ label, count, icon, color, onClick }: QuickAccessCardProps) {
  const colorClasses = {
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
    zinc: "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border ${colorClasses[color]} hover:opacity-80 transition-opacity text-left`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-2xl font-semibold">{count}</span>
      </div>
      <span className="text-sm opacity-80">{label}</span>
    </button>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const classes = {
    inbox: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    pool: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    complete: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
    archived: "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400",
  };

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${classes[status as keyof typeof classes] || classes.pool}`}>
      {status}
    </span>
  );
}
