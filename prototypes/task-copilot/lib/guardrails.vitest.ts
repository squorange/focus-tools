/**
 * AI Guardrails Tests - Phase 3a
 *
 * Tests for rate limiting, output sanitization, and analytics.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================
// Rate Limiting Tests
// ============================================

describe('Rate Limiting', () => {
  // Mock localStorage
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
    });
  });

  describe('loadRateLimitState', () => {
    it('returns initial state when no stored data', async () => {
      const { loadRateLimitState } = await import('./rate-limit');
      const state = loadRateLimitState();

      expect(state.minuteCount).toBe(0);
      expect(state.hourCount).toBe(0);
      expect(state.dayCount).toBe(0);
      expect(state.conversationTurns).toBe(0);
    });

    it('resets expired minute window', async () => {
      const { loadRateLimitState } = await import('./rate-limit');
      const pastTime = Date.now() - 120000; // 2 minutes ago

      mockStorage['ai-rate-limit'] = JSON.stringify({
        minuteCount: 10,
        minuteResetAt: pastTime,
        hourCount: 5,
        hourResetAt: Date.now() + 3600000,
        dayCount: 3,
        dayResetAt: Date.now() + 86400000,
        conversationTurns: 2,
        lastConversationReset: Date.now(),
      });

      const state = loadRateLimitState();
      expect(state.minuteCount).toBe(0); // Reset
      expect(state.hourCount).toBe(5); // Not reset
      expect(state.dayCount).toBe(3); // Not reset
    });

    it('resets conversation after timeout', async () => {
      const { loadRateLimitState } = await import('./rate-limit');
      const pastTime = Date.now() - (31 * 60 * 1000); // 31 minutes ago

      mockStorage['ai-rate-limit'] = JSON.stringify({
        minuteCount: 0,
        minuteResetAt: Date.now() + 60000,
        hourCount: 0,
        hourResetAt: Date.now() + 3600000,
        dayCount: 0,
        dayResetAt: Date.now() + 86400000,
        conversationTurns: 10,
        lastConversationReset: pastTime,
      });

      const state = loadRateLimitState();
      expect(state.conversationTurns).toBe(0); // Reset after 30min timeout
    });
  });

  describe('checkRateLimit', () => {
    it('allows request when under all limits', async () => {
      const { checkRateLimit, DEFAULT_CONFIG } = await import('./rate-limit');
      const status = checkRateLimit(DEFAULT_CONFIG);

      expect(status.allowed).toBe(true);
      expect(status.reason).toBe('ok');
      expect(status.remaining.minute).toBe(DEFAULT_CONFIG.maxPerMinute);
    });

    it('blocks when minute limit exceeded', async () => {
      const { checkRateLimit, DEFAULT_CONFIG, recordRequest } = await import('./rate-limit');

      // Simulate hitting minute limit
      for (let i = 0; i < DEFAULT_CONFIG.maxPerMinute; i++) {
        recordRequest();
      }

      const status = checkRateLimit(DEFAULT_CONFIG);
      expect(status.allowed).toBe(false);
      expect(status.reason).toBe('minute_limit');
      expect(status.cooldownSeconds).toBeGreaterThan(0);
    });

    it('blocks when day limit exceeded', async () => {
      const { checkRateLimit, DEFAULT_CONFIG } = await import('./rate-limit');

      // Simulate hitting day limit
      mockStorage['ai-rate-limit'] = JSON.stringify({
        minuteCount: 0,
        minuteResetAt: Date.now() + 60000,
        hourCount: 0,
        hourResetAt: Date.now() + 3600000,
        dayCount: DEFAULT_CONFIG.maxPerDay,
        dayResetAt: Date.now() + 86400000,
        conversationTurns: 0,
        lastConversationReset: Date.now(),
      });

      const status = checkRateLimit(DEFAULT_CONFIG);
      expect(status.allowed).toBe(false);
      expect(status.reason).toBe('day_limit');
    });

    it('shows warning when near limit', async () => {
      const { checkRateLimit, DEFAULT_CONFIG } = await import('./rate-limit');

      // Simulate being near day limit (>80%)
      mockStorage['ai-rate-limit'] = JSON.stringify({
        minuteCount: 0,
        minuteResetAt: Date.now() + 60000,
        hourCount: 0,
        hourResetAt: Date.now() + 3600000,
        dayCount: DEFAULT_CONFIG.maxPerDay - 5, // 5 remaining
        dayResetAt: Date.now() + 86400000,
        conversationTurns: 0,
        lastConversationReset: Date.now(),
      });

      const status = checkRateLimit(DEFAULT_CONFIG);
      expect(status.allowed).toBe(true);
      expect(status.nearLimit).toBe(true);
      expect(status.warningMessage).toContain('5');
    });
  });

  describe('recordRequest', () => {
    it('increments all counters', async () => {
      const { loadRateLimitState, recordRequest } = await import('./rate-limit');

      const before = loadRateLimitState();
      expect(before.minuteCount).toBe(0);

      recordRequest();

      const after = loadRateLimitState();
      expect(after.minuteCount).toBe(1);
      expect(after.hourCount).toBe(1);
      expect(after.dayCount).toBe(1);
      expect(after.conversationTurns).toBe(1);
    });
  });

  describe('getRateLimitMessage', () => {
    it('returns friendly message for minute limit', async () => {
      const { getRateLimitMessage } = await import('./rate-limit');
      type RateLimitStatus = Awaited<ReturnType<typeof import('./rate-limit')['checkRateLimit']>>;

      const status: RateLimitStatus = {
        allowed: false,
        reason: 'minute_limit',
        remaining: { minute: 0, hour: 10, day: 100, conversationTurns: 5 },
        cooldownSeconds: 45,
        nearLimit: false,
        warningMessage: null,
      };

      const message = getRateLimitMessage(status);
      expect(message).toContain('45 seconds');
      expect(message).toContain('busy');
    });

    it('returns friendly message for day limit', async () => {
      const { getRateLimitMessage } = await import('./rate-limit');
      type RateLimitStatus = Awaited<ReturnType<typeof import('./rate-limit')['checkRateLimit']>>;

      const status: RateLimitStatus = {
        allowed: false,
        reason: 'day_limit',
        remaining: { minute: 10, hour: 50, day: 0, conversationTurns: 5 },
        cooldownSeconds: 3600,
        nearLimit: false,
        warningMessage: null,
      };

      const message = getRateLimitMessage(status);
      expect(message).toContain("today's AI limit");
      expect(message).toContain('midnight');
    });
  });
});

// ============================================
// Output Sanitization Tests
// ============================================

describe('AI Safety - Output Sanitization', () => {
  describe('sanitizeAIOutput', () => {
    it('escapes HTML entities', async () => {
      const { sanitizeAIOutput } = await import('./ai-safety');

      expect(sanitizeAIOutput('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('escapes ampersands', async () => {
      const { sanitizeAIOutput } = await import('./ai-safety');

      expect(sanitizeAIOutput('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('escapes quotes', async () => {
      const { sanitizeAIOutput } = await import('./ai-safety');

      expect(sanitizeAIOutput("It's a \"test\"")).toBe(
        "It&#039;s a &quot;test&quot;"
      );
    });

    it('handles empty string', async () => {
      const { sanitizeAIOutput } = await import('./ai-safety');

      expect(sanitizeAIOutput('')).toBe('');
    });

    it('preserves safe text', async () => {
      const { sanitizeAIOutput } = await import('./ai-safety');

      const safeText = 'This is a normal task: Buy groceries';
      expect(sanitizeAIOutput(safeText)).toBe(safeText);
    });
  });

  describe('sanitizeErrorForUser', () => {
    it('returns friendly message for credit error', async () => {
      const { sanitizeErrorForUser } = await import('./ai-safety');

      const error = new Error('Your credit balance is too low');
      const message = sanitizeErrorForUser(error);

      expect(message).toContain('credits');
      expect(message).not.toContain('balance');
    });

    it('returns friendly message for rate limit', async () => {
      const { sanitizeErrorForUser } = await import('./ai-safety');

      const error = new Error('Rate limit exceeded');
      const message = sanitizeErrorForUser(error);

      expect(message).toContain('busy');
    });

    it('returns friendly message for network error', async () => {
      const { sanitizeErrorForUser } = await import('./ai-safety');

      const error = new Error('Network error: ECONNRESET');
      const message = sanitizeErrorForUser(error);

      expect(message).toContain('connection');
      expect(message).not.toContain('ECONNRESET');
    });

    it('returns generic message for unknown errors', async () => {
      const { sanitizeErrorForUser } = await import('./ai-safety');

      const error = new Error('Internal server stack trace xyz123');
      const message = sanitizeErrorForUser(error);

      expect(message).toContain('Something went wrong');
      expect(message).not.toContain('stack trace');
      expect(message).not.toContain('xyz123');
    });
  });

  describe('truncateAIText', () => {
    it('returns short text unchanged', async () => {
      const { truncateAIText } = await import('./ai-safety');

      const text = 'Short text';
      expect(truncateAIText(text)).toBe(text);
    });

    it('truncates long text with ellipsis', async () => {
      const { truncateAIText } = await import('./ai-safety');

      const longText = 'A'.repeat(3000);
      const truncated = truncateAIText(longText, 'message');

      expect(truncated.length).toBe(2000);
      expect(truncated.endsWith('...')).toBe(true);
    });
  });
});

// ============================================
// Analytics Tests
// ============================================

describe('Analytics', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
    });
  });

  describe('isAnalyticsEnabled', () => {
    it('returns false by default (opt-in)', async () => {
      const { isAnalyticsEnabled } = await import('./analytics');

      expect(isAnalyticsEnabled()).toBe(false);
    });

    it('returns true after enabling', async () => {
      const { isAnalyticsEnabled, enableAnalytics } = await import('./analytics');

      enableAnalytics();
      expect(isAnalyticsEnabled()).toBe(true);
    });
  });

  describe('trackEvent', () => {
    it('does not track when disabled', async () => {
      const { trackEvent, getAnalyticsSummary, disableAnalytics } = await import('./analytics');

      disableAnalytics();

      trackEvent({
        eventType: 'ai_request',
        requestCategory: 'breakdown',
      });

      const summary = getAnalyticsSummary();
      expect(summary.eventCount).toBe(0);
    });

    it('tracks events when enabled', async () => {
      const { trackEvent, getAnalyticsSummary, enableAnalytics } = await import('./analytics');

      enableAnalytics();

      trackEvent({
        eventType: 'ai_request',
        requestCategory: 'breakdown',
      });

      const summary = getAnalyticsSummary();
      expect(summary.eventCount).toBe(1);
      expect(summary.requestsByCategory['breakdown']).toBe(1);
    });
  });

  describe('trackSuggestionAction', () => {
    it('records suggestion outcomes', async () => {
      const { trackSuggestionAction, getAnalyticsSummary, enableAnalytics } = await import('./analytics');

      enableAnalytics();

      trackSuggestionAction('accepted', 3);
      trackSuggestionAction('rejected', 1);
      trackSuggestionAction('accepted', 2);

      const summary = getAnalyticsSummary();
      expect(summary.suggestionActions['accepted']).toBe(2);
      expect(summary.suggestionActions['rejected']).toBe(1);
    });
  });

  describe('clearAnalytics', () => {
    it('removes all events', async () => {
      const { trackEvent, getAnalyticsSummary, clearAnalytics, enableAnalytics } = await import('./analytics');

      enableAnalytics();

      trackEvent({ eventType: 'ai_request', requestCategory: 'breakdown' });
      trackEvent({ eventType: 'ai_request', requestCategory: 'question' });

      expect(getAnalyticsSummary().eventCount).toBe(2);

      clearAnalytics();

      expect(getAnalyticsSummary().eventCount).toBe(0);
    });
  });

  describe('disableAnalytics', () => {
    it('clears events and disables tracking', async () => {
      const { trackEvent, getAnalyticsSummary, disableAnalytics, enableAnalytics, isAnalyticsEnabled } = await import('./analytics');

      enableAnalytics();
      trackEvent({ eventType: 'ai_request', requestCategory: 'breakdown' });

      disableAnalytics();

      expect(isAnalyticsEnabled()).toBe(false);
      expect(getAnalyticsSummary().eventCount).toBe(0);
    });
  });
});

// ============================================
// AI Service Integration Tests
// ============================================

describe('AI Service', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
    });
  });

  describe('inferRequestCategory', () => {
    it('detects queue mode', async () => {
      const { inferRequestCategory } = await import('./ai-service');

      expect(inferRequestCategory({ queueMode: true, userMessage: '' })).toBe('queue_recommend');
      expect(inferRequestCategory({ tasksViewMode: true, userMessage: '' })).toBe('queue_recommend');
    });

    it('detects focus mode', async () => {
      const { inferRequestCategory } = await import('./ai-service');

      expect(inferRequestCategory({ focusMode: true, userMessage: '' })).toBe('focus_help');
    });

    it('detects breakdown intent', async () => {
      const { inferRequestCategory } = await import('./ai-service');

      expect(inferRequestCategory({ userMessage: 'Break this down into steps' })).toBe('breakdown');
      expect(inferRequestCategory({ userMessage: 'What are the steps?' })).toBe('breakdown');
    });

    it('detects estimate intent', async () => {
      const { inferRequestCategory } = await import('./ai-service');

      expect(inferRequestCategory({ userMessage: 'How long will this take?' })).toBe('estimate');
      expect(inferRequestCategory({ userMessage: 'Estimate the duration' })).toBe('estimate');
    });

    it('defaults to question', async () => {
      const { inferRequestCategory } = await import('./ai-service');

      expect(inferRequestCategory({ userMessage: 'Tell me about this task' })).toBe('question');
    });
  });

  describe('isAIAvailable', () => {
    it('returns true when online and under limits', async () => {
      const { isAIAvailable } = await import('./ai-service');

      vi.stubGlobal('navigator', { onLine: true });

      expect(isAIAvailable()).toBe(true);
    });

    it('returns false when offline', async () => {
      const { isAIAvailable } = await import('./ai-service');

      vi.stubGlobal('navigator', { onLine: false });

      expect(isAIAvailable()).toBe(false);
    });
  });
});
