"use client";

import { useState } from "react";
import { Reminder } from "@/lib/types";
import {
  getRelativeReminderOptions,
  formatReminder,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";

interface ReminderPickerProps {
  reminder: Reminder | null;
  targetDate: string | null;
  deadlineDate: string | null;
  onChange: (reminder: Reminder | null) => void;
  onClose: () => void;
}

export default function ReminderPicker({
  reminder,
  targetDate,
  deadlineDate,
  onChange,
  onClose,
}: ReminderPickerProps) {
  const [mode, setMode] = useState<"relative" | "absolute">(
    reminder?.type === "absolute" ? "absolute" : "relative"
  );
  const [customDate, setCustomDate] = useState<string>(() => {
    if (reminder?.type === "absolute" && reminder.absoluteTime) {
      return new Date(reminder.absoluteTime).toISOString().split("T")[0];
    }
    // Default: targetDate > deadlineDate > tomorrow
    if (targetDate && new Date(targetDate) > new Date()) {
      return targetDate;
    }
    if (deadlineDate && new Date(deadlineDate) > new Date()) {
      return deadlineDate;
    }
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

  const hasTargetDate = !!targetDate;
  const hasDeadlineDate = !!deadlineDate;
  const hasAnyDate = hasTargetDate || hasDeadlineDate;

  const relativeOptions = getRelativeReminderOptions(
    hasTargetDate,
    hasDeadlineDate
  );

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

  const handleRemoveReminder = () => {
    onChange(null);
    onClose();
  };

  // Show permission request if not granted
  if (permissionState === "default" || permissionState === "unsupported") {
    return (
      <div className="absolute right-0 top-full mt-1 py-3 px-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[280px]">
        <div className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          {permissionState === "unsupported"
            ? "Your browser doesn't support notifications."
            : "Allow notifications to set reminders for tasks."}
        </div>
        {permissionState === "default" && (
          <button
            onClick={handleRequestPermission}
            className="w-full px-3 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
          >
            Enable Notifications
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full px-3 py-2 mt-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (permissionState === "denied") {
    return (
      <div className="absolute right-0 top-full mt-1 py-3 px-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[280px]">
        <div className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          Notifications are blocked. Please enable them in your browser settings
          to set reminders.
        </div>
        <button
          onClick={onClose}
          className="w-full px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-10" onClick={onClose} />

      {/* Picker dropdown */}
      <div className="absolute right-0 top-full mt-1 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 min-w-[280px]">
        {/* Current reminder display */}
        {reminder && (
          <div className="px-3 pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-700">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              Current reminder
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {formatReminder(reminder, targetDate, deadlineDate)}
              </span>
              <button
                onClick={handleRemoveReminder}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Mode tabs */}
        {hasAnyDate && (
          <div className="px-3 mb-2">
            <div className="flex bg-zinc-100 dark:bg-zinc-700 rounded-md p-0.5">
              <button
                onClick={() => setMode("relative")}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  mode === "relative"
                    ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Before date
              </button>
              <button
                onClick={() => setMode("absolute")}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  mode === "absolute"
                    ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Specific time
              </button>
            </div>
          </div>
        )}

        {/* Relative options */}
        {mode === "relative" && hasAnyDate && (
          <div className="max-h-[200px] overflow-y-auto">
            {relativeOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectRelative(option.value)}
                className="w-full px-3 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Absolute time picker */}
        {(mode === "absolute" || !hasAnyDate) && (
          <div className="px-3 py-2">
            {!hasAnyDate && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                Set a specific date and time
              </div>
            )}
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded"
              />
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-24 px-2 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded"
              />
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1 mb-3">
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setCustomDate(tomorrow.toISOString().split("T")[0]);
                  setCustomTime("09:00");
                }}
                className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600"
              >
                Tomorrow 9am
              </button>
              <button
                onClick={() => {
                  const nextMonday = new Date();
                  nextMonday.setDate(
                    nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7)
                  );
                  setCustomDate(nextMonday.toISOString().split("T")[0]);
                  setCustomTime("09:00");
                }}
                className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600"
              >
                Next Monday 9am
              </button>
            </div>

            <button
              onClick={handleSetCustomTime}
              className="w-full px-3 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
            >
              Set Reminder
            </button>
          </div>
        )}
      </div>
    </>
  );
}
