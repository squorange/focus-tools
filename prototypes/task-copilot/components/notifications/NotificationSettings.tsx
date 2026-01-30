"use client";

import { useState } from "react";
import { ChevronRight, Download, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserSettings } from "@/lib/types";

interface SettingsViewProps {
  userSettings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => void;
  onExportData?: () => void;
  onImportData?: () => void;
}

type ScopeOption = {
  value: UserSettings['startPokeDefault'];
  label: string;
};

type BufferOption = {
  value: number | 'percentage';
  label: string;
};

type CooldownOption = {
  value: number;
  label: string;
};

export default function SettingsView({
  userSettings,
  onUpdateSettings,
  onExportData,
  onImportData,
}: SettingsViewProps) {
  const [showScopePicker, setShowScopePicker] = useState(false);
  const [showBufferPicker, setShowBufferPicker] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showDayOffsetMoreInfo, setShowDayOffsetMoreInfo] = useState(false);
  const [showQuietHoursMoreInfo, setShowQuietHoursMoreInfo] = useState(false);
  const [showCooldownPicker, setShowCooldownPicker] = useState(false);

  const scopeOptions: ScopeOption[] = [
    { value: 'all', label: 'All tasks' },
    { value: 'routines_only', label: 'Routines only' },
    { value: 'tasks_only', label: 'One-off tasks only' },
    { value: 'none', label: 'Per-task only' },
  ];

  const bufferOptions: BufferOption[] = [
    { value: 0, label: 'None' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 'percentage', label: '15% of duration (min 5m)' },
  ];

  const cooldownOptions: CooldownOption[] = [
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '60 minutes' },
  ];

  // Get current scope label
  const currentScopeLabel = scopeOptions.find(
    opt => opt.value === userSettings.startPokeDefault
  )?.label || 'All tasks';

  // Get current buffer label
  const currentBufferLabel = userSettings.startPokeBufferPercentage
    ? '15% of duration'
    : bufferOptions.find(opt => opt.value === userSettings.startPokeBufferMinutes)?.label || '10 minutes';

  // Get current cooldown label
  const currentCooldownLabel = cooldownOptions.find(
    opt => opt.value === userSettings.nudgeCooldownMinutes
  )?.label || '15 minutes';

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Start Time Poke section */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden">
          {/* Toggle row */}
          <div className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Start Time Poke
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Calculates when to start to finish on time.{' '}
                <button
                  onClick={() => setShowMoreInfo(!showMoreInfo)}
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {showMoreInfo ? 'Less info' : 'More info'}
                </button>
              </p>
            </div>
            {/* iOS-style toggle - fixed positioning */}
            <button
              onClick={() => onUpdateSettings({ startPokeEnabled: !userSettings.startPokeEnabled })}
              className={`
                relative w-[51px] h-[31px] rounded-full transition-colors flex-shrink-0
                ${userSettings.startPokeEnabled
                  ? 'bg-violet-500'
                  : 'bg-zinc-300 dark:bg-zinc-600'
                }
              `}
            >
              <span
                className={`
                  absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-transform duration-200
                  ${userSettings.startPokeEnabled ? 'translate-x-[20px]' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* More info expandable section */}
          <AnimatePresence>
            {showMoreInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <p className="mb-2">Start Time Poke calculates when you need to start a task to finish on time:</p>
                    <div className="font-mono bg-white dark:bg-zinc-950 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 text-xs">
                      Poke Time = Due Time - Duration - Buffer
                    </div>
                    <p className="mt-2">You'll receive a notification when it's time to start, with quick access to begin focusing.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings rows - animated expansion when enabled */}
          <AnimatePresence>
            {userSettings.startPokeEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {/* Scope row */}
                  <button
                    onClick={() => setShowScopePicker(true)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">Poke scope</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{currentScopeLabel}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </button>

                  {/* Buffer row */}
                  <button
                    onClick={() => setShowBufferPicker(true)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">Buffer time</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{currentBufferLabel}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Day Offset section */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden">
          {/* Toggle row */}
          <div className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Day Offset
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {userSettings.dayStartHour > 0
                  ? `Your day runs ${userSettings.dayStartHour}:00 AM → ${userSettings.dayStartHour}:00 AM.`
                  : 'Your day runs midnight → midnight.'
                }{' '}
                <button
                  onClick={() => setShowDayOffsetMoreInfo(!showDayOffsetMoreInfo)}
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {showDayOffsetMoreInfo ? 'Less info' : 'More info'}
                </button>
              </p>
            </div>
            {/* iOS-style toggle */}
            <button
              onClick={() => onUpdateSettings({
                dayStartHour: userSettings.dayStartHour > 0 ? 0 : 5
              })}
              className={`
                relative w-[51px] h-[31px] rounded-full transition-colors flex-shrink-0
                ${userSettings.dayStartHour > 0
                  ? 'bg-violet-500'
                  : 'bg-zinc-300 dark:bg-zinc-600'
                }
              `}
            >
              <span
                className={`
                  absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-transform duration-200
                  ${userSettings.dayStartHour > 0 ? 'translate-x-[20px]' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* More info expandable section */}
          <AnimatePresence>
            {showDayOffsetMoreInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-500 dark:text-zinc-400 space-y-2">
                    <p>This affects:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>When routines reset and show as overdue</li>
                      <li>How "All done for today" is calculated</li>
                      <li>Streak tracking for recurring tasks</li>
                    </ul>
                    <p className="text-xs pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      {userSettings.dayStartHour > 0
                        ? `Tasks completed before ${userSettings.dayStartHour}:00 AM count as yesterday.`
                        : 'Tasks completed after midnight count as the new day.'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings rows - animated expansion when enabled */}
          <AnimatePresence>
            {userSettings.dayStartHour > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {/* Day start time row */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">Day starts at</span>
                    <select
                      value={userSettings.dayStartHour}
                      onChange={(e) => onUpdateSettings({ dayStartHour: parseInt(e.target.value, 10) })}
                      className="text-sm text-zinc-500 dark:text-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 text-right cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}:00 AM
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quiet Hours section */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden">
          {/* Toggle row */}
          <div className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Quiet Hours
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Silence non-critical nudges during set hours.{' '}
                <button
                  onClick={() => setShowQuietHoursMoreInfo(!showQuietHoursMoreInfo)}
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {showQuietHoursMoreInfo ? 'Less info' : 'More info'}
                </button>
              </p>
            </div>
            {/* iOS-style toggle */}
            <button
              onClick={() => onUpdateSettings({ quietHoursEnabled: !userSettings.quietHoursEnabled })}
              className={`
                relative w-[51px] h-[31px] rounded-full transition-colors flex-shrink-0
                ${userSettings.quietHoursEnabled
                  ? 'bg-violet-500'
                  : 'bg-zinc-300 dark:bg-zinc-600'
                }
              `}
            >
              <span
                className={`
                  absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-transform duration-200
                  ${userSettings.quietHoursEnabled ? 'translate-x-[20px]' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* More info expandable section */}
          <AnimatePresence>
            {showQuietHoursMoreInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-500 dark:text-zinc-400 space-y-2">
                    <p>During quiet hours, non-critical nudges are silenced.</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Critical priority tasks will still push through</li>
                      <li>Quieted nudges update the badge count instead</li>
                      <li>You can review silenced nudges in Notifications</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings rows - animated expansion when enabled */}
          <AnimatePresence>
            {userSettings.quietHoursEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {/* Start time row */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">Starts at</span>
                    <input
                      type="time"
                      value={userSettings.quietHoursStart || '22:00'}
                      onChange={(e) => onUpdateSettings({ quietHoursStart: e.target.value })}
                      className="text-sm text-zinc-500 dark:text-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 text-right cursor-pointer"
                    />
                  </div>

                  {/* End time row */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">Ends at</span>
                    <input
                      type="time"
                      value={userSettings.quietHoursEnd || '07:00'}
                      onChange={(e) => onUpdateSettings({ quietHoursEnd: e.target.value })}
                      className="text-sm text-zinc-500 dark:text-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 text-right cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nudge Cooldown section */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden">
          <div className="p-4">
            <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
              Nudge Cooldown
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Minimum time between nudges for the same task.
            </p>
          </div>
          <div className="border-t border-zinc-200 dark:divide-zinc-800">
            <button
              onClick={() => setShowCooldownPicker(true)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="text-sm text-zinc-900 dark:text-zinc-100">Cooldown period</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{currentCooldownLabel}</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Data section */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
          {/* Export row */}
          {onExportData && (
            <button
              onClick={onExportData}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-zinc-400" />
                <div>
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">Export Data</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Download all tasks and settings as JSON</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          )}

          {/* Import row */}
          {onImportData && (
            <button
              onClick={onImportData}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-zinc-400" />
                <div>
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">Import Data</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Restore from a previously exported file</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          )}
        </div>
      </div>

      {/* Scope Picker Modal */}
      {showScopePicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowScopePicker(false)}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm max-h-[70vh] overflow-hidden flex flex-col">
            <div className="px-6 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between shrink-0">
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Poke scope</span>
              <button
                onClick={() => setShowScopePicker(false)}
                className="text-sm font-medium text-violet-600 dark:text-violet-400"
              >
                Done
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-1">
              {scopeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onUpdateSettings({ startPokeDefault: option.value });
                    setShowScopePicker(false);
                  }}
                  className={`
                    w-full px-4 py-3 rounded-lg text-left text-sm transition-colors
                    ${userSettings.startPokeDefault === option.value
                      ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Buffer Picker Modal */}
      {showBufferPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowBufferPicker(false)}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm max-h-[70vh] overflow-hidden flex flex-col">
            <div className="px-6 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between shrink-0">
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Buffer time</span>
              <button
                onClick={() => setShowBufferPicker(false)}
                className="text-sm font-medium text-violet-600 dark:text-violet-400"
              >
                Done
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {bufferOptions.map((option) => {
                const isSelected = option.value === 'percentage'
                  ? userSettings.startPokeBufferPercentage
                  : !userSettings.startPokeBufferPercentage && userSettings.startPokeBufferMinutes === option.value;

                return (
                  <button
                    key={String(option.value)}
                    onClick={() => {
                      if (option.value === 'percentage') {
                        onUpdateSettings({ startPokeBufferPercentage: true });
                      } else {
                        onUpdateSettings({
                          startPokeBufferPercentage: false,
                          startPokeBufferMinutes: option.value as number,
                        });
                      }
                      setShowBufferPicker(false);
                    }}
                    className={`
                      w-full px-4 py-3 rounded-lg text-left text-sm transition-colors
                      ${isSelected
                        ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700 shrink-0">
              Buffer is extra time before the deadline to account for transitions.
            </p>
          </div>
        </div>
      )}

      {/* Cooldown Picker Modal */}
      {showCooldownPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCooldownPicker(false)}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm max-h-[70vh] overflow-hidden flex flex-col">
            <div className="px-6 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between shrink-0">
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nudge cooldown</span>
              <button
                onClick={() => setShowCooldownPicker(false)}
                className="text-sm font-medium text-violet-600 dark:text-violet-400"
              >
                Done
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {cooldownOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onUpdateSettings({ nudgeCooldownMinutes: option.value });
                    setShowCooldownPicker(false);
                  }}
                  className={`
                    w-full px-4 py-3 rounded-lg text-left text-sm transition-colors
                    ${userSettings.nudgeCooldownMinutes === option.value
                      ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700 shrink-0">
              Prevents repeated nudges for the same task within this period.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
