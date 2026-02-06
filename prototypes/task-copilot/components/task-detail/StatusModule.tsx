"use client";

import { Task } from "@/lib/types";
import { RecurrenceRuleExtended, RecurringInstance } from "@/lib/recurring-types";
import { describePattern, getTodayISO, dateMatchesPattern, timestampToLocalDate, calculateStreak } from "@/lib/recurring-utils";
import { Check, ChevronRight, Repeat, SkipForward, Zap } from "lucide-react";

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
        className="rounded-full border-2 border-border-color-neutral flex items-center justify-center flex-shrink-0"
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
        <span className="text-sm font-semibold text-fg-neutral-primary">
          {completed}/{total}
        </span>
      </div>
    </div>
  );
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
  // Mode switching for recurring tasks
  mode?: 'executing' | 'managing';
  onToggleMode?: () => void;
}

// StatusModule now returns INLINE content (no outer container)
// The container is provided by TaskDetail.tsx for unified styling
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
  mode,
  onToggleMode,
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
      <div className="flex items-center gap-4">
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
    // Calculate streak dynamically at display time (not cached)
    const streak = calculateStreak(task);

    // MANAGING MODE: Simplified display - just pattern + streak (no chart)
    if (mode === 'managing') {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-zinc-500">
            <Repeat className="w-3 h-3 text-violet-500" />
            <span>{patternDescription}{task.recurrence?.rolloverIfMissed && " · Persists"}</span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 text-sm text-fg-neutral-secondary font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>{streak}</span>
            </div>
          )}
        </div>
      );
    }

    // EXECUTING MODE: Full display with chart
    const instanceCompleted = currentInstance?.steps.filter(s => s.completed).length ?? 0;
    const instanceTotal = currentInstance?.steps.length ?? 0;

    // Check if today was skipped
    const today = getTodayISO();
    const pattern = recurrencePattern;
    const startDate = pattern?.startDate || (task.createdAt ? timestampToLocalDate(task.createdAt) : today);
    const todayMatchesPattern = pattern ? dateMatchesPattern(today, pattern, startDate) : false;
    const todayInstance = task.recurringInstances?.find(i => i.date === today);
    const wasSkippedToday = todayMatchesPattern && todayInstance?.skipped;

    return (
      <div className="flex items-start gap-4">
        <LargeProgressRing
          completed={instanceCompleted}
          total={instanceTotal}
          isComplete={currentInstance?.completed ?? false}
          overdue={currentInstance?.overdueDays ? currentInstance.overdueDays > 0 : false}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              {/* Step count OR Skipped message - all use leading-5 for consistent height */}
              {wasSkippedToday ? (
                <span className="inline-flex items-center gap-1.5 text-sm leading-5 text-amber-600 dark:text-amber-400">
                  <SkipForward className="w-3 h-3" />
                  Skipped today
                </span>
              ) : instanceTotal === 0 ? (
                currentInstance?.completed ? (
                  <span className="text-sm leading-5 text-green-600 dark:text-green-400">Completed</span>
                ) : (
                  <span className="text-sm leading-5 text-fg-neutral-secondary">No steps</span>
                )
              ) : (
                <span className={`text-sm leading-5 ${currentInstance?.completed
                  ? "text-green-600 dark:text-green-400"
                  : "text-fg-neutral-secondary"
                }`}>
                  {instanceCompleted} of {instanceTotal} steps{currentInstance?.completed && " complete"}
                </span>
              )}
              {/* Pattern - stacked under step count/skipped */}
              <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                <Repeat className="w-3 h-3 text-violet-500" />
                <span>{patternDescription}{task.recurrence?.rolloverIfMissed && " · Persists"}</span>
              </div>
              {/* Toggle - stacked under pattern */}
              {hasCompletedSteps && instanceCompleted > 0 && !(currentInstance?.completed ?? false) && (
                <button
                  onClick={onToggleCompletedSteps}
                  className="flex items-center gap-1 text-sm text-fg-neutral-secondary hover:text-fg-neutral-secondary transition-colors"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${completedStepsExpanded ? "rotate-90" : ""}`} />
                  {completedStepsExpanded ? "Hide completed" : `Show ${instanceCompleted} completed`}
                </button>
              )}
            </div>
            {/* Streak - right-aligned */}
            {streak > 0 && (
              <div className="flex items-center gap-1 text-sm text-fg-neutral-secondary font-medium flex-shrink-0 ml-2">
                <Zap className="w-3.5 h-3.5" />
                <span>{streak}</span>
              </div>
            )}
          </div>
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
    <div className="flex items-start gap-4">
      <LargeProgressRing
        completed={completedCount}
        total={totalCount}
        isComplete={isComplete}
      />
      <div className="flex-1 min-w-0">
        <div className="space-y-0.5">
          {/* Step count - today-aware for queued tasks */}
          <div className="text-sm text-fg-neutral-secondary">
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
          {/* Toggle - stacked under step count */}
          {hasCompletedSteps && completedCount > 0 && !isComplete && (
            <button
              onClick={onToggleCompletedSteps}
              className="flex items-center gap-1 text-sm text-fg-neutral-secondary hover:text-fg-neutral-secondary transition-colors"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${completedStepsExpanded ? "rotate-90" : ""}`} />
              {completedStepsExpanded ? "Hide completed" : `Show ${completedCount} completed`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
