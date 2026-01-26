# Notifications System

## Overview

The notifications system provides time-sensitive alerts to help users start tasks on time and remember important items. It operates across two parallel tracks (in-app and PWA) and surfaces alerts through multiple UI touchpoints.

---

## Notification Types

### Start Time Poke

**Purpose**: AI-powered "time to act" notification that calculates when to start a task to finish on time.

**Mental Model**: "The system is helping me manage time"

**Visual Identity**:
| Element | Value |
|---------|-------|
| Emoji | 👉🏽 (pointing hand) |
| Icon | Emoji used as icon (no Lucide equivalent) |
| Color | Violet (`violet-500`, `violet-50/900` backgrounds) |
| Primary Action | "Start" (enters focus mode) |

**Calculation**: `Poke Time = Anchor Time - Duration - Buffer`
- **Anchor**: Deadline > Target date > Recurring due time
- **Duration**: Manual estimate > AI estimate > Sum of step estimates
- **Buffer**: Fixed minutes or 15% of duration (user setting)

**Message Format**:
- MiniBar: `👉🏽 Start "Task title" by 2:00 PM`
- Palette: Task title + due time + duration breakdown
- PWA: `👉🏽 Time to start: Task title`

### Reminder

**Purpose**: User-set "don't forget" notification at a specific time.

**Mental Model**: "I'm helping myself remember"

**Visual Identity**:
| Element | Value |
|---------|-------|
| Emoji | 🔔 |
| Icon | `Bell` or `BellRing` (Lucide) |
| Color | Amber (`amber-500`, `amber-50/900` backgrounds) |
| Primary Action | "View" (opens task detail) |

**Trigger Types**:
- **Relative**: "1 hour before deadline", "1 day before target"
- **Absolute**: Specific date/time

**Message Format**:
- MiniBar: `🔔 Reminder: "Task title"`
- Palette: Task title + "You asked to be reminded"
- PWA: `🔔 Reminder: Task title`

---

## Display Surfaces

### MiniBar (Collapsed)

Single-line alert at bottom of screen, always visible.

```
┌─────────────────────────────────────────────────────────────────┐
│ 👉🏽  Start "Prep presentation" by 2:00 PM           [Start]    │
└─────────────────────────────────────────────────────────────────┘
```

**Content Priority** (highest to lowest):
1. Start Poke (active, fired)
2. Reminder (active, fired)
3. Nudge (awareness items)
4. Contextual prompt
5. AI states (loading, response, suggestions)
6. Idle ("Ask AI...")

**Multiple Alerts**: Cycle through with count indicator `(1/2)`, manual tap to switch.

### Palette (Expanded)

Sticky banner at top of palette, persists during AI conversation.

```
┌─────────────────────────────────────────────────────────────────┐
│ 👉🏽 "Prep presentation"                        Due 2:00 PM     │
│ ~45 min + 10 min buffer                                (1/2)   │
│                                        [Start]  [Snooze]  [···] │
└─────────────────────────────────────────────────────────────────┘
```

**Button Styling**: Compact filled buttons
- Primary: Violet filled (`bg-violet-100 text-violet-700`)
- Secondary: Zinc filled (`bg-zinc-100 text-zinc-700`)
- Overflow: `···` icon button for less common actions (Dismiss, Snooze options)

### AI Drawer

Same sticky banner at top, persists through conversation history.

### Notifications Hub

Historical ledger of all notifications (upcoming + fired).

**Sections**:
- **Upcoming**: Scheduled but not yet fired
- **Today**: Fired today
- **Yesterday**: Fired yesterday
- **Earlier**: Older notifications

**Card Display**:
```
┌─────────────────────────────────────────────────────────────────┐
│ 👉🏽  Start "Prep presentation" by 2:00 PM                      │
│     Fired 1:15 PM · ~45 min task                    [Dismiss]  │
└─────────────────────────────────────────────────────────────────┘
```

**State Indicators**:
- Unread dot: `firedAt !== null && acknowledgedAt === null`
- Dismiss button: Only shown for unread
- Left border: Type-specific color (violet for poke, amber for reminder)

### Task Row Indicators

**Reminder Set** (not yet fired):
```
┌─────────────────────────────────────────────────────────────────┐
│ ○ Call dentist                              🔔  Tomorrow 9am   │
└─────────────────────────────────────────────────────────────────┘
```
- `Bell` icon (Lucide), muted zinc color

**Poke Enabled**: Shown in TaskDetail's StartPokeField, not on task rows.

---

## Focus Mode Behavior

**Principle**: Protect the user's flow state.

| Alert For | Behavior | Rationale |
|-----------|----------|-----------|
| Focused task | Show in MiniBar/Palette | Directly relevant |
| Other task | Silent → Hub + badge | Protect concentration |

Badge count increments silently; user sees it when exiting focus mode.

---

## Architecture

### Dual-Track System (Current)

Two independent notification systems that don't share state:

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│   PWA Track                 │    │   In-App Track              │
│   lib/notifications.ts      │    │   lib/notification-utils.ts │
├─────────────────────────────┤    ├─────────────────────────────┤
│ Browser Notification API    │    │ Notification[] state array  │
│ setTimeout timers           │    │ 60s polling + focus event   │
│ Works when backgrounded     │    │ Requires app to be running  │
│ System notification popup   │    │ MiniBar + Palette + Hub     │
└─────────────────────────────┘    └─────────────────────────────┘
```

**Storage Keys**:
| Key | Contents | System |
|-----|----------|--------|
| `task-copilot-scheduled-start-pokes` | PWA poke timers | PWA |
| `task-copilot-scheduled-reminders` | PWA reminder timers | PWA |
| `focus-tools-notifications` | Full notification objects | In-App |

**Known Limitation**: Same notification can fire twice (PWA + in-app) if app is open. Dismissing one doesn't affect the other.

### Notification Lifecycle

```
Scheduled                    Fired                      Acknowledged
(scheduledAt set,    →    (firedAt set,         →    (acknowledgedAt set,
 firedAt null)             acknowledgedAt null)        visible in history)
```

**Cleanup**:
- Task completed → notification removed
- 7+ days old acknowledged → cleaned up
- Cancelled → removed from array

---

## Roadmap

### Phase 1: Current State (Ship It) ✅

- Dual-track notifications (PWA + in-app)
- Start Time Poke with calculation logic
- Reminders with relative/absolute times
- Hub for notification history
- MiniBar/Palette display
- Focus mode protection

**Acceptable tradeoffs**:
- Double notification edge case (minor annoyance)
- No sync between PWA dismiss and in-app state
- Hub may not be highly discoverable

### Phase 2: Display Refinements

**Goals**: Polish the in-app experience

**Changes**:
- [ ] Sticky banners during AI conversation
- [ ] Multiple alert cycling with count indicator
- [ ] Compact filled button styling
- [ ] Differentiated poke (👉🏽 violet) vs reminder (🔔 amber) visuals
- [ ] Badge count on Notifications nav item
- [ ] Hub discoverability improvements

**No architectural changes** — same dual-track system.

### Phase 3: Unified Display Layer

**Goals**: Single source of truth, reduce double-notification

**Architecture**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Single Source: notifications[] array (localStorage)            │
│                                                                 │
│ PWA Layer:                                                     │
│   - Reads from array                                           │
│   - Shows system notification when due                         │
│   - Posts message to client on click/dismiss                   │
│                                                                 │
│ In-App Layer:                                                  │
│   - Reads from same array                                      │
│   - Shows MiniBar/Palette/Hub                                  │
│   - Listens for SW messages, updates acknowledgedAt            │
└─────────────────────────────────────────────────────────────────┘
```

**Key Changes**:
- [ ] Service worker ↔ client message bus
- [ ] PWA dismiss updates in-app state
- [ ] Deduplication: check if already shown before firing
- [ ] Unified notification ID across both systems

**Deciding Factors**:
- User complaints about double notifications
- Need for reliable dismiss sync
- Complexity budget available

### Phase 4: Smart Delivery

**Goals**: Right notification at the right time via right channel

**Logic**:
```
If app is active + visible:
  → In-app only (suppress system notification)

If app is backgrounded:
  → PWA system notification
  → On click, mark in-app as acknowledged

If app is closed:
  → PWA notification from service worker
  → On app open, hydrate from localStorage
```

**Key Changes**:
- [ ] Visibility API check before firing
- [ ] Conditional PWA vs in-app delivery
- [ ] "App is active" detection in service worker

**Deciding Factors**:
- Battery/performance concerns
- User preference for notification style
- Need for quiet hours / DND support

### Phase 5: Platform Expansion

**Goals**: Native notification capabilities

**Options**:

| Platform | Approach |
|----------|----------|
| **Native wrapper** (Capacitor/Tauri) | Use native notification APIs, rich actions, app icon badge |
| **Web Push** | True background notifications without app open |
| **Desktop** (Electron) | System tray integration, native notifications |

**Deciding Factors**:
- Platform expansion plans
- Need for true background notifications
- User base distribution (mobile vs desktop)

### Phase 6: Advanced Features

**Potential Enhancements**:

| Feature | Description |
|---------|-------------|
| **Quiet hours** | Suppress notifications during sleep/focus time |
| **Snooze options** | 5m, 15m, 1h, "Until tomorrow", custom |
| **Notification grouping** | Batch multiple alerts into summary |
| **Priority levels** | Urgent (break through DND) vs normal |
| **Recurring poke patterns** | Learn optimal poke timing per user |
| **Cross-device sync** | Dismiss on phone, cleared on desktop |
| **Calendar integration** | Poke timing aware of calendar conflicts |

---

## Considerations & Concerns

### Technical

| Concern | Implication | Mitigation |
|---------|-------------|------------|
| Service Worker complexity | Hard to debug, slow update cycles | Thorough testing, staged rollout |
| localStorage limits | 5-10MB typical | Notifications are small; cleanup old |
| Cross-tab sync | Multiple tabs could create duplicates | Use `BroadcastChannel` or leader election |
| Offline behavior | Notification fires while offline | Queue and fire on reconnect |
| Battery/performance | Frequent polling drains battery | 60s interval is light; don't reduce |

### UX

| Concern | Implication | Mitigation |
|---------|-------------|------------|
| Notification fatigue | Too many alerts = ignored | Smart defaults, easy snooze/dismiss |
| Double notifications | Confusing/annoying | Phase 3 unification |
| Hub discoverability | Users don't find notification history | Badge count, prominent nav placement |
| Poke vs Reminder confusion | Two similar concepts | Clear visual differentiation |

### Privacy

| Concern | Implication | Mitigation |
|---------|-------------|------------|
| Task titles in system notifications | Visible on lock screen | Option to hide sensitive content |
| Notification history | Records task activity | 7-day auto-cleanup, export/delete |

---

## Icon & Emoji Reference

| Type | Emoji | Lucide Icon | Color | Usage |
|------|-------|-------------|-------|-------|
| **Poke** | 👉🏽 | (none) | Violet | MiniBar, Palette, Hub, PWA |
| **Reminder** | 🔔 | `Bell`, `BellRing` | Amber | MiniBar, Palette, Hub, PWA, task rows |
| **Scheduled** | — | `Clock` | Zinc | Hub "upcoming" indicator |
| **Unread** | — | (blue dot) | Blue | Hub unread state |

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/notification-types.ts` | Type definitions |
| `lib/notification-utils.ts` | In-app notification lifecycle |
| `lib/notifications.ts` | PWA notification scheduling |
| `lib/start-poke-utils.ts` | Poke calculation logic |
| `components/notifications/NotificationsHub.tsx` | Hub view |
| `components/notifications/NotificationCard.tsx` | Individual notification card |
| `components/notifications/NotificationSettings.tsx` | Settings UI |
| `components/task-detail/StartPokeField.tsx` | Per-task poke control |
| `components/shared/ReminderPicker.tsx` | Reminder time picker |
| `components/ai-assistant/MiniBarContent.tsx` | MiniBar rendering |
| `components/ai-assistant/PaletteContent.tsx` | Palette banner rendering |
| `public/sw.js` | Service worker notification handling |
| `app/page.tsx` | State management, firing logic |

---

*Last updated: January 2026*
