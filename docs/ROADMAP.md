# Focus Tools — Roadmap

> **Status:** Living document
> **Last Updated:** February 2026
> **Purpose:** Track progress and plan future work

---

## Current State

| Component | Status |
|-----------|--------|
| Product Vision & Framework | ✅ Defined |
| Planning Loop (AI task breakdown) | ✅ Complete |
| Execution Loop (Body Double) | ✅ Complete |
| AI MiniBar (4-surface model) | ✅ Complete |
| PWA & Mobile | ✅ Complete |
| Nudge System MVP | ✅ Complete |
| Recurring Tasks | 🔄 In Progress (Phase 1-2 done) |
| IndexedDB Migration | ✅ Complete |
| Test Harnesses | ✅ Complete (Infra Phase 2) |
| AI Guardrails | 📋 Planned (Infra Phase 3) |
| Design System Extraction | 📋 Planned (Infra Phase 4) |
| Auth & User Accounts | 📋 Planned (Infra Phase 5) |
| Capacitor (Native) | 📋 Planned (Infra Phase 6) |
| Theming Infrastructure | 📋 Planned (Infra Phase 7) |
| Orbital Zen Theme | 📋 Planned (Infra Phase 8) |
| Supabase Sync | ⏸️ Deferred (Infra Phase 9) |

---

## Completed Phases

### Phase 0: Planning Loop ✅
AI-assisted task breakdown validated.
- AI structures rough intent into steps
- Multi-turn conversational refinement
- Staging workflow for user control
- localStorage persistence

### Phase 1: Execution Loop ✅
Body double concept validated for ADHD execution support.
- Focus mode UI (single task centered)
- Session timer with pause/resume
- "I'm stuck" → StuckMenu with 4 resolution paths
- Celebration on completion

### Phase 2: Unified Prototype ✅
Single prototype combining Planning + Execution.
- Multi-task support
- Task list overview (TasksView with Inbox + Pool)
- Model E workflow: Inbox → Pool → Focus Queue → Completed
- List view as primary (Orbital deferred)

### Phase 3a: PWA + Mobile ✅
Usable daily driver on iPhone.
- PWA manifest + service worker
- Mobile viewport + touch optimization
- iOS dark mode theming
- Task reminders with notifications
- Deep linking

### Nudge System MVP ✅ (January 2026)
Intelligent priority and notification system.
- Priority score calculation (7 components)
- Priority Queue in NotificationsHub
- Importance, energy type, lead time fields
- Runway nudge (planning reminder)
- Orchestrator with deduplication + quiet hours
- Energy selector with filtering
- Settings UI for quiet hours + cooldown

---

## In Progress

### Recurring Tasks 🔄
Critical for routines and daily habits.

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Data Model | ✅ | Schema v9, recurring-types.ts |
| 2. Gallery UI | ✅ | RoutineCard, RoutinesGallery |
| 3. Instance Creation | ⬜ | Generate task instances |
| 4. Focus Integration | ⬜ | Queue + Focus Mode |
| 5. Streak Logic | ⬜ | Calculation + display |
| 6. Polish | ⬜ | Edge cases, rollover |

---

## Current Sprint

See [CLAUDE.md](../prototypes/task-copilot/CLAUDE.md) for detailed sprint context.

| Priority | Item | Status |
|----------|------|--------|
| P1 | Recurring Tasks (Phase 3-6) | ⬜ |
| P1 | IndexedDB Migration (Infra Phase 1) | ✅ Complete |
| P1 | Test Harnesses (Infra Phase 2) | ✅ Complete |
| P1 | AI Guardrails (Infra Phase 3) | 📋 Planned |
| P2 | Design System Extraction (Infra Phase 4) | ⬜ |
| P2 | Proactive stale task nudge | ⬜ |
| P2 | Inline AI Actions (Tasks) | ⬜ |
| P3 | Auth & Accounts (Infra Phase 5) | ⬜ |
| P3 | Capacitor + Push (Infra Phase 6) | ⬜ |

---

## Upcoming

### Infrastructure Evolution (Planned Sequence)

The following improvements build on each other and should be implemented in order:

| Phase | Feature | Purpose | Enables |
|-------|---------|---------|---------|
| **1** | [IndexedDB Migration](./features/indexeddb-migration/) ✅ | Async storage, larger capacity | Service worker access, offline-first |
| **2** | [Test Harnesses](./features/test-harnesses/) ✅ | Integration tests, E2E framework | Safe refactoring, CI/CD |
| **3** | [AI Guardrails](./features/ai-guardrails/) | Reliability, safety, consistency constraints | Production-ready AI |
| **4** | Design System Extraction | Design tokens, component primitives | Theming, Orbital Zen |
| **5** | Auth & User Accounts | Supabase auth, sessions | Multi-device, cloud sync prep |
| **6** | Capacitor (Native) | iOS/Android wrapper | Push notifications, voice APIs |
| **7** | Theming Infrastructure | Theme provider, switching UI | Multiple visual modes |
| **8** | [Orbital Zen Theme](./concepts/ORBITAL_ZEN.md) | Planetary visualization | Calming alternative UI |
| **9** | Supabase Sync | Cross-device sync, backup | Collaboration foundations |

**Why this order:**
1. **IndexedDB first** — Solves immediate localStorage limits, enables service worker access, foundation for everything else
2. **Test harnesses second** — Safety net before major refactoring (design system, auth)
3. **AI guardrails third** — Reliability, safety, and consistency before scaling; test harnesses enable testing guardrails
4. **Design system fourth** — Separates logic from presentation, enables theming
5. **Auth fifth** — User identity needed before cloud features and native push
6. **Capacitor sixth** — Native push notifications require auth backend; voice APIs need native shell
7. **Theming seventh** — Build on design system foundation
8. **Orbital Zen eighth** — First alternative theme, validates theme architecture
9. **Supabase sync last** — Optional cloud sync on top of solid local-first foundation

See [ARCHITECTURE_EVOLUTION_GUIDE.md](./ARCHITECTURE_EVOLUTION_GUIDE.md) for decision framework.

### Feature Work (Can Parallel)

These can be worked on alongside infrastructure phases:
- Recurring Tasks (Phase 3-6)
- Proactive stale task nudge
- Inline AI Actions (Tasks)
- Reflection/journey view

### Later Features

- "What was that thing about X?" recall
- Stale task detection (drift)
- Proactive nudges (configurable)
- Conflict detection
- Onboarding flow
- Settings / preferences improvements

---

## Long-term / Not Scheduled

| Feature | Notes |
|---------|-------|
| Calendar integration | External API required |
| Voice input | After Capacitor (native APIs preferred) |
| Email parsing | Extract tasks from email |
| Collaboration | After Supabase sync |
| Community theme packs | After Orbital Zen validates theme architecture |
| AI importance/energy inference | Learn from patterns |

---

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12 | Single AI persona | Simpler than dual personas |
| 2025-12 | Admin ↔ Execution parallel | Matches real usage patterns |
| 2025-12 | List view for MVP | Orbital Zen deferred to Phase 7 |
| 2026-01 | localStorage for now | Validate UX before backend |
| 2026-01 | PWA → Capacitor path | Code reuse, quick iteration |
| 2026-02 | 9-phase infrastructure evolution | IndexedDB → Harnesses → AI Guardrails → Design System → Auth → Capacitor → Theming → Orbital Zen → Supabase |
| 2026-02 | Harnesses before design system | Safety net for major refactoring |
| 2026-02 | AI Guardrails as Phase 3 | Reliability/safety/consistency constraints before scaling; test harnesses enable testing guardrails |
| 2026-02 | Auth before Capacitor | Push notifications need user identity |

---

## Mobile Path

**Selected:** PWA → Capacitor → (React Native if needed)

| Phase | Status | Outcome |
|-------|--------|---------|
| PWA Validation | ✅ Complete | Daily driver on iPhone |
| Capacitor Wrapper | ⬜ | TestFlight distribution |
| App Store | ⬜ | Public release |

---

## Validation Status

| Hypothesis | Status | Evidence |
|------------|--------|----------|
| AI can structure messy intent | ✅ Validated | Task Co-Pilot works |
| Body double helps execution | ✅ Validated | Focus Mode effective |
| AI recommendations add value | ✅ Validated | "What next?" used |
| Priority system helps focus | ✅ Validated | Priority Queue used |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [VISION.md](./VISION.md) | Goals and concepts |
| [features/INDEX.md](./features/INDEX.md) | Feature catalog |
| [CLAUDE.md](../prototypes/task-copilot/CLAUDE.md) | Sprint details |
