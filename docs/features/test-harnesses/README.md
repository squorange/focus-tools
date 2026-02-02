# Test Harnesses

> **Status:** ✅ Complete (Phase 1)
> **Last Updated:** February 2026
> **Purpose:** Automated testing infrastructure for safe refactoring and regression prevention

---

## Overview

Test harnesses provide the infrastructure for automated testing in Task Co-Pilot. This enables:

- **Regression prevention** — Catch bugs before they reach users
- **Safe refactoring** — Change code with confidence
- **Living documentation** — Tests show how code should behave
- **Faster debugging** — Failing tests pinpoint problems

---

## Quick Start

```bash
# Run tests (watch mode)
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

---

## Architecture

### Framework Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Test Runner | Vitest | Fast, TypeScript-native test execution |
| DOM Environment | jsdom | Browser APIs for component tests |
| React Testing | @testing-library/react | Component testing utilities |
| Assertions | @testing-library/jest-dom | DOM-specific matchers |
| IndexedDB Mock | fake-indexeddb | In-memory IndexedDB for tests |

### File Structure

```
task-copilot/
├── vitest.config.ts        # Vitest configuration
├── tests/
│   ├── setup.ts            # Global test setup (mocks, cleanup)
│   └── fixtures.ts         # Test data factories
└── lib/
    ├── storage.test.ts     # Storage integration tests
    ├── priority.vitest.ts  # Priority calculation tests
    └── queue-reorder.vitest.ts # Queue reorder tests
```

### Configuration

**vitest.config.ts:**
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.vitest.{ts,tsx}', 'lib/storage.test.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
});
```

---

## Test Categories

### 1. Unit Tests

Test individual functions in isolation.

**Location:** `lib/*.vitest.ts`

**Example:**
```typescript
describe('getImportanceScore', () => {
  it('must_do returns 25', () => {
    expect(getImportanceScore('must_do')).toBe(25);
  });
});
```

**Coverage:**
- `priority.vitest.ts` — Priority calculation (62 tests)
- `queue-reorder.vitest.ts` — Queue drag/drop logic (19 tests)

### 2. Integration Tests

Test multiple modules working together.

**Location:** `lib/storage.test.ts`

**Example:**
```typescript
it('preserves focus queue items across save/load cycles', async () => {
  const state = createAppStateWithQueuedTask({ title: 'Queued Task' });

  await saveStateToIDB(state);
  const loaded = await loadStateFromIDB();

  expect(loaded!.focusQueue.items).toHaveLength(1);
});
```

**Coverage:**
- IndexedDB save/load round-trips (17 tests)
- Migration flag persistence
- Schema migrations

### 3. E2E Tests (Future)

End-to-end tests with Playwright — planned for Phase 2.

---

## Test Fixtures

Factory functions in `tests/fixtures.ts` create consistent test data:

```typescript
// Create a basic task
const task = createTestTask({ title: 'My Task' });

// Create task with steps
const task = createTaskWithSteps('Task', ['Step 1', 'Step 2']);

// Create app state with queued task
const state = createAppStateWithQueuedTask(
  { title: 'Queued' },
  { selectionType: 'all_today' }
);

// Date helpers
const tomorrow = dateFromNow(1);      // '2026-02-02'
const lastWeek = daysAgo(7);          // timestamp
```

---

## Global Mocks

Set up in `tests/setup.ts`:

| Mock | Purpose |
|------|---------|
| `indexedDB` | In-memory IndexedDB via fake-indexeddb |
| `localStorage` | In-memory localStorage with spy functions |
| `matchMedia` | Stub for responsive queries |
| `requestIdleCallback` | Stub for idle callbacks |
| `crypto.randomUUID` | Deterministic ID generation |

**Auto-cleanup:** IndexedDB and localStorage are reset between tests.

---

## Writing Tests

### Naming Convention

- Unit tests: `{module}.vitest.ts`
- Integration tests: `{feature}.test.ts`
- Component tests: `{Component}.test.tsx`

### Best Practices

1. **Test behavior, not implementation**
   ```typescript
   // Good: Tests what happens
   it('adds task to queue when user clicks Add', ...)

   // Bad: Tests how it happens
   it('calls handleAddToQueue with correct params', ...)
   ```

2. **Use fixtures for test data**
   ```typescript
   // Good
   const task = createTestTask({ importance: 'must_do' });

   // Avoid: Manual object construction
   const task = { id: '...', title: '...', ... };
   ```

3. **One assertion per test when possible**
   ```typescript
   // Good: Clear what failed
   it('returns 25 for must_do', () => {
     expect(getImportanceScore('must_do')).toBe(25);
   });
   ```

4. **Clean up in afterEach**
   ```typescript
   afterEach(async () => {
     await closeDatabase();
     await deleteDatabase();
     localStorage.clear();
   });
   ```

---

## Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Storage layer | 80% | ~85% |
| Priority calculation | 90% | ~95% |
| Queue utilities | 80% | ~90% |
| Components | 50% | — (future) |

---

## Running Specific Tests

```bash
# Run a specific file
npx vitest run lib/storage.test.ts

# Run tests matching a pattern
npx vitest run --grep "priority"

# Run in watch mode for a file
npx vitest lib/storage.test.ts
```

---

## Troubleshooting

### IndexedDB not available
Ensure `tests/setup.ts` imports `fake-indexeddb/auto`.

### Tests interfere with each other
Check that `afterEach` properly resets state (IndexedDB, localStorage).

### Timezone issues in date tests
Use local date construction instead of ISO strings:
```typescript
// Good: Local time
function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${...}`;
}

// Bad: UTC conversion issues
return d.toISOString().split('T')[0];
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [ROADMAP.md](../../ROADMAP.md) | Infrastructure evolution plan |
| [indexeddb-migration/](../indexeddb-migration/) | Storage layer being tested |
| [PRINCIPLES.md](../../PRINCIPLES.md) | Coding conventions |
