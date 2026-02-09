# Session Lifecycle

> **Purpose:** Step-by-step workflow for each coding session
> **Audience:** You + Claude Code
> **Key principle:** Documentation updates are part of the work, not a follow-up task

---

## The 7 Steps

### 1. Pre-Session

Orient before writing code.

- [ ] **Run tests** — `npm run test:run` to verify baseline
- [ ] **Check sprint table** — `CLAUDE.md` → identify current priorities (P0 → P1 → P2)
- [ ] **Read feature docs** — `docs/features/{feature}/` for SPEC, tracker, or "Next Session" notes
- [ ] **Check patterns** — `docs/PRINCIPLES.md` for conventions
- [ ] **Read "Next Session" note** — if one exists in the feature tracker, follow it

If starting a new feature, check if `docs/features/{feature}/` exists. If not, ask: "Should I create a feature folder with SPEC.md?"

### 2. Planning

Design the approach before implementing.

- Enter **plan mode** for non-trivial work (3+ files, architectural decisions, multiple approaches)
- Explore codebase, design approach, write plan file
- Exit plan mode → user approves
- If requirements are unclear → **ask before planning**, not after
- Skip this step only for single-file fixes, typos, or trivially scoped changes

### 3. Implementation

Execute the plan.

- Work through the plan systematically
- **Build check** after each batch of changes (`npm run build`)
- Fix issues immediately — don't defer bugs or gaps to later
- When uncertain, prompt the user rather than assume

**Testing during development:**

| When modifying... | Run... |
|-------------------|--------|
| `lib/storage*.ts` or `lib/indexeddb.ts` | `npm test -- lib/storage.test.ts` |
| `lib/priority.ts` | `npm test -- lib/priority.vitest.ts` |
| `lib/queue-reorder.ts` | `npm test -- lib/queue-reorder.vitest.ts` |
| Any significant change | `npm run test:run` proactively |

### 4. Post-Implementation

Verify the work is complete and correct.

- [ ] **Build** — `npm run build` passes
- [ ] **Tests** — `npm run test:run` passes (write regression tests for bug fixes)
- [ ] **Audit** — grep/search to confirm changes did what they claim (e.g., zero remaining raw colors)
- [ ] **No deferred gaps** — if you find something you skipped, fix it now

### 5. Documentation Updates

Update docs as part of the work, not separately.

| When you... | Update... |
|-------------|-----------|
| Complete a sprint item | Sprint table in `CLAUDE.md` (mark ✅), add to Recent Completions |
| Complete a feature phase | `docs/features/{feature}/` tracker or IMPLEMENTATION.md |
| Change infra phase status | `docs/ROADMAP.md`, `docs/features/INDEX.md` |
| Add/change TypeScript interfaces | `docs/DATA_MODEL.md` |
| Add/change handlers in page.tsx | Handler Reference in `CLAUDE.md` |
| Establish a new pattern | `docs/PRINCIPLES.md` |
| Add new files/folders | File Structure in `CLAUDE.md` |

**Proactive checks:**
- [ ] Sprint table current?
- [ ] Recent Completions updated? (bump version for new capabilities)
- [ ] Feature docs reflect reality?
- [ ] Revision History entry added?
- [ ] CLAUDE.md under 250 lines? (archive old entries to `docs/archive/`)

### 6. Wrap-up & Handoff

Prepare context for the next session — so it can self-orient without re-prompting.

- [ ] **Recap** — summarize what was done, what was deferred, any open issues
- [ ] **Align** — confirm next steps with the user (priorities, preferences, concerns)
- [ ] **Seed next session** — write a "Next Session" note in the feature tracker:

```markdown
## Next Session
- **What:** [session number / title]
- **Context:** [1-2 sentences on current state]
- **Open questions:** [anything unresolved]
- **Key files:** [starting points]
```

- [ ] **Commit** — one logical commit per session/batch (docs included)

### 7. Clear Context

Start the next session fresh. The "Next Session" note + updated docs are the handoff.

---

## What Belongs Where

| Content Type | Location | Example |
|--------------|----------|---------|
| Current priorities | `CLAUDE.md` sprint table | P1 items |
| Recent work (last 2 weeks) | `CLAUDE.md` Recent Completions | v44 entry |
| Feature specs & requirements | `docs/features/{feature}/SPEC.md` | Behavior rules |
| Implementation details | `docs/features/{feature}/IMPLEMENTATION.md` | Architecture |
| Progress tracking | `docs/features/{feature}/` tracker | Session checklist |
| Next session handoff | Feature tracker "Next Session" section | What to do next |
| TypeScript interfaces | `docs/DATA_MODEL.md` | Task, Step types |
| Design conventions | `docs/PRINCIPLES.md` | Icon/emoji rules |
| Architecture decisions | `docs/ARCHITECTURE_EVOLUTION_GUIDE.md` | Phase sequencing |
| Development timeline | `docs/ROADMAP.md` | Infra phases |
| Ideas & concepts | `docs/concepts/` | Future features |
| Old history | `docs/archive/` | Revision history > 10 entries |

## Version Numbering

- Bug fix or refinement → same version (v29 → v29)
- New capability or significant change → bump version (v29 → v30)

## When to Prompt the User

| Situation | Action |
|-----------|--------|
| User shares idea/concept | Ask: "Capture in concepts/ or ROADMAP.md?" |
| User says "later" or "eventually" | Ask: "Add to ROADMAP.md as planned item?" |
| Planning discussion concludes | Ask: "Create feature folder with SPEC.md?" |
| Requirements unclear | Ask before implementing |
| Multiple valid approaches | Present options, ask user preference |
| Work affects data model | Confirm: "Update DATA_MODEL.md?" |
| New pattern established | Confirm: "Add to PRINCIPLES.md?" |
| Feature phase complete | Remind: "Update IMPLEMENTATION.md and ROADMAP.md?" |
| Session ending with changes | Remind: "Ready for wrap-up & handoff?" |

---

## Planning vs. Ideation

Not all discussions lead to immediate implementation.

| Discussion type | Where to capture |
|-----------------|------------------|
| Fleshing out an idea | `docs/concepts/` or new feature folder |
| "I want to eventually..." | `docs/ROADMAP.md` (Planned/Long-term) |
| Exploring approaches | `docs/concepts/` or feature's SPEC.md |
| Decision made for later | `docs/ROADMAP.md` or feature folder |

**If user is unsure:** Default to `docs/concepts/FUTURE_CONSIDERATIONS.md` with a dated entry.
