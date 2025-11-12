# Context Preservation & Session Continuity

How to maintain project knowledge across development sessions and prevent context loss.

---

## The Problem

**Context Loss Sources:**

1. **AI Session Boundaries:** Each session starts with limited context from summaries
2. **Human Memory Decay:** Developers forget implementation details over days/weeks
3. **Undocumented Decisions:** "Why did we do it this way?" gets lost
4. **Implicit Knowledge:** Crucial patterns exist only in code, not documentation
5. **Regression Amnesia:** Same bugs recur because fixes aren't well-documented

**Impact:**

- Rework: Solving same problems multiple times
- Regressions: Reintroducing fixed bugs
- Inefficiency: Debugging instead of building
- Frustration: "We fixed this before!"

---

## Solution Framework

### Tier 1: In-Code Documentation (Highest ROI)

**Where the code is read, the knowledge should live.**

#### A. Critical Invariants Comments

**Pattern:**

```typescript
/**
 * CRITICAL INVARIANT: [Rule that must not be broken]
 *
 * Why this matters: [Consequence if violated]
 *
 * Correct usage:
 * ✅ [Example of correct code]
 *
 * Incorrect usage:
 * ❌ [Example of what NOT to do]
 *
 * Test: [How to verify this still works]
 *
 * History: [When this was broken and why]
 */
```

**Example:** See `app/lib/orbit-utils.ts` lines 1-95

**When to use:**

- Logic that has caused bugs multiple times
- Non-obvious requirements (e.g., "use original index not filtered index")
- Performance-critical code paths
- State management invariants

#### B. Checklist Comments at Risk Points

**Pattern:**

```typescript
// CHECKLIST before modifying this function:
// [ ] Does new code maintain X invariant?
// [ ] Have you tested Y scenario?
// [ ] Did you update Z related code?
// [ ] See docs/KNOWN_ISSUES.md section N for details
```

**Where to place:**

- Functions that have caused regressions
- State update logic
- Database operations
- Complex algorithms

**Example:**

```typescript
export function initializeSubtaskOrbits(subtasks: Subtask[]): Subtask[] {
  // CHECKLIST when modifying:
  // [ ] Angles calculated from original array index (not filtered)
  // [ ] Radii calculated from active position
  // [ ] Caller must saveTask() after this function
  // [ ] Test: Complete subtask → no angular jumps
  // ... implementation
}
```

#### C. Why-Comments vs What-Comments

**Avoid:**

```typescript
// Increment counter
counter++;
```

**Prefer:**

```typescript
// Track active position separately from array index to enable inward shifting
// as items complete while keeping angular positions stable
let activeIndex = 0;
```

**Pattern:**

- **What:** Visible from code itself
- **Why:** Context about decisions, tradeoffs, alternatives considered
- **Why Not:** What was tried and didn't work

**Example:**

```typescript
// We use findIndex() to get original position instead of filtered index
// because angles must stay fixed when items complete (see INVARIANT #1).
//
// Tried: Using filtered index - caused angular jumps on completion
// Tried: Recalculating all angles - caused jarring repositioning
// Final: Persist original angles, find original index for fallback
const originalIndex = parentTask.subtasks?.findIndex((st) => st.id === subtask.id);
```

#### D. ADR (Architecture Decision Records) in Comments

**Pattern:**

```typescript
/**
 * ADR: Why orbital positions are persisted vs calculated
 *
 * Decision: Store assignedStartingAngle in database
 *
 * Context:
 * - Need stable angular positions as items complete
 * - Calculation depends on original array index
 * - Array order might change (reordering, deletions)
 *
 * Alternatives Considered:
 * 1. Calculate on every render
 *    ✗ Need to track original order somehow
 *    ✗ Order might change over time
 *
 * 2. Store order separately
 *    ✗ Added complexity
 *    ✗ Can get out of sync
 *
 * 3. Persist calculated positions (CHOSEN)
 *    ✓ Single source of truth
 *    ✓ Handles order changes gracefully
 *    ✓ Easy to debug (just check DB)
 *
 * Consequences:
 * - Must initialize positions on creation
 * - Must persist after initialization
 * - Slightly larger database records
 *
 * Date: 2025-11-10
 * Revisit: If we add subtask reordering feature
 */
```

---

### Tier 2: Documentation Files (Medium ROI)

#### A. KNOWN_ISSUES.md (Created)

**Purpose:** Track recurring bugs and prevention strategies

**Structure:**

- Issue name, status, severity, frequency
- Symptom (what user sees)
- Root cause (technical explanation)
- Fix (what was changed)
- Prevention (how to avoid)
- Related files and concepts

**Maintenance:**

- Update when bug recurs (add date to history)
- Add new issues as discovered
- Mark as "Monitoring" after fix to track recurrence

#### B. CONCEPTS.md (Exists - expand it)

**Current:** High-level feature documentation

**Proposed additions:**

- **Core Invariants Section:**
  - Cross-reference to code files
  - Visual diagrams explaining concepts
  - Glossary of domain terms

- **Data Flow Diagrams:**
  - How orbital positions are calculated
  - When data is persisted
  - State update sequences

- **Common Patterns:**
  - How to create tasks/subtasks correctly
  - State update best practices
  - Testing procedures

#### C. HANDOFF.md (Exists)

**Current:** Session continuity notes

**Proposed improvements:**

- **Active Issues Section:** Link to KNOWN_ISSUES.md entries
- **Next Session Checklist:** What to check before starting work
- **Quick Test Procedures:** How to verify core functionality

#### D. ARCHITECTURE.md (New)

**Purpose:** Explain system design and key decisions

**Sections:**

1. **System Overview**
   - Component hierarchy
   - Data flow
   - Technology choices

2. **Key Subsystems**
   - Orbital positioning system
   - Focus session tracking
   - Priority belt system
   - Activity logging

3. **Design Patterns**
   - State management approach
   - Database schema design
   - Animation system

4. **Constraints & Tradeoffs**
   - Why certain approaches were chosen
   - What was tried and rejected
   - Future scalability concerns

---

### Tier 3: Code-Based Documentation (Medium-High ROI)

#### A. Type-Level Documentation

**Current:**

```typescript
export interface Subtask {
  assignedStartingAngle?: number;
  assignedOrbitRadius?: number;
}
```

**Improved:**

```typescript
export interface Subtask {
  /**
   * Permanent angular position in degrees (-180 to 180).
   *
   * MUST be calculated from original array index, not filtered index.
   * MUST be persisted to database immediately after initialization.
   *
   * @see app/lib/orbit-utils.ts INVARIANT #1
   * @example -90 (top), 0 (right), 90 (bottom), 180 (left)
   */
  assignedStartingAngle?: number;

  /**
   * Orbital ring radius in pixels.
   *
   * Calculated from active position (shifts inward as items complete).
   * Updated via recalculateRadii() on completion/undo.
   *
   * @see app/lib/orbit-utils.ts INVARIANT #2
   * @example 115 (ring 1), 155 (ring 2), 195 (ring 3)
   */
  assignedOrbitRadius?: number;
}
```

#### B. Function Documentation

**Pattern:**

```typescript
/**
 * Initialize orbital positions for subtasks that lack them.
 *
 * IMPORTANT: Caller MUST save task to database after calling this function
 * to persist the calculated angles and radii. If not saved, positions will
 * be recalculated on next render, potentially causing angular jumps.
 *
 * @param subtasks - Array of subtasks to initialize
 * @param beltRing - Optional priority belt position (affects radii)
 * @returns Subtasks with assignedStartingAngle and assignedOrbitRadius set
 *
 * @example
 * const initialized = initializeSubtaskOrbits(task.subtasks, task.priorityMarkerRing);
 * await saveTask({ ...task, subtasks: initialized }); // MUST SAVE!
 *
 * @see INVARIANT #3 in file header for persistence requirements
 */
export function initializeSubtaskOrbits(subtasks: Subtask[], beltRing?: number): Subtask[] {
  // ...
}
```

#### C. Test-as-Documentation

**Pattern:** Describe expected behavior via test names

```typescript
describe('Orbital Position Persistence', () => {
  test('completing subtask preserves angular positions of remaining items', () => {
    // This test documents the core invariant:
    // "Angles stay fixed, radii shift inward"
  });

  test('angles calculated from original array index not filtered index', () => {
    // This test documents the calculation rule
  });

  test('initializeSubtaskOrbits requires saveTask to persist', () => {
    // This test documents the persistence requirement
  });
});
```

---

### Tier 4: Process & Workflow (Highest Long-term ROI)

#### A. Pre-Session Checklist

**For AI Assistants:**

```markdown
Before starting work in a new session:

1. Read docs/HANDOFF.md
2. Read docs/KNOWN_ISSUES.md
3. If working with subtasks: Read orbit-utils.ts header
4. Check recent git commits for context
5. Note regression history dates to identify patterns
```

**For Developers:**

```markdown
After a break (1+ days):

1. Review HANDOFF.md for session state
2. Scan KNOWN_ISSUES.md for active problems
3. Run quick test: Create task, add subtasks, complete one
4. Check console for errors/warnings
```

#### B. Post-Session Updates

**AI Assistants should:**

1. Update HANDOFF.md with session accomplishments
2. Add to KNOWN_ISSUES.md if bugs recurred
3. Update regression history with dates
4. Flag architectural concerns for human review

**Developers should:**

1. Update HANDOFF.md with next steps
2. Document decisions in commit messages
3. Add to KNOWN_ISSUES.md if discovering patterns
4. Update architecture docs if structure changed

#### C. Code Review Checklist

When reviewing PRs that touch tasks/subtasks:

- [ ] Are orbital positions initialized?
- [ ] Is saveTask() called after initialization?
- [ ] Have angular jump tests been run?
- [ ] Are invariants documented in code?
- [ ] Is KNOWN_ISSUES.md updated if fixing regression?

---

### Tier 5: Tooling & Automation (Lower Short-term ROI)

#### A. Runtime Validation (Development Mode)

```typescript
// app/lib/orbit-utils.ts
export function validateOrbitalInvariants(task: Task): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  task.subtasks?.forEach((st, index) => {
    // Check Invariant #3: Persistence
    if (st.assignedStartingAngle === undefined) {
      errors.push(`Subtask ${st.id} missing assignedStartingAngle`);
    }
    if (st.assignedOrbitRadius === undefined) {
      errors.push(`Subtask ${st.id} missing assignedOrbitRadius`);
    }

    // Check Invariant #1: Angle based on original index
    const expectedAngle = getSubtaskAngle(index, task.subtasks!.length);
    const actualAngle = st.assignedStartingAngle;
    if (actualAngle !== undefined && Math.abs(actualAngle - expectedAngle) > 1) {
      warnings.push(
        `Subtask ${st.id} angle ${actualAngle} doesn't match expected ${expectedAngle} ` +
          `(may be intentional if reordered)`
      );
    }
  });

  return { errors, warnings };
}

// Use in development
if (process.env.NODE_ENV === 'development') {
  useEffect(() => {
    const result = validateOrbitalInvariants(task);
    if (result.errors.length > 0) {
      console.error('[Orbital Validation] ERRORS:', result.errors);
    }
    if (result.warnings.length > 0) {
      console.warn('[Orbital Validation] Warnings:', result.warnings);
    }
  }, [task]);
}
```

#### B. Automated Tests

**Integration tests to prevent regressions:**

```typescript
// tests/orbital-persistence.test.ts
describe('Orbital Position Regression Tests', () => {
  test('KNOWN_ISSUE_1: Angular jumps on completion', async () => {
    // Create task with 3 subtasks
    const task = await createTestTask(['A', 'B', 'C']);
    const initialAngles = task.subtasks.map((st) => st.assignedStartingAngle);

    // Complete middle subtask
    await completeSubtask(task.id, 'B');

    // Verify remaining angles unchanged
    const updated = await getTask(task.id);
    const remainingAngles = updated.subtasks
      .filter((st) => !st.completed)
      .map((st) => st.assignedStartingAngle);

    expect(remainingAngles).toEqual([initialAngles[0], initialAngles[2]]);
  });

  test('KNOWN_ISSUE_1: Sample data has orbital positions', async () => {
    // Clear DB and reinitialize
    await clearDatabase();
    await initializeSampleData();

    // Verify all subtasks have positions
    const tasks = await getTasks();
    tasks.forEach((task) => {
      task.subtasks?.forEach((st) => {
        expect(st.assignedStartingAngle).toBeDefined();
        expect(st.assignedOrbitRadius).toBeDefined();
      });
    });
  });
});
```

#### C. Git Hooks

**Pre-commit hook to check for common mistakes:**

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for initializeSubtaskOrbits without saveTask
if git diff --cached | grep -q "initializeSubtaskOrbits"; then
  if ! git diff --cached | grep -q "saveTask"; then
    echo "⚠️  WARNING: Found initializeSubtaskOrbits without saveTask"
    echo "   This may cause orbital position persistence issues"
    echo "   See docs/KNOWN_ISSUES.md #1"
    echo ""
    echo "   Continue anyway? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
      exit 1
    fi
  fi
fi
```

---

## Practical Implementation Plan

### Week 1: Quick Wins (4 hours)

- ✅ Add invariants header to orbit-utils.ts
- ✅ Create KNOWN_ISSUES.md with existing issues
- ✅ Fix sample data initialization
- [ ] Add validation function (30 min)
- [ ] Add checklist comments to high-risk functions (1 hour)

### Week 2: Documentation (4 hours)

- [ ] Enhance CONCEPTS.md with diagrams
- [ ] Create ARCHITECTURE.md
- [ ] Add JSDoc to key functions
- [ ] Update HANDOFF.md with checklists

### Week 3: Testing (6 hours)

- [ ] Write regression tests for known issues
- [ ] Add integration tests for orbital system
- [ ] Set up test coverage reporting
- [ ] Document test procedures in KNOWN_ISSUES.md

### Week 4: Automation (4 hours)

- [ ] Add runtime validation in dev mode
- [ ] Create git pre-commit hooks
- [ ] Set up automated visual regression testing
- [ ] Add linting rules for common mistakes

---

## Success Metrics

**Measure effectiveness by tracking:**

1. **Regression Rate**
   - Current: 3 occurrences of angular jump bug
   - Target: 0 recurrences in next 30 days

2. **Time to Productivity** (new session)
   - Current: ~30 min to understand context
   - Target: <10 min to start productive work

3. **Bug Resolution Time**
   - Current: ~2 hours average
   - Target: <30 min (because documented)

4. **Documentation Coverage**
   - Current: ~20% of critical code has why-comments
   - Target: 80% of high-risk code documented

5. **Context Retention**
   - Current: Forget implementation details after 3 days
   - Target: Can resume work after 1 week without research

---

## Conclusion

**Key Principles:**

1. **Document Where It's Read**
   - Code comments > External docs
   - Invariants at top of files
   - Checklists at function sites

2. **Explain Why, Not What**
   - Code shows what it does
   - Comments explain decisions
   - History prevents repetition

3. **Make Mistakes Obvious**
   - Runtime validation in dev
   - Type-level enforcement where possible
   - Automated tests for known issues

4. **Invest Incrementally**
   - Start with highest-impact issues
   - Add documentation as bugs occur
   - Automate when patterns emerge

5. **Keep It Alive**
   - Update on every regression
   - Track dates to identify patterns
   - Review quarterly for relevance

**Remember:** The best documentation is the documentation that gets maintained. Start small, prove value, expand gradually.

---

_Last Updated: 2025-11-10_
