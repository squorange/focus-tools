"use client";

import React from "react";
import { Task } from "@/lib/types";
import { describePatternCompact, getTodayISO, getActiveOccurrenceDate, ensureInstance } from "@/lib/recurring-utils";
import { Repeat, Zap } from "lucide-react";

type TimeWindowStatus = "before" | "active" | "past";

interface RoutineCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
  onOpenDetail: (taskId: string) => void;
  timeWindowStatus?: TimeWindowStatus; // before/active/past target time window
  dayStartHour?: number; // Hour when the day starts (0-12). Default 0 (midnight).
}

export default function RoutineCard({
  task,
  onComplete,
  onOpenDetail,
  timeWindowStatus = "before",
  dayStartHour = 0,
}: RoutineCardProps) {
  if (!task.recurrence) return null;

  // Calculate overdue days
  const today = getTodayISO(dayStartHour);
  const nextDue = task.recurringNextDue;
  let overdueDays = 0;
  if (nextDue && nextDue < today) {
    const diffMs = new Date(today).getTime() - new Date(nextDue).getTime();
    overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Get current instance for step progress
  const activeDate = getActiveOccurrenceDate(task, dayStartHour) || today;
  const instance = ensureInstance(task, activeDate);

  // Count steps
  const totalSteps = instance.steps.length;
  const completedSteps = instance.steps.filter(s => s.completed).length;
  const isInstanceComplete = instance.completed;

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
          ${isActiveWindow
            ? "border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20"
            : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          }
          hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm
        `}
      >
        <div className="flex flex-col h-full p-3">
          {/* Top row: Circle with progress ring (left) + Streak (right) */}
          <div className="flex items-center justify-between">
            {/* Progress ring - 20px, matches ProgressRing component exactly */}
            <button
              onClick={handleCircleClick}
              className="flex-shrink-0 w-5 h-5 group relative"
            >
              {isInstanceComplete ? (
                // Completed: solid green circle with checkmark (matches ProgressRing)
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                // Progress ring - exact same styling as ProgressRing component
                // size=20, strokeWidth=2, radius=9, circumference=2*PI*9
                <svg width={20} height={20} className="transform -rotate-90 flex-shrink-0">
                  {/* Background circle */}
                  <circle
                    cx={10}
                    cy={10}
                    r={9}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-zinc-200 dark:text-zinc-700"
                  />
                  {/* Progress arc */}
                  {totalSteps > 0 && completedSteps > 0 && (
                    <circle
                      cx={10}
                      cy={10}
                      r={9}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeDasharray={2 * Math.PI * 9}
                      strokeDashoffset={2 * Math.PI * 9 * (1 - completedSteps / totalSteps)}
                      strokeLinecap="round"
                      className="text-violet-500"
                    />
                  )}
                  {/* Small "!" indicator when past time window (even with partial progress) */}
                  {isPastWindow && (
                    <text
                      x="10"
                      y="14"
                      textAnchor="middle"
                      className="fill-zinc-400 dark:fill-zinc-500"
                      style={{ fontSize: "10px", fontWeight: 600 }}
                      transform="rotate(90 10 10)"
                    >
                      !
                    </text>
                  )}
                </svg>
              )}
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

            {/* Removed aggressive overdue indicator - using subtle "!" in ring and amber time text instead */}
          </div>
        </div>
      </div>
    </div>
  );
}
