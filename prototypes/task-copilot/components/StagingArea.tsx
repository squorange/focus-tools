"use client";

import { useState } from "react";
import { SuggestedStep, EditSuggestion } from "@/lib/types";

interface StagingAreaProps {
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  suggestedTitle?: string | null;
  currentTitle?: string;
  onAcceptOne: (suggestion: SuggestedStep) => void;
  onAcceptEdit: (edit: EditSuggestion) => void;
  onRejectEdit: (edit: EditSuggestion) => void;
  onAcceptTitle?: () => void;
  onRejectTitle?: () => void;
  onAcceptAll: () => void;
  onDismiss: () => void;
  defaultExpanded?: boolean;
}

export default function StagingArea({
  suggestions,
  edits,
  suggestedTitle,
  currentTitle,
  onAcceptOne,
  onAcceptEdit,
  onRejectEdit,
  onAcceptTitle,
  onRejectTitle,
  onAcceptAll,
  onDismiss,
  defaultExpanded = true,
}: StagingAreaProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const safeEdits = edits || [];
  const safeSuggestions = suggestions || [];
  // More robust check - ensure suggestedTitle is truthy and different from current
  const hasTitleSuggestion = Boolean(suggestedTitle) && suggestedTitle !== (currentTitle || '');
  const totalItems = safeSuggestions.length + safeEdits.length + (hasTitleSuggestion ? 1 : 0);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 p-4 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span className="font-medium text-amber-800 dark:text-amber-200">
            Suggested Changes
          </span>
          <span className="text-sm text-amber-600 dark:text-amber-400">
            ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-amber-600 dark:text-amber-400 transition-transform duration-200 ${
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
            <div className="mb-3 py-2 px-3 bg-white dark:bg-neutral-800 rounded-lg border border-purple-200 dark:border-purple-700">
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
                             border border-blue-200 dark:border-blue-700"
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

          {/* New item suggestions */}
          {safeSuggestions.length > 0 && (
            <ul className="space-y-2 mb-4">
              {safeSuggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="flex items-start gap-3 py-2 px-3 bg-white dark:bg-neutral-800 rounded-lg
                             border border-amber-200 dark:border-amber-700"
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
          <div className="flex items-center gap-3 pt-2 border-t border-amber-200 dark:border-amber-700">
            <button
              onClick={onAcceptAll}
              className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700
                         text-white rounded-lg transition-colors"
            >
              Accept all
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400
                         hover:bg-neutral-100 dark:hover:bg-neutral-800
                         rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
