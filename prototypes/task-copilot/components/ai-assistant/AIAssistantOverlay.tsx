'use client';

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { AIResponse, QuickAction, CollapsedContent } from '@/lib/ai-types';
import { AITargetContext } from '@/lib/types';
import { ActiveAlert } from '@/lib/notification-types';
import { HEIGHTS, HEIGHT_TRANSITION } from '@/lib/ai-constants';
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
  onScrollToSuggestions?: () => void;
  // Expanded mode props
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  onDirectSubmit?: (query: string) => void;  // Refinement 3: Bypass input for quick actions
  isLoading: boolean;
  response: AIResponse | null;
  quickActions: QuickAction[];
  onCollapse: () => void;
  onDismiss: () => void;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  // Animation
  isAnimating?: boolean;
  // Auto-collapse control: prevents outdated content from persisting, but respects user engagement
  // If user shows intent to interact → don't auto-collapse; if passive notification → auto-collapse
  disableAutoCollapse?: boolean;  // True when user has shown intent to interact
  onManualInteraction?: () => void;  // Called when user signals intent (e.g., clicks "Ask AI")
  // Recommendation handlers
  onRequestRecommendation?: () => void;  // For "What next?" quick action
  onStartRecommendedFocus?: (taskId: string) => void;
  onSkipRecommendation?: (taskId: string) => void;
  // Drawer access
  onOpenDrawer?: () => void;
  // Inline AI target context (for step/task targeting)
  aiTargetContext?: AITargetContext | null;
  onClearAITarget?: () => void;
  // Awareness nudge (stale queue items)
  awareness?: {
    items: { id: string; taskId: string; title: string; days: number }[];
    currentIndex: number;
    onReview: (taskId: string) => void;
    onDismiss: (itemId: string) => void;
    onNext: () => void;
  } | null;
  // Active alerts (pokes and reminders) - sticky, visible during AI activity
  activeAlerts?: ActiveAlert[] | null;
  currentAlertIndex?: number;
  onCycleAlert?: () => void;
  onStartPokeAction?: () => void;
  onReminderAction?: () => void;
}

export function AIAssistantOverlay({
  mode,
  collapsedContent,
  onExpand,
  onScrollToSuggestions,
  query,
  onQueryChange,
  onSubmit,
  onDirectSubmit,
  isLoading,
  response,
  quickActions,
  onCollapse,
  onDismiss,
  onInputFocus,
  onInputBlur,
  isAnimating = false,
  disableAutoCollapse = false,
  onManualInteraction,
  onRequestRecommendation,
  onStartRecommendedFocus,
  onSkipRecommendation,
  onOpenDrawer,
  aiTargetContext,
  onClearAITarget,
  awareness,
  activeAlerts,
  currentAlertIndex = 0,
  onCycleAlert,
  onStartPokeAction,
  onReminderAction,
}: AIAssistantOverlayProps) {
  const [dragY, setDragY] = useState(0);
  const [isHandleHovered, setIsHandleHovered] = useState(false);
  const isDesktop = useIsDesktop();
  const prefersReducedMotion = useReducedMotion();

  const isExpanded = mode === 'expanded';

  // Get motion-safe transition config
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
      layout // Auto-animate size changes
      role={isExpanded ? 'dialog' : undefined}
      aria-modal={isExpanded ? 'true' : undefined}
      aria-label="AI Assistant"
      aria-expanded={isExpanded}
      initial={false} // Skip initial animation to avoid flash
      transition={{
        layout: heightTransition,
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
      <AnimatePresence mode="wait" initial={false}>
        {mode === 'collapsed' ? (
          <MiniBarContent
            key="minibar"
            content={collapsedContent}
            onExpand={onExpand}
            onScrollToSuggestions={onScrollToSuggestions}
            onStartPokeAction={onStartPokeAction}
            onReminderAction={onReminderAction}
            onCycleAlert={onCycleAlert}
          />
        ) : (
          <PaletteContent
            key="palette"
            query={query}
            onQueryChange={onQueryChange}
            onSubmit={onSubmit}
            onDirectSubmit={onDirectSubmit}
            isLoading={isLoading}
            response={response}
            quickActions={quickActions}
            onDismiss={onDismiss}
            onCollapse={onCollapse}
            onInputFocus={onInputFocus}
            onInputBlur={onInputBlur}
            disableAutoCollapse={disableAutoCollapse}
            onManualInteraction={onManualInteraction}
            onRequestRecommendation={onRequestRecommendation}
            onStartRecommendedFocus={onStartRecommendedFocus}
            onSkipRecommendation={onSkipRecommendation}
            onOpenDrawer={onOpenDrawer}
            aiTargetContext={aiTargetContext}
            onClearAITarget={onClearAITarget}
            awareness={awareness}
            activeAlerts={activeAlerts}
            currentAlertIndex={currentAlertIndex}
            onCycleAlert={onCycleAlert}
            onStartPokeAction={onStartPokeAction}
            onReminderAction={onReminderAction}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AIAssistantOverlay;
