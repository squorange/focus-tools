"use client";

import { useState, useRef, useEffect } from "react";
import { Step, Substep, createEmptySubstep } from "@/lib/types";

interface TaskItemProps {
  step: Step;
  onUpdate: (step: Step) => void;
  onDelete: (stepId: string) => void;
  onMoveUp: (stepId: string) => void;
  onMoveDown: (stepId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function TaskItem({
  step,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(step.text);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
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

  // Add new substep
  function handleAddSubstep() {
    const newSubstep = createEmptySubstep(step.id, step.substeps.length);
    onUpdate({ ...step, substeps: [...step.substeps, newSubstep] });
    setShowMenu(false);
  }

  return (
    <li className="group">
      {/* Main step row */}
      <div className="flex items-start gap-3 py-2">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
            ${
              step.completed
                ? "bg-green-500 border-green-500 text-white"
                : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"
            }`}
        >
          {step.completed && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Step number */}
        <span className="w-6 text-sm font-medium text-neutral-400 dark:text-neutral-500 flex-shrink-0">
          {step.id}.
        </span>

        {/* Step text (editable) */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-0.5 -my-0.5 -mx-2 bg-white dark:bg-neutral-800 
                       border border-blue-500 rounded outline-none
                       text-neutral-800 dark:text-neutral-100"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`flex-1 cursor-text hover:bg-neutral-100 dark:hover:bg-neutral-800 
                        rounded px-2 py-0.5 -my-0.5 -mx-2 transition-colors
                        ${step.completed ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"}`}
          >
            {step.text || <span className="text-neutral-400 italic">Click to edit...</span>}
          </span>
        )}

        {/* Action menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity
                       text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-800 rounded-lg shadow-lg 
                            border border-neutral-200 dark:border-neutral-700 py-1 z-10">
              <button
                onClick={handleAddSubstep}
                className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700
                           text-neutral-700 dark:text-neutral-200"
              >
                Add substep
              </button>
              <button
                onClick={() => { onMoveUp(step.id); setShowMenu(false); }}
                disabled={isFirst}
                className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700
                           text-neutral-700 dark:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Move up
              </button>
              <button
                onClick={() => { onMoveDown(step.id); setShowMenu(false); }}
                disabled={isLast}
                className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700
                           text-neutral-700 dark:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Move down
              </button>
              <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
              <button
                onClick={() => { onDelete(step.id); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20
                           text-red-600 dark:text-red-400"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Substeps */}
      {step.substeps.length > 0 && (
        <ul className="ml-8 pl-6 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-1">
          {step.substeps.map((substep) => (
            <SubstepItem
              key={substep.id}
              substep={substep}
              onToggle={() => handleSubstepToggle(substep.id)}
              onUpdate={(newText) => handleSubstepUpdate(substep.id, newText)}
              onDelete={() => handleSubstepDelete(substep.id)}
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
}

function SubstepItem({ substep, onToggle, onUpdate, onDelete }: SubstepItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(substep.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
    <li className="group/sub flex items-center gap-2 py-1">
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
          ${
            substep.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-neutral-300 dark:border-neutral-600"
          }`}
      >
        {substep.completed && (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 w-5">
        {substep.id}.
      </span>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 px-1.5 py-0.5 text-sm bg-white dark:bg-neutral-800 
                     border border-blue-500 rounded outline-none"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-sm cursor-text hover:bg-neutral-100 dark:hover:bg-neutral-800 
                      rounded px-1.5 py-0.5 transition-colors
                      ${substep.completed ? "line-through text-neutral-400" : "text-neutral-600 dark:text-neutral-300"}`}
        >
          {substep.text || <span className="text-neutral-400 italic">Click to edit...</span>}
        </span>
      )}

      <button
        onClick={onDelete}
        className="p-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity
                   text-neutral-400 hover:text-red-500"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}
