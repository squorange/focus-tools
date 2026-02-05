/**
 * Motion Foundations
 *
 * Duration, easing, and spring configurations for animations.
 * Includes both CSS transitions and Framer Motion spring configs.
 */

// ============================================================================
// Durations (milliseconds)
// ============================================================================
export const duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

/**
 * Duration values in seconds (for Framer Motion)
 */
export const durationSeconds = {
  instant: 0,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slower: 0.5,
} as const;

// ============================================================================
// Easings (CSS cubic-bezier)
// ============================================================================
export const easing = {
  default: 'cubic-bezier(0.32, 0.72, 0, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
} as const;

/**
 * Easing arrays for Framer Motion
 */
export const easingArray = {
  default: [0.32, 0.72, 0, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
  spring: [0.32, 0.72, 0, 1] as const,
} as const;

// ============================================================================
// CSS Transition Presets
// ============================================================================
export const transitions = {
  fast: `${duration.fast}ms ${easing.default}`,
  base: `${duration.normal}ms ${easing.default}`,
  slow: `${duration.slow}ms ${easing.default}`,
} as const;

// ============================================================================
// Spring Configurations (Framer Motion)
// ============================================================================

/**
 * Default spring - balanced feel, good for most interactions
 */
export const springDefault = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

/**
 * Snappy spring - quick, responsive interactions (buttons, toggles)
 */
export const springSnappy = {
  type: 'spring' as const,
  stiffness: 600,
  damping: 40,
};

/**
 * Gentle spring - larger movements (page transitions, modals)
 */
export const springGentle = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

/**
 * Reduced motion spring - instant, no animation
 */
export const springReduced = {
  type: 'tween' as const,
  duration: 0,
};

/**
 * All spring configurations
 */
export const spring = {
  default: springDefault,
  snappy: springSnappy,
  gentle: springGentle,
  reduced: springReduced,
} as const;

/**
 * Height transition - smooth tween without overshoot
 */
export const heightTransition = {
  type: 'tween' as const,
  duration: durationSeconds.normal,
  ease: easingArray.default,
};

// ============================================================================
// Animation Timings (for complex sequences)
// ============================================================================
export const animationTimings = {
  expandDuration: 0.3,      // seconds
  drawerDuration: 0.35,
  contentFadeDuration: 0.15,
  responseDelay: 0.05,      // Stagger for list items
  autoCollapseDelay: 7000,  // ms
} as const;

// ============================================================================
// Loading Animation
// ============================================================================
export const loadingAnimation = {
  pulseDuration: 2,      // Full pulse cycle (seconds)
  pulseDelay: 1,
  shimmerDuration: 2,
} as const;

// ============================================================================
// Combined Motion Object
// ============================================================================
export const motion = {
  duration,
  durationSeconds,
  easing,
  easingArray,
  transitions,
  spring,
  heightTransition,
  animationTimings,
  loadingAnimation,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get spring config based on reduced motion preference
 */
export function getSpringConfig(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? springReduced : springDefault;
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

// ============================================================================
// Type Exports
// ============================================================================
export type DurationKey = keyof typeof duration;
export type EasingKey = keyof typeof easing;
export type SpringKey = keyof typeof spring;
export type TransitionSpeed = keyof typeof transitions;
