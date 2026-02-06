"use client";

import { useState } from "react";
import { Task, Project, FocusQueue } from "@/lib/types";
import MetadataPill from "@/components/shared/MetadataPill";
import { getTodayISO } from "@/lib/utils";
import { dateMatchesPattern, getNextOccurrence, getActiveOccurrenceDate, timestampToLocalDate } from "@/lib/recurring-utils";
import { RecurrenceRuleExtended } from "@/lib/recurring-types";

interface ProjectsViewProps {
  tasks: Task[];
  projects: Project[];
  queue: FocusQueue;
  onBack: () => void;
  onOpenTask: (taskId: string) => void;
  onOpenProjectModal: (project?: Project) => void;
  onAddToQueue: (taskId: string) => void;
}

// Group tasks by status (separating recurring tasks)
function groupByStatus(taskList: Task[]) {
  return {
    recurring: taskList.filter(t => t.isRecurring && t.status !== 'complete'),
    inbox: taskList.filter(t => !t.isRecurring && t.status === 'inbox'),
    pool: taskList.filter(t => !t.isRecurring && t.status === 'pool'),
    complete: taskList.filter(t => t.status === 'complete'),
  };
}

// Format date relative to today
function formatDateLabel(dateStr: string, today: string): string {
  const todayDate = new Date(today + 'T00:00:00');
  const date = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((date.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// Format the next due date for recurring tasks with dual-mode logic
function formatNextDueDate(task: Task): { text: string; isPastDue: boolean } {
  if (!task.isRecurring || !task.recurrence) {
    return { text: '', isPastDue: false };
  }

  const today = getTodayISO();
  const pattern = task.recurrence as RecurrenceRuleExtended;
  const startDate = pattern.startDate ||
    (task.createdAt ? timestampToLocalDate(task.createdAt) : today);

  const isDueToday = dateMatchesPattern(today, pattern, startDate);
  const todayInstance = task.recurringInstances?.find(i => i.date === today);
  const todayComplete = todayInstance?.completed ?? false;

  if (pattern.rolloverIfMissed) {
    // KEEP VISIBLE mode
    if (isDueToday && !todayComplete) return { text: 'Today', isPastDue: false };
    if (isDueToday && todayComplete) {
      const next = getNextOccurrence(pattern, today, startDate);
      return next ? { text: formatDateLabel(next, today), isPastDue: false } : { text: '', isPastDue: false };
    }
    // Check for overdue past instance
    const activeDate = getActiveOccurrenceDate(task);
    if (activeDate && activeDate < today) {
      const inst = task.recurringInstances?.find(i => i.date === activeDate);
      if (!inst?.completed && !inst?.skipped) {
        return { text: formatDateLabel(activeDate, today), isPastDue: true };
      }
    }
    // Past instance completed, show next
    const next = getNextOccurrence(pattern, today, startDate);
    return next ? { text: formatDateLabel(next, today), isPastDue: false } : { text: '', isPastDue: false };
  } else {
    // SKIP mode
    if (isDueToday && !todayComplete) return { text: 'Today', isPastDue: false };
    const next = getNextOccurrence(pattern, today, startDate);
    return next ? { text: formatDateLabel(next, today), isPastDue: false } : { text: '', isPastDue: false };
  }
}

// Helper component for task groups
interface TaskGroupProps {
  label: string;
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onAddToQueue: (taskId: string) => void;
  isInQueue: (taskId: string) => boolean;
  isRecurringSection?: boolean;
}

function TaskGroup({ label, tasks, onOpenTask, onAddToQueue, isInQueue, isRecurringSection = false }: TaskGroupProps) {
  return (
    <div className="px-4 py-2">
      <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
        {label} ({tasks.length})
      </div>
      <div className="space-y-1">
        {tasks.map(task => (
          <div
            key={task.id}
            className="flex items-center gap-2 py-1.5 group"
          >
            <button
              onClick={() => onOpenTask(task.id)}
              className="flex-1 text-left text-sm text-fg-neutral-primary hover:text-zinc-900 dark:hover:text-zinc-100 truncate"
            >
              {task.title || "Untitled"}
            </button>
            {/* Recurring tasks: show Next/Past Due date instead of Focus button */}
            {isRecurringSection ? (
              (() => {
                const { text, isPastDue } = formatNextDueDate(task);
                return text ? (
                  <span className={`text-xs whitespace-nowrap ${
                    isPastDue
                      ? 'text-red-500 dark:text-red-400 font-medium'
                      : 'text-fg-neutral-secondary'
                  }`}>
                    {isPastDue ? `Past Due: ${text}` : `Next: ${text}`}
                  </span>
                ) : null;
              })()
            ) : (
              /* Non-recurring tasks: show Focus button or In Focus status */
              <>
                {isInQueue(task.id) ? (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    In Focus
                  </span>
                ) : task.status !== 'complete' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToQueue(task.id);
                    }}
                    className="text-xs px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900 transition-colors"
                  >
                    Focus
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => onOpenTask(task.id)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsView({
  tasks,
  projects,
  queue,
  onBack,
  onOpenTask,
  onOpenProjectModal,
  onAddToQueue,
}: ProjectsViewProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.filter(p => p.status === 'active').map(p => p.id))
  );

  // Get active projects with their tasks
  const tasksByProject = projects
    .filter(p => p.status === 'active')
    .map(project => ({
      project,
      tasks: tasks.filter(t =>
        t.projectId === project.id &&
        !t.deletedAt &&
        t.status !== 'archived'
      ),
    }));

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const isInQueue = (taskId: string) =>
    queue.items.some(i => i.taskId === taskId && !i.completed);

  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header - just New Project button (title in top bar) */}
      <div className="flex justify-end">
        <button
          onClick={() => onOpenProjectModal()}
          className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Projects list */}
      {activeProjects.length > 0 ? (
        <div className="space-y-4">
          {tasksByProject.map(({ project, tasks: projectTasks }) => {
            const grouped = groupByStatus(projectTasks);
            const isExpanded = expandedProjects.has(project.id);
            const taskCount = projectTasks.length;
            const completedCount = grouped.complete.length;
            const recurringCount = grouped.recurring.length;
            const inProgressCount = grouped.inbox.length + grouped.pool.length;

            return (
              <div
                key={project.id}
                className="bg-zinc-50 dark:bg-zinc-800/80 border border-border-color-neutral rounded-lg overflow-hidden"
              >
                {/* Project header */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <svg
                      className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {project.color && (
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <span className="text-fg-neutral-primary">
                      {project.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {inProgressCount > 0 && (
                        <MetadataPill>{inProgressCount} active</MetadataPill>
                      )}
                      {recurringCount > 0 && (
                        <MetadataPill>{recurringCount} recurring</MetadataPill>
                      )}
                      {completedCount > 0 && (
                        <MetadataPill>{completedCount} done</MetadataPill>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => onOpenProjectModal(project)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Edit project"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>

                {/* Project tasks (when expanded) */}
                {isExpanded && taskCount > 0 && (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
                    {/* Recurring tasks (first) */}
                    {grouped.recurring.length > 0 && (
                      <TaskGroup
                        label="Recurring"
                        tasks={grouped.recurring}
                        onOpenTask={onOpenTask}
                        onAddToQueue={onAddToQueue}
                        isInQueue={isInQueue}
                        isRecurringSection
                      />
                    )}
                    {/* Inbox tasks */}
                    {grouped.inbox.length > 0 && (
                      <TaskGroup
                        label="Needs Triage"
                        tasks={grouped.inbox}
                        onOpenTask={onOpenTask}
                        onAddToQueue={onAddToQueue}
                        isInQueue={isInQueue}
                      />
                    )}
                    {/* Ready tasks */}
                    {grouped.pool.length > 0 && (
                      <TaskGroup
                        label="Ready"
                        tasks={grouped.pool}
                        onOpenTask={onOpenTask}
                        onAddToQueue={onAddToQueue}
                        isInQueue={isInQueue}
                      />
                    )}
                    {/* Completed tasks */}
                    {grouped.complete.length > 0 && (
                      <TaskGroup
                        label="Complete"
                        tasks={grouped.complete}
                        onOpenTask={onOpenTask}
                        onAddToQueue={onAddToQueue}
                        isInQueue={isInQueue}
                      />
                    )}
                  </div>
                )}

                {isExpanded && taskCount === 0 && (
                  <div className="px-4 py-6 text-center text-fg-neutral-secondary text-sm">
                    No tasks in this project
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <p className="text-fg-neutral-secondary mb-4">No projects yet</p>
          <button
            onClick={() => onOpenProjectModal()}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
          >
            Create your first project
          </button>
        </div>
      )}
    </div>
  );
}
