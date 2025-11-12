# TODO Items

## Phase 1: Focus & Time Tracking ✅ COMPLETE

Phase 1 has been completed and pushed as of commit `3fcbd37` (2025-11-10).

**Completed Features:**

- ✅ Live timer with pause/resume functionality
- ✅ Focus session management (FocusSession & TimeEntry models)
- ✅ Activity logging system (auto-logs session events)
- ✅ Time aggregation display (total time, session count, average, last worked on)
- ✅ Task/subtask completion integration with active sessions
- ✅ Session end prompts with completion status and notes
- ✅ Database schema for all new models
- ✅ Timer persistence across page refreshes
- ✅ Orbital positioning and priority belt fixes
- ✅ Subtask selection persistence fix
- ✅ Orbital ring visibility enhancement

---

## Current Priority: End-to-End Testing

**Status**: Pending
**Priority**: High

Thoroughly test all Phase 1 features to ensure production readiness:

### Core Session Flows

- [ ] Start session → verify timer running, badge appears
- [ ] Pause session → verify timer paused, "Resume" button appears
- [ ] Resume session → verify timer continues from paused time
- [ ] Stop session → verify TimeEntry created, session cleared
- [ ] Complete task with active session → verify wasCompleted=true in TimeEntry

### Activity Logging

- [ ] Verify session_start log created on focus start
- [ ] Verify session_end log created with duration on stop
- [ ] Verify task_completed/subtask_completed logs
- [ ] Verify activity section displays logs correctly

### Edge Cases

- [ ] Cross-task sessions (start new focus while one active)
- [ ] Refresh/reload persistence (active session survives page reload)
- [ ] Complete task → verify orbital animations
- [ ] Priority belt celebration mode (complete all priority items)
- [ ] Switch tasks while subtask selected → verify selection cleared

### Time Aggregation

- [ ] Verify stats update after ending session
- [ ] Verify parent task shows subtask breakdown
- [ ] Verify completion rate calculation
- [ ] Verify "Last worked on" date accuracy

### UI/UX Polish

- [ ] Timer badge positioning on orbiting nodes
- [ ] Focus button states (Start/Pause/Resume/Stop)
- [ ] Completion prompts (task vs subtask)
- [ ] Activity log formatting and readability
- [ ] Time display formatting (minutes, hours)

---

## Phase 2: Smart Features

**Status**: Not Started
**Priority**: Medium

### Break Reminder System

- [ ] Implement 25-minute break reminder interval
- [ ] Add snooze functionality (5min, 10min)
- [ ] Implement "Flow Mode" to dismiss reminders
- [ ] Visual/audio notification options
- [ ] Break history tracking

### Stale Session Detection

- [ ] Detect sessions from previous day on app mount
- [ ] Prompt user to end or continue stale sessions
- [ ] Auto-end sessions after configurable inactivity period
- [ ] Show last activity time for stale sessions

### Manual Time Entry UI

- [ ] Add "Log Time" button to task/subtask panels
- [ ] Modal for manual entry (date, duration, notes)
- [ ] Mark entries as `isManualEntry: true`
- [ ] Validation (no overlapping times, reasonable durations)
- [ ] Edit/delete manual entries

### Focus Mode UI Transformation

- [ ] Auto-zoom orbital view to focused task on session start
- [ ] Minimize/hide non-essential UI elements during focus
- [ ] Display timer prominently (larger, more visible)
- [ ] Show current subtask prominently if applicable
- [ ] Add quick notes field (persistent during session)
- [ ] Keep AI assistant accessible but less prominent
- [ ] Add visual "focus mode" indicator/border
- [ ] Exit focus mode on session end or manual dismiss

---

## Phase 3: Analytics & Visualization

**Status**: Not Started
**Priority**: Low

### Time History View

- [ ] Timeline view of all sessions (calendar/list)
- [ ] Filter by date range, task, subtask
- [ ] Export to CSV/JSON
- [ ] Session detail modal (with edit/delete)

### Work Pattern Visualization

- [ ] Daily/weekly time breakdown charts
- [ ] Most productive time of day analysis
- [ ] Task category time distribution
- [ ] Focus streak tracking

### Completion Rate & Trends

- [ ] Task completion percentage over time
- [ ] Average time to complete by category
- [ ] Compare estimated vs actual time
- [ ] Weekly/monthly productivity reports

---

## Phase 4: Multi-Device & Sync

**Status**: Not Started
**Priority**: Low (requires backend)

### Supabase Migration

- [ ] Migrate from IndexedDB to Supabase
- [ ] Schema design for tasks, sessions, entries, logs
- [ ] RLS policies for user data
- [ ] Migration script for existing data

### Real-Time Sync

- [ ] Sync active sessions across devices
- [ ] Conflict resolution (last-write-wins vs merge)
- [ ] Offline queue for failed syncs
- [ ] Sync status indicators in UI

### Multi-Device Considerations

- [ ] Prevent concurrent focus sessions on different devices
- [ ] Handle device switching mid-session
- [ ] Cross-device activity timeline
- [ ] Device-specific analytics

---

## Future Enhancements (Backlog)

### UI/UX Improvements

- [ ] Chip/pill row for task properties (see docs/UI_ENHANCEMENTS.md)
- [ ] Keyboard shortcuts for focus actions (Space = pause/resume)
- [ ] Dark/light theme toggle
- [ ] Mobile-optimized layouts

### Advanced Features

- [ ] Pomodoro timer mode (25/5 work/break cycles)
- [ ] Focus goals (daily/weekly targets)
- [ ] Task time estimates with learning
- [ ] Collaboration features (co-working timers)
- [ ] Calendar integrations

### Technical Debt

- [ ] Add unit tests for focus session logic
- [ ] Add E2E tests for critical flows
- [ ] Performance optimization (cache stats, lazy load entries)
- [ ] Accessibility audit (keyboard nav, screen readers)

---

**Last Updated**: 2025-11-11
