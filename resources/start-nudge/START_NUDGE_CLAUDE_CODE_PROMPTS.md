# Start Nudge - Claude Code Prompts

Ready-to-use prompts for implementing the Start Nudge feature with Claude Code.

Execute one phase at a time, validate results, then proceed to the next.

**Prerequisites:**
- Read `/mnt/project/CLAUDE.md` for project context
- Read `/mnt/project/FOCUS_TOOLS_DATA_MODEL.md` for data model patterns
- Read `START_NUDGE_SPEC.md` for feature requirements
- Read `START_NUDGE_IMPLEMENTATION_PLAN.md` for component details

---

## Phase 1: Data Model & Core Utilities

```
I need to implement the Start Nudge feature for Focus Tools. This is Phase 1: Data Model & Core Utilities.

Context files to read first:
- /mnt/project/CLAUDE.md (project overview, patterns, file structure)
- /mnt/project/FOCUS_TOOLS_DATA_MODEL.md (existing data model)
- /mnt/project/lib/types.ts (current type definitions)
- /mnt/project/lib/storage.ts (migration patterns)

Create these new files:

1. lib/start-nudge-types.ts

Define TypeScript interfaces:

```typescript
// Notification type
export interface Notification {
  id: string;
  type: NotificationType;
  taskId: string | null;
  instanceId: string | null;  // for recurring instances
  title: string;
  body: string;
  icon: NotificationIcon;
  scheduledAt: number;        // Unix timestamp
  firedAt: number | null;
  acknowledgedAt: number | null;
  deepLink: string;
}

export type NotificationType = 'start_nudge' | 'reminder' | 'streak' | 'system' | 'partner';
export type NotificationIcon = 'bell-ring' | 'clock' | 'flame' | 'info' | 'user';

// Settings
export type StartNudgeDefault = 'all' | 'routines_only' | 'tasks_only' | 'none';

// Task extensions
export type StartNudgeOverride = 'on' | 'off' | null;
export type DurationSource = 'manual' | 'ai' | 'steps' | null;

// Status for UI display
export interface StartNudgeStatus {
  enabled: boolean;
  hasAnchor: boolean;
  anchorTime: Date | null;
  duration: number | null;
  durationSource: DurationSource;
  buffer: number;
  nudgeTime: Date | null;
  isOverriding: boolean;
  globalDefault: StartNudgeDefault;
}
```

2. lib/start-nudge-utils.ts

Implement all calculation functions:

```typescript
// Anchor time resolution
export function getAnchorTime(task: Task): Date | null
// - Recurring: use recurrence time for next occurrence
// - Non-recurring: prefer targetDate over deadlineDate
// - Return null if no anchor available

// Duration resolution
export function getDuration(task: Task): number | null
// - Priority 1: task.estimatedDurationMinutes (manual override)
// - Priority 2: sum of step.estimatedMinutes (including substeps)
// - Return null if no duration available

export function sumStepDurations(steps: Step[]): number
// Sum all step and substep estimated minutes

// Buffer calculation
export function calculateBuffer(
  durationMinutes: number,
  bufferSetting: number | 'percentage'
): number
// - If number: return that number
// - If 'percentage': return max(5, duration * 0.15)

// Main calculation
export function calculateStartNudgeTime(
  task: Task,
  settings: UserSettings
): Date | null
// - Get anchor time
// - Get duration
// - Calculate buffer
// - Return anchor - duration - buffer
// - Return null if missing anchor or duration

// Enable check
export function isStartNudgeEnabled(
  task: Task,
  settings: UserSettings
): boolean
// - If task.startNudgeOverride is 'on': return true
// - If task.startNudgeOverride is 'off': return false
// - If null (use default):
//   - 'all': return true
//   - 'routines_only': return task.isRecurring
//   - 'tasks_only': return !task.isRecurring
//   - 'none': return false

// UI status
export function getStartNudgeStatus(
  task: Task,
  settings: UserSettings
): StartNudgeStatus
// Return complete status object for UI display

// Human-readable description
export function formatStartNudgeDescription(
  task: Task,
  settings: UserSettings
): string
// "Fires at 7:08 AM (45 min + 7 min buffer before 8:00 AM)"
```

3. lib/notification-utils.ts

```typescript
// Factory function
export function createNotification(
  type: NotificationType,
  task: Task,
  scheduledAt: number,
  instanceId?: string
): Notification

// Scheduling
export function scheduleStartNudge(
  task: Task,
  settings: UserSettings,
  notifications: Notification[]
): Notification[]
// - Calculate nudge time
// - Remove any existing start_nudge for this task
// - Add new notification if time is valid

export function cancelStartNudge(
  taskId: string,
  notifications: Notification[]
): Notification[]
// Remove start_nudge notifications for this task

// Lifecycle
export function markNotificationFired(
  id: string,
  notifications: Notification[]
): Notification[]

export function markNotificationAcknowledged(
  id: string,
  notifications: Notification[]
): Notification[]

// Badge count
export function getUnacknowledgedCount(notifications: Notification[]): number
// Count where firedAt !== null AND acknowledgedAt === null

// Grouping for hub display
export function groupNotificationsByDate(
  notifications: Notification[],
  now: Date
): {
  upcoming: Notification[];
  today: Notification[];
  earlier: Notification[];
}

// Sorting
export function sortNotifications(
  notifications: Notification[],
  order: 'asc' | 'desc'
): Notification[]
```

4. Update lib/types.ts

Add to existing Task interface:
```typescript
// Start Nudge fields
startNudgeOverride: StartNudgeOverride;
estimatedDurationMinutes: number | null;
estimatedDurationSource: DurationSource;
```

Create/extend UserSettings interface:
```typescript
interface UserSettings {
  dayStartHour: number;  // existing
  startNudgeDefault: StartNudgeDefault;
  startNudgeDefaultBufferMinutes: number;
}
```

Add to AppState:
```typescript
notifications: Notification[];
settings: UserSettings;
```

5. Update lib/storage.ts

Add schema v10 migration:
```typescript
// v9 → v10: Start Nudge + Notifications
if (state.schemaVersion < 10) {
  state.tasks = state.tasks.map((task: any) => ({
    ...task,
    startNudgeOverride: null,
    estimatedDurationMinutes: null,
    estimatedDurationSource: null,
  }));
  
  state.settings = {
    ...(state.settings || { dayStartHour: 5 }),
    startNudgeDefault: 'routines_only',
    startNudgeDefaultBufferMinutes: 5,
  };
  
  state.notifications = [];
  
  state.schemaVersion = 10;
}
```

Update SCHEMA_VERSION constant to 10.

Test validation:
- TypeScript compiles without errors
- calculateStartNudgeTime returns correct values
- isStartNudgeEnabled respects global and override
- Migration preserves existing data
- New fields have correct defaults

Let me know when Phase 1 is complete.
```

---

## Phase 2: Start Nudge Field Component

```
Phase 2: Start Nudge Field Component

Continue from Phase 1. Create the Start Nudge toggle for task detail.

1. Create components/task-detail/StartNudgeField.tsx

Props interface:
```typescript
interface StartNudgeFieldProps {
  task: Task;
  settings: UserSettings;
  onUpdate: (updates: Partial<Task>) => void;
  onRequestAIEstimate?: () => Promise<number>;
}
```

Component requirements:

Layout structure:
```
Start Nudge                          [On/Off/Default ▼]
└── Status line (conditional)
└── Override indicator (conditional)
```

Toggle dropdown with three options:
- "On" (value: 'on')
- "Off" (value: 'off')
- "Use default (currently: X)" (value: 'default')

Status line variations:

When enabled AND has anchor:
```
"Fires at 7:08 AM"
"Est. 45 min + 7 min buffer before 8:00 AM"
[Adjust estimate] ← text button
```

When enabled AND missing anchor:
```
⚠️ "Add a target time, deadline, or recurrence pattern to enable Start Nudge"
```
Use AlertTriangle icon from lucide-react
Text color: amber-600/amber-400

When enabled AND calculating:
```
"Calculating estimate..."
```

Override indicator (when task override differs from global):
```
"Overriding default (On)" or "Overriding default (Off)"
```
Text color: zinc-400

Styling guidelines:
- Match existing TaskDetail field patterns
- Label: text-sm text-zinc-600 dark:text-zinc-400
- Status: text-xs text-zinc-500 dark:text-zinc-500
- Warning: text-xs text-amber-600 dark:text-amber-400
- Select: existing select patterns from TaskDetail

2. Update components/task-detail/TaskDetail.tsx

- Import StartNudgeField
- Add below the existing Reminder field in the Details section
- Pass required props:
  - task
  - settings (from AppState)
  - onUpdate (handleUpdateTask)
  - onRequestAIEstimate (stub for now, returns 30)

3. Handle duration display

In TaskDetail or a new DurationField:
- Show "Duration: ~45 min (AI)" when AI-generated
- Show "Duration: ~45 min" when manual
- Show "Duration: ~45 min (steps)" when from step sum
- Add [Edit] button that opens duration input

Test validation:
- Toggle displays current state correctly
- Changing toggle updates task.startNudgeOverride
- Calculated time displays when enabled + has anchor
- Warning shows when enabled + missing anchor
- Override indicator shows when differs from global
- Duration source indicator works

Let me know when Phase 2 is complete.
```

---

## Phase 3: Notifications Hub

```
Phase 3: Notifications Hub

Continue from Phase 2. Create the notifications management interface.

1. Create components/notifications/NotificationCard.tsx

Props:
```typescript
interface NotificationCardProps {
  notification: Notification;
  onTap: (notification: Notification) => void;
  onDismiss?: (id: string) => void;
}
```

Icon mapping (use lucide-react):
- 'bell-ring' → BellRing
- 'clock' → Clock
- 'flame' → Flame
- 'info' → Info
- 'user' → User

Color scheme by type:
- start_nudge: violet (bg-violet-100/violet-900/30, text-violet-600/violet-400)
- reminder: zinc (bg-zinc-100/zinc-700, text-zinc-600/zinc-400)
- streak: orange (bg-orange-100/orange-900/30, text-orange-600/orange-400)
- system: zinc
- partner: blue

Structure:
```tsx
<button onClick={() => onTap(notification)} className="w-full p-3 rounded-lg ...">
  <div className="flex items-start gap-3">
    <div className="p-2 rounded-full {type-bg}">
      <Icon className="h-4 w-4 {type-text}" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{body}</div>
      <div className="text-xs text-zinc-400 mt-1">{time}</div>
    </div>
    {/* Unread dot: show if firedAt && !acknowledgedAt */}
    {isUnread && <div className="w-2 h-2 rounded-full bg-violet-500" />}
  </div>
</button>
```

Time formatting:
- Upcoming: "Tomorrow 7:08 AM" or "Jan 25, 7:08 AM"
- Today (fired): "7:08 AM"
- Earlier: "Yesterday" or "Jan 24"

2. Create components/notifications/NotificationsHub.tsx

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
```
┌─────────────────────────────────────┐
│ ← Notifications                  ⚙️ │
├─────────────────────────────────────┤
│ UPCOMING                            │
│ [NotificationCard]                  │
│ [NotificationCard]                  │
├─────────────────────────────────────┤
│ TODAY                               │
│ [NotificationCard]                  │
├─────────────────────────────────────┤
│ EARLIER                             │
│ [NotificationCard]                  │
└─────────────────────────────────────┘
```

Section headers:
- text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2

Empty state (when no notifications):
```tsx
<div className="text-center py-12 text-zinc-500">
  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
  <p>No notifications yet</p>
  <p className="text-sm mt-1">Start Nudges will appear here when scheduled</p>
</div>
```

Use groupNotificationsByDate utility to group notifications.

3. Create components/notifications/NotificationBadge.tsx

Props:
```typescript
interface NotificationBadgeProps {
  count: number;
}
```

Display: "(3)" in parentheses after menu item text
Hidden when count is 0
Style: text-zinc-500 dark:text-zinc-400

4. Update components/side-drawer/SideDrawer.tsx (or equivalent menu component)

Add "Notifications" menu item:
- Position between Projects and Export (based on user's screenshot)
- Include NotificationBadge
- Icon: Bell from lucide-react
- onClick navigates to 'notifications' view

Menu structure should be:
```
Focus
Tasks
Projects
─────────────
Notifications (3)  ← NEW
─────────────
Export
Import
```

5. Update app/page.tsx

Add 'notifications' to view types.

Add state/handlers:
```typescript
// In handlers section
const handleNotificationTap = (notification: Notification) => {
  // Mark as acknowledged
  const updated = markNotificationAcknowledged(notification.id, notifications);
  setNotifications(updated);
  
  // Navigate to task
  if (notification.taskId) {
    setActiveTaskId(notification.taskId);
    setCurrentView('taskDetail');
  }
};

const handleNotificationDismiss = (id: string) => {
  setNotifications(prev => prev.filter(n => n.id !== id));
  showToast({
    type: 'success',
    message: 'Notification dismissed',
    action: { label: 'Undo', handler: () => /* restore */ }
  });
};
```

Render NotificationsHub when view is 'notifications':
```tsx
{currentView === 'notifications' && (
  <NotificationsHub
    notifications={notifications}
    onTap={handleNotificationTap}
    onDismiss={handleNotificationDismiss}
    onOpenSettings={() => setCurrentView('notificationSettings')}
    onBack={() => setCurrentView('focus')}
  />
)}
```

Test validation:
- Hub displays all notification types
- Notifications grouped correctly (Upcoming/Today/Earlier)
- Badge shows unacknowledged count only
- Badge hidden when count is 0
- Tapping notification marks as acknowledged
- Tapping notification navigates to task
- Empty state displays correctly
- Back button works

Let me know when Phase 3 is complete.
```

---

## Phase 4: Notification Settings

```
Phase 4: Notification Settings

Continue from Phase 3. Add settings panel for Start Nudge configuration.

1. Create components/notifications/NotificationSettings.tsx

Props:
```typescript
interface NotificationSettingsProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => void;
  onBack: () => void;
}
```

Layout:
```
┌─────────────────────────────────────┐
│ ← Notification Settings             │
├─────────────────────────────────────┤
│                                     │
│ START NUDGES                        │
│                                     │
│ Enable by default                   │
│ [Routines only            ▼]        │
│ "When Start Nudge is enabled for    │
│ new tasks by default"               │
│                                     │
│ Default buffer                      │
│ [5 minutes                ▼]        │
│ "Extra time added to estimates"     │
│                                     │
├─────────────────────────────────────┤
│ QUIET HOURS (Coming soon)           │
│ [Disabled                      ]    │
└─────────────────────────────────────┘
```

Enable by default dropdown options:
- "All tasks"
- "Routines only" (default)
- "One-off tasks only"
- "None (opt-in per task)"

Default buffer dropdown options:
- "5 minutes" (default)
- "10 minutes"
- "15 minutes"
- "15% of duration"

Styling:
- Section headers: text-xs font-medium text-zinc-500 uppercase mb-3
- Labels: text-sm text-zinc-700 dark:text-zinc-300
- Helper text: text-xs text-zinc-500 mt-1
- Selects: match existing patterns from TaskDetail

2. Update app/page.tsx

Add 'notificationSettings' to view types.

Add settings handlers:
```typescript
const handleUpdateSettings = (updates: Partial<UserSettings>) => {
  setSettings(prev => ({ ...prev, ...updates }));
  // Settings auto-persist via localStorage effect
};
```

Render settings view:
```tsx
{currentView === 'notificationSettings' && (
  <NotificationSettings
    settings={settings}
    onUpdate={handleUpdateSettings}
    onBack={() => setCurrentView('notifications')}
  />
)}
```

3. Update lib/storage.ts

Ensure settings are included in saved state:
```typescript
const stateToSave = {
  // ... existing fields
  settings: state.settings,
  notifications: state.notifications,
};
```

4. Wire settings to Start Nudge calculation

Verify all calculation functions receive settings:
- isStartNudgeEnabled(task, settings)
- calculateStartNudgeTime(task, settings)
- getStartNudgeStatus(task, settings)

Test validation:
- Settings view accessible from hub gear icon
- Enable by default setting persists
- Buffer setting persists
- Changing global default affects new task behavior
- Settings survive page refresh

Let me know when Phase 4 is complete.
```

---

## Phase 5: Notification Scheduling

```
Phase 5: Notification Scheduling

Continue from Phase 4. Implement notification lifecycle management.

1. Add scheduling triggers in app/page.tsx

When task is created/updated:
```typescript
const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
  // ... existing update logic ...
  
  // Reschedule Start Nudge if relevant fields changed
  const relevantFields = [
    'startNudgeOverride',
    'estimatedDurationMinutes',
    'targetDate',
    'deadlineDate',
    'isRecurring',
    'recurrence'
  ];
  
  if (relevantFields.some(f => f in updates)) {
    const updatedTask = tasks.find(t => t.id === taskId);
    if (updatedTask) {
      setNotifications(prev => 
        scheduleStartNudge(updatedTask, settings, prev)
      );
    }
  }
};
```

When recurring instance is completed:
```typescript
const handleRecurringComplete = (task: Task, instanceId: string) => {
  // ... existing completion logic ...
  
  // Schedule next occurrence's Start Nudge
  if (isStartNudgeEnabled(task, settings)) {
    setNotifications(prev => 
      scheduleStartNudge(task, settings, prev)
    );
  }
};
```

2. Add notification firing check

On app mount and focus:
```typescript
useEffect(() => {
  const checkNotifications = () => {
    const now = Date.now();
    const toFire = notifications.filter(n => 
      n.scheduledAt <= now && 
      n.firedAt === null
    );
    
    if (toFire.length > 0) {
      // Mark as fired
      setNotifications(prev => 
        prev.map(n => 
          toFire.some(f => f.id === n.id)
            ? { ...n, firedAt: now }
            : n
        )
      );
      
      // Show toast for most recent
      const latest = toFire[toFire.length - 1];
      showToast({
        type: 'info',
        message: latest.title,
        action: {
          label: 'View',
          handler: () => {
            handleNotificationTap(latest);
          }
        }
      });
    }
  };
  
  // Check on mount
  checkNotifications();
  
  // Check on window focus
  const handleFocus = () => checkNotifications();
  window.addEventListener('focus', handleFocus);
  
  // Check periodically (every minute when app is open)
  const interval = setInterval(checkNotifications, 60000);
  
  return () => {
    window.removeEventListener('focus', handleFocus);
    clearInterval(interval);
  };
}, [notifications, settings]);
```

3. Update scheduleStartNudge utility

Handle recurring tasks:
```typescript
export function scheduleStartNudge(
  task: Task,
  settings: UserSettings,
  notifications: Notification[]
): Notification[] {
  // Remove existing Start Nudge for this task
  const filtered = notifications.filter(n => 
    !(n.type === 'start_nudge' && n.taskId === task.id)
  );
  
  // Check if enabled
  if (!isStartNudgeEnabled(task, settings)) {
    return filtered;
  }
  
  // Calculate nudge time
  const nudgeTime = calculateStartNudgeTime(task, settings);
  if (!nudgeTime) {
    return filtered;
  }
  
  // Don't schedule if in the past (will fire immediately on next check)
  // But do create the notification so it can be fired
  
  // Create notification
  const notification = createNotification(
    'start_nudge',
    task,
    nudgeTime.getTime(),
    task.isRecurring ? getCurrentInstanceId(task) : undefined
  );
  
  return [...filtered, notification];
}
```

4. Handle "running late" case

In notification firing check:
```typescript
if (n.scheduledAt <= now && n.firedAt === null) {
  const minutesLate = Math.floor((now - n.scheduledAt) / 60000);
  
  if (minutesLate > 5) {
    // Modify notification content for "running late"
    n.title = `Running behind: ${originalTitle}`;
    n.body = `Due ${anchorTime} · Started ${minutesLate} min late`;
  }
  
  n.firedAt = now;
}
```

5. Persist notifications

Ensure notifications are saved to localStorage:
```typescript
// In storage effect
useEffect(() => {
  saveState({
    ...state,
    notifications,
    settings,
  });
}, [tasks, projects, focusQueue, notifications, settings, /* etc */]);
```

Test validation:
- Notification created when Start Nudge enabled
- Notification updated when duration/anchor changes
- Notification cancelled when Start Nudge disabled
- Past-due notifications fire on app open
- "Running late" content shows when >5 min late
- Recurring tasks schedule next occurrence after completion
- Notifications persist across sessions

Let me know when Phase 5 is complete.
```

---

## Phase 6: Polish & Edge Cases

```
Phase 6: Polish & Edge Cases

Continue from Phase 5. Handle remaining edge cases and refine UX.

1. AI duration estimation integration

When Start Nudge is enabled but no duration exists:

In StartNudgeField component:
```typescript
const handleToggleEnable = async () => {
  onUpdate({ startNudgeOverride: 'on' });
  
  const duration = getDuration(task);
  if (!duration && onRequestAIEstimate) {
    setIsEstimating(true);
    try {
      const estimate = await onRequestAIEstimate();
      onUpdate({
        estimatedDurationMinutes: estimate,
        estimatedDurationSource: 'ai'
      });
    } catch (error) {
      // Show error, keep toggle on
      console.error('Failed to estimate duration:', error);
    } finally {
      setIsEstimating(false);
    }
  }
};
```

In app/page.tsx, implement AI estimate:
```typescript
const handleRequestAIEstimate = async (task: Task): Promise<number> => {
  // Call existing AI API
  const response = await fetch('/api/structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'estimate_duration',
      task: {
        title: task.title,
        steps: task.steps,
        notes: task.notes
      }
    })
  });
  
  const data = await response.json();
  return data.estimatedMinutes || 30; // fallback
};
```

2. Undo support for notification dismiss

In handleNotificationDismiss:
```typescript
const handleNotificationDismiss = (id: string) => {
  const dismissed = notifications.find(n => n.id === id);
  
  setNotifications(prev => prev.filter(n => n.id !== id));
  
  showToast({
    type: 'success',
    message: 'Notification dismissed',
    action: {
      label: 'Undo',
      handler: () => {
        if (dismissed) {
          setNotifications(prev => [...prev, dismissed]);
        }
      }
    }
  });
};
```

3. Accessibility improvements

In NotificationCard:
```tsx
<button
  onClick={() => onTap(notification)}
  aria-label={`${notification.title}. ${notification.body}. ${isUnread ? 'Unread.' : ''}`}
  className="..."
>
```

In NotificationsHub:
```tsx
<main role="main" aria-label="Notifications">
  <h1 className="sr-only">Notifications</h1>
  {/* sections */}
  <section aria-labelledby="upcoming-heading">
    <h2 id="upcoming-heading">Upcoming</h2>
    {/* cards */}
  </section>
</main>
```

4. Dark mode verification

Ensure all new components have proper dark: variants:
- Backgrounds: bg-zinc-50 → dark:bg-zinc-800/50
- Text: text-zinc-900 → dark:text-zinc-100
- Borders: border-zinc-200 → dark:border-zinc-700
- Icons: text-zinc-500 → dark:text-zinc-400

5. Duration editing

Add duration edit capability in TaskDetail:
```tsx
{task.estimatedDurationMinutes !== null && (
  <div className="flex items-center gap-2">
    <span className="text-sm text-zinc-600 dark:text-zinc-400">
      Duration
    </span>
    <span className="text-sm">
      ~{task.estimatedDurationMinutes} min
      {task.estimatedDurationSource === 'ai' && (
        <span className="text-zinc-400"> (AI)</span>
      )}
    </span>
    <button
      onClick={() => setShowDurationEdit(true)}
      className="text-xs text-violet-600 dark:text-violet-400"
    >
      Edit
    </button>
  </div>
)}
```

Use existing DurationInput component for editing.

6. Clear "(AI)" tag on manual edit

When user manually edits duration:
```typescript
const handleDurationChange = (minutes: number) => {
  handleUpdateTask(task.id, {
    estimatedDurationMinutes: minutes,
    estimatedDurationSource: 'manual'  // Clear AI indicator
  });
};
```

7. Handle step duration changes

When steps with estimates change, recalculate if using steps:
```typescript
const handleStepUpdate = (taskId: string, stepId: string, updates: Partial<Step>) => {
  // ... existing logic ...
  
  // If step duration changed and task uses step-based duration
  if ('estimatedMinutes' in updates) {
    const task = tasks.find(t => t.id === taskId);
    if (task?.estimatedDurationSource === 'steps') {
      // Recalculate and reschedule
      setNotifications(prev => 
        scheduleStartNudge(task, settings, prev)
      );
    }
  }
};
```

Final test validation:
- AI estimates generate when needed
- "(AI)" indicator shows for AI-generated durations
- Manual edit clears AI indicator
- Undo works on dismiss
- Keyboard navigation works in hub
- Screen reader announces notifications correctly
- Dark mode looks correct everywhere
- Step duration changes trigger reschedule

Let me know when Phase 6 is complete.
```

---

## Troubleshooting Guide

### Common Issues

**Issue:** Notifications not appearing
- Check if Start Nudge is enabled for the task
- Verify task has anchor (target/deadline/recurrence)
- Check if duration is available
- Look at browser console for errors

**Issue:** Wrong calculation time
- Verify anchor time resolution (target > deadline)
- Check duration sum includes all steps
- Verify buffer calculation (15% or fixed)
- Check timezone handling

**Issue:** Badge count wrong
- Badge should only count: firedAt !== null AND acknowledgedAt === null
- Scheduled but not fired should NOT count

**Issue:** Dark mode styling broken
- Ensure every bg- has a dark:bg- variant
- Ensure every text- has a dark:text- variant
- Test in both modes after each phase

**Issue:** TypeScript errors after migration
- Run full build to catch type errors
- Check import paths for new files
- Verify interface extensions are compatible

---

## Validation Checklist

After completing all phases:

### Functionality
- [ ] Start Nudge toggle works (On/Off/Default)
- [ ] Calculation displays correctly
- [ ] Missing anchor shows warning
- [ ] Notifications schedule correctly
- [ ] Notifications fire at correct time
- [ ] Badge count is accurate
- [ ] Tapping navigates to task
- [ ] Settings persist
- [ ] Global default affects new tasks
- [ ] Per-task override works
- [ ] AI estimation works
- [ ] Running late content shows

### Edge Cases
- [ ] No anchor → warning, no notification
- [ ] Start time in past → fires immediately
- [ ] No duration → triggers AI estimate
- [ ] Recurring → schedules next occurrence
- [ ] Both reminder and nudge → both fire

### Quality
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Dark mode correct
- [ ] Mobile responsive
- [ ] Accessible with keyboard
- [ ] Screen reader friendly

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01 | Initial prompts document |
