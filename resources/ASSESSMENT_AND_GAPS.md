# Focus Tools — Assessment & Gap Analysis

> **Status:** Living Document  
> **Created:** January 2025  
> **Last Updated:** January 2025  
> **Purpose:** Track implementation progress against functional framework, assess user-type fit, and prioritize opportunities

---

## 1. Executive Summary

### Current State

| Dimension | Score | Summary |
|-----------|-------|---------|
| **Admin Domain** | 40% | Structure/breakdown strong; Remind, Proactive AI missing |
| **Execution Domain** | 75% | Inertia, Focus, Roadblocks strong; Reflect, Context Switch weak |
| **Cross-Cutting AI** | 20% | Health computation exists; all proactive behaviors missing |
| **ADHD Fit** | Good | Strong execution support; risky without external prompts |
| **AuDHD Fit** | Strong | Predictable structure; missing routine/recurring support |
| **Neurotypical Fit** | Weak | Overbuilt (don't need body double) and underbuilt (no sync/reminders) |

### Key Insight

**The app is strong at execution, weak at admin.** This reflects POC focus on Focus Mode. For sustainable daily use, admin gaps (especially Remind and proactive AI) become critical friction points.

### Bottom Line

The app is a solid execution companion but not yet a complete task management system. For testing phase, this is acceptable—validating the unique value (AI body double, breakdown assistance). Admin gaps become critical only when transitioning to primary system.

---

## 2. Functional Framework Gap Analysis

### 2.1 Admin Domain (Executive Assistant)

| Need | User Action (per framework) | AI Role (per framework) | Status | Implementation Notes | Gap/Opportunity |
|------|----------------------------|------------------------|--------|---------------------|-----------------|
| **Capture** | Quick-add tasks (text, voice, image, email) | Refine tasks; Parse intent | ⚠️ Partial | QuickCapture component (text only) | Voice/image/email ❌. AI doesn't refine on capture. |
| **Triage** | Process inbox: define, do, delegate, defer, delete | Recommend categories + priority; Flag duplicates | ⚠️ Partial | InboxView, InboxItem, defer/delete actions | Proactive recommendations ❌. Duplicate detection ❌. Delegate ❌. |
| **Structure** | Manually add subtasks, details, metadata | Recommend breakdown; Apply tags | ✅ Strong | AI breakdown, steps/substeps, projects, time estimates | Well-covered. Could add tag system beyond projects. |
| **Plan / Prioritize** | Sort + prioritize; Plan for day/week/month/quarter | Recommend prioritization; Flag conflicts; Prompt rebalancing | ⚠️ Partial | Focus queue with horizons, focus score sorting | AI recommendations ❌. Conflict detection ❌. Rebalancing prompts ❌. |
| **Remind** | Manually set alarms / reminders | Proactive time-based reminders | ❌ Missing | Deadlines stored but not enforced | No notification system. Critical gap for ADHD. |
| **Recall** | Ask about status / forgotten tasks | Surface relevant tasks; Detect stale items | ⚠️ Weak | SearchView exists, Resurfaced section (deferred only) | Natural language recall ❌. Proactive stale surfacing ❌. |

### 2.2 Execution Domain (Body Double)

| Need | User Action (per framework) | AI Role (per framework) | Status | Implementation Notes | Gap/Opportunity |
|------|----------------------------|------------------------|--------|---------------------|-----------------|
| **Overcome Inertia** | Work on clearly defined, bite-sized steps | Recommend steps to start | ✅ Strong | AI breakdown, `suggest_first_action` tool, step-by-step focus mode | Core strength of the app. |
| **Maintain Focus** | Work towards check-in with body double | Check-in / Accountability | ✅ Strong | FocusModeView with timer, AI available throughout, step completion flow | Well-implemented. |
| **Overcome Roadblocks** | Split or simplify task; Ask for help | Recommend next steps; Provide info | ✅ Strong | StuckMenu with 4 options, `break_down_step` tool, `explain_step` tool | Well-implemented. |
| **Switch Context** | Pause + switch tasks | Bookmark progress + summarize state; Suggest return | ⚠️ Weak | Can exit focus mode, progress persists in localStorage | No summary/bookmark ❌. No return suggestions ❌. |
| **Complete Step** | Mark done; Add notes | Acknowledge; Prompt next step; Celebrate win | ✅ Good | Checkboxes, auto-advance, celebration screen, NotesModule | AI acknowledgment could be warmer. |
| **Reflect** | Retros for project; Document learnings | Summarize journey; Surface insights; Celebrate wins | ❌ Missing | Only "completed today" count exists | No retrospectives. No journey view. No insights. |

### 2.3 Cross-Cutting Capabilities

| Capability | Status | Current Implementation | Gap |
|------------|--------|----------------------|-----|
| **Pattern Recognition** | ❌ Missing | None | No task grouping suggestions, no relationship detection |
| **Conflict Detection** | ❌ Missing | None | No deadline clustering warnings, no overcommitment alerts |
| **Drift Detection** | ⚠️ Partial | `healthStatus` computed in utils.ts | Computed but not surfaced proactively to user |
| **Intent Parsing** | ⚠️ Minimal | AI available but not prompted on capture | Could auto-trigger breakdown suggestion for vague tasks |
| **Progress Synthesis** | ⚠️ Basic | Step counts in UI, "completed today" | No cross-task synthesis, no weekly/monthly rollups |

### 2.4 AI Proactivity Model

| Level | Defined Behavior | Implementation Status |
|-------|-----------------|----------------------|
| **Silent** | Logs observations, no interruption | ⚠️ Partial — health computed but not logged/used |
| **Ambient** | Subtle visual indicator (e.g., badge) | ⚠️ Partial — inbox count badge only |
| **Nudge** | Gentle prompt, dismissible | ❌ Missing — Nudge types defined but not implemented |
| **Interrupt** | Demands attention (modal) | ❌ Missing — No notification/interrupt system |

---

## 3. User Type Assessment

### 3.1 ADHD Users

| ADHD Need | How App Addresses | Status | Gap/Opportunity |
|-----------|-------------------|--------|-----------------|
| **Working memory support** | Quick capture, externalization to inbox | ✅ Good | Voice capture would reduce friction further |
| **Task initiation** | AI breakdown, first step suggestion, focus mode | ✅ Strong | Core strength — this is the differentiator |
| **Time blindness** | Timer in focus mode, deadlines visible in UI | ⚠️ Partial | No proactive reminders = dangerous gap |
| **Prioritization paralysis** | Focus queue with horizons, focus score sorting | ⚠️ Partial | AI should proactively recommend what to do next |
| **Dopamine/motivation** | Celebration screen, completion count | ⚠️ Partial | Streaks, progress visualization, achievements missing |
| **Hyperfocus management** | Timer visible during focus mode | ⚠️ Weak | No "you've been working 2 hours" nudge |
| **Object permanence** | Resurfaced section for deferred tasks | ⚠️ Partial | Need proactive "you forgot about X" surfacing |

**Overall ADHD Verdict:** Good for execution phase. Risky as sole system because no external prompting to return to app. The reminder gap is critical—ADHD users need the app to reach out to them, not rely on them remembering to open it.

### 3.2 AuDHD Users (Autism + ADHD)

| AuDHD-Specific Need | How App Addresses | Status | Gap/Opportunity |
|--------------------|-------------------|--------|-----------------|
| **Predictability** | Consistent Model E structure, clear workflow | ✅ Strong | Navigation is predictable and learnable |
| **Sensory considerations** | Dark mode, minimal UI, no animations | ✅ Good | No sound/haptic options, no reduced motion toggle |
| **Routine support** | Horizons (today/week), projects | ⚠️ Weak | No recurring tasks, no routine builder |
| **Transition difficulty** | Focus mode is immersive | ⚠️ Partial | Exit is abrupt; no transition ritual or wind-down |
| **Detail orientation** | Substeps, notes, metadata fields | ✅ Strong | Good fit for detail-oriented users |
| **Need for completion** | Step-by-step checkboxes, visual progress | ✅ Strong | Satisfies completion drive well |
| **Overwhelm prevention** | One step at a time in focus mode | ✅ Good | Inbox can pile up without prompts though |
| **Special interest support** | Projects with colors | ⚠️ Partial | Could add more categorization/tagging depth |

**Overall AuDHD Verdict:** Better than average. The structured, predictable workflow aligns well with autistic preferences. Main risks: no routine/recurring task support, abrupt focus mode exits.

### 3.3 Neurotypical Users

| NT Expectation | How App Addresses | Status | Gap/Opportunity |
|----------------|-------------------|--------|-----------------|
| **Quick capture → done** | QuickCapture, streamlined flow | ✅ Good | Competitive with Todoist/Things for basic capture |
| **Calendar integration** | None | ❌ Missing | Major gap — NT users expect calendar sync |
| **Reminders/notifications** | None | ❌ Missing | Expected baseline feature |
| **Collaboration** | None | ❌ Missing | "Delegate" need completely unaddressed |
| **Multi-platform sync** | localStorage only | ❌ Missing | Expected for any serious daily use |
| **Keyboard shortcuts** | None | ❌ Missing | Power users expect this |
| **Speed** | Quick capture works, AI has latency | ⚠️ Mixed | NT users may find AI interactions slow |
| **Simplicity** | More complex than Apple Reminders | ⚠️ Mixed | NT users may want less, not more |

**Overall NT Verdict:** Neurotypical users would likely find this overbuilt for their needs (they don't need body double functionality) or underbuilt for their expectations (no sync, no reminders, no calendar). The value proposition is significantly weaker for this group—they're not the target user.

---

## 4. Opportunity Prioritization

### 4.1 High Impact, Low Effort (Do First)

| # | Opportunity | Impact | Effort | Rationale |
|---|-------------|--------|--------|-----------|
| 1 | **Export/Import JSON** | Medium | Low | Safety net for testing; builds user trust; enables recovery |
| 2 | **"What should I do?" AI button** | High | Low | Button in Focus view → AI recommends from queue based on context. Tests core AI value. |
| 3 | **Surface health status** | Medium | Low | Already computed; add visual indicator for at-risk/critical tasks |
| 4 | **Basic PWA notification** | High | Medium | Daily "don't forget me" reminder. PWA supports notifications. |

### 4.2 High Impact, Medium Effort (Testing Phase or Soon After)

| # | Opportunity | Impact | Effort | Rationale |
|---|-------------|--------|--------|-----------|
| 5 | **Proactive stale task nudge** | High | Medium | Use existing health status; surface in ambient UI element |
| 6 | **Recurring tasks** | High | Medium | Critical for routines (AuDHD), daily habits (ADHD) |
| 7 | **Reflection/journey view** | Medium | Medium | "What did I accomplish this week?" — motivational feedback loop |
| 8 | **Voice capture** | Medium | Medium | Web Speech API or Whisper; reduces capture friction significantly |

### 4.3 High Impact, High Effort (Post-Testing)

| # | Opportunity | Impact | Effort | Rationale |
|---|-------------|--------|--------|-----------|
| 9 | **Calendar view/integration** | High | High | NT expectation; helps time-blind users visualize commitments |
| 10 | **Supabase sync** | High | High | Multi-device, data persistence; wait until after UX validation |
| 11 | **Context switch bookmarking** | Medium | Medium | AI summarizes state on pause, suggests return later |

### 4.4 Lower Priority (Defer)

| Opportunity | Reason to Defer |
|-------------|-----------------|
| Collaboration/delegate | Personal tool first; adds significant complexity |
| Image/email capture | Niche use case; voice capture is higher value |
| Achievements/gamification | Nice-to-have; not blocking core workflow |
| Keyboard shortcuts | Power user feature; mobile-first for testing |

---

## 5. Testing Phase Recommendations

### 5.1 Add Before 2-Week Testing

| Priority | Feature | Why |
|----------|---------|-----|
| **P0** | Export/Import JSON | Data safety net—critical for trust |
| **P1** | "What should I do?" button | Tests AI recommendation value prop |
| **P2** | Basic daily notification | Addresses ADHD "out of sight, out of mind" risk |

### 5.2 Observe During Testing

| Observation | What It Tells Us |
|-------------|------------------|
| How often do you open the app unprompted? | Need for notification/reminder system |
| Do you use AI breakdown? How often? | Core value validation |
| Do tasks pile up in inbox? | Need for triage nudges |
| Do you complete focus sessions? | Focus mode UX validation |
| What makes you abandon a session? | Roadblock/friction identification |
| Do you wish you could do X? | Feature gap discovery |

### 5.3 Defer to Post-Testing

| Feature | Rationale |
|---------|-----------|
| Recurring tasks | Adds data model complexity; test core loop first |
| Supabase backend | Validate UX before investing in infrastructure |
| Calendar integration | Major feature; test without it first |
| Voice capture | API integration complexity; test text capture first |

---

## 6. Progress Tracking

### 6.1 Implementation Status by Framework Need

#### Admin Domain

| Need | Status | Last Updated | Notes |
|------|--------|--------------|-------|
| Capture | ⚠️ Partial | Jan 2025 | Text only |
| Triage | ⚠️ Partial | Jan 2025 | Manual UI, no AI recommendations |
| Structure | ✅ Strong | Jan 2025 | Core strength |
| Plan/Prioritize | ⚠️ Partial | Jan 2025 | Manual queue, no AI recommendations |
| Remind | ❌ Missing | Jan 2025 | Critical gap |
| Recall | ⚠️ Weak | Jan 2025 | Search only |

#### Execution Domain

| Need | Status | Last Updated | Notes |
|------|--------|--------------|-------|
| Overcome Inertia | ✅ Strong | Jan 2025 | Core strength |
| Maintain Focus | ✅ Strong | Jan 2025 | Well-implemented |
| Overcome Roadblocks | ✅ Strong | Jan 2025 | StuckMenu, AI tools |
| Switch Context | ⚠️ Weak | Jan 2025 | No bookmark/summary |
| Complete Step | ✅ Good | Jan 2025 | Celebration exists |
| Reflect | ❌ Missing | Jan 2025 | No retrospective features |

### 6.2 Opportunity Implementation Log

| # | Opportunity | Status | Date Completed | Notes |
|---|-------------|--------|----------------|-------|
| 1 | Export/Import JSON | ⬜ Not Started | — | — |
| 2 | "What should I do?" button | ⬜ Not Started | — | — |
| 3 | Surface health status | ⬜ Not Started | — | — |
| 4 | Basic PWA notification | ⬜ Not Started | — | — |
| 5 | Proactive stale nudge | ⬜ Not Started | — | — |
| 6 | Recurring tasks | ⬜ Not Started | — | — |
| 7 | Reflection/journey view | ⬜ Not Started | — | — |
| 8 | Voice capture | ⬜ Not Started | — | — |

---

## 7. Revision History

| Date | Changes |
|------|---------|
| Jan 2025 | Initial assessment created from Claude conversation analysis |

---

## Appendix A: Framework Reference

Source: `focus-tools-product-doc.md` Section 3

### Admin Domain (Executive Assistant)

| Need | User Action | AI Role |
|------|-------------|---------|
| Capture | Quick-add tasks (text, voice, image, email) | Refine tasks; Parse intent |
| Triage | Process inbox: define, do, delegate, defer, delete | Recommend categories + priority; Flag duplicates |
| Structure | Manually add subtasks, details, metadata | Recommend breakdown; Apply tags |
| Plan / Prioritize | Sort + prioritize; Plan for day, week, month, quarter | Recommend prioritization; Flag conflicts; Prompt rebalancing |
| Remind | Manually set alarms / reminders | Proactive time-based reminders |
| Recall | Ask about status / forgotten tasks | Surface relevant tasks; Detect stale items |

### Execution Domain (Body Double)

| Need | User Action | AI Role |
|------|-------------|---------|
| Overcome Inertia | Work on clearly defined, bite-sized steps | Recommend steps to start |
| Maintain Focus | Work towards check-in with body double | Check-in / Accountability |
| Overcome Roadblocks | Split or simplify task; Ask for help | Recommend next steps; Provide info |
| Switch Context | Pause + switch tasks | Bookmark progress + summarize state; Suggest return |
| Complete Step | Mark done; Add notes | Acknowledge; Prompt next step; Celebrate win |
| Reflect | Retros for project; Document learnings | Summarize journey; Surface insights; Celebrate wins |

---

## Appendix B: Related Documents

| Document | Relevance |
|----------|-----------|
| `focus-tools-product-doc.md` | Source framework, vision, design decisions |
| `IMPLEMENTATION_CHECKLIST.md` | Current implementation status |
| `CLAUDE.md` | Technical context, file structure |
| `DOCUMENTATION_INDEX.md` | Master index of all docs |
| `FUTURE_CONSIDERATIONS.md` | Speculative features, strategic options |
