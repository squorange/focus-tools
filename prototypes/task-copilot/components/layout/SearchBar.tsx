"use client";

import { ViewType } from "@/lib/types";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  currentView: ViewType;
}

export default function SearchBar({
  value,
  onChange,
  onFocus,
  currentView,
}: SearchBarProps) {
  const isSearchView = currentView === "search";

  return (
    <div className="relative">
      {/* Desktop: Full search bar */}
      <div className="hidden sm:block">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder="Search tasks..."
            className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border transition-colors ${
              isSearchView
                ? "bg-bg-neutral-min border-blue-500 ring-1 ring-blue-500"
                : "bg-zinc-50 dark:bg-zinc-800 border-border-color-neutral hover:border-zinc-300 dark:hover:border-zinc-600"
            } text-fg-neutral-primary placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
          />
          {value && (
            <button
              onClick={() => onChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600"
            >
              <svg
                className="w-4 h-4 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile: Just search icon */}
      <button
        onClick={onFocus}
        className="sm:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        aria-label="Search"
      >
        <svg
          className="w-5 h-5 text-fg-neutral-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </div>
  );
}
