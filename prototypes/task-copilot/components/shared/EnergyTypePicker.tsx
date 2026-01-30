"use client";

import React, { useState, useEffect, RefObject } from "react";
import { createPortal } from "react-dom";
import { Check, X, TrendingUp, Minus, TrendingDown, CircleSlash } from "lucide-react";
import { EnergyType } from "@/lib/types";
import { getEnergyTypeLabel } from "@/lib/priority";
import BottomSheet from "./BottomSheet";

interface EnergyTypePickerProps {
  isOpen: boolean;
  onClose: () => void;
  value: EnergyType | null;
  onChange: (value: EnergyType | null) => void;
  /** Ref to the trigger element for positioning the dropdown */
  triggerRef?: RefObject<HTMLElement | null>;
}

const ENERGY_OPTIONS: {
  value: EnergyType | null;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "energizing",
    label: "Energizing",
    description: "Tasks that boost your energy and motivation",
    icon: <TrendingUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
  },
  {
    value: "neutral",
    label: "Neutral",
    description: "Tasks that neither drain nor boost energy",
    icon: <Minus className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
  },
  {
    value: "draining",
    label: "Draining",
    description: "Tasks that require effort and deplete energy",
    icon: <TrendingDown className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
  },
  {
    value: null,
    label: "Not Set",
    description: "Energy type not specified",
    icon: <CircleSlash className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />,
  },
];

export default function EnergyTypePicker({
  isOpen,
  onClose,
  value,
  onChange,
  triggerRef,
}: EnergyTypePickerProps) {
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

  const handleSelect = (newValue: EnergyType | null) => {
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
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
            <div>
              <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Set Energy Type
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                When high energy, tackle draining tasks. When low, choose energizing ones.
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
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {ENERGY_OPTIONS.map((option) => {
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
                        : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {option.icon}
                      <div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {option.label}
                        </span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {option.description}
                        </p>
                      </div>
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
        className="fixed w-72 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 p-4"
        style={{ top: position.top, left: position.left }}
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Set Energy Type
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-3">
          When high energy, tackle draining tasks. When low, choose energizing ones.
        </p>

        {/* Options */}
        <div className="space-y-1">
          {ENERGY_OPTIONS.map((option) => {
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
                {option.icon}
                <div className="flex-1">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {option.label}
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
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
