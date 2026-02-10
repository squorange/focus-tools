# Focus Tools — Multi-Shell Architecture

> **Status:** Exploring
> **Last Updated:** February 2026
> **Purpose:** Technical strategy for supporting radically different interaction models on a shared foundation
> **Related:** [ORBITAL_ZEN.md](./ORBITAL_ZEN.md), [FUTURE_CONSIDERATIONS.md](./FUTURE_CONSIDERATIONS.md) § Theme System, [ARCHITECTURE_EVOLUTION_GUIDE.md](../ARCHITECTURE_EVOLUTION_GUIDE.md)

---

## The Problem

Focus Tools aims to support multiple interaction paradigms — list UI, Orbital Zen, bubbles, creatures, garden, etc. — all built on the same data model, business logic, and AI capabilities. Currently, UI components are tightly coupled to both logic and presentation: a `QueueItem` knows what a queue item *is*, how to *render* it, and how to *interact* with it. This coupling prevents swapping the entire presentation and interaction layer.

This document defines the technical strategy for decoupling these layers so that alternative "shells" can be built without duplicating core logic.

---

## Architecture: Three Layers

```
┌─────────────────────────────────────────┐
│            Shell (per theme)            │  ← Rendering, layout, animations,
│   List · Orbital Zen · Bubbles · etc.   │     interaction patterns, AI surfaces
├─────────────────────────────────────────┤
│       Interaction Abstraction           │  ← Headless hooks, action contracts,
│   (shared contract between layers)      │     state exposure, intent routing
├─────────────────────────────────────────┤
│         Shared Foundation               │  ← Data model, storage, AI tools/prompts,
│   (interaction-agnostic)                │     business logic, priority calc, nudges
└─────────────────────────────────────────┘
```

### Layer 1: Shared Foundation (mostly exists)

Everything in `lib/` that doesn't reference React or UI concerns:
- Data model and types (`types.ts`)
- Storage layer (`storage.ts`, `storage-idb.ts`, `indexeddb.ts`)
- AI tools, prompts, service (`ai-tools.ts`, `prompts.ts`, `ai-service.ts`, `ai-safety.ts`)
- Business logic (`priority.ts`, `queue-reorder.ts`, `utils.ts`)
- Rate limiting, analytics (`rate-limit.ts`, `analytics.ts`)

**Current state:** Well-separated. Most of `lib/` is already interaction-agnostic.

### Layer 2: Interaction Abstraction (needs building)

A set of headless React hooks that expose state and actions without any UI opinions. Any shell consumes these hooks to read state and dispatch actions.

**Core hooks to extract:**

| Hook | Responsibility | Currently lives in |
|------|---------------|-------------------|
| `useTaskManager()` | CRUD, workflow transitions (inbox→pool→complete→archive) | `page.tsx` handlers |
| `useFocusQueue()` | Queue operations, reordering, horizon management | `page.tsx` handlers |
| `useFocusSession()` | Timer, pause/resume, stuck flow, completion | `page.tsx` + `FocusModeView` |
| `useAIAssistant()` | Message sending, staging, tool responses | `page.tsx` + scattered |
| `useNudges()` | Nudge state, dismissal, snoozing | `page.tsx` handlers |
| `useNavigation()` | View routing, task selection, back navigation | `page.tsx` state |
| `useProjects()` | Project CRUD, filtering | `page.tsx` handlers |

Each hook exposes:
- **State:** Read-only data the shell needs to render
- **Actions:** Functions the shell calls in response to user intent (e.g., `completeStep(taskId, stepId)`)
- **Derived data:** Computed values (filtered lists, queue counts, etc.)

**Key principle:** Hooks express *intent*, not *interaction*. "User wants to add task X to queue" is the same intent whether triggered by a button click, a drag gesture, or feeding a creature.

### Layer 3: Shells (one per interaction model)

Each shell is a complete presentation layer that provides:

| Responsibility | Description |
|----------------|-------------|
| **Layout** | Overall app structure (sidebar vs. tabs vs. orbital canvas) |
| **View components** | Rendering for each app state (queue, pool, task detail, focus mode, inbox) |
| **Interaction patterns** | How user intent maps to gestures/clicks (drag orbit vs. click button vs. tap creature) |
| **Animation/motion** | Shell-specific transitions and effects |
| **Spatial model** | List, orbit, grid, freeform, physics-based, etc. |
| **AI surfaces** | How AI responses are presented (MiniBar vs. floating orb vs. companion speech) |

---

## Shell Interface

Each shell registers as an implementation of a common contract:

```typescript
interface Shell {
  id: string;
  name: string;
  description: string;

  // Metadata
  layoutEngine: 'list' | 'orbital' | 'freeform' | 'grid' | 'physics';
  supportsDragDrop: boolean;
  animationLevel: 'none' | 'subtle' | 'rich';
  mobileSupported: boolean;
  accessibilityLevel: 'full' | 'partial' | 'limited';

  // Root component — receives hooks, renders everything
  RootComponent: React.ComponentType<ShellProps>;
}

interface ShellProps {
  // All headless hooks are passed in (or accessed via context)
  taskManager: ReturnType<typeof useTaskManager>;
  focusQueue: ReturnType<typeof useFocusQueue>;
  focusSession: ReturnType<typeof useFocusSession>;
  aiAssistant: ReturnType<typeof useAIAssistant>;
  nudges: ReturnType<typeof useNudges>;
  navigation: ReturnType<typeof useNavigation>;
  projects: ReturnType<typeof useProjects>;
}
```

**Note:** This interface will evolve. The first real alternative shell (Orbital Zen) will pressure-test it and likely require changes. That's expected — don't over-specify before building.

---

## AI Surface Adaptation

The four-surface AI model (MiniBar → Palette → Drawer → StagingArea) is specific to the list UI. Other shells need different presentations of the same AI capabilities.

| Shell | AI Entry Point | Conversational Surface | Decision Surface |
|-------|---------------|----------------------|-----------------|
| **List** | MiniBar (status bar) | Palette / Drawer | StagingArea |
| **Orbital Zen** | Floating orb near focus sun | Expanding orb → chat | Orbiting preview objects |
| **Creatures** | Companion creature | Creature speech bubbles | Creature presents options |
| **Garden** | Garden spirit / fairy | Whisper overlay | Seeds to plant (accept/reject) |

**What's shared:** AI tool definitions, prompt construction, response parsing, staging state model.
**What's per-shell:** How the response is rendered, how accept/reject is presented, animation of AI actions.

The `useAIAssistant()` hook handles the shared parts. Each shell renders the results using its own components.

---

## Incremental Path

### Step 0: Foundation work (already done / in progress)

- Design system token extraction ✅
- ActionableCard unification ✅
- `lib/` logic mostly interaction-agnostic ✅

### Step 1: Extract headless hooks from page.tsx

**Effort:** Medium-High (largest single piece of work)
**What it unlocks:** Any shell can consume app logic
**Progress:** Session 1 complete — `useToasts`, `useProjects`, `useNavigation` extracted

This is the critical step. `page.tsx` currently holds ~all state and handlers. Extract into composable hooks that can be used by any shell.

**Approach:**
1. Start with the most self-contained domain (e.g., `useProjects()`) ✅
2. Work through each hook, moving state + handlers out of page.tsx
3. page.tsx becomes a thin shell that wires hooks to current list components
4. Validate: current UI still works identically after extraction ✅ (build + 133 tests pass)

**Session 1 results (Feb 9, 2026):**
- `useToasts` — self-contained toast state + showToast/dismissToast (31 lines)
- `useProjects` — project CRUD + modal state, takes `showToast` (141 lines)
- `useNavigation` — view switching, sidebar, drawers, search, scroll, 3 effects (286 lines)
- page.tsx reduced from 6,252 → 5,937 lines (~315 removed)
- 15 inline `setToasts(...)` calls migrated to `showToast(...)`

**Next candidates for extraction:**
- `useTaskCrud` — task create/update/delete + undo toasts
- `useFocusQueue` — queue add/remove/reorder/step-selection
- `useFocusSession` — focus mode start/pause/resume/exit
- `useNotifications` — notification scheduling, alerts, poke management

**Risk:** Some handlers have cross-cutting concerns (e.g., completing a step affects queue state, nudge state, and session state). These need careful boundary design — probably a shared context or event bus rather than hooks calling each other.

### Step 2: Define Shell interface contract

**Effort:** Medium
**What it unlocks:** Clear API for what a shell must implement

Draft the `Shell` and `ShellProps` interfaces. Define what actions every shell must support (core actions) vs. what's optional (shell-specific interactions like orbital drag).

### Step 3: Refactor current UI as "List Shell"

**Effort:** Medium
**What it unlocks:** Proves the abstraction works

Wrap the current list-based UI into a shell that consumes the headless hooks. **This is the validation step.** If the current UI works as a shell without losing functionality, the abstraction is right. If it's painful, the boundaries are wrong.

### Step 4: Color theming within List Shell

**Effort:** Low
**What it unlocks:** Quick user-facing win, validates token system

This is already on the roadmap (Infra Phase 7). Implement within the List Shell using design tokens.

### Step 5: Build Orbital Zen as second shell

**Effort:** High
**What it unlocks:** Full architecture validation

First alternative shell. Will pressure-test and likely require iteration on the hook interfaces and Shell contract.

### Step 6: Stabilize and document Shell contract

**Effort:** Medium
**What it unlocks:** Community/future shells

After two working shells, formalize the interface, document it, and any subsequent themes (creatures, garden, bubbles) become "just another shell."

---

## Trade-offs

### What you gain
- Radical flexibility in presentation — new interaction models without rewriting logic
- Shared improvements to AI, storage, and business logic benefit all shells
- Each shell can evolve independently
- Potential for community-created themes (long-term)
- Testing of core logic is shell-independent

### What you give up
- More indirection (harder to trace a user action through the full stack)
- Shell authors need to understand the hook contract
- Some interaction patterns may push back on the abstraction (e.g., gesture-heavy shells may need richer state than hooks expose)
- Upfront investment in extraction before any new visual capability

### Key risk: Premature abstraction

The current list UI is the only real shell. The hooks extracted will inevitably be shaped by list-UI assumptions. When Orbital Zen arrives, some abstractions will be wrong and need refactoring. **This is expected and acceptable** — extract what's obviously correct now, plan to iterate.

**Mitigation:** Step 3 (List Shell refactor) validates the abstraction before investing in alternative shells. If the List Shell works cleanly, confidence is high. If not, iterate before proceeding.

---

## Relationship to Existing Infrastructure Phases

| Infra Phase | Relationship to Multi-Shell |
|-------------|---------------------------|
| Phase 4: Design System ✅ | Token extraction separates visual decisions from components — prerequisite |
| Phase 7: Theming Infrastructure | Color theming within shells; theme provider wraps shells |
| Phase 8: Orbital Zen | First alternative shell; validates the full architecture |

**Hook extraction (Steps 1-3) should happen between Phase 7 and Phase 8.** Theming provides the forcing function to separate presentation concerns, and hooks need to exist before Orbital Zen can be built as a shell.

Alternatively, hook extraction could start earlier as an opportunistic refactor — every time `page.tsx` is touched, extract one more domain into a hook.

---

## Open Questions

1. **Hook communication:** When completing a step affects queue, nudges, and session state, how do hooks coordinate? Shared context? Event bus? Orchestrator hook?
2. **Shell-specific state:** Orbital Zen needs orbital positions, animation state, zoom level. Where does shell-specific state live relative to the shared hooks?
3. **Routing:** Does each shell define its own navigation model, or is there a shared routing contract?
4. **Performance:** Rich shells (Orbital Zen, Creatures) may need Canvas/WebGL. How does this coexist with React's DOM rendering for shared components like modals/drawers?
5. **Accessibility:** What's the minimum accessibility contract for a shell? Can a Canvas-based shell provide screen reader support?
6. **Testing:** How to test shells independently? Headless hook tests cover logic; shell tests need visual/interaction testing per shell.

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [ORBITAL_ZEN.md](./ORBITAL_ZEN.md) | First alternative shell design — view-by-view concepts |
| [FUTURE_CONSIDERATIONS.md](./FUTURE_CONSIDERATIONS.md) § Theme System | ThemeAdapter sketch, monetization, community themes |
| [UI_CONCEPTS_EXPLORED.md](./UI_CONCEPTS_EXPLORED.md) | Catalog of potential shell concepts |
| [../ARCHITECTURE_EVOLUTION_GUIDE.md](../ARCHITECTURE_EVOLUTION_GUIDE.md) | Infrastructure timing decisions, component coupling watch item |
| [../PRINCIPLES.md](../PRINCIPLES.md) | Design principles shells must respect |
| [../ROADMAP.md](../ROADMAP.md) | Infra phases 7-8 (theming, Orbital Zen) |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-02-08 | Initial document — three-layer architecture, shell interface, incremental path, trade-offs |
