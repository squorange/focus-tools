"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ViewType, Task, Project } from "@/lib/types";
import {
  Search,
  Target,
  ListTodo,
  FolderOpen,
  PanelLeft,
  PanelLeftClose,
  Flag,
  Clock,
  CheckCircle,
  ChevronRight,
  XCircle,
  X,
  Bell,
  Settings,
} from "lucide-react";
// Note: ArrowLeft removed - "Back to menu" replaced by X button in search bar
import { searchTasks, buildProjectMap, SearchResult, getSearchPreview } from "@/lib/utils";

interface FilterCounts {
  needsAttention: number;
  highPriority: number;
  waiting: number;
  deferred: number;
  completed: number;
  archived: number;
  projects: number;
}

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchInputFocus: () => void;
  onSearchInputBlur: () => void;
  searchInputFocused: boolean;
  inboxCount: number;
  todayCount?: number;
  notificationCount?: number;
  // Auto-focus search input
  shouldFocusSearch?: boolean;
  onSearchFocused?: () => void;
  // Jump To filter shortcuts
  filterCounts?: FilterCounts;
  onJumpToFilter?: (filter: string) => void;
  // Recent tasks
  recentTasks?: Task[];
  onOpenTask?: (taskId: string) => void;
  // Back to menu (exit search mode)
  onBackToMenu?: () => void;
  // For search results
  projects?: Project[];
  tasks?: Task[];
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
  badge?: number;
}

function NavItem({ icon, label, isActive, onClick, isCollapsed, badge }: NavItemProps) {
  const hasBadge = badge !== undefined && badge > 0;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center px-3 py-2.5 rounded-lg
        transition-all duration-300 ease-in-out
        ${isActive
          ? "bg-bg-accent-subtle text-fg-accent-primary"
          : "text-fg-neutral-primary hover:bg-bg-neutral-subtle"
        }
        ${isCollapsed ? "justify-center relative gap-0" : "gap-3"}
      `}
      title={isCollapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {/* Label and badge - fade instead of instant hide */}
      <span
        className={`
          flex-1 text-left text-sm font-medium whitespace-nowrap overflow-hidden
          transition-opacity duration-200
          ${isCollapsed ? "opacity-0 w-0" : "opacity-100"}
        `}
      >
        {label}
      </span>
      {hasBadge && (
        <span
          className={`
            flex-shrink-0 bg-bg-accent-high text-fg-neutral-inverse-primary text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center
            transition-opacity duration-200
            ${isCollapsed ? "opacity-0 absolute" : "opacity-100"}
          `}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {/* Collapsed badge indicator dot */}
      {isCollapsed && hasBadge && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-bg-accent-high rounded-full" />
      )}
    </button>
  );
}

// Jump To Filter Row (for search empty state)
interface JumpToRowProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}

function JumpToRow({ icon, label, count, onClick }: JumpToRowProps) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent search input blur
        onClick();
      }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-neutral-subtle transition-colors text-left group"
    >
      <span className="flex-shrink-0 text-fg-neutral-secondary">{icon}</span>
      <span className="flex-1 text-sm font-medium text-fg-neutral-primary">
        {label}
      </span>
      {count > 0 && (
        <span className="text-sm text-fg-neutral-soft tabular-nums">
          {count}
        </span>
      )}
      <ChevronRight
        size={16}
        className="text-fg-neutral-softest group-hover:text-fg-neutral-soft transition-colors"
      />
    </button>
  );
}

// Search Result Row
interface SearchResultRowProps {
  result: SearchResult;
  query: string;
  onClick: () => void;
}

function SearchResultRow({ result, query, onClick }: SearchResultRowProps) {
  const { task, matchLocations } = result;
  const preview = getSearchPreview(result, query);
  const titleHasMatch = matchLocations.includes('title');

  // Status badge colors - using semantic tokens
  const statusColors = {
    inbox: "bg-bg-status-inbox-subtle text-fg-status-inbox",
    pool: "bg-bg-status-ready-subtle text-fg-status-ready",
    complete: "bg-bg-status-completed-subtle text-fg-status-completed",
    archived: "bg-bg-status-archived-subtle text-fg-status-archived",
  };

  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent search input blur
        onClick();
      }}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${statusColors[task.status as keyof typeof statusColors] || statusColors.pool}`}>
          {task.status}
        </span>
        <span className="text-sm text-fg-neutral-primary truncate flex-1">
          {titleHasMatch ? (
            <HighlightedText text={task.title} query={query} />
          ) : (
            task.title
          )}
        </span>
      </div>
      {preview.text && (
        <p className="text-xs text-fg-neutral-secondary mt-1 truncate pl-[52px]">
          {preview.type === 'step' && <span className="text-fg-accent-primary mr-1">→</span>}
          {preview.type === 'snippet' ? (
            <HighlightedText text={preview.text} query={query} />
          ) : (
            preview.text
          )}
        </p>
      )}
    </button>
  );
}

// Highlight text matching search query
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return <>{text}</>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <mark className="bg-bg-attention-subtle text-inherit rounded-sm px-0.5">
        {match}
      </mark>
      {after}
    </>
  );
}

// Recent Task Row
interface RecentTaskRowProps {
  task: Task;
  onClick: () => void;
}

function RecentTaskRow({ task, onClick }: RecentTaskRowProps) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent search input blur
        onClick();
      }}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
    >
      <span className="text-sm text-fg-neutral-primary truncate block">
        {task.title}
      </span>
    </button>
  );
}

export default function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
  currentView,
  onNavigate,
  searchQuery,
  onSearchChange,
  onSearchInputFocus,
  onSearchInputBlur,
  searchInputFocused,
  inboxCount,
  todayCount = 0,
  notificationCount = 0,
  shouldFocusSearch,
  onSearchFocused,
  filterCounts,
  onJumpToFilter,
  recentTasks,
  onOpenTask,
  onBackToMenu,
  projects,
  tasks,
}: SidebarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);

  // Derived: is search active? (query or focused)
  const isSearchActive = searchInputFocused || searchQuery.trim() !== '';

  // Build project map for search
  const projectMap = useMemo(() => buildProjectMap(projects || []), [projects]);

  // Search results (memoized)
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim() || !tasks) return [];
    const activeTasks = tasks.filter((t) => !t.deletedAt);
    return searchTasks(activeTasks, searchQuery, projectMap);
  }, [searchQuery, tasks, projectMap]);

  // Auto-focus search input when requested
  useEffect(() => {
    if (shouldFocusSearch && searchInputRef.current && !isCollapsed) {
      // Small delay to allow sidebar to expand first
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
        onSearchFocused?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldFocusSearch, isCollapsed, onSearchFocused]);

  // Handle swipe gesture for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientX - touchStart;
    // Only track leftward swipes (negative delta)
    if (delta < 0) {
      setTouchDelta(delta);
    }
  };

  const handleTouchEnd = () => {
    // If swiped left more than 100px, close sidebar
    if (touchDelta < -100) {
      onClose();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  const handleNavigation = (view: ViewType) => {
    onNavigate(view);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const sidebarWidth = isCollapsed ? 64 : 320;

  return (
    <>
      {/* Sidebar container */}
      <div
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          fixed top-0 left-0 bottom-0 z-50 bg-bg-neutral-min
          border-r border-border-color-neutral-subtle
          transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${/* Mobile: slide in/out based on isOpen, wider to show less content */
            isOpen ? "translate-x-0 max-lg:!w-[calc(100vw-72px)]" : "-translate-x-full lg:translate-x-0"
          }
        `}
        style={{
          width: sidebarWidth,
          willChange: 'width, transform',
          // Apply swipe delta for visual feedback
          transform: touchDelta < 0
            ? `translateX(${touchDelta}px)`
            : undefined,
        }}
      >
        {/* Safe area padding for iOS */}
        <div className="pt-[env(safe-area-inset-top)] h-full flex flex-col">
          {/* Header with drawer toggle (desktop only) - matches main header styling */}
          <div className={`
            flex-shrink-0 h-14 hidden lg:flex items-center
            ${isCollapsed ? "justify-center" : "px-4"}
          `}>
            {/* Drawer toggle - centered when collapsed, left-aligned when expanded */}
            <button
              onClick={onToggleCollapse}
              className="p-2.5 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
              aria-label={isCollapsed ? "Expand drawer" : "Collapse drawer"}
            >
              {isCollapsed ? (
                <PanelLeft size={20} className="text-fg-neutral-secondary" />
              ) : (
                <PanelLeftClose size={20} className="text-fg-neutral-secondary" />
              )}
            </button>
          </div>

          {/* Search - h-14 matches header height */}
          <div className={`
            h-14 flex items-center
            ${isCollapsed ? "justify-center" : "gap-2 px-3"}
          `}>
            {isCollapsed ? (
              /* Collapsed: Search icon button - matches NavItem styling */
              <button
                onClick={() => {
                  onToggleCollapse();
                  setTimeout(() => searchInputRef.current?.focus(), 300);
                }}
                className="p-2.5 rounded-lg hover:bg-bg-neutral-subtle transition-colors"
                title="Search"
              >
                <Search size={20} className="text-fg-neutral-secondary" />
              </button>
            ) : (
              /* Expanded: Full search field */
              <>
                <div className="relative flex-1">
                  <Search
                    size={20}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-neutral-soft"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={onSearchInputFocus}
                    onBlur={onSearchInputBlur}
                    className="w-full pl-10 pr-8 py-2.5 text-sm bg-bg-neutral-subtle
                      border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus
                      text-fg-neutral-primary placeholder:text-fg-neutral-soft"
                  />
                  {/* Clear button - inside input, shows when text exists */}
                  {searchQuery && (
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        onSearchChange('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-fg-neutral-soft hover:text-fg-neutral-secondary transition-colors"
                      title="Clear search"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>

                {/* Exit search mode button - outside input, visible when search active */}
                {isSearchActive && (
                  <button
                    onClick={onBackToMenu}
                    className="p-1.5 rounded-lg hover:bg-bg-neutral-subtle-hover transition-colors flex-shrink-0"
                    title="Exit search"
                  >
                    <X size={20} className="text-fg-neutral-secondary" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Navigation / Search Content */}
          <nav className={`flex-1 overflow-y-auto pt-2 px-3 pb-3 ${isSearchActive ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom))]' : ''}`}>
            {/* Search Mode: Empty State (Jump To + Recent) OR Results */}
            {isSearchActive && !isCollapsed ? (
              <div className="space-y-1">
                {searchQuery.trim() ? (
                  /* Search Results */
                  <>
                    {searchResults.length > 0 ? (
                      <>
                        <p className="text-xs font-medium text-fg-neutral-secondary px-3 py-2">
                          Tasks ({searchResults.length})
                        </p>
                        <div className="space-y-1">
                          {searchResults.slice(0, 10).map((result) => (
                            <SearchResultRow
                              key={result.task.id}
                              result={result}
                              query={searchQuery}
                              onClick={() => onOpenTask?.(result.task.id)}
                            />
                          ))}
                        </div>
                        {searchResults.length > 10 && (
                          <p className="text-xs text-fg-neutral-soft px-1 mt-2">
                            +{searchResults.length - 10} more results
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-fg-neutral-secondary">
                        No tasks found matching "{searchQuery}"
                      </div>
                    )}
                  </>
                ) : (
                  /* Search Empty State: Jump To + Recent */
                  <>
                    {/* Jump To Filters */}
                    {filterCounts && onJumpToFilter && (
                      <>
                        <p className="text-xs font-medium text-fg-neutral-secondary px-3 py-2">
                          Jump to
                        </p>
                        <JumpToRow
                          icon={<Flag size={18} />}
                          label="High Priority"
                          count={filterCounts.highPriority}
                          onClick={() => onJumpToFilter("high_priority")}
                        />
                        <JumpToRow
                          icon={<Clock size={18} />}
                          label="On Hold"
                          count={filterCounts.waiting + filterCounts.deferred}
                          onClick={() => onJumpToFilter("on_hold")}
                        />
                        <JumpToRow
                          icon={<CheckCircle size={18} />}
                          label="Done"
                          count={filterCounts.completed + filterCounts.archived}
                          onClick={() => onJumpToFilter("done")}
                        />
                      </>
                    )}

                    {/* Recent Tasks */}
                    {recentTasks && recentTasks.length > 0 && (
                      <>
                        <div className="pt-2" />
                        <p className="text-xs font-medium text-fg-neutral-secondary px-3 py-2">
                          Recent
                        </p>
                        {recentTasks.map((task) => (
                          <RecentTaskRow
                            key={task.id}
                            task={task}
                            onClick={() => onOpenTask?.(task.id)}
                          />
                        ))}
                      </>
                    )}

                  </>
                )}
              </div>
            ) : (
              /* Normal Nav Menu - sections separated so divider spacing works */
              <>
                {/* Primary nav: Focus + Tasks */}
                <div className="space-y-4">
                  <NavItem
                    icon={<Target size={20} />}
                    label="Focus"
                    isActive={currentView === "focus" || currentView === "focusMode"}
                    onClick={() => handleNavigation("focus")}
                    isCollapsed={isCollapsed}
                    badge={todayCount}
                  />
                  <NavItem
                    icon={<ListTodo size={20} />}
                    label="Tasks"
                    isActive={currentView === "tasks" || currentView === "inbox"}
                    onClick={() => handleNavigation("tasks")}
                    isCollapsed={isCollapsed}
                    badge={inboxCount}
                  />
                </div>

                {/* Separator - NOT inside space-y-1, so my-4 works */}
                <div className="my-4 border-t border-border-color-neutral" />

                {/* Secondary nav: Projects + Notifications */}
                <div className="space-y-4">
                  <NavItem
                    icon={<FolderOpen size={20} />}
                    label="Projects"
                    isActive={currentView === "projects"}
                    onClick={() => handleNavigation("projects")}
                    isCollapsed={isCollapsed}
                  />
                  <NavItem
                    icon={<Bell size={20} />}
                    label="Notifications"
                    isActive={currentView === "notifications"}
                    onClick={() => handleNavigation("notifications")}
                    isCollapsed={isCollapsed}
                    badge={notificationCount}
                  />
                </div>
              </>
            )}
          </nav>

          {/* Settings + Data management at bottom - only show when not in search mode */}
          {!isSearchActive && (
            <div className="flex-shrink-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-1">
              <NavItem
                icon={<Settings size={20} />}
                label="Settings"
                isActive={currentView === "settings"}
                onClick={() => handleNavigation("settings")}
                isCollapsed={isCollapsed}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
