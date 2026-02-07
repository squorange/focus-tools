"use client";

import { useState } from "react";
import { Task, FocusQueueItem, Project } from "@/lib/types";
import { formatDate, computeHealthStatus } from "@/lib/utils";
import { getTaskPriorityInfo } from "@/lib/priority";
import { ActionableCard, ProgressRing, Pill } from "@design-system/components";
import PriorityDisplay from "@/components/shared/PriorityDisplay";
import { MoreVertical, Bell, Play, ClipboardCheck, ChevronUp, ChevronDown, ArrowRight, GripVertical } from "lucide-react";

interface QueueTaskCardProps {
  item: FocusQueueItem;
  task: Task;
  projects: Project[];
  isFirst?: boolean;
  isLast?: boolean;
  isToday?: boolean;
  onOpenTask: (id: string) => void;
  onStartFocus: (queueItemId: string) => void;
  onRemoveFromQueue: (queueItemId: string) => void;
  onEditFocus?: (queueItemId: string) => void;
  onMoveUp?: (queueItemId: string) => void;
  onMoveDown?: (queueItemId: string) => void;
}

// Calculate progress based on selection type
function getProgress(
  task: Task,
  item: FocusQueueItem
): { completed: number; total: number; label: string } {
  if (item.selectionType === "all_today" || item.selectionType === "all_upcoming") {
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
    item.selectionType === "all_today" || item.selectionType === "all_upcoming"
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

export default function QueueTaskCard({
  item,
  task,
  projects,
  isFirst = false,
  isLast = false,
  isToday = true,
  onOpenTask,
  onStartFocus,
  onRemoveFromQueue,
  onEditFocus,
  onMoveUp,
  onMoveDown,
}: QueueTaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const progress = getProgress(task, item);
  const estimate = getEstimate(task, item);
  const isComplete = task.status === 'complete' || item.completed ||
    (progress.total > 0 && progress.completed === progress.total);
  const hasWaiting = !!task.waitingOn;
  const hasReminder = !!task.reminder;
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  const health = task.status === 'pool' ? computeHealthStatus(task) : null;
  const showHealthPill = health && health.status !== 'healthy';
  const priorityInfo = getTaskPriorityInfo(task);

  return (
    <ActionableCard
      appearance={isComplete ? "muted" : isToday ? "highlighted" : "default"}
      onClick={() => onOpenTask(task.id)}
    >
      <ActionableCard.Leading>
        {/* Ring shown by default, drag handle on hover (desktop only) */}
        <div className="w-5 h-5 flex items-center justify-center">
          <div className="group-hover:hidden sm:group-hover:hidden">
            <ProgressRing
              completed={progress.completed}
              total={progress.total}
              isComplete={isComplete}
            />
          </div>
          <div className="hidden group-hover:block sm:group-hover:block text-zinc-400 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      </ActionableCard.Leading>

      <ActionableCard.Body>
        <ActionableCard.Title strikethrough={isComplete}>
          {task.title || "Untitled"}
          {hasReminder && (
            <Bell className="inline-block w-3 h-3 ml-1.5 text-violet-500" />
          )}
        </ActionableCard.Title>

        <ActionableCard.Meta>
          {/* Waiting indicator */}
          {hasWaiting && (
            <Pill variant="status-waiting">
              Waiting: {task.waitingOn?.who}
            </Pill>
          )}

          {/* Health status */}
          {showHealthPill && health && (
            <Pill variant={health.status === 'at_risk' ? 'health-at-risk' : 'health-critical'}>
              {health.status === 'at_risk' ? 'At Risk' : 'Critical'}
            </Pill>
          )}

          {/* Steps progress */}
          {progress.total > 0 && (
            <Pill>{progress.label}</Pill>
          )}

          {/* Time estimate */}
          {estimate && (
            <Pill>{estimate}</Pill>
          )}

          {/* Target date */}
          {task.targetDate && (
            <Pill>Target {formatDate(task.targetDate)}</Pill>
          )}

          {/* Deadline */}
          {task.deadlineDate && (
            <Pill variant={isOverdue(task.deadlineDate) ? "error" : "info"}>
              Due {formatDate(task.deadlineDate)}
            </Pill>
          )}

          {/* Project */}
          {project && (
            <Pill colorDot={project.color || "#9ca3af"}>
              {project.name}
            </Pill>
          )}
        </ActionableCard.Meta>
      </ActionableCard.Body>

      <ActionableCard.Trailing>
        {/* Priority display */}
        <PriorityDisplay tier={priorityInfo.tier} showChevron={false} />

        {/* Kebab menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-zinc-400 hover:text-fg-neutral-secondary transition-colors"
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className={`absolute right-0 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-30 min-w-[140px] ${
                isFirst ? "top-full mt-1" : "bottom-full mb-1"
              }`}>
                {!isComplete && (
                  <button
                    onClick={() => { onStartFocus(item.id); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-sm text-left text-violet-600 dark:text-violet-400 hover:bg-bg-neutral-subtle flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Focus
                  </button>
                )}
                {!isComplete && onEditFocus && task.steps.length > 0 && (
                  <button
                    onClick={() => { onEditFocus(item.id); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle flex items-center gap-2"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Edit Focus
                  </button>
                )}
                {!isComplete && (onMoveUp || onMoveDown) && <div className="border-t border-border-color-neutral my-1" />}
                {onMoveUp && (
                  <button
                    onClick={() => { onMoveUp(item.id); setShowMenu(false); }}
                    disabled={isFirst}
                    className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronUp className="w-4 h-4" />
                    Move Up
                  </button>
                )}
                {onMoveDown && (
                  <button
                    onClick={() => { onMoveDown(item.id); setShowMenu(false); }}
                    disabled={isLast}
                    className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Move Down
                  </button>
                )}
                {(onMoveUp || onMoveDown) && <div className="border-t border-border-color-neutral my-1" />}
                <button
                  onClick={() => { onRemoveFromQueue(item.id); setShowMenu(false); }}
                  className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Tasks
                </button>
              </div>
            </>
          )}
        </div>
      </ActionableCard.Trailing>
    </ActionableCard>
  );
}
