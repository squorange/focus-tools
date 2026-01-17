# Focus Tools — Roadmap

> **Status:** Living document
> **Last Updated:** January 14, 2026
> **Purpose:** Sequence work for maximum learning and progress

---

## Current State Summary

| Component | Status | Location |
|-----------|--------|----------|
| Product Vision & Framework | ✅ Defined | `docs/focus-tools-product-doc.md` |
| Planning Loop POC (Task Co-Pilot) | ✅ Complete | `prototypes/task-copilot/` |
| Execution Loop (Body Double) | ✅ Complete | `prototypes/task-copilot/` (Focus Mode) |
| AI MiniBar Integration | ✅ Complete | Four-surface model (MiniBar/Palette/Drawer/StagingArea) |
| PWA & Mobile | ✅ Complete | Installable, reminders, dark mode |
| Orbital Zen UI Prototype | ⏸️ Deferred | `prototypes/orbital-zen/` |
| Backend / Persistence | ⏸️ Deferred | Validate UX first |

### What's Been Validated

| Hypothesis | Status | Evidence |
|------------|--------|----------|
| AI can structure messy intent into tasks | ✅ Validated | Task Co-Pilot works reliably |
| Multi-turn refinement feels natural | ✅ Validated | Hybrid transfer model works |
| Body double check-ins help execution | ✅ Validated | Focus Mode with StuckMenu, step-by-step flow |
| AI recommendations add value | ✅ Validated | "What next?" quick action, contextual prompts |
| Spatial/orbital UI is intuitive | ⏸️ Deferred | List-based UI chosen for MVP |

---

## Roadmap Phases

### Phase 0: Planning Loop POC ✅ Complete
**Outcome:** Validated AI-assisted task breakdown

- [x] AI structures rough intent into steps
- [x] Multi-turn conversational refinement
- [x] Hybrid transfer model (auto-populate vs. staging)
- [x] Manual task CRUD (add, edit, delete, reorder)
- [x] localStorage persistence

**Learnings:** Prompt design works, Claude reliably produces structured JSON, two-module UI (list + drawer) is clear.

---

### Phase 1: Execution Loop POC ✅ Complete
**Outcome:** Validated body double concept for ADHD execution support

**Core Question:** Does AI-powered accountability help users start and complete tasks? **Answer: Yes**

#### 1a: Define Body Double Behavior
- [x] Clarify what "body double" means in this context
- [x] Define check-in patterns (frequency, tone, content)
- [x] Define "focus session" structure (start → work → complete)
- [x] Identify minimal UI needed to test

#### 1b: Build Execution POC
- [x] Focus mode UI (single task centered)
- [x] Session timer (with pause/resume)
- [x] AI available throughout focus session
- [x] "I'm stuck" → StuckMenu with 4 resolution paths
- [x] Celebration on completion

#### 1c: Test & Learn
- [x] Check-in feels supportive via on-demand AI (not nagging)
- [x] Proactivity level: user-initiated works well
- [x] Completion acknowledgment provides motivation

**Decision:** Extended Task Co-Pilot (not standalone)

---

### Phase 2: Unified Prototype ✅ Complete
**Outcome:** Single prototype combining Planning + Execution loops with multi-task support

- [x] Merge Task Co-Pilot + Execution features
- [x] **Multi-task support** (manage multiple tasks)
- [x] Task list overview (TasksView with Inbox + Pool)
- [x] Transition UX: Pool → Focus Queue → Focus Mode
- [x] Basic task lifecycle (inbox → pool → complete/archived)
- [x] Decision: List view as primary (Orbital deferred)

**Decision:** Model E workflow (Inbox → Pool → Focus Queue) chosen over Orbital Zen for MVP.

---

### Phase 3: Foundational App + Mobile
**Outcome:** Usable daily driver on iPhone with real persistence

#### Phase 3a: PWA for Personal Validation ✅ Complete
- [x] Add PWA manifest + service worker
- [x] Mobile viewport optimization
- [x] Touch-friendly UI adjustments
- [x] iOS PWA dark mode theming (seamless header/status bar)
- [x] Task reminders with PWA notifications
- [x] Deep linking via `?task=` URL param
- [x] Test on iPhone (ongoing)

#### Phase 3b: Backend ⏸️ Deferred
- [ ] Supabase backend (tasks, projects, user data)
- [ ] User authentication
- [ ] Sync across sessions / devices
- [ ] Basic prioritization (high/medium/low or orbital distance)

**Decision:** Backend deferred until UX fully validated. localStorage sufficient for personal use.

---

### Phase 4: Recall & Proactive Features
**Outcome:** AI surfaces forgotten/stale tasks

- [ ] "What was that thing about X?" recall
- [ ] Stale task detection (drift)
- [ ] Proactive nudges (configurable level)
- [ ] Conflict detection ("Friday has 5 deadlines")

**Prerequisite:** Needs persistent multi-task data from Phase 3

---

### Phase 5: Polish & Expand
**Outcome:** Production-ready tool

- [ ] Mobile optimization
- [ ] Refined visual design (Orbital Zen styling)
- [ ] Onboarding flow
- [ ] Settings / preferences
- [ ] Export / backup

---

### Future Scope (Not Scheduled)

| Feature | Notes |
|---------|-------|
| Calendar integration | Requires external API |
| Voice input | Capture via speech |
| Email parsing | Extract tasks from email |
| Collaboration | Shared tasks, family accounts |
| Habit tracking | Recurring tasks |
| Energy-aware suggestions | "What's easy right now?" |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-22 | Single AI persona with context-aware behavior | Simpler mental model than dual personas |
| 2025-12-22 | Admin ↔ Execution are parallel, not sequential | Matches real usage patterns |
| 2025-12-22 | Hybrid transfer model (auto vs. staging) | Respects user content while reducing friction |
| 2025-12-22 | Phase 1 = Execution Loop | Body double is differentiator, needs validation |

---

## Immediate Next Steps (Current Sprint)

**Status:** Core app complete. Focus on refinement and gap closure.

| Priority | Task | Status | Purpose |
|----------|------|--------|---------|
| P1 | Proactive stale task nudge | ⬜ | Surface health status proactively (not just on-demand) |
| P1 | Recurring tasks | ⬜ | Critical for routines (AuDHD), daily habits (ADHD) |
| P2 | Reflection/journey view | ⬜ | "What did I accomplish this week?" |
| P2 | Voice capture | ⬜ | Web Speech API to reduce capture friction |
| P3 | Context switch bookmarking | ⬜ | AI summarizes state on pause |
| P3 | Nudge system logic | ⬜ | Implement nudge types already defined in schema |

**Reference:** See `prototypes/task-copilot/CLAUDE.md` for current sprint details.

---

## Open Questions

| Question | Impacts | Status |
|----------|---------|--------|
| What makes body double effective vs. annoying? | Phase 1 design | To explore |
| Should Orbital Zen be primary UI or alternate view? | Phase 2 integration | Deferred |
| How "smart" should proactive features be? | Phase 4 scope | Deferred |
| Mobile-first or desktop-first? | Phase 3+ design | Desktop-first for now |

---

## Integration Strategy: Prototypes → Unified App

```
Current:
┌─────────────────┐     ┌─────────────────┐
│  Task Co-Pilot  │     │  Orbital Zen    │
│  (Planning)     │     │  (Spatial UI)   │
└─────────────────┘     └─────────────────┘

Phase 2 Options:

Option A: Task Co-Pilot as base, add Orbital view
┌─────────────────────────────────────────┐
│  Task Co-Pilot + Execution              │
│  ├── List View (current)                │
│  └── Orbital View (imported)            │
└─────────────────────────────────────────┘

Option B: Orbital Zen as base, add AI features  
┌─────────────────────────────────────────┐
│  Orbital Zen + AI Integration           │
│  ├── Orbital View (primary)             │
│  ├── AI Drawer (from Task Co-Pilot)     │
│  └── List View (fallback)               │
└─────────────────────────────────────────┘

Option C: New unified build
┌─────────────────────────────────────────┐
│  Focus Tools App                        │
│  ├── Cherry-pick from both prototypes   │
│  └── Fresh architecture                 │
└─────────────────────────────────────────┘
```

**Decision:** Defer until Phase 1 complete. Learnings will inform best path.

---

## Path to Mobile (iPhone)

### Approaches Considered

| Approach | Code Reuse | Native Feel | App Store | Effort | Best For |
|----------|------------|-------------|-----------|--------|----------|
| **PWA** | 100% | 70-80% | ❌ | Days | Validation, personal use |
| **Capacitor** | 90-95% | 80-85% | ✅ | Days-Weeks | Quick App Store path |
| **React Native** | 40-60% | 90-95% | ✅ | Weeks-Months | Serious native product |
| **Native Swift** | 10-20% | 100% | ✅ | Months | iOS-only, premium UX |

### Selected Path: PWA → Capacitor → (React Native if needed)

**Rationale:**
1. PWA validates tool works before investing in native
2. Capacitor gets to App Store with minimal rewrite
3. React Native only if native UX becomes critical

### Mobile-Specific Phases

#### Phase 3a: PWA for Personal Validation
**Outcome:** Usable on iPhone daily

- [ ] Add PWA manifest + service worker
- [ ] Mobile viewport optimization
- [ ] Touch-friendly UI (tap targets, spacing)
- [ ] Test on personal iPhone for 2+ weeks

**Success criteria:** Actually using it daily; identifies friction points

#### Phase 3b: Capacitor Wrapper
**Outcome:** TestFlight distribution, push notifications

- [ ] Capacitor integration
- [ ] iOS build pipeline (Xcode)
- [ ] Push notification support
- [ ] TestFlight beta distribution

**Success criteria:** 10-20 test users via TestFlight

#### Phase 5b: App Store Submission
**Outcome:** Public release

- [ ] Visual design polish
- [ ] App Store assets (screenshots, description)
- [ ] Privacy policy, terms of service
- [ ] Subscription integration (RevenueCat or similar)
- [ ] Handle App Store review

**Success criteria:** Approved and live on App Store

---

## Monetization Strategy (Future)

### Model: Freemium + Subscription

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 10 AI breakdowns/month, local storage only |
| **Pro** | $5-10/mo | Unlimited AI, cloud sync, focus stats |
| **Team** | $15+/mo | Shared tasks, collaboration (future) |

### API Cost Considerations

- Claude API: ~$3-15 per 1M tokens
- Typical user: 10-50K tokens/month
- Cost per active user: ~$0.03-0.75/month
- Subscription covers cost with healthy margin

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01-14 | Updated phases 1-3a as complete; refreshed next steps |
| 2025-12-22 | Initial roadmap created |
| 2025-12-22 | Added mobile path, monetization strategy |
