"use client";

import React from "react";

type PillVariant =
  | "default"
  | "priority-high"
  | "priority-medium"
  | "project"
  | "due"
  | "overdue";

interface MetadataPillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  color?: string; // For project color
}

export default function MetadataPill({
  children,
  variant = "default",
  color,
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
    due: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    overdue:
      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    project: "", // Uses inline style for color
  };

  // For project pills, create inline style with the project's color
  const style =
    variant === "project" && color
      ? {
          backgroundColor: `${color}20`,
          color: color,
        }
      : undefined;

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]}`}
      style={style}
    >
      {children}
    </span>
  );
}
