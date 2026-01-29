"use client";

import { useRef } from "react";
import { ViewType, Project } from "@/lib/types";
import TabCluster from "./TabCluster";
import TaskCreationPopover from "../shared/TaskCreationPopover";
import { PanelLeft, Plus, ArrowLeft } from "lucide-react";

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
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean; // Desktop: sidebar expanded (not collapsed)
  // Task creation popover
  taskCreationOpen: boolean;
  onOpenTaskCreation: () => void;
  onCloseTaskCreation: () => void;
  onQuickAddTask: (title: string, projectId: string | null) => void;
  onAddAndOpenTask: (title: string, projectId: string | null) => void;
  projects: Project[];
  onOpenProjectModal?: () => void;
  projectModalOpen?: boolean;
  onOpenProjectModalWithCallback?: (callback: (projectId: string) => void) => void;
  // View title for non-tab views
  viewTitle?: string | null;
  // Back button for filter views
  showBackButton?: boolean;
  onBack?: () => void;
  // Hide navigation (hamburger + TabCluster) for full-screen views like TaskDetail
  hideNavigation?: boolean;
  // Search mode (first-class state)
  isSearchMode?: boolean;
  // Scroll-based header shadow
  isScrolled?: boolean;
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
  onToggleSidebar,
  isSidebarOpen = false,
  taskCreationOpen,
  onOpenTaskCreation,
  onCloseTaskCreation,
  onQuickAddTask,
  onAddAndOpenTask,
  projects,
  onOpenProjectModal,
  projectModalOpen,
  onOpenProjectModalWithCallback,
  viewTitle,
  showBackButton,
  onBack,
  hideNavigation,
  isSearchMode,
  isScrolled = false,
}: HeaderProps) {
  const plusButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <header className={`flex-shrink-0 pt-[env(safe-area-inset-top)] bg-zinc-50 dark:bg-zinc-900 px-4 lg:px-6 transition-shadow duration-200 ${
      isScrolled ? 'shadow-sm' : ''
    }`}>
      <div className="h-14 flex items-center gap-2 relative">
        {/* Left: Hamburger/Back + TabCluster */}
        <div className="flex items-center gap-2">
          {/* Back button for filter/full-screen views */}
          {showBackButton && onBack ? (
            <button
              onClick={onBack}
              className="p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
            </button>
          ) : !hideNavigation ? (
            /* Drawer toggle button (mobile only - desktop toggle is in sidebar) */
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle drawer"
            >
              <PanelLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
            </button>
          ) : null}

          {/* Tab Cluster (Focus/Tasks toggle) - hide when viewTitle or hideNavigation */}
          {!viewTitle && !hideNavigation && (
            <div className={isSidebarOpen ? 'lg:hidden' : ''}>
              <TabCluster
                currentView={currentView}
                previousView={previousView}
                onViewChange={onViewChange}
                inboxCount={inboxCount}
              />
            </div>
          )}
        </div>

        {/* Center: View title for non-tab views */}
        {viewTitle && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-medium text-zinc-900 dark:text-zinc-100">
            {viewTitle}
          </h1>
        )}

        {/* Desktop-only: Show Focus/Tasks title when sidebar is expanded */}
        {!viewTitle && isSidebarOpen && (currentView === 'focus' || currentView === 'tasks') && (
          <h1 className="hidden lg:block absolute left-1/2 -translate-x-1/2 text-base font-medium text-zinc-900 dark:text-zinc-100">
            {currentView === 'focus' ? 'Focus' : 'Tasks'}
          </h1>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Plus button with popover - hidden in settings view */}
        {currentView !== 'settings' && (
          <div className="relative">
            <button
              ref={plusButtonRef}
              onClick={taskCreationOpen ? onCloseTaskCreation : onOpenTaskCreation}
              className="p-2.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
              aria-label={taskCreationOpen ? "Close task creation" : "Add task"}
            >
              <Plus size={20} className="text-violet-600 dark:text-violet-400" />
            </button>

            {/* Task Creation Popover */}
            <TaskCreationPopover
              isOpen={taskCreationOpen}
              onClose={onCloseTaskCreation}
              onQuickAdd={onQuickAddTask}
              onAddAndOpen={onAddAndOpenTask}
              projects={projects}
              anchorRef={plusButtonRef}
              onOpenProjectModal={onOpenProjectModal}
              projectModalOpen={projectModalOpen}
              onOpenProjectModalWithCallback={onOpenProjectModalWithCallback}
            />
          </div>
        )}
      </div>
    </header>
  );
}
