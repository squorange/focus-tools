"use client";

import { useState, useEffect } from "react";
import { Project } from "@/lib/types";
import { BottomSheet } from "@design-system/components";

interface ProjectModalProps {
  isOpen: boolean;
  project?: Project | null;
  onClose: () => void;
  onSave: (name: string, color: string | null) => void;
  onDelete?: (projectId: string) => void;
}

const PROJECT_COLORS = [
  { name: "Yellow", value: "#eab308" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
];

export default function ProjectModal({
  isOpen,
  project,
  onClose,
  onSave,
  onDelete,
}: ProjectModalProps) {
  const [name, setName] = useState(project?.name ?? "");
  const [color, setColor] = useState<string | null>(project?.color ?? null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(typeof window !== "undefined" && window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName(project?.name ?? "");
      setColor(project?.color ?? null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, project]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), color);
      onClose();
    }
  };

  const handleDelete = () => {
    if (project && onDelete) {
      onDelete(project.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Shared content
  const renderContent = () => (
    <div className="space-y-4">
      {/* Name input */}
      <div>
        <label className="block text-sm font-medium text-fg-neutral-primary mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name..."
          className="w-full px-3 py-2 bg-bg-neutral-base border border-border-color-neutral rounded-lg text-fg-neutral-primary placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") onClose();
          }}
        />
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-fg-neutral-primary mb-2">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {/* No color option */}
          <button
            onClick={() => setColor(null)}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
              color === null
                ? "border-violet-500 ring-2 ring-violet-500/30"
                : "border-border-color-neutral hover:border-zinc-400"
            }`}
            title="No color"
          >
            <span className="text-zinc-400 text-xs">-</span>
          </button>

          {PROJECT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === c.value
                  ? "border-violet-500 ring-2 ring-violet-500/30"
                  : "border-transparent hover:scale-110"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderDeleteButton = () => {
    if (!project || !onDelete) return null;
    return showDeleteConfirm ? (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600 dark:text-red-400">Delete?</span>
        <button
          onClick={handleDelete}
          className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
        >
          Yes
        </button>
        <button
          onClick={() => setShowDeleteConfirm(false)}
          className="px-2 py-1 text-sm text-zinc-600 hover:bg-bg-neutral-subtle rounded"
        >
          No
        </button>
      </div>
    ) : (
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="text-sm text-red-600 dark:text-red-400 hover:underline"
      >
        Delete project
      </button>
    );
  };

  // Mobile: Bottom sheet
  if (isMobileView) {
    return (
      <BottomSheet isOpen={true} onClose={onClose} height="auto" zIndex={80}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-lg font-semibold text-fg-neutral-primary">
            {project ? "Edit Project" : "New Project"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-fg-neutral-secondary rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div>{renderDeleteButton()}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-fg-neutral-secondary hover:bg-bg-neutral-subtle rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {project ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  // Desktop: Centered modal
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[80]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div
          className="bg-bg-neutral-min rounded-xl shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-color-neutral">
            <h2 className="text-lg font-semibold text-fg-neutral-primary">
              {project ? "Edit Project" : "New Project"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-fg-neutral-secondary rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {renderContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-color-neutral">
            <div>{renderDeleteButton()}</div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-fg-neutral-secondary hover:bg-bg-neutral-subtle rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {project ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
