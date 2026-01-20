"use client";

import React from "react";
import { Task } from "@/lib/types";
import { describePatternCompact, getTodayISO } from "@/lib/recurring-utils";
import { AlertTriangle, Repeat, Zap } from "lucide-react";

type TimeWindowStatus = "before" | "active" | "past";

interface RoutineCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
  onOpenDetail: (taskId: string) => void;
  timeWindowStatus?: TimeWindowStatus; // before/active/past target time window
}

export default function RoutineCard({
  task,
  onComplete,
  onOpenDetail,
  timeWindowStatus = "before",
}: RoutineCardProps) {
  if (!task.recurrence) return null;

  // Calculate overdue days
  const today = getTodayISO();
  const nextDue = task.recurringNextDue;
  let overdueDays = 0;
  if (nextDue && nextDue < today) {
    const diffMs = new Date(today).getTime() - new Date(nextDue).getTime();
    overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  const patternDescription = describePatternCompact(task.recurrence);
  const streak = task.recurringStreak;

  // Single tap on circle completes the routine
  const handleCircleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(task.id);
  };

  const handleCardClick = () => {
    onOpenDetail(task.id);
  };

  // Determine if past time window (needs attention)
  const isPastWindow = timeWindowStatus === "past";
  const isActiveWindow = timeWindowStatus === "active";

  return (
    <div
      className="flex-shrink-0 snap-start cursor-pointer"
      onClick={handleCardClick}
    >
      <div
        className={`
          w-full h-[110px] rounded-xl border transition-all
          ${overdueDays > 0
            ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
            : isActiveWindow
              ? "border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20"
              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          }
          hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm
        `}
      >
        <div className="flex flex-col h-full p-3">
          {/* Top row: Circle (left) + Streak + Chevron (right) */}
          <div className="flex items-center justify-between">
            {/* Circle - 20px to match other task rows */}
            {/* Small "!" inside when past time window */}
            <button
              onClick={handleCircleClick}
              className="flex-shrink-0 w-5 h-5 group relative"
            >
              <svg viewBox="0 0 20 20" className="w-full h-full">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-zinc-300 dark:text-zinc-600 group-hover:text-violet-400 dark:group-hover:text-violet-500 transition-colors"
                />
                {/* Small "!" indicator when past time window - monochrome with circle */}
                {isPastWindow && (
                  <text
                    x="10"
                    y="14"
                    textAnchor="middle"
                    className="fill-zinc-400 dark:fill-zinc-500"
                    style={{ fontSize: "10px", fontWeight: 600 }}
                  >
                    !
                  </text>
                )}
              </svg>
            </button>

            {/* Streak with Zap icon - monochromatic, no unit */}
            {streak > 0 && (
              <div className="flex items-center gap-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <Zap className="w-3.5 h-3.5" />
                <span>{streak}</span>
              </div>
            )}
          </div>

          {/* Title row - full width, line-clamp-2 */}
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight mt-2">
            {task.title}
          </h3>

          {/* Spacer to push pattern to bottom */}
          <div className="flex-1" />

          {/* Bottom row: Pattern (amber if past window) + Overdue indicator */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 text-xs min-w-0 ${
              isPastWindow
                ? "text-amber-600 dark:text-amber-400"
                : "text-zinc-500 dark:text-zinc-400"
            }`}>
              <Repeat className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{patternDescription}</span>
            </div>

            {/* Overdue indicator (day-level, not time-window) */}
            {overdueDays > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                <span>{overdueDays}d</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
