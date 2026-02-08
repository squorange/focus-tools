"use client";

import { useState, useRef } from "react";
import { Task } from "@/lib/types";

interface QuickCaptureProps {
  onCreateTask: (title: string) => Task;
}

export default function QuickCapture({ onCreateTask }: QuickCaptureProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    onCreateTask(trimmed);
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-3 bg-bg-neutral-min rounded-xl border border-border-color-neutral shadow-sm focus-within:border-border-input-focus focus-within:ring-1 focus-within:ring-focus transition-all">
        {/* Plus icon */}
        <div className="pl-4">
          <svg
            className="w-5 h-5 text-fg-neutral-soft"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 py-3.5 pr-4 bg-transparent border-0 outline-none text-fg-neutral-primary placeholder:text-fg-neutral-soft"
        />

        {/* Submit button - only visible when there's input */}
        {value.trim() && (
          <button
            type="submit"
            className="mr-2 px-4 py-1.5 bg-bg-accent-high hover:bg-bg-accent-high-hover text-fg-neutral-inverse-primary text-sm font-medium rounded-lg transition-colors"
          >
            Add
          </button>
        )}
      </div>
    </form>
  );
}
