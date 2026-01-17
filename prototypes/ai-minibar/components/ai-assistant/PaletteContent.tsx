'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIResponse, QuickAction } from '@/lib/types';
import { HEIGHT_TRANSITION } from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { QuickActions } from './QuickActions';
import { ResponseDisplay } from './ResponseDisplay';

// Baseline height matches quick actions row
const BASELINE_HEIGHT = 48;

interface PaletteContentProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  response: AIResponse | null;
  quickActions: QuickAction[];
  onOpenDrawer: () => void;
  onAccept: () => void;
  onDismiss: () => void;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
}

export function PaletteContent({
  query,
  onQueryChange,
  onSubmit,
  isLoading,
  response,
  quickActions,
  onOpenDrawer,
  onAccept,
  onDismiss,
  onInputFocus,
  onInputBlur,
}: PaletteContentProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Get motion-safe transition config
  const heightTransition = prefersReducedMotion ? { duration: 0 } : HEIGHT_TRANSITION;

  // Measure content height when response changes (for smooth loading transitions)
  useEffect(() => {
    if (response && contentRef.current && !isLoading) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [response, isLoading]);

  // Auto-focus input when palette opens
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
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
    onQueryChange(action.query);
    setTimeout(() => onSubmit(), 100);
  };

  const handleResponseAction = (actionId: string) => {
    if (actionId === 'accept' || actionId === 'gotit') {
      onAccept();
    } else if (actionId === 'dismiss') {
      onDismiss();
    } else if (actionId === 'retry') {
      onSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, delay: 0.05 }}
      className="px-4 pb-4 flex flex-col"
    >
      {/* Content area - animated height container for smooth loading transitions */}
      <motion.div
        className="mb-3 overflow-hidden scrollbar-hide"
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

            {/* Loading state - fills container height */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
                style={{ height: contentHeight ?? BASELINE_HEIGHT }}
                aria-live="polite"
              >
                <span className={prefersReducedMotion ? '' : 'animate-spin'}>◐</span>
                <span>Thinking...</span>
              </motion.div>
            )}

            {/* Response */}
            {response && !isLoading && (
              <motion.div
                key="response"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="max-h-[30vh] overflow-y-auto"
              >
                <ResponseDisplay
                  response={response}
                  onAction={handleResponseAction}
                  onOpenDrawer={onOpenDrawer}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Input - anchored at bottom */}
      <form onSubmit={handleSubmit}>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-transparent focus-within:border-violet-500 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            placeholder="Ask AI..."
            disabled={isLoading}
            className="w-full px-4 pt-3 pb-1 bg-transparent border-0 resize-none
              outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500
              disabled:opacity-50 min-h-[44px] max-h-[120px]"
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
  );
}

export default PaletteContent;
