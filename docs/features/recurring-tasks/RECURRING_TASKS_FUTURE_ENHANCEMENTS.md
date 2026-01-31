# Recurring Tasks - Future Enhancements

## Overview

This document tracks potential future improvements to recurring tasks functionality. Items are organized by priority and complexity.

---

## High Priority (v2)

### 1. Calendar View Integration

**Description:** Full calendar view showing both one-off tasks and recurring instances.

**Features:**
- Month/week/day views
- Both one-off tasks (with target/deadline) and recurring instances
- Color coding by project
- Click date to see all tasks for that day
- Drag to reschedule (one-off only)

**Complexity:** High  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** None  
**Value:** High - unified view of all work

---

### 2. Bulk Operations

**Description:** Manage multiple routines at once.

**Features:**
- Select multiple routines (checkboxes)
- Bulk pause/resume
- Bulk edit (change time, rollover setting)
- "Vacation Mode": Pause all with auto-resume date
- Bulk delete

**Use Cases:**
- Going on vacation: Pause all routines
- Adjusting schedule: Change morning routines to 30 min later
- Spring cleaning: Delete old unused routines

**Complexity:** Medium  
**Estimated Effort:** 3-5 days  
**Value:** High - critical for users with many routines

---

### 3. Habit Statistics & Insights

**Description:** Visualizations and insights about routine adherence.

**Features:**
- Completion rate over time (graph)
- Best/worst days of week
- Time of day analysis
- Correlation between routines ("Completing X increases Y by 40%")
- Predictions: "You usually skip on Mondays"
- Export to CSV

**Complexity:** High  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** Sufficient data collected  
**Value:** Medium-High - helps users understand patterns

---

### 4. Mini Calendar Indicators

**Description:** At-a-glance completion status in main views.

**Features:**
- 7-day strip at top of Focus Queue showing completion icons
- Each routine in Routines tab shows last 7 days: ✅✅❌✅✅✅✅
- Hover for details

**Complexity:** Low  
**Estimated Effort:** 2-3 days  
**Value:** High - quick visual feedback

---

## Medium Priority (v3)

### 5. Advanced Scheduling Patterns

**Description:** Support more complex recurrence patterns.

**Features:**
- Multiple times per day (e.g., "Take meds 3x daily at 8am, 2pm, 8pm")
- Custom intervals (every 10 days, every 6 weeks)
- Exceptions (every weekday except holidays)
- Dependent routines (start B only after A complete)
- Seasonal patterns (only during summer)

**Complexity:** High  
**Estimated Effort:** 1-2 weeks  
**Value:** Medium - power user feature

---

### 6. Routine Templates Library

**Description:** Pre-built routine templates users can import.

**Categories:**
- Health (morning meds, evening vitamins, weekly workout)
- Productivity (daily planning, weekly review, monthly goals)
- Self-care (meditation, journaling, therapy prep)
- Household (weekly cleaning, monthly maintenance)

**Features:**
- Browse library
- Preview before adding
- Customize after import
- Share custom templates

**Complexity:** Medium  
**Estimated Effort:** 1 week  
**Value:** High - reduces setup friction

---

### 7. External Calendar Sync

**Description:** Sync recurring tasks with Google Calendar, Apple Calendar, etc.

**Features:**
- Two-way sync
- Completion in Focus Tools updates calendar
- Completion in external calendar updates Focus Tools
- Choose which routines to sync
- Conflict resolution

**Complexity:** Very High  
**Estimated Effort:** 3-4 weeks  
**Dependencies:** OAuth implementation, API integration  
**Value:** Medium - useful but complex

---

### 8. Widgets

**Description:** Home screen widgets showing today's routines.

**Features:**
- iOS widget showing today's routines
- Android widget
- Quick complete from widget
- Streak display
- Tap to open app

**Complexity:** Medium  
**Estimated Effort:** 1 week per platform  
**Value:** High - increased engagement

---

## Low Priority (Future)

### 9. Gamification

**Description:** Achievements and rewards for maintaining routines.

**Features:**
- Badges (7 day streak, 30 day, 100 day, etc.)
- Levels (Beginner → Expert)
- Challenges (Complete all routines this week)
- Leaderboards (optional, friends only)
- Celebrations on milestones

**Complexity:** Medium  
**Value:** Medium - motivating but not core

---

### 10. Social Features

**Description:** Share progress and accountability with others.

**Features:**
- Share streak with accountability partner
- Family shared routines (household chores)
- Encouragement messages
- Group challenges
- Privacy controls

**Complexity:** High (requires backend)  
**Value:** Medium - niche use case

---

### 11. AI Predictions

**Description:** Use AI to suggest optimal times and predict issues.

**Features:**
- Suggest best time based on completion history
- Predict likelihood of completion
- Suggest related routines
- Identify risk of streak break
- Personalized encouragement

**Complexity:** Very High (ML required)  
**Value:** Medium - nice-to-have

---

### 12. Voice Integration

**Description:** Complete routines via voice.

**Features:**
- "Hey Claude, mark morning meds complete"
- "Show me today's routines"
- "What's my current streak?"
- Works with Siri/Google Assistant

**Complexity:** High  
**Dependencies:** Voice API integration  
**Value:** Medium - accessibility benefit

---

### 13. Health Data Integration

**Description:** Track medication adherence, sync with health apps.

**Features:**
- Export medication completion to Health app
- Track vital signs alongside routines
- Correlate routine adherence with health metrics
- Reminder notifications via Health app

**Complexity:** High  
**Dependencies:** HealthKit/Google Fit API  
**Value:** Medium - specific use case

---

### 14. Themes & Alternative Metaphors

**Description:** Different visual metaphors for routines.

**Examples:**
- Garden: Routines as plants that grow with streaks
- Journey: Progress on a path
- Orbit: (already implemented as default)
- Checklist: Traditional list view
- Heatmap: GitHub-style contribution graph

**Complexity:** Medium  
**Estimated Effort:** 1-2 weeks  
**Value:** Low - aesthetic preference

---

## Explicitly Not Planned

### Subtasks in Recurring
**Reason:** Too complex. Use additional steps instead.

### Recurring Projects
**Reason:** Projects are one-off containers by design.

### Conditional Logic
**Reason:** "If X then Y" patterns too complex for ADHD users.

### Nested Routines
**Reason:** Cognitive overhead too high.

---

## Research Needed

### 1. AI Routine Suggestions
**Question:** Can AI suggest personalized routines based on user context?
**Approach:** Analyze user patterns, suggest routines
**Concern:** Privacy, accuracy

### 2. Collaborative Routines
**Question:** How to support shared household routines?
**Approach:** Multi-user instance tracking
**Concern:** Complexity, privacy

### 3. Flexible Scheduling
**Question:** Support "3 times per week, any days" pattern?
**Approach:** Credit system instead of fixed schedule
**Concern:** Cognitive load, streak calculation

---

## Decision Log

### Why not subtasks in recurring?
**Date:** 2025-01-18  
**Decision:** Don't support subtasks within recurring routine steps  
**Rationale:** Adds significant complexity. Alternative: Use additional steps for variations.

### Why snapshot instead of reference?
**Date:** 2025-01-18  
**Decision:** Store template snapshot in instances  
**Rationale:** Historical accuracy, handles template changes cleanly

### Why no multi-device sync in v1?
**Date:** 2025-01-18  
**Decision:** Local storage only initially  
**Rationale:** Complexity, backend required. Add if users demand it.

---

## User Feedback Tracking

### Most Requested Features (Placeholder)
1. TBD after launch
2. TBD
3. TBD

### Pain Points (Placeholder)
1. TBD after launch
2. TBD
3. TBD

---

## Related Documentation

- `RECURRING_TASKS_OVERVIEW.md` - Current features
- `RECURRING_TASKS_IMPLEMENTATION_PLAN.md` - v1 roadmap
- `RECURRING_TASKS_DATA_MODEL.md` - Data structures
