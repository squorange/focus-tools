"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Project } from "@/lib/types";
import { ChevronDown, FolderOpen, Plus } from "lucide-react";
import BottomSheet from "@/components/shared/BottomSheet";

interface TaskCreationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickAdd: (title: string, projectId: string | null) => void;
  onAddAndOpen: (title: string, projectId: string | null) => void;
  projects: Project[];
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
  onOpenProjectModal?: () => void;
  projectModalOpen?: boolean; // Skip click-outside when modal is open
  onOpenProjectModalWithCallback?: (callback: (projectId: string) => void) => void;
}

interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
}

export default function TaskCreationPopover({
  isOpen,
  onClose,
  onQuickAdd,
  onAddAndOpen,
  projects,
  anchorRef,
  onOpenProjectModal,
  projectModalOpen,
  onOpenProjectModalWithCallback,
}: TaskCreationPopoverProps) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const projectButtonRef = useRef<HTMLButtonElement>(null);

  // Reset and focus on open
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setProjectId(null);
      setShowProjectDropdown(false);
      setDropdownPosition(null);
      // On mobile, delay focus until after bottom sheet animation completes
      // to prevent keyboard from triggering before sheet is visible
      if (isMobileView) {
        const timer = setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            // iOS: trigger click to ensure keyboard appears
            inputRef.current.click();
          }
        }, 400);
        return () => clearTimeout(timer);
      } else {
        // Desktop: focus immediately
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    }
  }, [isOpen, isMobileView]);

  // Update mobile state
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(typeof window !== "undefined" && window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (showProjectDropdown && projectButtonRef.current) {
      const rect = projectButtonRef.current.getBoundingClientRect();

      if (isMobileView) {
        // Mobile: open upward
        setDropdownPosition({
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          width: 224, // w-56 = 14rem = 224px
        });
      } else {
        // Desktop: open downward
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: 192, // w-48 = 12rem = 192px
        });
      }
    }
  }, [showProjectDropdown, isMobileView]);

  // Close on click outside (skip when ProjectModal is open)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      // Skip click-outside when ProjectModal is open
      if (projectModalOpen) return;

      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef, projectModalOpen]);

  const handleQuickAdd = () => {
    if (title.trim()) {
      onQuickAdd(title.trim(), projectId);
      onClose(); // Close popover after adding
    }
  };

  const handleAddAndOpen = () => {
    if (title.trim()) {
      onAddAndOpen(title.trim(), projectId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (showProjectDropdown) {
        setShowProjectDropdown(false);
      } else {
        onClose();
      }
    } else if (e.key === "Enter") {
      if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl+Enter: Add & Open
        e.preventDefault();
        handleAddAndOpen();
      } else {
        // Enter: Quick add
        e.preventDefault();
        handleQuickAdd();
      }
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);
  const activeProjects = projects.filter((p) => p.status === "active");

  // Project dropdown content (shared between mobile and desktop)
  const renderProjectDropdownContent = () => (
    <>
      {/* No project option */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setProjectId(null);
          setShowProjectDropdown(false);
        }}
        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
          projectId === null
            ? "bg-violet-50 dark:bg-violet-900/20"
            : ""
        }`}
      >
        <FolderOpen size={14} className="text-zinc-400" />
        <span className="text-zinc-600 dark:text-zinc-400">
          No project
        </span>
      </button>

      {activeProjects.map((project) => (
        <button
          key={project.id}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setProjectId(project.id);
            setShowProjectDropdown(false);
          }}
          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
            projectId === project.id
              ? "bg-violet-50 dark:bg-violet-900/20"
              : ""
          }`}
        >
          {project.color && (
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: project.color }}
            />
          )}
          <span className="text-zinc-900 dark:text-zinc-100">
            {project.name}
          </span>
        </button>
      ))}

      {/* Create new project option */}
      {(onOpenProjectModal || onOpenProjectModalWithCallback) && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            // Use callback version if available (auto-selects new project)
            if (onOpenProjectModalWithCallback) {
              onOpenProjectModalWithCallback((newProjectId) => {
                setProjectId(newProjectId);
              });
            } else if (onOpenProjectModal) {
              onOpenProjectModal();
            }
            setShowProjectDropdown(false);
          }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-violet-600 dark:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-t border-zinc-200 dark:border-zinc-700"
        >
          <Plus size={14} />
          <span>Create new project</span>
        </button>
      )}
    </>
  );

  // Portal dropdown component
  const renderPortalDropdown = () => {
    if (!showProjectDropdown || !dropdownPosition) return null;

    return createPortal(
      <>
        {/* Backdrop for outside click */}
        <div
          className="fixed inset-0 z-[60]"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setShowProjectDropdown(false)}
        />

        {/* Dropdown */}
        <div
          className="fixed z-[70] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
          style={{
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            ...(dropdownPosition.top !== undefined
              ? { top: dropdownPosition.top }
              : { bottom: dropdownPosition.bottom }
            ),
          }}
        >
          {renderProjectDropdownContent()}
        </div>
      </>,
      document.body
    );
  };

  if (!isOpen) return null;

  // Mobile: Bottom sheet
  if (isMobileView) {
    return (
      <>
        <BottomSheet isOpen={true} onClose={onClose} height="auto">
          <div ref={popoverRef}>
            {/* Title input */}
            <div className="px-4 pb-3">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 text-base bg-zinc-100 dark:bg-zinc-900 border-0 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoComplete="off"
                enterKeyHint="done"
              />
            </div>

            {/* Project selector - subtle inline */}
            <div className="px-4 pt-4 pb-3">
              <button
                ref={projectButtonRef}
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
              >
                {selectedProject ? (
                  <>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedProject.color || '#9ca3af' }}
                    />
                    <span>{selectedProject.name}</span>
                  </>
                ) : (
                  <>
                    <FolderOpen size={14} className="text-zinc-400" />
                    <span>Add to project</span>
                  </>
                )}
                <ChevronDown
                  size={14}
                  className={`text-zinc-400 transition-transform ${
                    showProjectDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between px-4 pb-4">
              {/* Secondary: Show details */}
              <button
                onClick={handleAddAndOpen}
                disabled={!title.trim()}
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Show details
              </button>
              {/* Primary: Add */}
              <button
                onClick={handleQuickAdd}
                disabled={!title.trim()}
                className="px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </BottomSheet>

        {/* Portal dropdown for project selection */}
        {renderPortalDropdown()}
      </>
    );
  }

  // Desktop: Dropdown popover
  return (
    <>
      <div
        ref={popoverRef}
        className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-visible animate-in fade-in slide-in-from-top-2 duration-150"
      >
        {/* Title input */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            autoComplete="off"
            autoFocus
          />
        </div>

        {/* Project selector - subtle inline */}
        <div className="px-3 pt-4 pb-3">
          <button
            ref={projectButtonRef}
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            {selectedProject ? (
              <>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedProject.color || '#9ca3af' }}
                />
                <span>{selectedProject.name}</span>
              </>
            ) : (
              <>
                <FolderOpen size={14} className="text-zinc-400" />
                <span>Add to project</span>
              </>
            )}
            <ChevronDown
              size={14}
              className={`text-zinc-400 transition-transform ${
                showProjectDropdown ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between p-3 border-t border-zinc-200 dark:border-zinc-700">
          {/* Secondary: Show details */}
          <button
            onClick={handleAddAndOpen}
            disabled={!title.trim()}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Show details
          </button>
          {/* Primary: Add */}
          <button
            onClick={handleQuickAdd}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Portal dropdown for project selection */}
      {renderPortalDropdown()}
    </>
  );
}
