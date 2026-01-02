# Task Co-Pilot: Claude Code Context

## Project Overview

Task Co-Pilot is a POC/prototype for an AI-powered task breakdown assistant, part of the larger "Focus Tools" project—an ADHD-friendly task management tool.

**Location:** `~/Projects/focus-tools/prototypes/task-copilot`
**Stack:** Next.js 14, React 18, Tailwind CSS, Anthropic Claude API
**Status:** v0.2 prototype with Planning Loop complete; Focus Mode (Execution Loop) in progress

---

## Architecture

### Two-Module Layout

```
┌─────────────────────────────────┐
│  📋 Task List                   │  ← Primary module: user's tasks
│  - Inline click-to-edit         │
│  - Checkboxes, substeps         │
│  - Reorder (move up/down)       │
├─────────────────────────────────┤
│  💡 Staging Area                │  ← AI suggestions (when present)
│  - Accept one / Accept all      │
│  - Dismiss                      │
├─────────────────────────────────┤
│  💬 AI Drawer (collapsible)     │  ← Chat interface
│  - Open by default if list empty│
└─────────────────────────────────┘
```

### Hybrid Transfer Model

| List State | AI Behavior | Action |
|------------|-------------|--------|
| Empty | Proposes full breakdown | "replace" → auto-populates list |
| Has items | Proposes additions | "suggest" → shows in staging area |
| Has items + user says "start over" | Full replacement | "replace" → overwrites list |
| Question only | No list changes | "none" → just chat response |

---

## File Structure

```
task-copilot/
├── app/
│   ├── api/structure/route.ts   # Claude API endpoint
│   ├── page.tsx                 # Main app + state management
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Tailwind + custom styles
├── components/
│   ├── TaskList.tsx             # List container, add/reorder logic
│   ├── TaskItem.tsx             # Single task: edit, checkbox, menu, substeps
│   ├── StagingArea.tsx          # AI suggestions display
│   └── AIDrawer.tsx             # Collapsible chat interface
├── lib/
│   ├── types.ts                 # TypeScript types
│   └── prompts.ts               # System prompt + storage key
├── .env.local                   # ANTHROPIC_API_KEY (not in git)
└── package.json
```

---

## Key Types (lib/types.ts)

```typescript
interface Step {
  id: string;           // "1", "2", "3"
  text: string;
  substeps: Substep[];
  completed: boolean;
}

interface Substep {
  id: string;           // "1a", "1b"
  text: string;
  completed: boolean;
}

interface SuggestedStep {
  id: string;
  text: string;
  substeps: { id: string; text: string }[];
}

interface StructureResponse {
  action: "replace" | "suggest" | "none";
  taskTitle: string | null;
  steps: Step[] | null;              // For "replace"
  suggestions: SuggestedStep[] | null; // For "suggest"
  message: string;
}

interface AppState {
  taskTitle: string;
  steps: Step[];
  suggestions: SuggestedStep[];
  messages: Message[];
  isDrawerOpen: boolean;
  isLoading: boolean;
  error: string | null;
}
```

---

## State Management

- **State lives in:** `app/page.tsx` using `useState`
- **Persistence:** localStorage (key: "task-copilot-state")
- **Saves:** taskTitle, steps, messages
- **Drawer:** Auto-opens when list is empty

---

## API Flow (app/api/structure/route.ts)

1. Receives: `{ userMessage, currentList, taskTitle, conversationHistory }`
2. Builds context message with current list state
3. Calls Claude with system prompt + messages
4. Parses JSON response
5. Returns: `{ action, taskTitle, steps, suggestions, message }`

---

## Component Responsibilities

### TaskList.tsx
- Renders list of TaskItem components
- Handles add new task
- Handles reorder (move up/down) with renumbering
- Handles delete with renumbering
- Editable title input

### TaskItem.tsx
- Checkbox toggle (completed state)
- Click-to-edit inline text
- Action menu (••• button): Add substep, Move up/down, Delete
- Renders substeps with same edit/toggle/delete patterns

### StagingArea.tsx
- Only renders when suggestions.length > 0
- Shows each suggestion with "+ Add" button
- "Add all" and "Dismiss" actions
- Converts SuggestedStep to Step when accepted

### AIDrawer.tsx
- Collapsible with header toggle
- Chat message history
- Input field + send button
- Loading indicator (bouncing dots)
- Parses assistant messages to show just the `message` field

---

## System Prompt Summary (lib/prompts.ts)

- ADHD-aware: clear steps, not overwhelming, accepts messy input
- 3-7 steps maximum
- Outputs strict JSON with action, taskTitle, steps, suggestions, message
- "replace" when list is empty or user explicitly asks
- "suggest" when list has items (to avoid overwriting)
- "none" for questions without list changes

---

## Current Features

✅ Two-module layout (list + drawer)
✅ Inline click-to-edit tasks
✅ Task checkboxes with completion state
✅ Substeps (create via menu, edit, delete)
✅ Reorder tasks (move up/down)
✅ Delete tasks and substeps
✅ Hybrid transfer model (auto-populate vs staging)
✅ Staging area with accept/dismiss
✅ Collapsible AI drawer
✅ localStorage persistence
✅ Loading and error states

---

## Known Limitations / Future Work

- No drag-and-drop reorder (uses up/down buttons)
- No inline AI editing per task (future feature)
- No undo for auto-populate
- Substep IDs don't renumber perfectly after deletions
- No mobile-specific optimizations yet
- Chat history can grow unbounded (no summarization)

---

## Focus Mode (Execution Loop) — New Feature Spec

### Purpose

Validate the "body double" hypothesis: AI presence + acknowledgment helps users complete tasks by providing accountability and reducing initiation friction.

### Core Concept

User enters "focus mode" on a specific step, works on it with AI as a supportive presence, marks complete, and moves to next step.

### Entry Point

User clicks a focus arrow [→] on any incomplete task in the list to enter focus mode.

### Focus Mode Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Exit                                           12:34     │
│                                         [ ⏸ Pause ]         │
├─────────────────────────────────────────────────────────────┤
│                        File Taxes                           │  ← Task title (subtle)
│                                                             │
│                     Step 3 of 5                             │
│            ━━━━━━━━━━━━━━━━━━━━░░░░░░░░  (2 done)           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │         Collect receipts for deductions             │   │  ← Current step (prominent)
│  │                                                     │   │
│  │         ☐ Medical expenses                          │   │  ← Substeps if present
│  │         ☐ Charitable donations                      │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│        [ ✓ Done ]           [ I'm Stuck ]                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  💬 Working on Step 3. Here if you need me.                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Elements

| Element | Behavior |
|---------|----------|
| **← Exit** | Returns to task list, preserves progress |
| **Timer** | Elapsed time (MM:SS), always visible, top-right |
| **Pause/Continue** | Toggle button; pauses timer, shows paused state |
| **Task title** | Shown subtle/smaller for context |
| **Progress bar** | Visual indicator of steps done vs. total |
| **Current step** | Large, centered, prominent |
| **Substeps** | Shown as checklist if present; can be checked individually |
| **[Done]** | Marks step complete, triggers AI acknowledgment |
| **[I'm Stuck]** | Opens options menu |
| **AI presence** | Single line at bottom, persistent but minimal |

### Timer Behavior

- Shows elapsed time since entering focus mode (not countdown)
- Pauses when user clicks Pause
- Resets if user exits and re-enters (per-session, not cumulative)
- Lost on page refresh (acceptable for POC)

### Pause State

When paused:
- Timer shows frozen time with ⏸ indicator
- View dims slightly or shows "Paused" label
- Only action is [▶ Continue]
- AI message: "Paused. Take your time."

### Step Completion Flow

1. User clicks [✓ Done]
2. Step marked complete (checkbox filled, strikethrough)
3. AI acknowledges: "Step 3 complete. Step 4 is 'Choose filing method'—continue or take a break?"
4. Options shown: [Continue] [Take a Break]
5. If Continue → advance to next incomplete step
6. If Take a Break → pause timer, stay in focus mode

### "I'm Stuck" Flow

1. User clicks [I'm Stuck]
2. Options appear:
   - [Break this down smaller]
   - [Skip to another step]
   - [Talk it through]

**Break down smaller:**
- AI asks: "What part of '[step]' feels unclear or too big?"
- Opens chat in AI drawer
- AI can suggest adding substeps

**Skip to another step:**
- AI confirms: "Skipping Step 3 for now. Moving to Step 4."
- Advances to next incomplete step
- Original step remains incomplete

**Talk it through:**
- Opens AI drawer expanded
- Freeform chat about the blocker
- AI can help problem-solve or suggest restructuring

### Substep Handling

- Substeps shown as mini-checklist within current step
- User can check substeps individually
- Main step requires explicit [✓ Done] click (does not auto-complete)
- Substep completion acknowledged briefly by AI

### Step Navigation

- Flexible: user can focus on any incomplete step (not forced linear)
- Click any task in list → enters focus mode on that step
- Completed steps: hide or grey out focus arrow

### AI Tone Guidelines

**Direct, concise, positive — not peppy or overly enthusiastic**

| Context | Example Response |
|---------|------------------|
| Starting focus | "Starting Step 3. Take your time." |
| Step complete | "Step 3 complete. Moving to Step 4?" |
| Multiple steps done | "Got it. Three down, two to go." |
| I'm stuck prompt | "What's blocking you?" |
| Paused | "Paused. Take your time." |
| Returning | "Back to Step 3—Collect receipts." |
| All done | "All 5 steps complete. 'File Taxes' is done." |
| Exit mid-session | "Pausing on Step 3. You finished 2 of 5. Pick up anytime." |

**Avoid:**
- Excessive exclamation marks
- Emojis in responses
- "Awesome!", "Great job!", "You've got this!"
- Lengthy encouragement

### State Transitions

```
                    ┌──────────────┐
                    │  Task List   │
                    │    View      │
                    └──────┬───────┘
                           │ Click [→] on task
                           ▼
                    ┌──────────────┐
         ┌─────────│ Focus Mode   │◄────────────┐
         │         │ (Active)     │             │
         │         └──────┬───────┘             │
         │                │                     │
         │    ┌───────────┼───────────┐         │
         │    │           │           │         │
         │    ▼           ▼           ▼         │
         │ [Done]    [I'm Stuck]   [Pause]      │
         │    │           │           │         │
         │    ▼           ▼           ▼         │
         │ ┌──────┐  ┌─────────┐  ┌────────┐    │
         │ │ Next │  │ Options │  │ Paused │    │
         │ │ Step │  │  Menu   │  │ State  │    │
         │ └──┬───┘  └────┬────┘  └───┬────┘    │
         │    │           │           │         │
         │    └───────────┴───────────┘         │
         │              │ [Continue]            │
         │              └───────────────────────┘
         │
         │ [Exit]
         ▼
  ┌──────────────┐
  │  Task List   │
  │  (updated)   │
  └──────────────┘
```

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `components/FocusMode.tsx` | Main focus mode view |
| `components/FocusHeader.tsx` | Exit, timer, pause/continue |
| `components/FocusStep.tsx` | Current step display with substeps |
| `components/FocusActions.tsx` | Done, I'm Stuck buttons |
| `components/StuckMenu.tsx` | Options when stuck |

### State Management Updates

```typescript
// Add to AppState
interface AppState {
  // ... existing fields ...
  
  // Focus mode
  focusMode: {
    active: boolean;
    stepId: string | null;      // Which step is being focused
    paused: boolean;
    startTime: number | null;   // Timestamp when session started
    pausedTime: number;         // Accumulated paused duration
  };
}
```

### localStorage Updates

Save focus mode state for resume on refresh:
- `focusMode.active`
- `focusMode.stepId`
- `focusMode.paused`

Timer not persisted (resets on refresh).

### API Updates

Focus mode can reuse existing `/api/structure` endpoint for "Talk it through" and "Break down smaller" flows. No new endpoints needed for POC.

### Testing Checklist

- [ ] Click task → enters focus mode
- [ ] Timer starts and counts up
- [ ] Pause stops timer, shows paused state
- [ ] Continue resumes timer
- [ ] [Done] marks step complete
- [ ] AI acknowledges completion with correct tone
- [ ] Next step prompt appears
- [ ] [Continue] advances to next step
- [ ] [I'm Stuck] shows 3 options
- [ ] Break down smaller → opens chat
- [ ] Skip → moves to next step
- [ ] Talk through → opens chat
- [ ] Substeps can be checked
- [ ] Main step requires explicit Done
- [ ] Exit returns to list with progress saved
- [ ] Completed steps don't show focus arrow
- [ ] All steps complete → shows completion message

---

## Testing Checklist

- [ ] Empty state → AI populates list
- [ ] Manual task creation works
- [ ] Click-to-edit saves on blur/Enter
- [ ] Checkboxes toggle correctly
- [ ] Substeps can be added/edited/deleted
- [ ] Move up/down reorders and renumbers
- [ ] With items, AI shows suggestions in staging
- [ ] Accept one / Accept all works
- [ ] Dismiss clears staging
- [ ] Drawer opens/closes
- [ ] Data persists on refresh
- [ ] "Clear all" resets everything

---

## Running the Project

```bash
cd ~/Projects/focus-tools/prototypes/task-copilot
npm run dev
# Opens at http://localhost:3000
```

---

## Parent Project Context

This prototype is part of "Focus Tools"—see `/docs/focus-tools-product-doc.md` for:
- Full product vision
- Admin vs Execution domain framework
- AI persona model (Executive Assistant + Body Double)
- Task states and lifecycle
- Orbital Zen UI concept (future)
