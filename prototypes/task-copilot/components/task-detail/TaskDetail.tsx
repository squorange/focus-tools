"use client";

import { useState } from "react";
import { Task, Step, SuggestedStep, EditSuggestion, DeletionSuggestion, FocusQueue, Project, createStep } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import StagingArea from "@/components/StagingArea";
import NotesModule from "@/components/NotesModule";

interface TaskDetailProps {
  task: Task;
  queue: FocusQueue;
  projects: Project[];
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  deletions: DeletionSuggestion[];
  suggestedTitle: string | null;
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
  onAddToQueue: (taskId: string, forToday?: boolean) => void;
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
}

// Get queue item for this task
function getQueueItem(task: Task, queue: FocusQueue) {
  return queue.items.find((i) => i.taskId === task.id && !i.completed);
}

// Format date for display
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TaskDetail({
  task,
  queue,
  projects,
  suggestions,
  edits,
  deletions,
  suggestedTitle,
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
}: TaskDetailProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(task.title);
  const [newStepText, setNewStepText] = useState("");
  const [showDeferMenu, setShowDeferMenu] = useState(false);

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Title + Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
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
                className="flex-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent border-b-2 border-violet-500 focus:outline-none resize-none overflow-hidden min-h-[1.75rem]"
                autoFocus
                rows={1}
              />
            ) : (
              <h1
                onClick={() => setEditingTitle(true)}
                className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 break-words line-clamp-3 sm:line-clamp-2 cursor-text hover:text-violet-600 dark:hover:text-violet-400"
              >
                {task.title || "Untitled Task"}
              </h1>
            )}
            {/* Status badge */}
            <span
              className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                task.status === 'inbox'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : task.status === 'pool'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : task.status === 'complete'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {task.status === 'inbox' ? 'Inbox' : task.status === 'pool' ? 'Ready' : task.status === 'complete' ? 'Done' : 'Archived'}
            </span>
          </div>
        </div>

        {/* Queue/Focus actions */}
        <div className="flex items-start gap-2 pt-0.5">
          {isInQueue ? (
            <button
              onClick={() => onStartFocus(queueItem!.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
            >
              Start Focus
            </button>
          ) : (
            <>
              {/* Move to Ready button for inbox tasks */}
              {task.status === "inbox" && (
                <button
                  onClick={() => onSendToPool(task.id)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                >
                  Move to Ready
                </button>
              )}
              <button
                onClick={() => onAddToQueue(task.id)}
                className="px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
              >
                Add to Focus
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {progress && progress.total > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {progress.completed} of {progress.total} steps complete
            </span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {Math.round((progress.completed / progress.total) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Staging Area for AI suggestions */}
      {(suggestions.length > 0 || edits.length > 0 || deletions.length > 0 || suggestedTitle) && (
        <div className="mb-6">
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
          />
        </div>
      )}

      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Steps section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
              Steps
            </h2>
            <button
              onClick={onAIBreakdown}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
              </svg>
              AI Breakdown
            </button>
          </div>

          {/* Steps list */}
          {task.steps.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
              <p className="mb-2">No steps yet</p>
              <p className="text-sm">Add steps below or use AI to break down this task</p>
            </div>
          ) : (
            <div className="space-y-2">
              {task.steps.map((step, index) => (
                <StepItem
                  key={step.id}
                  step={step}
                  index={index}
                  totalSteps={task.steps.length}
                  taskId={task.id}
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
                />
              ))}
            </div>
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

        {/* Metadata section */}
        <div className="space-y-4 pb-6">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
            Details
          </h2>

          {/* Priority */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Priority</span>
            <div className="flex gap-2">
              {(["high", "medium", "low"] as const).map((priority) => (
                <button
                  key={priority}
                  onClick={() => onUpdateTask(task.id, { priority })}
                  className={`
                    px-3 py-1 text-xs rounded-full capitalize transition-colors
                    ${
                      task.priority === priority
                        ? priority === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : priority === "medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                    }
                  `}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Project</span>
            <select
              value={task.projectId || ""}
              onChange={(e) => onUpdateTask(task.id, { projectId: e.target.value || null })}
              className="px-3 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">No project</option>
              {projects.filter(p => p.status === 'active').map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Date */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Target Date</span>
            <input
              type="date"
              value={task.targetDate || ""}
              onChange={(e) => onUpdateTask(task.id, { targetDate: e.target.value || null })}
              className="px-3 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Deadline */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Deadline</span>
            <input
              type="date"
              value={task.deadlineDate || ""}
              onChange={(e) => onUpdateTask(task.id, { deadlineDate: e.target.value || null })}
              className="px-3 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Waiting On */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Waiting On</span>
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
              className="px-3 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 w-40 text-right"
            />
          </div>
        </div>

        {/* Notes section */}
        <div className="mt-6">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-3">
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
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-3">
            Actions
          </h2>
          <div className="flex items-center gap-3">
            {/* Defer dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDeferMenu(!showDeferMenu)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Defer
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDeferMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDeferMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[140px]">
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
    </div>
  );
}

// Step Item Component
interface StepItemProps {
  step: Step;
  index: number;
  totalSteps: number;
  taskId: string;
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
}

function StepItem({ step, index, totalSteps, onToggleComplete, onSubstepComplete, onUpdateStep, onUpdateSubstep, onUpdateEstimate, onDelete, onMoveUp, onMoveDown, onAddSubstep, onDeleteSubstep, onMoveSubstepUp, onMoveSubstepDown, onStartFocus }: StepItemProps) {
  const [editingStep, setEditingStep] = useState(false);
  const [stepText, setStepText] = useState(step.text);
  const [editingSubstepId, setEditingSubstepId] = useState<string | null>(null);
  const [substepText, setSubstepText] = useState("");
  const [showStepMenu, setShowStepMenu] = useState(false);
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
      className={`
        group flex items-start gap-3 p-3 rounded-lg border transition-colors
        ${
          step.completed
            ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50"
            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700"
        }
      `}
    >
      {/* Checkbox */}
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
              setEditingStep(true);
              setStepText(step.text);
            }}
            className={`block min-h-[1.5rem] text-sm cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-700 px-1 -mx-1 rounded transition-colors ${
              step.completed
                ? "text-zinc-500 dark:text-zinc-400 line-through"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {step.text}
          </span>
        )}

        {/* Substeps */}
        {step.substeps.length > 0 && (
          <div className="mt-2 pl-2 space-y-1 border-l-2 border-zinc-200 dark:border-zinc-700">
            {step.substeps.map((substep, substepIndex) => (
              <div key={substep.id} className="flex items-center gap-2 group/substep">
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
                    className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
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
          <div className="mt-2 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
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

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        {/* Step actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowStepMenu(!showStepMenu)}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="Step options"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {showStepMenu && (
            <div className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 min-w-[140px]">
              <button
                onClick={() => { onMoveUp(); setShowStepMenu(false); }}
                disabled={isFirst}
                className="w-full px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Move Up
              </button>
              <button
                onClick={() => { onMoveDown(); setShowStepMenu(false); }}
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
                onClick={() => { setAddingSubstep(true); setShowStepMenu(false); }}
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
                  setShowStepMenu(false);
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
                onClick={() => { onDelete(); setShowStepMenu(false); }}
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
  );
}
