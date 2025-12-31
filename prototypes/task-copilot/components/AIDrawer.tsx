"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/lib/types";

interface AIDrawerProps {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onSendMessage: (message: string) => void;
  variant?: "planning" | "focus";
}

// Variant-specific copy
const VARIANT_CONFIG = {
  planning: {
    emptyTitle: "What would you like to accomplish?",
    emptySubtitle: "I'll help break it into actionable steps.",
    placeholder: "I need to do taxes somehow...",
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
}: AIDrawerProps) {
  const config = VARIANT_CONFIG[variant];
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput("");
  }

  return (
    <>
      {/* FAB toggle - visible on ALL screen sizes when drawer is collapsed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-40
                     w-14 h-14 flex items-center justify-center
                     bg-blue-600 hover:bg-blue-700
                     text-white rounded-full shadow-lg
                     transition-all"
        >
          <span className="text-xl">💬</span>
          {isLoading && (
            <div className="absolute -top-1 -right-1 w-3 h-3">
              <div className="w-full h-full bg-blue-400 rounded-full animate-ping" />
            </div>
          )}
        </button>
      )}

      {/* Main drawer container - outer wrapper handles width transition */}
      <div
        className={`
          transition-all duration-300 ease-out
          fixed z-40 bottom-0 left-0 right-0
          ${isOpen ? "h-[50vh]" : "h-0 pointer-events-none"}
          lg:static lg:z-auto lg:h-full lg:pointer-events-auto
          lg:flex-shrink-0 lg:overflow-hidden
          ${isOpen ? "lg:w-96" : "lg:w-0"}
        `}
      >
        {/* Inner wrapper - fixed width, slides off when container shrinks */}
        <div className="h-full lg:w-96 flex flex-col
                        bg-white dark:bg-neutral-900
                        border-t border-neutral-200 dark:border-neutral-700
                        shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]
                        lg:border-t-0 lg:border-l lg:shadow-none
                        overflow-hidden">
        {/* Toggle header - visible when drawer is open */}
        <button
          onClick={onToggle}
          className="w-full h-14 flex items-center justify-between px-4
                     hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors
                     border-b border-neutral-200 dark:border-neutral-700"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              AI Assistant
            </span>
            {isLoading && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Thinking...
              </span>
            )}
          </div>
          {/* Close icon (X on desktop, down chevron on mobile) */}
          <svg
            className="w-5 h-5 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {/* Mobile: down chevron */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
              className="lg:hidden"
            />
            {/* Desktop: X close */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
              className="hidden lg:block"
            />
          </svg>
        </button>

        {/* Drawer content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          {/* Spacer pushes content to bottom when few messages */}
          <div className="flex flex-col min-h-full">
            <div className="flex-1" />
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-neutral-500 dark:text-neutral-400 mb-1">
                    {config.emptyTitle}
                  </p>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">
                    {config.emptySubtitle}
                  </p>
                </div>
              ) : (
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
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input - sticky at bottom */}
        <div className="flex-shrink-0 px-4 pr-5 pb-4 pt-2 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={config.placeholder}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800
                         border border-transparent focus:border-blue-500
                         rounded-lg outline-none transition-colors
                         text-neutral-800 dark:text-neutral-100
                         placeholder-neutral-400 dark:placeholder-neutral-500
                         disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700
                         disabled:bg-neutral-400 disabled:cursor-not-allowed
                         text-white font-medium rounded-lg transition-colors"
            >
              Send
            </button>
          </form>
        </div>
        </div>
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
            ? "bg-neutral-200 dark:bg-neutral-700"
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
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-bl-md"
          }`}
      >
        <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
      </div>
    </div>
  );
}
