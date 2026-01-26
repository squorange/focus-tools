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
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || !collapsible);
  const [userExpanded, setUserExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus and move cursor to end when user explicitly expands (not on initial load)
  useEffect(() => {
    if (isExpanded && userExpanded && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isExpanded, userExpanded]);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto";
      // Set height to scrollHeight, with minimum of 3 rows (~72px)
      const minHeight = 72;
      const newHeight = Math.max(textareaRef.current.scrollHeight, minHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [isExpanded, notes]);

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
    if (collapsible && !isExpanded) {
      setUserExpanded(true);
      setIsExpanded(true);
    }
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (collapsible) {
      setIsExpanded(false);
    }
  };

  // Single container with animated expand/collapse
  return (
    <div
      className="w-full bg-neutral-50 dark:bg-neutral-800/50
                 border border-neutral-200 dark:border-neutral-700 rounded-lg
                 overflow-hidden"
    >
      {/* Collapsed view - clickable header */}
      <button
        onClick={handleExpand}
        className={`w-full flex items-center justify-between px-4 py-3
                   hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors
                   text-left ${isExpanded && collapsible ? 'hidden' : ''}`}
        disabled={!collapsible || isExpanded}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`text-sm truncate ${notes ? "text-neutral-600 dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-500"}`}>
            {getPreview()}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-neutral-400 flex-shrink-0 ml-2 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded view - with grid-rows animation */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${
        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}>
        <div className="overflow-hidden">
          <div className={`px-4 py-3 transition-opacity duration-200 ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-start gap-2">
              <textarea
                ref={textareaRef}
                value={notes}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 min-w-0 text-sm bg-transparent border-none outline-none resize-none
                           text-neutral-600 dark:text-neutral-300
                           placeholder-neutral-400 dark:placeholder-neutral-500
                           focus:ring-0"
                style={{ minHeight: "72px" }}
              />
              {collapsible && (
                <button
                  onClick={handleCollapse}
                  className="flex-shrink-0 p-1 -mr-1 -mt-0.5
                             text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300
                             transition-colors"
                >
                  <svg
                    className="w-4 h-4 rotate-180 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
