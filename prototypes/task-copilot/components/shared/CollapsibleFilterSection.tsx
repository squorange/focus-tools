"use client";

import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleFilterSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  /** Number of active filters in this section (shown as badge when collapsed) */
  activeCount?: number;
  children: ReactNode;
}

/**
 * Collapsible section for filter drawer.
 * Shows title with chevron, active count badge when collapsed.
 */
export default function CollapsibleFilterSection({
  title,
  expanded,
  onToggle,
  activeCount = 0,
  children,
}: CollapsibleFilterSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 group"
      >
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {!expanded && activeCount > 0 && (
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {expanded && (
        <div className="pb-2">
          {children}
        </div>
      )}
    </div>
  );
}
