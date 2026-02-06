"use client";

import { useState, useMemo, useEffect } from "react";
import { Task, Project } from "@/lib/types";
import {
  computeHealthStatus,
  buildProjectMap,
  searchTasks,
  getSearchPreview,
  SearchResult,
} from "@/lib/utils";
import {
  AlertCircle,
  Eye,
} from "lucide-react";

type FilterType = "needs_attention" | "high_priority" | "waiting" | "deferred" | "completed" | "archived" | null;

interface SearchViewProps {
  query: string;
  onQueryChange: (query: string) => void;
  tasks: Task[];
  projects: Project[];
  onOpenTask: (taskId: string) => void;
  onNavigateToProjects: () => void;
  initialFilter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
}

export default function SearchView({
  query,
  onQueryChange,
  tasks,
  projects,
  onOpenTask,
  onNavigateToProjects,
  initialFilter,
  onFilterChange,
}: SearchViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter || null);

  // Sync activeFilter with initialFilter (handles both setting and clearing)
  useEffect(() => {
    setActiveFilter(initialFilter || null);
  }, [initialFilter]);

  // Build project map for search (memoized)
  const projectMap = useMemo(() => buildProjectMap(projects), [projects]);

  // Search results - use new searchTasks helper with all-field search + ranking
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    // Filter out deleted tasks before search
    const activeTasks = tasks.filter((t) => !t.deletedAt);
    return searchTasks(activeTasks, query, projectMap);
  }, [query, tasks, projectMap]);

  // Filter results for quick access buttons
  const filterResults = useMemo(() => {
    if (!activeFilter) return [];
    switch (activeFilter) {
      case "needs_attention":
        return tasks.filter((t) => {
          if (t.deletedAt || t.status === "archived" || t.status === "complete") return false;
          const health = computeHealthStatus(t);
          return health.status === "at_risk" || health.status === "critical";
        });
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

  // Separate alert and watch results for two-section display
  const alertResults = useMemo(() => {
    if (activeFilter !== 'needs_attention') return [];
    return tasks.filter(t => {
      if (t.deletedAt || t.status === "archived" || t.status === "complete") return false;
      return computeHealthStatus(t).status === "critical";
    });
  }, [activeFilter, tasks]);

  const watchResults = useMemo(() => {
    if (activeFilter !== 'needs_attention') return [];
    return tasks.filter(t => {
      if (t.deletedAt || t.status === "archived" || t.status === "complete") return false;
      return computeHealthStatus(t).status === "at_risk";
    });
  }, [activeFilter, tasks]);

  // Quick Access counts
  const counts = useMemo(() => {
    const activeTasks = tasks.filter((t) => !t.deletedAt && t.status !== "archived" && t.status !== "complete");
    return {
      needsAttention: activeTasks.filter((t) => {
        const health = computeHealthStatus(t);
        return health.status === "at_risk" || health.status === "critical";
      }).length,
      highPriority: activeTasks.filter((t) => t.priority === "high").length,
      projects: new Set(activeTasks.map((t) => t.projectId).filter(Boolean)).size,
      completed: tasks.filter((t) => t.status === "complete" && !t.deletedAt).length,
      archived: tasks.filter((t) => t.status === "archived" && !t.deletedAt).length,
      waiting: activeTasks.filter((t) => t.waitingOn !== null).length,
      deferred: activeTasks.filter((t) => t.deferredUntil !== null).length,
    };
  }, [tasks]);

  const handleFilterClick = (filter: FilterType) => {
    const newFilter = activeFilter === filter ? null : filter;
    setActiveFilter(newFilter);
    onQueryChange(""); // Clear search when using filter
    // Notify parent of filter change for view title and back button
    onFilterChange?.(newFilter);
  };

  return (
    <div className="space-y-6">
      {/* Needs Attention - Two Sections (Alert + Watch) */}
      {!query.trim() && activeFilter === "needs_attention" && (
        <section className="space-y-6">
          {/* Alert Section (critical) */}
          {alertResults.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-base font-medium text-fg-neutral-secondary mb-3">
                <AlertCircle size={16} />
                <span>Alert</span>
                <span className="text-sm font-normal text-fg-neutral-soft">
                  {alertResults.length}
                </span>
              </h2>
              <div className="space-y-2">
                {alertResults.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onOpenTask(task.id)}
                    className="w-full text-left bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.status} />
                      <span className="text-fg-neutral-primary">
                        {task.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Watch Section (at_risk) */}
          {watchResults.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-base font-medium text-fg-neutral-secondary mb-3">
                <Eye size={16} />
                <span>Watch</span>
                <span className="text-sm font-normal text-fg-neutral-soft">
                  {watchResults.length}
                </span>
              </h2>
              <div className="space-y-2">
                {watchResults.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onOpenTask(task.id)}
                    className="w-full text-left bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.status} />
                      <span className="text-fg-neutral-primary">
                        {task.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {alertResults.length === 0 && watchResults.length === 0 && (
            <div className="text-center py-8 text-fg-neutral-secondary">
              No tasks need attention
            </div>
          )}
        </section>
      )}

      {/* Other Filter Results */}
      {!query.trim() && activeFilter && activeFilter !== "needs_attention" && (
        <section>
          <p className="text-sm text-fg-neutral-secondary mb-3">
            {filterResults.length} task{filterResults.length !== 1 ? 's' : ''}
          </p>
          {filterResults.length > 0 ? (
            <div className="space-y-2">
              {filterResults.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onOpenTask(task.id)}
                  className="w-full text-left bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} />
                    <span className="text-fg-neutral-primary">
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
            <div className="text-center py-8 text-fg-neutral-secondary">
              No tasks found
            </div>
          )}
        </section>
      )}

      {/* Search Results */}
      {query.trim() && (
        <section>
          <h2 className="text-base font-medium text-fg-neutral-secondary mb-3">
            Results ({searchResults.length})
          </h2>
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result) => {
                const preview = getSearchPreview(result, query);
                return (
                  <SearchResultItem
                    key={result.task.id}
                    result={result}
                    query={query}
                    preview={preview}
                    onClick={() => onOpenTask(result.task.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-fg-neutral-secondary">
              No tasks found matching "{query}"
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const classes = {
    inbox: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    pool: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    complete: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
    archived: "bg-zinc-100 dark:bg-zinc-700 text-fg-neutral-secondary",
  };

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${classes[status as keyof typeof classes] || classes.pool}`}>
      {status}
    </span>
  );
}

// Highlight text matching search query
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return <>{text}</>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-200 dark:bg-yellow-800/50 text-inherit rounded-sm px-0.5">
        {match}
      </mark>
      {after}
    </>
  );
}

// Search Result Item with preview and highlighting
interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  preview: { text: string; type: 'step' | 'snippet' | 'description' };
  onClick: () => void;
}

function SearchResultItem({ result, query, preview, onClick }: SearchResultItemProps) {
  const { task, matchLocations } = result;
  const titleHasMatch = matchLocations.includes('title');

  // Preview type indicator
  const previewIcon = preview.type === 'step' ? (
    <span className="text-violet-500 dark:text-violet-400 mr-1">→</span>
  ) : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
    >
      {/* Title row with status badge */}
      <div className="flex items-center gap-2">
        <StatusBadge status={task.status} />
        <span className="text-fg-neutral-primary flex-1 truncate">
          {titleHasMatch ? (
            <HighlightedText text={task.title} query={query} />
          ) : (
            task.title
          )}
        </span>
      </div>

      {/* Preview line */}
      {preview.text && (
        <p className="text-sm text-fg-neutral-secondary mt-1 line-clamp-1">
          {previewIcon}
          {preview.type === 'snippet' ? (
            <HighlightedText text={preview.text} query={query} />
          ) : (
            preview.text
          )}
        </p>
      )}
    </button>
  );
}
