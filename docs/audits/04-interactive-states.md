# Interactive States Color Audit

**Date**: February 7, 2026
**Auditor**: Claude Code
**Scope**: All .tsx files in focus-tools

---

## Overview

This audit examines how interactive states (hover, focus, active, disabled) handle color throughout the codebase. The goal is to identify patterns, assess theme-safety, and recommend semantic tokens for interactive states.

---

## Hover States

### Summary
**Total hover color usages found: 538 instances across 51 files**

### Detailed Table

| File | Class | Semantic or Raw? | Current Value |
|------|-------|------------------|---------------|
| StagingArea.tsx | hover:bg-violet-100/50 | Raw | Violet background with 50% opacity |
| StagingArea.tsx | dark:hover:bg-violet-900/30 | Raw | Dark mode violet with 30% opacity |
| StagingArea.tsx | hover:bg-green-50 | Raw | Light green background |
| StagingArea.tsx | dark:hover:bg-green-900/20 | Raw | Dark mode green with 20% opacity |
| StagingArea.tsx | hover:bg-neutral-100 | Raw | Neutral gray background |
| StagingArea.tsx | dark:hover:bg-neutral-700 | Raw | Dark mode neutral |
| StagingArea.tsx | hover:bg-red-50 | Raw | Light red background |
| StagingArea.tsx | dark:hover:bg-red-900/20 | Raw | Dark mode red with 20% opacity |
| StagingArea.tsx | hover:bg-violet-700 | Raw | Darker violet for button hover |
| StagingArea.tsx | hover:text-zinc-800 | Raw | Dark text on hover |
| StagingArea.tsx | dark:hover:text-zinc-200 | Raw | Light text on hover (dark mode) |
| StagingArea.tsx | hover:bg-black/5 | Raw | Subtle black overlay |
| StagingArea.tsx | dark:hover:bg-white/10 | Raw | Subtle white overlay (dark mode) |
| DoneTaskCard.tsx | hover:bg-violet-200 | Raw | Violet hover state |
| DoneTaskCard.tsx | dark:hover:bg-violet-900 | Raw | Dark mode violet hover |
| DoneTaskCard.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| TasksView.tsx | hover:text-fg-neutral-primary | Semantic | Uses semantic token |
| TasksView.tsx | hover:text-violet-700 | Raw | Violet text hover |
| TasksView.tsx | dark:hover:text-violet-300 | Raw | Light violet text (dark mode) |
| TasksView.tsx | hover:bg-zinc-200 | Raw | Zinc gray hover |
| TasksView.tsx | dark:hover:bg-zinc-700 | Raw | Dark mode zinc hover |
| InboxView.tsx | hover:bg-violet-200 | Raw | Violet hover |
| InboxView.tsx | dark:hover:bg-violet-800/40 | Raw | Dark mode violet with opacity |
| QuickCapture.tsx | hover:border-zinc-300 | Raw | Border color on hover |
| QuickCapture.tsx | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| QuickCapture.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| StagingToast.tsx | hover:bg-amber-100 | Raw | Amber hover |
| StagingToast.tsx | dark:hover:bg-amber-800/30 | Raw | Dark mode amber hover |
| StagingToast.tsx | hover:bg-green-700 | Raw | Green button hover |
| NotesModule.tsx | hover:bg-neutral-100 | Raw | Neutral hover |
| NotesModule.tsx | dark:hover:bg-neutral-800 | Raw | Dark mode neutral hover |
| NotesModule.tsx | hover:text-neutral-600 | Raw | Neutral text hover |
| NotesModule.tsx | dark:hover:text-neutral-300 | Raw | Dark mode text hover |
| SearchBar.tsx | hover:border-zinc-300 | Raw | Border hover |
| SearchBar.tsx | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| SearchBar.tsx | hover:bg-bg-neutral-subtle-hover | Semantic | Uses semantic token |
| SearchBar.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| TabCluster.tsx | hover:text-fg-neutral-primary | Semantic | Uses semantic token |
| Header.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| Header.tsx | hover:bg-violet-200 | Raw | Violet hover |
| Header.tsx | dark:hover:bg-violet-900/50 | Raw | Dark mode violet hover |
| Sidebar.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| Sidebar.tsx | group-hover:text-zinc-400 | Raw | Group hover text |
| Sidebar.tsx | dark:group-hover:text-zinc-500 | Raw | Dark mode group hover |
| Sidebar.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| Sidebar.tsx | hover:bg-zinc-200 | Raw | Zinc hover |
| Sidebar.tsx | dark:hover:bg-zinc-700 | Raw | Dark mode zinc hover |
| ProjectsView.tsx | hover:text-zinc-900 | Raw | Dark text hover |
| ProjectsView.tsx | dark:hover:text-zinc-100 | Raw | Light text hover (dark mode) |
| ProjectsView.tsx | hover:bg-violet-200 | Raw | Violet hover |
| ProjectsView.tsx | dark:hover:bg-violet-900 | Raw | Dark mode violet hover |
| ProjectsView.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| ProjectsView.tsx | hover:bg-violet-50 | Raw | Light violet hover |
| ProjectsView.tsx | dark:hover:bg-violet-900/20 | Raw | Dark mode violet hover |
| ProjectsView.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| ProjectsView.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| TaskList.tsx | hover:bg-blue-50 | Raw | Blue hover |
| TaskList.tsx | dark:hover:bg-blue-900/20 | Raw | Dark mode blue hover |
| TaskCreationPopover.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| TaskCreationPopover.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| TaskCreationPopover.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| LeadTimePicker.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| LeadTimePicker.tsx | hover:border-zinc-300 | Raw | Border hover |
| LeadTimePicker.tsx | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| LeadTimePicker.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| ReadOnlyInfoPopover.tsx | hover:bg-zinc-50 | Raw | Light zinc hover |
| ReadOnlyInfoPopover.tsx | dark:hover:bg-zinc-700 | Raw | Dark mode zinc hover |
| StartPokePicker.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| StartPokePicker.tsx | hover:border-zinc-300 | Raw | Border hover |
| PriorityBreakdownDrawer.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| PriorityBreakdownDrawer.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| DurationPicker.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| DurationPicker.tsx | hover:border-zinc-300 | Raw | Border hover |
| DurationPicker.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| DurationPicker.tsx | hover:text-zinc-700 | Raw | Text hover |
| DurationPicker.tsx | dark:hover:text-zinc-200 | Raw | Dark mode text hover |
| FilterDrawer.tsx | hover:border-zinc-300 | Raw | Border hover |
| FilterDrawer.tsx | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| FilterDrawer.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| FilterDrawer.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| FilterDrawer.tsx | hover:bg-bg-neutral-subtle-hover | Semantic | Uses semantic token |
| FilterDrawer.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| EnergySelector.tsx | hover:border-zinc-300 | Raw | Border hover |
| EnergySelector.tsx | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| EnergySelector.tsx | hover:bg-zinc-50 | Raw | Light hover |
| EnergySelector.tsx | dark:hover:bg-zinc-800 | Raw | Dark mode hover |
| NotificationPermissionBanner.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| NotificationPermissionBanner.tsx | hover:text-violet-900 | Raw | Violet text hover |
| NotificationPermissionBanner.tsx | dark:hover:text-violet-100 | Raw | Dark mode text hover |
| NotificationPermissionBanner.tsx | hover:text-violet-600 | Raw | Violet text hover |
| NotificationPermissionBanner.tsx | dark:hover:text-violet-300 | Raw | Dark mode text hover |
| ImportancePicker.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| ImportancePicker.tsx | hover:border-zinc-300 | Raw | Border hover |
| ImportancePicker.tsx | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| ProjectModal.tsx | hover:border-zinc-400 | Raw | Border hover |
| ProjectModal.tsx | hover:scale-110 | N/A | Scale transform (not color) |
| ProjectModal.tsx | hover:bg-red-50 | Raw | Red hover |
| ProjectModal.tsx | dark:hover:bg-red-900/20 | Raw | Dark mode red hover |
| ProjectModal.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| ProjectModal.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| ProjectModal.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| ReminderPicker.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| ReminderPicker.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| ReminderPicker.tsx | hover:text-zinc-800 | Raw | Text hover |
| ReminderPicker.tsx | dark:hover:text-zinc-200 | Raw | Dark mode text hover |
| PriorityDisplay.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| AIDisclosure.tsx | hover:text-amber-700 | Raw | Amber text hover |
| AIDisclosure.tsx | dark:hover:text-amber-300 | Raw | Dark mode amber hover |
| AIDisclosure.tsx | hover:bg-blue-700 | Raw | Blue button hover |
| AIDisclosure.tsx | hover:bg-slate-200 | Raw | Slate hover |
| AIDisclosure.tsx | dark:hover:bg-slate-600 | Raw | Dark mode slate hover |
| TriageTaskCard.tsx | hover:bg-black/10 | Raw | Black overlay hover |
| TriageTaskCard.tsx | dark:hover:bg-white/20 | Raw | White overlay hover (dark mode) |
| TriageTaskCard.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| TriageTaskCard.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| DatePickerModal.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| DatePickerModal.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| DatePickerModal.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| HealthPill.tsx | hover:opacity-100 | N/A | Opacity modifier (theme-safe) |
| AIFeedback.tsx | hover:bg-green-100 | Raw | Green hover |
| AIFeedback.tsx | dark:hover:bg-green-900/30 | Raw | Dark mode green hover |
| AIFeedback.tsx | hover:text-green-600 | Raw | Green text hover |
| AIFeedback.tsx | dark:hover:text-green-400 | Raw | Dark mode green text |
| AIFeedback.tsx | hover:bg-red-100 | Raw | Red hover |
| AIFeedback.tsx | dark:hover:bg-red-900/30 | Raw | Dark mode red hover |
| AIFeedback.tsx | hover:text-red-600 | Raw | Red text hover |
| AIFeedback.tsx | dark:hover:text-red-400 | Raw | Dark mode red text |
| AIFeedback.tsx | hover:bg-slate-100 | Raw | Slate hover |
| AIFeedback.tsx | dark:hover:bg-slate-700 | Raw | Dark mode slate hover |
| AIFeedback.tsx | hover:text-slate-600 | Raw | Slate text hover |
| AIFeedback.tsx | dark:hover:text-slate-300 | Raw | Dark mode slate text |
| AIFeedback.tsx | hover:border-slate-300 | Raw | Border hover |
| AIFeedback.tsx | hover:bg-blue-700 | Raw | Blue button hover |
| AIFeedback.tsx | hover:text-slate-700 | Raw | Slate text hover |
| AIFeedback.tsx | dark:hover:text-slate-300 | Raw | Dark mode slate text |
| FocusSelectionModal.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| FocusSelectionModal.tsx | hover:bg-bg-neutral-subtle-hover | Semantic | Uses semantic token |
| EnergyTypePicker.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| EnergyTypePicker.tsx | hover:border-zinc-300 | Raw | Border hover |
| EnergyTypePicker.tsx | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| DurationInput.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| DurationInput.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| DetailsPill.tsx | hover:bg-zinc-200 | Raw | Zinc hover |
| DetailsPill.tsx | dark:hover:bg-zinc-700 | Raw | Dark mode zinc hover |
| DetailsPill.tsx | hover:border-zinc-300 | Raw | Border hover |
| DetailsPill.tsx | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| DetailsPill.tsx | hover:bg-zinc-300 | Raw | Darker zinc hover |
| DetailsPill.tsx | dark:hover:bg-zinc-600 | Raw | Dark mode darker zinc |
| RecurrenceFields.tsx | hover:bg-zinc-200 | Raw | Zinc hover |
| RecurrenceFields.tsx | dark:hover:bg-zinc-700 | Raw | Dark mode zinc hover |
| RecurrenceFields.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| StatusModule.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| TaskDetail.tsx | hover:text-violet-600 | Raw | Violet text hover |
| TaskDetail.tsx | dark:hover:text-violet-400 | Raw | Dark mode violet text |
| TaskDetail.tsx | hover:bg-bg-neutral-subtle-hover | Semantic | Uses semantic token |
| TaskDetail.tsx | hover:bg-amber-200 | Raw | Amber hover |
| TaskDetail.tsx | dark:hover:bg-amber-800/40 | Raw | Dark mode amber hover |
| TaskDetail.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| TaskDetail.tsx | hover:bg-green-200 | Raw | Green hover |
| TaskDetail.tsx | dark:hover:bg-green-800/40 | Raw | Dark mode green hover |
| TaskDetail.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| TaskDetail.tsx | hover:opacity-80 | N/A | Opacity modifier (theme-safe) |
| TaskDetail.tsx | hover:bg-zinc-50 | Raw | Light zinc hover |
| TaskDetail.tsx | dark:hover:bg-zinc-700 | Raw | Dark mode zinc hover |
| TaskDetail.tsx | hover:border-zinc-300 | Raw | Border hover |
| TaskDetail.tsx | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| TaskDetail.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| TaskDetail.tsx | hover:text-violet-700 | Raw | Violet text hover |
| TaskDetail.tsx | dark:hover:text-violet-300 | Raw | Dark mode violet text |
| TaskDetail.tsx | hover:underline | N/A | Text decoration (not color) |
| TaskDetail.tsx | hover:text-amber-700 | Raw | Amber text hover |
| TaskDetail.tsx | dark:hover:text-amber-300 | Raw | Dark mode amber text |
| TaskDetail.tsx | group-hover:text-zinc-600 | Raw | Group hover text |
| TaskDetail.tsx | dark:group-hover:text-zinc-300 | Raw | Dark mode group hover |
| TaskDetail.tsx | hover:border-violet-300 | Raw | Violet border hover |
| TaskDetail.tsx | dark:hover:border-violet-700 | Raw | Dark mode violet border |
| TaskDetail.tsx | hover:border-violet-400 | Raw | Violet border hover |
| TaskDetail.tsx | hover:text-red-600 | Raw | Red text hover |
| TaskDetail.tsx | dark:hover:text-red-400 | Raw | Dark mode red text |
| TaskDetail.tsx | hover:text-zinc-800 | Raw | Dark text hover |
| TaskDetail.tsx | dark:hover:text-zinc-200 | Raw | Light text hover |
| TaskDetail.tsx | hover:text-violet-500 | Raw | Violet text hover |
| TaskDetail.tsx | dark:hover:text-violet-400 | Raw | Dark mode violet text |
| TaskDetail.tsx | hover:text-violet-600 | Raw | Violet text hover |
| TaskDetail.tsx | hover:bg-violet-50 | Raw | Light violet hover |
| TaskDetail.tsx | dark:hover:bg-violet-900/20 | Raw | Dark mode violet hover |
| TaskDetail.tsx | hover:bg-violet-100 | Raw | Violet hover |
| TaskDetail.tsx | dark:hover:bg-violet-900/30 | Raw | Dark mode violet hover |
| TaskDetail.tsx | hover:bg-red-50 | Raw | Red hover |
| TaskDetail.tsx | dark:hover:bg-red-900/20 | Raw | Dark mode red hover |
| DetailsSection.tsx | group-hover:text-zinc-600 | Raw | Group hover text |
| DetailsSection.tsx | dark:group-hover:text-zinc-400 | Raw | Dark mode group hover |
| DetailsSection.tsx | group-hover:text-zinc-600 | Raw | Group hover text |
| DetailsSection.tsx | dark:group-hover:text-zinc-300 | Raw | Dark mode group hover |
| DetailsSection.tsx | hover:bg-zinc-50 | Raw | Light zinc hover |
| DetailsSection.tsx | dark:hover:bg-zinc-700 | Raw | Dark mode zinc hover |
| DetailsSection.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| DetailsSection.tsx | hover:bg-bg-neutral-subtle-hover | Semantic | Uses semantic token |
| DetailsSection.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| StartPokeField.tsx | hover:border-zinc-300 | Raw | Border hover |
| StartPokeField.tsx | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| StartPokeField.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| SearchView.tsx | hover:border-zinc-300 | Raw | Border hover |
| SearchView.tsx | dark:hover:border-zinc-700 | Raw | Dark mode border hover |
| TaskSection.tsx | hover:bg-neutral-100 | Raw | Neutral hover |
| TaskSection.tsx | dark:hover:bg-neutral-800 | Raw | Dark mode neutral hover |
| TaskRow.tsx | hover:border-zinc-300 | Raw | Border hover |
| TaskRow.tsx | dark:hover:border-zinc-700 | Raw | Dark mode border hover |
| TaskRow.tsx | group-hover:opacity-100 | N/A | Opacity modifier (theme-safe) |
| TaskRow.tsx | hover:text-blue-600 | Raw | Blue text hover |
| TaskRow.tsx | dark:hover:text-blue-400 | Raw | Dark mode blue text |
| TaskRow.tsx | hover:bg-blue-50 | Raw | Blue hover |
| TaskRow.tsx | dark:hover:bg-blue-900/20 | Raw | Dark mode blue hover |
| dashboard/QuickCapture.tsx | hover:bg-blue-700 | Raw | Blue button hover |
| HistoryModal.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| HistoryModal.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| HistoryModal.tsx | hover:bg-green-700 | Raw | Green button hover |
| HistoryModal.tsx | hover:bg-bg-neutral-subtle-hover | Semantic | Uses semantic token |
| TaskItem.tsx | hover:border-neutral-400 | Raw | Border hover |
| TaskItem.tsx | dark:hover:border-neutral-500 | Raw | Dark mode border hover |
| TaskItem.tsx | hover:bg-neutral-100 | Raw | Neutral hover |
| TaskItem.tsx | dark:hover:bg-neutral-800 | Raw | Dark mode neutral hover |
| TaskItem.tsx | hover:text-blue-600 | Raw | Blue text hover |
| TaskItem.tsx | dark:hover:text-blue-300 | Raw | Dark mode blue text |
| TaskItem.tsx | hover:bg-blue-50 | Raw | Blue hover |
| TaskItem.tsx | dark:hover:bg-blue-900/20 | Raw | Dark mode blue hover |
| TaskItem.tsx | hover:text-neutral-600 | Raw | Neutral text hover |
| TaskItem.tsx | dark:hover:text-neutral-300 | Raw | Dark mode neutral text |
| TaskItem.tsx | hover:bg-red-50 | Raw | Red hover |
| TaskItem.tsx | dark:hover:bg-red-900/20 | Raw | Dark mode red hover |
| FocusModeView.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| FocusModeView.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| FocusModeView.tsx | hover:bg-green-700 | Raw | Green button hover |
| FocusModeView.tsx | hover:border-violet-400 | Raw | Violet border hover |
| FocusModeView.tsx | group-hover:opacity-100 | N/A | Opacity modifier (theme-safe) |
| FocusModeView.tsx | hover:text-red-500 | Raw | Red text hover |
| FocusModeView.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| FocusModeView.tsx | hover:bg-bg-neutral-subtle-hover | Semantic | Uses semantic token |
| FocusModeView.tsx | hover:bg-zinc-50 | Raw | Light zinc hover |
| FocusModeView.tsx | dark:hover:bg-zinc-700 | Raw | Dark mode zinc hover |
| QueueView.tsx | hover:bg-violet-200 | Raw | Violet hover |
| QueueView.tsx | dark:hover:bg-violet-800/40 | Raw | Dark mode violet hover |
| QueueView.tsx | hover:bg-bg-neutral-subtle-hover | Semantic | Uses semantic token |
| QueueView.tsx | group-hover:opacity-100 | N/A | Opacity modifier (theme-safe) |
| QueueView.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| QueueView.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| QueueTaskCard.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| QueueTaskCard.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| CompletedDrawer.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| CompletedDrawer.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| CompletedDrawer.tsx | hover:bg-zinc-50 | Raw | Light zinc hover |
| CompletedDrawer.tsx | dark:hover:bg-zinc-700/50 | Raw | Dark mode zinc hover |
| DailySummaryBanner.tsx | hover:shadow-lg | N/A | Shadow modifier (not color) |
| AIDrawer.tsx | hover:text-zinc-800 | Raw | Dark text hover |
| AIDrawer.tsx | dark:hover:text-zinc-200 | Raw | Light text hover |
| AIDrawer.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| AIDrawer.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| MiniBarContent.tsx | hover:bg-violet-200 | Raw | Violet hover |
| MiniBarContent.tsx | dark:hover:bg-violet-800/50 | Raw | Dark mode violet hover |
| MiniBarContent.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| MiniBarContent.tsx | hover:bg-amber-200 | Raw | Amber hover |
| MiniBarContent.tsx | dark:hover:bg-amber-800/50 | Raw | Dark mode amber hover |
| QuickActions.tsx (task-copilot) | hover:bg-violet-200 | Raw | Violet hover |
| QuickActions.tsx (task-copilot) | dark:hover:bg-violet-800/60 | Raw | Dark mode violet hover |
| PaletteContent.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| PaletteContent.tsx | hover:bg-zinc-900/20 | Raw | Black overlay hover |
| PaletteContent.tsx | dark:hover:bg-white/20 | Raw | White overlay hover |
| PaletteContent.tsx | hover:bg-violet-700 | Raw | Violet button hover |
| PaletteContent.tsx | hover:bg-zinc-50 | Raw | Light zinc hover |
| PaletteContent.tsx | dark:hover:bg-zinc-800 | Raw | Dark mode zinc hover |
| PaletteContent.tsx | hover:bg-violet-200 | Raw | Violet hover |
| PaletteContent.tsx | dark:hover:bg-violet-800/40 | Raw | Dark mode violet hover |
| PaletteContent.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| PoolTaskCard.tsx | group-hover:opacity-100 | N/A | Opacity modifier (theme-safe) |
| PoolTaskCard.tsx | hover:bg-violet-200 | Raw | Violet hover |
| PoolTaskCard.tsx | dark:hover:bg-violet-900/50 | Raw | Dark mode violet hover |
| PoolTaskCard.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| PoolTaskCard.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| PriorityQueueModule.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| PriorityQueueModule.tsx | hover:border-zinc-300 | Raw | Border hover |
| PriorityQueueModule.tsx | dark:hover:border-zinc-700 | Raw | Dark mode border hover |
| NotificationSettings.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| NotificationCard.tsx | hover:bg-zinc-900/20 | Raw | Black overlay hover |
| NotificationCard.tsx | dark:hover:bg-white/20 | Raw | White overlay hover |
| StuckMenu.tsx | hover:bg-neutral-100 | Raw | Neutral hover |
| StuckMenu.tsx | dark:hover:bg-neutral-700 | Raw | Dark mode neutral hover |
| SolarSystemView.tsx | hover:scale-105 | N/A | Scale transform (not color) |
| OrbitalView.tsx | hover:text-white | Raw | White text hover |
| OrbitalView.tsx | hover:border-gray-500 | Raw | Gray border hover |
| AIPanel.tsx (orbital-zen) | hover:text-gray-700 | Raw | Gray text hover |
| AIPanel.tsx (orbital-zen) | hover:text-gray-600 | Raw | Gray text hover |
| AIPanel.tsx (orbital-zen) | hover:text-gray-800 | Raw | Dark gray text hover |
| AIPanel.tsx (orbital-zen) | hover:text-gray-900 | Raw | Darkest gray text hover |
| AIPanel.tsx (orbital-zen) | hover:text-red-600 | Raw | Red text hover |
| AIPanel.tsx (orbital-zen) | group-hover:opacity-100 | N/A | Opacity modifier (theme-safe) |
| AIPanel.tsx (orbital-zen) | hover:bg-gray-200 | Raw | Gray hover |
| AIPanel.tsx (orbital-zen) | hover:bg-gray-800 | Raw | Dark gray hover |
| TaskNode.tsx | hover:bg-red-900/30 | Raw | Red hover |
| TaskNode.tsx | hover:border-red-400/40 | Raw | Red border hover |
| TaskNode.tsx | hover:shadow-red-600/40 | Raw | Red shadow hover |
| TaskNode.tsx | hover:text-red-200 | Raw | Red text hover |
| TaskNode.tsx | hover:bg-orange-900/30 | Raw | Orange hover |
| TaskNode.tsx | hover:border-orange-400/40 | Raw | Orange border hover |
| TaskNode.tsx | hover:shadow-orange-600/40 | Raw | Orange shadow hover |
| TaskNode.tsx | hover:text-orange-200 | Raw | Orange text hover |
| TaskNode.tsx | hover:bg-yellow-900/30 | Raw | Yellow hover |
| TaskNode.tsx | hover:border-yellow-400/40 | Raw | Yellow border hover |
| TaskNode.tsx | hover:shadow-yellow-600/40 | Raw | Yellow shadow hover |
| TaskNode.tsx | hover:text-yellow-200 | Raw | Yellow text hover |
| TaskNode.tsx | hover:bg-blue-900/30 | Raw | Blue hover |
| TaskNode.tsx | hover:border-blue-400/40 | Raw | Blue border hover |
| TaskNode.tsx | hover:shadow-blue-600/40 | Raw | Blue shadow hover |
| TaskNode.tsx | hover:text-blue-200 | Raw | Blue text hover |
| AIDrawer.tsx (orbital-zen) | hover:opacity-80 | N/A | Opacity modifier (theme-safe) |
| AIDrawer.tsx (orbital-zen) | hover:bg-white/5 | Raw | White overlay hover |
| AIDrawer.tsx (orbital-zen) | hover:bg-black/40 | Raw | Black overlay hover |
| AIDrawer.tsx (orbital-zen) | hover:border-white/30 | Raw | White border hover |
| AIDrawer.tsx (orbital-zen) | hover:bg-white/10 | Raw | White overlay hover |
| AIDrawer.tsx (orbital-zen) | hover:text-purple-100 | Raw | Purple text hover |
| AIDrawer.tsx (orbital-zen) | hover:border-purple-300 | Raw | Purple border hover |
| FocusModeTopNav.tsx | hover:text-white | Raw | White text hover |
| FocusModeTopNav.tsx | hover:border-gray-500 | Raw | Gray border hover |
| FocusModeTopNav.tsx | hover:text-purple-100 | Raw | Purple text hover |
| FocusModeTopNav.tsx | hover:border-purple-300 | Raw | Purple border hover |
| ErrorBoundary.tsx | hover:bg-red-700 | Raw | Red button hover |
| ErrorBoundary.tsx | hover:bg-gray-700 | Raw | Gray button hover |
| ErrorBoundary.tsx | hover:text-red-800 | Raw | Red text hover |
| page.tsx (orbital-zen) | hover:bg-purple-700 | Raw | Purple button hover |
| ResponseTriggers.tsx | hover:bg-zinc-200 | Raw | Zinc hover |
| ResponseTriggers.tsx | dark:hover:bg-zinc-700 | Raw | Dark mode zinc hover |
| ResponseTriggers.tsx | hover:bg-violet-200 | Raw | Violet hover |
| ResponseTriggers.tsx | dark:hover:bg-violet-800/50 | Raw | Dark mode violet hover |
| ResponseTriggers.tsx | hover:bg-blue-200 | Raw | Blue hover |
| ResponseTriggers.tsx | dark:hover:bg-blue-800/50 | Raw | Dark mode blue hover |
| ResponseTriggers.tsx | hover:bg-green-200 | Raw | Green hover |
| ResponseTriggers.tsx | dark:hover:bg-green-800/50 | Raw | Dark mode green hover |
| ResponseTriggers.tsx | hover:bg-yellow-200 | Raw | Yellow hover |
| ResponseTriggers.tsx | dark:hover:bg-yellow-800/50 | Raw | Dark mode yellow hover |
| ResponseTriggers.tsx | hover:bg-red-200 | Raw | Red hover |
| ResponseTriggers.tsx | dark:hover:bg-red-800/50 | Raw | Dark mode red hover |
| DemoShell.tsx | hover:text-zinc-600 | Raw | Zinc text hover |
| DemoShell.tsx | dark:hover:text-zinc-400 | Raw | Dark mode zinc text hover |
| Palette.tsx (ai-minibar) | hover:bg-violet-700 | Raw | Violet button hover |
| Palette.tsx (ai-minibar) | hover:text-zinc-400 | Raw | Zinc text hover |
| Drawer.tsx (ai-minibar) | hover:text-zinc-800 | Raw | Dark text hover |
| Drawer.tsx (ai-minibar) | dark:hover:text-zinc-200 | Raw | Light text hover |
| Drawer.tsx (ai-minibar) | hover:bg-zinc-100 | Raw | Zinc hover |
| Drawer.tsx (ai-minibar) | dark:hover:bg-zinc-800 | Raw | Dark mode zinc hover |
| Drawer.tsx (ai-minibar) | hover:bg-violet-700 | Raw | Violet button hover |
| ResponseDisplay.tsx | hover:bg-violet-500 | Raw | Violet hover |
| ResponseDisplay.tsx | hover:bg-zinc-300 | Raw | Zinc hover |
| ResponseDisplay.tsx | dark:hover:bg-zinc-600 | Raw | Dark mode zinc hover |
| ResponseDisplay.tsx | hover:text-zinc-600 | Raw | Zinc text hover |
| ResponseDisplay.tsx | dark:hover:text-zinc-300 | Raw | Dark mode zinc text |
| ResponseDisplay.tsx | hover:bg-zinc-100 | Raw | Zinc hover |
| ResponseDisplay.tsx | dark:hover:bg-zinc-800 | Raw | Dark mode zinc hover |
| ResponseDisplay.tsx | hover:text-fg-neutral-secondary | Semantic | Uses semantic token |
| ResponseDisplay.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| QuickActions.tsx (ai-minibar) | hover:bg-zinc-200 | Raw | Zinc hover |
| QuickActions.tsx (ai-minibar) | dark:hover:bg-zinc-700 | Raw | Dark mode zinc hover |
| QuickActions.tsx (ai-minibar) | hover:border-zinc-400 | Raw | Border hover |
| QuickActions.tsx (ai-minibar) | dark:hover:border-zinc-600 | Raw | Dark mode border hover |
| Toast.stories.tsx | hover:bg-bg-neutral-low | Semantic | Uses semantic token |
| Toast.stories.tsx | hover:bg-bg-positive-low | Semantic | Uses semantic token |
| Toast.stories.tsx | hover:bg-bg-attention-low | Semantic | Uses semantic token |
| Toast.stories.tsx | hover:bg-bg-alert-low | Semantic | Uses semantic token |
| Toast.tsx | hover:opacity-100 | N/A | Opacity modifier (theme-safe) |
| Toast.tsx | hover:bg-white/30 | Raw | White overlay hover |
| Pill.tsx | hover:opacity-80 | N/A | Opacity modifier (theme-safe) |
| ProgressRing.stories.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| SegmentedControl.tsx | hover:text-fg-neutral-primary | Semantic | Uses semantic token |
| BottomSheet.stories.tsx | hover:bg-bg-accent-high-accented | Semantic | Uses semantic token |
| BottomSheet.stories.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| ActionableCard.stories.tsx | hover:bg-bg-accent-low | Semantic | Uses semantic token |
| ActionableCard.stories.tsx | hover:bg-bg-transparent-medium | Semantic | Uses semantic token |
| ActionableCard.stories.tsx | hover:text-fg-neutral-primary | Semantic | Uses semantic token |
| ActionableCard.stories.tsx | hover:bg-bg-transparent-low | Semantic | Uses semantic token |
| RightDrawer.stories.tsx | hover:bg-bg-accent-high-accented | Semantic | Uses semantic token |
| RightDrawer.stories.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| ResponsiveDrawer.stories.tsx | hover:bg-bg-accent-high-accented | Semantic | Uses semantic token |
| ResponsiveDrawer.stories.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| Colors.stories.tsx | hover:bg-bg-accent-high-accented | Semantic | Uses semantic token |
| Colors.stories.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| Elevation.stories.tsx | hover:bg-bg-neutral-subtle | Semantic | Uses semantic token |
| Elevation.stories.tsx | hover:bg-bg-alert-subtle | Semantic | Uses semantic token |
| Elevation.stories.tsx | hover:bg-bg-alert-high-accented | Semantic | Uses semantic token |
| GlassEffects.stories.tsx | hover:bg-zinc-200/50 | Raw | Zinc with opacity hover |

---

## Focus / Focus-Visible States

### Summary
**Total focus color usages found: 55 instances**

Note: No `focus-visible:` prefixed classes were found in the codebase.

### Detailed Table

| File | Class | Semantic or Raw? | Current Value |
|------|-------|------------------|---------------|
| QuickCapture.tsx | focus:outline-none | N/A | Removes outline |
| NotesModule.tsx | focus:ring-2 focus:ring-violet-500 | Raw | Violet ring |
| NotesModule.tsx | focus:border-transparent | Raw | Transparent border |
| NotesModule.tsx | focus:ring-0 | N/A | Removes ring |
| SearchBar.tsx | focus:outline-none | N/A | Removes outline |
| SearchBar.tsx | focus:border-blue-500 | Raw | Blue border |
| SearchBar.tsx | focus:ring-1 focus:ring-blue-500 | Raw | Blue ring |
| Sidebar.tsx | focus:outline-none | N/A | Removes outline |
| Sidebar.tsx | focus:ring-2 focus:ring-violet-500 | Raw | Violet ring |
| TaskList.tsx | focus:ring-0 | N/A | Removes ring |
| TaskCreationPopover.tsx | focus:outline-none | N/A | Removes outline |
| TaskCreationPopover.tsx | focus:ring-2 focus:ring-violet-500 | Raw | Violet ring |
| ProjectModal.tsx | focus:outline-none | N/A | Removes outline |
| ProjectModal.tsx | focus:ring-2 focus:ring-violet-500 | Raw | Violet ring |
| DatePickerModal.tsx | focus:outline-none | N/A | Removes outline |
| DatePickerModal.tsx | focus:ring-2 focus:ring-violet-500 | Raw | Violet ring |
| AIFeedback.tsx | focus:outline-none | N/A | Removes outline |
| AIFeedback.tsx | focus:ring-2 focus:ring-blue-500 | Raw | Blue ring |
| AIFeedback.tsx | focus:border-transparent | Raw | Transparent border |
| DurationInput.tsx | focus:outline-none | N/A | Removes outline |
| DurationInput.tsx | focus:ring-2 focus:ring-violet-500 | Raw | Violet ring |
| RecurrenceFields.tsx | focus:ring-2 focus:ring-violet-500 | Raw | Violet ring |
| RecurrenceFields.tsx | focus:border-transparent | Raw | Transparent border |
| RecurrenceFields.tsx | focus:ring-violet-500 | Raw | Violet ring (checkbox) |
| TaskDetail.tsx | focus:outline-none | N/A | Removes outline |
| TaskDetail.tsx | focus:ring-2 focus:ring-violet-500 | Raw | Violet ring |
| TaskDetail.tsx | focus:ring-1 focus:ring-violet-500 | Raw | Violet ring (smaller) |
| StartPokeField.tsx | focus:outline-none | N/A | Removes outline |
| StartPokeField.tsx | focus:ring-2 focus:ring-violet-500 | Raw | Violet ring |
| TaskItem.tsx | focus:opacity-100 | N/A | Opacity modifier |
| FocusModeView.tsx | focus:outline-none | N/A | Removes outline |
| PoolView.tsx | focus:outline-none | N/A | Removes outline |
| PoolView.tsx | focus:ring-2 focus:ring-violet-500 | Raw | Violet ring |
| NotificationSettings.tsx | focus:outline-none | N/A | Removes outline |
| NotificationSettings.tsx | focus:ring-0 | N/A | Removes ring |
| AIPanel.tsx (orbital-zen) | focus:ring-gray-400 | Raw | Gray ring (checkbox) |
| AIDrawer.tsx (orbital-zen) | focus:bg-black/40 | Raw | Black background on focus |
| AIDrawer.tsx (orbital-zen) | focus:border-white/30 | Raw | White border on focus |
| AIDrawer.tsx (orbital-zen) | focus:outline-none | N/A | Removes outline |
| FocusModeSky.tsx | focus:bg-black/40 | Raw | Black background on focus |
| FocusModeSky.tsx | focus:border-white/30 | Raw | White border on focus |
| FocusModeSky.tsx | focus:outline-none | N/A | Removes outline |
| DemoShell.tsx | focus:outline-none | N/A | Removes outline |
| DemoShell.tsx | focus:border-violet-600 | Raw | Violet border |

### Ring Color Classes (Non-focus prefixed)

| File | Class | Semantic or Raw? | Current Value |
|------|-------|------------------|---------------|
| SearchBar.tsx | ring-1 ring-blue-500 | Raw | Blue ring (active state) |
| ProjectModal.tsx | ring-2 ring-violet-500/30 | Raw | Violet ring with opacity |
| TaskDetail.tsx | ring-2 ring-violet-400/30 | Raw | Violet ring with opacity |
| HistoryModal.tsx | ring-2 ring-violet-500 ring-offset-2 | Raw | Violet ring with offset |

---

## Active States

### Summary
**Total active color usages found: 6 instances**

### Detailed Table

| File | Class | Semantic or Raw? | Current Value |
|------|-------|------------------|---------------|
| DetailsPill.tsx | active:scale-95 | N/A | Scale transform (not color) |
| QueueView.tsx | active:cursor-grabbing | N/A | Cursor style (not color) |
| QueueTaskCard.tsx | active:cursor-grabbing | N/A | Cursor style (not color) |
| Palette.tsx (ai-minibar) | active:cursor-grabbing | N/A | Cursor style (not color) |
| MiniBar.tsx | active:bg-zinc-800/80 | Raw | Zinc background with opacity |
| Pill.tsx | active:scale-95 | N/A | Scale transform (not color) |

### Analysis
Very few active states use color. Most active states use transforms (scale) or cursor changes. Only 1 instance uses a color class (`active:bg-zinc-800/80`).

---

## Disabled States

### Summary
**Total disabled color usages found: 48 instances across 14 files**

### Detailed Table

| File | Class | Semantic or Raw? | Current Value |
|------|-------|------------------|---------------|
| TaskCreationPopover.tsx | disabled:opacity-50 | Opacity | 50% opacity |
| TaskCreationPopover.tsx | disabled:cursor-not-allowed | N/A | Cursor style |
| LeadTimePicker.tsx | disabled:opacity-50 | Opacity | 50% opacity |
| LeadTimePicker.tsx | disabled:cursor-not-allowed | N/A | Cursor style |
| DurationPicker.tsx | disabled:opacity-50 | Opacity | 50% opacity |
| DurationPicker.tsx | disabled:cursor-not-allowed | N/A | Cursor style |
| NotificationPermissionBanner.tsx | disabled:opacity-50 | Opacity | 50% opacity |
| ProjectModal.tsx | disabled:opacity-50 | Opacity | 50% opacity |
| ProjectModal.tsx | disabled:cursor-not-allowed | N/A | Cursor style |
| DatePickerModal.tsx | disabled:opacity-50 | Opacity | 50% opacity |
| DatePickerModal.tsx | disabled:cursor-not-allowed | N/A | Cursor style |
| RecurrenceFields.tsx | disabled:opacity-50 | Opacity | 50% opacity |
| TaskDetail.tsx | disabled:bg-zinc-300 | Raw | Zinc background |
| TaskDetail.tsx | dark:disabled:bg-zinc-600 | Raw | Dark mode zinc background |
| TaskDetail.tsx | disabled:cursor-not-allowed | N/A | Cursor style |
| TaskDetail.tsx | disabled:opacity-40 | Opacity | 40% opacity |
| TaskItem.tsx | disabled:opacity-40 | Opacity | 40% opacity |
| TaskItem.tsx | disabled:cursor-not-allowed | N/A | Cursor style |
| QueueView.tsx | disabled:opacity-30 | Opacity | 30% opacity |
| QueueView.tsx | disabled:cursor-not-allowed | N/A | Cursor style |
| QueueTaskCard.tsx | disabled:opacity-40 | Opacity | 40% opacity |
| QueueTaskCard.tsx | disabled:cursor-not-allowed | N/A | Cursor style |
| AIDrawer.tsx (task-copilot) | disabled:opacity-50 | Opacity | 50% opacity |
| AIDrawer.tsx (task-copilot) | disabled:bg-zinc-400/30 | Raw | Zinc with opacity |
| AIDrawer.tsx (task-copilot) | dark:disabled:bg-zinc-600/30 | Raw | Dark mode zinc with opacity |
| AIDrawer.tsx (task-copilot) | disabled:cursor-not-allowed | N/A | Cursor style |
| PaletteContent.tsx (task-copilot) | disabled:opacity-50 | Opacity | 50% opacity |
| PaletteContent.tsx (task-copilot) | disabled:bg-zinc-400/30 | Raw | Zinc with opacity |
| PaletteContent.tsx (task-copilot) | dark:disabled:bg-zinc-600/30 | Raw | Dark mode zinc with opacity |
| PaletteContent.tsx (task-copilot) | disabled:cursor-not-allowed | N/A | Cursor style |
| AIPanel.tsx (orbital-zen) | disabled:text-gray-300 | Raw | Gray text |
| AIPanel.tsx (orbital-zen) | disabled:cursor-not-allowed | N/A | Cursor style |
| Palette.tsx (ai-minibar) | disabled:opacity-50 | Opacity | 50% opacity |
| Palette.tsx (ai-minibar) | disabled:bg-zinc-700 | Raw | Zinc background |
| Palette.tsx (ai-minibar) | disabled:cursor-not-allowed | N/A | Cursor style |
| Drawer.tsx (ai-minibar) | disabled:opacity-50 | Opacity | 50% opacity |
| Drawer.tsx (ai-minibar) | disabled:bg-zinc-300 | Raw | Zinc background |
| Drawer.tsx (ai-minibar) | dark:disabled:bg-zinc-700 | Raw | Dark mode zinc background |
| Drawer.tsx (ai-minibar) | disabled:cursor-not-allowed | N/A | Cursor style |
| PaletteContent.tsx (ai-minibar) | disabled:opacity-50 | Opacity | 50% opacity |
| PaletteContent.tsx (ai-minibar) | disabled:bg-zinc-300 | Raw | Zinc background |
| PaletteContent.tsx (ai-minibar) | dark:disabled:bg-zinc-700 | Raw | Dark mode zinc background |
| PaletteContent.tsx (ai-minibar) | disabled:cursor-not-allowed | N/A | Cursor style |

---

## Summary

| State Type | Total Usages | Semantic Count | Raw Count | Opacity/Relative Count |
|------------|-------------|----------------|-----------|------------------------|
| hover      | 538         | ~75            | ~440      | ~23 (hover:opacity-*) |
| focus      | 55          | 0              | ~35       | ~20 (focus:outline-none, etc.) |
| active     | 6           | 0              | 1         | 0 |
| disabled   | 48          | 0              | ~12       | ~24 (disabled:opacity-*) |

**Notes:**
- Hover states: ~14% semantic, ~82% raw, ~4% opacity-based
- Focus states: 0% semantic, ~64% raw color, ~36% utility (outline-none, ring-0)
- Active states: Minimal color usage (mostly transforms)
- Disabled states: ~50% opacity-based (theme-safe), ~25% raw color, ~25% cursor-only

---

## Analysis

### Are interactive states theme-safe?

**Hover States:**
- **Mostly NOT theme-safe**: The vast majority (~82%) of hover states use hardcoded Tailwind color classes like `hover:bg-violet-700`, `hover:bg-zinc-200`, `hover:text-blue-600`, etc.
- **Semantic usage is growing**: About 75 instances use semantic tokens like `hover:bg-bg-neutral-subtle`, `hover:text-fg-neutral-primary`, and `hover:bg-bg-neutral-subtle-hover`
- **Opacity modifiers are theme-safe**: About 23 instances use `hover:opacity-*` which works with any base color
- **Overlay patterns are semi-theme-safe**: Classes like `hover:bg-black/5`, `hover:bg-white/10` work in both themes but are fragile

**Focus States:**
- **NOT theme-safe**: All focus ring colors are hardcoded (`focus:ring-violet-500`, `focus:ring-blue-500`)
- **Consistent pattern**: The codebase uses `focus:ring-2 focus:ring-violet-500` as a standard focus indicator
- **Blue used in some places**: AIFeedback.tsx and SearchBar.tsx use blue focus rings

**Active States:**
- **Minimal concern**: Only 1 color usage (`active:bg-zinc-800/80`)
- **Mostly transforms**: Active states primarily use `active:scale-95` which is theme-agnostic

**Disabled States:**
- **Partially theme-safe**: ~50% use opacity modifiers (`disabled:opacity-50`, `disabled:opacity-40`)
- **Raw colors need attention**: About 12 instances use hardcoded colors like `disabled:bg-zinc-300`, `disabled:text-gray-300`

### Patterns Identified

1. **Primary action hover**: `hover:bg-violet-700` (button darkening)
2. **Secondary action hover**: `hover:bg-bg-neutral-subtle` or `hover:bg-bg-neutral-subtle-hover` (semantic)
3. **Text hover**: `hover:text-fg-neutral-secondary` or raw colors like `hover:text-zinc-800`
4. **Border hover**: `hover:border-zinc-300` / `dark:hover:border-zinc-600`
5. **Focus ring**: `focus:ring-2 focus:ring-violet-500`
6. **Disabled pattern**: `disabled:opacity-50 disabled:cursor-not-allowed`

---

## Recommendations

### Recommended Interactive State Tokens

#### Background Hover Tokens

```css
/* Primary/Accent Hover */
--color-bg-accent-high-hover: /* For primary buttons */
--color-bg-accent-subtle-hover: /* For accent subtle elements */
--color-bg-accent-low-hover: /* For accent low elements */

/* Neutral Hover */
--color-bg-neutral-subtle-hover: /* Already exists, heavily used */
--color-bg-neutral-low-hover: /* For subtle hover on neutral backgrounds */
--color-bg-neutral-min-hover: /* For input fields hover */

/* Semantic Color Hover */
--color-bg-positive-subtle-hover: /* Green hover states */
--color-bg-attention-subtle-hover: /* Amber/yellow hover states */
--color-bg-alert-subtle-hover: /* Red hover states */

/* Overlay Hover */
--color-bg-overlay-hover: /* For transparent overlays */
```

#### Text Hover Tokens

```css
/* Already exists and should be used more */
--color-fg-neutral-primary-hover: /* For links and interactive text */
--color-fg-neutral-secondary-hover: /* For secondary text hover */

/* Accent Text Hover */
--color-fg-accent-primary-hover: /* For accent links */
```

#### Border Hover Tokens

```css
--color-border-neutral-hover: /* For input/card borders */
--color-border-accent-hover: /* For focus/active borders */
```

#### Focus Ring Tokens

```css
--color-ring-focus: /* Standard focus ring color */
--color-ring-focus-offset: /* Ring offset color if needed */
```

#### Disabled State Tokens

```css
--color-bg-disabled: /* Disabled background */
--color-fg-disabled: /* Disabled text */
--color-border-disabled: /* Disabled border */
--opacity-disabled: 0.5; /* Standard disabled opacity */
```

### Priority Actions

1. **HIGH: Create `--color-bg-accent-high-hover`**
   - Replace all `hover:bg-violet-700` usages (~40+ instances)
   - Critical for primary button consistency

2. **HIGH: Create `--color-ring-focus`**
   - Replace all `focus:ring-violet-500` and `focus:ring-blue-500` usages (~35 instances)
   - Ensures consistent focus indication across themes

3. **MEDIUM: Expand usage of `hover:bg-bg-neutral-subtle`**
   - Already exists and is used in ~75 places
   - Should replace raw `hover:bg-zinc-200` / `hover:bg-neutral-100` patterns

4. **MEDIUM: Create border hover tokens**
   - Many `hover:border-zinc-300` / `dark:hover:border-zinc-600` patterns
   - Should use `hover:border-border-color-neutral-hover`

5. **LOW: Standardize disabled patterns**
   - Prefer `disabled:opacity-50` over hardcoded background colors
   - Create tokens only if distinct disabled colors are needed

### Quick Wins

1. **Adopt opacity modifiers for simple hovers**: `hover:opacity-80` is theme-safe
2. **Use existing semantic tokens**: `hover:bg-bg-neutral-subtle` and `hover:text-fg-neutral-primary` are already available
3. **Standardize on violet for focus**: Keep `focus:ring-violet-500` pattern but tokenize it
4. **Use overlay patterns**: `hover:bg-black/5` / `dark:hover:bg-white/10` is a reasonable pattern for subtle hovers

---

## Files Requiring Most Attention

1. **TaskDetail.tsx** - Highest number of raw hover/focus classes (~80+ instances)
2. **AIPanel.tsx (orbital-zen)** - Uses gray color scale instead of zinc/neutral
3. **TaskNode.tsx** - Uses specialized color hover states for urgency levels
4. **AIFeedback.tsx** - Uses slate color scale
5. **FocusModeView.tsx** - Many interactive states need review
