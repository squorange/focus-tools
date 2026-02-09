# Theme System Migration — Progress Tracker

> **Status:** ✅ Phase 1 Complete
> **Started:** 2026-02-07
> **Target:** Zero hardcoded colors in task-copilot prototype
> **Phase:** 1 of 3 (Token Migration → Theme Infrastructure → Theme Features)

---

## Phase 1: Token Migration (Sessions 1-10)

### Session Progress

| # | Session | Scope | Status | Commit | Notes |
|---|---------|-------|--------|--------|-------|
| 1 | Add New Tokens | ~35 new tokens across 5 categories | ✅ | | 40 tokens added |
| 2 | Fix DS + Color Maps | SegmentedControl + lib/color-maps.ts | ✅ | | Fixed 2 raw colors, created 5 color maps |
| 3 | Layout Components | Header, TabCluster, SearchBar, Sidebar | ✅ | | ~25 raw colors replaced |
| 4 | Picker Components | 8 picker/input components | ✅ | | 8 files migrated |
| 5 | Cards + Views | Task cards + view containers (~11 files) | ✅ | | 13 files migrated |
| 6 | Medium Components | Selectors, displays, focus mode (~8 files) | ✅ | | 8 files migrated, +energy border tokens |
| 7 | Hard Components | FilterDrawer, StagingArea, AIDisclosure, notifications | ✅ | | 11 files migrated, +accent-glow tokens |
| 8 | TaskDetail | Largest component + sub-components | ✅ | | 5 files migrated, ~100+ raw colors replaced |
| 9 | AI Components + Globals | AI glass tokens, globals.css, font tokens | ✅ | | 13 files migrated, ~100+ raw colors replaced |
| 10 | Verification + Cleanup | Audit, legacy removal, documentation | ✅ | | Tier 1-2: AIFeedback, TaskList, priority, utils status map, page overlays; Tier 3: SearchView, HistoryModal, TaskItem, NotesModule, StuckMenu, RoutineGalleryCard migrated. Remaining: blue-* focus borders, orange-500 overdue, yellow-200 search highlight, ring-offset-zinc-900 |

**Status key:** 🔲 Not started · 🟡 In progress · ✅ Complete · ⚠️ Blocked · 🔄 Needs rework

---

## Migration Metrics

### Token Counts

| Category | Pre-Migration | Added (Session 1) | Post-Cleanup (Session 10) |
|----------|--------------|-------------------|--------------------------|
| bg tokens | ~110 | +~16 | |
| fg tokens | ~65 | +~8 | |
| border tokens | ~20 | +~2 | |
| glass tokens | ~25 | +~8 | |
| overlay tokens | 0 | +3 | |
| ring tokens | 0 | +1 | |
| font tokens | 0 | +2 | |
| **Total** | ~220 | **+~40** | |
| Legacy removed | — | — | |

### Raw Color Elimination

| Metric | Pre-Migration | Current | Target |
|--------|--------------|---------|--------|
| Files with raw Tailwind colors | ~100 | | 0* |
| Raw color class instances | ~2,076 | | 0* |
| Inline/JS color values | ~145 | | 0* |
| dark: color prefix instances | ~500+ | | 0* |
| Files using semantic tokens | 89 | | ~160+ |

_*Excluding known exceptions: project.color inline styles, Storybook stories, orbital-zen prototype_

---

## New Tokens Added (Session 1 Reference)

### Interactive States
- [x] `--color-bg-accent-high-hover`
- [x] `--color-bg-accent-subtle-hover`
- [x] `--color-bg-neutral-low-hover`
- [x] `--color-bg-positive-subtle-hover`
- [x] `--color-bg-alert-subtle-hover`
- [x] `--color-bg-attention-subtle-hover`
- [x] `--color-border-neutral-hover`
- [x] `--color-ring-focus`

### Priority Tiers
- [x] `--color-bg-priority-critical-subtle` + `--color-fg-priority-critical`
- [x] `--color-bg-priority-high-subtle` + `--color-fg-priority-high`
- [x] `--color-bg-priority-medium-subtle` + `--color-fg-priority-medium`
- [x] `--color-bg-priority-low-subtle` + `--color-fg-priority-low`

### Energy Levels
- [x] `--color-bg-energy-high-subtle` + `--color-fg-energy-high`
- [x] `--color-bg-energy-medium-subtle` + `--color-fg-energy-medium`
- [x] `--color-bg-energy-low-subtle` + `--color-fg-energy-low`

### Overlays
- [x] `--color-bg-overlay-light`
- [x] `--color-bg-overlay-medium`
- [x] `--color-bg-overlay-heavy`

### AI Glass
- [x] `--glass-ai-bg`
- [x] `--glass-ai-border`
- [x] `--glass-ai-shadow`
- [x] `--glass-ai-blur`
- [x] `--glass-ai-input-bg`
- [x] `--glass-ai-input-border`
- [x] `--glass-ai-input-focus`
- [x] `--glass-ai-fade-from` (renamed from --glass-ai-fade)

### Typography
- [x] `--font-family-sans`
- [x] `--font-family-mono`

---

## Centralized Color Maps (Session 2 Reference)

| Map | File | Used By | Status |
|-----|------|---------|--------|
| PRIORITY_COLORS | lib/color-maps.ts | PriorityDisplay, PriorityBreakdownDrawer, TaskRow | ✅ Created |
| ENERGY_COLORS | lib/color-maps.ts | EnergySelector | ✅ Created |
| STATUS_BADGE_COLORS | lib/color-maps.ts | Sidebar, Pill | ✅ Created |
| NOTIFICATION_TYPE_COLORS | lib/color-maps.ts | NotificationCard | ✅ Created |
| SUGGESTION_TYPE_COLORS | lib/color-maps.ts | StagingArea | ✅ Created |

---

## Component Migration Tracker

### Design System (packages/design-system)

| Component | Raw Colors | Status | Session |
|-----------|-----------|--------|---------|
| ActionableCard | 0 | ✅ Already clean | — |
| Pill | 0 | ✅ Already clean | — |
| ProgressRing | 0 | ✅ Already clean | — |
| Toast/ToastItem | 0 | ✅ Already clean | — |
| BottomSheet | 0 | ✅ Already clean | — |
| RightDrawer | 0 | ✅ Already clean | — |
| ResponsiveDrawer | 0 | ✅ Already clean | — |
| CollapsibleSection | 0 | ✅ Already clean | — |
| SegmentedControl | 0 | ✅ | 2 |

### Layout

| Component | Raw Colors | Status | Session |
|-----------|-----------|--------|---------|
| Header | 6 | 🔲 | 3 |
| TabCluster | 4 | 🔲 | 3 |
| SearchBar | 8 | 🔲 | 3 |
| Sidebar | 20+ | 🔲 | 3 |

### Pickers

| Component | Raw Colors | Status | Session |
|-----------|-----------|--------|---------|
| DurationPicker | 0 | ✅ | 4 |
| DurationInput | 0 | ✅ | 4 |
| ImportancePicker | 0 | ✅ | 4 |
| LeadTimePicker | 0 | ✅ | 4 |
| StartPokePicker | 0 | ✅ | 4 |
| ReminderPicker | 0 | ✅ | 4 |
| EnergyTypePicker | 0 | ✅ | 4 |
| DatePickerModal | 0 | ✅ | 4 |

### Cards + Views

| Component | Raw Colors | Status | Session |
|-----------|-----------|--------|---------|
| QueueTaskCard | 0 | ✅ | 5 |
| PoolTaskCard | 0 | ✅ | 5 |
| DoneTaskCard | 0 | ✅ | 5 |
| TriageTaskCard | 0 | ✅ | 5 |
| TaskRow | 0 | ✅ | 5 |
| QueueView | 0 | ✅ | 5 |
| PoolView | 0 | ✅ | 5 |
| InboxView | 0 | ✅ | 5 |
| QuickCapture | 0 | ✅ | 5 |
| DailySummaryBanner | 0 | ✅ | 5 |
| CompletedDrawer | 0 | ✅ | 5 |

### Medium Components

| Component | Raw Colors | Status | Session |
|-----------|-----------|--------|---------|
| EnergySelector | 0 | ✅ | 6 |
| PriorityDisplay | 0 | ✅ | 6 |
| PriorityBreakdownDrawer | 0 | ✅ | 6 |
| FocusModeView | 0 | ✅ | 6 |
| ProjectsView | 0 | ✅ | 6 |
| TasksView | 0 | ✅ | 5 |
| TaskCreationPopover | 0 | ✅ | 6 |
| FocusSelectionModal | 0 | ✅ | 6 |

### Hard Components

| Component | Raw Colors | Status | Session |
|-----------|-----------|--------|---------|
| FilterDrawer | 0 | ✅ | 7 |
| StagingArea | 0 | ✅ | 7 |
| StagingToast | 0 | ✅ | 7 |
| AIDisclosure | 0 | ✅ | 7 |
| NotificationPermissionBanner | 0 | ✅ | 7 |
| ProjectModal | 0 | ✅ | 7 |
| NotificationCard | 0 | ✅ | 7 |
| NotificationsHub | 0 | ✅ | 7 |
| NotificationSettings | 0 | ✅ | 7 |
| PriorityQueueModule | 0 | ✅ | 7 |
| NotificationBadge | 0 | ✅ | 7 |

### TaskDetail

| Component | Raw Colors | Status | Session |
|-----------|-----------|--------|---------|
| TaskDetail | 0 | ✅ | 8 |
| StatusModule | 0 | ✅ | 8 |
| RecurrenceFields | 0 | ✅ | 8 |
| DetailsSection | 0 | ✅ | 8 |
| StartPokeField | 0 | ✅ | 8 |

### AI + Global

| Component | Raw Colors | Status | Session |
|-----------|-----------|--------|---------|
| AIAssistantOverlay | 8 (glass) | 🔲 | 9 |
| PaletteContent (input + fades) | 6 | 🔲 | 9 |
| AIDrawer (input) | 4 | 🔲 | 9 |
| MiniBarContent | 2 | 🔲 | 9 |
| ResponseDisplay | 4 | 🔲 | 9 |
| globals.css | 8+ | 🔲 | 9 |
| HealthPill | 6 | 🔲 | 9 |
| MetadataPill | 2 | 🔲 | 9 |
| ReadOnlyInfoPopover | 2 | 🔲 | 9 |

---

## Known Exceptions (Won't Migrate)

| Item | Reason | Location |
|------|--------|----------|
| project.color inline styles | User-defined hex colors, must be dynamic | ProjectsView, TaskCreationPopover, FilterDrawer, Pill |
| orbital-zen-next prototype | Separate theme paradigm with atmospheric effects, deferred | prototypes/orbital-zen-next/ |
| ai-minibar prototype | Standalone prototype, will be rebuilt in main app | prototypes/ai-minibar/ |
| App icon SVGs | Static assets, not theme-switchable | public/icon-*.svg |
| Storybook story files | Lower priority, follow-up task | packages/design-system/stories/ |

---

## Decisions Made

| # | Decision | Choice | Date | Rationale |
|---|----------|--------|------|-----------|
| 1 | Interactive state tokens | Yes, ~8 tokens | | 82% of hover states are raw; 8 tokens covers majority |
| 2 | Accent color derivation | Defer to Phase 3 | | Design for it now, build the math later |
| 3 | Token scope for Phase 1 | Core + overlays + AI glass | | Shadows/scrollbars Phase 2 |
| 4 | Theme × dark mode | Orthogonal (theme wraps mode) | | Each theme defines light+dark, JS-driven |
| 5 | Font family token | Yes, include now | | One token, 3 file changes, high impact |
| 6 | AI color identity | Separate generative tokens | | AI stays distinct from accent; both themeable |
| 7 | AI glass tokens | Explicit tokens (not derived) | | Glass effects need per-theme tuning |
| 8 | Transparent subtle value | Use existing token, adjust value later | | Easy one-line change if 0.04→0.06 needed |
| 9 | AIDrawer purple tinge | Keep neutral for now | | Visual distinction = context cue for "going deeper" |

---

## Phase 2 Preview (Post-Migration)

| Session | Scope | Status |
|---------|-------|--------|
| 11 | Define ColorTheme TypeScript type | 🔲 |
| 12 | Build ThemeProvider React context | 🔲 |
| 13 | Wire dark mode into theme system | 🔲 |
| 14 | Create 3-4 preset themes | 🔲 |
| 15 | Storybook theme switcher decorator | 🔲 |

## Phase 3 Preview (User-Facing)

| Session | Scope | Status |
|---------|-------|--------|
| 16 | Settings page — palette picker | 🔲 |
| 17 | Live preview + persistence | 🔲 |
| 18 | Custom color editor | 🔲 |
| 19 | Export/import themes as JSON | 🔲 |

---

## Revision History

| Date | Change |
|------|--------|
| 2026-02-07 | Initial tracker created from audit synthesis |
