"use client";

import { ViewType } from "@/lib/types";

interface TabClusterProps {
  currentView: ViewType;
  previousView: ViewType | null;
  onViewChange: (view: ViewType) => void;
  inboxCount: number;
}

export default function TabCluster({
  currentView,
  previousView,
  onViewChange,
  inboxCount,
}: TabClusterProps) {
  // Determine which tab is active based on current view AND where user came from
  // This ensures TaskDetail shows correct tab highlighting based on navigation source
  const isFocusActive =
    currentView === "focus" ||
    currentView === "focusMode" ||
    (currentView === "taskDetail" && (previousView === "focus" || previousView === null));

  const isTasksActive =
    currentView === "tasks" ||
    currentView === "inbox" ||
    (currentView === "taskDetail" && (previousView === "tasks" || previousView === "inbox"));

  return (
    <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-700 rounded-lg p-px gap-px">
      {/* Focus Tab */}
      <button
        onClick={() => onViewChange("focus")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          isFocusActive
            ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        Focus
      </button>

      {/* Tasks Tab */}
      <button
        onClick={() => onViewChange("tasks")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
          isTasksActive
            ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        Tasks
        {/* Badge for inbox count */}
        {inboxCount > 0 && (
          <span
            className={`min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold rounded-full ${
              isTasksActive
                ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                : "bg-amber-500 text-white"
            }`}
          >
            {inboxCount > 99 ? "99+" : inboxCount}
          </span>
        )}
      </button>
    </div>
  );
}
