# Theme System — Design System Audit Prompts

> **Purpose:** Run these prompts in Claude Code to gather current-state implementation details for the theming system buildout.
> **Run order:** 1 → 2 → 3 → 4 → 5 → 6 (each builds context for the next)
> **Session strategy:** Prompts 1+2 in one session, 3+4 in another, 5+6 together as a quick pass.

---

## General Instructions for Claude Code

Include this preamble with each prompt (or at session start):

```
For each audit prompt, write the results to a markdown file in the project root under `docs/audits/`. Use the filename specified in the prompt. Do NOT make any code changes — this is read-only reconnaissance. Be thorough but concise. Use tables where possible.
```

---

## Prompt 1: Token Inventory

**Output file:** `docs/audits/01-token-inventory.md`

```
Audit the existing design token system. Write results to docs/audits/01-token-inventory.md.

DO NOT make any code changes — read-only audit.

1. **CSS Custom Properties (foundations.css or equivalent)**
   - List every CSS custom property defined, grouped by selector (:root, .dark, any others)
   - Format as a table: token name | light value | dark value | notes

2. **Tailwind Preset Mapping (tailwind.preset.cjs or equivalent)**
   - Show the full color/extend configuration that maps Tailwind utilities to CSS vars
   - Note the resulting Tailwind class name for each mapping (e.g., var(--color-bg-neutral-subtle) → bg-bg-neutral-subtle)

3. **TypeScript Token Files**
   - List any files in tokens/, foundations/, or similar directories
   - Show exported constants, types, and their values

4. **Token Health Check**
   For each semantic token:
   - Does it have BOTH light AND dark values defined? Flag any missing.
   - Is it referenced anywhere in the codebase? (cross-reference with .tsx/.ts files)
   - Flag any tokens defined but unused
   - Flag any usage of --color-* vars that don't exist in foundations.css

5. **Coverage Summary Table**
   Rows: roles (bg, fg, border, ring, etc.)
   Columns: categories (neutral, primary, positive, negative, warning, accent, etc.)
   Cells: list of intensity levels that exist (subtle, low, medium, strong, etc.)

Include a final section: "Gaps & Observations" noting any patterns or inconsistencies.
```

---

## Prompt 2: Color Usage Audit

**Output file:** `docs/audits/02-color-usage-audit.md`

```
Audit ALL color usage across the codebase. Write results to docs/audits/02-color-usage-audit.md.

DO NOT make any code changes — read-only audit.

Generate three reports:

### Report A: Semantic Token Usage (The Good)
List all files using CSS custom properties (--color-*) or semantic Tailwind classes that reference design tokens (bg-bg-*, text-fg-*, border-border-*, etc.).
Table: file path | count | example classes used

### Report B: Raw Tailwind Color Classes (Needs Migration)
List all files with hardcoded Tailwind color classes:
- bg-zinc-*, bg-blue-*, bg-green-*, bg-red-*, bg-orange-*, bg-yellow-*, etc.
- text-zinc-*, text-blue-*, text-neutral-*, text-gray-*, etc.
- border-zinc-*, border-gray-*, ring-blue-*, etc.
- Include ALL dark: prefixed color variants (dark:bg-zinc-*, dark:text-neutral-*, etc.)
- Include ALL hover:/focus:/active:/disabled: prefixed color variants

Table: file path | raw color count | dark: count | state-prefixed count | unique classes list

### Report C: Inline & JS Color Values (Needs Migration)
List all files with hardcoded color values:
- Hex codes in style attributes (#3b82f6, #fff, etc.)
- rgb(), rgba(), hsl() in styles or JS
- Tailwind color palette imports (from 'tailwindcss/colors')
- Color values in JS/TS variables or constants

Table: file path | count | the actual values found

### Summary
- Total files needing migration
- Estimated total replacements needed
- Breakdown by feature area:
  - Dashboard / task list
  - Task detail
  - Focus mode
  - AI components (MiniBar, Palette, Drawer)
  - Layout / chrome (nav, headers, sidebars)
  - Modals / sheets
  - Other
- Top 10 most-used raw color classes (helps identify what semantic tokens are missing)
```

---

## Prompt 3: Component Extraction Status

**Output file:** `docs/audits/03-component-status.md`

```
Compare extracted design system components vs the rest of the codebase. Write results to docs/audits/03-component-status.md.

DO NOT make any code changes — read-only audit.

### Part 1: Extracted Components (Design System)
List all components in the shared/design-system directory (wherever ActionableCard, Pill, ProgressRing, ToastItem, BottomSheet, etc. live).

For each:
| Component | File path | Uses only semantic tokens? | Raw color count | Notes |

### Part 2: Non-Extracted Components
List all other .tsx component files NOT in the design system directory.

For each:
| Component | File path | Has color styling? | Raw color count | Migration difficulty | Notes |

Migration difficulty ratings:
- **Easy** (< 5 raw color replacements, straightforward mapping)
- **Medium** (5-20 replacements, or some conditional color logic)
- **Hard** (20+ replacements, dynamic color mapping, or tightly coupled logic)

### Part 3: Color Mapping Objects
Find any objects, functions, or constants that MAP data to colors. Examples:
- Status → color maps (e.g., "completed" → "green-500")
- Energy level → color maps
- Priority → color maps
- Category → color maps
- Any switch/case or ternary that selects colors based on data

For each:
| Location | What it maps | Current color values | Semantic token candidate |

These are high-value migration targets because centralizing them means many components get themed at once.

### Summary
- Count of fully-semantic components vs needs-migration
- Suggested migration order (easy wins first, then by feature importance)
- List of color mapping objects that should become token-based
```

---

## Prompt 4: Interactive State Patterns

**Output file:** `docs/audits/04-interactive-states.md`

```
Audit how interactive states (hover, focus, active, disabled) handle color. Write results to docs/audits/04-interactive-states.md.

DO NOT make any code changes — read-only audit.

### Hover States
Find all hover: prefixed color classes.
Table: file | class (e.g., hover:bg-zinc-700) | semantic or raw? | current value

### Focus / Focus-Visible States
Find all focus: and focus-visible: prefixed color classes, plus ring-* and outline-* color classes.
Table: file | class | semantic or raw? | current value

### Active States
Find all active: prefixed color classes.
Table: file | class | semantic or raw? | current value

### Disabled States
Find all disabled: prefixed color classes or opacity patterns for disabled elements.
Table: file | class | semantic or raw? | current value

### Summary
| State type | Total usages | Semantic count | Raw count | Opacity/relative count |
|------------|-------------|----------------|-----------|----------------------|
| hover      |             |                |           |                      |
| focus      |             |                |           |                      |
| active     |             |                |           |                      |
| disabled   |             |                |           |                      |

Analysis:
- Are interactive states mostly handled via opacity/brightness modifiers (theme-safe) or hardcoded colors (needs tokens)?
- Recommend: which interactive state tokens should be created?
- List the specific tokens you'd recommend adding (e.g., --color-bg-primary-hover)
```

---

## Prompt 5: Edge Case Color Usage

**Output file:** `docs/audits/05-edge-case-colors.md`

```
Quick audit of non-obvious color usage. Write results to docs/audits/05-edge-case-colors.md.

DO NOT make any code changes — read-only audit.

Check each category and report findings:

### 1. Box Shadows
List all box-shadow declarations. Note which use hardcoded colors vs CSS vars vs Tailwind shadow utilities.

### 2. Overlays & Backdrops
Find: bg-black/*, bg-white/*, bg-opacity-*, any rgba() overlays, backdrop-blur with color tints.

### 3. SVG Colors
Find hardcoded fill= or stroke= attributes, or className with fill-* / stroke-* Tailwind classes.

### 4. Pseudo-element Styles
Find ::selection, ::placeholder, ::-webkit-scrollbar color styling.

### 5. Framer Motion Color Animations
Find any framer-motion animate/variants/transition configs that include color properties (backgroundColor, color, borderColor, etc.)

### 6. Dynamic/Conditional Color Logic
Find ternary expressions, switch/case, or function calls that compute or select colors at runtime. This overlaps with Prompt 3's color mapping objects but focuses on inline conditional logic in JSX.

### Summary Table
| Category | Count | Hardcoded | Tokenized | Action needed? |
|----------|-------|-----------|-----------|---------------|
| Shadows  |       |           |           |               |
| Overlays |       |           |           |               |
| SVGs     |       |           |           |               |
| Pseudo   |       |           |           |               |
| Framer   |       |           |           |               |
| Dynamic  |       |           |           |               |

For each category, note whether it should be in-scope for Phase 1 migration or deferred.
```

---

## Prompt 6: Typography Audit

**Output file:** `docs/audits/06-typography.md`

```
Quick audit of font/typography configuration. Write results to docs/audits/06-typography.md.

DO NOT make any code changes — read-only audit.

1. **Font Loading**
   - How are fonts loaded? (next/font, @font-face, Google Fonts link, system fonts?)
   - What font families are loaded?
   - Where is the font applied globally? (layout.tsx className, CSS, Tailwind config?)

2. **Font Family Usage**
   - Is there a single primary font or multiple? (e.g., sans for body, mono for code)
   - Are font families referenced via Tailwind class (font-sans), CSS variable, or hardcoded font-family?
   - List any hardcoded font-family declarations outside the Tailwind config.

3. **Typography Scale**
   - Is the type scale customized in Tailwind config or using defaults?
   - Any custom text-* utilities defined?

4. **Recommendation**
   - How easy would it be to add a --font-family-primary CSS variable?
   - What would need to change?
```

---

## After Running All Prompts

Upload the generated audit files here and I'll synthesize findings into:
1. Refined migration plan with accurate scope/effort estimates
2. Specific semantic tokens to add
3. Updated Claude Code prompts for the actual migration work
4. Any architectural decisions that need revisiting based on what we find
