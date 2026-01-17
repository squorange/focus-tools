"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Task, FocusQueue, Project } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import TriageRow from "@/components/shared/TriageRow";
import MetadataPill from "@/components/shared/MetadataPill";

// Filter types for pills
type FilterPillType = 'all' | 'triage' | 'ready' | 'high' | 'waiting' | 'deferred' | 'done' | 'archived';

interface TasksViewProps {
  inboxTasks: Task[];
  poolTasks: Task[];
  queue: FocusQueue;
  projects: Project[];
  onOpenTask: (taskId: string) => void;
  onSendToPool: (taskId: string) => void;
  onAddToQueue: (taskId: string, forToday?: boolean) => void;
  onDefer: (taskId: string, until: string) => void;
  onPark: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onGoToInbox: () => void;
  onOpenAIDrawer: () => void;
  onOpenProjectModal: (project?: Project) => void;
  // Filter pills - from Jump To shortcuts
  allTasks?: Task[]; // All tasks for Done/Archived filters
  pendingFilter?: string | null;
  onClearPendingFilter?: () => void;
}

export default function TasksView({
  inboxTasks,
  poolTasks,
  queue,
  projects,
  onOpenTask,
  onSendToPool,
  onAddToQueue,
  onDefer,
  onPark,
  onDelete,
  onGoToInbox,
  onOpenAIDrawer,
  onOpenProjectModal,
  allTasks,
  pendingFilter,
  onClearPendingFilter,
}: TasksViewProps) {
  const [triageCollapsed, setTriageCollapsed] = useState(false);

  // Filter pills state - default to showing triage + ready (current behavior)
  const [activeFilter, setActiveFilter] = useState<FilterPillType | null>(null);

  // Apply pending filter from Jump To shortcuts
  useEffect(() => {
    if (pendingFilter) {
      // Map Jump To filter names to pill types
      const filterMap: Record<string, FilterPillType> = {
        'high_priority': 'high',
        'waiting': 'waiting',
        'deferred': 'deferred',
        'completed': 'done',
        'archived': 'archived',
      };
      const pillType = filterMap[pendingFilter] as FilterPillType | undefined;
      if (pillType) {
        setActiveFilter(pillType);
      }
      onClearPendingFilter?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFilter]); // Intentionally omit onClearPendingFilter to avoid re-render loop

  // Filter definitions
  const filterPills: { id: FilterPillType; label: string; icon?: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'triage', label: 'Triage' },
    { id: 'ready', label: 'Ready' },
    { id: 'high', label: 'High', icon: '🚩' },
    { id: 'waiting', label: 'Waiting', icon: '⏳' },
    { id: 'deferred', label: 'Deferred', icon: '📅' },
    { id: 'done', label: 'Done', icon: '✅' },
    { id: 'archived', label: 'Archived', icon: '📦' },
  ];

  // Compute filtered tasks based on active filter
  const filteredTasks = useMemo(() => {
    if (!activeFilter || activeFilter === 'all') return null; // null = show default sectioned view

    // Combine all available tasks
    const all = allTasks || [...inboxTasks, ...poolTasks];
    const nonDeleted = all.filter(t => !t.deletedAt);

    switch (activeFilter) {
      case 'triage':
        return nonDeleted.filter(t => t.status === 'inbox');
      case 'ready':
        return nonDeleted.filter(t =>
          t.status === 'pool' &&
          !t.waitingOn &&
          (!t.deferredUntil || new Date(t.deferredUntil) > new Date())
        );
      case 'high':
        return nonDeleted.filter(t =>
          t.priority === 'high' &&
          t.status !== 'archived' &&
          t.status !== 'complete'
        );
      case 'waiting':
        return nonDeleted.filter(t =>
          t.waitingOn !== null &&
          t.status !== 'archived' &&
          t.status !== 'complete'
        );
      case 'deferred':
        return nonDeleted.filter(t =>
          t.deferredUntil !== null &&
          t.status !== 'archived' &&
          t.status !== 'complete'
        );
      case 'done':
        return nonDeleted.filter(t => t.status === 'complete');
      case 'archived':
        return nonDeleted.filter(t => t.status === 'archived');
      default:
        return null;
    }
  }, [activeFilter, allTasks, inboxTasks, poolTasks]);

  // Get counts for filter pills
  const filterCounts = useMemo(() => {
    const all = allTasks || [...inboxTasks, ...poolTasks];
    const nonDeleted = all.filter(t => !t.deletedAt);
    const active = nonDeleted.filter(t => t.status !== 'archived' && t.status !== 'complete');

    return {
      all: nonDeleted.filter(t => t.status !== 'archived').length,
      triage: nonDeleted.filter(t => t.status === 'inbox').length,
      ready: nonDeleted.filter(t =>
        t.status === 'pool' &&
        !t.waitingOn &&
        (!t.deferredUntil || new Date(t.deferredUntil) > new Date())
      ).length,
      high: active.filter(t => t.priority === 'high').length,
      waiting: active.filter(t => t.waitingOn !== null).length,
      deferred: active.filter(t => t.deferredUntil !== null).length,
      done: nonDeleted.filter(t => t.status === 'complete').length,
      archived: nonDeleted.filter(t => t.status === 'archived').length,
    };
  }, [allTasks, inboxTasks, poolTasks]);

  // Check if showing filtered view vs default sectioned view
  const showFilteredView = activeFilter && activeFilter !== 'all' && filteredTasks !== null;

  // Check if task is already in queue
  const queueTaskIds = new Set(queue.items.map((i) => i.taskId));
  const isInQueue = (taskId: string) => queueTaskIds.has(taskId);

  // Filter tasks - exclude tasks already in focus queue from Ready section
  const waitingTasks = poolTasks.filter((t) => t.waitingOn !== null);
  const resurfacedTasks = poolTasks.filter(
    (t) => t.deferredUntil && new Date(t.deferredUntil) <= new Date()
  );
  const readyTasks = poolTasks.filter(
    (t) => !t.waitingOn && (!t.deferredUntil || new Date(t.deferredUntil) > new Date()) && !queueTaskIds.has(t.id)
  );

  // Sort inbox tasks for triage section (top 5)
  const sortedInboxTasks = [...inboxTasks].sort((a, b) => b.createdAt - a.createdAt);
  const triageItems = sortedInboxTasks.slice(0, 5);
  const remainingInboxCount = inboxTasks.length - triageItems.length;

  // Helper to get project for a task
  const getProject = (task: Task) => {
    if (!task.projectId) return null;
    return projects.find(p => p.id === task.projectId) ?? null;
  };

  // Handle filter pill click
  const handleFilterClick = (filterId: FilterPillType) => {
    if (activeFilter === filterId) {
      setActiveFilter(null); // Toggle off
    } else {
      setActiveFilter(filterId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Pills Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterPills.map((pill) => {
          const isActive = activeFilter === pill.id || (!activeFilter && pill.id === 'all');
          const count = filterCounts[pill.id as keyof typeof filterCounts];
          return (
            <button
              key={pill.id}
              onClick={() => handleFilterClick(pill.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                isActive
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600"
              }`}
            >
              {pill.icon && <span className="text-xs">{pill.icon}</span>}
              {pill.label}
              {count > 0 && (
                <span className={`text-xs ${isActive ? 'text-violet-500 dark:text-violet-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>


      {/* Filtered Results View */}
      {showFilteredView && filteredTasks && (
        <section>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </p>
          {filteredTasks.length > 0 ? (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isInQueue={isInQueue(task.id)}
                  project={getProject(task)}
                  onOpen={() => onOpenTask(task.id)}
                  onAddToQueue={() => onAddToQueue(task.id)}
                  onDefer={onDefer}
                  onPark={onPark}
                  onDelete={onDelete}
                  badge={
                    task.waitingOn ? `Waiting: ${task.waitingOn.who}` :
                    task.deferredUntil ? `Deferred: ${task.deferredUntil}` :
                    undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              No tasks found
            </div>
          )}
        </section>
      )}

      {/* Default Sectioned View */}
      {!showFilteredView && (
        <>
          {/* Needs Triage Section (Collapsible) */}
          {inboxTasks.length > 0 && (
            <section>
          <div className="flex items-center justify-between mb-3">
            {/* Static title - no longer clickable */}
            <h2 className="flex items-baseline gap-2 text-base font-medium text-zinc-500 dark:text-zinc-400">
              <span>Needs Triage</span>
              <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
                {inboxTasks.length}
              </span>
            </h2>
            {/* Right: Show All + Collapse toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={onGoToInbox}
                className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                Show All
              </button>
              <button
                onClick={() => setTriageCollapsed(!triageCollapsed)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                aria-label={triageCollapsed ? "Expand triage section" : "Collapse triage section"}
              >
                <svg
                  className={`w-4 h-4 text-zinc-400 transition-transform ${triageCollapsed ? '' : 'rotate-180'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          {/* Collapsible content */}
          {!triageCollapsed && (
            <>
              <div className="space-y-2">
                {triageItems.map((task) => (
                  <TriageRow
                    key={task.id}
                    task={task}
                    onOpenTask={onOpenTask}
                    onSendToPool={onSendToPool}
                    onAddToQueue={onAddToQueue}
                    onDefer={onDefer}
                    onPark={onPark}
                    onDelete={onDelete}
                    variant="compact"
                  />
                ))}
              </div>
              {remainingInboxCount > 0 && (
                <div className="text-center mt-3">
                  <button
                    onClick={onGoToInbox}
                    className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                  >
                    +{remainingInboxCount} More
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Resurfaced Section */}
      {resurfacedTasks.length > 0 && (
        <section>
          <h2 className="flex items-baseline gap-2 text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">
            <span>Resurfaced</span>
            <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
              {resurfacedTasks.length}
            </span>
          </h2>
          <div className="space-y-2">
            {resurfacedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isInQueue={isInQueue(task.id)}
                project={getProject(task)}
                onOpen={() => onOpenTask(task.id)}
                onAddToQueue={() => onAddToQueue(task.id)}
                onDefer={onDefer}
                onPark={onPark}
                onDelete={onDelete}
                badge="Deferred"
              />
            ))}
          </div>
        </section>
      )}

      {/* Ready Section */}
      <section>
        <h2 className="flex items-baseline gap-2 text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">
          <span>Ready</span>
          <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
            {readyTasks.length}
          </span>
        </h2>
        {readyTasks.length > 0 ? (
          <div className="space-y-2">
            {readyTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isInQueue={isInQueue(task.id)}
                project={getProject(task)}
                onOpen={() => onOpenTask(task.id)}
                onAddToQueue={() => onAddToQueue(task.id)}
                onDefer={onDefer}
                onPark={onPark}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <p>No tasks ready in pool.</p>
            {inboxTasks.length > 0 && (
              <p className="text-sm mt-1">
                Triage some inbox items to get started.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Waiting Section */}
      {waitingTasks.length > 0 && (
        <section>
          <h2 className="flex items-baseline gap-2 text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">
            <span>Waiting On</span>
            <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
              {waitingTasks.length}
            </span>
          </h2>
          <div className="space-y-2">
            {waitingTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isInQueue={isInQueue(task.id)}
                project={getProject(task)}
                onOpen={() => onOpenTask(task.id)}
                onAddToQueue={() => onAddToQueue(task.id)}
                onDefer={onDefer}
                onPark={onPark}
                onDelete={onDelete}
                badge={`Waiting: ${task.waitingOn?.who}`}
              />
            ))}
          </div>
        </section>
      )}
        </>
      )}
    </div>
  );
}

// Check if date is overdue
function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
}

// Task Row Component
interface TaskRowProps {
  task: Task;
  isInQueue: boolean;
  project?: Project | null;
  onOpen: () => void;
  onAddToQueue: () => void;
  onDefer?: (taskId: string, until: string) => void;
  onPark?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  badge?: string;
}

function TaskRow({ task, isInQueue, project, onOpen, onAddToQueue, onDefer, onPark, onDelete, badge }: TaskRowProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const completedSteps = task.steps.filter((s) => s.completed).length;
  const totalSteps = task.steps.length;

  // Calculate defer dates
  const getDeferDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // Shared menu dropdown
  const MenuDropdown = () => (
    <div
      className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[140px]"
      onClick={(e) => e.stopPropagation()}
    >
      {onDefer && (
        <>
          <div className="px-3 py-1 text-xs font-medium text-zinc-400 uppercase">Defer</div>
          <button
            onClick={() => { onDefer(task.id, getDeferDate(1)); setShowMenu(false); }}
            className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Tomorrow
          </button>
          <button
            onClick={() => { onDefer(task.id, getDeferDate(7)); setShowMenu(false); }}
            className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Next week
          </button>
          <button
            onClick={() => { onDefer(task.id, getDeferDate(30)); setShowMenu(false); }}
            className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Next month
          </button>
          <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
        </>
      )}
      {onPark && (
        <button
          onClick={() => { onPark(task.id); setShowMenu(false); }}
          className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
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

  // Metadata pills component
  const MetadataPills = () => (
    <>
      {totalSteps > 0 && (
        <MetadataPill>{completedSteps}/{totalSteps} steps</MetadataPill>
      )}
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
      {badge && <MetadataPill>{badge}</MetadataPill>}
    </>
  );

  return (
    <div className="group bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 sm:px-4 py-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-start sm:justify-between sm:gap-3">
        <button onClick={onOpen} className="flex-1 text-left min-w-0">
          <span className="text-zinc-900 dark:text-zinc-100 truncate block">
            {task.title}
          </span>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <MetadataPills />
          </div>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isInQueue ? (
            <span className="text-xs text-green-600 dark:text-green-400">In Focus</span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToQueue(); }}
              className="text-xs px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900"
            >
              → Focus
            </button>
          )}
          {(onDelete || onDefer || onPark) && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
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
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden">
        {/* Row 1: Title + Actions */}
        <div className="flex items-start gap-2">
          <button onClick={onOpen} className="flex-1 min-w-0 text-left">
            <span className="text-zinc-900 dark:text-zinc-100">
              {task.title}
            </span>
          </button>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isInQueue ? (
              <span className="text-xs text-green-600 dark:text-green-400 px-1">In Focus</span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToQueue(); }}
                className="text-xs px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
              >
                → Focus
              </button>
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
        {/* Row 2: Metadata pills */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <MetadataPills />
        </div>
      </div>
    </div>
  );
}

// Helper function
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}
