/**
 * useToasts.ts
 *
 * Hook for toast notification state and handlers.
 * Manages the toast array and provides showToast/dismissToast functions.
 *
 * Usage:
 * const { toasts, showToast, dismissToast } = useToasts();
 */

import { useState, useCallback } from 'react';
import { ToastData } from '@design-system/components';
import { generateId } from '@/lib/types';

export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = generateId();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}

export default useToasts;
