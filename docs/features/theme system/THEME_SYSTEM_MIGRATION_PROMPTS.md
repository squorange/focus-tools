# Theme System Migration — Claude Code Prompts

> **Purpose:** Session-by-session prompts for migrating Focus Tools to a fully tokenized, themeable color system
> **Pre-requisite:** Audit files in `docs/audits/01-07` have been completed
> **Session size:** 30-60 minutes each, aligned with git commit points
> **Pattern:** Orient → Execute → Verify → Commit

---

## Preamble (Include at start of each session)

```
Context: We are migrating Focus Tools to a fully themeable design system.
The goal is zero hardcoded color values — every color must flow through 
CSS custom properties defined in the design system's foundations.css.

Key files:
- Token definitions: packages/design-system/styles/foundations.css
- Tailwind preset: packages/design-system/tailwind.preset.cjs
- TS token types: packages/design-system/foundations/colors.ts

Rules:
- Replace raw Tailwind color classes (bg-zinc-*, text-violet-*, etc.) 
  with semantic token classes (bg-bg-neutral-*, text-fg-accent-*, etc.)
- Replace dark: prefixed color classes — the CSS vars handle dark mode 
  automatically via .dark selector in foundations.css
- Replace inline hex/rgba values with var(--color-*) references
- Do NOT change component behavior, layout, or functionality
- Preserve hover/focus/active/disabled states (just use semantic tokens)
- Commit after each session with descriptive message
```

---

## Session 1: Add New Tokens

**Goal:** Add all missing semantic tokens identified by the audits. No component changes yet.

**Estimated time:** 30 minutes

```
Add new semantic design tokens to the design system. These were identified 
as missing during the color usage audit. Do NOT modify any components — 
only token definition files.

### 1. Interactive State Tokens (foundations.css)

Add to :root AND .dark selectors:

HOVER BACKGROUNDS:
--color-bg-accent-high-hover       (light: #6d28d9 / violet-700, dark: #a78bfa / violet-400)
--color-bg-accent-subtle-hover     (light: #ede9fe / violet-100, dark: rgba(91,33,182,0.3) / violet-800/30)
--color-bg-neutral-low-hover       (light: #d4d4d8 / zinc-300, dark: #3f3f46 / zinc-700)
--color-bg-positive-subtle-hover   (light: #dcfce7 / green-100, dark: rgba(20,83,45,0.3) / green-900/30)
--color-bg-alert-subtle-hover      (light: #fee2e2 / red-100, dark: rgba(127,29,29,0.3) / red-900/30)
--color-bg-attention-subtle-hover  (light: #fef3c7 / amber-100, dark: rgba(120,53,15,0.3) / amber-900/30)

HOVER BORDERS:
--color-border-neutral-hover       (light: #d4d4d8 / zinc-300, dark: #52525b / zinc-600)

FOCUS:
--color-ring-focus                 (light: #8b5cf6 / violet-500, dark: #8b5cf6 / violet-500)

### 2. Domain-Specific Tokens (foundations.css)

PRIORITY TIERS (bg + fg, light AND dark):
--color-bg-priority-critical-subtle   (light: #fee2e2, dark: rgba(127,29,29,0.3))
--color-fg-priority-critical          (light: #dc2626, dark: #f87171)
--color-bg-priority-high-subtle       (light: #ffedd5, dark: rgba(124,45,18,0.3))
--color-fg-priority-high              (light: #ea580c, dark: #fb923c)
--color-bg-priority-medium-subtle     (light: #fef3c7, dark: rgba(120,53,15,0.3))
--color-fg-priority-medium            (light: #d97706, dark: #fbbf24)
--color-bg-priority-low-subtle        (light: var(--color-bg-neutral-subtle), dark: var(--color-bg-neutral-subtle))
--color-fg-priority-low               (light: var(--color-fg-neutral-secondary), dark: var(--color-fg-neutral-secondary))

ENERGY LEVELS (bg + fg, light AND dark):
--color-bg-energy-high-subtle      (light: #dbeafe, dark: rgba(30,58,138,0.3))
--color-fg-energy-high             (light: #3b82f6, dark: #60a5fa)
--color-bg-energy-medium-subtle    (light: #dcfce7, dark: rgba(20,83,45,0.3))
--color-fg-energy-medium           (light: #22c55e, dark: #4ade80)
--color-bg-energy-low-subtle       (light: #fef3c7, dark: rgba(120,53,15,0.3))
--color-fg-energy-low              (light: #f59e0b, dark: #fbbf24)

### 3. Overlay Tokens (foundations.css)

--color-bg-overlay-light           (light: rgba(0,0,0,0.2), dark: rgba(0,0,0,0.2))
--color-bg-overlay-medium          (light: rgba(0,0,0,0.4), dark: rgba(0,0,0,0.4))
--color-bg-overlay-heavy           (light: rgba(0,0,0,0.5), dark: rgba(0,0,0,0.5))

### 4. AI Glass Tokens (foundations.css)

These create the purple-tinted glass background on MiniBar/Palette:

--glass-ai-bg               (light: linear-gradient(to bottom right, rgba(245,243,255,0.5), rgba(237,233,254,0.4), rgba(245,243,255,0.5))
                              dark: linear-gradient(to bottom right, rgba(46,16,101,0.3), rgba(46,16,101,0.2), rgba(46,16,101,0.3)))
--glass-ai-border           (light: rgba(221,214,254,0.3), dark: rgba(91,33,182,0.3))
--glass-ai-shadow           (light: rgba(167,139,250,0.04), dark: rgba(46,16,101,0.2))
--glass-ai-blur             16px (both modes)
--glass-ai-input-bg         (light: rgba(245,243,255,0.3), dark: rgba(46,16,101,0.1))
--glass-ai-input-border     (light: rgba(221,214,254,0.3), dark: rgba(91,33,182,0.3))
--glass-ai-input-focus      (light: #8b5cf6, dark: #8b5cf6)
--glass-ai-fade             (light: rgba(245,243,255,0.95), dark: rgba(46,16,101,0.95))

### 5. Font Family Tokens (tokens.css)

--font-family-sans    system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
--font-family-mono    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace

### 6. Update Tailwind Preset (tailwind.preset.cjs)

Add mappings for all new tokens so they're available as Tailwind utilities.
For the priority/energy/overlay tokens, map them under appropriate keys.
Add fontFamily extension:
  fontFamily: {
    sans: 'var(--font-family-sans)',
    mono: 'var(--font-family-mono)',
  }

### 7. Update TypeScript Types (foundations/colors.ts)

Add type definitions for the new token categories (priority, energy, 
overlay, glass-ai) so they're available for runtime use.

### 8. Legacy Cleanup Note

Do NOT remove legacy tokens yet — that's Session 10. Just add the new ones.

After completing, verify:
- All new tokens have both :root and .dark values
- Tailwind preset compiles without errors
- TypeScript types compile without errors
- Run `npm run build` or equivalent to confirm no build errors

Commit: "feat(design-system): add interactive, priority, energy, overlay, AI glass, and font tokens"
```

---

## Session 2: Fix Design System + Centralize Color Maps

**Goal:** Fix the one broken design system component and create shared color map constants that use semantic tokens.

**Estimated time:** 30-45 minutes

```
Two tasks this session:

### Task A: Fix SegmentedControl

File: packages/design-system/components/SegmentedControl/SegmentedControl.tsx

This is the only design system component with raw colors. Replace:
- bg-black/[0.06] dark:bg-white/[0.08] → bg-bg-transparent-subtle 
  (check if this token value is close enough, adjust token value in 
  foundations.css if needed to match 0.06/0.08 opacity)
- bg-white dark:bg-[#141417] → bg-bg-neutral-min
  (check if --color-bg-neutral-min dark value matches #141417, 
  adjust if needed)

Verify the component looks the same visually before and after.

### Task B: Create Shared Color Map Constants

Create a new file: prototypes/task-copilot/lib/color-maps.ts

This centralizes all data-to-color mappings using semantic tokens.
Multiple components reference these same color patterns — centralizing 
means we change colors in one place.

Contents:

1. PRIORITY_COLORS map:
   - critical: { bg, text, dot } using --color-bg-priority-critical-subtle, etc.
   - high: { bg, text, dot }
   - medium: { bg, text, dot }
   - low: { bg, text, dot }
   Used by: PriorityDisplay, PriorityBreakdownDrawer, TaskRow

2. ENERGY_COLORS map:
   - high: { icon, bg, text, border }
   - medium: { icon, bg, text, border }  
   - low: { icon, bg, text, border }
   Used by: EnergySelector

3. STATUS_BADGE_COLORS map:
   - inbox, pool, active, complete, archived, etc.
   - Each: { bg, text } using existing bg-bg-status-* and text-fg-status-* tokens
   Used by: Sidebar, Pill

4. NOTIFICATION_TYPE_COLORS map:
   - start_poke, streak, deadline, etc.
   - Each: { icon } using semantic token classes
   Used by: NotificationCard

5. SUGGESTION_TYPE_COLORS map:
   - TITLE, EDIT, DELETE, SET, NEW
   - Map to Pill variants or semantic tokens
   Used by: StagingArea

Export all maps as typed constants with proper TypeScript interfaces.
Use Tailwind semantic token classes (e.g., 'bg-bg-priority-critical-subtle') 
NOT CSS var() references — these will be used in className strings.

All dark: prefixes should be unnecessary since the tokens handle 
dark mode automatically. Verify this is true for each mapping.

Commit: "feat(tokens): fix SegmentedControl + create centralized color maps"
```

---

## Session 3: Migrate Layout Components

**Goal:** Migrate Header, TabCluster, SearchBar, Sidebar — the always-visible chrome.

**Estimated time:** 30 minutes

```
Migrate layout components from raw Tailwind colors to semantic tokens.
Import from lib/color-maps.ts where applicable.

### Files to migrate:

1. components/layout/Header.tsx (~6 raw colors)
   - violet-100/200/600/400 for plus button → bg-bg-accent-subtle, 
     text-fg-accent-primary, hover:bg-bg-accent-subtle-hover
   
2. components/layout/TabCluster.tsx (~4 raw colors)
   - bg-white dark:bg-[#141417] → bg-bg-neutral-min
   - bg-black/[0.06] dark:bg-white/[0.08] → bg-bg-transparent-subtle 
     (same pattern as SegmentedControl)
   - violet-500 badge → text-fg-accent-primary or bg-bg-accent-high
   
3. components/layout/SearchBar.tsx (~8 raw colors)
   - zinc-50/800 → bg-bg-neutral-subtle
   - zinc-300/600 borders → border-border-color-neutral
   - blue-500 focus ring → ring color using --color-ring-focus
   - hover:border-zinc-300 → hover:border-border-color-neutral-hover

4. components/layout/Sidebar.tsx (~20+ raw colors)
   - Import STATUS_BADGE_COLORS from lib/color-maps.ts
   - Replace inline status color map with imported constant
   - violet palette items → bg-bg-accent-*, text-fg-accent-*
   - zinc palette → bg-bg-neutral-*, text-fg-neutral-*
   - Yellow highlight → bg-bg-attention-subtle
   - hover:bg-zinc-200 / dark:hover:bg-zinc-700 → hover:bg-bg-neutral-low-hover
   - group-hover text colors → use semantic tokens

### For each file:
1. Remove ALL dark: color prefixes (semantic tokens handle dark mode)
2. Remove ALL hover:/focus:/active: raw color classes, replace with 
   semantic equivalents
3. Verify visually that light mode looks the same
4. Verify visually that dark mode looks the same
5. Check that hover/focus states still work correctly

Commit: "refactor(layout): migrate Header, TabCluster, SearchBar, Sidebar to semantic tokens"
```

---

## Session 4: Migrate Picker Components

**Goal:** Migrate the shared picker components — they share similar patterns.

**Estimated time:** 30-45 minutes

```
Migrate picker/input components. These all follow similar patterns:
violet for primary actions, zinc for neutral, border hover states.

### Files to migrate:

1. components/shared/DurationPicker.tsx (~12 raw)
2. components/shared/DurationInput.tsx (~6 raw)
3. components/shared/ImportancePicker.tsx (~8 raw)
4. components/shared/LeadTimePicker.tsx (~8 raw)
5. components/shared/StartPokePicker.tsx (~12 raw)
6. components/shared/ReminderPicker.tsx (~10 raw)
7. components/shared/EnergyTypePicker.tsx (~8 raw)
8. components/shared/DatePickerModal.tsx (~6 raw)

### Common replacement patterns across all pickers:

| Raw Pattern | Semantic Replacement |
|-------------|---------------------|
| bg-violet-600 | bg-bg-accent-high |
| hover:bg-violet-700 | hover:bg-bg-accent-high-hover |
| text-violet-600/700 | text-fg-accent-primary |
| bg-zinc-50 dark:bg-zinc-800 | bg-bg-neutral-subtle |
| text-zinc-700 dark:text-zinc-300 | text-fg-neutral-primary |
| text-zinc-400 dark:text-zinc-500 | text-fg-neutral-soft |
| border-zinc-200 dark:border-zinc-700 | border-border-color-neutral |
| hover:border-zinc-300 dark:hover:border-zinc-600 | hover:border-border-color-neutral-hover |
| focus:ring-violet-500 | focus:ring-[var(--color-ring-focus)] |
| disabled:opacity-50 | (keep as-is, opacity is theme-safe) |
| disabled:bg-zinc-300 dark:disabled:bg-zinc-600 | disabled:bg-bg-neutral-low disabled:text-fg-neutral-disabled |

### Important:
- These components often have "selected" states using violet — make sure 
  selected states use accent tokens consistently
- Some have amber warning states (StartPokePicker) — use attention tokens
- Remove ALL dark: color prefixes

Commit: "refactor(pickers): migrate 8 picker components to semantic tokens"
```

---

## Session 5: Migrate Card & View Components

**Goal:** Migrate task cards and view containers.

**Estimated time:** 30 minutes

```
Migrate card components and view containers. Many of these already use 
ActionableCard (design system) so they have minimal raw colors.

### Files to migrate:

CARDS:
1. components/queue/QueueTaskCard.tsx (~2 raw — fallback colors)
2. components/pool/PoolTaskCard.tsx (~2 raw — fallback colors)
3. components/tasks/DoneTaskCard.tsx (~8 raw)
4. components/shared/TriageTaskCard.tsx (~6 raw)
5. components/dashboard/TaskRow.tsx (~15 raw)
   - Import PRIORITY_COLORS from lib/color-maps.ts
   - Replace priorityColors map with imported constant

VIEWS:
6. components/queue/QueueView.tsx (~4 raw — zinc-400 icons)
7. components/pool/PoolView.tsx (~6 raw — zinc-400, violet-500)
8. components/inbox/InboxView.tsx (~4 raw — violet, green)
9. components/inbox/QuickCapture.tsx (~10 raw — violet, zinc)
10. components/queue/DailySummaryBanner.tsx (~0 raw but check overlays)
11. components/queue/CompletedDrawer.tsx (~0 raw)

### Key patterns:
- bg-black/5 dark:bg-white/10 on TriageTaskCard → bg-bg-transparent-subtle
- Fallback #9ca3af → text-fg-neutral-soft or text-fg-neutral-disabled
- Priority dot colors on TaskRow → use PRIORITY_COLORS.{tier}.dot
- green-500 completion indicators → text-fg-positive-primary or 
  text-fg-status-completed

Commit: "refactor(cards+views): migrate task cards and view components to semantic tokens"
```

---

## Session 6: Migrate Medium-Complexity Components

**Goal:** Components with more color logic — selectors, displays, focus mode.

**Estimated time:** 45 minutes

```
Migrate medium-complexity components. These have color mapping logic 
that should now use the centralized color maps from lib/color-maps.ts.

### Files to migrate:

1. components/shared/EnergySelector.tsx (~18 raw)
   - Import ENERGY_COLORS from lib/color-maps.ts
   - Replace inline energy level color map with imported constant
   - Handle active/inactive states using semantic tokens

2. components/shared/PriorityDisplay.tsx (~8 raw)
   - Import PRIORITY_COLORS from lib/color-maps.ts
   - Replace tier color map with imported constant

3. components/shared/PriorityBreakdownDrawer.tsx (~20 raw)
   - Import PRIORITY_COLORS from lib/color-maps.ts
   - Replace tierConfig with imported constant
   - zinc palette items → neutral tokens

4. components/focus-mode/FocusModeView.tsx (~15 raw)
   - violet palette → accent tokens
   - green-600/400 completion → positive tokens
   - zinc palette → neutral tokens
   - Focus-specific status colors → status tokens

5. components/projects/ProjectsView.tsx (~20 raw)
   - violet palette → accent tokens
   - zinc palette → neutral tokens
   - red/green status indicators → alert/positive tokens
   - NOTE: project.color (user-defined hex) should remain as inline 
     style — this is intentionally dynamic

6. components/tasks/TasksView.tsx (~15+ raw)
   - bg-white dark:bg-[#141417] → bg-bg-neutral-min
   - bg-black/[0.06] dark:bg-white/[0.08] → bg-bg-transparent-subtle
   - violet/zinc palette → accent/neutral tokens

7. components/shared/TaskCreationPopover.tsx (~15 raw)
   - violet palette → accent tokens
   - zinc palette → neutral tokens
   - NOTE: project color dots remain as inline styles

8. components/shared/FocusSelectionModal.tsx (~4 raw, easy)

### Verify each component:
- Color mapping objects now import from lib/color-maps.ts
- No inline color map definitions remain (except project colors)
- All dark: prefixes removed from color classes
- Active/selected/checked states use accent tokens

Commit: "refactor(components): migrate selectors, displays, and views to semantic tokens"
```

---

## Session 7: Migrate Hard Components (excl. TaskDetail)

**Goal:** The remaining high-raw-color-count components.

**Estimated time:** 45-60 minutes

```
Migrate the hardest components (excluding TaskDetail, which gets its 
own session).

### Files to migrate:

1. components/shared/FilterDrawer.tsx (~25+ raw)
   - Heavy violet throughout → accent tokens
   - zinc palette → neutral tokens
   - Filter chip selected states → accent tokens
   - hover:border-zinc-* → hover:border-border-color-neutral-hover
   - Apply/reset button colors → accent tokens

2. components/StagingArea.tsx (~40+ raw)
   - Import SUGGESTION_TYPE_COLORS from lib/color-maps.ts
   - Replace inline suggestion type badge colors with imported constant
   - OR better: replace badge rendering with Pill component variants 
     where appropriate
   - violet/purple accept buttons → accent tokens
   - green approve indicators → positive tokens
   - red delete indicators → alert tokens
   - amber set indicators → attention tokens
   - hover states: replace raw with semantic hover tokens

3. components/StagingToast.tsx (~12 raw)
   - amber-50/700/800 → attention tokens
   - green-600/700 → positive tokens
   - shadow with rgba → consider shadow token or leave if subtle

4. components/shared/AIDisclosure.tsx (~40+ raw)
   - slate palette → neutral tokens (slate maps to neutral)
   - blue palette → information tokens
   - amber palette → attention tokens
   - green palette → positive tokens
   - Multiple section colors → systematic replacement

5. components/shared/NotificationPermissionBanner.tsx (~12 raw)
   - violet palette → accent tokens

6. components/shared/ProjectModal.tsx (~10 raw)
   - violet-500 → accent tokens
   - red palette → alert tokens
   - NOTE: Project color hex palette (#eab308, etc.) stays as-is — 
     these are user-selectable accent colors
   - hover:scale-110 is fine (not color-related)

7. components/notifications/NotificationCard.tsx (~6 raw)
   - Import NOTIFICATION_TYPE_COLORS from lib/color-maps.ts
   - Replace icon color function with imported constant

8. Other notification components with minimal raw colors:
   - NotificationsHub.tsx (~4 raw)
   - NotificationSettings.tsx (~4 raw)
   - PriorityQueueModule.tsx (~4 raw)
   - NotificationBadge.tsx (~2 raw)

Commit: "refactor(components): migrate FilterDrawer, StagingArea, AIDisclosure, notifications to semantic tokens"
```

---

## Session 8: Migrate TaskDetail

**Goal:** The largest single component. Dedicated session due to size (~50+ raw colors, ~80+ hover states).

**Estimated time:** 45-60 minutes

```
Migrate TaskDetail.tsx — the largest component in the codebase.

File: components/task-detail/TaskDetail.tsx (~50+ raw, 80+ hover states)

Also migrate its sub-components:
- components/task-detail/StatusModule.tsx (~4 raw)
- components/task-detail/RecurrenceFields.tsx (~8 raw)
- components/task-detail/DetailsSection.tsx (~2 raw)
- components/task-detail/StartPokeField.tsx (~0 raw, verify)

### Approach for TaskDetail.tsx:
Since this is large, work systematically top-to-bottom:

1. First pass — backgrounds:
   - All bg-zinc-*, bg-white, bg-violet-* → semantic bg tokens
   - bg-white/95 dark:bg-zinc-900/95 → bg-bg-glass-floating-panel 
     or appropriate glass token
   - shadow-[0_-4px_20px_rgba(0,0,0,0.1)] → shadow token or leave 
     as minor edge case

2. Second pass — text colors:
   - All text-zinc-*, text-violet-*, text-green-*, text-red-*, 
     text-amber-* → semantic fg tokens

3. Third pass — borders:
   - All border-zinc-*, border-violet-* → semantic border tokens

4. Fourth pass — interactive states:
   - All hover:bg-* → semantic hover tokens
   - All hover:text-* → semantic hover tokens  
   - All focus:ring-* → ring-[var(--color-ring-focus)]
   - All dark:hover:* — should be removable after base class migration

5. Fifth pass — verify and clean:
   - Search file for any remaining raw color classes
   - Verify visually in both light and dark mode
   - Test all interactive states (hover, focus, disabled)

### Sub-components:
StatusModule.tsx:
- zinc-200/700 progress colors → neutral tokens

RecurrenceFields.tsx:
- violet-500 → accent tokens
- border tokens already mostly semantic

DetailsSection.tsx:
- Minimal, mostly verify glass overlay patterns

### Edge cases in TaskDetail:
- shadow-xl shadow-violet-200/50 → consider leaving or creating 
  shadow-accent token
- Inline ternaries selecting colors → ensure both branches use 
  semantic tokens
- Glass panel overlays → use glass tokens

Commit: "refactor(task-detail): migrate TaskDetail and sub-components to semantic tokens"
```

---

## Session 9: Migrate AI Components + Global Styles

**Goal:** Wire AI glass tokens, fix scroll fades, migrate globals.css, wire font tokens.

**Estimated time:** 30-45 minutes

```
Three tasks this session:

### Task A: AI Component Glass Migration

1. AIAssistantOverlay.tsx (lines 141-152):
   Replace the raw gradient/border/shadow with AI glass tokens:
   
   BEFORE:
   bg-gradient-to-br from-violet-50/50 via-violet-100/40 to-violet-50/50
   dark:from-violet-950/30 dark:via-violet-950/20 dark:to-violet-950/30
   backdrop-blur-lg
   border border-violet-200/30 dark:border-violet-800/30
   shadow-lg shadow-violet-400/[0.04] dark:shadow-violet-950/20
   
   AFTER:
   Use CSS custom properties. Since the gradient is complex, apply via 
   style prop or a utility class that references the tokens:
   style={{ 
     background: 'var(--glass-ai-bg)',
     borderColor: 'var(--glass-ai-border)',
     backdropFilter: `blur(var(--glass-ai-blur))`,
   }}
   Plus Tailwind: border shadow-lg rounded-3xl
   Shadow color via: style includes boxShadow or use shadow token

2. PaletteContent.tsx input field (line 826):
   Replace: bg-violet-50/30 dark:bg-violet-900/10 border-violet-200/30 
            dark:border-violet-800/30 focus-within:border-violet-500
   With: style={{ 
     backgroundColor: 'var(--glass-ai-input-bg)',
     borderColor: 'var(--glass-ai-input-border)',
   }}
   Plus: focus-within:border-[var(--glass-ai-input-focus)]

3. AIDrawer.tsx input field (line 149):
   Same pattern as PaletteContent input above (they're duplicated)

4. PaletteContent.tsx scroll fades (lines 564, 808):
   Replace: from-white dark:from-zinc-900
   With: Use var(--glass-ai-fade) for the gradient start color
   This fixes the visual bug where fades don't match the violet glass

5. Any remaining raw colors in AI components:
   - MiniBarContent.tsx — verify, should be minimal
   - AIDrawer.tsx — neutral styling, migrate zinc/border colors
   - ResponseDisplay.tsx — migrate any remaining raw colors

### Task B: Global CSS Migration

1. prototypes/task-copilot/app/globals.css:
   - Scrollbar colors (#d1d5db, #9ca3af, #4b5563, #6b7280) → 
     use var(--color-fg-neutral-softer), var(--color-fg-neutral-soft), etc.
   - Note: scrollbar uses @media (prefers-color-scheme: dark) — 
     should switch to .dark selector for consistency with class-based 
     dark mode toggle
   - Shimmer animation colors → use semantic tokens if possible, 
     or leave as low-priority edge case
   - pulse-glow animation rgb(167 139 250 / 0.3) → 
     var(--glass-ai-shadow) or similar
   - Font family: Replace hardcoded font stack with var(--font-family-sans)

2. prototypes/task-copilot/app/layout.tsx:
   - If font-family is applied here, update to use the token

### Task C: Miscellaneous Stragglers

1. components/shared/HealthPill.tsx (~6 raw)
   - Health status colors → map to semantic status or alert/attention/positive

2. components/shared/MetadataPill.tsx (~2 raw)
   - bg-black/5 dark:bg-white/10 → bg-bg-transparent-subtle
   - Project color prop → keep as inline style (user-defined)

3. components/shared/DetailsPill.tsx (verify clean)

4. components/shared/ReadOnlyInfoPopover.tsx (~2 raw)
   - hover:bg-zinc-50/dark:hover:bg-zinc-700 → hover:bg-bg-neutral-subtle

5. lib/priority.ts, lib/utils.ts — any color references → semantic tokens

Commit: "refactor(ai+global): migrate AI glass to tokens, update globals.css, wire font tokens"
```

---

## Session 10: Verification + Legacy Cleanup

**Goal:** Verify zero raw colors remain, remove legacy tokens, final verification.

**Estimated time:** 30-45 minutes

```
Final cleanup and verification session.

### Task A: Comprehensive Audit

Run these grep commands and fix ANY remaining raw color classes:

grep -rn "bg-zinc-\|bg-violet-\|bg-blue-\|bg-green-\|bg-red-\|bg-amber-\|bg-orange-\|bg-yellow-\|bg-slate-\|bg-gray-\|bg-neutral-\|bg-white\|bg-black" \
  --include="*.tsx" prototypes/task-copilot/components/ | grep -v node_modules

grep -rn "text-zinc-\|text-violet-\|text-blue-\|text-green-\|text-red-\|text-amber-\|text-orange-\|text-slate-\|text-gray-\|text-neutral-" \
  --include="*.tsx" prototypes/task-copilot/components/ | grep -v node_modules

grep -rn "border-zinc-\|border-violet-\|border-blue-\|border-gray-\|border-neutral-" \
  --include="*.tsx" prototypes/task-copilot/components/ | grep -v node_modules

grep -rn "dark:" --include="*.tsx" prototypes/task-copilot/components/ | grep -v node_modules | grep -v "darkMode\|dark-mode\|isDark"

grep -rn "ring-violet-\|ring-blue-" --include="*.tsx" prototypes/task-copilot/components/ | grep -v node_modules

For any hits, fix them using the same patterns from previous sessions.

### Acceptable exceptions (document in a comment or note):
- project.color inline styles (user-defined colors)
- bg-black/40 if replaced with overlay token but grep still matches
- Storybook story files (stories/ directory) — lower priority
- orbital-zen-next prototype — intentionally deferred

### Task B: Legacy Token Cleanup

In packages/design-system/styles/foundations.css:
- Remove tokens marked as **Legacy** in the audit (01-token-inventory.md)
- These include: --color-bg-input-default, --color-bg-input-focus, 
  --color-bg-input-disabled, --color-bg-positive-default, 
  --color-bg-positive-bold, --color-bg-attention-default, etc.
- FIRST: grep the codebase to confirm each legacy token is not 
  referenced anywhere
- Only remove tokens with ZERO references

In packages/design-system/styles/tokens.css:
- Identify tokens that are duplicated in foundations.css
- Remove duplicates from tokens.css (foundations.css is the source of truth)
- Harmonize info vs information naming (choose one, update references)

### Task C: Verify Build + Visual Check

1. Run full build: npm run build (or equivalent)
2. Fix any build errors
3. Start dev server
4. Visual check in browser:
   - Light mode: scan all major views
   - Dark mode: scan all major views  
   - Toggle between modes — should be instant, no flicker
5. Check Storybook: all component stories render correctly

### Task D: Documentation Update

Update docs/audits/ with a final summary file: docs/audits/08-migration-complete.md

Contents:
- Date completed
- Token counts (before/after)
- Raw color counts (before/after — should be ~0)
- Any remaining exceptions and why
- Legacy tokens removed
- Known issues / future work

Commit: "refactor(cleanup): verify zero raw colors, remove legacy tokens, document completion"
```

---

## Post-Migration: Next Steps

After completing all 10 sessions, the codebase is ready for Phase 2 
(Theme Infrastructure). The next prompts would cover:

- Session 11: Define ColorTheme TypeScript type
- Session 12: Build ThemeProvider React context
- Session 13: Wire dark mode into theme system
- Session 14: Create 3-4 preset themes
- Session 15: Storybook theme switcher

These prompts will be drafted after Phase 1 is complete and verified.
