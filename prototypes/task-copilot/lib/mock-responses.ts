import { AIResponse, CollapsedContent } from './ai-types';

// ============ Mock AI Responses ============

export const MOCK_RESPONSES: Record<string, AIResponse> = {
  breakdown: {
    type: 'suggestions',
    content: {
      message: "I'll add 5 steps to help you file taxes:",
      suggestions: [
        { id: '1', text: 'Gather W-2 and 1099 forms' },
        { id: '2', text: 'Collect deduction receipts' },
        { id: '3', text: 'Choose filing method (TurboTax, CPA, etc.)' },
        { id: '4', text: 'Complete federal return' },
        { id: '5', text: 'Complete state return' },
      ],
    },
    actions: [
      { id: 'accept', label: 'Add steps', variant: 'primary', onClick: () => {} },
      { id: 'dismiss', label: 'Dismiss', variant: 'ghost', onClick: () => {} },
    ],
  },

  whatNext: {
    type: 'text',
    content: {
      text: "Based on your queue, I'd suggest starting with \"File taxes\" — it's high priority and the deadline is approaching. The first step is straightforward: gather your W-2 forms.",
    },
    actions: [
      { id: 'focus', label: 'Focus on it', variant: 'primary', onClick: () => {} },
      { id: 'other', label: 'Show other options', variant: 'secondary', onClick: () => {} },
    ],
  },

  explain: {
    type: 'explanation',
    content: {
      title: 'Choose filing method',
      explanation: "This means deciding between:\n\n• TurboTax/H&R Block — DIY software, $50-150\n• IRS Free File — Free if income <$79k\n• CPA — Professional help, $200-500\n\nYour situation looks straightforward, so TurboTax or Free File would work well.",
    },
    actions: [
      { id: 'gotit', label: 'Got it', variant: 'primary', onClick: () => {} },
    ],
  },

  stuck: {
    type: 'suggestions',
    content: {
      message: "Let me break down \"Collect receipts\" into smaller steps:",
      suggestions: [
        { id: '3a', text: 'Check email for digital receipts' },
        { id: '3b', text: 'Look through photos for receipt snapshots' },
        { id: '3c', text: 'Check bank statements for deductible purchases' },
        { id: '3d', text: 'Organize receipts into categories' },
      ],
    },
    actions: [
      { id: 'accept', label: 'Add substeps', variant: 'primary', onClick: () => {} },
      { id: 'dismiss', label: 'Dismiss', variant: 'ghost', onClick: () => {} },
    ],
  },

  error: {
    type: 'error',
    content: {
      text: "Something went wrong. Please try again.",
    },
    actions: [
      { id: 'retry', label: 'Retry', variant: 'primary', onClick: () => {} },
    ],
  },
};

// ============ Mock Nudges ============

export const MOCK_NUDGES: Record<string, CollapsedContent> = {
  deadline: {
    type: 'nudge',
    text: '"File taxes" deadline in 3 days',
    icon: '⚠️',
    action: { label: 'Focus', onClick: () => {} },
  },

  stale: {
    type: 'nudge',
    text: '"Buy groceries" untouched for 5 days',
    icon: '👀',
    action: { label: 'Review', onClick: () => {} },
  },

  suggestion: {
    type: 'nudge',
    text: 'Ready to focus? I suggest "Call mom"',
    icon: '💡',
    action: { label: 'Start', onClick: () => {} },
  },
};

// ============ Mock Collapsed States ============

export const MOCK_COLLAPSED: Record<string, CollapsedContent> = {
  idle: {
    type: 'idle',
    text: 'Ask AI...',
    icon: '✨',
  },

  loading: {
    type: 'loading',
    text: 'Thinking...',
    icon: '◐',
  },

  status: {
    type: 'status',
    text: '5 steps • ~45 min estimated',
    icon: '✨',
  },

  response: {
    type: 'response',
    text: 'Added 5 steps — tap to review',
    icon: '✨',
  },
};

// Helper to get a random delay for simulating AI response
export function getRandomDelay(min = 500, max = 1500): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
