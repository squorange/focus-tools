"use client";

import { useState, useRef, useEffect } from "react";
import { HealthResult, getHealthStatusInfo } from "@/lib/utils";

interface HealthPillProps {
  health: HealthResult;
  size?: "sm" | "md";
  showInfo?: boolean;
}

export default function HealthPill({
  health,
  size = "sm",
  showInfo = true,
}: HealthPillProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const info = getHealthStatusInfo(health.status);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!showTooltip) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTooltip]);

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs gap-1",
    md: "px-2 py-1 text-sm gap-1.5",
  };

  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <div className="relative inline-flex">
      <span
        className={`
          inline-flex items-center font-medium rounded-full
          ${info.bgClass} ${info.textClass}
          ${sizeClasses[size]}
        `}
      >
        {info.label}
        {showInfo && (
          <span
            ref={triggerRef}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setShowTooltip(!showTooltip);
              }
            }}
            className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Show health details"
          >
            <svg
              className={iconSize}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
        )}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 top-full mt-1 left-0
            min-w-[180px] max-w-[240px]
            bg-bg-neutral-min
            border border-border-color-neutral
            rounded-lg shadow-lg
            p-2.5
          `}
        >
          <div className="text-xs font-medium text-fg-neutral-secondary mb-1.5">
            Why this status?
          </div>
          <ul className="space-y-1">
            {health.reasons.map((reason, i) => (
              <li
                key={i}
                className="text-sm text-fg-neutral-primary flex items-start gap-1.5"
              >
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  health.status === 'critical' ? 'bg-bg-alert-high' :
                  health.status === 'at_risk' ? 'bg-bg-attention-high' :
                  'bg-bg-positive-high'
                }`} />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
