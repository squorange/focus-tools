/**
 * Queue Reorder Tests (Vitest)
 *
 * Tests for the visual-first drag/drop functions used in the Focus Queue.
 */

import { describe, it, expect } from 'vitest';
import {
  reorderVisualElements,
  deriveStateFromVisual,
  buildVisualElements,
  VisualElement,
} from './queue-reorder';
import { FocusQueueItem } from './types';

// ============================================
// Test Helpers
// ============================================

function createMockItem(id: string): FocusQueueItem {
  return {
    id,
    taskId: `task-${id}`,
    selectionType: 'all_today',
    selectedStepIds: [],
    horizon: 'today',
    scheduledDate: null,
    order: 0,
    addedBy: 'user',
    addedAt: Date.now(),
    reason: 'user_selected',
    completed: false,
    completedAt: null,
    lastInteractedAt: Date.now(),
    horizonEnteredAt: Date.now(),
    rolloverCount: 0,
  };
}

function makeItemElement(id: string, originalIndex: number): VisualElement {
  return { kind: 'item', item: createMockItem(id), originalIndex };
}

const LINE: VisualElement = { kind: 'line' };

function getItemId(element: VisualElement): string {
  if (element.kind === 'item') {
    return element.item.id;
  }
  throw new Error('Expected item element');
}

// ============================================
// reorderVisualElements
// ============================================

describe('reorderVisualElements', () => {
  it('same index returns unchanged array', () => {
    const elements = [makeItemElement('A', 0), LINE, makeItemElement('B', 1)];
    const result = reorderVisualElements(elements, 0, 0);
    expect(result).toEqual(elements);
  });

  it('moves item forward correctly (A to position of C)', () => {
    // [A, B, LINE, C, D] → move A (index 0) to C's position (index 3)
    const elements = [
      makeItemElement('A', 0),
      makeItemElement('B', 1),
      LINE,
      makeItemElement('C', 2),
      makeItemElement('D', 3),
    ];
    const result = reorderVisualElements(elements, 0, 3);

    expect(result).toHaveLength(5);
    expect(getItemId(result[0])).toBe('B');
    expect(result[1].kind).toBe('line');
    expect(getItemId(result[2])).toBe('A');
    expect(getItemId(result[3])).toBe('C');
    expect(getItemId(result[4])).toBe('D');
  });

  it('moves item backward correctly (D to first position)', () => {
    const elements = [
      makeItemElement('A', 0),
      makeItemElement('B', 1),
      LINE,
      makeItemElement('C', 2),
      makeItemElement('D', 3),
    ];
    const result = reorderVisualElements(elements, 4, 0);

    expect(result).toHaveLength(5);
    expect(getItemId(result[0])).toBe('D');
    expect(getItemId(result[1])).toBe('A');
    expect(getItemId(result[2])).toBe('B');
    expect(result[3].kind).toBe('line');
    expect(getItemId(result[4])).toBe('C');
  });

  it('moves line correctly (line to after C)', () => {
    const elements = [
      makeItemElement('A', 0),
      makeItemElement('B', 1),
      LINE,
      makeItemElement('C', 2),
      makeItemElement('D', 3),
    ];
    const result = reorderVisualElements(elements, 2, 4);

    expect(result).toHaveLength(5);
    expect(getItemId(result[0])).toBe('A');
    expect(getItemId(result[1])).toBe('B');
    expect(getItemId(result[2])).toBe('C');
    expect(result[3].kind).toBe('line');
    expect(getItemId(result[4])).toBe('D');
  });

  it('moves line to beginning', () => {
    const elements = [
      makeItemElement('A', 0),
      makeItemElement('B', 1),
      LINE,
      makeItemElement('C', 2),
    ];
    const result = reorderVisualElements(elements, 2, 0);

    expect(result).toHaveLength(4);
    expect(result[0].kind).toBe('line');
    expect(getItemId(result[1])).toBe('A');
  });

  it('moves line to end', () => {
    const elements = [
      makeItemElement('A', 0),
      LINE,
      makeItemElement('B', 1),
      makeItemElement('C', 2),
    ];
    const result = reorderVisualElements(elements, 1, 4);

    expect(result).toHaveLength(4);
    expect(getItemId(result[0])).toBe('A');
    expect(getItemId(result[1])).toBe('B');
    expect(getItemId(result[2])).toBe('C');
    expect(result[3].kind).toBe('line');
  });
});

// ============================================
// deriveStateFromVisual
// ============================================

describe('deriveStateFromVisual', () => {
  it('calculates todayLineIndex from line position (line at index 2)', () => {
    const elements = [
      makeItemElement('A', 0),
      makeItemElement('B', 1),
      LINE,
      makeItemElement('C', 2),
    ];
    const { todayLineIndex, items } = deriveStateFromVisual(elements);

    expect(todayLineIndex).toBe(2); // 2 items before line
    expect(items).toHaveLength(3);
  });

  it('extracts items in correct order', () => {
    const elements = [
      makeItemElement('A', 0),
      LINE,
      makeItemElement('B', 1),
      makeItemElement('C', 2),
    ];
    const { items } = deriveStateFromVisual(elements);

    expect(items.map((i) => i.id)).toEqual(['A', 'B', 'C']);
  });

  it('handles line at start (all items are later)', () => {
    const elements = [LINE, makeItemElement('A', 0), makeItemElement('B', 1)];
    const { todayLineIndex, items } = deriveStateFromVisual(elements);

    expect(todayLineIndex).toBe(0);
    expect(items).toHaveLength(2);
  });

  it('handles line at end (all items are today)', () => {
    const elements = [makeItemElement('A', 0), makeItemElement('B', 1), LINE];
    const { todayLineIndex, items } = deriveStateFromVisual(elements);

    expect(todayLineIndex).toBe(2);
    expect(items).toHaveLength(2);
  });

  it('handles empty items (just line)', () => {
    const elements: VisualElement[] = [LINE];
    const { todayLineIndex, items } = deriveStateFromVisual(elements);

    expect(todayLineIndex).toBe(0);
    expect(items).toHaveLength(0);
  });
});

// ============================================
// buildVisualElements
// ============================================

describe('buildVisualElements', () => {
  it('builds correct visual elements from state', () => {
    const items = [createMockItem('A'), createMockItem('B'), createMockItem('C')];
    const elements = buildVisualElements(items, 2);

    expect(elements).toHaveLength(4); // 3 items + 1 line
    expect(getItemId(elements[0])).toBe('A');
    expect(getItemId(elements[1])).toBe('B');
    expect(elements[2].kind).toBe('line');
    expect(getItemId(elements[3])).toBe('C');
  });

  it('round-trip: build then derive returns same state', () => {
    const items = [
      createMockItem('A'),
      createMockItem('B'),
      createMockItem('C'),
      createMockItem('D'),
    ];
    const todayLineIndex = 2;

    const elements = buildVisualElements(items, todayLineIndex);
    const derived = deriveStateFromVisual(elements);

    expect(derived.todayLineIndex).toBe(todayLineIndex);
    expect(derived.items.map((i) => i.id)).toEqual(items.map((i) => i.id));
  });
});

// ============================================
// Drop Scenarios (Integration)
// ============================================

describe('Drop Scenarios', () => {
  it('today item to first later slot lands correctly', () => {
    // Setup: [A, B, LINE, C, D], drag A to slot 3 (C's position)
    // Expected: [B, LINE, A, C, D] → todayLineIndex=1
    const items = [
      createMockItem('A'),
      createMockItem('B'),
      createMockItem('C'),
      createMockItem('D'),
    ];
    const elements = buildVisualElements(items, 2);
    const reordered = reorderVisualElements(elements, 0, 3);
    const { items: newItems, todayLineIndex } = deriveStateFromVisual(reordered);

    expect(todayLineIndex).toBe(1); // Only B is today
    expect(newItems.map((i) => i.id)).toEqual(['B', 'A', 'C', 'D']);
  });

  it('later item to today section lands correctly', () => {
    // Setup: [A, B, LINE, C, D], drag C (index 3) to slot 0 (before A)
    // Expected: [C, A, B, LINE, D] → todayLineIndex=3
    const items = [
      createMockItem('A'),
      createMockItem('B'),
      createMockItem('C'),
      createMockItem('D'),
    ];
    const elements = buildVisualElements(items, 2);
    const reordered = reorderVisualElements(elements, 3, 0);
    const { items: newItems, todayLineIndex } = deriveStateFromVisual(reordered);

    expect(todayLineIndex).toBe(3); // C, A, B are today
    expect(newItems.map((i) => i.id)).toEqual(['C', 'A', 'B', 'D']);
  });

  it('line drag up makes more items later', () => {
    // Setup: [A, B, LINE, C, D] (todayLineIndex=2)
    // Drag line from index 2 to index 1
    // Expected: [A, LINE, B, C, D] → todayLineIndex=1
    const items = [
      createMockItem('A'),
      createMockItem('B'),
      createMockItem('C'),
      createMockItem('D'),
    ];
    const elements = buildVisualElements(items, 2);
    const reordered = reorderVisualElements(elements, 2, 1);
    const { todayLineIndex } = deriveStateFromVisual(reordered);

    expect(todayLineIndex).toBe(1); // Only A is today
  });

  it('line drag down makes more items today', () => {
    // Setup: [A, B, LINE, C, D] (todayLineIndex=2)
    // Drag line from index 2 to index 4
    // Expected: [A, B, C, LINE, D] → todayLineIndex=3
    const items = [
      createMockItem('A'),
      createMockItem('B'),
      createMockItem('C'),
      createMockItem('D'),
    ];
    const elements = buildVisualElements(items, 2);
    const reordered = reorderVisualElements(elements, 2, 4);
    const { todayLineIndex } = deriveStateFromVisual(reordered);

    expect(todayLineIndex).toBe(3); // A, B, C are today
  });

  it('line drag to top makes all items later', () => {
    const items = [
      createMockItem('A'),
      createMockItem('B'),
      createMockItem('C'),
    ];
    const elements = buildVisualElements(items, 2);
    const reordered = reorderVisualElements(elements, 2, 0);
    const { todayLineIndex } = deriveStateFromVisual(reordered);

    expect(todayLineIndex).toBe(0);
  });

  it('line drag to bottom makes all items today', () => {
    const items = [
      createMockItem('A'),
      createMockItem('B'),
      createMockItem('C'),
    ];
    const elements = buildVisualElements(items, 1);
    const reordered = reorderVisualElements(elements, 1, 4);
    const { todayLineIndex } = deriveStateFromVisual(reordered);

    expect(todayLineIndex).toBe(3); // All items are today
  });
});
