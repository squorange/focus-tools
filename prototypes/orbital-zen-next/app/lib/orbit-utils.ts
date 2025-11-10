import { Subtask } from './types';

// Orbit radii for subtasks (matching SolarSystemView.tsx)
export const SUBTASK_ORBIT_RADII = [115, 155, 195, 235, 275];

/**
 * Calculate evenly distributed angle based on index and total count
 */
export function getSubtaskAngle(index: number, total: number): number {
  return (360 / total) * index - 90; // Start at top (-90deg)
}

/**
 * Assign orbit radius based on index (cycles through available radii)
 */
export function getSubtaskOrbitRadius(index: number): number {
  return SUBTASK_ORBIT_RADII[index % SUBTASK_ORBIT_RADII.length];
}

/**
 * Find the largest angular gap between existing subtasks
 * Returns the angle in the middle of the largest gap
 */
export function findLargestGap(existingSubtasks: Subtask[]): number {
  // Filter to only non-completed subtasks with assigned angles
  const activeWithAngles = existingSubtasks
    .filter(st => !st.completed && st.assignedStartingAngle !== undefined)
    .map(st => st.assignedStartingAngle!)
    .sort((a, b) => a - b); // Sort by angle

  if (activeWithAngles.length === 0) {
    // No existing subtasks, start at top
    return -90;
  }

  if (activeWithAngles.length === 1) {
    // Only one subtask, place new one opposite
    return (activeWithAngles[0] + 180) % 360;
  }

  // Find largest gap
  let largestGap = 0;
  let largestGapStart = 0;

  for (let i = 0; i < activeWithAngles.length; i++) {
    const current = activeWithAngles[i];
    const next = activeWithAngles[(i + 1) % activeWithAngles.length];

    // Calculate gap (handle wrap-around at 360°)
    const gap = next > current
      ? next - current
      : (360 - current) + next;

    if (gap > largestGap) {
      largestGap = gap;
      largestGapStart = current;
    }
  }

  // Place new subtask in the middle of the largest gap
  const newAngle = (largestGapStart + largestGap / 2) % 360;

  // Normalize to -180 to 180 range (to match starting at -90)
  return newAngle > 180 ? newAngle - 360 : newAngle;
}

/**
 * Calculate next available angle for a new subtask
 * Uses largest gap strategy to maintain good distribution
 */
export function calculateNextAngle(existingSubtasks: Subtask[]): number {
  return findLargestGap(existingSubtasks);
}

/**
 * Calculate next available orbit radius for a new subtask
 * Finds the next index position (considering completed subtasks)
 */
export function calculateNextRadius(existingSubtasks: Subtask[]): number {
  const activeSubtasks = existingSubtasks.filter(st => !st.completed);
  const nextIndex = activeSubtasks.length;
  return getSubtaskOrbitRadius(nextIndex);
}

/**
 * Recalculate radii for all subtasks
 * Maintains their assigned angles but updates radii
 * Active (non-completed) subtasks fill inward to rings 1, 2, 3, etc.
 * Accounts for belt position if present
 *
 * IMPORTANT: Active subtasks shift inward as items complete and disappear.
 * Angles stay fixed (based on original array index), but radii shift inward.
 */
export function recalculateRadii(subtasks: Subtask[], beltRing?: number): Subtask[] {
  // Build mapping of active subtask positions
  let activeIndex = 0;

  return subtasks.map((st) => {
    // Completed subtasks maintain their current positions (invisible in orbital view)
    if (st.completed) return st;

    // Calculate radius based on position among active items
    // This makes remaining items shift inward to fill rings 1, 2, 3, etc.
    const radius = getSubtaskRadiusWithBelt(activeIndex, beltRing);
    activeIndex++;

    return {
      ...st,
      assignedOrbitRadius: radius,
    };
  });
}

/**
 * Initialize angles and radii for subtasks that don't have them
 * (Migration helper for existing data)
 * Accounts for belt position if present
 *
 * IMPORTANT: Angles are based on array index (list order) to stay fixed.
 * Radii are based on active position to fill inward as items complete.
 */
export function initializeSubtaskOrbits(subtasks: Subtask[], beltRing?: number): Subtask[] {
  const totalSubtasks = subtasks.length;
  let activeIndex = 0;

  return subtasks.map((st, arrayIndex) => {
    // If already has assigned values, keep them
    if (st.assignedStartingAngle !== undefined && st.assignedOrbitRadius !== undefined) {
      return st;
    }

    // Calculate angle based on array index (stays fixed)
    // Calculate radius based on active position (shifts inward)
    const angle = getSubtaskAngle(arrayIndex, totalSubtasks);
    const radius = st.completed
      ? st.assignedOrbitRadius // Keep existing radius for completed
      : getSubtaskRadiusWithBelt(activeIndex, beltRing);

    if (!st.completed) {
      activeIndex++;
    }

    return {
      ...st,
      assignedStartingAngle: angle,
      assignedOrbitRadius: radius,
    };
  });
}

/**
 * Generate a stable animation delay based on subtask ID
 * This ensures each subtask keeps the same animation state even when indices change
 */
export function getStableAnimationDelay(id: string): number {
  // Simple hash function to convert id to a number between 0-10
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  // Return a delay between 0 and -30 seconds (negative to start at different positions)
  return -(Math.abs(hash) % 30);
}

/**
 * Priority Marker Utilities
 */

const MIN_RADIUS = 115;
const RADIUS_SPACING = 40;
const BELT_SPACING_BUFFER = 20; // Extra space for belt ring and all outer rings

/**
 * Calculate marker radius based on ring position
 * Ring 0 = celebration mode (around parent task)
 * Ring 1+ = orbital ring positions (belt ring gets extra buffer)
 */
export function getMarkerRadius(ringPosition: number): number {
  if (ringPosition === 0) {
    return 70; // Celebration mode: ring around parent task (parent is 28px radius)
  }
  // Belt occupies its ring with extra spacing buffer
  return MIN_RADIUS + ((ringPosition - 1) * RADIUS_SPACING) + BELT_SPACING_BUFFER;
}

/**
 * Convert radius to ring position (for drag interactions)
 * Returns the nearest valid ring position (1-based)
 */
export function radiusToRing(radius: number): number {
  const ring = Math.round((radius - MIN_RADIUS) / RADIUS_SPACING) + 1;
  return Math.max(1, ring); // Minimum ring 1
}

/**
 * Get default marker ring position for a given subtask count
 * Places belt at ring 3 if 3+ subtasks, otherwise after all subtasks
 */
export function getDefaultMarkerRing(subtaskCount: number): number {
  if (subtaskCount >= 3) {
    return 3;
  } else if (subtaskCount > 0) {
    return subtaskCount + 1;
  }
  return 1; // Minimum ring
}

/**
 * Calculate subtask's orbital radius accounting for belt position
 * Subtasks before belt: normal ring positions
 * Belt: occupies its ring position + BUFFER (20px gap before it)
 * Subtasks at/after belt: shifted by +1 ring + BUFFER*2 (20px gap before + 20px gap after)
 */
export function getSubtaskRadiusWithBelt(
  subtaskIndex: number,
  beltRing?: number
): number {
  const baseRing = subtaskIndex + 1; // Convert 0-based index to 1-based ring

  if (!beltRing) {
    // No belt, use normal radius
    return MIN_RADIUS + (subtaskIndex * RADIUS_SPACING);
  }

  // Subtasks before belt: normal positions (no buffer)
  if (baseRing < beltRing) {
    return MIN_RADIUS + (subtaskIndex * RADIUS_SPACING);
  }

  // Subtasks at or after belt position: shifted by +1 ring AND add double buffer
  // This creates equal 20px gaps on both sides of the belt
  return MIN_RADIUS + (subtaskIndex + 1) * RADIUS_SPACING + (BELT_SPACING_BUFFER * 2);
}

/**
 * Calculate current marker ring position based on remaining original targets
 * Returns the ring position where belt should be
 * Returns 0 if all targets are complete (celebration mode)
 *
 * Belt maintains its position in the stacking order (relative to subtasks),
 * but shifts inward radially as priority items complete and disappear from view.
 */
export function getCurrentMarkerRing(
  subtasks: Subtask[],
  beltRing?: number,
  originalTargetIds?: string[]
): number {
  if (!beltRing || !originalTargetIds || originalTargetIds.length === 0) {
    return 0;
  }

  // Check if all original priority items are complete (celebration mode)
  const allPriorityComplete = originalTargetIds.every(id => {
    const subtask = subtasks.find(st => st.id === id);
    return !subtask || subtask.completed; // Complete or deleted
  });

  if (allPriorityComplete) {
    return 0; // Celebration mode
  }

  // Find the last priority item in array order (regardless of completion state)
  let lastPriorityIndex = -1;
  for (let i = subtasks.length - 1; i >= 0; i--) {
    if (originalTargetIds.includes(subtasks[i].id)) {
      lastPriorityIndex = i;
      break;
    }
  }

  if (lastPriorityIndex === -1) {
    return 0; // All priority items deleted - belt disappears
  }

  // Count active (non-completed) subtasks from index 0 up to and including the last priority item
  let activeCount = 0;
  for (let i = 0; i <= lastPriorityIndex; i++) {
    if (!subtasks[i].completed) {
      activeCount++;
    }
  }

  // Belt appears on the ring after the active items
  // This makes belt shift inward as items complete while maintaining stacking order
  return activeCount + 1;
}
