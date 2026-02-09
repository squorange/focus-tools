"use client";

import { useState, useEffect } from "react";
import { SuggestedStep, EditSuggestion, DeletionSuggestion, MetadataSuggestion } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

// Display labels for metadata fields
const FIELD_LABELS: Record<MetadataSuggestion['field'], string> = {
  importance: 'Importance',
  energyType: 'Energy Type',
  leadTimeDays: 'Lead Time',
};

const VALUE_LABELS: Record<string, string> = {
  // Importance
  must_do: 'Must Do',
  should_do: 'Should Do',
  could_do: 'Could Do',
  would_like_to: 'Would Like To',
  // Energy
  energizing: 'Energizing',
  neutral: 'Neutral',
  draining: 'Draining',
};

interface StagingAreaProps {
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];
  deletions: DeletionSuggestion[];
  metadataSuggestions?: MetadataSuggestion[];
  suggestedTitle?: string | null;
  currentTitle?: string;
  onAcceptOne: (suggestion: SuggestedStep) => void;
  onAcceptEdit: (edit: EditSuggestion) => void;
  onRejectEdit: (edit: EditSuggestion) => void;
  onAcceptDeletion: (deletion: DeletionSuggestion) => void;
  onRejectDeletion: (deletion: DeletionSuggestion) => void;
  onAcceptMetadata?: (metadata: MetadataSuggestion) => void;
  onRejectMetadata?: (metadata: MetadataSuggestion) => void;
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
  // Mode for recurring tasks - in managing mode, hide scope buttons
  mode?: 'executing' | 'managing';
  // Target step context for substep suggestions
  targetStep?: { id: string; text: string; stepNumber: string } | null;
}

export default function StagingArea({
  suggestions,
  edits,
  deletions,
  metadataSuggestions,
  suggestedTitle,
  currentTitle,
  onAcceptOne,
  onAcceptEdit,
  onRejectEdit,
  onAcceptDeletion,
  onRejectDeletion,
  onAcceptMetadata,
  onRejectMetadata,
  onAcceptTitle,
  onRejectTitle,
  onAcceptAll,
  onDismiss,
  defaultExpanded = true,
  isNewArrival = false,
  onAnimationComplete,
  isRoutine = false,
  onAcceptWithScope,
  mode,
  targetStep,
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
  const safeMetadataSuggestions = metadataSuggestions || [];
  // More robust check - ensure suggestedTitle is truthy and different from current
  const hasTitleSuggestion = Boolean(suggestedTitle) && suggestedTitle !== (currentTitle || '');
  const totalItems = safeSuggestions.length + safeEdits.length + safeDeletions.length + safeMetadataSuggestions.length + (hasTitleSuggestion ? 1 : 0);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`
        bg-bg-accent-subtle border rounded-lg overflow-hidden transition-all
        ${isPulsing
          ? 'border-border-accent shadow-lg shadow-accent-glow animate-pulse-glow'
          : 'border-border-accent/60'}
      `}
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 p-4 hover:bg-bg-accent-subtle-hover transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">💡</span>
          <span className="font-medium text-fg-accent-primary">
            Suggested Changes
          </span>
          {targetStep && (
            <span className="text-sm text-fg-accent-secondary">
              → Step {targetStep.stepNumber}: {targetStep.text.length > 25 ? targetStep.text.slice(0, 25) + '...' : targetStep.text}
            </span>
          )}
          <span className="text-sm text-fg-accent-secondary">
            ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-fg-accent-secondary transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content - with grid-rows animation */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${
        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
          {/* Title suggestion */}
          {hasTitleSuggestion && (
            <div className="mb-3 py-2 px-3 bg-bg-neutral-min rounded-lg border border-border-accent">
              <div className="flex items-start gap-3">
                {/* Title badge */}
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-bg-accent-subtle text-fg-accent-primary rounded">
                  TITLE
                </span>

                {/* Content: old → new */}
                <div className="flex-1 min-w-0">
                  <p className="text-fg-neutral-soft line-through text-sm">
                    {currentTitle}
                  </p>
                  <p className="text-fg-neutral-primary mt-1">
                    {suggestedTitle}
                  </p>
                </div>

                {/* Accept/Reject buttons */}
                <div className="flex-shrink-0 flex gap-1">
                  <button
                    onClick={onAcceptTitle}
                    className="px-2 py-1 text-sm font-medium
                               text-fg-positive-primary
                               hover:bg-bg-positive-subtle-hover
                               rounded transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={onRejectTitle}
                    className="px-2 py-1 text-sm font-medium
                               text-fg-neutral-soft
                               hover:bg-bg-neutral-subtle-hover
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
                  className="flex items-start gap-3 py-2 px-3 bg-bg-neutral-min rounded-lg
                             border border-border-accent"
                >
                  {/* Edit badge */}
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-bg-info-subtle text-fg-info-primary rounded">
                    EDIT
                  </span>

                  {/* Step/substep indicator - only show if it's a valid display ID format */}
                  {/^(\d+[a-z]?|\d+)$/.test(edit.targetId) && (
                    <span className="w-6 text-sm font-medium text-fg-neutral-soft flex-shrink-0">
                      {edit.targetId}.
                    </span>
                  )}

                  {/* Content: old → new */}
                  <div className="flex-1 min-w-0">
                    <p className="text-fg-neutral-soft line-through">
                      {edit.originalText}
                    </p>
                    <p className="text-fg-neutral-primary mt-1">
                      {edit.newText}
                      {/* Display time estimate if provided */}
                      {edit.estimatedMinutes !== undefined && edit.estimatedMinutes > 0 && (
                        <span className="ml-2 text-xs text-violet-500 dark:text-violet-400">
                          ~{formatDuration(edit.estimatedMinutes)}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Accept/Reject buttons */}
                  <div className="flex-shrink-0 flex gap-1">
                    <button
                      onClick={() => onAcceptEdit(edit)}
                      className="px-2 py-1 text-sm font-medium
                                 text-fg-positive-primary
                                 hover:bg-bg-positive-subtle-hover
                                 rounded transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRejectEdit(edit)}
                      className="px-2 py-1 text-sm font-medium
                                 text-fg-neutral-soft
                                 hover:bg-bg-neutral-subtle-hover
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
                  className="flex items-start gap-3 py-2 px-3 bg-bg-neutral-min rounded-lg
                             border border-border-accent"
                >
                  {/* Delete badge */}
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-bg-alert-subtle text-fg-alert-primary rounded">
                    DELETE
                  </span>

                  {/* Step/substep indicator */}
                  <span className="w-8 text-sm font-medium text-fg-neutral-soft flex-shrink-0">
                    {deletion.targetId}.
                  </span>

                  {/* Content: show the text being deleted + reason */}
                  <div className="flex-1 min-w-0">
                    <p className="text-fg-neutral-primary line-through">
                      {deletion.originalText || `Remove ${deletion.targetType}`}
                    </p>
                    <p className="text-sm text-fg-neutral-soft mt-1 italic">
                      {deletion.reason}
                    </p>
                  </div>

                  {/* Accept/Reject buttons */}
                  <div className="flex-shrink-0 flex gap-1">
                    <button
                      onClick={() => onAcceptDeletion(deletion)}
                      className="px-2 py-1 text-sm font-medium
                                 text-fg-alert-primary
                                 hover:bg-bg-alert-subtle-hover
                                 rounded transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => onRejectDeletion(deletion)}
                      className="px-2 py-1 text-sm font-medium
                                 text-fg-neutral-soft
                                 hover:bg-bg-neutral-subtle-hover
                                 rounded transition-colors"
                    >
                      Keep
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Metadata suggestions */}
          {safeMetadataSuggestions.length > 0 && (
            <ul className="space-y-2 mb-2">
              {safeMetadataSuggestions.map((meta, index) => (
                <li
                  key={`meta-${meta.field}-${index}`}
                  className="flex items-start gap-3 py-2 px-3 bg-bg-neutral-min rounded-lg
                             border border-border-accent"
                >
                  {/* Metadata badge */}
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-bg-attention-subtle text-fg-attention-primary rounded">
                    SET
                  </span>

                  {/* Content: field → value + reason */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-fg-neutral-primary">
                        {FIELD_LABELS[meta.field]}:
                      </span>
                      <span className="px-2 py-0.5 text-sm bg-bg-accent-subtle text-fg-accent-primary rounded">
                        {typeof meta.value === 'number'
                          ? `${meta.value} day${meta.value !== 1 ? 's' : ''}`
                          : VALUE_LABELS[meta.value as string] || meta.value}
                      </span>
                    </div>
                    <p className="text-sm text-fg-neutral-soft mt-1">
                      {meta.reason}
                    </p>
                  </div>

                  {/* Accept/Reject buttons */}
                  <div className="flex-shrink-0 flex gap-1">
                    <button
                      onClick={() => onAcceptMetadata?.(meta)}
                      className="px-2 py-1 text-sm font-medium
                                 text-fg-positive-primary
                                 hover:bg-bg-positive-subtle-hover
                                 rounded transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRejectMetadata?.(meta)}
                      className="px-2 py-1 text-sm font-medium
                                 text-fg-neutral-soft
                                 hover:bg-bg-neutral-subtle-hover
                                 rounded transition-colors"
                    >
                      Skip
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
                  className="flex items-start gap-3 py-2 px-3 bg-bg-neutral-min rounded-lg
                             border border-border-accent"
                >
                  {/* New badge */}
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-bg-positive-subtle text-fg-positive-primary rounded">
                    NEW
                  </span>

                  {/* Step number */}
                  <span className="w-6 text-sm font-medium text-fg-neutral-soft flex-shrink-0">
                    {suggestion.id}.
                  </span>

                  {/* Content */}
                  <div className="flex-1">
                    <span className="text-fg-neutral-primary">
                      {suggestion.text}
                    </span>

                    {/* Estimate badge - validate estimatedMinutes is a valid number */}
                    {typeof suggestion.estimatedMinutes === 'number' &&
                     !isNaN(suggestion.estimatedMinutes) &&
                     suggestion.estimatedMinutes > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-fg-neutral-secondary">
                        <span>~{formatDuration(suggestion.estimatedMinutes)}</span>
                        <span className="px-1 py-0.5 text-[10px] font-medium bg-bg-accent-subtle text-fg-accent-secondary rounded">
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
                            className="flex items-center gap-2 text-sm text-fg-neutral-soft"
                          >
                            <div className="w-3 h-3 rounded border border-border-color-neutral flex-shrink-0" />
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
                               text-fg-positive-primary
                               hover:bg-bg-positive-subtle-hover
                               rounded transition-colors"
                  >
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-border-accent">
            <div className="flex items-center gap-3">
              <button
                onClick={onAcceptAll}
                className="px-4 py-2 text-sm font-medium text-fg-neutral-inverse-primary bg-bg-accent-high hover:bg-bg-accent-high-hover rounded-lg transition-colors"
              >
                Accept all
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-sm font-medium text-fg-neutral-secondary hover:text-fg-neutral-primary hover:bg-bg-neutral-subtle-hover rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
