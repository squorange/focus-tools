# Component Status Audit

**Generated:** February 7, 2026
**Purpose:** Compare design system components vs non-extracted components for theming migration

---

## Part 1: Extracted Components (Design System)

Location: `/packages/design-system/components/`

| Component | File Path | Uses Only Semantic Tokens? | Raw Color Count | Notes |
|-----------|-----------|---------------------------|-----------------|-------|
| **ActionableCard** | `/packages/design-system/components/ActionableCard/ActionableCard.tsx` | Yes | 0 | Uses CSS custom properties (`--actionable-card-*`) and semantic tokens like `text-fg-neutral-primary`, `text-fg-neutral-secondary` |
| **Pill** | `/packages/design-system/components/Pill/Pill.tsx` | Yes | 0 | Fully semantic: uses `bg-bg-*`, `text-fg-*`, `border-border-color-*` tokens for all variants including status, priority, and health |
| **ProgressRing** | `/packages/design-system/components/ProgressRing/ProgressRing.tsx` | Yes | 0 | Uses `bg-bg-positive-strong`, `text-fg-neutral-inverse-primary`, `text-fg-neutral-disabled`, `text-fg-neutral-softest`, `text-fg-accent-primary` |
| **Toast/ToastItem** | `/packages/design-system/components/Toast/Toast.tsx` | Yes | 0 | Uses semantic tokens: `bg-bg-neutral-inverse`, `bg-bg-positive-high`, `bg-bg-attention-high`, `bg-bg-alert-high` |
| **BottomSheet** | `/packages/design-system/components/BottomSheet/BottomSheet.tsx` | Yes | 0 | Uses `bg-bg-glass-floating-panel`, `bg-bg-backdrop`, `border-border-color-glass-floating-panel`, `bg-fg-neutral-disabled`, `shadow-elevation-high` |
| **RightDrawer** | `/packages/design-system/components/RightDrawer/RightDrawer.tsx` | Yes | 0 | Uses `bg-bg-neutral-subtle`, `border-border-color-neutral-subtle`, `shadow-elevation-high` |
| **ResponsiveDrawer** | `/packages/design-system/components/ResponsiveDrawer/ResponsiveDrawer.tsx` | Yes | 0 | Wrapper component - inherits from BottomSheet and RightDrawer |
| **SegmentedControl** | `/packages/design-system/components/SegmentedControl/SegmentedControl.tsx` | Partial | 2 | Uses `text-fg-neutral-primary`, `text-fg-neutral-spot-readable` BUT has raw: `bg-black/[0.06]`, `dark:bg-white/[0.08]`, `bg-white dark:bg-[#141417]` |
| **CollapsibleSection** | `/packages/design-system/components/CollapsibleSection/CollapsibleSection.tsx` | Yes | 0 | Uses `text-fg-neutral-primary`, `text-fg-accent-primary`, `bg-bg-accent-subtle`, `text-fg-neutral-soft` |

### Design System Summary

- **8 of 9 components** are fully semantic (88.9%)
- **1 component** (SegmentedControl) has minor raw color usage that should be tokenized
- The design system provides excellent foundations for theming

---

## Part 2: Non-Extracted Components

### Task Copilot Components (`/prototypes/task-copilot/components/`)

| Component | File Path | Has Color Styling? | Raw Color Count | Migration Difficulty | Notes |
|-----------|-----------|-------------------|-----------------|---------------------|-------|
| **StagingArea** | `components/StagingArea.tsx` | Yes | 40+ | **Hard** | Heavy use of violet, purple, green, neutral, red, blue, amber palette colors with light/dark variants |
| **StagingToast** | `components/StagingToast.tsx` | Yes | 12 | **Medium** | amber-50/700/800, green-600/700, shadow with rgba |
| **TaskRow** (dashboard) | `components/dashboard/TaskRow.tsx` | Yes | 15 | **Medium** | Priority colors (red-500, yellow-500, blue-500), neutral palette, green-500 |
| **Sidebar** | `components/layout/Sidebar.tsx` | Yes | 20+ | **Medium** | Status color map, violet palette, zinc palette, yellow highlight |
| **Header** | `components/layout/Header.tsx` | Yes | 6 | **Easy** | Violet-100/200/600/400 for plus button |
| **TabCluster** | `components/layout/TabCluster.tsx` | Yes | 4 | **Easy** | `bg-white dark:bg-[#141417]`, violet-500 badge |
| **SearchBar** | `components/layout/SearchBar.tsx` | Yes | 8 | **Easy** | zinc-50/800, zinc-300/600, blue-500 focus ring |
| **QuickCapture** (inbox) | `components/inbox/QuickCapture.tsx` | Yes | 10 | **Easy** | violet palette, zinc palette |
| **InboxView** | `components/inbox/InboxView.tsx` | Yes | 4 | **Easy** | violet-100/200/700/300, green-500 |
| **QueueTaskCard** | `components/queue/QueueTaskCard.tsx` | Yes | 2 | **Easy** | Uses ActionableCard + Pill (mostly semantic), fallback `#9ca3af` |
| **QueueView** | `components/queue/QueueView.tsx` | Yes | 4 | **Easy** | zinc-400 icons |
| **DailySummaryBanner** | `components/queue/DailySummaryBanner.tsx` | Yes | 0 | **Easy** | Minimal styling |
| **CompletedDrawer** | `components/queue/CompletedDrawer.tsx` | Yes | 0 | **Easy** | Uses design system components |
| **PoolTaskCard** | `components/pool/PoolTaskCard.tsx` | Yes | 2 | **Easy** | Uses ActionableCard + Pill, fallback colors |
| **PoolView** | `components/pool/PoolView.tsx` | Yes | 6 | **Easy** | zinc-400, violet-500 |
| **TasksView** | `components/tasks/TasksView.tsx` | Yes | 15+ | **Medium** | violet palette, zinc palette, `bg-white dark:bg-[#141417]` |
| **DoneTaskCard** | `components/tasks/DoneTaskCard.tsx` | Yes | 8 | **Easy** | Uses ActionableCard, violet/green/zinc/red colors |
| **TriageTaskCard** | `components/shared/TriageTaskCard.tsx` | Yes | 6 | **Easy** | Uses ActionableCard, zinc-400, red-600 |
| **EnergySelector** | `components/shared/EnergySelector.tsx` | Yes | 18 | **Medium** | Energy level color map (amber, green, blue) with active states |
| **PriorityDisplay** | `components/shared/PriorityDisplay.tsx` | Yes | 8 | **Medium** | Priority tier color map (red, orange, amber, neutral) |
| **PriorityBreakdownDrawer** | `components/shared/PriorityBreakdownDrawer.tsx` | Yes | 20 | **Medium** | Priority tier config with bg/text colors, zinc palette, green/blue hints |
| **FilterDrawer** | `components/shared/FilterDrawer.tsx` | Yes | 25+ | **Hard** | Heavy violet, zinc palette usage throughout |
| **ProjectModal** | `components/shared/ProjectModal.tsx` | Yes | 10 | **Medium** | Hex project colors, violet-500, red palette |
| **DatePickerModal** | `components/shared/DatePickerModal.tsx` | Yes | 6 | **Easy** | violet-500, zinc-400 |
| **NotificationPermissionBanner** | `components/shared/NotificationPermissionBanner.tsx` | Yes | 12 | **Easy** | violet palette |
| **AIDisclosure** | `components/shared/AIDisclosure.tsx` | Yes | 40+ | **Hard** | slate, blue, amber, green palettes extensively |
| **AIFeedback** | `components/shared/AIFeedback.tsx` | Yes | 0 | **Easy** | Minimal color styling |
| **HealthPill** | `components/shared/HealthPill.tsx` | Yes | 6 | **Easy** | Health status colors (red-500, amber-500, green-500) |
| **MetadataPill** | `components/shared/MetadataPill.tsx` | Yes | 2 | **Easy** | Accepts color prop for project colors |
| **DetailsPill** | `components/shared/DetailsPill.tsx` | Yes | 0 | **Easy** | Uses design system styling |
| **DurationPicker** | `components/shared/DurationPicker.tsx` | Yes | 12 | **Medium** | violet palette, zinc palette |
| **ImportancePicker** | `components/shared/ImportancePicker.tsx` | Yes | 8 | **Easy** | violet palette, zinc palette |
| **LeadTimePicker** | `components/shared/LeadTimePicker.tsx` | Yes | 8 | **Easy** | violet palette, zinc palette |
| **StartPokePicker** | `components/shared/StartPokePicker.tsx` | Yes | 12 | **Medium** | amber warnings, violet palette |
| **ReminderPicker** | `components/shared/ReminderPicker.tsx` | Yes | 10 | **Easy** | violet-600/700, zinc palette |
| **EnergyTypePicker** | `components/shared/EnergyTypePicker.tsx` | Yes | 8 | **Easy** | violet palette, zinc palette |
| **TaskCreationPopover** | `components/shared/TaskCreationPopover.tsx` | Yes | 15 | **Medium** | violet palette, zinc palette |
| **FocusSelectionModal** | `components/shared/FocusSelectionModal.tsx` | Yes | 4 | **Easy** | Minimal colors |
| **TaskDetail** | `components/task-detail/TaskDetail.tsx` | Yes | 50+ | **Hard** | Massive component with extensive color usage: violet, zinc, amber, red, green palettes |
| **StatusModule** | `components/task-detail/StatusModule.tsx` | Yes | 4 | **Easy** | zinc-200/700 progress colors |
| **RecurrenceFields** | `components/task-detail/RecurrenceFields.tsx` | Yes | 8 | **Easy** | violet-500, border tokens |
| **DetailsSection** | `components/task-detail/DetailsSection.tsx` | Yes | 2 | **Easy** | Minimal, uses pills |
| **StartPokeField** | `components/task-detail/StartPokeField.tsx` | Yes | 0 | **Easy** | Uses pickers |
| **NotificationCard** | `components/notifications/NotificationCard.tsx` | Yes | 6 | **Easy** | Uses ActionableCard, icon color function with violet/orange |
| **NotificationsHub** | `components/notifications/NotificationsHub.tsx` | Yes | 4 | **Easy** | Minimal colors |
| **NotificationBadge** | `components/notifications/NotificationBadge.tsx` | Yes | 2 | **Easy** | Uses accent colors |
| **NotificationSettings** | `components/notifications/NotificationSettings.tsx` | Yes | 4 | **Easy** | Minimal colors |
| **PriorityQueueModule** | `components/notifications/PriorityQueueModule.tsx` | Yes | 4 | **Easy** | Minimal colors |
| **FocusModeView** | `components/focus-mode/FocusModeView.tsx` | Yes | 15 | **Medium** | violet palette, green-600/400, zinc palette |
| **ProjectsView** | `components/projects/ProjectsView.tsx` | Yes | 20 | **Medium** | violet palette, zinc palette, red/green status |
| **RoutinesList** | `components/routines/RoutinesList.tsx` | Yes | 4 | **Easy** | Minimal colors |
| **RoutineRowCard** | `components/routines/RoutineRowCard.tsx` | Yes | 4 | **Easy** | Uses ActionableCard, project color fallback |
| **RoutineGalleryCard** | `components/routines/RoutineGalleryCard.tsx` | Yes | 2 | **Easy** | Uses ActionableCard |
| **RoutinesGallery** | `components/routines/RoutinesGallery.tsx` | Yes | 2 | **Easy** | Minimal colors |
| **HistoryModal** | `components/routines/HistoryModal.tsx` | Yes | 4 | **Easy** | Minimal colors |
| **SearchView** | `components/search/SearchView.tsx` | Yes | 4 | **Easy** | Minimal colors |
| **TaskList** | `components/TaskList.tsx` | Yes | 10 | **Easy** | neutral palette, blue palette |
| **TaskItem** | `components/TaskItem.tsx` | Yes | 4 | **Easy** | Uses SVG icons |
| **StuckMenu** | `components/StuckMenu.tsx` | Yes | 2 | **Easy** | Minimal colors |
| **NotesModule** | `components/NotesModule.tsx` | Yes | 12 | **Easy** | neutral palette |
| **AIDrawer** | `components/ai-assistant/AIDrawer.tsx` | Yes | 4 | **Easy** | Uses SVG stroke |
| **ChatHistory** | `components/ai-assistant/ChatHistory.tsx` | Yes | 4 | **Easy** | Minimal colors |
| **ResponseDisplay** | `components/ai-assistant/ResponseDisplay.tsx` | Yes | 2 | **Easy** | Minimal colors |
| **QuickActions** | `components/ai-assistant/QuickActions.tsx` | Yes | 2 | **Easy** | Minimal colors |
| **MiniBarContent** | `components/ai-assistant/MiniBarContent.tsx` | Yes | 2 | **Easy** | Minimal colors |
| **PaletteContent** | `components/ai-assistant/PaletteContent.tsx` | Yes | 6 | **Easy** | Uses SVG strokes |
| **ShimmerText** | `components/ai-assistant/ShimmerText.tsx` | Yes | 0 | **Easy** | Animation only |
| **AIAssistantOverlay** | `components/ai-assistant/AIAssistantOverlay.tsx` | Yes | 2 | **Easy** | Minimal colors |

### Orbital Zen Components (`/prototypes/orbital-zen-next/`)

| Component | File Path | Has Color Styling? | Raw Color Count | Migration Difficulty | Notes |
|-----------|-----------|-------------------|-----------------|---------------------|-------|
| **TaskNode** | `app/components/TaskNode.tsx` | Yes | 30+ | **Hard** | Complex priority-based rgba gradients, hex colors for urgency indicators |
| **SolarSystemView** | `app/components/SolarSystemView.tsx` | Yes | 20+ | **Hard** | Dynamic rgba gradients, drop shadows |
| **AIDrawer** (orbital) | `app/components/focus-mode/AIDrawer.tsx` | Yes | 40+ | **Hard** | Priority-based color system with rgba calculations |
| **FocusModeMoon** | `app/components/focus-mode/FocusModeMoon.tsx` | Yes | 15 | **Hard** | SVG gradient stops with rgba |
| **FocusModeSky** | `app/components/focus-mode/FocusModeSky.tsx` | Yes | 10 | **Medium** | Radial/linear gradients with hex |
| **FocusModeView** (orbital) | `app/components/focus-mode/FocusModeView.tsx` | Yes | 4 | **Easy** | Uses taskColor prop |
| **TimerBadge** | `app/components/TimerBadge.tsx` | Yes | 8 | **Medium** | rgba gradients, hex colors |
| **SubtaskMoons** | `app/components/SubtaskMoons.tsx` | Yes | 4 | **Medium** | rgba radial gradients |
| **FoggyRingMarker** | `app/components/markers/FoggyRingMarker.tsx` | Yes | 4 | **Medium** | Dynamic rgba color strings |
| **OrbitalRing** | `app/components/OrbitalRing.tsx` | Yes | 2 | **Easy** | Minimal colors |
| **OrbitalView** | `app/components/OrbitalView.tsx` | Yes | 2 | **Easy** | Minimal colors |

### AI Minibar Components (`/prototypes/ai-minibar/`)

| Component | File Path | Has Color Styling? | Raw Color Count | Migration Difficulty | Notes |
|-----------|-----------|-------------------|-----------------|---------------------|-------|
| **Drawer** | `components/ai-assistant/Drawer.tsx` | Yes | 4 | **Easy** | SVG strokes |
| **ResponseDisplay** | `components/ai-assistant/ResponseDisplay.tsx` | Yes | 4 | **Easy** | SVG strokes |
| **PaletteContent** | `components/ai-assistant/PaletteContent.tsx` | Yes | 4 | **Easy** | SVG strokes |

---

## Part 3: Color Mapping Objects

These are high-value migration targets - centralizing them means many components get themed at once.

| Location | What It Maps | Current Color Values | Semantic Token Candidate |
|----------|--------------|---------------------|-------------------------|
| **Sidebar.tsx:168-172** | Task status → badge colors | `inbox: bg-amber-100/900 text-amber-700/300`<br>`pool: bg-blue-100/900 text-blue-700/300`<br>`complete: bg-green-100/900 text-green-700/300`<br>`archived: bg-zinc-100/700 text-fg-neutral-secondary` | `bg-bg-status-{status}-subtle`, `text-fg-status-{status}` (already exists in Pill) |
| **EnergySelector.tsx:38-59** | Energy level → color classes | `high: text-amber-500, activeColor: bg-amber-100 text-amber-700 border-amber-300`<br>`medium: text-green-500, activeColor: bg-green-100 text-green-700 border-green-300`<br>`low: text-blue-500, activeColor: bg-blue-100 text-blue-700 border-blue-300` | Create `--energy-{level}-*` tokens or map to existing semantic roles |
| **PriorityDisplay.tsx:22-38** | Priority tier → text color | `critical: text-red-600 dark:text-red-400`<br>`high: text-orange-600 dark:text-orange-400`<br>`medium: text-amber-600 dark:text-amber-400`<br>`low: text-fg-neutral-secondary` | `text-fg-priority-{tier}` or use `text-fg-alert-*` / `text-fg-attention-*` |
| **PriorityBreakdownDrawer.tsx:32-53** | Priority tier → bg + text | `critical: bg-red-100/900 text-red-700/400`<br>`high: bg-orange-100/900 text-orange-700/400`<br>`medium: bg-amber-100/900 text-amber-700/400`<br>`low: bg-bg-neutral-subtle text-zinc-700/400` | `bg-bg-priority-{tier}`, `text-fg-priority-{tier}` |
| **TaskRow.tsx:27-30** | Priority → dot color | `high: bg-red-500`<br>`medium: bg-yellow-500`<br>`low: bg-blue-500` | `bg-bg-priority-{tier}-strong` |
| **NotificationCard.tsx:36-46** | Notification type → icon color | `start_poke: text-violet-500 dark:text-violet-400`<br>`streak: text-orange-500 dark:text-orange-400`<br>`default: text-fg-neutral-secondary` | `text-fg-notification-{type}` or map to semantic roles |
| **ProjectModal.tsx:16-21** | Project color palette | Fixed hex: `#eab308, #14b8a6, #3b82f6, #6366f1, #a855f7, #ec4899` | These are user-selectable accent colors - may need to remain as hex but should consider accessible palette |
| **StagingArea.tsx (multiple)** | Suggestion type → badge | `TITLE: bg-purple-100/900 text-purple-700/300`<br>`EDIT: bg-blue-100/900 text-blue-700/300`<br>`DELETE: bg-red-100/900 text-red-700/300`<br>`SET: bg-amber-100/900 text-amber-700/300`<br>`NEW: bg-green-100/900 text-green-700/300` | Could use Pill variants: `info`, `error`, `warning`, `success` |
| **orbital TaskNode.tsx:142-179** | Priority → gradient colors | Complex rgba calculations based on priority for backgrounds, borders, text | Special case - orbital uses dynamic opacity. May need separate theming approach |
| **orbital AIDrawer.tsx:39-72** | Priority → atmospheric colors | rgba color strings with dynamic opacity | Same as above - atmospheric effects need different approach |

---

## Summary

### Component Counts

| Category | Count | Fully Semantic | Needs Migration |
|----------|-------|----------------|-----------------|
| Design System Components | 9 | 8 (89%) | 1 |
| Task Copilot Components | ~65 | ~5 (8%) | ~60 |
| Orbital Zen Components | ~11 | 0 (0%) | ~11 |
| AI Minibar Components | ~3 | 0 (0%) | ~3 |
| **Total** | **~88** | **~13 (15%)** | **~75 (85%)** |

### Difficulty Distribution (Non-Design-System)

| Difficulty | Count | Percentage |
|------------|-------|------------|
| **Easy** | ~45 | 60% |
| **Medium** | ~18 | 24% |
| **Hard** | ~12 | 16% |

### Suggested Migration Order

#### Phase 1: Easy Wins (High Impact, Low Effort)
1. **SegmentedControl** - Fix the 2 raw colors in design system first
2. **NotificationCard** - Already uses ActionableCard, just needs icon color map
3. **HealthPill** - Simple health status color map
4. **Header/TabCluster** - Small, frequently visible components
5. **SearchBar/QuickCapture** - Input focus states

#### Phase 2: Color Maps (Highest Impact)
1. **Create priority tier tokens** - One change fixes PriorityDisplay, PriorityBreakdownDrawer, TaskRow
2. **Create energy level tokens** - Fixes EnergySelector
3. **Unify status colors** - Sidebar status badges should use existing Pill status variants
4. **Standardize suggestion badges** - StagingArea badges → Pill variants

#### Phase 3: Medium Components
1. **Picker components** (DurationPicker, ImportancePicker, etc.) - Similar patterns
2. **FilterDrawer** - Heavy but consistent violet/zinc usage
3. **ProjectsView/FocusModeView** - Moderate complexity

#### Phase 4: Hard Components
1. **TaskDetail** - Largest component, touch last after patterns established
2. **StagingArea** - Many suggestion types, complex
3. **AIDisclosure** - Heavy but lower priority (disclosure UI)

#### Phase 5: Orbital Zen (Separate Track)
The orbital prototype uses dynamic color calculations with rgba that don't fit the standard token model. Options:
- Create separate atmospheric/gradient token system
- Keep as-is since it's a prototype
- Refactor to use CSS custom properties with opacity modifiers

### Color Mapping Objects to Tokenize

**Immediate Priority (affects multiple components):**
1. Priority tier colors → `--fg-priority-{critical|high|medium|low}`, `--bg-priority-{tier}-subtle`
2. Energy level colors → `--fg-energy-{high|medium|low}`, `--bg-energy-{level}-subtle`
3. Status badge colors → Already exist as `bg-bg-status-*`, `text-fg-status-*` in Pill

**Secondary Priority:**
4. Notification type colors → Map to existing semantic roles or create notification tokens
5. Suggestion type badges → Use Pill component with appropriate variants

**Keep as User-Selectable:**
6. Project colors → These are user-customizable, keep as hex palette

---

## Recommendations

1. **Start with SegmentedControl** - It's in the design system and has only 2 raw colors to fix

2. **Create a priority token set** - This single change will enable easy migration of 3+ components

3. **Use Pill more extensively** - Many status/badge patterns in components duplicate what Pill already provides semantically

4. **Consider component extraction** - EnergySelector, PriorityDisplay could be extracted to design system as they're reused

5. **Document orbital separately** - The orbital prototype has fundamentally different color needs (atmospheric/dynamic) that warrant separate treatment
