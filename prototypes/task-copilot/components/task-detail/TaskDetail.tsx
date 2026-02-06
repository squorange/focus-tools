"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Repeat, History, Pause, Play, X, Lock, Plus, ChevronDown, ChevronRight, Check } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Task, Step, SuggestedStep, EditSuggestion, DeletionSuggestion, MetadataSuggestion, FocusQueue, Project, AITargetContext, createStep, UserSettings, DrawerType } from "@/lib/types";
import { formatDuration, formatDate, isDateOverdue, getDisplayStatus, getStatusInfo, computeHealthStatus } from "@/lib/utils";
import { getTodayISO, ensureInstance, describePattern, getActiveOccurrenceDate } from "@/lib/recurring-utils";
import { RecurrenceRuleExtended } from "@/lib/recurring-types";
import StagingArea from "@/components/StagingArea";
import NotesModule from "@/components/NotesModule";
import { BottomSheet } from "@design-system/components";
import MetadataPill from "@/components/shared/MetadataPill";
import HealthPill from "@/components/shared/HealthPill";
import ReminderPicker from "@/components/shared/ReminderPicker";
import StartPokeField from "@/components/task-detail/StartPokeField";
import DurationInput from "@/components/shared/DurationInput";
import { getDuration, getStepDurationSum } from "@/lib/start-poke-utils";
import HistoryModal from "@/components/routines/HistoryModal";
import RecurrenceFields from "@/components/task-detail/RecurrenceFields";
import StatusModule from "@/components/task-detail/StatusModule";
import DetailsSection from "@/components/task-detail/DetailsSection";
import { formatReminder, scheduleReminder, cancelReminder } from "@/lib/notifications";
import { getStartPokeStatus, formatPokeTime, isStartPokeEnabled } from "@/lib/start-poke-utils";
import { StartPokeSettings } from "@/lib/notification-types";

// Format date for routine section headers: "Today, January 19" or "Tuesday, January 20"
function formatRoutineDateHeader(dateStr: string): string {
  const today = getTodayISO();
  const date = new Date(dateStr + 'T12:00:00'); // Noon to avoid timezone issues

  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  const formattedDate = date.toLocaleDateString('en-US', options);

  if (dateStr === today) {
    return `Today, ${formattedDate}`;
  }

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  return `${dayName}, ${formattedDate}`;
}

interface TaskDetailProps {
  task: Task;
  queue: FocusQueue;
  projects: Project[];
  userSettings: UserSettings;
  // Mode for recurring tasks: 'executing' = work on today's instance, 'managing' = edit template
  mode?: 'executing' | 'managing';
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  deletions: DeletionSuggestion[];
  metadataSuggestions?: MetadataSuggestion[];
  suggestedTitle: string | null;
  stagingIsNewArrival?: boolean;
  onStagingAnimationComplete?: () => void;
  onBack: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onStepComplete: (taskId: string, stepId: string, completed: boolean) => void;
  onSubstepComplete: (taskId: string, stepId: string, substepId: string, completed: boolean, mode?: 'executing' | 'managing') => void;
  onUpdateStep: (taskId: string, stepId: string, text: string, mode?: 'executing' | 'managing') => void;
  onUpdateStepEstimate: (taskId: string, stepId: string, minutes: number | null) => void;
  onUpdateSubstep: (taskId: string, stepId: string, substepId: string, text: string, mode?: 'executing' | 'managing') => void;
  onAddStep: (taskId: string, text: string, mode?: 'executing' | 'managing') => void;
  onDeleteStep: (taskId: string, stepId: string, mode?: 'executing' | 'managing') => void;
  onMoveStepUp: (taskId: string, stepId: string) => void;
  onMoveStepDown: (taskId: string, stepId: string) => void;
  onAddSubstep: (taskId: string, stepId: string, text: string, mode?: 'executing' | 'managing') => void;
  onDeleteSubstep: (taskId: string, stepId: string, substepId: string, mode?: 'executing' | 'managing') => void;
  onMoveSubstepUp: (taskId: string, stepId: string, substepId: string) => void;
  onMoveSubstepDown: (taskId: string, stepId: string, substepId: string) => void;
  onAddToQueue: (taskId: string, forToday?: boolean, selectionType?: 'all_today' | 'all_upcoming' | 'specific_steps', selectedStepIds?: string[]) => void;
  onUpdateStepSelection: (queueItemId: string, selectionType: 'all_today' | 'all_upcoming' | 'specific_steps', selectedStepIds: string[]) => void;
  onSendToPool: (taskId: string) => void;
  onDefer: (taskId: string, until: string) => void;
  onClearDefer?: (taskId: string) => void;
  onClearWaitingOn?: (taskId: string) => void;
  onPark: (taskId: string) => void;
  onUnarchive: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onStartFocus: (queueItemId: string) => void;
  onOpenAIDrawer: () => void;
  onAIBreakdown: () => void;
  onAcceptOne: (suggestion: SuggestedStep) => void;
  onAcceptAll: () => void;
  onDismiss: () => void;
  onAcceptEdit: (edit: EditSuggestion) => void;
  onRejectEdit: (edit: EditSuggestion) => void;
  onAcceptDeletion: (deletion: DeletionSuggestion) => void;
  onRejectDeletion: (deletion: DeletionSuggestion) => void;
  onAcceptMetadata?: (metadata: MetadataSuggestion) => void;
  onRejectMetadata?: (metadata: MetadataSuggestion) => void;
  onAcceptTitle: () => void;
  onRejectTitle: () => void;
  onOpenProjectModal: (project?: Project) => void;
  onOpenProjectModalWithCallback?: (callback: (projectId: string) => void) => void;
  onOpenDatePickerModal?: (callback: (dateStr: string) => void) => void;
  // Inline AI actions
  aiTargetContext?: AITargetContext | null;
  isAILoading?: boolean;  // True when AI request is in flight
  onOpenAIPalette?: (taskId: string, stepId: string) => void;
  onClearAITarget?: () => void;
  // Recurring task actions
  onCompleteRoutine?: (taskId: string) => void;
  onSkipRoutine?: (taskId: string) => void;
  onMarkRoutineIncomplete?: (taskId: string) => void;
  onUnskipRoutine?: (taskId: string) => void;
  onStartRecurringFocus?: (taskId: string) => void;
  // Routine step scope
  onAcceptWithScope?: (scope: 'instance' | 'template') => void;
  // Mode toggling
  onToggleMode?: () => void;
  onResetFromTemplate?: () => void;
  // Centralized drawer management
  activeDrawer?: DrawerType;
  onOpenDrawer?: (drawer: DrawerType) => void;
  onCloseDrawer?: () => void;
  // FocusSelectionModal (lifted to page.tsx for root-level rendering)
  onOpenFocusSelection?: (queueItemId: string) => void;
}

// Get queue item for this task
function getQueueItem(task: Task, queue: FocusQueue) {
  return queue.items.find((i) => i.taskId === task.id && !i.completed);
}


export default function TaskDetail({
  task,
  queue,
  projects,
  userSettings,
  mode = 'executing',
  suggestions,
  edits,
  deletions,
  metadataSuggestions,
  suggestedTitle,
  stagingIsNewArrival = false,
  onStagingAnimationComplete,
  onBack,
  onUpdateTask,
  onStepComplete,
  onSubstepComplete,
  onUpdateStep,
  onUpdateStepEstimate,
  onUpdateSubstep,
  onAddStep,
  onDeleteStep,
  onMoveStepUp,
  onMoveStepDown,
  onAddSubstep,
  onDeleteSubstep,
  onMoveSubstepUp,
  onMoveSubstepDown,
  onAddToQueue,
  onUpdateStepSelection,
  onSendToPool,
  onDefer,
  onClearDefer,
  onClearWaitingOn,
  onPark,
  onUnarchive,
  onDeleteTask,
  onStartFocus,
  onOpenAIDrawer,
  onAIBreakdown,
  onAcceptOne,
  onAcceptAll,
  onDismiss,
  onAcceptEdit,
  onRejectEdit,
  onAcceptDeletion,
  onRejectDeletion,
  onAcceptMetadata,
  onRejectMetadata,
  onAcceptTitle,
  onRejectTitle,
  onOpenProjectModal,
  onOpenProjectModalWithCallback,
  onOpenDatePickerModal,
  aiTargetContext,
  isAILoading,
  onOpenAIPalette,
  onClearAITarget,
  onCompleteRoutine,
  onSkipRoutine,
  onMarkRoutineIncomplete,
  onUnskipRoutine,
  onStartRecurringFocus,
  onAcceptWithScope,
  onToggleMode,
  onResetFromTemplate,
  activeDrawer,
  onOpenDrawer,
  onCloseDrawer,
  onOpenFocusSelection,
}: TaskDetailProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(task.title);
  const [newStepText, setNewStepText] = useState("");
  const [showDeferMenu, setShowDeferMenu] = useState(false);
  const [completedStepsExpanded, setCompletedStepsExpanded] = useState(false);
  // Single popover constraint: tracks which menu is open (pattern: "step-{id}", "substep-{id}")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // Auto-expand details for inbox tasks (triage mode), collapse for ready/queued tasks
  const [detailsExpanded, setDetailsExpanded] = useState(task.status === 'inbox');
  // Phase 0: Feature flag for new DetailsSection UI
  // Set to true to use the new sectioned layout, false for legacy
  const useNewDetailsUI = true;
  // Waiting On modal state (for bottom actions)
  const [showWaitingOnModal, setShowWaitingOnModal] = useState(false);
  const [waitingOnInput, setWaitingOnInput] = useState(task.waitingOn?.who || '');
  const [waitingOnFollowUp, setWaitingOnFollowUp] = useState(task.waitingOn?.followUpDate || '');
  const [showFollowUpDropdown, setShowFollowUpDropdown] = useState(false);
  const followUpButtonRef = useRef<HTMLButtonElement>(null);
  const [followUpDropdownPosition, setFollowUpDropdownPosition] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  // Defer modal state for custom date
  const [showDeferCustomDate, setShowDeferCustomDate] = useState(false);
  const [deferCustomDate, setDeferCustomDate] = useState('');
  // Mobile view detection
  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  // Calculate follow-up dropdown position when it opens
  useEffect(() => {
    if (showFollowUpDropdown && followUpButtonRef.current) {
      const rect = followUpButtonRef.current.getBoundingClientRect();
      if (isMobileView) {
        setFollowUpDropdownPosition({
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
        });
      } else {
        setFollowUpDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    }
  }, [showFollowUpDropdown, isMobileView]);
  // Add to Focus dropdown state
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  // Mobile kebab menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // Reminder picker state
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  // Project dropdown state
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler for project dropdown
  useEffect(() => {
    if (!showProjectDropdown) return;

    function handleClickOutside(e: MouseEvent) {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProjectDropdown]);

  // Swipe-back gesture handling is now centralized in page.tsx (on <main> element)
  // This ensures iOS Safari fires touch events correctly on the scroll container

  // Calculate defer dates
  const getDeferDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  const queueItem = getQueueItem(task, queue);
  const isInQueue = !!queueItem;
  const progress = task.steps.length > 0
    ? { completed: task.steps.filter((s) => s.completed).length, total: task.steps.length }
    : null;
  const isTaskComplete = task.status === 'complete';
  const canMarkComplete = !isTaskComplete;
  const canMarkIncomplete = isTaskComplete;

  // Recurring task state
  const isRecurring = task.isRecurring && task.recurrence;
  // In executing mode for recurring tasks, details should be read-only (except Reminder/Notes)
  const isReadOnlyDetails = isRecurring && mode === 'executing';
  // Use getActiveOccurrenceDate for routines with rollover (returns overdue date if applicable)
  const activeDate = isRecurring ? (getActiveOccurrenceDate(task) || getTodayISO()) : null;
  const recurrencePattern = task.recurrence as RecurrenceRuleExtended | null;
  const isPaused = recurrencePattern?.pausedAt ? true : false;
  const patternDescription = recurrencePattern ? describePattern(recurrencePattern) : '';
  const [showRoutinePopover, setShowRoutinePopover] = useState(false);
  // History modal - use centralized drawer state if available
  const showHistoryModal = activeDrawer === 'history';
  const setShowHistoryModal = (show: boolean) => {
    if (show && onOpenDrawer) {
      onOpenDrawer('history');
    } else if (!show && onCloseDrawer) {
      onCloseDrawer();
    }
  };
  // Pattern modal is handled by DetailsSection
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [isPatternHandleHovered, setIsPatternHandleHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Get current instance for recurring tasks (lazy - only called when rendering)
  const getCurrentInstance = () => {
    if (!isRecurring || !activeDate) return null;
    return ensureInstance(task, activeDate);
  };
  const currentInstance = isRecurring ? getCurrentInstance() : null;

  // Compute target step for staging area (when suggestions have parentStepId)
  const targetStepForStaging = useMemo(() => {
    const parentId = suggestions.find(s => s.parentStepId)?.parentStepId;
    if (!parentId) return null;

    // Get current steps based on mode
    const currentSteps = mode === 'executing' && isRecurring && currentInstance
      ? currentInstance.steps
      : task.steps;

    const stepIndex = currentSteps.findIndex(s => s.id === parentId);
    if (stepIndex === -1) return null;

    return {
      id: parentId,
      text: currentSteps[stepIndex].text,
      stepNumber: String(stepIndex + 1),
    };
  }, [suggestions, task.steps, mode, isRecurring, currentInstance]);

  // Split steps into completed and incomplete for collapsible view
  const completedSteps = task.steps.filter((s) => s.completed);
  const incompleteSteps = task.steps.filter((s) => !s.completed);
  const hasCompletedSteps = completedSteps.length > 0;
  const hasIncompleteSteps = incompleteSteps.length > 0;
  const allStepsComplete = task.steps.length > 0 && incompleteSteps.length === 0;

  // When in queue, split incomplete steps into Today vs Upcoming based on selection
  const todayStepIds = isInQueue
    ? (queueItem!.selectionType === 'all_today'
        ? incompleteSteps.map(s => s.id) // All incomplete are Today
        : queueItem!.selectionType === 'all_upcoming'
          ? [] // All incomplete are Upcoming
          : queueItem!.selectedStepIds.filter(id => incompleteSteps.some(s => s.id === id)))
    : [];
  const todaySteps = incompleteSteps.filter(s => todayStepIds.includes(s.id));
  const upcomingSteps = incompleteSteps.filter(s => !todayStepIds.includes(s.id));

  // Determine if StatusModule will render content (matches StatusModule's return null logic)
  const showStatusModule = task.status !== 'inbox';
  const statusWillRender = showStatusModule && (
    // Recurring always shows
    isRecurring ||
    // One-off with steps and some progress shows
    (progress && progress.completed > 0) ||
    // Completed stepless shows
    (progress === null && task.status === 'complete')
  );

  // Build details summary for collapsed view
  const getDetailsSummary = () => {
    const pills: { label: string; variant: 'default' | 'priority-high' | 'priority-medium' | 'healthy' | 'due' | 'overdue' | 'project'; color?: string; icon?: 'bell' | 'poke'; health?: ReturnType<typeof computeHealthStatus> }[] = [];

    // RECURRING TASKS: Only show reminder + start poke info if set
    if (isRecurring) {
      if (task.reminder) {
        pills.push({ label: formatReminder(task.reminder, task.targetDate, task.deadlineDate), variant: 'default', icon: 'bell' });
      }
      // Start Poke indicator for recurring
      if (task.startPokeOverride !== 'off') {
        const pokeSettings: StartPokeSettings = {
          startPokeEnabled: userSettings.startPokeEnabled,
          startPokeDefault: userSettings.startPokeDefault,
          startPokeBufferMinutes: userSettings.startPokeBufferMinutes,
          startPokeBufferPercentage: userSettings.startPokeBufferPercentage,
        };
        const pokeStatus = getStartPokeStatus(task, pokeSettings);
        if (pokeStatus.enabled && pokeStatus.nudgeTime !== null) {
          pills.push({ label: `Start at ${formatPokeTime(pokeStatus.nudgeTime)}`, variant: 'default', icon: 'poke' });
        }
      }
      return pills;
    }

    // ONE-OFF TASKS: Full details
    // Use utility function to get proper display status (Today/Focus instead of Ready for queued items)
    const displayStatus = getDisplayStatus(task, queueItem, queue.todayLineIndex);
    const statusInfo = getStatusInfo(displayStatus);
    pills.push({ label: statusInfo.label, variant: 'project', color: statusInfo.color });
    if (task.priority === 'high') {
      pills.push({ label: 'High', variant: 'priority-high' });
    } else if (task.priority === 'medium') {
      pills.push({ label: 'Medium', variant: 'priority-medium' });
    }
    // Health status (pool tasks - only show for non-healthy status)
    if (task.status === 'pool') {
      const health = computeHealthStatus(task);
      if (health.status !== 'healthy') {
        pills.push({ label: '', variant: 'default', health });
      }
    }
    if (task.deadlineDate) {
      const overdue = isDateOverdue(task.deadlineDate);
      pills.push({ label: `Due ${formatDate(task.deadlineDate)}`, variant: overdue ? 'overdue' : 'due' });
    } else if (task.targetDate) {
      pills.push({ label: `Target ${formatDate(task.targetDate)}`, variant: 'default' });
    }
    // Reminder (with bell icon)
    if (task.reminder) {
      pills.push({ label: formatReminder(task.reminder, task.targetDate, task.deadlineDate), variant: 'default', icon: 'bell' });
    }
    // Start Poke indicator for one-off tasks
    if (task.startPokeOverride !== 'off') {
      const pokeSettings: StartPokeSettings = {
        startPokeEnabled: userSettings.startPokeEnabled,
        startPokeDefault: userSettings.startPokeDefault,
        startPokeBufferMinutes: userSettings.startPokeBufferMinutes,
        startPokeBufferPercentage: userSettings.startPokeBufferPercentage,
      };
      const pokeStatus = getStartPokeStatus(task, pokeSettings);
      if (pokeStatus.enabled && pokeStatus.nudgeTime !== null) {
        pills.push({ label: `Start at ${formatPokeTime(pokeStatus.nudgeTime)}`, variant: 'default', icon: 'poke' });
      }
    }
    const project = projects.find(p => p.id === task.projectId);
    if (project) {
      pills.push({ label: project.name, variant: 'project', color: project.color || undefined });
    }
    if (task.waitingOn?.who) {
      pills.push({ label: `Waiting: ${task.waitingOn.who}`, variant: 'priority-medium' });
    }
    return pills;
  };
  const detailsSummary = getDetailsSummary();

  const handleMarkTaskComplete = () => {
    const now = Date.now();
    // Mark task complete and all steps/substeps complete
    const updatedSteps = task.steps.map((s) => ({
      ...s,
      completed: true,
      completedAt: s.completedAt || now,
      substeps: s.substeps.map((sub) => ({
        ...sub,
        completed: true,
        completedAt: sub.completedAt || now,
      })),
    }));
    onUpdateTask(task.id, {
      status: 'complete',
      completedAt: now,
      completionType: 'manual',
      steps: updatedSteps,
    });
  };

  const handleMarkTaskIncomplete = () => {
    // Uncheck all steps/substeps and set status back to pool
    const updatedSteps = task.steps.map((s) => ({
      ...s,
      completed: false,
      completedAt: null,
      substeps: s.substeps.map((sub) => ({
        ...sub,
        completed: false,
        completedAt: null,
      })),
    }));
    onUpdateTask(task.id, {
      status: 'pool',
      completedAt: null,
      steps: updatedSteps,
    });
  };

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== task.title) {
      onUpdateTask(task.id, { title: titleInput.trim() });
    }
    setEditingTitle(false);
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStepText.trim()) {
      onAddStep(task.id, newStepText.trim(), mode);
      setNewStepText("");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header - back button now in main Header, edge swipe still works */}
      <div className="mb-6">
        {/* Row 1: Title + Status + Desktop buttons */}
        <div className="flex items-start gap-3">
          {/* Title + Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              {editingTitle ? (
                <textarea
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleTitleSave();
                    }
                    if (e.key === "Escape") {
                      setTitleInput(task.title);
                      setEditingTitle(false);
                    }
                  }}
                  onInput={(e) => {
                    const target = e.currentTarget;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  className="flex-1 min-w-0 text-xl font-semibold text-fg-neutral-primary bg-transparent border-b-2 border-violet-500 focus:outline-none resize-none overflow-hidden min-h-[1.75rem]"
                  autoFocus
                  rows={1}
                />
              ) : (
                <h1
                  onClick={() => setEditingTitle(true)}
                  className="flex-1 min-w-0 text-xl font-semibold text-fg-neutral-primary break-words cursor-text hover:text-violet-600 dark:hover:text-violet-400"
                >
                  {task.title || "Untitled Task"}
                </h1>
              )}
            </div>
          </div>

          {/* Queue/Focus actions - Desktop only */}
          <div className="hidden sm:flex items-start gap-2 pt-0.5 flex-shrink-0">
            {isRecurring ? (
              /* Recurring task buttons */
              <>
                {/* Only show Complete/Skip/Mark Incomplete in executing mode */}
                {mode !== 'managing' && (
                  <>
                    {/* Show Mark Incomplete if instance is completed */}
                    {currentInstance?.completed && onMarkRoutineIncomplete ? (
                      <button
                        onClick={() => onMarkRoutineIncomplete(task.id)}
                        className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                      >
                        Mark Incomplete
                      </button>
                    ) : currentInstance?.skipped && onUnskipRoutine ? (
                      /* Show Unskip if skipped */
                      <button
                        onClick={() => onUnskipRoutine(task.id)}
                        className="px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/40 rounded-lg transition-colors"
                      >
                        Unskip
                      </button>
                    ) : (
                      /* Show Focus/Complete/Skip if not completed and not skipped */
                      <>
                        {/* Focus button first - primary action for engagement */}
                        {!isPaused && onStartRecurringFocus && (
                          <button
                            onClick={() => onStartRecurringFocus(task.id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                          >
                            Focus
                          </button>
                        )}
                        {!isPaused && onCompleteRoutine && (
                          <button
                            onClick={() => onCompleteRoutine(task.id)}
                            className="px-4 py-2 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40 rounded-lg transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {!isPaused && onSkipRoutine && (
                          <button
                            onClick={() => onSkipRoutine(task.id)}
                            className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                          >
                            Skip
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden lg:inline">History</span>
                </button>
              </>
            ) : (
              /* Regular task buttons (Focus first for consistency with recurring) */
              <>
                {/* Focus button first - primary action for engagement (matches recurring task pattern) */}
                {isInQueue && (
                  <button
                    onClick={() => onStartFocus(queueItem!.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                  >
                    Focus
                  </button>
                )}
                {canMarkComplete && (
                  <button
                    onClick={handleMarkTaskComplete}
                    className="px-4 py-2 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40 rounded-lg transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
                {canMarkIncomplete && (
                  <button
                    onClick={handleMarkTaskIncomplete}
                    className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                  >
                    Mark Incomplete
                  </button>
                )}
                {!isInQueue && (
                  <>
                    {task.status === "inbox" && (
                      <button
                        onClick={() => onSendToPool(task.id)}
                        className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                      >
                        Move to Ready
                      </button>
                    )}
                    {/* Add to Focus with dropdown */}
                    <div className="relative">
                      <div className="flex">
                        <button
                          onClick={() => onAddToQueue(task.id, false, 'all_upcoming', [])}
                          className="px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-fg-neutral-primary hover:bg-bg-neutral-subtle-hover rounded-l-lg transition-colors"
                        >
                          Add to Focus
                        </button>
                        <div className="w-px" />
                        <button
                          onClick={() => setShowAddDropdown(!showAddDropdown)}
                          className="px-2 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-fg-neutral-primary hover:bg-bg-neutral-subtle-hover rounded-r-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      {showAddDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowAddDropdown(false)} />
                          <div className="absolute right-0 top-full mt-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[160px]">
                            <button
                              onClick={() => {
                                onAddToQueue(task.id, true, 'all_today', []);
                                setShowAddDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle"
                            >
                              Add to Today
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>


        {/* Row 2: Mobile buttons */}
        <div className="flex sm:hidden items-center gap-2 mt-3 flex-wrap">
          {isRecurring ? (
            /* Recurring task buttons - mobile */
            <>
              {/* Only show Complete/Skip/Mark Incomplete/Unskip in executing mode */}
              {mode !== 'managing' && (
                <>
                  {/* Show Mark Incomplete if instance is completed */}
                  {currentInstance?.completed && onMarkRoutineIncomplete ? (
                    <button
                      onClick={() => onMarkRoutineIncomplete(task.id)}
                      className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                    >
                      Mark Incomplete
                    </button>
                  ) : currentInstance?.skipped && onUnskipRoutine ? (
                    /* Show Unskip if skipped */
                    <button
                      onClick={() => onUnskipRoutine(task.id)}
                      className="px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/40 rounded-lg transition-colors"
                    >
                      Unskip
                    </button>
                  ) : (
                    /* Show Focus/Complete/Skip if not completed and not skipped */
                    <>
                      {/* Focus button first - primary action for engagement */}
                      {!isPaused && onStartRecurringFocus && (
                        <button
                          onClick={() => onStartRecurringFocus(task.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                        >
                          Focus
                        </button>
                      )}
                      {!isPaused && onCompleteRoutine && (
                        <button
                          onClick={() => onCompleteRoutine(task.id)}
                          className="px-4 py-2 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40 rounded-lg transition-colors"
                        >
                          Complete
                        </button>
                      )}
                      {!isPaused && onSkipRoutine && (
                        <button
                          onClick={() => onSkipRoutine(task.id)}
                          className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                        >
                          Skip
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
              {/* History button - full label in managing mode (only button), icon-only with matched height otherwise */}
              <button
                onClick={() => setShowHistoryModal(true)}
                className={`text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors ${
                  mode === 'managing'
                    ? 'px-4 py-2 flex items-center gap-1.5'
                    : 'p-2.5'
                }`}
                title="History"
              >
                <History className="w-4 h-4" />
                {mode === 'managing' && <span>History</span>}
              </button>
            </>
          ) : (
            /* Regular task buttons - mobile (Focus first for consistency with recurring) */
            <>
              {/* Focus button first - primary action for engagement (matches recurring task pattern) */}
              {isInQueue && (
                <button
                  onClick={() => onStartFocus(queueItem!.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                >
                  Focus
                </button>
              )}
              {canMarkComplete && (
                <button
                  onClick={handleMarkTaskComplete}
                  className="px-4 py-2 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40 rounded-lg transition-colors"
                >
                  Mark Complete
                </button>
              )}
              {canMarkIncomplete && (
                <button
                  onClick={handleMarkTaskIncomplete}
                  className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                >
                  Mark Incomplete
                </button>
              )}
              {!isInQueue && task.status === "inbox" && (
                <button
                  onClick={() => onSendToPool(task.id)}
                  className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                >
                  Move to Ready
                </button>
              )}
            </>
          )}
          {/* Add to Focus split button (mobile) - only for pool tasks, not inbox (too wide), not recurring */}
          {!isRecurring && !isInQueue && task.status === 'pool' && (
            <div className="relative">
              <div className="flex">
                <button
                  onClick={() => onAddToQueue(task.id, false, 'all_upcoming', [])}
                  className="px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-fg-neutral-primary hover:bg-bg-neutral-subtle-hover rounded-l-lg transition-colors"
                >
                  Add to Focus
                </button>
                <div className="w-px" />
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="px-2 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-fg-neutral-primary hover:bg-bg-neutral-subtle-hover rounded-r-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {showMobileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMobileMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[160px]">
                    <button
                      onClick={() => {
                        onAddToQueue(task.id, true, 'all_today', []);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle"
                    >
                      Add to Today
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {/* Add to Focus kebab menu (mobile inbox only) - prevents line wrapping on small viewports, not recurring */}
          {!isRecurring && !isInQueue && task.status === 'inbox' && (
            <div className="relative">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="px-2 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-fg-neutral-secondary hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                title="Add to Focus options"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {showMobileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMobileMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[160px]">
                    <button
                      onClick={() => {
                        onAddToQueue(task.id, false, 'all_upcoming', []);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle"
                    >
                      Add to Focus
                    </button>
                    <button
                      onClick={() => {
                        onAddToQueue(task.id, true, 'all_today', []);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle"
                    >
                      Add to Today
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* All Banners - stacked with 8px gap */}
      {((isRecurring && onToggleMode) || (isRecurring && isPaused) || task.deferredUntil || task.waitingOn) && (
        <div className="space-y-2 mb-6">
          {/* Template/Instance Banner - shown for recurring tasks in both modes */}
          {isRecurring && onToggleMode && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${
              mode === 'managing'
                ? 'bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700'
                : 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200/60 dark:border-violet-800/60'
            }`}>
              <div className="flex items-center gap-2">
                {mode === 'managing' ? (
                  <>
                    <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                      Editing template
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                    For {activeDate ? formatRoutineDateHeader(activeDate) : 'today'}
                  </span>
                )}
              </div>
              <button
                onClick={onToggleMode}
                className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors"
              >
                {mode === 'managing' ? 'Show current →' : 'Edit template →'}
              </button>
            </div>
          )}

          {/* Paused Recurring Task Banner - amber theme */}
          {isRecurring && isPaused && (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
              <div className="flex items-center gap-2">
                <Pause className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Routine paused
                </span>
              </div>
              <button
                onClick={() => {
                  onUpdateTask(task.id, {
                    recurrence: {
                      ...recurrencePattern!,
                      pausedAt: null,
                      pausedUntil: null,
                    },
                  });
                }}
                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline transition-colors"
              >
                Resume
              </button>
            </div>
          )}

          {/* Deferred Status Banner - amber theme */}
          {task.deferredUntil && (() => {
            const deferExpired = task.deferredUntil <= getTodayISO();
            return (
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    {deferExpired
                      ? `Defer expired on ${formatDate(task.deferredUntil)}`
                      : `Deferred until ${formatDate(task.deferredUntil)}`}
                  </span>
                </div>
                {onClearDefer && (
                  <button
                    onClick={() => onClearDefer(task.id)}
                    className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline transition-colors"
                  >
                    {deferExpired ? 'Dismiss' : 'Clear'}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Waiting On Status Banner - amber theme */}
          {task.waitingOn && (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Waiting on {task.waitingOn.who}
                  {task.waitingOn.followUpDate && (
                    <span className="opacity-80"> · follow up {formatDate(task.waitingOn.followUpDate)}</span>
                  )}
                </span>
              </div>
              {onClearWaitingOn && (
                <button
                  onClick={() => onClearWaitingOn(task.id)}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* NEW: Refactored Details Section (Phase 0) */}
      {useNewDetailsUI && (
        <DetailsSection
          task={task}
          queue={queue}
          queueItem={queueItem}
          projects={projects}
          userSettings={userSettings}
          mode={mode}
          currentInstance={currentInstance}
          onUpdateTask={onUpdateTask}
          onOpenProjectModal={onOpenProjectModal}
          onOpenProjectModalWithCallback={onOpenProjectModalWithCallback}
          onToggleMode={onToggleMode}
          defaultExpanded={task.status === 'inbox'}
          completedStepsExpanded={completedStepsExpanded}
          onToggleCompletedSteps={() => setCompletedStepsExpanded(!completedStepsExpanded)}
          activeDrawer={activeDrawer}
          onOpenDrawer={onOpenDrawer}
          onCloseDrawer={onCloseDrawer}
        />
      )}

      {/* LEGACY: Details Section - Unified container with Status + Details */}
      {!useNewDetailsUI && <div className="mb-6">
        {/* Section Header */}
        <button
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="w-full flex items-center justify-between mb-2 group"
        >
          <h2 className="text-base font-medium text-fg-neutral-secondary">
            Details
          </h2>
          <svg
            className={`w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform ${detailsExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Unified Status/Details Container */}
        <div className="px-4 py-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border border-zinc-300/50 dark:border-zinc-700/50 shadow-xl shadow-black/10 dark:shadow-black/30 rounded-2xl">
          {/* Status Module - shown for non-inbox, non-managing tasks when it will render content */}
          {showStatusModule && (
            <StatusModule
              task={task}
              currentInstance={currentInstance}
              completedCount={progress?.completed ?? 0}
              totalCount={progress?.total ?? 0}
              hasCompletedSteps={hasCompletedSteps}
              completedStepsExpanded={completedStepsExpanded}
              onToggleCompletedSteps={() => setCompletedStepsExpanded(!completedStepsExpanded)}
              isInQueue={isInQueue}
              todayStepIds={todayStepIds}
              mode={mode}
              onToggleMode={isRecurring ? onToggleMode : undefined}
            />
          )}
          {/* Collapsible Details Content - now inside the unified container */}
          {/* Collapsed Summary - Pills with fade transition */}
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            !detailsExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}>
            <div className="overflow-hidden">
              {statusWillRender && detailsSummary.length > 0 && (
                <div className="my-3 border-t border-zinc-300/50 dark:border-zinc-700/50" />
              )}
              <div
                onClick={() => setDetailsExpanded(true)}
                className="flex flex-wrap gap-1.5 items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                {detailsSummary.map((pill, idx) => (
                  pill.health ? (
                    <HealthPill key={idx} health={pill.health} size="sm" showInfo={true} />
                  ) : (
                    <MetadataPill
                      key={idx}
                      variant={pill.variant}
                      color={pill.color}
                      icon={pill.icon === 'bell' ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      ) : pill.icon === 'poke' ? (
                        <span className="text-[10px]">👉🏽</span>
                      ) : undefined}
                    >
                      {pill.label}
                    </MetadataPill>
                  )
                ))}
              </div>
            </div>
          </div>
          {/* Expanded Details - Input Fields with grid-rows animation */}
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            detailsExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}>
            <div className="overflow-hidden">
              {statusWillRender && (
                <div className="my-3 border-t border-zinc-300/50 dark:border-zinc-700/50" />
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 min-w-0">
              {/* LINE 1: Project - full width */}
              <div className="col-span-2">
                <span className="text-xs text-fg-neutral-secondary mb-1 block">Project</span>
                {isReadOnlyDetails ? (
                  /* Read-only: static display with lock icon */
                  <>
                    <div className="w-full h-8 px-2 text-sm bg-zinc-100 dark:bg-zinc-900 border border-border-color-neutral rounded-lg flex items-center justify-between text-fg-neutral-secondary">
                      <span>{projects.find(p => p.id === task.projectId)?.name || 'No project'}</span>
                      <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    </div>
                    <span className="text-xs text-fg-neutral-soft mt-1 block">Edit routine template to change settings</span>
                  </>
                ) : (
                  /* Editable: custom dropdown with inline "Add new project" */
                  <div ref={projectDropdownRef} className="relative">
                    <button
                      onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                      className="w-full h-8 px-2 pr-8 text-sm text-left bg-bg-neutral-min border border-border-color-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-fg-neutral-primary flex items-center"
                    >
                      {task.projectId ? (
                        <>
                          {projects.find(p => p.id === task.projectId)?.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
                              style={{ backgroundColor: projects.find(p => p.id === task.projectId)?.color || undefined }}
                            />
                          )}
                          <span className="truncate">{projects.find(p => p.id === task.projectId)?.name || 'Unknown project'}</span>
                        </>
                      ) : (
                        <span className="text-fg-neutral-soft">No project</span>
                      )}
                    </button>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />

                    {/* Dropdown menu */}
                    {showProjectDropdown && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg overflow-hidden">
                        {/* No project option */}
                        <button
                          onClick={() => {
                            onUpdateTask(task.id, { projectId: null });
                            setShowProjectDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center justify-between text-fg-neutral-secondary"
                        >
                          <span>No project</span>
                          {!task.projectId && <Check className="w-4 h-4 text-violet-500" />}
                        </button>

                        {/* Project options */}
                        {projects.filter(p => p.status === 'active').map((project) => (
                          <button
                            key={project.id}
                            onClick={() => {
                              onUpdateTask(task.id, { projectId: project.id });
                              setShowProjectDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center justify-between text-fg-neutral-primary"
                          >
                            <span className="flex items-center gap-2 truncate">
                              {project.color && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: project.color }}
                                />
                              )}
                              <span className="truncate">{project.name}</span>
                            </span>
                            {task.projectId === project.id && <Check className="w-4 h-4 text-violet-500 flex-shrink-0" />}
                          </button>
                        ))}

                        {/* Divider */}
                        <div className="border-t border-zinc-100 dark:border-zinc-700" />

                        {/* Add new project option */}
                        <button
                          onClick={() => {
                            setShowProjectDropdown(false);
                            if (onOpenProjectModalWithCallback) {
                              // Auto-select the new project after creation
                              onOpenProjectModalWithCallback((newProjectId) => {
                                onUpdateTask(task.id, { projectId: newProjectId });
                              });
                            } else {
                              onOpenProjectModal();
                            }
                          }}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2 text-violet-600 dark:text-violet-400"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add new project...</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* LINE 2: Recurring toggle - own row with larger label - HIDE in executing mode */}
              {!(isRecurring && mode === 'executing') && (
                <div className={`col-span-2 pt-3 mt-1 ${isReadOnlyDetails ? 'pointer-events-none opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-fg-neutral-primary">Recurring</span>
                    <button
                      onClick={() => {
                        if (task.isRecurring) {
                          // Turn off recurring
                          onUpdateTask(task.id, {
                            isRecurring: false,
                            recurrence: null,
                          });
                        } else {
                          // Turn on recurring with default daily pattern
                          // Auto-transition to pool (skip inbox triage for routines)
                          // Initialize recurringNextDue to today for immediate visibility
                          onUpdateTask(task.id, {
                            isRecurring: true,
                            recurrence: {
                              frequency: 'daily',
                              interval: 1,
                              daysOfWeek: null,
                              dayOfMonth: null,
                              weekOfMonth: null,
                              time: '09:00',
                              endDate: null,
                              endAfter: null,
                              rolloverIfMissed: false,
                              pausedAt: null,
                              pausedUntil: null,
                              maxOverdueDays: null,
                            },
                            recurringNextDue: getTodayISO(), // Initialize first due date
                            status: 'pool', // Routines skip triage
                          });
                          // Switch to managing mode so user can configure pattern
                          if (onToggleMode && mode !== 'managing') {
                            setTimeout(() => onToggleMode(), 0);
                          }
                        }
                      }}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${task.isRecurring
                          ? 'bg-violet-600'
                          : 'bg-zinc-200 dark:bg-zinc-700'
                        }
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${task.isRecurring ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Pattern field row - separate row with label, only when recurring is ON - HIDE in executing mode */}
              {!(isRecurring && mode === 'executing') && (
                <div className={`col-span-2 transition-all duration-200 ${
                  task.isRecurring
                    ? 'opacity-100 max-h-20'
                    : 'opacity-0 max-h-0 overflow-hidden'
                } ${isReadOnlyDetails ? 'pointer-events-none opacity-50' : ''}`}>
                  <span className="text-xs text-fg-neutral-secondary mb-1 block">Pattern</span>
                  <button
                    onClick={() => setShowPatternModal(true)}
                    className="w-full h-8 px-3 text-sm text-left bg-bg-neutral-min border border-border-color-neutral rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2 text-fg-neutral-primary">
                      <Repeat className="w-4 h-4 text-violet-500 flex-shrink-0" />
                      <span>
                        {patternDescription || 'Set pattern'}
                        {task.recurrence?.rolloverIfMissed && (
                          <span className="text-fg-neutral-secondary"> · Persists</span>
                        )}
                      </span>
                    </span>
                    <span className="text-violet-600 dark:text-violet-400 font-medium">Edit</span>
                  </button>
                </div>
              )}

              {/* RECURRING TASKS: Show Reminder + Start Nudge */}
              {isRecurring ? (
                <>
                  <div className="col-span-2 pb-1">
                    <span className="text-xs text-fg-neutral-secondary mb-1 block">Reminder</span>
                    <div className="relative flex gap-1.5">
                      <button
                        onClick={() => setShowReminderPicker(!showReminderPicker)}
                        className={`flex-1 h-8 px-2 py-1 text-sm text-left bg-bg-neutral-min border border-border-color-neutral rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 flex items-center justify-between ${task.reminder ? 'pr-2' : 'pr-8'}`}
                      >
                        <span className={task.reminder ? "text-fg-neutral-primary" : "text-fg-neutral-soft"}>
                          {task.reminder
                            ? formatReminder(task.reminder, task.targetDate, task.deadlineDate)
                            : "None"}
                        </span>
                        {!task.reminder && (
                          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        )}
                      </button>
                      {task.reminder && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateTask(task.id, { reminder: null });
                            cancelReminder(task.id);
                          }}
                          className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-fg-neutral-secondary hover:bg-bg-neutral-subtle rounded-lg transition-colors"
                          title="Clear reminder"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {showReminderPicker && (
                        <ReminderPicker
                          reminder={task.reminder}
                          targetDate={task.targetDate}
                          deadlineDate={task.deadlineDate}
                          onChange={(reminder) => {
                            onUpdateTask(task.id, { reminder });
                            // Schedule or cancel the reminder
                            if (reminder) {
                              scheduleReminder(
                                task.id,
                                task.title,
                                reminder,
                                task.targetDate,
                                task.deadlineDate
                              );
                            } else {
                              cancelReminder(task.id);
                            }
                          }}
                          onClose={() => setShowReminderPicker(false)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Start Time Poke | Duration for recurring tasks */}
                  <div className="col-span-2 grid grid-cols-2 gap-x-4 min-w-0">
                    {/* Start Time Poke */}
                    <div className="min-w-0">
                      {mode === 'managing' ? (
                        /* Template mode: editable */
                        <StartPokeField
                          task={task}
                          userSettings={userSettings}
                          onChange={(override) => {
                            onUpdateTask(task.id, { startPokeOverride: override });
                          }}
                        />
                      ) : (
                      /* Executing mode: read-only display */
                      (() => {
                        const pokeSettings: StartPokeSettings = {
                          startPokeEnabled: userSettings.startPokeEnabled,
                          startPokeDefault: userSettings.startPokeDefault,
                          startPokeBufferMinutes: userSettings.startPokeBufferMinutes,
                          startPokeBufferPercentage: userSettings.startPokeBufferPercentage,
                        };
                        const pokeStatus = getStartPokeStatus(task, pokeSettings);
                        const isEnabled = isStartPokeEnabled(task, pokeSettings);

                        return (
                          <div>
                            <span className="text-xs text-fg-neutral-secondary mb-1 block">Start Time Poke</span>
                            <div className="w-full h-8 px-2 text-sm bg-zinc-100 dark:bg-zinc-900 border border-border-color-neutral rounded-lg flex items-center justify-between text-fg-neutral-secondary">
                              <span>{isEnabled ? 'On' : 'Off'}</span>
                              <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                            </div>
                            {isEnabled && pokeStatus.nudgeTime !== null && (
                              <span className="text-xs text-fg-neutral-soft mt-1 block">
                                Poke at {formatPokeTime(pokeStatus.nudgeTime)}
                              </span>
                            )}
                            <span className="text-xs text-fg-neutral-soft mt-1 block">
                              Edit routine template to change
                            </span>
                          </div>
                        );
                      })()
                      )}
                    </div>

                    {/* Duration */}
                    <div className="min-w-0">
                      <span className="text-xs text-fg-neutral-secondary mb-1 block">Duration</span>
                      {mode === 'managing' ? (
                        <DurationInput
                          value={task.estimatedDurationMinutes}
                          autoValue={getStepDurationSum(task.steps) > 0 ? getStepDurationSum(task.steps) : null}
                          onChange={(minutes) => {
                            onUpdateTask(task.id, {
                              estimatedDurationMinutes: minutes,
                              estimatedDurationSource: minutes ? 'manual' : null,
                            });
                          }}
                          source={
                            task.estimatedDurationSource === 'ai' ? 'ai'
                            : task.estimatedDurationMinutes ? 'manual'
                            : getStepDurationSum(task.steps) > 0 ? 'steps'
                            : null
                          }
                        />
                      ) : (
                        /* Executing mode: read-only display */
                        <>
                          <div className="w-full h-8 px-2 text-sm bg-zinc-100 dark:bg-zinc-900 border border-border-color-neutral rounded-lg flex items-center justify-between text-fg-neutral-secondary">
                            <span>{task.estimatedDurationMinutes ? `${task.estimatedDurationMinutes} min` : getStepDurationSum(task.steps) > 0 ? `${getStepDurationSum(task.steps)} min` : 'Not set'}</span>
                            <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          </div>
                          <span className="text-xs text-fg-neutral-soft mt-1 block">
                            {getStepDurationSum(task.steps) > 0 && !task.estimatedDurationMinutes ? 'From steps' : 'Edit routine template to change'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* ONE-OFF TASKS: Full details layout */
                <>
                  {/* LINE 3: Target | Deadline (with optional time) */}
                  <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 min-w-0">
                    {/* Target Date + Time */}
                    <div className="min-w-0">
                      <span className="text-xs text-fg-neutral-secondary mb-1 block">Target</span>
                      <div className="flex gap-1.5">
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="date"
                            value={task.targetDate || ""}
                            onChange={(e) => onUpdateTask(task.id, {
                              targetDate: e.target.value || null,
                              // Clear time if date is cleared
                              ...(e.target.value ? {} : { targetTime: null })
                            })}
                            className="w-full min-w-0 h-8 px-2 py-1 pr-7 text-sm bg-bg-neutral-min border border-border-color-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          {task.targetDate && (
                            <button
                              type="button"
                              onClick={() => onUpdateTask(task.id, { targetDate: null, targetTime: null })}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-fg-neutral-secondary transition-colors"
                              title="Clear date"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {task.targetDate && (
                          <div className="relative flex-shrink-0">
                            <input
                              type="time"
                              value={task.targetTime || ""}
                              onChange={(e) => onUpdateTask(task.id, { targetTime: e.target.value || null })}
                              className="w-[8.5rem] h-8 px-2 py-1 pr-7 text-sm bg-bg-neutral-min border border-border-color-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                              placeholder="Time"
                            />
                            {task.targetTime && (
                              <button
                                type="button"
                                onClick={() => onUpdateTask(task.id, { targetTime: null })}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-fg-neutral-secondary transition-colors"
                                title="Clear time"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deadline + Time */}
                    <div className="min-w-0">
                      <span className="text-xs text-fg-neutral-secondary mb-1 block">Deadline</span>
                      <div className="flex gap-1.5">
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="date"
                            value={task.deadlineDate || ""}
                            onChange={(e) => onUpdateTask(task.id, {
                              deadlineDate: e.target.value || null,
                              // Clear time if date is cleared
                              ...(e.target.value ? {} : { deadlineTime: null })
                            })}
                            className="w-full min-w-0 h-8 px-2 py-1 pr-7 text-sm bg-bg-neutral-min border border-border-color-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          {task.deadlineDate && (
                            <button
                              type="button"
                              onClick={() => onUpdateTask(task.id, { deadlineDate: null, deadlineTime: null })}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-fg-neutral-secondary transition-colors"
                              title="Clear date"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {task.deadlineDate && (
                          <div className="relative flex-shrink-0">
                            <input
                              type="time"
                              value={task.deadlineTime || ""}
                              onChange={(e) => onUpdateTask(task.id, { deadlineTime: e.target.value || null })}
                              className="w-[8.5rem] h-8 px-2 py-1 pr-7 text-sm bg-bg-neutral-min border border-border-color-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                              placeholder="Time"
                            />
                            {task.deadlineTime && (
                              <button
                                type="button"
                                onClick={() => onUpdateTask(task.id, { deadlineTime: null })}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-fg-neutral-secondary transition-colors"
                                title="Clear time"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LINE 4: Reminder | Waiting On */}
                  <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    {/* Reminder */}
                    <div>
                      <span className="text-xs text-fg-neutral-secondary mb-1 block">Reminder</span>
                      <div className="relative flex gap-1">
                        <button
                          onClick={() => setShowReminderPicker(!showReminderPicker)}
                          className="flex-1 h-8 px-2 py-1 text-sm text-left bg-bg-neutral-min border border-border-color-neutral rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 flex items-center justify-between"
                        >
                          <span className={task.reminder ? "text-fg-neutral-primary" : "text-fg-neutral-soft"}>
                            {task.reminder
                              ? formatReminder(task.reminder, task.targetDate, task.deadlineDate)
                              : "None"}
                          </span>
                          {!task.reminder && (
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          )}
                        </button>
                        {task.reminder && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateTask(task.id, { reminder: null });
                              cancelReminder(task.id);
                            }}
                            className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-fg-neutral-secondary hover:bg-bg-neutral-subtle rounded-lg transition-colors"
                            title="Clear reminder"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        {showReminderPicker && (
                          <ReminderPicker
                            reminder={task.reminder}
                            targetDate={task.targetDate}
                            deadlineDate={task.deadlineDate}
                            onChange={(reminder) => {
                              onUpdateTask(task.id, { reminder });
                              // Schedule or cancel the reminder
                              if (reminder) {
                                scheduleReminder(
                                  task.id,
                                  task.title,
                                  reminder,
                                  task.targetDate,
                                  task.deadlineDate
                                );
                              } else {
                                cancelReminder(task.id);
                              }
                            }}
                            onClose={() => setShowReminderPicker(false)}
                          />
                        )}
                      </div>
                    </div>

                    {/* Waiting On */}
                    <div>
                      <span className="text-xs text-fg-neutral-secondary mb-1 block">Waiting On</span>
                      <input
                        type="text"
                        value={task.waitingOn?.who || ""}
                        onChange={(e) =>
                          onUpdateTask(task.id, {
                            waitingOn: e.target.value
                              ? { who: e.target.value, since: Date.now(), followUpDate: null, notes: null }
                              : null,
                          })
                        }
                        placeholder="Nobody"
                        className="w-full h-8 px-2 py-1 text-sm bg-bg-neutral-min border border-border-color-neutral rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>

                  {/* Start Time Poke | Duration */}
                  <div className="col-span-2 grid grid-cols-2 gap-x-4 min-w-0">
                    {/* Start Time Poke */}
                    <div className="min-w-0">
                      <StartPokeField
                        task={task}
                        userSettings={userSettings}
                        onChange={(override) => {
                          onUpdateTask(task.id, { startPokeOverride: override });
                        }}
                      />
                    </div>

                    {/* Duration */}
                    <div className="min-w-0">
                      <span className="text-xs text-fg-neutral-secondary mb-1 block">Duration</span>
                      <DurationInput
                        value={task.estimatedDurationMinutes}
                        autoValue={getStepDurationSum(task.steps) > 0 ? getStepDurationSum(task.steps) : null}
                        onChange={(minutes) => {
                          onUpdateTask(task.id, {
                            estimatedDurationMinutes: minutes,
                            estimatedDurationSource: minutes ? 'manual' : null,
                          });
                        }}
                        source={
                          task.estimatedDurationSource === 'ai' ? 'ai'
                          : task.estimatedDurationMinutes ? 'manual'
                          : getStepDurationSum(task.steps) > 0 ? 'steps'
                          : null
                        }
                      />
                    </div>
                  </div>

                  {/* LINE 5: Status | Priority */}
                  <div>
                    <span className="text-xs text-fg-neutral-secondary mb-1 block">Status</span>
                    <div className="h-8 flex items-center gap-1.5">
                      {(() => {
                        const displayStatus = getDisplayStatus(task, queueItem, queue.todayLineIndex);
                        const statusInfo = getStatusInfo(displayStatus);
                        return (
                          <span
                            className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.bgClass} ${statusInfo.textClass}`}
                          >
                            {statusInfo.label}
                          </span>
                        );
                      })()}
                      {task.status === 'pool' && (() => {
                        const health = computeHealthStatus(task);
                        return health.status !== 'healthy' ? (
                          <HealthPill health={health} size="sm" showInfo={true} />
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-fg-neutral-secondary mb-1 block">Priority</span>
                    <div className="h-8 flex items-center gap-1.5">
                      {(["high", "medium", "low"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => onUpdateTask(task.id, { priority: task.priority === p ? null : p })}
                          className={`
                            px-1.5 py-0.5 text-xs font-medium rounded-full capitalize transition-colors
                            ${
                              task.priority === p
                                ? p === "high"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : p === "medium"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400 hover:bg-bg-neutral-subtle-hover"
                            }
                          `}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/* Staging Area for AI suggestions */}
      {(suggestions.length > 0 || edits.length > 0 || deletions.length > 0 || (metadataSuggestions && metadataSuggestions.length > 0) || suggestedTitle) && (
        <div id="staging-area" className="mb-6 scroll-mt-4">
          <StagingArea
            suggestions={suggestions}
            edits={edits}
            deletions={deletions}
            metadataSuggestions={metadataSuggestions}
            suggestedTitle={suggestedTitle}
            currentTitle={task.title}
            onAcceptOne={onAcceptOne}
            onAcceptAll={onAcceptAll}
            onDismiss={onDismiss}
            onAcceptEdit={onAcceptEdit}
            onRejectEdit={onRejectEdit}
            onAcceptDeletion={onAcceptDeletion}
            onRejectDeletion={onRejectDeletion}
            onAcceptMetadata={onAcceptMetadata}
            onRejectMetadata={onRejectMetadata}
            onAcceptTitle={onAcceptTitle}
            onRejectTitle={onRejectTitle}
            isNewArrival={stagingIsNewArrival}
            onAnimationComplete={onStagingAnimationComplete}
            isRoutine={task.isRecurring}
            onAcceptWithScope={onAcceptWithScope}
            mode={mode}
            targetStep={targetStepForStaging}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1">
        {/* Steps section - Different structure for recurring vs regular tasks */}
        <div className="mb-6">
          {isRecurring && currentInstance && mode === 'executing' ? (
            /* RECURRING TASKS IN EXECUTING MODE: Unified steps list */
            (() => {
              const unifiedSteps = currentInstance.steps;
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-medium text-fg-neutral-secondary">
                      Steps
                    </h2>
                    {/* Reset from Template - direct button in executing mode */}
                    {onResetFromTemplate && (
                      <button
                        onClick={onResetFromTemplate}
                        className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors"
                      >
                        Reset from Template
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                      {unifiedSteps.map((step, idx) => (
                        <StepItem
                          key={step.id}
                          step={step}
                          index={idx}
                          totalSteps={unifiedSteps.length}
                          taskId={task.id}
                          mode={mode}
                          isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                          isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                          openMenuId={openMenuId}
                          onOpenMenu={setOpenMenuId}
                          onCloseMenu={() => setOpenMenuId(null)}
                          onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                          onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed, mode)}
                          onUpdateStep={(text) => onUpdateStep(task.id, step.id, text, mode)}
                          onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                          onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text, mode)}
                          onDelete={() => onDeleteStep(task.id, step.id, mode)}
                          onMoveUp={() => onMoveStepUp(task.id, step.id)}
                          onMoveDown={() => onMoveStepDown(task.id, step.id)}
                          onAddSubstep={(text) => onAddSubstep(task.id, step.id, text, mode)}
                          onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId, mode)}
                          onMoveSubstepUp={(substepId) => onMoveSubstepUp(task.id, step.id, substepId)}
                          onMoveSubstepDown={(substepId) => onMoveSubstepDown(task.id, step.id, substepId)}
                          onOpenAIPalette={onOpenAIPalette ? () => onOpenAIPalette(task.id, step.id) : undefined}
                        />
                      ))}
                    </div>
                </div>
              );
            })()
          ) : (
            /* REGULAR TASKS or RECURRING TASKS IN MANAGING MODE: Single steps section */
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-medium text-fg-neutral-secondary">
                  {isRecurring && mode === 'managing' ? 'Recurring Steps' : 'Steps'}
                </h2>
                <div className="flex items-center gap-3">
                  {/* Conditional swap: Edit Focus when in queue, AI Breakdown when not */}
                  {isInQueue && task.steps.length > 0 && queueItem ? (
                    <button
                      onClick={() => onOpenFocusSelection?.(queueItem.id)}
                      className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Focus
                    </button>
                  ) : (
                    <button
                      onClick={onAIBreakdown}
                      className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                      </svg>
                      AI Breakdown
                    </button>
                  )}
                </div>
              </div>

              {/* Steps list */}
              <div className="space-y-2">
              {/* Show completed steps when expanded (via StatusModule toggle) OR when all steps are complete - with grid-rows animation */}
              <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                (completedStepsExpanded || allStepsComplete) && completedSteps.length > 0 ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}>
                <div className="overflow-hidden space-y-2">
                  {completedSteps.map((step) => {
                    const originalIndex = task.steps.findIndex(s => s.id === step.id);
                    return (
                      <StepItem
                        key={step.id}
                        step={step}
                        index={originalIndex}
                        totalSteps={task.steps.length}
                        taskId={task.id}
                        mode={mode}
                        isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                        isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                        hideCheckbox={mode === 'managing'}
                        openMenuId={openMenuId}
                        onOpenMenu={setOpenMenuId}
                        onCloseMenu={() => setOpenMenuId(null)}
                        onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                        onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed, mode)}
                        onUpdateStep={(text) => onUpdateStep(task.id, step.id, text, mode)}
                        onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                        onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text, mode)}
                        onDelete={() => onDeleteStep(task.id, step.id, mode)}
                        onMoveUp={() => onMoveStepUp(task.id, step.id)}
                        onMoveDown={() => onMoveStepDown(task.id, step.id)}
                        onAddSubstep={(text) => onAddSubstep(task.id, step.id, text, mode)}
                        onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId, mode)}
                        onMoveSubstepUp={(substepId) => onMoveSubstepUp(task.id, step.id, substepId)}
                        onMoveSubstepDown={(substepId) => onMoveSubstepDown(task.id, step.id, substepId)}
                        onStartFocus={queueItem ? () => onStartFocus(queueItem.id) : undefined}
                        onOpenAIPalette={onOpenAIPalette ? () => onOpenAIPalette(task.id, step.id) : undefined}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Incomplete steps - with Today/Upcoming sections when in queue */}
              {isInQueue ? (
                <>
                  {/* TODAY section */}
                  {todaySteps.length > 0 && (
                    <>
                      <div className="mt-2 mb-1 pl-1">
                        <span className="px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded">
                          Today
                        </span>
                      </div>
                      {todaySteps.map((step) => {
                        const originalIndex = task.steps.findIndex(s => s.id === step.id);
                        return (
                          <StepItem
                            key={step.id}
                            step={step}
                            index={originalIndex}
                            totalSteps={task.steps.length}
                            taskId={task.id}
                            mode={mode}
                            isToday
                            isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                            isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                            hideCheckbox={mode === 'managing'}
                            openMenuId={openMenuId}
                            onOpenMenu={setOpenMenuId}
                            onCloseMenu={() => setOpenMenuId(null)}
                            onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                            onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed, mode)}
                            onUpdateStep={(text) => onUpdateStep(task.id, step.id, text, mode)}
                            onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                            onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text, mode)}
                            onDelete={() => onDeleteStep(task.id, step.id, mode)}
                            onMoveUp={() => onMoveStepUp(task.id, step.id)}
                            onMoveDown={() => onMoveStepDown(task.id, step.id)}
                            onAddSubstep={(text) => onAddSubstep(task.id, step.id, text, mode)}
                            onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId, mode)}
                            onMoveSubstepUp={(substepId) => onMoveSubstepUp(task.id, step.id, substepId)}
                            onMoveSubstepDown={(substepId) => onMoveSubstepDown(task.id, step.id, substepId)}
                            onStartFocus={() => onStartFocus(queueItem!.id)}
                            onOpenAIPalette={onOpenAIPalette ? () => onOpenAIPalette(task.id, step.id) : undefined}
                          />
                        );
                      })}
                    </>
                  )}

                  {/* UPCOMING section */}
                  {upcomingSteps.length > 0 && (
                    <>
                      <div className="mt-4 mb-1 pl-1">
                        <span className="px-2 py-0.5 text-xs text-fg-neutral-secondary bg-bg-neutral-subtle rounded">
                          Upcoming
                        </span>
                      </div>
                      {upcomingSteps.map((step) => {
                        const originalIndex = task.steps.findIndex(s => s.id === step.id);
                        return (
                          <StepItem
                            key={step.id}
                            step={step}
                            index={originalIndex}
                            totalSteps={task.steps.length}
                            taskId={task.id}
                            mode={mode}
                            isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                            isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                            hideCheckbox={mode === 'managing'}
                            openMenuId={openMenuId}
                            onOpenMenu={setOpenMenuId}
                            onCloseMenu={() => setOpenMenuId(null)}
                            onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                            onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed, mode)}
                            onUpdateStep={(text) => onUpdateStep(task.id, step.id, text, mode)}
                            onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                            onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text, mode)}
                            onDelete={() => onDeleteStep(task.id, step.id, mode)}
                            onMoveUp={() => onMoveStepUp(task.id, step.id)}
                            onMoveDown={() => onMoveStepDown(task.id, step.id)}
                            onAddSubstep={(text) => onAddSubstep(task.id, step.id, text, mode)}
                            onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId, mode)}
                            onMoveSubstepUp={(substepId) => onMoveSubstepUp(task.id, step.id, substepId)}
                            onMoveSubstepDown={(substepId) => onMoveSubstepDown(task.id, step.id, substepId)}
                            onStartFocus={() => onStartFocus(queueItem!.id)}
                            onOpenAIPalette={onOpenAIPalette ? () => onOpenAIPalette(task.id, step.id) : undefined}
                          />
                        );
                      })}
                    </>
                  )}
                </>
              ) : (
                /* Not in queue - show all incomplete steps without sections */
                incompleteSteps.map((step) => {
                  const originalIndex = task.steps.findIndex(s => s.id === step.id);
                  return (
                    <StepItem
                      key={step.id}
                      step={step}
                      index={originalIndex}
                      totalSteps={task.steps.length}
                      taskId={task.id}
                      mode={mode}
                      isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                      isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                      hideCheckbox={mode === 'managing'}
                      openMenuId={openMenuId}
                      onOpenMenu={setOpenMenuId}
                      onCloseMenu={() => setOpenMenuId(null)}
                      onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                      onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed, mode)}
                      onUpdateStep={(text) => onUpdateStep(task.id, step.id, text, mode)}
                      onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                      onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text, mode)}
                      onDelete={() => onDeleteStep(task.id, step.id, mode)}
                      onMoveUp={() => onMoveStepUp(task.id, step.id)}
                      onMoveDown={() => onMoveStepDown(task.id, step.id)}
                      onAddSubstep={(text) => onAddSubstep(task.id, step.id, text, mode)}
                      onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId, mode)}
                      onMoveSubstepUp={(substepId) => onMoveSubstepUp(task.id, step.id, substepId)}
                      onMoveSubstepDown={(substepId) => onMoveSubstepDown(task.id, step.id, substepId)}
                      onOpenAIPalette={onOpenAIPalette ? () => onOpenAIPalette(task.id, step.id) : undefined}
                    />
                  );
                })
              )}
            </div>
            </>
          )}

          {/* Add step form */}
          <form onSubmit={handleAddStep} className="mt-3 flex gap-2">
            <input
              type="text"
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              placeholder="Add a step..."
              className="flex-1 px-3 py-2 text-sm bg-bg-neutral-min border border-border-color-neutral rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {newStepText.trim() && (
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
              >
                Add
              </button>
            )}
          </form>
        </div>

        {/* Notes section */}
        <div className="mt-6">
          <h2 className="text-base font-medium text-fg-neutral-secondary mb-2">
            Notes
          </h2>
          <NotesModule
            notes={task.notes || ""}
            onChange={(notes) => onUpdateTask(task.id, { notes: notes || null })}
            collapsible={false}
            placeholder="Add notes about this task..."
          />
        </div>

        {/* Actions section */}
        <div className="mt-8 pt-6 border-t border-border-color-neutral">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Waiting On button with anchored popover / BottomSheet (only for one-off tasks when using new UI) */}
            {useNewDetailsUI && !isRecurring && (
              <div className="relative">
                <button
                  onClick={() => {
                    setWaitingOnInput(task.waitingOn?.who || '');
                    setWaitingOnFollowUp(task.waitingOn?.followUpDate || '');
                    setShowFollowUpDropdown(false);
                    setShowWaitingOnModal(true);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    task.waitingOn
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                      : 'text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {task.waitingOn ? `Waiting: ${task.waitingOn.who}` : 'Waiting On'}
                  {task.waitingOn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTask(task.id, { waitingOn: null });
                      }}
                      className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                      title="Clear waiting on"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </button>

                {/* Mobile: BottomSheet - matches TaskCreationPopover pattern */}
                {isMobileView && (
                  <BottomSheet
                    isOpen={showWaitingOnModal}
                    onClose={() => setShowWaitingOnModal(false)}
                    height="auto"
                  >
                    <div className="px-4 pt-2 pb-4" style={{ paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom))' }}>
                      <h3 className="text-base font-semibold text-fg-neutral-primary mb-4">
                        Waiting On
                      </h3>
                      <input
                        type="text"
                        value={waitingOnInput}
                        onChange={(e) => setWaitingOnInput(e.target.value)}
                        placeholder="Who or what are you waiting on?"
                        className="w-full px-3 py-2.5 text-sm bg-bg-neutral-min border border-border-color-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        autoFocus
                      />

                      {/* Follow-up reminder - opens DatePickerModal directly on mobile */}
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            onOpenDatePickerModal?.((dateStr) => {
                              setWaitingOnFollowUp(dateStr);
                            });
                          }}
                          className="text-sm text-fg-neutral-secondary hover:text-fg-neutral-secondary flex items-center gap-1.5 transition-colors"
                        >
                          {waitingOnFollowUp ? (
                            <>
                              <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-fg-neutral-primary">Follow up {formatDate(waitingOnFollowUp)}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Add follow-up reminder</span>
                            </>
                          )}
                          <ChevronRight
                            size={14}
                            className="text-zinc-400"
                          />
                        </button>
                      </div>

                      <div className="flex justify-end gap-2 mt-5">
                        <button
                          onClick={() => setShowWaitingOnModal(false)}
                          className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onUpdateTask(task.id, {
                              waitingOn: waitingOnInput.trim()
                                ? {
                                    who: waitingOnInput.trim(),
                                    since: task.waitingOn?.since || Date.now(),
                                    followUpDate: waitingOnFollowUp || null,
                                    notes: task.waitingOn?.notes || null,
                                  }
                                : null,
                            });
                            setShowWaitingOnModal(false);
                          }}
                          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </BottomSheet>
                )}

                {/* Desktop: Anchored Popover - matches TaskCreationPopover pattern */}
                {!isMobileView && showWaitingOnModal && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowWaitingOnModal(false)} />
                    <div className="absolute bottom-full left-0 mb-2 z-50 w-72 bg-bg-neutral-min border border-border-color-neutral rounded-xl shadow-xl p-4">
                      <h3 className="text-sm font-semibold text-fg-neutral-primary mb-3">
                        Waiting On
                      </h3>
                      <input
                        type="text"
                        value={waitingOnInput}
                        onChange={(e) => setWaitingOnInput(e.target.value)}
                        placeholder="Who or what are you waiting on?"
                        className="w-full px-3 py-2 text-sm bg-bg-neutral-min border border-border-color-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            onUpdateTask(task.id, {
                              waitingOn: waitingOnInput.trim()
                                ? {
                                    who: waitingOnInput.trim(),
                                    since: task.waitingOn?.since || Date.now(),
                                    followUpDate: waitingOnFollowUp || null,
                                    notes: task.waitingOn?.notes || null,
                                  }
                                : null,
                            });
                            setShowWaitingOnModal(false);
                          }
                          if (e.key === 'Escape') {
                            setShowWaitingOnModal(false);
                          }
                        }}
                      />

                      {/* Follow-up reminder - opens DatePickerModal directly */}
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            onOpenDatePickerModal?.((dateStr) => {
                              setWaitingOnFollowUp(dateStr);
                            });
                          }}
                          className="text-sm text-fg-neutral-secondary hover:text-fg-neutral-secondary flex items-center gap-1.5 transition-colors"
                        >
                          {waitingOnFollowUp ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-fg-neutral-primary">Follow up {formatDate(waitingOnFollowUp)}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Add follow-up reminder</span>
                            </>
                          )}
                          <ChevronRight
                            size={12}
                            className="text-zinc-400"
                          />
                        </button>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          onClick={() => setShowWaitingOnModal(false)}
                          className="px-3 py-1.5 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onUpdateTask(task.id, {
                              waitingOn: waitingOnInput.trim()
                                ? {
                                    who: waitingOnInput.trim(),
                                    since: task.waitingOn?.since || Date.now(),
                                    followUpDate: waitingOnFollowUp || null,
                                    notes: task.waitingOn?.notes || null,
                                  }
                                : null,
                            });
                            setShowWaitingOnModal(false);
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {isRecurring ? (
              /* Pause/Resume for recurring tasks */
              <button
                onClick={() => {
                  if (isPaused) {
                    // Resume: clear pausedAt
                    onUpdateTask(task.id, {
                      recurrence: {
                        ...recurrencePattern!,
                        pausedAt: null,
                        pausedUntil: null,
                      },
                    });
                  } else {
                    // Pause: set pausedAt to now
                    onUpdateTask(task.id, {
                      recurrence: {
                        ...recurrencePattern!,
                        pausedAt: Date.now(),
                      },
                    });
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors flex items-center gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                )}
              </button>
            ) : (
              /* Defer dropdown for regular tasks with BottomSheet on mobile */
              <div className="relative">
                <button
                  onClick={() => {
                    setDeferCustomDate('');
                    setShowDeferCustomDate(false);
                    setShowDeferMenu(!showDeferMenu);
                  }}
                  className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Defer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mobile: BottomSheet - matches DatePickerDropdown pattern */}
                {isMobileView && (
                  <BottomSheet
                    isOpen={showDeferMenu}
                    onClose={() => setShowDeferMenu(false)}
                    height="auto"
                  >
                    <div className="px-4 pt-2 pb-4" style={{ paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom))' }}>
                      <h3 className="text-base font-semibold text-fg-neutral-primary mb-4">
                        Defer until
                      </h3>
                      {/* Quick options */}
                      <div className="space-y-1 mb-4">
                        {[
                          { label: 'Tomorrow', days: 1 },
                          { label: 'Next week', days: 7 },
                          { label: 'Next month', days: 30 },
                        ].map(({ label, days }) => (
                          <button
                            key={label}
                            onClick={() => {
                              onDefer(task.id, getDeferDate(days));
                              setShowDeferMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle rounded-lg transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {/* Custom date section */}
                      <div className="border-t border-border-color-neutral pt-4">
                        <div className="text-xs text-fg-neutral-secondary mb-2">
                          Or pick a specific date
                        </div>
                        <div className="mb-3">
                          <label className="text-xs text-fg-neutral-secondary mb-1 block">Date</label>
                          <input
                            type="date"
                            value={deferCustomDate}
                            onChange={(e) => setDeferCustomDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2.5 text-sm bg-bg-neutral-base border border-border-color-neutral rounded-lg"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeferMenu(false)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (deferCustomDate) {
                                onDefer(task.id, deferCustomDate);
                                setShowDeferMenu(false);
                              }
                            }}
                            disabled={!deferCustomDate}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            Defer
                          </button>
                        </div>
                      </div>
                    </div>
                  </BottomSheet>
                )}

                {/* Desktop: Anchored Popover - matches DatePickerDropdown pattern */}
                {!isMobileView && showDeferMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDeferMenu(false)} />
                    <div className="absolute left-0 bottom-full mb-2 w-72 bg-bg-neutral-min border border-border-color-neutral rounded-xl shadow-lg z-50 p-4">
                      <h3 className="text-sm font-semibold text-fg-neutral-primary mb-3">
                        Defer until
                      </h3>
                      {/* Quick options */}
                      <div className="space-y-1 mb-3">
                        {[
                          { label: 'Tomorrow', days: 1 },
                          { label: 'Next week', days: 7 },
                          { label: 'Next month', days: 30 },
                        ].map(({ label, days }) => (
                          <button
                            key={label}
                            onClick={() => {
                              onDefer(task.id, getDeferDate(days));
                              setShowDeferMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-bg-neutral-subtle rounded-lg transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {/* Custom date section */}
                      <div className="border-t border-border-color-neutral pt-3">
                        <div className="text-xs text-fg-neutral-secondary mb-2">
                          Or pick a specific date
                        </div>
                        <div className="mb-3">
                          <label className="text-xs text-fg-neutral-secondary mb-1 block">Date</label>
                          <input
                            type="date"
                            value={deferCustomDate}
                            onChange={(e) => setDeferCustomDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 text-sm bg-bg-neutral-base border border-border-color-neutral rounded-lg"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeferMenu(false)}
                            className="flex-1 px-3 py-1.5 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (deferCustomDate) {
                                onDefer(task.id, deferCustomDate);
                                setShowDeferMenu(false);
                              }
                            }}
                            disabled={!deferCustomDate}
                            className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            Defer
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Archive/Unarchive button */}
            <button
              onClick={() => task.status === 'archived' ? onUnarchive(task.id) : onPark(task.id)}
              className="px-4 py-2 text-sm font-medium text-fg-neutral-primary bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {task.status === 'archived' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-4-3v3m-4-3v3" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                )}
              </svg>
              {task.status === 'archived' ? 'Unarchive' : 'Archive'}
            </button>

            {/* Delete button */}
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this task?")) {
                  onDeleteTask(task.id);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* History Modal for recurring tasks */}
      {isRecurring && (
        <HistoryModal
          task={task}
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          onUpdateTask={onUpdateTask}
        />
      )}

      {/* Pattern Configuration Modal - Desktop: centered modal, Mobile: bottom sheet */}
      {showPatternModal && task.recurrence && (
        <>
          {/* Desktop: Centered modal */}
          <div className="hidden lg:block">
            {/* Backdrop - z-[60] to overlay sidebar (z-50) */}
            <div
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setShowPatternModal(false)}
            />
            {/* Modal - z-[70] above backdrop */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg-neutral-min rounded-xl shadow-2xl z-[70] flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border-color-neutral">
                <h2 className="text-lg font-semibold text-fg-neutral-primary">
                  Edit Pattern
                </h2>
                <button
                  onClick={() => setShowPatternModal(false)}
                  className="p-1 text-zinc-400 hover:text-fg-neutral-secondary rounded-lg hover:bg-bg-neutral-subtle"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                <RecurrenceFields
                  rule={task.recurrence}
                  onChange={(newRule) => {
                    onUpdateTask(task.id, { recurrence: newRule });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mobile: Bottom sheet */}
          <div className="lg:hidden">
            {/* Backdrop - z-[60] to overlay sidebar (z-50) */}
            <div
              className="fixed inset-0 z-[60] bg-black/40"
              onClick={() => setShowPatternModal(false)}
            />

            {/* Sheet - z-[70] above backdrop */}
            <div
              className={`
                fixed inset-x-0 bottom-0 z-[70] h-[70vh] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-300/50 dark:border-zinc-700/50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col
                transition-transform duration-300 ease-in-out
                ${showPatternModal ? "translate-y-0" : "translate-y-full"}
              `}
            >
              {/* Animated drag handle */}
              <button
                onClick={() => setShowPatternModal(false)}
                onMouseEnter={() => setIsPatternHandleHovered(true)}
                onMouseLeave={() => setIsPatternHandleHovered(false)}
                className="w-full pt-3 pb-2 flex justify-center cursor-pointer bg-transparent border-0"
                aria-label="Close"
              >
                <motion.div className="relative w-10 h-1 flex">
                  <motion.div
                    className="w-5 h-1 rounded-l-full bg-zinc-300 dark:bg-zinc-600 origin-right"
                    animate={{ rotate: isPatternHandleHovered && !prefersReducedMotion ? 15 : 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                  />
                  <motion.div
                    className="w-5 h-1 rounded-r-full bg-zinc-300 dark:bg-zinc-600 origin-left"
                    animate={{ rotate: isPatternHandleHovered && !prefersReducedMotion ? -15 : 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                  />
                </motion.div>
              </button>

              {/* Mobile header */}
              <div className="flex items-center justify-between px-4 pb-2 border-b border-zinc-200 dark:border-transparent flex-shrink-0">
                <h2 className="text-base font-semibold text-fg-neutral-primary">
                  Edit Pattern
                </h2>
                <button
                  onClick={() => setShowPatternModal(false)}
                  className="px-3 py-1 text-xs font-medium text-fg-neutral-secondary hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-bg-neutral-subtle rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                <RecurrenceFields
                  rule={task.recurrence}
                  onChange={(newRule) => {
                    onUpdateTask(task.id, { recurrence: newRule });
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Follow-up reminder dropdown portal (shared between mobile and desktop) */}
      {showFollowUpDropdown && followUpDropdownPosition && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowFollowUpDropdown(false)} />
          <div
            className="fixed z-[70] w-56 bg-bg-neutral-min border border-border-color-neutral rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto"
            style={{
              left: Math.min(followUpDropdownPosition.left, window.innerWidth - 230),
              ...(isMobileView
                ? { bottom: followUpDropdownPosition.bottom }
                : { top: followUpDropdownPosition.top }
              ),
            }}
          >
            {/* None option */}
            <button
              onClick={() => {
                setWaitingOnFollowUp('');
                setShowFollowUpDropdown(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-bg-neutral-subtle ${
                !waitingOnFollowUp ? "bg-violet-50 dark:bg-violet-900/20" : ""
              }`}
            >
              <span className="text-fg-neutral-secondary">None</span>
              {!waitingOnFollowUp && <Check className="w-4 h-4 ml-auto text-violet-500" />}
            </button>
            {/* Preset options */}
            {[
              { label: 'Tomorrow', days: 1 },
              { label: 'In 3 days', days: 3 },
              { label: 'Next week', days: 7 },
            ].map(({ label, days }) => {
              const date = new Date();
              date.setDate(date.getDate() + days);
              const dateStr = date.toISOString().split('T')[0];
              return (
                <button
                  key={label}
                  onClick={() => {
                    setWaitingOnFollowUp(dateStr);
                    setShowFollowUpDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-bg-neutral-subtle ${
                    waitingOnFollowUp === dateStr ? "bg-violet-50 dark:bg-violet-900/20" : ""
                  }`}
                >
                  <span className="text-fg-neutral-primary">{label}</span>
                  {waitingOnFollowUp === dateStr && <Check className="w-4 h-4 ml-auto text-violet-500" />}
                </button>
              );
            })}
            {/* Custom option */}
            <button
              onClick={() => {
                setShowFollowUpDropdown(false);
                onOpenDatePickerModal?.((dateStr) => {
                  setWaitingOnFollowUp(dateStr);
                });
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left text-violet-600 dark:text-violet-400 hover:bg-bg-neutral-subtle border-t border-border-color-neutral"
            >
              <Plus size={14} />
              <span>Custom date...</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// Step Item Component
interface StepItemProps {
  step: Step;
  index: number;
  totalSteps: number;
  taskId: string;
  mode?: 'executing' | 'managing'; // Mode for recurring tasks
  isToday?: boolean; // When in queue, indicates if step is selected for Today
  isAITarget?: boolean; // Highlight when this step is targeted by AI action
  isAITargetLoading?: boolean; // Show spinner when this step is AI target AND request in flight
  hideCheckbox?: boolean; // Hide checkbox (for managing mode)
  // Single popover constraint
  openMenuId: string | null;
  onOpenMenu: (id: string) => void;
  onCloseMenu: () => void;
  onToggleComplete: (completed: boolean) => void;
  onSubstepComplete: (substepId: string, completed: boolean) => void;
  onUpdateStep: (text: string) => void;
  onUpdateSubstep: (substepId: string, text: string) => void;
  onUpdateEstimate: (minutes: number | null) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddSubstep: (text: string) => void;
  onDeleteSubstep: (substepId: string) => void;
  onMoveSubstepUp: (substepId: string) => void;
  onMoveSubstepDown: (substepId: string) => void;
  onStartFocus?: () => void;
  onOpenAIPalette?: () => void;
}

function StepItem({ step, index, totalSteps, mode, isToday, isAITarget, isAITargetLoading, hideCheckbox, openMenuId, onOpenMenu, onCloseMenu, onToggleComplete, onSubstepComplete, onUpdateStep, onUpdateSubstep, onUpdateEstimate, onDelete, onMoveUp, onMoveDown, onAddSubstep, onDeleteSubstep, onMoveSubstepUp, onMoveSubstepDown, onStartFocus, onOpenAIPalette }: StepItemProps) {
  const [editingStep, setEditingStep] = useState(false);
  const [stepText, setStepText] = useState(step.text);
  const [editingSubstepId, setEditingSubstepId] = useState<string | null>(null);
  const [substepText, setSubstepText] = useState("");
  const [addingSubstep, setAddingSubstep] = useState(false);
  const [newSubstepText, setNewSubstepText] = useState("");
  const [editingEstimate, setEditingEstimate] = useState(false);
  const [estimateValue, setEstimateValue] = useState(step.estimatedMinutes?.toString() || "");

  // Compute menu states from parent's openMenuId
  const showKebabMenu = openMenuId === `step-${step.id}`;
  const showSubstepMenu = openMenuId?.startsWith('substep-') ? openMenuId.replace('substep-', '') : null;

  const isFirst = index === 0;
  const isLast = index === totalSteps - 1;

  const handleStepSave = () => {
    if (stepText.trim() && stepText !== step.text) {
      onUpdateStep(stepText.trim());
    }
    setEditingStep(false);
  };

  const handleSubstepSave = (substepId: string) => {
    if (substepText.trim()) {
      onUpdateSubstep(substepId, substepText.trim());
    }
    setEditingSubstepId(null);
  };

  return (
    <div
      data-step-id={step.id}
      className={`
        group p-3 rounded-lg border transition-all
        ${
          isAITarget
            ? "border-violet-400 dark:border-violet-500 shadow-lg shadow-violet-200/50 dark:shadow-violet-900/30 ring-2 ring-violet-400/30"
            : step.completed
            ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50"
            : isToday
            ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700"
            : "bg-bg-neutral-min border-border-color-neutral hover:border-violet-300 dark:hover:border-violet-700"
        }
      `}
    >
      {/* Step row - flex container for checkbox, number, text, actions */}
      <div className="flex items-start gap-3">
      {/* Checkbox - hidden in managing mode, replaced with spinner during AI processing */}
      {!hideCheckbox && (
        isAITargetLoading ? (
          <div className="flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center">
            <Loader2 size={16} className="animate-spin text-violet-500" />
          </div>
        ) : (
          <button
            onClick={() => onToggleComplete(!step.completed)}
            className={`
              flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors
              ${
                step.completed
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-border-color-neutral hover:border-violet-400"
              }
            `}
          >
            {step.completed && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )
      )}

      {/* Step number */}
      <span className="flex-shrink-0 w-5 text-xs text-fg-neutral-soft mt-0.5">
        {index + 1}.
      </span>

      {/* Step text */}
      <div className="flex-1 min-w-0">
        {editingStep ? (
          <textarea
            value={stepText}
            onChange={(e) => setStepText(e.target.value.replace(/\n/g, ' '))}
            onBlur={handleStepSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleStepSave(); }
              if (e.key === "Escape") {
                setStepText(step.text);
                setEditingStep(false);
              }
            }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
            rows={1}
            className="w-full text-sm bg-transparent border-b border-violet-500 focus:outline-none text-fg-neutral-primary px-1 -mx-1 resize-none overflow-hidden"
            ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; el.focus(); } }}
          />
        ) : (
          <span
            className={`min-h-[1.5rem] text-sm leading-relaxed ${
              step.completed
                ? "text-fg-neutral-secondary"
                : "text-fg-neutral-primary"
            }`}
          >
            {/* Step text - clickable to edit */}
            <span
              onClick={() => {
                if (!isAITargetLoading) {
                  setEditingStep(true);
                  setStepText(step.text);
                }
              }}
              className={`px-1 -mx-1 rounded transition-colors ${
                isAITargetLoading
                  ? "cursor-not-allowed opacity-70"
                  : "cursor-text hover:bg-bg-neutral-subtle"
              } ${step.completed ? "line-through" : ""}`}
            >
              {step.text}
            </span>
            {/* Inline estimate and pills */}
            {step.estimatedMinutes && (
              <button
                onClick={() => {
                  setEstimateValue(step.estimatedMinutes?.toString() || "");
                  setEditingEstimate(true);
                }}
                className="ml-2 inline-flex items-center gap-1 text-xs text-fg-neutral-soft hover:text-violet-500 dark:hover:text-violet-400 transition-colors align-middle"
              >
                <span>~{formatDuration(step.estimatedMinutes)}</span>
                {step.estimateSource === "ai" && (
                  <span className="inline-flex items-center px-1 py-0.5 text-[10px] leading-none font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
                    AI
                  </span>
                )}
              </button>
            )}
            {step.origin && ['template', 'ai'].includes(step.origin) && mode === 'executing' && (
              <span className="ml-1 inline-flex items-center px-1 py-0.5 text-[10px] leading-none font-medium bg-zinc-500/20 dark:bg-zinc-400/20 text-fg-neutral-secondary rounded align-middle">
                {step.origin === 'template' ? 'from template' : 'AI'}
              </span>
            )}
          </span>
        )}

        {/* Estimate editing mode */}
        {editingEstimate && (
          <div className="mt-1 flex items-center gap-1">
            <input
              type="number"
              value={estimateValue}
              onChange={(e) => setEstimateValue(e.target.value)}
              onBlur={() => {
                const mins = parseInt(estimateValue);
                onUpdateEstimate(mins > 0 ? mins : null);
                setEditingEstimate(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const mins = parseInt(estimateValue);
                  onUpdateEstimate(mins > 0 ? mins : null);
                  setEditingEstimate(false);
                }
                if (e.key === "Escape") {
                  setEstimateValue(step.estimatedMinutes?.toString() || "");
                  setEditingEstimate(false);
                }
              }}
              placeholder="mins"
              className="w-16 px-1 py-0.5 text-xs bg-bg-neutral-min border border-violet-400 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
              autoFocus
              min="1"
            />
            <span className="text-xs text-zinc-400">min</span>
          </div>
        )}
      </div>

      {/* Actions - visible on hover (desktop) or always (mobile) */}
      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {!step.completed && onStartFocus && (
          <button
            onClick={onStartFocus}
            className="p-1 text-violet-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded"
            title="Focus on this step"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
        {/* AI Sparkle button - opens palette with step target context */}
        {!step.completed && onOpenAIPalette && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isAITargetLoading) onOpenAIPalette();
            }}
            disabled={isAITargetLoading}
            className={`p-1.5 rounded-md transition-colors ${
              isAITargetLoading
                ? "opacity-50 cursor-not-allowed text-violet-400"
                : "text-violet-500 hover:text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30"
            }`}
            title="AI actions"
          >
            <Sparkles size={16} />
          </button>
        )}
        {/* Step actions kebab menu */}
        <div className="relative">
          <button
            onClick={() => showKebabMenu ? onCloseMenu() : onOpenMenu(`step-${step.id}`)}
            className="p-1 text-zinc-400 hover:text-fg-neutral-secondary hover:bg-bg-neutral-subtle rounded"
            title="Step options"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {showKebabMenu && (
            <>
            <div className="fixed inset-0 z-10" onClick={() => onCloseMenu()} />
            <div className="absolute right-0 top-full mt-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[140px]">
              <button
                onClick={() => { onMoveUp(); onCloseMenu(); }}
                disabled={isFirst}
                className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Move Up
              </button>
              <button
                onClick={() => { onMoveDown(); onCloseMenu(); }}
                disabled={isLast}
                className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Move Down
              </button>
              {/* Add Substep - always available (templates can have substeps too) */}
              <div className="border-t border-border-color-neutral my-1" />
              <button
                onClick={() => { setAddingSubstep(true); onCloseMenu(); }}
                className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Substep
              </button>
              <button
                onClick={() => {
                  setEstimateValue(step.estimatedMinutes?.toString() || "");
                  setEditingEstimate(true);
                  onCloseMenu();
                }}
                className="w-full px-3 py-1.5 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {step.estimatedMinutes ? "Edit Estimate" : "Set Estimate"}
              </button>
              <div className="border-t border-border-color-neutral my-1" />
              <button
                onClick={() => { onDelete(); onCloseMenu(); }}
                className="w-full px-3 py-1.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
            </>
          )}
        </div>
      </div>
      </div>
      {/* End of step row inner flex */}

      {/* Substeps - rendered outside inner flex for full width */}
      {step.substeps.length > 0 && (
        <div className="mt-2 ml-16 pl-2 space-y-1 border-l-2 border-border-color-neutral">
          {step.substeps.map((substep, substepIndex) => (
            <div key={substep.id} className="flex items-center gap-3 group/substep">
              {/* Substep checkbox - hidden in managing mode */}
              {!hideCheckbox && (
                <button
                  onClick={() => onSubstepComplete(substep.id, !substep.completed)}
                  className={`
                    flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors
                    ${
                      substep.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-border-color-neutral hover:border-violet-400"
                    }
                  `}
                >
                  {substep.completed && (
                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              )}
              {editingSubstepId === substep.id ? (
                <textarea
                  value={substepText}
                  onChange={(e) => setSubstepText(e.target.value.replace(/\n/g, ' '))}
                  onBlur={() => handleSubstepSave(substep.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleSubstepSave(substep.id); }
                    if (e.key === "Escape") setEditingSubstepId(null);
                  }}
                  onInput={(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }}
                  rows={1}
                  className="flex-1 text-xs bg-transparent border-b border-violet-500 focus:outline-none text-fg-neutral-secondary resize-none overflow-hidden"
                  ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; el.focus(); } }}
                />
              ) : (
                <span
                  onClick={() => {
                    setEditingSubstepId(substep.id);
                    setSubstepText(substep.text);
                  }}
                  className={`flex-1 text-xs cursor-text hover:bg-bg-neutral-subtle px-1 -mx-1 rounded transition-colors ${
                    substep.completed
                      ? "text-zinc-400 line-through"
                      : "text-fg-neutral-secondary"
                  }`}
                >
                  {substep.text}
                </span>
              )}
              {/* Substep actions menu */}
              <div className="relative opacity-0 group-hover/substep:opacity-100 transition-opacity">
                <button
                  onClick={() => showSubstepMenu === substep.id ? onCloseMenu() : onOpenMenu(`substep-${substep.id}`)}
                  className="p-1 text-zinc-400 hover:text-fg-neutral-secondary rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {showSubstepMenu === substep.id && (
                  <>
                  <div className="fixed inset-0 z-10" onClick={() => onCloseMenu()} />
                  <div className="absolute right-0 top-full mt-1 py-1 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-20 min-w-[140px]">
                    <button
                      onClick={() => { onMoveSubstepUp(substep.id); onCloseMenu(); }}
                      disabled={substepIndex === 0}
                      className="w-full px-3 py-2 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Move Up
                    </button>
                    <button
                      onClick={() => { onMoveSubstepDown(substep.id); onCloseMenu(); }}
                      disabled={substepIndex === step.substeps.length - 1}
                      className="w-full px-3 py-2 text-sm text-left text-fg-neutral-primary hover:bg-bg-neutral-subtle disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Move Down
                    </button>
                    <div className="border-t border-border-color-neutral my-1" />
                    <button
                      onClick={() => { onDeleteSubstep(substep.id); onCloseMenu(); }}
                      className="w-full px-3 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add substep form */}
      {addingSubstep && (
        <div className="mt-2 ml-16 pl-2 border-l-2 border-border-color-neutral">
          <input
            type="text"
            value={newSubstepText}
            onChange={(e) => setNewSubstepText(e.target.value)}
            onBlur={() => {
              if (newSubstepText.trim()) {
                onAddSubstep(newSubstepText.trim());
              }
              setNewSubstepText("");
              setAddingSubstep(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSubstepText.trim()) {
                onAddSubstep(newSubstepText.trim());
                setNewSubstepText("");
                setAddingSubstep(false);
              }
              if (e.key === "Escape") {
                setNewSubstepText("");
                setAddingSubstep(false);
              }
            }}
            placeholder="Add substep..."
            className="w-full text-xs px-2 py-1 bg-bg-neutral-min border border-border-color-neutral rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
