'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bell } from 'lucide-react';
import { CollapsedContent } from '@/lib/ai-types';
import { ANIMATIONS, LOADING_ANIMATION } from '@/lib/ai-constants';
import { ShimmerText } from './ShimmerText';

interface MiniBarContentProps {
  content: CollapsedContent;
  onExpand: () => void;
  onScrollToSuggestions?: () => void;
  onStartPokeAction?: () => void;  // When "Start" is tapped on a start poke
  onReminderAction?: () => void;   // When "View" is tapped on a reminder
  onCycleAlert?: () => void;       // When alert count is tapped to cycle
}

export function MiniBarContent({
  content,
  onExpand,
  onScrollToSuggestions,
  onStartPokeAction,
  onReminderAction,
  onCycleAlert,
}: MiniBarContentProps) {
  const isLoading = content.type === 'loading';
  const isNudge = content.type === 'nudge';
  const isStartPoke = content.type === 'start_poke';
  const isReminder = content.type === 'reminder';
  const isAlert = isStartPoke || isReminder;
  const isResponse = content.type === 'response';
  const isIdle = content.type === 'idle';
  const isSuggestionsReady = content.type === 'suggestionsReady';
  const isConfirmation = content.type === 'confirmation';
  const isPrompt = content.type === 'prompt';
  const isCancelled = content.type === 'cancelled';

  // Alert cycling info
  const alertCount = content.alertCount ?? 1;
  const currentAlertIndex = content.currentAlertIndex ?? 0;
  const hasMultipleAlerts = alertCount > 1;

  // Handle click: always expand Palette, and also scroll to StagingArea if suggestions ready
  const handleClick = () => {
    onExpand();
    // Additionally scroll to suggestions if they're ready (bonus convenience)
    if (isSuggestionsReady && onScrollToSuggestions) {
      onScrollToSuggestions();
    }
  };

  // Handle prompt pill click
  const handlePromptPillClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (content.prompt?.action) {
      content.prompt.action();
    }
  };

  // Handle alert cycle click
  const handleCycleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCycleAlert?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className={`h-12 px-6 sm:px-4 flex items-center gap-3 cursor-pointer ${isPrompt || isNudge || isAlert ? '!pr-[9px]' : ''}`}
      onClick={handleClick}
    >
      {/* Icon - Emoji for poke, Bell for reminder, Sparkles for AI */}
      <AnimatePresence mode="wait">
        <motion.div
          key={content.type}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: ANIMATIONS.contentFadeDuration }}
          className={`flex-shrink-0 ${isLoading ? 'animate-pulse-sparkle' : ''}`}
        >
          {isStartPoke ? (
            <span className="text-base leading-none" role="img" aria-label="Start poke">👉🏽</span>
          ) : isReminder ? (
            <Bell
              size={18}
              className="text-amber-500 dark:text-amber-400"
            />
          ) : (
            <Sparkles
              size={18}
              className="text-violet-500 dark:text-violet-400"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isLoading ? 'loading' : content.text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: ANIMATIONS.contentFadeDuration }}
          className="flex-1 text-left text-sm truncate"
        >
          {isLoading ? (
            <ShimmerText
              text="Thinking..."
              delay={LOADING_ANIMATION.pulseDelay}
              className="text-sm"
            />
          ) : (
            <span
              className={`
                ${isIdle ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}
                ${isNudge || isPrompt ? 'font-medium' : ''}
                ${isResponse ? 'text-violet-600 dark:text-violet-300' : ''}
                ${isSuggestionsReady ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}
                ${isConfirmation ? 'text-green-600 dark:text-green-400' : ''}
                ${isCancelled ? 'text-zinc-500 dark:text-zinc-400' : ''}
              `}
            >
              {content.text}
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Trailing element */}
      <AnimatePresence mode="wait">
        {/* Start Poke action - "Start" button + optional count */}
        {isStartPoke && onStartPokeAction ? (
          <motion.div
            key="start-poke-action"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-1.5"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartPokeAction();
              }}
              className="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full
                bg-violet-100 dark:bg-violet-900/40
                text-violet-700 dark:text-violet-300
                hover:bg-violet-200 dark:hover:bg-violet-800/50
                transition-colors"
            >
              Start
            </button>
            {hasMultipleAlerts && (
              <button
                onClick={handleCycleClick}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                ({currentAlertIndex + 1}/{alertCount})
              </button>
            )}
          </motion.div>
        ) : /* Reminder action - "View" button + optional count */
        isReminder && onReminderAction ? (
          <motion.div
            key="reminder-action"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-1.5"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReminderAction();
              }}
              className="flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-full
                bg-amber-100 dark:bg-amber-900/40
                text-amber-700 dark:text-amber-300
                hover:bg-amber-200 dark:hover:bg-amber-800/50
                transition-colors"
            >
              View
            </button>
            {hasMultipleAlerts && (
              <button
                onClick={handleCycleClick}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                ({currentAlertIndex + 1}/{alertCount})
              </button>
            )}
          </motion.div>
        ) : /* Prompt pill - slides in from right */
        isPrompt && content.prompt ? (
          <motion.button
            key="prompt-pill"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            onClick={handlePromptPillClick}
            className="flex-shrink-0 px-3 py-1.5 text-sm rounded-full
              bg-violet-100 dark:bg-violet-900/40
              text-violet-700 dark:text-violet-300
              hover:bg-violet-200 dark:hover:bg-violet-800/50
              transition-colors"
          >
            {content.prompt.pillIcon} {content.prompt.pillLabel}
          </motion.button>
        ) : content.action ? (
          // Nudge action pill - matches prompt pill styling
          <motion.button
            key="action"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="flex-shrink-0 px-3 py-1.5 text-sm rounded-full
              bg-violet-100 dark:bg-violet-900/40
              text-violet-700 dark:text-violet-300
              hover:bg-violet-200 dark:hover:bg-violet-800/50
              transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              content.action?.onClick();
            }}
          >
            {content.action.label}
          </motion.button>
        ) : isConfirmation || isCancelled ? (
          // No trailing icon for confirmation/cancelled (they fade out)
          null
        ) : isSuggestionsReady ? (
          // Up arrow for suggestions-ready (StagingArea is above MiniBar)
          <motion.svg
            key="suggestions-arrow"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="flex-shrink-0 text-amber-500 dark:text-amber-400"
          >
            <path
              d="M4 10L8 6L12 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        ) : (
          // Up chevron for expand (default)
          <motion.svg
            key="expand-chevron"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="flex-shrink-0 text-zinc-400 dark:text-zinc-500"
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
      </AnimatePresence>
    </motion.div>
  );
}

export default MiniBarContent;
