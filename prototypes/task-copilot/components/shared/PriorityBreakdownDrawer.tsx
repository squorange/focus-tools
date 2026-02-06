"use client";

import React, { useState, useMemo } from "react";
import { Info, BarChart3, X } from "lucide-react";
import DetailsPill from "./DetailsPill";
import { BottomSheet } from "@design-system/components";
import type { Task, EnergyLevel, PriorityTier } from "../../lib/types";
import {
  getTaskPriorityInfo,
  getBreakdownDescription,
  getImportanceLabel,
  getEnergyTypeLabel,
} from "../../lib/priority";

interface PriorityBreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Full task data for priority calculation */
  task: Task;
  /** Current user energy level (optional) */
  userEnergy?: EnergyLevel | null;
  /** Callback when user saves changes to inputs */
  onSave?: (changes: Record<string, unknown>) => void;
}

interface FactorRow {
  label: string;
  description: string;
  points: number;
}

const tierConfig: Record<PriorityTier, { label: string; bgColor: string; textColor: string }> = {
  critical: {
    label: "Critical",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-400",
  },
  high: {
    label: "High",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-400",
  },
  medium: {
    label: "Medium",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-400",
  },
  low: {
    label: "Low",
    bgColor: "bg-bg-neutral-subtle",
    textColor: "text-zinc-700 dark:text-zinc-400",
  },
};

const SCALE_INFO = [
  { range: "60+", tier: "Critical", meaning: "Act now" },
  { range: "40-59", tier: "High", meaning: "Act soon" },
  { range: "20-39", tier: "Medium", meaning: "On radar" },
  { range: "0-19", tier: "Low", meaning: "When you get to it" },
];

/**
 * Priority Breakdown Drawer
 * Shows how priority score is calculated from various factors.
 * Desktop: Side drawer from right
 * Mobile: Bottom sheet (70vh)
 */
export default function PriorityBreakdownDrawer({
  isOpen,
  onClose,
  task,
  userEnergy = null,
}: PriorityBreakdownDrawerProps) {
  const [showScaleInfo, setShowScaleInfo] = useState(false);

  // Calculate real priority info from task
  const priorityInfo = useMemo(
    () => getTaskPriorityInfo(task, userEnergy),
    [task, userEnergy]
  );

  // Get human-readable descriptions for each factor
  const descriptions = useMemo(
    () => getBreakdownDescription(task, userEnergy),
    [task, userEnergy]
  );

  // Build factors array from real breakdown
  const factors: FactorRow[] = useMemo(() => [
    { label: "Importance", description: descriptions.importance, points: priorityInfo.breakdown.importance },
    { label: "Deadline pressure", description: descriptions.timePressure, points: priorityInfo.breakdown.timePressure },
    { label: "Target pressure", description: descriptions.targetPressure, points: priorityInfo.breakdown.targetPressure },
    { label: "Source", description: descriptions.source, points: priorityInfo.breakdown.source },
    { label: "Staleness", description: descriptions.staleness, points: priorityInfo.breakdown.staleness },
    { label: "Defer count", description: descriptions.defer, points: priorityInfo.breakdown.defer },
    { label: "Streak risk", description: descriptions.streakRisk, points: priorityInfo.breakdown.streakRisk },
    { label: "Energy match", description: descriptions.energyMatch, points: priorityInfo.breakdown.energyMatch },
  ], [priorityInfo, descriptions]);

  // Generate prediction hint based on what would increase priority
  const predictionHint = useMemo(() => {
    const hints: string[] = [];

    // Check what's missing or could increase
    if (!task.importance) {
      hints.push("set importance");
    }
    if (!task.deadlineDate && !task.targetDate) {
      hints.push("add a target or deadline");
    } else if (!task.deadlineDate) {
      hints.push("add a deadline");
    }
    if (task.deferredCount === 0 && !task.deadlineDate && !task.importance) {
      // Generic hint if nothing is set
    }
    if (!task.energyType && userEnergy) {
      hints.push("set energy type");
    }
    if (task.deadlineDate && !task.leadTimeDays) {
      hints.push("add lead time");
    }

    if (hints.length === 0) {
      return "Priority is calculated based on current task attributes.";
    }

    return `Priority will increase when you ${hints.join(" or ")}.`;
  }, [task, userEnergy]);

  const tierStyle = tierConfig[priorityInfo.tier];
  const totalScore = priorityInfo.score;

  // Shared content renderer for both desktop and mobile
  const renderContent = () => (
    <>
      {/* Priority Badge */}
      <div className="flex justify-center">
        <div className={`px-6 py-4 rounded-xl ${tierStyle.bgColor} text-center`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <BarChart3 className={`w-5 h-5 ${tierStyle.textColor}`} />
            <span className={`text-lg font-semibold ${tierStyle.textColor}`}>
              {tierStyle.label}
            </span>
          </div>
          <button
            onClick={() => setShowScaleInfo(!showScaleInfo)}
            className="text-sm text-fg-neutral-secondary hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1 mx-auto"
          >
            Score: {totalScore}
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scale Info (expandable) */}
      {showScaleInfo && (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 text-xs space-y-1">
          <div className="font-medium text-fg-neutral-primary mb-2">
            Priority Scale
          </div>
          {SCALE_INFO.map((item) => (
            <div key={item.tier} className="flex justify-between text-fg-neutral-secondary">
              <span>
                <span className="font-mono">{item.range}</span> {item.tier}
              </span>
              <span className="text-zinc-500">{item.meaning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contributing Factors */}
      <div>
        <h3 className="text-sm font-medium text-fg-neutral-primary mb-2">
          Contributing factors
        </h3>
        <div className="space-y-2">
          {factors.map((factor) => (
            <div
              key={factor.label}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex-1 min-w-0">
                <span className="text-fg-neutral-primary">
                  {factor.label}
                </span>
                <span className="text-fg-neutral-soft ml-1">
                  ({factor.description})
                </span>
              </div>
              <span
                className={`font-mono text-xs ${
                  factor.points > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-fg-neutral-soft"
                }`}
              >
                {factor.points > 0 ? `+${factor.points}` : factor.points}
              </span>
            </div>
          ))}
          <div className="border-t border-border-color-neutral pt-2 flex justify-between font-medium text-sm">
            <span className="text-fg-neutral-primary">Total</span>
            <span className="text-fg-neutral-primary">
              {totalScore} → {tierStyle.label}
            </span>
          </div>
        </div>
      </div>

      {/* Prediction */}
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs px-3 py-2 rounded-lg flex items-start gap-2">
        <span>📈</span>
        <span>{predictionHint}</span>
      </div>

      {/* Adjust Inputs */}
      <div>
        <h3 className="text-sm font-medium text-fg-neutral-primary mb-2">
          Adjust inputs
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* TODO Phase 3: These will open actual edit modals */}
          <DetailsPill
            icon="⭐"
            label={task.importance ? getImportanceLabel(task.importance) : "Set importance"}
            variant={task.importance ? "filled" : "empty"}
            size="md"
            onPress={() => console.log("[Phase 3] Open importance picker")}
          />
          <DetailsPill
            icon="📅"
            label={task.targetDate ? `Target: ${task.targetDate}` : "Set target"}
            variant={task.targetDate ? "filled" : "empty"}
            size="md"
            onPress={() => console.log("[Phase 3] Open target date picker")}
          />
          <DetailsPill
            icon="⏳"
            label={task.leadTimeDays ? `${task.leadTimeDays}d lead time` : "Set lead time"}
            variant={task.leadTimeDays ? "filled" : "empty"}
            size="md"
            onPress={() => console.log("[Phase 3] Open lead time picker")}
          />
          <DetailsPill
            icon="🎯"
            label={task.deadlineDate ? `Due: ${task.deadlineDate}` : "No deadline"}
            variant={task.deadlineDate ? "filled" : "empty"}
            size="md"
            onPress={() => console.log("[Phase 3] Open deadline picker")}
          />
          <DetailsPill
            icon="⚡"
            label={task.energyType ? getEnergyTypeLabel(task.energyType) : "Set energy type"}
            variant={task.energyType ? "filled" : "empty"}
            size="md"
            onPress={() => console.log("[Phase 3] Open energy type picker")}
          />
        </div>
        <p className="text-xs text-fg-neutral-soft mt-2 italic">
          Input editing coming in Phase 3
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: Side drawer from right */}
      <div
        className={`
          hidden lg:flex lg:flex-col lg:flex-shrink-0 lg:border-l lg:border-zinc-200/50 lg:dark:border-zinc-700/30 lg:bg-white lg:dark:bg-zinc-900
          transition-all duration-300 ease-in-out overflow-hidden fixed right-0 top-0 bottom-0 z-40
          ${isOpen ? "lg:w-[400px]" : "lg:w-0 lg:border-l-0"}
        `}
      >
        <div
          className={`w-[400px] flex flex-col h-full transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Header - matches main navbar (no bottom border) */}
          <div className="h-14 flex items-center justify-between px-2 flex-shrink-0">
            <div className="px-2">
              <h2 className="text-base font-medium text-fg-neutral-primary">
                Priority Breakdown
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Desktop backdrop */}
      <div
        className={`hidden lg:block fixed inset-0 z-30 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Mobile: Bottom sheet */}
      <div className="lg:hidden">
        <BottomSheet isOpen={isOpen} onClose={onClose} height="70vh">
          {/* Mobile header - matches main navbar (no bottom border) */}
          <div className="h-14 flex items-center justify-between px-2 flex-shrink-0">
            <div className="px-2">
              <h2 className="text-base font-medium text-fg-neutral-primary">
                Priority Breakdown
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

          {/* Mobile content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
            {renderContent()}
          </div>
        </BottomSheet>
      </div>
    </>
  );
}
