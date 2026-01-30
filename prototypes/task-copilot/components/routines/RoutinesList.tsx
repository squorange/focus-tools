"use client";

import React from "react";
import { Task, Project } from "@/lib/types";
import {
  filterRecurringTasks,
  filterByFrequency,
  filterActive,
  filterPaused,
  sortByTime,
  getRoutineMetadataPills,
  describePattern,
  calculateStreak,
} from "@/lib/recurring-utils";
import { RecurrenceRuleExtended } from "@/lib/recurring-types";
import MetadataPill from "@/components/shared/MetadataPill";
import ProgressRing from "@/components/shared/ProgressRing";
import { Pause, Repeat, ChevronRight, Zap } from "lucide-react";

interface RoutinesListProps {
  tasks: Task[];
  projects: Project[];
  onOpenTask: (taskId: string, mode?: 'executing' | 'managing') => void;
}

// Frequency group order and labels
const FREQUENCY_ORDER = ["daily", "weekly", "monthly", "yearly"] as const;
const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

// Day abbreviations for weekly pills
const DAY_ABBREV = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Format time from 24h to 12h
function formatTime(time: string | null | undefined): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return minutes === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

// Get descriptive recurrence label based on frequency
function getRecurrenceLabel(recurrence: RecurrenceRuleExtended | null): string | null {
  if (!recurrence) return null;

  const { frequency, time, daysOfWeek, dayOfMonth, weekOfMonth } = recurrence;

  switch (frequency) {
    case "daily":
      // Show time for daily tasks (since "Daily" is redundant with section)
      return formatTime(time);

    case "weekly":
      // Show days of week
      if (daysOfWeek && daysOfWeek.length > 0) {
        if (daysOfWeek.length === 7) return formatTime(time) || "Every day";
        if (daysOfWeek.length === 5 && !daysOfWeek.includes(0) && !daysOfWeek.includes(6)) {
          return formatTime(time) ? `Weekdays, ${formatTime(time)}` : "Weekdays";
        }
        const days = daysOfWeek.map(d => DAY_ABBREV[d]).join(", ");
        return formatTime(time) ? `${days}, ${formatTime(time)}` : days;
      }
      return formatTime(time);

    case "monthly":
      // Show day of month or week pattern
      if (dayOfMonth) {
        const suffix = dayOfMonth === 1 || dayOfMonth === 21 || dayOfMonth === 31 ? "st"
          : dayOfMonth === 2 || dayOfMonth === 22 ? "nd"
          : dayOfMonth === 3 || dayOfMonth === 23 ? "rd" : "th";
        return `${dayOfMonth}${suffix}`;
      }
      if (weekOfMonth && daysOfWeek?.length) {
        const weekNames = ["", "1st", "2nd", "3rd", "4th", "Last"];
        const dayName = DAY_ABBREV[daysOfWeek[0]];
        return `${weekNames[weekOfMonth]} ${dayName}`;
      }
      return formatTime(time);

    case "yearly":
      return formatTime(time);

    default:
      return null;
  }
}

export default function RoutinesList({
  tasks,
  projects,
  onOpenTask,
}: RoutinesListProps) {
  const allRoutines = filterRecurringTasks(tasks);
  const activeRoutines = filterActive(allRoutines);
  const pausedRoutines = filterPaused(allRoutines);

  // Group active routines by frequency
  const groupedActive = FREQUENCY_ORDER.reduce((acc, freq) => {
    const freqTasks = filterByFrequency(activeRoutines, freq);
    if (freqTasks.length > 0) {
      acc[freq] = sortByTime(freqTasks);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  // Empty state
  if (allRoutines.length === 0) {
    return (
      <div className="text-center py-12">
        <Repeat className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
        <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          No routines yet
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 max-w-xs mx-auto">
          Create a routine by opening a task and toggling "Recurring" in the details section.
        </p>
      </div>
    );
  }

  const getProject = (task: Task) => {
    if (!task.projectId) return null;
    return projects.find((p) => p.id === task.projectId) ?? null;
  };

  return (
    <div className="space-y-6">
      {/* Active Routines - Grouped by Frequency */}
      {FREQUENCY_ORDER.map((freq) => {
        const freqTasks = groupedActive[freq];
        if (!freqTasks || freqTasks.length === 0) return null;

        return (
          <section key={freq}>
            <h2 className="flex items-baseline gap-2 text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">
              <span>{FREQUENCY_LABELS[freq]}</span>
              <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
                {freqTasks.length}
              </span>
            </h2>
            <div className="space-y-2">
              {freqTasks.map((task) => (
                <RoutineRow
                  key={task.id}
                  task={task}
                  project={getProject(task)}
                  onOpen={() => onOpenTask(task.id, 'managing')}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Paused Routines */}
      {pausedRoutines.length > 0 && (
        <section>
          <h2 className="flex items-baseline gap-2 text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">
            <span>Paused</span>
            <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
              {pausedRoutines.length}
            </span>
          </h2>
          <div className="space-y-2">
            {pausedRoutines.map((task) => (
              <RoutineRow
                key={task.id}
                task={task}
                project={getProject(task)}
                onOpen={() => onOpenTask(task.id, 'managing')}
                isPaused
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Individual routine row component
interface RoutineRowProps {
  task: Task;
  project: Project | null;
  onOpen: () => void;
  isPaused?: boolean;
}

function RoutineRow({ task, project, onOpen, isPaused }: RoutineRowProps) {
  const pills = getRoutineMetadataPills(task);
  const recurrence = task.recurrence as RecurrenceRuleExtended | null;
  // Calculate streak dynamically at display time (not cached)
  const streak = calculateStreak(task);

  // Get descriptive label for recurrence (time, days, etc.)
  const recurrenceLabel = getRecurrenceLabel(recurrence);

  // Get step progress
  const completedSteps = task.steps.filter((s) => s.completed).length;
  const totalSteps = task.steps.length;

  return (
    <div
      onClick={onOpen}
      className={`
        group px-3 sm:px-4 py-3
        bg-zinc-50 dark:bg-zinc-800/80
        border rounded-lg cursor-pointer
        hover:border-zinc-300 dark:hover:border-zinc-600
        transition-colors
        ${isPaused
          ? "border-zinc-200 dark:border-zinc-700 opacity-60"
          : "border-zinc-200 dark:border-zinc-700"
        }
      `}
    >
      {/* Row 1: Ring + Title + Chevron */}
      <div className="flex items-start gap-2">
        {/* Progress ring - always show */}
        <div className="flex-shrink-0 mt-0.5">
          <ProgressRing
            completed={completedSteps}
            total={totalSteps}
            isComplete={false}
            variant="solid"
          />
        </div>

        {/* Title - line wrapping enabled */}
        <span className="flex-1 min-w-0 text-zinc-900 dark:text-zinc-100 break-words">
          {task.title}
        </span>

        {/* Streak + Chevron (upper right) */}
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          {streak > 0 && (
            <div className="flex items-center gap-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <Zap className="w-3.5 h-3.5" />
              <span>{streak}</span>
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </div>
      </div>

      {/* Row 2: Metadata pills */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap ml-5">
        {/* Recurrence pill with icon - show descriptive label (time/days) instead of redundant frequency */}
        {(recurrenceLabel || isPaused) && (
          <MetadataPill
            variant="default"
            icon={isPaused ? <Pause className="w-3 h-3" /> : <Repeat className="w-3 h-3" />}
          >
            {isPaused ? "Paused" : recurrenceLabel}
          </MetadataPill>
        )}

        {/* Other pills (streak, last completed, next due) */}
        {pills.map((pill, idx) => (
          <MetadataPill
            key={idx}
            variant={
              pill.color === "green"
                ? "healthy"
                : pill.color === "amber"
                ? "priority-medium"
                : pill.color === "red"
                ? "overdue"
                : pill.color === "blue"
                ? "due"
                : "default"
            }
          >
            {pill.icon && <span className="mr-1">{pill.icon}</span>}
            {pill.label}
          </MetadataPill>
        ))}

        {/* Project pill */}
        {project && (
          <MetadataPill variant="project" color={project.color || "#9ca3af"}>
            {project.name}
          </MetadataPill>
        )}
      </div>
    </div>
  );
}
