/**
 * Typography Tokens
 */

// ============================================
// Font Sizes
// ============================================
export const FONT_SIZES = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
} as const;

export const FONT_SIZES_PX = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

// ============================================
// Line Heights
// ============================================
export const LINE_HEIGHTS = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// ============================================
// Font Weights
// ============================================
export const FONT_WEIGHTS = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// ============================================
// Font Stacks
// ============================================
export const FONT_FAMILY = {
  sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
} as const;

// Type exports
export type FontSize = keyof typeof FONT_SIZES;
export type LineHeight = keyof typeof LINE_HEIGHTS;
export type FontWeight = keyof typeof FONT_WEIGHTS;
