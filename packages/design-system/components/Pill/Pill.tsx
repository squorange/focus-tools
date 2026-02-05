'use client';

import React from 'react';

export type PillVariant =
  | 'default'
  | 'filled'
  | 'empty'
  | 'locked'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'priority-high'
  | 'priority-medium'
  | 'priority-low'
  | 'status-completed'
  | 'status-today'
  | 'status-focus'
  | 'status-waiting'
  | 'status-deferred'
  | 'status-ready'
  | 'status-inbox'
  | 'status-archived'
  | 'health-healthy'
  | 'health-at-risk'
  | 'health-critical';

export type PillSize = 'xs' | 'sm' | 'md' | 'lg';

export interface PillProps {
  /** Content to display in the pill */
  children: React.ReactNode;
  /** Visual variant */
  variant?: PillVariant;
  /** Size preset */
  size?: PillSize;
  /** Optional icon (Lucide icon or emoji string) */
  icon?: React.ReactNode;
  /** Optional trailing icon */
  trailingIcon?: React.ReactNode;
  /** Color dot (for project pills) */
  colorDot?: string;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  /** Whether the pill is interactive */
  interactive?: boolean;
  /** Additional className */
  className?: string;
  /** Render as button (default) or span */
  as?: 'button' | 'span';
  /** Disabled state (only for button) */
  disabled?: boolean;
}

const sizeClasses: Record<PillSize, string> = {
  xs: 'px-1 py-0.5 text-[10px] gap-0.5',
  sm: 'px-1.5 py-0.5 text-xs gap-1',
  md: 'px-2 py-1 text-xs gap-1',
  lg: 'px-2.5 py-1.5 text-sm gap-1.5',
};

const iconSizeClasses: Record<PillSize, string> = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

const variantClasses: Record<PillVariant, string> = {
  // Base variants (using semantic tokens - dark mode handled by CSS vars)
  default: 'bg-bg-transparent-low text-fg-neutral-spot-readable',
  filled: 'bg-bg-neutral-subtle text-fg-neutral-secondary border border-border-color-neutral',
  empty: 'bg-transparent text-fg-neutral-soft border border-dashed border-border-color-neutral',
  locked: 'bg-bg-neutral-subtle text-fg-neutral-disabled border border-border-color-neutral opacity-60',

  // Feedback variants
  success: 'bg-bg-positive-subtle text-fg-positive-primary',
  warning: 'bg-bg-attention-subtle text-fg-attention-primary',
  error: 'bg-bg-alert-subtle text-fg-alert-primary',
  info: 'bg-bg-information-subtle text-fg-information-primary',

  // Priority variants
  'priority-high': 'bg-bg-alert-subtle text-fg-alert-secondary',
  'priority-medium': 'bg-bg-attention-subtle text-fg-attention-secondary',
  'priority-low': 'bg-bg-positive-subtle text-fg-positive-secondary',

  // Status variants
  'status-completed': 'bg-bg-status-completed-subtle text-fg-status-completed',
  'status-today': 'bg-bg-status-today-subtle text-fg-status-today',
  'status-focus': 'bg-bg-status-focus-subtle text-fg-status-focus',
  'status-waiting': 'bg-bg-status-waiting-subtle text-fg-status-waiting',
  'status-deferred': 'bg-bg-status-deferred-subtle text-fg-status-deferred',
  'status-ready': 'bg-bg-status-ready-subtle text-fg-status-ready',
  'status-inbox': 'bg-bg-status-inbox-subtle text-fg-status-inbox',
  'status-archived': 'bg-bg-status-archived-subtle text-fg-status-archived',

  // Health variants
  'health-healthy': 'bg-bg-positive-subtle text-fg-positive-primary',
  'health-at-risk': 'bg-bg-attention-subtle text-fg-attention-primary',
  'health-critical': 'bg-bg-alert-subtle text-fg-alert-primary',
};

/**
 * Pill - A versatile badge/tag component for status indicators, labels, and interactive chips.
 *
 * @example
 * ```tsx
 * // Simple label
 * <Pill variant="default">Label</Pill>
 *
 * // Status pill
 * <Pill variant="status-completed" icon={<Check />}>Done</Pill>
 *
 * // Interactive pill
 * <Pill variant="filled" onClick={() => {}}>Click me</Pill>
 *
 * // Project pill with color dot
 * <Pill colorDot="#7c3aed">Work Project</Pill>
 * ```
 */
export function Pill({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  trailingIcon,
  colorDot,
  onClick,
  interactive,
  className = '',
  as = 'span',
  disabled = false,
}: PillProps) {
  const isInteractive = interactive ?? (!!onClick && variant !== 'locked');
  const Component = onClick ? 'button' : as;

  const baseClasses = 'inline-flex items-center rounded-full whitespace-nowrap font-medium transition-colors';

  const interactiveClasses = isInteractive
    ? 'cursor-pointer hover:opacity-80 active:scale-95'
    : '';

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : '';

  const currentIconSize = iconSizeClasses[size];

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || variant === 'locked') return;
    onClick?.(e);
  };

  const content = (
    <>
      {/* Color dot */}
      {colorDot && (
        <span
          className="rounded-full flex-shrink-0"
          style={{
            backgroundColor: colorDot,
            width: size === 'xs' ? 6 : size === 'sm' ? 8 : size === 'md' ? 10 : 12,
            height: size === 'xs' ? 6 : size === 'sm' ? 8 : size === 'md' ? 10 : 12,
          }}
        />
      )}

      {/* Leading icon */}
      {icon && (
        <span className={`flex-shrink-0 flex items-center justify-center ${currentIconSize}`}>
          {typeof icon === 'string' ? (
            <span>{icon}</span>
          ) : (
            React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                  className: currentIconSize,
                })
              : icon
          )}
        </span>
      )}

      {/* Content */}
      <span>{children}</span>

      {/* Trailing icon */}
      {trailingIcon && (
        <span className={`flex-shrink-0 flex items-center justify-center ${currentIconSize}`}>
          {typeof trailingIcon === 'string' ? (
            <span>{trailingIcon}</span>
          ) : (
            React.isValidElement(trailingIcon)
              ? React.cloneElement(trailingIcon as React.ReactElement<{ className?: string }>, {
                  className: currentIconSize,
                })
              : trailingIcon
          )}
        </span>
      )}
    </>
  );

  if (Component === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || variant === 'locked'}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${interactiveClasses} ${disabledClasses} ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      onClick={onClick ? handleClick : undefined}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${interactiveClasses} ${disabledClasses} ${className}`}
    >
      {content}
    </span>
  );
}

export default Pill;
