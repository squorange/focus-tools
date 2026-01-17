'use client';

import { useReducer, useCallback, useMemo } from 'react';
import {
  AIAssistantState,
  AIAssistantContext,
  AIAction,
  AIResponse,
  CollapsedContent,
  Message,
  QuickAction,
} from '@/lib/types';
import { QUICK_ACTIONS_BY_CONTEXT, ANIMATIONS } from '@/lib/constants';
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
        // If there's a response, show summary in collapsed state
        if (state.response) {
          const summaryText = state.response.type === 'suggestions'
            ? `Added ${(state.response.content as { suggestions: unknown[] }).suggestions.length} steps — tap to review`
            : 'Response ready — tap to view';
          return {
            ...state,
            mode: 'collapsed',
            collapsedContent: {
              type: 'response',
              text: summaryText,
              icon: '✨',
            },
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
      const newMessages: Message[] = [...state.messages];
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
        collapsedContent: MOCK_COLLAPSED.idle,
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

      return {
        ...state,
        isLoading: false,
        response: action.response,
        query: state.mode === 'drawer' ? '' : state.query,
        messages: updatedMessages,
        collapsedContent: {
          type: 'response',
          text: action.response.type === 'suggestions'
            ? `Added ${(action.response.content as { suggestions: unknown[] }).suggestions.length} steps — tap to review`
            : 'Response ready',
          icon: '✨',
        },
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

    default:
      return state;
  }
}

// ============ Hook ============

interface UseAIAssistantOptions {
  initialContext?: AIAssistantContext;
  onSubmit?: (query: string, context: AIAssistantContext) => Promise<AIResponse>;
  onAcceptSuggestions?: (response: AIResponse) => void;
}

export function useAIAssistant(options: UseAIAssistantOptions = {}) {
  const {
    initialContext = 'global',
    onSubmit,
    onAcceptSuggestions,
  } = options;

  const [state, dispatch] = useReducer(
    aiAssistantReducer,
    initialContext,
    createInitialState
  );

  // ============ Actions ============

  const expand = useCallback(() => dispatch({ type: 'EXPAND' }), []);
  const collapse = useCallback(() => dispatch({ type: 'COLLAPSE' }), []);
  const openDrawer = useCallback(() => dispatch({ type: 'OPEN_DRAWER' }), []);
  const closeDrawer = useCallback(() => dispatch({ type: 'CLOSE_DRAWER' }), []);

  const setQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', query });
  }, []);

  const submitQuery = useCallback(async () => {
    if (!state.query.trim()) return;

    dispatch({ type: 'SUBMIT_QUERY' });

    try {
      let response: AIResponse;

      if (onSubmit) {
        response = await onSubmit(state.query, state.context);
      } else {
        // Mock response based on query content
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

        const query = state.query.toLowerCase();
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
      }

      dispatch({ type: 'RECEIVE_RESPONSE', response });
    } catch (error) {
      dispatch({ type: 'ERROR', error: error instanceof Error ? error.message : 'Something went wrong' });
    }
  }, [state.query, state.context, onSubmit]);

  const acceptSuggestions = useCallback(() => {
    if (state.response && onAcceptSuggestions) {
      onAcceptSuggestions(state.response);
    }
    dispatch({ type: 'ACCEPT_SUGGESTIONS' });

    // Auto-collapse after delay
    setTimeout(() => {
      dispatch({ type: 'COLLAPSE' });
      // Reset to idle after showing confirmation
      setTimeout(() => {
        dispatch({ type: 'SET_COLLAPSED_CONTENT', content: MOCK_COLLAPSED.idle });
      }, 2000);
    }, ANIMATIONS.autoCollapseDelay);
  }, [state.response, onAcceptSuggestions]);

  const dismissResponse = useCallback(() => {
    dispatch({ type: 'DISMISS_RESPONSE' });
  }, []);

  const setContext = useCallback((context: AIAssistantContext) => {
    dispatch({ type: 'SET_CONTEXT', context });
  }, []);

  const setNudge = useCallback((nudge: CollapsedContent) => {
    dispatch({ type: 'SET_NUDGE', nudge });
  }, []);

  const clearNudge = useCallback(() => {
    dispatch({ type: 'CLEAR_NUDGE' });
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

  // ============ Computed Values ============

  const quickActions = useMemo(() => {
    return QUICK_ACTIONS_BY_CONTEXT[state.context] || QUICK_ACTIONS_BY_CONTEXT.global;
  }, [state.context]);

  return {
    state,
    quickActions,

    // Actions
    expand,
    collapse,
    openDrawer,
    closeDrawer,
    setQuery,
    submitQuery,
    acceptSuggestions,
    dismissResponse,
    setContext,
    setNudge,
    clearNudge,
    setCollapsedContent,
    triggerMockResponse,
  };
}

export default useAIAssistant;
