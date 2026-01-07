"use client";

import { useState } from "react";
import { Task, Step, SuggestedStep, createStep } from "@/lib/types";

interface InboxItemProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSendToPool: (id: string) => void;
  onAddToQueue: (id: string, forToday?: boolean) => void;
  onDefer: (id: string, until: string) => void;
  onPark: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenAIDrawer: () => void;
}

// Calculate time since creation
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

// Defer options
const DEFER_OPTIONS = [
  { label: "Tomorrow", days: 1 },
  { label: "This weekend", days: "weekend" },
  { label: "Next week", days: 7 },
  { label: "In 2 weeks", days: 14 },
  { label: "Next month", days: 30 },
];

function getDeferDate(option: { days: number | string }): string {
  const date = new Date();
  if (option.days === "weekend") {
    // Find next Saturday
    const daysUntilSaturday = (6 - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntilSaturday);
  } else {
    date.setDate(date.getDate() + (option.days as number));
  }
  return date.toISOString().split("T")[0];
}

export default function InboxItem({
  task,
  isExpanded,
  onToggleExpand,
  onUpdateTask,
  onSendToPool,
  onAddToQueue,
  onDefer,
  onPark,
  onDelete,
  onOpenAIDrawer,
}: InboxItemProps) {
  const [showDeferMenu, setShowDeferMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(task.title);
  const [newStepText, setNewStepText] = useState("");

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== task.title) {
      onUpdateTask(task.id, { title: titleInput.trim() });
    }
    setEditingTitle(false);
  };

  const handleAddStep = () => {
    if (newStepText.trim()) {
      const newStep = createStep(newStepText.trim());
      onUpdateTask(task.id, {
        steps: [...task.steps, newStep],
      });
      setNewStepText("");
    }
  };

  const handleQuickToPool = () => {
    onSendToPool(task.id);
  };

  if (!isExpanded) {
    // Collapsed view
    return (
      <div className="bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Expand toggle */}
          <button
            onClick={onToggleExpand}
            className="flex-shrink-0 w-5 h-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Title */}
          <span className="flex-1 text-zinc-900 dark:text-zinc-100 truncate">
            {task.title}
          </span>

          {/* Time ago */}
          <span className="flex-shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
            {getTimeAgo(task.createdAt)}
          </span>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickToPool}
              className="px-2 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded transition-colors"
            >
              → Pool
            </button>

            <button
              onClick={onToggleExpand}
              className="px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
            >
              Triage
            </button>

            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-zinc-400 hover:text-red-500 rounded transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded view - Triage mode
  return (
    <div className="bg-white dark:bg-zinc-800 border border-violet-200 dark:border-violet-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-700">
        {/* Collapse toggle */}
        <button
          onClick={onToggleExpand}
          className="flex-shrink-0 w-5 h-5 text-violet-500"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Editable title */}
        {editingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") {
                setTitleInput(task.title);
                setEditingTitle(false);
              }
            }}
            className="flex-1 px-2 py-1 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
            autoFocus
          />
        ) : (
          <span
            onClick={() => setEditingTitle(true)}
            className="flex-1 text-zinc-900 dark:text-zinc-100 cursor-text hover:text-violet-600 dark:hover:text-violet-400"
          >
            {task.title}
          </span>
        )}

        <span className="flex-shrink-0 text-xs text-zinc-400">
          {getTimeAgo(task.createdAt)}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Steps section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Steps {task.steps.length > 0 && `(${task.steps.length})`}
            </span>
            <button
              onClick={onOpenAIDrawer}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
              </svg>
              Break down with AI
            </button>
          </div>

          {/* Existing steps */}
          {task.steps.length > 0 && (
            <ul className="space-y-2 mb-3">
              {task.steps.map((step, index) => (
                <li key={step.id} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-700 rounded">
                    {index + 1}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">{step.text}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Add step */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddStep();
              }}
              placeholder="Add a step..."
              className="flex-1 px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {newStepText.trim() && (
              <button
                onClick={handleAddStep}
                className="px-3 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded transition-colors"
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* Priority selector */}
        <div>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 block">
            Priority
          </span>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => onUpdateTask(task.id, { priority })}
                className={`
                  px-3 py-1 text-sm rounded-full capitalize transition-colors
                  ${
                    task.priority === priority
                      ? priority === "high"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : priority === "medium"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                  }
                `}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-700 rounded-b-lg">
        <div className="flex items-center gap-2">
          {/* Send to Pool */}
          <button
            onClick={handleQuickToPool}
            className="px-3 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded transition-colors"
          >
            → Ready
          </button>

          {/* Add to Focus button */}
          <button
            onClick={() => onAddToQueue(task.id)}
            className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded transition-colors"
          >
            → Focus
          </button>

          {/* Defer dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDeferMenu(!showDeferMenu)}
              className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
            >
              Defer ▾
            </button>
            {showDeferMenu && (
              <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 min-w-[140px]">
                {DEFER_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => {
                      onDefer(task.id, getDeferDate(option));
                      setShowDeferMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Park */}
          <button
            onClick={() => onPark(task.id)}
            className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
          >
            Park
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(task.id)}
            className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
