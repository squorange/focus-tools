/**
 * Layer (z-index) Foundations
 *
 * Z-index constants for stacking context management.
 * Use these instead of arbitrary z-index values.
 */

// ============================================================================
// Z-Index Scale
// ============================================================================
export const zIndex = {
  /** Base level - normal document flow */
  base: 0,

  /** Slightly elevated content (cards, raised elements) */
  raised: 1,

  /** Docked elements (sidebars, toolbars) */
  docked: 10,

  /** Dropdowns and select menus */
  dropdown: 50,

  /** Sticky headers and navigation */
  sticky: 100,

  /** Overlay backgrounds (dim layers) */
  overlay: 150,

  /** Modal dialogs */
  modal: 200,

  /** Popovers and tooltips */
  popover: 250,

  /** Toast notifications */
  toast: 300,

  /** Maximum level (dev tools, critical overlays) */
  max: 9999,
} as const;

// ============================================================================
// Type Exports
// ============================================================================
export type ZIndexLevel = keyof typeof zIndex;
