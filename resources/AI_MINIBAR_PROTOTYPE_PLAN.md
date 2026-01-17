# AI Mini-Bar Prototype Plan

> **Purpose:** Isolated prototype to nail mini-bar/palette/drawer interactions before integrating into Focus Tools  
> **Approach:** Separate Next.js project, interaction-first, mock AI responses  
> **Target:** 2-3 focused Claude Code sessions  
> **Location:** `~/Projects/focus-tools/prototypes/ai-minibar/`

---

## How to Use This Document

This is the design spec and implementation plan for Claude Code sessions. 

**For each session:**
1. Share this entire document as project context
2. Copy the specific session prompt into the chat
3. Reference this doc for types, structure, and visual specs

**Key sections:**
- **Component Architecture** — file structure and hierarchy
- **Core Types** — copy these into the project
- **Component Specifications** — detailed requirements per component
- **Claude Code Prompts** — ready-to-use prompts for each session

---

## Design Reference

**Primary inspiration:** Apple Music's "Now Playing" mini-player bar (see attached image reference)
- Persistent bar at bottom showing current state
- Tap to expand into larger interactive view  
- Familiar iOS pattern users already understand

**Interaction model:**
```
┌─────────────┐      tap       ┌─────────────┐   "More help"   ┌─────────────┐
│  COLLAPSED  │ ──────────────▶│  EXPANDED   │ ───────────────▶│   DRAWER    │
│  (MiniBar)  │◀────────────── │  (Palette)  │◀─────────────── │  (Chat)     │
└─────────────┘  swipe/dismiss └─────────────┘     "Done"      └─────────────┘
```

**Desktop consideration (future):** Start with centered bottom bar same as mobile. Later option: bottom-right corner floating widget that expands to left-anchored drawer.

---

## Component Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        App Shell                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                   Demo Content                        │ │
│  │         (Mock task list, buttons to trigger           │ │
│  │          different contexts and responses)            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    AIAssistant                        │ │
│  │  (Container managing state between all three modes)   │ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │              MiniBar (collapsed)                │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  │                        ↕                              │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │              Palette (expanded)                 │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  │                        ↕                              │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │              Drawer (full chat)                 │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    Tab Bar (mock)                     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
src/
├── components/
│   ├── ai-assistant/
│   │   ├── AIAssistant.tsx        # Container, state machine
│   │   ├── MiniBar.tsx            # Collapsed state
│   │   ├── Palette.tsx            # Expanded state
│   │   ├── Drawer.tsx             # Full chat state
│   │   ├── QuickActions.tsx       # Action chips
│   │   ├── ResponseDisplay.tsx    # Renders AI responses
│   │   │   ├── TextResponse.tsx
│   │   │   └── SuggestionsResponse.tsx
│   │   ├── ChatHistory.tsx        # For drawer mode
│   │   └── types.ts               # Shared types
│   │
│   └── demo/
│       ├── DemoShell.tsx          # App container
│       ├── MockTaskList.tsx       # Fake content
│       ├── ContextSwitcher.tsx    # Switch contexts for testing
│       └── ResponseTriggers.tsx   # Buttons to simulate AI responses
│
├── hooks/
│   ├── useAIAssistant.ts          # Main state management hook
│   ├── useKeyboardShortcuts.ts    # ⌘K handling
│   └── useAnimations.ts           # Shared animation configs
│
├── lib/
│   ├── types.ts                   # Core types
│   ├── mock-responses.ts          # Fake AI responses for testing
│   └── constants.ts               # Animation timings, etc.
│
├── app/
│   ├── page.tsx                   # Main demo page
│   ├── layout.tsx
│   └── globals.css
│
└── package.json
```

### Core Types

```typescript
// lib/types.ts

// ============ State Machine ============

type AIAssistantMode = 'collapsed' | 'expanded' | 'drawer';

type AIAssistantContext = 
  | 'queue'        // Focus Queue view
  | 'taskDetail'   // Viewing a specific task
  | 'focusMode'    // In focus session
  | 'inbox'        // Inbox/triage view
  | 'global';      // Fallback

interface AIAssistantState {
  mode: AIAssistantMode;
  context: AIAssistantContext;
  
  // Collapsed state content
  collapsedContent: CollapsedContent;
  
  // Expanded state
  query: string;
  isLoading: boolean;
  response: AIResponse | null;
  
  // Drawer state
  messages: Message[];
  
  // Shared
  error: string | null;
}

// ============ Collapsed Content ============

type CollapsedContentType = 
  | 'idle'           // "Ask AI for help..."
  | 'nudge'          // Proactive suggestion
  | 'status'         // Contextual info
  | 'response'       // Brief response summary
  | 'loading';       // Waiting for AI

interface CollapsedContent {
  type: CollapsedContentType;
  text: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============ Responses ============

type AIResponseType = 'text' | 'suggestions' | 'explanation' | 'error';

interface AIResponse {
  type: AIResponseType;
  content: TextContent | SuggestionsContent | ExplanationContent;
  actions?: ResponseAction[];
}

interface TextContent {
  text: string;
}

interface SuggestionsContent {
  message: string;
  suggestions: Suggestion[];
}

interface Suggestion {
  id: string;
  text: string;
  substeps?: { id: string; text: string }[];
}

interface ExplanationContent {
  title: string;      // What's being explained
  explanation: string;
}

interface ResponseAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
}

// ============ Quick Actions ============

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  query: string;       // What to send to AI
  contexts: AIAssistantContext[];  // Where this appears
}

// ============ Messages (for Drawer) ============

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  response?: AIResponse;  // Structured response if applicable
}
```

### State Machine Logic

```typescript
// hooks/useAIAssistant.ts

type AIAction =
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'OPEN_DRAWER' }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SUBMIT_QUERY' }
  | { type: 'RECEIVE_RESPONSE'; response: AIResponse }
  | { type: 'ACCEPT_SUGGESTIONS' }
  | { type: 'DISMISS_RESPONSE' }
  | { type: 'SET_CONTEXT'; context: AIAssistantContext }
  | { type: 'SET_NUDGE'; nudge: CollapsedContent }
  | { type: 'CLEAR_NUDGE' }
  | { type: 'ERROR'; error: string };

// State transitions
const transitions: Record<AIAssistantMode, AIAction['type'][]> = {
  collapsed: ['EXPAND', 'OPEN_DRAWER', 'SET_NUDGE', 'CLEAR_NUDGE'],
  expanded: ['COLLAPSE', 'OPEN_DRAWER', 'SET_QUERY', 'SUBMIT_QUERY', 
             'RECEIVE_RESPONSE', 'ACCEPT_SUGGESTIONS', 'DISMISS_RESPONSE'],
  drawer: ['CLOSE_DRAWER', 'SET_QUERY', 'SUBMIT_QUERY', 'RECEIVE_RESPONSE'],
};
```

### Animation Specifications

```typescript
// lib/constants.ts

export const ANIMATIONS = {
  // Collapse ↔ Expand transition
  expandDuration: 300,      // ms
  expandEasing: 'cubic-bezier(0.32, 0.72, 0, 1)', // iOS-like spring
  
  // Expand ↔ Drawer transition
  drawerDuration: 350,
  drawerEasing: 'cubic-bezier(0.32, 0.72, 0, 1)',
  
  // Content fade
  contentFadeDuration: 150,
  
  // Response appear
  responseDelay: 50,        // Stagger for list items
  
  // Auto-collapse after response accepted
  autoCollapseDelay: 300,
};

export const HEIGHTS = {
  collapsed: 56,            // px
  expandedMin: 200,         // Minimum expanded height
  expandedMax: '50vh',      // Maximum expanded height
  drawerHeight: '85vh',     // Drawer covers most of screen
};

export const BREAKPOINTS = {
  mobile: 640,              // Below this: bottom sheet pattern
  desktop: 641,             // Above this: could use different pattern
};
```

---

## Component Specifications

### AIAssistant.tsx (Container)

**Responsibilities:**
- Owns state machine (useReducer)
- Provides context to children
- Handles keyboard shortcuts
- Manages backdrop/overlay
- Coordinates animations between modes

**Props:**
```typescript
interface AIAssistantProps {
  context: AIAssistantContext;
  onSubmit: (query: string, context: AIAssistantContext) => Promise<AIResponse>;
  onAcceptSuggestions?: (suggestions: Suggestion[]) => void;
  nudge?: CollapsedContent;
  className?: string;
}
```

### MiniBar.tsx (Collapsed)

**Responsibilities:**
- Render collapsed content based on type
- Handle tap to expand
- Show action button if present
- Animate content changes

**Visual States:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✨  Ask AI for help...                                 ⌃  │  ← idle
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ✨  "File taxes" deadline in 3 days              [Focus]  │  ← nudge
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ✨  5 steps • ~45 min estimated                           │  ← status
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ◐  Thinking...                                            │  ← loading
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ✨  Added 5 steps — tap to review                      ⌃  │  ← response
└─────────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface MiniBarProps {
  content: CollapsedContent;
  onExpand: () => void;
  isAnimating: boolean;
}
```

### Palette.tsx (Expanded)

**Responsibilities:**
- Input field with submit
- Quick action chips (context-aware)
- Display loading state
- Render response (delegates to ResponseDisplay)
- Handle dismiss/accept actions
- "More help →" escape hatch

**Props:**
```typescript
interface PaletteProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  response: AIResponse | null;
  quickActions: QuickAction[];
  onCollapse: () => void;
  onOpenDrawer: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}
```

### Drawer.tsx (Full Chat)

**Responsibilities:**
- Full message history
- Scrollable chat area
- Input at bottom
- Close button
- "Back to mini" option

**Props:**
```typescript
interface DrawerProps {
  messages: Message[];
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onClose: () => void;
}
```

---

## Demo Shell Specifications

### DemoShell.tsx

Provides fake app chrome to test the AI assistant in realistic context.

```
┌─────────────────────────────────────────────────────────────┐
│  AI Mini-Bar Prototype                              [Dark] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Context: [Queue ▾]                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Mock Task List / Content                  │   │
│  │                                                     │   │
│  │  □ Task 1: File taxes                              │   │
│  │  □ Task 2: Buy groceries                           │   │
│  │  □ Task 3: Call mom                                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Trigger Responses:                                        │
│  [Text] [Suggestions] [Explanation] [Error] [Nudge]        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AIAssistant Component                  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  [Home]                    [Tasks]                 [Search] │
└─────────────────────────────────────────────────────────────┘
```

### Mock Responses

```typescript
// lib/mock-responses.ts

export const MOCK_RESPONSES: Record<string, AIResponse> = {
  breakdown: {
    type: 'suggestions',
    content: {
      message: "I'll add 5 steps to help you file taxes:",
      suggestions: [
        { id: '1', text: 'Gather W-2 and 1099 forms' },
        { id: '2', text: 'Collect deduction receipts' },
        { id: '3', text: 'Choose filing method (TurboTax, CPA, etc.)' },
        { id: '4', text: 'Complete federal return' },
        { id: '5', text: 'Complete state return' },
      ],
    },
    actions: [
      { id: 'accept', label: 'Add steps', variant: 'primary', onClick: () => {} },
      { id: 'dismiss', label: 'Dismiss', variant: 'ghost', onClick: () => {} },
    ],
  },
  
  whatNext: {
    type: 'text',
    content: {
      text: "Based on your queue, I'd suggest starting with \"File taxes\" — it's high priority and the deadline is approaching. The first step is straightforward: gather your W-2 forms.",
    },
    actions: [
      { id: 'focus', label: 'Focus on it', variant: 'primary', onClick: () => {} },
      { id: 'other', label: 'Show other options', variant: 'secondary', onClick: () => {} },
    ],
  },
  
  explain: {
    type: 'explanation',
    content: {
      title: 'Choose filing method',
      explanation: "This means deciding between:\n\n• TurboTax/H&R Block — DIY software, $50-150\n• IRS Free File — Free if income <$79k\n• CPA — Professional help, $200-500\n\nYour situation looks straightforward, so TurboTax or Free File would work well.",
    },
    actions: [
      { id: 'gotit', label: 'Got it', variant: 'primary', onClick: () => {} },
    ],
  },
  
  error: {
    type: 'error',
    content: {
      text: "Something went wrong. Please try again.",
    },
    actions: [
      { id: 'retry', label: 'Retry', variant: 'primary', onClick: () => {} },
    ],
  },
};

export const MOCK_NUDGES: Record<string, CollapsedContent> = {
  deadline: {
    type: 'nudge',
    text: '"File taxes" deadline in 3 days',
    icon: '⚠️',
    action: { label: 'Focus', onClick: () => {} },
  },
  
  stale: {
    type: 'nudge',
    text: '"Buy groceries" untouched for 5 days',
    icon: '👀',
    action: { label: 'Review', onClick: () => {} },
  },
  
  suggestion: {
    type: 'nudge',
    text: 'Ready to focus? I suggest "Call mom"',
    icon: '💡',
    action: { label: 'Start', onClick: () => {} },
  },
};
```

---

## Claude Code Prompts

### Session 1: Project Setup + MiniBar

**Goal:** Scaffold project, implement collapsed MiniBar with all visual states

```
Create a new Next.js 14 prototype for an AI assistant mini-bar component.

## Project Setup

1. Initialize Next.js with:
   - TypeScript
   - Tailwind CSS
   - App Router
   - No src/ directory (use app/ at root)

2. Install dependencies:
   - framer-motion (for animations and gestures throughout)

3. Create folder structure:
   ```
   ai-minibar-prototype/
   ├── app/
   │   ├── page.tsx
   │   ├── layout.tsx
   │   └── globals.css
   ├── components/
   │   ├── ai-assistant/
   │   │   ├── MiniBar.tsx
   │   │   └── types.ts
   │   └── demo/
   │       └── DemoShell.tsx
   └── lib/
       ├── types.ts
       └── constants.ts
   ```

4. Set up dark mode by default in globals.css and layout.tsx

## Core Types (lib/types.ts)

```typescript
type CollapsedContentType = 'idle' | 'nudge' | 'status' | 'response' | 'loading';

interface CollapsedContent {
  type: CollapsedContentType;
  text: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

## MiniBar Component

Create components/ai-assistant/MiniBar.tsx:

1. Fixed position at bottom, above a mock tab bar (56px height)
2. Full width with horizontal padding (px-4)
3. Visual design:
   - Dark background (zinc-900), subtle border top
   - Rounded corners (rounded-t-xl)
   - Sparkle icon (✨) on left
   - Chevron up (⌃) on right when expandable
   - Text in middle, truncated if needed

4. States to handle:
   - idle: "Ask AI for help..." (muted text)
   - loading: "Thinking..." with animated spinner
   - nudge: Bold text + optional action button on right
   - status: Muted informational text
   - response: Summary text, chevron indicates more

5. Tap anywhere expands (for now just console.log)

6. Animate content changes with fade transition

## Demo Shell

Create components/demo/DemoShell.tsx:

1. Mobile viewport simulation (max-w-md mx-auto, min-h-screen)
2. Mock header with title
3. Content area with placeholder
4. Buttons to switch MiniBar content type:
   - [Idle] [Loading] [Nudge] [Status] [Response]
5. Mock tab bar at very bottom (Home, Tasks, Search)
6. MiniBar positioned above tab bar

## Page Setup

app/page.tsx should render DemoShell with MiniBar.

Focus on getting the visual design right. Use Tailwind for all styling.
The component should feel native/iOS-like in its polish.
```

---

### Session 2: Palette (Expanded State)

**Goal:** Implement expanded palette with input, quick actions, and response display

```
Add the expanded Palette component to the AI mini-bar prototype.

## New Types (update lib/types.ts)

```typescript
type AIAssistantMode = 'collapsed' | 'expanded' | 'drawer';

type AIResponseType = 'text' | 'suggestions' | 'explanation' | 'error';

interface AIResponse {
  type: AIResponseType;
  content: any; // Will be typed per response type
  actions?: ResponseAction[];
}

interface ResponseAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  query: string;
}
```

## Palette Component (components/ai-assistant/Palette.tsx)

1. Slides up from MiniBar position
2. Height: starts at 200px, grows with content, max 50vh
3. Visual design:
   - Same dark background as MiniBar
   - Drag handle at top (thin horizontal line)
   - Subtle backdrop blur behind
   
4. Layout:
   ```
   ┌─────────────────────────────────────────┐
   │  ────────── (drag handle) ──────────── │
   │                                         │
   │  ┌─────────────────────────────────┐   │
   │  │ Ask AI...                    ↵  │   │ ← Input
   │  └─────────────────────────────────┘   │
   │                                         │
   │  [🎯 What next] [📋 Break down] [💡 Stuck] │ ← Quick actions
   │                                         │
   │  (Response area - when response exists) │
   │                                         │
   │                        [More help →]   │ ← Escape hatch
   └─────────────────────────────────────────┘
   ```

5. Input field:
   - Auto-focus when palette opens
   - Submit on Enter
   - Placeholder: "Ask AI..."
   
6. Quick action chips:
   - Horizontal scroll if needed
   - Tap fills input and submits
   - 3 default actions: "What next?", "Break down", "I'm stuck"

7. Response area:
   - Only visible when response exists
   - Scrollable if content exceeds available height

## Response Display Components

Create components/ai-assistant/ResponseDisplay.tsx that renders based on response type:

1. TextResponse: Simple text with action buttons below
2. SuggestionsResponse: 
   - Message text
   - List of suggestions with checkboxes (for preview, not functional yet)
   - "Add all" and "Dismiss" buttons
3. ExplanationResponse:
   - Title (what's being explained)
   - Explanation text
   - "Got it" button

## Animation

1. MiniBar → Palette: 
   - Height grows from 56px to target
   - Content fades/transforms
   - Duration: 300ms, iOS-like easing

2. Palette → MiniBar:
   - Reverse animation
   - If response exists, show summary in collapsed state

## State Management

Create hooks/useAIAssistant.ts:
- mode: 'collapsed' | 'expanded'
- query: string
- isLoading: boolean  
- response: AIResponse | null
- Actions: expand, collapse, setQuery, submitQuery, setResponse, clearResponse

## Demo Updates

1. Add buttons to trigger mock responses:
   - [Text Response] [Suggestions] [Explanation] [Error]
2. Clicking these should:
   - Expand palette if collapsed
   - Show loading briefly (500ms)
   - Display the mock response

## Mock Responses (lib/mock-responses.ts)

Create realistic mock responses for each type (use examples from previous context).
```

---

### Session 3: Transitions + Polish

**Goal:** Smooth animations, gesture handling, keyboard support

```
Add polished animations and interactions to the AI mini-bar prototype.

## Animation Improvements (using framer-motion already installed)

1. MiniBar ↔ Palette transition:
   - Use AnimatePresence for enter/exit
   - Height animation with spring physics
   - Content crossfade (old content fades out, new fades in)
   - Stagger quick action chips on enter

2. Response appear animation:
   - Fade + slide up
   - For suggestions list: stagger each item by 50ms

3. Loading state:
   - Skeleton shimmer or subtle pulse
   - Spinner in MiniBar when loading while collapsed

## Gesture Handling

1. Swipe down on Palette → collapse
   - Use framer-motion drag gesture
   - If dragged down > 50px, collapse
   - Otherwise spring back

2. Tap outside Palette → collapse
   - Add backdrop overlay (semi-transparent)
   - Tap backdrop to dismiss

3. Drag handle visual feedback:
   - Subtle scale on touch

## Keyboard Support

1. Global ⌘K / Ctrl+K:
   - If collapsed → expand
   - If expanded → focus input

2. Escape:
   - If expanded with response → clear response
   - If expanded without response → collapse
   - If input has text → clear text first

3. Enter in input → submit

4. Create hooks/useKeyboardShortcuts.ts for this logic

## Collapsed State After Response

When user accepts suggestions or dismisses response:
1. Show brief confirmation in MiniBar: "✓ Added 5 steps"
2. After 2 seconds, return to idle state
3. Animate text change smoothly

## Edge Cases

1. Very long response text:
   - Truncate with "..." in collapsed summary
   - Scrollable in expanded view

2. Rapid open/close:
   - Debounce to prevent animation jank
   - Cancel in-flight animations

3. Submit while loading:
   - Ignore or queue

## Demo Enhancements

1. Add keyboard shortcut hint: "⌘K to open"
2. Show current state label: "Mode: collapsed"
3. Add "Reset" button to clear all state
```

---

### Session 4: Drawer + Full Flow

**Goal:** Add drawer mode, wire up complete state machine

```
Add the Drawer component and complete the state machine for all three modes.

## Drawer Component (components/ai-assistant/Drawer.tsx)

1. Covers 85vh, slides up from Palette position
2. Visual design:
   - Same dark background
   - Header with "AI Help" title and close button
   - Scrollable message history area
   - Input fixed at bottom

3. Layout:
   ```
   ┌─────────────────────────────────────────┐
   │  AI Help                         [Done] │
   ├─────────────────────────────────────────┤
   │                                         │
   │  You: Break down file taxes             │
   │                                         │
   │  AI: I'll help break that down...       │
   │  [response content]                     │
   │                                         │
   │  You: What about deductions?            │
   │                                         │
   │  AI: Good question...                   │
   │                                         │
   ├─────────────────────────────────────────┤
   │  ┌─────────────────────────────────┐   │
   │  │ Type a message...            ↵  │   │
   │  └─────────────────────────────────┘   │
   └─────────────────────────────────────────┘
   ```

4. Message bubbles:
   - User messages: right-aligned, blue background
   - AI messages: left-aligned, dark gray background
   - AI messages can include structured responses (suggestions, etc.)

## State Machine Update

Update hooks/useAIAssistant.ts:

```typescript
type AIAssistantMode = 'collapsed' | 'expanded' | 'drawer';

interface AIAssistantState {
  mode: AIAssistantMode;
  collapsedContent: CollapsedContent;
  query: string;
  isLoading: boolean;
  response: AIResponse | null;
  messages: Message[]; // For drawer history
}
```

Transitions:
- collapsed → expanded: tap MiniBar, ⌘K
- expanded → collapsed: swipe down, tap outside, dismiss response
- expanded → drawer: click "More help →", or 3+ messages
- drawer → collapsed: click "Done", ⌘K (toggle off)

## Palette → Drawer Transition

1. "More help →" button in Palette footer
2. When clicked:
   - Current query/response becomes first message(s) in drawer
   - Animate height from 50vh to 85vh
   - Show message history

## Wire Up Message History

1. When user submits query in expanded mode:
   - Add to messages array (even if not showing drawer)
   
2. When AI responds:
   - Add to messages array
   
3. Opening drawer shows full history

4. Closing drawer preserves history (until session ends)

## Demo Updates

1. Add "Open Drawer" button to force drawer mode
2. Add message count indicator
3. Show full state in debug panel:
   ```
   Mode: expanded
   Messages: 4
   Response: suggestions
   ```

## Full Flow Test Scenarios

Test these flows work smoothly:

1. Cold start → ask question → see response → dismiss → back to idle
2. Ask question → see suggestions → accept → shows confirmation → collapses
3. Ask question → "More help" → drawer → multi-turn chat → close → collapses
4. Nudge appears → tap → expands with nudge context → respond → collapse
5. ⌘K → type → submit → response → ⌘K again → should close
```

---

### Session 5: Context Awareness + Final Polish

**Goal:** Context-aware behavior, final visual polish, edge cases

```
Add context awareness and final polish to the AI mini-bar prototype.

## Context System

1. Add context prop to AIAssistant:
   ```typescript
   type AIAssistantContext = 'queue' | 'taskDetail' | 'focusMode' | 'inbox' | 'global';
   ```

2. Context affects:
   - Quick action chips shown
   - Default collapsed content (status)
   - How responses are interpreted

3. Quick actions by context:
   ```typescript
   const QUICK_ACTIONS_BY_CONTEXT: Record<AIAssistantContext, QuickAction[]> = {
     queue: [
       { id: 'next', label: 'What next?', icon: '🎯', query: 'What should I work on next?' },
       { id: 'reorder', label: 'Reorder', icon: '↕️', query: 'Help me prioritize my queue' },
     ],
     taskDetail: [
       { id: 'breakdown', label: 'Break down', icon: '📋', query: 'Break this task into steps' },
       { id: 'estimate', label: 'Estimate', icon: '⏱', query: 'How long will this take?' },
     ],
     focusMode: [
       { id: 'stuck', label: "I'm stuck", icon: '🤔', query: "I'm stuck on this step" },
       { id: 'explain', label: 'Explain', icon: '❓', query: 'Explain this step' },
       { id: 'smaller', label: 'Smaller', icon: '🔬', query: 'Break this into smaller steps' },
     ],
     inbox: [
       { id: 'triage', label: 'Help triage', icon: '📥', query: 'Help me triage these items' },
       { id: 'priority', label: 'Priority?', icon: '⚡', query: 'What priority should this be?' },
     ],
     global: [
       { id: 'next', label: 'What next?', icon: '🎯', query: 'What should I work on?' },
       { id: 'help', label: 'Help', icon: '💡', query: 'What can you help me with?' },
     ],
   };
   ```

4. Collapsed status by context:
   - queue: "3 tasks today • 2 high priority"
   - taskDetail: "5 steps • ~45 min"
   - focusMode: "Step 3 of 5 • 12:34"
   - inbox: "7 items to triage"

## Demo Context Switcher

1. Add dropdown to switch context in demo shell
2. Switching context:
   - Updates quick actions immediately
   - Updates collapsed status text
   - Clears any pending response

## Visual Polish

1. Typography:
   - Use system font stack for iOS feel
   - Proper font weights (medium for labels, regular for content)
   - Consistent text sizes

2. Colors:
   - Define color palette in constants
   - Subtle gradients on buttons
   - Proper contrast ratios

3. Shadows and borders:
   - Subtle shadow on MiniBar/Palette
   - 1px border with low opacity for depth

4. Touch feedback:
   - Scale down slightly on press (0.98)
   - Subtle background change on tap

5. Dark mode refinements:
   - Proper gray scale (zinc-800, zinc-900, etc.)
   - Accent color for actions (blue-500)

## Edge Case Handling

1. Network timeout simulation:
   - Add 5-second timeout
   - Show error response
   - "Retry" button

2. Empty query submit:
   - Ignore or show placeholder error

3. Very long response:
   - Max height with scroll
   - "Show more" / "Show less" toggle

4. Rapid interactions:
   - Debounce input changes
   - Prevent double-submit

## Accessibility

1. Focus management:
   - Focus input when expanding
   - Return focus to trigger when collapsing

2. ARIA labels:
   - role="dialog" on Palette/Drawer
   - aria-label on interactive elements

3. Reduced motion:
   - Check prefers-reduced-motion
   - Disable animations if set

## Export Preparation

Document how to extract this component for use in main app:
1. Required files to copy
2. Dependencies (framer-motion)
3. Props interface
4. Usage example
```

---

## File Checklist

After all sessions, you should have:

```
ai-minibar-prototype/
├── app/
│   ├── page.tsx                    ✓ Session 1
│   ├── layout.tsx                  ✓ Session 1
│   └── globals.css                 ✓ Session 1
├── components/
│   ├── ai-assistant/
│   │   ├── AIAssistant.tsx         ✓ Session 4
│   │   ├── MiniBar.tsx             ✓ Session 1
│   │   ├── Palette.tsx             ✓ Session 2
│   │   ├── Drawer.tsx              ✓ Session 4
│   │   ├── QuickActions.tsx        ✓ Session 2
│   │   ├── ResponseDisplay.tsx     ✓ Session 2
│   │   ├── ChatHistory.tsx         ✓ Session 4
│   │   └── types.ts                ✓ Session 1
│   └── demo/
│       ├── DemoShell.tsx           ✓ Session 1
│       ├── ContextSwitcher.tsx     ✓ Session 5
│       └── ResponseTriggers.tsx    ✓ Session 2
├── hooks/
│   ├── useAIAssistant.ts           ✓ Session 2, updated Session 4
│   ├── useKeyboardShortcuts.ts     ✓ Session 3
│   └── useAnimations.ts            ✓ Session 3
├── lib/
│   ├── types.ts                    ✓ Session 1, updated throughout
│   ├── mock-responses.ts           ✓ Session 2
│   └── constants.ts                ✓ Session 1
└── package.json                    ✓ Session 1
```

---

## Success Criteria

The prototype is ready for integration when:

- [ ] MiniBar shows all 5 content types correctly
- [ ] Palette expands/collapses smoothly (< 300ms, no jank)
- [ ] Quick actions vary by context
- [ ] All 4 response types render correctly
- [ ] Drawer opens and shows message history
- [ ] ⌘K works globally
- [ ] Escape closes appropriately
- [ ] Swipe down dismisses Palette
- [ ] Works on mobile viewport (touch, no hover states assumed)
- [ ] Dark mode looks polished
- [ ] No console errors or warnings
