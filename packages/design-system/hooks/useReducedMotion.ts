'use client';

import { useState, useEffect } from 'react';
import { SPRING_REDUCED, SPRING_DEFAULT } from '../tokens/animation';

/**
 * Hook to detect user's reduced motion preference.
 *
 * @returns true if the user prefers reduced motion
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * return (
 *   <motion.div
 *     animate={{ opacity: 1 }}
 *     transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
 *   />
 * );
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation props that respect reduced motion preference.
 *
 * Provides ready-to-use animation configuration for Framer Motion.
 *
 * @example
 * ```tsx
 * const { transition, whileTap, fadeProps } = useMotionSafe();
 *
 * return (
 *   <motion.button
 *     whileTap={whileTap}
 *     transition={transition}
 *   >
 *     Click me
 *   </motion.button>
 * );
 * ```
 */
export function useMotionSafe() {
  const prefersReducedMotion = useReducedMotion();

  return {
    prefersReducedMotion,

    // Transition that respects preference
    transition: prefersReducedMotion
      ? SPRING_REDUCED
      : { type: 'spring' as const, stiffness: 400, damping: 30 },

    // Scale transform for tap feedback
    whileTap: prefersReducedMotion ? undefined : { scale: 0.95 },

    // Fade animation props
    fadeProps: prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        },

    // Spring config
    spring: prefersReducedMotion ? SPRING_REDUCED : SPRING_DEFAULT,
  };
}

export default useReducedMotion;
