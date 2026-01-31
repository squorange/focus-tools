# Nudge System — Implementation Progress

> **Last Updated:** 2026-01-29
> **Current Phase:** Phase 7 Complete - Nudge System MVP Done

---

## Phase Summary

| Phase | Focus | Status | Started | Completed |
|-------|-------|--------|---------|-----------|
| **0** | Task Details Refactor | ✅ Complete | 2026-01-28 | 2026-01-28 |
| **1** | Data Model | ✅ Complete | 2026-01-29 | 2026-01-29 |
| **2** | Priority Calculation | ✅ Complete | 2026-01-29 | 2026-01-29 |
| **3** | Priority Queue View + Fields UI | ✅ Complete | 2026-01-29 | 2026-01-29 |
| **4** | Start Nudge Updates | ✅ Complete | 2026-01-29 | 2026-01-29 |
| **5** | Orchestrator | ✅ Complete | 2026-01-29 | 2026-01-29 |
| **6** | Energy System | ✅ Complete | 2026-01-29 | 2026-01-29 |
| **7** | Settings & Polish | ✅ Complete | 2026-01-29 | 2026-01-29 |

---

## Phase 0: Task Details Refactor ✅

**Status:** Complete

**Summary:** Reorganized TaskDetail into sectioned layout (Basics, Timing, Levels, Reminders) with pills and priority display placeholder.

**Key Files Created:**
- `components/task-detail/DetailsSection.tsx`
- `components/shared/DetailsPill.tsx`
- `components/shared/PriorityDisplay.tsx`
- `components/shared/PriorityBreakdownDrawer.tsx`

**See:** `PHASE_0_PROGRESS.md` for detailed session notes.

---

## Phase 1: Data Model ✅

**Status:** Complete

**Summary:** Added all data model extensions for importance, energy, lead time, and nudge settings.

### Changes Made

**Schema Version:** 13 → 14

**New Types (`lib/types.ts`):**
```typescript
ImportanceLevel = 'must_do' | 'should_do' | 'could_do' | 'would_like_to'
EnergyType = 'energizing' | 'neutral' | 'draining'
EnergyLevel = 'high' | 'medium' | 'low'
PriorityTier = 'critical' | 'high' | 'medium' | 'low'
```

**Task Interface Extensions:**
| Field | Type | Purpose |
|-------|------|---------|
| `importance` | `ImportanceLevel \| null` | User-set importance level |
| `importanceSource` | `'self' \| 'partner' \| null` | Who set the importance |
| `importanceNote` | `string \| null` | Optional context |
| `energyType` | `EnergyType \| null` | How task feels emotionally |
| `leadTimeDays` | `number \| null` | Calendar runway needed |
| `leadTimeSource` | `'manual' \| 'ai' \| null` | Who set lead time |

**UserSettings Extensions:**
| Field | Type | Default |
|-------|------|---------|
| `quietHoursEnabled` | `boolean` | `false` |
| `quietHoursStart` | `string \| null` | `'22:00'` |
| `quietHoursEnd` | `string \| null` | `'07:00'` |
| `nudgeCooldownMinutes` | `number` | `15` |

**AppState Extensions:**
| Field | Type | Purpose |
|-------|------|---------|
| `currentEnergy` | `EnergyLevel \| null` | User's current energy level |
| `currentEnergySetAt` | `number \| null` | When energy was last set |

**Migration:** `migrateToV14()` in `lib/storage.ts`

---

## Phase 2: Priority Calculation ✅

**Status:** Complete

**Summary:** Implemented complete priority scoring system with 64 passing unit tests.

### Checklist

- [x] Create priority utils file (`lib/priority.ts`)
- [x] Implement `getEffectiveDeadline(task)` - with local timezone parsing fix
- [x] Implement component score functions:
  - [x] `getImportanceScore(importance)` - 25/15/5/0/10 for must_do/should_do/could_do/would_like_to/null
  - [x] `getTimePressureScore(task)` - 40/35/15/5/0 for past/today/week/month/far
  - [x] `getSourceScore(task)` - 20/15/0 for partner/external/self
  - [x] `getStalenessScore(updatedAt)` - 15/8/0 for >14d/7-14d/<7d
  - [x] `getDeferScore(deferredCount)` - 10/5/0 for 3+/1-2/0 defers
  - [x] `getStreakRiskScore(task)` - 12/6/0 for >7d/3-7d/<3d streak
  - [x] `getEnergyMatchScore(taskEnergy, userEnergy)` - +8/-5/0 for match/mismatch/neutral
- [x] Implement `calculatePriorityScore(task, userEnergy)` - sums all component scores
- [x] Implement `getPriorityTier(score)` - critical(60+)/high(40-59)/medium(20-39)/low(0-19)
- [x] Implement `getTaskPriorityInfo(task, userEnergy)` - returns score, tier, effectiveDeadline, breakdown
- [x] Add unit tests - 64 tests, all passing
- [x] Update PriorityBreakdownDrawer with real calculations

### Key Files

| File | Purpose |
|------|---------|
| `lib/priority.ts` | Priority calculation utilities |
| `lib/priority.test.ts` | Unit tests (run with `npx tsx lib/priority.test.ts`) |
| `components/shared/PriorityBreakdownDrawer.tsx` | Updated to use real calculations |
| `components/shared/PriorityDisplay.tsx` | Updated to import PriorityTier from lib/types |

### Display Helper Functions

Also implemented for UI:
- `getImportanceLabel(importance)` - "Must Do", "Should Do", etc.
- `getEnergyTypeLabel(energyType)` - "Energizing", "Neutral", "Draining"
- `getPriorityTierLabel(tier)` - "Critical", "High", "Medium", "Low"
- `getBreakdownDescription(task, userEnergy)` - human-readable factor descriptions

---

## Phase 3: Priority Queue View + Fields UI ✅

**Status:** Complete

**Summary:** Added Priority Queue tab to NotificationsHub and input pickers for importance, energy type, and lead time in Task Detail.

### Completed Work

**Priority Queue:**
- Added `PriorityQueueModule` component to NotificationsHub
- Two-tab layout: Priority | Notifications (with badge count)
- Tasks grouped by tier (Critical/High/Medium/Low)
- Collapsible tier sections with task counts
- Task cards show title, priority score, step progress, deadline
- Tapping task navigates to Task Detail

**Data Layer (lib/priority.ts):**
- `getTasksForPriorityQueue(tasks, userEnergy)` - filters and sorts tasks
- `groupTasksByTier(tasks)` - groups by priority tier
- `getTierColors(tier)` - color scheme for each tier

**Input Pickers:**
- `ImportancePicker` - Must Do / Should Do / Could Do / Would Like To / Not Set
- `EnergyTypePicker` - Energizing / Neutral / Draining / Not Set
- `LeadTimePicker` - Preset options (1d, 2d, 3d, 1w, 2w, 1m) + custom days

**DetailsSection Updates:**
- Importance and Energy pills now show current values
- Lead time pill shows "Xd lead" when set
- All pickers integrated with centralized drawer management
- Added 'importance', 'energy', 'leadTime' to DrawerType

### Key Files

| File | Purpose |
|------|---------|
| `components/notifications/PriorityQueueModule.tsx` | Priority Queue UI |
| `components/notifications/NotificationsHub.tsx` | Updated with tabs |
| `components/shared/ImportancePicker.tsx` | Importance selection |
| `components/shared/EnergyTypePicker.tsx` | Energy type selection |
| `components/shared/LeadTimePicker.tsx` | Lead time selection |
| `components/task-detail/DetailsSection.tsx` | Integrated pickers |
| `lib/types.ts` | Added DrawerType values |
| `lib/priority.ts` | Added queue data layer functions |

---

## Phase 4: Start Nudge Updates ✅

**Status:** Complete

**Summary:** Added runway nudge notification type that fires 1 day before effective deadline (deadline - leadTimeDays). Execution nudge (start_poke) continues using raw deadline.

### Completed Work

**New Types (`lib/notification-types.ts`):**
- Added `'runway_nudge'` to `NotificationType`
- Added `RunwayNudgeAlert` interface with effectiveDeadline, actualDeadline, leadTimeDays
- Updated `ActiveAlert` union to include runway type

**Runway Nudge Calculation (`lib/start-poke-utils.ts`):**
- `getEffectiveDeadlineTimestamp(task)` - calculates effective deadline (deadline - leadTimeDays)
- `calculateRunwayNudgeTime(task)` - returns nudge time (1 day before effective deadline at 9 AM)
- `isRunwayNudgeApplicable(task)` - checks if task has leadTimeDays > 0 and deadline
- `getRunwayNudgeStatus(task)` - full status object for UI
- `formatRunwayNudgeMessage(task)` - human-readable message

**Notification Scheduling (`lib/notification-utils.ts`):**
- `scheduleRunwayNudge(task, notifications)` - schedules runway nudge
- `cancelRunwayNudge(taskId, notifications)` - cancels runway nudge
- `updateRunwayNudge(task, notifications)` - re-schedules when task changes
- `scheduleAllNudges(task, settings, notifications)` - convenience function for both nudge types
- Updated `getIconForType()` to return 'clock' for runway_nudge

**UI Banner (`components/ai-assistant/PaletteContent.tsx`):**
- Added runway nudge banner (amber themed, different from poke violet)
- Shows lead time context: "3d lead time — start by Mon Jan 27 to finish on time"
- Actions: View Task, Snooze 1h, Dismiss

### Key Distinction

| Nudge Type | Purpose | Fires When | Message |
|------------|---------|------------|---------|
| `start_poke` | Execution reminder | anchor - (duration + buffer) | "Time to start — Start now" |
| `runway_nudge` | Planning reminder | 1 day before effective deadline | "Start soon — Start by X to finish on time" |

**Example:**
Task due Jan 30, lead time = 3 days, duration = 2 hours
- Effective deadline: Jan 27
- Runway nudge fires: Jan 26 at 9 AM ("Start by Sat Jan 27")
- Start poke fires: Jan 30 at ~3 PM (2h + buffer before 5 PM deadline)

---

## Phase 5: Orchestrator ✅

**Status:** Complete

**Summary:** Implemented B+C hybrid orchestrator with deduplication, priority ordering, and quiet hours support.

### Completed Work

**Schema Version:** 14 → 15

**New Types (`lib/types.ts`):**
```typescript
interface NudgeTracker {
  lastNudgeByTask: Record<string, number>;   // taskId -> last nudge timestamp
  lastNudgeByType: Record<string, number>;   // notificationType -> last nudge timestamp
}
```

**AppState Extension:**
| Field | Type | Purpose |
|-------|------|---------|
| `nudgeTracker` | `NudgeTracker` | Tracks last nudge time per task for deduplication |

**Orchestrator Functions (`lib/nudge-orchestrator.ts`):**

*Deduplication Layer:*
- `createNudgeTracker()` - creates empty tracker
- `isInCooldown(notification, tracker, cooldownMinutes)` - checks if task is in cooldown
- `recordNudgeFired(notification, tracker)` - records nudge was fired
- `cleanupNudgeTracker(tracker)` - removes entries older than 24h

*Quiet Hours:*
- `isInQuietHours(settings)` - checks if current time is in quiet hours (handles overnight ranges)
- `shouldBypassQuietHours(notification, tasks, userEnergy)` - critical tasks bypass quiet hours
- `getTimeUntilQuietHoursEnd(settings)` - minutes until quiet hours end
- `formatQuietHours(settings)` - human-readable format ("10 PM - 7 AM")

*Priority Ordering:*
- `calculateNudgePriority(notification, tasks, userEnergy)` - calculates priority score
- `sortByPriority(notifications, tasks, userEnergy)` - sorts notifications by priority
- Priority scores: `start_poke` (100) > `runway_nudge` (80) > `streak` (60) > `reminder` (50) > `system` (10)
- Task's priority score (0-100) added to type score, +50 bonus for critical tier

*Main Orchestration:*
- `orchestrateNudges(ready, tracker, settings, tasks, userEnergy)` - returns OrchestratedNudge[] with deliveryMethod
- `getNotificationsToFire(...)` - returns `{ toPush, toBadge, suppressed }` arrays
- `getNextNudgeToFire(...)` - returns single highest-priority nudge

**Delivery Methods:**
| Method | When | Behavior |
|--------|------|----------|
| `push` | Normal | Full notification (sound, banner) |
| `badge` | Quiet hours (non-critical) | Silent badge update only |
| `suppressed` | Cooldown active | Don't show at all |

**Migration:** `migrateToV15()` in `lib/storage.ts`

### Key Files

| File | Purpose |
|------|---------|
| `lib/nudge-orchestrator.ts` | Orchestrator implementation |
| `lib/types.ts` | Added NudgeTracker interface, schema v15 |
| `lib/storage.ts` | Added migrateToV15() |

---

## Phase 6: Energy System ✅

**Status:** Complete

**Summary:** Implemented energy selector UI in NotificationsHub Priority tab, added energy-aware filtering with critical override.

### Completed Work

**Energy Selector Component (`components/shared/EnergySelector.tsx`):**
- Three-button toggle for High / Medium / Low energy
- High: ⚡ amber, Medium: 🔋 green, Low: 🪫 blue
- Tap selected button to deselect (returns to null)
- Compact mode available for inline display
- Helper functions: `getEnergyLevelLabel()`, `getEnergyFilterHint()`

**Energy Filtering (`lib/priority.ts`):**
```typescript
type EnergyFilterMode = 'all' | 'matching' | 'hide_mismatched';

// Energy match logic
function getEnergyMatchStatus(taskEnergy, userEnergy):
  - High energy user → Draining tasks = match, Energizing = mismatch
  - Low energy user → Energizing tasks = match, Draining = mismatch
  - Medium or null → All neutral

// Filter function with critical override
function filterTasksByEnergy(tasks, userEnergy, filterMode):
  - Critical tier tasks ALWAYS visible (override)
  - Returns { visible, hidden } for "show X hidden" UI
```

**Energy Match Indicator:**
- `getEnergyMatchIndicator(taskEnergy, userEnergy)` returns indicator for display
- Shows "⚡ Good fit" pill when energy matches
- Used in `PriorityTaskCard` for visual feedback

**NotificationsHub Integration:**
- Energy selector shown above Priority Queue when on Priority tab
- "Show all" / "Hide filtered" toggle when energy is set
- `filterByEnergy` prop controls filtering mode
- Empty state shows count of hidden tasks

**Page-Level Wiring (`app/page.tsx`):**
- Added `handleEnergyChange` handler
- Updates `state.currentEnergy` and `state.currentEnergySetAt`
- Passed to NotificationsHub via `onEnergyChange` prop

### Key Files

| File | Purpose |
|------|---------|
| `components/shared/EnergySelector.tsx` | Energy input UI component |
| `lib/priority.ts` | Added `filterTasksByEnergy`, `getEnergyMatchStatus`, `getEnergyMatchIndicator` |
| `components/notifications/PriorityQueueModule.tsx` | Added filtering integration, energy indicator in cards |
| `components/notifications/NotificationsHub.tsx` | Added EnergySelector, filter toggle |
| `app/page.tsx` | Added `handleEnergyChange`, `EnergyLevel` import |

### User Flow

1. User opens Notifications Hub → Priority tab
2. Energy selector appears at top (High / Medium / Low buttons)
3. Tap energy level → tasks filter to show matching/neutral, hide mismatched
4. Critical tasks always shown regardless of energy
5. "Show all" toggle reveals hidden tasks
6. Tap same energy level again to deselect and show all tasks

---

## Bug Fixes & Refinements (Round 4.1) ✅

**Status:** Complete (2026-01-29)

**Summary:** Polish fixes for Phase 3/6 components.

### Changes Made
- **Priority Calculation in DetailsSection:** Replaced placeholder priority mapping with actual `getTaskPriorityInfo(task)` call
- **Collapsed Row Tap Area:** Added onClick handlers to expand details when tapping empty space between pills
- **EnergyTypePicker Icons:** Replaced emojis with Lucide icons (TrendingUp/Minus/TrendingDown/CircleSlash)
- **ImportancePicker Styling:** Simplified to neutral text colors (removed colored text per level)
- **Documentation:** Added Icon/Emoji Convention to CLAUDE.md

---

## Phase 7: Settings & Polish ✅

**Status:** Complete

**Summary:** Added settings UI for quiet hours and nudge cooldown in NotificationSettings, polished Priority Queue empty states.

### Completed Work

**Quiet Hours Settings (`components/notifications/NotificationSettings.tsx`):**
- Toggle to enable/disable quiet hours
- "More info" expandable section explaining behavior:
  - Non-critical nudges silenced during quiet hours
  - Critical priority tasks bypass quiet hours
  - Quieted nudges update badge count instead
- Start time picker: 8 PM, 9 PM, 10 PM, 11 PM, 12 AM
- End time picker: 5 AM, 6 AM, 7 AM, 8 AM, 9 AM, 10 AM
- Time pickers use same modal pattern as existing Buffer picker

**Nudge Cooldown Settings:**
- Picker row in NotificationSettings
- Preset options: 5, 10, 15 (default), 30, 60 minutes
- Footer explains: "Prevents repeated nudges for same task within this period"

**Priority Queue Empty State Polish (`components/notifications/PriorityQueueModule.tsx`):**
- Added hint text below empty state message
- When filtered: "Adjust your energy filter or tap \"Show all\" to see hidden tasks"
- When no tasks: "Tasks gain priority from deadlines, importance, and staleness"

### New State Variables
```typescript
// NotificationSettings.tsx
showQuietHoursMoreInfo: boolean
showQuietHoursStartPicker: boolean
showQuietHoursEndPicker: boolean
showCooldownPicker: boolean
```

### Settings Persistence
All settings use existing `onUpdateSettings(updates)` pattern which persists to localStorage via `UserSettings` interface.

---

## Decisions Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-01-28 | Hybrid approach for Details refactor | New components, state in TaskDetail |
| 2026-01-28 | Priority field: placeholder in Phase 0, migrate in Phase 1 | Avoid breaking existing workflows |
| 2026-01-29 | currentEnergy in AppState, not UserSettings | Transient state vs permanent settings |
| 2026-01-29 | Use `createDefaultUserSettings()` in migrations | Ensures new fields always have defaults |
| 2026-01-29 | Tab-based NotificationsHub | Priority + Notifications tabs, badge shows active count |
| 2026-01-29 | Collapsible tier sections in Priority Queue | Critical/High expanded by default, Low collapsed |
| 2026-01-29 | B+C hybrid orchestrator approach | Deduplication + priority queue, three delivery methods (push/badge/suppressed) |
| 2026-01-29 | NudgeTracker in AppState | Persists across sessions, cleaned up after 24h |
| 2026-01-29 | Critical tasks bypass quiet hours | Important tasks should always push, others downgraded to badge |
| 2026-01-29 | Energy selector in NotificationsHub | Above Priority Queue, visible only on Priority tab |
| 2026-01-29 | Critical tasks always visible in Priority Queue | Energy filtering does not hide critical tasks |
| 2026-01-29 | Energy match logic: High user → draining tasks | Based on principle: use high energy for demanding tasks |

---

## Key File Paths

| Purpose | Path |
|---------|------|
| Types | `lib/types.ts` |
| Notification Types | `lib/notification-types.ts` |
| Storage/Migration | `lib/storage.ts` |
| Priority Utils | `lib/priority.ts` |
| Start Poke Utils | `lib/start-poke-utils.ts` |
| Notification Utils | `lib/notification-utils.ts` |
| Nudge Orchestrator | `lib/nudge-orchestrator.ts` |
| Priority Queue | `components/notifications/PriorityQueueModule.tsx` |
| Notifications Hub | `components/notifications/NotificationsHub.tsx` |
| Notification Settings | `components/notifications/NotificationSettings.tsx` |
| DetailsSection | `components/task-detail/DetailsSection.tsx` |
| PriorityDisplay | `components/shared/PriorityDisplay.tsx` |
| PriorityBreakdownDrawer | `components/shared/PriorityBreakdownDrawer.tsx` |
| ImportancePicker | `components/shared/ImportancePicker.tsx` |
| EnergyTypePicker | `components/shared/EnergyTypePicker.tsx` |
| LeadTimePicker | `components/shared/LeadTimePicker.tsx` |
| EnergySelector | `components/shared/EnergySelector.tsx` |
| AI Palette (alert banners) | `components/ai-assistant/PaletteContent.tsx` |

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `NUDGE_SYSTEM_MVP_SPEC.md` | Behavior specification |
| `NUDGE_SYSTEM_DATA_MODEL.md` | Data structures |
| `NUDGE_SYSTEM_IMPLEMENTATION_PLAN.md` | Phase overview |
| `NUDGE_SYSTEM_CLAUDE_CODE_PROMPTS.md` | Implementation prompts |
| `TASK_DETAILS_REFACTOR_SPEC.md` | Phase 0 specification |

---

## Gap Analysis (January 2026)

> Analysis of documented specification vs actual implementation, with prioritized recommendations.

### Implementation Status Summary

| Feature | Spec Document | Status | Notes |
|---------|---------------|--------|-------|
| Importance field (user-set) | MVP Spec §1 | ✅ | Full implementation with 4 levels |
| Energy type field (user-set) | MVP Spec §2 | ✅ | Energizing/Neutral/Draining |
| Lead time field (user-set) | MVP Spec §3 | ✅ | Days-based with presets + custom |
| Priority score calculation | MVP Spec §4 | ✅ | 7 component scores, 64 unit tests |
| Priority tier assignment | MVP Spec §5 | ✅ | Critical/High/Medium/Low thresholds |
| Priority Queue view | MVP Spec §6 | ✅ | Tab in NotificationsHub |
| Score breakdown visibility | MVP Spec §6 | ✅ | PriorityBreakdownDrawer |
| Runway nudge | MVP Spec §7 | ✅ | 1 day before effective deadline |
| Execution nudge (start_poke) | MVP Spec §7 | ✅ | Based on raw deadline |
| B+C hybrid orchestrator | MVP Spec §8 | ✅ | Dedup + priority queue + quiet hours |
| Quiet hours setting | MVP Spec §10 | ✅ | Toggle + time pickers in settings |
| Nudge cooldown | MVP Spec §10 | ✅ | Configurable (default 15 min) |
| Energy input mechanism | MVP Spec §9 | ✅ | EnergySelector in Priority tab |
| Energy-aware filtering | MVP Spec §9 | ✅ | With critical override |
| Priority forecast hints | MVP Spec §6 | 🔴 | "Will become Critical in X days" not implemented |
| AI Palette energy action | MVP Spec §9 | 🔴 | "I'm feeling..." action not implemented |
| MiniBar delivery channel | MVP Spec §8 | 🔴 | Only push/badge/suppressed; no MiniBar |
| Energy staleness indicator | MVP Spec §9 | 🔴 | "Last set X ago" not shown |
| Partner importance workflow | Data Model §1 | 🔴 | Field exists but no UI/flow |

### Identified Gaps

#### P0 — Critical (Affects Core Value)

*None identified — all critical MVP features implemented.*

#### P1 — High (Enhances Core Experience)

| Gap | Doc Expectation | Current State | Impact | Recommendation |
|-----|-----------------|---------------|--------|----------------|
| **Priority Forecast Hints** | Score breakdown shows "Priority will increase when..." (MVP Spec §6) | Breakdown shows current factors only | Users can't anticipate priority changes | Add forecast hints to PriorityBreakdownDrawer showing when deadline/staleness thresholds will trigger |
| **Energy Staleness Display** | Show "when last set (for staleness awareness)" (MVP Spec §9, Mechanism 1) | EnergySelector shows buttons only, no timestamp | Users may forget stale energy setting | Add subtle "Set X ago" text below EnergySelector |

#### P2 — Medium (Polish & Completeness)

| Gap | Doc Expectation | Current State | Impact | Recommendation |
|-----|-----------------|---------------|--------|----------------|
| **AI Palette Energy Action** | "I'm feeling..." quick action opens prompt (MVP Spec §9, Mechanism 2) | Energy only settable via Priority tab | Friction to set energy from other contexts | Add "I'm feeling..." action to PaletteContent with High/Medium/Low options |
| **MiniBar Delivery Channel** | Channel router includes MiniBar (MVP Spec §8 diagram) | Orchestrator returns push/badge/suppressed only | In-app nudges always use banner instead of subtle MiniBar | Evaluate if MiniBar is needed vs current banner approach |
| **Partner Importance UI** | `importanceSource: 'self' | 'partner'` field (Data Model §1) | Field migrated but no UI to set partner source | Cannot track partner-originated importance | Add "Who set this?" indicator or defer to future partner features |

#### P3 — Low (Future Enhancement)

| Gap | Doc Expectation | Current State | Impact | Recommendation |
|-----|-----------------|---------------|--------|----------------|
| **AI Lead Time Inference** | `leadTimeSource: 'ai'` field (Data Model §1) | Field exists, always 'manual' or null | No AI assistance for lead time | Defer to future AI features phase |
| **Notification Type Priorities** | Type priorities include `deadline_critical`, `deadline_approaching`, `stale_task` (MVP Spec §8) | Simplified to `start_poke`, `runway_nudge`, `streak`, `reminder`, `system` | Less granular priority ordering | Current approach works; enhance if priority ordering issues arise |

### Missing Data Model Fields

| Field | Document | Expected | Current | Status |
|-------|----------|----------|---------|--------|
| `Task.importance` | Data Model §1 | `ImportanceLevel \| null` | Implemented | ✅ |
| `Task.importanceSource` | Data Model §1 | `'self' \| 'partner' \| null` | Implemented (no UI) | ⚠️ Field only |
| `Task.importanceNote` | Data Model §1 | `string \| null` | Implemented (no UI) | ⚠️ Field only |
| `Task.energyType` | Data Model §1 | `EnergyType \| null` | Implemented | ✅ |
| `Task.leadTimeDays` | Data Model §1 | `number \| null` | Implemented | ✅ |
| `Task.leadTimeSource` | Data Model §1 | `'manual' \| 'ai' \| null` | Implemented | ✅ |
| `AppState.currentEnergy` | Data Model §2 | `EnergyLevel \| null` | Implemented | ✅ |
| `AppState.currentEnergySetAt` | Data Model §2 | `number \| null` | Implemented | ✅ |
| `UserSettings.quietHoursEnabled` | Data Model §6 | `boolean` | Implemented | ✅ |
| `UserSettings.quietHoursStart` | Data Model §6 | `string \| null` | Implemented | ✅ |
| `UserSettings.quietHoursEnd` | Data Model §6 | `string \| null` | Implemented | ✅ |
| `UserSettings.nudgeCooldownMinutes` | Data Model §6 | `number` | Implemented | ✅ |

### Priority Recommendations

#### Implement in Next Polish Pass (P1)

1. **Priority Forecast Hints** — Add to PriorityBreakdownDrawer:
   - Calculate days until deadline crosses tier thresholds
   - Show "Will become Critical in 3 days" type messages
   - Estimate: 1-2 hours

2. **Energy Staleness Display** — Add to EnergySelector:
   - Use `currentEnergySetAt` timestamp
   - Show "Set 2h ago" or "Set today at 9 AM"
   - Estimate: 30 min

#### Consider for Future Sprints (P2)

3. **AI Palette Energy Action** — Natural fit with existing palette:
   - Add "I'm feeling..." to quick actions
   - Reuse EnergySelector component in palette
   - Consider AI response with task suggestion

4. **MiniBar Evaluation** — Assess whether needed:
   - Current banner approach may be sufficient
   - MiniBar would be subtle persistent indicator
   - Defer unless users report notification fatigue

#### Defer to Future Features (P3)

5. **Partner Importance Flow** — Part of larger partner/shared tasks feature
6. **AI Lead Time Inference** — Part of larger AI inference feature
7. **Importance Notes UI** — Low value without partner context

### Summary

The Nudge System MVP implementation is **substantially complete** with all core features functional. The identified gaps are primarily:

- **Polish items** (forecast hints, staleness display) — P1, easy wins
- **Alternative entry points** (AI Palette action) — P2, nice to have
- **Deferred fields** (partner source, AI inference) — P3, await future features

No blocking gaps identified. System is ready for user testing and feedback collection.
