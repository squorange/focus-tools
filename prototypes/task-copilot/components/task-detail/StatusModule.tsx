"use client";

import { Task } from "@/lib/types";
import { RecurrenceRuleExtended, RecurringInstance } from "@/lib/recurring-types";
import { describePattern } from "@/lib/recurring-utils";
import { Check, ChevronRight, Repeat, Zap, Calendar } from "lucide-react";

// Format date as "Tuesday, Jan 20" for clear day identification
function formatInstanceDate(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

interface StatusModuleProps {
  task: Task;
  currentInstance: RecurringInstance | null;
  completedCount: number;
  totalCount: number;
  hasCompletedSteps: boolean;
  completedStepsExpanded: boolean;
  onToggleCompletedSteps: () => void;
  // For today-aware one-off tasks
  isInQueue?: boolean;
  todayStepIds?: string[];
}

// 48px progress ring for the status module - fraction only, no label inside
function LargeProgressRing({
  completed,
  total,
  isComplete,
  overdue,
}: {
  completed: number;
  total: number;
  isComplete: boolean;
  overdue?: boolean;
}) {
  const size = 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference - progress * circumference;

  // Determine colors based on state
  const bgColor = "text-zinc-200 dark:text-zinc-700";
  const progressColor = isComplete
    ? "text-green-500"
    : overdue
    ? "text-amber-500"
    : "text-violet-500";

  // Completed state - green fill with checkmark
  if (isComplete) {
    return (
      <div
        className="rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Check className="w-6 h-6 text-white" />
      </div>
    );
  }

  // Stepless task, not complete - empty circle (no dash inside)
  if (total === 0) {
    return (
      <div
        className="rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  // Step-based task with progress - fraction only, no label
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={bgColor}
        />
        {/* Progress arc */}
        {progress > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={progressColor}
          />
        )}
      </svg>
      {/* Center text - fraction only */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {completed}/{total}
        </span>
      </div>
    </div>
  );
}

export default function StatusModule({
  task,
  currentInstance,
  completedCount,
  totalCount,
  hasCompletedSteps,
  completedStepsExpanded,
  onToggleCompletedSteps,
  isInQueue = false,
  todayStepIds = [],
}: StatusModuleProps) {
  const isRecurring = task.isRecurring && task.recurrence;
  const recurrencePattern = task.recurrence as RecurrenceRuleExtended | null;
  const patternDescription = recurrencePattern ? describePattern(recurrencePattern) : "";

  // Determine if task/instance is complete
  const isComplete = isRecurring
    ? currentInstance?.completed ?? false
    : task.status === "complete";

  // For stepless tasks - only show when complete (contextual presence)
  if (totalCount === 0 && !isRecurring) {
    if (!isComplete) {
      return null; // Don't show status module for incomplete stepless tasks
    }
    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border border-zinc-300/50 dark:border-zinc-700/50 shadow-xl shadow-black/10 dark:shadow-black/30 rounded-2xl mb-6">
        <LargeProgressRing
          completed={0}
          total={0}
          isComplete={isComplete}
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            Completed
          </span>
        </div>
      </div>
    );
  }

  // For recurring tasks - ALWAYS show (daily commitment, absence is informative)
  if (isRecurring) {
    // Count includes both routineSteps AND additionalSteps
    const routineCompleted = currentInstance?.routineSteps.filter(s => s.completed).length ?? 0;
    const additionalCompleted = currentInstance?.additionalSteps?.filter(s => s.completed).length ?? 0;
    const instanceCompleted = routineCompleted + additionalCompleted;

    const routineTotal = currentInstance?.routineSteps.length ?? 0;
    const additionalTotal = currentInstance?.additionalSteps?.length ?? 0;
    const instanceTotal = routineTotal + additionalTotal;

    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border border-zinc-300/50 dark:border-zinc-700/50 shadow-xl shadow-black/10 dark:shadow-black/30 rounded-2xl mb-6">
        <LargeProgressRing
          completed={instanceCompleted}
          total={instanceTotal}
          isComplete={currentInstance?.completed ?? false}
          overdue={currentInstance?.overdueDays ? currentInstance.overdueDays > 0 : false}
        />
        <div className="flex-1 min-w-0">
          {/* Top row: Date context + Streak (right-aligned) */}
          <div className="flex items-start justify-between">
            {/* Date context - shows which day this instance is for */}
            {currentInstance?.date && (
              <span className={`text-sm ${currentInstance.completed
                ? "text-green-600 dark:text-green-400"
                : "text-zinc-600 dark:text-zinc-400"
              }`}>
                {currentInstance.completed ? "Completed for " : "For "}
                {formatInstanceDate(currentInstance.date)}
              </span>
            )}
            {/* Streak with Zap icon - monochromatic, no unit */}
            {task.recurringStreak > 0 && (
              <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 font-medium flex-shrink-0 ml-2">
                <Zap className="w-3.5 h-3.5" />
                <span>{task.recurringStreak}</span>
              </div>
            )}
          </div>

          {/* Pattern description */}
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            <Repeat className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span>{patternDescription}</span>
          </div>

          {/* Tap to expand completed steps - only if any completed and not instance complete */}
          {hasCompletedSteps && instanceCompleted > 0 && !(currentInstance?.completed ?? false) && (
            <button
              onClick={onToggleCompletedSteps}
              className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mt-1.5 transition-colors"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${completedStepsExpanded ? "rotate-90" : ""}`} />
              Show {instanceCompleted} completed
            </button>
          )}
        </div>
      </div>
    );
  }

  // For regular tasks with steps - contextual presence
  if (completedCount === 0 && !isComplete) {
    return null; // Don't show status module until progress starts
  }

  // Calculate today-specific progress for queued tasks
  const hasTodaySteps = isInQueue && todayStepIds.length > 0;
  const todayCompletedCount = hasTodaySteps
    ? task.steps.filter(s => todayStepIds.includes(s.id) && s.completed).length
    : 0;
  const todayTotalCount = hasTodaySteps ? todayStepIds.length : 0;

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border border-zinc-300/50 dark:border-zinc-700/50 shadow-xl shadow-black/10 dark:shadow-black/30 rounded-2xl mb-6">
      <LargeProgressRing
        completed={completedCount}
        total={totalCount}
        isComplete={isComplete}
      />
      <div className="flex-1 min-w-0">
        {/* Step count - today-aware for queued tasks */}
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {hasTodaySteps ? (
            <>
              {todayCompletedCount} of {todayTotalCount} for today
            </>
          ) : (
            <>
              {completedCount} of {totalCount} steps{isComplete && " complete"}
            </>
          )}
        </div>

        {/* Tap to expand completed steps */}
        {hasCompletedSteps && completedCount > 0 && !isComplete && (
          <button
            onClick={onToggleCompletedSteps}
            className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mt-1 transition-colors"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${completedStepsExpanded ? "rotate-90" : ""}`} />
            Show {completedCount} completed
          </button>
        )}
      </div>
    </div>
  );
}
