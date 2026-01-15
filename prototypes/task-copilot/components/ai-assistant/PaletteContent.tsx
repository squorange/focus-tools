'use client';

import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIResponse, QuickAction, SuggestionsContent, RecommendationContent } from '@/lib/ai-types';
import { AITargetContext } from '@/lib/types';
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
      className="px-6 pb-6 sm:px-4 sm:pb-4 flex flex-col h-full"
    >
      {/* Target banner - shows when step is targeted (reply arrow style) */}
      {aiTargetContext && !isLoading && !response && (
        <div className="flex items-center justify-between px-3 py-2 mb-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            {/* Reply arrow icon */}
            <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0 text-zinc-400">
              <path d="M4 2v8h8" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 7l3 3-3 3" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
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

      {/* Content area - scrollable with gradient fades */}
      <div className="relative flex-1 min-h-0 mb-2">
        {/* Top gradient fade (visible when scrolled down) */}
        <div
          className={`absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white dark:from-zinc-900 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showTopFade ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto overflow-x-visible max-h-[calc(50vh-180px)] scrollbar-hide"
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
                      <div className="py-2">
                        <p className="text-base text-zinc-600 dark:text-zinc-400 text-left">
                          {(response.content as SuggestionsContent).message}
                        </p>
                      </div>
                    )}

                    {/* Recommendation: Show task suggestion card */}
                    {hasRecommendationResponse && (
                      <div className="space-y-2 text-left overflow-visible">
                        <p className="text-base text-zinc-500 dark:text-zinc-400 whitespace-nowrap">I&apos;d suggest...</p>
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
        {/* Button row with AnimatePresence for smooth height transition */}
        <AnimatePresence mode="wait">
          {response && !showInput && !isLoading && (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-start gap-3 pt-2">
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
                  text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600
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
                  text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300
                  hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                  text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300
                  hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Dismiss
              </button>
            </>
          )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-transparent focus-within:border-violet-500 transition-colors">
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
                  className="p-2 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700
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
