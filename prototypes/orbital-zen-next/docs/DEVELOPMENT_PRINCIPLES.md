# Development Principles & Standards

**Established: 2025-11-10**

This document codifies the development principles, patterns, and standards to be applied to ALL future work on this project. These emerged from addressing recurring regressions and are proven to prevent issues.

---

## Core Philosophy

**"Document where it's read, validate where it runs, explain why not what"**

1. **Prevention > Reaction**: Invest in preventing regressions rather than repeatedly fixing them
2. **Context Preservation**: Make implicit knowledge explicit through documentation
3. **Developer Experience**: Optimize for ease of understanding and modification
4. **Defensive Programming**: Assume data might be missing, provide fallbacks
5. **Fail Fast in Dev**: Catch issues immediately with validation, not during testing

---

## Mandatory Practices

### 1. Invariant Documentation (CRITICAL)

**When:** Any complex logic with non-obvious requirements

**Where:** At the top of the file containing the logic

**Format:**

```typescript
/**
 * CRITICAL INVARIANTS
 *
 * INVARIANT #1: [Name]
 * ═══════════════════════════════════════════
 *
 * [Description of what must be true]
 *
 * ✅ CORRECT:   [Example]
 * ❌ INCORRECT: [Example]
 *
 * Why: [Consequence if violated]
 *
 * Test: [How to verify]
 *
 * INVARIANT #2: [Name]
 * ...
 */
```

**Examples:**

- orbit-utils.ts lines 1-95 (orbital positioning invariants)

---

### 2. Checklist Comments at Risk Points

**When:** Functions that:

- Have caused bugs/regressions before
- Modify critical state (orbital positions, belt tracking)
- Require specific calling patterns (initialization + persistence)
- Have complex preconditions or postconditions

**Format:**

```typescript
/**
 * [Function description]
 *
 * CHECKLIST when modifying this function:
 * [ ] [Requirement 1]
 * [ ] [Requirement 2]
 * [ ] [Requirement 3]
 * [ ] Test: [Test scenario to verify]
 * [ ] See [reference to related docs/invariants]
 */
```

**Examples:**

- AIPanel.tsx handleAddSubtask (lines 139-149)
- AIPanel.tsx handleSubtaskToggle (lines 171-182)
- orbit-utils.ts initializeSubtaskOrbits (lines 210-232)
- orbit-utils.ts recalculateRadii (lines 179-197)

---

### 3. Runtime Validation in Development

**When:** Any data that:

- Must be persisted but might be missing
- Has specific format/calculation requirements
- Has caused bugs when incorrect

**Pattern:**

```typescript
export function validateXYZ(data: Type): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!data.requiredField) {
    errors.push(`Missing requiredField. This will cause [problem]. ` + `Fix by [solution].`);
  }

  // Check format/invariants (warnings for suspicious but possibly valid)
  if (data.field !== expectedValue) {
    warnings.push(`Field has unexpected value. May indicate [issue].`);
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

// Use only in development
if (process.env.NODE_ENV === 'development') {
  const result = validateXYZ(data);
  logValidationResults(result, context);
}
```

**Examples:**

- orbit-utils.ts validateOrbitalInvariants (lines 332-418)
- page.tsx validation calls (lines 54-62, 82-90, 117-125)

---

### 4. Comprehensive Type Documentation

**When:** All public interfaces, especially:

- Fields with non-obvious requirements
- Fields that have caused bugs
- Fields with dynamic behavior
- Fields that require coordination with other code

**Format:**

```typescript
/**
 * [Field purpose - one line]
 *
 * CRITICAL REQUIREMENTS: (if applicable)
 * - MUST [requirement 1]
 * - MUST [requirement 2]
 * - MUST NOT [anti-pattern]
 *
 * DYNAMIC BEHAVIOR: (if applicable)
 * - [How it changes over time]
 * - [What triggers changes]
 *
 * [Detailed explanation of behavior]
 *
 * Calculated by: `[function name]`
 * Persisted by: `[function name]`
 *
 * @see [related file/invariant] for details
 * @see [related docs] for context
 *
 * @example
 * // [Example usage with explanation]
 */
fieldName: type;
```

**Examples:**

- types.ts Subtask.assignedStartingAngle (lines 66-91)
- types.ts Subtask.assignedOrbitRadius (lines 93-114)
- types.ts Task.priorityMarkerRing (lines 39-59)

---

### 5. Regression Tracking

**When:** Any bug that:

- Has occurred before
- Could recur in different contexts
- Has a non-obvious root cause
- Requires specific prevention strategies

**Where:** docs/KNOWN_ISSUES.md

**Format:**

```markdown
## N. [Issue Name]

**Status:** Fixed | Active | Monitoring
**Severity:** High | Medium | Low
**Frequency:** One-time | Occasional | Recurrent

### Symptom

[What the user/developer sees]

### Root Cause

[Technical explanation]

### Fix

[What was changed]

### Prevention

[How to avoid recurrence]

- Checklist when [scenario]
- Test procedure: [steps]
- Files to check: [list]

### Related Files

- [file:line] - [why relevant]

### History

- 2025-MM-DD: [What happened]
```

**Examples:**

- docs/KNOWN_ISSUES.md section 1 (Angular position jumps)
- docs/KNOWN_ISSUES.md section 2 (Belt position tracking)

---

## Recommended Practices

### 6. Why-Comments Over What-Comments

**Avoid:**

```typescript
// Increment counter
counter++;

// Loop through subtasks
subtasks.forEach(st => { ... });
```

**Prefer:**

```typescript
// Track active position separately from array index to enable inward shifting
// while keeping angular positions stable (see INVARIANT #1)
let activeIndex = 0;

// Use findIndex to get original position instead of filtered index because
// angles must stay fixed when items complete
const originalIndex = parentTask.subtasks?.findIndex((st) => st.id === subtask.id);
```

---

### 7. Defensive Fallback Logic

**Pattern:**

```typescript
// Try to use persisted value
const value = data.persistedValue !== undefined ? data.persistedValue : calculateFallback(); // Safe fallback using correct logic

// Document why fallback is needed
// FALLBACK: If persistedValue is missing (e.g., migration, manual DB edit),
// calculate using [correct method]. See INVARIANT #X for requirements.
```

**Examples:**

- SolarSystemView.tsx lines 271-285 (angle fallback using original index)

---

### 8. Persistence Pattern

**Always pair initialization with persistence:**

```typescript
// ❌ BAD: Initialize but don't save
const initialized = initializeData(data);
setState(initialized);

// ✅ GOOD: Initialize AND save
const initialized = initializeData(data);
await saveToDatabase(initialized);
setState(initialized);
```

**When loading data:**

```typescript
// Load from source
const data = await fetchData();

// Initialize if needed
const initialized = initializeIfNeeded(data);

// Save back to persist initialization
await saveData(initialized);

// THEN set state
setState(initialized);

// Validate in development
if (process.env.NODE_ENV === 'development') {
  validate(initialized);
}
```

**Examples:**

- page.tsx lines 38-62 (load → initialize → save → validate)

---

## Code Review Checklist

Before committing code that touches tasks/subtasks/orbital system:

**Required:**

- [ ] Added/updated invariant documentation if logic changed
- [ ] Added checklist comments to new high-risk functions
- [ ] Added JSDoc to new public interfaces
- [ ] Implemented runtime validation for new required data
- [ ] Followed initialization + persistence pattern
- [ ] Tested completion/undo flows manually
- [ ] Verified no angular jumps when completing subtasks
- [ ] Updated KNOWN_ISSUES.md if fixing a regression

**Recommended:**

- [ ] Added defensive fallback logic for missing data
- [ ] Included why-comments for non-obvious code
- [ ] Cross-referenced related invariants/docs
- [ ] Tested with fresh database (clear + reload)

---

## Testing Standards

### Manual Test Procedures

**Core Orbital Functionality:**

1. Clear database via `/clear-db.html`
2. Refresh app to load sample data
3. Open DevTools console - verify no validation errors
4. Click on task with 4+ subtasks (e.g., "Call dentist")
5. Note angular positions of all subtasks
6. Complete first subtask
7. **VERIFY:** Remaining subtasks shift inward radially
8. **VERIFY:** Remaining subtasks stay at same angles (no rotation)
9. Undo completion
10. **VERIFY:** Subtask returns to original position
11. **VERIFY:** Belt moves outward if priority item

**Priority Belt:**

1. Enable priority belt on task with 3+ subtasks
2. Complete priority item
3. **VERIFY:** Belt shifts inward maintaining stacking order
4. **VERIFY:** Belt stays outside remaining priority items
5. Complete all priority items
6. **VERIFY:** Belt moves to ring 0 (celebration mode)

---

## Session Workflow

### Starting a New Session (AI or Human)

**Required Reading (5 min):**

1. docs/KNOWN_ISSUES.md - Check active issues
2. docs/DEVELOPMENT_PRINCIPLES.md (this file) - Review standards
3. If working with orbital system: orbit-utils.ts header (lines 1-95)

**Before Making Changes:**

1. Read relevant checklist comments in functions you'll modify
2. Check type documentation for fields you'll use
3. Review related invariants

### During Work

**When adding/modifying features:**

1. Follow checklist comments
2. Apply initialization + persistence pattern
3. Add runtime validation for new required data
4. Update type documentation if changing interfaces
5. Test manually using procedures above

**When fixing bugs:**

1. Understand root cause before coding
2. Check if issue exists in KNOWN_ISSUES.md
3. Fix structural cause, not just symptoms
4. Add prevention strategies (validation, docs, etc.)

### Ending a Session

**Update Documentation:**

1. Add to KNOWN_ISSUES.md if bug recurred (with date)
2. Update regression history with patterns observed
3. Flag architectural concerns for future work

**Clean Up:**

1. Remove debug console.logs
2. Verify no validation errors in dev mode
3. Run manual test procedures
4. Check for TODO comments that should be addressed

---

## Anti-Patterns to Avoid

### ❌ Don't Do This

**1. Commenting out validation:**

```typescript
// if (process.env.NODE_ENV === 'development') {
//   validateData(data); // TODO: Fix validation errors
// }
```

**Why:** Hides problems instead of fixing them

**2. Calculating from filtered index:**

```typescript
const angle = getSubtaskAngle(index, subtasks.length);
// BUG: 'index' is from filtered array, not original
```

**Why:** Causes angular jumps (INVARIANT #1 violation)

**3. Initialize without saving:**

```typescript
const initialized = initializeSubtaskOrbits(task.subtasks);
setTask({ ...task, subtasks: initialized });
// BUG: Not saved to database!
```

**Why:** Lost on next load, causes regression

**4. Silent failure:**

```typescript
function getData() {
  const data = fetchData();
  if (!data.requiredField) {
    return defaultValue; // Silent!
  }
}
```

**Why:** Hides problems, makes debugging hard

**5. What-comments:**

```typescript
// Set angle to -90
const angle = -90;
```

**Why:** Obvious from code, doesn't explain "why"

---

## Pattern Library

### Pattern: Initialization with Validation

```typescript
async function loadData() {
  // 1. Load from source
  const rawData = await fetchFromDatabase();

  // 2. Initialize missing fields
  const initialized = initializeRequiredFields(rawData);

  // 3. Persist initialization
  await saveToDatabase(initialized);

  // 4. Validate in development
  if (process.env.NODE_ENV === 'development') {
    const result = validateData(initialized);
    logValidationResults(result, 'Context');
  }

  // 5. Update state
  setState(initialized);
}
```

### Pattern: State Update with Recalculation

```typescript
async function updateItem(itemId: string, changes: Partial<Item>) {
  // 1. Get current state
  const currentItems = getCurrentItems();

  // 2. Apply changes
  const updatedItems = currentItems.map((item) =>
    item.id === itemId ? { ...item, ...changes } : item
  );

  // 3. Recalculate dependent values (preserve invariants!)
  const recalculated = recalculateDependentValues(updatedItems);

  // 4. Persist
  await saveToDatabase(recalculated);

  // 5. Update state
  setState(recalculated);
}
```

### Pattern: Validation Function

```typescript
export interface ValidationResult {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export function validateEntity(entity: Entity, context: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields (errors)
  if (!entity.requiredField) {
    errors.push(
      `[${context}] Missing requiredField. ` +
        `This will cause [specific problem]. ` +
        `Fix by calling [specific function].`
    );
  }

  // Check invariants (warnings for suspicious but valid)
  if (entity.field !== expectedValue) {
    warnings.push(
      `[${context}] Field has unexpected value ${entity.field}, ` +
        `expected ${expectedValue}. May indicate [issue].`
    );
  }

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

export function logValidationResults(result: ValidationResult, context?: string): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;

  const prefix = context ? `[Validation: ${context}]` : '[Validation]';

  if (result.errors.length > 0) {
    console.error(`${prefix} ERRORS:`, result.errors);
  }

  if (result.warnings.length > 0) {
    console.warn(`${prefix} Warnings:`, result.warnings);
  }
}
```

---

## Migration to Supabase

When migrating from IndexedDB to Supabase, these principles apply:

**Schema Design:**

- Include all fields with documentation in types.ts
- Required fields in TypeScript = NOT NULL in SQL
- Add database-level constraints where possible

**API Endpoints:**

- Follow initialization + persistence pattern
- Add server-side validation using validation functions
- Include runtime checks in development

**Data Migration:**

- Use initialization functions to populate missing fields
- Validate all migrated data
- Log validation results for manual review

**See:** docs/CONTEXT_PRESERVATION.md section "Supabase Migration Checklist"

---

## Success Metrics

Track effectiveness of these principles:

**Regression Rate:**

- Target: 0 recurrences of known issues per month
- Measure: Check KNOWN_ISSUES.md regression history

**Time to Understand:**

- Target: <10 min to understand new code section
- Measure: Self-assessment when reading code

**Time to Debug:**

- Target: <30 min from bug report to root cause
- Measure: Track time spent debugging vs implementing

**Validation Catch Rate:**

- Target: 100% of missing data caught by validation
- Measure: Count validation errors vs bugs found in testing

---

## Questions & Exceptions

**Q: When can I skip these practices?**
A:

- One-off prototyping/experiments (clearly marked as such)
- Pure UI styling changes (no logic)
- Emergency hotfixes (but add TODO to properly document later)

**Q: What if documentation becomes outdated?**
A: Update it! Documentation is code. If you find outdated docs:

1. Fix them immediately
2. Note in commit message
3. Consider why they got outdated (was pattern not followed?)

**Q: Isn't this over-engineering for a prototype?**
A: No. These practices:

- Prevent wasting time re-solving same problems
- Enable confident iteration
- Make AI assistance more effective
- Prepare for production without rewrites

**Q: What if I disagree with a principle?**
A: Propose changes! These principles should evolve. But:

1. Document your reasoning
2. Show evidence (bugs prevented/caused)
3. Update this doc with new approach
4. Don't silently ignore principles

---

## Principle Evolution

**How to update these principles:**

1. **Propose Change:**
   - Add comment to this file explaining rationale
   - Show evidence from real development experience
   - Suggest specific wording changes

2. **Trial Period:**
   - Try new approach on 2-3 features
   - Track impact (time saved, bugs prevented)
   - Document results

3. **Adopt or Reject:**
   - If successful: Update this doc
   - If unsuccessful: Document why in KNOWN_ISSUES.md
   - Either way: Share learnings

**Principle History:**

- 2025-11-10: Initial principles established from regression analysis
- [Future updates here]

---

_Last Updated: 2025-11-10_

_These principles are living documentation. Update them as we learn, but never silently ignore them._
