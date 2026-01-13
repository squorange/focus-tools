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
  FocusModeState,
  FocusQueueItem,
  SuggestedStep,
  EditSuggestion,
  DeletionSuggestion,
  StagingState,
  StructureResponse,
  Project,
  createTask,
  createStep,
  createProject,
  createInitialAppState,
  createFocusQueueItem,
  generateId,
} from "@/lib/types";
import { loadState, saveState, exportData, importData } from "@/lib/storage";
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
import { getTodayItems, getStepsInScope } from "@/lib/queue";
import Header from "@/components/layout/Header";
// Old AIDrawer removed - functionality moved to minibar/palette
// import AIDrawer from "@/components/AIDrawer";
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
import { AIAssistantOverlay, AIDrawer as AIAssistantDrawer } from "@/components/ai-assistant";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useContextualPrompts, PromptContext, PromptHandlers } from "@/hooks/useContextualPrompts";
import { AIAssistantContext, AIResponse, AISubmitResult, SuggestionsContent, CollapsedContent, RecommendationContent } from "@/lib/ai-types";
import { structureToAIResponse, getPendingActionType } from "@/lib/ai-adapter";
import { categorizeResponse, buildSuggestionsReadyMessage } from "@/lib/ai-response-types";
import { resolveStatus, buildStatusContext } from "@/lib/ai-status-rules";

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
  const [stagingIsNewArrival, setStagingIsNewArrival] = useState(false);
  const [paletteManuallyOpened, setPaletteManuallyOpened] = useState(false);
  // Track relationship between staging and palette content
  const [stagingPopulatedAt, setStagingPopulatedAt] = useState<number>(0);
  const [lastQuerySubmittedAt, setLastQuerySubmittedAt] = useState<number>(0);
  const stagingAreaRef = useRef<HTMLDivElement>(null);
  // Recommendation state (for "What should I do?" feature)
  // Note: Recommendation response is now stored in aiAssistant.state.response
  const [excludedTaskIds, setExcludedTaskIds] = useState<string[]>([]);

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
    }

    // Get active staging context for follow-up questions about pending suggestions
    const activeStaging = getActiveStaging();

    try {
      const response = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: query,
          currentList: currentTask?.steps || [],
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
          // Include pending staging context for follow-up questions
          pendingSuggestions: activeStaging?.suggestions || null,
          pendingEdits: activeStaging?.edits || null,
          pendingDeletions: activeStaging?.deletions || null,
          pendingAction: activeStaging?.pendingAction || null,
          ...viewContext,  // Include view-specific context
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
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
          ? data.steps.map((step: Step) => ({
              id: step.id,
              text: step.text,
              substeps: step.substeps.map((sub) => ({ id: sub.id, text: sub.text })),
              estimatedMinutes: step.estimatedMinutes || undefined,
            }))
          : data.suggestions || [];

        updateActiveStaging(() => ({
          suggestions,
          edits: [],
          deletions: [],
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
          suggestedTitle: null,
          pendingAction,
        }));

        // Trigger StagingArea pulse animation
        if (responseCategory === 'structured') {
          setStagingIsNewArrival(true);
          setStagingPopulatedAt(Date.now());  // Track when staging was populated
        }
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

  // Reset prompt when user interacts with AI (expand or submit)
  useEffect(() => {
    if (aiAssistant.state.mode !== 'collapsed') {
      contextualPrompts.resetPrompt();
    }
  }, [aiAssistant.state.mode, contextualPrompts.resetPrompt]);

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
  }, [aiAssistant.state.mode, state.currentView, activeTask?.id]);

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
          // Priority 1: Close AI drawer if open
          if (aiAssistant.state.mode === 'drawer') {
            aiAssistant.closeDrawer();
          }
          // Priority 2: Collapse Palette to MiniBar if expanded
          else if (aiAssistant.state.mode === 'expanded') {
            setPaletteManuallyOpened(false);
            aiAssistant.collapse();
          }
          // Priority 3: Go back from task detail or focus mode
          else if (state.currentView === 'taskDetail' || state.currentView === 'focusMode') {
            setState((prev) => ({
              ...prev,
              currentView: previousView,
              activeTaskId: null,
            }));
          }
          // Priority 4: Close project modal
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
  }, [state.currentView, previousView, projectModalOpen, aiAssistant.state.mode, aiAssistant.closeDrawer, aiAssistant.collapse, aiAssistant.expand]);

  // ============================================
  // Edge Swipe Navigation
  // ============================================

  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const EDGE_THRESHOLD = 20; // px from screen edge to trigger swipe
  const SWIPE_MIN_DISTANCE = 50; // minimum horizontal distance for swipe
  const SWIPE_RATIO = 2; // horizontal must be > 2x vertical

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    // Only track swipes that start near screen edges
    const touch = e.touches[0];
    const isLeftEdge = touch.clientX < EDGE_THRESHOLD;
    const isRightEdge = touch.clientX > window.innerWidth - EDGE_THRESHOLD;

    if (isLeftEdge || isRightEdge) {
      swipeStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }
  }, []);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - swipeStartRef.current.y);

    // Check if this is a valid horizontal swipe
    if (Math.abs(deltaX) > SWIPE_MIN_DISTANCE && Math.abs(deltaX) > deltaY * SWIPE_RATIO) {
      // Only navigate between Focus and Tasks (the two main tabs)
      if (state.currentView === 'focus' || state.currentView === 'tasks') {
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
  }, [state.currentView]);

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
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
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
  }, []);

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
    setState((prev) => {
      deferredTask = prev.tasks.find((t) => t.id === taskId);
      if (deferredTask) {
        previousDeferredUntil = deferredTask.deferredUntil;
        previousDeferredAt = deferredTask.deferredAt;
        previousDeferredCount = deferredTask.deferredCount;
      }
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
                updatedAt: Date.now(),
              }
            : t
        ),
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
  }, []);

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
      const updatedItem: FocusQueueItem = {
        ...sortedItems[sortedIndex],
        selectionType,
        selectedStepIds,
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
  const handleReorderQueue = useCallback((
    newItems: FocusQueueItem[],
    newTodayLineIndex: number
  ) => {
    setState((prev) => {
      const completedItems = prev.focusQueue.items.filter(i => i.completed);

      // Re-assign orders to the reordered active items
      const reorderedActive = newItems.map((item, idx) => ({
        ...item,
        order: idx,
      }));

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
    let shouldSetPreviousViewToFocus = false;

    setState((prev) => {
      const focusedTask = prev.tasks.find((t) => t.id === prev.focusMode.taskId);
      const wasJustCompleted = focusedTask?.status === 'complete';

      // If task was just completed, navigate to task details to show success toast
      // Otherwise, go back to previous view
      const nextView = wasJustCompleted ? 'taskDetail' as ViewType : previousView;
      const nextActiveTaskId = wasJustCompleted ? focusedTask.id : prev.activeTaskId;

      // Flag to set previousView so back button returns to Focus Queue
      if (wasJustCompleted) {
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

      if (!response.ok) throw new Error("API request failed");

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
              staging: updatedStaging,
              updatedAt: Date.now(),
            };
          }),
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
            ? { ...t, steps: newSteps, staging: updatedStaging, updatedAt: Date.now() }
            : t
        ),
      };
    });
  }, [state.activeTaskId]);

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

      const updatedSteps = edit.targetType === 'step'
        ? task.steps.map((s) =>
            s.id === edit.targetId
              ? { ...s, text: edit.newText, wasEdited: true }
              : s
          )
        : task.steps.map((s) =>
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
          );

      const updatedStaging = task.staging
        ? { ...task.staging, edits: task.staging.edits.filter((e) => e.targetId !== edit.targetId) }
        : null;

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === state.activeTaskId
            ? { ...t, steps: updatedSteps, staging: updatedStaging, updatedAt: Date.now() }
            : t
        ),
      };
    });
  }, [state.activeTaskId]);

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
                staging: null,
                completionType: 'step_based',
                aiAssisted: true,
                updatedAt: Date.now(),
              }
            : t
        ),
      }));
    } else {
      // Normal suggest flow - add steps one by one
      staging.suggestions.forEach((suggestion) => {
        handleAcceptSuggestion(suggestion);
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
  }, [state.activeTaskId, getActiveStaging, handleAcceptTitle, handleAcceptSuggestion, handleAcceptEdit, handleAcceptDeletion, clearActiveStaging, aiAssistant, lastQuerySubmittedAt, stagingPopulatedAt]);

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
          onToggleAI={() => aiAssistant.expand()}
          isAIDrawerOpen={aiAssistant.state.mode !== 'collapsed'}
          inboxCount={inboxTasks.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={handleSearchFocus}
        />

        {/* Main Content - shifts left when drawer open on desktop */}
        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            aiAssistant.state.mode === 'drawer' ? 'lg:mr-80' : ''
          }`}
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
        >
          {/* pb-48 clears AI minibar + room for dropdowns; pb-24 on desktop for minibar; when AI open pb-[52vh] for bottom sheet */}
          <div className={`max-w-4xl mx-auto px-4 py-6 ${aiAssistant.state.mode !== 'collapsed' ? 'lg:pb-24 pb-[52vh]' : 'pb-48 lg:pb-24'}`}>
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
                onUpdateStepSelection={handleUpdateStepSelection}
                onReorderQueue={handleReorderQueue}
                onMoveItemUp={handleMoveQueueItemUp}
                onMoveItemDown={handleMoveQueueItemDown}
                onGoToInbox={handleGoToInbox}
              />
            )}

            {state.currentView === 'tasks' && (
              <TasksView
                inboxTasks={inboxTasks}
                poolTasks={poolTasks}
                queue={state.focusQueue}
                projects={state.projects}
                onCreateTask={handleCreateTaskQuick}
                onOpenTask={handleOpenTask}
                onSendToPool={handleSendToPool}
                onAddToQueue={handleAddToQueue}
                onDefer={handleDefer}
                onPark={handlePark}
                onDelete={handleDeleteTask}
                onGoToInbox={handleGoToInbox}
                onOpenAIDrawer={() => aiAssistant.expand()}
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
                onExportData={handleExportData}
                onImportData={handleImportData}
                showToast={showToast}
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
                suggestions={activeTask.staging?.suggestions || []}
                edits={activeTask.staging?.edits || []}
                deletions={activeTask.staging?.deletions || []}
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
                onOpenAIDrawer={() => aiAssistant.expand()}
                suggestions={activeTask.staging?.suggestions || []}
                edits={activeTask.staging?.edits || []}
                deletions={activeTask.staging?.deletions || []}
                suggestedTitle={activeTask.staging?.suggestedTitle || null}
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

      {/* AI Assistant (MiniBar/Palette/Drawer) - Session 1 integration */}
      {/* Only show when not in drawer mode (drawer handled separately) */}
      {aiAssistant.state.mode !== 'drawer' && (
        <div className="fixed bottom-6 left-6 right-6 sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 sm:w-auto">
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
            onOpenDrawer={aiAssistant.openDrawer}
          />
        </div>
      )}

      {/* AI Assistant Drawer (full chat) */}
      <AnimatePresence>
        {aiAssistant.state.mode === 'drawer' && (
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

