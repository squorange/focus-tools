# Nudge System — Implementation Plan

> **Status:** Draft  
> **Created:** January 2026  
> **Purpose:** Phased implementation approach with dependencies and validation criteria

---

## Overview

This plan breaks the nudge system MVP into implementable phases. Each phase is designed to be:

- Independently valuable
- Testable in isolation
- Building toward the complete system

---

## Prerequisites

### Phase 0: Task Details Refactor (REQUIRED FIRST)

Before starting Phase 1, complete the task details UI refactor documented in:

- `TASK_DETAILS_REFACTOR_SPEC.md` — Specification
- `TASK_DETAILS_REFACTOR_PROMPTS.md` — Claude Code prompts

**Why Phase 0 is required:**
- Current task details UI is already dense
- Adding importance, energy type, lead time fields will overwhelm users
- Refactor establishes section structure (Timing, Levels, Reminders)
- Creates pill → modal interaction pattern
- Adds priority display infrastructure

**Phase 0 scope:**
- Reorganize existing fields into sections (no new fields)
- Implement collapsed/expanded states with pills
- Add priority display (read-only placeholder)
- Create priority breakdown modal (placeholder calculations)
- Move Waiting On to bottom actions

---

## Phase Summary

| Phase | Focus | Dependencies | Estimated Sessions |
|-------|-------|--------------|-------------------|
| **0** | Task Details Refactor | None | 2-3 |
| **1** | Data Model | Phase 0 | 1-2 |
| **2** | Priority Calculation | Phase 1 | 1-2 |
| **3** | Priority Queue View + Fields UI | Phase 2 | 2-3 |
| **4** | Start Nudge Updates | Phase 1, 2 | 1-2 |
| **5** | Orchestrator | Phase 4 | 1-2 |
| **6** | Energy System | Phase 2 | 2-3 |
| **7** | Settings & Polish | All above | 1-2 |

---

## Phase 1: Data Model

### Goal

Add new fields to support importance, energy type, and lead time.

### Tasks

1. **Extend Task type**
   - Add `importance: ImportanceLevel | null`
   - Add `importanceSource: 'self' | 'partner' | null`
   - Add `importanceNote: string | null`
   - Add `energyType: EnergyType | null`
   - Add `leadTimeDays: number | null`
   - Add `leadTimeSource: 'manual' | 'ai' | null`

2. **Extend UserState type**
   - Add `currentEnergy: EnergyLevel | null`
   - Add `currentEnergySetAt: number | null`

3. **Extend UserSettings type**
   - Add `quietHoursEnabled: boolean`
   - Add `quietHoursStart: string | null`
   - Add `quietHoursEnd: string | null`
   - Add `nudgeCooldownMinutes: number`

4. **Create type definitions**
   - `ImportanceLevel = 'must_do' | 'should_do' | 'could_do' | 'would_like_to'`
   - `EnergyType = 'energizing' | 'neutral' | 'draining'`
   - `EnergyLevel = 'high' | 'medium' | 'low'`
   - `PriorityTier = 'critical' | 'high' | 'medium' | 'low'`

5. **Schema migration**
   - Bump schema version
   - Add fields with null defaults
   - Initialize settings defaults

### Validation

- [ ] Types compile without errors
- [ ] Migration runs successfully
- [ ] Existing tasks unaffected (new fields are null)
- [ ] New tasks can be created with new fields

### Output

- Updated type definitions
- Migration function
- No UI changes yet

---

## Phase 2: Priority Calculation

### Goal

Implement priority score calculation and tier assignment.

### Tasks

1. **Create priority calculation utilities**
   - `calculatePriorityScore(task, userState): number`
   - `getPriorityTier(score): PriorityTier`
   - `getEffectiveDeadline(task): Date | null`

2. **Implement component score functions**
   - `getImportanceScore(importance): number`
   - `getTimePressureScore(task): number` (uses effective deadline)
   - `getSourceScore(task): number`
   - `getStalenessScore(updatedAt): number`
   - `getStreakRiskScore(task): number`
   - `getDeferScore(deferredCount): number`
   - `getEnergyMatchScore(taskEnergy, userEnergy): number`

3. **Create computed fields helper**
   - Function to compute all derived fields for a task
   - Returns: `{ effectiveDeadline, priorityScore, priorityTier }`

4. **Add unit tests**
   - Test each component score function
   - Test overall calculation with various inputs
   - Test tier thresholds

### Validation

- [ ] Score calculation matches specification
- [ ] Tier assignment correct at boundaries
- [ ] Effective deadline correctly computed
- [ ] Energy match only affects score when user energy is set

### Output

- Priority calculation utility functions
- Unit tests
- No UI changes yet

---

## Phase 3: Priority Queue View

### Goal

Add Priority Queue module to Notifications Hub.

### Tasks

1. **Examine current Notifications Hub implementation**
   - Understand existing structure
   - Identify integration points
   - Note patterns and conventions

2. **Create Priority Queue data layer**
   - Function to get tasks sorted by priority
   - Function to group tasks by tier
   - Filter out completed/archived tasks

3. **Propose and implement Priority Queue UI**
   - New module/section in Notifications Hub
   - Tasks grouped by tier (Critical/High/Medium/Low)
   - Expandable/collapsible tiers
   - Tap to navigate to task

4. **Implement score breakdown view**
   - Info icon on task items
   - Expandable section showing:
     - Each component's contribution
     - Total score
     - Tier explanation
     - "Priority will increase when..." hint

5. **Add importance/energy/lead time inputs to Task Detail**
   - Examine current Task Detail implementation
   - Propose integration approach
   - Implement fields with appropriate controls

### Validation

- [ ] Priority Queue displays correctly
- [ ] Tasks grouped by correct tier
- [ ] Sorting within tier is correct
- [ ] Score breakdown is accurate
- [ ] New fields editable in Task Detail

### Output

- Priority Queue UI component
- Integration with Notifications Hub
- Task Detail field additions

---

## Phase 4: Start Nudge Updates

### Goal

Add runway nudge logic and update execution nudge to use effective deadline.

### Tasks

1. **Examine current Start Nudge implementation**
   - Understand existing calculation logic
   - Identify where changes are needed

2. **Update execution nudge calculation**
   - Continue using raw deadline (not effective deadline)
   - Ensure buffer calculation unchanged

3. **Add runway nudge calculation**
   - Only for tasks with `leadTimeDays > 0`
   - Fires 1 day before effective deadline
   - Different message framing

4. **Update notification scheduling**
   - Schedule both nudge types when applicable
   - Ensure both can fire for same task

5. **Update notification types**
   - Add `runway_nudge` type
   - Update type definitions

### Validation

- [ ] Runway nudge fires at correct time
- [ ] Runway nudge only for tasks with lead time
- [ ] Execution nudge unchanged for tasks without lead time
- [ ] Both nudges can fire for same task
- [ ] Message framing appropriate for each type

### Output

- Updated Start Nudge logic
- Runway nudge support
- Updated notification types

---

## Phase 5: Orchestrator

### Goal

Implement B+C hybrid orchestrator (deduplication + priority queue).

### Tasks

1. **Implement deduplication layer**
   - Track last nudge time per task
   - Enforce cooldown period (default 15 min)
   - Store in appropriate state

2. **Implement priority ordering**
   - Define nudge type priorities
   - Sort pending nudges by priority
   - Fire highest priority first

3. **Implement quiet hours check**
   - Check current time against quiet hours settings
   - Downgrade push to badge during quiet hours
   - Exception for critical priority

4. **Integrate with existing notification system**
   - Examine current notification firing mechanism
   - Insert orchestrator layer
   - Ensure backward compatibility

### Validation

- [ ] Deduplication prevents rapid-fire nudges
- [ ] Higher priority nudges fire first
- [ ] Quiet hours downgrades correctly
- [ ] Critical nudges bypass quiet hours downgrade
- [ ] Existing notifications still work

### Output

- Orchestrator implementation
- Integration with notification system
- Settings for cooldown and quiet hours

---

## Phase 6: Energy System

### Goal

Implement user energy input and energy-aware filtering.

### Tasks

1. **Examine current UI for energy input integration points**
   - Navbar area
   - AI Palette quick actions
   - Settings area

2. **Propose and implement energy input mechanism(s)**
   - Quick toggle in appropriate location
   - Optional: "I'm feeling..." palette action

3. **Implement energy-aware filtering**
   - Filter function for tasks based on energy match
   - Integration with Priority Queue view
   - Show filtered tasks with option to reveal

4. **Implement critical override**
   - Critical priority tasks always shown
   - Clear indication when energy mismatch but showing anyway

### Validation

- [ ] User can set current energy
- [ ] Energy level persists appropriately
- [ ] Filtering works correctly per energy level
- [ ] Critical tasks always shown
- [ ] Energy mismatch indication clear

### Output

- Energy input UI
- Energy-aware filtering
- Priority Queue integration

---

## Phase 7: Settings & Polish

### Goal

Complete settings UI and polish overall experience.

### Tasks

1. **Add settings UI**
   - Quiet hours toggle and time pickers
   - Nudge cooldown setting
   - Default settings for new tasks (if applicable)

2. **Polish Priority Queue UX**
   - Empty states
   - Loading states
   - Error handling

3. **Polish score breakdown**
   - Clear explanations
   - Helpful hints about future priority changes

4. **End-to-end testing**
   - Full workflow testing
   - Edge case handling

5. **Documentation updates**
   - Update relevant documentation
   - Add any new patterns to CLAUDE.md if applicable

### Validation

- [ ] Settings save and load correctly
- [ ] All edge cases handled gracefully
- [ ] UX is polished and consistent
- [ ] Documentation is current

### Output

- Complete settings UI
- Polished experience
- Updated documentation

---

## Dependencies Graph

```
Phase 0 (Task Details Refactor)
    │
    └──► Phase 1 (Data Model)
             │
             ├──► Phase 2 (Priority Calculation)
             │        │
             │        ├──► Phase 3 (Priority Queue View + Fields UI)
             │        │
             │        └──► Phase 6 (Energy System)
             │
             └──► Phase 4 (Start Nudge Updates)
                      │
                      └──► Phase 5 (Orchestrator)

Phase 7 (Settings & Polish) depends on all above
```

---

## Risk Mitigation

### Risk: Priority calculation feels wrong to user

**Mitigation:**
- Expose score breakdown for transparency
- Allow importance override
- Tune weights based on feedback

### Risk: Too many nudges feel nagging

**Mitigation:**
- Deduplication layer (15 min cooldown)
- Quiet hours
- Priority queue ensures only important things surface

### Risk: Energy input is friction

**Mitigation:**
- Make energy optional
- Quick single-tap input
- Don't require for basic functionality

### Risk: Complex implementation

**Mitigation:**
- Phased approach
- Each phase independently valuable
- Clear validation criteria

---

## Session Planning Notes

Each phase should start with Claude Code examining current implementation:

1. "Examine the current [X] implementation to understand patterns and integration points"
2. "Propose approach for [new functionality]"
3. "Implement after approval"

This ensures UI integration follows existing patterns rather than specifying UI details upfront.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `TASK_DETAILS_REFACTOR_SPEC.md` | Phase 0 specification |
| `TASK_DETAILS_REFACTOR_PROMPTS.md` | Phase 0 prompts |
| `NUDGE_SYSTEM_DATA_MODEL.md` | Data structures |
| `NUDGE_SYSTEM_MVP_SPEC.md` | Behavior specification |
| `NUDGE_ORCHESTRATOR_APPROACHES.md` | Architectural options |
| `NUDGE_SYSTEM_CLAUDE_CODE_PROMPTS.md` | Implementation prompts (Phases 1-7) |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial implementation plan |
