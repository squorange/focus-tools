# Focus Tools — Principles & Guidelines

> **Status:** Living document
> **Last Updated:** January 2026

Design principles, UX philosophy, and technical conventions for Focus Tools development.

---

## Design Principles

### 1. Reduce Cognitive Load
- **Simple interfaces** — Fewer decisions, clearer paths
- **Sensible defaults** — Work out of the box, customize later
- **Progressive disclosure** — Show complexity only when needed

### 2. Support Imperfect Input
- **Capture first, refine later** — Messy is better than lost
- **AI assists, user controls** — Suggestions, not takeovers
- **No shame for abandoned tasks** — Parking lot language, not failure language

### 3. Enable Action Over Planning
- **Focus Queue is home** — App opens to what you're doing
- **Body double over todo list** — Execution support, not just organization
- **Celebrate progress** — Small wins generate momentum

### 4. Respect User Attention
- **Curious tone, never parental** — Supportive, not nagging
- **Nudges are dismissible** — No guilt for ignoring
- **Quiet hours exist** — Respect boundaries

---

## UX Philosophy

### Navigation
- **2-tab model**: Focus (execution) | Tasks (admin)
- **Search is everywhere** — Cross-status, always accessible
- **Focus Mode is immersive** — Single task, minimal distractions

### AI Interaction
- **Four-surface model:**
  | Surface | Role |
  |---------|------|
  | MiniBar | Status bar, always visible |
  | Palette | Conversational layer, ephemeral |
  | Drawer | Extended chat, escape hatch |
  | StagingArea | Decision workspace, accept/reject |

- **Auto-expand on response** — AI response lifts palette
- **Auto-collapse after 7s** — Unless user interacts
- **Staging for decisions** — Palette for dialogue, StagingArea for structured changes

### Proactivity Levels
| Level | Behavior | When |
|-------|----------|------|
| Silent | Logs only | Background processing |
| Ambient | Visual indicator | Non-urgent attention |
| Nudge | Gentle prompt | Stale detection, check-ins |
| Interrupt | Modal | User-defined urgency only |

**Default:** Ambient + Nudge

---

## Technical Conventions

### Icon/Emoji Convention
- **Icons (Lucide):** All UI elements, pickers, buttons
- **Emojis:** Reserved for AI action labels and special features
- This keeps UI clean while allowing emojis to highlight AI features

### TypeScript
- Strict mode enabled
- Explicit types over inference for public APIs
- Nullable fields use `| null`, not `undefined`
- Schema version tracked for migrations

### Component Patterns
- Functional components with hooks
- State lifted to page level where shared
- Drawers/modals managed via `activeDrawer` state
- Toast notifications for undo-able actions

### State Management
- React state + localStorage persistence
- Schema versioning with migrations
- No external state library (yet)

### Styling
- Tailwind CSS utility classes
- Dark mode: `dark:` variants
- Consistent spacing: 4px base unit
- Color system: zinc (neutral), violet (AI/accent)

---

## Core App Rules

1. **Focus Queue is home** — App opens to Queue view
2. **One queue entry per task** — No duplicates allowed
3. **Step selection** — Entire task OR specific steps (multi-select)
4. **Waiting On is non-blocking** — Can still focus on other steps
5. **Deferral hides from Pool** — Resurfaces on specified date
6. **AI MiniBar always visible** — Context-aware status and prompts
7. **List-based UI for MVP** — Orbital Zen deferred

---

## AI Tool Calling Conventions

### Planning Mode (Task Structuring)
| Tool | When to Use |
|------|-------------|
| `replace_task_steps` | Empty list OR user says "start over" |
| `suggest_additions` | **DEFAULT** — any "break down", "add steps" |
| `edit_steps` | User wants to reword/simplify |
| `edit_title` | User says "rename", "change title" |
| `conversational_response` | Pure questions only, **NEVER** for breakdown requests |

### Focus Mode (Body Double)
| Tool | When to Use |
|------|-------------|
| `break_down_step` | **DEFAULT** — any "break down", "stuck", "help" |
| `suggest_first_action` | User asks "where do I start?" |
| `explain_step` | User asks "what does this mean?" |
| `encourage` | Pure encouragement, **NEVER** for breakdown requests |

---

## Documentation Conventions

### File Naming
- `UPPER_SNAKE_CASE.md` for documentation
- Feature folders: `lowercase-with-dashes/`
- Archive naming: `YYYY-MM-initiative-name/`

### Feature Documentation Structure
```
feature-name/
├── README.md           # Overview, status, quick links
├── SPEC.md             # Requirements, behavior rules
├── DATA_MODEL.md       # Schema additions
├── IMPLEMENTATION.md   # Architecture, key files
└── PROMPTS.md          # Claude Code prompts (optional)
```

### Progress Tracking
- Progress docs get archived after feature completion
- Prompts stay in feature folders as reusable templates
- Decisions logged in feature docs or central DECISIONS.md

---

## Mobile Considerations

- Touch targets: minimum 44px
- iOS safe area handling via CSS variables
- PWA support: manifest, service worker, offline capability
- Bottom sheet for modals (not dropdowns)
- Keyboard handling: `visualViewport` API

---

## Testing Philosophy

- Unit tests for utility functions (priority calculation, date helpers)
- Manual testing via localhost + Vercel preview
- No E2E framework yet (validate UX before investing)

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [VISION.md](./VISION.md) | What we're building and why |
| [ROADMAP.md](./ROADMAP.md) | Progress and plans |
| [CLAUDE.md](../prototypes/task-copilot/CLAUDE.md) | Sprint context and implementation details |
