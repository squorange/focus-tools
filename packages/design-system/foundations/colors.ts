/**
 * Semantic Color Tokens
 *
 * Organized by role (bg, fg, border) following the ehr-prototype pattern.
 * Values reference CSS custom properties for automatic dark mode support.
 *
 * Usage in Tailwind: bg-bg-neutral-base, text-fg-neutral-primary, border-border-neutral-default
 */

import { zinc, violet, green, red, amber, orange, blue, indigo } from './primitives';

// ============================================================================
// Background Colors
// ============================================================================
export const bg = {
  neutral: {
    base: 'var(--color-bg-neutral-base)',
    min: 'var(--color-bg-neutral-min)',
    subtle: 'var(--color-bg-neutral-subtle)',
    low: 'var(--color-bg-neutral-low)',
    medium: 'var(--color-bg-neutral-medium)',
    inverse: 'var(--color-bg-neutral-inverse)',
  },
  transparent: {
    neutral: 'var(--color-bg-transparent-neutral)',
    accent: 'var(--color-bg-transparent-accent)',
  },
  input: {
    default: 'var(--color-bg-input-default)',
    focus: 'var(--color-bg-input-focus)',
    disabled: 'var(--color-bg-input-disabled)',
  },
  positive: {
    subtle: 'var(--color-bg-positive-subtle)',
    default: 'var(--color-bg-positive-default)',
    bold: 'var(--color-bg-positive-bold)',
  },
  attention: {
    subtle: 'var(--color-bg-attention-subtle)',
    default: 'var(--color-bg-attention-default)',
    bold: 'var(--color-bg-attention-bold)',
  },
  alert: {
    subtle: 'var(--color-bg-alert-subtle)',
    default: 'var(--color-bg-alert-default)',
    bold: 'var(--color-bg-alert-bold)',
  },
  accent: {
    subtle: 'var(--color-bg-accent-subtle)',
    default: 'var(--color-bg-accent-default)',
    bold: 'var(--color-bg-accent-bold)',
  },
  info: {
    subtle: 'var(--color-bg-info-subtle)',
    default: 'var(--color-bg-info-default)',
    bold: 'var(--color-bg-info-bold)',
  },
  status: {
    completed: {
      subtle: 'var(--color-bg-status-completed-subtle)',
      bold: 'var(--color-bg-status-completed-bold)',
    },
    today: {
      subtle: 'var(--color-bg-status-today-subtle)',
      bold: 'var(--color-bg-status-today-bold)',
    },
    focus: {
      subtle: 'var(--color-bg-status-focus-subtle)',
      bold: 'var(--color-bg-status-focus-bold)',
    },
    waiting: {
      subtle: 'var(--color-bg-status-waiting-subtle)',
      bold: 'var(--color-bg-status-waiting-bold)',
    },
    deferred: {
      subtle: 'var(--color-bg-status-deferred-subtle)',
      bold: 'var(--color-bg-status-deferred-bold)',
    },
    ready: {
      subtle: 'var(--color-bg-status-ready-subtle)',
      bold: 'var(--color-bg-status-ready-bold)',
    },
    inbox: {
      subtle: 'var(--color-bg-status-inbox-subtle)',
      bold: 'var(--color-bg-status-inbox-bold)',
    },
    archived: {
      subtle: 'var(--color-bg-status-archived-subtle)',
      bold: 'var(--color-bg-status-archived-bold)',
    },
  },
  priority: {
    critical: { subtle: 'var(--color-bg-priority-critical-subtle)' },
    high: { subtle: 'var(--color-bg-priority-high-subtle)' },
    medium: { subtle: 'var(--color-bg-priority-medium-subtle)' },
    low: { subtle: 'var(--color-bg-priority-low-subtle)' },
  },
  energy: {
    high: { subtle: 'var(--color-bg-energy-high-subtle)' },
    medium: { subtle: 'var(--color-bg-energy-medium-subtle)' },
    low: { subtle: 'var(--color-bg-energy-low-subtle)' },
  },
  overlay: {
    light: 'var(--color-bg-overlay-light)',
    medium: 'var(--color-bg-overlay-medium)',
    heavy: 'var(--color-bg-overlay-heavy)',
  },
} as const;

// ============================================================================
// Foreground (Text/Icon) Colors
// ============================================================================
export const fg = {
  neutral: {
    primary: 'var(--color-fg-neutral-primary)',
    secondary: 'var(--color-fg-neutral-secondary)',
    soft: 'var(--color-fg-neutral-soft)',
    disabled: 'var(--color-fg-neutral-disabled)',
    inverse: 'var(--color-fg-neutral-inverse)',
  },
  positive: {
    default: 'var(--color-fg-positive-default)',
    subtle: 'var(--color-fg-positive-subtle)',
  },
  attention: {
    default: 'var(--color-fg-attention-default)',
    subtle: 'var(--color-fg-attention-subtle)',
  },
  alert: {
    default: 'var(--color-fg-alert-default)',
    subtle: 'var(--color-fg-alert-subtle)',
  },
  accent: {
    default: 'var(--color-fg-accent-default)',
    subtle: 'var(--color-fg-accent-subtle)',
  },
  info: {
    default: 'var(--color-fg-info-default)',
    subtle: 'var(--color-fg-info-subtle)',
  },
  status: {
    completed: 'var(--color-fg-status-completed)',
    today: 'var(--color-fg-status-today)',
    focus: 'var(--color-fg-status-focus)',
    waiting: 'var(--color-fg-status-waiting)',
    deferred: 'var(--color-fg-status-deferred)',
    ready: 'var(--color-fg-status-ready)',
    inbox: 'var(--color-fg-status-inbox)',
    archived: 'var(--color-fg-status-archived)',
  },
  priority: {
    critical: 'var(--color-fg-priority-critical)',
    high: 'var(--color-fg-priority-high)',
    medium: 'var(--color-fg-priority-medium)',
    low: 'var(--color-fg-priority-low)',
  },
  energy: {
    high: 'var(--color-fg-energy-high)',
    medium: 'var(--color-fg-energy-medium)',
    low: 'var(--color-fg-energy-low)',
  },
} as const;

// ============================================================================
// Border Colors
// ============================================================================
export const border = {
  neutral: {
    default: 'var(--color-border-neutral-default)',
    subtle: 'var(--color-border-neutral-subtle)',
    strong: 'var(--color-border-neutral-strong)',
  },
  input: {
    default: 'var(--color-border-input-default)',
    focus: 'var(--color-border-input-focus)',
    error: 'var(--color-border-input-error)',
  },
  positive: 'var(--color-border-positive)',
  attention: 'var(--color-border-attention)',
  alert: 'var(--color-border-alert)',
  accent: 'var(--color-border-accent)',
  info: 'var(--color-border-info)',
} as const;

// ============================================================================
// Glass Effects
// ============================================================================
export const glass = {
  ai: {
    bg: 'var(--glass-ai-bg)',
    border: 'var(--glass-ai-border)',
    shadow: 'var(--glass-ai-shadow)',
    blur: 'var(--glass-ai-blur)',
    inputBg: 'var(--glass-ai-input-bg)',
    inputBorder: 'var(--glass-ai-input-border)',
    inputFocus: 'var(--glass-ai-input-focus)',
    fadeFrom: 'var(--glass-ai-fade-from)',
  },
} as const;

// ============================================================================
// Ring Colors (Focus)
// ============================================================================
export const ring = {
  focus: 'var(--color-ring-focus)',
} as const;

// ============================================================================
// Combined Colors Export
// ============================================================================
export const colors = {
  bg,
  fg,
  border,
  glass,
  ring,
} as const;

// ============================================================================
// Raw Color Values (for CSS generation)
// These are the actual color values before CSS variable transformation
// ============================================================================
export const colorValues = {
  light: {
    bg: {
      neutral: {
        base: zinc[50],
        min: '#ffffff',
        subtle: zinc[100],
        low: zinc[200],
        medium: zinc[300],
        inverse: zinc[900],
      },
      transparent: {
        neutral: 'rgba(0, 0, 0, 0.05)',
        accent: 'rgba(124, 58, 237, 0.1)',
      },
      input: {
        default: '#ffffff',
        focus: violet[50],
        disabled: zinc[100],
      },
      positive: {
        subtle: green[100],
        default: green[500],
        bold: green[600],
      },
      attention: {
        subtle: amber[100],
        default: amber[500],
        bold: amber[600],
      },
      alert: {
        subtle: red[100],
        default: red[500],
        bold: red[600],
      },
      accent: {
        subtle: violet[100],
        default: violet[500],
        bold: violet[600],
      },
      info: {
        subtle: blue[100],
        default: blue[500],
        bold: blue[600],
      },
      status: {
        completed: { subtle: green[100], bold: green[600] },
        today: { subtle: violet[100], bold: violet[500] },
        focus: { subtle: violet[50], bold: violet[700] },
        waiting: { subtle: orange[100], bold: orange[500] },
        deferred: { subtle: indigo[100], bold: indigo[500] },
        ready: { subtle: blue[100], bold: blue[600] },
        inbox: { subtle: amber[100], bold: amber[600] },
        archived: { subtle: zinc[100], bold: zinc[500] },
      },
    },
    fg: {
      neutral: {
        primary: zinc[900],
        secondary: zinc[600],
        soft: zinc[500],
        disabled: zinc[400],
        inverse: '#ffffff',
      },
      positive: {
        default: green[700],
        subtle: green[600],
      },
      attention: {
        default: amber[700],
        subtle: amber[600],
      },
      alert: {
        default: red[700],
        subtle: red[600],
      },
      accent: {
        default: violet[700],
        subtle: violet[600],
      },
      info: {
        default: blue[700],
        subtle: blue[600],
      },
      status: {
        completed: green[700],
        today: violet[700],
        focus: violet[600],
        waiting: orange[700],
        deferred: indigo[700],
        ready: blue[700],
        inbox: amber[700],
        archived: zinc[600],
      },
    },
    border: {
      neutral: {
        default: zinc[200],
        subtle: zinc[100],
        strong: zinc[300],
      },
      input: {
        default: zinc[300],
        focus: violet[500],
        error: red[500],
      },
      positive: green[500],
      attention: amber[500],
      alert: red[500],
      accent: violet[500],
      info: blue[500],
    },
  },
  dark: {
    bg: {
      neutral: {
        base: zinc[900],
        min: zinc[950],
        subtle: zinc[800],
        low: zinc[700],
        medium: zinc[600],
        inverse: zinc[100],
      },
      transparent: {
        neutral: 'rgba(255, 255, 255, 0.05)',
        accent: 'rgba(167, 139, 250, 0.15)',
      },
      input: {
        default: zinc[800],
        focus: 'rgba(109, 40, 217, 0.3)',
        disabled: zinc[700],
      },
      positive: {
        subtle: 'rgba(22, 163, 74, 0.3)',
        default: green[600],
        bold: green[500],
      },
      attention: {
        subtle: 'rgba(245, 158, 11, 0.3)',
        default: amber[500],
        bold: amber[400],
      },
      alert: {
        subtle: 'rgba(239, 68, 68, 0.3)',
        default: red[600],
        bold: red[500],
      },
      accent: {
        subtle: 'rgba(139, 92, 246, 0.3)',
        default: violet[500],
        bold: violet[400],
      },
      info: {
        subtle: 'rgba(59, 130, 246, 0.3)',
        default: blue[500],
        bold: blue[400],
      },
      status: {
        completed: { subtle: 'rgba(22, 163, 74, 0.3)', bold: green[500] },
        today: { subtle: 'rgba(139, 92, 246, 0.3)', bold: violet[400] },
        focus: { subtle: 'rgba(109, 40, 217, 0.3)', bold: violet[500] },
        waiting: { subtle: 'rgba(249, 115, 22, 0.3)', bold: orange[400] },
        deferred: { subtle: 'rgba(99, 102, 241, 0.3)', bold: indigo[400] },
        ready: { subtle: 'rgba(37, 99, 235, 0.3)', bold: blue[400] },
        inbox: { subtle: 'rgba(217, 119, 6, 0.3)', bold: amber[400] },
        archived: { subtle: zinc[800], bold: zinc[400] },
      },
    },
    fg: {
      neutral: {
        primary: zinc[100],
        secondary: zinc[400],
        soft: zinc[500],
        disabled: zinc[600],
        inverse: zinc[900],
      },
      positive: {
        default: green[400],
        subtle: green[300],
      },
      attention: {
        default: amber[400],
        subtle: amber[300],
      },
      alert: {
        default: red[400],
        subtle: red[300],
      },
      accent: {
        default: violet[400],
        subtle: violet[300],
      },
      info: {
        default: blue[400],
        subtle: blue[300],
      },
      status: {
        completed: green[300],
        today: violet[300],
        focus: violet[400],
        waiting: orange[300],
        deferred: indigo[300],
        ready: blue[300],
        inbox: amber[300],
        archived: zinc[400],
      },
    },
    border: {
      neutral: {
        default: zinc[700],
        subtle: zinc[800],
        strong: zinc[600],
      },
      input: {
        default: zinc[600],
        focus: violet[400],
        error: red[400],
      },
      positive: green[500],
      attention: amber[500],
      alert: red[500],
      accent: violet[400],
      info: blue[500],
    },
  },
} as const;

// ============================================================================
// Type Exports
// ============================================================================
export type BgColors = typeof bg;
export type FgColors = typeof fg;
export type BorderColors = typeof border;
export type GlassColors = typeof glass;
export type RingColors = typeof ring;
export type Colors = typeof colors;
export type StatusName = keyof typeof bg.status;
export type PriorityName = keyof typeof bg.priority;
export type EnergyName = keyof typeof bg.energy;
