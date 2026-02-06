"use client";

import React, { useState, useEffect, useRef, RefObject } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { ImportanceLevel } from "@/lib/types";
import { getImportanceLabel } from "@/lib/priority";
import { BottomSheet } from "@design-system/components";

interface ImportancePickerProps {
  isOpen: boolean;
  onClose: () => void;
  value: ImportanceLevel | null;
  onChange: (value: ImportanceLevel | null) => void;
  /** Ref to the trigger element for positioning the dropdown */
  triggerRef?: RefObject<HTMLElement | null>;
}

const IMPORTANCE_OPTIONS: {
  value: ImportanceLevel | null;
  label: string;
  description: string;
}[] = [
  {
    value: "must_do",
    label: "Must Do",
    description: "Critical task that must get done",
  },
  {
    value: "should_do",
    label: "Should Do",
    description: "Important but not critical",
  },
  {
    value: "could_do",
    label: "Could Do",
    description: "Nice to do if time permits",
  },
  {
    value: "would_like_to",
    label: "Would Like To",
    description: "Optional, low priority",
  },
  {
    value: null,
    label: "Not Set",
    description: "System assumes moderate importance",
  },
];

export default function ImportancePicker({
  isOpen,
  onClose,
  value,
  onChange,
  triggerRef,
}: ImportancePickerProps) {
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

  const handleSelect = (newValue: ImportanceLevel | null) => {
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
          <div className="h-14 flex items-center justify-between px-4 flex-shrink-0">
            <h2 className="text-base font-medium text-fg-neutral-primary">
              Set Importance
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-fg-neutral-secondary" />
            </button>
          </div>

          {/* Options */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-2"
            style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom, env(safe-area-inset-bottom)))' }}
          >
            {IMPORTANCE_OPTIONS.map((option) => {
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
                      <span className={`text-sm font-medium ${option.value === null ? "text-fg-neutral-secondary" : "text-fg-neutral-primary"}`}>
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
        <h3 className="text-sm font-semibold text-fg-neutral-primary mb-3">
          Set Importance
        </h3>

        {/* Options */}
        <div className="space-y-1">
          {IMPORTANCE_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value ?? "null"}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-bg-neutral-subtle rounded-lg transition-colors ${
                  isSelected ? "bg-violet-50 dark:bg-violet-900/20" : ""
                }`}
              >
                <div className="flex-1">
                  <span className={`font-medium ${option.value === null ? "text-fg-neutral-secondary" : "text-fg-neutral-primary"}`}>
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
