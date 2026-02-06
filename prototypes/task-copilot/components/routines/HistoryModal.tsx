"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Task } from "@/lib/types";
import { TaskInstance, InstanceStatus } from "@/lib/recurring-types";
import {
  generateInstancesForRange,
  getTodayISO,
  parseISO,
  markInstanceComplete,
  skipInstance,
  calculateStreak,
} from "@/lib/recurring-utils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  SkipForward,
  Circle,
  AlertTriangle,
  Pause,
  Flame,
  Trophy,
  Hash,
} from "lucide-react";
import { BottomSheet, RightDrawer } from "@design-system/components";

interface HistoryModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

/**
 * HistoryModal - Calendar view of completion history
 *
 * Features:
 * - Month view: Calendar grid with status icons (Lucide)
 * - Stats: Current streak, Best streak, Total completions
 * - Navigate months with prev/next
 * - Date tap → Details panel with retroactive actions
 * - Responsive: Desktop modal, Mobile bottom drawer
 */
export default function HistoryModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
}: HistoryModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [isMobileView, setIsMobileView] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(typeof window !== "undefined" && window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Day boundary hour - routines after midnight but before this hour count as previous day
  const dayStartHour = 5;

  const today = getTodayISO(dayStartHour);

  // Generate instances for the current month view
  const monthInstances = useMemo(() => {
    if (!task.isRecurring || !task.recurrence) return [];

    const { year, month } = currentMonth;
    // Use local date formatting to avoid UTC timezone issues
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    return generateInstancesForRange(task, startDate, endDate, dayStartHour);
  }, [task, currentMonth]);

  // Build calendar grid data
  const calendarGrid = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const grid: (TaskInstance | null)[][] = [];
    let currentWeek: (TaskInstance | null)[] = [];

    // Add empty cells for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const instance = monthInstances.find((i) => i.date === dateStr);

      if (instance) {
        currentWeek.push(instance);
      } else {
        // Day with no occurrence
        currentWeek.push({
          date: dateStr,
          status: "no_occurrence" as InstanceStatus,
          instance: null,
          isToday: dateStr === today,
        });
      }

      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining cells in last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      grid.push(currentWeek);
    }

    return grid;
  }, [monthInstances, currentMonth, today]);

  // Stats - calculate current streak dynamically at display time
  const stats = useMemo(() => {
    return {
      currentStreak: calculateStreak(task),
      bestStreak: task.recurringBestStreak || 0,
      totalCompletions: task.recurringTotalCompletions || 0,
    };
  }, [task]);

  // Navigation
  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: newMonth };
    });
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: newMonth };
    });
    setSelectedDate(null);
  };

  // Handle date click - select for details
  const handleDateClick = (instance: TaskInstance | null) => {
    if (!instance || instance.status === "no_occurrence") return;
    setSelectedDate(selectedDate === instance.date ? null : instance.date);
  };

  // Retroactive mark complete
  const handleMarkComplete = (date: string) => {
    if (!onUpdateTask) return;

    const updatedTask = markInstanceComplete(task, date, dayStartHour);
    onUpdateTask(task.id, {
      recurringInstances: updatedTask.recurringInstances,
      recurringStreak: updatedTask.recurringStreak,
      recurringBestStreak: updatedTask.recurringBestStreak,
      recurringTotalCompletions: updatedTask.recurringTotalCompletions,
      recurringLastCompleted: updatedTask.recurringLastCompleted,
      recurringNextDue: updatedTask.recurringNextDue,
    });
    setSelectedDate(null);
  };

  // Retroactive mark skipped
  const handleMarkSkipped = (date: string) => {
    if (!onUpdateTask) return;

    const updatedTask = skipInstance(task, date, dayStartHour);
    onUpdateTask(task.id, {
      recurringInstances: updatedTask.recurringInstances,
      recurringNextDue: updatedTask.recurringNextDue,
    });
    setSelectedDate(null);
  };

  // Get selected date details
  const selectedInstance = useMemo(() => {
    if (!selectedDate) return null;
    return monthInstances.find((i) => i.date === selectedDate) || null;
  }, [selectedDate, monthInstances]);

  if (!isOpen) return null;

  const monthName = new Date(
    currentMonth.year,
    currentMonth.month
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Shared content renderer
  const renderContent = () => (
    <div className="min-h-[460px] flex flex-col">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-bg-neutral-subtle"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-base font-medium text-fg-neutral-primary">
          {monthName}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-bg-neutral-subtle"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-fg-neutral-secondary py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {calendarGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => (
              <button
                key={dayIndex}
                onClick={() => handleDateClick(day)}
                disabled={!day || day.status === "no_occurrence"}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                  transition-colors
                  ${day === null ? "text-zinc-300 dark:text-zinc-700" : ""}
                  ${day?.isToday ? "ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-zinc-900" : ""}
                  ${selectedDate === day?.date ? "bg-violet-100 dark:bg-violet-900/30" : ""}
                  ${day && day.status !== "no_occurrence" ? "hover:bg-bg-neutral-subtle cursor-pointer" : "cursor-default"}
                `}
              >
                {day && (
                  <>
                    <span
                      className={`text-xs ${
                        day.isToday
                          ? "font-bold text-violet-600 dark:text-violet-400"
                          : "text-fg-neutral-secondary"
                      }`}
                    >
                      {parseISO(day.date).getDate()}
                    </span>
                    <StatusIcon status={day.status} />
                  </>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-border-color-neutral">
        <p className="text-xs text-fg-neutral-secondary mb-2">Legend</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <StatusIcon status="completed" />
            <span className="text-fg-neutral-secondary">Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusIcon status="missed" />
            <span className="text-fg-neutral-secondary">Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusIcon status="skipped" />
            <span className="text-fg-neutral-secondary">Skipped</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusIcon status="today" />
            <span className="text-fg-neutral-secondary">Due</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusIcon status="pending" />
            <span className="text-fg-neutral-secondary">Future</span>
          </div>
        </div>
      </div>

      {/* Selected Date Details Panel */}
      {selectedInstance && (
        <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-border-color-neutral">
          <p className="text-sm font-medium text-fg-neutral-primary mb-1">
            {parseISO(selectedInstance.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-fg-neutral-secondary mb-3">
            Status: {getStatusLabel(selectedInstance.status)}
          </p>

          {/* Show completed steps for this day */}
          {selectedInstance.instance && (
            <>
              {selectedInstance.instance.steps.filter(s => s.completed).length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-fg-neutral-secondary mb-1.5">
                    Completed Steps
                  </p>
                  <ul className="space-y-1">
                    {selectedInstance.instance.steps
                      .filter(s => s.completed)
                      .map(step => (
                        <li key={step.id} className="flex items-center gap-1.5 text-sm text-fg-neutral-primary">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="truncate">{step.text}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {/* No steps completed message */}
              {selectedInstance.instance.steps.filter(s => s.completed).length === 0 &&
                selectedInstance.status !== "completed" && (
                <p className="text-sm text-fg-neutral-soft mb-3 italic">
                  No steps completed yet
                </p>
              )}
            </>
          )}

          {/* Actions for incomplete days */}
          {canTakeAction(selectedInstance, today) && onUpdateTask && (
            <div className="flex gap-2">
              {(selectedInstance.status === "missed" ||
                selectedInstance.status === "overdue" ||
                selectedInstance.status === "today") && (
                <button
                  onClick={() => handleMarkComplete(selectedInstance.date)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Complete
                </button>
              )}
              {(selectedInstance.status === "missed" ||
                selectedInstance.status === "overdue" ||
                selectedInstance.status === "today") && (
                <button
                  onClick={() => handleMarkSkipped(selectedInstance.date)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Desktop: Right drawer
  if (!isMobileView) {
    return (
      <RightDrawer isOpen={isOpen} onClose={onClose} width="400px" zIndex={70}>
        <div className="flex flex-col h-full">
          {/* Header - matches main navbar (no bottom border) */}
          <div className="h-14 flex items-center justify-between px-2 shrink-0">
            <div className="px-2">
              <h2 className="text-base font-medium text-fg-neutral-primary">
                Completion History
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-fg-neutral-secondary" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-around py-3 px-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-border-color-neutral shrink-0">
            <div className="flex items-center gap-1.5 text-sm">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-fg-neutral-secondary">Streak:</span>
              <span className="font-semibold text-fg-neutral-primary">
                {stats.currentStreak}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-fg-neutral-secondary">Best:</span>
              <span className="font-semibold text-fg-neutral-primary">
                {stats.bestStreak}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Hash className="w-4 h-4 text-violet-500" />
              <span className="text-fg-neutral-secondary">Total:</span>
              <span className="font-semibold text-fg-neutral-primary">
                {stats.totalCompletions}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 min-h-0">
            {renderContent()}
          </div>
        </div>
      </RightDrawer>
    );
  }

  // Mobile: Bottom sheet
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="70vh" zIndex={70}>
          {/* Mobile header - matches main navbar (no bottom border) */}
          <div className="h-14 flex items-center justify-between px-2 flex-shrink-0">
            <div className="px-2">
              <h2 className="text-base font-medium text-fg-neutral-primary">
                Completion History
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-fg-neutral-secondary" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-around py-2.5 px-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-border-color-neutral">
            <div className="flex items-center gap-1.5 text-sm">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-fg-neutral-primary">
                {stats.currentStreak}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-fg-neutral-primary">
                {stats.bestStreak}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Hash className="w-4 h-4 text-violet-500" />
              <span className="font-semibold text-fg-neutral-primary">
                {stats.totalCompletions}
              </span>
            </div>
          </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {renderContent()}
      </div>
    </BottomSheet>
  );
}

// Status icon component using Lucide icons
function StatusIcon({
  status,
  size = "sm",
}: {
  status: InstanceStatus;
  size?: "sm" | "lg";
}) {
  const containerSize = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  const iconSize = size === "lg" ? "w-3.5 h-3.5" : "w-2.5 h-2.5";

  switch (status) {
    case "completed":
      return (
        <div className={`${containerSize} rounded-full bg-green-500 flex items-center justify-center`}>
          <Check className={`${iconSize} text-white`} strokeWidth={3} />
        </div>
      );
    case "missed":
      return (
        <div className={`${containerSize} rounded-full bg-red-500 flex items-center justify-center`}>
          <X className={`${iconSize} text-white`} strokeWidth={3} />
        </div>
      );
    case "skipped":
      return (
        <div className={`${containerSize} rounded-full bg-amber-500 flex items-center justify-center`}>
          <SkipForward className={`${iconSize} text-white`} strokeWidth={3} />
        </div>
      );
    case "overdue":
      return (
        <div className={`${containerSize} rounded-full bg-orange-500 flex items-center justify-center`}>
          <AlertTriangle className={`${iconSize} text-white`} strokeWidth={3} />
        </div>
      );
    case "paused":
      return (
        <div className={`${containerSize} rounded-full bg-zinc-400 flex items-center justify-center`}>
          <Pause className={`${iconSize} text-white`} strokeWidth={3} />
        </div>
      );
    case "today":
      return (
        <div className={`${containerSize} rounded-full border-2 border-violet-500 flex items-center justify-center`}>
          <Circle className={`${size === "lg" ? "w-2" : "w-1.5"} ${size === "lg" ? "h-2" : "h-1.5"} text-violet-500 fill-violet-500`} />
        </div>
      );
    case "pending":
      return (
        <div className={`${containerSize} rounded-full border-2 border-border-color-neutral flex items-center justify-center`}>
          <Circle className={`${size === "lg" ? "w-2" : "w-1.5"} ${size === "lg" ? "h-2" : "h-1.5"} text-zinc-300 dark:text-zinc-600`} />
        </div>
      );
    case "no_occurrence":
      return (
        <div className={`${containerSize} flex items-center justify-center`}>
          <span className="text-zinc-200 dark:text-zinc-700 text-xs">·</span>
        </div>
      );
    default:
      return null;
  }
}

// Get human-readable status label
function getStatusLabel(status: InstanceStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "missed":
      return "Missed";
    case "skipped":
      return "Skipped";
    case "overdue":
      return "Overdue";
    case "paused":
      return "Paused";
    case "today":
      return "Due today";
    case "pending":
      return "Future";
    case "no_occurrence":
      return "No occurrence";
    default:
      return "Unknown";
  }
}

// Check if retroactive actions can be taken on a date
function canTakeAction(instance: TaskInstance, today: string): boolean {
  // Can only take action on missed, overdue, or today instances
  if (
    instance.status !== "missed" &&
    instance.status !== "overdue" &&
    instance.status !== "today"
  ) {
    return false;
  }

  // Can't act on future dates
  if (instance.date > today) {
    return false;
  }

  return true;
}
