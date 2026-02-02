/**
 * AI Analytics - Phase 3a Guardrails
 *
 * Privacy-preserving analytics for understanding AI usage patterns.
 * No task content is ever logged - only interaction types and outcomes.
 *
 * @see docs/features/ai-guardrails/SPEC.md
 */

// ============================================
// Types
// ============================================

export type AIRequestCategory =
  | 'breakdown'           // Task breakdown/structuring
  | 'estimate'            // Time estimation
  | 'question'            // User asking about task
  | 'focus_help'          // Help while in focus mode
  | 'get_started'         // Getting started suggestions
  | 'queue_recommend'     // Task recommendation
  | 'metadata_suggest';   // Importance/energy suggestions

export type SuggestionAction =
  | 'accepted'            // Accepted as-is
  | 'modified'            // Accepted with changes
  | 'rejected'            // Dismissed
  | 'ignored';            // No action taken

export type TaskOutcome =
  | 'started'             // Task moved to in-progress
  | 'step_completed'      // Step marked complete
  | 'task_completed';     // Entire task completed

export type AnalyticsEventType =
  | 'ai_request'
  | 'ai_response'
  | 'suggestion_action'
  | 'task_outcome'
  | 'feedback';

export interface AnalyticsEvent {
  // Anonymous session (random UUID, regenerates periodically)
  sessionId: string;

  // Event identification
  eventType: AnalyticsEventType;
  timestamp: number;

  // Request context (no content)
  requestCategory?: AIRequestCategory;

  // Response context
  responseSuccess?: boolean;
  responseTimeMs?: number;
  errorType?: string;

  // Suggestion outcome
  suggestionAction?: SuggestionAction;
  suggestionCount?: number;

  // Task outcome (after AI help)
  taskOutcome?: TaskOutcome;

  // Feedback
  feedbackSentiment?: 'positive' | 'negative' | 'neutral';
  feedbackContext?: 'suggestion' | 'conversation' | 'general';

  // Non-identifying context
  conversationTurn?: number;
  taskCount?: number;         // Rough scale: 1-10, 11-50, 51-100, 100+
  queueLength?: number;       // Rough scale: 0, 1-3, 4-10, 10+

  // Timing
  timeSinceLastEvent?: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  sessionId: string;
  lastSessionReset: number;
}

export interface LocalAnalyticsStore {
  config: AnalyticsConfig;
  events: AnalyticsEvent[];
  lastUpload?: number;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'ai-analytics';
const MAX_EVENTS = 1000;
const SESSION_RESET_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================
// Session Management
// ============================================

function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function createDefaultConfig(): AnalyticsConfig {
  return {
    enabled: false, // Opt-in by default
    sessionId: generateSessionId(),
    lastSessionReset: Date.now(),
  };
}

// ============================================
// Storage
// ============================================

function loadStore(): LocalAnalyticsStore {
  if (typeof window === 'undefined') {
    return { config: createDefaultConfig(), events: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { config: createDefaultConfig(), events: [] };
    }

    const store: LocalAnalyticsStore = JSON.parse(stored);
    const now = Date.now();

    // Rotate session ID if expired
    if (now - store.config.lastSessionReset > SESSION_RESET_INTERVAL) {
      store.config.sessionId = generateSessionId();
      store.config.lastSessionReset = now;
    }

    return store;
  } catch {
    return { config: createDefaultConfig(), events: [] };
  }
}

function saveStore(store: LocalAnalyticsStore): void {
  if (typeof window === 'undefined') return;

  try {
    // Enforce max events (FIFO)
    if (store.events.length > MAX_EVENTS) {
      store.events = store.events.slice(-MAX_EVENTS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    console.warn('[Analytics] Failed to save');
  }
}

// ============================================
// Public API
// ============================================

/**
 * Check if analytics is enabled.
 */
export function isAnalyticsEnabled(): boolean {
  const store = loadStore();
  return store.config.enabled;
}

/**
 * Enable analytics (user opt-in).
 */
export function enableAnalytics(): void {
  const store = loadStore();
  store.config.enabled = true;
  saveStore(store);
}

/**
 * Disable analytics (user opt-out).
 * Clears all stored events.
 */
export function disableAnalytics(): void {
  const store = loadStore();
  store.config.enabled = false;
  store.events = [];
  saveStore(store);
}

/**
 * Track an analytics event.
 * No-op if analytics is disabled.
 */
export function trackEvent(event: Omit<AnalyticsEvent, 'sessionId' | 'timestamp'>): void {
  const store = loadStore();
  if (!store.config.enabled) return;

  // Calculate time since last event
  const lastEvent = store.events[store.events.length - 1];
  const timeSinceLastEvent = lastEvent
    ? Math.round((Date.now() - lastEvent.timestamp) / 1000)
    : undefined;

  const fullEvent: AnalyticsEvent = {
    ...event,
    sessionId: store.config.sessionId,
    timestamp: Date.now(),
    timeSinceLastEvent,
  };

  store.events.push(fullEvent);
  saveStore(store);
}

// ============================================
// Convenience Tracking Functions
// ============================================

/**
 * Track an AI request being made.
 */
export function trackAIRequest(
  category: AIRequestCategory,
  context?: { conversationTurn?: number; taskCount?: number; queueLength?: number }
): number {
  const startTime = Date.now();

  trackEvent({
    eventType: 'ai_request',
    requestCategory: category,
    ...bucketizeContext(context),
  });

  return startTime;
}

/**
 * Track an AI response received.
 */
export function trackAIResponse(
  startTime: number,
  success: boolean,
  errorType?: string
): void {
  trackEvent({
    eventType: 'ai_response',
    responseSuccess: success,
    responseTimeMs: Date.now() - startTime,
    errorType,
  });
}

/**
 * Track user action on AI suggestions.
 */
export function trackSuggestionAction(
  action: SuggestionAction,
  suggestionCount?: number
): void {
  trackEvent({
    eventType: 'suggestion_action',
    suggestionAction: action,
    suggestionCount,
  });
}

/**
 * Track task outcome after AI help.
 */
export function trackTaskOutcome(outcome: TaskOutcome): void {
  trackEvent({
    eventType: 'task_outcome',
    taskOutcome: outcome,
  });
}

/**
 * Track user feedback.
 */
export function trackFeedback(
  sentiment: 'positive' | 'negative' | 'neutral',
  context: 'suggestion' | 'conversation' | 'general'
): void {
  trackEvent({
    eventType: 'feedback',
    feedbackSentiment: sentiment,
    feedbackContext: context,
  });
}

// ============================================
// Context Bucketing (Privacy)
// ============================================

/**
 * Bucketize context values to prevent unique identification.
 * Instead of exact counts, use rough ranges.
 */
function bucketizeContext(context?: {
  conversationTurn?: number;
  taskCount?: number;
  queueLength?: number;
}): Partial<AnalyticsEvent> {
  if (!context) return {};

  const result: Partial<AnalyticsEvent> = {};

  if (context.conversationTurn !== undefined) {
    // Keep exact turn number (low cardinality)
    result.conversationTurn = context.conversationTurn;
  }

  if (context.taskCount !== undefined) {
    // Bucket: 1-10, 11-50, 51-100, 100+
    if (context.taskCount <= 10) result.taskCount = 10;
    else if (context.taskCount <= 50) result.taskCount = 50;
    else if (context.taskCount <= 100) result.taskCount = 100;
    else result.taskCount = 101;
  }

  if (context.queueLength !== undefined) {
    // Bucket: 0, 1-3, 4-10, 10+
    if (context.queueLength === 0) result.queueLength = 0;
    else if (context.queueLength <= 3) result.queueLength = 3;
    else if (context.queueLength <= 10) result.queueLength = 10;
    else result.queueLength = 11;
  }

  return result;
}

// ============================================
// Local Reporting (Debug/Dev)
// ============================================

/**
 * Get a summary of stored analytics (for debugging).
 */
export function getAnalyticsSummary(): {
  enabled: boolean;
  eventCount: number;
  sessionId: string;
  requestsByCategory: Record<string, number>;
  suggestionActions: Record<string, number>;
  avgResponseTimeMs: number | null;
} {
  const store = loadStore();

  const requestsByCategory: Record<string, number> = {};
  const suggestionActions: Record<string, number> = {};
  let totalResponseTime = 0;
  let responseCount = 0;

  for (const event of store.events) {
    if (event.eventType === 'ai_request' && event.requestCategory) {
      requestsByCategory[event.requestCategory] = (requestsByCategory[event.requestCategory] || 0) + 1;
    }
    if (event.eventType === 'suggestion_action' && event.suggestionAction) {
      suggestionActions[event.suggestionAction] = (suggestionActions[event.suggestionAction] || 0) + 1;
    }
    if (event.eventType === 'ai_response' && event.responseTimeMs) {
      totalResponseTime += event.responseTimeMs;
      responseCount++;
    }
  }

  return {
    enabled: store.config.enabled,
    eventCount: store.events.length,
    sessionId: store.config.sessionId.slice(0, 8) + '...', // Truncate for display
    requestsByCategory,
    suggestionActions,
    avgResponseTimeMs: responseCount > 0 ? Math.round(totalResponseTime / responseCount) : null,
  };
}

/**
 * Clear all analytics data.
 */
export function clearAnalytics(): void {
  const store = loadStore();
  store.events = [];
  saveStore(store);
}
