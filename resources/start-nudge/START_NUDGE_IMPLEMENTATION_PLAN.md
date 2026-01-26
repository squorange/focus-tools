# Start Nudge - Implementation Plan

> **Estimated Timeline:** 4-5 days of focused development  
> **Dependencies:** Recurring Tasks (Schema v9)  
> **Target Schema:** v10

---

## Table of Contents

1. [File Structure](#file-structure)
2. [Implementation Phases](#implementation-phases)
3. [Component Specifications](#component-specifications)
4. [Schema Migration](#schema-migration)
5. [Testing Checklist](#testing-checklist)
6. [Risk Mitigation](#risk-mitigation)

---

## File Structure

### New Files to Create

```
prototypes/task-copilot/
├── lib/
│   ├── start-nudge-types.ts       [NEW] Type definitions
│   ├── start-nudge-utils.ts       [NEW] Calculation logic
│   └── notification-utils.ts      [NEW] Notification helpers
│
├── components/
│   ├── notifications/             [NEW] Notification components
│   │   ├── NotificationsHub.tsx   Main hub view
│   │   ├── NotificationCard.tsx   Individual notification
│   │   ├── NotificationSettings.tsx  Settings panel
│   │   └── NotificationBadge.tsx  Menu badge component
│   │
│   └── task-detail/
│       └── StartNudgeField.tsx    [NEW] Toggle + status display
│
└── docs/
    ├── START_NUDGE_SPEC.md
    ├── START_NUDGE_IMPLEMENTATION_PLAN.md
    └── START_NUDGE_CLAUDE_CODE_PROMPTS.md
```

### Files to Update

```
lib/types.ts                       Add Notification, extend Task, UserSettings
lib/storage.ts                     Schema v10 migration
app/page.tsx                       Add notification handlers, settings state
components/side-drawer/SideDrawer.tsx  Add Notifications menu item
components/task-detail/TaskDetail.tsx  Add StartNudgeField
```

---

## Implementation Phases

### Phase 1: Data Model & Core Utilities
**Duration:** Day 1 (3-4 hours)  
**Goal:** Establish types and calculation logic without UI

#### Tasks

1. **Create `lib/start-nudge-types.ts`**
   ```typescript
   // Notification types
   interface Notification { ... }
   type NotificationType = 'start_nudge' | 'reminder' | 'streak' | 'system' | 'partner';
   type NotificationIcon = 'bell-ring' | 'clock' | 'flame' | 'info' | 'user';
   
   // Settings types
   type StartNudgeDefault = 'all' | 'routines_only' | 'tasks_only' | 'none';
   
   // Override types
   type StartNudgeOverride = 'on' | 'off' | null;
   type DurationSource = 'manual' | 'ai' | 'steps' | null;
   ```

2. **Create `lib/start-nudge-utils.ts`**
   - `getAnchorTime(task)` - Resolve target/deadline/recurrence
   - `getDuration(task)` - Sum steps or use override
   - `calculateBuffer(duration, settings)` - Apply buffer logic
   - `calculateStartNudgeTime(task, settings)` - Main calculation
   - `isStartNudgeEnabled(task, settings)` - Check global + override
   - `getStartNudgeStatus(task, settings)` - Status for UI
   - `formatStartNudgeDescription(task, settings)` - Human-readable

3. **Create `lib/notification-utils.ts`**
   - `createNotification(type, task, scheduledAt)` - Factory
   - `scheduleStartNudge(task, settings)` - Create/update notification
   - `cancelStartNudge(taskId)` - Remove scheduled notification
   - `markNotificationFired(id)` - Update fired timestamp
   - `markNotificationAcknowledged(id)` - Update acknowledged timestamp
   - `getUnacknowledgedCount(notifications)` - Badge count
   - `groupNotificationsByDate(notifications)` - For hub display
   - `sortNotifications(notifications)` - Chronological ordering

4. **Update `lib/types.ts`**
   - Add `Notification` interface
   - Extend `Task` with start nudge fields
   - Extend `UserSettings` with start nudge settings
   - Add `notifications` to `AppState`

5. **Update `lib/storage.ts`**
   - Implement v9 → v10 migration
   - Persist notifications array
   - Initialize default settings

#### Validation
- [ ] TypeScript compiles without errors
- [ ] `calculateStartNudgeTime` returns correct times
- [ ] `isStartNudgeEnabled` respects global + override logic
- [ ] Migration preserves existing data

---

### Phase 2: Start Nudge Field Component
**Duration:** Day 1-2 (2-3 hours)  
**Goal:** Add Start Nudge toggle to task detail

#### Tasks

1. **Create `components/task-detail/StartNudgeField.tsx`**
   
   Props:
   ```typescript
   interface StartNudgeFieldProps {
     task: Task;
     settings: UserSettings;
     onUpdate: (updates: Partial<Task>) => void;
     onRequestAIEstimate: () => Promise<number>;
   }
   ```
   
   States to handle:
   - Toggle OFF (minimal display)
   - Toggle ON with calculated time
   - Toggle ON missing anchor (show warning)
   - Toggle ON generating estimate (loading)
   - Override indicator (when differs from global)
   
   Dropdown options:
   - On
   - Off
   - Use default (currently: [global setting])

2. **Update `components/task-detail/TaskDetail.tsx`**
   - Import `StartNudgeField`
   - Add below Reminder field
   - Pass required props
   - Handle AI estimate generation

3. **Add duration editing**
   - Display duration with source indicator "(AI)"
   - "Adjust estimate" link opens duration input
   - User edits update `estimatedDurationMinutes` and clear AI tag

#### Validation
- [ ] Toggle changes `startNudgeOverride` correctly
- [ ] Calculated time displays accurately
- [ ] Missing anchor shows warning
- [ ] Override indicator shows when different from global
- [ ] Duration adjustment works

---

### Phase 3: Notifications Hub
**Duration:** Day 2-3 (3-4 hours)  
**Goal:** Create notification management interface

#### Tasks

1. **Create `components/notifications/NotificationCard.tsx`**
   
   Props:
   ```typescript
   interface NotificationCardProps {
     notification: Notification;
     onTap: (notification: Notification) => void;
     onDismiss?: (id: string) => void;
   }
   ```
   
   Features:
   - Icon based on type (Lucide icons)
   - Title and body display
   - Time display (scheduled or fired)
   - Unread indicator (dot)
   - Swipe to dismiss (optional)

2. **Create `components/notifications/NotificationsHub.tsx`**
   
   Props:
   ```typescript
   interface NotificationsHubProps {
     notifications: Notification[];
     onTap: (notification: Notification) => void;
     onDismiss: (id: string) => void;
     onOpenSettings: () => void;
     onBack: () => void;
   }
   ```
   
   Layout:
   - Header with title + settings gear
   - Grouped sections: Upcoming, Today, Earlier
   - Empty state when no notifications
   
3. **Create `components/notifications/NotificationBadge.tsx`**
   
   Props:
   ```typescript
   interface NotificationBadgeProps {
     count: number;
   }
   ```
   
   Display:
   - Number in parentheses: "(3)"
   - Hidden when count is 0

4. **Update `components/side-drawer/SideDrawer.tsx`**
   - Add "Notifications" menu item
   - Include badge with unacknowledged count
   - Position between Projects and Export

5. **Update `app/page.tsx`**
   - Add `'notifications'` to view types
   - Add notification handlers:
     - `handleNotificationTap`
     - `handleNotificationDismiss`
   - Render `NotificationsHub` when view is 'notifications'

#### Validation
- [ ] Notifications hub displays correctly
- [ ] Badge shows correct unacknowledged count
- [ ] Tapping notification navigates to task
- [ ] Notifications grouped by date correctly
- [ ] Empty state displays when no notifications

---

### Phase 4: Notification Settings
**Duration:** Day 3 (2-3 hours)  
**Goal:** Add settings panel for Start Nudge configuration

#### Tasks

1. **Create `components/notifications/NotificationSettings.tsx`**
   
   Props:
   ```typescript
   interface NotificationSettingsProps {
     settings: UserSettings;
     onUpdate: (updates: Partial<UserSettings>) => void;
     onBack: () => void;
   }
   ```
   
   Settings:
   - Enable by default (dropdown: All/Routines only/Tasks only/None)
   - Default buffer (dropdown: 5/10/15 min or 15%)
   - Quiet hours (future: toggle + time range)

2. **Wire up settings persistence**
   - Update `lib/storage.ts` to persist settings
   - Add settings to AppState
   - Initialize defaults on first load

3. **Connect settings to Start Nudge calculation**
   - Pass settings to `isStartNudgeEnabled`
   - Pass settings to `calculateStartNudgeTime`

#### Validation
- [ ] Settings persist across sessions
- [ ] Global default affects new tasks
- [ ] Buffer setting changes calculation
- [ ] Settings accessible from hub gear icon

---

### Phase 5: Notification Scheduling
**Duration:** Day 3-4 (3-4 hours)  
**Goal:** Implement notification lifecycle management

#### Tasks

1. **Notification scheduling logic**
   
   ```typescript
   // When task is saved with Start Nudge enabled
   function handleTaskSave(task: Task) {
     if (isStartNudgeEnabled(task, settings)) {
       const nudgeTime = calculateStartNudgeTime(task, settings);
       if (nudgeTime) {
         scheduleStartNudge(task, nudgeTime);
       }
     } else {
       cancelStartNudge(task.id);
     }
   }
   ```

2. **Recurring task scheduling**
   
   ```typescript
   // Schedule next occurrence
   function scheduleRecurringStartNudge(task: Task) {
     const nextOccurrence = getNextOccurrence(task.recurrence);
     const nudgeTime = calculateStartNudgeTime(task, settings);
     
     scheduleStartNudge(task, nudgeTime, nextOccurrence);
   }
   ```

3. **Notification firing (PWA limitations)**
   
   For MVP (PWA):
   - Store scheduled notifications in state
   - Check on app open/focus
   - Fire any past-due notifications immediately
   
   Future (native):
   - Use push notification APIs
   - Background scheduling

4. **Add notification triggers**
   - Task created/updated with Start Nudge
   - Start Nudge toggle changed
   - Duration estimate changed
   - Anchor time changed
   - Recurring instance completed (schedule next)

#### Validation
- [ ] Notifications scheduled when Start Nudge enabled
- [ ] Notifications cancelled when Start Nudge disabled
- [ ] Notifications update when duration/anchor changes
- [ ] Recurring tasks schedule next occurrence
- [ ] Past-due notifications fire on app open

---

### Phase 6: Polish & Edge Cases
**Duration:** Day 4-5 (2-3 hours)  
**Goal:** Handle edge cases and refine UX

#### Tasks

1. **"Running late" handling**
   - Detect when start time is in the past
   - Show different notification content
   - Fire immediately

2. **AI duration estimation integration**
   - Connect to existing AI API
   - Generate estimate when Start Nudge enabled + no duration
   - Show loading state
   - Persist with "(AI)" indicator

3. **Undo support**
   - Toast on notification dismiss with undo
   - Consistent with existing toast patterns

4. **Accessibility**
   - ARIA labels on notifications
   - Focus management in hub
   - Keyboard navigation

5. **Dark mode verification**
   - All new components have dark: variants
   - Icons visible in both themes
   - Badge contrast acceptable

#### Validation
- [ ] Running late notifications display correctly
- [ ] AI estimates generate and display
- [ ] Undo works on dismiss
- [ ] Accessible with keyboard
- [ ] Dark mode looks correct

---

## Component Specifications

### StartNudgeField

```tsx
// components/task-detail/StartNudgeField.tsx

interface StartNudgeFieldProps {
  task: Task;
  settings: UserSettings;
  onUpdate: (updates: Partial<Task>) => void;
  onRequestAIEstimate: () => Promise<number>;
}

// Structure
<div className="space-y-2">
  {/* Toggle row */}
  <div className="flex items-center justify-between">
    <span className="text-sm text-zinc-600 dark:text-zinc-400">
      Start Nudge
    </span>
    <select 
      value={getToggleValue(task, settings)}
      onChange={handleToggleChange}
      className="..."
    >
      <option value="on">On</option>
      <option value="off">Off</option>
      <option value="default">
        Use default ({getDefaultLabel(settings)})
      </option>
    </select>
  </div>
  
  {/* Status/info row */}
  {isEnabled && (
    <div className="text-xs text-zinc-500 dark:text-zinc-500 pl-0">
      {hasAnchor ? (
        <>
          <span>Fires at {formatTime(nudgeTime)}</span>
          <span className="block">
            Est. {duration} min + {buffer} min buffer before {formatTime(anchor)}
          </span>
          <button onClick={openDurationEdit}>Adjust estimate</button>
        </>
      ) : (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          <span>Add target, deadline, or recurrence to enable</span>
        </div>
      )}
    </div>
  )}
  
  {/* Override indicator */}
  {isOverriding && (
    <span className="text-xs text-zinc-400">
      Overriding default ({getDefaultLabel(settings)})
    </span>
  )}
</div>
```

### NotificationCard

```tsx
// components/notifications/NotificationCard.tsx

interface NotificationCardProps {
  notification: Notification;
  onTap: (notification: Notification) => void;
  onDismiss?: (id: string) => void;
}

// Icon mapping
const iconMap = {
  'bell-ring': BellRing,
  'clock': Clock,
  'flame': Flame,
  'info': Info,
  'user': User,
};

// Structure
<button
  onClick={() => onTap(notification)}
  className="w-full p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 
             hover:bg-zinc-100 dark:hover:bg-zinc-800 
             transition-colors text-left"
>
  <div className="flex items-start gap-3">
    {/* Icon */}
    <div className={cn(
      "p-2 rounded-full",
      notification.type === 'start_nudge' && "bg-violet-100 dark:bg-violet-900/30",
      notification.type === 'reminder' && "bg-zinc-100 dark:bg-zinc-700",
      notification.type === 'streak' && "bg-orange-100 dark:bg-orange-900/30",
    )}>
      <Icon className={cn(
        "h-4 w-4",
        notification.type === 'start_nudge' && "text-violet-600 dark:text-violet-400",
        notification.type === 'reminder' && "text-zinc-600 dark:text-zinc-400",
        notification.type === 'streak' && "text-orange-600 dark:text-orange-400",
      )} />
    </div>
    
    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
        {notification.title}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
        {notification.body}
      </div>
      <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
        {formatNotificationTime(notification)}
      </div>
    </div>
    
    {/* Unread indicator */}
    {!notification.acknowledgedAt && notification.firedAt && (
      <div className="w-2 h-2 rounded-full bg-violet-500" />
    )}
  </div>
</button>
```

### NotificationsHub

```tsx
// components/notifications/NotificationsHub.tsx

// Structure
<div className="flex flex-col h-full">
  {/* Header */}
  <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
    <div className="flex items-center gap-2">
      <button onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-semibold">Notifications</h1>
    </div>
    <button onClick={onOpenSettings}>
      <Settings className="h-5 w-5 text-zinc-500" />
    </button>
  </div>
  
  {/* Content */}
  <div className="flex-1 overflow-y-auto p-4 space-y-6">
    {/* Upcoming section */}
    {upcoming.length > 0 && (
      <section>
        <h2 className="text-xs font-medium text-zinc-500 uppercase mb-2">
          Upcoming
        </h2>
        <div className="space-y-2">
          {upcoming.map(n => <NotificationCard key={n.id} ... />)}
        </div>
      </section>
    )}
    
    {/* Today section */}
    {today.length > 0 && (
      <section>
        <h2 className="text-xs font-medium text-zinc-500 uppercase mb-2">
          Today
        </h2>
        <div className="space-y-2">
          {today.map(n => <NotificationCard key={n.id} ... />)}
        </div>
      </section>
    )}
    
    {/* Earlier section */}
    {earlier.length > 0 && (
      <section>
        <h2 className="text-xs font-medium text-zinc-500 uppercase mb-2">
          Earlier
        </h2>
        <div className="space-y-2">
          {earlier.map(n => <NotificationCard key={n.id} ... />)}
        </div>
      </section>
    )}
    
    {/* Empty state */}
    {notifications.length === 0 && (
      <div className="text-center py-12 text-zinc-500">
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No notifications yet</p>
        <p className="text-sm mt-1">
          Start Nudges will appear here when scheduled
        </p>
      </div>
    )}
  </div>
</div>
```

---

## Schema Migration

```typescript
// lib/storage.ts

const SCHEMA_VERSION = 10;

function migrateState(state: any): AppState {
  // ... existing migrations ...
  
  // v9 → v10: Start Nudge + Notifications
  if (state.schemaVersion < 10) {
    // Add Start Nudge fields to tasks
    state.tasks = state.tasks.map((task: any) => ({
      ...task,
      startNudgeOverride: null,
      estimatedDurationMinutes: null,
      estimatedDurationSource: null,
    }));
    
    // Initialize settings
    state.settings = {
      ...state.settings,
      startNudgeDefault: 'routines_only',
      startNudgeDefaultBufferMinutes: 5,
    };
    
    // Initialize notifications
    state.notifications = [];
    
    state.schemaVersion = 10;
  }
  
  return state;
}
```

---

## Testing Checklist

### Data Model
- [ ] Schema version is 10
- [ ] Migration preserves existing task data
- [ ] New task fields have correct defaults
- [ ] Settings persist correctly
- [ ] Notifications array initializes empty

### Start Nudge Field
- [ ] Toggle displays current state
- [ ] Toggle changes work (On/Off/Default)
- [ ] Calculated time displays correctly
- [ ] Missing anchor shows warning
- [ ] Override indicator shows when appropriate
- [ ] Duration editing works

### Notifications Hub
- [ ] Hub displays all notifications
- [ ] Grouped by Upcoming/Today/Earlier
- [ ] Badge count is correct (unacknowledged only)
- [ ] Tapping navigates to task
- [ ] Empty state displays
- [ ] Settings accessible

### Calculation Logic
- [ ] Anchor resolution: target > deadline
- [ ] Recurring uses recurrence time
- [ ] Duration sums step estimates
- [ ] Buffer calculation correct
- [ ] No anchor returns null

### Scheduling
- [ ] Notification created when Start Nudge enabled
- [ ] Notification updated when duration/anchor changes
- [ ] Notification cancelled when disabled
- [ ] Recurring schedules next occurrence

### Edge Cases
- [ ] Start time in past → fires immediately
- [ ] No anchor → shows warning, no notification
- [ ] No duration → triggers AI estimate
- [ ] Conflicting reminder and nudge → both fire

---

## Risk Mitigation

### PWA Notification Limitations

**Risk:** PWA notifications unreliable on iOS.

**Mitigation:**
- MVP: Check scheduled notifications on app open/focus
- Fire any past-due immediately
- Document limitation for users
- Future: Move to Capacitor/native for reliable background notifications

### AI Estimate Reliability

**Risk:** AI estimates may be inaccurate.

**Mitigation:**
- Show "(AI)" indicator clearly
- Easy manual adjustment
- Future: Learn from actual durations

### User Overwhelm

**Risk:** Too many notifications feel nagging.

**Mitigation:**
- Default to "Routines only" (limited scope)
- Per-task override to disable
- Quiet hours setting (future)
- Clear distinction from reminders

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial implementation plan |
