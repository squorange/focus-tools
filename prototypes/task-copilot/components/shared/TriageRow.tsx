"use client";

import React, { useState } from "react";
import { Task } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import MetadataPill from "@/components/shared/MetadataPill";

interface TriageRowProps {
  task: Task;
  onOpenTask: (taskId: string) => void;
  onSendToPool: (taskId: string) => void;
  onAddToQueue: (taskId: string, forToday?: boolean) => void;
  onDefer: (taskId: string, until: string) => void;
  onPark: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  variant?: "compact" | "full";
}

export default function TriageRow({
  task,
  onOpenTask,
  onSendToPool,
  onAddToQueue,
  onDefer,
  onPark,
  onDelete,
  variant = "compact",
}: TriageRowProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Calculate defer dates
  const getDeferDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  const formatRelativeTime = (timestamp: number): string => {
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
  };

  const isCompact = variant === "compact";

  // Check if deadline is overdue
  const isOverdue = task.deadlineDate && task.deadlineDate < new Date().toISOString().split("T")[0];

  // Shared menu dropdown component
  const MenuDropdown = () => (
    <>
      {/* Backdrop to close menu */}
      <div
        className="fixed inset-0 z-10"
        onClick={() => setShowMenu(false)}
      />
      <div
        className="absolute right-0 bottom-full mb-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[140px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Defer options */}
        <div className="px-3 py-1 text-xs font-medium text-zinc-400 uppercase">
          Defer
        </div>
        <button
          onClick={() => {
            onDefer(task.id, getDeferDate(1));
            setShowMenu(false);
          }}
          className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          Tomorrow
        </button>
        <button
          onClick={() => {
            onDefer(task.id, getDeferDate(7));
            setShowMenu(false);
          }}
          className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          Next week
        </button>
        <button
          onClick={() => {
            onDefer(task.id, getDeferDate(30));
            setShowMenu(false);
          }}
          className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          Next month
        </button>

        <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />

        {/* Park */}
        <button
          onClick={() => {
            onPark(task.id);
            setShowMenu(false);
          }}
          className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          Archive
        </button>

        {/* Delete */}
        <button
          onClick={() => {
            onDelete(task.id);
            setShowMenu(false);
          }}
          className="w-full px-3 py-1.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          Delete
        </button>
      </div>
    </>
  );

  return (
    <div
      className={`group bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg ${
        isCompact ? "p-3" : "p-4"
      } hover:border-amber-300 dark:hover:border-amber-700 transition-colors`}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-start sm:justify-between sm:gap-3">
        {/* Task info */}
        <button
          onClick={() => onOpenTask(task.id)}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-900 dark:text-zinc-100 font-medium line-clamp-1">
              {task.title}
            </span>
            {/* Priority pill (only high) */}
            {task.priority === "high" && (
              <MetadataPill variant="priority-high">High</MetadataPill>
            )}
            {/* Due date pill */}
            {task.deadlineDate && (
              <MetadataPill variant={isOverdue ? "overdue" : "due"}>
                Due {formatDate(task.deadlineDate)}
              </MetadataPill>
            )}
          </div>
          {!isCompact && (
            <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {formatRelativeTime(task.createdAt)}
            </span>
          )}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Ready button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendToPool(task.id);
            }}
            className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
          >
            Ready
          </button>

          {/* Add to Focus button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(task.id);
            }}
            className="text-xs px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900 transition-colors"
          >
            Add to Focus
          </button>

          {/* Overflow menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              title="More actions"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenu && <MenuDropdown />}
          </div>

          {/* Chevron to open */}
          <button
            onClick={() => onOpenTask(task.id)}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden">
        {/* Row 1: Title + Kebab + Chevron */}
        <div className="flex items-start gap-2">
          <button
            onClick={() => onOpenTask(task.id)}
            className="flex-1 text-left min-w-0"
          >
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
              {task.title}
            </span>
          </button>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Kebab menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                title="More actions"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {showMenu && <MenuDropdown />}
            </div>
            {/* Chevron */}
            <button
              onClick={() => onOpenTask(task.id)}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Row 2: Metadata pills */}
        {(task.priority === "high" || task.deadlineDate || !isCompact) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.priority === "high" && (
              <MetadataPill variant="priority-high">High</MetadataPill>
            )}
            {task.deadlineDate && (
              <MetadataPill variant={isOverdue ? "overdue" : "due"}>
                Due {formatDate(task.deadlineDate)}
              </MetadataPill>
            )}
            {!isCompact && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatRelativeTime(task.createdAt)}
              </span>
            )}
          </div>
        )}

        {/* Row 3: Action buttons */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendToPool(task.id);
            }}
            className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
          >
            Ready
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(task.id);
            }}
            className="text-xs px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900 transition-colors"
          >
            Add to Focus
          </button>
        </div>
      </div>
    </div>
  );
}
