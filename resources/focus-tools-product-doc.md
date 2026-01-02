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

## 11. POC Scope (Task Co-Pilot Spike)

### Purpose
Learn Claude API patterns with minimal complexity before integrating into main tool.

### Location
```
focus-tools/
└── prototypes/
    └── task-copilot/     ← Independent spike
        ├── package.json
        ├── app/
        │   └── page.tsx
        └── README.md
```

### MVP Features
1. Text input for rough intent
2. Claude API call → returns structured steps
3. Display steps as checklist
4. On check → Claude responds with acknowledgment + next prompt
5. Minimal UI (ugly is fine—focus on AI interaction patterns)

### Learning Goals
- Claude API integration patterns
- Prompt design for task structuring
- Conversational check-in UX
- State management for multi-step flows

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
| 2025-01 | Updated Section 6 with Model E workflow (Pool + Focus Queue); refined terminology |
| 2025-12-22 | Initial comprehensive document created from conversation synthesis |
