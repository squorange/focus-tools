# Component Catalog

> Inventory of shared components: what's in design-system, what to extract, what stays local.

---

## In Design-System (Use These)

Components already available in `@focus-tools/design-system`:

| Component | Import Path | Usage in task-copilot | Status |
|-----------|-------------|----------------------|--------|
| **BottomSheet** | `@design-system/components` | 18 files | Replace local |
| **RightDrawer** | `@design-system/components` | 5 files | Replace local |
| **ResponsiveDrawer** | `@design-system/components` | 1 file | Replace local |
| **ProgressRing** | `@design-system/components` | 5 files | Replace local |
| **SegmentedControl** | `@design-system/components` | 1 file | Replace local |
| **Pill** | `@design-system/components` | ~20 files | Available |

### Import Examples

```tsx
// Main import
import { BottomSheet, RightDrawer, ProgressRing } from '@focus-tools/design-system';

// Or via path alias
import { BottomSheet } from '@design-system/components';

// Hooks
import { useIsMobile, useReducedMotion } from '@focus-tools/design-system';
```

---

## To Extract (Phase 3)

Components to move from task-copilot to design-system:

### Toast (HIGH Priority)

**Source:** `components/shared/Toast.tsx`

| Aspect | Details |
|--------|---------|
| **Purpose** | Notification toast with variants (info, success, warning, error) |
| **Dependencies** | None (pure presentation) |
| **App-specific?** | No - generic notification pattern |
| **Complexity** | Low |

**Token migrations needed:**
| Current | Semantic |
|---------|----------|
| `bg-zinc-800 dark:bg-zinc-700` | `bg-bg-neutral-inverse` |
| `bg-green-600 dark:bg-green-700` | `bg-bg-positive-high` |
| `bg-amber-500 dark:bg-amber-600` | `bg-bg-attention-high` |
| `bg-red-600 dark:bg-red-700` | `bg-bg-alert-high` |

### CollapsibleSection (MEDIUM Priority)

**Source:** `components/shared/CollapsibleFilterSection.tsx`

| Aspect | Details |
|--------|---------|
| **Purpose** | Collapsible disclosure with title, chevron, optional badge |
| **Dependencies** | Lucide icons |
| **App-specific?** | No - generic accordion pattern |
| **Complexity** | Low |
| **Rename to** | `CollapsibleSection` (remove "Filter" from name) |

---

## Keep Local (App-Specific)

Components that should remain in task-copilot:

### Pickers (Domain Logic)

| Component | Reason to Keep Local |
|-----------|---------------------|
| **DurationPicker** | Task duration concept, source tracking (manual/AI/steps) |
| **LeadTimePicker** | Deadline lead time calculation |
| **ReminderPicker** | Task reminder + notification integration |
| **ImportancePicker** | Task importance taxonomy |
| **StartPokePicker** | Nudge system integration |
| **EnergyTypePicker** | Energy level taxonomy |

### Task UI (Workflow Integration)

| Component | Reason to Keep Local |
|-----------|---------------------|
| **TaskCreationPopover** | Task creation workflow, project selection |
| **FilterDrawer** | Task filter taxonomy, presets |
| **TriageRow** | Inbox triage actions (Send to Pool, Add to Queue, etc.) |
| **ProjectModal** | Project CRUD, color picker |
| **DatePickerModal** | Task date selection |
| **FocusSelectionModal** | Queue focus selection |
| **PriorityBreakdownDrawer** | Priority calculation display |

### AI Components (Product-Specific)

| Component | Reason to Keep Local |
|-----------|---------------------|
| **AIDisclosure** | Product-specific AI transparency messaging |
| **AIFeedback** | Feedback system integration |
| **ShimmerText** | AI loading animation |

---

## Component Replacement Checklist

### Phase 2 Replacement Order

Start with least-used, end with most-used:

| Order | Component | Usages | Files to Update |
|-------|-----------|--------|-----------------|
| 1 | SegmentedControl | 1 | NotificationSettings.tsx |
| 2 | ProgressRing | 5 | TasksView, RoutinesList, QueueItem, TaskRow, TriageRow |
| 3 | RightDrawer | 5 | DetailsSection, FocusSelectionModal, HistoryModal, FilterDrawer, ResponsiveDrawer |
| 4 | ResponsiveDrawer | 1 | (After RightDrawer done) |
| 5 | BottomSheet | 18 | Multiple pickers + modals |

### Files to Delete After Replacement

```
components/shared/
├── SegmentedControl.tsx  ← Delete
├── ProgressRing.tsx      ← Delete
├── RightDrawer.tsx       ← Delete
├── ResponsiveDrawer.tsx  ← Delete (uses RightDrawer)
└── BottomSheet.tsx       ← Delete
```

---

## Comparison: Local vs Design-System

### BottomSheet

| Feature | Local | Design-System |
|---------|-------|---------------|
| iOS keyboard detection | Yes | Yes |
| Safe area handling | Yes | Yes |
| Drag to dismiss | Yes | Yes |
| Reduced motion | No | Yes |
| Semantic tokens | No | Yes |

### ProgressRing

| Feature | Local | Design-System |
|---------|-------|---------------|
| Solid variant | Yes | Yes |
| Dashed variant | Yes | Yes |
| Complete checkmark | Yes | Yes |
| Custom size | Yes | Yes |
| Semantic tokens | No | Yes |

### SegmentedControl

| Feature | Local | Design-System |
|---------|-------|---------------|
| Generic type `<T>` | Yes | Yes |
| Allow deselect | Yes | Yes |
| Full width | No | Yes |
| Size variants | No | Yes |
| Semantic tokens | No | Yes |
