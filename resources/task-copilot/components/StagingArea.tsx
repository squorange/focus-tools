"use client";

import { SuggestedStep } from "@/lib/types";

interface StagingAreaProps {
  suggestions: SuggestedStep[];
  onAcceptOne: (suggestion: SuggestedStep) => void;
  onAcceptAll: () => void;
  onDismiss: () => void;
}

export default function StagingArea({
  suggestions,
  onAcceptOne,
  onAcceptAll,
  onDismiss,
}: StagingAreaProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💡</span>
        <span className="font-medium text-amber-800 dark:text-amber-200">
          Suggested Additions
        </span>
        <span className="text-sm text-amber-600 dark:text-amber-400">
          ({suggestions.length} {suggestions.length === 1 ? "item" : "items"})
        </span>
      </div>

      {/* Suggestion list */}
      <ul className="space-y-2 mb-4">
        {suggestions.map((suggestion) => (
          <li
            key={suggestion.id}
            className="flex items-start gap-3 py-2 px-3 bg-white dark:bg-neutral-800 rounded-lg
                       border border-amber-200 dark:border-amber-700"
          >
            {/* Empty checkbox (visual only) */}
            <div className="mt-0.5 w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 flex-shrink-0" />

            {/* Step number */}
            <span className="w-6 text-sm font-medium text-neutral-400 dark:text-neutral-500 flex-shrink-0">
              {suggestion.id}.
            </span>

            {/* Content */}
            <div className="flex-1">
              <span className="text-neutral-700 dark:text-neutral-200">
                {suggestion.text}
              </span>

              {/* Substeps preview */}
              {suggestion.substeps.length > 0 && (
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

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onAcceptAll}
          className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700
                     text-white rounded-lg transition-colors"
        >
          Add all
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
  );
}
