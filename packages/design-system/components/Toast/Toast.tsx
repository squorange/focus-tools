'use client';

import { useEffect } from 'react';

export interface ToastData {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

/**
 * Individual toast notification item.
 *
 * @example
 * ```tsx
 * <ToastItem
 *   toast={{ id: '1', message: 'Saved!', type: 'success' }}
 *   onDismiss={(id) => removeToast(id)}
 * />
 * ```
 */
export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const variantClasses = {
    info: 'bg-bg-neutral-inverse text-fg-neutral-inverse-primary',
    success: 'bg-bg-positive-high text-white',
    warning: 'bg-bg-attention-high text-white',
    error: 'bg-bg-alert-high text-white',
  }[toast.type];

  return (
    <div
      className={`${variantClasses} rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-md animate-slide-up`}
      role="alert"
    >
      {/* Icon */}
      {toast.type === 'success' && (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {toast.type === 'error' && (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {toast.type === 'warning' && (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      )}
      {toast.type === 'info' && (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}

      {/* Message */}
      <span className="flex-1 text-sm font-medium">{toast.message}</span>

      {/* Action button */}
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            onDismiss(toast.id);
          }}
          className="px-2.5 py-1 text-sm font-medium opacity-90 hover:opacity-100 bg-white/20 hover:bg-white/30 rounded transition-colors"
        >
          {toast.action.label}
        </button>
      )}

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 opacity-70 hover:opacity-100 rounded transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
  className?: string;
}

/**
 * Container for displaying multiple toast notifications.
 *
 * @example
 * ```tsx
 * <ToastContainer
 *   toasts={toasts}
 *   onDismiss={(id) => setToasts(t => t.filter(t => t.id !== id))}
 * />
 * ```
 */
export function ToastContainer({ toasts, onDismiss, className = '' }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 px-4 ${className}`}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default ToastContainer;
