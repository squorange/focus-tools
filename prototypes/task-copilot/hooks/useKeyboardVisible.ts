"use client";

import { useState, useEffect } from "react";

/**
 * Detects whether the virtual keyboard is visible on mobile devices.
 * Uses the Visual Viewport API to detect viewport height changes.
 */
export function useKeyboardVisible(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const initialHeight = viewport.height;

    const handleResize = () => {
      // Keyboard is considered "up" if viewport shrinks by more than 150px
      const heightDiff = initialHeight - viewport.height;
      setIsKeyboardVisible(heightDiff > 150);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  return isKeyboardVisible;
}
