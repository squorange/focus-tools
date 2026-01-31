# Feature Catalog

> Index of all implemented and planned features with documentation links.

**Last Updated:** January 2026

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
| [**Notifications**](./notifications/) | ✅ | v3+ | [SPEC](./notifications/SPEC.md) | 2025-12 |
| [**Start Nudge**](./start-nudge/) | ✅ | v5+ | [SPEC](./start-nudge/SPEC.md) | 2026-01 |
| [**Nudge System**](./nudge-system/) | ✅ | v15 | [SPEC](./nudge-system/SPEC.md) | 2026-01 |
| [**Recurring Tasks**](./recurring-tasks/) | 🔄 | v9+ | [SPEC](./recurring-tasks/SPEC.md) | 2026-01 |

---

## Feature Details

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

## Planned Features

| Feature | Priority | Documentation |
|---------|----------|---------------|
| Voice Capture | P2 | Not documented |
| Reflection View | P2 | Not documented |
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
| [CLAUDE.md](../../prototypes/task-copilot/CLAUDE.md) | Current sprint |
