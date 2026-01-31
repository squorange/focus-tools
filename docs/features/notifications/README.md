# Notifications

> Reminders and alerts system for task management.

**Status:** ✅ Complete
**Added:** December 2025
**Schema Version:** v3+

---

## Overview

The notifications system provides time-based reminders and alerts to help users stay on track with their tasks. It supports both user-set reminders and calculated "start poke" notifications.

## Quick Links

- [Specification](./SPEC.md) — Full system design and behavior rules

## Key Concepts

- **Reminder:** User-set notification at a specific date/time
- **Start Poke:** Calculated alert based on deadline and estimated duration
- **In-App Notifications:** NotificationsHub with badge counts
- **PWA Push:** Optional push notifications for installed PWA

## Related Features

- [Start Nudge](../start-nudge/) — Calculated start time notifications
- [Nudge System](../nudge-system/) — Priority-based notification orchestration
