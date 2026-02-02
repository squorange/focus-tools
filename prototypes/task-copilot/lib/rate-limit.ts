/**
 * AI Rate Limiting - Phase 3a Guardrails
 *
 * Client-side rate limiting to protect API budget and prevent abuse.
 * Limits are enforced before making API requests.
 *
 * @see docs/features/ai-guardrails/SPEC.md
 */

// ============================================
// Types
// ============================================

export interface RateLimitState {
  minuteCount: number;
  minuteResetAt: number;
  hourCount: number;
  hourResetAt: number;
  dayCount: number;
  dayResetAt: number;
  conversationTurns: number;
  lastConversationReset: number;
}

export interface RateLimitConfig {
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
  maxConversationTurns: number;
  warningThreshold: number; // 0-1, e.g., 0.8 = 80%
}

export interface RateLimitStatus {
  allowed: boolean;
  reason: 'ok' | 'minute_limit' | 'hour_limit' | 'day_limit' | 'conversation_limit';
  remaining: {
    minute: number;
    hour: number;
    day: number;
    conversationTurns: number;
  };
  cooldownSeconds: number | null;
  nearLimit: boolean;
  warningMessage: string | null;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'ai-rate-limit';
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const CONVERSATION_TIMEOUT_MS = 30 * MINUTE_MS; // 30 min = new conversation

export const DEFAULT_CONFIG: RateLimitConfig = {
  maxPerMinute: 12,
  maxPerHour: 60,
  maxPerDay: 200,
  maxConversationTurns: 15,
  warningThreshold: 0.8,
};

// ============================================
// State Management
// ============================================

function createInitialState(): RateLimitState {
  const now = Date.now();
  return {
    minuteCount: 0,
    minuteResetAt: now + MINUTE_MS,
    hourCount: 0,
    hourResetAt: now + HOUR_MS,
    dayCount: 0,
    dayResetAt: getEndOfDay(now),
    conversationTurns: 0,
    lastConversationReset: now,
  };
}

function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime() + 1; // Start of next day
}

/**
 * Load rate limit state from localStorage.
 * Resets any expired windows.
 */
export function loadRateLimitState(): RateLimitState {
  if (typeof window === 'undefined') {
    return createInitialState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createInitialState();
    }

    const state: RateLimitState = JSON.parse(stored);
    const now = Date.now();

    // Reset expired windows
    if (now >= state.minuteResetAt) {
      state.minuteCount = 0;
      state.minuteResetAt = now + MINUTE_MS;
    }
    if (now >= state.hourResetAt) {
      state.hourCount = 0;
      state.hourResetAt = now + HOUR_MS;
    }
    if (now >= state.dayResetAt) {
      state.dayCount = 0;
      state.dayResetAt = getEndOfDay(now);
    }

    // Reset conversation if timed out
    if (now - state.lastConversationReset > CONVERSATION_TIMEOUT_MS) {
      state.conversationTurns = 0;
      state.lastConversationReset = now;
    }

    return state;
  } catch {
    return createInitialState();
  }
}

/**
 * Save rate limit state to localStorage.
 */
export function saveRateLimitState(state: RateLimitState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable - fail silently
    console.warn('[RateLimit] Failed to save state');
  }
}

// ============================================
// Rate Limit Checking
// ============================================

/**
 * Check if a request is allowed under current rate limits.
 * Does NOT modify state - call recordRequest() after a successful request.
 */
export function checkRateLimit(
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitStatus {
  const state = loadRateLimitState();
  const now = Date.now();

  // Calculate remaining for each window
  const remaining = {
    minute: Math.max(0, config.maxPerMinute - state.minuteCount),
    hour: Math.max(0, config.maxPerHour - state.hourCount),
    day: Math.max(0, config.maxPerDay - state.dayCount),
    conversationTurns: Math.max(0, config.maxConversationTurns - state.conversationTurns),
  };

  // Check if any limit is exceeded
  let reason: RateLimitStatus['reason'] = 'ok';
  let cooldownSeconds: number | null = null;

  if (remaining.minute === 0) {
    reason = 'minute_limit';
    cooldownSeconds = Math.ceil((state.minuteResetAt - now) / 1000);
  } else if (remaining.hour === 0) {
    reason = 'hour_limit';
    cooldownSeconds = Math.ceil((state.hourResetAt - now) / 1000);
  } else if (remaining.day === 0) {
    reason = 'day_limit';
    cooldownSeconds = Math.ceil((state.dayResetAt - now) / 1000);
  } else if (remaining.conversationTurns === 0) {
    reason = 'conversation_limit';
    // No cooldown - user can start a new conversation
    cooldownSeconds = null;
  }

  const allowed = reason === 'ok';

  // Check if near any limit (for warning)
  const nearLimit =
    remaining.minute <= Math.ceil(config.maxPerMinute * (1 - config.warningThreshold)) ||
    remaining.hour <= Math.ceil(config.maxPerHour * (1 - config.warningThreshold)) ||
    remaining.day <= Math.ceil(config.maxPerDay * (1 - config.warningThreshold)) ||
    remaining.conversationTurns <= Math.ceil(config.maxConversationTurns * (1 - config.warningThreshold));

  // Generate warning message
  let warningMessage: string | null = null;
  if (nearLimit && allowed) {
    if (remaining.day <= 10) {
      warningMessage = `${remaining.day} AI requests remaining today`;
    } else if (remaining.hour <= 5) {
      warningMessage = `${remaining.hour} requests remaining this hour`;
    } else if (remaining.conversationTurns <= 3) {
      warningMessage = `${remaining.conversationTurns} turns remaining in conversation`;
    }
  }

  return {
    allowed,
    reason,
    remaining,
    cooldownSeconds,
    nearLimit,
    warningMessage,
  };
}

/**
 * Record a successful request, incrementing counters.
 * Call this AFTER a successful API request.
 */
export function recordRequest(): void {
  const state = loadRateLimitState();
  const now = Date.now();

  // Increment all counters
  state.minuteCount++;
  state.hourCount++;
  state.dayCount++;
  state.conversationTurns++;
  state.lastConversationReset = now;

  saveRateLimitState(state);
}

/**
 * Start a new conversation, resetting the turn counter.
 */
export function resetConversation(): void {
  const state = loadRateLimitState();
  state.conversationTurns = 0;
  state.lastConversationReset = Date.now();
  saveRateLimitState(state);
}

/**
 * Get the current rate limit status for display.
 */
export function getRateLimitDisplay(
  config: RateLimitConfig = DEFAULT_CONFIG
): {
  requestsToday: number;
  maxToday: number;
  conversationTurns: number;
  maxTurns: number;
  cooldownMessage: string | null;
} {
  const state = loadRateLimitState();
  const status = checkRateLimit(config);

  let cooldownMessage: string | null = null;
  if (!status.allowed) {
    switch (status.reason) {
      case 'minute_limit':
        cooldownMessage = `AI available in ${status.cooldownSeconds}s`;
        break;
      case 'hour_limit':
        const hourMins = Math.ceil((status.cooldownSeconds || 0) / 60);
        cooldownMessage = `AI available in ${hourMins} minute${hourMins !== 1 ? 's' : ''}`;
        break;
      case 'day_limit':
        cooldownMessage = 'Daily AI limit reached. Resets at midnight.';
        break;
      case 'conversation_limit':
        cooldownMessage = 'Conversation limit reached. Start a new conversation to continue.';
        break;
    }
  }

  return {
    requestsToday: state.dayCount,
    maxToday: config.maxPerDay,
    conversationTurns: state.conversationTurns,
    maxTurns: config.maxConversationTurns,
    cooldownMessage,
  };
}

// ============================================
// User-Facing Messages
// ============================================

export function getRateLimitMessage(status: RateLimitStatus): string {
  switch (status.reason) {
    case 'minute_limit':
      return `You've been busy! AI will be ready again in ${status.cooldownSeconds} seconds.`;
    case 'hour_limit':
      const mins = Math.ceil((status.cooldownSeconds || 0) / 60);
      return `Hourly limit reached. AI will be ready in ${mins} minute${mins !== 1 ? 's' : ''}.`;
    case 'day_limit':
      return "You've reached today's AI limit. The app still works — AI resets at midnight.";
    case 'conversation_limit':
      return "This conversation has gotten long! Start fresh to continue using AI.";
    default:
      return '';
  }
}
