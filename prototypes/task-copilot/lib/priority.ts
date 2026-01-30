/**
 * Priority Calculation Utilities
 *
 * Implements the priority scoring system for the Nudge System.
 * Priority is system-calculated based on multiple factors.
 *
 * Key principle: Importance is user judgment, Priority is system recommendation.
 */

import {
  Task,
  ImportanceLevel,
  EnergyType,
  EnergyLevel,
  PriorityTier,
} from './types';

// ============================================
// Types
// ============================================

export interface PriorityBreakdown {
  importance: number;
  timePressure: number;
  targetPressure: number;
  source: number;
  staleness: number;
  streakRisk: number;
  defer: number;
  energyMatch: number;
}

export interface PriorityInfo {
  score: number;
  tier: PriorityTier;
  effectiveDeadline: Date | null;
  breakdown: PriorityBreakdown;
}

// ============================================
// Constants
// ============================================

// Priority tier thresholds
const TIER_THRESHOLDS = {
  critical: 60,  // 60+ = critical
  high: 40,      // 40-59 = high
  medium: 20,    // 20-39 = medium
  // 0-19 = low
};

// Time pressure thresholds (days)
const TIME_PRESSURE = {
  thisWeek: 7,
  thisMonth: 30,
};

// Staleness thresholds (days)
const STALENESS = {
  moderate: 7,
  severe: 14,
};

// ============================================
// Effective Deadline Calculation
// ============================================

/**
 * Calculate effective deadline accounting for lead time.
 * Effective deadline = deadline - leadTimeDays
 *
 * @param task - The task to calculate for
 * @returns Effective deadline as Date, or null if no deadline
 */
export function getEffectiveDeadline(task: Task): Date | null {
  if (!task.deadlineDate) return null;

  // Parse YYYY-MM-DD string in local time (avoid UTC parsing issues)
  const [year, month, day] = task.deadlineDate.split('-').map(Number);
  const deadline = new Date(year, month - 1, day); // month is 0-indexed

  const leadTime = task.leadTimeDays ?? 0;

  if (leadTime > 0) {
    deadline.setDate(deadline.getDate() - leadTime);
  }

  return deadline;
}

// ============================================
// Component Score Functions
// ============================================

/**
 * Score based on user-set importance level.
 *
 * | Level | Points |
 * |-------|--------|
 * | must_do | +25 |
 * | should_do | +15 |
 * | could_do | +5 |
 * | would_like_to | +0 |
 * | null (not set) | +10 |
 */
export function getImportanceScore(importance: ImportanceLevel | null): number {
  switch (importance) {
    case 'must_do': return 25;
    case 'should_do': return 15;
    case 'could_do': return 5;
    case 'would_like_to': return 0;
    case null: return 10; // Assume moderate if not set
    default: return 10;
  }
}

/**
 * Score based on time pressure (uses effective deadline).
 *
 * | Condition | Points |
 * |-----------|--------|
 * | Effective deadline passed | +40 |
 * | Today/tomorrow | +35 |
 * | Within 7 days | +15 |
 * | Within 30 days | +5 |
 * | Otherwise | +0 |
 */
export function getTimePressureScore(task: Task): number {
  const effectiveDeadline = getEffectiveDeadline(task);
  if (!effectiveDeadline) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadline = new Date(effectiveDeadline.getFullYear(), effectiveDeadline.getMonth(), effectiveDeadline.getDate());

  const diffMs = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 40; // Past deadline
  if (diffDays <= 1) return 35; // Today or tomorrow
  if (diffDays <= TIME_PRESSURE.thisWeek) return 15; // Within 7 days
  if (diffDays <= TIME_PRESSURE.thisMonth) return 5; // Within 30 days
  return 0;
}

/**
 * Score based on target date (softer than deadline, but still signals urgency).
 *
 * | Condition | Points |
 * |-----------|--------|
 * | Target date passed | +15 |
 * | Today/tomorrow | +10 |
 * | Within 7 days | +3 |
 * | Otherwise | +0 |
 */
export function getTargetDatePressureScore(task: Task): number {
  if (!task.targetDate) return 0;

  // Parse YYYY-MM-DD string in local time (avoid UTC parsing issues)
  const [year, month, day] = task.targetDate.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day); // month is 0-indexed

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 15; // Past target date
  if (diffDays <= 1) return 10; // Today or tomorrow
  if (diffDays <= TIME_PRESSURE.thisWeek) return 3; // Within 7 days
  return 0;
}

/**
 * Score based on task source/stakeholder.
 *
 * | Source | Points |
 * |--------|--------|
 * | Partner-created or partner-flagged | +20 |
 * | Work/external | +15 |
 * | Self-created | +0 |
 */
export function getSourceScore(task: Task): number {
  // Check if importance was set by partner
  if (task.importanceSource === 'partner') return 20;

  // Check task source
  switch (task.source) {
    case 'email':
    case 'calendar':
    case 'shared':
      return 15;
    case 'manual':
    case 'ai_breakdown':
    case 'ai_suggestion':
    case 'voice':
    default:
      return 0;
  }
}

/**
 * Score based on staleness (time since last update).
 *
 * | Days since update | Points |
 * |-------------------|--------|
 * | >14 days | +15 |
 * | 7-14 days | +8 |
 * | <7 days | +0 |
 */
export function getStalenessScore(updatedAt: number): number {
  const now = Date.now();
  const diffMs = now - updatedAt;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays > STALENESS.severe) return 15;
  if (diffDays > STALENESS.moderate) return 8;
  return 0;
}

/**
 * Score based on defer count.
 *
 * | Defer count | Points |
 * |-------------|--------|
 * | 3+ times | +10 |
 * | 1-2 times | +5 |
 * | 0 | +0 |
 */
export function getDeferScore(deferredCount: number): number {
  if (deferredCount >= 3) return 10;
  if (deferredCount >= 1) return 5;
  return 0;
}

/**
 * Score based on streak risk (recurring tasks only).
 *
 * | Streak length | Points |
 * |---------------|--------|
 * | >7 days | +12 |
 * | 3-7 days | +6 |
 * | <3 days | +0 |
 */
export function getStreakRiskScore(task: Task): number {
  // Only applies to recurring tasks
  if (!task.isRecurring) return 0;

  const streak = task.recurringStreak ?? 0;

  if (streak > 7) return 12;
  if (streak >= 3) return 6;
  return 0;
}

/**
 * Score based on energy match between task and user.
 *
 * | Match | Points |
 * |-------|--------|
 * | Optimal match | +8 |
 * | Neutral | +0 |
 * | Mismatch | -5 |
 *
 * Matching logic:
 * - High energy user → draining tasks optimal
 * - Low energy user → energizing tasks optimal
 * - Medium energy → neutral match
 */
export function getEnergyMatchScore(
  taskEnergy: EnergyType | null,
  userEnergy: EnergyLevel | null
): number {
  // No score if either is not set
  if (!taskEnergy || !userEnergy) return 0;

  // Medium user energy = no bonus/penalty
  if (userEnergy === 'medium') return 0;

  // Neutral task = no bonus/penalty
  if (taskEnergy === 'neutral') return 0;

  // High energy user should do draining tasks
  if (userEnergy === 'high') {
    if (taskEnergy === 'draining') return 8; // Optimal
    if (taskEnergy === 'energizing') return -5; // Mismatch
  }

  // Low energy user should do energizing tasks
  if (userEnergy === 'low') {
    if (taskEnergy === 'energizing') return 8; // Optimal
    if (taskEnergy === 'draining') return -5; // Mismatch
  }

  return 0;
}

// ============================================
// Main Calculation Functions
// ============================================

/**
 * Calculate priority score from all component factors.
 *
 * @param task - The task to calculate priority for
 * @param userEnergy - Current user energy level (optional)
 * @returns Total priority score
 */
export function calculatePriorityScore(
  task: Task,
  userEnergy: EnergyLevel | null = null
): number {
  let score = 0;

  score += getImportanceScore(task.importance);
  score += getTimePressureScore(task);
  score += getTargetDatePressureScore(task);
  score += getSourceScore(task);
  score += getStalenessScore(task.updatedAt);
  score += getDeferScore(task.deferredCount);
  score += getStreakRiskScore(task);
  score += getEnergyMatchScore(task.energyType, userEnergy);

  return score;
}

/**
 * Get priority tier from score.
 *
 * | Score | Tier |
 * |-------|------|
 * | 60+ | critical |
 * | 40-59 | high |
 * | 20-39 | medium |
 * | 0-19 | low |
 */
export function getPriorityTier(score: number): PriorityTier {
  if (score >= TIER_THRESHOLDS.critical) return 'critical';
  if (score >= TIER_THRESHOLDS.high) return 'high';
  if (score >= TIER_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/**
 * Get complete priority info for a task.
 *
 * @param task - The task to analyze
 * @param userEnergy - Current user energy level (optional)
 * @returns Priority info with score, tier, effective deadline, and breakdown
 */
export function getTaskPriorityInfo(
  task: Task,
  userEnergy: EnergyLevel | null = null
): PriorityInfo {
  const breakdown: PriorityBreakdown = {
    importance: getImportanceScore(task.importance),
    timePressure: getTimePressureScore(task),
    targetPressure: getTargetDatePressureScore(task),
    source: getSourceScore(task),
    staleness: getStalenessScore(task.updatedAt),
    streakRisk: getStreakRiskScore(task),
    defer: getDeferScore(task.deferredCount),
    energyMatch: getEnergyMatchScore(task.energyType, userEnergy),
  };

  const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return {
    score,
    tier: getPriorityTier(score),
    effectiveDeadline: getEffectiveDeadline(task),
    breakdown,
  };
}

// ============================================
// Display Helpers
// ============================================

/**
 * Get human-readable label for importance level.
 */
export function getImportanceLabel(importance: ImportanceLevel | null): string {
  switch (importance) {
    case 'must_do': return 'Must Do';
    case 'should_do': return 'Should Do';
    case 'could_do': return 'Could Do';
    case 'would_like_to': return 'Would Like To';
    case null: return 'Not Set';
    default: return 'Not Set';
  }
}

/**
 * Get human-readable label for energy type.
 */
export function getEnergyTypeLabel(energyType: EnergyType | null): string {
  switch (energyType) {
    case 'energizing': return 'Energizing';
    case 'neutral': return 'Neutral';
    case 'draining': return 'Draining';
    case null: return 'Not Set';
    default: return 'Not Set';
  }
}

/**
 * Get human-readable label for priority tier.
 */
export function getPriorityTierLabel(tier: PriorityTier): string {
  switch (tier) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'Unknown';
  }
}

/**
 * Get description for each breakdown factor.
 */
export function getBreakdownDescription(
  task: Task,
  userEnergy: EnergyLevel | null = null
): Record<keyof PriorityBreakdown, string> {
  return {
    importance: getImportanceLabel(task.importance),
    timePressure: task.deadlineDate
      ? `Due ${task.deadlineDate}${task.leadTimeDays ? ` (${task.leadTimeDays}d lead)` : ''}`
      : 'No deadline',
    targetPressure: task.targetDate
      ? `Target ${task.targetDate}`
      : 'No target',
    source: task.importanceSource === 'partner'
      ? 'Partner'
      : task.source === 'email' || task.source === 'calendar' || task.source === 'shared'
        ? 'External'
        : 'Self',
    staleness: (() => {
      const days = Math.floor((Date.now() - task.updatedAt) / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      return `${days} days ago`;
    })(),
    streakRisk: task.isRecurring
      ? `${task.recurringStreak ?? 0} day streak`
      : 'N/A',
    defer: task.deferredCount > 0
      ? `${task.deferredCount} time${task.deferredCount > 1 ? 's' : ''}`
      : '0 times',
    energyMatch: !userEnergy
      ? 'N/A'
      : !task.energyType
        ? 'Not set'
        : `${getEnergyTypeLabel(task.energyType)} task, ${userEnergy} energy`,
  };
}

// ============================================
// Priority Queue Data Layer
// ============================================

export interface PriorityQueueTask {
  task: Task;
  priorityInfo: PriorityInfo;
}

/**
 * Get tasks sorted by priority for the Priority Queue.
 * Filters out completed and archived tasks.
 *
 * @param tasks - All tasks
 * @param userEnergy - Current user energy level (optional)
 * @returns Array of tasks with priority info, sorted by score descending
 */
export function getTasksForPriorityQueue(
  tasks: Task[],
  userEnergy: EnergyLevel | null = null
): PriorityQueueTask[] {
  // Filter out completed, archived, and deleted tasks
  const activeTasks = tasks.filter(
    (task) =>
      task.status !== 'complete' &&
      task.status !== 'archived' &&
      !task.deletedAt
  );

  // Calculate priority for each task
  const tasksWithPriority: PriorityQueueTask[] = activeTasks.map((task) => ({
    task,
    priorityInfo: getTaskPriorityInfo(task, userEnergy),
  }));

  // Sort by priority score descending (highest priority first)
  tasksWithPriority.sort((a, b) => b.priorityInfo.score - a.priorityInfo.score);

  return tasksWithPriority;
}

/**
 * Group tasks by their priority tier.
 *
 * @param tasks - Array of tasks with priority info
 * @returns Object with arrays of tasks grouped by tier
 */
export function groupTasksByTier(
  tasks: PriorityQueueTask[]
): Record<PriorityTier, PriorityQueueTask[]> {
  const groups: Record<PriorityTier, PriorityQueueTask[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const task of tasks) {
    groups[task.priorityInfo.tier].push(task);
  }

  return groups;
}

// ============================================
// Energy-Aware Filtering (Phase 6)
// ============================================

export type EnergyFilterMode = 'all' | 'matching' | 'hide_mismatched';

/**
 * Determine if a task matches the user's current energy level.
 *
 * Matching logic:
 * - High energy user → draining tasks are optimal, energizing are mismatch
 * - Low energy user → energizing tasks are optimal, draining are mismatch
 * - Medium energy → all tasks match (neutral)
 * - Task with no energy type → always matches
 * - User with no energy set → all tasks match
 *
 * @returns 'match' | 'mismatch' | 'neutral'
 */
export function getEnergyMatchStatus(
  taskEnergy: EnergyType | null,
  userEnergy: EnergyLevel | null
): 'match' | 'mismatch' | 'neutral' {
  // No filtering if either is not set
  if (!taskEnergy || !userEnergy) return 'neutral';

  // Neutral task or medium user energy = neutral (neither match nor mismatch)
  if (taskEnergy === 'neutral' || userEnergy === 'medium') return 'neutral';

  // High energy user should do draining tasks
  if (userEnergy === 'high') {
    if (taskEnergy === 'draining') return 'match';
    if (taskEnergy === 'energizing') return 'mismatch';
  }

  // Low energy user should do energizing tasks
  if (userEnergy === 'low') {
    if (taskEnergy === 'energizing') return 'match';
    if (taskEnergy === 'draining') return 'mismatch';
  }

  return 'neutral';
}

/**
 * Filter tasks for Priority Queue with energy-aware filtering.
 *
 * When filterMode is 'hide_mismatched':
 * - Critical tier tasks are ALWAYS shown (override)
 * - Matching/neutral tasks are shown
 * - Mismatched tasks are hidden (returned separately for "show more" UI)
 *
 * @param tasks - All priority queue tasks
 * @param userEnergy - User's current energy level
 * @param filterMode - How strictly to filter
 * @returns { visible, hidden } - visible tasks to show, hidden for "show N filtered" UI
 */
export function filterTasksByEnergy(
  tasks: PriorityQueueTask[],
  userEnergy: EnergyLevel | null,
  filterMode: EnergyFilterMode = 'all'
): { visible: PriorityQueueTask[]; hidden: PriorityQueueTask[] } {
  // No filtering if mode is 'all' or no energy set
  if (filterMode === 'all' || !userEnergy) {
    return { visible: tasks, hidden: [] };
  }

  const visible: PriorityQueueTask[] = [];
  const hidden: PriorityQueueTask[] = [];

  for (const item of tasks) {
    const matchStatus = getEnergyMatchStatus(item.task.energyType, userEnergy);

    // Critical tasks always visible (energy override)
    if (item.priorityInfo.tier === 'critical') {
      visible.push(item);
      continue;
    }

    // Filter based on mode
    if (filterMode === 'hide_mismatched') {
      if (matchStatus === 'mismatch') {
        hidden.push(item);
      } else {
        visible.push(item);
      }
    } else if (filterMode === 'matching') {
      // 'matching' mode: only show exact matches
      if (matchStatus === 'match') {
        visible.push(item);
      } else {
        hidden.push(item);
      }
    }
  }

  return { visible, hidden };
}

/**
 * Get energy match indicator for task card display.
 * Returns null if no indicator needed, or a descriptor for UI.
 */
export function getEnergyMatchIndicator(
  taskEnergy: EnergyType | null,
  userEnergy: EnergyLevel | null
): { type: 'match' | 'mismatch'; label: string } | null {
  if (!taskEnergy || !userEnergy || userEnergy === 'medium') return null;

  const status = getEnergyMatchStatus(taskEnergy, userEnergy);
  if (status === 'neutral') return null;

  if (status === 'match') {
    return {
      type: 'match',
      label: userEnergy === 'high' ? 'Good for high energy' : 'Good for low energy',
    };
  }

  return {
    type: 'mismatch',
    label: userEnergy === 'high' ? 'Better when less energetic' : 'Better when more energetic',
  };
}

/**
 * Get color scheme for a priority tier.
 */
export function getTierColors(tier: PriorityTier): {
  bg: string;
  border: string;
  text: string;
  badge: string;
} {
  switch (tier) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-400',
        badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
      };
    case 'high':
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-700 dark:text-orange-400',
        badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
      };
    case 'medium':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-400',
        badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
      };
    case 'low':
    default:
      return {
        bg: 'bg-zinc-50 dark:bg-zinc-800/50',
        border: 'border-zinc-200 dark:border-zinc-700',
        text: 'text-zinc-600 dark:text-zinc-400',
        badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
      };
  }
}
