/**
 * AI Safety Utilities - Phase 3a Guardrails
 *
 * Output sanitization and safety functions to prevent XSS and
 * ensure AI outputs are safe for rendering.
 *
 * @see docs/features/ai-guardrails/SPEC.md
 */

// ============================================
// Output Sanitization
// ============================================

/**
 * Sanitize AI-generated text for safe HTML rendering.
 * Escapes HTML entities to prevent XSS attacks.
 *
 * Apply to ALL AI-generated content before rendering:
 * - Step titles and descriptions
 * - Suggestions in staging area
 * - Chat/conversation responses
 * - Error messages from AI
 */
export function sanitizeAIOutput(text: string): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize AI output while preserving basic markdown formatting.
 * Use this for chat messages where we want to support basic formatting.
 */
export function sanitizeAIOutputWithMarkdown(text: string): string {
  if (!text) return '';

  // First escape all HTML
  let sanitized = sanitizeAIOutput(text);

  // Then re-enable specific markdown patterns
  // Bold: **text** or __text__
  sanitized = sanitized.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  sanitized = sanitized.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (but not mid-word underscores)
  sanitized = sanitized.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<em>$1</em>');
  sanitized = sanitized.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>');

  // Line breaks
  sanitized = sanitized.replace(/\n/g, '<br>');

  return sanitized;
}

// ============================================
// Error Sanitization
// ============================================

interface APIError {
  type?: string;
  message?: string;
  status?: number;
  code?: string;
}

/**
 * Map of Anthropic error types to user-friendly messages.
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Anthropic API errors
  'authentication_error': 'AI service configuration issue. Please contact support.',
  'invalid_api_key': 'AI service configuration issue. Please contact support.',
  'rate_limit_error': "You've been busy! AI will be ready again in a moment.",
  'overloaded_error': "AI is experiencing high demand. Please try again in a moment.",
  'api_error': 'AI service is temporarily unavailable. Please try again.',

  // HTTP status codes
  '401': 'AI service configuration issue. Please contact support.',
  '403': 'AI service access denied. Please contact support.',
  '429': "You've been busy! AI will be ready again in a moment.",
  '500': 'AI service error. Please try again.',
  '502': 'AI service temporarily unavailable. Please try again.',
  '503': 'AI service temporarily unavailable. Please try again.',

  // Common error patterns
  'credit_balance': 'AI credits exhausted. Please contact support.',
  'timeout': "AI is taking longer than expected. Please try again.",
  'network': "Can't reach AI service. Please check your connection.",
};

/**
 * Sanitize an error for user display.
 * Logs full error internally, returns safe user-facing message.
 *
 * NEVER expose:
 * - API keys or URLs
 * - Stack traces
 * - Internal system details
 * - Raw error messages
 */
export function sanitizeErrorForUser(error: unknown): string {
  // Log full error internally for debugging
  console.error('[AI Error]', error);

  // Extract error info if available
  const apiError = error as APIError;

  // Check for known error types
  if (apiError?.type && ERROR_MESSAGES[apiError.type]) {
    return ERROR_MESSAGES[apiError.type];
  }

  // Check for HTTP status codes
  if (apiError?.status && ERROR_MESSAGES[String(apiError.status)]) {
    return ERROR_MESSAGES[String(apiError.status)];
  }

  // Check error message for known patterns
  const message = apiError?.message?.toLowerCase() || '';

  if (message.includes('credit') || message.includes('billing')) {
    return ERROR_MESSAGES['credit_balance'];
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return ERROR_MESSAGES['timeout'];
  }
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_MESSAGES['network'];
  }
  if (message.includes('rate') && message.includes('limit')) {
    return ERROR_MESSAGES['rate_limit_error'];
  }

  // Generic fallback - NEVER expose raw error message
  return "Something went wrong with AI. The app still works — please try again.";
}

// ============================================
// Content Validation
// ============================================

/**
 * Maximum length for AI-generated text fields.
 * Prevents unexpectedly large responses from causing issues.
 */
const MAX_LENGTHS = {
  stepText: 500,
  suggestion: 500,
  message: 2000,
  title: 200,
};

/**
 * Truncate text to maximum allowed length with ellipsis.
 */
export function truncateAIText(
  text: string,
  type: keyof typeof MAX_LENGTHS = 'message'
): string {
  const maxLength = MAX_LENGTHS[type];
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Validate and sanitize an entire AI response.
 * Use this as a final check before applying AI suggestions.
 */
export function validateAIResponse<T extends object>(
  response: T
): { valid: boolean; sanitized: T; warnings: string[] } {
  const warnings: string[] = [];
  const sanitized = { ...response };

  // Check for excessively long fields
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string' && value.length > MAX_LENGTHS.message) {
      warnings.push(`Field '${key}' was truncated (${value.length} chars)`);
      (sanitized as Record<string, unknown>)[key] = truncateAIText(value);
    }
  }

  // Response is valid if we didn't encounter any critical issues
  return {
    valid: warnings.length === 0,
    sanitized,
    warnings,
  };
}

// ============================================
// Offline Detection
// ============================================

/**
 * Check if the browser is currently online.
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Get user-friendly offline message.
 */
export function getOfflineMessage(): string {
  return "You're offline. AI features need an internet connection.";
}
