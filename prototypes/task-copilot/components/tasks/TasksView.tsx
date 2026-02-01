"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Task, FocusQueue, Project, TaskFilters, PriorityTier } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { filterRecurringTasks } from "@/lib/recurring-utils";
import { getTasksForPriorityQueue, groupTasksByTier, PriorityQueueTask } from "@/lib/priority";
import { applyTaskFilters } from "@/lib/filters";
import TriageRow from "@/components/shared/TriageRow";
import MetadataPill from "@/components/shared/MetadataPill";
import ProgressRing from "@/components/shared/ProgressRing";
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
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
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
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
            {countActiveFilters(filters) > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold bg-violet-600 text-white rounded-full">
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
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              No deferred tasks
            </div>
          ) : (
            <section>
              <h3 className="flex items-baseline gap-2 text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                <span>Deferred</span>
                <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
                  {deferredTasksAll.length}
                </span>
              </h3>
              <div className="space-y-2">
                {deferredTasksAll.map((task) => (
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
            <h2 className="flex items-baseline gap-2 text-base font-medium text-zinc-700 dark:text-zinc-300">
              <span>Needs Triage</span>
              <span className="text-sm font-normal opacity-60">
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
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          {countActiveFilters(filters) > 0 ? (
            <>
              <p>No tasks match your filters.</p>
              <button
                onClick={() => setFilters({})}
                className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mt-2"
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
  critical: { label: 'Critical', color: 'text-zinc-700 dark:text-zinc-300' },
  high: { label: 'High', color: 'text-zinc-700 dark:text-zinc-300' },
  medium: { label: 'Medium', color: 'text-zinc-700 dark:text-zinc-300' },
  low: { label: 'Low', color: 'text-zinc-700 dark:text-zinc-300' },
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
          className={`w-4 h-4 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="space-y-2">
          {tasks.map(({ task }) => (
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
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
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
            <h3 className="flex items-baseline gap-2 text-base font-medium text-zinc-500 dark:text-zinc-400">
              <span>Archived</span>
              <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
                {archivedTasksAll.length}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              {sortedArchived.length > 5 && (
                <button
                  onClick={() => { setArchivedCollapsed(false); setArchivedShowAll(true); }}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                >
                  Show All
                </button>
              )}
              <button
                onClick={() => setArchivedCollapsed(!archivedCollapsed)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                aria-label={archivedCollapsed ? "Expand archived section" : "Collapse archived section"}
              >
                <svg
                  className={`w-4 h-4 text-zinc-400 transition-transform ${archivedCollapsed ? '' : 'rotate-180'}`}
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
          )}
        </section>
      )}

      {/* Completed Section - grouped by date */}
      {completedTasksAll.length > 0 && (
        <section>
          <h3 className="flex items-baseline gap-2 text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">
            <span>Completed</span>
            <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
              {completedTasksAll.length}
            </span>
          </h3>
          <div className="space-y-4">
            {completedGrouped.map(([date, tasks]) => (
              <section key={date}>
                <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 sticky top-0 bg-white dark:bg-zinc-900 py-1">
                  {formatCompletedDate(date)}
                </h4>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <TaskRow
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
  onAddToQueue?: () => void;
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
      {project && (
        <MetadataPill variant="project" color={project.color || "#9ca3af"}>
          {project.name}
        </MetadataPill>
      )}
      {badge && <MetadataPill>{badge}</MetadataPill>}
    </>
  );

  return (
    <div className="group bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 sm:px-4 py-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-center sm:gap-2">
        {/* Progress ring */}
        <ProgressRing
          completed={completedSteps}
          total={totalSteps}
          isComplete={task.status === 'complete'}
          variant="solid"
        />
        <button onClick={onOpen} className="flex-1 text-left min-w-0">
          <span className="text-zinc-900 dark:text-zinc-100 truncate block">
            {task.title}
          </span>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <MetadataPills />
          </div>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onAddToQueue && (isInQueue ? (
            <span className="text-xs text-green-600 dark:text-green-400">In Focus</span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToQueue(); }}
              className="text-xs px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900"
            >
              → Focus
            </button>
          ))}
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
        {/* Row 1: Ring + Title + Actions */}
        <div className="flex items-start gap-2">
          {/* Progress ring */}
          <div className="flex-shrink-0 mt-0.5">
            <ProgressRing
              completed={completedSteps}
              total={totalSteps}
              isComplete={task.status === 'complete'}
              variant="solid"
            />
          </div>
          <button onClick={onOpen} className="flex-1 min-w-0 text-left">
            <span className="text-zinc-900 dark:text-zinc-100">
              {task.title}
            </span>
          </button>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onAddToQueue && (isInQueue ? (
              <span className="text-xs text-green-600 dark:text-green-400 px-1">In Focus</span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToQueue(); }}
                className="text-xs px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
              >
                → Focus
              </button>
            ))}
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
