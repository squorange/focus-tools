/**
 * Design System Foundations
 *
 * Central export for all foundation tokens.
 * Import from here for consistent access to the design system.
 *
 * @example
 * import { colors, spacing, typography } from '@focus-tools/design-system/foundations';
 */

// ============================================================================
// Primitives (raw values - avoid direct use in components)
// ============================================================================
export * from './primitives';

// ============================================================================
// Colors
// ============================================================================
export {
  bg,
  fg,
  border,
  colors,
  colorValues,
  type BgColors,
  type FgColors,
  type BorderColors,
  type Colors,
  type StatusName,
} from './colors';

// ============================================================================
// Spacing
// ============================================================================
export {
  space,
  spacePx,
  spaceBetween,
  spaceAround,
  spacing,
  borderRadius,
  borderRadiusPx,
  type SpaceKey,
  type SpaceBetweenKey,
  type SpaceAroundKey,
  type BorderRadiusKey,
  type Spacing,
} from './spacing';

// ============================================================================
// Typography
// ============================================================================
export {
  fontFamily,
  fontSize,
  fontSizePx,
  fontWeight,
  lineHeight,
  letterSpacing,
  typography,
  type FontFamily,
  type FontSize,
  type FontWeight,
  type LineHeight,
  type LetterSpacing,
  type Typography,
} from './typography';

// ============================================================================
// Text Styles
// ============================================================================
export {
  display,
  heading,
  title,
  body,
  label,
  eyebrow,
  textStyles,
  type TextStyleDefinition,
  type TextStyles,
} from './textStyles';

// ============================================================================
// Motion
// ============================================================================
export {
  duration,
  durationSeconds,
  easing,
  easingArray,
  transitions,
  spring,
  springDefault,
  springSnappy,
  springGentle,
  springReduced,
  heightTransition,
  animationTimings,
  loadingAnimation,
  motion,
  getSpringConfig,
  getWhileTap,
  getTransition,
  type DurationKey,
  type EasingKey,
  type SpringKey,
  type TransitionSpeed,
} from './motion';

// ============================================================================
// Elevation & Shadows
// ============================================================================
export {
  elevation,
  elevationStyles,
  type ElevationLevel,
  type ElevationStyle,
} from './elevation';

export {
  shadows,
  shadowsDark,
  focusShadows,
  type ShadowLevel,
  type FocusShadowType,
} from './shadows';

// ============================================================================
// Layers (z-index)
// ============================================================================
export {
  zIndex,
  type ZIndexLevel,
} from './layers';

// ============================================================================
// Glass Effects
// ============================================================================
export {
  glass,
  glassDark,
  GLASS_BUTTON_HEIGHT,
  GLASS_BUTTON_RADIUS,
  getGlassStyle,
  getGlassCSS,
  getGlassInteractive,
  type GlassVariant,
  type GlassStyle,
  type Glass,
  type GlassDark,
} from './glass';

// ============================================================================
// Layout
// ============================================================================
export {
  breakpoints,
  media,
  widths,
  heights,
  layout,
  LAYOUT,
  type BreakpointKey,
  type DeviceType,
  type Layout,
} from './layout';
