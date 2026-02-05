/**
 * Semantic Text Styles
 *
 * Pre-composed text style definitions for consistent typography.
 * Categories: display, heading, title, body, label, eyebrow
 *
 * Each style includes: fontSize, lineHeight, fontWeight, letterSpacing
 */

import { fontFamily, fontWeight as fw } from './typography';

// ============================================================================
// Text Style Definition Interface
// ============================================================================
export interface TextStyleDefinition {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  letterSpacing: number;
}

// Font family constant
const FONT_SANS = fontFamily.sans;

// Letter spacing values (in pixels)
const LS_TIGHTER = -1;   // display
const LS_TIGHT = -0.5;   // heading
const LS_NORMAL = 0;     // body, title
const LS_WIDE = 0.5;     // eyebrow, label caps

// Helper to create a text style definition
function ts(
  fontSize: number,
  lineHeight: number,
  fontWeight: number,
  letterSpacing: number = LS_NORMAL
): TextStyleDefinition {
  return { fontFamily: FONT_SANS, fontSize, lineHeight, fontWeight, letterSpacing };
}

// ============================================================================
// Display - Large hero/page-level text
// ============================================================================
export const display = {
  sm: {
    regular: ts(24, 32, fw.normal, LS_TIGHTER),
    medium: ts(24, 32, fw.medium, LS_TIGHTER),
    bold: ts(24, 32, fw.bold, LS_TIGHTER),
  },
  md: {
    regular: ts(28, 40, fw.normal, LS_TIGHTER),
    medium: ts(28, 40, fw.medium, LS_TIGHTER),
    bold: ts(28, 40, fw.bold, LS_TIGHTER),
  },
  lg: {
    regular: ts(32, 40, fw.normal, LS_TIGHTER),
    medium: ts(32, 40, fw.medium, LS_TIGHTER),
    bold: ts(32, 40, fw.bold, LS_TIGHTER),
  },
  xl: {
    regular: ts(40, 48, fw.normal, LS_TIGHTER),
    medium: ts(40, 48, fw.medium, LS_TIGHTER),
    bold: ts(40, 48, fw.bold, LS_TIGHTER),
  },
} as const;

// ============================================================================
// Heading - Section headings
// ============================================================================
export const heading = {
  xs: {
    medium: ts(12, 20, fw.medium, LS_TIGHT),
    bold: ts(12, 20, fw.bold, LS_TIGHT),
  },
  sm: {
    medium: ts(14, 20, fw.medium, LS_TIGHT),
    bold: ts(14, 20, fw.bold, LS_TIGHT),
  },
  md: {
    medium: ts(16, 24, fw.medium, LS_TIGHT),
    bold: ts(16, 24, fw.bold, LS_TIGHT),
  },
  lg: {
    medium: ts(18, 24, fw.medium, LS_TIGHT),
    bold: ts(18, 24, fw.bold, LS_TIGHT),
  },
  xl: {
    medium: ts(20, 28, fw.medium, LS_TIGHT),
    bold: ts(20, 28, fw.bold, LS_TIGHT),
  },
  '2xl': {
    medium: ts(24, 32, fw.medium, LS_TIGHT),
    bold: ts(24, 32, fw.bold, LS_TIGHT),
  },
  '3xl': {
    medium: ts(32, 40, fw.medium, LS_TIGHT),
    bold: ts(32, 40, fw.bold, LS_TIGHT),
  },
} as const;

// ============================================================================
// Title - Compact section labels
// ============================================================================
export const title = {
  sm: {
    medium: ts(14, 20, fw.medium, LS_NORMAL),
    bold: ts(14, 20, fw.bold, LS_NORMAL),
  },
  md: {
    medium: ts(16, 24, fw.medium, LS_NORMAL),
    bold: ts(16, 24, fw.bold, LS_NORMAL),
  },
  lg: {
    medium: ts(18, 24, fw.medium, LS_NORMAL),
    bold: ts(18, 24, fw.bold, LS_NORMAL),
  },
  xl: {
    medium: ts(20, 32, fw.medium, LS_NORMAL),
    bold: ts(20, 32, fw.bold, LS_NORMAL),
  },
} as const;

// ============================================================================
// Body - Running text
// ============================================================================
export const body = {
  xs: {
    regular: ts(12, 20, fw.normal, LS_NORMAL),
    medium: ts(12, 20, fw.medium, LS_NORMAL),
    bold: ts(12, 20, fw.bold, LS_NORMAL),
  },
  sm: {
    regular: ts(14, 20, fw.normal, LS_NORMAL),
    medium: ts(14, 20, fw.medium, LS_NORMAL),
    bold: ts(14, 20, fw.bold, LS_NORMAL),
  },
  md: {
    regular: ts(16, 24, fw.normal, LS_NORMAL),
    medium: ts(16, 24, fw.medium, LS_NORMAL),
    bold: ts(16, 24, fw.bold, LS_NORMAL),
  },
  lg: {
    regular: ts(18, 24, fw.normal, LS_NORMAL),
    medium: ts(18, 24, fw.medium, LS_NORMAL),
    bold: ts(18, 24, fw.bold, LS_NORMAL),
  },
} as const;

// ============================================================================
// Label - Form labels, captions, small interactive text
// ============================================================================
export const label = {
  '2xs': {
    regular: ts(10, 16, fw.normal, LS_NORMAL),
    medium: ts(10, 16, fw.medium, LS_NORMAL),
    semibold: ts(10, 16, fw.semibold, LS_NORMAL),
    bold: ts(10, 16, fw.bold, LS_NORMAL),
  },
  xs: {
    regular: ts(12, 20, fw.normal, LS_NORMAL),
    medium: ts(12, 20, fw.medium, LS_NORMAL),
    semibold: ts(12, 20, fw.semibold, LS_NORMAL),
    bold: ts(12, 20, fw.bold, LS_NORMAL),
  },
  sm: {
    regular: ts(14, 20, fw.normal, LS_NORMAL),
    medium: ts(14, 20, fw.medium, LS_NORMAL),
    semibold: ts(14, 20, fw.semibold, LS_NORMAL),
    bold: ts(14, 20, fw.bold, LS_NORMAL),
  },
  md: {
    regular: ts(16, 24, fw.normal, LS_NORMAL),
    medium: ts(16, 24, fw.medium, LS_NORMAL),
    semibold: ts(16, 24, fw.semibold, LS_NORMAL),
    bold: ts(16, 24, fw.bold, LS_NORMAL),
  },
  lg: {
    regular: ts(18, 24, fw.normal, LS_NORMAL),
    medium: ts(18, 24, fw.medium, LS_NORMAL),
    semibold: ts(18, 24, fw.semibold, LS_NORMAL),
    bold: ts(18, 24, fw.bold, LS_NORMAL),
  },
} as const;

// ============================================================================
// Eyebrow - Overline/category labels, typically uppercase
// ============================================================================
export const eyebrow = {
  sm: {
    medium: ts(12, 20, fw.medium, LS_WIDE),
    semibold: ts(12, 20, fw.semibold, LS_WIDE),
  },
  md: {
    medium: ts(14, 20, fw.medium, LS_WIDE),
    semibold: ts(14, 20, fw.semibold, LS_WIDE),
  },
} as const;

// ============================================================================
// Combined Export
// ============================================================================
export const textStyles = {
  display,
  heading,
  title,
  body,
  label,
  eyebrow,
} as const;

export type TextStyles = typeof textStyles;
