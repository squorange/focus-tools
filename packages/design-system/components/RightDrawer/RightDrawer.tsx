'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface RightDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Width of the drawer (default '400px') */
  width?: string;
  /** Z-index (default 40) */
  zIndex?: number;
  /** Show backdrop (default true) */
  showBackdrop?: boolean;
  /** Drawer content */
  children: ReactNode;
}

/**
 * RightDrawer - Desktop side drawer that slides in from the right.
 *
 * Use this for content-heavy modals on desktop (>= 1024px).
 * For mobile, pair with BottomSheet using ResponsiveDrawer.
 *
 * Features:
 * - Slides in from right with spring animation
 * - Backdrop click to close
 * - Escape key to close
 * - Respects reduced motion preferences
 * - Portal rendering
 *
 * @example
 * ```tsx
 * <RightDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <div className="p-4">
 *     <h2>Drawer Title</h2>
 *     <p>Content goes here</p>
 *   </div>
 * </RightDrawer>
 * ```
 */
export function RightDrawer({
  isOpen,
  onClose,
  width = '400px',
  zIndex = 40,
  showBackdrop = true,
  children,
}: RightDrawerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  // Portal mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const springConfig = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 400, damping: 30 };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              className="fixed inset-0"
              style={{ zIndex: zIndex - 1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              onClick={onClose}
            />
          )}

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={springConfig}
            className="fixed top-0 right-0 bottom-0 bg-bg-neutral-subtle border-l border-border-color-neutral-subtle shadow-elevation-high flex flex-col"
            style={{
              zIndex,
              width,
              height: '100vh',
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default RightDrawer;
