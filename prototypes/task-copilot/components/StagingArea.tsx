"use client";

import { useState, useEffect } from "react";
import { SuggestedStep, EditSuggestion, DeletionSuggestion } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

interface StagingAreaProps {
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  deletions: DeletionSuggestion[];
  suggestedTitle?: string | null;
  currentTitle?: string;
  onAcceptOne: (suggestion: SuggestedStep) => void;
  onAcceptEdit: (edit: EditSuggestion) => void;
  onRejectEdit: (edit: EditSuggestion) => void;
  onAcceptDeletion: (deletion: DeletionSuggestion) => void;
  onRejectDeletion: (deletion: DeletionSuggestion) => void;
  onAcceptTitle?: () => void;
  onRejectTitle?: () => void;
  onAcceptAll: () => void;
  onDismiss: () => void;
  defaultExpanded?: boolean;
  isNewArrival?: boolean;
  onAnimationComplete?: () => void;
  // Routine support
  isRoutine?: boolean;
  onAcceptWithScope?: (scope: 'instance' | 'template') => void;
}

export default function StagingArea({
  suggestions,
  edits,
  deletions,
  suggestedTitle,
  currentTitle,
  onAcceptOne,
  onAcceptEdit,
  onRejectEdit,
  onAcceptDeletion,
  onRejectDeletion,
  onAcceptTitle,
  onRejectTitle,
  onAcceptAll,
  onDismiss,
  defaultExpanded = true,
  isNewArrival = false,
  onAnimationComplete,
  isRoutine = false,
  onAcceptWithScope,
}: StagingAreaProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isPulsing, setIsPulsing] = useState(false);

  // Trigger pulse animation when new items arrive
  useEffect(() => {
    if (isNewArrival) {
      setIsPulsing(true);
      // Auto-expand when new items arrive
      setIsExpanded(true);
      // Stop pulsing after 3 cycles (~1.5s)
      const timer = setTimeout(() => {
        setIsPulsing(false);
        onAnimationComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isNewArrival, onAnimationComplete]);
  const safeEdits = edits || [];
  const safeSuggestions = suggestions || [];
  const safeDeletions = deletions || [];
  // More robust check - ensure suggestedTitle is truthy and different from current
  const hasTitleSuggestion = Boolean(suggestedTitle) && suggestedTitle !== (currentTitle || '');
  const totalItems = safeSuggestions.length + safeEdits.length + safeDeletions.length + (hasTitleSuggestion ? 1 : 0);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`
        bg-violet-50 dark:bg-violet-900/20 border rounded-lg overflow-hidden transition-all
        ${isPulsing
          ? 'border-violet-400 dark:border-violet-500 shadow-lg shadow-violet-200/50 dark:shadow-violet-900/30 animate-pulse-glow'
          : 'border-violet-200/60 dark:border-violet-700/40'}
      `}
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 p-4 hover:bg-violet-100/50 dark:hover:bg-violet-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span className="font-medium text-violet-800 dark:text-violet-300">
            Suggested Changes
          </span>
          <span className="text-sm text-violet-600 dark:text-violet-400">
            ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-violet-600 dark:text-violet-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Title suggestion */}
          {hasTitleSuggestion && (
            <div className="mb-3 py-2 px-3 bg-white dark:bg-neutral-800 rounded-lg border border-violet-300 dark:border-violet-600">
              <div className="flex items-start gap-3">
                {/* Title badge */}
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                  TITLE
                </span>

                {/* Content: old → new */}
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-400 dark:text-neutral-500 line-through text-sm">
                    {currentTitle}
                  </p>
                  <p className="text-neutral-700 dark:text-neutral-200 mt-1">
                    {suggestedTitle}
                  </p>
                </div>

                {/* Accept/Reject buttons */}
                <div className="flex-shrink-0 flex gap-1">
                  <button
                    onClick={onAcceptTitle}
                    className="px-2 py-1 text-sm font-medium
                               text-green-600 dark:text-green-400
                               hover:bg-green-50 dark:hover:bg-green-900/20
                               rounded transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={onRejectTitle}
                    className="px-2 py-1 text-sm font-medium
                               text-neutral-500 dark:text-neutral-400
                               hover:bg-neutral-100 dark:hover:bg-neutral-700
                               rounded transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit suggestions */}
          {safeEdits.length > 0 && (
            <ul className="space-y-2 mb-2">
              {safeEdits.map((edit) => (
                <li
                  key={`edit-${edit.targetId}`}
                  className="flex items-start gap-3 py-2 px-3 bg-white dark:bg-neutral-800 rounded-lg
                             border border-violet-300 dark:border-violet-600"
                >
                  {/* Edit badge */}
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    EDIT
                  </span>

                  {/* Step/substep indicator */}
                  <span className="w-6 text-sm font-medium text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                    {edit.targetId}.
                  </span>

                  {/* Content: old → new */}
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-400 dark:text-neutral-500 line-through">
                      {edit.originalText}
                    </p>
                    <p className="text-neutral-700 dark:text-neutral-200 mt-1">
                      {edit.newText}
                    </p>
                  </div>

                  {/* Accept/Reject buttons */}
                  <div className="flex-shrink-0 flex gap-1">
                    <button
                      onClick={() => onAcceptEdit(edit)}
                      className="px-2 py-1 text-sm font-medium
                                 text-green-600 dark:text-green-400
                                 hover:bg-green-50 dark:hover:bg-green-900/20
                                 rounded transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRejectEdit(edit)}
                      className="px-2 py-1 text-sm font-medium
                                 text-neutral-500 dark:text-neutral-400
                                 hover:bg-neutral-100 dark:hover:bg-neutral-700
                                 rounded transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Deletion suggestions */}
          {safeDeletions.length > 0 && (
            <ul className="space-y-2 mb-2">
              {safeDeletions.map((deletion) => (
                <li
                  key={`delete-${deletion.targetId}`}
                  className="flex items-start gap-3 py-2 px-3 bg-white dark:bg-neutral-800 rounded-lg
                             border border-violet-300 dark:border-violet-600"
                >
                  {/* Delete badge */}
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                    DELETE
                  </span>

                  {/* Step/substep indicator */}
                  <span className="w-8 text-sm font-medium text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                    {deletion.targetId}.
                  </span>

                  {/* Content: show the text being deleted + reason */}
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-700 dark:text-neutral-200 line-through">
                      {deletion.originalText || `Remove ${deletion.targetType}`}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 italic">
                      {deletion.reason}
                    </p>
                  </div>

                  {/* Accept/Reject buttons */}
                  <div className="flex-shrink-0 flex gap-1">
                    <button
                      onClick={() => onAcceptDeletion(deletion)}
                      className="px-2 py-1 text-sm font-medium
                                 text-red-600 dark:text-red-400
                                 hover:bg-red-50 dark:hover:bg-red-900/20
                                 rounded transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => onRejectDeletion(deletion)}
                      className="px-2 py-1 text-sm font-medium
                                 text-neutral-500 dark:text-neutral-400
                                 hover:bg-neutral-100 dark:hover:bg-neutral-700
                                 rounded transition-colors"
                    >
                      Keep
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* New item suggestions */}
          {safeSuggestions.length > 0 && (
            <ul className="space-y-2 mb-4">
              {safeSuggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="flex items-start gap-3 py-2 px-3 bg-white dark:bg-neutral-800 rounded-lg
                             border border-violet-300 dark:border-violet-600"
                >
                  {/* New badge */}
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                    NEW
                  </span>

                  {/* Step number */}
                  <span className="w-6 text-sm font-medium text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                    {suggestion.id}.
                  </span>

                  {/* Content */}
                  <div className="flex-1">
                    <span className="text-neutral-700 dark:text-neutral-200">
                      {suggestion.text}
                    </span>

                    {/* Estimate badge */}
                    {suggestion.estimatedMinutes && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>~{formatDuration(suggestion.estimatedMinutes)}</span>
                        <span className="px-1 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
                          AI
                        </span>
                      </span>
                    )}

                    {/* Substeps preview - safely check for substeps */}
                    {suggestion.substeps && suggestion.substeps.length > 0 && (
                      <ul className="mt-2 ml-4 space-y-1">
                        {suggestion.substeps.map((sub) => (
                          <li
                            key={sub.id}
                            className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"
                          >
                            <div className="w-3 h-3 rounded border border-neutral-300 dark:border-neutral-600 flex-shrink-0" />
                            <span>{sub.id}. {sub.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() => onAcceptOne(suggestion)}
                    className="flex-shrink-0 px-3 py-1 text-sm font-medium
                               text-green-600 dark:text-green-400
                               hover:bg-green-50 dark:hover:bg-green-900/20
                               rounded transition-colors"
                  >
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-violet-200 dark:border-violet-700">
            {/* Scope selection for routines */}
            {isRoutine && onAcceptWithScope && safeSuggestions.length > 0 && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => onAcceptWithScope('instance')}
                  className="flex-1 px-3 py-2 text-sm font-medium
                             bg-violet-100 dark:bg-violet-900/30
                             text-violet-700 dark:text-violet-300
                             hover:bg-violet-200 dark:hover:bg-violet-800/40
                             rounded-lg transition-colors"
                >
                  Add to today only
                </button>
                <button
                  onClick={() => onAcceptWithScope('template')}
                  className="flex-1 px-3 py-2 text-sm font-medium
                             bg-blue-100 dark:bg-blue-900/30
                             text-blue-700 dark:text-blue-300
                             hover:bg-blue-200 dark:hover:bg-blue-800/40
                             rounded-lg transition-colors"
                >
                  Add to routine
                </button>
              </div>
            )}

            {/* Standard actions */}
            <div className="flex items-center gap-3">
              {/* Only show Accept all for non-routines or when no suggestions */}
              {(!isRoutine || safeSuggestions.length === 0) && (
                <button
                  onClick={onAcceptAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                >
                  Accept all
                </button>
              )}
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
