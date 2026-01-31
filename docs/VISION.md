# Focus Tools — Vision & Goals

> **Status:** Stable
> **Last Updated:** January 2026

---

## The Problem

Traditional task management tools fail for ADHD users due to:

| Challenge | Impact |
|-----------|--------|
| **Cognitive load** | Complex interfaces require executive function to operate |
| **Working memory gaps** | Tasks vanish if not externalized immediately |
| **Prioritization paralysis** | Everything feels equally urgent |
| **Task initiation difficulty** | Knowing *what* to do ≠ being able to *start* |
| **Time blindness** | Items fall off radar without external cues |
| **Perfectionism paralysis** | Reluctance to capture "imperfect" tasks |

**Current Workaround:** Partner acts as external reminder system—tool aims to reduce this dependency while preserving the benefits of human accountability.

---

## The Vision

An ADHD-friendly task management tool that reduces friction by:

- **Accepting messy, imperfect input** — Capture first, refine later
- **AI-assisted structure** — System does the organizing, not the user
- **Execution support** — Accountability and check-ins through "body double" AI
- **Proactive surfacing** — Forgotten items resurface automatically
- **Progress celebration** — Momentum through small wins

---

## Target Users

**Primary:** Adults with ADHD who struggle with task management
**Secondary:** Anyone with executive function challenges (autism, anxiety, depression)

**User Profile:**
- Has tried multiple productivity apps and abandoned them
- Often forgets tasks unless reminded by others
- Struggles to start tasks even when they know what to do
- Benefits from external accountability (body double, coworking)

---

## Core Concepts

### Two Operational Domains

The tool addresses two distinct cognitive modes:

| Domain | Description | Mental State | AI Persona |
|--------|-------------|--------------|------------|
| **Admin** | Meta-work: organizing, planning, structuring | Analytical, zoomed-out | Executive Assistant |
| **Execution** | Doing work: focusing, completing, progressing | Flow-state, zoomed-in | Body Double |

**Key Insight:** These domains operate in parallel, not sequentially. Users jump between them fluidly. The tool supports seamless transitions.

**AI Persona Model:** Single AI with context-dependent behavior (wears different "hats"). User should not need to explicitly switch personas—AI infers from context.

### Workflow Model

Pool-and-queue approach optimized for ADHD:

```
┌─────────────────────────────────────────────────────┐
│                       INBOX                          │
│              (Quick capture, undefined)              │
└──────────────────────┬──────────────────────────────┘
                       │ Triage
                       ▼
┌─────────────────────────────────────────────────────┐
│                        POOL                          │
│            (All defined tasks, searchable)           │
└──────────────────────┬──────────────────────────────┘
                       │ Add to Focus Queue
                       ▼
┌─────────────────────────────────────────────────────┐
│                   FOCUS QUEUE                        │
│          (Prioritized, time-committed items)         │
│                                                      │
│  ╔════════════════════════════════════════════╗     │
│  ║  TODAY (Asteroid Belt)                     ║     │
│  ╚════════════════════════════════════════════╝     │
│  ┌─ THIS WEEK ─────────────────────────────────┐    │
│  └─────────────────────────────────────────────┘    │
│  ┌─ UPCOMING ──────────────────────────────────┐    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │ Complete
                       ▼
┌─────────────────────────────────────────────────────┐
│                     COMPLETED                        │
└─────────────────────────────────────────────────────┘

      ┌───────────────────────────────────────┐
      │            PARKING LOT                │
      │       (Archived, recoverable)         │
      └───────────────────────────────────────┘
```

### Layer Definitions

| Layer | Purpose | User Mindset |
|-------|---------|--------------|
| **Inbox** | Frictionless capture | "Get it out of my head" |
| **Pool** | Available task library | "I could work on this" |
| **Focus Queue** | Committed intentions | "I will work on this" |
| **Completed** | Accomplishments | "I did this" |
| **Parking Lot** | Guilt-free storage | "Not now, maybe later" |

---

## AI Philosophy

### Proactivity Levels

| Level | Behavior | Example | When to Use |
|-------|----------|---------|-------------|
| **Silent** | Logs observations, no interruption | Notes task is stale | Background processing |
| **Ambient** | Subtle visual indicator | Badge: "3 items need attention" | Default for non-urgent |
| **Nudge** | Gentle prompt, dismissible | "You paused 15 min ago—still working?" | Focus mode, stale detection |
| **Interrupt** | Demands attention | Modal: "Deadline in 1 hour!" | User-defined urgency only |

**Default:** Ambient + Nudge
**Principle:** Curious and warm tone, never parental or shame-inducing

### Four-Surface Architecture

| Surface | Role | Content Type |
|---------|------|--------------|
| **MiniBar** | Status bar + notification | One-line status, icons |
| **Palette** | Conversational layer | Text responses, input |
| **Drawer** | Extended chat | Full history, multi-turn |
| **StagingArea** | Decision workspace | Steps, edits, accept/reject |

---

## Functional Framework

### Admin Domain (Executive Assistant)

| Need | User Action | AI Role |
|------|-------------|---------|
| **Capture** | Quick-add tasks (text, voice, image) | Refine tasks; Parse intent |
| **Triage** | Process inbox: define, do, delegate, defer, delete | Recommend categories + priority |
| **Structure** | Add subtasks, details, metadata | Recommend breakdown; Apply tags |
| **Plan** | Sort + prioritize for day, week, month | Recommend prioritization; Flag conflicts |
| **Remind** | Set alarms / reminders | Proactive time-based reminders |
| **Recall** | Ask about status / forgotten tasks | Surface relevant tasks; Detect stale items |

### Execution Domain (Body Double)

| Need | User Action | AI Role |
|------|-------------|---------|
| **Overcome Inertia** | Work on clearly defined, bite-sized steps | Recommend steps to start |
| **Maintain Focus** | Work towards check-in with body double | Check-in / Accountability |
| **Overcome Roadblocks** | Split or simplify task | Recommend next steps; Provide info |
| **Switch Context** | Pause + switch tasks | Bookmark progress; Suggest return |
| **Complete Step** | Mark done; Add notes | Acknowledge; Prompt next step; Celebrate |

---

## Technical Direction

| Component | Choice |
|-----------|--------|
| **Frontend** | Next.js, React, Tailwind CSS |
| **Backend/DB** | Supabase (deferred until UX validated) |
| **AI** | Claude API |
| **Deployment** | Vercel |
| **Mobile Path** | PWA → Capacitor → (React Native if needed) |

---

## What's Not In Scope (Yet)

- Calendar integration
- Voice-first interaction
- Email parsing for task extraction
- Collaboration / shared tasks
- Orbital Zen spatial UI (concept exists, deferred)
- AI inference of importance/energy type
- Pattern learning

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [PRINCIPLES.md](./PRINCIPLES.md) | How we build things |
| [ROADMAP.md](./ROADMAP.md) | What's done and planned |
| [features/INDEX.md](./features/INDEX.md) | Implemented features |
| [Product Doc (full)](../resources/focus-tools-product-doc.md) | Complete specification |
