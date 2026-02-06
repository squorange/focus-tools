# Design System Integration

> Migrating task-copilot from local components to shared design-system package.

**Status:** ✅ Substantially Complete
**Phase:** 4 of 6 (Token Migration Complete)

## Quick Links

- [SPEC.md](./SPEC.md) - Migration requirements and rules
- [COMPONENT_CATALOG.md](./COMPONENT_CATALOG.md) - Component inventory

---

## Overview

Task-copilot previously had local copies of UI components with raw Tailwind classes. This migration:

1. **Wires up** `@focus-tools/design-system` as a dependency
2. **Replaces** local components with design-system equivalents
3. **Extracts** simple reusable components (Toast, CollapsibleSection)
4. **Migrates** raw Tailwind classes to semantic tokens
5. **Unifies** complex components (TaskCard variants, RoutineCard) with shared APIs

---

## Progress

| Phase | Description | Status | Notes |
|-------|-------------|--------|-------|
| 0 | Documentation | ✅ | This folder |
| 1 | Foundation Setup | ✅ | Dependency added, tokens imported |
| 2 | Component Replacement | ✅ | 6 components replaced, 5 deleted |
| 3 | Simple Extractions | ✅ | Toast, CollapsibleSection extracted with semantic tokens |
| 4 | Token Migration | ✅ | Tier 1-2 complete, Tier 3 intentionally kept |
| 5 | Cleanup | ⬜ | Verification, dead code removal |
| 6 | Complex Component Unification | ⬜ | Unified TaskCard, RoutineCard (needs design spec) |

---

## Current State

| Metric | Value |
|--------|-------|
| Components in design-system | 8 (BottomSheet, RightDrawer, ResponsiveDrawer, ProgressRing, SegmentedControl, Pill, Toast, CollapsibleSection) |
| Local duplicates in task-copilot | 0 (all replaced) |
| Semantic tokens in use | ~1,100+ |
| Raw zinc patterns remaining | ~341 (intentional component-specific styling) |
| Tier 1-2 patterns | ✅ Complete |
| Complex components to unify | TBD (TaskCard variants, RoutineCard) |

### Phase 4 Token Migration Detail

**Tier 1 Patterns (High Priority) — Complete ✅**

All 10 high-priority patterns migrated (386 replacements):

| Pattern | Target Token | Status |
|---------|--------------|--------|
| `bg-zinc-100 dark:bg-zinc-800` | `bg-bg-neutral-subtle` | ✅ |
| `bg-white dark:bg-zinc-800` | `bg-bg-neutral-min` | ✅ |
| `bg-white dark:bg-zinc-900` | `bg-bg-neutral-min` | ✅ |
| `bg-zinc-50 dark:bg-zinc-900` | `bg-bg-neutral-base` | ✅ |
| `text-zinc-900 dark:text-zinc-100` | `text-fg-neutral-primary` | ✅ |
| `text-zinc-700 dark:text-zinc-300` | `text-fg-neutral-primary` | ✅ |
| `text-zinc-600 dark:text-zinc-400` | `text-fg-neutral-secondary` | ✅ |
| `text-zinc-500 dark:text-zinc-400` | `text-fg-neutral-secondary` | ✅ |
| `border-zinc-200 dark:border-zinc-700` | `border-border-color-neutral` | ✅ |
| `border-zinc-300 dark:border-zinc-600` | `border-border-color-neutral` | ✅ |

**Tier 2 Patterns — Complete ✅**

Additional patterns migrated with new tokens:

| Pattern | Target Token | Status |
|---------|--------------|--------|
| `text-zinc-800 dark:text-zinc-200` | `text-fg-neutral-primary` | ✅ |
| `text-zinc-400 dark:text-zinc-500` | `text-fg-neutral-soft` | ✅ |
| `hover:bg-zinc-100 dark:hover:bg-zinc-700` | `hover:bg-bg-neutral-subtle` | ✅ |
| `hover:bg-zinc-200 dark:hover:bg-zinc-600` | `hover:bg-bg-neutral-subtle-hover` | ✅ (new token) |
| `hover:text-zinc-600 dark:hover:text-zinc-300` | `hover:text-fg-neutral-secondary` | ✅ |
| `hover:text-zinc-700 dark:hover:text-zinc-300` | `hover:text-fg-neutral-secondary` | ✅ |

**New Token Added:**
- `bg-neutral-subtle-hover` (zinc-200/zinc-600) - For stronger hover states on subtle backgrounds

**Tier 3 (Intentionally Kept) — No Action Needed**

Remaining ~341 raw patterns are intentional component-specific styling:
- Placeholder text colors (`text-zinc-400`)
- Segmented control backgrounds (`bg-zinc-100 dark:bg-zinc-700`)
- Input and card-specific borders
- Custom visual hierarchy effects

---

## Key Files

### Design System Package
- `packages/design-system/package.json` - Package definition
- `packages/design-system/components/` - Component source
- `packages/design-system/styles/foundations.css` - CSS tokens

### Task-Copilot Integration Points
- `prototypes/task-copilot/package.json` - Dependency added ✅
- `prototypes/task-copilot/app/globals.css` - Tokens imported ✅
- `prototypes/task-copilot/tsconfig.json` - Path alias ✅
- `prototypes/task-copilot/tailwind.config.ts` - Preset ✅

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [packages/design-system/README.md](../../../packages/design-system/README.md) | Design system overview |
| [Design System Storybook](../../../packages/design-system/stories/) | Component documentation |
| [PRINCIPLES.md](../../PRINCIPLES.md) | Design guidelines |
