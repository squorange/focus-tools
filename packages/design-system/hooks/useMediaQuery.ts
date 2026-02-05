'use client';

import { useState, useEffect } from 'react';
import { BREAKPOINTS, type DeviceType } from '../tokens/breakpoints';

/**
 * Hook to detect if a media query matches.
 *
 * @param query - CSS media query string
 * @returns true if the media query matches
 *
 * @example
 * ```tsx
 * const isWide = useMediaQuery('(min-width: 1024px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Hook to detect if the viewport is mobile-sized.
 *
 * @returns true if viewport width < tablet breakpoint (1024px)
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 * ```
 */
export function useIsMobile(): boolean {
  return !useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
}

/**
 * Hook to detect if the viewport is tablet-sized.
 *
 * @returns true if viewport width is between mobile and desktop breakpoints
 *
 * @example
 * ```tsx
 * const isTablet = useIsTablet();
 * ```
 */
export function useIsTablet(): boolean {
  const isAboveMobile = useMediaQuery(`(min-width: ${BREAKPOINTS.mobile}px)`);
  const isBelowDesktop = !useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
  return isAboveMobile && isBelowDesktop;
}

/**
 * Hook to detect if the viewport is desktop-sized.
 *
 * @returns true if viewport width >= desktop breakpoint (1280px)
 *
 * @example
 * ```tsx
 * const isDesktop = useIsDesktop();
 * ```
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
}

/**
 * Hook to get the current device type based on viewport width.
 *
 * @returns 'mobile' | 'tablet' | 'desktop'
 *
 * @example
 * ```tsx
 * const deviceType = useDeviceType();
 *
 * switch (deviceType) {
 *   case 'mobile':
 *     return <MobileLayout />;
 *   case 'tablet':
 *     return <TabletLayout />;
 *   case 'desktop':
 *     return <DesktopLayout />;
 * }
 * ```
 */
export function useDeviceType(): DeviceType {
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();

  if (isDesktop) return 'desktop';
  if (isMobile) return 'mobile';
  return 'tablet';
}

export default useMediaQuery;
