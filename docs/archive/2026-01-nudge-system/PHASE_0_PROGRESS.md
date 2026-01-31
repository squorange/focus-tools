# Phase 0: Task Details Refactor — Progress Tracker

> **Status:** Complete ✅
> **Started:** 2026-01-28
> **Completed:** 2026-01-28

---

## Decisions Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-01-28 | Priority breakdown modal shows placeholders with non-functional states | Phase 0 = UI structure only |
| 2026-01-28 | Existing priority field may need modification (currently user-set) | Will assess during discovery |
| 2026-01-28 | Reminders NOT visible in recurring template mode | Templates have no specific dates |
| 2026-01-28 | Flexible grouping of prompts based on complexity | Balance efficiency vs. testability |
| 2026-01-28 | Priority field: placeholder in Phase 0, migrate in Phase 1 | Avoid breaking existing workflows |
| 2026-01-28 | Hybrid approach (C) for refactor | New components for UI, state in TaskDetail |
| 2026-01-28 | Pill modals: existing where available, placeholders otherwise | Pragmatic approach |

---

## Progress Checklist

### Tech Discovery
- [x] Examine TaskDetail component structure
- [x] Examine bottom actions area
- [x] Identify existing pill/badge patterns
- [x] Identify modal system in use
- [x] Understand recurring template vs instance handling
- [x] Assess existing priority field usage

### Implementation
- [x] Propose refactor approach (2-3 options with tradeoffs)
- [x] Implement collapsed state structure
- [x] Implement expanded state structure
- [x] Create Pill component (DetailsPill.tsx)
- [x] Implement Timing section pills
- [x] Implement Levels section pills (placeholders)
- [x] Update Reminders section
- [x] Implement Priority display (PriorityDisplay.tsx)
- [x] Implement Priority Breakdown modal (placeholder)
- [x] Move Waiting On to bottom actions
- [x] Handle task state variations
- [x] Polish and cleanup (UI refinements session)

### UI Refinements (Session 2)
- [x] Replace emojis with Lucide icons (except 👆 for poke)
- [x] Add size prop to DetailsPill (sm/md)
- [x] Add projectColor prop to DetailsPill
- [x] iOS Settings-style project row (label left, value + chevron right)
- [x] Larger pills (size="md") in expanded/edit mode
- [x] Section labels match Recurring label size (text-sm font-medium)
- [x] Spacing/border between Project and Recurring toggle
- [x] Switch to managing mode when toggling recurring on
- [x] Waiting On modal anchored to button (popover instead of centered modal)
- [x] Status pills use text only (no icons/dots)

### Validation
- [x] Collapsed state: pills + priority + chevron in one row
- [x] Expanded state: Details label + priority + chevron, then sections
- [x] Basics section: Project + Recurring toggle
- [x] Timing section: appropriate pills for task type
- [x] Levels section: placeholder pills
- [x] Reminders: works for one-off/instances, hidden for templates
- [x] Priority tappable, opens breakdown modal
- [x] Breakdown modal shows structure (placeholders OK)
- [x] Waiting On moved to bottom actions
- [x] All task states render correctly
- [x] No functionality lost

---

## Session Notes

### Session 1 (2026-01-28)
**Focus:** Tech discovery

**Findings:**

1. **TaskDetail Structure (2,662 lines)**
   - Monolithic component with inline StepItem
   - Details section: unified container with StatusModule + collapsible Details
   - Collapsed state: pills from `getDetailsSummary()` function
   - Expanded state: 2-column grid with flat field list
   - Animation: `grid-rows-[0fr/1fr]` transitions

2. **Current Details Layout**
   - Header: "Details" label left + chevron right (always visible)
   - Collapsed: pills row (clickable to expand)
   - Expanded: Project → Recurring toggle → Pattern → Target/Deadline → Reminder → Waiting On → Start Poke → Duration → Status → Priority
   - No sectioning - flat list

3. **Priority Field**
   - Exists in data model: `priority: 'high' | 'medium' | 'low' | null`
   - User-set via button group in expanded details (toggle on/off)
   - Shown as pill in collapsed state (High = red, Medium = amber)
   - NOT shown for recurring tasks (hidden in both states)
   - **Decision needed:** Can repurpose for system-calculated priority (will need migration or new field)

4. **Bottom Actions**
   - Located at end of TaskDetail (lines ~1920-2002)
   - Row with: Pause/Resume (recurring) OR Defer dropdown (one-off), Archive/Unarchive, Delete
   - Waiting On currently in expanded details form (text input)
   - Moving to bottom actions row is straightforward

5. **Pill/Badge Patterns**
   - `MetadataPill` component with variants: default, priority-high, priority-medium, healthy, project, due, overdue
   - Props: children, variant, color (for project), icon (ReactNode)
   - `HealthPill` for at_risk/critical status
   - Pills are display-only (not interactive except click-to-expand area)

6. **Recurring Handling**
   - `mode: 'executing' | 'managing'` state
   - `isReadOnlyDetails` flag for executing mode
   - Read-only fields get lock icon + "Edit routine template to change" text
   - Pattern works well for the locked pills in spec

7. **Modal System**
   - Various modals: FocusSelectionModal, ReminderPicker, ProjectModal, EditTemplateModal, HistoryModal
   - Pattern: state variable + conditional render
   - Some use fixed positioning, some use relative
   - No central modal manager

**Next steps:**
1. Propose refactor approach (2-3 options)
2. Get approval
3. Begin implementation

### Session 2 (2026-01-28)
**Focus:** UI refinements based on user feedback

**Changes Made:**

1. **DetailsPill.tsx**
   - Added `size` prop ('sm' | 'md') for different contexts
   - Added `projectColor` prop for project color dots
   - Updated icon handling to properly size Lucide icons
   - Icon sizes: sm = w-3.5 h-3.5, md = w-4 h-4

2. **DetailsSection.tsx**
   - Replaced all emojis with Lucide icons:
     - 🔄 → RefreshCw (recurring)
     - 🔔 → Bell (reminder)
     - 📅 → Calendar (target date)
     - 🎯 → Target (deadline)
     - ⏱ → Timer (duration)
     - ⏳ → Clock (lead time)
     - ⚡ → Zap (energy)
     - ⭐ → Star (importance)
     - + → Plus (empty prompts)
     - Kept 👆 as emoji for poke (per spec)
   - iOS Settings-style project row (label left, value right with chevron)
   - Section labels now match Recurring label (text-sm font-medium text-zinc-700)
   - Added border separator between Project and Recurring toggle
   - All expanded pills use size="md"
   - Status pills use text only (no icons)
   - When toggling recurring ON, automatically switches to managing mode

3. **TaskDetail.tsx**
   - Waiting On modal refactored to anchored popover
   - Opens above and left-aligned with button
   - Removed old centered fixed modal

**Build:** ✅ Successful

---

## Key File Paths

| Component | Path |
|-----------|------|
| TaskDetail | `components/task-detail/TaskDetail.tsx` |
| DetailsSection | `components/task-detail/DetailsSection.tsx` (NEW) |
| DetailsPill | `components/shared/DetailsPill.tsx` (NEW) |
| PriorityDisplay | `components/shared/PriorityDisplay.tsx` (NEW) |
| PriorityBreakdownModal | `components/shared/PriorityBreakdownModal.tsx` (NEW) |
| StatusModule | `components/task-detail/StatusModule.tsx` |
| MetadataPill | `components/shared/MetadataPill.tsx` |
| HealthPill | `components/shared/HealthPill.tsx` |
| ReminderPicker | `components/shared/ReminderPicker.tsx` |
| Types | `lib/types.ts` |
| StartPokeField | `components/task-detail/StartPokeField.tsx` |

---

## Integration Points for Phase 1+

_(To be noted during implementation)_

- Where importance field will be added: Levels section pills
- Where energy type field will be added: Levels section pills
- Where lead time field will be added: Timing section pills
- Where priority calculation will integrate: Priority display component + breakdown modal
