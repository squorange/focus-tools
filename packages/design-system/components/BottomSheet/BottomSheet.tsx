'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface BottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Height of the sheet (e.g., '50vh', '70vh', 'auto') */
  height?: string;
  /** Z-index (default 60) */
  zIndex?: number;
  /** Show backdrop (default true) */
  showBackdrop?: boolean;
  /** Sheet content */
  children: ReactNode;
}

/**
 * BottomSheet - A mobile-friendly slide-up modal.
 *
 * Features:
 * - Slides up from bottom with spring animation
 * - Drag to dismiss (swipe down)
 * - Backdrop click to close
 * - Respects reduced motion preferences
 * - Keyboard-aware (sets --safe-area-bottom to 0 when keyboard is open)
 * - Portal rendering to avoid transform parent issues
 *
 * @example
 * ```tsx
 * <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <div className="p-4">
 *     <h2>Sheet Title</h2>
 *     <p>Content goes here</p>
 *   </div>
 * </BottomSheet>
 * ```
 */
export function BottomSheet({
  isOpen,
  onClose,
  height = '50vh',
  zIndex = 60,
  showBackdrop = true,
  children,
}: BottomSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const [dragY, setDragY] = useState(0);
  const [isHandleHovered, setIsHandleHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Portal mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard detection using visualViewport API
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const initialHeight = viewport.height;

    const handleResize = () => {
      const heightDiff = initialHeight - viewport.height;
      setIsKeyboardOpen(heightDiff > 150);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 100 || (info.offset.y > 50 && info.velocity.y > 500)) {
      onClose();
    }
    setDragY(0);
  };

  const springConfig = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 400, damping: 30 };

  const sheetContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              className="fixed inset-0 bg-bg-backdrop"
              style={{ zIndex: zIndex - 1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              onClick={onClose}
            />
          )}

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springConfig}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDrag={(
              _e: MouseEvent | TouchEvent | PointerEvent,
              info: PanInfo
            ) => setDragY(info.offset.y)}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 bg-bg-glass-floating-panel backdrop-blur-lg border-t border-border-color-glass-floating-panel rounded-t-3xl shadow-elevation-high flex flex-col"
            style={{
              zIndex,
              height,
              opacity: Math.max(0.7, 1 - dragY / 300),
            }}
          >
            {/* Drag handle */}
            <button
              type="button"
              onClick={onClose}
              onMouseEnter={() => setIsHandleHovered(true)}
              onMouseLeave={() => setIsHandleHovered(false)}
              className="w-full pt-3 pb-2 flex justify-center cursor-pointer bg-transparent border-0 flex-shrink-0 touch-none"
              aria-label="Close"
            >
              <motion.div className="relative w-10 h-1 flex">
                {/* Left half */}
                <motion.div
                  className="w-5 h-1 rounded-l-full bg-fg-neutral-disabled origin-right"
                  animate={{
                    rotate: isHandleHovered && !prefersReducedMotion ? 15 : 0,
                  }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                />
                {/* Right half */}
                <motion.div
                  className="w-5 h-1 rounded-r-full bg-fg-neutral-disabled origin-left"
                  animate={{
                    rotate: isHandleHovered && !prefersReducedMotion ? -15 : 0,
                  }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                />
              </motion.div>
            </button>

            {/* Content */}
            <div
              className="flex-1 flex flex-col min-h-0"
              style={{
                '--safe-area-bottom': isKeyboardOpen ? '0px' : 'env(safe-area-inset-bottom)',
              } as React.CSSProperties}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(sheetContent, document.body);
}

export default BottomSheet;
