'use client';

import React, { useState } from 'react';
import { Task } from '@/app/lib/types';

interface AIDrawerProps {
  drawerState: 'minimal' | 'intermediate' | 'full';
  task: Task;
  taskColor: string;
  taskNotes: string;
  onChangeDrawerState: (state: 'minimal' | 'intermediate' | 'full') => void;
  onUpdateNotes: (notes: string) => void;
}

/**
 * AI Drawer - Three-State Interactive Panel
 *
 * Three progressive disclosure states:
 * 1. Minimal (15%): Single line of contextual text
 * 2. Intermediate (30%): Input field + quick actions
 * 3. Full (60-70%): Full conversation thread + notes (side-by-side on desktop)
 *
 * TODO: AI Integration Phase
 * - Connect to actual AI service
 * - Conversation history persistence
 * - Contextual suggestions based on task type
 */
export default function AIDrawer({
  drawerState,
  task,
  taskColor,
  taskNotes,
  onChangeDrawerState,
  onUpdateNotes,
}: AIDrawerProps) {
  const [mobileActivePanel, setMobileActivePanel] = useState<'ai' | 'notes'>('ai');

  // Get priority-based colors matching TaskNode (subtle alpha for large planet)
  const priorityBgColor =
    task.priority === 'urgent'
      ? 'rgba(127, 29, 29, 0.1)' // red-900
      : task.priority === 'high'
        ? 'rgba(124, 45, 18, 0.1)' // orange-900
        : task.priority === 'medium'
          ? 'rgba(113, 63, 18, 0.1)' // yellow-900
          : 'rgba(30, 58, 138, 0.1)'; // blue-900

  const priorityBorderColor =
    task.priority === 'urgent'
      ? 'rgba(239, 68, 68, 0.15)' // red
      : task.priority === 'high'
        ? 'rgba(249, 115, 22, 0.15)' // orange
        : task.priority === 'medium'
          ? 'rgba(234, 179, 8, 0.15)' // yellow
          : 'rgba(59, 130, 246, 0.15)'; // blue

  // Priority accent color for organic gradients (subtle)
  const priorityAccentColor =
    task.priority === 'urgent'
      ? 'rgba(239, 68, 68, 0.08)' // red
      : task.priority === 'high'
        ? 'rgba(249, 115, 22, 0.08)' // orange
        : task.priority === 'medium'
          ? 'rgba(234, 179, 8, 0.08)' // yellow
          : 'rgba(59, 130, 246, 0.08)'; // blue

  // Priority glow color for atmospheric effect
  const priorityGlowColor =
    task.priority === 'urgent'
      ? 'rgba(239, 68, 68, 0.15)' // red
      : task.priority === 'high'
        ? 'rgba(249, 115, 22, 0.15)' // orange
        : task.priority === 'medium'
          ? 'rgba(234, 179, 8, 0.15)' // yellow
          : 'rgba(59, 130, 246, 0.15)'; // blue
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
    full: 'h-[calc(65vh+80px)]',
  }[drawerState];

  // Planet circle properties - scales with drawer (REVERSED: larger drawer = larger circle)
  const planetRadius = {
    minimal: '150vw',      // Far away - 1.5x diameter, curved horizon
    intermediate: '200vw', // Medium distance - 2x diameter
    full: '400vw',         // Close - 4x diameter, flat horizon
  }[drawerState];

  // Atmospheric glow - scales with drawer state (planet distance)
  const planetGlow = {
    minimal: `0 0 20px 3px ${priorityGlowColor.replace('0.15', '0.04')}, 0 0 40px 6px ${priorityGlowColor.replace('0.15', '0.02')}`,
    intermediate: `0 0 30px 5px ${priorityGlowColor.replace('0.15', '0.06')}, 0 0 60px 10px ${priorityGlowColor.replace('0.15', '0.03')}`,
    full: `0 0 40px 8px ${priorityGlowColor.replace('0.15', '0.08')}, 0 0 80px 16px ${priorityGlowColor.replace('0.15', '0.04')}`,
  }[drawerState];

  return (
    <div
      className={`relative ${heightClass} transition-all duration-500 ease-out`}
      style={{
        background: 'transparent',
        overflow: 'visible',
      }}
    >
      {/* Planet surface circle - background layer (z-0) */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full pointer-events-none transition-all duration-500 ease-out backdrop-blur-xl border overflow-hidden -z-10"
        style={{
          width: planetRadius,
          height: planetRadius,
          backgroundColor: priorityBgColor,
          borderColor: priorityBorderColor,
          boxShadow: planetGlow,
        }}
      >
        {/* Animated cloud gradients - Layer 1: Primary colors */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none animate-cloud-drift-1"
          style={{
            background: `
              radial-gradient(ellipse 60% 45% at 20% 12%, ${priorityAccentColor.replace('0.08', '0.15')}, transparent 65%),
              radial-gradient(ellipse 35% 55% at 50% 8%, rgba(168, 85, 247, 0.18), transparent 70%),
              radial-gradient(ellipse 70% 30% at 75% 18%, rgba(59, 130, 246, 0.12), transparent 60%),
              radial-gradient(ellipse 25% 40% at 35% 22%, ${priorityAccentColor.replace('0.08', '0.10')}, transparent 75%),
              radial-gradient(ellipse 50% 25% at 65% 15%, rgba(147, 51, 234, 0.14), transparent 68%)
            `,
          }}
        />

        {/* Animated cloud gradients - Layer 2: Complementary hues with opacity fade */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none animate-cloud-drift-2 animate-opacity-pulse-1"
          style={{
            background: `
              radial-gradient(ellipse 45% 60% at 65% 10%, rgba(139, 92, 246, 0.16), transparent 68%),
              radial-gradient(ellipse 55% 35% at 25% 18%, rgba(59, 130, 246, 0.14), transparent 65%),
              radial-gradient(ellipse 40% 50% at 80% 15%, ${priorityAccentColor.replace('0.08', '0.12')}, transparent 70%),
              radial-gradient(ellipse 65% 40% at 45% 8%, rgba(168, 85, 247, 0.10), transparent 62%)
            `,
          }}
        />

        {/* Animated cloud gradients - Layer 3: Accent variations with slower fade */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none animate-cloud-drift-3 animate-opacity-pulse-2"
          style={{
            background: `
              radial-gradient(ellipse 50% 55% at 15% 20%, rgba(147, 51, 234, 0.13), transparent 66%),
              radial-gradient(ellipse 38% 48% at 70% 12%, rgba(99, 102, 241, 0.11), transparent 72%),
              radial-gradient(ellipse 58% 42% at 40% 15%, ${priorityAccentColor.replace('0.08', '0.11')}, transparent 68%),
              radial-gradient(ellipse 42% 52% at 85% 18%, rgba(59, 130, 246, 0.09), transparent 70%)
            `,
          }}
        />

        {/* Base color wash for cohesion */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.08))',
          }}
        />

        {/* Depth/Atmospheric gradient - dims upper (further) part of planet */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.15) 25%, transparent 50%)',
          }}
        />
      </div>

      {/* Drawer content - foreground layer (relative, natural stacking) */}
      <div className="relative z-10">
        {/* Drag Handle Indicator (mobile-friendly + tappable) */}
        <button
          onClick={drawerState === 'full' ? () => onChangeDrawerState('minimal') : expandDrawer}
          className="flex justify-center pt-4 pb-1 w-full hover:opacity-80 transition-opacity cursor-pointer"
          aria-label={drawerState === 'full' ? 'Minimize AI assistant' : 'Expand AI assistant'}
        >
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </button>

      {/* Spacing between drag handle and content - progressive padding */}
      <div className={`transition-all duration-500 ${
        drawerState === 'minimal' ? 'pt-6' :
        drawerState === 'intermediate' ? 'pt-8' :
        'pt-12'
      }`}>
        {/* Content based on drawer state */}
        {drawerState === 'minimal' && (
          <MinimalDrawerContent onExpand={expandDrawer} taskColor={taskColor} />
        )}

      {drawerState === 'intermediate' && (
        <IntermediateDrawerContent
          onExpand={expandDrawer}
          taskColor={taskColor}
        />
      )}

      {drawerState === 'full' && (
        <FullDrawerContent
          taskColor={taskColor}
          taskNotes={taskNotes}
          onUpdateNotes={onUpdateNotes}
          mobileActivePanel={mobileActivePanel}
          onChangeMobilePanel={setMobileActivePanel}
        />
      )}
      </div>
      </div>
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
    <div className="max-w-2xl mx-auto w-full h-full">
      <button
        onClick={onExpand}
        className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
      >
        <p className="text-white/60 text-sm">
          💭 Ready to help with this task when you need me. Tap to expand.
        </p>
      </button>
    </div>
  );
}

// Intermediate State: Input + quick actions
function IntermediateDrawerContent({
  onExpand,
  taskColor,
}: {
  onExpand: () => void;
  taskColor: string;
}) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-4 h-full flex flex-col">
      {/* Last AI response (placeholder) */}
      <div className="mb-4 text-white/70 text-sm italic">
        "I can help you break this down into steps, brainstorm ideas, or just keep you company."
      </div>

      {/* Input Field */}
      <input
        type="text"
        className="w-full px-4 py-3 bg-black/30 backdrop-blur-xl border border-white/20 rounded-full text-white placeholder:text-white/40 focus:bg-black/40 focus:border-white/30 focus:outline-none transition-all duration-200 shadow-lg"
        placeholder="Ask me anything about this task..."
        onFocus={onExpand}
      />

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4">
        <button
          className="px-3 py-2 bg-black/30 backdrop-blur-xl border border-white/20 hover:bg-black/40 hover:border-white/30 rounded-full text-white/80 text-sm transition-all duration-200 shadow-lg"
        >
          Brainstorm
        </button>
        <button
          className="px-3 py-2 bg-black/30 backdrop-blur-xl border border-white/20 hover:bg-black/40 hover:border-white/30 rounded-full text-white/80 text-sm transition-all duration-200 shadow-lg"
        >
          Break Down
        </button>
        <button
          className="px-3 py-2 bg-black/30 backdrop-blur-xl border border-white/20 hover:bg-black/40 hover:border-white/30 rounded-full text-white/80 text-sm transition-all duration-200 shadow-lg"
        >
          Summarize
        </button>
      </div>
    </div>
  );
}

// Full State: Conversation thread + Notes (side-by-side on desktop, swappable on mobile)
function FullDrawerContent({
  taskColor,
  taskNotes,
  onUpdateNotes,
  mobileActivePanel,
  onChangeMobilePanel,
}: {
  taskColor: string;
  taskNotes: string;
  onUpdateNotes: (notes: string) => void;
  mobileActivePanel: 'ai' | 'notes';
  onChangeMobilePanel: (panel: 'ai' | 'notes') => void;
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
    <div className="max-w-7xl mx-auto flex flex-col h-full px-6 py-4">

      {/* Mobile: Panel Swap Buttons */}
      <div className="flex md:hidden gap-2 mb-3">
        <button
          onClick={() => onChangeMobilePanel('ai')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mobileActivePanel === 'ai'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/50 hover:bg-white/10'
          }`}
          style={
            mobileActivePanel === 'ai'
              ? { borderColor: taskColor, borderWidth: '2px', borderStyle: 'solid' }
              : {}
          }
        >
          💬 AI Assistant
        </button>
        <button
          onClick={() => onChangeMobilePanel('notes')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mobileActivePanel === 'notes'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/50 hover:bg-white/10'
          }`}
          style={
            mobileActivePanel === 'notes'
              ? { borderColor: taskColor, borderWidth: '2px', borderStyle: 'solid' }
              : {}
          }
        >
          📝 Notes
        </button>
      </div>

      {/* Desktop: Side-by-side layout | Mobile: Single panel */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Notes Panel */}
        <div
          className={`flex flex-col ${
            mobileActivePanel === 'notes' ? 'flex' : 'hidden'
          } md:flex md:w-1/3 md:border-r md:border-white/10 md:pr-4`}
        >
          <div className="mb-2 text-white/70 text-xs font-medium uppercase tracking-wide">
            Task Notes
          </div>
          <textarea
            className="flex-1 px-3 py-2 bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl text-white text-sm placeholder:text-white/40 focus:bg-black/40 focus:border-white/30 focus:outline-none resize-none transition-all duration-200 shadow-lg"
            placeholder="Notes for this task..."
            value={taskNotes}
            onChange={(e) => onUpdateNotes(e.target.value)}
          />
        </div>

        {/* AI Panel */}
        <div
          className={`flex flex-col flex-1 ${
            mobileActivePanel === 'ai' ? 'flex' : 'hidden'
          } md:flex md:w-2/3`}
        >
          {/* Conversation Thread (scrollable) */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3">
            {mockConversation.map((msg, i) => (
              <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block px-4 py-2 rounded-2xl backdrop-blur-lg border shadow-md ${
                    msg.role === 'user'
                      ? 'bg-black/40 border-white/30 text-white'
                      : 'bg-black/30 border-white/20 text-white/90'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Placeholder for "thinking" state */}
            <div className="text-left">
              <div className="inline-block px-4 py-2 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10 text-white/50 text-sm italic shadow-md">
                AI responses will appear here...
              </div>
            </div>
          </div>

          {/* Input Area (bottom) */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              className="flex-1 px-4 py-2 bg-black/30 backdrop-blur-xl border border-white/20 rounded-full text-white placeholder:text-white/40 focus:bg-black/40 focus:border-white/30 focus:outline-none transition-all duration-200 shadow-lg"
              placeholder="Continue the conversation..."
            />
            <button
              className="px-4 py-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-400/30 rounded-full text-purple-200 hover:text-purple-100 hover:border-purple-300 transition-all duration-200 shadow-lg"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
