'use client';

import React, { createContext, useContext, forwardRef } from 'react';

// ============================================
// Types
// ============================================

export type ActionableCardVariant = 'standard' | 'compact';
export type ActionableCardAppearance = 'default' | 'highlighted' | 'muted';
export type ActionableCardEmphasis = 'primary' | 'secondary';

export interface ActionableCardProps {
  /** Layout variant */
  variant?: ActionableCardVariant;
  /** Visual appearance (use 'highlighted' for today/queue items) */
  appearance?: ActionableCardAppearance;
  /** Show completed state (reduced opacity + strikethrough) */
  isComplete?: boolean;
  /** Border emphasis */
  emphasis?: ActionableCardEmphasis;
  /** Fixed height for compact variant */
  height?: number | string;
  /** Click handler for entire card */
  onClick?: () => void;
  /** Additional className for overrides */
  className?: string;
  children: React.ReactNode;
}

export interface LeadingProps {
  children: React.ReactNode;
  className?: string;
}

export interface BodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface TitleProps {
  /** Line clamp for multiline (compact variant) */
  clamp?: number;
  /** Show strikethrough (inherited from isComplete by default) */
  strikethrough?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface MetaProps {
  /** Position within body */
  position?: 'inline' | 'bottom';
  children: React.ReactNode;
  className?: string;
}

export interface InlineActionsProps {
  children: React.ReactNode;
  className?: string;
}

export interface TrailingProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================
// Context
// ============================================

interface ActionableCardContextValue {
  variant: ActionableCardVariant;
  appearance: ActionableCardAppearance;
  isComplete: boolean;
}

const ActionableCardContext = createContext<ActionableCardContextValue>({
  variant: 'standard',
  appearance: 'default',
  isComplete: false,
});

const useActionableCardContext = () => useContext(ActionableCardContext);

// ============================================
// Slot Components
// ============================================

/** Left-aligned slot for status indicators (ring, icon, drag handle) */
const Leading = forwardRef<HTMLDivElement, LeadingProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-[var(--actionable-card-gap)] shrink-0 mt-0.5 ${className}`}
      >
        {children}
      </div>
    );
  }
);
Leading.displayName = 'ActionableCard.Leading';

/** Main content area containing Title, Meta, and InlineActions */
const Body = forwardRef<HTMLDivElement, BodyProps>(
  ({ children, className = '' }, ref) => {
    // Always stacked layout - meta pills always below title
    const baseClasses = 'flex flex-col gap-1 min-w-0 flex-1';

    return (
      <div ref={ref} className={`${baseClasses} ${className}`}>
        {children}
      </div>
    );
  }
);
Body.displayName = 'ActionableCard.Body';

/** Primary label */
const Title = forwardRef<HTMLSpanElement, TitleProps>(
  ({ clamp, strikethrough, children, className = '' }, ref) => {
    const { isComplete, variant } = useActionableCardContext();

    const shouldStrikethrough = strikethrough ?? isComplete;
    const effectiveClamp = clamp ?? (variant === 'compact' ? 2 : undefined);

    // Use compact title weight for compact variant
    const fontWeight = variant === 'compact'
      ? 'font-[number:var(--actionable-card-compact-title-weight)]'
      : 'font-[number:var(--actionable-card-title-weight)]';

    const baseClasses =
      `text-[length:var(--actionable-card-title-size)] ${fontWeight} leading-[var(--actionable-card-title-line-height)] text-fg-neutral-primary truncate mt-px`;

    const strikethroughClass = shouldStrikethrough ? 'line-through' : '';

    const clampStyles: React.CSSProperties = effectiveClamp
      ? {
          display: '-webkit-box',
          WebkitLineClamp: effectiveClamp,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'normal',
        }
      : {};

    return (
      <span
        ref={ref}
        className={`${baseClasses} ${strikethroughClass} ${className}`}
        style={clampStyles}
      >
        {children}
      </span>
    );
  }
);
Title.displayName = 'ActionableCard.Title';

/** Secondary content (pills, description, timestamp) */
const Meta = forwardRef<HTMLDivElement, MetaProps>(
  ({ position = 'inline', children, className = '' }, ref) => {
    const baseClasses =
      'flex items-center gap-1.5 flex-wrap text-[length:var(--actionable-card-meta-size)] leading-[var(--actionable-card-meta-line-height)] text-fg-neutral-secondary';

    const positionClass = position === 'bottom' ? 'mt-auto' : '';

    return (
      <div ref={ref} className={`${baseClasses} ${positionClass} ${className}`}>
        {children}
      </div>
    );
  }
);
Meta.displayName = 'ActionableCard.Meta';

/** Embedded action buttons (notifications, triage) - always on own row */
const InlineActions = forwardRef<HTMLDivElement, InlineActionsProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-2 mt-2 ${className}`}
      >
        {children}
      </div>
    );
  }
);
InlineActions.displayName = 'ActionableCard.InlineActions';

/** Right-aligned controls (buttons, badges, kebab menu) */
const Trailing = forwardRef<HTMLDivElement, TrailingProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-1.5 shrink-0 ml-auto ${className}`}
      >
        {children}
      </div>
    );
  }
);
Trailing.displayName = 'ActionableCard.Trailing';

// ============================================
// Main Component
// ============================================

/** Unified card primitive for tasks, notifications, and routines */
const ActionableCardRoot = forwardRef<HTMLDivElement, ActionableCardProps>(
  (
    {
      variant = 'standard',
      appearance = 'default',
      isComplete = false,
      emphasis = 'secondary',
      height,
      onClick,
      className = '',
      children,
    },
    ref
  ) => {
    // Base classes
    const baseClasses = 'relative border transition-colors';

    // Radius classes - use compact radius for compact variant
    const radiusClasses = variant === 'compact'
      ? 'rounded-[var(--actionable-card-compact-radius)]'
      : 'rounded-[var(--actionable-card-radius)]';

    // Padding: more on desktop for standard variant
    const paddingClasses =
      variant === 'standard'
        ? 'px-[var(--actionable-card-padding-x)] sm:px-[var(--actionable-card-padding-x-sm)] py-[var(--actionable-card-padding-y)]'
        : 'px-[var(--actionable-card-padding-x)] py-[var(--actionable-card-padding-y)]';

    // Layout classes - items-start aligns Leading/Trailing with first row of title
    const layoutClasses =
      variant === 'standard'
        ? 'flex items-start gap-[var(--actionable-card-gap)]'
        : 'flex flex-col';

    // Appearance classes - queue/today state indicated by appearance colors
    const appearanceClasses = {
      default:
        'bg-[var(--actionable-card-bg-default)] border-[var(--actionable-card-border-default)] hover:bg-[var(--actionable-card-hover-bg-default)] hover:border-[var(--actionable-card-hover-border-default)]',
      highlighted:
        'bg-[var(--actionable-card-bg-highlighted)] border-[var(--actionable-card-border-highlighted)] hover:bg-[var(--actionable-card-hover-bg-highlighted)] hover:border-[var(--actionable-card-hover-border-highlighted)]',
      muted:
        'bg-[var(--actionable-card-bg-muted)] border-[var(--actionable-card-border-muted)] opacity-[var(--actionable-card-opacity-muted)]',
    };

    // Emphasis (border width)
    const emphasisClasses = emphasis === 'primary' ? 'border-2' : 'border';

    // Complete modifier
    const completeClasses = isComplete
      ? 'opacity-[var(--actionable-card-complete-opacity)]'
      : '';

    // Interactive classes
    const interactiveClasses = onClick
      ? 'cursor-pointer'
      : '';

    // Height for compact variant
    const heightStyle: React.CSSProperties = height
      ? { height: typeof height === 'number' ? `${height}px` : height }
      : variant === 'compact'
      ? { height: 'var(--actionable-card-compact-height)' }
      : {};

    const combinedClassName = [
      baseClasses,
      radiusClasses,
      paddingClasses,
      layoutClasses,
      appearanceClasses[appearance],
      emphasisClasses,
      completeClasses,
      interactiveClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <ActionableCardContext.Provider value={{ variant, appearance, isComplete }}>
        <div
          ref={ref}
          className={combinedClassName}
          style={heightStyle}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={
            onClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                  }
                }
              : undefined
          }
        >
          {children}
        </div>
      </ActionableCardContext.Provider>
    );
  }
);
ActionableCardRoot.displayName = 'ActionableCard';

// ============================================
// Compound Component Export
// ============================================

export const ActionableCard = Object.assign(ActionableCardRoot, {
  Leading,
  Body,
  Title,
  Meta,
  InlineActions,
  Trailing,
});

export default ActionableCard;
