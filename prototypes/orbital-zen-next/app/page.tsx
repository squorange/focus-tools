'use client';

import { useEffect, useState } from 'react';
import OrbitalView from './components/OrbitalView';
import { Task } from './lib/types';
import { getTasks, initializeSampleData, saveTask } from './lib/offline-store';
import {
  initializeSubtaskOrbits,
  validateOrbitalInvariants,
  logValidationResults,
} from './lib/orbit-utils';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTasks() {
      console.log('[Home] Starting to load tasks...');

      // Set a timeout to detect hanging database operations
      const timeoutId = setTimeout(() => {
        console.error('[Home] Task loading timeout - database may be stuck');
        setError('Database connection timeout. Please clear your browser data and refresh.');
        setIsLoading(false);
      }, 10000); // 10 second timeout

      try {
        // Initialize sample data if needed
        console.log('[Home] Initializing sample data...');
        await initializeSampleData();
        console.log('[Home] Sample data initialized');

        // Load tasks from IndexedDB
        console.log('[Home] Loading tasks from IndexedDB...');
        const storedTasks = await getTasks();
        console.log('[Home] Loaded', storedTasks.length, 'tasks');

        clearTimeout(timeoutId);

        if (storedTasks.length > 0) {
          // Initialize subtask orbits for tasks that don't have them assigned
          const tasksWithOrbits = storedTasks.map((task) => ({
            ...task,
            subtasks: task.subtasks
              ? initializeSubtaskOrbits(task.subtasks, task.priorityMarkerRing)
              : undefined,
          }));

          // Save initialized tasks back to database to persist angles/radii
          for (const task of tasksWithOrbits) {
            await saveTask(task);
          }

          setTasks(tasksWithOrbits);

          // Validate orbital positions in development mode
          if (process.env.NODE_ENV === 'development') {
            tasksWithOrbits.forEach((task) => {
              if (task.subtasks && task.subtasks.length > 0) {
                const result = validateOrbitalInvariants(task.subtasks, task.id);
                logValidationResults(result, task.title);
              }
            });
          }
        } else {
          // Fallback to API if no local data
          console.log('[Home] No stored tasks, trying API...');
          const response = await fetch('/api/tasks');
          const data = await response.json();
          const tasksWithOrbits = data.tasks.map((task: Task) => ({
            ...task,
            subtasks: task.subtasks
              ? initializeSubtaskOrbits(task.subtasks, task.priorityMarkerRing)
              : undefined,
          }));

          // Save initialized tasks back to database to persist angles/radii
          for (const task of tasksWithOrbits) {
            await saveTask(task);
          }

          setTasks(tasksWithOrbits);

          // Validate orbital positions in development mode
          if (process.env.NODE_ENV === 'development') {
            tasksWithOrbits.forEach((task) => {
              if (task.subtasks && task.subtasks.length > 0) {
                const result = validateOrbitalInvariants(task.subtasks, task.id);
                logValidationResults(result, task.title);
              }
            });
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('[Home] Failed to load tasks:', error);
        setError(`Error loading tasks: ${error instanceof Error ? error.message : String(error)}`);

        // Fallback to API
        try {
          console.log('[Home] Trying API fallback...');
          const response = await fetch('/api/tasks');
          const data = await response.json();
          const tasksWithOrbits = data.tasks.map((task: Task) => ({
            ...task,
            subtasks: task.subtasks
              ? initializeSubtaskOrbits(task.subtasks, task.priorityMarkerRing)
              : undefined,
          }));

          // Save initialized tasks back to database to persist angles/radii
          for (const task of tasksWithOrbits) {
            await saveTask(task);
          }

          setTasks(tasksWithOrbits);
          setError(null); // Clear error if API works

          // Validate orbital positions in development mode
          if (process.env.NODE_ENV === 'development') {
            tasksWithOrbits.forEach((task) => {
              if (task.subtasks && task.subtasks.length > 0) {
                const result = validateOrbitalInvariants(task.subtasks, task.id);
                logValidationResults(result, task.title);
              }
            });
          }
        } catch (apiError) {
          console.error('[Home] Failed to load from API:', apiError);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadTasks();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your tasks...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
              <p className="text-gray-400 text-xs mt-2">
                Open{' '}
                <a
                  href="/clear-db.html"
                  className="text-purple-400 hover:underline"
                  target="_blank"
                >
                  this tool
                </a>{' '}
                to clear the database, or check browser DevTools console for details.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">Failed to load tasks</p>
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-2">
              Open{' '}
              <a href="/clear-db.html" className="text-purple-400 hover:underline" target="_blank">
                this tool
              </a>{' '}
              to clear the database.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-screen">
      <OrbitalView tasks={tasks} />
    </main>
  );
}
