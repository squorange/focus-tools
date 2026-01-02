"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Step,
  SuggestedStep,
  Message,
  AppState,
  StructureResponse,
} from "@/lib/types";
import { STORAGE_KEY } from "@/lib/prompts";
import TaskList from "@/components/TaskList";
import StagingArea from "@/components/StagingArea";
import AIDrawer from "@/components/AIDrawer";

// Initial state
const initialState: AppState = {
  taskTitle: "My Tasks",
  steps: [],
  suggestions: [],
  messages: [],
  isDrawerOpen: true, // Open by default when list is empty
  isLoading: false,
  error: null,
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({
          ...initialState,
          taskTitle: parsed.taskTitle || initialState.taskTitle,
          steps: parsed.steps || [],
          messages: parsed.messages || [],
          // Keep drawer open if list is empty
          isDrawerOpen: (parsed.steps?.length || 0) === 0,
        });
      }
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      const toSave = {
        taskTitle: state.taskTitle,
        steps: state.steps,
        messages: state.messages,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }, [state.taskTitle, state.steps, state.messages]);

  // Handle title change
  const handleTitleChange = useCallback((title: string) => {
    setState((prev) => ({ ...prev, taskTitle: title }));
  }, []);

  // Handle steps change
  const handleStepsChange = useCallback((steps: Step[]) => {
    setState((prev) => ({ ...prev, steps }));
  }, []);

  // Handle drawer toggle
  const handleDrawerToggle = useCallback(() => {
    setState((prev) => ({ ...prev, isDrawerOpen: !prev.isDrawerOpen }));
  }, []);

  // Accept one suggestion
  const handleAcceptOne = useCallback((suggestion: SuggestedStep) => {
    setState((prev) => {
      // Convert suggestion to step
      const newStep: Step = {
        id: String(prev.steps.length + 1),
        text: suggestion.text,
        substeps: suggestion.substeps.map((sub, i) => ({
          id: `${prev.steps.length + 1}${String.fromCharCode(97 + i)}`,
          text: sub.text,
          completed: false,
        })),
        completed: false,
      };

      // Remove from suggestions
      const newSuggestions = prev.suggestions.filter(
        (s) => s.id !== suggestion.id
      );

      // Renumber remaining suggestions
      const renumberedSuggestions = newSuggestions.map((s, i) => ({
        ...s,
        id: String(prev.steps.length + 2 + i),
      }));

      return {
        ...prev,
        steps: [...prev.steps, newStep],
        suggestions: renumberedSuggestions,
      };
    });
  }, []);

  // Accept all suggestions
  const handleAcceptAll = useCallback(() => {
    setState((prev) => {
      const newSteps: Step[] = prev.suggestions.map((suggestion, i) => ({
        id: String(prev.steps.length + 1 + i),
        text: suggestion.text,
        substeps: suggestion.substeps.map((sub, j) => ({
          id: `${prev.steps.length + 1 + i}${String.fromCharCode(97 + j)}`,
          text: sub.text,
          completed: false,
        })),
        completed: false,
      }));

      return {
        ...prev,
        steps: [...prev.steps, ...newSteps],
        suggestions: [],
      };
    });
  }, []);

  // Dismiss suggestions
  const handleDismiss = useCallback(() => {
    setState((prev) => ({ ...prev, suggestions: [] }));
  }, []);

  // Send message to AI
  const handleSendMessage = useCallback(async (userMessage: string) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    // Add user message
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, newUserMessage],
    }));

    try {
      const response = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          currentList: state.steps.length > 0 ? state.steps : null,
          taskTitle: state.steps.length > 0 ? state.taskTitle : null,
          conversationHistory: state.messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data: StructureResponse = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: JSON.stringify(data),
        timestamp: Date.now(),
      };

      setState((prev) => {
        let newState = {
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
        };

        // Handle different actions
        if (data.action === "replace" && data.steps) {
          // Replace entire list (auto-populate)
          newState.steps = data.steps;
          newState.suggestions = [];
          if (data.taskTitle) {
            newState.taskTitle = data.taskTitle;
          }
        } else if (data.action === "suggest" && data.suggestions) {
          // Add to staging area
          newState.suggestions = data.suggestions;
          if (data.taskTitle) {
            newState.taskTitle = data.taskTitle;
          }
        }
        // action === "none" - just add the message, no list changes

        return newState;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      }));
    }
  }, [state.steps, state.taskTitle, state.messages]);

  // Clear all data
  const handleClearAll = useCallback(() => {
    if (confirm("Clear all tasks and start fresh?")) {
      localStorage.removeItem(STORAGE_KEY);
      setState(initialState);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
              Task Co-Pilot
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Turn rough ideas into actionable steps
            </p>
          </div>
          <button
            onClick={handleClearAll}
            className="text-sm text-neutral-400 hover:text-neutral-600 
                       dark:hover:text-neutral-300 transition-colors"
          >
            Clear all
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        {/* Task list section */}
        <div className="flex-1 p-6 flex flex-col min-h-0">
          <TaskList
            title={state.taskTitle}
            steps={state.steps}
            onTitleChange={handleTitleChange}
            onStepsChange={handleStepsChange}
          />

          {/* Staging area (suggestions) */}
          <StagingArea
            suggestions={state.suggestions}
            onAcceptOne={handleAcceptOne}
            onAcceptAll={handleAcceptAll}
            onDismiss={handleDismiss}
          />
        </div>

        {/* Error display */}
        {state.error && (
          <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{state.error}</p>
          </div>
        )}

        {/* AI Drawer */}
        <AIDrawer
          messages={state.messages}
          isOpen={state.isDrawerOpen}
          isLoading={state.isLoading}
          onToggle={handleDrawerToggle}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
}
