"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Repeat, History, Pause, Play, X } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Task, Step, SuggestedStep, EditSuggestion, DeletionSuggestion, FocusQueue, Project, AITargetContext, createStep } from "@/lib/types";
import { formatDuration, formatDate, isDateOverdue, getDisplayStatus, getStatusInfo, computeHealthStatus } from "@/lib/utils";
import { getTodayISO, ensureInstance, describePattern } from "@/lib/recurring-utils";
import { RecurrenceRuleExtended } from "@/lib/recurring-types";
import StagingArea from "@/components/StagingArea";
import NotesModule from "@/components/NotesModule";
import MetadataPill from "@/components/shared/MetadataPill";
import FocusSelectionModal from "@/components/shared/FocusSelectionModal";
import HealthPill from "@/components/shared/HealthPill";
import ReminderPicker from "@/components/shared/ReminderPicker";
import HistoryModal from "@/components/routines/HistoryModal";
import EditTemplateModal from "@/components/task-detail/EditTemplateModal";
import RecurrenceFields from "@/components/task-detail/RecurrenceFields";
import StatusModule from "@/components/task-detail/StatusModule";
import { formatReminder, scheduleReminder, cancelReminder } from "@/lib/notifications";

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
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  deletions: DeletionSuggestion[];
  suggestedTitle: string | null;
  stagingIsNewArrival?: boolean;
  onStagingAnimationComplete?: () => void;
  onBack: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onStepComplete: (taskId: string, stepId: string, completed: boolean) => void;
  onSubstepComplete: (taskId: string, stepId: string, substepId: string, completed: boolean) => void;
  onUpdateStep: (taskId: string, stepId: string, text: string) => void;
  onUpdateStepEstimate: (taskId: string, stepId: string, minutes: number | null) => void;
  onUpdateSubstep: (taskId: string, stepId: string, substepId: string, text: string) => void;
  onAddStep: (taskId: string, text: string) => void;
  onDeleteStep: (taskId: string, stepId: string) => void;
  onMoveStepUp: (taskId: string, stepId: string) => void;
  onMoveStepDown: (taskId: string, stepId: string) => void;
  onAddSubstep: (taskId: string, stepId: string, text: string) => void;
  onDeleteSubstep: (taskId: string, stepId: string, substepId: string) => void;
  onMoveSubstepUp: (taskId: string, stepId: string, substepId: string) => void;
  onMoveSubstepDown: (taskId: string, stepId: string, substepId: string) => void;
  onAddToQueue: (taskId: string, forToday?: boolean, selectionType?: 'all_today' | 'all_upcoming' | 'specific_steps', selectedStepIds?: string[]) => void;
  onUpdateStepSelection: (queueItemId: string, selectionType: 'all_today' | 'all_upcoming' | 'specific_steps', selectedStepIds: string[]) => void;
  onSendToPool: (taskId: string) => void;
  onDefer: (taskId: string, until: string) => void;
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
  onAcceptTitle: () => void;
  onRejectTitle: () => void;
  onOpenProjectModal: (project?: Project) => void;
  // Inline AI actions
  aiTargetContext?: AITargetContext | null;
  isAILoading?: boolean;  // True when AI request is in flight
  onOpenAIPalette?: (taskId: string, stepId: string) => void;
  onClearAITarget?: () => void;
  // Recurring task actions
  onCompleteRoutine?: (taskId: string) => void;
  onSkipRoutine?: (taskId: string) => void;
  onMarkRoutineIncomplete?: (taskId: string) => void;
}

// Get queue item for this task
function getQueueItem(task: Task, queue: FocusQueue) {
  return queue.items.find((i) => i.taskId === task.id && !i.completed);
}


export default function TaskDetail({
  task,
  queue,
  projects,
  suggestions,
  edits,
  deletions,
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
  onAcceptTitle,
  onRejectTitle,
  onOpenProjectModal,
  aiTargetContext,
  isAILoading,
  onOpenAIPalette,
  onClearAITarget,
  onCompleteRoutine,
  onSkipRoutine,
  onMarkRoutineIncomplete,
}: TaskDetailProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(task.title);
  const [newStepText, setNewStepText] = useState("");
  const [showDeferMenu, setShowDeferMenu] = useState(false);
  const [completedStepsExpanded, setCompletedStepsExpanded] = useState(false);
  // Auto-expand details for inbox tasks (triage mode), collapse for ready/queued tasks
  const [detailsExpanded, setDetailsExpanded] = useState(task.status === 'inbox');
  // Focus selection modal state
  const [showFocusModal, setShowFocusModal] = useState(false);
  // Add to Focus dropdown state
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  // Mobile kebab menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // Reminder picker state
  const [showReminderPicker, setShowReminderPicker] = useState(false);

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
  const activeDate = isRecurring ? getTodayISO() : null;
  const recurrencePattern = task.recurrence as RecurrenceRuleExtended | null;
  const isPaused = recurrencePattern?.pausedAt ? true : false;
  const patternDescription = recurrencePattern ? describePattern(recurrencePattern) : '';
  const [showRoutinePopover, setShowRoutinePopover] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [isPatternHandleHovered, setIsPatternHandleHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Get current instance for recurring tasks (lazy - only called when rendering)
  const getCurrentInstance = () => {
    if (!isRecurring || !activeDate) return null;
    return ensureInstance(task, activeDate);
  };
  const currentInstance = isRecurring ? getCurrentInstance() : null;

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

  // Build details summary for collapsed view
  const getDetailsSummary = () => {
    const pills: { label: string; variant: 'default' | 'priority-high' | 'priority-medium' | 'healthy' | 'due' | 'overdue' | 'project'; color?: string; icon?: 'bell'; health?: ReturnType<typeof computeHealthStatus> }[] = [];
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
      onAddStep(task.id, newStepText.trim());
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
                  className="flex-1 min-w-0 text-xl font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent border-b-2 border-violet-500 focus:outline-none resize-none overflow-hidden min-h-[1.75rem]"
                  autoFocus
                  rows={1}
                />
              ) : (
                <h1
                  onClick={() => setEditingTitle(true)}
                  className="flex-1 min-w-0 text-xl font-semibold text-zinc-900 dark:text-zinc-100 break-words cursor-text hover:text-violet-600 dark:hover:text-violet-400"
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
                {/* Show Mark Incomplete if instance is completed */}
                {currentInstance?.completed && onMarkRoutineIncomplete ? (
                  <button
                    onClick={() => onMarkRoutineIncomplete(task.id)}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                  >
                    Mark Incomplete
                  </button>
                ) : (
                  /* Show Complete/Skip if not completed and not paused */
                  <>
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
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                      >
                        Skip
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <History className="w-4 h-4" />
                  History
                </button>
              </>
            ) : (
              /* Regular task buttons */
              <>
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
                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                  >
                    Mark Incomplete
                  </button>
                )}
                {isInQueue ? (
                  <button
                    onClick={() => onStartFocus(queueItem!.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                  >
                    Start Focus
                  </button>
                ) : (
                  <>
                    {task.status === "inbox" && (
                      <button
                        onClick={() => onSendToPool(task.id)}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                      >
                        Move to Ready
                      </button>
                    )}
                    {/* Add to Focus with dropdown */}
                    <div className="relative">
                      <div className="flex">
                        <button
                          onClick={() => onAddToQueue(task.id, false, 'all_upcoming', [])}
                          className="px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-l-lg transition-colors"
                        >
                          Add to Focus
                        </button>
                        <div className="w-px" />
                        <button
                          onClick={() => setShowAddDropdown(!showAddDropdown)}
                          className="px-2 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-r-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      {showAddDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowAddDropdown(false)} />
                          <div className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[160px]">
                            <button
                              onClick={() => {
                                onAddToQueue(task.id, true, 'all_today', []);
                                setShowAddDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
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
              {/* Show Mark Incomplete if instance is completed */}
              {currentInstance?.completed && onMarkRoutineIncomplete ? (
                <button
                  onClick={() => onMarkRoutineIncomplete(task.id)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                >
                  Mark Incomplete
                </button>
              ) : (
                /* Show Complete/Skip if not completed and not paused */
                <>
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
                      className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                    >
                      Skip
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <History className="w-4 h-4" />
                History
              </button>
            </>
          ) : (
            /* Regular task buttons - mobile */
            <>
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
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                >
                  Mark Incomplete
                </button>
              )}
              {isInQueue ? (
                <button
                  onClick={() => onStartFocus(queueItem!.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                >
                  Start Focus
                </button>
              ) : (
                <>
                  {task.status === "inbox" && (
                    <button
                      onClick={() => onSendToPool(task.id)}
                      className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                    >
                      Move to Ready
                    </button>
                  )}
                </>
              )}
            </>
          )}
          {/* Add to Focus split button (mobile) - only for pool tasks, not inbox (too wide), not recurring */}
          {!isRecurring && !isInQueue && task.status === 'pool' && (
            <div className="relative">
              <div className="flex">
                <button
                  onClick={() => onAddToQueue(task.id, false, 'all_upcoming', [])}
                  className="px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-l-lg transition-colors"
                >
                  Add to Focus
                </button>
                <div className="w-px" />
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="px-2 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-r-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {showMobileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMobileMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[160px]">
                    <button
                      onClick={() => {
                        onAddToQueue(task.id, true, 'all_today', []);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
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
                className="px-2 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                title="Add to Focus options"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {showMobileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMobileMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[160px]">
                    <button
                      onClick={() => {
                        onAddToQueue(task.id, false, 'all_upcoming', []);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      Add to Focus
                    </button>
                    <button
                      onClick={() => {
                        onAddToQueue(task.id, true, 'all_today', []);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
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

      {/* Focus Selection Modal - only used for Edit Focus when task is in queue */}
      {isInQueue && (
        <FocusSelectionModal
          isOpen={showFocusModal}
          task={task}
          initialSelectionType={queueItem!.selectionType}
          initialSelectedStepIds={
            queueItem!.selectionType === 'specific_steps'
              ? queueItem!.selectedStepIds
              : []
          }
          onClose={() => setShowFocusModal(false)}
          onConfirm={(selectionType, selectedStepIds) => {
            setShowFocusModal(false);
            onUpdateStepSelection(queueItem!.id, selectionType, selectedStepIds);
          }}
          mode="edit"
        />
      )}

      {/* Status Module */}
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
      />

      {/* Staging Area for AI suggestions */}
      {(suggestions.length > 0 || edits.length > 0 || deletions.length > 0 || suggestedTitle) && (
        <div id="staging-area" className="mb-6 scroll-mt-4">
          <StagingArea
            suggestions={suggestions}
            edits={edits}
            deletions={deletions}
            suggestedTitle={suggestedTitle}
            currentTitle={task.title}
            onAcceptOne={onAcceptOne}
            onAcceptAll={onAcceptAll}
            onDismiss={onDismiss}
            onAcceptEdit={onAcceptEdit}
            onRejectEdit={onRejectEdit}
            onAcceptDeletion={onAcceptDeletion}
            onRejectDeletion={onRejectDeletion}
            onAcceptTitle={onAcceptTitle}
            onRejectTitle={onRejectTitle}
            isNewArrival={stagingIsNewArrival}
            onAnimationComplete={onStagingAnimationComplete}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1">
        {/* Steps section - Different structure for recurring vs regular tasks */}
        <div className="mb-6">
          {isRecurring && currentInstance ? (
            /* RECURRING TASKS: Two sections - Routine Steps + Additional Steps */
            <>
              {/* Routine Steps Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-medium text-zinc-500 dark:text-zinc-400">
                    Routine Steps
                  </h2>
                  <button
                    onClick={() => setShowEditTemplateModal(true)}
                    className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Template
                  </button>
                </div>

                {currentInstance.routineSteps.length === 0 ? (
                  <div className="py-4 text-center text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm">No routine steps. Add steps via Edit Template.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentInstance.routineSteps.map((step, idx) => (
                      <StepItem
                        key={step.id}
                        step={step}
                        index={idx}
                        totalSteps={currentInstance.routineSteps.length}
                        taskId={task.id}
                        isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                        isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                        onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                        onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed)}
                        onUpdateStep={(text) => onUpdateStep(task.id, step.id, text)}
                        onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                        onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text)}
                        onDelete={() => onDeleteStep(task.id, step.id)}
                        onMoveUp={() => onMoveStepUp(task.id, step.id)}
                        onMoveDown={() => onMoveStepDown(task.id, step.id)}
                        onAddSubstep={(text) => onAddSubstep(task.id, step.id, text)}
                        onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId)}
                        onMoveSubstepUp={(substepId) => onMoveSubstepUp(task.id, step.id, substepId)}
                        onMoveSubstepDown={(substepId) => onMoveSubstepDown(task.id, step.id, substepId)}
                        onOpenAIPalette={onOpenAIPalette ? () => onOpenAIPalette(task.id, step.id) : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Steps Section - only show when there are additional steps */}
              {currentInstance.additionalSteps.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="flex items-baseline gap-2 text-base font-medium text-zinc-500 dark:text-zinc-400">
                      <span>Additional Steps</span>
                      <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
                        {formatRoutineDateHeader(activeDate!)}
                      </span>
                    </h2>
                  </div>

                  <div className="space-y-2">
                    {currentInstance.additionalSteps.map((step, idx) => (
                      <StepItem
                        key={step.id}
                        step={step}
                        index={idx}
                        totalSteps={currentInstance.additionalSteps.length}
                        taskId={task.id}
                        isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                        isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                        onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                        onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed)}
                        onUpdateStep={(text) => onUpdateStep(task.id, step.id, text)}
                        onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                        onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text)}
                        onDelete={() => onDeleteStep(task.id, step.id)}
                        onMoveUp={() => onMoveStepUp(task.id, step.id)}
                        onMoveDown={() => onMoveStepDown(task.id, step.id)}
                        onAddSubstep={(text) => onAddSubstep(task.id, step.id, text)}
                        onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId)}
                        onMoveSubstepUp={(substepId) => onMoveSubstepUp(task.id, step.id, substepId)}
                        onMoveSubstepDown={(substepId) => onMoveSubstepDown(task.id, step.id, substepId)}
                        onOpenAIPalette={onOpenAIPalette ? () => onOpenAIPalette(task.id, step.id) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* REGULAR TASKS: Single steps section */
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-medium text-zinc-500 dark:text-zinc-400">
                  Steps
                </h2>
                {/* Conditional swap: Edit Focus when in queue, AI Breakdown when not */}
                {isInQueue && task.steps.length > 0 ? (
                  <button
                    onClick={() => setShowFocusModal(true)}
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

              {/* Steps list */}
              {task.steps.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
                  <p className="mb-2">No steps yet</p>
                  <p className="text-sm">Add steps below or use AI to break down this task</p>
                </div>
          ) : (
            <div className="space-y-2">
              {/* Show completed steps when expanded (via StatusModule toggle) OR when all steps are complete */}
              {(completedStepsExpanded || allStepsComplete) && completedSteps.map((step) => {
                const originalIndex = task.steps.findIndex(s => s.id === step.id);
                return (
                  <StepItem
                    key={step.id}
                    step={step}
                    index={originalIndex}
                    totalSteps={task.steps.length}
                    taskId={task.id}
                    isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                    isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                    onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                    onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed)}
                    onUpdateStep={(text) => onUpdateStep(task.id, step.id, text)}
                    onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                    onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text)}
                    onDelete={() => onDeleteStep(task.id, step.id)}
                    onMoveUp={() => onMoveStepUp(task.id, step.id)}
                    onMoveDown={() => onMoveStepDown(task.id, step.id)}
                    onAddSubstep={(text) => onAddSubstep(task.id, step.id, text)}
                    onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId)}
                    onMoveSubstepUp={(substepId) => onMoveSubstepUp(task.id, step.id, substepId)}
                    onMoveSubstepDown={(substepId) => onMoveSubstepDown(task.id, step.id, substepId)}
                    onStartFocus={queueItem ? () => onStartFocus(queueItem.id) : undefined}
                    onOpenAIPalette={onOpenAIPalette ? () => onOpenAIPalette(task.id, step.id) : undefined}
                  />
                );
              })}

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
                            isToday
                            isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                            isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                            onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                            onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed)}
                            onUpdateStep={(text) => onUpdateStep(task.id, step.id, text)}
                            onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                            onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text)}
                            onDelete={() => onDeleteStep(task.id, step.id)}
                            onMoveUp={() => onMoveStepUp(task.id, step.id)}
                            onMoveDown={() => onMoveStepDown(task.id, step.id)}
                            onAddSubstep={(text) => onAddSubstep(task.id, step.id, text)}
                            onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId)}
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
                        <span className="px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
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
                            isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                            isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                            onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                            onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed)}
                            onUpdateStep={(text) => onUpdateStep(task.id, step.id, text)}
                            onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                            onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text)}
                            onDelete={() => onDeleteStep(task.id, step.id)}
                            onMoveUp={() => onMoveStepUp(task.id, step.id)}
                            onMoveDown={() => onMoveStepDown(task.id, step.id)}
                            onAddSubstep={(text) => onAddSubstep(task.id, step.id, text)}
                            onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId)}
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
                      isAITarget={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id}
                      isAITargetLoading={aiTargetContext?.type === 'step' && aiTargetContext?.stepId === step.id && isAILoading}
                      onToggleComplete={(completed) => onStepComplete(task.id, step.id, completed)}
                      onSubstepComplete={(substepId, completed) => onSubstepComplete(task.id, step.id, substepId, completed)}
                      onUpdateStep={(text) => onUpdateStep(task.id, step.id, text)}
                      onUpdateEstimate={(minutes) => onUpdateStepEstimate(task.id, step.id, minutes)}
                      onUpdateSubstep={(substepId, text) => onUpdateSubstep(task.id, step.id, substepId, text)}
                      onDelete={() => onDeleteStep(task.id, step.id)}
                      onMoveUp={() => onMoveStepUp(task.id, step.id)}
                      onMoveDown={() => onMoveStepDown(task.id, step.id)}
                      onAddSubstep={(text) => onAddSubstep(task.id, step.id, text)}
                      onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, step.id, substepId)}
                      onMoveSubstepUp={(substepId) => onMoveSubstepUp(task.id, step.id, substepId)}
                      onMoveSubstepDown={(substepId) => onMoveSubstepDown(task.id, step.id, substepId)}
                      onOpenAIPalette={onOpenAIPalette ? () => onOpenAIPalette(task.id, step.id) : undefined}
                    />
                  );
                })
              )}
            </div>
          )}
            </>
          )}

          {/* Add step form */}
          <form onSubmit={handleAddStep} className="mt-3 flex gap-2">
            <input
              type="text"
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              placeholder="Add a step..."
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
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

        {/* Metadata section - Collapsible */}
        <div className="pb-4">
          {/* Collapsible Header */}
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="w-full flex items-center justify-between mb-3 group"
          >
            <h2 className="text-base font-medium text-zinc-500 dark:text-zinc-400">
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

          {/* Collapsed Summary */}
          {!detailsExpanded && (
            <div
              onClick={() => setDetailsExpanded(true)}
              className="flex flex-wrap gap-1.5 items-center cursor-pointer px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              {detailsSummary.length > 0 ? (
                detailsSummary.map((pill, idx) => (
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
                      ) : undefined}
                    >
                      {pill.label}
                    </MetadataPill>
                  )
                ))
              ) : (
                <span className="text-sm text-zinc-400 dark:text-zinc-500">No details set</span>
              )}
            </div>
          )}

          {/* Expanded Details */}
          {detailsExpanded && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 min-w-0">
              {/* Recurring toggle - full width */}
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recurring</span>
                  </div>
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
                          },
                          status: 'pool', // Routines skip triage
                        });
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
                {task.isRecurring && patternDescription && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {patternDescription}
                    {' '}
                    <button
                      className="text-violet-600 dark:text-violet-400 hover:underline"
                      onClick={() => setShowPatternModal(true)}
                    >
                      Edit pattern
                    </button>
                  </p>
                )}
              </div>

              {/* Status (+ Health for pool tasks) - 50% */}
              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Status</span>
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

              {/* Priority - 50% (hidden for recurring tasks) */}
              {!isRecurring && (
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Priority</span>
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
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                          }
                        `}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Project - full width */}
              <div className="col-span-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Project</span>
                <div className="flex items-center gap-2">
                  <select
                    value={task.projectId || ""}
                    onChange={(e) => onUpdateTask(task.id, { projectId: e.target.value || null })}
                    className="flex-1 h-8 px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">No project</option>
                    {projects.filter(p => p.status === 'active').map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onOpenProjectModal()}
                    className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Create project"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Date Fields - Side by side (hidden for recurring tasks) */}
              {!isRecurring && (
                <div className="col-span-2 grid grid-cols-2 gap-x-4 min-w-0">
                  {/* Target Date */}
                  <div className="min-w-0 relative">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Target</span>
                    <input
                      type="date"
                      value={task.targetDate || ""}
                      onChange={(e) => onUpdateTask(task.id, { targetDate: e.target.value || null })}
                      className="w-full min-w-0 h-8 px-2 py-1 pr-8 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    {task.targetDate && (
                      <button
                        type="button"
                        onClick={() => onUpdateTask(task.id, { targetDate: null })}
                        className="absolute right-2 top-1/2 mt-2.5 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        title="Clear date"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Deadline */}
                  <div className="min-w-0 relative">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Deadline</span>
                    <input
                      type="date"
                      value={task.deadlineDate || ""}
                      onChange={(e) => onUpdateTask(task.id, { deadlineDate: e.target.value || null })}
                      className="w-full min-w-0 h-8 px-2 py-1 pr-8 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    {task.deadlineDate && (
                      <button
                        type="button"
                        onClick={() => onUpdateTask(task.id, { deadlineDate: null })}
                        className="absolute right-2 top-1/2 mt-2.5 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        title="Clear date"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Reminder + Waiting On - side by side on desktop */}
              <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {/* Reminder */}
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Reminder</span>
                  <div className="relative">
                    <button
                      onClick={() => setShowReminderPicker(!showReminderPicker)}
                      className="w-full h-8 px-2 py-1 text-sm text-left bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 flex items-center justify-between"
                    >
                      <span className={task.reminder ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}>
                        {task.reminder
                          ? formatReminder(task.reminder, task.targetDate, task.deadlineDate)
                          : "None"}
                      </span>
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </button>
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
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Waiting On</span>
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
                    className="w-full h-8 px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes section */}
        <div className="mt-6">
          <h2 className="text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">
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
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3 flex-wrap">
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
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-2"
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
              /* Defer dropdown for regular tasks */
              <div className="relative">
                <button
                  onClick={() => setShowDeferMenu(!showDeferMenu)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Defer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDeferMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDeferMenu(false)} />
                    <div className="absolute left-0 bottom-full mb-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[140px]">
                      <button
                        onClick={() => {
                          onDefer(task.id, getDeferDate(1));
                          setShowDeferMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        Tomorrow
                      </button>
                      <button
                        onClick={() => {
                          onDefer(task.id, getDeferDate(7));
                          setShowDeferMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        Next week
                      </button>
                      <button
                        onClick={() => {
                          onDefer(task.id, getDeferDate(30));
                          setShowDeferMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        Next month
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Archive/Unarchive button */}
            <button
              onClick={() => task.status === 'archived' ? onUnarchive(task.id) : onPark(task.id)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-2"
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

      {/* Edit Template Modal for recurring tasks */}
      {isRecurring && (
        <EditTemplateModal
          task={task}
          currentInstance={currentInstance}
          isOpen={showEditTemplateModal}
          onClose={() => setShowEditTemplateModal(false)}
          onSave={(newTemplateSteps, promotedIds, demotedIds) => {
            // newTemplateSteps contains instance steps (with instance IDs)
            // We need to sync both the template (task.steps) and the current instance

            const updates: Partial<Task> = {};

            // Update the template (task.steps) based on promotions/demotions
            // For demoted steps: Find and remove from task.steps by matching text
            // For promoted steps: Add copies with new IDs
            if (currentInstance) {
              // Get the text of demoted steps (to match against task.steps)
              const demotedStepTexts = currentInstance.routineSteps
                .filter((s) => demotedIds.includes(s.id))
                .map((s) => s.text);

              // Get promoted steps from additionalSteps
              const promotedStepsToAdd = currentInstance.additionalSteps
                .filter((s) => promotedIds.includes(s.id))
                .map((s) => createStep(s.text, { source: s.source }));

              // Update template: remove demoted, add promoted
              const filteredTemplateSteps = task.steps.filter(
                (s) => !demotedStepTexts.includes(s.text)
              );
              updates.steps = [...filteredTemplateSteps, ...promotedStepsToAdd];
            }

            // Update recurringInstances to reflect promoted/demoted steps
            if (activeDate && task.recurringInstances) {
              const updatedInstances = task.recurringInstances.map((inst) => {
                if (inst.date !== activeDate) return inst;

                // Get promoted steps (were in additionalSteps, now template)
                const promotedSteps = inst.additionalSteps
                  .filter((s) => promotedIds.includes(s.id))
                  .map((s) => ({ ...s }));

                // Remove promoted steps from additionalSteps (they're now in routineSteps)
                const filteredAdditional = inst.additionalSteps.filter(
                  (s) => !promotedIds.includes(s.id)
                );

                // Get demoted steps (were in routineSteps, now additional)
                const demotedSteps = inst.routineSteps
                  .filter((s) => demotedIds.includes(s.id))
                  .map((s) => ({ ...s }));

                // Remove demoted steps from routineSteps (they're now in additionalSteps)
                const filteredRoutine = inst.routineSteps.filter(
                  (s) => !demotedIds.includes(s.id)
                );

                return {
                  ...inst,
                  // Add promoted steps to routineSteps
                  routineSteps: [...filteredRoutine, ...promotedSteps],
                  // Add demoted steps to additionalSteps
                  additionalSteps: [...filteredAdditional, ...demotedSteps],
                };
              });
              updates.recurringInstances = updatedInstances;
            }

            onUpdateTask(task.id, updates);
            setShowEditTemplateModal(false);
          }}
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
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl z-[70] flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Edit Pattern
                </h2>
                <button
                  onClick={() => setShowPatternModal(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Edit Pattern
                </h2>
                <button
                  onClick={() => setShowPatternModal(false)}
                  className="px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
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
    </div>
  );
}

// Step Item Component
interface StepItemProps {
  step: Step;
  index: number;
  totalSteps: number;
  taskId: string;
  isToday?: boolean; // When in queue, indicates if step is selected for Today
  isAITarget?: boolean; // Highlight when this step is targeted by AI action
  isAITargetLoading?: boolean; // Show spinner when this step is AI target AND request in flight
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

function StepItem({ step, index, totalSteps, isToday, isAITarget, isAITargetLoading, onToggleComplete, onSubstepComplete, onUpdateStep, onUpdateSubstep, onUpdateEstimate, onDelete, onMoveUp, onMoveDown, onAddSubstep, onDeleteSubstep, onMoveSubstepUp, onMoveSubstepDown, onStartFocus, onOpenAIPalette }: StepItemProps) {
  const [editingStep, setEditingStep] = useState(false);
  const [stepText, setStepText] = useState(step.text);
  const [editingSubstepId, setEditingSubstepId] = useState<string | null>(null);
  const [substepText, setSubstepText] = useState("");
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [showSubstepMenu, setShowSubstepMenu] = useState<string | null>(null);
  const [addingSubstep, setAddingSubstep] = useState(false);
  const [newSubstepText, setNewSubstepText] = useState("");
  const [editingEstimate, setEditingEstimate] = useState(false);
  const [estimateValue, setEstimateValue] = useState(step.estimatedMinutes?.toString() || "");

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
            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700"
        }
      `}
    >
      {/* Step row - flex container for checkbox, number, text, actions */}
      <div className="flex items-start gap-3">
      {/* Checkbox - replaced with spinner during AI processing */}
      {isAITargetLoading ? (
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
                : "border-zinc-300 dark:border-zinc-600 hover:border-violet-400"
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
      )}

      {/* Step number */}
      <span className="flex-shrink-0 w-5 text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
        {index + 1}.
      </span>

      {/* Step text */}
      <div className="flex-1 min-w-0">
        {editingStep ? (
          <input
            type="text"
            value={stepText}
            onChange={(e) => setStepText(e.target.value)}
            onBlur={handleStepSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleStepSave();
              if (e.key === "Escape") {
                setStepText(step.text);
                setEditingStep(false);
              }
            }}
            className="w-full min-h-[1.5rem] text-sm bg-transparent border-b border-violet-500 focus:outline-none text-zinc-900 dark:text-zinc-100 px-1 -mx-1"
            autoFocus
          />
        ) : (
          <span
            onClick={() => {
              if (!isAITargetLoading) {
                setEditingStep(true);
                setStepText(step.text);
              }
            }}
            className={`block min-h-[1.5rem] text-sm px-1 -mx-1 rounded transition-colors ${
              isAITargetLoading
                ? "cursor-not-allowed opacity-70"
                : "cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-700"
            } ${
              step.completed
                ? "text-zinc-500 dark:text-zinc-400 line-through"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {step.text}
          </span>
        )}

        {/* Estimate */}
        {editingEstimate ? (
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
              className="w-16 px-1 py-0.5 text-xs bg-white dark:bg-zinc-800 border border-violet-400 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
              autoFocus
              min="1"
            />
            <span className="text-xs text-zinc-400">min</span>
          </div>
        ) : step.estimatedMinutes ? (
          <button
            onClick={() => {
              setEstimateValue(step.estimatedMinutes?.toString() || "");
              setEditingEstimate(true);
            }}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 mt-1 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
          >
            <span>~{formatDuration(step.estimatedMinutes)}</span>
            {step.estimateSource === "ai" && (
              <span className="px-1 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
                AI
              </span>
            )}
          </button>
        ) : null}
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
            onClick={() => setShowKebabMenu(!showKebabMenu)}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="Step options"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {showKebabMenu && (
            <div className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 min-w-[140px]">
              <button
                onClick={() => { onMoveUp(); setShowKebabMenu(false); }}
                disabled={isFirst}
                className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Move Up
              </button>
              <button
                onClick={() => { onMoveDown(); setShowKebabMenu(false); }}
                disabled={isLast}
                className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Move Down
              </button>
              <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
              <button
                onClick={() => { setAddingSubstep(true); setShowKebabMenu(false); }}
                className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
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
                  setShowKebabMenu(false);
                }}
                className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {step.estimatedMinutes ? "Edit Estimate" : "Set Estimate"}
              </button>
              <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
              <button
                onClick={() => { onDelete(); setShowKebabMenu(false); }}
                className="w-full px-3 py-1.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
      {/* End of step row inner flex */}

      {/* Substeps - rendered outside inner flex for full width */}
      {step.substeps.length > 0 && (
        <div className="mt-2 ml-16 pl-2 space-y-1 border-l-2 border-zinc-200 dark:border-zinc-700">
          {step.substeps.map((substep, substepIndex) => (
            <div key={substep.id} className="flex items-center gap-3 group/substep">
              <button
                onClick={() => onSubstepComplete(substep.id, !substep.completed)}
                className={`
                  flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors
                  ${
                    substep.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-zinc-300 dark:border-zinc-600 hover:border-violet-400"
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
              {editingSubstepId === substep.id ? (
                <input
                  type="text"
                  value={substepText}
                  onChange={(e) => setSubstepText(e.target.value)}
                  onBlur={() => handleSubstepSave(substep.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubstepSave(substep.id);
                    if (e.key === "Escape") setEditingSubstepId(null);
                  }}
                  className="flex-1 text-xs bg-transparent border-b border-violet-500 focus:outline-none text-zinc-600 dark:text-zinc-400"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => {
                    setEditingSubstepId(substep.id);
                    setSubstepText(substep.text);
                  }}
                  className={`flex-1 text-xs cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-700 px-1 -mx-1 rounded transition-colors ${
                    substep.completed
                      ? "text-zinc-400 line-through"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {substep.text}
                </span>
              )}
              {/* Substep actions menu */}
              <div className="relative opacity-0 group-hover/substep:opacity-100 transition-opacity">
                <button
                  onClick={() => setShowSubstepMenu(showSubstepMenu === substep.id ? null : substep.id)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {showSubstepMenu === substep.id && (
                  <div className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => { onMoveSubstepUp(substep.id); setShowSubstepMenu(null); }}
                      disabled={substepIndex === 0}
                      className="w-full px-3 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Move Up
                    </button>
                    <button
                      onClick={() => { onMoveSubstepDown(substep.id); setShowSubstepMenu(null); }}
                      disabled={substepIndex === step.substeps.length - 1}
                      className="w-full px-3 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Move Down
                    </button>
                    <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
                    <button
                      onClick={() => { onDeleteSubstep(substep.id); setShowSubstepMenu(null); }}
                      className="w-full px-3 py-1.5 text-xs text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add substep form */}
      {addingSubstep && (
        <div className="mt-2 ml-16 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
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
            className="w-full text-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
