"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { Task, UserSettings } from "@/lib/types";
import {
  getStartPokeStatus,
  formatPokeTime,
  formatAnchorTime,
  formatDurationForPoke,
  getDefaultText,
} from "@/lib/start-poke-utils";
import { StartPokeSettings } from "@/lib/notification-types";

interface StartPokeFieldProps {
  task: Task;
  userSettings: UserSettings;
  onChange: (override: 'on' | 'off' | null) => void;
  onAdjustEstimate?: () => void;
}

export default function StartPokeField({
  task,
  userSettings,
  onChange,
  onAdjustEstimate,
}: StartPokeFieldProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convert UserSettings to StartPokeSettings
  const settings: StartPokeSettings = {
    startPokeEnabled: userSettings.startPokeEnabled,
    startPokeDefault: userSettings.startPokeDefault,
    startPokeBufferMinutes: userSettings.startPokeBufferMinutes,
    startPokeBufferPercentage: userSettings.startPokeBufferPercentage,
  };

  const status = getStartPokeStatus(task, settings);
  const defaultText = getDefaultText(settings);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Get display value for the dropdown button
  const getDisplayValue = (): string => {
    if (task.startPokeOverride === 'on') return 'On';
    if (task.startPokeOverride === 'off') return 'Off';
    return status.enabled ? 'On (default)' : 'Off (default)';
  };

  const handleSelect = (value: 'on' | 'off' | null) => {
    onChange(value);
    setIsDropdownOpen(false);
  };

  return (
    <div>
      {/* Label */}
      <span className="text-xs text-fg-neutral-secondary mb-1 block">
        Start Time Poke
      </span>

      {/* Full-width dropdown button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full h-8 px-2 py-1 text-sm text-left
            bg-bg-neutral-min
            border border-border-color-neutral rounded-lg
            hover:border-zinc-300 dark:hover:border-zinc-600
            focus:outline-none focus:ring-2 focus:ring-violet-500
            flex items-center justify-between"
        >
          <span className={status.enabled ? 'text-violet-600 dark:text-violet-400' : 'text-fg-neutral-primary'}>
            {getDisplayValue()}
          </span>
          <ChevronDown
            size={16}
            className={`text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-bg-neutral-min border border-border-color-neutral rounded-lg shadow-lg py-1">
              <button
                onClick={() => handleSelect('on')}
                className={`
                  w-full px-3 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-700
                  ${task.startPokeOverride === 'on' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'text-fg-neutral-primary'}
                `}
              >
                On
              </button>
              <button
                onClick={() => handleSelect('off')}
                className={`
                  w-full px-3 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-700
                  ${task.startPokeOverride === 'off' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'text-fg-neutral-primary'}
                `}
              >
                Off
              </button>
              <div className="border-t border-border-color-neutral my-1" />
              <button
                onClick={() => handleSelect(null)}
                className={`
                  w-full px-3 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-700
                  ${task.startPokeOverride === null ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'text-fg-neutral-primary'}
                `}
              >
                <span>Use default</span>
                <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                  ({defaultText})
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Helper text (always show when enabled) */}
      {status.enabled && (
        <div className="mt-1.5 flex flex-col gap-0.5">
          {/* State 1: Missing anchor time */}
          {status.missingReason === 'no_anchor' && (
            <div className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span className="text-xs">
                {task.isRecurring
                  ? 'Set a scheduled time in the recurrence pattern to enable notification'
                  : 'Add a target time or deadline to enable notification'}
              </span>
            </div>
          )}

          {/* State 2: Missing duration - instructional */}
          {status.missingReason === 'no_duration' && (
            <span className="text-xs text-fg-neutral-secondary">
              Add duration estimate to calculate start time
            </span>
          )}

          {/* State 3: Fully calculated - show plain text with poke time */}
          {status.nudgeTime !== null && status.durationMinutes !== null && status.bufferMinutes !== null && status.anchorTime !== null && (
            <>
              {/* Primary: emoji + start time (plain text) */}
              <span className="text-xs text-fg-neutral-primary">
                👉🏽 Start at {formatPokeTime(status.nudgeTime)}
              </span>

              {/* Secondary line: calculation breakdown */}
              <span className="text-xs text-fg-neutral-secondary">
                {settings.startPokeBufferPercentage
                  ? `~${status.durationMinutes}m + 15% buffer → ${formatAnchorTime(status.anchorTime, true)}`
                  : `${formatDurationForPoke(status.durationMinutes)} + ${formatDurationForPoke(status.bufferMinutes)} buffer → ${formatAnchorTime(status.anchorTime, true)}`}
              </span>

              {/* Link to adjust estimate (optional) */}
              {onAdjustEstimate && (
                <button
                  onClick={onAdjustEstimate}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline text-left w-fit"
                >
                  Adjust estimate
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
