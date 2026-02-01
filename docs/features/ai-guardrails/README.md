# AI Guardrails

> **Status:** 📋 Planned (Infra Phase 3)
> **Last Updated:** February 2026
> **Purpose:** Constraints on AI behavior for reliability, safety, consistency, and accuracy
> **Dependencies:** Test Harnesses (Infra Phase 2)

---

## Overview

AI Guardrails are constraints and validation layers that ensure the AI assistant behaves reliably, safely, and consistently. This is distinct from test harnesses (which test the app) — guardrails are runtime constraints that protect users and the system.

**Current state:** Task Co-Pilot has implicit guardrails (AI suggests → user confirms in staging), but nothing formalized or comprehensive.

**Target state:** Explicit, testable guardrails that ensure production-ready AI behavior.

---

## Guardrail Categories

### 1. Reliability

Ensure AI interactions complete successfully and degrade gracefully.

| Guardrail | Description | Current State |
|-----------|-------------|---------------|
| **Retry logic** | Automatic retry on transient failures | ⬜ Not implemented |
| **Timeout handling** | Graceful timeout with user feedback | ⬜ Partial |
| **Fallback responses** | Sensible defaults when AI fails | ⬜ Not implemented |
| **Circuit breaker** | Stop calling AI if repeated failures | ⬜ Not implemented |
| **Offline handling** | Queue requests when offline | ⬜ Not implemented |

### 2. Safety

Protect users from harmful or unexpected AI behavior.

| Guardrail | Description | Current State |
|-----------|-------------|---------------|
| **Output sanitization** | Prevent XSS, injection in AI output | ⬜ Not implemented |
| **PII filtering** | Detect/warn about PII in prompts | ⬜ Not implemented |
| **Action confirmation** | User confirms before destructive actions | ✅ Staging workflow |
| **Content boundaries** | AI stays within task management domain | ⬜ Implicit only |
| **Rate limiting** | Prevent runaway API usage | ⬜ Not implemented |

### 3. Consistency

Ensure AI behaves predictably across contexts.

| Guardrail | Description | Current State |
|-----------|-------------|---------------|
| **Structured output validation** | Validate AI responses match expected schema | ⬜ Partial |
| **Schema enforcement** | Reject malformed responses | ⬜ Not implemented |
| **Deterministic parsing** | Consistent extraction from AI responses | ⬜ Partial |
| **Context window management** | Ensure context doesn't exceed limits | ⬜ Implicit |
| **Prompt versioning** | Track prompt versions for debugging | ⬜ Not implemented |

### 4. Accuracy

Ensure AI outputs are relevant and useful.

| Guardrail | Description | Current State |
|-----------|-------------|---------------|
| **Relevance scoring** | Detect off-topic responses | ⬜ Not implemented |
| **Confidence thresholds** | Only surface high-confidence suggestions | ⬜ Not implemented |
| **Hallucination detection** | Detect invented information | ⬜ Not implemented |
| **Source grounding** | AI responses reference actual task data | ⬜ Implicit |

### 5. Boundaries

Define what AI can and cannot do.

| Boundary | Description | Current State |
|----------|-------------|---------------|
| **Read-only by default** | AI suggests, never directly modifies | ✅ Via staging |
| **No auto-delete** | AI cannot delete tasks without confirmation | ✅ Implicit |
| **No external calls** | AI cannot make network requests | ✅ Architecture |
| **Scoped context** | AI only sees relevant task data | ⬜ Partial |
| **Action whitelist** | Explicit list of allowed AI actions | ⬜ Not implemented |

---

## Implementation Approach

### Phase 3a: Core Reliability
- Retry logic with exponential backoff
- Timeout handling with user feedback
- Basic fallback responses
- Error categorization (transient vs. permanent)

### Phase 3b: Output Validation
- JSON schema validation for AI responses
- Structured output parsing
- Malformed response handling
- Logging for debugging

### Phase 3c: Safety Layer
- Output sanitization
- Content boundary enforcement
- Rate limiting
- PII detection (warning, not blocking)

### Phase 3d: Monitoring & Observability
- Guardrail violation logging
- Success/failure metrics
- Response quality tracking
- Cost monitoring

---

## Architecture Sketch

```
┌─────────────────────────────────────────────────────────┐
│                    User Request                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Input Guardrails                       │
│  • Context size check                                    │
│  • PII detection                                         │
│  • Rate limiting                                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    AI API Call                           │
│  • Retry logic                                           │
│  • Timeout handling                                      │
│  • Circuit breaker                                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Output Guardrails                       │
│  • Schema validation                                     │
│  • Sanitization                                          │
│  • Relevance check                                       │
│  • Fallback if invalid                                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               Staging / User Confirmation                │
│  • User reviews suggestions                              │
│  • Accept / reject / modify                              │
└─────────────────────────────────────────────────────────┘
```

---

## Open Questions

- [ ] How strict should schema validation be? (Reject vs. attempt recovery)
- [ ] Should PII detection block or warn?
- [ ] What metrics are most important to track?
- [ ] How to handle AI model changes (prompt drift)?
- [ ] Should guardrails be configurable per user?

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [ROADMAP.md](../../ROADMAP.md) | Infrastructure evolution timeline |
| [ARCHITECTURE_EVOLUTION_GUIDE.md](../../ARCHITECTURE_EVOLUTION_GUIDE.md) | Decision framework |
| [../indexeddb-migration/](../indexeddb-migration/) | Phase 1 (prerequisite: none) |
| Test Harnesses | Phase 2 (prerequisite for testing guardrails) |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-02 | Initial placeholder document |
