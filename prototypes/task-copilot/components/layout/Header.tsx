"use client";

import { ViewType } from "@/lib/types";
import TabCluster from "./TabCluster";
import SearchBar from "./SearchBar";

interface HeaderProps {
  currentView: ViewType;
  previousView: ViewType | null;
  onViewChange: (view: ViewType) => void;
  onToggleAI: () => void;
  isAIDrawerOpen: boolean;
  inboxCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchFocus: () => void;
}

export default function Header({
  currentView,
  previousView,
  onViewChange,
  onToggleAI,
  isAIDrawerOpen,
  inboxCount,
  searchQuery,
  onSearchChange,
  onSearchFocus,
}: HeaderProps) {
  return (
    <header className="flex-shrink-0 pt-[env(safe-area-inset-top)] bg-white dark:bg-[#0c0c0c] border-b border-zinc-200 dark:border-transparent px-4 lg:px-6">
      {/* Fixed-width left/right containers ensure center stays centered even when right icons disappear */}
      <div className="h-14 flex items-center gap-4">
        {/* Left: Tab Cluster (fixed min-width for symmetry) */}
        <div className="w-auto lg:w-44 flex-shrink-0">
          <TabCluster
            currentView={currentView}
            previousView={previousView}
            onViewChange={onViewChange}
            inboxCount={inboxCount}
          />
        </div>

        {/* Center: Search (expands to fill, content centered) */}
        <div className="flex-1 hidden sm:flex justify-center">
          <div className="w-full max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={onSearchChange}
              onFocus={onSearchFocus}
              currentView={currentView}
            />
          </div>
        </div>
        {/* Mobile: Flex spacer */}
        <div className="flex-1 sm:hidden" />

        {/* Right: Buttons (fixed width matching left for centering) */}
        <div className="w-auto lg:w-44 flex-shrink-0 flex items-center justify-end gap-1">
          {/* Mobile: Search icon */}
          <button
            onClick={onSearchFocus}
            className="sm:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Search"
          >
            <svg
              className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
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
      </div>
    </header>
  );
}
