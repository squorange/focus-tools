/**
 * Priority Calculation Tests (Vitest)
 *
 * Tests for the priority scoring system used by the Nudge System.
 */

import { describe, it, expect } from 'vitest';
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
import { createTask } from './types';

// ============================================
// Test Helpers
// ============================================

function createTestTask(overrides: Parameters<typeof createTask>[1] = {}) {
  return createTask('Test Task', overrides);
}

/**
 * Get a date string N days from today in YYYY-MM-DD format.
 * Uses local time to match priority.ts date parsing.
 */
function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

// ============================================
// getImportanceScore
// ============================================

describe('getImportanceScore', () => {
  it('must_do returns 25', () => {
    expect(getImportanceScore('must_do')).toBe(25);
  });

  it('should_do returns 15', () => {
    expect(getImportanceScore('should_do')).toBe(15);
  });

  it('could_do returns 5', () => {
    expect(getImportanceScore('could_do')).toBe(5);
  });

  it('would_like_to returns 0', () => {
    expect(getImportanceScore('would_like_to')).toBe(0);
  });

  it('null returns 10 (default moderate)', () => {
    expect(getImportanceScore(null)).toBe(10);
  });
});

// ============================================
// getTimePressureScore
// ============================================

describe('getTimePressureScore', () => {
  it('no deadline returns 0', () => {
    const task = createTestTask({ deadlineDate: null });
    expect(getTimePressureScore(task)).toBe(0);
  });

  it('deadline far in past returns 40', () => {
    const task = createTestTask({ deadlineDate: dateFromNow(-7) }); // Week ago
    expect(getTimePressureScore(task)).toBe(40);
  });

  it('deadline today returns 35', () => {
    const task = createTestTask({ deadlineDate: dateFromNow(0) });
    expect(getTimePressureScore(task)).toBe(35);
  });

  it('deadline in 3 days returns 15 (within week)', () => {
    const task = createTestTask({ deadlineDate: dateFromNow(3) });
    expect(getTimePressureScore(task)).toBe(15);
  });

  it('deadline in 5 days returns 15 (within week)', () => {
    const task = createTestTask({ deadlineDate: dateFromNow(5) });
    expect(getTimePressureScore(task)).toBe(15);
  });

  it('deadline in 14 days returns 5 (within month)', () => {
    const task = createTestTask({ deadlineDate: dateFromNow(14) });
    expect(getTimePressureScore(task)).toBe(5);
  });

  it('deadline in 20 days returns 5 (within month)', () => {
    const task = createTestTask({ deadlineDate: dateFromNow(20) });
    expect(getTimePressureScore(task)).toBe(5);
  });

  it('deadline in 60 days returns 0 (far out)', () => {
    const task = createTestTask({ deadlineDate: dateFromNow(60) });
    expect(getTimePressureScore(task)).toBe(0);
  });
});

// ============================================
// getEffectiveDeadline
// ============================================

describe('getEffectiveDeadline', () => {
  it('no deadline returns null', () => {
    const task = createTestTask({ deadlineDate: null });
    expect(getEffectiveDeadline(task)).toBeNull();
  });

  it('deadline without lead time returns deadline date', () => {
    const task = createTestTask({ deadlineDate: '2026-02-15', leadTimeDays: null });
    const effective = getEffectiveDeadline(task);
    expect(effective).not.toBeNull();
    // Compare just the date portion
    const dateStr = `${effective!.getFullYear()}-${String(effective!.getMonth() + 1).padStart(2, '0')}-${String(effective!.getDate()).padStart(2, '0')}`;
    expect(dateStr).toBe('2026-02-15');
  });

  it('deadline with 7 day lead time returns deadline - 7 days', () => {
    const task = createTestTask({ deadlineDate: '2026-02-15', leadTimeDays: 7 });
    const effective = getEffectiveDeadline(task);
    expect(effective).not.toBeNull();
    const dateStr = `${effective!.getFullYear()}-${String(effective!.getMonth() + 1).padStart(2, '0')}-${String(effective!.getDate()).padStart(2, '0')}`;
    expect(dateStr).toBe('2026-02-08');
  });

  it('lead time affects time pressure calculation', () => {
    // Deadline in 10 days → within month (+5)
    // But with 7 day lead time, effective is 3 days → within week (+15)
    const task = createTestTask({ deadlineDate: dateFromNow(10), leadTimeDays: 7 });
    expect(getTimePressureScore(task)).toBe(15);
  });
});

// ============================================
// getSourceScore
// ============================================

describe('getSourceScore', () => {
  it('partner importance source returns 20', () => {
    const task = createTestTask({ importanceSource: 'partner' });
    expect(getSourceScore(task)).toBe(20);
  });

  it('email source returns 15', () => {
    const task = createTestTask({ source: 'email' });
    expect(getSourceScore(task)).toBe(15);
  });

  it('calendar source returns 15', () => {
    const task = createTestTask({ source: 'calendar' });
    expect(getSourceScore(task)).toBe(15);
  });

  it('shared source returns 15', () => {
    const task = createTestTask({ source: 'shared' });
    expect(getSourceScore(task)).toBe(15);
  });

  it('manual source returns 0', () => {
    const task = createTestTask({ source: 'manual' });
    expect(getSourceScore(task)).toBe(0);
  });

  it('voice source returns 0', () => {
    const task = createTestTask({ source: 'voice' });
    expect(getSourceScore(task)).toBe(0);
  });
});

// ============================================
// getStalenessScore
// ============================================

describe('getStalenessScore', () => {
  it('updated today returns 0', () => {
    expect(getStalenessScore(Date.now())).toBe(0);
  });

  it('updated 3 days ago returns 0', () => {
    expect(getStalenessScore(daysAgo(3))).toBe(0);
  });

  it('updated 6 days ago returns 0 (under threshold)', () => {
    expect(getStalenessScore(daysAgo(6))).toBe(0);
  });

  it('updated 8 days ago returns 8 (moderate)', () => {
    expect(getStalenessScore(daysAgo(8))).toBe(8);
  });

  it('updated 14 days ago returns 8 (still moderate)', () => {
    expect(getStalenessScore(daysAgo(14))).toBe(8);
  });

  it('updated 15 days ago returns 15 (severe)', () => {
    expect(getStalenessScore(daysAgo(15))).toBe(15);
  });

  it('updated 30 days ago returns 15 (severe)', () => {
    expect(getStalenessScore(daysAgo(30))).toBe(15);
  });
});

// ============================================
// getDeferScore
// ============================================

describe('getDeferScore', () => {
  it('never deferred returns 0', () => {
    expect(getDeferScore(0)).toBe(0);
  });

  it('deferred 1 time returns 5', () => {
    expect(getDeferScore(1)).toBe(5);
  });

  it('deferred 2 times returns 5', () => {
    expect(getDeferScore(2)).toBe(5);
  });

  it('deferred 3 times returns 10', () => {
    expect(getDeferScore(3)).toBe(10);
  });

  it('deferred 5 times returns 10', () => {
    expect(getDeferScore(5)).toBe(10);
  });
});

// ============================================
// getStreakRiskScore
// ============================================

describe('getStreakRiskScore', () => {
  it('non-recurring task returns 0', () => {
    const task = createTestTask({ isRecurring: false, recurringStreak: 10 });
    expect(getStreakRiskScore(task)).toBe(0);
  });

  it('recurring with 0 streak returns 0', () => {
    const task = createTestTask({ isRecurring: true, recurringStreak: 0 });
    expect(getStreakRiskScore(task)).toBe(0);
  });

  it('recurring with 2 day streak returns 0', () => {
    const task = createTestTask({ isRecurring: true, recurringStreak: 2 });
    expect(getStreakRiskScore(task)).toBe(0);
  });

  it('recurring with 3 day streak returns 6', () => {
    const task = createTestTask({ isRecurring: true, recurringStreak: 3 });
    expect(getStreakRiskScore(task)).toBe(6);
  });

  it('recurring with 7 day streak returns 6', () => {
    const task = createTestTask({ isRecurring: true, recurringStreak: 7 });
    expect(getStreakRiskScore(task)).toBe(6);
  });

  it('recurring with 8 day streak returns 12', () => {
    const task = createTestTask({ isRecurring: true, recurringStreak: 8 });
    expect(getStreakRiskScore(task)).toBe(12);
  });
});

// ============================================
// getEnergyMatchScore
// ============================================

describe('getEnergyMatchScore', () => {
  it('no user energy returns 0', () => {
    expect(getEnergyMatchScore('draining', null)).toBe(0);
  });

  it('no task energy returns 0', () => {
    expect(getEnergyMatchScore(null, 'high')).toBe(0);
  });

  it('medium user energy always returns 0', () => {
    expect(getEnergyMatchScore('draining', 'medium')).toBe(0);
    expect(getEnergyMatchScore('energizing', 'medium')).toBe(0);
  });

  it('neutral task energy always returns 0', () => {
    expect(getEnergyMatchScore('neutral', 'high')).toBe(0);
    expect(getEnergyMatchScore('neutral', 'low')).toBe(0);
  });

  it('high energy user + draining task returns 8 (optimal)', () => {
    expect(getEnergyMatchScore('draining', 'high')).toBe(8);
  });

  it('high energy user + energizing task returns -5 (mismatch)', () => {
    expect(getEnergyMatchScore('energizing', 'high')).toBe(-5);
  });

  it('low energy user + energizing task returns 8 (optimal)', () => {
    expect(getEnergyMatchScore('energizing', 'low')).toBe(8);
  });

  it('low energy user + draining task returns -5 (mismatch)', () => {
    expect(getEnergyMatchScore('draining', 'low')).toBe(-5);
  });
});

// ============================================
// getPriorityTier
// ============================================

describe('getPriorityTier', () => {
  it('score 0 returns low', () => {
    expect(getPriorityTier(0)).toBe('low');
  });

  it('score 19 returns low', () => {
    expect(getPriorityTier(19)).toBe('low');
  });

  it('score 20 returns medium', () => {
    expect(getPriorityTier(20)).toBe('medium');
  });

  it('score 39 returns medium', () => {
    expect(getPriorityTier(39)).toBe('medium');
  });

  it('score 40 returns high', () => {
    expect(getPriorityTier(40)).toBe('high');
  });

  it('score 59 returns high', () => {
    expect(getPriorityTier(59)).toBe('high');
  });

  it('score 60 returns critical', () => {
    expect(getPriorityTier(60)).toBe('critical');
  });

  it('score 100 returns critical', () => {
    expect(getPriorityTier(100)).toBe('critical');
  });
});

// ============================================
// calculatePriorityScore (integration)
// ============================================

describe('calculatePriorityScore', () => {
  it('minimal task (just title) returns ~10 (null importance)', () => {
    const task = createTestTask();
    expect(calculatePriorityScore(task)).toBe(10);
  });

  it('must_do task with deadline today returns high score', () => {
    const task = createTestTask({
      importance: 'must_do',
      deadlineDate: dateFromNow(0),
    });
    const score = calculatePriorityScore(task);
    expect(score).toBe(25 + 35); // importance + time pressure = 60 = critical
  });

  it('deferred task with partner importance gets bonus', () => {
    const task = createTestTask({
      importanceSource: 'partner',
      deferredCount: 3,
    });
    const score = calculatePriorityScore(task);
    expect(score).toBe(10 + 20 + 10); // null importance + partner + defer = 40 = high
  });
});

// ============================================
// getTaskPriorityInfo
// ============================================

describe('getTaskPriorityInfo', () => {
  it('returns complete breakdown with all fields', () => {
    const task = createTestTask({
      importance: 'should_do',
      deadlineDate: dateFromNow(3),
      source: 'email',
      deferredCount: 2,
    });

    const info = getTaskPriorityInfo(task);

    expect(info.breakdown.importance).toBe(15);
    expect(info.breakdown.timePressure).toBe(15);
    expect(info.breakdown.source).toBe(15);
    expect(info.breakdown.defer).toBe(5);
    expect(info.score).toBe(15 + 15 + 15 + 5); // 50
    expect(info.tier).toBe('high');
  });

  it('includes effective deadline in result', () => {
    const task = createTestTask({
      deadlineDate: '2026-02-15',
      leadTimeDays: 7,
    });

    const info = getTaskPriorityInfo(task);
    expect(info.effectiveDeadline).not.toBeNull();
    const dateStr = `${info.effectiveDeadline!.getFullYear()}-${String(info.effectiveDeadline!.getMonth() + 1).padStart(2, '0')}-${String(info.effectiveDeadline!.getDate()).padStart(2, '0')}`;
    expect(dateStr).toBe('2026-02-08');
  });
});
