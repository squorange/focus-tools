'use client';

import { useState, useCallback } from 'react';
import { AIAssistantContext, CollapsedContentType } from '@/lib/types';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MOCK_COLLAPSED, MOCK_NUDGES } from '@/lib/mock-responses';
import { ANIMATIONS, WIDTHS } from '@/lib/constants';
import { AIAssistantOverlay } from '../ai-assistant/AIAssistantOverlay';
import { Drawer } from '../ai-assistant/Drawer';
import { ResponseTriggers } from './ResponseTriggers';
import { AnimatePresence } from 'framer-motion';

interface DemoShellProps {
  children?: React.ReactNode;
}

export function DemoShell({ children }: DemoShellProps) {
  const [context, setContext] = useState<AIAssistantContext>('global');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const isDesktop = useIsDesktop();

  // Toggle dark mode class on document root
  const toggleDarkMode = useCallback(() => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const {
    state,
    quickActions,
    expand,
    collapse,
    openDrawer,
    closeDrawer,
    setQuery,
    submitQuery,
    acceptSuggestions,
    dismissResponse,
    setCollapsedContent,
    triggerMockResponse,
  } = useAIAssistant({
    initialContext: context,
  });

  const handleExpand = () => {
    if (state.mode === 'collapsed' && !isAnimating) {
      setIsAnimating(true);
      expand();
      setTimeout(() => setIsAnimating(false), ANIMATIONS.expandDuration * 1000);
    }
  };

  const handleCollapse = () => {
    if (state.mode === 'expanded' && !isAnimating) {
      setIsAnimating(true);
      collapse();
      setTimeout(() => setIsAnimating(false), ANIMATIONS.expandDuration * 1000);
    }
  };

  const handleSetCollapsedContent = (type: CollapsedContentType) => {
    if (type === 'nudge') {
      // Pick a random nudge
      const nudgeKeys = Object.keys(MOCK_NUDGES);
      const randomKey = nudgeKeys[Math.floor(Math.random() * nudgeKeys.length)];
      setCollapsedContent(MOCK_NUDGES[randomKey]);
    } else {
      setCollapsedContent(MOCK_COLLAPSED[type] || MOCK_COLLAPSED.idle);
    }
  };

  const handleTriggerResponse = (key: string) => {
    // First expand if collapsed
    if (state.mode === 'collapsed') {
      expand();
    }
    // Then trigger the response
    setTimeout(() => {
      triggerMockResponse(key);
    }, state.mode === 'collapsed' ? 300 : 0);
  };

  const handleContextChange = (newContext: AIAssistantContext) => {
    setContext(newContext);
    // Reset to idle when changing context
    setCollapsedContent(MOCK_COLLAPSED.idle);
  };

  // Keyboard shortcut handlers
  const handleToggle = useCallback(() => {
    if (state.mode === 'collapsed') {
      expand();
    } else {
      collapse();
    }
  }, [state.mode, expand, collapse]);

  const handleEscape = useCallback(() => {
    if (state.mode === 'expanded') {
      if (state.response) {
        // If there's a response, dismiss it first
        dismissResponse();
      } else if (state.query) {
        // If there's text in input, clear it
        setQuery('');
      } else {
        // Otherwise collapse
        collapse();
      }
    }
  }, [state.mode, state.response, state.query, dismissResponse, setQuery, collapse]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onToggle: handleToggle,
    onEscape: handleEscape,
    enabled: true,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">AI Mini-Bar Prototype</h1>
        <button
          onClick={toggleDarkMode}
          className="text-sm text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 p-2"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Main content area - shifts right on desktop when drawer is open */}
      <main
        className="flex-1 p-4 overflow-y-auto transition-all duration-300"
        style={{
          marginRight: isDesktop && state.mode === 'drawer' ? WIDTHS.drawer : 0,
          // Dynamic bottom padding: more space when palette is expanded to prevent content obstruction
          paddingBottom: state.mode === 'expanded' ? 372 : 120, // expanded: ~300px palette + 72px offset, collapsed: 48px + 72px
        }}
      >
        {/* Context switcher */}
        <div className="mb-6">
          <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide block mb-2">
            Context
          </label>
          <select
            value={context}
            onChange={(e) => handleContextChange(e.target.value as AIAssistantContext)}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-violet-600"
          >
            <option value="global">Global</option>
            <option value="queue">Queue</option>
            <option value="taskDetail">Task Detail</option>
            <option value="focusMode">Focus Mode</option>
            <option value="inbox">Inbox</option>
          </select>
        </div>

        {/* Mock task list */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-3">
            Mock Tasks
          </h3>
          <div className="space-y-2">
            {[
              { title: 'File taxes', done: false, priority: 'high' },
              { title: 'Buy groceries', done: false, priority: 'medium' },
              { title: 'Call mom', done: true, priority: 'low' },
            ].map((task, i) => (
              <div
                key={i}
                className={`
                  flex items-center gap-3 p-3
                  bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700
                  rounded-lg
                  ${task.done ? 'opacity-50' : ''}
                `}
              >
                <span
                  className={`
                    w-4 h-4 rounded border-2
                    ${task.done ? 'bg-green-500 border-green-500' : 'border-zinc-400 dark:border-zinc-600'}
                  `}
                />
                <span className={`flex-1 text-sm ${task.done ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                  {task.title}
                </span>
                <span
                  className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300' : ''}
                    ${task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300' : ''}
                    ${task.priority === 'low' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400' : ''}
                  `}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Response triggers */}
        <ResponseTriggers
          onTriggerResponse={handleTriggerResponse}
          onSetCollapsedContent={handleSetCollapsedContent}
        />

        {/* Debug state */}
        <div className="mt-6 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <h3 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
            State
          </h3>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1 font-mono">
            <div>Mode: <span className="text-violet-600 dark:text-violet-400">{state.mode}</span></div>
            <div>Context: <span className="text-blue-600 dark:text-blue-400">{state.context}</span></div>
            <div>Loading: <span className="text-yellow-600 dark:text-yellow-400">{String(state.isLoading)}</span></div>
            <div>Response: <span className="text-green-600 dark:text-green-400">{state.response?.type || 'null'}</span></div>
            <div>Messages: <span className="text-zinc-600 dark:text-zinc-300">{state.messages.length}</span></div>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-4 p-3 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <h3 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
            Keyboard Shortcuts
          </h3>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <div><kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300">⌘K</kbd> Toggle AI palette</div>
            <div><kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300">Esc</kbd> Clear / Close</div>
            <div><span className="text-zinc-400 dark:text-zinc-500">Swipe down on palette to dismiss</span></div>
          </div>
        </div>

        {children}
      </main>

      {/* No backdrop - content stays visible when palette is open */}

      {/* AI Assistant Overlay (collapsed + expanded modes) */}
      {(state.mode === 'collapsed' || state.mode === 'expanded') && (
        <div className="fixed bottom-[72px] left-0 right-0 z-50 flex px-4 sm:px-0 sm:justify-center">
          <AIAssistantOverlay
            mode={state.mode as 'collapsed' | 'expanded'}
            collapsedContent={state.collapsedContent}
            onExpand={handleExpand}
            query={state.query}
            onQueryChange={setQuery}
            onSubmit={submitQuery}
            isLoading={state.isLoading}
            response={state.response}
            quickActions={quickActions}
            onCollapse={handleCollapse}
            onOpenDrawer={openDrawer}
            onAccept={acceptSuggestions}
            onDismiss={dismissResponse}
            isAnimating={isAnimating}
          />
        </div>
      )}

      {/* Drawer mode (separate transition) */}
      <AnimatePresence>
        {state.mode === 'drawer' && (
          <Drawer
            messages={state.messages}
            query={state.query}
            onQueryChange={setQuery}
            onSubmit={submitQuery}
            isLoading={state.isLoading}
            onClose={closeDrawer}
          />
        )}
      </AnimatePresence>

      {/* Mock tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around z-30">
        {[
          { icon: '🏠', label: 'Home' },
          { icon: '📋', label: 'Tasks' },
          { icon: '🔍', label: 'Search' },
        ].map((tab) => (
          <button
            key={tab.label}
            className="flex flex-col items-center gap-0.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px]">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default DemoShell;
