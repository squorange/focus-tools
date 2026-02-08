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
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-neutral-soft"
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
                ? "bg-bg-neutral-min border-border-input-focus ring-1 ring-focus"
                : "bg-bg-neutral-subtle border-border-color-neutral hover:border-border-color-neutral-hover"
            } text-fg-neutral-primary placeholder:text-fg-neutral-soft focus:outline-none focus:border-border-input-focus focus:ring-1 focus:ring-focus`}
          />
          {value && (
            <button
              onClick={() => onChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-bg-neutral-subtle-hover"
            >
              <svg
                className="w-4 h-4 text-fg-neutral-soft"
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
        className="sm:hidden p-2 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
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
