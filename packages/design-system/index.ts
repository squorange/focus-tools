/**
 * Focus Tools Design System
 *
 * Main entry point for the design system package.
 *
 * @example
 * ```typescript
 * // Import components
 * import { Pill, ProgressRing, ResponsiveDrawer } from '@focus-tools/design-system';
 *
 * // Import foundations (recommended)
 * import { colors, spacing, typography } from '@focus-tools/design-system/foundations';
 *
 * // Import tokens (legacy - use foundations instead)
 * import { SPRING_CONFIG, STATUS_COLORS } from '@focus-tools/design-system/tokens';
 *
 * // Import hooks
 * import { useReducedMotion, useIsMobile } from '@focus-tools/design-system/hooks';
 *
 * // Import styles in your CSS/global styles
 * // @import "@focus-tools/design-system/styles";
 * ```
 */

// Re-export components
export * from './components';

// Re-export hooks
export * from './hooks';

// Re-export foundations (new structure - primary API)
export * from './foundations';

// Re-export legacy tokens explicitly (avoid conflicts with foundations)
export {
  // Legacy color exports
  ZINC,
  VIOLET,
  GREEN,
  RED,
  AMBER,
  ORANGE,
  BLUE,
  INDIGO,
  SEMANTIC_COLORS,
  STATUS_COLORS,
  HEALTH_COLORS,
  PRIORITY_COLORS,
  type DisplayStatus,
  type HealthStatus,
  type Priority,
  // Legacy spacing exports
  SPACING,
  SPACING_PX,
  type SpacingKey,
  // Legacy typography exports
  FONT_SIZES,
  FONT_SIZES_PX,
  LINE_HEIGHTS,
  FONT_WEIGHTS,
  FONT_FAMILY,
  // Legacy animation exports
  DURATIONS,
  EASINGS,
  EASING_ARRAYS,
  SPRING_DEFAULT,
  SPRING_SNAPPY,
  SPRING_GENTLE,
  SPRING_REDUCED,
  SPRING_CONFIG,
  HEIGHT_TRANSITION,
  ANIMATION_TIMINGS,
  LOADING_ANIMATION,
  type SpringConfigKey,
  // Legacy breakpoints exports
  BREAKPOINTS,
  WIDTHS,
  HEIGHTS,
  MEDIA_MOBILE,
  MEDIA_TABLET_UP,
  MEDIA_DESKTOP_UP,
  MEDIA_REDUCED_MOTION,
} from './tokens';
