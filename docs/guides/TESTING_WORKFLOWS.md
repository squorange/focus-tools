# Testing Workflows

> **Purpose:** Step-by-step examples of when and how to use tests during development
> **Format:** Scenario → Trigger → Actions → What to look for → Follow-up

---

## Scenario 1: Starting a Coding Session

### Trigger
You're about to work on the codebase.

### Actions
```bash
# 1. Run tests to verify baseline
npm run test:run

# 2. If all pass, proceed with work
# 3. If failures, investigate before making changes
```

### What to Look For
```
✓ lib/storage.test.ts (17 tests)
✓ lib/priority.vitest.ts (62 tests)
✓ lib/queue-reorder.vitest.ts (19 tests)

Test Files  3 passed (3)
Tests       98 passed (98)
```

### Follow-up
- All pass → Start coding
- Failures → Fix before adding new code (don't build on broken foundation)

---

## Scenario 2: Modifying Storage/Data Layer

### Trigger
You're about to change code in:
- `lib/storage.ts`
- `lib/storage-idb.ts`
- `lib/indexeddb.ts`
- Any function that saves or loads data

### Actions

**Before coding:**
```bash
# Run storage tests in watch mode
npm test -- lib/storage.test.ts
```

**While coding:**
- Keep terminal visible
- Tests re-run automatically on save
- Red = you broke something, fix before continuing

**After coding:**
```bash
# Run full suite to check for ripple effects
npm run test:run
```

### What to Look For

Watch mode output after each save:
```
RERUN  lib/storage.test.ts x 1

✓ Storage Integration > IndexedDB Save/Load > saves and loads state correctly
✓ Storage Integration > Migration Flags > preserves migration flag across multiple saves
...
```

### Follow-up
- Add test for the new behavior you added
- Example: If you added a new field to AppState:

```typescript
// In lib/storage.test.ts, add:
it('preserves newField across save/load cycle', async () => {
  await initializeIDB();
  const state = createTestAppState();
  state.newField = 'test value';

  await saveStateToIDB(state);
  const loaded = await loadStateFromIDB();

  expect(loaded!.newField).toBe('test value');
});
```

---

## Scenario 3: After Fixing a Bug

### Trigger
You just fixed a bug (like the migration flag reset issue).

### Actions

**1. Write a regression test BEFORE verifying the fix manually:**

```typescript
// Describe what was broken
it('preserves migration flag across multiple saves (regression)', async () => {
  await initializeIDB();

  // Setup: simulate the bug scenario
  const state = createTestAppState({ tasks: [createTestTask()] });

  // Action: multiple saves (this was resetting the flag)
  await saveStateToIDB(state);
  await saveStateToIDB(state);
  await saveStateToIDB(state);

  // Assert: flag should still be true
  expect(await isMigrated()).toBe(true);
});
```

**2. Run the test (should fail if bug still exists):**
```bash
npm test -- --grep "migration flag"
```

**3. Apply your fix**

**4. Run the test again (should pass now)**

**5. Run full suite:**
```bash
npm run test:run
```

### What to Look For
- Test fails before fix, passes after = correct regression test
- Test passes before fix = test doesn't capture the bug, rewrite it

### Follow-up
- Commit the test WITH the fix
- The test now guards against this bug forever

---

## Scenario 4: Adding a New Feature

### Trigger
You're implementing a new feature (e.g., a new calculation, new state transformation).

### Actions

**1. Start with a test file (if new module):**
```bash
# Create test file alongside the module
touch lib/new-feature.vitest.ts
```

**2. Write the first test:**
```typescript
import { describe, it, expect } from 'vitest';
import { newFunction } from './new-feature';

describe('newFunction', () => {
  it('returns expected result for basic input', () => {
    expect(newFunction('input')).toBe('expected');
  });
});
```

**3. Run in watch mode while implementing:**
```bash
npm test -- lib/new-feature.vitest.ts
```

**4. Add more tests as you discover edge cases:**
```typescript
it('handles null input', () => {
  expect(newFunction(null)).toBeNull();
});

it('handles empty string', () => {
  expect(newFunction('')).toBe('');
});
```

### What to Look For
- Tests guide your implementation
- If a test is hard to write, the API might need rethinking

### Follow-up
- Aim for 3-5 tests per function covering:
  - Happy path (normal input)
  - Edge cases (null, empty, boundaries)
  - Error cases (invalid input)

---

## Scenario 5: Refactoring Code

### Trigger
You're restructuring code without changing behavior (extracting functions, renaming, reorganizing).

### Actions

**1. Run full suite first:**
```bash
npm run test:run
# Note the count: 98 passed
```

**2. Run in watch mode during refactor:**
```bash
npm test
```

**3. Make small changes, verify tests still pass after each change**

**4. If tests break:**
- Behavior change? Undo and reconsider
- Test was testing implementation details? Update the test

**5. Final verification:**
```bash
npm run test:run
# Should still be: 98 passed
```

### What to Look For
- Same number of tests passing before and after
- No new failures
- Tests that break on refactor = tests coupled to implementation (consider rewriting)

### Follow-up
- If you find tests that are too brittle, note for future improvement
- Don't add new tests during pure refactoring (behavior unchanged)

---

## Scenario 6: Before Committing

### Trigger
You're about to commit changes.

### Actions

```bash
# 1. Run full test suite
npm run test:run

# 2. Run build to catch type errors
npm run build

# 3. If both pass, commit
git add .
git commit -m "feat: description"
```

### What to Look For
```
Test Files  3 passed (3)
Tests       98 passed (98)

✓ Compiled successfully
```

### Follow-up
- Tests fail → Fix before committing
- Build fails → Fix type errors before committing
- Both pass → Safe to commit

---

## Scenario 7: Debugging a Failing Test

### Trigger
A test is failing and you need to understand why.

### Actions

**1. Run just the failing test:**
```bash
npm test -- --grep "test name here"
```

**2. Add console.log to see values:**
```typescript
it('preserves focus queue', async () => {
  const state = createTestAppState({ ... });
  console.log('Before save:', state.focusQueue.items.length);

  await saveStateToIDB(state);
  const loaded = await loadStateFromIDB();
  console.log('After load:', loaded?.focusQueue.items.length);

  expect(loaded!.focusQueue.items).toHaveLength(1);
});
```

**3. Check the diff between expected and actual:**
```
Expected: 1
Received: 0
```

**4. Trace backwards: Why is it 0?**

### What to Look For
- Exact values at each step
- Where the data diverges from expectation
- Setup issues vs. actual code bugs

### Follow-up
- Remove console.logs after debugging
- If you found a bug, write a regression test (Scenario 3)

---

## Scenario 8: Updating Tests for Intentional Changes

### Trigger
You intentionally changed behavior and tests are failing.

### Actions

**1. Verify the failures are expected:**
```bash
npm run test:run
# Read each failure - is it testing the OLD behavior?
```

**2. Update tests to reflect NEW behavior:**
```typescript
// OLD (now wrong):
it('returns 25 for must_do', () => {
  expect(getImportanceScore('must_do')).toBe(25);
});

// NEW (updated for new scoring):
it('returns 30 for must_do', () => {
  expect(getImportanceScore('must_do')).toBe(30);
});
```

**3. Run tests again:**
```bash
npm run test:run
```

### What to Look For
- All updated tests should pass
- No unrelated tests should break
- If unrelated tests break, your change has unintended side effects

### Follow-up
- Document the behavior change (why scores changed, etc.)
- Consider if old behavior needs deprecation period

---

## Scenario 9: Exploring Code You Don't Understand

### Trigger
You're working with unfamiliar code and want to understand it.

### Actions

**1. Find existing tests:**
```bash
# What tests exist for this module?
ls lib/*.test.ts lib/*.vitest.ts
```

**2. Read tests as documentation:**
```typescript
// Tests tell you what the code SHOULD do:
it('returns critical tier for scores >= 60', () => {
  expect(getPriorityTier(60)).toBe('critical');
  expect(getPriorityTier(100)).toBe('critical');
});
// Now you know: 60+ = critical
```

**3. Run tests with verbose output:**
```bash
npm test -- lib/priority.vitest.ts
```

**4. Experiment by modifying tests:**
```typescript
// What happens with 59?
it('experiment', () => {
  console.log(getPriorityTier(59)); // See output
});
```

### What to Look For
- Test names describe behavior
- Test assertions show expected inputs/outputs
- Edge cases reveal boundaries

### Follow-up
- Don't commit experimental tests
- Add real tests if you discover undocumented behavior

---

## Quick Reference: Which Tests to Run When

| Situation | Command |
|-----------|---------|
| Starting work | `npm run test:run` |
| Working on specific file | `npm test -- lib/file.test.ts` |
| After making changes | Tests auto-run in watch mode |
| Before committing | `npm run test:run` |
| Debugging one test | `npm test -- --grep "test name"` |
| Full verification | `npm run test:run && npm run build` |

---

## Quick Reference: Test File Locations

| Code in... | Tests in... |
|------------|-------------|
| `lib/storage.ts` | `lib/storage.test.ts` |
| `lib/priority.ts` | `lib/priority.vitest.ts` |
| `lib/queue-reorder.ts` | `lib/queue-reorder.vitest.ts` |
| `lib/new-module.ts` | `lib/new-module.vitest.ts` (create it) |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [TESTING.md](./TESTING.md) | Best practices and anti-patterns |
| [test-harnesses/README.md](../features/test-harnesses/README.md) | Technical setup |
