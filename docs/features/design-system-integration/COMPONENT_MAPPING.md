# Component Mapping: Current → ActionableCard

> Detailed mapping of existing card components to the ActionableCard system.

**Reference:** [PHASE6_SPEC.md](./PHASE6_SPEC.md)

---

## Summary Table

| Current Component | Location | Lines | ActionableCard Config | Status |
|-------------------|----------|-------|----------------------|--------|
| ~~TaskRow (pool)~~ | ~~`components/pool/TaskRow.tsx`~~ | ~~374~~ | `PoolTaskCard.tsx` | ✅ Done |
| ~~TriageRow~~ | ~~`components/shared/TriageRow.tsx`~~ | ~~299~~ | `TriageTaskCard.tsx` | ✅ Done |
| ~~QueueItem~~ | ~~`components/queue/QueueItem.tsx`~~ | ~~441~~ | `QueueTaskCard.tsx` | ✅ Done |
| ~~TaskRow (done)~~ | ~~`components/tasks/TasksView.tsx:719-913`~~ | ~~195~~ | `DoneTaskCard.tsx` | ✅ Done |
| ~~NotificationCard~~ | ~~`components/notifications/NotificationCard.tsx`~~ | ~~235~~ | Migrated to ActionableCard | ✅ Done |
| ~~RoutineRow~~ | ~~`components/routines/RoutinesList.tsx:176-285`~~ | ~~110~~ | `RoutineRowCard.tsx` | ✅ Done |
| ~~RoutineCard~~ | ~~`components/routines/RoutineCard.tsx`~~ | ~~177~~ | `RoutineGalleryCard.tsx` | ✅ Done |
| ~~InboxItem~~ | ~~`components/inbox/InboxItem.tsx`~~ | ~~366~~ | Deleted (dead code) | — |

**Migration complete:** ~1,831 lines → ~400 lines (78% reduction) ✅

---

## Detailed Mappings

### 1. TaskRow (Pool)

**File:** `components/pool/TaskRow.tsx`

**Current structure:**
```
┌─────────────────────────────────────────────────────────┐
│ [ProgressRing] [Title + Pills] [→ Focus] [⋮ Kebab]      │
└─────────────────────────────────────────────────────────┘
```

**ActionableCard mapping:**

| Slot | Content |
|------|---------|
| Leading | `<ProgressRing completed={n} total={m} />` |
| Body.Title | `{task.title}` |
| Body.Meta | `<MetadataPill>` for steps, target, deadline, project, badge |
| Trailing | `<AddToFocusButton />` + `<KebabMenu />` |

**Props:**
```tsx
<ActionableCard
  appearance={isInQueue ? "default" : "default"}  // showQueuedIndicator if in queue
  showQueuedIndicator={isInQueue}
  onClick={() => onOpen()}
/>
```

**Badge handling:** Deferred/waiting badges render as `<MetadataPill>` in Body.Meta.

---

### 2. TriageRow

**File:** `components/shared/TriageRow.tsx`

**Current structure:**
```
Compact variant:
┌─────────────────────────────────────────────────────────┐
│ [ProgressRing] [Title] [Send to Pool] [⋮]               │
│                [Pills]                                  │
└─────────────────────────────────────────────────────────┘

Full variant:
┌─────────────────────────────────────────────────────────┐
│ [ProgressRing] [Title + Pills] [Pool] [Focus] [⋮]       │
└─────────────────────────────────────────────────────────┘
```

**ActionableCard mapping:**

| Slot | Content |
|------|---------|
| Leading | `<ProgressRing />` |
| Body.Title | `{task.title}` |
| Body.Meta | Pills (steps, deadline, project) |
| Trailing | `<SendToPoolButton />` + optional `<AddToFocusButton />` + `<KebabMenu />` |

**Props:**
```tsx
<ActionableCard
  appearance="default"
  onClick={() => onOpenTask(task.id)}
/>
```

**Note:** `variant` prop on TriageRow (compact/full) affects which trailing buttons show, not ActionableCard layout.

---

### 3. QueueItem

**File:** `components/queue/QueueItem.tsx`

**Current structure:**
```
Today item (highlighted):
┌─────────────────────────────────────────────────────────┐
│ [≡ Drag] [Ring] [Title + Pills] [▶ Focus] [↑↓] [⋮]     │
└─────────────────────────────────────────────────────────┘

Later item (default):
┌─────────────────────────────────────────────────────────┐
│ [≡ Drag] [Ring] [Title + Pills] [▶ Focus] [↑↓] [⋮]     │
└─────────────────────────────────────────────────────────┘
```

**ActionableCard mapping:**

| Slot | Content |
|------|---------|
| Leading | `<DragHandle {...dragHandleProps} />` + `<ProgressRing />` |
| Body.Title | `{task.title}` + inline indicators (recurring, waiting-on) |
| Body.Meta | Pills (deadline, selected steps, project) |
| Trailing | `<FocusButton />` + `<PositionButtons />` + `<KebabMenu />` |

**Props:**
```tsx
<ActionableCard
  appearance={item.forToday ? "highlighted" : "default"}
  onClick={() => onOpenTask(task.id)}
/>
```

**Special considerations:**
- Drag handle needs `dragHandleProps` from `@dnd-kit`
- Position buttons (up/down) only show on hover or mobile
- First/last items hide respective position buttons

---

### 4. TaskRow (Done Tab)

**File:** `components/tasks/TasksView.tsx` (lines 719-913, inline component)

**Current structure:**
```
┌─────────────────────────────────────────────────────────┐
│ [ProgressRing] [Title + Pills]              [⋮ Kebab]   │
└─────────────────────────────────────────────────────────┘
```

**ActionableCard mapping:**

| Slot | Content |
|------|---------|
| Leading | `<ProgressRing isComplete={true} />` |
| Body.Title | `{task.title}` (with strikethrough for completed) |
| Body.Meta | Pills (steps, target, deadline, project) |
| Trailing | `<KebabMenu />` (delete only for completed) |

**Props:**
```tsx
<ActionableCard
  appearance="muted"
  isComplete={task.status === 'complete'}
  onClick={() => onOpen()}
/>
```

**Note:** Also used for Deferred tab (Hold) and Resurfaced section — those use `appearance="default"` with badge pill.

---

### 5. NotificationCard

**File:** `components/notifications/NotificationCard.tsx`

**Current structure:**
```
Active/Missed (highlighted):
┌─────────────────────────────────────────────────────────┐
│ [Icon/Emoji] [Title]                    [● unread dot] │
│              [Body text]                               │
│              [Timestamp]                               │
│              [Start] [Snooze] [Dismiss]                │
└─────────────────────────────────────────────────────────┘

Upcoming/Past (default/muted):
┌─────────────────────────────────────────────────────────┐
│ [Icon] [Title]                                         │
│        [Body text]                                     │
│        [Timestamp]                                     │
│        [Cancel] (upcoming only)                        │
└─────────────────────────────────────────────────────────┘
```

**ActionableCard mapping:**

| Slot | Content |
|------|---------|
| Leading | `<NotificationIcon />` or emoji for start pokes |
| Body.Title | `{notification.title}` + unread indicator |
| Body.Meta | `{notification.body}` + timestamp |
| Body.InlineActions | `<ActionButton>Start/Snooze/Dismiss/Cancel</ActionButton>` |
| Trailing | (none — actions are inline) |

**Props by section:**
```tsx
// Active
<ActionableCard appearance="highlighted" emphasis="primary" />

// Missed
<ActionableCard appearance="default" showQueuedIndicator={true} />

// Upcoming
<ActionableCard appearance="default" />

// Past
<ActionableCard appearance="muted" />
```

---

### 6. RoutineRow (Routines Tab)

**File:** `components/routines/RoutinesList.tsx` (lines 176-285)

**Current structure:**
```
┌─────────────────────────────────────────────────────────┐
│ [ProgressRing] [Title]                    [⚡ 5] [›]    │
│                [Pills: Paused, Pattern, Project]       │
└─────────────────────────────────────────────────────────┘
```

**ActionableCard mapping:**

| Slot | Content |
|------|---------|
| Leading | `<ProgressRing />` |
| Body.Title | `{task.title}` |
| Body.Meta | `<MetadataPill>` for paused, recurrence, project |
| Trailing | `<StreakBadge count={streak} />` + `<ChevronRight />` |

**Props:**
```tsx
<ActionableCard
  appearance={isPaused ? "default" : "default"}  // paused uses isComplete modifier
  isComplete={isPaused}  // reuse for muted/opacity effect
  onClick={() => onOpen()}
/>
```

---

### 7. RoutineCard (Gallery)

**File:** `components/routines/RoutineCard.tsx`

**Current structure:**
```
┌─────────────────────────────────┐
│ [Ring+!]              [⚡ 5]    │
│                                 │
│ Task title here                 │
│ possibly wrapping               │
│                                 │
│ 🔄 Daily at 9 AM                │
└─────────────────────────────────┘
```

**ActionableCard mapping:**

| Slot | Content |
|------|---------|
| Leading | `<StatusRing progress={n/m} alert={isPastWindow} onClick={onComplete} />` |
| Trailing | `<StreakBadge count={streak} />` |
| Body.Title | `{task.title}` with `clamp={2}` |
| Body.Meta | `<RecurrencePill pattern={desc} warning={isPastWindow} />` at `position="bottom"` |

**Props:**
```tsx
<ActionableCard
  variant="compact"
  appearance={isActiveWindow ? "highlighted" : "default"}
  height={110}
  onClick={() => onOpenDetail(task.id)}
/>
```

**Special considerations:**
- Ring is clickable (completes routine) — needs `onClick` prop on StatusRing
- Fixed 110px height for gallery horizontal scroll
- Title allows 2-line wrap
- Meta pushed to bottom with flex spacer

---

## Shared Primitives to Extract

These sub-components should also move to design-system:

| Primitive | Current Location | Notes |
|-----------|------------------|-------|
| `ProgressRing` | Already in design-system | May need `alert` prop |
| `MetadataPill` | `components/shared/MetadataPill.tsx` | Already in design-system as `Pill` |
| `StatusRing` | New | Extends ProgressRing with alert indicator |
| `DragHandle` | Inline in QueueItem | Extract as primitive |
| `KebabMenu` | Inline in multiple | Extract as primitive |
| `ActionButton` | Inline in NotificationCard | Small pill-style button |
| `StreakBadge` | Inline in RoutineCard/Row | Zap icon + count |

---

## Migration Checklist

### Phase 6a: Primitives ✅
- [x] Add ActionableCard tokens to `foundations.css`
- [x] Create `ActionableCard` frame
- [x] Create `ActionableCard.Leading`
- [x] Create `ActionableCard.Body`
- [x] Create `ActionableCard.Title`
- [x] Create `ActionableCard.Meta`
- [x] Create `ActionableCard.InlineActions`
- [x] Create `ActionableCard.Trailing`
- [x] Add Storybook stories
- [x] Export from package

### Phase 6b: First Migration ✅
- [x] Create `PoolTaskCard` using ActionableCard
- [x] Replace usage in `PoolView.tsx`
- [x] Create `TriageTaskCard` using ActionableCard
- [x] Replace usage in `InboxView.tsx` and `TasksView.tsx`
- [x] Delete `components/pool/TaskRow.tsx`
- [x] Delete `components/shared/TriageRow.tsx`

### Phase 6c: Queue & Done ✅
- [x] Create `QueueTaskCard` using ActionableCard
- [x] Replace usage in `QueueView.tsx`
- [x] Delete `components/queue/QueueItem.tsx`
- [x] Create `DoneTaskCard` using ActionableCard
- [x] Replace inline `TaskRow` in `TasksView.tsx`

### Phase 6d: Notifications & Routines ✅
- [x] Migrate `NotificationCard` to use ActionableCard
- [x] Migrate `RoutineRow` to use ActionableCard → `RoutineRowCard.tsx`
- [x] Migrate `RoutineCard` to use ActionableCard (compact variant) → `RoutineGalleryCard.tsx`

### Phase 6e: Cleanup ✅
- [x] Remove deleted component files
- [x] Update all imports
- [x] Visual regression testing (manual)
- [x] Update documentation
- [x] Run full test suite (133 tests pass)
