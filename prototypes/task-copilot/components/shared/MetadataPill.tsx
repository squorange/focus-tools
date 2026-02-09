"use client";

import React from "react";

type PillVariant =
  | "default"
  | "priority-high"
  | "priority-medium"
  | "healthy"
  | "project"
  | "due"
  | "overdue"
  | "paused"
  | "waiting"
  | "deferred";

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
      "bg-bg-transparent-subtle-accented text-fg-neutral-secondary",
    "priority-high":
      "bg-bg-alert-subtle text-fg-alert-default",
    "priority-medium":
      "bg-bg-attention-subtle text-fg-attention-default",
    healthy:
      "bg-bg-positive-subtle text-fg-positive-default",
    due: "bg-bg-information-subtle text-fg-info-default",
    overdue:
      "bg-bg-alert-subtle text-fg-alert-default",
    project: "bg-bg-transparent-subtle-accented text-fg-neutral-secondary", // Monochrome like default
    paused: "bg-bg-attention-subtle text-fg-attention-default",
    waiting: "bg-bg-attention-subtle text-fg-attention-default",
    deferred: "bg-bg-attention-subtle text-fg-attention-default",
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
