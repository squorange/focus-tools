'use client';

import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIResponse, QuickAction, SuggestionsContent } from '@/lib/ai-types';
import { HEIGHT_TRANSITION } from '@/lib/ai-constants';
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
  onScrollToSuggestions?: () => void;
  // Auto-collapse control: prevents outdated content from persisting, but respects user engagement
  disableAutoCollapse?: boolean;  // True when user has shown intent to interact
  onManualInteraction?: () => void;  // Called when user signals intent (e.g., clicks "Ask AI")
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
  onScrollToSuggestions,
  disableAutoCollapse = false,
  onManualInteraction,
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
      }, 5000); // 5 second delay
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
    // Refinement 3: Use directSubmit to bypass input field population
    if (onDirectSubmit) {
      onDirectSubmit(action.query);
    } else {
      // Fallback to old behavior
      onQueryChange(action.query);
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
      {/* Content area - scrollable with gradient fades */}
      <div className="relative flex-1 min-h-0 mb-3">
        {/* Top gradient fade (visible when scrolled down) */}
        <div
          className={`absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white dark:from-zinc-900 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showTopFade ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto max-h-[calc(50vh-180px)] scrollbar-hide"
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
                {!isLoading && !response && (
                  <motion.div
                    key="quick-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <QuickActions
                      actions={quickActions}
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
                          I've prepared {(response.content as SuggestionsContent).suggestions?.length || 0} suggestions.
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
          {/* SUGGESTIONS: Go to suggestions + Ask AI */}
          {hasSuggestionsResponse && (
            <>
              <button
                onClick={() => {
                  cancelAutoCollapse();
                  onScrollToSuggestions?.();
                  onDismiss();
                  onCollapse?.();
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300
                  hover:bg-violet-200 dark:hover:bg-violet-800/40"
              >
                Go to suggestions ↑
              </button>
              <button
                onClick={() => {
                  cancelAutoCollapse();
                  onManualInteraction?.();
                  setShowInput(true);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                  hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Ask AI
              </button>
            </>
          )}

          {/* TEXT / EXPLANATION: Got it + Ask AI */}
          {hasContentResponse && (
            <>
              <button
                onClick={() => {
                  cancelAutoCollapse();
                  onDismiss();
                  onCollapse?.();
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                  hover:bg-zinc-200 dark:hover:bg-zinc-700"
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

          {/* ERROR: Retry + Ask AI */}
          {hasErrorResponse && (
            <>
              <button
                onClick={() => {
                  cancelAutoCollapse();
                  onManualInteraction?.();
                  onSubmit(); // Retry the query
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300
                  hover:bg-violet-200 dark:hover:bg-violet-800/40"
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
                  bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                  hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Ask AI
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
              <form onSubmit={handleSubmit} className="mt-2">
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
