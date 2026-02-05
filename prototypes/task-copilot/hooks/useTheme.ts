'use client';

import { useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

/**
 * Hook to apply theme setting to the document.
 *
 * - 'light': Forces light mode regardless of system preference
 * - 'dark': Forces dark mode regardless of system preference
 * - 'auto': Follows system preference and updates when it changes
 *
 * @param theme - The theme setting to apply
 */
export function useTheme(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'auto') {
      // Check system preference and apply
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);

      // Listen for system changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Manual override - set or remove dark class
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);
}

export default useTheme;
