/**
 * Tests for Priority Calculation Functions
 *
 * Run with: npx tsx lib/priority.test.ts
 *
 * These tests verify the priority scoring system used by the Nudge System.
 */

import {
  getEffectiveDeadline,
  getImportanceScore,
  getTimePressureScore,
  getSourceScore,
  getStalenessScore,
  getDeferScore,
  getStreakRiskScore,
  getEnergyMatchScore,
  calculatePriorityScore,
  getPriorityTier,
  getTaskPriorityInfo,
} from './priority';
import { Task, createTask } from './types';

// ============================================
// Test Helpers
// ============================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${name}`);
    console.error(`  ${(error as Error).message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      `${message ? message + ': ' : ''}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertClose(actual: number, expected: number, tolerance: number, message?: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `${message ? message + ': ' : ''}Expected ~${expected}, got ${actual} (tolerance: ${tolerance})`
    );
  }
}

function createTestTask(overrides: Partial<Task> = {}): Task {
  return createTask('Test Task', overrides);
}

function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function dateString(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

// ============================================
// Tests: getImportanceScore
// ============================================

console.log('\n--- getImportanceScore ---');

test('must_do returns 25', () => {
  assertEqual(getImportanceScore('must_do'), 25);
});

test('should_do returns 15', () => {
  assertEqual(getImportanceScore('should_do'), 15);
});

test('could_do returns 5', () => {
  assertEqual(getImportanceScore('could_do'), 5);
});

test('would_like_to returns 0', () => {
  assertEqual(getImportanceScore('would_like_to'), 0);
});

test('null returns 10 (default moderate)', () => {
  assertEqual(getImportanceScore(null), 10);
});

// ============================================
// Tests: getTimePressureScore
// ============================================

console.log('\n--- getTimePressureScore ---');

test('no deadline returns 0', () => {
  const task = createTestTask({ deadlineDate: null });
  assertEqual(getTimePressureScore(task), 0);
});

test('deadline passed returns 40', () => {
  const task = createTestTask({ deadlineDate: dateString(-1) }); // Yesterday
  assertEqual(getTimePressureScore(task), 40);
});

test('deadline today returns 35', () => {
  const task = createTestTask({ deadlineDate: dateString(0) }); // Today
  assertEqual(getTimePressureScore(task), 35);
});

test('deadline tomorrow returns 35', () => {
  const task = createTestTask({ deadlineDate: dateString(1) }); // Tomorrow
  assertEqual(getTimePressureScore(task), 35);
});

test('deadline in 3 days returns 15 (within week)', () => {
  const task = createTestTask({ deadlineDate: dateString(3) });
  assertEqual(getTimePressureScore(task), 15);
});

test('deadline in 7 days returns 15 (within week)', () => {
  const task = createTestTask({ deadlineDate: dateString(7) });
  assertEqual(getTimePressureScore(task), 15);
});

test('deadline in 14 days returns 5 (within month)', () => {
  const task = createTestTask({ deadlineDate: dateString(14) });
  assertEqual(getTimePressureScore(task), 5);
});

test('deadline in 30 days returns 5 (within month)', () => {
  const task = createTestTask({ deadlineDate: dateString(30) });
  assertEqual(getTimePressureScore(task), 5);
});

test('deadline in 60 days returns 0 (far out)', () => {
  const task = createTestTask({ deadlineDate: dateString(60) });
  assertEqual(getTimePressureScore(task), 0);
});

// ============================================
// Tests: getEffectiveDeadline with lead time
// ============================================

console.log('\n--- getEffectiveDeadline ---');

test('no deadline returns null', () => {
  const task = createTestTask({ deadlineDate: null });
  assertEqual(getEffectiveDeadline(task), null);
});

test('deadline without lead time returns deadline date', () => {
  const task = createTestTask({ deadlineDate: '2026-02-15', leadTimeDays: null });
  const effective = getEffectiveDeadline(task);
  assertEqual(effective?.toISOString().split('T')[0], '2026-02-15');
});

test('deadline with 7 day lead time returns deadline - 7 days', () => {
  const task = createTestTask({ deadlineDate: '2026-02-15', leadTimeDays: 7 });
  const effective = getEffectiveDeadline(task);
  assertEqual(effective?.toISOString().split('T')[0], '2026-02-08');
});

test('lead time affects time pressure calculation', () => {
  // Deadline in 10 days (would be +5 for within month)
  // But with 7 day lead time, effective deadline is in 3 days (within week = +15)
  const task = createTestTask({ deadlineDate: dateString(10), leadTimeDays: 7 });
  assertEqual(getTimePressureScore(task), 15);
});

// ============================================
// Tests: getSourceScore
// ============================================

console.log('\n--- getSourceScore ---');

test('partner importance source returns 20', () => {
  const task = createTestTask({ importanceSource: 'partner' });
  assertEqual(getSourceScore(task), 20);
});

test('email source returns 15', () => {
  const task = createTestTask({ source: 'email' });
  assertEqual(getSourceScore(task), 15);
});

test('calendar source returns 15', () => {
  const task = createTestTask({ source: 'calendar' });
  assertEqual(getSourceScore(task), 15);
});

test('shared source returns 15', () => {
  const task = createTestTask({ source: 'shared' });
  assertEqual(getSourceScore(task), 15);
});

test('manual source returns 0', () => {
  const task = createTestTask({ source: 'manual' });
  assertEqual(getSourceScore(task), 0);
});

test('voice source returns 0', () => {
  const task = createTestTask({ source: 'voice' });
  assertEqual(getSourceScore(task), 0);
});

// ============================================
// Tests: getStalenessScore
// ============================================

console.log('\n--- getStalenessScore ---');

test('updated today returns 0', () => {
  assertEqual(getStalenessScore(Date.now()), 0);
});

test('updated 3 days ago returns 0', () => {
  assertEqual(getStalenessScore(daysAgo(3)), 0);
});

test('updated 6 days ago returns 0 (under threshold)', () => {
  assertEqual(getStalenessScore(daysAgo(6)), 0);
});

test('updated 8 days ago returns 8 (moderate)', () => {
  assertEqual(getStalenessScore(daysAgo(8)), 8);
});

test('updated 14 days ago returns 8 (still moderate)', () => {
  assertEqual(getStalenessScore(daysAgo(14)), 8);
});

test('updated 15 days ago returns 15 (severe)', () => {
  assertEqual(getStalenessScore(daysAgo(15)), 15);
});

test('updated 30 days ago returns 15 (severe)', () => {
  assertEqual(getStalenessScore(daysAgo(30)), 15);
});

// ============================================
// Tests: getDeferScore
// ============================================

console.log('\n--- getDeferScore ---');

test('never deferred returns 0', () => {
  assertEqual(getDeferScore(0), 0);
});

test('deferred 1 time returns 5', () => {
  assertEqual(getDeferScore(1), 5);
});

test('deferred 2 times returns 5', () => {
  assertEqual(getDeferScore(2), 5);
});

test('deferred 3 times returns 10', () => {
  assertEqual(getDeferScore(3), 10);
});

test('deferred 5 times returns 10', () => {
  assertEqual(getDeferScore(5), 10);
});

// ============================================
// Tests: getStreakRiskScore
// ============================================

console.log('\n--- getStreakRiskScore ---');

test('non-recurring task returns 0', () => {
  const task = createTestTask({ isRecurring: false, recurringStreak: 10 });
  assertEqual(getStreakRiskScore(task), 0);
});

test('recurring with 0 streak returns 0', () => {
  const task = createTestTask({ isRecurring: true, recurringStreak: 0 });
  assertEqual(getStreakRiskScore(task), 0);
});

test('recurring with 2 day streak returns 0', () => {
  const task = createTestTask({ isRecurring: true, recurringStreak: 2 });
  assertEqual(getStreakRiskScore(task), 0);
});

test('recurring with 3 day streak returns 6', () => {
  const task = createTestTask({ isRecurring: true, recurringStreak: 3 });
  assertEqual(getStreakRiskScore(task), 6);
});

test('recurring with 7 day streak returns 6', () => {
  const task = createTestTask({ isRecurring: true, recurringStreak: 7 });
  assertEqual(getStreakRiskScore(task), 6);
});

test('recurring with 8 day streak returns 12', () => {
  const task = createTestTask({ isRecurring: true, recurringStreak: 8 });
  assertEqual(getStreakRiskScore(task), 12);
});

// ============================================
// Tests: getEnergyMatchScore
// ============================================

console.log('\n--- getEnergyMatchScore ---');

test('no user energy returns 0', () => {
  assertEqual(getEnergyMatchScore('draining', null), 0);
});

test('no task energy returns 0', () => {
  assertEqual(getEnergyMatchScore(null, 'high'), 0);
});

test('medium user energy always returns 0', () => {
  assertEqual(getEnergyMatchScore('draining', 'medium'), 0);
  assertEqual(getEnergyMatchScore('energizing', 'medium'), 0);
});

test('neutral task energy always returns 0', () => {
  assertEqual(getEnergyMatchScore('neutral', 'high'), 0);
  assertEqual(getEnergyMatchScore('neutral', 'low'), 0);
});

test('high energy user + draining task returns 8 (optimal)', () => {
  assertEqual(getEnergyMatchScore('draining', 'high'), 8);
});

test('high energy user + energizing task returns -5 (mismatch)', () => {
  assertEqual(getEnergyMatchScore('energizing', 'high'), -5);
});

test('low energy user + energizing task returns 8 (optimal)', () => {
  assertEqual(getEnergyMatchScore('energizing', 'low'), 8);
});

test('low energy user + draining task returns -5 (mismatch)', () => {
  assertEqual(getEnergyMatchScore('draining', 'low'), -5);
});

// ============================================
// Tests: getPriorityTier
// ============================================

console.log('\n--- getPriorityTier ---');

test('score 0 returns low', () => {
  assertEqual(getPriorityTier(0), 'low');
});

test('score 19 returns low', () => {
  assertEqual(getPriorityTier(19), 'low');
});

test('score 20 returns medium', () => {
  assertEqual(getPriorityTier(20), 'medium');
});

test('score 39 returns medium', () => {
  assertEqual(getPriorityTier(39), 'medium');
});

test('score 40 returns high', () => {
  assertEqual(getPriorityTier(40), 'high');
});

test('score 59 returns high', () => {
  assertEqual(getPriorityTier(59), 'high');
});

test('score 60 returns critical', () => {
  assertEqual(getPriorityTier(60), 'critical');
});

test('score 100 returns critical', () => {
  assertEqual(getPriorityTier(100), 'critical');
});

// ============================================
// Tests: calculatePriorityScore (integration)
// ============================================

console.log('\n--- calculatePriorityScore (integration) ---');

test('minimal task (just title) returns ~10 (null importance)', () => {
  const task = createTestTask();
  const score = calculatePriorityScore(task);
  assertEqual(score, 10); // Just null importance score
});

test('must_do task with deadline today returns high score', () => {
  const task = createTestTask({
    importance: 'must_do',
    deadlineDate: dateString(0),
  });
  const score = calculatePriorityScore(task);
  assertEqual(score, 25 + 35); // importance + time pressure = 60 = critical
});

test('deferred task with partner importance gets bonus', () => {
  const task = createTestTask({
    importanceSource: 'partner',
    deferredCount: 3,
  });
  const score = calculatePriorityScore(task);
  assertEqual(score, 10 + 20 + 10); // null importance + partner + defer = 40 = high
});

test('example from spec: File taxes', () => {
  // Importance: must_do (+25)
  // Deadline: April 15, Lead time: 14 days
  // Effective deadline: 6 days away (this week) = +15
  // Source: self (+0)
  // Staleness: recent (+0)
  // Defer count: 0 (+0)
  // Total: 40 → High priority
  const task = createTestTask({
    importance: 'must_do',
    deadlineDate: dateString(6), // 6 days from now
    source: 'manual',
    deferredCount: 0,
  });
  const score = calculatePriorityScore(task);
  assertEqual(score, 25 + 15); // 40 = high
  assertEqual(getPriorityTier(score), 'high');
});

// ============================================
// Tests: getTaskPriorityInfo
// ============================================

console.log('\n--- getTaskPriorityInfo ---');

test('returns complete breakdown with all fields', () => {
  const task = createTestTask({
    importance: 'should_do',
    deadlineDate: dateString(3),
    source: 'email',
    deferredCount: 2,
  });

  const info = getTaskPriorityInfo(task);

  assertEqual(info.breakdown.importance, 15);
  assertEqual(info.breakdown.timePressure, 15);
  assertEqual(info.breakdown.source, 15);
  assertEqual(info.breakdown.defer, 5);
  assertEqual(info.score, 15 + 15 + 15 + 5); // 50
  assertEqual(info.tier, 'high');
});

test('includes effective deadline in result', () => {
  const task = createTestTask({
    deadlineDate: '2026-02-15',
    leadTimeDays: 7,
  });

  const info = getTaskPriorityInfo(task);
  assertEqual(info.effectiveDeadline?.toISOString().split('T')[0], '2026-02-08');
});

// ============================================
// Summary
// ============================================

console.log('\n========================================');
console.log(`Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
