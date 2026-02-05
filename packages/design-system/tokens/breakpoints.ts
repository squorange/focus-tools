/**
 * Breakpoint Tokens
 *
 * Standard responsive breakpoints for the design system.
 */

// ============================================
// Breakpoints (pixels)
// ============================================
export const BREAKPOINTS = {
  mobile: 640,    // < 640px: mobile phone
  tablet: 1024,   // 640-1023px: tablet
  desktop: 1280,  // >= 1024px: desktop
} as const;

// ============================================
// Layout Widths
// ============================================
export const WIDTHS = {
  drawer: 400,    // Side drawer width on tablet/desktop
  minibar: 400,   // MiniBar width on tablet/desktop
  palette: 400,   // Command palette width
} as const;

// ============================================
// Layout Heights
// ============================================
export const HEIGHTS = {
  collapsed: 56,              // Collapsed minibar height
  expandedMin: 200,           // Minimum expanded height
  expandedMax: '50vh',        // Maximum expanded height
  drawerHeight: '85vh',       // Drawer covers most of screen
  header: 56,                 // Header height
  tabBar: 56,                 // Tab bar height
} as const;

// ============================================
// Media Query Helpers
// ============================================

/**
 * Media query string for mobile (max-width: mobile - 1)
 */
export const MEDIA_MOBILE = `(max-width: ${BREAKPOINTS.mobile - 1}px)`;

/**
 * Media query string for tablet and up (min-width: mobile)
 */
export const MEDIA_TABLET_UP = `(min-width: ${BREAKPOINTS.mobile}px)`;

/**
 * Media query string for desktop and up (min-width: tablet)
 */
export const MEDIA_DESKTOP_UP = `(min-width: ${BREAKPOINTS.tablet}px)`;

/**
 * Media query string for reduced motion preference
 */
export const MEDIA_REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Type exports
export type BreakpointKey = keyof typeof BREAKPOINTS;
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
