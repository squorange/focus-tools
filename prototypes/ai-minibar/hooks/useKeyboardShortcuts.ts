'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onToggle: () => void;           // ⌘K / Ctrl+K - toggle expanded
  onEscape?: () => void;          // Escape - close/clear
  onSubmit?: () => void;          // Enter - submit (when not in input)
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onToggle,
  onEscape,
  onSubmit,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // ⌘K / Ctrl+K - Toggle AI assistant
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        onToggle();
        return;
      }

      // Escape - Close/clear (works even when typing)
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape?.();
        return;
      }

      // Don't handle other shortcuts when typing
      if (isTyping) return;

      // Enter - Submit (when not in input)
      if (event.key === 'Enter' && onSubmit) {
        event.preventDefault();
        onSubmit();
        return;
      }
    },
    [enabled, onToggle, onEscape, onSubmit]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;
