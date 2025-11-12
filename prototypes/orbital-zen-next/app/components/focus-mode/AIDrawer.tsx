'use client';

import React from 'react';

interface AIDrawerProps {
  drawerState: 'minimal' | 'intermediate' | 'full';
  taskColor: string;
  onChangeDrawerState: (state: 'minimal' | 'intermediate' | 'full') => void;
}

/**
 * AI Drawer - Three-State Interactive Panel
 *
 * Three progressive disclosure states:
 * 1. Minimal (15%): Single line of contextual text
 * 2. Intermediate (30%): Input field + quick actions
 * 3. Full (60-70%): Full conversation thread
 *
 * TODO: AI Integration Phase
 * - Connect to actual AI service
 * - Conversation history persistence
 * - Contextual suggestions based on task type
 */
export default function AIDrawer({ drawerState, taskColor, onChangeDrawerState }: AIDrawerProps) {
  const expandDrawer = () => {
    if (drawerState === 'minimal') onChangeDrawerState('intermediate');
    else if (drawerState === 'intermediate') onChangeDrawerState('full');
  };

  const collapseDrawer = () => {
    if (drawerState === 'full') onChangeDrawerState('intermediate');
    else if (drawerState === 'intermediate') onChangeDrawerState('minimal');
  };

  // Height based on state
  const heightClass = {
    minimal: 'h-[15vh]',
    intermediate: 'h-[30vh]',
    full: 'h-[65vh]',
  }[drawerState];

  return (
    <div
      className={`relative ${heightClass} transition-all duration-500 ease-out bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-md border-t border-white/10`}
    >
      {/* Drag Handle Indicator (mobile-friendly) */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-12 h-1 bg-white/30 rounded-full" />
      </div>

      {/* Content based on drawer state */}
      {drawerState === 'minimal' && (
        <MinimalDrawerContent onExpand={expandDrawer} taskColor={taskColor} />
      )}

      {drawerState === 'intermediate' && (
        <IntermediateDrawerContent
          onExpand={expandDrawer}
          onCollapse={collapseDrawer}
          taskColor={taskColor}
        />
      )}

      {drawerState === 'full' && (
        <FullDrawerContent onCollapse={collapseDrawer} taskColor={taskColor} />
      )}
    </div>
  );
}

// Minimal State: Single line, tap to expand
function MinimalDrawerContent({
  onExpand,
  taskColor,
}: {
  onExpand: () => void;
  taskColor: string;
}) {
  return (
    <button
      onClick={onExpand}
      className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
    >
      <p className="text-white/60 text-sm">
        💭 Ready to help with this task when you need me. Tap to expand.
      </p>
    </button>
  );
}

// Intermediate State: Input + quick actions
function IntermediateDrawerContent({
  onExpand,
  onCollapse,
  taskColor,
}: {
  onExpand: () => void;
  onCollapse: () => void;
  taskColor: string;
}) {
  return (
    <div className="px-6 py-4 h-full flex flex-col">
      {/* Last AI response (placeholder) */}
      <div className="mb-4 text-white/70 text-sm italic">
        "I can help you break this down into steps, brainstorm ideas, or just keep you company."
      </div>

      {/* Input Field */}
      <input
        type="text"
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30 focus:outline-none"
        placeholder="Ask me anything about this task..."
        onFocus={onExpand}
      />

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4">
        <button
          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 text-sm transition-colors"
          style={{ borderColor: taskColor, borderWidth: '1px', borderStyle: 'solid' }}
        >
          Brainstorm
        </button>
        <button
          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 text-sm transition-colors"
          style={{ borderColor: taskColor, borderWidth: '1px', borderStyle: 'solid' }}
        >
          Break Down
        </button>
        <button
          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 text-sm transition-colors"
          style={{ borderColor: taskColor, borderWidth: '1px', borderStyle: 'solid' }}
        >
          Summarize
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={onCollapse}
        className="mt-auto self-center text-white/40 hover:text-white/60 text-xs"
      >
        Collapse ▼
      </button>
    </div>
  );
}

// Full State: Conversation thread
function FullDrawerContent({
  onCollapse,
  taskColor,
}: {
  onCollapse: () => void;
  taskColor: string;
}) {
  // Mock conversation for demonstration
  const mockConversation = [
    { role: 'user', content: 'Help me get started with this task' },
    {
      role: 'assistant',
      content:
        "I'd be happy to help! Let's break this down into smaller, manageable steps. First, what's the main goal you're trying to achieve?",
    },
  ];

  return (
    <div className="flex flex-col h-full px-6 py-4">
      {/* Collapse button at top */}
      <button
        onClick={onCollapse}
        className="self-center text-white/40 hover:text-white/60 text-xs mb-3"
      >
        Collapse ▼
      </button>

      {/* Conversation Thread (scrollable) */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {mockConversation.map((msg, i) => (
          <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div
              className={`inline-block px-4 py-2 rounded-lg ${
                msg.role === 'user' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/90'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Placeholder for "thinking" state */}
        <div className="text-left">
          <div className="inline-block px-4 py-2 rounded-lg bg-white/5 text-white/50 text-sm italic">
            AI responses will appear here...
          </div>
        </div>
      </div>

      {/* Input Area (bottom) */}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30 focus:outline-none"
          placeholder="Continue the conversation..."
        />
        <button
          className="px-6 py-3 rounded-lg text-white font-medium transition-colors"
          style={{ backgroundColor: taskColor }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
