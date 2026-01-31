"use client";

import { ReactNode, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  height?: string; // e.g. '50vh', '70vh', 'auto'
  zIndex?: number; // default 50
  showBackdrop?: boolean; // default true
  children: ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  height = "50vh",
  zIndex = 60,
  showBackdrop = true,
  children,
}: BottomSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const [dragY, setDragY] = useState(0);
  const [isHandleHovered, setIsHandleHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Portal mounting - renders directly in document.body to bypass parent transforms
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard detection using visualViewport API
  // Sets --safe-area-bottom CSS variable to 0 when keyboard is open
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const initialHeight = viewport.height;

    const handleResize = () => {
      // If viewport shrinks by more than 150px, keyboard is likely open
      const heightDiff = initialHeight - viewport.height;
      setIsKeyboardOpen(heightDiff > 150);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when sheet is open to prevent background scrolling
  // Using overflow: hidden instead of position: fixed to avoid affecting fixed children
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
    : { type: "spring" as const, stiffness: 400, damping: 30 };

  const sheetContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              className="fixed inset-0 bg-black/40"
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
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springConfig}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDrag={(
              _e: MouseEvent | TouchEvent | PointerEvent,
              info: PanInfo
            ) => setDragY(info.offset.y)}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-300/50 dark:border-zinc-700/50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col"
            style={{
              zIndex,
              height,
              opacity: Math.max(0.7, 1 - dragY / 300),
            }}
          >
            {/* Drag handle */}
            <button
              onClick={onClose}
              onMouseEnter={() => setIsHandleHovered(true)}
              onMouseLeave={() => setIsHandleHovered(false)}
              className="w-full pt-3 pb-2 flex justify-center cursor-pointer bg-transparent border-0 flex-shrink-0 touch-none"
              aria-label="Close"
            >
              <motion.div className="relative w-10 h-1 flex">
                {/* Left half */}
                <motion.div
                  className="w-5 h-1 rounded-l-full bg-zinc-300 dark:bg-zinc-600 origin-right"
                  animate={{
                    rotate: isHandleHovered && !prefersReducedMotion ? 15 : 0,
                  }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                />
                {/* Right half */}
                <motion.div
                  className="w-5 h-1 rounded-r-full bg-zinc-300 dark:bg-zinc-600 origin-left"
                  animate={{
                    rotate: isHandleHovered && !prefersReducedMotion ? -15 : 0,
                  }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                />
              </motion.div>
            </button>

            {/* Content wrapper - exposes --safe-area-bottom CSS variable for children
                Use var(--safe-area-bottom, env(safe-area-inset-bottom)) in child components */}
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

  // Use portal to render directly in body, avoiding parent transform issues
  if (!mounted) return null;
  return createPortal(sheetContent, document.body);
}
