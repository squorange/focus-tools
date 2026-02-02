# AI Guardrails

> **Status:** 🔄 In Progress (Infra Phase 3)
> **Last Updated:** February 2026
> **Purpose:** Protect users, maintain trust, and control costs as Task Co-Pilot scales
> **Dependencies:** Test Harnesses (Infra Phase 2) ✅

---

## Overview

AI Guardrails are constraints and validation layers that ensure the AI assistant behaves reliably, safely, and consistently. This is infrastructure required **before onboarding test users**.

**Current state:** Core implementation complete (rate limiting, analytics, safety utilities, UI components). Integration with AI call sites pending.

**Target state:** Explicit, testable guardrails with usage controls, privacy-preserving analytics, and transparent limitations.

---

## Key Capabilities

| Category | What It Protects Against |
|----------|--------------------------|
| **Rate Limiting** | Runaway API costs, abuse |
| **Graceful Degradation** | API failures breaking the app |
| **Transparency** | Unrealistic expectations of AI |
| **Output Safety** | XSS, information leakage |
| **Analytics** | Flying blind on product decisions |
| **Feedback** | Missing user problems |

---

## Implementation Phases

| Phase | Focus | Trigger | Status |
|-------|-------|---------|--------|
| **3a** | Rate limiting, safety, transparency, analytics foundation | Before test users | 🔄 In Progress |
| **3b** | Output validation, feedback refinement, safety spot-checks | During testing | ⬜ Future |
| **3c** | Auth design, data isolation, privacy policy | Before Supabase | ⬜ Future |
| **3d** | Server-side enforcement, audit logging, BYOK | Post-Supabase | ⬜ Future |

---

## Phase 3a Summary (Pre-Test Users)

### Rate Limits

| Limit | Value |
|-------|-------|
| Requests per minute | 12 |
| Requests per hour | 60 |
| Requests per day | 200 |
| Conversation turns | 15 |

### Key Deliverables

- [x] Client-side rate limiting with cooldown UI (`lib/rate-limit.ts`)
- [x] Graceful degradation (retry logic, friendly errors, offline detection)
- [x] AI limitations disclosure components (`components/shared/AIDisclosure.tsx`)
- [x] Output sanitization (XSS prevention) (`lib/ai-safety.ts`)
- [x] Privacy-preserving analytics (opt-in) (`lib/analytics.ts`)
- [x] In-app feedback mechanism (`components/shared/AIFeedback.tsx`)
- [x] Centralized AI service with guardrails (`lib/ai-service.ts`)
- [x] Test coverage (35 tests in `lib/guardrails.vitest.ts`)
- [x] Integration with page.tsx AI call sites (both `handleAIMinibarSubmit` and `handleRequestRecommendation`)

### Cost Budget

~$100-150/month for 5 test users at normal-to-heavy usage.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Request                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Input Guardrails                       │
│  • Rate limiting (client-side)                          │
│  • Context size check                                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    AI API Call                           │
│  • Retry logic (3x, exponential backoff)                │
│  • Timeout handling                                      │
│  • Error categorization                                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Output Guardrails                       │
│  • Sanitization (XSS prevention)                        │
│  • Error message sanitization                           │
│  • Fallback if invalid                                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               Staging / User Confirmation                │
│  • User reviews suggestions                              │
│  • Accept / reject / modify                              │
│  • Analytics: track outcome                              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Analytics Events                      │
│  • Request type, response success                        │
│  • Suggestion action (accepted/rejected/modified)       │
│  • Task outcome (started/completed after help)          │
└─────────────────────────────────────────────────────────┘
```

---

## Documents

| Document | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Full requirements, data structures, UI copy, implementation checklist |

---

## Related

| Document | Purpose |
|----------|---------|
| [ROADMAP.md](../../ROADMAP.md) | Infrastructure evolution timeline |
| [ARCHITECTURE_EVOLUTION_GUIDE.md](../../ARCHITECTURE_EVOLUTION_GUIDE.md) | Decision framework |
| [test-harnesses/](../test-harnesses/) | Phase 2 (prerequisite) ✅ |

---

## Implementation Files

| File | Purpose |
|------|---------|
| `lib/rate-limit.ts` | Rate limiting state, checking, recording |
| `lib/ai-safety.ts` | Output sanitization, error sanitization, offline detection |
| `lib/analytics.ts` | Privacy-preserving analytics (opt-in), event tracking |
| `lib/ai-service.ts` | Centralized AI request wrapper with all guardrails |
| `components/shared/AIDisclosure.tsx` | Transparency UI (short/long disclosure, analytics opt-in) |
| `components/shared/AIFeedback.tsx` | Feedback mechanism (quick reactions, detailed modal) |
| `lib/guardrails.vitest.ts` | 35 tests covering rate limiting, safety, analytics |

---

## Future Enhancements (Low Priority)

| Enhancement | Components | Why Deferred |
|-------------|------------|--------------|
| Feedback reactions (thumbs up/down) | `components/shared/AIFeedback.tsx` | Low engagement (~1-5%), limited signal without task content. Direct user communication more valuable at small scale. Revisit at 1000+ users. |
| AI disclosure in onboarding | `components/shared/AIDisclosure.tsx` | Components ready, but onboarding flow not yet built. Wire in when adding first-run experience. |
| Analytics opt-in UI | `AnalyticsOptIn` in `AIDisclosure.tsx` | Analytics tracking works, opt-in UI ready. Add to Settings when building preferences panel. |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-02-01 | Phase 3a complete: Integrated into page.tsx, documented future enhancements |
| 2026-02-01 | Core implementation complete: rate limiting, analytics, safety, UI components, 35 tests |
| 2026-02-01 | Added SPEC.md with detailed Phase 3a requirements |
| 2026-02 | Initial placeholder document |
