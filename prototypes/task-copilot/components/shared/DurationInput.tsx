"use client";

import { useMemo } from "react";
import {
  minutesToHoursAndMinutes,
  hoursAndMinutesToMinutes,
  MINUTE_INCREMENTS,
  HOUR_INCREMENTS,
} from "@/lib/utils";

interface DurationInputProps {
  value: number | null; // total minutes
  onChange: (minutes: number | null) => void;
  showSource?: "user" | "ai" | null;
  compact?: boolean;
}

export default function DurationInput({
  value,
  onChange,
  showSource,
  compact = false,
}: DurationInputProps) {
  const { hours, minutes } = useMemo(() => {
    if (!value) return { hours: 0, minutes: 0 };
    return minutesToHoursAndMinutes(value);
  }, [value]);

  const handleHoursChange = (newHours: number) => {
    const newTotal = hoursAndMinutesToMinutes(newHours, minutes);
    onChange(newTotal > 0 ? newTotal : null);
  };

  const handleMinutesChange = (newMinutes: number) => {
    const newTotal = hoursAndMinutesToMinutes(hours, newMinutes);
    onChange(newTotal > 0 ? newTotal : null);
  };

  const handleClear = () => {
    onChange(null);
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5">
        {/* Hours dropdown */}
        <select
          value={hours}
          onChange={(e) => handleHoursChange(parseInt(e.target.value))}
          className="px-1 py-0.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          {HOUR_INCREMENTS.map((h) => (
            <option key={h} value={h}>
              {h}h
            </option>
          ))}
        </select>

        {/* Minutes dropdown */}
        <select
          value={minutes}
          onChange={(e) => handleMinutesChange(parseInt(e.target.value))}
          className="px-1 py-0.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          {MINUTE_INCREMENTS.map((m) => (
            <option key={m} value={m}>
              {m}m
            </option>
          ))}
        </select>

        {/* AI badge */}
        {showSource === "ai" && (
          <span className="px-1 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
            AI
          </span>
        )}

        {/* Clear button */}
        {value && (
          <button
            onClick={handleClear}
            className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
            title="Clear estimate"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Hours dropdown */}
      <div className="flex items-center gap-1">
        <select
          value={hours}
          onChange={(e) => handleHoursChange(parseInt(e.target.value))}
          className="px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {HOUR_INCREMENTS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">h</span>
      </div>

      {/* Minutes dropdown */}
      <div className="flex items-center gap-1">
        <select
          value={minutes}
          onChange={(e) => handleMinutesChange(parseInt(e.target.value))}
          className="px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {MINUTE_INCREMENTS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">m</span>
      </div>

      {/* AI badge */}
      {showSource === "ai" && (
        <span className="px-1.5 py-0.5 text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
          AI
        </span>
      )}

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
          title="Clear estimate"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
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
