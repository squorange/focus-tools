# Task Co-Pilot: Claude Code Context

## Project Overview

Task Co-Pilot is an AI-powered task breakdown assistant, part of "Focus Tools" — an ADHD-friendly task management tool.

**Location:** `~/Projects/focus-tools/prototypes/task-copilot`
**Stack:** Next.js 14, React 18, Tailwind CSS, Anthropic Claude API
**Production URL:** https://task-copilot.vercel.app

### Deployment

**IMPORTANT:** Always deploy from `prototypes/task-copilot`, NOT the repo root.

```bash
cd ~/Projects/focus-tools/prototypes/task-copilot && npx vercel --prod --yes
```

The repo root has a separate `.vercel` project config which is NOT the correct target.

---

## Current Sprint

**Last Updated:** February 9, 2026

| Priority | Item | Status | Notes |
|----------|------|--------|-------|
| P0 | Inline AI Actions (Steps) | ✅ Complete | Sparkle → Palette with target banner |
| P0 | Nav/App Restructure | ✅ Complete | Push sidebar, hamburger + plus header |
| P0 | Nudge System MVP | ✅ Complete | Priority calculation, orchestrator, energy system |
| P0 | IndexedDB Migration | ✅ Complete | Infra Phase 1 |
| P0 | Test Harnesses | ✅ Complete | Infra Phase 2: Vitest, 98 tests |
| P0 | AI Guardrails | ✅ Complete | Infra Phase 3: Rate limiting, analytics, safety integrated |
| P1 | Design System Integration | ✅ Complete | All phases complete (1-6e) |
| P1 | ActionableCard Unification | ✅ Complete | All 7 components migrated, 78% code reduction |
| P1 | Theme System Migration (Phase 1) | ✅ Complete | 10 sessions, ~260 tokens, zero hardcoded colors in prototype |
| P1 | Theme Infrastructure (Phase 2) | 🔄 In Progress | ColorTheme type, ThemeProvider, presets |
| P1 | Hook Extraction (Multi-Shell Prep) | 🔄 In Progress | Sessions 1-2 done: 6 hooks extracted, page.tsx ~4,550 lines |
| P1 | Proactive stale task nudge | ⬜ Not Started | Health computed but not surfaced |
| P1 | Recurring tasks | 🔄 In Progress | Phase 1-2 complete, Phase 3-6 pending |
| P2 | Inline AI Actions (Tasks) | ⬜ Not Started | QueueItem, TaskRow |
| P2 | Reflection/journey view | ⬜ Not Started | "What did I accomplish this week?" |
| P2 | Voice capture | ⬜ Not Started | Web Speech API |
| P3 | Context switch bookmarking | ⬜ Not Started | AI summarizes state on pause |

**Deferred:** Calendar integration, Supabase backend, collaboration features

---

## Recent Completions

| Version | Changes |
|---------|---------|
| v46 | Hook Extraction Session 2: useFocusQueue, useTaskCrud, useFocusSession extracted (~1,389 lines from page.tsx) |
| v45 | Hook Extraction Session 1: useToasts, useProjects, useNavigation extracted from page.tsx (~315 lines removed) |
| v44 | Theme System Phase 1 complete: 10 sessions, ~260 tokens, all components migrated to semantic tokens |
| v43 | Design System Integration complete: All phases (1-6e) done, 78% code reduction |
| v42 | ActionableCard Phase 6d: NotificationCard, RoutineRowCard, RoutineGalleryCard migrated |
| v41 | ActionableCard Phase 6c: QueueTaskCard, DoneTaskCard migrated (636 lines deleted) |
| v40 | ActionableCard Phase 6b: PoolTaskCard, TriageTaskCard migrated (673 lines deleted) |
| v39 | ActionableCard Phase 6a: Component + tokens extracted to design-system, Storybook stories |
| v38 | ActionableCard Phase 6 spec: Unified card system for tasks/notifications/routines, deleted dead InboxItem.tsx |
| v37 | Design System Integration complete: Tier 1-2 token migration, new subtle-hover token, hover text patterns |
| v36 | Design System Integration Phase 1: Added package dependency, imported CSS tokens, bridge variables for gradual migration |
| v35 | Design System Integration: Documentation (SPEC, COMPONENT_CATALOG), token system aligned with clinic-planner |
| v34 | AI Guardrails Implementation: Rate limiting, analytics, safety, graceful degradation, UI components, 35 tests |
| v33 | AI Guardrails: SPEC.md complete (Phase 3a: rate limiting, analytics, safety, transparency) |
| v32 | Test Harnesses: Vitest setup, 98 tests (storage, priority, queue-reorder) |
| v31 | IndexedDB Migration complete: Bug fix for migration flag reset on save |
| v30 | Waiting On refinements: Follow-up date picker, tasks stay in Staging with pill, BottomSheet modals |
| v29 | BottomSheet iOS fix: Portal rendering, keyboard detection via visualViewport API |
| v28 | Nudge System MVP (Phases 0-7): Priority calculation (64 tests), Priority Queue, orchestrator |
| v27 | Recurring Tasks Phase 1-2: Data model, recurring-utils, RoutineCard + RoutinesGallery |
| v26 | Nav Restructure: Push sidebar, hamburger + plus header, task creation popover |
| v25 | Object-scoped AI: Step-targeted suggestions create substeps, restructuring guidance |

---

## Workflow Model

```
INBOX → POOL → FOCUS QUEUE → COMPLETED
                    ↓
              PARKING LOT
```

| View | Purpose | Task Status |
|------|---------|-------------|
| **Inbox** | Quick capture, triage | `inbox` |
| **Pool** | Browse available tasks | `pool` |
| **Focus Queue** | Today/week commitments | `pool` (in queue) |
| **Completed** | Finished tasks | `complete` |
| **Parking Lot** | Archived tasks | `archived` |

---

## File Structure

```
task-copilot/
├── app/
│   ├── page.tsx              # Main app, state, routing, handlers
│   ├── layout.tsx            # Root layout
│   └── api/structure/route.ts # Claude API endpoint
├── hooks/
│   ├── useToasts.ts          # Toast state + showToast/dismissToast
│   ├── useProjects.ts        # Project CRUD + modal state
│   ├── useNavigation.ts      # View switching, sidebar, drawers, search
│   ├── useFocusQueue.ts      # Queue add/remove/reorder + routine handlers
│   ├── useTaskCrud.ts        # Task create/update/delete + workflow
│   ├── useFocusSession.ts    # Focus mode start/pause/resume/exit
│   ├── useStepActions.ts     # Step/substep operations
│   ├── useAIAssistant.ts     # AI minibar/palette/drawer state machine
│   ├── useContextualPrompts.ts # Auto-prompts for minibar
│   ├── useTheme.ts           # Theme CSS class application
│   └── useKeyboardVisible.ts # Mobile keyboard detection
├── components/
│   ├── layout/               # Header, Sidebar, TabCluster
│   ├── inbox/                # InboxView (uses TriageRow)
│   ├── queue/                # QueueView, QueueItem
│   ├── tasks/                # TasksView
│   ├── task-detail/          # TaskDetail
│   ├── focus-mode/           # FocusModeView
│   ├── pool/                 # PoolView, TaskRow
│   ├── projects/             # ProjectsView
│   ├── shared/               # Reusable components
│   ├── AIDrawer.tsx          # Side panel AI chat
│   └── StagingArea.tsx       # AI suggestions panel
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── storage.ts            # Storage API (async load/save)
│   ├── storage-idb.ts        # IndexedDB operations
│   ├── indexeddb.ts          # IndexedDB schema + setup
│   ├── prompts.ts            # AI system prompts
│   ├── ai-tools.ts           # AI tool definitions
│   ├── ai-actions.ts         # AI action labels/icons/queries
│   ├── ai-service.ts         # AI request wrapper with guardrails
│   ├── ai-safety.ts          # Output sanitization, error handling
│   ├── rate-limit.ts         # Client-side rate limiting
│   ├── analytics.ts          # Privacy-preserving AI analytics
│   ├── queue-reorder.ts      # Visual-first drag/drop
│   └── utils.ts              # Utility functions
└── public/
    ├── manifest.json         # PWA manifest
    └── sw.js                 # Service worker
```

---

## Key Patterns

### Icon/Emoji Convention
- **Icons (Lucide):** All UI elements, pickers, buttons
- **Emojis:** Only for AI action labels and start poke feature

### Core Principles
1. Focus Queue is home
2. One queue entry per task (no duplicates)
3. Step selection: entire task OR specific steps
4. Waiting On is non-blocking
5. AI MiniBar always visible (context-aware)

### Navigation (2-Tab Model)

| Tab | View | Purpose |
|-----|------|---------|
| **Focus** | QueueView | Home - Today/Week/Upcoming |
| **Tasks** | TasksView | Inbox + Pool |
| 🔍 | SearchView | Search all tasks |

### BottomSheet iOS Handling
```tsx
// For keyboard-aware spacing:
style={{ paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom))' }}
```

### Storage Architecture (IndexedDB)

Primary storage is **IndexedDB** (`focus-tools` database). localStorage is only used as fallback for unsupported browsers.

| Store | Contents | Indexes |
|-------|----------|---------|
| `appState` | Singleton with settings, queue, UI state | — |
| `tasks` | Individual task records | status, project, recurring, updated, deadline |
| `events` | Event log entries | timestamp, taskId, type |
| `sessions` | Focus session records | taskId, startTime |
| `nudges` | Active nudges | targetId, type, urgency |
| `notifications` | Scheduled notifications | taskId, scheduledAt, type |

**Key functions:**
- `loadStateAsync()` — Primary load (handles migration from localStorage)
- `saveState()` — Writes to IndexedDB
- `getTaskCached()` — LRU-cached task reads
- `pruneAllOldDataFromIDB()` — Clean up old events/sessions

See [docs/features/indexeddb-migration/](../../docs/features/indexeddb-migration/) for details.

---

## Handler Reference (page.tsx)

| Category | Handlers | Location |
|----------|----------|----------|
| **Navigation** | `viewChange`, `openTask`, `backToList`, `goToTasks`, `goToInbox` | `hooks/useNavigation.ts` |
| **Drawers** | `openDrawer`, `closeDrawer`, `toggleCompletedDrawer`, `openFocusSelection` | `hooks/useNavigation.ts` |
| **Search** | `jumpToFilter`, `backToMenu`, `clearPendingFilter` | `hooks/useNavigation.ts` |
| **Toasts** | `showToast`, `dismissToast` | `hooks/useToasts.ts` |
| **Projects** | `createProject`, `updateProject`, `deleteProject`, `openProjectModal` | `hooks/useProjects.ts` |
| **Task CRUD** | `handleCreateTask`, `handleUpdateTask`, `handleDeleteTask` | `hooks/useTaskCrud.ts` |
| **Workflow** | `handleSendToPool`, `handleDefer`, `handlePark`, `handleUnarchive` | `hooks/useTaskCrud.ts` |
| **Queue** | `handleAddToQueue`, `handleRemoveFromQueue`, `handleReorderQueue` | `hooks/useFocusQueue.ts` |
| **Routines** | `handleCompleteRoutine`, `handleSkipRoutine`, `handleResetFromTemplate` | `hooks/useFocusQueue.ts` |
| **Steps** | `handleStepComplete`, `handleAddStep`, `handleDeleteStep`, `handleMoveStep*` | page.tsx |
| **Focus** | `handleStartFocus`, `handlePauseFocus`, `handleResumeFocus`, `handleExitFocus` | `hooks/useFocusSession.ts` |
| **AI** | `handleSendMessage`, `handleAutoBreakdown`, `handleAcceptSuggestion` | page.tsx |

---

## Reference Documentation

| Document | Contents |
|----------|----------|
| [docs/DATA_MODEL.md](../../docs/DATA_MODEL.md) | TypeScript interfaces, helper functions |
| [docs/PRINCIPLES.md](../../docs/PRINCIPLES.md) | Design guidelines, conventions |
| [docs/VISION.md](../../docs/VISION.md) | Product goals, target users |
| [docs/ROADMAP.md](../../docs/ROADMAP.md) | Progress, planned features |
| [docs/features/INDEX.md](../../docs/features/INDEX.md) | Feature catalog |
| [docs/features/nudge-system/](../../docs/features/nudge-system/) | Priority calculation, orchestrator |
| [docs/features/recurring-tasks/](../../docs/features/recurring-tasks/) | Routines system |

---

## Session Workflow

**Full lifecycle guide:** [docs/guides/SESSION_LIFECYCLE.md](../../docs/guides/SESSION_LIFECYCLE.md)

**Quick reference — the 7 steps:**

1. **Pre-Session** — Run tests, check sprint table, read feature docs + "Next Session" note
2. **Planning** — Enter plan mode for non-trivial work, get user approval
3. **Implementation** — Execute plan, build check after each batch, fix issues immediately
4. **Post-Implementation** — Build, tests, audit (grep to verify), no deferred gaps
5. **Documentation Updates** — Sprint table, Recent Completions, feature docs, ROADMAP, INDEX
6. **Wrap-up & Handoff** — Recap, align on next steps, write "Next Session" note, commit
7. **Clear Context** — Start next session fresh; docs + handoff note are the bridge

**Key test commands:**

| Scope | Command |
|-------|---------|
| Full suite | `npm run test:run` |
| Storage | `npm test -- lib/storage.test.ts` |
| Priority | `npm test -- lib/priority.vitest.ts` |
| Queue reorder | `npm test -- lib/queue-reorder.vitest.ts` |

**When uncertain:** Prompt the user rather than assume.

---

## Revision History

| Date | Version | Summary |
|------|---------|---------|
| 2026-02-09 | v46 | Hook Extraction Session 2: useFocusQueue, useTaskCrud, useFocusSession (~1,389 lines from page.tsx) |
| 2026-02-09 | v45 | Hook Extraction Session 1: useToasts, useProjects, useNavigation (~315 lines from page.tsx) |
| 2026-02-08 | v44 | Theme System Phase 1 complete: 10 sessions, ~260 tokens, all components migrated |
| 2026-02-07 | v43 | Design System Integration complete: All phases (1-6e) done, 78% code reduction |
| 2026-02-06 | v42 | ActionableCard Phase 6d: NotificationCard, RoutineRowCard, RoutineGalleryCard migrated |
| 2026-02-06 | v41 | ActionableCard Phase 6c: QueueTaskCard, DoneTaskCard migrated |
| 2026-02-06 | v40 | ActionableCard Phase 6b: PoolTaskCard, TriageTaskCard migrated |
| 2026-02-06 | v39 | ActionableCard Phase 6a: Component + tokens extracted to design-system |
| 2026-02-06 | v38 | ActionableCard Phase 6 spec complete, deleted dead InboxItem.tsx |
| 2026-02-05 | v37 | Design System Integration Phases 1-5 complete (token migration, cleanup) |
| 2026-02-05 | v36 | Design System Integration Phase 1: package dependency, CSS token import |
| 2026-02-04 | v35 | Design System Integration docs (SPEC, COMPONENT_CATALOG, token alignment) |
| 2026-02-01 | v34 | AI Guardrails Implementation (rate limit, analytics, safety, 35 tests) |
| 2026-02-01 | v33 | AI Guardrails SPEC complete |
For older history (v20-v32), see [docs/archive/REVISION_HISTORY.md](../../docs/archive/REVISION_HISTORY.md).
