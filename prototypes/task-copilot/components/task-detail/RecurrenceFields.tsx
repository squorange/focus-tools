"use client";

import React, { useState, useEffect } from "react";
import { RecurrenceRule } from "@/lib/types";
import { describePattern } from "@/lib/recurring-utils";

interface RecurrenceFieldsProps {
  rule: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "S", fullLabel: "Sunday" },
  { value: 1, label: "M", fullLabel: "Monday" },
  { value: 2, label: "T", fullLabel: "Tuesday" },
  { value: 3, label: "W", fullLabel: "Wednesday" },
  { value: 4, label: "T", fullLabel: "Thursday" },
  { value: 5, label: "F", fullLabel: "Friday" },
  { value: 6, label: "S", fullLabel: "Saturday" },
];

const WEEK_OF_MONTH = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third" },
  { value: 4, label: "Fourth" },
  { value: 5, label: "Last" },
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export default function RecurrenceFields({ rule, onChange }: RecurrenceFieldsProps) {
  // Local state for interval input to allow typing freely
  const [intervalInput, setIntervalInput] = useState(String(rule.interval));

  // Sync local state when rule changes from parent
  useEffect(() => {
    setIntervalInput(String(rule.interval));
  }, [rule.interval]);

  // Helper to update a specific field
  const updateRule = (updates: Partial<RecurrenceRule>) => {
    onChange({ ...rule, ...updates });
  };

  // Handle interval input change - allow any input while typing
  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIntervalInput(e.target.value);
  };

  // Commit interval value on blur
  const handleIntervalBlur = () => {
    const parsed = parseInt(intervalInput);
    const validValue = isNaN(parsed) || parsed < 1 ? 1 : Math.min(parsed, 99);
    setIntervalInput(String(validValue));
    updateRule({ interval: validValue });
  };

  // Toggle a day of week
  const toggleDayOfWeek = (day: number) => {
    const currentDays = rule.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);
    updateRule({ daysOfWeek: newDays.length > 0 ? newDays : null });
  };

  // Get frequency unit label
  const getIntervalUnit = () => {
    switch (rule.frequency) {
      case "daily": return rule.interval === 1 ? "day" : "days";
      case "weekly": return rule.interval === 1 ? "week" : "weeks";
      case "monthly": return rule.interval === 1 ? "month" : "months";
      case "yearly": return rule.interval === 1 ? "year" : "years";
      default: return "days";
    }
  };

  // Pattern description preview
  const patternDescription = describePattern(rule);

  return (
    <div className="space-y-4">
      {/* Pattern Preview */}
      <div className="px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
          {patternDescription}
        </p>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Frequency
        </label>
        <div className="grid grid-cols-4 gap-2">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq.value}
              type="button"
              onClick={() => {
                // Reset frequency-specific fields when changing frequency
                const updates: Partial<RecurrenceRule> = { frequency: freq.value };
                if (freq.value === "daily") {
                  updates.daysOfWeek = null;
                  updates.dayOfMonth = null;
                  updates.weekOfMonth = null;
                } else if (freq.value === "weekly") {
                  updates.dayOfMonth = null;
                  updates.weekOfMonth = null;
                  // Default to current day if no days selected
                  if (!rule.daysOfWeek?.length) {
                    updates.daysOfWeek = [new Date().getDay()];
                  }
                } else if (freq.value === "monthly") {
                  updates.daysOfWeek = null;
                  updates.weekOfMonth = null;
                  // Default to current day of month
                  if (!rule.dayOfMonth) {
                    updates.dayOfMonth = new Date().getDate();
                  }
                } else if (freq.value === "yearly") {
                  updates.daysOfWeek = null;
                  updates.weekOfMonth = null;
                  updates.dayOfMonth = null;
                }
                updateRule(updates);
              }}
              className={`
                px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${rule.frequency === freq.value
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }
              `}
            >
              {freq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interval */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Repeat Every
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={intervalInput}
            onChange={handleIntervalChange}
            onBlur={handleIntervalBlur}
            className="w-20 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {getIntervalUnit()}
          </span>
        </div>
      </div>

      {/* Time */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Time <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          type="time"
          value={rule.time || ""}
          onChange={(e) => updateRule({ time: e.target.value || null })}
          className="w-32 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        {rule.time && (
          <button
            type="button"
            onClick={() => updateRule({ time: null })}
            className="ml-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Clear
          </button>
        )}
      </div>

      {/* Weekly: Days of Week */}
      {rule.frequency === "weekly" && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            On These Days
          </label>
          <div className="flex gap-1">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = rule.daysOfWeek?.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDayOfWeek(day.value)}
                  title={day.fullLabel}
                  className={`
                    w-9 h-9 text-sm font-medium rounded-lg transition-colors
                    ${isSelected
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }
                  `}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          {(!rule.daysOfWeek || rule.daysOfWeek.length === 0) && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Select at least one day
            </p>
          )}
        </div>
      )}

      {/* Monthly: Day of Month OR Week + Day */}
      {rule.frequency === "monthly" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Repeat On
          </label>

          {/* Option 1: Specific day of month */}
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="monthly-day"
              name="monthly-type"
              checked={rule.dayOfMonth !== null}
              onChange={() => {
                updateRule({
                  dayOfMonth: new Date().getDate(),
                  weekOfMonth: null,
                  daysOfWeek: null,
                });
              }}
              className="w-4 h-4 text-violet-600"
            />
            <label htmlFor="monthly-day" className="text-sm text-zinc-700 dark:text-zinc-300">
              Day
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={rule.dayOfMonth || ""}
              onChange={(e) => updateRule({ dayOfMonth: parseInt(e.target.value) || 1 })}
              disabled={rule.dayOfMonth === null}
              className="w-16 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <span className="text-sm text-zinc-500">of the month</span>
          </div>

          {/* Option 2: Week + Day */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="radio"
              id="monthly-week"
              name="monthly-type"
              checked={rule.weekOfMonth !== null}
              onChange={() => {
                updateRule({
                  dayOfMonth: null,
                  weekOfMonth: 1,
                  daysOfWeek: [new Date().getDay()],
                });
              }}
              className="w-4 h-4 text-violet-600"
            />
            <label htmlFor="monthly-week" className="text-sm text-zinc-700 dark:text-zinc-300">
              The
            </label>
            <select
              value={rule.weekOfMonth || 1}
              onChange={(e) => updateRule({ weekOfMonth: parseInt(e.target.value) })}
              disabled={rule.weekOfMonth === null}
              className="px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {WEEK_OF_MONTH.map((week) => (
                <option key={week.value} value={week.value}>
                  {week.label}
                </option>
              ))}
            </select>
            <select
              value={rule.daysOfWeek?.[0] ?? 0}
              onChange={(e) => updateRule({ daysOfWeek: [parseInt(e.target.value)] })}
              disabled={rule.weekOfMonth === null}
              className="px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.fullLabel}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Rollover Setting */}
      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={rule.rolloverIfMissed}
            onChange={(e) => updateRule({ rolloverIfMissed: e.target.checked })}
            className="w-4 h-4 mt-0.5 text-violet-600 rounded focus:ring-violet-500"
          />
          <div>
            <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Keep visible until completed
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              If missed, routine stays in gallery until you complete or skip it
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
