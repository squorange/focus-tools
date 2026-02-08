# Design Token System Audit

**Audit Date:** February 7, 2026
**Auditor:** Claude Code
**Scope:** Read-only inventory of the existing design token system

---

## 1. CSS Custom Properties

### Source Files

| File | Purpose |
|------|---------|
| `/packages/design-system/styles/foundations.css` | Primary semantic color tokens (bg/fg/border pattern) |
| `/packages/design-system/styles/tokens.css` | Legacy tokens, primitives, spacing, typography, animation |
| `/packages/design-system/styles/index.css` | Entry point importing both files |

---

### 1.1 Tokens in `:root` (Light Mode)

#### Background Colors - Neutral

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-bg-neutral-base` | `#fafafa` | Main page background |
| `--color-bg-neutral-min` | `#ffffff` | Pure white |
| `--color-bg-neutral-subtle` | `#f4f4f5` | Subtle surface |
| `--color-bg-neutral-subtle-hover` | `#e4e4e7` | Hover state |
| `--color-bg-neutral-low` | `#e4e4e7` | Low emphasis |
| `--color-bg-neutral-low-accented` | `#d4d4d8` | Accented low |
| `--color-bg-neutral-medium` | `#a1a1aa` | Medium emphasis |
| `--color-bg-neutral-inverse` | `#18181b` | Inverse background |
| `--color-bg-neutral-inverse-low` | `#3f3f46` | Inverse low |

#### Background Colors - Transparent

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-bg-transparent-min` | `rgba(0, 0, 0, 0.02)` | Minimal overlay |
| `--color-bg-transparent-subtle` | `rgba(0, 0, 0, 0.04)` | Subtle overlay |
| `--color-bg-transparent-subtle-accented` | `rgba(0, 0, 0, 0.06)` | Accented subtle |
| `--color-bg-transparent-low` | `rgba(0, 0, 0, 0.08)` | Low overlay |
| `--color-bg-transparent-low-accented` | `rgba(0, 0, 0, 0.12)` | Accented low |
| `--color-bg-transparent-medium` | `rgba(0, 0, 0, 0.16)` | Medium overlay |
| `--color-bg-transparent-high` | `rgba(0, 0, 0, 0.40)` | High overlay |
| `--color-bg-transparent-inverse-min` | `rgba(255, 255, 255, 0.04)` | Inverse minimal |
| `--color-bg-transparent-inverse-subtle` | `rgba(255, 255, 255, 0.08)` | Inverse subtle |
| `--color-bg-transparent-inverse-low` | `rgba(255, 255, 255, 0.12)` | Inverse low |
| `--color-bg-transparent-inverse-low-accented` | `rgba(255, 255, 255, 0.16)` | Inverse low accented |
| `--color-bg-transparent-inverse-medium` | `rgba(255, 255, 255, 0.24)` | Inverse medium |
| `--color-bg-transparent-inverse-high` | `rgba(255, 255, 255, 0.48)` | Inverse high |
| `--color-bg-transparent-neutral` | `rgba(0, 0, 0, 0.05)` | **Legacy** |
| `--color-bg-transparent-accent` | `rgba(124, 58, 237, 0.1)` | **Legacy** |

#### Background Colors - Input

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-bg-input-subtle` | `#f5f3ff` | Subtle input bg |
| `--color-bg-input-subtle-accented` | `#ede9fe` | Accented subtle |
| `--color-bg-input-low` | `#ede9fe` | Low input bg |
| `--color-bg-input-low-accented` | `#ddd6fe` | Accented low |
| `--color-bg-input-medium` | `#ddd6fe` | Medium input bg |
| `--color-bg-input-high` | `#7c3aed` | High input bg |
| `--color-bg-input-high-accented` | `#5b21b6` | Accented high |
| `--color-bg-input-default` | `#ffffff` | **Legacy** |
| `--color-bg-input-focus` | `#f5f3ff` | **Legacy** |
| `--color-bg-input-disabled` | `#f4f4f5` | **Legacy** |

#### Background Colors - Positive (Success/Green)

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-bg-positive-subtle` | `#dcfce7` | Subtle success |
| `--color-bg-positive-low` | `#bbf7d0` | Low success |
| `--color-bg-positive-low-accented` | `#86efac` | Accented low |
| `--color-bg-positive-medium` | `#4ade80` | Medium success |
| `--color-bg-positive-strong` | `#22c55e` | Strong success |
| `--color-bg-positive-high` | `#16a34a` | High success |
| `--color-bg-positive-high-accented` | `#15803d` | Accented high |
| `--color-bg-positive-default` | `#22c55e` | **Legacy** |
| `--color-bg-positive-bold` | `#16a34a` | **Legacy** |

#### Background Colors - Attention (Warning/Amber)

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-bg-attention-subtle` | `#fef3c7` | Subtle warning |
| `--color-bg-attention-low` | `#fde68a` | Low warning |
| `--color-bg-attention-low-accented` | `#fcd34d` | Accented low |
| `--color-bg-attention-medium` | `#fbbf24` | Medium warning |
| `--color-bg-attention-high` | `#f59e0b` | High warning |
| `--color-bg-attention-high-accented` | `#d97706` | Accented high |
| `--color-bg-attention-default` | `#f59e0b` | **Legacy** |
| `--color-bg-attention-bold` | `#d97706` | **Legacy** |

#### Background Colors - Alert (Error/Red)

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-bg-alert-subtle` | `#fee2e2` | Subtle error |
| `--color-bg-alert-low` | `#fecaca` | Low error |
| `--color-bg-alert-low-accented` | `#fca5a5` | Accented low |
| `--color-bg-alert-medium` | `#f87171` | Medium error |
| `--color-bg-alert-high` | `#ef4444` | High error |
| `--color-bg-alert-high-accented` | `#dc2626` | Accented high |
| `--color-bg-alert-default` | `#ef4444` | **Legacy** |
| `--color-bg-alert-bold` | `#dc2626` | **Legacy** |

#### Background Colors - Information (Blue)

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-bg-information-subtle` | `#dbeafe` | Subtle info |
| `--color-bg-information-low` | `#bfdbfe` | Low info |
| `--color-bg-information-low-accented` | `#93c5fd` | Accented low |
| `--color-bg-information-medium` | `#60a5fa` | Medium info |
| `--color-bg-information-high` | `#3b82f6` | High info |
| `--color-bg-information-high-accented` | `#2563eb` | Accented high |
| `--color-bg-info-subtle` | `#dbeafe` | **Legacy alias** |
| `--color-bg-info-default` | `#3b82f6` | **Legacy alias** |
| `--color-bg-info-bold` | `#2563eb` | **Legacy alias** |

#### Background Colors - Accent (Violet/Purple)

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-bg-accent-subtle` | `#ede9fe` | Subtle accent |
| `--color-bg-accent-low` | `#ddd6fe` | Low accent |
| `--color-bg-accent-low-accented` | `#c4b5fd` | Accented low |
| `--color-bg-accent-medium` | `#a78bfa` | Medium accent |
| `--color-bg-accent-high` | `#8b5cf6` | High accent |
| `--color-bg-accent-high-accented` | `#7c3aed` | Accented high |
| `--color-bg-accent-default` | `#8b5cf6` | **Legacy** |
| `--color-bg-accent-bold` | `#7c3aed` | **Legacy** |

#### Background Colors - Generative (AI)

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-bg-generative-strong` | `#7c3aed` | Strong AI |
| `--color-bg-generative-high` | `#8b5cf6` | High AI |
| `--color-bg-generative-high-accented` | `#a78bfa` | Accented high |

#### Background Colors - Status

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-bg-status-completed-subtle` | `#dcfce7` | Completed subtle |
| `--color-bg-status-completed-low` | `#bbf7d0` | Completed low |
| `--color-bg-status-completed-bold` | `#16a34a` | Completed bold |
| `--color-bg-status-today-subtle` | `#ede9fe` | Today subtle |
| `--color-bg-status-today-low` | `#ddd6fe` | Today low |
| `--color-bg-status-today-bold` | `#8b5cf6` | Today bold |
| `--color-bg-status-focus-subtle` | `#f5f3ff` | Focus subtle |
| `--color-bg-status-focus-low` | `#ede9fe` | Focus low |
| `--color-bg-status-focus-bold` | `#6d28d9` | Focus bold |
| `--color-bg-status-waiting-subtle` | `#ffedd5` | Waiting subtle |
| `--color-bg-status-waiting-low` | `#fed7aa` | Waiting low |
| `--color-bg-status-waiting-bold` | `#f97316` | Waiting bold |
| `--color-bg-status-deferred-subtle` | `#e0e7ff` | Deferred subtle |
| `--color-bg-status-deferred-low` | `#c7d2fe` | Deferred low |
| `--color-bg-status-deferred-bold` | `#6366f1` | Deferred bold |
| `--color-bg-status-ready-subtle` | `#dbeafe` | Ready subtle |
| `--color-bg-status-ready-low` | `#bfdbfe` | Ready low |
| `--color-bg-status-ready-bold` | `#2563eb` | Ready bold |
| `--color-bg-status-inbox-subtle` | `#fef3c7` | Inbox subtle |
| `--color-bg-status-inbox-low` | `#fde68a` | Inbox low |
| `--color-bg-status-inbox-bold` | `#d97706` | Inbox bold |
| `--color-bg-status-archived-subtle` | `#f4f4f5` | Archived subtle |
| `--color-bg-status-archived-low` | `#e4e4e7` | Archived low |
| `--color-bg-status-archived-bold` | `#71717a` | Archived bold |

#### Foreground Colors - Neutral

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-neutral-primary` | `#18181b` | Primary text |
| `--color-fg-neutral-secondary` | `#3f3f46` | Secondary text |
| `--color-fg-neutral-softest` | `#d4d4d8` | Softest text |
| `--color-fg-neutral-softer` | `#a1a1aa` | Softer text |
| `--color-fg-neutral-soft` | `#71717a` | Soft text |
| `--color-fg-neutral-spot-readable` | `#52525b` | Spot readable |
| `--color-fg-neutral-disabled` | `#a1a1aa` | Disabled text |
| `--color-fg-neutral-inverse-primary` | `#ffffff` | Inverse primary |
| `--color-fg-neutral-inverse-secondary` | `#e4e4e7` | Inverse secondary |
| `--color-fg-neutral-inverse` | `#ffffff` | **Legacy** |

#### Foreground Colors - Transparent

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-transparent-softer` | `rgba(0, 0, 0, 0.12)` | Softer |
| `--color-fg-transparent-soft` | `rgba(0, 0, 0, 0.24)` | Soft |
| `--color-fg-transparent-medium` | `rgba(0, 0, 0, 0.40)` | Medium |
| `--color-fg-transparent-strong` | `rgba(0, 0, 0, 0.64)` | Strong |
| `--color-fg-transparent-inverse-softer` | `rgba(255, 255, 255, 0.16)` | Inverse softer |
| `--color-fg-transparent-inverse-soft` | `rgba(255, 255, 255, 0.32)` | Inverse soft |
| `--color-fg-transparent-inverse-medium` | `rgba(255, 255, 255, 0.56)` | Inverse medium |
| `--color-fg-transparent-inverse-strong` | `rgba(255, 255, 255, 0.80)` | Inverse strong |

#### Foreground Colors - Input

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-input-primary` | `#5b21b6` | Input primary |
| `--color-fg-input-secondary` | `#7c3aed` | Input secondary |
| `--color-fg-input-spot-readable` | `#8b5cf6` | Spot readable |
| `--color-fg-input-soft` | `#c4b5fd` | Soft |

#### Foreground Colors - Positive

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-positive-primary` | `#15803d` | Primary |
| `--color-fg-positive-secondary` | `#16a34a` | Secondary |
| `--color-fg-positive-spot-readable` | `#22c55e` | Spot readable |
| `--color-fg-positive-inverse-primary` | `#ffffff` | Inverse primary |
| `--color-fg-positive-inverse-secondary` | `#bbf7d0` | Inverse secondary |
| `--color-fg-positive-default` | `#15803d` | **Legacy** |
| `--color-fg-positive-subtle` | `#16a34a` | **Legacy** |

#### Foreground Colors - Attention

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-attention-primary` | `#92400e` | Primary |
| `--color-fg-attention-secondary` | `#b45309` | Secondary |
| `--color-fg-attention-default` | `#b45309` | **Legacy** |
| `--color-fg-attention-subtle` | `#d97706` | **Legacy** |

#### Foreground Colors - Alert

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-alert-primary` | `#b91c1c` | Primary |
| `--color-fg-alert-secondary` | `#dc2626` | Secondary |
| `--color-fg-alert-inverse-primary` | `#ffffff` | Inverse primary |
| `--color-fg-alert-inverse-secondary` | `#fecaca` | Inverse secondary |
| `--color-fg-alert-default` | `#b91c1c` | **Legacy** |
| `--color-fg-alert-subtle` | `#dc2626` | **Legacy** |

#### Foreground Colors - Information

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-information-primary` | `#1d4ed8` | Primary |
| `--color-fg-information-secondary` | `#2563eb` | Secondary |
| `--color-fg-information-spot-readable` | `#3b82f6` | Spot readable |
| `--color-fg-information-inverse-primary` | `#ffffff` | Inverse primary |
| `--color-fg-information-inverse-secondary` | `#bfdbfe` | Inverse secondary |
| `--color-fg-info-default` | `#1d4ed8` | **Legacy alias** |
| `--color-fg-info-subtle` | `#2563eb` | **Legacy alias** |

#### Foreground Colors - Accent

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-accent-primary` | `#5b21b6` | Primary |
| `--color-fg-accent-secondary` | `#6d28d9` | Secondary |
| `--color-fg-accent-spot-readable` | `#7c3aed` | Spot readable |
| `--color-fg-accent-default` | `#6d28d9` | **Legacy** |
| `--color-fg-accent-subtle` | `#7c3aed` | **Legacy** |

#### Foreground Colors - Generative (AI)

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-generative-spot-readable` | `#7c3aed` | Spot readable |
| `--color-fg-generative-inverse-primary` | `#ffffff` | Inverse primary |
| `--color-fg-generative-inverse-secondary` | `#ddd6fe` | Inverse secondary |

#### Foreground Colors - Status

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-status-completed` | `#15803d` | Completed |
| `--color-fg-status-today` | `#6d28d9` | Today |
| `--color-fg-status-focus` | `#7c3aed` | Focus |
| `--color-fg-status-waiting` | `#c2410c` | Waiting |
| `--color-fg-status-deferred` | `#4338ca` | Deferred |
| `--color-fg-status-ready` | `#1d4ed8` | Ready |
| `--color-fg-status-inbox` | `#b45309` | Inbox |
| `--color-fg-status-archived` | `#52525b` | Archived |

#### Foreground Colors - A11y

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-fg-a11y-primary` | `#2563eb` | Focus ring color |

#### Border Colors - Neutral

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-border-neutral-subtle` | `#f4f4f5` | Subtle border |
| `--color-border-neutral-low` | `#e4e4e7` | Low border |
| `--color-border-neutral-medium` | `#d4d4d8` | Medium border |
| `--color-border-neutral-default` | `#e4e4e7` | Default border |
| `--color-border-neutral-strong` | `#d4d4d8` | Strong border |

#### Border Colors - Input

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-border-input-default` | `#d4d4d8` | Default input |
| `--color-border-input-high` | `#7c3aed` | High emphasis |
| `--color-border-input-focus` | `#8b5cf6` | Focus state |
| `--color-border-input-error` | `#ef4444` | Error state |

#### Border Colors - Semantic

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-border-positive` | `#22c55e` | Success border |
| `--color-border-positive-high` | `#16a34a` | High success |
| `--color-border-attention` | `#f59e0b` | Warning border |
| `--color-border-alert` | `#ef4444` | Error border |
| `--color-border-alert-high` | `#dc2626` | High error |
| `--color-border-accent` | `#8b5cf6` | Accent border |
| `--color-border-accent-low` | `#ddd6fe` | Low accent |
| `--color-border-accent-medium` | `#c4b5fd` | Medium accent |
| `--color-border-info` | `#3b82f6` | Info border |

#### Border Colors - A11y

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--color-border-a11y-primary` | `#2563eb` | Focus ring |

#### Glass Effects

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--glass-floating-bg` | `rgba(255, 255, 255, 0.85)` | Floating bg |
| `--glass-floating-blur` | `blur(12px)` | Floating blur |
| `--glass-floating-border` | `1px solid rgba(0, 0, 0, 0.06)` | Floating border |
| `--glass-floating-panel-bg` | `rgba(255, 255, 255, 0.92)` | Panel bg |
| `--glass-floating-panel-blur` | `blur(16px)` | Panel blur |
| `--glass-floating-panel-border` | `1px solid rgba(0, 0, 0, 0.08)` | Panel border |
| `--glass-floating-panel-shadow` | `0 8px 32px rgba(0, 0, 0, 0.12)` | Panel shadow |
| `--glass-secondary-bg` | `rgba(128, 128, 128, 0.08)` | Secondary bg |
| `--glass-secondary-blur` | `blur(8px)` | Secondary blur |
| `--glass-secondary-border` | `1px solid rgba(0, 0, 0, 0.04)` | Secondary border |
| `--glass-secondary-hover-bg` | `rgba(128, 128, 128, 0.14)` | Secondary hover |
| `--glass-ghost-bg` | `rgba(128, 128, 128, 0.04)` | Ghost bg |
| `--glass-ghost-blur` | `blur(4px)` | Ghost blur |
| `--glass-ghost-hover-bg` | `rgba(128, 128, 128, 0.10)` | Ghost hover |
| `--glass-button-bg` | `rgba(255, 255, 255, 0.7)` | Button bg |
| `--glass-button-blur` | `blur(8px)` | Button blur |
| `--glass-button-border` | `1px solid rgba(0, 0, 0, 0.08)` | Button border |
| `--glass-button-hover-bg` | `rgba(255, 255, 255, 0.85)` | Button hover |
| `--glass-button-active-bg` | `rgba(255, 255, 255, 0.92)` | Button active |

#### Focus Shadows

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--shadow-focus` | `0 0 0 3px var(--color-bg-accent-low)` | Default focus |
| `--shadow-focus-error` | `0 0 0 3px var(--color-bg-alert-low)` | Error focus |
| `--shadow-focus-success` | `0 0 0 3px var(--color-bg-positive-low)` | Success focus |

#### ActionableCard Component Tokens

| Token | Light Value | Notes |
|-------|-------------|-------|
| `--actionable-card-radius` | `0.5rem` | Border radius |
| `--actionable-card-compact-radius` | `0.75rem` | Compact radius |
| `--actionable-card-padding-x` | `0.75rem` | Horizontal padding |
| `--actionable-card-padding-x-sm` | `1rem` | SM+ padding |
| `--actionable-card-padding-y` | `0.75rem` | Vertical padding |
| `--actionable-card-gap` | `0.5rem` | Gap |
| `--actionable-card-title-size` | `0.875rem` | Title size |
| `--actionable-card-title-weight` | `400` | Title weight |
| `--actionable-card-compact-title-weight` | `500` | Compact weight |
| `--actionable-card-title-line-height` | `1.25rem` | Title line height |
| `--actionable-card-meta-size` | `0.75rem` | Meta size |
| `--actionable-card-meta-line-height` | `1rem` | Meta line height |
| `--actionable-card-action-size` | `0.75rem` | Action size |
| `--actionable-card-compact-height` | `110px` | Compact height |
| `--actionable-card-compact-title-clamp` | `2` | Title clamp |
| `--actionable-card-bg-default` | `#fafafa` | Default bg |
| `--actionable-card-border-default` | `#e4e4e7` | Default border |
| `--actionable-card-hover-bg-default` | `#f4f4f5` | Hover bg |
| `--actionable-card-hover-border-default` | `#d4d4d8` | Hover border |
| `--actionable-card-bg-highlighted` | `#faf5ff` | Highlighted bg |
| `--actionable-card-border-highlighted` | `#ede9fe` | Highlighted border |
| `--actionable-card-hover-bg-highlighted` | `#f5f3ff` | Highlighted hover |
| `--actionable-card-hover-border-highlighted` | `#c4b5fd` | Highlighted hover border |
| `--actionable-card-bg-muted` | `rgba(244, 244, 245, 0.6)` | Muted bg |
| `--actionable-card-border-muted` | `var(--color-border-neutral-default)` | Muted border |
| `--actionable-card-opacity-muted` | `0.7` | Muted opacity |
| `--actionable-card-queued-indicator` | `var(--color-border-accent)` | Queued indicator |
| `--actionable-card-complete-opacity` | `0.6` | Complete opacity |

---

### 1.2 Tokens in `.dark` (Dark Mode Overrides)

All semantic color tokens defined in `:root` have corresponding dark mode overrides in `.dark`. Key differences:

| Category | Light Mode Strategy | Dark Mode Strategy |
|----------|--------------------|--------------------|
| **Neutral backgrounds** | Solid hex colors (zinc scale) | Inverted zinc scale |
| **Semantic backgrounds** | Solid colors | Semi-transparent rgba with 0.25-0.45 opacity |
| **Foreground colors** | Darker shades for contrast | Lighter shades for contrast |
| **Borders** | Light zinc shades | Darker zinc shades |
| **Glass effects** | White-based rgba | Dark gray-based rgba |

**Dark mode tokens include:**
- All `--color-bg-*` tokens (inverted/adjusted)
- All `--color-fg-*` tokens (inverted/adjusted)
- All `--color-border-*` tokens (inverted)
- All `--glass-*` tokens (inverted)
- All `--actionable-card-*` appearance tokens

---

### 1.3 Legacy Tokens in tokens.css

The `tokens.css` file contains an older token system that is being deprecated:

#### Primitive Colors

| Scale | Defined Shades |
|-------|----------------|
| Zinc | 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 |
| Violet | 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 |
| Green | 50, 100, 300, 400, 500, 600, 700, 900 |
| Red | 50, 100, 300, 400, 500, 600, 700, 900 |
| Amber | 50, 100, 300, 400, 500, 600, 700, 900 |
| Orange | 50, 100, 300, 400, 500, 600, 700, 900 |
| Blue | 50, 100, 300, 400, 500, 600, 700, 900 |
| Indigo | 50, 100, 300, 400, 500, 600, 700, 900 |

#### Legacy Semantic Tokens

| Token | Pattern |
|-------|---------|
| `--color-surface` | Surface colors (base, elevated, muted, inset) |
| `--color-text-*` | Text colors (primary, secondary, tertiary, muted, inverse) |
| `--color-border` | Border colors (default, light, strong) |
| `--color-primary` | Brand colors (default, hover, light, muted) |
| `--color-success/error/warning/info` | Feedback colors |
| `--color-status-*` | Task status colors (8 statuses x 3 variants each) |
| `--color-health-*` | Health status colors (3 states x 3 variants) |
| `--color-priority-*` | Priority colors (3 levels x 3 variants) |
| `--space-*` | Spacing scale (0-20) |
| `--font-size-*` | Typography sizes |
| `--line-height-*` | Line heights |
| `--font-weight-*` | Font weights |
| `--duration-*` | Animation durations |
| `--ease-*` | Easing functions |
| `--shadow-*` | Box shadows |
| `--radius-*` | Border radii |
| `--height-*` | Layout heights |
| `--width-*` | Layout widths |
| `--breakpoint-*` | Breakpoints (reference only) |

---

## 2. Tailwind Preset Mapping

**Source:** `/packages/design-system/tailwind.preset.cjs`

### Color Mappings

The preset maps CSS custom properties to Tailwind utilities. The pattern is:

| CSS Variable | Tailwind Class |
|--------------|----------------|
| `var(--color-bg-neutral-base)` | `bg-bg-neutral-base` |
| `var(--color-fg-neutral-primary)` | `text-fg-neutral-primary` |
| `var(--color-border-neutral-default)` | `border-border-color-neutral` |

### Full Color Configuration

```javascript
colors: {
  // Background Colors (bg-bg-*)
  bg: {
    neutral: {
      base, min, subtle, 'subtle-hover', low, 'low-accented',
      medium, inverse, 'inverse-low'
    },
    transparent: {
      min, subtle, 'subtle-accented', low, 'low-accented',
      medium, high, 'inverse-min', 'inverse-subtle',
      'inverse-low', 'inverse-low-accented', 'inverse-medium',
      'inverse-high', neutral (legacy), accent (legacy)
    },
    input: {
      subtle, 'subtle-accented', low, 'low-accented',
      medium, high, 'high-accented', DEFAULT (legacy),
      focus (legacy), disabled (legacy)
    },
    positive: {
      subtle, low, 'low-accented', medium, strong, high,
      'high-accented', DEFAULT (legacy), bold (legacy)
    },
    attention: {
      subtle, low, 'low-accented', medium, high,
      'high-accented', DEFAULT (legacy), bold (legacy)
    },
    alert: {
      subtle, low, 'low-accented', medium, high,
      'high-accented', DEFAULT (legacy), bold (legacy)
    },
    information: {
      subtle, low, 'low-accented', medium, high, 'high-accented'
    },
    accent: {
      subtle, low, 'low-accented', medium, high,
      'high-accented', DEFAULT (legacy), bold (legacy)
    },
    generative: { strong, high, 'high-accented' },
    info: { subtle, DEFAULT, bold } (legacy alias),
    status: {
      'completed-subtle', 'completed-low', 'completed-bold',
      'today-subtle', 'today-low', 'today-bold',
      'focus-subtle', 'focus-low', 'focus-bold',
      'waiting-subtle', 'waiting-low', 'waiting-bold',
      'deferred-subtle', 'deferred-low', 'deferred-bold',
      'ready-subtle', 'ready-low', 'ready-bold',
      'inbox-subtle', 'inbox-low', 'inbox-bold',
      'archived-subtle', 'archived-low', 'archived-bold'
    }
  },

  // Foreground Colors (text-fg-*)
  fg: {
    neutral: {
      primary, secondary, softest, softer, soft,
      'spot-readable', disabled, 'inverse-primary',
      'inverse-secondary', inverse (legacy)
    },
    transparent: {
      softer, soft, medium, strong,
      'inverse-softer', 'inverse-soft', 'inverse-medium', 'inverse-strong'
    },
    input: { primary, secondary, 'spot-readable', soft },
    positive: {
      primary, secondary, 'spot-readable',
      'inverse-primary', 'inverse-secondary',
      DEFAULT (legacy), subtle (legacy)
    },
    attention: {
      primary, secondary,
      DEFAULT (legacy), subtle (legacy)
    },
    alert: {
      primary, secondary, 'inverse-primary', 'inverse-secondary',
      DEFAULT (legacy), subtle (legacy)
    },
    information: {
      primary, secondary, 'spot-readable',
      'inverse-primary', 'inverse-secondary'
    },
    accent: {
      primary, secondary, 'spot-readable',
      DEFAULT (legacy), subtle (legacy)
    },
    generative: {
      'spot-readable', 'inverse-primary', 'inverse-secondary'
    },
    a11y: { primary },
    info: { DEFAULT, subtle } (legacy alias),
    status: {
      completed, today, focus, waiting,
      deferred, ready, inbox, archived
    }
  },

  // Border Colors (border-border-color-*)
  'border-color': {
    neutral: { subtle, low, medium, DEFAULT, strong },
    input: { DEFAULT, high, focus, error },
    positive: { DEFAULT, high },
    attention: string,
    alert: { DEFAULT, high },
    accent: { DEFAULT, low, medium },
    info: string,
    a11y: { primary }
  },

  // Glass Effects
  glass: {
    floating: { bg },
    'floating-panel': { bg },
    secondary: { bg, 'hover-bg' },
    ghost: { bg, 'hover-bg' },
    button: { bg, 'hover-bg', 'active-bg' }
  },

  // LEGACY colors maintained for backward compatibility
  surface, 'surface-elevated', 'surface-muted', 'surface-inset',
  'text-primary', 'text-secondary', 'text-tertiary', 'text-muted',
  border, 'border-light', 'border-strong',
  primary, success, error, warning, info,
  status (legacy), health, priority
}
```

### Other Tailwind Extensions

| Category | Prefix | Example Classes |
|----------|--------|-----------------|
| Spacing | `space-*` | `p-space-4`, `gap-space-2` |
| Font Sizes | `ds-*` | `text-ds-sm`, `text-ds-lg` |
| Border Radius | `ds-*` | `rounded-ds-md`, `rounded-ds-xl` |
| Box Shadows | `ds-*` | `shadow-ds-md`, `shadow-ds-focus` |
| Transition Duration | `ds-*` | `duration-ds-fast`, `duration-ds-slow` |
| Transition Timing | `ds-*` | `ease-ds-default`, `ease-ds-spring` |
| Width | - | `w-drawer`, `w-minibar`, `w-palette` |
| Height | - | `h-header`, `h-tab-bar`, `h-collapsed` |
| Backdrop Blur | `glass-*` | `backdrop-blur-glass-floating` |

---

## 3. TypeScript Token Files

### 3.1 tokens/ Directory (Legacy, Deprecated)

| File | Status | Purpose |
|------|--------|---------|
| `/packages/design-system/tokens/index.ts` | Deprecated | Re-exports from foundations |
| `/packages/design-system/tokens/colors.ts` | Deprecated | Color primitives and status colors |
| `/packages/design-system/tokens/spacing.ts` | Deprecated | Spacing scale |
| `/packages/design-system/tokens/typography.ts` | Deprecated | Font sizes, weights, line heights |
| `/packages/design-system/tokens/animation.ts` | Deprecated | Durations, easings, spring configs |
| `/packages/design-system/tokens/breakpoints.ts` | Deprecated | Breakpoints, layout dimensions |

### 3.2 foundations/ Directory (Current)

| File | Purpose | Key Exports |
|------|---------|-------------|
| `index.ts` | Central export | All foundations |
| `colors.ts` | Semantic colors | `bg`, `fg`, `border`, `colors`, `colorValues` |
| `primitives/colors.ts` | Raw color scales | `zinc`, `violet`, `green`, `red`, `amber`, `orange`, `blue`, `indigo` |
| `primitives/index.ts` | Primitives export | All color primitives |
| `spacing.ts` | Spacing tokens | `space`, `spacePx`, `spaceBetween`, `spaceAround`, `borderRadius` |
| `typography.ts` | Typography tokens | `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing` |
| `textStyles.ts` | Preset text styles | `display`, `heading`, `title`, `body`, `label`, `eyebrow` |
| `motion.ts` | Animation tokens | `duration`, `easing`, `spring`, `transitions` |
| `elevation.ts` | Z-index levels | `elevation`, `elevationStyles` |
| `shadows.ts` | Box shadows | `shadows`, `shadowsDark`, `focusShadows` |
| `layers.ts` | Z-index tokens | `zIndex` |
| `glass.ts` | Glass effects | `glass`, `glassDark`, `getGlassStyle`, `getGlassCSS` |
| `layout.ts` | Layout tokens | `breakpoints`, `media`, `widths`, `heights` |

### 3.3 Key TypeScript Exports

#### Color Primitives
```typescript
export const zinc = {
  50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8',
  400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46',
  800: '#27272a', 900: '#18181b', 950: '#09090b'
};
// Similar for violet, green, red, amber, orange, blue, indigo
```

#### Semantic Colors (references CSS vars)
```typescript
export const bg = {
  neutral: { base: 'var(--color-bg-neutral-base)', ... },
  positive: { subtle: 'var(--color-bg-positive-subtle)', ... },
  // ... all semantic color groups
};
```

#### Spacing
```typescript
export const space = {
  0: '0', 0.5: '2px', 1: '4px', 1.5: '6px', 2: '8px', 2.5: '10px',
  3: '12px', 3.5: '14px', 4: '16px', 5: '20px', 6: '24px', 7: '28px',
  8: '32px', 9: '36px', 10: '40px', 12: '48px', 14: '56px', 16: '64px', 20: '80px'
};
export const borderRadius = {
  none: '0', xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', full: '9999px'
};
```

#### Motion
```typescript
export const duration = {
  instant: 0, fast: 150, normal: 250, slow: 350, slower: 500
};
export const springDefault = { type: 'spring', stiffness: 500, damping: 35, mass: 0.8 };
```

---

## 4. Token Health Check

### 4.1 Light/Dark Mode Coverage

| Token Category | Light Defined | Dark Defined | Status |
|----------------|---------------|--------------|--------|
| `bg.neutral.*` | Yes | Yes | Complete |
| `bg.transparent.*` | Yes | Yes | Complete |
| `bg.input.*` | Yes | Yes | Complete |
| `bg.positive.*` | Yes | Yes | Complete |
| `bg.attention.*` | Yes | Yes | Complete |
| `bg.alert.*` | Yes | Yes | Complete |
| `bg.information.*` | Yes | Yes | Complete |
| `bg.accent.*` | Yes | Yes | Complete |
| `bg.generative.*` | Yes | Yes | Complete |
| `bg.status.*` | Yes | Yes | Complete |
| `fg.neutral.*` | Yes | Yes | Complete |
| `fg.transparent.*` | Yes | Yes | Complete |
| `fg.input.*` | Yes | Yes | Complete |
| `fg.positive.*` | Yes | Yes | Complete |
| `fg.attention.*` | Yes | Yes | Complete |
| `fg.alert.*` | Yes | Yes | Complete |
| `fg.information.*` | Yes | Yes | Complete |
| `fg.accent.*` | Yes | Yes | Complete |
| `fg.generative.*` | Yes | Yes | Complete |
| `fg.status.*` | Yes | Yes | Complete |
| `fg.a11y.*` | Yes | Yes | Complete |
| `border.neutral.*` | Yes | Yes | Complete |
| `border.input.*` | Yes | Yes | Complete |
| `border.semantic.*` | Yes | Yes | Complete |
| `border.a11y.*` | Yes | Yes | Complete |
| `glass.*` | Yes | Yes | Complete |
| `actionable-card.*` | Yes | Yes | Complete |

### 4.2 Token Usage in Codebase

Based on grep analysis:

| Pattern | Files Using |
|---------|-------------|
| `bg-bg-*` | 65 files |
| `text-fg-*` | 83 files |
| `border-border-color-*` | 48 files |

#### Most Used Token Categories

1. **Foreground tokens** (text-fg-*): 83 files - highest usage
2. **Background tokens** (bg-bg-*): 65 files
3. **Border tokens** (border-border-color-*): 48 files

### 4.3 Unused Tokens

The following tokens are defined but have low or no direct usage in TSX/TS files:

| Token | Status | Notes |
|-------|--------|-------|
| `--color-bg-generative-*` | Low usage | AI-specific, may be used in specific components |
| `--color-fg-transparent-inverse-*` | Low usage | Edge case for overlays |
| `--color-fg-input-*` | Moderate | Input-specific styling |
| Many `--glass-*-blur` tokens | CSS only | Used via CSS var in stylesheets |

### 4.4 CSS Variable Reference Check

**Variables referenced in TypeScript that exist in CSS:**
- All `var(--color-bg-*)` in foundations/colors.ts are defined in foundations.css
- All `var(--color-fg-*)` in foundations/colors.ts are defined in foundations.css
- All `var(--color-border-*)` in foundations/colors.ts are defined in foundations.css

**No orphaned variable references found.**

### 4.5 Potential Issues

| Issue | Severity | Details |
|-------|----------|---------|
| Legacy tokens coexist with new system | Medium | `tokens.css` and `foundations.css` both define tokens with different naming |
| Duplicate status token systems | Low | Old `--color-status-*` in tokens.css vs new `--color-bg-status-*` in foundations.css |
| Info alias duplication | Low | Both `information` and `info` prefixes exist |

---

## 5. Coverage Summary Table

### Semantic Color Coverage Matrix

| Role / Category | neutral | transparent | input | positive | attention | alert | information | accent | generative | status | a11y |
|-----------------|:-------:|:-----------:|:-----:|:--------:|:---------:|:-----:|:-----------:|:------:|:----------:|:------:|:----:|
| **bg** | base, min, subtle, subtle-hover, low, low-accented, medium, inverse, inverse-low | min, subtle, subtle-accented, low, low-accented, medium, high, inverse-min, inverse-subtle, inverse-low, inverse-low-accented, inverse-medium, inverse-high | subtle, subtle-accented, low, low-accented, medium, high, high-accented | subtle, low, low-accented, medium, strong, high, high-accented | subtle, low, low-accented, medium, high, high-accented | subtle, low, low-accented, medium, high, high-accented | subtle, low, low-accented, medium, high, high-accented | subtle, low, low-accented, medium, high, high-accented | strong, high, high-accented | {8 statuses} x (subtle, low, bold) | - |
| **fg** | primary, secondary, softest, softer, soft, spot-readable, disabled, inverse-primary, inverse-secondary | softer, soft, medium, strong, inverse-softer, inverse-soft, inverse-medium, inverse-strong | primary, secondary, spot-readable, soft | primary, secondary, spot-readable, inverse-primary, inverse-secondary | primary, secondary | primary, secondary, inverse-primary, inverse-secondary | primary, secondary, spot-readable, inverse-primary, inverse-secondary | primary, secondary, spot-readable | spot-readable, inverse-primary, inverse-secondary | {8 statuses} | primary |
| **border** | subtle, low, medium, default, strong | - | default, high, focus, error | default, high | default | default, high | - | default, low, medium | - | - | primary |

### Intensity Level Key

| Level | Typical Use |
|-------|-------------|
| `min` | Absolute minimum emphasis |
| `subtle` | Very light, background accents |
| `subtle-accented` | Slightly stronger subtle |
| `low` | Low emphasis surfaces |
| `low-accented` | Accented low surfaces |
| `medium` | Medium emphasis |
| `strong` | Strong emphasis |
| `high` | High emphasis (often solid colors) |
| `high-accented` | Maximum emphasis |
| `inverse` | Inverted color scheme |

---

## 6. Gaps & Observations

### Gaps Identified

1. **Missing `bg.information` in TS foundations/colors.ts**: The TypeScript `bg` object uses `info` as a shorthand but `information` is the full pattern in CSS. This creates a naming inconsistency.

2. **Inconsistent intensity scale naming**:
   - Some groups use: subtle -> low -> medium -> high
   - Others add: strong, bold, accented variants
   - Generative only has: strong, high, high-accented (no subtle/low)

3. **Border tokens less granular**: Border colors have fewer intensity levels than bg/fg tokens. Missing `border.information`, `border.generative`, etc.

4. **No ring tokens**: Focus rings use shadow tokens (`--shadow-focus`), but there are no dedicated ring color tokens.

5. **Status tokens have different structures**:
   - In CSS: 3 levels (subtle, low, bold)
   - In TS foundations/colors.ts bg.status: 2 levels (subtle, bold) - missing "low"

### Observations

1. **Well-structured semantic system**: The bg/fg/border pattern follows EHR design token conventions and provides clear role separation.

2. **Comprehensive dark mode support**: Every token defined in `:root` has a corresponding `.dark` override.

3. **Legacy migration in progress**: The codebase shows a transition from older tokens (tokens.css, tokens/*.ts) to the new foundations system. Deprecation notices are in place.

4. **Good TypeScript integration**: TypeScript exports mirror CSS custom properties, enabling type-safe token usage.

5. **Glass effects well-defined**: Complete glass effect system with 5 variants (floating, floatingPanel, secondary, ghost, button) and proper hover/active states.

6. **ActionableCard has dedicated tokens**: Component-specific tokens are defined, showing a pattern that could be extended to other components.

7. **High adoption rate**: 65-83 files use the new bg-bg-*/text-fg-* patterns, indicating good migration progress.

### Recommendations for Future Work

1. Harmonize `info` vs `information` naming
2. Add missing intensity levels to `bg.generative` (subtle, low, medium)
3. Add missing border semantic colors (information, generative)
4. Consider adding dedicated ring tokens
5. Complete the status token structure (add "low" to TS definitions)
6. Document the intensity scale officially
7. Remove legacy tokens after full migration

---

*End of Token System Audit*
