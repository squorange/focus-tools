"use client";

import React, { useState, useEffect, RefObject } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import BottomSheet from "./BottomSheet";

type DurationSource = 'manual' | 'ai' | 'steps' | null;

interface DurationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  value: number | null;
  source: DurationSource;
  onChange: (minutes: number | null, source: DurationSource) => void;
  /** Ref to the trigger element for positioning the dropdown */
  triggerRef?: RefObject<HTMLElement | null>;
  /** Default value calculated from steps (for "Reset to default" option) */
  calculatedDefault?: number | null;
}

const PRESET_OPTIONS: {
  value: number;
  label: string;
}[] = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
];

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes % 60 === 0) {
    return `${minutes / 60}h`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}

function getSourceIndicator(source: DurationSource): string {
  if (source === 'ai') return ' ✨';
  if (source === 'steps') return ' ∑';
  return '';
}

export default function DurationPicker({
  isOpen,
  onClose,
  value,
  source,
  onChange,
  triggerRef,
  calculatedDefault,
}: DurationPickerProps) {
  const [customHours, setCustomHours] = useState<string>(
    value && value >= 60 ? String(Math.floor(value / 60)) : ""
  );
  const [customMinutes, setCustomMinutes] = useState<string>(
    value ? String(value % 60) : ""
  );
  const [showCustom, setShowCustom] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(typeof window !== "undefined" && window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate position from trigger element
  useEffect(() => {
    if (isOpen && triggerRef?.current && !isMobileView) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen, triggerRef, isMobileView]);

  const handleSelect = (minutes: number) => {
    onChange(minutes, 'manual');
    onClose();
  };

  const handleClear = () => {
    onChange(null, null);
    onClose();
  };

  const handleCustomSubmit = () => {
    const hours = parseInt(customHours, 10) || 0;
    const mins = parseInt(customMinutes, 10) || 0;
    const totalMinutes = hours * 60 + mins;
    if (totalMinutes > 0) {
      onChange(totalMinutes, 'manual');
      onClose();
    }
  };

  if (!isOpen) return null;

  // Mobile: Bottom sheet
  if (isMobileView) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} height="auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
            <div>
              <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Set Duration
              </h2>
              {source && source !== 'manual' && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {source === 'ai' && "✨ Estimated by AI"}
                  {source === 'steps' && "∑ Calculated from steps"}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {/* Options */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PRESET_OPTIONS.map((option) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      p-3 rounded-lg border transition-colors text-center
                      ${
                        isSelected
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                          : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }
                    `}
                  >
                    <span className={`text-sm font-medium ${isSelected ? "text-violet-700 dark:text-violet-300" : "text-zinc-800 dark:text-zinc-200"}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom input */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
              {!showCustom ? (
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Custom duration...
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Hours</label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={customHours}
                        onChange={(e) => setCustomHours(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        autoFocus
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={(parseInt(customHours, 10) || 0) * 60 + (parseInt(customMinutes, 10) || 0) <= 0}
                    className="w-full px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Duration
                  </button>
                </div>
              )}
            </div>

            {/* Reset/Clear button */}
            {(value || (source === 'manual' && calculatedDefault)) && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full mt-4 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                {source === 'manual' && calculatedDefault
                  ? `Reset to default (${formatDuration(calculatedDefault)} from steps)`
                  : "Clear duration"}
              </button>
            )}
          </div>
        </div>
      </BottomSheet>
    );
  }

  // Desktop: Anchored dropdown via portal
  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div
        className="fixed w-72 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 p-4"
        style={{ top: position.top, left: position.left }}
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Set Duration
        </h3>
        {source && source !== 'manual' && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-3">
            {source === 'ai' && "✨ Estimated by AI"}
            {source === 'steps' && "∑ Calculated from steps"}
          </p>
        )}
        {(!source || source === 'manual') && <div className="mb-3" />}

        {/* Quick options grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {PRESET_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`px-3 py-2 text-sm text-center hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors ${
                  isSelected ? "bg-violet-50 dark:bg-violet-900/20 font-medium text-violet-700 dark:text-violet-300" : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Custom option */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
          {!showCustom ? (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
            >
              Custom duration...
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    autoFocus
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleCustomSubmit}
                disabled={(parseInt(customHours, 10) || 0) * 60 + (parseInt(customMinutes, 10) || 0) <= 0}
                className="w-full px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set
              </button>
            </div>
          )}
        </div>

        {/* Reset/Clear button */}
        {(value || (source === 'manual' && calculatedDefault)) && (
          <button
            type="button"
            onClick={handleClear}
            className="w-full mt-3 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {source === 'manual' && calculatedDefault
              ? `Reset to default (${formatDuration(calculatedDefault)} from steps)`
              : "Clear duration"}
          </button>
        )}
      </div>
    </>,
    document.body
  );
}

// Export helper for formatting duration with source indicator
export function formatDurationWithSource(minutes: number | null, source: DurationSource): string {
  if (!minutes) return "Duration";
  return formatDuration(minutes) + getSourceIndicator(source);
}
