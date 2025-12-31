"use client";

import { useRef, useEffect } from "react";
import { Step, createEmptyStep, generateId } from "@/lib/types";
import TaskItem from "./TaskItem";

interface TaskListProps {
  title: string;
  steps: Step[];
  onTitleChange: (title: string) => void;
  onStepsChange: (steps: Step[]) => void;
  onEnterFocus?: (stepId: string) => void;
  onSkipStep: (stepId: string) => void;
  onUnskipStep: (stepId: string) => void;
  onSkipSubstep: (stepId: string, substepId: string) => void;
  onUnskipSubstep: (stepId: string, substepId: string) => void;
}

export default function TaskList({
  title,
  steps,
  onTitleChange,
  onStepsChange,
  onEnterFocus,
  onSkipStep,
  onUnskipStep,
  onSkipSubstep,
  onUnskipSubstep,
}: TaskListProps) {
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize title textarea when value changes
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // Update a single step
  function handleUpdateStep(updatedStep: Step) {
    const newSteps = steps.map((s) =>
      s.id === updatedStep.id ? updatedStep : s
    );
    onStepsChange(newSteps);
  }

  // Delete a step
  function handleDeleteStep(stepId: string) {
    const newSteps = steps.filter((s) => s.id !== stepId);
    // Renumber remaining steps
    const renumbered = newSteps.map((s, i) => ({
      ...s,
      id: String(i + 1),
      substeps: s.substeps.map((sub, j) => ({
        ...sub,
        id: `${i + 1}${String.fromCharCode(97 + j)}`,
      })),
    }));
    onStepsChange(renumbered);
  }

  // Move step up
  function handleMoveUp(stepId: string) {
    const index = steps.findIndex((s) => s.id === stepId);
    if (index <= 0) return;

    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];

    // Renumber
    const renumbered = newSteps.map((s, i) => ({
      ...s,
      id: String(i + 1),
      substeps: s.substeps.map((sub, j) => ({
        ...sub,
        id: `${i + 1}${String.fromCharCode(97 + j)}`,
      })),
    }));
    onStepsChange(renumbered);
  }

  // Move step down
  function handleMoveDown(stepId: string) {
    const index = steps.findIndex((s) => s.id === stepId);
    if (index < 0 || index >= steps.length - 1) return;

    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];

    // Renumber
    const renumbered = newSteps.map((s, i) => ({
      ...s,
      id: String(i + 1),
      substeps: s.substeps.map((sub, j) => ({
        ...sub,
        id: `${i + 1}${String.fromCharCode(97 + j)}`,
      })),
    }));
    onStepsChange(renumbered);
  }

  // Add new empty step
  function handleAddStep() {
    const newStep = createEmptyStep(String(steps.length + 1));
    onStepsChange([...steps, newStep]);
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0 -mt-0.5">📋</span>
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="My Tasks"
            rows={1}
            className="flex-1 min-w-0 text-lg font-semibold bg-transparent border-none outline-none
                       text-neutral-800 dark:text-neutral-100
                       placeholder-neutral-400 dark:placeholder-neutral-500
                       focus:ring-0 resize-none overflow-hidden leading-tight"
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>
        <button
          onClick={handleAddStep}
          className="-mt-0.5 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                     text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                     rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
      </div>

      {/* Task list */}
      <div>
        {steps.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 mb-2">
              No tasks yet
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              Add one manually or ask AI to help break something down
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {steps.map((step, index) => (
              <TaskItem
                key={step.id}
                step={step}
                onUpdate={handleUpdateStep}
                onDelete={handleDeleteStep}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onSkip={onSkipStep}
                onUnskip={onUnskipStep}
                onSkipSubstep={onSkipSubstep}
                onUnskipSubstep={onUnskipSubstep}
                onEnterFocus={onEnterFocus}
                isFirst={index === 0}
                isLast={index === steps.length - 1}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
