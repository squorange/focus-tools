/**
 * Elevation Foundations
 *
 * Elevation levels for depth hierarchy.
 * Maps to shadows for visual representation.
 */

// ============================================================================
// Elevation Levels
// ============================================================================
export const elevation = {
  none: 0,
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
  '2xl': 6,
} as const;

/**
 * Elevation style definitions
 * Can be used for React Native or web shadow generation
 */
export const elevationStyles = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
  },
} as const;

// ============================================================================
// Type Exports
// ============================================================================
export type ElevationLevel = keyof typeof elevation;
export type ElevationStyle = (typeof elevationStyles)[ElevationLevel];
