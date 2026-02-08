# Typography Configuration Audit

**Date:** February 7, 2026
**Scope:** Font loading, font family usage, typography scale

---

## 1. Font Loading

### Summary by Prototype

| Prototype | Loading Method | Font Families | Global Application |
|-----------|---------------|---------------|-------------------|
| **task-copilot** | System fonts via CSS | System font stack | `body` selector in `globals.css` |
| **ai-minibar** | System fonts via CSS | System font stack | `body` selector in `globals.css` |
| **orbital-zen-next** | `next/font/local` | Geist Sans, Geist Mono | Body className via CSS variables |

### Detailed Analysis

#### task-copilot (`prototypes/task-copilot/`)
- **Loading Method:** No custom font loading. Uses system fonts only.
- **Global CSS (`app/globals.css` line 26):**
  ```css
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  ```
- **Layout (`app/layout.tsx`):** No font-related className on body (just `antialiased min-h-screen`)
- **No font files** bundled in this prototype

#### ai-minibar (`prototypes/ai-minibar/`)
- **Loading Method:** No custom font loading. Uses system fonts only.
- **Global CSS (`app/globals.css` line 18):**
  ```css
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  ```
- **Layout (`app/layout.tsx`):** No font-related className on body (just `antialiased bg-background text-foreground`)
- **Font files present but unused:** `app/fonts/GeistVF.woff`, `app/fonts/GeistMonoVF.woff`

#### orbital-zen-next (`prototypes/orbital-zen-next/`)
- **Loading Method:** `next/font/local` (self-hosted variable fonts)
- **Layout (`app/layout.tsx` lines 2-15):**
  ```tsx
  import localFont from 'next/font/local';

  const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
  });
  const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
  });
  ```
- **Body className:** `${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`
- **Global CSS (`app/globals.css` line 17):** Uses different font stack:
  ```css
  body {
    font-family: Arial, Helvetica, sans-serif;
  }
  ```
  **Note:** This overwrites the CSS variable approach - the Geist fonts are loaded but not applied because CSS hardcodes Arial.

---

## 2. Font Family Usage

### Primary vs Secondary Fonts

| Usage | Font Stack | Where Defined |
|-------|-----------|---------------|
| **Primary (body)** | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | `globals.css` body rule |
| **Mono (code)** | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace` | Design system only |

### Font Family Reference Methods

1. **Hardcoded CSS declarations** - Primary method across all prototypes
   - `prototypes/task-copilot/app/globals.css` line 26
   - `prototypes/ai-minibar/app/globals.css` line 18
   - `prototypes/orbital-zen-next/app/globals.css` line 17

2. **Design System TypeScript constants** (`packages/design-system/foundations/typography.ts`):
   ```ts
   export const fontFamily = {
     sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
     mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
   } as const;
   ```
   - Used in `textStyles.ts` for semantic text style definitions
   - **Not exposed as CSS variables**

3. **CSS Variables (orbital-zen-next only):**
   - `--font-geist-sans` - defined but not used (overwritten by CSS)
   - `--font-geist-mono` - defined but not used

### Hardcoded font-family Declarations (Outside Tailwind Config)

| File | Line | Font Stack |
|------|------|-----------|
| `prototypes/task-copilot/app/globals.css` | 26 | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |
| `prototypes/ai-minibar/app/globals.css` | 18 | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |
| `prototypes/orbital-zen-next/app/globals.css` | 17 | `Arial, Helvetica, sans-serif` |
| `packages/design-system/foundations/typography.ts` | 11 | TypeScript const (not CSS) |

### Tailwind fontFamily Configuration

**None of the Tailwind configs extend `fontFamily`.**

- `tailwind.preset.cjs` - No fontFamily extension
- `tailwind.config.ts` (all prototypes) - No fontFamily extension

Tailwind default `font-sans` class would use Tailwind's default sans stack, not the project's system font stack.

---

## 3. Typography Scale

### Tailwind Config Customization

The design system preset (`packages/design-system/tailwind.preset.cjs`) extends `fontSize` with CSS variable-based tokens:

```js
fontSize: {
  'ds-xs': 'var(--font-size-xs)',    // 0.75rem / 12px
  'ds-sm': 'var(--font-size-sm)',    // 0.875rem / 14px
  'ds-base': 'var(--font-size-base)', // 1rem / 16px
  'ds-lg': 'var(--font-size-lg)',    // 1.125rem / 18px
  'ds-xl': 'var(--font-size-xl)',    // 1.25rem / 20px
  'ds-2xl': 'var(--font-size-2xl)',  // 1.5rem / 24px
  'ds-3xl': 'var(--font-size-3xl)',  // 1.875rem / 30px
}
```

### CSS Variable Typography Tokens (`packages/design-system/styles/tokens.css`)

```css
:root {
  /* Font Sizes */
  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 1.875rem;   /* 30px */

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### Custom text-* Utilities

No custom `text-*` utilities defined outside Tailwind's defaults.

The only custom utility is in `orbital-zen-next/app/globals.css`:
```css
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

### Design System Text Styles (`packages/design-system/foundations/textStyles.ts`)

Comprehensive pre-composed text styles are defined in TypeScript:
- **Categories:** display, heading, title, body, label, eyebrow
- **Each includes:** fontSize (px), lineHeight (px), fontWeight, letterSpacing (px)
- **Not exposed as CSS classes** - JavaScript constants only

---

## 4. Recommendations

### Adding `--font-family-primary` CSS Variable

**Difficulty: Low**

The change is straightforward but requires updates across multiple files.

### What Would Need to Change

1. **Design System tokens.css** - Add font-family CSS variables:
   ```css
   :root {
     --font-family-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
     --font-family-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
   }
   ```

2. **Prototype globals.css files** - Replace hardcoded font-family with variable:
   ```css
   body {
     font-family: var(--font-family-sans);
   }
   ```
   Files to update:
   - `prototypes/task-copilot/app/globals.css`
   - `prototypes/ai-minibar/app/globals.css`
   - `prototypes/orbital-zen-next/app/globals.css`

3. **Tailwind preset** - Add fontFamily extension:
   ```js
   fontFamily: {
     sans: 'var(--font-family-sans)',
     mono: 'var(--font-family-mono)',
   }
   ```

4. **Align TypeScript constants** with CSS variables (optional but recommended):
   - Update `packages/design-system/foundations/typography.ts` to reference CSS variables or document the relationship

### Benefits of This Approach

1. **Single source of truth** for font family definitions
2. **Easier theming** - change font by updating one CSS variable
3. **Tailwind integration** - `font-sans` class would use project fonts
4. **Consistent with existing design system** pattern (other tokens use CSS variables)

### Additional Considerations

1. **orbital-zen-next inconsistency:** The Geist fonts are loaded via `next/font` but not applied. Either:
   - Remove the font loading code if system fonts are preferred
   - Update CSS to use `var(--font-geist-sans)` if custom fonts are desired

2. **ai-minibar orphaned fonts:** Font files exist in `app/fonts/` but are never loaded. Either:
   - Remove unused font files
   - Implement font loading if custom fonts are needed

3. **No fontFamily in Tailwind config:** Using `font-sans` Tailwind class currently applies Tailwind's default stack, not the project's. Adding fontFamily to the preset would unify this.

---

## Summary

| Aspect | Current State | Recommendation |
|--------|--------------|----------------|
| Font loading | Mixed (system fonts + unused Geist) | Standardize on one approach |
| Font family definition | Hardcoded in CSS | Centralize with CSS variable |
| Typography scale | Well-defined via CSS vars | Already good |
| Tailwind integration | No fontFamily extension | Add to preset |
