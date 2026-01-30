"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  width?: string; // e.g. '400px', '320px'. Default '400px'
  zIndex?: number; // default 40
  showBackdrop?: boolean; // default true (subtle backdrop)
  children: ReactNode;
}

/**
 * RightDrawer - Desktop side drawer that slides in from the right
 *
 * Use this for content-heavy modals on desktop (>= 1024px).
 * For mobile, pair with BottomSheet using a responsive wrapper.
 *
 * Features:
 * - Slides in from right with spring animation
 * - Subtle backdrop (click to dismiss)
 * - Escape key to close
 * - Respects reduced motion preferences
 */
export default function RightDrawer({
  isOpen,
  onClose,
  width = "400px",
  zIndex = 40,
  showBackdrop = true,
  children,
}: RightDrawerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  // Ensure we only render portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const springConfig = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 400, damping: 30 };

  // Use portal to escape any transformed ancestors that break fixed positioning
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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={springConfig}
            className="fixed top-0 right-0 bottom-0 bg-white dark:bg-zinc-900 border-l border-zinc-200/50 dark:border-zinc-700/30 shadow-xl flex flex-col"
            style={{
              zIndex,
              width,
              top: 0,
              bottom: 0,
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
