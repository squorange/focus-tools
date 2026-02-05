/**
 * Layout Foundations
 *
 * Breakpoints, widths, and heights for responsive design.
 */

// ============================================================================
// Breakpoints (pixels)
// ============================================================================
export const breakpoints = {
  /** Mobile phones (< 640px) */
  mobile: 640,
  /** Tablets (640px - 1023px) */
  tablet: 1024,
  /** Desktop (>= 1024px) */
  desktop: 1280,
  /** Wide desktop (>= 1280px) */
  wide: 1536,
} as const;

// ============================================================================
// Media Query Helpers
// ============================================================================
export const media = {
  /** Max-width for mobile */
  mobile: `(max-width: ${breakpoints.mobile - 1}px)`,
  /** Min-width for tablet and up */
  tabletUp: `(min-width: ${breakpoints.mobile}px)`,
  /** Min-width for desktop and up */
  desktopUp: `(min-width: ${breakpoints.tablet}px)`,
  /** Min-width for wide desktop */
  wideUp: `(min-width: ${breakpoints.desktop}px)`,
  /** Reduced motion preference */
  reducedMotion: '(prefers-reduced-motion: reduce)',
  /** Dark mode preference */
  darkMode: '(prefers-color-scheme: dark)',
} as const;

// ============================================================================
// Layout Widths (pixels)
// ============================================================================
export const widths = {
  /** Side drawer width */
  drawer: 400,
  /** MiniBar/command bar width */
  minibar: 400,
  /** Command palette width */
  palette: 400,
  /** Max content width */
  content: 768,
  /** Max container width */
  container: 1280,
} as const;

// ============================================================================
// Layout Heights (pixels)
// ============================================================================
export const heights = {
  /** Header height */
  header: 56,
  /** Tab bar height */
  tabBar: 56,
  /** Collapsed minibar height */
  collapsed: 56,
  /** Minimum expanded height */
  expandedMin: 200,
  /** Maximum expanded height (viewport-relative) */
  expandedMax: '50vh',
  /** Drawer height (viewport-relative) */
  drawerHeight: '85vh',
} as const;

// ============================================================================
// Combined Layout Object
// ============================================================================
export const layout = {
  breakpoints,
  media,
  widths,
  heights,
} as const;

// Uppercase export for backwards compatibility
export const LAYOUT = layout;

// ============================================================================
// Type Exports
// ============================================================================
export type BreakpointKey = keyof typeof breakpoints;
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';
export type Layout = typeof layout;
