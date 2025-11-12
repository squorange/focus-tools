'use client';

import { useState, useRef, useEffect } from 'react';
import { Task, Subtask, FocusSession, EnergyLevel, EstimatedTime, ActivityLog } from '../lib/types';
import {
  saveTask,
  getTask,
  createActivityLog,
  getActivityLogs,
  updateActivityLog,
  deleteActivityLog,
} from '../lib/offline-store';
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
  onClearFocusSession?: () => void;
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
  onClearFocusSession,
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
  const [showActivity, setShowActivity] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedComment, setEditedComment] = useState('');

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

  /**
   * Format duration in seconds to human-readable string
   *
   * IMPORTANT: This helper ensures consistent time display across the entire app.
   *
   * BUG PREVENTION: Previously, durations < 60s were displayed as "0 min" because
   * of Math.floor(seconds / 60) rounding down. This was confusing for users seeing
   * multiple short sessions averaged to "0 min".
   *
   * BEHAVIOR:
   * - < 60s: Shows seconds (e.g., "45s")
   * - 60-3599s: Shows minutes + seconds (e.g., "1m 30s" or "2m")
   * - >= 3600s: Shows hours + minutes (e.g., "1h 15m" or "2h")
   *
   * Used in: Time stats display, activity logs, session summaries
   * See: docs/TEST_EXECUTION.md - Test 4.2 for details
   *
   * @param seconds - Duration in seconds to format
   * @returns Human-readable duration string
   */
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const loadTimeStats = async () => {
    try {
      // Load stats for subtask or parent task
      const targetId = subtask ? subtask.id : task.id;
      const stats = await getTaskTimeStats(task.id, subtask?.id, !subtask); // Include breakdown for parent tasks
      setTimeStats(stats);
    } catch (error) {
      console.error('Failed to load time stats:', error);
    }
  };

  // ==================================================================================
  // CRITICAL: Time Stats Auto-Refresh
  // ==================================================================================
  // Load time stats when task, subtask, or focus session changes.
  //
  // IMPORTANT: focusSession?.id MUST be in dependency array!
  //
  // BUG PREVENTION: Without focusSession?.id as a dependency, stats only reload when
  // switching tasks/subtasks. When a session ends (focusSession changes from active
  // to null), stats don't update immediately - user has to navigate away and back
  // to see updated totals.
  //
  // WHY IT WORKS: When session ends, focusSession changes from {id: "..."} to null,
  // triggering this effect to reload stats and display the just-completed session.
  //
  // See: docs/TEST_EXECUTION.md - Test 4.2 for details
  // ==================================================================================
  useEffect(() => {
    loadTimeStats();
  }, [task.id, subtask?.id, focusSession?.id]);

  // Helper to load activity logs (context-aware)
  const loadActivityLogs = async () => {
    setLoadingActivity(true);
    try {
      // Load logs for subtask or parent task (context-aware)
      const logs = await getActivityLogs(task.id, subtask?.id);
      // Limit to last 20 entries
      setActivityLogs(logs.slice(0, 20));
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Load activity logs when task, subtask, or focus session changes, or when activity section is expanded
  useEffect(() => {
    if (showActivity) {
      loadActivityLogs();
    }
  }, [task.id, subtask?.id, showActivity, focusSession?.id]);

  // Helper to format activity log entry
  const formatActivityEntry = (log: ActivityLog) => {
    const getIcon = () => {
      switch (log.type) {
        case 'session_start':
          return '▶️';
        case 'session_end':
          return '⏱️';
        case 'task_completed':
          return '✅';
        case 'task_uncompleted':
          return '↩️';
        case 'subtask_completed':
          return '✅';
        case 'subtask_uncompleted':
          return '↩️';
        case 'comment':
          return '💬';
        default:
          return '•';
      }
    };

    const getText = () => {
      switch (log.type) {
        case 'session_start':
          if (log.subtaskId) {
            const startSubtask = task.subtasks?.find((st) => st.id === log.subtaskId);
            return `Started focus on "${startSubtask?.title || 'subtask'}"`;
          }
          return 'Started focus session';
        case 'session_end':
          const durationText = formatDuration(Math.floor(log.duration || 0));
          if (log.subtaskId) {
            const endSubtask = task.subtasks?.find((st) => st.id === log.subtaskId);
            return `"${endSubtask?.title || 'subtask'}": ${durationText}`;
          }
          return `Focus session: ${durationText}`;
        case 'task_completed':
          return 'Completed task';
        case 'task_uncompleted':
          return 'Marked task incomplete';
        case 'subtask_completed':
          const completedSubtask = task.subtasks?.find((st) => st.id === log.subtaskId);
          return `Completed "${completedSubtask?.title || 'subtask'}"`;
        case 'subtask_uncompleted':
          const uncompletedSubtask = task.subtasks?.find((st) => st.id === log.subtaskId);
          return `Uncompleted "${uncompletedSubtask?.title || 'subtask'}"`;
        case 'comment':
          return log.comment || '';
        default:
          return log.type;
      }
    };

    const getTimestamp = () => {
      const now = new Date();
      const logTime = new Date(log.timestamp);
      const diffMs = now.getTime() - logTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return logTime.toLocaleDateString();
    };

    return {
      icon: getIcon(),
      text: getText(),
      timestamp: getTimestamp(),
      isManual: log.isManualComment,
      hasSecondaryContent: !!log.comment && log.type === 'session_end',
      secondaryContent: log.type === 'session_end' ? log.comment : undefined,
    };
  };

  // Handlers
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const now = new Date();

    // Context-aware: add comment to task or subtask based on current selection
    await createActivityLog({
      id: `${task.id}-comment-${Date.now()}`,
      taskId: task.id,
      subtaskId: subtask?.id,
      type: 'comment',
      timestamp: now,
      comment: newComment.trim(),
      isManualComment: true,
      createdAt: now,
    });

    // Reload activity logs to show the new comment
    await loadActivityLogs();

    // Clear input and hide
    setNewComment('');
    setShowAddComment(false);
  };

  const handleEditComment = async (log: ActivityLog) => {
    if (!editedComment.trim()) return;
    if (editedComment === log.comment) {
      // No changes, just cancel
      setEditingCommentId(null);
      setEditedComment('');
      return;
    }

    // Update with edit history
    const updatedLog: ActivityLog = {
      ...log,
      comment: editedComment.trim(),
      editedAt: new Date(),
      editHistory: [
        ...(log.editHistory || []),
        {
          editedAt: new Date(),
          previousComment: log.comment || '',
        },
      ],
    };

    await updateActivityLog(updatedLog);
    await loadActivityLogs();

    // Clear editing state
    setEditingCommentId(null);
    setEditedComment('');
  };

  const handleDeleteComment = async (logId: string) => {
    if (!confirm('Delete this comment?')) return;

    await deleteActivityLog(logId);
    await loadActivityLogs();
  };

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

  /**
   * Add a new subtask to the task
   *
   * CHECKLIST when modifying this function:
   * [ ] New subtask has assignedStartingAngle (use calculateNextAngle)
   * [ ] New subtask has assignedOrbitRadius (use calculateNextRadius)
   * [ ] Call initializeSubtaskOrbits() to ensure all subtasks have positions
   * [ ] Call saveTask() to persist orbital positions to database
   * [ ] Test: Add subtask, complete it, verify no angular jumps
   * [ ] See orbit-utils.ts INVARIANT #1 and #3 for details
   */
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

  /**
   * Toggle subtask completion status (checkbox click)
   *
   * CHECKLIST when modifying this function:
   * [ ] Preserve assignedStartingAngle during completion/uncompletion
   * [ ] Call recalculateRadii() to update radii for remaining active items
   * [ ] Recalculate belt position via getCurrentMarkerRing() if priority item
   * [ ] Call saveTask() to persist updated state to database
   * [ ] Test: Complete subtask → remaining items stay at same angles
   * [ ] Test: Undo completion → item returns, belt moves outward
   * [ ] See orbit-utils.ts INVARIANT #1, #2, #4 for details
   */
  const handleSubtaskToggle = async (subtaskId: string) => {
    if (!task.subtasks) return;

    const subtaskToToggle = task.subtasks.find((st) => st.id === subtaskId);
    if (!subtaskToToggle) return;

    // Handle un-completing
    if (subtaskToToggle.completed) {
      const now = new Date();
      let updatedSubtasks = task.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: false } : st
      );

      // Recalculate belt position if this was a priority item
      let newBeltRing = task.priorityMarkerRing;
      if (task.priorityMarkerEnabled && task.priorityMarkerOriginalIds?.includes(subtaskId)) {
        newBeltRing = getCurrentMarkerRing(
          updatedSubtasks,
          task.priorityMarkerRing,
          task.priorityMarkerOriginalIds
        );
      }

      // Recalculate radii to properly position the newly uncompleted subtask
      updatedSubtasks = recalculateRadii(updatedSubtasks, newBeltRing);

      const updatedTask = {
        ...task,
        subtasks: updatedSubtasks,
        priorityMarkerRing: newBeltRing,
        updatedAt: now,
      };
      await saveTask(updatedTask);
      onTaskUpdate?.(updatedTask);

      // Create activity log for uncompleting subtask
      const activityLog: ActivityLog = {
        id: crypto.randomUUID(),
        taskId: task.id,
        subtaskId: subtaskId,
        type: 'subtask_uncompleted',
        timestamp: now,
        isManualComment: false,
        createdAt: now,
      };
      await createActivityLog(activityLog);

      return;
    }

    // Handle completing (with animation and belt logic)
    setCompletingSubtaskIds((prev) => new Set(prev).add(subtaskId));

    setTimeout(async () => {
      const now = new Date();
      let updatedSubtasks = task.subtasks!.map((st) =>
        st.id === subtaskId ? { ...st, completed: true } : st
      );

      let newBeltRing = task.priorityMarkerRing;
      let shouldCelebrate = false;

      if (task.priorityMarkerEnabled && task.priorityMarkerOriginalIds?.includes(subtaskId)) {
        newBeltRing = getCurrentMarkerRing(
          updatedSubtasks,
          task.priorityMarkerRing,
          task.priorityMarkerOriginalIds
        );
        if (newBeltRing === 0) {
          shouldCelebrate = true;
          // Ring 0 = celebration mode at radius 70 (around parent task)
          // Belt stays at ring 0 during celebration
        }
      }

      updatedSubtasks = recalculateRadii(updatedSubtasks, newBeltRing);

      const updatedTask = {
        ...task,
        subtasks: updatedSubtasks,
        priorityMarkerRing: newBeltRing,
        updatedAt: now,
      };

      await saveTask(updatedTask);
      onTaskUpdate?.(updatedTask);

      // Create activity log for completing subtask
      const activityLog: ActivityLog = {
        id: crypto.randomUUID(),
        taskId: task.id,
        subtaskId: subtaskId,
        type: 'subtask_completed',
        timestamp: now,
        isManualComment: false,
        createdAt: now,
      };
      await createActivityLog(activityLog);

      if (shouldCelebrate) {
        setTimeout(async () => {
          const currentTask = await getTask(task.id);
          if (currentTask && currentTask.priorityMarkerEnabled) {
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
        setCompletingSubtaskIds((prev) => {
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

    const updatedSubtasks = task.subtasks.map((st) =>
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

    const updatedSubtasks = task.subtasks.filter((st) => st.id !== subtaskId);
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
    const tags = (task.tags || []).filter((t) => t !== tagToRemove);
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
    const isSubtask = !!subtask;
    const isTask = !subtask;

    // Handle subtask completion/un-completion
    if (isSubtask) {
      const willBeCompleted = !subtask.completed;

      // Only do auto-advance logic if completing (not un-completing)
      if (willBeCompleted) {
        // Find subtasks inside the priority belt (before belt ring)
        const beltRing = task.priorityMarkerRing || 0;
        const subtasksInBelt = (task.subtasks || []).slice(0, Math.max(0, beltRing - 1));
        const currentIndex = subtasksInBelt.findIndex((st) => st.id === subtask.id);
        const nextSubtask =
          currentIndex >= 0 && currentIndex < subtasksInBelt.length - 1
            ? subtasksInBelt[currentIndex + 1]
            : null;

        // Prompt for session notes if there's an active session
        let sessionNotes: string | null = null;
        if (hasFocusSession && focusSession) {
          sessionNotes = window.prompt(
            nextSubtask
              ? `Subtask completed! Moving to: "${nextSubtask.title}"\n\nAdd notes for this subtask (optional):`
              : 'Subtask completed!\n\nAdd notes for this session (optional):'
          );

          // If user cancelled the prompt, abort completion
          if (sessionNotes === null) {
            return;
          }

          // End current session
          try {
            await endSession(focusSession.id, 'completed', true, sessionNotes || undefined);
            // Clear focus session state after ending it
            onClearFocusSession?.();
          } catch (error) {
            console.error('Failed to end session:', error);
          }
        }

        // Trigger completion animation FIRST
        setCompletingSubtaskIds((prev) => new Set([...prev, subtask.id]));

        // Wait for animation to start, then update positions
        setTimeout(async () => {
          const now = new Date();

          // Mark subtask as complete
          let updatedSubtasks = task.subtasks?.map((st) =>
            st.id === subtask.id ? { ...st, completed: true } : st
          );

          // Calculate new belt ring position and check for celebration
          let newBeltRing = task.priorityMarkerRing;
          let shouldCelebrate = false;

          if (task.priorityMarkerEnabled && task.priorityMarkerOriginalIds?.includes(subtask.id)) {
            newBeltRing = getCurrentMarkerRing(
              updatedSubtasks || [],
              task.priorityMarkerRing,
              task.priorityMarkerOriginalIds
            );
            if (newBeltRing === 0) {
              shouldCelebrate = true;
              // Ring 0 = celebration mode at radius 70 (around parent task)
              // Belt stays at ring 0 during celebration
            }
          }

          // Recalculate radii for remaining subtasks
          updatedSubtasks = recalculateRadii(updatedSubtasks || [], newBeltRing);

          const updatedTask: Task = {
            ...task,
            subtasks: updatedSubtasks,
            priorityMarkerRing: newBeltRing,
            updatedAt: now,
          };

          await saveTask(updatedTask);
          onTaskUpdate?.(updatedTask);

          // Create activity log for completing subtask
          const activityLog: ActivityLog = {
            id: crypto.randomUUID(),
            taskId: task.id,
            subtaskId: subtask.id,
            type: 'subtask_completed',
            timestamp: now,
            isManualComment: false,
            createdAt: now,
          };
          await createActivityLog(activityLog);

          // Handle celebration after delay
          if (shouldCelebrate) {
            setTimeout(async () => {
              const currentTask = await getTask(task.id);
              if (currentTask && currentTask.priorityMarkerEnabled) {
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
          } else if (nextSubtask) {
            // Auto-start focus on next subtask
            onSubtaskChange?.(nextSubtask);
            if (onStartFocus) {
              onStartFocus();
            }
          } else {
            // No celebration, no next subtask - return to parent view
            onSubtaskChange?.(null);
          }

          // Reload time stats and activity logs
          loadTimeStats();
          if (showActivity) {
            loadActivityLogs();
          }

          // Remove from completing set after animation
          setTimeout(() => {
            setCompletingSubtaskIds((prev) => {
              const next = new Set(prev);
              next.delete(subtask.id);
              return next;
            });
          }, 1000);
        }, 500);
      } else {
        // Un-completing subtask - recalculate positions and belt
        const now = new Date();
        let updatedSubtasks = task.subtasks?.map((st) =>
          st.id === subtask.id ? { ...st, completed: false } : st
        );

        // Recalculate belt position if this was a priority item
        let newBeltRing = task.priorityMarkerRing;
        if (task.priorityMarkerEnabled && task.priorityMarkerOriginalIds?.includes(subtask.id)) {
          newBeltRing = getCurrentMarkerRing(
            updatedSubtasks || [],
            task.priorityMarkerRing,
            task.priorityMarkerOriginalIds
          );
        }

        // Recalculate radii to properly position the newly uncompleted subtask
        updatedSubtasks = recalculateRadii(updatedSubtasks || [], newBeltRing);

        const updatedTask: Task = {
          ...task,
          subtasks: updatedSubtasks,
          priorityMarkerRing: newBeltRing,
          updatedAt: now,
        };
        await saveTask(updatedTask);
        onTaskUpdate?.(updatedTask);

        // Create activity log for uncompleting subtask
        const activityLog: ActivityLog = {
          id: crypto.randomUUID(),
          taskId: task.id,
          subtaskId: subtask.id,
          type: 'subtask_uncompleted',
          timestamp: now,
          isManualComment: false,
          createdAt: now,
        };
        await createActivityLog(activityLog);

        loadTimeStats();
        if (showActivity) {
          loadActivityLogs();
        }
      }
      return;
    }

    // Handle parent task completion
    if (isTask && !task.completed && hasFocusSession && focusSession) {
      const sessionNotes = window.prompt(
        'Task completed!\n\nAdd notes for this session (optional):'
      );

      if (sessionNotes === null) {
        return; // User cancelled
      }

      try {
        await endSession(focusSession.id, 'completed', true, sessionNotes || undefined);

        // ============================================================================
        // CRITICAL: Use onClearFocusSession() NOT onStopFocus()
        // ============================================================================
        // IMPORTANT: Must call onClearFocusSession() to clear UI state, not onStopFocus().
        //
        // BUG PREVENTION: onStopFocus() calls endSession() internally. Since we already
        // called endSession() above, calling onStopFocus() would attempt to end the
        // session TWICE (double-end bug). This causes errors and leaves the timer
        // badge visible after task completion.
        //
        // CORRECT PATTERN:
        // - When UI action ends session: call onStopFocus() (handles both DB + state)
        // - When already called endSession(): call onClearFocusSession() (state only)
        //
        // See: docs/TEST_EXECUTION.md - Test 5.3 for details
        // ============================================================================
        onClearFocusSession?.();
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    }

    // Toggle task completion
    const willBeCompleted = !task.completed;
    const now = new Date();
    const updatedTask = {
      ...task,
      completed: willBeCompleted,
      completedAt: willBeCompleted ? now : undefined,
      updatedAt: now,
    };
    await saveTask(updatedTask);
    onTaskUpdate?.(updatedTask);

    // Create activity log for task completion/incompletion
    const activityLog: ActivityLog = {
      id: crypto.randomUUID(),
      taskId: task.id,
      type: willBeCompleted ? 'task_completed' : 'task_uncompleted',
      timestamp: now,
      isManualComment: false,
      createdAt: now,
    };
    await createActivityLog(activityLog);

    // Reload time stats and activity logs
    loadTimeStats();
    if (showActivity) {
      loadActivityLogs();
    }
  };

  const subtasks = (task.subtasks || []).filter((st) => !st.completed);
  const completedSubtasks = (task.subtasks || []).filter((st) => st.completed);
  const hasSubtasks = subtasks.length > 0 || completedSubtasks.length > 0;
  const totalCount = subtasks.length + completedSubtasks.length;
  const completedCount = completedSubtasks.length;
  const currentMarkerPosition = task.priorityMarkerRing || 0;
  const hasFocusSession =
    focusSession?.taskId === task.id && (!subtask || focusSession.subtaskId === subtask?.id);

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
                <div
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    focusSession.isActive ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {timer.formattedTime}
                </div>
                {!focusSession.isActive && <span className="text-xs text-gray-500">Paused</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
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
                  Subtasks{' '}
                  {hasSubtasks && (
                    <span className="text-gray-400">
                      ({completedCount}/{totalCount})
                    </span>
                  )}
                </label>
              </div>

              {/* Subtask list */}
              {hasSubtasks && (
                <div className="space-y-2">
                  {(task.subtasks || []).map((st, index) => {
                    const isEditing = editingSubtaskId === st.id;
                    const isCompleting = completingSubtaskIds.has(st.id);

                    // Find last priority item to show marker after it
                    let lastPriorityIndex = -1;
                    if (task.priorityMarkerEnabled && task.priorityMarkerOriginalIds) {
                      for (let i = task.subtasks!.length - 1; i >= 0; i--) {
                        if (task.priorityMarkerOriginalIds.includes(task.subtasks![i].id)) {
                          lastPriorityIndex = i;
                          break;
                        }
                      }
                    }
                    const showMarkerAfter =
                      task.priorityMarkerEnabled &&
                      index === lastPriorityIndex &&
                      currentMarkerPosition > 0;

                    return (
                      <div key={st.id}>
                        <div
                          className="flex items-center gap-2 group"
                          style={{
                            opacity: isCompleting ? 0 : st.completed ? 0.6 : 1,
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
                                className={`flex-1 text-left text-sm ${st.completed ? 'line-through text-gray-400' : 'text-gray-700 hover:text-gray-900'}`}
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
                                  const allSubtasks = task.subtasks || [];
                                  const newRing = Math.max(2, currentMarkerPosition - 1);
                                  // Use only ACTIVE subtasks to determine which are inside the belt
                                  const subtasksInsideBelt = subtasks
                                    .slice(0, newRing - 1)
                                    .map((s) => s.id);
                                  const updatedSubtasks = recalculateRadii(allSubtasks, newRing);
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
                                  const allSubtasks = task.subtasks || [];
                                  const newRing = Math.min(
                                    subtasks.length + 1,
                                    currentMarkerPosition + 1
                                  );
                                  // Use only ACTIVE subtasks to determine which are inside the belt
                                  const subtasksInsideBelt = subtasks
                                    .slice(0, newRing - 1)
                                    .map((s) => s.id);
                                  const updatedSubtasks = recalculateRadii(allSubtasks, newRing);
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
                      const subtasksInsideBelt = activeSubtasks.map((st) => st.id);
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
                  {task.priorityMarkerEnabled
                    ? 'Remove Priority Indicator'
                    : 'Add Priority Indicator'}
                </button>
              )}
            </div>
          )}

          {/* Activity */}
          <div className="space-y-3">
            <button
              onClick={() => setShowActivity(!showActivity)}
              className="flex items-center justify-between w-full text-sm text-gray-500 hover:text-gray-700"
            >
              <span>
                Activity{' '}
                {activityLogs.length > 0 && (
                  <span className="text-gray-400">({activityLogs.length})</span>
                )}
              </span>
              <span className="text-xs">{showActivity ? '▼' : '▶'}</span>
            </button>

            {showActivity && (
              <div className="space-y-3">
                {/* Add comment input - at top for intuitive flow */}
                {showAddComment ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddComment();
                        } else if (e.key === 'Escape') {
                          setNewComment('');
                          setShowAddComment(false);
                        }
                      }}
                      placeholder="Add a comment..."
                      autoFocus
                      className="flex-1 text-sm text-gray-900 bg-gray-100 rounded px-3 py-2 border-none outline-none"
                    />
                    <button
                      onClick={() => {
                        setNewComment('');
                        setShowAddComment(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddComment}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddComment(true)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    + Add comment
                  </button>
                )}

                {/* Activity list */}
                {loadingActivity ? (
                  <div className="text-sm text-gray-400 text-center py-4">Loading activity...</div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">No activity yet</div>
                ) : (
                  <div className="space-y-2">
                    {activityLogs.map((log) => {
                      const entry = formatActivityEntry(log);
                      const isEditing = editingCommentId === log.id;

                      return (
                        <div key={log.id} className="flex gap-2 text-sm group">
                          <span className="text-base flex-shrink-0">{entry.icon}</span>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              // Edit mode
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={editedComment}
                                  onChange={(e) => setEditedComment(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleEditComment(log);
                                    } else if (e.key === 'Escape') {
                                      setEditingCommentId(null);
                                      setEditedComment('');
                                    }
                                  }}
                                  autoFocus
                                  className="flex-1 text-sm text-gray-900 bg-gray-100 rounded px-2 py-1 border-none outline-none"
                                />
                                <button
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditedComment('');
                                  }}
                                  className="text-gray-400 hover:text-gray-600 text-xs"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleEditComment(log)}
                                  className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              // View mode
                              <>
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-gray-700 flex-1">{entry.text}</span>
                                  <div className="flex items-center gap-2">
                                    {/* Action menu for manual comments */}
                                    {log.isManualComment && (
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingCommentId(log.id);
                                            setEditedComment(log.comment || '');
                                          }}
                                          className="text-gray-400 hover:text-gray-600 text-xs"
                                          title="Edit comment"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(log.id)}
                                          className="text-gray-400 hover:text-red-600 text-xs"
                                          title="Delete comment"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                      {entry.timestamp}
                                    </span>
                                  </div>
                                </div>
                                {entry.hasSecondaryContent && entry.secondaryContent && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {entry.secondaryContent}
                                  </div>
                                )}
                                {log.editedAt && (
                                  <div className="text-xs text-gray-400 mt-1">(edited)</div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

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
                      <span>{formatDuration(Math.floor(timeStats.totalActiveTime))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sessions</span>
                      <span>{timeStats.sessionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Average Session</span>
                      <span>{formatDuration(Math.floor(timeStats.averageSessionLength))}</span>
                    </div>
                    {timeStats.lastWorkedOn && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Worked On</span>
                        <span>{new Date(timeStats.lastWorkedOn).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Subtask breakdown (only for parent task view) */}
                    {timeStats.subtaskBreakdown && timeStats.subtaskBreakdown.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Subtask Breakdown
                        </div>
                        <div className="space-y-2">
                          {timeStats.subtaskBreakdown.map((breakdown) => {
                            const subtaskData = task.subtasks?.find(
                              (st) => st.id === breakdown.subtaskId
                            );
                            const title =
                              subtaskData?.title || breakdown.subtaskTitle || 'Unknown subtask';
                            return (
                              <div
                                key={breakdown.subtaskId}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-600 truncate flex-1 pr-2">{title}</span>
                                <span className="text-gray-900 font-medium">
                                  {formatDuration(Math.floor(breakdown.totalTime))}
                                  <span className="text-gray-400 ml-1">
                                    ({breakdown.sessionCount})
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
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
          {subtask
            ? subtask.completed
              ? 'Mark Subtask Incomplete'
              : 'Complete Subtask'
            : task.completed
              ? 'Mark Task Incomplete'
              : 'Complete Task'}
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
