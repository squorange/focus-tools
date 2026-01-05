# Focus Tools — Product Document (WIP)

> **Status:** Work in Progress  
> **Last Updated:** January 2025  
> **Purpose:** Living document capturing vision, framework, and design decisions for iterative refinement

---

## 1. Vision & Problem Statement

### Core Problem
Traditional task management tools fail for ADHD users due to:
- **Cognitive load:** Complex interfaces require executive function to operate
- **Working memory gaps:** Tasks vanish if not externalized immediately
- **Prioritization paralysis:** Everything feels equally urgent
- **Task initiation difficulty:** Knowing *what* to do ≠ being able to *start*
- **Time blindness:** Items fall off radar without external cues
- **Perfectionism paralysis:** Reluctance to capture "imperfect" tasks

### Vision
An ADHD-friendly task management tool that reduces friction by:
- Accepting messy, imperfect input
- Providing AI-assisted structure without requiring user effort
- Supporting execution through accountability and check-ins
- Proactively surfacing forgotten items
- Celebrating progress to generate momentum

### Current Workaround
Partner acts as external reminder system—tool aims to reduce this dependency while preserving the benefits of human accountability.

---

## 2. Conceptual Framework

### Two Operational Domains

The tool addresses two distinct cognitive modes:

| Domain | Description | Mental State | AI Persona |
|--------|-------------|--------------|------------|
| **Admin** | Meta-work: organizing, planning, structuring | Analytical, zoomed-out | Executive Assistant |
| **Execution** | Doing work: focusing, completing, progressing | Flow-state, zoomed-in | Body Double |

**Key Insight:** These domains operate in parallel, not sequentially. Users jump between them fluidly. The tool must support seamless transitions without losing state.

**AI Persona Model:** Single AI with context-dependent behavior (wears different "hats"). User should not need to explicitly switch personas—AI infers from context.

---

## 3. Functional Framework

### Admin Domain (Executive Assistant)

| Need | User Action | AI Role |
|------|-------------|---------|
| **Capture** | Quick-add tasks (text, voice, image, email) | Refine tasks; Parse intent |
| **Triage** | Process inbox: define, do, delegate, defer, delete | Recommend categories + priority; Flag duplicates |
| **Structure** | Manually add subtasks, details, metadata | Recommend breakdown; Apply tags |
| **Plan / Prioritize** | Sort + prioritize; Plan for day, week, month, quarter | Recommend prioritization (incorporate insights); Flag conflicts; Prompt periodic rebalancing |
| **Remind** | Manually set alarms / reminders | Proactive time-based reminders |
| **Recall** | Ask about status / forgotten tasks | Surface relevant tasks; Detect stale items |

### Execution Domain (Body Double)

| Need | User Action | AI Role |
|------|-------------|---------|
| **Overcome Inertia** | Work on clearly defined, bite-sized steps | Recommend steps to start |
| **Maintain Focus** | Work towards check-in with body double | Check-in / Accountability |
| **Overcome Roadblocks** | Split or simplify task; Ask for help or additional info | Recommend next steps; Provide required info |
| **Switch Context** | Pause + switch tasks | Bookmark progress + summarize state; Suggest return |
| **Complete Step** | Mark done; Add notes | Acknowledge; Prompt next step; Celebrate win |
| **Reflect** | Retros for project; Document learnings | Summarize journey; Surface insights; Celebrate wins |

---

## 4. Design Decisions

### Confirmed Decisions

| Decision | Rationale |
|----------|-----------|
| Single AI persona with context-aware behavior | Simpler mental model; coherent memory across modes; unified voice |
| Admin ↔ Execution are parallel, not sequential | Matches real usage patterns; users jump between modes fluidly |
| Adapt/Rebalance folded into Plan/Prioritize | Recurring planning naturally includes reprioritization |
| Celebrate integrated into Complete Step | Immediate dopamine hit more effective than separate celebration step |
| Abandon/Archive handled in Triage | Natural place for disposition decisions |
| Basic "Waiting On" support | Non-blocking flag; tracked at task level |
| Energy/capacity awareness is low priority | Can be handled via AI-powered Plan/Prioritize ("what's easy to knock out?") |

### AI Proactivity Model

| Level | Behavior | Example | When to Use |
|-------|----------|---------|-------------|
| **Silent** | Logs observations, no interruption | Notes task is stale | Background processing |
| **Ambient** | Subtle visual indicator | Badge: "3 items need attention" | Default for non-urgent |
| **Nudge** | Gentle prompt, dismissible | "You paused 15 min ago—still working?" | Focus mode, stale detection |
| **Interrupt** | Demands attention | Modal: "Deadline in 1 hour!" | User-defined urgency only |

**Default:** Ambient + Nudge  
**Principle:** Curious and warm tone, never parental or shame-inducing

### Proactive vs. Reactive Behaviors

| Function | Reactive (User-Initiated) | Proactive (AI-Initiated) |
|----------|---------------------------|--------------------------|
| Remind | User sets alarm | AI suggests based on due date |
| Recall | User asks "what about my car?" | AI surfaces stale items |
| Rebalance | User initiates review | AI detects conflicts, prompts review |
| Context Switch | User pauses task | AI bookmarks automatically |

---

## 5. Cross-Cutting Capabilities

These AI capabilities span multiple functions:

| Capability | Description | Examples |
|------------|-------------|----------|
| **Pattern Recognition** | Identify relationships and trends across tasks | "These 3 tasks seem related—group them?" |
| **Conflict Detection** | Surface scheduling or priority conflicts | "Friday has 5 deadlines—redistribute?" |
| **Drift Detection** | Identify abandoned or stale items | "This has been deferred 4x—what's blocking?" |
| **Intent Parsing** | Extract actionable structure from messy input | "Buy groceries somehow" → structured task |
| **Progress Synthesis** | Summarize state across tasks/projects | "3 of 7 steps done; on track for Thursday" |

---

## 6. Workflow Model

### Overview

The workflow model uses a pool-and-queue approach optimized for ADHD:

```
┌─────────────────────────────────────────────────────────────────┐
│                           INBOX                                  │
│                    (Quick capture, undefined)                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Triage
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                            POOL                                  │
│              (All defined tasks, searchable)                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Add to Focus Queue
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FOCUS QUEUE                               │
│              (Prioritized, time-committed items)                 │
│                                                                  │
│  ╔═══════════════════════════════════════════════════╗          │
│  ║  TODAY (Asteroid Belt)                            ║          │
│  ╚═══════════════════════════════════════════════════╝          │
│  ┌─ THIS WEEK ──────────────────────────────────────┐           │
│  └──────────────────────────────────────────────────┘           │
│  ┌─ UPCOMING ───────────────────────────────────────┐           │
│  └──────────────────────────────────────────────────┘           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Complete
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         COMPLETED                                │
└─────────────────────────────────────────────────────────────────┘

        ┌───────────────────────────────────────┐
        │            PARKING LOT                │
        │       (Archived, recoverable)         │
        └───────────────────────────────────────┘
```

### Layer Definitions

| Layer | Purpose | User Mindset | Contents |
|-------|---------|--------------|----------|
| **Inbox** | Frictionless capture | "Get it out of my head" | Raw captures, undefined tasks |
| **Pool** | Available task library | "I could work on this" | Defined, actionable tasks |
| **Focus Queue** | Committed intentions | "I will work on this" | Time-bound priorities |
| **Completed** | Accomplishments | "I did this" | Finished tasks |
| **Parking Lot** | Guilt-free storage | "Not now, maybe later" | Archived/deferred tasks |

### Navigation Model

**2-Tab + Search** — streamlined navigation for both desktop and mobile.

```
DESKTOP
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────┐  🔍 Search tasks...                             [💬]  │
│ │ Focus │ Tasks [1]│                                                        │
│ └──────────────────┘                                                        │
├─────────────────────────────────────────────────┬───────────────────────────┤
│                                                 │                           │
│  Main Content Area                              │  AI Assistant             │
│                                                 │  (Side Panel)             │
│                                                 │                           │
└─────────────────────────────────────────────────┴───────────────────────────┘

MOBILE
┌─────────────────────────────────────────┐
│ ┌───────────────────┐            [🔍]  │
│ │ Focus │ Tasks [1] │                   │
│ └───────────────────┘                   │
├─────────────────────────────────────────┤
│                                         │
│  Main Content Area                      │
│  (Full Screen)                          │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │  ← Floating AI bar
│  │ 💬 AI Assistant            [▲]  │   │    (expands on tap)
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Tab Structure:**

| Tab | View | Contains | Maps to Workflow |
|-----|------|----------|------------------|
| **Focus** | FocusView (home) | Today/Week/Upcoming queue | Focus Queue |
| **Tasks** | TasksView | Inbox section + Pool section | Inbox + Pool |
| **🔍** | SearchView | Quick access + cross-status search | All layers |
| **📁** | ProjectsView (drill-in) | Project management | Organization |

**Design Rationale:**
- **2 tabs vs 3:** Reduces cognitive overhead; groups admin activities (Inbox + Pool) together
- **Focus is home:** Emphasizes action orientation; what am I doing now?
- **Search as full view:** Supports AI pane side-by-side; finds anything
- **AI: side panel (desktop) / floating bar (mobile):** Always accessible without modal interruption; floating bar pattern matches Apple Music mini player

**Tasks View Sections:**
- **Project filter chips** — Filter by project (tap to toggle)
- **Needs Triage (N)** — Top 5 inbox items + "View all" drill-in
- **Ready (N)** — Pool tasks sorted by focus score
- **Waiting (N)** — Tasks with `waitingOn` set (if any)
- **Resurfaced (N)** — Deferred tasks that hit their date (if any)
- **Projects link** — Drill-in to dedicated ProjectsView

**Search View Features:**
- Quick Access cards: High Priority, Projects, Completed, Archived, Waiting, Deferred
- Cross-status search: finds tasks regardless of layer
- Recent searches for repeat access

### Inbox

**Role:** Capture buffer — frictionless entry point

**Characteristics:**
- Quick capture with minimal metadata
- Items are "drafts" — not yet actionable
- Encourages externalizing thoughts without commitment

**User Actions:**
- Quick capture (text, voice, image)
- Triage: Define and send to Pool, or defer/delete

**AI Role:**
- Parse intent, suggest refinements
- Flag when inbox is getting large
- Identify potential duplicates

**Exit Paths:**

| Action | Destination |
|--------|-------------|
| Triage → Define | Pool |
| Triage → Define + Queue | Pool + Focus Queue |
| Defer | Pool (with `deferredUntil` date) |
| Park | Parking Lot |
| Delete | Removed |

### Pool

**Role:** Curated library of ready-to-work tasks

**Characteristics:**
- All items are triaged and actionable
- Unordered — not a priority list
- Searchable, sortable, filterable
- AI surfaces relevant items based on context

**User Actions:**
- Browse, search, filter
- Add to Focus Queue
- Edit task details
- Archive to Parking Lot

**AI Role:**
- Surface stale items (nudge)
- Alert for approaching deadlines
- Suggest relevant tasks based on context

**Key Properties:**
- `waitingOn` — non-blocking flag for items pending external input
- `deferredUntil` — hidden until date arrives, then resurfaces

### Focus Queue

**Role:** Committed intentions with time horizons

**Characteristics:**
- Limited set of prioritized items
- Three horizons: Today, This Week, Upcoming
- Single queue (not separate daily plans)
- Supports task-level and step-level selection

**Horizons:**

| Horizon | Meaning | Visual Treatment |
|---------|---------|------------------|
| **Today** | Committed for today | Asteroid belt (prominent) |
| **This Week** | High intent, flexible timing | Visible, secondary |
| **Upcoming** | On radar, not time-committed | Tertiary |

**Queue Mechanics:**
- Soft limit with warning (e.g., 15 items in "today")
- Calendar-based horizons with intention framing
- Supports scheduling specific dates within "this week"

**Step Selection:**
- Add entire task (all steps in scope)
- Add specific steps (multi-select subset)
- Completion based on selection, not entire task

**Decay/Staleness:**
- "Today" untouched 3 days → prompt
- "This week" rolls over → increment counter
- In queue 2+ weeks → prompt to recommit or remove

### Completed

**Role:** Record of accomplishments

**Characteristics:**
- Shows recently completed tasks
- "Completed Today" section for momentum
- Full history accessible

**Completion Types:**
- **Step-based:** All steps complete → task complete
- **Manual:** User marks task done (override)

### Parking Lot

**Role:** Guilt-free storage for tasks not currently active

**Characteristics:**
- Recoverable — not deleted
- Shame-free language
- Can include reason: parked, abandoned

**AI Behavior:**
- Periodically surface: "You parked X 3 months ago — still interested?"

### Waiting On

**Implementation:** Non-blocking flag on tasks in Pool

**Characteristics:**
- Informational, not blocking
- Can still focus on other steps
- Badge shows count in Pool view

**Fields:**
- `waitingOn.who` — person/entity
- `waitingOn.since` — when waiting started
- `waitingOn.followUpDate` — when to check back

### Deferred Items

**Implementation:** `deferredUntil` field on tasks in Pool

**Behavior:**
- Task hidden from Pool until date
- On date, appears in "Resurfaced" section
- User actions: Add to Queue, Keep in Pool, Park Again

### State Transitions

| From | To | Trigger |
|------|----|---------|
| Inbox | Pool | Triage complete |
| Inbox | Focus Queue | Triage + Add to Queue |
| Inbox | Parking Lot | Park during triage |
| Pool | Focus Queue | User adds or accepts AI suggestion |
| Pool | Parking Lot | User archives |
| Pool | Completed | Manual completion (no steps) |
| Focus Queue | Pool | User removes from queue |
| Focus Queue | Completed | Focus goal met |
| Parking Lot | Pool | User restores |
| Completed | Pool | User reopens |

### Navigation Model

**2-Tab + Search** — streamlined navigation optimized for admin vs. execution mindsets.

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────────────┐  🔍 Search...                      [💬]  │
│ │ Focus │ Tasks [N] │                                          │
│ └───────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

| Tab/View | Purpose | Contents |
|----------|---------|----------|
| **Focus** (default) | Execution mindset | Focus Queue (Today, This Week, Upcoming) |
| **Tasks** | Admin mindset | Inbox section + Pool section (combined) |
| **Search** (icon) | Find anything | Cross-status search + Quick Access filters |

**Rationale:**
- 2 tabs maps to 2 domains (Execution = Focus, Admin = Tasks)
- Combined Inbox + Pool in Tasks view groups admin activities
- Search as separate view enables AI assistance alongside results
- Focus as default emphasizes action over planning

**Tasks View Structure:**
```
Tasks
├── Needs Triage (top 5 inbox items)
│   └── [View all N items →] → Inbox (drill-in)
├── Ready (pool tasks, sorted)
├── Waiting (if any have waitingOn)
└── Resurfaced (if any deferred items due)
```

**Platform Considerations:**
- Desktop: Search bar expanded in header, AI in side panel
- Mobile: Search icon in header, AI as floating bar (like Apple Music controls)

---

## 7. UI Concept: Orbital Zen

### Core Metaphor
Tasks orbit around user's current focus at distances based on priority (closer = more urgent). Subtasks appear as moons orbiting parent tasks.

### Key Interactions
- **Fractal zoom:** Click task to zoom in; subtasks become visible as moons
- **Gravity/priority:** Drag tasks to adjust orbital distance
- **Focus mode:** Single task centered, timer, AI check-ins
- **Drift visualization:** Stale tasks visually decay or drift outward

### View Modes (Tentative)
- **Orbital view:** Spatial priority visualization
- **List view:** Traditional fallback (MVP)
- **Timeline view:** Calendar/schedule perspective

### MVP Approach
Start with list-based UI for prototyping and testing. Orbital Zen deferred to later phase.

---

## 8. AI Interaction Patterns

### Planning Loop (Async, Flexible)
```
User dumps rough intent
    ↓
AI structures into steps
    ↓
User approves/adjusts
    ↓
Creates tracked task list
```

### Execution Loop (Sync, Focused)
```
AI presents current step
    ↓
User works on it
    ↓
Mark complete → AI acknowledges + celebrates
    ↓
AI prompts: "Next step?" or "Questions?"
    ↓
Repeat until done
```

### Example Interactions

**Capture (messy input):**
> User: "I need to do taxes somehow"  
> AI: "Got it. Want me to break that down into steps, or just capture it for now?"

**Overcome Inertia:**
> AI: "Ready to start 'Gather W-2s'? It's a 5-minute task. I'll check in when you're done."

**Check-in:**
> AI: "Nice work finishing Step 2! Ready for 'Review deductions', or need a break?"

**Roadblock:**
> User: "I'm stuck"  
> AI: "What's blocking you? We could: (a) break this into smaller steps, (b) skip to something easier, (c) talk through what's unclear."

**Recall:**
> User: "What was that thing about my car?"  
> AI: "You have 'Schedule oil change'—last touched 2 weeks ago. Want to work on it now?"

---

## 9. Technical Direction

### Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend/DB:** Supabase
- **AI:** Claude API
- **Deployment:** Vercel
- **Version Control:** GitHub (personal account)

### Architecture Principles
- Start simple, design for scale
- Capture learnings in docs for handoff continuity
- Spike new features in isolation before integration

---

## 10. Open Questions & Future Considerations

### To Define Later
- [ ] Optimal proactivity levels (requires user testing)
- [ ] Multi-device sync behavior
- [ ] Notification strategy (push, email, in-app only?)
- [ ] Collaboration features (shared tasks, family accounts?)

### Future Scope (Not MVP)
- Energy/capacity-aware suggestions
- Time-of-day pattern learning
- Voice-first interaction mode
- Calendar integration
- Email parsing for task extraction
- Habit/recurring task support
- External integrations (Jira, Asana, etc.)
- Orbital Zen UI

### Research Questions
- What proactivity level feels supportive vs. nagging?
- Does orbital metaphor reduce or increase cognitive load?
- How to handle shame around abandoned tasks?

---

## 11. POC Implementation (Task Co-Pilot)

### Purpose
Working prototype of Model E workflow with AI integration. Originally a spike for Claude API patterns, now a fully functional implementation.

### Location
```
focus-tools/
└── prototypes/
    └── task-copilot/
```

### Implementation Status: Complete

The POC implements the full Model E workflow with extensive AI integration:

**Core Workflow:**
- 2-tab navigation (Focus | Tasks) with search
- Inbox → Pool → Focus Queue → Completed flow
- All state transitions functional
- localStorage persistence with schema versioning

**AI Integration (Function Calling):**
| Context | Tools Available |
|---------|----------------|
| Planning Mode | `replace_task_steps`, `suggest_additions`, `edit_steps`, `edit_title`, `conversational_response` |
| Focus Mode | `break_down_step`, `suggest_first_action`, `explain_step`, `encourage` |

**AI Staging Workflow:**
- Suggestions appear in collapsible staging panel
- Accept/reject individual items or bulk
- Title suggestions with before/after display
- Edit suggestions with side-by-side comparison

**Focus Mode Features:**
- Timer with pause/resume (survives page refresh)
- Current step display with inline editing
- Progress bar with step count
- Substep management (full CRUD with reordering)
- I'm Stuck menu with 4 resolution paths:
  1. "Break down this step" - AI substeps
  2. "What's my first tiny action?" - AI first step
  3. "Explain this step" - AI clarification
  4. "Talk it through with AI" - Free conversation
- Completion celebration screen
- Notes module (collapsible)
- Separate AI message history per step with collapsible grouping

**Beyond MVP:**
- Dark mode support throughout
- Responsive AI drawer (desktop side panel, mobile bottom sheet)
- Health status and focus score computation
- Queue item step selection (entire task vs specific steps)
- Comprehensive utility library (date, task, step, sorting, filtering)
- Toast notifications with undo (delete, archive, project delete)
- Projects management (dedicated view, create/edit modal, color picker)
- MetadataPill component for compact metadata display
- Drag-and-drop queue reordering with move up/down menu
- PWA support (installable, offline-capable, service worker caching)

### Learnings Captured
- Claude function calling (tool_use) provides ~99% reliability vs ~85% with JSON-in-text
- Separate AI contexts needed for planning vs execution (different mental models)
- Staging workflow essential for user control over AI suggestions
- Timer state restoration important for interrupted sessions
- Message grouping by step reduces cognitive load in focus mode

---

## Appendix A: Alternative Frameworks Considered

### Cognitive Functions (EF-Based)
Capture, Organize, Sequence, Initiate, Sustain, Recall, Shift, Reflect

### Temporal Layers
Past (Recall, Reflect) → Present (Capture, Execute, Focus, Shift) → Future (Planning, Forecast, Prioritize)

### Second Brain Stack
Awareness Layer → Organization Layer → Action Layer → Capture Layer

### Gardening Metaphor
Plant, Water, Tend, Prune, Harvest, Compost, Resurface

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Body Double** | Presence-based accountability partner during task execution |
| **Executive Assistant** | AI role for meta-work: organizing, planning, structuring |
| **Drift** | Tasks becoming stale or forgotten over time |
| **Triage** | Processing inbox items to decide disposition |
| **Orbital Zen** | Spatial UI concept where tasks orbit based on priority |
| **Pool** | Collection of all defined, actionable tasks |
| **Focus Queue** | Prioritized, time-committed items user intends to work on |
| **Parking Lot** | Archive for tasks not currently active |
| **Horizon** | Time commitment level in Focus Queue (today, this week, upcoming) |

---

## Revision History

| Date | Changes |
|------|---------|
| 2025-01-04 | Added PWA support to POC status |
| 2025-01-04 | Added Projects view, Toast with undo, MetadataPill to POC status; updated navigation with Projects |
| 2025-01-03 | Updated Section 11 with complete POC implementation status; AI function calling; staging workflow; focus mode features |
| 2025-01 | Updated Section 6 with Model E workflow (Pool + Focus Queue); refined terminology |
| 2024-12-22 | Initial comprehensive document created from conversation synthesis |
