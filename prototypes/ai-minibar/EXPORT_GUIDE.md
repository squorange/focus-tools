# AI Mini-Bar Export Guide

This guide documents how to integrate the AI Mini-Bar components into the Focus Tools app.

## Overview

The AI Mini-Bar is a floating assistant widget with three modes:
- **Collapsed (Mini-Bar)**: Compact 48px pill showing status/nudges
- **Expanded (Palette)**: Quick actions + AI input with inline responses
- **Drawer**: Full chat history with scrollable messages

## Required Files

### Core Components
```
components/ai-assistant/
├── AIAssistantOverlay.tsx   # Unified collapsed/expanded container
├── MiniBarContent.tsx       # Collapsed mode content
├── PaletteContent.tsx       # Expanded mode content (quick actions + input)
├── Drawer.tsx               # Full-screen chat drawer
├── ResponseDisplay.tsx      # AI response renderer
├── ChatHistory.tsx          # Message list for drawer
└── QuickActions.tsx         # Quick action chips
```

### Hooks
```
hooks/
├── useAIAssistant.ts        # State management for AI modes
├── useKeyboardShortcuts.ts  # Cmd+K and Escape handlers
├── useMediaQuery.ts         # Device type detection (mobile/tablet/desktop)
└── useReducedMotion.ts      # Accessibility: prefers-reduced-motion
```

### Library Files
```
lib/
├── types.ts                 # TypeScript interfaces
├── constants.ts             # Animation configs, dimensions
└── mock-responses.ts        # Demo data (not needed in production)
```

## Dependencies

Add to your `package.json`:
```json
{
  "dependencies": {
    "framer-motion": "^12.24.7"
  }
}
```

## TypeScript Types

Key interfaces from `lib/types.ts`:

```typescript
// AI Assistant modes
type AIAssistantMode = 'collapsed' | 'expanded' | 'drawer';
type AIAssistantContext = 'global' | 'queue' | 'taskDetail' | 'focusMode' | 'inbox';

// Collapsed mode content
interface CollapsedContent {
  type: 'idle' | 'nudge' | 'status';
  text: string;
  icon?: string;
}

// AI Response types
type AIResponseType = 'text' | 'suggestions' | 'explanation' | 'error';

interface AIResponse {
  type: AIResponseType;
  content: TextContent | SuggestionsContent | ExplanationContent;
  actions?: ResponseAction[];
}

// Quick actions
interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  query: string;
}
```

## Usage Example

```tsx
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AIAssistantOverlay } from '@/components/ai-assistant/AIAssistantOverlay';
import { Drawer } from '@/components/ai-assistant/Drawer';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function App() {
  const {
    state,
    quickActions,
    expand,
    collapse,
    openDrawer,
    closeDrawer,
    setQuery,
    submitQuery,
    acceptSuggestions,
    dismissResponse,
  } = useAIAssistant({ initialContext: 'global' });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggle: () => state.mode === 'collapsed' ? expand() : collapse(),
    onEscape: () => {
      if (state.response) dismissResponse();
      else if (state.query) setQuery('');
      else collapse();
    },
    enabled: true,
  });

  return (
    <>
      {/* Content area */}
      <main style={{ paddingBottom: state.mode === 'expanded' ? 372 : 120 }}>
        {/* Your app content */}
      </main>

      {/* AI Assistant Overlay */}
      {(state.mode === 'collapsed' || state.mode === 'expanded') && (
        <div className="fixed bottom-[72px] left-0 right-0 z-50 flex px-4 sm:px-0 sm:justify-center">
          <AIAssistantOverlay
            mode={state.mode}
            collapsedContent={state.collapsedContent}
            onExpand={expand}
            query={state.query}
            onQueryChange={setQuery}
            onSubmit={submitQuery}
            isLoading={state.isLoading}
            response={state.response}
            quickActions={quickActions}
            onCollapse={collapse}
            onOpenDrawer={openDrawer}
            onAccept={acceptSuggestions}
            onDismiss={dismissResponse}
          />
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {state.mode === 'drawer' && (
          <Drawer
            messages={state.messages}
            query={state.query}
            onQueryChange={setQuery}
            onSubmit={submitQuery}
            isLoading={state.isLoading}
            onClose={closeDrawer}
          />
        )}
      </AnimatePresence>
    </>
  );
}
```

## Animation Constants

From `lib/constants.ts`:

```typescript
// Spring configs
export const SPRING_CONFIG = { type: 'spring', damping: 25, stiffness: 400 };
export const SPRING_REDUCED = { type: 'spring', damping: 30, stiffness: 500 }; // Less bouncy

// Height transitions (no overshoot)
export const HEIGHT_TRANSITION = {
  type: 'tween',
  duration: 0.3,
  ease: [0.32, 0.72, 0, 1],
};

// Dimensions
export const HEIGHTS = {
  minibar: 48,
  expandedMax: 400,
  drawerHeight: '60vh',
};

export const WIDTHS = {
  default: 400,
  drawer: 400,
};
```

## Accessibility Features

- **Reduced motion**: All animations respect `prefers-reduced-motion`
- **ARIA attributes**: Dialog roles, labels, and live regions
- **Keyboard navigation**: Cmd+K toggle, Escape to dismiss
- **Screen reader**: `aria-live="polite"` for loading/response announcements

## Integration Notes

1. **Positioning**: The overlay is positioned `bottom-[72px]` assuming a 56px tab bar + safe area
2. **Z-index**: Uses `z-50` for overlay, `z-30` for tab bar
3. **Safe areas**: Supports iPhone notch/home bar with `env(safe-area-inset-*)`
4. **Dark mode**: Uses Tailwind `dark:` variants throughout
5. **Width**: 400px on tablet/desktop, full-width on mobile

## Connecting to Real AI

Replace mock responses in `useAIAssistant.ts`:

```typescript
const submitQuery = async () => {
  setState(prev => ({ ...prev, isLoading: true }));

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      body: JSON.stringify({
        query: state.query,
        context: state.context
      }),
    });
    const data = await response.json();

    setState(prev => ({
      ...prev,
      isLoading: false,
      response: data.response,
      messages: [...prev.messages,
        { role: 'user', content: prev.query },
        { role: 'assistant', content: data.response }
      ],
    }));
  } catch (error) {
    setState(prev => ({
      ...prev,
      isLoading: false,
      response: { type: 'error', content: { text: 'Failed to get response' } },
    }));
  }
};
```

## File Checklist

Copy these files to your project:

- [ ] `components/ai-assistant/AIAssistantOverlay.tsx`
- [ ] `components/ai-assistant/MiniBarContent.tsx`
- [ ] `components/ai-assistant/PaletteContent.tsx`
- [ ] `components/ai-assistant/Drawer.tsx`
- [ ] `components/ai-assistant/ResponseDisplay.tsx`
- [ ] `components/ai-assistant/ChatHistory.tsx`
- [ ] `components/ai-assistant/QuickActions.tsx`
- [ ] `hooks/useAIAssistant.ts`
- [ ] `hooks/useKeyboardShortcuts.ts`
- [ ] `hooks/useMediaQuery.ts`
- [ ] `hooks/useReducedMotion.ts`
- [ ] `lib/types.ts`
- [ ] `lib/constants.ts`
- [ ] Add `framer-motion` dependency
