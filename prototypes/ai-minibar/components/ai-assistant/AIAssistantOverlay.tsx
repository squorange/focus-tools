'use client';

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { AIResponse, QuickAction, CollapsedContent } from '@/lib/types';
import { HEIGHTS, HEIGHT_TRANSITION, getSpringConfig } from '@/lib/constants';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { MiniBarContent } from './MiniBarContent';
import { PaletteContent } from './PaletteContent';

type OverlayMode = 'collapsed' | 'expanded';

interface AIAssistantOverlayProps {
  mode: OverlayMode;
  // Collapsed mode props
  collapsedContent: CollapsedContent;
  onExpand: () => void;
  // Expanded mode props
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  response: AIResponse | null;
  quickActions: QuickAction[];
  onCollapse: () => void;
  onOpenDrawer: () => void;
  onAccept: () => void;
  onDismiss: () => void;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  // Animation
  isAnimating?: boolean;
}

export function AIAssistantOverlay({
  mode,
  collapsedContent,
  onExpand,
  query,
  onQueryChange,
  onSubmit,
  isLoading,
  response,
  quickActions,
  onCollapse,
  onOpenDrawer,
  onAccept,
  onDismiss,
  onInputFocus,
  onInputBlur,
  isAnimating = false,
}: AIAssistantOverlayProps) {
  const [dragY, setDragY] = useState(0);
  const [isHandleHovered, setIsHandleHovered] = useState(false);
  const isDesktop = useIsDesktop();
  const prefersReducedMotion = useReducedMotion();

  const isExpanded = mode === 'expanded';

  // Get motion-safe spring config
  const springConfig = getSpringConfig(prefersReducedMotion);
  const heightTransition = prefersReducedMotion ? { duration: 0 } : HEIGHT_TRANSITION;

  // Handle drag gesture for swipe-down to collapse (expanded mode only)
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isExpanded && (info.offset.y > 50 || (info.offset.y > 20 && info.velocity.y > 300))) {
      onCollapse();
    }
    setDragY(0);
  };

  // Drag props only apply in expanded mode
  const dragProps = isExpanded
    ? {
        drag: 'y' as const,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.5 },
        onDrag: (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => setDragY(info.offset.y),
        onDragEnd: handleDragEnd,
      }
    : {};

  // Initial y offset for bounce effect on mode change (skip if reduced motion)
  const initialY = prefersReducedMotion ? 0 : (isExpanded ? 12 : -8);

  return (
    <motion.div
      key={mode} // Re-trigger animation on mode change
      role={isExpanded ? 'dialog' : undefined}
      aria-modal={isExpanded ? 'true' : undefined}
      aria-label="AI Assistant"
      aria-expanded={isExpanded}
      initial={{ height: isExpanded ? 48 : 'auto', y: initialY }}
      animate={{
        height: isExpanded ? 'auto' : 48,
        y: 0,
      }}
      transition={{
        height: heightTransition,
        y: springConfig,
      }}
      {...dragProps}
      className={`
        w-full sm:w-[400px]
        bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg
        border border-zinc-300/50 dark:border-zinc-700/50
        overflow-hidden
        shadow-xl shadow-black/10 dark:shadow-black/30
        rounded-3xl
        ${isExpanded ? 'touch-none' : ''}
        ${isAnimating ? 'pointer-events-none' : ''}
      `}
      style={{
        maxHeight: isExpanded ? HEIGHTS.expandedMax : undefined,
        opacity: isExpanded ? Math.max(0.5, 1 - dragY / 200) : 1,
      }}
    >
      {/* Drag handle (expanded mode) / top area (collapsed mode) */}
      {isExpanded && (
        <button
          onClick={onCollapse}
          onMouseEnter={() => isDesktop && setIsHandleHovered(true)}
          onMouseLeave={() => setIsHandleHovered(false)}
          className="w-full py-3 flex justify-center cursor-pointer bg-transparent border-0"
          aria-label="Collapse AI Assistant"
        >
          {/* Animated handle that bends into chevron on hover */}
          <motion.div
            className="relative w-10 h-1 flex"
            initial={false}
          >
            {/* Left half */}
            <motion.div
              className="w-5 h-1 rounded-l-full bg-zinc-300 dark:bg-zinc-600 origin-right"
              animate={{ rotate: isHandleHovered && !prefersReducedMotion ? 15 : 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            />
            {/* Right half */}
            <motion.div
              className="w-5 h-1 rounded-r-full bg-zinc-300 dark:bg-zinc-600 origin-left"
              animate={{ rotate: isHandleHovered && !prefersReducedMotion ? -15 : 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            />
          </motion.div>
        </button>
      )}

      {/* Content switching with crossfade */}
      <AnimatePresence mode="popLayout" initial={false}>
        {mode === 'collapsed' ? (
          <MiniBarContent
            key="minibar"
            content={collapsedContent}
            onExpand={onExpand}
          />
        ) : (
          <PaletteContent
            key="palette"
            query={query}
            onQueryChange={onQueryChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
            response={response}
            quickActions={quickActions}
            onOpenDrawer={onOpenDrawer}
            onAccept={onAccept}
            onDismiss={onDismiss}
            onInputFocus={onInputFocus}
            onInputBlur={onInputBlur}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AIAssistantOverlay;
