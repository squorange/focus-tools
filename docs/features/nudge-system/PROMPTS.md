# Nudge System — Claude Code Prompts

> **Status:** Draft  
> **Created:** January 2026  
> **Purpose:** Session-scoped prompts for implementing the nudge system (Phases 1-7)

---

## Prerequisites

### Complete Phase 0 First

Before using these prompts, complete the **Task Details Refactor** (Phase 0):

- `TASK_DETAILS_REFACTOR_SPEC.md` — Specification
- `TASK_DETAILS_REFACTOR_PROMPTS.md` — Claude Code prompts

Phase 0 establishes the UI structure (sections, pills, priority display) that these phases build upon.

---

## How to Use This Document

Each prompt is designed for a single Claude Code session. Before starting:

1. Ensure previous phase is complete
2. Commit any pending changes
3. Read the relevant specification sections

**Key principle:** These prompts ask Claude Code to examine current implementation before proposing UI or integration approaches. Do not implement UI without examining existing patterns first.

---

## Phase 1: Data Model

### Prompt 1.1: Examine Current Types

```
Examine the current type definitions in the codebase, focusing on:

1. Task interface - where is it defined, what fields exist
2. UserState or AppState - how is user state managed
3. UserSettings - where are settings defined
4. Any existing enum types for task properties

Report back with:
- File locations for each
- Current field patterns
- Naming conventions used
- How nullable fields are handled

Do not make changes yet.
```

### Prompt 1.2: Add New Type Definitions

```
Based on the NUDGE_SYSTEM_DATA_MODEL.md specification, add the following type definitions to the appropriate location(s):

New types to create:
- ImportanceLevel = 'must_do' | 'should_do' | 'could_do' | 'would_like_to'
- EnergyType = 'energizing' | 'neutral' | 'draining'
- EnergyLevel = 'high' | 'medium' | 'low'
- PriorityTier = 'critical' | 'high' | 'medium' | 'low'

Follow existing patterns for type definitions in this codebase.
```

### Prompt 1.3: Extend Task Interface

```
Extend the Task interface with the following new fields:

Task fields to add:
- importance: ImportanceLevel | null (default null)
- importanceSource: 'self' | 'partner' | null (default null)
- importanceNote: string | null (default null)
- energyType: EnergyType | null (default null)
- leadTimeDays: number | null (default null)
- leadTimeSource: 'manual' | 'ai' | null (default null)

Follow existing patterns for optional fields.
```

### Prompt 1.4: Extend User State

```
Extend the user state (UserState, AppState, or equivalent) with:

- currentEnergy: EnergyLevel | null (default null)
- currentEnergySetAt: number | null (default null)

Examine how user state is managed and follow existing patterns.
```

### Prompt 1.5: Extend Settings

```
Extend the settings interface with:

- quietHoursEnabled: boolean (default false)
- quietHoursStart: string | null (default "22:00")
- quietHoursEnd: string | null (default "07:00")
- nudgeCooldownMinutes: number (default 15)

Follow existing settings patterns.
```

### Prompt 1.6: Schema Migration

```
Create or update the schema migration to:

1. Bump schema version
2. Add new Task fields with null defaults to existing tasks
3. Initialize new settings with defaults
4. Initialize user state energy fields

Examine existing migration patterns and follow them.

Test that migration runs without errors and existing data is preserved.
```

---

## Phase 2: Priority Calculation

### Prompt 2.1: Create Priority Utils File

```
Create a new utility file for priority calculation (suggest appropriate location based on existing util patterns).

The file should export:
- calculatePriorityScore(task: Task, userState: UserState): number
- getPriorityTier(score: number): PriorityTier
- getEffectiveDeadline(task: Task): Date | null

For now, implement getEffectiveDeadline:
- If task has no deadlineDate, return null
- Otherwise, return deadlineDate minus leadTimeDays (default 0)

Stub the other functions to return 0 and 'low' respectively.
```

### Prompt 2.2: Implement Component Score Functions

```
In the priority utils file, implement the component score functions per NUDGE_SYSTEM_MVP_SPEC.md:

1. getImportanceScore(importance: ImportanceLevel | null): number
   - must_do: +25
   - should_do: +15
   - could_do: +5
   - would_like_to: +0
   - null: +10

2. getTimePressureScore(task: Task): number
   - Use getEffectiveDeadline
   - Passed: +40
   - Today/tomorrow: +35
   - Within 7 days: +15
   - Within 30 days: +5
   - Otherwise: +0

3. getSourceScore(task: Task): number
   - Partner source: +20
   - Work/external: +15
   - Other: +0

4. getStalenessScore(updatedAt: number): number
   - >14 days: +15
   - >7 days: +8
   - Otherwise: +0

5. getDeferScore(deferredCount: number): number
   - >=3: +10
   - >=1: +5
   - 0: +0

6. getStreakRiskScore(task: Task): number
   - Only for recurring tasks
   - Streak >7: +12
   - Streak >=3: +6
   - Otherwise: +0

7. getEnergyMatchScore(taskEnergy: EnergyType | null, userEnergy: EnergyLevel | null): number
   - If userEnergy is null, return 0
   - If taskEnergy is null, return 0
   - Optimal match: +8
   - Mismatch: -5
   - Neutral: +0
   
   Matching logic:
   - High energy user → draining tasks optimal
   - Low energy user → energizing tasks optimal
   - Medium energy → neutral

Make sure to handle edge cases (null values, missing fields).
```

### Prompt 2.3: Implement Full Calculation

```
Implement the full calculatePriorityScore function that:

1. Calls each component score function
2. Sums the results
3. Returns total score

Also implement getPriorityTier:
- 60+: 'critical'
- 40-59: 'high'
- 20-39: 'medium'
- 0-19: 'low'

Add a helper function getTaskPriorityInfo(task, userState) that returns:
{
  score: number,
  tier: PriorityTier,
  effectiveDeadline: Date | null,
  breakdown: {
    importance: number,
    timePressure: number,
    source: number,
    staleness: number,
    streakRisk: number,
    defer: number,
    energyMatch: number
  }
}
```

### Prompt 2.4: Add Tests

```
Add unit tests for the priority calculation functions.

Test cases should cover:
- Each importance level
- Various deadline scenarios (overdue, today, this week, this month, far out, none)
- Effective deadline calculation with lead time
- Source scoring
- Staleness thresholds
- Defer count thresholds
- Streak risk for recurring vs non-recurring
- Energy matching combinations
- Tier threshold boundaries (59→high, 60→critical, etc.)

Follow existing test patterns in the codebase.
```

---

## Phase 3: Priority Queue View

### Prompt 3.1: Examine Notifications Hub

```
Examine the current Notifications Hub implementation:

1. Where is it located (file path)?
2. What is its current structure (tabs, sections, modules)?
3. How does it display notifications?
4. What patterns are used for grouping/sorting?
5. How does it integrate with the rest of the app?

Report back with findings and suggest where/how to add a Priority Queue module.

Do not make changes yet.
```

### Prompt 3.2: Create Priority Queue Data Layer

```
Create data layer functions for the Priority Queue:

1. getTasksForPriorityQueue(tasks: Task[], userState: UserState): PriorityQueueTask[]
   - Filter out completed and archived tasks
   - Calculate priority for each task
   - Sort by priority score descending

2. groupTasksByTier(tasks: PriorityQueueTask[]): Record<PriorityTier, PriorityQueueTask[]>
   - Group tasks by their priority tier

Interface:
```typescript
interface PriorityQueueTask {
  task: Task;
  priorityInfo: {
    score: number;
    tier: PriorityTier;
    effectiveDeadline: Date | null;
    breakdown: { /* component scores */ };
  };
}
```

Place in appropriate location following existing patterns.
```

### Prompt 3.3: Propose Priority Queue UI Integration

```
Based on your examination of the Notifications Hub, propose how to add the Priority Queue:

Consider:
1. Should it be a new tab, a top module, or replace existing content?
2. How should tiers be displayed (collapsible sections, cards, list items)?
3. How should individual tasks be displayed (reuse existing components or new)?
4. Where should the score breakdown be shown (expandable, modal, inline)?

Provide 2-3 options with tradeoffs. Wait for approval before implementing.
```

### Prompt 3.4: Implement Priority Queue UI

```
[After approach is approved]

Implement the Priority Queue UI based on the approved approach:

1. Create necessary components
2. Integrate with Notifications Hub
3. Connect to data layer functions
4. Implement tier grouping display
5. Add task item display with basic info

Use existing component patterns and styling.

Do not implement score breakdown yet (next prompt).
```

### Prompt 3.5: Implement Score Breakdown

```
Add score breakdown visibility to Priority Queue task items:

1. Add info icon/button to each task item
2. On tap, show breakdown:
   - Each component with its point contribution
   - Total score and resulting tier
   - Brief explanation of what would change priority

Make the breakdown expandable/collapsible or use appropriate pattern from existing UI.
```

### Prompt 3.6: Examine Task Detail for New Fields

```
Examine the current Task Detail implementation:

1. Where is it located?
2. How are fields currently displayed and edited?
3. What input components are used (dropdowns, toggles, text inputs)?
4. Where would importance, energy type, and lead time fields fit?

Report findings and propose integration approach. Wait for approval before implementing.
```

### Prompt 3.7: Add New Fields to Task Detail

```
[After approach is approved]

Add the following fields to Task Detail:

1. Importance
   - Dropdown with options: Must Do, Should Do, Could Do, Would Like To, Not Set
   - Show brief description for each level
   - Optional note field

2. Energy Type
   - Dropdown with options: Energizing, Neutral, Draining, Not Set
   - Show brief description for each

3. Lead Time
   - Number input or preset dropdown (Same day, Few days, 1 week, 2 weeks, 1 month, Custom)
   - Only relevant when deadline is set
   - Show computed "Start by" date when deadline and lead time both set

Follow existing Task Detail patterns for field layout and styling.
```

---

## Phase 4: Start Nudge Updates

### Prompt 4.1: Examine Start Nudge Implementation

```
Examine the current Start Nudge implementation:

1. Where is the calculation logic?
2. How are nudges scheduled?
3. What notification types exist?
4. How is the notification content/message constructed?

Report findings. We need to:
- Add a new 'runway_nudge' notification type
- Keep execution nudge using raw deadline
- Add runway nudge for tasks with leadTimeDays > 0

Do not make changes yet.
```

### Prompt 4.2: Add Runway Nudge Type

```
Add the 'runway_nudge' notification type:

1. Update notification type definitions
2. Add icon mapping (suggest appropriate icon)
3. Add color scheme (suggest appropriate color)

Follow existing patterns for notification types.
```

### Prompt 4.3: Implement Runway Nudge Calculation

```
Add runway nudge calculation:

1. Create function calculateRunwayNudgeTime(task: Task): Date | null
   - Return null if task has no deadline or leadTimeDays <= 0
   - Return effectiveDeadline minus 1 day

2. Update the nudge scheduling logic to:
   - Schedule runway nudge for tasks with leadTimeDays > 0
   - Keep existing execution nudge scheduling unchanged
   - Both can fire for the same task

3. Construct appropriate message for runway nudge:
   - "Time to start: [task title]"
   - "You'll need about [N days/weeks]. Due [deadline]."
```

### Prompt 4.4: Test Start Nudge Changes

```
Test the updated Start Nudge logic:

1. Task with deadline, no lead time → only execution nudge
2. Task with deadline and lead time → both nudges scheduled
3. Task with no deadline → no nudges
4. Verify runway nudge fires 1 day before effective deadline
5. Verify execution nudge fires at deadline - duration - buffer

Report any issues found.
```

---

## Phase 5: Orchestrator

### Prompt 5.1: Examine Notification Firing

```
Examine how notifications are currently fired:

1. Where is the notification firing logic?
2. How are scheduled notifications checked/triggered?
3. Is there any existing coordination or queuing?
4. How would we insert an orchestrator layer?

Report findings and propose where to implement the orchestrator.
```

### Prompt 5.2: Implement Deduplication Layer

```
Implement deduplication for notifications:

1. Track last nudge time per task
   - Store in appropriate state/storage
   - Structure: { [taskId]: lastNudgedAt: number }

2. Create function shouldFireNudge(taskId: string): boolean
   - Get cooldown from settings (default 15 min)
   - Return true if no previous nudge or cooldown elapsed
   - Return false if within cooldown period

3. Integrate with notification firing:
   - Check shouldFireNudge before firing
   - Update lastNudgedAt after firing
```

### Prompt 5.3: Implement Priority Ordering

```
Implement priority ordering for pending nudges:

1. Define nudge type priorities:
   ```
   deadline_critical: 100
   deadline_approaching: 80
   runway_nudge: 75
   execution_nudge: 70
   manual_reminder: 60
   routine_streak: 40
   stale_task: 30
   ```

2. When multiple nudges are pending:
   - Collect all pending nudges
   - Sort by priority
   - Fire highest priority (others suppressed for now)

3. Integrate with notification firing flow
```

### Prompt 5.4: Implement Quiet Hours

```
Implement quiet hours handling:

1. Create function isQuietHours(): boolean
   - Check settings for quietHoursEnabled
   - Compare current time to start/end times
   - Handle overnight ranges (e.g., 22:00 to 07:00)

2. Create function getEffectiveChannel(nudge, priority): channel
   - If quiet hours and priority < 60: return 'badge'
   - Otherwise: return nudge's original channel

3. Integrate with notification firing:
   - Apply channel downgrade during quiet hours
   - Critical priority (60+) bypasses downgrade
```

---

## Phase 6: Energy System

### Prompt 6.1: Examine UI for Energy Input

```
Examine the current UI to identify integration points for energy input:

1. Navbar/header area - is there space for a quick toggle?
2. AI Palette - what quick actions exist, how are they structured?
3. Settings - how are user preferences displayed?
4. Any existing mood/state input patterns?

Report findings and propose 2-3 options for where to add energy input.
Wait for approval before implementing.
```

### Prompt 6.2: Implement Energy Input

```
[After approach is approved]

Implement energy input based on approved approach:

1. Create UI component for energy selection
   - Options: High, Medium, Low
   - Show current selection
   - Quick single-tap to change

2. Connect to user state
   - Update currentEnergy on selection
   - Update currentEnergySetAt timestamp

3. Show when last set (optional, for user awareness)
```

### Prompt 6.3: Implement Energy Filtering

```
Add energy-aware filtering to Priority Queue:

1. Create function filterByEnergy(tasks, userEnergy): { matching, hidden }
   - If userEnergy is null, return all tasks as matching
   - Otherwise, filter based on energy match rules:
     - High energy: prioritize deep/draining tasks
     - Low energy: prioritize quick/energizing tasks
     - Medium energy: no filtering

2. Critical override: tasks with priority tier 'critical' always in matching

3. Update Priority Queue to:
   - Show matching tasks normally
   - Show count of hidden tasks
   - Allow user to reveal hidden tasks

4. When showing mismatched critical task, indicate the mismatch
```

---

## Phase 7: Settings & Polish

### Prompt 7.1: Examine Settings UI

```
Examine the current Settings UI:

1. Where are settings displayed?
2. What input types are used (toggles, dropdowns, time pickers)?
3. How are settings grouped/organized?
4. How are settings persisted?

Report findings and propose where to add nudge system settings.
```

### Prompt 7.2: Add Settings UI

```
Add settings UI for nudge system:

1. Quiet Hours section:
   - Toggle to enable/disable
   - Time picker for start time
   - Time picker for end time

2. Nudge Cooldown:
   - Number input or preset options (5, 10, 15, 30 min)

Place in appropriate location following existing settings patterns.
Ensure changes persist correctly.
```

### Prompt 7.3: Polish and Edge Cases

```
Review and polish the implementation:

1. Empty states:
   - Priority Queue with no tasks
   - No tasks in a tier

2. Loading states:
   - While calculating priorities
   - While loading tasks

3. Error handling:
   - Invalid data
   - Missing required fields

4. Accessibility:
   - Screen reader support
   - Keyboard navigation

5. Visual consistency:
   - Colors match existing design
   - Typography consistent
   - Spacing follows patterns

Report any issues found and fix them.
```

### Prompt 7.4: End-to-End Testing

```
Perform end-to-end testing of the nudge system:

Test flows:
1. Create task with importance, energy type, lead time
2. Verify priority calculation and tier assignment
3. Verify task appears in correct tier in Priority Queue
4. Verify score breakdown is accurate
5. Set deadline with lead time, verify runway nudge scheduling
6. Set user energy, verify filtering works
7. Test quiet hours (may need to mock time)
8. Test deduplication (try triggering multiple nudges)

Report any issues found.
```

### Prompt 7.5: Documentation Update

```
Update documentation:

1. Add new files to DOCUMENTATION_INDEX.md
2. Update ASSESSMENT_AND_GAPS.md with new capabilities
3. Update any other relevant docs

Review NUDGE_SYSTEM_*.md files for accuracy based on implementation.
Note any deviations from spec that should be documented.
```

---

## Troubleshooting Prompts

### If Types Don't Compile

```
There are TypeScript errors after adding the new types. Please:

1. Show me the exact error messages
2. Identify which files are affected
3. Propose fixes

Common issues:
- Missing imports
- Incompatible type assignments
- Existing code expecting old types
```

### If Migration Fails

```
The schema migration is failing. Please:

1. Show me the error
2. Check if there's existing data that doesn't match expected format
3. Propose a fix that preserves existing data
```

### If Priority Calculation Seems Wrong

```
The priority calculation doesn't match expectations. For this task:
[paste task details]

Expected priority: [X]
Actual priority: [Y]

Please:
1. Show the breakdown of each component score
2. Identify which component is off
3. Check the calculation logic
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `NUDGE_SYSTEM_DATA_MODEL.md` | Data structures reference |
| `NUDGE_SYSTEM_MVP_SPEC.md` | Behavior specification |
| `NUDGE_ORCHESTRATOR_APPROACHES.md` | Architectural context |
| `NUDGE_SYSTEM_IMPLEMENTATION_PLAN.md` | Phase overview |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial prompts |
