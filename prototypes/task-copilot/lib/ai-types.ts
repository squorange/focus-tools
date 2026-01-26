// ============ AI Assistant Types ============
// Separate from main types.ts to avoid conflicts with existing Message type

// ============ State Machine ============

export type AIAssistantMode = 'collapsed' | 'expanded' | 'drawer';

export type AIAssistantContext =
  | 'queue'        // Focus Queue view
  | 'taskDetail'   // Viewing a specific task
  | 'focusMode'    // In focus session
  | 'inbox'        // Inbox/triage view
  | 'search'       // Search view
  | 'step'         // Targeting a specific step (from sparkle button)
  | 'global';      // Fallback

export interface AIAssistantState {
  mode: AIAssistantMode;
  context: AIAssistantContext;

  // Collapsed state content
  collapsedContent: CollapsedContent;

  // Expanded state
  query: string;
  isLoading: boolean;
  response: AIResponse | null;

  // Drawer state
  messages: AIMessage[];

  // Shared
  error: string | null;
}

// ============ Collapsed Content ============

export type CollapsedContentType =
  | 'idle'           // "Ask AI..."
  | 'nudge'          // Proactive suggestion
  | 'start_poke'     // Start Time Poke notification alert
  | 'reminder'       // Reminder notification alert
  | 'status'         // Contextual info
  | 'response'       // Brief response summary (text response ready)
  | 'suggestionsReady' // Structured suggestions ready (show count + down arrow)
  | 'confirmation'   // Action completed (e.g., "✓ Added 5 steps")
  | 'loading'        // Waiting for AI
  | 'prompt'         // Contextual prompt with action pill
  | 'cancelled';     // Request was cancelled (Escape key)

// ============ Contextual Prompts ============

export interface ContextualPrompt {
  text: string;           // "Need help?"
  pillLabel: string;      // "First step"
  pillIcon: string;       // "👆"
  action: () => void;     // What pill tap does
}

export interface CollapsedContent {
  type: CollapsedContentType;
  text: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  prompt?: ContextualPrompt;  // For 'prompt' type: the pill action
  startPokeAlert?: {         // For 'start_poke' type: notification data
    taskId: string;
    taskTitle: string;
    notificationId: string;
    anchorTime: number;      // Unix timestamp of when task is due
    durationMinutes: number;
    bufferMinutes: number;
  };
  reminderAlert?: {          // For 'reminder' type: notification data
    taskId: string;
    taskTitle: string;
    notificationId: string;
    reminderTime: number;    // When reminder was set to fire
  };
  // Multiple alerts support
  alertCount?: number;       // Total number of active alerts
  currentAlertIndex?: number; // Which alert is currently shown (0-indexed)
}

// ============ Responses ============

export type AIResponseType = 'text' | 'suggestions' | 'explanation' | 'recommendation' | 'error';

export interface AIResponse {
  type: AIResponseType;
  content: TextContent | SuggestionsContent | ExplanationContent | RecommendationContent;
  actions?: ResponseAction[];
}

export interface TextContent {
  text: string;
}

export interface SuggestionsContent {
  message: string;
  suggestions: Suggestion[];
}

export interface Suggestion {
  id: string;
  text: string;
  substeps?: { id: string; text: string }[];
}

export interface ExplanationContent {
  title: string;      // What's being explained
  explanation: string;
}

export interface RecommendationContent {
  taskId: string;
  taskTitle: string;
  reason: string;
  reasonType: 'deadline' | 'momentum' | 'quick_win' | 'priority' | 'oldest';
}

export interface ResponseAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
}

// ============ Submit Result ============
// Return type from onSubmit handler - allows returning collapsedContent for structured responses

export interface AISubmitResult {
  response: AIResponse | null;           // Response to show in Palette (null for structured responses)
  collapsedContent?: CollapsedContent;   // What to show in MiniBar (for structured responses)
}

// ============ Quick Actions ============

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  query: string;       // What to send to AI
  contexts: AIAssistantContext[];  // Where this appears
}

// ============ Messages (for Drawer) ============
// Named AIMessage to avoid conflict with existing Message type in types.ts

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  response?: AIResponse;  // Structured response if applicable
}

// ============ State Machine Actions ============

export type AIAction =
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'OPEN_DRAWER' }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'SET_QUERY'; query: string }
  | { type: 'CLEAR_QUERY' }           // Refinement 2
  | { type: 'SUBMIT_QUERY' }
  | { type: 'RECEIVE_RESPONSE'; response: AIResponse; collapsedContent?: CollapsedContent }
  | { type: 'LOADING_COMPLETE'; collapsedContent?: CollapsedContent }  // Clear loading, optionally set collapsedContent for structured responses
  | { type: 'ACCEPT_SUGGESTIONS' }
  | { type: 'DISMISS_RESPONSE' }
  | { type: 'SET_CONTEXT'; context: AIAssistantContext }
  | { type: 'SET_NUDGE'; nudge: CollapsedContent }
  | { type: 'CLEAR_NUDGE' }
  | { type: 'SET_COLLAPSED_CONTENT'; content: CollapsedContent }
  | { type: 'RESET' }                 // Refinement 7
  | { type: 'ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SYNC_MESSAGES'; messages: AIMessage[] }  // Issue 10: Sync from external source
  | { type: 'CLEAR_MESSAGES' }                        // Issue 10: Clear messages
  | { type: 'CANCEL_REQUEST' };                       // Escape key cancellation
