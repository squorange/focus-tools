"use client";

import { Task, FocusQueueItem } from "@/lib/types";
import { countCompletionsToday } from "@/lib/completions";
import { filterRoutinesForToday } from "@/lib/recurring-utils";
import { ChevronRight } from "lucide-react";

interface DailySummaryBannerProps {
  tasks: Task[];
  todayItems: FocusQueueItem[];
  onOpenCompleted: () => void;
}

// Get total estimated time for items
function getTotalEstimate(items: FocusQueueItem[], tasks: Task[]): string | null {
  let totalMinutes = 0;

  for (const item of items) {
    const task = tasks.find((t) => t.id === item.taskId);
    if (!task) continue;

    const steps =
      item.selectionType === "all_today" || item.selectionType === "all_upcoming"
        ? task.steps
        : task.steps.filter((s) => item.selectedStepIds.includes(s.id));

    const incompleteSteps = steps.filter((s) => !s.completed);
    totalMinutes += incompleteSteps.reduce(
      (sum, s) => sum + (s.estimatedMinutes || 0),
      0
    );
  }

  if (totalMinutes === 0) return null;
  if (totalMinutes < 60) return `~${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
}

export default function DailySummaryBanner({
  tasks,
  todayItems,
  onOpenCompleted,
}: DailySummaryBannerProps) {
  // Count completions today (tasks + steps)
  const completionCount = countCompletionsToday(tasks);

  // Get ALL routines applicable for today (including completed/skipped)
  // This fixes the bug where completing a routine decreased total instead of increasing done
  const allRoutinesToday = filterRoutinesForToday(tasks);
  const today = new Date().toISOString().split("T")[0];

  // Count completed routines today
  const completedRoutines = allRoutinesToday.filter((task) => {
    const todayInstance = task.recurringInstances?.find((i) => i.date === today);
    return todayInstance?.completed;
  }).length;

  // Calculate total items for today (queue items + ALL applicable routines)
  const totalItems = todayItems.length + allRoutinesToday.length;
  const doneItems = completionCount + completedRoutines;

  // Time estimate for today's queue items
  const timeEstimate = getTotalEstimate(todayItems, tasks);

  // "All done" state
  const allDone = totalItems > 0 && doneItems >= totalItems;

  // Don't render if nothing to track
  if (totalItems === 0 && doneItems === 0) {
    return null;
  }

  // Build display string - progress-focused
  let displayText: string;
  if (allDone) {
    displayText = "All done for today!";
  } else if (doneItems > 0) {
    displayText = timeEstimate
      ? `${doneItems} of ${totalItems} done  ·  ${timeEstimate}`
      : `${doneItems} of ${totalItems} done`;
  } else if (totalItems > 0) {
    displayText = timeEstimate
      ? `${totalItems} to do  ·  ${timeEstimate}`
      : "Tap to view completed";
  } else {
    displayText = "Tap to view completed";
  }

  return (
    <button
      onClick={onOpenCompleted}
      className="w-full flex items-center justify-between px-4 py-2.5 mb-4 text-sm rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border border-zinc-300/50 dark:border-zinc-700/50 shadow-xl shadow-black/10 dark:shadow-black/30 hover:shadow-lg transition-all"
    >
      <span className={allDone ? "text-green-600 dark:text-green-400 font-medium" : "text-zinc-600 dark:text-zinc-400"}>
        {displayText}
      </span>
      <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
    </button>
  );
}
