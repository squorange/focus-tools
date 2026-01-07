/**
 * Tests for Visual-First Drag/Drop Functions
 *
 * Run with: npx ts-node --esm lib/queue-reorder.test.ts
 * Or: npx tsx lib/queue-reorder.test.ts
 *
 * These tests verify the core reorder and derive functions used in
 * the Focus Queue drag/drop implementation.
 */

import {
  reorderVisualElements,
  deriveStateFromVisual,
  buildVisualElements,
  VisualElement,
} from "./queue-reorder";
import { FocusQueueItem } from "./types";

// Test helpers
function createMockItem(id: string): FocusQueueItem {
  return {
    id,
    taskId: `task-${id}`,
    selectionType: "entire_task",
    selectedStepIds: [],
    horizon: "today",
    scheduledDate: null,
    order: 0,
    addedBy: "user",
    addedAt: Date.now(),
    reason: "user_selected",
    completed: false,
    completedAt: null,
    lastInteractedAt: Date.now(),
    horizonEnteredAt: Date.now(),
    rolloverCount: 0,
  };
}

function makeItemElement(id: string, originalIndex: number): VisualElement {
  return { kind: "item", item: createMockItem(id), originalIndex };
}

const LINE: VisualElement = { kind: "line" };

// Test results tracking
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e: unknown) {
    const error = e as Error;
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

function assertEquals<T>(actual: T, expected: T, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      `${message ? message + ": " : ""}Expected ${expectedStr}, got ${actualStr}`
    );
  }
}

function assertArrayLength(arr: unknown[], expected: number, message?: string) {
  if (arr.length !== expected) {
    throw new Error(
      `${message ? message + ": " : ""}Expected length ${expected}, got ${arr.length}`
    );
  }
}

// ============================================
// Tests for reorderVisualElements
// ============================================

console.log("\n=== reorderVisualElements ===\n");

test("same index returns unchanged array", () => {
  const elements = [makeItemElement("A", 0), LINE, makeItemElement("B", 1)];
  const result = reorderVisualElements(elements, 0, 0);
  assertEquals(result, elements);
});

test("moves item forward correctly (A to position of C)", () => {
  // [A, B, LINE, C, D] → move A (index 0) to C's position (index 3)
  const elements = [
    makeItemElement("A", 0),
    makeItemElement("B", 1),
    LINE,
    makeItemElement("C", 2),
    makeItemElement("D", 3),
  ];
  const result = reorderVisualElements(elements, 0, 3);
  // After removal: [B, LINE, C, D], insert at adjusted index 2: [B, LINE, A, C, D]
  assertArrayLength(result, 5);
  assertEquals((result[0] as { kind: "item"; item: FocusQueueItem }).item.id, "B");
  assertEquals(result[1].kind, "line");
  assertEquals((result[2] as { kind: "item"; item: FocusQueueItem }).item.id, "A");
  assertEquals((result[3] as { kind: "item"; item: FocusQueueItem }).item.id, "C");
  assertEquals((result[4] as { kind: "item"; item: FocusQueueItem }).item.id, "D");
});

test("moves item backward correctly (D to first position)", () => {
  const elements = [
    makeItemElement("A", 0),
    makeItemElement("B", 1),
    LINE,
    makeItemElement("C", 2),
    makeItemElement("D", 3),
  ];
  const result = reorderVisualElements(elements, 4, 0);
  // Move D from index 4 to index 0
  assertArrayLength(result, 5);
  assertEquals((result[0] as { kind: "item"; item: FocusQueueItem }).item.id, "D");
  assertEquals((result[1] as { kind: "item"; item: FocusQueueItem }).item.id, "A");
  assertEquals((result[2] as { kind: "item"; item: FocusQueueItem }).item.id, "B");
  assertEquals(result[3].kind, "line");
  assertEquals((result[4] as { kind: "item"; item: FocusQueueItem }).item.id, "C");
});

test("moves line correctly (line to after C)", () => {
  // [A, B, LINE, C, D] → move LINE (index 2) to after C (index 4)
  const elements = [
    makeItemElement("A", 0),
    makeItemElement("B", 1),
    LINE,
    makeItemElement("C", 2),
    makeItemElement("D", 3),
  ];
  const result = reorderVisualElements(elements, 2, 4);
  // After removal: [A, B, C, D], insert at adjusted index 3: [A, B, C, LINE, D]
  assertArrayLength(result, 5);
  assertEquals((result[0] as { kind: "item"; item: FocusQueueItem }).item.id, "A");
  assertEquals((result[1] as { kind: "item"; item: FocusQueueItem }).item.id, "B");
  assertEquals((result[2] as { kind: "item"; item: FocusQueueItem }).item.id, "C");
  assertEquals(result[3].kind, "line");
  assertEquals((result[4] as { kind: "item"; item: FocusQueueItem }).item.id, "D");
});

test("moves line to beginning", () => {
  const elements = [
    makeItemElement("A", 0),
    makeItemElement("B", 1),
    LINE,
    makeItemElement("C", 2),
  ];
  const result = reorderVisualElements(elements, 2, 0);
  assertArrayLength(result, 4);
  assertEquals(result[0].kind, "line");
  assertEquals((result[1] as { kind: "item"; item: FocusQueueItem }).item.id, "A");
});

test("moves line to end", () => {
  const elements = [
    makeItemElement("A", 0),
    LINE,
    makeItemElement("B", 1),
    makeItemElement("C", 2),
  ];
  const result = reorderVisualElements(elements, 1, 4);
  assertArrayLength(result, 4);
  assertEquals((result[0] as { kind: "item"; item: FocusQueueItem }).item.id, "A");
  assertEquals((result[1] as { kind: "item"; item: FocusQueueItem }).item.id, "B");
  assertEquals((result[2] as { kind: "item"; item: FocusQueueItem }).item.id, "C");
  assertEquals(result[3].kind, "line");
});

// ============================================
// Tests for deriveStateFromVisual
// ============================================

console.log("\n=== deriveStateFromVisual ===\n");

test("calculates todayLineIndex from line position (line at index 2)", () => {
  const elements = [
    makeItemElement("A", 0),
    makeItemElement("B", 1),
    LINE,
    makeItemElement("C", 2),
  ];
  const { todayLineIndex, items } = deriveStateFromVisual(elements);
  assertEquals(todayLineIndex, 2, "todayLineIndex"); // 2 items before line
  assertArrayLength(items, 3, "items");
});

test("extracts items in correct order", () => {
  const elements = [
    makeItemElement("A", 0),
    LINE,
    makeItemElement("B", 1),
    makeItemElement("C", 2),
  ];
  const { items } = deriveStateFromVisual(elements);
  assertEquals(
    items.map((i) => i.id),
    ["A", "B", "C"]
  );
});

test("handles line at start (all items are later)", () => {
  const elements = [LINE, makeItemElement("A", 0), makeItemElement("B", 1)];
  const { todayLineIndex, items } = deriveStateFromVisual(elements);
  assertEquals(todayLineIndex, 0, "todayLineIndex");
  assertArrayLength(items, 2, "items");
});

test("handles line at end (all items are today)", () => {
  const elements = [makeItemElement("A", 0), makeItemElement("B", 1), LINE];
  const { todayLineIndex, items } = deriveStateFromVisual(elements);
  assertEquals(todayLineIndex, 2, "todayLineIndex");
  assertArrayLength(items, 2, "items");
});

test("handles empty items (just line)", () => {
  const elements: VisualElement[] = [LINE];
  const { todayLineIndex, items } = deriveStateFromVisual(elements);
  assertEquals(todayLineIndex, 0, "todayLineIndex");
  assertArrayLength(items, 0, "items");
});

// ============================================
// Tests for buildVisualElements
// ============================================

console.log("\n=== buildVisualElements ===\n");

test("builds correct visual elements from state", () => {
  const items = [createMockItem("A"), createMockItem("B"), createMockItem("C")];
  const elements = buildVisualElements(items, 2);
  assertArrayLength(elements, 4); // 3 items + 1 line
  assertEquals((elements[0] as { kind: "item"; item: FocusQueueItem }).item.id, "A");
  assertEquals((elements[1] as { kind: "item"; item: FocusQueueItem }).item.id, "B");
  assertEquals(elements[2].kind, "line");
  assertEquals((elements[3] as { kind: "item"; item: FocusQueueItem }).item.id, "C");
});

test("round-trip: build then derive returns same state", () => {
  const items = [
    createMockItem("A"),
    createMockItem("B"),
    createMockItem("C"),
    createMockItem("D"),
  ];
  const todayLineIndex = 2;

  const elements = buildVisualElements(items, todayLineIndex);
  const derived = deriveStateFromVisual(elements);

  assertEquals(derived.todayLineIndex, todayLineIndex, "todayLineIndex");
  assertEquals(
    derived.items.map((i) => i.id),
    items.map((i) => i.id),
    "item ids"
  );
});

// ============================================
// Integration tests: Drop scenarios
// ============================================

console.log("\n=== Drop Scenarios ===\n");

test("today item to first later slot lands correctly", () => {
  // Setup: [A, B, LINE, C, D], drag A to slot 3 (C's position)
  // Expected: [B, LINE, A, C, D] → todayLineIndex=1, later=[A,C,D]
  const items = [
    createMockItem("A"),
    createMockItem("B"),
    createMockItem("C"),
    createMockItem("D"),
  ];
  const elements = buildVisualElements(items, 2);

  // Drag from index 0 (A) to index 3 (C's position)
  const reordered = reorderVisualElements(elements, 0, 3);
  const { items: newItems, todayLineIndex } = deriveStateFromVisual(reordered);

  assertEquals(todayLineIndex, 1, "todayLineIndex"); // Only B is today
  assertEquals(
    newItems.map((i) => i.id),
    ["B", "A", "C", "D"],
    "item order"
  );
});

test("later item to today section lands correctly", () => {
  // Setup: [A, B, LINE, C, D], drag C (index 3) to slot 0 (before A)
  // Expected: [C, A, B, LINE, D] → todayLineIndex=3, today=[C,A,B]
  const items = [
    createMockItem("A"),
    createMockItem("B"),
    createMockItem("C"),
    createMockItem("D"),
  ];
  const elements = buildVisualElements(items, 2);

  const reordered = reorderVisualElements(elements, 3, 0);
  const { items: newItems, todayLineIndex } = deriveStateFromVisual(reordered);

  assertEquals(todayLineIndex, 3, "todayLineIndex"); // C, A, B are today
  assertEquals(
    newItems.map((i) => i.id),
    ["C", "A", "B", "D"],
    "item order"
  );
});

test("line drag up makes more items later", () => {
  // Setup: [A, B, LINE, C, D] (todayLineIndex=2)
  // Drag line from index 2 to index 1
  // Expected: [A, LINE, B, C, D] → todayLineIndex=1
  const items = [
    createMockItem("A"),
    createMockItem("B"),
    createMockItem("C"),
    createMockItem("D"),
  ];
  const elements = buildVisualElements(items, 2);

  const reordered = reorderVisualElements(elements, 2, 1);
  const { todayLineIndex } = deriveStateFromVisual(reordered);

  assertEquals(todayLineIndex, 1, "todayLineIndex"); // Only A is today
});

test("line drag down makes more items today", () => {
  // Setup: [A, B, LINE, C, D] (todayLineIndex=2)
  // Drag line from index 2 to index 4
  // Expected: [A, B, C, LINE, D] → todayLineIndex=3
  const items = [
    createMockItem("A"),
    createMockItem("B"),
    createMockItem("C"),
    createMockItem("D"),
  ];
  const elements = buildVisualElements(items, 2);

  const reordered = reorderVisualElements(elements, 2, 4);
  const { todayLineIndex } = deriveStateFromVisual(reordered);

  assertEquals(todayLineIndex, 3, "todayLineIndex"); // A, B, C are today
});

test("line drag to top makes all items later", () => {
  const items = [
    createMockItem("A"),
    createMockItem("B"),
    createMockItem("C"),
  ];
  const elements = buildVisualElements(items, 2);

  const reordered = reorderVisualElements(elements, 2, 0);
  const { todayLineIndex } = deriveStateFromVisual(reordered);

  assertEquals(todayLineIndex, 0, "todayLineIndex");
});

test("line drag to bottom makes all items today", () => {
  const items = [
    createMockItem("A"),
    createMockItem("B"),
    createMockItem("C"),
  ];
  const elements = buildVisualElements(items, 1);

  // Line at index 1, drag to index 4 (past the end)
  const reordered = reorderVisualElements(elements, 1, 4);
  const { todayLineIndex } = deriveStateFromVisual(reordered);

  assertEquals(todayLineIndex, 3, "todayLineIndex"); // All items are today
});

// ============================================
// Summary
// ============================================

console.log("\n=== Summary ===\n");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
