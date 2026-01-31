# Nudge System

> Intelligent priority calculation and notification orchestration.

**Status:** ✅ Complete (MVP)
**Added:** January 2026
**Schema Version:** v15

---

## Overview

The Nudge System helps users know what to work on and when to start. It combines user-set importance with system-calculated priority, time-aware nudges, and energy-aware filtering.

**Core Principle:** Importance is the user's judgment. Priority is the system's recommendation.

## Quick Links

- [Specification](./SPEC.md) — Behavior rules and calculations
- [Data Model](./DATA_MODEL.md) — Schema additions
- [Implementation](./IMPLEMENTATION.md) — Phase breakdown
- [Prompts](./PROMPTS.md) — Claude Code implementation prompts

## Key Concepts

- **Importance:** User-set stakes (Must Do / Should Do / Could Do / Would Like To)
- **Priority Score:** Calculated from 7 components (0-100+)
- **Priority Tier:** Critical (60+) / High (40-59) / Medium (20-39) / Low (0-19)
- **Energy Type:** How a task feels (Energizing / Neutral / Draining)
- **Lead Time:** Calendar runway needed beyond active work time
- **Runway Nudge:** Alert 1 day before effective deadline (deadline - lead time)
- **Orchestrator:** Deduplication + priority ordering + quiet hours

## Components

| Component | Purpose |
|-----------|---------|
| Priority Queue | Tab in NotificationsHub showing tasks by tier |
| Importance Picker | Set task importance level |
| Energy Type Picker | Set how task feels |
| Lead Time Picker | Set calendar runway needed |
| Energy Selector | User sets current energy level |
| Priority Breakdown Drawer | Shows score components |

## Related Features

- [Notifications](../notifications/) — Base notification system
- [Start Nudge](../start-nudge/) — Execution reminder calculation
- [Recurring Tasks](../recurring-tasks/) — Streak risk scoring

## Archive

Progress tracking docs moved to archive after completion:
- `docs/archive/2026-01-nudge-system/PROGRESS.md`
- `docs/archive/2026-01-nudge-system/PHASE_0_PROGRESS.md`
