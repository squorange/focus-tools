'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AIAssistantContext, ContextualPrompt } from '@/lib/ai-types';
import { PROMPT_TIMING } from '@/lib/ai-constants';
import { AI_ACTIONS } from '@/lib/ai-actions';

// Duration to show contextual prompt before cycling back to idle
const PROMPT_DISPLAY_DURATION = 8000; // 8 seconds

// ============ Prompt Configuration ============

interface PromptConfig {
  delay: number;
  condition: (context: PromptContext) => boolean;
  getPrompt: (context: PromptContext, handlers: PromptHandlers) => ContextualPrompt;
}

interface PromptContext {
  // Task Detail context
  taskStepCount?: number;
  isInQueue?: boolean;      // Is task in focus queue?
  hasEstimate?: boolean;    // Does task have estimatedMinutes?

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
    condition: () => true,  // Always show contextual prompt (content varies by state)
    getPrompt: (ctx, handlers) => {
      // No steps → Break down
      if ((ctx.taskStepCount ?? 0) === 0) {
        return {
          text: 'Need help?',
          pillLabel: AI_ACTIONS.taskDetail.breakdown.label,
          pillIcon: AI_ACTIONS.taskDetail.breakdown.icon,
          action: () => handlers.submitQuery(AI_ACTIONS.taskDetail.breakdown.query),
        };
      }
      // In queue → Help me start
      if (ctx.isInQueue) {
        return {
          text: 'Need help?',
          pillLabel: AI_ACTIONS.focusMode.helpMeStart.label,
          pillIcon: AI_ACTIONS.focusMode.helpMeStart.icon,
          action: () => handlers.submitQuery(AI_ACTIONS.focusMode.helpMeStart.query),
        };
      }
      // Has steps, no estimate → Estimate
      if (!ctx.hasEstimate) {
        return {
          text: 'Need help?',
          pillLabel: AI_ACTIONS.taskDetail.estimate.label,
          pillIcon: AI_ACTIONS.taskDetail.estimate.icon,
          action: () => handlers.submitQuery(AI_ACTIONS.taskDetail.estimate.query),
        };
      }
      // Default: What next?
      return {
        text: 'Need help?',
        pillLabel: AI_ACTIONS.queue.whatNext.label,
        pillIcon: AI_ACTIONS.queue.whatNext.icon,
        action: () => handlers.submitQuery(AI_ACTIONS.queue.whatNext.query),
      };
    },
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
  search: null,  // Skip - uses quick actions instead
  step: null,    // Skip - step targeting uses quick actions in palette
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
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);  // Timer to hide prompt after display
  const hasShownRef = useRef(false);  // Track if we've shown prompt for this context entry

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
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

        // Set timer to cycle back to idle after display duration (Issue 9 fix)
        hideTimerRef.current = setTimeout(() => {
          setShowPrompt(false);
          setPrompt(null);
          // Note: Don't reset hasShownRef - only show once per context entry
        }, PROMPT_DISPLAY_DURATION);
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

  // Reset when step count changes (e.g., after breakdown accepted or manual step added)
  // This allows the prompt to re-evaluate with appropriate content
  const prevStepCountRef = useRef(promptContext.taskStepCount);
  useEffect(() => {
    if (promptContext.taskStepCount !== prevStepCountRef.current) {
      hasShownRef.current = false;
      setShowPrompt(false);
      setPrompt(null);
      prevStepCountRef.current = promptContext.taskStepCount;
    }
  }, [promptContext.taskStepCount]);

  return {
    showPrompt,
    prompt,
    resetPrompt,
  };
}

export type { PromptContext, PromptHandlers };
