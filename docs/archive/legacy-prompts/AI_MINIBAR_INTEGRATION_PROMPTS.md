# AI Minibar Integration Prompts

> **Purpose:** Claude Code prompts for integrating the AI minibar prototype into task-copilot (v3 refactor)
> **Prerequisites:**
> - AI minibar prototype complete with EXPORT_GUIDE.md
> - task-copilot at v2 (tagged `v2-pre-refactor`)
> **Location:** `~/Projects/focus-tools/prototypes/task-copilot/`

## Current Status: ✅ Integration Complete

**All 6 sessions complete.** Recent refinements (Jan 2026):
- Auto-collapse delay: 7 seconds (was 300ms, gives time to read responses)
- StagingArea: Violet theme (matches "Today" steps visual language)
- Mobile TaskDetail: Kebab menu for overflow actions
- Code cleanup: Removed unused timer from `acceptSuggestions`

See **Success Criteria** section at bottom for full checklist.

---

## Design Decisions (Finalized)

### The Four Surfaces

| Surface | Role | Persistence | Content Type |
|---------|------|-------------|--------------|
| **MiniBar** | Status bar + notification | Always visible | One-line status, icons |
| **Palette** | Conversational layer | Ephemeral (auto-minimize) | Text responses, input |
| **Drawer** | Extended chat | Session (until closed) | Full history, multi-turn |
| **StagingArea** | Decision workspace | Until resolved | Steps, edits, suggestions |

### Core Principles

1. **Palette is for dialogue** (questions and answers, text responses)
2. **StagingArea is for decisions** (accept/reject structured changes)
3. **They don't overlap** — Palette never shows suggestion lists, StagingArea never shows chat
4. **Drawer is escape hatch** — accessed via input field, not always visible

### Structured Actions Flow

```
"✨ Break Down" button (or Stuck menu)
    → MiniBar: "Breaking down..." (thinking)
    → StagingArea: skeleton/shimmer
    → AI returns suggestions
    → THREE THINGS SIMULTANEOUSLY:
        1. StagingArea: populates + PULSE/GLOW (primary)
        2. MiniBar: "5 suggestions ready" + [↓] icon
        3. Palette (if open): context text + [Go to suggestions]
```

### Text Response Flow

```
User asks question (Palette or quick action)
    → MiniBar: "Thinking..."
    → Palette expands with response (large text, primary focus)
    → Action buttons: [Got it] [Ask more]
    → Auto-minimize after 7 sec idle (ANIMATIONS.autoCollapseDelay)
    → MiniBar: "Tap to see response"
```

### Input Field Design (Claude/ChatGPT style)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Ask AI anything...                                         │
│                                                             │
│  [↗️]                                           [🎙️]  [↵]  │
└─────────────────────────────────────────────────────────────┘
     ^                                              ^      ^
  Drawer                                        Voice   Send
  (left)                                    (future)  (right)
```

- Controls integrated inside input field border
- `↗️` Drawer icon on left (secondary)
- `🎙️` Voice icon (hide until feature ready)
- `↵` Send icon on right (primary)

### MiniBar States

| State | Content | Icon | Tap Action |
|-------|---------|------|------------|
| Idle | "Ask AI..." | `⌃` | Expand Palette |
| Contextual prompt | "Need help breaking this down?" | `⌃` | Expand Palette with context |
| Thinking | "Breaking down..." | (spinner) | None |
| Text ready | "Explanation ready" | `⌃` | Expand Palette (shows response) |
| Suggestions ready | "5 suggestions ready" | `↓` | Scroll to StagingArea |
| Confirmation | "✓ Added 5 steps" | — | Fades to idle |

### Contextual Prompts (Idle → Prompt → Idle)

| View | Trigger | Prompt |
|------|---------|--------|
| Focus Mode | 5 sec on step, no action | "Need a tiny first action?" |
| Task Detail | 10 sec, no steps | "Want me to break this down?" |
| Focus Queue | 15 sec, has items | "Ready? I suggest [top item]" |
| Pool | 15 sec | "Want help prioritizing?" |

Prompts appear briefly, then return to idle. Not cycling.

### Drawer Access

- **Location:** `↗️` icon inside input field (bottom-left)
- **When visible:** Whenever input field is shown
- **Auto-suggest:** After 3+ exchanges, Palette shows "Continue in expanded view →"
- **History:** Drawer contains full conversation history

---

## Integration Overview

### What We're Doing

Replacing the current AIDrawer-centric interaction model with the four-surface system above.

### Key Changes

| Current (v2) | Target (v3) |
|--------------|-------------|
| AIDrawer visible by default | MiniBar visible, Drawer hidden |
| All AI via chat interface | Palette for text, StagingArea for structured |
| `a` key toggles drawer | `⌘K` / `a` opens Palette |
| Chat history always visible | Ephemeral Palette, history in Drawer |
| Single AI entry point | Context-aware quick actions + inline buttons |
| Suggestions in AIDrawer + StagingArea | StagingArea only (with pulse) |

### Files to Add (from prototype)

```
components/
├── ai-assistant/
│   ├── AIAssistant.tsx      # Container + state machine
│   ├── MiniBar.tsx          # Collapsed state
│   ├── Palette.tsx          # Expanded state (ephemeral)
│   ├── PaletteInput.tsx     # Input field with integrated controls
│   ├── Drawer.tsx           # Full chat (escape hatch)
│   ├── QuickActions.tsx     # Action chips
│   ├── ResponseDisplay.tsx  # Text response renderer
│   ├── ChatHistory.tsx      # Message list (for Drawer)
│   └── types.ts             # AI assistant types
hooks/
├── useAIAssistant.ts        # State management
├── useContextualPrompts.ts  # Idle → Prompt → Idle logic
└── useKeyboardShortcuts.ts  # ⌘K handling (merge with existing)
lib/
└── constants.ts             # Animation constants (merge)
```

### Files to Modify

```
app/page.tsx                 # Add AIAssistant, update keyboard handling
components/AIDrawer.tsx      # DELETE after migration
components/StagingArea.tsx   # Add pulse/glow animation on arrival
lib/types.ts                 # Merge AI types
```

---

## Session 1: Setup + Component Migration

**Goal:** Add Framer Motion, copy components, get MiniBar + Palette rendering (no API yet)

```
We're integrating the AI minibar prototype into task-copilot. This session focuses on setup and getting components rendering.

## Context

The AI minibar prototype is complete at:
~/Projects/focus-tools/prototypes/ai-minibar/

It has an EXPORT_GUIDE.md with integration instructions. Reference that for file locations and dependencies.

## Design Context

We're implementing a four-surface AI interaction model:
- MiniBar: Always visible status bar at bottom
- Palette: Ephemeral conversational layer (expands from MiniBar)
- Drawer: Escape hatch for extended conversations (accessed via input field)
- StagingArea: Unchanged, handles structured suggestions

Key principle: Palette is for dialogue (text), StagingArea is for decisions (steps/edits).

## Step 1: Add Framer Motion

npm install framer-motion

## Step 2: Copy Component Files

Copy from ai-minibar prototype to task-copilot:

1. Create components/ai-assistant/ directory
2. Copy these files (update imports as needed):
   - AIAssistant.tsx (container + state machine)
   - MiniBar.tsx
   - Palette.tsx
   - Drawer.tsx
   - QuickActions.tsx
   - ResponseDisplay.tsx
   - ChatHistory.tsx
   - types.ts (as ai-types.ts to avoid conflict)

3. Copy hooks:
   - useAIAssistant.ts → hooks/useAIAssistant.ts

4. Merge constants:
   - Add ANIMATIONS and HEIGHTS constants from prototype to lib/constants.ts

## Step 3: Create PaletteInput Component

Create components/ai-assistant/PaletteInput.tsx with integrated controls (Claude/ChatGPT style):

```tsx
interface PaletteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onOpenDrawer: () => void;
  placeholder?: string;
  disabled?: boolean;
}
```

Layout:
- Text input area (auto-growing textarea)
- Bottom row INSIDE the input border:
  - Left: [↗️] Drawer icon
  - Right: [↵] Send icon (enabled when text present)
  - (Future: [🎙️] Voice icon - hide for now)

## Step 4: Fix Import Paths

Update all imports in copied files to match task-copilot structure:
- @/components/...
- @/lib/...
- @/hooks/...

## Step 5: Add AIAssistant to Layout

In app/page.tsx, add the AIAssistant component:

1. Import AIAssistant
2. Add it after the main content area, before tab bar
3. Position: fixed bottom, above any existing tab bar
4. Pass minimal props:
   - context: 'global' (hardcoded for now)
   - onSubmit: async () => mockTextResponse (temporary)
5. Don't remove existing AIDrawer yet (keep as fallback)

## Step 6: Verify Rendering

Run the app and confirm:
- [ ] MiniBar appears at bottom (above tab bar if present)
- [ ] MiniBar shows "Ask AI..." in idle state
- [ ] Tapping MiniBar expands to Palette
- [ ] Palette has input field with integrated [↗️] and [↵] icons
- [ ] Quick action chips appear below input
- [ ] [↗️] icon opens Drawer
- [ ] Can collapse Palette back to MiniBar
- [ ] No console errors
- [ ] Existing app functionality still works

## Notes

- Keep existing AIDrawer for now—we'll migrate its functionality later
- The minibar should render but won't do real AI calls yet
- Focus on clean file structure and working animations
- Input field controls should be INSIDE the input border, not below it
```

---

## Session 2: Wire Up Real API (Text Responses)

**Goal:** Connect Palette to existing API for TEXT responses only. Structured suggestions continue using existing StagingArea flow.

```
Connect the AI minibar to the existing Claude API endpoint for text responses.

## Key Design Decision

TEXT RESPONSES (explain, first action, chat) → Palette
STRUCTURED RESPONSES (suggestions, edits) → StagingArea (existing flow)

This session focuses on text responses only. Session 3 handles the structured flow.

## Context

The app has an existing API route at app/api/structure/route.ts that handles:
- Task breakdown (replace_task_steps, suggest_additions) → StagingArea
- Focus mode help (break_down_step) → StagingArea
- Focus mode help (suggest_first_action, explain_step) → TEXT (Palette)
- Conversational responses → TEXT (Palette)

## Step 1: Create Response Type Detection

Create lib/ai-response-types.ts:

```typescript
type AIResponseCategory = 'text' | 'structured';

// Determine where response should go based on tool used
function categorizeResponse(toolName: string): AIResponseCategory {
  const textTools = [
    'suggest_first_action',
    'explain_step', 
    'encourage',
    'conversational_response'
  ];
  
  const structuredTools = [
    'replace_task_steps',
    'suggest_additions',
    'edit_steps',
    'edit_title',
    'break_down_step'
  ];
  
  if (textTools.includes(toolName)) return 'text';
  if (structuredTools.includes(toolName)) return 'structured';
  return 'text'; // Default fallback
}
```

## Step 2: Update API Response Handling

In page.tsx, modify handleSendMessage to route responses:

```typescript
const handleSendMessage = async (message: string) => {
  // ... existing API call logic ...
  
  const response = await fetch('/api/structure', { ... });
  const data = await response.json();
  
  const category = categorizeResponse(data.toolUsed);
  
  if (category === 'text') {
    // Route to Palette
    return {
      type: 'text',
      content: data.message,
    };
  } else {
    // Route to StagingArea (existing flow)
    // This will be handled in Session 3
    handleStructuredResponse(data);
    return null; // Palette doesn't show this
  }
};
```

## Step 3: Wire Palette to API

Update AIAssistant props:

```typescript
<AIAssistant
  context={getAIContext(state)}
  onSubmit={async (query) => {
    const response = await handleSendMessage(query);
    return response; // Will be null for structured, AIResponse for text
  }}
  // ... other props
/>
```

## Step 4: Handle Text Response in Palette

When Palette receives a text response:
1. Display in large, readable text
2. Show [Got it] and [Ask more] buttons
3. Auto-minimize after 8-10 seconds of no interaction
4. MiniBar shows "Tap to see response" when minimized

## Step 5: Test Text Response Flow

Test these scenarios:
- [ ] In focus mode, Stuck → "First tiny action" → response in Palette
- [ ] In focus mode, Stuck → "Explain this" → response in Palette
- [ ] General question in Palette → text response displayed
- [ ] [Got it] dismisses and collapses to MiniBar
- [ ] [Ask more] reveals input for follow-up
- [ ] Auto-minimize works after idle period
- [ ] MiniBar shows appropriate state after minimize

## Step 6: Drawer Follow-up Support

When user taps [↗️] in input field:
1. Transition current conversation to Drawer
2. Drawer shows history (if any)
3. Can continue multi-turn conversation in Drawer

After 3+ exchanges in Palette, show:
"Continue in expanded view →" link that opens Drawer

## Notes

- Don't change the API route itself—handle routing on the client side
- Structured responses (breakdown, etc.) still use OLD flow for now
- Focus on getting text responses perfect in Palette
- Preserve conversation context for follow-ups
```

---

## Session 3: Structured Actions → StagingArea Flow

**Goal:** Wire breakdown buttons to StagingArea with coordinated MiniBar status and pulse animation

```
Connect structured AI actions to StagingArea with the three-surface coordination pattern.

## The Three-Surface Pattern

When user triggers a structured action (breakdown, etc.):

1. MiniBar: "Breaking down..." (thinking)
2. StagingArea: skeleton/shimmer (optional)
3. AI returns suggestions
4. THREE THINGS SIMULTANEOUSLY:
   - StagingArea: populates + PULSE/GLOW (primary attention)
   - MiniBar: "5 suggestions ready" + [↓] icon
   - Palette (if open): context text + [Go to suggestions] button

## Step 1: Add StagingArea Pulse Animation

Update components/StagingArea.tsx:

```typescript
interface StagingAreaProps {
  // ... existing props
  isNewArrival?: boolean; // Triggers pulse animation
}

// Add Framer Motion animation
<motion.div
  initial={isNewArrival ? { scale: 1.02, boxShadow: '0 0 0 2px var(--accent)' } : false}
  animate={{ scale: 1, boxShadow: '0 0 0 0px transparent' }}
  transition={{ duration: 0.6, repeat: 2, repeatType: 'reverse' }}
>
  {/* StagingArea content */}
</motion.div>
```

The pulse should:
- Soft border glow (accent color)
- Subtle scale (102% → 100%)
- 2-3 cycles, then stop (not infinite)

## Step 2: Update MiniBar for Suggestions State

Add new MiniBar state for suggestions ready:

```typescript
// In MiniBar states
{
  type: 'suggestions-ready',
  text: '5 suggestions ready',
  icon: '↓', // Scroll to StagingArea
  onTap: () => scrollToStagingArea(),
}
```

When [↓] is tapped, smooth scroll to StagingArea (don't expand Palette).

## Step 3: Update Structured Action Flow

Modify the "✨ Break Down" button flow in TaskDetail:

```typescript
const handleBreakdown = async () => {
  // 1. Set MiniBar to thinking state
  setMiniBarState({ type: 'thinking', text: 'Breaking down...' });
  
  // 2. Call API (existing logic)
  const response = await fetch('/api/structure', { ... });
  const data = await response.json();
  
  // 3. Route to StagingArea (NOT Palette)
  if (data.suggestions) {
    // Populate StagingArea
    setStagingSuggestions(data.suggestions);
    setStagingNewArrival(true); // Trigger pulse
    
    // Update MiniBar
    setMiniBarState({
      type: 'suggestions-ready',
      text: `${data.suggestions.length} suggestions ready`,
    });
    
    // Clear pulse after animation
    setTimeout(() => setStagingNewArrival(false), 2000);
  }
};
```

## Step 4: Palette Context for Structured Responses

If Palette is open when suggestions arrive, show context (not the list):

```typescript
// Palette shows conversational context
{
  type: 'suggestion-context',
  text: "I've broken this into 5 steps. The first step is gathering your W-2 forms.",
  actions: [
    { label: 'Go to suggestions', onClick: scrollToStagingArea },
    { label: 'Ask more', onClick: revealInput },
  ]
}
```

This requires API to return a `conversationalSummary` field alongside suggestions.

## Step 5: Focus Mode Stuck Menu

Update Stuck menu flows:

| Option | Target | Flow |
|--------|--------|------|
| "Break this down" | StagingArea | Inline → substeps in StagingArea |
| "First tiny action" | Palette | Expand Palette → text response |
| "Explain this step" | Palette | Expand Palette → text response |
| "Skip to next" | None | No AI involved |

## Step 6: Test Coordinated Flow

- [ ] TaskDetail "✨ Break Down" → MiniBar shows "Breaking down..."
- [ ] Suggestions arrive → StagingArea pulses, MiniBar shows count + [↓]
- [ ] Tap [↓] on MiniBar → scrolls to StagingArea
- [ ] If Palette was open → shows context + "Go to suggestions"
- [ ] Stuck → "Break down" → same coordination pattern
- [ ] Accept suggestions → MiniBar shows "✓ Added 5 steps", fades to idle
```

---

## Session 4: Context-Aware Quick Actions + Contextual Prompts

**Goal:** Quick actions change based on view; MiniBar shows contextual prompts

```
Make the quick action chips context-aware and implement the idle → prompt → idle pattern.

## Quick Actions by Context

Define in lib/ai-constants.ts:

```typescript
export const QUICK_ACTIONS: Record<AIAssistantContext, QuickAction[]> = {
  queue: [
    { id: 'next', label: 'What next?', icon: '🎯', query: 'What should I work on next?' },
    { id: 'plan', label: 'Plan my day', icon: '📋', query: 'Help me plan what to focus on today' },
  ],
  taskDetail: [
    { id: 'breakdown', label: 'Break down', icon: '✨', query: 'Break this task into steps' },
    { id: 'estimate', label: 'Estimate time', icon: '⏱', query: 'How long will this take?' },
  ],
  focusMode: [
    { id: 'stuck', label: "I'm stuck", icon: '🤔', query: "I'm stuck on this step" },
    { id: 'explain', label: 'Explain', icon: '❓', query: 'Explain what this step means' },
    { id: 'first', label: 'First action', icon: '👆', query: "What's the tiny first action?" },
  ],
  inbox: [
    { id: 'triage', label: 'Help triage', icon: '📥', query: 'Help me process these inbox items' },
  ],
  global: [
    { id: 'next', label: 'What next?', icon: '🎯', query: 'What should I work on?' },
    { id: 'help', label: 'Help', icon: '💡', query: 'What can you help me with?' },
  ],
};
```

## Contextual Prompts (Idle → Prompt → Idle)

Create hooks/useContextualPrompts.ts:

```typescript
interface ContextualPrompt {
  text: string;
  action: () => void;
}

const PROMPT_CONFIG: Record<AIAssistantContext, {
  delay: number;        // ms before showing prompt
  duration: number;     // ms to show prompt
  getPrompt: (state: AppState) => ContextualPrompt | null;
}> = {
  focusMode: {
    delay: 5000,
    duration: 8000,
    getPrompt: (state) => ({
      text: 'Need a tiny first action?',
      action: () => expandPaletteWithQuery("What's the tiny first action for this step?"),
    }),
  },
  taskDetail: {
    delay: 10000,
    duration: 8000,
    getPrompt: (state) => {
      const task = getActiveTask(state);
      if (task?.steps.length === 0) {
        return {
          text: 'Want me to break this down?',
          action: () => triggerBreakdown(),
        };
      }
      return null;
    },
  },
  queue: {
    delay: 15000,
    duration: 8000,
    getPrompt: (state) => {
      const topItem = getTopQueueItem(state);
      if (topItem) {
        return {
          text: `Ready? I suggest "${topItem.title}"`,
          action: () => expandPaletteWithContext(topItem),
        };
      }
      return null;
    },
  },
};
```

## MiniBar State Flow

```
IDLE ("Ask AI...") 
    ↓ after delay (no user interaction)
CONTEXTUAL PROMPT ("Need help breaking this down?")
    ↓ after duration OR user dismisses
IDLE ("Ask AI...")
```

Resets on any user interaction (tap, scroll, type).

## Implementation

```typescript
function useContextualPrompts(context: AIAssistantContext, state: AppState) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [prompt, setPrompt] = useState<ContextualPrompt | null>(null);
  
  useEffect(() => {
    const config = PROMPT_CONFIG[context];
    if (!config) return;
    
    // Wait for idle delay
    const showTimer = setTimeout(() => {
      const p = config.getPrompt(state);
      if (p) {
        setPrompt(p);
        setShowPrompt(true);
      }
    }, config.delay);
    
    // Hide after duration
    const hideTimer = setTimeout(() => {
      setShowPrompt(false);
    }, config.delay + config.duration);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [context, state]);
  
  // Reset on interaction
  const resetPrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);
  
  return { showPrompt, prompt, resetPrompt };
}
```

## Test

- [ ] Navigate to Focus Queue → after 15s idle, see contextual prompt
- [ ] Any interaction → prompt disappears, resets timer
- [ ] Task Detail with no steps → after 10s, "Want me to break this down?"
- [ ] Focus Mode → after 5s, "Need a tiny first action?"
- [ ] Quick actions change per context
- [ ] Prompts don't repeat excessively (rate limit)
```

---

## Session 5: Migrate from AIDrawer + Keyboard Shortcuts

**Goal:** Remove old AIDrawer, update keyboard shortcuts, finalize Drawer as escape hatch

```
Complete the migration from AIDrawer to the new four-surface system.

## Step 1: Audit AIDrawer Usage

Find all places AIDrawer is used:
- page.tsx (main toggle)
- FocusModeView (stuck menu flows)
- Keyboard shortcuts

Document what needs preservation:
- Message history → moves to Drawer
- Focus mode context → still passed to API
- Stuck menu flows → already migrated in Session 3

## Step 2: Update Keyboard Shortcuts

| Key | Old Behavior | New Behavior |
|-----|--------------|--------------|
| `a` | Toggle AIDrawer | Toggle Palette (expand/collapse) |
| `⌘K` / `Ctrl+K` | (none) | Same as `a` - toggle Palette |
| `Escape` | Close drawer/modal | Collapse Palette → close Drawer → close modal |

```typescript
// In page.tsx keyboard handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // ⌘K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      togglePalette();
      return;
    }
    
    // 'a' key (when not in input)
    if (e.key === 'a' && !isInputFocused()) {
      e.preventDefault();
      togglePalette();
      return;
    }
    
    // Escape
    if (e.key === 'Escape') {
      if (drawerOpen) {
        closeDrawer();
      } else if (paletteExpanded) {
        collapsePalette();
      } else if (modalOpen) {
        closeModal();
      }
      return;
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [paletteExpanded, drawerOpen, modalOpen]);
```

## Step 3: Drawer Access via Input Field

Drawer is now accessed via [↗️] icon in PaletteInput:

```typescript
// In PaletteInput.tsx
<button
  onClick={onOpenDrawer}
  className="text-zinc-400 hover:text-zinc-200"
  title="Open expanded chat"
>
  ↗️
</button>
```

When opening Drawer from Palette:
1. Transfer current conversation context
2. Drawer shows any message history
3. Input focused in Drawer

## Step 4: Auto-Suggest Drawer for Long Conversations

After 3+ exchanges in Palette, show:

```typescript
{exchangeCount >= 3 && (
  <button onClick={openDrawer} className="text-sm text-zinc-400">
    Continue in expanded view →
  </button>
)}
```

## Step 5: Remove Old AIDrawer

1. Delete components/AIDrawer.tsx
2. Remove from page.tsx imports
3. Remove aiDrawer state from AppState
4. Remove old keyboard toggle
5. Update any remaining references

## Step 6: Test Complete Flow

- [ ] `a` key toggles Palette (not old drawer)
- [ ] `⌘K` toggles Palette
- [ ] Escape closes Palette, then Drawer if open
- [ ] [↗️] in input opens Drawer
- [ ] Drawer shows conversation history
- [ ] "Continue in expanded view →" appears after 3+ exchanges
- [ ] Old AIDrawer completely removed
- [ ] No console errors or missing references
```

---

## Session 6: Polish + Contextual Status

**Goal:** Final polish, status display, animation consistency

```
Polish the integration and add contextual status display to MiniBar.

## Part 1: MiniBar Contextual Status

When idle, MiniBar can show contextual info:

```typescript
function getIdleContent(context: AIAssistantContext, state: AppState): CollapsedContent {
  switch (context) {
    case 'queue':
      const todayCount = getTodayQueueItems(state).length;
      return { type: 'status', text: `${todayCount} tasks today` };
      
    case 'taskDetail':
      const task = getActiveTask(state);
      const stepCount = task?.steps.length || 0;
      const estimate = task?.estimatedMinutes;
      return {
        type: 'status',
        text: estimate ? `${stepCount} steps • ~${estimate} min` : `${stepCount} steps`,
      };
      
    case 'focusMode':
      const { currentStepIndex, totalSteps, elapsed } = getFocusModeInfo(state);
      return {
        type: 'status',
        text: `Step ${currentStepIndex} of ${totalSteps} • ${formatTime(elapsed)}`,
      };
      
    default:
      return { type: 'idle', text: 'Ask AI...' };
  }
}
```

## Part 2: Visual Polish

1. MiniBar matches app design language:
   - Same border radius as cards
   - Consistent shadow/elevation
   - Proper dark mode colors (zinc scale)

2. Tab bar integration:
   - MiniBar sits above tab bar
   - No overlap or gap
   - Proper safe area handling on mobile

3. Palette height:
   - Doesn't overlap with header
   - Scrollable if content exceeds viewport
   - Auto-minimize doesn't cut off mid-word

## Part 3: Animation Consistency

Upgrade key animations to Framer Motion:

1. StagingArea expand/collapse:
   - Use AnimatePresence for enter/exit
   - Smooth height animation

2. Toast notifications:
   - Slide in from bottom
   - Stack/reposition smoothly

3. Confirmation states:
   - MiniBar "✓ Added 5 steps" → fade transition

## Part 4: Edge Cases

1. Opening Palette while modal is open:
   - Block Palette while modal open
   
2. Focus mode + Palette:
   - Timer stays visible
   - Palette doesn't obscure current step

3. Very long response in Palette:
   - Scrollable within Palette
   - Auto-minimize pauses if user is scrolling

## Part 5: Cleanup

1. Remove unused imports
2. Remove any deprecated state
3. Update CLAUDE_CODE_CONTEXT docs for v3
4. Tag release: `git tag v3-ai-minibar`

## Test Final Integration

- [ ] All MiniBar states display correctly
- [ ] Palette ephemeral behavior works (auto-minimize)
- [ ] Drawer accessible via input field icon
- [ ] StagingArea pulse animation on suggestions
- [ ] Contextual prompts appear and dismiss correctly
- [ ] Keyboard shortcuts all work
- [ ] Mobile touch interactions work
- [ ] No animation jank
- [ ] Dark mode looks correct
- [ ] Performance acceptable (test on device)
```

---

## File Checklist (Post-Integration)

```
task-copilot/
├── components/
│   ├── ai-assistant/           # NEW - from prototype
│   │   ├── AIAssistant.tsx     # Container + state machine
│   │   ├── MiniBar.tsx         # Collapsed state bar
│   │   ├── Palette.tsx         # Expanded conversational layer
│   │   ├── PaletteInput.tsx    # Input with integrated controls
│   │   ├── Drawer.tsx          # Extended chat (escape hatch)
│   │   ├── QuickActions.tsx    # Context-aware action chips
│   │   ├── ResponseDisplay.tsx # Text response renderer
│   │   ├── ChatHistory.tsx     # Message list for Drawer
│   │   └── types.ts            # AI assistant types
│   ├── StagingArea.tsx         # UPDATED - pulse animation added
│   ├── AIDrawer.tsx            # DELETED
│   └── ... (existing components)
├── hooks/
│   ├── useAIAssistant.ts       # NEW - state management
│   ├── useContextualPrompts.ts # NEW - idle → prompt → idle
│   └── ... (existing hooks)
├── lib/
│   ├── ai-response-types.ts    # NEW - response routing
│   ├── ai-constants.ts         # NEW - quick actions by context
│   ├── constants.ts            # UPDATED - animation constants
│   └── types.ts                # UPDATED - merged AI types
└── app/
    └── page.tsx                # UPDATED - AIAssistant integration
```

---

## Success Criteria (v3 Complete)

### Core Functionality
- [x] MiniBar visible on all views (status, icons)
- [x] Palette expands/collapses smoothly
- [x] Palette auto-minimizes after idle (7 sec) *(updated from 5s)*
- [x] Drawer accessible via [↗️] icon in input field
- [x] "Continue in expanded view →" after 3+ exchanges

### Response Routing
- [x] Text responses (explain, chat) → Palette
- [x] Structured responses (breakdown, edits) → StagingArea
- [x] StagingArea pulses on new suggestions (violet theme)
- [x] MiniBar shows "N suggestions ready" + scroll action

### Context Awareness
- [x] Quick actions change per view context (`AI_ACTIONS` registry)
- [x] Contextual prompts appear (idle → prompt → idle) - Queue "What next?" implemented
- [x] MiniBar shows contextual status when idle ("3 tasks for today", "2/5 steps")

### Migration
- [x] Old AIDrawer removed from default render (kept as fallback)
- [x] Keyboard shortcuts work (a, Escape)
- [x] Stuck menu flows work with new system

### Polish
- [x] Mobile touch interactions work
- [x] Mobile TaskDetail: kebab menu for overflow actions (Add to Focus)
- [x] No animation jank
- [x] Dark mode looks correct
- [x] No regression in existing functionality

### "What Should I Do?" Feature (Session 4+)
- [x] Queue contextual prompt: "Need help?" + [🎯 What next?] pill
- [x] Recommendation response type added to AI system
- [x] AI accuracy: explicit rules about deadlineDate (Today queue ≠ due today)
- [x] focusScore sent to AI for better recommendations
- [x] Action coordination: same icon/label/handler everywhere
- [x] Recommendation card: clean styling, emoji removed

### Code Quality
- [x] StagingArea uses violet theme (matches "Today" steps visual language)
- [x] Auto-collapse uses constant `ANIMATIONS.autoCollapseDelay` (not hardcoded)
- [x] Dead code removed from `useAIAssistant.ts` (unused timer in `acceptSuggestions`)

### Release
- [x] Tagged as `v3-ai-minibar`
- [x] CLAUDE_CODE_CONTEXT docs updated
