'use client';

import { useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  AIAssistantState,
  AIAssistantContext,
  AIAction,
  AIResponse,
  CollapsedContent,
  AIMessage,
  QuickAction,
  AISubmitResult,
} from '@/lib/ai-types';
import { QUICK_ACTIONS_BY_CONTEXT, ANIMATIONS } from '@/lib/ai-constants';
import { MOCK_COLLAPSED, getRandomDelay, MOCK_RESPONSES } from '@/lib/mock-responses';

// ============ Initial State ============

const createInitialState = (context: AIAssistantContext): AIAssistantState => ({
  mode: 'collapsed',
  context,
  collapsedContent: MOCK_COLLAPSED.idle,
  query: '',
  isLoading: false,
  response: null,
  messages: [],
  error: null,
});

// ============ Reducer ============

function aiAssistantReducer(state: AIAssistantState, action: AIAction): AIAssistantState {
  switch (action.type) {
    case 'EXPAND':
      if (state.mode === 'collapsed') {
        return { ...state, mode: 'expanded' };
      }
      return state;

    case 'COLLAPSE':
      if (state.mode === 'expanded') {
        // If loading, preserve loading state in minibar
        if (state.isLoading) {
          return {
            ...state,
            mode: 'collapsed',
            collapsedContent: MOCK_COLLAPSED.loading,
          };
        }
        // If there's a response, preserve existing collapsedContent (set by RECEIVE_RESPONSE with correct count)
        if (state.response) {
          return {
            ...state,
            mode: 'collapsed',
            // Preserve collapsedContent - it was set with correct count by RECEIVE_RESPONSE
          };
        }
        return {
          ...state,
          mode: 'collapsed',
          collapsedContent: MOCK_COLLAPSED.idle,
        };
      }
      return state;

    case 'OPEN_DRAWER':
      // Transfer current response to messages if exists
      const newMessages: AIMessage[] = [...state.messages];
      if (state.query && state.response) {
        // Add user message
        newMessages.push({
          id: crypto.randomUUID(),
          role: 'user',
          content: state.query,
          timestamp: Date.now() - 1000,
        });
        // Add assistant message
        newMessages.push({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: state.response.type === 'text'
            ? (state.response.content as { text: string }).text
            : JSON.stringify(state.response.content),
          timestamp: Date.now(),
          response: state.response,
        });
      }
      return {
        ...state,
        mode: 'drawer',
        messages: newMessages,
        query: '',
        response: null,
      };

    case 'CLOSE_DRAWER':
      return {
        ...state,
        mode: 'collapsed',
        // Preserve loading state when closing drawer mid-request
        collapsedContent: state.isLoading ? MOCK_COLLAPSED.loading : MOCK_COLLAPSED.idle,
      };

    case 'SET_QUERY':
      return { ...state, query: action.query };

    case 'SUBMIT_QUERY':
      return {
        ...state,
        isLoading: true,
        collapsedContent: MOCK_COLLAPSED.loading,
      };

    case 'RECEIVE_RESPONSE':
      // Add to messages if in drawer mode
      const updatedMessages = state.mode === 'drawer'
        ? [
            ...state.messages,
            {
              id: crypto.randomUUID(),
              role: 'user' as const,
              content: state.query,
              timestamp: Date.now() - 500,
            },
            {
              id: crypto.randomUUID(),
              role: 'assistant' as const,
              content: action.response.type === 'text'
                ? (action.response.content as { text: string }).text
                : JSON.stringify(action.response.content),
              timestamp: Date.now(),
              response: action.response,
            },
          ]
        : state.messages;

      // Use provided collapsedContent if available, otherwise generate from response
      const defaultCollapsedContent: CollapsedContent = {
        type: 'response',
        text: action.response.type === 'suggestions'
          ? 'Suggestions ready — tap to review'  // Generic text, actual count in provided collapsedContent
          : 'Response ready',
        icon: '✨',
      };

      return {
        ...state,
        mode: state.mode === 'drawer' ? 'drawer' : 'expanded',  // Auto-expand on response (preserve drawer)
        isLoading: false,
        response: action.response,
        query: '',  // Refinement 2: Always clear query after receiving response
        messages: updatedMessages,
        collapsedContent: action.collapsedContent || defaultCollapsedContent,
      };

    case 'LOADING_COMPLETE':
      // Clear loading state without setting response - used when structured response
      // was handled externally (e.g., suggestions went to staging area)
      // If collapsedContent is provided, set it atomically with clearing loading
      // Auto-expand to palette so user can see the status message
      return {
        ...state,
        isLoading: false,
        query: '',
        mode: 'expanded',  // Auto-expand palette when structured response arrives
        ...(action.collapsedContent ? { collapsedContent: action.collapsedContent } : {}),
      };

    case 'ACCEPT_SUGGESTIONS':
      return {
        ...state,
        response: null,
        query: '',
        collapsedContent: {
          type: 'response',
          text: '✓ Steps added',
          icon: '✨',
        },
      };

    case 'DISMISS_RESPONSE':
      return {
        ...state,
        response: null,
        query: '',
        collapsedContent: MOCK_COLLAPSED.idle,
      };

    case 'SET_CONTEXT':
      return { ...state, context: action.context };

    case 'SET_NUDGE':
      return { ...state, collapsedContent: action.nudge };

    case 'CLEAR_NUDGE':
      return { ...state, collapsedContent: MOCK_COLLAPSED.idle };

    case 'SET_COLLAPSED_CONTENT':
      return { ...state, collapsedContent: action.content };

    case 'ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
        response: {
          type: 'error',
          content: { text: action.error },
          actions: [
            { id: 'retry', label: 'Retry', variant: 'primary', onClick: () => {} },
          ],
        },
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    // Refinement 2: Clear query after submission
    case 'CLEAR_QUERY':
      return { ...state, query: '' };

    // Refinement 7: Reset appearance but keep drawer history
    case 'RESET':
      return {
        ...state,
        mode: 'collapsed',
        response: null,
        query: '',
        isLoading: false,
        collapsedContent: MOCK_COLLAPSED.idle,
        // Note: messages (drawer history) is preserved
      };

    // Issue 10: Sync messages from external source (task or queue)
    case 'SYNC_MESSAGES':
      return { ...state, messages: action.messages };

    // Issue 10: Clear messages (fresh UI)
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };

    // Escape key cancellation - stay in place with brief "Cancelled" feedback
    case 'CANCEL_REQUEST':
      return {
        ...state,
        isLoading: false,
        query: '',
        // Stay in expanded mode (don't collapse)
        collapsedContent: {
          type: 'cancelled' as CollapsedContent['type'],
          text: 'Cancelled',
          icon: '✕',
        },
      };

    default:
      return state;
  }
}

// ============ Hook ============

interface UseAIAssistantOptions {
  initialContext?: AIAssistantContext;
  defaultIdleContent?: CollapsedContent;  // Contextual idle status (e.g., "3 tasks today")
  onSubmit?: (query: string, context: AIAssistantContext) => Promise<AISubmitResult>;  // Returns response + optional collapsedContent
  onAcceptSuggestions?: (response: AIResponse) => void;
}

export function useAIAssistant(options: UseAIAssistantOptions = {}) {
  const {
    initialContext = 'global',
    defaultIdleContent,
    onSubmit,
    onAcceptSuggestions,
  } = options;

  // Use contextual idle content if provided, otherwise default
  const idleContent = defaultIdleContent ?? MOCK_COLLAPSED.idle;

  const [state, dispatch] = useReducer(
    aiAssistantReducer,
    initialContext,
    createInitialState
  );

  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============ Actions ============

  const expand = useCallback(() => dispatch({ type: 'EXPAND' }), []);
  const collapse = useCallback(() => dispatch({ type: 'COLLAPSE' }), []);
  const openDrawer = useCallback(() => dispatch({ type: 'OPEN_DRAWER' }), []);
  const closeDrawer = useCallback(() => {
    dispatch({ type: 'CLOSE_DRAWER' });
    // Set contextual idle content after closing
    dispatch({ type: 'SET_COLLAPSED_CONTENT', content: idleContent });
  }, [idleContent]);

  const setQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', query });
  }, []);

  // Refinement 2: Clear query after submission
  const clearQuery = useCallback(() => {
    dispatch({ type: 'CLEAR_QUERY' });
  }, []);

  // Refinement 7: Reset appearance but keep drawer history
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    // Set contextual idle content after reset
    dispatch({ type: 'SET_COLLAPSED_CONTENT', content: idleContent });
  }, [idleContent]);

  // Cancel in-flight request (Escape key)
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    dispatch({ type: 'CANCEL_REQUEST' });
    // After brief "Cancelled" feedback, return to idle
    setTimeout(() => {
      dispatch({ type: 'SET_COLLAPSED_CONTENT', content: idleContent });
    }, 1500);
  }, [idleContent]);

  const submitQuery = useCallback(async () => {
    if (!state.query.trim()) return;

    dispatch({ type: 'SUBMIT_QUERY' });

    try {
      let result: AISubmitResult;

      if (onSubmit) {
        result = await onSubmit(state.query, state.context);
      } else {
        // Mock response based on query content
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

        const query = state.query.toLowerCase();
        let response: AIResponse;
        if (query.includes('break') || query.includes('step')) {
          response = MOCK_RESPONSES.breakdown;
        } else if (query.includes('next') || query.includes('what')) {
          response = MOCK_RESPONSES.whatNext;
        } else if (query.includes('explain') || query.includes('mean')) {
          response = MOCK_RESPONSES.explain;
        } else if (query.includes('stuck')) {
          response = MOCK_RESPONSES.stuck;
        } else {
          response = MOCK_RESPONSES.whatNext;
        }
        result = { response };
      }

      // null response means structured data was handled externally (e.g., staging area)
      // Pass collapsedContent to either action if provided
      if (result.response) {
        dispatch({ type: 'RECEIVE_RESPONSE', response: result.response, collapsedContent: result.collapsedContent });
      } else {
        dispatch({ type: 'LOADING_COMPLETE', collapsedContent: result.collapsedContent });
      }
    } catch (error) {
      dispatch({ type: 'ERROR', error: error instanceof Error ? error.message : 'Something went wrong' });
    }
  }, [state.query, state.context, onSubmit]);

  // Refinement 3: Direct submit bypasses input field population
  const directSubmit = useCallback(async (query: string) => {
    if (!query.trim()) return;

    dispatch({ type: 'SUBMIT_QUERY' });

    try {
      let result: AISubmitResult;

      if (onSubmit) {
        result = await onSubmit(query, state.context);
      } else {
        // Mock response based on query content
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

        const queryLower = query.toLowerCase();
        let response: AIResponse;
        if (queryLower.includes('break') || queryLower.includes('step')) {
          response = MOCK_RESPONSES.breakdown;
        } else if (queryLower.includes('next') || queryLower.includes('what')) {
          response = MOCK_RESPONSES.whatNext;
        } else if (queryLower.includes('explain') || queryLower.includes('mean')) {
          response = MOCK_RESPONSES.explain;
        } else if (queryLower.includes('stuck')) {
          response = MOCK_RESPONSES.stuck;
        } else {
          response = MOCK_RESPONSES.whatNext;
        }
        result = { response };
      }

      // null response means structured data was handled externally (e.g., staging area)
      // Pass collapsedContent to either action if provided
      if (result.response) {
        dispatch({ type: 'RECEIVE_RESPONSE', response: result.response, collapsedContent: result.collapsedContent });
      } else {
        dispatch({ type: 'LOADING_COMPLETE', collapsedContent: result.collapsedContent });
      }
    } catch (error) {
      dispatch({ type: 'ERROR', error: error instanceof Error ? error.message : 'Something went wrong' });
    }
  }, [state.context, onSubmit]);

  const acceptSuggestions = useCallback(() => {
    if (state.response && onAcceptSuggestions) {
      onAcceptSuggestions(state.response);
    }
    dispatch({ type: 'ACCEPT_SUGGESTIONS' });
    // Note: Collapse is handled immediately by handleAcceptAll in page.tsx
  }, [state.response, onAcceptSuggestions]);

  const dismissResponse = useCallback(() => {
    dispatch({ type: 'DISMISS_RESPONSE' });
    // Set contextual idle content after dismissing
    dispatch({ type: 'SET_COLLAPSED_CONTENT', content: idleContent });
  }, [idleContent]);

  const setContext = useCallback((context: AIAssistantContext) => {
    dispatch({ type: 'SET_CONTEXT', context });
  }, []);

  const setNudge = useCallback((nudge: CollapsedContent) => {
    dispatch({ type: 'SET_NUDGE', nudge });
  }, []);

  const clearNudge = useCallback(() => {
    dispatch({ type: 'CLEAR_NUDGE' });
    // Return to generic idle after prompt dismissal (Option C: prompt → idle, not status)
    dispatch({ type: 'SET_COLLAPSED_CONTENT', content: { type: 'idle', text: 'Ask AI...' } });
  }, []);

  const setCollapsedContent = useCallback((content: CollapsedContent) => {
    dispatch({ type: 'SET_COLLAPSED_CONTENT', content });
  }, []);

  const triggerMockResponse = useCallback((responseKey: string) => {
    const response = MOCK_RESPONSES[responseKey];
    if (response) {
      dispatch({ type: 'SUBMIT_QUERY' });
      setTimeout(() => {
        dispatch({ type: 'RECEIVE_RESPONSE', response });
      }, getRandomDelay(300, 800));
    }
  }, []);

  // Start loading state (for external async operations)
  const startLoading = useCallback(() => {
    dispatch({ type: 'SUBMIT_QUERY' });
  }, []);

  // Receive a response directly (for external async operations)
  const receiveResponse = useCallback((response: AIResponse) => {
    dispatch({ type: 'RECEIVE_RESPONSE', response });
  }, []);

  // Set error state directly
  const setError = useCallback((error: string) => {
    dispatch({ type: 'ERROR', error });
  }, []);

  // Issue 10: Sync messages from external source (task or queue)
  const syncMessages = useCallback((messages: AIMessage[]) => {
    dispatch({ type: 'SYNC_MESSAGES', messages });
  }, []);

  // Issue 10: Clear messages (fresh UI)
  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  // ============ Computed Values ============

  const quickActions = useMemo(() => {
    return QUICK_ACTIONS_BY_CONTEXT[state.context] || QUICK_ACTIONS_BY_CONTEXT.global;
  }, [state.context]);

  // Update collapsed content when defaultIdleContent changes and we're showing idle/status
  // Guard: Don't override if there's a pending response (Issue 8 fix)
  useEffect(() => {
    // Explicitly protect response states from being overwritten
    const isResponseState = ['response', 'suggestionsReady', 'confirmation', 'loading'].includes(
      state.collapsedContent.type
    );

    if (
      state.mode === 'collapsed' &&
      !state.isLoading &&
      !state.response &&  // Don't override if response is pending
      !isResponseState &&  // Don't override response states (Phase 1 fix)
      (state.collapsedContent.type === 'idle' || state.collapsedContent.type === 'status')
    ) {
      dispatch({ type: 'SET_COLLAPSED_CONTENT', content: idleContent });
    }
  }, [idleContent, state.mode, state.isLoading, state.response, state.collapsedContent.type]);

  return {
    state,
    quickActions,

    // Actions
    expand,
    collapse,
    openDrawer,
    closeDrawer,
    setQuery,
    clearQuery,      // Refinement 2
    reset,           // Refinement 7
    cancelRequest,   // Escape key cancellation
    submitQuery,
    directSubmit,    // Refinement 3
    acceptSuggestions,
    dismissResponse,
    setContext,
    setNudge,
    clearNudge,
    setCollapsedContent,
    triggerMockResponse,
    startLoading,
    receiveResponse,
    setError,
    syncMessages,      // Issue 10
    clearMessages,     // Issue 10
  };
}

export default useAIAssistant;
