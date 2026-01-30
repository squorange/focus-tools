"use client";

import { ReactNode, useState, useEffect } from "react";
import BottomSheet from "./BottomSheet";
import RightDrawer from "./RightDrawer";

interface ResponsiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Width for desktop right drawer. Default '400px' */
  desktopWidth?: string;
  /** Height for mobile bottom sheet. Default '70vh' */
  mobileHeight?: string;
  /** Breakpoint in pixels. Default 1024 (lg) */
  breakpoint?: number;
  /** Z-index for both drawer types. Default 50 */
  zIndex?: number;
  /** Show backdrop. Default true */
  showBackdrop?: boolean;
  children: ReactNode;
}

/**
 * ResponsiveDrawer - Automatically uses RightDrawer on desktop, BottomSheet on mobile
 *
 * This is the recommended wrapper for content-heavy modals.
 * It handles the responsive breakpoint detection automatically.
 *
 * Usage:
 * ```tsx
 * <ResponsiveDrawer isOpen={isOpen} onClose={onClose}>
 *   <Header>...</Header>
 *   <Content>...</Content>
 *   <Footer>...</Footer>
 * </ResponsiveDrawer>
 * ```
 */
export default function ResponsiveDrawer({
  isOpen,
  onClose,
  desktopWidth = "400px",
  mobileHeight = "70vh",
  breakpoint = 1024,
  zIndex = 50,
  showBackdrop = true,
  children,
}: ResponsiveDrawerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < breakpoint);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
