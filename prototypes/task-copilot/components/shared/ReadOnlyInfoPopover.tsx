"use client";

import React, { useEffect, useState, RefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";

interface ReadOnlyInfoPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  onEditTemplate?: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}

/**
 * Simple anchored popover for locked recurring instance fields.
 * Shows a message and optional "Edit template →" action.
 */
export default function ReadOnlyInfoPopover({
  isOpen,
  onClose,
  message,
  onEditTemplate,
  triggerRef,
}: ReadOnlyInfoPopoverProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position from trigger element
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 220;

      // Position below the trigger, centered if possible
      let left = rect.left + rect.width / 2 - popoverWidth / 2;

      // Ensure popover stays within viewport
      const viewportWidth = window.innerWidth;
      if (left < 8) left = 8;
      if (left + popoverWidth > viewportWidth - 8) left = viewportWidth - popoverWidth - 8;

      setPosition({
        top: rect.bottom + 8,
        left,
      });
    }
  }, [isOpen, triggerRef]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover */}
      <div
        className="fixed w-[220px] bg-bg-neutral-min border border-border-color-neutral rounded-xl shadow-lg z-50 overflow-hidden"
        style={{ top: position.top, left: position.left }}
      >
        <div className="p-3">
          <p className="text-sm text-fg-neutral-secondary">
            {message}
          </p>
        </div>

        {onEditTemplate && (
          <>
            <div className="border-t border-border-color-neutral" />
            <button
              onClick={() => {
                onEditTemplate();
                onClose();
              }}
              className="w-full px-3 py-2.5 text-sm font-medium text-fg-accent-primary hover:bg-bg-neutral-subtle flex items-center justify-between transition-colors"
            >
              <span>Edit template</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </>,
    document.body
  );
}
