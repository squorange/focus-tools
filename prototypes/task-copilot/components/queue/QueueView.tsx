"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { Task, FocusQueue, FocusQueueItem, Project } from "@/lib/types";
import QueueItem from "./QueueItem";
import QuickCapture from "@/components/inbox/QuickCapture";

interface QueueViewProps {
  queue: FocusQueue;
  tasks: Task[];
  projects: Project[];
  inboxCount: number;
  onOpenTask: (id: string) => void;
  onCreateTask: (title: string) => void;
  onStartFocus: (queueItemId: string) => void;
  onRemoveFromQueue: (queueItemId: string) => void;
  onMoveItem: (queueItemId: string, newIndex: number) => void;
  onMoveItemUp: (queueItemId: string) => void;
  onMoveItemDown: (queueItemId: string) => void;
  onMoveTodayLine: (newIndex: number) => void;
  onGoToInbox: () => void;
  onMarkComplete: (taskId: string) => void;
  onMarkIncomplete: (taskId: string) => void;
}

// Get total estimated time for items
function getTotalEstimate(items: FocusQueueItem[], tasks: Task[]): string | null {
  let totalMinutes = 0;

  for (const item of items) {
    const task = tasks.find((t) => t.id === item.taskId);
    if (!task) continue;

    const steps =
      item.selectionType === "entire_task"
        ? task.steps
        : task.steps.filter((s) => item.selectedStepIds.includes(s.id));

    const incompleteSteps = steps.filter((s) => !s.completed);
    totalMinutes += incompleteSteps.reduce(
      (sum, s) => sum + (s.estimatedMinutes || 0),
      0
    );
  }

  if (totalMinutes === 0) return null;
  if (totalMinutes < 60) return `~${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
}

export default function QueueView({
  queue,
  tasks,
  projects,
  inboxCount,
  onOpenTask,
  onCreateTask,
  onStartFocus,
  onRemoveFromQueue,
  onMoveItem,
  onMoveItemUp,
  onMoveItemDown,
  onMoveTodayLine,
  onGoToInbox,
  onMarkComplete,
  onMarkIncomplete,
}: QueueViewProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingLine, setIsDraggingLine] = useState(false);

  // Touch drag state
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const touchStartY = useRef<number>(0);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lineRef = useRef<HTMLDivElement>(null);

  // Filter out completed items for display (but keep them in data)
  const activeItems = useMemo(
    () => queue.items.filter((i) => !i.completed).sort((a, b) => a.order - b.order),
    [queue.items]
  );

  const todayItems = activeItems.slice(0, queue.todayLineIndex);
  const laterItems = activeItems.slice(queue.todayLineIndex);
  const todayEstimate = getTotalEstimate(todayItems, tasks);

  // Completed today
  const completedToday = queue.items.filter((item) => {
    if (!item.completed || !item.completedAt) return false;
    const today = new Date().toISOString().split("T")[0];
    const completedDate = new Date(item.completedAt).toISOString().split("T")[0];
    return completedDate === today;
  });

  // Drag handlers for items
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem || isDraggingLine) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedItem && dragOverIndex !== null) {
      onMoveItem(draggedItem, dragOverIndex);
    }
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDraggingLine(false);
  };

  // Drag handlers for the today line
  const handleLineDragStart = (e: React.DragEvent) => {
    setIsDraggingLine(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "today-line");
  };

  const handleLineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDraggingLine && dragOverIndex !== null) {
      onMoveTodayLine(dragOverIndex);
    }
    setIsDraggingLine(false);
    setDragOverIndex(null);
  };

  // Touch handlers for mobile drag
  const calculateTouchOverIndex = useCallback((touchY: number): number => {
    // Only include actual items, not the today line
    // The onMoveItem handler in page.tsx handles crossing the today line correctly
    const positions: { index: number; top: number; bottom: number }[] = [];

    activeItems.forEach((item, index) => {
      const el = itemRefs.current.get(item.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        positions.push({ index, top: rect.top, bottom: rect.bottom });
      }
    });

    // Sort by visual position
    positions.sort((a, b) => a.top - b.top);

    // Find which index the touch is over
    for (let i = 0; i < positions.length; i++) {
      const midpoint = (positions[i].top + positions[i].bottom) / 2;
      if (touchY < midpoint) {
        return positions[i].index;
      }
    }

    // If below all items, return last index
    return activeItems.length;
  }, [activeItems]);

  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    setDraggedItem(itemId);
    setIsTouchDragging(true);
  };

  const handleLineTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    setIsDraggingLine(true);
    setIsTouchDragging(true);
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTouchDragging) return;
    e.preventDefault(); // Prevent scrolling while dragging

    const touch = e.touches[0];
    const overIndex = calculateTouchOverIndex(touch.clientY);
    setDragOverIndex(overIndex);
  }, [isTouchDragging, calculateTouchOverIndex]);

  const handleTouchEnd = () => {
    if (draggedItem && dragOverIndex !== null) {
      onMoveItem(draggedItem, dragOverIndex);
    } else if (isDraggingLine && dragOverIndex !== null) {
      onMoveTodayLine(dragOverIndex);
    }

    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDraggingLine(false);
    setIsTouchDragging(false);
  };

  // Ref callback for storing item refs
  const setItemRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  const totalItems = activeItems.length;

  return (
    <div className="flex flex-col">
      {/* Quick Capture */}
      <div className="mb-4">
        <QuickCapture onCapture={onCreateTask} placeholder="Add a task to focus..." />
      </div>

      {/* Header with today estimate */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          {todayItems.length > 0 && (
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {todayItems.length} for today
            </span>
          )}
          {todayEstimate && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {todayEstimate}
            </span>
          )}
        </div>
        {completedToday.length > 0 && (
          <span className="text-sm text-green-600 dark:text-green-400">
            {completedToday.length} done today
          </span>
        )}
      </div>

      {/* Queue Content */}
      <div>
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-violet-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Queue is clear
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6">
              {inboxCount > 0
                ? "Triage your inbox items first, or capture a new task above"
                : "Capture a new task above to begin"}
            </p>
            {inboxCount > 0 && (
              <button
                onClick={onGoToInbox}
                className="px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
              >
                Go to Inbox ({inboxCount})
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2" onDragEnd={handleDragEnd}>
            {/* Items above the line (for today) */}
            {todayItems.map((item, index) => {
              const task = tasks.find((t) => t.id === item.taskId);
              if (!task) return null;

              // When dragging line: items at/after dragOverIndex slide down to preview
              const shouldSlideDownLine = isDraggingLine && dragOverIndex !== null && index >= dragOverIndex;

              // When dragging an item: items at/after dragOverIndex slide down
              const isBeingDragged = draggedItem === item.id;
              const shouldSlideDownItem = draggedItem && !isDraggingLine && dragOverIndex !== null && index >= dragOverIndex && !isBeingDragged;

              return (
                <div
                  key={item.id}
                  ref={setItemRef(item.id)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onTouchStart={(e) => handleTouchStart(e, item.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`transition-transform duration-150 ease-out touch-none ${
                    isBeingDragged ? "opacity-50" : ""
                  } ${shouldSlideDownLine || shouldSlideDownItem ? "translate-y-14" : ""}`}
                >
                  <QueueItem
                    item={item}
                    task={task}
                    projects={projects}
                    isFirst={index === 0}
                    isLast={index === activeItems.length - 1}
                    onOpenTask={onOpenTask}
                    onStartFocus={onStartFocus}
                    onRemoveFromQueue={onRemoveFromQueue}
                    onMoveUp={onMoveItemUp}
                    onMoveDown={onMoveItemDown}
                    onMarkComplete={onMarkComplete}
                    onMarkIncomplete={onMarkIncomplete}
                  />
                </div>
              );
            })}

            {/* The Today Line (draggable divider with tap arrows) */}
            <div ref={lineRef} className="group relative my-6">
              {/* Up arrow - tap to move line up */}
              <button
                onClick={() => onMoveTodayLine(queue.todayLineIndex - 1)}
                disabled={queue.todayLineIndex === 0}
                className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move line up"
              >
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              {/* Draggable line */}
              <div
                draggable
                onDragStart={handleLineDragStart}
                onDragEnd={handleLineDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(queue.todayLineIndex);
                }}
                onTouchStart={handleLineTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`
                  relative py-2 cursor-grab active:cursor-grabbing touch-none
                  ${isDraggingLine ? "opacity-50" : ""}
                  ${dragOverIndex === queue.todayLineIndex && !isDraggingLine && draggedItem
                    ? "border-t-2 border-violet-500"
                    : ""
                  }
                `}
              >
                {/* Line with drag handle */}
                <div className="flex items-center gap-3">
                  {/* Drag handle */}
                  <div className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="7" r="1.5" />
                      <circle cx="15" cy="7" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="17" r="1.5" />
                      <circle cx="15" cy="17" r="1.5" />
                    </svg>
                  </div>
                  {/* Full-width line */}
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 dark:from-amber-600 dark:via-amber-500 dark:to-amber-600" />
                </div>
                {/* Label - absolutely centered over the line with opaque background */}
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded">
                  Today
                </span>
              </div>

              {/* Down arrow - tap to move line down */}
              <button
                onClick={() => onMoveTodayLine(queue.todayLineIndex + 1)}
                disabled={queue.todayLineIndex > activeItems.length}
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-10 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move line down"
              >
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Items below the line (not committed for today) */}
            {laterItems.length > 0 && (
              <div className="pt-1 space-y-2">
                {laterItems.map((item, idx) => {
                  const task = tasks.find((t) => t.id === item.taskId);
                  if (!task) return null;

                  const actualIndex = queue.todayLineIndex + idx;

                  // When dragging line down: items that will become "today" slide up to preview
                  const shouldSlideUpLine = isDraggingLine && dragOverIndex !== null && actualIndex < dragOverIndex;

                  // When dragging an item: items at/after dragOverIndex slide down
                  const isBeingDragged = draggedItem === item.id;
                  const shouldSlideDownItem = draggedItem && !isDraggingLine && dragOverIndex !== null && actualIndex >= dragOverIndex && !isBeingDragged;

                  return (
                    <div
                      key={item.id}
                      ref={setItemRef(item.id)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => handleDragOver(e, actualIndex)}
                      onTouchStart={(e) => handleTouchStart(e, item.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`transition-transform duration-150 ease-out touch-none ${
                        isBeingDragged ? "opacity-50" : ""
                      } ${shouldSlideUpLine ? "-translate-y-14" : ""} ${shouldSlideDownItem ? "translate-y-14" : ""}`}
                    >
                      <QueueItem
                        item={item}
                        task={task}
                        projects={projects}
                        isFirst={actualIndex === 0}
                        isLast={actualIndex === activeItems.length - 1}
                        onOpenTask={onOpenTask}
                        onStartFocus={onStartFocus}
                        onRemoveFromQueue={onRemoveFromQueue}
                        onMoveUp={onMoveItemUp}
                        onMoveDown={onMoveItemDown}
                        onMarkComplete={onMarkComplete}
                        onMarkIncomplete={onMarkIncomplete}
                      />
                    </div>
                  );
                })}
                {/* Drop zone spacer below last item for dragging line to bottom */}
                <div
                  onDragOver={(e) => handleDragOver(e, activeItems.length)}
                  className="h-8"
                />
              </div>
            )}

            {/* Drop zone when no items below the line */}
            {laterItems.length === 0 && todayItems.length > 0 && (
              <div
                onDragOver={(e) => handleDragOver(e, activeItems.length)}
                className="h-8"
              />
            )}
          </div>
        )}
      </div>

    </div>
  );
}
