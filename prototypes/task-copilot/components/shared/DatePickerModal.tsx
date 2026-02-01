"use client";

import { useState, useEffect } from "react";
import BottomSheet from "@/components/shared/BottomSheet";

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
  initialDate?: string;
  minDate?: string;
  title?: string;
}

export default function DatePickerModal({
  isOpen,
  onClose,
  onSelectDate,
  initialDate,
  minDate,
  title = "Select Date",
}: DatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate || "");
  const [isMobileView, setIsMobileView] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(typeof window !== "undefined" && window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset date when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate || "");
    }
  }, [isOpen, initialDate]);

  const handleSelect = () => {
    if (selectedDate) {
      onSelectDate(selectedDate);
      onClose();
    }
  };

  const handleQuickSelect = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const dateStr = date.toISOString().split("T")[0];
    onSelectDate(dateStr);
    onClose();
  };

  if (!isOpen) return null;

  // Shared content
  const renderContent = () => (
    <div className="space-y-3">
      {/* Quick options */}
      <div className="space-y-1">
        {[
          { label: "Tomorrow", days: 1 },
          { label: "In 3 days", days: 3 },
          { label: "Next week", days: 7 },
        ].map(({ label, days }) => (
          <button
            key={label}
            onClick={() => handleQuickSelect(days)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date section */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          Or pick a specific date
        </div>
        <div>
          <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>
    </div>
  );

  // Mobile: Bottom sheet
  if (isMobileView) {
    return (
      <BottomSheet isOpen={true} onClose={onClose} height="auto" zIndex={80}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 pb-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedDate}
            className="px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Select
          </button>
        </div>
      </BottomSheet>
    );
  }

  // Desktop: Centered modal
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[80]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {renderContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedDate}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
