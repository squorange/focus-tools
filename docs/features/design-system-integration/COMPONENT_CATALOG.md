# Component Catalog

> Inventory of shared components: what's in design-system, what to extract, what stays local.

---

## In Design-System (Use These)

Components already available in `@focus-tools/design-system`:

| Component | Import Path | Usage in task-copilot | Status |
|-----------|-------------|----------------------|--------|
| **BottomSheet** | `@design-system/components` | 18 files | ✅ Replaced |
| **RightDrawer** | `@design-system/components` | 5 files | ✅ Replaced |
| **ResponsiveDrawer** | `@design-system/components` | 1 file | ✅ Replaced |
| **ProgressRing** | `@design-system/components` | 5 files | ✅ Replaced |
| **SegmentedControl** | `@design-system/components` | 1 file | ✅ Replaced |
| **Pill** | `@design-system/components` | ~20 files | Available |
| **Toast** | `@design-system/components` | 1 file | ✅ Extracted (Phase 3) |
| **CollapsibleSection** | `@design-system/components` | 1 file | ✅ Extracted (Phase 3) |

### Import Examples

```tsx
// Via path alias (recommended in task-copilot)
import { BottomSheet, RightDrawer, ProgressRing } from '@design-system/components';
import { ToastContainer, ToastData } from '@design-system/components';
import { CollapsibleSection } from '@design-system/components';

// Direct package import
import { BottomSheet } from '@focus-tools/design-system';

// Hooks
import { useIsMobile, useReducedMotion } from '@focus-tools/design-system';
```

---

## Extracted (Phase 3 Complete)

Components extracted from task-copilot to design-system:

### Toast ✅

**Location:** `packages/design-system/components/Toast/`

| Aspect | Details |
|--------|---------|
| **Purpose** | Notification toast with variants (info, success, warning, error) |
| **Exports** | `ToastItem`, `ToastContainer`, `ToastData` type |
| **Semantic tokens** | `bg-bg-neutral-inverse`, `bg-bg-positive-high`, `bg-bg-attention-high`, `bg-bg-alert-high` |
| **Storybook** | ✅ Stories added |

### CollapsibleSection ✅

**Location:** `packages/design-system/components/CollapsibleSection/`

| Aspect | Details |
|--------|---------|
| **Purpose** | Collapsible disclosure with title, chevron, optional badge |
| **Exports** | `CollapsibleSection`, `CollapsibleSectionProps` type |
| **Semantic tokens** | `text-fg-neutral-primary`, `text-fg-accent-primary`, `bg-bg-accent-subtle`, `text-fg-neutral-soft` |
| **Storybook** | ✅ Stories added |

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
