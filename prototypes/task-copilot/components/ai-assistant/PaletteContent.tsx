'use client';

import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIResponse, QuickAction, SuggestionsContent, RecommendationContent } from '@/lib/ai-types';
import { AITargetContext } from '@/lib/types';
import { ActiveAlert } from '@/lib/notification-types';
import { Bell } from 'lucide-react';
import { HEIGHT_TRANSITION, ANIMATIONS, STEP_QUICK_ACTIONS } from '@/lib/ai-constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { QuickActions } from './QuickActions';
import { ResponseDisplay } from './ResponseDisplay';
import { ShimmerText } from './ShimmerText';

// Baseline height matches quick actions row
const BASELINE_HEIGHT = 48;

interface PaletteContentProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  onDirectSubmit?: (query: string) => void;  // Bypass input field for quick actions
  isLoading: boolean;
  response: AIResponse | null;
  quickActions: QuickAction[];
  onDismiss: () => void;
  onCollapse?: () => void;  // Collapse Palette to MiniBar
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  // Auto-collapse control: prevents outdated content from persisting, but respects user engagement
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

export function PaletteContent({
  query,
  onQueryChange,
  onSubmit,
  onDirectSubmit,
  isLoading,
  response,
  quickActions,
  onDismiss,
  onCollapse,
  onInputFocus,
  onInputBlur,
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
}: PaletteContentProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoCollapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [inputHeight, setInputHeight] = useState<number | null>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Get motion-safe transition config
  const heightTransition = prefersReducedMotion ? { duration: 0 } : HEIGHT_TRANSITION;

  // ============ Response Type Detection ============
  // Used for unified button rendering based on response type
  const hasTextResponse = response && response.type === 'text';
  const hasSuggestionsResponse = response && response.type === 'suggestions';
  const hasExplanationResponse = response && response.type === 'explanation';
  const hasRecommendationResponse = response && response.type === 'recommendation';
  const hasErrorResponse = response && response.type === 'error';

  // For unified button rendering: text and explanation get same buttons
  const hasContentResponse = hasTextResponse || hasExplanationResponse;

  const [showInput, setShowInput] = useState(true);

  // Refinement 4b: Hide input for ALL responses (not just text)
  // Input only visible in idle mode or when user explicitly clicks "Ask AI"
  useEffect(() => {
    setShowInput(!response);
  }, [response]);

  // ============ Auto-Collapse Logic ============
  //
  // Philosophy:
  // - If user shows intent to interact (taps MiniBar, clicks "Ask AI"),
  //   DON'T auto-collapse — they're actively engaging with the Palette
  // - If response arrives passively (notification delivered, content no longer needed),
  //   DO auto-collapse — helps mitigate information overload and clears outdated content
  //
  // This keeps the UI clean while respecting user engagement signals.
  //
  const cancelAutoCollapse = () => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
  };

  useEffect(() => {
    // Only auto-collapse if not manually opened and there's a response
    if (response && onCollapse && !disableAutoCollapse) {
      cancelAutoCollapse(); // Clear any existing timer
      autoCollapseTimerRef.current = setTimeout(() => {
        onCollapse();
      }, ANIMATIONS.autoCollapseDelay);
    } else {
      cancelAutoCollapse();
    }

    // Cleanup on unmount
    return () => cancelAutoCollapse();
  }, [response, onCollapse, disableAutoCollapse]);

  // Measure content height when response changes (for smooth loading transitions)
  useEffect(() => {
    if (response && contentRef.current && !isLoading) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [response, isLoading]);

  // Auto-focus input when palette opens (only if input is visible)
  useEffect(() => {
    if (showInput) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showInput]);

  // ============ Gradient Fade Detection ============
  // Only show gradients when content actually overflows

  const checkOverflow = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const hasOverflow = scrollHeight > clientHeight + 2; // 2px tolerance to avoid flickering
      setShowTopFade(hasOverflow && scrollTop > 10);
      setShowBottomFade(hasOverflow && scrollTop < scrollHeight - clientHeight - 10);
    } else {
      setShowTopFade(false);
      setShowBottomFade(false);
    }
  };

  // Handle scroll to update gradient visibility
  const handleScroll = () => {
    checkOverflow();
  };

  // Check overflow after layout paint (with delay to ensure DOM is rendered)
  useLayoutEffect(() => {
    const timer = setTimeout(checkOverflow, 50);
    return () => clearTimeout(timer);
  }, [response, isLoading, showInput]);

  // Continuous monitoring with ResizeObserver for dynamic content
  useEffect(() => {
    if (!scrollRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(scrollRef.current);

    // Also observe the content div for size changes
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit();
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    // Special case: "What next?" action should use recommendation handler
    if (action.id === 'next' && onRequestRecommendation) {
      onRequestRecommendation();
      return;
    }

    // Build query - include step context if targeting a step
    let query = action.query;
    if (aiTargetContext && aiTargetContext.type === 'step') {
      query = `${action.query}\n\nStep: "${aiTargetContext.label}"`;
    }

    // Refinement 3: Use directSubmit to bypass input field population
    if (onDirectSubmit) {
      onDirectSubmit(query);
    } else {
      // Fallback to old behavior
      onQueryChange(query);
      setTimeout(() => onSubmit(), 100);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.15, delay: 0.05, layout: heightTransition }}
      className="px-6 pb-6 sm:px-4 sm:pb-4 flex flex-col h-full max-h-full overflow-hidden"
    >
      {/* Target banner - shows when step is targeted (reply arrow style) */}
      {aiTargetContext && !isLoading && !response && (
        <div className="flex items-center justify-between px-3 py-2 mb-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            {/* Reply arrow icon */}
            <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0 text-zinc-400">
              <path d="M4 2v8h8" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 7l3 3-3 3" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm text-fg-neutral-primary truncate">
              Step: {aiTargetContext.label}
            </span>
          </div>
          {onClearAITarget && (
            <button
              type="button"
              onClick={onClearAITarget}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
              aria-label="Clear target"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Awareness banner - stale item nudge (hidden when step targeted or alerts active) */}
      {awareness && !aiTargetContext && (!activeAlerts || activeAlerts.length === 0) && !isLoading && !response && (() => {
        const current = awareness.items[awareness.currentIndex];
        if (!current) return null;
        const total = awareness.items.length;

        return (
          <div className="px-3 py-2 mb-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-lg">
            {/* Title row: emoji + full title (wraps) + count */}
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 text-sm mt-0.5">👀</span>
              <span className="text-sm text-fg-neutral-primary">
                &ldquo;{current.title}&rdquo; — {current.days}d untouched
              </span>
              {total > 1 && (
                <span className="flex-shrink-0 text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {awareness.currentIndex + 1}/{total}
                </span>
              )}
            </div>
            {/* Actions row - compact filled buttons (all gray translucent) */}
            <div className="flex items-center gap-1.5 mt-2 ml-6">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); awareness.onReview(current.taskId); }}
                className="px-2.5 py-1 text-xs font-medium rounded-full
                  bg-zinc-900/10 dark:bg-white/10
                  text-fg-neutral-primary
                  hover:bg-zinc-900/20 dark:hover:bg-white/20
                  transition-colors"
              >
                Review
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); awareness.onDismiss(current.id); }}
                className="px-2.5 py-1 text-xs font-medium rounded-full
                  bg-zinc-900/10 dark:bg-white/10
                  text-fg-neutral-primary
                  hover:bg-zinc-900/20 dark:hover:bg-white/20
                  transition-colors"
              >
                Dismiss
              </button>
              {total > 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); awareness.onNext(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                  aria-label="Next item"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Alert banners - sticky, visible even during AI activity (takes priority over awareness) */}
      {activeAlerts && activeAlerts.length > 0 && !aiTargetContext && (() => {
        const current = activeAlerts[currentAlertIndex];
        const alertCount = activeAlerts.length;
        const hasMultiple = alertCount > 1;

        if (current.type === 'poke') {
          const poke = current.data;
          // Calculate poke time (start time) from anchor time, rounded to nearest 5 minutes
          const rawPokeTime = poke.anchorTime - (poke.durationMinutes + poke.bufferMinutes) * 60 * 1000;
          const pokeTime = Math.round(rawPokeTime / 300000) * 300000; // Round to nearest 5 min
          const pokeTimeStr = new Date(pokeTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          const dueTimeStr = new Date(poke.anchorTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

          return (
            <div className="px-3 py-2 mb-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-lg">
              {/* Title row: pointing emoji + task title + poke time + count */}
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-sm mt-0.5">👉🏽</span>
                <span className="flex-1 text-sm text-fg-neutral-primary">
                  Start &ldquo;{poke.taskTitle}&rdquo; at {pokeTimeStr}
                </span>
                {hasMultiple && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCycleAlert?.(); }}
                    className="flex-shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    ({currentAlertIndex + 1}/{alertCount})
                  </button>
                )}
              </div>
              {/* Duration + buffer + due time */}
              <div className="text-xs text-fg-neutral-secondary mt-1 ml-6">
                {poke.usePercentageBuffer
                  ? `~${poke.durationMinutes}m + 15% buffer → due ${dueTimeStr}`
                  : `${poke.durationMinutes} min + ${poke.bufferMinutes} min buffer → due ${dueTimeStr}`}
              </div>
              {/* Actions row - compact filled buttons (all gray translucent) */}
              <div className="flex items-center gap-1.5 mt-2 ml-6">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onStartPokeAction?.(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); poke.onSnooze(5); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  Snooze 5m
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); poke.onDismiss(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        } else if (current.type === 'runway') {
          // Runway nudge banner - amber themed (different from poke)
          const runway = current.data;
          const effectiveDate = new Date(runway.effectiveDeadline);
          const dateStr = effectiveDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

          return (
            <div className="px-3 py-2 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              {/* Title row: running emoji + task title + date + count */}
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-sm mt-0.5">🏃</span>
                <span className="flex-1 text-sm text-fg-neutral-primary">
                  Start &ldquo;{runway.taskTitle}&rdquo; soon
                </span>
                {hasMultiple && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCycleAlert?.(); }}
                    className="flex-shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    ({currentAlertIndex + 1}/{alertCount})
                  </button>
                )}
              </div>
              {/* Lead time context */}
              <div className="text-xs text-fg-neutral-secondary mt-1 ml-6">
                {runway.leadTimeDays}d lead time — start by {dateStr} to finish on time
              </div>
              {/* Actions row - compact filled buttons */}
              <div className="flex items-center gap-1.5 mt-2 ml-6">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); runway.onStart(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  View Task
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); runway.onSnooze(60); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  Snooze 1h
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); runway.onDismiss(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        } else {
          // Reminder banner - violet themed (unified with other banners)
          const reminder = current.data;
          const reminderTime = new Date(reminder.reminderTime);
          const timeStr = reminderTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

          return (
            <div className="px-3 py-2 mb-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-lg">
              {/* Title row: bell icon + task title + time + count */}
              <div className="flex items-start gap-2">
                <Bell
                  size={14}
                  className="flex-shrink-0 mt-0.5 text-violet-500 dark:text-violet-400"
                />
                <span className="flex-1 text-sm text-fg-neutral-primary">
                  &ldquo;{reminder.taskTitle}&rdquo; — Set for {timeStr}
                </span>
                {hasMultiple && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCycleAlert?.(); }}
                    className="flex-shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    ({currentAlertIndex + 1}/{alertCount})
                  </button>
                )}
              </div>
              {/* Actions row - compact filled buttons (all gray translucent) */}
              <div className="flex items-center gap-1.5 mt-2 ml-6">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onReminderAction?.(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); reminder.onSnooze(5); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  Snooze 5m
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); reminder.onDismiss(); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-zinc-900/10 dark:bg-white/10
                    text-fg-neutral-primary
                    hover:bg-zinc-900/20 dark:hover:bg-white/20
                    transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        }
      })()}

      {/* Content area - scrollable with gradient fades */}
      <div className="relative flex-1 min-h-0 mb-4 overflow-hidden">
        {/* Top gradient fade (visible when scrolled down) */}
        <div
          className={`absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white dark:from-zinc-900 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showTopFade ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto overflow-x-visible h-full max-h-full scrollbar-hide"
        >
          <motion.div
            animate={{
              height: isLoading
                ? (contentHeight ?? BASELINE_HEIGHT)
                : 'auto'
            }}
            transition={heightTransition}
          >
            <div ref={contentRef}>
              <AnimatePresence mode="popLayout">
                {/* Quick actions (hide when loading or has response) */}
                {/* When step is targeted, show step-specific actions */}
                {!isLoading && !response && (
                  <motion.div
                    key="quick-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <QuickActions
                      actions={aiTargetContext ? STEP_QUICK_ACTIONS : quickActions}
                      onSelect={handleQuickAction}
                      disabled={isLoading}
                    />
                  </motion.div>
                )}

                {/* Loading state - centered shimmer text */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                    className="flex items-center justify-center text-sm"
                    style={{ height: contentHeight ?? BASELINE_HEIGHT }}
                    aria-live="polite"
                  >
                    <ShimmerText text="Thinking..." className="text-sm" />
                  </motion.div>
                )}

                {/* Response Content - Refinement 9: Content only, buttons handled separately */}
                {response && !isLoading && (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Suggestions: Show summary text (actual suggestions are in StagingArea) */}
                    {hasSuggestionsResponse && (
                      <div className="py-1">
                        <p className="text-base text-fg-neutral-secondary text-left">
                          {(response.content as SuggestionsContent).message}
                        </p>
                      </div>
                    )}

                    {/* Recommendation: Show task suggestion card */}
                    {hasRecommendationResponse && (
                      <div className="space-y-2 text-left overflow-visible">
                        <p className="text-base text-fg-neutral-secondary whitespace-nowrap">I&apos;d suggest...</p>
                        <p className="text-base font-medium text-zinc-800 dark:text-zinc-200">
                          "{(response.content as RecommendationContent).taskTitle}"
                        </p>
                        <p className="text-base text-zinc-600 dark:text-zinc-300">
                          {(response.content as RecommendationContent).reason}
                        </p>
                      </div>
                    )}

                    {/* Text, Explanation, Error: Render content via ResponseDisplay */}
                    {(hasTextResponse || hasExplanationResponse || hasErrorResponse) && (
                      <ResponseDisplay response={response} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons - inside scroll so always reachable */}
              {response && !showInput && !isLoading && (
                <div className="flex items-center justify-start gap-3 pt-4 pb-2">
                  {/* SUGGESTIONS: Got it + Ask AI (auto-scroll handles navigation) */}
                  {hasSuggestionsResponse && (
                    <>
                      <button
                        onClick={() => {
                          cancelAutoCollapse();
                          onDismiss();
                          onCollapse?.();
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          bg-violet-600 text-white hover:bg-violet-700"
                      >
                        Got it
                      </button>
                      <button
                        onClick={() => {
                          cancelAutoCollapse();
                          onManualInteraction?.();
                          setShowInput(true);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          text-fg-neutral-primary border border-border-color-neutral
                          hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        Ask AI
                      </button>
                    </>
                  )}

                  {/* TEXT / EXPLANATION: Got it (PRIMARY) + Ask AI (SECONDARY) */}
                  {hasContentResponse && (
                    <>
                      <button
                        onClick={() => {
                          cancelAutoCollapse();
                          onDismiss();
                          onCollapse?.();
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          text-white bg-violet-600 hover:bg-violet-700"
                      >
                        Got it
                      </button>
                      <button
                        onClick={() => {
                          cancelAutoCollapse();
                          onManualInteraction?.();
                          setShowInput(true);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300
                          hover:bg-violet-200 dark:hover:bg-violet-800/40"
                      >
                        Ask AI
                      </button>
                    </>
                  )}

                  {/* ERROR: Retry (PRIMARY) + Ask AI (SECONDARY) + Dismiss (TERTIARY) */}
                  {hasErrorResponse && (
                    <>
                      <button
                        onClick={() => {
                          cancelAutoCollapse();
                          onManualInteraction?.();
                          onSubmit(); // Retry the query
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          text-white bg-violet-600 hover:bg-violet-700"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => {
                          cancelAutoCollapse();
                          onManualInteraction?.();
                          setShowInput(true);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300
                          hover:bg-violet-200 dark:hover:bg-violet-800/40"
                      >
                        Ask AI
                      </button>
                      <button
                        onClick={() => {
                          cancelAutoCollapse();
                          onDismiss();
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          text-fg-neutral-secondary hover:text-zinc-700 dark:hover:text-zinc-300
                          hover:bg-bg-neutral-subtle"
                      >
                        Dismiss
                      </button>
                    </>
                  )}

                  {/* RECOMMENDATION: Start Focus (PRIMARY) + Ask AI (SECONDARY) + Dismiss (TERTIARY) */}
                  {hasRecommendationResponse && (
                    <>
                      <button
                        onClick={() => {
                          cancelAutoCollapse();
                          const taskId = (response?.content as RecommendationContent)?.taskId;
                          if (taskId && onStartRecommendedFocus) {
                            onStartRecommendedFocus(taskId);
                          }
                          onDismiss();
                          onCollapse?.();
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          text-white bg-violet-600 hover:bg-violet-700"
                      >
                        Start Focus
                      </button>
                      <button
                        onClick={() => {
                          cancelAutoCollapse();
                          onManualInteraction?.();
                          setShowInput(true);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300
                          hover:bg-violet-200 dark:hover:bg-violet-800/40"
                      >
                        Ask AI
                      </button>
                      <button
                        onClick={() => {
                          cancelAutoCollapse();
                          onDismiss();
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          text-fg-neutral-secondary hover:text-zinc-700 dark:hover:text-zinc-300
                          hover:bg-bg-neutral-subtle"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom gradient fade (visible when more content below) */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showBottomFade ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {/* ============ Fixed Bottom Controls ============ */}
      <div className="flex-shrink-0">
        {/* Input with AnimatePresence for smooth height transition */}
        <AnimatePresence mode="wait">
          {showInput && (
            <motion.div
              key="input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSubmit}>
            <div className="bg-violet-50/30 dark:bg-violet-900/10 rounded-xl border border-violet-200/30 dark:border-violet-800/30 focus-within:border-violet-500 dark:focus-within:border-violet-500 transition-colors">
              <textarea
                ref={inputRef}
                rows={1}
                value={query}
                onChange={(e) => {
                  onQueryChange(e.target.value);
                  // Auto-grow and track height for loading preservation
                  e.target.style.height = 'auto';
                  const newHeight = e.target.scrollHeight;
                  e.target.style.height = newHeight + 'px';
                  setInputHeight(newHeight);
                }}
                onKeyDown={handleKeyDown}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                placeholder="Ask AI..."
                disabled={isLoading}
                style={{
                  height: isLoading && inputHeight ? inputHeight : undefined,
                  minHeight: '44px',
                }}
                className="w-full px-4 pt-3 pb-1 bg-transparent border-0 resize-none
                  outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500
                  disabled:opacity-50"
              />
              <div className="flex items-center justify-end gap-2 px-3 pb-2">
                {/* Right side controls (left reserved for future: attach, audio) */}
                <button
                  type="button"
                  onClick={onOpenDrawer}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  aria-label="Open expanded chat"
                  title="Open expanded chat"
                >
                  {/* Panel/drawer icon - distinct from send arrow */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18" />
                  </svg>
                </button>

                {/* Send button */}
                <motion.button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
                  className="p-2 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-400/30 dark:disabled:bg-zinc-600/30
                    disabled:cursor-not-allowed text-white rounded-full transition-colors"
                  aria-label="Send message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default PaletteContent;
