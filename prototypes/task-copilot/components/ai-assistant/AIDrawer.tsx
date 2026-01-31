'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AIMessage, QuickAction } from '@/lib/ai-types';
import { HEIGHTS, WIDTHS, getSpringConfig } from '@/lib/ai-constants';
import { useDeviceType } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ChatHistory } from './ChatHistory';
import { ShimmerText } from './ShimmerText';
import { QuickActions } from './QuickActions';
import BottomSheet from '@/components/shared/BottomSheet';

interface AIDrawerProps {
  messages: AIMessage[];
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  onDirectSubmit?: (query: string) => void;  // For quick actions
  isLoading: boolean;
  onClose: () => void;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  quickActions?: QuickAction[];  // For empty state
  onRequestRecommendation?: () => void;  // For "What next?" quick action
}

export function AIDrawer({
  messages,
  query,
  onQueryChange,
  onSubmit,
  onDirectSubmit,
  isLoading,
  onClose,
  onInputFocus,
  onInputBlur,
  quickActions = [],
  onRequestRecommendation,
}: AIDrawerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const deviceType = useDeviceType();
  const prefersReducedMotion = useReducedMotion();

  const isMobile = deviceType === 'mobile';
  const springConfig = getSpringConfig(prefersReducedMotion);

  // Wait for mount to avoid SSR hydration mismatch with media queries
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-focus input when drawer opens
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit();
      // Reset textarea height after submit
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits, Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null;

  const drawerContent = (
    <>
      {/* Header - h-14 (56px) to match app header - no bg to inherit from parent container */}
      <div className="flex-shrink-0 h-14 px-4 flex items-center justify-between">
        <h2 id="drawer-title" className="sr-only">AI Assistant</h2>
        <div />
        <motion.button
          onClick={onClose}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          className="px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          Done
        </motion.button>
      </div>

      {/* Messages area - flex col to bottom-align messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Start a conversation with AI...
            </p>
            {/* Quick action pills for empty state - horizontal like palette */}
            {quickActions.length > 0 && (
              <QuickActions
                actions={quickActions}
                onSelect={(action) => {
                  // Special case: "What next?" uses recommendation handler
                  if (action.id === 'next' && onRequestRecommendation) {
                    onRequestRecommendation();
                  } else if (onDirectSubmit) {
                    onDirectSubmit(action.query);
                  }
                }}
                disabled={isLoading}
              />
            )}
          </div>
        ) : (
          <div className="mt-auto">
            <ChatHistory messages={messages} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Loading indicator - styled as assistant message bubble for consistency */}
      {isLoading && (
        <div className="px-4 py-2 flex justify-start" aria-live="polite">
          <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-md bg-zinc-100 dark:bg-zinc-800">
            <ShimmerText text="Thinking..." className="text-sm" />
          </div>
        </div>
      )}

      {/* Input area - uses CSS var from BottomSheet for keyboard-aware safe area */}
      <div className="flex-shrink-0 p-4" style={{ paddingBottom: "calc(1rem + var(--safe-area-bottom, env(safe-area-inset-bottom)))" }}>
        <form onSubmit={handleSubmit}>
          <div className="bg-violet-50/30 dark:bg-violet-900/10 rounded-xl border border-violet-200/30 dark:border-violet-800/30 focus-within:border-violet-500 dark:focus-within:border-violet-500 transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
              onKeyDown={handleKeyDown}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
              placeholder="Type a message..."
              disabled={isLoading}
              className="w-full px-4 pt-3 pb-1 bg-transparent border-0 resize-none
                outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500
                disabled:opacity-50 min-h-[44px] max-h-[200px]"
            />
            <div className="flex items-center justify-end gap-2 px-3 pb-2">
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
      </div>
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={true} onClose={onClose} height={HEIGHTS.drawerHeight}>
        {drawerContent}
      </BottomSheet>
    );
  }

  // Desktop: side drawer
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={springConfig}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed z-50 flex flex-col shadow-xl right-0 top-0 bottom-0 bg-white dark:bg-zinc-900 border-l border-zinc-200/50 dark:border-zinc-700/30 pt-[env(safe-area-inset-top)]"
      style={{ width: WIDTHS.drawer }}
    >
      {drawerContent}
    </motion.div>
  );
}

export default AIDrawer;
