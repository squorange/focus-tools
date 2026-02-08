# AI MiniBar/Palette Purple Glass Background Audit

**Date:** 2026-02-07
**Purpose:** Identify the exact code that creates the purple/violet tinted glass background on AI components

---

## Summary

The purple/violet glass background is defined in **one location**:

| Component | File | Lines |
|-----------|------|-------|
| `AIAssistantOverlay` | `components/ai-assistant/AIAssistantOverlay.tsx` | 141-152 |

This component wraps both `MiniBarContent` and `PaletteContent`, providing the glass container styling.

---

## 1. The Glass Background (AIAssistantOverlay.tsx)

### Location
`prototypes/task-copilot/components/ai-assistant/AIAssistantOverlay.tsx:141-152`

### Full className String

```tsx
className={`
  w-full sm:w-[400px]
  bg-gradient-to-br from-violet-50/50 via-violet-100/40 to-violet-50/50
  dark:from-violet-950/30 dark:via-violet-950/20 dark:to-violet-950/30
  backdrop-blur-lg
  border border-violet-200/30 dark:border-violet-800/30
  overflow-hidden
  shadow-lg shadow-violet-400/[0.04] dark:shadow-violet-950/20
  rounded-3xl
  ${isExpanded ? 'touch-none' : ''}
  ${isAnimating ? 'pointer-events-none' : ''}
`}
```

### Breakdown of the Purple Tint

| Property | Light Mode | Dark Mode | Purpose |
|----------|------------|-----------|---------|
| **Gradient background** | `from-violet-50/50 via-violet-100/40 to-violet-50/50` | `from-violet-950/30 via-violet-950/20 to-violet-950/30` | The purple tint (diagonal gradient) |
| **Backdrop blur** | `backdrop-blur-lg` | `backdrop-blur-lg` | Glass effect |
| **Border** | `border-violet-200/30` | `border-violet-800/30` | Subtle purple border |
| **Shadow** | `shadow-violet-400/[0.04]` | `shadow-violet-950/20` | Purple-tinted shadow |

### Color Values

**Light mode gradient:**
- `violet-50` = `#f5f3ff` at 50% opacity
- `violet-100` = `#ede9fe` at 40% opacity

**Dark mode gradient:**
- `violet-950` = `#2e1065` at 30%/20% opacity

---

## 2. Component Hierarchy

```
page.tsx
└── <AIAssistantOverlay>          ← Glass background applied HERE (line 141-152)
    ├── <MiniBarContent>          ← Content only, no background
    └── <PaletteContent>          ← Content only, no background
```

### Rendering Location in page.tsx

`prototypes/task-copilot/app/page.tsx:6177`

```tsx
<AIAssistantOverlay
  mode={aiAssistant.state.mode === 'collapsed' ? 'collapsed' : 'expanded'}
  collapsedContent={aiAssistant.state.collapsedContent}
  // ... props
/>
```

---

## 3. Content Components (No Background Styling)

### MiniBarContent.tsx

`prototypes/task-copilot/components/ai-assistant/MiniBarContent.tsx:67-73`

```tsx
<motion.div
  // ... animation props
  className={`h-12 px-6 sm:px-4 flex items-center gap-3 cursor-pointer ${isPrompt || isNudge || isAlert ? '!pr-[9px]' : ''}`}
  onClick={handleClick}
>
```

**No background** - transparent, inherits from parent `AIAssistantOverlay`.

### PaletteContent.tsx

`prototypes/task-copilot/components/ai-assistant/PaletteContent.tsx:250-258`

```tsx
<motion.div
  layout
  // ... animation props
  className="px-6 pb-6 sm:px-4 sm:pb-4 flex flex-col h-full max-h-full overflow-hidden"
>
```

**No background** - transparent, inherits from parent `AIAssistantOverlay`.

---

## 4. AIDrawer (Different Styling)

The AIDrawer component uses a **different approach** - no purple glass background:

`prototypes/task-copilot/components/ai-assistant/AIDrawer.tsx:197-210`

```tsx
// Desktop: side drawer
<motion.div
  // ... animation props
  className="fixed z-50 flex flex-col shadow-xl right-0 top-0 bottom-0 border-l border-zinc-200/50 dark:border-zinc-700/30 pt-[env(safe-area-inset-top)]"
  style={{ width: WIDTHS.drawer }}
>
```

**Note:** AIDrawer does NOT have the purple glass styling. It uses:
- No background (inherits from page/body)
- `border-zinc-200/50` / `border-zinc-700/30` (neutral, not violet)
- Standard `shadow-xl` (not violet-tinted)

For mobile, AIDrawer uses `<BottomSheet>` which also has neutral glass styling (via design system).

---

## 5. Related Violet Styling in Content

While the container glass background is in AIAssistantOverlay, there are additional violet accent colors used inside the content:

### Input field styling (PaletteContent.tsx:826)

```tsx
<div className="bg-violet-50/30 dark:bg-violet-900/10 rounded-xl border border-violet-200/30 dark:border-violet-800/30 focus-within:border-violet-500 dark:focus-within:border-violet-500 transition-colors">
```

### Same input styling in AIDrawer.tsx:149

```tsx
<div className="bg-violet-50/30 dark:bg-violet-900/10 rounded-xl border border-violet-200/30 dark:border-violet-800/30 focus-within:border-violet-500 dark:focus-within:border-violet-500 transition-colors">
```

### Gradient fades for scrollable content (PaletteContent.tsx:564, 808)

```tsx
// Top fade
className={`... bg-gradient-to-b from-white dark:from-zinc-900 to-transparent ...`}

// Bottom fade
className={`... bg-gradient-to-t from-white dark:from-zinc-900 to-transparent ...`}
```

**Note:** These fades use `white`/`zinc-900`, NOT violet. They would need updating to match the parent's violet glass background.

---

## 6. CSS Files

No additional CSS targeting these components was found in:
- `globals.css` - no violet glass definitions
- Design system tokens - uses `bg-bg-glass-*` tokens (neutral, not violet)

The purple glass styling is **entirely inline Tailwind classes** in `AIAssistantOverlay.tsx`.

---

## 7. Migration Considerations

To migrate this to the design system token approach:

### Option A: Create Violet Glass Tokens

Add to `foundations.css`:
```css
:root {
  --color-bg-glass-ai-panel: linear-gradient(to bottom right,
    rgba(245, 243, 255, 0.5),
    rgba(237, 233, 254, 0.4),
    rgba(245, 243, 255, 0.5));
  --color-border-glass-ai-panel: rgba(221, 214, 254, 0.3);
  --color-shadow-glass-ai-panel: rgba(167, 139, 250, 0.04);
}

.dark {
  --color-bg-glass-ai-panel: linear-gradient(to bottom right,
    rgba(46, 16, 101, 0.3),
    rgba(46, 16, 101, 0.2),
    rgba(46, 16, 101, 0.3));
  --color-border-glass-ai-panel: rgba(91, 33, 182, 0.3);
  --color-shadow-glass-ai-panel: rgba(46, 16, 101, 0.2);
}
```

### Option B: Use Existing Neutral Glass + Violet Tint Overlay

Layer a subtle violet overlay on top of `bg-bg-glass-floating-panel`.

### Current Raw Classes to Replace

| Current Class | Semantic Token Candidate |
|---------------|-------------------------|
| `bg-gradient-to-br from-violet-50/50 via-violet-100/40 to-violet-50/50` | `bg-bg-glass-ai-panel` |
| `dark:from-violet-950/30 dark:via-violet-950/20 dark:to-violet-950/30` | (handled by .dark selector) |
| `border-violet-200/30 dark:border-violet-800/30` | `border-border-glass-ai-panel` |
| `shadow-violet-400/[0.04] dark:shadow-violet-950/20` | `shadow-shadow-glass-ai-panel` |

---

## 8. Files Summary

| File | Contains |
|------|----------|
| `AIAssistantOverlay.tsx` | **THE** glass background (lines 141-152) |
| `MiniBarContent.tsx` | Content only, no background |
| `PaletteContent.tsx` | Content only, input field has violet styling |
| `AIDrawer.tsx` | Different styling (neutral, not violet) |
| `page.tsx` | Renders AIAssistantOverlay at line 6177 |
