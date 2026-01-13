'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { AIMessage, QuickAction } from '@/lib/ai-types';
import { HEIGHTS, WIDTHS, getSpringConfig } from '@/lib/ai-constants';
import { useDeviceType } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ChatHistory } from './ChatHistory';
import { ShimmerText } from './ShimmerText';
import { QuickActions } from './QuickActions';

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
  const [dragY, setDragY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isHandleHovered, setIsHandleHovered] = useState(false);
  const deviceType = useDeviceType();
  const prefersReducedMotion = useReducedMotion();

  const isMobile = deviceType === 'mobile';
  const isDesktop = deviceType === 'desktop';
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

  // Handle drag gesture for swipe-down to close (mobile only)
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || (info.offset.y > 50 && info.velocity.y > 500)) {
      onClose();
    }
    setDragY(0);
  };

  // Animation variants based on device type
  const getAnimationProps = () => {
    if (isMobile) {
      return {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
      };
    }
    // Side drawer slides from right
    return {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
    };
  };

  // Drag props (only for mobile)
  const dragProps = isMobile
    ? {
        drag: 'y' as const,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.3 },
        onDrag: (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => setDragY(info.offset.y),
        onDragEnd: handleDragEnd,
      }
    : {};

  // Container styles based on device type
  const getContainerClassName = () => {
    const baseStyles = 'fixed z-50 flex flex-col shadow-xl shadow-black/10 dark:shadow-black/30';

    if (isMobile) {
      return `${baseStyles} inset-x-0 bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-300/50 dark:border-zinc-700/50 rounded-t-3xl touch-none`;
    }
    // Side drawer for tablet/desktop - solid background to match app header
    return `${baseStyles} right-0 top-0 bottom-0 bg-white dark:bg-[#0c0c0c] border-l border-zinc-200 dark:border-zinc-800 pt-[env(safe-area-inset-top)]`;
  };

  const getContainerStyle = () => {
    if (isMobile) {
      return {
        height: HEIGHTS.drawerHeight,
        opacity: Math.max(0.7, 1 - dragY / 300),
      };
    }
    return {
      width: WIDTHS.drawer,
    };
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <motion.div
      {...getAnimationProps()}
      transition={springConfig}
      {...dragProps}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className={getContainerClassName()}
      style={getContainerStyle()}
    >
        {/* Header - h-14 (56px) to match app header */}
        <div className={`flex-shrink-0 h-14 px-4 flex items-center border-b border-zinc-200 dark:border-transparent ${isMobile ? 'flex-col justify-center' : 'justify-between'}`}>
          {/* Animated drag handle (mobile only) - tap/hover to close */}
          {isMobile && (
            <button
              onClick={onClose}
              onMouseEnter={() => setIsHandleHovered(true)}
              onMouseLeave={() => setIsHandleHovered(false)}
              className="w-full py-2 flex justify-center cursor-pointer bg-transparent border-0"
              aria-label="Close drawer"
            >
              <motion.div className="relative w-10 h-1 flex">
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

          <div className={`flex items-center justify-between ${isMobile ? 'w-full' : 'w-full'}`}>
            <h2 id="drawer-title" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">AI Help</h2>
            <motion.button
              onClick={onClose}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              className="px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              Done
            </motion.button>
          </div>
        </div>

        {/* Messages area - flex col to bottom-align messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col">
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

        {/* Input area - with safe area padding on mobile for iPhone home bar */}
        <div className={`flex-shrink-0 p-4 ${isMobile ? 'pb-[calc(1rem+env(safe-area-inset-bottom))]' : ''}`}>
          <form onSubmit={handleSubmit}>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-transparent focus-within:border-violet-500 transition-colors">
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
                {/* Future: attach, mic buttons here */}
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
        </div>
      </motion.div>
  );
}

export default AIDrawer;
