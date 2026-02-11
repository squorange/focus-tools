"use client";

import { useState, useRef } from "react";
import { Task, Project } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { ActionableCard, ProgressRing, Pill } from "@design-system/components";
import { MoreVertical } from "lucide-react";

interface DoneTaskCardProps {
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

// Calculate defer dates
function getDeferDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

// Check if date is overdue
function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
}

export default function DoneTaskCard({
  task,
  isInQueue,
  project,
  onOpen,
  onAddToQueue,
  onDefer,
  onPark,
  onDelete,
  badge,
}: DoneTaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, showMenu, () => setShowMenu(false));

  const completedSteps = task.steps.filter((s) => s.completed).length;
  const totalSteps = task.steps.length;
  const isComplete = task.status === 'complete';
  const hasKebabMenu = onDefer || onPark || onDelete;

  return (
    <ActionableCard
      appearance="default"
      onClick={onOpen}
    >
      <ActionableCard.Leading>
        <ProgressRing
          completed={completedSteps}
          total={totalSteps}
          isComplete={isComplete}
          variant="solid"
        />
      </ActionableCard.Leading>

      <ActionableCard.Body>
        <ActionableCard.Title strikethrough={isComplete}>
          {task.title}
        </ActionableCard.Title>

        <ActionableCard.Meta>
          {/* Steps */}
          {totalSteps > 0 && (
            <Pill>{completedSteps}/{totalSteps} steps</Pill>
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

          {/* Badge (e.g., "Until Mar 15") */}
          {badge && (
            <Pill>{badge}</Pill>
          )}
        </ActionableCard.Meta>
      </ActionableCard.Body>

      <ActionableCard.Trailing>
        {/* Queue status or Add button */}
        {onAddToQueue && (
          isInQueue ? (
            <span className="text-xs text-fg-positive">In Focus</span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToQueue(); }}
              className="text-xs px-2 py-1 rounded bg-bg-accent-subtle text-fg-accent-primary hover:bg-bg-accent-subtle-hover"
            >
              → Focus
            </button>
          )
        )}

        {/* Kebab menu */}
        {hasKebabMenu && (
          <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-fg-neutral-soft hover:text-fg-neutral-secondary rounded hover:bg-bg-neutral-subtle transition-colors"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[140px]"
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
