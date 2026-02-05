import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Semantics/Glass Effects',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Glass Effects

Glassmorphic UI effects for translucent, blurred backgrounds.

## Glass Variants

| Variant | Use Case |
|---------|----------|
| **floating** | Tooltips, popovers |
| **floatingPanel** | Modals, drawers, sheets |
| **secondary** | Cards, sections |
| **secondaryHover** | Hover state for secondary |
| **ghost** | Minimal surfaces |
| **ghostHover** | Hover state for ghost |
| **button** | Glass buttons |
| **buttonHover** | Hover state for buttons |
| **buttonActive** | Active/pressed buttons |

---

## Usage

\`\`\`tsx
import { glass, glassDark, getGlassStyle } from '@focus-tools/design-system/foundations';

// With inline styles
<div style={getGlassStyle('floatingPanel')}>
  Modal content
</div>

// With Tailwind classes
<div className="bg-bg-glass-floating-panel backdrop-blur-lg border border-border-color-glass-floating-panel">
  Floating panel
</div>
\`\`\`

## Design Principles

- Glass effects work best over colorful or image backgrounds
- Always include backdrop-blur for the glass effect
- Use borders to define edges on translucent surfaces
- Provide light and dark mode variants
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// Sample background for glass demos
const GlassBackground = ({ children }: { children: React.ReactNode }) => (
  <div
    className="relative p-8 rounded-xl overflow-hidden"
    style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    }}
  >
    {/* Decorative circles */}
    <div
      className="absolute w-32 h-32 rounded-full opacity-50"
      style={{ background: '#fff', top: '20%', left: '10%', filter: 'blur(40px)' }}
    />
    <div
      className="absolute w-48 h-48 rounded-full opacity-30"
      style={{ background: '#ffd700', bottom: '10%', right: '5%', filter: 'blur(60px)' }}
    />
    <div className="relative z-10">{children}</div>
  </div>
);

// Dark background variant
const DarkGlassBackground = ({ children }: { children: React.ReactNode }) => (
  <div
    className="relative p-8 rounded-xl overflow-hidden"
    style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}
  >
    <div
      className="absolute w-32 h-32 rounded-full opacity-30"
      style={{ background: '#7c3aed', top: '20%', left: '10%', filter: 'blur(40px)' }}
    />
    <div
      className="absolute w-48 h-48 rounded-full opacity-20"
      style={{ background: '#22c55e', bottom: '10%', right: '5%', filter: 'blur(60px)' }}
    />
    <div className="relative z-10">{children}</div>
  </div>
);

export const GlassVariants: Story = {
  render: () => (
    <div className="p-8 space-y-12 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Glass Variants</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          All glass effect variants on a colorful background
        </p>
      </div>

      <GlassBackground>
        <div className="grid grid-cols-2 gap-6">
          {/* Floating */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <div className="font-semibold text-zinc-900 mb-1">Floating</div>
            <div className="text-sm text-zinc-600">Tooltips, popovers</div>
            <code className="text-xs text-zinc-500 mt-2 block">glass.floating</code>
          </div>

          {/* Floating Panel */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            }}
          >
            <div className="font-semibold text-zinc-900 mb-1">Floating Panel</div>
            <div className="text-sm text-zinc-600">Modals, drawers, sheets</div>
            <code className="text-xs text-zinc-500 mt-2 block">glass.floatingPanel</code>
          </div>

          {/* Secondary */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 0, 0, 0.04)',
            }}
          >
            <div className="font-semibold text-white mb-1">Secondary</div>
            <div className="text-sm text-white/80">Cards, sections</div>
            <code className="text-xs text-white/60 mt-2 block">glass.secondary</code>
          </div>

          {/* Ghost */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.04)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="font-semibold text-white mb-1">Ghost</div>
            <div className="text-sm text-white/80">Minimal surfaces</div>
            <code className="text-xs text-white/60 mt-2 block">glass.ghost</code>
          </div>

          {/* Button */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <div className="font-semibold text-zinc-900 mb-1">Button</div>
            <div className="text-sm text-zinc-600">Glass buttons (default)</div>
            <code className="text-xs text-zinc-500 mt-2 block">glass.button</code>
          </div>

          {/* Button Hover */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <div className="font-semibold text-zinc-900 mb-1">Button Hover</div>
            <div className="text-sm text-zinc-600">Glass buttons (hovered)</div>
            <code className="text-xs text-zinc-500 mt-2 block">glass.buttonHover</code>
          </div>
        </div>
      </GlassBackground>
    </div>
  ),
};

export const LightVsDark: Story = {
  render: () => (
    <div className="p-8 space-y-12 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Light vs Dark Mode</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Glass effects adapt to light and dark themes
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Light Mode */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Light Mode</h3>
          <GlassBackground>
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                }}
              >
                <div className="font-semibold text-zinc-900">Glass Panel</div>
                <div className="text-sm text-zinc-600">Light mode variant</div>
              </div>
              <button
                className="px-4 py-2 rounded-lg font-medium text-zinc-900"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                Glass Button
              </button>
            </div>
          </GlassBackground>
        </div>

        {/* Dark Mode */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Dark Mode</h3>
          <DarkGlassBackground>
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: 'rgba(24, 24, 27, 0.92)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.32)',
                }}
              >
                <div className="font-semibold text-white">Glass Panel</div>
                <div className="text-sm text-zinc-400">Dark mode variant</div>
              </div>
              <button
                className="px-4 py-2 rounded-lg font-medium text-white"
                style={{
                  backgroundColor: 'rgba(39, 39, 42, 0.7)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                Glass Button
              </button>
            </div>
          </DarkGlassBackground>
        </div>
      </div>
    </div>
  ),
};

export const InteractiveGlass: Story = {
  render: () => {
    const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

    return (
      <div className="p-8 space-y-12 bg-bg-neutral-base">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">
            Interactive Glass Elements
          </h2>
          <p className="text-sm text-fg-neutral-secondary mb-6">
            Hover states for glass buttons
          </p>
        </div>

        <GlassBackground>
          <div className="flex gap-4">
            <button
              className="px-6 py-3 rounded-lg font-medium text-zinc-900 transition-all"
              style={{
                backgroundColor:
                  hoveredButton === 'primary'
                    ? 'rgba(255, 255, 255, 0.85)'
                    : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
              }}
              onMouseEnter={() => setHoveredButton('primary')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Primary Action
            </button>

            <button
              className="px-6 py-3 rounded-lg font-medium transition-all"
              style={{
                backgroundColor:
                  hoveredButton === 'secondary'
                    ? 'rgba(128, 128, 128, 0.14)'
                    : 'rgba(128, 128, 128, 0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                color: 'white',
              }}
              onMouseEnter={() => setHoveredButton('secondary')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Secondary Action
            </button>

            <button
              className="px-6 py-3 rounded-lg font-medium transition-all"
              style={{
                backgroundColor:
                  hoveredButton === 'ghost'
                    ? 'rgba(128, 128, 128, 0.10)'
                    : 'rgba(128, 128, 128, 0.04)',
                backdropFilter: 'blur(4px)',
                color: 'white',
              }}
              onMouseEnter={() => setHoveredButton('ghost')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Ghost Action
            </button>
          </div>
        </GlassBackground>

        <div className="p-6 bg-bg-neutral-subtle rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">Implementation</h3>
          <p className="text-sm text-fg-neutral-secondary mb-3">
            Use the <code className="bg-bg-neutral-low px-1 rounded">getGlassInteractive()</code>{' '}
            utility:
          </p>
          <pre className="text-xs bg-bg-neutral-low p-3 rounded overflow-x-auto">
            {`import { getGlassInteractive } from '@focus-tools/design-system/foundations';

const { base, hover } = getGlassInteractive('button');

// Apply base style by default
// Apply hover style on :hover`}
          </pre>
        </div>
      </div>
    );
  },
};

export const RealWorldExamples: Story = {
  render: () => (
    <div className="p-8 space-y-12 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Real-World Examples</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Common UI patterns using glass effects
        </p>
      </div>

      {/* Modal Dialog */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Modal Dialog</h3>
        <GlassBackground>
          <div
            className="max-w-md mx-auto p-6 rounded-xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            }}
          >
            <h4 className="text-xl font-bold text-zinc-900 mb-2">Confirm Action</h4>
            <p className="text-zinc-600 mb-6">
              Are you sure you want to proceed? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg text-zinc-700"
                style={{
                  backgroundColor: 'rgba(128, 128, 128, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                Cancel
              </button>
              <button className="px-4 py-2 rounded-lg bg-violet-600 text-white">Confirm</button>
            </div>
          </div>
        </GlassBackground>
      </div>

      {/* Floating Toolbar */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Floating Toolbar</h3>
        <GlassBackground>
          <div
            className="inline-flex items-center gap-1 p-2 rounded-full"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            {['B', 'I', 'U', 'S'].map((icon) => (
              <button
                key={icon}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-700 hover:bg-zinc-200/50 transition-colors"
              >
                {icon}
              </button>
            ))}
            <div className="w-px h-6 bg-zinc-300 mx-1" />
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-700 hover:bg-zinc-200/50 transition-colors">
              +
            </button>
          </div>
        </GlassBackground>
      </div>

      {/* Card with Glass Effect */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Glass Card</h3>
        <GlassBackground>
          <div
            className="max-w-sm p-6 rounded-xl"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="text-white/80 text-xs uppercase tracking-wide mb-2">Now Playing</div>
            <div className="text-white text-xl font-bold mb-1">Glass Morphism</div>
            <div className="text-white/60 text-sm mb-4">Design System Album</div>
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-violet-600">
                ▶
              </button>
              <div className="flex-1 h-1 bg-white/20 rounded-full">
                <div className="w-1/3 h-full bg-white rounded-full" />
              </div>
            </div>
          </div>
        </GlassBackground>
      </div>
    </div>
  ),
};
