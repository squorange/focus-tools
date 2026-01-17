# Focus Tools — Documentation Index

> **Last Updated:** January 2026  
> **Purpose:** Master index of all project documentation  
> **Maintainer Note:** Update this index whenever documents are added, removed, or significantly changed

---

## Quick Reference

| Need | Start Here |
|------|------------|
| What are we building? | [Product Doc](#product--vision) |
| What's the plan? | [Roadmap](#planning--tracking) |
| Ready to code? | [Implementation Docs](#implementation-claude-code) |
| Data structure questions? | [Data Model](#technical-reference) |
| When to add infrastructure? | [Architecture Evolution Guide](#strategic--future) |
| Future feature ideas? | [Future Considerations](#strategic--future) |

---

## Document Catalog

### Product & Vision

| Document | Purpose | Status |
|----------|---------|--------|
| `focus-tools-product-doc.md` | Core vision, problem statement, conceptual framework, design decisions, AI interaction patterns | ✅ Stable |

**Key contents:** ADHD problem statement, Admin vs Execution domains, AI persona model, task states/lifecycle, Orbital Zen UI concept, example interactions

---

### Planning & Tracking

| Document | Purpose | Status |
|----------|---------|--------|
| `focus-tools-roadmap.md` | Phased development plan, decision log, immediate next steps, mobile path, monetization strategy | ✅ Active |
| `IMPLEMENTATION_CHECKLIST.md` | Quick-reference checklist for Claude Code sessions, verification commands | ✅ Active |
| `ASSESSMENT_AND_GAPS.md` | Gap analysis against functional framework, user-type fit assessment, opportunity prioritization | ✅ Active |

**Key contents:** Phase 0-5 breakdown, validated hypotheses, sprint tasks with time estimates, PWA → Capacitor → App Store path, P0-P2 testing priorities

---

### Technical Reference

| Document | Purpose | Status |
|----------|---------|--------|
| `FOCUS_TOOLS_DATA_MODEL.md` | Complete data model with rationale for every field, schema versioning, intelligence fields, computation logic | ✅ Stable |
| `AI_UI_COMMUNICATION_PATTERNS.md` | Reference guide for AI integration patterns (request/response, streaming, tool use, WebSocket, local LLM) | ✅ Reference |

**Key contents:** Task/Step/Substep models, DailyPlan/FocusItem, Event logging, FocusSession, visualization field computation (focusScore, complexity, healthStatus)

---

### Implementation (Claude Code)

| Document | Purpose | Status |
|----------|---------|--------|
| `prototypes/task-copilot/CLAUDE.md` | **Canonical** working context for Claude Code — auto-read every session, includes current sprint | ✅ Active |
| `CLAUDE_CODE_CONTEXT_v3.md` | Reference copy of context (for backup/sharing) | 📚 Reference |
| `FOCUS_MODE_PROMPTS.md` | 8 sequential prompts to build Focus Mode feature | ✅ Complete |
| `MULTI_TASK_PROMPTS.md` | 11 sequential prompts to build multi-task support + PWA | ✅ Complete |
| `AI_MINIBAR_PROTOTYPE_PLAN.md` | Design plan for AI MiniBar/Palette UI pattern | ✅ Complete |
| `AI_MINIBAR_INTEGRATION_PROMPTS.md` | Implementation prompts for AI MiniBar integration | ✅ Complete |

**Canonical context:** `prototypes/task-copilot/CLAUDE.md` is the canonical working context. Claude Code auto-reads it every session. Includes "Current Sprint" section at top for priorities.

**Key contents:** File structure, component responsibilities, TypeScript interfaces, navigation flow, API endpoint specs

**Archived:** `CLAUDE_CODE_CONTEXT.md` (v1) and `CLAUDE_CODE_CONTEXT_v2.md` moved to `resources/archive/`.

---

### Strategic & Future

| Document | Purpose | Status |
|----------|---------|--------|
| `ARCHITECTURE_EVOLUTION_GUIDE.md` | When to introduce frameworks, orchestration, middleware, harnesses — timing heuristics and decision signals | ✅ Active |
| `FUTURE_CONSIDERATIONS.md` | Speculative features and strategic options with analysis — NOT committed to roadmap | ✅ Active |
| `UI_CONCEPTS_EXPLORED.md` | Catalog of visual/interaction concepts explored during ideation (Orbital Zen, Creature Companion, etc.) | 📚 Archive |

**Key contents:** 
- Architecture guide: Definitions, timing signals, anti-patterns, phase-specific guidance, decision log template
- Future considerations: Theme system analysis, BYOAI feasibility, community marketplace options, local AI considerations

---

## Document Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCT DOC                                  │
│                 (Vision & Framework)                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────┐  ┌───────────┐  ┌─────────────────────────────┐
│  ROADMAP  │  │DATA MODEL │  │     STRATEGIC DOCS          │
│  (Plan)   │  │(Structure)│  │  ┌───────────────────────┐  │
└─────┬─────┘  └─────┬─────┘  │  │ FUTURE_CONSIDERATIONS │  │
      │              │        │  └───────────────────────┘  │
      │              │        │  ┌───────────────────────┐  │
      │              │        │  │ ARCHITECTURE_EVOLUTION│  │
      │              │        │  │ _GUIDE                │  │
      │              │        │  └───────────────────────┘  │
      │              │        └─────────────────────────────┘
      ▼              ▼
┌─────────────────────────────────────────┐
│      IMPLEMENTATION DOCS                │
│  ┌─────────────┐ ┌───────────────┐      │
│  │CLAUDE_CODE_ │ │ FOCUS_MODE_   │      │
│  │CONTEXT_v2   │ │ PROMPTS       │      │
│  └─────────────┘ └───────────────┘      │
│  ┌─────────────┐ ┌───────────────┐      │
│  │MULTI_TASK_  │ │IMPLEMENTATION │      │
│  │PROMPTS      │ │_CHECKLIST     │      │
│  └─────────────┘ └───────────────┘      │
└─────────────────────────────────────────┘
```

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Stable | Core document, infrequently updated |
| ✅ Active | Living document, regularly updated |
| 📋 Ready | Implementation prompts, use as-is |
| 📚 Archive | Reference/historical, rarely updated |
| 🚧 Draft | Work in progress |

---

## File Locations

**Project documentation (this repo):**
```
focus-tools/
├── resources/                              ← All documentation lives here
│   ├── DOCUMENTATION_INDEX.md              ← You are here
│   │
│   ├── # Product & Vision
│   ├── focus-tools-product-doc.md
│   │
│   ├── # Planning & Tracking
│   ├── focus-tools-roadmap.md
│   ├── IMPLEMENTATION_CHECKLIST.md
│   ├── ASSESSMENT_AND_GAPS.md
│   │
│   ├── # Technical Reference
│   ├── FOCUS_TOOLS_DATA_MODEL.md
│   ├── AI_UI_COMMUNICATION_PATTERNS.md
│   │
│   ├── # Implementation (Claude Code)
│   ├── CLAUDE_CODE_CONTEXT_v3.md           ← Reference copy
│   ├── FOCUS_MODE_PROMPTS.md               ← Complete
│   ├── MULTI_TASK_PROMPTS.md               ← Complete
│   ├── AI_MINIBAR_PROTOTYPE_PLAN.md        ← Complete
│   ├── AI_MINIBAR_INTEGRATION_PROMPTS.md   ← Complete
│   │
│   ├── # Strategic & Future
│   ├── ARCHITECTURE_EVOLUTION_GUIDE.md
│   ├── FUTURE_CONSIDERATIONS.md
│   ├── UI_CONCEPTS_EXPLORED.md
│   │
│   └── archive/                            ← Legacy/archived docs
│       ├── CLAUDE_CODE_CONTEXT.md          ← v1 (archived)
│       └── CLAUDE_CODE_CONTEXT_v2.md       ← v2 (archived)
│
├── prototypes/task-copilot/
│   └── CLAUDE.md                           ← **CANONICAL** working context
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
| 2026-01-14 | Archived CLAUDE_CODE_CONTEXT v1/v2; marked implementation prompts complete; established task-copilot/CLAUDE.md as canonical |
| 2026-01 | Fixed file paths (`docs/` → `resources/`), added ASSESSMENT_AND_GAPS.md, AI_MINIBAR docs, updated CLAUDE_CODE_CONTEXT versioning |
| 2025-01 | Added ARCHITECTURE_EVOLUTION_GUIDE.md to Strategic section |
| 2024-12-31 | Initial index created with full document catalog |
