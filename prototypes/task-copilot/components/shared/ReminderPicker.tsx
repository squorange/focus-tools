"use client";

import { useState, useEffect, RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Reminder } from "@/lib/types";
import {
  formatReminder,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";
import { BottomSheet } from "@design-system/components";

interface ReminderPickerProps {
  reminder: Reminder | null;
  targetDate: string | null;
  deadlineDate: string | null;
  onChange: (reminder: Reminder | null) => void;
  onClose: () => void;
  /** Ref to the trigger element for positioning the dropdown */
  triggerRef?: RefObject<HTMLElement | null>;
}

export default function ReminderPicker({
  reminder,
  targetDate,
  deadlineDate,
  onChange,
  onClose,
  triggerRef,
}: ReminderPickerProps) {
  const [customDate, setCustomDate] = useState<string>(() => {
    if (reminder?.type === "absolute" && reminder.absoluteTime) {
      return new Date(reminder.absoluteTime).toISOString().split("T")[0];
    }
    // Default: tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [customTime, setCustomTime] = useState<string>(() => {
    if (reminder?.type === "absolute" && reminder.absoluteTime) {
      const date = new Date(reminder.absoluteTime);
      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
    return "09:00";
  });
  const [permissionState, setPermissionState] = useState<
    NotificationPermission | "unsupported"
  >(getNotificationPermission());
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mobile view detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(typeof window !== "undefined" && window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate position from trigger element (desktop only)
  useEffect(() => {
    if (triggerRef?.current && !isMobileView) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - 280), // Align to right edge, min 8px from left
      });
    }
  }, [triggerRef, isMobileView]);

  const hasTargetDate = !!targetDate;
  const hasDeadlineDate = !!deadlineDate;
  const hasAnyDate = hasTargetDate || hasDeadlineDate;

  // Simplified relative options - only show if target/deadline exists
  const getRelativeOptions = () => {
    const options: Array<{
      label: string;
      value: { type: "relative"; relativeMinutes: number; relativeTo: "target" | "deadline" };
    }> = [];

    if (hasDeadlineDate) {
      options.push(
        { label: "1 hour before deadline", value: { type: "relative", relativeMinutes: 60, relativeTo: "deadline" } },
        { label: "1 day before deadline", value: { type: "relative", relativeMinutes: 24 * 60, relativeTo: "deadline" } },
        { label: "1 week before deadline", value: { type: "relative", relativeMinutes: 7 * 24 * 60, relativeTo: "deadline" } }
      );
    }

    if (hasTargetDate) {
      options.push(
        { label: "1 hour before target", value: { type: "relative", relativeMinutes: 60, relativeTo: "target" } },
        { label: "1 day before target", value: { type: "relative", relativeMinutes: 24 * 60, relativeTo: "target" } },
        { label: "1 week before target", value: { type: "relative", relativeMinutes: 7 * 24 * 60, relativeTo: "target" } }
      );
    }

    return options;
  };

  const relativeOptions = getRelativeOptions();

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionState(granted ? "granted" : "denied");
  };

  const handleSelectRelative = (option: {
    type: "relative";
    relativeMinutes: number;
    relativeTo: "target" | "deadline";
  }) => {
    onChange({
      type: "relative",
      relativeMinutes: option.relativeMinutes,
      relativeTo: option.relativeTo,
    });
    onClose();
  };

  const handleSetCustomTime = () => {
    const date = new Date(`${customDate}T${customTime}`);
    onChange({
      type: "absolute",
      absoluteTime: date.getTime(),
    });
    onClose();
  };

  if (!mounted) return null;

  // Mobile: Bottom sheet
  if (isMobileView) {
    // Handle permission states in BottomSheet
    if (permissionState === "default" || permissionState === "unsupported") {
      return (
        <BottomSheet isOpen={true} onClose={onClose} height="auto">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <h2 className="text-base font-medium text-fg-neutral-primary">
                Set Reminder
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-fg-neutral-secondary" />
              </button>
            </div>
            {/* Content */}
            <div
              className="flex-1 overflow-y-auto p-4"
              style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom, env(safe-area-inset-bottom)))' }}
            >
              <p className="text-sm text-fg-neutral-secondary mb-4">
                {permissionState === "unsupported"
                  ? "Your browser doesn't support notifications."
                  : "Allow notifications to set reminders for tasks."}
              </p>
              {permissionState === "default" && (
                <button
                  onClick={handleRequestPermission}
                  className="w-full px-3 py-2.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Enable Notifications
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full px-3 py-2 mt-2 text-sm text-fg-neutral-secondary hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </BottomSheet>
      );
    }

    if (permissionState === "denied") {
      return (
        <BottomSheet isOpen={true} onClose={onClose} height="auto">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <h2 className="text-base font-medium text-fg-neutral-primary">
                Set Reminder
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-fg-neutral-secondary" />
              </button>
            </div>
            {/* Content */}
            <div
              className="flex-1 overflow-y-auto p-4"
              style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom, env(safe-area-inset-bottom)))' }}
            >
              <p className="text-sm text-fg-neutral-secondary mb-4">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
              <button
                onClick={onClose}
                className="w-full px-3 py-2 text-sm text-fg-neutral-secondary hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Close
              </button>
            </div>
          </div>
        </BottomSheet>
      );
    }

    // Normal reminder picker in BottomSheet
    return (
      <BottomSheet isOpen={true} onClose={onClose} height="auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <div>
              <h2 className="text-base font-medium text-fg-neutral-primary">
                Set Reminder
              </h2>
              <p className="text-xs text-fg-neutral-secondary mt-0.5">
                Get notified before target or deadline.
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
          {/* Content */}
          <div
            className="flex-1 overflow-y-auto p-4"
            style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom, env(safe-area-inset-bottom)))' }}
          >
            {/* Relative shortcuts - only if target/deadline exists */}
            {hasAnyDate && relativeOptions.length > 0 && (
              <div className="pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-700 space-y-1">
                {relativeOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectRelative(option.value)}
                    className="w-full px-3 py-2.5 text-sm text-left text-fg-neutral-primary hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {/* Date/time picker - always shown */}
            <div>
              <div className="text-xs text-fg-neutral-secondary mb-2">
                {hasAnyDate ? "Or set a specific time" : "Set a specific date and time"}
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-fg-neutral-secondary mb-1 block">Date</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full h-8 px-2 text-sm bg-bg-neutral-base border border-border-color-neutral rounded-lg appearance-none"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-fg-neutral-secondary mb-1 block">Time</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full h-8 px-2 text-sm bg-bg-neutral-base border border-border-color-neutral rounded-lg appearance-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSetCustomTime}
                className="w-full px-3 py-2.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Set Reminder
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>
    );
  }

  // Desktop: Portal-based dropdown
  // Show permission request if not granted
  if (permissionState === "default" || permissionState === "unsupported") {
    return createPortal(
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
          className="fixed w-72 p-4 bg-bg-neutral-min border border-border-color-neutral rounded-xl shadow-lg z-50"
          style={{ top: position.top, left: position.left }}
        >
          <h3 className="text-sm font-semibold text-fg-neutral-primary">
            Set Reminder
          </h3>
          <p className="text-xs text-fg-neutral-secondary mt-1 mb-3">
            {permissionState === "unsupported"
              ? "Your browser doesn't support notifications."
              : "Allow notifications to set reminders for tasks."}
          </p>
          {permissionState === "default" && (
            <button
              onClick={handleRequestPermission}
              className="w-full px-3 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Enable Notifications
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full px-3 py-2 mt-2 text-sm text-fg-neutral-secondary hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>
      </>,
      document.body
    );
  }

  if (permissionState === "denied") {
    return createPortal(
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
          className="fixed w-72 p-4 bg-bg-neutral-min border border-border-color-neutral rounded-xl shadow-lg z-50"
          style={{ top: position.top, left: position.left }}
        >
          <h3 className="text-sm font-semibold text-fg-neutral-primary">
            Set Reminder
          </h3>
          <p className="text-xs text-fg-neutral-secondary mt-1 mb-3">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
          <button
            onClick={onClose}
            className="w-full px-3 py-2 text-sm text-fg-neutral-secondary hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Close
          </button>
        </div>
      </>,
      document.body
    );
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Picker dropdown */}
      <div
        className="fixed w-72 p-4 bg-bg-neutral-min border border-border-color-neutral rounded-xl shadow-lg z-50"
        style={{ top: position.top, left: position.left }}
      >
        <h3 className="text-sm font-semibold text-fg-neutral-primary">
          Set Reminder
        </h3>
        <p className="text-xs text-fg-neutral-secondary mt-1 mb-3">
          Get notified before target or deadline.
        </p>

        {/* Relative shortcuts - only if target/deadline exists */}
        {hasAnyDate && relativeOptions.length > 0 && (
          <div className="pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-700 space-y-1">
            {relativeOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectRelative(option.value)}
                className="w-full px-3 py-2 text-sm text-left text-fg-neutral-primary hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Date/time picker - always shown */}
        <div>
          <div className="text-xs text-fg-neutral-secondary mb-2">
            {hasAnyDate ? "Or set a specific time" : "Set a specific date and time"}
          </div>
          <div className="flex items-end gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <label className="text-xs text-fg-neutral-secondary mb-1 block">Date</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full h-8 px-2 text-sm bg-bg-neutral-base border border-border-color-neutral rounded-lg appearance-none"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs text-fg-neutral-secondary mb-1 block">Time</label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full h-8 px-2 text-sm bg-bg-neutral-base border border-border-color-neutral rounded-lg appearance-none"
              />
            </div>
          </div>

          <button
            onClick={handleSetCustomTime}
            className="w-full px-3 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Set Reminder
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
