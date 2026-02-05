# Design System Integration

> Migrating task-copilot from local components to shared design-system package.

**Status:** 🔄 In Progress
**Phase:** 3 of 6 (Simple Extractions Complete)

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
| 4 | Token Migration | ⬜ | ~300 high-priority replacements |
| 5 | Cleanup | ⬜ | Verification, dead code removal |
| 6 | Complex Component Unification | ⬜ | Unified TaskCard, RoutineCard (needs design spec) |

---

## Current State

| Metric | Value |
|--------|-------|
| Components in design-system | 8 (BottomSheet, RightDrawer, ResponsiveDrawer, ProgressRing, SegmentedControl, Pill, Toast, CollapsibleSection) |
| Local duplicates in task-copilot | 0 (all replaced) |
| Raw Tailwind class occurrences | 1,158 across 75 files |
| Simple components to extract | 0 (complete) |
| Complex components to unify | TBD (TaskCard variants, RoutineCard) |

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
