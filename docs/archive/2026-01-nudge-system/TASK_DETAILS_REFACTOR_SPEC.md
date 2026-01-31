# Task Details Refactor — Specification

> **Status:** Draft  
> **Created:** January 2026  
> **Purpose:** Reorganize task details UI to support nudge system fields without overwhelming users  
> **Context:** This is **Phase 0** of the Nudge System implementation. Complete this refactor before proceeding with `NUDGE_SYSTEM_IMPLEMENTATION_PLAN.md`.

---

## Overview

The current task details UI is already dense. Adding importance, energy type, and lead time fields would push it over the edge. This refactor reorganizes the details section using progressive disclosure and clear sectioning.

### Goals

1. Reduce cognitive load when viewing task details
2. Create clear sections for related fields
3. Support collapsed (read-only) and expanded (editable) states
4. Establish patterns for adding new fields (nudge system)
5. Make priority visible and its calculation transparent

### Non-Goals

- Changing task data model (that's Phase 1 of nudge system)
- Implementing priority calculation (that's Phase 2)
- Adding new fields yet (that's Phase 3)

This refactor focuses on **UI structure only**, preparing the foundation.

---

## Current State

The details module currently has two semi-independent parts:

1. **Status/Progress Overview** — Progress ring, step count, recurrence info, streak
2. **Details** — Collapsed shows summary pills; expanded shows flat list of editable fields

### Current Problems

- Expanded state is a flat list of 10+ fields
- All fields shown regardless of relevance
- No clear grouping by purpose
- Adding more fields will make it worse

---

## Proposed Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Task Title                                    [Actions]     │
├─────────────────────────────────────────────────────────────┤
│ STATUS/PROGRESS (when applicable)                           │
│ [Progress ring] X/Y steps • Recurrence info • Streak        │
├─────────────────────────────────────────────────────────────┤
│ COLLAPSED: [pills] [pills]                   📊 Priority ∨  │
│                                                             │
│ EXPANDED:                                                   │
│ Details                                      📊 Priority ∧  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Basics (always visible)                                 │ │
│ │ Timing section                                          │ │
│ │ Levels section                                          │ │
│ │ Reminders section                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Steps                                                       │
├─────────────────────────────────────────────────────────────┤
│ Notes                                                       │
├─────────────────────────────────────────────────────────────┤
│ Bottom Actions                                              │
│ [Waiting On]  [Defer]  [Archive]  [Delete]                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Changes

| Aspect | Current | Proposed |
|--------|---------|----------|
| Details label | Outside module, always visible | Inside, only when expanded |
| Collapsed state | Pills below, chevron separate | Pills + Priority + chevron same row |
| Expanded state | Flat field list | Sectioned: Basics → Timing → Levels → Reminders |
| Priority | Toggle pills (High/Med/Low) | Read-only display, right-aligned, tappable for breakdown |
| Waiting On | In details form | Moved to bottom actions row |
| Field editing | Inline in expanded view | Tappable pills open modal/drawer |

---

## Collapsed State

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [pill] [pill] [pill] [pill]                  📊 Priority ∨  │
└─────────────────────────────────────────────────────────────┘
```

- Pills show current values for set fields
- Unset fields show action prompts: `[+ Set timing]`
- Priority is right-aligned next to chevron
- Tapping a pill opens modal to edit that field directly
- Tapping priority opens breakdown modal
- Tapping chevron expands details

### Pill Display Logic

**Show data pill when field has value:**
```
[● Today]  [📅 Tomorrow 9a]  [👆 8:10 AM]  [● Carbon]
```

**Show action prompt when field is empty:**
```
[+ Set timing]  [+ Add levels]  [+ Add to project]
```

**Mixed state (some set, some not):**
```
[📅 Tomorrow 9a]  [+ Add deadline]  [⏱ 45m]  [● Carbon]
```

### Pill Priority (if space constrained)

Show in this order, truncate or wrap if needed:
1. Status (Today/Ready/etc.)
2. Target or Deadline
3. Start Poke time (if enabled)
4. Project
5. Importance (if set)
6. Energy type (if set)

### Priority Display

- Icon + label: `📊 High` or `📊 Medium` or `📊 Low` or `📊 Critical`
- Right-aligned, next to chevron
- Visually distinct from editable pills (no border/background, or muted style)
- Tappable — opens priority breakdown modal
- No separate info icon needed

---

## Expanded State

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Details                                      📊 Priority ∧  │
│                                                             │
│ Project         [● Carbon ∨]                                │
│ Recurring       [○─────]                                    │
│                                                             │
│ Timing                                                      │
│ [pill] [pill] [pill] [pill]                                 │
│                                                             │
│ Levels                                                      │
│ [pill] [pill]                                               │
│                                                             │
│ Reminders                                                   │
│ [+ Add reminder]  or  [🔔 Wed 9a ×] [+]                     │
└─────────────────────────────────────────────────────────────┘
```

### Basics (Always Visible)

No section label needed — these are fundamental task properties.

```
Project         [● Carbon ∨]
Recurring       [○─────]
```

- Project: dropdown selector
- Recurring: toggle switch

### Timing Section

**Section label:** "Timing"

**One-off task (Recurring OFF):**
```
Timing
[📅 Tomorrow 9a]  [+ Deadline]  [⏳ Same day]  [⏱ 45m]  [👆 On]
```

**Recurring task (Recurring ON):**
```
Timing
[🔄 Weekdays 8:20a]  [⏱ 27m]  [👆 On]
```

**Pills in this section:**

| Pill | One-off | Recurring Template | Recurring Instance |
|------|---------|-------------------|-------------------|
| Target date/time | ✅ Editable | — | — |
| Deadline | ✅ Editable | — | — |
| Lead time | ✅ Editable | — | — |
| Recurrence pattern | — | ✅ Editable | 🔒 View only |
| Duration | ✅ Editable | ✅ Editable | 🔒 View only |
| Start Poke | ✅ Editable | ✅ Editable | 🔒 View only |

**For recurring instances**, show note below locked pills:
```
Edit routine template to change
```

### Levels Section

**Section label:** "Levels"

```
Levels
[⭐ Should Do]  [⚡ Draining]
```

Or if not set:
```
Levels
[+ Set importance]  [+ Set energy]
```

**Pills in this section:**

| Pill | One-off | Recurring Template | Recurring Instance |
|------|---------|-------------------|-------------------|
| Importance | ✅ Editable | ✅ Editable | 🔒 View only |
| Energy type | ✅ Editable | ✅ Editable | 🔒 View only |

**Note:** Priority is NOT in this section — it's in the header row.

**For recurring instances**, show note below locked pills:
```
Edit routine template to change
```

### Reminders Section

**Section label:** "Reminders"

```
Reminders
[+ Add reminder]
```

Or if reminders exist:
```
Reminders
[🔔 Wed 9:00 AM ×]  [🔔 Thu 2:00 PM ×]  [+]
```

**Availability:**

| Context | Reminders |
|---------|-----------|
| One-off task | ✅ Editable |
| Recurring template | ❌ Hidden (no specific time to remind) |
| Recurring instance | ✅ Editable (time-specific) |

---

## Priority Breakdown Modal

Tapping priority opens an interactive breakdown modal.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Priority Breakdown                                    [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              ┌─────────────────────┐                        │
│              │   🟠 High           │                        │
│              │   Score: 43 ℹ️      │  ← Tap for scale       │
│              └─────────────────────┘                        │
│                                                             │
│ Contributing factors:                                       │
│                                                             │
│ Importance (Should Do) ───────────────────────── +15        │
│ Time pressure (target tomorrow) ─────────────── +25         │
│ Source (self) ───────────────────────────────── +0          │
│ Staleness (3 days) ──────────────────────────── +0          │
│ Defer count (0) ─────────────────────────────── +0          │
│ Streak risk ─────────────────────────────────── +0          │
│ Energy match ────────────────────────────────── +3          │
│ ─────────────────────────────────────────────────────       │
│ Total: 43 → High                                            │
│                                                             │
│ 📈 Will become Critical when target date is today.          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Adjust inputs                                               │
│                                                             │
│ [⭐ Should Do ∨]  [📅 Tomorrow ∨]  [⏳ Same day ∨]          │
│ [🎯 No deadline]  [⚡ Draining ∨]                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                               [Cancel]  [Save changes]      │
└─────────────────────────────────────────────────────────────┘
```

### Score Info (Tap ℹ️ or Score)

Expands or shows tooltip with scoring scale:

```
┌─────────────────────────────────────────────────────────────┐
│ Priority Scale                                              │
│                                                             │
│ 60+    Critical   Act now                                   │
│ 40-59  High       Act soon                                  │
│ 20-39  Medium     On radar                                  │
│ 0-19   Low        When you get to it                        │
│                                                             │
│ Your score: 43 → High                                       │
└─────────────────────────────────────────────────────────────┘
```

### Interactive Behavior

1. **Live recalculation** — As user changes inputs, score and tier update immediately
2. **Change indicators** — Show delta: `Score: 43 → 53`, highlight changed rows
3. **Cancel** — Discard all changes, close modal
4. **Save changes** — Persist input changes to task, close modal
5. **× (close)** — Same as Cancel; if unsaved changes, optionally confirm

### Learning Value

This modal teaches users how the system thinks:
- "If I mark this Must Do, it becomes Critical"
- "Adding a deadline increases priority"
- "Lead time affects when priority escalates"

---

## Pill Interaction Pattern

All data pills follow the same interaction:

1. **Display** — Shows current value with icon
2. **Tap** — Opens modal/drawer to edit
3. **Modal** — Focused editing experience
4. **Save** — Updates task, closes modal
5. **Cancel** — Discards changes, closes modal

### Modal Content by Pill Type

| Pill | Modal Content |
|------|---------------|
| Target | Date picker + optional time picker |
| Deadline | Date picker |
| Lead time | Presets (Same day, Few days, 1 week, 2 weeks, 1 month) + Custom |
| Duration | Number input + source indicator (manual/from steps) |
| Start Poke | On/Off/Default toggle + calculated time preview |
| Recurrence pattern | Pattern builder (existing) |
| Importance | Must Do / Should Do / Could Do / Would Like To options |
| Energy type | Energizing / Neutral / Draining options |
| Reminder | Time/date picker + optional recurrence |

---

## Bottom Actions

Moving Waiting On from details form to bottom actions row:

```
[⏸ Waiting On]  [📅 Defer]  [📦 Archive]  [🗑 Delete]
```

### Waiting On Behavior

- **Tap** → Modal to enter who/what waiting on
- **If set** → Shows value: `[⏸ Waiting: Mike ×]`
- **Effect** → Task gets "Waiting" status, affects priority calculation

---

## State Matrix

| Task State | Status/Progress | Collapsed Pills | Priority | Timing | Levels | Reminders |
|------------|-----------------|-----------------|----------|--------|--------|-----------|
| **Inbox (new)** | Hidden | Action prompts | Shown | Editable | Editable | Editable |
| **Ready (no progress)** | Hidden | Mixed | Shown | Editable | Editable | Editable |
| **Ready (has progress)** | Shown | Data pills | Shown | Editable | Editable | Editable |
| **In Focus Queue** | Shown | Data pills | Shown | Editable | Editable | Editable |
| **Recurring Instance** | Shown | Data pills | Shown | View only | View only | **Editable** |
| **Recurring Template** | Hidden | Data pills | Shown | Editable | Editable | **Hidden** |

---

## Visual Examples

### One-off Task — Collapsed (with data)

```
┌─────────────────────────────────────────────────────────────┐
│ STATUS/PROGRESS                                             │
│ [2/3 ring] 0 of 1 for today • Show 2 completed              │
├─────────────────────────────────────────────────────────────┤
│ [● Today] [📅 Tomorrow] [👆 8:10 AM] [● Carbon]  📊 Med  ∨  │
└─────────────────────────────────────────────────────────────┘
```

### One-off Task — Collapsed (minimal data)

```
┌─────────────────────────────────────────────────────────────┐
│ (no status section)                                         │
├─────────────────────────────────────────────────────────────┤
│ [+ Set timing]  [+ Add levels]  [+ Add project]  📊 Low  ∨  │
└─────────────────────────────────────────────────────────────┘
```

### One-off Task — Expanded

```
┌─────────────────────────────────────────────────────────────┐
│ STATUS/PROGRESS                                             │
│ [2/3 ring] 0 of 1 for today • Show 2 completed              │
├─────────────────────────────────────────────────────────────┤
│ Details                                         📊 Med  ∧   │
│                                                             │
│ Project         [● Carbon ∨]                                │
│ Recurring       [○─────]                                    │
│                                                             │
│ Timing                                                      │
│ [📅 Tomorrow 9a]  [+ Deadline]  [⏳ Same day]               │
│ [⏱ 45m]  [👆 On]                                            │
│                                                             │
│ Levels                                                      │
│ [⭐ Should Do]  [⚡ Draining]                                │
│                                                             │
│ Reminders                                                   │
│ [+ Add reminder]                                            │
└─────────────────────────────────────────────────────────────┘
```

### Recurring Instance — Expanded

```
┌─────────────────────────────────────────────────────────────┐
│ STATUS/PROGRESS                                             │
│ [0/6 ring] 0 of 6 steps • Weekdays at 8:20a • 🔥5          │
├─────────────────────────────────────────────────────────────┤
│ Details                                         📊 High ∧   │
│                                                             │
│ Project         [● Home]                                    │
│ Recurring       [●─────]                                    │
│                                                             │
│ Timing                                                      │
│ [🔄 Weekdays 8:20a]  [⏱ 27m]  [👆 On]                       │
│ Edit routine template to change                             │
│                                                             │
│ Levels                                                      │
│ [⭐ Should Do]  [⚡ Neutral]                                 │
│ Edit routine template to change                             │
│                                                             │
│ Reminders                                                   │
│ [+ Add reminder]                                            │
└─────────────────────────────────────────────────────────────┘
```

### Recurring Template — Expanded

```
┌─────────────────────────────────────────────────────────────┐
│ (no STATUS/PROGRESS for template)                           │
├─────────────────────────────────────────────────────────────┤
│ Details                                         📊 Med  ∧   │
│                                                             │
│ Project         [● Home ∨]                                  │
│ Recurring       [●─────]                                    │
│                                                             │
│ Timing                                                      │
│ [🔄 Weekdays 8:20a]  [⏱ 27m]  [👆 On (default)]             │
│                                                             │
│ Levels                                                      │
│ [⭐ Should Do]  [⚡ Neutral]                                 │
│                                                             │
│ (no Reminders section for template)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### This Refactor Prepares For

- Adding `importance` field (Levels section)
- Adding `energyType` field (Levels section)
- Adding `leadTimeDays` field (Timing section)
- Adding priority calculation display
- Adding priority breakdown modal

### Data Model

This refactor does **not** change the data model. It only reorganizes UI.

New fields will be added in Phase 1 of the Nudge System implementation.

### Backward Compatibility

- All existing fields remain
- Existing values preserved
- No migration needed for this phase

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| `NUDGE_SYSTEM_DATA_MODEL.md` | Data model changes (Phase 1) |
| `NUDGE_SYSTEM_MVP_SPEC.md` | Behavior specification |
| `NUDGE_SYSTEM_IMPLEMENTATION_PLAN.md` | Full implementation phases |
| `TASK_DETAILS_REFACTOR_PROMPTS.md` | Claude Code prompts for this refactor |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial specification |
