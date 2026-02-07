# Phase 6: ActionableCard Component System

> Unified card primitive for tasks, notifications, and routines.

**Status:** Planning Complete
**Prerequisites:** Phases 1-5 complete

---

## Overview

Phase 6 extracts a unified `ActionableCard` component system to the design-system package. This replaces 5+ similar card implementations with a single composable primitive that enforces visual consistency while allowing context-specific content.

### Goals

1. **Visual consistency** — Shared radii, padding, fonts, spacing across all card types
2. **Constrained appearances** — Limited set of state-based styles (no ad-hoc styling)
3. **Composable slots** — Flexible content while maintaining structure
4. **Themeable** — CSS custom properties for appearance customization
5. **Reduced duplication** — Single source of truth for card behavior

### Non-Goals

- Full feature parity on day one (incremental migration)
- Breaking existing components during transition
- Over-abstraction (keep it practical)

---

## Component Architecture

### Slot Structure

```
ActionableCard
├── Leading         → Status indicator (ring, icon, emoji, drag handle)
├── Body
│   ├── Title       → Primary label
│   ├── Meta        → Secondary content (pills, description, timestamp)
│   └── InlineActions → Embedded action buttons (notifications, triage)
└── Trailing        → Right-aligned controls (buttons, badges, kebab menu)
```

### Variants

| Variant | Layout | Use Cases |
|---------|--------|-----------|
| `standard` | Horizontal, responsive | Task rows, notifications |
| `compact` | Stacked, fixed height | Routine gallery cards |

**Standard variant:**
```
┌────────────────────────────────────────────────────────┐
│ [Leading] [Body: Title + Meta + InlineActions] [Trailing] │
└────────────────────────────────────────────────────────┘
```

Mobile responsive (< 640px):
```
┌────────────────────────────────────────────────────────┐
│ [Leading] [Title]                           [Trailing] │
│           [Meta]                                       │
│           [InlineActions]                              │
└────────────────────────────────────────────────────────┘
```

**Compact variant:**
```
┌─────────────────────────────────────┐
│ [Leading]                [Trailing] │
│ [Title - multiline]                 │
│ [Meta - bottom]                     │
└─────────────────────────────────────┘
```

---

## Appearance System

### Base Appearances (Mutually Exclusive)

| Appearance | Background | Border | Use Cases |
|------------|------------|--------|-----------|
| `default` | `bg-zinc-50 dark:bg-zinc-800/80` | `border-border-color-neutral` | Pool, staging, inbox, upcoming |
| `highlighted` | `bg-violet-50 dark:bg-violet-900/20` | `border-violet-300 dark:border-violet-700` (2px) | Today queue, active notification, active routine |
| `muted` | `bg-zinc-50/60 dark:bg-zinc-800/40` | `border-border-color-neutral` | Completed, archived, past |

### Modifiers (Composable)

| Modifier | Effect | Use Cases |
|----------|--------|-----------|
| `isComplete` | Reduced opacity, strikethrough on title | Completed tasks |
| `showQueuedIndicator` | Subtle violet ring/left border | Queued but not today, missed notification |
| `emphasis` | Border weight (`primary` = 2px, `secondary` = 1px) | Active states |

### Appearance Mapping by Context

| Context | appearance | Modifiers |
|---------|------------|-----------|
| Pool task | `default` | — |
| Inbox/triage task | `default` | — |
| Queue item (later/upcoming) | `default` | `showQueuedIndicator` |
| Queue item (today) | `highlighted` | — |
| Deferred task | `default` | — (uses badge for date) |
| Completed task | `muted` | `isComplete` |
| Archived task | `muted` | — |
| Active notification | `highlighted` | — |
| Missed notification | `default` | `showQueuedIndicator` |
| Upcoming notification | `default` | — |
| Past notification | `muted` | — |
| Routine (active window) | `highlighted` | — |
| Routine (before/after window) | `default` | — |
| Routine (paused) | `default` | `isComplete` (reuse for muted) |

---

## Design Tokens

### Card Frame Tokens

```css
/* packages/design-system/styles/foundations.css */

/* Geometry */
--actionable-card-radius: 0.5rem;              /* 8px - rounded-lg */
--actionable-card-padding-x: 0.75rem;          /* 12px mobile */
--actionable-card-padding-x-sm: 1rem;          /* 16px desktop */
--actionable-card-padding-y: 0.75rem;          /* 12px */
--actionable-card-gap: 0.5rem;                 /* 8px between slots */

/* Typography */
--actionable-card-title-size: 0.875rem;        /* 14px */
--actionable-card-title-weight: 400;           /* normal */
--actionable-card-meta-size: 0.75rem;          /* 12px */
--actionable-card-action-size: 0.75rem;        /* 12px */

/* Compact variant */
--actionable-card-compact-height: 110px;
--actionable-card-compact-title-clamp: 2;

/* Appearance: default */
--actionable-card-bg-default: var(--color-bg-neutral-subtle);
--actionable-card-border-default: var(--color-border-neutral);

/* Appearance: highlighted */
--actionable-card-bg-highlighted: rgba(139, 92, 246, 0.08);       /* violet-50 equivalent */
--actionable-card-bg-highlighted-dark: rgba(139, 92, 246, 0.15);
--actionable-card-border-highlighted: #c4b5fd;                    /* violet-300 */
--actionable-card-border-highlighted-dark: rgba(139, 92, 246, 0.35); /* violet-500/35 - subtle */

/* Appearance: muted */
--actionable-card-bg-muted: rgba(244, 244, 245, 0.6);             /* zinc-50/60 */
--actionable-card-bg-muted-dark: rgba(39, 39, 42, 0.4);           /* zinc-800/40 */
--actionable-card-opacity-muted: 0.7;

/* Modifiers */
--actionable-card-queued-indicator: var(--color-border-brand);    /* violet for queued */
--actionable-card-complete-opacity: 0.6;
```

---

## Component API

### ActionableCard (Frame)

```tsx
interface ActionableCardProps {
  /** Layout variant */
  variant?: 'standard' | 'compact';

  /** Visual appearance */
  appearance?: 'default' | 'highlighted' | 'muted';

  /** Show completed state (opacity + strikethrough) */
  isComplete?: boolean;

  /** Show queued indicator (subtle accent border) */
  showQueuedIndicator?: boolean;

  /** Border emphasis */
  emphasis?: 'primary' | 'secondary';

  /** Fixed height for compact variant */
  height?: number | string;

  /** Click handler for entire card */
  onClick?: () => void;

  /** Additional className for overrides */
  className?: string;

  children: React.ReactNode;
}
```

### ActionableCard.Leading

```tsx
interface LeadingProps {
  children: React.ReactNode;
  className?: string;
}
```

Content examples:
- `<ProgressRing />` — Task progress
- `<StatusRing alert={isPastWindow} />` — Routine with alert
- `<DragHandle />` — Queue reordering
- `<NotificationIcon type="bell" />` — Notification type

### ActionableCard.Body

```tsx
interface BodyProps {
  children: React.ReactNode;
  className?: string;
}
```

Contains Title, Meta, and optional InlineActions.

### ActionableCard.Title

```tsx
interface TitleProps {
  /** Line clamp for multiline (compact variant) */
  clamp?: number;

  /** Show strikethrough (inherited from isComplete) */
  strikethrough?: boolean;

  children: React.ReactNode;
  className?: string;
}
```

### ActionableCard.Meta

```tsx
interface MetaProps {
  /** Position within body */
  position?: 'inline' | 'bottom';

  children: React.ReactNode;
  className?: string;
}
```

Content examples:
- `<MetadataPill>` — Deadline, project, energy
- `<RecurrencePill>` — Pattern description
- Timestamp text

### ActionableCard.InlineActions

```tsx
interface InlineActionsProps {
  children: React.ReactNode;
  className?: string;
}
```

Content examples:
- Notification buttons (Start, Snooze, Dismiss)
- Triage quick actions (if moved here later)

### ActionableCard.Trailing

```tsx
interface TrailingProps {
  children: React.ReactNode;
  className?: string;
}
```

Content examples:
- `<FocusButton />` — Start focus
- `<KebabMenu />` — More actions
- `<StreakBadge count={5} />` — Routine streak
- `<QueuePositionButtons />` — Move up/down

---

## Usage Examples

### Pool TaskRow

```tsx
<ActionableCard appearance="default" onClick={() => onOpenTask(task.id)}>
  <ActionableCard.Leading>
    <ProgressRing completed={completedSteps} total={totalSteps} />
  </ActionableCard.Leading>
  <ActionableCard.Body>
    <ActionableCard.Title>{task.title}</ActionableCard.Title>
    <ActionableCard.Meta>
      <DeadlinePill date={task.deadlineDate} />
      <ProjectPill project={project} />
    </ActionableCard.Meta>
  </ActionableCard.Body>
  <ActionableCard.Trailing>
    <AddToFocusButton onClick={() => onAddToQueue(task.id)} />
    <KebabMenu actions={[...]} />
  </ActionableCard.Trailing>
</ActionableCard>
```

### Queue Item (Today)

```tsx
<ActionableCard
  appearance="highlighted"
  onClick={() => onOpenTask(task.id)}
>
  <ActionableCard.Leading>
    <DragHandle {...dragHandleProps} />
    <ProgressRing completed={completedSteps} total={totalSteps} />
  </ActionableCard.Leading>
  <ActionableCard.Body>
    <ActionableCard.Title>{task.title}</ActionableCard.Title>
    <ActionableCard.Meta>
      <DeadlinePill date={task.deadlineDate} />
    </ActionableCard.Meta>
  </ActionableCard.Body>
  <ActionableCard.Trailing>
    <FocusButton onClick={() => onStartFocus(item.id)} />
    <QueueKebab item={item} />
  </ActionableCard.Trailing>
</ActionableCard>
```

### Completed Task

```tsx
<ActionableCard
  appearance="muted"
  isComplete={true}
  onClick={() => onOpenTask(task.id)}
>
  <ActionableCard.Leading>
    <ProgressRing completed={totalSteps} total={totalSteps} isComplete />
  </ActionableCard.Leading>
  <ActionableCard.Body>
    <ActionableCard.Title>{task.title}</ActionableCard.Title>
    <ActionableCard.Meta>
      <CompletedPill date={task.completedAt} />
    </ActionableCard.Meta>
  </ActionableCard.Body>
  <ActionableCard.Trailing>
    <KebabMenu actions={[{ label: 'Delete', onClick: onDelete }]} />
  </ActionableCard.Trailing>
</ActionableCard>
```

### Notification (Active)

```tsx
<ActionableCard
  appearance="highlighted"
  onClick={() => onTap()}
>
  <ActionableCard.Leading>
    <NotificationIcon type={notification.type} />
  </ActionableCard.Leading>
  <ActionableCard.Body>
    <ActionableCard.Title>{notification.title}</ActionableCard.Title>
    <ActionableCard.Meta>
      <span className="text-xs text-fg-neutral-soft">{timeStr}</span>
    </ActionableCard.Meta>
    <ActionableCard.InlineActions>
      <ActionButton onClick={onStart}>Start</ActionButton>
      <ActionButton onClick={() => onSnooze(5)}>Snooze 5m</ActionButton>
      <ActionButton onClick={onDismiss}>Dismiss</ActionButton>
    </ActionableCard.InlineActions>
  </ActionableCard.Body>
</ActionableCard>
```

### Routine Card (Compact)

```tsx
<ActionableCard
  variant="compact"
  appearance={isActiveWindow ? "highlighted" : "default"}
  height={110}
  onClick={() => onOpenDetail(task.id)}
>
  <ActionableCard.Leading>
    <StatusRing
      progress={completedSteps / totalSteps}
      alert={isPastWindow}
      onClick={handleComplete}
    />
  </ActionableCard.Leading>
  <ActionableCard.Trailing>
    <StreakBadge count={streak} />
  </ActionableCard.Trailing>
  <ActionableCard.Body>
    <ActionableCard.Title clamp={2}>{task.title}</ActionableCard.Title>
    <ActionableCard.Meta position="bottom">
      <RecurrencePill pattern={patternDescription} warning={isPastWindow} />
    </ActionableCard.Meta>
  </ActionableCard.Body>
</ActionableCard>
```

---

## Migration Plan

### Phase 6a: Primitives (Design System)

1. Add design tokens to `foundations.css`
2. Create `ActionableCard` frame component
3. Create slot components (Leading, Body, Title, Meta, InlineActions, Trailing)
4. Add Storybook stories for all variants/appearances
5. Export from design-system package

### Phase 6b: First Migration (Task-Copilot)

1. **PoolTaskCard** — Migrate `components/pool/TaskRow.tsx`
   - Simplest case, validates API
   - ~374 lines → ~50 lines (using ActionableCard)

2. **TriageTaskCard** — Migrate `components/shared/TriageRow.tsx`
   - Similar to Pool, adds variant prop
   - ~299 lines → ~60 lines

### Phase 6c: Queue & Done

3. **QueueTaskCard** — Migrate `components/queue/QueueItem.tsx`
   - Adds drag handle in Leading
   - Uses `highlighted` appearance for today
   - ~441 lines → ~80 lines

4. **DoneTaskCard** — Migrate inline `TaskRow` in `TasksView.tsx`
   - Uses `muted` appearance + `isComplete`
   - ~195 lines → ~40 lines

### Phase 6d: Notifications & Routines

5. **NotificationCard** — Migrate `components/notifications/NotificationCard.tsx`
   - Uses InlineActions slot
   - ~235 lines → ~60 lines

6. **RoutineRow** — Migrate `RoutineRow` in `RoutinesList.tsx`
   - Standard variant, adds streak in Trailing
   - ~120 lines → ~40 lines

7. **RoutineCard** — Migrate `components/routines/RoutineCard.tsx`
   - Compact variant
   - ~177 lines → ~50 lines

### Phase 6e: Cleanup

8. Delete migrated components
9. Update imports throughout app
10. Final visual regression check
11. Update documentation

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Lines of code | Reduce card implementations by ~60% |
| Visual consistency | All cards share radii, padding, fonts |
| Appearance coverage | 100% of card states map to 3 appearances |
| Test coverage | Unit tests for ActionableCard + stories |
| Build | Passes with no regressions |

---

## Open Questions

1. **Drag-and-drop integration** — How does `@dnd-kit` interact with ActionableCard? Likely pass `dragHandleProps` to Leading slot content.

2. **Animation** — Should ActionableCard include hover/press animations, or leave to consumers?

3. **Focus management** — Keyboard navigation within card (e.g., Tab to actions)?

4. **Virtualization** — Will ActionableCard work with `react-window` for long lists?

---

## Related Documents

- [README.md](./README.md) — Phase overview
- [COMPONENT_CATALOG.md](./COMPONENT_CATALOG.md) — Current component inventory
- [SPEC.md](./SPEC.md) — Original migration spec
- [packages/design-system/README.md](../../../packages/design-system/README.md) — Design system overview
