"use client";

import { useState, useRef, useEffect } from "react";
import { Step, Substep, createEmptySubstep } from "@/lib/types";

interface TaskItemProps {
  step: Step;
  onUpdate: (step: Step) => void;
  onDelete: (stepId: string) => void;
  onMoveUp: (stepId: string) => void;
  onMoveDown: (stepId: string) => void;
  onSkip: (stepId: string) => void;
  onUnskip: (stepId: string) => void;
  onSkipSubstep: (stepId: string, substepId: string) => void;
  onUnskipSubstep: (stepId: string, substepId: string) => void;
  onEnterFocus?: (stepId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function TaskItem({
  step,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSkip,
  onUnskip,
  onSkipSubstep,
  onUnskipSubstep,
  onEnterFocus,
  isFirst,
  isLast,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(step.text);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Auto-resize textarea to fit content
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle checkbox toggle
  function handleToggle() {
    onUpdate({ ...step, completed: !step.completed });
  }

  // Handle text edit save
  function handleSave() {
    if (editText.trim()) {
      onUpdate({ ...step, text: editText.trim() });
    } else {
      setEditText(step.text); // Revert if empty
    }
    setIsEditing(false);
  }

  // Handle key press in edit mode
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditText(step.text);
      setIsEditing(false);
    }
  }

  // Handle substep toggle
  function handleSubstepToggle(substepId: string) {
    const updatedSubsteps = step.substeps.map((sub) =>
      sub.id === substepId ? { ...sub, completed: !sub.completed } : sub
    );
    onUpdate({ ...step, substeps: updatedSubsteps });
  }

  // Handle substep text edit
  function handleSubstepUpdate(substepId: string, newText: string) {
    const updatedSubsteps = step.substeps.map((sub) =>
      sub.id === substepId ? { ...sub, text: newText } : sub
    );
    onUpdate({ ...step, substeps: updatedSubsteps });
  }

  // Handle substep delete
  function handleSubstepDelete(substepId: string) {
    const updatedSubsteps = step.substeps.filter((sub) => sub.id !== substepId);
    onUpdate({ ...step, substeps: updatedSubsteps });
  }

  // Handle substep move up
  function handleSubstepMoveUp(substepId: string) {
    const index = step.substeps.findIndex((sub) => sub.id === substepId);
    if (index <= 0) return;
    const newSubsteps = [...step.substeps];
    [newSubsteps[index - 1], newSubsteps[index]] = [newSubsteps[index], newSubsteps[index - 1]];
    // Renumber substeps to maintain correct order IDs
    const renumbered = newSubsteps.map((sub, i) => ({
      ...sub,
      id: `${step.id}${String.fromCharCode(97 + i)}`,
    }));
    onUpdate({ ...step, substeps: renumbered });
  }

  // Handle substep move down
  function handleSubstepMoveDown(substepId: string) {
    const index = step.substeps.findIndex((sub) => sub.id === substepId);
    if (index < 0 || index >= step.substeps.length - 1) return;
    const newSubsteps = [...step.substeps];
    [newSubsteps[index], newSubsteps[index + 1]] = [newSubsteps[index + 1], newSubsteps[index]];
    // Renumber substeps to maintain correct order IDs
    const renumbered = newSubsteps.map((sub, i) => ({
      ...sub,
      id: `${step.id}${String.fromCharCode(97 + i)}`,
    }));
    onUpdate({ ...step, substeps: renumbered });
  }

  // Add new substep
  function handleAddSubstep() {
    const newSubstep = createEmptySubstep(step.id, step.substeps.length);
    onUpdate({ ...step, substeps: [...step.substeps, newSubstep] });
    setShowMenu(false);
  }

  return (
    <li className="group w-full">
      {/* Main step row */}
      <div className="flex items-start gap-3 py-2 w-full">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
            ${
              step.completed
                ? "bg-bg-positive-high border-bg-positive-high text-white"
                : step.skipped
                ? "bg-fg-neutral-disabled border-fg-neutral-disabled text-fg-neutral-soft"
                : "border-fg-neutral-disabled hover:border-fg-neutral-soft"
            }`}
        >
          {step.completed && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {step.skipped && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          )}
        </button>

        {/* Step number */}
        <span className="mt-0.5 w-6 font-medium text-fg-neutral-soft flex-shrink-0">
          {step.id}.
        </span>

        {/* Step text (editable) */}
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 min-w-0 px-2 py-0.5 -mx-2 bg-bg-neutral-min
                       border border-blue-500 rounded outline-none resize-none leading-normal
                       text-fg-neutral-primary"
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="flex-1 min-w-0 flex items-baseline gap-2 cursor-text hover:bg-bg-neutral-subtle
                       rounded px-2 py-0.5 transition-colors"
          >
            <span
              className={`whitespace-normal break-words
                ${step.completed || step.skipped ? "line-through text-fg-neutral-soft" : "text-fg-neutral-primary"}
                ${step.skipped ? "italic" : ""}`}
            >
              {step.text || <span className="text-fg-neutral-soft italic">Click to edit...</span>}
            </span>
            {step.skipped && (
              <span className="flex-shrink-0 text-xs font-normal bg-bg-neutral-subtle
                               text-fg-neutral-soft px-1.5 py-0.5 rounded">
                Skipped
              </span>
            )}
          </span>
        )}

        {/* Focus arrow - only show for active (not completed or skipped) tasks */}
        {onEnterFocus && !step.completed && !step.skipped && (
          <button
            onClick={() => onEnterFocus(step.id)}
            className="p-1 flex-shrink-0 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300
                       hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Focus on this task"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}

        {/* Action menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 focus:opacity-100 transition-colors
                       text-fg-neutral-soft hover:text-fg-neutral-secondary"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-bg-neutral-min rounded-lg shadow-lg 
                            border border-border-color-neutral py-1 z-10">
              <button
                onClick={handleAddSubstep}
                className="w-full px-3 py-2 text-left text-sm hover:bg-bg-neutral-subtle
                           text-fg-neutral-primary"
              >
                Add substep
              </button>
              <button
                onClick={() => { onMoveUp(step.id); setShowMenu(false); }}
                disabled={isFirst}
                className="w-full px-3 py-2 text-left text-sm hover:bg-bg-neutral-subtle
                           text-fg-neutral-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Move up
              </button>
              <button
                onClick={() => { onMoveDown(step.id); setShowMenu(false); }}
                disabled={isLast}
                className="w-full px-3 py-2 text-left text-sm hover:bg-bg-neutral-subtle
                           text-fg-neutral-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Move down
              </button>
              {/* Skip/Unskip - only show for non-completed steps */}
              {!step.completed && (
                step.skipped ? (
                  <button
                    onClick={() => { onUnskip(step.id); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-bg-neutral-subtle
                               text-fg-neutral-primary"
                  >
                    Unskip
                  </button>
                ) : (
                  <button
                    onClick={() => { onSkip(step.id); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-bg-neutral-subtle
                               text-fg-neutral-primary"
                  >
                    Skip
                  </button>
                )
              )}
              <hr className="my-1 border-border-color-neutral" />
              <button
                onClick={() => { onDelete(step.id); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-bg-alert-subtle
                           text-fg-alert-default"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Substeps */}
      {step.substeps.length > 0 && (
        <ul className="ml-8 pl-6 border-l-2 border-border-color-neutral space-y-1">
          {step.substeps.map((substep, index) => (
            <SubstepItem
              key={substep.id}
              substep={substep}
              onToggle={() => handleSubstepToggle(substep.id)}
              onUpdate={(newText) => handleSubstepUpdate(substep.id, newText)}
              onDelete={() => handleSubstepDelete(substep.id)}
              onMoveUp={() => handleSubstepMoveUp(substep.id)}
              onMoveDown={() => handleSubstepMoveDown(substep.id)}
              onSkip={() => onSkipSubstep(step.id, substep.id)}
              onUnskip={() => onUnskipSubstep(step.id, substep.id)}
              isFirst={index === 0}
              isLast={index === step.substeps.length - 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// Substep component
interface SubstepItemProps {
  substep: Substep;
  onToggle: () => void;
  onUpdate: (newText: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSkip: () => void;
  onUnskip: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function SubstepItem({
  substep,
  onToggle,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSkip,
  onUnskip,
  isFirst,
  isLast,
}: SubstepItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(substep.text);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Auto-resize textarea to fit content
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSave() {
    if (editText.trim()) {
      onUpdate(editText.trim());
    } else {
      setEditText(substep.text);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") {
      setEditText(substep.text);
      setIsEditing(false);
    }
  }

  return (
    <li className="group/sub flex items-start gap-2 py-1">
      <button
        onClick={onToggle}
        className={`mt-1 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
          ${
            substep.completed
              ? "bg-bg-positive-high border-bg-positive-high text-white"
              : substep.skipped
              ? "bg-fg-neutral-disabled border-fg-neutral-disabled text-fg-neutral-soft"
              : "border-fg-neutral-disabled"
          }`}
      >
        {substep.completed && (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {substep.skipped && (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        )}
      </button>

      <span className="mt-0.5 text-sm font-medium text-fg-neutral-soft w-6">
        {substep.id}.
      </span>

      {isEditing ? (
        <textarea
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex-1 min-w-0 px-1.5 py-0.5 text-sm bg-bg-neutral-min
                     border border-blue-500 rounded outline-none resize-none"
          onInput={(e) => {
            const target = e.currentTarget;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className="flex-1 min-w-0 flex items-baseline gap-2 cursor-text hover:bg-bg-neutral-subtle
                      rounded px-1.5 py-0.5 transition-colors"
        >
          <span
            className={`break-words text-sm
              ${substep.completed || substep.skipped ? "line-through text-fg-neutral-soft" : "text-fg-neutral-secondary"}
              ${substep.skipped ? "italic" : ""}`}
          >
            {substep.text || <span className="text-fg-neutral-soft italic">Click to edit...</span>}
          </span>
          {substep.skipped && (
            <span className="flex-shrink-0 text-xs font-normal bg-bg-neutral-subtle
                             text-fg-neutral-soft px-1.5 py-0.5 rounded">
              Skipped
            </span>
          )}
        </span>
      )}

      {/* Kebab menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 focus:opacity-100 transition-colors
                     text-fg-neutral-soft hover:text-fg-neutral-secondary"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 w-40 bg-bg-neutral-min rounded-lg shadow-lg
                          border border-border-color-neutral py-1 z-10">
            <button
              onClick={() => { onMoveUp(); setShowMenu(false); }}
              disabled={isFirst}
              className="w-full px-3 py-2 text-left text-sm hover:bg-bg-neutral-subtle
                         text-fg-neutral-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Move up
            </button>
            <button
              onClick={() => { onMoveDown(); setShowMenu(false); }}
              disabled={isLast}
              className="w-full px-3 py-2 text-left text-sm hover:bg-bg-neutral-subtle
                         text-fg-neutral-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Move down
            </button>
            {/* Skip/Unskip - only show for non-completed substeps */}
            {!substep.completed && (
              substep.skipped ? (
                <button
                  onClick={() => { onUnskip(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-bg-neutral-subtle
                             text-fg-neutral-primary"
                >
                  Unskip
                </button>
              ) : (
                <button
                  onClick={() => { onSkip(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-bg-neutral-subtle
                             text-fg-neutral-primary"
                >
                  Skip
                </button>
              )
            )}
            <hr className="my-1 border-border-color-neutral" />
            <button
              onClick={() => { onDelete(); setShowMenu(false); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-bg-alert-subtle
                         text-fg-alert-default"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
