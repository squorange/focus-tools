/**
 * Glass Effects Foundations
 *
 * Glassmorphic UI effect tokens for translucent, blurred backgrounds.
 * Use CSS custom properties in styles, TypeScript values for inline styles.
 */

import type { CSSProperties } from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

export type GlassVariant =
  | 'floating'
  | 'floatingPanel'
  | 'secondary'
  | 'secondaryHover'
  | 'ghost'
  | 'ghostHover'
  | 'button'
  | 'buttonHover'
  | 'buttonActive';

export interface GlassStyle {
  backgroundColor: string;
  backdropFilter?: string;
  WebkitBackdropFilter?: string; // Safari support
  border?: string;
  boxShadow?: string;
}

// ============================================================================
// Light Mode Glass Styles
// ============================================================================

export const glass = {
  /** Floating elements like tooltips, popovers */
  floating: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
  },

  /** Floating panels like modals, drawers */
  floatingPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  },

  /** Secondary surfaces like cards, sections */
  secondary: {
    backgroundColor: 'rgba(128, 128, 128, 0.08)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(0, 0, 0, 0.04)',
  },

  /** Secondary surface hover state */
  secondaryHover: {
    backgroundColor: 'rgba(128, 128, 128, 0.14)',
  },

  /** Ghost/minimal surfaces */
  ghost: {
    backgroundColor: 'rgba(128, 128, 128, 0.04)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },

  /** Ghost surface hover state */
  ghostHover: {
    backgroundColor: 'rgba(128, 128, 128, 0.10)',
  },

  /** Glass button default state */
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
  },

  /** Glass button hover state */
  buttonHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },

  /** Glass button active/pressed state */
  buttonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
} as const satisfies Record<GlassVariant, GlassStyle>;

// ============================================================================
// Dark Mode Glass Styles
// ============================================================================

export const glassDark = {
  floating: {
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },

  floatingPanel: {
    backgroundColor: 'rgba(24, 24, 27, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.32)',
  },

  secondary: {
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },

  secondaryHover: {
    backgroundColor: 'rgba(128, 128, 128, 0.20)',
  },

  ghost: {
    backgroundColor: 'rgba(128, 128, 128, 0.06)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },

  ghostHover: {
    backgroundColor: 'rgba(128, 128, 128, 0.14)',
  },

  button: {
    backgroundColor: 'rgba(39, 39, 42, 0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },

  buttonHover: {
    backgroundColor: 'rgba(39, 39, 42, 0.85)',
  },

  buttonActive: {
    backgroundColor: 'rgba(39, 39, 42, 0.92)',
  },
} as const satisfies Record<GlassVariant, GlassStyle>;

// ============================================================================
// Glass Constants
// ============================================================================

/** Standard glass button height (matches EHR) */
export const GLASS_BUTTON_HEIGHT = 44;

/** Standard glass button border radius (perfect circle for square buttons) */
export const GLASS_BUTTON_RADIUS = 22;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get glass style by variant, with optional dark mode support.
 *
 * @example
 * const style = getGlassStyle('floating');
 * const darkStyle = getGlassStyle('button', true);
 */
export function getGlassStyle(
  variant: GlassVariant,
  isDark = false
): GlassStyle {
  return isDark ? glassDark[variant] : glass[variant];
}

/**
 * Get glass styles as CSS properties (for React inline styles).
 *
 * @example
 * <div style={getGlassCSS('floatingPanel')} />
 */
export function getGlassCSS(
  variant: GlassVariant,
  isDark = false
): CSSProperties {
  return getGlassStyle(variant, isDark) as CSSProperties;
}

/**
 * Combine base glass style with hover state for interactive elements.
 *
 * @example
 * const { base, hover } = getGlassInteractive('secondary');
 * // Use base style by default, hover style on :hover
 */
export function getGlassInteractive(
  variant: 'secondary' | 'ghost' | 'button',
  isDark = false
): { base: GlassStyle; hover: GlassStyle } {
  const styles = isDark ? glassDark : glass;
  const hoverVariant = `${variant}Hover` as GlassVariant;

  return {
    base: styles[variant],
    hover: {
      ...styles[variant],
      ...styles[hoverVariant],
    },
  };
}

// ============================================================================
// Export Type
// ============================================================================

export type Glass = typeof glass;
export type GlassDark = typeof glassDark;
