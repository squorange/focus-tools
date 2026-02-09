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
      color: "text-fg-energy-high",
      activeColor: "bg-bg-energy-high-subtle text-fg-energy-high border-border-energy-high",
    },
    {
      value: "medium",
      icon: <Battery size={compact ? 14 : 16} />,
      label: "Medium",
      color: "text-fg-energy-medium",
      activeColor: "bg-bg-energy-medium-subtle text-fg-energy-medium border-border-energy-medium",
    },
    {
      value: "low",
      icon: <BatteryLow size={compact ? 14 : 16} />,
      label: "Low",
      color: "text-fg-energy-low",
      activeColor: "bg-bg-energy-low-subtle text-fg-energy-low border-border-energy-low",
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
                    : "border-border-color-neutral text-fg-neutral-secondary hover:border-border-color-neutral-hover hover:bg-bg-neutral-subtle"
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
