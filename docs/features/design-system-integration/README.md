# Design System Integration

> Migrating task-copilot from local components to shared design-system package.

**Status:** 🔄 In Progress
**Phase:** 1 of 5 (Foundation Setup Complete)

## Quick Links

- [SPEC.md](./SPEC.md) - Migration requirements and rules
- [COMPONENT_CATALOG.md](./COMPONENT_CATALOG.md) - Component inventory

---

## Overview

Task-copilot previously had local copies of UI components with raw Tailwind classes. This migration:

1. **Wires up** `@focus-tools/design-system` as a dependency
2. **Replaces** local components with design-system equivalents
3. **Extracts** new reusable components (Toast, CollapsibleSection)
4. **Migrates** raw Tailwind classes to semantic tokens

---

## Progress

| Phase | Description | Status | Notes |
|-------|-------------|--------|-------|
| 0 | Documentation | ✅ | This folder |
| 1 | Foundation Setup | ✅ | Dependency added, tokens imported |
| 2 | Component Replacement | ⬜ | 6 components, ~30 files |
| 3 | Extract New Components | ⬜ | Toast, CollapsibleSection |
| 4 | Token Migration | ⬜ | ~300 high-priority replacements |
| 5 | Cleanup | ⬜ | Delete old files |

---

## Current State

| Metric | Value |
|--------|-------|
| Components in design-system | 6 (BottomSheet, RightDrawer, ResponsiveDrawer, ProgressRing, SegmentedControl, Pill) |
| Local duplicates in task-copilot | 6 |
| Raw Tailwind class occurrences | 1,158 across 75 files |
| Components to extract | 2 (Toast, CollapsibleSection) |

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
