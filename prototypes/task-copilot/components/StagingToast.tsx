"use client";

import { SuggestedStep, EditSuggestion } from "@/lib/types";

interface StagingToastProps {
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  isDrawerOpen: boolean;
  onReview: () => void;
  onAcceptAll: () => void;
  onDismiss: () => void;
}

export default function StagingToast({
  suggestions,
  edits,
  isDrawerOpen,
  onReview,
  onAcceptAll,
  onDismiss,
}: StagingToastProps) {
  const safeEdits = edits || [];
  const safeSuggestions = suggestions || [];
  const totalItems = safeSuggestions.length + safeEdits.length;

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`
        fixed left-0 right-0 z-35
        bg-amber-50 dark:bg-amber-900/30
        border-t border-amber-200 dark:border-amber-700
        shadow-[0_-2px_10px_rgba(0,0,0,0.08)]
        transition-all duration-300 ease-out
        ${isDrawerOpen ? "bottom-[70vh]" : "bottom-14"}
      `}
    >
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left side - info */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">💡</span>
          <span className="font-medium text-amber-800 dark:text-amber-200 truncate">
            {totalItems} suggested {totalItems === 1 ? "change" : "changes"}
          </span>
        </div>

        {/* Right side - actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onReview}
            className="px-3 py-1.5 text-sm font-medium
                       text-amber-700 dark:text-amber-300
                       hover:bg-amber-100 dark:hover:bg-amber-800/30
                       rounded-lg transition-colors"
          >
            Review
          </button>
          <button
            onClick={onAcceptAll}
            className="px-3 py-1.5 text-sm font-medium
                       bg-green-600 hover:bg-green-700
                       text-white rounded-lg transition-colors"
          >
            Accept all
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 text-amber-600 dark:text-amber-400
                       hover:bg-amber-100 dark:hover:bg-amber-800/30
                       rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
