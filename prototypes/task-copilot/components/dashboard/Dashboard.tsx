"use client";

import { Task } from "@/lib/types";
import { filterInbox, filterActive, filterCompletedToday, getNextIncompleteStep } from "@/lib/utils";
import QuickCapture from "./QuickCapture";
import TaskSection from "./TaskSection";

interface DashboardProps {
  tasks: Task[];
  onCreateTask: (title: string) => Task;
  onSelectTask: (taskId: string) => void;
  onEnterFocus: (taskId: string, stepId: string) => void;
}

export default function Dashboard({
  tasks,
  onCreateTask,
  onSelectTask,
  onEnterFocus,
}: DashboardProps) {
  // Filter tasks into sections
  const inboxTasks = filterInbox(tasks);
  const activeTasks = filterActive(tasks);
  const completedTodayTasks = filterCompletedToday(tasks);

  // Handle entering focus mode for a task
  const handleEnterFocus = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.steps.length === 0) {
      // No steps, go to task detail to add steps first
      onSelectTask(taskId);
      return;
    }

    const nextStep = getNextIncompleteStep(task.steps);
    if (nextStep) {
      onEnterFocus(taskId, nextStep.id);
    } else {
      // All steps complete, just go to detail
      onSelectTask(taskId);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="h-14 px-6 flex items-center border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-shrink-0">
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          Focus Tools
        </h1>
      </header>

      {/* Main content - scrollable */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Quick Capture */}
          <QuickCapture onCreateTask={onCreateTask} />

          {/* Task Sections */}
          <div className="space-y-6">
            {/* Inbox Section */}
            <TaskSection
              title="Inbox"
              tasks={inboxTasks}
              emptyMessage="No tasks in inbox"
              onSelectTask={onSelectTask}
              onEnterFocus={handleEnterFocus}
              defaultExpanded={true}
            />

            {/* Active Section */}
            <TaskSection
              title="Active"
              tasks={activeTasks}
              emptyMessage="No active tasks"
              onSelectTask={onSelectTask}
              onEnterFocus={handleEnterFocus}
              defaultExpanded={true}
            />

            {/* Completed Today Section */}
            {completedTodayTasks.length > 0 && (
              <TaskSection
                title="Completed Today"
                tasks={completedTodayTasks}
                emptyMessage=""
                onSelectTask={onSelectTask}
                onEnterFocus={handleEnterFocus}
                defaultExpanded={false}
                variant="completed"
              />
            )}
          </div>

          {/* Empty state when no tasks */}
          {tasks.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-lg font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                No tasks yet
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400">
                Add your first task using the input above
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
