"use client";

import React, { useState, useMemo } from "react";
import { BarChart3, Info } from "lucide-react";
import { Task, EnergyLevel, PriorityTier } from "@/lib/types";
import {
  getTasksForPriorityQueue,
  groupTasksByTier,
  getTierColors,
  getPriorityTierLabel,
  PriorityQueueTask,
  filterTasksByEnergy,
  getEnergyMatchIndicator,
} from "@/lib/priority";
import MetadataPill from "@/components/shared/MetadataPill";
import { formatDate } from "@/lib/utils";

// Check if date is overdue (local helper matching QueueItem pattern)
function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
}

interface PriorityQueueModuleProps {
  tasks: Task[];
  userEnergy?: EnergyLevel | null;
  onTaskTap: (taskId: string) => void;
  /** Optional: limit how many tasks to show per tier (0 = no limit) */
  maxPerTier?: number;
  /** When true, filter tasks by energy match (hide mismatched tasks) */
  filterByEnergy?: boolean;
}

interface TierSectionProps {
  tier: PriorityTier;
  tasks: PriorityQueueTask[];
  onTaskTap: (taskId: string) => void;
  defaultExpanded?: boolean;
  maxTasks?: number;
  userEnergy?: EnergyLevel | null;
}

function TierSection({
  tier,
  tasks,
  onTaskTap,
  defaultExpanded = true,
  maxTasks = 0,
  userEnergy,
}: TierSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  const colors = getTierColors(tier);
  const tierLabel = getPriorityTierLabel(tier);

  // If maxTasks is set and we have more tasks, show limited unless showAll
  const displayTasks =
    maxTasks > 0 && tasks.length > maxTasks && !showAll
      ? tasks.slice(0, maxTasks)
      : tasks;
  const hasMore = maxTasks > 0 && tasks.length > maxTasks && !showAll;

  if (tasks.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Tier Header - matches TasksView section headers */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full py-2"
      >
        <h3 className="flex items-baseline gap-2 text-base font-medium text-fg-neutral-secondary">
          <span>{tierLabel}</span>
          <span className="text-sm font-normal text-fg-neutral-soft">
            {tasks.length}
          </span>
        </h3>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Task List */}
      {isExpanded && (
        <div className="space-y-2">
          {displayTasks.map((item) => (
            <PriorityTaskCard
              key={item.task.id}
              item={item}
              tier={tier}
              onTap={() => onTaskTap(item.task.id)}
              userEnergy={userEnergy}
            />
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-xs text-zinc-500 hover:text-fg-neutral-secondary py-1 pl-1"
            >
              Show {tasks.length - maxTasks} more...
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface PriorityTaskCardProps {
  item: PriorityQueueTask;
  tier: PriorityTier;
  onTap: () => void;
  userEnergy?: EnergyLevel | null;
}

// Tier badge colors matching MetadataPill patterns
function getTierBadgeColors(tier: PriorityTier): string {
  switch (tier) {
    case "critical":
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    case "high":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
    case "medium":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    case "low":
      return "bg-bg-neutral-subtle text-fg-neutral-secondary";
  }
}

function PriorityTaskCard({ item, tier, onTap, userEnergy }: PriorityTaskCardProps) {
  const { task, priorityInfo } = item;

  // Get step progress
  const completedSteps = task.steps.filter((s) => s.completed).length;
  const totalSteps = task.steps.length;
  const hasSteps = totalSteps > 0;

  // Get energy match indicator
  const energyIndicator = getEnergyMatchIndicator(task.energyType, userEnergy ?? null);
  const hasMetadata = hasSteps || task.deadlineDate || energyIndicator;

  return (
    <button
      type="button"
      onClick={onTap}
      className="group w-full text-left bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 sm:px-4 py-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-fg-neutral-primary truncate">
              {task.title}
            </span>
            {/* Priority score badge */}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${getTierBadgeColors(tier)}`}>
              {priorityInfo.score}
            </span>
          </div>

          {/* Meta row - using MetadataPill */}
          {hasMetadata && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {hasSteps && (
                <MetadataPill>
                  {completedSteps}/{totalSteps} steps
                </MetadataPill>
              )}
              {task.deadlineDate && (
                <MetadataPill variant={isOverdue(task.deadlineDate) ? "overdue" : "due"}>
                  Due {formatDate(task.deadlineDate)}
                </MetadataPill>
              )}
              {energyIndicator && (
                <MetadataPill variant={energyIndicator.type === 'match' ? 'healthy' : undefined}>
                  {energyIndicator.type === 'match' ? '⚡ Good fit' : ''}
                </MetadataPill>
              )}
            </div>
          )}
        </div>

        {/* Score breakdown hint */}
        <div className="flex-shrink-0">
          <Info
            size={14}
            className="text-zinc-400 hover:text-fg-neutral-secondary"
          />
        </div>
      </div>
    </button>
  );
}

/**
 * Priority Queue Module
 * Displays tasks grouped by priority tier (Critical, High, Medium, Low).
 * Designed to be integrated into the NotificationsHub or used standalone.
 */
export default function PriorityQueueModule({
  tasks,
  userEnergy = null,
  onTaskTap,
  maxPerTier = 5,
  filterByEnergy = false,
}: PriorityQueueModuleProps) {
  // Calculate priorities
  const priorityTasks = useMemo(
    () => getTasksForPriorityQueue(tasks, userEnergy),
    [tasks, userEnergy]
  );

  // Apply energy filtering if enabled
  const { visible: visibleTasks, hidden: hiddenTasks } = useMemo(
    () =>
      filterTasksByEnergy(
        priorityTasks,
        userEnergy,
        filterByEnergy ? 'hide_mismatched' : 'all'
      ),
    [priorityTasks, userEnergy, filterByEnergy]
  );

  // Group visible tasks by tier
  const groupedTasks = useMemo(
    () => groupTasksByTier(visibleTasks),
    [visibleTasks]
  );

  const totalTasks = visibleTasks.length;
  const filteredCount = hiddenTasks.length;

  if (totalTasks === 0) {
    return (
      <div className="py-8 text-center">
        <BarChart3 size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
        <p className="text-sm text-fg-neutral-secondary">
          {filteredCount > 0
            ? `No matching tasks (${filteredCount} hidden by energy filter)`
            : "No active tasks to prioritize"}
        </p>
        <p className="text-xs text-fg-neutral-soft mt-2 max-w-[200px] mx-auto">
          {filteredCount > 0
            ? "Adjust your energy filter or tap \"Show all\" to see hidden tasks"
            : "Tasks gain priority from deadlines, importance, and staleness"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Tier sections - show in order of priority */}
      <TierSection
        tier="critical"
        tasks={groupedTasks.critical}
        onTaskTap={onTaskTap}
        defaultExpanded={true}
        maxTasks={maxPerTier}
        userEnergy={userEnergy}
      />
      <TierSection
        tier="high"
        tasks={groupedTasks.high}
        onTaskTap={onTaskTap}
        defaultExpanded={true}
        maxTasks={maxPerTier}
        userEnergy={userEnergy}
      />
      <TierSection
        tier="medium"
        tasks={groupedTasks.medium}
        onTaskTap={onTaskTap}
        defaultExpanded={groupedTasks.critical.length === 0 && groupedTasks.high.length === 0}
        maxTasks={maxPerTier}
        userEnergy={userEnergy}
      />
      <TierSection
        tier="low"
        tasks={groupedTasks.low}
        onTaskTap={onTaskTap}
        defaultExpanded={false}
        maxTasks={maxPerTier}
        userEnergy={userEnergy}
      />
    </div>
  );
}
