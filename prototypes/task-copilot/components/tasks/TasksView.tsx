"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Task, FocusQueue, Project, TaskFilters, PriorityTier } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { filterRecurringTasks } from "@/lib/recurring-utils";
import { getTasksForPriorityQueue, groupTasksByTier, PriorityQueueTask } from "@/lib/priority";
import { applyTaskFilters } from "@/lib/filters";
import TriageTaskCard from "@/components/shared/TriageTaskCard";
import DoneTaskCard from "./DoneTaskCard";
import RoutinesList from "@/components/routines/RoutinesList";
import { Filter, ChevronDown } from "lucide-react";

// Tab types for navigation
type TasksTab = 'staging' | 'routines' | 'on_hold' | 'done';

interface TasksViewProps {
  inboxTasks: Task[];
  poolTasks: Task[];
  queue: FocusQueue;
  projects: Project[];
  onOpenTask: (taskId: string, mode?: 'executing' | 'managing') => void;
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
  // Controlled tab state for back navigation
  activeTab?: TasksTab;
  onTabChange?: (tab: TasksTab) => void;
  // Filter state lifted to page.tsx for root-level FilterDrawer
  filters?: TaskFilters;
  onFiltersChange?: (filters: TaskFilters) => void;
  onFilteredCountChange?: (count: number) => void;
  onOpenFilterDrawer?: () => void;
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
  activeTab: controlledActiveTab,
  onTabChange,
  filters: controlledFilters,
  onFiltersChange,
  onFilteredCountChange,
  onOpenFilterDrawer,
}: TasksViewProps) {
  const [triageCollapsed, setTriageCollapsed] = useState(false);
  // Use controlled filters if provided, otherwise fallback to local state
  const [localFilters, setLocalFilters] = useState<TaskFilters>(() => loadFiltersFromStorage());
  const filters = controlledFilters ?? localFilters;
  const setFilters = onFiltersChange ?? setLocalFilters;
  const [tierExpanded, setTierExpanded] = useState<Record<PriorityTier, boolean>>({
    critical: true,
    high: true,
    medium: true,
    low: true,
  });

  // Tab state - use controlled state if provided, otherwise internal state
  const [internalActiveTab, setInternalActiveTab] = useState<TasksTab>('staging');
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = onTabChange ?? setInternalActiveTab;

  // Persist filters to localStorage
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

  // Apply pending filter from Jump To shortcuts (maps to tabs)
  useEffect(() => {
    if (pendingFilter) {
      const tabMap: Record<string, TasksTab> = {
        'staging': 'staging',
        'routines': 'routines',
        'waiting': 'on_hold',
        'deferred': 'on_hold',
        'on_hold': 'on_hold',
        'completed': 'done',
        'archived': 'done',
        'done': 'done',
      };
      const tab = tabMap[pendingFilter];
      if (tab) {
        setActiveTab(tab);
      }
      onClearPendingFilter?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFilter]); // Intentionally omit onClearPendingFilter to avoid re-render loop

  // Combine all available tasks for filtering
  const allTasksList = useMemo(() => {
    const all = allTasks || [...inboxTasks, ...poolTasks];
    return all.filter(t => !t.deletedAt);
  }, [allTasks, inboxTasks, poolTasks]);

  // Filtered task lists for each tab
  const waitingTasksAll = useMemo(() =>
    allTasksList.filter(t =>
      t.waitingOn !== null &&
      t.status !== 'archived' &&
      t.status !== 'complete'
    ),
    [allTasksList]
  );

  const deferredTasksAll = useMemo(() =>
    allTasksList.filter(t =>
      t.deferredUntil !== null &&
      new Date(t.deferredUntil) > new Date() && // Future deferred only
      t.status !== 'archived' &&
      t.status !== 'complete'
    ),
    [allTasksList]
  );

  const completedTasksAll = useMemo(() =>
    allTasksList.filter(t => t.status === 'complete'),
    [allTasksList]
  );

  const archivedTasksAll = useMemo(() =>
    allTasksList.filter(t => t.status === 'archived'),
    [allTasksList]
  );

  // Recurring tasks (routines)
  const routinesAll = useMemo(() =>
    filterRecurringTasks(allTasksList),
    [allTasksList]
  );

  // Check if task is already in queue (moved before tabs for count calculation)
  const queueTaskIds = useMemo(() => new Set(queue.items.map((i) => i.taskId)), [queue.items]);
  const isInQueue = (taskId: string) => queueTaskIds.has(taskId);

  // Tab definitions with counts
  // Note: Waiting tasks now appear in Staging (just with pill), not in Hold tab
  const tabs = useMemo(() => [
    { id: 'staging' as TasksTab, label: 'Staging', count: inboxTasks.length + poolTasks.filter(t => !t.isRecurring && !queueTaskIds.has(t.id)).length },
    { id: 'routines' as TasksTab, label: 'Routines', count: routinesAll.length },
    { id: 'on_hold' as TasksTab, label: 'Hold', count: deferredTasksAll.length },
    { id: 'done' as TasksTab, label: 'Done', count: completedTasksAll.length + archivedTasksAll.length },
  ], [inboxTasks, poolTasks, queueTaskIds, routinesAll, deferredTasksAll, completedTasksAll, archivedTasksAll]);

  // Staging tab: Filter tasks - resurfaced, ready (exclude tasks in queue)
  const resurfacedTasks = poolTasks.filter(
    (t) => t.deferredUntil && new Date(t.deferredUntil) <= new Date()
  );
  // Ready tasks: exclude recurring, deferred, and queued (waiting tasks now appear here with pill)
  const readyTasks = poolTasks.filter(
    (t) => !t.isRecurring && !t.deferredUntil && !queueTaskIds.has(t.id)
  );

  // Priority-ranked tasks (for tier sections)
  const priorityTasks = useMemo(() => {
    const tasksWithPriority = getTasksForPriorityQueue(readyTasks);
    const filtered = applyTaskFilters(tasksWithPriority, filters);
    return filtered;
  }, [readyTasks, filters]);

  // Group by tier
  const groupedTasks = useMemo(() => groupTasksByTier(priorityTasks), [priorityTasks]);

  // Tier visibility: hide empty tiers, auto-expand medium if no critical/high
  const visibleTiers = useMemo(() => {
    const tiers: PriorityTier[] = ['critical', 'high', 'medium', 'low'];
    return tiers.filter(tier => groupedTasks[tier].length > 0);
  }, [groupedTasks]);

  // Auto-expand medium if no critical/high
  useEffect(() => {
    if (groupedTasks.critical.length === 0 && groupedTasks.high.length === 0 && groupedTasks.medium.length > 0) {
      setTierExpanded(prev => ({ ...prev, medium: true }));
    }
  }, [groupedTasks.critical.length, groupedTasks.high.length, groupedTasks.medium.length]);

  // Report filtered count changes to parent (for root-level FilterDrawer)
  useEffect(() => {
    onFilteredCountChange?.(priorityTasks.length);
  }, [priorityTasks.length, onFilteredCountChange]);

  // Sort inbox tasks for triage section (top 5)
  const sortedInboxTasks = [...inboxTasks].sort((a, b) => b.createdAt - a.createdAt);
  const triageItems = sortedInboxTasks.slice(0, 5);
  const remainingInboxCount = inboxTasks.length - triageItems.length;

  // Helper to get project for a task
  const getProject = (task: Task) => {
    if (!task.projectId) return null;
    return projects.find(p => p.id === task.projectId) ?? null;
  };

  return (
    <div className="space-y-6">
      {/* Tab Bar - Left aligned with filter button on right */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Segmented control */}
        <div className="flex gap-0 p-0.5 bg-black/[0.06] dark:bg-white/[0.08] rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#141417] text-fg-neutral-primary shadow-sm'
                  : 'text-fg-neutral-spot-readable hover:text-fg-neutral-primary'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 opacity-50">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Right: Filter button (only show on Staging tab) */}
        {activeTab === 'staging' && (
          <button
            onClick={() => onOpenFilterDrawer?.()}
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2.5 text-xs font-medium text-fg-neutral-secondary hover:text-fg-neutral-primary bg-bg-neutral-subtle/50 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
            {countActiveFilters(filters) > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold bg-bg-accent-high text-fg-neutral-inverse-primary rounded-full">
                {countActiveFilters(filters)}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Routines Tab */}
      {activeTab === 'routines' && (
        <RoutinesList
          tasks={allTasksList}
          projects={projects}
          onOpenTask={onOpenTask}
        />
      )}

      {/* On Hold Tab - Deferred tasks only (waiting tasks appear in Staging with pill) */}
      {activeTab === 'on_hold' && (
        <>
          {deferredTasksAll.length === 0 ? (
            <div className="text-center py-12 text-fg-neutral-secondary">
              No deferred tasks
            </div>
          ) : (
            <section>
              <h3 className="flex items-baseline gap-2 text-base font-medium text-fg-neutral-secondary mb-3">
                <span>Deferred</span>
                <span className="text-sm font-normal text-fg-neutral-soft">
                  {deferredTasksAll.length}
                </span>
              </h3>
              <div className="space-y-2">
                {deferredTasksAll.map((task) => (
                  <DoneTaskCard
                    key={task.id}
                    task={task}
                    isInQueue={isInQueue(task.id)}
                    project={getProject(task)}
                    onOpen={() => onOpenTask(task.id)}
                    onAddToQueue={() => onAddToQueue(task.id)}
                    onDefer={onDefer}
                    onPark={onPark}
                    onDelete={onDelete}
                    badge={`Until ${formatDate(task.deferredUntil!)}`}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Done Tab */}
      {activeTab === 'done' && (
        <DoneTab
          completedTasksAll={completedTasksAll}
          archivedTasksAll={archivedTasksAll}
          isInQueue={isInQueue}
          getProject={getProject}
          onOpenTask={onOpenTask}
          onAddToQueue={onAddToQueue}
          onDefer={onDefer}
          onPark={onPark}
          onDelete={onDelete}
        />
      )}

      {/* Staging Tab - Sectioned View */}
      {activeTab === 'staging' && (
        <>
          {/* Needs Triage Section (Collapsible) */}
          {inboxTasks.length > 0 && (
            <section>
          <div className="flex items-center justify-between mb-3">
            {/* Static title - no longer clickable */}
            <h2 className="flex items-baseline gap-2 text-base font-medium text-fg-neutral-primary">
              <span>Needs Triage</span>
              <span className="text-sm font-normal opacity-60">
                {inboxTasks.length}
              </span>
            </h2>
            {/* Right: Show All + Collapse toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={onGoToInbox}
                className="text-sm text-fg-accent-primary hover:text-fg-accent-secondary transition-colors"
              >
                Show All
              </button>
              <button
                onClick={() => setTriageCollapsed(!triageCollapsed)}
                className="p-1 rounded hover:bg-bg-neutral-subtle transition-colors"
                aria-label={triageCollapsed ? "Expand triage section" : "Collapse triage section"}
              >
                <svg
                  className={`w-4 h-4 text-fg-neutral-soft transition-transform ${triageCollapsed ? '' : 'rotate-180'}`}
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
                  <TriageTaskCard
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
                    className="text-sm text-fg-accent-primary hover:text-fg-accent-secondary transition-colors"
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
          <h2 className="flex items-baseline gap-2 text-base font-medium text-fg-neutral-secondary mb-3">
            <span>Resurfaced</span>
            <span className="text-sm font-normal text-fg-neutral-soft">
              {resurfacedTasks.length}
            </span>
          </h2>
          <div className="space-y-2">
            {resurfacedTasks.map((task) => (
              <DoneTaskCard
                key={task.id}
                task={task}
                isInQueue={isInQueue(task.id)}
                project={getProject(task)}
                onOpen={() => onOpenTask(task.id)}
                onAddToQueue={() => onAddToQueue(task.id)}
                onDefer={onDefer}
                onPark={onPark}
                onDelete={onDelete}
                badge={task.waitingOn ? `Waiting: ${task.waitingOn.who}` : "Resurfaced"}
              />
            ))}
          </div>
        </section>
      )}

      {/* Priority Tier Sections */}
      {visibleTiers.length > 0 ? (
        visibleTiers.map((tier) => (
          <TierSection
            key={tier}
            tier={tier}
            tasks={groupedTasks[tier]}
            expanded={tierExpanded[tier]}
            onToggle={() => setTierExpanded(prev => ({ ...prev, [tier]: !prev[tier] }))}
            isInQueue={isInQueue}
            getProject={getProject}
            onOpenTask={onOpenTask}
            onAddToQueue={onAddToQueue}
            onDefer={onDefer}
            onPark={onPark}
            onDelete={onDelete}
          />
        ))
      ) : (
        <div className="text-center py-8 text-fg-neutral-secondary">
          {countActiveFilters(filters) > 0 ? (
            <>
              <p>No tasks match your filters.</p>
              <button
                onClick={() => setFilters({})}
                className="text-sm text-fg-accent-primary hover:text-fg-accent-secondary mt-2"
              >
                Clear filters
              </button>
            </>
          ) : readyTasks.length === 0 ? (
            <>
              <p>No tasks ready in pool.</p>
              {inboxTasks.length > 0 && (
                <p className="text-sm mt-1">
                  Triage some inbox items to get started.
                </p>
              )}
            </>
          ) : (
            <p>All tasks filtered out.</p>
          )}
        </div>
      )}

        </>
      )}
    </div>
  );
}

// Tier labels - monochrome headers for consistency
const TIER_CONFIG: Record<PriorityTier, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-fg-neutral-primary' },
  high: { label: 'High', color: 'text-fg-neutral-primary' },
  medium: { label: 'Medium', color: 'text-fg-neutral-primary' },
  low: { label: 'Low', color: 'text-fg-neutral-primary' },
};

// Tier Section Component
interface TierSectionProps {
  tier: PriorityTier;
  tasks: PriorityQueueTask[];
  expanded: boolean;
  onToggle: () => void;
  isInQueue: (taskId: string) => boolean;
  getProject: (task: Task) => Project | null;
  onOpenTask: (taskId: string, mode?: 'executing' | 'managing') => void;
  onAddToQueue: (taskId: string, forToday?: boolean) => void;
  onDefer: (taskId: string, until: string) => void;
  onPark: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function TierSection({
  tier,
  tasks,
  expanded,
  onToggle,
  isInQueue,
  getProject,
  onOpenTask,
  onAddToQueue,
  onDefer,
  onPark,
  onDelete,
}: TierSectionProps) {
  const config = TIER_CONFIG[tier];

  return (
    <section>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <h2 className={`flex items-baseline gap-2 text-base font-medium ${config.color}`}>
          <span>{config.label}</span>
          <span className="text-sm font-normal opacity-60">
            {tasks.length}
          </span>
        </h2>
        <ChevronDown
          className={`w-4 h-4 text-fg-neutral-soft transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="space-y-2">
          {tasks.map(({ task }) => (
            <DoneTaskCard
              key={task.id}
              task={task}
              isInQueue={isInQueue(task.id)}
              project={getProject(task)}
              onOpen={() => onOpenTask(task.id)}
              onAddToQueue={() => onAddToQueue(task.id)}
              onDefer={onDefer}
              onPark={onPark}
              onDelete={onDelete}
              badge={task.waitingOn ? `Waiting: ${task.waitingOn.who}` : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Done Tab: Completed (grouped by date) + Archived (collapsed)
function DoneTab({
  completedTasksAll,
  archivedTasksAll,
  isInQueue,
  getProject,
  onOpenTask,
  onAddToQueue,
  onDefer,
  onPark,
  onDelete,
}: {
  completedTasksAll: Task[];
  archivedTasksAll: Task[];
  isInQueue: (taskId: string) => boolean;
  getProject: (task: Task) => Project | null;
  onOpenTask: (taskId: string, mode?: 'executing' | 'managing') => void;
  onAddToQueue: (taskId: string, forToday?: boolean) => void;
  onDefer: (taskId: string, until: string) => void;
  onPark: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}) {
  const [archivedCollapsed, setArchivedCollapsed] = React.useState(true);
  const [archivedShowAll, setArchivedShowAll] = React.useState(false);

  // Group completed tasks by date
  const completedGrouped = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    [...completedTasksAll]
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .forEach(task => {
        const date = task.completedAt
          ? new Date(task.completedAt).toISOString().split('T')[0]
          : 'Unknown';
        if (!groups[date]) groups[date] = [];
        groups[date].push(task);
      });
    return Object.entries(groups);
  }, [completedTasksAll]);

  // Sorted archived with expand/collapse
  const sortedArchived = useMemo(() =>
    [...archivedTasksAll].sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0)),
    [archivedTasksAll]
  );
  const visibleArchived = archivedShowAll ? sortedArchived : sortedArchived.slice(0, 5);

  if (completedTasksAll.length === 0 && archivedTasksAll.length === 0) {
    return (
      <div className="text-center py-12 text-fg-neutral-secondary">
        No completed or archived tasks
      </div>
    );
  }

  return (
    <>
      {/* Archived Section - collapsible, above Completed */}
      {archivedTasksAll.length > 0 && (
        <section className={completedTasksAll.length > 0 ? "mb-6" : ""}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-baseline gap-2 text-base font-medium text-fg-neutral-secondary">
              <span>Archived</span>
              <span className="text-sm font-normal text-fg-neutral-soft">
                {archivedTasksAll.length}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              {sortedArchived.length > 5 && (
                <button
                  onClick={() => { setArchivedCollapsed(false); setArchivedShowAll(true); }}
                  className="text-sm text-fg-accent-primary hover:text-fg-accent-secondary transition-colors"
                >
                  Show All
                </button>
              )}
              <button
                onClick={() => setArchivedCollapsed(!archivedCollapsed)}
                className="p-1 rounded hover:bg-bg-neutral-subtle transition-colors"
                aria-label={archivedCollapsed ? "Expand archived section" : "Collapse archived section"}
              >
                <svg
                  className={`w-4 h-4 text-fg-neutral-soft transition-transform ${archivedCollapsed ? '' : 'rotate-180'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          {!archivedCollapsed && (
            <div className="space-y-2">
              {visibleArchived.map((task) => (
                <DoneTaskCard
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
          )}
        </section>
      )}

      {/* Completed Section - grouped by date */}
      {completedTasksAll.length > 0 && (
        <section>
          <h3 className="flex items-baseline gap-2 text-base font-medium text-fg-neutral-secondary mb-3">
            <span>Completed</span>
            <span className="text-sm font-normal text-fg-neutral-soft">
              {completedTasksAll.length}
            </span>
          </h3>
          <div className="space-y-4">
            {completedGrouped.map(([date, tasks]) => (
              <section key={date}>
                <h4 className="text-xs font-medium text-fg-neutral-secondary mb-2 sticky top-0 bg-bg-neutral-subtle py-1">
                  {formatCompletedDate(date)}
                </h4>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <DoneTaskCard
                      key={task.id}
                      task={task}
                      isInQueue={false}
                      project={getProject(task)}
                      onOpen={() => onOpenTask(task.id)}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// Format date for completed groups
function formatCompletedDate(dateStr: string): string {
  if (dateStr === 'Unknown') return 'Unknown';
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
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

// Filter persistence helpers
const FILTERS_STORAGE_KEY = 'task-copilot-filters';

function loadFiltersFromStorage(): TaskFilters {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveFiltersToStorage(filters: TaskFilters): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Ignore storage errors
  }
}

function countActiveFilters(filters: TaskFilters): number {
  let count = 0;
  if (filters.dueDateRange) count++;
  if (filters.targetDateRange) count++;
  if (filters.durationRange) count++;
  if (filters.projectId) count++;
  if (filters.priority && filters.priority.length > 0) count++;
  if (filters.healthStatus && filters.healthStatus.length > 0) count++;
  return count;
}
