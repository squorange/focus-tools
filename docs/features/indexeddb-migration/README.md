# IndexedDB Migration

> **Status:** 📋 Planned
> **Last Updated:** January 2026
> **Purpose:** Migrate from localStorage to IndexedDB for better performance, capacity, and PWA support

---

## Overview

Task Co-Pilot currently uses localStorage for all persistence. While this works for small datasets, it has limitations that become problematic as the app grows:

- **5-10MB limit** — Task history, events, and sessions accumulate
- **Synchronous API** — Blocks main thread during read/write operations
- **Limited service worker access** — PWA/offline capabilities restricted
- **String-only storage** — Requires JSON.stringify/parse for all operations

IndexedDB solves these issues and provides the foundation for future features (voice memos, file attachments, offline-first sync).

---

## Document Guide

| Document | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Requirements, behavior rules, edge cases |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Phased plan with progress tracking |
| [DATA_MODEL.md](./DATA_MODEL.md) | IndexedDB schema, object stores, indexes |

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Object Stores** | IndexedDB tables — one per data type (tasks, events, sessions, etc.) |
| **Indexes** | Enable efficient querying (by status, date, projectId) |
| **Transactions** | ACID guarantees for data integrity |
| **Migration** | One-time localStorage → IndexedDB data transfer |
| **Versioning** | IndexedDB version bumps trigger schema migrations |

---

## Why IndexedDB Over Alternatives

| Option | Verdict | Reason |
|--------|---------|--------|
| **IndexedDB** | ✅ Selected | Async, large capacity, service worker access, indexes |
| localStorage | ❌ Current | Sync, 5-10MB limit, no SW access |
| Supabase only | ❌ Not yet | Requires internet; add later as sync layer |
| SQLite (via WASM) | ⏸️ Future | Overkill for current needs; consider for complex queries |

---

## Implementation Summary

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Setup + parallel writes | ⬜ |
| 2 | Read migration + switch | ⬜ |
| 3 | Cleanup + optimization | ⬜ |
| 4 | Testing + edge cases | ⬜ |

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for detailed breakdown.

---

## File Changes Summary

### New Files
- `lib/indexeddb.ts` — IndexedDB wrapper with typed API
- `lib/storage-idb.ts` — Storage functions using IndexedDB

### Modified Files
- `lib/storage.ts` — Add migration logic, switch to async
- `app/page.tsx` — Handle async state loading
- `lib/notifications.ts` — Use IndexedDB for scheduled notifications

---

## Dependencies

- **idb** library (lightweight IndexedDB wrapper) — [github.com/jakearchibald/idb](https://github.com/jakearchibald/idb)

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [ROADMAP.md](../../ROADMAP.md) | Infrastructure evolution plan |
| [features/notifications/](../notifications/) | Uses scheduled data in localStorage |
| [PRINCIPLES.md](../../PRINCIPLES.md) | Coding conventions |
