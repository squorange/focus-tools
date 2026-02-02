# AI Guardrails Specification

> **Status:** Phase 3a — Pre-Test Users
> **Last Updated:** February 2026
> **Audience:** Implementation reference

---

## Overview

AI Guardrails protect users, maintain trust, and control costs as Task Co-Pilot scales from single-user to multi-user. This spec covers Phase 3a (pre-test users) with notes on future phases.

### Goals

1. **Protect API budget** — Prevent runaway costs from heavy or abusive usage
2. **Ensure safety** — No harmful outputs, no system detail leakage
3. **Build trust** — Transparent about AI limitations and data handling
4. **Enable learning** — Privacy-preserving analytics for product improvement
5. **Prepare for scale** — Design patterns that extend to Supabase backend

### Non-Goals (Phase 3a)

- User authentication (deferred to Supabase migration)
- Server-side enforcement (client-side sufficient for ~5 trusted testers)
- Per-user billing or cost allocation
- BYOK (Bring Your Own Key) infrastructure

---

## Phase Overview

| Phase | Focus | Trigger |
|-------|-------|---------|
| **3a** | Rate limiting, safety, transparency, analytics foundation | Before test users |
| **3b** | Output validation, feedback system, safety spot-checks | During initial testing |
| **3c** | Auth design, data isolation, privacy policy, encryption | Before Supabase |
| **3d** | Server-side enforcement, audit logging, BYOK | Post-Supabase |

This spec focuses on **Phase 3a**.

---

## Requirements

### 1. Rate Limiting

**Purpose:** Protect API budget, prevent abuse, encourage efficient usage.

#### Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Requests per minute | 12 | Allows rapid conversation |
| Requests per hour | 60 | Accommodates heavy session |
| Requests per day | 200 | Prevents runaway (~$1.50/user/day max) |
| Conversation turns | 15 | Encourages fresh context, prevents token bloat |

#### Behavior

| Scenario | Response |
|----------|----------|
| Approaching limit (80%) | Subtle indicator: "X requests remaining" |
| Limit reached | Disable AI input, show cooldown timer |
| Cooldown active | "AI available in X seconds/minutes" |
| New day/hour | Limits reset, no notification needed |

#### Data Structure

```typescript
interface RateLimitState {
  // Stored in localStorage, keyed by anonymous session
  minuteCount: number;
  minuteResetAt: number;      // timestamp
  hourCount: number;
  hourResetAt: number;
  dayCount: number;
  dayResetAt: number;
  conversationTurns: number;  // resets on "new conversation"
}

interface RateLimitConfig {
  maxPerMinute: number;       // default: 12
  maxPerHour: number;         // default: 60
  maxPerDay: number;          // default: 200
  maxConversationTurns: number; // default: 15
  warningThreshold: number;   // default: 0.8 (80%)
}
```

#### Implementation Notes

- Check limits BEFORE making API request
- Decrement optimistically, handle failures gracefully
- Store in localStorage (survives refresh, clears on browser data clear)
- Display remaining requests in AI interface (subtle, not alarming)

---

### 2. Graceful Degradation

**Purpose:** App remains functional when AI is unavailable.

#### Scenarios

| Scenario | Behavior |
|----------|----------|
| API timeout | Retry up to 3x with exponential backoff (1s, 2s, 4s) |
| API error (500, 503) | Show friendly error, offer retry button |
| Rate limited (429) | Show cooldown UI (see Rate Limiting) |
| Network offline | Detect via navigator.onLine, show offline state |
| API key invalid | Show configuration error (admin concern) |

#### Error Messages (User-Facing)

| Error Type | Message |
|------------|---------|
| Timeout/Server Error | "AI is taking longer than expected. Try again?" |
| Rate Limited | "You've been busy! AI will be ready again in [time]." |
| Offline | "You're offline. AI features need an internet connection." |
| Generic Failure | "Something went wrong with AI. The app still works — try again later." |

#### Implementation Notes

- ALL non-AI features must work when AI fails
- Never block app startup on AI availability
- Log errors for debugging (sanitized, no user content)
- Consider queueing failed requests for retry (future enhancement)

---

### 3. Transparency & Limitations Disclosure

**Purpose:** Set accurate expectations, build trust.

#### Disclosure Locations

| Location | Content | Trigger |
|----------|---------|---------|
| First-time onboarding | Short version | New user |
| Settings page | Long version | User navigates |
| AI suggestion UI | "AI-generated" label | Every suggestion |
| Help/FAQ | Full explanation | User seeks info |

#### Copy: Short Version (Onboarding/Tooltip)

```
About AI Suggestions

Task Co-Pilot uses AI to help break down tasks and offer suggestions.
Keep in mind:

• Suggestions are starting points — adjust them to fit your needs
• Time estimates are rough guides, not commitments
• The AI doesn't know your full context — you're the expert on your life
• For critical tasks, always verify important details yourself
```

#### Copy: Long Version (Settings/Help)

```
How AI Works in Task Co-Pilot

The AI assistant helps you break down tasks, estimate effort, and get
unstuck. Here's what to know:

WHAT IT'S GOOD AT
• Suggesting concrete next steps when a task feels overwhelming
• Breaking large goals into smaller, actionable pieces
• Offering different approaches when you're stuck

WHAT IT CAN'T DO
• Know your personal schedule, energy, or priorities
• Guarantee time estimates are accurate for you
• Replace your judgment on what matters most

BEST PRACTICE
Treat AI suggestions as a helpful starting point. Review, adjust, and
make them your own. You can always modify or reject any suggestion.

PRIVACY NOTE
Your task content is processed by Anthropic's Claude AI to generate
suggestions. We don't store your tasks on our servers. [See Analytics
Settings for data sharing options.]
```

---

### 4. Output Safety

**Purpose:** Prevent XSS, information leakage, harmful content display.

#### Requirements

| Requirement | Implementation |
|-------------|----------------|
| HTML sanitization | Escape all AI output before rendering |
| No raw error display | Translate API errors to friendly messages |
| No system details | Never expose API keys, URLs, stack traces |
| Content boundaries | AI should only discuss task management |

#### Sanitization

```typescript
function sanitizeAIOutput(text: string): string {
  // Escape HTML entities
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Apply to ALL AI-generated content before rendering:
// - Step titles and descriptions
// - Suggestions in staging area
// - Chat/conversation responses
// - Error messages from AI
```

#### Error Sanitization

```typescript
function sanitizeErrorForUser(error: unknown): string {
  // Log full error internally
  console.error('[AI Error]', error);

  // Return safe message
  if (error instanceof AnthropicError) {
    // Map known error types to friendly messages
    return getfriendlyErrorMessage(error.type);
  }

  // Generic fallback — never expose error.message directly
  return "Something went wrong with AI. Please try again.";
}
```

#### Content Boundary Enforcement

The existing system prompts already scope AI to task management. Additional safeguards:

- If AI response seems off-topic, log for review (don't block)
- Trust Anthropic's built-in safety for harmful content
- Manual spot-checks during testing phase

---

### 5. Analytics Foundation

**Purpose:** Learn from usage to improve product, while respecting privacy.

#### Principles

1. **Minimum necessary** — Only collect what we'll actually use
2. **No content** — Never log task titles, descriptions, or personal info
3. **Opt-in** — User explicitly enables analytics
4. **Transparent** — Show exactly what's collected
5. **Local-first** — Store locally until Supabase migration

#### Opt-In UI

```
┌─────────────────────────────────────────────────────────┐
│  Help improve Task Co-Pilot                             │
│                                                         │
│  Share anonymous usage data to help us understand       │
│  which features are most helpful.                       │
│                                                         │
│  What we collect:                                       │
│  ✓ Which AI features you use (not your task content)   │
│  ✓ Whether suggestions were helpful (accepted/rejected)│
│  ✓ General usage patterns                              │
│                                                         │
│  What we NEVER collect:                                 │
│  ✗ Task titles, descriptions, or notes                 │
│  ✗ Personal information                                │
│  ✗ Anything that identifies you                        │
│                                                         │
│  You can change this anytime in Settings.              │
│                                                         │
│  ┌──────────────────┐  ┌─────────────┐                 │
│  │ Enable Analytics │  │  No Thanks  │                 │
│  └──────────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

#### Event Types

| Event | Category | When Logged |
|-------|----------|-------------|
| `ai_request` | Request type | AI request sent |
| `ai_response` | Success/failure | AI response received |
| `suggestion_action` | Outcome | User acts on suggestion |
| `task_outcome` | Completion | Task started/completed after AI help |

#### Data Structure

```typescript
interface AnalyticsEvent {
  // Anonymous session (random UUID, regenerates periodically)
  sessionId: string;

  // Event identification
  eventType: 'ai_request' | 'ai_response' | 'suggestion_action' | 'task_outcome';
  timestamp: number;

  // Request context (no content)
  requestCategory?:
    | 'breakdown'           // Task breakdown/structuring
    | 'estimate'            // Time estimation
    | 'question'            // User asking about task
    | 'focus_help'          // Help while in focus mode
    | 'get_started'         // Getting started suggestions
    | 'queue_recommend'     // Task recommendation
    | 'metadata_suggest';   // Importance/energy suggestions

  // Response context
  responseSuccess?: boolean;
  responseTimeMs?: number;

  // Suggestion outcome
  suggestionAction?:
    | 'accepted'            // Accepted as-is
    | 'modified'            // Accepted with changes
    | 'rejected'            // Dismissed
    | 'ignored';            // No action taken

  // Task outcome (after AI help)
  taskOutcome?:
    | 'started'             // Task moved to in-progress
    | 'step_completed'      // Step marked complete
    | 'task_completed';     // Entire task completed

  // Non-identifying context
  conversationTurn?: number;    // Which turn in conversation
  taskCount?: number;           // Rough scale: 1-10, 11-50, 51-100, 100+
  queueLength?: number;         // Rough scale: 0, 1-3, 4-10, 10+

  // Timing
  timeSinceLastEvent?: number;  // Seconds since last event
}

interface AnalyticsConfig {
  enabled: boolean;
  sessionId: string;           // Random, regenerates weekly
  lastSessionReset: number;    // Timestamp
}
```

#### Storage (Phase 3a — Local Only)

```typescript
// Store events locally, batch for future upload
interface LocalAnalyticsStore {
  config: AnalyticsConfig;
  events: AnalyticsEvent[];    // Batched, max 1000, FIFO
  lastUpload?: number;         // For future Supabase sync
}
```

#### Sample Report (What We Learn)

```
Weekly AI Usage Report (Anonymized, Aggregated)
───────────────────────────────────────────────
Sessions: 23
Total AI requests: 342

Request breakdown:
  • Task breakdown: 156 (46%)
  • Focus help: 89 (26%)
  • Questions: 52 (15%)
  • Time estimates: 45 (13%)

Suggestion outcomes:
  • Accepted as-is: 52%
  • Modified then accepted: 18%
  • Rejected: 15%
  • Ignored: 15%

Post-AI task outcomes:
  • Tasks started after help: 78%
  • Tasks completed within session: 45%

Performance:
  • Avg response time: 1.2s
  • Error rate: 2%
  • Rate limit hits: 3

Conversation patterns:
  • Avg turns per conversation: 3.2
  • Single-turn interactions: 45%
  • 5+ turn conversations: 12%
```

---

### 6. Feedback Mechanism

**Purpose:** Direct channel for testers to report issues.

#### In-App Feedback

| Element | Behavior |
|---------|----------|
| Feedback button | Persistent, accessible from AI interactions |
| Quick reactions | Thumbs up/down on individual suggestions |
| Detailed feedback | Optional text input for context |

#### Feedback Data Structure

```typescript
interface FeedbackEvent {
  sessionId: string;          // Anonymous
  timestamp: number;

  feedbackType: 'quick' | 'detailed';
  sentiment: 'positive' | 'negative' | 'neutral';

  // Context (no content)
  context: 'suggestion' | 'conversation' | 'general';
  requestCategory?: string;   // What type of AI interaction

  // Detailed feedback only
  feedbackText?: string;      // User's own words (they choose to share)

  // Note: feedbackText is the ONE place users explicitly
  // provide content — they're opting in by typing it
}
```

#### Direct Message Channel

- Provide email or form link in app settings
- For detailed bug reports or feature requests
- Outside of in-app analytics (separate channel)

---

## Implementation Checklist

### Phase 3a: Pre-Test Users

```
Rate Limiting
├── [ ] Create RateLimitState storage utilities
├── [ ] Implement limit checking before API calls
├── [ ] Add cooldown UI component
├── [ ] Display remaining requests (subtle indicator)
└── [ ] Reset logic for minute/hour/day boundaries

Graceful Degradation
├── [ ] Retry logic with exponential backoff
├── [ ] Friendly error message mapping
├── [ ] Offline detection (navigator.onLine)
├── [ ] Ensure all non-AI features work independently
└── [ ] Error logging (sanitized)

Transparency
├── [ ] Add limitations disclosure to onboarding
├── [ ] Add detailed explanation to Settings/Help
├── [ ] Ensure "AI-generated" labeling on suggestions
└── [ ] Review existing staging workflow (already good)

Output Safety
├── [ ] Audit all AI output rendering points
├── [ ] Add sanitizeAIOutput() to each
├── [ ] Implement error sanitization
├── [ ] Test with edge cases (XSS attempts)
└── [ ] Verify no system details in user-facing errors

Analytics Foundation
├── [ ] Create AnalyticsEvent types
├── [ ] Implement local storage for events
├── [ ] Add opt-in UI to onboarding
├── [ ] Add analytics toggle to Settings
├── [ ] Instrument AI request points
├── [ ] Instrument suggestion action points
├── [ ] Instrument task outcome tracking
└── [ ] Create session ID management

Feedback
├── [ ] Add feedback button to AI interface
├── [ ] Implement quick reaction (thumbs up/down)
├── [ ] Add detailed feedback modal
├── [ ] Store feedback events locally
└── [ ] Add direct contact link in Settings
```

---

## Future Phases (Notes)

### Phase 3b: During Testing

- Validate rate limits are appropriate (adjust based on actual usage)
- Spot-check AI outputs for safety edge cases
- Review feedback for common issues
- Aggregate analytics manually (local storage inspection)

### Phase 3c: Pre-Supabase

- Design authentication flow (Supabase Auth)
- Plan data isolation (Row Level Security)
- Draft privacy policy and terms of service
- Decide on encryption strategy (Supabase default vs E2E)
- Plan analytics table schema

### Phase 3d: Post-Supabase

- Migrate rate limiting to server-side (authoritative)
- Implement per-user usage tracking
- Set up analytics pipeline (events → Supabase → reports)
- Add audit logging (privacy-preserving)
- Build BYOK infrastructure
- Implement cost tracking per user

---

## Cost Projections

### Phase 3a (5 Users, Shared API Key)

| Scenario | Daily Cost | Monthly Cost |
|----------|------------|--------------|
| Light usage (30 req/user/day) | ~$0.75 | ~$22 |
| Normal usage (75 req/user/day) | ~$1.90 | ~$56 |
| Heavy usage (150 req/user/day) | ~$3.75 | ~$112 |
| Max (rate limited, 200/user/day) | ~$7.50 | ~$225 |

**Budget recommendation:** Plan for $100-150/month during testing phase.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE_EVOLUTION_GUIDE.md](../../ARCHITECTURE_EVOLUTION_GUIDE.md) | Infrastructure phasing rationale |
| [lib/prompts.ts](../../../prototypes/task-copilot/lib/prompts.ts) | Current AI system prompts |
| [lib/ai-tools.ts](../../../prototypes/task-copilot/lib/ai-tools.ts) | AI tool definitions |
| [app/api/structure/route.ts](../../../prototypes/task-copilot/app/api/structure/route.ts) | AI API endpoint |
