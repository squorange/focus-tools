/**
 * Visual-First Drag/Drop Functions
 *
 * These functions implement the visual-first approach to drag/drop reordering:
 * 1. Reorder visual elements array (items + line in visual order)
 * 2. Derive state (items array + todayLineIndex) from the visual order
 *
 * This approach treats visual elements as source of truth, making the logic
 * simpler and more predictable.
 */

import { FocusQueueItem } from "./types";

// Visual element in the unified array
export type VisualElement =
  | { kind: "item"; item: FocusQueueItem; originalIndex: number }
  | { kind: "line" };

/**
 * Reorder visual elements array by moving element from one index to another.
 *
 * This is a pure array reorder - move the element at fromIndex to toIndex.
 * When moving forward, the target shifts back by 1 after removal.
 */
export function reorderVisualElements(
  elements: VisualElement[],
  fromIndex: number,
  toIndex: number
): VisualElement[] {
  if (fromIndex === toIndex) return elements;
  const result = [...elements];
  const [removed] = result.splice(fromIndex, 1);
  // When moving forward, the target shifts back by 1 after removal
  const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  result.splice(adjustedToIndex, 0, removed);
  return result;
}

/**
 * Derive state from visual order.
 *
 * Extracts the items array (in visual order) and calculates todayLineIndex
 * based on how many items appear before the line in the visual array.
 */
export function deriveStateFromVisual(elements: VisualElement[]): {
  items: FocusQueueItem[];
  todayLineIndex: number;
} {
  const items: FocusQueueItem[] = [];
  let todayLineIndex = 0;

  elements.forEach((el) => {
    if (el.kind === "line") {
      todayLineIndex = items.length; // Line position = count of items before it
    } else {
      items.push(el.item);
    }
  });

  return { items, todayLineIndex };
}

/**
 * Build visual elements array from items and todayLineIndex.
 *
 * This is the inverse of deriveStateFromVisual - useful for rebuilding
 * the visual array from state.
 */
export function buildVisualElements(
  items: FocusQueueItem[],
  todayLineIndex: number
): VisualElement[] {
  const elements: VisualElement[] = [];

  // Today items (indices 0 to todayLineIndex-1)
  items.slice(0, todayLineIndex).forEach((item, i) => {
    elements.push({ kind: "item", item, originalIndex: i });
  });

  // The line
  elements.push({ kind: "line" });

  // Later items (indices todayLineIndex onwards)
  items.slice(todayLineIndex).forEach((item, i) => {
    elements.push({ kind: "item", item, originalIndex: todayLineIndex + i });
  });

  return elements;
}
