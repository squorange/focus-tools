"use client";

import { ReactNode, useState } from "react";
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
  zIndex = 50,
  showBackdrop = true,
  children,
}: BottomSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const [dragY, setDragY] = useState(0);
  const [isHandleHovered, setIsHandleHovered] = useState(false);

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

  return (
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
            className="fixed inset-x-0 bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-300/50 dark:border-zinc-700/50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col touch-none"
            style={{
              zIndex,
              height,
              opacity: Math.max(0.7, 1 - dragY / 300),
              paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
            }}
          >
            {/* Drag handle */}
            <button
              onClick={onClose}
              onMouseEnter={() => setIsHandleHovered(true)}
              onMouseLeave={() => setIsHandleHovered(false)}
              className="w-full pt-3 pb-2 flex justify-center cursor-pointer bg-transparent border-0 flex-shrink-0"
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

            {/* Content */}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
