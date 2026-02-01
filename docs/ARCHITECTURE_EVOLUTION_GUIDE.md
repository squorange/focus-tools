# Focus Tools — Architecture Evolution Guide

> **Status:** Living document  
> **Last Updated:** January 2025  
> **Purpose:** Guide timing decisions for introducing architectural infrastructure  
> **Audience:** Development planning, Claude Code sessions

---

## 1. Why This Document Exists

Premature abstraction kills projects. So does scaling without structure. This guide helps answer: **"When should we add [framework/middleware/orchestration/harness]?"**

The goal is to build smartly for the long term without over-engineering the present.

---

## 2. Key Definitions

| Term | Definition | Examples |
|------|------------|----------|
| **Framework** | Foundational libraries that shape application structure | Next.js, React, Supabase |
| **Orchestration** | Logic that coordinates multiple systems/flows to achieve a goal | AI routing between Admin/Execution domains, multi-step workflows |
| **Middleware** | Code that sits between layers, transforming or routing data | Auth middleware, request logging, AI context injection |
| **Harness** | Testing/debugging infrastructure that wraps components | Test suites, mock AI responses, state snapshots, replay systems |
| **Abstraction layer** | Code that hides complexity behind a simpler interface | `useAIAssistant` hook, ThemeAdapter interface |

### Related Concepts

| Term | Definition | When Relevant |
|------|------------|---------------|
| **State machine** | Formal definition of states + transitions | Complex UI flows, AI conversation modes |
| **Message bus/queue** | Decoupled communication between components | Multi-service architectures, offline-first |
| **Agent framework** | Infrastructure for autonomous AI task execution | When AI takes multi-step actions independently |
| **Feature flags** | Runtime toggles for features | A/B testing, gradual rollouts |

---

## 3. The Timing Heuristic

### General Principle

**Introduce infrastructure when you hit 2+ of these signals:**

| Signal | Description | Example |
|--------|-------------|---------|
| **Repetition** | Copy-pasting similar logic across 3+ places | Same context-building code in multiple API routes |
| **Coordination complexity** | Managing state across multiple components becomes error-prone | MiniBar ↔ Palette ↔ StagingArea sync bugs |
| **Testing friction** | Can't reliably test behaviors without manual clicking | AI responses need integration tests |
| **Context drift** | Inconsistent behavior because logic is scattered | Different AI responses from same intent |
| **Debugging difficulty** | Hard to trace what happened | "Why did AI suggest that?" |
| **Onboarding friction** | New code requires extensive explanation | "You have to remember to update X, Y, and Z" |

### Anti-Patterns to Avoid

| Anti-Pattern | Description | Better Approach |
|--------------|-------------|-----------------|
| **Premature abstraction** | Building infrastructure before understanding the problem | Build concrete implementations first; abstract after 3+ similar cases |
| **Resume-driven development** | Adding tech because it's impressive, not needed | Ask: "What problem does this solve *today*?" |
| **Invisible complexity** | Abstractions that hide too much, making debugging hard | Prefer "progressive disclosure" — simple surface, complexity available when needed |
| **Framework lock-in** | Choosing heavyweight solutions early | Prefer composition over frameworks; stay flexible |

---

## 4. Layer-by-Layer Guidance

### 4.1 Frameworks

**When to choose:** Project start  
**Decision weight:** High (hard to change later)

| Consideration | Guidance |
|---------------|----------|
| Choose boring tech | Well-documented, stable, community support |
| Match team skills | Learning curve matters for velocity |
| Consider exit cost | How hard to migrate away? |

**Focus Tools status:** ✅ Decided (Next.js, React, Tailwind, Supabase planned)

---

### 4.2 Abstraction Layers (Hooks, Adapters)

**When to introduce:** When a pattern repeats 2-3 times  
**Decision weight:** Medium (can refactor)

| Signal | Action |
|--------|--------|
| Same code in 2 places | Note it, don't abstract yet |
| Same code in 3 places | Extract shared hook/utility |
| Interface varies by context | Consider adapter pattern |

**Focus Tools examples:**
- `useAIAssistant` hook — ✅ Appropriate (centralizes AI state)
- `ThemeAdapter` interface — ⏳ Design now, implement later (documented in FUTURE_CONSIDERATIONS.md)

---

### 4.3 Orchestration

**When to introduce:** When coordinating 3+ concerns for a single user action  
**Decision weight:** Medium-High

**Signals you need orchestration:**

```
❌ Without orchestration:
if (context === 'focus') {
  // 20 lines of focus-specific logic
} else if (context === 'planning') {
  // 20 lines of planning-specific logic
} else if (context === 'inbox') {
  // 20 lines of inbox-specific logic
}
// Repeated in 4 different files
```

```
✅ With orchestration:
const handler = orchestrator.getHandler(context);
const result = await handler.process(input);
```

**Types of orchestration:**

| Type | Use When | Example |
|------|----------|---------|
| **Router** | Same input, different handling by context | AI request → route to Admin or Execution domain |
| **Pipeline** | Sequential transformations | User input → validate → enrich context → call AI → format response |
| **Saga/Workflow** | Multi-step with rollback | Create task → breakdown → user confirms → save (or rollback) |
| **State machine** | Complex state transitions | MiniBar collapsed ↔ Palette expanded ↔ Drawer open |

**Focus Tools status:**
- AI domain routing (Admin/Execution) — ⏳ Watch for need (currently single domain)
- UI state machine — ✅ Implicit in `useAIAssistant` (consider formalizing if bugs emerge)

---

### 4.4 Middleware

**When to introduce:** When you need consistent behavior across many requests  
**Decision weight:** Low-Medium (easy to add incrementally)

**Common middleware patterns:**

| Pattern | Purpose | Introduce When |
|---------|---------|----------------|
| **Auth** | Verify user identity | Adding user accounts |
| **Logging** | Track requests/responses | Debugging production issues |
| **Context injection** | Add user/session context to AI calls | AI needs user history |
| **Rate limiting** | Prevent abuse | Public API exposure |
| **Error transformation** | Consistent error format | Multiple API consumers |

**Focus Tools status:**
- Auth middleware — ⏳ Phase 3 (Supabase)
- AI context injection — ⏳ Watch for need (when AI needs cross-session context)
- Logging — ⏳ Phase 3+ (production debugging)

---

### 4.5 Test Harnesses

**When to introduce:** Before the first "production" deployment  
**Decision weight:** Medium (technical debt if delayed too long)

**Types of harnesses:**

| Type | Purpose | Build When |
|------|---------|------------|
| **Unit tests** | Verify isolated functions | Complex logic (calculations, transformations) |
| **Integration tests** | Verify component interactions | Before backend integration |
| **E2E tests** | Verify user flows | Before production release |
| **AI mock system** | Deterministic AI responses for testing | Before integration tests |
| **State snapshot/replay** | Debug complex state bugs | When state bugs appear |
| **Visual regression** | Catch UI changes | After design stabilizes |

**Focus Tools status:**
- AI mock responses — ✅ Exists (`lib/mock-responses.ts`)
- Integration tests — ⏳ Before Supabase (Phase 3)
- E2E tests — ⏳ Before production

---

## 5. Focus Tools Phase Mapping

### Infrastructure Evolution (Planned)

| Phase | Focus | Enables |
|-------|-------|---------|
| **1. IndexedDB Migration** | Async storage, larger capacity | Service worker access, offline-first |
| **2. Test Harnesses** | Integration tests, E2E framework | Safe refactoring, CI/CD |
| **3. AI Guardrails** | Reliability, safety, consistency constraints | Production-ready AI |
| **4. Design System Extraction** | Design tokens, component primitives | Theming, Orbital Zen |
| **5. Auth & User Accounts** | Supabase auth, session management | Multi-device, cloud sync prep |
| **6. Capacitor (Native)** | iOS/Android wrapper | Push notifications, voice APIs |
| **7. Theming Infrastructure** | Theme provider, switching UI | Multiple visual modes |
| **8. Orbital Zen Theme** | Planetary visualization | Calming alternative UI |
| **9. Supabase Sync** | Cross-device sync, backup | Collaboration foundations |

See [ROADMAP.md](./ROADMAP.md) for detailed status and [features/indexeddb-migration/](./features/indexeddb-migration/) for current work.

### Current Phase Checklist

| Decision | Status | Notes |
|----------|--------|-------|
| Core frameworks | ✅ Decided | Next.js, React, Tailwind |
| AI abstraction | ✅ In place | `useAIAssistant` hook |
| State machine formalization | 🔶 Optional | If state bugs emerge, formalize |
| AI domain orchestration | ⏳ Watch | When Admin/Execution prompts diverge significantly |
| IndexedDB migration | 📋 Planned | Phase 1 of infrastructure evolution |
| Test harnesses | 📋 Planned | Phase 2, before AI guardrails |
| AI guardrails | 📋 Planned | Phase 3, reliability/safety/consistency constraints |
| Design system extraction | 📋 Planned | Phase 4, enables theming |
| Context middleware | ⏳ Phase 5 | When auth introduces persistent user context |

---

## 6. Decision Log Template

When making an infrastructure decision, document it:

```markdown
### [Date]: [Decision Title]

**Context:** What situation prompted this decision?

**Options considered:**
1. Option A — pros/cons
2. Option B — pros/cons

**Decision:** What we chose and why

**Signals that would trigger revisiting:**
- Signal 1
- Signal 2
```

---

## 7. Watch List

Track emerging complexity here. When 2+ signals appear, it's time to act.

| Area | Signals Observed | Count | Action Threshold |
|------|------------------|-------|------------------|
| AI routing | Planning mode (SYSTEM_PROMPT) vs Focus mode (FOCUS_MODE_PROMPT) diverging [Jan 2026] | 1/2 | Extract orchestrator |
| State management | Queue selection logic + modal state getting complex; FocusSelectionModal simplified [Jan 2026] | 1/2 | Formalize state machine |
| Testing | queue-reorder.ts has unit tests [Jan 2026]; priority calculation has 64 tests [Jan 2026] | 1/2 | Add integration tests |
| Context building | Per-view AI context manageable via useContextualPrompts hook | 0/2 | Add context middleware |
| Component coupling | UI and logic intertwined; theming would require significant refactoring [Feb 2026] | 1/2 | Extract design system |
| Storage limits | localStorage pruning logic exists; events truncated to 1000 [Feb 2026] | 1/2 | Migrate to IndexedDB |

**Current Assessment (February 2026):**
- **AI routing:** Two distinct prompt modes exist but share same API route. If a third mode emerges (e.g., Triage AI), consider router extraction.
- **State management:** Recent modal simplification reduced complexity. Watch for coordination bugs between MiniBar ↔ Palette ↔ TaskDetail.
- **Testing:** Unit tests exist for critical logic (queue-reorder, priority calculation). Integration tests needed before auth/backend work. Harnesses planned as Phase 2 of infrastructure evolution.
- **Context building:** Current hook-based approach working well. Middleware needed when auth introduces persistent user history.
- **Component coupling:** Theming/Orbital Zen requires separation of logic from presentation. Design system extraction planned after IndexedDB migration.
- **Storage limits:** localStorage reaching practical limits. IndexedDB migration planned as Phase 1 of infrastructure evolution.

**How to update:** When you notice a signal (repeated code, coordination bug, etc.), add it here with date. When count reaches threshold, address it.

---

## 8. Resources & References

**Internal:**
- `AI_UI_COMMUNICATION_PATTERNS.md` — Technical patterns for AI integration
- `FUTURE_CONSIDERATIONS.md` — Feature-level strategic options
- `focus-tools-roadmap.md` — Phase definitions and timeline

**External:**
- [XState](https://xstate.js.org/) — State machine library (if formalizing)
- [tRPC](https://trpc.io/) — Type-safe API layer (if API complexity grows)
- [Playwright](https://playwright.dev/) — E2E testing (Phase 4+)

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Updated watch list with current signals and assessment; added context for each area |
| 2025-01 | Initial document created |
