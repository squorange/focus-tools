# UI Enhancements Backlog

Future improvements to reduce clutter and improve UX.

---

## Task Details Panel Condensation

**Current State:**
Task/subtask details panel has multiple expanded sections:

- Description (text area)
- Schedule section (date fields)
- Organization section (energy, tags, estimated time)
- Subtasks section
- Activity section (new)

**Problem:** Vertical space consumption, scrolling required

### Enhancement Option 1: Chip/Pill Row

**Design:**

```
┌────────────────────────────────────┐
│ Task Title                    [⋮]  │
├────────────────────────────────────┤
│ [📅 Due: Dec 15] [⚡ High] [🏷️ work] [⏱️ 2h] │ ← Condensed properties
│                                    │
│ Description...                     │
│                                    │
│ ▼ Subtasks (4)                    │
│ ▼ Activity (12)                   │
└────────────────────────────────────┘

On click any chip → expands to edit mode:
┌────────────────────────────────────┐
│ [📅 Due Date: [Dec 15 ▼]]         │
│ [Cancel] [Save]                    │
└────────────────────────────────────┘
```

**Benefits:**

- Compact view
- Quick visual scan
- Edit-on-demand
- Only shows filled properties

**Implementation:**

- Clickable chips for each property
- Inline or modal edit mode
- Hide empty properties or show "[+ Add]" chip

---

### Enhancement Option 2: Notion-Style Properties

**Design:**

```
┌────────────────────────────────────┐
│ Task Title                    [⋮]  │
├────────────────────────────────────┤
│ Description...                     │
├────────────────────────────────────┤
│ Due Date    │ Dec 15, 2025        │ ← Table-style properties
│ Energy      │ ⚡ High              │
│ Tags        │ 🏷️ work, urgent      │
│ Estimated   │ ⏱️ 2 hours           │
│ [+ Add property]                   │
├────────────────────────────────────┤
│ ▼ Subtasks (4)                    │
│ ▼ Activity (12)                   │
└────────────────────────────────────┘

Click any property → inline edit:
│ Due Date    │ [Date picker]  [✓][✗] │
```

**Benefits:**

- Familiar pattern (Notion, Linear, Height)
- Scannable
- Extensible (easy to add properties)
- Works well for keyboard navigation

**Implementation:**

- Table/grid layout
- Click to edit inline
- Show only populated properties + "[+ Add]"
- Properties can be reordered

---

### Recommendation

Start with **Option 1** (Chip/Pill Row) - simpler to implement, less structural change.

Later consider **Option 2** if we add more properties or need better organization.

---

## Related Considerations

**Mobile/Tablet:**

- Pills work well on mobile (tappable)
- Notion-style might be cramped on small screens

**Accessibility:**

- Ensure chips are keyboard accessible
- Clear focus states
- Screen reader friendly labels

**Data Density:**

- User preference toggle: "Compact view" vs "Expanded view"
- Remember preference per user

---

**Status:** Noted for future implementation
**Priority:** Medium (UX improvement, not critical)
**Dependencies:** None (can implement independently)

_Last Updated: 2025-11-10_
