# Color Usage Audit

**Generated:** February 7, 2026
**Auditor:** Claude Code
**Scope:** All `.tsx`, `.ts`, and `.css` files in prototypes/ and packages/

---

## Executive Summary

| Category | Files | Occurrences | Status |
|----------|-------|-------------|--------|
| Semantic Token Usage (Good) | 89 | 1,561 | Ready |
| Raw Tailwind Colors (Needs Migration) | 106 | 2,076 | Migrate |
| Inline/JS Color Values (Needs Migration) | 22 | 145 | Migrate |
| **Total Files Needing Migration** | **~100** | **~2,221** | |

---

## Report A: Semantic Token Usage (The Good)

Files correctly using CSS custom properties (`--color-*`) or semantic Tailwind classes (`bg-bg-*`, `text-fg-*`, `border-border-*`, etc.).

### prototypes/task-copilot

| File Path | Count | Example Classes |
|-----------|-------|-----------------|
| `/prototypes/task-copilot/components/task-detail/TaskDetail.tsx` | 147 | `bg-bg-neutral-min`, `text-fg-neutral-primary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/notifications/NotificationSettings.tsx` | 59 | `bg-bg-neutral-subtle`, `text-fg-neutral-secondary`, `border-separator-neutral` |
| `/prototypes/task-copilot/components/routines/HistoryModal.tsx` | 38 | `bg-bg-neutral-base`, `text-fg-accent-primary`, `border-border-neutral-default` |
| `/prototypes/task-copilot/components/shared/ReminderPicker.tsx` | 37 | `bg-bg-neutral-subtle`, `text-fg-neutral-primary`, `bg-status-*` |
| `/prototypes/task-copilot/components/task-detail/DetailsSection.tsx` | 35 | `text-fg-neutral-secondary`, `bg-bg-neutral-subtle`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/ai-assistant/PaletteContent.tsx` | 33 | `bg-bg-neutral-min`, `text-fg-neutral-primary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/focus-mode/FocusModeView.tsx` | 30 | `bg-bg-neutral-base`, `text-fg-neutral-primary`, `bg-status-focus-*` |
| `/prototypes/task-copilot/components/layout/Sidebar.tsx` | 26 | `bg-bg-neutral-min`, `text-fg-neutral-secondary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/shared/DurationPicker.tsx` | 23 | `text-fg-neutral-primary`, `bg-bg-neutral-subtle`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/tasks/TasksView.tsx` | 22 | `bg-bg-neutral-base`, `text-fg-neutral-primary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/shared/PriorityBreakdownDrawer.tsx` | 19 | `bg-bg-neutral-min`, `text-fg-neutral-secondary`, `bg-status-*` |
| `/prototypes/task-copilot/components/task-detail/RecurrenceFields.tsx` | 19 | `text-fg-neutral-primary`, `bg-bg-neutral-subtle`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/shared/LeadTimePicker.tsx` | 17 | `text-fg-neutral-primary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/shared/EnergyTypePicker.tsx` | 17 | `text-fg-neutral-primary`, `bg-bg-neutral-subtle`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/task-detail/StartPokeField.tsx` | 16 | `text-fg-neutral-primary`, `bg-bg-neutral-subtle` |
| `/prototypes/task-copilot/components/shared/TaskCreationPopover.tsx` | 15 | `text-fg-neutral-primary`, `bg-bg-neutral-min` |
| `/prototypes/task-copilot/components/search/SearchView.tsx` | 15 | `bg-bg-neutral-base`, `text-fg-neutral-primary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/queue/CompletedDrawer.tsx` | 15 | `bg-bg-neutral-min`, `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/shared/ProjectModal.tsx` | 14 | `text-fg-neutral-primary`, `bg-bg-neutral-subtle`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/shared/DatePickerModal.tsx` | 14 | `text-fg-neutral-primary`, `bg-bg-neutral-min`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/shared/StartPokePicker.tsx` | 13 | `text-fg-neutral-primary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/shared/FocusSelectionModal.tsx` | 12 | `bg-bg-neutral-subtle`, `text-fg-neutral-primary` |
| `/prototypes/task-copilot/components/shared/FilterDrawer.tsx` | 11 | `text-fg-neutral-primary`, `bg-bg-neutral-subtle`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/shared/ImportancePicker.tsx` | 11 | `text-fg-neutral-primary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/shared/TriageTaskCard.tsx` | 11 | `bg-bg-neutral-min`, `text-fg-neutral-primary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/pool/PoolTaskCard.tsx` | 10 | `bg-bg-neutral-min`, `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/task-detail/StatusModule.tsx` | 9 | `bg-status-completed-*`, `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/queue/QueueView.tsx` | 9 | `bg-bg-neutral-base`, `text-fg-neutral-primary` |
| `/prototypes/task-copilot/components/queue/QueueTaskCard.tsx` | 9 | `bg-bg-neutral-min`, `text-fg-neutral-primary` |
| `/prototypes/task-copilot/components/projects/ProjectsView.tsx` | 8 | `bg-bg-neutral-min`, `text-fg-neutral-primary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/notifications/NotificationsHub.tsx` | 8 | `bg-bg-neutral-min`, `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/pool/PoolView.tsx` | 8 | `bg-bg-neutral-base`, `text-fg-neutral-primary` |
| `/prototypes/task-copilot/components/notifications/PriorityQueueModule.tsx` | 8 | `bg-bg-neutral-min`, `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/layout/Header.tsx` | 7 | `bg-bg-neutral-min`, `text-fg-neutral-primary` |
| `/prototypes/task-copilot/components/notifications/NotificationCard.tsx` | 7 | `bg-bg-neutral-min`, `text-fg-neutral-primary` |
| `/prototypes/task-copilot/components/shared/DurationInput.tsx` | 6 | `text-fg-neutral-primary`, `bg-bg-neutral-subtle` |
| `/prototypes/task-copilot/components/layout/SearchBar.tsx` | 6 | `bg-bg-neutral-min`, `text-fg-neutral-primary`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/ai-assistant/MiniBarContent.tsx` | 5 | `bg-bg-neutral-min`, `text-fg-neutral-primary` |
| `/prototypes/task-copilot/components/inbox/QuickCapture.tsx` | 4 | `text-fg-neutral-soft`, `border-border-color-neutral` |
| `/prototypes/task-copilot/components/layout/TabCluster.tsx` | 4 | `text-fg-neutral-primary`, `bg-bg-neutral-subtle` |
| `/prototypes/task-copilot/components/shared/HealthPill.tsx` | 4 | `bg-status-*`, `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/shared/PriorityDisplay.tsx` | 4 | `text-fg-neutral-secondary`, `bg-status-*` |
| `/prototypes/task-copilot/lib/priority.ts` | 4 | Semantic color token references |
| `/prototypes/task-copilot/components/ai-assistant/AIDrawer.tsx` | 3 | `bg-bg-neutral-min`, `text-fg-neutral-primary` |
| `/prototypes/task-copilot/components/routines/RoutinesList.tsx` | 3 | `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/shared/DetailsPill.tsx` | 3 | `text-fg-neutral-secondary`, `bg-bg-neutral-subtle` |
| `/prototypes/task-copilot/app/page.tsx` | 2 | `bg-bg-neutral-base` |
| `/prototypes/task-copilot/components/StagingArea.tsx` | 2 | `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/dashboard/TaskRow.tsx` | 2 | `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/inbox/InboxView.tsx` | 2 | `bg-bg-neutral-base`, `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/shared/EnergySelector.tsx` | 2 | `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/shared/ReadOnlyInfoPopover.tsx` | 2 | `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/shared/MetadataPill.tsx` | 2 | `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/queue/DailySummaryBanner.tsx` | 2 | `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/components/ai-assistant/ResponseDisplay.tsx` | 2 | `text-fg-neutral-primary` |
| `/prototypes/task-copilot/components/routines/RoutineGalleryCard.tsx` | 2 | `text-fg-neutral-secondary` |
| `/prototypes/task-copilot/lib/utils.ts` | 2 | Semantic color token references |
| `/prototypes/task-copilot/components/tasks/DoneTaskCard.tsx` | 8 | `bg-bg-neutral-min`, `text-fg-neutral-primary`, `border-border-color-neutral` |

**Subtotal (task-copilot):** 62 files, 832 occurrences

### packages/design-system

| File Path | Count | Example Classes |
|-----------|-------|-----------------|
| `/packages/design-system/stories/semantics/Colors.stories.tsx` | 154 | Demo of semantic tokens |
| `/packages/design-system/stories/semantics/TextStyles.stories.tsx` | 79 | `text-fg-neutral-primary`, `text-fg-neutral-secondary` |
| `/packages/design-system/stories/semantics/Elevation.stories.tsx` | 80 | `bg-bg-neutral-min`, `border-border-color-neutral` |
| `/packages/design-system/stories/semantics/Spacing.stories.tsx` | 81 | `bg-bg-neutral-subtle`, `text-fg-neutral-primary` |
| `/packages/design-system/stories/primitives/ColorPrimitives.stories.tsx` | 67 | Primitive color demos |
| `/packages/design-system/styles/foundations.css` | 66 | CSS token definitions |
| `/packages/design-system/components/Pill/Pill.tsx` | 22 | `bg-bg-status-*`, `text-fg-*` |
| `/packages/design-system/stories/semantics/GlassEffects.stories.tsx` | 23 | `bg-surface-*` |
| `/packages/design-system/components/RightDrawer/RightDrawer.stories.tsx` | 23 | `bg-bg-neutral-min`, `text-fg-neutral-primary` |
| `/packages/design-system/foundations/colors.ts` | 20 | Token definitions |
| `/packages/design-system/tokens/colors.ts` | 17 | Token mappings |
| `/packages/design-system/components/ProgressRing/ProgressRing.stories.tsx` | 17 | `bg-bg-neutral-subtle` |
| `/packages/design-system/components/ActionableCard/ActionableCard.stories.tsx` | 14 | `bg-bg-neutral-min`, `text-fg-neutral-primary` |
| `/packages/design-system/components/CollapsibleSection/CollapsibleSection.stories.tsx` | 13 | `bg-bg-neutral-subtle` |
| `/packages/design-system/components/ResponsiveDrawer/ResponsiveDrawer.stories.tsx` | 13 | `bg-bg-neutral-min` |
| `/packages/design-system/components/BottomSheet/BottomSheet.stories.tsx` | 11 | `bg-bg-neutral-min` |
| `/packages/design-system/components/ProgressRing/ProgressRing.tsx` | 5 | `bg-bg-neutral-subtle` |
| `/packages/design-system/components/Toast/Toast.stories.tsx` | 4 | `bg-status-*` |
| `/packages/design-system/components/Toast/Toast.tsx` | 4 | `bg-status-*`, `text-fg-*` |
| `/packages/design-system/components/SegmentedControl/SegmentedControl.stories.tsx` | 4 | `bg-bg-neutral-subtle` |
| `/packages/design-system/components/CollapsibleSection/CollapsibleSection.tsx` | 3 | `text-fg-neutral-primary` |
| `/packages/design-system/components/SegmentedControl/SegmentedControl.tsx` | 2 | `bg-bg-neutral-subtle` |
| `/packages/design-system/components/ActionableCard/ActionableCard.tsx` | 2 | `bg-bg-neutral-min` |
| `/packages/design-system/components/BottomSheet/BottomSheet.tsx` | 2 | `bg-bg-neutral-min` |
| `/packages/design-system/components/RightDrawer/RightDrawer.tsx` | 1 | `bg-bg-neutral-min` |
| `/packages/design-system/.storybook/preview.tsx` | 1 | `bg-surface`, `text-text-primary` |

**Subtotal (design-system):** 27 files (excluding storybook-static), 729 occurrences

---

## Report B: Raw Tailwind Color Classes (Needs Migration)

Files with hardcoded Tailwind color classes that should migrate to semantic tokens.

### By Color Family

| Color | Total Occurrences | Files Affected |
|-------|-------------------|----------------|
| zinc-* | ~536 | 86 |
| violet-* | ~271 | 55 |
| blue-* | ~182 | 40 |
| green-* | ~162 | 38 |
| neutral-* | ~110 | 9 |
| amber-* | ~74 | 24 |
| red-* | ~72 | 29 |
| white/black | ~212 | 50 |
| slate-* | ~50 | 6 |
| orange-* | ~26 | 10 |
| yellow-* | ~18 | 8 |
| purple-* | ~8 | 5 |

### Detailed File Breakdown

| File Path | Raw Count | dark: Count | hover:/focus: Count | Top Classes |
|-----------|-----------|-------------|---------------------|-------------|
| `/prototypes/task-copilot/components/task-detail/TaskDetail.tsx` | 152 | 60 | 15 | `bg-zinc-100`, `dark:bg-zinc-700`, `text-violet-600`, `hover:bg-zinc-200` |
| `/prototypes/task-copilot/components/ai-assistant/PaletteContent.tsx` | 87 | 11 | 13 | `bg-violet-600`, `text-violet-500`, `bg-white`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/TaskItem.tsx` | 76 | 27 | 4 | `text-neutral-500`, `bg-green-500`, `border-blue-500`, `dark:text-neutral-400` |
| `/prototypes/orbital-zen-next/app/components/AIPanel.tsx` | 75 | 73 | 0 | `text-zinc-400`, `dark:text-zinc-500`, `bg-zinc-900`, `border-zinc-700` |
| `/prototypes/task-copilot/components/StagingArea.tsx` | 70 | 35 | 6 | `bg-violet-600`, `text-green-600`, `bg-zinc-100`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/shared/AIDisclosure.tsx` | 58 | 17 | 1 | `text-blue-600`, `bg-blue-100`, `text-slate-600`, `dark:text-blue-400` |
| `/prototypes/task-copilot/components/routines/HistoryModal.tsx` | 52 | 8 | 1 | `bg-violet-600`, `text-green-500`, `bg-amber-100`, `dark:bg-amber-900` |
| `/prototypes/task-copilot/components/shared/AIFeedback.tsx` | 47 | 7 | 3 | `text-slate-400`, `bg-green-100`, `hover:bg-green-100`, `dark:bg-green-900` |
| `/prototypes/orbital-zen-next/app/components/TaskNode.tsx` | 43 | 12 | 3 | `bg-red-900`, `bg-blue-900`, `border-yellow-500`, `hover:border-blue-400` |
| `/prototypes/task-copilot/components/focus-mode/FocusModeView.tsx` | 42 | 13 | 3 | `bg-violet-600`, `text-green-600`, `bg-green-50`, `dark:bg-green-900` |
| `/prototypes/ai-minibar/components/demo/DemoShell.tsx` | 42 | 24 | 2 | `bg-zinc-900`, `text-zinc-400`, `bg-yellow-400`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/search/SearchView.tsx` | 38 | 10 | 4 | `bg-blue-100`, `text-zinc-500`, `bg-violet-600`, `dark:bg-blue-900` |
| `/prototypes/task-copilot/components/shared/NotificationPermissionBanner.tsx` | 36 | 2 | 0 | `bg-violet-600`, `text-violet-700`, `bg-violet-50`, `dark:bg-violet-900` |
| `/prototypes/task-copilot/components/ai-assistant/MiniBarContent.tsx` | 35 | 5 | 0 | `bg-violet-600`, `text-violet-500`, `bg-amber-100`, `dark:bg-amber-900` |
| `/prototypes/task-copilot/components/shared/FilterDrawer.tsx` | 34 | 11 | 3 | `bg-zinc-50`, `border-zinc-100`, `text-fg-neutral-secondary`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/layout/Sidebar.tsx` | 33 | 9 | 2 | `text-zinc-300`, `bg-blue-100`, `border-zinc-200`, `dark:bg-zinc-700` |
| `/prototypes/orbital-zen-next/app/components/SolarSystemView.tsx` | 32 | 11 | 0 | `bg-red-900`, `text-yellow-300`, `border-blue-500`, `hover:bg-blue-900` |
| `/prototypes/ai-minibar/components/ai-assistant/ResponseDisplay.tsx` | 31 | 11 | 3 | `text-zinc-500`, `bg-red-50`, `text-red-600`, `dark:bg-red-900` |
| `/prototypes/task-copilot/components/notifications/NotificationSettings.tsx` | 30 | 13 | 0 | `bg-violet-600`, `text-violet-500`, `bg-zinc-100`, `dark:bg-zinc-700` |
| `/prototypes/task-copilot/components/StuckMenu.tsx` | 28 | 3 | 2 | `text-neutral-500`, `bg-neutral-100`, `hover:bg-neutral-200`, `dark:text-neutral-400` |
| `/prototypes/task-copilot/components/dashboard/TaskRow.tsx` | 26 | 8 | 2 | `bg-neutral-100`, `text-blue-600`, `bg-green-500`, `dark:bg-neutral-700` |
| `/prototypes/task-copilot/components/NotesModule.tsx` | 26 | 4 | 0 | `text-neutral-500`, `bg-zinc-100`, `border-zinc-100`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/projects/ProjectsView.tsx` | 25 | 6 | 1 | `text-zinc-400`, `bg-zinc-50`, `text-green-600`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/lib/utils.ts` | 24 | 14 | 0 | `bg-blue-100`, `text-blue-700`, `bg-green-100`, `dark:bg-blue-900` |
| `/prototypes/task-copilot/components/pool/PoolView.tsx` | 23 | 1 | 0 | `bg-amber-100`, `text-amber-700`, `bg-violet-600`, `dark:bg-amber-900` |
| `/prototypes/task-copilot/components/shared/MetadataPill.tsx` | 22 | 8 | 0 | `bg-violet-100`, `text-blue-700`, `bg-green-100`, `dark:bg-violet-900` |
| `/prototypes/task-copilot/components/queue/QueueView.tsx` | 20 | 4 | 0 | `bg-violet-600`, `text-violet-500`, `bg-zinc-100`, `dark:bg-zinc-700` |
| `/prototypes/ai-minibar/components/demo/ResponseTriggers.tsx` | 20 | 8 | 4 | `bg-blue-100`, `text-yellow-600`, `bg-red-100`, `dark:bg-blue-900` |
| `/prototypes/task-copilot/lib/priority.ts` | 19 | 7 | 0 | `bg-red-100`, `text-amber-600`, `bg-green-100`, `dark:bg-red-900` |
| `/prototypes/task-copilot/components/shared/EnergySelector.tsx` | 18 | 5 | 1 | `text-green-500`, `bg-blue-100`, `border-green-300`, `dark:bg-blue-900` |
| `/prototypes/task-copilot/components/notifications/NotificationCard.tsx` | 18 | 1 | 4 | `text-orange-500`, `bg-white`, `hover:text-blue-600`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/task-detail/StatusModule.tsx` | 17 | 4 | 0 | `text-zinc-200`, `text-green-500`, `bg-green-500`, `dark:text-zinc-700` |
| `/prototypes/task-copilot/components/shared/TaskCreationPopover.tsx` | 16 | 4 | 0 | `bg-zinc-100`, `text-zinc-400`, `text-violet-500`, `dark:bg-zinc-900` |
| `/prototypes/task-copilot/components/shared/PriorityBreakdownDrawer.tsx` | 16 | 9 | 0 | `text-zinc-700`, `bg-blue-50`, `text-green-600`, `dark:text-zinc-400` |
| `/prototypes/task-copilot/components/notifications/PriorityQueueModule.tsx` | 14 | 5 | 1 | `bg-violet-600`, `text-orange-500`, `bg-red-50`, `dark:bg-red-900` |
| `/prototypes/task-copilot/components/inbox/QuickCapture.tsx` | 13 | 2 | 1 | `bg-zinc-100`, `text-fg-neutral-soft`, `hover:border-zinc-300`, `dark:bg-zinc-700` |
| `/prototypes/task-copilot/components/task-detail/DetailsSection.tsx` | 12 | 7 | 8 | `bg-zinc-200`, `text-violet-600`, `hover:bg-zinc-200`, `dark:bg-zinc-700` |
| `/prototypes/task-copilot/components/dashboard/TaskSection.tsx` | 12 | 3 | 0 | `text-neutral-500`, `bg-neutral-100`, `dark:text-neutral-400` |
| `/prototypes/task-copilot/components/pool/PoolTaskCard.tsx` | 11 | 4 | 0 | `text-violet-600`, `text-red-500`, `bg-violet-600`, `dark:text-violet-400` |
| `/prototypes/task-copilot/components/queue/CompletedDrawer.tsx` | 10 | 3 | 1 | `text-green-600`, `bg-zinc-100`, `hover:bg-zinc-200`, `dark:bg-zinc-700` |
| `/prototypes/task-copilot/components/shared/DurationPicker.tsx` | 10 | 3 | 3 | `bg-zinc-50`, `hover:border-zinc-300`, `hover:text-zinc-700`, `dark:bg-zinc-800` |
| `/prototypes/orbital-zen-next/app/page.tsx` | 9 | 3 | 0 | `bg-red-500`, `text-zinc-400`, `text-white`, `dark:text-zinc-200` |
| `/prototypes/task-copilot/components/dashboard/Dashboard.tsx` | 9 | 5 | 1 | `text-neutral-500`, `bg-neutral-800`, `bg-white`, `dark:text-neutral-400` |
| `/prototypes/task-copilot/components/shared/ReminderPicker.tsx` | 9 | 2 | 4 | `border-zinc-100`, `hover:text-zinc-800`, `text-white`, `dark:border-zinc-700` |
| `/prototypes/task-copilot/components/shared/LeadTimePicker.tsx` | 8 | 3 | 1 | `bg-zinc-50`, `hover:border-zinc-300`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/task-detail/RecurrenceFields.tsx` | 8 | 1 | 2 | `text-zinc-400`, `hover:bg-zinc-200`, `dark:hover:bg-zinc-700` |
| `/prototypes/task-copilot/components/layout/SearchBar.tsx` | 7 | 1 | 2 | `text-zinc-400`, `bg-zinc-50`, `focus:ring-blue-500`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/task-detail/StartPokeField.tsx` | 7 | 3 | 1 | `bg-zinc-50`, `text-violet-600`, `hover:border-zinc-300`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/shared/StartPokePicker.tsx` | 7 | 5 | 1 | `bg-zinc-50`, `hover:border-zinc-300`, `dark:bg-zinc-800` |
| `/prototypes/orbital-zen-next/app/components/focus-mode/FocusModeTopNav.tsx` | 7 | 4 | 0 | `text-white`, `text-slate-300`, `bg-purple-600`, `dark:text-slate-400` |
| `/prototypes/orbital-zen-next/app/components/OfflineIndicator.tsx` | 6 | 1 | 0 | `bg-yellow-500`, `text-white`, `bg-zinc-800` |
| `/prototypes/ai-minibar/components/ai-assistant/Drawer.tsx` | 6 | 10 | 1 | `bg-zinc-900`, `border-zinc-700`, `hover:bg-zinc-800`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/shared/ImportancePicker.tsx` | 6 | 3 | 1 | `bg-zinc-50`, `hover:border-zinc-300`, `dark:bg-zinc-800` |
| `/prototypes/task-copilot/components/shared/ProjectModal.tsx` | 6 | 2 | 2 | `text-zinc-400`, `text-red-500`, `hover:border-zinc-400`, `dark:bg-zinc-700` |
| `/prototypes/task-copilot/components/shared/FocusSelectionModal.tsx` | 6 | 7 | 0 | `bg-zinc-100`, `text-white`, `border-zinc-100`, `dark:bg-zinc-700` |
| `/prototypes/orbital-zen-next/app/components/ErrorBoundary.tsx` | 6 | 1 | 1 | `bg-red-500`, `text-red-400`, `hover:bg-red-600`, `dark:text-red-300` |

*Additional 52 files with 1-5 raw color class occurrences each*

### dark: Prefixed Variants Summary

**Total:** 464 occurrences across 72 files

Top files:
- `/prototypes/orbital-zen-next/app/components/AIPanel.tsx`: 73 dark: classes
- `/prototypes/task-copilot/components/task-detail/TaskDetail.tsx`: 60 dark: classes
- `/prototypes/task-copilot/components/StagingArea.tsx`: 35 dark: classes
- `/prototypes/task-copilot/components/TaskItem.tsx`: 27 dark: classes
- `/prototypes/ai-minibar/components/demo/DemoShell.tsx`: 24 dark: classes

### State-Prefixed Variants Summary

**hover:/focus:/active:/disabled: totals:** 126 occurrences across 50 files

- `hover:bg-zinc-*`: 58 occurrences
- `hover:text-zinc-*`: 22 occurrences
- `hover:bg-blue-*`: 18 occurrences
- `hover:border-zinc-*`: 12 occurrences
- `focus:ring-blue-*`: 4 occurrences

---

## Report C: Inline & JS Color Values (Needs Migration)

Files with hardcoded hex codes, rgb/rgba/hsl values in styles or JavaScript constants.

### Hex Codes in Components

| File Path | Count | Values Found |
|-----------|-------|--------------|
| `/prototypes/task-copilot/lib/utils.ts` | 9 | `#16a34a`, `#f59e0b`, `#ef4444`, `#71717a`, `#8b5cf6`, `#6d28d9`, `#f97316`, `#6366f1`, `#2563eb`, `#d97706` |
| `/prototypes/task-copilot/lib/ai-constants.ts` | 5 | `#7c3aed`, `#6d28d9`, `#22c55e`, `#ef4444`, `#f59e0b` |
| `/prototypes/ai-minibar/lib/constants.ts` | 5 | `#7c3aed`, `#6d28d9`, `#22c55e`, `#ef4444`, `#f59e0b` |
| `/prototypes/task-copilot/components/shared/ProjectModal.tsx` | 6 | `#eab308`, `#14b8a6`, `#3b82f6`, `#6366f1`, `#a855f7`, `#ec4899` |
| `/prototypes/task-copilot/app/layout.tsx` | 2 | `#ffffff`, `#18181b` |
| `/prototypes/orbital-zen-next/app/layout.tsx` | 1 | `#1a1a2e` |
| `/prototypes/ai-minibar/app/layout.tsx` | 1 | `#0c0c0c` |
| `/prototypes/orbital-zen-next/app/components/TaskNode.tsx` | 4 | `#fecaca`, `#fed7aa`, `#fef08a`, `#bfdbfe` |
| `/prototypes/orbital-zen-next/app/components/focus-mode/FocusModeView.tsx` | 1 | `#8b5cf6` |
| `/prototypes/orbital-zen-next/app/components/TimerBadge.tsx` | 1 | `#e0d7f5` |
| `/prototypes/task-copilot/components/tasks/DoneTaskCard.tsx` | 1 | `#9ca3af` (project color fallback) |
| `/prototypes/task-copilot/components/routines/RoutineRowCard.tsx` | 1 | `#9ca3af` (project color fallback) |
| `/prototypes/task-copilot/components/queue/QueueTaskCard.tsx` | 1 | `#9ca3af` (project color fallback) |

### Arbitrary Tailwind Classes (`bg-[#...]`, `dark:bg-[#...]`)

| File Path | Count | Values |
|-----------|-------|--------|
| `/prototypes/task-copilot/components/layout/TabCluster.tsx` | 2 | `dark:bg-[#141417]` |
| `/prototypes/task-copilot/components/tasks/TasksView.tsx` | 1 | `dark:bg-[#141417]` |
| `/prototypes/task-copilot/components/layout/Sidebar.tsx` | 1 | `dark:bg-[#141417]` |

### rgba() in Styles/JS

| File Path | Count | Context |
|-----------|-------|---------|
| `/prototypes/orbital-zen-next/app/components/TaskNode.tsx` | 24 | Priority-based gradients, shadows |
| `/prototypes/orbital-zen-next/app/components/focus-mode/AIDrawer.tsx` | 18 | Priority-based overlays, glows |
| `/prototypes/orbital-zen-next/app/components/SolarSystemView.tsx` | 6 | Gradient backgrounds |
| `/prototypes/orbital-zen-next/app/components/focus-mode/FocusModeMoon.tsx` | 6 | SVG gradients, glows |
| `/prototypes/orbital-zen-next/app/components/focus-mode/FocusModeSky.tsx` | 4 | Radial gradients |
| `/prototypes/orbital-zen-next/app/components/SubtaskMoons.tsx` | 2 | Radial gradient |
| `/prototypes/orbital-zen-next/app/components/markers/FoggyRingMarker.tsx` | 3 | Celebration glow effects |
| `/prototypes/orbital-zen-next/app/components/TimerBadge.tsx` | 4 | Gradient, shadow, border |
| `/prototypes/task-copilot/components/StagingToast.tsx` | 1 | Shadow |
| `/prototypes/task-copilot/components/task-detail/TaskDetail.tsx` | 1 | Shadow |

### CSS Files with Hardcoded Colors

| File Path | Count | Values |
|-----------|-------|--------|
| `/prototypes/task-copilot/app/globals.css` | 8 | `#d1d5db`, `#9ca3af`, `#4b5563`, `#6b7280`, `#52525b`, `#ddd6fe`, `#a1a1aa`, `#ede9fe`, `#71717a` (shimmer animation, scrollbars) |
| `/prototypes/orbital-zen-next/app/globals.css` | 12 | `#0a0a0a`, `#ededed`, `#0f0f23`, `#1a1a2e`, `#16213e`, rgba values in gradients/shadows |

### packages/design-system (Expected - Token Definitions)

| File Path | Count | Notes |
|-----------|-------|-------|
| `/packages/design-system/foundations/primitives/colors.ts` | 60+ | **Expected:** Primitive color palette definitions |
| `/packages/design-system/foundations/colors.ts` | 10+ | **Expected:** Light/dark semantic mappings |
| `/packages/design-system/styles/tokens.css` | 100+ | **Expected:** CSS custom property definitions |
| `/packages/design-system/.storybook/manager.ts` | 12 | Storybook theme configuration |

---

## Summary

### Total Migration Effort

| Metric | Value |
|--------|-------|
| **Total files needing migration** | ~100 |
| **Total raw color class replacements** | ~2,076 |
| **Total inline/JS color replacements** | ~145 |
| **Estimated total replacements** | ~2,221 |

### Breakdown by Feature Area

| Feature Area | Files | Raw Colors | Inline Colors | Priority |
|--------------|-------|------------|---------------|----------|
| **Task Detail** | 5 | 198 | 2 | P0 (high usage) |
| **AI Components (MiniBar, Palette, Drawer)** | 12 | 287 | 0 | P0 (core feature) |
| **Focus Mode** | 3 | 62 | 1 | P1 |
| **Queue / Task Cards** | 8 | 112 | 3 | P1 |
| **Layout / Chrome (Sidebar, Header, Tabs)** | 5 | 78 | 4 | P1 |
| **Dashboard / Task List** | 6 | 86 | 0 | P1 |
| **Shared Components (Pickers, Modals, Pills)** | 22 | 246 | 8 | P1 |
| **Inbox / Pool Views** | 4 | 48 | 0 | P2 |
| **Search** | 1 | 38 | 0 | P2 |
| **Projects** | 1 | 25 | 0 | P2 |
| **Routines** | 4 | 62 | 1 | P2 |
| **Notifications** | 4 | 62 | 0 | P2 |
| **orbital-zen-next (Prototype)** | 12 | 198 | 80+ | P3 (experimental) |
| **ai-minibar (Prototype)** | 10 | 132 | 5 | P3 (experimental) |
| **Lib/Utils** | 3 | 43 | 19 | P2 |

### Top 10 Most-Used Raw Color Classes

These indicate which semantic tokens may be missing or need better coverage:

| Rank | Class Pattern | Count | Suggested Semantic Token |
|------|---------------|-------|--------------------------|
| 1 | `bg-zinc-100` / `dark:bg-zinc-700` | 89 | `bg-bg-neutral-subtle` (exists) |
| 2 | `text-zinc-400` / `dark:text-zinc-500` | 72 | `text-fg-neutral-soft` (exists) |
| 3 | `bg-violet-600` | 58 | `bg-accent-primary` (need to add) |
| 4 | `text-violet-600` / `dark:text-violet-400` | 45 | `text-fg-accent-primary` (exists) |
| 5 | `bg-white` / `dark:bg-zinc-800` | 44 | `bg-bg-neutral-min` (exists) |
| 6 | `text-zinc-500` | 38 | `text-fg-neutral-tertiary` (need to add) |
| 7 | `bg-green-100` / `dark:bg-green-900` | 36 | `bg-status-completed-subtle` (exists) |
| 8 | `text-green-600` / `dark:text-green-400` | 34 | `text-status-completed` (exists) |
| 9 | `border-zinc-200` / `dark:border-zinc-700` | 31 | `border-border-color-neutral` (exists) |
| 10 | `bg-blue-100` / `dark:bg-blue-900` | 28 | `bg-status-ready-subtle` (exists) |

### Missing/Needed Semantic Tokens

Based on usage patterns, consider adding:

1. **`bg-accent-primary`** - For violet-600 button/action backgrounds
2. **`text-fg-neutral-tertiary`** - For zinc-500 tertiary text
3. **`bg-interactive-hover`** - For zinc-200/dark:zinc-700 hover states
4. **`bg-interactive-active`** - For pressed/active states
5. **`text-link`** - For blue-600/blue-400 link text
6. **`ring-focus`** - For blue-500 focus ring color

### Recommended Migration Order

1. **Phase 1 (P0):** Task Detail + AI Components (highest visibility, most usage)
2. **Phase 2 (P1):** Layout chrome, Queue views, Focus mode
3. **Phase 3 (P1):** Shared components (pickers, modals, pills)
4. **Phase 4 (P2):** Dashboard, Search, Inbox/Pool, Notifications
5. **Phase 5 (P3):** Experimental prototypes (orbital-zen-next, ai-minibar)

---

*Generated by Claude Code - February 7, 2026*
