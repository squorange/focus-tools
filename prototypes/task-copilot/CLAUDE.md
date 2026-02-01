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

**Last Updated:** January 31, 2026

| Priority | Item | Status | Notes |
|----------|------|--------|-------|
| P0 | Inline AI Actions (Steps) | ✅ Complete | Sparkle → Palette with target banner |
| P0 | Nav/App Restructure | ✅ Complete | Push sidebar, hamburger + plus header |
| P0 | Nudge System MVP | ✅ Complete | Priority calculation, orchestrator, energy system |
| P1 | Proactive stale task nudge | ⬜ Not Started | Health computed but not surfaced |
| P1 | Recurring tasks | 🔄 In Progress | Phase 1-2 complete, Phase 3-6 pending |
| P2 | Inline AI Actions (Tasks) | ⬜ Not Started | QueueItem, TaskRow, InboxItem |
| P2 | Reflection/journey view | ⬜ Not Started | "What did I accomplish this week?" |
| P2 | Voice capture | ⬜ Not Started | Web Speech API |
| P3 | Context switch bookmarking | ⬜ Not Started | AI summarizes state on pause |

**Deferred:** Calendar integration, Supabase backend, collaboration features

---

## Recent Completions

| Version | Changes |
|---------|---------|
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
├── components/
│   ├── layout/               # Header, Sidebar, TabCluster
│   ├── inbox/                # InboxView, InboxItem
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
│   ├── storage.ts            # localStorage + migration
│   ├── prompts.ts            # AI system prompts
│   ├── ai-tools.ts           # AI tool definitions
│   ├── ai-actions.ts         # AI action labels/icons/queries
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

---

## Handler Reference (page.tsx)

| Category | Handlers |
|----------|----------|
| **Navigation** | `handleViewChange`, `handleOpenTask`, `handleBackToList` |
| **Task CRUD** | `handleCreateTask`, `handleUpdateTask`, `handleDeleteTask` |
| **Workflow** | `handleSendToPool`, `handleDefer`, `handlePark` |
| **Queue** | `handleAddToQueue`, `handleRemoveFromQueue`, `handleStartFocus` |
| **Steps** | `handleStepComplete`, `handleAddStep`, `handleDeleteStep`, `handleMoveStep*` |
| **Focus** | `handleStartFocus`, `handlePauseFocus`, `handleResumeFocus`, `handleExitFocus` |
| **AI** | `handleSendMessage`, `handleAutoBreakdown`, `handleAcceptSuggestion` |
| **Projects** | `handleCreateProject`, `handleUpdateProject`, `handleDeleteProject` |

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

### Planning & Ideation

When discussing ideas, concepts, or future work (not immediate implementation):

| Discussion type | Where to capture |
|-----------------|------------------|
| Fleshing out an idea/concept | `docs/concepts/` or new feature folder |
| "I want to eventually..." | `docs/ROADMAP.md` (Planned/Long-term section) |
| Exploring approaches | `docs/concepts/` or feature's SPEC.md |
| Decision made for later | `docs/ROADMAP.md` or feature folder |

**At end of planning discussion, ask:**
- "Should I add this to ROADMAP.md as a planned item?"
- "Should I create a feature folder with initial SPEC.md?"
- "Should I capture this in docs/concepts/?"

**If user is unsure:** Default to capturing in `docs/concepts/FUTURE_CONSIDERATIONS.md` with a dated entry.

### Starting Active Work

1. **Check sprint table above** — Identify current priorities (P0 → P1 → P2)
2. **Review feature docs** — Read `docs/features/{feature}/SPEC.md` before implementing
3. **Check for existing patterns** — Consult `docs/PRINCIPLES.md` for conventions
4. **Confirm approach if unclear** — Ask user before starting if requirements are ambiguous

**If starting a new feature:**
- Check if `docs/features/{feature}/` exists
- If not, ask: "Should I create a feature folder with SPEC.md?"

### During Development

| Before doing... | Check... |
|-----------------|----------|
| Adding TypeScript types | `docs/DATA_MODEL.md` for existing patterns |
| Adding UI components | `docs/PRINCIPLES.md` for icon/styling conventions |
| Implementing feature logic | `docs/features/{feature}/SPEC.md` for requirements |
| Making architectural decisions | Ask user to confirm approach |

**When uncertain:** Prompt the user rather than assume. Examples:
- "This changes the data model — should I update DATA_MODEL.md now?"
- "This establishes a new pattern — should I add it to PRINCIPLES.md?"
- "The spec doesn't cover this case — how should it behave?"

### After Completing Work

**IMPORTANT: Update documentation as part of completing work, not as a separate step.**

#### Automatic Updates (Do These Immediately)

| When you... | Immediately update... |
|-------------|----------------------|
| Complete a sprint item | Mark ✅ in sprint table above, add to Recent Completions |
| Add/change TypeScript interfaces | `docs/DATA_MODEL.md` |
| Add/change a handler in page.tsx | Handler Reference table above |
| Establish a new pattern | `docs/PRINCIPLES.md` |
| Complete a feature phase | `docs/features/{feature}/IMPLEMENTATION.md`, `docs/ROADMAP.md` |
| Add new files/folders | File Structure section above |

### Proactive Checks (Before Ending Session)

1. **Sprint table current?** Update status of any items worked on
2. **Recent Completions** — Add entry if significant work completed (bump version)
3. **Feature docs** — If feature work done, ensure IMPLEMENTATION.md reflects reality
4. **This file under 250 lines?** If not, extract stable content to docs/

### What Belongs Where

| Content Type | Location | Example |
|--------------|----------|---------|
| Current priorities | Here (CLAUDE.md) | Sprint table |
| Recent work (last 2 weeks) | Here | Recent Completions |
| TypeScript interfaces | `docs/DATA_MODEL.md` | Task, Step, FocusQueueItem |
| Design decisions | `docs/PRINCIPLES.md` | Icon/emoji convention |
| Feature specs | `docs/features/{feature}/SPEC.md` | Priority calculation rules |
| How something was built | `docs/features/{feature}/IMPLEMENTATION.md` | Nudge orchestrator architecture |
| Old history | `docs/archive/` | Revision history older than 10 entries |

### Version Numbering

Increment version in Recent Completions when:
- Bug fix or refinement → same version (e.g., v29 → v29)
- New capability or significant change → bump version (e.g., v29 → v30)

### When to Prompt or Remind

| Situation | Action |
|-----------|--------|
| User shares idea/concept | Ask: "Capture in concepts/ or ROADMAP.md?" |
| User says "later" or "eventually" | Ask: "Add to ROADMAP.md as planned item?" |
| Planning discussion concludes | Ask: "Create feature folder with SPEC.md?" |
| Requirements unclear | Ask before implementing |
| Multiple valid approaches | Present options, ask user preference |
| Work affects data model | Confirm: "Update DATA_MODEL.md?" |
| New pattern established | Confirm: "Add to PRINCIPLES.md?" |
| Feature phase complete | Remind: "Update IMPLEMENTATION.md and ROADMAP.md?" |
| Session ending with changes | Remind: "Update Recent Completions?" |

See [docs/README.md](../../docs/README.md) for full workflow guide.

---

## Revision History

| Date | Version | Summary |
|------|---------|---------|
| 2026-01-31 | v30 | Waiting On refinements + Defer date picker |
| 2026-01-29 | v29 | BottomSheet iOS fix |
| 2026-01-28 | v28 | Nudge System MVP complete |
| 2026-01-27 | v27 | Recurring Tasks Phase 1-2 |
| 2026-01-26 | v26 | Nav Restructure |
| 2026-01-25 | v25 | Object-scoped AI |
| 2026-01-24 | v24 | Quick actions mobile wrap |
| 2026-01-23 | v23 | Palette target banner |
| 2026-01-22 | v22 | Unified AI palette |
| 2026-01-21 | v21 | Inline AI refinements |
| 2026-01-20 | v20 | Inline AI for steps |

For older history, see [docs/archive/](../../docs/archive/).
