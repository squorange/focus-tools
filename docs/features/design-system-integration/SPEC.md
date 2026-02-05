# Design System Integration: Specification

> Requirements and rules for migrating task-copilot to use the design-system package.

---

## Requirements

### R1: Package Integration

| Rule | Priority |
|------|----------|
| task-copilot MUST add `@focus-tools/design-system` as dependency | Required |
| CSS tokens MUST be loaded via `foundations.css` import | Required |
| tsconfig paths MAY use `@design-system/*` alias | Optional |
| Tailwind preset MUST remain configured | Required |

### R2: Component Replacement

| Rule | Priority |
|------|----------|
| Local copies MUST be deleted after replacement verified | Required |
| Props MUST remain compatible (design-system is superset) | Required |
| Visual appearance SHOULD match via semantic tokens | Expected |
| Each replacement SHOULD be tested in light + dark mode | Expected |

### R3: New Extractions

| Rule | Priority |
|------|----------|
| Generic components SHOULD move to design-system | Expected |
| App-specific components MUST stay local | Required |
| Extracted components MUST have Storybook stories | Required |
| Extracted components MUST use semantic tokens | Required |

### R4: Token Migration

| Rule | Priority |
|------|----------|
| High-frequency patterns SHOULD use semantic tokens | Expected |
| One-off custom colors MAY remain raw | Optional |
| Dark mode MUST work correctly after migration | Required |
| Batch by semantic category, NOT all at once | Required |

---

## Token Mapping Reference

### Background Colors

| Raw Pattern | Semantic Token | Use Case |
|-------------|----------------|----------|
| `bg-zinc-50 dark:bg-zinc-900` | `bg-bg-neutral-base` | Page background |
| `bg-zinc-100 dark:bg-zinc-800` | `bg-bg-neutral-subtle` | Subtle background |
| `bg-white dark:bg-zinc-800` | `bg-bg-neutral-min` | Card background |
| `bg-white dark:bg-zinc-900` | `bg-bg-neutral-min` | Modal background |
| `bg-zinc-200 dark:bg-zinc-700` | `bg-bg-neutral-low` | Button secondary |
| `bg-violet-600` | `bg-bg-accent-high` | Primary button |
| `bg-green-600` | `bg-bg-positive-high` | Success state |
| `bg-red-600` | `bg-bg-alert-high` | Error/delete |
| `bg-amber-500` | `bg-bg-attention-high` | Warning |

### Text Colors

| Raw Pattern | Semantic Token | Use Case |
|-------------|----------------|----------|
| `text-zinc-900 dark:text-zinc-100` | `text-fg-neutral-primary` | Primary text |
| `text-zinc-700 dark:text-zinc-300` | `text-fg-neutral-primary` | Primary text alt |
| `text-zinc-600 dark:text-zinc-400` | `text-fg-neutral-secondary` | Secondary text |
| `text-zinc-500 dark:text-zinc-400` | `text-fg-neutral-secondary` | Muted text |
| `text-zinc-500` | `text-fg-neutral-soft` | Placeholder |
| `text-violet-600 dark:text-violet-400` | `text-fg-accent-primary` | Accent text |

### Border Colors

| Raw Pattern | Semantic Token | Use Case |
|-------------|----------------|----------|
| `border-zinc-200 dark:border-zinc-700` | `border-border-color-neutral` | Standard border |
| `border-zinc-300 dark:border-zinc-600` | `border-border-color-neutral` | Stronger border |
| `border-zinc-200/50 dark:border-zinc-700/50` | `border-border-color-neutral-subtle` | Subtle border |

### Hover States

| Raw Pattern | Semantic Token | Use Case |
|-------------|----------------|----------|
| `hover:bg-zinc-100 dark:hover:bg-zinc-800` | `hover:bg-bg-neutral-subtle` | Row hover |
| `hover:bg-zinc-50 dark:hover:bg-zinc-800` | `hover:bg-bg-neutral-subtle` | Light hover |
| `hover:bg-violet-700` | `hover:bg-bg-accent-high-accented` | Primary hover |

---

## Migration Tiers

### Tier 1: High-Frequency Patterns (Do First)

Focus on patterns appearing 30+ times with clear semantic mapping.

**Estimated scope:** ~300 replacements across ~40 files

### Tier 2: Component-Specific

Focus on high-traffic components:
- QueueItem, QueueView
- TaskRow, PoolView
- TaskDetail, DetailsSection
- Header, Sidebar

### Tier 3: Remaining (Lower Priority)

- Low-frequency components
- Edge cases
- One-off styling

---

## Exclusions

Do NOT migrate these patterns:

| Pattern | Reason |
|---------|--------|
| Shimmer/gradient animations | Custom visual effect |
| `@keyframes` in globals.css | Animation definitions |
| Third-party component overrides | External styling |
| Truly one-off custom colors | No semantic equivalent |

---

## Verification Checklist

For each phase completion:

- [ ] `npm run dev` succeeds without errors
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] No visual regressions in replaced components
- [ ] Design-system Storybook shows new components (Phase 3)
