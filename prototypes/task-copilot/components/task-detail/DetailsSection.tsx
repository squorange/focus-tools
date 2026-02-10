"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Lock, Plus, Check, ChevronDown, ChevronRight, Repeat, Bell, Calendar, Target, Timer, Clock, Zap, Star, X } from "lucide-react";
import { Task, FocusQueue, FocusQueueItem, Project, UserSettings, DrawerType, PriorityTier, ImportanceLevel, EnergyType } from "@/lib/types";
import { formatDate, isDateOverdue, getDisplayStatus, getStatusInfo, computeHealthStatus } from "@/lib/utils";
import { describePattern } from "@/lib/recurring-utils";
import { RecurrenceRuleExtended } from "@/lib/recurring-types";
import DetailsPill from "@/components/shared/DetailsPill";
import PriorityDisplay from "@/components/shared/PriorityDisplay";
import PriorityBreakdownDrawer from "@/components/shared/PriorityBreakdownDrawer";
import ImportancePicker from "@/components/shared/ImportancePicker";
import EnergyTypePicker from "@/components/shared/EnergyTypePicker";
import LeadTimePicker from "@/components/shared/LeadTimePicker";
import RecurrenceFields from "@/components/task-detail/RecurrenceFields";
import StatusModule from "@/components/task-detail/StatusModule";
import { BottomSheet, RightDrawer } from "@design-system/components";
import ReminderPicker from "@/components/shared/ReminderPicker";
import DurationPicker, { formatDurationWithSource } from "@/components/shared/DurationPicker";
import StartPokePicker from "@/components/shared/StartPokePicker";
import { formatReminder, scheduleReminder, cancelReminder } from "@/lib/notifications";
import { getStartPokeStatus, formatPokeTime, getDuration, getStepDurationSum } from "@/lib/start-poke-utils";
import { StartPokeSettings } from "@/lib/notification-types";
import { RecurringInstance } from "@/lib/recurring-types";
import { getImportanceLabel, getEnergyTypeLabel, getTaskPriorityInfo } from "@/lib/priority";
import ReadOnlyInfoPopover from "@/components/shared/ReadOnlyInfoPopover";

/**
 * Format time in compact 12-hour format (e.g., "2pm", "2:30pm", "10am")
 */
function formatCompactTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;
  return minutes === 0 ? `${hour12}${suffix}` : `${hour12}:${String(minutes).padStart(2, '0')}${suffix}`;
}

interface DetailsSectionProps {
  task: Task;
  queue: FocusQueue;
  queueItem: FocusQueueItem | undefined;
  projects: Project[];
  userSettings: UserSettings;
  mode: "executing" | "managing";
  currentInstance: RecurringInstance | null;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onOpenProjectModal: (project?: Project) => void;
  onOpenProjectModalWithCallback?: (callback: (projectId: string) => void) => void;
  onToggleMode?: () => void;
  /** Initial expanded state */
  defaultExpanded?: boolean;
  /** Completed steps toggle state (lifted from parent) */
  completedStepsExpanded: boolean;
  onToggleCompletedSteps: () => void;
  // Centralized drawer management
  activeDrawer?: DrawerType;
  onOpenDrawer?: (drawer: DrawerType) => void;
  onCloseDrawer?: () => void;
}

/**
 * Refactored Details Section with:
 * - Collapsed: Pills row + Priority display + chevron (same row)
 * - Expanded: "Details" label + Priority + chevron, then sections below
 * - Sections: Basics (Project, Recurring), Timing, Levels, Reminders
 *
 * Phase 0: UI structure only, placeholder fields for importance/energy/lead time
 */
export default function DetailsSection({
  task,
  queue,
  queueItem,
  projects,
  userSettings,
  mode,
  currentInstance,
  onUpdateTask,
  onOpenProjectModal,
  onOpenProjectModalWithCallback,
  onToggleMode,
  defaultExpanded = false,
  completedStepsExpanded,
  onToggleCompletedSteps,
  activeDrawer,
  onOpenDrawer,
  onCloseDrawer,
}: DetailsSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showPatternModalLocal, setShowPatternModalLocal] = useState(false);
  const [showPriorityModalLocal, setShowPriorityModalLocal] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Pattern modal - use centralized drawer state if available, otherwise local
  const isPatternOpen = activeDrawer === 'pattern' || showPatternModalLocal;
  const setShowPatternModal = (show: boolean) => {
    if (onOpenDrawer && onCloseDrawer) {
      if (show) {
        onOpenDrawer('pattern');
      } else {
        onCloseDrawer();
      }
    } else {
      setShowPatternModalLocal(show);
    }
  };

  // Priority modal - use centralized drawer state if available, otherwise local
  const isPriorityOpen = activeDrawer === 'priority' || showPriorityModalLocal;
  const setShowPriorityModal = (show: boolean) => {
    if (onOpenDrawer && onCloseDrawer) {
      if (show) {
        onOpenDrawer('priority');
      } else {
        onCloseDrawer();
      }
    } else {
      setShowPriorityModalLocal(show);
    }
  };

  // Importance picker state (simple local state - no drawer delegation)
  const [showImportancePicker, setShowImportancePicker] = useState(false);

  // Energy type picker state (simple local state - no drawer delegation)
  const [showEnergyPicker, setShowEnergyPicker] = useState(false);

  // Lead time picker state (simple local state - no drawer delegation)
  const [showLeadTimePicker, setShowLeadTimePicker] = useState(false);

  // Date pickers state
  const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showStartPokePicker, setShowStartPokePicker] = useState(false);

  // Collapsed pill quick-edit state
  type CollapsedPickerType = 'target' | 'deadline' | 'reminder' | 'duration' | 'startPoke' | 'project' | 'readOnly' | null;
  const [activeCollapsedPicker, setActiveCollapsedPicker] = useState<CollapsedPickerType>(null);
  const collapsedPillRef = useRef<HTMLDivElement>(null);

  // Refs for positioning anchored pickers
  const targetDateRef = useRef<HTMLDivElement>(null);
  const deadlineRef = useRef<HTMLDivElement>(null);
  const reminderRef = useRef<HTMLDivElement>(null);
  const importanceRef = useRef<HTMLDivElement>(null);
  const energyRef = useRef<HTMLDivElement>(null);
  const leadTimeRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);
  const startPokeRef = useRef<HTMLDivElement>(null);

  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(typeof window !== "undefined" && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isRecurring = task.isRecurring;
  const isReadOnly = isRecurring && mode === "executing";
  const isTemplate = isRecurring && mode === "managing";

  // Close project dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get recurrence pattern for display
  const recurrencePattern = task.recurrence as RecurrenceRuleExtended | null;
  const patternDescription = recurrencePattern ? describePattern(recurrencePattern) : null;

  // Get Start Poke settings
  const pokeSettings: StartPokeSettings = {
    startPokeEnabled: userSettings.startPokeEnabled,
    startPokeDefault: userSettings.startPokeDefault,
    startPokeBufferMinutes: userSettings.startPokeBufferMinutes,
    startPokeBufferPercentage: userSettings.startPokeBufferPercentage,
  };
  const pokeStatus = getStartPokeStatus(task, pokeSettings);

  // Calculate duration from steps or manual
  const durationResult = getDuration(task);
  const duration = durationResult.minutes;

  // Calculate progress for StatusModule
  const steps = isRecurring && currentInstance ? currentInstance.steps : task.steps;
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const hasCompletedSteps = completedCount > 0;
  const todayStepIds = queueItem?.selectedStepIds || [];
  const isInQueue = !!queueItem;

  // Calculate priority using actual priority scoring system
  const priorityInfo = useMemo(() => getTaskPriorityInfo(task), [task]);
  const priorityTier = priorityInfo.tier;

  // Build collapsed pills
  const getCollapsedPills = () => {
    const pills: Array<{
      icon?: React.ReactNode;
      label: string;
      variant: "filled" | "empty" | "locked";
      projectColor?: string;
      pickerType?: CollapsedPickerType;
    }> = [];

    if (isRecurring) {
      // Recurring: Show pattern, reminder, start poke
      if (patternDescription) {
        pills.push({
          icon: <Repeat />,
          label: patternDescription + (task.recurrence?.rolloverIfMissed ? " · Persists" : ""),
          variant: isReadOnly ? "locked" : "filled",
          pickerType: isReadOnly ? 'readOnly' : undefined,
        });
      }
      if (task.reminder) {
        pills.push({
          icon: <Bell />,
          label: formatReminder(task.reminder, task.targetDate, task.deadlineDate),
          variant: isReadOnly ? "locked" : "filled",
          pickerType: isReadOnly ? 'readOnly' : 'reminder',
        });
      }
      if (pokeStatus.enabled && pokeStatus.nudgeTime !== null) {
        pills.push({
          icon: "👉",
          label: `Start at ${formatPokeTime(pokeStatus.nudgeTime)}`,
          variant: isReadOnly ? "locked" : "filled",
          pickerType: isReadOnly ? 'readOnly' : 'startPoke',
        });
      }
      // Duration pill for recurring
      if (task.estimatedDurationMinutes) {
        pills.push({
          icon: <Timer />,
          label: formatDurationWithSource(task.estimatedDurationMinutes, task.estimatedDurationSource),
          variant: isReadOnly ? "locked" : "filled",
          pickerType: isReadOnly ? 'readOnly' : 'duration',
        });
      }
      // Levels: importance, energy (show if set)
      if (task.importance) {
        pills.push({
          icon: <Star />,
          label: getImportanceLabel(task.importance),
          variant: isReadOnly ? "locked" : "filled",
        });
      }
      if (task.energyType) {
        pills.push({
          icon: <Zap />,
          label: getEnergyTypeLabel(task.energyType),
          variant: isReadOnly ? "locked" : "filled",
        });
      }
    } else {
      // One-off: Status, dates, project, etc.
      const displayStatus = getDisplayStatus(task, queueItem, queue.todayLineIndex);
      const statusInfo = getStatusInfo(displayStatus);
      pills.push({
        label: statusInfo.label,
        variant: "filled",
        // Status pill just expands
      });

      if (task.targetDate) {
        pills.push({
          icon: <Calendar />,
          label: `Target ${formatDate(task.targetDate)}${task.targetTime ? ` ${formatCompactTime(task.targetTime)}` : ""}`,
          variant: "filled",
          pickerType: 'target',
        });
      } else {
        pills.push({
          icon: <Plus />,
          label: "Set timing",
          variant: "empty",
          pickerType: 'target',
        });
      }

      if (task.deadlineDate) {
        const overdue = isDateOverdue(task.deadlineDate);
        pills.push({
          icon: overdue ? "⚠️" : <Target />,
          label: `Due ${formatDate(task.deadlineDate)}${task.deadlineTime ? ` ${formatCompactTime(task.deadlineTime)}` : ""}`,
          variant: "filled",
          pickerType: 'deadline',
        });
      }

      // Reminder pill (show if set)
      if (task.reminder) {
        pills.push({
          icon: <Bell />,
          label: formatReminder(task.reminder, task.targetDate, task.deadlineDate),
          variant: "filled",
          pickerType: 'reminder',
        });
      }

      // Duration pill (show if set)
      if (task.estimatedDurationMinutes) {
        pills.push({
          icon: <Timer />,
          label: formatDurationWithSource(task.estimatedDurationMinutes, task.estimatedDurationSource),
          variant: "filled",
          pickerType: 'duration',
        });
      }

      if (pokeStatus.enabled && pokeStatus.nudgeTime !== null) {
        pills.push({
          icon: "👉",
          label: `Start at ${formatPokeTime(pokeStatus.nudgeTime)}`,
          variant: "filled",
          pickerType: 'startPoke',
        });
      }

      // Levels: importance, energy, lead time (show if set)
      if (task.importance) {
        pills.push({
          icon: <Star />,
          label: getImportanceLabel(task.importance),
          variant: "filled",
        });
      }
      if (task.energyType) {
        pills.push({
          icon: <Zap />,
          label: getEnergyTypeLabel(task.energyType),
          variant: "filled",
        });
      }
      if (task.leadTimeDays) {
        pills.push({
          icon: <Clock />,
          label: `${task.leadTimeDays}d lead`,
          variant: "filled",
        });
      }

      const project = projects.find((p) => p.id === task.projectId);
      if (project) {
        pills.push({
          label: project.name,
          projectColor: project.color || undefined,
          variant: "filled",
          pickerType: 'project',
        });
      }

      // Origin pill for deferred tasks
      if (task.deferredFrom) {
        const originLabel = task.deferredFrom === 'focus' ? 'From Focus' : 'From Ready';
        pills.push({
          label: originLabel,
          variant: "filled",
        });
      }
    }

    return pills;
  };

  const collapsedPills = getCollapsedPills();

  // Should show StatusModule
  const showStatusModule =
    task.status !== "inbox" &&
    mode !== "managing" &&
    (isRecurring ||
      (totalCount > 0 && completedCount > 0) ||
      (totalCount === 0 && task.status === "complete"));

  return (
    <div className="mb-6">
      {/* Unified Status/Details Container */}
      <div className={`px-4 ${showStatusModule ? 'py-3' : 'py-2.5'} bg-bg-glass-card backdrop-blur-lg border border-border-color-glass shadow-xl shadow-black/10 dark:shadow-black/30 rounded-2xl`}>
        {/* Status Module - shown when applicable */}
        {showStatusModule && (
          <StatusModule
            task={task}
            currentInstance={currentInstance}
            completedCount={completedCount}
            totalCount={totalCount}
            hasCompletedSteps={hasCompletedSteps}
            completedStepsExpanded={completedStepsExpanded}
            onToggleCompletedSteps={onToggleCompletedSteps}
            isInQueue={isInQueue}
            todayStepIds={todayStepIds}
            mode={mode}
            onToggleMode={onToggleMode}
          />
        )}

        {/* Divider when StatusModule renders */}
        {showStatusModule && (
          <div className="my-3 border-t border-border-color-neutral-subtle" />
        )}

        {/* Fixed header row with priority - always visible, never moves */}
        {/* When collapsed, entire row is tappable to expand */}
        <div
          className={`flex items-start justify-between ${!expanded ? 'cursor-pointer' : ''}`}
          onClick={() => { if (!expanded) setExpanded(true); }}
        >
          {/* Left side: collapsed pills OR expanded label */}
          <div className="flex-1 min-w-0 mr-3 min-h-[26px] relative flex items-center">
            {/* COLLAPSED: Pills - read-only, row handles tap to expand */}
            <div
              className={`flex flex-wrap gap-1.5 items-center transition-opacity duration-200 ${
                !expanded ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"
              }`}
            >
              {collapsedPills.map((pill, idx) => (
                <DetailsPill
                  key={idx}
                  icon={pill.icon}
                  label={pill.label}
                  variant={pill.variant === "locked" ? "filled" : pill.variant}
                  size="sm"
                  projectColor={pill.projectColor}
                />
              ))}
            </div>

            {/* EXPANDED: "DETAILS" label - tappable to collapse */}
            <button
              onClick={() => setExpanded(false)}
              className={`absolute inset-0 flex items-center group transition-opacity duration-200 ${
                expanded ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-neutral-soft group-hover:text-fg-neutral-secondary transition-colors">
                Details
              </h3>
            </button>
          </div>

          {/* Right side: Priority + Chevron - aligned with first row */}
          <div className="flex-shrink-0 h-[26px] flex items-center">
            <PriorityDisplay
              tier={priorityTier}
              onPress={() => setShowPriorityModal(true)}
              chevronUp={expanded}
              showChevron={true}
              onChevronPress={() => setExpanded(!expanded)}
            />
          </div>
        </div>

        {/* Expandable content area - only content below header animates */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            {/* BASICS SECTION (no label) */}
            <div className="space-y-4 mb-6 mt-6">
              {/* Project - iOS Settings style row */}
              {isReadOnly ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-fg-neutral-primary">
                    Project
                  </span>
                  <div className="flex items-center gap-2 text-fg-neutral-secondary">
                    <span className="text-sm">
                      {projects.find((p) => p.id === task.projectId)?.name || "No project"}
                    </span>
                    <Lock className="w-4 h-4 text-fg-neutral-soft flex-shrink-0" />
                  </div>
                </div>
              ) : (
                <div ref={projectDropdownRef} className="relative">
                  <button
                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    className="w-full flex items-center justify-between group"
                  >
                    <span className="text-sm font-medium text-fg-neutral-primary">
                      Project
                    </span>
                    <div className="flex items-center gap-1.5">
                      {task.projectId ? (
                        <>
                          {projects.find((p) => p.id === task.projectId)?.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  projects.find((p) => p.id === task.projectId)?.color ||
                                  undefined,
                              }}
                            />
                          )}
                          <span className="text-sm text-fg-neutral-secondary">
                            {projects.find((p) => p.id === task.projectId)?.name ||
                              "Unknown project"}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-fg-neutral-soft">None</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-fg-neutral-soft group-hover:text-fg-neutral-secondary" />
                    </div>
                  </button>

                  {showProjectDropdown && (
                    <div className="absolute z-50 top-full right-0 mt-1 w-56 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg overflow-hidden">
                      <button
                        onClick={() => {
                          onUpdateTask(task.id, { projectId: null });
                          setShowProjectDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-bg-neutral-subtle-hover flex items-center justify-between text-fg-neutral-secondary"
                      >
                        <span>No project</span>
                        {!task.projectId && <Check className="w-4 h-4 text-fg-accent-primary" />}
                      </button>
                      {projects
                        .filter((p) => p.status === "active")
                        .map((project) => (
                          <button
                            key={project.id}
                            onClick={() => {
                              onUpdateTask(task.id, { projectId: project.id });
                              setShowProjectDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-bg-neutral-subtle-hover flex items-center justify-between text-fg-neutral-primary"
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
                            {task.projectId === project.id && (
                              <Check className="w-4 h-4 text-fg-accent-primary flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      <div className="border-t border-border-color-neutral" />
                      <button
                        onClick={() => {
                          setShowProjectDropdown(false);
                          if (onOpenProjectModalWithCallback) {
                            onOpenProjectModalWithCallback((newProjectId) => {
                              onUpdateTask(task.id, { projectId: newProjectId });
                            });
                          } else {
                            onOpenProjectModal();
                          }
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-bg-neutral-subtle-hover flex items-center gap-2 text-fg-accent-secondary"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add new project...</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Recurring Toggle - hide in executing mode */}
              {!(isRecurring && mode === "executing") && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm font-medium text-fg-neutral-primary">
                    Recurring
                  </span>
                  <button
                    onClick={() => {
                      if (task.isRecurring) {
                        onUpdateTask(task.id, {
                          isRecurring: false,
                          recurrence: null,
                        });
                      } else {
                        onUpdateTask(task.id, {
                          isRecurring: true,
                          status: 'pool',  // Move out of inbox into routines
                          recurrence: {
                            frequency: "weekly",
                            interval: 1,
                            daysOfWeek: [new Date().getDay()],
                            weekOfMonth: null,
                            dayOfMonth: null,
                            time: "09:00",
                            endDate: null,
                            endAfter: null,
                            rolloverIfMissed: true,
                            maxOverdueDays: 3,
                            pausedAt: null,
                            pausedUntil: null,
                          },
                        });
                        // Switch to managing mode when turning on recurring
                        if (onToggleMode && mode === "executing") {
                          onToggleMode();
                        }
                      }
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      task.isRecurring
                        ? "bg-bg-accent-high"
                        : "bg-bg-neutral-low"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        task.isRecurring ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* TIMING SECTION */}
            <div className="mb-6">
              {/* Desktop: label left, pills right. Mobile: stacked */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex-shrink-0">
                  <h4 className="text-sm font-medium text-fg-neutral-primary">
                    Timing
                  </h4>
                  {isReadOnly && (
                    <p className="text-xs text-fg-neutral-soft mt-0.5">
                      Edit routine template to change
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {isRecurring ? (
                    // Recurring: Pattern, Duration, Start Poke
                    <>
                      <DetailsPill
                        icon={<Repeat />}
                        label={(patternDescription || "Set pattern") + (task.recurrence?.rolloverIfMissed ? " · Persists" : "")}
                        variant={isReadOnly ? "locked" : patternDescription ? "filled" : "empty"}
                        size="md"
                        onPress={isReadOnly ? undefined : () => setShowPatternModal(true)}
                      />
                      <div ref={durationRef}>
                        <DetailsPill
                          icon={<Timer />}
                          label={formatDurationWithSource(task.estimatedDurationMinutes, task.estimatedDurationSource)}
                          variant={isReadOnly ? "locked" : task.estimatedDurationMinutes ? "filled" : "empty"}
                          size="md"
                          onPress={isReadOnly ? undefined : () => setShowDurationPicker(true)}
                        />
                      </div>
                      <div ref={startPokeRef}>
                        <DetailsPill
                          icon="👉"
                          label={pokeStatus.enabled && pokeStatus.nudgeTime !== null ? `Start at ${formatPokeTime(pokeStatus.nudgeTime)}` : "Start time poke"}
                          variant={isReadOnly ? "locked" : pokeStatus.enabled ? "filled" : "empty"}
                          size="md"
                          onPress={isReadOnly ? undefined : () => setShowStartPokePicker(true)}
                        />
                      </div>
                    </>
                  ) : (
                    // One-off: Target, Deadline, Lead time (placeholder), Duration, Start Poke
                    <>
                      <div ref={targetDateRef} className="relative">
                        <DetailsPill
                          icon={<Calendar />}
                          label={task.targetDate ? formatDate(task.targetDate) + (task.targetTime ? ` ${task.targetTime}` : "") : "Set target"}
                          variant={task.targetDate ? "filled" : "empty"}
                          size="md"
                          onPress={() => setShowTargetDatePicker(true)}
                          onClear={task.targetDate ? () => onUpdateTask(task.id, { targetDate: null, targetTime: null }) : undefined}
                        />
                        {showTargetDatePicker && (
                          <DatePickerDropdown
                            value={task.targetDate}
                            time={task.targetTime}
                            onChange={(date, time) => {
                              onUpdateTask(task.id, { targetDate: date, targetTime: time || null });
                              setShowTargetDatePicker(false);
                            }}
                            onClose={() => setShowTargetDatePicker(false)}
                            label="Target Date"
                            showTime={true}
                            triggerRef={targetDateRef}
                            isMobileView={isMobileView}
                          />
                        )}
                      </div>
                      <div ref={deadlineRef} className="relative">
                        <DetailsPill
                          icon={<Target />}
                          label={task.deadlineDate ? `Due ${formatDate(task.deadlineDate)}${task.deadlineTime ? ` ${task.deadlineTime}` : ""}` : "Add deadline"}
                          variant={task.deadlineDate ? "filled" : "empty"}
                          size="md"
                          onPress={() => setShowDeadlinePicker(true)}
                          onClear={task.deadlineDate ? () => onUpdateTask(task.id, { deadlineDate: null, deadlineTime: null }) : undefined}
                        />
                        {showDeadlinePicker && (
                          <DatePickerDropdown
                            value={task.deadlineDate}
                            time={task.deadlineTime}
                            onChange={(date, time) => {
                              onUpdateTask(task.id, { deadlineDate: date, deadlineTime: time || null });
                              setShowDeadlinePicker(false);
                            }}
                            onClose={() => setShowDeadlinePicker(false)}
                            label="Deadline"
                            showTime={true}
                            triggerRef={deadlineRef}
                            isMobileView={isMobileView}
                          />
                        )}
                      </div>
                      {/* Lead time */}
                      <div ref={leadTimeRef}>
                        <DetailsPill
                          icon={<Clock />}
                          label={task.leadTimeDays ? `${task.leadTimeDays}d lead` : "Lead time"}
                          variant={task.leadTimeDays ? "filled" : "empty"}
                          size="md"
                          onPress={() => setShowLeadTimePicker(true)}
                        />
                      </div>
                      <div ref={durationRef}>
                        <DetailsPill
                          icon={<Timer />}
                          label={formatDurationWithSource(task.estimatedDurationMinutes, task.estimatedDurationSource)}
                          variant={task.estimatedDurationMinutes ? "filled" : "empty"}
                          size="md"
                          onPress={() => setShowDurationPicker(true)}
                        />
                      </div>
                      <div ref={startPokeRef}>
                        <DetailsPill
                          icon="👉"
                          label={pokeStatus.enabled && pokeStatus.nudgeTime !== null ? `Start at ${formatPokeTime(pokeStatus.nudgeTime)}` : "Start time poke"}
                          variant={pokeStatus.enabled ? "filled" : "empty"}
                          size="md"
                          onPress={() => setShowStartPokePicker(true)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* LEVELS SECTION (placeholders for Phase 1) */}
            <div className={isTemplate ? "pb-2" : "mb-6"}>
              {/* Desktop: label left, pills right. Mobile: stacked */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex-shrink-0">
                  <h4 className="text-sm font-medium text-fg-neutral-primary">
                    Levels
                  </h4>
                  {isReadOnly && (
                    <p className="text-xs text-fg-neutral-soft mt-0.5">
                      Edit routine template to change
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <div ref={importanceRef} className="relative">
                    <DetailsPill
                      icon={<Star />}
                      label={task.importance ? getImportanceLabel(task.importance) : "Set importance"}
                      variant={isReadOnly ? "locked" : task.importance ? "filled" : "empty"}
                      size="md"
                      onPress={isReadOnly ? undefined : () => setShowImportancePicker(true)}
                    />
                    <ImportancePicker
                      isOpen={showImportancePicker}
                      onClose={() => setShowImportancePicker(false)}
                      value={task.importance}
                      onChange={(value) => onUpdateTask(task.id, { importance: value, importanceSource: 'self' })}
                      triggerRef={importanceRef}
                    />
                  </div>
                  <div ref={energyRef} className="relative">
                    <DetailsPill
                      icon={<Zap />}
                      label={task.energyType ? getEnergyTypeLabel(task.energyType) : "Set energy"}
                      variant={isReadOnly ? "locked" : task.energyType ? "filled" : "empty"}
                      size="md"
                      onPress={isReadOnly ? undefined : () => setShowEnergyPicker(true)}
                    />
                    <EnergyTypePicker
                      isOpen={showEnergyPicker}
                      onClose={() => setShowEnergyPicker(false)}
                      value={task.energyType}
                      onChange={(value) => onUpdateTask(task.id, { energyType: value })}
                      triggerRef={energyRef}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* REMINDERS SECTION - hide for templates */}
            {!isTemplate && (
              <div className="pb-2">
                {/* Desktop: label left, pills right. Mobile: stacked */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h4 className="text-sm font-medium text-fg-neutral-primary flex-shrink-0">
                    Reminders
                  </h4>
                  <div ref={reminderRef} className="relative flex flex-wrap gap-2 items-center md:justify-end">
                    {task.reminder ? (
                      <DetailsPill
                        icon={<Bell />}
                        label={formatReminder(task.reminder, task.targetDate, task.deadlineDate)}
                        variant="filled"
                        size="md"
                        onPress={() => setShowReminderPicker(true)}
                        onClear={() => {
                          cancelReminder(task.id);
                          onUpdateTask(task.id, { reminder: null });
                        }}
                      />
                    ) : (
                      <DetailsPill
                        icon={<Plus />}
                        label="Add reminder"
                        variant="empty"
                        size="md"
                        onPress={() => setShowReminderPicker(true)}
                      />
                    )}
                    {showReminderPicker && (
                      <ReminderPicker
                        reminder={task.reminder}
                        targetDate={task.targetDate}
                        deadlineDate={task.deadlineDate}
                        onChange={(reminder) => {
                          onUpdateTask(task.id, { reminder });
                          if (reminder) {
                            scheduleReminder(task.id, task.title, reminder, task.targetDate, task.deadlineDate);
                          }
                        }}
                        onClose={() => setShowReminderPicker(false)}
                        triggerRef={reminderRef}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pattern Modal for recurring tasks - BottomSheet on mobile, centered modal on desktop */}
      {isPatternOpen && recurrencePattern && (
        isMobileView ? (
          <BottomSheet
            isOpen={true}
            onClose={() => setShowPatternModal(false)}
            height="auto"
            zIndex={80}
          >
            {/* Header - matches main navbar (no bottom border) */}
            <div className="h-14 flex items-center justify-between px-2">
              <div className="px-2">
                <h3 className="text-base font-medium text-fg-neutral-primary">
                  Edit Pattern
                </h3>
              </div>
              <button
                onClick={() => setShowPatternModal(false)}
                className="p-2.5 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-fg-neutral-secondary" />
              </button>
            </div>
            {/* Content */}
            <div className="px-4 py-3 overflow-y-auto">
              <RecurrenceFields
                rule={recurrencePattern}
                onChange={(newPattern) => {
                  onUpdateTask(task.id, { recurrence: newPattern });
                }}
              />
            </div>
          </BottomSheet>
        ) : (
          <RightDrawer
            isOpen={true}
            onClose={() => setShowPatternModal(false)}
            width="400px"
            zIndex={80}
          >
            <div className="flex flex-col h-full">
              {/* Header - matches main navbar (no bottom border) */}
              <div className="h-14 flex items-center justify-between px-2 shrink-0">
                <div className="px-2">
                  <h3 className="text-base font-medium text-fg-neutral-primary">
                    Edit Pattern
                  </h3>
                </div>
                <button
                  onClick={() => setShowPatternModal(false)}
                  className="p-2.5 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-fg-neutral-secondary" />
                </button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <RecurrenceFields
                  rule={recurrencePattern}
                  onChange={(newPattern) => {
                    onUpdateTask(task.id, { recurrence: newPattern });
                  }}
                />
              </div>
            </div>
          </RightDrawer>
        )
      )}

      {/* Priority Breakdown Drawer */}
      <PriorityBreakdownDrawer
        isOpen={isPriorityOpen}
        onClose={() => setShowPriorityModal(false)}
        task={task}
        isMobileView={isMobileView}
      />

      {/* Lead Time Picker */}
      <LeadTimePicker
        isOpen={showLeadTimePicker}
        onClose={() => setShowLeadTimePicker(false)}
        value={task.leadTimeDays}
        onChange={(value) => onUpdateTask(task.id, { leadTimeDays: value, leadTimeSource: 'manual' })}
        deadlineDate={task.deadlineDate}
        triggerRef={leadTimeRef}
      />

      {/* Duration Picker */}
      <DurationPicker
        isOpen={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        value={task.estimatedDurationMinutes}
        source={task.estimatedDurationSource}
        onChange={(minutes, source) => onUpdateTask(task.id, { estimatedDurationMinutes: minutes, estimatedDurationSource: source })}
        triggerRef={durationRef}
        calculatedDefault={getStepDurationSum(task.steps) || null}
      />

      {/* Start Poke Picker */}
      <StartPokePicker
        isOpen={showStartPokePicker}
        onClose={() => setShowStartPokePicker(false)}
        value={task.startPokeOverride}
        onChange={(value) => onUpdateTask(task.id, { startPokeOverride: value })}
        calculatedNudgeTime={pokeStatus.nudgeTime !== null ? formatPokeTime(pokeStatus.nudgeTime) : null}
        hasRequiredData={!!(task.targetDate || (isRecurring && recurrencePattern?.time)) && !!duration}
        missingDataMessage={!duration ? "Set duration first" : "Set target date first"}
        triggerRef={startPokeRef}
      />

      {/* Collapsed pill quick-edit pickers */}
      {activeCollapsedPicker === 'target' && (
        <DatePickerDropdown
          value={task.targetDate}
          time={task.targetTime}
          onChange={(date, time) => {
            onUpdateTask(task.id, { targetDate: date, targetTime: time || null });
            setActiveCollapsedPicker(null);
          }}
          onClose={() => setActiveCollapsedPicker(null)}
          label="Target Date"
          showTime={true}
          triggerRef={collapsedPillRef}
          isMobileView={isMobileView}
        />
      )}

      {activeCollapsedPicker === 'deadline' && (
        <DatePickerDropdown
          value={task.deadlineDate}
          time={task.deadlineTime}
          onChange={(date, time) => {
            onUpdateTask(task.id, { deadlineDate: date, deadlineTime: time || null });
            setActiveCollapsedPicker(null);
          }}
          onClose={() => setActiveCollapsedPicker(null)}
          label="Deadline"
          showTime={true}
          triggerRef={collapsedPillRef}
          isMobileView={isMobileView}
        />
      )}

      {activeCollapsedPicker === 'reminder' && (
        <ReminderPicker
          reminder={task.reminder}
          targetDate={task.targetDate}
          deadlineDate={task.deadlineDate}
          onChange={(reminder) => {
            onUpdateTask(task.id, { reminder });
            if (reminder) {
              scheduleReminder(task.id, task.title, reminder, task.targetDate, task.deadlineDate);
            }
            setActiveCollapsedPicker(null);
          }}
          onClose={() => setActiveCollapsedPicker(null)}
          triggerRef={collapsedPillRef}
        />
      )}

      {activeCollapsedPicker === 'duration' && (
        <DurationPicker
          isOpen={true}
          onClose={() => setActiveCollapsedPicker(null)}
          value={task.estimatedDurationMinutes}
          source={task.estimatedDurationSource}
          onChange={(minutes, source) => {
            onUpdateTask(task.id, { estimatedDurationMinutes: minutes, estimatedDurationSource: source });
            setActiveCollapsedPicker(null);
          }}
          triggerRef={collapsedPillRef}
          calculatedDefault={getStepDurationSum(task.steps) || null}
        />
      )}

      {activeCollapsedPicker === 'startPoke' && (
        <StartPokePicker
          isOpen={true}
          onClose={() => setActiveCollapsedPicker(null)}
          value={task.startPokeOverride}
          onChange={(value) => {
            onUpdateTask(task.id, { startPokeOverride: value });
            setActiveCollapsedPicker(null);
          }}
          calculatedNudgeTime={pokeStatus.nudgeTime !== null ? formatPokeTime(pokeStatus.nudgeTime) : null}
          hasRequiredData={!!(task.targetDate || (isRecurring && recurrencePattern?.time)) && !!duration}
          missingDataMessage={!duration ? "Set duration first" : "Set target date first"}
          triggerRef={collapsedPillRef}
        />
      )}

      {activeCollapsedPicker === 'project' && (
        <CollapsedProjectPicker
          isOpen={true}
          onClose={() => setActiveCollapsedPicker(null)}
          projects={projects}
          currentProjectId={task.projectId}
          onSelect={(projectId) => {
            onUpdateTask(task.id, { projectId });
            setActiveCollapsedPicker(null);
          }}
          onCreateNew={() => {
            setActiveCollapsedPicker(null);
            if (onOpenProjectModalWithCallback) {
              onOpenProjectModalWithCallback((newProjectId) => {
                onUpdateTask(task.id, { projectId: newProjectId });
              });
            } else {
              onOpenProjectModal();
            }
          }}
          triggerRef={collapsedPillRef}
        />
      )}

      {activeCollapsedPicker === 'readOnly' && (
        <ReadOnlyInfoPopover
          isOpen={true}
          onClose={() => setActiveCollapsedPicker(null)}
          message="Edit routine template to change"
          onEditTemplate={onToggleMode}
          triggerRef={collapsedPillRef}
        />
      )}
    </div>
  );
}

/**
 * Inline date picker dropdown for target date and deadline
 * Uses portals on desktop, BottomSheet on mobile
 */
interface DatePickerDropdownProps {
  value: string | null;
  time?: string | null;
  onChange: (date: string | null, time?: string | null) => void;
  onClose: () => void;
  label: string;
  showTime?: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
  isMobileView?: boolean;
}

function DatePickerDropdown({ value, time, onChange, onClose, label, showTime = false, triggerRef, isMobileView = false }: DatePickerDropdownProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (value) return value;
    // Default: today
    return new Date().toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>(time || "");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position from trigger element (desktop only)
  useEffect(() => {
    if (!isMobileView && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [triggerRef, isMobileView]);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const quickOptions = [
    { label: "Today", value: today },
    { label: "Tomorrow", value: tomorrow },
    { label: "Next week", value: nextWeek },
    { label: "In a month", value: nextMonth },
  ];

  if (!mounted) return null;

  // Shared content for both mobile and desktop
  const pickerContent = (
    <>
      {/* Quick options */}
      <div className="space-y-1 mb-4">
        {quickOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value, selectedTime || null)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-bg-neutral-subtle rounded-lg transition-colors ${
              value === option.value ? "bg-bg-accent-subtle" : ""
            }`}
          >
            {option.label}
            {value === option.value && (
              <Check className="w-4 h-4 ml-auto text-fg-accent-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Date (and optional time) input */}
      <div className="border-t border-border-color-neutral pt-3">
        <label className="text-xs text-fg-neutral-secondary mb-2 block">
          Or pick a specific date{showTime ? " and time" : ""}
        </label>
        <div className="flex items-end gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <label className="text-xs text-fg-neutral-secondary mb-1 block">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-8 px-2 text-sm bg-bg-neutral-base border border-border-color-neutral rounded-lg appearance-none"
            />
          </div>
          {showTime && (
            <div className="flex-1 min-w-0">
              <label className="text-xs text-fg-neutral-secondary mb-1 block">Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full h-8 px-2 text-sm bg-bg-neutral-base border border-border-color-neutral rounded-lg appearance-none"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm font-medium text-fg-neutral-primary bg-bg-neutral-low hover:bg-bg-neutral-low-hover rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onChange(selectedDate, showTime ? selectedTime || null : undefined)}
            className="flex-1 px-3 py-2 text-sm font-medium text-fg-neutral-inverse-primary bg-bg-accent-high hover:bg-bg-accent-high-hover rounded-lg transition-colors"
          >
            Set {label.includes("Date") ? "Date" : label}
          </button>
        </div>
      </div>
    </>
  );

  // Mobile: BottomSheet
  if (isMobileView) {
    return (
      <BottomSheet isOpen={true} onClose={onClose} height="auto">
        <div className="px-4 pt-2 pb-4" style={{ paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom))' }}>
          <h3 className="text-base font-semibold text-fg-neutral-primary mb-4">
            {label}
          </h3>
          {pickerContent}
        </div>
      </BottomSheet>
    );
  }

  // Desktop: Portal dropdown
  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Picker dropdown */}
      <div
        className="fixed w-72 bg-bg-neutral-min border border-border-color-neutral rounded-xl shadow-lg z-50 p-4"
        style={{ top: position.top, left: position.left }}
      >
        <h3 className="text-sm font-semibold text-fg-neutral-primary mb-3">
          {label}
        </h3>
        {pickerContent}
      </div>
    </>,
    document.body
  );
}

/**
 * Project picker dropdown for collapsed pill quick-edit
 * Uses portals to escape overflow-hidden containers
 */
interface CollapsedProjectPickerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProjectId: string | null;
  onSelect: (projectId: string | null) => void;
  onCreateNew: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

function CollapsedProjectPicker({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onSelect,
  onCreateNew,
  triggerRef,
}: CollapsedProjectPickerProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position from trigger element
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 224; // w-56 = 14rem = 224px

      // Position below the trigger
      let left = rect.left;

      // Ensure dropdown stays within viewport
      const viewportWidth = window.innerWidth;
      if (left + dropdownWidth > viewportWidth - 8) {
        left = viewportWidth - dropdownWidth - 8;
      }
      if (left < 8) left = 8;

      setPosition({
        top: rect.bottom + 8,
        left,
      });
    }
  }, [isOpen, triggerRef]);

  if (!mounted || !isOpen) return null;

  const activeProjects = projects.filter((p) => p.status === "active");

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div
        className="fixed w-56 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg z-50 overflow-hidden"
        style={{ top: position.top, left: position.left }}
      >
        <button
          onClick={() => onSelect(null)}
          className="w-full px-3 py-2 text-sm text-left hover:bg-bg-neutral-subtle-hover flex items-center justify-between text-fg-neutral-secondary"
        >
          <span>No project</span>
          {!currentProjectId && <Check className="w-4 h-4 text-fg-accent-primary" />}
        </button>
        {activeProjects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelect(project.id)}
            className="w-full px-3 py-2 text-sm text-left hover:bg-bg-neutral-subtle-hover flex items-center justify-between text-fg-neutral-primary"
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
            {currentProjectId === project.id && (
              <Check className="w-4 h-4 text-fg-accent-primary flex-shrink-0" />
            )}
          </button>
        ))}
        <div className="border-t border-border-color-neutral" />
        <button
          onClick={onCreateNew}
          className="w-full px-3 py-2 text-sm text-left hover:bg-bg-neutral-subtle-hover flex items-center gap-2 text-fg-accent-secondary"
        >
          <Plus className="w-4 h-4" />
          <span>Add new project...</span>
        </button>
      </div>
    </>,
    document.body
  );
}
