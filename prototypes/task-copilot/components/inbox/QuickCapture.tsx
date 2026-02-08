"use client";

import { useState, useRef, useEffect } from "react";

interface QuickCaptureProps {
  onCapture: (title: string) => void;
  placeholder?: string;
}

export default function QuickCapture({
  onCapture,
  placeholder = "What's on your mind?",
}: QuickCaptureProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCapture(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setInput("");
      inputRef.current?.blur();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`
          flex items-center gap-3 px-4 py-3
          bg-bg-neutral-min
          border rounded-lg
          transition-all duration-200
          ${
            isFocused
              ? "border-border-input-focus shadow-md ring-1 ring-focus"
              : "border-border-color-neutral hover:border-border-color-neutral-hover"
          }
        `}
      >
        {/* Plus icon */}
        <div
          className={`
            flex-shrink-0 w-6 h-6 rounded-full
            flex items-center justify-center
            transition-colors
            ${
              isFocused
                ? "bg-bg-accent-subtle text-fg-accent-primary"
                : "bg-bg-neutral-subtle text-fg-neutral-soft"
            }
          `}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          data-capture-input
          className="flex-1 bg-transparent text-fg-neutral-primary placeholder:text-fg-neutral-soft focus:outline-none text-sm"
        />

        {/* Submit button - always rendered to prevent height change */}
        <button
          type="submit"
          className={`flex-shrink-0 px-3 py-1 text-sm font-medium text-fg-neutral-inverse-primary bg-bg-accent-high hover:bg-bg-accent-high-hover rounded-md transition-all ${
            input.trim() ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          Add
        </button>
      </div>

    </form>
  );
}
