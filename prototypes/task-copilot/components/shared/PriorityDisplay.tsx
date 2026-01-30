"use client";

import React from "react";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import type { PriorityTier } from "../../lib/types";

interface PriorityDisplayProps {
  /** Priority tier to display */
  tier: PriorityTier | null;
  /** Optional score (0-100+) for tooltip/display */
  score?: number | null;
  /** Click handler to open breakdown modal (only for priority icon/label) */
  onPress?: () => void;
  /** Whether the chevron should point up (expanded) or down (collapsed) */
  chevronUp?: boolean;
  /** Show chevron - useful when this is part of a collapsible section */
  showChevron?: boolean;
  /** Click handler for chevron (expand/collapse) - if not provided, chevron is not interactive */
  onChevronPress?: () => void;
}

const tierConfig: Record<PriorityTier, { label: string; color: string }> = {
  critical: {
    label: "Critical",
    color: "text-red-600 dark:text-red-400",
  },
  high: {
    label: "High",
    color: "text-orange-600 dark:text-orange-400",
  },
  medium: {
    label: "Medium",
    color: "text-amber-600 dark:text-amber-400",
  },
  low: {
    label: "Low",
    color: "text-zinc-500 dark:text-zinc-400",
  },
};

/**
 * Priority display component showing tier label with icon.
 * Priority icon/label opens breakdown modal.
 * Chevron has separate tap target for expand/collapse.
 * Visually distinct from editable pills (no background, muted styling).
 */
export default function PriorityDisplay({
  tier,
  score,
  onPress,
  chevronUp = false,
  showChevron = true,
  onChevronPress,
}: PriorityDisplayProps) {
  const config = tier ? tierConfig[tier] : null;
  const displayLabel = config?.label ?? "—";
  const colorClass = config?.color ?? "text-zinc-400 dark:text-zinc-500";

  const handlePriorityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPress?.();
  };

  const handlePriorityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onPress?.();
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChevronPress?.();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Priority icon/label - opens modal */}
      <button
        type="button"
        onClick={handlePriorityClick}
        onKeyDown={handlePriorityKeyDown}
        className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        title={score != null ? `Score: ${score}` : "View priority breakdown"}
      >
        <BarChart3 className={`w-3.5 h-3.5 ${colorClass}`} />
        <span className={colorClass}>{displayLabel}</span>
      </button>

      {/* Chevron - separate tap target for expand/collapse */}
      {showChevron && (
        <button
          type="button"
          onClick={handleChevronClick}
          className="p-0.5 -m-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          aria-label={chevronUp ? "Collapse details" : "Expand details"}
        >
          {chevronUp ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}
