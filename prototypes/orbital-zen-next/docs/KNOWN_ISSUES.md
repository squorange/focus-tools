# Known Issues & Regression Prevention

This document tracks recurring issues, their root causes, and how to prevent them from returning.

---

## 1. Angular Position Jumps on Subtask Completion

**Status:** Fixed (2025-11-10)
**Severity:** High - UX regression
**Frequency:** Recurred 3+ times

### Symptom
When completing a subtask:
1. Subtask fades away ✓
2. Remaining subtasks smoothly shift inward to next orbital ring ✓
3. **BUG:** After radial transition completes, subtasks suddenly jump to new angular positions ✗

### Expected Behavior
Remaining subtasks should maintain their angular positions (no rotation) while transitioning inward radially.

### Root Cause Analysis

**Core Issue:** Orbital positions (angles and radii) not properly persisted or calculated from wrong index.

**Technical Details:**
1. `assignedStartingAngle` must be based on **original array index**, not filtered/active index
2. If angles aren't persisted to database, they get recalculated on re-render
3. Fallback calculation in `SolarSystemView.tsx` used filtered array index
4. Sample data in `offline-store.ts` didn't include orbital positions

**Why This Keeps Recurring:**

The bug is architectural, not a simple code error:
- **Data Layer:** Sample data missing required fields
- **Persistence Layer:** New code paths forget to save initialized positions
- **Render Layer:** Fallback logic uses wrong index source
- **Type System:** Orbital fields are optional, so TypeScript can't catch missing data

### Prevention Strategy

**✅ Fixes Applied (2025-11-10):**

1. **Sample Data Initialization** (offline-store.ts:188-251)
   - All sample subtasks now include `assignedStartingAngle` and `assignedOrbitRadius`
   - No silent failures on fresh installs

2. **Persistence in All Load Paths** (page.tsx:48-50, 65-68, 89-92)
   - Added `saveTask()` calls after `initializeSubtaskOrbits()` in all three load paths
   - Ensures angles are persisted to database immediately

3. **Fixed Fallback Logic** (SolarSystemView.tsx:274-280)
   - Changed from filtered `index` to `originalIndex` via `findIndex()`
   - Defensive programming - works even if data is missing

4. **Comprehensive Documentation** (orbit-utils.ts:1-95)
   - Added critical invariants header explaining the rules
   - Includes checklist for modifying task/subtask creation code
   - Tracks regression history

**🔍 How to Detect This Issue:**

```typescript
// In browser console after loading tasks:
const task = tasks[0];
console.log('Subtask angles:', task.subtasks?.map(st => ({
  id: st.id,
  angle: st.assignedStartingAngle,
  radius: st.assignedOrbitRadius
})));

// If angles are undefined → persistence issue
// If angles change after completion → calculation issue
```

**🛡️ How to Prevent Recurrence:**

When adding new features that create/load/modify tasks:

1. **Checklist:**
   - [ ] Does new code call `initializeSubtaskOrbits()`?
   - [ ] Does it call `saveTask()` after initialization?
   - [ ] Have you tested subtask completion to verify no angular jumps?

2. **Test Procedure:**
   - Create task with 3+ subtasks
   - Note angular positions (e.g., subtask at 12 o'clock position)
   - Complete middle subtask
   - Verify remaining subtasks stay at same angles while moving inward

3. **Code Review Points:**
   - Search for `new.*Subtask` or `subtasks.*map` patterns
   - Verify orbital positions are initialized
   - Verify task is saved to database

**📚 Related Files:**
- `app/lib/orbit-utils.ts` - Orbital calculation logic + invariants documentation
- `app/lib/offline-store.ts` - Sample data initialization
- `app/page.tsx` - Task loading and persistence
- `app/components/SolarSystemView.tsx` - Rendering with fallback logic

**🔗 Related Concepts:**
- IndexedDB persistence
- React state management and re-rendering
- CSS transform transitions
- Array index vs filtered index

---

## 2. Priority Belt Position Tracking

**Status:** Fixed (2025-11-10)
**Severity:** Medium - Logic bug
**Frequency:** Recurred 2+ times

### Symptom
When completing priority subtasks:
- Belt moves inward but kicks out items that should stay inside
- Undo doesn't restore belt position correctly
- Manual belt repositioning doesn't sync with orbital view

### Root Cause
Belt position calculation counted remaining priority items instead of tracking stacking order relative to original array positions.

### Fix
Changed `getCurrentMarkerRing()` to:
1. Find last priority item in original array order
2. Count active items from start up to that position
3. Belt appears on ring after those active items

### Prevention
- See `orbit-utils.ts` INVARIANT #4 for belt tracking rules
- Test: Complete priority items and verify belt stays outside remaining priority items

---

## 3. Database Version Mismatch

**Status:** Fixed (2025-11-10)
**Severity:** High - Breaking bug
**Frequency:** One-time

### Symptom
```
DOMException: The operation failed because the stored database is a higher version than the version requested.
```

### Root Cause
`focus-session.ts` opened database with version 4 while `offline-store.ts` used version 5.

### Fix
Synchronized all `openDB()` calls to use version 5.

### Prevention
- Single source of truth: Export DB version constant from `offline-store.ts`
- Search codebase for `openDB` before incrementing version
- Add comment: "// MUST match DB_VERSION in offline-store.ts"

---

## Template for New Issues

```markdown
## N. [Issue Name]

**Status:** Active | Fixed | Monitoring
**Severity:** High | Medium | Low
**Frequency:** One-time | Occasional | Recurrent

### Symptom
[What the user sees]

### Root Cause
[Technical explanation]

### Fix
[What was changed]

### Prevention
[How to avoid recurrence]

### Related Files
- [List of affected files]
```

---

## Regression Prevention Workflow

### For Developers

1. **Before Starting Work:**
   - Read relevant sections in this document
   - Check `orbit-utils.ts` invariants if working with subtasks
   - Review previous fixes for similar features

2. **During Development:**
   - Follow checklists in code comments
   - Run manual test procedures listed above
   - Add console.log validation in dev mode

3. **Before Committing:**
   - Verify all invariants still hold
   - Test completion/undo flows
   - Update regression history if bug recurred

### For AI Assistants

1. **Session Start:**
   - Read this document and relevant invariants
   - Check for patterns in regression history
   - Note what keeps breaking and why

2. **During Work:**
   - Reference invariants when making changes
   - Add defensive checks proactively
   - Update documentation when finding gaps

3. **Session End:**
   - Update regression history with date if bug recurred
   - Add new issues discovered
   - Note any patterns or architectural weaknesses

---

## Metrics

**Total Known Regressions:** 3
**Most Frequent Issue:** Angular position jumps (3+ occurrences)
**Average Time to Fix:** ~2 hours
**Average Time Between Recurrences:** ~2-3 days

**Goal:** Reduce recurrence rate by 80% through improved documentation and defensive programming.

---

*Last Updated: 2025-11-10*
