/**
 * Centralized Color Maps
 *
 * Single source of truth for data-to-color mappings.
 * All values use semantic token Tailwind classes.
 * Dark mode handled automatically via CSS variables.
 *
 * Usage:
 *   import { PRIORITY_COLORS, ENERGY_COLORS } from '@/lib/color-maps';
 *   <span className={PRIORITY_COLORS.critical.text}>Critical</span>
 */

import type { PriorityTier, EnergyLevel, TaskStatus } from './types';
import type { NotificationType } from './notification-types';

// ============================================================================
// Priority Tier Colors
// Used by: PriorityDisplay, PriorityBreakdownDrawer, TaskRow
// ============================================================================

export interface PriorityColorSet {
  /** Background for pill/badge */
  bg: string;
  /** Text/icon color */
  text: string;
  /** Dot indicator color (solid) */
  dot: string;
  /** Label for display */
  label: string;
}

export const PRIORITY_COLORS: Record<PriorityTier, PriorityColorSet> = {
  critical: {
    bg: 'bg-bg-priority-critical-subtle',
    text: 'text-fg-priority-critical',
    dot: 'bg-bg-alert-high',
    label: 'Critical',
  },
  high: {
    bg: 'bg-bg-priority-high-subtle',
    text: 'text-fg-priority-high',
    dot: 'bg-bg-attention-high-accented',
    label: 'High',
  },
  medium: {
    bg: 'bg-bg-priority-medium-subtle',
    text: 'text-fg-priority-medium',
    dot: 'bg-bg-attention-high',
    label: 'Medium',
  },
  low: {
    bg: 'bg-bg-priority-low-subtle',
    text: 'text-fg-priority-low',
    dot: 'bg-bg-neutral-medium',
    label: 'Low',
  },
};

// ============================================================================
// Energy Level Colors
// Used by: EnergySelector
// ============================================================================

export interface EnergyColorSet {
  /** Icon color when not active */
  icon: string;
  /** Background when active */
  bg: string;
  /** Text when active */
  text: string;
  /** Border when active */
  border: string;
  /** Label for display */
  label: string;
}

export const ENERGY_COLORS: Record<EnergyLevel, EnergyColorSet> = {
  high: {
    icon: 'text-fg-attention-primary',
    bg: 'bg-bg-attention-subtle',
    text: 'text-fg-attention-primary',
    border: 'border-border-attention',
    label: 'High',
  },
  medium: {
    icon: 'text-fg-positive-primary',
    bg: 'bg-bg-positive-subtle',
    text: 'text-fg-positive-primary',
    border: 'border-border-positive',
    label: 'Medium',
  },
  low: {
    icon: 'text-fg-information-primary',
    bg: 'bg-bg-information-subtle',
    text: 'text-fg-information-primary',
    border: 'border-border-info',
    label: 'Low',
  },
};

// ============================================================================
// Status Badge Colors
// Used by: Sidebar, Pill, various status indicators
// ============================================================================

export interface StatusColorSet {
  /** Background color */
  bg: string;
  /** Text color */
  text: string;
  /** Label for display */
  label: string;
}

export const STATUS_BADGE_COLORS: Record<TaskStatus, StatusColorSet> = {
  inbox: {
    bg: 'bg-bg-status-inbox-subtle',
    text: 'text-fg-status-inbox',
    label: 'Inbox',
  },
  pool: {
    bg: 'bg-bg-status-ready-subtle',
    text: 'text-fg-status-ready',
    label: 'Pool',
  },
  complete: {
    bg: 'bg-bg-status-completed-subtle',
    text: 'text-fg-status-completed',
    label: 'Complete',
  },
  archived: {
    bg: 'bg-bg-status-archived-subtle',
    text: 'text-fg-status-archived',
    label: 'Archived',
  },
};

// ============================================================================
// Notification Type Colors
// Used by: NotificationCard
// ============================================================================

export interface NotificationColorSet {
  /** Icon color */
  icon: string;
}

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, NotificationColorSet> = {
  start_poke: {
    icon: 'text-fg-accent-primary',
  },
  streak: {
    icon: 'text-fg-attention-primary',
  },
  reminder: {
    icon: 'text-fg-neutral-secondary',
  },
  system: {
    icon: 'text-fg-neutral-secondary',
  },
  runway_nudge: {
    icon: 'text-fg-alert-primary',
  },
};

// ============================================================================
// Suggestion Type Colors (AI Staging Area)
// Used by: StagingArea
// ============================================================================

export type SuggestionType = 'TITLE' | 'EDIT' | 'DELETE' | 'SET' | 'NEW';

export interface SuggestionColorSet {
  /** Pill variant or background */
  bg: string;
  /** Text color */
  text: string;
  /** Label for display */
  label: string;
}

export const SUGGESTION_TYPE_COLORS: Record<SuggestionType, SuggestionColorSet> = {
  TITLE: {
    bg: 'bg-bg-accent-subtle',
    text: 'text-fg-accent-primary',
    label: 'Title',
  },
  EDIT: {
    bg: 'bg-bg-information-subtle',
    text: 'text-fg-information-primary',
    label: 'Edit',
  },
  DELETE: {
    bg: 'bg-bg-alert-subtle',
    text: 'text-fg-alert-primary',
    label: 'Delete',
  },
  SET: {
    bg: 'bg-bg-attention-subtle',
    text: 'text-fg-attention-primary',
    label: 'Set',
  },
  NEW: {
    bg: 'bg-bg-positive-subtle',
    text: 'text-fg-positive-primary',
    label: 'New',
  },
};

// ============================================================================
// Helper: Get priority color with fallback
// ============================================================================

export function getPriorityColors(tier: PriorityTier | null | undefined): PriorityColorSet {
  if (!tier || !(tier in PRIORITY_COLORS)) {
    return {
      bg: 'bg-bg-neutral-subtle',
      text: 'text-fg-neutral-soft',
      dot: 'bg-bg-neutral-low',
      label: '—',
    };
  }
  return PRIORITY_COLORS[tier];
}

// ============================================================================
// Helper: Get energy color with fallback
// ============================================================================

export function getEnergyColors(level: EnergyLevel | null | undefined): EnergyColorSet | null {
  if (!level || !(level in ENERGY_COLORS)) {
    return null;
  }
  return ENERGY_COLORS[level];
}

// ============================================================================
// Helper: Get status color with fallback
// ============================================================================

export function getStatusColors(status: TaskStatus | null | undefined): StatusColorSet {
  if (!status || !(status in STATUS_BADGE_COLORS)) {
    return {
      bg: 'bg-bg-neutral-subtle',
      text: 'text-fg-neutral-soft',
      label: '—',
    };
  }
  return STATUS_BADGE_COLORS[status];
}
