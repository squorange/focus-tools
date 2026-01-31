# Focus Tools — Roadmap

> **Status:** Living document
> **Last Updated:** January 2026
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
| Backend / Persistence | ⏸️ Deferred |

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
| P1 | Proactive stale task nudge | ⬜ |
| P2 | Inline AI Actions (Tasks) | ⬜ |
| P2 | Reflection/journey view | ⬜ |
| P2 | Voice capture | ⬜ |
| P3 | Context switch bookmarking | ⬜ |

---

## Upcoming

### Phase 3b: Backend (Deferred)
- Supabase backend
- User authentication
- Cross-device sync

### Phase 4: Recall & Proactive
- "What was that thing about X?" recall
- Stale task detection (drift)
- Proactive nudges (configurable)
- Conflict detection

### Phase 5: Polish & Expand
- Mobile optimization
- Onboarding flow
- Settings / preferences
- Export / backup

---

## Long-term / Not Scheduled

| Feature | Notes |
|---------|-------|
| Calendar integration | External API required |
| Voice input | Web Speech API |
| Email parsing | Extract tasks from email |
| Collaboration | Shared tasks, family accounts |
| Orbital Zen UI | Spatial visualization (concept exists) |
| AI importance/energy inference | Learn from patterns |

---

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12 | Single AI persona | Simpler than dual personas |
| 2025-12 | Admin ↔ Execution parallel | Matches real usage patterns |
| 2025-12 | List view for MVP | Orbital Zen deferred |
| 2026-01 | localStorage for now | Validate UX before backend |
| 2026-01 | PWA → Capacitor path | Code reuse, quick iteration |

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
