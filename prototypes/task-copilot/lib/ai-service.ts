/**
 * AI Service - Centralized AI Request Handler with Guardrails
 *
 * Wraps all AI API calls with:
 * - Rate limiting checks
 * - Analytics tracking
 * - Offline detection
 * - Error sanitization
 *
 * @see docs/features/ai-guardrails/SPEC.md
 */

import { StructureResponse } from './types';
import {
  checkRateLimit,
  recordRequest,
  getRateLimitMessage,
  RateLimitStatus,
  DEFAULT_CONFIG,
} from './rate-limit';
import {
  trackAIRequest,
  trackAIResponse,
  AIRequestCategory,
} from './analytics';
import { isOnline, getOfflineMessage, sanitizeErrorForUser } from './ai-safety';

// ============================================
// Types
// ============================================

export interface AIServiceRequest {
  endpoint?: string;
  body: Record<string, unknown>;
  category: AIRequestCategory;
  context?: {
    conversationTurn?: number;
    taskCount?: number;
    queueLength?: number;
  };
}

export interface AIServiceResult {
  success: boolean;
  data?: StructureResponse & { errorType?: string };
  error?: string;
  rateLimitStatus?: RateLimitStatus;
  isRateLimited?: boolean;
  isOffline?: boolean;
}

// ============================================
// AI Service
// ============================================

/**
 * Make an AI API request with guardrails.
 *
 * Features:
 * - Checks rate limits BEFORE making request
 * - Detects offline state
 * - Tracks analytics (if enabled)
 * - Returns sanitized error messages
 *
 * @example
 * const result = await makeAIRequest({
 *   body: { userMessage: 'Help me break down this task', ... },
 *   category: 'breakdown',
 * });
 *
 * if (!result.success) {
 *   if (result.isRateLimited) {
 *     showRateLimitUI(result.rateLimitStatus);
 *   } else if (result.isOffline) {
 *     showOfflineUI();
 *   } else {
 *     showError(result.error);
 *   }
 * }
 */
export async function makeAIRequest(
  request: AIServiceRequest
): Promise<AIServiceResult> {
  const { endpoint = '/api/structure', body, category, context } = request;

  // 1. Check if offline
  if (!isOnline()) {
    return {
      success: false,
      error: getOfflineMessage(),
      isOffline: true,
    };
  }

  // 2. Check rate limits
  const rateLimitStatus = checkRateLimit(DEFAULT_CONFIG);
  if (!rateLimitStatus.allowed) {
    return {
      success: false,
      error: getRateLimitMessage(rateLimitStatus),
      rateLimitStatus,
      isRateLimited: true,
    };
  }

  // 3. Track request (analytics)
  const startTime = trackAIRequest(category, context);

  // 4. Make the request
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // 5. Record successful request for rate limiting
    recordRequest();

    // 6. Parse response
    if (!response.ok) {
      // Non-2xx response - extract error from body if possible
      let errorData: StructureResponse & { errorType?: string };
      try {
        errorData = await response.json();
      } catch {
        // If JSON parsing fails, create a generic error response
        errorData = {
          action: 'none',
          taskTitle: null,
          steps: null,
          suggestions: null,
          edits: null,
          deletions: null,
          message: sanitizeErrorForUser(new Error(`HTTP ${response.status}`)),
          errorType: 'http_error',
        };
      }

      // Track failed response
      trackAIResponse(startTime, false, errorData.errorType);

      return {
        success: false,
        data: errorData,
        error: errorData.message,
        rateLimitStatus,
      };
    }

    const data: StructureResponse & { errorType?: string } = await response.json();

    // 7. Track successful response
    trackAIResponse(startTime, true);

    return {
      success: true,
      data,
      rateLimitStatus,
    };
  } catch (error) {
    // 8. Handle network/fetch errors
    trackAIResponse(startTime, false, 'network_error');

    return {
      success: false,
      error: sanitizeErrorForUser(error),
      rateLimitStatus,
    };
  }
}

/**
 * Determine the request category from the request body.
 * Used when the caller doesn't specify a category.
 */
export function inferRequestCategory(
  body: Record<string, unknown>
): AIRequestCategory {
  // Queue mode = recommendation
  if (body.queueMode || body.tasksViewMode) {
    return 'queue_recommend';
  }

  // Focus mode = focus help
  if (body.focusMode) {
    return 'focus_help';
  }

  // Check user message for intent
  const userMessage = (body.userMessage as string || '').toLowerCase();

  if (userMessage.includes('estimate') || userMessage.includes('how long') || userMessage.includes('duration')) {
    return 'estimate';
  }

  if (userMessage.includes('break') || userMessage.includes('steps') || userMessage.includes('breakdown')) {
    return 'breakdown';
  }

  if (userMessage.includes('get started') || userMessage.includes('start') || userMessage.includes('begin')) {
    return 'get_started';
  }

  if (userMessage.includes('importance') || userMessage.includes('energy') || userMessage.includes('priority')) {
    return 'metadata_suggest';
  }

  // Default to question
  return 'question';
}

// ============================================
// Hooks/Utilities for React Components
// ============================================

/**
 * Get rate limit warning for display in UI.
 * Returns null if no warning needed.
 */
export function getRateLimitWarning(): string | null {
  const status = checkRateLimit(DEFAULT_CONFIG);
  return status.warningMessage;
}

/**
 * Check if AI is currently available (not rate limited, online).
 */
export function isAIAvailable(): boolean {
  if (!isOnline()) return false;
  const status = checkRateLimit(DEFAULT_CONFIG);
  return status.allowed;
}

/**
 * Get the current rate limit cooldown in seconds (0 if not limited).
 */
export function getCooldownSeconds(): number {
  const status = checkRateLimit(DEFAULT_CONFIG);
  return status.cooldownSeconds || 0;
}
