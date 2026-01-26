# Notification Display Refinements — Implementation Spec

## Overview

Phase 2 refinements to the notification system:
1. Differentiate poke (👉🏽 violet) vs reminder (🔔 amber) visuals
2. Support multiple alerts with cycling
3. Sticky banners during AI activity
4. Compact filled button styling (using existing patterns)
5. Focus mode protection

---

## Existing Button Patterns (Reference)

### MiniBar Pills (rounded-full)

| Type | Classes |
|------|---------|
| **Primary (violet)** | `px-3 py-1.5 text-sm font-medium rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/50` |
| **Secondary (zinc)** | `px-3 py-1.5 text-sm rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700` |

### Palette Response Buttons (rounded-lg)

| Type | Classes |
|------|---------|
| **Primary (filled violet)** | `px-4 py-2 text-sm font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700` |
| **Secondary (light violet)** | `px-4 py-2 text-sm font-medium rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40` |
| **Tertiary (ghost)** | `px-4 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800` |

### Current Banner Buttons (text links)

| Type | Classes |
|------|---------|
| **Primary (text)** | `px-2 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-800/30 rounded` |
| **Secondary (text)** | `px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded` |

---

## Button Style Decision

**Banner buttons**: Use compact filled pills (matching MiniBar pattern but smaller)

| Type | Classes |
|------|---------|
| **Poke Primary** | `px-2.5 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/50` |
| **Reminder Primary** | `px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50` |
| **Secondary (both)** | `px-2.5 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700` |
| **More menu (···)** | `p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800` |

---

## Data Model Changes

### New Types (`lib/notification-types.ts`)

```typescript
// Add reminder alert type (parallel to StartPokeAlert)
export interface ReminderAlert {
  taskId: string;
  taskTitle: string;
  notificationId: string;
  reminderTime: number;  // When reminder was set to fire
  onView: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

// Unified alert type for cycling
export type ActiveAlert =
  | { type: 'poke'; data: StartPokeAlert }
  | { type: 'reminder'; data: ReminderAlert };
```

### State Changes (`lib/ai-types.ts`)

```typescript
// Update CollapsedContent to support multiple alerts
export interface CollapsedContent {
  type: CollapsedContentType;
  text: string;
  // ... existing fields ...

  // Multiple alerts support
  alerts?: ActiveAlert[];
  currentAlertIndex?: number;
}
```

---

## Component Changes

### 1. MiniBarContent.tsx

**Changes:**
- Replace `BellRing` icon with `👉🏽` emoji for pokes
- Add `Bell` icon for reminders
- Support alert cycling with count indicator
- Add amber styling for reminders

**Updated Icon Section:**
```tsx
{/* Icon based on alert type */}
{isStartPoke ? (
  <span className="text-base leading-none">👉🏽</span>
) : isReminder ? (
  <Bell size={18} className="text-amber-500 dark:text-amber-400" />
) : (
  <Sparkles size={18} className="text-violet-500 dark:text-violet-400" />
)}
```

**Updated Button Section (poke):**
```tsx
{isStartPoke && onStartPokeAction && (
  <div className="flex items-center gap-1.5">
    <button
      onClick={(e) => { e.stopPropagation(); onStartPokeAction(); }}
      className="px-2.5 py-1 text-xs font-medium rounded-full
        bg-violet-100 dark:bg-violet-900/40
        text-violet-700 dark:text-violet-300
        hover:bg-violet-200 dark:hover:bg-violet-800/50
        transition-colors"
    >
      Start
    </button>
    {alertCount > 1 && (
      <button
        onClick={(e) => { e.stopPropagation(); onCycleAlert?.(); }}
        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ({currentAlertIndex + 1}/{alertCount})
      </button>
    )}
  </div>
)}
```

**New Reminder Button:**
```tsx
{isReminder && onReminderAction && (
  <div className="flex items-center gap-1.5">
    <button
      onClick={(e) => { e.stopPropagation(); onReminderAction(); }}
      className="px-2.5 py-1 text-xs font-medium rounded-full
        bg-amber-100 dark:bg-amber-900/40
        text-amber-700 dark:text-amber-300
        hover:bg-amber-200 dark:hover:bg-amber-800/50
        transition-colors"
    >
      View
    </button>
    {alertCount > 1 && (
      <button
        onClick={(e) => { e.stopPropagation(); onCycleAlert?.(); }}
        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ({currentAlertIndex + 1}/{alertCount})
      </button>
    )}
  </div>
)}
```

### 2. PaletteContent.tsx

**Changes:**
- Make alert banners sticky (show during AI activity)
- Support multiple alerts with cycling
- Update poke banner to use 👉🏽 emoji
- Add reminder banner with 🔔 and amber styling
- Use compact filled buttons

**New Props:**
```typescript
interface PaletteContentProps {
  // ... existing props ...

  // Replace single alert with array
  activeAlerts?: ActiveAlert[];
  currentAlertIndex?: number;
  onCycleAlert?: () => void;
}
```

**Sticky Banner Container (new, at top):**
```tsx
{/* Alert banners - sticky, visible even during AI activity */}
{activeAlerts && activeAlerts.length > 0 && (() => {
  const current = activeAlerts[currentAlertIndex ?? 0];
  const total = activeAlerts.length;

  if (current.type === 'poke') {
    return <PokeBanner alert={current.data} total={total} index={currentAlertIndex} onCycle={onCycleAlert} />;
  } else {
    return <ReminderBanner alert={current.data} total={total} index={currentAlertIndex} onCycle={onCycleAlert} />;
  }
})()}
```

**Poke Banner (updated styling):**
```tsx
<div className="px-3 py-2 mb-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-lg">
  {/* Header: emoji + title + due time + count */}
  <div className="flex items-start gap-2">
    <span className="flex-shrink-0 text-sm mt-0.5">👉🏽</span>
    <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">
      "{taskTitle}"
    </span>
    <span className="flex-shrink-0 text-xs text-zinc-500">
      Due {dueTimeStr}
    </span>
    {total > 1 && (
      <button
        onClick={onCycle}
        className="flex-shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ({index + 1}/{total})
      </button>
    )}
  </div>

  {/* Duration breakdown */}
  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-6">
    ~{durationMinutes}m + {bufferMinutes}m buffer
  </div>

  {/* Actions - compact filled buttons */}
  <div className="flex items-center gap-1.5 mt-2 ml-6">
    <button
      onClick={onStart}
      className="px-2.5 py-1 text-xs font-medium rounded-full
        bg-violet-100 dark:bg-violet-900/40
        text-violet-700 dark:text-violet-300
        hover:bg-violet-200 dark:hover:bg-violet-800/50
        transition-colors"
    >
      Start
    </button>
    <button
      onClick={() => onSnooze(5)}
      className="px-2.5 py-1 text-xs rounded-full
        bg-zinc-100 dark:bg-zinc-800
        text-zinc-600 dark:text-zinc-400
        hover:bg-zinc-200 dark:hover:bg-zinc-700
        transition-colors"
    >
      Snooze
    </button>
    <button
      onClick={onShowMore}
      className="p-1 rounded-full
        text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300
        hover:bg-zinc-100 dark:hover:bg-zinc-800
        transition-colors"
      aria-label="More options"
    >
      <MoreHorizontal size={14} />
    </button>
  </div>
</div>
```

**Reminder Banner (new):**
```tsx
<div className="px-3 py-2 mb-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
  {/* Header: bell + title + count */}
  <div className="flex items-start gap-2">
    <span className="flex-shrink-0 text-sm mt-0.5">🔔</span>
    <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">
      Reminder: "{taskTitle}"
    </span>
    {total > 1 && (
      <button
        onClick={onCycle}
        className="flex-shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ({index + 1}/{total})
      </button>
    )}
  </div>

  {/* Helper text */}
  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-6">
    You asked to be reminded
  </div>

  {/* Actions - compact filled buttons */}
  <div className="flex items-center gap-1.5 mt-2 ml-6">
    <button
      onClick={onView}
      className="px-2.5 py-1 text-xs font-medium rounded-full
        bg-amber-100 dark:bg-amber-900/40
        text-amber-700 dark:text-amber-300
        hover:bg-amber-200 dark:hover:bg-amber-800/50
        transition-colors"
    >
      View
    </button>
    <button
      onClick={() => onSnooze(5)}
      className="px-2.5 py-1 text-xs rounded-full
        bg-zinc-100 dark:bg-zinc-800
        text-zinc-600 dark:text-zinc-400
        hover:bg-zinc-200 dark:hover:bg-zinc-700
        transition-colors"
    >
      Snooze
    </button>
    <button
      onClick={onShowMore}
      className="p-1 rounded-full
        text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300
        hover:bg-zinc-100 dark:hover:bg-zinc-800
        transition-colors"
      aria-label="More options"
    >
      <MoreHorizontal size={14} />
    </button>
  </div>
</div>
```

**Sticky During AI Activity:**
```tsx
{/* Banner container - always visible, even during loading/response */}
<div className="flex-shrink-0">
  {activeAlerts && activeAlerts.length > 0 && (
    <AlertBanner ... />
  )}
</div>

{/* Rest of content (scrollable) */}
<div className="relative flex-1 min-h-0 mb-4">
  {/* Quick actions / loading / response */}
</div>
```

### 3. AIDrawer.tsx (if exists)

**Changes:**
- Add same sticky banner at top of drawer
- Banners persist through conversation history scroll

### 4. page.tsx

**Changes:**
- Aggregate all active alerts (pokes + reminders)
- Manage cycling state
- Filter alerts based on focus mode
- Pass unified alert data to AI components

**New State:**
```typescript
const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

// Aggregate active alerts
const activeAlerts = useMemo(() => {
  const alerts: ActiveAlert[] = [];

  // Get fired pokes
  const activePokes = getActiveStartPokes(notifications, state.tasks);
  for (const poke of activePokes) {
    // Skip if in focus mode and not for focused task
    if (focusModeState.active && poke.taskId !== focusModeState.taskId) {
      continue;
    }
    alerts.push({ type: 'poke', data: poke });
  }

  // Get fired reminders
  const activeReminders = getActiveReminders(notifications, state.tasks);
  for (const reminder of activeReminders) {
    // Skip if in focus mode and not for focused task
    if (focusModeState.active && reminder.taskId !== focusModeState.taskId) {
      continue;
    }
    alerts.push({ type: 'reminder', data: reminder });
  }

  return alerts;
}, [notifications, state.tasks, focusModeState]);

// Reset index when alerts change
useEffect(() => {
  if (currentAlertIndex >= activeAlerts.length) {
    setCurrentAlertIndex(0);
  }
}, [activeAlerts.length, currentAlertIndex]);

const handleCycleAlert = () => {
  setCurrentAlertIndex((prev) => (prev + 1) % activeAlerts.length);
};
```

### 5. notification-utils.ts

**New Functions:**
```typescript
// Get all active (fired, unacknowledged) start pokes
export function getActiveStartPokes(
  notifications: Notification[],
  tasks: Task[]
): StartPokeAlert[] {
  return notifications
    .filter(n =>
      n.type === 'start_poke' &&
      n.firedAt !== null &&
      n.acknowledgedAt === null
    )
    .map(n => {
      const task = tasks.find(t => t.id === n.taskId);
      if (!task) return null;
      // Build StartPokeAlert object
      return { ... };
    })
    .filter(Boolean);
}

// Get all active (fired, unacknowledged) reminders
export function getActiveReminders(
  notifications: Notification[],
  tasks: Task[]
): ReminderAlert[] {
  return notifications
    .filter(n =>
      n.type === 'reminder' &&
      n.firedAt !== null &&
      n.acknowledgedAt === null
    )
    .map(n => {
      const task = tasks.find(t => t.id === n.taskId);
      if (!task) return null;
      // Build ReminderAlert object
      return { ... };
    })
    .filter(Boolean);
}
```

### 6. NotificationCard.tsx & NotificationsHub.tsx

**Changes:**
- Update poke cards to use 👉🏽 emoji
- Update reminder cards to use 🔔 emoji
- Apply consistent color theming

---

## Visual Summary

### MiniBar States

**Poke:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 👉🏽  Start "Prep presentation" by 2:00 PM    [Start]    (1/2) │
└─────────────────────────────────────────────────────────────────┘
```

**Reminder:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔔  Reminder: "Call dentist"                  [View]     (2/2) │
└─────────────────────────────────────────────────────────────────┘
```

### Palette Banner (Poke)

```
┌─────────────────────────────────────────────────────────────────┐
│ 👉🏽 "Prep presentation"              Due 2:00 PM       (1/2) │
│ ~45m + 10m buffer                                               │
│                                                                 │
│ [Start]  [Snooze]  [···]                                       │
└─────────────────────────────────────────────────────────────────┘
   violet    zinc     zinc
   filled    filled   icon
```

### Palette Banner (Reminder)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔔 Reminder: "Call dentist"                             (2/2) │
│ You asked to be reminded                                        │
│                                                                 │
│ [View]   [Snooze]  [···]                                       │
└─────────────────────────────────────────────────────────────────┘
   amber     zinc     zinc
   filled    filled   icon
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `lib/notification-types.ts` | Add `ReminderAlert`, `ActiveAlert` types |
| `lib/ai-types.ts` | Update `CollapsedContent` for multiple alerts |
| `lib/notification-utils.ts` | Add `getActiveStartPokes()`, `getActiveReminders()` |
| `components/ai-assistant/MiniBarContent.tsx` | Emoji icons, reminder support, cycling UI |
| `components/ai-assistant/PaletteContent.tsx` | Sticky banners, reminder banner, compact buttons, cycling |
| `components/notifications/NotificationCard.tsx` | Emoji icons, color theming |
| `components/notifications/NotificationsHub.tsx` | Badge count support |
| `app/page.tsx` | Alert aggregation, cycling state, focus mode filtering |

---

## Implementation Order

1. **Types first** — Add new types to `notification-types.ts` and `ai-types.ts`
2. **Utilities** — Add `getActiveStartPokes()` and `getActiveReminders()`
3. **MiniBar** — Update icon, add reminder support, add cycling
4. **Palette** — Make banners sticky, add reminder banner, update buttons
5. **Hub** — Update card styling
6. **page.tsx** — Wire up alert aggregation and cycling state
7. **Testing** — Verify all states and interactions

---

## Testing Checklist

### Poke Display
- [ ] Shows 👉🏽 emoji in MiniBar
- [ ] Shows 👉🏽 emoji in Palette banner
- [ ] Shows 👉🏽 emoji in Hub
- [ ] Violet color theme throughout
- [ ] "Start" button works (enters focus mode)
- [ ] Snooze works (reschedules notification)
- [ ] Dismiss works (marks acknowledged)

### Reminder Display
- [ ] Shows 🔔 emoji in MiniBar
- [ ] Shows 🔔 emoji in Palette banner
- [ ] Shows 🔔 emoji in Hub
- [ ] Amber color theme throughout
- [ ] "View" button works (opens task detail)
- [ ] Snooze works
- [ ] Dismiss works

### Multiple Alerts
- [ ] Count indicator shows `(1/2)` format
- [ ] Tapping count cycles to next alert
- [ ] Cycling wraps around
- [ ] Index resets when alerts clear

### Sticky Banners
- [ ] Banner visible while AI is loading
- [ ] Banner visible while AI response is displayed
- [ ] Banner visible in AI Drawer
- [ ] Can still interact with banner during AI activity

### Focus Mode Protection
- [ ] Only focused task alerts show in focus mode
- [ ] Other task alerts go to Hub silently
- [ ] Badge count increments for suppressed alerts

### Button Styling
- [ ] Poke primary: violet filled pill
- [ ] Reminder primary: amber filled pill
- [ ] Secondary: zinc filled pill
- [ ] More menu: icon button
- [ ] All buttons have proper hover states
- [ ] Dark mode looks correct

---

*Last updated: January 2026*
