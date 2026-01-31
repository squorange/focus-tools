# Task Details Refactor — Claude Code Prompts

> **Status:** Draft  
> **Created:** January 2026  
> **Purpose:** Session-scoped prompts for implementing task details refactor  
> **Context:** This is **Phase 0** of the Nudge System. Complete before `NUDGE_SYSTEM_IMPLEMENTATION_PLAN.md`.

---

## Overview

This refactor reorganizes the task details UI into sections without changing the data model. The goal is to prepare for nudge system fields (importance, energy type, lead time) by establishing clear UI patterns.

### What This Phase Does

- Reorganizes existing fields into sections
- Implements collapsed/expanded states with pills
- Adds priority display (read-only, using existing priority field)
- Creates pill → modal interaction pattern
- Moves Waiting On to bottom actions

### What This Phase Does NOT Do

- Add new data fields (that's Phase 1 of nudge system)
- Implement priority calculation (that's Phase 2)
- Add importance/energy/lead time UI (that's Phase 3)

---

## Session Prompts

### Prompt 0.1: Examine Current Task Details

```
Examine the current task details implementation:

1. Find the TaskDetail component (or equivalent)
2. Identify how the details section is structured
3. Note how collapsed vs expanded states work
4. List all fields currently shown in details
5. Identify how pills/badges are rendered (if any)
6. Note how modals/drawers are used for editing
7. Find where recurring instance vs template logic lives

Report:
- File paths for relevant components
- Current structure/hierarchy
- Existing patterns for pills, modals, sections
- How status/progress section relates to details section

Do not make changes yet.
```

### Prompt 0.2: Examine Bottom Actions

```
Examine the current bottom actions area (where Defer, Archive, Delete live):

1. Where is this component?
2. How are actions structured?
3. Where does "Waiting On" currently live?
4. What interaction patterns are used (buttons, links, etc.)?

Report findings. We need to move Waiting On to this area.

Do not make changes yet.
```

### Prompt 0.3: Propose Refactor Approach

```
Based on the TASK_DETAILS_REFACTOR_SPEC.md and your examination, propose how to implement the refactor:

Key requirements:
1. Collapsed state: pills row + priority right-aligned + chevron
2. Expanded state: Details label + priority + chevron, then sections below
3. Sections: Basics (Project, Recurring), Timing, Levels, Reminders
4. Pills are tappable, open modals
5. Priority is read-only, tappable for breakdown modal
6. Waiting On moves to bottom actions

Consider:
- Can we refactor incrementally or need big rewrite?
- What existing components can be reused?
- What new components are needed?
- How to handle the different task states (one-off, recurring template, recurring instance)?

Propose 2-3 approaches with tradeoffs. Wait for approval before implementing.
```

### Prompt 0.4: Implement Collapsed State Structure

```
[After approach approved]

Implement the new collapsed state structure:

1. Remove "Details" label from outside the collapsible area
2. Create collapsed row with:
   - Pills area (left, flexible width)
   - Priority display (right-aligned)
   - Chevron (right, after priority)

For now:
- Keep existing pills logic (we'll refine later)
- Priority can show existing priority field or placeholder
- Focus on layout structure

Test:
- Collapsed state renders correctly
- Chevron toggles expand/collapse
- Priority is visually distinct from pills
```

### Prompt 0.5: Implement Expanded State Structure

```
Implement the new expanded state structure:

1. When expanded, show:
   - "Details" label + Priority + Chevron (same row)
   - Content area below with sections

2. Create section structure:
   - Basics section (no label): Project dropdown, Recurring toggle
   - Timing section (with label): placeholder for pills
   - Levels section (with label): placeholder for pills
   - Reminders section (with label): existing reminder UI

For now:
- Move existing fields into appropriate sections
- Use placeholders where new patterns needed
- Focus on structure, not final styling

Test:
- Expanded state shows sections
- Sections are visually distinct
- Existing functionality preserved
```

### Prompt 0.6: Implement Pill Component

```
Create a reusable Pill component for section content:

Requirements:
- Display: icon + label (e.g., "📅 Tomorrow 9a")
- States: filled (has value), empty (action prompt like "+ Set timing")
- Interaction: tappable, triggers onPress callback
- Styling: consistent with app design, distinct from buttons
- Variants: normal, locked (for recurring instances)

Props:
```typescript
interface PillProps {
  icon?: string | ReactNode;
  label: string;
  variant?: 'filled' | 'empty' | 'locked';
  onPress?: () => void;
}
```

Create component following existing patterns in codebase.

Test:
- Renders correctly in all variants
- Tap triggers callback
- Locked variant shows lock indicator, doesn't trigger callback
```

### Prompt 0.7: Implement Timing Section Pills

```
Implement the Timing section using Pill components:

One-off task shows:
- Target date/time pill (or "+ Set target")
- Deadline pill (or "+ Add deadline")  
- Lead time pill (or empty, can add later when field exists)
- Duration pill
- Start Poke pill

Recurring task shows:
- Recurrence pattern pill
- Duration pill
- Start Poke pill

Recurring instance:
- Same as recurring but pills are locked variant
- Show "Edit routine template to change" note below

Each pill tap should open appropriate modal:
- Use existing modals where they exist
- Create placeholder handlers for modals that don't exist yet

Test:
- Correct pills show for each task type
- Pills reflect current values
- Tap opens modal (or logs placeholder action)
- Recurring instance shows locked state
```

### Prompt 0.8: Implement Levels Section Pills

```
Implement the Levels section using Pill components:

Shows:
- Importance pill (or "+ Set importance") — placeholder for now, field doesn't exist
- Energy type pill (or "+ Set energy") — placeholder for now, field doesn't exist

For now, since these fields don't exist yet:
- Show empty state: [+ Set importance] [+ Set energy]
- Tap logs placeholder action
- Comment where real implementation will go

Recurring instance:
- Show locked variant
- Show "Edit routine template to change" note

Recurring template:
- Show editable pills (once fields exist)

Test:
- Section renders with placeholder pills
- Correct state for task type
```

### Prompt 0.9: Implement Reminders Section

```
Update Reminders section to use new pattern:

One-off and recurring instance:
- Show existing reminders as pills with × to remove
- Show [+ Add reminder] to add new
- Tap reminder opens edit modal
- Tap + opens add modal

Recurring template:
- Hide reminders section entirely (not applicable)

Use existing reminder modal/functionality, just update display pattern.

Test:
- Reminders show as pills
- Can add/edit/remove reminders
- Section hidden for templates
```

### Prompt 0.10: Implement Priority Display

```
Implement the priority display in the header row:

Requirements:
- Shows right-aligned, before chevron
- Format: icon + tier label (e.g., "📊 High")
- Visually distinct from editable pills (suggest: no background, muted color)
- Tappable

For now:
- Read from existing priority field (if exists)
- If no priority field, show "📊 —" or calculate from basic heuristics
- Tap opens placeholder modal (breakdown modal comes later)

Test:
- Priority shows in collapsed state
- Priority shows in expanded state
- Same position in both states
- Tap triggers modal open
```

### Prompt 0.11: Implement Priority Breakdown Modal

```
Create the priority breakdown modal:

Structure:
1. Header: "Priority Breakdown" + close button
2. Priority badge: tier icon + label + score
3. Score info: tappable score or ℹ️ to show scale
4. Contributing factors: list with labels and point values
5. Prediction: "Will become X when..."
6. Adjust inputs: section with editable pills
7. Actions: Cancel, Save changes

For MVP (before priority calculation exists):
- Show placeholder/mock data for breakdown
- Adjust inputs section shows current task values
- Save updates task fields (existing ones only for now)
- Score display shows placeholder

Mark clearly with TODOs where real priority calculation will integrate.

Test:
- Modal opens on priority tap
- Score info expands/collapses or shows tooltip
- Adjust inputs are interactive
- Cancel closes without saving
- Save updates task and closes
```

### Prompt 0.12: Move Waiting On to Bottom Actions

```
Move Waiting On from details form to bottom actions row:

1. Remove Waiting On from details section
2. Add Waiting On button to bottom actions row
3. Position: first in row (before Defer)

Behavior:
- If not set: shows [⏸ Waiting On]
- If set: shows [⏸ Waiting: {value} ×]
- Tap opens modal to set/edit
- × clears the value

Use existing Waiting On modal if it exists, or create simple one.

Test:
- Button appears in bottom actions
- Shows current value if set
- Can set, edit, and clear
- No longer appears in details section
```

### Prompt 0.13: Handle Task State Variations

```
Verify all task states render correctly:

Test each state:
1. Inbox (new) - no status, action prompts, all editable
2. Ready (no progress) - no status, mixed pills, all editable
3. Ready (has progress) - status shown, data pills, all editable
4. In Focus Queue - status shown, data pills, all editable
5. Recurring Instance - status shown, timing/levels locked, reminders editable
6. Recurring Template - no status, all editable except no reminders section

Fix any issues found.

Document any edge cases discovered.
```

### Prompt 0.14: Polish and Cleanup

```
Polish the refactored task details:

1. Visual consistency:
   - Section spacing
   - Pill sizing and spacing
   - Typography
   - Colors match app theme

2. Interactions:
   - Smooth expand/collapse animation
   - Tap feedback on pills
   - Modal transitions

3. Accessibility:
   - Screen reader labels
   - Keyboard navigation (if applicable)
   - Touch target sizes

4. Code cleanup:
   - Remove dead code from old implementation
   - Add comments for complex logic
   - Ensure consistent patterns

Test full flows end-to-end.
```

### Prompt 0.15: Documentation and Handoff

```
Finalize the refactor:

1. Update any relevant documentation:
   - Component structure notes
   - Pattern documentation (if exists)

2. Create summary of changes:
   - Files modified
   - New components created
   - Patterns established

3. Note integration points for Phase 1 (nudge system):
   - Where importance field will be added
   - Where energy type field will be added
   - Where lead time field will be added
   - Where priority calculation will integrate

4. List any known issues or TODOs

Report summary for handoff to Phase 1.
```

---

## Troubleshooting Prompts

### If Pills Don't Fit

```
The pills row is overflowing or wrapping poorly. Options:

1. Allow wrapping to second row
2. Limit visible pills, show "+N more"
3. Horizontal scroll
4. Prioritize which pills to show

Current behavior: [describe]
Desired behavior: [describe]

Recommend a solution and implement.
```

### If Modals Conflict

```
There's an issue with modal management when opening from pills.

Current behavior: [describe issue]
Expected behavior: Modal opens, edits field, closes

Check:
1. Is there a modal manager/provider?
2. Are modals properly cleaned up on close?
3. Is there z-index or stacking issue?

Diagnose and fix.
```

### If Recurring Logic Is Complex

```
The recurring template vs instance logic is getting complex.

Current approach: [describe]
Problems: [describe]

Consider:
1. Can we use a context/provider for task type?
2. Should we split into separate components?
3. Is there a cleaner way to handle locked fields?

Propose simplification.
```

---

## Validation Checklist

Before completing Phase 0, verify:

- [ ] Collapsed state shows pills + priority + chevron in one row
- [ ] Expanded state shows Details label + priority + chevron, then sections
- [ ] Basics section shows Project and Recurring toggle
- [ ] Timing section shows appropriate pills for task type
- [ ] Levels section shows placeholder pills
- [ ] Reminders section works for one-off and instances, hidden for templates
- [ ] Priority tappable, opens breakdown modal
- [ ] Breakdown modal shows structure (placeholders OK for calculations)
- [ ] Waiting On moved to bottom actions
- [ ] All task states render correctly
- [ ] No functionality lost from previous implementation
- [ ] Code is clean and documented

---

## After Phase 0

Once this refactor is complete, proceed to:

1. **Phase 1: Data Model** — Add importance, energyType, leadTimeDays fields
2. **Phase 2: Priority Calculation** — Implement scoring logic
3. **Phase 3: Priority Queue + Fields UI** — Wire up new fields and calculation

See `NUDGE_SYSTEM_IMPLEMENTATION_PLAN.md` for full details.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `TASK_DETAILS_REFACTOR_SPEC.md` | Specification for this refactor |
| `NUDGE_SYSTEM_DATA_MODEL.md` | Data model (Phase 1) |
| `NUDGE_SYSTEM_MVP_SPEC.md` | Full nudge system spec |
| `NUDGE_SYSTEM_IMPLEMENTATION_PLAN.md` | Phases 1-7 |
| `NUDGE_SYSTEM_CLAUDE_CODE_PROMPTS.md` | Prompts for Phases 1-7 |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial prompts |
