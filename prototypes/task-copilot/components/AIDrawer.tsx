"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Message, Step } from "@/lib/types";

interface AIDrawerProps {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onSendMessage: (message: string) => void;
  variant?: "planning" | "focus";
  // For focus mode collapsible sections
  currentStepId?: string | null;
  steps?: Step[];
  // Recommendation feature
  recommendation?: {
    taskId: string;
    taskTitle: string;
    reason: string;
    reasonType: string;
  } | null;
  recommendationLoading?: boolean;
  onStartRecommendedFocus?: () => void;
  onSkipRecommendation?: () => void;
  onDismissRecommendation?: () => void;
}

// Group messages by stepId
interface MessageGroup {
  stepId: string | undefined;
  messages: Message[];
  stepNumber?: number;
  stepText?: string;
}

// Variant-specific copy
const VARIANT_CONFIG = {
  planning: {
    emptyTitle: "What would you like to accomplish?",
    emptySubtitle: "I'll help break it into actionable steps.",
    placeholder: "Ask about this task or how to break it down...",
  },
  focus: {
    emptyTitle: "Here if you need me.",
    emptySubtitle: "Ask anything about this step.",
    placeholder: "What's on your mind?",
  },
};

export default function AIDrawer({
  messages,
  isOpen,
  isLoading,
  onToggle,
  onSendMessage,
  variant = "planning",
  currentStepId,
  steps = [],
  recommendation,
  recommendationLoading,
  onStartRecommendedFocus,
  onSkipRecommendation,
  onDismissRecommendation,
}: AIDrawerProps) {
  const config = VARIANT_CONFIG[variant];
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track which step sections are expanded (for focus mode)
  // Initialize with currentStepId so it's expanded on mount
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(() =>
    currentStepId ? new Set([currentStepId]) : new Set()
  );

  // Group messages by stepId (for focus mode)
  const messageGroups = useMemo((): MessageGroup[] => {
    if (variant !== "focus") return [];

    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    for (const message of messages) {
      const stepId = message.stepId;

      if (!currentGroup || currentGroup.stepId !== stepId) {
        // Start new group
        const step = steps.find(s => s.id === stepId);
        const stepIndex = steps.findIndex(s => s.id === stepId);
        currentGroup = {
          stepId,
          messages: [],
          stepNumber: stepIndex >= 0 ? stepIndex + 1 : undefined,
          stepText: step?.text,
        };
        groups.push(currentGroup);
      }

      currentGroup.messages.push(message);
    }

    return groups;
  }, [messages, steps, variant]);

  // Auto-collapse previous steps and expand only current step when step changes
  useEffect(() => {
    if (currentStepId) {
      setExpandedSteps(new Set([currentStepId]));  // Reset to only current step
    }
  }, [currentStepId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Toggle a step section's expanded state
  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }

  return (
    <>
      {/* Desktop: Side-by-side column with smooth transition */}
      <div
        className={`
          hidden lg:flex lg:flex-col lg:flex-shrink-0 lg:border-l lg:border-zinc-200 lg:dark:border-zinc-700 lg:bg-white lg:dark:bg-zinc-800
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'lg:w-80' : 'lg:w-0 lg:border-l-0'}
        `}
      >
        <div className={`w-80 flex flex-col h-full transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        {/* AI Header - matches main header height (h-14) */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-violet-600 dark:text-violet-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              AI Assistant
            </span>
            {isLoading && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Thinking...
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg
              className="w-5 h-5 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          <div className="flex flex-col min-h-full">
            <div className="flex-1" />
            <div className="space-y-3">
              {/* Recommendation card - shows at top when available */}
              {recommendation && onStartRecommendedFocus && onSkipRecommendation && onDismissRecommendation && (
                <RecommendationCard
                  recommendation={recommendation}
                  isLoading={recommendationLoading}
                  onStartFocus={onStartRecommendedFocus}
                  onSkip={onSkipRecommendation}
                  onDismiss={onDismissRecommendation}
                />
              )}

              {/* Recommendation loading state */}
              {recommendationLoading && !recommendation && (
                <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full" />
                    <span className="text-sm text-violet-700 dark:text-violet-300">
                      Finding the best task for you...
                    </span>
                  </div>
                </div>
              )}

              {messages.length === 0 && !recommendation && !recommendationLoading ? (
                <div className="py-8 text-center">
                  <p className="text-zinc-500 dark:text-zinc-400 mb-1">
                    {config.emptyTitle}
                  </p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    {config.emptySubtitle}
                  </p>
                </div>
              ) : variant === "focus" ? (
                // Focus mode: render collapsible step sections
                <>
                  {messageGroups.map((group, groupIndex) => {
                    const isCurrentStep = group.stepId === currentStepId;
                    const isExpanded = group.stepId ? expandedSteps.has(group.stepId) : true;
                    const isLastGroup = groupIndex === messageGroups.length - 1;

                    return (
                      <div key={group.stepId || groupIndex} className="relative">
                        {/* Collapsible header for previous steps */}
                        {!isCurrentStep && group.stepId && (
                          <button
                            onClick={() => toggleStepExpanded(group.stepId!)}
                            className="w-full flex items-center gap-2 py-2 px-3 -mx-3 mb-2
                                       text-left text-sm text-zinc-500 dark:text-zinc-400
                                       hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg
                                       transition-colors"
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="font-medium">
                              Step {group.stepNumber}
                            </span>
                            <span className="text-zinc-400 dark:text-zinc-500">
                              · {group.messages.length} message{group.messages.length !== 1 ? "s" : ""}
                            </span>
                          </button>
                        )}

                        {/* Messages (expanded or current step) */}
                        {(isExpanded || isCurrentStep) && (
                          <div className="space-y-3">
                            {group.messages.map((message, msgIndex) => (
                              <ChatMessage key={msgIndex} message={message} />
                            ))}
                          </div>
                        )}

                        {/* Separator between groups */}
                        {!isLastGroup && isExpanded && (
                          <div className="my-4 border-t border-zinc-200 dark:border-zinc-700" />
                        )}
                      </div>
                    );
                  })}

                  {/* Empty state for current step when no messages yet */}
                  {!messageGroups.some(g => g.stepId === currentStepId) && (
                    <div className="py-8 text-center">
                      <p className="text-zinc-500 dark:text-zinc-400 mb-1">
                        {config.emptyTitle}
                      </p>
                      <p className="text-sm text-zinc-400 dark:text-zinc-500">
                        {config.emptySubtitle}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                // Planning mode: flat list of messages
                messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0
                                  flex items-center justify-center text-sm">
                    🤖
                  </div>
                  <div className="flex-1 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-700">
          <form onSubmit={handleSubmit}>
            <div className="bg-zinc-100 dark:bg-zinc-700 rounded-xl border border-transparent
                            focus-within:border-blue-500 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={config.placeholder}
                disabled={isLoading}
                rows={1}
                className="w-full px-4 pt-3 pb-1 bg-transparent border-0 resize-none
                           outline-none text-zinc-800 dark:text-zinc-100
                           placeholder-zinc-400 dark:placeholder-zinc-500
                           disabled:opacity-60 min-h-[44px] max-h-[200px]"
              />
              <div className="flex items-center justify-end px-3 pb-2">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700
                             disabled:bg-zinc-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed
                             text-white rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
        </div>
      </div>

      {/* Mobile: Floating bar trigger (when closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="lg:hidden fixed bottom-5 left-5 right-5 z-40 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-lg border border-zinc-200/50 dark:border-zinc-700/50 rounded-full shadow-lg px-4 py-3 flex items-center gap-3"
        >
          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="flex-1 text-left text-zinc-500 dark:text-zinc-400">
            {isLoading ? "AI is thinking..." : "Ask AI for help..."}
          </span>
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Mobile: Bottom sheet (when open) */}
      <div
        className={`
          lg:hidden fixed inset-x-0 bottom-0 z-40 h-[50vh] bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Mobile header */}
        <button
          onClick={onToggle}
          className="w-full h-12 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-violet-600 dark:text-violet-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              AI Assistant
            </span>
            {isLoading && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Thinking...
              </span>
            )}
          </div>
          <svg
            className="w-5 h-5 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Mobile messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          <div className="space-y-3">
            {/* Recommendation card - shows at top when available */}
            {recommendation && onStartRecommendedFocus && onSkipRecommendation && onDismissRecommendation && (
              <RecommendationCard
                recommendation={recommendation}
                isLoading={recommendationLoading}
                onStartFocus={onStartRecommendedFocus}
                onSkip={onSkipRecommendation}
                onDismiss={onDismissRecommendation}
              />
            )}

            {/* Recommendation loading state */}
            {recommendationLoading && !recommendation && (
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full" />
                  <span className="text-sm text-violet-700 dark:text-violet-300">
                    Finding the best task for you...
                  </span>
                </div>
              </div>
            )}

            {messages.length === 0 && !recommendation && !recommendationLoading ? (
              <div className="py-8 text-center">
                <p className="text-zinc-500 dark:text-zinc-400 mb-1">
                  {config.emptyTitle}
                </p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  {config.emptySubtitle}
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))
            )}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 flex items-center justify-center text-sm">
                  🤖
                </div>
                <div className="flex-1 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Mobile input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-700">
          <form onSubmit={handleSubmit}>
            <div className="bg-zinc-100 dark:bg-zinc-700 rounded-xl border border-transparent focus-within:border-blue-500 transition-colors">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={config.placeholder}
                disabled={isLoading}
                rows={1}
                className="w-full px-4 pt-3 pb-1 bg-transparent border-0 resize-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 disabled:opacity-60 min-h-[44px] max-h-[200px]"
              />
              <div className="flex items-center justify-end px-3 pb-2">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// Individual chat message component
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  // Parse assistant messages to extract just the message text
  let displayContent = message.content;
  if (!isUser) {
    try {
      const parsed = JSON.parse(message.content);
      if (parsed.message) {
        displayContent = parsed.message;
      }
    } catch {
      // Not JSON, use as-is
    }
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm
          ${isUser
            ? "bg-zinc-200 dark:bg-zinc-700"
            : "bg-blue-100 dark:bg-blue-900"
          }`}
      >
        {isUser ? "👤" : "🤖"}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl
          ${isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-bl-md"
          }`}
      >
        <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
      </div>
    </div>
  );
}

// Recommendation card component (for "What should I do?" feature)
interface RecommendationCardProps {
  recommendation: {
    taskId: string;
    taskTitle: string;
    reason: string;
    reasonType: string;
  };
  isLoading?: boolean;
  onStartFocus: () => void;
  onSkip: () => void;
  onDismiss: () => void;
}

function RecommendationCard({
  recommendation,
  isLoading,
  onStartFocus,
  onSkip,
  onDismiss,
}: RecommendationCardProps) {
  // Map reasonType to an icon/emoji
  const getReasonIcon = (reasonType: string) => {
    switch (reasonType) {
      case 'deadline': return '📅';
      case 'momentum': return '🚀';
      case 'quick_win': return '⚡';
      case 'priority': return '⭐';
      case 'oldest': return '📦';
      default: return '✨';
    }
  };

  return (
    <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getReasonIcon(recommendation.reasonType)}</span>
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            I'd suggest...
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          aria-label="Dismiss recommendation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Task title */}
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        "{recommendation.taskTitle}"
      </h3>

      {/* Reason */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        {recommendation.reason}
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onStartFocus}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Start Focus
        </button>
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg transition-colors"
        >
          Not this one
        </button>
      </div>
    </div>
  );
}
