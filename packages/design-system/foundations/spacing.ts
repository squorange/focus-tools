/**
 * Spacing & Border Radius Foundations
 *
 * Hybrid approach: numeric scale for Tailwind compatibility,
 * semantic aliases for component APIs and documentation.
 */

// ============================================================================
// Numeric Scale (Tailwind-compatible)
// Primary usage in Tailwind classes: gap-4, p-2, etc.
// ============================================================================
export const space = {
  0: '0',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
} as const;

/**
 * Numeric spacing values in pixels (for JS calculations)
 */
export const spacePx = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

// ============================================================================
// Semantic Aliases (for component APIs and documentation)
// ============================================================================

/**
 * Space Between - gaps between elements
 *
 * - coupled: Very tight, e.g. icon + label (4px)
 * - repeating: Repeated items in a list (8px)
 * - related: Related content blocks (16px)
 * - separated: Distinct sections (24px)
 * - distant: Major separations (32px)
 */
export const spaceBetween = {
  none: space[0],
  coupled: space[1],      // 4px - icon + label
  repeatingSm: space[1.5], // 6px - tight list items
  repeating: space[2],    // 8px - list items
  relatedSm: space[2],    // 8px - related compact
  relatedCompact: space[3], // 12px - compact blocks
  related: space[4],      // 16px - related blocks
  relatedPlus: space[5],  // 20px - generous related
  separatedSm: space[6],  // 24px - smaller sections
  separated: space[8],    // 32px - distinct sections
  distant: space[10],     // 40px - major separations
} as const;

/**
 * Space Around - padding/margin around content
 *
 * - nudge: Micro adjustments (2-6px)
 * - tight: Compact padding (8px)
 * - compact: Snug but readable (12px)
 * - default: Standard padding (16px)
 * - spacious: Generous breathing room (24px)
 * - generous: Extra room (32px)
 */
export const spaceAround = {
  none: space[0],
  nudge2: space[0.5],     // 2px
  nudge4: space[1],       // 4px
  nudge6: space[1.5],     // 6px
  tight: space[2],        // 8px - compact padding
  tightPlus: space[2.5],  // 10px
  compact: space[3],      // 12px - snug but readable
  default: space[4],      // 16px - standard padding
  defaultPlus: space[5],  // 20px
  spacious: space[6],     // 24px - generous padding
  generous: space[8],     // 32px - extra room
} as const;

/**
 * Combined spacing object
 */
export const spacing = {
  between: spaceBetween,
  around: spaceAround,
} as const;

// ============================================================================
// Border Radius
// ============================================================================
export const borderRadius = {
  none: '0',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
} as const;

/**
 * Border radius values in pixels (for JS calculations)
 */
export const borderRadiusPx = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ============================================================================
// Type Exports
// ============================================================================
export type SpaceKey = keyof typeof space;
export type SpaceBetweenKey = keyof typeof spaceBetween;
export type SpaceAroundKey = keyof typeof spaceAround;
export type BorderRadiusKey = keyof typeof borderRadius;
export type Spacing = typeof spacing;
