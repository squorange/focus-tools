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
    <div className="inline-flex items-center bg-black/[0.06] dark:bg-white/[0.08] rounded-lg p-0.5 gap-0">
      {/* Focus Tab */}
      <button
        onClick={() => onViewChange("focus")}
        className={`px-4 py-2.5 text-sm rounded-md transition-colors ${
          isFocusActive
            ? "bg-white dark:bg-[#141417] text-fg-neutral-primary shadow-sm font-semibold"
            : "text-fg-neutral-spot-readable hover:text-fg-neutral-primary font-medium"
        }`}
      >
        Focus
      </button>

      {/* Tasks Tab */}
      <button
        onClick={() => onViewChange("tasks")}
        className={`px-4 py-2.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
          isTasksActive
            ? "bg-white dark:bg-[#141417] text-fg-neutral-primary shadow-sm font-semibold"
            : "text-fg-neutral-spot-readable hover:text-fg-neutral-primary font-medium"
        }`}
      >
        Tasks
        {/* Badge for inbox count */}
        {inboxCount > 0 && (
          <span className="min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold rounded-full bg-violet-500 text-white">
            {inboxCount > 99 ? "99+" : inboxCount}
          </span>
        )}
      </button>
    </div>
  );
}
