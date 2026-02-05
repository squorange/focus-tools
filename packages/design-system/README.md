# Focus Tools Design System

A reusable design system package with tokens, components, and hooks for the Focus Tools ecosystem.

## Features

- **Design Tokens**: CSS custom properties and TypeScript constants for colors, spacing, typography, and animation
- **Primitive Components**: Pill, ProgressRing, SegmentedControl
- **Modal Components**: BottomSheet, RightDrawer, ResponsiveDrawer
- **Hooks**: useReducedMotion, useMediaQuery, useIsMobile, useDeviceType
- **Tailwind Preset**: Shared configuration for consumers
- **Storybook Documentation**: Interactive component documentation

## Installation

```bash
# From the monorepo root
cd packages/design-system
npm install
```

## Usage

### Import Styles

In your global CSS:

```css
/* Import tokens only */
@import "@focus-tools/design-system/styles/tokens.css";

/* Or import everything */
@import "@focus-tools/design-system/styles";
```

### Use Tailwind Preset

In `tailwind.config.js`:

```javascript
module.exports = {
  presets: [require("@focus-tools/design-system/tailwind.preset")],
  content: [
    // ... your content paths
    "../../packages/design-system/components/**/*.{js,ts,jsx,tsx}",
  ],
};
```

### Import Components

```tsx
import { Pill, ProgressRing, ResponsiveDrawer } from "@focus-tools/design-system/components";

function TaskItem({ task }) {
  return (
    <div className="flex items-center gap-2">
      <ProgressRing completed={task.completedSteps} total={task.totalSteps} />
      <span>{task.title}</span>
      <Pill variant="status-today">Today</Pill>
    </div>
  );
}
```

### Import Tokens

```tsx
import { SPRING_CONFIG, STATUS_COLORS, BREAKPOINTS } from "@focus-tools/design-system/tokens";

// Use in Framer Motion
<motion.div transition={SPRING_CONFIG.default}>...</motion.div>;
```

### Import Hooks

```tsx
import { useReducedMotion, useIsMobile } from "@focus-tools/design-system/hooks";

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  return (
    <motion.div transition={prefersReducedMotion ? { duration: 0 } : SPRING_CONFIG.default}>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </motion.div>
  );
}
```

## Development

### Run Storybook

```bash
npm run storybook
```

### Build Storybook

```bash
npm run build-storybook
```

### Run Tests

```bash
npm test
```

## Package Structure

```
packages/design-system/
├── .storybook/           # Storybook configuration
├── components/           # React components
│   ├── Pill/
│   ├── ProgressRing/
│   ├── SegmentedControl/
│   ├── BottomSheet/
│   ├── RightDrawer/
│   └── ResponsiveDrawer/
├── hooks/                # React hooks
│   ├── useReducedMotion.ts
│   └── useMediaQuery.ts
├── styles/               # CSS files
│   ├── tokens.css        # CSS custom properties
│   └── index.css         # Entry point
├── tokens/               # TypeScript token exports
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   ├── animation.ts
│   ├── breakpoints.ts
│   └── index.ts
├── tailwind.preset.js    # Tailwind configuration preset
├── package.json
└── tsconfig.json
```

## Design Tokens

### Colors

- **Primitive scales**: zinc, violet, green, red, amber, orange, blue, indigo
- **Semantic colors**: surface, text, border, primary, feedback
- **Status colors**: completed, today, focus, waiting, deferred, ready, inbox, archived
- **Health colors**: healthy, at-risk, critical
- **Priority colors**: high, medium, low

### Spacing

Based on a 4px grid: 0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 80

### Typography

- **Sizes**: xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px), 3xl (30px)
- **Weights**: normal (400), medium (500), semibold (600), bold (700)
- **Line heights**: tight (1.25), snug (1.375), normal (1.5), relaxed (1.625), loose (2)

### Animation

- **Durations**: instant (0ms), fast (150ms), normal (250ms), slow (350ms), slower (500ms)
- **Spring configs**: default, snappy, gentle, reduced (for accessibility)
- **Easings**: default, in, out, in-out, spring

### Breakpoints

- **mobile**: 640px
- **tablet**: 1024px
- **desktop**: 1280px

## Components

### Pill

A versatile badge/tag component for status indicators, labels, and interactive chips.

```tsx
<Pill variant="status-completed">Done</Pill>
<Pill variant="priority-high" icon="🔥">Urgent</Pill>
<Pill colorDot="#7c3aed">Project</Pill>
```

### ProgressRing

Circular progress indicator for task completion.

```tsx
<ProgressRing completed={3} total={5} />
<ProgressRing completed={5} total={5} isComplete />
<ProgressRing variant="dashed" />
```

### SegmentedControl

iOS-style single-select tabs.

```tsx
<SegmentedControl
  options={[
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
  ]}
  value={filter}
  onChange={setFilter}
/>
```

### BottomSheet / RightDrawer / ResponsiveDrawer

Modal components with animation and accessibility support.

```tsx
// Responsive (recommended)
<ResponsiveDrawer isOpen={isOpen} onClose={onClose}>
  <Content />
</ResponsiveDrawer>

// Mobile only
<BottomSheet isOpen={isOpen} onClose={onClose} height="70vh">
  <Content />
</BottomSheet>

// Desktop only
<RightDrawer isOpen={isOpen} onClose={onClose} width="400px">
  <Content />
</RightDrawer>
```

## Accessibility

- All components respect `prefers-reduced-motion`
- Semantic HTML and ARIA attributes
- Keyboard navigation support
- Color contrast meets WCAG guidelines
- Storybook includes a11y addon for testing

## Dark Mode

The design system uses `.dark` class toggle for dark mode. Tokens automatically adjust when the class is present.

```html
<html class="dark">
  <!-- Dark mode active -->
</html>
```

## Related Documentation

- [Task Co-Pilot CLAUDE.md](../../prototypes/task-copilot/CLAUDE.md) - Main app context
- [Feature Index](../../docs/features/INDEX.md) - All features
- [Principles](../../docs/PRINCIPLES.md) - Design guidelines
