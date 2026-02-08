# Edge Case Color Audit

**Date:** 2026-02-07
**Scope:** Non-obvious color usage in TSX, CSS, and related files
**Status:** Read-only audit (no changes made)

---

## Summary Table

| Category | Count | Hardcoded | Tokenized | Action Needed? |
|----------|-------|-----------|-----------|----------------|
| Shadows  | ~25   | 12        | ~13       | Phase 2 - defer glow effects |
| Overlays | ~80   | ~75       | ~5        | Phase 1 - high priority |
| SVGs     | 6     | 6         | 0         | Defer - icons only |
| Pseudo   | 14    | 14        | 0         | Phase 2 - scrollbars |
| Framer   | ~40   | 0         | ~40       | No - position/opacity only |
| Dynamic  | ~100  | ~60       | ~40       | Phase 1 - priority maps |

---

## 1. Box Shadows

### CSS `box-shadow` declarations

| File | Line | Value | Status |
|------|------|-------|--------|
| `prototypes/task-copilot/app/globals.css` | 112-115 | `rgb(167 139 250 / 0.3)` pulse-glow animation | Hardcoded violet |
| `prototypes/orbital-zen-next/app/globals.css` | 248, 266 | `rgba(0, 0, 0, 0.5)` hover shadows | Hardcoded black |
| `prototypes/orbital-zen-next/app/globals.css` | 287-296 | `rgba(168, 85, 247, 0.3)` focus glow | Hardcoded purple |

### Tailwind `shadow-[...]` arbitrary values

| File | Line | Value | Status |
|------|------|-------|--------|
| `StagingToast.tsx` | 36 | `shadow-[0_-2px_10px_rgba(0,0,0,0.08)]` | Hardcoded black |
| `TaskDetail.tsx` | 2542 | `shadow-[0_-4px_20px_rgba(0,0,0,0.1)]` | Hardcoded black |
| `SolarSystemView.tsx` | 262 | `drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]` | Hardcoded black |
| `TaskNode.tsx` | 286, 359 | `drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]` | Hardcoded black |

### Tailwind standard shadow utilities with color modifiers

| Pattern | Files | Status |
|---------|-------|--------|
| `shadow-xl shadow-black/10` | TaskDetail.tsx, DetailsSection.tsx, DailySummaryBanner.tsx | Semi-tokenized (uses opacity modifier) |
| `shadow-xl shadow-violet-200/50` | StagingArea.tsx, TaskDetail.tsx | Theme-aware but hardcoded color |
| `shadow-lg` (no color) | ~40 files | Tokenized via Tailwind defaults |
| `shadow-2xl` (no color) | orbital-zen components | Tokenized via Tailwind defaults |

### Recommendation
- **Phase 1:** Leave standard `shadow-lg`, `shadow-xl` utilities as-is
- **Phase 2:** Consider semantic shadow tokens for glow effects (pulse-glow, focus-glow)
- **Defer:** Drop shadows in orbital-zen are intentionally dark for space theme

---

## 2. Overlays & Backdrops

### `bg-black/*` overlays (modal/drawer backdrops)

| File | Line | Pattern | Usage |
|------|------|---------|-------|
| `page.tsx` | 5767, 6233 | `bg-black/20`, `bg-black/40` | Mobile sidebar backdrop |
| `ProjectModal.tsx` | 209 | `bg-black/50` | Modal overlay |
| `DatePickerModal.tsx` | 148 | `bg-black/50` | Modal overlay |
| `AIFeedback.tsx` | 135 | `bg-black/50` | Modal overlay |
| `TaskDetail.tsx` | 2501, 2535 | `bg-black/40` | Bottom sheet backdrop |
| `StuckMenu.tsx` | 67 | `bg-black/20` | Menu backdrop |
| `NotificationSettings.tsx` | 503, 544, 601 | `bg-black/40` | Modal overlays |
| `AIAssistant.tsx` (ai-minibar) | 72 | `bg-black/40` | Drawer backdrop |

### `bg-white/*` overlays

| File | Line | Pattern | Usage |
|------|------|---------|-------|
| `TaskDetail.tsx` | 1039, 2542 | `bg-white/95 dark:bg-zinc-900/95` | Glass panel |
| `DetailsSection.tsx` | 394 | `bg-white/95 dark:bg-zinc-900/95` | Glass panel |
| `DailySummaryBanner.tsx` | 116 | `bg-white/95 dark:bg-zinc-900/95` | Glass panel |
| `Drawer.tsx` (ai-minibar) | 117 | `bg-white/98 dark:bg-zinc-900/98` | Drawer bg |
| `AIAssistantOverlay.tsx` | 106 | `bg-white/95 dark:bg-zinc-900/95` | Panel bg |
| `Toast.tsx` | 95 | `bg-white/20 hover:bg-white/30` | Toast button |
| `GlassEffects.stories.tsx` | 460 | `bg-white/20` | Progress bar |

### `bg-zinc-900/*` overlays (dark mode specific)

| File | Pattern | Count |
|------|---------|-------|
| PaletteContent.tsx | `bg-zinc-900/10 dark:bg-white/10` | 12 instances |
| NotificationCard.tsx | `bg-zinc-900/10 dark:bg-white/10` | 4 instances |
| AIDrawer.tsx (orbital-zen) | `bg-black/30`, `bg-black/20` | 8 instances |
| FocusModeSky.tsx | `bg-white/10`, `bg-black/30` | 2 instances |

### Segmented control pattern

| File | Pattern | Notes |
|------|---------|-------|
| `TasksView.tsx` | `bg-black/[0.06] dark:bg-white/[0.08]` | Container background |
| `TabCluster.tsx` | `bg-black/[0.06] dark:bg-white/[0.08]` | Container background |
| `SegmentedControl.tsx` | `bg-black/[0.06] dark:bg-white/[0.08]` | Design system component |
| `TriageTaskCard.tsx` | `bg-black/5 dark:bg-white/10` | Button backgrounds |
| `MetadataPill.tsx` | `bg-black/5 dark:bg-white/10` | Pill backgrounds |

### `backdrop-blur` with color tints

| File | Pattern | Notes |
|------|---------|-------|
| `TaskDetail.tsx` | `backdrop-blur-lg` with `bg-white/95` | Floating panel |
| `AIDrawer.tsx` (orbital-zen) | `backdrop-blur-xl` with `bg-black/30` | Space UI |
| `FocusModeTopNav.tsx` | `backdrop-blur-md` with `bg-slate-900/80` | Space UI |
| `BottomSheet.tsx` | `backdrop-blur-lg` with `bg-bg-glass-floating-panel` | **Tokenized** |

### Recommendation
- **Phase 1 - High Priority:** Create overlay tokens:
  - `--color-bg-overlay-light: rgba(0, 0, 0, 0.2)`
  - `--color-bg-overlay-medium: rgba(0, 0, 0, 0.4)`
  - `--color-bg-overlay-heavy: rgba(0, 0, 0, 0.5)`
- **Phase 1:** Create glass panel tokens (already have `bg-bg-glass-floating-panel`)
- **Defer:** orbital-zen dark UI is intentionally hardcoded for space theme

---

## 3. SVG Colors

### Hardcoded fill/stroke in SVG files

| File | Colors | Usage |
|------|--------|-------|
| `icon-192.svg` (task-copilot) | `#7c3aed`, `#ffffff` | App icon |
| `icon-512.svg` (task-copilot) | `#7c3aed`, `#ffffff` | App icon |
| `icon-192.svg` (ai-minibar) | `#7c3aed`, `#0c0c0c`, `#fbbf24` | App icon |
| `icon-512.svg` (ai-minibar) | `#7c3aed`, `#0c0c0c`, `#fbbf24` | App icon |
| `splash.svg` (ai-minibar) | `#0c0c0c`, `#7c3aed`, `#ffffff` | Splash screen |

### Inline SVG attributes in TSX

| Pattern | Count | Status |
|---------|-------|--------|
| `fill="none"` | ~100 | Correct - uses stroke icons |
| `stroke="currentColor"` | ~100 | Correct - inherits text color |
| `fill="currentColor"` | ~20 | Correct - inherits text color |

### Tailwind fill/stroke classes

| File | Line | Pattern | Status |
|------|------|---------|--------|
| `RoutineGalleryCard.tsx` | 87 | `fill-zinc-400 dark:fill-zinc-500` | Hardcoded gray |
| `HistoryModal.tsx` | 540 | `fill-violet-500` | Hardcoded violet |
| `FoggyRingMarker.tsx` | 52 | `stroke 800ms` transition | Animation only |

### Recommendation
- **Defer:** App icons are static assets, not theme-switchable
- **No action:** Most inline SVGs correctly use `currentColor`
- **Low priority:** Consider semantic fill tokens for status indicators

---

## 4. Pseudo-element Styles

### `::-webkit-scrollbar` styling

**task-copilot/app/globals.css (lines 56-81)**
```css
::-webkit-scrollbar-thumb {
  background: #d1d5db;  /* gray-300 */
}
::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;  /* gray-400 */
}
@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-thumb {
    background: #4b5563;  /* gray-600 */
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #6b7280;  /* gray-500 */
  }
}
```

**ai-minibar/app/globals.css (lines 27-52)**
```css
::-webkit-scrollbar-thumb {
  background: #d1d5db;
}
.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}
```

### `::placeholder` styling (Tailwind)

| File | Line | Pattern | Status |
|------|------|---------|--------|
| `AIDrawer.tsx` (orbital-zen) | 400, 500, 541 | `placeholder:text-white/40` | Space UI specific |
| `FocusModeSky.tsx` | 141 | `placeholder:text-white/40` | Space UI specific |

### `::selection` styling
- **None found** - no custom selection colors defined

### Recommendation
- **Phase 2:** Create scrollbar tokens:
  - `--color-scrollbar-thumb`
  - `--color-scrollbar-thumb-hover`
- **Defer:** placeholder colors in orbital-zen are intentional for space theme

---

## 5. Framer Motion Color Animations

### Animation props analyzed

All framer-motion `animate`, `initial`, `exit`, `whileHover`, `whileTap` props were reviewed.

| Type | Count | Contains Color? |
|------|-------|-----------------|
| Position animations (`x`, `y`) | ~30 | No |
| Opacity animations | ~25 | No |
| Scale animations | ~8 | No |
| Rotation animations | ~4 | No |
| Color animations | 0 | N/A |

### Notable examples
```tsx
// TaskDetail.tsx - rotation only
animate={{ rotate: isPatternHandleHovered ? 15 : 0 }}

// MiniBarContent.tsx - position/opacity only
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}

// AIDrawer.tsx - scale only
whileTap={{ scale: 0.95 }}
```

### Recommendation
- **No action needed:** No color properties are animated via framer-motion
- Colors change via CSS transitions on className changes, not JS animations

---

## 6. Dynamic/Conditional Color Logic

### Priority color maps (hardcoded Tailwind classes)

**PriorityBreakdownDrawer.tsx (lines 32-53)**
```tsx
const tierConfig = {
  critical: {
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-400",
  },
  high: {
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-400",
  },
  medium: {
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-400",
  },
  low: {
    bgColor: "bg-bg-neutral-subtle",  // Partially tokenized
    textColor: "text-zinc-700 dark:text-zinc-400",
  },
};
```

**PriorityDisplay.tsx (lines 25-37)**
```tsx
critical: { color: "text-red-600 dark:text-red-400" }
high: { color: "text-orange-600 dark:text-orange-400" }
medium: { color: "text-amber-600 dark:text-amber-400" }
low: { color: "text-fg-neutral-secondary" }  // Partially tokenized
```

**TaskRow.tsx (dashboard) (lines 27-32)**
```tsx
const priorityColors = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-blue-400",
};
```

**SolarSystemView.tsx / TaskNode.tsx (lines 33-66)**
```tsx
const priorityConfig = {
  urgent: {
    bg: 'bg-slate-900/20',
    bgHover: 'bg-red-900/30',
    border: 'border-red-500/15',
    borderHover: 'border-red-400/40',
    text: 'text-gray-300/85',
    textHover: 'text-red-200',
  },
  // ... high, medium, low similar
};
```

### Status color maps

**Sidebar.tsx (lines 168-172)**
```tsx
const statusColors = {
  inbox: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
  pool: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
  complete: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
  archived: "bg-zinc-100 dark:bg-zinc-700 text-fg-neutral-secondary",
};
```

### Energy/state color maps

**EnergySelector.tsx (lines 43-57)**
```tsx
color: "text-amber-500 dark:text-amber-400",  // low energy
color: "text-green-500 dark:text-green-400",  // medium energy
color: "text-blue-500 dark:text-blue-400",    // high energy
```

**StatusModule.tsx (lines 30-33)**
```tsx
? "text-green-500"   // complete
? "text-amber-500"   // in progress
: "text-violet-500"  // not started
```

### Inline ternary color logic

| File | Pattern | Count |
|------|---------|-------|
| Various | `isActive ? 'bg-violet-100' : 'bg-bg-neutral-subtle'` | ~40 |
| Various | `isSelected ? 'text-violet-600' : 'text-fg-neutral-primary'` | ~30 |
| Various | `isDone ? 'text-zinc-400 line-through' : 'text-fg-neutral-primary'` | ~15 |

### Project color styling (dynamic from data)

| File | Line | Pattern |
|------|------|---------|
| `ProjectsView.tsx` | 250 | `style={{ backgroundColor: project.color }}` |
| `TaskCreationPopover.tsx` | 208, 308, 388 | `style={{ backgroundColor: project.color }}` |
| `FilterDrawer.tsx` | 592, 597 | `style={{ borderColor: color, backgroundColor }}` |
| `Pill.tsx` | 162 | `backgroundColor: colorDot` (from prop) |

### Recommendation
- **Phase 1 - High Priority:** Create semantic priority tokens:
  - `--color-priority-critical-bg`, `--color-priority-critical-text`
  - `--color-priority-high-bg`, `--color-priority-high-text`
  - `--color-priority-medium-bg`, `--color-priority-medium-text`
  - `--color-priority-low-bg`, `--color-priority-low-text`
- **Phase 1:** Create semantic status tokens:
  - `--color-status-success`, `--color-status-warning`, `--color-status-info`
- **Defer:** Project colors are user-defined and should remain dynamic
- **Defer:** orbital-zen priority config is intentionally dark-theme specific

---

## Appendix: Files with Most Edge Cases

| File | Overlays | Shadows | Dynamic | Total |
|------|----------|---------|---------|-------|
| `TaskDetail.tsx` | 6 | 4 | 8 | 18 |
| `StagingArea.tsx` | 2 | 2 | 6 | 10 |
| `AIDrawer.tsx` (orbital-zen) | 12 | 6 | 2 | 20 |
| `PaletteContent.tsx` | 24 | 0 | 0 | 24 |
| `NotificationSettings.tsx` | 6 | 5 | 2 | 13 |
| `SegmentedControl.tsx` | 2 | 1 | 2 | 5 |

---

## Migration Priority

### Phase 1 (High Priority)
1. **Overlay tokens** - Create `bg-overlay-*` utilities
2. **Priority color tokens** - Centralize priority tier styling
3. **Status color tokens** - Centralize status indicator styling
4. **Glass panel tokens** - Already have `bg-bg-glass-floating-panel`, extend usage

### Phase 2 (Medium Priority)
1. **Scrollbar tokens** - Create scrollbar color tokens
2. **Shadow glow tokens** - For pulse-glow and focus-glow effects
3. **Energy level tokens** - Standardize energy indicator colors

### Defer (Low Priority / Intentional)
1. **orbital-zen space UI** - Intentionally dark theme only
2. **App icons** - Static assets, not theme-switchable
3. **Project colors** - User-defined, must remain dynamic
