"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import { Task, FocusQueue, FocusQueueItem, Project } from "@/lib/types";
import {
  reorderVisualElements,
  deriveStateFromVisual,
  VisualElement,
} from "@/lib/queue-reorder";
import { countCompletionsToday } from "@/lib/completions";
import QueueItem from "./QueueItem";
import CompletedDrawer from "./CompletedDrawer";
import FocusSelectionModal from "@/components/shared/FocusSelectionModal";

// Unified slot model: line occupies a slot just like items
// Visual slots: [top-zone, item0, item1, ..., LINE, itemN, ..., bottom-zone]
type VirtualSlot =
  | { type: 'top-zone' }
  | { type: 'slot'; visualIndex: number }
  | { type: 'bottom-zone' };

// Placeholder shown at drop target position
function DropPlaceholder({ variant = 'item' }: { variant?: 'item' | 'line' }) {
  return (
    <div
      className={`h-14 rounded-lg border-2 border-dashed transition-all ${
        variant === 'line'
          ? 'border-violet-400 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-900/10'
          : 'border-violet-400 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-900/10'
      }`}
    />
  );
}

interface QueueViewProps {
  queue: FocusQueue;
  tasks: Task[];
  projects: Project[];
  inboxCount: number;
  onOpenTask: (id: string) => void;
  onStartFocus: (queueItemId: string) => void;
  onRemoveFromQueue: (queueItemId: string) => void;
  onUpdateStepSelection: (queueItemId: string, selectionType: 'all_today' | 'all_upcoming' | 'specific_steps', selectedStepIds: string[]) => void;
  // Unified reorder callback - visual-first approach
  onReorderQueue: (items: FocusQueueItem[], todayLineIndex: number) => void;
  onMoveItemUp: (queueItemId: string) => void;
  onMoveItemDown: (queueItemId: string) => void;
  onGoToInbox: () => void;
  // Note: "What should I do?" is now handled via minibar contextual prompt
}

// Get total estimated time for items
function getTotalEstimate(items: FocusQueueItem[], tasks: Task[]): string | null {
  let totalMinutes = 0;

  for (const item of items) {
    const task = tasks.find((t) => t.id === item.taskId);
    if (!task) continue;

    const steps =
      item.selectionType === "all_today" || item.selectionType === "all_upcoming"
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
  onStartFocus,
  onRemoveFromQueue,
  onUpdateStepSelection,
  onReorderQueue,
  onMoveItemUp,
  onMoveItemDown,
  onGoToInbox,
}: QueueViewProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<VirtualSlot | null>(null);
  const [isDraggingLine, setIsDraggingLine] = useState(false);
  const [completedDrawerOpen, setCompletedDrawerOpen] = useState(false);
  // Focus selection modal state
  const [editingQueueItemId, setEditingQueueItemId] = useState<string | null>(null);

  // Touch drag state
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const touchStartY = useRef<number>(0);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lineRef = useRef<HTMLDivElement>(null);

  // Hold-to-drag state (prevents accidental drags while scrolling)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pendingDragItem = useRef<string | null>(null);
  const pendingDragLine = useRef<boolean>(false);
  const HOLD_DURATION = 300; // ms before drag activates
  const MOVE_THRESHOLD = 10; // px movement cancels hold

  // Filter out completed items for display (completed items are now removed from queue immediately)
  const activeItems = useMemo(
    () => queue.items
      .filter((i) => !i.completed)
      .sort((a, b) => a.order - b.order),
    [queue.items]
  );

  const todayItems = activeItems.slice(0, queue.todayLineIndex);
  const laterItems = activeItems.slice(queue.todayLineIndex);
  const todayEstimate = getTotalEstimate(todayItems, tasks);

  // Build unified visual elements array (items + line in visual order)
  const visualElements = useMemo((): VisualElement[] => {
    const elements: VisualElement[] = [];

    // Today items (indices 0 to todayLineIndex-1)
    todayItems.forEach((item, i) => {
      elements.push({ kind: 'item', item, originalIndex: i });
    });

    // The line occupies a slot
    elements.push({ kind: 'line' });

    // Later items (indices todayLineIndex onwards in original array)
    laterItems.forEach((item, i) => {
      elements.push({ kind: 'item', item, originalIndex: queue.todayLineIndex + i });
    });

    return elements;
  }, [todayItems, laterItems, queue.todayLineIndex]);

  // Helper to perform visual reorder and call the unified callback
  const performVisualReorder = useCallback((fromIndex: number, toIndex: number) => {
    const newElements = reorderVisualElements(visualElements, fromIndex, toIndex);
    const { items, todayLineIndex } = deriveStateFromVisual(newElements);
    onReorderQueue(items, todayLineIndex);
  }, [visualElements, onReorderQueue]);

  // Handlers for line arrow buttons (move line up/down by one position)
  const handleMoveLineUp = useCallback(() => {
    const lineIndex = visualElements.findIndex(el => el.kind === 'line');
    if (lineIndex > 0) {
      performVisualReorder(lineIndex, lineIndex - 1);
    }
  }, [visualElements, performVisualReorder]);

  const handleMoveLineDown = useCallback(() => {
    const lineIndex = visualElements.findIndex(el => el.kind === 'line');
    if (lineIndex !== -1 && lineIndex < visualElements.length - 1) {
      performVisualReorder(lineIndex, lineIndex + 2); // +2 because we're moving forward
    }
  }, [visualElements, performVisualReorder]);

  // Count all completions today (tasks + steps, across all tasks)
  const completionCount = useMemo(
    () => countCompletionsToday(tasks),
    [tasks]
  );

  // Drag handlers for items
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  };

  // Unified drag over handler using visual index
  const handleDragOver = (e: React.DragEvent, visualIndex: number) => {
    e.preventDefault();
    setDragOverSlot({ type: 'slot', visualIndex });
  };

  const handleDragOverZone = (e: React.DragEvent, zone: 'top-zone' | 'bottom-zone') => {
    e.preventDefault();
    setDragOverSlot({ type: zone });
  };

  // Handle drop for both items and line - visual-first approach
  const handleDragEnd = () => {
    if (!dragOverSlot) {
      setDraggedItem(null);
      setDragOverSlot(null);
      setIsDraggingLine(false);
      return;
    }

    // Find the visual index of what's being dragged
    let fromIndex = -1;
    if (draggedItem) {
      fromIndex = visualElements.findIndex(
        el => el.kind === 'item' && el.item.id === draggedItem
      );
    } else if (isDraggingLine) {
      fromIndex = visualElements.findIndex(el => el.kind === 'line');
    }

    if (fromIndex === -1) {
      setDraggedItem(null);
      setDragOverSlot(null);
      setIsDraggingLine(false);
      return;
    }

    // Calculate target visual index
    let toIndex: number;
    if (dragOverSlot.type === 'top-zone') {
      toIndex = 0;
    } else if (dragOverSlot.type === 'bottom-zone') {
      toIndex = visualElements.length;
    } else {
      toIndex = dragOverSlot.visualIndex;
    }

    // Perform the visual reorder if positions differ
    if (fromIndex !== toIndex) {
      performVisualReorder(fromIndex, toIndex);
    }

    setDraggedItem(null);
    setDragOverSlot(null);
    setIsDraggingLine(false);
  };

  // Drag handlers for the today line
  const handleLineDragStart = (e: React.DragEvent) => {
    setIsDraggingLine(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "today-line");
  };

  // Calculate which virtual slot a touch position corresponds to
  const calculateTouchOverSlot = useCallback((touchY: number): VirtualSlot => {
    // Iterate through visual elements and find where touch falls
    for (let i = 0; i < visualElements.length; i++) {
      const el = visualElements[i];
      const ref = el.kind === 'line'
        ? lineRef.current
        : itemRefs.current.get(el.item.id);

      if (!ref) continue;

      const rect = ref.getBoundingClientRect();
      const midpoint = (rect.top + rect.bottom) / 2;

      // If touch is above midpoint, drop at this slot
      if (touchY < midpoint) {
        return { type: 'slot', visualIndex: i };
      }
    }

    // If below all elements, return bottom zone
    return { type: 'bottom-zone' };
  }, [visualElements]);

  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartY.current = touch.clientY;
    pendingDragItem.current = itemId;
    pendingDragLine.current = false;

    // Clear any existing timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    // Start hold timer - only activate drag after hold duration
    holdTimerRef.current = setTimeout(() => {
      setDraggedItem(itemId);
      setIsTouchDragging(true);
      holdTimerRef.current = null;
    }, HOLD_DURATION);
  };

  const handleLineTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartY.current = touch.clientY;
    pendingDragItem.current = null;
    pendingDragLine.current = true;

    // Clear any existing timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    // Start hold timer - only activate drag after hold duration
    holdTimerRef.current = setTimeout(() => {
      setIsDraggingLine(true);
      setIsTouchDragging(true);
      holdTimerRef.current = null;
    }, HOLD_DURATION);
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];

    // If still in hold phase, check if user moved too much (scrolling)
    if (holdTimerRef.current) {
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
        // User is scrolling, cancel the hold
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
        pendingDragItem.current = null;
        pendingDragLine.current = false;
        return; // Allow normal scrolling
      }
    }

    if (!isTouchDragging) return;
    e.preventDefault(); // Only prevent scroll when actually dragging

    const overSlot = calculateTouchOverSlot(touch.clientY);
    setDragOverSlot(overSlot);
  }, [isTouchDragging, calculateTouchOverSlot]);

  const handleTouchEnd = () => {
    // Clear hold timer if still pending
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    pendingDragItem.current = null;
    pendingDragLine.current = false;

    if (dragOverSlot) {
      // Find the visual index of what's being dragged
      let fromIndex = -1;
      if (draggedItem) {
        fromIndex = visualElements.findIndex(
          el => el.kind === 'item' && el.item.id === draggedItem
        );
      } else if (isDraggingLine) {
        fromIndex = visualElements.findIndex(el => el.kind === 'line');
      }

      if (fromIndex !== -1) {
        // Calculate target visual index
        let toIndex: number;
        if (dragOverSlot.type === 'top-zone') {
          toIndex = 0;
        } else if (dragOverSlot.type === 'bottom-zone') {
          toIndex = visualElements.length;
        } else {
          toIndex = dragOverSlot.visualIndex;
        }

        // Perform the visual reorder if positions differ
        if (fromIndex !== toIndex) {
          performVisualReorder(fromIndex, toIndex);
        }
      }
    }

    setDraggedItem(null);
    setDragOverSlot(null);
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
      {/* Header with today estimate */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-baseline gap-2">
          {todayItems.length > 0 && (
            <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
              {todayItems.length} for today
            </span>
          )}
          {todayEstimate && (
            <span className="text-sm text-zinc-400 dark:text-zinc-500">
              {todayEstimate}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* "What next?" is now handled via minibar contextual prompt */}
          {totalItems > 0 && (
            <button
              onClick={() => setCompletedDrawerOpen(true)}
              className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              {completionCount > 0 ? `${completionCount} completed` : "Completed"}
            </button>
          )}
        </div>
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
            <div className="flex gap-3">
              {inboxCount > 0 && (
                <button
                  onClick={onGoToInbox}
                  className="px-4 py-2 text-sm font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40 rounded-lg transition-colors"
                >
                  Go to Inbox ({inboxCount})
                </button>
              )}
              <button
                onClick={() => setCompletedDrawerOpen(true)}
                className="px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
              >
                Show completed
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2" onDragEnd={handleDragEnd}>
            {/* Top drop zone - for dragging to very top */}
            {(draggedItem || isDraggingLine) && (
              <div
                onDragOver={(e) => handleDragOverZone(e, 'top-zone')}
                className="h-4 -mt-2 -mb-2"
              />
            )}

            {/* Placeholder at very top */}
            {(draggedItem || isDraggingLine) && dragOverSlot?.type === 'top-zone' && (
              <div className="mb-2">
                <DropPlaceholder variant={isDraggingLine ? 'line' : 'item'} />
              </div>
            )}

            {/* Unified loop through all visual elements */}
            {visualElements.map((el, visualIndex) => {
              const isDropTarget = dragOverSlot?.type === 'slot' &&
                                   dragOverSlot.visualIndex === visualIndex;

              if (el.kind === 'line') {
                // Render the Today Line
                const showPlaceholder = isDropTarget && !isDraggingLine;

                return (
                  <React.Fragment key="today-line">
                    {showPlaceholder && (
                      <div className="mb-2"><DropPlaceholder /></div>
                    )}
                    <div ref={lineRef} className="group relative my-6">
                      {/* Up arrow - tap to move line up */}
                      <button
                        onClick={handleMoveLineUp}
                        disabled={visualIndex === 0}
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
                        onDragOver={(e) => handleDragOver(e, visualIndex)}
                        onTouchStart={handleLineTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className={`
                          relative py-2 cursor-grab active:cursor-grabbing select-none touch-none
                          ${isDraggingLine ? "opacity-50" : ""}
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
                          <div className="flex-1 h-px bg-gradient-to-r from-violet-400 via-violet-500 to-violet-400 dark:from-violet-600 dark:via-violet-500 dark:to-violet-600" />
                        </div>
                        {/* Label - absolutely centered over the line with opaque background */}
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-400 bg-white dark:bg-zinc-900 border border-violet-300 dark:border-violet-700 rounded select-none">
                          Today
                        </span>
                      </div>

                      {/* Down arrow - tap to move line down */}
                      <button
                        onClick={handleMoveLineDown}
                        disabled={visualIndex >= visualElements.length - 1}
                        className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-10 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move line down"
                      >
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </React.Fragment>
                );
              } else {
                // Render item
                const task = tasks.find((t) => t.id === el.item.taskId);
                if (!task) return null;

                const isBeingDragged = draggedItem === el.item.id;
                const showPlaceholder = isDropTarget && !isBeingDragged;

                return (
                  <React.Fragment key={el.item.id}>
                    {showPlaceholder && (
                      <div className="mb-2">
                        <DropPlaceholder variant={isDraggingLine ? 'line' : 'item'} />
                      </div>
                    )}
                    <div
                      ref={setItemRef(el.item.id)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, el.item.id)}
                      onDragOver={(e) => handleDragOver(e, visualIndex)}
                      onTouchStart={(e) => handleTouchStart(e, el.item.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`select-none ${
                        isTouchDragging ? "touch-none" : "touch-auto"
                      } ${isBeingDragged ? "opacity-50" : ""}`}
                    >
                      <QueueItem
                        item={el.item}
                        task={task}
                        projects={projects}
                        isFirst={el.originalIndex === 0}
                        isLast={el.originalIndex === activeItems.length - 1}
                        isToday={el.originalIndex < queue.todayLineIndex}
                        onOpenTask={onOpenTask}
                        onStartFocus={onStartFocus}
                        onRemoveFromQueue={onRemoveFromQueue}
                        onEditFocus={(queueItemId) => setEditingQueueItemId(queueItemId)}
                        onMoveUp={onMoveItemUp}
                        onMoveDown={onMoveItemDown}
                      />
                    </div>
                  </React.Fragment>
                );
              }
            })}

            {/* Placeholder at bottom */}
            {(draggedItem || isDraggingLine) && dragOverSlot?.type === 'bottom-zone' && (
              <div className="mt-2">
                <DropPlaceholder variant={isDraggingLine ? 'line' : 'item'} />
              </div>
            )}

            {/* Drop zone spacer at bottom */}
            <div
              onDragOver={(e) => handleDragOverZone(e, 'bottom-zone')}
              className="h-8"
            />
          </div>
        )}
      </div>

      {/* Completed Drawer */}
      <CompletedDrawer
        isOpen={completedDrawerOpen}
        onClose={() => setCompletedDrawerOpen(false)}
        tasks={tasks}
        onNavigateToTask={onOpenTask}
      />

      {/* Focus Selection Modal for editing step selection */}
      {editingQueueItemId && (() => {
        const queueItem = queue.items.find(i => i.id === editingQueueItemId);
        const task = queueItem ? tasks.find(t => t.id === queueItem.taskId) : null;
        if (!queueItem || !task) return null;

        return (
          <FocusSelectionModal
            isOpen={true}
            task={task}
            initialSelectionType={queueItem.selectionType}
            initialSelectedStepIds={
              queueItem.selectionType === 'specific_steps'
                ? queueItem.selectedStepIds
                : []
            }
            onClose={() => setEditingQueueItemId(null)}
            onConfirm={(selectionType, selectedStepIds) => {
              onUpdateStepSelection(editingQueueItemId, selectionType, selectedStepIds);
              setEditingQueueItemId(null);
            }}
            mode="edit"
          />
        );
      })()}
    </div>
  );
}
