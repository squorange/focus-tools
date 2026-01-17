// ============ State Machine ============

export type AIAssistantMode = 'collapsed' | 'expanded' | 'drawer';

export type AIAssistantContext =
  | 'queue'        // Focus Queue view
  | 'taskDetail'   // Viewing a specific task
  | 'focusMode'    // In focus session
  | 'inbox'        // Inbox/triage view
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
  messages: Message[];

  // Shared
  error: string | null;
}

// ============ Collapsed Content ============

export type CollapsedContentType =
  | 'idle'           // "Ask AI for help..."
  | 'nudge'          // Proactive suggestion
  | 'status'         // Contextual info
  | 'response'       // Brief response summary
  | 'loading';       // Waiting for AI

export interface CollapsedContent {
  type: CollapsedContentType;
  text: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============ Responses ============

export type AIResponseType = 'text' | 'suggestions' | 'explanation' | 'error';

export interface AIResponse {
  type: AIResponseType;
  content: TextContent | SuggestionsContent | ExplanationContent;
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

export interface ResponseAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
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

export interface Message {
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
  | { type: 'SUBMIT_QUERY' }
  | { type: 'RECEIVE_RESPONSE'; response: AIResponse }
  | { type: 'ACCEPT_SUGGESTIONS' }
  | { type: 'DISMISS_RESPONSE' }
  | { type: 'SET_CONTEXT'; context: AIAssistantContext }
  | { type: 'SET_NUDGE'; nudge: CollapsedContent }
  | { type: 'CLEAR_NUDGE' }
  | { type: 'SET_COLLAPSED_CONTENT'; content: CollapsedContent }
  | { type: 'ERROR'; error: string }
  | { type: 'CLEAR_ERROR' };
