'use client';

import { motion } from 'framer-motion';
import {
  AIResponse,
  TextContent,
  SuggestionsContent,
  ExplanationContent,
  ResponseAction,
} from '@/lib/types';
import { ANIMATIONS } from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ResponseDisplayProps {
  response: AIResponse;
  onAction?: (actionId: string) => void;
  onOpenDrawer?: () => void;
}

export function ResponseDisplay({ response, onAction, onOpenDrawer }: ResponseDisplayProps) {
  const prefersReducedMotion = useReducedMotion();

  const renderContent = () => {
    switch (response.type) {
      case 'text':
        return <TextResponse content={response.content as TextContent} />;
      case 'suggestions':
        return <SuggestionsResponse content={response.content as SuggestionsContent} prefersReducedMotion={prefersReducedMotion} />;
      case 'explanation':
        return <ExplanationResponse content={response.content as ExplanationContent} />;
      case 'error':
        return <ErrorResponse content={response.content as TextContent} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      className="space-y-3"
      aria-live="polite"
    >
      {renderContent()}

      {response.actions && response.actions.length > 0 && (
        <ResponseActions actions={response.actions} onAction={onAction} onOpenDrawer={onOpenDrawer} prefersReducedMotion={prefersReducedMotion} />
      )}
    </motion.div>
  );
}

// ============ Text Response ============

function TextResponse({ content }: { content: TextContent }) {
  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
      {content.text}
    </p>
  );
}

// ============ Suggestions Response ============

function SuggestionsResponse({ content, prefersReducedMotion }: { content: SuggestionsContent; prefersReducedMotion: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{content.message}</p>
      <ul className="space-y-1.5">
        {content.suggestions.map((suggestion, index) => (
          <motion.li
            key={suggestion.id}
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : index * ANIMATIONS.responseDelay }}
            className="flex items-start gap-2 text-sm"
          >
            <span className="mt-0.5 w-5 h-5 flex items-center justify-center rounded border border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500 text-xs">
              {index + 1}
            </span>
            <div className="flex-1">
              <span className="text-zinc-800 dark:text-zinc-200">{suggestion.text}</span>
              {suggestion.substeps && suggestion.substeps.length > 0 && (
                <ul className="mt-1 ml-2 space-y-0.5">
                  {suggestion.substeps.map((substep) => (
                    <li key={substep.id} className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                      {substep.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

// ============ Explanation Response ============

function ExplanationResponse({ content }: { content: ExplanationContent }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{content.title}</h4>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
        {content.explanation}
      </p>
    </div>
  );
}

// ============ Error Response ============

function ErrorResponse({ content }: { content: TextContent }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
      <span className="text-red-400">⚠️</span>
      <p className="text-sm text-red-300">{content.text}</p>
    </div>
  );
}

// ============ Response Actions ============

function ResponseActions({
  actions,
  onAction,
  onOpenDrawer,
  prefersReducedMotion,
}: {
  actions: ResponseAction[];
  onAction?: (actionId: string) => void;
  onOpenDrawer?: () => void;
  prefersReducedMotion: boolean;
}) {
  return (
    <div className="flex gap-2 items-center">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          onClick={() => onAction?.(action.id)}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          className={`
            px-4 py-2 text-sm font-medium rounded-lg
            transition-colors
            ${
              action.variant === 'primary'
                ? 'bg-violet-600 hover:bg-violet-500 text-white'
                : action.variant === 'secondary'
                ? 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }
          `}
        >
          {action.label}
        </motion.button>
      ))}
      {/* Drawer button - icon only, right-aligned */}
      {onOpenDrawer && (
        <motion.button
          onClick={onOpenDrawer}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          aria-label="Open full chat"
          className="ml-auto p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M15 3v18" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

export default ResponseDisplay;
