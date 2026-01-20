# Recurring Tasks - Documentation Index

## Overview

Complete documentation set for implementing recurring tasks (called "Routines" in UI) for Focus Tools. This feature enables ADHD-friendly habit tracking with spatial organization, streak gamification, and flexible scheduling.

**Total Implementation Time:** 5-6 days  
**Schema Version:** 9 (from v8)  
**Estimated Storage:** ~500KB/year for typical user

---

## Document Guide

### 1. RECURRING_TASKS_OVERVIEW.md
**Purpose:** Product specification and user-facing features  
**Audience:** Product, Design, Development  
**Read First:** Yes

**Contents:**
- Executive summary and design principles
- All user-facing features (gallery, management tab, detail, history)
- Terminology decisions
- Core user flows
- Key behaviors (instance lifecycle, template snapshot, streaks)
- Visual design specs
- ADHD-specific considerations
- Success metrics

**Use This For:**
- Understanding what we're building
- Design decisions and rationale
- User experience patterns
- Feature prioritization

---

### 2. RECURRING_TASKS_DATA_MODEL.md
**Purpose:** Complete data structures with rationale  
**Audience:** Development  
**Dependencies:** None

**Contents:**
- RecurrenceRule interface (all fields)
- RecurringInstance interface (snapshot approach)
- Task extensions (recurring fields)
- Template → Instance relationships
- Storage strategy and pruning
- Schema migration (v8 → v9)
- Example data for all patterns
- Data invariants and edge cases

**Use This For:**
- Understanding data structures
- Database schema design
- Storage optimization
- Migration planning

---

### 3. RECURRING_TASKS_IMPLEMENTATION_PLAN.md
**Purpose:** Development roadmap and execution plan  
**Audience:** Development  
**Dependencies:** Data Model, Overview

**Contents:**
- File structure (new files, updates)
- 6 implementation phases with tasks and validation
- Schema migration strategy
- Post-implementation checklist
- Risk mitigation
- Rollout strategy
- Success criteria

**Use This For:**
- Project planning
- Sprint organization
- Progress tracking
- Risk management

---

### 4. RECURRING_TASKS_CLAUDE_CODE_PROMPTS.md
**Purpose:** Ready-to-use prompts for Claude Code  
**Audience:** Development  
**Dependencies:** All above documents

**Contents:**
- 6 phase-specific prompts (copy-paste ready)
- Phase 1: Data Model & Core Utilities
- Phase 2: Routines Gallery & Focus Queue
- Phase 3: Routines Management Tab
- Phase 4a: Task Detail Structure
- Phase 4b: Pattern Configuration
- Phase 5: History Modal
- Phase 6: Polish & Edge Cases
- Validation steps after each phase
- Troubleshooting guide

**Use This For:**
- Implementation execution
- Working with Claude Code
- Incremental development
- Validation between phases

---

### 5. RECURRING_TASKS_TESTING.md
**Purpose:** Comprehensive testing strategy  
**Audience:** Development, QA  
**Dependencies:** Data Model, Implementation Plan

**Contents:**
- Unit tests (pattern matching, streaks, instances)
- Integration tests (completion flows)
- Manual test checklists (all features)
- Regression testing (existing features)
- Performance benchmarks
- Accessibility testing
- Browser compatibility

**Use This For:**
- Test planning
- Quality assurance
- Performance validation
- Bug prevention

---

### 6. RECURRING_TASKS_FUTURE_ENHANCEMENTS.md
**Purpose:** Planned improvements and considerations  
**Audience:** Product, Development  
**Dependencies:** Overview

**Contents:**
- High priority (v2): Calendar integration, bulk ops, statistics
- Medium priority (v3): Advanced patterns, templates, sync
- Low priority: Gamification, social, voice
- Explicitly not planned (with rationale)
- Research topics
- Decision log

**Use This For:**
- Roadmap planning
- Feature prioritization
- User feedback tracking
- Long-term vision

---

## Quick Start Guide

### For Product/Design
1. Read: `RECURRING_TASKS_OVERVIEW.md`
2. Review: UI mockups and flows
3. Validate: ADHD-specific considerations
4. Plan: Success metrics

### For Development
1. Read: `RECURRING_TASKS_OVERVIEW.md` (product context)
2. Study: `RECURRING_TASKS_DATA_MODEL.md` (data structures)
3. Plan: `RECURRING_TASKS_IMPLEMENTATION_PLAN.md` (phases)
4. Execute: `RECURRING_TASKS_CLAUDE_CODE_PROMPTS.md` (implementation)
5. Test: `RECURRING_TASKS_TESTING.md` (validation)

### For Implementation
**Day 1:**
- Execute Phase 1 prompt (Data Model)
- Validate: TypeScript compiles, tests pass

**Day 2:**
- Execute Phase 2 prompt (Gallery)
- Execute Phase 3 prompt (Management)
- Validate: UI renders, interactions work

**Day 3:**
- Execute Phase 4a prompt (Detail Structure)
- Execute Phase 4b prompt (Pattern Config)
- Validate: Pattern configuration works

**Day 4:**
- Execute Phase 5 prompt (History)
- Validate: Calendar displays, retroactive works

**Day 5:**
- Execute Phase 6 prompt (Polish)
- Run full test checklist
- Fix bugs

**Day 6:**
- Final validation
- Performance testing
- Documentation update

---

## Key Concepts

### Template Snapshot Approach
Past instances store full copy of template steps with new IDs. Template changes only affect future instances. This ensures historical accuracy.

**Why?**
- Handles template edits cleanly
- Handles template deletions without breaking history
- Accurate completion counts

### Instance Lifecycle
1. **Creation:** On-demand when user interacts (not pre-generated)
2. **Active:** Today if due, or next due date if future
3. **Completion:** All steps done → mark complete, update streak
4. **History:** Locked after period ends, pruned after 90 days

### Streak Calculation
- Consecutive completions from today backward
- Breaks on missed occurrence (unless skipped)
- Respects pattern (only counts expected dates)
- Day-start time aware (default 5am)

### Day-Start Time
Completion at 12:15 AM (before 5am) counts for previous day. Helps night owls and irregular schedules (ADHD-friendly).

---

## Design Decisions

### Why "Routines" not "Habits"?
- Less loaded term
- Broader scope (includes appointments, chores)
- Less judgment/shame for breaks

### Why Separate Gallery?
- Spatial consistency (dedicated location)
- Visual differentiation from one-off tasks
- Reduces cognitive load

### Why Rollover Toggle?
- Different needs: must-do (meds) vs nice-to-have (journal)
- User control over guilt/pressure
- Flexibility for ADHD users

### Why Additional Steps Reset?
- Each occurrence is fresh start
- Reduces clutter
- Allows adaptation to daily needs

---

## Common Patterns

### Daily Medication
```typescript
{
  frequency: 'daily',
  interval: 1,
  time: '08:00',
  rolloverIfMissed: true // Must complete
}
```

### Therapy (Thursdays)
```typescript
{
  frequency: 'weekly',
  interval: 1,
  daysOfWeek: [4],
  time: '14:00',
  rolloverIfMissed: false
}
```

### Monthly Bill (1st)
```typescript
{
  frequency: 'monthly',
  interval: 1,
  dayOfMonth: 1,
  time: '09:00',
  rolloverIfMissed: true
}
```

### Team Retro (First Monday)
```typescript
{
  frequency: 'weekly',
  interval: 1,
  daysOfWeek: [1],
  weekOfMonth: 1,
  time: '10:00',
  rolloverIfMissed: false
}
```

---

## Troubleshooting

### Pattern Not Matching
- Check: startDate passed to dateMatchesPattern
- Check: interval calculation (day difference % interval)
- Check: daysOfWeek indexing (0=Sunday)

### Streak Wrong
- Check: dayStartHour consistent across calls
- Check: getPreviousOccurrence for pattern
- Check: skipped instances don't break

### Template Affecting Past
- Check: createInstance clones with new IDs
- Check: past instances never modified
- Check: rendering uses instance.routineSteps

### Storage Growing
- Check: pruning called after completion
- Check: keepDays = 90
- Check: pruned format (just id + completion)

---

## Success Metrics

### Technical
- Zero TypeScript errors
- Migration success rate: 100%
- Performance: <1s page load with 100 tasks
- Storage: <2MB for heavy users

### User Experience
- Easy creation: <2 min to set up routine
- Quick completion: <2 taps to complete
- Clear history: Users understand streaks
- No confusion: Template vs instance clear

### Adoption
- 50%+ users create routine within 7 days
- 70%+ completion rate for created routines
- 30-day retention high
- Positive feedback (NPS >40)

---

## Support Resources

### Documentation
- Main PRD: `focus-tools-product-doc.md`
- Data Model: `FOCUS_TOOLS_DATA_MODEL.md`
- Claude Context: `CLAUDE_CODE_CONTEXT_v3.md`

### Code Location
- Types: `lib/recurring-types.ts`
- Utilities: `lib/recurring-utils.ts`
- Components: `components/routines/`

### Testing
- Unit: `lib/__tests__/recurring-utils.test.ts`
- Manual: Checklist in TESTING.md

---

## Related Work

### Similar Features in Other Apps
- Streaks (for habit tracking)
- Todoist (recurring tasks)
- Habitica (gamified habits)
- Google Calendar (recurring events)

### Our Differentiation
- ADHD-optimized UX
- Spatial organization
- Template snapshot for accuracy
- Flexible additional steps
- Integrated with task management

---

## Feedback Loop

### After Launch
1. Monitor usage metrics
2. Collect user feedback
3. Track common issues
4. Identify quick wins
5. Plan v2 features

### Key Questions
- Do users understand template vs instance?
- Is streak motivating or stressful?
- Do people use additional steps?
- Is history modal useful?
- What patterns do people use?

---

## Version History

**v1 (Current)**
- Core recurring functionality
- Daily/weekly/monthly patterns
- Streak tracking
- History calendar
- Template snapshots

**v2 (Planned)**
- Calendar integration
- Bulk operations
- Statistics/insights
- Mini indicators

**v3 (Future)**
- Advanced patterns
- Template library
- External sync
- Widgets

---

## Contact & Questions

For questions about:
- **Product decisions:** Review OVERVIEW.md
- **Data structures:** Review DATA_MODEL.md
- **Implementation:** Check PROMPTS.md and IMPLEMENTATION_PLAN.md
- **Testing:** See TESTING.md
- **Future plans:** See FUTURE_ENHANCEMENTS.md

---

## Document Maintenance

### When to Update

**OVERVIEW.md:**
- Feature changes
- New user flows
- Terminology updates

**DATA_MODEL.md:**
- Schema changes
- New interfaces
- Storage updates

**IMPLEMENTATION_PLAN.md:**
- Phase completion
- New dependencies
- Timeline changes

**TESTING.md:**
- New test cases
- Updated checklists
- Performance benchmarks

**FUTURE_ENHANCEMENTS.md:**
- User feedback
- New feature ideas
- Priority changes

---

## Appendix: File Sizes

- OVERVIEW.md: ~13KB
- DATA_MODEL.md: ~35KB
- IMPLEMENTATION_PLAN.md: ~20KB
- CLAUDE_CODE_PROMPTS.md: ~25KB
- TESTING.md: ~20KB
- FUTURE_ENHANCEMENTS.md: ~8KB

**Total:** ~121KB documentation

---

## Quick Reference Card

**Create Routine:**
1. Add task
2. Open detail
3. Toggle "Recurring"
4. Configure pattern
5. Save

**Complete Routine:**
1. Tap checkbox in gallery
2. Select "Complete"
3. Streak updates
4. Card disappears

**View History:**
1. Open routine detail
2. Tap "History"
3. Navigate calendar
4. Tap date for details

**Pause Routine:**
1. Open routine detail
2. Tap "Pause"
3. Choose resume mode
4. Confirm

**Edit Template:**
1. Open routine detail
2. Tap "Edit Template"
3. Check/uncheck steps
4. Save changes

---

**Last Updated:** 2025-01-19  
**Schema Version:** 9  
**Status:** Ready for Implementation
