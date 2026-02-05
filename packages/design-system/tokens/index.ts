/**
 * Design System Tokens
 *
 * @deprecated This module is deprecated. Use foundations/ instead.
 * Import from '@focus-tools/design-system/foundations' for the new structure.
 *
 * Re-exports all token modules for backward compatibility.
 *
 * Usage:
 *   // Legacy (deprecated)
 *   import { SPRING_CONFIG, STATUS_COLORS, BREAKPOINTS } from '@focus-tools/design-system/tokens';
 *
 *   // New (recommended)
 *   import { spring, colors, breakpoints } from '@focus-tools/design-system/foundations';
 */

// ============================================
// NEW: Re-export foundations for migration convenience
// ============================================
export * from '../foundations';

// ============================================
// LEGACY: Colors (backward compatibility)
// @deprecated Use foundations/colors.ts
// ============================================
export {
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
} from './colors';

// ============================================
// LEGACY: Spacing (backward compatibility)
// @deprecated Use foundations/spacing.ts
// ============================================
export {
  SPACING,
  SPACING_PX,
  type SpacingKey,
} from './spacing';

// ============================================
// LEGACY: Typography (backward compatibility)
// @deprecated Use foundations/typography.ts
// ============================================
export {
  FONT_SIZES,
  FONT_SIZES_PX,
  LINE_HEIGHTS,
  FONT_WEIGHTS,
  FONT_FAMILY,
  type FontSize,
  type LineHeight,
  type FontWeight,
} from './typography';

// ============================================
// LEGACY: Animation (backward compatibility)
// @deprecated Use foundations/motion.ts
// ============================================
export {
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
  getSpringConfig,
  getWhileTap,
  getTransition,
  type SpringConfigKey,
  type DurationKey,
  type EasingKey,
} from './animation';

// ============================================
// LEGACY: Breakpoints (backward compatibility)
// @deprecated Use foundations/layout.ts
// ============================================
export {
  BREAKPOINTS,
  WIDTHS,
  HEIGHTS,
  MEDIA_MOBILE,
  MEDIA_TABLET_UP,
  MEDIA_DESKTOP_UP,
  MEDIA_REDUCED_MOTION,
  type BreakpointKey,
  type DeviceType,
} from './breakpoints';
