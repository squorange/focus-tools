'use client';

import { ReactNode, useState, useEffect } from 'react';
import { BottomSheet } from '../BottomSheet';
import { RightDrawer } from '../RightDrawer';
import { BREAKPOINTS } from '../../tokens/breakpoints';

export interface ResponsiveDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Width for desktop right drawer (default '400px') */
  desktopWidth?: string;
  /** Height for mobile bottom sheet (default '70vh') */
  mobileHeight?: string;
  /** Breakpoint in pixels (default 1024, matches tablet breakpoint) */
  breakpoint?: number;
  /** Z-index for both drawer types (default 50) */
  zIndex?: number;
  /** Show backdrop (default true) */
  showBackdrop?: boolean;
  /** Drawer content */
  children: ReactNode;
}

/**
 * ResponsiveDrawer - Automatically uses RightDrawer on desktop, BottomSheet on mobile.
 *
 * This is the recommended wrapper for content-heavy modals.
 * It handles responsive breakpoint detection automatically.
 *
 * @example
 * ```tsx
 * <ResponsiveDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <div className="p-4">
 *     <h2>Drawer Title</h2>
 *     <p>Content adapts to screen size</p>
 *   </div>
 * </ResponsiveDrawer>
 * ```
 */
export function ResponsiveDrawer({
  isOpen,
  onClose,
  desktopWidth = '400px',
  mobileHeight = '70vh',
  breakpoint = BREAKPOINTS.tablet,
  zIndex = 50,
  showBackdrop = true,
  children,
}: ResponsiveDrawerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < breakpoint);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        height={mobileHeight}
        zIndex={zIndex}
        showBackdrop={showBackdrop}
      >
        {children}
      </BottomSheet>
    );
  }

  return (
    <RightDrawer
      isOpen={isOpen}
      onClose={onClose}
      width={desktopWidth}
      zIndex={zIndex}
      showBackdrop={showBackdrop}
    >
      {children}
    </RightDrawer>
  );
}

export default ResponsiveDrawer;
