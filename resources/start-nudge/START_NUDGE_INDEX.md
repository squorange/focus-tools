# Start Nudge - Documentation Index

## Overview

Complete documentation set for implementing the Start Nudge feature for Focus Tools. This feature provides duration-aware time-to-start notifications to help users with time blindness begin tasks on time.

**Total Implementation Time:** 4-5 days  
**Schema Version:** 10 (from v9)  
**Dependencies:** Recurring Tasks feature

---

## Document Guide

### 1. START_NUDGE_SPEC.md
**Purpose:** Complete feature specification  
**Audience:** Product, Design, Development  
**Read First:** Yes

**Contents:**
- Executive summary and problem statement
- Feature overview and mental model
- User settings (global + per-task)
- Calculation logic with examples
- Notifications hub design
- UI specifications for all states
- Complete data model
- Edge cases and handling
- Success metrics

**Use This For:**
- Understanding what we're building
- Design decisions and rationale
- Data model reference
- Edge case handling

---

### 2. START_NUDGE_IMPLEMENTATION_PLAN.md
**Purpose:** Development roadmap and component specs  
**Audience:** Development  
**Dependencies:** Spec document

**Contents:**
- File structure (new files, updates)
- 6 implementation phases with tasks
- Detailed component specifications
- Schema migration strategy
- Testing checklist
- Risk mitigation

**Use This For:**
- Project planning
- Sprint organization
- Component implementation
- Progress tracking

---

### 3. START_NUDGE_CLAUDE_CODE_PROMPTS.md
**Purpose:** Ready-to-use prompts for Claude Code  
**Audience:** Development  
**Dependencies:** All above documents

**Contents:**
- 6 phase-specific prompts (copy-paste ready)
- Phase 1: Data Model & Core Utilities
- Phase 2: Start Nudge Field Component
- Phase 3: Notifications Hub
- Phase 4: Notification Settings
- Phase 5: Notification Scheduling
- Phase 6: Polish & Edge Cases
- Troubleshooting guide
- Final validation checklist

**Use This For:**
- Implementation execution
- Working with Claude Code
- Incremental development
- Debugging issues

---

## Quick Reference

### Key Concepts

| Concept | Definition |
|---------|------------|
| **Start Nudge** | System-calculated notification for when to begin a task |
| **Anchor Time** | Target/deadline/recurrence time the nudge counts back from |
| **Buffer** | Extra time added to account for optimism bias |
| **Global Default** | User setting for which tasks get Start Nudges by default |
| **Per-Task Override** | Individual task setting to override global default |

### Calculation Formula

```
Start Nudge Time = Anchor Time - Duration - Buffer

Where:
- Anchor = target ?? deadline ?? recurrence.time
- Duration = task.estimatedDuration ?? sumStepDurations() ?? AI estimate
- Buffer = max(5 min, duration * 0.15) OR user-configured fixed value
```

### Settings Options

| Setting | Options |
|---------|---------|
| **Enable by default** | All tasks, Routines only, One-off tasks only, None |
| **Default buffer** | 5 min, 10 min, 15 min, 15% of duration |
| **Per-task override** | On, Off, Use default |

### Notification Types

| Type | Icon | Purpose |
|------|------|---------|
| Start Nudge | bell-ring | Time to begin task |
| Reminder | clock | User-set time alert |
| Streak | flame | Gamification milestone |
| System | info | App updates, tips |
| Partner | user | Partner-originated (future) |

---

## Implementation Phases Summary

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| **1** | Data Model | 3-4 hrs | Types, utilities, migration |
| **2** | Start Nudge Field | 2-3 hrs | Toggle component in TaskDetail |
| **3** | Notifications Hub | 3-4 hrs | Hub view, cards, menu item |
| **4** | Settings | 2-3 hrs | Settings panel, persistence |
| **5** | Scheduling | 3-4 hrs | Notification lifecycle |
| **6** | Polish | 2-3 hrs | Edge cases, accessibility |

---

## Data Model Summary

### New Types

```typescript
interface Notification {
  id: string;
  type: NotificationType;
  taskId: string | null;
  instanceId: string | null;
  title: string;
  body: string;
  icon: NotificationIcon;
  scheduledAt: number;
  firedAt: number | null;
  acknowledgedAt: number | null;
  deepLink: string;
}
```

### Task Extensions

```typescript
interface Task {
  // ... existing fields ...
  startNudgeOverride: 'on' | 'off' | null;
  estimatedDurationMinutes: number | null;
  estimatedDurationSource: 'manual' | 'ai' | 'steps' | null;
}
```

### Settings Extensions

```typescript
interface UserSettings {
  // ... existing fields ...
  startNudgeDefault: 'all' | 'routines_only' | 'tasks_only' | 'none';
  startNudgeDefaultBufferMinutes: number;
}
```

---

## File Changes Summary

### New Files

```
lib/start-nudge-types.ts
lib/start-nudge-utils.ts
lib/notification-utils.ts
components/task-detail/StartNudgeField.tsx
components/notifications/NotificationsHub.tsx
components/notifications/NotificationCard.tsx
components/notifications/NotificationSettings.tsx
components/notifications/NotificationBadge.tsx
```

### Modified Files

```
lib/types.ts
lib/storage.ts
app/page.tsx
components/side-drawer/SideDrawer.tsx
components/task-detail/TaskDetail.tsx
```

---

## Contact & Questions

For questions about:
- **Product decisions:** Review SPEC.md
- **Component details:** Review IMPLEMENTATION_PLAN.md
- **Implementation:** Use CLAUDE_CODE_PROMPTS.md

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial documentation set |
