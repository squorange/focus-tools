import { Subtask } from './types';

/**
 * ORBITAL POSITIONING SYSTEM - CRITICAL INVARIANTS
 *
 * This file manages the positioning of subtasks in orbital rings around their parent task.
 * To prevent regressions, the following invariants MUST be maintained:
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * INVARIANT #1: ANGULAR POSITION STABILITY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Subtask angles (assignedStartingAngle) MUST be calculated based on ORIGINAL array index,
 * NOT filtered/active array index. This ensures angles stay fixed when items complete.
 *
 * ✅ CORRECT:   getSubtaskAngle(originalArrayIndex, task.subtasks.length)
 * ❌ INCORRECT: getSubtaskAngle(activeArrayIndex, activeSubtasks.length)
 *
 * Why: When a subtask completes and fades away, remaining subtasks should maintain their
 * angular positions while smoothly transitioning inward radially. If angles are based on
 * filtered index, they will "jump" to new positions after the completion animation.
 *
 * Test: Complete a subtask and verify remaining subtasks shift inward radially but stay
 * at the same angular positions (no rotation during transition).
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * INVARIANT #2: RADIAL POSITION DYNAMICS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Subtask radii (assignedOrbitRadius) SHOULD be calculated based on ACTIVE position,
 * allowing remaining items to shift inward as items complete.
 *
 * ✅ CORRECT: Calculate radius based on active index (0, 1, 2... for non-completed items)
 *
 * Why: When items complete, we want remaining items to smoothly move to inner rings,
 * creating a satisfying "collapsing inward" effect.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * INVARIANT #3: PERSISTENCE REQUIREMENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ALL subtasks MUST have assignedStartingAngle and assignedOrbitRadius persisted to
 * the database immediately after creation or initialization.
 *
 * When to persist:
 * - After calling initializeSubtaskOrbits() → ALWAYS call saveTask()
 * - After creating new subtasks → Initialize orbital positions + save
 * - After loading from API → Initialize orbital positions + save
 * - After duplicating tasks → Re-initialize orbital positions + save
 *
 * Why: If these values are not persisted, they will be recalculated on next render,
 * potentially using incorrect indices (see Invariant #1).
 *
 * Checklist when modifying task/subtask creation code:
 * [ ] Does new code call initializeSubtaskOrbits()?
 * [ ] Does it call saveTask() after initialization?
 * [ ] Have you tested subtask completion to verify no angular jumps?
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * INVARIANT #4: BELT POSITION TRACKING
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * The priority belt maintains its position in STACKING ORDER (relative to which subtasks
 * are inside/outside) while shifting inward RADIALLY as items complete.
 *
 * Belt position is determined by:
 * 1. Find last priority item in original array order
 * 2. Count active items from start up to that position
 * 3. Belt appears on the ring after those active items
 *
 * This ensures belt maintains logical grouping while responding to completions.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * REGRESSION HISTORY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This bug has appeared multiple times. Common causes:
 *
 * 1. New code paths that load/create tasks without persisting orbital positions
 * 2. Using filtered array index instead of original array index for angles
 * 3. Sample data missing orbital position initialization
 * 4. Database migrations not initializing orbital positions for existing data
 *
 * Last occurrences:
 * - 2025-11-10: Fixed sample data initialization + persistence in page.tsx
 * - [Add date here when this recurs to track pattern]
 *
 * If you're reading this because the bug returned:
 * 1. Check if assignedStartingAngle exists in database (console.log the subtask)
 * 2. Check if new code path is missing initializeSubtaskOrbits() + saveTask()
 * 3. Check if angle calculation uses filtered vs original index
 * 4. Add this occurrence to the history above with date and root cause
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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
 *
 * CRITICAL: This function MUST preserve assignedStartingAngle values.
 * Only radii should be recalculated. Angles must remain unchanged to prevent jumps.
 *
 * CHECKLIST when modifying this function:
 * [ ] Preserve assignedStartingAngle (do NOT recalculate)
 * [ ] Only update assignedOrbitRadius based on active position
 * [ ] Account for belt position when calculating radii
 * [ ] Test: Complete subtask → radii shift inward, angles stay same
 * [ ] See INVARIANT #1 and #2 in file header for details
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
      // Explicitly preserve angle - critical to prevent angular jumps
      assignedStartingAngle: st.assignedStartingAngle,
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
 *
 * CRITICAL: Caller MUST call saveTask() after this function to persist
 * the initialized orbital positions to the database. If not saved, positions
 * will be lost on next render and may cause angular jumps.
 *
 * CHECKLIST for callers of this function:
 * [ ] Call saveTask() immediately after initializeSubtaskOrbits()
 * [ ] Verify all subtasks in result have assignedStartingAngle defined
 * [ ] Verify all subtasks in result have assignedOrbitRadius defined
 * [ ] Test: Complete a subtask and verify no angular jumps
 * [ ] See INVARIANT #3 in file header for persistence requirements
 *
 * @example
 * const initialized = initializeSubtaskOrbits(task.subtasks, task.priorityMarkerRing);
 * await saveTask({ ...task, subtasks: initialized }); // ← MUST SAVE!
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
 * Runtime validation for orbital positioning system
 * Checks if all invariants are maintained
 * Only runs in development mode
 */
export interface ValidationResult {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export function validateOrbitalInvariants(
  subtasks: Subtask[],
  taskId: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!subtasks || subtasks.length === 0) {
    return { errors, warnings, isValid: true };
  }

  subtasks.forEach((st, index) => {
    // INVARIANT #3: Persistence requirement
    // All subtasks must have orbital positions assigned
    if (st.assignedStartingAngle === undefined) {
      errors.push(
        `[${taskId}] Subtask "${st.title}" (${st.id}) missing assignedStartingAngle. ` +
        `This will cause angular jumps on completion. Call initializeSubtaskOrbits() and saveTask().`
      );
    }

    if (st.assignedOrbitRadius === undefined) {
      errors.push(
        `[${taskId}] Subtask "${st.title}" (${st.id}) missing assignedOrbitRadius. ` +
        `This will cause layout issues. Call initializeSubtaskOrbits() and saveTask().`
      );
    }

    // INVARIANT #1: Angular position stability
    // Check if angle looks reasonable (warning only, as intentional reordering is valid)
    if (st.assignedStartingAngle !== undefined) {
      const expectedAngle = getSubtaskAngle(index, subtasks.length);
      const angleDiff = Math.abs(st.assignedStartingAngle - expectedAngle);

      // Allow some tolerance for custom positioning
      if (angleDiff > 5 && angleDiff < 355) {
        warnings.push(
          `[${taskId}] Subtask "${st.title}" angle ${st.assignedStartingAngle.toFixed(1)}° ` +
          `differs from expected ${expectedAngle.toFixed(1)}° (index ${index}). ` +
          `This may be intentional (reordered) or indicate calculation from wrong index.`
        );
      }
    }
  });

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

/**
 * Log validation results to console (development only)
 */
export function logValidationResults(result: ValidationResult, taskTitle?: string): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;

  const prefix = taskTitle ? `[Orbital Validation: ${taskTitle}]` : '[Orbital Validation]';

  if (result.errors.length > 0) {
    console.error(`${prefix} ERRORS:`, result.errors);
    console.error(
      `${prefix} See orbit-utils.ts header for invariants and KNOWN_ISSUES.md for prevention strategies.`
    );
  }

  if (result.warnings.length > 0) {
    console.warn(`${prefix} Warnings:`, result.warnings);
  }

  if (result.isValid && result.warnings.length === 0) {
    // Silent success - only log errors and warnings
  }
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
