"use client";

import { useEffect, useRef } from "react";
import { AI_ACTIONS } from "@/lib/ai-actions";

export type StuckOption = "breakdown" | "start" | "clarify";

interface StuckMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: StuckOption) => void;
}

// StuckMenu options derived from AI_ACTIONS registry
// Uses "Break it down" (more natural for "What's blocking you?" context)
const MENU_OPTIONS: { option: StuckOption; icon: string; label: string }[] = [
  { option: "breakdown", icon: AI_ACTIONS.focusMode.breakdown.icon, label: "Break it down" },
  { option: "start", icon: AI_ACTIONS.focusMode.helpMeStart.icon, label: AI_ACTIONS.focusMode.helpMeStart.label },
  { option: "clarify", icon: AI_ACTIONS.focusMode.clarify.icon, label: AI_ACTIONS.focusMode.clarify.label },
];

export default function StuckMenu({
  isOpen,
  onClose,
  onSelectOption,
}: StuckMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Delay adding listener to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div
        ref={menuRef}
        className="w-72 bg-white dark:bg-neutral-800 rounded-xl shadow-xl
                   border border-neutral-200 dark:border-neutral-700 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            What's blocking you?
          </p>
        </div>

        {/* Options */}
        <div className="py-1">
          {MENU_OPTIONS.map(({ option, icon, label }) => (
            <button
              key={option}
              onClick={() => onSelectOption(option)}
              className="w-full flex items-center gap-3 px-4 py-3
                         hover:bg-neutral-100 dark:hover:bg-neutral-700
                         transition-colors text-left"
            >
              <span className="text-lg">{icon}</span>
              <span className="text-sm text-neutral-700 dark:text-neutral-200">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
