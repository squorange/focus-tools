'use client';

import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CollapsibleSectionProps {
  /** Section title displayed in the header */
  title: string;
  /** Whether the section is currently expanded */
  expanded: boolean;
  /** Callback when the header is clicked to toggle expansion */
  onToggle: () => void;
  /** Optional count badge shown when collapsed (e.g., active filters) */
  activeCount?: number;
  /** Content to display when expanded */
  children: ReactNode;
  /** Additional className for the container */
  className?: string;
}

/**
 * CollapsibleSection - A disclosure/accordion component with title, chevron, and optional badge.
 *
 * Shows a clickable header that toggles visibility of the children content.
 * When collapsed, can display an optional count badge (useful for showing active filters).
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CollapsibleSection
 *   title="Filters"
 *   expanded={isOpen}
 *   onToggle={() => setIsOpen(!isOpen)}
 * >
 *   <FilterContent />
 * </CollapsibleSection>
 *
 * // With active count badge
 * <CollapsibleSection
 *   title="Priority"
 *   expanded={isPriorityOpen}
 *   onToggle={() => setIsPriorityOpen(!isPriorityOpen)}
 *   activeCount={2}
 * >
 *   <PriorityFilters />
 * </CollapsibleSection>
 * ```
 */
export function CollapsibleSection({
  title,
  expanded,
  onToggle,
  activeCount = 0,
  children,
  className = '',
}: CollapsibleSectionProps) {
  return (
    <div className={className}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 group"
        aria-expanded={expanded}
      >
        <span className="text-sm font-medium text-fg-neutral-primary">{title}</span>
        <div className="flex items-center gap-2">
          {!expanded && activeCount > 0 && (
            <span className="text-xs font-medium text-fg-accent-primary bg-bg-accent-subtle px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-fg-neutral-soft transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {expanded && <div className="pb-2">{children}</div>}
    </div>
  );
}

export default CollapsibleSection;
