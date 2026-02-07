"use client";

import { Task, Project } from "@/lib/types";
import { getRoutineMetadataPills } from "@/lib/recurring-utils";
import { RecurrenceRuleExtended } from "@/lib/recurring-types";
import { ActionableCard, ProgressRing, Pill } from "@design-system/components";
import { Pause, Repeat, ChevronRight, Zap } from "lucide-react";

interface RoutineRowCardProps {
  task: Task;
  project: Project | null;
  onOpen: () => void;
  isPaused?: boolean;
}

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
      return formatTime(time);

    case "weekly":
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

// Map pill color to Pill variant
function getPillVariant(color: string) {
  switch (color) {
    case "green":
      return "success";
    case "amber":
      return "warning";
    case "red":
      return "error";
    case "blue":
      return "info";
    default:
      return undefined;
  }
}

export default function RoutineRowCard({ task, project, onOpen, isPaused }: RoutineRowCardProps) {
  const pills = getRoutineMetadataPills(task);
  const recurrence = task.recurrence as RecurrenceRuleExtended | null;

  // Calculate streak dynamically
  const { calculateStreak } = require("@/lib/recurring-utils");
  const streak = calculateStreak(task);

  // Get descriptive label for recurrence
  const recurrenceLabel = getRecurrenceLabel(recurrence);

  // Get step progress
  const completedSteps = task.steps.filter((s) => s.completed).length;
  const totalSteps = task.steps.length;

  return (
    <ActionableCard
      appearance="default"
      onClick={onOpen}
      className={isPaused ? "opacity-60" : ""}
    >
      <ActionableCard.Leading>
        <ProgressRing
          completed={completedSteps}
          total={totalSteps}
          isComplete={false}
          variant="solid"
        />
      </ActionableCard.Leading>

      <ActionableCard.Body>
        <ActionableCard.Title>
          {task.title}
        </ActionableCard.Title>

        <ActionableCard.Meta>
          {/* Paused pill */}
          {isPaused && (
            <Pill variant="warning" icon={<Pause className="w-3 h-3" />}>
              Paused
            </Pill>
          )}

          {/* Recurrence pill with icon */}
          {recurrenceLabel && !isPaused && (
            <Pill icon={<Repeat className="w-3 h-3" />}>
              {recurrenceLabel}
            </Pill>
          )}

          {/* Other pills (streak, last completed, next due) */}
          {pills.map((pill, idx) => (
            <Pill key={idx} variant={getPillVariant(pill.color)}>
              {pill.icon && <span className="mr-1">{pill.icon}</span>}
              {pill.label}
            </Pill>
          ))}

          {/* Project pill */}
          {project && (
            <Pill colorDot={project.color || "#9ca3af"}>
              {project.name}
            </Pill>
          )}
        </ActionableCard.Meta>
      </ActionableCard.Body>

      <ActionableCard.Trailing>
        {/* Streak badge */}
        {streak > 0 && (
          <div className="flex items-center gap-0.5 text-xs font-medium text-fg-neutral-secondary">
            <Zap className="w-3.5 h-3.5" />
            <span>{streak}</span>
          </div>
        )}
        <ChevronRight className="w-4 h-4 text-zinc-400" />
      </ActionableCard.Trailing>
    </ActionableCard>
  );
}
