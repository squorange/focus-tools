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
        bg-bg-attention-subtle
        border-t border-border-attention
        shadow-[0_-2px_10px_rgba(0,0,0,0.08)]
        transition-all duration-300 ease-out
        ${isDrawerOpen ? "bottom-[70vh]" : "bottom-14"}
      `}
    >
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left side - info */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">💡</span>
          <span className="font-medium text-fg-attention-primary truncate">
            {totalItems} suggested {totalItems === 1 ? "change" : "changes"}
          </span>
        </div>

        {/* Right side - actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onReview}
            className="px-3 py-1.5 text-sm font-medium
                       text-fg-attention-primary
                       hover:bg-bg-attention-subtle-hover
                       rounded-lg transition-colors"
          >
            Review
          </button>
          <button
            onClick={onAcceptAll}
            className="px-3 py-1.5 text-sm font-medium
                       bg-bg-positive-high hover:bg-bg-positive-high-hover
                       text-fg-neutral-inverse-primary rounded-lg transition-colors"
          >
            Accept all
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 text-fg-attention-primary
                       hover:bg-bg-attention-subtle-hover
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
