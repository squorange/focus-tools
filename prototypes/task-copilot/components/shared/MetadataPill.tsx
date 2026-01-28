"use client";

import React from "react";

type PillVariant =
  | "default"
  | "priority-high"
  | "priority-medium"
  | "healthy"
  | "project"
  | "due"
  | "overdue";

interface MetadataPillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  color?: string; // For project color
  icon?: React.ReactNode; // Optional leading icon
}

export default function MetadataPill({
  children,
  variant = "default",
  color,
  icon,
}: MetadataPillProps) {
  const baseClasses =
    "px-1.5 py-0.5 text-xs rounded-full whitespace-nowrap inline-flex items-center";

  const variantClasses: Record<PillVariant, string> = {
    default:
      "bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400",
    "priority-high":
      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    "priority-medium":
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    healthy:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    due: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    overdue:
      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    project: "bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400", // Monochrome like default
  };

  // No inline style needed for project variant (now uses monochrome styling)
  const style = undefined;

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]}`}
      style={style}
    >
      {/* Project color dot - 10px (w-2.5 h-2.5), concentric with left pill radius */}
      {variant === "project" && color && (
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-1"
          style={{ backgroundColor: color }}
        />
      )}
      {icon && <span className="mr-0.5 flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
