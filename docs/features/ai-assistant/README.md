# AI Assistant (Minibar / Palette / Drawer)

> Progressive disclosure AI interface with context-aware assistance.

**Status:** ✅ Complete (with AI Guardrails)
**Added:** January 2026
**Location:** `prototypes/task-copilot/components/ai-assistant/`

---

## Overview

The AI Assistant is a three-tier interface system that provides contextual AI help throughout Focus Tools. It uses **progressive disclosure** to adapt to user engagement levels—from a minimal notification pill to a full conversation drawer.

**Core Principle:** Surface the right amount of UI for the current interaction. Quick questions get quick answers; deeper conversations get dedicated space.

## Quick Links

- [Specification](./SPEC.md) — Behavior rules, states, and interactions
- [AI Guardrails](../ai-guardrails/) — Rate limiting, safety, analytics

## The Three Tiers

```
┌─────────────────────────────────────────────────────────────┐
│  MINIBAR (Collapsed)                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✨  Ask AI for help...                          ▼  │   │
│  └─────────────────────────────────────────────────────┘   │
│  48px pill • Always visible • Click to expand               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PALETTE (Expanded)                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [What next?] [Break down] [Estimate]               │   │
│  │                                                     │   │
│  │  Response content area (scrollable)                 │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │ Ask a question...                    📤 ☰   │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│  400px card • Quick actions • Input field                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  DRAWER (Full Chat)                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI Help                                    [Done]  │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  User: How do I break this task down?               │   │
│  │                                                     │   │
│  │  Assistant: Here are some suggested steps...        │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  │ Follow-up question...                    📤 │   │   │
│  └─────────────────────────────────────────────────────┘   │
│  Side panel (desktop) or bottom sheet (mobile)              │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Mode** | Current visibility state: `collapsed` / `expanded` / `drawer` |
| **Context** | Where user is: `queue` / `taskDetail` / `focusMode` / `inbox` |
| **Quick Actions** | Context-aware action chips (changes based on view) |
| **AI Target** | Optional step/task targeting for focused assistance |
| **Collapsed Content** | MiniBar display state: `idle` / `nudge` / `status` / `response` / `loading` |
| **Response Types** | `text` / `suggestions` / `explanation` / `recommendation` / `error` |

## Context-Aware Quick Actions

| Context | Actions |
|---------|---------|
| **Queue** | "What next?" • "Reorder" |
| **Task Detail** | "Break down" • "Estimate" |
| **Focus Mode** | "I'm stuck" • "Explain" |
| **Step Targeted** | "I'm stuck" • "Explain" • "Smaller steps" |

## Components

| Component | Purpose | File |
|-----------|---------|------|
| `AIAssistantOverlay` | Parent container orchestrating modes | `AIAssistantOverlay.tsx` |
| `MiniBarContent` | Collapsed 48px pill | `MiniBarContent.tsx` |
| `PaletteContent` | Expanded quick-action card | `PaletteContent.tsx` |
| `Drawer` | Full chat modal | `Drawer.tsx` |
| `ResponseDisplay` | Renders AI responses by type | `ResponseDisplay.tsx` |
| `QuickActions` | Action chip row | `QuickActions.tsx` |
| `ChatHistory` | Message list for drawer | `ChatHistory.tsx` |

## User Flow Examples

### Quick Question
1. User clicks MiniBar (collapsed)
2. Palette expands with quick actions
3. User types "How long will this take?"
4. AI responds with estimate
5. User clicks "Got it" → Palette collapses

### Step Breakdown
1. User views a task, taps step's AI target button
2. MiniBar shows "Step: Review spreadsheet"
3. User expands, sees step-specific quick actions
4. Clicks "Break this into smaller steps"
5. AI suggests substeps → User accepts → Steps added

### Extended Conversation
1. User asks question in Palette
2. Wants to follow up → clicks drawer icon
3. Drawer opens with full message history
4. Multi-turn conversation continues
5. User clicks "Done" → returns to collapsed state

## Design Principles

1. **Progressive Disclosure** — Start minimal, expand on demand
2. **Context Awareness** — Quick actions match current view
3. **Non-Intrusive** — MiniBar doesn't block content
4. **Accessible** — Reduced motion support, keyboard nav, ARIA roles
5. **Responsive** — Different layouts for mobile/desktop

## Related Features

- [AI Guardrails](../ai-guardrails/) — Rate limiting, analytics, safety checks
- [Nudge System](../nudge-system/) — Alert banners in Palette
- [Start Nudge](../start-nudge/) — Poke notifications surfaced in Palette

## Portability Notes

This pattern can be adapted for other products:

- **Three-tier progressive disclosure** works for any AI assistant
- **Context-aware quick actions** adapt to different app views
- **Response types** (text, suggestions, recommendation) are reusable
- **Animation specs** provide consistent feel across products

See [SPEC.md](./SPEC.md) for detailed behavioral specifications that can inform other implementations.
