/**
 * AI Actions Registry
 *
 * This is the SINGLE SOURCE OF TRUTH for all AI-related actions in the app.
 * Quick actions, contextual prompts, and stuck menu all reference this registry.
 *
 * To add a new action:
 * 1. Add it to the appropriate context in AI_ACTIONS
 * 2. Reference it in the consuming component via AI_ACTIONS.context.actionId
 *
 * Do NOT hardcode labels/icons/queries elsewhere - always import from here.
 */

import { AIAssistantContext } from './ai-types';

// ============ Type Definitions ============

export interface AIAction {
  id: string;
  label: string;
  icon: string;
  query: string;
}

// ============ Central Action Registry ============

export const AI_ACTIONS = {
  // Focus Mode actions (used in quick actions, contextual prompts, stuck menu)
  focusMode: {
    breakdown: {
      id: 'breakdown',
      label: 'Break down',
      icon: '📋',
      query: 'Break this into smaller steps',
    },
    helpMeStart: {
      id: 'helpMeStart',
      label: 'Help me start',
      icon: '👉',
      query: "What's my first tiny action?",
    },
    clarify: {
      id: 'clarify',
      label: 'What does this mean?',
      icon: '❓',
      query: 'Can you explain what this step means?',
    },
  },

  // Task Detail actions
  taskDetail: {
    breakdown: {
      id: 'breakdown',
      label: 'Break down',
      icon: '📋',
      query: 'Break this task into steps',
    },
    estimate: {
      id: 'estimate',
      label: 'Estimate',
      icon: '⏱',
      query: 'How long will this take?',
    },
  },

  // Queue actions
  queue: {
    whatNext: {
      id: 'next',
      label: 'What next?',
      icon: '🎯',
      query: 'What should I work on next?',
    },
    reorder: {
      id: 'reorder',
      label: 'Reorder',
      icon: '↕️',
      query: 'Help me prioritize my queue',
    },
  },

  // Inbox actions
  inbox: {
    triage: {
      id: 'triage',
      label: 'Help triage',
      icon: '📥',
      query: 'Help me triage these items',
    },
    priority: {
      id: 'priority',
      label: 'Priority?',
      icon: '⚡',
      query: 'What priority should this be?',
    },
  },

  // Global actions (fallback)
  global: {
    whatNext: {
      id: 'next',
      label: 'What next?',
      icon: '🎯',
      query: 'What should I work on?',
    },
    help: {
      id: 'help',
      label: 'Help',
      icon: '💡',
      query: 'What can you help me with?',
    },
  },
} as const;

// ============ Helper Types ============

export type AIActionContext = keyof typeof AI_ACTIONS;
export type FocusModeAction = keyof typeof AI_ACTIONS.focusMode;
export type TaskDetailAction = keyof typeof AI_ACTIONS.taskDetail;
export type QueueAction = keyof typeof AI_ACTIONS.queue;
export type InboxAction = keyof typeof AI_ACTIONS.inbox;
export type GlobalAction = keyof typeof AI_ACTIONS.global;

// ============ Helper Functions ============

/**
 * Get an action by context and action id
 */
export function getAction<C extends AIActionContext>(
  context: C,
  actionId: keyof typeof AI_ACTIONS[C]
): AIAction {
  return AI_ACTIONS[context][actionId] as AIAction;
}

/**
 * Get all actions for a context as an array
 */
export function getActionsForContext(context: AIActionContext): AIAction[] {
  return Object.values(AI_ACTIONS[context]) as AIAction[];
}
