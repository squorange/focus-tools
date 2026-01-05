# Focus Tools — Documentation Index

> **Last Updated:** January 2025  
> **Purpose:** Master index of all project documentation  
> **Maintainer Note:** Update this index whenever documents are added, removed, or significantly changed

---

## Quick Reference

| Need | Start Here |
|------|------------|
| What are we building? | [Product Doc](#product--vision) |
| What's the workflow model? | [Product Doc Section 6](#product--vision) |
| What's the plan? | [Roadmap](#planning--tracking) |
| Ready to code? | [Implementation Docs](#implementation-claude-code) |
| Data structure questions? | [Data Model](#technical-reference) |
| Future feature ideas? | [Future Considerations](#strategic--future) |

---

## Document Catalog

### Product & Vision

| Document | Purpose | Status |
|----------|---------|--------|
| `focus-tools-product-doc.md` | Core vision, problem statement, conceptual framework, **workflow model (Model E)**, design decisions, AI interaction patterns, **POC implementation status** | ✅ Updated Jan 2025 |

**Key contents:** 
- ADHD problem statement
- Admin vs Execution domains
- AI persona model
- **Section 6: Workflow Model** — Inbox → Pool → Focus Queue → Completed/Parking Lot
- Task states, horizons, step selection
- Orbital Zen UI concept
- Example interactions

---

### Planning & Tracking

| Document | Purpose | Status |
|----------|---------|--------|
| `focus-tools-roadmap.md` | Phased development plan, decision log, immediate next steps, mobile path, monetization strategy | ✅ Active |
| `IMPLEMENTATION_CHECKLIST.md` | Quick-reference checklist for Claude Code sessions, verification commands | ✅ Updated Jan 2025 |

**Key contents:** Phase 0-5 breakdown, validated hypotheses, sprint tasks with time estimates, PWA → Capacitor → App Store path

---

### Technical Reference

| Document | Purpose | Status |
|----------|---------|--------|
| `FOCUS_TOOLS_DATA_MODEL.md` | Complete data model with rationale for every field, **Model E types** (Pool, Focus Queue), schema versioning, computation logic, **AI function calling architecture** | ✅ Updated Jan 2025 |
| `AI_UI_COMMUNICATION_PATTERNS.md` | Reference guide for AI integration patterns (request/response, streaming, tool use, WebSocket, local LLM) | ✅ Reference |

**Key contents:**
- Task/Step/Substep models
- **FocusQueue/FocusQueueItem** (replaces DailyPlan)
- waitingOn, deferral fields
- Event logging with new event types
- FocusSession with queue linkage
- Nudge model
- Visualization field computation (focusScore, complexity, healthStatus)
- **AI function calling tool definitions and state flow**
- **AI staging state types (SuggestedStep, EditSuggestion)**

---

### Implementation (Claude Code)

| Document | Purpose | Status |
|----------|---------|--------|
| `CLAUDE_CODE_CONTEXT_v2.md` | Full context for Claude Code sessions — architecture, **Model E types**, **2-tab navigation**, component specs, state management, **AI function calling** | ✅ Updated Jan 2025 |
| `FOCUS_MODE_PROMPTS.md` | 8 sequential prompts to build Focus Mode feature | 📋 Ready |
| `MULTI_TASK_PROMPTS.md` | 13 sequential prompts to build multi-task support + PWA (2-tab navigation) | ✅ Updated Jan 2025 |

**Usage:** Rename `CLAUDE_CODE_CONTEXT_v2.md` to `CLAUDE.md` in project root for Claude Code to auto-read.

**Key contents:**
- **2-Tab Navigation:** Focus (home) + Tasks, Search view, AI drawer/floating bar
- View structure (Focus, Tasks, Inbox drill-in, Search, TaskDetail, FocusMode)
- Complete TypeScript interfaces for Model E
- **AI Function Calling Architecture:** Planning + Focus mode tools
- Helper functions
- File structure
- Navigation flow
- Empty states

---

### Strategic & Future

| Document | Purpose | Status |
|----------|---------|--------|
| `FUTURE_CONSIDERATIONS.md` | Speculative features and strategic options with analysis — NOT committed to roadmap | ✅ Active |
| `UI_CONCEPTS_EXPLORED.md` | Catalog of visual/interaction concepts explored during ideation (Orbital Zen, Creature Companion, etc.) | 📚 Archive |

**Key contents:** Theme system analysis, BYOAI feasibility, community marketplace options, local AI considerations, rejected/deferred ideas

---

## Model E Summary

The January 2025 update introduced **Model E** — a simplified workflow model:

| Concept | Old Model | Model E |
|---------|-----------|---------|
| Navigation | 3 tabs (Inbox, Pool, Queue) | 2 tabs (Focus, Tasks) + Search |
| Task statuses | inbox, active, deferred, waiting_on, complete, archived | inbox, pool, complete, archived |
| Daily planning | DailyPlan per day with FocusItems | Single FocusQueue with horizons |
| Time commitment | Today only | Today, This Week, Upcoming |
| Deferred | Separate status | Field on pool tasks |
| Waiting On | Separate status | Non-blocking flag |
| Step selection | Task or single step | Task or multi-select steps |

**Navigation Model:**
```
[Focus │ Tasks]  🔍 Search...  [💬 AI]
```
- **Focus tab** (default): Execution mindset — queue with horizons
- **Tasks tab**: Admin mindset — combined Inbox + Pool sections
- **Search view**: Cross-status search + Quick Access cards
- **AI**: Side panel (desktop), floating bar (mobile)

**Documents updated:**
- `focus-tools-product-doc.md` — Section 6 workflow + navigation model
- `FOCUS_TOOLS_DATA_MODEL.md` — New types, migration strategy
- `CLAUDE_CODE_CONTEXT_v2.md` — 2-tab navigation, TypeScript interfaces, view structure, AI function calling
- `MULTI_TASK_PROMPTS.md` — 13 prompts for 2-tab workflow
- `IMPLEMENTATION_CHECKLIST.md` — Updated for 2-tab model + AI function calling architecture

---

## Document Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCT DOC                                  │
│            (Vision, Framework, Workflow Model)                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────────┐
│  ROADMAP  │  │DATA MODEL │  │    FUTURE     │
│  (Plan)   │  │(Structure)│  │CONSIDERATIONS │
└─────┬─────┘  └─────┬─────┘  │  (Options)    │
      │              │        └───────────────┘
      │              │
      ▼              ▼
┌─────────────────────────────────────┐
│      IMPLEMENTATION DOCS            │
│  ┌─────────────┐ ┌───────────────┐  │
│  │CLAUDE_CODE_ │ │ FOCUS_MODE_  │  │
│  │CONTEXT_v2   │ │ PROMPTS      │  │
│  └─────────────┘ └───────────────┘  │
│  ┌─────────────┐ ┌───────────────┐  │
│  │MULTI_TASK_  │ │IMPLEMENTATION│  │
│  │PROMPTS      │ │_CHECKLIST    │  │
│  └─────────────┘ └───────────────┘  │
└─────────────────────────────────────┘
```

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Stable | Core document, infrequently updated |
| ✅ Active | Living document, regularly updated |
| ✅ Updated | Recently revised (see date) |
| 📋 Ready | Implementation prompts, use as-is |
| 🔄 Needs update | Document needs revision for Model E |
| 📚 Archive | Reference/historical, rarely updated |
| 🚧 Draft | Work in progress |

---

## File Locations

**Project documentation (this repo):**
```
focus-tools/
├── docs/
│   ├── focus-tools-product-doc.md      ← Updated Jan 2025
│   ├── focus-tools-roadmap.md
│   ├── FOCUS_TOOLS_DATA_MODEL.md       ← Updated Jan 2025
│   ├── AI_UI_COMMUNICATION_PATTERNS.md
│   ├── UI_CONCEPTS_EXPLORED.md
│   ├── FUTURE_CONSIDERATIONS.md
│   └── DOCUMENTATION_INDEX.md          ← You are here
│
├── prototypes/task-copilot/
│   ├── CLAUDE.md                       ← Rename from CLAUDE_CODE_CONTEXT_v2.md
│   ├── FOCUS_MODE_PROMPTS.md
│   ├── MULTI_TASK_PROMPTS.md           ← Updated Jan 2025
│   └── IMPLEMENTATION_CHECKLIST.md     ← Updated Jan 2025
```

---

## Maintenance Instructions

### When to Update This Index

| Event | Action |
|-------|--------|
| New document created | Add to appropriate section with description |
| Document renamed | Update filename and any cross-references |
| Document archived/deleted | Move to archive section or remove |
| Document purpose changed | Update description |
| Major content restructure | Review and update "Key contents" |
| Model/architecture change | Update summary section |

### Update Prompt for Claude

When creating or significantly updating any Focus Tools documentation, include:

```
Also update DOCUMENTATION_INDEX.md:
- Add/update the document entry in the appropriate section
- Update "Last Updated" date
- Verify cross-references are accurate
```

---

## Revision History

| Date | Changes |
|------|---------|
| 2025-01-03 | Updated product doc and data model entries; added AI function calling and staging state to key contents |
| 2025-01-02 | Added 2-tab navigation model; updated all document statuses; added navigation to Model E summary |
| 2025-01 | Added Model E summary section; updated document statuses for Model E |
| 2024-12-31 | Initial index created with full document catalog |
