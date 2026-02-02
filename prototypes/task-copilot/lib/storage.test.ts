/**
 * Storage Integration Tests
 *
 * Tests for the IndexedDB storage layer.
 * These tests verify data persistence and migration behavior.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createTestTask,
  createTestAppState,
  createAppStateWithQueuedTask,
  createTaskWithSteps,
  createTestQueueItem,
} from '@/tests/fixtures';
import { createInitialAppState } from '@/lib/types';

// Import storage functions
import {
  loadStateAsync,
  saveState,
  loadState,
  migrateState,
} from '@/lib/storage';

import {
  initializeIDB,
  isIDBReady,
  saveStateToIDB,
  loadStateFromIDB,
  isMigrated,
  clearAllIDBData,
} from '@/lib/storage-idb';

import { closeDatabase, deleteDatabase } from '@/lib/indexeddb';

// ============================================
// Setup & Teardown
// ============================================

describe('Storage Integration', () => {
  beforeEach(async () => {
    // Clear any existing data
    localStorage.clear();
    await deleteDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    await closeDatabase();
    await deleteDatabase();
    localStorage.clear();
  });

  // ============================================
  // Basic Save/Load Tests
  // ============================================

  describe('IndexedDB Save/Load', () => {
    it('saves and loads state correctly', async () => {
      await initializeIDB();
      expect(isIDBReady()).toBe(true);

      const task = createTestTask({ title: 'Persist Me' });
      const state = createTestAppState({ tasks: [task] });

      await saveStateToIDB(state);
      const loaded = await loadStateFromIDB();

      expect(loaded).not.toBeNull();
      expect(loaded!.tasks).toHaveLength(1);
      expect(loaded!.tasks[0].title).toBe('Persist Me');
    });

    it('preserves focus queue items across save/load cycles', async () => {
      await initializeIDB();

      const state = createAppStateWithQueuedTask(
        { title: 'Queued Task' },
        { selectionType: 'all_today' }
      );

      // Verify initial state
      expect(state.focusQueue.items).toHaveLength(1);

      await saveStateToIDB(state);
      const loaded = await loadStateFromIDB();

      expect(loaded).not.toBeNull();
      expect(loaded!.focusQueue.items).toHaveLength(1);
      expect(loaded!.focusQueue.items[0].taskId).toBe(state.tasks[0].id);
    });

    it('preserves todayLineIndex correctly', async () => {
      await initializeIDB();

      const task1 = createTestTask({ title: 'Task 1' });
      const task2 = createTestTask({ title: 'Task 2' });
      const task3 = createTestTask({ title: 'Task 3' });

      const state = createTestAppState({
        tasks: [task1, task2, task3],
        queueItems: [
          createTestQueueItem(task1.id, { order: 0 }),
          createTestQueueItem(task2.id, { order: 1 }),
          createTestQueueItem(task3.id, { order: 2 }),
        ],
        todayLineIndex: 2, // First 2 items are "Today"
      });

      await saveStateToIDB(state);
      const loaded = await loadStateFromIDB();

      expect(loaded!.focusQueue.todayLineIndex).toBe(2);
    });

    it('preserves task steps with all fields', async () => {
      await initializeIDB();

      const task = createTaskWithSteps('Task with Steps', [
        'Step 1',
        'Step 2',
        'Step 3',
      ]);
      task.steps[0].completed = true;
      task.steps[0].completedAt = Date.now();

      const state = createTestAppState({ tasks: [task] });

      await saveStateToIDB(state);
      const loaded = await loadStateFromIDB();

      expect(loaded!.tasks[0].steps).toHaveLength(3);
      expect(loaded!.tasks[0].steps[0].completed).toBe(true);
      expect(loaded!.tasks[0].steps[0].completedAt).not.toBeNull();
    });
  });

  // ============================================
  // Migration Flag Tests
  // ============================================

  describe('Migration Flags', () => {
    it('marks as migrated after first save', async () => {
      await initializeIDB();

      const state = createTestAppState({
        tasks: [createTestTask()],
      });

      await saveStateToIDB(state);
      const migrated = await isMigrated();

      expect(migrated).toBe(true);
    });

    it('preserves migration flag across multiple saves', async () => {
      await initializeIDB();

      // First save
      const state1 = createTestAppState({
        tasks: [createTestTask({ title: 'First' })],
      });
      await saveStateToIDB(state1);
      expect(await isMigrated()).toBe(true);

      // Second save (simulates user action)
      const state2 = createTestAppState({
        tasks: [createTestTask({ title: 'Second' })],
      });
      await saveStateToIDB(state2);
      expect(await isMigrated()).toBe(true);

      // Third save
      const state3 = createTestAppState({
        tasks: [createTestTask({ title: 'Third' })],
      });
      await saveStateToIDB(state3);
      expect(await isMigrated()).toBe(true);
    });

    it('data persists after multiple save cycles (regression test for migration flag bug)', async () => {
      await initializeIDB();

      // Create state with queue items
      const task = createTestTask({ title: 'Important Task' });
      const queueItem = createTestQueueItem(task.id);
      const state = createTestAppState({
        tasks: [task],
        queueItems: [queueItem],
        todayLineIndex: 1,
      });

      // Save multiple times (simulates user interactions)
      await saveStateToIDB(state);
      await saveStateToIDB(state);
      await saveStateToIDB(state);

      // Load and verify
      const loaded = await loadStateFromIDB();
      expect(loaded).not.toBeNull();
      expect(loaded!.tasks).toHaveLength(1);
      expect(loaded!.focusQueue.items).toHaveLength(1);

      // Verify migration is still marked
      expect(await isMigrated()).toBe(true);
    });
  });

  // ============================================
  // loadStateAsync Tests
  // ============================================

  describe('loadStateAsync', () => {
    it('returns initial state on fresh install', async () => {
      const state = await loadStateAsync();

      expect(state).toBeDefined();
      expect(state.tasks).toEqual([]);
      expect(state.focusQueue.items).toEqual([]);
    });

    it('loads persisted state after save', async () => {
      // Initialize and save
      await initializeIDB();
      const task = createTestTask({ title: 'Persisted' });
      const savedState = createTestAppState({ tasks: [task] });
      await saveStateToIDB(savedState);

      // Reset IDB connection to simulate app restart
      await closeDatabase();

      // Load via async function
      const loaded = await loadStateAsync();

      expect(loaded.tasks).toHaveLength(1);
      expect(loaded.tasks[0].title).toBe('Persisted');
    });

    it('preserves focus queue through full save/load cycle', async () => {
      // This is the exact scenario that was broken before the fix
      await initializeIDB();

      const task = createTestTask({ title: 'Queue Test' });
      const queueItem = createTestQueueItem(task.id, {
        selectionType: 'all_today',
      });

      const state = createTestAppState({
        tasks: [task],
        queueItems: [queueItem],
        todayLineIndex: 1,
      });

      // Save state
      await saveStateToIDB(state);

      // Reset connection (simulate refresh)
      await closeDatabase();

      // Load state
      const loaded = await loadStateAsync();

      // Verify queue is preserved
      expect(loaded.focusQueue.items).toHaveLength(1);
      expect(loaded.focusQueue.items[0].taskId).toBe(task.id);
      expect(loaded.focusQueue.todayLineIndex).toBe(1);
    });
  });

  // ============================================
  // saveState (sync API) Tests
  // ============================================

  describe('saveState (sync API)', () => {
    it('saves to IndexedDB when ready', async () => {
      await initializeIDB();
      expect(isIDBReady()).toBe(true);

      const task = createTestTask({ title: 'Sync Save' });
      const state = createTestAppState({ tasks: [task] });

      // saveState is sync but triggers async IDB write
      saveState(state);

      // Wait for async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const loaded = await loadStateFromIDB();
      expect(loaded).not.toBeNull();
      expect(loaded!.tasks[0].title).toBe('Sync Save');
    });
  });

  // ============================================
  // Schema Migration Tests
  // ============================================

  describe('Schema Migrations', () => {
    it('migrateState adds missing fields to tasks', () => {
      const oldState = {
        schemaVersion: 1,
        tasks: [
          {
            id: 'test-1',
            title: 'Old Task',
            steps: [],
            status: 'pool',
            // Missing many fields that newer schema versions add
          },
        ],
        focusQueue: { items: [], todayLineIndex: 0, lastReviewedAt: Date.now() },
      };

      const migrated = migrateState(oldState as Record<string, unknown>);

      // Should have all required fields
      expect(migrated.tasks[0]).toHaveProperty('importance');
      expect(migrated.tasks[0]).toHaveProperty('energyType');
      expect(migrated.tasks[0]).toHaveProperty('isRecurring');
      expect(migrated.tasks[0]).toHaveProperty('staging');
    });

    it('migrateState preserves existing field values', () => {
      const oldState = {
        schemaVersion: 10,
        tasks: [
          {
            id: 'test-1',
            title: 'Task with Data',
            steps: [],
            status: 'pool',
            importance: 'must_do',
            energyType: 'draining',
            targetDate: '2026-02-15',
          },
        ],
        focusQueue: { items: [], todayLineIndex: 0, lastReviewedAt: Date.now() },
      };

      const migrated = migrateState(oldState as Record<string, unknown>);

      expect(migrated.tasks[0].importance).toBe('must_do');
      expect(migrated.tasks[0].energyType).toBe('draining');
      expect(migrated.tasks[0].targetDate).toBe('2026-02-15');
    });
  });

  // ============================================
  // Edge Cases
  // ============================================

  describe('Edge Cases', () => {
    it('handles empty state correctly', async () => {
      await initializeIDB();

      const emptyState = createInitialAppState();
      await saveStateToIDB(emptyState);

      const loaded = await loadStateFromIDB();
      expect(loaded).not.toBeNull();
      expect(loaded!.tasks).toEqual([]);
      expect(loaded!.focusQueue.items).toEqual([]);
    });

    it('handles tasks with many steps', async () => {
      await initializeIDB();

      const manySteps = Array.from({ length: 50 }, (_, i) => `Step ${i + 1}`);
      const task = createTaskWithSteps('Many Steps', manySteps);
      const state = createTestAppState({ tasks: [task] });

      await saveStateToIDB(state);
      const loaded = await loadStateFromIDB();

      expect(loaded!.tasks[0].steps).toHaveLength(50);
    });

    it('handles multiple tasks', async () => {
      await initializeIDB();

      const tasks = Array.from({ length: 20 }, (_, i) =>
        createTestTask({ title: `Task ${i + 1}` })
      );
      const state = createTestAppState({ tasks });

      await saveStateToIDB(state);
      const loaded = await loadStateFromIDB();

      expect(loaded!.tasks).toHaveLength(20);
    });

    it('handles special characters in task titles', async () => {
      await initializeIDB();

      const task = createTestTask({
        title: 'Task with "quotes" & <special> characters 日本語',
      });
      const state = createTestAppState({ tasks: [task] });

      await saveStateToIDB(state);
      const loaded = await loadStateFromIDB();

      expect(loaded!.tasks[0].title).toBe(
        'Task with "quotes" & <special> characters 日本語'
      );
    });
  });
});
