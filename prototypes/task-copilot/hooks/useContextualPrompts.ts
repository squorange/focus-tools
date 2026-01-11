'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AIAssistantContext, ContextualPrompt } from '@/lib/ai-types';
import { PROMPT_TIMING } from '@/lib/ai-constants';
import { AI_ACTIONS } from '@/lib/ai-actions';

// ============ Prompt Configuration ============

interface PromptConfig {
  delay: number;
  condition: (context: PromptContext) => boolean;
  getPrompt: (context: PromptContext, handlers: PromptHandlers) => ContextualPrompt;
}

interface PromptContext {
  // Task Detail context
  taskStepCount?: number;

  // Focus Mode context
  currentStepCompleted?: boolean;

  // Queue context
  queueItemCount?: number;
  topQueueItemId?: string;
  topQueueItemTitle?: string;
}

interface PromptHandlers {
  submitQuery: (query: string) => void;
  navigateToFocusMode: (queueItemId: string) => void;
  requestRecommendation: () => void;
}

const PROMPT_CONFIGS: Record<AIAssistantContext, PromptConfig | null> = {
  focusMode: {
    delay: PROMPT_TIMING.focusMode,
    condition: (ctx) => ctx.currentStepCompleted === false,
    getPrompt: (_ctx, handlers) => ({
      text: 'Need help?',
      pillLabel: AI_ACTIONS.focusMode.helpMeStart.label,
      pillIcon: AI_ACTIONS.focusMode.helpMeStart.icon,
      action: () => handlers.submitQuery(AI_ACTIONS.focusMode.helpMeStart.query),
    }),
  },
  taskDetail: {
    delay: PROMPT_TIMING.taskDetail,
    condition: (ctx) => ctx.taskStepCount === 0,
    getPrompt: (_ctx, handlers) => ({
      text: 'Need help?',
      pillLabel: AI_ACTIONS.taskDetail.breakdown.label,
      pillIcon: AI_ACTIONS.taskDetail.breakdown.icon,
      action: () => handlers.submitQuery(AI_ACTIONS.taskDetail.breakdown.query),
    }),
  },
  queue: {
    delay: PROMPT_TIMING.queue,
    condition: (ctx) => (ctx.queueItemCount ?? 0) > 0 && !!ctx.topQueueItemId,
    getPrompt: (_ctx, handlers) => ({
      text: 'Need help?',
      pillLabel: AI_ACTIONS.queue.whatNext.label,
      pillIcon: AI_ACTIONS.queue.whatNext.icon,
      action: () => {
        handlers.requestRecommendation();
      },
    }),
  },
  inbox: null,   // Skip - no AI backend
  global: null,  // Skip - too generic
};

// ============ Hook ============

interface UseContextualPromptsProps {
  context: AIAssistantContext;
  promptContext: PromptContext;
  handlers: PromptHandlers;
  enabled?: boolean;  // Allow disabling (e.g., when Palette is open)
}

interface UseContextualPromptsReturn {
  showPrompt: boolean;
  prompt: ContextualPrompt | null;
  resetPrompt: () => void;
}

export function useContextualPrompts({
  context,
  promptContext,
  handlers,
  enabled = true,
}: UseContextualPromptsProps): UseContextualPromptsReturn {
  const [showPrompt, setShowPrompt] = useState(false);
  const [prompt, setPrompt] = useState<ContextualPrompt | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownRef = useRef(false);  // Track if we've shown prompt for this context entry

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset prompt state
  const resetPrompt = useCallback(() => {
    clearTimer();
    setShowPrompt(false);
    setPrompt(null);
    hasShownRef.current = false;
  }, [clearTimer]);

  // Main effect: manage prompt lifecycle
  useEffect(() => {
    // Clear any existing timer
    clearTimer();

    // Get config for this context
    const config = PROMPT_CONFIGS[context];

    // Early exit conditions
    if (!config || !enabled || hasShownRef.current) {
      return;
    }

    // Check if condition is met
    if (!config.condition(promptContext)) {
      return;
    }

    // Set timer to show prompt after delay
    timerRef.current = setTimeout(() => {
      // Re-check condition (state may have changed)
      if (config.condition(promptContext)) {
        const newPrompt = config.getPrompt(promptContext, handlers);
        setPrompt(newPrompt);
        setShowPrompt(true);
        hasShownRef.current = true;  // Mark as shown
      }
    }, config.delay);

    return () => clearTimer();
  }, [context, promptContext, handlers, enabled, clearTimer]);

  // Reset when context changes (user navigated to different view)
  useEffect(() => {
    hasShownRef.current = false;
    setShowPrompt(false);
    setPrompt(null);
  }, [context]);

  return {
    showPrompt,
    prompt,
    resetPrompt,
  };
}

export type { PromptContext, PromptHandlers };
