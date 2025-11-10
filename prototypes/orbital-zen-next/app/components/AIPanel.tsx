'use client';

import { useState, useRef, useEffect } from 'react';
import { Task, Subtask, FocusSession, EnergyLevel, EstimatedTime } from '../lib/types';
import { saveTask, getTask } from '../lib/offline-store';
import {
  calculateNextAngle,
  calculateNextRadius,
  recalculateRadii,
  initializeSubtaskOrbits,
  getCurrentMarkerRing,
} from '../lib/orbit-utils';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { endSession, getTaskTimeStats } from '../lib/focus-session';
import type { TaskTimeStats } from '../lib/types';

interface AIPanelProps {
  task: Task;
  subtask?: Subtask;
  focusSession?: FocusSession;
  onClose: () => void;
  onStartFocus?: () => void;
  onPauseFocus?: () => void;
  onResumeFocus?: () => void;
  onStopFocus?: () => void;
  onTaskUpdate?: (task: Task) => void;
  onSubtaskChange?: (subtask: Subtask | null) => void;
  completingSubtaskIds: Set<string>;
  setCompletingSubtaskIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export default function AIPanel({
  task,
  subtask,
  focusSession,
  onClose,
  onStartFocus,
  onPauseFocus,
  onResumeFocus,
  onStopFocus,
  onTaskUpdate,
  onSubtaskChange,
  completingSubtaskIds,
  setCompletingSubtaskIds,
}: AIPanelProps) {
  // State
  const [editingTitle, setEditingTitle] = useState(false);
  const [taskTitle, setTaskTitle] = useState(task.title);
  const [taskNotes, setTaskNotes] = useState(task.notes || '');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editedSubtaskTitle, setEditedSubtaskTitle] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAIInput] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [timeStats, setTimeStats] = useState<TaskTimeStats | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const newSubtaskInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Timer hook for active session
  const timer = useFocusTimer(focusSession);

  // Auto-focus and auto-resize
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (notesTextareaRef.current) {
      notesTextareaRef.current.style.height = 'auto';
      notesTextareaRef.current.style.height = notesTextareaRef.current.scrollHeight + 'px';
    }
  }, [taskNotes]);

  useEffect(() => {
    if (showAddSubtask && newSubtaskInputRef.current) {
      newSubtaskInputRef.current.focus();
    }
  }, [showAddSubtask]);

  useEffect(() => {
    if (editingSubtaskId && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
      subtaskInputRef.current.select();
    }
  }, [editingSubtaskId]);

  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagInput]);

  // Load time stats when task changes
  useEffect(() => {
    async function loadTimeStats() {
      try {
        const stats = await getTaskTimeStats(task.id);
        setTimeStats(stats);
      } catch (error) {
        console.error('Failed to load time stats:', error);
      }
    }
    loadTimeStats();
  }, [task.id]);

  // Handlers
  const handleTitleSave = async () => {
    if (taskTitle.trim() && taskTitle !== task.title) {
      const updatedTask = { ...task, title: taskTitle.trim(), updatedAt: new Date() };
      await saveTask(updatedTask);
      onTaskUpdate?.(updatedTask);
    }
    setEditingTitle(false);
  };

  const handleNotesBlur = async () => {
    if (taskNotes !== task.notes) {
      const updatedTask = { ...task, notes: taskNotes, updatedAt: new Date() };
      await saveTask(updatedTask);
      onTaskUpdate?.(updatedTask);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: `${task.id}-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      parentTaskId: task.id,
      assignedStartingAngle: calculateNextAngle(task.subtasks || []),
      assignedOrbitRadius: calculateNextRadius(task.subtasks || []),
    };

    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    const migratedSubtasks = initializeSubtaskOrbits(updatedSubtasks, task.priorityMarkerRing);
    const updatedTask = { ...task, subtasks: migratedSubtasks, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
    setNewSubtaskTitle('');
    setShowAddSubtask(false);
  };

  const handleSubtaskToggle = async (subtaskId: string) => {
    if (!task.subtasks) return;

    const subtaskToToggle = task.subtasks.find(st => st.id === subtaskId);
    if (!subtaskToToggle || subtaskToToggle.completed) return;

    setCompletingSubtaskIds(prev => new Set(prev).add(subtaskId));

    setTimeout(async () => {
      let updatedSubtasks = task.subtasks!.map(st =>
        st.id === subtaskId ? { ...st, completed: true } : st
      );

      let newBeltRing = task.priorityMarkerRing;
      let shouldCelebrate = false;

      if (task.priorityMarkerEnabled && task.priorityMarkerOriginalIds?.includes(subtaskId)) {
        newBeltRing = getCurrentMarkerRing(updatedSubtasks, task.priorityMarkerRing, task.priorityMarkerOriginalIds);
        if (newBeltRing === 0) {
          shouldCelebrate = true;
        }
      }

      updatedSubtasks = recalculateRadii(updatedSubtasks, newBeltRing === 0 ? undefined : newBeltRing);

      const updatedTask = {
        ...task,
        subtasks: updatedSubtasks,
        priorityMarkerRing: newBeltRing,
        updatedAt: new Date()
      };

      await saveTask(updatedTask);
      onTaskUpdate?.(updatedTask);

      if (shouldCelebrate) {
        setTimeout(async () => {
          const currentTask = await getTask(task.id);
          if (currentTask && currentTask.priorityMarkerEnabled && currentTask.priorityMarkerRing === 0) {
            const clearedSubtasks = recalculateRadii(currentTask.subtasks || [], undefined);
            const clearedTask = {
              ...currentTask,
              subtasks: clearedSubtasks,
              priorityMarkerEnabled: false,
              priorityMarkerRing: undefined,
              priorityMarkerOriginalIds: undefined,
              updatedAt: new Date(),
            };
            await saveTask(clearedTask);
            onTaskUpdate?.(clearedTask);
          }
        }, 3000);
      }

      setTimeout(() => {
        setCompletingSubtaskIds(prev => {
          const next = new Set(prev);
          next.delete(subtaskId);
          return next;
        });
      }, 1000);
    }, 500);
  };

  const handleEditSubtask = (st: Subtask) => {
    setEditingSubtaskId(st.id);
    setEditedSubtaskTitle(st.title);
  };

  const handleSaveSubtaskEdit = async () => {
    if (!editedSubtaskTitle.trim() || !task.subtasks || !editingSubtaskId) return;

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === editingSubtaskId ? { ...st, title: editedSubtaskTitle.trim() } : st
    );
    const updatedTask = { ...task, subtasks: updatedSubtasks, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
    setEditingSubtaskId(null);
    setEditedSubtaskTitle('');
  };

  const handleCancelSubtaskEdit = () => {
    setEditingSubtaskId(null);
    setEditedSubtaskTitle('');
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task.subtasks) return;

    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    const recalculatedSubtasks = recalculateRadii(updatedSubtasks, task.priorityMarkerRing);
    const updatedTask = { ...task, subtasks: recalculatedSubtasks, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
  };

  const handleEnergyChange = async (energy: EnergyLevel) => {
    const updatedTask = { ...task, energy, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
  };

  const handleEstimatedTimeChange = async (estimatedTime: EstimatedTime) => {
    const updatedTask = { ...task, estimatedTime, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const tags = [...(task.tags || []), newTag.trim()];
    const updatedTask = { ...task, tags, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
    setNewTag('');
    setShowTagInput(false);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const tags = (task.tags || []).filter(t => t !== tagToRemove);
    const updatedTask = { ...task, tags, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
  };

  const handleDateChange = async (field: 'targetDate' | 'dueDate', value: string) => {
    const date = value ? new Date(value) : undefined;
    const updatedTask = { ...task, [field]: date, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
  };

  const handleCompleteTask = async () => {
    // If completing (not un-completing) and there's an active session, end it with completion
    if (!task.completed && hasFocusSession && focusSession) {
      const shouldEndSession = window.confirm(
        'End the current focus session and mark it as completed?'
      );

      if (shouldEndSession) {
        // Optional: prompt for session notes
        const sessionNotes = window.prompt('Add notes for this session (optional):');

        try {
          await endSession(
            focusSession.id,
            'completed',
            true,
            sessionNotes || undefined
          );
          // Clear the session from parent component
          if (onStopFocus) {
            onStopFocus();
          }
        } catch (error) {
          console.error('Failed to end session:', error);
        }
      }
    }

    // Toggle task completion
    const updatedTask = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : undefined,
      updatedAt: new Date(),
    };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
  };

  const subtasks = (task.subtasks || []).filter(st => !st.completed);
  const completedSubtasks = (task.subtasks || []).filter(st => st.completed);
  const hasSubtasks = subtasks.length > 0 || completedSubtasks.length > 0;
  const totalCount = subtasks.length + completedSubtasks.length;
  const completedCount = completedSubtasks.length;
  const currentMarkerPosition = task.priorityMarkerRing || 0;
  const hasFocusSession = focusSession?.taskId === task.id && (!subtask || focusSession.subtaskId === subtask?.id);

  // Format dates for input fields
  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-gray-50 border-l border-gray-200 flex flex-col z-40">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {subtask && (
              <button
                onClick={() => onSubtaskChange?.(null)}
                className="text-xs text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
              >
                <span>←</span>
                <span>{task.title}</span>
              </button>
            )}
            {editingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') {
                    setTaskTitle(task.title);
                    setEditingTitle(false);
                  }
                }}
                className="w-full text-lg font-medium text-gray-900 bg-transparent border-none outline-none p-0"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="w-full text-left text-lg font-medium text-gray-900 hover:text-gray-700"
              >
                {subtask ? subtask.title : task.title}
              </button>
            )}
            {/* Timer display for active session */}
            {hasFocusSession && (
              <div className="mt-2 flex items-center gap-2">
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  focusSession.isActive
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {timer.formattedTime}
                </div>
                {!focusSession.isActive && (
                  <span className="text-xs text-gray-500">Paused</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-8">
          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm text-gray-500">Notes</label>
            <textarea
              ref={notesTextareaRef}
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              rows={3}
              className="w-full bg-gray-100/50 text-gray-900 placeholder-gray-400 resize-none overflow-hidden border-none outline-none rounded-lg p-3"
            />
          </div>

          {/* Subtasks (parent tasks only) */}
          {!subtask && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-500">
                  Subtasks {hasSubtasks && <span className="text-gray-400">({completedCount}/{totalCount})</span>}
                </label>
              </div>

              {/* Subtask list */}
              {hasSubtasks && (
                <div className="space-y-2">
                  {subtasks.map((st, index) => {
                    const isEditing = editingSubtaskId === st.id;
                    const isCompleting = completingSubtaskIds.has(st.id);
                    const activeSubtasks = subtasks;
                    const activeIndex = activeSubtasks.findIndex(s => s.id === st.id);
                    const showMarkerAfter = task.priorityMarkerEnabled &&
                      activeIndex === currentMarkerPosition - 2 &&
                      currentMarkerPosition > 0;

                    return (
                      <div key={st.id}>
                        <div
                          className="flex items-center gap-2 group"
                          style={{
                            opacity: isCompleting ? 0 : 1,
                            transform: isCompleting ? 'scale(0.95)' : 'scale(1)',
                            transition: 'all 500ms',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => handleSubtaskToggle(st.id)}
                            disabled={isCompleting}
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                          />
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                ref={subtaskInputRef}
                                type="text"
                                value={editedSubtaskTitle}
                                onChange={(e) => setEditedSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveSubtaskEdit();
                                  if (e.key === 'Escape') handleCancelSubtaskEdit();
                                }}
                                className="flex-1 text-sm text-gray-900 bg-gray-100 rounded px-2 py-1 border-none outline-none"
                              />
                              <button
                                onClick={handleCancelSubtaskEdit}
                                className="text-gray-400 hover:text-gray-600 text-xs"
                              >
                                ✕
                              </button>
                              <button
                                onClick={handleSaveSubtaskEdit}
                                className="text-gray-600 hover:text-gray-800 text-xs"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => onSubtaskChange?.(st)}
                                className="flex-1 text-left text-sm text-gray-700 hover:text-gray-900"
                              >
                                {st.title}
                              </button>
                              <button
                                onClick={() => handleEditSubtask(st)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubtask(st.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 text-xs"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>

                        {/* Priority marker line */}
                        {showMarkerAfter && (
                          <div className="flex items-center gap-2 py-2 my-1">
                            <div className="flex-1 h-px bg-gray-300" />
                            <div className="flex items-center gap-1">
                              <button
                                onClick={async () => {
                                  const newRing = Math.max(2, currentMarkerPosition - 1);
                                  const subtasksInsideBelt = subtasks.slice(0, newRing - 1).map(s => s.id);
                                  const updatedSubtasks = recalculateRadii(task.subtasks || [], newRing);
                                  const updatedTask = {
                                    ...task,
                                    subtasks: updatedSubtasks,
                                    priorityMarkerRing: newRing,
                                    priorityMarkerOriginalIds: subtasksInsideBelt,
                                    updatedAt: new Date(),
                                  };
                                  await saveTask(updatedTask);
                                  onTaskUpdate?.(updatedTask);
                                }}
                                disabled={currentMarkerPosition <= 2}
                                className="text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed text-xs"
                                title="Move up"
                              >
                                ↑
                              </button>
                              <span className="text-xs text-gray-400">Priority</span>
                              <button
                                onClick={async () => {
                                  const newRing = Math.min(subtasks.length + 1, currentMarkerPosition + 1);
                                  const subtasksInsideBelt = subtasks.slice(0, newRing - 1).map(s => s.id);
                                  const updatedSubtasks = recalculateRadii(task.subtasks || [], newRing);
                                  const updatedTask = {
                                    ...task,
                                    subtasks: updatedSubtasks,
                                    priorityMarkerRing: newRing,
                                    priorityMarkerOriginalIds: subtasksInsideBelt,
                                    updatedAt: new Date(),
                                  };
                                  await saveTask(updatedTask);
                                  onTaskUpdate?.(updatedTask);
                                }}
                                disabled={currentMarkerPosition >= subtasks.length + 1}
                                className="text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed text-xs"
                                title="Move down"
                              >
                                ↓
                              </button>
                            </div>
                            <div className="flex-1 h-px bg-gray-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add subtask */}
              {showAddSubtask ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={newSubtaskInputRef}
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubtask();
                      if (e.key === 'Escape') {
                        setNewSubtaskTitle('');
                        setShowAddSubtask(false);
                      }
                    }}
                    placeholder="New subtask..."
                    className="flex-1 text-sm text-gray-900 bg-gray-100 rounded px-3 py-2 border-none outline-none"
                  />
                  <button
                    onClick={() => {
                      setNewSubtaskTitle('');
                      setShowAddSubtask(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSubtask}
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddSubtask(true)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  + Add subtask
                </button>
              )}

              {/* Priority belt controls */}
              {hasSubtasks && (
                <button
                  onClick={async () => {
                    if (task.priorityMarkerEnabled) {
                      const updatedSubtasks = recalculateRadii(task.subtasks || [], undefined);
                      const updatedTask = {
                        ...task,
                        subtasks: updatedSubtasks,
                        priorityMarkerEnabled: false,
                        priorityMarkerRing: undefined,
                        priorityMarkerOriginalIds: undefined,
                        updatedAt: new Date(),
                      };
                      await saveTask(updatedTask);
                      onTaskUpdate?.(updatedTask);
                    } else {
                      const activeSubtasks = subtasks;
                      const outerRing = activeSubtasks.length + 1;
                      const subtasksInsideBelt = activeSubtasks.map(st => st.id);
                      const updatedSubtasks = recalculateRadii(task.subtasks || [], outerRing);

                      const updatedTask = {
                        ...task,
                        subtasks: updatedSubtasks,
                        priorityMarkerEnabled: true,
                        priorityMarkerRing: outerRing,
                        priorityMarkerOriginalIds: subtasksInsideBelt,
                        updatedAt: new Date(),
                      };
                      await saveTask(updatedTask);
                      onTaskUpdate?.(updatedTask);
                    }
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {task.priorityMarkerEnabled ? 'Remove Priority Indicator' : 'Add Priority Indicator'}
                </button>
              )}
            </div>
          )}

          {/* Schedule */}
          <div className="space-y-3">
            <label className="text-sm text-gray-500">Schedule</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Target</label>
                <input
                  type="date"
                  value={formatDateForInput(task.targetDate)}
                  onChange={(e) => handleDateChange('targetDate', e.target.value)}
                  className="w-full text-sm text-gray-900 bg-gray-100/50 rounded-lg px-3 py-2 border-none outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Due</label>
                <input
                  type="date"
                  value={formatDateForInput(task.dueDate)}
                  onChange={(e) => handleDateChange('dueDate', e.target.value)}
                  className="w-full text-sm text-gray-900 bg-gray-100/50 rounded-lg px-3 py-2 border-none outline-none"
                />
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="space-y-4">
            <label className="text-sm text-gray-500">Organization</label>

            {/* Energy */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">Energy</label>
              <div className="flex gap-2">
                {(['high', 'medium', 'low', 'rest'] as EnergyLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleEnergyChange(level)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      task.energy === level
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {(task.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {showTagInput ? (
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag();
                      if (e.key === 'Escape') {
                        setNewTag('');
                        setShowTagInput(false);
                      }
                    }}
                    onBlur={() => {
                      if (newTag.trim()) {
                        handleAddTag();
                      } else {
                        setShowTagInput(false);
                      }
                    }}
                    placeholder="New tag..."
                    className="px-3 py-1 bg-gray-100 text-gray-900 text-xs rounded-full border-none outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    + Add tag
                  </button>
                )}
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">Estimated Time</label>
              <select
                value={task.estimatedTime || ''}
                onChange={(e) => handleEstimatedTimeChange(e.target.value as EstimatedTime)}
                className="w-full text-sm text-gray-900 bg-gray-100/50 rounded-lg px-3 py-2 border-none outline-none"
              >
                <option value="">Select time...</option>
                <option value="5min">5 minutes</option>
                <option value="15min">15 minutes</option>
                <option value="30min">30 minutes</option>
                <option value="1hr">1 hour</option>
                <option value="2hr">2 hours</option>
                <option value="4hr">4 hours</option>
                <option value="1day">1 day</option>
                <option value="1week">1 week</option>
              </select>
            </div>
          </div>

          {/* Progressive Disclosure */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showMore ? 'Less' : 'More'}
            </button>
            {showMore && (
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                </div>

                {/* Time aggregation stats from TimeEntries */}
                {timeStats && timeStats.sessionCount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Active Time</span>
                      <span>{Math.floor(timeStats.totalActiveTime / 60)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sessions</span>
                      <span>{timeStats.sessionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Average Session</span>
                      <span>{Math.floor(timeStats.averageSessionLength / 60)} min</span>
                    </div>
                    {timeStats.lastWorkedOn && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Worked On</span>
                        <span>{new Date(timeStats.lastWorkedOn).toLocaleDateString()}</span>
                      </div>
                    )}
                    {timeStats.completionRate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Completion Rate</span>
                        <span>{Math.round(timeStats.completionRate * 100)}%</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 space-y-3">
        {hasFocusSession ? (
          <div className="space-y-2">
            {focusSession.isActive ? (
              <button
                onClick={onPauseFocus}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
              >
                Pause Focus
              </button>
            ) : (
              <button
                onClick={onResumeFocus}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
              >
                Resume Focus
              </button>
            )}
            <button
              onClick={onStopFocus}
              className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Stop Focus
            </button>
          </div>
        ) : (
          <button
            onClick={onStartFocus}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
          >
            Start Focus
          </button>
        )}
        <button
          onClick={handleCompleteTask}
          className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
        >
          {task.completed ? 'Mark Incomplete' : 'Complete Task'}
        </button>
      </div>

      {/* AI Integration */}
      <div className="border-t border-gray-200 flex-shrink-0">
        {showAI ? (
          <div className="px-6 py-4 bg-gray-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAIInput(e.target.value)}
                placeholder="Ask AI..."
                className="flex-1 px-3 py-2 bg-white border-none outline-none rounded-lg text-sm"
              />
              <button
                onClick={() => setShowAI(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAI(true)}
            className="w-full px-6 py-3 text-gray-500 hover:text-gray-700 text-sm text-left"
          >
            Ask AI
          </button>
        )}
      </div>
    </div>
  );
}
