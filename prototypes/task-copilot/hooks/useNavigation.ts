/**
 * useNavigation.ts
 *
 * Hook for navigation state and view-switching logic.
 * Manages sidebar, drawers, search, view routing, and related effects.
 *
 * Usage:
 * const nav = useNavigation(state, setState, { aiAssistant, mainRef });
 */

import { useState, useCallback, useEffect, useRef, Dispatch, SetStateAction, RefObject } from 'react';
import { AppState, ViewType, DrawerType } from '@/lib/types';

export interface UseNavigationOptions {
  aiAssistant: {
    closeDrawer: () => void;
    clearNudge: () => void;
    state: { mode: string };
    expand: () => void;
  };
  mainRef: RefObject<HTMLDivElement>;
  hasHydrated: boolean;
}

export function useNavigation(
  state: AppState,
  setState: Dispatch<SetStateAction<AppState>>,
  options: UseNavigationOptions
) {
  const { aiAssistant, mainRef, hasHydrated } = options;

  // View state
  const [previousView, setPreviousView] = useState<ViewType>('focus');
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [taskCreationOpen, setTaskCreationOpen] = useState(false);
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);

  // Drawer state
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const completedDrawerOpen = activeDrawer === 'completed';

  // Search state
  const [searchInputFocused, setSearchInputFocused] = useState(false);
  const [recentTaskIds, setRecentTaskIds] = useState<string[]>([]);
  const [frozenRecentTaskIds, setFrozenRecentTaskIds] = useState<string[] | null>(null);

  // Filter state
  const [pendingFilter, setPendingFilter] = useState<string | null>(null);
  const [activeTasksTab, setActiveTasksTab] = useState<'staging' | 'routines' | 'on_hold' | 'done'>('staging');

  // Scroll state
  const [isScrolled, setIsScrolled] = useState(false);

  // Focus selection modal state
  const [editingFocusQueueItemId, setEditingFocusQueueItemId] = useState<string | null>(null);

  // ============================================
  // Effects
  // ============================================

  // Save recent task IDs to localStorage
  useEffect(() => {
    if (hasHydrated && recentTaskIds.length > 0) {
      localStorage.setItem('focus-tools-recent-tasks', JSON.stringify(recentTaskIds));
    }
  }, [recentTaskIds, hasHydrated]);

  // Freeze recents when entering search mode, unfreeze when exiting
  useEffect(() => {
    const isSearchActive = searchInputFocused || searchQuery.trim() !== '';
    if (isSearchActive && frozenRecentTaskIds === null) {
      setFrozenRecentTaskIds(recentTaskIds);
    } else if (!isSearchActive && frozenRecentTaskIds !== null) {
      setFrozenRecentTaskIds(null);
    }
  }, [searchInputFocused, searchQuery, frozenRecentTaskIds, recentTaskIds]);

  // Close focus selection modal state when drawer closes
  useEffect(() => {
    if (activeDrawer !== 'focus-selection' && editingFocusQueueItemId) {
      setEditingFocusQueueItemId(null);
    }
  }, [activeDrawer, editingFocusQueueItemId]);

  // ============================================
  // View Navigation
  // ============================================

  const handleViewChange = useCallback((view: ViewType) => {
    aiAssistant.clearNudge();
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    setState((prev) => {
      if (prev.currentView === view) {
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        if (view === 'tasks') {
          setActiveTasksTab('staging');
        }
        return prev;
      }

      return {
        ...prev,
        currentView: view,
        activeTaskId: ['focus', 'tasks', 'inbox', 'search'].includes(view) ? null : prev.activeTaskId,
      };
    });
  }, [aiAssistant, setState, mainRef]);

  const handleOpenTask = useCallback((taskId: string, mode?: 'executing' | 'managing') => {
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    setPreviousView(state.currentView);
    setState((prev) => ({
      ...prev,
      currentView: 'taskDetail',
      activeTaskId: taskId,
      taskDetailMode: mode || 'executing',
    }));
    setRecentTaskIds(prev => {
      const filtered = prev.filter(id => id !== taskId);
      return [taskId, ...filtered].slice(0, 5);
    });
  }, [state.currentView, aiAssistant, setState]);

  const handleBackToList = useCallback(() => {
    if (aiAssistant.state.mode === 'drawer') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(null);
    setState((prev) => ({
      ...prev,
      currentView: previousView === 'taskDetail' || previousView === prev.currentView ? 'focus' : previousView,
      activeTaskId: null,
    }));
  }, [previousView, aiAssistant, setState]);

  const handleToggleTaskDetailMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      taskDetailMode: prev.taskDetailMode === 'executing' ? 'managing' : 'executing',
    }));
  }, [setState]);

  const handleGoToTasks = useCallback(() => {
    setState((prev) => ({ ...prev, currentView: 'tasks' as const }));
  }, [setState]);

  const handleGoToInbox = useCallback(() => {
    setState((prev) => ({ ...prev, currentView: 'inbox' as const }));
  }, [setState]);

  const handleBackToTasks = useCallback(() => {
    setState((prev) => ({ ...prev, currentView: 'tasks' as const }));
  }, [setState]);

  const handleGoToProjects = useCallback(() => {
    setPreviousView(state.currentView);
    setState((prev) => ({ ...prev, currentView: 'projects' as const }));
  }, [state.currentView, setState]);

  // ============================================
  // Drawer Management
  // ============================================

  const handleOpenDrawer = useCallback((drawer: DrawerType) => {
    if (drawer === null) {
      setActiveDrawer(null);
      return;
    }
    if (aiAssistant.state.mode === 'drawer' && drawer !== 'ai') {
      aiAssistant.closeDrawer();
    }
    setActiveDrawer(drawer);
  }, [aiAssistant]);

  const handleCloseDrawer = useCallback(() => {
    setActiveDrawer(null);
  }, []);

  const handleToggleCompletedDrawer = useCallback((open: boolean) => {
    if (open) {
      handleOpenDrawer('completed');
    } else {
      handleCloseDrawer();
    }
  }, [handleOpenDrawer, handleCloseDrawer]);

  const handleOpenFocusSelection = useCallback((queueItemId: string) => {
    setEditingFocusQueueItemId(queueItemId);
    handleOpenDrawer('focus-selection');
  }, [handleOpenDrawer]);

  // ============================================
  // Search & Filter
  // ============================================

  const handleJumpToFilter = useCallback((filter: string) => {
    setPendingFilter(filter);
    setSearchQuery('');
    setSearchInputFocused(false);
    handleViewChange('tasks');
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [handleViewChange]);

  const handleBackToMenu = useCallback(() => {
    setSearchQuery('');
    setSearchInputFocused(false);
    if (document.activeElement instanceof HTMLInputElement) {
      document.activeElement.blur();
    }
  }, []);

  const handleClearPendingFilter = useCallback(() => {
    setPendingFilter(null);
  }, []);

  // ============================================
  // Scroll
  // ============================================

  const handleMainScroll = useCallback(() => {
    if (mainRef.current) {
      setIsScrolled(mainRef.current.scrollTop >= 8);
    }
  }, [mainRef]);

  return {
    // State
    previousView,
    setPreviousView,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    taskCreationOpen,
    setTaskCreationOpen,
    shouldFocusSearch,
    setShouldFocusSearch,
    activeDrawer,
    setActiveDrawer,
    completedDrawerOpen,
    searchInputFocused,
    setSearchInputFocused,
    recentTaskIds,
    setRecentTaskIds,
    frozenRecentTaskIds,
    pendingFilter,
    activeTasksTab,
    setActiveTasksTab,
    isScrolled,
    editingFocusQueueItemId,
    setEditingFocusQueueItemId,
    // Actions
    viewChange: handleViewChange,
    openTask: handleOpenTask,
    backToList: handleBackToList,
    toggleTaskDetailMode: handleToggleTaskDetailMode,
    goToTasks: handleGoToTasks,
    goToInbox: handleGoToInbox,
    backToTasks: handleBackToTasks,
    goToProjects: handleGoToProjects,
    openDrawer: handleOpenDrawer,
    closeDrawer: handleCloseDrawer,
    toggleCompletedDrawer: handleToggleCompletedDrawer,
    openFocusSelection: handleOpenFocusSelection,
    jumpToFilter: handleJumpToFilter,
    backToMenu: handleBackToMenu,
    clearPendingFilter: handleClearPendingFilter,
    mainScroll: handleMainScroll,
  };
}

export default useNavigation;
