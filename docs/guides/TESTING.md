# Testing Guide

> **Purpose:** Practical guidance for when and how to use the test harness
> **Audience:** Developer (you + Claude Code)

---

## Quick Reference

```bash
npm test              # Watch mode (while coding)
npm run test:run      # Run once (before commit)
npm run test:coverage # With coverage report
```

---

## When to Run Tests

| Situation | Command | Why |
|-----------|---------|-----|
| Working on code | `npm test` | Watch mode — reruns on save |
| Before committing | `npm run test:run` | Catch regressions |
| After pulling changes | `npm run test:run` | Verify nothing broke |
| Debugging a failure | `npm test -- --grep "test name"` | Focus on one test |

---

## When to Write Tests

### Do Write Tests For

- **Complex logic** — calculations, state transformations, algorithms
- **Data persistence** — storage round-trips, migrations, serialization
- **Past bugs** — regression tests prevent repeat failures
- **Edge cases** — boundary conditions you've discovered
- **Critical paths** — features where bugs are costly

### Don't Write Tests For

- Trivial getters/setters
- UI layout and styling (test manually)
- Third-party library behavior
- Experimental code still in flux
- One-line wrapper functions

---

## How to Write Good Tests

### 1. Test Behavior, Not Implementation

```typescript
// GOOD: What should happen
it('adds task to queue', () => {
  const state = addToQueue(initialState, task);
  expect(state.focusQueue.items).toContainEqual(
    expect.objectContaining({ taskId: task.id })
  );
});

// BAD: How it happens internally
it('calls array.push with correct arguments', () => { ... });
```

### 2. One Concept Per Test

```typescript
// GOOD: Clear what failed
it('returns 25 for must_do importance', () => {
  expect(getImportanceScore('must_do')).toBe(25);
});

it('returns 15 for should_do importance', () => {
  expect(getImportanceScore('should_do')).toBe(15);
});

// AVOID: Multiple assertions obscure failures
it('returns correct scores for all levels', () => {
  expect(getImportanceScore('must_do')).toBe(25);
  expect(getImportanceScore('should_do')).toBe(15);
  expect(getImportanceScore('could_do')).toBe(5);
});
```

### 3. Use Fixtures

```typescript
// GOOD: Consistent, maintainable
import { createTestTask, createTestAppState } from '@/tests/fixtures';

const task = createTestTask({ importance: 'must_do' });
const state = createTestAppState({ tasks: [task] });

// AVOID: Manual object construction (brittle, duplicated)
const task = {
  id: '123',
  title: 'Test',
  status: 'pool',
  // ... 30 more required fields
};
```

### 4. Name Tests as Sentences

```typescript
// GOOD: Reads as documentation
it('preserves focus queue items across save/load cycles')
it('returns null when deadline is not set')
it('increases priority score for overdue tasks')

// AVOID: Vague names
it('works correctly')
it('handles edge case')
it('test 1')
```

---

## Common Test Patterns

### Storage Round-Trip

```typescript
it('persists focus queue across save/load cycle', async () => {
  const task = createTestTask();
  const state = createTestAppState({
    tasks: [task],
    queueItems: [createTestQueueItem(task.id)],
  });

  await saveStateToIDB(state);
  const loaded = await loadStateFromIDB();

  expect(loaded!.focusQueue.items).toHaveLength(1);
  expect(loaded!.focusQueue.items[0].taskId).toBe(task.id);
});
```

### Calculation/Pure Function

```typescript
it('returns high tier for score of 45', () => {
  expect(getPriorityTier(45)).toBe('high');
});

it('includes lead time in effective deadline', () => {
  const task = createTestTask({
    deadlineDate: '2026-02-15',
    leadTimeDays: 7,
  });
  const effective = getEffectiveDeadline(task);
  expect(effective!.getDate()).toBe(8); // 15 - 7
});
```

### State Transformation

```typescript
it('moves task from inbox to pool when sent to pool', () => {
  const task = createTestTask({ status: 'inbox' });
  const state = createTestAppState({ tasks: [task] });

  const newState = handleSendToPool(state, task.id);

  expect(newState.tasks[0].status).toBe('pool');
});
```

---

## What to Avoid

| Don't | Why | Instead |
|-------|-----|---------|
| Test private functions | Couples tests to implementation | Test through public API |
| Mock everything | Tests become meaningless | Mock only external boundaries (IndexedDB, fetch) |
| Test framework code | Already tested by authors | Test your logic only |
| Copy-paste test code | Hard to maintain | Extract to fixtures/helpers |
| Ignore flaky tests | Erodes trust in suite | Fix immediately or delete |
| Test after bugs ship | Reactive, not preventive | Write with features |

---

## Red Flags

### Your Test Is Probably Wrong If:

- It passes when the code is clearly broken
- It fails randomly (flaky)
- It requires > 10 lines of setup
- It tests React/Next.js/library internals
- It duplicates another test's coverage

### Your Test Suite Is Unhealthy If:

- Tests take > 30 seconds to run
- You skip tests to make CI pass
- Tests break when refactoring (but behavior unchanged)
- Nobody trusts the results

---

## Division of Labor

### Claude Code Will:

- Write tests after storage/data layer changes
- Write regression tests after fixing bugs
- Write tests when you ask

### You Should Test Manually:

- Visual appearance and layout
- Touch/gesture interactions
- PWA behavior on actual devices
- Animations and transitions
- "Does this feel right?"

---

## Available Fixtures

From `tests/fixtures.ts`:

```typescript
// Tasks
createTestTask({ title: 'Custom', importance: 'must_do' })
createTaskWithSteps('Title', ['Step 1', 'Step 2'])
createCompletedTask()
createRecurringTask()

// Queue
createTestQueueItem(taskId, { selectionType: 'specific_steps' })

// App State
createTestAppState({ tasks, queueItems, todayLineIndex })
createAppStateWithQueuedTask(taskOverrides, queueItemOverrides)

// Dates
dateFromNow(3)   // '2026-02-04' (3 days from now)
daysAgo(7)       // timestamp 7 days ago
hoursAgo(2)      // timestamp 2 hours ago

// Projects
createTestProject({ name: 'Work' })
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [test-harnesses/README.md](../features/test-harnesses/README.md) | Technical setup details |
| [PRINCIPLES.md](../PRINCIPLES.md) | Coding conventions |
| [CLAUDE.md](../../prototypes/task-copilot/CLAUDE.md) | Sprint context |
