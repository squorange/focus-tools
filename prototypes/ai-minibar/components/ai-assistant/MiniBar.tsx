'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CollapsedContent } from '@/lib/types';
import { ANIMATIONS } from '@/lib/constants';

interface MiniBarProps {
  content: CollapsedContent;
  onExpand: () => void;
  isAnimating?: boolean;
}

export function MiniBar({ content, onExpand, isAnimating = false }: MiniBarProps) {
  const isLoading = content.type === 'loading';
  const isNudge = content.type === 'nudge';
  const isResponse = content.type === 'response';
  const isIdle = content.type === 'idle';

  return (
    <motion.button
      onClick={onExpand}
      disabled={isAnimating}
      className={`
        w-full sm:w-[360px] h-12 px-4 flex items-center gap-3
        bg-zinc-900/80 backdrop-blur-lg
        border border-zinc-700/50
        rounded-full
        shadow-lg shadow-black/20
        transition-colors
        ${isAnimating ? 'pointer-events-none' : 'active:bg-zinc-800/80'}
      `}
      whileTap={{ scale: 0.98 }}
    >
      {/* Icon */}
      <AnimatePresence mode="wait">
        <motion.span
          key={content.type}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: ANIMATIONS.contentFadeDuration }}
          className={`text-lg ${isLoading ? 'animate-spin' : ''}`}
        >
          {content.icon || '✨'}
        </motion.span>
      </AnimatePresence>

      {/* Text */}
      <AnimatePresence mode="wait">
        <motion.span
          key={content.text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: ANIMATIONS.contentFadeDuration }}
          className={`
            flex-1 text-left text-sm truncate
            ${isIdle ? 'text-zinc-500' : 'text-zinc-200'}
            ${isNudge ? 'font-medium' : ''}
            ${isResponse ? 'text-violet-300' : ''}
          `}
        >
          {content.text}
        </motion.span>
      </AnimatePresence>

      {/* Action button (for nudges) or chevron */}
      {content.action ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-3 py-1 text-xs font-medium bg-violet-600 text-white rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            content.action?.onClick();
          }}
        >
          {content.action.label}
        </motion.span>
      ) : (
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-zinc-500"
          animate={{ rotate: isLoading ? 0 : 0 }}
        >
          <path
            d="M4 10L8 6L12 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      )}
    </motion.button>
  );
}

export default MiniBar;
