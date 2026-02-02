"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppState,
  Task,
  Step,
  Message,
  QueueMessage,
  ViewType,
  DrawerType,
  FocusModeState,
  FocusQueueItem,
  SuggestedStep,
  EditSuggestion,
  DeletionSuggestion,
  MetadataSuggestion,
  StagingState,
  StructureResponse,
  Project,
  AITargetContext,
  EnergyLevel,
  ImportanceLevel,
  EnergyType,
  TaskFilters,
  createTask,
  createStep,
  createProject,
  createInitialAppState,
  createFocusQueueItem,
  generateId,
} from "@/lib/types";
import { loadState, loadStateAsync, saveState, exportData, importData, loadNotifications, loadNotificationsAsync, saveNotifications } from "@/lib/storage";
import { Notification, ActiveAlert } from "@/lib/notification-types";
import {
  getUnacknowledgedCount,
  markNotificationAcknowledged,
  getReadyToFire,
  markNotificationFired,
  getAnyActiveStartPoke,
  snoozeNotification,
  cancelNotificationsForCompletedTask,
  getAllActiveAlerts,
  scheduleStartPoke,
  cancelStartPoke,
  removeNotificationsForTask,
  rescanAllTasksForPokes,
} from "@/lib/notification-utils";
import { StartPokeSettings } from "@/lib/notification-types";
import { getStartPokeStatus } from "@/lib/start-poke-utils";
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
import { filterInbox, filterPool, resolveDisplayIdToUUID } from "@/lib/utils";
import { getTodayItems, getStepsInScope, isQueueItemStale } from "@/lib/queue";
import {
  markInstanceComplete,
  skipInstance,
  markInstanceIncomplete,
  getTodayISO as getRecurringTodayISO,
  ensureInstance,
  createInstance,
  cloneSteps,
  isInstanceComplete,
  getActiveOccurrenceDate,
  updateTaskMetadataAfterCompletion,
  updateRecurringInstanceMeta,
  calculateStreak,
  describePattern,
} from "@/lib/recurring-utils";
import * as stepUtils from "@/lib/step-utils";
import { RecurrenceRuleExtended } from "@/lib/recurring-types";
import { getTaskPriorityInfo } from "@/lib/priority";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
// Old AIDrawer removed - functionality moved to minibar/palette
// import AIDrawer from "@/components/AIDrawer";
import StagingArea from "@/components/StagingArea";
import InboxView from "@/components/inbox/InboxView";
import PoolView from "@/components/pool/PoolView";
import QueueView from "@/components/queue/QueueView";
import CompletedDrawer from "@/components/queue/CompletedDrawer";
import TaskDetail from "@/components/task-detail/TaskDetail";
import FocusModeView from "@/components/focus-mode/FocusModeView";
import TasksView from "@/components/tasks/TasksView";
import SearchView from "@/components/search/SearchView";
import ProjectsView from "@/components/projects/ProjectsView";
import ProjectModal from "@/components/shared/ProjectModal";
import DatePickerModal from "@/components/shared/DatePickerModal";
import FilterDrawer from "@/components/shared/FilterDrawer";
import FocusSelectionModal from "@/components/shared/FocusSelectionModal";
import ToastContainer, { Toast } from "@/components/shared/Toast";
import NotificationsHub from "@/components/notifications/NotificationsHub";
import NotificationSettings from "@/components/notifications/NotificationSettings";
import { usePWA } from "@/lib/usePWA";
import { AIAssistantOverlay, AIDrawer as AIAssistantDrawer } from "@/components/ai-assistant";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useContextualPrompts, PromptContext, PromptHandlers } from "@/hooks/useContextualPrompts";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { AIAssistantContext, AIResponse, AISubmitResult, SuggestionsContent, CollapsedContent, RecommendationContent } from "@/lib/ai-types";
import { structureToAIResponse, getPendingActionType } from "@/lib/ai-adapter";
import { categorizeResponse, buildSuggestionsReadyMessage } from "@/lib/ai-response-types";
import { resolveStatus, buildStatusContext } from "@/lib/ai-status-rules";
import { initializeReminders, initializeStartPokes, scheduleStartPokePWA, cancelStartPokePWA, cancelReminder, supportsNotifications, getNotificationPermission } from "@/lib/notifications";
import NotificationPermissionBanner from "@/components/shared/NotificationPermissionBanner";

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
  const [datePickerModalOpen, setDatePickerModalOpen] = useState(false);
  const [pendingDateCallback, setPendingDateCallback] = useState<((dateStr: string) => void) | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stagingIsNewArrival, setStagingIsNewArrival] = useState(false);
  const [paletteManuallyOpened, setPaletteManuallyOpened] = useState(false);
  // Track relationship between staging and palette content
  const [stagingPopulatedAt, setStagingPopulatedAt] = useState<number>(0);
  const [lastQuerySubmittedAt, setLastQuerySubmittedAt] = useState<number>(0);
  const stagingAreaRef = useRef<HTMLDivElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  // Recommendation state (for "What should I do?" feature)
  // Note: Recommendation response is now stored in aiAssistant.state.response
  const [excludedTaskIds, setExcludedTaskIds] = useState<string[]>([]);

  // Inline AI actions - tracks which step/task is targeted
  const [aiTargetContext, setAITargetContext] = useState<AITargetContext | null>(null);

  // Sidebar state (nav restructure)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [taskCreationOpen, setTaskCreationOpen] = useState(false);
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);

  // Centralized drawer state - only one drawer can be open at a time
  // This enables push behavior (content pushes left) and prevents overlapping drawers
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

  // Derived state for backwards compatibility
  const completedDrawerOpen = activeDrawer === 'completed';

  // Alert cycling state (for pokes and reminders)
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  // Keyboard visibility detection (for hiding minibar when keyboard is open)
  const isKeyboardVisible = useKeyboardVisible();

  // Search state (simplified - sidebar mode swaps based on focus/query)
  const [searchInputFocused, setSearchInputFocused] = useState(false);
  // Recent tasks (for search empty state)
  const [recentTaskIds, setRecentTaskIds] = useState<string[]>([]);
  // Frozen recents - snapshot when search starts, prevents reordering during search session
  const [frozenRecentTaskIds, setFrozenRecentTaskIds] = useState<string[] | null>(null);
  // Pending filter (for navigation from search shortcuts to TasksView)
  const [pendingFilter, setPendingFilter] = useState<string | null>(null);
  // Track active tab in TasksView for back navigation
  const [activeTasksTab, setActiveTasksTab] = useState<'staging' | 'routines' | 'on_hold' | 'done'>('staging');
  // TasksView filter state (lifted from TasksView for root-level FilterDrawer)
  const [tasksFilters, setTasksFilters] = useState<TaskFilters>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem('task-copilot-filters');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [tasksFilterMatchCount, setTasksFilterMatchCount] = useState(0);
  // FocusSelectionModal state (lifted for root-level rendering)
  const [editingFocusQueueItemId, setEditingFocusQueueItemId] = useState<string | null>(null);

  // Ref for main content scroll-to-top on tab re-tap
  const mainRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Stale queue item nudge state (session-level)
  const [dismissedStaleIds, setDismissedStaleIds] = useState<Set<string>>(new Set());
  const [staleIndex, setStaleIndex] = useState(0);

  // Old inbox item nudge state (session-level, Tasks view)
  const [dismissedOldInboxIds, setDismissedOldInboxIds] = useState<Set<string>>(new Set());
  const [oldInboxIndex, setOldInboxIndex] = useState(0);

  // Callback for auto-selecting new project after creation (from TaskCreationPopover)
  const [pendingProjectCallback, setPendingProjectCallback] = useState<((projectId: string) => void) | null>(null);

  // Notification permission banner state
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // Register PWA service worker
  usePWA();

  // Get active task for current operations
  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId);

  // ============================================
  // Staging Helpers (context-aware)
  // ============================================

  // Get staging based on context - per-task if activeTaskId, global otherwise
  const getActiveStaging = useCallback((): StagingState | null => {
    if (state.activeTaskId) {
      const task = state.tasks.find(t => t.id === state.activeTaskId);
      return task?.staging || null;
    }
    return state.globalStaging;
  }, [state.activeTaskId, state.tasks, state.globalStaging]);

  // Update staging based on context - updates task.staging or globalStaging
  const updateActiveStaging = useCallback((
    updater: (staging: StagingState | null) => StagingState | null
  ) => {
    setState(prev => {
      if (prev.activeTaskId) {
        return {
          ...prev,
          tasks: prev.tasks.map(t =>
            t.id === prev.activeTaskId
              ? { ...t, staging: updater(t.staging), updatedAt: Date.now() }
              : t
          ),
        };
      }
      return { ...prev, globalStaging: updater(prev.globalStaging) };
    });
  }, []);

  // Clear all staging (used by dismiss)
  const clearActiveStaging = useCallback(() => {
    updateActiveStaging(() => null);
  }, [updateActiveStaging]);

  // ============================================
  // Notification Scheduling Helpers
  // ============================================

  // Build StartPokeSettings from UserSettings
  const getPokeSettings = useCallback((): StartPokeSettings => ({
    startPokeEnabled: state.userSettings.startPokeEnabled,
    startPokeDefault: state.userSettings.startPokeDefault,
    startPokeBufferMinutes: state.userSettings.startPokeBufferMinutes,
    startPokeBufferPercentage: state.userSettings.startPokeBufferPercentage,
  }), [state.userSettings]);

  // Schedule or reschedule a start poke notification for a task
  const scheduleNotificationForTask = useCallback((task: Task) => {
    const settings = getPokeSettings();

    setNotifications((prev) => {
      const { notifications: updated, created } = scheduleStartPoke(task, settings, prev);

      // If a notification was created, also schedule PWA notification
      if (created) {
        scheduleStartPokePWA(task, state.userSettings, created.id);
      }

      return updated;
    });
  }, [getPokeSettings, state.userSettings]);

  // Cancel all notifications for a task (when deleted or completed)
  const cancelNotificationForTask = useCallback((taskId: string) => {
    // Cancel in-app notification
    setNotifications((prev) => removeNotificationsForTask(taskId, prev));

    // Cancel PWA notification
    cancelStartPokePWA(taskId);

    // Cancel user-set reminders
    cancelReminder(taskId);
  }, []);

  // Helper to map current view to AI context
  const getAIContext = (): AIAssistantContext => {
    switch (state.currentView) {
      case 'focus': return 'queue';
      case 'focusMode': return 'focusMode';
      case 'taskDetail': return 'taskDetail';
      case 'inbox': return 'inbox';
      case 'tasks': return 'inbox';
      case 'search': return 'search';
      default: return 'global';
    }
  };

  // Helper to get contextual idle content for MiniBar (using Rules Registry)
  const getIdleContent = (): CollapsedContent => {
    const context = getAIContext();
    const statusContext = buildStatusContext(state, activeTask ?? null, state.focusMode.startTime);
    return resolveStatus(context, statusContext);
  };

  // AI Assistant API handler - calls /api/structure
  const handleAIMinibarSubmit = useCallback(async (
    query: string,
    context: AIAssistantContext
  ): Promise<AISubmitResult> => {
    // Track when query was submitted for staging/palette relationship
    setLastQuerySubmittedAt(Date.now());

    const taskId = state.activeTaskId;
    const currentTask = taskId ? state.tasks.find((t) => t.id === taskId) : null;

    // Determine if in focus mode
    const inFocusMode = state.currentView === 'focusMode';
    const currentStepId = inFocusMode ? state.focusMode.currentStepId : undefined;
    const currentStep = inFocusMode && currentStepId && currentTask
      ? currentTask.steps.find(s => s.id === currentStepId)
      : null;

    // Build view-specific context for queue and tasks views
    let viewContext: Record<string, unknown> = {};

    if (state.currentView === 'focus' && !taskId) {
      // Focus Queue view (no active task) - pass queue items for context
      const todayLineIndex = state.focusQueue.todayLineIndex;
      const activeItems = state.focusQueue.items
        .filter(i => !i.completed)
        .sort((a, b) => a.order - b.order);
      const todayItemsData = activeItems.slice(0, todayLineIndex);
      const upcomingItemsData = activeItems.slice(todayLineIndex);

      const todayItems = todayItemsData.map(item => {
        const task = state.tasks.find(t => t.id === item.taskId);
        return {
          taskId: item.taskId,
          taskTitle: task?.title || "Untitled",
          priority: task?.priority || null,
          targetDate: task?.targetDate || null,
          deadlineDate: task?.deadlineDate || null,
          completedSteps: task?.steps.filter(s => s.completed).length || 0,
          totalSteps: task?.steps.length || 0,
          effort: task?.effort || null,
          focusScore: task ? computeFocusScore(task) : 0,
        };
      });

      const upcomingItems = upcomingItemsData.map(item => {
        const task = state.tasks.find(t => t.id === item.taskId);
        return {
          taskId: item.taskId,
          taskTitle: task?.title || "Untitled",
          priority: task?.priority || null,
          targetDate: task?.targetDate || null,
          deadlineDate: task?.deadlineDate || null,
          focusScore: task ? computeFocusScore(task) : 0,
        };
      });

      viewContext = {
        queueMode: true,
        queueContext: { todayItems, upcomingItems },
      };
    } else if (state.currentView === 'tasks' && !taskId) {
      // Tasks view (no active task) - pass inbox + pool for context
      const inboxTasks = filterInbox(state.tasks);
      const poolTasks = filterPool(state.tasks);

      // Get queue task IDs to filter them out of ready tasks
      const queueTaskIds = new Set(state.focusQueue.items.map(i => i.taskId));

      const triageItems = inboxTasks.map(t => ({
        taskId: t.id,
        taskTitle: t.title,
        createdAt: t.createdAt,
      }));

      // Filter out tasks that are already in Focus Queue (consistent with TasksView display)
      const readyTasks = poolTasks
        .filter(t => !queueTaskIds.has(t.id))
        .map(t => ({
          taskId: t.id,
          taskTitle: t.title,
          priority: t.priority || null,
          targetDate: t.targetDate || null,
          deadlineDate: t.deadlineDate || null,
          effort: t.effort || null,
          stepsCount: t.steps.length,
          completedSteps: t.steps.filter(s => s.completed).length,
          focusScore: computeFocusScore(t),
          waitingOn: t.waitingOn ? true : null,
        }));

      viewContext = {
        tasksViewMode: true,
        tasksViewContext: { triageItems, readyTasks },
      };
    } else if (state.currentView === 'search' && !taskId) {
      // Search view - pass search query and results for context
      const searchLower = searchQuery.toLowerCase();
      const results = searchQuery.trim()
        ? state.tasks.filter(t =>
            !t.deletedAt &&
            (t.title.toLowerCase().includes(searchLower) ||
             t.description?.toLowerCase().includes(searchLower) ||
             t.steps.some(s => s.text.toLowerCase().includes(searchLower)))
          )
        : [];

      // Limit to top 10 results to avoid large payloads
      const searchResults = results.slice(0, 10).map(t => ({
        taskId: t.id,
        taskTitle: t.title,
        status: t.status,
        priority: t.priority || null,
        targetDate: t.targetDate || null,
        deadlineDate: t.deadlineDate || null,
        effort: t.effort || null,
        stepsCount: t.steps.length,
        completedSteps: t.steps.filter(s => s.completed).length,
      }));

      viewContext = {
        searchMode: true,
        searchContext: {
          query: searchQuery,
          resultCount: results.length,
          results: searchResults,
        },
      };
    } else if (state.currentView === 'focusMode' && taskId) {
      // Focus Mode - pass rich context about current focus session
      const focusTask = state.tasks.find(t => t.id === taskId);
      const queueItem = state.focusQueue.items.find(i => i.taskId === taskId);
      if (focusTask && queueItem) {
        const stepsInScope = getStepsInScope(queueItem, focusTask);
        const focusCurrentStep = stepsInScope.find(s => s.id === state.focusMode.currentStepId);
        const currentStepIndex = stepsInScope.findIndex(s => s.id === state.focusMode.currentStepId);

        viewContext = {
          focusModeContext: {
            taskTitle: focusTask.title,
            currentStep: focusCurrentStep ? {
              text: focusCurrentStep.text,
              substeps: focusCurrentStep.substeps.map(sub => ({
                text: sub.text,
                completed: sub.completed,
              })),
            } : null,
            progress: {
              completed: stepsInScope.filter(s => s.completed).length,
              total: stepsInScope.length,
            },
            currentStepIndex: currentStepIndex + 1, // 1-indexed for display
          },
        };
      }
    } else if (state.currentView === 'taskDetail' && currentTask) {
      // Task Detail view - pass full task context including progress, health, dates
      const health = computeHealthStatus(currentTask);
      const queueItem = state.focusQueue.items.find(i => i.taskId === currentTask.id);
      const priorityInfo = getTaskPriorityInfo(currentTask, state.currentEnergy);

      viewContext = {
        taskDetailMode: true,
        taskDetailContext: {
          taskId: currentTask.id,
          status: currentTask.status,
          priority: currentTask.priority || null,
          targetDate: currentTask.targetDate || null,
          deadlineDate: currentTask.deadlineDate || null,
          effort: currentTask.effort || null,
          health: {
            status: health.status,
            reasons: health.reasons,
          },
          reminder: currentTask.reminder ? {
            type: currentTask.reminder.type,
            ...(currentTask.reminder.type === 'relative' && {
              relativeMinutes: currentTask.reminder.relativeMinutes,
              relativeTo: currentTask.reminder.relativeTo,
            }),
            ...(currentTask.reminder.type === 'absolute' && {
              absoluteTime: currentTask.reminder.absoluteTime,
            }),
          } : null,
          waitingOn: currentTask.waitingOn ? {
            who: currentTask.waitingOn.who,
            since: currentTask.waitingOn.since,
            followUpDate: currentTask.waitingOn.followUpDate,
          } : null,
          inFocusQueue: !!queueItem,
          progress: (() => {
            // For recurring tasks, use instance steps instead of template
            if (currentTask.isRecurring && currentTask.recurrence) {
              const activeDate = getActiveOccurrenceDate(currentTask) || getRecurringTodayISO();
              const instance = currentTask.recurringInstances?.find(i => i.date === activeDate);
              if (instance) {
                return {
                  completedSteps: instance.steps.filter(s => s.completed).length,
                  totalSteps: instance.steps.length,
                };
              }
            }
            return {
              completedSteps: currentTask.steps.filter(s => s.completed).length,
              totalSteps: currentTask.steps.length,
            };
          })(),
          // Send step-by-step breakdown with completion status
          // For recurring tasks, send instance steps in executing mode, template steps in managing mode
          steps: (() => {
            let stepsToSend = currentTask.steps;
            if (currentTask.isRecurring && currentTask.recurrence && state.taskDetailMode !== 'managing') {
              const activeDate = getActiveOccurrenceDate(currentTask) || getRecurringTodayISO();
              const instance = currentTask.recurringInstances?.find(i => i.date === activeDate);
              if (instance) {
                stepsToSend = instance.steps;
              }
            }
            return stepsToSend.map((step, index) => ({
              id: step.id,
              text: step.text,
              completed: step.completed,
              stepNumber: index + 1,
              substeps: step.substeps.map((sub, subIndex) => ({
                id: sub.id,
                text: sub.text,
                completed: sub.completed,
                label: String.fromCharCode(97 + subIndex), // 'a', 'b', 'c'...
              })),
            }));
          })(),
          // Nudge System Fields
          importance: currentTask.importance || null,
          importanceSource: currentTask.importanceSource || null,
          importanceNote: currentTask.importanceNote || null,
          energyType: currentTask.energyType || null,
          leadTimeDays: currentTask.leadTimeDays || null,
          // Computed Priority
          priorityScore: priorityInfo.score,
          priorityTier: priorityInfo.tier,
          effectiveDeadline: priorityInfo.effectiveDeadline?.toISOString().split('T')[0] || null,
        },
      };
    }

    // Get active staging context for follow-up questions about pending suggestions
    const activeStaging = getActiveStaging();

    // Build routine context for recurring tasks
    let routineContext: {
      isRecurring: boolean;
      streak: number;
      bestStreak: number;
      totalCompletions: number;
      isOverdue: boolean;
      overdueDays: number | null;
      patternDescription: string;
      scheduledTime: string | null;
      activeInstanceDate: string | null;
      instanceStepCount: number;
      templateStepCount: number;
    } | null = null;

    if (currentTask?.isRecurring && currentTask.recurrence) {
      const pattern = currentTask.recurrence as RecurrenceRuleExtended;
      const activeDate = getActiveOccurrenceDate(currentTask);
      const instance = activeDate
        ? currentTask.recurringInstances?.find(i => i.date === activeDate)
        : null;

      routineContext = {
        isRecurring: true,
        streak: currentTask.recurringStreak || 0,
        bestStreak: currentTask.recurringBestStreak || 0,
        totalCompletions: currentTask.recurringTotalCompletions || 0,
        isOverdue: (instance?.overdueDays ?? 0) > 0,
        overdueDays: instance?.overdueDays ?? null,
        patternDescription: describePattern(pattern),
        scheduledTime: pattern.time || null,
        activeInstanceDate: activeDate,
        instanceStepCount: instance?.steps?.length || 0,
        templateStepCount: currentTask.steps.length,
      };
    }

    try {
      const response = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: query,
          // For recurring tasks, send instance steps in executing mode, template steps in managing mode
          currentList: (() => {
            if (!currentTask) return [];
            if (currentTask.isRecurring && currentTask.recurrence && state.taskDetailMode !== 'managing') {
              const activeDate = getActiveOccurrenceDate(currentTask) || getRecurringTodayISO();
              const instance = currentTask.recurringInstances?.find(i => i.date === activeDate);
              if (instance) {
                return instance.steps;
              }
            }
            return currentTask.steps || [];
          })(),
          taskTitle: currentTask?.title || "Untitled Task",
          taskDescription: currentTask?.description,
          taskNotes: currentTask?.notes,
          conversationHistory: inFocusMode
            ? (currentTask?.focusModeMessages || [])
            : (currentTask?.messages || []),
          focusMode: inFocusMode,
          currentStep: currentStep ? {
            id: currentStep.id,
            text: currentStep.text,
            completed: currentStep.completed,
          } : null,
          // Include targeted step ID for step-scoped AI actions
          targetedStepId: aiTargetContext?.type === 'step' ? aiTargetContext.stepId : null,
          // Include pending staging context for follow-up questions
          pendingSuggestions: activeStaging?.suggestions || null,
          pendingEdits: activeStaging?.edits || null,
          pendingDeletions: activeStaging?.deletions || null,
          pendingAction: activeStaging?.pendingAction || null,
          // Include routine context for recurring tasks
          routineContext,
          // Include current mode for recurring tasks (executing = today's instance, managing = template)
          recurringMode: state.taskDetailMode || 'executing',
          ...viewContext,  // Include view-specific context
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`API error ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data: StructureResponse = await response.json();

      // Determine response category (text → Palette, structured → StagingArea)
      // The API returns `action` which maps to tool categories
      const actionName = data.action || 'none';
      const responseCategory = categorizeResponse(actionName);

      // Store pending suggestions/edits/deletions in state for when user accepts
      const pendingAction = getPendingActionType(data);

      // Handle replace/suggest actions (steps or suggestions)
      if (pendingAction && (pendingAction === 'replace' || pendingAction === 'suggest') && (data.suggestions || data.steps)) {
        const suggestions = data.action === 'replace' && data.steps
          ? data.steps.map((step: Step & { parentStepId?: string; insertAfterStepId?: string }) => ({
              id: step.id,
              text: step.text,
              substeps: step.substeps.map((sub) => ({ id: sub.id, text: sub.text })),
              estimatedMinutes: step.estimatedMinutes || undefined,
              parentStepId: step.parentStepId,
              insertAfterStepId: step.insertAfterStepId,
            }))
          : data.suggestions || [];

        updateActiveStaging(() => ({
          suggestions,
          edits: [],
          deletions: [],
          metadataSuggestions: [],
          suggestedTitle: data.suggestedTitle || data.taskTitle || null,
          pendingAction,
        }));

        // Trigger StagingArea pulse animation for structured responses
        if (responseCategory === 'structured') {
          setStagingIsNewArrival(true);
          setStagingPopulatedAt(Date.now());  // Track when staging was populated
        }
      }

      // Handle edit action
      if (pendingAction === 'edit' && data.edits && data.edits.length > 0) {
        const editsToApply = data.edits; // Capture for TypeScript narrowing
        updateActiveStaging(() => ({
          suggestions: [],
          edits: editsToApply,
          deletions: [],
          metadataSuggestions: [],
          suggestedTitle: null,
          pendingAction,
        }));

        // Trigger StagingArea pulse animation
        if (responseCategory === 'structured') {
          setStagingIsNewArrival(true);
          setStagingPopulatedAt(Date.now());  // Track when staging was populated
        }
      }

      // Handle delete action
      if (pendingAction === 'delete' && data.deletions && data.deletions.length > 0) {
        const deletionsToApply = data.deletions; // Capture for TypeScript narrowing
        updateActiveStaging(() => ({
          suggestions: [],
          edits: [],
          deletions: deletionsToApply,
          metadataSuggestions: [],
          suggestedTitle: null,
          pendingAction,
        }));

        // Trigger StagingArea pulse animation
        if (responseCategory === 'structured') {
          setStagingIsNewArrival(true);
          setStagingPopulatedAt(Date.now());  // Track when staging was populated
        }
      }

      // Handle metadata suggestions
      if (data.metadataSuggestions && data.metadataSuggestions.length > 0) {
        const metadataToApply = data.metadataSuggestions; // Capture for TypeScript narrowing
        updateActiveStaging(() => ({
          suggestions: [],
          edits: [],
          deletions: [],
          metadataSuggestions: metadataToApply,
          suggestedTitle: null,
          pendingAction: 'metadata',
        }));

        // Trigger StagingArea pulse animation
        setStagingIsNewArrival(true);
        setStagingPopulatedAt(Date.now());
      }

      // Issue 10: Store queue messages for 48h retention (queue context only)
      if (state.currentView === 'focus' && !currentTask) {
        const now = Date.now();
        const userMessage: QueueMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content: query,
          timestamp: now - 100, // Slightly before AI response
        };
        const aiMessage: QueueMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message || '',
          timestamp: now,
        };
        setState(prev => ({
          ...prev,
          queueMessages: [...prev.queueMessages, userMessage, aiMessage],
          queueLastInteractionAt: now,
        }));
      }

      // Issue 3 Round 3: Store Tasks view messages for 60m display window
      if (state.currentView === 'tasks' && !currentTask) {
        const now = Date.now();
        const userMessage: QueueMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content: query,
          timestamp: now - 100, // Slightly before AI response
        };
        const aiMessage: QueueMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message || '',
          timestamp: now,
        };
        setState(prev => ({
          ...prev,
          tasksMessages: [...prev.tasksMessages, userMessage, aiMessage],
          tasksLastInteractionAt: now,
        }));
      }

      // Save task messages for task detail and focus mode contexts
      if (currentTask) {
        const now = Date.now();
        const userMsg: Message = {
          role: 'user',
          content: query,
          timestamp: now - 100,
          ...(inFocusMode && currentStepId ? { stepId: currentStepId } : {}),
        };
        const aiMsg: Message = {
          role: 'assistant',
          content: data.message || '',
          timestamp: now,
          ...(inFocusMode && currentStepId ? { stepId: currentStepId } : {}),
        };
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t =>
            t.id === currentTask.id
              ? {
                  ...t,
                  ...(inFocusMode
                    ? { focusModeMessages: [...(t.focusModeMessages || []), userMsg, aiMsg] }
                    : { messages: [...(t.messages || []), userMsg, aiMsg] }
                  ),
                  updatedAt: now,
                }
              : t
          ),
        }));
      }

      // For structured responses (suggestions/edits/deletions going to staging), return collapsedContent
      // so the reducer can set it atomically with clearing loading state.
      // For conversational responses, return the AIResponse to show in palette.
      if (responseCategory === 'structured') {
        // Build collapsedContent based on what was staged
        let statusMessage = '';
        let itemCount = 0;
        if (pendingAction === 'replace' || pendingAction === 'suggest') {
          itemCount = (data.suggestions || data.steps || []).length;
          statusMessage = buildSuggestionsReadyMessage(actionName, itemCount);
        } else if (pendingAction === 'edit') {
          itemCount = (data.edits || []).length;
          statusMessage = `${itemCount} edit${itemCount !== 1 ? 's' : ''} ready`;
        } else if (pendingAction === 'delete') {
          itemCount = (data.deletions || []).length;
          statusMessage = `${itemCount} deletion${itemCount !== 1 ? 's' : ''} ready`;
        }

        // Return a suggestions-type response so palette can display a summary
        // The actual suggestions/edits are in StagingArea
        return {
          response: {
            type: 'suggestions' as const,
            content: {
              message: data.message || `I've prepared ${itemCount} suggestions.`,
              suggestions: [], // Actual suggestions are in staging, not palette
            },
          },
          collapsedContent: {
            type: 'suggestionsReady' as const,
            text: statusMessage,
            icon: '💡',
          },
        };
      }
      return { response: structureToAIResponse(data) };
    } catch (error) {
      return {
        response: {
          type: 'error',
          content: { text: error instanceof Error ? error.message : 'Something went wrong' },
          actions: [{ id: 'retry', label: 'Retry', variant: 'primary', onClick: () => {} }],
        },
      };
    }
  }, [state.activeTaskId, state.tasks, state.currentView, state.focusMode.currentStepId, updateActiveStaging]);

  // Handle accepting suggestions from minibar
  const handleAIMinibarAccept = useCallback((response: AIResponse) => {
    if (response.type === 'suggestions') {
      // Trigger accept all on existing staging workflow
      const content = response.content as SuggestionsContent;
      if (content.suggestions && content.suggestions.length > 0) {
        // The suggestions are stored in task.staging by handleAIMinibarSubmit
        // Just trigger the existing handleAcceptAll flow
        handleAcceptAll();
      }
    }
  }, []);

  // Memoize idle content to prevent new object on every render
  // (which would trigger useEffect in useAIAssistant and break expansion)
  const defaultIdleContent = useMemo(
    () => getIdleContent(),
    [state.currentView, state.focusQueue, activeTask, state.focusMode, state.tasks]
  );

  // AI Assistant hook (MiniBar/Palette/Drawer)
  const aiAssistant = useAIAssistant({
    initialContext: getAIContext(),
    defaultIdleContent,
    onSubmit: handleAIMinibarSubmit,
    onAcceptSuggestions: handleAIMinibarAccept,
  });

  // ============================================
  // Contextual Prompts
  // ============================================

  // Build prompt context from current state
  const promptContext: PromptContext = {
    // Task Detail context
    taskStepCount: activeTask?.steps.length ?? 0,
    isInQueue: activeTask ? state.focusQueue.items.some(item => item.taskId === activeTask.id) : false,
    hasEstimate: activeTask?.steps.some(s => s.estimatedMinutes !== null) ?? false,
    // Focus Mode context - check if current step is incomplete
    currentStepCompleted: state.focusMode.currentStepId
      ? activeTask?.steps.find(s => s.id === state.focusMode.currentStepId)?.completed ?? false
      : false,
    // Queue context
    queueItemCount: state.focusQueue.items.filter(i => !i.completed).length,
    topQueueItemId: state.focusQueue.items
      .filter(i => !i.completed)
      .sort((a, b) => a.order - b.order)[0]?.id,
    topQueueItemTitle: state.focusQueue.items
      .filter(i => !i.completed)
      .sort((a, b) => a.order - b.order)
      .map(item => state.tasks.find(t => t.id === item.taskId)?.title)[0],
  };

  // Track prompt-triggered submissions (to auto-expand on response)
  const promptTriggeredSubmitRef = useRef(false);

  // Handlers for contextual prompts
  const promptHandlers: PromptHandlers = {
    submitQuery: (query: string) => {
      // Submit directly WITHOUT expanding - show loading in MiniBar
      // Will auto-expand when response arrives
      promptTriggeredSubmitRef.current = true;
      aiAssistant.directSubmit(query);
    },
    navigateToFocusMode: (queueItemId: string) => {
      // Navigate to focus mode for the given queue item
      handleStartFocus(queueItemId);
    },
    requestRecommendation: () => {
      // Trigger recommendation request and auto-expand palette
      promptTriggeredSubmitRef.current = true;
      handleRequestRecommendation();
    },
  };

  // Contextual prompts hook - enabled when minibar shows idle or status
  const contextualPrompts = useContextualPrompts({
    context: getAIContext(),
    promptContext,
    handlers: promptHandlers,
    enabled:
      aiAssistant.state.mode === 'collapsed' &&
      !aiAssistant.state.isLoading &&
      aiAssistant.state.collapsedContent.type !== 'nudge' &&
      (aiAssistant.state.collapsedContent.type === 'idle' ||
       aiAssistant.state.collapsedContent.type === 'status'),
  });

  // Update MiniBar collapsed content when contextual prompt becomes active or times out
  useEffect(() => {
    // Don't override loading state - contextual action was triggered
    if (aiAssistant.state.isLoading) return;

    // Don't override response states - these should persist until user dismisses
    const protectedTypes = ['response', 'suggestionsReady', 'confirmation', 'loading'];
    if (protectedTypes.includes(aiAssistant.state.collapsedContent.type)) return;

    // Don't override if there's an active response (even if collapsedContent.type isn't set yet)
    if (aiAssistant.state.response) return;

    if (contextualPrompts.showPrompt && contextualPrompts.prompt) {
      aiAssistant.setCollapsedContent({
        type: 'prompt',
        text: contextualPrompts.prompt.text,
        prompt: contextualPrompts.prompt,
      });
    } else if (!contextualPrompts.showPrompt && aiAssistant.state.collapsedContent.type === 'prompt') {
      // Prompt timed out - return to idle/status (Issue 9 fix)
      aiAssistant.setCollapsedContent(defaultIdleContent);
    }
  }, [contextualPrompts.showPrompt, contextualPrompts.prompt, aiAssistant.setCollapsedContent, aiAssistant.state.collapsedContent.type, aiAssistant.state.isLoading, aiAssistant.state.response, defaultIdleContent]);

  // Auto-expand Palette when response arrives after prompt-triggered submission
  useEffect(() => {
    if (
      promptTriggeredSubmitRef.current &&
      !aiAssistant.state.isLoading &&
      aiAssistant.state.response &&
      aiAssistant.state.mode === 'collapsed'
    ) {
      promptTriggeredSubmitRef.current = false;
      aiAssistant.expand();
    }
  }, [aiAssistant.state.isLoading, aiAssistant.state.response, aiAssistant.state.mode, aiAssistant.expand]);

  // Reset manual flag when response arrives so auto-collapse can work
  useEffect(() => {
    if (aiAssistant.state.response && !aiAssistant.state.isLoading) {
      setPaletteManuallyOpened(false);
    }
  }, [aiAssistant.state.response, aiAssistant.state.isLoading]);

  // Auto-scroll to staging area when suggestions arrive
  useEffect(() => {
    if (aiAssistant.state.response?.type === 'suggestions') {
      const el = document.getElementById('staging-area');
      if (el) {
        // Small delay to let staging area render
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [aiAssistant.state.response]);

  // Reset prompt when user interacts with AI (expand or submit)
  useEffect(() => {
    if (aiAssistant.state.mode !== 'collapsed') {
      contextualPrompts.resetPrompt();
    }
  }, [aiAssistant.state.mode, contextualPrompts.resetPrompt]);

  // Lock body scroll when sidebar is open (iOS Safari fix)
  // Note: Avoid position:fixed on body as it causes layout shifts with safe-area-insets
  useEffect(() => {
    if (sidebarOpen) {
      // Simple overflow hidden approach - doesn't shift content
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      // Prevent touch scrolling on iOS
      document.body.style.touchAction = 'none';

      return () => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      };
    }
  }, [sidebarOpen]);

  // Clear AI target context when response arrives (highlight fade)
  useEffect(() => {
    if (aiTargetContext && aiAssistant.state.response && !aiAssistant.state.isLoading) {
      // Delay clearing to let user see the connection between target and response
      const timeout = setTimeout(() => {
        setAITargetContext(null);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [aiTargetContext, aiAssistant.state.response, aiAssistant.state.isLoading]);

  // ============================================
  // Drawer Message Sync (Issue 10)
  // ============================================

  const QUEUE_SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes

  // Sync drawer messages when drawer opens based on context
  useEffect(() => {
    if (aiAssistant.state.mode === 'drawer') {
      if (state.currentView === 'focusMode' && activeTask) {
        // Focus Mode: load focusModeMessages
        const messages = (activeTask.focusModeMessages || []).map(m => ({
          id: crypto.randomUUID(),
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }));
        aiAssistant.syncMessages(messages);
      } else if (state.currentView === 'taskDetail' && activeTask) {
        // Task Detail: load task messages
        const messages = (activeTask.messages || []).map(m => ({
          id: crypto.randomUUID(),
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }));
        aiAssistant.syncMessages(messages);
      } else if (state.currentView === 'focus') {
        // Queue: apply 60-minute window logic
        const isStale = !state.queueLastInteractionAt ||
          (Date.now() - state.queueLastInteractionAt > QUEUE_SESSION_TIMEOUT);

        if (isStale) {
          aiAssistant.clearMessages(); // Fresh UI
        } else {
          // Show recent messages within session window
          const messages = (state.queueMessages || []).map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          }));
          aiAssistant.syncMessages(messages);
        }
      } else if (state.currentView === 'tasks' && !state.activeTaskId) {
        // Tasks view (not in TaskDetail): apply same 60-minute window logic as queue
        const isStale = !state.tasksLastInteractionAt ||
          (Date.now() - state.tasksLastInteractionAt > QUEUE_SESSION_TIMEOUT);

        if (isStale) {
          aiAssistant.clearMessages(); // Fresh UI
        } else {
          // Show recent messages within session window
          const messages = (state.tasksMessages || []).map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          }));
          aiAssistant.syncMessages(messages);
        }
      } else {
        // Other views (inbox, search): fresh UI
        aiAssistant.clearMessages();
      }
    }
  }, [aiAssistant.state.mode, state.currentView, activeTask?.id, state.queueMessages, state.tasksMessages]);

  // ============================================
  // State Persistence
  // ============================================

  // Load state from IndexedDB (Phase 2) with localStorage fallback
  // Handles migration from localStorage on first run
  useEffect(() => {
    const loadData = async () => {
      try {
        // Phase 2: Load from IndexedDB (handles migration automatically)
        const loaded = await loadStateAsync();

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

        // Check for deep link task parameter (from notification click)
        const urlParams = new URLSearchParams(window.location.search);
        const taskIdParam = urlParams.get('task');
        let deepLinkTaskId: string | null = null;

        if (taskIdParam && loaded.tasks.some(t => t.id === taskIdParam)) {
          deepLinkTaskId = taskIdParam;
          currentView = 'taskDetail';
          // Clear the URL param after handling
          const url = new URL(window.location.href);
          url.searchParams.delete('task');
          window.history.replaceState({}, '', url.toString());
        }

        setState({
          ...loaded,
          focusMode,
          currentView,
          activeTaskId: deepLinkTaskId || loaded.activeTaskId,
        });

        // Initialize reminders (check for any due while app was closed)
        initializeReminders();

        // Load notifications (Phase 2: IndexedDB with fallback)
        const loadedNotifications = await loadNotificationsAsync();

        // Initialize start pokes and track missed ones (for syncing with in-app notification state)
        const missedPokeNotificationIds: string[] = [];
        initializeStartPokes((taskId, notificationId) => {
          missedPokeNotificationIds.push(notificationId);
        });

        // Mark missed pokes as fired in the notification state
        const updatedNotifications = missedPokeNotificationIds.length > 0
          ? loadedNotifications.map(n => {
              if (missedPokeNotificationIds.includes(n.id)) {
                return { ...n, firedAt: Date.now() };
              }
              return n;
            })
          : loadedNotifications;

        setNotifications(updatedNotifications);

        // Load recent task IDs from localStorage (still uses localStorage - not critical data)
        try {
          const savedRecentIds = localStorage.getItem('focus-tools-recent-tasks');
          if (savedRecentIds) {
            const parsed = JSON.parse(savedRecentIds);
            if (Array.isArray(parsed)) {
              setRecentTaskIds(parsed.slice(0, 5));
            }
          }
        } catch (e) {
          console.error("Failed to load recent tasks:", e);
        }
      } catch (e) {
        console.error("Failed to load saved state:", e);
      }
      setHasHydrated(true);
    };

    loadData();
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    if (hasHydrated) {
      saveState(state);
    }
  }, [state, hasHydrated]);

  // Save notifications changes to localStorage
  useEffect(() => {
    if (hasHydrated) {
      saveNotifications(notifications);
    }
  }, [notifications, hasHydrated]);

  // Check notification permission on load and show banner if needed
  useEffect(() => {
    if (!hasHydrated) return;

    // Show permission banner after a short delay if permission is default
    if (supportsNotifications() && getNotificationPermission() === 'default') {
      const timer = setTimeout(() => {
        setShowNotificationPrompt(true);
      }, 2000); // 2 second delay to not overwhelm on first load
      return () => clearTimeout(timer);
    }
  }, [hasHydrated]);

  // Schedule notifications for all eligible queued tasks on initial load
  // This ensures notifications are created for tasks that were added before this feature existed
  useEffect(() => {
    if (!hasHydrated) return;

    // Get all tasks currently in the focus queue
    const queuedTaskIds = state.focusQueue.items
      .filter(i => !i.completed)
      .map(i => i.taskId);

    // Schedule notifications for eligible tasks
    state.tasks
      .filter(t => queuedTaskIds.includes(t.id) && t.status !== 'complete' && !t.deletedAt)
      .forEach(task => {
        scheduleNotificationForTask(task);
      });
    // Only run once after hydration - dependencies intentionally limited
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  // Check for notifications that need to fire (periodically + on app focus)
  // UI updates automatically via startPokeAlertData when notifications are fired
  useEffect(() => {
    if (!hasHydrated) return;

    const checkAndFireNotifications = () => {
      // Pass tasks to filter out notifications for completed tasks
      const readyToFire = getReadyToFire(notifications, state.tasks);
      if (readyToFire.length > 0) {
        setNotifications((prev) => {
          let updated = prev;
          for (const notification of readyToFire) {
            updated = markNotificationFired(notification.id, updated);
          }
          return updated;
        });
      }
    };

    // Check immediately
    checkAndFireNotifications();

    // Check every minute
    const interval = setInterval(checkAndFireNotifications, 60000);

    // Check on window focus (user returns to app)
    const handleFocus = () => checkAndFireNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [hasHydrated, notifications, state.tasks]);

  // Cancel pending notifications for completed tasks
  useEffect(() => {
    if (!hasHydrated) return;

    // Find completed tasks that still have pending notifications
    const completedTaskIds = state.tasks
      .filter(t => t.status === 'complete' || t.completedAt !== null)
      .map(t => t.id);

    setNotifications((prev) => {
      let updated = prev;
      for (const taskId of completedTaskIds) {
        const hadPending = updated.some(n => n.taskId === taskId && n.firedAt === null);
        if (hadPending) {
          updated = cancelNotificationsForCompletedTask(taskId, updated);
        }
      }
      return updated;
    });
  }, [hasHydrated, state.tasks]);

  // Save recent task IDs to localStorage
  useEffect(() => {
    if (hasHydrated && recentTaskIds.length > 0) {
      localStorage.setItem('focus-tools-recent-tasks', JSON.stringify(recentTaskIds));
    }
  }, [recentTaskIds, hasHydrated]);

  // Save tasks filters to localStorage
  useEffect(() => {
    if (hasHydrated) {
      try {
        localStorage.setItem('task-copilot-filters', JSON.stringify(tasksFilters));
      } catch {
        // Ignore storage errors
      }
    }
  }, [tasksFilters, hasHydrated]);

  // Freeze recents when entering search mode, unfreeze when exiting
  useEffect(() => {
    const isSearchActive = searchInputFocused || searchQuery.trim() !== '';
    if (isSearchActive && frozenRecentTaskIds === null) {
      // Entering search mode - snapshot current recents
      setFrozenRecentTaskIds(recentTaskIds);
    } else if (!isSearchActive && frozenRecentTaskIds !== null) {
      // Fully exiting search mode - clear frozen state
      setFrozenRecentTaskIds(null);
    }
  }, [searchInputFocused, searchQuery, frozenRecentTaskIds, recentTaskIds]);

  // Handle notification click deep links while app is open
  useEffect(() => {
    const handleReminderClick = (e: CustomEvent<{ taskId: string }>) => {
      const taskId = e.detail.taskId;
      setState(prev => {
        if (prev.tasks.some(t => t.id === taskId)) {
          return {
            ...prev,
            activeTaskId: taskId,
            currentView: 'taskDetail' as ViewType,
          };
        }
        return prev;
      });
    };

    window.addEventListener('task-reminder-click', handleReminderClick as EventListener);
    return () => {
      window.removeEventListener('task-reminder-click', handleReminderClick as EventListener);
    };
  }, []);

  // Handle URL changes from service worker navigation (notification deep links)
  // When SW calls client.navigate(), the app is already hydrated so init useEffect doesn't run
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const taskIdParam = urlParams.get('task');
      if (taskIdParam) {
        setState(prev => {
          if (prev.tasks.some(t => t.id === taskIdParam)) {
            // Clear the URL param after handling
            const url = new URL(window.location.href);
            url.searchParams.delete('task');
            window.history.replaceState({}, '', url.toString());
            return {
              ...prev,
              activeTaskId: taskIdParam,
              currentView: 'taskDetail' as ViewType,
            };
          }
          return prev;
        });
      }
    };

    // Listen for window focus (when SW navigates and focuses the window)
    window.addEventListener('focus', handleUrlChange);
    return () => window.removeEventListener('focus', handleUrlChange);
  }, []);

  // Sync AI Assistant context when view changes
  // Refinement 7: Reset appearance on context change (but preserve drawer history)
  // IMPORTANT: Only trigger on actual view changes - not callback recreation
  // The callbacks depend on idleContent which changes when state.tasks changes,
  // causing this effect to fire unexpectedly and clear responses
  useEffect(() => {
    aiAssistant.setContext(getAIContext());
    aiAssistant.reset();  // Collapse MiniBar, clear response, clear query
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentView]);

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
          // Go to Focus tab (also exits search mode and closes drawers)
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setSearchQuery('');
            setSearchInputFocused(false);
            setActiveDrawer(null);
            setState((prev) => ({
              ...prev,
              currentView: 'focus',
              activeTaskId: null,
            }));
          }
          break;

        case 't':
          // Go to Tasks tab (also exits search mode and closes drawers)
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setSearchQuery('');
            setSearchInputFocused(false);
            setActiveDrawer(null);
            setState((prev) => ({
              ...prev,
              currentView: 'tasks',
              activeTaskId: null,
            }));
          }
          break;

        case '/':
          // Focus search input (sidebar mode swaps automatically)
          e.preventDefault();
          // On desktop: expand sidebar if collapsed
          if (sidebarCollapsed) {
            setSidebarCollapsed(false);
          }
          // Focus search input after a short delay
          setShouldFocusSearch(true);
          break;

        case 'Escape':
          // Priority 0: Cancel AI request if loading (stay in place)
          if (aiAssistant.state.isLoading) {
            aiAssistant.cancelRequest();
            // Clear AI target context when cancelling
            setAITargetContext(null);
          }
          // Priority 0.5: Close task creation popover
          else if (taskCreationOpen) {
            setTaskCreationOpen(false);
          }
          // Priority 1: Close sidebar on mobile
          else if (sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
          // Priority 2: Close AI drawer if open
          else if (aiAssistant.state.mode === 'drawer') {
            aiAssistant.closeDrawer();
          }
          // Priority 3: Collapse Palette to MiniBar if expanded
          else if (aiAssistant.state.mode === 'expanded') {
            setPaletteManuallyOpened(false);
            aiAssistant.collapse();
            // Clear AI target context when collapsing palette
            setAITargetContext(null);
          }
          // Priority 4: Clear search and unfocus (if searching)
          else if (searchQuery || searchInputFocused) {
            setSearchQuery('');
            setSearchInputFocused(false);
            // Blur search input if focused
            if (document.activeElement instanceof HTMLInputElement) {
              document.activeElement.blur();
            }
          }
          // Priority 5: Go back from task detail or focus mode
          else if (state.currentView === 'taskDetail' || state.currentView === 'focusMode') {
            setActiveDrawer(null);
            setState((prev) => ({
              ...prev,
              currentView: previousView,
              activeTaskId: null,
            }));
          }
          // Priority 6: Close project modal
          else if (projectModalOpen) {
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
          // Toggle AI palette
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            if (aiAssistant.state.mode === 'collapsed') {
              aiAssistant.expand();
            } else if (aiAssistant.state.mode === 'expanded') {
              aiAssistant.collapse();
            } else if (aiAssistant.state.mode === 'drawer') {
              aiAssistant.closeDrawer();
            }
          }
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.currentView, previousView, projectModalOpen, taskCreationOpen, sidebarOpen, sidebarCollapsed, searchQuery, searchInputFocused, aiAssistant.state.mode, aiAssistant.state.isLoading, aiAssistant.closeDrawer, aiAssistant.collapse, aiAssistant.expand, aiAssistant.cancelRequest]);

  // ============================================
  // Edge Swipe Navigation
  // ============================================

  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const EDGE_THRESHOLD = 20; // px from screen edge to trigger swipe
  const SWIPE_MIN_DISTANCE = 50; // minimum horizontal distance for swipe
  const SWIPE_RATIO = 2; // horizontal must be > 2x vertical

  // Scroll-based header shadow
  const handleMainScroll = useCallback(() => {
    if (mainRef.current) {
      setIsScrolled(mainRef.current.scrollTop >= 8);
    }
  }, []);

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    // Only track swipes that start near screen edges
    const touch = e.touches[0];
    const isLeftEdge = touch.clientX < EDGE_THRESHOLD;
    // Only register right-edge swipes on Focus view (Focus→Tasks)
    // Avoids conflicting with iOS Safari's forward navigation gesture on other views
    const isRightEdge = state.currentView === 'focus' && touch.clientX > window.innerWidth - EDGE_THRESHOLD;

    if (isLeftEdge || isRightEdge) {
      swipeStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }
  }, [state.currentView]);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - swipeStartRef.current.y);
    const startedAtLeftEdge = swipeStartRef.current.x < EDGE_THRESHOLD;

    // Top-level views (accessible from menu) vs child views (have back button)
    const topLevelViews = ['focus', 'tasks'];
    const childViews = ['taskDetail', 'focusMode', 'inbox', 'projects', 'search', 'notifications', 'settings'];
    const isTopLevel = topLevelViews.includes(state.currentView);
    const isChildView = childViews.includes(state.currentView);

    // Check if this is a valid horizontal swipe
    if (Math.abs(deltaX) > SWIPE_MIN_DISTANCE && Math.abs(deltaX) > deltaY * SWIPE_RATIO) {
      // Left-edge swipe right behavior depends on view type
      if (startedAtLeftEdge && deltaX > 0 && !sidebarOpen) {
        if (isChildView) {
          // Child views: swipe from left edge goes BACK (mirrors handleBackToList logic)
          setState((prev) => ({
            ...prev,
            currentView: previousView === 'taskDetail' || previousView === prev.currentView ? 'focus' : previousView,
            activeTaskId: null,
          }));
          swipeStartRef.current = null;
          return;
        } else if (isTopLevel && state.currentView !== 'tasks') {
          // Top-level views (except Tasks - preserve tab switching): open sidebar
          setSidebarOpen(true);
          swipeStartRef.current = null;
          return;
        }
      }

      // Focus↔Tasks swipe navigation (when sidebar is closed, only on Tasks view for left-edge swipes)
      if (!sidebarOpen && (state.currentView === 'focus' || state.currentView === 'tasks')) {
        if (deltaX > 0 && state.currentView === 'tasks') {
          // Swipe right → go to Focus
          setState((prev) => ({ ...prev, currentView: 'focus' }));
        } else if (deltaX < 0 && state.currentView === 'focus') {
          // Swipe left → go to Tasks
          setState((prev) => ({ ...prev, currentView: 'tasks' }));
        }
      }
    }

    swipeStartRef.current = null;
  }, [state.currentView, sidebarOpen, previousView]);

  // ============================================
  // Stale queue item nudge (sequential awareness model)
  // ============================================

  const activeStaleItems = useMemo(() => {
    const todayItems = state.focusQueue.items
      .filter((i) => !i.completed && i.order < state.focusQueue.todayLineIndex);
    return todayItems
      .filter((i) => isQueueItemStale(i) && !dismissedStaleIds.has(i.id))
      .map((i) => {
        const task = state.tasks.find((t) => t.id === i.taskId);
        const days = Math.floor((Date.now() - i.lastInteractedAt) / (1000 * 60 * 60 * 24));
        return { item: i, task, days };
      })
      .filter((x): x is { item: typeof x.item; task: NonNullable<typeof x.task>; days: number } => x.task != null);
  }, [state.focusQueue.items, state.focusQueue.todayLineIndex, state.tasks, dismissedStaleIds]);

  const activeOldInboxItems = useMemo(() => {
    const inboxTasks = state.tasks.filter(t => t.status === 'inbox' && !t.deletedAt);
    const OLD_DAYS_THRESHOLD = 5;
    return inboxTasks
      .map(t => {
        const days = Math.floor((Date.now() - t.createdAt) / (1000 * 60 * 60 * 24));
        return { task: t, days };
      })
      .filter(x => x.days >= OLD_DAYS_THRESHOLD && !dismissedOldInboxIds.has(x.task.id))
      .sort((a, b) => b.days - a.days); // oldest first
  }, [state.tasks, dismissedOldInboxIds]);

  // Clamp staleIndex when list shrinks
  useEffect(() => {
    if (staleIndex >= activeStaleItems.length && activeStaleItems.length > 0) {
      setStaleIndex(activeStaleItems.length - 1);
    } else if (activeStaleItems.length === 0) {
      setStaleIndex(0);
    }
  }, [activeStaleItems.length, staleIndex]);

  // Clamp oldInboxIndex when list shrinks
  useEffect(() => {
    if (oldInboxIndex >= activeOldInboxItems.length && activeOldInboxItems.length > 0) {
      setOldInboxIndex(activeOldInboxItems.length - 1);
    } else if (activeOldInboxItems.length === 0) {
      setOldInboxIndex(0);
    }
  }, [activeOldInboxItems.length, oldInboxIndex]);

  // Set/clear nudge based on view-specific stale/old items
  useEffect(() => {
    // Focus view: stale queue items
    if (state.currentView === 'focus' && activeStaleItems.length > 0) {
      const currentIdx = Math.min(staleIndex, activeStaleItems.length - 1);
      const { task, days } = activeStaleItems[currentIdx];
      const title = task.title.slice(0, 20) + (task.title.length > 20 ? '...' : '');
      const countSuffix = activeStaleItems.length > 1
        ? ` (${currentIdx + 1}/${activeStaleItems.length})`
        : '';
      aiAssistant.setNudge({
        type: 'nudge',
        text: `"${title}" untouched ${days}d${countSuffix}`,
        icon: '👀',
        action: {
          label: 'Review',
          onClick: () => handleOpenTask(task.id),
        },
      });
      return;
    }

    // Tasks view: old inbox items
    if (state.currentView === 'tasks' && activeOldInboxItems.length > 0) {
      const currentIdx = Math.min(oldInboxIndex, activeOldInboxItems.length - 1);
      const { task, days } = activeOldInboxItems[currentIdx];
      const title = task.title.slice(0, 20) + (task.title.length > 20 ? '...' : '');
      const countSuffix = activeOldInboxItems.length > 1
        ? ` (${currentIdx + 1}/${activeOldInboxItems.length})`
        : '';
      aiAssistant.setNudge({
        type: 'nudge',
        text: `"${title}" ${days}d in inbox${countSuffix}`,
        icon: '📥',
        action: {
          label: 'Review',
          onClick: () => handleOpenTask(task.id),
        },
      });
      return;
    }

    // No nudge applicable — clear if one is showing
    if (aiAssistant.state.collapsedContent.type === 'nudge') {
      aiAssistant.clearNudge();
    }
  }, [state.currentView, activeStaleItems, staleIndex, activeOldInboxItems, oldInboxIndex]);

  // Show Start Poke alert in MiniBar when there's an active (fired but unacknowledged) start poke
  // This takes priority over regular nudges
  useEffect(() => {
    const activePoke = getAnyActiveStartPoke(notifications);

    if (activePoke && activePoke.taskId) {
      const task = state.tasks.find((t) => t.id === activePoke.taskId);
      if (task) {
        const status = getStartPokeStatus(task, state.userSettings);
        // Format poke time (when to start) for display - no emoji since icon already shows it
        const pokeTime = status.nudgeTime;
        const pokeTimeStr = pokeTime
          ? new Date(pokeTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          : '';
        const taskTitle = task.title.length > 25 ? task.title.slice(0, 25) + '...' : task.title;
        aiAssistant.setCollapsedContent({
          type: 'start_poke',
          text: pokeTimeStr
            ? `Start "${taskTitle}" at ${pokeTimeStr}`
            : `Start "${taskTitle}"`,
          startPokeAlert: {
            taskId: task.id,
            taskTitle: task.title,
            notificationId: activePoke.id,
            anchorTime: status.anchorTime ?? (Date.now() + 30 * 60000),
            durationMinutes: status.durationMinutes ?? (task.estimatedDurationMinutes ?? 30),
            bufferMinutes: status.bufferMinutes ?? state.userSettings.startPokeBufferMinutes,
          },
        });
        return;
      }
    }

    // Clear start_poke if no longer active (but don't clear other content types)
    if (aiAssistant.state.collapsedContent.type === 'start_poke') {
      aiAssistant.setCollapsedContent({
        type: 'idle',
        text: 'Ask AI...',
      });
    }
  }, [notifications, state.tasks, state.userSettings, aiAssistant.state.collapsedContent.type]);

  const handleDismissStaleItem = useCallback((itemId: string) => {
    setDismissedStaleIds((prev) => { const next = new Set(prev); next.add(itemId); return next; });
  }, []);

  const handleNextStaleItem = useCallback(() => {
    setStaleIndex((prev) => (prev + 1) % Math.max(activeStaleItems.length, 1));
  }, [activeStaleItems.length]);

  const handleDismissOldInboxItem = useCallback((taskId: string) => {
    setDismissedOldInboxIds((prev) => { const next = new Set(prev); next.add(taskId); return next; });
  }, []);

  const handleNextOldInboxItem = useCallback(() => {
    setOldInboxIndex((prev) => (prev + 1) % Math.max(activeOldInboxItems.length, 1));
  }, [activeOldInboxItems.length]);

  // ============================================
  // Navigation
  // ============================================

  const handleViewChange = useCallback((view: ViewType) => {
    aiAssistant.clearNudge();
    // Close any open drawer on navigation
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    setState((prev) => {
      if (prev.currentView === view) {
        // Same tab tapped again — scroll to top
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        if (view === 'tasks') {
          setActiveTasksTab('staging');
        }
        return prev;
      }

      return {
        ...prev,
        currentView: view,
        // Clear active task when navigating to main views
        activeTaskId: ['focus', 'tasks', 'inbox', 'search'].includes(view) ? null : prev.activeTaskId,
      };
    });
  }, [aiAssistant]);

  // ============================================
  // Inline AI Actions (Step-Level)
  // ============================================

  // Clear AI target context (called on response complete or dismiss)
  const clearAITargetContext = useCallback(() => {
    setAITargetContext(null);
  }, []);

  // Handle opening AI palette for a specific step (sparkle button)
  // Sets target context and expands palette - quick actions shown IN palette
  const handleOpenAIPalette = useCallback((taskId: string, stepId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    // For recurring tasks, look for step in active instance
    let step: Step | undefined;
    if (task.isRecurring && task.recurrence) {
      const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
      const instance = task.recurringInstances?.find(i => i.date === activeDate);
      if (instance) {
        step = instance.steps?.find(s => s.id === stepId);
      }
    }
    // Fall back to template steps for non-recurring tasks
    if (!step) {
      step = task.steps.find(s => s.id === stepId);
    }
    if (!step) return;

    // Set target context (for highlighting and context badge)
    const targetContext: AITargetContext = {
      type: 'step',
      taskId,
      stepId,
      label: step.text.length > 40 ? step.text.substring(0, 40) + '...' : step.text,
    };
    setAITargetContext(targetContext);

    // Scroll target step into view (especially for mobile)
    setTimeout(() => {
      const stepEl = document.querySelector(`[data-step-id="${stepId}"]`);
      if (stepEl) {
        stepEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);

    // Expand palette - step-specific quick actions will be shown there
    aiAssistant.expand();
  }, [state.tasks, aiAssistant]);

  const handleOpenTask = useCallback((taskId: string, mode?: 'executing' | 'managing') => {
    // Close any open drawer on navigation
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    // Save current view before navigating to task detail
    setPreviousView(state.currentView);
    setState((prev) => ({
      ...prev,
      currentView: 'taskDetail',
      activeTaskId: taskId,
      // Default to 'executing' mode if not specified
      taskDetailMode: mode || 'executing',
    }));
    // Track recent task (for search empty state)
    setRecentTaskIds(prev => {
      const filtered = prev.filter(id => id !== taskId);
      return [taskId, ...filtered].slice(0, 5); // Keep max 5
    });
  }, [state.currentView, aiAssistant]);

  const handleBackToList = useCallback(() => {
    // Close any open drawer on navigation
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    setState((prev) => ({
      ...prev,
      // Safety: Prevent stuck state if previousView points to current view or 'taskDetail'
      currentView: previousView === 'taskDetail' || previousView === prev.currentView ? 'focus' : previousView,
      activeTaskId: null,
    }));
  }, [previousView, aiAssistant]);

  const handleToggleTaskDetailMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      taskDetailMode: prev.taskDetailMode === 'executing' ? 'managing' : 'executing',
    }));
  }, []);

  // ============================================
  // Notification Handlers
  // ============================================

  const handleNotificationTap = useCallback((notification: Notification) => {
    // Mark as acknowledged
    setNotifications((prev) => markNotificationAcknowledged(notification.id, prev));

    // Navigate to the task if there is one
    if (notification.taskId) {
      const task = state.tasks.find(t => t.id === notification.taskId);
      if (task) {
        setPreviousView(state.currentView);
        setState((prev) => ({
          ...prev,
          currentView: 'taskDetail',
          activeTaskId: notification.taskId,
        }));
      }
    }
  }, [state.tasks, state.currentView]);

  const handleDismissNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => markNotificationAcknowledged(notificationId, prev));
  }, []);

  const handleSnoozeNotification = useCallback((notificationId: string, minutes: number) => {
    setNotifications((prev) => snoozeNotification(notificationId, prev, minutes));
  }, []);

  const handleCancelNotification = useCallback((notificationId: string) => {
    // Remove the notification entirely (for upcoming/scheduled notifications)
    setNotifications((prev) => prev.filter(n => n.id !== notificationId));
  }, []);

  const handleOpenNotificationSettings = useCallback(() => {
    setPreviousView(state.currentView);
    setState((prev) => ({
      ...prev,
      currentView: 'settings',
    }));
  }, [state.currentView]);

  const handleUpdateUserSettings = useCallback((updates: Partial<AppState['userSettings']>) => {
    setState((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        ...updates,
      },
    }));
  }, []);
  const handleEnergyChange = useCallback((energy: EnergyLevel | null) => {
    setState((prev) => ({
      ...prev,
      currentEnergy: energy,
      currentEnergySetAt: energy ? Date.now() : null,
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

  // Create task, add to focus queue, and open TaskDetail (for Focus view intentional capture)
  const handleCreateTaskForFocus = useCallback((title: string) => {
    // Save current view for back navigation
    setPreviousView('focus');

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
        // Navigate to TaskDetail for intentional enrichment
        activeTaskId: newTask.id,
        currentView: 'taskDetail',
      };
    });
  }, []);

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    let completedTask: Task | undefined;
    let showCompletionToast: boolean = false;
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      const isBeingCompleted = updates.status === 'complete' && task?.status !== 'complete';
      const now = Date.now();

      // Track if we should show completion toast (only on task detail view)
      if (isBeingCompleted && task && prev.currentView === 'taskDetail') {
        completedTask = task;
        showCompletionToast = true;
      }

      // If task is being completed, remove from queue and adjust todayLineIndex
      if (isBeingCompleted && task) {
        // Find position of item being removed (in active items order)
        const activeItems = prev.focusQueue.items
          .filter((i) => !i.completed)
          .sort((a, b) => a.order - b.order);
        const itemIndex = activeItems.findIndex((i) => i.taskId === taskId);

        // Adjust line if item was above it
        const newTodayLineIndex = itemIndex !== -1 && itemIndex < prev.focusQueue.todayLineIndex
          ? Math.max(0, prev.focusQueue.todayLineIndex - 1)
          : prev.focusQueue.todayLineIndex;

        // Remove the item and reindex
        const newItems = prev.focusQueue.items
          .filter((i) => i.taskId !== taskId)
          .map((item, idx) => ({ ...item, order: idx }));

        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? { ...t, ...updates, updatedAt: now }
              : t
          ),
          focusQueue: {
            ...prev.focusQueue,
            items: newItems,
            todayLineIndex: newTodayLineIndex,
          },
          // Exit focus mode if active
          focusMode: prev.currentView === 'focusMode'
            ? { ...prev.focusMode, active: false, currentStepId: null }
            : prev.focusMode,
        };
      }

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, ...updates, updatedAt: now }
            : t
        ),
      };
    });

    // Show success toast for task completion (only on task detail view)
    if (showCompletionToast && completedTask) {
      // Set previousView so back button returns to Focus Queue
      setPreviousView('focus');

      const taskTitle = completedTask.title || 'Task';
      const toastId = generateId();
      setToasts((prev) => [...prev, {
        id: toastId,
        message: `"${taskTitle.slice(0, 25)}${taskTitle.length > 25 ? '...' : ''}" completed!`,
        type: 'success',
      }]);
    }

    // Handle notification scheduling based on update type
    // Fields that affect start poke calculation
    const notificationFields = [
      'estimatedDurationMinutes', 'estimatedMinutes',
      'deadlineDate', 'deadlineTime',
      'targetDate', 'targetTime',
      'startPokeOverride',
      'recurrence',
    ];

    // If task is being completed, cancel notifications
    if (updates.status === 'complete') {
      cancelNotificationForTask(taskId);
    } else if (Object.keys(updates).some(key => notificationFields.includes(key))) {
      // Reschedule notification if relevant fields changed
      setState((prev) => {
        const updatedTask = prev.tasks.find(t => t.id === taskId);
        if (updatedTask && updatedTask.status !== 'complete') {
          // Schedule asynchronously to avoid nested setState issues
          setTimeout(() => scheduleNotificationForTask(updatedTask), 0);
        }
        return prev;
      });
    }
  }, [cancelNotificationForTask, scheduleNotificationForTask]);

  const handleDeleteTask = useCallback((taskId: string) => {
    // Cancel any pending notifications for this task
    cancelNotificationForTask(taskId);

    let deletedTask: Task | undefined;
    let removedQueueItemId: string | undefined;
    setState((prev) => {
      deletedTask = prev.tasks.find((t) => t.id === taskId);

      // Find and remove queue item for this task
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const queueItem = activeItems.find((i) => i.taskId === taskId);
      const queueItemIndex = queueItem ? activeItems.indexOf(queueItem) : -1;
      removedQueueItemId = queueItem?.id;

      // Adjust todayLineIndex if removing item above the line
      const newTodayLineIndex = queueItemIndex !== -1 && queueItemIndex < prev.focusQueue.todayLineIndex
        ? prev.focusQueue.todayLineIndex - 1
        : prev.focusQueue.todayLineIndex;

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, deletedAt: Date.now() }
            : t
        ),
        focusQueue: {
          ...prev.focusQueue,
          items: prev.focusQueue.items.filter((i) => i.taskId !== taskId).map((item, idx) => ({ ...item, order: idx })),
          todayLineIndex: Math.max(0, newTodayLineIndex),
        },
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
              // Note: Queue item is not restored on undo (would need more complex state tracking)
            }));
          },
        },
      }]);
    }
  }, [cancelNotificationForTask]);

  // Send task to pool (triage complete)
  const handleSendToPool = useCallback((taskId: string) => {
    let sentTask: Task | undefined;
    setState((prev) => {
      sentTask = prev.tasks.find((t) => t.id === taskId);
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: 'pool' as const, updatedAt: Date.now() }
            : t
        ),
      };
    });

    // Show toast with undo action
    if (sentTask) {
      const taskTitle = sentTask.title || 'Task';
      const toastId = generateId();
      setToasts((prev) => [...prev, {
        id: toastId,
        message: `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" moved to Ready`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            setState((prev) => ({
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, status: 'inbox' as const, updatedAt: Date.now() }
                  : t
              ),
            }));
          },
        },
      }]);
    }
  }, []);

  // Defer task until a future date
  const handleDefer = useCallback((taskId: string, until: string) => {
    let deferredTask: Task | undefined;
    let previousDeferredUntil: string | null = null;
    let previousDeferredAt: number | null = null;
    let previousDeferredCount: number = 0;
    let previousDeferredFrom: 'focus' | 'ready' | null = null;
    let removedQueueItem: FocusQueueItem | undefined;

    setState((prev) => {
      deferredTask = prev.tasks.find((t) => t.id === taskId);
      if (deferredTask) {
        previousDeferredUntil = deferredTask.deferredUntil;
        previousDeferredAt = deferredTask.deferredAt;
        previousDeferredCount = deferredTask.deferredCount;
        previousDeferredFrom = deferredTask.deferredFrom;
      }

      // Check if task is in focus queue
      removedQueueItem = prev.focusQueue.items.find(item => item.taskId === taskId);
      const isInFocusQueue = !!removedQueueItem;

      // Determine origin location
      const deferredFrom: 'focus' | 'ready' | null = isInFocusQueue ? 'focus' : 'ready';

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'pool' as const,
                deferredUntil: until,
                deferredAt: Date.now(),
                deferredCount: t.deferredCount + 1,
                deferredFrom,
                updatedAt: Date.now(),
              }
            : t
        ),
        // Remove from focus queue if present
        focusQueue: {
          ...prev.focusQueue,
          items: prev.focusQueue.items.filter(item => item.taskId !== taskId),
        },
      };
    });

    // Show toast with undo action
    if (deferredTask) {
      const taskTitle = deferredTask.title || 'Task';
      const toastId = generateId();
      setToasts((prev) => [...prev, {
        id: toastId,
        message: `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" deferred until ${until}`,
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
                      deferredUntil: previousDeferredUntil,
                      deferredAt: previousDeferredAt,
                      deferredCount: previousDeferredCount,
                      deferredFrom: previousDeferredFrom,
                      updatedAt: Date.now(),
                    }
                  : t
              ),
              // Restore queue item if it was removed
              focusQueue: removedQueueItem
                ? {
                    ...prev.focusQueue,
                    items: [...prev.focusQueue.items, removedQueueItem],
                  }
                : prev.focusQueue,
            }));
          },
        },
      }]);
    }
  }, []);

  // Clear defer and optionally restore to focus queue
  const handleClearDefer = useCallback((taskId: string) => {
    let clearedTask: Task | undefined;
    let restoredToFocus = false;

    setState((prev) => {
      clearedTask = prev.tasks.find((t) => t.id === taskId);
      if (!clearedTask) return prev;

      const wasFromFocus = clearedTask.deferredFrom === 'focus';
      restoredToFocus = wasFromFocus;

      // Clear defer fields on task
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              deferredUntil: null,
              deferredAt: null,
              deferredFrom: null,
              updatedAt: Date.now(),
            }
          : t
      );

      // If was from focus, add back to queue
      if (wasFromFocus) {
        const task = updatedTasks.find((t) => t.id === taskId)!;
        const newItem = createFocusQueueItem(taskId, 'today', {
          selectionType: 'all_upcoming',
          selectedStepIds: []
        });

        const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
        const completedItems = prev.focusQueue.items.filter((i) => i.completed);
        const todaySection = activeItems.slice(0, prev.focusQueue.todayLineIndex);
        const laterSection = activeItems.slice(prev.focusQueue.todayLineIndex);

        // Insert at beginning of Upcoming section (just after Today line)
        const newItems = [...todaySection, { ...newItem, order: todaySection.length }, ...laterSection, ...completedItems]
          .map((item, idx) => ({ ...item, order: idx }));

        return {
          ...prev,
          tasks: updatedTasks,
          focusQueue: {
            ...prev.focusQueue,
            items: newItems,
            // todayLineIndex stays the same since we're adding to Upcoming
          },
        };
      }

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

    // Show toast
    if (clearedTask) {
      const taskTitle = clearedTask.title || 'Task';
      const toastId = generateId();
      setToasts((prev) => [...prev, {
        id: toastId,
        message: restoredToFocus
          ? `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" restored to Focus`
          : `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" moved to Ready`,
        type: 'success',
      }]);
    }
  }, []);

  // Clear waiting on status
  const handleClearWaitingOn = useCallback((taskId: string) => {
    let clearedTask: Task | undefined;

    setState((prev) => {
      clearedTask = prev.tasks.find((t) => t.id === taskId);
      if (!clearedTask) return prev;

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                waitingOn: null,
                updatedAt: Date.now(),
              }
            : t
        ),
      };
    });

    // Show toast
    if (clearedTask) {
      const taskTitle = clearedTask.title || 'Task';
      const toastId = generateId();
      setToasts((prev) => [...prev, {
        id: toastId,
        message: `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" no longer waiting`,
        type: 'success',
      }]);
    }
  }, []);

  // Park task (archive for later)
  const handlePark = useCallback((taskId: string) => {
    let parkedTask: Task | undefined;
    let previousStatus: Task['status'] | undefined;
    setState((prev) => {
      parkedTask = prev.tasks.find((t) => t.id === taskId);
      previousStatus = parkedTask?.status;

      // Find and remove queue item for this task
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const queueItem = activeItems.find((i) => i.taskId === taskId);
      const queueItemIndex = queueItem ? activeItems.indexOf(queueItem) : -1;

      // Adjust todayLineIndex if removing item above the line
      const newTodayLineIndex = queueItemIndex !== -1 && queueItemIndex < prev.focusQueue.todayLineIndex
        ? prev.focusQueue.todayLineIndex - 1
        : prev.focusQueue.todayLineIndex;

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
        focusQueue: {
          ...prev.focusQueue,
          items: prev.focusQueue.items.filter((i) => i.taskId !== taskId).map((item, idx) => ({ ...item, order: idx })),
          todayLineIndex: Math.max(0, newTodayLineIndex),
        },
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
              // Note: Queue item is not restored on undo (would need more complex state tracking)
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

    // Call pending callback to auto-select the new project (from TaskCreationPopover)
    if (pendingProjectCallback) {
      pendingProjectCallback(newProject.id);
      setPendingProjectCallback(null);
    }
  }, [pendingProjectCallback]);

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

  // Callback version for auto-selecting new project (used by TaskCreationPopover)
  const handleOpenProjectModalWithCallback = useCallback((callback: (projectId: string) => void) => {
    setPendingProjectCallback(() => callback);
    setEditingProject(null);
    setProjectModalOpen(true);
  }, []);

  // ============================================
  // Date Picker Modal Handlers
  // ============================================

  const handleOpenDatePickerModal = useCallback((callback: (dateStr: string) => void) => {
    setPendingDateCallback(() => callback);
    setDatePickerModalOpen(true);
  }, []);

  const handleSelectDate = useCallback((dateStr: string) => {
    setDatePickerModalOpen(false);
    if (pendingDateCallback) {
      pendingDateCallback(dateStr);
      setPendingDateCallback(null);
    }
  }, [pendingDateCallback]);

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

  // Rescan all tasks and regenerate pokes based on current settings
  const handleRescanPokes = useCallback(() => {
    const settings = getPokeSettings();
    const { notifications: updated, result } = rescanAllTasksForPokes(
      state.tasks,
      settings,
      notifications
    );

    setNotifications(updated);

    // Also reschedule PWA notifications for newly created pokes
    result.scheduled
      .filter(s => s.type === 'start_poke')
      .forEach(s => {
        const task = state.tasks.find(t => t.id === s.taskId);
        const notification = updated.find(n => n.taskId === s.taskId && n.type === 'start_poke' && !n.firedAt);
        if (task && notification) {
          scheduleStartPokePWA(task, state.userSettings, notification.id);
        }
      });

    // Log results for debugging
    console.log('[Rescan Pokes] Results:', {
      cancelled: result.cancelled,
      scheduled: result.scheduled.length,
      skipped: result.skipped.length,
    });
    console.log('[Rescan Pokes] Scheduled:', result.scheduled);
    console.log('[Rescan Pokes] Skipped:', result.skipped);

    // Show toast with summary
    showToast({
      type: 'success',
      message: `Rescanned: ${result.scheduled.length} pokes scheduled, ${result.skipped.length} skipped`,
    });
  }, [state.tasks, state.userSettings, notifications, getPokeSettings, showToast]);

  // Quick dump task to inbox (no navigation) - for Tasks view quick capture
  const handleCreateTaskQuick = useCallback((title: string) => {
    const newTask = createTask(title);
    setState((prev) => {
      const newTasks = [...prev.tasks, newTask];
      logTaskCreated(newTask, newTasks);
      return {
        ...prev,
        tasks: newTasks,
        // NO navigation - stay in current view
      };
    });
    showToast({ message: 'Task added to Inbox', type: 'info' });
  }, [showToast]);

  // Quick add task from popover (with optional project) - stays in view
  const handleQuickAddTask = useCallback((title: string, projectId: string | null) => {
    const newTask = createTask(title);
    if (projectId) {
      newTask.projectId = projectId;
    }
    setState((prev) => {
      const newTasks = [...prev.tasks, newTask];
      logTaskCreated(newTask, newTasks);
      return {
        ...prev,
        tasks: newTasks,
      };
    });
    showToast({
      message: 'Added to Inbox',
      type: 'success',
      action: {
        label: 'Show',
        onClick: () => {
          setPendingFilter('staging');
          handleViewChange('tasks');
        },
      },
    });
  }, [showToast, handleViewChange]);

  // Add task from popover and navigate to TaskDetail
  const handleAddAndOpenTask = useCallback((title: string, projectId: string | null) => {
    const newTask = createTask(title);
    if (projectId) {
      newTask.projectId = projectId;
    }
    setPreviousView(state.currentView);
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
    setTaskCreationOpen(false);
  }, [state.currentView]);

  // Add task to queue (new: position-based, not horizon-based)
  // If forToday=true, insert at position todayLineIndex (moves line down)
  // If forToday=false, insert just after the line
  // selectionType + selectedStepIds: determines Today/Upcoming step selection
  const handleAddToQueue = useCallback((
    taskId: string,
    forToday: boolean = false,
    selectionType?: 'all_today' | 'all_upcoming' | 'specific_steps',
    selectedStepIds: string[] = []
  ) => {
    // Derive selectionType from forToday if not explicitly provided
    const effectiveSelectionType = selectionType ?? (forToday ? 'all_today' : 'all_upcoming');

    let addedTask: Task | undefined;
    let addedItemId: string | undefined;
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;
      addedTask = task;

      // Check if already in queue
      if (prev.focusQueue.items.some((i) => i.taskId === taskId && !i.completed)) {
        return prev;
      }

      // Ensure task is in pool
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId && t.status === 'inbox'
          ? { ...t, status: 'pool' as const, updatedAt: Date.now() }
          : t
      );

      const newItem = createFocusQueueItem(taskId, 'today', { selectionType: effectiveSelectionType, selectedStepIds }); // horizon kept for type compat
      addedItemId = newItem.id;

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

    // Show toast with undo action
    if (addedTask && addedItemId) {
      const taskTitle = addedTask.title || 'Task';
      const toastId = generateId();
      const itemId = addedItemId;
      setToasts((prev) => [...prev, {
        id: toastId,
        message: `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" added to Focus`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            // Remove from queue
            setState((prev) => {
              const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
              const itemIndex = activeItems.findIndex((i) => i.id === itemId);
              const newTodayLineIndex = itemIndex !== -1 && itemIndex < prev.focusQueue.todayLineIndex
                ? prev.focusQueue.todayLineIndex - 1
                : prev.focusQueue.todayLineIndex;
              return {
                ...prev,
                focusQueue: {
                  ...prev.focusQueue,
                  items: prev.focusQueue.items.filter((i) => i.id !== itemId).map((item, idx) => ({ ...item, order: idx })),
                  todayLineIndex: Math.max(0, newTodayLineIndex),
                },
              };
            });
          },
        },
      }]);
    }

    // Schedule start poke notification for the added task
    if (addedTask) {
      scheduleNotificationForTask(addedTask);
    }
  }, [scheduleNotificationForTask]);

  // Update step selection for an existing queue item
  // Also moves task between Today/Upcoming based on selection:
  // - If ANY steps selected for today (all_today or specific_steps) → task in Today
  // - If NO steps for today (all_upcoming) → task in Upcoming
  const handleUpdateStepSelection = useCallback((
    queueItemId: string,
    selectionType: 'all_today' | 'all_upcoming' | 'specific_steps',
    selectedStepIds: string[]
  ) => {
    setState((prev) => {
      // IMPORTANT: Sort by order first (same as QueueView display)
      // todayLineIndex is relative to this sorted order, not raw array order
      const sortedItems = [...prev.focusQueue.items]
        .filter(i => !i.completed)
        .sort((a, b) => a.order - b.order);

      const sortedIndex = sortedItems.findIndex(i => i.id === queueItemId);
      if (sortedIndex === -1) return prev;

      // Update the item's selection
      // Clear selectedStepIds when moving to all_upcoming (no steps should be marked for "today")
      const updatedItem: FocusQueueItem = {
        ...sortedItems[sortedIndex],
        selectionType,
        selectedStepIds: selectionType === 'all_upcoming' ? [] : selectedStepIds,
        lastInteractedAt: Date.now(),
      };

      // Determine if task should be in Today or Upcoming based on SORTED position
      // all_today or specific_steps = has Today steps → should be in Today section
      // all_upcoming = no Today steps → should be in Upcoming section
      const hasAnyTodaySteps = selectionType !== 'all_upcoming';
      const currentlyInToday = sortedIndex < prev.focusQueue.todayLineIndex;

      // No movement needed if already in correct section
      if (hasAnyTodaySteps === currentlyInToday) {
        // Just update the item in place
        const newItems = prev.focusQueue.items.map(item =>
          item.id === queueItemId ? updatedItem : item
        );
        return { ...prev, focusQueue: { ...prev.focusQueue, items: newItems } };
      }

      // Remove item from sorted array
      sortedItems.splice(sortedIndex, 1);

      let newTodayLineIndex = prev.focusQueue.todayLineIndex;

      if (hasAnyTodaySteps && !currentlyInToday) {
        // Move from Upcoming → Today (insert at end of Today section)
        sortedItems.splice(newTodayLineIndex, 0, updatedItem);
        newTodayLineIndex += 1;  // Line moves down to accommodate new Today item
      } else if (!hasAnyTodaySteps && currentlyInToday) {
        // Move from Today → Upcoming (insert at start of Upcoming section)
        newTodayLineIndex -= 1;  // Line moves up since we removed a Today item
        sortedItems.splice(newTodayLineIndex, 0, updatedItem);
      }

      // Re-assign order values to maintain visual order
      const reorderedItems = sortedItems.map((item, idx) => ({
        ...item,
        order: idx,
      }));

      // Also include any completed items that were filtered out
      const completedItems = prev.focusQueue.items.filter(i => i.completed);

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...reorderedItems, ...completedItems],
          todayLineIndex: newTodayLineIndex,
        },
      };
    });
  }, []);

  // Remove item from queue (adjusts todayLineIndex if item was above line)
  const handleRemoveFromQueue = useCallback((queueItemId: string) => {
    let removedItem: FocusQueueItem | undefined;
    let removedTask: Task | undefined;
    let wasAboveLine: boolean = false;
    setState((prev) => {
      const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
      const itemIndex = activeItems.findIndex((i) => i.id === queueItemId);
      removedItem = activeItems.find((i) => i.id === queueItemId);
      if (removedItem) {
        removedTask = prev.tasks.find((t) => t.id === removedItem!.taskId);
      }
      wasAboveLine = itemIndex !== -1 && itemIndex < prev.focusQueue.todayLineIndex;

      // If item is above the line, decrement todayLineIndex
      const newTodayLineIndex = wasAboveLine
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

    // Show toast with undo action
    if (removedItem && removedTask) {
      const taskTitle = removedTask.title || 'Task';
      const toastId = generateId();
      const item = { ...removedItem };
      const addedAboveLine = wasAboveLine;
      setToasts((prev) => [...prev, {
        id: toastId,
        message: `"${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}" moved to Tasks`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            // Add back to queue at same position
            setState((prev) => {
              const activeItems = prev.focusQueue.items.filter((i) => !i.completed);
              const completedItems = prev.focusQueue.items.filter((i) => i.completed);
              let newItems = [...activeItems, item, ...completedItems];
              let newTodayLineIndex = prev.focusQueue.todayLineIndex;
              if (addedAboveLine) {
                newTodayLineIndex = prev.focusQueue.todayLineIndex + 1;
              }
              newItems = newItems.map((i, idx) => ({ ...i, order: idx }));
              return {
                ...prev,
                focusQueue: {
                  ...prev.focusQueue,
                  items: newItems,
                  todayLineIndex: newTodayLineIndex,
                },
              };
            });
          },
        },
      }]);
    }
  }, []);

  // Complete a routine (uses active occurrence date for overdue support)
  const handleCompleteRoutine = useCallback((taskId: string) => {
    let taskTitle = '';
    let newStreak = 0;
    let previousTask: Task | undefined;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || !task.isRecurring) return prev;

      // Use active occurrence date (handles overdue rollover)
      const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
      taskTitle = task.title;
      previousTask = { ...task, recurringInstances: [...task.recurringInstances] };
      const updatedTask = markInstanceComplete(task, activeDate);
      newStreak = updatedTask.recurringStreak;

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      };
    });

    // Cancel notifications for this recurring task instance
    cancelNotificationForTask(taskId);

    // Show toast with streak info and undo
    const toastId = generateId();
    setToasts((prev) => [...prev, {
      id: toastId,
      message: `Completed! ${newStreak > 1 ? `${newStreak}d streak` : 'Streak started'}`,
      type: 'success',
      action: previousTask ? {
        label: 'Undo',
        onClick: () => {
          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === taskId ? previousTask! : t)),
          }));
        },
      } : undefined,
    }]);
  }, []);

  // Skip a routine (uses active occurrence date for overdue support)
  const handleSkipRoutine = useCallback((taskId: string) => {
    let taskTitle = '';
    let previousTask: Task | undefined;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || !task.isRecurring) return prev;

      // Use active occurrence date (handles overdue rollover)
      const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
      taskTitle = task.title;
      previousTask = { ...task, recurringInstances: [...task.recurringInstances] };
      const updatedTask = skipInstance(task, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      };
    });

    // Show toast with undo
    const toastId = generateId();
    setToasts((prev) => [...prev, {
      id: toastId,
      message: `Skipped "${taskTitle.slice(0, 20)}${taskTitle.length > 20 ? '...' : ''}"`,
      type: 'info',
      action: previousTask ? {
        label: 'Undo',
        onClick: () => {
          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === taskId ? previousTask! : t)),
          }));
        },
      } : undefined,
    }]);
  }, []);

  // Mark routine incomplete (uses active occurrence date for overdue support)
  const handleMarkRoutineIncomplete = useCallback((taskId: string) => {
    let taskTitle = '';
    let previousTask: Task | undefined;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || !task.isRecurring) return prev;

      // Use active occurrence date (handles overdue rollover)
      const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
      taskTitle = task.title;
      previousTask = { ...task, recurringInstances: [...task.recurringInstances] };
      const updatedTask = markInstanceIncomplete(task, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      };
    });

    // Show toast with undo
    const toastId = generateId();
    setToasts((prev) => [...prev, {
      id: toastId,
      message: `Marked incomplete`,
      type: 'info',
      action: previousTask ? {
        label: 'Undo',
        onClick: () => {
          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === taskId ? previousTask! : t)),
          }));
        },
      } : undefined,
    }]);
  }, []);

  // Reset current routine instance from template (re-clone steps)
  const handleResetFromTemplate = useCallback((taskId: string) => {
    let previousInstanceData: { steps: any[]; completed: boolean; completedAt: number | null } | null = null;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || !task.isRecurring || !task.recurrence) return prev;

      const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
      const instance = task.recurringInstances?.find((i) => i.date === activeDate);
      if (!instance) return prev;

      // Save old instance data for undo
      previousInstanceData = {
        steps: [...instance.steps],
        completed: instance.completed,
        completedAt: instance.completedAt,
      };

      // Clone fresh steps from template
      const freshSteps = cloneSteps(task.steps);

      // Update instance
      const updatedInstance = {
        ...instance,
        steps: freshSteps,
        completed: false,
        completedAt: null,
      };

      const updatedInstances = task.recurringInstances
        .filter((i) => i.date !== activeDate)
        .concat(updatedInstance);

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, recurringInstances: updatedInstances, updatedAt: Date.now() }
            : t
        ),
      };
    });

    // Show toast with undo
    const toastId = generateId();
    setToasts((prev) => [...prev, {
      id: toastId,
      message: 'Steps reset from template',
      type: 'success',
      action: previousInstanceData ? {
        label: 'Undo',
        onClick: () => {
          setState((prev) => {
            const task = prev.tasks.find((t) => t.id === taskId);
            if (!task) return prev;
            const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
            const instance = task.recurringInstances?.find((i) => i.date === activeDate);
            if (!instance) return prev;

            const restoredInstance = {
              ...instance,
              ...previousInstanceData!,
            };

            const updatedInstances = task.recurringInstances
              .filter((i) => i.date !== activeDate)
              .concat(restoredInstance);

            return {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, recurringInstances: updatedInstances, updatedAt: Date.now() }
                  : t
              ),
            };
          });
        },
      } : undefined,
    }]);
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

      // Line adjustment is handled entirely by QueueView which has full visual context
      const newTodayLineIndex = prev.focusQueue.todayLineIndex;

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

      // Sync selectionType when item crosses the Today/Upcoming line
      const syncedReordered = reordered.map(i => {
        if (i.id !== queueItemId) return i;
        if (!wasAboveLine && nowAboveLine && i.selectionType !== 'all_today') {
          return { ...i, selectionType: 'all_today' as const, selectedStepIds: [] };
        }
        if (wasAboveLine && !nowAboveLine && i.selectionType !== 'all_upcoming') {
          return { ...i, selectionType: 'all_upcoming' as const, selectedStepIds: [] };
        }
        return i;
      });

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...syncedReordered, ...completedItems],
          todayLineIndex: Math.min(newTodayLineIndex, syncedReordered.length),
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

      // Sync selectionType when item crosses the Today/Upcoming line
      const syncedReordered = reordered.map(i => {
        if (i.id !== queueItemId) return i;
        if (!wasAboveLine && nowAboveLine && i.selectionType !== 'all_today') {
          return { ...i, selectionType: 'all_today' as const, selectedStepIds: [] };
        }
        if (wasAboveLine && !nowAboveLine && i.selectionType !== 'all_upcoming') {
          return { ...i, selectionType: 'all_upcoming' as const, selectedStepIds: [] };
        }
        return i;
      });

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...syncedReordered, ...completedItems],
          todayLineIndex: Math.min(newTodayLineIndex, syncedReordered.length),
        },
      };
    });
  }, []);

  // Move the today line to a new position (kept for backwards compat with up/down buttons)
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

  // Unified reorder handler for visual-first drag/drop
  // Syncs selectionType with visual position when items cross the Today/Upcoming line
  const handleReorderQueue = useCallback((
    newItems: FocusQueueItem[],
    newTodayLineIndex: number
  ) => {
    setState((prev) => {
      const completedItems = prev.focusQueue.items.filter(i => i.completed);

      // Re-assign orders and sync selectionType with visual position
      const reorderedActive = newItems.map((item, idx) => {
        const isInTodaySection = idx < newTodayLineIndex;

        // If item moved to Today section but has all_upcoming or specific_steps, promote to all_today
        if (isInTodaySection && (item.selectionType === 'all_upcoming' || item.selectionType === 'specific_steps')) {
          return {
            ...item,
            order: idx,
            selectionType: 'all_today' as const,
            selectedStepIds: [], // all_today means all steps, so empty array
          };
        }

        // If item moved to Upcoming section but doesn't have all_upcoming, demote
        if (!isInTodaySection && item.selectionType !== 'all_upcoming') {
          return {
            ...item,
            order: idx,
            selectionType: 'all_upcoming' as const,
            selectedStepIds: [], // all_upcoming means no today steps
          };
        }

        // No change needed - already in sync
        return { ...item, order: idx };
      });

      return {
        ...prev,
        focusQueue: {
          ...prev.focusQueue,
          items: [...reorderedActive, ...completedItems],
          todayLineIndex: newTodayLineIndex,
        },
      };
    });
  }, []);

  // Start focus session
  const handleStartFocus = useCallback((queueItemId: string) => {
    // Close any open drawer on navigation
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    setState((prev) => {
      const queueItem = prev.focusQueue.items.find((i) => i.id === queueItemId);
      if (!queueItem) return prev;

      const task = prev.tasks.find((t) => t.id === queueItem.taskId);
      if (!task) return prev;

      // Find first incomplete step in scope
      const stepsInScope =
        queueItem.selectionType === 'all_today' || queueItem.selectionType === 'all_upcoming'
          ? task.steps
          : task.steps.filter((s) => queueItem.selectedStepIds.includes(s.id));
      const firstIncomplete = stepsInScope.find((s) => !s.completed);

      // Always save current view for back navigation when exiting focus
      setPreviousView(prev.currentView);

      return {
        ...prev,
        currentView: 'focusMode' as const,
        activeTaskId: task.id,
        focusQueue: {
          ...prev.focusQueue,
          items: prev.focusQueue.items.map((i) =>
            i.id === queueItemId ? { ...i, lastInteractedAt: Date.now() } : i
          ),
        },
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
  }, [aiAssistant]);

  // Handle "Start" action from notification
  const handleNotificationStart = useCallback((notification: Notification) => {
    // Close any open drawer on navigation
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    // Acknowledge the notification
    setNotifications((prev) => markNotificationAcknowledged(notification.id, prev));

    // Navigate to task if it exists
    if (notification.taskId) {
      const task = state.tasks.find(t => t.id === notification.taskId);
      if (task) {
        setPreviousView(state.currentView);
        setState((prev) => ({
          ...prev,
          currentView: 'taskDetail',
          activeTaskId: notification.taskId,
        }));

        // If task is in queue, start focus mode
        const queueItem = state.focusQueue.items.find((item) => item.taskId === notification.taskId);
        if (queueItem) {
          // Defer focus start slightly to let navigation complete
          setTimeout(() => handleStartFocus(queueItem.id), 100);
        }
      }
    }
  }, [state.tasks, state.focusQueue.items, state.currentView, handleStartFocus, aiAssistant]);

  // Start focus session for recurring task (no queue item needed)
  const handleStartRecurringFocus = useCallback((taskId: string) => {
    // Close any open drawer on navigation
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || !task.isRecurring) return prev;

      // Get current instance steps
      const activeDate = getActiveOccurrenceDate(task) || getTodayISO();
      const instance = ensureInstance(task, activeDate);

      // Find first incomplete step in the instance
      const firstIncomplete = instance.steps.find((s) => !s.completed);

      // Save current view for back navigation
      setPreviousView(prev.currentView);

      return {
        ...prev,
        currentView: 'focusMode' as const,
        activeTaskId: task.id,
        focusMode: {
          ...prev.focusMode,
          active: true,
          queueItemId: null, // No queue item for recurring tasks
          taskId: task.id,
          currentStepId: firstIncomplete?.id || null,
          startTime: Date.now(),
          paused: false,
          pausedTime: 0,
          pauseStartTime: null,
        },
      };
    });
  }, [aiAssistant]);

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

  // Open a drawer - closes any other open drawer first
  // This is the single point of control for drawer state
  const handleOpenDrawer = useCallback((drawer: DrawerType) => {
    if (drawer === null) {
      setActiveDrawer(null);
      return;
    }
    // Close AI drawer if it's open and we're opening a different drawer
    if (aiAssistant.state.mode === 'drawer' && drawer !== 'ai') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(drawer);
  }, [aiAssistant]);

  // Close the currently active drawer
  const handleCloseDrawer = useCallback(() => {
    setActiveDrawer(null);
  }, []);

  // Completed drawer toggle - wrapper for backwards compatibility
  const handleToggleCompletedDrawer = useCallback((open: boolean) => {
    if (open) {
      handleOpenDrawer('completed');
    } else {
      handleCloseDrawer();
    }
  }, [handleOpenDrawer, handleCloseDrawer]);

  // Open focus selection modal for a queue item
  const handleOpenFocusSelection = useCallback((queueItemId: string) => {
    setEditingFocusQueueItemId(queueItemId);
    handleOpenDrawer('focus-selection');
  }, [handleOpenDrawer]);

  // Close focus selection modal (clears state when drawer closes)
  useEffect(() => {
    if (activeDrawer !== 'focus-selection' && editingFocusQueueItemId) {
      setEditingFocusQueueItemId(null);
    }
  }, [activeDrawer, editingFocusQueueItemId]);

  // AI drawer open with mutual exclusivity
  const handleOpenAIDrawer = useCallback(() => {
    handleOpenDrawer('ai');
    aiAssistant.openDrawer();
  }, [handleOpenDrawer, aiAssistant]);

  // Data export/import
  const handleExportData = useCallback(() => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-tools-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImportData = useCallback((jsonString: string) => {
    return importData(jsonString);
  }, []);

  // Trigger file input for import
  const handleTriggerImport = useCallback(() => {
    importFileInputRef.current?.click();
  }, []);

  // Handle file selection for import
  const handleImportFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = handleImportData(content);
      if (result.success) {
        showToast({ message: "Data imported successfully. Refreshing...", type: "success" });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast({ message: `Import failed: ${result.error}`, type: "error" });
      }
    };
    reader.onerror = () => {
      showToast({ message: "Failed to read file", type: "error" });
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  }, [handleImportData, showToast]);

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
    // Open AI palette for help
    aiAssistant.expand();
  }, [aiAssistant]);

  const handleExitFocus = useCallback(() => {
    // Close any open drawer on navigation
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    let shouldSetPreviousViewToFocus = false;

    setState((prev) => {
      const focusedTask = prev.tasks.find((t) => t.id === prev.focusMode.taskId);
      const wasJustCompleted = focusedTask?.status === 'complete';

      // If task was just completed, navigate to task details to show success toast
      // Otherwise, go back to previous view
      const nextView = wasJustCompleted ? 'taskDetail' as ViewType : previousView;
      const nextActiveTaskId = wasJustCompleted ? focusedTask.id : prev.activeTaskId;

      // FIX: When returning to TaskDetail (completed or not), ensure back goes to Focus Queue
      // This prevents the stuck state where previousView points to 'taskDetail' itself
      if (nextView === 'taskDetail') {
        shouldSetPreviousViewToFocus = true;
      }

      return {
        ...prev,
        currentView: nextView,
        activeTaskId: nextActiveTaskId,
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
      };
    });

    // Set previousView to 'focus' so back button returns to Focus Queue
    if (shouldSetPreviousViewToFocus) {
      setPreviousView('focus');
    }
  }, [previousView, aiAssistant]);

  // ============================================
  // Step Operations
  // ============================================

  const handleStepComplete = useCallback((taskId: string, stepId: string, completed: boolean) => {
    let movedToUpcoming = false;
    let movedTaskTitle = '';
    let taskCompletedViaSteps = false;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      // RECURRING TASKS: Use step-utils + metadata helper
      if (task.isRecurring && task.recurrence) {
        const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
        let updatedTask = stepUtils.completeStep(task, stepId, completed, 'executing', activeDate);
        updatedTask = updateRecurringInstanceMeta(updatedTask, activeDate);

        const updatedTasks = prev.tasks.map((t) => t.id === taskId ? updatedTask : t);

        if (completed) {
          logStepCompleted(taskId, stepId, updatedTasks);
        }

        return { ...prev, tasks: updatedTasks };
      }

      // REGULAR TASKS: Original logic
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
        const now = Date.now();

        // Find position of item being removed (in active items order)
        const activeItems = prev.focusQueue.items
          .filter((i) => !i.completed)
          .sort((a, b) => a.order - b.order);
        const itemIndex = activeItems.findIndex((i) => i.taskId === taskId);

        // Adjust line if item was above it
        const newTodayLineIndex = itemIndex !== -1 && itemIndex < prev.focusQueue.todayLineIndex
          ? Math.max(0, prev.focusQueue.todayLineIndex - 1)
          : prev.focusQueue.todayLineIndex;

        // Remove the item from queue and reindex
        const newQueueItems = prev.focusQueue.items
          .filter((i) => i.taskId !== taskId)
          .map((item, idx) => ({ ...item, order: idx }));

        taskCompletedViaSteps = true;

        return {
          ...prev,
          tasks: updatedTasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'complete' as const, completedAt: now }
              : t
          ),
          focusQueue: {
            ...prev.focusQueue,
            items: newQueueItems,
            todayLineIndex: newTodayLineIndex,
          },
          focusMode: shouldExitFocus
            ? { ...prev.focusMode, active: false, currentStepId: null }
            : { ...prev.focusMode, currentStepId: nextStepId },
          // Stay in focusMode view to show celebration, user clicks Done to exit
        };
      }

      // Auto-move queue item to upcoming when today's steps are all done
      if (completed && updatedTask) {
        const activeItems = prev.focusQueue.items
          .filter((i) => !i.completed)
          .sort((a, b) => a.order - b.order);
        const completedItems = prev.focusQueue.items.filter((i) => i.completed);
        const queueItem = activeItems.find((qi) => qi.taskId === taskId);

        if (queueItem) {
          const itemIndex = activeItems.indexOf(queueItem);

          if (itemIndex >= 0 && itemIndex < prev.focusQueue.todayLineIndex) {
            // Determine which steps are "today's steps"
            let todayStepIds: string[];
            if (queueItem.selectionType === 'specific_steps') {
              todayStepIds = queueItem.selectedStepIds;
            } else if (queueItem.selectionType === 'all_today') {
              todayStepIds = updatedTask.steps.map((s) => s.id);
            } else {
              todayStepIds = [];
            }

            const todayAllDone = todayStepIds.length > 0 &&
              todayStepIds.every((id) => updatedTask.steps.find((s) => s.id === id)?.completed);

            if (todayAllDone) {
              movedToUpcoming = true;
              movedTaskTitle = updatedTask.title || 'Task';

              // Move to upcoming: remove from today, insert after today line
              const newItems = activeItems.filter((i) => i.id !== queueItem.id);
              const newTodayLine = prev.focusQueue.todayLineIndex - 1;
              newItems.splice(newTodayLine, 0, { ...queueItem, selectionType: 'all_upcoming' as const, selectedStepIds: [] });

              return {
                ...prev,
                tasks: updatedTasks,
                focusQueue: {
                  ...prev.focusQueue,
                  items: [...newItems.map((item, i) => ({ ...item, order: i })), ...completedItems],
                  todayLineIndex: newTodayLine,
                },
                focusMode: { ...prev.focusMode, currentStepId: nextStepId },
              };
            }
          }
        }
      }

      return {
        ...prev,
        tasks: updatedTasks,
        focusQueue: {
          ...prev.focusQueue,
          items: prev.focusQueue.items.map((i) =>
            i.taskId === taskId ? { ...i, lastInteractedAt: Date.now() } : i
          ),
        },
        focusMode: { ...prev.focusMode, currentStepId: nextStepId },
      };
    });

    if (movedToUpcoming) {
      const title = movedTaskTitle.slice(0, 25) + (movedTaskTitle.length > 25 ? '...' : '');
      setToasts((prev) => [...prev, {
        id: generateId(),
        message: `Today's steps done! "${title}" moved to Upcoming`,
        type: 'success',
      }]);
    }

    // Cancel notifications for the completed task
    if (taskCompletedViaSteps) {
      cancelNotificationForTask(taskId);
    }
  }, [cancelNotificationForTask]);

  const handleAddStep = useCallback((taskId: string, text: string, mode?: 'executing' | 'managing') => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const newStep = createStep(text, { source: 'manual', origin: 'manual' });
      const effectiveMode = mode || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.addStep(task, newStep, effectiveMode, undefined, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleDeleteStep = useCallback((taskId: string, stepId: string, mode?: 'executing' | 'managing') => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const effectiveMode = mode || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.deleteStep(task, stepId, effectiveMode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleSubstepComplete = useCallback((taskId: string, stepId: string, substepId: string, completed: boolean, mode?: 'executing' | 'managing') => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const effectiveMode = mode || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.completeSubstep(task, stepId, substepId, completed, effectiveMode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleUpdateStep = useCallback((taskId: string, stepId: string, text: string, mode?: 'executing' | 'managing') => {
    if (!text.trim()) return;
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const effectiveMode = mode || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.updateStepText(task, stepId, text, effectiveMode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleUpdateStepEstimate = useCallback((taskId: string, stepId: string, minutes: number | null) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const mode = (task.isRecurring && prev.taskDetailMode === 'executing') ? 'executing' : 'managing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.updateStepEstimate(task, stepId, minutes, 'user', mode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleUpdateSubstep = useCallback((taskId: string, stepId: string, substepId: string, text: string, mode?: 'executing' | 'managing') => {
    if (!text.trim()) return;
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const effectiveMode = mode || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.updateSubstepText(task, stepId, substepId, text, effectiveMode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleMoveStepUp = useCallback((taskId: string, stepId: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const mode = (prev.taskDetailMode as stepUtils.Mode) || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.moveStep(task, stepId, 'up', mode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleMoveStepDown = useCallback((taskId: string, stepId: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const mode = (prev.taskDetailMode as stepUtils.Mode) || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.moveStep(task, stepId, 'down', mode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleAddSubstep = useCallback((taskId: string, stepId: string, text: string, mode?: 'executing' | 'managing') => {
    if (!text.trim()) return;
    const newSubstep = {
      id: generateId(),
      text: text.trim(),
      shortLabel: null,
      completed: false,
      completedAt: null,
      skipped: false,
      source: 'manual' as const,
    };

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const effectiveMode = mode || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.addSubstep(task, stepId, newSubstep, effectiveMode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleDeleteSubstep = useCallback((taskId: string, stepId: string, substepId: string, mode?: 'executing' | 'managing') => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const effectiveMode = mode || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.deleteSubstep(task, stepId, substepId, effectiveMode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleMoveSubstepUp = useCallback((taskId: string, stepId: string, substepId: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const mode = (prev.taskDetailMode as stepUtils.Mode) || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.moveSubstep(task, stepId, substepId, 'up', mode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  const handleMoveSubstepDown = useCallback((taskId: string, stepId: string, substepId: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const mode = (prev.taskDetailMode as stepUtils.Mode) || 'executing';
      const activeDate = task.isRecurring ? (getActiveOccurrenceDate(task) || getRecurringTodayISO()) : undefined;
      const updatedTask = stepUtils.moveSubstep(task, stepId, substepId, 'down', mode, activeDate);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? updatedTask : t),
      };
    });
  }, []);

  // ============================================
  // AI Integration
  // ============================================

  // Auto-trigger AI breakdown request
  const handleAutoBreakdown = useCallback(() => {
    if (!state.activeTaskId) return;
    const task = state.tasks.find(t => t.id === state.activeTaskId);
    if (!task) return;

    // Generate contextual message and submit via new AI system
    const hasSteps = task.steps.length > 0;
    const message = hasSteps
      ? "Can you help me break down these steps further? Add substeps or additional steps as needed."
      : "Can you help me break this task down into concrete, actionable steps?";

    aiAssistant.directSubmit(message);
  }, [state.activeTaskId, state.tasks, aiAssistant]);

  // Stuck helpers - submit via new AI system
  const handleStuckBreakdown = useCallback(() => {
    if (!state.focusMode.currentStepId || !activeTask) return;
    const currentStep = activeTask.steps.find(s => s.id === state.focusMode.currentStepId);
    if (!currentStep) return;

    aiAssistant.directSubmit(`I'm stuck on this step: "${currentStep.text}". Can you break it down into smaller substeps?`);
  }, [state.focusMode.currentStepId, activeTask, aiAssistant]);

  const handleStuckFirstStep = useCallback(() => {
    if (!state.focusMode.currentStepId || !activeTask) return;
    const currentStep = activeTask.steps.find(s => s.id === state.focusMode.currentStepId);
    if (!currentStep) return;

    aiAssistant.directSubmit(`I'm stuck on this step: "${currentStep.text}". What's the very first tiny action I should take to get started?`);
  }, [state.focusMode.currentStepId, activeTask, aiAssistant]);

  const handleStuckExplain = useCallback(() => {
    if (!state.focusMode.currentStepId || !activeTask) return;
    const currentStep = activeTask.steps.find(s => s.id === state.focusMode.currentStepId);
    if (!currentStep) return;

    aiAssistant.directSubmit(`Can you explain what this step means in simple terms: "${currentStep.text}"? I'm not sure what I need to do.`);
  }, [state.focusMode.currentStepId, activeTask, aiAssistant]);

  // ============================================
  // Recommendation Handlers (What should I do?)
  // ============================================

  const handleRequestRecommendation = useCallback(async () => {
    // Get today items from the focus queue
    const todayLineIndex = state.focusQueue.todayLineIndex;
    const activeItems = state.focusQueue.items
      .filter(i => !i.completed)
      .sort((a, b) => a.order - b.order);

    const todayItemsData = activeItems.slice(0, todayLineIndex);
    const upcomingItemsData = activeItems.slice(todayLineIndex);

    // Build queue context for AI
    const todayItems = todayItemsData.map(item => {
      const task = state.tasks.find(t => t.id === item.taskId);
      const completedSteps = task?.steps.filter(s => s.completed).length || 0;
      const totalSteps = task?.steps.length || 0;
      return {
        taskId: item.taskId,
        taskTitle: task?.title || "Untitled",
        priority: task?.priority || null,
        targetDate: task?.targetDate || null,
        deadlineDate: task?.deadlineDate || null,
        completedSteps,
        totalSteps,
        effort: task?.effort || null,
        addedAt: item.addedAt,
        focusScore: task ? computeFocusScore(task) : 0,
      };
    });

    const upcomingItems = upcomingItemsData.map(item => {
      const task = state.tasks.find(t => t.id === item.taskId);
      return {
        taskId: item.taskId,
        taskTitle: task?.title || "Untitled",
        priority: task?.priority || null,
        targetDate: task?.targetDate || null,
        deadlineDate: task?.deadlineDate || null,
        focusScore: task ? computeFocusScore(task) : 0,
      };
    });

    // Don't proceed if no items to recommend
    if (todayItems.length === 0 && upcomingItems.length === 0) {
      showToast({
        type: 'info',
        message: 'Add some tasks to your queue first!',
      });
      return;
    }

    // Start loading in minibar/palette
    aiAssistant.startLoading();

    try {
      const response = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: "What should I work on next from my Focus Queue?",
          currentList: [],
          taskTitle: null,
          conversationHistory: [],
          queueMode: true,
          queueContext: {
            todayItems,
            upcomingItems,
            excludeTaskIds: excludedTaskIds,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`API error ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data = await response.json();

      if (data.recommendation) {
        // Build AIResponse with recommendation type
        const aiResponse: AIResponse = {
          type: 'recommendation',
          content: {
            taskId: data.recommendation.taskId,
            taskTitle: data.recommendation.taskTitle,
            reason: data.recommendation.reason,
            reasonType: data.recommendation.reasonType,
          } as RecommendationContent,
        };
        aiAssistant.receiveResponse(aiResponse);
      } else {
        // No recommendation available - show as text response
        aiAssistant.receiveResponse({
          type: 'text',
          content: { text: data.message || "I couldn't find a task to recommend. Try adding more tasks to your queue!" },
        });
      }
    } catch (error) {
      console.error("Recommendation request failed:", error);
      aiAssistant.setError('Failed to get recommendation. Try again?');
    }
  }, [state.focusQueue, state.tasks, excludedTaskIds, aiAssistant]);

  const handleSkipRecommendation = useCallback((taskId: string) => {
    // Add current recommendation to excluded list and re-query
    setExcludedTaskIds(prev => [...prev, taskId]);

    // Trigger a new recommendation request (will automatically exclude the skipped task)
    setTimeout(() => {
      handleRequestRecommendation();
    }, 100);
  }, [handleRequestRecommendation]);

  const handleStartRecommendedFocus = useCallback((taskId: string) => {
    // Find the queue item for this task
    const queueItem = state.focusQueue.items.find(
      item => item.taskId === taskId && !item.completed
    );

    if (queueItem) {
      // Clear excluded list for next time
      setExcludedTaskIds([]);

      // Start focus on this item
      handleStartFocus(queueItem.id);
    }
  }, [state.focusQueue.items, handleStartFocus]);

  const handleDismissRecommendation = useCallback(() => {
    setExcludedTaskIds([]);
    aiAssistant.dismissResponse();
  }, [aiAssistant]);

  // ============================================
  // Staging Area Handlers
  // ============================================

  const handleAcceptSuggestion = useCallback((suggestion: SuggestedStep) => {
    if (!state.activeTaskId) return;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === state.activeTaskId);
      if (!task) return prev;

      const staging = task.staging;
      const remainingSuggestions = staging?.suggestions.filter((s) => s.id !== suggestion.id) || [];
      const updatedStaging = staging
        ? {
            ...staging,
            suggestions: remainingSuggestions,
            pendingAction: remainingSuggestions.length === 0 ? null : staging.pendingAction,
          }
        : null;

      // Check if this is a recurring task in executing mode - add to instance instead of template
      const isRecurringExecuting = task.isRecurring && task.recurrence && state.taskDetailMode === 'executing';

      if (isRecurringExecuting) {
        // Add to instance.steps
        const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
        let instances = [...(task.recurringInstances || [])];
        let instanceIndex = instances.findIndex(i => i.date === activeDate);

        // Ensure instance exists
        if (instanceIndex === -1) {
          const newInstance = createInstance(task, activeDate);
          instances.push(newInstance);
          instanceIndex = instances.length - 1;
        }

        const instance = instances[instanceIndex];

        // Check if this should be added as a substep to an existing step
        if (suggestion.parentStepId) {
          const parentStepIndex = instance.steps.findIndex(s => s.id === suggestion.parentStepId);

          if (parentStepIndex >= 0) {
            const newSubstep = {
              id: suggestion.id,
              text: suggestion.text,
              shortLabel: null,
              completed: false,
              completedAt: null,
              skipped: false,
              source: 'ai_suggested' as const,
            };

            const updatedSteps = [...instance.steps];
            updatedSteps[parentStepIndex] = {
              ...updatedSteps[parentStepIndex],
              substeps: [...updatedSteps[parentStepIndex].substeps, newSubstep],
            };
            instances[instanceIndex] = { ...instance, steps: updatedSteps };

            return {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === state.activeTaskId
                  ? { ...t, recurringInstances: instances, staging: updatedStaging, updatedAt: Date.now() }
                  : t
              ),
            };
          }
          // Parent step not found - fall through to add as top-level step
        }

        // Add as new step to instance.steps
        const newStep = createStep(suggestion.text, {
          id: suggestion.id,
          source: 'ai_suggested',
          origin: 'ai',
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

        instances[instanceIndex] = {
          ...instance,
          steps: [...instance.steps, newStep],
        };

        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === state.activeTaskId
              ? { ...t, recurringInstances: instances, staging: updatedStaging, updatedAt: Date.now() }
              : t
          ),
        };
      }

      // MANAGING MODE or NON-RECURRING: Add to task.steps (template)

      // Check if this should be added as a substep to an existing step
      if (suggestion.parentStepId) {
        // Verify parent step exists before trying to add substep
        const parentStepExists = task.steps.some(s => s.id === suggestion.parentStepId);

        if (parentStepExists) {
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
                staging: updatedStaging,
                updatedAt: Date.now(),
              };
            }),
          };
        }
        // Parent step not found - fall through to add as top-level step
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
        // Resolve display ID to UUID (AI provides "1", "2", etc.)
        const resolvedUUID = insertAfter === '0' ? '0' : resolveDisplayIdToUUID(insertAfter, task.steps) || insertAfter;
        const insertIndex = task.steps.findIndex((s) => s.id === resolvedUUID);
        if (insertIndex >= 0) {
          newSteps = [
            ...task.steps.slice(0, insertIndex + 1),
            newStep,
            ...task.steps.slice(insertIndex + 1),
          ];
        } else {
          console.warn(`[Accept Suggestion] Could not find step "${insertAfter}" (resolved: ${resolvedUUID}). Appending.`);
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
            ? { ...t, steps: newSteps, staging: updatedStaging, updatedAt: Date.now() }
            : t
        ),
      };
    });
  }, [state.activeTaskId, state.taskDetailMode]);

  const handleRejectSuggestion = useCallback((suggestionId: string) => {
    updateActiveStaging((staging) => {
      if (!staging) return null;
      const remainingSuggestions = staging.suggestions.filter((s) => s.id !== suggestionId);
      return {
        ...staging,
        suggestions: remainingSuggestions,
        pendingAction: remainingSuggestions.length === 0 ? null : staging.pendingAction,
      };
    });
  }, [updateActiveStaging]);

  const handleAcceptEdit = useCallback((edit: EditSuggestion) => {
    if (!state.activeTaskId) return;

    setState((prev) => {
      const task = prev.tasks.find(t => t.id === state.activeTaskId);
      if (!task) return prev;

      // Helper to apply edit to a step
      const applyEditToStep = (step: Step): Step => ({
        ...step,
        text: edit.newText,
        wasEdited: true,
        // Apply estimatedMinutes if provided (for estimate-only edits)
        ...(edit.estimatedMinutes !== undefined && {
          estimatedMinutes: edit.estimatedMinutes,
          estimateSource: 'ai' as const,
        }),
      });

      // Helper to apply edit to a substep
      const applyEditToSubstep = (sub: typeof task.steps[0]['substeps'][0]) => ({
        ...sub,
        text: edit.newText,
      });

      let updatedSteps: Step[];

      if (edit.targetType === 'step') {
        // Parse the display ID to get step index (1-based → 0-based)
        const stepIndex = parseInt(edit.targetId, 10) - 1;
        if (stepIndex >= 0 && stepIndex < task.steps.length) {
          updatedSteps = task.steps.map((s, idx) =>
            idx === stepIndex ? applyEditToStep(s) : s
          );
        } else {
          // Fallback: try matching by UUID (shouldn't happen but defensive)
          updatedSteps = task.steps.map((s) =>
            s.id === edit.targetId ? applyEditToStep(s) : s
          );
        }
      } else {
        // Substep: Parse "1a", "2b" format → parentIndex and substepIndex
        const match = edit.targetId.match(/^(\d+)([a-z])$/);
        if (match) {
          const parentIndex = parseInt(match[1], 10) - 1;
          const substepLetter = match[2];
          const substepIndex = substepLetter.charCodeAt(0) - 'a'.charCodeAt(0);

          updatedSteps = task.steps.map((s, sIdx) => {
            if (sIdx === parentIndex && substepIndex >= 0 && substepIndex < s.substeps.length) {
              return {
                ...s,
                substeps: s.substeps.map((sub, subIdx) =>
                  subIdx === substepIndex ? applyEditToSubstep(sub) : sub
                ),
              };
            }
            return s;
          });
        } else {
          // Fallback: try matching by parentId display index
          const parentIndex = edit.parentId ? parseInt(edit.parentId, 10) - 1 : -1;
          updatedSteps = task.steps.map((s, sIdx) =>
            sIdx === parentIndex
              ? {
                  ...s,
                  substeps: s.substeps.map((sub) =>
                    sub.id === edit.targetId ? applyEditToSubstep(sub) : sub
                  ),
                }
              : s
          );
        }
      }

      const updatedStaging = task.staging
        ? { ...task.staging, edits: task.staging.edits.filter((e) => e.targetId !== edit.targetId) }
        : null;

      // RECURRING TASKS in executing mode: Update instance steps, not template
      if (task.isRecurring && task.recurrence && state.taskDetailMode === 'executing') {
        const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
        let instance = task.recurringInstances?.find(i => i.date === activeDate);
        if (!instance) {
          instance = createInstance(task, activeDate);
        }

        // Parse step index from display ID
        const stepIndex = parseInt(edit.targetId, 10) - 1;

        let updatedInstanceSteps = [...instance.steps];

        if (edit.targetType === 'step') {
          if (stepIndex >= 0 && stepIndex < updatedInstanceSteps.length) {
            updatedInstanceSteps = updatedInstanceSteps.map((s, idx) =>
              idx === stepIndex ? applyEditToStep(s) : s
            );
          }
        } else {
          // Substep edit for recurring task
          const match = edit.targetId.match(/^(\d+)([a-z])$/);
          if (match) {
            const parentIndex = parseInt(match[1], 10) - 1;
            const substepLetter = match[2];
            const substepIndex = substepLetter.charCodeAt(0) - 'a'.charCodeAt(0);

            if (parentIndex >= 0 && parentIndex < updatedInstanceSteps.length) {
              updatedInstanceSteps = updatedInstanceSteps.map((s, sIdx) => {
                if (sIdx === parentIndex && substepIndex >= 0 && substepIndex < s.substeps.length) {
                  return {
                    ...s,
                    substeps: s.substeps.map((sub, subIdx) =>
                      subIdx === substepIndex ? applyEditToSubstep(sub) : sub
                    ),
                  };
                }
                return s;
              });
            }
          }
        }

        const updatedInstance = {
          ...instance,
          steps: updatedInstanceSteps,
        };

        const updatedInstances = (task.recurringInstances || [])
          .filter((i) => i.date !== activeDate)
          .concat(updatedInstance);

        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === state.activeTaskId
              ? { ...t, recurringInstances: updatedInstances, staging: updatedStaging, updatedAt: Date.now() }
              : t
          ),
        };
      }

      // Regular tasks - update task.steps
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === state.activeTaskId
            ? { ...t, steps: updatedSteps, staging: updatedStaging, updatedAt: Date.now() }
            : t
        ),
      };
    });
  }, [state.activeTaskId, state.taskDetailMode]);

  const handleRejectEdit = useCallback((edit: EditSuggestion) => {
    updateActiveStaging((staging) =>
      staging
        ? { ...staging, edits: staging.edits.filter((e) => e.targetId !== edit.targetId) }
        : null
    );
  }, [updateActiveStaging]);

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

      const updatedStaging = task.staging
        ? { ...task.staging, deletions: task.staging.deletions.filter((d) => d.targetId !== deletion.targetId) }
        : null;

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === state.activeTaskId
            ? { ...t, steps: newSteps, staging: updatedStaging, updatedAt: Date.now() }
            : t
        ),
      };
    });
  }, [state.activeTaskId]);

  const handleRejectDeletion = useCallback((deletion: DeletionSuggestion) => {
    updateActiveStaging((staging) =>
      staging
        ? { ...staging, deletions: staging.deletions.filter((d) => d.targetId !== deletion.targetId) }
        : null
    );
  }, [updateActiveStaging]);

  // Metadata suggestion handlers
  const handleAcceptMetadata = useCallback((metadata: MetadataSuggestion) => {
    if (!state.activeTaskId) return;

    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === state.activeTaskId);
      if (!task) return prev;

      // Build the update object based on the field
      let updates: Partial<Task> = {};
      switch (metadata.field) {
        case 'importance':
          updates = { importance: metadata.value as ImportanceLevel };
          break;
        case 'energyType':
          updates = { energyType: metadata.value as EnergyType };
          break;
        case 'leadTimeDays':
          updates = { leadTimeDays: metadata.value as number };
          break;
      }

      // Remove the accepted metadata from staging
      const updatedStaging = task.staging
        ? {
            ...task.staging,
            metadataSuggestions: task.staging.metadataSuggestions.filter(
              (m) => !(m.field === metadata.field && m.value === metadata.value)
            ),
          }
        : null;

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === state.activeTaskId
            ? { ...t, ...updates, staging: updatedStaging, updatedAt: Date.now() }
            : t
        ),
      };
    });
  }, [state.activeTaskId]);

  const handleRejectMetadata = useCallback((metadata: MetadataSuggestion) => {
    updateActiveStaging((staging) =>
      staging
        ? {
            ...staging,
            metadataSuggestions: staging.metadataSuggestions.filter(
              (m) => !(m.field === metadata.field && m.value === metadata.value)
            ),
          }
        : null
    );
  }, [updateActiveStaging]);

  const handleAcceptTitle = useCallback(() => {
    if (!state.activeTaskId) return;

    const staging = getActiveStaging();
    if (!staging?.suggestedTitle) return;

    const suggestedTitle = staging.suggestedTitle;

    setState((prev) => {
      const task = prev.tasks.find(t => t.id === state.activeTaskId);
      if (!task) return prev;

      const updatedStaging = task.staging
        ? { ...task.staging, suggestedTitle: null }
        : null;

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === state.activeTaskId
            ? { ...t, title: suggestedTitle, staging: updatedStaging, updatedAt: Date.now() }
            : t
        ),
      };
    });
  }, [state.activeTaskId, getActiveStaging]);

  const handleRejectTitle = useCallback(() => {
    updateActiveStaging((staging) =>
      staging
        ? { ...staging, suggestedTitle: null }
        : null
    );
  }, [updateActiveStaging]);

  const handleAcceptAll = useCallback(() => {
    if (!state.activeTaskId) return;

    const staging = getActiveStaging();
    if (!staging) return;

    // Accept title if suggested
    if (staging.suggestedTitle) {
      handleAcceptTitle();
    }

    // Handle based on action type
    if (staging.pendingAction === 'replace') {
      // Replace all steps with the suggestions
      const newSteps: Step[] = staging.suggestions.map((suggestion) =>
        createStep(suggestion.text, {
          id: suggestion.id,
          source: 'ai_generated',
          origin: 'ai',
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

      setState((prev) => {
        const task = prev.tasks.find((t) => t.id === state.activeTaskId);
        if (!task) return prev;

        // Check if this is a recurring task in executing mode
        const isRecurringExecuting = task.isRecurring && task.recurrence && state.taskDetailMode === 'executing';

        if (isRecurringExecuting) {
          // Replace instance steps, not template
          const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
          let instances = [...(task.recurringInstances || [])];
          let instanceIndex = instances.findIndex(i => i.date === activeDate);

          if (instanceIndex === -1) {
            const newInstance = ensureInstance(task, activeDate);
            instances.push(newInstance);
            instanceIndex = instances.length - 1;
          }

          // Replace instance steps with new AI steps
          instances[instanceIndex] = {
            ...instances[instanceIndex],
            steps: newSteps,
          };

          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === state.activeTaskId
                ? {
                    ...t,
                    recurringInstances: instances,
                    staging: null,
                    aiAssisted: true,
                    updatedAt: Date.now(),
                  }
                : t
            ),
          };
        }

        // MANAGING MODE or NON-RECURRING: Replace task.steps (template)
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === state.activeTaskId
              ? {
                  ...t,
                  steps: newSteps,
                  staging: null,
                  completionType: 'step_based',
                  aiAssisted: true,
                  updatedAt: Date.now(),
                }
              : t
          ),
        };
      });
    } else {
      // Normal suggest flow - ATOMIC: resolve all positions against original array, then apply once
      setState((prev) => {
        const task = prev.tasks.find((t) => t.id === state.activeTaskId);
        if (!task) return prev;

        // Check if this is a recurring task in executing mode
        const isRecurringExecuting = task.isRecurring && task.recurrence && state.taskDetailMode === 'executing';

        if (isRecurringExecuting) {
          // Handle recurring task - add to instance steps atomically
          const activeDate = getActiveOccurrenceDate(task) || getRecurringTodayISO();
          let instances = [...(task.recurringInstances || [])];
          let instanceIndex = instances.findIndex(i => i.date === activeDate);

          if (instanceIndex === -1) {
            const newInstance = createInstance(task, activeDate);
            instances.push(newInstance);
            instanceIndex = instances.length - 1;
          }

          const instance = instances[instanceIndex];
          const originalSteps = [...instance.steps];

          // Process all suggestions: resolve positions against ORIGINAL array
          const insertions: Array<{
            suggestion: SuggestedStep;
            insertAfterIndex: number; // -1 = prepend, >= 0 = after that index, null = append
          }> = [];

          for (const suggestion of staging.suggestions) {
            // Skip substep additions (handled separately)
            if (suggestion.parentStepId) {
              // Add as substep to parent step
              const parentIdx = originalSteps.findIndex(s => s.id === suggestion.parentStepId);
              if (parentIdx >= 0) {
                // Will be handled in substep processing
                insertions.push({ suggestion, insertAfterIndex: -2 }); // marker for substep
              }
              continue;
            }

            const insertAfter = suggestion.insertAfterStepId;
            if (insertAfter === '0') {
              insertions.push({ suggestion, insertAfterIndex: -1 }); // prepend
            } else if (insertAfter) {
              const resolvedUUID = resolveDisplayIdToUUID(insertAfter, originalSteps) || insertAfter;
              const idx = originalSteps.findIndex(s => s.id === resolvedUUID);
              insertions.push({ suggestion, insertAfterIndex: idx >= 0 ? idx : originalSteps.length - 1 });
            } else {
              insertions.push({ suggestion, insertAfterIndex: originalSteps.length - 1 }); // append
            }
          }

          // Build final steps array with all insertions
          let finalSteps = [...originalSteps];

          // Handle substep additions first
          for (const { suggestion, insertAfterIndex } of insertions) {
            if (insertAfterIndex === -2 && suggestion.parentStepId) {
              const parentIdx = finalSteps.findIndex(s => s.id === suggestion.parentStepId);
              if (parentIdx >= 0) {
                finalSteps[parentIdx] = {
                  ...finalSteps[parentIdx],
                  substeps: [...finalSteps[parentIdx].substeps, {
                    id: suggestion.id,
                    text: suggestion.text,
                    shortLabel: null,
                    completed: false,
                    completedAt: null,
                    skipped: false,
                    source: 'ai_suggested' as const,
                  }],
                };
              }
            }
          }

          // Group insertions by their target position, sorted by position descending
          // (so we insert from end to start, preserving indices)
          const stepInsertions = insertions
            .filter(i => i.insertAfterIndex !== -2)
            .sort((a, b) => b.insertAfterIndex - a.insertAfterIndex);

          for (const { suggestion, insertAfterIndex } of stepInsertions) {
            const newStep = createStep(suggestion.text, {
              id: suggestion.id,
              source: 'ai_suggested',
              origin: 'ai',
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

            if (insertAfterIndex === -1) {
              finalSteps = [newStep, ...finalSteps];
            } else {
              finalSteps = [
                ...finalSteps.slice(0, insertAfterIndex + 1),
                newStep,
                ...finalSteps.slice(insertAfterIndex + 1),
              ];
            }
          }

          instances[instanceIndex] = { ...instance, steps: finalSteps };

          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === state.activeTaskId
                ? { ...t, recurringInstances: instances, staging: null, aiAssisted: true, updatedAt: Date.now() }
                : t
            ),
          };
        }

        // NON-RECURRING: Add to task.steps (template) atomically
        const originalSteps = [...task.steps];

        // Process all suggestions: resolve positions against ORIGINAL array
        const insertions: Array<{
          suggestion: SuggestedStep;
          insertAfterIndex: number;
        }> = [];

        for (const suggestion of staging.suggestions) {
          // Skip substep additions (handled separately)
          if (suggestion.parentStepId) {
            const parentIdx = originalSteps.findIndex(s => s.id === suggestion.parentStepId);
            if (parentIdx >= 0) {
              insertions.push({ suggestion, insertAfterIndex: -2 }); // marker for substep
            }
            continue;
          }

          const insertAfter = suggestion.insertAfterStepId;
          if (insertAfter === '0') {
            insertions.push({ suggestion, insertAfterIndex: -1 }); // prepend
          } else if (insertAfter) {
            const resolvedUUID = resolveDisplayIdToUUID(insertAfter, originalSteps) || insertAfter;
            const idx = originalSteps.findIndex(s => s.id === resolvedUUID);
            insertions.push({ suggestion, insertAfterIndex: idx >= 0 ? idx : originalSteps.length - 1 });
          } else {
            insertions.push({ suggestion, insertAfterIndex: originalSteps.length - 1 }); // append
          }
        }

        // Build final steps array with all insertions
        let finalSteps = [...originalSteps];

        // Handle substep additions first
        for (const { suggestion, insertAfterIndex } of insertions) {
          if (insertAfterIndex === -2 && suggestion.parentStepId) {
            const parentIdx = finalSteps.findIndex(s => s.id === suggestion.parentStepId);
            if (parentIdx >= 0) {
              finalSteps[parentIdx] = {
                ...finalSteps[parentIdx],
                substeps: [...finalSteps[parentIdx].substeps, {
                  id: suggestion.id,
                  text: suggestion.text,
                  shortLabel: null,
                  completed: false,
                  completedAt: null,
                  skipped: false,
                  source: 'ai_suggested' as const,
                }],
              };
            }
          }
        }

        // Group insertions by their target position, sorted by position descending
        const stepInsertions = insertions
          .filter(i => i.insertAfterIndex !== -2)
          .sort((a, b) => b.insertAfterIndex - a.insertAfterIndex);

        for (const { suggestion, insertAfterIndex } of stepInsertions) {
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

          if (insertAfterIndex === -1) {
            finalSteps = [newStep, ...finalSteps];
          } else {
            finalSteps = [
              ...finalSteps.slice(0, insertAfterIndex + 1),
              newStep,
              ...finalSteps.slice(insertAfterIndex + 1),
            ];
          }
        }

        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === state.activeTaskId
              ? {
                  ...t,
                  steps: finalSteps,
                  staging: null,
                  completionType: 'step_based' as const,
                  aiAssisted: true,
                  updatedAt: Date.now(),
                }
              : t
          ),
        };
      });
    }

    // Accept all edits
    staging.edits.forEach((edit) => {
      handleAcceptEdit(edit);
    });

    // Accept all deletions
    staging.deletions.forEach((deletion) => {
      handleAcceptDeletion(deletion);
    });

    // Clear staging after accepting all
    clearActiveStaging();

    // Only clear palette and collapse if content is still related to staging
    // (user hasn't submitted a new query since staging was populated)
    const hasNewQuerySinceStaging = lastQuerySubmittedAt > stagingPopulatedAt;
    if (!hasNewQuerySinceStaging) {
      aiAssistant.dismissResponse();
      aiAssistant.collapse();
      setPaletteManuallyOpened(false);
    }
  }, [state.activeTaskId, state.taskDetailMode, getActiveStaging, handleAcceptTitle, handleAcceptSuggestion, handleAcceptEdit, handleAcceptDeletion, clearActiveStaging, aiAssistant, lastQuerySubmittedAt, stagingPopulatedAt]);

  const handleDismiss = useCallback(() => {
    // Clear staging for current context (task or global)
    clearActiveStaging();

    // Only clear palette and collapse if content is still related to staging
    // (user hasn't submitted a new query since staging was populated)
    const hasNewQuerySinceStaging = lastQuerySubmittedAt > stagingPopulatedAt;
    if (!hasNewQuerySinceStaging) {
      aiAssistant.dismissResponse();
      aiAssistant.collapse();
      setPaletteManuallyOpened(false);
    }
  }, [clearActiveStaging, aiAssistant, lastQuerySubmittedAt, stagingPopulatedAt]);

  // Accept suggestions with scope (for recurring tasks)
  const handleAcceptWithScope = useCallback((scope: 'instance' | 'template') => {
    if (!state.activeTaskId) return;

    const staging = getActiveStaging();
    if (!staging || staging.suggestions.length === 0) return;

    const task = state.tasks.find(t => t.id === state.activeTaskId);
    if (!task || !task.isRecurring) return;

    const now = Date.now();

    if (scope === 'instance') {
      // Add steps to instance
      const activeDate = getActiveOccurrenceDate(task);
      if (!activeDate) return;

      const newInstanceSteps = staging.suggestions.map((suggestion) =>
        createStep(suggestion.text, {
          id: suggestion.id,
          source: 'ai_generated',
          origin: 'ai',
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
        tasks: prev.tasks.map((t) => {
          if (t.id !== state.activeTaskId) return t;

          const instances = t.recurringInstances || [];
          const instanceIndex = instances.findIndex(i => i.date === activeDate);

          if (instanceIndex >= 0) {
            // Update existing instance
            const updatedInstances = [...instances];
            updatedInstances[instanceIndex] = {
              ...updatedInstances[instanceIndex],
              steps: [
                ...updatedInstances[instanceIndex].steps,
                ...newInstanceSteps,
              ],
            };
            return {
              ...t,
              recurringInstances: updatedInstances,
              staging: null,
              aiAssisted: true,
              updatedAt: now,
            };
          } else {
            // Create new instance with steps
            const newInstance = createInstance(t, activeDate);
            return {
              ...t,
              recurringInstances: [...instances, { ...newInstance, steps: [...newInstance.steps, ...newInstanceSteps] }],
              staging: null,
              aiAssisted: true,
              updatedAt: now,
            };
          }
        }),
      }));

      showToast({ message: `Added ${staging.suggestions.length} step${staging.suggestions.length > 1 ? 's' : ''} to today's instance`, type: 'success' });
    } else {
      // Add steps to task.steps (template)
      const newSteps = staging.suggestions.map((suggestion) =>
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
        tasks: prev.tasks.map((t) => {
          if (t.id !== state.activeTaskId) return t;

          let updatedInstances = t.recurringInstances || [];

          // If recurring task with active instance, sync new template steps to it
          if (t.isRecurring && t.recurringInstances) {
            const activeDate = getActiveOccurrenceDate(t) || getRecurringTodayISO();
            const existingInstance = t.recurringInstances.find(i => i.date === activeDate);

            if (existingInstance) {
              // Clone steps with fresh IDs for the instance
              const instanceSteps = newSteps.map(step => ({
                ...step,
                id: generateId(),
                substeps: step.substeps.map(sub => ({
                  ...sub,
                  id: generateId(),
                })),
              }));

              updatedInstances = t.recurringInstances.map(i =>
                i.date === activeDate
                  ? { ...i, steps: [...i.steps, ...instanceSteps] }
                  : i
              );
            }
          }

          return {
            ...t,
            steps: [...t.steps, ...newSteps],
            recurringInstances: updatedInstances,
            staging: null,
            completionType: 'step_based',
            aiAssisted: true,
            updatedAt: now,
          };
        }),
      }));

      showToast({ message: `Added ${staging.suggestions.length} step${staging.suggestions.length > 1 ? 's' : ''} to routine template`, type: 'success' });
    }

    // Clear staging and palette
    clearActiveStaging();
    const hasNewQuerySinceStaging = lastQuerySubmittedAt > stagingPopulatedAt;
    if (!hasNewQuerySinceStaging) {
      aiAssistant.dismissResponse();
      aiAssistant.collapse();
      setPaletteManuallyOpened(false);
    }
  }, [state.activeTaskId, state.tasks, getActiveStaging, clearActiveStaging, aiAssistant, lastQuerySubmittedAt, stagingPopulatedAt, showToast]);

  // ============================================
  // Computed Values
  // ============================================

  const inboxTasks = filterInbox(state.tasks);
  const poolTasks = filterPool(state.tasks);
  // Badge count: only active one-off tasks for "today" (excludes routines and upcoming)
  // Uses todayLineIndex to match QueueView's visual "Today" section
  const todayCount = useMemo(() => {
    const activeItems = state.focusQueue.items
      .filter(i => !i.completed)
      .sort((a, b) => a.order - b.order);
    const todayItems = activeItems.slice(0, state.focusQueue.todayLineIndex);
    return todayItems.filter(item => {
      const task = state.tasks.find(t => t.id === item.taskId);
      return task && !task.isRecurring;
    }).length;
  }, [state.focusQueue.items, state.focusQueue.todayLineIndex, state.tasks]);
  const notificationCount = getUnacknowledgedCount(notifications);

  const awarenessData = (() => {
    // Focus view: stale queue items
    if (activeStaleItems.length > 0 && state.currentView === 'focus') {
      return {
        items: activeStaleItems.map(({ item, task, days }) => ({
          id: item.id,
          taskId: task.id,
          title: task.title,
          days,
        })),
        currentIndex: Math.min(staleIndex, activeStaleItems.length - 1),
        onReview: (taskId: string) => handleOpenTask(taskId),
        onDismiss: handleDismissStaleItem,
        onNext: handleNextStaleItem,
      };
    }
    // Tasks view: old inbox items
    if (activeOldInboxItems.length > 0 && state.currentView === 'tasks') {
      return {
        items: activeOldInboxItems.map(({ task, days }) => ({
          id: task.id,
          taskId: task.id,
          title: task.title,
          days,
        })),
        currentIndex: Math.min(oldInboxIndex, activeOldInboxItems.length - 1),
        onReview: (taskId: string) => handleOpenTask(taskId),
        onDismiss: handleDismissOldInboxItem,
        onNext: handleNextOldInboxItem,
      };
    }
    return null;
  })();

  // Active alerts data (pokes and reminders for MiniBar/Palette)
  const activeAlertsData: ActiveAlert[] = useMemo(() => {
    // Create unified handlers for alerts
    const handlers = {
      onStartPoke: (taskId: string, notificationId: string) => {
        // Acknowledge the notification
        setNotifications((prev) => markNotificationAcknowledged(notificationId, prev));
        // Navigate to task
        handleOpenTask(taskId);
        // If the task is in the queue, start focus
        const queueItem = state.focusQueue.items.find((item) => item.taskId === taskId);
        if (queueItem) {
          handleStartFocus(queueItem.id);
        }
      },
      onViewReminder: (taskId: string, notificationId: string) => {
        setNotifications((prev) => markNotificationAcknowledged(notificationId, prev));
        handleOpenTask(taskId);
      },
      onSnooze: (notificationId: string, minutes: number) => {
        setNotifications((prev) => snoozeNotification(notificationId, prev, minutes));
      },
      onDismiss: (notificationId: string) => {
        setNotifications((prev) => markNotificationAcknowledged(notificationId, prev));
      },
    };

    return getAllActiveAlerts(
      notifications,
      state.tasks,
      state.userSettings,
      handlers
    );
  }, [notifications, state.tasks, state.userSettings, state.focusQueue.items, handleOpenTask, handleStartFocus]);

  // Handle alert cycling
  const handleCycleAlert = useCallback(() => {
    if (activeAlertsData.length > 1) {
      setCurrentAlertIndex((prev) => (prev + 1) % activeAlertsData.length);
    }
  }, [activeAlertsData.length]);

  // Handle start poke action (from MiniBar/Palette)
  const handleStartPokeAction = useCallback(() => {
    const currentAlert = activeAlertsData[currentAlertIndex];
    if (currentAlert?.type === 'poke') {
      currentAlert.data.onStart();
    }
  }, [activeAlertsData, currentAlertIndex]);

  // Handle reminder action (from MiniBar/Palette)
  const handleReminderAction = useCallback(() => {
    const currentAlert = activeAlertsData[currentAlertIndex];
    if (currentAlert?.type === 'reminder') {
      currentAlert.data.onView();
    }
  }, [activeAlertsData, currentAlertIndex]);

  // Reset alert index when alerts change
  useEffect(() => {
    if (currentAlertIndex >= activeAlertsData.length) {
      setCurrentAlertIndex(0);
    }
  }, [activeAlertsData.length, currentAlertIndex]);

  const counts = {
    inbox: inboxTasks.length,
    pool: poolTasks.length,
    queue: state.focusQueue.items.filter(i => !i.completed).length,
  };

  // Filter counts for sidebar
  const activeTasks = state.tasks.filter(t => !t.deletedAt && t.status !== 'archived' && t.status !== 'complete');
  const filterCounts = {
    needsAttention: activeTasks.filter(t => {
      const health = computeHealthStatus(t);
      return health.status === 'critical' || health.status === 'at_risk';
    }).length,
    highPriority: activeTasks.filter(t => t.priority === 'high').length,
    waiting: activeTasks.filter(t => t.waitingOn !== null).length,
    deferred: activeTasks.filter(t => t.deferredUntil !== null).length,
    completed: state.tasks.filter(t => !t.deletedAt && t.status === 'complete').length,
    archived: state.tasks.filter(t => !t.deletedAt && t.status === 'archived').length,
    projects: new Set(activeTasks.map(t => t.projectId).filter(Boolean)).size,
  };

  // View title - view-specific (filter titles now in TasksView pills)
  const viewTitle = (() => {
    switch (state.currentView) {
      case 'projects': return 'Projects';
      case 'inbox': return 'Needs Triage';
      case 'notifications': return 'Notifications';
      case 'settings': return 'Settings';
      case 'taskDetail': return null;  // Task title shown elsewhere
      case 'focusMode': return null;   // Focus mode has own header
      default: return null;  // focus/tasks use TabCluster
    }
  })();

  // ============================================
  // Sidebar Handlers
  // ============================================

  // Handle Jump To filter from search empty state - navigates to TasksView with filter
  const handleJumpToFilter = useCallback((filter: string) => {
    // Set pending filter for TasksView to pick up
    setPendingFilter(filter);
    // Clear search state
    setSearchQuery('');
    setSearchInputFocused(false);
    // Navigate to Tasks view
    handleViewChange('tasks');
    // Close sidebar on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Handle back to menu from search - clears search state
  const handleBackToMenu = useCallback(() => {
    setSearchQuery('');
    setSearchInputFocused(false);
    // Blur search input if focused
    if (document.activeElement instanceof HTMLInputElement) {
      document.activeElement.blur();
    }
  }, []);

  // Handle clearing pending filter (memoized to avoid re-render loops)
  const handleClearPendingFilter = useCallback(() => {
    setPendingFilter(null);
  }, []);

  // Handle settings open
  const handleOpenSettings = () => {
    // For now, show a simple alert with export/import info
    // This can be expanded to a full settings modal later
    const exportData = () => {
      const data = {
        tasks: state.tasks,
        projects: state.projects,
        focusQueue: state.focusQueue,
        exportedAt: Date.now(),
        version: 2,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focus-tools-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', message: 'Data exported successfully' });
    };

    exportData();
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

  // Check if we're on desktop (for sidebar behavior)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <div className="fixed inset-0 flex bg-zinc-50 dark:bg-zinc-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentView={state.currentView}
        onNavigate={(view) => {
          // Clear search when navigating via menu
          setSearchQuery('');
          setSearchInputFocused(false);
          handleViewChange(view);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchInputFocus={() => setSearchInputFocused(true)}
        onSearchInputBlur={() => setSearchInputFocused(false)}
        searchInputFocused={searchInputFocused}
        inboxCount={inboxTasks.length}
        todayCount={todayCount}
        notificationCount={notificationCount}
        shouldFocusSearch={shouldFocusSearch}
        onSearchFocused={() => setShouldFocusSearch(false)}
        // Jump To filter shortcuts
        filterCounts={filterCounts}
        onJumpToFilter={handleJumpToFilter}
        // Recent tasks - use frozen list during search to prevent reordering
        recentTasks={(frozenRecentTaskIds || recentTaskIds).map(id => state.tasks.find(t => t.id === id)).filter(Boolean) as Task[]}
        onOpenTask={(taskId) => {
          handleOpenTask(taskId);
          // Close sidebar on mobile
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
        }}
        // Back to menu (exit search mode)
        onBackToMenu={handleBackToMenu}
        // Projects for search results
        projects={state.projects}
        tasks={state.tasks}
      />

      {/* Hidden file input for import */}
      <input
        ref={importFileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFileChange}
        className="hidden"
      />

      {/* Mobile backdrop - full overlay with fade for closing sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Column - pushes based on sidebar state and right drawer state */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 transition-all duration-300
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[320px]'}
          ${
            // Right margin based on active drawer type (single source of truth)
            // AI drawer: 320px (w-80), filter/importance/energy/leadTime: 360px, others: 400px
            activeDrawer === 'ai' ? 'lg:mr-80'
            : activeDrawer === 'filter' || activeDrawer === 'importance' || activeDrawer === 'energy' || activeDrawer === 'leadTime' ? 'lg:mr-[360px]'
            : activeDrawer ? 'lg:mr-[400px]'
            : ''
          }
          ${sidebarOpen ? 'translate-x-[calc(100vw-72px)] pointer-events-none lg:translate-x-0 lg:pointer-events-auto' : ''}
        `}
      >
        {/* Main Header - hidden in Focus Mode (FocusModeView has its own) */}
        {state.currentView !== 'focusMode' && (
          <Header
            currentView={state.currentView}
            previousView={previousView}
            onViewChange={handleViewChange}
            onToggleAI={() => aiAssistant.expand()}
            isAIDrawerOpen={aiAssistant.state.mode !== 'collapsed'}
            inboxCount={inboxTasks.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchFocus={() => {}} // No longer used - search is in sidebar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isSidebarOpen={!sidebarCollapsed}
            taskCreationOpen={taskCreationOpen}
            onOpenTaskCreation={() => setTaskCreationOpen(true)}
            onCloseTaskCreation={() => setTaskCreationOpen(false)}
            onQuickAddTask={handleQuickAddTask}
            onAddAndOpenTask={handleAddAndOpenTask}
            projects={state.projects}
            onOpenProjectModal={() => handleOpenProjectModal()}
            projectModalOpen={projectModalOpen}
            onOpenProjectModalWithCallback={handleOpenProjectModalWithCallback}
            viewTitle={viewTitle}
            showBackButton={state.currentView === 'inbox' || state.currentView === 'taskDetail'}
            onBack={() => {
              if (state.currentView === 'taskDetail') {
                handleBackToList();
              } else if (state.currentView === 'inbox') {
                handleViewChange('tasks');
              } else {
                handleBackToList();
              }
            }}
            hideNavigation={state.currentView === 'taskDetail'}
            isScrolled={isScrolled}
          />
        )}

        {/* Main Content */}
        <main
          ref={mainRef}
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'overflow-y-auto pointer-events-none lg:pointer-events-auto' : 'overflow-y-auto'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
          onScroll={handleMainScroll}
        >
          {/* pb-48 clears AI minibar + room for dropdowns; pb-24 on desktop for minibar; when AI open pb-[52vh] for bottom sheet */}
          {/* Focus mode: full width, no padding (has its own layout). Other views: max-w-4xl centered with padding */}
          <div className={`${state.currentView === 'focusMode' ? 'h-full' : `max-w-4xl mx-auto px-4 py-6 ${
              aiAssistant.state.mode !== 'collapsed'
                ? 'lg:pb-24 pb-[calc(52vh+env(safe-area-inset-bottom))]'
                : 'pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-24'}`}`}>
            {/* Notification Permission Banner - shown on Focus view */}
            {state.currentView === 'focus' && showNotificationPrompt && (
              <NotificationPermissionBanner
                onDismiss={() => setShowNotificationPrompt(false)}
              />
            )}

            {/* View Router */}
            {state.currentView === 'focus' && (
              <QueueView
                queue={state.focusQueue}
                tasks={state.tasks}
                projects={state.projects}
                inboxCount={inboxTasks.length}
                onOpenTask={handleOpenTask}
                onStartFocus={handleStartFocus}
                onRemoveFromQueue={handleRemoveFromQueue}
                onUpdateStepSelection={handleUpdateStepSelection}
                onReorderQueue={handleReorderQueue}
                onMoveItemUp={handleMoveQueueItemUp}
                onMoveItemDown={handleMoveQueueItemDown}
                onGoToInbox={handleGoToInbox}
                onCompleteRoutine={handleCompleteRoutine}
                onSkipRoutine={handleSkipRoutine}
                dayStartHour={state.userSettings.dayStartHour}
                activeDrawer={activeDrawer}
                onOpenDrawer={handleOpenDrawer}
                onCloseDrawer={handleCloseDrawer}
                onOpenFocusSelection={handleOpenFocusSelection}
              />
            )}

            {state.currentView === 'tasks' && (
              <TasksView
                inboxTasks={inboxTasks}
                poolTasks={poolTasks}
                allTasks={state.tasks}
                queue={state.focusQueue}
                projects={state.projects}
                onOpenTask={handleOpenTask}
                onSendToPool={handleSendToPool}
                onAddToQueue={handleAddToQueue}
                onDefer={handleDefer}
                onPark={handlePark}
                onDelete={handleDeleteTask}
                onGoToInbox={handleGoToInbox}
                onOpenAIDrawer={() => aiAssistant.expand()}
                onOpenProjectModal={handleOpenProjectModal}
                // Filter pills - pendingFilter from Jump To shortcuts
                pendingFilter={pendingFilter}
                onClearPendingFilter={handleClearPendingFilter}
                // Controlled tab state for back navigation
                activeTab={activeTasksTab}
                onTabChange={setActiveTasksTab}
                // Filter state lifted to page.tsx for root-level FilterDrawer
                filters={tasksFilters}
                onFiltersChange={setTasksFilters}
                onFilteredCountChange={setTasksFilterMatchCount}
                onOpenFilterDrawer={() => handleOpenDrawer('filter')}
              />
            )}

            {state.currentView === 'inbox' && (
              <InboxView
                tasks={inboxTasks}
                onOpenTask={handleOpenTask}
                onSendToPool={handleSendToPool}
                onAddToQueue={handleAddToQueue}
                onDefer={handleDefer}
                onPark={handlePark}
                onDelete={handleDeleteTask}
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

            {state.currentView === 'notifications' && (
              <NotificationsHub
                notifications={notifications}
                onNotificationTap={handleNotificationTap}
                onDismiss={handleDismissNotification}
                onStart={handleNotificationStart}
                onSnooze={handleSnoozeNotification}
                onCancel={handleCancelNotification}
              />
            )}

            {state.currentView === 'settings' && (
              <NotificationSettings
                userSettings={state.userSettings}
                onUpdateSettings={handleUpdateUserSettings}
                onExportData={handleExportData}
                onImportData={handleTriggerImport}
                onRescanPokes={handleRescanPokes}
              />
            )}

            {state.currentView === 'taskDetail' && activeTask && (
              <TaskDetail
                key={activeTask.id}
                task={activeTask}
                queue={state.focusQueue}
                projects={state.projects}
                userSettings={state.userSettings}
                mode={state.taskDetailMode}
                suggestions={activeTask.staging?.suggestions || []}
                edits={activeTask.staging?.edits || []}
                deletions={activeTask.staging?.deletions || []}
                metadataSuggestions={activeTask.staging?.metadataSuggestions || []}
                suggestedTitle={activeTask.staging?.suggestedTitle || null}
                stagingIsNewArrival={stagingIsNewArrival}
                onStagingAnimationComplete={() => setStagingIsNewArrival(false)}
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
                onUpdateStepSelection={handleUpdateStepSelection}
                onSendToPool={handleSendToPool}
                onDefer={handleDefer}
                onClearDefer={handleClearDefer}
                onClearWaitingOn={handleClearWaitingOn}
                onPark={handlePark}
                onUnarchive={handleUnarchive}
                onDeleteTask={handleDeleteTask}
                onStartFocus={handleStartFocus}
                onOpenAIDrawer={() => aiAssistant.expand()}
                onAIBreakdown={handleAutoBreakdown}
                onAcceptOne={handleAcceptSuggestion}
                onAcceptAll={handleAcceptAll}
                onDismiss={handleDismiss}
                onAcceptEdit={handleAcceptEdit}
                onRejectEdit={handleRejectEdit}
                onAcceptDeletion={handleAcceptDeletion}
                onRejectDeletion={handleRejectDeletion}
                onAcceptMetadata={handleAcceptMetadata}
                onRejectMetadata={handleRejectMetadata}
                onAcceptTitle={handleAcceptTitle}
                onRejectTitle={handleRejectTitle}
                onOpenProjectModal={handleOpenProjectModal}
                onOpenProjectModalWithCallback={handleOpenProjectModalWithCallback}
                onOpenDatePickerModal={handleOpenDatePickerModal}
                aiTargetContext={aiTargetContext}
                isAILoading={aiAssistant.state.isLoading}
                onOpenAIPalette={handleOpenAIPalette}
                onClearAITarget={clearAITargetContext}
                onCompleteRoutine={handleCompleteRoutine}
                onSkipRoutine={handleSkipRoutine}
                onMarkRoutineIncomplete={handleMarkRoutineIncomplete}
                onUnskipRoutine={handleMarkRoutineIncomplete}
                onStartRecurringFocus={handleStartRecurringFocus}
                onAcceptWithScope={handleAcceptWithScope}
                onToggleMode={handleToggleTaskDetailMode}
                onResetFromTemplate={activeTask?.isRecurring ? () => handleResetFromTemplate(activeTask.id) : undefined}
                activeDrawer={activeDrawer}
                onOpenDrawer={handleOpenDrawer}
                onCloseDrawer={handleCloseDrawer}
                onOpenFocusSelection={handleOpenFocusSelection}
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
                onOpenAIDrawer={() => aiAssistant.expand()}
                suggestions={activeTask.staging?.suggestions || []}
                edits={activeTask.staging?.edits || []}
                deletions={activeTask.staging?.deletions || []}
                metadataSuggestions={activeTask.staging?.metadataSuggestions || []}
                suggestedTitle={activeTask.staging?.suggestedTitle || null}
                onAcceptOne={handleAcceptSuggestion}
                onAcceptAll={handleAcceptAll}
                onDismiss={handleDismiss}
                onAcceptEdit={handleAcceptEdit}
                onRejectEdit={handleRejectEdit}
                onAcceptDeletion={handleAcceptDeletion}
                onRejectDeletion={handleRejectDeletion}
                onAcceptMetadata={handleAcceptMetadata}
                onRejectMetadata={handleRejectMetadata}
                onAcceptTitle={handleAcceptTitle}
                onRejectTitle={handleRejectTitle}
                onAcceptWithScope={handleAcceptWithScope}
              />
            )}
          </div>
        </main>
      </div>

      {/* CompletedDrawer - ROOT LEVEL (like AIDrawer) for proper iOS z-index */}
      <CompletedDrawer
        isOpen={completedDrawerOpen}
        onClose={() => handleCloseDrawer()}
        tasks={state.tasks}
        onNavigateToTask={(taskId) => handleOpenTask(taskId)}
        dayStartHour={state.userSettings.dayStartHour}
      />

      {/* FilterDrawer - ROOT LEVEL (like AIDrawer) for proper iOS z-index */}
      <FilterDrawer
        isOpen={activeDrawer === 'filter'}
        onClose={() => handleCloseDrawer()}
        filters={tasksFilters}
        onFiltersChange={setTasksFilters}
        projects={state.projects}
        matchCount={tasksFilterMatchCount}
      />

      {/* FocusSelectionModal - ROOT LEVEL (like AIDrawer) for proper iOS z-index */}
      {editingFocusQueueItemId && (() => {
        const queueItem = state.focusQueue.items.find(i => i.id === editingFocusQueueItemId);
        const task = queueItem ? state.tasks.find(t => t.id === queueItem.taskId) : null;
        if (!queueItem || !task) return null;

        return (
          <FocusSelectionModal
            isOpen={activeDrawer === 'focus-selection'}
            task={task}
            initialSelectionType={queueItem.selectionType}
            initialSelectedStepIds={
              queueItem.selectionType === 'specific_steps'
                ? queueItem.selectedStepIds
                : []
            }
            onClose={() => handleCloseDrawer()}
            onUpdateSelection={(selectionType, selectedStepIds) => {
              handleUpdateStepSelection(editingFocusQueueItemId, selectionType, selectedStepIds);
            }}
          />
        );
      })()}

      {/* Project Modal */}
      <ProjectModal
        isOpen={projectModalOpen}
        project={editingProject}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
          setPendingProjectCallback(null); // Clear callback on cancel
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

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={datePickerModalOpen}
        onClose={() => {
          setDatePickerModalOpen(false);
          setPendingDateCallback(null);
        }}
        onSelectDate={handleSelectDate}
        title="Select Follow-up Date"
        minDate={new Date().toISOString().split('T')[0]}
      />

      {/* Toast Notifications - centered within main content area */}
      <div className={`
        fixed bottom-24 sm:bottom-20 lg:bottom-24 left-0 right-0 z-50 flex justify-center pointer-events-none
        transition-all duration-300
        ${sidebarCollapsed ? 'lg:left-16' : 'lg:left-[320px]'}
        ${activeDrawer ? 'lg:right-[400px]' : 'lg:right-0'}
      `}>
        <div className="pointer-events-auto">
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
      </div>

      {/* AI Assistant (MiniBar/Palette/Drawer) - Session 1 integration */}
      {/* Hide when: in drawer mode, settings view, modals open, filter drawer open (mobile), or keyboard visible */}
      {aiAssistant.state.mode !== 'drawer' &&
       state.currentView !== 'settings' &&
       !taskCreationOpen &&
       !projectModalOpen &&
       activeDrawer !== 'focus-selection' &&
       activeDrawer !== 'filter' &&
       activeDrawer !== 'completed' &&
       !isKeyboardVisible && (
        <div className={`
          fixed bottom-6 left-6 right-6 z-40 flex justify-center items-end
          sm:bottom-4
          transition-all duration-300
          ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-[336px]'}
          ${activeDrawer ? 'lg:right-[416px]' : 'lg:right-6'}
          ${sidebarOpen ? 'max-lg:translate-y-[100vh]' : ''}
        `}>
          <AIAssistantOverlay
            mode={aiAssistant.state.mode === 'collapsed' ? 'collapsed' : 'expanded'}
            collapsedContent={aiAssistant.state.collapsedContent}
            onExpand={() => {
              setPaletteManuallyOpened(true);
              aiAssistant.expand();
            }}
            onScrollToSuggestions={() => {
              const el = document.getElementById('staging-area');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            query={aiAssistant.state.query}
            onQueryChange={aiAssistant.setQuery}
            onSubmit={aiAssistant.submitQuery}
            onDirectSubmit={aiAssistant.directSubmit}
            isLoading={aiAssistant.state.isLoading}
            response={aiAssistant.state.response}
            quickActions={aiAssistant.quickActions}
            onCollapse={() => {
              setPaletteManuallyOpened(false);
              aiAssistant.collapse();
            }}
            onDismiss={aiAssistant.dismissResponse}
            disableAutoCollapse={paletteManuallyOpened}
            onManualInteraction={() => setPaletteManuallyOpened(true)}
            onRequestRecommendation={handleRequestRecommendation}
            onStartRecommendedFocus={handleStartRecommendedFocus}
            onSkipRecommendation={handleSkipRecommendation}
            onOpenDrawer={handleOpenAIDrawer}
            aiTargetContext={aiTargetContext}
            onClearAITarget={clearAITargetContext}
            awareness={awarenessData}
            activeAlerts={activeAlertsData.length > 0 ? activeAlertsData : null}
            currentAlertIndex={currentAlertIndex}
            onCycleAlert={handleCycleAlert}
            onStartPokeAction={handleStartPokeAction}
            onReminderAction={handleReminderAction}
          />
        </div>
      )}

      {/* AI Assistant Drawer (full chat) - hidden in settings view */}
      <AnimatePresence>
        {aiAssistant.state.mode === 'drawer' && state.currentView !== 'settings' && (
          <>
            {/* Backdrop - hidden on desktop (side-by-side), visible on tablet/mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={aiAssistant.closeDrawer}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden"
            />
            <AIAssistantDrawer
              messages={aiAssistant.state.messages}
              query={aiAssistant.state.query}
              onQueryChange={aiAssistant.setQuery}
              onSubmit={aiAssistant.submitQuery}
              onDirectSubmit={aiAssistant.directSubmit}
              isLoading={aiAssistant.state.isLoading}
              onClose={aiAssistant.closeDrawer}
              quickActions={aiAssistant.quickActions}
              onRequestRecommendation={handleRequestRecommendation}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

