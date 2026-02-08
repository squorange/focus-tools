"use client";

import { useState } from "react";
import { Task } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ActionableCard, ProgressRing, Pill } from "@design-system/components";
import { MoreVertical } from "lucide-react";

interface TriageTaskCardProps {
  task: Task;
  onOpenTask: (taskId: string) => void;
  onSendToPool: (taskId: string) => void;
  onAddToQueue: (taskId: string, forToday?: boolean) => void;
  onDefer: (taskId: string, until: string) => void;
  onPark: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  variant?: "compact" | "full";
}

// Calculate defer dates
function getDeferDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export default function TriageTaskCard({
  task,
  onOpenTask,
  onSendToPool,
  onAddToQueue,
  onDefer,
  onPark,
  onDelete,
  variant = "compact",
}: TriageTaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const isCompact = variant === "compact";
  const isOverdue = task.deadlineDate && task.deadlineDate < new Date().toISOString().split("T")[0];

  return (
    <ActionableCard
      appearance="highlighted"
      onClick={() => onOpenTask(task.id)}
    >
      <ActionableCard.Leading>
        <ProgressRing
          completed={0}
          total={0}
          isComplete={false}
          variant="dashed"
        />
      </ActionableCard.Leading>

      <ActionableCard.Body>
        <ActionableCard.Title>
          {task.title}
        </ActionableCard.Title>

        <ActionableCard.Meta>
          {/* Priority pill (only high) */}
          {task.priority === "high" && (
            <Pill variant="priority-high">High</Pill>
          )}

          {/* Due date pill */}
          {task.deadlineDate && (
            <Pill variant={isOverdue ? "error" : "info"}>
              Due {formatDate(task.deadlineDate)}
            </Pill>
          )}

          {/* Creation time for full variant */}
          {!isCompact && (
            <span className="text-xs text-fg-neutral-secondary">
              {formatRelativeTime(task.createdAt)}
            </span>
          )}
        </ActionableCard.Meta>
      </ActionableCard.Body>

      <ActionableCard.Trailing>
        {/* Ready button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSendToPool(task.id);
          }}
          className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-fg-neutral-primary hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
        >
          → Ready
        </button>

        {/* Focus button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToQueue(task.id);
          }}
          className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-fg-neutral-primary hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
        >
          → Focus
        </button>

        {/* Kebab menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-fg-neutral-soft hover:text-fg-neutral-secondary rounded hover:bg-bg-neutral-subtle transition-colors"
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div
                className="absolute right-0 bottom-full mb-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Defer options */}
                <div className="px-3 py-1 text-xs font-medium text-fg-neutral-soft uppercase">
                  Defer
                </div>
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

                {/* Park */}
                <button
                  onClick={() => { onPark(task.id); setShowMenu(false); }}
                  className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle"
                >
                  Archive
                </button>

                {/* Delete */}
                <button
                  onClick={() => { onDelete(task.id); setShowMenu(false); }}
                  className="w-full px-3 py-1.5 text-sm text-left text-fg-alert hover:bg-bg-neutral-subtle"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </ActionableCard.Trailing>
    </ActionableCard>
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
