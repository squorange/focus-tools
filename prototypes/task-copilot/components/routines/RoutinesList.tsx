"use client";

import React from "react";
import { Task, Project } from "@/lib/types";
import {
  filterRecurringTasks,
  filterByFrequency,
  filterActive,
  filterPaused,
  sortByTime,
} from "@/lib/recurring-utils";
import { RecurrenceRuleExtended } from "@/lib/recurring-types";
import RoutineRowCard from "./RoutineRowCard";
import { Repeat } from "lucide-react";

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

export default function RoutinesList({
  tasks,
  projects,
  onOpenTask,
}: RoutinesListProps) {
  const allRoutines = filterRecurringTasks(tasks);

  // Group ALL routines by frequency (including paused)
  const groupedRoutines = FREQUENCY_ORDER.reduce((acc, freq) => {
    const freqTasks = filterByFrequency(allRoutines, freq);
    if (freqTasks.length > 0) {
      // Sort active first, then paused; within each group sort by time
      const active = filterActive(freqTasks);
      const paused = filterPaused(freqTasks);
      acc[freq] = [...sortByTime(active), ...sortByTime(paused)];
    }
    return acc;
  }, {} as Record<string, Task[]>);

  // Empty state
  if (allRoutines.length === 0) {
    return (
      <div className="text-center py-12">
        <Repeat className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
        <h3 className="text-lg font-medium text-fg-neutral-secondary mb-2">
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
      {/* Routines - Grouped by Frequency (includes paused) */}
      {FREQUENCY_ORDER.map((freq) => {
        const freqTasks = groupedRoutines[freq];
        if (!freqTasks || freqTasks.length === 0) return null;

        return (
          <section key={freq}>
            <h2 className="flex items-baseline gap-2 text-base font-medium text-fg-neutral-secondary mb-3">
              <span>{FREQUENCY_LABELS[freq]}</span>
              <span className="text-sm font-normal text-fg-neutral-soft">
                {freqTasks.length}
              </span>
            </h2>
            <div className="space-y-2">
              {freqTasks.map((task) => {
                const isPaused = !!(task.recurrence as RecurrenceRuleExtended)?.pausedAt;
                return (
                  <RoutineRowCard
                    key={task.id}
                    task={task}
                    project={getProject(task)}
                    onOpen={() => onOpenTask(task.id, 'managing')}
                    isPaused={isPaused}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
