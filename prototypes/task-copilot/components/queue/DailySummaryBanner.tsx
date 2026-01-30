"use client";

import { Task, FocusQueueItem } from "@/lib/types";
import { countCompletionsToday } from "@/lib/completions";
import { filterRoutinesForToday, getTodayISO } from "@/lib/recurring-utils";
import { ChevronRight } from "lucide-react";

interface DailySummaryBannerProps {
  tasks: Task[];
  todayItems: FocusQueueItem[];
  onOpenCompleted: () => void;
  dayStartHour?: number; // Hour when the day starts (0-12). Default 0 (midnight).
}

// Get total estimated time for items (only if high confidence - 50%+ have estimates)
function getTotalEstimate(items: FocusQueueItem[], tasks: Task[]): string | null {
  let totalMinutes = 0;
  let stepsWithEstimate = 0;
  let totalIncompleteSteps = 0;

  for (const item of items) {
    const task = tasks.find((t) => t.id === item.taskId);
    if (!task) continue;

    const steps =
      item.selectionType === "all_today" || item.selectionType === "all_upcoming"
        ? task.steps
        : task.steps.filter((s) => item.selectedStepIds.includes(s.id));

    const incompleteSteps = steps.filter((s) => !s.completed);
    totalIncompleteSteps += incompleteSteps.length;

    for (const step of incompleteSteps) {
      if (step.estimatedMinutes && step.estimatedMinutes > 0) {
        totalMinutes += step.estimatedMinutes;
        stepsWithEstimate++;
      }
    }
  }

  // Only show estimate if 50%+ of incomplete steps have estimates (high confidence)
  if (totalMinutes === 0 || totalIncompleteSteps === 0) return null;
  const coverageRatio = stepsWithEstimate / totalIncompleteSteps;
  if (coverageRatio < 0.5) return null;

  if (totalMinutes < 60) return `~${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
}

export default function DailySummaryBanner({
  tasks,
  todayItems,
  onOpenCompleted,
  dayStartHour = 0,
}: DailySummaryBannerProps) {
  // Count completions today (tasks + steps + recurring instances)
  const completionCount = countCompletionsToday(tasks, dayStartHour);

  // Get ALL routines applicable for today (including completed/skipped)
  // This fixes the bug where completing a routine decreased total instead of increasing done
  const allRoutinesToday = filterRoutinesForToday(tasks, dayStartHour);

  // Calculate total items for today (queue items + ALL applicable routines)
  const totalItems = todayItems.length + allRoutinesToday.length;
  const doneItems = completionCount;

  // Time estimate for today's queue items
  const timeEstimate = getTotalEstimate(todayItems, tasks);

  // Get today's date for checking routine instances
  const today = getTodayISO(dayStartHour);

  // Count incomplete routines - check if today's instance is complete/skipped
  const incompleteRoutines = allRoutinesToday.filter(task => {
    const todayInstance = task.recurringInstances?.find(i => i.date === today);
    // If instance exists and is completed or skipped, it's done
    if (todayInstance?.completed || todayInstance?.skipped) {
      return false;
    }
    // Otherwise it's incomplete (either no instance or not done)
    return true;
  }).length;

  // Count incomplete today queue items
  const incompleteTodayItems = todayItems.filter(item => !item.completed).length;

  // "All done" state - only true if no incomplete items exist
  const allDone = (todayItems.length > 0 || allRoutinesToday.length > 0)
    && incompleteRoutines === 0
    && incompleteTodayItems === 0;

  // Don't render if nothing to track
  if (totalItems === 0 && doneItems === 0) {
    return null;
  }

  // Build display string - completions focused (no "X of Y" to avoid overwhelm)
  let displayText: string;
  if (allDone) {
    displayText = "All done for today!";
  } else if (doneItems > 0) {
    displayText = timeEstimate
      ? `${doneItems} completed  ·  ${timeEstimate} remaining`
      : `${doneItems} completed`;
  } else if (timeEstimate) {
    displayText = `${timeEstimate} remaining`;
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
