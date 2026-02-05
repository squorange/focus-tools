/**
 * Shadow Foundations
 *
 * CSS box-shadow values for web components.
 * Corresponds to elevation levels.
 */

import { bg } from './colors';

// ============================================================================
// Box Shadows (CSS)
// ============================================================================
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

/**
 * Focus ring shadows
 */
export const focusShadows = {
  default: `0 0 0 3px ${bg.accent.subtle}`,
  error: `0 0 0 3px ${bg.alert.subtle}`,
  success: `0 0 0 3px ${bg.positive.subtle}`,
} as const;

/**
 * Dark mode shadows (stronger for visibility)
 */
export const shadowsDark = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.15)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.25), 0 1px 2px -1px rgb(0 0 0 / 0.25)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.25), 0 2px 4px -2px rgb(0 0 0 / 0.25)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.35), 0 8px 10px -6px rgb(0 0 0 / 0.35)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.15)',
} as const;

// ============================================================================
// Type Exports
// ============================================================================
export type ShadowLevel = keyof typeof shadows;
export type FocusShadowType = keyof typeof focusShadows;
