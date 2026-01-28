"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Task } from "@/lib/types";
import { filterDueToday, sortByTime } from "@/lib/recurring-utils";
import { RecurrenceRuleExtended } from "@/lib/recurring-types";
import RoutineCard from "./RoutineCard";

interface RoutinesGalleryProps {
  tasks: Task[];
  onCompleteRoutine: (taskId: string) => void;
  onSkipRoutine: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
  dayStartHour?: number; // Hour when the day starts (0-12). Default 0 (midnight).
}

// Time window status for a routine's scheduled time
type TimeWindowStatus = "before" | "active" | "past";

// Check if a routine is within ±1 hour of its target time (2-hour bracket)
function getTimeWindowStatus(task: Task): TimeWindowStatus {
  const recurrence = task.recurrence as RecurrenceRuleExtended | null;
  if (!recurrence?.time) return "before";

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [targetHours, targetMins] = recurrence.time.split(":").map(Number);
  const targetMinutes = targetHours * 60 + (targetMins || 0);

  // 1 hour before to 1 hour after target time
  const windowStart = targetMinutes - 60;
  const windowEnd = targetMinutes + 60;

  if (currentMinutes < windowStart) {
    return "before";
  } else if (currentMinutes <= windowEnd) {
    return "active"; // Within ±1 hour window
  } else {
    return "past"; // Past the window
  }
}

export default function RoutinesGallery({
  tasks,
  onCompleteRoutine,
  onSkipRoutine,
  onOpenTask,
  dayStartHour = 0,
}: RoutinesGalleryProps) {
  // Get routines due today (includes overdue with rollover), sorted by scheduled time
  const dueRoutines = useMemo(() => {
    const filtered = filterDueToday(tasks, dayStartHour);
    return sortByTime(filtered);
  }, [tasks, dayStartHour]);

  // Scroll state for gradient fades
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track desktop breakpoint for CSS mask-image (lg: 1024px)
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Check scroll position and update gradient visibility
  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const hasOverflow = scrollWidth > clientWidth;

    // Show left fade when scrolled past 10px
    setShowLeftFade(scrollLeft > 10);
    // Show right fade when not at end (with 10px threshold)
    setShowRightFade(hasOverflow && scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Set up scroll listener and initial state
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    // Check initial state
    updateScrollState();

    // Listen for scroll events
    scrollEl.addEventListener("scroll", updateScrollState);
    // Also listen for resize in case content changes
    window.addEventListener("resize", updateScrollState);

    return () => {
      scrollEl.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, dueRoutines.length]);

  // Don't render if no routines due
  if (dueRoutines.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Section header - matching QueueView pattern */}
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
          {dueRoutines.length} {dueRoutines.length === 1 ? "routine" : "routines"}
        </span>
      </div>

      {/* Gallery container - desktop uses CSS mask-image for edge fades */}
      <div className="relative">
        {/* Horizontal scrolling gallery
            Mobile: First card aligns with content left edge, cards scroll past BOTH screen edges
            Desktop: CSS mask-image creates edge fade effect without relying on overflow */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 pl-4 pr-4 scroll-pl-4 lg:-mx-20 lg:pl-20 lg:pr-20 lg:scroll-pl-20"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            // Desktop: Apply CSS mask-image for edge fade effect
            // Mask starts at 80px so scrolled cards fade visibly outside content column
            // Central content area remains fully opaque and unobstructed
            ...(isDesktop ? {
              maskImage: showLeftFade && showRightFade
                ? 'linear-gradient(to right, transparent 0%, black 80px, black calc(100% - 80px), transparent 100%)'
                : showRightFade
                ? 'linear-gradient(to right, black 0%, black calc(100% - 80px), transparent 100%)'
                : showLeftFade
                ? 'linear-gradient(to right, transparent 0%, black 80px, black 100%)'
                : undefined,
              WebkitMaskImage: showLeftFade && showRightFade
                ? 'linear-gradient(to right, transparent 0%, black 80px, black calc(100% - 80px), transparent 100%)'
                : showRightFade
                ? 'linear-gradient(to right, black 0%, black calc(100% - 80px), transparent 100%)'
                : showLeftFade
                ? 'linear-gradient(to right, transparent 0%, black 80px, black 100%)'
                : undefined,
            } : {}),
          }}
        >
          {dueRoutines.map((task) => (
            <div
              key={task.id}
              className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)]"
            >
              <RoutineCard
                task={task}
                onComplete={onCompleteRoutine}
                onSkip={onSkipRoutine}
                onOpenDetail={onOpenTask}
                timeWindowStatus={getTimeWindowStatus(task)}
                dayStartHour={dayStartHour}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
