"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AppState,
  Task,
  Step,
  Message,
  ViewType,
  FocusModeState,
  SuggestedStep,
  EditSuggestion,
  DeletionSuggestion,
  StructureResponse,
  Project,
  createTask,
  createStep,
  createProject,
  createInitialAppState,
  createFocusQueueItem,
  generateId,
} from "@/lib/types";
import { loadState, saveState } from "@/lib/storage";
import {
  logTaskCreated,
  logTaskCompleted,
  logStepCompleted,
  logFocusStarted,
  logFocusEnded,
  countFocusSessionsToday,
  logQueueItemAdded,
} from "@/lib/events";
import {
  computeFocusScore,
  computeHealthStatus,
  computeComplexity,
  getTodayISO,
} from "@/lib/utils";
import { filterInbox, filterPool } from "@/lib/utils";
import { getTodayItems } from "@/lib/queue";
import Header from "@/components/layout/Header";
import AIDrawer from "@/components/AIDrawer";
import StagingArea from "@/components/StagingArea";
import InboxView from "@/components/inbox/InboxView";
import PoolView from "@/components/pool/PoolView";
import QueueView from "@/components/queue/QueueView";
import TaskDetail from "@/components/task-detail/TaskDetail";
import FocusModeView from "@/components/focus-mode/FocusModeView";
import TasksView from "@/components/tasks/TasksView";
import SearchView from "@/components/search/SearchView";
import ProjectsView from "@/components/projects/ProjectsView";
import ProjectModal from "@/components/shared/ProjectModal";
import ToastContainer, { Toast } from "@/components/shared/Toast";
import { usePWA } from "@/lib/usePWA";

// ============================================
// Initial States
// ============================================

const initialFocusModeState: FocusModeState = {
  active: false,
  queueItemId: null,
  taskId: null,
  currentStepId: null,
  paused: false,
  startTime: null,
  pausedTime: 0,
  pauseStartTime: null,
};

// ============================================
// Main Component
// ============================================

export default function Home() {
  const [state, setState] = useState<AppState>(createInitialAppState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previousView, setPreviousView] = useState<ViewType>('focus');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Register PWA service worker
  usePWA();

  // Get active task for current operations
  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId);

  // ============================================
  // State Persistence
  // ============================================

  // Load state from localStorage after hydration
  useEffect(() => {
    try {
      const loaded = loadState();

      // Handle focus mode restoration
      let focusMode = initialFocusModeState;
      if (loaded.focusMode?.active && loaded.focusMode?.paused) {
        focusMode = {
          active: true,
          queueItemId: loaded.focusMode.queueItemId,
          taskId: loaded.focusMode.taskId,
          currentStepId: loaded.focusMode.currentStepId,
          paused: true,
          startTime: loaded.focusMode.startTime,
          pausedTime: loaded.focusMode.pausedTime || 0,
          pauseStartTime: loaded.focusMode.pauseStartTime,
        };
      }

      // Determine current view - migrate old view names to new ones
      let currentView = loaded.currentView || 'focus';
      // Handle migration from old view names (cast to string for comparison)
      const viewStr = currentView as string;
      if (viewStr === 'queue') currentView = 'focus';
      if (viewStr === 'pool') currentView = 'tasks';
      if (focusMode.active) {
        currentView = 'focusMode';
      }

      setState({
        ...loaded,
        focusMode,
        currentView,
        aiDrawer: {
          ...loaded.aiDrawer,
          isOpen: loaded.tasks.length === 0 && !focusMode.active,
        },
      });
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }
    setHasHydrated(true);
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    if (hasHydrated) {
      saveState(state);
    }
  }, [state, hasHydrated]);

  // ============================================
  // Keyboard Shortcuts
  // ============================================

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape even in inputs
        if (e.key !== 'Escape') return;
      }

      // Handle shortcuts
      switch (e.key) {
        case 'n':
          // New task - focus on quick capture (if visible)
          e.preventDefault();
          const captureInput = document.querySelector<HTMLInputElement>('[data-capture-input]');
          if (captureInput) {
            captureInput.focus();
          }
          break;

        case 'f':
          // Go to Focus tab
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setState((prev) => ({
              ...prev,
              currentView: 'focus',
              activeTaskId: null,
            }));
          }
          break;

        case 't':
          // Go to Tasks tab
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setState((prev) => ({
              ...prev,
              currentView: 'tasks',
              activeTaskId: null,
            }));
          }
          break;

        case '/':
          // Focus search
          e.preventDefault();
          setState((prev) => ({
            ...prev,
            currentView: 'search',
            activeTaskId: null,
          }));
          // Focus search input after a short delay to let view render
          setTimeout(() => {
            const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
            if (searchInput) searchInput.focus();
          }, 50);
          break;

        case 'Escape':
          // Close AI drawer if open
          if (state.aiDrawer.isOpen) {
            setState((prev) => ({
              ...prev,
              aiDrawer: { ...prev.aiDrawer, isOpen: false },
            }));
          } else if (state.currentView === 'taskDetail' || state.currentView === 'focusMode') {
            // Go back to previous view
            setState((prev) => ({
              ...prev,
              currentView: previousView,
              activeTaskId: null,
            }));
          } else if (projectModalOpen) {
            setProjectModalOpen(false);
            setEditingProject(null);
          }
          break;

        case '?':
          // Show keyboard shortcuts help (optional - could add a modal later)
          if (e.shiftKey) {
            e.preventDefault();
            // Could show a help modal here
          }
          break;

        case 'a':
          // Toggle AI drawer
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setState((prev) => ({
              ...prev,
              aiDrawer: { ...prev.aiDrawer, isOpen: !prev.aiDrawer.isOpen },
            }));
          }
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.aiDrawer.isOpen, state.currentView, previousView, projectModalOpen]);

  // ============================================
  // Navigation
  // ============================================

  const handleViewChange = useCallback((view: ViewType) => {
    setState((prev) => ({
      ...prev,
      currentView: view,
      // Clear active task when navigating to main views
      activeTaskId: ['focus', 'tasks', 'inbox', 'search'].includes(view) ? null : prev.activeTaskId,
    }));
  }, []);

  const handleOpenTask = useCallback((taskId: string) => {
    // Save current view before navigating to task detail
    setPreviousView(state.currentView);
    setState((prev) => ({
      ...prev,
      currentView: 'taskDetail',
      activeTaskId: taskId,
    }));
  }, [state.currentView]);

  const handleBackToList = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentView: previousView,
      activeTaskId: null,
    }));
  }, [previousView]);

  // Navigate to search view
  const handleSearchFocus = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentView: 'search',
    }));
  }, []);

  // ============================================
  // Task CRUD Operations
  // ============================================

  const handleCreateTask = useCallback((title: string) => {
    // Save current view before navigating to task detail
    setPreviousView(state.currentView);
    const newTask = createTask(title);
    setState((prev) => {
      const newTasks = [...prev.tasks, newTask];
      logTaskCreated(newTask, newTasks);
      return {
        ...prev,
        tasks: newTasks,
        activeTaskId: newTask.id,
        currentView: 'taskDetail',
      };
    });
  }, [state.currentView]);

  // Create task and add to today's focus queue (for Focus view QuickCapture)
  const handleCreateTaskForFocus = useCallback((title: string) => {
    const newTask = createTask(title);
    // Update to pool status immediately since we're adding to queue
    newTask.status = 'pool';

    setState((prev) => {
      const newTasks = [...prev.tasks, newTask];
      logTaskCreated(newTask, newTasks);

      // Create queue item for today
      const newItem = createFocusQueueItem(newTask.id, 'today');
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const completedItems = prev.focusQueue.items.filter((i) => i.completed);

      // Insert at todayLineIndex position (end of today section), increment line
      const todaySection = activeItems.slice(0, prev.focusQueue.todayLineIndex);
      const laterSection = activeItems.slice(prev.focusQueue.todayLineIndex);
      const newItems = [...todaySection, { ...newItem, order: todaySection.length }, ...laterSection, ...completedItems];
      const newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;

      // Re-assign orders
      const reorderedItems = newItems.map((item, idx) => ({
        ...item,
        order: idx,
      }));

      return {
        ...prev,
        tasks: newTasks,
        focusQueue: {
          ...prev.focusQueue,
          items: reorderedItems,
          todayLineIndex: newTodayLineIndex,
        },
      };
    });
  }, []);

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? { ...t, ...updates, updatedAt: Date.now() }
          : t
      ),
    }));
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    let deletedTask: Task | undefined;
    setState((prev) => {
      deletedTask = prev.tasks.find((t) => t.id === taskId);
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, deletedAt: Date.now() }
            : t
        ),
        activeTaskId: prev.activeTaskId === taskId ? null : prev.activeTaskId,
        currentView: prev.activeTaskId === taskId ? 'focus' : prev.currentView,
      };
    });

    // Show toast with undo action
    if (deletedTask) {
      const taskTitle = deletedTask.title || 'Task';
      const toastId = generateId();
      setToasts((prev) => [...prev, {
        id: toastId,
        message: `"${taskTitle.slice(0, 30)}${taskTitle.length > 30 ? '...' : ''}" deleted`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            setState((prev) => ({
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, deletedAt: null }
                  : t
              ),
            }));
          },
        },
      }]);
    }
  }, []);

  // Send task to pool (triage complete)
  const handleSendToPool = useCallback((taskId: string) => {
    handleUpdateTask(taskId, { status: 'pool' });
  }, [handleUpdateTask]);

  // Defer task until a future date
  const handleDefer = useCallback((taskId: string, until: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'pool' as const,
              deferredUntil: until,
              deferredAt: Date.now(),
              deferredCount: t.deferredCount + 1,
              updatedAt: Date.now(),
            }
          : t
      ),
    }));
  }, []);

  // Park task (archive for later)
  const handlePark = useCallback((taskId: string) => {
    let parkedTask: Task | undefined;
    let previousStatus: Task['status'] | undefined;
    setState((prev) => {
      parkedTask = prev.tasks.find((t) => t.id === taskId);
      previousStatus = parkedTask?.status;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'archived' as const,
                archivedAt: Date.now(),
                archivedReason: 'parked' as const,
                updatedAt: Date.now(),
              }
            : t
        ),
        activeTaskId: prev.activeTaskId === taskId ? null : prev.activeTaskId,
        currentView: prev.activeTaskId === taskId ? 'focus' : prev.currentView,
      };
    });

    // Show toast with undo action
    if (parkedTask) {
      const taskTitle = parkedTask.title || 'Task';
      const toastId = generateId();
      setToasts((prev) => [...prev, {
        id: toastId,
        message: `"${taskTitle.slice(0, 30)}${taskTitle.length > 30 ? '...' : ''}" archived`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            setState((prev) => ({
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: previousStatus || 'pool',
                      archivedAt: null,
                      archivedReason: null,
                      updatedAt: Date.now(),
                    }
                  : t
              ),
            }));
          },
        },
      }]);
    }
  }, []);

  // Unarchive task (restore from archived)
  const handleUnarchive = useCallback((taskId: string) => {
    let unarchivedTask: Task | undefined;
    setState((prev) => {
      unarchivedTask = prev.tasks.find((t) => t.id === taskId);
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'pool' as const,
                archivedAt: null,
                archivedReason: null,
                updatedAt: Date.now(),
              }
            : t
        ),
      };
    });

    // Show toast
    if (unarchivedTask) {
      const taskTitle = unarchivedTask.title || 'Task';
      const toastId = generateId();
      setToasts((prev) => [...prev, {
        id: toastId,
        message: `"${taskTitle.slice(0, 30)}${taskTitle.length > 30 ? '...' : ''}" restored to Ready`,
        type: 'success',
      }]);
    }
  }, []);

  // ============================================
  // Project Handlers
  // ============================================

  const handleCreateProject = useCallback((name: string, color: string | null) => {
    const newProject = createProject(name, color ?? undefined);
    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
    setProjectModalOpen(false);
    setEditingProject(null);
  }, []);

  const handleUpdateProject = useCallback((projectId: string, name: string, color: string | null) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, name, color, updatedAt: Date.now() }
          : p
      ),
    }));
    setProjectModalOpen(false);
    setEditingProject(null);
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    // Capture project and affected tasks for undo
    let deletedProject: Project | undefined;
    let affectedTaskIds: string[] = [];

    setState((prev) => {
      deletedProject = prev.projects.find((p) => p.id === projectId);
      affectedTaskIds = prev.tasks
        .filter((t) => t.projectId === projectId)
        .map((t) => t.id);

      return {
        ...prev,
        projects: prev.projects.filter((p) => p.id !== projectId),
        // Also remove project from tasks that reference it
        tasks: prev.tasks.map((t) =>
          t.projectId === projectId
            ? { ...t, projectId: null, updatedAt: Date.now() }
            : t
        ),
      };
    });

    // Show toast with undo action
    if (deletedProject) {
      const projectName = deletedProject.name;
      const taskCount = affectedTaskIds.length;
      const toastId = generateId();
      setToasts((prev) => [...prev, {
        id: toastId,
        message: `"${projectName}" deleted${taskCount > 0 ? ` (${taskCount} task${taskCount > 1 ? 's' : ''} released)` : ''}`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            // Restore project and re-assign tasks
            setState((prev) => ({
              ...prev,
              projects: [...prev.projects, deletedProject!],
              tasks: prev.tasks.map((t) =>
                affectedTaskIds.includes(t.id)
                  ? { ...t, projectId: projectId, updatedAt: Date.now() }
                  : t
              ),
            }));
          },
        },
      }]);
    }

    setProjectModalOpen(false);
    setEditingProject(null);
  }, []);

  const handleOpenProjectModal = useCallback((project?: Project) => {
    setEditingProject(project || null);
    setProjectModalOpen(true);
  }, []);

  // ============================================
  // Toast Handlers
  // ============================================

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = generateId();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Add task to queue (new: position-based, not horizon-based)
  // If forToday=true, insert at position todayLineIndex (moves line down)
  // If forToday=false, insert just after the line
  const handleAddToQueue = useCallback((taskId: string, forToday: boolean = false) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      // Check if already in queue
      if (prev.focusQueue.items.some((i) => i.taskId === taskId)) {
        return prev;
      }

      // Ensure task is in pool
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId && t.status === 'inbox'
          ? { ...t, status: 'pool' as const, updatedAt: Date.now() }
          : t
      );

      const newItem = createFocusQueueItem(taskId, 'today'); // horizon kept for type compat

      // Determine insertion position and new todayLineIndex
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const completedItems = prev.focusQueue.items.filter((i) => i.completed);

      let newItems: typeof prev.focusQueue.items;
      let newTodayLineIndex: number;

      if (forToday) {
        // Insert at todayLineIndex position (end of today section), increment line
        const todaySection = activeItems.slice(0, prev.focusQueue.todayLineIndex);
        const laterSection = activeItems.slice(prev.focusQueue.todayLineIndex);
        newItems = [...todaySection, { ...newItem, order: todaySection.length }, ...laterSection, ...completedItems];
        newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;
      } else {
        // Insert just after the line (beginning of "on radar" section)
        const todaySection = activeItems.slice(0, prev.focusQueue.todayLineIndex);
        const laterSection = activeItems.slice(prev.focusQueue.todayLineIndex);
        newItems = [...todaySection, { ...newItem, order: todaySection.length }, ...laterSection, ...completedItems];
        newTodayLineIndex = prev.focusQueue.todayLineIndex; // line stays same
      }

      // Reindex orders
      newItems = newItems.map((item, idx) => ({ ...item, order: idx }));

      const updatedQueue = {
        ...prev.focusQueue,
        items: newItems,
        todayLineIndex: newTodayLineIndex,
      };

      logQueueItemAdded(newItem, task, updatedTasks);

      return {
        ...prev,
        tasks: updatedTasks,
        focusQueue: updatedQueue,
      };
    });
  }, []);

  // Remove item from queue (adjusts todayLineIndex if item was above line)
  const handleRemoveFromQueue = useCallback((queueItemId: string) => {
    setState((prev) => {
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const itemIndex = activeItems.findIndex((i) => i.id === queueItemId);

      // If item is above the line, decrement todayLineIndex
      const newTodayLineIndex = itemIndex !== -1 && itemIndex < prev.focusQueue.todayLineIndex
        ? prev.focusQueue.todayLineIndex - 1
        : prev.focusQueue.todayLineIndex;

      const newItems = prev.focusQueue.items
        .filter((i) => i.id !== queueItemId)
        .map((item, idx) => ({ ...item, order: idx }));

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: newItems,
          todayLineIndex: Math.max(0, newTodayLineIndex),
        },
      };
    });
  }, []);

  // Move queue item to a new position
  const handleMoveQueueItem = useCallback((queueItemId: string, newIndex: number) => {
    setState((prev) => {
      const activeItems = prev.focusQueue.items
        .filter((i) => !i.completed)
        .sort((a, b) => a.order - b.order);
      const completedItems = prev.focusQueue.items.filter((i) => i.completed);

      const currentIndex = activeItems.findIndex((i) => i.id === queueItemId);
      if (currentIndex === -1 || currentIndex === newIndex) return prev;

      // Remove item from current position
      const item = activeItems[currentIndex];
      const withoutItem = activeItems.filter((i) => i.id !== queueItemId);

      // Insert at new position
      const reordered = [
        ...withoutItem.slice(0, newIndex),
        item,
        ...withoutItem.slice(newIndex),
      ].map((i, idx) => ({ ...i, order: idx }));

      // Adjust todayLineIndex based on movement
      let newTodayLineIndex = prev.focusQueue.todayLineIndex;
      const wasAboveLine = currentIndex < prev.focusQueue.todayLineIndex;
      const nowAboveLine = newIndex < prev.focusQueue.todayLineIndex;

      if (wasAboveLine && !nowAboveLine) {
        // Moved from above to below the line
        newTodayLineIndex = Math.max(0, prev.focusQueue.todayLineIndex - 1);
      } else if (!wasAboveLine && nowAboveLine) {
        // Moved from below to above the line
        newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;
      }

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...reordered, ...completedItems],
          todayLineIndex: Math.min(newTodayLineIndex, reordered.length),
        },
      };
    });
  }, []);

  // Move queue item up (decrease index by 1)
  const handleMoveQueueItemUp = useCallback((queueItemId: string) => {
    setState((prev) => {
      const activeItems = prev.focusQueue.items
        .filter((i) => !i.completed)
        .sort((a, b) => a.order - b.order);
      const completedItems = prev.focusQueue.items.filter((i) => i.completed);
      const currentIndex = activeItems.findIndex((i) => i.id === queueItemId);
      if (currentIndex <= 0) return prev;

      const newIndex = currentIndex - 1;
      const item = activeItems[currentIndex];
      const withoutItem = activeItems.filter((i) => i.id !== queueItemId);
      const reordered = [
        ...withoutItem.slice(0, newIndex),
        item,
        ...withoutItem.slice(newIndex),
      ].map((i, idx) => ({ ...i, order: idx }));

      let newTodayLineIndex = prev.focusQueue.todayLineIndex;
      const wasAboveLine = currentIndex < prev.focusQueue.todayLineIndex;
      const nowAboveLine = newIndex < prev.focusQueue.todayLineIndex;
      if (wasAboveLine && !nowAboveLine) {
        newTodayLineIndex = Math.max(0, prev.focusQueue.todayLineIndex - 1);
      } else if (!wasAboveLine && nowAboveLine) {
        newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;
      }

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...reordered, ...completedItems],
          todayLineIndex: Math.min(newTodayLineIndex, reordered.length),
        },
      };
    });
  }, []);

  // Move queue item down (increase index by 1)
  const handleMoveQueueItemDown = useCallback((queueItemId: string) => {
    setState((prev) => {
      const activeItems = prev.focusQueue.items
        .filter((i) => !i.completed)
        .sort((a, b) => a.order - b.order);
      const completedItems = prev.focusQueue.items.filter((i) => i.completed);
      const currentIndex = activeItems.findIndex((i) => i.id === queueItemId);
      if (currentIndex === -1 || currentIndex >= activeItems.length - 1) return prev;

      const newIndex = currentIndex + 1;
      const item = activeItems[currentIndex];
      const withoutItem = activeItems.filter((i) => i.id !== queueItemId);
      const reordered = [
        ...withoutItem.slice(0, newIndex),
        item,
        ...withoutItem.slice(newIndex),
      ].map((i, idx) => ({ ...i, order: idx }));

      let newTodayLineIndex = prev.focusQueue.todayLineIndex;
      const wasAboveLine = currentIndex < prev.focusQueue.todayLineIndex;
      const nowAboveLine = newIndex < prev.focusQueue.todayLineIndex;
      if (wasAboveLine && !nowAboveLine) {
        newTodayLineIndex = Math.max(0, prev.focusQueue.todayLineIndex - 1);
      } else if (!wasAboveLine && nowAboveLine) {
        newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;
      }

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...reordered, ...completedItems],
          todayLineIndex: Math.min(newTodayLineIndex, reordered.length),
        },
      };
    });
  }, []);

  // Move the today line to a new position
  const handleMoveTodayLine = useCallback((newIndex: number) => {
    setState((prev) => {
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const maxIndex = activeItems.length;
      const clampedIndex = Math.max(0, Math.min(newIndex, maxIndex));

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          todayLineIndex: clampedIndex,
        },
      };
    });
  }, []);

  // Start focus session
  const handleStartFocus = useCallback((queueItemId: string) => {
    setState((prev) => {
      const queueItem = prev.focusQueue.items.find((i) => i.id === queueItemId);
      if (!queueItem) return prev;

      const task = prev.tasks.find((t) => t.id === queueItem.taskId);
      if (!task) return prev;

      // Find first incomplete step in scope
      const stepsInScope =
        queueItem.selectionType === 'entire_task'
          ? task.steps
          : task.steps.filter((s) => queueItem.selectedStepIds.includes(s.id));
      const firstIncomplete = stepsInScope.find((s) => !s.completed);

      // Always save current view for back navigation when exiting focus
      setPreviousView(prev.currentView);

      return {
        ...prev,
        currentView: 'focusMode' as const,
        activeTaskId: task.id,
        focusMode: {
          ...prev.focusMode,
          active: true,
          queueItemId,
          taskId: task.id,
          currentStepId: firstIncomplete?.id || null,
          startTime: Date.now(),
          paused: false,
          pausedTime: 0,
          pauseStartTime: null,
        },
      };
    });
  }, []);

  // Navigation helpers
  const handleGoToTasks = useCallback(() => {
    setState((prev) => ({ ...prev, currentView: 'tasks' as const }));
  }, []);

  const handleGoToInbox = useCallback(() => {
    setState((prev) => ({ ...prev, currentView: 'inbox' as const }));
  }, []);

  const handleBackToTasks = useCallback(() => {
    setState((prev) => ({ ...prev, currentView: 'tasks' as const }));
  }, []);

  const handleGoToProjects = useCallback(() => {
    setPreviousView(state.currentView);
    setState((prev) => ({ ...prev, currentView: 'projects' as const }));
  }, [state.currentView]);

  // Focus mode controls
  const handlePauseFocus = useCallback(() => {
    setState((prev) => ({
      ...prev,
      focusMode: {
        ...prev.focusMode,
        paused: true,
        pauseStartTime: Date.now(),
      },
    }));
  }, []);

  const handleResumeFocus = useCallback(() => {
    setState((prev) => {
      const pauseDuration = prev.focusMode.pauseStartTime
        ? Date.now() - prev.focusMode.pauseStartTime
        : 0;
      return {
        ...prev,
        focusMode: {
          ...prev.focusMode,
          paused: false,
          pausedTime: prev.focusMode.pausedTime + pauseDuration,
          pauseStartTime: null,
        },
      };
    });
  }, []);

  const handleStuck = useCallback(() => {
    // Open AI drawer for help
    setState((prev) => ({
      ...prev,
      aiDrawer: { ...prev.aiDrawer, isOpen: true },
    }));
  }, []);

  const handleExitFocus = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentView: previousView,
      focusMode: {
        active: false,
        queueItemId: null,
        taskId: null,
        currentStepId: null,
        paused: false,
        startTime: null,
        pausedTime: 0,
        pauseStartTime: null,
      },
    }));
  }, [previousView]);

  // ============================================
  // Step Operations
  // ============================================

  const handleStepComplete = useCallback((taskId: string, stepId: string, completed: boolean) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const updatedTasks = prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) =>
            s.id === stepId
              ? { ...s, completed, completedAt: completed ? Date.now() : null }
              : s
          ),
          updatedAt: Date.now(),
        };
      });

      if (completed) {
        logStepCompleted(taskId, stepId, updatedTasks);
      }

      const updatedTask = updatedTasks.find((t) => t.id === taskId);

      // Find next incomplete step for focus mode (triggers AI message collapse)
      let nextStepId = prev.focusMode.currentStepId;
      if (completed && prev.currentView === 'focusMode' && updatedTask) {
        const nextIncomplete = updatedTask.steps.find((s) => !s.completed);
        nextStepId = nextIncomplete?.id || null;
      }

      // Check if all steps are complete
      if (updatedTask && updatedTask.steps.length > 0 && updatedTask.steps.every((s) => s.completed)) {
        // Mark task as complete and exit focus mode if active
        const shouldExitFocus = prev.currentView === 'focusMode';
        return {
          ...prev,
          tasks: updatedTasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'complete' as const, completedAt: Date.now() }
              : t
          ),
          focusMode: shouldExitFocus
            ? { ...prev.focusMode, active: false, currentStepId: null }
            : { ...prev.focusMode, currentStepId: nextStepId },
          // Stay in focusMode view to show celebration, user clicks Done to exit
        };
      }

      return {
        ...prev,
        tasks: updatedTasks,
        focusMode: { ...prev.focusMode, currentStepId: nextStepId },
      };
    });
  }, []);

  const handleAddStep = useCallback((taskId: string, text: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const newStep = createStep(text, { source: 'manual' });
        return {
          ...t,
          steps: [...t.steps, newStep],
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleDeleteStep = useCallback((taskId: string, stepId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.filter((s) => s.id !== stepId),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleSubstepComplete = useCallback((taskId: string, stepId: string, substepId: string, completed: boolean) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) => {
            if (s.id !== stepId) return s;
            return {
              ...s,
              substeps: s.substeps.map((sub) =>
                sub.id === substepId
                  ? { ...sub, completed, completedAt: completed ? Date.now() : null }
                  : sub
              ),
            };
          }),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleUpdateStep = useCallback((taskId: string, stepId: string, text: string) => {
    if (!text.trim()) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) =>
            s.id === stepId ? { ...s, text: text.trim(), wasEdited: true } : s
          ),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleUpdateStepEstimate = useCallback((taskId: string, stepId: string, minutes: number | null) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) =>
            s.id === stepId ? { ...s, estimatedMinutes: minutes, estimateSource: 'user' as const } : s
          ),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleUpdateSubstep = useCallback((taskId: string, stepId: string, substepId: string, text: string) => {
    if (!text.trim()) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) => {
            if (s.id !== stepId) return s;
            return {
              ...s,
              substeps: s.substeps.map((sub) =>
                sub.id === substepId ? { ...sub, text: text.trim() } : sub
              ),
            };
          }),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleMoveStepUp = useCallback((taskId: string, stepId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const index = t.steps.findIndex((s) => s.id === stepId);
        if (index <= 0) return t;
        const newSteps = [...t.steps];
        [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
        return { ...t, steps: newSteps, updatedAt: Date.now() };
      }),
    }));
  }, []);

  const handleMoveStepDown = useCallback((taskId: string, stepId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const index = t.steps.findIndex((s) => s.id === stepId);
        if (index === -1 || index >= t.steps.length - 1) return t;
        const newSteps = [...t.steps];
        [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
        return { ...t, steps: newSteps, updatedAt: Date.now() };
      }),
    }));
  }, []);

  const handleAddSubstep = useCallback((taskId: string, stepId: string, text: string) => {
    if (!text.trim()) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) => {
            if (s.id !== stepId) return s;
            const newSubstep = {
              id: generateId(),
              text: text.trim(),
              shortLabel: null,
              completed: false,
              completedAt: null,
              skipped: false,
              source: 'manual' as const,
            };
            return { ...s, substeps: [...s.substeps, newSubstep] };
          }),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleDeleteSubstep = useCallback((taskId: string, stepId: string, substepId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) => {
            if (s.id !== stepId) return s;
            return { ...s, substeps: s.substeps.filter((sub) => sub.id !== substepId) };
          }),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleMoveSubstepUp = useCallback((taskId: string, stepId: string, substepId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) => {
            if (s.id !== stepId) return s;
            const index = s.substeps.findIndex((sub) => sub.id === substepId);
            if (index <= 0) return s;
            const newSubsteps = [...s.substeps];
            [newSubsteps[index - 1], newSubsteps[index]] = [newSubsteps[index], newSubsteps[index - 1]];
            return { ...s, substeps: newSubsteps };
          }),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleMoveSubstepDown = useCallback((taskId: string, stepId: string, substepId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) => {
            if (s.id !== stepId) return s;
            const index = s.substeps.findIndex((sub) => sub.id === substepId);
            if (index === -1 || index >= s.substeps.length - 1) return s;
            const newSubsteps = [...s.substeps];
            [newSubsteps[index], newSubsteps[index + 1]] = [newSubsteps[index + 1], newSubsteps[index]];
            return { ...s, substeps: newSubsteps };
          }),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  // ============================================
  // AI Integration
  // ============================================

  const handleToggleAIDrawer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      aiDrawer: { ...prev.aiDrawer, isOpen: !prev.aiDrawer.isOpen },
    }));
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    // Capture task ID and data BEFORE any async operations to avoid stale closure
    const taskId = state.activeTaskId;
    if (!taskId) return;

    const currentTask = state.tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    // Determine if in focus mode and get current step
    const inFocusMode = state.currentView === 'focusMode';
    const currentStepId = inFocusMode ? state.focusMode.currentStepId : undefined;
    const currentStep = inFocusMode && currentStepId
      ? currentTask.steps.find(s => s.id === currentStepId)
      : null;

    const newUserMessage: Message = {
      role: "user",
      content: message,
      timestamp: Date.now(),
      stepId: currentStepId || undefined,
    };

    // Add user message to appropriate message array based on mode
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              ...(inFocusMode
                ? { focusModeMessages: [...(t.focusModeMessages || []), newUserMessage] }
                : { messages: [...t.messages, newUserMessage] }),
              updatedAt: Date.now(),
            }
          : t
      ),
      aiDrawer: { ...prev.aiDrawer, isLoading: true },
    }));

    try {
      const response = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: message,
          currentList: currentTask.steps,
          taskTitle: currentTask.title,
          taskDescription: currentTask.description,
          taskNotes: currentTask.notes,
          conversationHistory: inFocusMode
            ? (currentTask.focusModeMessages || [])
            : currentTask.messages,
          // Focus mode context
          focusMode: inFocusMode,
          currentStep: currentStep ? {
            id: currentStep.id,
            text: currentStep.text,
            completed: currentStep.completed,
          } : null,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data: StructureResponse = await response.json();

      const aiMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        stepId: currentStepId || undefined,
      };

      // Handle different action types
      let suggestions: SuggestedStep[] = [];
      let pendingAction: 'replace' | 'suggest' | null = null;
      // Handle title from either taskTitle (replace) or suggestedTitle (suggest)
      let suggestedTitle: string | null = data.suggestedTitle || data.taskTitle || null;

      if (data.action === 'replace' && data.steps) {
        // Convert full Step objects to SuggestedStep format for staging
        pendingAction = 'replace';
        suggestions = data.steps.map((step: Step) => ({
          id: step.id,
          text: step.text,
          substeps: step.substeps.map((sub) => ({
            id: sub.id,
            text: sub.text,
          })),
          estimatedMinutes: step.estimatedMinutes || undefined,
        }));
      } else if (data.action === 'suggest' && data.suggestions) {
        pendingAction = 'suggest';
        suggestions = data.suggestions;
      }

      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                ...(inFocusMode
                  ? { focusModeMessages: [...(t.focusModeMessages || []), aiMessage] }
                  : { messages: [...t.messages, aiMessage] }),
                updatedAt: Date.now(),
              }
            : t
        ),
        aiDrawer: { ...prev.aiDrawer, isLoading: false },
        suggestions,
        pendingAction,
        edits: data.edits || [],
        deletions: data.deletions || [],
        suggestedTitle,
      }));
    } catch (error) {
      console.error("AI request failed:", error);
      setState((prev) => ({
        ...prev,
        aiDrawer: { ...prev.aiDrawer, isLoading: false },
        error: "Failed to get AI response",
      }));
    }
  }, [state.activeTaskId, state.tasks, state.currentView, state.focusMode.currentStepId]);

  // Auto-trigger AI breakdown request
  const handleAutoBreakdown = useCallback(async () => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find(t => t.id === state.activeTaskId);
    if (!task) return;

    // Open drawer first to show loading state
    setState(prev => ({
      ...prev,
      aiDrawer: { ...prev.aiDrawer, isOpen: true },
    }));

    // Generate contextual message
    const hasSteps = task.steps.length > 0;
    const message = hasSteps
      ? "Can you help me break down these steps further? Add substeps or additional steps as needed."
      : "Can you help me break this task down into concrete, actionable steps?";

    await handleSendMessage(message);
  }, [state.activeTaskId, state.tasks, handleSendMessage]);

  // Stuck helpers - auto-send specific requests
  const handleStuckBreakdown = useCallback(async () => {
    if (!state.focusMode.currentStepId || !activeTask) return;
    const currentStep = activeTask.steps.find(s => s.id === state.focusMode.currentStepId);
    if (!currentStep) return;

    setState(prev => ({ ...prev, aiDrawer: { ...prev.aiDrawer, isOpen: true } }));
    await handleSendMessage(`I'm stuck on this step: "${currentStep.text}". Can you break it down into smaller substeps?`);
  }, [state.focusMode.currentStepId, activeTask, handleSendMessage]);

  const handleStuckFirstStep = useCallback(async () => {
    if (!state.focusMode.currentStepId || !activeTask) return;
    const currentStep = activeTask.steps.find(s => s.id === state.focusMode.currentStepId);
    if (!currentStep) return;

    setState(prev => ({ ...prev, aiDrawer: { ...prev.aiDrawer, isOpen: true } }));
    await handleSendMessage(`I'm stuck on this step: "${currentStep.text}". What's the very first tiny action I should take to get started?`);
  }, [state.focusMode.currentStepId, activeTask, handleSendMessage]);

  const handleStuckExplain = useCallback(async () => {
    if (!state.focusMode.currentStepId || !activeTask) return;
    const currentStep = activeTask.steps.find(s => s.id === state.focusMode.currentStepId);
    if (!currentStep) return;

    setState(prev => ({ ...prev, aiDrawer: { ...prev.aiDrawer, isOpen: true } }));
    await handleSendMessage(`Can you explain what this step means in simple terms: "${currentStep.text}"? I'm not sure what I need to do.`);
  }, [state.focusMode.currentStepId, activeTask, handleSendMessage]);

  // ============================================
  // Staging Area Handlers
  // ============================================

  const handleAcceptSuggestion = useCallback((suggestion: SuggestedStep) => {
    if (!state.activeTaskId) return;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === state.activeTaskId);
      if (!task) return prev;

      // Check if this should be added as a substep to an existing step
      if (suggestion.parentStepId) {
        return {
          ...prev,
          tasks: prev.tasks.map((t) => {
            if (t.id !== state.activeTaskId) return t;
            return {
              ...t,
              steps: t.steps.map((s) =>
                s.id === suggestion.parentStepId
                  ? {
                      ...s,
                      substeps: [...s.substeps, {
                        id: suggestion.id,
                        text: suggestion.text,
                        shortLabel: null,
                        completed: false,
                        completedAt: null,
                        skipped: false,
                        source: 'ai_suggested' as const,
                      }],
                    }
                  : s
              ),
              updatedAt: Date.now(),
            };
          }),
          suggestions: prev.suggestions.filter((s) => s.id !== suggestion.id),
          // Clear pendingAction when last suggestion is accepted
          pendingAction: prev.suggestions.length <= 1 ? null : prev.pendingAction,
        };
      }

      // Otherwise add as new top-level step
      const newStep = createStep(suggestion.text, {
        id: suggestion.id,
        source: 'ai_suggested',
        estimatedMinutes: suggestion.estimatedMinutes || null,
        estimateSource: suggestion.estimatedMinutes ? 'ai' : null,
        substeps: suggestion.substeps.map((sub) => ({
          id: sub.id,
          text: sub.text,
          shortLabel: null,
          completed: false,
          completedAt: null,
          skipped: false,
          source: 'ai_suggested' as const,
        })),
      });

      // Determine insertion position based on insertAfterStepId
      const insertAfter = suggestion.insertAfterStepId;
      let newSteps: Step[];

      if (insertAfter === '0') {
        // Insert at beginning
        newSteps = [newStep, ...task.steps];
      } else if (insertAfter) {
        // Insert after the specified step
        const insertIndex = task.steps.findIndex((s) => s.id === insertAfter);
        if (insertIndex >= 0) {
          newSteps = [
            ...task.steps.slice(0, insertIndex + 1),
            newStep,
            ...task.steps.slice(insertIndex + 1),
          ];
        } else {
          // Fallback to append if step not found
          newSteps = [...task.steps, newStep];
        }
      } else {
        // Default: append at end
        newSteps = [...task.steps, newStep];
      }

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === state.activeTaskId
            ? { ...t, steps: newSteps, updatedAt: Date.now() }
            : t
        ),
        suggestions: prev.suggestions.filter((s) => s.id !== suggestion.id),
        // Clear pendingAction when last suggestion is accepted
        pendingAction: prev.suggestions.length <= 1 ? null : prev.pendingAction,
      };
    });
  }, [state.activeTaskId]);

  const handleRejectSuggestion = useCallback((suggestionId: string) => {
    setState((prev) => ({
      ...prev,
      suggestions: prev.suggestions.filter((s) => s.id !== suggestionId),
      // Clear pendingAction when last suggestion is rejected
      pendingAction: prev.suggestions.length <= 1 ? null : prev.pendingAction,
    }));
  }, []);

  const handleAcceptEdit = useCallback((edit: EditSuggestion) => {
    if (!state.activeTaskId) return;

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== state.activeTaskId) return t;

        if (edit.targetType === 'step') {
          return {
            ...t,
            steps: t.steps.map((s) =>
              s.id === edit.targetId
                ? { ...s, text: edit.newText, wasEdited: true }
                : s
            ),
            updatedAt: Date.now(),
          };
        } else {
          // Substep edit
          return {
            ...t,
            steps: t.steps.map((s) =>
              s.id === edit.parentId
                ? {
                    ...s,
                    substeps: s.substeps.map((sub) =>
                      sub.id === edit.targetId
                        ? { ...sub, text: edit.newText }
                        : sub
                    ),
                  }
                : s
            ),
            updatedAt: Date.now(),
          };
        }
      }),
      edits: prev.edits.filter((e) => e.targetId !== edit.targetId),
    }));
  }, [state.activeTaskId]);

  const handleRejectEdit = useCallback((edit: EditSuggestion) => {
    setState((prev) => ({
      ...prev,
      edits: prev.edits.filter((e) => e.targetId !== edit.targetId),
    }));
  }, []);

  const handleAcceptDeletion = useCallback((deletion: DeletionSuggestion) => {
    if (!state.activeTaskId) return;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === state.activeTaskId);
      if (!task) return prev;

      let newSteps: Step[];

      if (deletion.targetType === 'step') {
        // Parse the display ID to get step index (1-based)
        const stepIndex = parseInt(deletion.targetId, 10) - 1;
        if (stepIndex >= 0 && stepIndex < task.steps.length) {
          newSteps = task.steps.filter((_, idx) => idx !== stepIndex);
        } else {
          // Fallback: try matching by UUID (shouldn't happen but just in case)
          newSteps = task.steps.filter((s) => s.id !== deletion.targetId);
        }
      } else {
        // Parse substep ID like "1a", "2b" -> parentIndex=0/1, substepLetter='a'/'b'
        const match = deletion.targetId.match(/^(\d+)([a-z])$/);
        if (match) {
          const parentIndex = parseInt(match[1], 10) - 1;
          const substepLetter = match[2];
          const substepIndex = substepLetter.charCodeAt(0) - 'a'.charCodeAt(0);

          newSteps = task.steps.map((s, sIdx) => {
            if (sIdx === parentIndex && substepIndex >= 0 && substepIndex < s.substeps.length) {
              return { ...s, substeps: s.substeps.filter((_, subIdx) => subIdx !== substepIndex) };
            }
            return s;
          });
        } else {
          // Fallback: try matching by parentId display index
          const parentIndex = deletion.parentId ? parseInt(deletion.parentId, 10) - 1 : -1;
          newSteps = task.steps.map((s, sIdx) =>
            sIdx === parentIndex
              ? { ...s, substeps: s.substeps.filter((sub) => sub.id !== deletion.targetId) }
              : s
          );
        }
      }

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === state.activeTaskId
            ? { ...t, steps: newSteps, updatedAt: Date.now() }
            : t
        ),
        deletions: prev.deletions.filter((d) => d.targetId !== deletion.targetId),
      };
    });
  }, [state.activeTaskId]);

  const handleRejectDeletion = useCallback((deletion: DeletionSuggestion) => {
    setState((prev) => ({
      ...prev,
      deletions: prev.deletions.filter((d) => d.targetId !== deletion.targetId),
    }));
  }, []);

  const handleAcceptTitle = useCallback(() => {
    if (!state.activeTaskId || !state.suggestedTitle) return;

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === state.activeTaskId
          ? { ...t, title: state.suggestedTitle!, updatedAt: Date.now() }
          : t
      ),
      suggestedTitle: null,
    }));
  }, [state.activeTaskId, state.suggestedTitle]);

  const handleRejectTitle = useCallback(() => {
    setState((prev) => ({ ...prev, suggestedTitle: null }));
  }, []);

  const handleAcceptAll = useCallback(() => {
    if (!state.activeTaskId) return;

    // Accept title if suggested
    if (state.suggestedTitle) {
      handleAcceptTitle();
    }

    // Handle based on action type
    if (state.pendingAction === 'replace') {
      // Replace all steps with the suggestions
      const newSteps: Step[] = state.suggestions.map((suggestion) =>
        createStep(suggestion.text, {
          id: suggestion.id,
          source: 'ai_generated',
          estimatedMinutes: suggestion.estimatedMinutes || null,
          estimateSource: suggestion.estimatedMinutes ? 'ai' : null,
          substeps: suggestion.substeps.map((sub) => ({
            id: sub.id,
            text: sub.text,
            shortLabel: null,
            completed: false,
            completedAt: null,
            skipped: false,
            source: 'ai_generated' as const,
          })),
        })
      );

      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === state.activeTaskId
            ? {
                ...t,
                steps: newSteps,
                completionType: 'step_based',
                aiAssisted: true,
                updatedAt: Date.now(),
              }
            : t
        ),
        suggestions: [],
        pendingAction: null,
      }));
    } else {
      // Normal suggest flow - add steps one by one
      state.suggestions.forEach((suggestion) => {
        handleAcceptSuggestion(suggestion);
      });
    }

    // Accept all edits
    state.edits.forEach((edit) => {
      handleAcceptEdit(edit);
    });

    // Accept all deletions
    state.deletions.forEach((deletion) => {
      handleAcceptDeletion(deletion);
    });
  }, [state.activeTaskId, state.suggestedTitle, state.suggestions, state.edits, state.deletions, state.pendingAction, handleAcceptTitle, handleAcceptSuggestion, handleAcceptEdit, handleAcceptDeletion]);

  const handleDismiss = useCallback(() => {
    setState((prev) => ({
      ...prev,
      suggestions: [],
      edits: [],
      deletions: [],
      suggestedTitle: null,
      pendingAction: null,
    }));
  }, []);

  // ============================================
  // Computed Values
  // ============================================

  const inboxTasks = filterInbox(state.tasks);
  const poolTasks = filterPool(state.tasks);
  const queueItems = getTodayItems(state.focusQueue);

  const counts = {
    inbox: inboxTasks.length,
    pool: poolTasks.length,
    queue: queueItems.length,
  };

  // ============================================
  // Render
  // ============================================

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-zinc-900">
      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Header */}
        <Header
          currentView={state.currentView}
          previousView={previousView}
          onViewChange={handleViewChange}
          onToggleAI={handleToggleAIDrawer}
          isAIDrawerOpen={state.aiDrawer.isOpen}
          inboxCount={inboxTasks.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={handleSearchFocus}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile: pb-48 clears floating AI bar + gives room for dropdowns; when AI open pb-[52vh] for bottom sheet */}
          <div className={`max-w-4xl mx-auto px-4 py-6 ${state.aiDrawer.isOpen ? 'lg:pb-6 pb-[52vh]' : 'pb-48 lg:pb-6'}`}>
            {/* View Router */}
            {state.currentView === 'focus' && (
              <QueueView
                queue={state.focusQueue}
                tasks={state.tasks}
                projects={state.projects}
                inboxCount={inboxTasks.length}
                onOpenTask={handleOpenTask}
                onCreateTask={handleCreateTaskForFocus}
                onStartFocus={handleStartFocus}
                onRemoveFromQueue={handleRemoveFromQueue}
                onMoveItem={handleMoveQueueItem}
                onMoveItemUp={handleMoveQueueItemUp}
                onMoveItemDown={handleMoveQueueItemDown}
                onMoveTodayLine={handleMoveTodayLine}
                onGoToInbox={handleGoToInbox}
              />
            )}

            {state.currentView === 'tasks' && (
              <TasksView
                inboxTasks={inboxTasks}
                poolTasks={poolTasks}
                queue={state.focusQueue}
                projects={state.projects}
                onCreateTask={handleCreateTask}
                onOpenTask={handleOpenTask}
                onSendToPool={handleSendToPool}
                onAddToQueue={handleAddToQueue}
                onDefer={handleDefer}
                onPark={handlePark}
                onDelete={handleDeleteTask}
                onGoToInbox={handleGoToInbox}
                onOpenAIDrawer={handleToggleAIDrawer}
                onOpenProjectModal={handleOpenProjectModal}
              />
            )}

            {state.currentView === 'inbox' && (
              <InboxView
                tasks={inboxTasks}
                onBack={handleBackToTasks}
                onCreateTask={handleCreateTask}
                onOpenTask={handleOpenTask}
                onSendToPool={handleSendToPool}
                onAddToQueue={handleAddToQueue}
                onDefer={handleDefer}
                onPark={handlePark}
                onDelete={handleDeleteTask}
              />
            )}

            {state.currentView === 'search' && (
              <SearchView
                query={searchQuery}
                onQueryChange={setSearchQuery}
                tasks={state.tasks}
                onOpenTask={handleOpenTask}
                onNavigateToProjects={handleGoToProjects}
              />
            )}

            {state.currentView === 'projects' && (
              <ProjectsView
                tasks={state.tasks}
                projects={state.projects}
                queue={state.focusQueue}
                onBack={handleBackToList}
                onOpenTask={handleOpenTask}
                onOpenProjectModal={handleOpenProjectModal}
                onAddToQueue={handleAddToQueue}
              />
            )}

            {state.currentView === 'taskDetail' && activeTask && (
              <TaskDetail
                task={activeTask}
                queue={state.focusQueue}
                projects={state.projects}
                suggestions={state.suggestions}
                edits={state.edits}
                deletions={state.deletions}
                suggestedTitle={state.suggestedTitle}
                onBack={handleBackToList}
                onUpdateTask={handleUpdateTask}
                onStepComplete={handleStepComplete}
                onSubstepComplete={handleSubstepComplete}
                onUpdateStep={handleUpdateStep}
                onUpdateStepEstimate={handleUpdateStepEstimate}
                onUpdateSubstep={handleUpdateSubstep}
                onAddStep={handleAddStep}
                onDeleteStep={handleDeleteStep}
                onMoveStepUp={handleMoveStepUp}
                onMoveStepDown={handleMoveStepDown}
                onAddSubstep={handleAddSubstep}
                onDeleteSubstep={handleDeleteSubstep}
                onMoveSubstepUp={handleMoveSubstepUp}
                onMoveSubstepDown={handleMoveSubstepDown}
                onAddToQueue={handleAddToQueue}
                onSendToPool={handleSendToPool}
                onDefer={handleDefer}
                onPark={handlePark}
                onUnarchive={handleUnarchive}
                onDeleteTask={handleDeleteTask}
                onStartFocus={handleStartFocus}
                onOpenAIDrawer={handleToggleAIDrawer}
                onAIBreakdown={handleAutoBreakdown}
                onAcceptOne={handleAcceptSuggestion}
                onAcceptAll={handleAcceptAll}
                onDismiss={handleDismiss}
                onAcceptEdit={handleAcceptEdit}
                onRejectEdit={handleRejectEdit}
                onAcceptDeletion={handleAcceptDeletion}
                onRejectDeletion={handleRejectDeletion}
                onAcceptTitle={handleAcceptTitle}
                onRejectTitle={handleRejectTitle}
                onOpenProjectModal={handleOpenProjectModal}
              />
            )}

            {state.currentView === 'focusMode' && activeTask && (
              <FocusModeView
                task={activeTask}
                queueItem={state.focusQueue.items.find((i) => i.id === state.focusMode.queueItemId) || null}
                focusState={state.focusMode}
                onStepComplete={handleStepComplete}
                onSubstepComplete={handleSubstepComplete}
                onUpdateStep={handleUpdateStep}
                onUpdateSubstep={handleUpdateSubstep}
                onUpdateTask={handleUpdateTask}
                onDeleteSubstep={handleDeleteSubstep}
                onMoveSubstepUp={handleMoveSubstepUp}
                onMoveSubstepDown={handleMoveSubstepDown}
                onStuck={handleStuck}
                onStuckBreakdown={handleStuckBreakdown}
                onStuckFirstStep={handleStuckFirstStep}
                onStuckExplain={handleStuckExplain}
                onPause={handlePauseFocus}
                onResume={handleResumeFocus}
                onExit={handleExitFocus}
                onOpenAIDrawer={handleToggleAIDrawer}
                suggestions={state.suggestions}
                edits={state.edits}
                deletions={state.deletions}
                suggestedTitle={state.suggestedTitle}
                onAcceptOne={handleAcceptSuggestion}
                onAcceptAll={handleAcceptAll}
                onDismiss={handleDismiss}
                onAcceptEdit={handleAcceptEdit}
                onRejectEdit={handleRejectEdit}
                onAcceptDeletion={handleAcceptDeletion}
                onRejectDeletion={handleRejectDeletion}
                onAcceptTitle={handleAcceptTitle}
                onRejectTitle={handleRejectTitle}
              />
            )}
          </div>
        </main>
      </div>

      {/* AI Column - Side-by-side, full height */}
      <AIDrawer
        isOpen={state.aiDrawer.isOpen}
        messages={state.currentView === 'focusMode'
          ? activeTask?.focusModeMessages || []
          : activeTask?.messages || []}
        isLoading={state.aiDrawer.isLoading}
        onToggle={handleToggleAIDrawer}
        onSendMessage={handleSendMessage}
        variant={state.currentView === 'focusMode' ? 'focus' : 'planning'}
        currentStepId={state.focusMode.currentStepId}
        steps={activeTask?.steps}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={projectModalOpen}
        project={editingProject}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={(name, color) => {
          if (editingProject) {
            handleUpdateProject(editingProject.id, name, color);
          } else {
            handleCreateProject(name, color);
          }
        }}
        onDelete={handleDeleteProject}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

