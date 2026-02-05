/**
 * Color Tokens - TypeScript exports for programmatic use
 *
 * @deprecated This module is deprecated. Use foundations/colors.ts instead.
 * Import from '@focus-tools/design-system/foundations' for the new bg/fg/border structure.
 *
 * Migration:
 *   OLD: import { STATUS_COLORS } from '@focus-tools/design-system/tokens';
 *   NEW: import { bg, fg, colors } from '@focus-tools/design-system/foundations';
 *
 * These values remain for backward compatibility during the migration period.
 */

// Re-export primitives from foundations for backward compatibility
export {
  zinc as ZINC,
  violet as VIOLET,
  green as GREEN,
  red as RED,
  amber as AMBER,
  orange as ORANGE,
  blue as BLUE,
  indigo as INDIGO,
} from '../foundations/primitives';

// ============================================
// Semantic Colors
// @deprecated Use foundations/colors.ts instead
// ============================================
import { violet, green, red, amber, blue } from '../foundations/primitives';

/**
 * @deprecated Use `bg.accent` and `fg.accent` from foundations/colors.ts
 */
export const SEMANTIC_COLORS = {
  primary: violet[600],
  primaryHover: violet[700],
  success: green[500],
  error: red[500],
  warning: amber[500],
  info: blue[500],
} as const;

// ============================================
// Status Colors - Task Status
// @deprecated Use bg.status and fg.status from foundations/colors.ts
// ============================================
import { orange, indigo, zinc } from '../foundations/primitives';

/**
 * @deprecated Use `bg.status` and `fg.status` from foundations/colors.ts
 *
 * Migration example:
 *   OLD: STATUS_COLORS.completed.bgClass
 *   NEW: className="bg-bg-status-completed-subtle text-fg-status-completed"
 */
export const STATUS_COLORS = {
  completed: {
    color: green[600],
    /** @deprecated Use className="bg-bg-status-completed-subtle" */
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    /** @deprecated Use className="text-fg-status-completed" */
    textClass: 'text-green-700 dark:text-green-300',
  },
  today: {
    color: violet[500],
    /** @deprecated Use className="bg-bg-status-today-subtle" */
    bgClass: 'bg-violet-100 dark:bg-violet-900/30',
    /** @deprecated Use className="text-fg-status-today" */
    textClass: 'text-violet-700 dark:text-violet-300',
  },
  focus: {
    color: violet[700],
    /** @deprecated Use className="bg-bg-status-focus-subtle" */
    bgClass: 'bg-violet-50 dark:bg-violet-950/30',
    /** @deprecated Use className="text-fg-status-focus" */
    textClass: 'text-violet-600 dark:text-violet-400',
  },
  waiting: {
    color: orange[500],
    /** @deprecated Use className="bg-bg-status-waiting-subtle" */
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    /** @deprecated Use className="text-fg-status-waiting" */
    textClass: 'text-orange-700 dark:text-orange-300',
  },
  deferred: {
    color: indigo[500],
    /** @deprecated Use className="bg-bg-status-deferred-subtle" */
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
    /** @deprecated Use className="text-fg-status-deferred" */
    textClass: 'text-indigo-700 dark:text-indigo-300',
  },
  ready: {
    color: blue[600],
    /** @deprecated Use className="bg-bg-status-ready-subtle" */
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    /** @deprecated Use className="text-fg-status-ready" */
    textClass: 'text-blue-700 dark:text-blue-300',
  },
  inbox: {
    color: amber[600],
    /** @deprecated Use className="bg-bg-status-inbox-subtle" */
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    /** @deprecated Use className="text-fg-status-inbox" */
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  archived: {
    color: zinc[500],
    /** @deprecated Use className="bg-bg-status-archived-subtle" */
    bgClass: 'bg-zinc-100 dark:bg-zinc-800',
    /** @deprecated Use className="text-fg-status-archived" */
    textClass: 'text-zinc-600 dark:text-zinc-400',
  },
} as const;

// ============================================
// Health Status Colors
// @deprecated Use bg.positive/attention/alert from foundations/colors.ts
// ============================================

/**
 * @deprecated Use `bg.positive`, `bg.attention`, `bg.alert` from foundations/colors.ts
 */
export const HEALTH_COLORS = {
  healthy: {
    color: green[600],
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300',
  },
  at_risk: {
    color: amber[500],
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  critical: {
    color: red[500],
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-300',
  },
} as const;

// ============================================
// Priority Colors
// @deprecated Use bg.alert/attention/positive from foundations/colors.ts
// ============================================

/**
 * @deprecated Use `bg.alert`, `bg.attention`, `bg.positive` from foundations/colors.ts
 */
export const PRIORITY_COLORS = {
  high: {
    color: red[500],
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
  },
  medium: {
    color: amber[500],
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
  },
  low: {
    color: green[500],
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
  },
} as const;

// Type exports
export type DisplayStatus = keyof typeof STATUS_COLORS;
export type HealthStatus = keyof typeof HEALTH_COLORS;
export type Priority = keyof typeof PRIORITY_COLORS;
