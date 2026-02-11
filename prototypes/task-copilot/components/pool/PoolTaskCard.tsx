"use client";

import { useState, useRef } from "react";
import { Task, FocusQueueItem } from "@/lib/types";
import { formatDate, computeHealthStatus } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { ActionableCard, ProgressRing, Pill } from "@design-system/components";
import { MoreVertical, ChevronDown, Bell } from "lucide-react";

interface PoolTaskCardProps {
  task: Task;
  queueItem?: FocusQueueItem;
  onOpenTask: (id: string) => void;
  onAddToQueue: (id: string, forToday?: boolean) => void;
  onDelete?: (id: string) => void;
  onDefer?: (id: string, until: string) => void;
  onPark?: (id: string) => void;
}

// Calculate progress
function getProgress(task: Task): { completed: number; total: number } {
  if (task.steps.length === 0) return { completed: 0, total: 0 };
  const completed = task.steps.filter((s) => s.completed).length;
  return { completed, total: task.steps.length };
}

// Calculate defer dates
function getDeferDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export default function PoolTaskCard({
  task,
  queueItem,
  onOpenTask,
  onAddToQueue,
  onDelete,
  onDefer,
  onPark,
}: PoolTaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFocusDropdown, setShowFocusDropdown] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, showMenu, () => setShowMenu(false));
  useClickOutside(focusDropdownRef, showFocusDropdown, () => setShowFocusDropdown(false));

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

  const hasKebabMenu = onDelete || onDefer || onPark;

  return (
    <ActionableCard
      appearance={isComplete ? "muted" : "default"}
      onClick={() => onOpenTask(task.id)}
    >
      <ActionableCard.Leading>
        <ProgressRing
          completed={progress.completed}
          total={progress.total}
          isComplete={isComplete}
          variant={task.status === 'inbox' ? 'dashed' : 'solid'}
        />
      </ActionableCard.Leading>

      <ActionableCard.Body>
        <ActionableCard.Title strikethrough={isComplete}>
          {task.title || "Untitled"}
        </ActionableCard.Title>

        <ActionableCard.Meta>
          {/* Health status pill (non-healthy only) */}
          {showHealthPill && health && (
            <Pill variant={health.status === 'at_risk' ? 'health-at-risk' : 'health-critical'}>
              {health.status === 'at_risk' ? 'At Risk' : 'Critical'}
            </Pill>
          )}

          {/* Reminder indicator */}
          {hasReminder && (
            <Bell className="w-3.5 h-3.5 text-fg-accent-primary" />
          )}

          {/* Waiting indicator */}
          {isWaiting && (
            <Pill variant="status-waiting">
              Waiting: {task.waitingOn?.who}
            </Pill>
          )}

          {/* Steps */}
          {progress.total > 0 && (
            <Pill>{progress.completed}/{progress.total} steps</Pill>
          )}

          {/* Target Date */}
          {task.targetDate && (
            <Pill>Target {formatDate(task.targetDate)}</Pill>
          )}

          {/* Deadline Date */}
          {task.deadlineDate && (
            <Pill variant={isDeadlineOverdue ? "error" : "info"}>
              Due {formatDate(task.deadlineDate)}
            </Pill>
          )}
        </ActionableCard.Meta>
      </ActionableCard.Body>

      <ActionableCard.Trailing>
        {/* Queue status or Add button */}
        {isInQueue ? (
          <Pill variant="status-focus">In Focus</Pill>
        ) : isComplete ? (
          <span className="text-xs text-fg-positive">Done</span>
        ) : (
          <div ref={focusDropdownRef} className="relative opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <div className="flex">
              <button
                onClick={() => onAddToQueue(task.id, false)}
                className="text-xs bg-bg-accent-subtle text-fg-accent-primary rounded-l px-2 py-1 hover:bg-bg-accent-subtle-hover"
              >
                → Focus
              </button>
              <button
                onClick={() => setShowFocusDropdown(!showFocusDropdown)}
                className="text-xs bg-bg-accent-subtle text-fg-accent-primary rounded-r border-l border-border-accent px-1 py-1 hover:bg-bg-accent-subtle-hover"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {showFocusDropdown && (
                <div className="absolute right-0 top-full mt-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[140px]">
                  <button
                    onClick={() => { onAddToQueue(task.id, true); setShowFocusDropdown(false); }}
                    className="w-full px-3 py-2 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle"
                  >
                    Add to Today
                  </button>
                </div>
            )}
          </div>
        )}

        {/* Kebab menu */}
        {hasKebabMenu && (
          <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 text-fg-neutral-soft hover:text-fg-neutral-secondary transition-colors"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
                <div
                  className="absolute right-0 bottom-full mb-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[140px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onDefer && (
                    <>
                      <div className="px-3 py-1 text-xs font-medium text-fg-neutral-soft uppercase">Defer</div>
                      <button
                        onClick={() => { onDefer(task.id, getDeferDate(1)); setShowMenu(false); }}
                        className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle"
                      >
                        Tomorrow
                      </button>
                      <button
                        onClick={() => { onDefer(task.id, getDeferDate(7)); setShowMenu(false); }}
                        className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle"
                      >
                        Next week
                      </button>
                      <button
                        onClick={() => { onDefer(task.id, getDeferDate(30)); setShowMenu(false); }}
                        className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle"
                      >
                        Next month
                      </button>
                      <div className="border-t border-border-color-neutral my-1" />
                    </>
                  )}
                  {onPark && (
                    <button
                      onClick={() => { onPark(task.id); setShowMenu(false); }}
                      className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle"
                    >
                      Archive
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { onDelete(task.id); setShowMenu(false); }}
                      className="w-full px-3 py-1.5 text-sm text-left text-fg-alert hover:bg-bg-neutral-subtle"
                    >
                      Delete
                    </button>
                  )}
                </div>
            )}
          </div>
        )}
      </ActionableCard.Trailing>
    </ActionableCard>
  );
}
