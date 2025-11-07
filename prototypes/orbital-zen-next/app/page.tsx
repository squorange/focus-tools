'use client';

import { useEffect, useState } from 'react';
import OrbitalView from './components/OrbitalView';
import { Task } from './lib/types';
import { getTasks, initializeSampleData } from './lib/offline-store';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        // Initialize sample data if needed
        await initializeSampleData();

        // Load tasks from IndexedDB
        const storedTasks = await getTasks();

        if (storedTasks.length > 0) {
          setTasks(storedTasks);
        } else {
          // Fallback to API if no local data
          const response = await fetch('/api/tasks');
          const data = await response.json();
          setTasks(data.tasks);
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
        // Fallback to API
        try {
          const response = await fetch('/api/tasks');
          const data = await response.json();
          setTasks(data.tasks);
        } catch (apiError) {
          console.error('Failed to load from API:', apiError);
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
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your tasks...</p>
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
