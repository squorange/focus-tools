# Feature Catalog

> Index of all implemented and planned features with documentation links.

**Last Updated:** February 2026

---

## Feature Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Complete | Feature fully implemented and stable |
| 🔄 In Progress | Actively being developed |
| 📋 Planned | Documented but not started |
| ⏸️ Deferred | Documented but not scheduled |

---

## Core Features

| Feature | Status | Schema | Documentation |
|---------|--------|--------|---------------|
| **Task Management** | ✅ | v1+ | Built-in (core) |
| **Focus Queue** | ✅ | v1+ | Built-in (core) |
| **Focus Mode** | ✅ | v1+ | Built-in (core) |
| **AI Task Breakdown** | ✅ | v1+ | Built-in (core) |
| **Projects** | ✅ | v1+ | Built-in (core) |

---

## Implemented Features

| Feature | Status | Schema | Documentation | Added |
|---------|--------|--------|---------------|-------|
| [**AI Assistant**](./ai-assistant/) | ✅ | — | [SPEC](./ai-assistant/SPEC.md) | 2026-01 |
| [**Notifications**](./notifications/) | ✅ | v3+ | [SPEC](./notifications/SPEC.md) | 2025-12 |
| [**Start Nudge**](./start-nudge/) | ✅ | v5+ | [SPEC](./start-nudge/SPEC.md) | 2026-01 |
| [**Nudge System**](./nudge-system/) | ✅ | v15 | [SPEC](./nudge-system/SPEC.md) | 2026-01 |
| [**Recurring Tasks**](./recurring-tasks/) | 🔄 | v9+ | [SPEC](./recurring-tasks/SPEC.md) | 2026-01 |

---

## Feature Details

### AI Assistant (Minibar/Palette/Drawer)
**Status:** ✅ Complete
**Purpose:** Progressive disclosure AI interface with context-aware assistance

Key capabilities:
- Three-tier interface: MiniBar (collapsed) → Palette (expanded) → Drawer (full chat)
- Context-aware quick actions based on current view
- Step/task targeting for focused assistance
- Alert integration (pokes, runway, reminders)
- Responsive design with mobile gestures

### Notifications
**Status:** ✅ Complete
**Purpose:** Reminders and alerts for tasks

Key capabilities:
- User-set reminders (specific time)
- Start poke (calculated start time)
- In-app notification center
- PWA push notifications

### Start Nudge
**Status:** ✅ Complete
**Purpose:** Calculated reminders based on deadline and duration

Key capabilities:
- `anchor - duration - buffer` calculation
- Default buffer (15%) with user override
- Enabled/disabled per task
- Visual indicator in task detail

### Nudge System
**Status:** ✅ Complete (MVP)
**Purpose:** Intelligent priority calculation and notification orchestration

Key capabilities:
- Priority score (7 components: importance, time pressure, source, staleness, streak risk, defer count, energy match)
- Priority Queue in NotificationsHub
- Importance, energy type, lead time fields
- Runway nudge (planning reminder)
- Orchestrator with deduplication + quiet hours
- Energy-aware filtering

### Recurring Tasks
**Status:** 🔄 In Progress (Phase 1-2 complete)
**Purpose:** Support for routines and habits

Completed:
- Data model (RecurringTask, RecurringPattern)
- Gallery UI (RoutineCard, RoutinesGallery)
- Complete/skip handlers

Pending:
- Instance creation
- Focus Queue integration
- Streak calculation + display

---

## Infrastructure Evolution

| Phase | Feature | Status | Documentation |
|-------|---------|--------|---------------|
| 1 | [**IndexedDB Migration**](./indexeddb-migration/) | ✅ Complete | [SPEC](./indexeddb-migration/SPEC.md) |
| 2 | [**Test Harnesses**](./test-harnesses/) | ✅ Complete | [README](./test-harnesses/README.md) |
| 3 | [**AI Guardrails**](./ai-guardrails/) | ✅ Complete | [SPEC](./ai-guardrails/SPEC.md) |
| 4 | [**Design System**](../../packages/design-system/) | ✅ Complete | [README](../../packages/design-system/README.md) |
| 4a | [**Design System Integration**](./design-system-integration/) | ✅ Complete | [SPEC](./design-system-integration/SPEC.md) |
| 4b | [**Theme System Migration**](./theme%20system/) | ✅ Complete | [Tracker](./theme%20system/THEME_SYSTEM_MIGRATION_TRACKER.md) |
| 5 | Auth & User Accounts | 📋 Planned | Not documented |
| 6 | Capacitor (Native) | 📋 Planned | Not documented |
| 7 | [**Theming Infrastructure**](./theme%20system/) | 🔄 In Progress | [Index](./theme%20system/THEME_SYSTEM_INDEX.md) |
| 8 | Orbital Zen Theme | 📋 Planned | [Concept](../concepts/ORBITAL_ZEN.md) |
| 9 | Supabase Sync | ⏸️ Deferred | Not documented |

---

## Planned Features

| Feature | Priority | Documentation |
|---------|----------|---------------|
| Voice Capture | P2 | After Capacitor |
| Reflection View | P3 | Not documented |
| Calendar Integration | Future | Not documented |
| Email Parsing | Future | Not documented |

---

## Feature Documentation Standard

Each feature folder should contain:

```
feature-name/
├── README.md           # Overview, status, quick links
├── SPEC.md             # Requirements, behavior rules
├── DATA_MODEL.md       # Schema additions (if any)
├── IMPLEMENTATION.md   # Architecture, key files
└── PROMPTS.md          # Claude Code prompts (optional)
```

See [PRINCIPLES.md](../PRINCIPLES.md) for documentation conventions.

---

## Schema Version History

| Version | Features Added |
|---------|----------------|
| v1-v8 | Core task management, notifications, start nudge |
| v9 | Recurring tasks data model |
| v13-v14 | Nudge system fields (importance, energy, lead time) |
| v15 | NudgeTracker for orchestrator |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [ROADMAP.md](../ROADMAP.md) | Development timeline |
| [PRINCIPLES.md](../PRINCIPLES.md) | Guidelines |
| [guides/](../guides/) | Testing and workflow guides |
| [CLAUDE.md](../../prototypes/task-copilot/CLAUDE.md) | Current sprint |
