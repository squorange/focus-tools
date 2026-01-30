"use client";

import React from "react";
import { Lock, X } from "lucide-react";

export type PillVariant = "filled" | "empty" | "locked";
export type PillSize = "sm" | "md";

interface DetailsPillProps {
  /** Icon to display (emoji string or ReactNode - prefer Lucide icons) */
  icon?: string | React.ReactNode;
  /** Label text */
  label: string;
  /** Pill variant: filled (has value), empty (action prompt), locked (read-only) */
  variant?: PillVariant;
  /** Size: sm for collapsed state, md for expanded/edit mode */
  size?: PillSize;
  /** Project color dot (renders before icon/label) */
  projectColor?: string;
  /** Click handler - not called for locked variant. Receives click event for positioning. */
  onPress?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  /** Clear/remove handler - shows X icon inside pill when set */
  onClear?: () => void;
  /** Additional className for customization */
  className?: string;
}

const sizeClasses: Record<PillSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-2.5 py-1.5 text-sm",
};

const iconSizeClasses: Record<PillSize, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
};

/**
 * Interactive pill component for task details.
 * - filled: Shows current value (e.g., "📅 Tomorrow 9a")
 * - empty: Shows action prompt (e.g., "+ Set timing")
 * - locked: Shows value but not interactive (for recurring instances)
 */
export default function DetailsPill({
  icon,
  label,
  variant = "filled",
  size = "sm",
  projectColor,
  onPress,
  onClear,
  className = "",
}: DetailsPillProps) {
  const isInteractive = variant !== "locked" && onPress;

  const baseClasses =
    "rounded-full whitespace-nowrap inline-flex items-center gap-1 transition-colors";

  const variantClasses: Record<PillVariant, string> = {
    filled:
      "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700",
    empty:
      "bg-transparent text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-600",
    locked:
      "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 opacity-60",
  };

  const interactiveClasses = isInteractive
    ? "cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 active:scale-95"
    : "";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isInteractive && onPress) {
      onPress(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isInteractive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onPress?.();
    }
  };

  // Determine icon size class based on pill size
  const currentIconSize = iconSizeClasses[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={variant === "locked"}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
      tabIndex={isInteractive ? 0 : -1}
    >
      {/* Project color dot */}
      {projectColor && (
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: projectColor }}
        />
      )}

      {/* Icon */}
      {icon && (
        <span className={`flex-shrink-0 flex items-center justify-center ${currentIconSize}`}>
          {typeof icon === "string" ? (
            <span>{icon}</span>
          ) : (
            React.cloneElement(icon as React.ReactElement, {
              className: currentIconSize,
            })
          )}
        </span>
      )}

      {/* Label */}
      <span>{label}</span>

      {/* Clear X icon - only for filled pills with onClear */}
      {onClear && variant === "filled" && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className={`flex-shrink-0 ml-0.5 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 p-0.5 cursor-pointer ${
            size === "sm" ? "w-4 h-4" : "w-5 h-5"
          } flex items-center justify-center`}
        >
          <X className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </span>
      )}

      {/* Lock icon for locked variant */}
      {variant === "locked" && (
        <Lock className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} text-zinc-400 flex-shrink-0 ml-0.5`} />
      )}
    </button>
  );
}
