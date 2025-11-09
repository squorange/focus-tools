'use client';

import { useState, useRef, useEffect } from 'react';
import { Task, Subtask, FocusSession } from '../lib/types';
import { saveTask } from '../lib/offline-store';
import { calculateNextAngle, calculateNextRadius, recalculateRadii, initializeSubtaskOrbits } from '../lib/orbit-utils';

type PanelState = 'details' | 'focus';
type DetailsView = 'task' | 'subtask';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
  // Determine if there's a focus session for this task/subtask
  const hasFocusSession = focusSession?.taskId === task.id &&
    (subtask ? focusSession.subtaskId === subtask.id : !focusSession.subtaskId);

  // Default to Focus tab if there's a focus session
  const [panelState, setPanelState] = useState<PanelState>(hasFocusSession ? 'focus' : 'details');
  const [detailsView, setDetailsView] = useState<DetailsView>('task');
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `I can help you with "${task.title}". What would you like to know or do?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Details state
  const [editingTitle, setEditingTitle] = useState(false);
  const [taskTitle, setTaskTitle] = useState(task.title);
  const [taskNotes, setTaskNotes] = useState(task.notes || '');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editedSubtaskTitle, setEditedSubtaskTitle] = useState('');
  const [editingSubtaskHeaderTitle, setEditingSubtaskHeaderTitle] = useState(false);
  const [subtaskHeaderTitle, setSubtaskHeaderTitle] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const subtaskHeaderInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus title input when editing
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // Auto-resize notes textarea
  useEffect(() => {
    if (notesTextareaRef.current) {
      notesTextareaRef.current.style.height = 'auto';
      notesTextareaRef.current.style.height = notesTextareaRef.current.scrollHeight + 'px';
    }
  }, [taskNotes]);

  // React to external subtask selection (from clicking subtask circles)
  useEffect(() => {
    if (subtask) {
      setSelectedSubtaskId(subtask.id);
      setDetailsView('subtask');
      setPanelState('details'); // Switch to details tab if in focus mode
    } else if (selectedSubtaskId !== null) {
      // If subtask prop becomes null/undefined but we had one selected, go back to task view
      setSelectedSubtaskId(null);
      setDetailsView('task');
    }
  }, [subtask, selectedSubtaskId]);

  // Migration: Initialize angles and radii for existing subtasks that don't have them
  useEffect(() => {
    const subtasks = task.subtasks || [];
    const needsMigration = subtasks.some(
      st => st.assignedStartingAngle === undefined || st.assignedOrbitRadius === undefined
    );

    if (needsMigration) {
      const migratedSubtasks = initializeSubtaskOrbits(subtasks);
      const updatedTask = { ...task, subtasks: migratedSubtasks, updatedAt: new Date() };
      saveTask(updatedTask);
      onTaskUpdate?.(updatedTask);
    }
  }, [task.id]); // Only run when task changes

  // Handle Escape key to go back from subtask details
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && detailsView === 'subtask') {
        handleBackToTask();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [detailsView]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Calculate total focus time
  const currentSubtask = selectedSubtaskId ? task.subtasks?.find(st => st.id === selectedSubtaskId) : null;
  const displaySubtask = currentSubtask || subtask;
  const totalFocusTime = displaySubtask?.totalFocusTime || task.totalFocusTime || 0;
  const focusSessionCount = displaySubtask?.focusSessionCount || task.focusSessionCount || 0;

  // Handle task title update
  const handleTitleSave = async () => {
    if (taskTitle.trim() && taskTitle !== task.title) {
      const updatedTask = { ...task, title: taskTitle.trim(), updatedAt: new Date() };
      await saveTask(updatedTask);
      onTaskUpdate?.(updatedTask);
    }
    setEditingTitle(false);
  };

  // Handle notes update
  const handleNotesBlur = async () => {
    if (taskNotes !== (task.notes || '')) {
      const updatedTask = { ...task, notes: taskNotes, updatedAt: new Date() };
      await saveTask(updatedTask);
      onTaskUpdate?.(updatedTask);
    }
  };

  // Handle subtask toggle with staggered animation phases
  const handleSubtaskToggle = async (subtaskId: string) => {
    if (!task.subtasks) return;

    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    // If marking as complete, use staggered phases
    if (!subtask.completed) {
      // PHASE 1: Fade out (0-500ms)
      // Add to completing set to start fade-out animation
      setCompletingSubtaskIds(prev => new Set(prev).add(subtaskId));

      // PHASE 2: Update data and transition radii (500-1000ms)
      // Use requestAnimationFrame to ensure update happens at optimal frame timing
      setTimeout(() => {
        requestAnimationFrame(async () => {
          let updatedSubtasks = task.subtasks!.map(st =>
            st.id === subtaskId ? { ...st, completed: true } : st
          );

          // Recalculate radii for remaining active subtasks (angles stay the same)
          updatedSubtasks = recalculateRadii(updatedSubtasks);

          const updatedTask = { ...task, subtasks: updatedSubtasks, updatedAt: new Date() };
          await saveTask(updatedTask);
          onTaskUpdate?.(updatedTask);

          // PHASE 3: Clean up (after 1000ms total)
          // Keep in completing set during radius transition, remove after
          setTimeout(() => {
            setCompletingSubtaskIds(prev => {
              const next = new Set(prev);
              next.delete(subtaskId);
              return next;
            });
          }, 500); // Wait for radius transition to complete
        });
      }, 500); // Wait for fade-out to complete
    } else {
      // If unmarking (uncompleting), use smooth transition approach
      // Update immediately but let CSS transitions handle the animation
      requestAnimationFrame(async () => {
        let updatedSubtasks = task.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: false } : st
        );

        // Recalculate radii for all active subtasks
        updatedSubtasks = recalculateRadii(updatedSubtasks);

        const updatedTask = { ...task, subtasks: updatedSubtasks, updatedAt: new Date() };
        await saveTask(updatedTask);
        onTaskUpdate?.(updatedTask);
      });
    }
  };

  // Handle add subtask
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    const existingSubtasks = task.subtasks || [];

    // Calculate assigned angle and radius for new subtask
    const assignedStartingAngle = calculateNextAngle(existingSubtasks);
    const assignedOrbitRadius = calculateNextRadius(existingSubtasks);

    const newSubtask: Subtask = {
      id: `${task.id}-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      parentTaskId: task.id,
      assignedStartingAngle,
      assignedOrbitRadius,
    };

    const updatedSubtasks = [...existingSubtasks, newSubtask];
    const updatedTask = { ...task, subtasks: updatedSubtasks, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
    setNewSubtaskTitle('');
    setShowAddSubtask(false);
  };

  // Handle subtask click from list
  const handleSubtaskClick = (subtask: Subtask) => {
    setSelectedSubtaskId(subtask.id);
    setDetailsView('subtask');
    onSubtaskChange?.(subtask); // Notify parent to update selection
  };

  // Handle back to task view
  const handleBackToTask = () => {
    setSelectedSubtaskId(null);
    setDetailsView('task');
    onSubtaskChange?.(null); // Notify parent to clear subtask selection
  };

  // Handle edit subtask inline
  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditedSubtaskTitle(subtask.title);
  };

  // Auto-focus subtask input when editing
  useEffect(() => {
    if (editingSubtaskId && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
      subtaskInputRef.current.select();
    }
  }, [editingSubtaskId]);

  // Handle save subtask edit
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

  // Handle cancel subtask edit
  const handleCancelSubtaskEdit = () => {
    setEditingSubtaskId(null);
    setEditedSubtaskTitle('');
  };

  // Handle delete subtask
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task.subtasks) return;

    const subtaskToDelete = task.subtasks.find(st => st.id === subtaskId);
    if (!subtaskToDelete) return;

    // Skip confirmation for empty/new subtasks (no title, no focus time)
    const shouldConfirm = subtaskToDelete.title.trim().length > 0 &&
      (subtaskToDelete.totalFocusTime || 0) > 0;

    if (shouldConfirm) {
      const confirmed = window.confirm(
        `Delete subtask "${subtaskToDelete.title}"? This will also delete ${formatTime(subtaskToDelete.totalFocusTime || 0)} of logged focus time.`
      );
      if (!confirmed) return;
    }

    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    const updatedTask = { ...task, subtasks: updatedSubtasks, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);

    // If we deleted the currently selected subtask, go back to parent task view
    if (selectedSubtaskId === subtaskId) {
      handleBackToTask();
    }
  };

  // Handle subtask header title save
  const handleSubtaskHeaderTitleSave = async () => {
    if (!subtaskHeaderTitle.trim() || !task.subtasks || !currentSubtask) return;

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === currentSubtask.id ? { ...st, title: subtaskHeaderTitle.trim() } : st
    );
    const updatedTask = { ...task, subtasks: updatedSubtasks, updatedAt: new Date() };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);
    setEditingSubtaskHeaderTitle(false);
  };

  // Auto-focus subtask header input when editing
  useEffect(() => {
    if (editingSubtaskHeaderTitle && subtaskHeaderInputRef.current) {
      subtaskHeaderInputRef.current.focus();
      subtaskHeaderInputRef.current.select();
    }
  }, [editingSubtaskHeaderTitle]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          taskId: task.id,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          role: data.message.role,
          content: data.message.content,
        },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate subtask progress
  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter(st => st.completed).length;
  const totalCount = subtasks.length;
  const hasSubtasks = totalCount > 0;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-gradient-to-br from-gray-900 to-gray-800 border-l border-gray-700/50 shadow-2xl flex flex-col z-40">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50 flex items-center justify-between flex-shrink-0">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {/* Back button when viewing subtask */}
          {detailsView === 'subtask' && (
            <button
              onClick={handleBackToTask}
              className="p-1.5 -ml-1.5 hover:bg-gray-700/50 rounded-full transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Title - editable for task view */}
          {detailsView === 'task' ? (
            editingTitle ? (
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
                className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-white placeholder-gray-500"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="flex-1 text-left text-lg font-medium text-white hover:text-gray-200 transition-colors"
              >
                {task.title}
              </button>
            )
          ) : (
            editingSubtaskHeaderTitle ? (
              <input
                ref={subtaskHeaderInputRef}
                type="text"
                value={subtaskHeaderTitle}
                onChange={(e) => setSubtaskHeaderTitle(e.target.value)}
                onBlur={handleSubtaskHeaderTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubtaskHeaderTitleSave();
                  if (e.key === 'Escape') {
                    setSubtaskHeaderTitle(currentSubtask?.title || '');
                    setEditingSubtaskHeaderTitle(false);
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-white placeholder-gray-500"
              />
            ) : (
              <button
                onClick={() => {
                  setSubtaskHeaderTitle(currentSubtask?.title || '');
                  setEditingSubtaskHeaderTitle(true);
                }}
                className="flex-1 text-left text-lg font-medium text-white hover:text-gray-200 transition-colors truncate"
              >
                {currentSubtask?.title}
              </button>
            )
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 hover:bg-gray-700/50 rounded-full transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* State Toggle */}
      <div className="px-6 pt-4 pb-6 border-b border-gray-700/50 flex-shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setPanelState('details')}
            className={`flex-1 py-2.5 px-4 rounded-full font-medium transition-all ${
              panelState === 'details'
                ? 'bg-gray-700/30 border border-gray-600/40 text-white'
                : 'border border-gray-600/50 text-gray-400 hover:border-gray-500/50 hover:text-gray-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setPanelState('focus')}
            className={`flex-1 py-2.5 px-4 rounded-full font-medium transition-all ${
              panelState === 'focus'
                ? 'bg-gray-700/30 border border-gray-600/40 text-white'
                : 'border border-gray-600/50 text-gray-400 hover:border-gray-500/50 hover:text-gray-300'
            }`}
          >
            Focus
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {panelState === 'details' ? (
          // Details View
          <div className="px-6 py-6 space-y-8">
            {detailsView === 'task' ? (
              // Task Details
              <>
                {/* Notes Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400">Notes</h3>
                  <textarea
                    ref={notesTextareaRef}
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Add notes..."
                    rows={3}
                    className="w-full bg-transparent border-none outline-none text-gray-200 placeholder-gray-600 resize-none overflow-hidden"
                  />
                </div>

                {/* Subtasks Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-400">Subtasks</h3>
                    {hasSubtasks && (
                      <span className="text-xs text-gray-500">
                        {completedCount} of {totalCount}
                      </span>
                    )}
                  </div>

                  {/* Subtasks List */}
                  {hasSubtasks && (
                    <div className="space-y-2">
                      {subtasks.map((st) => {
                        const isEditing = editingSubtaskId === st.id;
                        const isCompleting = completingSubtaskIds.has(st.id);

                        return (
                          <div
                            key={st.id}
                            className="flex items-center gap-2 group transition-all duration-500"
                            style={{
                              opacity: isCompleting ? 0 : 1,
                              transform: isCompleting ? 'scale(0.8)' : 'scale(1)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => handleSubtaskToggle(st.id)}
                              disabled={isCompleting}
                              className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800 cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
                            />

                            {isEditing ? (
                              <>
                                <input
                                  ref={subtaskInputRef}
                                  type="text"
                                  value={editedSubtaskTitle}
                                  onChange={(e) => setEditedSubtaskTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveSubtaskEdit();
                                    if (e.key === 'Escape') handleCancelSubtaskEdit();
                                  }}
                                  className="flex-1 px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded text-sm text-gray-200 focus:outline-none focus:border-gray-600"
                                />
                                <button
                                  onClick={handleCancelSubtaskEdit}
                                  className="p-1 text-gray-400 hover:text-white transition-colors"
                                  title="Cancel"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                <button
                                  onClick={handleSaveSubtaskEdit}
                                  className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                  title="Save"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleSubtaskClick(st)}
                                  className="flex-1 text-left text-gray-300 hover:text-white transition-colors py-1"
                                >
                                  <span className={st.completed ? 'line-through opacity-50' : ''}>
                                    {st.title}
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleEditSubtask(st)}
                                  className="p-1 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-gray-300 transition-all"
                                  title="Edit subtask"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteSubtask(st.id)}
                                  className="p-1 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                                  title="Delete subtask"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Subtask */}
                  {showAddSubtask ? (
                    <div className="flex gap-2 pt-2">
                      <input
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
                        placeholder="Subtask title..."
                        className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-full text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-600"
                        autoFocus
                      />
                      <button
                        onClick={handleAddSubtask}
                        className="px-4 py-2 border border-gray-600/50 text-gray-300 rounded-full text-sm font-medium hover:border-gray-500/50 hover:text-white transition-all"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddSubtask(true)}
                      className="w-full py-2 text-left text-sm text-gray-500 hover:text-gray-400 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add subtask
                    </button>
                  )}
                </div>

                {/* Start Focus Button */}
                <button
                  onClick={onStartFocus}
                  disabled={!hasSubtasks}
                  className="w-full py-3 px-6 bg-gradient-to-br from-purple-500/25 to-blue-500/25 disabled:from-gray-700/20 disabled:to-gray-700/20 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-full hover:from-purple-500/35 hover:to-blue-500/35 transition-all flex items-center justify-center gap-2 border border-purple-500/20"
                >
                  <span className="text-xl">🎯</span>
                  Start Focus Session
                </button>

                {/* Metadata Section - Always Visible */}
                <div className="space-y-3 pt-4 border-t border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-400">Details</h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Created</span>
                      <span className="text-gray-300">{formatRelativeTime(task.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Last edited</span>
                      <span className="text-gray-300">{formatRelativeTime(task.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total time</span>
                      <span className="text-gray-300">
                        {totalFocusTime > 0 ? formatTime(totalFocusTime) : '0m'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Focus sessions</span>
                      <span className="text-gray-300">{focusSessionCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Priority</span>
                      <span className="text-gray-300 capitalize">{task.priority}</span>
                    </div>
                    {task.category && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Category</span>
                        <span className="text-gray-300 capitalize">{task.category}</span>
                      </div>
                    )}
                    {task.addedBy && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Added by</span>
                        <span className="text-gray-300 capitalize">{task.addedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Subtask Details
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400">Parent Task</h3>
                  <p className="text-gray-300">{task.title}</p>
                </div>

                {/* Subtask Metadata */}
                <div className="space-y-3 pt-4 border-t border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-400">Details</h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Status</span>
                      <span className="text-gray-300">
                        {currentSubtask?.completed ? 'Completed' : 'In progress'}
                      </span>
                    </div>
                    {currentSubtask?.dueDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Due date</span>
                        <span className="text-gray-300">
                          {new Date(currentSubtask.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total time</span>
                      <span className="text-gray-300">
                        {(currentSubtask?.totalFocusTime || 0) > 0
                          ? formatTime(currentSubtask!.totalFocusTime!)
                          : '0m'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Focus sessions</span>
                      <span className="text-gray-300">{currentSubtask?.focusSessionCount || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Subtask Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => currentSubtask && handleDeleteSubtask(currentSubtask.id)}
                    className="px-4 py-2 border border-red-600/50 text-red-400 rounded-full text-sm font-medium hover:bg-red-600/10 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>

                {/* Start Focus on Subtask */}
                <button
                  onClick={onStartFocus}
                  className="w-full py-3 px-6 bg-gradient-to-br from-purple-500/25 to-blue-500/25 text-white font-medium rounded-full hover:from-purple-500/35 hover:to-blue-500/35 transition-all flex items-center justify-center gap-2 border border-purple-500/20"
                >
                  <span className="text-xl">🎯</span>
                  Start Focus Session
                </button>
              </>
            )}
          </div>
        ) : (
          // Focus View
          <div className="px-6 py-6 space-y-6">
            {/* Focus Status */}
            <div className="text-center">
              {hasFocusSession ? (
                <div className="space-y-4">
                  <div
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.2), rgba(59, 130, 246, 0.2))',
                      border: '2px solid rgba(168, 85, 247, 0.3)',
                    }}
                  >
                    <svg className="w-10 h-10 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {focusSession?.isActive ? (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-purple-300 font-medium text-lg">
                      {focusSession?.isActive ? 'In Focus' : 'Focus Paused'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {focusSession?.isActive ? 'Stay focused on your task' : 'Ready to continue when you are'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gray-800/50 border-2 border-gray-700/50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium text-lg">Ready to Focus</p>
                    <p className="text-gray-500 text-sm mt-1">Start a focus session to begin</p>
                  </div>
                </div>
              )}
            </div>

            {/* Focus Controls */}
            <div className="space-y-3">
              {!hasFocusSession ? (
                <button
                  onClick={onStartFocus}
                  className="w-full py-3 px-6 bg-gradient-to-br from-purple-500/25 to-blue-500/25 text-white font-medium rounded-full hover:from-purple-500/35 hover:to-blue-500/35 transition-all flex items-center justify-center gap-2 border border-purple-500/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Focus Session
                </button>
              ) : (
                <>
                  {focusSession?.isActive ? (
                    <button
                      onClick={onPauseFocus}
                      className="w-full py-3 px-6 border border-yellow-600/50 text-yellow-400 font-medium rounded-full hover:bg-yellow-600/10 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={onResumeFocus}
                      className="w-full py-3 px-6 bg-gradient-to-br from-purple-500/25 to-blue-500/25 text-white font-medium rounded-full hover:from-purple-500/35 hover:to-blue-500/35 transition-all flex items-center justify-center gap-2 border border-purple-500/20"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Continue Focus Session
                    </button>
                  )}
                  <button
                    onClick={onStopFocus}
                    className="w-full py-3 px-6 border border-red-600/50 text-red-400 font-medium rounded-full hover:bg-red-600/10 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Stop & Save
                  </button>
                </>
              )}
            </div>

            {/* Tips */}
            <div className="mt-8 p-4 bg-gray-800/30 border border-gray-700/30 rounded-2xl">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Focus Tips</h4>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Eliminate distractions before starting</li>
                <li>• Take breaks every 25-30 minutes</li>
                <li>• Use pause if you need a quick break</li>
                <li>• Stop when task is complete or switching tasks</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
