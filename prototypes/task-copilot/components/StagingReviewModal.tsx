"use client";

import { useEffect } from "react";
import { SuggestedStep, EditSuggestion } from "@/lib/types";

interface StagingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  onAcceptOne: (suggestion: SuggestedStep) => void;
  onAcceptEdit: (edit: EditSuggestion) => void;
  onRejectEdit: (edit: EditSuggestion) => void;
  onAcceptAll: () => void;
}

export default function StagingReviewModal({
  isOpen,
  onClose,
  suggestions,
  edits,
  onAcceptOne,
  onAcceptEdit,
  onRejectEdit,
  onAcceptAll,
}: StagingReviewModalProps) {
  const safeEdits = edits || [];
  const safeSuggestions = suggestions || [];
  const totalItems = safeSuggestions.length + safeEdits.length;

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Auto-close modal when all items are processed
  useEffect(() => {
    if (isOpen && totalItems === 0) {
      onClose();
    }
  }, [isOpen, totalItems, onClose]);

  if (!isOpen) return null;

  // Close modal after accepting all
  const handleAcceptAll = () => {
    onAcceptAll();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col
                   bg-white dark:bg-neutral-800
                   sm:rounded-xl rounded-t-xl shadow-xl
                   animate-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">
              Review Changes
            </h2>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              ({totalItems})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300
                       hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Edit suggestions */}
          {safeEdits.map((edit) => (
            <div
              key={`edit-${edit.targetId}`}
              className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg
                         border border-blue-200 dark:border-blue-700"
            >
              <div className="flex items-start gap-3 mb-3">
                {/* Edit badge */}
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  EDIT
                </span>

                {/* Step/substep indicator */}
                <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500">
                  {edit.targetId}.
                </span>
              </div>

              {/* Content: old → new */}
              <div className="mb-3 pl-2">
                <p className="text-neutral-400 dark:text-neutral-500 line-through mb-1">
                  {edit.originalText}
                </p>
                <p className="text-neutral-700 dark:text-neutral-200">
                  {edit.newText}
                </p>
              </div>

              {/* Accept/Reject buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onRejectEdit(edit)}
                  className="px-3 py-1.5 text-sm font-medium
                             text-neutral-500 dark:text-neutral-400
                             hover:bg-neutral-200 dark:hover:bg-neutral-700
                             rounded-lg transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => onAcceptEdit(edit)}
                  className="px-3 py-1.5 text-sm font-medium
                             bg-green-600 hover:bg-green-700
                             text-white rounded-lg transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          ))}

          {/* New item suggestions */}
          {safeSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg
                         border border-amber-200 dark:border-amber-700"
            >
              <div className="flex items-start gap-3 mb-3">
                {/* New badge */}
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                  NEW
                </span>

                {/* Step number */}
                <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500">
                  {suggestion.id}.
                </span>
              </div>

              {/* Content */}
              <div className="mb-3 pl-2">
                <p className="text-neutral-700 dark:text-neutral-200 mb-2">
                  {suggestion.text}
                </p>

                {/* Substeps preview - safely check for substeps */}
                {suggestion.substeps && suggestion.substeps.length > 0 && (
                  <ul className="ml-2 space-y-1">
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
              <div className="flex justify-end">
                <button
                  onClick={() => onAcceptOne(suggestion)}
                  className="px-3 py-1.5 text-sm font-medium
                             bg-green-600 hover:bg-green-700
                             text-white rounded-lg transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium
                       text-neutral-600 dark:text-neutral-400
                       hover:bg-neutral-100 dark:hover:bg-neutral-700
                       rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-sm font-medium
                       bg-green-600 hover:bg-green-700
                       text-white rounded-lg transition-colors"
          >
            Accept all ({totalItems})
          </button>
        </div>
      </div>
    </div>
  );
}
