"use client";

import React from "react";
import { Zap, Battery, BatteryLow } from "lucide-react";
import { EnergyLevel } from "@/lib/types";

interface EnergySelectorProps {
  value: EnergyLevel | null;
  onChange: (energy: EnergyLevel | null) => void;
  /** Compact mode for inline display */
  compact?: boolean;
}

/**
 * Energy Selector - Quick toggle for user's current energy level
 *
 * Three states:
 * - High (⚡): User has high energy, show draining tasks
 * - Medium (🔋): Balanced, no energy filtering
 * - Low (🪫): User has low energy, show energizing tasks
 *
 * Tap selected to deselect (returns to null = no filtering)
 */
export default function EnergySelector({
  value,
  onChange,
  compact = false,
}: EnergySelectorProps) {
  const handleSelect = (energy: EnergyLevel) => {
    // Toggle off if already selected
    if (value === energy) {
      onChange(null);
    } else {
      onChange(energy);
    }
  };

  const levels: { value: EnergyLevel; icon: React.ReactNode; label: string; color: string; activeColor: string }[] = [
    {
      value: "high",
      icon: <Zap size={compact ? 14 : 16} />,
      label: "High",
      color: "text-amber-500 dark:text-amber-400",
      activeColor: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    },
    {
      value: "medium",
      icon: <Battery size={compact ? 14 : 16} />,
      label: "Medium",
      color: "text-green-500 dark:text-green-400",
      activeColor: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700",
    },
    {
      value: "low",
      icon: <BatteryLow size={compact ? 14 : 16} />,
      label: "Low",
      color: "text-blue-500 dark:text-blue-400",
      activeColor: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {!compact && (
        <span className="text-xs text-fg-neutral-secondary mr-1">
          Energy:
        </span>
      )}
      <div className="inline-flex items-center gap-1">
        {levels.map((level) => {
          const isActive = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => handleSelect(level.value)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-md border transition-colors
                ${
                  isActive
                    ? level.activeColor
                    : "border-border-color-neutral text-fg-neutral-secondary hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }
              `}
              title={`${level.label} energy${isActive ? " (click to clear)" : ""}`}
            >
              <span className={isActive ? "" : level.color}>{level.icon}</span>
              {!compact && (
                <span className="text-xs font-medium">{level.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Get human-readable label for current energy level
 */
export function getEnergyLevelLabel(energy: EnergyLevel | null): string {
  switch (energy) {
    case "high":
      return "High energy";
    case "medium":
      return "Medium energy";
    case "low":
      return "Low energy";
    default:
      return "Energy not set";
  }
}

/**
 * Get hint text for what tasks to show based on energy
 */
export function getEnergyFilterHint(energy: EnergyLevel | null): string {
  switch (energy) {
    case "high":
      return "Showing tasks good for high energy (draining tasks prioritized)";
    case "low":
      return "Showing tasks good for low energy (energizing tasks prioritized)";
    case "medium":
    default:
      return "Showing all tasks";
  }
}
