"use client";

import { Task } from "@/lib/types";
import QuickCapture from "./QuickCapture";
import TriageRow from "@/components/shared/TriageRow";

interface InboxViewProps {
  tasks: Task[];
  onBack?: () => void; // Optional back button for drill-in from Tasks view
  onCreateTask: (title: string) => void;
  onOpenTask: (taskId: string) => void;
  onSendToPool: (id: string) => void;
  onAddToQueue: (id: string, forToday?: boolean) => void;
  onDefer: (id: string, until: string) => void;
  onPark: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function InboxView({
  tasks,
  onBack,
  onCreateTask,
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
    <div className="h-full flex flex-col">
      {/* Header - matching TaskDetail pattern */}
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Needs Triage
          </h1>
          {tasks.length > 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {tasks.length} item{tasks.length !== 1 ? "s" : ""} to review
            </p>
          )}
        </div>

        {tasks.length > 1 && (
          <button
            onClick={handleProcessAll}
            className="px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
          >
            Move all to Ready
          </button>
        )}
      </div>

      {/* Quick Capture */}
      <div className="mb-6">
        <QuickCapture onCapture={onCreateTask} />
      </div>

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
          <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            All caught up
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
            No items need triage. Capture new thoughts above.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {sortedTasks.map((task) => (
            <TriageRow
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
