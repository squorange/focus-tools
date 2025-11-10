# TODO Items

## Focus Tracking - Remaining Phase 1

### Task/Subtask Completion Flow
**Status**: Pending
**Priority**: High
**Location**: AIPanel.tsx:786-791

Currently the panel shows:
```typescript
<button onClick={handleCompleteTask}>
  {task.completed ? 'Mark Incomplete' : 'Complete Task'}
</button>
```

**Issue**: The button text says "Mark Incomplete" when task is already completed, which is backwards. It should say "Complete Task" when not completed, and "Mark Incomplete" when completed.

**Desired behavior**:
- Show "Complete Task" button when task is not complete
- Show "Mark Incomplete" button when task is complete
- Consider integration with active focus sessions:
  - If session is active when completing, prompt to end session
  - Option to mark session as "completed" vs "stopped"
  - Session notes prompt on completion

**Related functions** (focus-session.ts):
```typescript
endSession(sessionId, reason: 'completed' | 'stopped' | 'stale', wasCompleted: boolean)
```

### Time Aggregation Display
**Status**: Pending
**Priority**: Medium

Add display of time statistics in the panel:
- Total time spent (task + all subtasks)
- Session count
- Average session length
- Last worked on date
- Direct parent time (if has subtasks)

Functions already implemented in focus-session.ts:
- `getTaskTimeStats(taskId)`
- `getDirectParentTimeStats(taskId)`

### End-to-End Testing
**Status**: Pending
**Priority**: High

Test all session state transitions:
- Start session → timer running
- Pause session → timer paused, "Resume" button appears
- Resume session → timer continues from paused time
- Stop session → creates TimeEntry, clears session
- Complete with session → marks wasCompleted=true in TimeEntry
- Cross-task sessions (start new while one active)
- Page visibility (timer pauses when tab hidden)
- Refresh/reload persistence

## Future Phases

### Phase 2: Smart Features
- Break reminder system (25min intervals, snooze, flow mode)
- Stale session detection on app mount
- Manual time entry UI

### Phase 3: Analytics
- Time history view
- Visualization of work patterns
- Completion rate trends

### Phase 4: Multi-device
- Sync sessions across devices
- Conflict resolution
- Offline queue
