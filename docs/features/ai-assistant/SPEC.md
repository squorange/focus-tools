# AI Assistant Specification

> Detailed behavioral rules, state machine, types, and animation specs.

---

## State Machine

### Modes

The AI Assistant operates as a finite state machine with three modes:

```
     ┌──────────────────────────────────────────────────┐
     │                                                  │
     ▼                                                  │
COLLAPSED ←──────→ EXPANDED ────────→ DRAWER           │
(MiniBar)          (Palette)          (Full Chat)      │
     ▲                                     │           │
     │                                     │           │
     └─────────────────────────────────────┘           │
                                                       │
     Auto-collapse on response (if no user engagement) │
     └─────────────────────────────────────────────────┘
```

| Mode | Component | Entry Condition | Exit Condition |
|------|-----------|-----------------|----------------|
| `collapsed` | MiniBarContent | Initial / close drawer / collapse | Click minibar |
| `expanded` | PaletteContent | Click minibar | Click backdrop / swipe down / open drawer |
| `drawer` | Drawer | Click drawer icon | Click "Done" / swipe down (mobile) |

### Collapsed Content Types

The MiniBar displays different content based on state:

| Type | Display | Use Case |
|------|---------|----------|
| `idle` | "Ask AI for help..." (gray) | Default state |
| `nudge` | Bold colored text + optional action | Proactive suggestions |
| `status` | Colored text | Context information |
| `response` | Violet text summary | After AI responds |
| `loading` | Spinner + "Thinking..." | During API call |

---

## Component Specifications

### MiniBar

**Dimensions:**
- Height: 48px (`h-12`)
- Width: Full on mobile, 400px on tablet/desktop (`w-full sm:w-[400px]`)
- Border radius: Pill shape (`rounded-full`)

**Visual:**
- Background: `bg-zinc-900/80` (dark) / `bg-white/95` (light)
- Border: `border-zinc-700/50` (dark) / `border-zinc-300/50` (light)
- Shadow: `shadow-lg shadow-black/20`
- Backdrop blur enabled

**Content:**
```
┌────────────────────────────────────────────────────┐
│  [Icon]  [Text content...]           [Action/▼]   │
└────────────────────────────────────────────────────┘
```

**Behaviors:**
- Icon spins when loading
- Icon animates on content type change
- Text truncates with ellipsis if too long
- Click anywhere expands to Palette
- Action button (if present) triggers `nudge.action.onClick`

---

### Palette

**Dimensions:**
- Width: Full on mobile, 400px on tablet/desktop
- Max height: 50vh on mobile, unlimited on desktop
- Border radius: 24px (`rounded-3xl`)

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ [Target Banner - if step targeted]                       │
│ [Awareness Banner - stale items nudge]                   │
│ [Alert Banner - pokes/runway/reminders]                  │
├──────────────────────────────────────────────────────────┤
│ [Quick Actions Row]                                      │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │  Content Area (scrollable)                           │ │
│ │  - Response display                                  │ │
│ │  - Loading shimmer                                   │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│ │ Input textarea...                     [📤] [☰] │      │
└──────────────────────────────────────────────────────────┘
```

**Sections:**

1. **Target Banner** (conditional)
   - Shows when AI is targeting a specific step
   - Format: "↩ Step: {step name}" with clear button
   - Click clear removes targeting

2. **Awareness Banner** (conditional)
   - Shows stale task suggestions
   - Format: "📋 {task title} • {N} days untouched"
   - Actions: Review / Dismiss / Next
   - Hidden when: alerts active OR step targeted

3. **Alert Banners** (conditional, sticky)
   - Persist during AI activity (unlike awareness)
   - Types:
     - **Poke:** "👉 Start '{task}' at {time}" → Start / Snooze / Dismiss
     - **Runway:** "🏃 Start '{task}' soon" → Start / Snooze / Dismiss
     - **Reminder:** "🔔 '{task}' — Set for {time}" → View / Snooze / Dismiss
   - Shows count if multiple: "1/3 ▼"

4. **Quick Actions Row**
   - Horizontal scrollable chip row
   - Context-dependent (see Quick Actions section)
   - Hidden when response is displayed

5. **Content Area**
   - Scrollable with gradient fades (top/bottom)
   - Shows: response OR loading shimmer
   - Gradient appears only when content overflows

6. **Input Area**
   - Auto-growing textarea (max 120px)
   - Drawer button (☰) + Send button (📤)
   - Hidden when response present (unless "Ask AI" clicked)

**Behaviors:**
- Auto-collapse: If `disableAutoCollapse=false` and response arrives → collapse after 300ms
- User engagement sets `disableAutoCollapse=true` (clicking "Ask AI", typing)
- Swipe down (50px or velocity >300px/s) → collapse

---

### Drawer

**Dimensions:**
- Mobile: Bottom sheet, 85vh height, full width
- Tablet/Desktop: Side panel, full height, 400px width

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  AI Help                                         [Done]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [User message - right aligned, violet]                  │
│                                                          │
│  [Assistant message - left aligned, gray]                │
│                                                          │
│  ... scrollable message history ...                      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [Thinking...] (if loading)                              │
├──────────────────────────────────────────────────────────┤
│  │ Follow-up question...                          📤 │   │
└──────────────────────────────────────────────────────────┘
```

**Message Styling:**
| Role | Alignment | Background |
|------|-----------|------------|
| User | Right | `bg-violet-600` |
| Assistant | Left | `bg-zinc-100` (light) / `bg-zinc-800` (dark) |

**Responsive Behavior:**
- Mobile: Slides up from bottom, drag-to-close enabled
- Desktop: Slides from right, no drag gestures

**Behaviors:**
- Auto-scrolls to newest message
- Messages stagger-animate on appear (50ms delay each)
- Input grows to max 200px
- Swipe down to close (mobile only: 100px threshold or 50px + velocity >500px/s)

---

## Quick Actions

### Context-Based Actions

```typescript
type QuickAction = {
  id: string;
  label: string;
  icon: string;
  query: string;
};
```

| Context | Actions |
|---------|---------|
| `queue` | `[{ id: 'next', label: 'What next?', icon: '🎯', query: 'What should I work on next?' }, { id: 'reorder', label: 'Reorder', icon: '↕️', query: 'Help me prioritize my queue' }]` |
| `taskDetail` | `[{ id: 'breakdown', label: 'Break down', icon: '📋', query: 'Break this task into steps' }, { id: 'estimate', label: 'Estimate', icon: '⏱', query: 'How long will this take?' }]` |
| Step targeted | `[{ id: 'stuck', label: "I'm stuck", icon: '🤔', query: "I'm stuck on this step" }, { id: 'explain', label: 'Explain', icon: '❓', query: 'Explain this step' }, { id: 'smaller', label: 'Smaller', icon: '🔬', query: 'Break this into smaller steps' }]` |

### Action Handling

- **"What next?"** → Calls `onRequestRecommendation()` (special handler)
- **Other actions** → Calls `onDirectSubmit(query)` bypassing input field
- **Step targeted** → Appends step context to query

---

## Response Types

```typescript
type AIResponseType = 'text' | 'suggestions' | 'explanation' | 'recommendation' | 'error';

interface AIResponse {
  type: AIResponseType;
  content: TextContent | SuggestionsContent | ExplanationContent | RecommendationContent;
  actions?: ResponseAction[];
}
```

### Response Rendering

| Type | Render | Actions |
|------|--------|---------|
| `text` | Plain text content | "Got it" / "Ask AI" |
| `suggestions` | Summary + expandable step list | "Add steps" / "Ask AI" / "Dismiss" |
| `explanation` | Title + explanation text | "Got it" / "Ask AI" |
| `recommendation` | Task card with reason | "Start Focus" / "Ask AI" / "Skip" |
| `error` | Error message | "Retry" / "Ask AI" / "Dismiss" |

### Content Interfaces

```typescript
interface TextContent {
  text: string;
}

interface SuggestionsContent {
  message: string;
  suggestions: {
    id: string;
    text: string;
    substeps?: { id: string; text: string }[];
  }[];
}

interface ExplanationContent {
  title: string;
  explanation: string;
}

interface RecommendationContent {
  taskId: string;
  taskTitle: string;
  reason: string;
}
```

---

## State Management

### State Structure

```typescript
interface AIAssistantState {
  mode: 'collapsed' | 'expanded' | 'drawer';
  context: 'queue' | 'taskDetail' | 'focusMode' | 'inbox' | 'global';
  collapsedContent: CollapsedContent;
  query: string;
  isLoading: boolean;
  response: AIResponse | null;
  messages: Message[];
  error: string | null;
}
```

### Actions

| Action | Effect |
|--------|--------|
| `EXPAND` | `collapsed` → `expanded` |
| `COLLAPSE` | `expanded` → `collapsed` (shows response summary if exists) |
| `OPEN_DRAWER` | `expanded` → `drawer` (transfers response to messages) |
| `CLOSE_DRAWER` | `drawer` → `collapsed` |
| `SET_QUERY` | Updates input text |
| `SUBMIT_QUERY` | Sets `isLoading: true`, updates collapsed content |
| `RECEIVE_RESPONSE` | Stores response, adds to messages if in drawer |
| `ACCEPT_SUGGESTIONS` | Clears response, shows "✓ Steps added", auto-collapses |
| `DISMISS_RESPONSE` | Clears response, returns to idle |
| `SET_CONTEXT` | Changes context (updates quick actions) |
| `SET_NUDGE` | Sets proactive notification |
| `CLEAR_NUDGE` | Returns to idle state |

---

## Animation Specifications

### Spring Configurations

```typescript
const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.8
};

const SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 600,
  damping: 40
};

const SPRING_GENTLE = {
  type: 'spring',
  stiffness: 300,
  damping: 30
};

// Height transitions (no overshoot)
const HEIGHT_TRANSITION = {
  type: 'tween',
  duration: 0.3,
  ease: [0.32, 0.72, 0, 1]  // iOS-like ease
};
```

### Element Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| MiniBar icon | Spin on loading, scale on change | 0.15s | spring |
| MiniBar text | Fade + slide (y: ±4px) | 0.15s | ease |
| Palette expand | Height auto | 0.3s | [0.32, 0.72, 0, 1] |
| Content fade | Cross-fade | 0.15s | ease |
| Quick actions | Staggered fade-in | 0.2s + 50ms delay | spring |
| Response items | Slide (x: -8px) + fade | 0.2s + 50ms delay | spring |
| Drawer slide | Transform x/y | 0.35s | spring |
| Messages | Staggered fade-in | 0.2s + 50ms delay | spring |

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```typescript
const prefersReducedMotion = useReducedMotion();

// Conditional application
whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
```

---

## Accessibility

### ARIA Attributes

| Component | Attributes |
|-----------|------------|
| MiniBar | `role="button"` `aria-expanded={isExpanded}` |
| Palette | `role="dialog"` `aria-modal="true"` |
| Drawer | `role="dialog"` `aria-modal="true"` `aria-labelledby="drawer-title"` |
| Loading | `aria-live="polite"` |
| Send button | `aria-label="Send message"` |

### Keyboard Navigation

- Tab order preserved naturally
- Focus visible on all interactive elements
- Escape to close (handled by parent)
- Enter to submit (in textarea, without Shift)
- Shift+Enter for newline

### Motion Accessibility

- `prefers-reduced-motion` respected
- No critical interactions depend on animations
- State changes visible without animation

---

## Responsive Design

### Breakpoints

```typescript
const BREAKPOINTS = {
  mobile: 640,    // < 640px
  tablet: 640,    // 640-1023px
  desktop: 1024   // ≥ 1024px
};
```

### Layout by Device

| Component | Mobile | Tablet/Desktop |
|-----------|--------|----------------|
| MiniBar | Full width | 400px centered |
| Palette | Full width | 400px centered |
| Drawer | Bottom sheet (85vh) | Side panel (400px) |

### Safe Areas

- iPhone notch/home bar: `padding-bottom: env(safe-area-inset-bottom)`
- Touch targets: Minimum 44px height

---

## Input Handling

### Keyboard Behavior

| Key | Action |
|-----|--------|
| Enter | Submit query |
| Shift+Enter | Add newline |
| Escape | Close (if implemented by parent) |

### Textarea Auto-Grow

- Palette: Max 120px
- Drawer: Max 200px
- Grows as user types, shrinks when cleared

---

## Gesture Support

### MiniBar/Palette

- Click: Expand/collapse
- Swipe down: Collapse
  - Threshold: 50px displacement OR velocity >300px/s

### Drawer (Mobile Only)

- Swipe down: Close
  - Threshold: 100px displacement OR (50px + velocity >500px/s)
- Drag handle provides visual feedback
- Opacity fades as dragging

---

## AI Target Context

For step-level targeting:

```typescript
interface AITargetContext {
  type: 'step' | 'task';
  id: string;
  label: string;
}
```

**Behavior:**
- When set, MiniBar shows "Step: {label}"
- Quick actions change to step-specific set
- Queries include step context automatically
- Clear button removes targeting

---

## Alert Integration

Palette displays alerts from other systems:

```typescript
type ActiveAlert =
  | { type: 'poke'; data: PokeAlert }
  | { type: 'runway'; data: RunwayAlert }
  | { type: 'reminder'; data: ReminderAlert };
```

**Display Rules:**
- Alerts persist during AI activity (sticky)
- Multiple alerts show count + cycle button
- Awareness banner hides when alerts present
- Each alert type has specific actions (Start, Snooze, Dismiss)

---

## File Reference

| File | Purpose |
|------|---------|
| `AIAssistantOverlay.tsx` | Parent container, mode orchestration |
| `MiniBarContent.tsx` | Collapsed state rendering |
| `PaletteContent.tsx` | Expanded state with full functionality |
| `Drawer.tsx` | Full chat modal |
| `ResponseDisplay.tsx` | Type-based response rendering |
| `QuickActions.tsx` | Action chip row |
| `ChatHistory.tsx` | Message list component |
| `hooks/useAIAssistant.ts` | State management hook |
| `lib/ai-types.ts` | TypeScript interfaces |
| `lib/ai-constants.ts` | Animation configs, quick actions |
