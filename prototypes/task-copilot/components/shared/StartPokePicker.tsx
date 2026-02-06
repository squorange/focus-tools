"use client";

import React, { useState, useEffect, RefObject } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { BottomSheet } from "@design-system/components";

type StartPokeOverride = 'on' | 'off' | null;

interface StartPokePickerProps {
  isOpen: boolean;
  onClose: () => void;
  value: StartPokeOverride;
  onChange: (value: StartPokeOverride) => void;
  /** Calculated nudge time to display when enabled */
  calculatedNudgeTime?: string | null;
  /** Whether the task has the necessary data (target date + duration) for pokes */
  hasRequiredData: boolean;
  /** Missing data message to display */
  missingDataMessage?: string;
  /** Ref to the trigger element for positioning the dropdown */
  triggerRef?: RefObject<HTMLElement | null>;
}

const OPTIONS: {
  value: StartPokeOverride;
  label: string;
  description: string;
}[] = [
  {
    value: null,
    label: "Use default",
    description: "Follow system preference",
  },
  {
    value: "on",
    label: "Always on",
    description: "Get start time reminders for this task",
  },
  {
    value: "off",
    label: "Always off",
    description: "No start time reminders for this task",
  },
];

export default function StartPokePicker({
  isOpen,
  onClose,
  value,
  onChange,
  calculatedNudgeTime,
  hasRequiredData,
  missingDataMessage,
  triggerRef,
}: StartPokePickerProps) {
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

  const handleSelect = (newValue: StartPokeOverride) => {
    onChange(newValue);
    onClose();
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
              <h2 className="text-base font-medium text-fg-neutral-primary">
                Start Time Poke
              </h2>
              <p className="text-xs text-fg-neutral-secondary mt-0.5">
                Reminds you when to start so you can finish on time.
                {calculatedNudgeTime && hasRequiredData && ` Will notify at: ${calculatedNudgeTime}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-fg-neutral-secondary" />
            </button>
          </div>

          {/* Missing data warning */}
          {!hasRequiredData && missingDataMessage && (
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs">
              ⚠️ {missingDataMessage}
            </div>
          )}

          {/* Options */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-2"
            style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom, env(safe-area-inset-bottom)))' }}
          >
            {OPTIONS.map((option) => {
              const isSelected = value === option.value;
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
                        : "border-border-color-neutral bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {option.label}
                      </span>
                      <p className="text-xs text-fg-neutral-secondary mt-0.5">
                        {option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={18} className="text-violet-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
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
        className="fixed w-72 bg-bg-neutral-min border border-border-color-neutral rounded-xl shadow-lg z-50 p-4"
        style={{ top: position.top, left: position.left }}
      >
        <h3 className="text-sm font-semibold text-fg-neutral-primary">
          Start Time Poke
        </h3>
        <p className="text-xs text-fg-neutral-secondary mt-1 mb-3">
          Reminds you when to start so you can finish on time.
          {calculatedNudgeTime && hasRequiredData && ` Will notify at: ${calculatedNudgeTime}`}
        </p>

        {/* Missing data warning */}
        {!hasRequiredData && missingDataMessage && (
          <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-lg">
            ⚠️ {missingDataMessage}
          </div>
        )}

        {/* Options */}
        <div className="space-y-1">
          {OPTIONS.map((option) => {
            const isSelected = value === option.value;
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
                  <p className="text-xs text-fg-neutral-secondary mt-0.5">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <Check size={16} className="text-violet-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}
