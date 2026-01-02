"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/lib/types";

interface AIDrawerProps {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onSendMessage: (message: string) => void;
}

export default function AIDrawer({
  messages,
  isOpen,
  isLoading,
  onToggle,
  onSendMessage,
}: AIDrawerProps) {
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
    <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      {/* Collapsed bar / Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3
                   hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
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
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-4 pb-4">
          {/* Messages */}
          <div className="h-64 overflow-y-auto mb-4 space-y-3">
            {messages.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-neutral-500 dark:text-neutral-400 mb-1">
                  What would you like to accomplish?
                </p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500">
                  I'll help break it into actionable steps.
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

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="I need to do taxes somehow..."
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
      )}
    </div>
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
