'use client';

import React, { useState, useMemo } from 'react';
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

  // Cloud color variants - mix of priority accent and purple/blue (boosted opacity for visibility)
  const cloudColors = useMemo(() => {
    const accentBase = priorityAccentColor.replace('0.08', '');
    const purple = 'rgba(168, 85, 247, ';
    const blue = 'rgba(59, 130, 246, ';
    const purpleBlue = 'rgba(139, 92, 246, ';

    return [
      accentBase + '0.55)', // Priority accent - high opacity
      accentBase + '0.45)', // Priority accent - medium opacity
      purple + '0.50)',      // Purple
      blue + '0.48)',        // Blue
      purpleBlue + '0.52)',  // Purple-blue mix
      accentBase + '0.40)', // Priority accent - lower opacity
    ];
  }, [priorityAccentColor]);

  // Generate scattered cloud puffs (10-12 clouds in 3 depth layers)
  // Positioned in -30° to +30° sector, outer 40% of radius
  const cloudPuffs = useMemo(() => {
    const clouds = [];
    const seed = task.id.charCodeAt(0); // Consistent randomization per task

    // Position clouds in upper arc (-30° to +30°, outer 40%)
    // X: 35-65% (centered at 50%, ±15% = ~30° arc)
    // Y: 5-20% (outer 40% of visible hemisphere)

    // Deep layer (3-4 large, slow clouds) - sizes reduced 50%, wider horizontal spread
    for (let i = 0; i < 4; i++) {
      clouds.push({
        id: `deep-${i}`,
        layer: 'deep',
        x: 28 + ((seed * 13 + i * 23) % 44), // 28-72% (increased from 35-65%, +25% spread)
        y: 5 + ((seed * 7 + i * 17) % 15),   // 5-20%
        size: 6 + ((seed + i * 11) % 4),     // 6-10% of planet (was 12-20%)
        baseOpacity: 0.70 + ((seed + i * 7) % 10) / 100, // 0.70-0.80 for visibility
        color: cloudColors[(seed + i * 3) % cloudColors.length],
        blurAmount: 15 + ((seed + i) % 8),   // Reduced from 50-65 to 15-23
        pulseSpeed: 50 + ((seed + i * 5) % 30),
        driftSpeed: 120 + ((seed + i * 7) % 30),
        pulseDelay: (i * 15) % 60,
        driftDelay: (i * 20) % 80,
      });
    }

    // Mid layer (8 medium clouds) - sizes reduced 50%, concentrated near middle-top
    for (let i = 0; i < 8; i++) {
      // Last 2 clouds positioned much higher (can clip edge)
      const yOffset = i >= 6 ? -1 : 6; // -1 to 12% for newest (clips edge), 6-19% for others
      const yRange = i >= 6 ? 13 : 13;

      clouds.push({
        id: `mid-${i}`,
        layer: 'mid',
        x: 37 + ((seed * 17 + i * 29) % 26), // 37-63%
        y: yOffset + ((seed * 11 + i * 19) % yRange),
        size: 4 + ((seed + i * 13) % 3),     // 4-7% of planet (was 8-14%)
        baseOpacity: 0.80 + ((seed + i * 9) % 10) / 100, // 0.80-0.90 for visibility
        color: cloudColors[(seed + i * 5) % cloudColors.length],
        blurAmount: 12 + ((seed + i) % 8),   // Reduced from 35-50 to 12-20
        pulseSpeed: 40 + ((seed + i * 7) % 25),
        driftSpeed: 90 + ((seed + i * 9) % 30),
        pulseDelay: (i * 12) % 50,
        driftDelay: (i * 18) % 70,
      });
    }

    // Surface layer (60 small pinkish clouds) - arranged in clusters around planet for mottled effect
    // Create 8 clumps distributed around visible surface
    const clumpCenters = [
      { x: 33, y: 4 },   // Left-upper clump
      { x: 42, y: 6 },   // Center-upper clump
      { x: 35, y: 10 },  // Left-middle clump
      { x: 58, y: 3 },   // Right-upper clump
      { x: 48, y: 12 },  // Center-middle clump
      { x: 28, y: 7 },   // Far-left clump
      { x: 52, y: 8 },   // Right-center clump (new)
      { x: 38, y: 14 },  // Center-lower clump (new)
    ];

    for (let i = 0; i < 60; i++) {
      const clumpIndex = i % 8; // Cycle through all 8 clumps
      const clump = clumpCenters[clumpIndex];

      // Varied ellipse heights for shape variation (50-75% of width) - more horizontal stretching
      const heightRatio = 0.50 + ((seed + i * 7) % 25) / 100; // 0.50-0.75

      clouds.push({
        id: `surface-${i}`,
        layer: 'surface',
        x: clump.x + ((seed * 19 + i * 31) % 12) - 6, // ±6% from clump center
        y: clump.y + ((seed * 13 + i * 21) % 10) - 5, // ±5% from clump center
        size: 6 + ((seed + i * 15) % 4), // 6-10% of planet (2x width: was 3-5%)
        heightRatio: heightRatio, // More horizontal ellipses
        baseOpacity: 0.30 + ((seed + i * 11) % 15) / 100, // 0.30-0.45 for blending
        color: priorityAccentColor.replace('0.08', '0.55'), // Only priority accent (pinkish)
        pulseSpeed: 35 + ((seed + i * 9) % 20),
        driftSpeed: 80 + ((seed + i * 11) % 25),
        pulseDelay: (i * 10) % 40,
        driftDelay: (i * 15) % 60,
      });
    }

    return clouds;
  }, [task.id, cloudColors]);

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
        {/* Scattered cloud puffs - radial gradients with varied ellipse shapes */}
        {/* Note: No individual blur - planet's backdrop-blur-xl handles all softening */}
        {cloudPuffs.map((cloud) => {
          // Use heightRatio if available (surface layer), otherwise default 75%
          const heightMultiplier = cloud.heightRatio || 0.75;

          return (
            <div
              key={cloud.id}
              className="absolute rounded-full pointer-events-none animate-cloud-pulse animate-cloud-drift"
              style={{
                left: `${cloud.x}%`,
                top: `${cloud.y}%`,
                width: `${cloud.size}%`,
                height: `${cloud.size * heightMultiplier}%`,
                background: `radial-gradient(ellipse, ${cloud.color}, transparent 70%)`,
                opacity: cloud.baseOpacity,
                '--base-opacity': cloud.baseOpacity,
                '--pulse-duration': `${cloud.pulseSpeed}s`,
                '--drift-duration': `${cloud.driftSpeed}s`,
                animationDelay: `${cloud.pulseDelay}s, ${cloud.driftDelay}s`,
                transform: 'translate(-50%, -50%)',
                willChange: cloud.layer === 'surface' || cloud.layer === 'mid' ? 'transform' : 'auto',
              } as React.CSSProperties}
            />
          );
        })}

        {/* Base color wash for cohesion */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.08))',
          }}
        />

        {/* Dramatic depth gradient - dark at top edge to light at center */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.25) 40%, rgba(0, 0, 0, 0.55) 70%, rgba(0, 0, 0, 0.75) 100%)',
          }}
        />
      </div>

      {/* Large atmospheric features - TEMP: solid for positioning */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none transition-all duration-500 ease-out"
        style={{
          width: planetRadius,
          height: planetRadius,
          zIndex: -5,
        }}
      >
        {/* Feature 1 - large atmospheric swirl (priority accent variant) */}
        <div
          className="absolute rounded-full animate-atmosphere-drift-1"
          style={{
            width: '12.5%',
            height: '6.25%',
            left: '38%',
            top: '8%',
            background: `radial-gradient(ellipse, ${priorityAccentColor.replace('0.08', '0.18')}, ${priorityAccentColor.replace('0.08', '0.12')} 40%, transparent 70%)`,
            filter: 'blur(45px)',
            opacity: 0.7,
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Feature 2 - large atmospheric swirl (purplish) */}
        <div
          className="absolute rounded-full animate-atmosphere-drift-2"
          style={{
            width: '11%',
            height: '5.5%',
            left: '58%',
            top: '12%',
            background: 'radial-gradient(ellipse, rgba(168, 85, 247, 0.16), rgba(139, 92, 246, 0.10) 40%, transparent 70%)',
            filter: 'blur(40px)',
            opacity: 0.7,
            transform: 'translate(-50%, -50%)',
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
