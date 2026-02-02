# Focus Tools Documentation

> Quick guide to understanding and contributing to this project.

**Last Updated:** January 2026

---

## Start Here

| If you're... | Start with |
|--------------|------------|
| **New to the project** | [VISION.md](./VISION.md) — What we're building and why |
| **Understanding the codebase** | [CLAUDE.md](../prototypes/task-copilot/CLAUDE.md) — Current sprint context |
| **Working on a feature** | [features/INDEX.md](./features/INDEX.md) — Feature catalog |
| **Making design decisions** | [PRINCIPLES.md](./PRINCIPLES.md) — Guidelines and conventions |
| **Checking progress** | [ROADMAP.md](./ROADMAP.md) — What's done and what's next |
| **Writing/running tests** | [guides/TESTING.md](./guides/TESTING.md) — Testing best practices |

---

## Documentation Map

```
docs/
├── README.md          ← You are here (entry point)
├── VISION.md          ← Product vision, target users, core concepts
├── PRINCIPLES.md      ← Design principles, UX philosophy, technical conventions
├── ROADMAP.md         ← Completed phases, current sprint, future plans
├── DECISIONS.md       ← Technical decision log
├── DATA_MODEL.md      ← Canonical data structures
│
├── features/          ← Feature documentation
│   ├── INDEX.md       ← Feature catalog with status
│   ├── indexeddb-migration/
│   ├── test-harnesses/
│   ├── recurring-tasks/
│   ├── notifications/
│   └── nudge-system/
│
├── guides/            ← Process & workflow guides
│   ├── README.md      ← Guide index
│   └── TESTING.md     ← When/how to use tests
│
├── concepts/          ← Exploration & ideation
│   └── ...
│
└── archive/           ← Historical documents
    ├── INDEX.md       ← Archive guide
    └── ...
```

---

## Quick Reference

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| [VISION.md](./VISION.md) | Goals, users, core concepts | Rarely (stable) |
| [PRINCIPLES.md](./PRINCIPLES.md) | How we build things | Occasionally |
| [ROADMAP.md](./ROADMAP.md) | Progress and plans | Weekly |
| [features/INDEX.md](./features/INDEX.md) | Feature status | Per feature |
| [guides/](./guides/) | Process & workflow | As needed |
| [CLAUDE.md](../prototypes/task-copilot/CLAUDE.md) | Sprint context | Daily/per session |

---

## Key Concepts

**Two Operational Domains:**
- **Admin** — Organizing, planning, structuring (Executive Assistant persona)
- **Execution** — Focusing, completing, progressing (Body Double persona)

**Workflow Model:**
```
INBOX → POOL → FOCUS QUEUE → COMPLETED
```

**AI Proactivity Levels:**
1. Silent → Ambient → Nudge → Interrupt

See [VISION.md](./VISION.md) for full details.

---

## For Claude Code Sessions

The canonical working context is [`prototypes/task-copilot/CLAUDE.md`](../prototypes/task-copilot/CLAUDE.md). This file is auto-read at the start of each session and contains:

- Current sprint priorities
- Recent completion history
- Active work context

For stable reference (data models, principles), use the docs in this folder instead.

---

## Documentation Workflow

### Starting New Work

1. Check `CLAUDE.md` for current sprint priorities
2. Review relevant feature folder (`docs/features/{feature}/`)
3. If new feature: create folder with README.md, SPEC.md, optionally PROMPTS.md

### During Development

| Action | Update |
|--------|--------|
| Making architectural decisions | Add to `PRINCIPLES.md` or feature SPEC |
| Changing data structures | Update `docs/DATA_MODEL.md` |
| Discovering new patterns | Note in feature's `IMPLEMENTATION.md` |

### After Completing Work

| Completed | Do This |
|-----------|---------|
| **Sprint item** | Update `CLAUDE.md`: add to Recent Completions, mark ✅ in sprint table |
| **Feature phase** | Update feature's `IMPLEMENTATION.md`, update `ROADMAP.md` status |
| **Entire feature** | Move PROGRESS.md → `archive/`, keep PROMPTS.md in place |
| **Major release** | Trim CLAUDE.md, archive old history |

### Maintaining CLAUDE.md

**Target:** ~200 lines (currently working context only)

| If CLAUDE.md has... | Move to... |
|---------------------|------------|
| TypeScript interfaces | `docs/DATA_MODEL.md` |
| Design patterns/conventions | `docs/PRINCIPLES.md` |
| Feature implementation details | `docs/features/{feature}/IMPLEMENTATION.md` |
| Old completion history (>2 weeks) | `docs/archive/` or just delete |

### What Gets Archived vs. Kept

| Document Type | Location | Archive? |
|---------------|----------|----------|
| SPEC.md | Feature folder | No — permanent reference |
| DATA_MODEL.md | Feature folder | No — permanent reference |
| IMPLEMENTATION.md | Feature folder | No — permanent reference |
| PROMPTS.md | Feature folder | No — reusable template |
| PROGRESS.md | Archive | Yes — after feature complete |
| Old CLAUDE.md versions | Archive | Yes — for historical context |

---

## Contributing

1. **Feature docs** go in `docs/features/[feature-name]/`
2. **Progress tracking** gets archived after feature completion
3. **Prompts** stay in feature folders as reusable templates
4. **Decisions** should be logged in `DECISIONS.md` or feature-specific docs
