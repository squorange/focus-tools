"use client";

import { Task } from "@/lib/types";
import TriageTaskCard from "@/components/shared/TriageTaskCard";

interface InboxViewProps {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onSendToPool: (id: string) => void;
  onAddToQueue: (id: string, forToday?: boolean) => void;
  onDefer: (id: string, until: string) => void;
  onPark: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function InboxView({
  tasks,
  onOpenTask,
  onSendToPool,
  onAddToQueue,
  onDefer,
  onPark,
  onDelete,
}: InboxViewProps) {
  // Sort tasks by creation date (newest first)
  const sortedTasks = [...tasks].sort((a, b) => b.createdAt - a.createdAt);

  // Quick actions for all items
  const handleProcessAll = () => {
    // Send all inbox items to pool
    tasks.forEach((task) => {
      onSendToPool(task.id);
    });
  };

  return (
    <div className="h-full flex flex-col px-4 lg:px-6 py-4">
      {/* Move all button - only show when multiple items */}
      {tasks.length > 1 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleProcessAll}
            className="px-4 py-2 text-sm font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40 rounded-lg transition-colors"
          >
            Move all to Ready
          </button>
        </div>
      )}

      {/* Inbox items */}
      {sortedTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-fg-neutral-primary mb-2">
            All caught up
          </h3>
          <p className="text-sm text-fg-neutral-secondary max-w-xs">
            No items need triage. Use the + button to capture new thoughts.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {sortedTasks.map((task) => (
            <TriageTaskCard
              key={task.id}
              task={task}
              onOpenTask={onOpenTask}
              onSendToPool={onSendToPool}
              onAddToQueue={onAddToQueue}
              onDefer={onDefer}
              onPark={onPark}
              onDelete={onDelete}
              variant="full"
            />
          ))}
        </div>
      )}
    </div>
  );
}
