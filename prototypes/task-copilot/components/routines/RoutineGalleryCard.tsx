"use client";

import React from "react";
import { Task } from "@/lib/types";
import { describePatternCompact, getTodayISO, getActiveOccurrenceDate, ensureInstance, calculateStreak } from "@/lib/recurring-utils";
import { ActionableCard } from "@design-system/components";
import { Repeat, Zap } from "lucide-react";

type TimeWindowStatus = "before" | "active" | "past";

interface RoutineGalleryCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
  onOpenDetail: (taskId: string) => void;
  timeWindowStatus?: TimeWindowStatus;
  dayStartHour?: number;
}

// Custom progress ring with optional "!" indicator for overdue
function StatusRing({
  completed,
  total,
  isComplete,
  isPastWindow,
  onClick,
}: {
  completed: number;
  total: number;
  isComplete: boolean;
  isPastWindow: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const progress = total > 0 ? completed / total : 0;
  const circumference = 2 * Math.PI * 9;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-5 h-5 group relative"
    >
      {isComplete ? (
        // Completed: solid green circle with checkmark
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
        // Progress ring with optional "!" indicator
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
          {total > 0 && completed > 0 && (
            <circle
              cx={10}
              cy={10}
              r={9}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              className="text-violet-500"
            />
          )}
          {/* "!" indicator when past time window */}
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
  );
}

export default function RoutineGalleryCard({
  task,
  onComplete,
  onOpenDetail,
  timeWindowStatus = "before",
  dayStartHour = 0,
}: RoutineGalleryCardProps) {
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
  const streak = calculateStreak(task);

  // Single tap on circle completes the routine
  const handleCircleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(task.id);
  };

  const handleCardClick = () => {
    onOpenDetail(task.id);
  };

  // Determine if past time window
  const isPastWindow = timeWindowStatus === "past";
  const isActiveWindow = timeWindowStatus === "active";

  return (
    <div className="flex-shrink-0 snap-start">
      <ActionableCard
        variant="compact"
        appearance={isActiveWindow ? "highlighted" : "default"}
        height={110}
        onClick={handleCardClick}
      >
        {/* Top row: Ring (left) + Streak (right) */}
        <div className="flex items-center justify-between">
          <StatusRing
            completed={completedSteps}
            total={totalSteps}
            isComplete={isInstanceComplete}
            isPastWindow={isPastWindow}
            onClick={handleCircleClick}
          />

          {/* Streak with Zap icon */}
          {streak > 0 && (
            <div className="flex items-center gap-0.5 text-xs font-medium text-fg-neutral-secondary">
              <Zap className="w-3.5 h-3.5" />
              <span>{streak}</span>
            </div>
          )}
        </div>

        {/* Title row - 2-line clamp */}
        <ActionableCard.Title clamp={2} className="mt-2">
          {task.title}
        </ActionableCard.Title>

        {/* Spacer to push pattern to bottom */}
        <div className="flex-1" />

        {/* Bottom row: Pattern (amber if past window) */}
        <ActionableCard.Meta position="bottom">
          <div className={`flex items-center gap-1.5 text-xs min-w-0 ${
            isPastWindow
              ? "text-amber-600 dark:text-amber-400"
              : "text-fg-neutral-secondary"
          }`}>
            <Repeat className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{patternDescription}</span>
          </div>
        </ActionableCard.Meta>
      </ActionableCard>
    </div>
  );
}
