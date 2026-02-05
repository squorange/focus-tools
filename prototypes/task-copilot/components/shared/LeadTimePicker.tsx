"use client";

import React, { useState, useEffect, RefObject } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { BottomSheet } from "@design-system/components";

interface LeadTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  value: number | null;
  onChange: (value: number | null) => void;
  deadlineDate?: string | null;
  /** Ref to the trigger element for positioning the dropdown */
  triggerRef?: RefObject<HTMLElement | null>;
}

const PRESET_OPTIONS: {
  value: number | null;
  label: string;
  description: string;
}[] = [
  { value: null, label: "Same day", description: "No lead time needed" },
  { value: 1, label: "1 day", description: "Start 1 day before deadline" },
  { value: 2, label: "2 days", description: "Start 2 days before deadline" },
  { value: 3, label: "3 days", description: "Start 3 days before deadline" },
  { value: 7, label: "1 week", description: "Start 1 week before deadline" },
  { value: 14, label: "2 weeks", description: "Start 2 weeks before deadline" },
  { value: 30, label: "1 month", description: "Start 1 month before deadline" },
];

function formatEffectiveDeadline(deadlineDate: string, leadTimeDays: number): string {
  const deadline = new Date(deadlineDate);
  deadline.setDate(deadline.getDate() - leadTimeDays);
  return deadline.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LeadTimePicker({
  isOpen,
  onClose,
  value,
  onChange,
  deadlineDate,
  triggerRef,
}: LeadTimePickerProps) {
  const [customValue, setCustomValue] = useState<string>(
    value && !PRESET_OPTIONS.some((o) => o.value === value)
      ? String(value)
      : ""
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

  const handleSelect = (newValue: number | null) => {
    onChange(newValue);
    onClose();
  };

  const handleCustomSubmit = () => {
    const parsed = parseInt(customValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
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
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <div>
              <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Set Lead Time
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Runway needed before a deadline.{deadlineDate && ` Deadline: ${deadlineDate}`}
              </p>
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
          <div
            className="flex-1 overflow-y-auto p-4 space-y-2"
            style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom, env(safe-area-inset-bottom)))' }}
          >
            {PRESET_OPTIONS.map((option) => {
              const isSelected = value === option.value;
              const effectiveDate =
                deadlineDate && option.value
                  ? formatEffectiveDeadline(deadlineDate, option.value)
                  : null;

              return (
                <button
                  key={option.value ?? "null"}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-colors
                    ${
                      isSelected
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                        : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {option.label}
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {effectiveDate
                          ? `Start by ${effectiveDate}`
                          : option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={18} className="text-violet-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Custom option */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
              {!showCustom ? (
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Custom days...
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Days"
                    className="flex-1 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={!customValue || parseInt(customValue, 10) <= 0}
                    className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>
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
        className="fixed w-80 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 max-h-[70vh] overflow-hidden flex flex-col"
        style={{ top: position.top, left: position.left }}
      >
        {/* Header */}
        <div className="p-4 pb-0 flex-shrink-0">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Set Lead Time
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-3">
            Runway needed before a deadline.{deadlineDate && ` Deadline: ${deadlineDate}`}
          </p>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1">
          {PRESET_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            const effectiveDate =
              deadlineDate && option.value
                ? formatEffectiveDeadline(deadlineDate, option.value)
                : null;

            return (
              <button
                key={option.value ?? "null"}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors ${
                  isSelected ? "bg-violet-50 dark:bg-violet-900/20" : ""
                }`}
              >
                <div className="flex-1">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {option.label}
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {effectiveDate
                      ? `Start by ${effectiveDate}`
                      : option.description}
                  </p>
                </div>
                {isSelected && (
                  <Check size={16} className="text-violet-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Custom option */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 flex-shrink-0">
          {!showCustom ? (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
            >
              Custom days...
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Days"
                className="flex-1 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCustomSubmit}
                disabled={!customValue || parseInt(customValue, 10) <= 0}
                className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
