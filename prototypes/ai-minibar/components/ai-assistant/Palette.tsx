'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { AIResponse, QuickAction } from '@/lib/types';
import { HEIGHTS, SPRING_CONFIG } from '@/lib/constants';
import { QuickActions } from './QuickActions';
import { ResponseDisplay } from './ResponseDisplay';

interface PaletteProps {
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
}

export function Palette({
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
}: PaletteProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [dragY, setDragY] = useState(0);

  // Auto-focus input when palette opens
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle drag gesture for swipe-down to collapse
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If dragged down more than 50px with sufficient velocity, collapse
    if (info.offset.y > 50 || (info.offset.y > 20 && info.velocity.y > 300)) {
      onCollapse();
    }
    setDragY(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit();
      // Reset textarea height
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
    // Submit after a brief delay to show the query
    setTimeout(() => {
      onSubmit();
    }, 100);
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
      initial={{ height: HEIGHTS.collapsed }}
      animate={{ height: 'auto', y: 0 }}
      exit={{ height: HEIGHTS.collapsed }}
      transition={SPRING_CONFIG}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDrag={(_e, info) => setDragY(info.offset.y)}
      onDragEnd={handleDragEnd}
      className="w-full sm:w-[360px] bg-zinc-900/95 backdrop-blur-lg border border-zinc-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/30 touch-none"
      style={{
        maxHeight: HEIGHTS.expandedMax,
        opacity: Math.max(0.5, 1 - dragY / 200), // Fade slightly when dragging down
      }}
    >
      {/* Drag handle */}
      <div
        className="w-full py-3 flex justify-center cursor-grab active:cursor-grabbing"
      >
        <div className="w-10 h-1 rounded-full bg-zinc-600" />
      </div>

      <div className="px-4 pb-4 flex flex-col">
        {/* Content area - quick actions, loading, response */}
        <div className="flex-1 space-y-3 mb-3">
          {/* Quick actions (hide when loading or has response) */}
          <AnimatePresence>
            {!isLoading && !response && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <QuickActions
                  actions={quickActions}
                  onSelect={handleQuickAction}
                  disabled={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-4 flex items-center justify-center gap-2 text-sm text-zinc-400"
              >
                <span className="animate-spin">◐</span>
                <span>Thinking...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Response */}
          <AnimatePresence>
            {response && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-h-[30vh] overflow-y-auto"
              >
                <ResponseDisplay
                  response={response}
                  onAction={handleResponseAction}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input - anchored at bottom */}
        <form onSubmit={handleSubmit}>
          <div className="bg-zinc-800 rounded-xl border border-transparent focus-within:border-violet-500 transition-colors">
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
                outline-none text-sm text-zinc-100 placeholder-zinc-500
                disabled:opacity-50 min-h-[44px] max-h-[120px]"
            />
            <div className="flex items-center justify-end gap-2 px-3 pb-2">
              {/* Future: attach, mic buttons here */}
              <motion.button
                type="submit"
                disabled={!query.trim() || isLoading}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700
                  disabled:cursor-not-allowed text-white rounded-full transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
          </div>
        </form>

        {/* Footer - More help link */}
        <div className="flex justify-end pt-2">
          <motion.button
            onClick={onOpenDrawer}
            whileTap={{ scale: 0.95 }}
            className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            More help →
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default Palette;
