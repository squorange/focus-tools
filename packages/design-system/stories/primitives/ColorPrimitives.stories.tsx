import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Primitives/Colors',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Color Primitive Tokens

Raw color values that serve as the foundation for all semantic color tokens in the design system.

## What are Color Primitives?

Color primitives are the lowest-level color tokens in our system. They represent the actual color values (hex codes) that are used throughout the design. These primitives are referenced by semantic color tokens to create a consistent, themeable color system.

**Important**: In most cases, you should use semantic color tokens (like \`bg-bg-alert-subtle\`) instead of primitives. Only use primitive tokens when:
- Creating new semantic color tokens
- Handling edge cases not covered by semantic tokens
- Building foundation-level components or themes

## Color Primitive Categories

Our color primitives are organized into base scales:

### Base Color Scales
- **Zinc**: Neutral gray scale for UI elements, text, backgrounds
- **Violet**: Primary brand color for accents and interactive elements
- **Green**: Success, completion, positive states
- **Red**: Errors, alerts, destructive actions
- **Amber**: Warnings, inbox status
- **Orange**: Waiting states
- **Blue**: Ready status, information
- **Indigo**: Deferred status

## Naming Convention

Primitive colors follow a numeric scale (50-950):
- **50-100**: Very light tints (subtle backgrounds)
- **200-300**: Light tones (hover states, borders)
- **400-500**: Medium tones (icons, secondary text)
- **600-700**: Dark tones (primary elements)
- **800-950**: Very dark shades (text, dark mode)

Higher numbers = darker colors

## Usage

\`\`\`tsx
// ❌ Avoid using primitives directly in components
<div style={{ backgroundColor: '#f5f3ff' }}>Content</div>

// ❌ Also avoid primitive token classes
<div className="bg-violet-50">Content</div>

// ✅ Use semantic color tokens instead
<div className="bg-bg-accent-subtle">Content</div>
\`\`\`

## Design Principles

- **Consistent Scale**: All color scales follow the same numeric progression
- **Optical Balance**: Values are adjusted for perceived brightness
- **Accessibility**: Scales provide enough contrast options for WCAG compliance
- **Themeability**: Primitive values can be swapped to create themes
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// Color swatch component
const ColorSwatch = ({
  name,
  value,
  isDark = false,
}: {
  name: string;
  value: string;
  isDark?: boolean;
}) => (
  <div className="flex flex-col gap-2">
    <div
      className="w-full h-16 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm"
      style={{ backgroundColor: value }}
    />
    <div className="flex flex-col">
      <span className={`text-xs font-semibold font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        {name}
      </span>
      <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
        {value}
      </span>
    </div>
  </div>
);

export const ZincScale: Story = {
  render: () => (
    <div className="p-8 space-y-6 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Zinc Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Primary neutral scale for UI elements, text, backgrounds, and borders
        </p>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <ColorSwatch name="zinc-50" value="#fafafa" />
        <ColorSwatch name="zinc-100" value="#f4f4f5" />
        <ColorSwatch name="zinc-200" value="#e4e4e7" />
        <ColorSwatch name="zinc-300" value="#d4d4d8" />
        <ColorSwatch name="zinc-400" value="#a1a1aa" />
        <ColorSwatch name="zinc-500" value="#71717a" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        <ColorSwatch name="zinc-600" value="#52525b" />
        <ColorSwatch name="zinc-700" value="#3f3f46" />
        <ColorSwatch name="zinc-800" value="#27272a" />
        <ColorSwatch name="zinc-900" value="#18181b" />
        <ColorSwatch name="zinc-950" value="#09090b" />
      </div>

      <div className="p-6 bg-bg-information-subtle border-l-4 border-bg-information-high rounded">
        <h3 className="text-lg font-semibold mb-3 text-fg-information-primary">Zinc Scale Usage</h3>
        <p className="text-sm text-fg-information-secondary">
          Zinc is the workhorse of the design system. It's used for neutral UI elements, text,
          backgrounds, and borders. The scale provides enough variety to create clear visual
          hierarchy while maintaining a cohesive look.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Neutral zinc scale from light (50) to dark (950).',
      },
    },
  },
};

export const BrandColors: Story = {
  render: () => (
    <div className="p-8 space-y-12 bg-bg-neutral-base">
      {/* Violet */}
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Violet Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Primary brand color for accents, interactive elements, and focus states
        </p>
        <div className="grid grid-cols-6 gap-4">
          <ColorSwatch name="violet-50" value="#f5f3ff" />
          <ColorSwatch name="violet-100" value="#ede9fe" />
          <ColorSwatch name="violet-200" value="#ddd6fe" />
          <ColorSwatch name="violet-300" value="#c4b5fd" />
          <ColorSwatch name="violet-400" value="#a78bfa" />
          <ColorSwatch name="violet-500" value="#8b5cf6" />
        </div>
        <div className="grid grid-cols-5 gap-4 mt-4">
          <ColorSwatch name="violet-600" value="#7c3aed" />
          <ColorSwatch name="violet-700" value="#6d28d9" />
          <ColorSwatch name="violet-800" value="#5b21b6" />
          <ColorSwatch name="violet-900" value="#4c1d95" />
          <ColorSwatch name="violet-950" value="#2e1065" />
        </div>
      </div>

      {/* Green */}
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Green Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Success, completion, and positive states
        </p>
        <div className="grid grid-cols-6 gap-4">
          <ColorSwatch name="green-50" value="#f0fdf4" />
          <ColorSwatch name="green-100" value="#dcfce7" />
          <ColorSwatch name="green-200" value="#bbf7d0" />
          <ColorSwatch name="green-300" value="#86efac" />
          <ColorSwatch name="green-400" value="#4ade80" />
          <ColorSwatch name="green-500" value="#22c55e" />
        </div>
        <div className="grid grid-cols-5 gap-4 mt-4">
          <ColorSwatch name="green-600" value="#16a34a" />
          <ColorSwatch name="green-700" value="#15803d" />
          <ColorSwatch name="green-800" value="#166534" />
          <ColorSwatch name="green-900" value="#14532d" />
          <ColorSwatch name="green-950" value="#052e16" />
        </div>
      </div>

      {/* Red */}
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Red Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Errors, alerts, and destructive actions
        </p>
        <div className="grid grid-cols-6 gap-4">
          <ColorSwatch name="red-50" value="#fef2f2" />
          <ColorSwatch name="red-100" value="#fee2e2" />
          <ColorSwatch name="red-200" value="#fecaca" />
          <ColorSwatch name="red-300" value="#fca5a5" />
          <ColorSwatch name="red-400" value="#f87171" />
          <ColorSwatch name="red-500" value="#ef4444" />
        </div>
        <div className="grid grid-cols-5 gap-4 mt-4">
          <ColorSwatch name="red-600" value="#dc2626" />
          <ColorSwatch name="red-700" value="#b91c1c" />
          <ColorSwatch name="red-800" value="#991b1b" />
          <ColorSwatch name="red-900" value="#7f1d1d" />
          <ColorSwatch name="red-950" value="#450a0a" />
        </div>
      </div>

      {/* Amber */}
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Amber Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Warnings, cautions, and inbox status
        </p>
        <div className="grid grid-cols-6 gap-4">
          <ColorSwatch name="amber-50" value="#fffbeb" />
          <ColorSwatch name="amber-100" value="#fef3c7" />
          <ColorSwatch name="amber-200" value="#fde68a" />
          <ColorSwatch name="amber-300" value="#fcd34d" />
          <ColorSwatch name="amber-400" value="#fbbf24" />
          <ColorSwatch name="amber-500" value="#f59e0b" />
        </div>
        <div className="grid grid-cols-5 gap-4 mt-4">
          <ColorSwatch name="amber-600" value="#d97706" />
          <ColorSwatch name="amber-700" value="#b45309" />
          <ColorSwatch name="amber-800" value="#92400e" />
          <ColorSwatch name="amber-900" value="#78350f" />
          <ColorSwatch name="amber-950" value="#451a03" />
        </div>
      </div>

      {/* Blue */}
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Blue Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Ready status, information, and links
        </p>
        <div className="grid grid-cols-6 gap-4">
          <ColorSwatch name="blue-50" value="#eff6ff" />
          <ColorSwatch name="blue-100" value="#dbeafe" />
          <ColorSwatch name="blue-200" value="#bfdbfe" />
          <ColorSwatch name="blue-300" value="#93c5fd" />
          <ColorSwatch name="blue-400" value="#60a5fa" />
          <ColorSwatch name="blue-500" value="#3b82f6" />
        </div>
        <div className="grid grid-cols-5 gap-4 mt-4">
          <ColorSwatch name="blue-600" value="#2563eb" />
          <ColorSwatch name="blue-700" value="#1d4ed8" />
          <ColorSwatch name="blue-800" value="#1e40af" />
          <ColorSwatch name="blue-900" value="#1e3a8a" />
          <ColorSwatch name="blue-950" value="#172554" />
        </div>
      </div>

      {/* Orange */}
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Orange Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">Waiting states</p>
        <div className="grid grid-cols-6 gap-4">
          <ColorSwatch name="orange-50" value="#fff7ed" />
          <ColorSwatch name="orange-100" value="#ffedd5" />
          <ColorSwatch name="orange-200" value="#fed7aa" />
          <ColorSwatch name="orange-300" value="#fdba74" />
          <ColorSwatch name="orange-400" value="#fb923c" />
          <ColorSwatch name="orange-500" value="#f97316" />
        </div>
        <div className="grid grid-cols-5 gap-4 mt-4">
          <ColorSwatch name="orange-600" value="#ea580c" />
          <ColorSwatch name="orange-700" value="#c2410c" />
          <ColorSwatch name="orange-800" value="#9a3412" />
          <ColorSwatch name="orange-900" value="#7c2d12" />
          <ColorSwatch name="orange-950" value="#431407" />
        </div>
      </div>

      {/* Indigo */}
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Indigo Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">Deferred status</p>
        <div className="grid grid-cols-6 gap-4">
          <ColorSwatch name="indigo-50" value="#eef2ff" />
          <ColorSwatch name="indigo-100" value="#e0e7ff" />
          <ColorSwatch name="indigo-200" value="#c7d2fe" />
          <ColorSwatch name="indigo-300" value="#a5b4fc" />
          <ColorSwatch name="indigo-400" value="#818cf8" />
          <ColorSwatch name="indigo-500" value="#6366f1" />
        </div>
        <div className="grid grid-cols-5 gap-4 mt-4">
          <ColorSwatch name="indigo-600" value="#4f46e5" />
          <ColorSwatch name="indigo-700" value="#4338ca" />
          <ColorSwatch name="indigo-800" value="#3730a3" />
          <ColorSwatch name="indigo-900" value="#312e81" />
          <ColorSwatch name="indigo-950" value="#1e1b4b" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Brand color scales for semantic use cases.',
      },
    },
  },
};

export const AlphaColors: Story = {
  render: () => (
    <div className="p-8 space-y-12 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Black Alpha Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Transparent black for overlays, shadows, and darkening effects on light backgrounds
        </p>
        <div className="grid grid-cols-5 gap-4">
          {[
            { name: 'black/5', value: 'rgba(0,0,0,0.05)', opacity: '5%' },
            { name: 'black/10', value: 'rgba(0,0,0,0.10)', opacity: '10%' },
            { name: 'black/20', value: 'rgba(0,0,0,0.20)', opacity: '20%' },
            { name: 'black/30', value: 'rgba(0,0,0,0.30)', opacity: '30%' },
            { name: 'black/40', value: 'rgba(0,0,0,0.40)', opacity: '40%' },
          ].map((color) => (
            <div key={color.name} className="space-y-2">
              <div className="relative h-16 bg-gradient-to-br from-violet-400 to-blue-400 rounded-lg overflow-hidden border border-zinc-200">
                <div style={{ backgroundColor: color.value }} className="absolute inset-0" />
              </div>
              <div className="text-xs font-semibold text-zinc-900 font-mono">{color.name}</div>
              <div className="text-[10px] text-zinc-600 font-mono">{color.opacity}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4 mt-4">
          {[
            { name: 'black/50', value: 'rgba(0,0,0,0.50)', opacity: '50%' },
            { name: 'black/60', value: 'rgba(0,0,0,0.60)', opacity: '60%' },
            { name: 'black/70', value: 'rgba(0,0,0,0.70)', opacity: '70%' },
            { name: 'black/80', value: 'rgba(0,0,0,0.80)', opacity: '80%' },
            { name: 'black/90', value: 'rgba(0,0,0,0.90)', opacity: '90%' },
          ].map((color) => (
            <div key={color.name} className="space-y-2">
              <div className="relative h-16 bg-gradient-to-br from-violet-400 to-blue-400 rounded-lg overflow-hidden border border-zinc-200">
                <div style={{ backgroundColor: color.value }} className="absolute inset-0" />
              </div>
              <div className="text-xs font-semibold text-zinc-900 font-mono">{color.name}</div>
              <div className="text-[10px] text-zinc-600 font-mono">{color.opacity}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">White Alpha Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Transparent white for overlays, highlights, and lightening effects on dark backgrounds
        </p>
        <div className="grid grid-cols-5 gap-4">
          {[
            { name: 'white/10', value: 'rgba(255,255,255,0.10)', opacity: '10%' },
            { name: 'white/20', value: 'rgba(255,255,255,0.20)', opacity: '20%' },
            { name: 'white/30', value: 'rgba(255,255,255,0.30)', opacity: '30%' },
            { name: 'white/40', value: 'rgba(255,255,255,0.40)', opacity: '40%' },
            { name: 'white/50', value: 'rgba(255,255,255,0.50)', opacity: '50%' },
          ].map((color) => (
            <div key={color.name} className="space-y-2">
              <div className="relative h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg overflow-hidden border border-zinc-600">
                <div style={{ backgroundColor: color.value }} className="absolute inset-0" />
              </div>
              <div className="text-xs font-semibold text-zinc-900 font-mono">{color.name}</div>
              <div className="text-[10px] text-zinc-600 font-mono">{color.opacity}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4 mt-4">
          {[
            { name: 'white/60', value: 'rgba(255,255,255,0.60)', opacity: '60%' },
            { name: 'white/70', value: 'rgba(255,255,255,0.70)', opacity: '70%' },
            { name: 'white/80', value: 'rgba(255,255,255,0.80)', opacity: '80%' },
            { name: 'white/90', value: 'rgba(255,255,255,0.90)', opacity: '90%' },
            { name: 'white/95', value: 'rgba(255,255,255,0.95)', opacity: '95%' },
          ].map((color) => (
            <div key={color.name} className="space-y-2">
              <div className="relative h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg overflow-hidden border border-zinc-600">
                <div style={{ backgroundColor: color.value }} className="absolute inset-0" />
              </div>
              <div className="text-xs font-semibold text-zinc-900 font-mono">{color.name}</div>
              <div className="text-[10px] text-zinc-600 font-mono">{color.opacity}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-bg-accent-subtle border-l-4 border-bg-accent-high rounded">
        <h3 className="text-lg font-semibold mb-3 text-fg-accent-primary">Alpha Color Usage</h3>
        <ul className="space-y-2 text-sm text-fg-accent-secondary">
          <li>
            <strong>Black Alpha</strong>: Use for overlays, shadows, and darkening effects on light
            backgrounds
          </li>
          <li>
            <strong>White Alpha</strong>: Use for highlights, glass effects, and lightening on dark
            backgrounds
          </li>
          <li>Alpha colors preserve the background while adding tint</li>
          <li>Useful for creating depth without fully obscuring content</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Transparent black and white overlays for layering effects.',
      },
    },
  },
};

export const SemanticMapping: Story = {
  render: () => (
    <div className="p-8 bg-bg-neutral-base">
      <h2 className="text-2xl font-bold mb-6 text-fg-neutral-primary">
        How Primitives Map to Semantic Tokens
      </h2>
      <p className="text-sm text-fg-neutral-secondary mb-8">
        Examples showing how primitive colors are referenced by semantic color tokens.
      </p>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Alert/Error Colors</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-bg-neutral-subtle rounded border border-border-color-neutral">
              <div className="w-12 h-12 rounded bg-bg-alert-subtle border border-border-color-neutral" />
              <div>
                <div className="text-sm font-mono text-fg-neutral-primary">bg-bg-alert-subtle</div>
                <div className="text-xs text-fg-neutral-secondary">uses red-50 (#fef2f2)</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-bg-neutral-subtle rounded border border-border-color-neutral">
              <div className="w-12 h-12 rounded bg-bg-alert-high" />
              <div>
                <div className="text-sm font-mono text-fg-neutral-primary">bg-bg-alert-high</div>
                <div className="text-xs text-fg-neutral-secondary">uses red-600 (#dc2626)</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">
            Positive/Success Colors
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-bg-neutral-subtle rounded border border-border-color-neutral">
              <div className="w-12 h-12 rounded bg-bg-positive-subtle border border-border-color-neutral" />
              <div>
                <div className="text-sm font-mono text-fg-neutral-primary">bg-bg-positive-subtle</div>
                <div className="text-xs text-fg-neutral-secondary">uses green-100 (#dcfce7)</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-bg-neutral-subtle rounded border border-border-color-neutral">
              <div className="w-12 h-12 rounded bg-bg-positive-high" />
              <div>
                <div className="text-sm font-mono text-fg-neutral-primary">bg-bg-positive-high</div>
                <div className="text-xs text-fg-neutral-secondary">uses green-600 (#16a34a)</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Accent Colors</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-bg-neutral-subtle rounded border border-border-color-neutral">
              <div className="w-12 h-12 rounded bg-bg-accent-subtle border border-border-color-neutral" />
              <div>
                <div className="text-sm font-mono text-fg-neutral-primary">bg-bg-accent-subtle</div>
                <div className="text-xs text-fg-neutral-secondary">uses violet-100 (#ede9fe)</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-bg-neutral-subtle rounded border border-border-color-neutral">
              <div className="w-12 h-12 rounded bg-bg-accent-high" />
              <div>
                <div className="text-sm font-mono text-fg-neutral-primary">bg-bg-accent-high</div>
                <div className="text-xs text-fg-neutral-secondary">uses violet-600 (#7c3aed)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-bg-information-subtle border-l-4 border-bg-information-high rounded">
        <h3 className="text-lg font-semibold mb-3 text-fg-information-primary">
          Color Token Architecture
        </h3>
        <p className="text-sm text-fg-information-secondary mb-3">
          Our color system follows a two-tier architecture:
        </p>
        <ol className="space-y-2 text-sm text-fg-information-secondary list-decimal list-inside">
          <li>
            <strong>Primitives</strong> - Raw hex values (this page)
          </li>
          <li>
            <strong>Semantic Tokens</strong> - Purpose-driven tokens that reference primitives (like
            bg-bg-alert-subtle)
          </li>
        </ol>
        <p className="text-sm text-fg-information-secondary mt-3">
          This separation allows us to update the entire color system by changing primitive values,
          and themes can be created by swapping primitive palettes.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how primitive colors are referenced by higher-level semantic color tokens.',
      },
    },
  },
};
