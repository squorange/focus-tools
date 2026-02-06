"use client";

import { useState, useEffect } from "react";

interface DurationInputProps {
  value: number | null; // total minutes (manual override or explicit setting)
  autoValue?: number | null; // auto-calculated value (e.g., sum of steps)
  onChange: (minutes: number | null) => void;
  source?: "manual" | "ai" | "steps" | null; // source of the current value
  placeholder?: string;
}

/**
 * Parse a duration string into total minutes.
 *
 * Supported formats:
 * - No units → assume minutes: "45" → 45, "90" → 90
 * - Minutes only: "45m", "45 min", "45 mins" → 45
 * - Hours only: "1h", "1hr", "1.5h" → 60, 90
 * - Combined: "1h 30m", "1h30m", "1 hr 30 min" → 90
 *
 * Returns null if the input is invalid.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  // Combined hours and minutes: "1h 30m", "1h30m", "1 hr 30 min", "1hr30min"
  const combinedMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\s*(\d+)\s*(?:m|min|mins|minute|minutes)?$/);
  if (combinedMatch) {
    const hours = parseFloat(combinedMatch[1]);
    const mins = parseInt(combinedMatch[2], 10);
    if (!isNaN(hours) && !isNaN(mins) && hours >= 0 && mins >= 0) {
      return Math.round(hours * 60) + mins;
    }
  }

  // Hours only: "1h", "1hr", "1.5h", "2 hours"
  const hoursMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)$/);
  if (hoursMatch) {
    const hours = parseFloat(hoursMatch[1]);
    if (!isNaN(hours) && hours >= 0) {
      return Math.round(hours * 60);
    }
  }

  // Minutes only: "45m", "45 min", "45mins"
  const minutesMatch = trimmed.match(/^(\d+)\s*(?:m|min|mins|minute|minutes)$/);
  if (minutesMatch) {
    const mins = parseInt(minutesMatch[1], 10);
    if (!isNaN(mins) && mins >= 0) {
      return mins;
    }
  }

  // Plain number → assume minutes
  const plainNumber = trimmed.match(/^(\d+)$/);
  if (plainNumber) {
    const mins = parseInt(plainNumber[1], 10);
    if (!isNaN(mins) && mins >= 0) {
      return mins;
    }
  }

  return null;
}

/**
 * Format minutes into a display string.
 *
 * Display rules:
 * - < 60 min → "45m"
 * - ≥ 60 min, no remainder → "1h", "2h"
 * - ≥ 60 min, with remainder → "1h 30m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

export default function DurationInput({
  value,
  autoValue,
  onChange,
  source,
  placeholder = "e.g. 45m or 1h 30m",
}: DurationInputProps) {
  // Determine effective display value: manual override (value) takes priority, then auto-calculated (autoValue)
  const effectiveValue = value ?? autoValue ?? null;
  const isUsingAutoValue = value == null && autoValue != null;
  const hasManualOverride = value != null && autoValue != null && value !== autoValue;

  // Internal text state for the input field
  const [inputText, setInputText] = useState<string>(() =>
    effectiveValue != null ? formatDuration(effectiveValue) : ""
  );
  const [hasError, setHasError] = useState(false);

  // Sync input text when effective value changes externally
  useEffect(() => {
    if (effectiveValue != null) {
      setInputText(formatDuration(effectiveValue));
      setHasError(false);
    } else {
      setInputText("");
      setHasError(false);
    }
  }, [effectiveValue]);

  const handleBlur = () => {
    const trimmed = inputText.trim();

    // Empty input clears the manual value (reverts to auto if available)
    if (!trimmed) {
      setHasError(false);
      if (value !== null) {
        onChange(null);
      }
      return;
    }

    const parsed = parseDuration(trimmed);
    if (parsed !== null) {
      setHasError(false);
      // Only set manual value if different from auto value
      if (autoValue != null && parsed === autoValue) {
        // Same as auto value, clear manual override
        onChange(null);
      } else {
        onChange(parsed);
      }
      // Format the displayed text to canonical form
      setInputText(formatDuration(parsed));
    } else {
      // Invalid input: show error and revert to previous value
      setHasError(true);
      setTimeout(() => {
        setInputText(effectiveValue != null ? formatDuration(effectiveValue) : "");
        setHasError(false);
      }, 1500);
    }
  };

  // Clear manual override (resets to auto value if available)
  const handleClearOverride = () => {
    setHasError(false);
    onChange(null);
  };

  // Clear everything (when there's no auto value)
  const handleClearAll = () => {
    setInputText("");
    setHasError(false);
    onChange(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full px-3 py-1.5 pr-8 text-sm
            bg-bg-neutral-min
            border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-violet-500
            ${hasError
              ? "border-red-400 dark:border-red-500"
              : "border-border-color-neutral"
            }
            ${isUsingAutoValue ? "text-fg-neutral-secondary" : ""}
          `}
        />

        {/* Clear button - shows X when there's a manual override to reset, or when there's no auto value */}
        {(hasManualOverride || (effectiveValue != null && autoValue == null)) && (
          <button
            onClick={hasManualOverride ? handleClearOverride : handleClearAll}
            type="button"
            className="absolute right-2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
            title={hasManualOverride ? "Reset to auto-calculated" : "Clear estimate"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error hint */}
      {hasError && (
        <span className="text-xs text-red-500 dark:text-red-400">
          Invalid format. Try: 45m, 1h, or 1h 30m
        </span>
      )}

      {/* Source indicator - only shows context, not the value */}
      {!hasError && effectiveValue != null && (
        <span className="text-xs text-fg-neutral-secondary">
          {source === "steps" && "From steps"}
          {source === "ai" && (
            <span className="inline-flex items-center gap-1">
              AI estimate
              <span className="px-1 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
                AI
              </span>
            </span>
          )}
          {source === "manual" && (hasManualOverride ? "Manual override" : "Manual")}
          {!source && isUsingAutoValue && "From steps"}
        </span>
      )}
    </div>
  );
}

/**
 * Inline estimate badge for step rows
 */
interface EstimateBadgeProps {
  minutes: number | null;
  source?: "user" | "ai" | null;
  onClick?: () => void;
}

export function EstimateBadge({ minutes, source, onClick }: EstimateBadgeProps) {
  if (!minutes) return null;

  const formatDisplay = () => {
    if (minutes < 60) return `~${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `~${h}h`;
    return `~${h}h ${m}m`;
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-fg-neutral-secondary hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
    >
      <span>{formatDisplay()}</span>
      {source === "ai" && (
        <span className="px-1 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
          AI
        </span>
      )}
    </button>
  );
}
