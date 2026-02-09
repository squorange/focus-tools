"use client";

import { useState, useRef, useEffect } from "react";

interface NotesModuleProps {
  notes: string;
  onChange: (notes: string) => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  placeholder?: string;
}

export default function NotesModule({
  notes,
  onChange,
  collapsible = true,
  defaultExpanded = false,
  placeholder = "Add note...",
}: NotesModuleProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [userExpanded, setUserExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus and move cursor to end when user explicitly expands (not on initial load)
  useEffect(() => {
    if (collapsible && isExpanded && userExpanded && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [collapsible, isExpanded, userExpanded]);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto";
      // Set height to scrollHeight, with minimum of 3 rows (~72px)
      const minHeight = 72;
      const newHeight = Math.max(textareaRef.current.scrollHeight, minHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [notes]);

  // Get preview text for collapsed state
  const getPreview = () => {
    if (!notes) return placeholder;
    // Get first line, truncate if needed
    const firstLine = notes.split("\n")[0];
    if (firstLine.length > 50) {
      return firstLine.substring(0, 50).trim() + "...";
    }
    if (notes.includes("\n")) {
      return firstLine + "...";
    }
    return firstLine;
  };

  const handleExpand = () => {
    if (!isExpanded) {
      setUserExpanded(true);
      setIsExpanded(true);
    }
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  // Non-collapsible: just render a simple auto-growing textarea
  if (!collapsible) {
    return (
      <div className="w-full">
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm bg-transparent border border-border-color-neutral
                     rounded-lg px-3 py-2 outline-none resize-none
                     text-fg-neutral-secondary
                     placeholder-fg-neutral-soft
                     focus:ring-2 focus:ring-ring-focus focus:border-transparent"
          style={{ minHeight: "72px" }}
        />
      </div>
    );
  }

  // Collapsible: expand/collapse with smooth animation
  return (
    <div
      className="w-full bg-bg-neutral-subtle
                 border border-border-color-neutral rounded-lg
                 overflow-hidden"
    >
      {/* Collapsed view - clickable header */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${
        !isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}>
        <div className="overflow-hidden">
          <button
            onClick={handleExpand}
            className="w-full flex items-center justify-between px-4 py-3
                       hover:bg-bg-neutral-subtle transition-colors
                       text-left"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={`text-sm truncate ${notes ? "text-fg-neutral-secondary" : "text-fg-neutral-soft"}`}>
                {getPreview()}
              </span>
            </div>
            <svg
              className="w-4 h-4 text-fg-neutral-soft flex-shrink-0 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded view - with grid-rows animation */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${
        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}>
        <div className="overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-start gap-2">
              <textarea
                ref={textareaRef}
                value={notes}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 min-w-0 text-sm bg-transparent border-none outline-none resize-none
                           text-fg-neutral-secondary
                           placeholder-fg-neutral-soft
                           focus:ring-0"
                style={{ minHeight: "72px" }}
              />
              <button
                onClick={handleCollapse}
                className="flex-shrink-0 p-1 -mr-1 -mt-0.5
                           text-fg-neutral-soft hover:text-fg-neutral-secondary
                           transition-colors"
              >
                <svg
                  className="w-4 h-4 rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
