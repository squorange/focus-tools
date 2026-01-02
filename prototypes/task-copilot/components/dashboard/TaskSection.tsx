"use client";

import { useState } from "react";
import { Task } from "@/lib/types";
import TaskRow from "./TaskRow";

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  emptyMessage: string;
  onSelectTask: (taskId: string) => void;
  onEnterFocus: (taskId: string) => void;
  defaultExpanded?: boolean;
  variant?: "default" | "completed";
}

export default function TaskSection({
  title,
  tasks,
  emptyMessage,
  onSelectTask,
  onEnterFocus,
  defaultExpanded = true,
  variant = "default",
}: TaskSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Don't render if no tasks and no empty message
  if (tasks.length === 0 && !emptyMessage) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Section header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-1 px-1 -mx-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {title}
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {tasks.length}
          </span>
        </div>
      </button>

      {/* Task list */}
      {isExpanded && (
        <div className="space-y-1">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onClick={() => onSelectTask(task.id)}
                onFocusClick={() => onEnterFocus(task.id)}
                variant={variant}
              />
            ))
          ) : (
            <div className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
