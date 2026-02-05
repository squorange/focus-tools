/**
 * Animation Tokens
 *
 * Includes durations, easings, and spring configurations for Framer Motion.
 */

// ============================================
// Durations (milliseconds)
// ============================================
export const DURATIONS = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

// ============================================
// Easings (CSS cubic-bezier)
// ============================================
export const EASINGS = {
  default: 'cubic-bezier(0.32, 0.72, 0, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
} as const;

/**
 * Easing arrays for Framer Motion
 */
export const EASING_ARRAYS = {
  default: [0.32, 0.72, 0, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
  spring: [0.32, 0.72, 0, 1] as const,
} as const;

// ============================================
// Spring Configurations (Framer Motion)
// ============================================

/**
 * Default spring - balanced feel, good for most interactions
 */
export const SPRING_DEFAULT = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

/**
 * Snappy spring - quick, responsive interactions (buttons, toggles)
 */
export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 600,
  damping: 40,
};

/**
 * Gentle spring - larger movements (page transitions, modals)
 */
export const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

/**
 * Reduced motion spring - instant, no animation
 */
export const SPRING_REDUCED = {
  type: 'tween' as const,
  duration: 0,
};

/**
 * All spring configurations
 */
export const SPRING_CONFIG = {
  default: SPRING_DEFAULT,
  snappy: SPRING_SNAPPY,
  gentle: SPRING_GENTLE,
  reduced: SPRING_REDUCED,
} as const;

/**
 * Height transition - smooth tween without overshoot
 */
export const HEIGHT_TRANSITION = {
  type: 'tween' as const,
  duration: 0.25,
  ease: EASING_ARRAYS.default,
};

// ============================================
// Animation Timings (from ai-constants)
// ============================================
export const ANIMATION_TIMINGS = {
  expandDuration: 0.3,      // seconds (framer-motion uses seconds)
  drawerDuration: 0.35,
  contentFadeDuration: 0.15,
  responseDelay: 0.05,      // Stagger for list items
  autoCollapseDelay: 7000,  // ms (7 seconds to read response)
} as const;

// ============================================
// Loading Animation
// ============================================
export const LOADING_ANIMATION = {
  pulseDuration: 2,      // Full pulse cycle (seconds)
  pulseDelay: 1,         // Shimmer starts at pulse break
  shimmerDuration: 2,    // Shimmer sweep duration
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Get spring config based on reduced motion preference
 */
export function getSpringConfig(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? SPRING_REDUCED : SPRING_DEFAULT;
}

/**
 * Get whileTap prop for Framer Motion (disabled for reduced motion)
 */
export function getWhileTap(prefersReducedMotion: boolean, scale = 0.95) {
  return prefersReducedMotion ? undefined : { scale };
}

/**
 * Get transition config for standard animations
 */
export function getTransition(prefersReducedMotion: boolean) {
  return prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 400, damping: 30 };
}

// Type exports
export type SpringConfigKey = keyof typeof SPRING_CONFIG;
export type DurationKey = keyof typeof DURATIONS;
export type EasingKey = keyof typeof EASINGS;
